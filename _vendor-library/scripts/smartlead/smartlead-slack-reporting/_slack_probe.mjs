// read-only probe: confirm bot token + workspace, list members of the existing smartlead channels
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
function env(k){ if(process.env[k]) return process.env[k]; const m=readFileSync(join(__dirname,'..','.env'),'utf8').match(new RegExp('^'+k+'=(.+)$','m')); if(!m) throw new Error(k+' missing'); return m[1].trim(); }
const TOKEN=env('SLACK_BOT_TOKEN');
const CFG=JSON.parse(readFileSync(join(__dirname,'config.local.json'),'utf8'));
async function sget(method, params){ const qs=new URLSearchParams(params||{}).toString(); const r=await fetch('https://slack.com/api/'+method+'?'+qs,{headers:{Authorization:'Bearer '+TOKEN}}); return r.json(); }
const auth=await sget('auth.test',{});
console.log('AUTH:', JSON.stringify({ok:auth.ok,team:auth.team,user:auth.user}));
const src = process.env.SLACK_SOURCE_CHANNEL || '<SLACK_SOURCE_CHANNEL_ID>'; // set before use
const mem=await sget('conversations.members',{channel:src,limit:200});
console.log('\nMEMBERS of smartlead-interested-replies ok=',mem.ok,'error=',mem.error||'-','count=',(mem.members||[]).length);
const names={};
if(mem.members){
  for(const uid of mem.members){
    const info=await sget('users.info',{user:uid});
    const u=info.user||{}; names[uid]=(u.profile&&(u.profile.display_name||u.profile.real_name))||u.name||'?';
    console.log(' -',uid, u.is_bot?'[BOT]':'    ', names[uid], u.deleted?'(deleted)':'');
    await new Promise(r=>setTimeout(r,120));
  }
}
console.log('\nPER-CHANNEL member counts + names:');
for(const [k,id] of Object.entries(CFG.channels)){
  const m=await sget('conversations.members',{channel:id,limit:200});
  console.log(' ', k.padEnd(20), id, m.ok?((m.members||[]).length+' members'):('ERR '+m.error));
  await new Promise(r=>setTimeout(r,180));
}
