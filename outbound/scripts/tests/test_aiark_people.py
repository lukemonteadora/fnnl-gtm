"""Offline tests for aiark_people.mjs.

The real CLI runs in a node child process with aiark_fetch_stub.mjs preloaded (node --import), so fetch never
reaches AI Ark and no credit is spent. The fake key is passed through the child's environment, which overrides
any real key in outbound/scripts/.env (same harness shape as test_millionverifier_verify.py / mv_fetch_stub.mjs).
"""
import json
import os
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parents[1]
CLI = SCRIPTS / "aiark_people.mjs"
STUB = Path(__file__).resolve().parent / "aiark_fetch_stub.mjs"
FAKE_KEY = "fake-ark-key-SECRET-9931"
NODE = shutil.which("node")


def person(pid, idx):
    domain_idx = idx % 5
    return {
        "id": pid,
        "company": {
            "domain": f"co{domain_idx}.com",
            "name": f"Company {domain_idx}",
            "description": "roofing contractor serving commercial clients",
            "keywords": ["Roofing", "Emergency Repair"],
            "industries": ["Construction"],
            "employeeSize": 25,
            "location": "Austin, TX",
        },
    }


def page_of(n, start, credit=None):
    results = [person(f"p{start + i}", start + i) for i in range(n)]
    cr = credit if credit is not None else f"-{n * 0.5}"
    return {"status": 200, "body": {"results": results, "total": 537}, "credit": cr}


@unittest.skipIf(NODE is None, "node is not on PATH")
class AiArkPeopleTest(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp(prefix="aiarktest-"))
        self.search = self.tmp / "search.json"
        self.search.write_text(json.dumps({"account": {"location": {"any": {"include": ["United States"]}}}}), encoding="utf-8")
        self.log = self.tmp / "calls.log"

    def tearDown(self):
        shutil.rmtree(self.tmp, ignore_errors=True)

    def write_scenario(self, scenario):
        p = self.tmp / "scenario.json"
        p.write_text(json.dumps(scenario), encoding="utf-8")
        return p

    def run_cli(self, scenario_path, *args, key=FAKE_KEY, log=None):
        env = dict(os.environ)
        env.update({
            "AI_ARK_API_KEY": key,
            "AIARK_STUB_SCENARIO": str(scenario_path),
            "AIARK_STUB_LOG": str(log or self.log),
        })
        cmd = [NODE, "--import", STUB.as_uri(), str(CLI), *args]
        return subprocess.run(cmd, capture_output=True, text=True, env=env, timeout=60)

    def calls(self):
        if not self.log.exists():
            return []
        return [json.loads(line) for line in self.log.read_text(encoding="utf-8").splitlines() if line]

    def assert_key_never_leaks(self, proc, *extra_paths):
        for text in (proc.stdout, proc.stderr):
            self.assertNotIn(FAKE_KEY, text)
        for p in extra_paths:
            if p.exists():
                self.assertNotIn(FAKE_KEY, p.read_text(encoding="utf-8"))

    # ---- count ----
    def test_count_reads_total_from_a_one_result_call(self):
        scenario = self.write_scenario({"people": {"0": page_of(1, 0, credit="-0.5")}})
        proc = self.run_cli(scenario, "count", "--search", str(self.search))
        self.assertEqual(proc.returncode, 0, proc.stderr)
        out = json.loads(proc.stdout)
        self.assertEqual(out["total"], 537)
        calls = self.calls()
        self.assertEqual(len(calls), 1)
        self.assertEqual(calls[0]["size"], 1)
        self.assert_key_never_leaks(proc)

    # ---- sample ----
    def test_sample_pages_to_exact_n_and_writes_seen_ids_and_companies_csv(self):
        scenario = self.write_scenario({
            "people": {"0": page_of(100, 0), "1": page_of(50, 100)},
        })
        out = self.tmp / "sample-r0.jsonl"
        proc = self.run_cli(scenario, "sample", "--search", str(self.search), "--n", "150", "--out", str(out))
        self.assertEqual(proc.returncode, 0, proc.stderr)
        summary = json.loads(proc.stdout)
        self.assertEqual(summary["sampled"], 150)

        lines = out.read_text(encoding="utf-8").splitlines()
        self.assertEqual(len(lines), 150)
        ids = {json.loads(l)["id"] for l in lines}
        self.assertEqual(ids, {f"p{i}" for i in range(150)})

        seen_ids_file = self.tmp / "seen-ids.txt"
        self.assertTrue(seen_ids_file.exists())
        seen = [l for l in seen_ids_file.read_text(encoding="utf-8").splitlines() if l]
        self.assertEqual(set(seen), ids)
        self.assertEqual(len(seen), len(set(seen)), "seen-ids.txt must not have duplicates")

        companies_csv = self.tmp / "sample-r0-companies.csv"
        self.assertTrue(companies_csv.exists())
        import csv
        with companies_csv.open(encoding="utf-8", newline="") as fh:
            rows = list(csv.DictReader(fh))
        self.assertEqual(len(rows), 5)  # co0..co4
        total_people = sum(int(r["person_count"]) for r in rows)
        self.assertEqual(total_people, 150)
        for r in rows:
            self.assertEqual(r["description"], "roofing contractor serving commercial clients")
            self.assertEqual(r["keywords"], "Roofing|Emergency Repair")
            self.assertEqual(r["industries"], "Construction")
            self.assertEqual(r["location"], "Austin, TX")

        self.assert_key_never_leaks(proc, out, seen_ids_file, companies_csv)

    def test_sample_stops_early_when_the_search_is_exhausted(self):
        # Only 40 results exist even though 200 were asked for; the script must not loop forever.
        scenario = self.write_scenario({"people": {"0": page_of(40, 0)}})
        out = self.tmp / "sample.jsonl"
        proc = self.run_cli(scenario, "sample", "--search", str(self.search), "--n", "200", "--out", str(out))
        self.assertEqual(proc.returncode, 0, proc.stderr)
        self.assertEqual(len(out.read_text(encoding="utf-8").splitlines()), 40)

    # ---- pull --max-credits ----
    def test_pull_max_credits_stops_before_crossing_budget(self):
        # Page 0 and page 1 cost 50 credits each (100 results * 0.5). max-credits=120 allows two pages
        # (50, then 100 total) but refuses the third (which would reach 150 > 120).
        scenario = self.write_scenario({
            "people": {"0": page_of(100, 0, credit="-50"), "1": page_of(100, 100, credit="-50")},
        })
        out = self.tmp / "pull.jsonl"
        proc = self.run_cli(scenario, "pull", "--search", str(self.search), "--out", str(out), "--max-credits", "120")
        self.assertEqual(proc.returncode, 0, proc.stderr)
        summary = json.loads(proc.stdout)
        self.assertEqual(summary["reason"], "max-credits reached")
        self.assertFalse(summary["completed"])
        self.assertEqual(summary["pulled"], 200)
        self.assertEqual(summary["credits_spent"], 100)
        self.assertEqual(summary["next_page"], 2)

        lines = out.read_text(encoding="utf-8").splitlines()
        self.assertEqual(len(lines), 200)

        progress = json.loads((self.tmp / "pull.jsonl.progress.json").read_text(encoding="utf-8"))
        self.assertEqual(progress["nextPage"], 2)
        self.assertEqual(progress["creditsSpent"], 100)

        # Page 2 was never requested (no scenario entry for it; the stub would have raised if it were).
        pages_called = [c["page"] for c in self.calls()]
        self.assertEqual(pages_called, [0, 1])
        self.assert_key_never_leaks(proc, out)

    # ---- pull --resume ----
    def test_pull_resume_continues_from_checkpoint(self):
        scenario = self.write_scenario({
            "people": {
                "0": page_of(100, 0, credit="-50"),
                "1": page_of(100, 100, credit="-50"),
                "2": page_of(30, 200, credit="-15"),  # short page: the search is exhausted here
            },
        })
        out = self.tmp / "pull.jsonl"

        first = self.run_cli(scenario, "pull", "--search", str(self.search), "--out", str(out), "--max-credits", "60")
        self.assertEqual(first.returncode, 0, first.stderr)
        first_summary = json.loads(first.stdout)
        self.assertEqual(first_summary["reason"], "max-credits reached")
        self.assertEqual(first_summary["pulled"], 100)
        self.assertEqual(len(out.read_text(encoding="utf-8").splitlines()), 100)

        second = self.run_cli(scenario, "pull", "--search", str(self.search), "--out", str(out),
                               "--max-credits", "200", "--resume")
        self.assertEqual(second.returncode, 0, second.stderr)
        second_summary = json.loads(second.stdout)
        self.assertTrue(second_summary["completed"])
        self.assertEqual(second_summary["reason"], "exhausted")
        self.assertEqual(second_summary["pulled"], 230)  # 100 resumed + 100 (page1) + 30 (page2)

        lines = out.read_text(encoding="utf-8").splitlines()
        self.assertEqual(len(lines), 230)
        ids = {json.loads(l)["id"] for l in lines}
        self.assertEqual(ids, {f"p{i}" for i in range(230)})

        # The resumed run must not have re-requested page 0.
        pages_called = [c["page"] for c in self.calls()]
        self.assertEqual(pages_called, [0, 1, 2])
        self.assert_key_never_leaks(first, out)
        self.assert_key_never_leaks(second, out)

    # ---- exit code 3 ----
    def test_exit_code_3_on_insufficient_balance(self):
        scenario = self.write_scenario({"people": {"0": {"status": 402, "body": {"message": "insufficient balance"}}}})
        proc = self.run_cli(scenario, "count", "--search", str(self.search))
        self.assertEqual(proc.returncode, 3, proc.stderr)
        self.assert_key_never_leaks(proc)

    def test_exit_code_3_on_persistent_outage(self):
        # Every attempt (initial + retries) answers 503; the script must give up and report exit 3, not hang.
        scenario = self.write_scenario({"people": {"0": {"status": 503, "body": {"message": "down for maintenance"}}}})
        proc = self.run_cli(scenario, "pull", "--search", str(self.search), "--out", str(self.tmp / "pull.jsonl"),
                             "--max-credits", "1000")
        self.assertEqual(proc.returncode, 3, proc.stderr)
        self.assert_key_never_leaks(proc)

    # ---- key never leaks, including when the server echoes it back ----
    def test_key_never_leaks_even_when_the_server_echoes_it(self):
        scenario = self.write_scenario({
            "people": {"0": {"status": 401, "body": {"message": f"invalid token: {FAKE_KEY} was rejected"}}},
        })
        proc = self.run_cli(scenario, "count", "--search", str(self.search))
        self.assertEqual(proc.returncode, 1, proc.stderr)
        self.assert_key_never_leaks(proc)
        self.assertIn("***", proc.stdout + proc.stderr)

    # ---- never calls the banned endpoints ----
    def test_never_calls_export_or_email_finder(self):
        scenario = self.write_scenario({"people": {"0": page_of(1, 0)}})
        proc = self.run_cli(scenario, "count", "--search", str(self.search))
        self.assertEqual(proc.returncode, 0, proc.stderr)
        for c in self.calls():
            self.assertNotIn("export", c["path"])
            self.assertNotIn("email-finder", c["path"])

    # ---- usage errors ----
    def test_missing_key_is_a_usage_error(self):
        scenario = self.write_scenario({"people": {"0": page_of(1, 0)}})
        proc = self.run_cli(scenario, "count", "--search", str(self.search), key="")
        self.assertEqual(proc.returncode, 2, proc.stderr)

    def test_unknown_command_is_a_usage_error(self):
        scenario = self.write_scenario({"default": page_of(1, 0)})
        proc = self.run_cli(scenario, "bogus-command")
        self.assertEqual(proc.returncode, 2, proc.stderr)


if __name__ == "__main__":
    unittest.main()
