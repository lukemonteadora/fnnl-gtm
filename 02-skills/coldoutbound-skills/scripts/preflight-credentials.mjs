#!/usr/bin/env node
// preflight-credentials.mjs — run_state-scoped credential PREFLIGHT gate.
// Verifies ONLY the API keys the locked run_state path needs — present + well-formed —
// as a binary pass/fail gate BEFORE any spend or provisioning. Owns presence+shape only;
// api-cost-governance owns balance+spend. Reads scripts/credential-registry.json (single
// source of truth) + the active client's run_state from profiles/<slug>/client-profile.yaml.
//
// Conditional rule (operator directive 2026-07-02): the primary research pass now defaults to the Claude
// native /deep-research fan-out harness (research_routing = claude_deep_research, the default when unset),
// which needs no third-party key. So a provider with "research_primary": true (Perplexity) stays warn-level
// under the default and is ELEVATED to REQUIRED ONLY when run_state.research_routing is an explicit
// third_party_ai opt-out (Perplexity is the chosen primary there, so its key becomes a credential hard-stop).
//
// Runtime: zero dependencies (native fetch + fs + JSON), Node 18+. Mirrors ai_router.mjs.
// Keys are NEVER printed — only present / MISSING / malformed, or a masked last-4 tail.
//
// Usage:
//   node preflight-credentials.mjs [--profile <slug>] [--validate] [--stack <id>] [--platform <name>]
// Exit codes: 0 all REQUIRED present & well-formed (warnings allowed) | 1 a REQUIRED key is
//   missing/malformed OR a required slot has no registry entry (registry gap) | 2 cannot scope
//   (no profile / no run_state / registry missing or invalid).

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPTS_DIR = __dirname;
const PROFILES_DIR = path.resolve(__dirname, '..', 'profiles');
const REGISTRY_PATH = path.resolve(__dirname, 'credential-registry.json');

// ── .env loader (scripts/.env, same pattern as ai_router.mjs) ────────────────
function loadEnvFile(envPath) {
  const out = {};
  if (!fs.existsSync(envPath)) return out;
  for (const raw of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const k = line.slice(0, eq).trim();
    let v = line.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    out[k] = v;
  }
  return out;
}
const ENV_PATH = path.resolve(__dirname, '.env');
const ENV_FILE_PRESENT = fs.existsSync(ENV_PATH);
const FILE_ENV = loadEnvFile(ENV_PATH);
// process.env overrides file — so a shell-set empty var ($env:KEY='') masks the file value.
const ENV = { ...FILE_ENV, ...process.env };

// Scan sibling *-keys.env files for a var NAME only (never its value) — for "merge into .env" hints.
function siblingFilesWithName(name) {
  const hits = [];
  let entries = [];
  try { entries = fs.readdirSync(SCRIPTS_DIR); } catch { return hits; }
  for (const f of entries) {
    if (!/\.env$/i.test(f)) continue;
    if (f === '.env' || f === '.env.example') continue;
    try {
      const txt = fs.readFileSync(path.join(SCRIPTS_DIR, f), 'utf8');
      const re = new RegExp('^\\s*' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*=', 'm');
      if (re.test(txt)) hits.push(f);
    } catch { /* ignore unreadable side file */ }
  }
  return hits;
}

// ── arg parsing (same shape as ai_router.mjs) ────────────────────────────────
function parseArgs(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t.startsWith('--')) {
      const name = t.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) a[name] = true;
      else { a[name] = next; i++; }
    }
  }
  return a;
}
const args = parseArgs(process.argv.slice(2));

// ── graceful exit helpers ────────────────────────────────────────────────────
function die(msg, code = 2) {
  console.error('\n⛔ Credential Preflight could not run.');
  console.error('   ' + msg);
  console.error('   Manual fallback: open scripts/.env and confirm the keys for your locked stack by hand.\n');
  process.exit(code);
}

// ── load registry (single source of truth) ──────────────────────────────────
let REGISTRY;
try {
  if (!fs.existsSync(REGISTRY_PATH)) die(`credential-registry.json not found at ${REGISTRY_PATH}.`, 2);
  REGISTRY = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
} catch (e) {
  die(`credential-registry.json is missing or invalid JSON (${e.message}).`, 2);
}
const PROVIDERS = REGISTRY.providers || {};
const STACK_MAP = REGISTRY.stack_map || {};
const PLACEHOLDERS = REGISTRY.placeholder_patterns || ['^your_', '^<', 'xxxx', 'changeme', '_here$'];

// ── locate + read the active profile's run_state ─────────────────────────────
function profilesWithRunState() {
  let dirs = [];
  try { dirs = fs.readdirSync(PROFILES_DIR, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name); }
  catch { return []; }
  const found = [];
  for (const slug of dirs) {
    const p = path.join(PROFILES_DIR, slug, 'client-profile.yaml');
    try {
      if (fs.existsSync(p) && /^run_state\s*:/m.test(fs.readFileSync(p, 'utf8'))) {
        found.push({ slug, path: p, mtime: fs.statSync(p).mtimeMs });
      }
    } catch { /* skip unreadable profile */ }
  }
  return found.sort((a, b) => b.mtime - a.mtime);
}

function stripInlineComment(s) {
  let inS = false, inD = false;
  for (let k = 0; k < s.length; k++) {
    const c = s[k];
    if (c === "'" && !inD) inS = !inS;
    else if (c === '"' && !inS) inD = !inD;
    else if (c === '#' && !inS && !inD && (k === 0 || /\s/.test(s[k - 1]))) return s.slice(0, k);
  }
  return s;
}
function unquote(v) {
  v = v.trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) return v.slice(1, -1);
  return v;
}
// Parse the top-level (exactly 2-space-indented) scalars under `run_state:`.
function parseRunState(text) {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex(l => /^run_state\s*:/.test(l));
  if (start === -1) return null;
  const out = {};
  for (let j = start + 1; j < lines.length; j++) {
    const line = lines[j];
    if (line.trim() === '') continue;
    if (/^[^\s#]/.test(line)) break;           // next col-0 key ends the block (col-0 comments are skipped)
    const m = line.match(/^ {2}([A-Za-z0-9_]+):(?:\s+(.*))?$/); // exactly 2 spaces -> top-level scalar
    if (!m || m[2] === undefined) continue;     // deeper nesting / list / block header -> skip
    const val = unquote(stripInlineComment(m[2]).trim());
    if (val !== '') out[m[1]] = val;
  }
  return out;
}

const isBlank = v => v === undefined || v === null || v === '' || String(v).toLowerCase() === 'null';

// ── shape / well-formedness check (presence + shape only, never balance) ─────
function checkShape(value, shape) {
  shape = shape || {};
  if (isBlank(value)) return { ok: false, reason: 'missing' };
  const v = String(value).trim();
  if (/\s/.test(v)) return { ok: false, reason: 'contains whitespace' };
  if (shape.forbid_placeholder) {
    for (const pat of PLACEHOLDERS) {
      try { if (new RegExp(pat, 'i').test(v)) return { ok: false, reason: 'looks like a placeholder' }; } catch { /* bad pattern */ }
    }
  }
  if (shape.min_len && v.length < shape.min_len) return { ok: false, reason: `too short (<${shape.min_len})` };
  if (shape.prefix && !v.startsWith(shape.prefix)) return { ok: false, reason: `missing expected prefix "${shape.prefix}"` };
  if (shape.regex) { try { if (!new RegExp(shape.regex).test(v)) return { ok: false, reason: 'fails expected format' }; } catch { /* bad regex */ } }
  return { ok: true };
}
const mask = v => (isBlank(v) ? '' : '…' + String(v).trim().slice(-4));

// Resolve a var by primary name or any alias; returns which name satisfied it (value kept local).
function resolveVar(primary, aliases) {
  const names = [primary, ...((aliases && aliases[primary]) || [])];
  for (const n of names) if (ENV[n] && ENV[n].trim()) return { found: true, via: n, value: ENV[n].trim() };
  return { found: false, via: primary, value: '' };
}

// ── main ──────────────────────────────────────────────────────────────────
(async () => {
  // Resolve which profile to read.
  let slug = typeof args.profile === 'string' ? args.profile : null;
  let profilePath;
  if (slug) {
    profilePath = path.join(PROFILES_DIR, slug, 'client-profile.yaml');
    if (!fs.existsSync(profilePath)) die(`profile "${slug}" not found (${profilePath}). Pass --profile <slug>.`, 2);
  } else {
    const candidates = profilesWithRunState();
    if (candidates.length === 0) die(`no profiles/*/client-profile.yaml with a run_state found. Pass --profile <slug>.`, 2);
    ({ slug, path: profilePath } = candidates[0]);
  }

  const rs = parseRunState(fs.readFileSync(profilePath, 'utf8'));
  if (!rs) die(`profile "${slug}" has no run_state block. Lock the stack/platform in client-profile.yaml first.`, 2);

  // Derive the locked path (explicit fields first, then infrastructure_stack fallback, then CLI overrides).
  const stackId = args.stack && args.stack !== true ? args.stack : rs.infrastructure_stack;
  const mapped = STACK_MAP[stackId] || {};
  const locked = {
    infrastructure_stack: stackId || null,
    registrar: rs.registrar || mapped.registrar || null,
    mailbox_provider: rs.mailbox_provider || mapped.mailbox_provider || null,
    sending_platform: (args.platform && args.platform !== true ? args.platform : rs.sending_platform) || null,
    emailbison_instance_url: isBlank(rs.emailbison_instance_url) ? null : rs.emailbison_instance_url,
    lead_source: rs.lead_source || rs.source_workflow || rs.source_id || null,
    // unset research_routing defaults to claude_deep_research (per cold-email-kickoff:62 / ai-model-routing,
    // operator directive 2026-07-02: primary research = Claude native /deep-research harness, no 3rd-party key needed)
    research_routing: isBlank(rs.research_routing) ? 'claude_deep_research' : String(rs.research_routing).toLowerCase(),
  };

  // ── resolve required vs optional providers from registry × locked path ──
  const slots = [
    { name: 'registrar', field: 'registrar', value: locked.registrar },
    { name: 'mailbox',   field: 'mailbox_provider', value: locked.mailbox_provider },
    { name: 'platform',  field: 'sending_platform', value: locked.sending_platform },
  ];

  // Cannot scope an unlocked core slot. A blank registrar/mailbox/platform means the run is not lockable,
  // so we must NOT return the exit-0 that tells the kickoff "proceed to spend" - exit 2 (same bucket as no
  // run_state). In the real kickoff these are locked at Step 1, so this only guards a standalone spot-check
  // on a half-filled profile. ("Other" is a valid, deliberate platform value - not blank - handled below.)
  const unlockedSlots = slots.filter(s => isBlank(s.value)).map(s => s.field);
  if (unlockedSlots.length) {
    die(`run_state has unlocked core slot(s): ${unlockedSlots.join(', ')}. Lock the full stack + platform in `
      + `${slug}'s client-profile.yaml before the preflight can scope the run.`, 2);
  }

  const triggerFields = p => (p.trigger && (p.trigger.fields || (p.trigger.field ? [p.trigger.field] : []))) || [];
  const matchesSlot = (p, slot) => !p.slot_optional && triggerFields(p).includes(slot.field) && p.trigger.equals === slot.value;

  // FAIL-LOUD: a non-"Other" required-slot value with no covering registry entry = registry drift.
  const registryGaps = [];
  for (const slot of slots) {
    if (isBlank(slot.value)) continue;
    if (slot.name === 'platform' && String(slot.value).toLowerCase() === 'other') continue; // unmanaged escape hatch
    const covered = Object.values(PROVIDERS).some(p => matchesSlot(p, slot));
    if (!covered) registryGaps.push({ slot: slot.name, value: slot.value });
  }

  // Build the working provider set for this run.
  const selected = []; // {id, p, kind:'required'|'optional', reasonTag}
  for (const [id, p] of Object.entries(PROVIDERS)) {
    const t = p.trigger || {};
    let include = false, reasonTag = '';
    if (t.always) { include = true; reasonTag = 'always'; }
    else if (t.ai_optional) { include = true; reasonTag = 'AI routing'; }
    else if (t.source_id) {
      if (locked.lead_source && String(locked.lead_source).toLowerCase() === String(t.source_id).toLowerCase()) { include = true; reasonTag = 'lead source'; }
    } else {
      const fields = triggerFields(p);
      for (const slot of slots) if (fields.includes(slot.field) && t.equals === slot.value) { include = true; reasonTag = slot.name; }
    }
    if (!include) continue;
    let kind = (p.enforcement === 'fail') ? 'required' : 'optional';
    // Conditional elevation: the third-party research-primary provider (Perplexity) is REQUIRED ONLY when
    // the operator explicitly opted into third_party_ai routing (Perplexity is the chosen primary then).
    // Under the default claude_deep_research the primary is the native /deep-research harness, which needs
    // no third-party key, so Perplexity stays warn-level (optional gap-fill).
    if (p.research_primary && locked.research_routing === 'third_party_ai') { kind = 'required'; reasonTag = 'research primary (third_party_ai opt-out)'; }
    selected.push({ id, p, kind, reasonTag });
  }

  // ── evaluate each selected provider (presence + shape) ──
  const requiredResults = [];
  const optionalResults = [];
  const missingRequired = [];
  const warnings = [];

  // "Other" is a valid sending_platform but has no managed provider - it selects nothing and would otherwise
  // pass invisibly. Surface it loudly (stays exit 0; the operator owns that platform's credentials).
  const platformOther = !isBlank(locked.sending_platform) && String(locked.sending_platform).toLowerCase() === 'other';
  if (platformOther) warnings.push("sending_platform 'Other' is unmanaged - verify its credentials manually");

  for (const { id, p, kind, reasonTag } of selected) {
    const lines = [];
    let providerOk = true;

    if ((p.env || []).length === 0) {
      // Known-keyless tool (e.g. browser/MCP/manual lead source). Not a gap, not checkable.
      lines.push({ name: `(${p.label})`, status: 'n/a', symbol: 'ℹ', masked: '', detail: p.note || 'no env var; browser/MCP/manual' });
      (kind === 'required' ? requiredResults : optionalResults).push({ id, label: p.label, reasonTag, lines });
      continue;
    }

    for (const varName of p.env) {
      const r = resolveVar(varName, p.aliases);
      if (!r.found) {
        providerOk = false;
        const hintFiles = siblingFilesWithName(varName);
        const hint = hintFiles.length ? ` — not in .env; found by name in ${hintFiles.join(', ')} → merge into scripts/.env (runtime reads only .env)` : '';
        lines.push({ name: varName, status: 'MISSING', symbol: (kind === 'required' ? '✗' : '⚠'), masked: '', detail: hint });
        if (kind === 'required') missingRequired.push(varName); else warnings.push(`${varName} missing (${p.label})`);
      } else {
        const sh = checkShape(r.value, p.shape);
        if (!sh.ok) {
          providerOk = false;
          lines.push({ name: r.via, status: 'malformed', symbol: (kind === 'required' ? '✗' : '⚠'), masked: mask(r.value), detail: sh.reason });
          if (kind === 'required') missingRequired.push(`${varName} (malformed: ${sh.reason})`); else warnings.push(`${varName} malformed (${sh.reason})`);
        } else {
          lines.push({ name: r.via, status: 'present', symbol: '✓', masked: mask(r.value), detail: r.via === varName ? '' : `via alias ${r.via}` });
        }
      }
    }

    // EmailBison also needs an instance URL (run_state or env).
    if (p.requires_instance_url) {
      const fromState = locked[p.instance_url_run_state_field];
      const fromEnv = (p.instance_url_env || []).map(n => ENV[n]).find(v => v && v.trim());
      if (isBlank(fromState) && !fromEnv) {
        providerOk = false;
        lines.push({ name: 'instance URL', status: 'MISSING', symbol: (kind === 'required' ? '✗' : '⚠'), masked: '', detail: `set run_state.${p.instance_url_run_state_field} or ${(p.instance_url_env || []).join('/')}` });
        if (kind === 'required') missingRequired.push('EmailBison instance URL'); else warnings.push('EmailBison instance URL missing');
      } else {
        const src = !isBlank(fromState) ? `run_state.${p.instance_url_run_state_field}` : 'env';
        lines.push({ name: 'instance URL', status: 'present', symbol: '✓', masked: '', detail: `from ${src}` });
      }
    }

    // Optional live validation (off by default; only where a free endpoint exists).
    if (args.validate && providerOk && p.validate_endpoint && p.validate_endpoint.free) {
      const r = resolveVar(p.env[0], p.aliases);
      let live = 'live-skip';
      try {
        const res = await fetch(p.validate_endpoint.url, { headers: { Authorization: `Bearer ${r.value}`, Accept: 'application/json' } });
        live = res.ok ? 'live-ok' : `live-fail(${res.status})`;
        if (!res.ok && res.status === 401) { providerOk = false; if (kind === 'optional') warnings.push(`${id} live auth failed (401)`); }
      } catch (e) { live = 'live-error'; }
      lines.push({ name: `(${id} live)`, status: live, symbol: live === 'live-ok' ? '✓' : '⚠', masked: '', detail: '' });
    } else if (args.validate && providerOk && !p.validate_endpoint) {
      lines.push({ name: `(${id} live)`, status: 'no-endpoint', symbol: 'ℹ', masked: '', detail: 'no free validation endpoint — presence+shape only' });
    }

    (kind === 'required' ? requiredResults : optionalResults).push({ id, label: p.label, reasonTag, ok: providerOk, lines });
  }

  // ── verdict ──
  const hasGap = registryGaps.length > 0;
  const fail = missingRequired.length > 0 || hasGap;
  const verdict = fail ? 'FAIL' : 'PASS';
  const exitCode = fail ? 1 : 0;

  // ── print summary (masked; never a full value) ──
  const W = 32;
  const pad = s => (s + ' '.repeat(W)).slice(0, W);
  console.log('');
  console.log('══ Credential Preflight ─────────────────────────────────────────');
  console.log(`   profile      : ${slug}`);
  console.log(`   locked path  : ${locked.infrastructure_stack || '(stack?)'} | registrar=${locked.registrar || '?'} · mailbox=${locked.mailbox_provider || '?'} · platform=${locked.sending_platform || '?'}`);
  console.log(`   research     : routing=${locked.research_routing} → primary ${locked.research_routing === 'third_party_ai' ? 'Perplexity (REQUIRED)' : 'Claude /deep-research (native, no 3rd-party key); Perplexity optional gap-fill'}`);
  console.log(`   env loaded   : scripts/.env ${ENV_FILE_PRESENT ? '(present)' : '(absent — using process.env only)'}`);
  if (hasGap) for (const g of registryGaps) console.log(`   ⛔ REGISTRY GAP: locked ${g.slot}="${g.value}" has no entry in credential-registry.json (add it or fix run_state).`);

  const printGroup = (title, results) => {
    console.log(`\n${title}`);
    if (results.length === 0) { console.log('   (none for this path)'); return; }
    for (const r of results) {
      for (const ln of r.lines) {
        const tail = [ln.masked, ln.detail].filter(Boolean).join('  ');
        console.log(`   ${ln.symbol} ${pad(ln.name)} ${pad(ln.status)} ${tail}`.replace(/\s+$/, ''));
      }
    }
  };
  printGroup('REQUIRED (locked path)', requiredResults);
  printGroup('OPTIONAL (warn-level — fallbacks / not needed at kickoff)', optionalResults);
  if (platformOther) console.log("   ⚠ sending_platform 'Other'      UNMANAGED        verify its credentials manually — not checked by the preflight");
  if (isBlank(locked.lead_source)) console.log('   ℹ lead-source key       not checked       no source recorded; api-cost-governance gates it at source time');

  const reqKeyLines = requiredResults.flatMap(r => r.lines).filter(l => ['present', 'MISSING', 'malformed'].includes(l.status));
  const reqKeysTotal = reqKeyLines.length;
  const reqKeysOk = reqKeyLines.filter(l => l.status === 'present').length;
  console.log('');
  if (verdict === 'PASS') {
    console.log(`✅ VERDICT: PASS — ${reqKeysOk}/${reqKeysTotal} required keys present & well-formed.` + (warnings.length ? `  (${warnings.length} optional warning${warnings.length > 1 ? 's' : ''})` : ''));
  } else {
    const why = hasGap ? `registry gap (${registryGaps.map(g => g.slot + '=' + g.value).join(', ')})` : '';
    const keys = missingRequired.length ? `missing/malformed required: ${missingRequired.join(', ')}` : '';
    console.log(`❌ VERDICT: FAIL — ${[keys, why].filter(Boolean).join(' · ')} (for ${locked.infrastructure_stack}+${locked.sending_platform}).`);
  }
  console.log('');

  // ── write machine-readable result (resumability); masked tails only, no values ──
  const toJson = results => results.map(r => ({
    id: r.id, label: r.label, slot: r.reasonTag, ok: r.ok !== false,
    keys: r.lines.map(l => ({ name: l.name, status: l.status, masked: l.masked, detail: l.detail || undefined })),
  }));
  const result = {
    schema: 'preflight-credentials/v1',
    profile: slug,
    checked_at: new Date().toISOString(),
    locked_path: locked,
    verdict,
    exit_code: exitCode,
    registry_gaps: registryGaps,
    required: toJson(requiredResults),
    optional: toJson(optionalResults),
    missing_required: missingRequired,
    warnings,
  };
  try {
    fs.writeFileSync(path.join(PROFILES_DIR, slug, 'preflight-credentials.json'), JSON.stringify(result, null, 2) + '\n');
  } catch (e) {
    console.error(`   (note: could not write preflight-credentials.json — ${e.message})`);
  }

  process.exit(exitCode);
})().catch(e => die(`unexpected error: ${e && e.message || e}`, 2));
