#!/usr/bin/env node
// Finalize the client's tam.csv: merge firmographic universe + DiscoGen portal-qualify + derived + fit.
// Reads: tam-universe-firmographic.csv + tam/_portal.json (domain -> yes|partial|no).
// Writes: tam/tam.csv (STABLE CORE + segment + customer_portal + derived + fit).
// Usage: node tam_build_finalize.mjs <client-slug>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLIENT = process.argv[2];
if (!CLIENT) { console.error('Usage: node tam_build_finalize.mjs <client-slug>'); process.exit(1); }
const TAMDIR = path.join(__dirname, `../profiles/${CLIENT}/tam`);
// Stamped into signal_date / last_refreshed on every row. Derived from the run date so a
// rebuilt TAM never claims stale freshness. Override with --asof YYYY-MM-DD to reproduce a past build.
const asofArg = (process.argv.find((a) => a.startsWith('--asof=')) || '').split('=')[1];
const TODAY = asofArg || new Date().toISOString().slice(0, 10);

function parseLine(l) {
  const out = []; let cur = '', q = false;
  for (let i = 0; i < l.length; i++) {
    const c = l[i];
    if (q) { if (c === '"') { if (l[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else { if (c === '"') q = true; else if (c === ',') { out.push(cur); cur = ''; } else cur += c; }
  }
  out.push(cur); return out;
}
const esc = v => { const s = String(v ?? ''); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };

const csv = fs.readFileSync(path.join(TAMDIR, 'tam-universe-firmographic.csv'), 'utf8').split(/\r?\n/).filter(Boolean);
const head = parseLine(csv[0]);
const idx = Object.fromEntries(head.map((h, i) => [h, i]));
const portal = JSON.parse(fs.readFileSync(path.join(TAMDIR, '_portal.json'), 'utf8'));

const OUT_COLS = [
  // STABLE CORE
  'company_name', 'company_domain', 'company_linkedin', 'segment',
  'industry', 'headcount_range', 'location_country', 'location_state', 'location_city',
  'source', 'signal_date', 'ai_research_provider', 'ai_analysis_provider', 'tam_confidence', 'last_refreshed',
  'fit_status', 'fit_confidence', 'fit_reason', 'enrichment_tier',
  // EXTENSION (collect_now)
  'customer_portal', 'offer_b_portal_candidate', 'offer_c_accessibility_candidate',
  'discolike_score', 'description',
];
const INDUSTRY = { seg_2_manufacturing: 'Manufacturing', seg_1_distribution: 'Supply Chain & Distribution' };
const rows = [];
let good = 0, droppedGeo = 0, bYes = 0, bPartial = 0, bNo = 0;
const ICP_GEO = new Set(['SE', 'DK', 'NO', 'FI', 'GB']);

for (const l of csv.slice(1)) {
  const c = parseLine(l);
  const domain = c[idx.domain];
  const country = c[idx.location_country];
  const seg = c[idx.segment];
  const cp = portal[domain] || 'unknown';            // yes | partial | no | unknown
  const inGeo = ICP_GEO.has(country);
  const fit = inGeo ? 'good' : 'bad';
  if (inGeo) good++; else droppedGeo++;
  if (cp === 'yes') bYes++; else if (cp === 'partial') bPartial++; else if (cp === 'no') bNo++;
  // Offer B (Portal Friction Teardown) targets companies that HAVE a portal/ordering to tear down.
  const offerB = (cp === 'yes' || cp === 'partial') ? 'y' : 'n';
  // Offer C (Accessibility/EAA scan) targets any customer-facing site — all qualify.
  const offerC = inGeo ? 'y' : 'n';
  rows.push({
    company_name: c[idx.company_name],
    company_domain: domain,
    company_linkedin: c[idx.linkedin_url],
    segment: seg,
    industry: INDUSTRY[seg] || '',
    headcount_range: '51-1000',                       // ICP filter band; exact sub-bucket needs enrichment
    location_country: country,
    location_state: c[idx.location_state],
    location_city: c[idx.location_city],
    source: 'discolike_firmographic',
    signal_date: TODAY,
    ai_research_provider: 'discolike',
    ai_analysis_provider: 'discolike_discogen',
    tam_confidence: inGeo ? 'high' : 'low',
    last_refreshed: TODAY,
    fit_status: fit,
    fit_confidence: inGeo ? '0.85' : '0.30',
    fit_reason: inGeo ? `B2B ${INDUSTRY[seg]} firm, 51-1000 emp, ${country} (firmographic ICP match)` : `out-of-ICP geography (${country})`,
    enrichment_tier: inGeo ? 'enriched' : 'qualified_out',
    customer_portal: cp,
    offer_b_portal_candidate: offerB,
    offer_c_accessibility_candidate: offerC,
    discolike_score: c[idx.score],
    description: c[idx.description],
  });
}

fs.writeFileSync(path.join(TAMDIR, 'tam.csv'),
  [OUT_COLS.join(','), ...rows.map(r => OUT_COLS.map(k => esc(r[k])).join(','))].join('\n'));

const bySeg = {}, byPortalGood = { yes: 0, partial: 0, no: 0, unknown: 0 };
for (const r of rows) if (r.fit_status === 'good') { bySeg[r.segment] = (bySeg[r.segment] || 0) + 1; byPortalGood[r.customer_portal] = (byPortalGood[r.customer_portal] || 0) + 1; }
console.error(`tam.csv rows: ${rows.length} (good ${good}, dropped-geo ${droppedGeo})`);
console.error(`by segment (good): ${JSON.stringify(bySeg)}`);
console.error(`customer_portal (good): ${JSON.stringify(byPortalGood)}`);
console.error(`Offer-B portal candidates (good, yes+partial): ${byPortalGood.yes + byPortalGood.partial}`);
console.error(`Offer-C candidates (good, all): ${good}`);
