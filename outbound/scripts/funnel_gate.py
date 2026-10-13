#!/usr/bin/env python3
"""funnel_gate.py: the volume gate. Counts every stage of a list build, writes funnel.md, and fails when the list
misses its target or any stage leaks more than its threshold (ruling volume-gate, operator 2026-10-12).

On the 2026-10-12 fnnl-agency wave the list shrank at four stages (excludes, agency attribute drops, 1 to 3 people
per company, a quiet verifier cap) and nothing counted the stages, so nobody saw it until the send file was small.
This runs in /phase-3-list step 7, before the upload. A failure becomes a note at checkpoint B with the stage
named, never a silent small list and never a hold on the upload (ruling volume-first).

INPUT  --counts  JSON with the stage counts for ONE campaign (or pass --set key=value, repeatable; --set wins):
         target                 leads the campaign plan asked for (from the wave plan / run_state)
         excludes_cut_share     combined market cut of the kept excludes, 0 to 1 (exclude_cost.py)
         companies_exported     companies in the GetLeads export (after the refined search)
         companies_fit          companies that passed company fit (after the attribute re-read)
         companies_with_people  companies where the people search found anyone (optional; else companies_fit)
         people_found           people found at the fit companies
         emails_found           people with an email from any finder rung
         emails_verified        emails the verifier passed (valid plus labelled catch_all)
         after_dedupe           rows left after dedupe and suppression
         after_qa               rows left after list QA (the send file)
       A stage left out is shown as "not counted" and its check is skipped, except target and after_qa, which are
       required.
OUTPUT --out    funnel.md (the table, each stage's share, the verdict, and every leak named)

THRESHOLDS (defaults; each has a flag):
  excludes cut over 10%  |  fit under 40% of exported  |  under 1.5 people per company
  emails found under 50% of people  |  verified under 60% of found  |  dedupe drops over 30%  |  QA drops over 25%

Exit codes: 0 pass, 2 usage or input error, 5 target missed or a stage leaked (note at checkpoint B, never a hold).
Plain counts in, Markdown out: no network, no spend.
"""
import argparse
import json
import sys

STAGES = ["companies_exported", "companies_fit", "companies_with_people", "people_found", "emails_found",
          "emails_verified", "after_dedupe", "after_qa"]


def ratio(num, den):
    if num is None or den in (None, 0):
        return None
    return num / den


def evaluate(c, th):
    """Return (checks, leaks, target_miss). checks: list of (name, value_text, limit_text, ok_or_None)."""
    checks = []

    def add(name, value, limit_text, bad, fmt="{:.0%}"):
        if value is None:
            checks.append((name, "not counted", limit_text, None))
            return
        checks.append((name, fmt.format(value), limit_text, not bad(value)))

    add("Excludes cut (market)", c.get("excludes_cut_share"), f"at most {th['max_exclude_cut']:.0%}",
        lambda v: v > th["max_exclude_cut"])
    add("Company fit rate", ratio(c.get("companies_fit"), c.get("companies_exported")),
        f"at least {th['min_fit']:.0%}", lambda v: v < th["min_fit"])
    per_co_den = c.get("companies_with_people") or c.get("companies_fit")
    add("People per company", ratio(c.get("people_found"), per_co_den), f"at least {th['min_people_per_co']}",
        lambda v: v < th["min_people_per_co"], fmt="{:.2f}")
    add("Emails found", ratio(c.get("emails_found"), c.get("people_found")), f"at least {th['min_found']:.0%}",
        lambda v: v < th["min_found"])
    add("Verified of found", ratio(c.get("emails_verified"), c.get("emails_found")),
        f"at least {th['min_verified']:.0%}", lambda v: v < th["min_verified"])
    dd = ratio(c.get("after_dedupe"), c.get("emails_verified"))
    add("Dedupe and suppression drops", None if dd is None else 1 - dd, f"at most {th['max_dedupe']:.0%}",
        lambda v: v > th["max_dedupe"])
    qa = ratio(c.get("after_qa"), c.get("after_dedupe"))
    add("QA drops", None if qa is None else 1 - qa, f"at most {th['max_qa']:.0%}", lambda v: v > th["max_qa"])
    leaks = [ch for ch in checks if ch[3] is False]
    target_miss = c["after_qa"] < c["target"]
    return checks, leaks, target_miss


def render(name, c, checks, leaks, target_miss):
    lines = [f"# Funnel: {name}", "",
             "What this is: every stage of the list build counted, so a shrinking list is caught before upload "
             "(ruling volume-gate). A FAIL is a note at checkpoint B, never a hold on the upload "
             "(ruling volume-first).", "",
             f"**Verdict: {'FAIL' if (leaks or target_miss) else 'PASS'}.** "
             f"{c['after_qa']} leads ship against a target of {c['target']}"
             f" ({c['after_qa'] / c['target']:.0%}).", "",
             "| Stage | Count |", "|---|---|"]
    for s in STAGES:
        v = c.get(s)
        lines.append(f"| {s} | {'not counted' if v is None else v} |")
    lines += ["", "| Check | Value | Limit | Result |", "|---|---|---|---|"]
    for n, v, lim, ok in checks:
        lines.append(f"| {n} | {v} | {lim} | {'skipped' if ok is None else ('ok' if ok else 'LEAK')} |")
    if target_miss or leaks:
        lines += ["", "## What to fix", ""]
        if target_miss:
            lines.append(f"- Target missed by {c['target'] - c['after_qa']} leads.")
        for n, v, lim, _ in leaks:
            lines.append(f"- {n} is {v} (limit {lim}). Find where this stage lost rows before uploading.")
    return "\n".join(lines) + "\n"


def main(argv=None):
    ap = argparse.ArgumentParser(description="Volume gate: count each list stage and fail on a leak (ruling volume-gate).")
    ap.add_argument("--counts", help="JSON file of stage counts for one campaign")
    ap.add_argument("--set", action="append", default=[], help="key=value, overrides --counts")
    ap.add_argument("--name", default="campaign")
    ap.add_argument("--out", required=True)
    ap.add_argument("--max-exclude-cut", type=float, default=0.10)
    ap.add_argument("--min-fit", type=float, default=0.40)
    ap.add_argument("--min-people-per-co", type=float, default=1.5)
    ap.add_argument("--min-found", type=float, default=0.50)
    ap.add_argument("--min-verified", type=float, default=0.60)
    ap.add_argument("--max-dedupe", type=float, default=0.30)
    ap.add_argument("--max-qa", type=float, default=0.25)
    a = ap.parse_args(argv)
    c = {}
    try:
        if a.counts:
            with open(a.counts, encoding="utf-8") as fh:
                c.update(json.load(fh))
        for kv in a.set:
            k, _, v = kv.partition("=")
            c[k.strip()] = float(v) if k.strip() == "excludes_cut_share" else int(v)
    except (OSError, ValueError) as err:
        print(f"funnel_gate: {err}", file=sys.stderr)
        return 2
    if not c.get("target") or c.get("after_qa") is None:
        print("funnel_gate: target (above 0) and after_qa are required", file=sys.stderr)
        return 2
    th = {k: getattr(a, k) for k in ("max_exclude_cut", "min_fit", "min_people_per_co", "min_found",
                                     "min_verified", "max_dedupe", "max_qa")}
    checks, leaks, miss = evaluate(c, th)
    with open(a.out, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(render(a.name, c, checks, leaks, miss))
    print(f"funnel_gate {a.name}: {c['after_qa']}/{c['target']} leads, {len(leaks)} leak(s)"
          f"{', target missed' if miss else ''}; wrote {a.out}")
    for n, v, lim, _ in leaks:
        print(f"  LEAK {n}: {v} (limit {lim})")
    return 5 if (leaks or miss) else 0


if __name__ == "__main__":
    sys.exit(main())
