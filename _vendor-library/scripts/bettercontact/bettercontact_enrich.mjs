#!/usr/bin/env node
// bettercontact_enrich.mjs — BetterContact waterfall email/phone enrichment for /email-waterfall.
//
// WHAT THIS IS
//   BetterContact (https://bettercontact.rocks) is a WATERFALL enrichment API: one request
//   fans a contact out across 20+ data providers in sequence until it finds a work email
//   (and optionally a mobile), then runs its own 4-layer verification and — on the
//   pay-per-valid model — only charges a credit when the result passes. That makes it the
//   strong default for filling missing work email on a cold-email campaign slice: it both
//   FINDS and VERIFIES in one async call, so BetterContact-sourced emails do NOT need a
//   second pass through MillionVerifier (don't double-pay).
//
//   It is the per-contact LAYER-2 step in the TAM model: run it on the campaign slice that
//   is going live, never across the whole TAM up front.
//
// API CONTRACT (grounded on doc.bettercontact.rocks, 2026-06-13)
//   Base: https://app.bettercontact.rocks/api/v2   ·   Auth: header  X-API-Key: <key>
//   - GET  /account                 → { success, credits_left, email }            (free; balance + auth check)
//   - POST /async                   → { success, id, message }                    (submit 1-100 contacts)
//       body: { data:[ {first_name,last_name,company, company_domain?, linkedin_url?,
//                       custom_fields:{uuid,list_name?}} ],
//               enrich_email_address:bool, enrich_phone_number:bool, webhook?, process_flow? }
//   - GET  /async/{id}              → { id, status, credits_consumed, credits_left,
//                                       summary:{total,valid,catch_all,catch_all_safe,
//                                                catch_all_not_safe,undeliverable,not_found},
//                                       data:[ {enriched, email_provider, contact_first_name,
//                                               contact_last_name, contact_email_address,
//                                               contact_email_address_status, contact_gender,
//                                               contact_job_title, ...phone when requested} ] }
//       status:  "in_progress"  →  "terminated"  (waterfall takes minutes, not seconds — poll)
//
//   EMAIL-STATUS MAP (BetterContact → the /email-waterfall verification gate vocabulary):
//       deliverable        → valid       (sendable)
//       catch_all_safe     → catch_all   (review — not sent by default)
//       catch_all_not_safe → risky       (review)
//       undeliverable      → invalid     (drop)
//       not_found / blank  → no_email
//   Only `valid` is send-safe. The script writes both the raw BC status (`bc_email_status`)
//   and the mapped gate status (`email_status`) so /email-waterfall's gate keeps working
//   exactly as for any other provider.
//
//   DEFENSIVE JOIN: results are joined back to input rows by custom_fields.uuid when
//   BetterContact echoes it; otherwise by batch index with a strict count check; a
//   mismatch is flagged, never silently mis-joined.
//
// RUNTIME: zero dependencies (native fetch + fs), Node 18+. The key is NEVER printed —
// only a masked last-4 tail. Resumable: submitted batch ids are journaled to a state file.
//
// USAGE
//   node bettercontact_enrich.mjs --credits                 # GET /account: balance + auth (zero spend)
//   node bettercontact_enrich.mjs --in leads.csv --dry-run  # parse + map + cost preview, NO submit (zero spend)
//   node bettercontact_enrich.mjs --in leads.csv --out leads.bettercontact.csv
//   node bettercontact_enrich.mjs --in leads.csv --phone --limit 1   # 1-row live proof, email + phone
//
// FLAGS
//   --in <path>          input CSV (needs first_name,last_name and one of company/company_domain/linkedin_url)
//   --out <path>         output CSV (default: <in>.bettercontact.csv)
//   --phone              also enrich mobile (enrich_phone_number=true; default OFF — email only)
//   --no-email           do NOT enrich email (default email ON)
//   --all                FINDER on every named row, incl. rows that already have a usable email
//                        (alias of --refind-existing; ⚠ double-charges — see verify-first below)
//   --refind-existing    re-FIND an email even when the row already has a usable one. DEFAULT IS OFF:
//                        rows that already have an email go to the verify-first step (Deliverable.co —
//                        scripts/deliverable_verify.mjs), NOT the finder — finding a new email for them double-charges
//                        (/email-waterfall Verification Doctrine). The script writes those rows to
//                        <out>.verify-first.csv, and nameless rows to <out>.needs-names.csv.
//   --batch <n>          contacts per request, max 100 (default 100) — BetterContact's per-request cap
//   --concurrency <n>    batches processed in PARALLEL, 1–12 (default 4). BetterContact runs multiple
//                        per-account batches at once (~3.5x effective on probe), so this is the real
//                        speed lever for lists >100. Higher than ~5 yields little (server caps it) and
//                        risks the on_hold throttle. Set 1 to force the old strictly-sequential behavior.
//   --limit <n>          only process the first n eligible rows (testing)
//   --max-credits <n>    HARD STOP: abort before submitting if eligible rows exceed n (cost gate)
//   --poll-interval <s>  poll cadence, default 20
//   --poll-timeout <s>   per-batch max wait before giving up, default 900
//   --state <path>       resume journal (default: <out>.state.json)
//   --dry-run            preview only — never submits, spends nothing
//   --json               also print a machine-readable JSON summary
//
// EXIT CODES: 0 = ok / credits ok ; 1 = key missing/auth fail / no input ; 2 = network/abort.
//
// TESTING (no key, no spend): set BC_MOCK=1 (and BC_MOCK_PHONE=1 for phone) to drive the full
// submit→poll→join→map→write path against canned responses — it alternates uuid-echo vs
// index-fallback per batch and cycles all five email statuses, for offline/regression checks.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(__dirname, '.env');
const BASE = 'https://app.bettercontact.rocks/api/v2';

// ── env ──────────────────────────────────────────────────────────────────────
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
const ENV = { ...loadEnvFile(ENV_PATH), ...process.env };
const KEY = ENV.BETTERCONTACT_API_KEY || ENV.BETTER_CONTACT_API_KEY || '';

// ── args ─────────────────────────────────────────────────────────────────────
function argVal(name, def) {
  const i = process.argv.indexOf(name);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : def;
}
const has = (f) => process.argv.includes(f);
const CREDITS_ONLY = has('--credits') || has('--selftest');
const DRY = has('--dry-run');
const AS_JSON = has('--json');
const DO_PHONE = has('--phone');
const DO_EMAIL = !has('--no-email');
const ENRICH_ALL = has('--all');
// Verify-first override: re-FIND an email even when the row already has a usable one. Normally
// the verify-first step (Deliverable.co — scripts/deliverable_verify.mjs) owns existing-email rows — see the
// /email-waterfall Verification Doctrine — and finding a new email for them double-charges.
const REFIND_EXISTING = ENRICH_ALL || has('--refind-existing');
const IN = argVal('--in');
const OUT = argVal('--out', IN ? `${IN.replace(/\.csv$/i, '')}.bettercontact.csv` : null);
const STATE = argVal('--state', OUT ? `${OUT.replace(/\.csv$/i, '')}.state.json` : null);
const BATCH = Math.min(100, Math.max(1, parseInt(argVal('--batch', '100'), 10) || 100));
const LIMIT = parseInt(argVal('--limit', '0'), 10) || 0;
const MAX_CREDITS = parseInt(argVal('--max-credits', '0'), 10) || 0;
const POLL_INTERVAL = (parseInt(argVal('--poll-interval', '20'), 10) || 20) * 1000;
const POLL_TIMEOUT = (parseInt(argVal('--poll-timeout', '900'), 10) || 900) * 1000;
const CONCURRENCY = Math.min(12, Math.max(1, parseInt(argVal('--concurrency', '4'), 10) || 4));

function mask(k) {
  if (!k) return '(missing)';
  if (k.length <= 4) return '****';
  return `…${k.slice(-4)} (len ${k.length})`;
}
function log(s = '') { if (!AS_JSON) console.log(s); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── HTTP ─────────────────────────────────────────────────────────────────────
// BC_MOCK=1 returns canned responses so the full submit→poll→join→map→write path
// can be exercised offline (no key, no spend). It alternates uuid-echo vs no-echo
// per batch to drive BOTH join modes, and cycles all five email statuses.
const MOCK = !!process.env.BC_MOCK;
let MOCK_N = 0;
const MOCK_STORE = new Map();
function mockApi(method, p, body) {
  if (method === 'POST' && p === '/async') {
    const id = `mock-${MOCK_N}`;
    MOCK_STORE.set(id, { uids: (body.data || []).map((d) => d.custom_fields?.uuid), echo: MOCK_N % 2 === 0 });
    MOCK_N++;
    return { status: 200, json: { success: true, id, message: 'mock processing' }, text: '' };
  }
  if (method === 'GET' && p.startsWith('/async/')) {
    const st = MOCK_STORE.get(p.slice('/async/'.length)) || { uids: [], echo: true };
    const statuses = ['deliverable', 'not_found', 'catch_all_not_safe', 'catch_all_safe', 'undeliverable'];
    const data = st.uids.map((uid, i) => {
      const s = statuses[i % statuses.length];
      const found = s !== 'not_found';
      const item = { enriched: found, email_provider: found ? 'mock-provider' : '',
        contact_first_name: 'Mock', contact_last_name: `R${i}`,
        contact_email_address: found ? `mock${i}@example.com` : '',
        contact_email_address_status: found ? s : '', contact_job_title: 'Tester' };
      if (process.env.BC_MOCK_PHONE) item.contact_phone_number = '+15555550100';
      if (st.echo) item.custom_fields = { uuid: uid };
      return item;
    });
    return { status: 200, json: { id: p.slice('/async/'.length), status: 'terminated',
      credits_consumed: data.filter((d) => d.enriched).length, credits_left: 999,
      summary: { total: data.length }, data }, text: '' };
  }
  if (method === 'GET' && p === '/account') return { status: 200, json: { success: true, credits_left: 999, email: 'mock@bettercontact' }, text: '' };
  return { status: 404, json: null, text: 'mock: unknown route' };
}
async function api(method, p, body) {
  if (MOCK) return mockApi(method, p, body);
  const headers = { 'X-API-Key': KEY, 'Content-Type': 'application/json' };
  const opts = { method, headers };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${p}`, opts);
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* non-JSON */ }
  return { status: res.status, json, text };
}

// ── minimal RFC-4180 CSV ───────────────────────────────────────────────────────
function parseCSV(text) {
  const rows = [];
  let field = '', row = [], inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false;
      } else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c === '\r') { /* swallow; \n handles the break */ }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  if (!rows.length) return { headers: [], records: [] };
  const headers = rows[0].map((h) => h.trim());
  const records = rows.slice(1)
    .filter((r) => r.length && !(r.length === 1 && r[0] === ''))
    .map((r) => Object.fromEntries(headers.map((h, j) => [h, r[j] ?? ''])));
  return { headers, records };
}
function csvCell(v) {
  const s = v == null ? '' : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function toCSV(headers, records) {
  const lines = [headers.map(csvCell).join(',')];
  for (const rec of records) lines.push(headers.map((h) => csvCell(rec[h])).join(','));
  return lines.join('\r\n') + '\r\n';
}

// ── status mapping (BetterContact → /email-waterfall gate vocabulary) ──────────
function mapStatus(bc) {
  switch (String(bc || '').toLowerCase()) {
    case 'deliverable': return 'valid';
    case 'catch_all_safe': return 'catch_all';
    case 'catch_all_not_safe': return 'risky';
    case 'undeliverable': return 'invalid';
    case 'not_found':
    case '': return 'no_email';
    default: return 'unknown';
  }
}
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
function pickPhone(item) {
  for (const k of Object.keys(item)) {
    if (/phone/i.test(k) && item[k]) return String(item[k]);
  }
  return '';
}

// ── credits / connectivity ─────────────────────────────────────────────────────
async function checkCredits() {
  // Auth probe: a deliberately bad key must NOT return a healthy 200 balance.
  let authEnforced = null;
  try {
    const bad = await fetch(`${BASE}/account`, { headers: { 'X-API-Key': 'totally-invalid-selftest-key' } });
    authEnforced = bad.status === 401 || bad.status === 403 || bad.status === 406;
  } catch { authEnforced = null; }

  const r = await api('GET', '/account');
  log('BetterContact API self-test');
  log('─'.repeat(64));
  log(`Key:  ${mask(KEY)}`);
  log(`Base: ${BASE}`);
  log(`Auth enforced (bad key rejected): ${authEnforced === null ? '? (network)' : authEnforced ? '✓' : '⚠ unexpected'}`);
  log('');
  const ok = r.status >= 200 && r.status < 300 && r.json;
  if (ok) {
    log(`✓ Authenticated. Account: ${r.json.email || '(n/a)'}`);
    log(`  Credits left: ${r.json.credits_left ?? '(n/a)'}`);
  } else if (r.status === 401 || r.status === 403) {
    log(`✗ Auth failed (HTTP ${r.status}). Check BETTERCONTACT_API_KEY in scripts/.env.`);
  } else {
    log(`⚠ HTTP ${r.status}: ${r.text.slice(0, 200)}`);
  }
  if (AS_JSON) console.log(JSON.stringify({ key: mask(KEY), base: BASE, authEnforced, status: r.status, account: r.json }, null, 2));
  return ok;
}

// ── enrich ─────────────────────────────────────────────────────────────────────
function rowName(rec) {
  return {
    first_name: (rec.first_name || rec.firstName || '').trim(),
    last_name: (rec.last_name || rec.lastName || '').trim(),
    company: (rec.company || rec.company_name || rec.companyName || '').trim(),
    company_domain: (rec.company_domain || rec.domain || rec.website || '').trim(),
    linkedin_url: (rec.linkedin_url || rec.linkedinUrl || rec.linkedin || '').trim(),
    email: (rec.email || '').trim(),
  };
}
// Verify-first doctrine (/email-waterfall): BetterContact is the FINDER. A row that ALREADY has a
// usable work email belongs to the VERIFY-FIRST step (Deliverable.co — scripts/deliverable_verify.mjs), NOT the finder —
// sending it here makes BetterContact discover a *new* email and charge for it, so you double-pay and
// never checked the address you had. Such rows are excluded UNLESS verify-first already rejected the
// email (email_status invalid/risky/...) or the operator passes --refind-existing. A nameless row can't
// be found at all (the finder keys on first+last+domain) → re-discover (DiscoLike generate-contacts / people-DB).
const FAILED_VERIFY = new Set(['invalid', 'risky', 'catch_all', 'catch_all_not_safe', 'unknown', 'undeliverable', 'no_email', 'fail', 'failed', 'bad']);
function hasUsableEmail(rec) {
  const n = rowName(rec);
  if (!n.email || !EMAIL_RE.test(n.email)) return false;
  const st = (rec.email_status || rec.bc_email_status || '').trim().toLowerCase().replace(/\s+/g, '_');
  return !FAILED_VERIFY.has(st); // a failed-verify email is NOT usable → the finder may re-find it
}
// Why a row is NOT finder-eligible: '' = eligible; 'no_name' / 'no_company' / 'has_email'.
function skipReason(rec) {
  const n = rowName(rec);
  if (!n.first_name || !n.last_name) return 'no_name';
  if (!n.company && !n.company_domain && !n.linkedin_url) return 'no_company';
  if (!REFIND_EXISTING && hasUsableEmail(rec)) return 'has_email';
  return '';
}
function eligible(rec) { return skipReason(rec) === ''; }

// BetterContact lifecycle: not_started (queued) → in_progress (running) → terminated (done).
// Poll through every non-terminal state; only a status OUTSIDE this set ends the wait
// (terminated, or an unexpected error/failed status — so we stop rather than hang).
// BetterContact's LIVE API returns the running state as "in progress" (with a SPACE), not "in_progress".
// Normalize whitespace→underscore before matching so the poller doesn't treat "still running" as "done"
// and bail with an empty result (the bug that made real runs look like 0 found / 0 credits). 2026-06-15.
// "on_hold" (API: "on hold") = BetterContact throttle/queue state when too many batches are in flight at once
// (seen 2026-06-15 when 3 runs ran concurrently). It is NON-terminal — keep polling; the real fix is to run
// sequentially with smaller batches so you never trip the hold. Give held runs a long --poll-timeout.
const NONTERMINAL = new Set(['not_started', 'in_progress', 'processing', 'queued', 'pending', 'running', 'started', 'on_hold', 'onhold', 'held', 'waiting']);
const TERMINAL = new Set(['terminated', 'completed', 'complete', 'done', 'finished', 'failed', 'error']);
async function pollBatch(id) {
  const deadline = Date.now() + POLL_TIMEOUT;
  let last = '';
  while (Date.now() < deadline) {
    const r = await api('GET', `/async/${id}`);
    if (r.status === 401 || r.status === 403) throw new Error(`auth failed on poll (HTTP ${r.status})`);
    const st = r.json && r.json.status ? String(r.json.status).toLowerCase().trim().replace(/\s+/g, '_') : '';
    if (st) last = st;
    // Terminal ONLY when the status is a known terminal value (or unknown-but-non-nonterminal WITH data present).
    // A non-terminal status — incl. the space-form "in progress" now normalized to "in_progress" — keeps polling.
    if (r.json && st && !NONTERMINAL.has(st) && (TERMINAL.has(st) || (Array.isArray(r.json.data) && r.json.data.length))) return r.json;
    await sleep(POLL_INTERVAL);
  }
  throw new Error(`poll timeout after ${POLL_TIMEOUT / 1000}s for batch ${id} (last status: ${last || 'unknown'})`);
}

function joinResults(batchUids, resultData) {
  // Prefer custom_fields.uuid echo; fall back to index when counts line up.
  const byUid = new Map();
  let echoed = 0;
  for (const item of resultData || []) {
    const uid = item?.custom_fields?.uuid ?? item?.uuid;
    if (uid != null) { byUid.set(String(uid), item); echoed++; }
  }
  if (echoed === resultData.length && echoed > 0) {
    return { mode: 'uuid', get: (uid, idx) => byUid.get(String(uid)) };
  }
  if (resultData.length === batchUids.length) {
    return { mode: 'index', get: (uid, idx) => resultData[idx] };
  }
  // Last resort: uuid where present, else index; flagged in summary.
  return { mode: 'mixed', get: (uid, idx) => byUid.get(String(uid)) ?? resultData[idx] };
}

(async () => {
  if (!KEY) { console.error('✗ BETTERCONTACT_API_KEY missing from scripts/.env (see .env.example).'); process.exit(1); }

  if (CREDITS_ONLY) { const ok = await checkCredits(); process.exitCode = ok ? 0 : 1; return; }

  if (!IN) { console.error('✗ --in <leads.csv> required (or use --credits for a connectivity check).'); process.exit(1); }
  if (!fs.existsSync(IN)) { console.error(`✗ input not found: ${IN}`); process.exit(1); }

  const { headers, records } = parseCSV(fs.readFileSync(IN, 'utf8'));
  // Assign a stable per-row uid for the join.
  records.forEach((rec, i) => { rec.__bc_uid = (rec.uid || rec.uuid || rec.id || `row-${i}`); });

  let pending = records.filter(eligible);
  if (LIMIT) pending = pending.slice(0, LIMIT);

  // Verify-first triage: the rows the FINDER must NOT touch, surfaced (never silently dropped).
  const skippedHasEmail = records.filter((r) => skipReason(r) === 'has_email'); // → verify-first step
  const skippedNoName = records.filter((r) => skipReason(r) === 'no_name');     // → re-discover real names
  // Sidecars are local file writes (no spend) so the operator can act on each bucket.
  if (OUT && skippedHasEmail.length) {
    try { fs.writeFileSync(OUT.replace(/\.csv$/i, '') + '.verify-first.csv', toCSV(headers, skippedHasEmail)); } catch { /* non-fatal */ }
  }
  if (OUT && skippedNoName.length) {
    try { fs.writeFileSync(OUT.replace(/\.csv$/i, '') + '.needs-names.csv', toCSV(headers, skippedNoName)); } catch { /* non-fatal */ }
  }
  const refoundCount = REFIND_EXISTING ? pending.filter(hasUsableEmail).length : 0;
  const outStem = OUT ? path.basename(OUT).replace(/\.csv$/i, '') : '';

  const flags = [DO_EMAIL && 'email', DO_PHONE && 'phone'].filter(Boolean).join(' + ') || '(none!)';
  log('BetterContact enrichment (FINDER — finds emails for named rows that have none) — cost preview');
  log('─'.repeat(64));
  log(`Input rows           : ${records.length}`);
  log(`Finder-eligible      : ${pending.length}  (real name + no usable email)`);
  log(`→ verify-first queue : ${skippedHasEmail.length}  (already have an email — VERIFY with Deliverable.co, do NOT finder them${skippedHasEmail.length && OUT ? `; wrote ${outStem}.verify-first.csv → run: node deliverable_verify.mjs ${outStem}.verify-first.csv` : ''})`);
  log(`→ needs real names   : ${skippedNoName.length}  (no real first+last — re-discover via generate-contacts / people-DB${skippedNoName.length && OUT ? `; wrote ${outStem}.needs-names.csv` : ''})`);
  log(`Enriching            : ${flags}`);
  log(`Batches              : ${Math.ceil(pending.length / BATCH)} × up to ${BATCH}`);
  log(`Credit model         : pay-per-VALID — BetterContact charges only when a result passes its verification.`);
  log(`Upper-bound credits  : ${pending.length}${DO_PHONE ? ' (email) + phone billed separately per plan' : ''}`);
  if (refoundCount) {
    log(`⚠ --refind-existing/--all is ON: ${refoundCount} row(s) that ALREADY have a usable email are being RE-FOUND by the finder — this violates verify-first and double-charges. Verify those with Deliverable.co (deliverable_verify.mjs) instead unless you have a specific reason.`);
  }
  log('');

  if (!DO_EMAIL && !DO_PHONE) { console.error('✗ nothing to enrich: --no-email given without --phone.'); process.exit(1); }
  if (MAX_CREDITS && pending.length > MAX_CREDITS) {
    console.error(`⛔ ${pending.length} eligible rows exceed --max-credits ${MAX_CREDITS}. Aborting before any spend. Raise the gate or trim the slice.`);
    process.exit(2);
  }
  if (!pending.length) { log('Nothing to enrich. Writing pass-through copy.'); }

  if (DRY) { log('DRY RUN — no request submitted, nothing spent.'); if (AS_JSON) console.log(JSON.stringify({ input: records.length, eligible: pending.length, verify_first: skippedHasEmail.length, needs_names: skippedNoName.length, refound_existing: refoundCount, batches: Math.ceil(pending.length / BATCH), email: DO_EMAIL, phone: DO_PHONE }, null, 2)); process.exit(0); }

  // ── pre-submit balance guard — never create "on hold" calls (2026-06-15) ──────
  // BetterContact parks enrichment as "on hold" the instant credits hit 0, and held calls do
  // NOT auto-retrigger when you top up later — they must be manually Processed in the API
  // Cockpit (and Processing still needs credits). So never submit a run the live balance can't
  // cover. Pay-per-valid means the eligible count is an UPPER bound (you often won't spend it
  // all), so this WARNS when balance < eligible but only ABORTS at a hard 0 (where every
  // submitted contact would go straight to the on-hold queue). Uses process.exitCode (not
  // process.exit) after the network call to avoid the Windows libuv exit assertion.
  if (pending.length) {
    const acct = await api('GET', '/account');
    const left = acct.json && typeof acct.json.credits_left === 'number' ? acct.json.credits_left : null;
    if (left === 0) {
      console.error('⛔ BetterContact balance is 0 credits. Submitting now would only create "on hold" calls that will NOT auto-run when you top up — you would have to manually Process the queue. Top up (or wait for the monthly reset), then re-run. Aborted; nothing submitted.');
      process.exitCode = 2; return;
    }
    if (left != null && left < pending.length) {
      log(`⚠ Balance ${left} credit(s) < ${pending.length} eligible row(s). Pay-per-valid means you may not spend them all, but if credits reach 0 mid-run the remaining contacts go "on hold" (manual Process, no auto-retrigger). Consider topping up, or cap this run with --max-credits ${left}.`);
    } else if (left != null) {
      log(`Balance OK: ${left} credit(s) available for up to ${pending.length} eligible row(s).`);
    }
  }

  // resume journal
  let state = { batches: [] };
  if (STATE && fs.existsSync(STATE)) { try { state = JSON.parse(fs.readFileSync(STATE, 'utf8')); } catch { /* fresh */ } }

  const listName = path.basename(IN).replace(/\.csv$/i, '');
  const resultByUid = new Map();
  let creditsConsumed = 0, creditsLeft = null, joinWarnings = 0, runHadError = false;
  const tally = { valid: 0, catch_all: 0, risky: 0, invalid: 0, no_email: 0, unknown: 0, enriched: 0 };

  // ── batch worker pool ──────────────────────────────────────────────────────
  // BetterContact processes multiple per-account batches in PARALLEL (probed 2026-06-16: 6
  // concurrent batches ran with NO on_hold/queue and ~3.5x effective parallelism). So instead of
  // the old strict submit→poll→next loop (wall-clock = sum of every batch), keep up to CONCURRENCY
  // batches in flight at once. Server-side effective concurrency tops out ~3-4, so the default (4)
  // captures the speedup without tripping the throttle. --concurrency 1 restores sequential mode.
  // Polls stay well under the 60 req/min API limit (CONCURRENCY polls per --poll-interval).
  const totalBatches = Math.ceil(pending.length / BATCH);
  let nextIdx = 0, aborted = false;
  const writeState = () => { if (STATE) fs.writeFileSync(STATE, JSON.stringify(state, null, 2)); };

  async function processBatch(b) {
    const slice = pending.slice(b * BATCH, b * BATCH + BATCH);
    const uids = slice.map((r) => r.__bc_uid);
    let entry = state.batches.find((x) => x.index === b);

    if (!entry || !entry.id) {
      const payload = {
        data: slice.map((rec) => {
          const n = rowName(rec);
          const item = { first_name: n.first_name, last_name: n.last_name,
            custom_fields: { uuid: String(rec.__bc_uid), list_name: listName } };
          // `company` is a documented required field — send the best available value, but
          // OMIT it rather than send an empty string (linkedin-only rows lean on linkedin_url).
          const companyVal = n.company || n.company_domain;
          if (companyVal) item.company = companyVal;
          if (n.company_domain) item.company_domain = n.company_domain;
          if (n.linkedin_url) item.linkedin_url = n.linkedin_url;
          return item;
        }),
        enrich_email_address: DO_EMAIL,
        enrich_phone_number: DO_PHONE,
      };
      const r = await api('POST', '/async', payload);
      if (r.status === 401 || r.status === 403) { console.error(`✗ auth failed on submit (HTTP ${r.status}). Check the key.`); aborted = true; runHadError = true; return; }
      if (!r.json || !r.json.id) { console.error(`✗ submit failed for batch ${b + 1}/${totalBatches} (HTTP ${r.status}): ${r.text.slice(0, 200)}`); runHadError = true; return; }
      entry = { index: b, id: r.json.id, uids };
      state.batches.push(entry);            // push + write are synchronous → atomic vs other workers
      writeState();
      log(`Submitted batch ${b + 1}/${totalBatches} → id ${r.json.id} (${slice.length} contacts)`);
    } else {
      log(`Resuming batch ${b + 1}/${totalBatches} → id ${entry.id}`);
    }

    const result = await pollBatch(entry.id);
    if (typeof result.credits_consumed === 'number') creditsConsumed += result.credits_consumed;
    if (typeof result.credits_left === 'number') creditsLeft = result.credits_left;
    const join = joinResults(uids, result.data || []);
    if (join.mode !== 'uuid' && join.mode !== 'index') joinWarnings++;
    slice.forEach((rec, idx) => {
      const item = join.get(rec.__bc_uid, idx) || {};
      const rawEmail = (item.contact_email_address || '').trim();
      const rawStatus = item.contact_email_address_status || (rawEmail ? '' : 'not_found');
      const mapped = rawEmail ? mapStatus(rawStatus) : 'no_email';
      rec.bc_email = rawEmail;
      rec.bc_email_status = rawStatus;
      rec.bc_email_provider = item.email_provider || '';
      rec.bc_enriched = item.enriched ? 'true' : 'false';
      if (DO_PHONE) rec.bc_phone = pickPhone(item);
      // Fill canonical columns the rest of /email-waterfall reads, without clobbering a pre-existing email.
      const existing = (rec.email || '').trim();
      const hadEmail = EMAIL_RE.test(existing);
      if (!hadEmail) {
        rec.email = rawEmail;                              // '' when BC found nothing
        rec.email_status = rawEmail ? mapped : 'no_email'; // every enriched row gets a definite status
      } else if (rawEmail && rawEmail.toLowerCase() === existing.toLowerCase()) {
        rec.email_status = mapped;                         // BC verified the SAME address → adopt its verdict
      } else if (!rec.email_status) {
        rec.email_status = 'needs_verification';           // keep existing email; still owes a verify pass
      }
      if (item.enriched) tally.enriched++;
      tally[mapped] = (tally[mapped] || 0) + 1;
    });
    log(`  Batch ${b + 1}/${totalBatches} done (status ${result.status}). join=${join.mode}${join.mode === 'mixed' ? ' ⚠' : ''}`);
  }

  async function worker() {
    while (!aborted) {
      const b = nextIdx++;
      if (b >= totalBatches) return;
      try {
        await processBatch(b);
      } catch (e) {
        // One batch failing (poll timeout / transient network) must not kill the others — its id
        // is journaled, so a re-run resumes it; its rows stay unenriched (no_email) this pass.
        log(`⚠ batch ${b + 1}/${totalBatches} errored: ${e.message} — left for resume; continuing.`);
        runHadError = true;
      }
    }
  }

  const poolSize = Math.min(CONCURRENCY, Math.max(1, totalBatches));
  if (totalBatches > 1) log(`Processing ${totalBatches} batches, ${poolSize} in parallel (BetterContact runs per-account batches concurrently).`);
  await Promise.all(Array.from({ length: poolSize }, () => worker()));

  // mark rows that were kept (already had email) but never went through BC
  for (const rec of records) {
    if (rec.email && EMAIL_RE.test(rec.email.trim()) && !rec.email_status) rec.email_status = 'needs_verification';
  }

  const addCols = ['email', 'email_status', 'bc_email', 'bc_email_status', 'bc_email_provider', 'bc_enriched']
    .concat(DO_PHONE ? ['bc_phone'] : []);
  const outHeaders = [...headers.filter((h) => h !== '__bc_uid'),
    ...addCols.filter((c) => !headers.includes(c))];
  fs.writeFileSync(OUT, toCSV(outHeaders, records));

  log('');
  log('─'.repeat(64));
  log(`Wrote ${records.length} rows → ${OUT}`);
  log(`Enriched (BC found data): ${tally.enriched}`);
  log(`  valid ${tally.valid} · catch_all ${tally.catch_all} · risky ${tally.risky} · invalid ${tally.invalid} · no_email ${tally.no_email}${tally.unknown ? ` · unknown ${tally.unknown}` : ''}`);
  log(`Credits consumed this run: ${creditsConsumed}${creditsLeft != null ? ` · credits left: ${creditsLeft}` : ''}`);
  if (joinWarnings) log(`⚠ ${joinWarnings} batch(es) used a fallback join — verify a sample of bc_email against the input names.`);
  log('Next: /list-quality-scorecard, then the locked platform upload. Only `valid` rows are send-safe; route catch_all/risky/invalid to leads.review.csv.');
  if (AS_JSON) console.log(JSON.stringify({ out: OUT, input: records.length, eligible: pending.length, creditsConsumed, creditsLeft, tally, joinWarnings, hadError: runHadError, aborted }, null, 2));
  if (runHadError) log(`⚠ Some batches did not complete (auth/submit/timeout). Re-run the same command to resume them from the journal.`);
  process.exitCode = aborted ? 1 : (runHadError ? 2 : 0);
})().catch((e) => { console.error(`✗ ${e.message}`); process.exitCode = 2; });
