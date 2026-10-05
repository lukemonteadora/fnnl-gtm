#!/usr/bin/env node
/**
 * aiark_people.mjs: AI Ark people discovery over REST (outbound/reference/ai-ark-people-discovery.md), because the
 * AI Ark MCP people_search tool has no keyword exclude. Every refined search for the Aaron flow's 200-row sample
 * loop and at-scale pull runs through this script, not the MCP tool.
 *
 * Commands: count | sample | exclude-list | plan | pull. See ai-ark-people-discovery.md for the loop these serve.
 *
 * NEVER CALLS People Export (/v1/people/export) or the MCP tool named email_finder (People Export under another
 * name): both bill 0.5 credits per person even with no email found, and neither belongs in discovery. This script
 * only ever posts to /v1/people (search) and /v1/lists (free suppression lists). No email is revealed here.
 *
 * API SHAPE. Taken from AI Ark's own CLI source (internal/client/client.go, search.go), 2026-10-05:
 *   base https://api.ai-ark.com, prefix /api/developer-portal, auth header X-TOKEN, cost header X-Credit.
 *   POST /v1/people            people search, 0.5 credits per result returned
 *   POST /v1/lists             suppression list, {"type":"people_id","values":[...]}, free, max 10000 values
 *   Retries on 429/5xx (Retry-After honored, backoff capped at 10s); redirects are refused (the Go client's own
 *   reason: forwarding X-TOKEN to a new host would leak it).
 *
 * RESPONSE SHAPE CAVEAT (report this; do not treat it as settled). The Go CLI's own client.go decodes every
 * response body as opaque json.RawMessage and never defines a Person/Company struct: AI Ark's reply shape for
 * people search (where the company's domain, description, keywords, industries, headcount and location live on
 * each person row, and what the "total" field is called) is NOT verifiable from the CLI source. extractCompany(),
 * extractPersonId() and extractTotal() below read a short list of plausible field-name aliases and are a
 * best-effort reading of ai-ark-people-discovery.md's own prose ("the script writes sample-r0-companies.csv with
 * the name, domain, description, keywords, industries, headcount and location AI Ark returned"), not a verified
 * contract. The first live call must confirm or correct the alias lists below.
 *
 * KEY. AI_ARK_API_KEY from outbound/scripts/.env, with process.env overriding the file (same pattern as
 * millionverifier_verify.mjs's resolveKey/loadEnvFile). The key travels only in the X-TOKEN header, never the URL,
 * and every error and log line is scrubbed of it before being printed.
 *
 * EXIT CODES (this script's own contract, not the Go CLI's): 0 success (including a deliberate, instructed stop
 * such as a --max-credits budget reached, or a --dry-run preview), 1 any other error, 2 usage or config error
 * (bad flags, missing file, missing key), 3 insufficient balance (HTTP 402) or a persistent outage (429/5xx that
 * survived every retry) -- the tool-balance stop: AI_Ark is out of money or down, never substitute another tool.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---- .env loader (same pattern as millionverifier_verify.mjs) ----
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
  return (env.AI_ARK_API_KEY || '').trim();
}

function scrub(text, key) {
  let s = String(text);
  if (key) s = s.split(key).join('***');
  return s;
}

const KEY = resolveKey();
const BASE_URL = (process.env.AIARK_BASE_URL || 'https://api.ai-ark.com').replace(/\/+$/, '');
const API_PREFIX = '/api/developer-portal';
const PATH_PEOPLE_SEARCH = '/v1/people';
const PATH_LISTS = '/v1/lists';
const MAX_LIST_VALUES = 10000;
const PAGE_SIZE = 100;
const MIN_INTERVAL_MS = 200; // about 5 requests a second
const RETRY_ATTEMPTS = 4;

class UsageError extends Error {}
class BalanceOrOutageError extends Error {}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

let lastRequestAt = 0;
async function throttle() {
  const wait = lastRequestAt + MIN_INTERVAL_MS - Date.now();
  if (wait > 0) await sleep(wait);
  lastRequestAt = Date.now();
}

// ---- HTTP ----
async function apiPost(apiPath, body) {
  let attempt = 0;
  let backoff = 1000;
  for (;;) {
    await throttle();
    let res;
    try {
      res = await fetch(BASE_URL + API_PREFIX + apiPath, {
        method: 'POST',
        headers: { 'X-TOKEN': KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        redirect: 'manual',
      });
    } catch (err) {
      attempt += 1;
      if (attempt > RETRY_ATTEMPTS) {
        throw new BalanceOrOutageError(scrub(`network error after ${RETRY_ATTEMPTS} retries: ${err && err.message}`, KEY));
      }
      await sleep(Math.min(backoff, 10000));
      backoff = Math.min(backoff * 2, 10000);
      continue;
    }
    if (res.status >= 300 && res.status < 400) {
      throw new Error('server answered with a redirect; refusing to follow it with credentials');
    }
    if (res.status === 402) {
      const text = await res.text();
      throw new BalanceOrOutageError(scrub(`insufficient balance (HTTP 402): ${text}`, KEY));
    }
    if (res.status === 429 || res.status >= 500) {
      attempt += 1;
      if (attempt > RETRY_ATTEMPTS) {
        const text = await res.text().catch(() => '');
        throw new BalanceOrOutageError(scrub(`persistent outage (HTTP ${res.status}) after ${RETRY_ATTEMPTS} retries: ${text}`, KEY));
      }
      const retryAfter = Number(res.headers.get('retry-after'));
      const wait = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : backoff;
      await sleep(Math.min(wait, 10000));
      backoff = Math.min(backoff * 2, 10000);
      continue;
    }
    const text = await res.text();
    if (res.status < 200 || res.status >= 300) {
      let message = text;
      try {
        const env = JSON.parse(text);
        message = env.message || env.error || text;
      } catch { /* not JSON; use raw body */ }
      throw new Error(scrub(`API error (HTTP ${res.status}): ${message}`, KEY));
    }
    const credit = res.headers.get('x-credit') || '';
    let parsed = {};
    try {
      parsed = text ? JSON.parse(text) : {};
    } catch (err) {
      throw new Error(scrub(`could not parse API response as JSON: ${err && err.message}`, KEY));
    }
    return { body: parsed, credit };
  }
}

// ---- response field aliasing (see RESPONSE SHAPE CAVEAT above) ----
function dig(obj, paths) {
  for (const p of paths) {
    let cur = obj;
    let ok = true;
    for (const part of p.split('.')) {
      if (cur && typeof cur === 'object' && part in cur) cur = cur[part];
      else { ok = false; break; }
    }
    if (ok && cur !== undefined && cur !== null && cur !== '') return cur;
  }
  return undefined;
}

function asListString(v) {
  if (v === undefined || v === null) return '';
  if (Array.isArray(v)) return v.filter(Boolean).join('|');
  return String(v);
}

function extractCompany(person) {
  const c = (person && (person.company || person.account)) || person || {};
  return {
    domain: String(dig(c, ['domain', 'website', 'domainName', 'companyDomain']) ?? dig(person, ['companyDomain', 'domain']) ?? '').toLowerCase().trim(),
    name: String(dig(c, ['name', 'companyName']) ?? ''),
    description: String(dig(c, ['description', 'about', 'summary']) ?? ''),
    keywords: asListString(dig(c, ['keywords', 'keyword', 'tags'])),
    industries: asListString(dig(c, ['industries', 'industry'])),
    headcount: String(dig(c, ['employeeSize', 'headcount', 'size', 'employeeCount']) ?? ''),
    location: String(dig(c, ['location', 'hqLocation', 'city']) ?? ''),
  };
}

function extractPersonId(person) {
  return String(dig(person, ['id', 'personId', '_id', 'uuid']) ?? '');
}

function extractTotal(body) {
  return Number(dig(body, ['total', 'totalCount', 'meta.total', 'pagination.total', 'count']) ?? 0);
}

function extractResults(body) {
  const v = dig(body, ['results', 'data', 'people', 'items']);
  if (Array.isArray(v)) return v;
  return Array.isArray(body) ? body : [];
}

// ---- small file helpers (LF only; Node's fs does not CRLF-translate like Python text mode) ----
function readSearchBody(p) {
  let raw;
  try {
    raw = fs.readFileSync(p, 'utf8');
  } catch (err) {
    throw new UsageError(`cannot read --search file: ${err && err.message}`);
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new UsageError(`--search file is not valid JSON: ${err && err.message}`);
  }
}

function csvEscape(v) {
  const s = String(v ?? '');
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function writeCsv(p, header, rows) {
  const lines = [header.join(',')];
  for (const row of rows) lines.push(header.map((h) => csvEscape(row[h])).join(','));
  fs.writeFileSync(p, lines.join('\n') + '\n');
}

async function countBody(body) {
  const { body: resBody } = await apiPost(PATH_PEOPLE_SEARCH, { ...body, page: 0, size: 1 });
  return extractTotal(resBody);
}

// ---- CLI arg parsing (same minimal style as millionverifier_verify.mjs) ----
const argv = process.argv.slice(2);
const CMD = argv[0];
const rest = argv.slice(1);
const has = (n) => rest.includes(n);
const flagVal = (n, d) => {
  const i = rest.indexOf(n);
  return i >= 0 && i + 1 < rest.length ? rest[i + 1] : d;
};

// ---- commands ----
async function cmdCount() {
  const searchPath = flagVal('--search');
  if (!searchPath) throw new UsageError('count requires --search <path>');
  const body = readSearchBody(searchPath);
  const { body: resBody, credit } = await apiPost(PATH_PEOPLE_SEARCH, { ...body, page: 0, size: 1 });
  const total = extractTotal(resBody);
  console.log(JSON.stringify({ total, credit }));
}

async function cmdSample() {
  const searchPath = flagVal('--search');
  const nRaw = flagVal('--n');
  const out = flagVal('--out');
  if (!searchPath) throw new UsageError('sample requires --search <path>');
  if (!nRaw) throw new UsageError('sample requires --n <count>');
  if (!out) throw new UsageError('sample requires --out <path.jsonl>');
  const n = Number(nRaw);
  if (!Number.isInteger(n) || n <= 0) throw new UsageError('--n must be a positive integer');
  const body = readSearchBody(searchPath);

  const people = [];
  let page = 0;
  let creditsSpent = 0;
  while (people.length < n) {
    const size = Math.min(PAGE_SIZE, n - people.length);
    const { body: resBody, credit } = await apiPost(PATH_PEOPLE_SEARCH, { ...body, page, size });
    const results = extractResults(resBody);
    people.push(...results);
    creditsSpent += Math.abs(Number(credit)) || results.length * 0.5;
    page += 1;
    if (results.length < size) break; // a short (or empty) page means the search is exhausted
  }
  const sampled = people.slice(0, n);
  fs.writeFileSync(out, sampled.map((p) => JSON.stringify(p)).join('\n') + (sampled.length ? '\n' : ''));

  // seen-ids.txt accumulates across rounds (r0, r1, ...) in the same vertical discovery folder.
  const seenIdsPath = flagVal('--seen-ids') || path.join(path.dirname(out), 'seen-ids.txt');
  const seenIds = new Set();
  if (fs.existsSync(seenIdsPath)) {
    for (const line of fs.readFileSync(seenIdsPath, 'utf8').split('\n')) {
      const t = line.trim();
      if (t) seenIds.add(t);
    }
  }
  for (const p of sampled) {
    const id = extractPersonId(p);
    if (id) seenIds.add(id);
  }
  fs.writeFileSync(seenIdsPath, [...seenIds].join('\n') + (seenIds.size ? '\n' : ''));

  // sample-r0.jsonl -> sample-r0-companies.csv, per ai-ark-people-discovery.md step 3.
  const companiesOut = flagVal('--companies-out') || (/\.jsonl$/i.test(out) ? out.replace(/\.jsonl$/i, '-companies.csv') : `${out}-companies.csv`);
  const byDomain = new Map();
  for (const p of sampled) {
    const c = extractCompany(p);
    if (!c.domain) continue;
    if (!byDomain.has(c.domain)) byDomain.set(c.domain, { ...c, person_count: 0 });
    const row = byDomain.get(c.domain);
    row.person_count += 1;
    for (const field of ['name', 'description', 'keywords', 'industries', 'headcount', 'location']) {
      if (!row[field] && c[field]) row[field] = c[field];
    }
  }
  const header = ['company_domain', 'company_name', 'description', 'keywords', 'industries', 'headcount', 'location', 'person_count'];
  const rows = [...byDomain.values()].map((r) => ({
    company_domain: r.domain, company_name: r.name, description: r.description,
    keywords: r.keywords, industries: r.industries, headcount: r.headcount,
    location: r.location, person_count: r.person_count,
  }));
  writeCsv(companiesOut, header, rows);

  console.log(JSON.stringify({
    sampled: sampled.length, companies: rows.length, credits_spent: creditsSpent,
    out, seen_ids_file: seenIdsPath, companies_out: companiesOut,
  }));
}

async function cmdExcludeList() {
  const idsPath = flagVal('--ids');
  if (!idsPath) throw new UsageError('exclude-list requires --ids <path>');
  let raw;
  try {
    raw = fs.readFileSync(idsPath, 'utf8');
  } catch (err) {
    throw new UsageError(`cannot read --ids file: ${err && err.message}`);
  }
  const ids = [...new Set(raw.split('\n').map((s) => s.trim()).filter(Boolean))];
  if (ids.length === 0) throw new UsageError('--ids file has no ids');
  const truncated = ids.length > MAX_LIST_VALUES;
  const values = truncated ? ids.slice(0, MAX_LIST_VALUES) : ids;
  const { body: resBody, credit } = await apiPost(PATH_LISTS, { type: 'people_id', values });
  const summary = { list: resBody, credit, submitted: values.length, truncated };
  const outPath = flagVal('--out');
  if (outPath) fs.writeFileSync(outPath, JSON.stringify(summary, null, 2) + '\n');
  console.log(JSON.stringify(summary));
}

// plan bisects the employeeSize band numerically, which needs no catalog lookup. This is a deliberate narrowing
// of ai-ark-people-discovery.md's "by country or state, then headcount band, then industry": country/state/
// industry slicing needs AI Ark's own location and industry catalogs (separate free lookups), out of scope for an
// offline-tested script. A slice still over --max after bisecting employeeSize down to a 1-person band is flagged,
// not silently dropped; the operator narrows it by location or industry before pulling that slice.
function withEmployeeBand(body, band) {
  const next = JSON.parse(JSON.stringify(body));
  next.account = next.account || {};
  next.account.employeeSize = { type: 'RANGE', range: [{ start: band.start, end: band.end }] };
  return next;
}

async function splitBand(body, band, max, depth) {
  const count = await countBody(withEmployeeBand(body, band));
  const width = band.end - band.start;
  if (count <= max || width < 1 || depth > 20) {
    return [{ band, count, over: count > max }];
  }
  const mid = Math.floor((band.start + band.end) / 2);
  const left = await splitBand(body, { start: band.start, end: mid }, max, depth + 1);
  const right = await splitBand(body, { start: mid + 1, end: band.end }, max, depth + 1);
  return [...left, ...right];
}

async function cmdPlan() {
  const searchPath = flagVal('--search');
  const maxRaw = flagVal('--max');
  if (!searchPath) throw new UsageError('plan requires --search <path>');
  if (!maxRaw) throw new UsageError('plan requires --max <n>');
  const max = Number(maxRaw);
  if (!Number.isInteger(max) || max <= 0) throw new UsageError('--max must be a positive integer');
  const body = readSearchBody(searchPath);
  const existingBands = dig(body, ['account.employeeSize.range']) || [{ start: 1, end: 1000000 }];

  let slices = [];
  for (const band of existingBands) {
    slices = slices.concat(await splitBand(body, { start: band.start ?? 1, end: band.end ?? 1000000 }, max, 0));
  }
  const overCap = slices.filter((s) => s.over);
  const summary = { slices, slice_count: slices.length, over_cap: overCap.length };
  const outPath = flagVal('--out');
  if (outPath) fs.writeFileSync(outPath, JSON.stringify(summary, null, 2) + '\n');
  console.log(JSON.stringify(summary));
  if (overCap.length) {
    console.error(scrub(`plan: ${overCap.length} slice(s) still over --max after bisecting employeeSize to a 1-person band; narrow by location or industry before pulling them (this script only bisects headcount; see the report for why)`, KEY));
  }
}

function progressPath(outPath) { return `${outPath}.progress.json`; }

async function cmdPull() {
  const searchPath = flagVal('--search');
  const out = flagVal('--out');
  if (!searchPath) throw new UsageError('pull requires --search <path>');
  if (!out) throw new UsageError('pull requires --out <path.jsonl>');
  const dryRun = has('--dry-run');
  const resume = has('--resume');
  const body = readSearchBody(searchPath);

  if (dryRun) {
    const total = await countBody(body);
    console.log(JSON.stringify({ dry_run: true, total, estimated_credits: total * 0.5 }));
    return;
  }

  const maxCreditsRaw = flagVal('--max-credits');
  if (!maxCreditsRaw) throw new UsageError('pull requires --max-credits <n> (or --dry-run)');
  const maxCredits = Number(maxCreditsRaw);
  if (!Number.isFinite(maxCredits) || maxCredits <= 0) throw new UsageError('--max-credits must be a positive number');

  const pp = progressPath(out);
  let page = 0;
  let creditsSpent = 0;
  let totalPulled = 0;
  if (resume && fs.existsSync(pp)) {
    const prog = JSON.parse(fs.readFileSync(pp, 'utf8'));
    page = prog.nextPage || 0;
    creditsSpent = prog.creditsSpent || 0;
    totalPulled = prog.totalPulled || 0;
  } else if (!resume) {
    fs.writeFileSync(out, '');
  }

  let stoppedReason = null;
  for (;;) {
    const pageCost = PAGE_SIZE * 0.5;
    if (creditsSpent + pageCost > maxCredits) { stoppedReason = 'max-credits reached'; break; }
    const { body: resBody, credit } = await apiPost(PATH_PEOPLE_SEARCH, { ...body, page, size: PAGE_SIZE });
    const results = extractResults(resBody);
    if (results.length === 0) { stoppedReason = 'exhausted'; break; }
    fs.appendFileSync(out, results.map((p) => JSON.stringify(p)).join('\n') + '\n');
    totalPulled += results.length;
    creditsSpent += Math.abs(Number(credit)) || results.length * 0.5;
    page += 1;
    fs.writeFileSync(pp, JSON.stringify({ nextPage: page, creditsSpent, totalPulled }));
    if (results.length < PAGE_SIZE) { stoppedReason = 'exhausted'; break; }
  }

  console.log(JSON.stringify({
    completed: stoppedReason === 'exhausted', reason: stoppedReason,
    pulled: totalPulled, credits_spent: creditsSpent, next_page: page, out,
  }));
}

function usageExit(msg) {
  if (msg) console.error(scrub(msg, KEY));
  console.error('Usage: node aiark_people.mjs count|sample|exclude-list|plan|pull --search <path> ... (see outbound/reference/ai-ark-people-discovery.md)');
  process.exit(2);
}

async function main() {
  if (!KEY) throw new UsageError('AI_ARK_API_KEY is not set (outbound/scripts/.env). Nothing was sent.');
  switch (CMD) {
    case 'count': return cmdCount();
    case 'sample': return cmdSample();
    case 'exclude-list': return cmdExcludeList();
    case 'plan': return cmdPlan();
    case 'pull': return cmdPull();
    default: throw new UsageError(`unknown command '${CMD || ''}'`);
  }
}

main().catch((err) => {
  if (err instanceof UsageError) { usageExit(err.message); return; }
  if (err instanceof BalanceOrOutageError) {
    console.error(scrub(`stop: ${err.message}`, KEY));
    process.exit(3);
  }
  console.error(scrub(`ERROR: ${(err && err.stack) || err}`, KEY));
  process.exit(1);
});
