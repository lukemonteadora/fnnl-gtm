import csv
import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path

import yaml

SCRIPT_PATH = Path(__file__).resolve().parents[1] / "title_classify.py"
SPEC = importlib.util.spec_from_file_location("title_classify", SCRIPT_PATH)
tc = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
sys.modules["title_classify"] = tc
SPEC.loader.exec_module(tc)


def read_rows(path):
    with Path(path).open(encoding="utf-8", newline="") as fh:
        return list(csv.DictReader(fh))


def revops_spec(**overrides):
    spec = {
        "schema_version": 1,
        "status": "locked",
        "buyers": {
            "function_families": [
                {"id": "revops", "include_patterns": ["revenue operations", "sales operations", "go to market operations"]},
            ],
            "role_tiers": {
                "exact": [{"functions": ["revops"], "seniority": ["c_level", "vp", "head"]}],
                "strong": [{"functions": ["revops"], "seniority": ["director"]}],
                "influencer": [{"functions": ["revops"], "seniority": ["manager"]}],
            },
            "generic_executive": {"default_tier": "adjacent", "size_rules": [{"headcount_max": 50, "tier": "exact"}]},
            "explicit_titles": {"exact": ["Chief Revenue Officer"]},
            "title_exclusions": ["intern", "retired", "former", "medical director"],
            "authority_by_seniority": {"c_level": "ideal", "vp": "ideal", "head": "decision_capable",
                                       "director": "decision_capable", "manager": "influencer", "individual": "none"},
        },
    }
    spec["buyers"].update(overrides)
    return spec


class ClassifyTests(unittest.TestCase):
    def setUp(self):
        self.clf = tc.Classifier(revops_spec())

    def c(self, title, headcount=None):
        return self.clf.classify(title, headcount)

    def test_seniority_alone_never_passes(self):
        for title in ("Head of Engineering", "Director of Compliance", "CTO", "VP, Legal"):
            r = self.c(title)
            self.assertEqual(r["title_status"], "fail", title)
            self.assertEqual(r["title_role_tier"], "unrelated", title)
            self.assertTrue(r["title_rule"].startswith("non_target_function"), (title, r["title_rule"]))

    def test_target_function_and_seniority_map_to_tiers(self):
        self.assertEqual(self.c("VP Revenue Operations")["title_role_tier"], "exact")
        self.assertEqual(self.c("Head of RevOps")["title_role_tier"], "exact")
        self.assertEqual(self.c("Director, Sales Ops")["title_role_tier"], "strong")
        self.assertEqual(self.c("GTM Operations Manager")["title_role_tier"], "influencer")
        self.assertEqual(self.c("VP Revenue Operations")["title_buyer_priority"], "P1")

    def test_vice_president_is_not_president(self):
        r = self.c("Vice President, Sales Operations")
        self.assertEqual(r["title_seniority"], "vp")

    def test_below_seniority_fails_and_can_route_to_review(self):
        self.assertEqual(self.c("Revenue Operations Analyst")["title_rule"], "below_seniority")
        clf = tc.Classifier(revops_spec(below_seniority_action="review"))
        self.assertEqual(clf.classify("Revenue Operations Analyst")["title_status"], "ambiguous")

    def test_ambiguous_titles_go_to_review(self):
        for title in ("Chief Commercial Officer", "Growth Operations Lead", "Commercial Excellence Director"):
            self.assertEqual(self.c(title)["title_status"], "ambiguous", title)

    def test_explicit_title_wins(self):
        r = self.c("CRO")
        self.assertEqual((r["title_role_tier"], r["title_rule"]), ("exact", "explicit_title"))

    def test_generic_executive_tier_depends_on_size(self):
        self.assertEqual(self.c("CEO", 30)["title_role_tier"], "exact")
        self.assertEqual(self.c("President & CEO", 5000)["title_role_tier"], "adjacent")
        self.assertEqual(self.c("Founder and CEO")["title_rule"], "generic_executive")

    def test_status_exclusion_is_absolute_role_exclusion_is_not(self):
        self.assertEqual(self.c("Retired President and CEO")["title_role_tier"], "excluded")
        self.assertEqual(self.c("Revenue Operations Intern")["title_role_tier"], "excluded")
        mixed = self.c("CEO and Medical Director")
        self.assertEqual(mixed["title_status"], "ambiguous")
        self.assertTrue(mixed["title_rule"].startswith("exclusion_mixed_title"))
        self.assertEqual(self.c("Medical Director")["title_status"], "fail")

    def test_missing_title_is_unknown_not_fail(self):
        r = self.c("")
        self.assertEqual((r["title_status"], r["title_role_tier"]), ("missing", ""))

    def test_individual_contributor_without_target_function_fails(self):
        self.assertEqual(self.c("Account Executive")["title_rule"], "individual_no_target_function")

    def test_at_company_hint_is_captured(self):
        r = self.c("VP Revenue Operations at Beta Corp")
        self.assertEqual(r["title_at_company"], "Beta Corp")
        self.assertEqual(r["title_role_tier"], "exact")

    def test_acronym_override(self):
        base = self.c("CMO")
        self.assertEqual(base["title_normalized"], "chief marketing officer")
        clf = tc.Classifier(revops_spec(acronym_overrides={"cmo": "chief medical officer"}))
        self.assertEqual(clf.classify("CMO")["title_normalized"], "chief medical officer")

    def test_overlapping_builtin_non_target_is_dropped(self):
        spec = revops_spec(function_families=[{"id": "it", "include_patterns": ["information technology"]}],
                           role_tiers={"exact": [{"functions": ["it"], "seniority": ["vp", "c_level"]}]})
        clf = tc.Classifier(spec)
        self.assertEqual(clf.classify("VP of IT")["title_role_tier"], "exact")

    def test_administrator_is_not_assumed_junior(self):
        clf = tc.Classifier(revops_spec(function_families=[
            {"id": "ops", "include_patterns": ["practice administrator", "operations"]}],
            role_tiers={"strong": [{"functions": ["ops"], "seniority": ["head", "director"]}]}))
        self.assertEqual(clf.classify("Practice Administrator")["title_status"], "ambiguous")
        spec_with_level = revops_spec(function_families=[
            {"id": "ops", "include_patterns": ["practice administrator", "operations"]}],
            role_tiers={"strong": [{"functions": ["ops"], "seniority": ["head", "director"]}]},
            seniority_patterns={"head": ["administrator"]})
        self.assertEqual(tc.Classifier(spec_with_level).classify("Practice Administrator")["title_role_tier"], "strong")
        self.assertEqual(self.c("Systems Administrator")["title_status"], "fail")

    def test_owner_with_non_target_function_goes_to_review(self):
        r = self.c("Co-Owner/Therapist")
        self.assertEqual((r["title_status"], r["title_rule"]), ("ambiguous", "owner_with_non_target_function"))
        self.assertEqual(self.c("Founder and CTO")["title_status"], "ambiguous")
        self.assertEqual(self.c("CTO")["title_status"], "fail")

    def test_authority_tier(self):
        self.assertEqual(self.c("Director, Sales Operations")["title_authority_tier"], "decision_capable")


class SpecValidationTests(unittest.TestCase):
    def test_unknown_family_in_tier_rule(self):
        spec = revops_spec(role_tiers={"exact": [{"functions": ["nope"], "seniority": ["vp"]}]})
        with self.assertRaises(tc.SpecError):
            tc.Classifier(spec)

    def test_no_families(self):
        with self.assertRaises(tc.SpecError):
            tc.Classifier(revops_spec(function_families=[]))

    def test_draft_spec_refused_without_flag(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / "spec.yaml"
            s = revops_spec()
            s["status"] = "draft"
            p.write_text(yaml.safe_dump(s), encoding="utf-8")
            with self.assertRaises(tc.SpecError):
                tc.load_spec(p, allow_draft=False)
            self.assertEqual(tc.load_spec(p, allow_draft=True)["status"], "draft")


class FileFlowTests(unittest.TestCase):
    def test_classify_then_merge_ai(self):
        with tempfile.TemporaryDirectory() as d:
            d = Path(d)
            (d / "spec.yaml").write_text(yaml.safe_dump(revops_spec()), encoding="utf-8")
            with (d / "contacts.csv").open("w", newline="", encoding="utf-8") as fh:
                w = csv.writer(fh)
                w.writerow(["first_name", "company_domain", "job_title", "headcount"])
                w.writerow(["A", "a.com", "Chief Commercial Officer", "300"])
                w.writerow(["B", "b.com", "Chief Commercial Officer", "40"])
                w.writerow(["C", "c.com", "Head of Engineering", "300"])
                w.writerow(["D", "d.com", "VP Revenue Operations", "300"])
            rc = tc.main(["--spec", str(d / "spec.yaml"), "--contacts", str(d / "contacts.csv"),
                          "--out", str(d / "out.csv"), "--ambiguous-out", str(d / "amb.csv"),
                          "--report", str(d / "report.md"), "--emit-scoring-tiers"])
            self.assertEqual(rc, 0)
            amb = read_rows(d / "amb.csv")
            self.assertEqual(len(amb), 1)                     # two rows, one distinct title
            self.assertEqual(amb[0]["rows"], "2")
            rows = {r["first_name"]: r for r in read_rows(d / "out.csv")}
            self.assertEqual(rows["C"]["score_role_tier"], "unrelated")
            self.assertEqual(rows["A"]["score_role_tier"], "")      # ambiguous stays unknown evidence
            self.assertEqual(rows["D"]["score_role_tier"], "exact")

            with (d / "ai.csv").open("w", newline="", encoding="utf-8") as fh:
                w = csv.writer(fh)
                w.writerow(["title_normalized", "title_role_tier", "reason"])
                w.writerow(["chief commercial officer", "strong", "owns revenue strategy"])
            rc = tc.main(["--spec", str(d / "spec.yaml"), "--contacts", str(d / "out.csv"), "--merge-ai",
                          str(d / "ai.csv"), "--out", str(d / "merged.csv"), "--emit-scoring-tiers",
                          "--emit-explicit-titles", str(d / "explicit.yaml")])
            self.assertEqual(rc, 0)
            merged = {r["first_name"]: r for r in read_rows(d / "merged.csv")}
            self.assertEqual((merged["A"]["title_role_tier"], merged["A"]["title_classifier"]), ("strong", "ai"))
            self.assertEqual(merged["B"]["score_role_tier"], "strong")
            self.assertIn("chief commercial officer", (d / "explicit.yaml").read_text(encoding="utf-8"))

    def test_merge_rejects_invalid_tier(self):
        with tempfile.TemporaryDirectory() as d:
            d = Path(d)
            (d / "spec.yaml").write_text(yaml.safe_dump(revops_spec()), encoding="utf-8")
            (d / "c.csv").write_text("job_title\nChief Commercial Officer\n", encoding="utf-8")
            tc.main(["--spec", str(d / "spec.yaml"), "--contacts", str(d / "c.csv"), "--out", str(d / "o.csv")])
            (d / "ai.csv").write_text("title_normalized,title_role_tier\nchief commercial officer,great\n", encoding="utf-8")
            with self.assertRaises(SystemExit):
                tc.main(["--spec", str(d / "spec.yaml"), "--contacts", str(d / "o.csv"), "--merge-ai",
                         str(d / "ai.csv"), "--out", str(d / "m.csv")])


if __name__ == "__main__":
    unittest.main()
