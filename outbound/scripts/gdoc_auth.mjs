#!/usr/bin/env node
// One-time Google OAuth consent → captures a refresh token for the Google Docs auto-export.
//
//   node scripts/gdoc_auth.mjs
//
// Reads GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET from scripts/.env (or the
// environment), opens the Google consent screen, and prints a GOOGLE_OAUTH_REFRESH_TOKEN
// line to paste back into scripts/.env. Full setup steps: reference/gdoc-export-setup.md.
import http from 'node:http';
import { URL, fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { exec } from 'node:child_process';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const out = {};
  try {
    const raw = readFileSync(path.join(SCRIPT_DIR, '.env'), 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      if (line.trim().startsWith('#')) continue;
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch { /* no .env yet */ }
  return out;
}

const env = { ...loadEnv(), ...process.env };
const CLIENT_ID = env.GOOGLE_OAUTH_CLIENT_ID;
const CLIENT_SECRET = env.GOOGLE_OAUTH_CLIENT_SECRET;
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Missing GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET in scripts/.env.');
  console.error('See reference/gdoc-export-setup.md (steps 1–4) to create an OAuth client first.');
  process.exit(1);
}

const PORT = 42813;
const REDIRECT = `http://localhost:${PORT}`;
// drive.file = least privilege: the script can only touch files IT creates (the export folder + Docs).
const SCOPE = 'https://www.googleapis.com/auth/drive.file';
const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
  client_id: CLIENT_ID,
  redirect_uri: REDIRECT,
  response_type: 'code',
  scope: SCOPE,
  access_type: 'offline',
  prompt: 'consent',
}).toString();

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, REDIRECT);
  const code = u.searchParams.get('code');
  if (!code) { res.writeHead(400); res.end('Waiting for Google authorization…'); return; }
  try {
    const tok = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code, client_id: CLIENT_ID, client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT, grant_type: 'authorization_code',
      }),
    }).then(r => r.json());
    if (tok.refresh_token) {
      res.writeHead(200, { 'content-type': 'text/html' });
      res.end('<h2>Done — refresh token captured. Return to the terminal.</h2>');
      console.log('\n=== SUCCESS — add this line to scripts/.env ===\n');
      console.log('GOOGLE_OAUTH_REFRESH_TOKEN=' + tok.refresh_token + '\n');
      console.log('Then test:  node scripts/docx_to_gdoc.mjs --in "<some.docx>" --title "Test"');
    } else {
      res.writeHead(200); res.end('No refresh_token returned. Revoke prior access at myaccount.google.com → Security, then retry.');
      console.error('No refresh_token in response:', tok);
    }
  } catch (e) {
    res.writeHead(500); res.end('Error: ' + e.message);
    console.error(e);
  } finally {
    setTimeout(() => server.close(), 800);
  }
});

server.listen(PORT, () => {
  console.log('Opening the Google consent screen in your browser…');
  console.log('If it does not open, paste this URL:\n\n' + authUrl + '\n');
  const open = process.platform === 'win32' ? `start "" "${authUrl}"`
    : process.platform === 'darwin' ? `open "${authUrl}"` : `xdg-open "${authUrl}"`;
  exec(open);
});
