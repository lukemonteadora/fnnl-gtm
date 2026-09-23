#!/usr/bin/env node
// research_routing_check.mjs: ledger-based audit that a PRIMARY research pass was actually
// LOGGED for each research-skill run. This is the telemetry behind the
// "Research Routing: HARD RULE (Claude native deep research primary)" rule in ai-model-routing.md.
// Zero dependencies (native fs + JSON), Node 18+. Reads the run-log table in
// ../api-balance-ledger.md (scripts/api-balance-ledger.md).
//
// SUPERSEDES perplexity_routing_check.mjs (operator directive 2026-07-02): the primary research
// engine is now the Claude native /deep-research fan-out harness, NOT Perplexity. So a run is
// COMPLIANT when it logged a recognized PRIMARY provenance for its research pass:
//   - claude-deep-research / claude_deep_research  (the /deep-research harness,
//                              anthropic-skills:deep-research), or
//   - claude-subagent-fanout  (its declared fallback: a logged flat fan-out of 4 to 8 research
//                              sub-agents from the same brief, used when the harness is unavailable).
// The third_party_ai opt-out and any third-party primary were retired by the no-AI-API rule
// (operator directive 2026-09-22). A run whose ledger lines name ANY third-party AI provider FLAGS,
// even when the same cell also names a Claude primary or says "deep research": under the rule no
// third-party AI provider is a valid route, as primary or as helper.
// It FLAGS any research-skill run that logged NEITHER, i.e. a run that appears to have skipped a
// real primary pass (drifted to a bare inline WebSearch / a data tool's per-row AI pass / nothing).
//
// AUDITABILITY NOTE: Claude native /deep-research is Anthropic-billed, so it does NOT move any
// third-party credit balance. The ledger line + activity-log entry are what keep the run auditable
// in-repo (which primary ran), even though the dollars now sit on the Anthropic bill. That is the
// operator-accepted trade-off of opting into the native path.
//
// WHAT IT CAN SEE:  research-skill runs that LEFT a ledger line.
// WHAT IT CANNOT SEE: a research run that wrote NO ledger line at all. The per-skill "append a
//                   ledger line" requirement is what makes a run visible here.
//
// Usage:
//   node research_routing_check.mjs                          # full audit, table + summary; exit 1 if any FLAG
//   node research_routing_check.mjs --client ExampleCo        # filter to one client (substring, case-insensitive)
//   node research_routing_check.mjs --since 2026-06-01       # only ledger rows on/after this date
//   node research_routing_check.mjs --skill offer-intelligence --client Northwind --json
//                                                            # targeted self-check → {ok,...}; exit 0 ok / 1 violation
//   node research_routing_check.mjs --ledger <path>          # override the ledger path
//   node research_routing_check.mjs --json                   # full audit as JSON

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── the skills whose runs REQUIRE a logged PRIMARY research pass ──
// (matches where the enforced gate was placed in the SKILL.md files). Edit here if the
// research-skill set changes.
const RESEARCH_SKILLS = [
  'lead-source-strategy',
  'offer-intelligence',
  'data-point-discovery',
  'campaign-strategy',
  'auto-research-public',
  'icp-onboarding',
];
// A recognized PRIMARY research provenance (no-AI-API rule, operator directive 2026-09-22):
// the Claude native /deep-research harness, logged as claude-deep-research (or the older ledger
// phrasing "Claude /deep-research (primary), <n> sub-agents"), or its declared fallback, a flat
// Claude sub-agent fan-out logged as claude-subagent-fanout.
const PRIMARY_RE = /deep[-_ ]?research|claude[-_ ]?deep|claude[-_ ]?sub-?agent[-_ ]?fan-?out/i;
// Third-party AI labels. Any match FLAGS the run, checked BEFORE the primary match, so a cell such
// as "o3-deep-research" or "claude-deep-research + a third-party gap-fill" never passes.
// "parallel" is matched only as the vendor, not as in "6 parallel sub-agents" or "run in parallel".
// (This line names the retired vendors on purpose: it is the deny list.)
const THIRD_PARTY_RE = /perplexity|pplx|\bsonar|openai|\bo\d(?:-mini|-pro)?[-_ ]?deep[-_ ]?research|gpt|(?<!in\s)\bparallel\b(?![-_\s]*(?:research\s+)?(?:sub-?agents?|agents?|fan-?out|workers?|passes|runs?|calls?)\b)|\bgrok|\bx[-_.]?ai\b|deepseek|gemini|openrouter/i;
const thirdPartyLabels = (providers) => {
  const hits = String(providers).match(new RegExp(THIRD_PARTY_RE.source, 'gi')) || [];
  return [...new Set(hits.map(h => h.toLowerCase()))];
};

// ── args ──
function parseArgs(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (!t.startsWith('--')) continue;
    const name = t.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) a[name] = true;
    else { a[name] = next; i++; }
  }
  return a;
}
const args = parseArgs(process.argv.slice(2));
const JSON_OUT = !!args.json;

function die(msg, code = 1) { process.stderr.write(msg + '\n'); process.exit(code); }

// ── locate + read the ledger ──
const ledgerPath = args.ledger
  ? path.resolve(String(args.ledger))
  : path.resolve(__dirname, '..', 'api-balance-ledger.md');
if (!fs.existsSync(ledgerPath)) die(`ledger not found: ${ledgerPath}`, 2);
const raw = fs.readFileSync(ledgerPath, 'utf8');

// ── parse the run-log table rows: | Date | Skill | Provider(s) | Tokens | USD | Exact/Est | Balance | ──
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const rows = [];
for (const line of raw.split(/\r?\n/)) {
  const l = line.trim();
  if (!l.startsWith('|')) continue;
  const cells = l.split('|').map(c => c.trim());
  if (cells.length && cells[0] === '') cells.shift();
  if (cells.length && cells[cells.length - 1] === '') cells.pop();
  if (cells.length < 3) continue;
  const [date, skill, providers] = cells;
  if (!DATE_RE.test(date)) continue;            // skips header + separator + non-run rows
  rows.push({ date, skill, providers, usd: cells[4] || '' });
}

// ── client extraction: last parenthetical in the Skill cell, e.g. "...(ExampleCo re-onboard)" ──
function clientOf(skillCell) {
  const m = skillCell.match(/\(([^)]*)\)\s*$/);
  const rawC = m ? m[1].trim() : '(unlabelled)';
  const norm = rawC.toLowerCase().split(/[\s/]+/)[0] || rawC.toLowerCase();
  return { raw: rawC, norm };
}
function matchedResearchSkill(skillCell) {
  const s = skillCell.toLowerCase();
  return RESEARCH_SKILLS.find(rs => s.includes(rs)) || null;
}

// ── filters ──
const sinceRaw = args.since && args.since !== true ? String(args.since) : null;
const clientFilter = args.client && args.client !== true ? String(args.client).toLowerCase() : null;
const skillFilter = args.skill && args.skill !== true ? String(args.skill).toLowerCase() : null;

// ── group research-skill rows by (client, skill) into "runs" ──
const groups = new Map(); // key -> { clientRaw, clientNorm, skill, rows:[], dates:Set, providers:Set, hasPrimary }
for (const r of rows) {
  const skill = matchedResearchSkill(r.skill);
  if (!skill) continue;
  if (skillFilter && !skill.includes(skillFilter)) continue;
  const c = clientOf(r.skill);
  if (clientFilter && !(c.raw.toLowerCase().includes(clientFilter) || c.norm.includes(clientFilter))) continue;
  if (sinceRaw && r.date < sinceRaw) continue;
  const key = c.norm + '|' + skill;
  if (!groups.has(key)) groups.set(key, { clientRaw: c.raw, clientNorm: c.norm, skill, rows: [], dates: new Set(), providers: new Set(), primarySeen: false, thirdParty: new Set(), hasPrimary: false });
  const g = groups.get(key);
  g.rows.push(r);
  g.dates.add(r.date);
  r.providers.split(/[+,]/).forEach(p => { const t = p.trim(); if (t) g.providers.add(t); });
  const tp = thirdPartyLabels(r.providers);
  tp.forEach(t => g.thirdParty.add(t));
  if (!tp.length && PRIMARY_RE.test(r.providers)) g.primarySeen = true;
}
// hasPrimary = a COMPLIANT primary: a Claude primary was logged and no line of the run names a
// third-party AI provider. Everything below reads this one field.
for (const g of groups.values()) g.hasPrimary = g.primarySeen && g.thirdParty.size === 0;

const runGroups = [...groups.values()].sort((a, b) =>
  a.clientNorm.localeCompare(b.clientNorm) || a.skill.localeCompare(b.skill));

// ── per-client coverage: does each client have >=1 primary research line anywhere? ──
const clientCoverage = new Map(); // norm -> { raw, anyPrimary, researchRuns }
for (const g of runGroups) {
  if (!clientCoverage.has(g.clientNorm)) clientCoverage.set(g.clientNorm, { raw: g.clientRaw, anyPrimary: false, researchRuns: 0 });
  const cc = clientCoverage.get(g.clientNorm);
  cc.researchRuns++;
  if (g.hasPrimary) cc.anyPrimary = true;
}

const flagged = runGroups.filter(g => !g.hasPrimary);

// ── targeted self-check mode (--skill, typically --json): answer for ONE skill's latest run ──
if (skillFilter) {
  const latest = runGroups
    .map(g => ({ g, lastDate: [...g.dates].sort().pop() }))
    .sort((a, b) => (a.lastDate < b.lastDate ? 1 : -1))[0];
  if (!latest) {
    const res = { ok: false, violation: true, reason: 'no logged ledger line found for this research-skill run',
      skill: skillFilter, client: clientFilter || '(any)', detail: 'No ledger row matched: a research run that wrote NO line is invisible here; append the primary-research line per /ai-model-routing.' };
    if (JSON_OUT) console.log(JSON.stringify(res, null, 2)); else console.log(`VIOLATION: ${res.reason} (skill=${res.skill}, client=${res.client})`);
    process.exit(1);
  }
  const g = latest.g;
  const res = {
    ok: g.hasPrimary, violation: !g.hasPrimary,
    skill: g.skill, client: g.clientRaw, last_date: latest.lastDate,
    providers: [...g.providers],
    third_party: [...g.thirdParty],
    detail: g.hasPrimary
      ? 'Primary research pass logged for this run (claude-deep-research or its fallback claude-subagent-fanout).'
      : g.thirdParty.size
        ? `Third-party AI provider logged (${[...g.thirdParty].join(', ')}): FLAG. The no-AI-API rule allows no third-party provider, as primary or helper. Re-run the research on the /deep-research primary (or the claude-subagent-fanout fallback) and log it.`
        : 'No primary research pass logged: FLAG. Run the /deep-research primary (or the claude-subagent-fanout fallback) and log it (no third-party primary is valid under the no-AI-API rule).',
  };
  if (JSON_OUT) console.log(JSON.stringify(res, null, 2));
  else console.log(`${g.hasPrimary ? 'PASS' : 'FLAG'}: ${g.skill} (${g.clientRaw}), providers: ${[...g.providers].join(', ') || 'none'}`);
  process.exit(g.hasPrimary ? 0 : 1);
}

// ── full audit ──
if (JSON_OUT) {
  console.log(JSON.stringify({
    ledger: ledgerPath,
    research_runs: runGroups.length,
    passed: runGroups.length - flagged.length,
    flagged: flagged.length,
    runs: runGroups.map(g => ({ status: g.hasPrimary ? 'PASS' : 'FLAG', client: g.clientRaw, skill: g.skill,
      dates: [...g.dates].sort(), providers: [...g.providers], third_party: [...g.thirdParty] })),
    client_coverage: [...clientCoverage.values()].map(c => ({ client: c.raw, research_runs: c.researchRuns,
      primary_logged: c.anyPrimary })),
  }, null, 2));
  process.exit(flagged.length ? 1 : 0);
}

const pad = (s, n) => String(s).padEnd(n);
console.log(`Research routing audit: ${ledgerPath}`);
console.log(`(scans logged research-skill runs; cannot see a research run that wrote no ledger line)`);
console.log(`(primary = claude-deep-research, or its fallback claude-subagent-fanout; any third-party AI label FLAGS; no-AI-API rule, 2026-09-22)\n`);
if (!runGroups.length) {
  console.log('No research-skill runs found in the ledger for the given filters.');
  process.exit(0);
}
console.log(`${pad('STATUS', 7)} ${pad('CLIENT', 22)} ${pad('RESEARCH SKILL', 22)} ${pad('DATES', 24)} PROVIDERS`);
console.log('-'.repeat(110));
for (const g of runGroups) {
  console.log(`${pad(g.hasPrimary ? 'PASS' : 'FLAG', 7)} ${pad(g.clientRaw, 22)} ${pad(g.skill, 22)} ${pad([...g.dates].sort().join(','), 24)} ${[...g.providers].join(', ')}`);
}
console.log('\nPer-client primary-research coverage:');
for (const c of clientCoverage.values()) {
  console.log(`  ${c.anyPrimary ? '[ok]  ' : '[FLAG]'} ${pad(c.raw, 24)} ${c.researchRuns} research run(s), compliant primary logged: ${c.anyPrimary ? 'YES' : 'NO'}`);
}
console.log(`\nSummary: ${runGroups.length} research-skill run(s), ${runGroups.length - flagged.length} PASS, ${flagged.length} FLAG.`);
if (flagged.length) {
  console.log('FLAG = no primary research pass logged for that research-skill run: likely routing drift');
  console.log("(a bare inline WebSearch or a data tool's per-row AI pass is not a primary). Run the /deep-research primary and log it.");
  console.log('A run whose ledger lines name a third-party AI provider also FLAGS, even beside a Claude primary: the no-AI-API rule allows none.');
}
process.exit(flagged.length ? 1 : 0);
