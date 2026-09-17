#!/usr/bin/env node
// Firmographic TAM pull from DiscoLike REST /discover (no seed — pure firmographic filters).
// Covers Seg 1 (distribution/supply-chain) + Seg 2 (manufacturing). Bounded first-wave build.
// Writes core firmographic columns straight to CSV (no context bloat). Metered per record.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const KEY = process.env.DISCOLIKE_API_KEY;
const CLIENT = process.argv[2];
if (!CLIENT) { console.error('Usage: node tam_firmographic_pull.mjs <client-slug>'); process.exit(1); }
const OUT = path.join(__dirname, `../profiles/${CLIENT}/tam/tam-universe-firmographic.csv`);
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Seg-2 manufacturing gets the larger share (matches the 2542 vs 964 universe split).
const PULLS = [
  { category: 'MANUFACTURING', segment: 'seg_2_manufacturing', target: 160 },
  { category: 'SUPPLY_CHAIN_AND_PROCUREMENT', segment: 'seg_1_distribution', target: 90 },
];
// Domains kept out of the pull: the client's own sites plus known competitors and agencies.
// Review and re-populate this per engagement.
const EXCLUDE = new Set([
  'assaabloy.com', 'karkkainen.com', 'vaimo.com', 'divante.com', 'astoundcommerce.com',
  'borngroup.com', 'knowit.com', 'togethertech.com',
]);
const norm = d => (d || '').toLowerCase().replace(/^www\./, '').trim();

async function pull(category, maxRecords, offset) {
  const u = `https://api.discolike.com/v1/discover?category=${category}&country=NORDICS,GB&employee_range=51,1000&business_model=B2B&exclude_leadgen=true&max_records=${maxRecords}&offset=${offset}`;
  const ac = new AbortController(); const t = setTimeout(() => ac.abort(), 45000);
  try {
    const res = await fetch(u, { headers: { 'x-discolike-key': KEY }, signal: ac.signal });
    clearTimeout(t);
    if (!res.ok) { console.error(`  ${category}@${offset} → ${res.status}`); return []; }
    const j = await res.json();
    return Array.isArray(j) ? j : [];
  } catch (e) { clearTimeout(t); console.error(`  ${category}@${offset} → ERR ${e.message}`); return []; }
}

const byDomain = new Map();
for (const p of PULLS) {
  let got = 0, offset = 0, page = 0;
  while (got < p.target && page < 4) {
    const recs = await pull(p.category, Math.min(100, p.target - got), offset);
    if (recs.length === 0) break;
    for (const r of recs) {
      const dom = norm(r.domain);
      if (!dom || EXCLUDE.has(dom) || byDomain.has(dom)) continue;
      byDomain.set(dom, {
        domain: dom,
        company_name: r.name || '',
        score: r.score ?? '',
        location_country: r.address?.country || '',
        location_state: r.address?.state || '',
        location_city: r.address?.city || '',
        linkedin_url: (r.social_urls || []).find(u => /linkedin/.test(u)) || '',
        description: (r.description || '').replace(/\s+/g, ' ').slice(0, 300),
        segment: p.segment,
        source: 'discolike_firmographic',
      });
    }
    got += recs.length; offset += recs.length; page++;
    console.error(`  ${p.category}: page ${page} (+${recs.length}), unique so far ${byDomain.size}`);
    if (recs.length < 100) break;
    await sleep(5000);
  }
  await sleep(5000);
}

const rows = [...byDomain.values()];
const cols = ['domain', 'company_name', 'score', 'location_country', 'location_state', 'location_city', 'linkedin_url', 'description', 'segment', 'source'];
const esc = v => { const s = String(v ?? ''); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, [cols.join(','), ...rows.map(r => cols.map(c => esc(r[c])).join(','))].join('\n'));

const byC = {}, byS = {};
for (const r of rows) { byC[r.location_country] = (byC[r.location_country] || 0) + 1; byS[r.segment] = (byS[r.segment] || 0) + 1; }
console.error(`\n=== FIRMOGRAPHIC TAM ===`);
console.error(`unique companies: ${rows.length}`);
console.error(`by country: ${JSON.stringify(byC)}`);
console.error(`by segment: ${JSON.stringify(byS)}`);
console.error(`saved -> ${OUT}`);
