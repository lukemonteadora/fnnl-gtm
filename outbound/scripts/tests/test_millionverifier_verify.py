"""Offline tests for millionverifier_verify.mjs.

The real CLI runs in a node child process with mv_fetch_stub.mjs preloaded (node --import), so fetch never reaches
MillionVerifier and no credit is spent. Fixtures are written to a temp dir at run time (CSV files are gitignored).
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
CLI = SCRIPTS / "millionverifier_verify.mjs"
STUB = Path(__file__).resolve().parent / "mv_fetch_stub.mjs"
FAKE_KEY = "fake-mv-key-SECRET-7731"
NODE = shutil.which("node")


def verdict(result, code, **extra):
    body = {"email": "", "result": result, "resultcode": code, "subresult": extra.pop("subresult", "ok"),
            "quality": extra.pop("quality", "good"), "free": extra.pop("free", False), "role": extra.pop("role", False),
            "didyoumean": "", "credits": extra.pop("credits", 500), "error": ""}
    body.update(extra)
    return {"status": 200, "body": body}


SCENARIO = {
    "default": verdict("ok", 1),
    "emails": {
        "ok@acme.com": [verdict("ok", 1, credits=499)],
        "catch@acme.com": [verdict("catch_all", 2, subresult="catch_all")],
        "disp@acme.com": [verdict("disposable", 5)],
        "bad@acme.com": [verdict("invalid", 6)],
        "unk@acme.com": [verdict("unknown", 3)],
        "role@acme.com": [verdict("ok", 1, role=True, free=False, quality="risky")],
        "flaky@acme.com": [{"status": 429, "body": {"error": ""}}, verdict("ok", 1)],
        "down@acme.com": [{"status": 503, "body": {"error": ""}}],
        "mverr@acme.com": [verdict("error", 4, subresult="internal_error")],
        "net@acme.com": [{"throw": "connect ECONNRESET while fetching {url}"}],
    },
}

ROWS = [
    ("Ok", "ok@acme.com"),
    ("Catch", "CATCH@acme.com "),
    ("Dup", " Ok@Acme.com"),
    ("Disp", "disp@acme.com"),
    ("Bad", "bad@acme.com"),
    ("Unk", "unk@acme.com"),
    ("Role", "role@acme.com"),
    ("Flaky", "flaky@acme.com"),
    ("Down", "down@acme.com"),
    ("MvErr", "mverr@acme.com"),
    ("Net", "net@acme.com"),
    ("Blank", ""),
    ("Junk", "not-an-email"),
]

CACHED = {"ok@acme.com", "catch@acme.com", "disp@acme.com", "bad@acme.com", "unk@acme.com", "role@acme.com",
          "flaky@acme.com"}
TRANSIENT = {"down@acme.com", "mverr@acme.com", "net@acme.com"}


@unittest.skipIf(NODE is None, "node is not on PATH")
class MillionVerifierVerifyTest(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp(prefix="mvtest-"))
        self.input = self.tmp / "leads.csv"
        with self.input.open("w", encoding="utf-8", newline="") as fh:
            w = csv.writer(fh)
            w.writerow(["first_name", "email"])
            w.writerows(ROWS)
        self.cache = self.tmp / "cache" / "verify-cache.jsonl"
        self.out = self.tmp / "out.csv"
        self.log = self.tmp / "calls.log"
        self.write_scenario(SCENARIO)

    def tearDown(self):
        shutil.rmtree(self.tmp, ignore_errors=True)

    def write_scenario(self, scenario):
        self.scenario = self.tmp / "scenario.json"
        self.scenario.write_text(json.dumps(scenario), encoding="utf-8")

    def run_cli(self, *args, key=FAKE_KEY):
        env = dict(os.environ)
        env.update({"MILLIONVERIFIER_API_KEY": key, "MV_STUB_SCENARIO": str(self.scenario), "MV_STUB_LOG": str(self.log)})
        cmd = [NODE, "--import", STUB.as_uri(), str(CLI), *args]
        return subprocess.run(cmd, capture_output=True, text=True, env=env, timeout=60)

    def calls(self):
        if not self.log.exists():
            return []
        return [line for line in self.log.read_text(encoding="utf-8").splitlines() if line]

    def out_rows(self):
        with self.out.open(encoding="utf-8", newline="") as fh:
            return {row["first_name"]: row for row in csv.DictReader(fh)}

    def cache_lines(self):
        if not self.cache.exists():
            return []
        return [json.loads(line) for line in self.cache.read_text(encoding="utf-8").splitlines() if line.strip()]

    def assert_key_never_leaks(self, proc):
        for text in (proc.stdout, proc.stderr):
            self.assertNotIn(FAKE_KEY, text)
        for path in (self.out, self.cache):
            if path.exists():
                self.assertNotIn(FAKE_KEY, path.read_text(encoding="utf-8"))

    def first_run(self):
        proc = self.run_cli(str(self.input), "--out", str(self.out), "--cache", str(self.cache),
                            "--backoff-ms", "0", "--retries", "2", "--concurrency", "3", "--usd-per-credit", "0.001")
        self.assertEqual(proc.returncode, 0, proc.stderr)
        return proc

    def test_mapping_dedupe_and_cache_write(self):
        proc = self.first_run()
        rows = self.out_rows()
        expect = {
            "Ok": ("valid", "ok", "false"), "Dup": ("valid", "ok", "false"), "Catch": ("catch_all", "catch_all", "true"),
            "Disp": ("invalid", "disposable", ""), "Bad": ("invalid", "invalid", ""), "Unk": ("unknown", "unknown", ""),
            "Role": ("valid", "ok", "false"), "Flaky": ("valid", "ok", "false"),
            "Down": ("unknown", "error", ""), "MvErr": ("unknown", "error", ""),
            "Net": ("unknown", "error", ""), "Blank": ("no_email", "no_email", ""), "Junk": ("invalid", "malformed", ""),
        }
        for name, (gate, raw, catch) in expect.items():
            with self.subTest(row=name):
                self.assertEqual(rows[name]["email_status"], gate)
                self.assertEqual(rows[name]["verifier_raw_status"], raw)
                self.assertEqual(rows[name]["is_catch_all"], catch)
        self.assertEqual(rows["Role"]["verifier_role"], "true")
        self.assertEqual(rows["Role"]["verifier_quality"], "risky")
        self.assertEqual(rows["Ok"]["verified_by"], "millionverifier")
        self.assertEqual(rows["Ok"]["cache_hit"], "false")
        self.assertTrue(rows["Ok"]["verified_at"])
        self.assertEqual(rows["Blank"]["verified_by"], "")
        self.assertIn("HTTP 503", rows["Down"]["verifier_detail"])
        self.assertIn("resultcode 4", rows["MvErr"]["verifier_detail"])
        self.assertIn("***", rows["Net"]["verifier_detail"])            # the key in the thrown URL was scrubbed
        # cost: the first occurrence of a paid email carries the estimate, its in-file repeat carries 0
        self.assertEqual(rows["Ok"]["cost_usd"], "0.001")
        self.assertEqual(rows["Dup"]["cost_usd"], "0")
        self.assertEqual(rows["Down"]["cost_usd"], "")
        # calls: each distinct plausible email once, retries on transients, none for blank or malformed
        calls = self.calls()
        self.assertEqual(calls.count("ok@acme.com"), 1)
        self.assertEqual(calls.count("flaky@acme.com"), 2)
        for email in TRANSIENT:
            self.assertEqual(calls.count(email), 3, email)          # 1 try + 2 retries
        self.assertNotIn("not-an-email", calls)
        # cache: verdicts only, lowercased, never a transient outcome
        cached = {line["email"]: line for line in self.cache_lines()}
        self.assertEqual(set(cached), CACHED)
        self.assertTrue(all(line["provider"] == "millionverifier" for line in cached.values()))
        self.assertEqual(cached["catch@acme.com"]["raw_status"], "catch_all")
        self.assertIn("lowest value MillionVerifier reported this run: 499", proc.stdout)
        self.assert_key_never_leaks(proc)

    def test_second_run_reuses_cache_and_retries_only_transients(self):
        self.first_run()
        self.log.unlink()
        before = self.cache.read_text(encoding="utf-8")
        proc = self.run_cli(str(self.input), "--out", str(self.out), "--cache", str(self.cache),
                            "--backoff-ms", "0", "--retries", "0")
        self.assertEqual(proc.returncode, 0, proc.stderr)
        self.assertEqual(sorted(self.calls()), sorted(TRANSIENT))
        rows = self.out_rows()
        self.assertEqual(rows["Catch"]["cache_hit"], "true")
        self.assertEqual(rows["Catch"]["email_status"], "catch_all")
        self.assertEqual(rows["Down"]["cache_hit"], "false")
        self.assertEqual(self.cache.read_text(encoding="utf-8"), before)  # nothing new was cacheable
        self.assert_key_never_leaks(proc)

    def test_no_cache_reads_and_writes_nothing(self):
        self.first_run()
        self.log.unlink()
        before = self.cache.read_text(encoding="utf-8")
        proc = self.run_cli(str(self.input), "--out", str(self.out), "--no-cache", "--backoff-ms", "0", "--retries", "0")
        self.assertEqual(proc.returncode, 0, proc.stderr)
        self.assertEqual(len(self.calls()), 10)                       # every distinct plausible email, once
        self.assertEqual(self.cache.read_text(encoding="utf-8"), before)

    def test_stale_cache_entry_is_reverified(self):
        old = (datetime.now(timezone.utc) - timedelta(days=91)).isoformat()
        fresh = (datetime.now(timezone.utc) - timedelta(days=5)).isoformat()
        self.cache.parent.mkdir(parents=True)
        self.cache.write_text("\n".join(json.dumps(line) for line in [
            {"email": "ok@acme.com", "gate": "valid", "raw_status": "ok", "verified_at": old, "provider": "millionverifier"},
            {"email": "bad@acme.com", "gate": "invalid", "raw_status": "invalid", "verified_at": fresh, "provider": "millionverifier"},
            {"email": "unk@acme.com", "gate": "valid", "raw_status": "ok", "verified_at": fresh, "provider": "someothertool"},
        ]) + "\n", encoding="utf-8")
        proc = self.run_cli(str(self.input), "--out", str(self.out), "--cache", str(self.cache), "--backoff-ms", "0", "--retries", "0")
        self.assertEqual(proc.returncode, 0, proc.stderr)
        calls = self.calls()
        self.assertIn("ok@acme.com", calls)        # 91 days old: re-verified
        self.assertNotIn("bad@acme.com", calls)    # 5 days old: reused
        self.assertIn("unk@acme.com", calls)       # another verifier's verdict is not reused
        self.assertEqual(self.out_rows()["Bad"]["cache_hit"], "true")

    def test_fatal_error_writes_partial_output_and_keeps_paid_verdicts(self):
        scenario = json.loads(json.dumps(SCENARIO))
        scenario["emails"]["bad@acme.com"] = [{"status": 200, "body": {"error": f"Insufficient credits for {FAKE_KEY}"}}]
        self.write_scenario(scenario)
        proc = self.run_cli(str(self.input), "--out", str(self.out), "--cache", str(self.cache),
                            "--backoff-ms", "0", "--retries", "0", "--concurrency", "1")
        self.assertEqual(proc.returncode, 1)
        self.assertIn("Stopped early", proc.stderr)
        rows = self.out_rows()
        self.assertEqual(rows["Ok"]["email_status"], "valid")          # verified before the fatal reply
        self.assertEqual(rows["Disp"]["email_status"], "invalid")
        self.assertEqual(rows["Bad"]["verifier_raw_status"], "not_verified")
        self.assertEqual(rows["Unk"]["verifier_raw_status"], "not_verified")
        self.assertEqual({line["email"] for line in self.cache_lines()}, {"ok@acme.com", "catch@acme.com", "disp@acme.com"})
        self.assert_key_never_leaks(proc)

    def test_vendor_test_key_refuses_shared_cache(self):
        proc = self.run_cli(str(self.input), "--out", str(self.out), key="API_KEY_FOR_TEST")
        self.assertEqual(proc.returncode, 2)
        self.assertIn("test key", proc.stderr)
        self.assertEqual(self.calls(), [])
        self.assertFalse(self.out.exists())
        proc = self.run_cli(str(self.input), "--out", str(self.out), "--no-cache", "--backoff-ms", "0", "--retries", "0",
                            key="API_KEY_FOR_TEST")
        self.assertEqual(proc.returncode, 0, proc.stderr)

    def test_dry_run_makes_no_calls(self):
        self.first_run()
        self.log.unlink()
        self.out.unlink()
        proc = self.run_cli(str(self.input), "--out", str(self.out), "--cache", str(self.cache), "--dry-run")
        self.assertEqual(proc.returncode, 0, proc.stderr)
        self.assertIn("7 fresh cache hits, 3 to verify", proc.stdout)
        self.assertEqual(self.calls(), [])
        self.assertFalse(self.out.exists())

    # ---- client mirror, newest-wins, missing-cache warning (the cache is append-only live state) ----
    def sandbox(self, rows=(("Ok", "ok@acme.com"), ("Bad", "bad@acme.com"))):
        """A throwaway outbound/ tree: the CLI resolves ../profiles from its own folder, so a copy of it
        under tmp/sbx/outbound/scripts keeps every cache file out of the real outbound/profiles."""
        scripts = self.tmp / "sbx" / "outbound" / "scripts"
        scripts.mkdir(parents=True)
        cli = scripts / "millionverifier_verify.mjs"
        shutil.copy(CLI, cli)
        profiles = self.tmp / "sbx" / "outbound" / "profiles"
        (profiles / "acme-co").mkdir(parents=True)
        inp = profiles / "acme-co" / "leads.csv"
        with inp.open("w", encoding="utf-8", newline="") as fh:
            w = csv.writer(fh)
            w.writerow(["first_name", "email"])
            w.writerows(rows)
        return cli, profiles, inp

    def run_sbx(self, cli, inp, *args, key=FAKE_KEY):
        env = dict(os.environ)
        env.update({"MILLIONVERIFIER_API_KEY": key, "MV_STUB_SCENARIO": str(self.scenario), "MV_STUB_LOG": str(self.log)})
        cmd = [NODE, "--import", STUB.as_uri(), str(cli), str(inp), "--out", str(self.out),
               "--backoff-ms", "0", "--retries", "0", *args]
        return subprocess.run(cmd, capture_output=True, text=True, env=env, timeout=60)

    @staticmethod
    def jsonl(path):
        if not path.exists():
            return []
        return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]

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
            return json.dumps({"email": email, "gate": gate, "raw_status": raw, "verified_at": at,
                               "provider": "millionverifier"})
        shared = profiles / "_cache" / "verify-cache.jsonl"
        mirror = profiles / "acme-co" / "verify-cache.jsonl"
        shared.parent.mkdir(parents=True)
        # new@: the shared file (read first) holds the newer invalid; the client copy (read second) holds an older ok
        # same@: one file, the newer ok comes first and an older invalid line follows it
        shared.write_text("\n".join([line("new@acme.com", "invalid", "invalid", newer),
                                     line("same@acme.com", "ok", "valid", newer),
                                     line("same@acme.com", "invalid", "invalid", older)]) + "\n", encoding="utf-8")
        mirror.write_text(line("new@acme.com", "ok", "valid", older) + "\n", encoding="utf-8")
        proc = self.run_sbx(cli, inp)
        self.assertEqual(proc.returncode, 0, proc.stderr)
        self.assertEqual(self.calls(), [])
        out = self.out_rows()
        self.assertEqual(out["New"]["email_status"], "invalid")
        self.assertEqual(out["New"]["cache_hit"], "true")
        self.assertEqual(out["Same"]["email_status"], "valid")
        # and the other way round: the client copy is newer than the shared one
        shared.write_text(line("new@acme.com", "ok", "valid", older) + "\n", encoding="utf-8")
        mirror.write_text(line("new@acme.com", "invalid", "invalid", newer) + "\n", encoding="utf-8")
        self.assertEqual(self.run_sbx(cli, inp).returncode, 0)
        self.assertEqual(self.out_rows()["New"]["email_status"], "invalid")

    def test_mirror_keeps_the_provider_filter(self):
        cli, profiles, inp = self.sandbox((("Ok", "ok@acme.com"),))
        mirror = profiles / "acme-co" / "verify-cache.jsonl"
        fresh = datetime.now(timezone.utc).isoformat()
        mirror.write_text(json.dumps({"email": "ok@acme.com", "gate": "invalid", "raw_status": "invalid",
                                      "verified_at": fresh, "provider": "someothertool"}) + "\n", encoding="utf-8")
        proc = self.run_sbx(cli, inp)
        self.assertEqual(proc.returncode, 0, proc.stderr)
        self.assertEqual(self.calls(), ["ok@acme.com"])                      # another verifier's verdict is not reused
        self.assertEqual(self.out_rows()["Ok"]["email_status"], "valid")

    def test_no_mirror_without_a_client_folder_no_cache_or_test_key(self):
        cli, profiles, inp = self.sandbox()
        mirror = profiles / "acme-co" / "verify-cache.jsonl"
        self.assertEqual(self.run_sbx(cli, inp, "--no-cache").returncode, 0)
        self.assertFalse(mirror.exists())
        self.assertFalse((profiles / "_cache").exists())
        # the vendor test key returns random verdicts: not even a scratch --cache run may mirror them to a client
        scratch = self.tmp / "scratch" / "cache.jsonl"
        self.assertEqual(self.run_sbx(cli, inp, "--cache", str(scratch), key="API_KEY_FOR_TEST").returncode, 0)
        self.assertTrue(scratch.exists())
        self.assertFalse(mirror.exists())
        # an input under a shared _folder has no client to mirror to
        shared_in = profiles / "_cache" / "batch.csv"
        shared_in.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy(inp, shared_in)
        self.assertEqual(self.run_sbx(cli, shared_in).returncode, 0)
        self.assertFalse(mirror.exists())
        self.assertEqual({p.name for p in (profiles / "_cache").iterdir()}, {"batch.csv", "verify-cache.jsonl"})

    def test_credits_is_the_free_endpoint(self):
        proc = self.run_cli("--credits")
        self.assertEqual(proc.returncode, 0, proc.stderr)
        self.assertEqual(self.calls(), ["credits"])
        self.assertIn('"credits":1000', proc.stdout)


if __name__ == "__main__":
    unittest.main()
