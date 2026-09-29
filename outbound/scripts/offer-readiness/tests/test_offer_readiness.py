"""End-to-end tests for the Offer Readiness scripts (outbound/reference/offer-readiness.md).

Builds a synthetic client in a temp folder and runs the migration, both builders, the
approval writer and the audit as subprocesses, exactly as the phase skills call them.
Stdlib plus PyYAML only; no network.

    python -m unittest discover -s outbound/scripts/offer-readiness/tests
"""
import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

import yaml

HERE = Path(__file__).resolve().parent
SCRIPTS = HERE.parent

# One agency primary (rank 1) and one client-honored validation arm (rank 2), each stored
# twice: the top-level `offer` block and its priority-1 segment mirror. The segment reuses
# the top-level qualification block through a YAML alias. LF line endings.
PROFILE = """\
business:
  name: Acme Test Co
run_state:
  sending_platform: deferred
offer:
  aaron_rank: 1
  lead_magnet: Free intake audit for dental clinics
  lead_magnet_yes_honored_by: agency
  lead_magnet_client_ok: not_needed  # agency-honored, no approval exists
  lead_magnet_client_dependency: none
  qualification: &q1
    min_employees: 5
  validation_arms:
    - aaron_rank: 2
      rank: 1
      lead_magnet: Free 14-day pilot for dental clinics
      lead_magnet_yes_honored_by: client
      lead_magnet_client_ok: pending
      lead_magnet_client_dependency: "client runs a 14-day pilot"
      status: active
      qualification:
        min_employees: 10
  segments:
    - segment: dental
      priority: 1
      aaron_rank: 1
      lead_magnet: Free intake audit for dental clinics
      lead_magnet_yes_honored_by: agency
      lead_magnet_client_ok: not_needed
      lead_magnet_client_dependency: none
      qualification: *q1
      validation_arms:
        - aaron_rank: 2
          rank: 1
          lead_magnet: Free 14-day pilot for dental clinics
          lead_magnet_yes_honored_by: client
          lead_magnet_client_ok: pending
          lead_magnet_client_dependency: "client runs a 14-day pilot"
          status: active
          qualification:
            min_employees: 10
  test_slate:
    client_response: none
    vetoed_offers: []
  scale_review:
    confirmed_capacity_per_week: null
"""

ACTIVITY_LOG = """\
# Activity log: Acme Test Co

## CURRENT STATE

- Offer locked, arm 2 pending.

## LOG

- [2026-01-04] offer · CREATED: offer block recorded.
"""

CLIENT_ASKS = """\
# Client asks: Acme Test Co

## Current message

Sent: 2026-01-05

> Hi Pat,

- [offer-2] BLOCKS-START: could you run a 14-day pilot for the clinics that say yes?
"""

INTERESTED_REPLY = """\
# Interested reply: dental-pilot

## When to Use

When a prospect says yes.

## Email 1

Great, here is the next step.
"""

VALUES = {"1": {"capacity": {"planned_first_touches_per_week": 500,
                             "positive_reply_rate_guess": "1% GUESS, upstream benchmark",
                             "expected_yeses_per_week": 5,
                             "cap_note": "cap lives in qualification.free_unit_cap_per_week"},
                "sample": {"path": None, "account": None, "prepared": None,
                           "missing": ["operator: pick the sample account"],
                           "reviewed_by": None, "provisional_reason": None}}}

REPLY_NOTES = {
    "wave": 1, "version": "v1",
    "what_counts_as_yes": "Any reply asking for the audit.",
    "never_claim": ["results we have not measured"],
    "handoff_triggers": ["pricing questions"],
    "offers": {"1": {"vars": {"dr": "Here is a link to ${thing}."},
                     "after_yes": "send the audit form",
                     "yes_reply": "${dr} [link]",
                     "turnaround": "2 business days"}},
    "campaigns": {"dental-audit": {"offer": 1, "vars": {"thing": "the intake audit", "vertical": "dental"}}},
}

EVID = ("lead_magnet_client_ok_by", "lead_magnet_client_ok_at", "lead_magnet_client_ok_evidence")


def run(script, *args):
    return subprocess.run([sys.executable, str(SCRIPTS / script), *map(str, args)],
                          capture_output=True, text=True, encoding="utf-8")


def mirrors(profile, rank):
    o = profile["offer"]
    seg = o["segments"][0]
    if rank == 1:
        return [o, seg]
    return [o["validation_arms"][0], seg["validation_arms"][0]]


class OfferReadinessTest(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp(prefix="offer-readiness-"))
        self.d = self.tmp / "acme"
        (self.d / "offers").mkdir(parents=True)
        self.prof = self.d / "client-profile.yaml"
        self.prof.write_bytes(PROFILE.encode("utf-8"))
        (self.d / "activity-log.md").write_bytes(ACTIVITY_LOG.encode("utf-8"))
        (self.d / "client-asks.md").write_bytes(CLIENT_ASKS.encode("utf-8"))
        (self.d / "offers" / "reply-notes.json").write_text(json.dumps(REPLY_NOTES), encoding="utf-8")
        for slug, rank in (("dental-audit", 1), ("dental-pilot", 2)):
            c = self.d / "campaigns" / slug
            c.mkdir(parents=True)
            (c / "leads.verified.csv").write_text(
                "email,company_domain,offer\n"
                f"a@{slug}.example,{slug}.example,{rank}\n"
                f"b@{slug}.example,{slug}.example,{rank}\n", encoding="utf-8")
        (self.d / "campaigns" / "dental-pilot" / "interested-reply.md").write_bytes(INTERESTED_REPLY.encode("utf-8"))
        self.values = self.tmp / "values.json"
        self.values.write_text(json.dumps(VALUES), encoding="utf-8")

    def tearDown(self):
        shutil.rmtree(self.tmp, ignore_errors=True)

    def ok(self, r):
        self.assertEqual(r.returncode, 0, f"stdout:\n{r.stdout}\nstderr:\n{r.stderr}")
        return r.stdout

    def load(self):
        return yaml.safe_load(self.prof.read_text(encoding="utf-8"))

    def migrate_and_build(self):
        out = self.ok(run("readiness_fields.py", self.prof, "--values", self.values))
        self.assertIn("evidence blocks added: 4", out)
        self.ok(run("build_readiness.py", self.d))
        self.ok(run("build_reply_playbook.py", self.d))

    # The migration: evidence trio in every mirror, idempotent, LF kept, caps added in place.
    def test_migration_layout_and_idempotence(self):
        self.ok(run("readiness_fields.py", self.prof, "--values", self.values))
        raw = self.prof.read_bytes()
        self.assertNotIn(b"\r\n", raw)
        lines = raw.decode("utf-8").splitlines()
        oks = [i for i, l in enumerate(lines) if l.lstrip().startswith("lead_magnet_client_ok:")]
        self.assertEqual(len(oks), 4)
        for i in oks:
            col = len(lines[i]) - len(lines[i].lstrip())
            for k, key in enumerate(EVID, 1):
                self.assertEqual(lines[i + k], " " * col + key + ": null")
        p = self.load()
        for b in mirrors(p, 1):
            self.assertEqual(b["delivery_mode"], "agency")
            self.assertEqual(b["capacity"]["expected_yeses_per_week"], 5)
            self.assertIn("free_unit_cap_per_week", b["qualification"])  # alias inherits
        for b in mirrors(p, 2):
            self.assertIsNone(b["delivery_mode"])
            self.assertIn("free_unit_cap_per_week", b["qualification"])
        again = self.ok(run("readiness_fields.py", self.prof))
        self.assertIn("evidence blocks added: 0, already present: 4", again)
        self.assertEqual(self.prof.read_bytes(), raw)

    # Build + verify on the fresh profile, then a yes on the pending arm.
    def test_build_verify_then_yes(self):
        self.migrate_and_build()
        board = (self.d / "offers" / "_readiness-board.md").read_text(encoding="utf-8")
        self.assertIn("| 1 | Free intake audit for dental clinics | agency | not_needed |", board)
        self.assertIn("| 2 | Free 14-day pilot for dental clinics | None | pending | BLOCKED |", board)
        self.assertIn("Nudge draft for the operator", board)
        self.assertTrue((self.d / "offers" / "offer-2" / "readiness.md").exists())
        # Offer 1's campaign has no interested-reply.md yet, so its notes are staged; offer 2's go in place.
        staged = (self.d / "offers" / "reply-notes" / "dental-audit.md").read_text(encoding="utf-8")
        self.assertIn("Here is a link to the intake audit. [link]", staged)
        ir = (self.d / "campaigns" / "dental-pilot" / "interested-reply.md").read_text(encoding="utf-8")
        self.assertEqual(ir.count("## Notes"), 1)
        self.assertIn("Needs Aaron", ir)
        self.assertIn("## When to Use", ir)
        playbook = (self.d / "reply-playbook.md").read_text(encoding="utf-8")
        self.assertIn("the reply inbox on the sending platform", playbook)
        self.assertIn("## SDR section: dental-audit", playbook)
        self.assertIn("## SDR section: dental-pilot", playbook)

        v = self.ok(run("verify_readiness.py", self.d))
        self.assertIn("RESULT: PASS", v)
        self.ok(run("build_readiness.py", self.d, "--check"))
        self.ok(run("build_reply_playbook.py", self.d, "--check"))

        baseline = self.tmp / "baseline.yaml"
        shutil.copy(self.prof, baseline)
        r = run("offer_approval.py", "set", self.d, "2", "yes", "--terms", "14-day pilot, up to 5 clinics a week",
                "--by", "Pat (client)", "--evidence", "email 2026-01-07 re: pilot", "--at", "2026-01-07")
        out = self.ok(r)
        self.assertIn("offer 2: 2 mirrors", out)
        for b in mirrors(self.load(), 2):
            self.assertEqual(b["lead_magnet_client_ok"], "yes")  # written quoted, so PyYAML reads text, not a boolean
            self.assertEqual(b["lead_magnet_client_ok_by"], "Pat (client)")
            self.assertEqual(b["lead_magnet_client_ok_at"], "2026-01-07")
            self.assertTrue(b["lead_magnet_client_dependency"].startswith("CONFIRMED 2026-01-07: 14-day pilot"))
            self.assertEqual(b["status"], "active")
        raw = self.prof.read_text(encoding="utf-8")
        self.assertIn('lead_magnet_client_ok: "yes"', raw)      # quoted text, never a YAML 1.1 boolean
        self.assertNotRegex(raw, r"(?m)^\s*lead_magnet_client_ok:\s*yes")
        self.assertIn("offer-approval · offer 2 · UPDATED: lead_magnet_client_ok = yes",
                      (self.d / "activity-log.md").read_text(encoding="utf-8"))

        self.assertEqual(run("build_readiness.py", self.d, "--check").returncode, 1)  # stale until rebuilt
        self.ok(run("build_readiness.py", self.d))
        self.ok(run("build_reply_playbook.py", self.d))
        v = self.ok(run("verify_readiness.py", self.d, "--baseline", baseline, "--allow-changed",
                        "lead_magnet_client_ok", *EVID, "lead_magnet_client_dependency"))
        self.assertIn("RESULT: PASS", v)
        self.assertIn("| 2 | Free 14-day pilot for dental clinics | None | yes | clear |",
                      (self.d / "offers" / "_readiness-board.md").read_text(encoding="utf-8"))

    # A no on the arm: status vetoed in every mirror, recorded on the test slate.
    def test_arm_no(self):
        self.migrate_and_build()
        self.ok(run("offer_approval.py", "set", self.d, "offer-2", "no", "--by", "Pat (client)",
                    "--evidence", "Slack permalink", "--at", "2026-01-08"))
        raw = self.prof.read_text(encoding="utf-8")
        self.assertIn('lead_magnet_client_ok: "no"', raw)       # quoted text, never a YAML 1.1 boolean
        self.assertNotRegex(raw, r"(?m)^\s*lead_magnet_client_ok:\s*no\b")
        p = self.load()
        for b in mirrors(p, 2):
            self.assertEqual(b["lead_magnet_client_ok"], "no")  # written quoted, so PyYAML reads text, not a boolean
            self.assertEqual(b["status"], "vetoed")
            self.assertEqual(b["lead_magnet_client_dependency"], "client runs a 14-day pilot")
        ts = p["offer"]["test_slate"]
        self.assertEqual(ts["client_response"], "vetoed_some")
        self.assertEqual(ts["vetoed_offers"], [{"aaron_rank": 2, "at": "2026-01-08", "by": "Pat (client)"}])
        self.ok(run("build_readiness.py", self.d))
        self.ok(run("build_reply_playbook.py", self.d))
        self.assertIn("RESULT: PASS", self.ok(run("verify_readiness.py", self.d)))

    # The refusals, none of which may write anything.
    def test_refusals(self):
        before_unmigrated = self.prof.read_bytes()
        r = run("offer_approval.py", "set", self.d, "2", "yes", "--terms", "x", "--by", "Pat", "--evidence", "e")
        self.assertNotEqual(r.returncode, 0)
        self.assertIn("run readiness_fields.py first", r.stderr)
        self.assertEqual(self.prof.read_bytes(), before_unmigrated)

        self.migrate_and_build()
        before = self.prof.read_bytes()
        cases = [
            (["1", "yes", "--terms", "x", "--by", "Pat", "--evidence", "e"], "agency-honored"),
            (["2", "yes", "--by", "Pat", "--evidence", "e"], "a yes needs --terms"),
            (["2", "yes", "--terms", "x", "--by", "Pat", "--evidence", "  "], "--evidence is empty"),
            (["2", "yes", "--terms", "x", "--by", "Pat", "--evidence", "e", "--at", "07/01/2026"], "not YYYY-MM-DD"),
            (["9", "no", "--by", "Pat", "--evidence", "e"], "no offer with aaron_rank 9"),
        ]
        for args, msg in cases:
            with self.subTest(args=args):
                r = run("offer_approval.py", "set", self.d, *args)
                self.assertNotEqual(r.returncode, 0)
                self.assertIn(msg, r.stderr)
                self.assertEqual(self.prof.read_bytes(), before)

    # A drifted mirror or a missing ask item fails the audit.
    def test_verify_catches_drift_and_missing_ask(self):
        self.migrate_and_build()
        (self.d / "client-asks.md").write_text(CLIENT_ASKS.replace("[offer-2]", "[offer-x]"), encoding="utf-8")
        text = self.prof.read_text(encoding="utf-8")
        i = text.rindex("lead_magnet_client_ok: pending")
        self.prof.write_text(text[:i] + "lead_magnet_client_ok: yes" + text[i + len("lead_magnet_client_ok: pending"):],
                             encoding="utf-8", newline="\n")
        r = run("verify_readiness.py", self.d)
        self.assertEqual(r.returncode, 1)
        self.assertIn("RESULT: FAIL", r.stdout)
        self.assertIn("mirror drift", r.stdout)
        self.assertIn("pending offer 2: no [offer-2] item", r.stdout)

    # A profile recorded before the Aaron lane: every script reports not applicable and writes nothing.
    def test_not_applicable(self):
        plain = "business:\n  name: Plain Co\noffer:\n  lead_magnet: Free audit\n  lead_magnet_client_ok: not_needed\n"
        self.prof.write_text(plain, encoding="utf-8", newline="\n")
        before = sorted(p.relative_to(self.d) for p in self.d.rglob("*"))
        for script, args in (("readiness_fields.py", [self.prof]), ("build_readiness.py", [self.d]),
                             ("build_readiness.py", [self.d, "--check"]), ("build_reply_playbook.py", [self.d]),
                             ("verify_readiness.py", [self.d])):
            with self.subTest(script=script, args=args):
                self.assertIn("not applicable", self.ok(run(script, *args)))
        self.assertEqual(self.prof.read_text(encoding="utf-8"), plain)
        self.assertEqual(sorted(p.relative_to(self.d) for p in self.d.rglob("*")), before)

    def test_help(self):
        for script in ("readiness_fields.py", "offer_approval.py", "build_readiness.py",
                       "build_reply_playbook.py", "verify_readiness.py"):
            with self.subTest(script=script):
                self.assertIn("usage" if script in ("readiness_fields.py", "offer_approval.py", "verify_readiness.py")
                              else "python outbound/scripts/offer-readiness/", self.ok(run(script, "--help")))


if __name__ == "__main__":
    unittest.main()
