#!/usr/bin/env node
/**
 * prospeo_email_batch.mjs: the Prospeo rung of the email waterfall. Reads list_waterfall.py's
 * queue-email-prospeo.csv (people AI Ark already tried; routing requires_attempted) and enriches them 25 at a time:
 *
 *   POST https://api.prospeo.io/bulk-enrich-person   header X-KEY   {"only_verified_email": true, "data": [...]}
 *   1 credit per matched email, 0 on no match (Prospeo's published pricing, same as enrich-person)
 *
 * Every identifier on the row is sent (name, company name and website, LinkedIn URL) with identifier = person_id, so
 * results stitch back by id. Writes the shape `list_waterfall.py record --layer email --provider prospeo` reads.
 * Raw responses go to <out>.raw.jsonl (the key never appears in them). Never verifies: Giggal judges every email.
 *
 * Usage: node prospeo_email_batch.mjs --queue <queue-email-prospeo.csv> --out <results.csv> [--limit n]
 * Serial, resumable. Exit 3 = out of credits (HTTP 400 INSUFFICIENT_CREDITS / 402) or a persistent outage: the
 * tool-balance stop, never substitute another tool.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
function loadEnv(p) {
  const out = {};
  if (!fs.existsSync(p)) return out;
  for (const raw of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = raw.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return out;
}
const KEY = ({ ...loadEnv(path.join(__dirname, '.env')), ...process.env }.PROSPEO_API_KEY || '').trim();
const scrub = (t) => (KEY ? String(t).split(KEY).join('***') : String(t));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
class StopError extends Error {}
function flag(n) { const i = process.argv.indexOf(n); return i === -1 ? undefined : process.argv[i + 1]; }

function parseCsv(text) {
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { f += '"'; i++; } else if (c === '"') q = false; else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(f); f = ''; if (row.length > 1 || row[0] !== '') rows.push(row); row = []; }
    else f += c;
  }
  if (f !== '' || row.length) { row.push(f); rows.push(row); }
  const [h, ...b] = rows;
  return b.map((r) => Object.fromEntries(h.map((k, j) => [k.replace(/^﻿/, ''), r[j] ?? ''])));
}
const esc = (v) => { const s = String(v ?? ''); return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const COLS = ['person_id', 'status', 'email', 'provider_email_status', 'cost_usd', 'detail'];

function record(r) {
  const o = { identifier: r.person_id };
  if (r.first_name) o.first_name = r.first_name;
  if (r.last_name) o.last_name = r.last_name;
  if (r.first_name && r.last_name) o.full_name = `${r.first_name} ${r.last_name}`;
  if (r.company_name) o.company_name = r.company_name;
  if (r.company_domain) o.company_website = r.company_domain;
  if (/^https?:\/\//.test(r.linkedin_url || '')) o.linkedin_url = r.linkedin_url;
  if (/^https?:\/\//.test(r.company_linkedin || '')) o.company_linkedin_url = r.company_linkedin;
  return o;
}

async function call(data) {
  let backoff = 2000;
  for (let attempt = 0; ; attempt++) {
    let res;
    try {
      res = await fetch('https://api.prospeo.io/bulk-enrich-person', {
        method: 'POST', headers: { 'X-KEY': KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ only_verified_email: true, data }),
      });
    } catch (err) {
      if (attempt >= 3) throw new StopError(scrub(`network error: ${err?.message}`));
      await sleep(backoff); backoff *= 2; continue;
    }
    const text = await res.text();
    if (res.status === 429 || res.status >= 500) {
      if (attempt >= 3) throw new StopError(`persistent outage or rate limit (HTTP ${res.status})`);
      await sleep(backoff); backoff *= 2; continue;
    }
    let body = {};
    try { body = JSON.parse(text); } catch { throw new Error(scrub(`not JSON (HTTP ${res.status}): ${text.slice(0, 200)}`)); }
    const code = String(body.error_code || '');
    if (res.status === 402 || /INSUFFICIENT_CREDITS/i.test(code)) throw new StopError(`Prospeo out of credits (${code || res.status})`);
    if (res.status === 401 || /INVALID_API_KEY/i.test(code)) throw new StopError(`Prospeo rejected the key (${code || res.status})`);
    // A batch where nobody matched comes back as HTTP 400 NO_MATCH (seen live 2026-10-06): every row is not_found, 0 credits.
    if (/^NO_MATCH$/i.test(code)) return { matched: [], not_matched: data.map((d) => d.identifier), total_cost: 0 };
    if (res.status < 200 || res.status >= 300) throw new Error(scrub(`HTTP ${res.status}: ${text.slice(0, 300)}`));
    return body;
  }
}

function emailOf(rec) {
  const p = rec?.person || {};
  const e = p.email;
  if (e && typeof e === 'object') return { email: String(e.email || '').trim().toLowerCase(), status: String(e.status || '') };
  if (typeof e === 'string') return { email: e.trim().toLowerCase(), status: '' };
  return { email: '', status: '' };
}

async function main() {
  const queue = flag('--queue'), out = flag('--out');
  const limit = flag('--limit') ? Number(flag('--limit')) : Infinity;
  if (!queue || !out) { console.error('usage: --queue <csv> --out <csv> [--limit n]'); process.exit(2); }
  if (!KEY) { console.error('PROSPEO_API_KEY missing in outbound/scripts/.env'); process.exit(2); }
  const rows = parseCsv(fs.readFileSync(queue, 'utf8'));
  const done = new Set(fs.existsSync(out) ? parseCsv(fs.readFileSync(out, 'utf8')).map((r) => r.person_id) : []);
  if (!fs.existsSync(out)) fs.writeFileSync(out, COLS.join(',') + '\n');
  const todo = rows.filter((r) => !done.has(r.person_id)).slice(0, limit);
  const tally = { processed: 0, found: 0, not_found: 0, error: 0, credits_reported: 0 };
  let stop = '';
  for (let i = 0; i < todo.length; i += 25) {
    const chunk = todo.slice(i, i + 25);
    const lines = [];
    try {
      const body = await call(chunk.map(record));
      fs.appendFileSync(`${out}.raw.jsonl`, scrub(JSON.stringify(body)) + '\n');
      if (Number.isFinite(Number(body.total_cost))) tally.credits_reported += Number(body.total_cost);
      const matched = new Map((body.matched || []).map((m) => [String(m.identifier), m]));
      for (const r of chunk) {
        const m = matched.get(r.person_id);
        const { email, status } = m ? emailOf(m) : { email: '', status: '' };
        const detail = { matched: !!m };
        if (m && m.free_enrichment !== undefined) detail.free_enrichment = m.free_enrichment;
        lines.push(email ? [r.person_id, 'found', email, status, '', JSON.stringify(detail)]
                         : [r.person_id, 'not_found', '', '', '', JSON.stringify(detail)]);
      }
    } catch (err) {
      if (err instanceof StopError) { console.error(`STOP (tool-balance): ${err.message}`); process.exitCode = 3; stop = err.message; break; }
      for (const r of chunk) lines.push([r.person_id, 'error', '', '', '', JSON.stringify({ error: scrub(err.message).slice(0, 200) })]);
    }
    for (const l of lines) { fs.appendFileSync(out, l.map(esc).join(',') + '\n'); tally.processed++; tally[l[1]]++; }
    await sleep(500);
  }
  console.log(JSON.stringify({ ...tally, stopped: stop || 'queue done' }));
}
main().catch((err) => { console.error(scrub(err?.stack || err)); process.exit(1); });
