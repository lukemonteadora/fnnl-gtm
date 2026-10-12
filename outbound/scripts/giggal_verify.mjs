#!/usr/bin/env node
/**
 * giggal_verify.mjs: verify every email in a CSV through Giggal (FNNL's email verifier of record, stack-contract.yaml
 * lead_data.email_verification), with a verdict cache so no address is paid for twice. It replaces
 * millionverifier_verify.mjs (kept in the repo, unused) and keeps the same CLI and the same output columns.
 *
 * WHAT IT IS FOR. The verify layer of the list-production flow. It writes the columns
 * `list_waterfall.py record --layer verify` reads, and it works on any one-off CSV too. Node built-ins only.
 *
 * API SHAPE (Giggal developer API, https://api.giggal.ai/v1, Bearer key, replies wrapped as {success, data, meta}):
 *   single verify     POST /verify          {"email": "..."}  -> data = one result (sync)
 *   batch verify      POST /verify-batch    {"emails": [...]} + Idempotency-Key header -> 202, data.jobId (async)
 *   job status        GET  /jobs/:jobId                       -> data.status processing | completed | failed
 *   job results       GET  /jobs/:jobId/results?page=&limit=  -> data.results[], data.pagination {pages}
 *   catch-all check   POST /catchall        {"jobId": "..."} + Idempotency-Key -> data.taskId; 1 credit per
 *                     GET  /catchall/:taskId, /catchall/:taskId/results         catch-all address in that job
 *   credits (free)    GET  /credits                           -> data.balance
 * Limits: 300 requests / 15 min in general, 30 batch creations / 15 min, 50,000 emails per batch, results kept 48 h
 * (HTTP 410 afterwards), HTTP 402 = out of credits, an `unknown` verdict is refunded automatically.
 * Bulk work goes through batch jobs (one submit, a few polls, paged results), not one request per address.
 *
 * KEY. GIGGAL_API_KEY from outbound/scripts/.env, with process.env overriding the file. Sent only in the
 * Authorization header; every message this script prints is still scrubbed of it.
 *
 * GATE MAPPING (the `email_status` column, which every downstream step reads):
 *   deliverable    -> valid       (send file; is_catch_all is true when Giggal flagged the domain catch-all, because on
 *                                  those domains Giggal already scores the mailbox: plausible ones come back
 *                                  deliverable, non-existent ones undeliverable)
 *   undeliverable  -> invalid
 *   unknown        -> unknown     (next finder rung or review; refunded, so it is not cached and a re-run retries it)
 *   accept_all, risky -> catch_all, then resolved through the catch-all check (POST /catchall on the same job):
 *                         verdict valid -> valid, invalid -> invalid. If the check fails the row stays catch_all
 *                         (holdback), never silently valid. --no-catchall-check skips the check.
 *   HTTP 429, HTTP 5xx, a network failure, a timeout, a failed job, a job that outlives --job-timeout-s, or an address
 *   Giggal did not return -> transient: retried with backoff, never cached, and if still failing the row gets gate
 *   `unknown`.
 *
 * RAW STATUS VOCABULARY (the `verifier_raw_status` column). A verdict carries Giggal's own `status` (deliverable |
 * undeliverable | unknown | accept_all | risky). A call that produced no verdict carries one of three names, all listed
 * in provider-routing.yaml layers.verification.transient_raw_statuses, so list_waterfall.py retries them instead of
 * logging a real verdict (keep the two lists in step if either changes):
 *   timeout        the request or the job hit this script's time limit
 *   rate_limited   HTTP 429
 *   error          anything else that returned no verdict
 * The precise reason is in `verifier_detail`. Two more values: `not_verified` (the run stopped before this email was
 * checked) and, for rows never sent, `no_email` (blank) or `malformed` (not a plausible address; gate invalid, no call).
 *
 * COST GUARDS:
 *   - Emails are lowercased and trimmed, and each distinct email is verified ONCE per file.
 *   - A fresh cached verdict (same normalized email, same provider, younger than --max-age-days) is reused, never
 *     re-bought. Transient and unknown outcomes are never cached. Each new verdict is appended as soon as its batch lands.
 *   - THE CACHE IS APPEND-ONLY LIVE STATE. No script rewrites, moves or deletes it, and nobody should by hand: it is
 *     the only record of what was already paid for, and client folders are gitignored with profiles/, so git cannot
 *     bring it back. When the input CSV sits under outbound/profiles/<slug>/, every new verdict is also appended to
 *     that client's own copy, profiles/<slug>/verify-cache.jsonl. Both files are read on each run and the newest
 *     verified_at wins. A shared cache that is missing prints a loud WARNING on stderr. Only provider "giggal" lines
 *     are reused: MillionVerifier-era verdicts in the same files are ignored, not deleted.
 *   - Idempotency: each batch is submitted with a key derived from its exact email list and the UTC date, so a re-run
 *     of a crashed or interrupted run replays the same job instead of paying twice.
 *   - On a fatal error (HTTP 401, 402, 403, 410 or another non-retryable 4xx) the script stops taking new work, still
 *     writes the output with the unchecked rows marked `not_verified`, and exits 1. Paid verdicts are never lost.
 * SPEND: 1 credit per address verified, 1 more per catch-all address when the catch-all check runs, unknown refunded.
 * /api-cost-governance prices the run first; --dry-run gives the counts for that preview.
 *
 * Usage:
 *   node giggal_verify.mjs <input.csv> [options]   verify every email in the CSV
 *   node giggal_verify.mjs <input.csv> --dry-run   count distinct emails, cache hits and paid verifications; no calls
 *   node giggal_verify.mjs --verify <email>        verify one address (spends a credit, skips the cache)
 *   node giggal_verify.mjs --credits               remaining credits (free call)
 * Options:
 *   --email-col <name>      email column (default: auto-detect email / email_address / work_email)
 *   --out <path>            output CSV (default <input>.giggal.csv)
 *   --cache <path>          verdict cache (default ../profiles/_cache/verify-cache.jsonl, gitignored with profiles/).
 *   --no-cache              neither read nor write either cache, mirror included (still dedupes within the file)
 *   --max-age-days <n>      a cached verdict older than this is re-verified (default 90, mirroring provider-routing.yaml
 *                           layers.verification.cache.max_age_days; pass it explicitly if that value changes)
 *   --batch-size <n>        emails per batch job (default 5000, at most 50000)
 *   --concurrency <n>       batch jobs in flight at once (default 2, at most 4; creation is limited to 30 per 15 min)
 *   --poll-ms <n>           delay between job status polls (default 5000)
 *   --job-timeout-s <n>     give up waiting on one job after this long (default 1800); its rows become `timeout`
 *   --retries <n>           retries for a transient outcome (default 3), exponential backoff
 *   --backoff-ms <n>        first backoff delay (default 2000; doubles on each retry)
 *   --no-catchall-check     do not resolve accept_all / risky rows through the catch-all check (they stay catch_all)
 *   --max <n>               verify only the first n data rows (safety cap)
 *   --usd-per-credit <x>    fill `cost_usd` with this estimate for each freshly paid verdict (blank otherwise)
 *
 * Output: the input columns plus email_status (the gate), is_catch_all, verifier_raw_status, verified_by, cache_hit,
 * verified_at, cost_usd, verifier_detail, verifier_subresult (Giggal sub_status), verifier_quality (deliverability
 * score 0 to 100), verifier_free (free_email), verifier_role (role_account).
 * `is_catch_all` is true when Giggal flagged the domain catch-all, false when it did not, blank when it did not say.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = 'https://api.giggal.ai/v1';
const PROVIDER = 'giggal';
const DEFAULT_CACHE = path.resolve(__dirname, '..', 'profiles', '_cache', 'verify-cache.jsonl');
const REQUEST_TIMEOUT_MS = 60000;
const PAGE_LIMIT = 500;

const RAW_TO_GATE = { deliverable: 'valid', undeliverable: 'invalid', unknown: 'unknown', accept_all: 'catch_all', risky: 'catch_all' };
const CACHEABLE_RAW = new Set(['deliverable', 'undeliverable', 'accept_all', 'risky']);
const GATES = new Set(['valid', 'catch_all', 'invalid', 'unknown']);
const TRANSIENT_RAW = new Set(['timeout', 'rate_limited', 'error']);
const JOB_FAILED = new Set(['failed', 'error', 'cancelled', 'canceled']);

class FatalError extends Error {}

// ---- .env loader ----
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

function resolveKey() {
  const env = { ...loadEnvFile(path.join(__dirname, '.env')), ...process.env };
  return (env.GIGGAL_API_KEY || '').trim();
}

function scrub(text, key) {
  let s = String(text);
  if (key) {
    s = s.split(key).join('***');
    const enc = encodeURIComponent(key);
    if (enc !== key) s = s.split(enc).join('***');
  }
  return s;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const normEmail = (e) => (e == null ? '' : String(e).trim().toLowerCase());
const plausibleEmail = (e) => e.length <= 320 && !/\s/.test(e) && /^[^@]+@[^@]+\.[^@]+$/.test(e);
const apiMessage = (data, raw) => String((data && (data.message || data.error)) || raw || '').slice(0, 300);

// ---- one HTTP call ----
// Returns { data, meta } on success or { transient, detail } for a retryable outcome. Throws FatalError otherwise.
async function request(method, pathname, key, { body, idem } = {}) {
  const headers = { Authorization: `Bearer ${key}`, Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (idem) headers['Idempotency-Key'] = idem;
  let res, raw;
  try {
    res = await fetch(`${BASE}${pathname}`, {
      method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    raw = await res.text();
  } catch (e) {
    const name = e?.name || '';
    const isTimeout = name === 'TimeoutError' || name === 'AbortError';
    return { transient: isTimeout ? 'timeout' : 'error',
      detail: scrub(`request failed: ${e?.cause?.code || name} ${e?.message || e}`.trim(), key) };
  }
  if (res.status === 429) return { transient: 'rate_limited', detail: 'HTTP 429' };
  if (res.status >= 500) return { transient: 'error', detail: `HTTP ${res.status}` };
  let data = null;
  try { data = JSON.parse(raw); } catch { data = null; }
  if (res.status === 402) throw new FatalError(scrub('Giggal reports insufficient credits (HTTP 402). Top up the account, then re-run.', key));
  if (res.status === 410) throw new FatalError(scrub('Giggal results expired (HTTP 410, results are kept 48 hours). Re-run the file.', key));
  if (!res.ok || (data && data.success === false)) {
    throw new FatalError(scrub(`Giggal answered HTTP ${res.status}: ${apiMessage(data, raw)}`, key));
  }
  if (!data || typeof data !== 'object' || data.data === undefined) {
    return { transient: 'error', detail: scrub(`HTTP ${res.status}, unrecognized reply: ${raw.slice(0, 200)}`, key) };
  }
  return { data: data.data, meta: data.meta };
}

async function requestRetry(method, pathname, key, opts, stats, init) {
  let last;
  for (let attempt = 0; attempt <= opts.retries; attempt++) {
    if (attempt > 0) await sleep(opts.backoffMs * 2 ** (attempt - 1));
    stats.calls++;
    last = await request(method, pathname, key, init);
    if (!last.transient) return last;
  }
  return { ...last, detail: `${last.detail} (after ${opts.retries + 1} attempt${opts.retries ? 's' : ''})` };
}

// ---- result mapping ----
function toVerdict(r, key) {
  const status = typeof r?.status === 'string' ? r.status.trim().toLowerCase() : '';
  if (!(status in RAW_TO_GATE)) {
    return { transient: 'error', detail: scrub(`unrecognized result for ${r?.email}: status ${r?.status}`, key) };
  }
  const attrs = r.details?.attributes || {};
  const catchAll = attrs.catch_all;
  const inline = typeof r.catch_all_verdict === 'string' ? r.catch_all_verdict.trim().toLowerCase() : '';
  let gate = RAW_TO_GATE[status];
  let detail = r.details?.general?.reason || '';
  if (gate === 'catch_all' && (inline === 'valid' || inline === 'invalid')) {
    gate = inline === 'valid' ? 'valid' : 'invalid';
    detail = `${detail ? detail + '; ' : ''}catch-all check ${inline}`;
  }
  return {
    gate, raw_status: status,
    is_catch_all: gate === 'catch_all' ? 'true' : (typeof catchAll === 'boolean' ? String(catchAll) : ''),
    subresult: r.details?.sub_status ?? '',
    quality: r.deliverability_score ?? '',
    free: attrs.free_email ?? '',
    role: attrs.role_account ?? '',
    detail,
    verified_at: new Date().toISOString(),
    cache_hit: false, fresh: true,
  };
}

const failedRow = (email, last, opts) => ({
  email, gate: 'unknown', raw_status: last.transient, is_catch_all: '', subresult: '', quality: '', free: '', role: '',
  verified_at: '', cache_hit: false, fresh: false, detail: last.detail,
});

// ---- single address ----
async function verifySingle(email, key, opts, stats) {
  const r = await requestRetry('POST', '/verify', key, opts, stats, { body: { email } });
  if (r.transient) return failedRow(email, r, opts);
  const v = toVerdict(r.data, key);
  if (v.transient) return failedRow(email, v, opts);
  return { email, ...v };
}

// ---- batch jobs ----
const idemKey = (kind, emails) =>
  `fnnl-${kind}-${new Date().toISOString().slice(0, 10)}-` + crypto.createHash('sha256').update(emails.join('\n')).digest('hex').slice(0, 40);

async function pollDone(statusPath, key, opts, stats) {
  const deadline = Date.now() + opts.jobTimeoutS * 1000;
  for (;;) {
    const s = await requestRetry('GET', statusPath, key, opts, stats);
    if (s.transient) return { transient: s.transient, detail: s.detail };
    const st = String(s.data?.status || '').toLowerCase();
    if (st === 'completed') return { data: s.data };
    if (JOB_FAILED.has(st)) return { transient: 'error', detail: scrub(`job ${s.data?.jobId || s.data?.taskId || ''} ended ${st}: ${s.data?.error || ''}`.trim(), key) };
    if (Date.now() >= deadline) return { transient: 'timeout', detail: `job still ${st || 'unknown'} after ${opts.jobTimeoutS}s; re-run the same file to pick it up (same idempotency key)` };
    await sleep(opts.pollMs);
  }
}

async function readPages(resultsPath, key, opts, stats) {
  const all = [];
  for (let page = 1; ; page++) {
    const r = await requestRetry('GET', `${resultsPath}?page=${page}&limit=${PAGE_LIMIT}`, key, opts, stats);
    if (r.transient) return { transient: r.transient, detail: r.detail };
    all.push(...(r.data?.results || []));
    const pages = Number(r.data?.pagination?.pages || 1);
    if (page >= pages) return { results: all };
  }
}

// Verify one chunk of emails through one batch job. Returns Map(email -> row). Throws FatalError when the run must stop.
async function verifyChunk(emails, key, opts, stats) {
  const out = new Map();
  const failAll = (last) => { for (const e of emails) out.set(e, failedRow(e, last, opts)); return out; };

  const sub = await requestRetry('POST', '/verify-batch', key, opts, stats, { body: { emails }, idem: idemKey('verify', emails) });
  if (sub.transient) return failAll(sub);
  const jobId = sub.data?.jobId;
  if (!jobId) return failAll({ transient: 'error', detail: 'Giggal accepted the batch but returned no jobId' });

  const done = await pollDone(`/jobs/${jobId}`, key, opts, stats);
  if (done.transient) return failAll(done);
  const got = await readPages(`/jobs/${jobId}/results`, key, opts, stats);
  if (got.transient) return failAll(got);

  const pending = [];
  for (const r of got.results) {
    const email = normEmail(r?.email);
    if (!email) continue;
    const v = toVerdict(r, key);
    if (v.transient) { out.set(email, failedRow(email, v, opts)); continue; }
    const row = { email, ...v };
    out.set(email, row);
    if (row.gate === 'catch_all') pending.push(row);
  }
  for (const e of emails) {
    if (!out.has(e)) out.set(e, failedRow(e, { transient: 'error', detail: 'Giggal did not return a result for this address (rejected or dropped from the job)' }, opts));
  }

  if (pending.length && opts.catchallCheck) await resolveCatchAll(jobId, pending, key, opts, stats);
  return out;
}

// POST /catchall re-checks every catch-all address in the job (1 credit each). Rows stay catch_all if anything fails.
async function resolveCatchAll(jobId, pending, key, opts, stats) {
  const keep = (why) => { for (const row of pending) row.detail = `${row.detail ? row.detail + '; ' : ''}${why}`; };
  const sub = await requestRetry('POST', '/catchall', key, opts, stats, { body: { jobId }, idem: idemKey('catchall', [jobId]) });
  if (sub.transient) return keep(`catch-all check not run (${sub.detail}); left in holdback`);
  const taskId = sub.data?.taskId;
  if (!taskId) return keep('catch-all check returned no taskId; left in holdback');
  const done = await pollDone(`/catchall/${taskId}`, key, opts, stats);
  if (done.transient) return keep(`catch-all check not finished (${done.detail}); left in holdback`);
  const got = await readPages(`/catchall/${taskId}/results`, key, opts, stats);
  if (got.transient) return keep(`catch-all results not read (${got.detail}); left in holdback`);
  const verdicts = new Map(got.results.map((r) => [normEmail(r?.email), String(r?.verdict || '').toLowerCase()]));
  for (const row of pending) {
    const v = verdicts.get(row.email);
    if (v === 'valid') { row.gate = 'valid'; row.detail = `${row.detail ? row.detail + '; ' : ''}catch-all check valid`; }
    else if (v === 'invalid') { row.gate = 'invalid'; row.detail = `${row.detail ? row.detail + '; ' : ''}catch-all check invalid`; }
    else row.detail = `${row.detail ? row.detail + '; ' : ''}catch-all check gave no verdict; left in holdback`;
  }
}

// ---- verdict cache (JSONL, one verdict per line, append-only, the newest verified_at wins) ----
// LIVE STATE: never rewrite, move or delete it. Every verdict is also mirrored to the client's own copy,
// profiles/<slug>/verify-cache.jsonl, when the input sits under a client folder; both files are read, and a missing
// shared cache is reported loudly, never silently. Only this script's own provider's verdicts are reused.
const newer = (a, b) => !b || (Date.parse(a.verified_at) || 0) >= (Date.parse(b.verified_at) || 0);
function loadCache(files) {
  const map = new Map();
  for (const file of files) {
    if (!file || !fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      if (!line.trim()) continue;
      try {
        const r = JSON.parse(line);
        // another verifier's verdict (for example a MillionVerifier-era line) is not reused
        if (r && r.email && r.provider === PROVIDER && newer(r, map.get(normEmail(r.email)))) map.set(normEmail(r.email), r);
      } catch { /* skip a torn line */ }
    }
  }
  return map;
}
function appendCache(files, r) {
  if (!r.fresh || !CACHEABLE_RAW.has(r.raw_status)) return;
  const line = JSON.stringify({
    email: normEmail(r.email), gate: r.gate, raw_status: r.raw_status, is_catch_all: r.is_catch_all,
    subresult: r.subresult, quality: r.quality, free: r.free, role: r.role, detail: r.detail, verified_at: r.verified_at, provider: PROVIDER,
  }) + '\n';
  for (const file of files) {
    if (!file) continue;
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.appendFileSync(file, line);
  }
}
// profiles/<slug>/verify-cache.jsonl when the input CSV sits under a client folder (not a shared _folder), else null
function clientCachePath(input) {
  const profiles = path.resolve(__dirname, '..', 'profiles');
  const rel = path.relative(profiles, path.resolve(input));
  const slug = rel.split(path.sep)[0];
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel) || !slug || slug.startsWith('_') || slug === rel) return null;
  return path.join(profiles, slug, 'verify-cache.jsonl');
}
function freshCacheHit(cache, email, maxAgeDays) {
  const c = cache.get(normEmail(email));
  if (!c || !c.verified_at || !CACHEABLE_RAW.has(c.raw_status)) return null;
  const ageDays = (Date.now() - Date.parse(c.verified_at)) / 86400000;
  if (!(ageDays >= 0) || ageDays > maxAgeDays) return null;
  const gate = GATES.has(c.gate) ? c.gate : RAW_TO_GATE[c.raw_status];
  return { email, gate, raw_status: c.raw_status, is_catch_all: c.is_catch_all ?? '',
    subresult: c.subresult ?? '', quality: c.quality ?? '', free: c.free ?? '', role: c.role ?? '',
    verified_at: c.verified_at, cache_hit: true, fresh: false, detail: c.detail ?? '' };
}

// ---- minimal CSV ----
function parseCSV(text) {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows = []; let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; } else field += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c === '\r') { /* skip */ }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.length && !(r.length === 1 && r[0] === ''));
}
const csvCell = (v) => { v = v == null ? '' : String(v); return /[",\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
const toCSV = (rows) => rows.map((r) => r.map(csvCell).join(',')).join('\n') + '\n';

function detectEmailCol(header, override) {
  if (override) { const i = header.indexOf(override); if (i < 0) throw new Error(`--email-col "${override}" not found in header`); return i; }
  for (const c of ['email', 'email_address', 'work_email', 'Email', 'EMAIL']) { const i = header.indexOf(c); if (i >= 0) return i; }
  const i = header.findIndex((h) => /email/i.test(h)); if (i >= 0) return i;
  throw new Error('no email column found; pass --email-col <name>');
}

// ---- CLI ----
const argv = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const has = (n) => argv.includes(n);
function usageExit(msg) {
  if (msg) console.error(msg);
  console.error('Usage: node giggal_verify.mjs <input.csv> [--email-col x] [--out y] [--cache p | --no-cache] [--max-age-days 90] [--batch-size 5000] [--concurrency 2] [--poll-ms 5000] [--job-timeout-s 1800] [--retries 3] [--backoff-ms 2000] [--no-catchall-check] [--max n] [--usd-per-credit x] [--dry-run] | --verify <email> | --credits');
  process.exit(2);
}
function intFlag(name, def, min, max) {
  const v = flag(name);
  if (v === undefined) return def;
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || (max !== undefined && n > max)) usageExit(`${name} must be an integer${max !== undefined ? ` from ${min} to ${max}` : ` of at least ${min}`}.`);
  return n;
}

async function creditBalance(key, opts, stats) {
  const r = await requestRetry('GET', '/credits', key, opts, stats);
  if (r.transient) return null;
  const n = Number(r.data?.balance ?? r.data?.availableCredits);
  return Number.isFinite(n) ? n : null;
}

async function main() {
  const opts = {
    retries: intFlag('--retries', 3, 0, 10),
    backoffMs: intFlag('--backoff-ms', 2000, 0),
    pollMs: intFlag('--poll-ms', 5000, 0),
    jobTimeoutS: intFlag('--job-timeout-s', 1800, 1),
    catchallCheck: !has('--no-catchall-check'),
  };

  if (has('--credits')) {
    const key = resolveKey();
    if (!key) throw new FatalError('GIGGAL_API_KEY is not set (outbound/scripts/.env). Nothing was sent.');
    let res, raw;
    try {
      res = await fetch(`${BASE}/credits`, { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
      raw = await res.text();
    } catch (e) {
      throw new FatalError(scrub(`Request to Giggal failed: ${e?.cause?.code || e?.name || ''} ${e?.message || e}`, key));
    }
    console.log(scrub(`HTTP ${res.status} ${raw}`, key));
    if (!res.ok || /"success"\s*:\s*false/.test(raw)) process.exit(1);
    return;
  }

  if (has('--verify')) {
    const addr = normEmail(flag('--verify'));
    if (!addr || !plausibleEmail(addr)) usageExit('--verify needs a plausible email address. Nothing was sent.');
    const key = resolveKey();
    if (!key) throw new FatalError('GIGGAL_API_KEY is not set (outbound/scripts/.env). Nothing was sent.');
    const stats = { calls: 0 };
    const r = await verifySingle(addr, key, opts, stats);
    const { fresh, ...shown } = r;
    console.log(JSON.stringify({ ...shown, verified_by: PROVIDER }, null, 2));
    return;
  }

  const valueFlags = ['--email-col', '--out', '--cache', '--max-age-days', '--batch-size', '--concurrency', '--poll-ms', '--job-timeout-s', '--retries', '--backoff-ms', '--max', '--usd-per-credit'];
  const flagValueIdx = new Set(valueFlags.map((f) => argv.indexOf(f)).filter((i) => i >= 0).map((i) => i + 1));
  const input = argv.find((a, i) => !a.startsWith('--') && !flagValueIdx.has(i));
  if (!input) usageExit();
  if (!fs.existsSync(input)) usageExit('input not found: ' + input);
  const dryRun = has('--dry-run');
  const noCache = has('--no-cache');
  if (noCache && flag('--cache') !== undefined) usageExit('--cache and --no-cache cannot be combined.');
  const cachePath = noCache ? null : path.resolve(flag('--cache') || DEFAULT_CACHE);
  const maxAgeDays = intFlag('--max-age-days', 90, 0);
  const batchSize = intFlag('--batch-size', 5000, 1, 50000);
  const concurrency = intFlag('--concurrency', 2, 1, 4);
  const usdPerCredit = flag('--usd-per-credit') === undefined ? null : Number(flag('--usd-per-credit'));
  if (usdPerCredit !== null && !(usdPerCredit >= 0)) usageExit('--usd-per-credit must be a number of at least 0.');

  const rows = parseCSV(fs.readFileSync(input, 'utf8'));
  if (!rows.length) usageExit('input has no header row: ' + input);
  const header = rows[0];
  const emailIdx = detectEmailCol(header, flag('--email-col'));
  let body = rows.slice(1);
  const max = flag('--max') === undefined ? null : intFlag('--max', null, 1);
  if (max) body = body.slice(0, max);
  const emails = body.map((r) => normEmail(r[emailIdx]));
  const out = flag('--out') || input.replace(/\.csv$/i, '') + '.giggal.csv';

  const clientCache = cachePath ? clientCachePath(input) : null;
  const cacheFiles = [cachePath, clientCache].filter(Boolean);   // read both, write both (mirror)
  if (cachePath && !fs.existsSync(cachePath)) {
    console.error(`WARNING: the verification cache ${cachePath} does not exist, so this run starts a new shared one.`);
    console.error('  It is append-only live state and is never moved or deleted on purpose. If it went missing, stop and');
    console.error('  recover the original first (Recycle Bin or a backup), then re-run: appending to a fresh file hides the loss.');
    console.error(clientCache && fs.existsSync(clientCache)
      ? `  This client's own copy ${clientCache} exists and is still read, so its verdicts are not re-bought.`
      : '  No client copy is available for this input, so every address will be verified again.');
  }
  const cache = cachePath ? loadCache(cacheFiles) : new Map();
  const byEmail = new Map();   // normalized email -> result
  const toVerify = [];         // distinct plausible emails that need a paid verification
  const seen = new Set();
  let cacheHits = 0, dupesInFile = 0, malformed = 0;
  for (const n of emails) {
    if (!n) continue;
    if (seen.has(n)) { dupesInFile++; continue; }
    seen.add(n);
    if (!plausibleEmail(n)) { malformed++; continue; }
    const hit = cachePath ? freshCacheHit(cache, n, maxAgeDays) : null;
    if (hit) { byEmail.set(n, hit); cacheHits++; } else toVerify.push(n);
  }
  const plan = `${emails.filter(Boolean).length} emails: ${seen.size} distinct, ${dupesInFile} repeats in file, ${malformed} malformed, ${cacheHits} fresh cache hits, ${toVerify.length} to verify`;
  if (dryRun) {
    const jobs = Math.ceil(toVerify.length / batchSize);
    console.log(`[dry-run] ${plan}.`);
    console.log(`[dry-run] Would submit ${jobs} batch job${jobs === 1 ? '' : 's'} for ${toVerify.length} addresses: ${toVerify.length} credits, plus 1 credit per catch-all address if a result comes back accept_all or risky (unknown is refunded). Cache: ${cachePath || 'off (--no-cache)'}. Nothing was sent and nothing was written.`);
    return;
  }

  const key = resolveKey();
  if (!key) throw new FatalError('GIGGAL_API_KEY is not set (outbound/scripts/.env). Nothing was sent to Giggal.');
  console.error(`[giggal] ${plan}`);

  const stats = { calls: 0 };
  const before = toVerify.length ? await creditBalance(key, opts, stats) : null;
  const chunks = [];
  for (let i = 0; i < toVerify.length; i += batchSize) chunks.push(toVerify.slice(i, i + batchSize));
  let next = 0, done = 0, fatal = null;
  async function worker() {
    while (next < chunks.length && !fatal) {
      const chunk = chunks[next++];
      try {
        const results = await verifyChunk(chunk, key, opts, stats);
        for (const [n, r] of results) {
          byEmail.set(n, r);
          if (cachePath) appendCache(cacheFiles, r);
        }
      } catch (e) {
        if (!(e instanceof FatalError)) throw e;
        fatal = e.message;   // stop taking new work; keep every verdict already paid for
      }
      done += chunk.length;
      console.error(`[giggal] ${Math.min(done, toVerify.length)}/${toVerify.length}`);
    }
  }
  await Promise.all(Array.from({ length: Math.max(1, Math.min(concurrency, chunks.length)) }, worker));
  const after = toVerify.length ? await creditBalance(key, opts, stats).catch(() => null) : null;

  const counts = { valid: 0, catch_all: 0, invalid: 0, unknown: 0, no_email: 0, not_verified: 0, transient: 0 };
  const costCharged = new Set();
  const outCols = ['email_status', 'is_catch_all', 'verifier_raw_status', 'verified_by', 'cache_hit', 'verified_at', 'cost_usd',
    'verifier_detail', 'verifier_subresult', 'verifier_quality', 'verifier_free', 'verifier_role'];
  const outHeader = [...header];
  const colIdx = {};
  for (const c of outCols) { let i = outHeader.indexOf(c); if (i < 0) { i = outHeader.length; outHeader.push(c); } colIdx[c] = i; }
  const outRows = [outHeader];
  body.forEach((r, i) => {
    const n = emails[i];
    let v;
    if (!n) v = { gate: 'no_email', raw_status: 'no_email' };
    else if (!plausibleEmail(n)) v = { gate: 'invalid', raw_status: 'malformed', detail: 'not a plausible email address; not sent' };
    else v = byEmail.get(n) || { gate: 'unknown', raw_status: 'not_verified', detail: 'the run stopped before this email was checked' };
    if (v.raw_status === 'not_verified') counts.not_verified++;
    else counts[v.gate] = (counts[v.gate] || 0) + 1;
    if (TRANSIENT_RAW.has(v.raw_status)) counts.transient++;
    let cost = '';
    const paid = v.fresh && v.raw_status !== 'unknown';   // unknown is refunded by Giggal
    if (v.cache_hit === true) cost = usdPerCredit === null ? '' : '0';
    else if (v.fresh && usdPerCredit !== null && !costCharged.has(n)) { cost = paid ? String(usdPerCredit) : '0'; costCharged.add(n); }
    else if (v.fresh && usdPerCredit !== null) cost = '0';   // a repeat of an email already costed on an earlier row
    const attempted = v.cache_hit === true || v.fresh || TRANSIENT_RAW.has(v.raw_status);
    const row = [...r];
    while (row.length < outHeader.length) row.push('');
    row[colIdx.email_status] = v.gate;                       // the GATE, canonical; downstream reads this
    row[colIdx.is_catch_all] = v.is_catch_all ?? '';
    row[colIdx.verifier_raw_status] = v.raw_status;          // Giggal's status, or why there is none
    row[colIdx.verified_by] = attempted ? PROVIDER : '';
    row[colIdx.cache_hit] = v.cache_hit === true ? 'true' : (attempted ? 'false' : '');
    row[colIdx.verified_at] = v.verified_at ?? '';
    row[colIdx.cost_usd] = cost;
    row[colIdx.verifier_detail] = v.detail ?? '';
    row[colIdx.verifier_subresult] = v.subresult ?? '';
    row[colIdx.verifier_quality] = v.quality ?? '';
    row[colIdx.verifier_free] = v.free ?? '';
    row[colIdx.verifier_role] = v.role ?? '';
    outRows.push(row);
  });
  fs.writeFileSync(out, toCSV(outRows));

  const freshVerdicts = [...byEmail.values()].filter((r) => r.fresh).length;
  console.log(`Wrote ${out} (${body.length} rows).`);
  console.log('Gate counts:', JSON.stringify(counts));
  console.log(`API calls made: ${stats.calls} (batch submits, polls, result pages and retries included; fresh verdicts ${freshVerdicts}); cache hits: ${cacheHits}; repeats in file: ${dupesInFile}.`);
  if (before !== null && after !== null) console.log(`Credits: ${before} before, ${after} after (${before - after} used this run).`);
  else if (after !== null) console.log(`Credits remaining: ${after}.`);
  console.log('Send-safe = gate "valid". catch_all -> leads.catchall-holdback.csv (never the send file); invalid / unknown / no_email -> the next finder rung or review (see /email-waterfall).');
  if (fatal) {
    console.error(`ERROR: ${fatal}`);
    console.error(`Stopped early. ${counts.not_verified} rows were NOT verified (verifier_raw_status = not_verified); every verdict already paid for is in ${out}${cachePath ? ' and in the cache' : ''}. Fix the account, then re-run the same file${cachePath ? ': cached rows cost nothing' : ''}.`);
    process.exit(1);
  }
}

main().catch((e) => {
  const key = resolveKey();
  console.error('ERROR:', scrub(e?.message || e, key));
  process.exit(1);
});
