"""Tests for copy_var_gate.py: a blank copy variable never ships (Aaron flow, aaron-flow.md section 9).

Synthetic rows in temp folders only: no client data, no network, no spend.
Run: python -m unittest tests.test_copy_var_gate
"""
import contextlib
import csv
import importlib.util
import io
import json
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("copy_var_gate", SCRIPTS / "copy_var_gate.py")
gate = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
sys.modules["copy_var_gate"] = gate
SPEC.loader.exec_module(gate)

BODY = "{{first_name}}, want us to get more {{sells_to_vertical}} signing up for {{service_offered}}?\n"
NOVAR_BODY = "{{first_name}}, want us to get more customers signing up?\n"


def variants(fallbacks=None, route=None, body=BODY):
    d = {"name": "t", "sequences": [{"step": 1, "variants": [{"label": "A", "subject": "quick question", "body": body}]},
                                    {"step": 2, "variants": [{"label": "A", "subject": "", "body": "still keen?\n"}]}]}
    if fallbacks is not None:
        d["variable_fallbacks"] = fallbacks
    if route:
        d["blank_variable_route"] = route
    return d


ROWS = [
    {"email": "a@x.com", "first_name": "Ann", "sells_to_vertical": "clinics", "service_offered": "payroll"},
    {"email": "b@x.com", "first_name": "Bo", "sells_to_vertical": "", "service_offered": "billing"},
    {"email": "c@x.com", "first_name": "Cy", "sells_to_vertical": "  ", "service_offered": ""},
]


class GateTest(unittest.TestCase):
    def setUp(self):
        self.d = Path(tempfile.mkdtemp())

    def tearDown(self):
        shutil.rmtree(self.d, ignore_errors=True)

    def run_gate(self, v, rows=ROWS, novar=None, extra=()):
        import yaml
        (self.d / "variants.yaml").write_text(yaml.safe_dump(v), encoding="utf-8")
        with open(self.d / "leads.csv", "w", encoding="utf-8", newline="") as f:
            w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
            w.writeheader()
            w.writerows(rows)
        argv = ["--variants", str(self.d / "variants.yaml"), "--leads", str(self.d / "leads.csv"), "--out-dir", str(self.d / "out"), *extra]
        if novar is not None:
            (self.d / "novar.yaml").write_text(yaml.safe_dump(novar), encoding="utf-8")
            argv += ["--novar-variants", str(self.d / "novar.yaml")]
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            code = gate.main(argv)
        return code, json.loads(buf.getvalue())

    def read(self, name):
        with open(self.d / "out" / name, encoding="utf-8", newline="") as f:
            return list(csv.DictReader(f))

    def test_fallback_fills_every_blank_and_nothing_blank_ships(self):
        code, s = self.run_gate(variants({"sells_to_vertical": "of your customers", "service_offered": "what you sell"}))
        self.assertEqual(code, 0, s)
        up = self.read("leads.upload.csv")
        self.assertEqual(len(up), 3)
        self.assertEqual(up[1]["sells_to_vertical"], "of your customers")
        self.assertEqual(up[2]["service_offered"], "what you sell")
        self.assertEqual(up[0]["copy_var_fallback"], "")
        self.assertEqual(up[2]["copy_var_fallback"], "sells_to_vertical service_offered")
        for r in up:
            for t in ("first_name", "sells_to_vertical", "service_offered"):
                self.assertTrue(r[t].strip())
        self.assertEqual(s["blank_by_variable"]["sells_to_vertical"], 2)
        preview = (self.d / "out" / "fallback-preview.md").read_text(encoding="utf-8")
        self.assertIn("get more of your customers signing up for what you sell?", preview)

    def test_no_fallback_holds_the_row_and_exits_4(self):
        code, s = self.run_gate(variants({"service_offered": "what you sell"}))
        self.assertEqual(code, 4)
        self.assertFalse(s["ok"])
        self.assertTrue(s["alert"].startswith("HELD: 2 of 3"))
        self.assertEqual([r["email"] for r in self.read("leads.upload.csv")], ["a@x.com"])
        held = self.read("leads.held-blank-var.csv")
        self.assertEqual([r["email"] for r in held], ["b@x.com", "c@x.com"])
        self.assertIn("sells_to_vertical", held[0]["held_reason"])

    def test_novar_route_sends_blank_rows_to_the_no_variable_campaign(self):
        nv = variants(body=NOVAR_BODY)
        code, s = self.run_gate(variants(route="novar"), novar=nv)
        self.assertEqual(code, 0, s)
        self.assertEqual([r["email"] for r in self.read("leads.upload.csv")], ["a@x.com"])
        self.assertEqual([r["email"] for r in self.read("leads.novar.csv")], ["b@x.com", "c@x.com"])
        self.assertEqual(s["rows_held"], 0)

    def test_config_errors(self):
        code, s = self.run_gate(variants({"sells_to_vertical": " "}))
        self.assertEqual(code, 1)
        self.assertIn("blank", s["error"])
        code, s = self.run_gate(variants({"sells_to_vertical": "your buyers " + chr(0x2014) + " all of them"}))
        self.assertEqual(code, 1)
        rows = [{k: v for k, v in r.items() if k != "service_offered"} for r in ROWS]
        code, s = self.run_gate(variants({"sells_to_vertical": "x"}), rows=rows)
        self.assertEqual(code, 1)
        self.assertIn("{{service_offered}}", s["error"])
        code, s = self.run_gate(variants(route="novar"))
        self.assertEqual(code, 1)

    def test_check_only_writes_no_lead_files(self):
        code, s = self.run_gate(variants({"sells_to_vertical": "a", "service_offered": "b"}), extra=["--check-only"])
        self.assertEqual(code, 0)
        self.assertFalse((self.d / "out" / "leads.upload.csv").exists())
        self.assertTrue((self.d / "out" / "fallback-preview.md").exists())

    def test_co_prefixed_company_columns_are_read_and_written_bare(self):
        rows = [{"email": r["email"], "first_name": r["first_name"], "co_sells_to_vertical": r["sells_to_vertical"],
                 "co_service_offered": r["service_offered"]} for r in ROWS]
        code, s = self.run_gate(variants({"sells_to_vertical": "of your customers", "service_offered": "what you sell"}), rows=rows)
        self.assertEqual(code, 0, s)
        self.assertEqual(s["read_from_co_columns"], ["sells_to_vertical", "service_offered"])
        up = self.read("leads.upload.csv")
        self.assertEqual(up[0]["sells_to_vertical"], "clinics")
        self.assertEqual(up[1]["sells_to_vertical"], "of your customers")

    def test_sender_signature_is_never_gated_as_a_lead_column(self):
        # PlusVibe fills {{sender_signature}} itself at send time: no lead-file column exists for it (ROWS has
        # none), yet the gate must not treat it as a missing column or a blank variable.
        body = BODY + "\n{{sender_signature}}\n"
        code, s = self.run_gate(variants({"sells_to_vertical": "of your customers", "service_offered": "what you sell"}, body=body))
        self.assertEqual(code, 0, s)
        self.assertNotIn("sender_signature", s["variables_used"])
        up = self.read("leads.upload.csv")
        self.assertEqual(len(up), 3)

    def test_copy_with_no_variables_passes_everything(self):
        code, s = self.run_gate(variants(body="plain question?\n"))
        self.assertEqual(code, 0)
        self.assertEqual(s["rows_upload"], 3)
        self.assertEqual(s["variables_used"], [])


if __name__ == "__main__":
    unittest.main()
