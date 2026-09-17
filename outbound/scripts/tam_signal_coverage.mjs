#!/usr/bin/env node
// tam_signal_coverage.mjs — full signal/data-point coverage of the enriched TAM, so campaign
// slices are chosen from the real distribution (# companies per signal), not assumed.
// Usage: node scripts/tam_signal_coverage.mjs <tamCsv>
import fs from 'node:fs';
const file = process.argv[2];
if (!file) { console.error('Usage: node tam_signal_coverage.mjs <tamCsv>'); process.exit(1); }
function pc(t){const r=[];let i=0,f='',rec=[],q=false;while(i<t.length){const c=t[i];if(q){if(c==='"'){if(t[i+1]==='"'){f+='"';i+=2;continue;}q=false;i++;continue;}f+=c;i++;continue;}if(c==='"'){q=true;i++;continue;}if(c===','){rec.push(f);f='';i++;continue;}if(c==='\r'){i++;continue;}if(c==='\n'){rec.push(f);r.push(rec);rec=[];f='';i++;continue;}f+=c;i++;}if(f.length||rec.length){rec.push(f);r.push(rec);}return r;}
const rows = pc(fs.readFileSync(file,'utf8')).filter(x=>x.length>1);
const h = rows[0].map(x=>x.trim());
const ix = n=>h.indexOf(n);
const E = rows.slice(1).filter(r=>(r[ix('enrichment_tier')]||'').trim()==='enriched');
const N = E.length;
const g = (r,c)=>{const k=ix(c);return k<0?'':(r[k]||'').trim();};
const pct = n => (n/N*100).toFixed(0)+'%';
const isTrue = v => /^(true|yes|1)$/i.test(v);
const nonEmpty = v => v!=='' && v.toLowerCase()!=='unknown' && v.toLowerCase()!=='null';

console.log('ENRICHED, ICP-fit universe: '+N+' companies\n');

console.log('## Boolean signals (TRUE / populated / fill%)');
console.log('signal'.padEnd(28)+'TRUE'.padStart(7)+'  populated  fill%');
for(const c of ['has_b2b_portal','has_customer_login','has_public_pricing','has_rfq_or_quote_flow','has_accessibility_statement','no_cookie_consent','has_case_studies','is_multi_country','hidden_pricing','legacy_platform_eol','portal_friction_flag']){
  if(ix(c)<0)continue;
  let t=0,pop=0;for(const r of E){const v=g(r,c);if(v!==''){pop++;if(isTrue(v))t++;}}
  console.log(c.padEnd(28)+String(t).padStart(7)+'  '+String(pop).padStart(8)+'   '+pct(pop));
}

function dist(c,top=8){const m={};for(const r of E){let v=g(r,c)||'(empty)';m[v]=(m[v]||0)+1;}return Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,top);}
console.log('\n## accessibility_exposure_band'); for(const [k,v] of dist('accessibility_exposure_band')) console.log('  '+k.padEnd(12)+v+'  ('+pct(v)+')');
console.log('\n## segment'); for(const [k,v] of dist('segment')) console.log('  '+k.padEnd(22)+v+'  ('+pct(v)+')');
console.log('\n## address_country'); for(const [k,v] of dist('address_country')) console.log('  '+k.padEnd(10)+v+'  ('+pct(v)+')');
console.log('\n## employees'); for(const [k,v] of dist('employees')) console.log('  '+k.padEnd(12)+v+'  ('+pct(v)+')');
console.log('\n## commerce_platform (top)'); for(const [k,v] of dist('commerce_platform')) console.log('  '+k.padEnd(18)+v);
console.log('\n## cms_platform (top)'); for(const [k,v] of dist('cms_platform')) console.log('  '+k.padEnd(18)+v);
console.log('\n## sales_motion (top)'); for(const [k,v] of dist('sales_motion')) console.log('  '+k.padEnd(22)+v);

console.log('\n## Text/data points (# companies populated / fill%)');
for(const c of ['accessibility_risk_findings','self_service_features','named_customers','hiring_commerce_roles','site_languages','vendors','revenue_range','description','keywords','linkedin_url','public_emails_count']){
  if(ix(c)<0)continue; let pop=0;for(const r of E){if(nonEmpty(g(r,c)))pop++;}
  console.log('  '+c.padEnd(28)+String(pop).padStart(6)+'  ('+pct(pop)+')');
}

// ---- campaign-able slices ----
const T=(r,c)=>isTrue(g(r,c));
const band=(r)=>g(r,'accessibility_exposure_band').toLowerCase();
const slice=(name,fn)=>{const n=E.filter(fn).length;console.log('  '+name.padEnd(52)+String(n).padStart(5)+'  ('+pct(n)+')');};
console.log('\n## Campaign-able slices (count of enriched companies)');
slice('Portal candidate (has_b2b_portal=true)', r=>T(r,'has_b2b_portal'));
slice('Portal + customer login (login-gated)', r=>T(r,'has_b2b_portal')&&T(r,'has_customer_login'));
slice('Customer login (any)', r=>T(r,'has_customer_login'));
slice('Portal OR login', r=>T(r,'has_b2b_portal')||T(r,'has_customer_login'));
slice('Hidden pricing (no public pricing)', r=>g(r,'has_public_pricing')!==''&&!T(r,'has_public_pricing'));
slice('Has RFQ/quote flow', r=>T(r,'has_rfq_or_quote_flow'));
slice('Multi-country', r=>T(r,'is_multi_country'));
slice('Legacy platform EOL', r=>T(r,'legacy_platform_eol'));
slice('Portal-friction flag', r=>T(r,'portal_friction_flag'));
slice('Has case studies (proof for lookalike)', r=>T(r,'has_case_studies'));
slice('Has named customers', r=>nonEmpty(g(r,'named_customers')));
slice('Accessibility exposure high', r=>band(r)==='high');
slice('Accessibility exposure high+medium', r=>['high','medium'].includes(band(r)));
slice('C = brochure + a11y high/med + no stmt (NOT portal/login)', r=>!T(r,'has_b2b_portal')&&!T(r,'has_customer_login')&&['high','medium'].includes(band(r))&&!T(r,'has_accessibility_statement'));
slice('Brochure (no portal, no login)', r=>!T(r,'has_b2b_portal')&&!T(r,'has_customer_login'));
