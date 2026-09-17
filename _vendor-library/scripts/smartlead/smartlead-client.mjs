#!/usr/bin/env node
// smartlead-client.mjs — Smartlead CLIENT-ACCESS create/list/verify via the public REST API.
//
// Standing rule: every client gets a Smartlead client-access entity, and that client's mailboxes are
// assigned to it (see /smartlead-inbox-manager → Client-Access HARD RULE). This script covers the two
// scriptable parts; the ASSIGN step is browser-only (the assign endpoint is an internal app route that
// the public api_key can't call and a page-context fetch is CORS-blocked — do it in the UI:
// Email Accounts → search client → scroll list to bottom (loads all rows past the ~30/page virtualization)
// → header select-all → Bulk Update → Management → Add Client (dropdown searches by NAME) → Save).
//
// Template (copy any existing client-access entity): name = client primary contact, email = that contact's email,
// logo = company display name, permission = ["reply_master_inbox"], retricted_category = []. CREATE requires
// a password (omitting → 500); a strong one is generated and PRINTED for the operator (it's the client-portal
// password, NOT the Smartlead login — generating it is not an authentication step). CREATE does NOT email the client.
//
// REMOVE CATEGORIES (restrict the client's reply-category view) is a SEPARATE, BROWSER-ONLY step — this script does
// NOT set it. The public GET /client/ returns retricted_category:[] even after a confirmed UI save (verified
// 2026-06-22), so the field isn't surfaced by the public API; set + verify it in the UI (Client Access → client →
// "Remove Categories" multiselect → Update). Default set to HIDE (per /smartlead-inbox-manager HARD RULE): Do Not
// Contact, Out Of Office, Wrong Person, Not Interested, Outdated Email, Uncategorizable by Ai, Lead Category Not Assigned.
//
// Usage (loads SMARTLEAD_API_KEY from ./.env):
//   node smartlead-client.mjs list                                  # all clients (id, name, email, logo)
//   node smartlead-client.mjs create "<Contact Name>" <email> "<Company>"   # create; prints clientId + generated password
//   node smartlead-client.mjs verify <clientId> <emailSubstr> [expectedCount]  # count accounts on this client + scope check

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import crypto from 'node:crypto';
const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = 'https://server.smartlead.ai/api/v1';
function loadKey() {
  if (process.env.SMARTLEAD_API_KEY) return process.env.SMARTLEAD_API_KEY;
  const m = readFileSync(join(__dirname, '.env'), 'utf8').match(/^SMARTLEAD_API_KEY=(.+)$/m);
  if (!m) throw new Error('SMARTLEAD_API_KEY not found in scripts/.env');
  return m[1].trim();
}
const KEY = loadKey();
async function api(method, path, body) {
  const sep = path.includes('?') ? '&' : '?';
  const res = await fetch(`${BASE}${path}${sep}api_key=${KEY}`, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const t = await res.text(); let j; try { j = JSON.parse(t); } catch { j = t; }
  return { status: res.status, ok: res.ok, j };
}

async function listClients() {
  const r = await api('GET', '/client/');
  if (!r.ok) { console.error('FAIL', r.status, r.j); process.exit(1); }
  for (const c of r.j) console.log(`${c.id}\t${c.name}\t${c.email}\tlogo=${c.logo}\tperm=${JSON.stringify((c.client_permision||{}).permission||[])}`);
  return r.j;
}

async function createClient(name, email, logo) {
  if (!name || !email || !logo) { console.error('need "<Contact Name>" <email> "<Company>"'); process.exit(2); }
  const existing = await api('GET', '/client/');
  if (existing.ok && existing.j.find(c => (c.email || '').toLowerCase() === email.toLowerCase())) {
    console.error(`Client with email ${email} already exists (id ${existing.j.find(c => c.email.toLowerCase() === email.toLowerCase()).id}). Aborting create.`);
    process.exit(1);
  }
  const password = 'Sl' + crypto.randomBytes(9).toString('base64').replace(/[^a-zA-Z0-9]/g, '') + '!7';
  const r = await api('POST', '/client/save', { name, email, permission: ['reply_master_inbox'], logo, logo_url: null, password });
  console.log(`STATUS ${r.status}`);
  console.log(`GENERATED PORTAL PASSWORD (record for operator; client is NOT auto-emailed): ${password}`);
  console.log(JSON.stringify(r.j));
  if (r.ok) console.log(`\nNEXT: assign this client's mailboxes in the BROWSER (Email Accounts → search → scroll to load all → select-all → Bulk Update → Management → Add Client "${name}" → Save), then: node smartlead-client.mjs verify ${r.j.clientId} <emailSubstr> <count>`);
}

async function verify(clientId, sub, expected) {
  clientId = Number(clientId);
  let all = [];
  for (let o = 0; o < 5000; o += 100) { const r = await api('GET', `/email-accounts/?offset=${o}&limit=100`); if (!r.ok) break; const a = Array.isArray(r.j) ? r.j : (r.j.data || []); all = all.concat(a); if (a.length < 100) break; }
  const match = all.filter(a => (a.from_email || '').toLowerCase().includes((sub || '').toLowerCase()));
  const onClient = match.filter(a => a.client_id === clientId);
  const unassigned = match.filter(a => a.client_id !== clientId);
  const wrong = all.filter(a => a.client_id === clientId && !(a.from_email || '').toLowerCase().includes((sub || '').toLowerCase()));
  console.log(`matching "${sub}": ${match.length}  on_client_${clientId}: ${onClient.length}  not_on_client: ${unassigned.length}  OTHER-accounts-wrongly-on-client: ${wrong.length}`);
  if (expected) console.log(onClient.length === Number(expected) && wrong.length === 0 ? `✅ EXACTLY ${expected} assigned, no scope leak.` : `⚠️ expected ${expected}; investigate.`);
  if (unassigned.length) console.log('NOT yet on client: ' + unassigned.map(a => a.from_email).join(', '));
}

const [cmd, a1, a2, a3] = process.argv.slice(2);
if (cmd === 'list') await listClients();
else if (cmd === 'create') await createClient(a1, a2, a3);
else if (cmd === 'verify') await verify(a1, a2, a3);
else { console.error('Unknown command. See header for usage.'); process.exit(2); }
