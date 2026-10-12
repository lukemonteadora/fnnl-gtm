#!/usr/bin/env python3
"""exclude_cost.py: measure what each mined exclude keyword costs in good-fit volume, before the export.

Ruling exclude-guard (operator 2026-10-12, standing-rulings.md). On the 2026-10-12 fnnl-agency wave the mined
AI Ark excludes cut most of the good companies, and nothing measured that before the GetLeads export ran. This
script runs after keyword_mine.py (ai-ark-people-discovery.md Step 1) and before search-final.json is written.

Two measures per exclude (rows with side exclude or flagged in the keyword_mine candidates CSV):
  1. Sample cost (free, always): how many good, maybe and bad sample companies carry the exclude, so would be
     removed by it. good_share = good removed / all good companies in the sample.
  2. Market cost (0 credits, when --counts is given): the GetLeads count_contacts (or company count) of the
     refined search WITHOUT any excludes (--base-count) and WITH only this exclude added (count_with column).
     cut_share = (base - count_with) / base.

Decision per exclude:
  - drop   side was already `flagged` by keyword_mine (good-fit companies carry it), or good_share > --max-good-share
           (default 0.05), or cut_share > --max-cut-share (default 0.05) while any good sample company carries it.
  - keep   otherwise. A keep whose cut_share is over --max-cut-share with no good sample company carrying it is
           kept but marked big_cut_no_good_in_sample, so checkpoint A shows it.
Then the kept excludes together: combined good_share (sample) and, with --all-excludes-count, the combined
cut_share. Either over --max-total-share (default 0.10) exits 4: the exclude stack still costs too much and goes
to checkpoint A as a held item, never silently into the export.

INPUT  --companies   sample-r0-companies.csv (company_domain, keywords, industries; pipe-joined)
INPUT  --verdicts    fit-r0.csv (company_domain, verdict good|maybe|bad)
INPUT  --candidates  candidates-r0.csv from keyword_mine.py (phrase, source, side, ...)
INPUT  --counts      optional CSV phrase,source,count_with (GetLeads count with only that exclude added)
OUTPUT --out         exclude-cost.csv: phrase,source,good_removed,good_share,maybe_removed,bad_removed,
                     count_with,cut_share,decision,reason
OUTPUT --final       optional: the kept excludes only (phrase,source), the list search-final.json carries

Exit codes: 0 fine, 2 usage or input error, 4 the kept exclude stack still costs over --max-total-share.
Plain CSV in and out: no network, no spend. The GetLeads counts are read by the session (count_contacts, 0
credits) and passed in.
"""
import argparse
import csv
import io
import sys
import unicodedata


def fold(text):
    norm = unicodedata.normalize("NFKD", (text or "").lower())
    return "".join(ch for ch in norm if not unicodedata.combining(ch)).strip()


def pipe_values(raw):
    return {fold(v) for v in (raw or "").split("|") if v.strip()}


def read_rows(path, label):
    try:
        with open(path, newline="", encoding="utf-8") as fh:
            return list(csv.DictReader(fh))
    except OSError as err:
        raise SystemExit(f"exclude_cost: cannot read {label}: {err}")


def write_rows(path, fields, rows):
    buf = io.StringIO()
    w = csv.writer(buf, lineterminator="\n")
    w.writerow(fields)
    for r in rows:
        w.writerow([r.get(f, "") for f in fields])
    with open(path, "wb") as fh:
        fh.write(buf.getvalue().encode("utf-8"))


def carriers(companies, source):
    """domain -> set of folded phrases of that source (keyword tags or industries)."""
    col = "keywords" if source == "keyword" else "industries"
    return {(c.get("company_domain") or "").strip().lower(): pipe_values(c.get(col)) for c in companies}


def cost(companies, verdicts, candidates, counts, base_count, all_count,
         max_good_share=0.05, max_cut_share=0.05, max_total_share=0.10):
    verdict = {(v.get("company_domain") or "").strip().lower(): (v.get("verdict") or "").strip().lower()
               for v in verdicts}
    tags = {"keyword": carriers(companies, "keyword"), "industry": carriers(companies, "industry")}
    domains = [d for d in tags["keyword"] if d and verdict.get(d) in ("good", "maybe", "bad")]
    n_good = sum(verdict[d] == "good" for d in domains) or 1
    rows, kept, good_hit_by_kept = [], [], set()
    for c in candidates:
        side, source, phrase = c.get("side"), c.get("source"), fold(c.get("phrase"))
        if side not in ("exclude", "flagged") or source not in tags:
            continue  # description n-grams are never excludes (ruling keyword-mining)
        hit = [d for d in domains if phrase in tags[source].get(d, set())]
        g = [d for d in hit if verdict[d] == "good"]
        r = {"phrase": phrase, "source": source, "good_removed": len(g),
             "good_share": round(len(g) / n_good, 4),
             "maybe_removed": sum(verdict[d] == "maybe" for d in hit),
             "bad_removed": sum(verdict[d] == "bad" for d in hit)}
        cw = counts.get((phrase, source))
        cut = None
        if cw is not None and base_count:
            cut = max(base_count - cw, 0) / base_count
            r["count_with"], r["cut_share"] = cw, round(cut, 4)
        if side == "flagged":
            r["decision"], r["reason"] = "drop", "flagged_by_keyword_mine"
        elif r["good_share"] > max_good_share:
            r["decision"], r["reason"] = "drop", "good_share_over_cap"
        elif cut is not None and cut > max_cut_share and g:
            r["decision"], r["reason"] = "drop", "cut_share_over_cap_with_good_carriers"
        elif cut is not None and cut > max_cut_share:
            r["decision"], r["reason"] = "keep", "big_cut_no_good_in_sample"
        else:
            r["decision"], r["reason"] = "keep", ""
        if r["decision"] == "keep":
            kept.append(r)
            good_hit_by_kept.update(g)
        rows.append(r)
    summary = {"candidates": len(rows), "kept": len(kept), "dropped": len(rows) - len(kept),
               "good_in_sample": n_good,
               "combined_good_share": round(len(good_hit_by_kept) / n_good, 4)}
    if base_count and all_count is not None:
        summary["combined_cut_share"] = round(max(base_count - all_count, 0) / base_count, 4)
    over = summary["combined_good_share"] > max_total_share or summary.get("combined_cut_share", 0) > max_total_share
    summary["over_total_cap"] = over
    return rows, kept, summary


def main(argv=None):
    ap = argparse.ArgumentParser(description="Cost each mined exclude in good-fit volume (ruling exclude-guard).")
    ap.add_argument("--companies", required=True)
    ap.add_argument("--verdicts", required=True)
    ap.add_argument("--candidates", required=True)
    ap.add_argument("--counts", help="CSV phrase,source,count_with (GetLeads count with only this exclude)")
    ap.add_argument("--base-count", type=int, help="GetLeads count of the refined search with no excludes")
    ap.add_argument("--all-excludes-count", type=int, help="GetLeads count with every kept exclude added")
    ap.add_argument("--max-good-share", type=float, default=0.05)
    ap.add_argument("--max-cut-share", type=float, default=0.05)
    ap.add_argument("--max-total-share", type=float, default=0.10)
    ap.add_argument("--out", required=True)
    ap.add_argument("--final", help="write the kept excludes (phrase,source) here")
    a = ap.parse_args(argv)
    if a.counts and not a.base_count:
        print("exclude_cost: --counts needs --base-count (the count with no excludes)", file=sys.stderr)
        return 2
    counts = {}
    if a.counts:
        for r in read_rows(a.counts, "--counts"):
            try:
                counts[(fold(r["phrase"]), r["source"])] = int(r["count_with"])
            except (KeyError, ValueError):
                print(f"exclude_cost: bad --counts row {r}", file=sys.stderr)
                return 2
    rows, kept, s = cost(read_rows(a.companies, "--companies"), read_rows(a.verdicts, "--verdicts"),
                         read_rows(a.candidates, "--candidates"), counts, a.base_count, a.all_excludes_count,
                         a.max_good_share, a.max_cut_share, a.max_total_share)
    write_rows(a.out, ["phrase", "source", "good_removed", "good_share", "maybe_removed", "bad_removed",
                       "count_with", "cut_share", "decision", "reason"], rows)
    if a.final:
        write_rows(a.final, ["phrase", "source"], kept)
    print(f"exclude_cost: {s['candidates']} exclude(s) costed, {s['kept']} kept, {s['dropped']} dropped; "
          f"kept excludes together remove {s['combined_good_share']:.1%} of {s['good_in_sample']} good sample "
          f"companies" + (f", {s['combined_cut_share']:.1%} of the GetLeads count" if 'combined_cut_share' in s else
                          " (no --all-excludes-count, market cost of the stack not measured)") + ".")
    if s["over_total_cap"]:
        print(f"exclude_cost: HOLD the kept exclude stack costs over {a.max_total_share:.0%}; show it at "
              f"checkpoint A, do not run the export on it (ruling exclude-guard).", file=sys.stderr)
        return 4
    return 0


if __name__ == "__main__":
    sys.exit(main())
