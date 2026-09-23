#!/usr/bin/env node
// leads_split_verified.mjs
// Split an email-waterfall enriched lead CSV into the send-safe verified file and
// the held-back review file, per the Verification Doctrine gate.
//
//   leads.verified.csv           = email_status === 'valid'                 (send-safe)
//   leads.catchall-holdback.csv  = email_status === 'catch_all'             (held for the Catch-All Timing
//                                  gate, reintroduced by /cold-email-weekly-rhythm; 2026-09-24 fix: this
//                                  used to go to review, which contradicted the stack contract's gate mapping
//                                  at lead_data.email_verification.notes)
//   leads.review.csv             = risky / invalid / unknown / no_email / blank (never auto-sent)
//
// Superseded for the governed flow by list_waterfall.py finalize, which also writes person fallback,
// provenance and the stagger file (list-production-standard.md). Kept for one-off external lists.
//
// Usage:
//   node scripts/leads_split_verified.mjs <campaignDir> [--in leads.enriched.csv]
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const campaignDir = args.find(a => !a.startsWith('--'));
const inName = args.includes('--in') ? args[args.indexOf('--in') + 1] : 'leads.enriched.csv';
if (!campaignDir) { console.error('Usage: node leads_split_verified.mjs <campaignDir> [--in leads.enriched.csv]'); process.exit(1); }
const inPath = path.join(campaignDir, inName);
if (!fs.existsSync(inPath)) { console.error('Missing ' + inPath); process.exit(1); }

function parseCsv(text) {
  const rows = []; let i = 0, field = '', record = [], inQ = false;
  const pushF = () => { record.push(field); field = ''; };
  const pushR = () => { rows.push(record); record = []; };
  while (i < text.length) {
    const ch = text[i];
    if (inQ) { if (ch === '"') { if (text[i + 1] === '"') { field += '"'; i += 2; continue; } inQ = false; i++; continue; } field += ch; i++; continue; }
    if (ch === '"') { inQ = true; i++; continue; }
    if (ch === ',') { pushF(); i++; continue; }
    if (ch === '\r') { i++; continue; }
    if (ch === '\n') { pushF(); pushR(); i++; continue; }
    field += ch; i++;
  }
  if (field.length || record.length) { pushF(); pushR(); }
  return rows;
}
const esc = v => { const s = v == null ? '' : String(v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };

const rows = parseCsv(fs.readFileSync(inPath, 'utf8')).filter(r => r.length > 1);
const head = rows[0];
const si = head.indexOf('email_status');
const ei = head.indexOf('email');
const verified = [head], review = [head], holdback = [head];
let v = 0, r = 0, h = 0;
for (const row of rows.slice(1)) {
  const status = (row[si] || '').trim().toLowerCase();
  const hasEmail = (row[ei] || '').trim().length > 0;
  if (status === 'valid' && hasEmail) { verified.push(row); v++; }
  else if (status === 'catch_all' && hasEmail) { holdback.push(row); h++; }
  else { review.push(row); r++; }
}
const write = (name, data) => fs.writeFileSync(path.join(campaignDir, name), data.map(row => row.map(esc).join(',')).join('\n') + '\n');
write('leads.verified.csv', verified);
write('leads.review.csv', review);
write('leads.catchall-holdback.csv', holdback);
console.log('verified (valid, send-safe): ' + v);
console.log('catch-all holdback (verified catch-all, held for domain maturity): ' + h);
console.log('review (risky/invalid/unknown/no_email): ' + r);
console.log('wrote leads.verified.csv + leads.catchall-holdback.csv + leads.review.csv in ' + path.basename(campaignDir));
