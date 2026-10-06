#!/usr/bin/env node
/**
 * getleads_email_batch.mjs: the GetLeads rung of the email waterfall. Reads list_waterfall.py's
 * queue-email-getleads.csv and looks people up by LinkedIn URL through GetLeads' own MCP server over HTTP
 * (tool getleads_get_emails_from_linkedin_batch, POST /api/v1/enrich/from-linkedin behind it: one plan credit per row
 * where success is true; on the Unlimited plan it counts against fair use). Same tool, same account as the MCP
 * connector: this is its script route, not a substitute tool.
 *
 * Writes the results shape `list_waterfall.py record --layer email --provider getleads` reads (person_id, status
 * found|not_found|error, email, provider_email_status, cost_usd, detail) plus GetLeads' view of the person's CURRENT
 * company (detail.current_org_domain, detail.moved=true when it is not the queued company), so people who left are
 * caught before any paid rung. Never verifies: MillionVerifier judges every email afterwards.
 *
 * KEY. GETLEADS_MCP_TOKEN (env or outbound/scripts/.env) or, failing that, the Authorization header of the
 * `getleads` server in ~/.claude.json (the connector's own credential). Never printed; every error is scrubbed.
 *
 * Usage: node getleads_email_batch.mjs --queue <queue-email-getleads.csv> --out <results.csv> [--batch 25] [--limit n]
 * Serial (one batch in flight), resumable (rows already in --out are skipped). Exit 3 = balance, fair-use or outage
 * stop (never substitute another tool).
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const URL_MCP = 'https://app.getleads.io/api/mcp';
const TOOL = 'getleads_get_emails_from_linkedin_batch';

function loadEnv(p) {
  const out = {};
  if (!fs.existsSync(p)) return out;
  for (const raw of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = raw.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return out;
}
function resolveAuth() {
  const env = { ...loadEnv(path.join(__dirname, '.env')), ...process.env };
  if (env.GETLEADS_MCP_TOKEN) return `Bearer ${env.GETLEADS_MCP_TOKEN.trim()}`;
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.claude.json'), 'utf8'));
    const h = cfg?.mcpServers?.getleads?.headers?.Authorization;
    if (h) return h;
  } catch { /* fall through */ }
  return '';
}
const AUTH = resolveAuth();
const TOKEN = AUTH.replace(/^Bearer\s+/i, '');
const scrub = (t) => (TOKEN ? String(t).split(TOKEN).join('***') : String(t));
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

const slug = (u) => { const m = String(u || '').toLowerCase().match(/linkedin\.com\/in\/([^/?#]+)/); return m ? decodeURIComponent(m[1]).replace(/\/+$/, '') : ''; };
const normDom = (d) => String(d || '').toLowerCase().replace(/^https?:\/\//, '').split('/')[0].replace(/^www\./, '');
const sameOrg = (a, b) => a && b && (a === b || a.endsWith('.' + b) || b.endsWith('.' + a));

// ---- MCP over streamable HTTP ----
let sessionId = '';
let rpcId = 0;
async function rpc(method, params, isNotification = false) {
  const body = isNotification ? { jsonrpc: '2.0', method, params } : { jsonrpc: '2.0', id: ++rpcId, method, params };
  let backoff = 2000;
  for (let attempt = 0; ; attempt++) {
    let res;
    try {
      res = await fetch(URL_MCP, {
        method: 'POST', redirect: 'manual',
        headers: { Authorization: AUTH, 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream',
          ...(sessionId ? { 'Mcp-Session-Id': sessionId } : {}) },
        body: JSON.stringify(body),
      });
    } catch (err) {
      if (attempt >= 3) throw new StopError(scrub(`network error: ${err?.message}`));
      await sleep(backoff); backoff *= 2; continue;
    }
    const sid = res.headers.get('mcp-session-id'); if (sid) sessionId = sid;
    if (res.status === 429 || res.status >= 500) {
      if (attempt >= 3) throw new StopError(`persistent outage or rate limit (HTTP ${res.status})`);
      await sleep(backoff); backoff *= 2; continue;
    }
    if (res.status === 401 || res.status === 403) throw new StopError(`GetLeads rejected the credential (HTTP ${res.status})`);
    const text = await res.text();
    if (isNotification) return null;
    if (res.status < 200 || res.status >= 300) throw new Error(scrub(`HTTP ${res.status}: ${text.slice(0, 300)}`));
    // JSON or SSE ("data: {...}" lines)
    let msg = null;
    try { msg = JSON.parse(text); } catch {
      for (const line of text.split(/\r?\n/)) {
        if (line.startsWith('data:')) { try { const m = JSON.parse(line.slice(5).trim()); if (m.id === body.id) msg = m; } catch { /* skip */ } }
      }
    }
    if (!msg) throw new Error(scrub(`unreadable MCP reply: ${text.slice(0, 300)}`));
    if (msg.error) throw new Error(scrub(`MCP error: ${JSON.stringify(msg.error).slice(0, 300)}`));
    return msg.result;
  }
}
async function connect() {
  await rpc('initialize', { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'fnnl-getleads-email-batch', version: '1.0' } });
  await rpc('notifications/initialized', {}, true);
}
async function lookup(urls) {
  const result = await rpc('tools/call', { name: TOOL, arguments: { items: urls.map((u) => ({ linkedin_url: u })) } });
  const txt = (result?.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('');
  let data;
  try { data = JSON.parse(txt); } catch { throw new Error(scrub(`tool reply not JSON: ${txt.slice(0, 300)}`)); }
  if (result?.isError || data.ok === false) {
    const m = JSON.stringify(data).slice(0, 300);
    if (/fair.?use|insufficient|credit|quota|limit/i.test(m)) throw new StopError(scrub(`GetLeads balance/fair-use stop: ${m}`));
    throw new Error(scrub(`tool error: ${m}`));
  }
  return data.results || [];
}

async function main() {
  const queue = flag('--queue'), out = flag('--out');
  const batch = Number(flag('--batch') || 25), limit = flag('--limit') ? Number(flag('--limit')) : Infinity;
  if (!queue || !out) { console.error('usage: --queue <csv> --out <csv> [--batch 25] [--limit n]'); process.exit(2); }
  if (!AUTH) { console.error('no GetLeads credential (GETLEADS_MCP_TOKEN or the getleads MCP server in ~/.claude.json)'); process.exit(2); }
  const rows = parseCsv(fs.readFileSync(queue, 'utf8'));
  const done = new Set(fs.existsSync(out) ? parseCsv(fs.readFileSync(out, 'utf8')).map((r) => r.person_id) : []);
  if (!fs.existsSync(out)) fs.writeFileSync(out, COLS.join(',') + '\n');
  const todo = rows.filter((r) => !done.has(r.person_id)).slice(0, limit);
  await connect();
  const tally = { processed: 0, found: 0, not_found: 0, moved: 0, error: 0 };
  let stop = '';
  for (let i = 0; i < todo.length; i += batch) {
    const chunk = todo.slice(i, i + batch).filter((r) => slug(r.linkedin_url));
    const noUrl = todo.slice(i, i + batch).filter((r) => !slug(r.linkedin_url));
    const lines = noUrl.map((r) => [r.person_id, 'not_found', '', '', '', JSON.stringify({ reason: 'no linkedin_url' })]);
    let results = [];
    try { if (chunk.length) results = await lookup(chunk.map((r) => r.linkedin_url)); }
    catch (err) {
      if (err instanceof StopError) { console.error(`STOP (tool-balance): ${err.message}`); process.exitCode = 3; stop = err.message; break; }
      for (const r of chunk) lines.push([r.person_id, 'error', '', '', '', JSON.stringify({ error: scrub(err.message).slice(0, 200) })]);
      results = null;
    }
    if (results) {
      const bySlug = new Map();
      for (const x of results) { const s = slug(x.linkedinUrl || x.data?.linkedin_url && `linkedin.com/in/${x.data.linkedin_slug}`); if (s) bySlug.set(s, x); }
      for (const r of chunk) {
        const x = bySlug.get(slug(r.linkedin_url));
        const qdom = normDom(r.company_domain);
        if (!x) { lines.push([r.person_id, 'error', '', '', '', JSON.stringify({ error: 'no result row for this linkedin_url' })]); continue; }
        const d = x.data || {};
        const cur = normDom(d.org_domain || d.current_company_website);
        const moved = !!(cur && qdom && !sameOrg(cur, qdom));
        const detail = { success: x.success === true, current_org_domain: cur || null, current_title: d.current_title || null };
        if (moved) detail.moved = true;
        const email = String(x.email || d.work_email || '').trim().toLowerCase();
        if (x.success === true) detail.billed = true;
        if (email) lines.push([r.person_id, 'found', email, d.email_status || '', '', JSON.stringify(detail)]);
        else lines.push([r.person_id, 'not_found', '', '', '', JSON.stringify(detail)]);
      }
    }
    for (const l of lines) {
      fs.appendFileSync(out, l.map(esc).join(',') + '\n');
      tally.processed++; tally[l[1]] = (tally[l[1]] || 0) + 1;
      if (l[5].includes('"moved":true')) tally.moved++;
    }
    await sleep(300);
  }
  console.log(JSON.stringify({ ...tally, stopped: stop || 'queue done' }));
}
main().catch((err) => { console.error(scrub(err?.stack || err)); process.exit(1); });
