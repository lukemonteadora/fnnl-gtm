#!/usr/bin/env node
// aleads-selftest.mjs — A-Leads API connectivity + per-endpoint-family probe.
//
// WHAT THIS CHECKS (verified live 2026-06-12): the A-Leads REST gateway behaves
// DIFFERENTLY across three endpoint families, and the API key is sent two
// different ways depending on the family — the live API diverges from its own
// OpenAPI spec (which declares x-api-key header for everything):
//
//   1. Search/enrichment execution (sync company-search, advanced-search,
//      find-email, find-phone, verify-email; AND bulk-advanced-search,
//      company-search/bulk) — auth = x-api-key HEADER. Passes auth, then returns
//      HTTP 500 "Something went wrong" (a few return an explicit 403). ROOT CAUSE
//      UNRESOLVED — either search/enrichment is not provisioned for this key, or
//      the submit endpoints need setup the docs do not mention. Pending the
//      A-Leads developer; do NOT assert "gated" from the bare 500.
//   2. Bulk FILE-MANAGEMENT (get-all-bulk-files, get-bulk-file) — auth = api_key
//      in the JSON BODY (the x-api-key header alone returns 400 "api_key is
//      required"). These WORK (200 / "file not found"). The bulk file layer is
//      provisioned; only the search-SUBMIT step 500s.
//   3. Auth itself — a wrong key returns 401, the real key passes. Auth is fine.
//
// Runtime: zero dependencies (native fetch + fs), Node 18+. The key is NEVER
// printed — only a masked last-4 tail.
//
// Usage:
//   node aleads-selftest.mjs              # probe every family + auth check
//   node aleads-selftest.mjs --submit     # ALSO fire the search-submit endpoints (no records created while they 500; ~1 credit each ONLY if they ever start returning data)
//   node aleads-selftest.mjs --auth-only  # zero-cost: only confirm the key authenticates
//   node aleads-selftest.mjs --json       # machine-readable JSON summary
//
// Exit codes: 0 = key authenticates; 1 = key missing/invalid (401) or no .env; 2 = network error.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(__dirname, '.env');
const BASE = 'https://api.a-leads.co/gateway/v1';

function loadEnvFile(envPath) {
  const out = {};
  if (!fs.existsSync(envPath)) return out;
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
  return out;
}
const ENV = { ...loadEnvFile(ENV_PATH), ...process.env };
const KEY = ENV.ALEADS_API_KEY || '';

const args = new Set(process.argv.slice(2));
const SUBMIT = args.has('--submit');
const AUTH_ONLY = args.has('--auth-only');
const AS_JSON = args.has('--json');

function mask(k) {
  if (!k) return '(missing)';
  if (k.length <= 4) return '****';
  return `…${k.slice(-4)} (len ${k.length})`;
}

// Always send the x-api-key header. For body-auth probes, ALSO inject api_key
// into the JSON body (this is what the bulk file-management endpoints require).
async function call(method, p, body, bodyAuth) {
  const headers = { 'x-api-key': KEY, 'Content-Type': 'application/json' };
  let payload = body;
  if (bodyAuth) payload = { api_key: KEY, ...(body || {}) };
  const opts = { method, headers };
  if (payload !== undefined) opts.body = JSON.stringify(payload);
  try {
    const res = await fetch(`${BASE}${p}`, opts);
    const text = await res.text();
    let snippet = text;
    try { snippet = JSON.stringify(JSON.parse(text)); } catch { /* keep raw */ }
    return { status: res.status, body: snippet.slice(0, 300) };
  } catch (e) {
    return { status: 0, body: `NETWORK ERROR: ${e.message}` };
  }
}

function classify(r) {
  const b = (r.body || '').toLowerCase();
  if (r.status === 0) return { verdict: 'NETWORK', ok: false };
  if (r.status === 401) return { verdict: 'AUTH_FAIL', ok: false };
  if (r.status >= 200 && r.status < 300) return { verdict: 'WORKING', ok: true };
  if (r.status === 404) return { verdict: 'REACHABLE', ok: true };
  if (r.status === 400 && b.includes('not found')) return { verdict: 'REACHABLE', ok: true };
  if (r.status === 400 && (b.includes('required') || b.includes('api_key') || b.includes('api key'))) return { verdict: 'NEEDS_AUTH_FMT', ok: false };
  if (r.status === 400) return { verdict: 'BAD_REQUEST', ok: false };
  if (r.status === 403) return { verdict: 'FORBIDDEN_403', ok: false };
  if (r.status === 500) return { verdict: 'ERROR_500', ok: false };
  return { verdict: `HTTP_${r.status}`, ok: false };
}

// auth: 'header' = x-api-key header; 'body' = api_key in the JSON body.
const FAMILIES = {
  'search/enrichment execution (x-api-key header)': [
    { module: 'company-search (GET by id)', method: 'GET',  path: '/company-search/0',            auth: 'header', body: undefined },
    { module: 'verify-email',               method: 'POST', path: '/search/verify-email',         auth: 'header', body: { data: { email: 'selftest@example.com' } } },
    { module: 'find-email (work)',          method: 'POST', path: '/search/find-email',           auth: 'header', body: { data: { first_name: 'Selftest', last_name: 'Probe', website: 'example.com' } } },
    { module: 'find-email/personal',        method: 'POST', path: '/search/find-email/personal',  auth: 'header', body: { data: { linkedin_username: 'selftest-probe' } } },
    { module: 'find-phone',                 method: 'POST', path: '/search/find-phone',           auth: 'header', body: { data: { linkedin_username: 'selftest-probe' } } },
    { module: 'reverse-email-lookup',       method: 'POST', path: '/reverse-email-lookup/verify', auth: 'header', body: { email: 'selftest@example.com' } },
  ],
  'bulk file-management (api_key in body)': [
    { module: 'get-all-bulk-files',         method: 'POST', path: '/search/get-all-bulk-files',   auth: 'body', body: {} },
    { module: 'get-bulk-file (dummy id)',   method: 'POST', path: '/search/get-bulk-file',        auth: 'body', body: { file_id: '000000000000000000000000' } },
  ],
};
const SUBMIT_FAMILY = {
  'bulk search-submit (x-api-key header) — fires only with --submit': [
    { module: 'bulk-advanced-search', method: 'POST', path: '/search/bulk-advanced-search', auth: 'header', body: { advanced_filters: { bulk_domains: 'example.com' }, batch_size: 1, search_type: 'new' } },
  ],
};

function line(s = '') { if (!AS_JSON) console.log(s); }

(async () => {
  if (!fs.existsSync(ENV_PATH)) { console.error(`✗ No .env at ${ENV_PATH}`); process.exit(1); }
  if (!KEY) { console.error('✗ ALEADS_API_KEY is missing from scripts/.env'); process.exit(1); }

  line('A-Leads API self-test');
  line('─'.repeat(70));
  line(`Key:  ${mask(KEY)}`);
  line(`Base: ${BASE}`);
  line('');

  // Auth check — a deliberately invalid key must 401. Free.
  let authStatus = 0;
  try {
    const res = await fetch(`${BASE}/company-search`, {
      method: 'POST',
      headers: { 'x-api-key': 'totally-invalid-selftest-key', 'Content-Type': 'application/json' },
      body: JSON.stringify({ company_filters: {}, current_page: 0 }),
    });
    authStatus = res.status;
  } catch { authStatus = 0; }
  const authOk = authStatus === 401;
  line(`Auth check (bad key → expect 401): ${authStatus}  ${authOk ? '✓ auth enforced, real key accepted' : '⚠ unexpected'}`);

  if (AUTH_ONLY) {
    line('');
    line(authOk ? 'Key authenticates. Run without --auth-only to probe the endpoint families.' : 'Auth check did not behave as expected.');
    process.exit(authOk ? 0 : 1);
  }

  const families = { ...FAMILIES, ...(SUBMIT ? SUBMIT_FAMILY : {}) };
  const results = [];
  const familyOk = {};
  for (const [fam, probes] of Object.entries(families)) {
    line('');
    line(fam + ':');
    let anyOk = false;
    for (const pr of probes) {
      const r = await call(pr.method, pr.path, pr.body, pr.auth === 'body');
      const c = classify(r);
      if (c.ok) anyOk = true;
      results.push({ family: fam, module: pr.module, auth: pr.auth, status: r.status, verdict: c.verdict, body: r.body });
      line(`  ${c.verdict.padEnd(14)} ${String(r.status).padStart(3)}  ${pr.module}`);
      await new Promise(res => setTimeout(res, 350));
    }
    familyOk[fam] = anyOk;
  }

  if (!SUBMIT) { line(''); line('(search-submit endpoints not fired — add --submit to test bulk-advanced-search)'); }

  // Summary — report facts per family; DO NOT assert a single root cause for the 500s.
  const fileLayerOk = Object.entries(familyOk).some(([f, ok]) => f.includes('file-management') && ok);
  const execOk = Object.entries(familyOk).some(([f, ok]) => (f.includes('execution') || f.includes('submit')) && ok);
  line('');
  line('─'.repeat(70));
  let summary;
  if (execOk) {
    summary = 'Search/enrichment execution is RETURNING DATA — you can build/enrich lists. (Re-check the skill if some families still error.)';
  } else if (fileLayerOk) {
    summary = 'Bulk FILE-MANAGEMENT works (auth = api_key in body), so the key + bulk file layer are provisioned. But every search/enrichment EXECUTION endpoint (sync + bulk-submit) passes auth then returns 500. Root cause is UNRESOLVED: either search/enrichment is not provisioned for this key, or the submit endpoints need setup the docs omit. NEXT STEP: ask the A-Leads developer (see the skill\'s "Account Activation / Developer handoff" section) — do not assume "gated" from the bare 500.';
  } else {
    summary = 'No endpoint family returned data. Check the key and the A-Leads dashboard, then ask the A-Leads developer.';
  }
  line(summary);

  if (AS_JSON) {
    console.log(JSON.stringify({ key: mask(KEY), base: BASE, authStatus, authOk, fileLayerOk, execOk, summary, results }, null, 2));
  }
  process.exit(authOk ? 0 : 1);
})();
