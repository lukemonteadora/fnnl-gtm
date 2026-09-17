#!/usr/bin/env node
// aleads_wf_grind.mjs — resumable A-Leads find grind for a client's consolidated _wf flow.
// Source of truth for "attempted" = _wf/aleads_found.csv (holds BOTH found and not_found rows).
// `next` excludes anything already in aleads_found.csv, so the grind is crash-safe: relaunch and
// it picks up exactly where it died — no separate progress file. Per /email-waterfall doctrine:
// A-Leads FINDS first (no pre-emptive skip); Deliverable.co verifies later; BetterContact = residue.
//
//   node aleads_wf_grind.mjs next   <slug> [n=10]   -> prints up to n undone contacts for <slug> as a JSON group
//                                                      (or "DONE" when the slug is exhausted)
//   node aleads_wf_grind.mjs save   <slug> <json>   -> json = array of A-Leads bulk_find result objects
//                                                      ({first_name,last_name,website,email,quality,status});
//                                                      appends found+not_found to aleads_found.csv
//   node aleads_wf_grind.mjs status [slug]          -> remaining tallies (all slugs, or one)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const Q = String.fromCharCode(34);
// Register the client profile folder here before running (the folder name under profiles/).
// EMPTY BY DESIGN: left blank so an unconfigured run fails loudly instead of reading the wrong
// path. Registered so far: (none yet).
const CLIENT = ''; // '<client-slug>'
if (!CLIENT) {
  console.error("usage: set CLIENT at the top of aleads_wf_grind.mjs to the client's profiles/ folder name first (register the client slug there). Registered so far: (none yet)");
  process.exit(2);
}
const WF = path.join(__dirname, `../profiles/${CLIENT}/campaigns/_wf`);
const REMAIN = path.join(WF, 'aleads_remaining.csv');
const FOUND = path.join(WF, 'aleads_found.csv');
function parseCSV(t){const rows=[];let i=0,f='',row=[],q=false;while(i<t.length){const c=t[i];if(q){if(c===Q){if(t[i+1]===Q){f+=Q;i+=2;continue;}q=false;i++;continue;}f+=c;i++;continue;}if(c===Q){q=true;i++;continue;}if(c===','){row.push(f);f='';i++;continue;}if(c==='\n'){row.push(f);rows.push(row);row=[];f='';i++;continue;}if(c==='\r'){i++;continue;}f+=c;i++;}if(f.length||row.length){row.push(f);rows.push(row);}return rows;}
const esc=v=>{const s=String(v==null?'':v);return /[",\n\r]/.test(s)?Q+s.replace(/"/g,Q+Q)+Q:s;};
function readCsvObj(p){ if(!fs.existsSync(p)) return []; const r=parseCSV(fs.readFileSync(p,'utf8')); if(!r.length) return []; const h=r[0]; return r.slice(1).filter(x=>x.length>1||((x[0]||'').trim())).map(x=>Object.fromEntries(h.map((k,i)=>[k,(x[i]??'').trim()]))); }
const dkey=d=>(d||'').replace(/^https?:\/\//,'').replace(/^www\./,'').replace(/\/.*/,'').trim().toLowerCase();
const norm=s=>(s||'').toLowerCase().trim();
const ckey=(f,l,d)=>norm(f)+'|'+norm(l)+'|'+dkey(d);

const FOUND_HEAD=['first_name','last_name','company_domain','slug','email','quality','status'];
function attemptedKeys(){ return new Set(readCsvObj(FOUND).map(r=>ckey(r.first_name,r.last_name,r.company_domain))); }
function undoneForSlug(slug){ const att=attemptedKeys(); return readCsvObj(REMAIN).filter(r=>r.slug===slug && !att.has(ckey(r.first_name,r.last_name,r.company_domain))); }

const [mode,slug,arg]=process.argv.slice(2);
if(mode==='status'){
  const att=attemptedKeys(); const rem=readCsvObj(REMAIN);
  const bySlug={}; for(const r of rem){ bySlug[r.slug]=bySlug[r.slug]||{rem:0,done:0}; if(att.has(ckey(r.first_name,r.last_name,r.company_domain))) bySlug[r.slug].done++; else bySlug[r.slug].rem++; }
  for(const s of Object.keys(bySlug).sort()){ if(slug&&s!==slug) continue; console.log(`${s}: remaining=${bySlug[s].rem} done=${bySlug[s].done}`); }
  process.exit(0);
}
if(mode==='next'){
  if(!slug){ console.error('next needs <slug>'); process.exit(1); }
  const n=parseInt(arg||'10',10); const undone=undoneForSlug(slug).slice(0,n);
  if(!undone.length){ console.log('DONE'); process.exit(0); }
  console.log(JSON.stringify(undone.map(c=>({first_name:c.first_name,last_name:c.last_name,website:c.company_domain}))));
  process.exit(0);
}
if(mode==='save'){
  if(!slug||!arg){ console.error('save needs <slug> <jsonPath>'); process.exit(1); }
  const results=JSON.parse(fs.readFileSync(arg,'utf8'));
  if(!fs.existsSync(FOUND)) fs.writeFileSync(FOUND, FOUND_HEAD.join(',')+'\n');
  // recover the canonical residue row (exact name + domain) by key, so saved rows match the master
  const undoneAll=readCsvObj(REMAIN).filter(r=>r.slug===slug);
  const byKey={}; undoneAll.forEach(r=>{ byKey[ckey(r.first_name,r.last_name,r.company_domain)]=r; });
  let found=0,nf=0;
  for(const x of results){
    const c=byKey[ckey(x.first_name,x.last_name,x.website)] || {first_name:x.first_name,last_name:x.last_name,company_domain:x.website};
    const ok = norm(x.status)==='found' && x.email;
    fs.appendFileSync(FOUND,[c.first_name,c.last_name,c.company_domain,slug,ok?x.email:'',x.quality||'',ok?'found':'not_found'].map(esc).join(',')+'\n');
    ok?found++:nf++;
  }
  const left=undoneForSlug(slug).length;
  console.log(`saved ${results.length} (found ${found}, not_found ${nf}) | ${slug} remaining=${left}`);
  process.exit(0);
}
console.error('usage: aleads_wf_grind.mjs next|save|status <slug> [n|jsonPath]');
process.exit(1);
