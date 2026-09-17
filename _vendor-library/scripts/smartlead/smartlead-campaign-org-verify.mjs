#!/usr/bin/env node
// smartlead-campaign-org-verify.mjs — verify the company-name TAG on every campaign in _smartlead_org_plan.json.
//
// Campaign TAGS are API-READABLE (GET /campaigns/{id}?include_tags=true → tags[]); this script reports, per
// campaign, whether its expected company tag is attached. Campaign FOLDERS have no public API — verify those
// visually in the Smartlead UI (top-left Folders tab). Assignment of both is UI-only (see
// /smartlead-campaign-upload-public §D); this script is the read-back check, not a writer.
//
// Usage (from the scripts/ dir):
//   node smartlead-campaign-org-verify.mjs            # full report
//   node smartlead-campaign-org-verify.mjs missing    # only campaigns still missing their company tag

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = 'https://server.smartlead.ai/api/v1';
const KEY = (process.env.SMARTLEAD_API_KEY ||
  readFileSync(join(__dirname, '.env'), 'utf8').match(/^SMARTLEAD_API_KEY=(.+)$/m)?.[1] || '').trim();
if (!KEY) { console.error('SMARTLEAD_API_KEY missing'); process.exit(2); }

const plan = JSON.parse(readFileSync(join(__dirname, '_smartlead_org_plan.json'), 'utf8'));
const onlyMissing = process.argv[2] === 'missing';

async function tagsOf(id) {
  const r = await fetch(`${BASE}/campaigns/${id}?include_tags=true&api_key=${KEY}`);
  if (!r.ok) return null;
  const j = await r.json();
  return Array.isArray(j.tags) ? j.tags : [];
}

const byCompany = {};
let have = 0, missing = 0, errored = 0;
for (const c of plan.campaigns) {
  const tags = await tagsOf(c.id);
  const names = (tags || []).map((t) => (t.tag_name || t.name || '').toLowerCase());
  const ok = tags === null ? null : names.includes((c.company || '').toLowerCase());
  byCompany[c.company] = byCompany[c.company] || { have: 0, missing: 0 };
  if (ok === null) { errored++; }
  else if (ok) { have++; byCompany[c.company].have++; }
  else { missing++; byCompany[c.company].missing++; }
  if (!onlyMissing || ok === false) {
    const mark = ok === null ? 'ERR ' : ok ? 'OK  ' : 'MISS';
    console.log(`${mark}\t${c.id}\t${c.company}\t${c.status}\t${c.name || ''}`);
  }
}
console.log(`\n# tagged ${have}/${plan.campaigns.length}  missing ${missing}  err ${errored}`);
console.log('# per company (have/missing):');
for (const [co, v] of Object.entries(byCompany).sort()) console.log(`  ${co}\t${v.have}/${v.have + v.missing}`);
