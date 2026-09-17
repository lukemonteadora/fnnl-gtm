#!/usr/bin/env node
/**
 * linkedin_find_web.mjs — verified LinkedIn-URL finder for the residue A-Leads can't cover.
 *
 * Per operator directive: A-Leads FIRST (run separately, writes _linkedin_aleads.csv);
 * THIS script handles only the residue, using OpenAI on REAL Serper search results.
 *
 * Anti-hallucination guarantee: the chosen URL MUST be one of the real linkedin.com/in
 * links Serper returned — OpenAI only PICKS/CONFIRMS, never invents. A URL is written only
 * when OpenAI confirms the profile's name AND company match the contact. Else left blank.
 *
 *   node linkedin_find_web.mjs <client> <slug> [--limit N] [--gl us]
 *
 * Reads  profiles/<client>/campaigns/<slug>/_linkedin_todo.csv
 * Skips  emails already in _linkedin_aleads.csv (A-Leads pass) and _linkedin_web.csv (resume)
 * Writes profiles/<client>/campaigns/<slug>/_linkedin_web.csv  (email,linkedin_url,confidence,matched,evidence)
 *        profiles/<client>/campaigns/<slug>/_linkedin_web_misses.csv  (email,reason)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
const getKey = k => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim();
const SERPER = getKey('SERPER_API_KEY');
const OPENAI = getKey('OPENAI_API_KEY');

const argv = process.argv.slice(2);
const client = argv[0], slug = argv[1];
const LIMIT = (() => { const i = argv.indexOf('--limit'); return i >= 0 ? parseInt(argv[i + 1], 10) : Infinity; })();
const GL = (() => { const i = argv.indexOf('--gl'); return i >= 0 ? argv[i + 1] : ''; })();
if (!client || !slug) { console.error('usage: linkedin_find_web.mjs <client> <slug> [--limit N] [--gl cc]'); process.exit(1); }

// Optional alias map, only for clients whose profiles/ folder name differs from the CLI slug
// (e.g. 'example': 'example-co'). An unmapped slug resolves to a folder of the same name.
const DIRMAP = {};
const cdir = DIRMAP[client] || client;
const dir = path.join(__dirname, `../profiles/${cdir}/campaigns/${slug}`);
const Q = String.fromCharCode(34);
const pl = l => { const o = []; let c = '', q = false; for (let i = 0; i < l.length; i++) { const ch = l[i]; if (q) { if (ch === Q) { if (l[i + 1] === Q) { c += Q; i++; } else q = false; } else c += ch; } else { if (ch === Q) q = true; else if (ch === ',') { o.push(c); c = ''; } else c += ch; } } o.push(c); return o; };
const esc = v => { const s = String(v ?? ''); return /[",\r\n]/.test(s) ? Q + s.replace(/"/g, Q + Q) + Q : s; };
const norm = s => (s || '').toLowerCase().trim();
const sleep = ms => new Promise(r => setTimeout(r, ms));

function readCsv(f) { if (!fs.existsSync(f)) return { H: [], rows: [] }; const lines = fs.readFileSync(f, 'utf8').replace(/^﻿/, '').split(/\r?\n/).filter(Boolean); const H = pl(lines[0]); return { H, rows: lines.slice(1).map(pl) }; }
function emailsIn(f) { const { H, rows } = readCsv(f); const i = H.indexOf('email'); const s = new Set(); if (i >= 0) for (const r of rows) if (r[i]) s.add(norm(r[i])); return s; }

const todo = readCsv(path.join(dir, '_linkedin_todo.csv'));
const ti = Object.fromEntries(todo.H.map((h, i) => [h, i]));
const already = new Set([...emailsIn(path.join(dir, '_linkedin_aleads.csv')), ...emailsIn(path.join(dir, '_linkedin_aleads_b.csv')), ...emailsIn(path.join(dir, '_linkedin_web.csv')), ...emailsIn(path.join(dir, '_linkedin_web_misses.csv'))]);

const work = todo.rows.filter(r => r[ti.email] && !already.has(norm(r[ti.email]))).slice(0, LIMIT);

const foundCsv = path.join(dir, '_linkedin_web.csv');
const missCsv = path.join(dir, '_linkedin_web_misses.csv');
if (!fs.existsSync(foundCsv)) fs.writeFileSync(foundCsv, 'email,linkedin_url,confidence,matched,evidence\n');
if (!fs.existsSync(missCsv)) fs.writeFileSync(missCsv, 'email,reason\n');

async function serper(q) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const body = { q, num: 6 }; if (GL) body.gl = GL;
      const res = await fetch('https://google.serper.dev/search', { method: 'POST', headers: { 'X-API-KEY': SERPER, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.status === 429) { await sleep(1500 * (attempt + 1)); continue; }
      const j = await res.json();
      return (j.organic || []);
    } catch (e) { await sleep(800 * (attempt + 1)); }
  }
  return [];
}

async function openaiPick(contact, candidates) {
  const sys = 'You match a B2B sales contact to their REAL LinkedIn profile. You are given the contact and a list of candidate LinkedIn results from a web search. Pick the ONE candidate URL that clearly belongs to THIS person at THIS company. Rules: (1) The URL you return MUST be copied exactly from one of the candidate links — never invent or modify a URL. (2) Only confirm when the candidate profile\'s person name matches the contact name AND the company or title corroborates the same employer (allow rebrands/acquisitions, parent/subsidiary, and common name spelling variants). (3) If no candidate clearly matches, return null. Respond ONLY with JSON: {"linkedin_url": string|null, "confident": boolean, "matched_name": string, "matched_company": string, "reason": string}.';
  const user = JSON.stringify({ contact, candidates });
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST', headers: { 'Authorization': `Bearer ${OPENAI}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gpt-4o-mini', temperature: 0, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: sys }, { role: 'user', content: user }] }),
      });
      if (res.status === 429) { await sleep(2000 * (attempt + 1)); continue; }
      const j = await res.json();
      const txt = j.choices?.[0]?.message?.content || '{}';
      return JSON.parse(txt);
    } catch (e) { await sleep(1000 * (attempt + 1)); }
  }
  return { linkedin_url: null, confident: false, reason: 'openai_error' };
}

function cleanLi(u) { if (!u) return ''; let s = String(u).split('?')[0].replace(/\/+$/, ''); return /linkedin\.com\/in\//i.test(s) ? s : ''; }

let found = 0, miss = 0, done = 0;
async function processOne(r) {
  const first = r[ti.first_name] || '', last = r[ti.last_name] || '', company = r[ti.company] || '', domain = r[ti.company_domain] || '', title = r[ti.title] || '', email = r[ti.email];
  const name = `${first} ${last}`.trim();
  // query 1: name + company, restricted to profiles
  let organic = await serper(`"${name}" ${company} site:linkedin.com/in`);
  let cands = organic.filter(o => /linkedin\.com\/in\//i.test(o.link || ''));
  if (cands.length === 0) { // query 2: name + domain token
    const dtok = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('.')[0];
    organic = await serper(`"${name}" ${dtok} linkedin`);
    cands = organic.filter(o => /linkedin\.com\/in\//i.test(o.link || ''));
  }
  if (cands.length === 0) { fs.appendFileSync(missCsv, [esc(email), 'no_candidates'].join(',') + '\n'); miss++; done++; return; }
  const candidates = cands.slice(0, 6).map(o => ({ url: cleanLi(o.link), title: o.title, snippet: o.snippet })).filter(c => c.url);
  const verdict = await openaiPick({ name, title, company, domain }, candidates);
  const url = cleanLi(verdict.linkedin_url);
  const isCand = candidates.some(c => norm(c.url) === norm(url));
  if (verdict.confident && url && isCand) {
    fs.appendFileSync(foundCsv, [esc(email), esc(url), 'web', esc(`${verdict.matched_name} @ ${verdict.matched_company}`), esc((verdict.reason || '').slice(0, 160))].join(',') + '\n'); found++;
  } else {
    fs.appendFileSync(missCsv, [esc(email), esc((verdict.reason || 'not_confident').slice(0, 120))].join(',') + '\n'); miss++;
  }
  done++;
}

// small concurrency pool
const CONC = 4;
async function run() {
  console.log(`[web] ${client}/${slug}: residue=${work.length} (todo=${todo.rows.length}, skipped already=${todo.rows.length - work.length})`);
  let idx = 0;
  async function worker() { while (idx < work.length) { const my = idx++; await processOne(work[my]); if (done % 20 === 0) console.log(`  ..${done}/${work.length} found=${found} miss=${miss}`); } }
  await Promise.all(Array.from({ length: Math.min(CONC, work.length) }, worker));
  console.log(`[web] DONE ${client}/${slug}: found=${found} miss=${miss} of ${work.length}`);
}
run().catch(e => { console.error(e); process.exit(1); });
