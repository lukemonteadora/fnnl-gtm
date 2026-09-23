// yaml-lite: a small, dependency-free YAML reader for the eval suite files (suite.yaml, cases*.yaml).
//
// Why it exists: this workspace has no YAML library installed (outbound/scripts/package.json holds jszip and
// pptxgenjs only), and the runner must stay plain node with no install step. Case files stay YAML, not JSON,
// because a case carries long pasted source text and a `|` block keeps it readable and diffable.
//
// Supported (the subset the eval files use):
//   - block mappings (`key: value`) and block sequences (`- item`, including `- key: value` maps)
//   - a sequence written at the same indent as its parent key (`key:` then `- a` on the next line)
//   - block scalars: `|` and `>`, with `-` or `+` chomping and an optional indentation digit
//   - flow sequences and maps (`[a, "b, c"]`, `{ metric: schema, fn: vocSchema }`), which may span lines
//   - double-quoted (with escapes), single-quoted ('' for a quote) and plain scalars, which may continue on
//     more-indented lines (folded with spaces, as YAML does)
//   - comments (a full line, or ` #` after a plain value), a leading `---`, a UTF-8 BOM, CRLF line endings
// Scalars resolve like YAML 1.2's core schema: true/false, null/~, integers and decimals become JS values;
// everything else stays a string. Unlike some YAML 1.1 readers, `yes`/`no` and dates such as 2026-09-24 stay
// strings, which is what case text and gold labels want.
// Not supported, and rejected with a line number rather than guessed: anchors (&), aliases (*), tags (!),
// several documents in one file, tabs in indentation, and duplicate keys.

'use strict';

class YamlLiteError extends Error {}

function parse(text, fileLabel = 'yaml') {
  const src = String(text).replace(/^\uFEFF/, '');
  const lines = src.split(/\r?\n/);
  let i = 0;

  const fail = (msg, lineIdx = i) => { throw new YamlLiteError(`${fileLabel}:${lineIdx + 1}: ${msg}`); };
  const indentOf = (line) => {
    const m = /^( *)/.exec(line);
    if (/^ *\t/.test(line)) fail('tab used for indentation (use spaces)');
    return m[1].length;
  };
  const isBlank = (line) => /^\s*$/.test(line) || /^\s*#/.test(line);

  // Skip blank and comment lines; return the index of the next meaningful line, or -1 at the end.
  function peek() {
    let j = i;
    while (j < lines.length && isBlank(lines[j])) j++;
    if (j < lines.length && /^\.\.\.\s*$/.test(lines[j])) return -1;
    if (j < lines.length && /^---(\s|$)/.test(lines[j])) {
      if (j === firstContent) { lines[j] = lines[j].replace(/^---\s*/, ''); if (isBlank(lines[j])) { i = j + 1; return peek(); } }
      else fail('several documents in one file are not supported', j);
    }
    return j < lines.length ? j : -1;
  }
  let firstContent = 0;
  while (firstContent < lines.length && isBlank(lines[firstContent])) firstContent++;

  // ── scalars ───────────────────────────────────────────────────────────────
  function resolvePlain(s) {
    const t = s.trim();
    if (t === '' || t === '~' || /^(null|Null|NULL)$/.test(t)) return null;
    if (/^(true|True|TRUE)$/.test(t)) return true;
    if (/^(false|False|FALSE)$/.test(t)) return false;
    if (/^[-+]?(0|[1-9][0-9]*)$/.test(t)) return Number(t);
    if (/^[-+]?(\.[0-9]+|[0-9]+\.[0-9]*|[0-9]+)([eE][-+]?[0-9]+)?$/.test(t) && /[.eE]/.test(t)) return Number(t);
    if (/^[&*!]/.test(t)) fail(`anchors, aliases and tags are not supported: ${t.slice(0, 40)}`);
    if (/^[%@`]/.test(t)) fail(`a plain value cannot start with ${t[0]}; quote it`);
    return t;
  }

  function stripComment(s) {
    // Strip ` #...` from a plain value (quotes are handled before this is called).
    const m = /(^|\s)#/.exec(s);
    return m ? s.slice(0, m.index) : s;
  }

  const ESC = { '0': '\0', a: '\x07', b: '\b', t: '\t', '\t': '\t', n: '\n', v: '\v', f: '\f', r: '\r', e: '\x1b', ' ': ' ', '"': '"', '/': '/', '\\': '\\', N: '\u0085', _: '\u00a0', L: '\u2028', P: '\u2029' };

  // Read a quoted scalar starting at s[pos] (the quote). Returns { value, end } where end is past the quote,
  // or null when the closing quote is not on this text (caller joins more lines).
  function readQuoted(s, pos) {
    const q = s[pos];
    let out = '';
    let j = pos + 1;
    while (j < s.length) {
      const c = s[j];
      if (q === "'") {
        if (c === "'") { if (s[j + 1] === "'") { out += "'"; j += 2; continue; } return { value: out, end: j + 1 }; }
        out += c; j++; continue;
      }
      if (c === '\\') {
        const n = s[j + 1];
        if (n === 'x' || n === 'u' || n === 'U') {
          const len = n === 'x' ? 2 : n === 'u' ? 4 : 8;
          const hex = s.slice(j + 2, j + 2 + len);
          if (!/^[0-9a-fA-F]+$/.test(hex) || hex.length !== len) fail(`bad escape \\${n}${hex}`);
          out += String.fromCodePoint(parseInt(hex, 16)); j += 2 + len; continue;
        }
        if (n === '\n') { j += 2; while (s[j] === ' ') j++; continue; } // escaped line break
        if (!(n in ESC)) fail(`unknown escape \\${n}`);
        out += ESC[n]; j += 2; continue;
      }
      if (c === '"') return { value: out, end: j + 1 };
      out += c; j++;
    }
    return null;
  }

  // Fold the lines of a multi-line quoted or plain scalar: a single line break becomes a space, and each
  // blank line becomes one newline (YAML line folding).
  function foldLines(parts) {
    let out = '';
    let pendingBlank = 0;
    parts.forEach((p, k) => {
      const t = k === 0 ? p.replace(/\s+$/, '') : k === parts.length - 1 ? p.replace(/^\s+/, '') : p.trim();
      if (k > 0 && t === '' && k !== parts.length - 1) { pendingBlank++; return; }
      if (k === 0) out = t;
      else out += pendingBlank ? '\n'.repeat(pendingBlank) + t : ' ' + t;
      pendingBlank = 0;
    });
    return out;
  }

  // ── flow collections ──────────────────────────────────────────────────────
  function parseFlow(s) {
    let p = 0;
    const ws = () => { while (p < s.length && /\s/.test(s[p])) p++; };
    function value(ctx) {
      ws();
      const c = s[p];
      if (c === '[') {
        p++; const arr = [];
        ws();
        if (s[p] === ']') { p++; return arr; }
        for (;;) {
          arr.push(value('seq'));
          ws();
          if (s[p] === ',') { p++; ws(); if (s[p] === ']') { p++; return arr; } continue; }
          if (s[p] === ']') { p++; return arr; }
          fail(`expected , or ] in flow sequence near: ${s.slice(p, p + 30)}`);
        }
      }
      if (c === '{') {
        p++; const obj = {};
        ws();
        if (s[p] === '}') { p++; return obj; }
        for (;;) {
          const k = value('key');
          ws();
          let v = null;
          if (s[p] === ':') { p++; v = value('map'); ws(); }
          const key = String(k);
          if (Object.prototype.hasOwnProperty.call(obj, key)) fail(`duplicate key in flow map: ${key}`);
          obj[key] = v;
          if (s[p] === ',') { p++; ws(); if (s[p] === '}') { p++; return obj; } continue; }
          if (s[p] === '}') { p++; return obj; }
          fail(`expected , or } in flow map near: ${s.slice(p, p + 30)}`);
        }
      }
      if (c === '"' || c === "'") {
        const r = readQuoted(s, p);
        if (!r) fail('unterminated quoted string in flow collection');
        p = r.end; return r.value;
      }
      // plain scalar inside flow: ends at , ] } and, for keys, at ": " or a final ":"
      const start = p;
      while (p < s.length) {
        const ch = s[p];
        if (ch === ',' || ch === ']' || ch === '}') break;
        if (ch === ':' && (ctx === 'key' || ctx === 'seq' || ctx === 'map') && (p + 1 >= s.length || /[\s,\]}]/.test(s[p + 1]))) {
          if (ctx === 'key') break;
          if (ctx === 'seq' || ctx === 'map') fail('a flow item holding ": " must be quoted');
        }
        if (ch === '#' && /\s/.test(s[p - 1] || '')) fail('comment inside a flow collection');
        p++;
      }
      return resolvePlain(s.slice(start, p));
    }
    const v = value('top');
    ws();
    if (p < s.length && s[p] !== '#') fail(`unexpected text after flow collection: ${s.slice(p, p + 30)}`);
    return v;
  }

  function flowBalanced(s) {
    let depth = 0; let q = null;
    for (let j = 0; j < s.length; j++) {
      const c = s[j];
      if (q) {
        if (q === '"' && c === '\\') { j++; continue; }
        if (c === q) { if (q === "'" && s[j + 1] === "'") { j++; continue; } q = null; }
        continue;
      }
      if (c === '"' || c === "'") q = c;
      else if (c === '[' || c === '{') depth++;
      else if (c === ']' || c === '}') depth--;
      else if (c === '#' && /\s/.test(s[j - 1] || '') && depth > 0) return false;
    }
    return depth <= 0 && !q;
  }

  // ── inline values (what follows `key:` or `- ` on the same line) ────────────
  // `ind` is the indent of the owning key or dash; continuation lines must be indented deeper.
  function inlineValue(rest, ind) {
    const r = rest.trim();
    if (r[0] === '[' || r[0] === '{') {
      let text = r;
      const startLine = i - 1;
      while (!flowBalanced(text)) {
        if (i >= lines.length) fail('unterminated flow collection', startLine);
        text += ' ' + lines[i].trim(); i++;
      }
      return parseFlow(text);
    }
    if (r[0] === '"' || r[0] === "'") {
      let text = r;
      const startLine = i - 1;
      let parsed = readQuoted(text, 0);
      const parts = [r];
      while (!parsed) {
        if (i >= lines.length) fail('unterminated quoted string', startLine);
        parts.push(lines[i]); i++;
        // Join as YAML folds a multi-line quoted scalar, then re-read.
        text = r[0] + foldLines([parts[0].slice(1), ...parts.slice(1)]);
        parsed = readQuoted(text, 0);
      }
      const after = text.slice(parsed.end).trim();
      if (after && !after.startsWith('#')) fail(`unexpected text after quoted value: ${after.slice(0, 30)}`, i - 1);
      return parsed.value;
    }
    // plain scalar, possibly continued on deeper-indented lines. Like YAML, a plain value may not hold ": "
    // (it is almost always a mis-indented key, which would otherwise be swallowed into the text silently).
    const plainLine = (text, at) => {
      const t = stripComment(text);
      if (/:(\s|$)/.test(t.trim())) fail('a plain value holding ": " (or ending in ":") must be quoted; or check the indentation', at);
      return t;
    };
    const parts = [plainLine(r, i - 1)];
    for (;;) {
      let j = i;
      while (j < lines.length && /^\s*$/.test(lines[j])) j++;
      if (j >= lines.length) break;
      const line = lines[j];
      if (/^\s*#/.test(line)) break;
      if (indentOf(line) <= ind) break;
      for (let k = i; k < j; k++) parts.push('');
      parts.push(plainLine(line.trim(), j));
      i = j + 1;
    }
    if (parts.length === 1) return resolvePlain(parts[0]);
    return foldLines(parts);
  }

  // ── block scalars ─────────────────────────────────────────────────────────
  function blockScalar(header, ind) {
    const m = /^([|>])([-+]?)([1-9]?)([-+]?)\s*(#.*)?$/.exec(header.trim());
    if (!m) fail(`bad block scalar header: ${header.trim()}`, i - 1);
    const style = m[1];
    const chomp = m[2] || m[4] || '';
    const explicit = m[3] ? Number(m[3]) : 0;
    const body = [];
    let blockIndent = explicit ? ind + explicit : -1;
    while (i < lines.length) {
      const line = lines[i];
      if (/^\s*$/.test(line)) { body.push(line); i++; continue; }
      const li = /^ */.exec(line)[0].length; // tabs after the indentation are content in a block scalar
      if (blockIndent === -1) { if (li <= ind) break; blockIndent = li; }
      if (li < blockIndent) break;
      body.push(line); i++;
    }
    if (blockIndent === -1) blockIndent = ind + 1;
    // Trailing blank lines belong to chomping, not content.
    let end = body.length;
    while (end > 0 && /^\s*$/.test(body[end - 1])) end--;
    const content = body.slice(0, end).map(l => (l.length > blockIndent ? l.slice(blockIndent) : l.trim() === '' ? '' : l.slice(blockIndent)));
    const trailing = body.length - end;
    let text;
    if (style === '|') text = content.join('\n');
    else {
      // Folded: join runs of normal lines with a space; blank lines become newlines; more-indented lines
      // keep their line breaks.
      text = '';
      let prevKind = null; // 'normal' | 'more' | 'blank'
      let blanks = 0;
      for (const l of content) {
        if (l === '') { blanks++; continue; }
        const kind = /^\s/.test(l) ? 'more' : 'normal';
        if (prevKind === null) text = '\n'.repeat(blanks) + l;
        else if (kind === 'normal' && prevKind === 'normal') text += blanks ? '\n'.repeat(blanks) + l : ' ' + l;
        else text += '\n' + '\n'.repeat(blanks) + l;
        prevKind = kind; blanks = 0;
      }
    }
    if (content.length === 0) return chomp === '+' ? '\n'.repeat(trailing) : '';
    if (chomp === '-') return text;
    if (chomp === '+') return text + '\n' + '\n'.repeat(trailing);
    return text + '\n';
  }

  // ── block collections ─────────────────────────────────────────────────────
  const KEY_RE = /^("(?:[^"\\]|\\.)*"|'(?:[^']|'')*'|[^\s#'"[\]{},&*!|>%@`][^#]*?|-[^\s#][^#]*?)\s*:(?=\s|$)(.*)$/;
  const isSeqLine = (content) => content === '-' || content.startsWith('- ');

  function keyText(raw) {
    if (raw[0] === '"' || raw[0] === "'") return readQuoted(raw, 0).value;
    return raw.trim();
  }

  function nodeAfterKey(rest, ind) {
    const r = rest.trim();
    if (r === '' || r.startsWith('#')) {
      const j = peek();
      if (j === -1) return null;
      const li = indentOf(lines[j]);
      const content = lines[j].slice(li);
      if (li > ind) return block(li);
      if (li === ind && isSeqLine(content)) return seq(ind);
      return null;
    }
    if (r[0] === '|' || r[0] === '>') return blockScalar(r, ind);
    return inlineValue(r, ind);
  }

  function map(ind) {
    const obj = {};
    for (;;) {
      const j = peek();
      if (j === -1) break;
      const li = indentOf(lines[j]);
      if (li < ind) break;
      if (li > ind) fail('unexpected indentation', j);
      const content = lines[j].slice(li);
      if (isSeqLine(content)) break; // a sibling sequence ends this map (the caller handles it)
      const m = KEY_RE.exec(content);
      if (!m) fail(`expected "key: value", got: ${content.slice(0, 50)}`, j);
      const key = keyText(m[1]);
      if (Object.prototype.hasOwnProperty.call(obj, key)) fail(`duplicate key: ${key}`, j);
      i = j + 1;
      obj[key] = nodeAfterKey(m[2], ind);
    }
    return obj;
  }

  function seq(ind) {
    const arr = [];
    for (;;) {
      const j = peek();
      if (j === -1) break;
      const li = indentOf(lines[j]);
      if (li < ind) break;
      if (li > ind) fail('unexpected indentation in sequence', j);
      const content = lines[j].slice(li);
      if (!isSeqLine(content)) break;
      const after = content === '-' ? '' : content.slice(2);
      const lead = after.length - after.trimStart().length;
      const itemCol = ind + 2 + lead;
      const r = after.trim();
      if (r === '' || r.startsWith('#')) {
        i = j + 1;
        const k = peek();
        if (k === -1) { arr.push(null); break; }
        const ki = indentOf(lines[k]);
        arr.push(ki > ind ? block(ki) : null);
        continue;
      }
      if (r[0] === '|' || r[0] === '>') { i = j + 1; arr.push(blockScalar(r, ind)); continue; }
      if (isSeqLine(r) || (r[0] !== '[' && r[0] !== '{' && KEY_RE.test(r))) {
        // A nested map or sequence starting on the dash line: blank out the dash and reparse at its column.
        lines[j] = ' '.repeat(itemCol) + r;
        i = j;
        arr.push(isSeqLine(r) ? seq(itemCol) : map(itemCol));
        continue;
      }
      i = j + 1;
      arr.push(inlineValue(r, ind));
    }
    return arr;
  }

  function block(ind) {
    const j = peek();
    if (j === -1) return null;
    const content = lines[j].slice(indentOf(lines[j]));
    if (isSeqLine(content)) return seq(ind);
    if (KEY_RE.test(content) && !/^[[{]/.test(content)) return map(ind);
    // A bare scalar node.
    i = j + 1;
    if (content[0] === '|' || content[0] === '>') return blockScalar(content, ind - 1);
    return inlineValue(content, ind - 1);
  }

  const j0 = peek();
  if (j0 === -1) return null;
  const doc = block(indentOf(lines[j0]));
  const rest = peek();
  if (rest !== -1) fail('unexpected content (check indentation)', rest);
  return doc;
}

module.exports = { parse, YamlLiteError };
