"""Offline tests for research/spider_fit_fetch.mjs.

The CLI runs in a node child process against a local fake Spider server (SPIDER_API_BASE_FOR_TEST), so no network call is
made and no credit is spent. The fake key is passed through the child's environment. Fixtures live in a temp dir.
"""
import csv
import json
import os
import shutil
import subprocess
import tempfile
import threading
import unittest
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parents[1]
CLI = SCRIPTS / "research" / "spider_fit_fetch.mjs"
NODE = shutil.which("node")
FAKE_KEY = "sk-fake-SECRET-0001"
GOOD = "Acme builds payroll software for restaurants and bars across Texas. " * 20
CALLS = []


class FakeSpider(BaseHTTPRequestHandler):
    balance = 100000.0

    def log_message(self, *a):
        pass

    def _send(self, code, body):
        raw = json.dumps(body).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def do_GET(self):
        if self.path == "/data/credits":
            return self._send(200, {"data": {"credits": FakeSpider.balance}})
        self._send(404, {})

    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))) or "{}")
        url = body["url"]
        CALLS.append(url)
        if "broke" in url:
            return self._send(402, {"error": "insufficient credits"})
        cost = {"costs": {"total_cost": 0.0008}}
        if "thin" in url:
            return self._send(200, [{"url": url, "content": "Hello", **cost}])
        if "moved" in url:
            return self._send(200, [{"url": "https://elsewhere.org/", "content": GOOD, **cost}])
        if "parked" in url:
            return self._send(200, [{"url": url, "content": "This domain is for sale. Buy this domain today. " * 15, **cost}])
        self._send(200, [{"url": url, "content": GOOD, **cost}])


@unittest.skipIf(NODE is None, "node is not on PATH")
class SpiderFitFetchTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = HTTPServer(("127.0.0.1", 0), FakeSpider)
        cls.port = cls.server.server_address[1]
        threading.Thread(target=cls.server.serve_forever, daemon=True).start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()

    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self.out = self.tmp / "run"
        CALLS.clear()
        FakeSpider.balance = 100000.0

    def tearDown(self):
        shutil.rmtree(self.tmp, ignore_errors=True)

    def csv(self, rows, name="tam.csv", cols=("company_domain", "company_name", "industry")):
        p = self.tmp / name
        with open(p, "w", newline="", encoding="utf-8") as f:
            w = csv.writer(f)
            w.writerow(cols)
            w.writerows(rows)
        return p

    def run_cli(self, cmd, *extra, env=None):
        e = {**os.environ, "SPIDER_API_KEY": FAKE_KEY, "SPIDER_API_BASE_FOR_TEST": f"http://127.0.0.1:{self.port}"}
        e.update(env or {})
        r = subprocess.run([NODE, str(CLI), cmd, *extra], capture_output=True, text=True, env=e, timeout=120)
        try:
            body = json.loads(r.stdout)
        except Exception:
            body = {"raw": r.stdout}
        return r.returncode, body, r.stderr

    def base(self, p):
        return ["--input", str(p), "--out-dir", str(self.out)]

    def test_dry_run_estimates_and_spends_nothing(self):
        p = self.csv([("a.com", "A", "x"), ("b.com", "B", "x")])
        code, body, _ = self.run_cli("fetch", *self.base(p), "--dry-run")
        self.assertEqual(code, 0)
        self.assertEqual(body["plan"]["estimate_credits"], 16)
        self.assertEqual(CALLS, [])

    def test_balance_short_stops_before_any_spend(self):
        p = self.csv([("a.com", "A", "x"), ("b.com", "B", "x")])
        FakeSpider.balance = 10
        code, body, _ = self.run_cli("fetch", *self.base(p))
        self.assertEqual(code, 3)
        self.assertEqual(CALLS, [])
        self.assertEqual(list((self.out / "site").glob("*.json")), [])

    def test_fetch_caches_and_resume_is_free(self):
        p = self.csv([("a.com", "A", "x"), ("thin.com", "T", "x"), ("moved.com", "M", "x"), ("parked.com", "P", "x")])
        code, body, _ = self.run_cli("fetch", *self.base(p))
        self.assertEqual(code, 0)
        self.assertEqual(body["site_status"], {"ok": 1, "thin": 1, "redirect": 1, "parked": 1})
        self.assertEqual(len(CALLS), 4)
        code, body, _ = self.run_cli("fetch", *self.base(p), "--dry-run")
        self.assertEqual(body["plan"]["estimate_credits"], 0)
        self.assertFalse(body["plan"]["would_stop"])
        CALLS.clear()
        FakeSpider.balance = 0
        code, _, _ = self.run_cli("fetch", *self.base(p))
        self.assertEqual(code, 0)
        self.assertEqual(CALLS, [])

    def test_provided_site_text_skips_spider(self):
        p = self.csv([("a.com", "A", "x", GOOD)], cols=("company_domain", "company_name", "industry", "site_text"))
        code, body, _ = self.run_cli("fetch", *self.base(p), "--site-text-field", "site_text")
        self.assertEqual(code, 0)
        self.assertEqual(CALLS, [])
        self.assertEqual(body["site_status"], {"ok": 1})

    def test_402_during_run_stops_with_exit_3(self):
        p = self.csv([("broke.com", "B", "x")])
        code, body, _ = self.run_cli("fetch", *self.base(p))
        self.assertEqual(code, 3)
        self.assertEqual(body["stopped"]["tool"], "spider")

    def test_contacts_file_and_duplicates_refused(self):
        p = self.csv([("a.com", "x@a.com")], cols=("company_domain", "email"))
        code, body, _ = self.run_cli("fetch", *self.base(p), "--dry-run")
        self.assertEqual(code, 1)
        self.assertIn("contacts file", body["error"])
        p = self.csv([("a.com", "A", "x"), ("A.com", "A", "x")], name="dup.csv")
        code, body, _ = self.run_cli("fetch", *self.base(p), "--dry-run")
        self.assertEqual(code, 1)

    def test_cap_and_model_flags_refused(self):
        p = self.csv([("a.com", "A", "x")])
        self.assertEqual(self.run_cli("fetch", *self.base(p), "--spider-credit-cap", "5")[0], 1)
        self.assertEqual(self.run_cli("fetch", *self.base(p), "--model", "x")[0], 1)

    def test_batch_then_merge_with_count_check_and_offer_fit_rule(self):
        p = self.csv([("a.com", "A", "x"), ("b.com", "B", "x"), ("c.com", "C", "x"), ("d.com", "D", "x")])
        self.assertEqual(self.run_cli("fetch", *self.base(p))[0], 0)
        code, body, _ = self.run_cli("batch", *self.base(p), "--per-batch", "3")
        self.assertEqual((code, body["batches"]), (0, 2))
        text = (self.out / "batches" / "b001.txt").read_text(encoding="utf-8")
        self.assertIn("### a.com", text)
        self.assertIn("WEBSITE_TEXT: Acme builds payroll", text)
        res = self.out / "out"
        res.mkdir()
        hdr = "company_domain,fit_status,fit_confidence,fit_reason,offer_fit,offer_fit_reason\n"
        (res / "b001.csv").write_text(hdr + "a.com,good,0.9,fits,yes,ok\nb.com,good,0.8,fits,no,sells to the same buyer\nc.com,maybe,oops,bad,yes,x\n", encoding="utf-8")
        code, body, _ = self.run_cli("merge", *self.base(p))
        self.assertEqual(code, 4)
        self.assertEqual(body["rows_without_verdict"], 2)
        rows = {r["company_domain"]: r for r in csv.DictReader(open(self.out / "results.csv", encoding="utf-8"))}
        self.assertEqual((rows["a.com"]["fit_status"], rows["a.com"]["ship"]), ("good", "yes"))
        self.assertEqual((rows["b.com"]["fit_status"], rows["b.com"]["bad_cause"], rows["b.com"]["ship"]), ("bad", "offer_fit", "no"))
        self.assertEqual(rows["c.com"]["verdict_missing"], "yes")
        (res / "b002.csv").write_text(hdr + "c.com,maybe,0.7,mixed,unclear,x\nd.com,bad,0.95,wrong,yes,x\n", encoding="utf-8")
        code, body, _ = self.run_cli("merge", *self.base(p))
        self.assertEqual(code, 0)
        self.assertEqual(body["shipped"], 2)

    def test_batch_refuses_when_homepages_not_fetched(self):
        p = self.csv([("a.com", "A", "x")])
        code, body, _ = self.run_cli("batch", *self.base(p))
        self.assertEqual(code, 1)
        self.assertEqual(CALLS, [])


if __name__ == "__main__":
    unittest.main()
