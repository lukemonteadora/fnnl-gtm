#!/usr/bin/env node
// add_phone_to_sig.mjs — append a phone line to the signature block of selected sequence steps,
// in place, on an EXISTING Smartlead campaign. Faithful GET -> modify-target-steps-only -> POST.
//
// - Targets ONLY the steps in <stepsCSV>; every other step is round-tripped byte-identical
//   (verified post-POST). This is what lets us touch a live campaign's unsent step without
//   disturbing the already-sent E1.
// - Idempotent: if the phone already follows the signature, that variant is left as-is.
// - Does NOT re-upload leads, change schedule, or touch settings.
//
// USAGE: node add_phone_to_sig.mjs <campaignId> "<innerSig>" "<phone>" "<stepsCSV>"
//   innerSig = the exact signature text to append after, e.g.
//              "Jane Doe<br>Partnerships @ ExampleCo<br>New York, USA"
//   phone    = e.g. "+1 323-283-8223"   (appended as `<br>${phone}` right after innerSig)
//   stepsCSV = e.g. "1,3"  or  "3"
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = 'https://server.smartlead.ai/api/v1';
const KEY = process.env.SMARTLEAD_API_KEY || (readFileSync(join(__dirname, '.env'), 'utf8').match(/^SMARTLEAD_API_KEY=(.+)$/m) || [])[1]?.trim();
if (!KEY) { console.error('no SMARTLEAD_API_KEY'); process.exit(1); }

const [ID, INNER_SIG, PHONE, STEPS_CSV] = process.argv.slice(2);
if (!ID || !INNER_SIG || !PHONE || !STEPS_CSV) {
  console.error('usage: node add_phone_to_sig.mjs <campaignId> "<innerSig>" "<phone>" "<stepsCSV>"');
  process.exit(1);
}
const TARGET = new Set(STEPS_CSV.split(',').map((s) => Number(s.trim())));
const ADDITION = `<br>${PHONE}`;

async function api(method, path, body) {
  const sep = path.includes('?') ? '&' : '?';
  const res = await fetch(`${BASE}${path}${sep}api_key=${KEY}`, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const t = await res.text(); let j; try { j = JSON.parse(t); } catch { j = t; }
  return { ok: res.ok, status: res.status, j };
}
const getSeqs = async () => { const g = await api('GET', `/campaigns/${ID}/sequences`); return Array.isArray(g.j) ? g.j : (g.j.data || g.j.sequences || []); };
const bodyMap = (seqs) => { const m = {}; for (const s of seqs) m[s.seq_number] = (s.sequence_variants || s.seq_variants || []).map((v) => v.email_body); return m; };

const before = await getSeqs();
if (!Array.isArray(before) || before.length < 1) { console.error(`✗ could not read sequence for ${ID}`); process.exit(1); }
const beforeBodies = bodyMap(before);

let changed = 0, skipped = 0, missing = 0;
const payload = before.map((s) => {
  const vars = s.sequence_variants || s.seq_variants || [];
  const seq_variants = vars.map((v) => {
    let body = v.email_body || '';
    if (TARGET.has(s.seq_number)) {
      if (body.includes(INNER_SIG + ADDITION)) { skipped++; }            // already has phone
      else if (body.includes(INNER_SIG)) { body = body.replace(INNER_SIG, INNER_SIG + ADDITION); changed++; }
      else { missing++; console.log(`  ! step ${s.seq_number} [${v.variant_label}] does NOT contain the signature — left as-is`); }
    }
    return {
      subject: v.subject ?? '',
      email_body: body,
      variant_label: v.variant_label,
      variant_distribution_percentage: v.variant_distribution_percentage ?? Math.round(100 / vars.length),
    };
  });
  return {
    seq_number: s.seq_number,
    seq_delay_details: { delay_in_days: s.seq_delay_details?.delayInDays ?? s.seq_delay_details?.delay_in_days ?? s.delay_in_days ?? 0 },
    variant_distribution_type: s.variant_distribution_type || 'MANUAL_EQUAL',
    seq_variants,
  };
});

console.log(`campaign ${ID}: target steps {${[...TARGET].join(',')}}  changed=${changed} already-had=${skipped} sig-not-found=${missing}`);
if (changed === 0) { console.log('  nothing to change (idempotent no-op) — NOT posting.'); process.exit(0); }

const r = await api('POST', `/campaigns/${ID}/sequences`, { sequences: payload });
console.log(`  ${r.ok ? '✓' : '✗'} sequence POST ${r.status}${r.ok ? '' : ' ' + JSON.stringify(r.j).slice(0, 300)}`);
if (!r.ok) process.exit(1);

await new Promise((res) => setTimeout(res, 1500));
const after = await getSeqs();
const afterBodies = bodyMap(after);

// Verify: untouched steps byte-identical; target steps gained exactly the phone.
let ok = true;
for (const s of before) {
  const n = s.seq_number;
  const b = beforeBodies[n] || [], a = afterBodies[n] || [];
  if (!TARGET.has(n)) {
    const same = JSON.stringify(b) === JSON.stringify(a);
    console.log(`  step ${n} (untouched): ${same ? '✓ byte-identical' : '✗ CHANGED — INVESTIGATE'}`);
    if (!same) ok = false;
  } else {
    const allHavePhone = a.every((body) => body.includes(INNER_SIG + ADDITION));
    console.log(`  step ${n} (target):    ${allHavePhone ? '✓ phone present on all variants' : '✗ phone MISSING'}  tail=...${JSON.stringify((a[0] || '').slice(-70))}`);
    if (!allHavePhone) ok = false;
  }
}
console.log(ok ? '✓ VERIFIED' : '✗ VERIFY FAILED');
process.exit(ok ? 0 : 1);
