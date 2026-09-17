#!/usr/bin/env node
/**
 * linkedin_merge_apply.mjs — fold found LinkedIn URLs back into the lead CSVs.
 *
 * Per campaign, gathers found URLs from (in priority order):
 *   _linkedin_aleads.csv, _linkedin_aleads_b.csv  (A-Leads pass — highest trust, structured DB)
 *   _linkedin_web.csv                              (Serper+OpenAI verified residue pass)
 * then writes linkedin_url into the campaign's lead CSV(s) for rows that are currently blank.
 * RFC-4180 writer preserves the multi-line email_* body cells.
 *
 *   node linkedin_merge_apply.mjs <client-slug>        # must be registered in MAP below
 *   node linkedin_merge_apply.mjs <client-slug> --dry
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROF = path.join(__dirname, '../profiles');
const Q = String.fromCharCode(34);
function parseCSV(t) { const rows = []; let i = 0, f = '', row = [], q = false; while (i < t.length) { const c = t[i]; if (q) { if (c === Q) { if (t[i + 1] === Q) { f += Q; i += 2; continue; } q = false; i++; continue; } f += c; i++; continue; } if (c === Q) { q = true; i++; continue; } if (c === ',') { row.push(f); f = ''; i++; continue; } if (c === '\r') { i++; continue; } if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; i++; continue; } f += c; i++; } if (f.length || row.length) { row.push(f); rows.push(row); } return rows; }
const esc = v => { const s = String(v ?? ''); return /[",\r\n]/.test(s) ? Q + s.replace(/"/g, Q + Q) + Q : s; };
const writeCSV = (h, rows) => [h, ...rows].map(r => r.map(esc).join(',')).join('\n') + '\n';
const norm = s => (s || '').toLowerCase().trim();
const ci = (h, ...names) => { for (const n of names) { const i = h.findIndex(x => x && x.toLowerCase() === n); if (i >= 0) return i; } return -1; };

// client -> {dir, slugs:[campaign slug], leadFiles:[name in priority...]}  (first existing is updated; others too if present)
// Register each engagement here before running: `dir` is the folder under profiles/, `slugs` are the
// campaign folders inside it, `leadFiles` are the lead CSVs to fill (highest priority first).
// Example:
//   'example-co': { dir: 'example-co', slugs: ['campaign-slug-a', 'campaign-slug-b'], leadFiles: ['leads.verified.csv'] },
const MAP = {
  // '<client-slug>': { dir: '<profile-folder>', slugs: ['<campaign-slug>'], leadFiles: ['leads.verified.csv'] },
};

function loadFound(dir) {
  const map = new Map(); // email -> {url, src}
  const add = (file, src) => {
    const p = path.join(dir, file); if (!fs.existsSync(p)) return;
    const rows = parseCSV(fs.readFileSync(p, 'utf8').replace(/^﻿/, '')); const h = rows[0] || [];
    const ei = ci(h, 'email'), li = ci(h, 'linkedin_url');
    if (ei < 0 || li < 0) return;
    for (const r of rows.slice(1)) { const e = norm(r[ei]); const u = (r[li] || '').trim(); if (e && u && !map.has(e)) map.set(e, { url: u, src }); }
  };
  // priority: A-Leads first, then web
  add('_linkedin_aleads.csv', 'aleads'); add('_linkedin_aleads_b.csv', 'aleads'); add('_linkedin_web.csv', 'web');
  return map;
}

const client = process.argv[2]; const dry = process.argv.includes('--dry');
if (!MAP[client]) { console.error('usage: linkedin_merge_apply.mjs <client-slug> [--dry]  (register the client in the MAP at the top of this file first). Registered so far: ' + (Object.keys(MAP).join(' | ') || '(none yet)')); process.exit(1); }
const cfg = MAP[client];
let gFilled = 0, gAleads = 0, gWeb = 0, gStill = 0;
for (const slug of cfg.slugs) {
  const dir = path.join(PROF, cfg.dir, 'campaigns', slug);
  const found = loadFound(dir);
  let perCampFilled = 0;
  for (const lf of cfg.leadFiles) {
    const p = path.join(dir, lf); if (!fs.existsSync(p)) continue;
    const rows = parseCSV(fs.readFileSync(p, 'utf8').replace(/^﻿/, '')); const h = rows[0]; const data = rows.slice(1);
    const li = ci(h, 'linkedin_url'); const ei = ci(h, 'email', 'bc_email');
    if (li < 0 || ei < 0) { console.log(`  ! ${slug}/${lf}: missing linkedin_url/email col`); continue; }
    let filled = 0;
    for (const r of data) {
      while (r.length <= li) r.push('');
      if (r[li] && r[li].trim()) continue;
      const hit = found.get(norm(r[ei]));
      if (hit) { if (!dry) r[li] = hit.url; filled++; if (hit.src === 'aleads') gAleads++; else gWeb++; }
    }
    if (!dry && filled) fs.writeFileSync(p, writeCSV(h, data));
    if (lf === cfg.leadFiles[0]) perCampFilled = filled;
    console.log(`  ${slug}/${lf}: filled=${filled} (found-map=${found.size})`);
  }
  gFilled += perCampFilled;
}
console.log(`\n${client} ${dry ? '(DRY) ' : ''}TOTAL newly-filled (primary file)=${gFilled}  [by source on primary+sibling writes: aleads=${gAleads} web=${gWeb}]`);
