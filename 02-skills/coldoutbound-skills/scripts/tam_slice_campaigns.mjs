#!/usr/bin/env node
// Slice the ICP-validated tam.csv into the two Wave-1 campaign company lists.
// Offer B (Portal Teardown): fit_status=good AND customer_portal in {yes,partial}
// Offer C (Accessibility Scan): fit_status=good AND customer_portal = no
// Usage: node tam_slice_campaigns.mjs <client-slug>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLIENT = process.argv[2];
if (!CLIENT) { console.error('Usage: node tam_slice_campaigns.mjs <client-slug>'); process.exit(1); }
const BASE = path.join(__dirname, `../profiles/${CLIENT}`);

function pl(l){const o=[];let c='',q=false;for(let i=0;i<l.length;i++){const ch=l[i];if(q){if(ch==='"'){if(l[i+1]==='"'){c+='"';i++;}else q=false;}else c+=ch;}else{if(ch==='"')q=true;else if(ch===','){o.push(c);c='';}else c+=ch;}}o.push(c);return o;}
const esc=v=>{const s=String(v??'');return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;};

const lines=fs.readFileSync(path.join(BASE,'tam/tam.csv'),'utf8').split(/\r?\n/).filter(Boolean);
const head=pl(lines[0]); const I=Object.fromEntries(head.map((h,i)=>[h,i]));
const OUT=['company_name','company_domain','company_linkedin','segment','industry','headcount_range','location_country','location_state','location_city','customer_portal','discolike_score','icp_fit','icp_fit_reason','description'];

const camps={
  'wave1-portal-teardown':   {offer:'B', test:r=>r[I.fit_status]==='good' && ['yes','partial'].includes(r[I.customer_portal])},
  'wave1-accessibility-scan':{offer:'C', test:r=>r[I.fit_status]==='good' && r[I.customer_portal]==='no'},
};
const summary={};
for(const [slug,cfg] of Object.entries(camps)){
  const rows=lines.slice(1).map(pl).filter(cfg.test);
  const dir=path.join(BASE,'campaigns',slug); fs.mkdirSync(dir,{recursive:true});
  const out=[OUT.join(','), ...rows.map(r=>OUT.map(k=>esc(r[I[k]])).join(','))].join('\n');
  fs.writeFileSync(path.join(dir,'leads.companies.csv'),out);
  const seg={}; for(const r of rows){const s=r[I.segment];seg[s]=(seg[s]||0)+1;}
  summary[slug]={offer:cfg.offer,count:rows.length,by_segment:seg};
}
console.error(JSON.stringify(summary,null,1));
