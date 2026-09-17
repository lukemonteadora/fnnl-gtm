#!/usr/bin/env node
// smartlead-rotation-split.mjs — compute + apply the rotating-mailbox-batch split for a client.
//
// HARD RULE (see /smartlead-inbox-manager Rotation batch tags): every mailbox batch is split into two
// warmed mirror halves, Batch N.1 (primary) / Batch N.2 (backup), balanced per (provider x type) cell,
// keeping whole domains together (both mailboxes of a domain go in the same half; odd domain -> N.1).
//
// Usage (loads SMARTLEAD_API_KEY from ../scripts/.env):
//   node smartlead-rotation-split.mjs <clientSubstr> plan          # print the split + balance, no writes
//   node smartlead-rotation-split.mjs <clientSubstr> apply         # also tag-map via REST
//   node smartlead-rotation-split.mjs <clientSubstr> apply 424096 424097   # override tag ids (default = Batch 1.1 / 1.2)
//
// Vendor is read from each account's existing provenance tag (Primeforge/Zapmail); type from account.type.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
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
const chunk = (a, n) => a.reduce((x, _, i) => (i % n ? x : [...x, a.slice(i, i + n)]), []);
const tagsOf = a => (a.tags || []).map(t => t.tag_name || t.name || t.tag?.name).filter(Boolean);

const [clientSubstr, mode = 'plan', tag11 = '424096', tag12 = '424097'] = process.argv.slice(2);
if (!clientSubstr) { console.error('need <clientSubstr> [plan|apply]'); process.exit(2); }

// pull all accounts
let all = [];
for (let o = 0; o < 20000; o += 100) {
  const r = await api('GET', `/email-accounts/?offset=${o}&limit=100`);
  if (!r.ok) { console.error('list FAIL', r.status); process.exit(1); }
  const a = Array.isArray(r.j) ? r.j : (r.j.data || []); all = all.concat(a);
  if (a.length < 100) break;
}
const sub = clientSubstr.toLowerCase();
const accts = all.filter(a => `${a.from_email || ''} ${a.from_name || ''}`.toLowerCase().includes(sub));
console.log(`Matched ${accts.length} accounts for "${clientSubstr}"`);
if (!accts.length) process.exit(1);

// warn if any already carry a rotation tag
const already = accts.filter(a => tagsOf(a).some(t => /^Batch \d+\.\d+$/.test(t)));
if (already.length) console.log(`!! ${already.length} accounts already have a Batch tag (re-run is idempotent but check the split matches): ${already.slice(0,4).map(a=>a.from_email).join(', ')}...`);

// group by domain
const byDomain = {};
for (const a of accts) {
  const dom = String(a.from_email || '').split('@')[1] || '?';
  const provider = tagsOf(a).includes('Primeforge') ? 'Primeforge' : (tagsOf(a).includes('Zapmail') ? 'Zapmail' : 'UNKNOWN');
  const type = a.type === 'GMAIL' ? 'Google' : (a.type === 'OUTLOOK' ? 'Microsoft' : a.type || '?');
  (byDomain[dom] ||= { dom, provider, type, ids: [] }).ids.push(a.id);
}
const domains = Object.values(byDomain);
// cells = provider x type
const cells = {};
for (const d of domains) (cells[`${d.provider}-${d.type}`] ||= []).push(d);

const half1 = [], half2 = []; // arrays of account ids
const counts = { tot: [0, 0], type: {}, prov: {} };
const bump = (h, d) => {
  const n = d.ids.length;
  counts.tot[h] += n;
  (counts.type[d.type] ||= [0, 0])[h] += n;
  (counts.prov[d.provider] ||= [0, 0])[h] += n;
};
const assign = (h, d) => { d.half = h; (h === 0 ? half1 : half2).push(...d.ids); bump(h, d); };
// base split: floor(n/2) whole domains to each half per (provider x type) cell; collect the odd-cell spares
const spares = [];
for (const key of Object.keys(cells).sort()) {
  const ds = cells[key].sort((a, b) => a.dom.localeCompare(b.dom));
  const f = Math.floor(ds.length / 2);
  for (let i = 0; i < f; i++) assign(0, ds[i]);
  for (let i = f; i < 2 * f; i++) assign(1, ds[i]);
  if (ds.length % 2) spares.push(ds[2 * f]);
}
// distribute spares to keep TOTAL + TYPE + PROVIDER balanced across the two halves
// (off-by-one at the provider x type intersection is unavoidable when a cell is odd)
const scoreIfAdded = (h, d) => {
  const tot = [...counts.tot]; const ty = [...(counts.type[d.type] || [0, 0])]; const pr = [...(counts.prov[d.provider] || [0, 0])];
  const n = d.ids.length; tot[h] += n; ty[h] += n; pr[h] += n;
  return Math.abs(tot[0] - tot[1]) + Math.abs(ty[0] - ty[1]) + Math.abs(pr[0] - pr[1]);
};
for (const d of spares) assign(scoreIfAdded(0, d) <= scoreIfAdded(1, d) ? 0 : 1, d);

const tally = {};
for (const key of Object.keys(cells).sort()) {
  const ds = cells[key];
  const h1 = ds.filter(d => d.half === 0), h2 = ds.filter(d => d.half === 1);
  tally[key] = { domains: ds.length, h1_domains: h1.length, h2_domains: h2.length, h1_mbx: h1.reduce((s,d)=>s+d.ids.length,0), h2_mbx: h2.reduce((s,d)=>s+d.ids.length,0) };
}
console.log('\nPer (provider x type) cell:');
for (const k of Object.keys(tally)) console.log(`  ${k}: ${tally[k].domains} domains -> 1.1=${tally[k].h1_domains}dom/${tally[k].h1_mbx}mbx  1.2=${tally[k].h2_domains}dom/${tally[k].h2_mbx}mbx`);
const sideMix = (h) => `Google=${(counts.type.Google||[0,0])[h]} Microsoft=${(counts.type.Microsoft||[0,0])[h]} | Primeforge=${(counts.prov.Primeforge||[0,0])[h]} Zapmail=${(counts.prov.Zapmail||[0,0])[h]}`;
console.log(`\nBalance check — 1.1: ${sideMix(0)}`);
console.log(`Balance check — 1.2: ${sideMix(1)}`);
console.log(`\nBatch 1.1 (primary): ${half1.length} mailboxes`);
console.log(`Batch 1.2 (backup):  ${half2.length} mailboxes`);

if (mode !== 'apply') { console.log('\n(plan mode — no writes. Re-run with `apply` to tag.)'); process.exit(0); }

async function tagMap(ids, tagId) {
  for (const b of chunk(ids, 25)) {
    const r = await api('POST', '/email-accounts/tag-mapping', { email_account_ids: b, tag_ids: [Number(tagId)] });
    console.log(`  TAG ${tagId} <- ${b.length} accts -> ${r.status} ${r.ok ? 'OK' : 'FAIL ' + JSON.stringify(r.j).slice(0,200)}`);
    if (!r.ok) process.exitCode = 1;
  }
}
console.log(`\nApplying tags (1.1=${tag11}, 1.2=${tag12})...`);
await tagMap(half1, tag11);
await tagMap(half2, tag12);
console.log('Done.');
