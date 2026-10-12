// giggal_fetch_stub.mjs: offline stand-in for the Giggal API, loaded with `node --import` by
// test_giggal_verify.py. It replaces globalThis.fetch before giggal_verify.mjs runs, so the real CLI is exercised end
// to end and no request ever leaves the machine.
//
// GIGGAL_STUB_SCENARIO: path to a JSON file. Fields (all optional):
//   emails         {"a@x.com": <result object as Giggal returns it>}; an address not listed gets `default`
//   default        the result for any unlisted address
//   unreturned     addresses a finished job leaves out of its results
//   catchall       {"a@x.com": "valid" | "invalid"} verdicts for POST /catchall
//   submit_steps   steps used in order by POST /verify-batch before it behaves normally. A step is
//                  {"status": 429, "body": {...}} or {"throw": "message"}; {key} in a message becomes the bearer key
//   single_steps   the same, for POST /verify
//   fatal_on_email a batch containing this address is answered HTTP 402 (the message echoes the bearer key)
//   job_status     status every job reports instead of "completed" (for example "failed" or "processing")
//   polls_before_done  how many GET /jobs/:id answer "processing" before "completed"
//   catchall_status    HTTP status POST /catchall answers (default 202)
//   credits        balance GET /credits reports before any spend (default 1000); each fresh batch result costs 1
// GIGGAL_STUB_LOG: file that gets one line per event: an address (submitted for verification), "credits",
//   "submit" (one POST /verify-batch that created a job), "catchall" (one POST /catchall), "idem:<key>".
import fs from 'node:fs';

const scenario = JSON.parse(fs.readFileSync(process.env.GIGGAL_STUB_SCENARIO, 'utf8'));
const logPath = process.env.GIGGAL_STUB_LOG;
const log = (line) => { if (logPath) fs.appendFileSync(logPath, line + '\n'); };
const jobs = new Map();
const tasks = new Map();
const submitSteps = [...(scenario.submit_steps || [])];
const singleSteps = [...(scenario.single_steps || [])];
let spent = 0;

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const ok = (data, meta) => json(200, { success: true, data, ...(meta ? { meta } : {}) });
const resultFor = (email) => ({ email, ...((scenario.emails && scenario.emails[email]) || scenario.default) });
const page = (list, params) => {
  const limit = Number(params.get('limit') || 50);
  const p = Number(params.get('page') || 1);
  return { slice: list.slice((p - 1) * limit, p * limit), pagination: { total: list.length, page: p, limit, pages: Math.max(1, Math.ceil(list.length / limit)) } };
};

globalThis.fetch = async (url, init = {}) => {
  const u = new URL(String(url));
  if (u.hostname !== 'api.giggal.ai') throw new Error(`stub: unexpected host ${u.hostname}`);
  const method = (init.method || 'GET').toUpperCase();
  const headers = init.headers || {};
  const auth = headers.Authorization || '';
  const key = auth.replace(/^Bearer /, '');
  if (u.search.includes(key) && key) throw new Error('stub: the key must travel in the Authorization header, never the URL');
  const body = init.body ? JSON.parse(init.body) : {};
  const step = (list) => {
    const s = list.length ? list.shift() : null;
    if (s && s.throw) throw new Error(s.throw.split('{key}').join(key));
    return s;
  };

  if (u.pathname === '/v1/credits') {
    log('credits');
    const balance = (scenario.credits ?? 1000) - spent;
    return ok({ balance, availableCredits: balance });
  }

  if (u.pathname === '/v1/verify' && method === 'POST') {
    const email = String(body.email || '');
    log(email);
    const s = step(singleSteps);
    if (s) return json(s.status || 200, s.body);
    spent += 1;
    return ok(resultFor(email));
  }

  if (u.pathname === '/v1/verify-batch' && method === 'POST') {
    const emails = body.emails || [];
    const s = step(submitSteps);
    if (s) return json(s.status || 200, s.body);
    if (scenario.fatal_on_email && emails.includes(scenario.fatal_on_email)) {
      return json(402, { success: false, message: `Insufficient credits for ${key}` });
    }
    log('submit');
    log('idem:' + (headers['Idempotency-Key'] || ''));
    for (const e of emails) log(e);
    const id = `job_${jobs.size + 1}`;
    jobs.set(id, { emails, polls: 0 });
    return json(202, { success: true, data: { jobId: id, status: 'processing', totalEmails: emails.length }, meta: { idempotentReplay: false } });
  }

  let m = u.pathname.match(/^\/v1\/jobs\/([^/]+)(\/results)?$/);
  if (m && method === 'GET') {
    const job = jobs.get(m[1]);
    if (!job) return json(404, { success: false, message: 'job not found' });
    if (!m[2]) {
      job.polls++;
      const status = scenario.job_status || (job.polls > (scenario.polls_before_done || 0) ? 'completed' : 'processing');
      return ok({ jobId: m[1], status, totalEmails: job.emails.length, error: status === 'failed' ? 'worker crashed' : null });
    }
    const left = new Set(scenario.unreturned || []);
    const all = job.emails.filter((e) => !left.has(e)).map(resultFor);
    const { slice, pagination } = page(all, u.searchParams);
    if (!job.charged) { job.charged = true; spent += all.filter((r) => r.status !== 'unknown').length; }
    return ok({ job: { jobId: m[1], status: 'completed' }, results: slice, pagination });
  }

  if (u.pathname === '/v1/catchall' && method === 'POST') {
    log('catchall');
    if ((scenario.catchall_status || 202) >= 400) return json(scenario.catchall_status, { success: false, message: 'catch-all unavailable' });
    const job = jobs.get(body.jobId);
    if (!job) return json(400, { success: false, error: 'jobId is required' });
    const id = `task_${tasks.size + 1}`;
    tasks.set(id, job);
    return json(202, { success: true, data: { taskId: id, sourceJobId: body.jobId, status: 'processing' } });
  }

  m = u.pathname.match(/^\/v1\/catchall\/([^/]+)(\/results)?$/);
  if (m && method === 'GET') {
    const job = tasks.get(m[1]);
    if (!job) return json(404, { success: false, message: 'task not found' });
    if (!m[2]) return ok({ taskId: m[1], status: 'completed' });
    const verdicts = scenario.catchall || {};
    const all = job.emails.filter((e) => e in verdicts).map((e) => ({ email: e, score: verdicts[e] === 'valid' ? 90 : 9, verdict: verdicts[e], is_actually_catchall: true }));
    const { slice, pagination } = page(all, u.searchParams);
    return ok({ task: { taskId: m[1], status: 'completed' }, results: slice, pagination });
  }

  return json(404, { success: false, message: `stub: no route for ${method} ${u.pathname}` });
};
