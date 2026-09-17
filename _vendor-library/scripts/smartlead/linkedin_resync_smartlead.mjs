#!/usr/bin/env node
/**
 * linkedin_resync_smartlead.mjs
 * Push LinkedIn URLs that ALREADY exist in a campaign's lead CSV into Smartlead's
 * native `linkedin_profile` field (metadata-only upsert by email — preserves all
 * existing custom_fields incl. email_* copy; never duplicates).
 *
 * Source of truth per lead = CSV linkedin column; if the CSV cell is blank but the
 * Smartlead custom `linkedin_url` field already holds a value, that is used as fallback.
 * Only writes when we HAVE a value and the native field is empty or differs.
 *
 * Usage:  node linkedin_resync_smartlead.mjs <client-slug>        # register the client in MAP first
 *         node linkedin_resync_smartlead.mjs <client-slug> --dry  # report only, no writes
 */
import fs from 'fs';

const BASE = 'https://server.smartlead.ai/api/v1';
const env = fs.readFileSync(new URL('./.env', import.meta.url), 'utf8');
const KEY = (env.match(/^SMARTLEAD_API_KEY=(.*)$/m) || [])[1].trim();
const PROFILES = new URL('../profiles/', import.meta.url);

const api = async (m, p, b) => {
  const sep = p.includes('?') ? '&' : '?';
  const r = await fetch(`${BASE}${p}${sep}api_key=${KEY}`, {
    method: m, headers: { 'Content-Type': 'application/json' },
    body: b ? JSON.stringify(b) : undefined,
  });
  const t = await r.text(); let j; try { j = JSON.parse(t); } catch { j = t; }
  return { status: r.status, j };
};

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
  return rows;
}
function loadCSV(path) {
  let t = fs.readFileSync(new URL(path, PROFILES), 'utf8');
  if (t.charCodeAt(0) === 0xFEFF) t = t.slice(1);
  const rows = parseCSV(t); const h = rows[0] || [];
  return { h, data: rows.slice(1).filter(r => r.some(c => c && c.trim())) };
}
const ci = (h, ...names) => { for (const n of names) { const i = h.findIndex(x => x && x.toLowerCase() === n); if (i >= 0) return i; } return -1; };
const normEmail = s => (s || '').trim().toLowerCase();
const looksLinkedIn = s => /linkedin\.com\/(in|company|pub)\//i.test(s || '');

// client -> [{cid, csv}]
// EMPTY BY DESIGN. Register every client here before running. The key is the client slug you pass
// on the command line, `cid` is that campaign's Smartlead campaign id, and `csv` is the lead CSV
// path relative to profiles/. Shape:
//   '<client-slug>': [
//     { cid: 000000, csv: '<client-slug>/campaigns/<campaign-slug>/leads.send.csv' },
//   ],
const MAP = {};

async function fetchLeads(cid) {
  let all = [], off = 0;
  while (true) {
    const { j } = await api('GET', `/campaigns/${cid}/leads?offset=${off}&limit=100`);
    const arr = j.data || []; all = all.concat(arr);
    if (arr.length < 100) break; off += 100; if (off > 5000) break;
  }
  return all.map(x => x.lead || x);
}

async function run() {
  const client = process.argv[2];
  const dry = process.argv.includes('--dry');
  if (!MAP[client]) {
    const registered = Object.keys(MAP).join(' | ') || '(none yet)';
    console.error(`usage: node linkedin_resync_smartlead.mjs <client-slug> [--dry] (register the client in the MAP first). Registered so far: ${registered}`);
    process.exit(1);
  }
  console.log(`\n=== LinkedIn re-sync → Smartlead native field :: ${client} ${dry ? '(DRY RUN)' : ''} ===`);
  let gTot = 0, gSet = 0, gAlready = 0, gNoVal = 0;
  for (const { cid, csv } of MAP[client]) {
    const { h, data } = loadCSV(csv);
    const liCol = ci(h, 'linkedin_url', 'linkedin', 'linkedin_profile');
    const emCols = [ci(h, 'email'), ci(h, 'bc_email'), ci(h, 'work_email')].filter(i => i >= 0);
    // email -> linkedin (from CSV)
    const csvLi = new Map();
    for (const r of data) {
      const url = liCol >= 0 ? (r[liCol] || '').trim() : '';
      if (!url) continue;
      for (const ec of emCols) { const e = normEmail(r[ec]); if (e) csvLi.set(e, url); }
    }
    const leads = await fetchLeads(cid);
    let matched = 0, toSet = [], already = 0, noVal = 0;
    for (const L of leads) {
      const e = normEmail(L.email);
      let url = csvLi.get(e);
      if (!url) {
        // fallback to existing custom linkedin_url already on the lead
        let cf = L.custom_fields; if (typeof cf === 'string') { try { cf = JSON.parse(cf); } catch { cf = {}; } }
        if (cf && looksLinkedIn(cf.linkedin_url)) url = cf.linkedin_url.trim();
      } else matched++;
      if (!url) { noVal++; continue; }
      const cur = (L.linkedin_profile || '').trim();
      if (cur === url) { already++; continue; }
      toSet.push({ email: L.email, linkedin_profile: url });
    }
    gTot += leads.length; gAlready += already; gNoVal += noVal;
    console.log(`cid ${cid}  ${csv.split('/').slice(-2)[0]}: leads=${leads.length} csvEmailMatch=${matched} toSet=${toSet.length} alreadyNative=${already} noValue=${noVal}`);
    if (!dry) {
      for (let i = 0; i < toSet.length; i += 100) {
        const batch = toSet.slice(i, i + 100);
        const up = await api('POST', `/campaigns/${cid}/leads`, { lead_list: batch, settings: { ignore_global_block_list: false, ignore_unsubscribe_list: false, ignore_duplicate_leads_in_other_campaign: false } });
        if (up.status !== 200) console.log(`   ! batch upsert status ${up.status}: ${JSON.stringify(up.j).slice(0, 200)}`);
      }
      gSet += toSet.length;
    }
  }
  console.log(`\nTOTAL: leads=${gTot} ${dry ? 'wouldSet' : 'set'}=${dry ? '(dry)' : gSet} alreadyNative=${gAlready} noValue=${gNoVal}`);
}
run().catch(e => { console.error(e); process.exit(1); });
