#!/usr/bin/env node
// merge_gen.mjs
// Merge /personalization-subagent-pattern part files (_gen/part_*.jsonl) back onto a
// campaign's leads.verified.csv by idx (= 1-based row order from build_gen_input.mjs),
// run the export-gate QA across all 7 email columns, and write:
//   <campaignDir>/leads.generated.csv   (verified cols + 7 email cols + qa_flags), ALL rows
//   <campaignDir>/leads.send.csv         (rows that pass the hard gate) — upload-ready
//   prints a QA summary + the flagged rows.
//
// Usage: node scripts/merge_gen.mjs <campaignDir>
import fs from 'node:fs';
import path from 'node:path';

const campaignDir = process.argv[2];
if (!campaignDir) { console.error('Usage: node merge_gen.mjs <campaignDir>'); process.exit(1); }

function parseCsv(text){const rows=[];let i=0,f='',rec=[],q=false;const pf=()=>{rec.push(f);f='';};const pr=()=>{rows.push(rec);rec=[];};while(i<text.length){const c=text[i];if(q){if(c==='"'){if(text[i+1]==='"'){f+='"';i+=2;continue;}q=false;i++;continue;}f+=c;i++;continue;}if(c==='"'){q=true;i++;continue;}if(c===','){pf();i++;continue;}if(c==='\r'){i++;continue;}if(c==='\n'){pf();pr();i++;continue;}f+=c;i++;}if(f.length||rec.length){pf();pr();}return rows;}
const esc=v=>{const s=v==null?'':String(v);return /[",\n\r]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;};
const wc=s=>String(s||'').trim().split(/\s+/).filter(Boolean).length;

// load generated parts
const genDir=path.join(campaignDir,'_gen');
const parts=fs.readdirSync(genDir).filter(f=>/^part_.*\.jsonl$/.test(f)).sort();
const gen={};
let genCount=0;
for(const p of parts){
  for(const ln of fs.readFileSync(path.join(genDir,p),'utf8').split(/\r?\n/)){
    if(!ln.trim())continue;
    let o;try{o=JSON.parse(ln);}catch{continue;}
    if(o.idx==null)continue;
    gen[o.idx]=o;genCount++;
  }
}

// email_1_c added 2026-09-23 (Aaron process alignment, operator directive 2026-09-22: three Email 1 variants by default).
const COLS=['email_1_a','email_1_b','email_1_c','email_2','email_3_a','email_3_b','email_4'];
const E1E3=['email_1_a','email_1_b','email_1_c','email_3_a','email_3_b'];
const E2E4=['email_2','email_4'];
// Generic copy gates only. Client-specific banned tokens (the client's own brand name, its
// HQ city, client-internal job titles) get added to this list per engagement.
const BANNED=[/—/,/–/,/ - /,/\bi noticed\b/i,/\bi saw\b/i,/\bi came across\b/i,/\bcircling back\b/i,/\btouching base\b/i,/\bbumping this\b/i,/\bfollowing up\b/i,/\bchecking in\b/i,/hope you'?re well/i,/hope this finds you/i,/\bworth a look\b/i,/want me to (send|share)/i,/\breaching out\b/i,/\bi wanted to (reach out|connect)\b/i,/\bact now\b/i,/\bbuy now\b/i,/\b100% free\b/i,/\bsign up free\b/i,/\bquick question\b/i,/\bleverage\b/i,/\bsynergy\b/i,/\becosystem\b/i,/\{\{/,/\{first/i,/\{company/i];
function bannedHits(s){const h=[];for(const re of BANNED){if(re.test(s))h.push(re.source.replace(/\\b/g,''));}return h;}
// hard gates added by the 2026-06-19 flow-audit remediation:
const firstBlock=s=>String(s||'').trim().split(/\n\s*\n/)[0]||'';
const lastBlock=s=>{const b=String(s||'').trim().split(/\n\s*\n/);return b[b.length-1]||'';};
const isQuestionFirst=s=>/\?/.test(firstBlock(s));               // HR19: E1/E3 opener must be a question
const hasCta=s=>/\?/.test(lastBlock(s));                          // HR31: E2/E4 must end with a question/next-step, not trail off
const badGreeting=s=>/^\s*(hi|hello|hey)\b/i.test(String(s||'')); // greeting must be the baked first name, never "Hi,"/"Hello,"

const lv=parseCsv(fs.readFileSync(path.join(campaignDir,'leads.verified.csv'),'utf8')).filter(r=>r.length>1);
const head=lv[0];
const outHead=[...head,...COLS,'qa_flags'];
const allRows=[outHead];
const sendRows=[outHead];
const flags=[];
lv.slice(1).forEach((r,i)=>{
  const idx=i+1;
  const g=gen[idx];
  const f=[];
  if(!g){f.push('NO_GEN');COLS.forEach(()=>{});}
  const vals=COLS.map(c=>g?(g[c]||''):'');
  COLS.forEach((c,k)=>{ if(!vals[k].trim()) f.push('blank:'+c); });
  if(g){
    for(const c of E1E3){const w=wc(g[c]);if(w<48||w>92)f.push('words:'+c+'='+w);}
    for(const c of E2E4){const w=wc(g[c]);if(w>55)f.push('words:'+c+'='+w);}
    for(const c of COLS){const h=bannedHits(g[c]||'');if(h.length)f.push('banned:'+c+'['+h.join('|')+']');}
    for(const c of E1E3){if(!isQuestionFirst(g[c]))f.push('qfirst:'+c);}   // HR19 hard
    for(const c of E2E4){if(!hasCta(g[c]))f.push('nocta:'+c);}             // HR31 hard
    for(const c of COLS){if(badGreeting(g[c]))f.push('greeting:'+c);}      // baked-first-name greeting hard
  }
  const flagStr=f.join('; ');
  const row=[...r,...vals,flagStr];
  allRows.push(row);
  // send gate: hard fails = blank / banned / NO_GEN / qfirst / nocta / greeting (word-count flags stay soft)
  const hard=f.filter(x=>x.startsWith('blank')||x.startsWith('banned')||x==='NO_GEN'||x.startsWith('qfirst')||x.startsWith('nocta')||x.startsWith('greeting'));
  if(hard.length===0) sendRows.push(row);
  if(f.length) flags.push({idx,company:r[head.indexOf('company_domain')],flags:flagStr});
});

fs.writeFileSync(path.join(campaignDir,'leads.generated.csv'),allRows.map(r=>r.map(esc).join(',')).join('\n')+'\n');
fs.writeFileSync(path.join(campaignDir,'leads.send.csv'),sendRows.map(r=>r.map(esc).join(',')).join('\n')+'\n');

console.log('=== merge_gen: '+path.basename(campaignDir)+' ===');
console.log('verified rows         : '+(lv.length-1));
console.log('generated objects     : '+genCount+' (unique idx '+Object.keys(gen).length+')');
console.log('leads.generated.csv   : '+(allRows.length-1)+' rows (all)');
console.log('leads.send.csv        : '+(sendRows.length-1)+' rows (passed hard gate: all 7 cols, no banned token)');
console.log('flagged rows          : '+flags.length);
for(const fl of flags.slice(0,40)) console.log('   idx '+fl.idx+' ('+fl.company+'): '+fl.flags);
if(flags.length>40) console.log('   ... +'+(flags.length-40)+' more');
