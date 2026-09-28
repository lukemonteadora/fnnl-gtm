import contextlib
import io
import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import phase_state as ps  # noqa: E402


def run(*argv):
    out = io.StringIO()
    code = 0
    old = sys.argv
    sys.argv = ["phase_state.py", *map(str, argv)]
    try:
        with contextlib.redirect_stdout(out):
            ps.main()
    except SystemExit as e:
        code = e.code or 0
    finally:
        sys.argv = old
    return code, out.getvalue()


class PhaseStateTest(unittest.TestCase):
    def setUp(self):
        # Every test runs against a temp profiles folder, never a real client profile.
        self.tmp = tempfile.TemporaryDirectory()
        self.real_profiles = ps.PROFILES
        ps.PROFILES = self.tmp.name

    def tearDown(self):
        ps.PROFILES = self.real_profiles
        self.tmp.cleanup()

    def handoff(self, slug, name):
        d = os.path.join(self.tmp.name, slug, "phases")
        os.makedirs(d, exist_ok=True)
        with open(os.path.join(d, name), "w", encoding="utf-8") as f:
            f.write("# handoff\n")
        return f"phases/{name}"

    def test_new_client_starts_only_at_phase_1(self):
        self.assertEqual(run("start", "acme", 2)[0], 2)
        self.assertEqual(run("start", "acme", 1)[0], 0)
        self.assertTrue(os.path.exists(ps.path_for("acme")))

    def test_full_cycle_and_freeze(self):
        run("start", "acme", 1)
        self.assertEqual(run("checkpoint", "acme", 1, "--handoff", "phases/missing.md")[0], 3)
        h = self.handoff("acme", "phase-1-onboarding.md")
        self.assertEqual(run("checkpoint", "acme", 1, "--handoff", h)[0], 0)
        code, out = run("start", "acme", 2)
        self.assertEqual(code, 3)
        self.assertIn("checkpoint is open", out)
        self.assertEqual(run("approve", "acme", 1, "--answer", "ICP ok")[0], 0)
        s = ps.load("acme")
        self.assertEqual(s["phases"][1]["status"], "approved")
        self.assertEqual(s["current_phase"], 2)
        self.assertEqual(run("start", "acme", 1)[0], 3)
        self.assertEqual(run("start", "acme", 2)[0], 0)

    def test_lock_blocks_a_second_thread(self):
        os.makedirs(os.path.join(self.tmp.name, "acme"))
        run("place", "acme", "--phase", "2", "--status", "not_started")
        run("start", "acme", 2)
        s = ps.load("acme")
        s["phases"][2]["status"] = "approved"
        ps.save("acme", s, "test")
        code, out = run("start", "acme", 3)
        self.assertEqual(code, 3)
        self.assertIn("locked", out)

    def test_reopen_marks_later_phases(self):
        os.makedirs(os.path.join(self.tmp.name, "acme"))
        run("place", "acme", "--phase", "3", "--status", "approved")
        self.assertEqual(run("reopen", "acme", 2, "--reason", "client vetoed offer")[0], 0)
        s = ps.load("acme")
        self.assertEqual(s["phases"][2]["status"], "reopened")
        self.assertEqual(s["phases"][3]["status"], "needs_review")
        self.assertEqual(s["current_phase"], 2)

    def test_approve_4_goes_post_launch_and_board_lists_all(self):
        os.makedirs(os.path.join(self.tmp.name, "acme"))
        run("place", "acme", "--phase", "4", "--status", "checkpoint_shown")
        code, out = run("approve", "acme", 4, "--answer", "drafts reviewed")
        self.assertEqual(code, 0)
        self.assertIn("PAUSED drafts", out)
        self.assertIn("operator", out)
        self.assertEqual(ps.load("acme")["current_phase"], "post_launch")
        os.makedirs(os.path.join(self.tmp.name, "beta"))
        code, out = run("board")
        self.assertEqual(code, 0)
        self.assertIn("post-launch", out)
        self.assertIn("not placed", out)


if __name__ == "__main__":
    unittest.main()
