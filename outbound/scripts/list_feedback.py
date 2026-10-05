#!/usr/bin/env python3
"""Campaign results -> list provenance feedback (list-production-standard.md section 15).

Joins a live campaign's outcomes back to each lead's provenance on the
campaign's leads.verified.csv (buyer tier, function family, seniority, company
size band, email source, source arm, wave slot) and reports, per group:
leads, bounces, replies, positive replies and time-agreed replies.

It writes recommendations, never edits: a provider whose emails bounce above
the ceiling is a candidate to demote in the email order (owned by the stack
contract, mirrored in provider-routing.yaml); a buyer tier or function with
sends and no positives is a candidate to move in the targeting spec. The
operator (or the weekly rhythm, as proposals in its digest) decides and logs
the change.

Inputs (tolerant of column names):
  --leads-export   the sending platform's lead export for the campaign
                   (run_state.sending_platform): an email column plus a status
                   column (status, lead_status or state) and/or bounced,
                   is_bounced, replied, replies or reply_count columns.
  --replies        classified first replies (email, plus a classification,
                   label or category column holding a class from
                   outbound/reference/reply-scoring-core.md, optional
                   time_agreed). Classified by the reply-scoring skill for the
                   locked sending platform if /stack-setup activated a pack that
                   provides one, otherwise straight from that platform's reply
                   export using reply-scoring-core.md.

UNVERIFIED: the current sending platform's export (PlusVibe in the stack
contract today) has not been read live, because that slot is `chosen`, not
`live`. Its column names and its status and bounce values are unknown. A status
counts as bounced when it contains "bounce" and as unsubscribed when it
contains "unsubscrib"; confirm both on the first real export. When no status,
bounce or reply column is recognized, the report says so at the top instead of
showing a clean 0% bounce rate.

Usage:
  python list_feedback.py --dir <campaignDir> --leads-export leads_export.csv \
      [--replies replies_scored.csv] [--min-sends 1000] [--bounce-ceiling 0.03]

No network calls, no spend.
"""

from __future__ import annotations

import argparse
import sys
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from list_common import norm_email, read_csv, truthy, write_csv  # noqa: E402

# Classes from outbound/reference/reply-scoring-core.md. Its positive bucket is
# these three; ooo and bounce are not replies and leave every denominator.
# out_of_office, auto_reply and automated_reply are tolerated aliases.
# wrong_person is not a reply-scoring-core class: it is counted only when a
# classifier emits it (the weekly rhythm's reply check names it).
POSITIVE = {"positive_interested", "positive_soft", "positive_referral"}
NOT_A_REPLY = {"ooo", "out_of_office", "bounce", "auto_reply", "automated_reply"}
STATUS_COLUMNS = {"status", "lead_status", "state"}
OUTCOME_COLUMNS = {"bounced", "is_bounced", "replied", "replies", "reply_count"}
GROUP_DIMENSIONS = [
    ("buyer tier", ["title_buyer_priority", "title_role_tier", "score_role_tier"]),
    ("function family", ["title_functions", "contact_function"]),
    ("seniority", ["title_seniority", "contact_seniority"]),
    ("company size band", ["headcount_band", "headcount_range", "co_headcount_range"]),
    ("email source", ["email_source"]),
    ("source arm", ["source_arm", "source"]),
    ("wave slot", ["wave_slot"]),
    ("country", ["country_norm", "location_country"]),
]


def pick(row: dict[str, str], cols: list[str]) -> str:
    for c in cols:
        v = (row.get(c) or "").strip()
        if v:
            return v
    return "(blank)"


def email_col(header: list[str]) -> str:
    for c in ("email", "Email", "email_address", "lead_email", "work_email"):
        if c in header:
            return c
    for c in header:
        if "email" in c.lower():
            return c
    raise SystemExit("no email column in " + ", ".join(header[:12]))


def recognized_outcome_columns(header: list[str]) -> list[str]:
    return [c for c in header if c.lower() in STATUS_COLUMNS or c in OUTCOME_COLUMNS]


def load_outcomes(export_path: str, replies_path: str | None) -> dict[str, dict[str, bool]]:
    out: dict[str, dict[str, bool]] = {}
    header, rows = read_csv(export_path)
    ec = email_col(header)
    for r in rows:
        e = norm_email(r.get(ec))
        if not e:
            continue
        status = " ".join(str(r.get(c, "")) for c in header if c.lower() in STATUS_COLUMNS).lower()
        bounced = "bounce" in status or truthy(r.get("bounced")) or truthy(r.get("is_bounced"))
        replied = truthy(r.get("replied")) or _int(r.get("replies")) > 0 or _int(r.get("reply_count")) > 0
        out[e] = {"sent": True, "bounced": bounced, "replied": replied, "positive": False,
                  "time_agreed": False, "unsubscribed": "unsubscrib" in status, "wrong_person": False}
    if replies_path:
        header, rows = read_csv(replies_path)
        ec = email_col(header)
        for r in rows:
            e = norm_email(r.get(ec))
            if not e:
                continue
            o = out.setdefault(e, {"sent": True, "bounced": False, "replied": False, "positive": False,
                                   "time_agreed": False, "unsubscribed": False, "wrong_person": False})
            cls = (r.get("classification") or r.get("label") or r.get("category") or "").strip().lower()
            if cls == "bounce":
                o["bounced"] = True
            elif cls and cls not in NOT_A_REPLY:
                o["replied"] = True
            if cls in POSITIVE:
                o["positive"] = True
            if cls == "wrong_person":
                o["wrong_person"] = True
            if cls == "unsubscribe":
                o["unsubscribed"] = True
            if truthy(r.get("time_agreed")):
                o["time_agreed"] = True
    return out


def _int(v: str | None) -> int:
    try:
        return int(float(str(v).strip()))
    except (TypeError, ValueError):
        return 0


def rate(a: int, b: int) -> str:
    return f"{a / b:.1%}" if b else "n/a"


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--dir", required=True)
    ap.add_argument("--leads", help="default <dir>/leads.verified.csv")
    ap.add_argument("--leads-export", required=True,
                    help="the sending platform's lead export for the campaign (column names UNVERIFIED for the "
                         "current platform)")
    ap.add_argument("--replies", help="first replies classified with reply-scoring-core.md classes")
    ap.add_argument("--min-sends", type=int, default=1000,
                     help="smallest group that earns a recommendation (aaron-flow.md section 13: an arm is "
                          "read at about 1,000 prospects or sends)")
    ap.add_argument("--bounce-ceiling", type=float, default=0.03)
    ap.add_argument("--out", help="default <dir>/list-feedback-report.md")
    args = ap.parse_args(argv)

    d = Path(args.dir)
    _, leads = read_csv(args.leads or d / "leads.verified.csv")
    outcomes = load_outcomes(args.leads_export, args.replies)
    export_header, _ = read_csv(args.leads_export)
    unmeasured = not recognized_outcome_columns(export_header)
    if unmeasured:
        print("warning: the leads export has no status, bounced or replied column this script recognizes; "
              "bounces are not measured (the export's columns are unverified for the current sending platform)",
              file=sys.stderr)

    joined = []
    for r in leads:
        o = outcomes.get(norm_email(r.get("email")))
        if o and o["sent"]:
            joined.append((r, o))
    if not joined:
        print("no campaign lead matched the export by email; nothing to report", file=sys.stderr)
        return 2

    def tally(items):
        t = defaultdict(int)
        for _, o in items:
            t["leads"] += 1
            for k in ("bounced", "replied", "positive", "time_agreed", "wrong_person", "unsubscribed"):
                t[k] += int(o[k])
        return t

    total = tally(joined)
    overall_pos = total["positive"] / total["leads"]
    table_rows, lines, recs = [], [], []
    lines += ["# List feedback report", ""]
    if unmeasured:
        measured = ("count only what --replies classified, not the platform's own bounce records" if args.replies
                    else "read 0% because nothing was measured (no --replies file either), not because nothing "
                         "bounced")
        lines += ["**Warning: the leads export carries no outcome columns.** It has no status, bounced or replied "
                  "column this script recognizes (columns: " + ", ".join(export_header[:12]) + "). The bounce and "
                  f"reply rates below {measured}. The sending platform's export columns are unverified: map its "
                  "status column and re-run before acting on any bounce figure.", ""]
    lines += [f"What this is: the live results of this campaign's {total['leads']} sent leads, broken down by where each lead came from and who they are, so targeting and provider routing learn from real outcomes. Nothing here changes a file; the recommendations are for the operator or the weekly rhythm to accept and log.", "",
              f"Overall: {total['leads']} leads, bounce {rate(total['bounced'], total['leads'])}, reply {rate(total['replied'], total['leads'])}, positive {rate(total['positive'], total['leads'])}, time-agreed {total['time_agreed']}, wrong person {total['wrong_person']}.", ""]
    for label, cols in GROUP_DIMENSIONS:
        groups: dict[str, list] = defaultdict(list)
        for r, o in joined:
            groups[pick(r, cols)].append((r, o))
        if len(groups) == 1 and "(blank)" in groups:
            continue
        lines += [f"## By {label}", "", "| Group | Leads | Bounce | Reply | Positive | Time-agreed | Wrong person |", "|---|---:|---:|---:|---:|---:|---:|"]
        for g, items in sorted(groups.items(), key=lambda kv: -len(kv[1])):
            t = tally(items)
            lines.append(f"| {g} | {t['leads']} | {rate(t['bounced'], t['leads'])} | {rate(t['replied'], t['leads'])} | {rate(t['positive'], t['leads'])} | {t['time_agreed']} | {t['wrong_person']} |")
            table_rows.append({"dimension": label, "group": g, **{k: t[k] for k in ("leads", "bounced", "replied", "positive", "time_agreed", "wrong_person", "unsubscribed")}})
            if t["leads"] < args.min_sends or g == "(blank)":
                continue
            if label == "email source" and t["bounced"] / t["leads"] > args.bounce_ceiling:
                recs.append(f"Email source **{g}** bounced {rate(t['bounced'], t['leads'])} on {t['leads']} sends, above the {args.bounce_ceiling:.0%} ceiling. Candidate to demote in the stack contract's email order (`lead_data.contact_enrichment.notes`, which owns it) and its mirror, provider-routing.yaml `layers.email.order` (cite this report as the evidence), and diagnose the bounces from real DSN reasons first.")
            if label in ("buyer tier", "function family", "seniority") and overall_pos > 0 and t["positive"] == 0:
                recs.append(f"{label.capitalize()} **{g}** has {t['leads']} sends and no positive reply while the campaign's positive rate is {overall_pos:.1%}. Candidate to move down a tier or out of the targeting spec (log it in the spec's `changes`).")
            if label in ("buyer tier", "function family", "seniority", "company size band") and overall_pos > 0 and t["positive"] / t["leads"] >= 2 * overall_pos:
                recs.append(f"{label.capitalize()} **{g}** converts at {rate(t['positive'], t['leads'])}, at least twice the campaign rate. Candidate to promote in the targeting spec and to widen in the next build.")
            if t["wrong_person"] >= 3:
                recs.append(f"{label.capitalize()} **{g}** drew {t['wrong_person']} wrong-person replies. Check the title rules or the provider's current-employer data for that group.")
        lines.append("")
    lines += ["## Recommendations", ""] + ([f"- {r}" for r in recs] or [f"- None yet. Groups under {args.min_sends} sends are reported but not judged."])
    out = Path(args.out) if args.out else d / "list-feedback-report.md"
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    write_csv(d / "list-feedback.csv", ["dimension", "group", "leads", "bounced", "replied", "positive", "time_agreed", "wrong_person", "unsubscribed"], table_rows)
    print(f"joined {total['leads']} sent leads; {len(recs)} recommendations; wrote {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
