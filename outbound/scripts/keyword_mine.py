#!/usr/bin/env python3
"""keyword_mine.py: mine the AI Ark company rollup for include/exclude keyword candidates.

This is step 5 of outbound/reference/ai-ark-people-discovery.md's sample loop: after a 200-row people sample has
been rolled up to one row per company (aiark_people.mjs sample) and scored good/maybe/bad by batched Claude
sub-agents, this script counts how many good companies and how many bad companies carry each AI Ark keyword tag,
industry and one-to-three-word description phrase, balanced for the size of each group, and writes the phrases
that clear the include or exclude bar. The reviewed candidates go back into the next round's search.json
(keyword.any.include / keyword.any.exclude / industries.any.exclude).

Ported from A-Sales outbound/scripts/research/discovery_keywords.py's `mine` command (the class-balanced n-gram
weighting and threshold logic only; its other commands and its A-Sales-only enrichment HTTP clients are not
ported). Adapted to FNNL's own CSV schema and output columns.

INPUT --companies: the aiark_people.mjs sample rollup. Required columns: company_domain, company_name,
    description, keywords, industries, location (keywords and industries are pipe-joined catalog values, e.g.
    "Roofing|Emergency Repair"; headcount and person_count are read if present but not used by the miner).
INPUT --verdicts: one row per company_domain scored by the fit pass. Required columns: company_domain, verdict
    (good | maybe | bad). A `maybe` company counts on neither side (ai-ark-people-discovery.md step 5's own
    ruling, verbatim: "maybe companies count on neither side") -- it is excluded from both the good and bad
    counts and from the group-size denominators used to balance them. A company with no verdict row, or a
    verdict outside good/maybe/bad, is treated the same way: skipped entirely.

PHRASE SOURCES (three, counted separately via the `source` output column):
  - keyword:   each pipe-joined value of the companies CSV's `keywords` column, counted as a whole phrase
               (AI Ark's own catalog tags are already meaningful units; they are not split into words).
  - industry:  each pipe-joined value of the `industries` column, counted as a whole phrase, same reasoning.
  - description: 1-3 word n-grams of the free-text `description` column, stopword-filtered, with every n-gram
               touching one of that company's OWN name/domain/city words dropped (self-word removal), so a
               company does not nominate its own name or home city as a buying signal.

THRESHOLDS (ai-ark-people-discovery.md step 5, defaults match it exactly):
  - an include candidate is carried by at least --min-good good companies, and at least --weight-bar of its
    class-balanced weight sits on the good side.
  - an exclude candidate is carried by at least --min-bad bad companies (or --min-bad-share of all bad
    companies, whichever is larger), and at least --weight-bar of its weight sits on the bad side.
  Weight is class-balanced so an unequal number of good vs. bad companies in the sample does not bias the count:
  rg = (good companies carrying the phrase) / (total good companies), rb = same for bad; weight_good_pct is
  rg / (rg + rb) as a percentage.

OUTPUT --out columns: phrase,source,good_n,bad_n,weight_good_pct,side (side is include or exclude; only
  qualifying phrases are written, same as A-Sales's `mine`, which only appends qualifying rows).

Exit codes: 0 success, 2 usage/input error (bad or missing CSV, bad flag value).
"""
import argparse
import csv
import io
import re
import sys
import unicodedata
from collections import Counter

STOP = set("""
a an and are as at be by for from has have in is it its of on or our the their this to we with you your
all also any can more most new not one over such than that these they those through up us very well will which who
""".split())

TOKEN = re.compile(r"[a-z0-9][a-z0-9\-]+", re.IGNORECASE)


class UsageError(Exception):
    pass


def fold(text):
    """Lowercase and strip diacritics, same normalization A-Sales's discovery_keywords.py used."""
    norm = unicodedata.normalize("NFKD", (text or "").lower())
    return "".join(ch for ch in norm if not unicodedata.combining(ch))


def tokens_of(text):
    return [t for t in TOKEN.findall(fold(text)) if not t.isdigit()]


def grams(text, banned):
    """1-3 word n-grams of text, dropping any n-gram whose first, last, or any token is a stopword or a
    self-word (banned). Mirrors A-Sales discovery_keywords.py's grams()/banned_for() pairing, operating here
    on the description field only (keyword tags and industries are counted as whole phrases, see module docs).
    """
    toks = tokens_of(text)
    out = set()
    for n in (1, 2, 3):
        for i in range(len(toks) - n + 1):
            gram_tokens = toks[i:i + n]
            if gram_tokens[0] in STOP or gram_tokens[-1] in STOP:
                continue
            if any(t in banned for t in gram_tokens):
                continue
            out.add(" ".join(gram_tokens))
    return out


def banned_words(company):
    """Self-words for one company: tokens from its own name, domain and location (city), length > 2.
    A short token like "co" or "tx" is left alone; it is too common to usefully ban.
    """
    words = set()
    for field in ("company_name", "company_domain", "location"):
        value = company.get(field) or ""
        for part in re.split(r"[.,/\\-]", value):
            words.update(tokens_of(part))
    return {w for w in words if len(w) > 2}


def pipe_values(raw):
    return {v.strip() for v in (raw or "").split("|") if v.strip()}


def read_csv_rows(path, label):
    try:
        with open(path, newline="", encoding="utf-8") as fh:
            return list(csv.DictReader(fh))
    except OSError as err:
        raise UsageError(f"cannot read {label}: {err}") from err


def write_csv_lf(path, fieldnames, rows):
    """Write bytes so Windows never inserts CRLF (files must stay LF-only)."""
    buf = io.StringIO()
    writer = csv.writer(buf, lineterminator="\n")
    writer.writerow(fieldnames)
    for row in rows:
        writer.writerow([row.get(f, "") for f in fieldnames])
    with open(path, "wb") as fh:
        fh.write(buf.getvalue().encode("utf-8"))


def mine(companies, verdicts, min_good, min_bad, min_bad_share, weight_bar):
    verdict_by_domain = {}
    for row in verdicts:
        domain = (row.get("company_domain") or "").strip().lower()
        verdict = (row.get("verdict") or "").strip().lower()
        if domain and verdict in ("good", "maybe", "bad"):
            verdict_by_domain[domain] = verdict

    # carried[(source, phrase)] = {"good": set(domains), "bad": set(domains)}
    carried = {}
    good_domains = set()
    bad_domains = set()
    maybe_skipped = 0
    unscored_skipped = 0

    def add(source, phrase, domain, cls):
        key = (source, phrase)
        entry = carried.setdefault(key, {"good": set(), "bad": set()})
        entry[cls].add(domain)

    for company in companies:
        domain = (company.get("company_domain") or "").strip().lower()
        if not domain:
            continue
        verdict = verdict_by_domain.get(domain)
        if verdict == "maybe":
            maybe_skipped += 1
            continue
        if verdict not in ("good", "bad"):
            unscored_skipped += 1
            continue
        if verdict == "good":
            good_domains.add(domain)
        else:
            bad_domains.add(domain)

        banned = banned_words(company)
        for kw in pipe_values(company.get("keywords")):
            add("keyword", fold(kw), domain, verdict)
        for industry in pipe_values(company.get("industries")):
            add("industry", fold(industry), domain, verdict)
        for phrase in grams(company.get("description"), banned):
            add("description", phrase, domain, verdict)

    ng_total = max(len(good_domains), 1)
    nb_total = max(len(bad_domains), 1)
    min_bad_needed = max(min_bad, round(min_bad_share * nb_total))

    out_rows = []
    for (source, phrase), counts in carried.items():
        ng = len(counts["good"])
        nb = len(counts["bad"])
        if ng == 0 and nb == 0:
            continue
        rg = ng / ng_total
        rb = nb / nb_total
        total = rg + rb
        weight_good = (rg / total) if total else 0.0

        side = None
        if ng >= min_good and weight_good >= weight_bar:
            side = "include"
        elif nb >= min_bad_needed and (1 - weight_good) >= weight_bar:
            side = "exclude"
        if side is None:
            continue

        out_rows.append({
            "phrase": phrase,
            "source": source,
            "good_n": ng,
            "bad_n": nb,
            "weight_good_pct": round(weight_good * 100, 1),
            "side": side,
        })

    out_rows.sort(key=lambda r: (r["side"], r["source"], -(r["good_n"] + r["bad_n"])))

    summary = {
        "good_companies": len(good_domains),
        "bad_companies": len(bad_domains),
        "maybe_skipped": maybe_skipped,
        "unscored_skipped": unscored_skipped,
        "include_candidates": sum(1 for r in out_rows if r["side"] == "include"),
        "exclude_candidates": sum(1 for r in out_rows if r["side"] == "exclude"),
        "min_bad_needed": min_bad_needed,
    }
    return out_rows, summary


def main(argv=None):
    ap = argparse.ArgumentParser(
        description="Mine include/exclude keyword candidates from a scored AI Ark company sample "
                    "(ai-ark-people-discovery.md step 5)."
    )
    ap.add_argument("--companies", required=True, help="aiark_people.mjs sample rollup CSV")
    ap.add_argument("--verdicts", required=True, help="per-company fit verdicts CSV (company_domain,verdict,...)")
    ap.add_argument("--out", required=True, help="candidates CSV to write")
    ap.add_argument("--min-good", type=int, default=3,
                     help="minimum good companies to qualify an include candidate (default 3)")
    ap.add_argument("--min-bad", type=int, default=3,
                     help="minimum bad companies to qualify an exclude candidate (default 3)")
    ap.add_argument("--min-bad-share", type=float, default=0.01,
                     help="or this share of all bad companies, whichever is larger (default 0.01)")
    ap.add_argument("--weight-bar", type=float, default=0.90,
                     help="minimum class-balanced weight share on the winning side (default 0.90)")
    args = ap.parse_args(argv)

    try:
        companies = read_csv_rows(args.companies, "--companies")
        verdicts = read_csv_rows(args.verdicts, "--verdicts")
        out_rows, summary = mine(
            companies, verdicts,
            min_good=args.min_good, min_bad=args.min_bad,
            min_bad_share=args.min_bad_share, weight_bar=args.weight_bar,
        )
        write_csv_lf(args.out, ["phrase", "source", "good_n", "bad_n", "weight_good_pct", "side"], out_rows)
    except UsageError as err:
        print(f"keyword_mine: {err}", file=sys.stderr)
        return 2

    print(f"keyword_mine: {summary['good_companies']} good, {summary['bad_companies']} bad companies scored "
          f"({summary['maybe_skipped']} maybe and {summary['unscored_skipped']} unscored skipped, counted on "
          f"neither side); {summary['include_candidates']} include and {summary['exclude_candidates']} exclude "
          f"candidate(s) written to {args.out} (exclude bar: >= {summary['min_bad_needed']} bad companies).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
