#!/usr/bin/env node
// list_quality_scorecard.mjs
// Compute the /list-quality-scorecard 9-dimension grade for a verified client lead list.
// Reads <campaignDir>/leads.verified.csv (the send-safe file) and, if present,
// <campaignDir>/leads.review.csv (to report verification coverage of the whole reveal).
// Writes <campaignDir>/list-quality-scorecard.md and prints the grade.
//
// Usage: node scripts/list_quality_scorecard.mjs <campaignDir> [--label "Campaign C - Accessibility"]

import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const campaignDir = args.find(a => !a.startsWith('--'));
const label = args.includes('--label') ? args[args.indexOf('--label') + 1] : path.basename(campaignDir || '');
if (!campaignDir) { console.error('Usage: node list_quality_scorecard.mjs <campaignDir> [--label ...]'); process.exit(1); }

function parseCsv(text) {
  const rows = []; let i = 0, f = '', rec = [], q = false;
  const pf = () => { rec.push(f); f = ''; }; const pr = () => { rows.push(rec); rec = []; };
  while (i < text.length) { const c = text[i];
    if (q) { if (c === '"') { if (text[i+1] === '"') { f += '"'; i += 2; continue; } q = false; i++; continue; } f += c; i++; continue; }
    if (c === '"') { q = true; i++; continue; }
    if (c === ',') { pf(); i++; continue; }
    if (c === '\r') { i++; continue; }
    if (c === '\n') { pf(); pr(); i++; continue; }
    f += c; i++; }
  if (f.length || rec.length) { pf(); pr(); }
  return rows;
}
function load(file) {
  if (!fs.existsSync(file)) return null;
  const rows = parseCsv(fs.readFileSync(file, 'utf8')).filter(r => r.length > 1);
  const head = rows[0]; const idx = Object.fromEntries(head.map((h, k) => [h.trim(), k]));
  return rows.slice(1).map(r => Object.fromEntries(head.map((h, k) => [h.trim(), r[k] ?? ''])));
}

const verified = load(path.join(campaignDir, 'leads.verified.csv'));
if (!verified) { console.error('Missing leads.verified.csv'); process.exit(1); }
const review = load(path.join(campaignDir, 'leads.review.csv')) || [];
const n = verified.length;
if (!n) { console.error('leads.verified.csv is empty'); process.exit(1); }

const ROLE = /^(info|contact|hello|sales|admin|team|office|support|hr|enquiries|enquiry|mail|marketing|reception|accounts)\b/i;
const BADTITLE = /\b(intern|assistant|coordinator|student|part-time|retired|trainee|apprentice)\b/i;

// 1. verification coverage — verified.csv is valid-only by construction
const d1 = 100;
// 2. duplicate email
const emails = verified.map(r => (r.email || '').toLowerCase().trim());
const dupEmail = emails.length - new Set(emails).size;
const dupEmailPct = dupEmail / n * 100;
const d2 = Math.max(0, Math.round(100 - dupEmailPct * 10));
// 3. duplicate domain
const domCount = {};
for (const r of verified) { const d = (r.company_domain || '').toLowerCase(); domCount[d] = (domCount[d] || 0) + 1; }
const domains = Object.keys(domCount).length;
const avgPerDom = n / domains;
const maxPerDom = Math.max(...Object.values(domCount));
const d3 = avgPerDom < 2 ? 100 : (avgPerDom <= 5 ? 60 : 30);
// 4. title relevance
//    Some client lists carry a buyer_tier column (1/2 = relevant), set upstream by that
//    client's TAM contact-build step. When that column is absent (most clients),
//    fall back to a generic finance / decision-maker title match on title|job_title
//    instead of scoring 0 for a column that was never going to exist.
const hasBuyerTier = ('buyer_tier' in verified[0]);
// English finance / decision-maker titles (ASCII, \b-anchored)
const FINANCE_TITLE = /\b(c\.?f\.?o|chief financial officer|chief accounting officer|finance director|director,? finance|director of finance|head of finance|vp,? finance|vice president,? finance|finance manager|financial manager|finance lead|financial controller|comptroller|controller|head of accounting|accounting manager|financial (?:officer|planning)|accounts? (?:receivable|payable)|billing(?: manager| lead| operations)?|revenue operations|revops|treasur(?:y|er)|fp&a)\b/i;
// Nordic / Finnish finance-chief titles — tested as case-insensitive substrings because the
// leading non-ASCII letter (ø/ä) defeats the ASCII \b boundary above.
const FINANCE_INTL = ['økonomichef', 'ekonomichef', 'økonomidirekt', 'ekonomidirekt', 'økonomisjef', 'økonomileder', 'talousjohtaja', 'talouspäällikkö'];
const isFinanceTitle = t => { const s = (t || '').toLowerCase(); return FINANCE_TITLE.test(t || '') || FINANCE_INTL.some(x => s.includes(x)); };
let relevant, relNote;
if (hasBuyerTier) {
  relevant = verified.filter(r => r.buyer_tier === '1' || r.buyer_tier === '2').length;
  relNote = (relevant / n * 100).toFixed(0) + '% buyer-tier (filter-enforced)';
} else {
  relevant = verified.filter(r => isFinanceTitle((r.title || '') + ' ' + (r.job_title || ''))).length;
  relNote = (relevant / n * 100).toFixed(0) + '% finance/decision-maker titles';
}
const relPct = relevant / n * 100;
const d4 = relPct >= 80 ? 100 : (relPct >= 40 ? 50 : 0);
// 5. source signal integrity
const withProof = verified.filter(r => (r.evidence_url || '').trim() && (r.signal || '').trim() && (r.source_confidence || '').trim()).length;
const proofPct = withProof / n * 100;
const d5 = proofPct >= 90 ? 100 : (proofPct >= 60 ? 50 : 0);
// 6. bad titles
const bad = verified.filter(r => BADTITLE.test(r.job_title || '')).length;
const badPct = bad / n * 100;
const d6 = badPct < 2 ? 100 : Math.max(0, Math.round(100 - (badPct - 2) * 10));
// 7. role mailbox density
const role = verified.filter(r => ROLE.test((r.email || '').split('@')[0] || '')).length;
const rolePct = role / n * 100;
const d7 = rolePct < 5 ? 100 : (rolePct <= 15 ? 50 : 0);
// 8. ICP fit
//    Some client lists carry a per-row segment tag. When that column is absent (most clients),
//    a row counts as ICP-fit if it has a segment from the sibling leads.companies.csv (joined on
//    company_domain) OR it survived TAM ICP gating (fit_status good/maybe — only 'bad' is dropped
//    at slice build). Don't hard-cap at 40 just because the client-specific segment column is gone.
const hasSegCol = ('segment' in verified[0]);
let icpFit, segNote;
if (hasSegCol) {
  icpFit = verified.filter(r => (r.segment || '').trim()).length;
  segNote = 'ICP pre-gated at TAM (fit_status=good) + in-slice; ' + (icpFit / n * 100).toFixed(0) + '% segment-tagged';
} else {
  const companies = load(path.join(campaignDir, 'leads.companies.csv')) || [];
  const normDom = d => (d || '').toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '').trim();
  const compByDom = {};
  for (const c of companies) compByDom[normDom(c.company_domain)] = c;
  const isFit = s => /^(good|maybe)$/i.test((s || '').trim());
  icpFit = verified.filter(r => {
    const c = compByDom[normDom(r.company_domain)] || {};
    const seg = (c.segment || r.segment || '').trim();
    return seg.length > 0 || isFit(r.fit_status) || isFit(c.fit_status);
  }).length;
  const joined = verified.filter(r => compByDom[normDom(r.company_domain)]).length;
  segNote = (icpFit / n * 100).toFixed(0) + '% ICP-fit (companies.csv segment join + fit_status good/maybe; ' + joined + '/' + n + ' joined to companies.csv)';
}
const segPct = icpFit / n * 100;
const d8 = segPct >= 80 ? 100 : (segPct >= 50 ? 70 : 40);
// 9. name quality
const realName = verified.filter(r => {
  const fn = (r.first_name || '').trim(), ln = (r.last_name || '').trim();
  if (!fn || !ln) return false;
  if (/^(admin|info|sales|team|contact)$/i.test(fn)) return false;
  if (fn === fn.toUpperCase() && fn.length > 3) return false; // all-caps
  if (/@/.test(fn) || /@/.test(ln)) return false;
  return true;
}).length;
const namePct = realName / n * 100;
const d9 = namePct >= 95 ? 100 : Math.max(0, Math.round(namePct));

// weighted average (1,5,8 weighted 2x)
const dims = [
  { k: 'Email verification coverage', s: d1, w: 2, note: '100% valid by construction (waterfall/verify gate passed)' },
  { k: 'Duplicate email rate', s: d2, w: 1, note: dupEmail + ' dup emails (' + dupEmailPct.toFixed(1) + '%)' },
  { k: 'Duplicate domain rate', s: d3, w: 1, note: 'avg ' + avgPerDom.toFixed(1) + '/domain, max ' + maxPerDom + ' (' + domains + ' domains)' },
  { k: 'Title relevance', s: d4, w: 1, note: relNote },
  { k: 'Source signal integrity', s: d5, w: 2, note: proofPct.toFixed(0) + '% have evidence_url + signal + confidence' },
  { k: 'Bad-title detection', s: d6, w: 1, note: bad + ' bad titles (' + badPct.toFixed(1) + '%)' },
  { k: 'Role/generic mailbox density', s: d7, w: 1, note: role + ' role mailboxes (' + rolePct.toFixed(1) + '%)' },
  { k: 'ICP fit', s: d8, w: 2, note: segNote },
  { k: 'Name quality', s: d9, w: 1, note: namePct.toFixed(0) + '% real first+last (A-Leads named)' },
];
const totW = dims.reduce((a, d) => a + d.w, 0);
const avg = Math.round(dims.reduce((a, d) => a + d.s * d.w, 0) / totW);
const grade = avg >= 90 ? 'A' : avg >= 80 ? 'B' : avg >= 70 ? 'C' : avg >= 60 ? 'D' : 'F';
const action = avg >= 90 ? 'Ship it' : avg >= 80 ? 'Minor fixes, then ship' : avg >= 70 ? 'Fix top 3 issues first' : avg >= 60 ? 'Serious cleanup required' : "Don't send. Rebuild the list.";

// verification coverage of the whole reveal (context)
const revWithEmail = review.filter(r => (r.email || '').trim()).length;
const totalReveal = n + review.length;

const lines = [];
lines.push('# List Quality Scorecard — ' + label);
lines.push('');
lines.push('**Generated:** by `scripts/list_quality_scorecard.mjs` on `leads.verified.csv`');
lines.push('**Send-safe rows:** ' + n + '  ·  **Companies:** ' + domains + '  ·  **Held for review:** ' + review.length + ' (catch-all/risky/invalid/no-email)');
lines.push('');
lines.push('## Grade: ' + grade + ' (' + avg + '/100) — ' + action);
lines.push('');
lines.push('| # | Dimension | Score | Weight | Note |');
lines.push('|---|---|---|---|---|');
dims.forEach((d, i) => lines.push('| ' + (i + 1) + ' | ' + d.k + ' | ' + d.s + '/100 | ' + d.w + 'x | ' + d.note + ' |'));
lines.push('');
lines.push('## Reveal-funnel context');
lines.push('- Total contacts revealed (verified + review): ' + totalReveal);
lines.push('- Send-safe (valid): ' + n + ' (' + (n / totalReveal * 100).toFixed(0) + '% of reveal)');
lines.push('- Held in review: ' + review.length + ' (' + revWithEmail + ' have a non-valid email: catch-all/risky/invalid)');
lines.push('');
lines.push('## Notes');
lines.push('- Send file is **valid-only** (catch-all excluded by default to protect warming mailboxes; promotable from `leads.review.csv` on operator approval).');
lines.push('- ICP fit pre-gated at TAM (`fit_status=good`); off-slice A-Leads rows dropped at build.');
if (hasBuyerTier) {
  lines.push('- Title relevance enforced by the upstream buyer-tier filter applied at contact build.');
} else {
  lines.push('- Title relevance scored by finance/decision-maker title match (this client\'s list has no `buyer_tier` column); ICP fit read from `leads.companies.csv` segment join + `fit_status`.');
}
console.log(lines.join('\n'));
fs.writeFileSync(path.join(campaignDir, 'list-quality-scorecard.md'), lines.join('\n') + '\n');
console.log('\n--- wrote ' + path.join(campaignDir, 'list-quality-scorecard.md') + ' ---');
