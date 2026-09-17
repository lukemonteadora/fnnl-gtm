#!/usr/bin/env node
// preview.mjs — Dry-run the Smartlead→Slack reports against LIVE Smartlead, render the exact
// Bison-style tables to the console (no Slack posting). Proves the replication + is the reusable
// local/VPS reference implementation. The Apps Script (Code.gs) ports this same logic.
//
//   node preview.mjs              # default: today's sends + last-30d digest + leads + bounce
//   node preview.mjs 7            # use a 7-day digest window
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = 'https://server.smartlead.ai/api/v1';
function loadKey() {
  if (process.env.SMARTLEAD_API_KEY) return process.env.SMARTLEAD_API_KEY;
  const env = readFileSync(join(__dirname, '..', '.env'), 'utf8');
  const m = env.match(/^SMARTLEAD_API_KEY=(.+)$/m);
  if (!m) throw new Error('SMARTLEAD_API_KEY not found in scripts/.env');
  return m[1].trim();
}
const KEY = loadKey();
const N = (v) => { const n = parseInt(String(v ?? 0).replace(/[^0-9-]/g, ''), 10); return isNaN(n) ? 0 : n; };
const fmt = (n) => N(n).toLocaleString('en-US');
const ymd = (d) => d.toISOString().slice(0, 10);

async function get(path) {
  const sep = path.includes('?') ? '&' : '?';
  const res = await fetch(`${BASE}${path}${sep}api_key=${KEY}`);
  if (res.status === 429 || res.status >= 500) { await new Promise(r => setTimeout(r, 1200)); return get(path); }
  if (!res.ok) return null;
  return res.json();
}
// simple concurrency map
async function mapLimit(items, limit, fn) {
  const out = new Array(items.length); let i = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) { const idx = i++; out[idx] = await fn(items[idx], idx); }
  }));
  return out;
}
const clientOf = (name) => {
  if (!name) return 'Unassigned';
  if (name.includes('|')) return name.split('|')[0].trim();
  const fu = name.trim();
  return /^(follow up|fup)/i.test(fu) ? 'Follow-ups' : fu.slice(0, 24);
};

function table(headers, rows, widths) {
  const pad = (s, w, right) => { s = String(s); if (s.length > w) s = s.slice(0, w); const sp = ' '.repeat(Math.max(0, w - s.length)); return right ? sp + s : s + sp; };
  const line = (cells) => cells.map((c, i) => pad(c, widths[i], i > 0)).join('  ');
  return [line(headers), ...rows.map(line)].join('\n');
}

(async () => {
  const win = N(process.argv[2]) || 30;
  const today = new Date();
  const winStart = new Date(today); winStart.setDate(winStart.getDate() - (win - 1));

  console.log('Loading campaign roster…');
  const roster = await get('/analytics/campaign/list');
  const campaigns = (roster?.data?.campaign_list || []).filter(c => c.status !== 'DRAFTED');
  console.log(`${campaigns.length} non-drafted campaigns (of ${roster?.data?.campaign_list?.length}). Fetching stats…`);

  // lifetime (interested, notStarted, cumulative sent/bounce)
  const life = await mapLimit(campaigns, 12, c => get(`/campaigns/${c.id}/analytics`));
  // windowed (sent/bounce in window)
  const wind = await mapLimit(campaigns, 12, c => get(`/campaigns/${c.id}/analytics-by-date?start_date=${ymd(winStart)}&end_date=${ymd(today)}`));
  // today
  const dayd = await mapLimit(campaigns, 12, c => get(`/campaigns/${c.id}/analytics-by-date?start_date=${ymd(today)}&end_date=${ymd(today)}`));

  // group by client prefix
  const G = {};
  campaigns.forEach((c, i) => {
    const k = clientOf(c.name);
    const g = (G[k] = G[k] || { today: 0, sent: 0, bounce: 0, interested: 0, notStarted: 0, lifeSent: 0, lifeBounce: 0 });
    g.today += N(dayd[i]?.sent_count);
    g.sent += N(wind[i]?.sent_count);
    g.bounce += N(wind[i]?.bounce_count);
    g.interested += N(life[i]?.campaign_lead_stats?.interested);
    g.notStarted += N(life[i]?.campaign_lead_stats?.notStarted);
    g.lifeSent += N(life[i]?.sent_count);
    g.lifeBounce += N(life[i]?.bounce_count);
  });
  const clients = Object.keys(G).sort();

  // 1) DAILY SENDS
  let tot = 0; const dsRows = clients.map(k => { tot += G[k].today; return [k, fmt(G[k].today)]; });
  console.log('\n\n================  smartlead-daily-sends-report  ================');
  console.log(`📊 Daily Send Report — ${today.toDateString()}\n`);
  console.log(table(['Client', 'Sends'], [...dsRows, ['', ''], ['TOTAL', fmt(tot)]], [26, 8]));

  // 3) DIGEST (window)
  let tS = 0, tB = 0, tI = 0, active = 0;
  const dgRows = clients.map(k => {
    const g = G[k]; const bnc = g.sent ? Math.round((g.bounce / g.sent) * 1000) / 10 : 0;
    tS += g.sent; tB += g.bounce; tI += g.interested; if (g.sent) active++;
    return [k, fmt(g.sent), bnc + '%', String(g.interested)];
  });
  const obnc = tS ? Math.round((tB / tS) * 1000) / 10 : 0;
  console.log(`\n\n================  smartlead-weekly/monthly-digest (${win}d)  ================`);
  console.log(`📊 Digest — last ${win} days\n`);
  console.log(table(['Client', 'Sends', 'Bnc%', 'Int'], [...dgRows, ['', '', '', ''], ['TOTAL', fmt(tS), '', String(tI)]], [22, 8, 6, 4]));
  console.log(`\nTotals: ${fmt(tS)} sends | ${obnc}% bounces | ${tI} interested | ${clients.length} clients (${active} active)`);

  // 5) BOUNCE ALERTS (cumulative per campaign > 5% & sent>=500)
  console.log('\n\n================  smartlead-bounce-alerts (cumulative scan)  ================');
  let anyB = false;
  campaigns.forEach((c, i) => {
    const sent = N(life[i]?.sent_count), b = N(life[i]?.bounce_count);
    if (sent >= 500 && b / sent >= 0.05) { anyB = true; console.log(`🚨 ${clientOf(c.name)} — ${c.name.slice(0, 50)} — ${(Math.round(b / sent * 1000) / 10)}% (${fmt(b)}/${fmt(sent)})`); }
  });
  if (!anyB) console.log('(no campaigns over 5% with 500+ sends)');

  // 2) DAILY LEADS (notStarted buckets)
  const LOW = 200;
  const ent = clients.map(k => ({ name: k, n: G[k].notStarted }));
  const empty = ent.filter(e => e.n === 0), low = ent.filter(e => e.n > 0 && e.n < LOW).sort((a, b) => a.n - b.n), good = ent.filter(e => e.n >= LOW).sort((a, b) => b.n - a.n);
  console.log('\n\n================  smartlead-daily-leads-report  ================');
  console.log('📋 Daily Leads Report\n');
  if (low.length) { console.log('Running low:'); low.forEach(e => console.log(`  • ${e.name} — ${fmt(e.n)} new leads left`)); }
  console.log(`\n${good.length} client(s) looking good:`);
  good.slice(0, 10).forEach(e => console.log(`  • ${e.name} — ${fmt(e.n)}`));
  console.log(`\n${ent.length} clients — ${empty.length} empty • ${low.length} low • ${good.length} good`);
})();
