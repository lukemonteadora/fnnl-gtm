#!/usr/bin/env node
// Prune tam.csv with validate-icp-fit results: downgrade off-ICP (logistics/freight/ports/etc.)
// from fit_status=good. Reads tam/_icpfit.json {domain:{fit,confidence,reasoning}}. Rewrites tam.csv.
// Usage: node tam_prune_icpfit.mjs <client-slug>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLIENT = process.argv[2];
if (!CLIENT) { console.error('Usage: node tam_prune_icpfit.mjs <client-slug>'); process.exit(1); }
const TAMDIR = path.join(__dirname, `../profiles/${CLIENT}/tam`);

function pl(l){const o=[];let c='',q=false;for(let i=0;i<l.length;i++){const ch=l[i];if(q){if(ch==='"'){if(l[i+1]==='"'){c+='"';i++;}else q=false;}else c+=ch;}else{if(ch==='"')q=true;else if(ch===','){o.push(c);c='';}else c+=ch;}}o.push(c);return o;}
const esc=v=>{const s=String(v??'');return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;};

const lines=fs.readFileSync(path.join(TAMDIR,'tam.csv'),'utf8').split(/\r?\n/).filter(Boolean);
const head=pl(lines[0]); const I=Object.fromEntries(head.map((h,i)=>[h,i]));
const fit=JSON.parse(fs.readFileSync(path.join(TAMDIR,'_icpfit.json'),'utf8'));

// add two columns if absent
const NEWCOLS=['icp_fit','icp_fit_reason'];
const outHead=[...head, ...NEWCOLS.filter(c=>!head.includes(c))];
const oi=Object.fromEntries(outHead.map((h,i)=>[h,i]));

let nYes=0,nPartial=0,nNo=0,nUnval=0;
const outRows=[];
for(const l of lines.slice(1)){
  const c=pl(l); while(c.length<outHead.length)c.push('');
  const dom=c[I.company_domain];
  if(c[I.fit_status]==='bad'){ c[oi.icp_fit]='out_of_geo'; c[oi.icp_fit_reason]=c[I.fit_reason]; outRows.push(c); continue; }
  const v=fit[dom];
  if(!v){ nUnval++; c[oi.icp_fit]='unvalidated'; c[oi.icp_fit_reason]='not in validation batch (dedup)'; outRows.push(c); continue; }
  const f=(v.fit||v.Fit||'').toLowerCase();
  const reason=(v.reasoning||v.Reasoning||'').replace(/\s+/g,' ').slice(0,240);
  const conf=(v.confidence||v.Confidence||'').toLowerCase();
  c[oi.icp_fit]=f||'unknown'; c[oi.icp_fit_reason]=reason;
  if(f==='yes'){ nYes++; c[I.fit_status]='good'; c[I.enrichment_tier]='enriched'; c[I.fit_confidence]=conf==='high'?'0.9':conf==='medium'?'0.7':'0.5'; c[I.fit_reason]=reason||c[I.fit_reason]; }
  else if(f==='partial'){ nPartial++; c[I.fit_status]='maybe'; c[I.enrichment_tier]='enriched'; c[I.fit_confidence]=conf==='high'?'0.6':'0.45'; c[I.fit_reason]=reason; }
  else { nNo++; c[I.fit_status]='bad'; c[I.enrichment_tier]='qualified_out'; c[I.fit_confidence]='0.2'; c[I.fit_reason]=reason||'validate-icp-fit: not ICP'; }
  outRows.push(c);
}
fs.writeFileSync(path.join(TAMDIR,'tam.csv'),[outHead.join(','),...outRows.map(r=>r.map(esc).join(','))].join('\n'));

// recompute slices on fit_status=good
const t={};let goodTot=0;
for(const c of outRows){ if(c[I.fit_status]!=='good')continue; goodTot++; const seg=c[I.segment],p=c[I.customer_portal]; t[seg]=t[seg]||{}; t[seg][p]=(t[seg][p]||0)+1; }
console.error(`validate-icp-fit: yes ${nYes} | partial ${nPartial} | no(pruned) ${nNo} | unvalidated ${nUnval}`);
console.error(`fit_status=good now: ${goodTot}`);
console.error(`good by segment x portal: ${JSON.stringify(t)}`);
const portalGood=c=>0;
let b=0,cc=0;
for(const c of outRows){ if(c[I.fit_status]!=='good')continue; const p=c[I.customer_portal]; if(p==='yes'||p==='partial')b++; else if(p==='no')cc++; }
console.error(`Offer-B (good, portal): ${b} | Offer-C (good, brochure): ${cc}`);
