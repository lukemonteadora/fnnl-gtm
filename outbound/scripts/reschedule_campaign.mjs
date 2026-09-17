#!/usr/bin/env node
// reschedule_campaign.mjs — change ONLY a campaign's schedule_start_time, preserving every other
// schedule field (timezone, days, hours, throttle, volume) read live from the campaign. Verifies.
// USAGE: node reschedule_campaign.mjs <campaignId> <newStartISO>   e.g. 2026-07-07T13:00:00.000Z
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = 'https://server.smartlead.ai/api/v1';
const KEY = process.env.SMARTLEAD_API_KEY || (readFileSync(join(__dirname, '.env'), 'utf8').match(/^SMARTLEAD_API_KEY=(.+)$/m) || [])[1]?.trim();
const [ID, NEW_START] = process.argv.slice(2);
if (!ID || !NEW_START) { console.error('usage: node reschedule_campaign.mjs <campaignId> <newStartISO>'); process.exit(1); }
async function api(method, path, body) {
  const sep = path.includes('?') ? '&' : '?';
  const res = await fetch(`${BASE}${path}${sep}api_key=${KEY}`, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const t = await res.text(); let j; try { j = JSON.parse(t); } catch { j = t; }
  return { ok: res.ok, status: res.status, j };
}
const g = await api('GET', `/campaigns/${ID}`); const c = g.j.data || g.j;
const cron = c.scheduler_cron_value || {};
if (c.status === 'ACTIVE') { console.log(`  ⚠ ${ID} is ACTIVE — refusing to reschedule a live campaign. (no-op)`); process.exit(0); }
const oldStart = c.schedule_start_time;
const body = {
  timezone: cron.tz,
  days_of_the_week: cron.days,
  start_hour: cron.startHour,
  end_hour: cron.endHour,
  min_time_btw_emails: c.min_time_btwn_emails ?? 12,
  max_new_leads_per_day: c.max_leads_per_day ?? 30,
  schedule_start_time: NEW_START,
};
console.log(`campaign ${ID} (${c.name})  ${oldStart} -> ${NEW_START}  [tz ${cron.tz}, ${cron.startHour}-${cron.endHour}, min ${body.min_time_btw_emails}, max ${body.max_new_leads_per_day}/day]`);
const r = await api('POST', `/campaigns/${ID}/schedule`, body);
console.log(`  ${r.ok ? '✓' : '✗'} schedule POST ${r.status}${r.ok ? '' : ' ' + JSON.stringify(r.j).slice(0, 250)}`);
if (!r.ok) process.exit(1);
await new Promise((res) => setTimeout(res, 1200));
const g2 = await api('GET', `/campaigns/${ID}`); const c2 = g2.j.data || g2.j;
const cron2 = c2.scheduler_cron_value || {};
const ok = c2.schedule_start_time === NEW_START && cron2.tz === cron.tz && cron2.startHour === cron.startHour && cron2.endHour === cron.endHour && JSON.stringify(cron2.days) === JSON.stringify(cron.days) && c2.min_time_btwn_emails === body.min_time_btw_emails && c2.max_leads_per_day === body.max_new_leads_per_day;
console.log(`  verify: start=${c2.schedule_start_time}  tz=${cron2.tz}  ${cron2.startHour}-${cron2.endHour}  min=${c2.min_time_btwn_emails}  max=${c2.max_leads_per_day}  -> ${ok ? '✓ OK' : '✗ MISMATCH'}`);
process.exit(ok ? 0 : 1);
