#!/usr/bin/env node
// aleads_wf_remaining.mjs — compute the A-Leads find grind's REMAINING rows for a client's
// consolidated _wf flow (resumable by set-difference). The crashed grind persisted both found
// AND not_found rows to _wf/aleads_found.csv (schema: first_name,last_name,company_domain,slug,
// email,quality,status), so "attempted" = any (first|last|domain|slug) already present there.
//
//   node aleads_wf_remaining.mjs            -> writes _wf/aleads_remaining.csv + prints per-slug counts
//
// Output schema matches all.residue_in.csv so a grind subagent can read it directly.
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
  console.error("usage: set CLIENT at the top of aleads_wf_remaining.mjs to the client's profiles/ folder name first (register the client slug there). Registered so far: (none yet)");
  process.exit(2);
}
const WF = path.join(__dirname, `../profiles/${CLIENT}/campaigns/_wf`);
function parseCSV(t){const rows=[];let i=0,f='',row=[],q=false;while(i<t.length){const c=t[i];if(q){if(c===Q){if(t[i+1]===Q){f+=Q;i+=2;continue;}q=false;i++;continue;}f+=c;i++;continue;}if(c===Q){q=true;i++;continue;}if(c===','){row.push(f);f='';i++;continue;}if(c==='\n'){row.push(f);rows.push(row);row=[];f='';i++;continue;}if(c==='\r'){i++;continue;}f+=c;i++;}if(f.length||row.length){row.push(f);rows.push(row);}return rows;}
const esc=v=>{const s=String(v==null?'':v);return /[",\n\r]/.test(s)?Q+s.replace(/"/g,Q+Q)+Q:s;};
function readCsvObj(p){ if(!fs.existsSync(p)) return []; const r=parseCSV(fs.readFileSync(p,'utf8')); if(!r.length) return []; const h=r[0]; return r.slice(1).filter(x=>x.length>1||((x[0]||'').trim())).map(x=>Object.fromEntries(h.map((k,i)=>[k,(x[i]??'').trim()]))); }
const dkey=d=>(d||'').replace(/^https?:\/\//,'').replace(/^www\./,'').replace(/\/.*/,'').trim().toLowerCase();
const norm=s=>(s||'').toLowerCase().trim();
const ckey=r=>norm(r.first_name)+'|'+norm(r.last_name)+'|'+dkey(r.company_domain)+'|'+norm(r.slug);

const residue = readCsvObj(path.join(WF,'all.residue_in.csv'));
const found   = readCsvObj(path.join(WF,'aleads_found.csv'));
const attempted = new Set(found.map(ckey));

const head=['first_name','last_name','company','company_domain','linkedin_url','title','slug'];
const out=[head.join(',')];
const remBySlug={}, attBySlug={};
for(const r of residue){
  attBySlug[r.slug]=(attBySlug[r.slug]||0);
  if(attempted.has(ckey(r))){ attBySlug[r.slug]++; continue; }
  remBySlug[r.slug]=(remBySlug[r.slug]||0)+1;
  out.push([r.first_name,r.last_name,r.company,r.company_domain,r.linkedin_url,r.title,r.slug].map(esc).join(','));
}
fs.writeFileSync(path.join(WF,'aleads_remaining.csv'),out.join('\n')+'\n');
const totalRem=out.length-1;
console.log(`residue=${residue.length} attempted=${attempted.size} -> REMAINING=${totalRem} -> _wf/aleads_remaining.csv`);
console.log('per-slug remaining:');
for(const s of Object.keys({...remBySlug,...attBySlug}).sort()) console.log(`  ${s}: remaining=${remBySlug[s]||0} (attempted=${attBySlug[s]||0})`);
