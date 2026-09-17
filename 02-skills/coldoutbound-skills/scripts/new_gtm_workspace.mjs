#!/usr/bin/env node
/*
 * new_gtm_workspace.mjs — deterministic helper for the /new-gtm-workspace skill.
 *
 * Modes:
 *   --scan  [--dir <path>] [--out <file>]   Read-only. Greps the (committed) tree for company/client
 *                                           identifiers AND hardcoded Google resource ids, then writes a
 *                                           categorized CROSS-ACCOUNT RISK / DELETE / RESET / FLAG report.
 *   --map   [--dir <path>] [--out <file>]   Read-only. For every stack tool, lists which files reference it,
 *                                           tagged default / inherited (from the upstream workspace, swap out) / needs-skill.
 *   --preflight [--dir <path>]              Read-only. Checks gh auth + repo remote + clean tree.
 *
 * Notes:
 *   - "Read-only" modes never write outside --out and never touch the source secrets/clients (they only grep).
 *   - Secret hygiene: this tool handles file PATHS and identifier NAMES only. It never reads or prints a key value.
 *   - The actual clone/scrub/repo-create are driven by the skill steps (gated), not auto-run here.
 */

import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const opt = (f, d) => { const i = args.indexOf(f); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : d; };
const dir = path.resolve(opt('--dir', process.cwd()));

// ---- identifier sets to scrub when forking THIS workspace -------------------
// Defaults describe FNNL Agency. Override per run so the scan stays accurate as
// clients are onboarded, since a client onboarded after this file was written
// will NOT be caught by a stale hardcoded list.
//   --company  acme,"acme co"    (company identifiers + operator emails/handles)
//   --clients  acme,northwind    (client slugs currently in profiles/)
//   --personas "Jane Doe,Sam Lee"
// Tip: derive --clients from the actual profile folders rather than memory:
//   ls 02-skills/coldoutbound-skills/profiles
const csv = (v) => String(v || '').split(',').map((x) => x.trim()).filter(Boolean);

const COMPANY  = csv(opt('--company', 'fnnl,fnnl agency,@fnnl'));
const CLIENTS  = csv(opt('--clients', ''));   // empty until clients are onboarded
const PERSONAS = csv(opt('--personas', ''));  // sender personas used in campaigns
const OPERATOR = csv(opt('--operator', ''));  // GitHub handle / operator email - FLAG only, not client data

// ---- STRIP: non-cold-outbound / personal / branded paths (a fork is cold-outbound ONLY) -----
// The .gitignore does NOT exclude these; they come through the clone and must be removed (skill Step 3.5).
// KEEP the cold-outbound machine; e.g. lifecycle-copy stays (cold follow-up copy, not marketing).
const STRIP_PATHS = [
  { re: /(^|\/)linkedin-skills\//i,                                 why: 'personal LinkedIn posting/content (not cold LinkedIn DM)' },
  { re: /(^|\/)claude-flow-system\//i,                              why: 'generic non-cold-outbound framework' },
  { re: /(^|\/)_archive\//i,                                        why: 'stale archive (often includes personal skills)' },
  { re: /(^|\/)guide-assets\//i,                                    why: 'source-company-branded onboarding images' },
  { re: /(^|\/)cold-email-flow-(presentation|8card)\.(html|png)$/i, why: 'source-company-branded flow presentation' },
  { re: /coldoutbound-skills\/_[A-Z][^/]*\.md$/,                    why: 'source-company internal planning/audit doc' },
  { re: /(^|\/)scripts\/_[^/]*\.json$/i,                            why: 'operator operational results/run-state DATA (registered domains, accounts) — the worst leak' },
  { re: /(^|\/)scripts\/_pool_[^/]*$/i,                             why: 'mailbox-pool operational scratch (registered domains, plans, results)' },
  { re: /(^|\/)scripts\/_prelaunch_[^/]*$/i,                        why: 'pre-launch health scratch (account data)' },
  { re: /(^|\/)scripts\/_(catchall|campaign_settings|fix_issues|reimport|extract_domains)[^/]*$/i, why: 'operator one-off operational scratch' },
  { re: /(^|\/)scripts\/discolike_sample\.[^/]*$/i,                 why: 'sample with a hardcoded real-company domain list' },
  { re: /smartlead-slack-reporting\/_(channel|sl_|slack|health)[^/]*$/i, why: 'slack-reporting dev probes (operator scratch)' },
];

// ---- known LIVE Google resource ids (cross-account contamination risk) ---------------------
// NOTE: the upstream ids were redacted when this workspace was forked. Add FNNL's own
// live Sheet / Drive / Apps-Script ids here as they are created, so a future fork of THIS
// workspace catches them. An empty-ish list here means this check is currently inert.
// Sheet / Drive / Apps-Script ids hardcoded in committed skills + docs. They contain no company
// text, so the identifier scan above misses them. In a FORK they still point at the SOURCE's LIVE
// accounts, so a forked skill that WRITES to one contaminates the source company's real data. They must be
// reset to a per-company placeholder in the fork. In THIS source repo they are correct, so the scan
// only flags them; the reset is a guided edit done in the cloned target, never here.
const RESOURCE_IDS = [
  { id: '<REDACTED_UPSTREAM_ID>', label: 'Cold Email Mailbox Tracker - Google Sheet' },
  { id: '<REDACTED_UPSTREAM_ID>', label: 'Cold Email Mailbox Tracker - Apps Script project' },
  { id: '<REDACTED_UPSTREAM_ID>', label: 'Mailbox pool staging - Google Sheet' },
  { id: '<REDACTED_UPSTREAM_ID>', label: 'Smartlead Slack reporting - Apps Script project' },
];

// ---- stack tools for the wiring map -----------------------------------------
// role: 'default' (keep) | 'inherited' (swap out for the default) | 'needs-skill' (declarative)
const TOOLS = [
  { name: 'Claude', role: 'default', terms: ['claude', 'anthropic'] },
  { name: 'OpenAI', role: 'default', terms: ['openai'] },
  { name: 'DeepSeek', role: 'default', terms: ['deepseek'] },
  { name: 'Grok (xAI)', role: 'default', terms: ['grok', 'xai'] },
  { name: 'Perplexity', role: 'default', terms: ['perplexity', 'pplx'] },
  { name: 'Spaceship', role: 'default', terms: ['spaceship'] },
  { name: 'Zapmail', role: 'default', terms: ['zapmail'] },
  { name: 'Smartlead', role: 'default', terms: ['smartlead'] },
  { name: 'DiscoLike', role: 'default', terms: ['discolike', 'disco-like'] },
  { name: 'Blitz', role: 'default', terms: ['blitz'] },
  { name: 'Prospeo', role: 'default', terms: ['prospeo'] },
  { name: 'LeadMagic', role: 'default', terms: ['leadmagic', 'lead magic'] },
  { name: 'BetterContact', role: 'default', terms: ['bettercontact', 'better contact'] },
  { name: 'Spider Cloud', role: 'default', terms: ['spider'] },
  { name: 'SerperDev', role: 'default', terms: ['serper'] },
  { name: 'GetSales.io', role: 'default', terms: ['getsales', 'get-sales'] },
  { name: 'Close.com', role: 'default', terms: ['close.com', 'close crm', 'closecrm'] },
  { name: 'A-Leads', role: 'inherited', terms: ['a-leads', 'aleads'] },
  { name: 'Deliverable.co', role: 'inherited', terms: ['deliverable'] },
  { name: 'EmailBison', role: 'inherited', terms: ['emailbison'] },
  { name: 'Primeforge', role: 'inherited', terms: ['primeforge'] },
  { name: 'Salesforge', role: 'inherited', terms: ['salesforge'] },
  { name: 'RevCode', role: 'inherited', terms: ['revcode'] },
  { name: 'MiniMax', role: 'inherited', terms: ['minimax'] },
  { name: 'Dynadot', role: 'inherited', terms: ['dynadot'] },
];

// ---- helpers ----------------------------------------------------------------
function gitGrepFiles(term) {
  // -i case-insensitive, -l names only, -F fixed string (so '.' and '@' are literal), -e pattern
  try {
    const out = execFileSync('git', ['grep', '-ilF', '-e', term], { cwd: dir, encoding: 'utf8' });
    return out.split('\n').map((s) => s.trim()).filter(Boolean);
  } catch {
    return []; // git grep exits 1 on no match
  }
}

function gitTrackedFiles() {
  try {
    const out = execFileSync('git', ['ls-files'], { cwd: dir, encoding: 'utf8' });
    return out.split('\n').map((s) => s.trim().replace(/\\/g, '/')).filter(Boolean);
  } catch {
    return [];
  }
}

function filesForTerms(terms) {
  const set = new Set();
  for (const t of terms) for (const f of gitGrepFiles(t)) set.add(f.replace(/\\/g, '/'));
  return [...set].sort();
}

// Read-only line-level scan for hardcoded Google Sheet / Drive / Apps-Script ids.
// Surfaces (a) the known LIVE ids above and (b) any OTHER long opaque Google id a future
// skill might hardcode, so the detector keeps working as new skills are added. Returns line-level
// findings [{file, line, id, known, label, text}] so the guided reset knows exactly where to edit.
function scanResourceIds() {
  // Search source files only (skills / scripts / reference docs / config). git grep sees tracked
  // files, so gitignored client data + secrets are already out; lock files are excluded as noise.
  const PATHSPECS = [
    '*.md', '*.mjs', '*.js', '*.cjs', '*.gs', '*.ts', '*.json', '*.ps1', '*.py', '*.yaml', '*.yml', '*.html',
    ':(exclude)*package-lock.json', ':(exclude)*-lock.json', ':(exclude)*.lock',
    ':(exclude)*new_gtm_workspace.mjs', // this helper's own RESOURCE_IDS catalog is the detector, not a write target
  ];
  // Lines that look like a Google resource reference: a google.com URL, a sheet/script-id keyword,
  // or any 40+ char base64url-ish token (Drive/Sheets ids are 44 chars, Apps-Script ids longer).
  const PATTERN = '(google\\.com|spreadsheet[ _]?id|script[ _]?id|sheet[ _]?id|[A-Za-z0-9_-]{40,})';
  let out = '';
  try {
    // The 40+ char token branch also matches long hyphenated skill slugs, so this returns many lines
    // (the JS filter below discards the non-Google ones); raise maxBuffer past the 1MB default.
    out = execFileSync('git', ['grep', '-niE', PATTERN, '--', ...PATHSPECS], { cwd: dir, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  } catch {
    return []; // git grep exits 1 on no match
  }

  const known = new Map(RESOURCE_IDS.map((r) => [r.id, r.label]));
  const tokenRe = /[A-Za-z0-9_-]{40,}/g;
  const findings = [];
  // Split on \r?\n: this repo's files are CRLF, and a trailing \r would break the line parse below
  // (JS `.` and `$` do not span a carriage return).
  for (const raw of out.split(/\r?\n/)) {
    if (!raw) continue;
    // git grep -n output is `path:line:content`; git emits forward-slash paths with no ':' in them,
    // so the first ':<digits>:' is the line-number separator.
    const m = raw.match(/^(.*?):(\d+):(.*)$/);
    if (!m) continue;
    const file = m[1].replace(/\\/g, '/');
    const line = m[2];
    const text = m[3];
    const hasCtx = /google\.com|(?:spread)?sheet[ _]?id|script[ _]?id/i.test(text);
    const seen = new Set();
    let tm;
    while ((tm = tokenRe.exec(text)) !== null) {
      const id = tm[0];
      if (seen.has(id)) continue;
      seen.add(id);
      const isKnown = known.has(id);
      // base64url ids mix upper + lower + digits and have no consecutive hyphens; that rules out
      // all-lowercase-hex git SHAs and Windows path fragments (C--Users-...-GTM-System). Keep a
      // token only if it's catalogued, the line names a Google resource, or it looks like an id.
      const looksLikeId = /[a-z]/.test(id) && /[A-Z]/.test(id) && /[0-9]/.test(id) && !id.includes('--');
      if (!isKnown && !hasCtx && !looksLikeId) continue;
      const display = text.trim();
      findings.push({ file, line, id, known: isKnown, label: isKnown ? known.get(id) : null, text: display.length > 140 ? display.slice(0, 137) + '...' : display });
    }
  }

  // de-dup identical file:line:id, then sort known-first, then by file + line
  const uniq = new Map();
  for (const f of findings) uniq.set(`${f.file}|${f.line}|${f.id}`, f);
  return [...uniq.values()].sort((a, b) =>
    (Number(b.known) - Number(a.known)) || a.file.localeCompare(b.file) || (Number(a.line) - Number(b.line))
  );
}

function category(file) {
  const f = file.replace(/\\/g, '/');
  if (f.includes('/profiles/')) return 'DELETE';
  if (f.includes('/memory/') && !f.endsWith('.gitkeep')) return 'DELETE';
  if (f.includes('api-balance-ledger') || f.includes('activity-log') || f.includes('distilled-ledger')) return 'DELETE';
  if (f.startsWith('00-start-here/')) return 'DELETE';
  if (f === 'CLAUDE.md' || f.endsWith('/CLAUDE.md') || f === 'README.md' || f.includes('credential-registry.json')) return 'RESET';
  if (f.startsWith('.claude/skills/')) return 'FLAG';
  return 'FLAG';
}

function writeOut(outArg, body, label) {
  if (outArg) {
    const p = path.resolve(dir, outArg);
    writeFileSync(p, body, 'utf8');
    console.log(`Wrote ${label} -> ${p}`);
  } else {
    console.log(body);
  }
}

// ---- modes ------------------------------------------------------------------
function runScan() {
  const groups = { COMPANY, CLIENTS, PERSONAS, OPERATOR };
  const byFile = new Map(); // file -> { hits:Set, cat }
  for (const [grp, terms] of Object.entries(groups)) {
    for (const f of filesForTerms(terms)) {
      if (!byFile.has(f)) byFile.set(f, { hits: new Set(), cat: category(f) });
      byFile.get(f).hits.add(grp);
    }
  }
  // OPERATOR-only files are FLAG-only (repo owner, not client data)
  for (const [f, v] of byFile) if (v.hits.size === 1 && v.hits.has('OPERATOR')) v.cat = 'FLAG';

  // Cross-account resource-id scan (line-level). Mark every file that hardcodes a Google id as RISK
  // (it overrides FLAG/RESET; a DELETE file is removed anyway, so the id goes with it).
  const riskFindings = scanResourceIds();
  const riskFiles = new Set(riskFindings.map((r) => r.file));
  // Belt-and-suspenders: also flag the file of any KNOWN id by literal match, so a line-parse edge
  // case can never let a catalogued live id slip through (skip this helper's own catalog).
  for (const f of filesForTerms(RESOURCE_IDS.map((r) => r.id))) {
    if (f.endsWith('new_gtm_workspace.mjs')) continue;
    riskFiles.add(f);
  }
  for (const f of riskFiles) {
    if (!byFile.has(f)) byFile.set(f, { hits: new Set(), cat: 'RISK' });
    const v = byFile.get(f);
    v.hits.add('RESOURCE_ID');
    if (v.cat !== 'DELETE') v.cat = 'RISK';
  }

  const buckets = { RISK: [], DELETE: [], RESET: [], FLAG: [] };
  for (const [f, v] of [...byFile].sort()) buckets[v.cat].push({ f, hits: [...v.hits].join(',') });

  let body = `# Fork scrub report (${path.basename(dir)})\n\n`;
  body += `Source tree scanned for this workspace's company + client identifiers and hardcoded Google resource ids. ${byFile.size} committed files matched.\n\n`;
  body += `- RISK   = file hardcodes a Google Sheet / Drive / Apps-Script id, CROSS-ACCOUNT RISK (reset write-targets to a placeholder, see below)\n`;
  body += `- DELETE = client-data / history files, remove outright\n`;
  body += `- RESET  = operator-identity files, rewrite this company -> new company (keep structure)\n`;
  body += `- FLAG   = illustrative mentions inside skills, REVIEW (never blind find-replace)\n`;
  body += `- STRIP  = non-cold-outbound / personal / branded content, REMOVE (a fork is cold-outbound only)\n\n`;

  // CROSS-ACCOUNT RISK section first (highest priority) with line-level detail for the guided reset.
  body += `## CROSS-ACCOUNT RISK - hardcoded Google resource ids (${riskFindings.length})\n\n`;
  body += `These are Google Sheet / Drive / Apps-Script ids baked into committed files. In a FORK they still\n`;
  body += `point at THIS workspace's LIVE accounts, so a forked skill that WRITES to one contaminates real\n`;
  body += `data. Reset every id in an executable or write-target position (e.g. \`const spreadsheetId = '...'\`,\n`;
  body += `an Apps-Script project the skill edits) to a per-company placeholder. This is a RESET, not a FLAG.\n`;
  body += `A documentation or deploy-record mention that is clearly labeled as the source company's can stay; that is the\n`;
  body += `reviewer's call. KNOWN = a catalogued live id from this workspace (definitely reset). REVIEW = an unrecognized\n`;
  body += `long Google id a future skill hardcoded (confirm what it is, then reset or keep).\n\n`;
  if (!riskFindings.length) {
    body += `_none_\n\n`;
  } else {
    for (const r of riskFindings) {
      body += `- **${r.known ? 'KNOWN' : 'REVIEW'}** \`${r.file}:${r.line}\` -> \`${r.id}\`${r.known ? ` (${r.label})` : ''}\n`;
      body += `  - \`${r.text}\`\n`;
    }
    body += `\n`;
  }

  for (const cat of ['DELETE', 'RESET', 'FLAG']) {
    body += `## ${cat} (${buckets[cat].length})\n\n`;
    if (!buckets[cat].length) { body += `_none_\n\n`; continue; }
    for (const { f, hits } of buckets[cat]) body += `- \`${f}\`  (${hits})\n`;
    body += `\n`;
  }
  // STRIP — non-cold-outbound / personal / branded content the .gitignore does NOT exclude (skill Step 3.5)
  const stripped = [];
  for (const f of gitTrackedFiles()) {
    const hit = STRIP_PATHS.find((p) => p.re.test(f));
    if (hit) stripped.push({ f, why: hit.why });
  }
  body += `## STRIP — non-cold-outbound / personal / branded (${stripped.length})\n\n`;
  body += `A fork carries ONLY the cold-outbound system. Remove these; the .gitignore does NOT exclude them.\n`;
  body += `KEEP the cold-outbound machine (cold email + cold calling + cold LinkedIn DM + infra). When a name is ambiguous, read the SKILL.md frontmatter: e.g. lifecycle-copy STAYS (cold follow-up / pre-call nurture copy, not marketing).\n\n`;
  if (!stripped.length) body += `_none_\n\n`;
  else for (const { f, why } of stripped) body += `- \`${f}\`  (${why})\n`;
  body += `\n`;

  writeOut(opt('--out', null), body, 'scan report');
  console.log(`\nSummary: RISK ${buckets.RISK.length} file(s) / ${riskFindings.length} id ref(s) · DELETE ${buckets.DELETE.length} · RESET ${buckets.RESET.length} · FLAG ${buckets.FLAG.length} · STRIP ${stripped.length}`);
}

function runMap() {
  const rows = TOOLS.map((t) => ({ ...t, files: filesForTerms(t.terms) }));
  let body = `# Default-stack wiring map (${path.basename(dir)})\n\n`;
  body += `For each tool: where it is referenced, and what to do on a fork.\n\n`;
  body += `- **default** = part of the portable default stack, keep\n`;
  body += `- **inherited (from the upstream workspace, swap out)** = carried over from the upstream workspace, replace with the new company's choice\n`;
  body += `- **needs-skill** = in the default roster but no skill exists yet (declarative)\n\n`;
  body += `| Tool | Role | Files | Sample references |\n|---|---|---:|---|\n`;
  for (const r of rows) {
    const sample = r.files.slice(0, 6).map((f) => `\`${f}\``).join(', ') + (r.files.length > 6 ? ` … +${r.files.length - 6}` : '');
    body += `| ${r.name} | ${r.role} | ${r.files.length} | ${sample || '_none_'} |\n`;
  }
  const needs = rows.filter((r) => r.role === 'needs-skill');
  body += `\n## Needs a skill before use\n\n`;
  for (const r of needs) body += `- **${r.name}** — ${r.files.length} references today. Build a skill before claiming the system can drive it.\n`;
  writeOut(opt('--out', null), body, 'wiring map');
  console.log(`\nMapped ${rows.length} tools.`);
}

function runPreflight() {
  const checks = [];
  const tryCmd = (label, cmd, a, cwd) => {
    try { return { label, ok: true, out: execFileSync(cmd, a, { cwd: cwd || dir, encoding: 'utf8' }).trim() }; }
    catch (e) { return { label, ok: false, out: (e.stderr || e.message || '').toString().trim() }; }
  };
  checks.push(tryCmd('gh auth', 'gh', ['auth', 'status']));
  checks.push(tryCmd('origin remote', 'git', ['remote', 'get-url', 'origin']));
  checks.push(tryCmd('working tree', 'git', ['status', '--short']));
  for (const c of checks) {
    console.log(`\n[${c.ok ? 'OK' : 'CHECK'}] ${c.label}`);
    console.log(c.out.split('\n').slice(0, 8).map((l) => '   ' + l).join('\n'));
  }
}

// ---- dispatch ---------------------------------------------------------------
if (has('--scan')) runScan();
else if (has('--map')) runMap();
else if (has('--preflight')) runPreflight();
else {
  console.log(`new_gtm_workspace.mjs — helper for /new-gtm-workspace
Usage:
  node new_gtm_workspace.mjs --scan  [--dir <path>] [--out scrub-report.md]
  node new_gtm_workspace.mjs --map   [--dir <path>] [--out default-stack-wiring-map.md]
  node new_gtm_workspace.mjs --preflight [--dir <path>]
Read-only. The clone/scrub/repo-create steps are driven (gated) by the skill, not this script.`);
}
