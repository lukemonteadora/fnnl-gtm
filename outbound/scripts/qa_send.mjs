#!/usr/bin/env node
// qa_send.mjs <leads.send.csv> — run the hardened copy QA gates directly on a send CSV.
import { readFileSync } from 'fs';
function parseCsv(t){const rows=[];let i=0,f='',rec=[],q=false;const pf=()=>{rec.push(f);f='';};const pr=()=>{rows.push(rec);rec=[];};while(i<t.length){const c=t[i];if(q){if(c==='"'){if(t[i+1]==='"'){f+='"';i+=2;continue;}q=false;i++;continue;}f+=c;i++;continue;}if(c==='"'){q=true;i++;continue;}if(c===','){pf();i++;continue;}if(c==='\r'){i++;continue;}if(c==='\n'){pf();pr();i++;continue;}f+=c;i++;}if(f.length||rec.length){pf();pr();}return rows.filter(r=>r.length>1);}
const wc=s=>String(s||'').trim().split(/\s+/).filter(Boolean).length;
const firstBlock=s=>String(s||'').trim().split(/\n\s*\n/)[0]||'';
const lastBlock=s=>{const b=String(s||'').trim().split(/\n\s*\n/);return b[b.length-1]||'';};
// Generic copy gates only. Client-specific banned tokens (the client's own brand name, its
// HQ city, client-internal job titles) get added to this list per engagement.
const BANNED=[/—/,/–/,/ - /,/\bi noticed\b/i,/\bi saw\b/i,/\bi came across\b/i,/\bfollowing up\b/i,/\bchecking in\b/i,/\bworth a look\b/i,/want me to (send|share)/i,/\breaching out\b/i,/\bquick question\b/i,/\{\{/,/\bcash\b/i];
const E1E3=['email_1_a','email_1_b','email_1_c','email_3_a','email_3_b'],E2E4=['email_2','email_4'];
const rows=parseCsv(readFileSync(process.argv[2],'utf8'));const h=rows[0];const gi=n=>h.indexOf(n);
let tally={qfirst:0,nocta:0,banned:0,greeting:0,words:0};const flaggedRows=new Set();
rows.slice(1).forEach((r,k)=>{
  const get=c=>r[gi(c)]||'';let rowFlags=[];
  for(const c of E1E3){if(!/\?/.test(firstBlock(get(c)))){tally.qfirst++;rowFlags.push('qfirst:'+c);}const w=wc(get(c));if(w<48||w>92){tally.words++;}}
  for(const c of E2E4){if(!/\?/.test(lastBlock(get(c)))){tally.nocta++;rowFlags.push('nocta:'+c);}}
  for(const c of [...E1E3,...E2E4]){const b=get(c);for(const re of BANNED){if(re.test(b)){tally.banned++;rowFlags.push('banned:'+c+':'+re.source.replace(/\b/g,''));break;}}if(/^\s*(hi|hello|hey)\b/i.test(b)){tally.greeting++;rowFlags.push('greeting:'+c);}}
  if(rowFlags.length)flaggedRows.add(k);
});
console.log(process.argv[2].split(/[\/]/).slice(-2)[0]+': rows='+(rows.length-1)+' flaggedRows='+flaggedRows.size+'  cells → '+JSON.stringify(tally));
