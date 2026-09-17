#!/usr/bin/env node
// _channel_audit.mjs — READ-ONLY roster/privacy/membership audit of every smartlead-* channel.
// Reports per channel: is_private, whether the bot is a member, and ATTEMPTS history (last-post age +
// 24h/7d/30d counts). NOTE: the the upstream workspace bot has no groups:history/channels:history scope, so the history
// columns return "⚠ history scope: missing_scope" — that's expected. To read actual channel CONTENTS,
// use Claude-in-Chrome javascript_tool against the logged-in the upstream workspace Slack web app (the Slack MCP is the
// wrong workspace). This script is still useful for membership + the is_private check. Posts/changes NOTHING.
//   node _channel_audit.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
function env(k){ if(process.env[k]) return process.env[k]; const m=readFileSync(join(__dirname,'..','.env'),'utf8').match(new RegExp('^'+k+'=(.+)$','m')); if(!m) throw new Error(k+' missing'); return m[1].trim(); }
const TOKEN = env('SLACK_BOT_TOKEN');
const CFG = JSON.parse(readFileSync(join(__dirname,'config.local.json'),'utf8'));
const CHANNELS = CFG.channels;

async function sget(method, p){ const r=await fetch('https://slack.com/api/'+method+'?'+new URLSearchParams(p||{}),{headers:{Authorization:'Bearer '+TOKEN}}); return r.json(); }

const now = Math.floor(Date.now()/1000);
const D = 86400;
function age(ts){ const s=now-ts; if(s<3600) return Math.round(s/60)+'m'; if(s<D) return Math.round(s/3600)+'h'; return Math.round(s/D)+'d'; }
function iso(ts){ return new Date(ts*1000).toISOString().replace('T',' ').slice(0,16)+'Z'; }

(async()=>{
  const who = await sget('auth.test',{});
  console.log('workspace:', who.team, '| url:', who.url, '| bot:', who.user, '('+who.user_id+')');
  console.log('='.repeat(110));
  const botId = who.user_id;

  // pull all history pages for a channel up to `cap` messages
  async function history(id, cap=400){
    let msgs=[], cursor, scopeErr=null;
    do{
      const r=await sget('conversations.history',{channel:id, limit:200, ...(cursor?{cursor}:{})});
      if(!r.ok){ scopeErr=r.error; break; }
      msgs.push(...(r.messages||[]));
      cursor = r.response_metadata && r.response_metadata.next_cursor;
    } while(cursor && msgs.length<cap);
    return {msgs, scopeErr};
  }

  const rows=[];
  for(const [key,id] of Object.entries(CHANNELS)){
    const info = await sget('conversations.info',{channel:id});
    const name = info.ok ? info.channel.name : '(info-err:'+info.error+')';
    const isPriv = info.ok ? info.channel.is_private : '?';
    const isMember = info.ok ? info.channel.is_member : '?';
    const created = info.ok ? info.channel.created : null;

    const {msgs, scopeErr} = await history(id);
    // only count real posts (skip channel_join/system subtypes)
    const real = msgs.filter(m=>!m.subtype || m.subtype==='bot_message' || m.subtype==='thread_broadcast');
    const last = real[0];
    const c24 = real.filter(m=>now-(+m.ts)<D).length;
    const c7  = real.filter(m=>now-(+m.ts)<7*D).length;
    const c30 = real.filter(m=>now-(+m.ts)<30*D).length;
    const lastBy = last ? (last.bot_id||last.app_id ? 'bot' : (last.user===botId?'bot':'user')) : '-';
    rows.push({key,name,isPriv,isMember,created,
      last: last? +last.ts : null,
      lastTxt: last? (last.text||'').replace(/\s+/g,' ').slice(0,48) : '',
      c24,c7,c30, total: real.length, scopeErr});
  }

  // print table
  const pad=(s,n)=>String(s).padEnd(n).slice(0,n);
  console.log(pad('channel',26)+pad('priv',5)+pad('mem',5)+pad('lastPost',13)+pad('age',7)+pad('24h',5)+pad('7d',5)+pad('30d',5)+'lastText / note');
  console.log('-'.repeat(130));
  for(const r of rows){
    const note = r.scopeErr ? ('⚠ history scope: '+r.scopeErr) : (r.lastTxt||'(no messages found)');
    console.log(
      pad('smartlead-'+r.key,26)+pad(r.isPriv,5)+pad(r.isMember,5)+
      pad(r.last?iso(r.last).slice(5):'—',13)+pad(r.last?age(r.last):'—',7)+
      pad(r.c24,5)+pad(r.c7,5)+pad(r.c30,5)+ note
    );
  }
  console.log('-'.repeat(130));
  console.log('age = time since last post. counts = real posts in window. mem=bot is a member. note shows last post text or a scope error.');
})().catch(e=>{ console.error('FATAL', e.message); process.exit(1); });
