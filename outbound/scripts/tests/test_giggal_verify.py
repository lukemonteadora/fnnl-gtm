"""Offline tests for giggal_verify.mjs.

The real CLI runs in a node child process with giggal_fetch_stub.mjs preloaded (node --import), so fetch never reaches
Giggal and no credit is spent. Fixtures are written to a temp dir at run time (CSV files are gitignored).
The fake key is passed through the child's environment, which overrides any real key in outbound/scripts/.env.
"""
import csv
import json
import os
import shutil
import subprocess
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parents[1]
CLI = SCRIPTS / "giggal_verify.mjs"
STUB = Path(__file__).resolve().parent / "giggal_fetch_stub.mjs"
FAKE_KEY = "tp_live_fake-SECRET-7731"
NODE = shutil.which("node")


def result(status, *, score=90, catch_all=False, sub=None, role=False, free=False, reason="ok", **extra):
    body = {"status": status, "is_valid": status == "deliverable", "deliverability_score": score,
            "details": {"general": {"reason": reason},
                        "attributes": {"catch_all": catch_all, "role_account": role, "free_email": free},
                        "sub_status": sub}}
    body.update(extra)
    return body


SCENARIO = {
    "default": result("deliverable", score=95),
    "emails": {
        "ok@acme.com": result("deliverable", score=97, reason="All validations passed"),
        "ca-ok@acme.com": result("deliverable", score=89, catch_all=True),
        "bad@acme.com": result("undeliverable", score=7, sub="Rejected Email", reason="Email does not exist"),
        "unk@acme.com": result("unknown", score=40, sub="Unavailable SMTP"),
        "role@acme.com": result("deliverable", score=80, role=True, free=True),
        "acc-valid@acme.com": result("accept_all", score=50, catch_all=True),
        "acc-bad@acme.com": result("risky", score=20, catch_all=True),
        "gone@acme.com": result("deliverable"),
    },
    "unreturned": ["gone@acme.com"],
    "catchall": {"acc-valid@acme.com": "valid", "acc-bad@acme.com": "invalid"},
}

ROWS = [
    ("Ok", "ok@acme.com"),
    ("CaOk", "CA-OK@acme.com "),
    ("Dup", " Ok@Acme.com"),
    ("Bad", "bad@acme.com"),
    ("Unk", "unk@acme.com"),
    ("Role", "role@acme.com"),
    ("AccValid", "acc-valid@acme.com"),
    ("AccBad", "acc-bad@acme.com"),
    ("Gone", "gone@acme.com"),
    ("Blank", ""),
    ("Junk", "not-an-email"),
]

SENT = {"ok@acme.com", "ca-ok@acme.com", "bad@acme.com", "unk@acme.com", "role@acme.com", "acc-valid@acme.com",
        "acc-bad@acme.com", "gone@acme.com"}
CACHED = SENT - {"unk@acme.com", "gone@acme.com"}      # unknown is refunded and a missing result is a failure: neither is cached


@unittest.skipIf(NODE is None, "node is not on PATH")
class GiggalVerifyTest(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp(prefix="giggaltest-"))
        self.input = self.tmp / "leads.csv"
        self.write_input(self.input, ROWS)
        self.cache = self.tmp / "cache" / "verify-cache.jsonl"
        self.out = self.tmp / "out.csv"
        self.log = self.tmp / "calls.log"
        self.write_scenario(SCENARIO)

    def tearDown(self):
        shutil.rmtree(self.tmp, ignore_errors=True)

    @staticmethod
    def write_input(path, rows):
        with path.open("w", encoding="utf-8", newline="") as fh:
            w = csv.writer(fh)
            w.writerow(["first_name", "email"])
            w.writerows(rows)

    def write_scenario(self, scenario):
        self.scenario = self.tmp / "scenario.json"
        self.scenario.write_text(json.dumps(scenario), encoding="utf-8")

    def scenario_with(self, **changes):
        scenario = json.loads(json.dumps(SCENARIO))
        scenario.update(changes)
        self.write_scenario(scenario)

    def env(self, key=FAKE_KEY):
        env = dict(os.environ)
        env.update({"GIGGAL_API_KEY": key, "GIGGAL_STUB_SCENARIO": str(self.scenario), "GIGGAL_STUB_LOG": str(self.log)})
        return env

    def run_cli(self, *args, key=FAKE_KEY, cli=CLI):
        cmd = [NODE, "--import", STUB.as_uri(), str(cli), *args]
        return subprocess.run(cmd, capture_output=True, text=True, env=self.env(key), timeout=90)

    def log_lines(self):
        if not self.log.exists():
            return []
        return [line for line in self.log.read_text(encoding="utf-8").splitlines() if line]

    def calls(self):
        """Addresses submitted for verification, in order."""
        return [line for line in self.log_lines() if "@" in line]

    def count(self, event):
        return self.log_lines().count(event)

    def out_rows(self):
        with self.out.open(encoding="utf-8", newline="") as fh:
            return {row["first_name"]: row for row in csv.DictReader(fh)}

    def cache_lines(self):
        return self.jsonl(self.cache)

    @staticmethod
    def jsonl(path):
        if not path.exists():
            return []
        return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]

    def assert_key_never_leaks(self, proc):
        for text in (proc.stdout, proc.stderr):
            self.assertNotIn(FAKE_KEY, text)
        for path in (self.out, self.cache):
            if path.exists():
                self.assertNotIn(FAKE_KEY, path.read_text(encoding="utf-8"))

    def fast(self, *extra):
        return ["--backoff-ms", "0", "--poll-ms", "0", *extra]

    def first_run(self, *extra):
        proc = self.run_cli(str(self.input), "--out", str(self.out), "--cache", str(self.cache),
                            *self.fast("--retries", "2", "--usd-per-credit", "0.001", *extra))
        self.assertEqual(proc.returncode, 0, proc.stderr)
        return proc

    # ---- gate mapping, dedupe, cache write ----
    def test_mapping_dedupe_and_cache_write(self):
        proc = self.first_run()
        rows = self.out_rows()
        expect = {
            "Ok": ("valid", "deliverable", "false"), "Dup": ("valid", "deliverable", "false"),
            "CaOk": ("valid", "deliverable", "true"),                      # a scored mailbox on a catch-all domain
            "Bad": ("invalid", "undeliverable", "false"), "Unk": ("unknown", "unknown", "false"),
            "Role": ("valid", "deliverable", "false"),
            "AccValid": ("valid", "accept_all", "true"), "AccBad": ("invalid", "risky", "true"),   # resolved by the catch-all check
            "Gone": ("unknown", "error", ""), "Blank": ("no_email", "no_email", ""), "Junk": ("invalid", "malformed", ""),
        }
        for name, (gate, raw, catch) in expect.items():
            with self.subTest(row=name):
                self.assertEqual(rows[name]["email_status"], gate)
                self.assertEqual(rows[name]["verifier_raw_status"], raw)
                self.assertEqual(rows[name]["is_catch_all"], catch)
        self.assertEqual(rows["Role"]["verifier_role"], "true")
        self.assertEqual(rows["Role"]["verifier_free"], "true")
        self.assertEqual(rows["Ok"]["verifier_quality"], "97")
        self.assertEqual(rows["Bad"]["verifier_subresult"], "Rejected Email")
        self.assertEqual(rows["Unk"]["verifier_subresult"], "Unavailable SMTP")
        self.assertEqual(rows["Ok"]["verified_by"], "giggal")
        self.assertEqual(rows["Ok"]["cache_hit"], "false")
        self.assertTrue(rows["Ok"]["verified_at"])
        self.assertEqual(rows["Blank"]["verified_by"], "")
        self.assertIn("did not return a result", rows["Gone"]["verifier_detail"])
        self.assertIn("catch-all check valid", rows["AccValid"]["verifier_detail"])
        # cost: the first occurrence of a paid email carries the estimate, its in-file repeat carries 0, unknown is refunded
        self.assertEqual(rows["Ok"]["cost_usd"], "0.001")
        self.assertEqual(rows["Dup"]["cost_usd"], "0")
        self.assertEqual(rows["Unk"]["cost_usd"], "0")
        self.assertEqual(rows["Gone"]["cost_usd"], "")
        # one batch, each distinct plausible address once, none for blank or malformed, one catch-all check
        self.assertEqual(self.count("submit"), 1)
        self.assertEqual(sorted(self.calls()), sorted(SENT))
        self.assertEqual(self.count("catchall"), 1)
        cached = {line["email"]: line for line in self.cache_lines()}
        self.assertEqual(set(cached), CACHED)
        self.assertTrue(all(line["provider"] == "giggal" for line in cached.values()))
        self.assertEqual(cached["acc-valid@acme.com"]["gate"], "valid")      # the resolved gate is what is cached
        self.assertEqual(cached["acc-valid@acme.com"]["raw_status"], "accept_all")
        self.assertIn("Credits: 1000 before", proc.stdout)
        self.assert_key_never_leaks(proc)

    def test_catchall_check_can_be_skipped_or_can_fail_and_the_row_stays_in_holdback(self):
        proc = self.first_run("--no-catchall-check")
        rows = self.out_rows()
        self.assertEqual(rows["AccValid"]["email_status"], "catch_all")
        self.assertEqual(rows["AccValid"]["is_catch_all"], "true")
        self.assertEqual(rows["AccBad"]["email_status"], "catch_all")
        self.assertEqual(self.count("catchall"), 0)
        self.assertEqual(rows["CaOk"]["email_status"], "valid")
        self.assert_key_never_leaks(proc)

    def test_catchall_check_failure_never_promotes_a_row_to_valid(self):
        self.scenario_with(catchall_status=503)
        proc = self.run_cli(str(self.input), "--out", str(self.out), "--no-cache", *self.fast("--retries", "1"))
        self.assertEqual(proc.returncode, 0, proc.stderr)
        rows = self.out_rows()
        self.assertEqual(rows["AccValid"]["email_status"], "catch_all")
        self.assertIn("left in holdback", rows["AccValid"]["verifier_detail"])
        self.assertEqual(rows["Ok"]["email_status"], "valid")

    def test_second_run_reuses_cache_and_retries_only_what_was_not_cached(self):
        self.first_run()
        self.log.unlink()
        before = self.cache.read_text(encoding="utf-8")
        proc = self.run_cli(str(self.input), "--out", str(self.out), "--cache", str(self.cache), *self.fast("--retries", "0"))
        self.assertEqual(proc.returncode, 0, proc.stderr)
        self.assertEqual(sorted(self.calls()), ["gone@acme.com", "unk@acme.com"])
        rows = self.out_rows()
        self.assertEqual(rows["CaOk"]["cache_hit"], "true")
        self.assertEqual(rows["AccValid"]["email_status"], "valid")           # served from the cache with its resolved gate
        self.assertEqual(rows["Gone"]["cache_hit"], "false")
        self.assertEqual(self.cache.read_text(encoding="utf-8"), before)        # nothing new was cacheable
        self.assert_key_never_leaks(proc)

    def test_no_cache_reads_and_writes_nothing(self):
        self.first_run()
        self.log.unlink()
        before = self.cache.read_text(encoding="utf-8")
        proc = self.run_cli(str(self.input), "--out", str(self.out), "--no-cache", *self.fast("--retries", "0"))
        self.assertEqual(proc.returncode, 0, proc.stderr)
        self.assertEqual(len(self.calls()), len(SENT))
        self.assertEqual(self.cache.read_text(encoding="utf-8"), before)

    def test_stale_entries_and_other_verifiers_are_not_reused(self):
        old = (datetime.now(timezone.utc) - timedelta(days=91)).isoformat()
        fresh = (datetime.now(timezone.utc) - timedelta(days=5)).isoformat()
        self.cache.parent.mkdir(parents=True)
        self.cache.write_text("\n".join(json.dumps(line) for line in [
            {"email": "ok@acme.com", "gate": "valid", "raw_status": "deliverable", "verified_at": old, "provider": "giggal"},
            {"email": "bad@acme.com", "gate": "invalid", "raw_status": "undeliverable", "verified_at": fresh, "provider": "giggal"},
            {"email": "unk@acme.com", "gate": "valid", "raw_status": "ok", "verified_at": fresh, "provider": "millionverifier"},
            {"email": "role@acme.com", "gate": "valid", "raw_status": "ok", "verified_at": fresh, "provider": "millionverifier"},
        ]) + "\n", encoding="utf-8")
        proc = self.run_cli(str(self.input), "--out", str(self.out), "--cache", str(self.cache), *self.fast("--retries", "0"))
        self.assertEqual(proc.returncode, 0, proc.stderr)
        calls = self.calls()
        self.assertIn("ok@acme.com", calls)         # 91 days old: re-verified
        self.assertNotIn("bad@acme.com", calls)     # 5 days old: reused
        self.assertIn("unk@acme.com", calls)        # a MillionVerifier-era verdict is not reused ...
        self.assertIn("role@acme.com", calls)
        self.assertEqual(self.out_rows()["Bad"]["cache_hit"], "true")
        legacy = [line for line in self.cache_lines() if line["provider"] == "millionverifier"]
        self.assertEqual(len(legacy), 2)            # ... and is left in place, not rewritten

    # ---- batching, retries, failures ----
    def test_batches_are_split_and_each_address_is_sent_once(self):
        self.first_run("--batch-size", "3", "--concurrency", "1")
        self.assertEqual(self.count("submit"), 3)                            # 8 distinct sendable addresses -> 3 + 3 + 2
        self.assertEqual(sorted(self.calls()), sorted(SENT))
        self.assertEqual(self.out_rows()["AccBad"]["email_status"], "invalid")

    def test_a_rerun_sends_the_same_idempotency_key(self):
        self.scenario_with(unreturned=[])
        for _ in range(2):
            proc = self.run_cli(str(self.input), "--out", str(self.out), "--no-cache", *self.fast("--retries", "0"))
            self.assertEqual(proc.returncode, 0, proc.stderr)
        keys = [line for line in self.log_lines() if line.startswith("idem:")]
        self.assertEqual(len(keys), 2)
        self.assertEqual(keys[0], keys[1])
        self.assertTrue(keys[0].startswith("idem:fnnl-verify-"))

    def test_a_job_that_is_slow_is_polled_until_done(self):
        self.scenario_with(polls_before_done=3)
        proc = self.run_cli(str(self.input), "--out", str(self.out), "--no-cache", *self.fast("--retries", "0"))
        self.assertEqual(proc.returncode, 0, proc.stderr)
        self.assertEqual(self.out_rows()["Ok"]["email_status"], "valid")

    def test_rate_limit_on_submit_is_retried(self):
        self.scenario_with(submit_steps=[{"status": 429, "body": {"success": False, "message": "Developer API rate limit exceeded"}}])
        proc = self.run_cli(str(self.input), "--out", str(self.out), "--cache", str(self.cache), *self.fast("--retries", "2"))
        self.assertEqual(proc.returncode, 0, proc.stderr)
        self.assertEqual(self.count("submit"), 1)
        self.assertEqual(self.out_rows()["Ok"]["email_status"], "valid")

    def test_submit_that_keeps_failing_marks_rows_transient_and_caches_nothing(self):
        down = {"status": 503, "body": {"success": False}}
        self.scenario_with(submit_steps=[down, down, down])
        proc = self.run_cli(str(self.input), "--out", str(self.out), "--cache", str(self.cache), *self.fast("--retries", "2"))
        self.assertEqual(proc.returncode, 0, proc.stderr)
        rows = self.out_rows()
        for name in ("Ok", "Bad", "AccValid"):
            with self.subTest(row=name):
                self.assertEqual(rows[name]["email_status"], "unknown")
                self.assertEqual(rows[name]["verifier_raw_status"], "error")
                self.assertIn("HTTP 503", rows[name]["verifier_detail"])
                self.assertIn("after 3 attempts", rows[name]["verifier_detail"])
        self.assertEqual(self.cache_lines(), [])
        self.assertEqual(self.calls(), [])
        self.assertEqual(rows["Blank"]["email_status"], "no_email")

    def test_network_error_is_transient_and_the_key_is_scrubbed(self):
        self.scenario_with(submit_steps=[{"throw": "connect ECONNRESET while sending {key}"}])
        proc = self.run_cli(str(self.input), "--out", str(self.out), "--no-cache", *self.fast("--retries", "0"))
        self.assertEqual(proc.returncode, 0, proc.stderr)
        row = self.out_rows()["Ok"]
        self.assertEqual(row["verifier_raw_status"], "error")
        self.assertIn("***", row["verifier_detail"])
        self.assert_key_never_leaks(proc)

    def test_a_failed_job_is_transient(self):
        self.scenario_with(job_status="failed")
        proc = self.run_cli(str(self.input), "--out", str(self.out), "--cache", str(self.cache), *self.fast("--retries", "0"))
        self.assertEqual(proc.returncode, 0, proc.stderr)
        row = self.out_rows()["Ok"]
        self.assertEqual((row["email_status"], row["verifier_raw_status"]), ("unknown", "error"))
        self.assertIn("ended failed", row["verifier_detail"])
        self.assertEqual(self.cache_lines(), [])

    def test_a_job_that_never_finishes_times_out_as_transient(self):
        self.scenario_with(job_status="processing")
        proc = self.run_cli(str(self.input), "--out", str(self.out), "--no-cache",
                            "--backoff-ms", "0", "--poll-ms", "50", "--retries", "0", "--job-timeout-s", "1")
        self.assertEqual(proc.returncode, 0, proc.stderr)
        row = self.out_rows()["Ok"]
        self.assertEqual((row["email_status"], row["verifier_raw_status"]), ("unknown", "timeout"))

    def test_out_of_credits_stops_with_partial_output_and_keeps_paid_verdicts(self):
        self.scenario_with(fatal_on_email="unk@acme.com")
        proc = self.run_cli(str(self.input), "--out", str(self.out), "--cache", str(self.cache),
                            *self.fast("--retries", "0", "--batch-size", "2", "--concurrency", "1"))
        self.assertEqual(proc.returncode, 1)
        self.assertIn("Stopped early", proc.stderr)
        self.assertIn("insufficient credits", proc.stderr)
        rows = self.out_rows()
        self.assertEqual(rows["Ok"]["email_status"], "valid")                # first batch (ok, ca-ok) landed before the 402
        self.assertEqual(rows["CaOk"]["email_status"], "valid")
        self.assertEqual(rows["Bad"]["verifier_raw_status"], "not_verified")  # second batch (bad, unk) hit the 402
        self.assertEqual(rows["Unk"]["verifier_raw_status"], "not_verified")
        self.assertEqual(rows["AccValid"]["verifier_raw_status"], "not_verified")
        self.assertEqual({line["email"] for line in self.cache_lines()}, {"ok@acme.com", "ca-ok@acme.com"})
        self.assert_key_never_leaks(proc)

    def test_missing_key_sends_nothing(self):
        proc = self.run_cli(str(self.input), "--out", str(self.out), key="")
        self.assertEqual(proc.returncode, 1)
        self.assertIn("GIGGAL_API_KEY is not set", proc.stderr)
        self.assertEqual(self.log_lines(), [])
        self.assertFalse(self.out.exists())

    def test_dry_run_makes_no_calls(self):
        self.first_run()
        self.log.unlink()
        self.out.unlink()
        proc = self.run_cli(str(self.input), "--out", str(self.out), "--cache", str(self.cache), "--dry-run")
        self.assertEqual(proc.returncode, 0, proc.stderr)
        self.assertIn("6 fresh cache hits, 2 to verify", proc.stdout)
        self.assertIn("1 batch job", proc.stdout)
        self.assertEqual(self.log_lines(), [])
        self.assertFalse(self.out.exists())

    # ---- single address and credits ----
    def test_verify_one_address(self):
        proc = self.run_cli("--verify", "CA-OK@acme.com")
        self.assertEqual(proc.returncode, 0, proc.stderr)
        shown = json.loads(proc.stdout)
        self.assertEqual((shown["gate"], shown["raw_status"], shown["is_catch_all"]), ("valid", "deliverable", "true"))
        self.assertEqual(shown["verified_by"], "giggal")
        self.assertEqual(self.calls(), ["ca-ok@acme.com"])

    def test_verify_one_uses_the_inline_catchall_verdict(self):
        self.scenario_with(emails={"x@acme.com": result("accept_all", score=60, catch_all=True, catch_all_verdict="invalid")})
        proc = self.run_cli("--verify", "x@acme.com")
        self.assertEqual(proc.returncode, 0, proc.stderr)
        shown = json.loads(proc.stdout)
        self.assertEqual((shown["gate"], shown["raw_status"]), ("invalid", "accept_all"))

    def test_verify_one_rejects_junk_without_a_call(self):
        proc = self.run_cli("--verify", "not-an-email")
        self.assertEqual(proc.returncode, 2)
        self.assertEqual(self.log_lines(), [])

    def test_credits_is_the_free_endpoint(self):
        proc = self.run_cli("--credits")
        self.assertEqual(proc.returncode, 0, proc.stderr)
        self.assertEqual(self.log_lines(), ["credits"])
        self.assertIn('"balance":1000', proc.stdout)
        self.assert_key_never_leaks(proc)

    # ---- client mirror, newest-wins, missing-cache warning (the cache is append-only live state) ----
    def sandbox(self, rows=(("Ok", "ok@acme.com"), ("Bad", "bad@acme.com"))):
        """A throwaway outbound/ tree: the CLI resolves ../profiles from its own folder, so a copy of it
        under tmp/sbx/outbound/scripts keeps every cache file out of the real outbound/profiles."""
        scripts = self.tmp / "sbx" / "outbound" / "scripts"
        scripts.mkdir(parents=True)
        cli = scripts / "giggal_verify.mjs"
        shutil.copy(CLI, cli)
        profiles = self.tmp / "sbx" / "outbound" / "profiles"
        (profiles / "acme-co").mkdir(parents=True)
        inp = profiles / "acme-co" / "leads.csv"
        self.write_input(inp, rows)
        return cli, profiles, inp

    def run_sbx(self, cli, inp, *args, key=FAKE_KEY):
        return self.run_cli(str(inp), "--out", str(self.out), *self.fast("--retries", "0"), *args, key=key, cli=cli)

    def test_client_mirror_written_and_shared_cache_warning(self):
        cli, profiles, inp = self.sandbox()
        shared = profiles / "_cache" / "verify-cache.jsonl"
        mirror = profiles / "acme-co" / "verify-cache.jsonl"
        proc = self.run_sbx(cli, inp)
        self.assertEqual(proc.returncode, 0, proc.stderr)
        self.assertIn("WARNING: the verification cache", proc.stderr)      # shared cache missing: loud, not silent
        self.assertIn("does not exist", proc.stderr)
        self.assertEqual({r["email"] for r in self.jsonl(shared)}, {"ok@acme.com", "bad@acme.com"})
        self.assertEqual(self.jsonl(mirror), self.jsonl(shared))            # every verdict mirrored to the client copy
        self.assertNotIn(FAKE_KEY, mirror.read_text(encoding="utf-8"))
        # second run: shared cache exists, no warning, nothing re-bought, nothing appended
        self.log.unlink()
        before = (shared.read_bytes(), mirror.read_bytes())
        proc = self.run_sbx(cli, inp)
        self.assertEqual(proc.returncode, 0, proc.stderr)
        self.assertNotIn("WARNING", proc.stderr)
        self.assertEqual(self.calls(), [])
        self.assertEqual((shared.read_bytes(), mirror.read_bytes()), before)

    def test_deleted_shared_cache_is_survived_through_the_client_copy(self):
        cli, profiles, inp = self.sandbox()
        shared = profiles / "_cache" / "verify-cache.jsonl"
        mirror = profiles / "acme-co" / "verify-cache.jsonl"
        self.assertEqual(self.run_sbx(cli, inp).returncode, 0)
        shared.unlink()                                                      # the failure this guards against
        self.log.unlink()
        proc = self.run_sbx(cli, inp)
        self.assertEqual(proc.returncode, 0, proc.stderr)
        self.assertIn("WARNING", proc.stderr)
        self.assertIn("still read", proc.stderr)                             # the client copy is named as the survivor
        self.assertEqual(self.calls(), [])                                   # no paid call: verdicts came from the mirror
        self.assertTrue(all(r["cache_hit"] == "true" for r in self.out_rows().values()))
        self.assertEqual(len(self.jsonl(mirror)), 2)                         # the mirror was never rewritten

    def test_newest_verified_at_wins_not_the_last_line_or_file(self):
        cli, profiles, inp = self.sandbox((("New", "new@acme.com"), ("Same", "same@acme.com")))
        now = datetime.now(timezone.utc)
        newer = (now - timedelta(days=1)).isoformat()
        older = (now - timedelta(days=30)).isoformat()

        def line(email, raw, gate, at):
            return json.dumps({"email": email, "gate": gate, "raw_status": raw, "verified_at": at, "provider": "giggal"})
        shared = profiles / "_cache" / "verify-cache.jsonl"
        mirror = profiles / "acme-co" / "verify-cache.jsonl"
        shared.parent.mkdir(parents=True)
        # new@: the shared file (read first) holds the newer undeliverable; the client copy (read second) holds an older one
        # same@: one file, the newer deliverable comes first and an older undeliverable line follows it
        shared.write_text("\n".join([line("new@acme.com", "undeliverable", "invalid", newer),
                                     line("same@acme.com", "deliverable", "valid", newer),
                                     line("same@acme.com", "undeliverable", "invalid", older)]) + "\n", encoding="utf-8")
        mirror.write_text(line("new@acme.com", "deliverable", "valid", older) + "\n", encoding="utf-8")
        proc = self.run_sbx(cli, inp)
        self.assertEqual(proc.returncode, 0, proc.stderr)
        self.assertEqual(self.calls(), [])
        out = self.out_rows()
        self.assertEqual(out["New"]["email_status"], "invalid")
        self.assertEqual(out["New"]["cache_hit"], "true")
        self.assertEqual(out["Same"]["email_status"], "valid")
        # and the other way round: the client copy is newer than the shared one
        shared.write_text(line("new@acme.com", "deliverable", "valid", older) + "\n", encoding="utf-8")
        mirror.write_text(line("new@acme.com", "undeliverable", "invalid", newer) + "\n", encoding="utf-8")
        self.assertEqual(self.run_sbx(cli, inp).returncode, 0)
        self.assertEqual(self.out_rows()["New"]["email_status"], "invalid")

    def test_no_mirror_without_a_client_folder_or_with_no_cache(self):
        cli, profiles, inp = self.sandbox()
        mirror = profiles / "acme-co" / "verify-cache.jsonl"
        self.assertEqual(self.run_sbx(cli, inp, "--no-cache").returncode, 0)
        self.assertFalse(mirror.exists())
        self.assertFalse((profiles / "_cache").exists())
        # an input under a shared _folder has no client to mirror to
        shared_in = profiles / "_cache" / "batch.csv"
        shared_in.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy(inp, shared_in)
        self.assertEqual(self.run_sbx(cli, shared_in).returncode, 0)
        self.assertFalse(mirror.exists())
        self.assertEqual({p.name for p in (profiles / "_cache").iterdir()}, {"batch.csv", "verify-cache.jsonl"})


if __name__ == "__main__":
    unittest.main()
