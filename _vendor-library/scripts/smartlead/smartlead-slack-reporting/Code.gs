/**
 * Smartlead → Slack Reporting  (the upstream workspace)
 * Mirrors the EmailBison "bison-*" Slack reports, driven by Smartlead. Runs in Google Apps Script
 * (time-driven triggers = always-on, laptop-independent). A doPost web-app endpoint receives
 * Smartlead webhooks for the real-time interested-reply card.
 *
 * DATA MODEL (validated against live Smartlead 2026-06-15):
 *   - the upstream workspace Smartlead campaigns are NOT tagged to client records (client_id = null).
 *   - The client is the campaign-name PREFIX before "|"  (e.g. "Callvu | US All-roles..." -> Callvu).
 *   - Per-campaign windowed stats: GET /campaigns/{id}/analytics-by-date?start_date&end_date
 *       -> sent_count, bounce_count, reply_count
 *   - Per-campaign lifetime stats:  GET /campaigns/{id}/analytics
 *       -> sent_count, bounce_count, campaign_lead_stats.{interested, notStarted, total}
 *   - Roster: GET /analytics/campaign/list -> [{id,name,status,...}]  (filter out DRAFTED)
 *
 * Reports (mirror of the 8 bison-* channels):
 *   1 dailySendsReport()     -> smartlead-daily-sends-report   (daily 08:00)
 *   2 dailyLeadsReport()     -> smartlead-daily-leads-report   (daily 08:00)
 *   3 weeklyDigest()         -> smartlead-weekly-digest        (Sat 08:00)
 *   4 monthlyDigest()        -> smartlead-monthly-digest       (1st 08:00)
 *   5 bounceCheck()          -> smartlead-bounce-alerts        (every ~10 min, @channel; level-triggered 3%+ / 20+ sent / 3d, incl. recently-paused)
 *   6 replyFollowupsReport() -> smartlead-reply-followups      (daily 08:00)
 *   7 staleInboxCheck()      -> smartlead-stale-inbox          (hourly)
 *   8 interestedRepliesPoll()-> smartlead-interested-replies    (every 10 min, master-inbox poll, calm log)
 *   9 replyAlertPoll()        -> smartlead-reply-alerts          (every 1 min, @channel ping; 7 actionable categories)
 *     phoneJobPoll()          (every 1 min) finishes one-click BetterContact phone enrich -> log sheet + channel
 *  10 healthAlertPoll()       -> smartlead-health-alerts         (every 5 min, @channel; mailbox down/needs-reconnect + campaign auto-paused for high bounce)
 *
 * CONFIG — Project Settings -> Script Properties (NEVER hardcode secrets):
 *   SMARTLEAD_API_KEY, SLACK_BOT_TOKEN, STATE_SHEET_ID, CHANNELS_JSON
 *   (optional, report 5) BOUNCE_THRESHOLD=0.03  BOUNCE_MIN_SENT=15  BOUNCE_WINDOW_DAYS=3  BOUNCE_MENTION=<!channel>  BOUNCE_INCLUDE_PAUSED=true  CLIENT_BY_ID_JSON={"<smartlead-client-id>":"<Client Label>",...}
 *   (optional) LEADS_LOW=200  STALE_THRESHOLD_MIN=15  TZ=Europe/Helsinki
 *   (optional) ALERT_CATEGORY_IDS=1,2,5,8,3541,3830,4407  ALERT_POLL_PAGES=2  ALERT_MENTION=<!channel>  (report 9)
 *   (optional, report 10) HEALTH_MENTION=<!channel>  HEALTH_MAX_CARDS=6  HEALTH_BOUNCE_THRESHOLD=0.03  HEALTH_BOUNCE_MIN_SENT=50  HEALTH_BOUNCE_WINDOW_DAYS=3
 *   (report 9 phone-enrich, Phase B) WEBAPP_URL  ENRICH_TOKEN  BETTERCONTACT_API_KEY  (LOG_SHEET_ID/LOG_SHEET_URL auto-set)
 *
 * WEB APP: doGet() serves the one-click phone-enrich link (deploy as Web app, execute as me, access Anyone).
 */

var SMARTLEAD_API = 'https://server.smartlead.ai/api/v1';
var SLACK_API = 'https://slack.com/api';

function CFG_(k, d) { var v = PropertiesService.getScriptProperties().getProperty(k); return (v == null || v === '') ? d : v; }
function SL_KEY_() { return CFG_('SMARTLEAD_API_KEY'); }
function SLACK_TOKEN_() { return CFG_('SLACK_BOT_TOKEN'); }
function CH_(name) { return JSON.parse(CFG_('CHANNELS_JSON', '{}'))[name]; }

// ---------- number / string helpers ----------
function num_(v) { var n = parseInt(String(v == null ? 0 : v).replace(/[^0-9-]/g, ''), 10); return isNaN(n) ? 0 : n; }
function fmt_(n) { return String(num_(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
function pct_(p, w) { return w > 0 ? (Math.round((p / w) * 1000) / 10) : 0; }

/** Client = campaign-name prefix before "|", with light normalisation for known aliases. */
function clientOf_(name) {
  if (!name) return 'Unassigned';
  var c = name.indexOf('|') >= 0 ? name.split('|')[0].trim() : name.trim();
  if (/^(follow ?up|fup)/i.test(c)) return 'Follow-ups';
  var aliases = JSON.parse(CFG_('CLIENT_ALIASES_JSON', '{}')); // optional { "the upstream workspace — Outreach Signal":"the upstream workspace", ... }
  if (aliases[c]) return aliases[c];
  return c.replace(/\s+/g, ' ');
}

/** Robust client label: map by Smartlead client_id first (handles "Segment | <Client Label>" where the
 *  client name is the SUFFIX, not the prefix), then fall back to the name-prefix rule above.
 *  CLIENT_BY_ID_JSON = optional { "<smartlead-client-id>":"<Client Label>", ... }, filled in per
 *  deployment. Find the ids in /analytics/campaign/list (client_id field). */
function clientLabelById_(c) {
  var m = {}; try { m = JSON.parse(CFG_('CLIENT_BY_ID_JSON', '{}')); } catch (e) {}
  if (c && c.client_id != null && m[String(c.client_id)]) return m[String(c.client_id)];
  return clientOf_(c && c.name);
}

// ---------- Smartlead REST ----------
function slGet_(path, params) {
  params = params || {}; params.api_key = SL_KEY_();
  var qs = Object.keys(params).map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); }).join('&');
  var res = UrlFetchApp.fetch(SMARTLEAD_API + path + '?' + qs, { muteHttpExceptions: true });
  if (res.getResponseCode() === 429 || res.getResponseCode() >= 500) { Utilities.sleep(1500); res = UrlFetchApp.fetch(SMARTLEAD_API + path + '?' + qs, { muteHttpExceptions: true }); }
  if (res.getResponseCode() >= 300) throw new Error('Smartlead ' + res.getResponseCode() + ' ' + path);
  return JSON.parse(res.getContentText());
}

/** Non-drafted campaign roster: [{id, name, status}]. */
function campaigns_() {
  var d = slGet_('/analytics/campaign/list', {});
  var list = (d && d.data && d.data.campaign_list) || d.campaign_list || [];
  return list.filter(function (c) { return c.status !== 'DRAFTED'; })
             .map(function (c) { return { id: c.id, name: c.name, status: c.status, client_id: c.client_id }; });
}

/** Batched parallel GET via UrlFetchApp.fetchAll. paths -> array of parsed json (or null). */
function batchGet_(paths) {
  var out = [], CHUNK = 40, key = SL_KEY_();
  for (var i = 0; i < paths.length; i += CHUNK) {
    var slice = paths.slice(i, i + CHUNK).map(function (p) {
      return { url: SMARTLEAD_API + p + (p.indexOf('?') >= 0 ? '&' : '?') + 'api_key=' + key, muteHttpExceptions: true };
    });
    var resps = UrlFetchApp.fetchAll(slice);
    resps.forEach(function (r) { try { out.push(r.getResponseCode() < 300 ? JSON.parse(r.getContentText()) : null); } catch (e) { out.push(null); } });
  }
  return out;
}

/** Per-campaign windowed {sent,bounce,reply} for a date range, grouped by client. */
function windowByClient_(camps, startD, endD) {
  var paths = camps.map(function (c) { return '/campaigns/' + c.id + '/analytics-by-date?start_date=' + startD + '&end_date=' + endD; });
  var data = batchGet_(paths);
  var g = {};
  camps.forEach(function (c, i) {
    var k = clientOf_(c.name); var o = (g[k] = g[k] || { sent: 0, bounce: 0, reply: 0 });
    o.sent += num_(data[i] && data[i].sent_count);
    o.bounce += num_(data[i] && data[i].bounce_count);
    o.reply += num_(data[i] && data[i].reply_count);
  });
  return g;
}

/** Per-campaign lifetime stats grouped by client: {interested, notStarted, lifeSent, lifeBounce}. */
function lifetimeByClient_(camps) {
  var data = batchGet_(camps.map(function (c) { return '/campaigns/' + c.id + '/analytics'; }));
  var g = {};
  camps.forEach(function (c, i) {
    var k = clientOf_(c.name); var o = (g[k] = g[k] || { interested: 0, notStarted: 0, lifeSent: 0, lifeBounce: 0 });
    var st = (data[i] && data[i].campaign_lead_stats) || {};
    o.interested += num_(st.interested); o.notStarted += num_(st.notStarted);
    o.lifeSent += num_(data[i] && data[i].sent_count); o.lifeBounce += num_(data[i] && data[i].bounce_count);
  });
  return g;
}

// ---------- Slack ----------
function slackPost_(channel, text, blocks) {
  var payload = { channel: channel, text: text, unfurl_links: false, unfurl_media: false };
  if (blocks) payload.blocks = blocks;
  var res = UrlFetchApp.fetch(SLACK_API + '/chat.postMessage', {
    method: 'post', contentType: 'application/json; charset=utf-8',
    headers: { Authorization: 'Bearer ' + SLACK_TOKEN_() }, payload: JSON.stringify(payload), muteHttpExceptions: true
  });
  var b = JSON.parse(res.getContentText());
  if (!b.ok) throw new Error('Slack post (' + channel + '): ' + b.error);
  return b;
}
function header_(t) { return { type: 'header', text: { type: 'plain_text', text: t, emoji: true } }; }
function mrkdwn_(t) { return { type: 'section', text: { type: 'mrkdwn', text: t } }; }
function ctx_(t) { return { type: 'context', elements: [{ type: 'mrkdwn', text: t }] }; }
function codeTable_(headers, rows, widths) {
  function pad(s, w, right) { s = String(s); if (s.length > w) s = s.slice(0, w); var sp = new Array(Math.max(0, w - s.length) + 1).join(' '); return right ? sp + s : s + sp; }
  var lines = [headers.map(function (h, i) { return pad(h, widths[i], i > 0); }).join('  ')];
  rows.forEach(function (r) { lines.push(r.map(function (c, i) { return pad(c, widths[i], i > 0); }).join('  ')); });
  return '```' + lines.join('\n') + '```';
}

// ---------- dates ----------
function tz_() { return CFG_('TZ', 'Europe/Helsinki'); }
function ymd_(d) { return Utilities.formatDate(d, tz_(), 'yyyy-MM-dd'); }
function daysAgo_(n) { var d = new Date(); d.setDate(d.getDate() - n); return d; }
function prettyDate_(d) {
  var day = num_(Utilities.formatDate(d, tz_(), 'd'));
  var sfx = (day % 10 === 1 && day != 11) ? 'st' : (day % 10 === 2 && day != 12) ? 'nd' : (day % 10 === 3 && day != 13) ? 'rd' : 'th';
  return day + sfx + ' ' + Utilities.formatDate(d, tz_(), 'MMMM') + ', ' + Utilities.formatDate(d, tz_(), 'EEEE');
}

// ===========================================================================
// 1. DAILY SENDS
// ===========================================================================
function dailySendsReport() {
  var d = ymd_(new Date());
  var g = windowByClient_(campaigns_(), d, d);
  var clients = Object.keys(g).sort(), total = 0, rows = [];
  clients.forEach(function (k) { rows.push([k, fmt_(g[k].sent)]); total += g[k].sent; });
  rows.push(['', '']); rows.push(['TOTAL', fmt_(total)]);
  slackPost_(CH_('daily-sends-report'), 'Daily Send Report — ' + d,
    [header_('📊 Daily Send Report — ' + prettyDate_(new Date())), mrkdwn_(codeTable_(['Client', 'Sends'], rows, [26, 8]))]);
}

// ===========================================================================
// 3 + 4. WEEKLY / MONTHLY DIGEST  (Sends + Bnc% windowed; Int = cumulative interested)
// ===========================================================================
function weeklyDigest() { digest_('weekly-digest', '📊 Weekly Digest — w/e ' + prettyDate_(new Date()), daysAgo_(6), new Date(), 'Totals'); }
function monthlyDigest() {
  var now = new Date(), first = new Date(now.getFullYear(), now.getMonth(), 1);
  digest_('monthly-digest', '📊 Monthly Digest — ' + Utilities.formatDate(now, tz_(), 'MMMM yyyy'), first, now,
    Utilities.formatDate(now, tz_(), 'MMMM') + ' totals', true);
}
function digest_(channelKey, title, startD, endD, totalsLabel, isMonthly) {
  var camps = campaigns_();
  var win = windowByClient_(camps, ymd_(startD), ymd_(endD));
  var life = lifetimeByClient_(camps);
  var clients = Object.keys(win).sort();
  var rows = [], tS = 0, tB = 0, tI = 0;
  clients.forEach(function (k) {
    var s = win[k].sent, b = win[k].bounce, intr = (life[k] || {}).interested || 0;
    rows.push([k, fmt_(s), pct_(b, s) + '%', String(intr)]);
    tS += s; tB += b; tI += intr;
  });
  rows.push(['', '', '', '']); rows.push(['TOTAL', fmt_(tS), '', String(tI)]);
  var summary = totalsLabel + ': ' + fmt_(tS) + ' sends | ' + pct_(tB, tS) + '% bounces | ' + tI + ' interested' +
                (isMonthly ? ' | ' + (Math.round((endD - startD) / 86400000) + 1) + ' days tracked' : '') + ' | ' + clients.length + ' clients';
  slackPost_(CH_(channelKey), title, [header_(title), mrkdwn_(codeTable_(['Client', 'Sends', 'Bnc%', 'Int'], rows, [22, 8, 6, 4])), ctx_('*' + summary + '*')]);
}

// ===========================================================================
// 5. BOUNCE ALERTS  (RECENT window — alert only on a current spike, dedup via state)
// ===========================================================================
// Defaults tuned for "every single bounce within 15 min": alert AT the auto-protect level (3%),
// a low send floor so low-volume clients (e.g. one sending ~20-90/campaign/day) are still
// evaluated, a 3-day window, and recently-paused campaigns included so an auto-paused spike is
// still surfaced. All overridable via Script Properties. Runs every ~10 min (see setupTriggers).
function B_THRESH_() { return parseFloat(CFG_('BOUNCE_THRESHOLD', '0.03')); }
function B_MINSENT_() { return num_(CFG_('BOUNCE_MIN_SENT', '15')) || 15; }
function B_WINDOW_() { return num_(CFG_('BOUNCE_WINDOW_DAYS', '3')) || 3; }
function B_MENTION_() { return CFG_('BOUNCE_MENTION', '<!channel>'); }
function B_INCLUDE_PAUSED_() { return CFG_('BOUNCE_INCLUDE_PAUSED', 'true') !== 'false'; }

function bounceCheck() {
  var threshold = B_THRESH_(), minSent = B_MINSENT_(), windowDays = B_WINDOW_();
  var mention = B_MENTION_(), includePaused = B_INCLUDE_PAUSED_();
  // ACTIVE can spike now; recently-PAUSED may have been auto-paused for bounce BEFORE we ever saw it
  // >= threshold while active (Smartlead auto-protects at ~3%). The window's min-sent gate naturally
  // drops long-paused campaigns (0 recent sends), so this only adds genuinely recent breaches.
  var camps = campaigns_().filter(function (c) { return c.status === 'ACTIVE' || (includePaused && c.status === 'PAUSED'); });
  var start = ymd_(daysAgo_(windowDays)), end = ymd_(new Date());
  var paths = camps.map(function (c) { return '/campaigns/' + c.id + '/analytics-by-date?start_date=' + start + '&end_date=' + end; });
  var data = batchGet_(paths);
  var state = stateGet_('BounceState');         // LEVEL-TRIGGERED: { __seeded:true, "<id>": <pct> } = currently-breaching set
  var firstRun = !state.__seeded;               // first run after deploy seeds silently (no backfill burst)
  var cur = {}, newly = [];
  camps.forEach(function (c, i) {
    var sent = num_(data[i] && data[i].sent_count), bounced = num_(data[i] && data[i].bounce_count);
    if (sent < minSent) return;
    var rate = bounced / sent;
    if (rate < threshold) return;
    var key = String(c.id);
    cur[key] = { rate: rate, sent: sent, bounced: bounced, c: c };
    if (!state[key]) newly.push(cur[key]);       // campaign just ENTERED the breach state
  });
  if (!firstRun) {
    newly.forEach(function (a) {
      var client = clientLabelById_(a.c), ratePct = Math.round(a.rate * 1000) / 10;
      var paused = a.c.status === 'PAUSED';
      var head = paused ? '🚨 High Bounce: Campaign Already Paused' : '🚨 High Bounce Rate: PAUSE NOW';
      var lead = paused
        ? ('🚨 *' + a.c.name + '* (' + client + ') bounced at *' + ratePct + '%* and is *already paused*. Check the list quality and mailboxes before resuming.')
        : ('🚨 *' + a.c.name + '* (' + client + ') is bouncing at *' + ratePct + '%*. Pause it now to protect sender reputation.');
      var blocks = [header_(head)];
      if (mention) blocks.push(mrkdwn_(mention + ' ' + lead));
      blocks.push({ type: 'section', fields: [
        { type: 'mrkdwn', text: '*Client*\n' + client },
        { type: 'mrkdwn', text: '*Campaign*\n' + a.c.name },
        { type: 'mrkdwn', text: '*Bounce (last ' + windowDays + 'd)*\n' + ratePct + '% (' + fmt_(a.bounced) + '/' + fmt_(a.sent) + ')' },
        { type: 'mrkdwn', text: '*Status*\n' + a.c.status }
      ] });
      blocks.push(mrkdwn_('*Action required:* ' + (paused ? 'review the list quality and mailboxes before resuming.' : 'pause this campaign immediately, then check the list quality and mailboxes before resuming.')));
      blocks.push(ctx_('Checked every ~10 min. Alerts at ' + Math.round(threshold * 100) + '%+ bounce over ' + fmt_(minSent) + '+ sends in ' + windowDays + ' days. Recently-paused campaigns are included. One ping per breach; it re-arms when the rate drops back below the limit.'));
      slackPost_(CH_('bounce-alerts'), (mention ? mention + ' ' : '') + '🚨 High bounce: ' + a.c.name, blocks);
    });
  }
  // Persist the current breach set. A campaign clears (and can re-alert later) once it drops below
  // threshold or its recent sends age out of the window.
  var ns = { __seeded: true };
  Object.keys(cur).forEach(function (k) { ns[k] = Math.round(cur[k].rate * 1000) / 10; });
  stateSet_('BounceState', ns);
}

// ===========================================================================
// 2. DAILY LEADS  (leads not yet started, bucketed empty/low/good)
// ===========================================================================
function dailyLeadsReport() {
  var LOW = num_(CFG_('LEADS_LOW', '200'));
  var g = lifetimeByClient_(campaigns_());
  var ent = Object.keys(g).map(function (k) { return { name: k, n: g[k].notStarted }; });
  var empty = ent.filter(function (e) { return e.n === 0; });
  var low = ent.filter(function (e) { return e.n > 0 && e.n < LOW; }).sort(function (a, b) { return a.n - b.n; });
  var good = ent.filter(function (e) { return e.n >= LOW; }).sort(function (a, b) { return b.n - a.n; });
  var blocks = [header_('📋 Daily Leads Report — ' + prettyDate_(new Date()))];
  if (low.length) blocks.push(mrkdwn_('*Running low:*\n' + low.map(function (e) { return '• *' + e.name + '* — ' + fmt_(e.n) + ' new leads left'; }).join('\n')));
  if (good.length) blocks.push(mrkdwn_('*' + good.length + ' client(s) looking good:*\n' + good.slice(0, 12).map(function (e) { return '• ' + e.name + ' — ' + fmt_(e.n); }).join('\n')));
  blocks.push(ctx_(ent.length + ' clients  —  ' + empty.length + ' empty  •  ' + low.length + ' low  •  ' + good.length + ' good'));
  slackPost_(CH_('daily-leads-report'), 'Daily Leads Report', blocks);
}

// ===========================================================================
// 6. REPLY FOLLOW-UPS (daily)  — leads that replied, by client + sequence step
//    Uses master-inbox replies in the last day. Field names refined on live payloads.
// ===========================================================================
function replyFollowupsReport() {
  var winDays = num_(CFG_('FUP_WINDOW_DAYS', '2'));
  var replies = inboxReplies_().filter(function (r) { return withinDays_(r.at, winDays); }); // daily digest of recent replies
  var head = header_('📋 Reply Follow-Ups — ' + prettyDate_(new Date()));
  if (!replies.length) { slackPost_(CH_('reply-followups'), 'Reply Follow-Ups — none', [head, mrkdwn_('_No new replies in the last ' + winDays + ' days._')]); return; }
  var byClient = {};
  replies.forEach(function (r) { (byClient[r.client] = byClient[r.client] || []).push(r); });
  var blocks = [head, mrkdwn_(Object.keys(byClient).length + ' client(s) with active leads:')];
  Object.keys(byClient).forEach(function (c) {
    var lines = byClient[c].slice(0, 15).map(function (r) { return '• ' + (r.name || r.email) + ' (' + r.email + ') — Step ' + (r.step || '?') + ' — ' + (r.status || 'Replied'); });
    blocks.push(mrkdwn_('*' + c + '* — ' + byClient[c].length + ' leads\n' + lines.join('\n')));
  });
  slackPost_(CH_('reply-followups'), 'Reply Follow-Ups', blocks);
}

// ===========================================================================
// 7. STALE INBOX (hourly) — interested replies unanswered > threshold mins
// ===========================================================================
function staleInboxCheck() {
  var thr = num_(CFG_('STALE_THRESHOLD_MIN', '15'));
  var maxAgeDays = num_(CFG_('STALE_MAX_AGE_DAYS', '1')); // only flag recent interested replies, never re-alert ancient threads
  var waiting = inboxReplies_().filter(function (r) { return isInterested_(r) && r.awaiting && !r.archived && minsSince_(r.at) >= thr && withinDays_(r.at, maxAgeDays); });
  if (!waiting.length) return; // Bison posts only when >0
  slackPost_(CH_('stale-inbox'), 'Stale inbox: ' + waiting.length + ' waiting', [
    header_('⏰ Stale Inbox Alert — ' + waiting.length + ' waiting'),
    mrkdwn_('These interested replies have been sitting for *' + thr + '+ mins* without a response:'),
    mrkdwn_(waiting.map(function (r) { return '⏰ *' + r.client + '* — ' + (r.name || r.email) + ' (' + r.email + ') — ' + ago_(r.at); }).join('\n')),
    ctx_('Checked hourly. Threshold: ' + thr + ' mins.')
  ]);
}

// ===========================================================================
// 8. INTERESTED REPLIES — near-real-time via a 10-min poll of the master inbox.
//    Robust: no per-campaign webhook wiring, auto-covers every campaign.
//    Seeds silently on first run so it never backfills historical interested leads.
// ===========================================================================
function interestedRepliesPoll() {
  var seen = stateGet_('InterestedSeen');
  var firstRun = !seen || Object.keys(seen).length === 0;
  var interested = inboxReplies_(100).filter(isInterested_);
  var fresh = interested.filter(function (r) { return r.id && !seen[r.id]; });
  fresh.forEach(function (r) { seen[r.id] = Date.now(); });
  stateSet_('InterestedSeen', trimSeen_(seen, 800));
  if (firstRun) { console.log('seeded ' + fresh.length + ' interested leads (no backfill on first run)'); return; }
  fresh.forEach(function (r) { postInterestedCard_(r); });
}
function postInterestedCard_(r) {
  slackPost_(CH_('interested-replies'), 'Interested reply: ' + r.email, [
    header_('🔥 Interested Reply — ' + r.client),
    { type: 'section', fields: [
      { type: 'mrkdwn', text: '👤 *Lead*\n' + (r.name || '—') },
      { type: 'mrkdwn', text: '✉️ *Email*\n' + (r.email || '—') },
      { type: 'mrkdwn', text: '🎯 *Campaign*\n' + (r.campaign || '—') },
      { type: 'mrkdwn', text: '🪜 *Step*\n' + (r.step || '—') },
      { type: 'mrkdwn', text: '🕐 *Replied*\n' + ago_(r.at) }
    ] }
  ]);
}
function trimSeen_(seen, max) {
  var keys = Object.keys(seen);
  if (keys.length <= max) return seen;
  keys.sort(function (a, b) { return seen[a] - seen[b]; });
  for (var i = 0; i < keys.length - max; i++) delete seen[keys[i]];
  return seen;
}

// ===========================================================================
// 9. REPLY ALERTS — near-real-time @channel ping (every 1 min) so the assigned reply team acts ASAP.
//    Separate poll + SEPARATE seen-state from report #8 (interested-replies, the calmer 10-min log).
//    Scans only the newest ALERT_POLL_PAGES*20 replies (default 40) to stay light on the API + GAS
//    runtime quota. Seeds silently on first run so it NEVER @channel-backfills historical positives.
// ===========================================================================
var SL_INBOX_URL = 'https://app.smartlead.ai/app/master-inbox';
// Per-lead deep link (verified live 2026-06-23): opens that exact lead's conversation. leadMap = email_lead_map_id.
function inboxUrlFor_(r) { return (r && r.leadMap) ? (SL_INBOX_URL + '?action=INBOX&leadMap=' + r.leadMap) : SL_INBOX_URL; }
// Default alert set = the actionable categories an SDR should jump on (verified live ids):
// 1 Interested · 2 Meeting Request · 5 Information Request · 8 Uncategorizable by Ai ·
// 3541 Referral · 3830 Custom Response · 4407 Future Contact. (Excludes Not Interested, Do Not
// Contact, OOO, Wrong Person, Bounces, Automated Reply, Retired, etc.) Tunable via ALERT_CATEGORY_IDS.
function alertIds_() { return CFG_('ALERT_CATEGORY_IDS', '1,2,5,8,3541,3830,4407').split(',').map(function (s) { return num_(s); }); }
function isAlert_(r) { return !!r && alertIds_().indexOf(num_(r.categoryId)) >= 0; }
function catName_(id) {
  var m = { '1': 'Interested', '2': 'Meeting Request', '5': 'Information Request', '8': 'Uncategorizable by Ai',
            '3541': 'Referral', '3830': 'Custom Response', '4407': 'Future Contact', '4245': 'Meeting Booked' };
  return m[String(num_(id))] || ('Category ' + num_(id));
}
function replyAlertPoll() {
  var pages = num_(CFG_('ALERT_POLL_PAGES', '2')) || 2;          // newest 20-item pages to scan each minute
  logSheet_();                                                    // ensure the contacts-log sheet exists (sets LOG_SHEET_URL)
  var seen = stateGet_('ReplyAlertSeen');
  var firstRun = !seen || Object.keys(seen).length === 0;
  var hot = inboxReplies_(pages * 20).filter(isAlert_);
  var fresh = hot.filter(function (r) { return r.id && !seen[r.id]; });
  fresh.forEach(function (r) { seen[r.id] = Date.now(); });
  stateSet_('ReplyAlertSeen', trimSeen_(seen, 1000));
  if (firstRun) { console.log('reply-alert seeded ' + fresh.length + ' (no @channel backfill on first run)'); return; }
  fresh.forEach(function (r) { logReplyAlert_(r); postReplyAlertCard_(r); });
}
function postReplyAlertCard_(r) {
  var mention = CFG_('ALERT_MENTION', '<!channel>'); // broadcast that pushes to channel members
  // The mention MUST live in a RENDERED block (not just the fallback text) or Slack won't fire the
  // broadcast when blocks are present. Keep it in the fallback text too for the notification preview.
  var blocks = [
    header_('🔥 New Reply: ' + r.client),
    mrkdwn_(mention + ' 🔥 *New reply from ' + (r.name || r.email) + '* (' + r.client + '). Reply ASAP.'),
    { type: 'section', fields: [
      { type: 'mrkdwn', text: '👤 *Lead*\n' + (r.name || '—') },
      { type: 'mrkdwn', text: '✉️ *Email*\n' + (r.email || '—') },
      { type: 'mrkdwn', text: '🎯 *Campaign*\n' + (r.campaign || '—') },
      { type: 'mrkdwn', text: '🏷️ *Category*\n' + catName_(r.categoryId) },
      { type: 'mrkdwn', text: '🪜 *Step*\n' + (r.step || '—') },
      { type: 'mrkdwn', text: '🕐 *Replied*\n' + ago_(r.at) }
    ] }
  ];
  // Links row: open THIS lead in Smartlead (one click) + the contacts-log Google Sheet (history + phones).
  var sheetUrl = CFG_('LOG_SHEET_URL', '');
  var links = '👉 <' + inboxUrlFor_(r) + '|Open this lead in Smartlead> and reply ASAP.';
  if (sheetUrl) links += '   ·   📊 <' + sheetUrl + '|Contacts log (history + phones)>';
  blocks.push(mrkdwn_(links));
  // One-click phone-enrich button, shown only once the web-app endpoint is configured (Phase B).
  var btn = enrichButton_(r);
  if (btn) blocks.push(btn);
  slackPost_(CH_('reply-alerts'), mention + ' 🔥 New reply from ' + (r.name || r.email) + ' (' + r.client + '). Reply ASAP.', blocks);
}

// ---------- contacts-log Google Sheet (SDR-facing history of alerted replies + enriched phones) ----------
function logSheet_() {
  var id = CFG_('LOG_SHEET_ID');
  // If we already have an id, open it, but on a transient open failure return null rather than
  // create a SECOND sheet (which would orphan the first and lose its data reference).
  if (id) { try { return SpreadsheetApp.openById(id); } catch (e) { console.error('contacts-log open failed (not recreating): ' + e); return null; } }
  var ss = SpreadsheetApp.create('Smartlead Reply Alerts: Interested Contacts Log [Claude Code]');
  var p = PropertiesService.getScriptProperties();
  p.setProperty('LOG_SHEET_ID', ss.getId());
  p.setProperty('LOG_SHEET_URL', ss.getUrl());
  var sh = ss.getSheets()[0]; sh.setName('Contacts');
  sh.appendRow(['Logged At', 'Client', 'Campaign', 'Lead', 'Email', 'Category', 'Phone', 'Phone Status', 'Smartlead', 'Replied At', 'Lead ID', 'Phone Enriched At']);
  sh.setFrozenRows(1); sh.getRange('A1:L1').setFontWeight('bold');
  // Holds PII (names/emails/phones). Left PRIVATE to the owner on purpose: share it once, manually, with
  // the team restricted to the <COMPANY_DOMAIN> domain (Share, then General access, the upstream workspace). Avoids both a
  // public anyone-with-link sheet and the broad Drive OAuth scope that programmatic sharing would force.
  console.log('Contacts-log sheet created: ' + ss.getUrl() + ' (share it domain-restricted with the team).');
  return ss;
}
function logTab_() { var ss = logSheet_(); return ss.getSheetByName('Contacts') || ss.getSheets()[0]; }
function logReplyAlert_(r) {
  try { logTab_().appendRow([new Date(), r.client || '', r.campaign || '', r.name || '', r.email || '', catName_(r.categoryId), '', '', inboxUrlFor_(r), r.at || '', String(r.id || '')]); }
  catch (e) { console.error('logReplyAlert_', e); }
}
function logSetPhone_(leadId, phone, status, phoneAt) {
  try {
    var sh = logTab_(), n = Math.max(0, sh.getLastRow() - 1);
    if (!n) return false;
    var vals = sh.getRange(2, 11, n, 1).getValues(); // col K = Lead ID
    for (var i = vals.length - 1; i >= 0; i--) {     // newest-first: update the most recent matching row
      if (String(vals[i][0]) === String(leadId)) {
        sh.getRange(i + 2, 7).setValue(phone || '');                // G: Phone
        sh.getRange(i + 2, 8).setValue(status || '');               // H: Phone Status
        sh.getRange(i + 2, 12).setValue(phoneAt || new Date());     // L: Phone Enriched At (pass original on a cached re-post)
        return true;
      }
    }
  } catch (e) { console.error('logSetPhone_', e); }
  return false;
}
// Resolve a lead's name/email from the contacts-log row by Lead ID (col K). Lets the enrich button carry
// ONLY the opaque id in its URL (no PII in the query string). The row is written immediately before the
// card is posted, so it always exists by the time the button is clicked. Newest-first match.
function logLookupById_(leadId) {
  if (!leadId) return null;
  try {
    var sh = logTab_(), n = Math.max(0, sh.getLastRow() - 1);
    if (!n) return null;
    var vals = sh.getRange(2, 1, n, 12).getValues(); // A..L
    var ident = null, best = null;                   // identity = newest row; best = most recent enriched/phone-bearing row
    for (var i = vals.length - 1; i >= 0; i--) {     // newest-first
      if (String(vals[i][10]) !== String(leadId)) continue;
      if (!ident) ident = { name: vals[i][3], email: vals[i][4] };
      if (!best && (vals[i][11] || vals[i][6])) best = { phone: vals[i][6], phoneAt: vals[i][11], status: vals[i][7] };
    }
    if (!ident) return null;
    return { name: ident.name, email: ident.email,
             phone: best ? best.phone : '', phoneAt: best ? best.phoneAt : '', phoneStatus: best ? best.status : '' };
  } catch (e) { console.error('logLookupById_', e); }
  return null;
}

// ---------- Phase B: one-click phone enrich (URL button -> doGet -> BetterContact async -> phoneJobPoll) ----------
// The button is a URL button, so NO Slack Interactivity config is needed. It opens the web-app /exec with the
// lead identity + an unguessable token. doGet submits a BetterContact phone job and stores it; the 1-min
// phoneJobPoll completes it (writes the phone to the log sheet + posts it to the channel). BetterContact is
// async (minutes) + pay-per-valid (~10 credits per phone FOUND, 0 when none), so we never block on it.
function enrichButton_(r) {
  var webapp = CFG_('WEBAPP_URL', ''), token = CFG_('ENRICH_TOKEN', '');
  if (!webapp || !token) return null; // Phase A (no web-app yet) → no button shown
  // Pass ONLY the opaque lead id + token in the URL — no PII in the query string. doGet resolves the
  // lead's name/email from the contacts-log row written just before this card is posted (line ~342).
  var url = webapp + '?a=enrich&t=' + encodeURIComponent(token) + '&id=' + encodeURIComponent(r.id || '');
  return { type: 'actions', elements: [
    { type: 'button', text: { type: 'plain_text', text: '📞 Enrich phone (to cold-call)', emoji: true }, url: url, style: 'primary' }
  ] };
}
function daysSince_(ts) { return ts ? Math.floor((Date.now() - new Date(ts).getTime()) / 86400000) : 999999; }
function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.a !== 'enrich') return htmlOut_('Smartlead Reply Alerts web-app is running.');
  var tok = CFG_('ENRICH_TOKEN', ''); if (!tok || p.t !== tok) return htmlOut_('Not authorized.');
  var who = logLookupById_(p.id || ''); // identity (+ any cached phone) comes from the contacts-log, NOT the URL
  if (!who || !who.email) return htmlOut_('Could not find this lead in the contacts log yet. Give it a few seconds and click the button again.');
  // DEDUP / credit-saver: if this lead was already phone-enriched recently, re-post the cached result and
  // SKIP the paid BetterContact call. Only re-scrape when nothing is on file or it is older than
  // PHONE_CACHE_DAYS (default 90). A legacy phone with no timestamp counts as on-file (re-post, no spend).
  var cacheDays = num_(CFG_('PHONE_CACHE_DAYS', '90')) || 90;
  var freshAttempt = who.phoneAt && daysSince_(who.phoneAt) < cacheDays; // a found OR not-found result within the window
  var legacyPhone = who.phone && !who.phoneAt;
  if (freshAttempt || legacyPhone) {
    logSetPhone_(p.id || '', who.phone, who.phoneStatus || (who.phone ? '' : 'not found'), who.phoneAt || new Date()); // mirror onto the newest row, keep original date
    postPhoneResult_({ id: p.id || '', name: who.name || '', email: who.email || '' }, who.phone, who.phoneStatus || '', true);
    var ageTxt = who.phoneAt ? (daysSince_(who.phoneAt) + 'd ago') : 'previously';
    return htmlOut_((who.phone
      ? ('📞 Already on file for ' + (who.name || who.email) + ': <b>' + who.phone + '</b> (enriched ' + ageTxt + ')')
      : ('No phone was found for ' + (who.name || who.email) + ' when last checked ' + ageTxt))
      + '. Re-posted to #smartlead-reply-alerts — <b>no BetterContact credits used</b>. You can close this tab.');
  }
  var parts = String(who.name || '').trim().split(/\s+/), first = parts.shift() || '', last = parts.join(' ');
  var dom = String(who.email).split('@')[1] || '';
  var bcId = bcSubmitPhone_(first, last, dom, who.email);
  if (!bcId) return htmlOut_('Could not start the phone lookup for ' + (who.name || who.email) + '. Check BetterContact config and try again.');
  phoneJobsAdd_(bcId, { id: p.id || '', name: who.name || '', email: who.email || '', at: Date.now() }); // atomic add (LockService) so a concurrent phoneJobPoll write can't clobber this just-submitted job
  return htmlOut_('📞 Looking up a phone number for ' + (who.name || who.email) + '. It will post to #smartlead-reply-alerts in about a minute, and land in the contacts log. You can close this tab.');
}
function htmlOut_(msg) { return HtmlService.createHtmlOutput('<div style="font:16px/1.5 system-ui,Arial;padding:28px;max-width:520px">' + msg + '</div>'); }
var BC_BASE = 'https://app.bettercontact.rocks/api/v2';
function bcSubmitPhone_(first, last, domain, email) {
  var key = CFG_('BETTERCONTACT_API_KEY', ''); if (!key) { console.error('no BETTERCONTACT_API_KEY'); return null; }
  var item = { first_name: first, last_name: last, custom_fields: { uuid: String(email || (first + last)) } };
  if (domain) { item.company = domain; item.company_domain = domain; }
  var res = UrlFetchApp.fetch(BC_BASE + '/async', { method: 'post', contentType: 'application/json',
    headers: { 'X-API-Key': key }, payload: JSON.stringify({ data: [item], enrich_email_address: false, enrich_phone_number: true }), muteHttpExceptions: true });
  try { var j = JSON.parse(res.getContentText()); return j && j.id ? j.id : null; } catch (x) { console.error('bcSubmitPhone_', x); return null; }
}
// Atomic add of a pending phone job. doGet and the 1-min phoneJobPoll both mutate the SAME PhoneJobs
// script property; without a lock a poll's read-modify-write can clobber a job doGet just added (the
// clicker sees "looking up…" but nothing ever posts). Serialize the add under a script lock, and the
// poll deletes under the same lock via a FRESH re-read (see phoneJobPoll), so neither loses the other's write.
function phoneJobsAdd_(bcId, entry) {
  var lock = LockService.getScriptLock();
  try { lock.waitLock(20000); } catch (e) { /* best-effort: proceed unlocked rather than drop the click */ }
  try { var jobs = stateGet_('PhoneJobs'); jobs[bcId] = entry; stateSet_('PhoneJobs', jobs); }
  finally { try { lock.releaseLock(); } catch (e) {} }
}
// Tell the channel when a lookup never finishes, instead of silently dropping it — otherwise the clicker
// is left on "…will post in about a minute" forever with no result.
function postPhoneTimeout_(job) {
  var lead = job.name || job.email;
  slackPost_(CH_('reply-alerts'), 'Phone lookup did not finish for ' + lead, [
    mrkdwn_('📞 The phone lookup for *' + lead + '* did not finish in time (the provider took too long). Click *📞 Enrich phone* again to retry.')
  ]);
}
// 1-min sweep: finish any BetterContact phone jobs that completed. No-op (instant return) when none pending.
function phoneJobPoll() {
  var snapshot = stateGet_('PhoneJobs'), ids = Object.keys(snapshot); if (!ids.length) return;
  var key = CFG_('BETTERCONTACT_API_KEY', ''); if (!key) return;
  var resolved = []; // bcIds to remove after this pass (completed OR timed-out)
  ids.forEach(function (bcId) {
    var job = snapshot[bcId];
    if (Date.now() - num_(job.at) > 15 * 60000) { postPhoneTimeout_(job); resolved.push(bcId); return; } // give up after 15 min — but say so
    var res = UrlFetchApp.fetch(BC_BASE + '/async/' + bcId, { headers: { 'X-API-Key': key }, muteHttpExceptions: true });
    var j; try { j = JSON.parse(res.getContentText()); } catch (x) { return; }
    // Done-detection must NOT treat partial mid-waterfall data as finished. BetterContact's running
    // state is "in progress" (a SPACE — normalize to underscore) and can carry a data array while still
    // working; mirror bettercontact_enrich.mjs's NONTERMINAL guard: any non-terminal status keeps waiting.
    var st = String((j && j.status) || '').toLowerCase().replace(/\s+/g, '_');
    var NONTERMINAL = { not_started: 1, in_progress: 1, processing: 1, queued: 1, pending: 1, running: 1, started: 1, on_hold: 1, onhold: 1, held: 1, waiting: 1 };
    if (NONTERMINAL[st]) return; // still running — wait, even if a partial data array is already present
    var terminal = st.indexOf('terminat') >= 0 || st.indexOf('complet') >= 0 || st === 'done' || st === 'finished' || st === 'failed' || st === 'error';
    if (!terminal && !(j && j.data && j.data.length)) return; // unknown status + no data → keep waiting
    var item = (j && j.data && j.data[0]) || {};
    var phone = item.contact_phone_number || item.contact_additional_phone_number || item.company_phone_number || '';
    logSetPhone_(job.id, phone, phone ? (item.contact_phone_number_status || '') : 'not found');
    postPhoneResult_(job, phone, item.contact_phone_number_status || '');
    resolved.push(bcId);
  });
  if (!resolved.length) return;
  // Delete resolved jobs under a lock, re-reading the CURRENT store so any job doGet added during the
  // (slow, network-bound) loop above is preserved rather than clobbered by writing back the stale snapshot.
  var lock = LockService.getScriptLock();
  try { lock.waitLock(20000); } catch (e) {}
  try { var cur = stateGet_('PhoneJobs'); resolved.forEach(function (bcId) { delete cur[bcId]; }); stateSet_('PhoneJobs', cur); }
  finally { try { lock.releaseLock(); } catch (e) {} }
}
function postPhoneResult_(job, phone, pstatus, cached) {
  var sheetUrl = CFG_('LOG_SHEET_URL', ''), lead = job.name || job.email, msg, blocks;
  if (phone) {
    msg = '📞 Phone for ' + lead + ': ' + phone;
    blocks = [ mrkdwn_('📞 *Phone ' + (cached ? 'on file' : 'found') + ' for ' + lead + '*, ready to cold-call:\n*' + phone + '*' + (pstatus ? '  _(' + pstatus + ')_' : '') + (cached ? '  _(already enriched, no credits used)_' : '')) ];
    if (sheetUrl) blocks.push(ctx_('Saved in the <' + sheetUrl + '|contacts log>.'));
  } else {
    msg = 'No phone found for ' + lead;
    blocks = [ mrkdwn_('📞 No phone number found for *' + lead + '*' + (cached ? ' (already checked recently, no credits used)' : ' (no provider had one)') + '. Logged as "not found".') ];
  }
  slackPost_(CH_('reply-alerts'), msg, blocks);
}

// ---------- master-inbox replies (fields validated live 2026-06-15) ----------
// POST /master-inbox/inbox-replies?api_key=  body {offset,limit}  (api_key NOT allowed in body)
function inboxReplies_(maxItems) {
  maxItems = maxItems || 100; var PAGE = 20, out = []; // master inbox caps limit at 20 → page in 20s (newest-first)
  try {
    for (var offset = 0; out.length < maxItems && offset <= 600; offset += PAGE) {
      var res = UrlFetchApp.fetch(SMARTLEAD_API + '/master-inbox/inbox-replies?api_key=' + SL_KEY_(), {
        method: 'post', contentType: 'application/json',
        payload: JSON.stringify({ offset: offset, limit: PAGE }), muteHttpExceptions: true
      });
      if (res.getResponseCode() >= 400) break;
      var data = JSON.parse(res.getContentText());
      var arr = data.data || (Array.isArray(data) ? data : []);
      if (!arr || !arr.length) break;
      for (var i = 0; i < arr.length; i++) {
        var r = arr[i];
        out.push({
          id: String(r.email_lead_id || r.email_lead_map_id),
          client: clientOf_(r.email_campaign_name || ''),
          name: ((r.lead_first_name || '') + ' ' + (r.lead_last_name || '')).trim(),
          email: r.lead_email, step: r.current_sequence_number, status: r.lead_status,
          categoryId: r.lead_category_id, campaign: r.email_campaign_name, campaignId: r.email_campaign_id,
          leadMap: String(r.email_lead_map_id || ''), // for the per-lead Smartlead deep link
          at: r.last_reply_time, awaiting: r.has_new_unread_email === true,
          archived: r.is_archived === true
        });
      }
      if (arr.length < PAGE) break; // last page
    }
    return out;
  } catch (e) { console.error('inboxReplies_', e); return out; }
}
// Positive/hot categories (Smartlead defaults: 1=Interested, 2=Meeting Request — both sentiment_type "positive").
// Tunable via Script Property INTERESTED_CATEGORY_IDS (comma list); default "1,2".
function interestedIds_() { return CFG_('INTERESTED_CATEGORY_IDS', '1,2').split(',').map(function (s) { return num_(s); }); }
function isInterested_(r) { return !!r && interestedIds_().indexOf(num_(r.categoryId)) >= 0; }
function minsSince_(ts) { return ts ? Math.round((Date.now() - new Date(ts).getTime()) / 60000) : 0; }
function withinDays_(ts, days) { return ts ? (Date.now() - new Date(ts).getTime()) <= days * 86400000 : false; }
function ago_(ts) { var m = minsSince_(ts); return m >= 60 ? (Math.round(m / 60) + 'h ago') : (m + 'm ago'); }

// ===========================================================================
// 10. HEALTH ALERTS — mailbox connection failures + campaign auto-pauses (every 5 min).
//   Level-triggered (tracks the CURRENT broken set + per-campaign status): alerts on a NEW breakage /
//   a NEW high-bounce auto-pause, posts ✅ on recovery. Mirrors post.mjs healthAlertPoll. The campaign
//   pause alert is GATED on elevated recent bounce — Smartlead exposes NO auto-pause flag (verified
//   live), so routine/manual pauses stay quiet and the channel keeps signal. Reuses stateGet_/stateSet_
//   (a new tab, no new OAuth scope). @channel lives in a RENDERED block so the broadcast fires.
// ===========================================================================
function H_MENTION_() { return CFG_('HEALTH_MENTION', '<!channel>'); }
function H_MAXCARDS_() { return num_(CFG_('HEALTH_MAX_CARDS', '6')) || 6; }
function H_THRESH_() { return parseFloat(CFG_('HEALTH_BOUNCE_THRESHOLD', '0.03')); }
function H_MINSENT_() { return num_(CFG_('HEALTH_BOUNCE_MIN_SENT', '50')) || 50; }
function H_WINDOW_() { return num_(CFG_('HEALTH_BOUNCE_WINDOW_DAYS', '3')) || 3; }

function tagNames_(a) {
  var arr = a.tags || a.email_account_tag_mappings || [];
  return arr.map(function (t) { return (typeof t === 'string') ? t : (t.name || (t.tag && t.tag.name) || t.tag_name || String(t.id)); }).filter(Boolean);
}
// Classify a broken account: both fail = dead token (reconnect); SMTP-only = usually provider-side
// (sending not enabled, IMAP rides the same token so it's up); IMAP-only = re-auth.
function brokenKind_(a) {
  var s = a.is_smtp_success === false, i = a.is_imap_success === false;
  if (s && i) return { kind: 'disconnected', label: 'Disconnected — needs reconnection', fix: 'Reconnect the mailbox in Smartlead (re-auth).' };
  if (s) return { kind: 'smtp', label: 'SMTP (sending) failing', fix: 'Often provider-side: enable Gmail/SMTP sending at the provider (Zapmail / Workspace admin), then reconnect in Smartlead.' };
  if (i) return { kind: 'imap', label: 'IMAP (inbox) failing', fix: 'Usually a re-auth: reconnect the mailbox in Smartlead.' };
  return null;
}
function brokenAccountsMap_(accounts) {
  var m = {};
  accounts.forEach(function (a) {
    var k = brokenKind_(a); if (!k) return;
    m[String(a.id)] = { id: a.id, email: a.from_email, type: a.type, kind: k.kind, label: k.label, fix: k.fix,
      err: String(a.smtp_failure_error || a.imap_failure_error || '').slice(0, 180),
      tags: tagNames_(a), client_id: (a.client_id == null ? null : a.client_id) };
  });
  return m;
}
// Pull EVERY email account (paginate 400). Returns {accounts, complete}: complete=true ONLY if pagination
// reached the end cleanly (a short final page). A mid-pull error → complete=false so the caller skips the
// diff — a PARTIAL pull would otherwise read the missing accounts as "recovered" (spurious ✅ + dropped state).
function allEmailAccounts_() {
  var PAGE = 400, all = [], complete = false;
  for (var offset = 0; offset <= 20000; offset += PAGE) {
    var batch;
    try { var d = slGet_('/email-accounts/', { offset: offset, limit: PAGE }); batch = Array.isArray(d) ? d : ((d && d.data) || []); }
    catch (e) { console.error('allEmailAccounts_ offset ' + offset + ': ' + e); break; } // errored mid-pagination → complete stays false
    all = all.concat(batch);
    if (batch.length < PAGE) { complete = true; break; } // reached the end cleanly
  }
  return { accounts: all, complete: complete };
}
// Human client label from the account's tags (skip provenance/batch tags), else client_id.
function clientLabel_(b) {
  var t = (b.tags || []).filter(function (x) { return !/^Batch|^Spaceship$|^Zapmail$|^Primeforge$|^Google$|^Microsoft$|^O365$|^GMAIL$|^OUTLOOK$/i.test(x); });
  return t[0] || (b.client_id ? 'client ' + b.client_id : '—');
}
// Pure level-trigger diffs (current-set vs last-set). NOT append-only: break→recover→re-break re-alerts.
function diffBroken_(prev, cur) {
  var nb = [], rc = [];
  Object.keys(cur).forEach(function (id) { if (!prev[id]) nb.push(cur[id]); });
  Object.keys(prev).forEach(function (id) { if (!cur[id]) rc.push(prev[id]); });
  return { newlyBroken: nb, recovered: rc };
}
function diffPaused_(prevC, camps) { return camps.filter(function (c) { return prevC[c.id] === 'ACTIVE' && c.status === 'PAUSED'; }); }

function mbCard_(b, mention) {
  var blocks = [header_('🔌 Mailbox Needs Attention — ' + clientLabel_(b))];
  if (mention) blocks.push(mrkdwn_(mention + ' 🔌 *' + b.email + '* — ' + b.label + '. Needs attention.'));
  blocks.push({ type: 'section', fields: [
    { type: 'mrkdwn', text: '✉️ *Mailbox*\n' + (b.email || '—') },
    { type: 'mrkdwn', text: '🏷️ *Client*\n' + clientLabel_(b) },
    { type: 'mrkdwn', text: '🔧 *Type*\n' + (b.type || '—') },
    { type: 'mrkdwn', text: '⚠️ *Issue*\n' + b.label }] });
  if (b.err) blocks.push(mrkdwn_('*Provider error:* `' + b.err + '`'));
  blocks.push(ctx_('*Fix:* ' + b.fix));
  return { text: (mention ? mention + ' ' : '') + '🔌 Mailbox needs attention: ' + b.email + ' (' + b.label + ')', blocks: blocks };
}
function mbSummaryCard_(list, mention) {
  var byClient = {};
  list.forEach(function (b) { var c = clientLabel_(b); (byClient[c] = byClient[c] || []).push(b); });
  var lines = Object.keys(byClient).map(function (c) { return '• *' + c + '* — ' + byClient[c].length + ' mailbox(es): ' + byClient[c].slice(0, 6).map(function (b) { return b.email; }).join(', ') + (byClient[c].length > 6 ? ' …' : ''); });
  var blocks = [header_('🔌 ' + list.length + ' Mailboxes Need Attention')];
  if (mention) blocks.push(mrkdwn_(mention + ' 🔌 *' + list.length + ' mailboxes just went down* (grouped below). Needs attention.'));
  blocks.push(mrkdwn_(lines.join('\n')));
  blocks.push(ctx_('A burst like this is usually one domain/provider — check the provider (Zapmail / Workspace) first, then reconnect in Smartlead.'));
  return { text: (mention ? mention + ' ' : '') + '🔌 ' + list.length + ' mailboxes need attention', blocks: blocks };
}
function mbRecovered_(b) { return { text: '✅ Mailbox back online: ' + b.email, blocks: [mrkdwn_('✅ *' + b.email + '* is back online (was: ' + b.label + ').')] }; }
function campCard_(a, mention) {
  var client = clientOf_(a.c.name), rate = Math.round(a.rate * 1000) / 10;
  var blocks = [header_('⛔ Campaign Paused — High Bounce')];
  if (mention) blocks.push(mrkdwn_(mention + ' ⛔ *' + a.c.name + '* (' + client + ') was paused with *' + rate + '% bounce*. Check now.'));
  blocks.push({ type: 'section', fields: [
    { type: 'mrkdwn', text: '🏷️ *Client*\n' + client },
    { type: 'mrkdwn', text: '🎯 *Campaign*\n' + a.c.name },
    { type: 'mrkdwn', text: '📉 *Bounce (last ' + H_WINDOW_() + 'd)*\n' + rate + '% (' + fmt_(a.b) + '/' + fmt_(a.sent) + ')' },
    { type: 'mrkdwn', text: '⛔ *Status*\nPAUSED' }] });
  blocks.push(ctx_('Paused after bounce crossed the safe limit (auto-protect ≈ ' + Math.round(H_THRESH_() * 100) + '%). Review the list + mailboxes before resuming.'));
  return { text: (mention ? mention + ' ' : '') + '⛔ Campaign paused (high bounce): ' + a.c.name, blocks: blocks };
}
function firstRunSummary_(currentBroken, pausedCount) {
  var list = Object.keys(currentBroken).map(function (k) { return currentBroken[k]; });
  var byKind = {}, byClient = {};
  list.forEach(function (b) { byKind[b.kind] = (byKind[b.kind] || 0) + 1; var c = clientLabel_(b); byClient[c] = (byClient[c] || 0) + 1; });
  var kindStr = Object.keys(byKind).map(function (k) { return byKind[k] + ' ' + k; }).join(', ') || 'none';
  var clientStr = Object.keys(byClient).map(function (c) { return c + ' (' + byClient[c] + ')'; }).join(', ') || 'none';
  var blocks = [
    header_('🩺 Health Alerts Are Now Live'),
    mrkdwn_("I'll post an instant " + H_MENTION_().replace('<!channel>', '@channel') + " ping here whenever a *mailbox goes down* (disconnected / needs reconnection / sending failing) or a *campaign is auto-paused for high bounce*, so the team can act fast."),
    mrkdwn_('*Current state* (seeded silently — no pings for these existing items):\n' +
      '• *Mailboxes needing attention:* ' + list.length + (list.length ? '  (' + kindStr + ')\n    by client: ' + clientStr : '') + '\n' +
      '• *Campaigns currently paused:* ' + pausedCount + '  _(informational; only NEW auto-pauses get pinged)_'),
    ctx_('Checked every ~5 min. From here you only get pinged on a NEW problem, plus a ✅ when a mailbox recovers.')];
  return { text: '🩺 Health alerts are now live — monitoring mailboxes + campaign auto-pauses.', blocks: blocks };
}
function computeHealth_(state) {
  var out = { firstRun: !state.seeded, newlyBroken: [], recovered: [], pausedAlerts: [], brokenCount: 0, pausedCount: 0, accountsPulled: 0, campsPulled: 0, currentBroken: {}, nowStatus: {} };
  var pull = allEmailAccounts_();
  var accounts = pull.accounts;
  out.accountsPulled = accounts.length; out.accountsComplete = pull.complete;
  if (accounts.length > 0 && pull.complete) { // only diff a COMPLETE pull (empty/partial = API hiccup, never "all recovered")
    var cur = brokenAccountsMap_(accounts);
    out.currentBroken = cur; out.brokenCount = Object.keys(cur).length;
    var d = diffBroken_(state.accounts || {}, cur);
    out.newlyBroken = d.newlyBroken; out.recovered = d.recovered;
  }
  var camps = campaigns_();
  out.campsPulled = camps.length;
  if (camps.length > 0) { // guard
    var ns = {}; camps.forEach(function (c) { ns[c.id] = c.status; });
    out.nowStatus = ns;
    out.pausedCount = camps.filter(function (c) { return c.status === 'PAUSED'; }).length;
    var jp = diffPaused_(state.campaigns || {}, camps);
    if (jp.length && !out.firstRun) {
      var start = ymd_(daysAgo_(H_WINDOW_())), end = ymd_(new Date());
      var data = batchGet_(jp.map(function (c) { return '/campaigns/' + c.id + '/analytics-by-date?start_date=' + start + '&end_date=' + end; }));
      jp.forEach(function (c, i) {
        var sent = num_(data[i] && data[i].sent_count), b = num_(data[i] && data[i].bounce_count);
        if (sent >= H_MINSENT_() && (b / sent) >= H_THRESH_()) out.pausedAlerts.push({ c: c, sent: sent, b: b, rate: b / sent });
      });
    }
  }
  return out;
}
function nextHealthState_(prev, h) {
  var s = { seeded: true, accounts: prev.accounts || {}, campaigns: prev.campaigns || {} };
  if (h.accountsPulled > 0 && h.accountsComplete) s.accounts = h.currentBroken;  // only when the pull was COMPLETE
  if (h.campsPulled > 0) s.campaigns = h.nowStatus;
  return s;
}
function healthAlertPoll() {
  var state = stateGet_('HealthState');
  var h = computeHealth_(state);
  var msgs = [], mention = H_MENTION_();
  if (h.firstRun) {
    msgs.push(firstRunSummary_(h.currentBroken, h.pausedCount)); // seed silently: one summary, no @channel
  } else {
    if (h.newlyBroken.length > H_MAXCARDS_()) msgs.push(mbSummaryCard_(h.newlyBroken, mention));
    else h.newlyBroken.forEach(function (b) { msgs.push(mbCard_(b, mention)); });
    h.recovered.forEach(function (b) { msgs.push(mbRecovered_(b)); });           // no @channel on recoveries
    h.pausedAlerts.forEach(function (a) { msgs.push(campCard_(a, mention)); });
  }
  msgs.forEach(function (m) { slackPost_(CH_('health-alerts'), m.text, m.blocks); });
  stateSet_('HealthState', nextHealthState_(state, h));
  // Piggyback the bounce check onto this 5-min poll so bounce coverage never depends solely on the
  // bounceCheck trigger's cadence (keeps the ≤15-min "every bounce" SLA even if that trigger is at a
  // slower interval or missing). Wrapped so a bounce error can never break health alerting.
  try { bounceCheck(); } catch (e) { console.log('piggyback bounceCheck error: ' + e); }
  console.log('healthAlertPoll firstRun=' + h.firstRun + ' accounts=' + h.accountsPulled + ' broken=' + h.brokenCount + ' newlyBroken=' + h.newlyBroken.length + ' recovered=' + h.recovered.length + ' camps=' + h.campsPulled + ' paused=' + h.pausedCount + ' pausedAlerts=' + h.pausedAlerts.length + ' posted=' + msgs.length);
}
// Manual eyeball: post one real sample of each card type (NO @channel, NO state write).
function test_healthPreview() {
  var h = computeHealth_({});
  var s = firstRunSummary_(h.currentBroken, h.pausedCount); slackPost_(CH_('health-alerts'), '[PREVIEW] ' + s.text, s.blocks);
  var keys = Object.keys(h.currentBroken);
  if (keys.length) { var m = mbCard_(h.currentBroken[keys[0]], ''); slackPost_(CH_('health-alerts'), '[PREVIEW — no @channel] ' + m.text, m.blocks); }
  else { slackPost_(CH_('health-alerts'), '[PREVIEW] No mailbox is currently failing (good news).'); }
  console.log('test_healthPreview posted to #smartlead-health-alerts (no @channel, no state).');
}

// ---------- state store (JSON blob in a sheet tab cell A1) ----------
function stateSheet_(tab) { var ss = SpreadsheetApp.openById(CFG_('STATE_SHEET_ID')); return ss.getSheetByName(tab) || ss.insertSheet(tab); }
function stateGet_(tab) { try { var v = stateSheet_(tab).getRange('A1').getValue(); return v ? JSON.parse(v) : {}; } catch (e) { return {}; } }
function stateSet_(tab, obj) { stateSheet_(tab).getRange('A1').setValue(JSON.stringify(obj)); }

// ---------- one-time setup: create state sheet (if needed) + install triggers ----------
function setup() {
  if (!CFG_('STATE_SHEET_ID')) {
    var ss = SpreadsheetApp.create('Smartlead Reports — State [Claude Code]');
    ['State', 'History', 'BounceState', 'CategorizedReplies'].forEach(function (t) { if (!ss.getSheetByName(t)) ss.insertSheet(t); });
    PropertiesService.getScriptProperties().setProperty('STATE_SHEET_ID', ss.getId());
  }
  setupTriggers();
  return 'setup complete — state sheet ' + CFG_('STATE_SHEET_ID');
}

// ---------- triggers (run once after config set) ----------
function setupTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (t) { ScriptApp.deleteTrigger(t); });
  var tz = tz_();
  ScriptApp.newTrigger('dailySendsReport').timeBased().atHour(8).everyDays(1).inTimezone(tz).create();
  ScriptApp.newTrigger('dailyLeadsReport').timeBased().atHour(8).everyDays(1).inTimezone(tz).create();
  ScriptApp.newTrigger('replyFollowupsReport').timeBased().atHour(8).everyDays(1).inTimezone(tz).create();
  ScriptApp.newTrigger('weeklyDigest').timeBased().onWeekDay(ScriptApp.WeekDay.SATURDAY).atHour(8).inTimezone(tz).create();
  ScriptApp.newTrigger('monthlyDigest').timeBased().onMonthDay(1).atHour(8).inTimezone(tz).create();
  ScriptApp.newTrigger('bounceCheck').timeBased().everyMinutes(10).create(); // near-real-time: every single bounce within ~10 min
  ScriptApp.newTrigger('staleInboxCheck').timeBased().everyHours(1).create();
  // Report 8 (interested-replies, 10-min log) is SUPERSEDED by report 9 (reply-alerts, 1-min @channel, 7 categories,
  // per-lead deep link, phone button, sheet). Retired by DEFAULT so hot leads don't double-post; the channel just goes
  // quiet (archive it whenever). Set Script Property KEEP_INTERESTED_POLL=1 to keep the old 10-min log running too.
  if (CFG_('KEEP_INTERESTED_POLL', '')) ScriptApp.newTrigger('interestedRepliesPoll').timeBased().everyMinutes(10).create();
  ScriptApp.newTrigger('replyAlertPoll').timeBased().everyMinutes(1).create(); // near-real-time @channel reply alert
  ScriptApp.newTrigger('phoneJobPoll').timeBased().everyMinutes(1).create();   // completes one-click phone enrich jobs (no-op until used)
  ScriptApp.newTrigger('healthAlertPoll').timeBased().everyMinutes(5).create(); // report 10: mailbox-down + campaign auto-pause alerts
}

// ---------- smoke tests (run manually from the editor) ----------
function test_ping_() { slackPost_(CH_('daily-sends-report'), '✅ Smartlead Reports connected — test ping.'); }
function test_dailySends() { dailySendsReport(); }
function test_weekly() { weeklyDigest(); }
function test_dailyLeads() { dailyLeadsReport(); }
function test_replyAlertPreview() { // posts ONE sample card (NO @channel) so you can confirm rendering after deploy
  var r = inboxReplies_(40).filter(isAlert_)[0];
  if (!r) { slackPost_(CH_('reply-alerts'), 'No positive reply in the newest 40 to preview right now (that is fine).'); return; }
  slackPost_(CH_('reply-alerts'), 'Reply-alert format preview (no @channel ping): ' + (r.name || r.email), [
    header_('🔥 New Reply: ' + r.client),
    { type: 'section', fields: [
      { type: 'mrkdwn', text: '👤 *Lead*\n' + (r.name || '—') }, { type: 'mrkdwn', text: '✉️ *Email*\n' + (r.email || '—') },
      { type: 'mrkdwn', text: '🎯 *Campaign*\n' + (r.campaign || '—') }, { type: 'mrkdwn', text: '🏷️ *Category*\n' + catName_(r.categoryId) },
      { type: 'mrkdwn', text: '🪜 *Step*\n' + (r.step || '—') }, { type: 'mrkdwn', text: '🕐 *Replied*\n' + ago_(r.at) }
    ] },
    mrkdwn_('👉 <' + SL_INBOX_URL + '|Open the Smartlead master inbox> and reply ASAP.')
  ]);
}
