#!/usr/bin/env node
// Upload a rendered .docx to Google Drive as a NATIVE, formatted Google Doc.
// Find-or-update by title, so re-rendering a brief updates the SAME Doc (stable link).
//
//   node scripts/docx_to_gdoc.mjs --in "profiles/<client-slug>/Campaign Approval Brief - <Client>.docx" \
//                                 --title "Campaign Approval Brief - <Client>"  [--folder <id>]
//
// Requires in scripts/.env (one-time setup — see docs/gdoc-export-setup.md):
//   GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REFRESH_TOKEN
// Optional: GDRIVE_FOLDER_ID  (target Drive folder; auto-created on first run and printed).
//
// Prints "CREATED <url>" or "UPDATED <url>" — the native Google Doc link.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const GDOC = 'application/vnd.google-apps.document';
const FOLDER = 'application/vnd.google-apps.folder';
// Drive folder the exported Docs land in (created on first run). Rename it here to change it.
const FOLDER_NAME = 'FNNL Agency - Cold Outbound';

function loadEnv() {
  const out = {};
  try {
    const raw = readFileSync(path.join(SCRIPT_DIR, '.env'), 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      if (line.trim().startsWith('#')) continue;
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch { /* no .env */ }
  return out;
}
const env = { ...loadEnv(), ...process.env };
const arg = (n, d = null) => { const i = process.argv.indexOf('--' + n); return i >= 0 ? process.argv[i + 1] : d; };

const inPath = arg('in');
const title = arg('title');
let folderId = arg('folder') || env.GDRIVE_FOLDER_ID || '';
if (!inPath || !title) {
  console.error('Usage: node docx_to_gdoc.mjs --in <docx> --title <name> [--folder <id>]');
  process.exit(1);
}
const CID = env.GOOGLE_OAUTH_CLIENT_ID, CS = env.GOOGLE_OAUTH_CLIENT_SECRET, RT = env.GOOGLE_OAUTH_REFRESH_TOKEN;
if (!CID || !CS || !RT) {
  console.error('Missing Google OAuth creds in scripts/.env. Run gdoc_auth.mjs first — see docs/gdoc-export-setup.md.');
  process.exit(2); // distinct code so callers can treat "not set up yet" as a soft-skip
}

async function accessToken() {
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: CID, client_secret: CS, refresh_token: RT, grant_type: 'refresh_token' }),
  }).then(r => r.json());
  if (!r.access_token) throw new Error('token refresh failed: ' + JSON.stringify(r));
  return r.access_token;
}
async function api(at, url, opts = {}) {
  const r = await fetch(url, { ...opts, headers: { authorization: 'Bearer ' + at, ...(opts.headers || {}) } });
  const t = await r.text();
  if (!r.ok) throw new Error(`Drive API ${r.status}: ${t}`);
  return t ? JSON.parse(t) : {};
}
async function ensureFolder(at) {
  if (folderId) return folderId;
  const q = encodeURIComponent(`name='${FOLDER_NAME}' and mimeType='${FOLDER}' and trashed=false`);
  const found = await api(at, `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)`);
  if (found.files && found.files.length) folderId = found.files[0].id;
  else {
    const made = await api(at, 'https://www.googleapis.com/drive/v3/files?fields=id', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: FOLDER_NAME, mimeType: FOLDER }),
    });
    folderId = made.id;
  }
  console.error(`NOTE: pin the folder by adding to scripts/.env →  GDRIVE_FOLDER_ID=${folderId}`);
  return folderId;
}
async function findExisting(at, fid) {
  const safe = title.replace(/'/g, "\\'");
  const q = encodeURIComponent(`name='${safe}' and '${fid}' in parents and mimeType='${GDOC}' and trashed=false`);
  const r = await api(at, `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,webViewLink)`);
  return (r.files && r.files[0]) || null;
}
function multipart(meta, bytes) {
  const boundary = 'fnnl-' + Math.random().toString(16).slice(2);
  const head = Buffer.from(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n` +
    `--${boundary}\r\nContent-Type: ${DOCX}\r\n\r\n`);
  const tail = Buffer.from(`\r\n--${boundary}--`);
  return { body: Buffer.concat([head, bytes, tail]), contentType: `multipart/related; boundary=${boundary}` };
}

(async () => {
  const at = await accessToken();
  const fid = await ensureFolder(at);
  const bytes = readFileSync(path.resolve(inPath));
  const existing = await findExisting(at, fid);
  if (existing) {
    // Replace content in place → keeps the same link; Drive re-converts the .docx into the Doc.
    const r = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${existing.id}?uploadType=media&fields=id,webViewLink`, {
      method: 'PATCH', headers: { authorization: 'Bearer ' + at, 'content-type': DOCX }, body: bytes,
    });
    const t = await r.text();
    if (!r.ok) throw new Error(`update ${r.status}: ${t}`);
    console.log('UPDATED ' + (JSON.parse(t).webViewLink || existing.webViewLink));
  } else {
    const mp = multipart({ name: title, parents: [fid], mimeType: GDOC }, bytes);
    const r = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', {
      method: 'POST', headers: { authorization: 'Bearer ' + at, 'content-type': mp.contentType }, body: mp.body,
    });
    const t = await r.text();
    if (!r.ok) throw new Error(`create ${r.status}: ${t}`);
    console.log('CREATED ' + JSON.parse(t).webViewLink);
  }
})().catch(e => { console.error('ERROR: ' + e.message); process.exit(1); });
