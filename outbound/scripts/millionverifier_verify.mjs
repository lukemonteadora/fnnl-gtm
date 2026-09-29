#!/usr/bin/env node
/**
 * millionverifier_verify.mjs: verify every email in a CSV through MillionVerifier (FNNL's email verifier of
 * record, stack-contract.yaml lead_data.email_verification), with a verdict cache so no address is paid for twice.
 *
 * WHAT IT IS FOR. The verify layer of the list-production flow. It writes the columns
 * `list_waterfall.py record --layer verify` reads, and it works on any one-off CSV too. Node built-ins only.
 *
 * API SHAPE. Taken only from outbound/scripts/mcp/millionverifier_mcp.mjs (nothing here is guessed beyond it):
 *   real-time verify  GET https://api.millionverifier.com/api/v3/?api=KEY&email=ADDR[&timeout=2..60]
 *   credits (free)    GET https://api.millionverifier.com/api/v3/credits?api=KEY
 *   response fields   result, resultcode, subresult, quality, free, role, didyoumean, credits, error
 *   resultcode        1=ok, 2=catch_all, 3=unknown, 4=error, 5=disposable, 6=invalid
 * Real-time is synchronous (one request, one verdict; no submit and poll). Bulk jobs are not handled here: use the
 * MCP server's bulk tools for a large unattended file.
 *
 * KEY. MILLIONVERIFIER_API_KEY from outbound/scripts/.env, with process.env overriding the file (the MCP server's
 * pattern). The vendor takes the key as a URL query parameter, so every message this script prints is scrubbed of it.
 *
 * GATE MAPPING (the `email_status` column, which every downstream step reads):
 *   ok -> valid (send file)          catch_all -> catch_all (holdback, never collapsed into ok or unknown)
 *   unknown -> unknown (review)      invalid, disposable -> invalid
 *   resultcode 4 `error`, HTTP 429, HTTP 5xx, a network failure or a timeout -> transient: retried with backoff,
 *   never cached, and if still failing the row gets gate `unknown`.
 *
 * RAW STATUS VOCABULARY (the `verifier_raw_status` column). A verdict carries MillionVerifier's own `result`
 * (ok | catch_all | unknown | invalid | disposable). A call that produced no verdict carries one of three names, all
 * listed in provider-routing.yaml layers.verification.transient_raw_statuses, so list_waterfall.py retries them
 * instead of logging a real verdict (keep the two lists in step if either changes):
 *   timeout        the request hit this script's time limit
 *   rate_limited   HTTP 429
 *   error          anything else that returned no verdict: MillionVerifier's own resultcode 4 `error`, a network
 *                  error, HTTP 5xx, a non-JSON reply or an unrecognized reply
 * The precise reason is in `verifier_detail`. Two more values: `not_verified` (the run stopped before this email was
 * checked) and, for rows never sent, `no_email` (blank) or `malformed` (not a plausible address; gate invalid, no call).
 *
 * COST GUARDS:
 *   - Emails are lowercased and trimmed, and each distinct email is verified ONCE per file.
 *   - A fresh cached verdict (same normalized email, same provider, younger than --max-age-days) is reused, never
 *     re-bought. Transient outcomes are never cached. Each new verdict is appended to the cache as soon as it lands.
 *   - THE CACHE IS APPEND-ONLY LIVE STATE. No script rewrites, moves or deletes it, and nobody should by hand: it is
 *     the only record of what was already paid for, and client folders are gitignored with profiles/, so git cannot
 *     bring it back. When the input CSV sits under outbound/profiles/<slug>/, every new verdict is also appended to
 *     that client's own copy, profiles/<slug>/verify-cache.jsonl. Both files are read on each run and the newest
 *     verified_at wins (not the last line). A shared cache that is missing prints a loud WARNING on stderr instead of
 *     silently starting empty; the client copies are still read, so those verdicts survive.
 *   - On a fatal error (an `error` field in the reply, or an HTTP 4xx other than 429) the script stops taking new
 *     work, still writes the output with the unchecked rows marked `not_verified`, and exits 1. Paid verdicts are
 *     never lost, and a re-run of the same file costs nothing for the rows already cached. MillionVerifier's error
 *     strings are not documented in this repo, so any error field stops the run rather than being guessed at.
 *   - The vendor test key API_KEY_FOR_TEST returns random verdicts. With that key the script refuses to touch the
 *     shared cache: pass --no-cache or --cache <scratch path>.
 * SPEND: 1 credit per real-time call (MCP server note). Whether an `unknown` or `error` verdict is billed is not
 * recorded in this repo. /api-cost-governance prices the run first; --dry-run gives the call count for that preview.
 *
 * Usage:
 *   node millionverifier_verify.mjs <input.csv> [options]   verify every email in the CSV
 *   node millionverifier_verify.mjs <input.csv> --dry-run   count distinct emails, cache hits and paid calls; no calls
 *   node millionverifier_verify.mjs --verify <email>        verify one address (spends a credit, skips the cache)
 *   node millionverifier_verify.mjs --credits               remaining credits (free call)
 * Options:
 *   --email-col <name>      email column (default: auto-detect email / email_address / work_email)
 *   --out <path>            output CSV (default <input>.millionverifier.csv)
 *   --cache <path>          verdict cache (default ../profiles/_cache/verify-cache.jsonl, gitignored with profiles/).
 *                           Append-only. When the input sits under profiles/<slug>/, each verdict is also mirrored to
 *                           profiles/<slug>/verify-cache.jsonl and both are read (the newest verified_at wins).
 *   --no-cache              neither read nor write either cache, mirror included (still dedupes within the file)
 *   --max-age-days <n>      a cached verdict older than this is re-verified (default 90, mirroring provider-routing.yaml
 *                           layers.verification.cache.max_age_days; pass it explicitly if that value changes)
 *   --concurrency <n>       parallel requests (default 4; the vendor's rate limit is not recorded in this repo)
 *   --retries <n>           retries for a transient outcome (default 3), exponential backoff
 *   --backoff-ms <n>        first backoff delay (default 2000; doubles on each retry)
 *   --timeout <s>           MillionVerifier's own SMTP-check timeout, 2 to 60 (vendor default applies if omitted)
 *   --max <n>               verify only the first n data rows (safety cap)
 *   --usd-per-credit <x>    fill `cost_usd` with this estimate for each freshly paid verdict (blank otherwise)
 *
 * Output: the input columns plus email_status (the gate), is_catch_all, verifier_raw_status, verified_by, cache_hit,
 * verified_at, cost_usd, verifier_detail, verifier_subresult, verifier_quality, verifier_free, verifier_role.
 * `is_catch_all` is true for catch_all, false for ok, and blank where the result says nothing about the domain.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SINGLE_BASE = 'https://api.millionverifier.com';
const PROVIDER = 'millionverifier';
const VENDOR_TEST_KEY = 'API_KEY_FOR_TEST';
const DEFAULT_CACHE = path.resolve(__dirname, '..', 'profiles', '_cache', 'verify-cache.jsonl');
const REQUEST_TIMEOUT_MS = 70000;

const CODE_TO_RESULT = { 1: 'ok', 2: 'catch_all', 3: 'unknown', 4: 'error', 5: 'disposable', 6: 'invalid' };
const RESULT_TO_GATE = { ok: 'valid', catch_all: 'catch_all', unknown: 'unknown', invalid: 'invalid', disposable: 'invalid' };
const TRANSIENT_RAW = new Set(['timeout', 'rate_limited', 'error']);

class FatalError extends Error {}

// ---- .env loader (same pattern as mcp/millionverifier_mcp.mjs) ----
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
  return (env.MILLIONVERIFIER_API_KEY || '').trim();
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

// ---- one real-time call ----
// Returns { verdict: {...} } or { transient, detail }. Throws FatalError when the run must stop.
async function callVerify(email, key, opts) {
  const q = new URLSearchParams({ api: key, email });
  if (opts.timeout !== undefined) q.set('timeout', String(opts.timeout));
  let res, raw;
  try {
    res = await fetch(`${SINGLE_BASE}/api/v3/?${q}`, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
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
  if (data && typeof data.error === 'string' && data.error.trim() !== '') {
    throw new FatalError(scrub(`MillionVerifier returned an error (HTTP ${res.status}): ${data.error.trim()}`, key));
  }
  if (!res.ok) throw new FatalError(scrub(`MillionVerifier answered HTTP ${res.status}: ${raw.slice(0, 300)}`, key));
  if (!data || typeof data !== 'object') {
    return { transient: 'error', detail: scrub(`HTTP ${res.status}, non-JSON reply: ${raw.slice(0, 200)}`, key) };
  }
  const credits = data.credits;
  const code = Number(data.resultcode);
  const result = CODE_TO_RESULT[code] || (typeof data.result === 'string' ? data.result.trim().toLowerCase() : '');
  if (result === 'error') {
    return { transient: 'error', credits,
      detail: `resultcode 4 (error)${data.subresult ? `, subresult ${data.subresult}` : ''}` };
  }
  if (!(result in RESULT_TO_GATE)) {
    return { transient: 'error', credits,
      detail: scrub(`unrecognized reply: resultcode ${data.resultcode}, result ${data.result}`, key) };
  }
  return {
    credits,
    verdict: {
      gate: RESULT_TO_GATE[result],
      raw_status: result,
      is_catch_all: result === 'catch_all' ? 'true' : (result === 'ok' ? 'false' : ''),
      subresult: data.subresult ?? '',
      quality: data.quality ?? '',
      free: data.free ?? '',
      role: data.role ?? '',
      verified_at: new Date().toISOString(),
    },
  };
}

async function verifyWithRetry(email, key, opts, stats) {
  let last;
  for (let attempt = 0; attempt <= opts.retries; attempt++) {
    if (attempt > 0) await sleep(opts.backoffMs * 2 ** (attempt - 1));
    stats.calls++;
    last = await callVerify(email, key, opts);
    if (last.credits !== undefined && last.credits !== null && last.credits !== '') {
      const c = Number(last.credits);
      if (Number.isFinite(c)) stats.lowestCredits = stats.lowestCredits === null ? c : Math.min(stats.lowestCredits, c);
    }
    if (!last.transient) break;
  }
  if (last.verdict) return { email, ...last.verdict, cache_hit: false, fresh: true, detail: '' };
  return { email, gate: 'unknown', raw_status: last.transient, is_catch_all: '', subresult: '', quality: '', free: '',
    role: '', verified_at: '', cache_hit: false, fresh: false, detail: `${last.detail} (after ${opts.retries + 1} attempt${opts.retries ? 's' : ''})` };
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
        // another verifier's verdict is not reused
        if (r && r.email && r.provider === PROVIDER && newer(r, map.get(normEmail(r.email)))) map.set(normEmail(r.email), r);
      } catch { /* skip a torn line */ }
    }
  }
  return map;
}
function appendCache(files, r) {
  if (!r.fresh || TRANSIENT_RAW.has(r.raw_status)) return;
  const line = JSON.stringify({
    email: normEmail(r.email), gate: r.gate, raw_status: r.raw_status, is_catch_all: r.is_catch_all,
    subresult: r.subresult, quality: r.quality, free: r.free, role: r.role, verified_at: r.verified_at, provider: PROVIDER,
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
  if (!c || !c.verified_at || !(c.raw_status in RESULT_TO_GATE)) return null;
  const ageDays = (Date.now() - Date.parse(c.verified_at)) / 86400000;
  if (!(ageDays >= 0) || ageDays > maxAgeDays) return null;
  return { email, gate: RESULT_TO_GATE[c.raw_status], raw_status: c.raw_status, is_catch_all: c.is_catch_all ?? '',
    subresult: c.subresult ?? '', quality: c.quality ?? '', free: c.free ?? '', role: c.role ?? '',
    verified_at: c.verified_at, cache_hit: true, fresh: false, detail: '' };
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
  console.error('Usage: node millionverifier_verify.mjs <input.csv> [--email-col x] [--out y] [--cache p | --no-cache] [--max-age-days 90] [--concurrency 4] [--retries 3] [--backoff-ms 2000] [--timeout s] [--max n] [--usd-per-credit x] [--dry-run] | --verify <email> | --credits');
  process.exit(2);
}
function intFlag(name, def, min, max) {
  const v = flag(name);
  if (v === undefined) return def;
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || (max !== undefined && n > max)) usageExit(`${name} must be an integer${max !== undefined ? ` from ${min} to ${max}` : ` of at least ${min}`}.`);
  return n;
}

async function main() {
  const opts = {
    retries: intFlag('--retries', 3, 0, 10),
    backoffMs: intFlag('--backoff-ms', 2000, 0),
    timeout: flag('--timeout') === undefined ? undefined : intFlag('--timeout', undefined, 2, 60),
  };

  if (has('--credits')) {
    const key = resolveKey();
    if (!key) throw new FatalError('MILLIONVERIFIER_API_KEY is not set (outbound/scripts/.env). Nothing was sent.');
    let res, raw;
    try {
      res = await fetch(`${SINGLE_BASE}/api/v3/credits?${new URLSearchParams({ api: key })}`, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
      raw = await res.text();
    } catch (e) {
      throw new FatalError(scrub(`Request to MillionVerifier failed: ${e?.cause?.code || e?.name || ''} ${e?.message || e}`, key));
    }
    console.log(scrub(`HTTP ${res.status} ${raw}`, key));
    if (!res.ok || /"error"\s*:\s*"[^"]+/.test(raw)) process.exit(1);
    return;
  }

  if (has('--verify')) {
    const addr = normEmail(flag('--verify'));
    if (!addr || !plausibleEmail(addr)) usageExit('--verify needs a plausible email address. Nothing was sent.');
    const key = resolveKey();
    if (!key) throw new FatalError('MILLIONVERIFIER_API_KEY is not set (outbound/scripts/.env). Nothing was sent.');
    const stats = { calls: 0, lowestCredits: null };
    const r = await verifyWithRetry(addr, key, opts, stats);
    const { fresh, ...shown } = r;
    console.log(JSON.stringify({ ...shown, verified_by: PROVIDER, credits_remaining: stats.lowestCredits }, null, 2));
    return;
  }

  const valueFlags = ['--email-col', '--out', '--cache', '--max-age-days', '--concurrency', '--retries', '--backoff-ms', '--timeout', '--max', '--usd-per-credit'];
  const flagValueIdx = new Set(valueFlags.map((f) => argv.indexOf(f)).filter((i) => i >= 0).map((i) => i + 1));
  const input = argv.find((a, i) => !a.startsWith('--') && !flagValueIdx.has(i));
  if (!input) usageExit();
  if (!fs.existsSync(input)) usageExit('input not found: ' + input);
  const dryRun = has('--dry-run');
  const noCache = has('--no-cache');
  if (noCache && flag('--cache') !== undefined) usageExit('--cache and --no-cache cannot be combined.');
  const cachePath = noCache ? null : path.resolve(flag('--cache') || DEFAULT_CACHE);
  const maxAgeDays = intFlag('--max-age-days', 90, 0);
  const concurrency = intFlag('--concurrency', 4, 1, 32);
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
  const out = flag('--out') || input.replace(/\.csv$/i, '') + '.millionverifier.csv';

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
  const toVerify = [];         // distinct plausible emails that need a paid call
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
    console.log(`[dry-run] ${plan}.`);
    console.log(`[dry-run] Would make ${toVerify.length} real-time calls (1 credit each per the MCP server note, plus any transient retries). Cache: ${cachePath || 'off (--no-cache)'}. Nothing was sent and nothing was written.`);
    return;
  }

  const key = resolveKey();
  if (!key) throw new FatalError('MILLIONVERIFIER_API_KEY is not set (outbound/scripts/.env). Nothing was sent to MillionVerifier.');
  if (key === VENDOR_TEST_KEY && cachePath && (flag('--cache') === undefined || cachePath.toLowerCase() === DEFAULT_CACHE.toLowerCase())) {
    usageExit('The vendor test key returns random verdicts, so it may not write to the shared verify cache. Re-run with --no-cache or --cache <scratch path>. Nothing was sent.');
  }
  // The vendor test key returns random verdicts: never mirror those into a client folder either.
  const writeFiles = key === VENDOR_TEST_KEY ? cacheFiles.filter((f) => f === cachePath) : cacheFiles;
  console.error(`[millionverifier] ${plan}`);

  const stats = { calls: 0, lowestCredits: null };
  let next = 0, done = 0, fatal = null;
  async function worker() {
    while (next < toVerify.length && !fatal) {
      const n = toVerify[next++];
      try {
        const r = await verifyWithRetry(n, key, opts, stats);
        byEmail.set(n, r);
        if (cachePath) appendCache(writeFiles, r);
      } catch (e) {
        if (!(e instanceof FatalError)) throw e;
        fatal = e.message;   // stop taking new work; keep every verdict already paid for
      }
      if (++done % 25 === 0) console.error(`[millionverifier] ${done}/${toVerify.length}`);
    }
  }
  await Promise.all(Array.from({ length: Math.max(1, Math.min(concurrency, toVerify.length)) }, worker));

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
    if (v.cache_hit === true) cost = usdPerCredit === null ? '' : '0';
    else if (v.fresh && usdPerCredit !== null && !costCharged.has(n)) { cost = String(usdPerCredit); costCharged.add(n); }
    else if (v.fresh && usdPerCredit !== null) cost = '0';   // a repeat of an email already costed on an earlier row
    const attempted = v.cache_hit === true || v.fresh || TRANSIENT_RAW.has(v.raw_status);
    const row = [...r];
    while (row.length < outHeader.length) row.push('');
    row[colIdx.email_status] = v.gate;                       // the GATE, canonical; downstream reads this
    row[colIdx.is_catch_all] = v.is_catch_all ?? '';
    row[colIdx.verifier_raw_status] = v.raw_status;          // MillionVerifier's result, or why there is none
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
  console.log(`Real-time calls made: ${stats.calls} (fresh verdicts ${freshVerdicts}, retries and transient failures included in the call count); cache hits: ${cacheHits}; repeats in file: ${dupesInFile}.`);
  if (stats.lowestCredits !== null) console.log(`Credits remaining, lowest value MillionVerifier reported this run: ${stats.lowestCredits}.`);
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
