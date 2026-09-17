#!/usr/bin/env node
// Probe Smartlead REST endpoints used by the Slack reporter, to confirm paths + field names.
// Loads SMARTLEAD_API_KEY from ../.env (scripts/.env). Prints SHAPES only, never the key.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = 'https://server.smartlead.ai/api/v1';
function loadKey() {
  if (process.env.SMARTLEAD_API_KEY) return process.env.SMARTLEAD_API_KEY;
  const env = readFileSync(join(__dirname, '..', '.env'), 'utf8');
  const m = env.match(/^SMARTLEAD_API_KEY=(.+)$/m);
  if (!m) throw new Error('SMARTLEAD_API_KEY not found in scripts/.env');
  return m[1].trim();
}
const KEY = loadKey();

async function get(path) {
  const sep = path.includes('?') ? '&' : '?';
  const url = `${BASE}${path}${sep}api_key=${KEY}`;
  const res = await fetch(url);
  let body; try { body = await res.json(); } catch { body = await res.text(); }
  return { status: res.status, body };
}
function shape(v, depth = 0) {
  if (Array.isArray(v)) return v.length ? ['[' + v.length + ']', shape(v[0], depth + 1)] : '[]';
  if (v && typeof v === 'object') {
    const o = {};
    for (const k of Object.keys(v).slice(0, 40)) o[k] = depth < 2 ? shape(v[k], depth + 1) : typeof v[k];
    return o;
  }
  return typeof v === 'string' ? `"${String(v).slice(0, 40)}"` : v;
}

const CAMPAIGN = process.argv[2] || '2690686';
const probes = [
  ['client list  /client/', '/client/'],
  ['campaign analytics  /campaigns/{id}/analytics', `/campaigns/${CAMPAIGN}/analytics`],
  ['campaign analytics-by-date (7d)', `/campaigns/${CAMPAIGN}/analytics-by-date?start_date=2026-06-08&end_date=2026-06-15`],
  ['campaign top-level  /campaigns/{id}/analytics-by-date (no dates)', `/campaigns/${CAMPAIGN}/analytics`],
  ['client overall  /analytics/client/overall-stats', '/analytics/client/overall-stats?start_date=2026-05-16&end_date=2026-06-15'],
  ['day-wise overall', '/analytics/day-wise-overall-stats?start_date=2026-06-08&end_date=2026-06-15'],
];

for (const [label, path] of probes) {
  try {
    const { status, body } = await get(path);
    console.log('\n=== ' + label + '  ->  HTTP ' + status);
    console.log(JSON.stringify(shape(body), null, 1).slice(0, 1600));
  } catch (e) {
    console.log('\n=== ' + label + '  ->  ERROR ' + e.message);
  }
}
