#!/usr/bin/env node
/**
 * deliverable_verify.mjs — email verification + catch-all via Deliverable.co (app.deliverable.co).
 *
 * Deliverable.co is the operator's email-verification tool (a sub-product of A-Leads). It is a
 * TWO-IN-ONE verifier: one async call returns `email_status` (deliverable | undeliverable | risky |
 * unknown) AND `is_catch_all` (boolean). It therefore REPLACES both A-Leads `verify_email` and
 * BounceBan — A-Leads is no longer used for verification (operator directive 2026-06-16).
 *
 * API (verified live 2026-06-16):
 *   base   https://api.deliverable.co/gateway
 *   auth   header `x-api-key: <DELIVERABLE_API_KEY>`
 *   single (async): POST /verify/single {email}            -> {data:{task_id}}
 *                   POST /verify/single/status {task_id}   -> {data:{processing_status, email, email_status, is_catch_all}}
 *   bulk   (async): POST /verify/bulk  (multipart file+fileName, ≤25MB, one email/line) -> {data:{file_id}}
 *                   POST /verify/bulk/status {file_id}     -> {data:{status, download_url}}
 *                   GET  /verify/bulk/files?page&pageSize  -> list
 *   errors 400 bad input · 401 bad key · 402 no credits/expired · 413 file>25MB · 429 rate limit
 *   NOTE: no balance/credits endpoint exists — preflight is a connectivity check + 402 handling only.
 *
 * Gate mapping (catch-all OVERRIDES deliverable for send-safety — a catch-all "deliverable" is NOT clean valid):
 *   deliverable + is_catch_all=false -> valid       (send-safe)
 *   deliverable + is_catch_all=true  -> catch_all    (review / operator-approved only)
 *   undeliverable                    -> invalid
 *   risky                            -> risky
 *   unknown                          -> unknown
 *
 * Usage:
 *   node deliverable_verify.mjs --check                      connectivity test (verifies one address)
 *   node deliverable_verify.mjs --verify <email>            verify one email, print result
 *   node deliverable_verify.mjs <input.csv> [opts]          verify every email in a CSV (single-async, fast)
 *   node deliverable_verify.mjs --bulk <input.csv> [opts]   verify via the bulk-file endpoint (slow queue; large jobs)
 * Options:
 *   --email-col <name>   email column name (default: auto-detect email/email_address/work_email)
 *   --out <path>         output CSV (default: <input>.deliverable.csv)
 *   --concurrency <n>    parallel in-flight verifications for single-async mode (default 8)
 *   --max <n>            cap number of rows verified (safety)
 *   --poll-timeout <s>   per-task poll budget in seconds (default 60 single / 1800 bulk)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = 'https://api.deliverable.co/gateway';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---- .env loader (no dependency) ----
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
loadEnv();
const KEY = process.env.DELIVERABLE_API_KEY;
if (!KEY) { console.error('FATAL: DELIVERABLE_API_KEY not in env / scripts/.env'); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(pathname, { method = 'POST', json, form } = {}) {
  const headers = { 'x-api-key': KEY };
  let body;
  if (form) { body = form; }
  else if (json !== undefined) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(json); }
  // Resilient to transient network drops ("fetch failed") — retry with backoff instead of
  // letting one socket error abort the whole campaign (added 2026-06-22 after a burst run
  // hit a connection wall mid-list). Only network-level throws are retried here; HTTP status
  // codes (401/402/429/…) are returned and handled by the callers.
  let lastErr;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await fetch(BASE + pathname, { method, headers, body });
      const text = await res.text();
      let parsed = null; try { parsed = JSON.parse(text); } catch { /* non-JSON */ }
      return { status: res.status, text, data: parsed && parsed.data, raw: parsed };
    } catch (e) {
      lastErr = e;
      await sleep(800 * (attempt + 1));
    }
  }
  throw lastErr;
}

function gateFor(email_status, is_catch_all) {
  if (email_status === 'deliverable') return is_catch_all ? 'catch_all' : 'valid';
  if (email_status === 'undeliverable') return 'invalid';
  if (email_status === 'risky') return 'risky';
  return 'unknown';
}

function fatalForStatus(status) {
  if (status === 401) return 'Deliverable.co 401 — invalid DELIVERABLE_API_KEY.';
  if (status === 402) return 'Deliverable.co 402 — no credits / subscription expired / payment issue. Top up at app.deliverable.co.';
  if (status === 413) return 'Deliverable.co 413 — bulk file exceeds 25MB. Split it.';
  return null;
}

// ---- single async verify (submit -> poll) ----
async function verifyOne(email, { pollTimeout = 60 } = {}) {
  const sub = await api('/verify/single', { json: { email } });
  const fatal = fatalForStatus(sub.status);
  if (fatal) throw new Error(fatal);
  if (sub.status === 429) return { email, email_status: 'rate_limited', is_catch_all: null, gate: 'unknown', _retry: true };
  if (sub.status !== 200 || !sub.data || !sub.data.task_id) return { email, email_status: 'submit_failed', is_catch_all: null, gate: 'unknown', _err: sub.text.slice(0, 200) };
  const task_id = sub.data.task_id;
  const deadline = Date.now() + pollTimeout * 1000;
  let delay = 1500;
  while (Date.now() < deadline) {
    await sleep(delay);
    const st = await api('/verify/single/status', { json: { task_id } });
    if (fatalForStatus(st.status)) throw new Error(fatalForStatus(st.status));
    if (st.status === 200 && st.data && st.data.processing_status === 'completed') {
      const { email_status, is_catch_all } = st.data;
      return { email, email_status, is_catch_all, gate: gateFor(email_status, is_catch_all) };
    }
    delay = Math.min(delay + 500, 4000);
  }
  return { email, email_status: 'timeout', is_catch_all: null, gate: 'unknown' };
}

// ---- minimal CSV ----
function parseCSV(text) {
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
const csvCell = (v) => { v = v == null ? '' : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
const toCSV = (rows) => rows.map((r) => r.map(csvCell).join(',')).join('\n') + '\n';

function detectEmailCol(header, override) {
  if (override) { const i = header.indexOf(override); if (i < 0) throw new Error(`--email-col "${override}" not found in header`); return i; }
  const cands = ['email', 'email_address', 'work_email', 'Email', 'EMAIL'];
  for (const c of cands) { const i = header.indexOf(c); if (i >= 0) return i; }
  const i = header.findIndex((h) => /email/i.test(h)); if (i >= 0) return i;
  throw new Error('no email column found; pass --email-col <name>');
}

// ---- bulk-file verify (slow queue; large jobs) ----
async function verifyBulk(emails, { pollTimeout = 1800 } = {}) {
  const fd = new FormData();
  fd.append('file', new Blob([emails.join('\n') + '\n'], { type: 'text/plain' }), 'deliverable_input.txt');
  fd.append('fileName', 'waterfall_' + emails.length);
  const up = await api('/verify/bulk', { form: fd });
  const fatal = fatalForStatus(up.status); if (fatal) throw new Error(fatal);
  if (up.status !== 200 || !up.data || !up.data.file_id) throw new Error('bulk upload failed: ' + up.text.slice(0, 300));
  const file_id = up.data.file_id;
  console.error(`[bulk] uploaded ${emails.length} emails, file_id=${file_id}; polling (queue is slow)…`);
  const deadline = Date.now() + pollTimeout * 1000;
  while (Date.now() < deadline) {
    await sleep(5000);
    const st = await api('/verify/bulk/status', { json: { file_id } });
    if (fatalForStatus(st.status)) throw new Error(fatalForStatus(st.status));
    const s = st.data && st.data.status;
    if (s === 'completed' && st.data.download_url) {
      const dl = await fetch(st.data.download_url);
      return { file_id, body: await dl.text(), contentType: dl.headers.get('content-type') };
    }
    if (s === 'failed') throw new Error('bulk file failed: ' + st.text.slice(0, 300));
  }
  throw new Error(`bulk poll timeout after ${pollTimeout}s (file_id=${file_id}); re-poll later with --bulk-status ${file_id}`);
}

// ---- CLI ----
const argv = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const has = (n) => argv.includes(n);

(async () => {
  if (has('--check')) {
    const r = await verifyOne('<OPERATOR_EMAIL>');
    console.log('Deliverable.co connectivity OK:', JSON.stringify(r));
    console.log('(No balance endpoint exists; a 402 on a real run = out of credits / expired.)');
    return;
  }
  if (has('--bulk-status')) {
    const file_id = flag('--bulk-status');
    const st = await api('/verify/bulk/status', { json: { file_id } });
    console.log(st.status, st.text);
    if (st.data && st.data.download_url) { const dl = await fetch(st.data.download_url); console.log('\n--- downloaded ---\n' + (await dl.text()).slice(0, 2000)); }
    return;
  }
  if (has('--verify')) {
    console.log(JSON.stringify(await verifyOne(flag('--verify')), null, 2));
    return;
  }

  const input = argv.find((a) => !a.startsWith('--') && a !== flag('--email-col') && a !== flag('--out') && a !== flag('--concurrency') && a !== flag('--max') && a !== flag('--poll-timeout'));
  if (!input) { console.error('Usage: node deliverable_verify.mjs <input.csv> [--email-col x] [--out y] [--concurrency 8] [--max N] | --check | --verify <email> | --bulk <input.csv>'); process.exit(2); }
  if (!fs.existsSync(input)) { console.error('input not found: ' + input); process.exit(2); }

  const rows = parseCSV(fs.readFileSync(input, 'utf8'));
  const header = rows[0];
  const emailIdx = detectEmailCol(header, flag('--email-col'));
  let body = rows.slice(1);
  const max = flag('--max'); if (max) body = body.slice(0, +max);
  const emails = body.map((r) => (r[emailIdx] || '').trim()).map((e) => e || null);
  const out = flag('--out') || input.replace(/\.csv$/i, '') + '.deliverable.csv';

  if (has('--bulk')) {
    const list = emails.filter(Boolean);
    const res = await verifyBulk(list, { pollTimeout: +flag('--poll-timeout', 1800) });
    fs.writeFileSync(out.replace(/\.csv$/, '') + '.bulkraw', res.body);
    console.log(`[bulk] downloaded ${res.body.length} bytes (${res.contentType}) -> ${out.replace(/\.csv$/, '') + '.bulkraw'}`);
    console.log('[bulk] parse + join the downloaded file onto your CSV by email (format printed above on first run).');
    return;
  }

  // single-async, bounded concurrency
  const conc = +flag('--concurrency', 8);
  const pollTimeout = +flag('--poll-timeout', 60);
  const results = new Array(emails.length).fill(null);
  let next = 0, done = 0;
  const counts = { valid: 0, catch_all: 0, invalid: 0, risky: 0, unknown: 0 };
  async function worker() {
    while (next < emails.length) {
      const i = next++;
      const e = emails[i];
      if (!e) { results[i] = { email: '', email_status: 'no_email', is_catch_all: '', gate: 'no_email' }; continue; }
      let r = await verifyOne(e, { pollTimeout });
      if (r._retry) { await sleep(3000); r = await verifyOne(e, { pollTimeout }); }
      results[i] = r;
      counts[r.gate] = (counts[r.gate] || 0) + 1;
      if (++done % 25 === 0) console.error(`[deliverable] ${done}/${emails.length}`);
    }
  }
  await Promise.all(Array.from({ length: Math.min(conc, emails.length) }, worker));

  // Canonical column the rest of /email-waterfall + bettercontact_enrich.mjs read is `email_status` = the GATE
  // (valid | catch_all | invalid | risky | unknown | no_email). Upsert it (overwrite if the input already had one).
  // Keep Deliverable.co's RAW status (deliverable/undeliverable/risky/unknown) in a separate column for transparency.
  const outCols = ['email_status', 'is_catch_all', 'deliverable_raw_status', 'verified_by'];
  const outHeader = [...header];
  const colIdx = {};
  for (const c of outCols) { let i = outHeader.indexOf(c); if (i < 0) { i = outHeader.length; outHeader.push(c); } colIdx[c] = i; }
  const outRows = [outHeader, ...body.map((r, i) => {
    const v = results[i] || {};
    const row = [...r];
    while (row.length < outHeader.length) row.push('');
    row[colIdx['email_status']] = v.gate ?? '';                  // GATE — canonical, downstream reads this
    row[colIdx['is_catch_all']] = v.is_catch_all ?? '';
    row[colIdx['deliverable_raw_status']] = v.email_status ?? ''; // raw deliverable/undeliverable/risky/unknown
    row[colIdx['verified_by']] = 'deliverable.co';
    return row;
  })];
  fs.writeFileSync(out, toCSV(outRows));
  console.log(`Wrote ${out} (${body.length} rows).`);
  console.log('Gate counts:', JSON.stringify(counts));
  console.log('Send-safe = gate "valid". catch_all/risky/unknown -> review; invalid/no_email -> BetterContact residue (see /email-waterfall).');
})().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
