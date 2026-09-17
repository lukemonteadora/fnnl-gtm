#!/usr/bin/env node
// create-channels.mjs — create the smartlead-* Slack channels in YOUR workspace and print a
// CHANNELS_JSON map (name->id) for the Apps Script config + config.local.json. The bot auto-joins
// channels it creates, so it can post to them. Channels are created PRIVATE (operator preference) — the
// bot needs groups:write (+ groups:read); invite the team to each channel after creation.
// Portable: works against any workspace — the token (which workspace) is the only input.
//
//   SLACK_BOT_TOKEN=xoxb-... node create-channels.mjs
//   node create-channels.mjs xoxb-...            # token as arg
//
// Idempotent: if a channel already exists it is reused (looked up via conversations.list).

const TOKEN = process.env.SLACK_BOT_TOKEN || process.argv[2];
if (!TOKEN) { console.error('Provide the bot token via SLACK_BOT_TOKEN env or arg.'); process.exit(1); }

const REPORTS = [
  'daily-sends-report', 'daily-leads-report', 'weekly-digest', 'monthly-digest',
  'bounce-alerts', 'interested-replies', 'reply-followups', 'stale-inbox',
  'reply-alerts', // report 9: near-real-time @channel ping so the reply team acts ASAP
  'health-alerts', // report 10: mailbox-down/needs-reconnect + campaign auto-paused for high bounce
];
const NAMES = REPORTS.map((r) => 'smartlead-' + r);

async function slack(method, body) {
  const res = await fetch('https://slack.com/api/' + method, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body || {}),
  });
  return res.json();
}

async function listExisting() {
  const map = {};
  let cursor;
  do {
    const r = await slack('conversations.list', { exclude_archived: true, types: 'public_channel,private_channel', limit: 200, cursor });
    if (!r.ok) { console.error('conversations.list:', r.error); break; }
    r.channels.forEach((c) => { map[c.name] = c.id; });
    cursor = r.response_metadata && r.response_metadata.next_cursor;
  } while (cursor);
  return map;
}

(async () => {
  const existing = await listExisting();
  const out = {}; // report-key -> channel id  (keys match CHANNELS_JSON used by Code.gs)
  for (let i = 0; i < NAMES.length; i++) {
    const name = NAMES[i], key = REPORTS[i];
    if (existing[name]) { out[key] = existing[name]; console.log(`exists  ${name} -> ${existing[name]}`); continue; }
    const r = await slack('conversations.create', { name, is_private: true }); // private by default (operator preference)
    if (r.ok) { out[key] = r.channel.id; console.log(`created ${name} -> ${r.channel.id}`); }
    else { console.error(`FAILED  ${name}: ${r.error}`); }
    await new Promise((res) => setTimeout(res, 400)); // gentle on rate limits
  }
  console.log('\nCHANNELS_JSON (paste into Apps Script Script Properties):\n');
  console.log(JSON.stringify(out));
})();
