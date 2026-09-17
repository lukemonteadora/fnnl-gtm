#!/usr/bin/env node
// create-intel-channel.mjs — create the single PRIVATE #gtm-intel-daily channel for the
// daily creator/market-intelligence digest (the /daily-intel routine posts here).
// Private by operator hard rule (every new channel is_private:true). Bot auto-joins channels it creates.
// Reads SLACK_BOT_TOKEN from ../.env (same token the smartlead reporting uses). Idempotent.
//
//   node create-intel-channel.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env');
let TOKEN = process.env.SLACK_BOT_TOKEN;
if (!TOKEN && fs.existsSync(envPath)) {
  const m = fs.readFileSync(envPath, 'utf8').match(/^SLACK_BOT_TOKEN=(.+)$/m);
  if (m) TOKEN = m[1].trim();
}
if (!TOKEN) { console.error('No SLACK_BOT_TOKEN in env or ../.env'); process.exit(1); }

const NAME = 'gtm-intel-daily';

async function slack(method, body) {
  const res = await fetch('https://slack.com/api/' + method, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body || {}),
  });
  return res.json();
}

(async () => {
  // idempotent: reuse if it already exists
  let cursor, found;
  do {
    const r = await slack('conversations.list', { exclude_archived: true, types: 'public_channel,private_channel', limit: 200, cursor });
    if (!r.ok) { console.error('conversations.list:', r.error); break; }
    const hit = r.channels.find((c) => c.name === NAME);
    if (hit) { found = hit.id; break; }
    cursor = r.response_metadata && r.response_metadata.next_cursor;
  } while (cursor);

  if (found) { console.log(`exists  ${NAME} -> ${found}`); console.log(JSON.stringify({ channel: NAME, id: found })); return; }

  const r = await slack('conversations.create', { name: NAME, is_private: true });
  if (r.ok) { console.log(`created ${NAME} -> ${r.channel.id}`); console.log(JSON.stringify({ channel: NAME, id: r.channel.id })); }
  else { console.error(`FAILED ${NAME}: ${r.error}`); process.exit(1); }
})();
