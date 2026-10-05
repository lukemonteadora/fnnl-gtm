// Deterministic checks for the GTM eval suites. `run_eval.mjs grade` calls them on the sub-agent answers
// saved on disk; each suite's suite.yaml says which check runs under which metric name.
//
// No LLM grading on purpose. Every check here is decidable from the case's own source text and its
// `gold` block, so a benchmark never turns into one model grading another. Each export takes
// (output, context), where output is the raw answer text and context.vars holds the case's vars
// (source_text, page_text, gold, company), and returns { pass, score, reason }, so the grade summary
// can report a pass rate per check (schema, verbatim, grounding, ...).
//
// Gold blocks carry a `label_status`. Only `client` or `operator` labels are ground truth; anything marked
// `provisional` was labelled by the session and is waiting for an operator spot-check (README).

// ── shared helpers ───────────────────────────────────────────────────────────

// Parse a model answer into JSON. Strips a BOM and one surrounding ``` fence (production parses the same
// way), then falls back to the first {...} or [...] span. `strict` is true when no fallback was needed.
function parseJson(output) {
  let s = String(output ?? '').replace(/^﻿/, '').trim();
  s = s.replace(/^```[a-zA-Z]*\s*\n?/, '').replace(/\n?```\s*$/, '').trim();
  try { return { value: JSON.parse(s), strict: true }; } catch { /* fall through */ }
  const start = s.search(/[[{]/);
  const end = Math.max(s.lastIndexOf(']'), s.lastIndexOf('}'));
  if (start !== -1 && end > start) {
    try { return { value: JSON.parse(s.slice(start, end + 1)), strict: false }; } catch { /* fall through */ }
  }
  return { value: undefined, strict: false };
}

// Normalize for verbatim comparison: the ledger's " / " line-break marker, typographic quotes and dashes,
// the ellipsis character, and whitespace. Case-insensitive, because a changed capital is not an invented word.
function norm(s) {
  return String(s ?? '')
    .replace(/\s+\/\s+/g, ' ')
    .replace(/[‘’‚′`]/g, "'")
    .replace(/[“”„″]/g, '"')
    .replace(/[–—−]/g, '-')
    .replace(/…/g, '...')
    .replace(/[  ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// A quote the model wrapped in its own quotation marks is still judged on its inner text.
function unwrapQuote(q) {
  return String(q ?? '').trim().replace(/^["'“‘]+/, '').replace(/["'”’]+$/, '').trim();
}

const BLANK = new Set(['', 'unknown', 'n/a', 'na', 'none', 'not stated', 'not mentioned', 'null', '-']);
function isBlank(v) {
  if (v === undefined || v === null) return true;
  if (Array.isArray(v)) return v.every(isBlank);
  return BLANK.has(String(v).trim().toLowerCase());
}

function inSource(needle, source) {
  const n = norm(unwrapQuote(needle));
  return n.length > 0 && norm(source).includes(n);
}

function result(pass, score, reason) {
  return { pass, score: Math.max(0, Math.min(1, score)), reason };
}

// ── VOC extraction (voc-extraction suite) ───────────────────────────────────

const VOC_REQUIRED = ['evidence_type', 'source_class', 'source_author', 'source_date', 'persona', 'exact_quote', 'confidence'];
const VOC_OPTIONAL = ['source_url', 'company_context', 'icp_match', 'situation', 'pain', 'trigger', 'workaround',
  'workaround_gap', 'consequence', 'desired_outcome', 'alternative_considered', 'competitor_mentioned', 'objection',
  'notes', 'tier'];
const VOC_ENUMS = {
  evidence_type: ['purchase_behavior', 'sales_call', 'interview', 'outbound_reply', 'support_issue', 'observed_workflow',
    'forum_post', 'review', 'competitor_case_study', 'job_post', 'rfp_requirement', 'comparison', 'client_material',
    'social_post', 'video', 'ad', 'competitor_claim', 'search_signal', 'news', 'seo_article', 'market_report',
    'influencer_opinion', 'ai_claim', 'model_hypothesis'],
  source_class: ['buyer_quote', 'first_party_call', 'outbound_reply', 'job_posting', 'competitor_claim', 'analyst_claim',
    'news', 'model_hypothesis'],
  confidence: ['high', 'medium', 'low'],
  icp_match: ['yes', 'partial', 'no', 'unknown', ''],
  tier: ['strong', 'good', 'supporting', 'weak', ''],
};

function vocRows(output) {
  const { value, strict } = parseJson(output);
  let rows = value;
  if (rows && !Array.isArray(rows) && Array.isArray(rows.rows)) rows = rows.rows;
  return { rows: Array.isArray(rows) ? rows : undefined, strict };
}

// Structured-output reliability: a JSON array of rows, every required field present, enums valid,
// no invented fields. Also records whether the answer parsed without the fallback (strict).
function vocSchema(output) {
  const { rows, strict } = vocRows(output);
  if (!rows) return result(false, 0, 'not a JSON array of rows');
  const problems = [];
  rows.forEach((r, i) => {
    if (!r || typeof r !== 'object' || Array.isArray(r)) { problems.push(`row ${i} is not an object`); return; }
    for (const f of VOC_REQUIRED) if (!(f in r)) problems.push(`row ${i} missing ${f}`);
    for (const f of Object.keys(r)) if (!VOC_REQUIRED.includes(f) && !VOC_OPTIONAL.includes(f)) problems.push(`row ${i} invented field ${f}`);
    for (const [f, allowed] of Object.entries(VOC_ENUMS)) {
      if (r[f] !== undefined && r[f] !== null && !allowed.includes(String(r[f]).trim().toLowerCase())) problems.push(`row ${i} ${f}=${r[f]}`);
    }
    if (!isBlank(r.exact_quote) && String(r.exact_quote).trim().length < 8) problems.push(`row ${i} exact_quote too short`);
  });
  if (!strict) problems.push('needed the fallback parser (prose around the JSON)');
  const pass = problems.length === 0;
  return result(pass, pass ? 1 : strict ? 0.5 : 0.25, pass ? `ok, ${rows.length} rows` : problems.slice(0, 6).join('; '));
}

// Source preservation: every exact_quote is a contiguous span of the source (after normalization).
// Score = share of quotes that are verbatim. One spliced or paraphrased quote fails the case.
function vocVerbatim(output, context) {
  const { rows } = vocRows(output);
  if (!rows) return result(false, 0, 'no rows to check');
  if (rows.length === 0) return result(true, 1, 'no rows, nothing quoted');
  const bad = rows.filter(r => !inSource(r.exact_quote, context.vars.source_text));
  const score = (rows.length - bad.length) / rows.length;
  return result(bad.length === 0, score,
    bad.length === 0 ? `all ${rows.length} quotes verbatim` : `not in source: ${bad.slice(0, 3).map(r => JSON.stringify(String(r.exact_quote).slice(0, 90))).join(' | ')}`);
}

// Hallucination guard on named entities: every competitor or tool the model names must appear in the source.
function vocGrounding(output, context) {
  const { rows } = vocRows(output);
  if (!rows) return result(false, 0, 'no rows to check');
  const names = [];
  for (const r of rows) {
    if (isBlank(r.competitor_mentioned)) continue;
    const vals = Array.isArray(r.competitor_mentioned) ? r.competitor_mentioned : String(r.competitor_mentioned).split(/[;,]/);
    for (const v of vals) if (!isBlank(v)) names.push(String(v).trim());
  }
  if (names.length === 0) return result(true, 1, 'no competitors named');
  const invented = names.filter(n => !inSource(n, context.vars.source_text));
  return result(invented.length === 0, (names.length - invented.length) / names.length,
    invented.length === 0 ? `all ${names.length} named competitors are in the source` : `not in source: ${invented.join(', ')}`);
}

// "Left blank rather than inferred": the fields the gold says the source does NOT state must stay blank
// on every row. This is where small models most often invent a trigger, persona or consequence.
function vocBlankDiscipline(output, context) {
  const { rows } = vocRows(output);
  const gold = context.vars.gold || {};
  if (!rows) return result(false, 0, 'no rows to check');
  const fields = gold.must_blank || [];
  if (fields.length === 0 || rows.length === 0) return result(true, 1, 'nothing to hold blank');
  const filled = [];
  for (const f of fields) for (const [i, r] of rows.entries()) if (!isBlank(r[f])) filled.push(`${f} (row ${i}: ${JSON.stringify(String(r[f]).slice(0, 60))})`);
  const checks = fields.length * rows.length;
  return result(filled.length === 0, (checks - filled.length) / checks,
    filled.length === 0 ? `held blank: ${fields.join(', ')}` : `inferred, should be blank: ${filled.slice(0, 4).join('; ')}`);
}

// Labels: evidence_type, source_class and persona against the gold.
function vocLabels(output, context) {
  const { rows } = vocRows(output);
  const gold = context.vars.gold || {};
  if (!rows) return result(false, 0, 'no rows to check');
  if (rows.length === 0) return result(!!gold.expect_empty, gold.expect_empty ? 1 : 0, gold.expect_empty ? 'correctly empty' : 'returned no rows');
  const problems = [];
  const typeOk = r => !gold.evidence_type_any || gold.evidence_type_any.includes(String(r.evidence_type).toLowerCase());
  const classOk = r => !gold.source_class_any || gold.source_class_any.includes(String(r.source_class).toLowerCase());
  const personaOk = r => {
    if (!gold.persona_any) return true;
    if (gold.persona_any.length === 1 && gold.persona_any[0] === 'unknown') return isBlank(r.persona);
    return gold.persona_any.some(p => norm(r.persona).includes(norm(p)));
  };
  let ok = 0;
  rows.forEach((r, i) => {
    const bits = [];
    if (!typeOk(r)) bits.push(`evidence_type=${r.evidence_type}`);
    if (!classOk(r)) bits.push(`source_class=${r.source_class}`);
    if (!personaOk(r)) bits.push(`persona=${JSON.stringify(r.persona)}`);
    if (bits.length) problems.push(`row ${i} ${bits.join(', ')}`); else ok++;
  });
  return result(problems.length === 0, ok / rows.length, problems.length === 0 ? 'labels match gold' : problems.slice(0, 4).join('; '));
}

// Recall: the key buyer statements the gold names are captured, the fields the source clearly states are
// filled somewhere, named competitors are caught, and a negative control stays empty.
function vocRecall(output, context) {
  const { rows } = vocRows(output);
  const gold = context.vars.gold || {};
  if (!rows) return result(false, 0, 'no rows to check');
  if (gold.expect_empty) return result(rows.length === 0, rows.length === 0 ? 1 : 0, rows.length === 0 ? 'correctly returned no rows' : `padded ${rows.length} rows from a source with no buyer evidence`);
  const misses = [];
  let hits = 0, total = 0;
  for (const key of gold.key_quotes || []) {
    total++;
    const k = norm(key);
    const covered = rows.some(r => { const q = norm(unwrapQuote(r.exact_quote)); return q.includes(k) || (k.includes(q) && q.length >= k.length * 0.5); });
    if (covered) hits++; else misses.push(`quote ${JSON.stringify(key.slice(0, 60))}`);
  }
  for (const f of gold.must_fill || []) {
    total++;
    if (rows.some(r => !isBlank(r[f]))) hits++; else misses.push(`field ${f} never filled`);
  }
  for (const c of gold.competitors || []) {
    total++;
    if (rows.some(r => norm(r.competitor_mentioned).includes(norm(c)))) hits++; else misses.push(`competitor ${c} missed`);
  }
  if (gold.max_rows && rows.length > gold.max_rows) misses.push(`${rows.length} rows, gold allows at most ${gold.max_rows}`);
  if (total === 0) return result(misses.length === 0, misses.length === 0 ? 1 : 0.5, misses.join('; ') || 'nothing to recall');
  const score = hits / total;
  return result(misses.length === 0, score, misses.length === 0 ? `recalled ${hits}/${total}` : `recalled ${hits}/${total}; missed ${misses.slice(0, 4).join('; ')}`);
}

// ── Company fit (company-fit suite) ─────────────────────────────────────────
// Output contract is the client's locked /icp-prompt-builder prompt, typically
// { company_domain, qualified, confidence, signal_supported, source_confidence, reason }. Only `qualified`
// and `reason` are required here; the other fields are checked when present.

function fitSchema(output, context) {
  const { value, strict } = parseJson(output);
  const v = Array.isArray(value) ? value[0] : value;
  if (!v || typeof v !== 'object') return result(false, 0, 'not a JSON object');
  const problems = [];
  if (typeof v.qualified !== 'boolean') problems.push(`qualified=${JSON.stringify(v.qualified)}`);
  if (v.confidence !== undefined && !(typeof v.confidence === 'number' && v.confidence >= 0 && v.confidence <= 1)) problems.push(`confidence=${v.confidence}`);
  if (v.signal_supported !== undefined && typeof v.signal_supported !== 'boolean') problems.push('signal_supported not boolean');
  if (v.source_confidence !== undefined && !['high', 'medium', 'low'].includes(v.source_confidence)) problems.push(`source_confidence=${v.source_confidence}`);
  if (isBlank(v.reason)) problems.push('no reason');
  const domain = context.vars.company && context.vars.company.company_domain;
  if (domain && v.company_domain && norm(v.company_domain) !== norm(domain)) problems.push(`company_domain echoed as ${v.company_domain}`);
  if (Array.isArray(value)) problems.push('returned an array for one company');
  if (!strict) problems.push('needed the fallback parser');
  const pass = problems.length === 0;
  return result(pass, pass ? 1 : 0.5, pass ? 'ok' : problems.join('; '));
}

function fitVerdict(output, context) {
  const { value } = parseJson(output);
  const v = Array.isArray(value) ? value[0] : value;
  const gold = context.vars.gold || {};
  if (!v || typeof v.qualified !== 'boolean') return result(false, 0, 'no boolean verdict');
  const pass = v.qualified === gold.qualified;
  return result(pass, pass ? 1 : 0, `${pass ? 'match' : 'MISMATCH'}: model ${v.qualified}, gold ${gold.qualified} (${gold.basis || 'no basis recorded'})`);
}

// ── Competitor card (competitor-card suite) ─────────────────────────────────

const CARD_FIELDS = ['company', 'sells_to', 'main_promise', 'front_end_offer', 'archetype', 'price_points', 'named_customers', 'lead_magnets', 'primary_cta'];

function cardValue(output) {
  const { value, strict } = parseJson(output);
  return { v: value && typeof value === 'object' && !Array.isArray(value) ? value : undefined, strict };
}

function cardSchema(output) {
  const { v, strict } = cardValue(output);
  if (!v) return result(false, 0, 'not a JSON object');
  const problems = [];
  for (const f of CARD_FIELDS) if (!(f in v)) problems.push(`missing ${f}`);
  for (const f of Object.keys(v)) if (!CARD_FIELDS.includes(f)) problems.push(`invented field ${f}`);
  for (const f of ['price_points', 'named_customers', 'lead_magnets']) if (f in v && !Array.isArray(v[f])) problems.push(`${f} not an array`);
  if ('archetype' in v && !/^([A-K]|none)$/.test(String(v.archetype))) problems.push(`archetype=${v.archetype}`);
  if (!strict) problems.push('needed the fallback parser');
  const pass = problems.length === 0;
  return result(pass, pass ? 1 : 0.5, pass ? 'ok' : problems.slice(0, 6).join('; '));
}

// Everything the card presents as a quote or a named entity must be on the page.
function cardGrounding(output, context) {
  const { v } = cardValue(output);
  if (!v) return result(false, 0, 'no card to check');
  const page = context.vars.page_text;
  const claims = [];
  if (!isBlank(v.main_promise)) claims.push(['main_promise', v.main_promise]);
  if (!isBlank(v.primary_cta)) claims.push(['primary_cta', v.primary_cta]);
  for (const p of v.price_points || []) if (!isBlank(p)) claims.push(['price', p]);
  for (const c of v.named_customers || []) if (!isBlank(c)) claims.push(['customer', c]);
  if (claims.length === 0) return result(true, 1, 'no quoted claims');
  const off = claims.filter(([, text]) => !inSource(text, page));
  return result(off.length === 0, (claims.length - off.length) / claims.length,
    off.length === 0 ? `all ${claims.length} quoted claims are on the page` : `not on the page: ${off.slice(0, 4).map(([k, t]) => `${k} ${JSON.stringify(String(t).slice(0, 60))}`).join('; ')}`);
}

function cardLabels(output, context) {
  const { v } = cardValue(output);
  const gold = context.vars.gold || {};
  if (!v) return result(false, 0, 'no card to check');
  const misses = [];
  let hits = 0, total = 0;
  if (gold.archetype_any) { total++; if (gold.archetype_any.includes(String(v.archetype))) hits++; else misses.push(`archetype ${v.archetype}, gold ${gold.archetype_any.join('/')}`); }
  if (typeof gold.pricing_public === 'boolean') {
    total++;
    const has = (v.price_points || []).some(p => !isBlank(p));
    if (has === gold.pricing_public) hits++; else misses.push(gold.pricing_public ? 'missed the published price' : 'reported a price the page does not publish');
  }
  for (const c of gold.customers || []) { total++; if ((v.named_customers || []).some(x => norm(x).includes(norm(c)) || norm(c).includes(norm(x)))) hits++; else misses.push(`customer ${c} missed`); }
  if (gold.front_end_offer_present === false) { total++; if (isBlank(v.front_end_offer)) hits++; else misses.push('invented a front-end offer'); }
  if (gold.front_end_offer_present === true) { total++; if (!isBlank(v.front_end_offer)) hits++; else misses.push('missed the front-end offer'); }
  if (total === 0) return result(true, 1, 'no gold labels on this case');
  return result(misses.length === 0, hits / total, misses.length === 0 ? `matched ${hits}/${total}` : `matched ${hits}/${total}; ${misses.join('; ')}`);
}

// ── Cold-Reader Panel reader (cold-reader suite) ────────────────────────────
// One answer is one reader's read of one email. Panel-level rules (any reader who cannot tell fails the email,
// the two-thirds jargon rule and so on) live in outbound/scripts/cold_reader_panel.py; these checks test the
// single reader answer against the case's gold, so the benchmark measures whether a reader tier can tell a
// deliberately unclear email from a plain rewrite of the same offer.

const READER_FIELDS = ['who_sends', 'what_offered', 'why_these_terms'];
const READER_KINDS = ['offer', 'sender', 'cost', 'delivery', 'other'];
const READER_REPLIES = ['yes', 'who_are_you', 'no', 'ignore'];

function readerObject(output) {
  const { value } = parseJson(output);
  return value && typeof value === 'object' && !Array.isArray(value) ? value : undefined;
}

function isCannotTell(v) {
  return /^\s*cannot tell\s*\.?\s*$/i.test(String(v ?? ''));
}

function readerSchema(output) {
  const v = readerObject(output);
  if (!v) return result(false, 0, 'not a JSON object');
  const problems = [];
  for (const f of READER_FIELDS) if (typeof v[f] !== 'string' || v[f].trim() === '') problems.push(`${f} missing or empty`);
  if (!Array.isArray(v.still_want_to_know)) problems.push('still_want_to_know is not a list');
  else {
    if (v.still_want_to_know.length > 3) problems.push('more than 3 questions');
    v.still_want_to_know.forEach((q, i) => { if (!q || typeof q.question !== 'string' || !READER_KINDS.includes(q.kind)) problems.push(`question ${i + 1} has no valid kind`); });
  }
  if (!Array.isArray(v.jargon)) problems.push('jargon is not a list');
  else v.jargon.forEach((j, i) => { if (!j || typeof j.term !== 'string' || typeof j.plain_word !== 'string') problems.push(`jargon ${i + 1} needs term and plain_word`); });
  if (!Array.isArray(v.fears)) problems.push('fears is not a list');
  if (!READER_REPLIES.includes(v.reply)) problems.push('reply is not one of yes, who_are_you, no, ignore');
  if (typeof v.reply_reason !== 'string') problems.push('reply_reason missing');
  if (v.searches !== undefined && !Array.isArray(v.searches)) problems.push('searches is not a list');
  return problems.length === 0 ? result(true, 1, 'schema ok') : result(false, 0, problems.join('; '));
}

// gold.expect is "clear" (no field may be "cannot tell") or "unclear" (at least one field must be, and when
// gold.cannot_tell_any names fields, at least one of THOSE).
function readerDiscrimination(output, context) {
  const v = readerObject(output);
  if (!v) return result(false, 0, 'no answer to score');
  const gold = context?.vars?.gold || {};
  const gaps = READER_FIELDS.filter(f => isCannotTell(v[f]));
  if (gold.expect === 'clear') {
    return gaps.length === 0 ? result(true, 1, 'clear email read as clear') : result(false, 0, `clear email, but "cannot tell" on ${gaps.join(', ')}`);
  }
  if (gold.expect === 'unclear') {
    const want = Array.isArray(gold.cannot_tell_any) && gold.cannot_tell_any.length ? gold.cannot_tell_any : READER_FIELDS;
    const hit = gaps.filter(f => want.includes(f));
    return hit.length > 0 ? result(true, 1, `unclear email caught on ${hit.join(', ')}`) : result(false, 0, `unclear email not caught (expected "cannot tell" on one of ${want.join(', ')})`);
  }
  return result(false, 0, 'case gold has no expect: clear|unclear');
}

// Unclear cases list the jargon terms planted in the copy; the reader must flag at least one. Plain cases list none,
// and the reader may flag at most one term.
function readerJargon(output, context) {
  const v = readerObject(output);
  if (!v || !Array.isArray(v.jargon)) return result(false, 0, 'no jargon list to score');
  const planted = (context?.vars?.gold?.jargon_terms || []).map(norm).filter(Boolean);
  const flagged = v.jargon.map(j => norm(j && j.term)).filter(Boolean);
  if (planted.length === 0) return flagged.length <= 1 ? result(true, 1, `plain email, ${flagged.length} term flagged`) : result(false, 0, `plain email, but ${flagged.length} terms flagged`);
  const found = planted.filter(t => flagged.some(f => f.includes(t) || t.includes(f)));
  return found.length > 0 ? result(true, found.length / planted.length, `flagged ${found.length}/${planted.length} planted terms`) : result(false, 0, 'flagged none of the planted jargon');
}

// The reader must never look up the sender. gold.forbidden_search_terms lists the sender's company, product and name.
function readerBlindSearch(output, context) {
  const v = readerObject(output);
  if (!v) return result(false, 0, 'no reader object to score');
  if (v.searches !== undefined && !Array.isArray(v.searches)) return result(false, 0, 'searches is not a list');
  const searches = v.searches || [];
  const banned = (context?.vars?.gold?.forbidden_search_terms || []).map(norm).filter(Boolean);
  const bad = searches.filter(s => banned.some(b => norm(s && s.query).includes(b)));
  return bad.length === 0 ? result(true, 1, `${searches.length} searches, none about the sender`) : result(false, 0, `${bad.length} search(es) looked up the sender`);
}

module.exports = {
  parseJson, norm, isBlank, inSource,
  vocSchema, vocVerbatim, vocGrounding, vocBlankDiscipline, vocLabels, vocRecall,
  fitSchema, fitVerdict,
  cardSchema, cardGrounding, cardLabels,
  readerSchema, readerDiscrimination, readerJargon, readerBlindSearch, isCannotTell,
};
