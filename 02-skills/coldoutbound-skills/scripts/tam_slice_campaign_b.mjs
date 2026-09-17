#!/usr/bin/env node
// tam_slice_campaign_b.mjs — RE-SCOPE Campaign B onto the verifiable buying-friction universe
// (customer login OR RFQ/quote-flow OR portal-friction flag), excluding Campaign C's brochure
// set so the two campaigns stay mutually exclusive. Hidden-pricing is carried as a copy sub-angle.
// Writes the new leads.companies.csv + a priority-ordered _discovery-queue.txt for Campaign B,
// and reports overlap with the already-discovered B set.
//
// Usage: node scripts/tam_slice_campaign_b.mjs <tamCsv> <bCampaignDir> <cCampaignDir>
import fs from 'node:fs';
import path from 'node:path';
const [tamCsv, bDir, cDir] = process.argv.slice(2);
if (!tamCsv || !bDir || !cDir) { console.error('Usage: node tam_slice_campaign_b.mjs <tamCsv> <bDir> <cDir>'); process.exit(1); }
function pc(t){const r=[];let i=0,f='',rec=[],q=false;while(i<t.length){const c=t[i];if(q){if(c==='"'){if(t[i+1]==='"'){f+='"';i+=2;continue;}q=false;i++;continue;}f+=c;i++;continue;}if(c==='"'){q=true;i++;continue;}if(c===','){rec.push(f);f='';i++;continue;}if(c==='\r'){i++;continue;}if(c==='\n'){rec.push(f);r.push(rec);rec=[];f='';i++;continue;}f+=c;i++;}if(f.length||rec.length){rec.push(f);r.push(rec);}return r;}
const esc=v=>{const s=v==null?'':String(v);return /[",\n\r]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;};
const isTrue=v=>/^(true|yes|1)$/i.test((v||'').trim());

const rows=pc(fs.readFileSync(tamCsv,'utf8')).filter(x=>x.length>1);
const h=rows[0].map(x=>x.trim());const ix=n=>h.indexOf(n);
const g=(r,c)=>{const k=ix(c);return k<0?'':(r[k]||'').trim();};
const E=rows.slice(1).filter(r=>g(r,'enrichment_tier')==='enriched');

// C domains to exclude
const cDomains=new Set();
const cRows=pc(fs.readFileSync(path.join(cDir,'leads.companies.csv'),'utf8')).filter(x=>x.length>1);
const cH=cRows[0].map(x=>x.trim());const cdi=cH.indexOf('company_domain');
for(const r of cRows.slice(1)) cDomains.add((r[cdi]||'').trim().toLowerCase());

// already-discovered B domains (from existing _raw part files) — so next discovery skips them
const bRaw=path.join(bDir,'_raw');
const seen=new Set();
if(fs.existsSync(bRaw)){for(const f of fs.readdirSync(bRaw).filter(x=>x.endsWith('.jsonl'))){for(const ln of fs.readFileSync(path.join(bRaw,f),'utf8').split(/\r?\n/)){if(!ln.trim())continue;try{const o=JSON.parse(ln);if(o.d)seen.add(o.d.toLowerCase());}catch{}}}}

const OUT=['company_domain','company_name','segment','address_country','employees','has_customer_login','has_rfq_or_quote_flow','has_public_pricing','hidden_pricing','portal_friction_flag','is_multi_country','commerce_platform','cms_platform','named_customers','accessibility_exposure_band','web_evidence_url','linkedin_url','friction_signals','b_priority'];
const out=[];
for(const r of E){
  const dom=g(r,'company_domain').toLowerCase();
  if(cDomains.has(dom)) continue; // mutually exclusive with C
  const login=isTrue(g(r,'has_customer_login'));
  const rfq=isTrue(g(r,'has_rfq_or_quote_flow'));
  const pflag=isTrue(g(r,'portal_friction_flag'));
  if(!(login||rfq||pflag)) continue; // must have a verifiable buying surface
  const hidden=g(r,'has_public_pricing')!=='' && !isTrue(g(r,'has_public_pricing'));
  const sig=[login?'login':null,rfq?'rfq_quote':null,pflag?'portal_friction':null,hidden?'hidden_pricing':null].filter(Boolean);
  // priority: account+quote friction strongest, then account, then quote, then portal-friction-only
  const pr = (login&&rfq)?'1_login_quote':login?'2_login':rfq?'3_quote':'4_portal_friction';
  out.push({dom,r,login,rfq,pflag,hidden,sig,pr});
}
const PR=['1_login_quote','2_login','3_quote','4_portal_friction'];
out.sort((a,b)=>PR.indexOf(a.pr)-PR.indexOf(b.pr) || a.dom.localeCompare(b.dom));

const lines=[OUT.join(',')];
for(const o of out){
  const r=o.r;
  lines.push([g(r,'company_domain'),g(r,'company_name'),g(r,'segment'),g(r,'address_country'),g(r,'employees'),g(r,'has_customer_login'),g(r,'has_rfq_or_quote_flow'),g(r,'has_public_pricing'),o.hidden?'true':'false',g(r,'portal_friction_flag'),g(r,'is_multi_country'),g(r,'commerce_platform'),g(r,'cms_platform'),g(r,'named_customers'),g(r,'accessibility_exposure_band'),g(r,'web_evidence_url'),g(r,'linkedin_url'),o.sig.join(';'),o.pr].map(esc).join(','));
}
fs.writeFileSync(path.join(bDir,'leads.companies.csv'),lines.join('\n')+'\n');
// full priority queue + the NEW (not-yet-discovered) subset
fs.writeFileSync(path.join(bDir,'_discovery-queue.txt'),out.map(o=>o.dom).join('\n')+'\n');
const fresh=out.filter(o=>!seen.has(o.dom));
fs.writeFileSync(path.join(bDir,'_discovery-queue.new.txt'),fresh.map(o=>o.dom).join('\n')+'\n');

const by={};for(const o of out)by[o.pr]=(by[o.pr]||0)+1;
const geo={};for(const o of out){const c=g(o.r,'address_country');geo[c]=(geo[c]||0)+1;}
const seg={};for(const o of out){const s=g(o.r,'segment');seg[s]=(seg[s]||0)+1;}
console.log('=== Re-scoped Campaign B (buying-friction, mutually exclusive with C) ===');
console.log('total companies     : '+out.length+'  (was 431 portal-candidate)');
console.log('by priority         : '+JSON.stringify(by));
console.log('by segment          : '+JSON.stringify(seg));
console.log('by country          : '+JSON.stringify(geo));
console.log('already discovered  : '+out.filter(o=>seen.has(o.dom)).length+' (reuse existing _raw contacts)');
console.log('NEW to discover      : '+fresh.length+' (in _discovery-queue.new.txt)');
console.log('wrote leads.companies.csv ('+out.length+'), _discovery-queue.txt (full priority), _discovery-queue.new.txt ('+fresh.length+')');
