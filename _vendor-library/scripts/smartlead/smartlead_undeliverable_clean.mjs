#!/usr/bin/env node
/**
 * smartlead_undeliverable_clean.mjs  (2026-06-22, operator goal)
 *
 * Re-verify EVERY in-campaign email through Deliverable.co and remove only the leads
 * Deliverable.co confirms `undeliverable` (raw status) from the Smartlead campaign,
 * mirroring the removal into the repo CSVs + the client suppression list.
 *
 * SOURCE OF TRUTH = Smartlead LIVE leads (not the CSVs — they don't 1:1 map to campaigns).
 * REMOVAL CRITERION = deliverable_raw_status === 'undeliverable' ONLY.
 *   catch_all / risky / unknown / timeout / rate_limited STAY (never removed).
 *
 * Stages (run in order, per client):
 *   1) pull  <client>   GET all live leads/campaign -> _verify/<client>/<slug>.<cid>.leads.csv
 *                       (cols: lead_id,email,first_name,last_name,company_name)
 *   2) (verify)         for each leads.csv: node deliverable_verify.mjs <leads.csv>
 *                       -> <slug>.<cid>.leads.deliverable.csv  (adds email_status gate +
 *                          deliverable_raw_status + is_catch_all + verified_by)
 *   3) plan  <client>   read the .deliverable.csv files -> print per-campaign distribution +
 *                       write _verify/<client>/_undeliverable.csv (cid,slug,lead_id,email).
 *                       NO deletion. Flags any campaign whose verify looks failed
 *                       (>=50% unknown/timeout/rate_limited -> re-verify, don't conclude 0).
 *   4) apply <client>   for each _undeliverable row: DELETE from Smartlead, snapshot to
 *                       <dir>/leads.removed-undeliverable-<date>.csv, remove from the send CSV
 *                       + leads.verified.csv (backup .pre-undeliv-bak), append to
 *                       profiles/<client>/suppression-list.csv (reason=bounce). Prints summary.
 *
 * client = <client-slug> (register it in PROFILE_DIR + CAMPAIGNS below before running)
 */
import fs from 'fs';

const BASE = 'https://server.smartlead.ai/api/v1';
const env = fs.readFileSync(new URL('./.env', import.meta.url), 'utf8');
const KEY = (env.match(/^SMARTLEAD_API_KEY=(.*)$/m) || [])[1].trim();
if (!KEY) { console.error('FATAL: SMARTLEAD_API_KEY missing in scripts/.env'); process.exit(1); }
const PROFILES = new URL('../profiles/', import.meta.url);
const VERIFY = new URL('../profiles/_verify/', import.meta.url);

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const today = () => new Date().toISOString().slice(0, 10);

async function api(method, p, body) {
  const sep = p.includes('?') ? '&' : '?';
  for (let attempt = 0; attempt < 4; attempt++) {
    const r = await fetch(`${BASE}${p}${sep}api_key=${KEY}`, {
      method, headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    const t = await r.text(); let j; try { j = JSON.parse(t); } catch { j = t; }
    if (r.status === 429) { await sleep(1500 * (attempt + 1)); continue; }
    return { status: r.status, j };
  }
  return { status: 429, j: 'rate_limited' };
}

// ---- minimal CSV ----
function parseCSV(t) {
  const rows = []; let i = 0, f = '', row = [], q = false;
  while (i < t.length) { const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i += 2; continue; } q = false; i++; continue; } f += c; i++; continue; }
    if (c === '"') { q = true; i++; continue; }
    if (c === ',') { row.push(f); f = ''; i++; continue; }
    if (c === '\r') { i++; continue; }
    if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; i++; continue; }
    f += c; i++; }
  if (f.length || row.length) { row.push(f); rows.push(row); }
  return rows.filter(r => r.length && !(r.length === 1 && r[0] === ''));
}
const cell = (v) => { v = v == null ? '' : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
const toCSV = (rows) => rows.map(r => r.map(cell).join(',')).join('\n') + '\n';
const colIdx = (h, ...names) => { for (const n of names) { const i = h.findIndex(x => x && x.toLowerCase() === n.toLowerCase()); if (i >= 0) return i; } return -1; };
const normEmail = s => (s || '').trim().toLowerCase();

// ---- campaign map ----
// BOTH MAPS ARE EMPTY BY DESIGN. Register a client in BOTH before running.
// PROFILE_DIR maps the client slug you pass on the command line to its folder under profiles/:
//   '<client-slug>': '<profile-folder-name>',
const PROFILE_DIR = {};
// CAMPAIGNS maps the same client slug to that client's Smartlead campaigns. `cid` is the campaign
// id, `slug` is the campaign folder under profiles/<profile-folder-name>/campaigns/, `send` is the
// send CSV filename inside that folder, and the optional `live` flag only tags a campaign as
// actively sending (it is printed in the logs). Shape:
//   '<client-slug>': [
//     { cid: 000000, slug: '<campaign-slug>', send: 'leads.verified.csv' },
//   ],
const CAMPAIGNS = {};

function ensureDir(url) { fs.mkdirSync(url, { recursive: true }); }
function vpath(client, name) { return new URL(`./${client}/${name}`, VERIFY); }

async function fetchLeads(cid) {
  let all = [], off = 0;
  while (true) {
    const { j, status } = await api('GET', `/campaigns/${cid}/leads?offset=${off}&limit=100`);
    if (status !== 200) throw new Error(`list leads cid ${cid} HTTP ${status}: ${JSON.stringify(j).slice(0, 200)}`);
    const arr = j.data || [];
    all = all.concat(arr);
    if (arr.length < 100) break;
    off += 100; if (off > 50000) break;
  }
  return all;
}

// ---- STAGE 1: pull ----
async function pull(client) {
  ensureDir(vpath(client, ''));
  const camps = CAMPAIGNS[client];
  let grand = 0;
  for (const c of camps) {
    const items = await fetchLeads(c.cid);
    const rows = [['lead_id', 'email', 'first_name', 'last_name', 'company_name', 'status']];
    let withEmail = 0;
    for (const it of items) {
      const L = it.lead || {};
      const email = (L.email || '').trim();
      if (!email) continue;
      withEmail++;
      rows.push([L.id, email, L.first_name || '', L.last_name || '', L.company_name || '', it.status || '']);
    }
    fs.writeFileSync(vpath(client, `${c.slug}.${c.cid}.leads.csv`), toCSV(rows));
    grand += withEmail;
    console.log(`pull ${c.slug} (#${c.cid})${c.live ? ' [LIVE]' : ''}: ${items.length} leads, ${withEmail} with email`);
  }
  console.log(`TOTAL ${client}: ${grand} emails to verify across ${camps.length} campaigns`);
}

// ---- STAGE 3: plan ----
function plan(client) {
  const camps = CAMPAIGNS[client];
  const undeliv = [['cid', 'slug', 'lead_id', 'email']];
  let totU = 0, totV = 0;
  const flags = [];
  for (const c of camps) {
    const f = vpath(client, `${c.slug}.${c.cid}.leads.deliverable.csv`);
    if (!fs.existsSync(f)) { console.log(`plan ${c.slug}: MISSING ${c.slug}.${c.cid}.leads.deliverable.csv — run verify first`); continue; }
    const rows = parseCSV(fs.readFileSync(f, 'utf8'));
    const h = rows[0];
    const iLead = colIdx(h, 'lead_id'), iEmail = colIdx(h, 'email'), iRaw = colIdx(h, 'deliverable_raw_status'), iGate = colIdx(h, 'email_status');
    const dist = {};
    let n = 0;
    for (const r of rows.slice(1)) {
      const gate = (r[iGate] || '').trim() || 'blank';
      dist[gate] = (dist[gate] || 0) + 1; n++;
      if ((r[iRaw] || '').trim() === 'undeliverable') { undeliv.push([c.cid, c.slug, r[iLead], r[iEmail]]); totU++; }
    }
    totV += n;
    const bad = (dist.unknown || 0) + (dist.timeout || 0) + (dist.rate_limited || 0);
    const u = dist.invalid || 0;
    const pctU = n ? (100 * u / n).toFixed(1) : '0';
    let flag = '';
    if (n && bad / n >= 0.5) { flag = '  ⚠ VERIFY-SUSPECT (>=50% unknown/timeout — re-verify, do NOT conclude)'; flags.push(c.slug); }
    if (n && u / n >= 0.25) { flag += '  ⚠ HIGH-REMOVAL (>=25% invalid — over-read check)'; }
    console.log(`plan ${c.slug} (#${c.cid})${c.live ? ' [LIVE]' : ''}: n=${n} invalid(undeliverable)=${u} (${pctU}%) | ${JSON.stringify(dist)}${flag}`);
  }
  ensureDir(vpath(client, ''));
  fs.writeFileSync(vpath(client, '_undeliverable.csv'), toCSV(undeliv));
  console.log(`\nPLAN ${client}: ${totV} verified, ${totU} confirmed-undeliverable to remove -> _verify/${client}/_undeliverable.csv`);
  if (flags.length) console.log(`⚠ Re-verify these before apply (verify looked failed): ${flags.join(', ')}`);
}

// ---- STAGE 4: apply ----
function loadProfileCSV(relPath) {
  const url = new URL(relPath, PROFILES);
  if (!fs.existsSync(url)) return null;
  let t = fs.readFileSync(url, 'utf8');
  const bom = t.charCodeAt(0) === 0xFEFF; if (bom) t = t.slice(1);
  return { url, rows: parseCSV(t), bom };
}
function writeProfileCSV(url, rows, bom) { fs.writeFileSync(url, (bom ? '﻿' : '') + toCSV(rows)); }

async function apply(client) {
  // apply DELETEs leads before it writes its snapshot, so a half-registered client must never
  // get this far: without a PROFILE_DIR entry the snapshot/mirror paths would be nonsense.
  if (!PROFILE_DIR[client]) {
    const registered = Object.keys(PROFILE_DIR).join(' | ') || '(none yet)';
    console.error(`apply needs a profiles/ folder for '${client}': register it in the PROFILE_DIR map first. Registered so far: ${registered}`);
    process.exit(2);
  }
  const camps = CAMPAIGNS[client];
  const byCid = Object.fromEntries(camps.map(c => [String(c.cid), c]));
  const uf = vpath(client, '_undeliverable.csv');
  if (!fs.existsSync(uf)) { console.error(`No _undeliverable.csv — run plan first.`); process.exit(1); }
  const urows = parseCSV(fs.readFileSync(uf, 'utf8'));
  const uh = urows[0];
  const iCid = colIdx(uh, 'cid'), iSlug = colIdx(uh, 'slug'), iLead = colIdx(uh, 'lead_id'), iEmail = colIdx(uh, 'email');
  const data = urows.slice(1);
  if (!data.length) { console.log('Nothing to remove (0 undeliverable).'); return; }

  // group by cid
  const groups = {};
  for (const r of data) { (groups[r[iCid]] ||= []).push({ lead_id: r[iLead], email: r[iEmail], slug: r[iSlug] }); }

  const pdir = PROFILE_DIR[client];
  const date = today();
  let deleted = 0, gone = 0, failed = 0;
  const suppressionAdds = [];

  for (const cid of Object.keys(groups)) {
    const c = byCid[cid]; const list = groups[cid];
    console.log(`\napply ${c.slug} (#${cid})${c.live ? ' [LIVE]' : ''}: ${list.length} to remove`);
    const removedRows = [['lead_id', 'email', 'removed_date', 'reason', 'http']];
    const removedEmails = new Set();
    for (const it of list) {
      const { status } = await api('DELETE', `/campaigns/${cid}/leads/${it.lead_id}`);
      let outcome;
      if (status === 200) { deleted++; outcome = 'deleted'; }
      else if (status === 404) { gone++; outcome = 'already-gone'; }
      else { failed++; outcome = `FAIL-${status}`; }
      removedRows.push([it.lead_id, it.email, date, 'deliverable.co undeliverable', outcome]);
      if (status === 200 || status === 404) { removedEmails.add(normEmail(it.email)); suppressionAdds.push({ email: it.email, slug: c.slug }); }
      if (failed === 1 && status !== 200 && status !== 404) {
        console.error(`  ! first DELETE returned HTTP ${status} on lead ${it.lead_id} — ABORTING ${c.slug} to avoid hammering. Investigate the endpoint/id.`);
        break;
      }
    }
    // snapshot
    const snap = new URL(`${pdir}/campaigns/${c.slug}/leads.removed-undeliverable-${date}.csv`, PROFILES);
    fs.writeFileSync(snap, toCSV(removedRows));
    console.log(`  snapshot -> ${pdir}/campaigns/${c.slug}/leads.removed-undeliverable-${date}.csv (${removedRows.length - 1} rows)`);
    // mirror: remove from send CSV + leads.verified.csv
    const mirrors = [...new Set([c.send, 'leads.verified.csv'])];
    for (const m of mirrors) {
      const rel = `${pdir}/campaigns/${c.slug}/${m}`;
      const loaded = loadProfileCSV(rel);
      if (!loaded) continue;
      const { url, rows, bom } = loaded;
      const h = rows[0]; const ie = colIdx(h, 'email', 'work_email');
      if (ie < 0) { console.log(`  mirror ${m}: no email column, skipped`); continue; }
      const before = rows.length - 1;
      const kept = [h, ...rows.slice(1).filter(r => !removedEmails.has(normEmail(r[ie])))];
      const removed = before - (kept.length - 1);
      if (removed > 0) {
        fs.copyFileSync(url, new URL(rel + '.pre-undeliv-bak', PROFILES));
        writeProfileCSV(url, kept, bom);
      }
      console.log(`  mirror ${m}: removed ${removed} of ${before}`);
    }
  }

  // suppression list (client-wide)
  if (suppressionAdds.length) {
    const rel = `${pdir}/suppression-list.csv`;
    const url = new URL(rel, PROFILES);
    let rows, bom = false;
    if (fs.existsSync(url)) { const l = loadProfileCSV(rel); rows = l.rows; bom = l.bom; }
    else { rows = [['email', 'company_domain', 'linkedin_url', 'company_name', 'reason', 'source_campaign', 'date_added']]; }
    const h = rows[0];
    const ie = colIdx(h, 'email');
    const existing = new Set(rows.slice(1).map(r => normEmail(r[ie])));
    let added = 0;
    for (const s of suppressionAdds) {
      if (existing.has(normEmail(s.email))) continue;
      existing.add(normEmail(s.email));
      const row = new Array(h.length).fill('');
      const set = (name, val) => { const i = colIdx(h, name); if (i >= 0) row[i] = val; };
      set('email', s.email); set('reason', 'bounce'); set('source_campaign', s.slug); set('date_added', date);
      rows.push(row); added++;
    }
    if (added) writeProfileCSV(url, rows, bom);
    console.log(`\nsuppression-list.csv: +${added} (reason=bounce, confirmed undeliverable by Deliverable.co)`);
  }
  console.log(`\nAPPLY ${client} DONE: deleted=${deleted} already-gone=${gone} failed=${failed}`);
}

// ---- CLI ----
const mode = process.argv[2], client = process.argv[3];
if (!['pull', 'plan', 'apply'].includes(mode) || !CAMPAIGNS[client]) {
  const registered = Object.keys(CAMPAIGNS).join(' | ') || '(none yet)';
  console.error(`usage: node smartlead_undeliverable_clean.mjs <pull|plan|apply> <client-slug> (register the client in the CAMPAIGNS map first). Registered so far: ${registered}`);
  process.exit(2);
}
(async () => {
  if (mode === 'pull') await pull(client);
  else if (mode === 'plan') plan(client);
  else if (mode === 'apply') await apply(client);
})().catch(e => { console.error('ERROR:', e.message); process.exitCode = 1; });
