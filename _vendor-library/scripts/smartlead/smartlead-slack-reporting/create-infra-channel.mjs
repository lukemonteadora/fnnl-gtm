#!/usr/bin/env node
// create-infra-channel.mjs — create the PRIVATE #cold-email-infra-spend channel for the monthly
// infra-spend digest (total email-infra run-rate + domain cash this month, from the Cold Email
// Mailbox Tracker). Private by operator hard rule. Mirrors the member list of #gtm-intel-daily so the
// team actually sees it (private channels are invisible until invited). Idempotent.
// Reads SLACK_BOT_TOKEN from ../.env.
//
//   node create-infra-channel.mjs
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

const NEW_NAME = 'cold-email-infra-spend';
const MIRROR_FROM = 'gtm-intel-daily'; // copy this channel's members into the new one

async function slack(method, body) {
  const res = await fetch('https://slack.com/api/' + method, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body || {}),
  });
  return res.json();
}

async function findChannel(name) {
  let cursor;
  do {
    const r = await slack('conversations.list', { exclude_archived: true, types: 'public_channel,private_channel', limit: 200, cursor });
    if (!r.ok) { console.error('conversations.list:', r.error); return null; }
    const hit = r.channels.find((c) => c.name === name);
    if (hit) return hit.id;
    cursor = r.response_metadata && r.response_metadata.next_cursor;
  } while (cursor);
  return null;
}

async function members(channelId) {
  const out = []; let cursor;
  do {
    const r = await slack('conversations.members', { channel: channelId, limit: 200, cursor });
    if (!r.ok) { console.error('conversations.members:', r.error); break; }
    out.push(...r.members);
    cursor = r.response_metadata && r.response_metadata.next_cursor;
  } while (cursor);
  return out;
}

(async () => {
  // 1. create-or-reuse the new private channel
  let id = await findChannel(NEW_NAME);
  if (id) {
    console.log(`exists  ${NEW_NAME} -> ${id}`);
  } else {
    const r = await slack('conversations.create', { name: NEW_NAME, is_private: true });
    if (!r.ok) { console.error(`FAILED create ${NEW_NAME}: ${r.error}`); process.exit(1); }
    id = r.channel.id;
    console.log(`created ${NEW_NAME} -> ${id}`);
  }

  // 2. mirror members from the intel channel so the team sees it
  const srcId = await findChannel(MIRROR_FROM);
  if (!srcId) {
    console.log(`(could not find #${MIRROR_FROM} to mirror members from — channel created, invite the team manually)`);
  } else {
    const srcMembers = await members(srcId);
    const already = new Set(await members(id));
    const toInvite = srcMembers.filter((u) => !already.has(u));
    if (toInvite.length) {
      // conversations.invite accepts up to 1000 users; batch to be safe
      for (let i = 0; i < toInvite.length; i += 100) {
        const batch = toInvite.slice(i, i + 100);
        const r = await slack('conversations.invite', { channel: id, users: batch.join(',') });
        if (!r.ok && r.error !== 'already_in_channel') console.error('invite:', r.error, r.errors || '');
      }
      console.log(`invited ${toInvite.length} member(s) mirrored from #${MIRROR_FROM}`);
    } else {
      console.log(`all #${MIRROR_FROM} members already in #${NEW_NAME}`);
    }
  }

  console.log(JSON.stringify({ channel: NEW_NAME, id }));
})();
