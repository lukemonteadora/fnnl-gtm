#!/usr/bin/env node
// infra_digest_post.mjs — post ONE infra-spend digest to #cold-email-infra-spend via the the upstream workspace bot.
// Snapshot built from the Cold Email Mailbox Tracker (read 2026-06-30, gviz-verified). The recurring
// monthly version lives in the tracker's Apps Script (postInfraSpendDigest + monthly trigger); this
// node post delivers the first/live snapshot now without needing the Apps Script token/trigger.
// Reads SLACK_BOT_TOKEN from ../.env. Channel id passed below.
//
//   node infra_digest_post.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let TOKEN = process.env.SLACK_BOT_TOKEN;
if (!TOKEN) {
  const m = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').match(/^SLACK_BOT_TOKEN=(.+)$/m);
  if (m) TOKEN = m[1].trim();
}
if (!TOKEN) { console.error('No SLACK_BOT_TOKEN'); process.exit(1); }
// Fill in the Slack channel id this digest posts to (the #cold-email-infra-spend channel in your
// own workspace). Left as an obvious placeholder so an unconfigured run cannot post anywhere.
const CHANNEL = 'C0XXXXXXXXX';

const money = (n) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ---- snapshot: EMPTY BY DESIGN. Fill these in from your own mailbox tracker before running. ----
// One row per client (plus any shared pool), shape:
//   { name: '<Client Label>', mbx: 0, dom: 0, monthly: 0 },
const clients = [];
const totMbx = 0, totDom = 0;                    // totals across the rows above
const mbxCost = 0, domCost = 0, serverCost = 0;  // monthly mailbox / domain (amortized) / server cost
const runRate = 0;               // mailboxes + domains(amortized) + servers
const newDomainsThisMonth = 0;   // distinct domains with Created Date in this calendar month
const domYr = 0;                 // per-domain annual registration price
const newDomCash = newDomainsThisMonth * domYr;
const recurringCash = mbxCost + serverCost;

// Refuse to post an unconfigured (empty / all-zero) digest to an unconfigured channel.
if (!clients.length || CHANNEL === 'C0XXXXXXXXX') {
  console.error('infra_digest_post.mjs is unconfigured: set CHANNEL to a real Slack channel id and fill in the snapshot rows and totals above. Refusing to post an empty digest.');
  process.exit(2);
}

const pad = (s, w, right) => { s = String(s); if (s.length > w) s = s.slice(0, w); const sp = ' '.repeat(Math.max(0, w - s.length)); return right ? sp + s : s + sp; };
const tbl = [pad('Client', 14) + ' ' + pad('Mbx', 4, true) + '  ' + pad('Dom', 4, true) + '  ' + pad('Monthly', 10, true)];
for (const c of clients) tbl.push(pad(c.name, 14) + ' ' + pad(c.mbx, 4, true) + '  ' + pad(c.dom, 4, true) + '  ' + pad(money(c.monthly), 10, true));
tbl.push(pad('TOTAL', 14) + ' ' + pad(totMbx, 4, true) + '  ' + pad(totDom, 4, true) + '  ' + pad(money(runRate), 10, true));

const title = 'Cold Email Infrastructure — June 2026';
const blocks = [
  { type: 'header', text: { type: 'plain_text', text: '📊 ' + title, emoji: true } },
  { type: 'section', text: { type: 'mrkdwn', text: '*What the live email infrastructure costs right now (monthly run-rate):* ' + money(runRate) + ' /mo\n• Mailboxes: ' + money(mbxCost) + ' /mo  (' + totMbx + ' mailboxes)\n• Domains: ' + money(domCost) + ' /mo  (' + totDom + ' domains, annual cost spread over the year)\n• Servers: ' + money(serverCost) + ' /mo' } },
  { type: 'section', text: { type: 'mrkdwn', text: '*Cash actually going out this month:*\n• New domains registered this month: ' + money(newDomCash) + '  (' + newDomainsThisMonth + ' domains × ' + money(domYr) + ')\n• Recurring mailbox + server bills: ' + money(recurringCash) + ' /mo' } },
  { type: 'section', text: { type: 'mrkdwn', text: '```' + tbl.join('\n') + '```' } },
  { type: 'context', elements: [{ type: 'mrkdwn', text: 'Live snapshot from the Cold Email Mailbox Tracker. This will post automatically on the 1st of each month once the scheduled trigger is switched on. Run-rate = ongoing monthly cost; cash this month = money actually leaving this month.' }] },
];

const r = await fetch('https://slack.com/api/chat.postMessage', {
  method: 'POST',
  headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ channel: CHANNEL, text: title, blocks, unfurl_links: false }),
});
const b = await r.json();
if (!b.ok) { console.error('Slack error:', b.error); process.exit(1); }
console.log('posted infra digest to ' + CHANNEL + ' (ts ' + b.ts + ')');
