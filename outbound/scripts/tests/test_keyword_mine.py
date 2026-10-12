"""Offline tests for keyword_mine.py.

Pure CSV in, CSV out: no network, no subprocess needed. Same import-by-path harness as
test_copy_var_gate.py and test_list_qa.py, so `mine()` can be called directly on small
synthetic company/verdict rows for fast, precise assertions, plus one CLI-level test of
`main()` for the file-writing and exit-code path.
Run: python -m unittest tests.test_keyword_mine
"""
import contextlib
import csv
import importlib.util
import io
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT_PATH = Path(__file__).resolve().parents[1] / "keyword_mine.py"
SPEC = importlib.util.spec_from_file_location("keyword_mine", SCRIPT_PATH)
km = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
sys.modules["keyword_mine"] = km
SPEC.loader.exec_module(km)


def company(domain, name="Acme Co", description="", keywords="", industries="", location="Dallas, TX"):
    return {
        "company_domain": domain,
        "company_name": name,
        "description": description,
        "keywords": keywords,
        "industries": industries,
        "headcount": "25",
        "location": location,
        "person_count": "4",
    }


def verdict(domain, v, reason="fit pass"):
    return {"company_domain": domain, "verdict": v, "reason": reason}


def find(rows, phrase, source):
    for r in rows:
        if r["phrase"] == phrase and r["source"] == source:
            return r
    return None


class MineTest(unittest.TestCase):
    def mine(self, companies, verdicts, **kw):
        defaults = {"min_good": 3, "min_bad": 3, "min_bad_share": 0.01, "weight_bar": 0.90}
        defaults.update(kw)
        return km.mine(companies, verdicts, **defaults)

    # ---- include candidate ----
    def test_include_candidate_qualifies_by_keyword(self):
        companies = [
            company("co1.com", keywords="Roofing"),
            company("co2.com", keywords="Roofing"),
            company("co3.com", keywords="Roofing"),
            company("co4.com", keywords="Painting"),
            company("co5.com", keywords="Painting"),
            company("cb1.com", keywords="Debt Collection"),
            company("cb2.com", keywords="Debt Collection"),
            company("cb3.com", keywords="Debt Collection"),
        ]
        verdicts = [verdict(f"co{i}.com", "good") for i in range(1, 6)] + \
                   [verdict(f"cb{i}.com", "bad") for i in range(1, 4)]
        rows, summary = self.mine(companies, verdicts)
        row = find(rows, "roofing", "keyword")
        self.assertIsNotNone(row, rows)
        self.assertEqual(row["good_n"], 3)
        self.assertEqual(row["bad_n"], 0)
        self.assertEqual(row["weight_good_pct"], 100.0)
        self.assertEqual(row["side"], "include")
        self.assertEqual(summary["good_companies"], 5)
        self.assertEqual(summary["bad_companies"], 3)

    # ---- exclude candidate ----
    def test_exclude_candidate_qualifies_by_industry(self):
        companies = [
            company("co1.com", industries="Construction"),
            company("co2.com", industries="Construction"),
            company("co3.com", industries="Construction"),
            company("co4.com", industries="Construction"),
            company("co5.com", industries="Construction"),
            company("cb1.com", industries="Debt Collection"),
            company("cb2.com", industries="Debt Collection"),
            company("cb3.com", industries="Debt Collection"),
        ]
        verdicts = [verdict(f"co{i}.com", "good") for i in range(1, 6)] + \
                   [verdict(f"cb{i}.com", "bad") for i in range(1, 4)]
        rows, _ = self.mine(companies, verdicts)
        row = find(rows, "debt collection", "industry")
        self.assertIsNotNone(row, rows)
        self.assertEqual(row["good_n"], 0)
        self.assertEqual(row["bad_n"], 3)
        self.assertEqual(row["weight_good_pct"], 0.0)
        self.assertEqual(row["side"], "exclude")
        # Construction is carried by all 5 good and 0 bad, so it also qualifies include;
        # the two phrases are independent (the test only requires debt collection's own row).
        self.assertIsNone(find(rows, "construction", "keyword"))  # it's an industry, not a keyword

    # ---- exclude guard (ruling exclude-guard, 2026-10-12) ----
    def test_exclude_carried_by_good_companies_is_flagged_not_used(self):
        # 2 of 50 good companies carry "agency": its balanced weight sits on the bad side (house flags,
        # weight bar 0.5), but it is over the guard (max 1 good), so it is flagged, never used as an exclude.
        companies = [company(f"co{i}.com", keywords="Marketing") for i in range(1, 51)]
        companies[0]["keywords"] = "Marketing|Agency"
        companies[1]["keywords"] = "Marketing|Agency"
        companies += [company(f"cb{i}.com", keywords="Agency") for i in range(1, 6)]
        companies += [company("cb9.com", keywords="Staffing"), company("cb8.com", keywords="Staffing")]
        verdicts = [verdict(f"co{i}.com", "good") for i in range(1, 51)] +                    [verdict(f"cb{i}.com", "bad") for i in (1, 2, 3, 4, 5, 8, 9)]
        rows, summary = self.mine(companies, verdicts, min_good=2, min_bad=2, min_bad_share=0, weight_bar=0.5)
        self.assertEqual(find(rows, "agency", "keyword")["side"], "flagged")
        self.assertEqual(find(rows, "staffing", "keyword")["side"], "exclude")
        self.assertEqual(summary["flagged_excludes"], 1)

    def test_exclude_guard_can_be_loosened(self):
        companies = [company(f"co{i}.com", keywords="Marketing") for i in range(1, 51)]
        companies[0]["keywords"] = "Marketing|Agency"
        companies += [company(f"cb{i}.com", keywords="Agency") for i in range(1, 6)]
        verdicts = [verdict(f"co{i}.com", "good") for i in range(1, 51)] +                    [verdict(f"cb{i}.com", "bad") for i in range(1, 6)]
        rows, _ = self.mine(companies, verdicts, min_good=2, min_bad=2, min_bad_share=0, weight_bar=0.5)
        self.assertEqual(find(rows, "agency", "keyword")["side"], "exclude")  # 1 good is inside the default guard

    # ---- below min-support: not output even at 100% weight ----
    def test_phrase_below_min_good_support_is_excluded(self):
        companies = [
            company("co1.com", keywords="Niche Thing"),
            company("co2.com", keywords="Niche Thing"),
            company("co3.com"),
            company("co4.com"),
            company("co5.com"),
            company("cb1.com"), company("cb2.com"), company("cb3.com"),
        ]
        verdicts = [verdict(f"co{i}.com", "good") for i in range(1, 6)] + \
                   [verdict(f"cb{i}.com", "bad") for i in range(1, 4)]
        rows, _ = self.mine(companies, verdicts)
        self.assertIsNone(find(rows, "niche thing", "keyword"),
                           "carried by only 2 good companies (below min_good=3); must not qualify")

    # ---- weight-bar failure: meets both support counts, fails the weight split ----
    def test_phrase_failing_weight_bar_on_both_sides_is_excluded(self):
        companies = [
            company(f"co{i}.com", keywords="Mixed Signal") for i in range(1, 5)
        ] + [
            company("co5.com"),
            company("cb1.com", keywords="Mixed Signal"),
            company("cb2.com", keywords="Mixed Signal"),
            company("cb3.com", keywords="Mixed Signal"),
        ]
        verdicts = [verdict(f"co{i}.com", "good") for i in range(1, 6)] + \
                   [verdict(f"cb{i}.com", "bad") for i in range(1, 4)]
        rows, _ = self.mine(companies, verdicts)
        self.assertIsNone(find(rows, "mixed signal", "keyword"),
                           "ng=4>=3 and nb=3>=3 both meet support, but weight_good~=0.44 clears neither bar")

    # ---- maybe counts on neither side ----
    def test_maybe_companies_count_on_neither_side(self):
        companies = [
            company("co1.com", keywords="Common Good"),
            company("co2.com", keywords="Common Good"),
            company("co3.com", keywords="Common Good"),
            company("cb1.com"), company("cb2.com"), company("cb3.com"),
            company("cm1.com", keywords="Common Good|Maybe Only"),
            company("cm2.com", keywords="Common Good|Maybe Only"),
        ]
        verdicts = [verdict(f"co{i}.com", "good") for i in range(1, 4)] + \
                   [verdict(f"cb{i}.com", "bad") for i in range(1, 4)] + \
                   [verdict("cm1.com", "maybe"), verdict("cm2.com", "maybe")]
        rows, summary = self.mine(companies, verdicts)

        # A phrase carried only by maybe companies must never appear (it carries on neither side).
        self.assertIsNone(find(rows, "maybe only", "keyword"))

        # The maybe companies' extra "Common Good" tags must not inflate the good denominator or
        # the good carrier count: still exactly the 3 real good companies, not 5.
        common = find(rows, "common good", "keyword")
        self.assertIsNotNone(common)
        self.assertEqual(common["good_n"], 3)
        self.assertEqual(common["weight_good_pct"], 100.0)
        self.assertEqual(summary["good_companies"], 3)
        self.assertEqual(summary["bad_companies"], 3)
        self.assertEqual(summary["maybe_skipped"], 2)

    # ---- self-word removal ----
    def test_self_word_removal_drops_a_companys_own_city(self):
        companies = [
            company("co1.com", name="Acme Services", location="Austin, TX",
                    description="serving austin commercial roofing customers every week"),
            company("co2.com", name="Zenith Services", location="Austin, TX",
                    description="serving austin commercial roofing customers every week"),
            company("co3.com", name="Lonestar Services", location="Austin, TX",
                    description="serving austin commercial roofing customers every week"),
            company("cb1.com", name="Delta Group", location="Reno, NV",
                    description="debt collection calls all day long"),
            company("cb2.com", name="Omega Group", location="Reno, NV",
                    description="debt collection calls all day long"),
            company("cb3.com", name="Vector Group", location="Reno, NV",
                    description="debt collection calls all day long"),
        ]
        verdicts = [verdict(f"co{i}.com", "good") for i in range(1, 4)] + \
                   [verdict(f"cb{i}.com", "bad") for i in range(1, 4)]
        rows, _ = self.mine(companies, verdicts)
        # Without self-word removal "austin" would be carried by all 3 good companies at 100%
        # weight and wrongly qualify as an include candidate. Each company bans its own location
        # word, so "austin" is never counted at all.
        self.assertIsNone(find(rows, "austin", "description"))
        # A shared, non-self word in the same sentences is free to qualify normally.
        self.assertIsNotNone(find(rows, "commercial roofing", "description"))

    # ---- keyword/industry values are whole phrases, never sub-n-grammed ----
    def test_keyword_and_industry_values_are_whole_phrases(self):
        companies = [company(f"co{i}.com", keywords="Emergency Repair") for i in range(1, 4)] + \
                    [company(f"cb{i}.com") for i in range(1, 4)]
        verdicts = [verdict(f"co{i}.com", "good") for i in range(1, 4)] + \
                   [verdict(f"cb{i}.com", "bad") for i in range(1, 4)]
        rows, _ = self.mine(companies, verdicts)
        self.assertIsNotNone(find(rows, "emergency repair", "keyword"))
        self.assertIsNone(find(rows, "emergency", "keyword"),
                           "keyword values must not be split into sub n-grams")
        self.assertIsNone(find(rows, "repair", "keyword"))


class MineCliTest(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp(prefix="kmtest-"))

    def write_csv(self, name, fieldnames, rows):
        path = self.tmp / name
        with path.open("w", newline="", encoding="utf-8") as fh:
            writer = csv.DictWriter(fh, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)
        return path

    def test_cli_writes_lf_only_csv_and_reports_counts(self):
        companies_path = self.write_csv(
            "companies.csv",
            ["company_domain", "company_name", "description", "keywords", "industries", "headcount",
             "location", "person_count"],
            [company(f"co{i}.com", keywords="Roofing") for i in range(1, 4)] +
            [company(f"cb{i}.com", keywords="Debt Collection") for i in range(1, 4)],
        )
        verdicts_path = self.write_csv(
            "verdicts.csv", ["company_domain", "verdict", "reason"],
            [verdict(f"co{i}.com", "good") for i in range(1, 4)] +
            [verdict(f"cb{i}.com", "bad") for i in range(1, 4)],
        )
        out_path = self.tmp / "candidates.csv"

        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            rc = km.main(["--companies", str(companies_path), "--verdicts", str(verdicts_path),
                          "--out", str(out_path)])
        self.assertEqual(rc, 0, buf.getvalue())
        self.assertIn("include", buf.getvalue())

        raw = out_path.read_bytes()
        self.assertNotIn(b"\r", raw, "output must be LF-only, never CRLF")
        with out_path.open(encoding="utf-8", newline="") as fh:
            rows = list(csv.DictReader(fh))
        self.assertTrue(any(r["phrase"] == "roofing" and r["side"] == "include" for r in rows))
        self.assertTrue(any(r["phrase"] == "debt collection" and r["side"] == "exclude" for r in rows))

    def test_missing_companies_file_is_a_usage_error(self):
        verdicts_path = self.write_csv("verdicts.csv", ["company_domain", "verdict", "reason"], [])
        buf = io.StringIO()
        with contextlib.redirect_stderr(buf):
            rc = km.main(["--companies", str(self.tmp / "nope.csv"), "--verdicts", str(verdicts_path),
                          "--out", str(self.tmp / "out.csv")])
        self.assertEqual(rc, 2, buf.getvalue())


if __name__ == "__main__":
    unittest.main()
