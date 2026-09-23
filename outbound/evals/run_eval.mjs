#!/usr/bin/env node
// run_eval.mjs: the Claude-native benchmark runner for FNNL's repeated GTM jobs. It never calls a model.
//
// Under the no-AI-API rule the only models in this workspace are Claude Code's own: the session and its
// sub-agents (the Agent tool's `model` setting: haiku, sonnet, or the session's own model when left out).
// A script cannot launch sub-agents, so a run has three steps:
//   1. prepare  (this script) builds one packet per case from the canonical prompt and writes the fan-out plan.
//   2. the SESSION launches Agent-tool sub-agents on the tier under test; each answers its own packets and
//      writes one answer file per item.
//   3. grade    (this script) runs the suite's deterministic checks over the saved answers and reports pass
//      rates per check, optionally against an earlier run, and appends the table to BENCHMARKS.md on --log.
//
// Usage:
//   node outbound/evals/run_eval.mjs prepare <suite> --tier <haiku|sonnet|session> [--session-model <name>]
//                                    [--example] [--repeat <n>] [--batch-size <n>] [--label "<why this run>"]
//   node outbound/evals/run_eval.mjs grade <suite> <run-id> [--compare <baseline-run-id>] [--log]
//                                    [--allow-missing] [--label "<why>"] [--verbose]
//   node outbound/evals/run_eval.mjs list [<suite>]
//   suites: voc-extraction, competitor-card, company-fit
//
// Everything it writes stays under outbound/evals/results/ (gitignored, local only), except the dated table
// that `grade --log` appends to BENCHMARKS.md. No network, no keys, no dependencies beyond node itself.
// Exit codes: 0 done, 1 usage or setup error, 3 graded but some answers are missing (a partial run).

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUTBOUND = path.resolve(HERE, '..');
const REPO = path.resolve(OUTBOUND, '..');
const RESULTS = path.join(HERE, 'results');
const BENCHMARKS = path.join(HERE, 'BENCHMARKS.md');
const SUITES = ['voc-extraction', 'competitor-card', 'company-fit'];
const TIERS = ['haiku', 'sonnet', 'session'];
// The checks where a candidate must MATCH the baseline (README keep rule); every other check allows 5 points.
const HALLUCINATION_CHECKS = ['verbatim', 'grounding', 'blank_discipline'];
const WITHIN_POINTS = 5;
const MAX_AGENTS_PER_WAVE = 10;
const GROUND_TRUTH = ['client', 'operator'];

const yaml = require('./lib/yaml-lite.js');
const checks = require('./lib/checks.js');
const prompts = require('./lib/prompt.js');

// ── args ─────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const FLAGS_WITH_VALUE = new Set(['tier', 'session-model', 'repeat', 'batch-size', 'label', 'compare']);
const positional = [];
const flags = {};
for (let k = 0; k < argv.length; k++) {
  const a = argv[k];
  if (a.startsWith('--')) {
    const name = a.slice(2);
    if (FLAGS_WITH_VALUE.has(name)) {
      const v = argv[k + 1];
      if (v === undefined || v.startsWith('--')) usage(`--${name} needs a value`);
      flags[name] = v; k++;
    } else flags[name] = true;
  } else positional.push(a);
}

function usage(msg) {
  if (msg) console.error(`error: ${msg}\n`);
  console.error([
    'usage:',
    '  node outbound/evals/run_eval.mjs prepare <suite> --tier <haiku|sonnet|session> [--session-model <name>] [--example] [--repeat <n>] [--batch-size <n>] [--label "<why>"]',
    '  node outbound/evals/run_eval.mjs grade <suite> <run-id> [--compare <baseline-run-id>] [--log] [--allow-missing] [--label "<why>"] [--verbose]',
    '  node outbound/evals/run_eval.mjs list [<suite>]',
    `  suites: ${SUITES.join(', ')}`,
  ].join('\n'));
  process.exit(1);
}
function die(msg) { console.error(`error: ${msg}`); process.exit(1); }

// ── helpers ──────────────────────────────────────────────────────────────────
const sha256 = (text) => crypto.createHash('sha256').update(text).digest('hex');
const short = (hash) => (hash ? hash.slice(0, 12) : 'none');
const rel = (from, to) => path.relative(from, to).split(path.sep).join('/');
const pct = (pass, n) => (n ? Math.round((1000 * pass) / n) / 10 : null);
const nowUtc = () => new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC';

function readYaml(file) {
  try { return yaml.parse(fs.readFileSync(file, 'utf8'), rel(REPO, file)); }
  catch (e) { die(e.message); }
}

function loadSuite(suite) {
  if (!SUITES.includes(suite)) usage(`unknown suite "${suite}"`);
  const dir = path.join(HERE, suite);
  const cfg = readYaml(path.join(dir, 'suite.yaml'));
  if (!cfg || cfg.suite !== suite) die(`${suite}/suite.yaml must say suite: ${suite}`);
  if (typeof prompts[cfg.builder] !== 'function') die(`${suite}/suite.yaml builder "${cfg.builder}" is not a lib/prompt.js export`);
  if (!Array.isArray(cfg.checks) || cfg.checks.length === 0) die(`${suite}/suite.yaml lists no checks`);
  for (const c of cfg.checks) {
    if (!c || !c.metric || typeof checks[c.fn] !== 'function') die(`${suite}/suite.yaml check ${JSON.stringify(c)} does not name a lib/checks.js function`);
  }
  return { dir, cfg };
}

function globToRegex(glob) {
  return new RegExp('^' + glob.split('*').map(s => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$');
}

function slug(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60).replace(/-+$/, '');
}

// Load the cases a run uses: every file matching the suite pattern except the example file, or, with
// --example, the example file alone (synthetic cases never mix into a benchmark).
function loadCases(dir, cfg, example) {
  const pattern = globToRegex(cfg.cases?.pattern || 'cases*.yaml');
  const exampleFile = cfg.cases?.example || 'cases.example.yaml';
  const files = example
    ? [exampleFile].filter(f => fs.existsSync(path.join(dir, f)))
    : fs.readdirSync(dir).filter(f => pattern.test(f) && f !== exampleFile).sort();
  if (files.length === 0) {
    die(example
      ? `${cfg.suite} has no ${exampleFile} (no synthetic smoke-test cases ship for this suite)`
      : `${cfg.suite} has no case files matching ${cfg.cases?.pattern || 'cases*.yaml'} yet. Add real cases first (README, "Adding a case"), or use --example for a runner smoke test.`);
  }
  const cases = [];
  const fileHashes = {};
  const seen = new Map();
  for (const f of files) {
    const full = path.join(dir, f);
    const text = fs.readFileSync(full, 'utf8');
    fileHashes[f] = sha256(text);
    const doc = readYaml(full);
    if (doc === null) continue;
    if (!Array.isArray(doc)) die(`${cfg.suite}/${f} must be a YAML list of cases`);
    doc.forEach((c, idx) => {
      const where = `${cfg.suite}/${f} case ${idx + 1}`;
      if (!c || typeof c !== 'object' || !c.vars || typeof c.vars !== 'object') die(`${where} has no vars block`);
      const id = c.id !== undefined && c.id !== null ? String(c.id) : slug(c.description || '');
      if (!id) die(`${where} needs an id: (or a description to derive one from)`);
      if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) die(`${where} id "${id}" may hold only lowercase letters, digits and dashes`);
      if (seen.has(id)) die(`${where} repeats the case id "${id}" (first seen in ${seen.get(id)}); give one of them an explicit id:`);
      seen.set(id, where);
      for (const v of cfg.required_vars || []) {
        if (c.vars[v] === undefined || c.vars[v] === null || c.vars[v] === '') die(`${where} (${id}) is missing vars.${v}`);
      }
      cases.push({ id, description: c.description || '', file: f, vars: c.vars });
    });
  }
  if (cases.length === 0) die(`${cfg.suite}: the case files hold no cases`);
  return { cases, fileHashes, files };
}

function goldStatus(cases) {
  const out = {};
  for (const c of cases) { const s = c.vars.gold?.label_status || 'unlabelled'; out[s] = (out[s] || 0) + 1; }
  return out;
}
const goldText = (g) => Object.entries(g).map(([k, v]) => `${v} ${k}`).join(', ');

function nextRunId(suiteDir, tier, example) {
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
  const base = `${stamp}-${tier}${example ? '-example' : ''}`;
  let id = base; let n = 2;
  while (fs.existsSync(path.join(suiteDir, id))) id = `${base}-${n++}`;
  return id;
}

// ── prepare ──────────────────────────────────────────────────────────────────
function prepare(suite) {
  const { dir, cfg } = loadSuite(suite);
  const tier = flags.tier;
  if (!TIERS.includes(tier)) usage(`--tier must be one of ${TIERS.join(', ')}`);
  const sessionModel = typeof flags['session-model'] === 'string' ? flags['session-model'] : null;
  if (tier === 'session' && !sessionModel) usage('--tier session needs --session-model <name> (the model the session runs on, e.g. what /model shows), so the log says which model answered');
  const example = !!flags.example;
  const repeat = flags.repeat ? parseInt(flags.repeat, 10) : 1;
  const batchSize = flags['batch-size'] ? parseInt(flags['batch-size'], 10) : 5;
  if (!(repeat >= 1 && repeat <= 10)) usage('--repeat must be 1 to 10');
  if (!(batchSize >= 1 && batchSize <= 50)) usage('--batch-size must be 1 to 50');

  const { cases, fileHashes } = loadCases(dir, cfg, example);

  const suiteResults = path.join(RESULTS, suite);
  const runId = nextRunId(suiteResults, tier, example);
  const runDir = path.join(suiteResults, runId);
  const packetsDir = path.join(runDir, 'packets');
  const outputsDir = path.join(runDir, 'outputs');
  fs.mkdirSync(packetsDir, { recursive: true });
  fs.mkdirSync(outputsDir, { recursive: true });

  // Build every case's messages once; the canonical prompt text each case saw is hashed per file.
  const promptHashes = {};
  const built = cases.map(c => {
    let messages;
    try { messages = prompts[cfg.builder]({ vars: c.vars }); }
    catch (e) { die(`${suite} case ${c.id}: could not build its prompt (${e.message})`); }
    const file = rel(REPO, prompts.promptFile(cfg.builder, c.vars));
    promptHashes[file] = sha256(messages[0].content);
    return { ...c, messages };
  });
  const promptHash = sha256(Object.entries(promptHashes).sort().map(([f, h]) => `${f}:${h}`).join('\n'));

  // Items: one per case per repeat. A batch holds items of ONE repeat only, so no sub-agent answers the same
  // case twice (each repeat is an independent answer).
  const items = [];
  const batches = [];
  for (let r = 1; r <= repeat; r++) {
    const round = built.map(c => ({ item_id: repeat > 1 ? `${c.id}.r${r}` : c.id, case_id: c.id, repeat: r, c }));
    items.push(...round);
    for (let k = 0; k < round.length; k += batchSize) batches.push(round.slice(k, k + batchSize).map(x => x.item_id));
  }

  for (const it of items) {
    const packet = {
      item_id: it.item_id,
      suite,
      run_id: runId,
      answer_file: path.join(outputsDir, `${it.item_id}.txt`),
      how_to_answer: 'messages[0] (role system) is your complete instruction for this item; messages[1] (role user) is the input. Write only the answer those instructions ask for into answer_file: no commentary, no explanation, nothing else.',
      messages: it.c.messages,
    };
    fs.writeFileSync(path.join(packetsDir, `${it.item_id}.json`), JSON.stringify(packet, null, 2) + '\n');
  }

  // The answer key stays out of the packets: grade reads it from this snapshot, which sub-agents never open.
  fs.writeFileSync(path.join(runDir, 'cases.snapshot.json'),
    JSON.stringify(built.map(c => ({ id: c.id, description: c.description, file: c.file, vars: c.vars })), null, 2) + '\n');

  const manifest = {
    suite,
    run_id: runId,
    tier,
    session_model: sessionModel,
    agent_model_param: tier === 'session' ? null : tier,
    created: new Date().toISOString(),
    label: typeof flags.label === 'string' ? flags.label : '',
    example,
    repeat,
    batch_size: batchSize,
    builder: cfg.builder,
    prompt_hash: promptHash,
    prompt_files: promptHashes,
    case_files: fileHashes,
    checks_js_hash: sha256(fs.readFileSync(path.join(HERE, 'lib', 'checks.js'), 'utf8')),
    gold_status: goldStatus(cases),
    case_ids: cases.map(c => c.id),
    items: items.map(it => ({ item_id: it.item_id, case_id: it.case_id, repeat: it.repeat, packet: `packets/${it.item_id}.json`, output: `outputs/${it.item_id}.txt` })),
    batches,
  };
  fs.writeFileSync(path.join(runDir, 'MANIFEST.json'), JSON.stringify(manifest, null, 2) + '\n');

  const fanout = fanoutText(manifest, runDir, packetsDir);
  fs.writeFileSync(path.join(runDir, 'FANOUT.md'), fanout);
  console.log(fanout);
  console.error(`\nprepared ${items.length} packets in ${rel(REPO, runDir)}/ (FANOUT.md holds the plan above)`);
}

function fanoutText(m, runDir, packetsDir) {
  const modelLine = m.tier === 'session'
    ? `Leave \`model\` out of every Agent call, so each sub-agent inherits the session's model (recorded as ${m.session_model}). If the session is not on that model right now, stop and prepare a new run.`
    : `Pass \`model: "${m.tier}"\` on every Agent call.`;
  const waves = Math.ceil(m.batches.length / MAX_AGENTS_PER_WAVE);
  const lines = [];
  lines.push(`# Fan-out plan: ${m.suite}, run ${m.run_id}`);
  lines.push('');
  lines.push(`This script never calls a model. The session runs this benchmark by launching Agent-tool sub-agents (subagent_type "general-purpose"), one per batch below, per \`/personalization-subagent-pattern\`: disjoint packet lists, one answer file per item, nothing shared between agents.`);
  lines.push('');
  lines.push(`- **Tier under test: ${m.tier}.** ${modelLine}`);
  lines.push(`- **Items:** ${m.items.length} (${m.case_ids.length} cases x ${m.repeat} repeat${m.repeat > 1 ? 's' : ''}) in ${m.batches.length} batch${m.batches.length > 1 ? 'es' : ''} of up to ${m.batch_size}. Launch up to ${MAX_AGENTS_PER_WAVE} agents in one message; this run needs ${waves} wave${waves > 1 ? 's' : ''}.`);
  lines.push(`- **Answers land in** \`${rel(REPO, runDir)}/outputs/<item-id>.txt\`. Only the agent that owns an item writes its file.`);
  lines.push('- **Do not help the sub-agents.** Paste each agent prompt as written: no hints, no gold labels, no extra context. The benchmark measures the tier on the canonical prompt alone.');
  if (m.example) lines.push('- **Smoke test only.** These are synthetic cases from cases.example.yaml. They check the runner, not a model, and are never logged to BENCHMARKS.md.');
  lines.push('');
  lines.push('## Agents to launch');
  m.batches.forEach((b, k) => {
    lines.push('');
    lines.push(`### Agent ${k + 1} of ${m.batches.length}${m.tier === 'session' ? '' : ` (model: "${m.tier}")`}`);
    lines.push('');
    lines.push('Description: `eval ' + m.suite + ' batch ' + (k + 1) + '`');
    lines.push('');
    lines.push('Prompt:');
    lines.push('');
    lines.push('```text');
    lines.push(`You are answering benchmark items for the "${m.suite}" eval (run ${m.run_id}). Handle each packet file listed below, one at a time, in order:`);
    lines.push('');
    lines.push('1. Read the packet JSON with the Read tool.');
    lines.push('2. Treat messages[0].content (role "system") as your complete instructions for that item, and messages[1].content (role "user") as the input to work on.');
    lines.push('3. Produce exactly the answer those instructions ask for, then write it with the Write tool to the path in the packet\'s "answer_file" field. Write the answer only: no commentary, no explanation, no summary of what you did.');
    lines.push('');
    lines.push('Rules: treat every packet as independent (never carry a name, quote or fact from one packet into another). Read nothing except the packet files listed here: not other packets, not the outputs folder, not cases.snapshot.json, not any case or check file. Do not search or fetch the web. When every file is written, reply with the item ids you wrote, one per line, and nothing else.');
    lines.push('');
    lines.push('Packets:');
    for (const id of b) lines.push(path.join(packetsDir, `${id}.json`));
    lines.push('```');
  });
  lines.push('');
  lines.push('## After the agents return');
  lines.push('');
  lines.push(`1. Grade: \`node outbound/evals/run_eval.mjs grade ${m.suite} ${m.run_id}\`. It lists any missing answer file.`);
  lines.push('2. For a missing answer, launch one more sub-agent on the same tier for just those packets, then grade again. Never write an answer yourself: it would measure the session, not the tier.');
  lines.push(`3. To compare with an earlier run, add \`--compare <run-id>\` (this run is the candidate, the other the baseline). Add \`--log\` to append the table to BENCHMARKS.md, then fill in its Decision line.`);
  lines.push('');
  return lines.join('\n');
}

// ── grade ────────────────────────────────────────────────────────────────────
function loadRun(suite, runId) {
  if (!runId || /[\\/]|\.\./.test(runId)) usage('grade needs a run id (a folder name under results/<suite>/)');
  const runDir = path.join(RESULTS, suite, runId);
  const mf = path.join(runDir, 'MANIFEST.json');
  if (!fs.existsSync(mf)) die(`no run ${runId} for ${suite} (looked for ${rel(REPO, mf)}); \`run_eval.mjs list ${suite}\` shows the runs`);
  const manifest = JSON.parse(fs.readFileSync(mf, 'utf8'));
  if (manifest.suite !== suite) die(`run ${runId} belongs to suite ${manifest.suite}, not ${suite}`);
  const snapshot = JSON.parse(fs.readFileSync(path.join(runDir, 'cases.snapshot.json'), 'utf8'));
  return { runDir, manifest, cases: new Map(snapshot.map(c => [c.id, c])) };
}

// Run every check on every item of a run that has an answer on disk. Checks come from the CURRENT suite.yaml
// and lib/checks.js, so a run and its baseline are always graded by the same rules.
function gradeRun(run, cfg) {
  const items = [];
  for (const it of run.manifest.items) {
    const file = path.join(run.runDir, it.output);
    if (!fs.existsSync(file)) { items.push({ ...it, missing: true, results: {} }); continue; }
    const output = fs.readFileSync(file, 'utf8');
    const vars = run.cases.get(it.case_id)?.vars;
    if (!vars) die(`run ${run.manifest.run_id}: case ${it.case_id} is not in its cases.snapshot.json`);
    const results = {};
    for (const c of cfg.checks) {
      try { results[c.metric] = checks[c.fn](output, { vars }); }
      catch (e) { results[c.metric] = { pass: false, score: 0, reason: `check threw: ${e.message}` }; }
    }
    items.push({ ...it, missing: false, results });
  }
  return items;
}

function summarize(items, metrics, caseFilter) {
  const use = items.filter(it => !caseFilter || caseFilter.has(it.case_id));
  const scored = use.filter(it => !it.missing);
  const out = { items: use.length, scored: scored.length, missing: use.length - scored.length, all: 0, metric: {} };
  for (const m of metrics) out.metric[m] = { pass: 0, n: 0 };
  for (const it of scored) {
    let allPass = true;
    for (const m of metrics) {
      const r = it.results[m];
      out.metric[m].n++;
      if (r && r.pass) out.metric[m].pass++; else allPass = false;
    }
    if (allPass) out.all++;
  }
  return out;
}

function cell(pass, n) { return n ? `${pass}/${n} (${pct(pass, n)}%)` : 'n/a'; }
function delta(a, b) {
  if (!a.n || !b.n) return 'n/a';
  const d = Math.round((pct(a.pass, a.n) - pct(b.pass, b.n)) * 10) / 10;
  return `${d > 0 ? '+' : ''}${d} pts`;
}

function runLabel(m) { return m.tier === 'session' ? `session (${m.session_model})` : m.tier; }

function tableFor(rows, metrics, deltaRow) {
  const head = `| Run | Tier | Items | All checks pass | ${metrics.join(' | ')} | Missing answers |`;
  const sep = `|---|---|---|---|${metrics.map(() => '---').join('|')}|---|`;
  const body = rows.map(({ m, s }) => `| \`${m.run_id}\` | ${runLabel(m)} | ${s.items} | ${cell(s.all, s.scored)} | ${metrics.map(k => cell(s.metric[k].pass, s.metric[k].n)).join(' | ')} | ${s.missing} |`);
  if (deltaRow) {
    const [a, b] = deltaRow;
    body.push(`| Delta (candidate minus baseline) | | | ${delta({ pass: a.all, n: a.scored }, { pass: b.all, n: b.scored })} | ${metrics.map(k => delta(a.metric[k], b.metric[k])).join(' | ')} | |`);
  }
  return [head, sep, ...body].join('\n');
}

// The README keep rule, applied to the suite half only: the candidate matches (or beats) the baseline on the
// hallucination checks and is within 5 points on the rest. The live 20-row agreement check is the other half.
function keepVerdict(cand, base, metrics, candManifest, baseManifest) {
  const fails = [];
  for (const m of metrics) {
    const a = cand.metric[m]; const b = base.metric[m];
    if (!a.n || !b.n) { fails.push(`${m} has no scored items`); continue; }
    const d = pct(a.pass, a.n) - pct(b.pass, b.n);
    if (HALLUCINATION_CHECKS.includes(m)) { if (d < 0) fails.push(`${m} is ${Math.abs(Math.round(d * 10) / 10)} pts below the baseline (must match)`); }
    else if (d < -WITHIN_POINTS) fails.push(`${m} is ${Math.abs(Math.round(d * 10) / 10)} pts below the baseline (limit ${WITHIN_POINTS})`);
  }
  const notes = [];
  if (Math.min(candManifest.repeat, baseManifest.repeat) < 3) notes.push('decide on --repeat 3 runs, single runs wobble');
  const gt = (g) => Object.entries(g).every(([k]) => GROUND_TRUTH.includes(k));
  if (!gt(candManifest.gold_status) || !gt(baseManifest.gold_status)) notes.push('some gold labels are not client or operator labels, so a small gap is not a reason on its own');
  if (cand.missing || base.missing) notes.push('answers are missing, so this is a partial comparison');
  const verdict = fails.length
    ? `FAILS on this suite: ${fails.join('; ')}.`
    : 'PASSES on this suite. The 20-row agreement check on live work (/ai-model-routing) must also pass before anything changes.';
  return verdict + (notes.length ? ` Caveats: ${notes.join('; ')}.` : '');
}

function grade(suite, runId) {
  const { cfg } = loadSuite(suite);
  const metrics = cfg.checks.map(c => c.metric);
  const run = loadRun(suite, runId);
  const items = gradeRun(run, cfg);

  let base = null; let shared = null; let notShared = [];
  if (typeof flags.compare === 'string') {
    base = loadRun(suite, flags.compare);
    base.items = gradeRun(base, cfg);
    const a = new Set(run.manifest.case_ids); const b = new Set(base.manifest.case_ids);
    shared = new Set([...a].filter(x => b.has(x)));
    notShared = [...new Set([...a, ...b])].filter(x => !shared.has(x));
    if (shared.size === 0) die(`runs ${runId} and ${flags.compare} share no case ids`);
  }

  const cand = summarize(items, metrics, shared);
  const rows = [{ m: run.manifest, s: cand }];
  let baseSum = null;
  if (base) { baseSum = summarize(base.items, metrics, shared); rows.push({ m: base.manifest, s: baseSum }); }
  const table = tableFor(rows, metrics, base ? [cand, baseSum] : null);

  const out = [];
  const missing = items.filter(it => it.missing);
  if (missing.length) out.push(`WARNING: ${missing.length} of ${items.length} answers are missing, so this grade is PARTIAL. Missing: ${missing.map(it => it.item_id).join(', ')}`, '');
  if (run.manifest.example) out.push('Smoke test on synthetic cases (cases.example.yaml): this checks the runner, not a model.', '');
  out.push(`## ${suite}: run ${runId}, tier ${runLabel(run.manifest)}, ${run.manifest.case_ids.length} cases x ${run.manifest.repeat} repeat${run.manifest.repeat > 1 ? 's' : ''}${run.manifest.label ? `, "${run.manifest.label}"` : ''}`);
  out.push('');
  out.push(`Gold labels: ${goldText(run.manifest.gold_status)}. Prompt hash: ${short(run.manifest.prompt_hash)}.`);
  if (base) {
    const samePrompt = base.manifest.prompt_hash === run.manifest.prompt_hash;
    out.push(`Baseline: \`${base.manifest.run_id}\` (tier ${runLabel(base.manifest)}, prompt ${samePrompt ? 'unchanged' : `changed: ${short(base.manifest.prompt_hash)} -> ${short(run.manifest.prompt_hash)}`}). Compared on the ${shared.size} shared cases${notShared.length ? `; left out: ${notShared.join(', ')}` : ''}.`);
  }
  out.push('');
  out.push(table);
  let verdict = null;
  if (base) { verdict = keepVerdict(cand, baseSum, metrics, run.manifest, base.manifest); out.push('', `Keep rule: ${verdict}`); }

  // Failure detail: every failed check with its reason (the first 40 unless --verbose).
  const fails = [];
  for (const it of items) for (const m of metrics) { const r = it.results[m]; if (r && !r.pass) fails.push(`- ${it.item_id} · ${m}: ${r.reason}`); }
  if (fails.length) {
    out.push('', `Failed checks (${fails.length}):`);
    out.push(...(flags.verbose ? fails : fails.slice(0, 40)));
    if (!flags.verbose && fails.length > 40) out.push(`- ... ${fails.length - 40} more (use --verbose)`);
  } else if (items.some(it => !it.missing)) out.push('', 'Every check passed on every answered item.');
  console.log(out.join('\n'));

  fs.writeFileSync(path.join(run.runDir, 'GRADE.json'), JSON.stringify({
    graded_at: new Date().toISOString(),
    checks_js_hash: sha256(fs.readFileSync(path.join(HERE, 'lib', 'checks.js'), 'utf8')),
    compared_with: base ? base.manifest.run_id : null,
    summary: cand,
    items: items.map(it => ({ item_id: it.item_id, case_id: it.case_id, repeat: it.repeat, missing: it.missing, results: it.results })),
  }, null, 2) + '\n');

  if (flags.log) {
    if (run.manifest.example) die('not logged: a smoke test on synthetic cases is never a benchmark entry');
    if (missing.length && !flags['allow-missing']) die(`not logged: ${missing.length} ${missing.length === 1 ? 'answer is' : 'answers are'} missing. Rerun those items, or pass --allow-missing to log it marked PARTIAL.`);
    const label = typeof flags.label === 'string' ? flags.label : run.manifest.label;
    const promptFiles = Object.entries(run.manifest.prompt_files).map(([f, h]) => `\`${f}\` ${short(h)}`).join(', ');
    let md = `\n### ${nowUtc()} · ${suite} · tier ${runLabel(run.manifest)} · ${run.manifest.case_ids.length} cases x ${run.manifest.repeat} repeat${run.manifest.repeat > 1 ? 's' : ''}${label ? ` · ${label}` : ''}${missing.length ? ' · PARTIAL' : ''}\n\n`;
    md += `Run: \`results/${suite}/${runId}/\` (local only). Prompt: ${promptFiles}. Gold labels: ${goldText(run.manifest.gold_status)}.`;
    if (base) md += ` Baseline: \`${base.manifest.run_id}\` (tier ${runLabel(base.manifest)}), compared on ${shared.size} shared cases.`;
    md += `\n\n${table}\n`;
    if (verdict) md += `\nKeep rule: ${verdict}\n`;
    md += '\nDecision: _pending review_\n';
    const current = fs.existsSync(BENCHMARKS) ? fs.readFileSync(BENCHMARKS, 'utf8') : '# Benchmark log\n\n## Runs\n';
    const PLACEHOLDER = '\nNo runs logged yet.\n';
    const kept = current.includes(PLACEHOLDER) ? current.replace(PLACEHOLDER, '') : current;
    fs.writeFileSync(BENCHMARKS, kept.replace(/\n*$/, '\n') + md);
    console.error('\nlogged to BENCHMARKS.md: fill in its Decision line.');
  }
  if (missing.length) process.exitCode = 3;
}

// ── list ─────────────────────────────────────────────────────────────────────
function list(suite) {
  const suites = suite ? [suite] : SUITES;
  if (suite && !SUITES.includes(suite)) usage(`unknown suite "${suite}"`);
  let any = false;
  for (const s of suites) {
    const dir = path.join(RESULTS, s);
    if (!fs.existsSync(dir)) continue;
    for (const id of fs.readdirSync(dir).sort()) {
      const mf = path.join(dir, id, 'MANIFEST.json');
      if (!fs.existsSync(mf)) continue;
      const m = JSON.parse(fs.readFileSync(mf, 'utf8'));
      const answered = m.items.filter(it => fs.existsSync(path.join(dir, id, it.output))).length;
      const graded = fs.existsSync(path.join(dir, id, 'GRADE.json'));
      console.log(`${s}  ${id}  tier ${runLabel(m)}  ${answered}/${m.items.length} answered${graded ? ', graded' : ''}${m.example ? ', smoke test' : ''}${m.label ? `  "${m.label}"` : ''}`);
      any = true;
    }
  }
  if (!any) console.log('no runs yet');
}

// ── main ─────────────────────────────────────────────────────────────────────
const [cmd, suiteArg, runArg] = positional;
if (cmd === 'prepare') { if (!suiteArg) usage('prepare needs a suite'); prepare(suiteArg); }
else if (cmd === 'grade') { if (!suiteArg) usage('grade needs a suite'); grade(suiteArg, runArg); }
else if (cmd === 'list') list(suiteArg);
else usage(cmd ? `unknown command "${cmd}"` : null);
