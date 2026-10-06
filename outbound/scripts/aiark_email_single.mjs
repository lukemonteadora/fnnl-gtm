#!/usr/bin/env node
/**
 * aiark_email_single.mjs: the AI Ark rung of the email waterfall (outbound/reference/ai-ark-people-discovery.md,
 * "The email waterfall after discovery"). Reads the queue list_waterfall.py wrote for AI Ark
 * (<campaign>/_waterfall/queue-email-aiark.csv) and looks up one person at a time by AI Ark person id:
 *
 *   POST /api/developer-portal/v1/people/export/single   {"id": "<person id>"}   (1 credit only when an email is found,
 *                                                                                per AI Ark's CLI source; UNVERIFIED LIVE)
 *
 * It writes a results CSV in the shape `list_waterfall.py record --layer email --provider aiark` reads
 * (person_id, status found|not_found|error, email, provider_email_status, cost_usd, detail) and never verifies:
 * MillionVerifier judges every email afterwards.
 *
 * NEVER CALLS People Export (/v1/people/export) or the MCP email_finder tool: both bill 0.5 credits per person even on
 * a miss. Runs serially (the queue file's own note: one call at a time).
 *
 * Usage:
 *   node aiark_email_single.mjs --queue <queue-email-aiark.csv> --out <results.csv> --max-credits <n> [--limit <n>]
 *
 *   --max-credits  hard stop: no call is made once the credits charged (X-Credit header, else the balance delta) reach it
 *   --limit        process at most n new rows this run (use 5 for the first live billing test)
 *   Resumable: rows already in --out are skipped. Raw responses (key scrubbed) go to <out>.raw.jsonl so the
 *   response shape can be checked on the first run.
 *
 * EXIT CODES: 0 done or a deliberate stop (limit or max-credits), 1 other error, 2 usage/config error,
 * 3 insufficient balance (HTTP 402) or a persistent outage: the tool-balance stop, never substitute another tool.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnvFile(envPath) {
  const out = {};
  if (!fs.existsSync(envPath)) return out;
  for (const raw of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    let v = line.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    out[line.slice(0, eq).trim()] = v;
  }
  return out;
}

const KEY = ({ ...loadEnvFile(path.join(__dirname, '.env')), ...process.env }.AI_ARK_API_KEY || '').trim();
const BASE = 'https://api.ai-ark.com/api/developer-portal';
const scrub = (t) => (KEY ? String(t).split(KEY).join('***') : String(t));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class BalanceOrOutageError extends Error {}

function flag(name) {
  const i = process.argv.indexOf(name);
  return i === -1 ? undefined : process.argv[i + 1];
}

// ---- CSV ----
function parseCsv(text) {
  const rows = [];
  let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  const [header, ...body] = rows;
  return body.map((r) => Object.fromEntries(header.map((h, j) => [h.replace(/^﻿/, ''), r[j] ?? ''])));
}
const esc = (v) => { const s = String(v ?? ''); return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const COLS = ['person_id', 'status', 'email', 'provider_email_status', 'cost_usd', 'detail'];

// ---- response reading (shape confirmed live 2026-10-06, PropFuel) ----
// The person's emails are body.email.output[] = {address, status (VALID...), generic, free, found}. body.company.contact.email
// is the ORGANIZATION's generic inbox and is never used for a person.
function personEmails(body) {
  const out = Array.isArray(body?.email?.output) ? body.email.output : [];
  return out
    .filter((e) => e && typeof e.address === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.address.trim()) && e.found !== false)
    .map((e, i) => ({ path: `email.output.${i}`, email: e.address.trim().toLowerCase(), status: String(e.status || ''),
      generic: e.generic === true, free: e.free === true }));
}

const PERSONAL = new Set(['gmail.com','yahoo.com','hotmail.com','outlook.com','aol.com','icloud.com','me.com','msn.com','live.com','comcast.net','protonmail.com','att.net','verizon.net','sbcglobal.net']);
function pickEmail(hits, companyDomain) {
  const dom = String(companyDomain || '').toLowerCase().replace(/^www\./, '');
  const d = (e) => e.split('@')[1] || '';
  const sameOrg = (x) => dom && (d(x.email) === dom || d(x.email).endsWith('.' + dom));
  const work = (x) => !x.generic && !x.free && !PERSONAL.has(d(x.email));
  return hits.find((x) => work(x) && sameOrg(x)) || hits.find(work) || hits.find(sameOrg) || hits[0];
}

async function credits() {
  const r = await fetch(`${BASE}/v1/payments/credits`, { headers: { 'X-TOKEN': KEY } });
  if (!r.ok) return null;
  const j = await r.json().catch(() => ({}));
  return typeof j.total === 'number' ? j.total : null;
}

async function lookup(personId) {
  let backoff = 1000;
  for (let attempt = 0; ; attempt++) {
    let res;
    try {
      res = await fetch(`${BASE}/v1/people/export/single`, {
        method: 'POST', headers: { 'X-TOKEN': KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: personId }), redirect: 'manual',
      });
    } catch (err) {
      if (attempt >= 4) throw new BalanceOrOutageError(scrub(`network error: ${err?.message}`));
      await sleep(backoff); backoff = Math.min(backoff * 2, 10000); continue;
    }
    if (res.status === 402) throw new BalanceOrOutageError(scrub(`insufficient balance (HTTP 402): ${await res.text()}`));
    if (res.status === 429 || res.status >= 500) {
      if (attempt >= 4) throw new BalanceOrOutageError(`persistent outage (HTTP ${res.status})`);
      const ra = Number(res.headers.get('retry-after'));
      await sleep(Math.min(Number.isFinite(ra) && ra > 0 ? ra * 1000 : backoff, 10000));
      backoff = Math.min(backoff * 2, 10000); continue;
    }
    const text = await res.text();
    let body = {};
    try { body = text ? JSON.parse(text) : {}; } catch { body = { _raw: text.slice(0, 500) }; }
    return { http: res.status, credit: res.headers.get('x-credit') || '', body };
  }
}

async function main() {
  const queue = flag('--queue'), out = flag('--out'), maxRaw = flag('--max-credits'), limitRaw = flag('--limit');
  if (!queue || !out || !maxRaw) { console.error('usage: --queue <csv> --out <csv> --max-credits <n> [--limit <n>]'); process.exit(2); }
  if (!KEY) { console.error('AI_ARK_API_KEY missing in outbound/scripts/.env'); process.exit(2); }
  const maxCredits = Number(maxRaw), limit = limitRaw ? Number(limitRaw) : Infinity;
  const rows = parseCsv(fs.readFileSync(queue, 'utf8'));
  const done = new Set(fs.existsSync(out) ? parseCsv(fs.readFileSync(out, 'utf8')).map((r) => r.person_id) : []);
  if (!fs.existsSync(out)) fs.writeFileSync(out, COLS.join(',') + '\n');
  const rawPath = `${out}.raw.jsonl`;

  const before = await credits();
  let spent = 0, n = 0, found = 0, stop = '', sawHeader = false;
  for (const row of rows) {
    if (done.has(row.person_id)) continue;
    if (n >= limit) { stop = `limit ${limit} reached`; break; }
    if (spent >= maxCredits) { stop = `max-credits ${maxCredits} reached`; break; }
    let status = 'error', email = '', pstatus = '', detail = {};
    try {
      const r = await lookup(row.person_id);
      const charged = r.credit === '' ? NaN : Math.abs(Number(r.credit)); // AI Ark sends the charge as a negative number
      if (Number.isFinite(charged)) { spent += charged; sawHeader = true; }
      fs.appendFileSync(rawPath, scrub(JSON.stringify({ person_id: row.person_id, http: r.http, credit: r.credit, body: r.body })) + '\n');
      detail = { http: r.http, credits: r.credit };
      if (r.http >= 200 && r.http < 300 && r.body?.id && String(r.body.id) !== String(row.person_id)) {
        // Cross-talk guard (safe to shard): a reply for a different person is never recorded as this person's email.
        status = 'error'; detail.error = `response id ${r.body.id} does not match requested person`;
      } else if (r.http >= 200 && r.http < 300) {
        const hits = personEmails(r.body);
        if (hits.length) {
          const best = pickEmail(hits, row.company_domain);
          status = 'found'; email = best.email; pstatus = best.status; detail.email_path = best.path; if (best.generic) detail.generic = true; found++;
          if (hits.length > 1) detail.other_emails = hits.filter((h) => h !== best).map((h) => h.email).slice(0, 3);
        }
        else status = 'not_found';
      } else if (r.http === 404) status = 'not_found';
      else detail.error = scrub(JSON.stringify(r.body)).slice(0, 200);
    } catch (err) {
      if (err instanceof BalanceOrOutageError) {
        console.error(`STOP (tool-balance): ${err.message}`);
        process.exitCode = 3; stop = 'balance or outage'; break;
      }
      detail.error = scrub(err?.message || String(err)).slice(0, 200);
    }
    fs.appendFileSync(out, [row.person_id, status, email, pstatus, '', JSON.stringify(detail)].map(esc).join(',') + '\n');
    n++;
    // No X-Credit header seen: the cap falls back to the live balance delta, re-read every 25 rows.
    if (!sawHeader && before != null && n % 25 === 0) {
      const now = await credits();
      if (now != null) spent = before - now;
    }
    await sleep(250);
  }
  const after = await credits();
  console.log(JSON.stringify({ processed: n, found, header_credits: spent, balance_before: before, balance_after: after,
    balance_delta: before != null && after != null ? +(before - after).toFixed(2) : null, x_credit_header_seen: sawHeader,
    stopped: stop || 'queue done' }));
}

main().catch((err) => { console.error(scrub(err?.stack || err)); process.exit(1); });
