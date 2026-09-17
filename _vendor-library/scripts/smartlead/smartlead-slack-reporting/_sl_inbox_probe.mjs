#!/usr/bin/env node
// Probe master-inbox reply shape + lead categories, to build the interested-reply poll correctly.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = 'https://server.smartlead.ai/api/v1';
const KEY = (() => { const m = readFileSync(join(__dirname, '..', '.env'), 'utf8').match(/^SMARTLEAD_API_KEY=(.+)$/m); return m[1].trim(); })();

async function post(path, body) {
  const res = await fetch(`${BASE}${path}?api_key=${KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  let j; try { j = await res.json(); } catch { j = await res.text(); }
  return { status: res.status, j };
}
async function get(path) { const res = await fetch(`${BASE}${path}${path.includes('?') ? '&' : '?'}api_key=${KEY}`); let j; try { j = await res.json(); } catch { j = await res.text(); } return { status: res.status, j }; }

// master-inbox replies — try variants to find accepted body
const variants = [
  { offset: 0, limit: 5 },
  { offset: 0, limit: 5, fetch_message_history: false },
  { offset: 0, limit: 5, lead_categories: [1] },
];
for (const v of variants) {
  const mi = await post('/master-inbox/inbox-replies', v);
  const arr = mi.j?.data || mi.j?.replies || (Array.isArray(mi.j) ? mi.j : null);
  console.log('\nvariant', JSON.stringify(v), '-> status', mi.status, 'count', Array.isArray(arr) ? arr.length : 'n/a');
  if (Array.isArray(arr) && arr[0]) {
    console.log('KEYS:', Object.keys(arr[0]).join(', '));
    console.log('SAMPLE:', JSON.stringify(arr[0], (k, val) => typeof val === 'string' && val.length > 50 ? val.slice(0, 50) + '…' : val, 1).slice(0, 1400));
    break;
  } else if (mi.status >= 400) {
    console.log('err:', JSON.stringify(mi.j).slice(0, 200));
  } else {
    console.log('raw:', JSON.stringify(mi.j).slice(0, 300));
  }
}
// lead categories
const cats = await get('/leads/fetch-categories');
console.log('\ncategories status', cats.status, JSON.stringify(cats.j).slice(0, 400));
