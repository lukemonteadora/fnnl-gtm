#!/usr/bin/env node
// spider_fit_fetch.mjs: Spider Cloud homepage fetch for company fit and personalization (FNNL list building).
// Operator directive 2026-10-12: FNNL's list build reads company fit the way the A-Sales GTM folder does, Spider first.
// Ported from A-Sales fit_site_batch.mjs, the FETCH half only. There is NO AI call in this script, and there must never be one:
// FNNL's no-AI-API rule (CLAUDE.md section 7) allows only Claude Code and its sub-agents, so the judging stays with batched
// Claude sub-agents (/tam-build Layer 1a step 4, ruling model-jobs). This script fetches, caches, checks and merges.
//
// Three commands, all resumable, all on the COMPANY file (one row per company_domain, never the contacts file):
//   fetch  One Spider Cloud fetch of each company's homepage (--pages N lets the crawl follow up to N pages), cleaned to text,
//          cut to --max-chars and cached per domain in <out-dir>/site/. A row that already carries website text
//          (--site-text-field) uses it and skips Spider. The thin check is code, not a model: fetch failed, under --min-chars
//          of text, a parked or for-sale page, or a redirect to a different domain.
//            node spider_fit_fetch.mjs fetch --input tam.csv --out-dir <dir> [--pages 1] [--max-chars 3500] [--min-chars 500]
//                 [--site-text-field col] [--spider-concurrency 20] [--limit N] [--dry-run]
//   batch  Text blocks for the judge sub-agents, a few hundred companies per file (default 300; never one sub-agent per row).
//          Each block holds the company's data fields, the site status and the cached homepage text.
//            node spider_fit_fetch.mjs batch --input tam.csv --out-dir <dir> [--per-batch 300] [--fields a,b,c] [--only-ids ids.txt]
//   merge  Joins the sub-agents' verdict CSVs back by company_domain with an id and count check, applies the gate rules in code
//          (offer_fit = no resolves to bad) and writes results.csv with ship / dropped columns.
//            node spider_fit_fetch.mjs merge --input tam.csv --out-dir <dir> [--results <dir>/out] [--gold gold.csv]
//
// Spider pre-run check (A-Sales parity, FNNL operator directive 2026-10-12): before anything is spent, `fetch` estimates the
// run's credits (every homepage still to fetch x 8 credits x --pages) and reads the live balance (GET /data/credits, free).
// An estimate over the balance, or a balance it cannot read, STOPS with exit 3 before any spend: top up, then rerun. Cached
// homepages and --site-text-field rows are not counted, so a resume is never blocked. There is NO per-run credit cap and no
// substitute fetcher: a short balance means stop and ask (/tool-balance-guard). 8 credits a homepage is a planning figure
// taken from A-Sales; the first real FNNL run measures the true figure, saved per homepage in site/ and in manifest.json.
// Credits are counted from each reply's own cost (costs.total_cost is dollars; x 10,000 = credits).
// Spider is NEVER a source of companies, contacts or emails. A 402, 401 or 403 STOPS the run with progress saved.
//
// Outputs in --out-dir: site/<domain>.json, manifest.json, errors.jsonl (fetch); batches/b001.txt ... and batches.json (batch);
// results.csv, results.jsonl, merge-manifest.json and missing-verdicts.csv when any company lacks a verdict (merge).
// Exit: 0 fine | 1 usage or input error | 3 stopped, needs operator action (Spider balance, key or auth) | 4 merge finished with
// companies lacking a valid verdict (counted as dropped and reported at the top of the summary).

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import http from 'http';
import https from 'https';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ENV_FILE = path.resolve(HERE, '..', '.env');
const SPIDER_BASE = process.env.SPIDER_API_BASE_FOR_TEST || 'https://api.spider.cloud';
const SPIDER_CREDITS_PER_PAGE = 8;
const SPIDER_PAGE_CAP = 50;

// ── args ─────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const CMD = argv[0] && !argv[0].startsWith('--') ? argv[0] : '';
const args = {};
for (let i = CMD ? 1 : 0; i < argv.length; i++) {
  if (!argv[i].startsWith('--')) continue;
  const n = argv[i].slice(2), nx = argv[i + 1];
  if (nx === undefined || nx.startsWith('--')) args[n] = true; else { args[n] = nx; i++; }
}
const str = v => (v === undefined || v === true ? undefined : String(v));
const num = (v, d) => (v === undefined || v === true || isNaN(+v) ? d : +v);
function out(o) { fs.writeSync(1, JSON.stringify(o, null, 2) + '\n'); }
function die(msg, code = 1) { out({ ok: false, error: msg }); process.exit(code); }
const sleep = ms => new Promise(r => setTimeout(r, ms));
// Exit after a short pause: on Windows (Node 24) process.exit right after a fetch can die on a libuv assertion with exit 127,
// which would hide the 3 that tells the caller to top up (reproduced by A-Sales 2026-10-03).
const exitSoon = async code => { await sleep(100); process.exit(code); };

if (!['fetch', 'batch', 'merge'].includes(CMD)) die('usage: spider_fit_fetch.mjs <fetch|batch|merge> --input <company file> --out-dir <dir> (see the header)');
if (args['spider-credit-cap'] !== undefined) die('--spider-credit-cap is not an option: a run fetches every homepage; the pre-run balance check is the only Spider stop');
for (const f of ['request', 'proxy', 'spider-request', 'spider-proxy', 'cheap', 'web', 'model']) if (args[f] !== undefined) die(`--${f} is not an option: the Spider route is fixed and this script calls no AI model`);
const INPUT = str(args.input), OUT = str(args['out-dir']);
if (!INPUT || !OUT) die('--input <company file> and --out-dir <dir> are required');
if (!fs.existsSync(INPUT)) die(`input not found: ${INPUT}`);

const SITE_FIELD = str(args['site-text-field']);
const PAGES = Math.max(1, num(args.pages, 1)), MAX_CHARS = num(args['max-chars'], 3500), MIN_CHARS = num(args['min-chars'], 500);
const SPIDER_CONC = Math.max(1, num(args['spider-concurrency'], 20));
const DRY = !!args['dry-run'];

// ── csv ──────────────────────────────────────────────────────────────────────
function parseCsv(text) {
  const t = String(text).replace(/^﻿/, '');
  const rowsOut = []; let row = [], cell = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && t[i + 1] === '\n') i++; row.push(cell); cell = ''; if (row.length > 1 || row[0] !== '') rowsOut.push(row); row = []; }
    else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); if (row.length > 1 || row[0] !== '') rowsOut.push(row); }
  if (!rowsOut.length) return [];
  const head = rowsOut[0].map(h => h.trim());
  return rowsOut.slice(1).map(r => Object.fromEntries(head.map((h, i) => [h, r[i] === undefined ? '' : r[i]])));
}
const csvCell = v => { const s = v === null || v === undefined ? '' : typeof v === 'string' ? v : JSON.stringify(v); return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

// ── helpers ──────────────────────────────────────────────────────────────────
const normDomain = d => String(d || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
const regDomain = h => { h = normDomain(h); const p = h.split('.'); return /\.(co|com|org|gov|ac|net)\.[a-z]{2}$/.test(h) ? p.slice(-3).join('.') : p.slice(-2).join('.'); };
const appendLine = (f, o) => fs.appendFileSync(f, JSON.stringify(o) + '\n');
const sha = o => crypto.createHash('sha1').update(JSON.stringify(o)).digest('hex').slice(0, 16);
function spiderKey() {
  const env = fs.existsSync(ENV_FILE) ? fs.readFileSync(ENV_FILE, 'utf8') : '';
  return process.env.SPIDER_API_KEY || (env.match(/^SPIDER_API_KEY=(.*)$/m) || [])[1]?.trim().replace(/^["']|["']$/g, '');
}

// ── input ────────────────────────────────────────────────────────────────────
function loadRows() {
  if (!/\.csv$/i.test(INPUT)) die('--input must be a .csv company file');
  let rows = parseCsv(fs.readFileSync(INPUT, 'utf8'));
  if (!rows.length) die('input has no rows');
  if (!('company_domain' in rows[0])) die('input rows need a company_domain column');
  const person = Object.keys(rows[0]).filter(k => /^(email|work_email|personal_email|first_name|last_name|full_name|job_title|title|person_linkedin_url|contact_linkedin_url)$/i.test(k.trim()));
  if (person.length) die(`this looks like a contacts file (person columns: ${person.join(', ')}). Company fit runs on the company file, one row per company_domain; contacts get the verdict afterwards by joining on company_domain.`);
  const seen = new Set();
  for (const r of rows) {
    const d = normDomain(r.company_domain);
    if (!d) die('a row has a blank company_domain');
    if (seen.has(d)) die(`duplicate company_domain: ${d}. Dedupe the company file first (a contacts file repeats domains).`);
    seen.add(d); r.__d = d;
  }
  if (args.limit) rows = rows.slice(0, num(args.limit, rows.length));
  return rows;
}
const rows = loadRows();
fs.mkdirSync(path.join(OUT, 'site'), { recursive: true });
const siteFile = d => path.join(OUT, 'site', `${d.replace(/[^a-z0-9.-]/g, '_')}.json`);
const ERR = path.join(OUT, 'errors.jsonl');

// ── site text + thin check ───────────────────────────────────────────────────
const PARKED = /domain (is|may be) for sale|buy this domain|this domain (has expired|is parked)|parked (free|domain)|hugedomains|sedo\.com|dan\.com|afternic|account (has been )?suspended|website (is )?(coming soon|under construction)|index of \//i;
function cleanMd(md) {
  return String(md || '').replace(/!\[[^\]]*\]\([^)]*\)/g, ' ').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ').replace(/[#*_>`|]+/g, ' ').replace(/\s+/g, ' ').trim();
}
function judgeSite(domain, text, finalUrl) {
  const t = text.slice(0, MAX_CHARS);
  if (finalUrl && regDomain(finalUrl) && regDomain(finalUrl) !== regDomain(domain)) return { status: 'redirect', reason: `redirects to ${normDomain(finalUrl)}`, text: t };
  if (t.length < MIN_CHARS) return { status: 'thin', reason: `${t.length} characters of text`, text: t };
  if (t.length < 2500 && PARKED.test(t)) return { status: 'parked', reason: 'parked, for sale or placeholder page', text: t };
  return { status: 'ok', reason: '', text: t };
}
const givenText = r => (SITE_FIELD ? cleanMd(r[SITE_FIELD]) : '');
const siteTag = r => sha(givenText(r) ? { task: 'site-v1', domain: r.__d, provided: givenText(r) }
  : { task: 'site-v1', domain: r.__d, pages: PAGES, page_cap: SPIDER_PAGE_CAP, request: 'smart', proxy_enabled: false, return_format: 'markdown' });
function readSite(r) {
  try {
    const s = JSON.parse(fs.readFileSync(siteFile(r.__d), 'utf8'));
    if (s._cache !== siteTag(r) || s.domain !== r.__d || typeof s.text !== 'string') return null;
    // Re-evaluate readability from held raw text when thresholds change, without a new fetch.
    return typeof s.raw_text === 'string' ? { ...s, ...judgeSite(r.__d, s.raw_text, s.final_url || '') } : s;
  } catch { return null; }
}
// A failed fetch (status error or capped) is cached too, so a resume does not pay for it again; delete its file to retry.
const needsFetch = r => !readSite(r) && !givenText(r);

// ── Spider ───────────────────────────────────────────────────────────────────
let STOP = null;
const stats = { spider_calls: 0, retries: 0 };
const SPIDER_KEY = spiderKey();
async function spiderFetch(domain) {
  const body = { url: `https://${domain}`, limit: PAGES, return_format: 'markdown', request: 'smart', proxy_enabled: false, max_credits_per_page: SPIDER_PAGE_CAP };
  for (const wait of [0, 4000, 12000]) {
    if (wait) { stats.retries++; await sleep(wait); }
    if (STOP) return null;
    try {
      stats.spider_calls++;
      const r = await fetch(`${SPIDER_BASE}/crawl`, { method: 'POST', headers: { Authorization: `Bearer ${SPIDER_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(90000) });
      const txt = await r.text();
      if (r.status === 402 || /insufficient|not enough credits|out of credits/i.test(r.status >= 400 ? txt : '')) { STOP = STOP || { tool: 'spider', reason: `Spider HTTP ${r.status}: out of credits or plan limit`, detail: txt.slice(0, 300) }; return null; }
      if (r.status === 401 || r.status === 403) { STOP = STOP || { tool: 'spider', reason: `Spider HTTP ${r.status}: key rejected`, detail: txt.slice(0, 300) }; return null; }
      if (r.status === 429 || r.status >= 500) continue;
      let j; try { j = JSON.parse(txt); } catch { return { error: `Spider HTTP ${r.status}, non-JSON reply` }; }
      const pages = (Array.isArray(j) ? j : (j.pages || j.data || [])).filter(p => p && typeof p === 'object');
      if (!r.ok || !pages.length) return { error: `Spider HTTP ${r.status}, ${pages.length} pages` };
      const text = pages.map(p => cleanMd(p.content || p.markdown || '')).filter(Boolean).join('\n\n');
      const finalUrl = pages[0].url || pages[0].metadata?.url || '';
      const costed = pages.filter(p => Number.isFinite(parseFloat(p?.costs?.total_cost)));
      const credits = costed.length ? +costed.reduce((t, p) => t + parseFloat(p.costs.total_cost) * 10000, 0).toFixed(4) : null;
      const capErr = pages.map(p => String(p.error || '')).find(e => /credit|budget|blocked by client/i.test(e));
      if (!text && capErr) return { capped: true, reason: capErr.slice(0, 200), credits };
      return { text, finalUrl, pages: pages.length, credits };
    } catch { continue; }
  }
  return { error: 'Spider fetch failed after retries (timeout, 429 or 5xx)' };
}
// The balance read uses node:http(s) with no kept-alive socket, not fetch: a fetch read just before exit made a Windows run
// die with exit 127 about 1 time in 10 in A-Sales, hiding the stop code 3.
let balanceError = '';
function balanceOnce() {
  return new Promise(res => {
    const u = new URL(`${SPIDER_BASE}/data/credits`);
    const q = (u.protocol === 'http:' ? http : https).request(u, { agent: false, timeout: 20000, headers: { Authorization: `Bearer ${SPIDER_KEY}`, Connection: 'close' } }, r => {
      let b = ''; r.on('data', d => (b += d));
      r.on('end', () => { try { const c = parseFloat(JSON.parse(b)?.data?.credits); if (Number.isFinite(c)) return res(c); } catch {} balanceError = `HTTP ${r.statusCode}: ${b.slice(0, 120)}`; res(null); });
    });
    q.on('timeout', () => { balanceError = 'timeout'; q.destroy(); }); q.on('error', e => { balanceError = String(e.message || e).slice(0, 120); res(null); }); q.end();
  });
}
async function spiderBalance() { // three tries: one failed read must not stop a run
  for (const wait of [0, 1500, 4000]) { if (wait) await sleep(wait); const c = await balanceOnce(); if (c !== null) return c; }
  return null;
}

// ── fetch ────────────────────────────────────────────────────────────────────
async function cmdFetch() {
  const todo = rows.filter(needsFetch);
  const provided = rows.filter(r => givenText(r) && !readSite(r));
  for (const r of provided) fs.writeFileSync(siteFile(r.__d), JSON.stringify({ domain: r.__d, source: 'provided', raw_text: givenText(r), ...judgeSite(r.__d, givenText(r), ''), _cache: siteTag(r) }));
  const est = Math.ceil(todo.length * SPIDER_CREDITS_PER_PAGE * PAGES);
  const bal = est > 0 ? (process.env.SPIDER_BALANCE_FOR_TEST !== undefined ? +process.env.SPIDER_BALANCE_FOR_TEST : (SPIDER_KEY ? await spiderBalance() : null)) : null;
  const plan = { rows: rows.length, homepages_to_fetch: todo.length, cached_or_provided: rows.length - todo.length, credits_per_page: SPIDER_CREDITS_PER_PAGE, pages: PAGES,
    estimate_credits: est, estimate_usd: +(est * 0.0001).toFixed(2), balance_credits: bal === null ? null : Math.floor(bal),
    balance_error: bal === null && est > 0 ? (balanceError || 'no answer') : undefined, would_stop: est > 0 && (bal === null || est > bal) };
  if (DRY) { out({ ok: true, dryRun: true, plan, note: 'Nothing was fetched. Spider is called only for the homepages still to fetch; cached pages and --site-text-field rows are free.' }); return exitSoon(0); }
  if (plan.would_stop) {
    const reason = bal === null ? (SPIDER_KEY ? `could not read the Spider balance (${balanceError || 'no answer'})` : 'missing SPIDER_API_KEY in scripts/.env')
      : `this run needs about ${est} Spider credits (${todo.length} homepages x ${SPIDER_CREDITS_PER_PAGE} credits) but the balance is ${Math.floor(bal)}`;
    out({ alert: `STOPPED before any spend: spider: ${reason}. Top up Spider, then rerun.`, ok: false, stopped: { tool: 'spider', reason }, plan });
    return exitSoon(3);
  }
  let i = 0, fetched = 0, credits = 0, costed = 0, capped = 0, errors = 0;
  const before = est > 0 ? bal : null;
  await Promise.all(Array.from({ length: Math.min(SPIDER_CONC, todo.length) }, async () => {
    while (i < todo.length && !STOP) {
      const r = todo[i++]; const got = await spiderFetch(r.__d);
      if (!got) continue; // STOP set
      const c = got.credits ?? SPIDER_CREDITS_PER_PAGE; credits += c; if (got.credits != null) costed++;
      const rec = got.error ? { domain: r.__d, source: 'spider', status: 'error', reason: got.error, text: '', credits: got.credits ?? null }
        : got.capped ? { domain: r.__d, source: 'spider', status: 'capped', reason: `Spider per-page credit cap (${SPIDER_PAGE_CAP}): ${got.reason}`, text: '', credits: got.credits ?? null }
        : { domain: r.__d, source: 'spider', pages: got.pages, final_url: got.finalUrl, raw_text: got.text, credits: got.credits ?? null, ...judgeSite(r.__d, got.text, got.finalUrl) };
      rec._cache = siteTag(r);
      if (got.capped) capped++;
      if (got.error) { errors++; appendLine(ERR, { company_domain: r.__d, error: got.error }); }
      fs.writeFileSync(siteFile(r.__d), JSON.stringify(rec)); fetched++;
    }
  }));
  let after = null;
  if (fetched && process.env.SPIDER_BALANCE_FOR_TEST === undefined && SPIDER_KEY) { await sleep(2000); after = await spiderBalance(); }
  const siteStatus = {};
  for (const r of rows) { const s = readSite(r); const k = s ? s.status : 'not_fetched'; siteStatus[k] = (siteStatus[k] || 0) + 1; }
  const manifest = { finished_at: new Date().toISOString(), input: INPUT, rows: rows.length, fetched_this_run: fetched, errors, capped_pages: capped, site_status: siteStatus,
    spider: { credits_before: before, credits_after: after, credits_used: before !== null && after !== null ? +(before - after).toFixed(3) : null,
      credits_reported_this_run: +credits.toFixed(3), replies_with_cost: costed, credits_per_company: fetched ? +(credits / fetched).toFixed(3) : null, planning_figure_per_page: SPIDER_CREDITS_PER_PAGE },
    ...stats, stopped: STOP };
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
  const notFetched = siteStatus.not_fetched || 0;
  out({ alert: STOP ? `STOPPED: ${STOP.tool}: ${STOP.reason}${notFetched ? `. ${notFetched} homepages are not fetched yet: top up and rerun the same command to finish them` : ''}` : 'every homepage is fetched or cached', ok: !STOP, out_dir: OUT, ...manifest });
  return exitSoon(STOP ? 3 : 0);
}

// ── batch ────────────────────────────────────────────────────────────────────
const NO_FIELD_COLS = new Set(['__d']);
function cmdBatch() {
  const only = str(args['only-ids']) ? new Set(fs.readFileSync(str(args['only-ids']), 'utf8').split(/\r?\n/).map(normDomain).filter(Boolean)) : null;
  const target = rows.filter(r => !only || only.has(r.__d));
  const fields = str(args.fields) ? str(args.fields).split(',').map(s => s.trim()).filter(Boolean) : Object.keys(rows[0]).filter(k => !NO_FIELD_COLS.has(k) && k !== SITE_FIELD && k !== 'company_domain');
  const perBatch = Math.max(1, num(args['per-batch'], 300));
  const notReady = target.filter(r => !readSite(r)).map(r => r.__d);
  if (notReady.length) die(`${notReady.length} companies have no cached homepage yet (for example ${notReady.slice(0, 5).join(', ')}). Run fetch first; batch never calls Spider.`);
  fs.mkdirSync(path.join(OUT, 'batches'), { recursive: true });
  for (const f of fs.readdirSync(path.join(OUT, 'batches'))) if (/^b\d+\.txt$/.test(f)) fs.rmSync(path.join(OUT, 'batches', f));
  const files = [];
  for (let n = 0, b = 1; n < target.length; n += perBatch, b++) {
    const slice = target.slice(n, n + perBatch);
    const name = `b${String(b).padStart(3, '0')}.txt`;
    const blocks = slice.map(r => {
      const s = readSite(r);
      const data = fields.filter(k => r[k] !== undefined && r[k] !== '').map(k => `${k}: ${String(r[k]).replace(/\s+/g, ' ').slice(0, 1200)}`);
      return [`### ${r.__d}`, `WEBSITE_STATUS: ${s.status === 'ok' ? 'readable' : `${s.status}: ${s.reason}`}`, ...data, `WEBSITE_TEXT: ${s.text || ''}`].join('\n');
    });
    fs.writeFileSync(path.join(OUT, 'batches', name), blocks.join('\n\n') + '\n');
    files.push({ file: name, companies: slice.map(r => r.__d) });
  }
  fs.writeFileSync(path.join(OUT, 'batches.json'), JSON.stringify({ per_batch: perBatch, total: target.length, files }, null, 2));
  out({ ok: true, batches: files.length, companies: target.length, per_batch: perBatch, dir: path.join(OUT, 'batches'),
    verdict_columns: 'company_domain, fit_status (good|maybe|bad), fit_confidence (0-1), fit_reason, offer_fit (yes|no|unclear), offer_fit_reason, plus any variable the client prompt defines',
    next: 'Fan out Claude sub-agents (about 10 at once), one per batch file, each writing out/<batch>.csv; then run merge.' });
}

// ── merge ────────────────────────────────────────────────────────────────────
const validVerdict = v => v && ['good', 'maybe', 'bad'].includes(String(v.fit_status).toLowerCase()) && Number.isFinite(parseFloat(v.fit_confidence)) && parseFloat(v.fit_confidence) >= 0 && parseFloat(v.fit_confidence) <= 1
  && String(v.fit_reason || '').trim() && ['yes', 'no', 'unclear'].includes(String(v.offer_fit).toLowerCase()) && v.offer_fit_reason !== undefined;
const CORE = ['fit_status', 'fit_confidence', 'fit_reason', 'offer_fit', 'offer_fit_reason'];
async function cmdMerge() {
  const resDir = str(args.results) || path.join(OUT, 'out');
  if (!fs.existsSync(resDir)) die(`results folder not found: ${resDir}`);
  const want = new Set(rows.map(r => r.__d));
  const got = new Map(); const bad = []; const dupes = []; const unknown = [];
  for (const f of fs.readdirSync(resDir).filter(f => /\.csv$/i.test(f)).sort()) {
    for (const v of parseCsv(fs.readFileSync(path.join(resDir, f), 'utf8'))) {
      const d = normDomain(v.company_domain);
      if (!want.has(d)) { unknown.push(`${d} (${f})`); continue; }
      if (got.has(d)) { dupes.push(`${d} (${f})`); continue; }
      if (!validVerdict(v)) { bad.push(`${d} (${f})`); continue; }
      got.set(d, v);
    }
  }
  const extraKeys = new Set();
  const results = rows.map(r => {
    const s = readSite(r) || { status: 'not_fetched', text: '' }; const v = got.get(r.__d);
    const o = { company_domain: r.__d };
    for (const k of CORE) o[k] = v ? String(v[k]).trim() : '';
    if (v) for (const [k, val] of Object.entries(v)) if (!CORE.includes(k) && k !== 'company_domain' && val !== '') { o[k] = val; extraKeys.add(k); }
    for (const k of ['fit_status', 'offer_fit']) o[k] = o[k].toLowerCase();
    const modelStatus = o.fit_status; let cause = '';
    if (o.fit_status && o.offer_fit === 'no' && o.fit_status !== 'bad') { o.fit_status = 'bad'; cause = 'offer_fit'; o.fit_reason = `Cannot use the offer: ${o.offer_fit_reason} (ICP read was ${modelStatus}: ${o.fit_reason})`; }
    else if (o.fit_status === 'bad') cause = o.offer_fit === 'no' ? 'icp+offer_fit' : 'icp';
    const unsure = o.fit_status === 'bad' && (s.status !== 'ok' || parseFloat(o.fit_confidence) < 0.6 || o.offer_fit === 'unclear');
    Object.assign(o, { fit_status_model: modelStatus, bad_cause: cause, site_status: s.status, site_chars: (s.text || '').length, needs_review: !v || unsure ? 'yes' : 'no',
      ship: o.fit_status === 'good' || o.fit_status === 'maybe' ? 'yes' : 'no', verdict_missing: v ? 'no' : 'yes' });
    return o;
  });
  const cols = ['company_domain', ...CORE, ...extraKeys, 'fit_status_model', 'bad_cause', 'site_status', 'site_chars', 'needs_review', 'ship', 'verdict_missing'];
  fs.writeFileSync(path.join(OUT, 'results.csv'), [cols.join(','), ...results.map(o => cols.map(c => csvCell(o[c])).join(','))].join('\n') + '\n');
  fs.writeFileSync(path.join(OUT, 'results.jsonl'), results.map(o => JSON.stringify(o)).join('\n') + '\n');
  const missing = results.filter(o => o.verdict_missing === 'yes').map(o => o.company_domain);
  if (missing.length) fs.writeFileSync(path.join(OUT, 'missing-verdicts.csv'), 'company_domain\n' + missing.join('\n') + '\n');
  const count = k => results.reduce((m, o) => ((m[o[k] || '(none)'] = (m[o[k] || '(none)'] || 0) + 1), m), {});
  const m = { finished_at: new Date().toISOString(), rows_in: rows.length, verdicts_valid: got.size, rows_without_verdict: missing.length, invalid_verdict_rows: bad.length, duplicate_verdict_rows: dupes.length, unknown_id_rows: unknown.length,
    shipped: results.filter(o => o.ship === 'yes').length, shipped_good: results.filter(o => o.ship === 'yes' && o.fit_status === 'good').length, shipped_maybe: results.filter(o => o.ship === 'yes' && o.fit_status === 'maybe').length,
    dropped_bad: results.filter(o => o.fit_status === 'bad').length, fit_status: count('fit_status'), offer_fit: count('offer_fit'), site_status: count('site_status'), needs_review: results.filter(o => o.needs_review === 'yes').length };
  if (args.gold && fs.existsSync(String(args.gold))) {
    const gold = new Map(parseCsv(fs.readFileSync(String(args.gold), 'utf8')).map(g => [normDomain(g.company_domain), String(g.gold_fit_status || g.fit_status || '').trim().toLowerCase()]));
    const keep = s => s === 'good' || s === 'maybe'; const g = { rows: 0, exact: 0, keep_drop_agree: 0, wrong_drops: [], wrong_keeps: [], missing_verdict: 0 };
    for (const o of results) { const w = gold.get(o.company_domain); if (!w) continue; g.rows++; if (!o.fit_status) g.missing_verdict++; if (w === o.fit_status) g.exact++;
      if (keep(w) === keep(o.fit_status)) g.keep_drop_agree++; else (keep(w) ? g.wrong_drops : g.wrong_keeps).push(`${o.company_domain} (gold ${w}, ours ${o.fit_status || '(no verdict)'})`); }
    g.keep_drop_agree_pct = g.rows ? +(100 * g.keep_drop_agree / g.rows).toFixed(1) : null; m.gold_check = g;
  }
  fs.writeFileSync(path.join(OUT, 'merge-manifest.json'), JSON.stringify(m, null, 2));
  const problems = [bad.length && `${bad.length} verdict rows failed the contract`, dupes.length && `${dupes.length} duplicate ids`, unknown.length && `${unknown.length} unknown ids`].filter(Boolean).join(', ');
  const alert = missing.length ? `ALERT: ${missing.length} of ${rows.length} companies have NO valid verdict and count as DROPPED (missing-verdicts.csv): ${missing.slice(0, 10).join(', ')}${missing.length > 10 ? ', ...' : ''}${problems ? `. Also: ${problems}` : ''}. Re-run the sub-agents on the missing ids (batch --only-ids), then merge again.`
    : problems ? `NOTE: every company has a verdict, but ${problems} were ignored.` : 'every company has a verdict';
  out({ alert, ok: !missing.length, out_dir: OUT, ...m, bad_examples: bad.slice(0, 5), duplicate_examples: dupes.slice(0, 5), unknown_examples: unknown.slice(0, 5) });
  return exitSoon(missing.length ? 4 : 0);
}

if (CMD === 'fetch') await cmdFetch(); else if (CMD === 'batch') cmdBatch(); else await cmdMerge();
