#!/usr/bin/env node
// smartlead-warmup-set.mjs — set warmup config on a batch of Smartlead email accounts via REST.
//
// Why: the Zapmail->Smartlead export enables warmup but the ramp value isn't readable via the
// account list or warmup-stats endpoints. This sets a deterministic, safe cold-start ramp on
// brand-new mailboxes (doctrine: daily ramp-up >= 5). Idempotent — re-running just re-asserts config.
//
// Route (verified): POST /email-accounts/{id}/warmup
//   body: { warmup_enabled, total_warmup_per_day, daily_rampup, reply_rate_percentage }
//
// Usage (loads SMARTLEAD_API_KEY from ./.env):
//   node smartlead-warmup-set.mjs <id1,id2,...> [dailyRampup=5] [replyRate=75] [totalPerDay=40]
//   node smartlead-warmup-set.mjs <id> probe        # single id, print full response (route check)

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

const [idStr, arg2 = '5', replyRate = '75', totalPerDay = '40'] = process.argv.slice(2);
if (!idStr) { console.error('need <id1,id2,...> [dailyRampup] [replyRate] [totalPerDay]'); process.exit(2); }
const probe = arg2 === 'probe';
const dailyRampup = probe ? 5 : Number(arg2);
const ids = idStr.split(',').map(x => Number(x.trim())).filter(Boolean);

const body = {
  warmup_enabled: true,
  total_warmup_per_day: Number(totalPerDay),
  daily_rampup: dailyRampup,
  reply_rate_percentage: Number(replyRate),
};
console.log(`warmup body = ${JSON.stringify(body)}  | ${ids.length} account(s)`);

let ok = 0, fail = 0;
for (const id of ids) {
  const r = await api('POST', `/email-accounts/${id}/warmup`, body);
  if (r.ok) { ok++; } else { fail++; process.exitCode = 1; }
  console.log(`  ${id} -> ${r.status} ${r.ok ? 'OK' : 'FAIL'}${(probe || !r.ok) ? ' ' + JSON.stringify(r.j).slice(0, 400) : ''}`);
}
console.log(`Done. OK=${ok} FAIL=${fail}`);
