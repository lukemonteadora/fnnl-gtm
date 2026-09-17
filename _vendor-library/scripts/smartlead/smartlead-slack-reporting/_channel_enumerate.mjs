#!/usr/bin/env node
// _channel_enumerate.mjs — READ-ONLY. List every channel the bot can see whose name contains
// "smartlead" or "bison", to catch duplicates / strays beyond the 10 in config.local.json.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
function env(k){ if(process.env[k]) return process.env[k]; const m=readFileSync(join(__dirname,'..','.env'),'utf8').match(new RegExp('^'+k+'=(.+)$','m')); if(!m) throw new Error(k+' missing'); return m[1].trim(); }
const TOKEN = env('SLACK_BOT_TOKEN');
const CFG = JSON.parse(readFileSync(join(__dirname,'config.local.json'),'utf8'));
const known = new Set(Object.values(CFG.channels));
async function sget(method,p){ const r=await fetch('https://slack.com/api/'+method+'?'+new URLSearchParams(p||{}),{headers:{Authorization:'Bearer '+TOKEN}}); return r.json(); }
(async()=>{
  let all=[], cursor;
  do{
    const r=await sget('conversations.list',{exclude_archived:false, types:'public_channel,private_channel', limit:200, ...(cursor?{cursor}:{})});
    if(!r.ok){ console.error('list error:', r.error); break; }
    all.push(...r.channels);
    cursor=r.response_metadata && r.response_metadata.next_cursor;
  } while(cursor);
  const hits = all.filter(c=>/smartlead|bison/i.test(c.name));
  console.log('total channels visible to bot:', all.length, '| smartlead/bison matches:', hits.length);
  console.log('-'.repeat(96));
  for(const c of hits.sort((a,b)=>a.name.localeCompare(b.name))){
    const inCfg = known.has(c.id) ? 'CONFIG' : 'EXTRA ';
    console.log(
      (c.is_private?'priv':'pub ')+' '+
      (c.is_archived?'ARCH':'live')+' '+
      (c.is_member?'mem ':'----')+' '+
      inCfg+'  '+c.id.padEnd(12)+'  #'+c.name
    );
  }
})().catch(e=>{console.error('FATAL',e.message);process.exit(1);});
