#!/usr/bin/env node
// smartlead-tags.mjs — Smartlead email-account TAG + read operations via the public REST API.
//
// Why this exists: the LeadMagic Smartlead MCP (smartlead-mcp-by-leadmagic) ships WRONG routes for
// its write tools — create_email_account → POST /email-accounts (404; real path is /email-accounts/save),
// update_email_account_tag → POST /email-accounts/{id}/tag (404; this path does NOT exist). The real,
// supported tag API is POST /email-accounts/tag-mapping. This script uses the correct routes so tagging
// (and account reads) work WITHOUT the browser.
//
// Usage (run from anywhere; loads SMARTLEAD_API_KEY from ../scripts/.env next to this file):
//   node smartlead-tags.mjs tags                         # list all tag definitions (id + name)
//   node smartlead-tags.mjs accounts [filter]            # list accounts (optional from_email substring filter), shows id/email/type/tags
//   node smartlead-tags.mjs tag-map <accIds> <tagIds>    # ASSIGN tags (adds; idempotent). Comma-separated ids. Batches of 25.
//   node smartlead-tags.mjs untag <accIds> <tagIds>      # REMOVE tags. Comma-separated ids.
//   node smartlead-tags.mjs create-tag <name> [color]    # create a new tag definition (color hex, optional)
//
// Examples:
//   node smartlead-tags.mjs accounts <client-slug>
//   node smartlead-tags.mjs tag-map <account-ids> <tag-ids>   # e.g. 000000,000001 100000,100001

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = 'https://server.smartlead.ai/api/v1';

function loadKey() {
  if (process.env.SMARTLEAD_API_KEY) return process.env.SMARTLEAD_API_KEY;
  const env = readFileSync(join(__dirname, '.env'), 'utf8');
  const m = env.match(/^SMARTLEAD_API_KEY=(.+)$/m);
  if (!m) throw new Error('SMARTLEAD_API_KEY not found in scripts/.env');
  return m[1].trim();
}
const KEY = loadKey();

async function api(method, path, body) {
  const sep = path.includes('?') ? '&' : '?';
  const url = `${BASE}${path}${sep}api_key=${KEY}`;
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, ok: res.ok, json };
}

const chunk = (arr, n) => arr.reduce((a, _, i) => (i % n ? a : [...a, arr.slice(i, i + n)]), []);
const ids = (s) => s.split(',').map((x) => Number(x.trim())).filter(Boolean);

async function listTags() {
  const r = await api('GET', '/email-accounts/tags');
  if (!r.ok) return console.error('FAIL', r.status, r.json);
  const tags = Array.isArray(r.json) ? r.json : (r.json.tags || r.json.data || []);
  console.log(`# ${tags.length} tags`);
  for (const t of tags) console.log(`${t.id}\t${t.name}${t.color ? '  (' + t.color + ')' : ''}`);
}

async function listAccounts(filter) {
  const r = await api('GET', '/email-accounts/?offset=0&limit=400');
  if (!r.ok) return console.error('FAIL', r.status, r.json);
  let accts = Array.isArray(r.json) ? r.json : (r.json.data || []);
  if (filter) accts = accts.filter((a) => (a.from_email || a.from_name || '').toLowerCase().includes(filter.toLowerCase()));
  console.log(`# ${accts.length} accounts${filter ? ' matching "' + filter + '"' : ''}`);
  for (const a of accts) {
    const tagList = (a.tags || a.email_account_tag_mappings || []).map((t) => t.name || t.tag?.name || t.tag_name || t.id).join(',');
    console.log(`${a.id}\t${a.type || '?'}\t${a.from_email}\t[${tagList}]`);
  }
}

async function tagMap(accStr, tagStr, remove = false) {
  const accIds = ids(accStr), tagIds = ids(tagStr);
  if (!accIds.length || !tagIds.length) throw new Error('need account ids and tag ids');
  for (const batch of chunk(accIds, 25)) {
    const r = remove
      ? await api('DELETE', '/email-accounts/tag-mapping', { email_account_ids: batch, tag_ids: tagIds })
      : await api('POST', '/email-accounts/tag-mapping', { email_account_ids: batch, tag_ids: tagIds });
    console.log(`${remove ? 'UNTAG' : 'TAG'} accts=${batch.length} tags=${tagIds.join(',')} -> ${r.status} ${r.ok ? 'OK' : 'FAIL'} ${JSON.stringify(r.json).slice(0, 300)}`);
    if (!r.ok) process.exitCode = 1;
  }
}

async function createTag(name, color) {
  // Correct route is POST /tags (verified 2026-06-15). NOT /email-accounts/tags — that path is
  // shadowed by POST /email-accounts/:account_id and 400s ("account_id must be a number").
  const r = await api('POST', '/tags', { name, color: color || '#4F46E5' });
  console.log(`CREATE-TAG "${name}" -> ${r.status} ${JSON.stringify(r.json).slice(0, 300)}`);
}

const [cmd, a1, a2] = process.argv.slice(2);
const run = {
  tags: () => listTags(),
  accounts: () => listAccounts(a1),
  'tag-map': () => tagMap(a1, a2, false),
  untag: () => tagMap(a1, a2, true),
  'create-tag': () => createTag(a1, a2),
};
if (!run[cmd]) { console.error('Unknown command. See header for usage.'); process.exit(2); }
await run[cmd]();
