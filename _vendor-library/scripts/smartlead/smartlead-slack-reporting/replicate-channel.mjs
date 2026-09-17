#!/usr/bin/env node
// replicate-channel.mjs — create a NEW smartlead-* Slack channel and invite the SAME members as an
// existing source channel (so a new alert channel gets the same audience as the other smartlead-* ones).
// Idempotent: reuses the channel if it already exists; skips members already present.
//   node replicate-channel.mjs <new-channel-name> <source-channel-id>
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
function env(k){ if(process.env[k]) return process.env[k]; const m=readFileSync(join(__dirname,'..','.env'),'utf8').match(new RegExp('^'+k+'=(.+)$','m')); if(!m) throw new Error(k+' missing'); return m[1].trim(); }
const TOKEN=env('SLACK_BOT_TOKEN');
const NEW_NAME=process.argv[2]; const SRC=process.argv[3];
if(!NEW_NAME||!SRC){ console.error('usage: node replicate-channel.mjs <new-channel-name> <source-channel-id>'); process.exit(1); }
async function sget(method,p){ const r=await fetch('https://slack.com/api/'+method+'?'+new URLSearchParams(p||{}),{headers:{Authorization:'Bearer '+TOKEN}}); return r.json(); }
async function spost(method,b){ const r=await fetch('https://slack.com/api/'+method,{method:'POST',headers:{Authorization:'Bearer '+TOKEN,'Content-Type':'application/json; charset=utf-8'},body:JSON.stringify(b||{})}); return r.json(); }

const me=(await sget('auth.test',{})).user_id;
// 1. find-or-create the new channel
let chId, existed=false;
{ let cursor; outer: do {
    const r=await sget('conversations.list',{exclude_archived:true,types:'public_channel,private_channel',limit:200,cursor});
    if(!r.ok){ console.error('list:',r.error); break; }
    for(const c of r.channels){ if(c.name===NEW_NAME){ chId=c.id; existed=true; break outer; } }
    cursor=r.response_metadata&&r.response_metadata.next_cursor;
  } while(cursor); }
if(!chId){ const c=await spost('conversations.create',{name:NEW_NAME,is_private:true}); if(!c.ok){ console.error('create FAILED:',c.error); process.exit(1);} chId=c.channel.id; } // private by default (operator preference); bot needs groups:write
console.log((existed?'exists ':'created')+' #'+NEW_NAME+' -> '+chId);
// 2. source members -> invite to new channel (minus the bot itself + anyone already in)
const srcMembers=(await sget('conversations.members',{channel:SRC,limit:200})).members||[];
const already=new Set((await sget('conversations.members',{channel:chId,limit:200})).members||[]);
const toInvite=srcMembers.filter(u=>u!==me && !already.has(u));
console.log('source members:',srcMembers.length,'| already in new:',already.size,'| to invite:',toInvite.length);
if(toInvite.length){
  const r=await spost('conversations.invite',{channel:chId,users:toInvite.join(',')});
  if(r.ok){ console.log('invited:',toInvite.join(', ')); }
  else {
    console.error('batch invite error:',r.error,'- retrying per-user');
    for(const u of toInvite){ const x=await spost('conversations.invite',{channel:chId,users:u}); console.log('  ',u,x.ok?'ok':('ERR '+x.error)); await new Promise(z=>setTimeout(z,200)); }
  }
}
console.log('\nfinal members:',((await sget('conversations.members',{channel:chId,limit:200})).members||[]).join(', '));
console.log('\nCHANNELS_JSON key to add:  "reply-alerts":"'+chId+'"');
