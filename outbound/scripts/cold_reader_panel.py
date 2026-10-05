#!/usr/bin/env python3
"""cold_reader_panel.py: the Cold-Reader Panel for FNNL (a comprehension rail for cold email copy).

Spec: outbound/reference/cold-reader-panel.md. Reader instruction: outbound/evals/cold-reader/prompt.md.

This script makes NO model call and holds no key (the no-AI-API rule). The readers and the judge are fresh
Claude Code sub-agents that the session launches; the script only prepares their packets and scores what they
wrote back, the same split as outbound/evals/run_eval.mjs.

  prepare  build one reader packet per (email, reader, repeat) and write plan.json (the fan-out plan)
  judge    once readings exist, build one judge packet per email (the judge sees only the readers' words)
  score    read readings and judge answers, apply the fail rules, write report.json and report.md

Usage:
  python cold_reader_panel.py prepare --config <cold-reader.yaml> [--label first] [--repeats 1] [--tier sonnet] [--only <id-part>]
  python cold_reader_panel.py judge   --config <cold-reader.yaml> --label first
  python cold_reader_panel.py score   --config <cold-reader.yaml> --label first
  python cold_reader_panel.py prepare ... --dry-run     (print one reader packet, write nothing)

A run is resumable: prepare skips any reading already on disk and valid, and a rerun of score only re-scores.
If a sub-agent cannot run (a usage limit, the tier unavailable), stop and tell the operator. Never run the
remaining readers on a different tier and call it the same run: the tier is recorded in meta.json at prepare.

Fail rules are SHARES of readings (so more repeats never mean more chances to fail). The thresholds are the
defaults below, overridable per campaign in the config.
"""
import argparse, csv, json, random, re, sys
from collections import Counter, defaultdict
from pathlib import Path

import yaml

HERE = Path(__file__).resolve().parent
OUTBOUND = HERE.parent
READER_PROMPT = OUTBOUND / 'evals' / 'cold-reader' / 'prompt.md'

DEFAULTS = {
    'personas': 6,              # 5 to 8
    'repeats': 1,
    'word_ceiling': 100,        # per email body; a campaign may set its own
    'context_budget': 1,        # plain sentences about the sender allowed (0, 1 or 2): a warning, not a fail
    'confused_share': 0.15,     # share of readings that miss or misread who / offer / why
    'jargon_share': 0.30,       # share of readings that flag the same term
    'who_are_you_share': 0.50,  # share of "who are you?" replies
    'too_much_share': 0.50,     # share of readings with no question left that a reply would answer
    'seed': 7,
}

AWARENESS_TEXT = {
    'low': "You do not know this kind of service or its terms, and you have never bought one.",
    'medium': "You have heard of this kind of service in passing but have never bought or used one.",
    'high': "You know this kind of service well, and its usual terms, from your own work.",
}
BRAND_TEXT = {
    'low': "You have never heard of the sender or the sender's company.",
    'medium': "You may have seen the sender's company name once, but you do not know what it does.",
    'high': "You know the sender's company and what it does.",
}

JUDGE_INSTRUCTION = """You check whether cold-email readers understood an email the way the sender meant it. You compare meaning, not wording. You never rewrite the email and you never suggest copy.

You get the email, what the sender MEANS it to say (who, offer, why), and several independent readings. Each reading is only the reader's own words.

For each reading, mark who, offer and why as one of:
- "match": the reader's answer carries the intended meaning, in any words.
- "partial": broadly right but missing or blurring a key part (say which part in the note).
- "wrong": the reader is confident but has it wrong (say how in the note).
- "cannot_tell": the reader gives no real answer, only that they cannot tell.

A reader who gives a real answer and adds that the email does not state it outright has answered: judge the answer, not the hedge. For why, naming the sender's likely motive (a sample to win a customer, a trial to convert a user, a lead-in to a sales conversation) is enough for match. For who, the reader must say what the sender's company does: naming the sender or the company without saying what it does is cannot_tell.

Then classify each of the reader's still_want_to_know questions as:
- "delivery": a detail a reply to a yes would answer (format, timing, what they need to send, scope, price after the free part).
- "basic": a question the email itself should have answered (who is this, what is it, why me, why free, is this real).

Also count context_sentences: the sentences in the email body whose job is to say who the sender is or what the sender's company does.

Return ONLY one JSON object, no prose and no code fence, with exactly these keys:
{"context_sentences": 0, "readings": [{"reader": "<reader id as given>", "who": "<match|partial|wrong|cannot_tell>", "offer": "<same>", "why": "<same>", "note": "<one short line when something is partial or wrong, else empty>", "questions": [{"q": "", "kind": "<delivery|basic>"}]}]}"""

REPLIES = ('yes', 'who_are_you', 'no', 'ignore')
VERDICTS = ('match', 'partial', 'wrong', 'cannot_tell')


# small helpers
def load_yaml(p):
    with open(p, encoding='utf-8') as f:
        return yaml.safe_load(f)


def words(text):
    return len(re.findall(r"[A-Za-z0-9{}'_-]+", text))


def resolve_spintax(text):
    pat = re.compile(r"(?<!\{)\{([^{}|]*\|[^{}]*)\}(?!\})")
    while pat.search(text):
        text = pat.sub(lambda m: m.group(1).split('|')[0], text)
    return text


def fill_vars(text, row):
    def sub(m):
        name = m.group(1).strip().lower()
        if name == 'first_name':
            return 'Sam'
        v = (row or {}).get(name) or ''
        return v if v and name not in ('email', 'last_name', 'linkedin_url') else m.group(0)
    return re.sub(r"\{\{\s*([A-Za-z0-9_]+)\s*\}\}", sub, text)


def slug(s):
    return re.sub(r'[^A-Za-z0-9._-]+', '_', s)


def read_prompt():
    t = READER_PROMPT.read_text(encoding='utf-8-sig')
    return re.sub(r'<!--[\s\S]*?-->', '', t).strip()


# copy loading (variants.yaml, the file /campaign-copywriting writes)
def load_steps(path):
    d = load_yaml(path)
    steps = []
    for s in d.get('sequences', []):
        steps.append({'step': int(s['step']), 'thread_reply': bool(s.get('thread_reply', int(s['step']) > 1)),
                      'variants': [{'label': str(v.get('label', 'A')), 'subject': v.get('subject') or '', 'body': v['body']}
                                   for v in s['variants']]})
    return steps


def build_emails(cfg, base):
    steps = load_steps(base / cfg['copy'])
    prior = load_steps(base / cfg['thread_from']) if cfg.get('thread_from') else steps
    first = next(s for s in prior if s['step'] == 1)
    wanted = set(cfg.get('steps') or [s['step'] for s in steps])
    emails = []
    for s in steps:
        if s['step'] not in wanted:
            continue
        for v in s['variants']:
            eid = f"{cfg['slug']}:s{s['step']}{v['label']}"
            subject = v['subject']
            if s['thread_reply']:
                subject = subject or ('Re: ' + first['variants'][0]['subject'])
                for fv in first['variants'][: int(cfg.get('thread_variants', 1))]:
                    emails.append({'id': f"{eid}/under-{fv['label']}", 'step': s['step'], 'subject': subject,
                                   'body': v['body'], 'thread': [fv]})
                if cfg.get('standalone_followups', True):
                    emails.append({'id': f"{eid}/alone", 'step': s['step'], 'subject': subject, 'body': v['body'], 'thread': []})
            else:
                emails.append({'id': eid, 'step': s['step'], 'subject': subject, 'body': v['body'], 'thread': []})
    for e in cfg.get('extra_emails', []):   # hand-written controls, e.g. an over-explained email
        emails.append({'id': f"{cfg['slug']}:{e['id']}", 'step': e.get('step', 1), 'subject': e['subject'],
                       'body': e['body'], 'thread': [], 'control': True})
    return emails


def render(email, sender, row):
    sig = (sender.get('signature') or sender['name']).strip()
    body = fill_vars(resolve_spintax(email['body']), row).replace('{{sender_signature}}', '').strip()
    out = [f"From: {sender['name']}", f"Subject: {fill_vars(resolve_spintax(email['subject']), row)}", '', body, '', sig]
    for t in email['thread']:
        prev = fill_vars(resolve_spintax(t['body']), row).strip()
        quoted = '\n'.join('> ' + ln for ln in (prev + '\n\n' + sig).splitlines())
        out += ['', f"On an earlier day, {sender['name']} wrote:", quoted]
    return '\n'.join(out)


# personas from the campaign's own verified list: title, company, size, what it sells. Never a name or an email.
def pick_personas(leads_path, n, seed):
    with open(leads_path, encoding='utf-8-sig', newline='') as f:
        rows = [r for r in csv.DictReader(f) if (r.get('job_title') or '').strip() and (r.get('company_name') or '').strip()]
    rng = random.Random(seed)
    rng.shuffle(rows)
    groups = defaultdict(list)
    for r in rows:   # spread across seniority tier and company size
        groups[((r.get('title_role_tier') or r.get('title_seniority') or '?').lower(), (r.get('headcount_band') or '?'))].append(r)
    order = sorted(groups, key=lambda k: rng.random())
    picked, seen = [], set()
    while len(picked) < n and any(groups.values()):
        for k in order:
            while groups[k]:
                r = groups[k].pop()
                if r['company_name'].lower() in seen:
                    continue
                seen.add(r['company_name'].lower())
                picked.append({'title': r['job_title'].strip(), 'company': r['company_name'].strip(),
                               'size': (r.get('headcount') or r.get('headcount_num') or r.get('headcount_band') or '').strip(),
                               'industry': (r.get('industry_norm') or r.get('industry') or '').strip(),
                               'sells': (r.get('service_line') or '').strip(), 'sells_to': (r.get('sold_to') or '').strip()})
                break
            if len(picked) >= n:
                break
    return picked


def persona_block(p, cfg):
    aw = cfg.get('awareness') or {}
    lines = ['WHO YOU ARE:', f"title: {p['title']}", f"company: {p['company']}",
             f"company size: {p['size'] or 'unknown'}"]
    if p['industry']:
        lines.append(f"your company's industry: {p['industry']}")
    lines.append(f"what your company sells: {p['sells'] or 'unknown'}")
    if p['sells_to']:
        lines.append(f"who your company sells to: {p['sells_to']}")
    lines.append('how well people in your field know this kind of service: ' +
                 (cfg.get('reader_knowledge') or AWARENESS_TEXT[aw.get('category', 'low')]))
    lines.append(BRAND_TEXT[aw.get('brand', 'low')])
    return '\n'.join(lines)


def setup(a):
    cfg_path = Path(a.config).resolve()
    base = cfg_path.parent
    cfg = {**DEFAULTS, **load_yaml(cfg_path)}
    if getattr(a, 'repeats', None):
        cfg['repeats'] = a.repeats
    root = base / 'cold-reader' / (a.label or 'run')
    return cfg, base, root


def prepare(a):
    cfg, base, root = setup(a)
    sender = cfg['sender']
    personas = pick_personas(base / cfg['leads'], int(cfg['personas']), cfg['seed'])
    if len(personas) < 5:
        raise SystemExit(f"only {len(personas)} usable persona rows in {cfg['leads']} (need 5)")
    emails = build_emails(cfg, base)
    if a.only:
        emails = [e for e in emails if a.only in e['id']]
    prompt = read_prompt()
    jobs, warned = [], set()
    for e in emails:
        for pi, p in enumerate(personas):
            for rep in range(int(cfg['repeats'])):
                rid = f"R{pi + 1}.{rep}"
                rendered = render(e, sender, {'company_name': p['company'], 'company': p['company']})
                left = sorted(set(re.findall(r"\{\{[^}]+\}\}", rendered)))
                if left and e['id'] not in warned:
                    warned.add(e['id'])
                    print(f"WARNING: {e['id']} has unresolved merge field(s) {left}; readers would see them literally")
                text = (prompt + '\n\n' + persona_block(p, cfg) + '\n\nTHE EMAIL YOU RECEIVED:\n' + rendered)
                jobs.append({'email': e['id'], 'reader': rid, 'text': text,
                             'packet': f"packets/{slug(e['id'])}__{rid}.md", 'out': f"readings/{slug(e['id'])}__{rid}.json"})
    if a.dry_run:
        print(jobs[0]['text'])
        print(f"\n[{len(emails)} emails x {len(personas)} readers x {cfg['repeats']} repeat(s) = {len(jobs)} readings]")
        return
    (root / 'packets').mkdir(parents=True, exist_ok=True)
    (root / 'readings').mkdir(parents=True, exist_ok=True)
    todo = []
    for j in jobs:
        (root / j['packet']).write_text(j['text'], encoding='utf-8')
        if read_json(root / j['out']) is None:
            todo.append({k: j[k] for k in ('email', 'reader', 'packet', 'out')})
    meta = {'label': a.label, 'reader_tier': a.tier, 'repeats': int(cfg['repeats']), 'personas': len(personas),
            'emails': [e['id'] for e in emails], 'readings': len(jobs), 'search': 'off'}
    (root / 'meta.json').write_text(json.dumps(meta, indent=1), encoding='utf-8')
    (root / 'plan.json').write_text(json.dumps({'tier': a.tier, 'todo': todo, 'total': len(jobs)}, indent=1), encoding='utf-8')
    print(f"{len(emails)} emails, {len(jobs)} readings ({len(todo)} to run) on tier {a.tier}. Plan: {root / 'plan.json'}")
    print("Launch one fresh sub-agent per todo entry (disjoint packet and output paths) on the recorded tier, "
          "then run: judge, then score.")


def read_json(path):
    if not path.exists():
        return None
    t = path.read_text(encoding='utf-8-sig').strip()
    t = re.sub(r"^```(?:json)?|```$", '', t, flags=re.M).strip()
    try:
        v = json.loads(t)
    except Exception:
        return None
    return v if isinstance(v, dict) else None


def reading_ok(v):
    return bool(v) and all(isinstance(v.get(k), str) for k in ('who_sends', 'what_offered', 'why_these_terms')) \
        and v.get('reply') in REPLIES and isinstance(v.get('jargon', []), list) and isinstance(v.get('still_want_to_know', []), list)


def readings_for(root, eid, meta):
    rs, missing = [], 0
    n = int(meta['personas'])
    for pi in range(n):
        for rep in range(int(meta['repeats'])):
            rid = f"R{pi + 1}.{rep}"
            v = read_json(root / 'readings' / f"{slug(eid)}__{rid}.json")
            if reading_ok(v):
                rs.append({'reader': rid, 'answer': v})
            else:
                missing += 1
    return rs, missing


def judge_packet(cfg, e, rs):
    payload = [{'reader': r['reader'], 'who': r['answer']['who_sends'], 'offer': r['answer']['what_offered'],
                'why': r['answer']['why_these_terms'],
                'still_want_to_know': [q.get('question', '') if isinstance(q, dict) else str(q)
                                       for q in r['answer'].get('still_want_to_know', [])]} for r in rs]
    body = fill_vars(resolve_spintax(e['body']), {}).strip()
    it = cfg['intended']
    return (JUDGE_INSTRUCTION + f"\n\nEMAIL BODY:\n{body}\n\nWHAT THE SENDER MEANS IT TO SAY:\n- who: {it['who']}\n"
            f"- offer: {it['offer']}\n- why: {it['why']}\n\nREADINGS:\n{json.dumps(payload, ensure_ascii=False, indent=1)}")


def judge(a):
    cfg, base, root = setup(a)
    meta = json.loads((root / 'meta.json').read_text(encoding='utf-8'))
    emails = {e['id']: e for e in build_emails(cfg, base)}
    (root / 'judge').mkdir(exist_ok=True)
    (root / 'judge-packets').mkdir(exist_ok=True)
    todo, blocked = [], []
    for eid in meta['emails']:
        rs, missing = readings_for(root, eid, meta)
        if missing:
            blocked.append((eid, missing))
            continue
        pk = root / 'judge-packets' / f"{slug(eid)}.md"
        pk.write_text(judge_packet(cfg, emails[eid], rs), encoding='utf-8')
        out = root / 'judge' / f"{slug(eid)}.json"
        if read_json(out) is None:
            todo.append({'email': eid, 'packet': f"judge-packets/{slug(eid)}.md", 'out': f"judge/{slug(eid)}.json"})
    (root / 'judge-plan.json').write_text(json.dumps({'todo': todo}, indent=1), encoding='utf-8')
    print(f"{len(todo)} judge packets to run (one fresh sub-agent each, same tier as the readers). Plan: {root / 'judge-plan.json'}")
    for eid, m in blocked:
        print(f"  WAITING: {eid} is missing {m} reading(s); finish them first")


def score_email(e, rs, jd, cfg, own_names):
    n = len(rs)
    body = fill_vars(resolve_spintax(e['body']), {}).strip()
    wc = words(body)
    jr = {x.get('reader'): x for x in (jd or {}).get('readings', [])}
    miss, jargon, reactions = Counter(), defaultdict(lambda: {'n': 0, 'plain': Counter()}), Counter()
    confused = nothing_left = 0
    notes, fears, basic, delivery = [], [], [], []
    for r in rs:
        a, j = r['answer'], jr.get(r['reader'], {})
        bad = False
        for dim, key in (('who', 'who_sends'), ('offer', 'what_offered'), ('why', 'why_these_terms')):
            literal = a[key].strip().lower() == 'cannot tell'
            verdict = j.get(dim) or ('cannot_tell' if literal else 'match')
            if verdict in ('cannot_tell', 'wrong'):
                miss[dim] += 1
                bad = True
        if j.get('note'):
            notes.append(f"{r['reader']}: {j['note']}")
        confused += bad
        qs = j.get('questions') or [{'q': (q.get('question', '') if isinstance(q, dict) else str(q)),
                                     'kind': (q.get('kind', '?') if isinstance(q, dict) else '?')}
                                    for q in a.get('still_want_to_know', [])]
        if not bad and not qs:
            nothing_left += 1
        for q in qs:
            (basic if q.get('kind') == 'basic' else delivery).append(q.get('q', ''))
        for t in a.get('jargon', []) or []:
            term = (t.get('term', '') if isinstance(t, dict) else str(t)).strip().lower()
            if term and not any(s and s in term for s in own_names):
                jargon[term]['n'] += 1
                if isinstance(t, dict) and t.get('plain_word'):
                    jargon[term]['plain'][t['plain_word'].strip().lower()] += 1
        fears += [f for f in a.get('fears', []) or [] if f]
        reactions[a['reply']] += 1
    share = lambda k: (k / n) if n else 0.0
    findings = []
    if n and share(confused) >= cfg['confused_share']:
        for dim in ('who', 'offer', 'why'):
            if miss[dim]:
                findings.append({'type': 'too_little', 'what': dim, 'readers': miss[dim], 'of': n,
                                 'detail': f"{miss[dim]} of {n} readings could not say (or got wrong) {dim}"})
    for term, d in sorted(jargon.items(), key=lambda kv: -kv[1]['n']):
        if share(d['n']) >= cfg['jargon_share']:
            say = [w for w, _ in d['plain'].most_common(2)]
            findings.append({'type': 'jargon', 'term': term, 'readers': d['n'], 'of': n, 'readers_say_instead': say,
                             'detail': f"'{term}' was flagged by {d['n']} of {n} readings; readers say '{' / '.join(say) or '?'}' "
                                       f"(their vocabulary, not a rewrite)"})
    if n and share(reactions['who_are_you']) >= cfg['who_are_you_share']:
        findings.append({'type': 'who_are_you', 'readers': reactions['who_are_you'], 'of': n,
                         'detail': f"{reactions['who_are_you']} of {n} readings would reply 'who are you?'"})
    if n and share(nothing_left) > cfg['too_much_share']:
        findings.append({'type': 'too_much', 'readers': nothing_left, 'of': n,
                         'detail': f"{nothing_left} of {n} readings understood everything and had no question left at all"})
    if wc > cfg['word_ceiling']:
        findings.append({'type': 'over_ceiling', 'detail': f"{wc} words, ceiling {cfg['word_ceiling']}"})
    ctx = (jd or {}).get('context_sentences')
    if isinstance(ctx, int) and ctx > cfg['context_budget']:
        findings.append({'type': 'over_context_budget', 'warn': True,
                         'detail': f"warning: judge counted {ctx} sentences about the sender, budget {cfg['context_budget']} (a note, not a fail)"})
    verdict = 'FAIL' if any(f['type'] in ('too_little', 'jargon', 'who_are_you', 'too_much', 'over_ceiling') for f in findings) else 'PASS'
    return {'id': e['id'], 'step': e['step'], 'control': e.get('control', False), 'verdict': verdict, 'words': wc,
            'readers': n, 'confused_readers': confused, 'miss': dict(miss), 'who_are_you': reactions['who_are_you'],
            'nothing_left': nothing_left, 'reactions': dict(reactions), 'findings': findings, 'judge_notes': notes[:12],
            'questions_basic': basic[:12], 'questions_delivery': delivery[:12], 'fears': fears[:12]}


def score(a):
    cfg, base, root = setup(a)
    meta = json.loads((root / 'meta.json').read_text(encoding='utf-8'))
    sender = cfg['sender']
    own = {sender['name'].lower(), (sender.get('company') or '').strip().lower()} - {''}
    emails = {e['id']: e for e in build_emails(cfg, base)}
    report = []
    for eid in meta['emails']:
        rs, missing = readings_for(root, eid, meta)
        jd = read_json(root / 'judge' / f"{slug(eid)}.json")
        if missing or jd is None:
            report.append({'id': eid, 'verdict': 'INCOMPLETE', 'readers': len(rs), 'missing_readings': missing,
                           'judge_missing': jd is None, 'findings': [], 'control': emails[eid].get('control', False)})
            continue
        report.append({**score_email(emails[eid], rs, jd, cfg, own), 'missing_readings': 0, 'judge_missing': False})
    out = {'meta': meta, 'emails': report}
    (root / 'report.json').write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
    (root / 'report.md').write_text(to_markdown(meta, report), encoding='utf-8')
    c = Counter(r['verdict'] for r in report)
    print(f"PASS {c['PASS']} / FAIL {c['FAIL']} / INCOMPLETE {c['INCOMPLETE']} of {len(report)} emails. Report: {root / 'report.md'}")
    if c['INCOMPLETE']:
        print("INCOMPLETE means readings or a judge answer are missing. It is not a pass. Finish them and score again.")
    for r in report:
        if r['verdict'] == 'INCOMPLETE':
            print(f"  INCOMPLETE {r['id']}: {r['missing_readings']} readings missing, judge {'missing' if r['judge_missing'] else 'ok'}")
        else:
            m = r['miss']
            print(f"  {r['verdict']:4s} {r['id']:40s} confused {r['confused_readers']}/{r['readers']} who {m.get('who', 0)} "
                  f"offer {m.get('offer', 0)} why {m.get('why', 0)} who_are_you {r['who_are_you']} words {r['words']}")
    sys.exit(2 if c['INCOMPLETE'] else 1 if c['FAIL'] else 0)


def to_markdown(meta, report):
    L = [f"# Cold-Reader Panel: {meta['label']}", '',
         f"Blind model readers built from the campaign's own verified contact rows read each email and say who wrote it, what is "
         f"offered and why. A floor for confusion, not a forecast of replies: model readers are more patient than a busy founder. "
         f"Readers and judge: fresh Claude sub-agents on the {meta['reader_tier']} tier, {meta['repeats']} repeat(s), search {meta['search']}.", '',
         '| Email | Verdict | Confused | Missed who / offer / why | "Who are you?" | Words |', '|---|---|---|---|---|---|']
    for r in report:
        if r['verdict'] == 'INCOMPLETE':
            L.append(f"| {r['id']} | INCOMPLETE | | | | |")
            continue
        m = r['miss']
        L.append(f"| {r['id']}{' (control)' if r['control'] else ''} | {r['verdict']} | {r['confused_readers']} of {r['readers']} | "
                 f"{m.get('who', 0)} / {m.get('offer', 0)} / {m.get('why', 0)} | {r['who_are_you']} | {r['words']} |")
    L.append('')
    for r in report:
        if r['verdict'] == 'INCOMPLETE' or not (r['findings'] or r['judge_notes']):
            continue
        L += [f"## {r['id']}: {r['verdict']}", ''] + [f"- {f['detail']}" for f in r['findings']]
        if r['judge_notes']:
            L += ['', 'Where readers went wrong (judge notes):'] + [f"- {x}" for x in r['judge_notes']]
        if r['questions_basic']:
            L += ['', 'Basic questions the email left open:'] + [f"- {x}" for x in r['questions_basic'][:6]]
        if r['fears']:
            L += ['', 'Fears if they said yes:'] + [f"- {x}" for x in r['fears'][:4]]
        L.append('')
    return '\n'.join(L)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest='cmd', required=True)
    for name in ('prepare', 'judge', 'score'):
        p = sub.add_parser(name)
        p.add_argument('--config', required=True)
        p.add_argument('--label', default='run')
        if name == 'prepare':
            p.add_argument('--repeats', type=int)
            p.add_argument('--tier', default='sonnet', choices=['haiku', 'sonnet', 'session'])
            p.add_argument('--only')
            p.add_argument('--dry-run', action='store_true')
    a = ap.parse_args()
    {'prepare': prepare, 'judge': judge, 'score': score}[a.cmd](a)


if __name__ == '__main__':
    main()
