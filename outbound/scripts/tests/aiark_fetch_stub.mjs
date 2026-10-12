// aiark_fetch_stub.mjs: offline stand-in for AI Ark, loaded with `node --import` by test_aiark_people.py. It
// replaces globalThis.fetch before aiark_people.mjs runs, so the real CLI is exercised end to end and no request
// ever leaves the machine. Mirrors the old verifier stub's shape (mv_fetch_stub.mjs, removed 2026-10-12), adapted for a POST+JSON API addressed by path and
// page number instead of a GET API addressed by query string.
//
// AIARK_STUB_SCENARIO: path to a JSON file:
//   {"people": {"<page>": step | [step, ...], ...}, "lists": step | [step, ...], "default": step}
// A page key is the "page" field of the posted body, as a string (page 0 -> "0"). Each key's steps are used in
// order and the last one repeats, exactly like that stub's per-email steps. A step is
// {"status": 200, "body": {...}, "credit": "-50"} or {"throw": "message, optionally with {url}"}.
// AIARK_STUB_LOG: path of a file that gets one JSON line per request: {"path", "page", "size"}.
import fs from 'node:fs';

const scenario = JSON.parse(fs.readFileSync(process.env.AIARK_STUB_SCENARIO, 'utf8'));
const logPath = process.env.AIARK_STUB_LOG;
const used = new Map();

function nextStep(key, bucket) {
  const steps = Array.isArray(bucket) ? bucket : [bucket];
  const n = used.get(key) || 0;
  used.set(key, n + 1);
  return steps[Math.min(n, steps.length - 1)];
}

globalThis.fetch = async (url, options = {}) => {
  const u = new URL(String(url));
  const prefix = '/api/developer-portal';
  if (!u.pathname.startsWith(prefix)) throw new Error(`stub: unexpected path ${u.pathname}`);
  const sub = u.pathname.slice(prefix.length);

  let bodyObj = {};
  try { bodyObj = options.body ? JSON.parse(options.body) : {}; } catch { /* ignore malformed body */ }

  if (logPath) fs.appendFileSync(logPath, `${JSON.stringify({ path: sub, page: bodyObj.page, size: bodyObj.size })}\n`);

  let bucket;
  let key;
  if (sub === '/v1/people') {
    key = `people:${bodyObj.page ?? 0}`;
    bucket = (scenario.people && scenario.people[String(bodyObj.page ?? 0)]) ?? scenario.default;
  } else if (sub === '/v1/lists') {
    key = 'lists';
    bucket = scenario.lists ?? scenario.default;
  } else {
    key = sub;
    bucket = scenario.default;
  }
  if (bucket === undefined) throw new Error(`stub: no scenario for ${sub} (key ${key})`);

  const step = nextStep(key, bucket);
  if (step.throw) throw new Error(String(step.throw).replace('{url}', String(url)));

  const headers = { 'content-type': 'application/json' };
  if (step.credit !== undefined) headers['x-credit'] = String(step.credit);
  return new Response(JSON.stringify(step.body ?? {}), { status: step.status || 200, headers });
};
