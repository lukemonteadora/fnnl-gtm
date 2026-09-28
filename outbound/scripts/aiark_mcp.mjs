#!/usr/bin/env node
// Minimal AI Ark hosted-MCP client (JSON-RPC over streamable HTTP). The key is read from
// scripts/.env (AI_ARK_API_KEY) and never printed; every error text is scrubbed.
// Usage:
//   node aiark_mcp.mjs list                          -> tool names + input schemas (free)
//   node aiark_mcp.mjs call <tool> '<json args>' [out.json]
// Output goes to stdout, or to out.json when given (keeps big payloads out of the chat).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const KEY = process.env.AI_ARK_API_KEY;
if (!KEY) { console.error('AI_ARK_API_KEY missing in scripts/.env'); process.exit(2); }
const URL_ = 'https://api.ai-ark.com/v1/mcp?token=' + encodeURIComponent(KEY);
const scrub = s => String(s).split(KEY).join('***');
let session = null;
let id = 0;

async function rpc(method, params, notify = false) {
  const body = notify ? { jsonrpc: '2.0', method, params } : { jsonrpc: '2.0', id: ++id, method, params };
  const headers = { 'content-type': 'application/json', accept: 'application/json, text/event-stream' };
  if (session) headers['mcp-session-id'] = session;
  const res = await fetch(URL_, { method: 'POST', headers, body: JSON.stringify(body) });
  const sid = res.headers.get('mcp-session-id');
  if (sid) session = sid;
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${scrub(text).slice(0, 500)}`);
  if (notify) return null;
  let payload = text;
  if ((res.headers.get('content-type') || '').includes('text/event-stream')) {
    const datas = text.split(/\r?\n/).filter(l => l.startsWith('data:')).map(l => l.slice(5).trim());
    payload = datas.reverse().find(d => d.includes('"id"')) || datas[0] || '';
  }
  const j = JSON.parse(payload);
  if (j.error) throw new Error('RPC error: ' + scrub(JSON.stringify(j.error)));
  return j.result;
}

async function init() {
  await rpc('initialize', { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'fnnl-aiark', version: '1' } });
  await rpc('notifications/initialized', {}, true);
}

const [cmd, tool, argsJson, out] = process.argv.slice(2);
try {
  await init();
  let result;
  if (cmd === 'list') result = await rpc('tools/list', {});
  else if (cmd === 'resources') result = await rpc('resources/list', {});
  else if (cmd === 'read') result = await rpc('resources/read', { uri: tool });
  else if (cmd === 'call') result = await rpc('tools/call', { name: tool, arguments: JSON.parse(argsJson || '{}') });
  else { console.error('usage: list | resources | read <uri> | call <tool> <json> [out]'); process.exit(1); }
  const s = scrub(JSON.stringify(result, null, 1));
  if (out) { fs.writeFileSync(out, s); console.log(`wrote ${out} (${s.length} bytes)`); }
  else console.log(s);
} catch (e) { console.error(scrub(e.message)); process.exit(1); }
