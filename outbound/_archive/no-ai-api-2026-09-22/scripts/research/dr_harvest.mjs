#!/usr/bin/env node
// dr_harvest.mjs — links → Spider → DeepSeek evidence harvester.
//
// When a deep-research / Perplexity pass returns TOO MANY references to read inline
// (context too big), this DOESN'T pull every page into context. Instead it harvests the
// citation URLs, Spider-scrapes each page, DeepSeek-compresses each to a tight focus-scoped
// digest, and emits ONE merged evidence packet. That keeps big-reference research bounded.
// This is the "generate links instead, then scrape + compress" pattern.
//
// Reuses ai_router.mjs as a subprocess for every Spider + DeepSeek call, so all auth, error
// classification, and the halt contract live in one place (zero duplication, zero new keys).
//
// URL source (pick ONE):
//   --urls "u1,u2,..."          comma-separated list
//   --urls-file <path>          newline- or JSON-array file of URLs
//   --from-router <path>        a saved ai_router.mjs JSON (pulls citations/search_results/results URLs)
//   --from-poll <response_id>   polls an openai-deep-research job and pulls its citation URLs
// Options:
//   --focus "<question>"        REQUIRED — what each digest should extract
//   --max-urls N                default 8  (cost cap)
//   --concurrency N             default 3
//   --request chrome|smart|http spider render mode (default smart); --no-proxy to disable proxy
//   --deepseek-max-tokens N     digest size (default 700)
//   --clip N                    page chars sent to DeepSeek (default 12000, keeps argv < Win 32k limit)
//   --out <path>                write the packet JSON here (else stdout)
//
// Output packet: { ok, focus, requested, relevant_sources, sources:[{url,digest,scraped_chars}],
//                  no_relevant_content:[url], failures:[{url,reason,detail}] }

import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const execFileP = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROUTER = path.resolve(__dirname, 'ai_router.mjs');

function parseArgs(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t.startsWith('--')) {
      const n = t.slice(2); const nx = argv[i + 1];
      if (nx === undefined || nx.startsWith('--')) a[n] = true; else { a[n] = nx; i++; }
    }
  }
  return a;
}
const args = parseArgs(process.argv.slice(2));
const has = k => args[k] !== undefined && args[k] !== true;
// fs.writeSync + natural exit: this process holds no undici sockets (children do the fetching),
// but keep the same discipline as the router so a saved-stdout consumer always gets clean JSON.
function emit(obj, code = 0) { fs.writeSync(1, JSON.stringify(obj, null, 2) + '\n'); process.exitCode = code; const h = new Error('halt'); h.__halt = true; throw h; }
const die = msg => emit({ ok: false, error: msg }, 1);

// Call ai_router.mjs as a subprocess; it prints exactly one JSON object on stdout even on
// non-zero exit, so parse stdout regardless of exit code.
async function router(routerArgs) {
  try {
    const { stdout } = await execFileP('node', [ROUTER, ...routerArgs], { maxBuffer: 64 * 1024 * 1024 });
    return JSON.parse(stdout);
  } catch (e) {
    const so = e && e.stdout && String(e.stdout);
    if (so) { try { return JSON.parse(so); } catch { /* fall through */ } }
    return { ok: false, error: 'router-spawn-failed', detail: String((e && e.message) || e) };
  }
}

function urlsFromRouterJSON(j) {
  const out = [];
  const push = u => {
    if (typeof u === 'string' && /^https?:\/\//.test(u)) out.push(u);
    else if (u && typeof u.url === 'string') out.push(u.url);
    else if (u && typeof u.link === 'string') out.push(u.link);
  };
  (j.citations || []).forEach(push);
  (j.search_results || []).forEach(push);
  (j.results || []).forEach(push);
  return out;
}

async function collectUrls() {
  if (has('urls')) return String(args.urls).split(',').map(s => s.trim()).filter(Boolean);
  if (has('urls-file')) {
    const t = fs.readFileSync(String(args['urls-file']), 'utf8').trim();
    if (t.startsWith('[')) return JSON.parse(t);
    return t.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  }
  if (has('from-router')) return urlsFromRouterJSON(JSON.parse(fs.readFileSync(String(args['from-router']), 'utf8')));
  if (has('from-poll')) {
    const j = await router(['--provider', 'openai-deep-research', '--poll', String(args['from-poll'])]);
    if (j.pending) die(`deep-research job still ${j.status}; poll until completed before harvesting`);
    if (!j.ok) die(`poll failed: ${j.error || 'unknown'}`);
    return urlsFromRouterJSON(j);
  }
  die('no URL source: use --urls | --urls-file | --from-router | --from-poll');
}

const COMPRESS_SYS =
  'You are an evidence extractor. From the web page text, extract ONLY facts, figures, statistics, ' +
  'named benchmarks, and direct quotes that bear on the FOCUS question. Output 3-8 tight bullets, each ' +
  'with the specific number/quote and (if present) the year and source name, verbatim where possible. ' +
  'If the page has nothing relevant to the focus, output exactly: NONE. No preamble, no commentary.';

async function harvestOne(url, focus, dsMax, clip) {
  const spArgs = ['--provider', 'spider', '--url', url, '--request', String(args.request || 'smart')];
  if (args['no-proxy']) spArgs.push('--no-proxy');
  const sp = await router(spArgs);
  if (!sp.ok) return { url, ok: false, reason: sp.error || 'spider-failed', detail: sp.detail };
  const content = (sp.pages || []).map(p => p.content || '').join('\n\n').trim();
  if (!content) return { url, ok: false, reason: 'empty-scrape' };
  const prompt = `FOCUS: ${focus}\n\nPAGE (${url}):\n${content.slice(0, clip)}`;
  const ds = await router(['--provider', 'deepseek', '--max-tokens', String(dsMax), '--system', COMPRESS_SYS, '--prompt', prompt]);
  if (!ds.ok) return { url, ok: false, reason: ds.error || 'deepseek-failed', detail: ds.detail, scraped_chars: content.length };
  const digest = (ds.content || '').trim();
  return { url, ok: true, scraped_chars: content.length, digest, relevant: !!digest && digest.toUpperCase() !== 'NONE' };
}

// bounded-concurrency map
async function pool(items, n, fn) {
  const res = new Array(items.length); let i = 0;
  const worker = async () => { while (i < items.length) { const idx = i++; res[idx] = await fn(items[idx]); } };
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, worker));
  return res;
}

(async () => {
  try {
    const focus = has('focus') ? String(args.focus) : die('--focus is required');
    let urls = await collectUrls();
    urls = [...new Set(urls)].slice(0, has('max-urls') ? parseInt(args['max-urls'], 10) : 8);
    if (!urls.length) die('no URLs to harvest from the chosen source');
    const dsMax = has('deepseek-max-tokens') ? parseInt(args['deepseek-max-tokens'], 10) : 700;
    const clip = has('clip') ? parseInt(args.clip, 10) : 12000;
    const conc = has('concurrency') ? parseInt(args.concurrency, 10) : 3;

    const harvested = await pool(urls, conc, u => harvestOne(u, focus, dsMax, clip));
    const sources = harvested.filter(h => h.ok && h.relevant);
    const empty = harvested.filter(h => h.ok && !h.relevant).map(h => h.url);
    const failures = harvested.filter(h => !h.ok).map(h => ({ url: h.url, reason: h.reason, detail: h.detail }));
    const packet = {
      ok: true, focus, requested: urls.length, relevant_sources: sources.length,
      sources: sources.map(s => ({ url: s.url, scraped_chars: s.scraped_chars, digest: s.digest })),
      no_relevant_content: empty, failures,
    };
    if (has('out')) {
      fs.writeFileSync(String(args.out), JSON.stringify(packet, null, 2) + '\n');
      emit({ ok: true, wrote: String(args.out), relevant_sources: sources.length, requested: urls.length, failures: failures.length });
    } else emit(packet);
  } catch (e) {
    if (e && e.__halt) return;
    fs.writeSync(2, 'dr_harvest error: ' + String((e && e.stack) || e) + '\n');
    process.exitCode = 2;
  }
})();
