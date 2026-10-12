#!/usr/bin/env node
/**
 * AI Ark company search sample (REST) for the discovery-flow step 1 (ai-ark-people-discovery.md).
 * Reads a search body (the `account` shape) from --search, pages 100 at a time up to --max,
 * and writes sample-r0-companies.csv with the columns keyword_mine.py reads.
 * Never reveals an email. Reads AI_ARK_API_KEY from outbound/scripts/.env and never prints it.
 *
 *   node aiark_company_sample.mjs --search search.json --max 300 --out sample-r0-companies.csv [--count-only]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const d = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(d, '.env'), 'utf8').split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const K = process.env.AI_ARK_API_KEY;
const arg = (n, def) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : def; };
const has = (n) => process.argv.includes(n);
const search = JSON.parse(fs.readFileSync(arg('--search'), 'utf8'));
const max = Number(arg('--max', 300));
const out = arg('--out');
const pathApi = arg('--path', '/v1/companies');
const BASE = 'https://api.ai-ark.com/api/developer-portal';
const scrub = (s) => String(s).split(K).join('***');

async function page(p, size) {
  for (let t = 0; t < 3; t++) {
    const r = await fetch(BASE + pathApi, {
      method: 'POST',
      headers: { 'X-TOKEN': K, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...search, page: p, size }),
    });
    const txt = await r.text();
    if (r.status === 429) { await new Promise((z) => setTimeout(z, 1500 * (t + 1))); continue; }
    if (!r.ok) throw new Error(`HTTP ${r.status} ${scrub(txt).slice(0, 400)}`);
    return { json: JSON.parse(txt), credit: r.headers.get('x-credit') };
  }
  throw new Error('429 after 3 tries');
}

const csvq = (v) => { const s = v == null ? '' : String(v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };

const first = await page(0, has('--count-only') ? 1 : Math.min(100, max));
const total = first.json.totalElements;
if (has('--count-only')) { console.log(JSON.stringify({ totalElements: total, credit: first.credit })); process.exitCode = 0; } else {
let rows = [...(first.json.content || [])];
let credits = [first.credit];
for (let p = 1; rows.length < max && rows.length < total; p++) {
  const r = await page(p, Math.min(100, max - rows.length));
  credits.push(r.credit);
  if (!r.json.content?.length) break;
  rows.push(...r.json.content);
}
const header = ['company_domain', 'company_name', 'description', 'keywords', 'industries', 'location', 'state', 'headcount', 'revenue', 'website', 'linkedin', 'aiark_id'];
const lines = [header.join(',')];
for (const c of rows) {
  const s = c.summary || {};
  const hq = c.location?.headquarter || {};
  lines.push([
    (c.link?.domain || '').toLowerCase(), s.name, (s.description || s.overview || '').replace(/\s+/g, ' ').slice(0, 1500),
    (c.keywords || []).join('|'), (c.industries || []).join('|'), hq.country, hq.state, s.staff?.total,
    c.financial?.revenue?.annual?.amount, c.link?.website, c.link?.linkedin, c.id,
  ].map(csvq).join(','));
}
fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
fs.writeFileSync(out, lines.join('\n') + '\n');
console.log(JSON.stringify({ totalElements: total, written: rows.length, credit_headers: credits, out }));
}

