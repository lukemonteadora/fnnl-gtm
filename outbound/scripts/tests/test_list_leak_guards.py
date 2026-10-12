"""Offline tests for the 2026-10-12 list-leak guards: exclude_cost.py, funnel_gate.py, list_send_merge.py and the
offline parts of site_reread.py (batch and merge; fetch needs the network and is not run here).

Same import-by-path harness as test_keyword_mine.py. No network, no spend.
Run: python -m unittest tests.test_list_leak_guards
"""
import contextlib
import csv
import importlib.util
import io
import json
import sys
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parents[1]


def load(name):
    spec = importlib.util.spec_from_file_location(name, HERE / f"{name}.py")
    mod = importlib.util.module_from_spec(spec)
    sys.modules[name] = mod
    spec.loader.exec_module(mod)
    return mod


ec = load("exclude_cost")
fg = load("funnel_gate")
lsm = load("list_send_merge")
sr = load("site_reread")


def write_csv(path, cols, rows):
    with open(path, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=cols, lineterminator="\n")
        w.writeheader()
        w.writerows(rows)


def quiet(fn, *a):
    with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
        return fn(*a)


class ExcludeCostTest(unittest.TestCase):
    def setUp(self):
        # 20 good companies; "staffing" sits on 2 good (10%), "crypto" on none, "events" on 1 good (5%).
        self.companies, self.verdicts = [], []
        for i in range(20):
            kw = "saas"
            if i < 2:
                kw += "|staffing"
            if i == 2:
                kw += "|events"
            self.companies.append({"company_domain": f"g{i}.com", "keywords": kw, "industries": "software"})
            self.verdicts.append({"company_domain": f"g{i}.com", "verdict": "good"})
        for i in range(10):
            self.companies.append({"company_domain": f"b{i}.com", "keywords": "crypto|staffing|events", "industries": "finance"})
            self.verdicts.append({"company_domain": f"b{i}.com", "verdict": "bad"})
        self.cands = [{"phrase": p, "source": "keyword", "side": "exclude"} for p in ("staffing", "crypto", "events")]

    def test_sample_cost_drops_an_exclude_good_companies_carry(self):
        rows, kept, s = ec.cost(self.companies, self.verdicts, self.cands, {}, None, None)
        d = {r["phrase"]: r for r in rows}
        self.assertEqual((d["staffing"]["decision"], d["staffing"]["reason"]), ("drop", "good_share_over_cap"))
        self.assertEqual(d["crypto"]["decision"], "keep")
        self.assertEqual(d["events"]["decision"], "keep")            # 5% is at the cap, not over it
        self.assertEqual(s["combined_good_share"], 0.05)
        self.assertFalse(s["over_total_cap"])

    def test_market_cut_drops_an_exclude_with_good_carriers_and_marks_one_without(self):
        counts = {("events", "keyword"): 800, ("crypto", "keyword"): 850}
        rows, kept, s = ec.cost(self.companies, self.verdicts, self.cands, counts, 1000, 990)
        d = {r["phrase"]: r for r in rows}
        self.assertEqual(d["events"]["reason"], "cut_share_over_cap_with_good_carriers")
        self.assertEqual((d["crypto"]["decision"], d["crypto"]["reason"]), ("keep", "big_cut_no_good_in_sample"))
        self.assertEqual(s["combined_cut_share"], 0.01)

    def test_flagged_by_keyword_mine_is_dropped_and_description_ngrams_skipped(self):
        cands = [{"phrase": "crypto", "source": "keyword", "side": "flagged"},
                 {"phrase": "crypto", "source": "description", "side": "exclude"}]
        rows, kept, s = ec.cost(self.companies, self.verdicts, cands, {}, None, None)
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["reason"], "flagged_by_keyword_mine")

    def test_cli_exits_4_when_the_kept_stack_costs_too_much(self):
        with tempfile.TemporaryDirectory() as t:
            t = Path(t)
            write_csv(t / "c.csv", ["company_domain", "keywords", "industries"], self.companies)
            write_csv(t / "v.csv", ["company_domain", "verdict"], self.verdicts)
            write_csv(t / "k.csv", ["phrase", "source", "side"], self.cands)
            args = ["--companies", str(t / "c.csv"), "--verdicts", str(t / "v.csv"), "--candidates", str(t / "k.csv"),
                    "--out", str(t / "o.csv"), "--final", str(t / "f.csv")]
            self.assertEqual(quiet(ec.main, args), 0)
            self.assertEqual(quiet(ec.main, args + ["--base-count", "1000", "--all-excludes-count", "850"]), 4)
            self.assertEqual(quiet(ec.main, args + ["--counts", str(t / "k.csv")]), 2)   # counts without a base


class FunnelGateTest(unittest.TestCase):
    TH = {"max_exclude_cut": 0.10, "min_fit": 0.40, "min_people_per_co": 1.5, "min_found": 0.50,
          "min_verified": 0.60, "max_dedupe": 0.30, "max_qa": 0.25}
    HEALTHY = {"target": 1000, "excludes_cut_share": 0.05, "companies_exported": 1000, "companies_fit": 600,
               "people_found": 1200, "emails_found": 900, "emails_verified": 700, "after_dedupe": 650, "after_qa": 600}

    def test_healthy_funnel_passes_checks(self):
        checks, leaks, miss = fg.evaluate(dict(self.HEALTHY), self.TH)
        self.assertEqual(leaks, [])
        self.assertTrue(miss)                                          # 600 of 1000 is still a target miss

    def test_each_leak_is_named(self):
        c = dict(self.HEALTHY, excludes_cut_share=0.4, people_found=700, emails_found=300, emails_verified=150,
                 after_dedupe=150, after_qa=150, target=100)
        checks, leaks, miss = fg.evaluate(c, self.TH)
        names = {l[0] for l in leaks}
        self.assertEqual(names, {"Excludes cut (market)", "People per company", "Emails found", "Verified of found"})
        self.assertFalse(miss)

    def test_cli_writes_funnel_and_exits_5_on_a_leak(self):
        with tempfile.TemporaryDirectory() as t:
            out = Path(t) / "funnel.md"
            sets = [f"--set={k}={v}" for k, v in self.HEALTHY.items()]
            self.assertEqual(quiet(fg.main, sets + ["--set=target=500", "--out", str(out)]), 0)
            self.assertIn("PASS", out.read_text(encoding="utf-8"))
            self.assertEqual(quiet(fg.main, sets + ["--set=target=500", "--set=people_found=700", "--out", str(out)]), 5)
            self.assertIn("People per company", out.read_text(encoding="utf-8"))
            self.assertEqual(quiet(fg.main, ["--set=after_qa=5", "--out", str(out)]), 2)


class ListSendMergeTest(unittest.TestCase):
    def test_send_adds_only_clean_holdback_and_owner_review_rows(self):
        ready = [{"email": "a@x.com", "company_domain": "x.com", "email_status": "valid", "title": "CEO"}]
        holdback = [{"email": "b@y.com", "company_domain": "y.com", "email_status": "catch_all", "qa_reasons": "catch_all"},
                    {"email": "c@y.com", "company_domain": "y.com", "email_status": "catch_all",
                     "qa_reasons": "catch_all|wrong_geo"}]
        review = [{"email": "d@z.com", "company_domain": "z.com", "email_status": "valid", "title": "Founder & CEO",
                   "qa_reasons": "title_ambiguous"},
                  {"email": "e@z.com", "company_domain": "z.com", "email_status": "valid", "title": "Co-founder & CTO",
                   "qa_reasons": "title_ambiguous"}]
        out, s = lsm.build_send(ready, holdback, review)
        self.assertEqual([r["email"] for r in out], ["a@x.com", "b@y.com", "d@z.com"])
        self.assertEqual([r["email_verdict"] for r in out], ["valid", "catch_all", "valid"])
        self.assertEqual((s["holdback_kept_out"], s["review_kept_out"]), (1, 1))

    def test_dedupe_drops_holds_and_keeps(self):
        rows = [{"email": e, "company_domain": cd, "email_status": st} for e, cd, st in [
            ("a@keep.com", "keep.com", "valid"),
            ("b@keep.com", "keep.com", "catch_all"),
            ("a@keep.com", "keep.com", "valid"),            # repeat
            ("x@blocked.com", "blocked.com", "valid"),
            ("y@live.com", "inws.com", "valid"),             # free mail domain is not a workspace domain, company is
            ("z@sup.com", "sup.com", "valid"),
            ("q@gmail.com", "co.com", "valid"),
            ("m@other.com", "mine.com", "valid"),            # mismatch: held
            ("n@acme.us", "acme.net", "valid"),              # same label, other TLD: kept
            ("u@bad.com", "bad.com", "invalid")]]
        out, held, s = lsm.dedupe(rows, {"blocked.com"}, {"w@inws.com"}, {"inws.com"}, set(), {"sup.com"},
                                  {"valid", "catch_all"})
        self.assertEqual([r["email"] for r in out], ["a@keep.com", "b@keep.com", "n@acme.us"])
        self.assertEqual([r["email"] for r in held], ["m@other.com"])
        for k in ("drop_dup_email", "drop_blocklist", "drop_in_workspace_company", "drop_exclusion_or_suppression",
                  "drop_free_mail", "not_shippable_invalid"):
            self.assertEqual(s[k], 1, k)


class SiteRereadOfflineTest(unittest.TestCase):
    def test_batch_and_merge_with_count_check(self):
        with tempfile.TemporaryDirectory() as t:
            t = Path(t)
            sites = [{"id": "a.com", "ok": True, "home": {"title": "A", "meta": "", "heads": "", "body": "dental clinics"}},
                     {"id": "b.com", "ok": True, "home": {"title": "B", "meta": "", "heads": "", "body": "law firms"},
                      "sub": {"url": "https://b.com/clients", "heads": "Clients", "body": "law"}},
                     {"id": "c.com", "ok": False}]
            (t / "sites.jsonl").write_text("\n".join(json.dumps(s) for s in sites) + "\n", encoding="utf-8")
            self.assertEqual(quiet(sr.main, ["batch", "--sites", str(t / "sites.jsonl"), "--out-dir", str(t / "b"),
                                             "--per-batch", "1"]), 0)
            self.assertEqual(sorted(p.name for p in (t / "b").iterdir()), ["r000.txt", "r001.txt"])
            self.assertIn("### b.com", (t / "b" / "r001.txt").read_text(encoding="utf-8"))
            write_csv(t / "co.csv", ["company_domain", "fit"],
                      [{"company_domain": d, "fit": "maybe"} for d in ("a.com", "https://www.b.com", "c.com", "d.com")])
            (t / "res").mkdir()
            write_csv(t / "res" / "r000.csv", ["id", "fit", "variable"], [{"id": "a.com", "fit": "good", "variable": "dental clinics"}])
            args = ["merge", "--companies", str(t / "co.csv"), "--sites", str(t / "sites.jsonl"),
                    "--results", str(t / "res"), "--out", str(t / "m.csv")]
            self.assertEqual(quiet(sr.main, args), 3)                      # b.com was not judged
            write_csv(t / "res" / "r001.csv", ["id", "fit", "variable"], [{"id": "b.com", "fit": "good", "variable": "law firms"}])
            self.assertEqual(quiet(sr.main, args), 0)
            with open(t / "m.csv", encoding="utf-8") as fh:
                got = {r["company_domain"]: r["reread_status"] for r in csv.DictReader(fh)}
            self.assertEqual(got, {"a.com": "judged", "https://www.b.com": "judged", "c.com": "unreachable", "d.com": ""})


if __name__ == "__main__":
    unittest.main()
