#!/usr/bin/env node
/**
 * getsales.mjs — minimal, DEPENDENCY-FREE REST client for GetSales.io
 * (LinkedIn + email multichannel outreach / sequencing).
 *
 * Basic v0.1 (operator directive 2026-06-24: build basic, optimize when a client actually uses it).
 *
 * Verified API facts (primary sources, 2026-06-24):
 *   base   https://amazing.getsales.io   <-- IMPORTANT: the API host is amazing.getsales.io.
 *          api.getsales.io is the DOCS host only and will 404 API calls.
 *   auth   header  Authorization: Bearer <GETSALES_API_KEY>   (key is a JWT, ~3y expiry;
 *          generate in Workspace Settings -> API Keys)
 *   limit  300 requests / minute / key
 *   pages  list endpoints take limit (default 20, max 100), offset, order_field, order_type
 *   errors {error:{reason,message}} with 400/401/402/403/422
 *   docs   https://api.getsales.io/bundled.md  (full reference, machine-readable)
 *
 * Core endpoints used here (178 exist; use `call` for the rest):
 *   GET  /id/api/users/current                       who am I (auth/connectivity check)
 *   GET  /flows/api/flows                             list flows (campaigns/sequences)
 *   GET  /flows/api/sender-profiles                   list senders
 *   POST /leads/api/leads/search                      search leads
 *   POST /leads/api/leads/upsert                      create/import a contact
 *   POST /flows/api/flows/{flowUuid}/add-new-lead     add a lead to a flow
 *
 * NOTE: live-untested (the upstream workspace has no GetSales account yet). Structure follows the verified spec.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = path.dirname(fileURLToPath(import.meta.url));
// minimal non-overriding .env loader (scripts/.env), same convention as ai_router.mjs
try {
  for (const line of readFileSync(path.join(__dir, '.env'), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch { /* no .env is fine */ }

const BASE = (process.env.GETSALES_BASE_URL || 'https://amazing.getsales.io').replace(/\/$/, '');
const KEY = process.env.GETSALES_API_KEY || '';

const args = process.argv.slice(2);
const cmd = args[0];
const opt = (f, d) => { const i = args.indexOf(f); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : d; };
const jsonArg = () => { const j = opt('--json', null); return j ? JSON.parse(j) : {}; };

async function req(method, p, body) {
  if (!KEY) throw new Error('GETSALES_API_KEY missing (set it in scripts/.env). Generate it in GetSales Workspace Settings -> API Keys.');
  const res = await fetch(BASE + p, {
    method,
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) { const e = new Error(`HTTP ${res.status}: ${typeof data === 'string' ? data : JSON.stringify(data)}`); e.status = res.status; throw e; }
  return data;
}
export { req as gsReq };

const HELP = `getsales.mjs — minimal GetSales.io REST client (base ${BASE})
Commands:
  me | --selftest                              GET /id/api/users/current (auth + connectivity)
  flows [--limit N] [--offset N]               GET /flows/api/flows
  senders                                      GET /flows/api/sender-profiles
  lead-search --json '{...}'                   POST /leads/api/leads/search
  lead-upsert --json '{...}'                   POST /leads/api/leads/upsert
  flow-add-lead --flow <uuid> --json '{...}'   POST /flows/api/flows/{uuid}/add-new-lead
  call --method GET --path /x/api/y [--json '{...}']   generic escape hatch (178-endpoint surface)
Auth: Authorization: Bearer $GETSALES_API_KEY (JWT from Workspace Settings -> API Keys).
Rate limit: 300 req/min/key. API host = amazing.getsales.io (api.getsales.io is docs-only).`;

async function main() {
  switch (cmd) {
    case 'me':
    case '--selftest': {
      const me = await req('GET', '/id/api/users/current');
      console.log(JSON.stringify(me, null, 2));
      console.error('[getsales] OK — auth + connectivity verified.');
      break;
    }
    case 'flows':
      console.log(JSON.stringify(await req('GET', `/flows/api/flows?limit=${opt('--limit', '20')}&offset=${opt('--offset', '0')}`), null, 2));
      break;
    case 'senders':
      console.log(JSON.stringify(await req('GET', '/flows/api/sender-profiles'), null, 2));
      break;
    case 'lead-search':
      console.log(JSON.stringify(await req('POST', '/leads/api/leads/search', jsonArg()), null, 2));
      break;
    case 'lead-upsert':
      console.log(JSON.stringify(await req('POST', '/leads/api/leads/upsert', jsonArg()), null, 2));
      break;
    case 'flow-add-lead': {
      const flow = opt('--flow', null);
      if (!flow) throw new Error('--flow <flowUuid> required');
      console.log(JSON.stringify(await req('POST', `/flows/api/flows/${flow}/add-new-lead`, jsonArg()), null, 2));
      break;
    }
    case 'call': {
      const method = (opt('--method', 'GET')).toUpperCase();
      const p = opt('--path', null);
      if (!p) throw new Error('--path </...> required');
      console.log(JSON.stringify(await req(method, p, ['POST', 'PUT', 'PATCH'].includes(method) ? jsonArg() : undefined), null, 2));
      break;
    }
    default:
      console.log(HELP);
  }
}
if (process.argv[1] && process.argv[1].endsWith('getsales.mjs')) {
  main().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
}
