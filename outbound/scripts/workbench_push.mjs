#!/usr/bin/env node
// workbench_push.mjs: push a CSV's rows into one of a client's list-workbench
// tables through that table's inbound webhook, so the operator watches the list
// fill live. Protocol: stack-contract.yaml lead_data.list_workbench.build_protocol.
//
// Zero workbench credits: a webhook import itself costs no credits and no
// Actions. It CAN still trigger spend if the receiving table auto-runs
// enrichment columns on new rows, so this script refuses to push into a table
// the operator has not marked `auto_run_off: true`.
//
// Usage (paths resolve from the current directory, then from <outbound>/):
//   node scripts/workbench_push.mjs --client <slug> --table <companies|contacts|scored|send_list>
//        --stage <list_stage> --csv <path> [--campaign <campaign-slug>] [--dry-run] [--force] [--rate 8]
//
// Table config lives in the client's gitignored profiles/<slug>/client-profile.yaml:
//   list_workbench_tables:
//     companies:
//       webhook_url: ""        # from the table's webhook source in the workbench UI
//       ready: false           # operator sets true once the table exists
//       auto_run_off: false    # operator sets true once auto-run is off on the table
//       auth_header: ""        # optional: header name exactly as the workbench's cURL example shows it
//       auth_token_env: ""     # optional: name of the scripts/.env variable holding that token
//     contacts: { ... }        # same keys
//     scored: { ... }
//     send_lists:
//       <campaign-slug>: { ... }
//
// Exit codes: 0 every row pushed | 2 bad arguments or setup | 3 table not ready
// (the calling skill falls back to CSV-only and says so) | 4 this exact CSV was
// already pushed to this table (re-pushing appends duplicates; --force overrides)
// | 5 shortfall: some rows failed, and they are written to a failed-rows CSV so a
// retry pushes only those | 6 the webhook refused with 403 (its 50,000-row
// lifetime cap, or the plan does not allow webhooks); remaining rows are written
// to the failed-rows CSV.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTBOUND = path.resolve(__dirname, '..');
// Test-only override so the script can be exercised against a scratch profile.
const PROFILES_DIR = process.env.WORKBENCH_PROFILES_DIR || path.join(OUTBOUND, 'profiles');
const ENV_PATH = path.join(__dirname, '.env');

const TABLES = new Set(['companies', 'contacts', 'scored', 'send_list']);
const WEBHOOK_ROW_CAP = 50000;      // lifetime submissions per webhook source
const CAP_WARN_AT = 45000;
const MAX_PAYLOAD_BYTES = 100 * 1024;
const MAX_RATE = 9;                 // workspace-wide limit is 10/s; stay under it

// ── args ────────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (!t.startsWith('--')) continue;
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) a[t.slice(2)] = true;
    else { a[t.slice(2)] = next; i++; }
  }
  return a;
}
function die(msg, code = 2) {
  console.error(`workbench_push: ${msg}`);
  process.exit(code);
}

// ── .env (same loader shape as the other scripts; values never printed) ──────
function loadEnv() {
  const out = {};
  if (!fs.existsSync(ENV_PATH)) return out;
  for (const raw of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    let v = line.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    out[line.slice(0, eq).trim()] = v;
  }
  return { ...out, ...process.env };
}

// ── minimal reader for the list_workbench_tables block ─────────────────────────
function stripInlineComment(s) {
  let inS = false, inD = false;
  for (let k = 0; k < s.length; k++) {
    const c = s[k];
    if (c === "'" && !inD) inS = !inS;
    else if (c === '"' && !inS) inD = !inD;
    else if (c === '#' && !inS && !inD && (k === 0 || /\s/.test(s[k - 1]))) return s.slice(0, k);
  }
  return s;
}
function scalar(v) {
  v = v.trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) return v.slice(1, -1);
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (v === '' || v === 'null' || v === '~') return '';
  return v;
}
function flowMap(v) {
  const body = v.trim().replace(/^\{/, '').replace(/\}$/, '');
  const out = {};
  let part = '', inS = false, inD = false;
  const flush = () => {
    const i = part.indexOf(':');
    if (i !== -1) out[part.slice(0, i).trim()] = scalar(part.slice(i + 1));
    part = '';
  };
  for (const c of body) {
    if (c === "'" && !inD) inS = !inS;
    else if (c === '"' && !inS) inD = !inD;
    if (c === ',' && !inS && !inD) { flush(); continue; }
    part += c;
  }
  if (part.trim()) flush();
  return out;
}
function readTablesBlock(text) {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex(l => /^list_workbench_tables\s*:/.test(l));
  if (start === -1) return null;
  const root = {};
  const stack = [{ indent: -1, obj: root }];
  for (let j = start + 1; j < lines.length; j++) {
    const raw = stripInlineComment(lines[j]);
    if (raw.trim() === '') continue;
    if (/^\S/.test(raw)) break; // next top-level key ends the block
    const m = raw.match(/^(\s*)([^:\s][^:]*?)\s*:\s*(.*)$/);
    if (!m) continue;
    const indent = m[1].length, key = m[2].trim(), val = m[3];
    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) stack.pop();
    const parent = stack[stack.length - 1].obj;
    if (val.trim() === '') {
      parent[key] = {};
      stack.push({ indent, obj: parent[key] });
    } else if (val.trim().startsWith('{')) {
      parent[key] = flowMap(val);
    } else {
      parent[key] = scalar(val);
    }
  }
  return root;
}

// ── CSV ─────────────────────────────────────────────────────────────────────
function parseCsv(text) {
  const rows = []; let i = 0, field = '', record = [], inQ = false;
  const pushF = () => { record.push(field); field = ''; };
  const pushR = () => { rows.push(record); record = []; };
  while (i < text.length) {
    const ch = text[i];
    if (inQ) { if (ch === '"') { if (text[i + 1] === '"') { field += '"'; i += 2; continue; } inQ = false; i++; continue; } field += ch; i++; continue; }
    if (ch === '"') { inQ = true; i++; continue; }
    if (ch === ',') { pushF(); i++; continue; }
    if (ch === '\r') { i++; continue; }
    if (ch === '\n') { pushF(); pushR(); i++; continue; }
    field += ch; i++;
  }
  if (field.length || record.length) { pushF(); pushR(); }
  return rows;
}
const esc = v => { const s = v == null ? '' : String(v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };

// ── main ────────────────────────────────────────────────────────────────────
const args = parseArgs(process.argv.slice(2));
const client = args.client, table = args.table, stage = args.stage, campaign = args.campaign;
if (!client || !table || !stage || !args.csv) die('required: --client <slug> --table <companies|contacts|scored|send_list> --stage <list_stage> --csv <path>');
if (!/^[A-Za-z0-9_-]+$/.test(client)) die(`bad --client "${client}"`);
if (!TABLES.has(table)) die(`--table must be one of ${[...TABLES].join(', ')}`);
if (!/^[a-z0-9_]+$/.test(stage)) die('--stage must be lowercase letters, digits or underscores (e.g. company_tam)');
if (table === 'send_list' && !campaign) die('--table send_list needs --campaign <campaign-slug>');
const rate = Math.min(Number(args.rate) || 8, MAX_RATE);
const dryRun = args['dry-run'] === true;

const profileDir = path.join(PROFILES_DIR, client);
const profilePath = path.join(profileDir, 'client-profile.yaml');
if (!fs.existsSync(profilePath)) die(`no client profile at profiles/${client}/client-profile.yaml`);

let csvPath = path.resolve(args.csv);
if (!fs.existsSync(csvPath)) csvPath = path.resolve(OUTBOUND, args.csv);
if (!fs.existsSync(csvPath)) die(`CSV not found: ${args.csv}`);

// Readiness. Every reason is listed so the operator can fix them in one pass.
const block = readTablesBlock(fs.readFileSync(profilePath, 'utf8')) || {};
const entry = table === 'send_list' ? (block.send_lists || {})[campaign] : block[table];
const label = table === 'send_list' ? `send_list ${campaign}` : table;
const notReady = [];
if (!entry || typeof entry !== 'object') notReady.push(`no list_workbench_tables.${table === 'send_list' ? `send_lists.${campaign}` : table} entry in client-profile.yaml`);
else {
  const url = String(entry.webhook_url || '');
  const localTest = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(url);
  if (!/^https:\/\//.test(url) && !localTest) notReady.push('webhook_url is empty or not https');
  if (entry.ready !== true) notReady.push('ready is not true');
  if (entry.auto_run_off !== true) notReady.push('auto_run_off is not true (a table that auto-runs columns on new rows can spend workbench credits)');
  if (entry.auth_header && !entry.auth_token_env) notReady.push('auth_header is set but auth_token_env is empty');
}
if (notReady.length) {
  console.log(`list workbench not ready: ${label}. ${notReady.join('; ')}.`);
  console.log('Fallback: keep the CSV as the working copy and say "list workbench not ready: built CSV-only" in the report.');
  process.exit(3);
}

const env = loadEnv();
let authHeaders = {};
if (entry.auth_header) {
  const token = env[entry.auth_token_env];
  if (!token) die(`auth token variable ${entry.auth_token_env} is empty in scripts/.env`);
  authHeaders = { [entry.auth_header]: token };
}
const webhookUrl = entry.webhook_url;
const webhookFp = crypto.createHash('sha256').update(webhookUrl).digest('hex').slice(0, 12);
const webhookHost = new URL(webhookUrl).host;

const csvText = fs.readFileSync(csvPath, 'utf8').replace(/^﻿/, '');
const csvSha = crypto.createHash('sha256').update(csvText).digest('hex');
const parsed = parseCsv(csvText).filter(r => r.some(c => c.trim() !== ''));
if (parsed.length === 0) die('CSV is empty');
const header = parsed[0];
const dataRows = parsed.slice(1);
for (const reserved of ['list_stage', 'pushed_at', 'push_id', 'push_row']) {
  if (header.includes(reserved)) die(`CSV already has a "${reserved}" column; the push adds it. Remove it first.`);
}

// Push log: duplicate refusal and the per-webhook lifetime cap.
const logDir = path.join(profileDir, 'workbench');
const logPath = path.join(logDir, 'push-log.jsonl');
const log = fs.existsSync(logPath)
  ? fs.readFileSync(logPath, 'utf8').split(/\r?\n/).filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean)
  : [];
const prior = log.find(e => e.webhook_fp === webhookFp && e.csv_sha256 === csvSha && e.pushed > 0);
if (prior && !args.force) {
  console.log(`refused: this exact CSV was already pushed to ${label} on ${prior.ts} (${prior.pushed} rows, list_stage=${prior.stage}).`);
  console.log('Webhook pushes append rows, so pushing again would duplicate them. To retry failures, push the failed-rows CSV. Use --force only for a deliberate re-push.');
  process.exit(4);
}
const usedOnWebhook = log.filter(e => e.webhook_fp === webhookFp).reduce((n, e) => n + (e.attempted || e.pushed || 0), 0);
if (usedOnWebhook + dataRows.length > WEBHOOK_ROW_CAP) {
  console.log(`refused: ${label} webhook has ${usedOnWebhook} logged submissions; ${dataRows.length} more would pass its ${WEBHOOK_ROW_CAP}-row lifetime cap. Ask the operator for a new webhook source on the table and update webhook_url.`);
  process.exit(6);
}

const pushId = crypto.randomBytes(4).toString('hex');
const pushedAt = new Date().toISOString();
const payloads = dataRows.map((r, idx) => {
  const obj = {};
  header.forEach((h, k) => { obj[h] = r[k] ?? ''; });
  obj.list_stage = stage;
  obj.pushed_at = pushedAt;
  obj.push_id = pushId;
  obj.push_row = idx + 1;
  return obj;
});

console.log(`${dryRun ? '[dry run] ' : ''}${label} <- ${path.relative(process.cwd(), csvPath)}: ${payloads.length} rows, list_stage=${stage}, host ${webhookHost}, ~${rate}/s.`);
if (usedOnWebhook + payloads.length > CAP_WARN_AT) console.log(`warning: this webhook will be at ${usedOnWebhook + payloads.length} of ${WEBHOOK_ROW_CAP} lifetime rows.`);

const oversize = payloads.filter(p => Buffer.byteLength(JSON.stringify(p)) > MAX_PAYLOAD_BYTES).length;
if (dryRun) {
  console.log(`[dry run] columns: ${header.length} + list_stage, pushed_at, push_id, push_row. Rows over 100 KB: ${oversize}. Nothing sent, nothing logged.`);
  process.exit(0);
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function postRow(body) {
  let lastStatus = 0;
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const res = await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders }, body });
      lastStatus = res.status;
      if (res.ok) return { ok: true };
      if (res.status === 403) return { ok: false, status: 403, fatal: true };
      if (res.status === 429) {
        const wait = Math.max(1, Number(res.headers.get('retry-after')) || 1) * 1000 * 2 ** Math.min(attempt, 3);
        await sleep(wait);
        continue;
      }
      if (res.status >= 500) { await sleep(1000 * 2 ** attempt); continue; }
      return { ok: false, status: res.status }; // 4xx other than 403/429: the row itself is bad
    } catch {
      lastStatus = 0;
      await sleep(1000 * 2 ** attempt);
    }
  }
  return { ok: false, status: lastStatus || 'network' };
}

const failed = []; // { idx, reason }
let pushed = 0, consecutiveFail = 0, fatal = null;
const minGap = 1000 / rate;
for (let idx = 0; idx < payloads.length; idx++) {
  if (fatal) { failed.push({ idx, reason: 'not_sent_after_stop' }); continue; }
  const body = JSON.stringify(payloads[idx]);
  if (Buffer.byteLength(body) > MAX_PAYLOAD_BYTES) { failed.push({ idx, reason: 'payload_over_100kb' }); continue; }
  const t0 = Date.now();
  const r = await postRow(body);
  if (r.ok) { pushed++; consecutiveFail = 0; }
  else {
    failed.push({ idx, reason: `http_${r.status}` });
    consecutiveFail++;
    if (r.fatal) fatal = 'the webhook returned 403 (lifetime row cap reached, or the plan does not allow webhooks)';
    else if (consecutiveFail >= 10) fatal = '10 rows in a row failed (check webhook_url and the auth settings)';
  }
  const gap = minGap - (Date.now() - t0);
  if (gap > 0) await sleep(gap);
  if ((idx + 1) % 250 === 0) console.log(`  ${idx + 1}/${payloads.length} sent, ${pushed} accepted`);
}

let failedCsv = null;
if (failed.length) {
  fs.mkdirSync(logDir, { recursive: true });
  const name = `failed-${table}${campaign ? '-' + campaign : ''}-${stage}-${pushId}.csv`;
  failedCsv = path.join(logDir, name);
  const out = [header.map(esc).join(',')];
  for (const f of failed) out.push(dataRows[f.idx].map(esc).join(','));
  fs.writeFileSync(failedCsv, out.join('\n') + '\n');
}

fs.mkdirSync(logDir, { recursive: true });
fs.appendFileSync(logPath, JSON.stringify({
  ts: pushedAt, push_id: pushId, table, campaign: campaign || null, stage,
  csv: path.relative(OUTBOUND, csvPath).split(path.sep).join('/'), csv_sha256: csvSha,
  rows: payloads.length, attempted: payloads.length - failed.filter(f => f.reason === 'not_sent_after_stop' || f.reason === 'payload_over_100kb').length,
  pushed, failed: failed.length, webhook_fp: webhookFp, webhook_host: webhookHost,
  failed_csv: failedCsv ? path.relative(OUTBOUND, failedCsv).split(path.sep).join('/') : null,
}) + '\n');

const reasons = failed.reduce((m, f) => (m[f.reason] = (m[f.reason] || 0) + 1, m), {});
console.log(`pushed ${pushed}/${payloads.length} rows to ${label} (list_stage=${stage}).`);
if (failed.length) {
  console.log(`SHORTFALL: ${failed.length} rows not accepted (${Object.entries(reasons).map(([k, v]) => `${k}: ${v}`).join(', ')}).`);
  if (fatal) console.log(`Stopped early: ${fatal}.`);
  console.log(`Failed rows: ${path.relative(process.cwd(), failedCsv)}. Retry pushes only these: --csv <that file>.`);
}
console.log(JSON.stringify({ table: label, stage, rows: payloads.length, pushed, failed: failed.length, failed_csv: failedCsv, push_id: pushId }));
process.exit(fatal && fatal.includes('403') ? 6 : failed.length ? 5 : 0);
