// mv_fetch_stub.mjs: offline stand-in for MillionVerifier, loaded with `node --import` by
// test_millionverifier_verify.py. It replaces globalThis.fetch before millionverifier_verify.mjs runs, so the real
// CLI is exercised end to end and no request ever leaves the machine.
//
// MV_STUB_SCENARIO: path to a JSON file {"emails": {"a@x.com": [step, ...]}, "default": step}. Each email's steps
//   are used in order and the last one repeats. A step is {"status": 200, "body": {...}} or {"throw": "message"}.
//   A thrown message may contain {url}, which is replaced with the full request URL (key included) so the test
//   can prove the CLI scrubs it.
// MV_STUB_LOG: path of a file that gets one line per request (the email, or "credits").
import fs from 'node:fs';

const scenario = JSON.parse(fs.readFileSync(process.env.MV_STUB_SCENARIO, 'utf8'));
const logPath = process.env.MV_STUB_LOG;
const used = new Map();

globalThis.fetch = async (url) => {
  const u = new URL(String(url));
  if (u.hostname !== 'api.millionverifier.com') throw new Error(`stub: unexpected host ${u.hostname}`);
  if (u.pathname.startsWith('/api/v3/credits')) {
    if (logPath) fs.appendFileSync(logPath, 'credits\n');
    return new Response(JSON.stringify({ credits: 1000 }), { status: 200, headers: { 'content-type': 'application/json' } });
  }
  const email = u.searchParams.get('email') || '';
  if (logPath) fs.appendFileSync(logPath, email + '\n');
  const steps = (scenario.emails && scenario.emails[email]) || [scenario.default];
  const n = used.get(email) || 0;
  used.set(email, n + 1);
  const step = steps[Math.min(n, steps.length - 1)];
  if (step.throw) throw new Error(step.throw.replace('{url}', String(url)));
  return new Response(JSON.stringify(step.body), { status: step.status || 200, headers: { 'content-type': 'application/json' } });
};
