#!/usr/bin/env node
// Minimal Perplexity research helper for the coldoutbound research pipeline.
// Reads PERPLEXITY_API_KEY from scripts/.env. Prints the answer + exact usage/cost.
// Usage:
//   node pplx_research.mjs --model sonar-pro --out <file.json> --q "question"
//   echo "long question" | node pplx_research.mjs --model sonar --out <file.json>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- load .env (simple parser, no deps) ---
function loadEnv(p) {
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!process.env[m[1]]) process.env[m[1]] = v;
  }
}
loadEnv(path.join(__dirname, '.env'));

const KEY = process.env.PERPLEXITY_API_KEY;
if (!KEY) { console.error('PERPLEXITY_API_KEY missing'); process.exit(1); }

// --- args ---
const args = process.argv.slice(2);
function opt(name, def) { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : def; }
const model = opt('--model', 'sonar-pro');
const out = opt('--out', null);
const system = opt('--system', 'You are a precise B2B go-to-market research analyst. Cite sources. Be specific, evidence-first, and concise. Never invent data; say when something is unknown.');
let q = opt('--q', null);
if (!q && !process.stdin.isTTY) q = fs.readFileSync(0, 'utf8').trim();
if (!q) { console.error('No question provided (--q or stdin)'); process.exit(1); }

const body = {
  model,
  messages: [
    { role: 'system', content: system },
    { role: 'user', content: q },
  ],
};

const res = await fetch('https://api.perplexity.ai/chat/completions', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});
if (!res.ok) {
  console.error(`Perplexity API error ${res.status}: ${await res.text()}`);
  process.exit(1);
}
const data = await res.json();
const content = data.choices?.[0]?.message?.content ?? '';
const usage = data.usage ?? {};
const citations = data.citations ?? data.search_results ?? [];

if (out) {
  fs.writeFileSync(out, JSON.stringify({ model, q, content, usage, citations }, null, 2));
}
console.log(content);
console.error(`\n--- USAGE [${model}] tokens=${usage.total_tokens ?? '?'} cost_usd=${usage.cost?.total_cost ?? usage.total_cost ?? 'n/a'} ---`);
if (out) console.error(`saved -> ${out}`);
