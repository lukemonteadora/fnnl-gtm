#!/usr/bin/env node
/**
 * close.mjs — minimal, DEPENDENCY-FREE REST client for Close.com (Close CRM).
 *
 * Basic v0.1 (operator directive 2026-06-24: build basic, optimize when a client actually uses it).
 *
 * Verified API facts (primary sources, 2026-06-24):
 *   base   https://api.close.com/api/v1
 *   auth   HTTP Basic — API KEY is the USERNAME, password is EMPTY.
 *          Authorization: Basic base64("<CLOSE_API_KEY>:")    (note trailing colon)
 *   key    starts "api_", two dot-separated parts (id.secret). UI: Settings -> Developer -> API Keys.
 *   limits per endpoint-group, per-key AND per-org (org = 3x key). On 429, sleep `rate_reset` seconds.
 *   paths  SINGULAR resource nouns, TRAILING SLASH required (/lead/, /contact/, /opportunity/, /activity/note/)
 *   docs   https://developer.close.com/api/overview
 *
 * Core endpoints:
 *   GET  /me/                       auth/connectivity check
 *   GET  /lead/                     list/search leads (?query=, _limit, _skip)
 *   GET  /lead/{id}/                get a lead
 *   POST /lead/                     create a lead
 *   PUT  /lead/{id}/                update a lead (non-destructive)
 *   POST /contact/                  create a contact
 *   GET  /opportunity/              list opportunities
 *   POST /opportunity/              create an opportunity
 *   POST /activity/note/            log a note
 *   POST /data/search/              advanced search (JSON filter body)
 *
 * NOTE: live-untested (the upstream workspace has no Close account yet). Structure follows the verified spec.
 */

import { readFileSync } from 'node:fs';
import { Buffer } from 'node:buffer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = path.dirname(fileURLToPath(import.meta.url));
try {
  for (const line of readFileSync(path.join(__dir, '.env'), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch { /* no .env is fine */ }

const BASE = (process.env.CLOSE_BASE_URL || 'https://api.close.com/api/v1').replace(/\/$/, '');
const KEY = process.env.CLOSE_API_KEY || '';

const args = process.argv.slice(2);
const cmd = args[0];
const opt = (f, d) => { const i = args.indexOf(f); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : d; };
const jsonArg = () => { const j = opt('--json', null); return j ? JSON.parse(j) : {}; };

export async function closeReq(method, p, body) {
  if (!KEY) throw new Error('CLOSE_API_KEY missing (set it in scripts/.env). Generate it in Close -> Settings -> Developer -> API Keys.');
  const auth = Buffer.from(`${KEY}:`).toString('base64'); // key as username, blank password
  const res = await fetch(BASE + p, {
    method,
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) { const e = new Error(`HTTP ${res.status}: ${typeof data === 'string' ? data : JSON.stringify(data)}`); e.status = res.status; throw e; }
  return data;
}

const HELP = `close.mjs — minimal Close CRM REST client (base ${BASE})
Commands:
  me | --selftest                       GET /me/ (auth + connectivity)
  leads [--query "..."] [--limit N]      GET /lead/
  lead-get --id <id>                     GET /lead/{id}/
  lead-create --json '{...}'             POST /lead/
  lead-update --id <id> --json '{...}'   PUT /lead/{id}/
  contact-create --json '{...}'          POST /contact/
  opps [--limit N]                       GET /opportunity/
  opp-create --json '{...}'              POST /opportunity/
  note --json '{...}'                    POST /activity/note/
  search --json '{...}'                  POST /data/search/  (advanced filtering)
  call --method GET --path /x/ [--json '{...}']   generic escape hatch
Auth: HTTP Basic, key as username + blank password (Authorization: Basic base64("$CLOSE_API_KEY:")).
Paths are singular with a trailing slash. On 429, back off by the rate_reset seconds.`;

async function main() {
  switch (cmd) {
    case 'me':
    case '--selftest':
      console.log(JSON.stringify(await closeReq('GET', '/me/'), null, 2));
      console.error('[close] OK — auth + connectivity verified.');
      break;
    case 'leads': {
      const q = opt('--query', null);
      const qs = `?_limit=${opt('--limit', '20')}` + (q ? `&query=${encodeURIComponent(q)}` : '');
      console.log(JSON.stringify(await closeReq('GET', `/lead/${qs}`), null, 2));
      break;
    }
    case 'lead-get': {
      const id = opt('--id', null); if (!id) throw new Error('--id required');
      console.log(JSON.stringify(await closeReq('GET', `/lead/${id}/`), null, 2));
      break;
    }
    case 'lead-create':
      console.log(JSON.stringify(await closeReq('POST', '/lead/', jsonArg()), null, 2));
      break;
    case 'lead-update': {
      const id = opt('--id', null); if (!id) throw new Error('--id required');
      console.log(JSON.stringify(await closeReq('PUT', `/lead/${id}/`, jsonArg()), null, 2));
      break;
    }
    case 'contact-create':
      console.log(JSON.stringify(await closeReq('POST', '/contact/', jsonArg()), null, 2));
      break;
    case 'opps':
      console.log(JSON.stringify(await closeReq('GET', `/opportunity/?_limit=${opt('--limit', '20')}`), null, 2));
      break;
    case 'opp-create':
      console.log(JSON.stringify(await closeReq('POST', '/opportunity/', jsonArg()), null, 2));
      break;
    case 'note':
      console.log(JSON.stringify(await closeReq('POST', '/activity/note/', jsonArg()), null, 2));
      break;
    case 'search':
      console.log(JSON.stringify(await closeReq('POST', '/data/search/', jsonArg()), null, 2));
      break;
    case 'call': {
      const method = (opt('--method', 'GET')).toUpperCase();
      const p = opt('--path', null); if (!p) throw new Error('--path </.../> required');
      console.log(JSON.stringify(await closeReq(method, p, ['POST', 'PUT', 'PATCH'].includes(method) ? jsonArg() : undefined), null, 2));
      break;
    }
    default:
      console.log(HELP);
  }
}

if (process.argv[1] && process.argv[1].endsWith('close.mjs')) {
  main().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
}
