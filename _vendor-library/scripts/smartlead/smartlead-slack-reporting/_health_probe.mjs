#!/usr/bin/env node
// _health_probe.mjs — READ-ONLY signal discovery for the new health-alerts detectors.
// 1) distinct campaign status values + counts (what does ACTIVE/PAUSED/STOPPED actually look like?)
// 2) full campaign object on a few non-ACTIVE campaigns → hunt for a pause-reason / error / blocked field
// 3) reconfirm the email-account connection fields the mailbox detector keys off
// No writes, no spend (GETs only).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
function env(k) {
  if (process.env[k]) return process.env[k];
  const m = readFileSync(join(__dirname, '..', '.env'), 'utf8').match(new RegExp('^' + k + '=(.+)$', 'm'));
  if (!m) throw new Error(k + ' not in scripts/.env'); return m[1].trim();
}
const KEY = env('SMARTLEAD_API_KEY');
const SL = 'https://server.smartlead.ai/api/v1';
async function slGet(path) { const sep = path.includes('?') ? '&' : '?'; const r = await fetch(`${SL}${path}${sep}api_key=${KEY}`); if (!r.ok) return { _err: r.status }; return r.json(); }

// 1) roster + distinct statuses
const d = await slGet('/analytics/campaign/list');
const list = d?.data?.campaign_list || d?.campaign_list || [];
const byStatus = {};
for (const c of list) { const s = String(c.status); (byStatus[s] = byStatus[s] || []).push(c); }
console.log('=== campaign statuses (count) ===');
for (const s of Object.keys(byStatus).sort()) console.log(`  ${s.padEnd(12)} ${byStatus[s].length}`);
console.log(`  TOTAL        ${list.length}`);

// show a few non-ACTIVE/non-DRAFTED to inspect
const nonActive = list.filter(c => !['ACTIVE', 'DRAFTED', 'COMPLETED'].includes(String(c.status)));
console.log(`\n=== ${nonActive.length} non-ACTIVE/DRAFTED/COMPLETED campaigns (first 8) ===`);
for (const c of nonActive.slice(0, 8)) console.log(`  id=${c.id}  status=${c.status}  ${String(c.name).slice(0, 60)}`);

// also a sample of the roster row's own keys (status_reason maybe lives here)
if (list.length) console.log('\n=== roster row keys ===\n  ' + Object.keys(list[0]).sort().join(', '));

// 2) full campaign object on up to 3 non-active campaigns → hunt for pause/error/reason fields
const PROBE = (nonActive.length ? nonActive : list).slice(0, 3);
for (const c of PROBE) {
  const full = await slGet(`/campaigns/${c.id}`);
  if (full?._err) { console.log(`\n#${c.id} get-campaign FAILED ${full._err}`); continue; }
  console.log(`\n=== full campaign ${c.id} (status=${c.status}) keys ===`);
  console.log('  ' + Object.keys(full).sort().join(', '));
  const hits = Object.keys(full).filter(k => /paus|stop|error|block|reason|status|bounce|protect/i.test(k));
  console.log('  signal-ish fields:');
  for (const k of hits) console.log(`    ${k} = ${JSON.stringify(full[k])}`);
}

// 3) reconfirm email-account connection fields
const acc = await slGet('/email-accounts/?offset=0&limit=2');
const arr = Array.isArray(acc) ? acc : (acc?.data || []);
if (arr.length) {
  console.log('\n=== email-account row keys ===\n  ' + Object.keys(arr[0]).sort().join(', '));
  const a = arr[0];
  console.log('  connection-ish:', JSON.stringify({
    is_smtp_success: a.is_smtp_success, is_imap_success: a.is_imap_success,
    smtp_failure_error: a.smtp_failure_error, imap_failure_error: a.imap_failure_error,
    warmup_status: a.warmup_details?.status,
  }));
}
console.log('\ndone.');
