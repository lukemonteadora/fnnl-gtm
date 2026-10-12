"""Tests for reservoir.py, the lead reservoir (Aaron flow, aaron-flow.md section 7).

Synthetic rows in temp folders only: no client data, no network, no spend. list_waterfall.py's use of the
reservoir as rung 0 of the email waterfall is tested in test_list_waterfall.py.
Run: python -m unittest tests.test_reservoir
"""
import csv
import importlib.util
import shutil
import sys
import tempfile
import unittest
from collections import Counter
from datetime import date
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("reservoir", SCRIPTS / "reservoir.py")
res = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
sys.modules["reservoir"] = res
SPEC.loader.exec_module(res)

TODAY = date(2026, 9, 30)


def rec(key, email, domain, verified_at, verdict="valid", **extra):
    return {"key": key, "linkedin_url": f"https://www.linkedin.com/in/{key}" if "@" not in key else "", "email": email,
            "company_domain": domain, "verdict": verdict, "verified_at": verified_at, "source": "aiark",
            "first_seen": verified_at, "last_seen": verified_at, **extra}


def write_csv(path, rows):
    cols = list(dict.fromkeys(c for r in rows for c in r))
    with path.open("w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=cols)
        w.writeheader()
        w.writerows(rows)


def read_csv(path):
    with path.open(newline="", encoding="utf-8") as fh:
        return list(csv.DictReader(fh))


class Normalization(unittest.TestCase):
    def test_key_prefers_slug_then_lowercase_email(self):
        self.assertEqual(res.record_key("https://www.linkedin.com/in/Jane-Doe-12/", "Jane@X.com"), "jane-doe-12")
        self.assertEqual(res.record_key("", " Jane@X.com "), "jane@x.com")
        self.assertEqual(res.record_key("https://example.com/profile", "not an email"), "")

    def test_slug_matches_list_common(self):
        try:
            import yaml  # noqa: F401  (list_common needs PyYAML; the reservoir does not)
        except ImportError:
            self.skipTest("PyYAML not installed")
        sys.path.insert(0, str(SCRIPTS))
        from list_common import linkedin_slug
        for url in ["https://www.linkedin.com/in/jane-doe", "http://linkedin.com/in/Jane-Doe/?trk=x", "linkedin.com/pub/a-b/1/2",
                    "https://uk.linkedin.com/in/abc#frag", "janedoe", "https://www.linkedin.com/company/acme", "", None,
                    "jane doe", "jane.doe"]:
            self.assertEqual(res.linkedin_slug(url), linkedin_slug(url), url)

    def test_domain_normalization(self):
        self.assertEqual(res.norm_domain("https://www.Acme.com/about"), "acme.com")
        self.assertTrue(res.same_company({"company_domain": "acme.com", "email": "a@acme.com"}, ["eu.acme.com"]))
        self.assertTrue(res.same_company({"company_domain": "", "email": "a@acme.io"}, ["acme.com"]))      # same root label
        self.assertFalse(res.same_company({"company_domain": "old.com", "email": "a@old.com"}, ["new.com"]))
        self.assertFalse(res.same_company({"company_domain": "foo.co.uk", "email": "a@foo.co.uk"}, ["bar.co.uk"]))  # not "co" == "co"
        self.assertTrue(res.same_company({"company_domain": "foo.co.uk", "email": "a@foo.co.uk"}, ["foo.co.uk"]))


class Lookup(unittest.TestCase):
    def setUp(self):
        self.store = {
            "fresh": rec("fresh", "fresh@acme.com", "acme.com", "2026-09-01"),
            "edge": rec("edge", "edge@acme.com", "acme.com", "2026-07-02"),         # exactly 90 days
            "old": rec("old", "old@acme.com", "acme.com", "2026-07-01"),            # 91 days
            "catch": rec("catch", "catch@acme.com", "acme.com", "2026-09-20", verdict="catch_all"),
            "bad": rec("bad", "bad@acme.com", "acme.com", "2026-09-20", verdict="invalid"),
            "moved": rec("moved", "moved@oldco.com", "oldco.com", "2026-09-20"),
        }

    def candidate(self, slug, domain="acme.com", email=""):
        return {"first_name": "X", "linkedin_url": f"https://www.linkedin.com/in/{slug}", "company_domain": domain, "email": email}

    def test_max_age_and_verdict_filter(self):
        rows = [self.candidate(s) for s in ("fresh", "edge", "old", "catch", "bad", "nobody")]
        rows.append(self.candidate("moved"))
        out, tally = res.lookup_rows(rows, self.store, 90, TODAY)
        got = {r["linkedin_url"].rsplit("/", 1)[-1]: r for r in out}
        self.assertEqual(got["fresh"]["email"], "fresh@acme.com")
        self.assertEqual(got["fresh"]["reservoir_hit"], "1")
        self.assertEqual(got["fresh"]["source"], "reservoir")
        self.assertEqual(got["edge"]["reservoir_hit"], "1")
        # A stored catch-all is NOT a rung-0 hit (aaron-flow.md section 7: only a stored gate of
        # "valid" is tried first; a catch-all still goes to the holdback under FNNL's unchanged catch-all timing
        # rule). This is the one deliberate divergence from A-Sales' version of this rung, which shipped a
        # stored catch-all straight through.
        for miss in ("old", "catch", "bad", "nobody", "moved"):
            self.assertEqual(got[miss]["reservoir_hit"], "0", miss)
            self.assertEqual(got[miss]["email"], "", miss)
        self.assertEqual(tally, Counter({"hit": 2, "stale": 1, "not_valid": 2, "no_match": 1, "other_company": 1}))

    def test_an_existing_email_is_never_replaced(self):
        out, tally = res.lookup_rows([self.candidate("fresh", email="given@acme.com")], self.store, 90, TODAY)
        self.assertEqual(out[0]["email"], "given@acme.com")
        self.assertEqual(out[0]["reservoir_hit"], "0")
        self.assertEqual(tally["email_already_present"], 1)

    def test_shorter_window(self):
        out, _ = res.lookup_rows([self.candidate("fresh")], self.store, 10, TODAY)
        self.assertEqual(out[0]["reservoir_hit"], "0")

    def test_find_for_person_wrapper_matches_find(self):
        rec_found, why = res.find_for_person(self.store, "https://www.linkedin.com/in/fresh", "", "acme.com", 90, TODAY)
        self.assertEqual(why, "hit")
        self.assertEqual(rec_found["email"], "fresh@acme.com")
        _, why_no_slug = res.find_for_person(self.store, "", "", "acme.com", 90, TODAY)
        self.assertEqual(why_no_slug, "no_slug")


class Writeback(unittest.TestCase):
    def row(self, slug, email, verdict="valid", at="2026-09-28", source="aiark", **extra):
        return {"first_name": "Jane", "last_name": "Doe", "job_title": "VP Sales", "company_name": "Acme",
                "company_domain": "acme.com", "linkedin_url": f"https://www.linkedin.com/in/{slug}" if slug else "",
                "email": email, "verdict": verdict, "verified_at": at, "source": source, **extra}

    def test_insert_then_upsert_keeps_first_seen_and_dedupes(self):
        store = {}
        t = res.writeback_rows([self.row("jane", "Jane@Acme.com")], store, date(2026, 9, 28))
        self.assertEqual(t["inserted"], 1)
        t = res.writeback_rows([self.row("jane", "jane@acme.com", verdict="invalid", at="2026-09-30", source="prospeo")], store, TODAY)
        self.assertEqual(t["updated"], 1)
        self.assertEqual(list(store), ["jane"])
        self.assertEqual(store["jane"]["verdict"], "invalid")
        self.assertEqual(store["jane"]["first_seen"], "2026-09-28")
        self.assertEqual(store["jane"]["last_seen"], "2026-09-30")
        self.assertEqual(store["jane"]["source"], "prospeo")

    def test_an_older_verdict_never_overwrites_a_newer_one(self):
        store = {}
        res.writeback_rows([self.row("jane", "jane@acme.com", at="2026-09-29")], store, TODAY)
        res.writeback_rows([self.row("jane", "jane@acme.com", verdict="invalid", at="2026-08-01")], store, TODAY)
        self.assertEqual(store["jane"]["verdict"], "valid")
        self.assertEqual(store["jane"]["verified_at"], "2026-09-29")

    def test_email_record_moves_to_the_slug(self):
        store = {}
        res.writeback_rows([self.row("", "jane@acme.com")], store, TODAY)
        self.assertEqual(list(store), ["jane@acme.com"])
        t = res.writeback_rows([self.row("jane", "jane@acme.com")], store, TODAY)
        self.assertEqual(list(store), ["jane"])
        self.assertEqual(t["merged_email_record_into_slug"], 1)

    def test_only_aiark_and_prospeo_sources_are_accepted(self):
        store = {}
        rows = [self.row("a", "a@acme.com", source="aiark"),
                self.row("b", "b@acme.com", source="prospeo"),
                self.row("c", "c@acme.com", source="row_existing"),       # the contacts file's own column: refused
                self.row("d", "d@acme.com", source="client_list"),
                self.row("e", "e@acme.com", source=""),
                self.row("f", "f@acme.com", verdict="not_verified"),
                self.row("g", "")]
        rows += [self.row("h", "h@acme.com", source="aiark", campaign="acme-offer-1", client="Acme Client Inc")]
        t = res.writeback_rows(rows, store, TODAY)
        self.assertEqual(t["refused_source_not_an_fnnl_finder"], 3)   # c, d, e
        self.assertEqual(t["skipped_no_verdict"], 1)                  # f: allowed source, but no real gate
        self.assertEqual(t["skipped_no_email"], 1)                    # g
        self.assertEqual(set(store), {"a", "b", "h"})
        self.assertEqual(set(store["h"]), set(res.FIELDS))             # campaign and client never stored

    def test_source_check_can_be_turned_off(self):
        store = {}
        res.writeback_rows([self.row("a", "a@acme.com", source="client_list")], store, TODAY, source_check=False)
        self.assertEqual(list(store), ["a"])

    def test_rows_without_a_real_gate_are_skipped(self):
        store = {}
        t = res.writeback_rows([self.row("a", "a@acme.com", verdict="risky")], store, TODAY)  # not in FNNL's gate set
        self.assertEqual(t["skipped_no_verdict"], 1)
        self.assertEqual(store, {})


class Cli(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self.store = self.tmp / "res" / "contacts.jsonl"

    def tearDown(self):
        shutil.rmtree(self.tmp, ignore_errors=True)

    def run_cli(self, *args):
        return res.main(list(args) + ["--store", str(self.store), "--today", TODAY.isoformat()])

    def test_writeback_lookup_stats_round_trip_with_atomic_writes(self):
        verified = self.tmp / "verified.csv"
        write_csv(verified, [
            {"first_name": "Jane", "last_name": "Doe", "job_title": "VP Sales", "company_name": "Acme", "company_domain": "acme.com",
             "linkedin_url": "https://www.linkedin.com/in/jane", "email": "jane@acme.com", "verdict": "valid",
             "verified_at": "2026-09-20T10:00:00Z", "source": "aiark", "campaign": "acme-1"},
            {"first_name": "Bo", "last_name": "Li", "job_title": "CFO", "company_name": "Acme", "company_domain": "acme.com",
             "linkedin_url": "https://www.linkedin.com/in/bo", "email": "bo@acme.com", "verdict": "invalid",
             "verified_at": "2026-09-20", "source": "prospeo"},
            {"first_name": "Cy", "linkedin_url": "https://www.linkedin.com/in/cy", "email": "cy@acme.com",
             "verdict": "valid", "source": "client upload"}])
        self.assertEqual(self.run_cli("writeback", "--in", str(verified)), 0)
        lines = self.store.read_text(encoding="utf-8").splitlines()
        self.assertEqual(len(lines), 2)
        self.assertEqual(list(self.store.parent.glob("*.tmp")), [])                  # the temp file was replaced
        self.assertNotIn("acme-1", self.store.read_text(encoding="utf-8"))
        self.assertEqual(self.run_cli("writeback", "--in", str(verified)), 0)       # idempotent
        self.assertEqual(len(self.store.read_text(encoding="utf-8").splitlines()), 2)

        cands = self.tmp / "cands.csv"
        out = self.tmp / "out.csv"
        write_csv(cands, [{"linkedin_url": "https://www.linkedin.com/in/jane", "company_domain": "acme.com", "email": ""},
                          {"linkedin_url": "https://www.linkedin.com/in/bo", "company_domain": "acme.com", "email": ""}])
        self.assertEqual(self.run_cli("lookup", "--in", str(cands), "--out", str(out)), 0)
        rows = read_csv(out)
        self.assertEqual([r["reservoir_hit"] for r in rows], ["1", "0"])
        self.assertEqual(rows[0]["email"], "jane@acme.com")
        self.assertEqual(rows[0]["source"], "reservoir")
        self.assertEqual(rows[0]["reservoir_verified_at"], "2026-09-20")
        self.assertEqual(self.run_cli("stats"), 0)
        st = res.stats(res.load_store(self.store), TODAY, 90)
        self.assertEqual(st["records"], 2)
        self.assertEqual(st["by_verdict"], {"valid": 1, "invalid": 1})
        self.assertEqual(st["valid_verified_within_90_days"], 1)

    def test_missing_input_is_an_error(self):
        self.assertEqual(self.run_cli("lookup", "--in", str(self.tmp / "nope.csv"), "--out", str(self.tmp / "o.csv")), 2)
        self.assertEqual(self.run_cli("writeback"), 2)

    def test_default_store_is_under_profiles_reservoir(self):
        self.assertEqual(res.DEFAULT_STORE.parts[-3:], ("profiles", "_reservoir", "contacts.jsonl"))
        self.assertEqual(res.DEFAULT_STORE.parents[2].name, "outbound")


if __name__ == "__main__":
    unittest.main()
