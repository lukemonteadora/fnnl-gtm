#!/usr/bin/env node
// evidence_ledger.mjs: the deterministic half of the market-evidence layer.
//
// Owns <outbound>/profiles/<slug>/_research/evidence.csv (the evidence ledger) and counts it
// honestly. The standard it implements is outbound/reference/market-evidence-standard.md; the
// skill that drives it is /market-evidence. Validation, dedup, ID assignment and the
// mechanical Research QA checks live here, so counts are never typed by hand.
//
// Zero dependencies, Node 18+. No network calls, no AI calls, no spend.
//
// Usage:
//   node evidence_ledger.mjs ingest --client <slug> --in <file.json | dir> [--run <run_id>]
//        [--collected-by <label>] [--dry-run] [--json] [--dir <research_dir>]
//     Validates each row, rejects bad ones with a reason, skips exact duplicates (same source
//     thread + same quote), flags syndicated quotes (same quote on another page), assigns
//     E-#### IDs and appends to evidence.csv (created with its header on first use).
//     Exit 0 = all rows valid; 2 = some rows rejected (the valid ones were still ingested unless
//     --dry-run); 1 = fatal error.
//
//   node evidence_ledger.mjs stats --client <slug> [--cluster C-01] [--json] [--strict]
//        [--today YYYY-MM-DD] [--dir <research_dir>]
//     Reads evidence.csv plus the "evidence:" lines under each "## Cluster C-xx" heading in
//     pain-clusters.md, and reports per cluster: sightings (unique source threads), voices,
//     sites, evidence-type mix, tier mix, recency, ICP match, loudest-source share, and the
//     mechanical Research QA checks (Q1-Q4, Q6-Q8, Q10). Exit 0, or 1 with --strict when any
//     check FAILs.
//
// Input rows for ingest: a JSON array, or {"rows": [...]}, using the ledger column names. Given a
// directory, ingest reads only its batch-*.json files (raw captures in the same run folder are skipped).
// Required: evidence_type, source_class, exact_quote, confidence, and source_url or raw_ref.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------- the schema (keep in step with market-evidence-standard.md sections 2-3) ----------
export const COLUMNS = [
  'evidence_id', 'status', 'captured_at', 'run_id', 'collected_by', 'evidence_type', 'tier',
  'source_class', 'source_url', 'raw_ref', 'source_site', 'source_thread', 'source_author',
  'source_date', 'persona', 'company_context', 'icp_match', 'exact_quote', 'situation', 'pain',
  'trigger', 'workaround', 'workaround_gap', 'consequence', 'desired_outcome',
  'alternative_considered', 'competitor_mentioned', 'objection', 'confidence', 'syndication_of',
  'notes',
];

export const TYPE_TIER = {
  purchase_behavior: 'strong', sales_call: 'strong', interview: 'strong', outbound_reply: 'strong',
  support_issue: 'strong', observed_workflow: 'strong',
  forum_post: 'good', review: 'good', competitor_case_study: 'good', job_post: 'good',
  rfp_requirement: 'good', comparison: 'good', client_material: 'good',
  social_post: 'supporting', video: 'supporting', ad: 'supporting', competitor_claim: 'supporting',
  search_signal: 'supporting', news: 'supporting',
  seo_article: 'weak', market_report: 'weak', influencer_opinion: 'weak', ai_claim: 'weak',
  model_hypothesis: 'hypothesis',
};
const TIER_RANK = { strong: 4, good: 3, supporting: 2, weak: 1, hypothesis: 0 };
const SOURCE_CLASSES = new Set(['buyer_quote', 'first_party_call', 'outbound_reply', 'job_posting',
  'competitor_claim', 'analyst_claim', 'news', 'model_hypothesis']);
const CONFIDENCE = new Set(['high', 'medium', 'low']);
const ICP_MATCH = new Set(['yes', 'partial', 'no', 'unknown', '']);
const STATUSES = new Set(['active', 'duplicate', 'retracted']);
// Only the buyer's side can show that a pain exists: buyers in public, the client's calls,
// replies to our campaigns, and job posts. Competitor claims, analysts and news are context.
const PAIN_CLASSES = new Set(['buyer_quote', 'first_party_call', 'outbound_reply', 'job_posting']);
const TYPE_LABEL = {
  forum_post: ['forum thread', 'forum threads'], review: ['review', 'reviews'],
  sales_call: ['sales call', 'sales calls'], interview: ['interview', 'interviews'],
  outbound_reply: ['reply', 'replies'], job_post: ['job post', 'job posts'],
  purchase_behavior: ['purchase or switch account', 'purchase or switch accounts'],
  support_issue: ['support issue', 'support issues'], observed_workflow: ['observed workflow', 'observed workflows'],
  competitor_case_study: ['competitor case study', 'competitor case studies'],
  rfp_requirement: ['RFP requirement', 'RFP requirements'], comparison: ['comparison', 'comparisons'],
  client_material: ['client note', 'client notes'], social_post: ['social post', 'social posts'],
  video: ['video', 'videos'], ad: ['ad angle', 'ad angles'],
  competitor_claim: ['competitor claim', 'competitor claims'], search_signal: ['search signal', 'search signals'],
  news: ['news item', 'news items'], seo_article: ['SEO article', 'SEO articles'],
  market_report: ['market report', 'market reports'], influencer_opinion: ['opinion piece', 'opinion pieces'],
  ai_claim: ['unsourced AI claim', 'unsourced AI claims'], model_hypothesis: ['hypothesis', 'hypotheses'],
};

// ---------- small utilities ----------
function parseArgs(argv) {
  const a = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (!t.startsWith('--')) { a._.push(t); continue; }
    const name = t.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) a[name] = true;
    else { a[name] = next; i++; }
  }
  return a;
}
function die(msg, code = 1) { process.stderr.write(`evidence_ledger: ${msg}\n`); process.exit(code); }
function todayISO(override) {
  if (override) return String(override);
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function clean(v) {
  if (v === undefined || v === null) return '';
  return String(v).replace(/\r\n|\r|\n/g, ' / ').replace(/\s+/g, ' ').trim();
}
const EMAIL_TEST = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const EMAIL_ALL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const DATE_RE = /^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/;

export function parseCSV(text) {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += c;
      continue;
    }
    if (c === '"') { inQuotes = true; continue; }
    if (c === ',') { row.push(field); field = ''; continue; }
    if (c === '\r') continue;
    if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; continue; }
    field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => !(r.length === 1 && r[0] === ''));
}
function csvField(v) {
  const s = v === undefined || v === null ? '' : String(v);
  return /[",\n\r]/.test(s) || /^\s|\s$/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function toCSVLine(obj) { return COLUMNS.map((c) => csvField(obj[c])).join(','); }

export function normalizeUrl(u) {
  const s = clean(u);
  if (!s) return '';
  try {
    const url = new URL(s);
    url.hash = '';
    url.hostname = url.hostname.toLowerCase().replace(/^www\./, '');
    for (const k of [...url.searchParams.keys()]) {
      if (/^utm_|^(fbclid|gclid|ref|ref_src|share|context)$/i.test(k)) url.searchParams.delete(k);
    }
    let out = url.toString();
    if (out.endsWith('/') && url.pathname !== '/') out = out.slice(0, -1);
    return out;
  } catch {
    return s.toLowerCase();
  }
}
function hostOf(u) {
  try { return new URL(u).hostname.toLowerCase().replace(/^www\./, ''); } catch { return ''; }
}
export function quoteHash(q) {
  const norm = clean(q).toLowerCase()
    .replace(/[‘’“”]/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return crypto.createHash('sha1').update(norm).digest('hex');
}
// The independence key. One thread, page, call or reply thread = one sighting (standard section 4).
export function deriveThread(row) {
  if (clean(row.source_thread)) return clean(row.source_thread).toLowerCase();
  const url = normalizeUrl(row.source_url);
  const site = clean(row.source_site) || hostOf(url);
  if (row.evidence_type === 'review') {
    // Reviews on one page come from different customers, so each reviewer is an independent
    // sighting: keyed by reviewer when known, otherwise by the review text itself.
    const who = clean(row.source_author).toLowerCase();
    const known = who && who !== 'unknown' && who !== 'anonymous';
    return `${site || 'review'}:review:${known ? who : quoteHash(row.exact_quote).slice(0, 12)}`;
  }
  if (url) {
    let m = url.match(/reddit\.com\/r\/[^/]+\/comments\/([a-z0-9]+)/i);
    if (m) return `reddit:${m[1].toLowerCase()}`;
    m = url.match(/news\.ycombinator\.com\/item\?id=(\d+)/i);
    if (m) return `hn:${m[1]}`;
    m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/i);
    if (m) return `youtube:${m[1]}`;
    return url;
  }
  return clean(row.raw_ref).toLowerCase().replace(/\\/g, '/');
}
function parseDate(s) {
  const m = clean(s).match(DATE_RE);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = m[2] ? Number(m[2]) : 1;
  const d = m[3] ? Number(m[3]) : 1;
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return new Date(Date.UTC(y, mo - 1, d));
}

// ---------- paths ----------
function researchDir(a) {
  if (a.dir) return path.resolve(String(a.dir));
  if (!a.client || a.client === true) die('--client <slug> (or --dir <research_dir>) is required');
  return path.resolve(__dirname, '..', '..', 'profiles', String(a.client), '_research');
}
function readLedger(file) {
  if (!fs.existsSync(file)) return { header: COLUMNS, rows: [] };
  const table = parseCSV(fs.readFileSync(file, 'utf8'));
  if (!table.length) return { header: COLUMNS, rows: [] };
  const header = table[0].map((h) => h.trim());
  const missing = COLUMNS.filter((c) => !header.includes(c));
  if (missing.length) die(`${file} header is missing columns: ${missing.join(', ')}. Refusing to write a misaligned ledger.`);
  const rows = table.slice(1).map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])));
  return { header, rows };
}

// ---------- ingest ----------
function validateRow(raw, ctx) {
  const errors = [];
  const warnings = [];
  const row = {};
  for (const c of COLUMNS) row[c] = clean(raw[c]);
  row.evidence_type = row.evidence_type.toLowerCase();
  row.source_class = row.source_class.toLowerCase();
  row.confidence = row.confidence.toLowerCase();
  row.icp_match = row.icp_match.toLowerCase();
  if (!TYPE_TIER[row.evidence_type]) errors.push(`evidence_type "${row.evidence_type}" is not in the standard`);
  if (!SOURCE_CLASSES.has(row.source_class)) errors.push(`source_class "${row.source_class}" is not in the standard`);
  if ((row.evidence_type === 'model_hypothesis') !== (row.source_class === 'model_hypothesis') && TYPE_TIER[row.evidence_type] && SOURCE_CLASSES.has(row.source_class)) {
    errors.push('model_hypothesis must be both the evidence_type and the source_class');
  }
  if (!row.exact_quote) errors.push('exact_quote is empty (verbatim text is required)');
  if (!row.source_url && !row.raw_ref) errors.push('needs a source_url or a raw_ref');
  if (!CONFIDENCE.has(row.confidence)) errors.push(`confidence must be high, medium or low (got "${row.confidence}")`);
  if (!ICP_MATCH.has(row.icp_match)) errors.push(`icp_match must be yes, partial, no or unknown (got "${row.icp_match}")`);
  if (EMAIL_TEST.test(row.source_author)) errors.push('source_author holds an email address; use a role or handle, never a prospect identity');
  if (EMAIL_TEST.test(row.exact_quote)) { row.exact_quote = row.exact_quote.replace(EMAIL_ALL, '[email]'); warnings.push('an email address in exact_quote was redacted'); }
  row.captured_at = row.captured_at || ctx.today;
  if (!parseDate(row.captured_at)) errors.push(`captured_at "${row.captured_at}" is not YYYY-MM-DD`);
  row.source_date = row.source_date || 'unknown';
  if (row.source_date !== 'unknown' && !parseDate(row.source_date)) errors.push(`source_date "${row.source_date}" is not YYYY, YYYY-MM, YYYY-MM-DD or unknown`);
  row.persona = row.persona || 'unknown';
  row.source_author = row.source_author || 'unknown';
  row.run_id = row.run_id || ctx.run || '';
  if (!row.run_id) errors.push('run_id is empty (pass --run or set it per row)');
  row.collected_by = row.collected_by || ctx.collectedBy || '';
  if (!row.collected_by) errors.push('collected_by is empty (pass --collected-by or set it per row)');
  const derived = TYPE_TIER[row.evidence_type];
  if (derived) {
    if (row.tier) {
      row.tier = row.tier.toLowerCase();
      if (TIER_RANK[row.tier] === undefined) errors.push(`tier "${row.tier}" is not in the standard`);
      else if (TIER_RANK[row.tier] > TIER_RANK[derived]) errors.push(`tier can only be lowered: ${row.evidence_type} is "${derived}", got "${row.tier}"`);
      else if (TIER_RANK[row.tier] < TIER_RANK[derived] && !row.notes) warnings.push('tier was lowered without a reason in notes');
    } else row.tier = derived;
  }
  if (row.status && !STATUSES.has(row.status)) errors.push(`status "${row.status}" is not active, duplicate or retracted`);
  row.status = 'active';
  if (row.source_url) row.source_url = clean(raw.source_url);
  row.source_site = row.source_site || hostOf(normalizeUrl(row.source_url)) ||
    (row.evidence_type === 'outbound_reply' ? 'sending-platform' : row.evidence_type === 'sales_call' ? 'first-party-call' : 'raw');
  row.source_thread = deriveThread(row);
  row.evidence_id = '';
  row.syndication_of = '';
  return { row, errors, warnings };
}

function loadBatches(inPath) {
  const p = path.resolve(String(inPath));
  if (!fs.existsSync(p)) die(`--in path not found: ${p}`);
  // A run folder also holds raw captures (collector JSON, reply exports), so a directory ingest
  // reads only the batch files the standard names: batch-<vector>-<n>.json.
  const isDir = fs.statSync(p).isDirectory();
  const files = isDir
    ? fs.readdirSync(p).filter((f) => /^batch-.*\.json$/i.test(f)).sort().map((f) => path.join(p, f))
    : [p];
  if (isDir && !files.length) die(`no batch-*.json files in ${p} (raw captures are never ingested directly)`);
  const out = [];
  for (const f of files) {
    let data;
    try { data = JSON.parse(fs.readFileSync(f, 'utf8').replace(/^﻿/, '')); } catch (e) { die(`${f} is not valid JSON: ${e.message}`); }
    const rows = Array.isArray(data) ? data : Array.isArray(data?.rows) ? data.rows : null;
    if (!rows) die(`${f} must be a JSON array of rows or {"rows": [...]}`);
    rows.forEach((r, i) => out.push({ file: path.basename(f), index: i, raw: r }));
  }
  return out;
}

function cmdIngest(a) {
  if (!a.in || a.in === true) die('ingest needs --in <file.json | dir>');
  const dir = researchDir(a);
  const file = path.join(dir, 'evidence.csv');
  const { rows: existing } = readLedger(file);
  const ctx = { today: todayISO(a.today), run: a.run === true ? '' : a.run, collectedBy: a['collected-by'] === true ? '' : a['collected-by'] };
  const seenKey = new Set();
  const firstByHash = new Map();
  let maxId = 0;
  for (const r of existing) {
    const n = Number(String(r.evidence_id).replace(/^E-/, ''));
    if (Number.isFinite(n)) maxId = Math.max(maxId, n);
    const h = quoteHash(r.exact_quote);
    seenKey.add(`${r.source_thread}|${h}`);
    if (!firstByHash.has(h)) firstByHash.set(h, { id: r.evidence_id, thread: r.source_thread });
  }
  const accepted = [];
  const duplicates = [];
  const syndicated = [];
  const rejected = [];
  const warnings = [];
  for (const b of loadBatches(a.in)) {
    const { row, errors, warnings: w } = validateRow(b.raw || {}, ctx);
    const where = `${b.file}#${b.index}`;
    if (errors.length) { rejected.push({ where, errors }); continue; }
    w.forEach((msg) => warnings.push(`${where}: ${msg}`));
    const h = quoteHash(row.exact_quote);
    const key = `${row.source_thread}|${h}`;
    if (seenKey.has(key)) { duplicates.push(where); continue; }
    maxId += 1;
    row.evidence_id = `E-${String(maxId).padStart(4, '0')}`;
    const prior = firstByHash.get(h);
    if (prior && prior.thread !== row.source_thread && clean(row.exact_quote).length >= 40) {
      row.syndication_of = prior.id;
      syndicated.push(`${row.evidence_id} repeats ${prior.id}`);
    }
    seenKey.add(key);
    if (!prior) firstByHash.set(h, { id: row.evidence_id, thread: row.source_thread });
    accepted.push(row);
  }
  if (!a['dry-run'] && accepted.length) {
    fs.mkdirSync(dir, { recursive: true });
    const prev = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : `${COLUMNS.join(',')}\n`;
    const body = (prev.endsWith('\n') ? prev : `${prev}\n`) + accepted.map(toCSVLine).join('\n') + '\n';
    const tmp = `${file}.tmp-${process.pid}`;
    fs.writeFileSync(tmp, body, 'utf8');
    fs.renameSync(tmp, file);
  }
  const result = {
    ok: rejected.length === 0,
    ledger: file,
    dry_run: !!a['dry-run'],
    ingested: accepted.length,
    first_id: accepted[0]?.evidence_id || null,
    last_id: accepted[accepted.length - 1]?.evidence_id || null,
    duplicates_skipped: duplicates,
    syndicated,
    rejected,
    warnings,
  };
  if (a.json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  else {
    const verb = a['dry-run'] ? 'Would ingest' : 'Ingested';
    const lines = [`${verb} ${accepted.length} row(s)${accepted.length ? ` (${result.first_id}..${result.last_id})` : ''} into ${file}.`];
    if (duplicates.length) lines.push(`Skipped ${duplicates.length} exact duplicate(s): ${duplicates.join(', ')}`);
    if (syndicated.length) lines.push(`Flagged ${syndicated.length} syndicated quote(s), counted once: ${syndicated.join('; ')}`);
    if (warnings.length) lines.push(`Warnings:\n  - ${warnings.join('\n  - ')}`);
    if (rejected.length) lines.push(`REJECTED ${rejected.length} row(s), fix and re-ingest (duplicates are skipped safely):\n  - ${rejected.map((r) => `${r.where}: ${r.errors.join('; ')}`).join('\n  - ')}`);
    process.stdout.write(`${lines.join('\n')}\n`);
  }
  process.exit(rejected.length ? 2 : 0);
}

// ---------- stats ----------
export function parseClusters(mdText) {
  const clusters = [];
  let cur = null;
  for (const line of mdText.split(/\r?\n/)) {
    const h = line.match(/^##\s+Cluster\s+(C-\d+)\b[:\s-]*(.*)$/i);
    if (h) { cur = { id: h[1].toUpperCase(), title: h[2].trim(), evidence: [], counterevidence: [] }; clusters.push(cur); continue; }
    if (/^##\s/.test(line)) { cur = null; continue; }
    if (!cur) continue;
    const e = line.match(/^\s*(counterevidence|evidence)\s*:\s*(.*)$/i);
    if (e) {
      const ids = (e[2].match(/E-\d{4,}/gi) || []).map((x) => x.toUpperCase());
      cur[e[1].toLowerCase()].push(...ids);
    }
  }
  return clusters;
}

function pct(n, d) { return d ? Math.round((100 * n) / d) : null; }

export function clusterStats(cluster, byId, today) {
  const cutoff = new Date(Date.UTC(today.getUTCFullYear() - 2, today.getUTCMonth(), today.getUTCDate()));
  const unknownIds = cluster.evidence.filter((id) => !byId.has(id));
  const inactive = cluster.evidence.filter((id) => byId.has(id) && byId.get(id).status !== 'active');
  const cited = cluster.evidence.map((id) => byId.get(id)).filter((r) => r && r.status === 'active');
  const hyp = cited.filter((r) => r.evidence_type === 'model_hypothesis');
  const compClaims = cited.filter((r) => r.evidence_type === 'competitor_claim' || r.source_class === 'competitor_claim');
  const rows = cited.filter((r) => r.evidence_type !== 'model_hypothesis');
  const threadOf = (r) => {
    if (r.syndication_of && byId.has(r.syndication_of)) return byId.get(r.syndication_of).source_thread;
    return r.source_thread;
  };
  const threads = new Set(rows.map(threadOf));
  const syndicatedCollapsed = rows.filter((r) => r.syndication_of).length;
  const byType = {};
  for (const r of rows) (byType[r.evidence_type] ||= new Set()).add(threadOf(r));
  const voices = new Set(rows.map((r) => {
    const a = (r.source_author || '').toLowerCase();
    return a && a !== 'unknown' && a !== 'anonymous' ? `a:${a}` : `t:${threadOf(r)}`;
  }));
  const sites = new Set(rows.map((r) => r.source_site).filter(Boolean));
  const tiers = {};
  for (const r of rows) tiers[r.tier] = (tiers[r.tier] || 0) + 1;
  const strongest = rows.reduce((best, r) => (TIER_RANK[r.tier] > TIER_RANK[best] ? r.tier : best), 'hypothesis');
  const buyerQuoteSightings = new Set(rows.filter((r) => r.source_class === 'buyer_quote').map(threadOf)).size;
  const painRows = rows.filter((r) => PAIN_CLASSES.has(r.source_class));
  const painThreads = new Set(painRows.map(threadOf));
  const painSites = new Set(painRows.map((r) => r.source_site).filter(Boolean));
  const painStrongest = painRows.reduce((best, r) => (TIER_RANK[r.tier] > TIER_RANK[best] ? r.tier : best), 'hypothesis');
  const dated = rows.map((r) => parseDate(r.source_date)).filter(Boolean);
  const recent = dated.filter((d) => d >= cutoff).length;
  const newest = dated.length ? new Date(Math.max(...dated)).toISOString().slice(0, 10) : null;
  const oldest = dated.length ? new Date(Math.min(...dated)).toISOString().slice(0, 10) : null;
  const icpKnown = rows.filter((r) => ['yes', 'partial', 'no'].includes(r.icp_match));
  const icpFit = icpKnown.filter((r) => r.icp_match !== 'no').length;
  const perThread = {};
  for (const r of rows) perThread[threadOf(r)] = (perThread[threadOf(r)] || 0) + 1;
  const loudestRows = Math.max(0, ...Object.values(perThread));
  const missingSource = rows.filter((r) => !r.source_url && !r.raw_ref).map((r) => r.evidence_id);
  const counterKnown = cluster.counterevidence.filter((id) => byId.has(id));

  const checks = {};
  checks.Q1_sources = unknownIds.length || missingSource.length
    ? { result: 'FAIL', note: [unknownIds.length ? `unknown IDs: ${unknownIds.join(', ')}` : '', missingSource.length ? `no URL or raw_ref: ${missingSource.join(', ')}` : ''].filter(Boolean).join('; ') }
    : { result: 'PASS', note: `${rows.length} cited row(s) resolve` };
  if (!dated.length) checks.Q2_recency = { result: 'FLAG', note: 'no dated rows' };
  else checks.Q2_recency = pct(recent, dated.length) >= 70
    ? { result: 'PASS', note: `${pct(recent, dated.length)}% of dated rows within 24 months` }
    : { result: 'FLAG', note: `only ${pct(recent, dated.length)}% of dated rows within 24 months; label older evidence historical` };
  checks.Q3_independence = (painThreads.size >= 3 && painSites.size >= 2) || painStrongest === 'strong'
    ? { result: 'PASS', note: `${painThreads.size} buyer-side sighting(s) across ${painSites.size} site(s); strongest buyer-side tier ${painStrongest}` }
    : { result: 'FLAG', note: `only ${painThreads.size} buyer-side sighting(s) across ${painSites.size} site(s) and no strong-tier item (competitor claims, analysts and news do not count)` };
  checks.Q4_loud_source = rows.length < 5
    ? { result: 'N/A', note: 'fewer than 5 rows' }
    : pct(loudestRows, rows.length) > 40
      ? { result: 'FLAG', note: `one source supplies ${pct(loudestRows, rows.length)}% of rows` }
      : { result: 'PASS', note: `loudest source ${pct(loudestRows, rows.length)}% of rows` };
  checks.Q6_no_hypothesis_as_evidence = hyp.length
    ? { result: 'FAIL', note: `model_hypothesis cited as evidence: ${hyp.map((r) => r.evidence_id).join(', ')}` }
    : { result: 'PASS', note: 'no hypothesis rows cited' };
  if (!icpKnown.length) checks.Q7_icp_specific = { result: 'FLAG', note: 'no icp_match recorded on cited rows' };
  else checks.Q7_icp_specific = pct(icpFit, icpKnown.length) >= 50
    ? { result: 'PASS', note: `${pct(icpFit, icpKnown.length)}% ICP yes/partial (of ${icpKnown.length} known)` }
    : { result: 'FLAG', note: `only ${pct(icpFit, icpKnown.length)}% ICP yes/partial (of ${icpKnown.length} known)` };
  checks.Q8_competitor_claims = compClaims.length
    ? { result: 'FAIL', note: `competitor claims cited as evidence: ${compClaims.map((r) => r.evidence_id).join(', ')}` }
    : { result: 'PASS', note: 'no competitor claims cited' };
  checks.Q10_double_counting = inactive.length
    ? { result: 'FLAG', note: `duplicate or retracted rows cited: ${inactive.join(', ')}` }
    : { result: 'PASS', note: syndicatedCollapsed ? `${syndicatedCollapsed} syndicated row(s) counted once` : 'no syndicated rows' };

  const typeParts = Object.entries(byType)
    .sort((x, y) => y[1].size - x[1].size)
    .map(([t, s]) => `${s.size} ${(TYPE_LABEL[t] || [t, `${t}s`])[s.size === 1 ? 0 : 1]}`);
  const summary = rows.length
    ? `${threads.size} sighting(s): ${typeParts.join(', ')} (${painThreads.size} from buyers, calls, replies or job posts); ${voices.size} voice(s) across ${sites.size} site(s); strongest tier ${strongest}` +
      (dated.length ? `; ${pct(recent, dated.length)}% of dated rows within 24 months (newest ${newest})` : '; no dated rows') +
      (icpKnown.length ? `; ICP match ${pct(icpFit, icpKnown.length)}% of ${icpKnown.length} known` : '')
    : 'no active evidence rows cited';

  return {
    id: cluster.id, title: cluster.title, rows: rows.length, sightings: threads.size,
    buyer_side_sightings: painThreads.size, buyer_quote_sightings: buyerQuoteSightings,
    voices: voices.size, sites: [...sites],
    by_type: Object.fromEntries(Object.entries(byType).map(([t, s]) => [t, s.size])), tiers, strongest_tier: strongest,
    first_party_calls: rows.filter((r) => r.source_class === 'first_party_call').length,
    replies: rows.filter((r) => r.source_class === 'outbound_reply').length,
    dated_rows: dated.length, within_24_months_pct: pct(recent, dated.length), newest, oldest,
    icp_known: icpKnown.length, icp_fit_pct: pct(icpFit, icpKnown.length),
    loudest_source_pct: pct(loudestRows, rows.length), counterevidence: counterKnown.length,
    counts_line: summary, checks,
  };
}

function cmdStats(a) {
  const dir = researchDir(a);
  const file = path.join(dir, 'evidence.csv');
  if (!fs.existsSync(file)) die(`no ledger at ${file}`, 1);
  const { rows } = readLedger(file);
  const byId = new Map(rows.map((r) => [r.evidence_id, r]));
  const today = parseDate(todayISO(a.today));
  if (!today) die('--today must be YYYY-MM-DD');
  const cutoff = new Date(Date.UTC(today.getUTCFullYear() - 2, today.getUTCMonth(), today.getUTCDate()));
  const mdFile = path.join(dir, 'pain-clusters.md');
  let clusters = fs.existsSync(mdFile) ? parseClusters(fs.readFileSync(mdFile, 'utf8')) : [];
  if (a.cluster && a.cluster !== true) clusters = clusters.filter((c) => c.id === String(a.cluster).toUpperCase());

  const active = rows.filter((r) => r.status === 'active');
  const tiers = {};
  const types = {};
  const sites = {};
  for (const r of active) {
    tiers[r.tier] = (tiers[r.tier] || 0) + 1;
    types[r.evidence_type] = (types[r.evidence_type] || 0) + 1;
    sites[r.source_site] = (sites[r.source_site] || 0) + 1;
  }
  const dated = active.map((r) => parseDate(r.source_date)).filter(Boolean);
  const cited = new Set(clusters.flatMap((c) => [...c.evidence, ...c.counterevidence]));
  const unassigned = active.filter((r) => r.evidence_type !== 'model_hypothesis' && !cited.has(r.evidence_id)).map((r) => r.evidence_id);
  const perCluster = clusters.map((c) => clusterStats(c, byId, today));
  const anyFail = perCluster.some((c) => Object.values(c.checks).some((k) => k.result === 'FAIL'));
  const result = {
    ledger: file,
    clusters_file: fs.existsSync(mdFile) ? mdFile : null,
    today: todayISO(a.today),
    totals: {
      rows: rows.length, active: active.length, duplicate: rows.filter((r) => r.status === 'duplicate').length,
      retracted: rows.filter((r) => r.status === 'retracted').length, tiers, types,
      top_sites: Object.entries(sites).sort((x, y) => y[1] - x[1]).slice(0, 10),
      dated: dated.length, within_24_months: dated.filter((d) => d >= cutoff).length,
      hypothesis_rows: active.filter((r) => r.evidence_type === 'model_hypothesis').length,
      unassigned_rows: unassigned,
    },
    clusters: perCluster,
    any_fail: anyFail,
  };
  if (a.json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  else {
    const t = result.totals;
    const out = [
      `# Evidence ledger stats (${result.today})`,
      '',
      `Ledger: ${file}`,
      `Rows: ${t.rows} (${t.active} active, ${t.duplicate} duplicate, ${t.retracted} retracted). Hypothesis rows: ${t.hypothesis_rows} (never counted).`,
      `Tiers: ${Object.entries(t.tiers).map(([k, v]) => `${k} ${v}`).join(', ') || 'none'}`,
      `Types: ${Object.entries(t.types).map(([k, v]) => `${k} ${v}`).join(', ') || 'none'}`,
      `Top sites: ${t.top_sites.map(([k, v]) => `${k} ${v}`).join(', ') || 'none'}`,
      `Dated rows: ${t.dated} (${pct(t.within_24_months, t.dated) ?? 0}% within 24 months)`,
      `Rows in no cluster: ${t.unassigned_rows.length}${t.unassigned_rows.length ? ` (${t.unassigned_rows.slice(0, 25).join(', ')}${t.unassigned_rows.length > 25 ? ', ...' : ''})` : ''}`,
      '',
    ];
    if (!result.clusters_file) out.push('No pain-clusters.md yet, so there are no clusters to count.');
    for (const c of perCluster) {
      out.push(`## ${c.id}: ${c.title}`);
      out.push(`Counts: ${c.counts_line}`);
      out.push(`Public buyer-quote sightings (the 3-source floor): ${c.buyer_quote_sightings}. First-party calls: ${c.first_party_calls}. Replies: ${c.replies}. Counterevidence: ${c.counterevidence}.`);
      for (const [k, v] of Object.entries(c.checks)) out.push(`- ${k}: ${v.result}. ${v.note}`);
      out.push('');
    }
    if (anyFail) out.push('At least one mechanical check FAILED. Fix the citations before the Research QA verdict.');
    process.stdout.write(`${out.join('\n')}\n`);
  }
  process.exit(a.strict && anyFail ? 1 : 0);
}

// ---------- main ----------
const samePath = (x, y) => (process.platform === 'win32' ? x.toLowerCase() === y.toLowerCase() : x === y);
const isMain = process.argv[1] && samePath(path.resolve(process.argv[1]), fileURLToPath(import.meta.url));
if (isMain) {
  const a = parseArgs(process.argv.slice(2));
  const cmd = a._[0];
  if (cmd === 'ingest') cmdIngest(a);
  else if (cmd === 'stats') cmdStats(a);
  else {
    process.stdout.write('Usage:\n  node evidence_ledger.mjs ingest --client <slug> --in <file.json|dir> [--run <id>] [--collected-by <label>] [--dry-run] [--json] [--dir <dir>]\n  node evidence_ledger.mjs stats --client <slug> [--cluster C-01] [--json] [--strict] [--today YYYY-MM-DD] [--dir <dir>]\n');
    process.exit(cmd ? 1 : 0);
  }
}
