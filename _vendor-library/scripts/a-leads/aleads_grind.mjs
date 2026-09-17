#!/usr/bin/env node
// Resumable harness for the A-Leads find grind (10/call MCP, no scriptable bulk).
// The MODEL issues the aleads_bulk_find_email calls; this script only (a) hands out the next
// undone contacts as ready-to-paste 10-row groups, and (b) persists results to disk so the grind
// survives across turns/sessions. Per /email-waterfall doctrine: A-Leads FINDS → (later) Deliverable.co VERIFIES.
//
//   node aleads_grind.mjs next <client> <slug> <nContacts>   -> prints groups (<=10 each) of {first_name,last_name,website}
//                                                       for the next nContacts UNDONE rows + the index range
//   node aleads_grind.mjs save <client> <slug> <resultsFile> -> resultsFile = JSON array of bulk_find result objects
//                                                       (each {first_name,last_name,website,email,quality,status});
//                                                       appends found -> leads.found.csv, not_found/failed -> leads.residue.csv,
//                                                       advances progress by results.length
//   node aleads_grind.mjs status <client> <slug>             -> progress + tallies
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const [mode, client, slug, arg] = process.argv.slice(2);
if (!client || !slug) { console.error('usage: aleads_grind.mjs next|save|status <client> <slug> [arg]'); process.exit(1); }
const CAMP = path.join(__dirname, `../profiles/${client}/campaigns`);
const Q = String.fromCharCode(34);
const pl = l => { const o = []; let c = '', q = false; for (let i = 0; i < l.length; i++) { const ch = l[i]; if (q) { if (ch === Q) { if (l[i+1] === Q) { c += Q; i++; } else q = false; } else c += ch; } else { if (ch === Q) q = true; else if (ch === ',') { o.push(c); c = ''; } else c += ch; } } o.push(c); return o; };
const esc = v => { const s = String(v ?? ''); return /[",\r\n]/.test(s) ? Q + s.replace(/"/g, Q + Q) + Q : s; };
const dir = path.join(CAMP, slug);
const inputCsv = path.join(dir, 'leads.bcinput.csv');
const progFile = path.join(dir, '_aleads_progress.json');
const foundCsv = path.join(dir, 'leads.found.csv');
const residueCsv = path.join(dir, 'leads.residue.csv');

const rows = fs.readFileSync(inputCsv, 'utf8').split(/\r?\n/).filter(Boolean);
const H = pl(rows[0]); const I = Object.fromEntries(H.map((h, i) => [h, i]));
const contacts = rows.slice(1).map(pl).map(r => ({ first_name: r[I.first_name], last_name: r[I.last_name], company: r[I.company], website: r[I.company_domain], linkedin_url: r[I.linkedin_url] || '', signal: r[I.signal] || '', evidence_url: r[I.evidence_url] || '' }));
const prog = fs.existsSync(progFile) ? JSON.parse(fs.readFileSync(progFile, 'utf8')) : { done: 0 };

if (mode === 'status') {
  const f = fs.existsSync(foundCsv) ? fs.readFileSync(foundCsv, 'utf8').split(/\n/).filter(Boolean).length - 1 : 0;
  const r = fs.existsSync(residueCsv) ? fs.readFileSync(residueCsv, 'utf8').split(/\n/).filter(Boolean).length - 1 : 0;
  console.log(`[${slug}] total=${contacts.length} done=${prog.done} remaining=${contacts.length - prog.done} | found=${f} residue=${r}`);
  process.exit(0);
}
if (mode === 'next') {
  const n = parseInt(arg || '60', 10);
  const slice = contacts.slice(prog.done, prog.done + n);
  const groups = []; for (let i = 0; i < slice.length; i += 10) groups.push(slice.slice(i, i + 10).map(c => ({ first_name: c.first_name, last_name: c.last_name, website: c.website })));
  console.log(`# ${slug} rows ${prog.done}..${prog.done + slice.length - 1} (${slice.length} contacts, ${groups.length} groups of <=10)`);
  groups.forEach((g, i) => console.log(`GROUP ${i}: ${JSON.stringify(g)}`));
  process.exit(0);
}
if (mode === 'save') {
  const results = JSON.parse(fs.readFileSync(arg, 'utf8'));   // array of bulk_find result objects, in order
  const norm = s => (s || '').toLowerCase().trim();
  // index the just-processed slice by first+last+website to recover company/signal/linkedin
  const slice = contacts.slice(prog.done, prog.done + results.length);
  const byKey = {}; slice.forEach(c => { byKey[norm(c.first_name) + '|' + norm(c.last_name) + '|' + norm(c.website)] = c; });
  if (!fs.existsSync(foundCsv)) fs.writeFileSync(foundCsv, ['first_name', 'last_name', 'company', 'company_domain', 'email', 'aleads_quality', 'linkedin_url', 'signal', 'evidence_url'].join(',') + '\n');
  if (!fs.existsSync(residueCsv)) fs.writeFileSync(residueCsv, ['first_name', 'last_name', 'company', 'company_domain', 'linkedin_url', 'signal', 'evidence_url', 'aleads_status'].join(',') + '\n');
  let found = 0, residue = 0;
  for (const r of results) {
    const c = byKey[norm(r.first_name) + '|' + norm(r.last_name) + '|' + norm(r.website)] || { first_name: r.first_name, last_name: r.last_name, company: '', website: r.website, linkedin_url: '', signal: '', evidence_url: '' };
    if (r.status === 'found' && r.email) {
      fs.appendFileSync(foundCsv, [c.first_name, c.last_name, c.company, c.website, r.email, r.quality || '', c.linkedin_url, c.signal, c.evidence_url].map(esc).join(',') + '\n'); found++;
    } else {
      fs.appendFileSync(residueCsv, [c.first_name, c.last_name, c.company, c.website, c.linkedin_url, c.signal, c.evidence_url, r.status || 'not_found'].map(esc).join(',') + '\n'); residue++;
    }
  }
  prog.done += results.length;
  fs.writeFileSync(progFile, JSON.stringify(prog));
  console.log(`[${slug}] saved ${results.length} (found ${found}, residue ${residue}) -> done=${prog.done}/${contacts.length}`);
  process.exit(0);
}
console.error('usage: aleads_grind.mjs next|save|status <client> <slug> [arg]');
process.exit(1);
