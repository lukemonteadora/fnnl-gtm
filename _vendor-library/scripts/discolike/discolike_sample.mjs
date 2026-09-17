#!/usr/bin/env node
// DiscoLike lookalike sample builder for /tam-build (Layer-1 discovery, sample-first).
// Calls /discover per seed (no country filter → multi-country), merges, dedups by domain,
// filters to target countries, applies exclusions, writes a CSV sample for /icp-prompt-builder.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const KEY = process.env.DISCOLIKE_API_KEY;
if (!KEY) { console.error('DISCOLIKE_API_KEY missing'); process.exit(1); }

// v2 re-seed (operator decision 2026-06-10): industrial seeds ONLY — dropped the retail-pulling
// seeds (procurator/abkarlhedin/ctek/plejd/surgicalscience). These are specialised B2B
// manufacturers / industrial-tech (medtech instruments, electronics, monitoring).
const SEEDS = [
  // v2 clean industrial seeds
  'note.eu', 'mycronic.com', 'cellavision.com', 'chemometec.com', 'aeromon.io',
  // v3 expansion — strongest on-ICP results promoted to seeds (Seg-2-first)
  'gasmet.com', 'etteplan.com', 'boxon.se', 'propoint.se', 'connorsolutions.co.uk', 'kontaktpressning.se',
];
const ICP_TEXT = 'B2B industrial distributor, wholesaler, or specialised manufacturer with 51 to 1000 employees that sells through a customer/dealer portal or B2B e-commerce and needs custom web portal and commerce platform engineering';
const COUNTRIES = new Set(['SE', 'DK', 'NO', 'FI', 'GB']);
const EXCLUDE = new Set([
  'assaabloy.com', 'karkkainen.com', 'vaimo.com', 'divante.com', 'astoundcommerce.com',
  'borngroup.com', 'knowit.com',
  'procurator.com', 'abkarlhedin.se', 'surgicalscience.com', 'ctek.com', 'plejd.com',
  // digital agencies / dev consultancies = competitors, not buyers — never target
  'togethertech.com',
  ...SEEDS,
]);
// B2C/retail/micro-services exclusion — the failure mode of the v1 sample. Dropped rows are
// written to a sidecar so the exclusion is auditable (flag, not silent).
const RETAIL_RE = /\b(online (store|retailer|shop)|web ?shop|department store|retailer special\w*|store that offers|shop that offers|online store that|sells? recycled|comparison platform|compare quotes)\b/i;
const SERVICES_RE = /\b(carpenter|electrician|construction company|home ?service|renovation|building service|real estate)\b/i;
const MAX = parseInt(process.argv[2] || '10', 10);
// No default output path: the client profile path must be passed explicitly.
const OUT = process.argv[3];
if (!OUT) {
  console.error('usage: node discolike_sample.mjs <max> <out-csv-path>  (e.g. ../profiles/<client-slug>/tam/tam-sample-discolike.csv)');
  process.exit(2);
}

const norm = d => (d || '').toLowerCase().replace(/^www\./, '').trim();
async function discover(seed) {
  const ac = new AbortController(); const t = setTimeout(() => ac.abort(), 30000);
  try {
    // NOTE: icp_text broadens to GLOBAL ICP matches and loses the seed's Nordic/UK geographic
    // concentration (tested 2026-06-10 → 1/125 Nordic). Domain-only keeps results regional.
    const res = await fetch(`https://api.discolike.com/v1/discover?domain=${encodeURIComponent(seed)}&max_records=${MAX}`,
      { headers: { 'x-discolike-key': KEY }, signal: ac.signal });
    clearTimeout(t);
    if (!res.ok) { console.error(`  ${seed} → ${res.status}`); return []; }
    return await res.json();
  } catch (e) { clearTimeout(t); console.error(`  ${seed} → ERR ${e.message}`); return []; }
}

const DELAY = parseInt(process.env.DISCO_DELAY_MS || '6000', 10);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const byDomain = new Map();
const dropped = [];
let rawTotal = 0;
for (let i = 0; i < SEEDS.length; i++) {
  const seed = SEEDS[i];
  let recs = await discover(seed);
  if (recs.length === 0) { await sleep(DELAY * 2); recs = await discover(seed); } // one retry on 429
  rawTotal += recs.length;
  console.error(`  ${seed}: ${recs.length} records`);
  if (i < SEEDS.length - 1) await sleep(DELAY);
  for (const r of recs) {
    const dom = norm(r.domain);
    const country = r.address?.country || '';
    if (!dom || EXCLUDE.has(dom) || !COUNTRIES.has(country)) continue;
    const desc = (r.description || '');
    if (RETAIL_RE.test(desc) || SERVICES_RE.test(desc)) { dropped.push({ domain: dom, country, why: RETAIL_RE.test(desc) ? 'retail' : 'services', name: r.name || '' }); continue; }
    const ex = byDomain.get(dom);
    const rec = {
      domain: dom,
      company_name: r.name || '',
      score: r.score ?? '',
      location_country: country,
      location_state: r.address?.state || '',
      location_city: r.address?.city || '',
      linkedin_url: (r.social_urls || []).find(u => /linkedin/.test(u)) || '',
      industry: r.industry_group || r.industry_gr || r.industry || '',
      top_keywords: Object.keys(r.keywords || {}).slice(0, 6).join('; '),
      description: (r.description || '').replace(/\s+/g, ' ').slice(0, 320),
      seeds: seed,
      source: 'discolike',
    };
    if (ex) { // keep higher score, accumulate seed provenance
      ex.seeds = [...new Set([...ex.seeds.split('|'), seed])].join('|');
      if ((rec.score || 0) > (ex.score || 0)) Object.assign(ex, rec, { seeds: ex.seeds });
    } else { rec.seeds = seed; byDomain.set(dom, rec); }
  }
}

const rows = [...byDomain.values()].sort((a, b) => (b.score || 0) - (a.score || 0));
const cols = ['domain', 'company_name', 'score', 'location_country', 'location_state', 'location_city',
  'linkedin_url', 'industry', 'top_keywords', 'description', 'seeds', 'source'];
const esc = v => { const s = String(v ?? ''); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, [cols.join(','), ...rows.map(r => cols.map(c => esc(r[c])).join(','))].join('\n'));

const byCountry = {};
for (const r of rows) byCountry[r.location_country] = (byCountry[r.location_country] || 0) + 1;
console.error(`\n=== SAMPLE (v2 — industrial seeds + ICP text + retail/services exclusion) ===`);
console.error(`raw records: ${rawTotal} | dropped (retail/services): ${dropped.length} | unique Nordic/UK kept: ${rows.length}`);
console.error(`by country: ${JSON.stringify(byCountry)}`);
console.error(`dropped sample: ${dropped.slice(0, 8).map(d => `${d.domain}[${d.why}]`).join(', ')}`);
console.error(`saved -> ${OUT}`);
