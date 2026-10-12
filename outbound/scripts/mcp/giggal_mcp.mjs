/*
 * giggal_mcp.mjs: dependency-free MCP server (stdio) for the Giggal email verification REST API.
 *
 * Giggal also publishes a hosted MCP (https://mcp.giggal.ai/mcp), but it has no credits-by-REST call and no job or
 * catch-all task tools, so this local wrapper covers the full developer API using the repo's hand-rolled stdio lib
 * (_mcp_stdio_lib.mjs). Node built-ins only.
 *
 * STACK STATUS: Giggal is FNNL's email verifier of record (operator directive 2026-10-12, replacing MillionVerifier).
 * It fills lead_data.email_verification in stack-contract.yaml. Routing lives in the contract, not here; this server
 * only makes the tool reachable. For a whole CSV use giggal_verify.mjs (batching, cache, gate mapping), not this server.
 *
 * KEY: GIGGAL_API_KEY from outbound/scripts/.env, process.env overriding the file. Sent only in the Authorization
 * header, never returned to the model, and scrubbed from any error text. Never put it in .mcp.json (tracked file).
 *
 * API: https://api.giggal.ai/v1, replies {success, data, meta}. 300 requests / 15 min, 30 batch creations / 15 min,
 * 50,000 emails per batch, results kept 48 hours (HTTP 410 after), HTTP 402 = out of credits, `unknown` is refunded.
 * SPEND: 1 credit per address verified; POST /catchall costs 1 credit per catch-all address in the source job.
 * /api-cost-governance runs first; spending tools need confirm_spend=true, set only after the operator approved it.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { runStdioServer } from './_mcp_stdio_lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPTS_DIR = path.resolve(__dirname, '..');
const BASE = 'https://api.giggal.ai/v1';
const MAX_EMAILS_PER_CALL = 1000;

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

// Read per call so a key added to .env after the server starts is picked up without a restart.
function apiKey() {
  const env = { ...loadEnvFile(path.join(SCRIPTS_DIR, '.env')), ...process.env };
  const key = (env.GIGGAL_API_KEY || '').trim();
  if (!key) throw new Error('GIGGAL_API_KEY is not set. Put it in outbound/scripts/.env (see .env.example). Nothing was sent to Giggal.');
  return key;
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

async function call(method, pathname, { body, idem, timeoutMs = 60000 } = {}) {
  const key = apiKey();
  const headers = { Authorization: `Bearer ${key}`, Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (idem) headers['Idempotency-Key'] = idem;
  let res, raw;
  try {
    res = await fetch(`${BASE}${pathname}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(timeoutMs) });
    raw = await res.text();
  } catch (e) {
    throw new Error(scrub(`Request to Giggal failed: ${e?.cause?.code || e?.name || ''} ${e?.message || e}`.trim(), key));
  }
  let data;
  try { data = JSON.parse(raw); } catch { data = null; }
  if (data === null) return { text: scrub(`HTTP ${res.status}, non-JSON response: ${raw.slice(0, 500)}`, key), isError: true };
  const note = res.status === 402 ? 'HTTP 402: insufficient credits.\n' : res.status === 410 ? 'HTTP 410: results expired (kept 48 hours).\n' : res.status === 429 ? 'HTTP 429: rate limited, wait and retry.\n' : '';
  return { text: scrub(note + JSON.stringify(data, null, 2), key), isError: !res.ok || data.success === false };
}

function requireId(v, what) {
  const id = String(v ?? '').trim();
  if (!/^[A-Za-z0-9_-]+$/.test(id)) throw new Error(`${what} must be the id Giggal returned (letters, digits, - or _).`);
  return id;
}

function cleanEmails(list) {
  if (!Array.isArray(list) || !list.length) throw new Error('emails must be a non-empty array of addresses.');
  if (list.length > MAX_EMAILS_PER_CALL) throw new Error(`At most ${MAX_EMAILS_PER_CALL} addresses per call here. For a whole CSV use giggal_verify.mjs. Nothing was sent.`);
  const seen = new Set();
  for (const e of list) {
    const a = String(e ?? '').trim().toLowerCase();
    if (!a || a.length > 320 || /\s/.test(a) || !/^[^@]+@[^@]+\.[^@]+$/.test(a)) throw new Error(`Not a plausible email address: ${String(e).slice(0, 80)}. Nothing was sent, no credit used.`);
    seen.add(a);
  }
  return [...seen];
}

const STATUS_LEGEND =
  'status: deliverable | undeliverable | unknown | accept_all (risky). On catch-all domains Giggal scores the mailbox itself ' +
  '(deliverability_score 0-100, details.attributes.catch_all=true); do not treat catch_all=true as a verdict on its own. ' +
  'An unknown result is refunded.';

const tools = [
  {
    name: 'giggal_verify_email',
    description: 'Verify ONE email address in real time. CONSUMES 1 credit per call (unknown is refunded). ' + STATUS_LEGEND,
    inputSchema: { type: 'object', properties: { email: { type: 'string', description: 'The address to verify.' } }, required: ['email'] },
    handler: async ({ email }) => {
      const [addr] = cleanEmails([email]);
      return call('POST', '/verify', { body: { email: addr } });
    },
  },
  {
    name: 'giggal_get_credits',
    description: 'Return the remaining Giggal credit balance (data.balance). Free. Use it before any batch.',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => call('GET', '/credits'),
  },
  {
    name: 'giggal_verify_batch',
    description:
      'Submit a batch of addresses (up to 1000 here) as an asynchronous job. CONSUMES 1 credit per address. Returns a jobId: poll giggal_job_status, ' +
      'then read giggal_job_results. The batch is idempotent for the same list on the same UTC day (a repeat call replays the job, no second charge). ' +
      'Requires confirm_spend=true, which the caller may set only after the operator approved the count and cost. The addresses leave this machine ' +
      'and go to a third party, so only send lists the operator has cleared.',
    inputSchema: {
      type: 'object',
      properties: {
        emails: { type: 'array', items: { type: 'string' }, description: 'Addresses to verify.' },
        confirm_spend: { type: 'boolean', description: 'Must be true. Set only after the operator approved this spend.' },
      },
      required: ['emails', 'confirm_spend'],
    },
    handler: async ({ emails, confirm_spend }) => {
      if (confirm_spend !== true) throw new Error('confirm_spend must be true. A batch spends credits; get the operator\'s approval of the count and cost first. Nothing was sent.');
      const list = cleanEmails(emails);
      const idem = `fnnl-mcp-verify-${new Date().toISOString().slice(0, 10)}-` + crypto.createHash('sha256').update(list.join('\n')).digest('hex').slice(0, 40);
      return call('POST', '/verify-batch', { body: { emails: list }, idem });
    },
  },
  {
    name: 'giggal_job_status',
    description: 'Progress of one batch job (status processing | completed | failed, processed vs total, resultsExpiresAt). Free.',
    inputSchema: { type: 'object', properties: { job_id: { type: 'string' } }, required: ['job_id'] },
    handler: async ({ job_id }) => call('GET', `/jobs/${requireId(job_id, 'job_id')}`),
  },
  {
    name: 'giggal_job_results',
    description: 'One page of the results of a COMPLETED batch job. Free (already paid at submit). Results are kept 48 hours. ' + STATUS_LEGEND,
    inputSchema: {
      type: 'object',
      properties: {
        job_id: { type: 'string' },
        page: { type: 'integer', minimum: 1, description: 'Default 1.' },
        limit: { type: 'integer', minimum: 1, maximum: 500, description: 'Default 100, at most 500.' },
      },
      required: ['job_id'],
    },
    handler: async ({ job_id, page, limit }) => {
      const p = page === undefined ? 1 : Number(page);
      const l = limit === undefined ? 100 : Number(limit);
      if (!Number.isInteger(p) || p < 1 || !Number.isInteger(l) || l < 1 || l > 500) throw new Error('page must be an integer of at least 1 and limit an integer from 1 to 500.');
      return call('GET', `/jobs/${requireId(job_id, 'job_id')}/results?page=${p}&limit=${l}`);
    },
  },
  {
    name: 'giggal_catchall_start',
    description:
      'Run the catch-all check on a COMPLETED batch job. CONSUMES 1 credit per catch-all address in that job (the whole job, not a subset). ' +
      'Returns a taskId: poll giggal_catchall_status, then read giggal_catchall_results (verdict valid | invalid, score 0-100). ' +
      'Requires confirm_spend=true. Idempotent per job id.',
    inputSchema: {
      type: 'object',
      properties: { job_id: { type: 'string' }, confirm_spend: { type: 'boolean', description: 'Must be true. Set only after the operator approved this spend.' } },
      required: ['job_id', 'confirm_spend'],
    },
    handler: async ({ job_id, confirm_spend }) => {
      if (confirm_spend !== true) throw new Error('confirm_spend must be true. The catch-all check spends credits; get the operator\'s approval first. Nothing was sent.');
      const id = requireId(job_id, 'job_id');
      return call('POST', '/catchall', { body: { jobId: id }, idem: `fnnl-mcp-catchall-${new Date().toISOString().slice(0, 10)}-${id}` });
    },
  },
  {
    name: 'giggal_catchall_status',
    description: 'Progress of one catch-all task (status, processed vs total, creditsUsed, verdictCounts). Free.',
    inputSchema: { type: 'object', properties: { task_id: { type: 'string' } }, required: ['task_id'] },
    handler: async ({ task_id }) => call('GET', `/catchall/${requireId(task_id, 'task_id')}`),
  },
  {
    name: 'giggal_catchall_results',
    description: 'One page of a COMPLETED catch-all task: email, score 0-100, verdict valid | invalid, is_actually_catchall. Free.',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: { type: 'string' },
        page: { type: 'integer', minimum: 1, description: 'Default 1.' },
        limit: { type: 'integer', minimum: 1, maximum: 500, description: 'Default 50, at most 500.' },
      },
      required: ['task_id'],
    },
    handler: async ({ task_id, page, limit }) => {
      const p = page === undefined ? 1 : Number(page);
      const l = limit === undefined ? 50 : Number(limit);
      if (!Number.isInteger(p) || p < 1 || !Number.isInteger(l) || l < 1 || l > 500) throw new Error('page must be an integer of at least 1 and limit an integer from 1 to 500.');
      return call('GET', `/catchall/${requireId(task_id, 'task_id')}/results?page=${p}&limit=${l}`);
    },
  },
];

runStdioServer({ name: 'giggal', version: '0.1.0', tools });
