/*
 * millionverifier_mcp.mjs — dependency-free MCP server (stdio) for the MillionVerifier email verification API.
 *
 * MillionVerifier publishes no MCP server of its own, so this wraps its REST API using the repo's
 * hand-rolled stdio lib (_mcp_stdio_lib.mjs). Node built-ins only.
 *
 * STACK STATUS: MillionVerifier IS FNNL's email verifier of record (operator directive 2026-09-22,
 * replacing LeadMagic). It fills lead_data.email_verification in stack-contract.yaml and is one of the
 * approved six tools there. Routing lives in the contract, not here; this server only makes the tool
 * reachable. Its catch_all result (resultcode 2) is the discriminator /email-waterfall's Catch-All Timing
 * gate needs, so it must reach the caller untouched.
 *
 * KEY: read from outbound/scripts/.env (MILLIONVERIFIER_API_KEY), process.env overriding the file, the same
 * pattern as preflight-credentials.mjs. Never put the key in .mcp.json (tracked file). The key is never
 * returned to the model and is scrubbed from any error text. MillionVerifier's API takes the key as a URL
 * query parameter, so it can appear in the vendor's own request logs; that is their design, not ours.
 *
 * SPEND: credits. Real-time deducts per call (vendor help page). The bulk per-email rate was not confirmed. /api-cost-governance
 * runs first; paid calls auto-approve only inside the standing $100 client budget (run_state.spend_ceiling_usd), and anything
 * over it needs operator confirmation.
 *
 * ENDPOINTS: real-time verify, credits, and the bulk trio (upload, fileinfo, download) are documented by
 * MillionVerifier. stop is taken from the vendor's sample-code repo, not the live docs, and is marked as such
 * below. Deliberately NOT exposed: delete (destructive, path not confirmable) and filelist (it answered
 * `empty_api_key` under every key parameter name tried with the test key, so how it reads the key is unknown
 * until a real key is available to test).
 *
 * WHAT IS PROVEN (2026-09-22, vendor test key, zero spend): the JSON-RPC plumbing, the live real-time verify
 * round trip, and every input guard. The test key is honored ONLY by the real-time endpoint. credits, upload,
 * fileinfo, download and stop have NOT yet returned a success from a real account.
 *
 * Smoke test (no spend, vendor's documented test key returns a random response):
 *   MILLIONVERIFIER_API_KEY=API_KEY_FOR_TEST node millionverifier_mcp.mjs   # then speak JSON-RPC on stdin
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runStdioServer } from './_mcp_stdio_lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPTS_DIR = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(SCRIPTS_DIR, '..', '..');

const SINGLE_BASE = 'https://api.millionverifier.com';
const BULK_BASE = 'https://bulkapi.millionverifier.com';

// ── .env loader (same pattern as preflight-credentials.mjs) ─────────────────
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
  const key = (env.MILLIONVERIFIER_API_KEY || '').trim();
  if (!key) {
    throw new Error('MILLIONVERIFIER_API_KEY is not set. Put it in outbound/scripts/.env (see .env.example). Nothing was sent to MillionVerifier.');
  }
  return key;
}

// ── HTTP helpers ─────────────────────────────────────────────────────────────
function scrub(text, key) {
  return key ? String(text).split(key).join('***') : String(text);
}

async function mvFetch(url, { key, method = 'GET', body, timeoutMs = 70000 } = {}) {
  let res;
  try {
    res = await fetch(url, { method, body, signal: AbortSignal.timeout(timeoutMs) });
  } catch (e) {
    throw new Error(scrub(`Request to MillionVerifier failed: ${e?.cause?.code || e?.name || ''} ${e?.message || e}`.trim(), key));
  }
  const raw = await res.text();
  return { status: res.status, ok: res.ok, contentType: res.headers.get('content-type') || '', raw };
}

function asJson(r, key) {
  let data;
  try { data = JSON.parse(r.raw); } catch { data = null; }
  if (data === null) {
    return { text: scrub(`HTTP ${r.status}, non-JSON response: ${r.raw.slice(0, 500)}`, key), isError: true };
  }
  const apiError = typeof data.error === 'string' && data.error.trim() !== '';
  return { text: scrub(JSON.stringify(data, null, 2), key), isError: !r.ok || apiError };
}

// Local files this server may read or write must sit inside the repo, so a bad prompt cannot make it
// upload or overwrite an arbitrary file on the machine.
function repoPath(p) {
  if (typeof p !== 'string' || !p.trim()) throw new Error('A file path is required.');
  const abs = path.resolve(REPO_ROOT, p);
  const rel = path.relative(REPO_ROOT, abs);
  if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error(`Path must be inside the repo (${REPO_ROOT}).`);
  return abs;
}

function requireFileId(v) {
  const id = String(v ?? '').trim();
  if (!/^[A-Za-z0-9_-]+$/.test(id)) throw new Error('file_id must be the id returned by millionverifier_bulk_upload (letters, digits, - or _).');
  return id;
}

// ── tools ────────────────────────────────────────────────────────────────────
const RESULT_LEGEND =
  'resultcode: 1=ok, 2=catch_all, 3=unknown, 4=error, 5=disposable, 6=invalid. ' +
  'The full response is returned untouched (result, resultcode, subresult, quality, free, role, didyoumean, credits, ...). ' +
  'Do not collapse catch_all into ok or unknown: /email-waterfall\'s Catch-All Timing gate needs that distinction.';

const tools = [
  {
    name: 'millionverifier_verify_email',
    description:
      'Verify ONE email address in real time. CONSUMES 1 credit per call. ' + RESULT_LEGEND,
    inputSchema: {
      type: 'object',
      properties: {
        email: { type: 'string', description: 'The address to verify.' },
        timeout: { type: 'integer', minimum: 2, maximum: 60, description: 'Seconds MillionVerifier may spend on the SMTP check (2-60, default 20).' },
      },
      required: ['email'],
    },
    handler: async ({ email, timeout }) => {
      const addr = String(email ?? '').trim();
      if (!addr || addr.length > 320 || /\s/.test(addr) || !/^[^@]+@[^@]+$/.test(addr)) {
        throw new Error('That is not a plausible email address. Nothing was sent, no credit used.');
      }
      const key = apiKey();
      const q = new URLSearchParams({ api: key, email: addr });
      if (timeout !== undefined) {
        const t = Number(timeout);
        if (!Number.isInteger(t) || t < 2 || t > 60) throw new Error('timeout must be an integer from 2 to 60.');
        q.set('timeout', String(t));
      }
      return asJson(await mvFetch(`${SINGLE_BASE}/api/v3/?${q}`, { key }), key);
    },
  },
  {
    name: 'millionverifier_get_credits',
    description: 'Return the remaining MillionVerifier credit balance. Free. Use it before any bulk upload.',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      const key = apiKey();
      return asJson(await mvFetch(`${SINGLE_BASE}/api/v3/credits?${new URLSearchParams({ api: key })}`, { key }), key);
    },
  },
  {
    name: 'millionverifier_bulk_upload',
    description:
      'Upload a local CSV (must be inside this repo) to MillionVerifier for bulk verification. CONSUMES credits per email ' +
      '(the exact bulk rate is not documented in what was checked: confirm it on the account before approving). The file leaves this machine and goes to a third party, so only upload lists the operator has cleared. ' +
      'Requires confirm_spend=true, which the caller may set only after the operator has approved the row count and cost. ' +
      'Returns a file_id: poll millionverifier_bulk_status, then fetch results with millionverifier_bulk_download.',
    inputSchema: {
      type: 'object',
      properties: {
        file_path: { type: 'string', description: 'Path to a .csv or .txt of emails, relative to the repo root or absolute inside it.' },
        remove_duplicates: { type: 'integer', enum: [0, 1], description: '1 (default) drops duplicate emails before billing.' },
        confirm_spend: { type: 'boolean', description: 'Must be true. Set only after the operator approved this spend.' },
      },
      required: ['file_path', 'confirm_spend'],
    },
    handler: async ({ file_path, remove_duplicates, confirm_spend }) => {
      if (confirm_spend !== true) {
        throw new Error('confirm_spend must be true. Bulk upload spends credits; get the operator\'s approval of the row count and cost first. Nothing was uploaded.');
      }
      const abs = repoPath(file_path);
      if (!/\.(csv|txt)$/i.test(abs)) throw new Error('Only .csv or .txt files can be uploaded.');
      if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) throw new Error(`No such file: ${file_path}`);
      const buf = fs.readFileSync(abs);
      const lines = buf.toString('utf8').split(/\r?\n/).filter((l) => l.trim()).length;
      const key = apiKey();
      const form = new FormData();
      form.append('file_contents', new Blob([buf], { type: 'text/csv' }), path.basename(abs));
      const q = new URLSearchParams({ key, remove_duplicates: String(remove_duplicates === 0 ? 0 : 1) });
      const out = asJson(await mvFetch(`${BULK_BASE}/bulkapi/v2/upload?${q}`, { key, method: 'POST', body: form, timeoutMs: 180000 }), key);
      return { ...out, text: `${out.text}\n\n(local non-empty lines in the file, header included: ${lines})` };
    },
  },
  {
    name: 'millionverifier_bulk_status',
    description: 'Check progress of one bulk file. Free. status is in_progress, finished, or canceled.',
    inputSchema: { type: 'object', properties: { file_id: { type: 'string' } }, required: ['file_id'] },
    handler: async ({ file_id }) => {
      const id = requireFileId(file_id);
      const key = apiKey();
      return asJson(await mvFetch(`${BULK_BASE}/bulkapi/v2/fileinfo?${new URLSearchParams({ key, file_id: id })}`, { key }), key);
    },
  },
  {
    name: 'millionverifier_bulk_download',
    description:
      'Download the verified results of a FINISHED bulk file to a local CSV inside this repo. Free (already paid at upload). ' +
      'Results go to disk, not into chat, and an existing file is never overwritten. ' +
      'filter: all | ok | ok_and_catch_all | unknown | invalid. Download "all" once and keep it, so catch-all rows stay labelled ' +
      'instead of being dropped by a narrower filter.',
    inputSchema: {
      type: 'object',
      properties: {
        file_id: { type: 'string' },
        output_path: { type: 'string', description: 'Where to write the CSV, inside the repo. Must not already exist.' },
        filter: { type: 'string', enum: ['all', 'ok', 'ok_and_catch_all', 'unknown', 'invalid'], description: 'Default all.' },
      },
      required: ['file_id', 'output_path'],
    },
    handler: async ({ file_id, output_path, filter }) => {
      const id = requireFileId(file_id);
      const f = filter ?? 'all';
      if (!['all', 'ok', 'ok_and_catch_all', 'unknown', 'invalid'].includes(f)) throw new Error(`Unknown filter: ${f}`);
      const abs = repoPath(output_path);
      if (!/\.csv$/i.test(abs)) throw new Error('output_path must end in .csv');
      if (fs.existsSync(abs)) throw new Error(`Refusing to overwrite existing file: ${output_path}`);
      const key = apiKey();
      const r = await mvFetch(`${BULK_BASE}/bulkapi/v2/download?${new URLSearchParams({ key, file_id: id, filter: f })}`, { key, timeoutMs: 180000 });
      // An error comes back as JSON; a real report is CSV text.
      if (!r.ok || /json/i.test(r.contentType) || r.raw.trimStart().startsWith('{')) return asJson(r, key);
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, r.raw, { flag: 'wx' });
      const rows = r.raw.split(/\r?\n/).filter((l) => l.trim()).length;
      return { text: JSON.stringify({ written_to: path.relative(REPO_ROOT, abs), filter: f, bytes: Buffer.byteLength(r.raw), non_empty_lines_including_header: rows }, null, 2) };
    },
  },
  {
    name: 'millionverifier_bulk_stop',
    description:
      'Stop a bulk file that is still in progress. Free. NOTE: the path comes from MillionVerifier\'s sample-code repo, not the live docs. ' +
      'The route exists (it answers with key errors) but no successful stop has been observed, so treat an error here as "unconfirmed", ' +
      'not as proof the file kept running. Check millionverifier_bulk_status afterwards.',
    inputSchema: { type: 'object', properties: { file_id: { type: 'string' } }, required: ['file_id'] },
    handler: async ({ file_id }) => {
      const id = requireFileId(file_id);
      const key = apiKey();
      return asJson(await mvFetch(`${BULK_BASE}/bulkapi/stop/?${new URLSearchParams({ key, file_id: id })}`, { key }), key);
    },
  },
];

runStdioServer({ name: 'millionverifier', version: '0.1.0', tools });
