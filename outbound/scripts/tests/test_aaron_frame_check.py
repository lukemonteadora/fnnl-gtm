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
    seq["subject"] = "Question About Renewals"                 # breaks S1 (case), still 3 words so it clears
                                                                 # the word-count check first (aaron-flow.md section 13)
    seq["email_1_variants"][0]["frame"] = "F1 + P1"            # combination written into frame
    seq["email_1_variants"][1]["frame"] = None                 # no frame named
    seq["follow_ups"][0]["body"] = "interested in a free renewal risk report? Following up on my last email.\n"
    return data


FN = "{{first_name}}"
# Aaron flow additions (see aaron-flow.md): F11 live, F11-v2, FU5, the P3 third form.
F11_BODY = (f"{FN}, if I had a way to drive a high volume of the logistics teams looking for route software to "
            "your trial sign-up page, and you only pay per unique trial sign-up, would that be worth a quick test?")
F11V2_LINES = [
    f"{FN}, do you currently offer a trial?",
    "Asking as I found a way to source a high volume of logistics teams who are looking for route software.",
    "Thinking I could direct them to your trial sign-up page and we could sort out an affiliate partnership "
    "if you're open to that kind of thing.",
]
F3_BODY = f"{FN}, if we could build a free route audit for your team, would that be worth sharing more?"
FU5_BODY = (f"{FN}, if it's easier, I can send over a quick video elaborating on how we drive logistics teams "
            "to your trial sign-up page.")


def campaign_call(variants, subject="your trial", subject_frame="S5", follow_ups=None):
    return {
        "aaron_campaign_call": {
            "campaigns": [
                {
                    "campaign_slug": "synthetic",
                    "launch": "now",
                    "why": "unit test",
                    "sequence": {
                        "subject": subject,
                        "subject_frame": subject_frame,
                        "email_1_variants": variants,
                        "follow_ups": follow_ups or [],
                    },
                },
            ],
        }
    }


class FrameCheckTest(unittest.TestCase):
    def setUp(self):
        afc.results.clear()
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

    def f2_call(self, second_body):
        data = passing_call()
        seq = data["aaron_campaign_call"]["campaigns"][0]["sequence"]
        ps = "PS, the audit takes you two minutes to skim.\n"
        seq["email_1_variants"] = [
            {"label": "A", "frame": "F2", "ps": "P2", "line_two": None, "body": (
                "{{first_name}}, if we could build you a no-cost renewal risk report that ranks each account, "
                "would that be useful?\n\n" + ps)},
            {"label": "B", "frame": "F2", "ps": "P2", "line_two": None, "body": second_body + "\n\n" + ps},
        ]
        return data

    def test_f2_accepts_leading_first_name_and_ignores_it_for_cta(self):
        no_name = ("If we could build you a no-cost renewal risk report that ranks each account, "
                   "would that be useful?")
        code, out = self.run_check([self.write_yaml("f2.yaml", self.f2_call(no_name))])
        self.assertEqual(code, 0, out)
        self.assertNotIn("different CTAs", out)
        self.assertIn("FAIL 0", out)

    def test_f2_still_rejects_a_different_cta(self):
        other = ("{{first_name}}, if we could build you a no-cost renewal risk report that ranks each account, "
                 "would that be worth a look?")
        code, out = self.run_check([self.write_yaml("f2bad.yaml", self.f2_call(other))])
        self.assertEqual(code, 1, out)
        self.assertIn("does not keep F2's fixed words", out)

    def test_f7_control_comparison_ignores_leading_first_name(self):
        line = "if we could audit, map and score one free renewal risk report for you, would that be worth sharing more?"
        data = passing_call()
        seq = data["aaron_campaign_call"]["campaigns"][0]["sequence"]
        seq["email_1_variants"] = [
            {"label": "A", "frame": "F3", "ps": None, "line_two": None, "body": "If we could audit, map and score one free renewal risk report for you, would that be worth sharing more?\n"},
            {"label": "B", "frame": "F7", "ps": None, "line_two": "F3", "body": (
                "Renewal season keeps catching accounts off guard.\n\n{{first_name}}, " + line + "\n")},
        ]
        code, out = self.run_check([self.write_yaml("f7name.yaml", data)])
        self.assertEqual(code, 0, out)
        self.assertNotIn("differs from the control", out)

    def test_missing_record_exits_2(self):
        code, out = self.run_check(["--client", "nobody", "--profiles-dir", str(self.dir)])
        self.assertEqual(code, 2)
        self.assertIn("record not found", out)
        self.assertTrue(out.strip().endswith(os.path.join("nobody", "aaron-copy-call.md")))

    # --- Aaron flow additions (see aaron-flow.md): F11 live, F11-v2, FU5, P3 third form ---

    def test_f11_live_passes_on_exact_fixed_words(self):
        afc.check_email({"label": "A", "frame": "F11", "body": F11_BODY}, "c E1-A")
        self.assertFalse([r for r in afc.results if r[0] == "FAIL"], afc.results)
        self.assertIn(("PASS", "c E1-A", "F11"), afc.results)

    def test_f11_without_its_fixed_cta_fails(self):
        body = F11_BODY.replace("would that be worth a quick test?", "worth a quick chat?")
        afc.check_email({"label": "A", "frame": "F11", "body": body}, "c E1-A")
        self.assertTrue([r for r in afc.results if r[0] == "FAIL"])

    def test_f11_v2_blank_line_layout_passes(self):
        afc.check_email({"label": "B", "frame": "F11-v2", "body": "\n\n".join(F11V2_LINES)}, "c E1-B")
        self.assertFalse([r for r in afc.results if r[0] == "FAIL"], afc.results)

    def test_f11_v2_single_newline_layout_passes(self):
        afc.check_email({"label": "B", "frame": "F11-v2", "body": "\n".join(F11V2_LINES)}, "c E1-B")
        self.assertFalse([r for r in afc.results if r[0] == "FAIL"], afc.results)

    def test_f11_v2_connecting_word_after_asking_is_free(self):
        for word in ("Asking because I found", "Asking I found"):
            afc.results.clear()
            lines = [F11V2_LINES[0], F11V2_LINES[1].replace("Asking as I found", word), F11V2_LINES[2]]
            afc.check_email({"label": "B", "frame": "F11-v2", "body": "\n\n".join(lines)}, "c E1-B")
            self.assertFalse([r for r in afc.results if r[0] == "FAIL"], (word, afc.results))

    def test_f11_v2_without_partnership_close_fails(self):
        lines = F11V2_LINES[:2] + ["Thinking I could direct them to your trial sign-up page. Worth a chat?"]
        afc.check_email({"label": "B", "frame": "F11-v2", "body": "\n\n".join(lines)}, "c E1-B")
        self.assertTrue([r for r in afc.results if r[0] == "FAIL"])

    def test_p3_third_form_passes(self):
        ps = ("PS, we've actually just run this exact same process for a freight SaaS who ended up getting "
              "212 trials in 30 days.")
        afc.check_email({"label": "A", "frame": "F3", "ps": "P3", "body": F3_BODY + "\n\n" + ps}, "c E1-A")
        self.assertFalse([r for r in afc.results if r[0] == "FAIL"], afc.results)

    def test_p3_third_form_with_spoken_ran_fails(self):
        # the frame's fixed word is "run", not the spoken "ran"
        ps = ("PS, we've actually just ran this exact same process for a freight SaaS who ended up getting "
              "212 trials in 30 days.")
        afc.check_email({"label": "A", "frame": "F3", "ps": "P3", "body": F3_BODY + "\n\n" + ps}, "c E1-A")
        self.assertTrue([r for r in afc.results if r[0] == "FAIL"])

    def test_p3_first_two_forms_still_pass(self):
        for ps in ("PS tested this for a freight SaaS recently. They booked 40 demos.",
                   "PS, Acme went from 10 to 40 demos using this exact process."):
            afc.results.clear()
            afc.check_email({"label": "A", "frame": "F3", "ps": "P3", "body": F3_BODY + "\n\n" + ps}, "c E1-A")
            self.assertFalse([r for r in afc.results if r[0] == "FAIL"], (ps, afc.results))

    def test_fu5_passes_and_is_standalone(self):
        afc.check_follow({"step": 2, "frame": "FU5", "body": FU5_BODY}, "c step 2")
        self.assertFalse([r for r in afc.results if r[0] == "FAIL"], afc.results)
        self.assertIn(("PASS", "c step 2", "FU5"), afc.results)

    def test_fu5_pointing_back_at_email_1_fails(self):
        body = FU5_BODY.replace("if it's easier,", "if it's easier than my last email,")
        afc.check_follow({"step": 2, "frame": "FU5", "body": body}, "c step 2")
        self.assertTrue([r for r in afc.results if r[0] == "FAIL"])

    def test_fu5_with_other_words_fails(self):
        body = f"{FN}, I can record a video on how we drive logistics teams to your trial page."
        afc.check_follow({"step": 2, "frame": "FU5", "body": body}, "c step 2")
        self.assertTrue([r for r in afc.results if r[0] == "FAIL"])

    # --- subject rule: two or three lowercase words, no word cap on the frame itself (aaron-flow.md section 13) ---

    def test_s6_quick_idea_passes(self):
        data = campaign_call([{"label": "A", "frame": "F11", "body": F11_BODY}],
                              subject="quick idea", subject_frame="S6")
        code, out = self.run_check([self.write_yaml("s6.yaml", data)])
        self.assertEqual(code, 0, out)

    def test_s6_other_words_fail(self):
        data = campaign_call([{"label": "A", "frame": "F11", "body": F11_BODY}],
                              subject="quick thought", subject_frame="S6")
        code, out = self.run_check([self.write_yaml("s6bad.yaml", data), "--quiet"])
        self.assertEqual(code, 1)
        self.assertIn("does not keep S6", out)

    def test_four_word_subject_fails_on_word_count_not_the_old_four_word_cap(self):
        data = campaign_call([{"label": "A", "frame": "F11", "body": F11_BODY}],
                              subject="question about your free trial", subject_frame="S1")
        code, out = self.run_check([self.write_yaml("s1long.yaml", data), "--quiet"])
        self.assertEqual(code, 1)
        self.assertIn("allows 2 or 3", out)

    def test_three_word_subject_passes(self):
        data = campaign_call([{"label": "A", "frame": "F11", "body": F11_BODY}],
                              subject="question about trials", subject_frame="S1")
        code, out = self.run_check([self.write_yaml("s1ok.yaml", data)])
        self.assertEqual(code, 0, out)

    def test_unknown_subject_frame_names_s1_to_s6(self):
        data = campaign_call([{"label": "A", "frame": "F11", "body": F11_BODY}],
                              subject="hello there", subject_frame="S7")
        code, out = self.run_check([self.write_yaml("s7.yaml", data), "--quiet"])
        self.assertEqual(code, 1)
        self.assertIn("S1 to S6", out)

    # --- T5 shared-CTA exception: an F11-v2 arm run against an F11 arm keeps its own close ---

    def test_t5_f11_against_f11_v2_passes_the_shared_cta_check(self):
        variants = [{"label": "A", "frame": "F11", "body": F11_BODY},
                    {"label": "B", "frame": "F11-v2", "body": "\n\n".join(F11V2_LINES)}]
        code, out = self.run_check([self.write_yaml("t5.yaml", campaign_call(variants))])
        self.assertEqual(code, 0, out)
        self.assertNotIn("different CTAs", out)

    def test_f11_v2_against_a_non_f11_arm_still_fails_the_shared_cta_check(self):
        variants = [{"label": "A", "frame": "F3", "body": F3_BODY},
                    {"label": "B", "frame": "F11-v2", "body": "\n\n".join(F11V2_LINES)}]
        code, out = self.run_check([self.write_yaml("t5bad.yaml", campaign_call(variants)), "--quiet"])
        self.assertEqual(code, 1)
        self.assertIn("different CTAs", out)

    def test_two_f11_arms_with_different_slot_fills_share_one_cta(self):
        # a one-sentence frame (F11) is its whole body, so only the closing clause after the last comma counts
        other = F11_BODY.replace("logistics teams looking for route software", "fleet managers comparing dispatch tools")
        variants = [{"label": "A", "frame": "F11", "body": F11_BODY}, {"label": "B", "frame": "F11", "body": other}]
        code, out = self.run_check([self.write_yaml("twof11.yaml", campaign_call(variants))])
        self.assertEqual(code, 0, out)
        self.assertNotIn("different CTAs", out)


if __name__ == "__main__":
    unittest.main()
