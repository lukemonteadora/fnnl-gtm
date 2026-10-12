#!/usr/bin/env python3
"""list_send_merge.py: the last two steps between a verified list and the paused draft, promoted from the
2026-10-12 fnnl-agency expansion (build_send.py and build_topup.py) so every client runs the same code.

  send    Builds leads.send.csv from a list_qa.py output folder: every campaign-ready row (leads.verified.csv),
          plus catch-all holdback rows held ONLY for catch_all / headcount_borderline (ruling catch-all), plus review
          rows held ONLY for an ambiguous title when the title is plainly the owner (ruling review-owner-titles).
          Adds email_verdict (valid | catch_all), so a catch-all ships labelled.
            python list_send_merge.py send --dir <campaign folder> [--out leads.send.csv] [--group-col seg]
  dedupe  The final dedupe before upload. Drops a row when its email, email domain or company domain is on the
          sending platform's blocklist; its email or company is already in the workspace; it is in an exclusions
          file or suppression-list.csv; it is free mail; or it repeats an email. Ships only --ship-status rows
          (default valid,catch_all). Holds (never drops) an email whose domain does not match the company domain,
          except a subdomain or the same second-level label on another TLD (ruling finder-domain-mismatch).
            python list_send_merge.py dedupe --in leads.send.csv --out topup.csv --hold hold-domain-mismatch.csv
                   [--blocklist pv-blocklist.json] [--workspace-leads pv-leads.json] [--exclusions exclusions.json]
                   [--suppression suppression-list.csv] [--ship-status valid,catch_all] [--group-col seg]
          The blocklist and workspace files are JSON read live from the sending platform first (a list of
          {"value": ...} and a list of {"email": ...}). A missing optional file is reported, never assumed empty.

Both print a count summary. Neither caps people per company (ruling no-contacts-cap / people-depth).
Exit codes: 0 fine, 2 usage or input error.
"""
import argparse
import collections
import csv
import json
import os
import re
import sys

csv.field_size_limit(10**8)
FREE = {"gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com", "icloud.com", "me.com", "live.com",
        "msn.com", "protonmail.com", "googlemail.com", "ymail.com", "gmx.com", "mail.com", "zoho.com"}
OWN = re.compile(r"\b(founder|co-?founder|owner|ceo|chief executive|president|managing partner|founding partner)\b", re.I)
NOT_OWN = re.compile(r"\b(cto|coo|cpo|cfo|cio|cmo)\b|chief (technology|operating|product|financial|information|medical|"
                     r"strategy|customer|engagement officer)|emeritus|north america|americas|developer|operations", re.I)


def clean(d):
    return re.sub(r"^https?://(www\.)?", "", (d or "").strip().lower()).split("/")[0]


def read_csv(path):
    with open(path, newline="", encoding="utf-8") as fh:
        return list(csv.DictReader(fh))


def write_csv(path, cols, rows):
    with open(path, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=cols, extrasaction="ignore", lineterminator="\n")
        w.writeheader()
        w.writerows(rows)


def reasons(r):
    return {x for x in (r.get("qa_reasons") or "").split("|") if x}


def build_send(ready, holdback, review, group_col=None):
    s = collections.Counter(ready=len(ready))
    out = list(ready)
    for r in holdback:
        if reasons(r) - {"catch_all", "headcount_borderline"}:
            s["holdback_kept_out"] += 1
            continue
        out.append(r)
        s["catchall_added"] += 1
    for r in review:
        extra = reasons(r) - {"title_ambiguous", "catch_all", "headcount_borderline"}
        title = r.get("title") or ""
        if extra or not OWN.search(title) or NOT_OWN.search(title):
            s["review_kept_out"] += 1
            continue
        out.append(r)
        s["review_owner_added"] += 1
    for r in out:
        r["email_verdict"] = "catch_all" if r.get("email_status") == "catch_all" else "valid"
    s["send"] = len(out)
    s["catch_all_labelled"] = sum(r["email_verdict"] == "catch_all" for r in out)
    s["valid_on_catchall_domain"] = sum((r.get("is_catch_all") or "") == "true" for r in out)
    per_co = collections.Counter(clean(r.get("company_domain")) for r in out)
    s["companies"] = len(per_co)
    s["max_per_company"] = max(per_co.values()) if per_co else 0
    s["dup_emails"] = len(out) - len({(r.get("email") or "").lower() for r in out})
    if group_col:
        s.update(collections.Counter(f"{group_col}_{r.get(group_col, '')}" for r in out))
    return out, s


def domain_mismatch(ed, cd):
    if not cd or ed == cd or ed.endswith("." + cd) or cd.endswith("." + ed):
        return False
    return ed.split(".")[0] != cd.split(".")[0]   # advectus.us vs advectus.net is the same company


def dedupe(rows, blocklist, ws_emails, ws_domains, ex_emails, ex_domains, ship_status, group_col=None):
    s = collections.Counter(in_rows=len(rows))
    out, held, seen = [], [], set()
    for r in rows:
        st = (r.get("email_status") or "").strip()
        if st not in ship_status:
            s["not_shippable_" + (st or "blank")] += 1
            continue
        em = (r.get("email") or "").strip().lower()
        ed, cd = em.split("@")[-1], clean(r.get("company_domain"))
        why = None
        if em in blocklist or ed in blocklist or cd in blocklist:
            why = "blocklist"
        elif em in ws_emails:
            why = "in_workspace_email"
        elif cd in ws_domains or ed in ws_domains:
            why = "in_workspace_company"
        elif em in ex_emails or ed in ex_domains or cd in ex_domains:
            why = "exclusion_or_suppression"
        elif ed in FREE:
            why = "free_mail"
        elif em in seen:
            why = "dup_email"
        if why:
            s["drop_" + why] += 1
            continue
        seen.add(em)
        mism = domain_mismatch(ed, cd)
        r["domain_mismatch"] = "true" if mism else "false"
        if mism:
            held.append(r)
            s["hold_domain_mismatch"] += 1
            continue
        out.append(r)
    s["ship"] = len(out)
    s["companies"] = len({clean(r.get("company_domain")) for r in out})
    if group_col:
        s.update(collections.Counter(f"{group_col}_{r.get(group_col, '')}" for r in out))
    return out, held, s


def load_json(path, label, notes):
    if not path:
        notes.append(f"{label}: not given, not checked")
        return []
    if not os.path.exists(path):
        raise SystemExit(f"list_send_merge: {label} file not found: {path}")
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def cmd_send(a):
    d = a.dir
    ready = read_csv(os.path.join(d, "leads.verified.csv"))
    opt = lambda f: read_csv(os.path.join(d, f)) if os.path.exists(os.path.join(d, f)) else []
    out, s = build_send(ready, opt("leads.catchall-holdback.csv"), opt("leads.review.csv"), a.group_col)
    cols = list(ready[0].keys()) if ready else []
    if "email_verdict" not in cols:
        cols.append("email_verdict")
    write_csv(a.out or os.path.join(d, "leads.send.csv"), cols, out)
    print(json.dumps(dict(s), indent=1))
    return 0


def cmd_dedupe(a):
    notes = []
    bl = {(b.get("value") or "").strip().lower() for b in load_json(a.blocklist, "blocklist", notes)}
    ws = load_json(a.workspace_leads, "workspace leads", notes)
    ws_em = {(l.get("email") or "").lower() for l in ws if l.get("email")}
    ws_dom = {e.split("@")[-1] for e in ws_em} - FREE
    ex_dom, ex_em = set(), set()
    for path in a.exclusions or []:
        ex = load_json(path, "exclusions", notes)
        ex_dom |= {clean(x) for x in ex.get("domains", [])}
        ex_em |= {e.lower() for e in ex.get("emails", [])}
    if a.suppression:
        for r in read_csv(a.suppression):
            if r.get("company_domain"):
                ex_dom.add(clean(r["company_domain"]))
            if r.get("email"):
                ex_em.add(r["email"].lower())
    else:
        notes.append("suppression: not given, not checked")
    rows = read_csv(a.input)
    ship = {x.strip() for x in a.ship_status.split(",") if x.strip()}
    out, held, s = dedupe(rows, bl, ws_em, ws_dom, ex_em, ex_dom, ship, a.group_col)
    cols = (list(rows[0].keys()) if rows else []) + ["domain_mismatch"]
    cols = list(dict.fromkeys(cols))
    write_csv(a.out, cols, out)
    if a.hold:
        write_csv(a.hold, cols, held)
    print(json.dumps(dict(s), indent=1))
    for n in notes:
        print("NOTE " + n)
    return 0


def main(argv=None):
    ap = argparse.ArgumentParser(description="Send file and final dedupe before the paused draft.")
    sub = ap.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("send")
    s.add_argument("--dir", required=True)
    s.add_argument("--out")
    s.add_argument("--group-col")
    d = sub.add_parser("dedupe")
    d.add_argument("--in", dest="input", required=True)
    d.add_argument("--out", required=True)
    d.add_argument("--hold")
    d.add_argument("--blocklist")
    d.add_argument("--workspace-leads")
    d.add_argument("--exclusions", action="append")
    d.add_argument("--suppression")
    d.add_argument("--ship-status", default="valid,catch_all")
    d.add_argument("--group-col")
    a = ap.parse_args(argv)
    try:
        return cmd_send(a) if a.cmd == "send" else cmd_dedupe(a)
    except (OSError, KeyError, ValueError) as err:
        print(f"list_send_merge: {err}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
