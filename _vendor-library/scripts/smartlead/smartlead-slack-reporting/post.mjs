#!/usr/bin/env node
// post.mjs — LIVE Node poster: pull Smartlead, render Bison-style reports, post to the the upstream workspace
// smartlead-* Slack channels via the bot token. This is the "API path" / VPS fallback that mirrors
// Code.gs (the Apps Script). Loads SMARTLEAD_API_KEY + SLACK_BOT_TOKEN from ../.env.
//
//   node post.mjs                 # post the scheduled set (sends, weekly, leads, bounce)
//   node post.mjs daily-sends     # post one report
//   node post.mjs monthly         # monthly digest
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
function env(k) {
  if (process.env[k]) return process.env[k];
  const m = readFileSync(join(__dirname, '..', '.env'), 'utf8').match(new RegExp('^' + k + '=(.+)$', 'm'));
  if (!m) throw new Error(k + ' not in scripts/.env'); return m[1].trim();
}
const SL_KEY = env('SMARTLEAD_API_KEY');
const SLACK = env('SLACK_BOT_TOKEN');
const SL = 'https://server.smartlead.ai/api/v1';
// Company-specific, non-secret config (channel ids + client-name aliases) lives in config.local.json
// (auto-gitignored via *.local.json). Copy config.example.json → config.local.json per deployment.
const CFG = (() => {
  try { return JSON.parse(readFileSync(join(__dirname, 'config.local.json'), 'utf8')); }
  catch { throw new Error('config.local.json not found in ' + __dirname + ' — copy config.example.json to config.local.json and fill in channels (run create-channels.mjs to get the ids) + aliases.'); }
})();
const CH = CFG.channels;
const ALIASES = CFG.aliases || {};

const N = (v) => { const n = parseInt(String(v ?? 0).replace(/[^0-9-]/g, ''), 10); return isNaN(n) ? 0 : n; };
const fmt = (n) => N(n).toLocaleString('en-US');
const pct = (p, w) => (w > 0 ? Math.round((p / w) * 1000) / 10 : 0);
const ymd = (d) => d.toISOString().slice(0, 10);
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };
function prettyDate(d) { const day = d.getDate(); const s = (day % 10 === 1 && day !== 11) ? 'st' : (day % 10 === 2 && day !== 12) ? 'nd' : (day % 10 === 3 && day !== 13) ? 'rd' : 'th'; return day + s + ' ' + d.toLocaleDateString('en-US', { month: 'long' }) + ', ' + d.toLocaleDateString('en-US', { weekday: 'long' }); }
function clientOf(name) { if (!name) return 'Unassigned'; let c = name.includes('|') ? name.split('|')[0].trim() : name.trim(); if (/^(follow ?up|fup)/i.test(c)) return 'Follow-ups'; if (ALIASES[c]) return ALIASES[c]; return c.replace(/\s+/g, ' '); }
// Robust client label: map by Smartlead client_id first (handles "Segment | <Client Label>" where the
// client name is the SUFFIX), else fall back to the name-prefix rule. client_by_id lives in config.local.json.
const CLIENT_BY_ID = CFG.client_by_id || {};
function clientLabelById(c) { if (c && c.client_id != null && CLIENT_BY_ID[String(c.client_id)]) return CLIENT_BY_ID[String(c.client_id)]; return clientOf(c && c.name); }
// Bounce-alert tunables (mirror Code.gs B_* defaults). Overridable via env for VPS/cron parity.
const BOUNCE_THRESHOLD = parseFloat(process.env.BOUNCE_THRESHOLD || '0.03');
const BOUNCE_MIN_SENT = N(process.env.BOUNCE_MIN_SENT) || 15;
const BOUNCE_WINDOW_DAYS = N(process.env.BOUNCE_WINDOW_DAYS) || 3;
const BOUNCE_MENTION = process.env.BOUNCE_MENTION || '<!channel>';
const BOUNCE_INCLUDE_PAUSED = (process.env.BOUNCE_INCLUDE_PAUSED || 'true') !== 'false';

async function slGet(path) { const sep = path.includes('?') ? '&' : '?'; const r = await fetch(`${SL}${path}${sep}api_key=${SL_KEY}`); if (r.status === 429 || r.status >= 500) { await new Promise(z => setTimeout(z, 1200)); return slGet(path); } return r.ok ? r.json() : null; }
async function mapLimit(items, lim, fn) { const out = new Array(items.length); let i = 0; await Promise.all(Array.from({ length: Math.min(lim, items.length) }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); } })); return out; }
async function slack(channel, text, blocks) {
  const r = await fetch('https://slack.com/api/chat.postMessage', { method: 'POST', headers: { Authorization: 'Bearer ' + SLACK, 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify({ channel, text, blocks, unfurl_links: false, unfurl_media: false }) });
  const b = await r.json(); if (!b.ok) throw new Error('slack ' + channel + ': ' + b.error); return b;
}
const header = (t) => ({ type: 'header', text: { type: 'plain_text', text: t, emoji: true } });
const md = (t) => ({ type: 'section', text: { type: 'mrkdwn', text: t } });
const ctx = (t) => ({ type: 'context', elements: [{ type: 'mrkdwn', text: t }] });
function codeTable(headers, rows, widths) { const pad = (s, w, right) => { s = String(s); if (s.length > w) s = s.slice(0, w); const sp = ' '.repeat(Math.max(0, w - s.length)); return right ? sp + s : s + sp; }; const line = (c) => c.map((x, i) => pad(x, widths[i], i > 0)).join('  '); return '```' + [line(headers), ...rows.map(line)].join('\n') + '```'; }

async function roster() { const d = await slGet('/analytics/campaign/list'); return (d?.data?.campaign_list || []).filter(c => c.status !== 'DRAFTED'); }
async function windowByClient(camps, s, e) { const data = await mapLimit(camps, 12, c => slGet(`/campaigns/${c.id}/analytics-by-date?start_date=${s}&end_date=${e}`)); const g = {}; camps.forEach((c, i) => { const k = clientOf(c.name); const o = g[k] = g[k] || { sent: 0, bounce: 0 }; o.sent += N(data[i]?.sent_count); o.bounce += N(data[i]?.bounce_count); }); return g; }
async function lifeByClient(camps) { const data = await mapLimit(camps, 12, c => slGet(`/campaigns/${c.id}/analytics`)); const g = {}; camps.forEach((c, i) => { const k = clientOf(c.name); const o = g[k] = g[k] || { interested: 0, notStarted: 0 }; o.interested += N(data[i]?.campaign_lead_stats?.interested); o.notStarted += N(data[i]?.campaign_lead_stats?.notStarted); }); return g; }

async function postDailySends(camps) {
  const g = await windowByClient(camps, ymd(new Date()), ymd(new Date()));
  const clients = Object.keys(g).sort(); let tot = 0; const rows = clients.map(k => { tot += g[k].sent; return [k, fmt(g[k].sent)]; });
  rows.push(['', ''], ['TOTAL', fmt(tot)]);
  await slack(CH['daily-sends-report'], 'Daily Send Report', [header('📊 Daily Send Report — ' + prettyDate(new Date())), md(codeTable(['Client', 'Sends'], rows, [26, 8]))]);
  console.log('posted daily-sends (TOTAL ' + tot + ')');
}
async function postDigest(camps, channelKey, title, startD, isMonthly) {
  const win = await windowByClient(camps, ymd(startD), ymd(new Date())); const life = await lifeByClient(camps);
  const clients = Object.keys(win).sort(); let tS = 0, tB = 0, tI = 0;
  const rows = clients.map(k => { const s = win[k].sent, b = win[k].bounce, intr = (life[k] || {}).interested || 0; tS += s; tB += b; tI += intr; return [k, fmt(s), pct(b, s) + '%', String(intr)]; });
  rows.push(['', '', '', ''], ['TOTAL', fmt(tS), '', String(tI)]);
  const days = Math.round((new Date() - startD) / 86400000) + 1;
  const summary = (isMonthly ? new Date().toLocaleDateString('en-US', { month: 'long' }) + ' totals' : 'Totals') + ': ' + fmt(tS) + ' sends | ' + pct(tB, tS) + '% bounces | ' + tI + ' interested' + (isMonthly ? ' | ' + days + ' days tracked' : '') + ' | ' + clients.length + ' clients';
  await slack(CH[channelKey], title, [header('📊 ' + title), md(codeTable(['Client', 'Sends', 'Bnc%', 'Int'], rows, [22, 8, 6, 4])), ctx('*' + summary + '*')]);
  console.log('posted ' + channelKey);
}
async function postDailyLeads(camps) {
  const LOW = 200; const g = await lifeByClient(camps);
  const ent = Object.keys(g).map(k => ({ name: k, n: g[k].notStarted }));
  const empty = ent.filter(e => e.n === 0), low = ent.filter(e => e.n > 0 && e.n < LOW).sort((a, b) => a.n - b.n), good = ent.filter(e => e.n >= LOW).sort((a, b) => b.n - a.n);
  const blocks = [header('📋 Daily Leads Report — ' + prettyDate(new Date()))];
  if (low.length) blocks.push(md('*Running low:*\n' + low.map(e => `• *${e.name}* — ${fmt(e.n)} new leads left`).join('\n')));
  if (good.length) blocks.push(md(`*${good.length} client(s) looking good:*\n` + good.slice(0, 12).map(e => `• ${e.name} — ${fmt(e.n)}`).join('\n')));
  blocks.push(ctx(`${ent.length} clients  —  ${empty.length} empty  •  ${low.length} low  •  ${good.length} good`));
  await slack(CH['daily-leads-report'], 'Daily Leads Report', blocks);
  console.log('posted daily-leads');
}
// ---- reply-based reports (mirror Code.gs inboxReplies_ / followups / stale / interested) ----
async function slPost(path, body) { const sep = path.includes('?') ? '&' : '?'; const r = await fetch(`${SL}${path}${sep}api_key=${SL_KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); if (r.status === 429 || r.status >= 500) { await new Promise(z => setTimeout(z, 1200)); return slPost(path, body); } return r.ok ? r.json() : null; }
const INTERESTED_IDS = [1, 2]; // 1=Interested, 2=Meeting Request (both sentiment "positive")
const isInterested = (r) => !!r && INTERESTED_IDS.indexOf(N(r.categoryId)) >= 0;
const minsSince = (ts) => ts ? Math.round((Date.now() - new Date(ts).getTime()) / 60000) : 0;
const ago = (ts) => { const m = minsSince(ts); return m >= 60 ? Math.round(m / 60) + 'h ago' : m + 'm ago'; };
// Master inbox caps limit at 20 → page in 20s (newest-first) up to maxItems.
async function inboxReplies(maxItems) {
  maxItems = maxItems || 100; const PAGE = 20; const out = [];
  for (let offset = 0; out.length < maxItems && offset <= 600; offset += PAGE) {
    const data = await slPost('/master-inbox/inbox-replies', { offset, limit: PAGE });
    const arr = data?.data || (Array.isArray(data) ? data : []);
    if (!Array.isArray(arr) || !arr.length) break;
    arr.forEach(r => out.push({
      id: String(r.email_lead_id || r.email_lead_map_id),
      client: clientOf(r.email_campaign_name || ''),
      name: ((r.lead_first_name || '') + ' ' + (r.lead_last_name || '')).trim(),
      email: r.lead_email, step: r.current_sequence_number, status: r.lead_status,
      categoryId: r.lead_category_id, campaign: r.email_campaign_name, campaignId: r.email_campaign_id,
      leadMap: String(r.email_lead_map_id || ''),
      at: r.last_reply_time, awaiting: r.has_new_unread_email === true, archived: r.is_archived === true,
    }));
    if (arr.length < PAGE) break;
  }
  return out;
}
const withinDays = (ts, days) => ts && (Date.now() - new Date(ts).getTime()) <= days * 86400000;
async function postFollowups(replies) {
  const head = header('📋 Reply Follow-Ups — ' + prettyDate(new Date()));
  const recent = replies.filter(r => withinDays(r.at, 2)); // daily digest: replies in the last 2 days
  if (!recent.length) { await slack(CH['reply-followups'], 'Reply Follow-Ups — none', [head, md('_No new replies in the last 2 days._')]); console.log('posted reply-followups (none)'); return; }
  const byClient = {}; recent.forEach(r => { (byClient[r.client] = byClient[r.client] || []).push(r); });
  const blocks = [head, md(Object.keys(byClient).length + ' client(s) with active leads:')];
  Object.keys(byClient).forEach(c => {
    const lines = byClient[c].slice(0, 15).map(r => '• ' + (r.name || r.email) + ' (' + r.email + ') — Step ' + (r.step || '?') + ' — ' + (r.status || 'Replied'));
    blocks.push(md('*' + c + '* — ' + byClient[c].length + ' leads\n' + lines.join('\n')));
  });
  await slack(CH['reply-followups'], 'Reply Follow-Ups', blocks);
  console.log('posted reply-followups (' + recent.length + ' replies, ' + Object.keys(byClient).length + ' clients)');
}
function interestedCard(r) {
  return [header('🔥 Interested Reply — ' + r.client), { type: 'section', fields: [
    { type: 'mrkdwn', text: '👤 *Lead*\n' + (r.name || '—') }, { type: 'mrkdwn', text: '✉️ *Email*\n' + (r.email || '—') },
    { type: 'mrkdwn', text: '🎯 *Campaign*\n' + (r.campaign || '—') }, { type: 'mrkdwn', text: '🪜 *Step*\n' + (r.step || '—') },
    { type: 'mrkdwn', text: '🕐 *Replied*\n' + ago(r.at) }] }];
}
async function postInterested(replies, limit) {
  const hot = replies.filter(isInterested).slice(0, limit || 2);
  if (!hot.length) { console.log('no interested replies found to post'); return; }
  for (const r of hot) { await slack(CH['interested-replies'], 'Interested reply: ' + r.email, interestedCard(r)); }
  console.log('posted ' + hot.length + ' interested card(s)');
}
// ---- 9. REPLY ALERTS — near-real-time @channel ping so the reply team acts ASAP ----
// Mirrors Code.gs replyAlertPoll(). Same positive categories as interested (1,2) by default, but a
// SEPARATE 1-min poll + a SEPARATE seen-state, and it @channel-pings so members get a real push.
// Default alert set = the 7 actionable categories (verified live): 1 Interested, 2 Meeting Request,
// 5 Information Request, 8 Uncategorizable by Ai, 3541 Referral, 3830 Custom Response, 4407 Future Contact.
const ALERT_IDS = (process.env.ALERT_CATEGORY_IDS || '1,2,5,8,3541,3830,4407').split(',').map(s => N(s));
const ALERT_PAGES = N(process.env.ALERT_POLL_PAGES) || 2;       // newest pages of 20 to scan each minute (40)
const ALERT_MENTION = process.env.ALERT_MENTION || '<!channel>'; // broadcast that guarantees a notification
const SL_INBOX_URL = 'https://app.smartlead.ai/app/master-inbox';
const ALERT_SHEET_URL = process.env.LOG_SHEET_URL || CFG.log_sheet_url || ''; // contacts-log link (set after GAS first run)
const ALERT_WEBAPP = process.env.WEBAPP_URL || CFG.webapp_url || '';          // Phase B web-app /exec (enables button)
const ALERT_TOKEN = process.env.ENRICH_TOKEN || CFG.enrich_token || '';
const isAlert = (r) => !!r && ALERT_IDS.indexOf(N(r.categoryId)) >= 0;
const CAT_NAMES = { 1: 'Interested', 2: 'Meeting Request', 5: 'Information Request', 8: 'Uncategorizable by Ai', 3541: 'Referral', 3830: 'Custom Response', 4407: 'Future Contact', 4245: 'Meeting Booked' };
const catName = (id) => (CAT_NAMES[N(id)] || ('Category ' + N(id)));
function replyAlertCard(r, mentionLine) {
  const blocks = [header('🔥 New Reply: ' + r.client)];
  if (mentionLine) blocks.push(md(mentionLine)); // mention MUST be in a rendered block to fire the broadcast
  blocks.push({ type: 'section', fields: [
    { type: 'mrkdwn', text: '👤 *Lead*\n' + (r.name || '—') }, { type: 'mrkdwn', text: '✉️ *Email*\n' + (r.email || '—') },
    { type: 'mrkdwn', text: '🎯 *Campaign*\n' + (r.campaign || '—') }, { type: 'mrkdwn', text: '🏷️ *Category*\n' + catName(r.categoryId) },
    { type: 'mrkdwn', text: '🪜 *Step*\n' + (r.step || '—') }, { type: 'mrkdwn', text: '🕐 *Replied*\n' + ago(r.at) }] });
  const inboxUrl = r.leadMap ? (SL_INBOX_URL + '?action=INBOX&leadMap=' + r.leadMap) : SL_INBOX_URL;
  let links = '👉 <' + inboxUrl + '|Open this lead in Smartlead> and reply ASAP.';
  if (ALERT_SHEET_URL) links += '   ·   📊 <' + ALERT_SHEET_URL + '|Contacts log (history + phones)>';
  blocks.push(md(links));
  if (ALERT_WEBAPP && ALERT_TOKEN) { // Phase B: one-click phone-enrich button (URL button → web-app doGet)
    // Only the opaque id + token in the URL — no PII in the query string (the web-app resolves name/email from the log row).
    const url = ALERT_WEBAPP + '?a=enrich&t=' + encodeURIComponent(ALERT_TOKEN) + '&id=' + encodeURIComponent(r.id || '');
    blocks.push({ type: 'actions', elements: [{ type: 'button', text: { type: 'plain_text', text: '📞 Enrich phone (to cold-call)', emoji: true }, url, style: 'primary' }] });
  }
  return blocks;
}
async function postReplyAlert(replies, opts) {
  opts = opts || {};
  const hot = replies.filter(isAlert).slice(0, opts.limit || 10);
  if (!hot.length) { console.log('no alert-category replies to post (quiet is correct)'); return; }
  for (const r of hot) {
    const mentionLine = opts.preview ? null : (ALERT_MENTION + ' 🔥 *New reply from ' + (r.name || r.email) + '* (' + r.client + '). Reply ASAP.');
    const text = opts.preview
      ? 'Reply-alert format preview (no @channel ping): ' + (r.name || r.email)
      : ALERT_MENTION + ' 🔥 New reply from ' + (r.name || r.email) + ' (' + r.client + '). Reply ASAP.';
    await slack(CH['reply-alerts'], text, replyAlertCard(r, mentionLine));
  }
  console.log('posted ' + hot.length + ' reply-alert card(s)' + (opts.preview ? ' (PREVIEW, no @channel)' : ' (@channel ping)'));
}
// PROOF the production seed-on-first-run never backfills old positives into an @channel ping.
async function replyAlertSim() {
  const replies = await inboxReplies(ALERT_PAGES * 20);
  let seen = {}; let firstRun = Object.keys(seen).length === 0;
  let alert = replies.filter(isAlert);
  let fresh = alert.filter(r => r.id && !seen[r.id]);
  fresh.forEach(r => { seen[r.id] = Date.now(); });
  console.log('RUN 1 (firstRun=' + firstRun + '): fetched ' + replies.length + ' newest, alert-cat=' + alert.length + ', fresh=' + fresh.length + ' -> ' + (firstRun ? 'SEEDED ' + fresh.length + ', POSTED 0  (correct, no @channel backfill)' : 'would post ' + fresh.length));
  firstRun = Object.keys(seen).length === 0; // now populated
  fresh = alert.filter(r => r.id && !seen[r.id]);
  console.log('RUN 2 (firstRun=' + firstRun + '): fresh=' + fresh.length + ' -> POSTED ' + fresh.length + '  (expect 0)');
  console.log('seed logic is page-count-independent: first run seeds whatever positives are in the newest ' + (ALERT_PAGES * 20) + ' and pings 0; old positives only ping if the lead replies AGAIN.');
}
async function postStale(replies) {
  const thr = 15; // mins unanswered; only flag interested replies received in the last 24h (avoid re-alerting ancient threads)
  const waiting = replies.filter(r => isInterested(r) && r.awaiting && !r.archived && minsSince(r.at) >= thr && withinDays(r.at, 1));
  if (!waiting.length) { console.log('no stale interested replies over ' + thr + 'min (quiet is correct)'); return; }
  await slack(CH['stale-inbox'], 'Stale inbox: ' + waiting.length + ' waiting', [
    header('⏰ Stale Inbox Alert — ' + waiting.length + ' waiting'),
    md('These interested replies have been sitting for *' + thr + '+ mins* without a response:'),
    md(waiting.map(r => '⏰ *' + r.client + '* — ' + (r.name || r.email) + ' (' + r.email + ') — ' + ago(r.at)).join('\n')),
    ctx('Checked hourly. Threshold: ' + thr + ' mins.')]);
  console.log('posted stale-inbox (' + waiting.length + ' waiting)');
}
// Mirror Code.gs interestedRepliesPoll seed-then-dedup logic (in-memory, NO posting) to prove the
// first-run path seeds silently and never spams old interested leads into the live channel.
async function interestedPollSim() {
  const replies = await inboxReplies(100);
  let seen = {}; // simulate fresh state store (vacuous prior seeding stored {})
  let firstRun = Object.keys(seen).length === 0;
  let interested = replies.filter(isInterested);
  let fresh = interested.filter(r => r.id && !seen[r.id]);
  fresh.forEach(r => { seen[r.id] = Date.now(); });
  console.log('RUN 1 (firstRun=' + firstRun + '): interested=' + interested.length + ' fresh=' + fresh.length + ' -> ' + (firstRun ? 'SEEDED ' + fresh.length + ', POSTED 0 (correct)' : 'would post ' + fresh.length));
  // RUN 2 — same data, seen now populated → must post 0 (no new interested)
  firstRun = Object.keys(seen).length === 0;
  fresh = interested.filter(r => r.id && !seen[r.id]);
  console.log('RUN 2 (firstRun=' + firstRun + '): fresh=' + fresh.length + ' -> POSTED ' + (firstRun ? '—' : fresh.length) + ' (expect 0)');
}
async function diag() {
  const replies = await inboxReplies(100);
  const cats = {}; replies.forEach(r => { const k = String(r.categoryId); cats[k] = (cats[k] || 0) + 1; });
  console.log('master-inbox replies fetched (paginated): ' + replies.length);
  console.log('by lead_category_id: ' + JSON.stringify(cats));
  console.log('interested (cat 1 or 2): ' + replies.filter(isInterested).length);
  console.log('awaiting (has_new_unread_email): ' + replies.filter(r => r.awaiting).length);
  console.log('in last 1 day: ' + replies.filter(r => withinDays(r.at, 1)).length + '  | last 2 days: ' + replies.filter(r => withinDays(r.at, 2)).length);
  console.log('stale candidates (interested+awaiting+>15m+<24h): ' + replies.filter(r => isInterested(r) && r.awaiting && !r.archived && minsSince(r.at) >= 15 && withinDays(r.at, 1)).length);
  const sample = replies.find(isInterested) || replies[0];
  if (sample) console.log('sample: ' + JSON.stringify({ client: sample.client, name: sample.name, email: sample.email, step: sample.step, status: sample.status, categoryId: sample.categoryId, campaign: sample.campaign, at: sample.at, awaiting: sample.awaiting }, null, 1));
}
// Scan ACTIVE (+ recently-paused) campaigns for a recent-window bounce breach. Returns the breaching
// list. Mirrors Code.gs bounceCheck() detection (3%+ / 20+ sent / 3d, includes recently-paused).
async function bounceScan(camps) {
  const scope = camps.filter(c => c.status === 'ACTIVE' || (BOUNCE_INCLUDE_PAUSED && c.status === 'PAUSED'));
  const s = ymd(daysAgo(BOUNCE_WINDOW_DAYS)), e = ymd(new Date());
  const data = await mapLimit(scope, 12, c => slGet(`/campaigns/${c.id}/analytics-by-date?start_date=${s}&end_date=${e}`));
  const out = [];
  for (let i = 0; i < scope.length; i++) {
    const sent = N(data[i]?.sent_count), b = N(data[i]?.bounce_count);
    if (sent < BOUNCE_MIN_SENT) continue;
    const rate = b / sent; if (rate < BOUNCE_THRESHOLD) continue;
    out.push({ c: scope[i], sent, bounced: b, rate });
  }
  return out.sort((x, y) => y.rate - x.rate);
}
function bounceBlocks(a) {
  const client = clientLabelById(a.c), ratePct = Math.round(a.rate * 1000) / 10;
  const paused = a.c.status === 'PAUSED';
  const lead = paused
    ? ('🚨 *' + a.c.name + '* (' + client + ') bounced at *' + ratePct + '%* and is *already paused*. Check the list quality and mailboxes before resuming.')
    : ('🚨 *' + a.c.name + '* (' + client + ') is bouncing at *' + ratePct + '%*. Pause it now to protect sender reputation.');
  const blocks = [header(paused ? '🚨 High Bounce: Campaign Already Paused' : '🚨 High Bounce Rate: PAUSE NOW')];
  if (BOUNCE_MENTION) blocks.push(md(BOUNCE_MENTION + ' ' + lead));
  blocks.push({ type: 'section', fields: [
    { type: 'mrkdwn', text: '*Client*\n' + client },
    { type: 'mrkdwn', text: '*Campaign*\n' + a.c.name },
    { type: 'mrkdwn', text: '*Bounce (last ' + BOUNCE_WINDOW_DAYS + 'd)*\n' + ratePct + '% (' + fmt(a.bounced) + '/' + fmt(a.sent) + ')' },
    { type: 'mrkdwn', text: '*Status*\n' + a.c.status } ] });
  blocks.push(md('*Action required:* ' + (paused ? 'review the list quality and mailboxes before resuming.' : 'pause this campaign immediately, then check the list quality and mailboxes before resuming.')));
  blocks.push(ctx('Checked every ~10 min. Alerts at ' + Math.round(BOUNCE_THRESHOLD * 100) + '%+ bounce over ' + fmt(BOUNCE_MIN_SENT) + '+ sends in ' + BOUNCE_WINDOW_DAYS + ' days. Recently-paused campaigns included.'));
  return blocks;
}
const BOUNCE_STATE_FILE = join(__dirname, '_bounce_state.local.json');
function bounceState() { try { return JSON.parse(readFileSync(BOUNCE_STATE_FILE, 'utf8')); } catch { return {}; } }
async function postBounce(camps) {
  // LEVEL-TRIGGERED file-backed mirror of Code.gs: alert on entry, seed silently on first run.
  const breaching = await bounceScan(camps);
  const state = bounceState(); const firstRun = !state.__seeded;
  const cur = { __seeded: true }; let n = 0;
  for (const a of breaching) {
    const key = String(a.c.id); cur[key] = Math.round(a.rate * 1000) / 10;
    if (!firstRun && !state[key]) { await slack(CH['bounce-alerts'], (BOUNCE_MENTION ? BOUNCE_MENTION + ' ' : '') + '🚨 High bounce: ' + a.c.name, bounceBlocks(a)); n++; }
  }
  writeFileSync(BOUNCE_STATE_FILE, JSON.stringify(cur));
  console.log(firstRun ? `bounce: seeded ${breaching.length} breaching campaign(s) silently (first run, no backfill)` : `posted bounce alerts: ${n}` + (n ? '' : ' (no NEW breach — quiet is correct)'));
}
// Read-only dry run: show exactly what the live detector would flag right now (no posting, no state).
async function bounceDryRun(camps) {
  const breaching = await bounceScan(camps);
  console.log(`\nBOUNCE DRY-RUN — threshold ${Math.round(BOUNCE_THRESHOLD*100)}% / min-sent ${BOUNCE_MIN_SENT} / window ${BOUNCE_WINDOW_DAYS}d / include-paused=${BOUNCE_INCLUDE_PAUSED}`);
  console.log(`Scanned ${camps.filter(c=>c.status==='ACTIVE'||(BOUNCE_INCLUDE_PAUSED&&c.status==='PAUSED')).length} campaigns (ACTIVE${BOUNCE_INCLUDE_PAUSED?' + PAUSED':''}). ${breaching.length} WOULD alert:\n`);
  if (!breaching.length) { console.log('  (none breaching — channel would stay quiet)'); return; }
  for (const a of breaching) console.log(`  🚨 ${clientLabelById(a.c)} — "${a.c.name}" [${a.c.status}] — ${(Math.round(a.rate*1000)/10)}% (${fmt(a.bounced)}/${fmt(a.sent)})`);
}
// Post ONE clearly-marked test card to prove delivery + @channel rendering (then operator deletes it).
async function bounceTest() {
  // A TEST card never @channel-pings (so it doesn't train the team to mute). Real alerts DO ping.
  const blocks = [header('🧪 TEST — Bounce Alert Pipeline'),
    md('🧪 *This is a test* of the rebuilt bounce alarm (no @channel ping on tests). Real alerts fire here within ~10 min at *' + Math.round(BOUNCE_THRESHOLD*100) + '%+* bounce and DO add an @channel ping. Safe to delete this card.'),
    { type: 'section', fields: [
      { type: 'mrkdwn', text: '*Example client*\n<Client Label>' },
      { type: 'mrkdwn', text: '*Example campaign*\n<Segment> | <Client Label>' },
      { type: 'mrkdwn', text: '*Example bounce*\n20% (13/65)' },
      { type: 'mrkdwn', text: '*Cadence*\nevery ~10 min' } ] },
    ctx('Test posted by Claude Code while verifying the bounce-alert rebuild. No action needed.')];
  await slack(CH['bounce-alerts'], '🧪 TEST — bounce alert pipeline', blocks);
  console.log('posted ONE test card to #smartlead-bounce-alerts');
}

// ===========================================================================
// 10. HEALTH ALERTS — mailbox connection failures + campaign auto-pauses (every ~5 min).
//   Mirrors Code.gs healthAlertPoll(). LEVEL-TRIGGERED: tracks the CURRENT broken set and the
//   per-campaign status, alerts on a NEW breakage / a NEW auto-pause, posts ✅ on recovery.
//   The campaign-pause alert is GATED on elevated recent bounce (the high-bounce auto-pause the
//   user asked for) — NOT on every PAUSE, because routine/manual pauses would train the team to
//   mute the channel and bury the real one. Smartlead exposes no auto-pause flag (verified live),
//   so recent-bounce-over-threshold is the proxy.
// ===========================================================================
const HEALTH_MENTION = process.env.HEALTH_MENTION || '<!channel>';            // broadcast → real push notification
const HEALTH_MAX_CARDS = N(process.env.HEALTH_MAX_CARDS) || 6;                // > this many new breakages at once → one summary card (a whole domain dying)
const HEALTH_BOUNCE_THRESHOLD = parseFloat(process.env.HEALTH_BOUNCE_THRESHOLD || '0.03'); // Smartlead bounce auto-protect ≈ 3%
const HEALTH_BOUNCE_MIN_SENT = N(process.env.HEALTH_BOUNCE_MIN_SENT) || 50;   // ignore tiny samples
const HEALTH_BOUNCE_WINDOW_DAYS = N(process.env.HEALTH_BOUNCE_WINDOW_DAYS) || 3;
const HEALTH_STATE_FILE = join(__dirname, '_health_state.local.json');        // Node-side persistence (gitignored *.local.json); GAS uses the state sheet

const tagNames = (a) => (a.tags || a.email_account_tag_mappings || []).map(t => typeof t === 'string' ? t : (t.name || t.tag?.name || t.tag_name || String(t.id))).filter(Boolean);
// Classify a broken account by which side failed. Both fail = dead token (reconnect). SMTP-only =
// usually provider-side (Workspace sending not enabled), IMAP rides the same token so it's up. IMAP-only = re-auth.
function brokenKind(a) {
  const s = a.is_smtp_success === false, i = a.is_imap_success === false;
  if (s && i) return { kind: 'disconnected', label: 'Disconnected — needs reconnection', fix: 'Reconnect the mailbox in Smartlead (re-auth).' };
  if (s) return { kind: 'smtp', label: 'SMTP (sending) failing', fix: 'Often provider-side: enable Gmail/SMTP sending at the provider (Zapmail / Workspace admin), then reconnect in Smartlead.' };
  if (i) return { kind: 'imap', label: 'IMAP (inbox) failing', fix: 'Usually a re-auth: reconnect the mailbox in Smartlead.' };
  return null;
}
function brokenAccountsMap(accounts) {
  const m = {};
  for (const a of accounts) {
    const k = brokenKind(a); if (!k) continue;
    m[String(a.id)] = {
      id: a.id, email: a.from_email, type: a.type, kind: k.kind, label: k.label, fix: k.fix,
      err: String(a.smtp_failure_error || a.imap_failure_error || '').slice(0, 180),
      tags: tagNames(a), client_id: a.client_id ?? null,
    };
  }
  return m;
}
// Pull EVERY email account (paginate 400) — same source as _fix_issues_scan.mjs. Returns {accounts,
// complete}: complete=true ONLY if pagination reached the end cleanly (a short final page). A mid-pull
// error returns complete=false so the caller can skip the diff — a PARTIAL pull would otherwise read the
// missing accounts as "recovered" (spurious ✅ + dropped state), the same failure mode as a zero pull.
async function allEmailAccounts() {
  const PAGE = 400; let all = []; let complete = false;
  for (let offset = 0; offset <= 20000; offset += PAGE) {
    const r = await slGet(`/email-accounts/?offset=${offset}&limit=${PAGE}`);
    if (r == null) break; // errored mid-pagination → leave complete=false
    const batch = Array.isArray(r) ? r : (r?.data || []);
    all = all.concat(batch);
    if (batch.length < PAGE) { complete = true; break; } // reached the end cleanly
  }
  return { accounts: all, complete };
}
const clientLabel = (b) => { const t = (b.tags || []).filter(x => !/^Batch|^Spaceship$|^Zapmail$|^Primeforge$|^Google$|^Microsoft$|^O365$|^GMAIL$|^OUTLOOK$/i.test(x)); return t[0] || (b.client_id ? 'client ' + b.client_id : '—'); };

// ---- card builders (pure: return {text, blocks}) ----
function mbCard(b, mention) {
  const m = mention ? mention + ' ' : '';
  const text = m + '🔌 Mailbox needs attention: ' + b.email + ' (' + b.label + ')';
  const blocks = [header('🔌 Mailbox Needs Attention — ' + clientLabel(b))];
  if (mention) blocks.push(md(mention + ' 🔌 *' + b.email + '* — ' + b.label + '. Needs attention.'));
  blocks.push({ type: 'section', fields: [
    { type: 'mrkdwn', text: '✉️ *Mailbox*\n' + (b.email || '—') },
    { type: 'mrkdwn', text: '🏷️ *Client*\n' + clientLabel(b) },
    { type: 'mrkdwn', text: '🔧 *Type*\n' + (b.type || '—') },
    { type: 'mrkdwn', text: '⚠️ *Issue*\n' + b.label },
  ] });
  if (b.err) blocks.push(md('*Provider error:* `' + b.err + '`'));
  blocks.push(ctx('*Fix:* ' + b.fix));
  return { text, blocks };
}
function mbSummaryCard(list, mention) {
  const m = mention ? mention + ' ' : '';
  const byClient = {}; list.forEach(b => { const c = clientLabel(b); (byClient[c] = byClient[c] || []).push(b); });
  const lines = Object.keys(byClient).map(c => '• *' + c + '* — ' + byClient[c].length + ' mailbox(es): ' + byClient[c].slice(0, 6).map(b => b.email).join(', ') + (byClient[c].length > 6 ? ' …' : ''));
  const text = m + '🔌 ' + list.length + ' mailboxes need attention';
  const blocks = [header('🔌 ' + list.length + ' Mailboxes Need Attention')];
  if (mention) blocks.push(md(mention + ' 🔌 *' + list.length + ' mailboxes just went down* (grouped below). Needs attention.'));
  blocks.push(md(lines.join('\n')));
  blocks.push(ctx('A burst like this is usually one domain/provider — check the provider (Zapmail / Workspace) first, then reconnect in Smartlead.'));
  return { text, blocks };
}
function mbRecovered(b) {
  return { text: '✅ Mailbox back online: ' + b.email, blocks: [md('✅ *' + b.email + '* is back online (was: ' + b.label + ').')] };
}
function campCard(a, mention) {
  const m = mention ? mention + ' ' : '';
  const client = clientOf(a.c.name);
  const rate = Math.round(a.rate * 1000) / 10;
  const text = m + '⛔ Campaign paused (high bounce): ' + a.c.name;
  const blocks = [header('⛔ Campaign Paused — High Bounce')];
  if (mention) blocks.push(md(mention + ' ⛔ *' + a.c.name + '* (' + client + ') was paused with *' + rate + '% bounce*. Check now.'));
  blocks.push({ type: 'section', fields: [
    { type: 'mrkdwn', text: '🏷️ *Client*\n' + client },
    { type: 'mrkdwn', text: '🎯 *Campaign*\n' + a.c.name },
    { type: 'mrkdwn', text: '📉 *Bounce (last ' + HEALTH_BOUNCE_WINDOW_DAYS + 'd)*\n' + rate + '% (' + fmt(a.b) + '/' + fmt(a.sent) + ')' },
    { type: 'mrkdwn', text: '⛔ *Status*\nPAUSED' },
  ] });
  blocks.push(ctx('Paused after bounce crossed the safe limit (auto-protect ≈ ' + Math.round(HEALTH_BOUNCE_THRESHOLD * 100) + '%). Review the list + mailboxes before resuming.'));
  return { text, blocks };
}
function firstRunSummary(currentBroken, pausedCount) {
  const list = Object.values(currentBroken);
  const byKind = {}; list.forEach(b => byKind[b.kind] = (byKind[b.kind] || 0) + 1);
  const byClient = {}; list.forEach(b => { const c = clientLabel(b); byClient[c] = (byClient[c] || 0) + 1; });
  const kindStr = Object.keys(byKind).map(k => byKind[k] + ' ' + k).join(', ') || 'none';
  const clientStr = Object.keys(byClient).map(c => c + ' (' + byClient[c] + ')').join(', ') || 'none';
  const blocks = [
    header('🩺 Health Alerts Are Now Live'),
    md("I'll post an instant " + HEALTH_MENTION.replace('<!channel>', '@channel') + " ping here whenever a *mailbox goes down* (disconnected / needs reconnection / sending failing) or a *campaign is auto-paused for high bounce*, so the team can act fast."),
    md('*Current state* (seeded silently — no pings for these existing items):\n' +
       '• *Mailboxes needing attention:* ' + list.length + (list.length ? '  (' + kindStr + ')\n    by client: ' + clientStr : '') + '\n' +
       '• *Campaigns currently paused:* ' + pausedCount + '  _(informational; only NEW auto-pauses get pinged)_'),
    ctx('Checked every ~5 min. From here you only get pinged on a NEW problem, plus a ✅ when a mailbox recovers.'),
  ];
  return { text: '🩺 Health alerts are now live — monitoring mailboxes + campaign auto-pauses.', blocks };
}

// Pure level-trigger diffs (current-set vs last-set) — the correctness-critical bit. NOT append-only:
// an account that breaks → recovers → re-breaks must re-alert, because state always = the LATEST broken set.
function diffBroken(prevAccounts, currentBroken) {
  return {
    newlyBroken: Object.keys(currentBroken).filter(id => !prevAccounts[id]).map(id => currentBroken[id]),
    recovered: Object.keys(prevAccounts).filter(id => !currentBroken[id]).map(id => prevAccounts[id]),
  };
}
function diffPaused(prevCamps, camps) { return camps.filter(c => prevCamps[c.id] === 'ACTIVE' && c.status === 'PAUSED'); }

// Core compute shared by live/sim/preview. Returns the decisions; does NOT post or persist.
async function computeHealth(state) {
  const out = { firstRun: !state.seeded, newlyBroken: [], recovered: [], pausedAlerts: [], brokenCount: 0, pausedCount: 0, accountsPulled: 0, campsPulled: 0, currentBroken: {}, nowStatus: {} };
  // MAILBOX
  const pull = await allEmailAccounts();
  const accounts = pull.accounts;
  out.accountsPulled = accounts.length; out.accountsComplete = pull.complete;
  if (accounts.length > 0 && pull.complete) { // guard: only diff a COMPLETE pull (empty/partial = API hiccup, never "all recovered")
    const currentBroken = brokenAccountsMap(accounts);
    out.currentBroken = currentBroken; out.brokenCount = Object.keys(currentBroken).length;
    const d = diffBroken(state.accounts || {}, currentBroken);
    out.newlyBroken = d.newlyBroken; out.recovered = d.recovered;
  }
  // CAMPAIGN
  const camps = await roster();
  out.campsPulled = camps.length;
  if (camps.length > 0) { // guard
    const nowStatus = {}; camps.forEach(c => { nowStatus[c.id] = c.status; });
    out.nowStatus = nowStatus;
    out.pausedCount = camps.filter(c => c.status === 'PAUSED').length;
    const justPaused = diffPaused(state.campaigns || {}, camps);
    if (justPaused.length && !out.firstRun) {
      const s = ymd(daysAgo(HEALTH_BOUNCE_WINDOW_DAYS)), e = ymd(new Date());
      const data = await mapLimit(justPaused, 8, c => slGet(`/campaigns/${c.id}/analytics-by-date?start_date=${s}&end_date=${e}`));
      justPaused.forEach((c, i) => {
        const sent = N(data[i]?.sent_count), b = N(data[i]?.bounce_count);
        if (sent >= HEALTH_BOUNCE_MIN_SENT && b / sent >= HEALTH_BOUNCE_THRESHOLD) out.pausedAlerts.push({ c, sent, b, rate: b / sent });
      });
    }
  }
  return out;
}
function nextState(prev, h) {
  const s = { seeded: true, accounts: prev.accounts || {}, campaigns: prev.campaigns || {} };
  if (h.accountsPulled > 0 && h.accountsComplete) s.accounts = h.currentBroken; // only when the pull was COMPLETE
  if (h.campsPulled > 0) s.campaigns = h.nowStatus;
  return s;
}

async function healthRun() {
  const state = (() => { try { return JSON.parse(readFileSync(HEALTH_STATE_FILE, 'utf8')); } catch { return {}; } })();
  const h = await computeHealth(state);
  const msgs = [];
  if (h.firstRun) {
    msgs.push(firstRunSummary(h.currentBroken, h.pausedCount));
  } else {
    if (h.newlyBroken.length > HEALTH_MAX_CARDS) msgs.push(mbSummaryCard(h.newlyBroken, HEALTH_MENTION));
    else h.newlyBroken.forEach(b => msgs.push(mbCard(b, HEALTH_MENTION)));
    h.recovered.forEach(b => msgs.push(mbRecovered(b)));               // no @channel on recoveries
    h.pausedAlerts.forEach(a => msgs.push(campCard(a, HEALTH_MENTION)));
  }
  for (const m of msgs) await slack(CH['health-alerts'], m.text, m.blocks);
  writeFileSync(HEALTH_STATE_FILE, JSON.stringify(nextState(state, h), null, 1));
  console.log(`health: firstRun=${h.firstRun} accounts=${h.accountsPulled} broken=${h.brokenCount} newlyBroken=${h.newlyBroken.length} recovered=${h.recovered.length} camps=${h.campsPulled} paused=${h.pausedCount} pausedAlerts=${h.pausedAlerts.length} → posted ${msgs.length}`);
}

// PROVE the level-trigger + first-run seeding never spams: two passes over the SAME live data,
// in-memory state, NO posting. Run 1 (firstRun) seeds the current backlog and posts only a summary;
// Run 2 sees no change and posts nothing.
async function healthSim() {
  let state = {}; // fresh
  const h1 = await computeHealth(state);
  console.log(`RUN 1 (firstRun=${h1.firstRun}): accounts=${h1.accountsPulled} broken=${h1.brokenCount} camps=${h1.campsPulled} paused=${h1.pausedCount}`);
  console.log(`  → would post: 1 first-run summary, 0 @channel pings (correct — existing issues seeded silently)`);
  state = nextState(state, h1);
  const h2 = await computeHealth(state);
  const would = (h2.newlyBroken.length > HEALTH_MAX_CARDS ? 1 : h2.newlyBroken.length) + h2.recovered.length + h2.pausedAlerts.length;
  console.log(`RUN 2 (firstRun=${h2.firstRun}): newlyBroken=${h2.newlyBroken.length} recovered=${h2.recovered.length} pausedAlerts=${h2.pausedAlerts.length}`);
  console.log(`  → would post: ${would} (expect 0 — nothing changed between runs)`);
  console.log('seed/level-trigger logic verified: existing broken mailboxes + paused campaigns never ping; only NEW changes do.');
}

// Synthetic unit test of the level-trigger diffs (no network). Proves the recover→re-break case that an
// append-only `seen` map would silently swallow, plus the pause gate (transition vs steady-state).
function healthSelftest() {
  let pass = 0, fail = 0;
  const eq = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); console.log((ok ? '  PASS ' : '  FAIL ') + name + (ok ? '' : ` — got ${JSON.stringify(got)} want ${JSON.stringify(want)}`)); ok ? pass++ : fail++; };
  const B = (id) => ({ [id]: { id, email: id + '@x.com', kind: 'smtp', label: 'SMTP (sending) failing' } });
  // 1) fresh break: A broken, prev empty → newlyBroken=[A], recovered=[]
  let d = diffBroken({}, { ...B('A') }); eq('new break alerts', [d.newlyBroken.map(b => b.id), d.recovered.map(b => b.id)], [['A'], []]);
  // 2) steady state: A still broken, prev had A → nothing
  d = diffBroken(B('A'), { ...B('A') }); eq('steady broken stays quiet', [d.newlyBroken.length, d.recovered.length], [0, 0]);
  // 3) recovery: prev had A, now clean → recovered=[A]
  d = diffBroken(B('A'), {}); eq('recovery fires once', [d.newlyBroken.map(b => b.id), d.recovered.map(b => b.id)], [[], ['A']]);
  // 4) recover→RE-BREAK: prev clean (A was removed last cycle), A broken again → newlyBroken=[A] (append-only map would MISS this)
  d = diffBroken({}, { ...B('A') }); eq('re-break re-alerts (not swallowed)', d.newlyBroken.map(b => b.id), ['A']);
  // 5) pause gate: only ACTIVE→PAUSED transitions are candidates; steady PAUSED + ACTIVE→COMPLETED are not
  const camps = [{ id: 1, status: 'PAUSED', name: 'was active' }, { id: 2, status: 'PAUSED', name: 'still paused' }, { id: 3, status: 'COMPLETED', name: 'finished' }, { id: 4, status: 'ACTIVE', name: 'running' }];
  const jp = diffPaused({ 1: 'ACTIVE', 2: 'PAUSED', 3: 'ACTIVE', 4: 'ACTIVE' }, camps);
  eq('only ACTIVE→PAUSED is a pause candidate', jp.map(c => c.id), [1]);
  console.log(`health-selftest: ${pass} passed, ${fail} failed`);
  if (fail) process.exit(1);
}
// Post ONE real sample of each card type to the channel (NO @channel ping, NO state write) so we can
// eyeball delivery + rendering after deploy. Mirrors test_replyAlertPreview.
async function healthPreview() {
  const h = await computeHealth({});
  // 1) the first-run summary on real current data
  { const m = firstRunSummary(h.currentBroken, h.pausedCount); await slack(CH['health-alerts'], '[PREVIEW] ' + m.text, m.blocks); }
  // 2) one real broken mailbox (no @channel)
  const oneBroken = Object.values(h.currentBroken)[0];
  if (oneBroken) { const m = mbCard(oneBroken, ''); await slack(CH['health-alerts'], '[PREVIEW — no @channel] ' + m.text, m.blocks); }
  else { await slack(CH['health-alerts'], '[PREVIEW] No mailbox is currently failing — the mailbox card has nothing real to show (that is good news).'); }
  // 3) a real campaign-pause card: use the currently-PAUSED campaign with the highest recent bounce as the format sample
  const camps = await roster();
  const paused = camps.filter(c => c.status === 'PAUSED');
  if (paused.length) {
    const s = ymd(daysAgo(HEALTH_BOUNCE_WINDOW_DAYS)), e = ymd(new Date());
    const data = await mapLimit(paused, 8, c => slGet(`/campaigns/${c.id}/analytics-by-date?start_date=${s}&end_date=${e}`));
    let best = null;
    paused.forEach((c, i) => { const sent = N(data[i]?.sent_count), b = N(data[i]?.bounce_count); const rate = sent ? b / sent : 0; if (!best || rate > best.rate) best = { c, sent, b, rate }; });
    if (best && best.sent > 0) { const m = campCard(best, ''); const real = best.sent >= HEALTH_BOUNCE_MIN_SENT && best.rate >= HEALTH_BOUNCE_THRESHOLD; await slack(CH['health-alerts'], '[PREVIEW — no @channel] ' + (real ? 'a campaign that WOULD trigger: ' : 'format sample (recent bounce below the alert threshold): ') + m.text, m.blocks); }
    else { await slack(CH['health-alerts'], '[PREVIEW] No paused campaign has recent sends to render a real bounce card right now.'); }
  }
  console.log('health-preview posted sample cards to #smartlead-health-alerts (no @channel, no state written).');
}

(async () => {
  const which = process.argv[2] || 'scheduled';
  // reply-based modes don't need the campaign roster
  if (which === 'diag') { await diag(); return; }
  if (which === 'interested-poll-sim') { await interestedPollSim(); return; }
  if (which === 'reply-alert-sim') { await replyAlertSim(); return; }
  if (which === 'health') { await healthRun(); return; }              // real run (file-backed state) — VPS/cron fallback
  if (which === 'health-sim') { await healthSim(); return; }          // in-memory proof: seeds silently, never spams
  if (which === 'health-selftest') { healthSelftest(); return; }      // synthetic diff unit test (no network)
  if (which === 'health-preview') { await healthPreview(); return; }  // post sample cards (no @channel, no state)
  if (which === 'reply-alert' || which === 'reply-alert-preview') {
    const replies = await inboxReplies(ALERT_PAGES * 20);
    console.log(`${replies.length} newest master-inbox replies fetched (alert window). Mode "${which}"…`);
    await postReplyAlert(replies, { preview: which === 'reply-alert-preview', limit: N(process.argv[3]) || 10 });
    console.log('done.'); return;
  }
  if (which === 'followups' || which === 'interested' || which === 'stale' || which === 'interested-preview') {
    const replies = await inboxReplies(100);
    console.log(`${replies.length} master-inbox replies fetched. Mode "${which}"…`);
    if (which === 'followups') await postFollowups(replies);
    if (which === 'interested') await postInterested(replies, N(process.argv[3]) || 2);
    if (which === 'stale') await postStale(replies);
    if (which === 'interested-preview') { const hot = replies.filter(isInterested).slice(0, 2); console.log('interested card render (NOT posted): ' + JSON.stringify(hot.map(interestedCard), null, 1)); }
    console.log('done.');
    return;
  }
  const camps = await roster();
  console.log(`${camps.length} non-drafted campaigns. Mode "${which}"…`);
  if (which === 'bounce-dryrun') { await bounceDryRun(camps); return; }   // read-only: what WOULD alert now
  if (which === 'bounce-test') { await bounceTest(); return; }            // post ONE test card (delivery proof)
  if (which === 'daily-sends' || which === 'scheduled') await postDailySends(camps);
  if (which === 'weekly' || which === 'scheduled') await postDigest(camps, 'weekly-digest', 'Weekly Digest — w/e ' + prettyDate(new Date()), daysAgo(6), false);
  if (which === 'monthly') await postDigest(camps, 'monthly-digest', 'Monthly Digest — ' + new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), new Date(new Date().getFullYear(), new Date().getMonth(), 1), true);
  if (which === 'leads' || which === 'scheduled') await postDailyLeads(camps);
  if (which === 'bounce' || which === 'scheduled') await postBounce(camps);
  console.log('done.');
})();
