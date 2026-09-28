"""Tests for outbound/scripts/aaron_frame_check.py on synthetic records in a temp dir (no client data)."""
import contextlib
import importlib.util
import io
import os
import sys
import tempfile
import unittest
from pathlib import Path

import yaml


SCRIPT_PATH = Path(__file__).resolve().parents[1] / "aaron_frame_check.py"
SPEC = importlib.util.spec_from_file_location("aaron_frame_check", SCRIPT_PATH)
afc = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
sys.modules["aaron_frame_check"] = afc
SPEC.loader.exec_module(afc)


def passing_call():
    return {
        "aaron_campaign_call": {
            "date": "2026-09-28",
            "campaigns": [
                {
                    "campaign_slug": "demo-renewal",
                    "segment": "all",
                    "offer": "Renewal risk report",
                    "launch": "now",
                    "why": "strongest cluster",
                    "sequence": {
                        "subject": "question about renewals",
                        "subject_frame": "S1",
                        "email_1_variants": [
                            {
                                "label": "A",
                                "frame": "F1",
                                "ps": "P1",
                                "line_two": None,
                                "body": (
                                    "{{first_name}}, if we could audit, map and score one free renewal risk "
                                    "report for you. Would that be worth sharing more?\n\n"
                                    "PS, thought it'd be relevant since your renewal season opens in March.\n"
                                ),
                            },
                            {
                                "label": "B",
                                "frame": "F1",
                                "ps": None,
                                "line_two": None,
                                "body": (
                                    "{{first_name}}, if we could pull, rank and annotate one free renewal risk "
                                    "report for you. Would that be worth sharing more?\n"
                                ),
                            },
                        ],
                        "follow_ups": [
                            {"step": 2, "delay_days": 3, "frame": "FU1", "add": None,
                             "body": "interested in a free renewal risk report?\n"},
                        ],
                    },
                },
                {"campaign_slug": "demo-later", "launch": "later", "why": "wait for proof"},
            ],
            "delivery_replies": [
                {"offer": "Renewal risk report", "frame": "DR",
                 "body": "Great {{first_name}}, here's a link to the report.\n\n[link]\n\nCurious to get your take on it.\n"},
            ],
        }
    }


def failing_call():
    data = passing_call()
    seq = data["aaron_campaign_call"]["campaigns"][0]["sequence"]
    seq["subject"] = "Quick Question About Renewals"          # breaks S1 (case and words)
    seq["email_1_variants"][0]["frame"] = "F1 + P1"            # combination written into frame
    seq["email_1_variants"][1]["frame"] = None                 # no frame named
    seq["follow_ups"][0]["body"] = "interested in a free renewal risk report? Following up on my last email.\n"
    return data


class FrameCheckTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.dir = Path(self.tmp.name)

    def tearDown(self):
        self.tmp.cleanup()

    def run_check(self, argv):
        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            code = afc.main(argv)
        return code, out.getvalue()

    def write_yaml(self, name, data):
        path = self.dir / name
        path.write_text(yaml.safe_dump(data, sort_keys=False), encoding="utf-8")
        return str(path)

    def test_pass_on_bare_yaml(self):
        code, out = self.run_check([self.write_yaml("pass.yaml", passing_call())])
        self.assertEqual(code, 0, out)
        self.assertIn("FAIL 0", out)
        self.assertIn("emails checked: 3", out)

    def test_fail_on_broken_frames(self):
        code, out = self.run_check([self.write_yaml("fail.yaml", failing_call()), "--quiet"])
        self.assertEqual(code, 1, out)
        self.assertIn("does not keep S1", out)
        self.assertIn("combination written into frame", out)
        self.assertIn("no frame named", out)
        self.assertIn("not standalone", out)
        self.assertNotIn("PASS  ", out)  # --quiet hides PASS lines

    def test_client_flag_reads_consult_under_machine_readable_heading(self):
        client = self.dir / "profiles" / "demo-client"
        client.mkdir(parents=True)
        record = yaml.safe_dump(passing_call(), sort_keys=False)
        (client / "aaron-copy-call.md").write_text(
            "# Aaron copy call\n\nHis read.\n\n## Machine-readable record\n\n```yaml\n" + record + "```\n",
            encoding="utf-8",
        )
        code, out = self.run_check(["--client", "demo-client", "--profiles-dir", str(self.dir / "profiles")])
        self.assertEqual(code, 0, out)

    def test_f7_question_opener_fails(self):
        data = passing_call()
        v = data["aaron_campaign_call"]["campaigns"][0]["sequence"]["email_1_variants"][1]
        v.update({"frame": "F7", "line_two": "F1", "body": (
            "Still losing members at renewal?\n\n"
            "{{first_name}}, if we could audit, map and score one free renewal risk report for you. "
            "Would that be worth sharing more?\n")})
        code, out = self.run_check([self.write_yaml("f7.yaml", data)])
        self.assertEqual(code, 1, out)
        self.assertIn("F7 line one is a question", out)

    def test_missing_record_exits_2(self):
        code, out = self.run_check(["--client", "nobody", "--profiles-dir", str(self.dir)])
        self.assertEqual(code, 2)
        self.assertIn("record not found", out)
        self.assertTrue(out.strip().endswith(os.path.join("nobody", "aaron-copy-call.md")))


if __name__ == "__main__":
    unittest.main()
