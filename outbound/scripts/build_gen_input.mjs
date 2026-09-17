#!/usr/bin/env node
// build_gen_input.mjs
// Build the per-contact generation input for /personalization-subagent-pattern:
// join a campaign's leads.verified.csv to the TAM company description/keywords (by domain)
// and emit <campaignDir>/_gen/gen_input.jsonl (one compact JSON object per contact).
//
// Usage: node scripts/build_gen_input.mjs <campaignDir> <tamCsv>
//   node scripts/build_gen_input.mjs \
//     profiles/<client-slug>/campaigns/<campaign-slug> \
//     profiles/<client-slug>/tam/tam.csv

import fs from 'node:fs';
import path from 'node:path';

const [campaignDir, tamCsv] = process.argv.slice(2);
if (!campaignDir || !tamCsv) { console.error('Usage: node build_gen_input.mjs <campaignDir> <tamCsv>'); process.exit(1); }

function parseCsv(text) {
  const rows = []; let i = 0, f = '', rec = [], q = false;
  const pf = () => { rec.push(f); f = ''; }; const pr = () => { rows.push(rec); rec = []; };
  while (i < text.length) { const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i += 2; continue; } q = false; i++; continue; } f += c; i++; continue; }
    if (c === '"') { q = true; i++; continue; }
    if (c === ',') { pf(); i++; continue; }
    if (c === '\r') { i++; continue; }
    if (c === '\n') { pf(); pr(); i++; continue; }
    f += c; i++; }
  if (f.length || rec.length) { pf(); pr(); }
  return rows;
}
const load = file => { const r = parseCsv(fs.readFileSync(file, 'utf8')).filter(x => x.length > 1); const h = r[0]; return { h, rows: r.slice(1), ix: Object.fromEntries(h.map((c, k) => [c.trim(), k])) }; };

const tam = load(tamCsv);
const tamByDomain = {};
for (const r of tam.rows) { const d = (r[tam.ix['company_domain']] || '').trim().toLowerCase(); if (d) tamByDomain[d] = r; }
const tget = (r, c) => (r && tam.ix[c] != null ? (r[tam.ix[c]] || '').trim() : '');

// shorten the noisy keyword string ("a:0.6; b:0.5; ...") to the top few phrases
function topKeywords(s, n = 6) {
  if (!s) return '';
  return s.split(';').map(x => x.split(':')[0].trim()).filter(Boolean).slice(0, n).join(', ');
}

const lv = load(path.join(campaignDir, 'leads.verified.csv'));
const g = (r, c) => (lv.ix[c] != null ? (r[lv.ix[c]] || '').trim() : '');

const outDir = path.join(campaignDir, '_gen');
fs.mkdirSync(outDir, { recursive: true });
const out = [];
let withDesc = 0;
lv.rows.forEach((r, idx) => {
  const domain = g(r, 'company_domain').toLowerCase();
  const tamRow = tamByDomain[domain];
  const desc = tget(tamRow, 'description');
  if (desc) withDesc++;
  out.push(JSON.stringify({
    idx: idx + 1,
    first_name: g(r, 'first_name'),
    company_name: g(r, 'company_name'),
    company_domain: domain,
    job_title: g(r, 'job_title'),
    segment: g(r, 'segment'),
    country: g(r, 'address_country'),
    exposure_band: g(r, 'accessibility_exposure_band'),
    signal: g(r, 'signal'),
    company_description: desc,
    keywords: topKeywords(tget(tamRow, 'keywords')),
    evidence_url: g(r, 'evidence_url'),
  }));
});
fs.writeFileSync(path.join(outDir, 'gen_input.jsonl'), out.join('\n') + '\n');
console.log('contacts: ' + out.length + ' | with company_description: ' + withDesc + ' (' + Math.round(withDesc / out.length * 100) + '%)');
console.log('wrote ' + path.join(outDir, 'gen_input.jsonl'));
