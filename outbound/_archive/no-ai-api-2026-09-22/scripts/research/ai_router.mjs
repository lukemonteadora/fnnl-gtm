#!/usr/bin/env node
// ai_router.mjs — executable layer for ai-model-routing.md
// REBUILT 2026-06-03 from the documented README/contract after the original was lost
// in a OneDrive deletion event. Zero dependencies (native fetch + JSON), Node 18+.
// Keys read from ../.env (scripts/.env). Keys are never printed.
//
// Output contract: single JSON object on stdout —
//   { ok, provider, model, content, citations?, search_results?, usage?, balance?, pages?, results?, error?, detail? }
// On failure: { ok:false, provider, status, errorClass, halt:true, needsTopUp, error, detail }
// Exit codes: 0 ok | 1 usage/config | 2 transient(API/network) | 3 needs operator action (balance/quota/auth)

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── .env loader (../.env relative to this file) ──────────────────────────────
function loadEnv() {
  const envPath = path.resolve(__dirname, '..', '.env');
  const out = {};
  if (fs.existsSync(envPath)) {
    for (const raw of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq === -1) continue;
      const k = line.slice(0, eq).trim();
      let v = line.slice(eq + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      out[k] = v;
    }
  }
  // process.env overrides file
  return { ...out, ...process.env };
}
const ENV = loadEnv();
const key = (...names) => { for (const n of names) { if (ENV[n] && ENV[n].trim()) return ENV[n].trim(); } return ''; };

// ── arg parsing ──────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t.startsWith('--')) {
      const name = t.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) { a[name] = true; }
      else { a[name] = next; i++; }
    }
  }
  return a;
}
const args = parseArgs(process.argv.slice(2));

function out(obj, code = 0) {
  // Print SYNCHRONOUSLY to fd 1, set the exit code, then unwind via a sentinel instead of
  // calling process.exit(). On Windows/Node, process.exit() force-closes the undici fetch
  // socket while it is still tearing down → a libuv UV_HANDLE_CLOSING assertion that corrupts
  // the exit code. Unwinding to the top and letting the event loop drain (undici unrefs idle
  // sockets) exits cleanly with the right code. Caught in the dispatch try/catch below.
  fs.writeSync(1, JSON.stringify(obj, null, 2) + '\n');
  process.exitCode = code;
  const halt = new Error('router-halt'); halt.__halt = true; throw halt;
}
function usageErr(msg) { out({ ok: false, error: 'usage', detail: msg }, 1); }

// ── error classifier → halt contract ────────────────────────────────────────
function classify(status, bodyText) {
  const b = (bodyText || '').toLowerCase();
  if (status === 402 || (status === 403 && /billing|credit|balance|payment/.test(b))) return { errorClass: 'balance', exit: 3, needsTopUp: true };
  if (status === 429 && /insufficient_quota|quota/.test(b)) return { errorClass: 'quota', exit: 3, needsTopUp: true };
  if (status === 401 || status === 403) return { errorClass: 'auth', exit: 3, needsTopUp: false };
  if (status === 429) return { errorClass: 'rate_limit', exit: 2, needsTopUp: false };
  if (status >= 500) return { errorClass: 'server_error', exit: 2, needsTopUp: false };
  if (status === 400) return { errorClass: 'bad_request', exit: 2, needsTopUp: false };
  return { errorClass: 'http_error', exit: 2, needsTopUp: false };
}
function fail(provider, status, bodyText, detail) {
  const c = classify(status, bodyText);
  out({ ok: false, provider, status, errorClass: c.errorClass, halt: true, needsTopUp: c.needsTopUp,
        error: `${provider} HTTP ${status}`, detail: detail ?? bodyText?.slice?.(0, 600) }, c.exit);
}
async function netFail(provider, e) {
  // out()'s halt sentinel unwinds through each run function's try/catch and lands here
  // (every catch funnels the error to netFail). Re-throw it so it keeps propagating to the
  // dispatch handler instead of being mis-reported as a network failure + double-emitted.
  if (e && e.__halt) throw e;
  out({ ok: false, provider, errorClass: 'network', halt: true, needsTopUp: false,
        error: 'network/fetch failure', detail: String(e && e.message || e) }, 2);
}

const provider = args.provider;
const DRY = !!args['dry-run'];
const maxTokensRaw = args['max-tokens'] !== undefined ? parseInt(args['max-tokens'], 10) : 1024;

// ── provider configs for OpenAI-compatible chat APIs ─────────────────────────
const CHAT = {
  perplexity: { url: 'https://api.perplexity.ai/chat/completions', model: 'sonar', keyNames: ['PERPLEXITY_API_KEY'], minTokens: 16 },
  grok:       { url: 'https://api.x.ai/v1/chat/completions',       model: 'grok-3', keyNames: ['XAI_API_KEY', 'GROK_API_KEY'] },
  openai:     { url: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o-mini', keyNames: ['OPENAI_API_KEY'] },
  deepseek:   { url: 'https://api.deepseek.com/chat/completions',  model: 'deepseek-chat', keyNames: ['DEEPSEEK_API_KEY'] },
  minimax:    { url: 'https://api.minimax.io/v1/text/chatcompletion_v2', model: 'MiniMax-Text-01', keyNames: ['MINIMAX_API_KEY'] },
};

async function runChat(name) {
  const cfg = CHAT[name];
  const apiKey = key(...cfg.keyNames);
  const model = args.model || cfg.model;
  let maxTokens = isNaN(maxTokensRaw) ? 1024 : maxTokensRaw;
  if (cfg.minTokens) maxTokens = Math.max(maxTokens, cfg.minTokens);
  const messages = [];
  if (args.system) messages.push({ role: 'system', content: String(args.system) });
  messages.push({ role: 'user', content: String(args.prompt ?? '') });
  // OpenAI's reasoning / GPT-5 models reject the legacy `max_tokens` (they need `max_completion_tokens`)
  // and only allow the default temperature — detect them and shape the body accordingly. Other providers
  // (perplexity/grok/deepseek/minimax) and OpenAI's plain chat models (gpt-4.1/gpt-4o…) keep `max_tokens`.
  const isOpenAIReasoning = name === 'openai' && /^(o\d|gpt-5)/i.test(model);
  const body = { model, messages };
  if (isOpenAIReasoning) {
    body.max_completion_tokens = maxTokens;
    if (args['reasoning-effort']) body.reasoning_effort = String(args['reasoning-effort']); // minimal|low|medium|high
  } else {
    body.max_tokens = maxTokens;
    if (args.temperature !== undefined) body.temperature = parseFloat(args.temperature);
  }
  // NOTE (2026-06-10): xAI's `search_parameters` Live Search is DEPRECATED ("switch to the Agent Tools API").
  // Sending it makes every grok call error, so it is NOT sent. grok here is therefore PLAIN CHAT (training-cutoff) —
  // do NOT use it for current/real-time social or VOC: it answers from stale data or refuses. Real-time grounding
  // needs the xAI Agent Tools API (https://docs.x.ai/docs/guides/tools/overview), a separate server-tools request
  // format = TODO follow-up. Until then, route web-grounded + social-ish research to Perplexity (primary brain).

  if (DRY) out({ ok: true, provider: name, model, dryRun: true, endpoint: cfg.url, body });
  if (!apiKey) usageErr(`missing key (${cfg.keyNames.join(' or ')}) in .env`);

  try {
    const res = await fetch(cfg.url, { method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body) });
    const text = await res.text();
    if (!res.ok) return fail(name, res.status, text);
    let j; try { j = JSON.parse(text); } catch { return fail(name, res.status, text, 'non-JSON response'); }
    const content = j.choices?.[0]?.message?.content ?? '';
    const result = { ok: true, provider: name, model: j.model || model, content };
    if (j.citations) result.citations = j.citations;
    if (j.search_results) result.search_results = j.search_results;
    if (j.usage) result.usage = j.usage;
    out(result);
  } catch (e) { return netFail(name, e); }
}

// ── Claude (Messages API) ─────────────────────────────────────────────────────
async function runClaude() {
  const apiKey = key('CLAUDE_API_KEY', 'ANTHROPIC_API_KEY');
  const model = args.model || 'claude-sonnet-4-6';
  const maxTokens = isNaN(maxTokensRaw) ? 1024 : maxTokensRaw;
  const body = { model, max_tokens: maxTokens, messages: [{ role: 'user', content: String(args.prompt ?? '') }] };
  if (args.system) body.system = String(args.system);
  if (args.temperature !== undefined) body.temperature = parseFloat(args.temperature);
  const url = 'https://api.anthropic.com/v1/messages';
  if (DRY) out({ ok: true, provider: 'claude', model, dryRun: true, endpoint: url, body });
  if (!apiKey) usageErr('missing CLAUDE_API_KEY / ANTHROPIC_API_KEY in .env');
  try {
    const res = await fetch(url, { method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify(body) });
    const text = await res.text();
    if (!res.ok) return fail('claude', res.status, text);
    const j = JSON.parse(text);
    const content = Array.isArray(j.content) ? j.content.map(b => b.text || '').join('') : '';
    out({ ok: true, provider: 'claude', model: j.model || model, content, usage: j.usage });
  } catch (e) { return netFail('claude', e); }
}

// ── Serper (Google Search API) ────────────────────────────────────────────────
async function runSerper() {
  const apiKey = key('SERPER_API_KEY');
  const q = args.query ?? args.prompt;
  const body = { q: String(q ?? '') };
  if (args.gl) body.gl = String(args.gl);
  if (args.hl) body.hl = String(args.hl);
  if (args.num) body.num = parseInt(args.num, 10);
  const url = 'https://google.serper.dev/search';
  if (DRY) out({ ok: true, provider: 'serper', dryRun: true, endpoint: url, body });
  if (!apiKey) usageErr('missing SERPER_API_KEY in .env');
  if (!q) usageErr('serper needs --query');
  try {
    const res = await fetch(url, { method: 'POST',
      headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const text = await res.text();
    if (!res.ok) return fail('serper', res.status, text);
    const j = JSON.parse(text);
    const results = (j.organic || []).map(o => ({ title: o.title, link: o.link, url: o.link, snippet: o.snippet, date: o.date }));
    out({ ok: true, provider: 'serper', query: body.q, results, answerBox: j.answerBox || null, knowledgeGraph: j.knowledgeGraph || null });
  } catch (e) { return netFail('serper', e); }
}

// ── Spider Cloud (URL -> markdown) ──────────────────────────────────────────────────
async function runSpider() {
  const apiKey = key('SPIDER_API_KEY');
  const url = args.url;
  const limit = args.limit ? parseInt(args.limit, 10) : 1;
  const endpoint = 'https://api.spider.cloud/crawl';
  const body = { url: String(url ?? ''), limit, return_format: 'markdown',
    request: args.request || 'smart',     // http|chrome|smart — smart/chrome render JS; default http returned empty on JS/protected sites
    proxy_enabled: !args['no-proxy'] };    // premium proxies to get past bot-walls; default ON, disable with --no-proxy
  if (DRY) out({ ok: true, provider: 'spider', dryRun: true, endpoint, body });
  if (!apiKey) usageErr('missing SPIDER_API_KEY in .env');
  if (!url) usageErr('spider needs --url');
  try {
    const res = await fetch(endpoint, { method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const text = await res.text();
    if (!res.ok) return fail('spider', res.status, text);
    let j; try { j = JSON.parse(text); } catch { return fail('spider', res.status, text, 'non-JSON response'); }
    const arr = Array.isArray(j) ? j : (j.pages || j.data || []);
    const pages = (Array.isArray(arr) ? arr : []).map(p => ({
      url: p.url || (p.metadata && p.metadata.url) || url,
      content: p.content || p.markdown || p.text || (typeof p === 'string' ? p : '')
    }));
    out({ ok: true, provider: 'spider', pages });
  } catch (e) { return netFail('spider', e); }
}

// ── DeepSeek balance ──────────────────────────────────────────────────────────
async function runDeepseekBalance() {
  const apiKey = key('DEEPSEEK_API_KEY');
  const url = 'https://api.deepseek.com/user/balance';
  if (DRY) out({ ok: true, provider: 'deepseek', dryRun: true, endpoint: url, method: 'GET' });
  if (!apiKey) usageErr('missing DEEPSEEK_API_KEY in .env');
  try {
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${apiKey}`, 'Accept': 'application/json' } });
    const text = await res.text();
    if (!res.ok) return fail('deepseek', res.status, text);
    const j = JSON.parse(text);
    out({ ok: true, provider: 'deepseek', balance: j });
  } catch (e) { return netFail('deepseek', e); }
}

// ── xAI Agent Tools (Responses API) — live web + X search with citations ──────
// Replaces the DEPRECATED chat `search_parameters` Live Search. Provider name: grok-agent.
// POST /v1/responses with server-side tools web_search + x_search; --tools web|x|web,x to scope.
async function runGrokAgent() {
  const apiKey = key('XAI_API_KEY', 'GROK_API_KEY');
  const model = args.model || 'grok-4.3';
  const url = 'https://api.x.ai/v1/responses';
  const toolSel = (args.tools ? String(args.tools) : 'web,x').split(',').map(s => s.trim());
  const tools = [];
  if (toolSel.includes('web')) tools.push({ type: 'web_search' });
  if (toolSel.includes('x')) tools.push({ type: 'x_search' });
  const input = [];
  if (args.system) input.push({ role: 'system', content: String(args.system) });
  input.push({ role: 'user', content: String(args.prompt ?? '') });
  const body = { model, input, tools, stream: false };
  if (!isNaN(maxTokensRaw)) body.max_output_tokens = maxTokensRaw;
  if (args.temperature !== undefined) body.temperature = parseFloat(args.temperature);
  if (DRY) out({ ok: true, provider: 'grok-agent', model, dryRun: true, endpoint: url, body });
  if (!apiKey) usageErr('missing key (XAI_API_KEY or GROK_API_KEY) in .env');
  try {
    const res = await fetch(url, { method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body) });
    const text = await res.text();
    if (!res.ok) return fail('grok-agent', res.status, text);
    let j; try { j = JSON.parse(text); } catch { return fail('grok-agent', res.status, text, 'non-JSON response'); }
    // Responses-API shape (defensive): prefer convenience output_text, else concat output[].content[].text
    let content = '';
    if (typeof j.output_text === 'string' && j.output_text) content = j.output_text;
    else for (const item of (Array.isArray(j.output) ? j.output : []))
      for (const p of (Array.isArray(item.content) ? item.content : []))
        if (typeof p.text === 'string') content += p.text;
    const citations = [];
    for (const item of (Array.isArray(j.output) ? j.output : []))
      for (const p of (Array.isArray(item.content) ? item.content : []))
        for (const a of (Array.isArray(p.annotations) ? p.annotations : [])) {
          const u = a.url || (a.url_citation && a.url_citation.url); if (u) citations.push(u);
        }
    if (Array.isArray(j.citations)) j.citations.forEach(c => citations.push(typeof c === 'string' ? c : (c && c.url)));
    const result = { ok: true, provider: 'grok-agent', model: j.model || model, content };
    const uniq = [...new Set(citations.filter(Boolean))];
    if (uniq.length) result.citations = uniq;
    if (j.usage) result.usage = j.usage;
    out(result);
  } catch (e) { return netFail('grok-agent', e); }
}

// ── OpenAI Deep Research (Responses API, background + poll) ────────────────────
// Complementary deep-research engine for the GAPS the Perplexity-led primary pass
// leaves (quantified benchmarks, niche/regulatory depth, multi-hop synthesis) —
// NOT a duplicate broad sweep. Long-running (tens of minutes) → fire-and-poll
// ACROSS calls so a single process never blocks (respects the don't-idle-wait rule):
//   fire:  --provider openai-deep-research --prompt "<gap question>" [--system "<instructions>"]
//          [--model o3-deep-research] [--max-tool-calls 16] [--wait <sec, bounded inline poll>]
//          → returns { pending:true, response_id, status } immediately (default), or the
//            finished packet if --wait was long enough.
//   poll:  --provider openai-deep-research --poll <response_id>
//          → completed → { content, citations:[{url,title}], usage }; else { pending:true, status }.
// Deep-research models REQUIRE a search tool, so web_search_preview is always attached.
const OPENAI_DR_URL = 'https://api.openai.com/v1/responses';
function parseDeepResearch(j, model) {
  let content = '';
  if (typeof j.output_text === 'string' && j.output_text) content = j.output_text;
  else for (const item of (Array.isArray(j.output) ? j.output : []))
    for (const p of (Array.isArray(item.content) ? item.content : []))
      if (typeof p.text === 'string') content += p.text;
  const citations = []; const seen = new Set();
  for (const item of (Array.isArray(j.output) ? j.output : []))
    for (const p of (Array.isArray(item.content) ? item.content : []))
      for (const a of (Array.isArray(p.annotations) ? p.annotations : [])) {
        const u = a.url || (a.url_citation && a.url_citation.url);
        const t = a.title || (a.url_citation && a.url_citation.title) || '';
        if (u && !seen.has(u)) { seen.add(u); citations.push({ url: u, title: t }); }
      }
  const result = { ok: true, provider: 'openai-deep-research', model: j.model || model, status: j.status, content };
  if (citations.length) result.citations = citations;
  if (j.usage) result.usage = j.usage;
  return result;
}
async function getDeepResearch(apiKey, id) {
  const res = await fetch(`${OPENAI_DR_URL}/${encodeURIComponent(id)}`,
    { headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' } });
  const text = await res.text();
  if (!res.ok) return { httpFail: true, status: res.status, text };
  try { return { j: JSON.parse(text) }; } catch { return { httpFail: true, status: res.status, text, detail: 'non-JSON' }; }
}
function deepResearchTerminal(j, id, model) {
  const st = j.status;
  if (st === 'completed') return out(parseDeepResearch(j, model));
  if (st === 'failed' || st === 'cancelled') {
    const em = j.error && (j.error.message || JSON.stringify(j.error));
    return out({ ok: false, provider: 'openai-deep-research', response_id: id, status: st, halt: true,
      error: `deep-research ${st}`, detail: em || (j.incomplete_details && JSON.stringify(j.incomplete_details)) || null }, 2);
  }
  if (st === 'incomplete') return out({ ...parseDeepResearch(j, model), incomplete: true,
    detail: j.incomplete_details ? JSON.stringify(j.incomplete_details) : 'token/tool budget reached' });
  return null; // queued | in_progress → caller handles as pending
}
async function runOpenAIDeepResearch() {
  const apiKey = key('OPENAI_API_KEY');
  const model = args.model || 'o4-mini-deep-research';
  // ── poll mode ──
  if (args.poll && args.poll !== true) {
    if (!apiKey) usageErr('missing OPENAI_API_KEY in .env');
    try {
      const r = await getDeepResearch(apiKey, String(args.poll));
      if (r.httpFail) return fail('openai-deep-research', r.status, r.text, r.detail);
      const done = deepResearchTerminal(r.j, String(args.poll), model);
      if (done !== null) return done;
      return out({ ok: true, provider: 'openai-deep-research', response_id: String(args.poll), status: r.j.status, pending: true,
        detail: `still ${r.j.status}; re-poll: --provider openai-deep-research --poll ${args.poll}` });
    } catch (e) { return netFail('openai-deep-research', e); }
  }
  // ── fire mode ──
  const input = args.system
    ? [{ role: 'developer', content: String(args.system) }, { role: 'user', content: String(args.prompt ?? '') }]
    : String(args.prompt ?? '');
  const maxToolCalls = args['max-tool-calls'] !== undefined ? parseInt(args['max-tool-calls'], 10) : 16;
  const body = { model, input, background: true, tools: [{ type: 'web_search_preview' }] };
  if (!isNaN(maxToolCalls)) body.max_tool_calls = maxToolCalls;
  if (DRY) out({ ok: true, provider: 'openai-deep-research', model, dryRun: true, endpoint: OPENAI_DR_URL, body });
  if (!apiKey) usageErr('missing OPENAI_API_KEY in .env');
  if (!args.prompt) usageErr('openai-deep-research needs --prompt');
  try {
    const res = await fetch(OPENAI_DR_URL, { method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body) });
    const text = await res.text();
    if (!res.ok) return fail('openai-deep-research', res.status, text);
    let j; try { j = JSON.parse(text); } catch { return fail('openai-deep-research', res.status, text, 'non-JSON response'); }
    const id = j.id;
    // optional bounded inline poll (capped under the Bash 600s ceiling); default 0 = fire-and-return
    const waitSec = (args.wait !== undefined && args.wait !== true) ? Math.min(parseInt(args.wait, 10) || 0, 540) : 0;
    if (waitSec > 0 && id) {
      const deadline = Date.now() + waitSec * 1000;
      while (Date.now() < deadline) {
        await new Promise(r => setTimeout(r, 20000));
        const pr = await getDeepResearch(apiKey, id);
        if (pr.httpFail) break;
        const done = deepResearchTerminal(pr.j, id, model);
        if (done !== null) return done;
      }
    }
    return out({ ok: true, provider: 'openai-deep-research', response_id: id, status: j.status || 'queued', pending: true,
      detail: `fired; poll with --provider openai-deep-research --poll ${id}` });
  } catch (e) { return netFail('openai-deep-research', e); }
}

// ── dispatch ──────────────────────────────────────────────────────────────────
// Calls are awaited so an out()-thrown halt sentinel unwinds HERE (not as an unhandled
// rejection). On halt we just return — the event loop drains and Node exits with the
// process.exitCode that out() set. Any non-halt error is a genuine router bug → exit 2.
(async () => {
  try {
    if (!provider) usageErr('missing --provider');
    if (provider === 'serper') return await runSerper();
    if (provider === 'spider') return await runSpider();
    if (provider === 'claude') return await runClaude();
    if (provider === 'deepseek' && args.balance) return await runDeepseekBalance();
    if (provider === 'grok-agent') return await runGrokAgent();
    if (provider === 'openai-deep-research') return await runOpenAIDeepResearch();
    if (CHAT[provider]) return await runChat(provider);
    usageErr(`unknown provider '${provider}' (perplexity|grok|grok-agent|openai|openai-deep-research|deepseek|minimax|claude|serper|spider)`);
  } catch (e) {
    if (e && e.__halt) return; // expected unwind from out()
    fs.writeSync(2, 'router error: ' + String((e && e.stack) || e) + '\n');
    process.exitCode = 2;
  }
})();
