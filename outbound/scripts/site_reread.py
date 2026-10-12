#!/usr/bin/env python3
"""site_reread.py: the free website re-read for companies whose database description lacks an attribute a
campaign needs (ruling attribute-reread, operator 2026-10-12; aaron-flow.md section 12).

On the 2026-10-12 fnnl-agency wave, agencies shipped only when their database description named a client type,
and their websites were never read to find it. Now a company missing the attribute is held, not dropped: this
script reads its site, writes batches for Claude sub-agents to judge again, then merges their verdicts back.

Three commands, all resumable:
  fetch   Plain HTTP GET of the homepage plus one industries / clients / who-we-serve / work page per domain.
          No paid crawler, no AI, no login. Writes one JSON line per domain to --out (appends; done domains skip).
            python site_reread.py fetch --in companies-fit.csv --where fit=maybe --out reread/sites.jsonl
          --where col=value (repeatable, ANDed) picks the rows; --where-blank col picks rows whose col is empty
          (for example the attribute column itself). --domain-col defaults to company_domain.
  batch   Text blocks (### <domain>, TITLE, META, HEADS, BODY, SUB) for the judge sub-agents, a few hundred
          domains per file (default 300; never one sub-agent per row, ruling model-jobs).
            python site_reread.py batch --sites reread/sites.jsonl --out-dir reread/batches --per-batch 300
  merge   Joins the sub-agents' CSVs (id,fit,variable) back onto the company file, with a count check: every
          domain in the batches must come back exactly once. New columns: reread_fit, reread_variable,
          reread_status (judged | unreachable | missing).
            python site_reread.py merge --companies companies-fit.csv --sites reread/sites.jsonl
                   --results reread/out --out companies-reread.csv

The rules file the sub-agents read is per client and per attribute (for example reread/rules-reread.md), written
from the client's fit rules. Aaron's ~40% attribute floor is measured AFTER the merge, on the re-read result.

Exit codes: 0 fine, 2 usage or input error, 3 merge count check failed (a domain missing or duplicated).
"""
import argparse
import concurrent.futures as cf
import csv
import glob
import html
import json
import os
import re
import ssl
import sys
import urllib.request

csv.field_size_limit(10**8)
CTX = ssl.create_default_context()
CTX.check_hostname = False
CTX.verify_mode = ssl.CERT_NONE
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/124 Safari/537.36", "Accept": "text/html"}
LINK = re.compile(r'href=["\']([^"\'#]*(industr|clients|who-we-serve|who-we-help|our-work|case-stud|sectors|'
                  r'verticals|specialt|solutions|customers)[^"\']*)["\']', re.I)


def clean_domain(d):
    return re.sub(r"^https?://(www\.)?", "", (d or "").strip().lower()).split("/")[0]


def get(url):
    try:
        r = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=12, context=CTX)
        return r.geturl(), r.read(600000).decode("utf-8", "ignore")
    except Exception:
        return None, ""


def strip(s):
    return html.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", s))).strip()


def page_text(h):
    t = re.search(r"<title[^>]*>(.*?)</title>", h, re.S | re.I)
    md = re.search(r'<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"\']*)', h, re.I)
    heads = re.findall(r"<h[1-3][^>]*>(.*?)</h[1-3]>", h, re.S | re.I)
    b = re.sub(r"<(script|style|noscript|svg)[^>]*>.*?</\1>", " ", h, flags=re.S | re.I)
    return {"title": strip(t.group(1)) if t else "", "meta": html.unescape(md.group(1)) if md else "",
            "heads": " | ".join(strip(x) for x in heads[:15])[:600], "body": strip(b)[:1800]}


def fetch_one(d):
    u, h = get(f"https://{d}")
    if not h:
        u, h = get(f"http://{d}")
    if not h:
        return {"id": d, "ok": False}
    rec = {"id": d, "ok": True, "home": page_text(h)}
    m = LINK.search(h)
    if m:
        link = m.group(1)
        if link.startswith("/"):
            link = re.match(r"https?://[^/]+", u).group(0) + link
        if link.startswith("http"):
            _, h2 = get(link)
            if h2:
                t2 = page_text(h2)
                rec["sub"] = {"url": link, "heads": t2["heads"], "body": t2["body"][:1200]}
    return rec


def read_jsonl(path):
    if not os.path.exists(path):
        return []
    with open(path, encoding="utf-8") as fh:
        return [json.loads(line) for line in fh if line.strip()]


def cmd_fetch(a):
    rows = list(csv.DictReader(open(a.input, encoding="utf-8")))
    for cond in a.where or []:
        col, _, val = cond.partition("=")
        rows = [r for r in rows if (r.get(col) or "").strip().lower() == val.strip().lower()]
    for col in a.where_blank or []:
        rows = [r for r in rows if not (r.get(col) or "").strip()]
    ids = list(dict.fromkeys(clean_domain(r.get(a.domain_col)) for r in rows if r.get(a.domain_col)))
    done = {r["id"] for r in read_jsonl(a.out)}
    todo = [d for d in ids if d not in done]
    print(f"site_reread fetch: {len(ids)} domains picked, {len(done)} already read, {len(todo)} to fetch", flush=True)
    os.makedirs(os.path.dirname(a.out) or ".", exist_ok=True)
    ok = 0
    with open(a.out, "a", encoding="utf-8") as f, cf.ThreadPoolExecutor(a.workers) as ex:
        for i, r in enumerate(ex.map(fetch_one, todo)):
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
            ok += r["ok"]
            if i % 250 == 0:
                f.flush()
                print(f"  {i}/{len(todo)}", flush=True)
    print(f"site_reread fetch: done, {ok}/{len(todo)} reachable this run", flush=True)
    return 0


def cmd_batch(a):
    sites = [s for s in read_jsonl(a.sites) if s.get("ok")]
    os.makedirs(a.out_dir, exist_ok=True)
    n = 0
    for i in range(0, len(sites), a.per_batch):
        blocks = []
        for s in sites[i:i + a.per_batch]:
            hm = s["home"]
            b = f"### {s['id']}\nTITLE: {hm['title']} | META: {hm['meta']}\nHEADS: {hm['heads']}\nBODY: {hm['body']}"
            if s.get("sub"):
                b += f"\nSUB ({s['sub']['url']}): {s['sub']['heads']} :: {s['sub']['body']}"
            blocks.append(b)
        with open(os.path.join(a.out_dir, f"r{n:03d}.txt"), "w", encoding="utf-8", newline="\n") as fh:
            fh.write("\n\n".join(blocks) + "\n")
        n += 1
    print(f"site_reread batch: {len(sites)} reachable sites in {n} batch file(s) of up to {a.per_batch}")
    return 0


def cmd_merge(a):
    sites = {s["id"]: s for s in read_jsonl(a.sites)}
    res, dup = {}, set()
    for f in sorted(glob.glob(os.path.join(a.results, "*.csv"))):
        for r in csv.DictReader(open(f, encoding="utf-8")):
            d = clean_domain(r.get("id"))
            if d in res:
                dup.add(d)
            res[d] = r
    expected = {d for d, s in sites.items() if s.get("ok")}
    missing = expected - set(res)
    rows = list(csv.DictReader(open(a.companies, encoding="utf-8")))
    stats = {"judged": 0, "unreachable": 0, "missing": 0, "not_reread": 0}
    for r in rows:
        d = clean_domain(r.get(a.domain_col))
        if d in res:
            r["reread_fit"], r["reread_variable"], r["reread_status"] = res[d].get("fit", ""), res[d].get("variable", ""), "judged"
        elif d in sites and not sites[d].get("ok"):
            r["reread_fit"], r["reread_variable"], r["reread_status"] = "", "", "unreachable"
        elif d in sites:
            r["reread_fit"], r["reread_variable"], r["reread_status"] = "", "", "missing"
        else:
            r["reread_fit"] = r["reread_variable"] = r["reread_status"] = ""
            stats["not_reread"] += 1
            continue
        stats[r["reread_status"]] += 1
    cols = list(rows[0].keys()) if rows else []
    with open(a.out, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=cols, lineterminator="\n")
        w.writeheader()
        w.writerows(rows)
    filled = sum(1 for r in rows if r.get("reread_status") == "judged" and (r.get("reread_variable") or "").strip()
                 and r["reread_variable"].strip() != "pr_hold")
    print(f"site_reread merge: {stats}; attribute filled by the re-read: {filled}; written {a.out}")
    if missing or dup:
        print(f"site_reread merge: COUNT CHECK FAILED, {len(missing)} reachable domain(s) missing from the "
              f"results, {len(dup)} duplicated. Rerun those batches before using the merge.", file=sys.stderr)
        return 3
    return 0


def main(argv=None):
    ap = argparse.ArgumentParser(description="Free site re-read for a missing company attribute (ruling attribute-reread).")
    sub = ap.add_subparsers(dest="cmd", required=True)
    f = sub.add_parser("fetch")
    f.add_argument("--in", dest="input", required=True)
    f.add_argument("--out", required=True)
    f.add_argument("--domain-col", default="company_domain")
    f.add_argument("--where", action="append")
    f.add_argument("--where-blank", action="append")
    f.add_argument("--workers", type=int, default=40)
    b = sub.add_parser("batch")
    b.add_argument("--sites", required=True)
    b.add_argument("--out-dir", required=True)
    b.add_argument("--per-batch", type=int, default=300)
    m = sub.add_parser("merge")
    m.add_argument("--companies", required=True)
    m.add_argument("--sites", required=True)
    m.add_argument("--results", required=True, help="folder of the sub-agents' CSVs (id,fit,variable)")
    m.add_argument("--out", required=True)
    m.add_argument("--domain-col", default="company_domain")
    a = ap.parse_args(argv)
    try:
        return {"fetch": cmd_fetch, "batch": cmd_batch, "merge": cmd_merge}[a.cmd](a)
    except (OSError, KeyError) as err:
        print(f"site_reread: {err}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
