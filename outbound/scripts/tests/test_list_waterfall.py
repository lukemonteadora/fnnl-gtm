import contextlib
import csv
import importlib.util
import io
import json
import re
import socket
import sys
import tempfile
import unittest
from collections import Counter
from pathlib import Path
from unittest import mock

import yaml


SCRIPTS_DIR = Path(__file__).resolve().parents[1]
SCRIPT_PATH = SCRIPTS_DIR / "list_waterfall.py"
ROUTING_PATH = SCRIPTS_DIR.parent / "reference" / "provider-routing.yaml"
CONTRACT_PATH = SCRIPTS_DIR.parent / "stack-contract.yaml"
SPEC = importlib.util.spec_from_file_location("list_waterfall", SCRIPT_PATH)
list_waterfall = importlib.util.module_from_spec(SPEC)
sys.modules["list_waterfall"] = list_waterfall
assert SPEC.loader is not None
SPEC.loader.exec_module(list_waterfall)
list_common = sys.modules["list_common"]
# list_waterfall.py's own `import reservoir` (sys.path.insert on its own folder) already loaded the real
# reservoir.py as a module; reuse that instance rather than loading it a second time under a second name.
reservoir = sys.modules["reservoir"]


FNNL_PROVIDERS = {"aiark", "prospeo", "getleads", "giggal"}
TIERS = ["exact", "strong", "influencer", "adjacent", "weak"]
NAME_KEY = ["first_name", "last_name", "company_domain"]

# The mechanics tests run on a FIXTURE routing built here, never on the live
# provider-routing.yaml, so an operator re-ordering the live file never breaks
# them. The fixture uses FNNL's provider keys, but its email ladder has THREE
# rungs (aiark, getleads, prospeo) so the middle-rung behaviours (a skipped rung
# routing to the next one, a depth cap stopping short of the last rung) can be
# exercised. That is a test ladder, not FNNL's order: the live file and the
# stack contract run getleads, then aiark, then prospeo (operator directive
# 2026-10-06), which LiveRoutingTests checks.
# The fixture leaves on_catch_all and requires_attempted unset, so the ported
# tests run on the script defaults (continue, no prerequisite); the tests for
# those two settings switch them on explicitly.
FIXTURE_EMAIL_ORDER = ["aiark", "getleads", "prospeo"]
FIXTURE_PEOPLE_ORDER = ["aiark", "getleads", "prospeo"]
FIXTURE_PHONE_ORDER = ["aiark", "prospeo"]  # phone mechanics only: the live FNNL file has no phone layer

CONTACT_HEADER = [
    "person_id", "first_name", "last_name", "company_domain", "company_name", "company_linkedin",
    "linkedin_url", "email", "job_title", "title_status", "title_role_tier", "score_role_tier",
    "lead_score", "priority_tier", "contact_rank_in_company", "send_eligible", "phone",
]
EMAIL_RESULT_HEADER = ["person_id", "email", "status", "cost_usd"]
PHONE_RESULT_HEADER = ["person_id", "phone", "status", "cost_usd"]
PEOPLE_RESULT_HEADER = ["company_domain", "status", "returned_count", "cost_usd"]
VERIFY_RESULT_HEADER = [
    "email", "person_ids", "source_providers", "email_status", "is_catch_all",
    "verifier_raw_status", "verified_by",
]
# (gate written in email_status, Giggal raw status in verifier_raw_status, is_catch_all)
RAW_FOR_GATE = {
    "valid": ("valid", "deliverable", "false"),
    "catch_all": ("catch_all", "accept_all", "true"),
    "invalid": ("invalid", "undeliverable", "false"),
    "disposable": ("invalid", "undeliverable", "false"),
    "unknown": ("unknown", "unknown", ""),
    "transient": ("unknown", "error", ""),  # Giggal `error`: transient per the configured raw set
    "not_verified": ("unknown", "not_verified", ""),  # the verifier CLI stopped before checking (e.g. no credits)
}
COST = {"aiark": "0.00", "getleads": "0.00", "prospeo": "0.01"}
SERIAL = "run this queue one call at a time, never in parallel"


def fixture_routing():
    return {
        "schema_version": 1,
        "routing_version": "fixture-routing-v1",
        "status": "fixture",
        "providers": {
            "aiark": {"name": "AI Ark", "concurrency": "untested"},
            "getleads": {"name": "GetLeads", "concurrency": "untested"},
            "prospeo": {"name": "Prospeo", "concurrency": "untested"},
            "giggal": {"name": "Giggal", "concurrency": "untested"},
        },
        "layers": {
            "people_discovery": {
                "order": list(FIXTURE_PEOPLE_ORDER),
                # getleads needs the company LinkedIn here so the missing-input skip is tested.
                "requires": {"aiark": ["company_domain"], "getleads": ["company_linkedin"],
                             "prospeo": ["company_domain"]},
                "retry_on_error": 1,
            },
            "email": {
                "order": list(FIXTURE_EMAIL_ORDER),
                "requires": {provider: list(NAME_KEY) for provider in FIXTURE_EMAIL_ORDER},
                "max_rungs_by_role_tier": {tier: len(FIXTURE_EMAIL_ORDER) for tier in TIERS},
                "retry_on_error": 1,
            },
            "phone": {
                "order": list(FIXTURE_PHONE_ORDER),
                "requires": {"aiark": ["linkedin_url"], "prospeo": list(NAME_KEY)},
            },
            "verification": {
                "provider": "giggal",
                "retry_transient": 1,
                "transient_raw_statuses": ["error", "timeout", "rate_limited", ""],
            },
        },
    }


def contact(pid, first, last, domain, tier, score, rank, linkedin=True, **extra):
    stem = domain.split(".")[0]
    row = {
        "person_id": pid,
        "first_name": first,
        "last_name": last,
        "company_domain": domain,
        "company_name": stem.title(),
        "company_linkedin": f"https://www.linkedin.com/company/{stem}",
        "linkedin_url": f"https://www.linkedin.com/in/{first.lower()}-{last.lower()}" if linkedin else "",
        "email": "",
        "job_title": "VP Revenue",
        "title_status": "pass",
        "title_role_tier": tier,
        "score_role_tier": tier,
        "lead_score": "" if score is None else str(score),
        "priority_tier": "P1",
        "contact_rank_in_company": str(rank),
        "send_eligible": "true",
        "phone": "",
    }
    row.update(extra)
    return row


def base_contacts():
    # File order is deliberately shuffled so the test proves buyer priority, not file order.
    return [
        contact("A3", "Avery", "Three", "alpha.com", "strong", 8.0, 3),
        contact("A1", "Ada", "One", "alpha.com", "exact", 9.5, 1),
        contact("A4", "Abe", "Four", "alpha.com", "weak", 5.0, 4),
        contact("A2", "Amy", "Two", "alpha.com", "exact", 9.0, 2),
        contact("A5", "Art", "Five", "alpha.com", "unrelated", None, 5, send_eligible="false", title_status="fail"),
        contact("B2", "Bea", "Two", "beta.com", "strong", 7.0, 2),
        contact("B1", "Ben", "One", "beta.com", "exact", 9.0, 1),
        # Account C: no person_id column value and no linkedin_url.
        contact("", "Cara", "One", "gamma.com", "exact", 8.5, 1, linkedin=False),
        contact("", "Cole", "Two", "gamma.com", "strong", 7.5, 2, linkedin=False),
    ]


def base_spec(**buyer_overrides):
    buyers = {
        "contacts_per_account": 2,
        "max_contacts_per_account": 2,
        "min_target_persons_per_account": 2,
        "work_email_required": True,
        "personal_email_policy": "fail",
        "phone_required": False,
    }
    buyers.update(buyer_overrides)
    return {
        "schema_version": 1,
        "client": "fixture",
        "spec_version": "fixture-targeting-v1",
        "status": "locked",
        "buyers": buyers,
    }


def write_rows(path, header, rows):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=header, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def read_rows(path):
    with Path(path).open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


class WaterfallTestCase(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.campaign = self.root / "campaign"
        self.work = self.campaign / "_waterfall"
        self.contacts_path = self.root / "contacts.scored.csv"
        self.spec_path = self.root / "targeting-spec.yaml"
        self.write_routing(lambda routing: None)
        self.verifier = "giggal"
        self.counter = 0
        self.queued = []           # (provider, person_id) for every row ever handed to a finder
        self.verify_requests = []  # every email ever handed to the email verifier
        self.write_contacts(base_contacts())
        self.write_spec(base_spec())
        self.pid = {row["first_name"]: (row["person_id"] or list_common.person_id(row)) for row in base_contacts()}
        # Aaron flow (see aaron-flow.md section 7). No --reservoir by default: the 35 pre-reservoir tests must
        # keep running exactly as before. A test sets self.reservoir_path (via write_reservoir()) to opt in.
        self.reservoir_path = None

    def tearDown(self):
        self.temp.cleanup()

    # -- fixtures ---------------------------------------------------------------
    def write_contacts(self, rows):
        write_rows(self.contacts_path, CONTACT_HEADER, rows)

    def write_spec(self, spec):
        self.spec_path.write_text(yaml.safe_dump(spec, sort_keys=False), encoding="utf-8")

    def write_routing(self, mutate):
        routing = fixture_routing()
        mutate(routing)
        path = self.root / "provider-routing.yaml"
        path.write_text(yaml.safe_dump(routing, sort_keys=False), encoding="utf-8")
        self.routing_path = path

    def email_order(self):
        return yaml.safe_load(Path(self.routing_path).read_text(encoding="utf-8"))["layers"]["email"]["order"]

    # -- CLI --------------------------------------------------------------------
    def cli(self, *args):
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            status = list_waterfall.main([str(arg) for arg in args])
        return status, out.getvalue(), err.getvalue()

    def state_args(self):
        args = ["--dir", self.campaign, "--contacts", self.contacts_path, "--spec", self.spec_path,
                "--routing", self.routing_path]
        if self.reservoir_path:
            args += ["--reservoir", self.reservoir_path]
        return args

    def write_reservoir(self, records):
        """records: list of dicts with whatever reservoir.FIELDS keys matter for the test (linkedin_url or
        email for the key, company_domain, verdict, verified_at, source). Sets self.reservoir_path so every
        state_args() call from here on passes --reservoir; a test that wants no reservoir never calls this."""
        store = {}
        for rec in records:
            key = reservoir.record_key(rec.get("linkedin_url"), rec.get("email"))
            store[key] = {f: str(rec.get(f) or "") for f in reservoir.FIELDS} | {"key": key}
        path = self.root / "reservoir.jsonl"
        reservoir.save_store(path, store)
        self.reservoir_path = path
        return path

    def plan(self, *extra, layer="email", expect=0):
        status, out, err = self.cli("plan", *self.state_args(), "--layer", layer, *extra)
        self.assertEqual(expect, status, err + out)
        return out

    def finalize(self, *extra, expect=0):
        status, out, err = self.cli("finalize", *self.state_args(), *extra)
        self.assertEqual(expect, status, err + out)
        return out, err

    def queue(self, name):
        path = self.work / name
        return read_rows(path) if path.exists() else []

    def queue_ids(self, name):
        return [row["person_id"] for row in self.queue(name)]

    def record(self, layer, provider, header, rows, expect=0, extra=()):
        self.counter += 1
        path = self.root / f"results-{layer}-{provider or 'default'}-{self.counter}.csv"
        write_rows(path, header, rows)
        args = ["record", "--dir", self.campaign, "--layer", layer, "--results", path, *extra]
        if provider:
            args += ["--provider", provider]
        status, out, err = self.cli(*args)
        self.assertEqual(expect, status, err + out)
        return out, err

    def respond(self, provider, finds):
        """Answer the current email queue for one provider. finds maps person_id -> email (or 'ERROR')."""
        rows = []
        for item in self.queue(f"queue-email-{provider}.csv"):
            pid = item["person_id"]
            self.queued.append((provider, pid))
            value = finds.get(pid)
            if value == "ERROR":
                rows.append({"person_id": pid, "email": "", "status": "error", "cost_usd": ""})
            elif value:
                rows.append({"person_id": pid, "email": value, "status": "found", "cost_usd": COST[provider]})
            else:
                rows.append({"person_id": pid, "email": "", "status": "not_found", "cost_usd": ""})
        if rows:
            self.record("email", provider, EMAIL_RESULT_HEADER, rows)
        return len(rows)

    def verify_rows(self, verdicts, default="invalid"):
        rows = []
        for item in self.queue("queue-verify.csv"):
            self.verify_requests.append(item["email"])
            gate, raw, catch_all = RAW_FOR_GATE[verdicts.get(item["email"], default)]
            rows.append({**item, "email_status": gate, "is_catch_all": catch_all,
                         "verifier_raw_status": raw, "verified_by": self.verifier})
        return rows

    def verify(self, verdicts, default="invalid"):
        """Answer queue-verify.csv in the shape the verifier CLI writes."""
        rows = self.verify_rows(verdicts, default)
        if rows:
            self.record("verify", self.verifier, VERIFY_RESULT_HEADER, rows)
        return len(rows)

    def drive(self, finds, verdicts, default="invalid", max_rounds=40):
        """Loop plan -> run every queue -> record until no work is left."""
        for _ in range(max_rounds):
            self.plan()
            work = self.verify(verdicts, default)
            for provider in self.email_order():
                work += self.respond(provider, {pid: email for (p, pid), email in finds.items() if p == provider})
            if not work:
                return
        self.fail("waterfall did not converge")

    def ledger(self):
        return list_common.read_jsonl(self.work / "ledger.jsonl")

    def output(self, name):
        return read_rows(self.campaign / name)

    def by_pid(self, name):
        return {row["person_id"]: row for row in self.output(name)}

    def report(self):
        return (self.campaign / "email-waterfall-report.md").read_text(encoding="utf-8")

    def assert_every_eligible_person_in_exactly_one_file(self):
        seen = Counter()
        for name in ("leads.verified.csv", "leads.catchall-holdback.csv", "leads.review.csv", "leads.stagger.csv"):
            for row in self.output(name):
                seen[row["person_id"]] += 1
        eligible = {row["person_id"] for row in read_rows(self.work / "person-attempts.csv")}
        self.assertEqual(eligible, set(seen))
        self.assertTrue(all(count == 1 for count in seen.values()), seen)


class ListWaterfallTests(WaterfallTestCase):
    # 1
    def test_first_plan_queues_top_two_per_account_in_priority_order(self):
        self.write_routing(lambda r: r["providers"]["aiark"].update({"concurrency": "serial_only"}))
        out = self.plan()
        queue = self.queue("queue-email-aiark.csv")
        self.assertEqual(6, len(queue))
        by_account = {}
        for row in queue:
            by_account.setdefault(row["company_domain"], []).append(row["person_id"])
        self.assertEqual(["A1", "A2"], by_account["alpha.com"])
        self.assertEqual(["B1", "B2"], by_account["beta.com"])
        self.assertEqual([self.pid["Cara"], self.pid["Cole"]], by_account["gamma.com"])
        ids = {row["person_id"] for row in queue}
        self.assertFalse({"A3", "A4", "A5"} & ids)
        self.assertTrue(self.pid["Cara"].startswith("nm:"))
        self.assertIn(SERIAL, out)
        self.assertFalse((self.work / "queue-verify.csv").exists())
        status = json.loads((self.work / "status.json").read_text(encoding="utf-8"))
        self.assertEqual({"aiark": 6}, status["pending"])
        self.assertEqual({"ACCOUNT_IN_PROGRESS": 3}, status["accounts"])
        self.assertEqual(str(Path(self.routing_path).resolve()), status["routing_path"])

    def test_live_routing_order_is_followed(self):
        """Whatever order the live provider-routing.yaml sets, the first queue goes to its first rung."""
        live = yaml.safe_load(ROUTING_PATH.read_text(encoding="utf-8"))
        first = live["layers"]["email"]["order"][0]
        self.routing_path = ROUTING_PATH
        self.plan()
        self.assertTrue((self.work / f"queue-email-{first}.csv").exists(), first)
        for other in live["layers"]["email"]["order"][1:]:
            self.assertFalse((self.work / f"queue-email-{other}.csv").exists(), other)

    # 2
    def test_exhausted_top_two_promote_rank_three_and_keep_missing_apart_from_invalid(self):
        c1, c2 = self.pid["Cara"], self.pid["Cole"]
        finds = {
            ("aiark", "A2"): "amy.one@alpha.com",
            ("getleads", "A2"): "amy.two@alpha.com",
            ("prospeo", "A2"): "amy.three@alpha.com",
            ("aiark", "A3"): "avery@alpha.com",
            ("aiark", "A4"): "abe@alpha.com",
            ("aiark", "B1"): "ben@beta.com",
            ("aiark", "B2"): "bea@beta.com",
            ("aiark", c1): "cara@gamma.com",
            ("aiark", c2): "cole@gamma.com",
        }
        valid = ["avery@alpha.com", "abe@alpha.com", "ben@beta.com", "bea@beta.com", "cara@gamma.com",
                 "cole@gamma.com"]
        self.drive(finds, {email: "valid" for email in valid}, default="invalid")
        self.finalize()

        verified = self.by_pid("leads.verified.csv")
        self.assertEqual({"A3", "A4", "B1", "B2", c1, c2}, set(verified))
        a3 = verified["A3"]
        self.assertEqual("avery@alpha.com", a3["email"])
        self.assertEqual("valid", a3["email_status"])
        self.assertEqual("false", a3["is_catch_all"])
        self.assertEqual("aiark", a3["email_source"])
        self.assertEqual("Giggal", a3["verification_provider"])
        self.assertEqual("promoted_fallback", a3["wave_slot"])
        self.assertIn("A1 exhausted: EMAIL_MISSING after 3 rungs", a3["wave_slot_reason"])
        self.assertIn("A2 exhausted: EMAIL_INVALID after 3 rungs", a3["wave_slot_reason"])
        self.assertTrue(a3["email_verified_at"])
        self.assertEqual("primary", verified["B1"]["wave_slot"])

        review = self.by_pid("leads.review.csv")
        self.assertEqual({"A1", "A2"}, set(review))
        self.assertEqual("no_email", review["A1"]["review_reason"])
        self.assertEqual("invalid", review["A2"]["review_reason"])
        self.assertEqual("aiark:not_found > getleads:not_found > prospeo:not_found",
                         review["A1"]["email_attempt_path"])
        self.assertEqual(
            "aiark:invalid(amy.one@alpha.com) > getleads:invalid(amy.two@alpha.com) > "
            "prospeo:invalid(amy.three@alpha.com)",
            review["A2"]["email_attempt_path"],
        )
        self.assertEqual("3", review["A2"]["email_candidates"])

        accounts = {row["company_domain"]: row for row in read_rows(self.work / "account-status.csv")}
        self.assertEqual("ACCOUNT_SATISFIED", accounts["alpha.com"]["state"])
        self.assertEqual("2", accounts["alpha.com"]["promotions"])
        self.assertEqual("4", accounts["alpha.com"]["persons_tried"])
        self.assertNotIn("A5", {pid for _, pid in self.queued})
        self.assert_every_eligible_person_in_exactly_one_file()
        report = self.report()
        self.assertIn("## Provider performance (email)", report)
        self.assertIn("| aiark | 8 | 7 |", report)

    # 3
    def test_same_email_is_verified_once_across_providers_and_persons(self):
        self.plan()
        self.respond("aiark", {"A1": "shared@alpha.com", "A2": "shared@alpha.com"})
        self.plan()
        shared = [row for row in self.queue("queue-verify.csv") if row["email"] == "shared@alpha.com"]
        self.assertEqual(1, len(shared))
        self.assertEqual("A1|A2", shared[0]["person_ids"])
        self.assertEqual("aiark", shared[0]["source_providers"])

        finds = {
            ("getleads", "A1"): "Shared@Alpha.com",  # same email again, different case, next provider
            ("getleads", "A2"): "amy@alpha.com",
            ("prospeo", "A1"): "ada@alpha.com",
        }
        self.drive(finds, {"shared@alpha.com": "invalid", "amy@alpha.com": "valid", "ada@alpha.com": "valid"})
        counts = Counter(self.verify_requests)
        self.assertEqual(1, counts["shared@alpha.com"])
        self.assertTrue(all(count == 1 for count in counts.values()), counts)
        verify_lines = [line for line in self.ledger() if line["layer"] == "verify"]
        self.assertEqual(1, sum(1 for line in verify_lines if line["email"] == "shared@alpha.com"))

        self.finalize()
        verified = self.by_pid("leads.verified.csv")
        self.assertEqual("ada@alpha.com", verified["A1"]["email"])
        self.assertEqual("prospeo", verified["A1"]["email_source"])
        self.assertEqual("aiark:invalid(shared@alpha.com) > getleads:invalid(shared@alpha.com) > prospeo:valid",
                         verified["A1"]["email_attempt_path"])
        self.assertEqual("2", verified["A1"]["email_candidates"])
        self.assertIn("Verifications avoided (duplicate emails whose verdict was reused): 2", self.report())

    # 4
    def test_account_with_two_ready_persons_stops_and_staggers_the_rest(self):
        finds = {("aiark", "A1"): "ada@alpha.com", ("aiark", "A2"): "amy@alpha.com"}
        self.drive(finds, {"ada@alpha.com": "valid", "amy@alpha.com": "valid"})
        alpha_queued = {pid for _, pid in self.queued if pid.startswith("A")}
        self.assertEqual({"A1", "A2"}, alpha_queued)
        self.plan()
        for provider in FIXTURE_EMAIL_ORDER:
            self.assertFalse([row for row in self.queue(f"queue-email-{provider}.csv")
                              if row["company_domain"] == "alpha.com"])
        self.finalize()
        stagger = self.by_pid("leads.stagger.csv")
        self.assertEqual({"A3", "A4"}, set(stagger))
        self.assertTrue(stagger["A3"]["stagger_reason"].startswith("not_needed"))
        self.assertEqual("NOT_NEEDED", stagger["A4"]["state"])
        accounts = {row["company_domain"]: row for row in read_rows(self.work / "account-status.csv")}
        self.assertEqual("ACCOUNT_SATISFIED", accounts["alpha.com"]["state"])
        self.assertEqual("ACCOUNT_NO_READY_CONTACT", accounts["beta.com"]["state"])
        self.assert_every_eligible_person_in_exactly_one_file()

    # 5
    def test_catch_all_keeps_walking_and_lands_in_holdback(self):
        """on_catch_all unset = the script default `continue` (the behaviour this test was written for)."""
        self.plan()
        self.respond("aiark", {"A1": "ada@alpha.com", "A2": "amy@alpha.com"})
        self.plan()
        self.verify({"ada@alpha.com": "catch_all", "amy@alpha.com": "valid"})
        self.plan()
        self.assertIn("A1", self.queue_ids("queue-email-getleads.csv"))
        for provider in FIXTURE_EMAIL_ORDER:
            self.assertNotIn("A3", self.queue_ids(f"queue-email-{provider}.csv"))

        self.drive({("aiark", "A3"): "avery@alpha.com"},
                   {"ada@alpha.com": "catch_all", "amy@alpha.com": "valid", "avery@alpha.com": "valid"})
        self.finalize()
        holdback = self.by_pid("leads.catchall-holdback.csv")
        self.assertEqual({"A1"}, set(holdback))
        self.assertEqual("ada@alpha.com", holdback["A1"]["email"])
        self.assertEqual("catch_all_unresolved", holdback["A1"]["holdback_reason"])
        self.assertEqual("catch_all", holdback["A1"]["email_status"])
        self.assertEqual("true", holdback["A1"]["is_catch_all"])
        self.assertEqual("aiark", holdback["A1"]["email_source"])
        verified = self.by_pid("leads.verified.csv")
        self.assertEqual({"A2", "A3"}, {pid for pid in verified if pid.startswith("A")})
        self.assertEqual("promoted_fallback", verified["A3"]["wave_slot"])
        self.assertIn("A1 exhausted: EMAIL_CATCH_ALL after 3 rungs", verified["A3"]["wave_slot_reason"])
        self.assertIn("Catch-all policy: continue.", self.report())
        self.assert_every_eligible_person_in_exactly_one_file()

    # 6
    def test_skip_provider_writes_control_line_and_routes_to_next_rung(self):
        reason = "AI Ark connector invalidated (observed in this run)"
        status, _, err = self.cli("plan", *self.state_args(), "--skip-provider", "aiark", "--skip-reason", reason)
        self.assertEqual(2, status)  # down is a stop, not a skip, until the operator approves (/tool-balance-guard)
        self.assertIn("--operator-approved-skip", err)
        self.plan("--skip-provider", "aiark", "--skip-reason", reason, "--operator-approved-skip")
        self.assertFalse((self.work / "queue-email-aiark.csv").exists())
        expected = {"A1", "A2", "B1", "B2", self.pid["Cara"], self.pid["Cole"]}
        self.assertEqual(expected, set(self.queue_ids("queue-email-getleads.csv")))
        control = [line for line in self.ledger() if line["result"] == "skipped"]
        self.assertEqual(1, len(control))
        self.assertEqual("email", control[0]["layer"])
        self.assertEqual("aiark", control[0]["provider"])
        self.assertEqual({"scope": "run", "reason": reason, "operator_approved": True}, control[0]["detail"])
        self.assertEqual("", control[0]["person_id"])

        self.plan()  # the skip persists without the flag
        self.assertEqual(expected, set(self.queue_ids("queue-email-getleads.csv")))
        self.finalize("--allow-pending")
        report = self.report()
        self.assertIn("email aiark: still skipped", report)
        self.assertIn(reason, report)
        self.assertIn(f"{reason} (operator approved)", report)

        self.plan("--unskip-provider", "aiark")
        self.assertEqual(expected, set(self.queue_ids("queue-email-aiark.csv")))
        self.assertFalse((self.work / "queue-email-getleads.csv").exists())
        status, _, err = self.cli("plan", *self.state_args(), "--skip-provider", "aiark")
        self.assertEqual(2, status)
        self.assertIn("--skip-reason", err)

    def test_tool_balance_guard_refuses_every_skip_without_operator_approval(self):
        # /tool-balance-guard: out of balance, over fair use, a 402 or down is a stop on every rung, the last one
        # included. Nothing is skipped, and no control line is written, until the operator approves the skip.
        cases = [
            ("aiark", "AI Ark returned HTTP 402 insufficient credits", "out of balance"),
            ("getleads", "GetLeads fair use used up for today", "out of balance"),
            ("getleads", "GetLeads insufficient_wallet_cash", "out of balance"),
            ("prospeo", "Prospeo 402 on every call", "out of balance"),
            ("prospeo", "Prospeo API down (503)", "down"),
            ("aiark", "operator wants to save it for later", "switched off"),
        ]
        for provider, reason, wording in cases:
            with self.subTest(provider=provider, reason=reason):
                status, _, err = self.cli("plan", *self.state_args(), "--skip-provider", provider,
                                          "--skip-reason", reason)
                self.assertEqual(2, status)
                self.assertIn("--operator-approved-skip", err)
                self.assertIn(wording, err)
                self.assertIn("/tool-balance-guard", err)
        self.assertEqual([], [line for line in self.ledger() if line.get("result") == "skipped"])

        self.plan("--skip-provider", "prospeo", "--skip-reason", "Prospeo 402 on every call",
                  "--operator-approved-skip")
        control = [line for line in self.ledger() if line.get("result") == "skipped"]
        self.assertEqual(1, len(control))
        self.assertEqual("prospeo", control[0]["provider"])
        self.assertTrue(control[0]["detail"]["operator_approved"])

    # 7
    def test_record_rejects_rows_not_in_the_current_queue(self):
        self.plan()
        self.record("email", "aiark", EMAIL_RESULT_HEADER,
                    [{"person_id": "A1", "email": "ada@alpha.com", "status": "found"}])
        self.plan()
        before = (self.work / "ledger.jsonl").read_bytes()
        _, err = self.record("email", "aiark", EMAIL_RESULT_HEADER, [
            {"person_id": "A2", "email": "amy@alpha.com", "status": "found"},
            {"person_id": "ZZ-other-company", "email": "x@other.com", "status": "found"},
        ], expect=2)
        self.assertIn("ZZ-other-company", err)
        self.assertIn("Nothing was recorded", err)
        self.assertEqual(before, (self.work / "ledger.jsonl").read_bytes())

        _, err = self.record("verify", "giggal", VERIFY_RESULT_HEADER, [
            {"email": "stranger@elsewhere.com", "person_ids": "A1", "source_providers": "aiark",
             "email_status": "valid", "is_catch_all": "false", "verifier_raw_status": "deliverable",
             "verified_by": "giggal"},
        ], expect=2)
        self.assertIn("stranger@elsewhere.com", err)
        self.assertEqual(before, (self.work / "ledger.jsonl").read_bytes())

    # 8
    def test_depth_cap_exhausts_a_weak_person_after_one_rung(self):
        self.write_routing(lambda r: r["layers"]["email"]["max_rungs_by_role_tier"].update({"weak": 1}))
        self.write_contacts([
            contact("W1", "Wes", "Weak", "weak.com", "weak", 4.0, 1),
            contact("W2", "Win", "Exact", "weak.com", "exact", 9.0, 2),
        ])
        self.plan()
        self.assertEqual(["W2", "W1"], self.queue_ids("queue-email-aiark.csv"))
        self.respond("aiark", {})
        self.plan()
        self.assertEqual(["W2"], self.queue_ids("queue-email-getleads.csv"))
        for provider in FIXTURE_EMAIL_ORDER:
            self.assertNotIn("W1", self.queue_ids(f"queue-email-{provider}.csv"))
        self.finalize("--allow-pending")
        review = self.by_pid("leads.review.csv")
        self.assertEqual("no_email", review["W1"]["review_reason"])
        self.assertIn("depth cap", review["W1"]["review_detail"])
        attempts = {row["person_id"]: row for row in read_rows(self.work / "person-attempts.csv")}
        self.assertEqual("EMAIL_MISSING", attempts["W1"]["state"])
        self.assertEqual("aiark:not_found", attempts["W1"]["rungs"])
        self.assertEqual("EMAIL_PENDING:getleads", attempts["W2"]["state"])

    # 9
    def test_personal_email_under_policy_fail_is_rejected_without_verification(self):
        rows = base_contacts()
        for row in rows:
            if row["person_id"] == "B2":
                row["email"] = "bea.home@gmail.com"
        self.write_contacts(rows)
        self.plan()
        self.assertNotIn("bea.home@gmail.com", [row["email"] for row in self.queue("queue-verify.csv")])
        self.assertIn("B2", self.queue_ids("queue-email-aiark.csv"))
        self.respond("aiark", {"B1": "ben.personal@gmail.com"})
        self.plan()
        self.assertFalse([row for row in self.queue("queue-verify.csv") if "gmail.com" in row["email"]])
        self.assertIn("B1", self.queue_ids("queue-email-getleads.csv"))
        self.assertFalse([line for line in self.ledger() if line["layer"] == "verify"])

        self.write_spec(base_spec(personal_email_policy="review"))
        self.plan()
        queued = {row["email"] for row in self.queue("queue-verify.csv")}
        self.assertEqual({"bea.home@gmail.com", "ben.personal@gmail.com"}, queued)
        # Under review, a verified personal email ends the waterfall for that person as READY_REVIEW.
        self.verify({"bea.home@gmail.com": "valid", "ben.personal@gmail.com": "valid"})
        self.plan()
        for provider in FIXTURE_EMAIL_ORDER:
            self.assertFalse({"B1", "B2"} & set(self.queue_ids(f"queue-email-{provider}.csv")))
        self.finalize("--allow-pending")
        review = self.by_pid("leads.review.csv")
        self.assertEqual("personal_email", review["B1"]["review_reason"])
        self.assertEqual("personal_email", review["B2"]["review_reason"])
        self.assertEqual("bea.home@gmail.com", review["B2"]["review_email"])
        self.assertNotIn("B2", self.by_pid("leads.verified.csv"))

    # 10
    def test_linkedin_keyed_rung_is_skipped_without_linkedin_url(self):
        # Pin a rung that keys on the person's LinkedIn URL (GetLeads has an email-from-LinkedIn batch tool),
        # so the missing-input skip and the route to the NEXT rung are both exercised.
        self.write_routing(lambda r: r["layers"]["email"]["requires"].update({"getleads": ["linkedin_url"]}))
        c1, c2 = self.pid["Cara"], self.pid["Cole"]
        self.plan()
        self.respond("aiark", {})
        self.plan()
        self.assertEqual({"A1", "A2", "B1", "B2"}, set(self.queue_ids("queue-email-getleads.csv")))
        self.assertEqual({c1, c2}, set(self.queue_ids("queue-email-prospeo.csv")))
        self.finalize("--allow-pending")
        self.assertIn("- getleads: 2 persons skipped (missing input: linkedin_url)", self.report())
        attempts = {row["person_id"]: row for row in read_rows(self.work / "person-attempts.csv")}
        self.assertIn("getleads(missing linkedin_url)", attempts[c1]["skipped_rungs"])

    # 11
    def test_finalize_refuses_pending_work_unless_allowed(self):
        self.plan()
        _, err = self.finalize(expect=3)
        self.assertIn("6 persons still have waterfall work", err)
        self.assertFalse((self.campaign / "leads.verified.csv").exists())
        status, out, err = self.cli("status", *self.state_args())
        self.assertEqual(0, status, err)
        self.assertIn("EMAIL_PENDING:aiark 6", out)
        self.finalize("--allow-pending")
        self.assertEqual([], self.output("leads.verified.csv"))
        stagger = self.by_pid("leads.stagger.csv")
        self.assertEqual(8, len(stagger))
        self.assertTrue(stagger["A1"]["stagger_reason"].startswith("pending"))
        self.assertTrue(stagger["A3"]["stagger_reason"].startswith("waiting"))
        self.assert_every_eligible_person_in_exactly_one_file()

    # 12
    def test_phone_layer_only_when_required_and_only_for_ready_persons(self):
        out = self.plan(layer="phone")
        self.assertIn("phone not required by the targeting spec; skipped", out)
        self.assertFalse(self.work.exists())

        self.write_spec(base_spec(phone_required=True))
        finds = {("aiark", "A1"): "ada@alpha.com", ("aiark", "A2"): "amy@alpha.com",
                 ("aiark", "B1"): "ben@beta.com"}
        self.drive(finds, {"ada@alpha.com": "valid", "amy@alpha.com": "valid", "ben@beta.com": "valid"})
        self.plan(layer="phone")
        self.assertEqual({"A1", "A2", "B1"}, set(self.queue_ids("queue-phone-aiark.csv")))
        self.record("phone", "aiark", PHONE_RESULT_HEADER, [
            {"person_id": "A1", "phone": "+1 (415) 555-0100", "status": "found", "cost_usd": "0.05"},
            {"person_id": "A2", "phone": "", "status": "not_found", "cost_usd": ""},
            {"person_id": "B1", "phone": "", "status": "not_found", "cost_usd": ""},
        ])
        self.plan(layer="phone")
        self.assertEqual([], self.queue_ids("queue-phone-aiark.csv"))
        self.assertEqual({"A2", "B1"}, set(self.queue_ids("queue-phone-prospeo.csv")))
        _, err = self.finalize(expect=3)
        self.assertIn("2 persons still have waterfall work", err)
        self.finalize("--allow-pending")
        verified = self.by_pid("leads.verified.csv")
        self.assertEqual("+14155550100", verified["A1"]["phone"])
        self.assertEqual("aiark", verified["A1"]["phone_source"])
        self.assertEqual("pending", verified["A2"]["phone_status"])

    # extra: people discovery
    def test_people_layer_counts_title_fit_and_moves_to_the_next_provider(self):
        rows = base_contacts() + [contact("E1", "Eve", "One", "epsilon.com", "exact", 9.0, 1)]
        self.write_contacts(rows)
        companies = self.root / "tam.csv"
        write_rows(companies, ["company_domain", "company_name", "company_linkedin", "fit_status"], [
            {"company_domain": "alpha.com", "company_name": "Alpha",
             "company_linkedin": "https://www.linkedin.com/company/alpha", "fit_status": "good"},
            {"company_domain": "delta.com", "company_name": "Delta",
             "company_linkedin": "https://www.linkedin.com/company/delta", "fit_status": "good"},
            {"company_domain": "epsilon.com", "company_name": "Epsilon", "company_linkedin": "",
             "fit_status": "maybe"},
            {"company_domain": "zeta.com", "company_name": "Zeta",
             "company_linkedin": "https://www.linkedin.com/company/zeta", "fit_status": "bad"},
        ])
        out = self.plan("--companies", companies, layer="people")
        self.assertIn("TARGET_PERSON_FOUND 1", out)
        queue = {row["company_domain"]: row for row in self.queue("queue-people-aiark.csv")}
        self.assertEqual({"delta.com", "epsilon.com"}, set(queue))
        self.assertEqual(("1", "1"), (queue["epsilon.com"]["target_count"], queue["epsilon.com"]["needed"]))
        self.record("people", "aiark", PEOPLE_RESULT_HEADER, [
            {"company_domain": "delta.com", "status": "found", "returned_count": "3", "cost_usd": ""},
            {"company_domain": "epsilon.com", "status": "not_found", "returned_count": "0", "cost_usd": ""},
        ])
        self.plan("--companies", companies, layer="people")
        self.assertEqual(["delta.com"], [r["company_domain"] for r in self.queue("queue-people-getleads.csv")])
        self.assertEqual(["epsilon.com"], [r["company_domain"] for r in self.queue("queue-people-prospeo.csv")])

    # extra: the duplicate-send guard
    def test_same_valid_email_is_owned_by_one_person_only(self):
        self.plan()
        self.respond("aiark", {"B1": "team@beta.com", "B2": "team@beta.com"})
        self.plan()
        self.verify({"team@beta.com": "valid"})
        self.plan()
        self.assertIn("B2", self.queue_ids("queue-email-getleads.csv"))
        self.assertNotIn("B1", self.queue_ids("queue-email-getleads.csv"))
        self.drive({}, {"team@beta.com": "valid"})
        self.finalize()
        verified = self.by_pid("leads.verified.csv")
        self.assertEqual("team@beta.com", verified["B1"]["email"])
        self.assertNotIn("B2", verified)
        self.assertEqual(1, Counter(self.verify_requests)["team@beta.com"])
        review = self.by_pid("leads.review.csv")
        self.assertIn("shared_email(B1)", review["B2"]["email_attempt_path"])

    # extra: transient verification results
    def test_transient_verification_is_retried_once_then_treated_as_unknown(self):
        self.plan()
        self.respond("aiark", {"A1": "ada@alpha.com"})
        self.plan()
        self.verify({"ada@alpha.com": "transient"})
        self.plan()
        self.assertIn("ada@alpha.com", [row["email"] for row in self.queue("queue-verify.csv")])
        self.verify({"ada@alpha.com": "transient"})
        self.plan()
        self.assertNotIn("ada@alpha.com", [row["email"] for row in self.queue("queue-verify.csv")])
        self.assertIn("A1", self.queue_ids("queue-email-getleads.csv"))
        results = [line["result"] for line in self.ledger() if line["layer"] == "verify"]
        self.assertEqual(["transient", "transient"], results)

    # extra: provider errors are retried retry_on_error times, then the next rung runs
    def test_provider_error_is_retried_once_then_the_next_rung_runs(self):
        self.plan()
        self.respond("aiark", {"A1": "ERROR"})
        self.plan()
        self.assertIn("A1", self.queue_ids("queue-email-aiark.csv"))
        self.assertNotIn("A1", self.queue_ids("queue-email-getleads.csv"))
        self.respond("aiark", {"A1": "ERROR"})
        self.plan()
        self.assertNotIn("A1", self.queue_ids("queue-email-aiark.csv"))
        self.assertIn("A1", self.queue_ids("queue-email-getleads.csv"))
        self.finalize("--allow-pending")
        self.assertIn("- email aiark: 2 errors recorded.", self.report())

    # extra: a verifier run that stopped early leaves the email pending and costs no retry
    def test_not_verified_rows_stay_pending_and_cache_columns_flow_through(self):
        self.plan()
        self.respond("aiark", {"A1": "ada@alpha.com"})
        for _ in range(3):  # more than retry_transient: still pending every time
            self.plan()
            self.verify({"ada@alpha.com": "not_verified"})
        self.plan()
        self.assertEqual(["ada@alpha.com"], [row["email"] for row in self.queue("queue-verify.csv")])
        self.assertNotIn("A1", self.queue_ids("queue-email-getleads.csv"))
        self.record("verify", "giggal", VERIFY_RESULT_HEADER + ["cache_hit", "verified_at"], [
            {"email": "ada@alpha.com", "person_ids": "A1", "source_providers": "aiark", "email_status": "valid",
             "is_catch_all": "false", "verifier_raw_status": "deliverable", "verified_by": "giggal",
             "cache_hit": "true", "verified_at": "2026-09-01T00:00:00.000Z"},
        ])
        self.finalize("--allow-pending")
        verified = self.by_pid("leads.verified.csv")
        self.assertEqual("2026-09-01T00:00:00.000Z", verified["A1"]["email_verified_at"])
        report = self.report()
        self.assertIn("cache hits: 1", report)
        self.assertIn("(not_verified, left pending, no retry used): 3", report)

    # extra: a domain mismatch is flagged and never fills a slot
    def test_domain_mismatch_is_flagged_and_does_not_fill_a_slot(self):
        self.plan()
        self.respond("aiark", {"A1": "ada@othercorp.com"})
        mismatch = [line for line in self.ledger() if line.get("detail", {}).get("domain_mismatch")]
        self.assertEqual(1, len(mismatch))
        self.drive({}, {"ada@othercorp.com": "valid"})
        self.finalize()
        review = self.by_pid("leads.review.csv")
        self.assertEqual("domain_mismatch", review["A1"]["review_reason"])
        self.assertEqual("ada@othercorp.com", review["A1"]["review_email"])
        self.assertNotIn("A1", self.by_pid("leads.verified.csv"))

    # extra: no network, byte-stable outputs
    def test_no_network_and_deterministic_outputs(self):
        with mock.patch.object(socket, "create_connection", side_effect=AssertionError("network call")):
            self.drive({("aiark", "A1"): "ada@alpha.com"}, {"ada@alpha.com": "valid"})
            self.finalize()
            first = (self.campaign / "leads.verified.csv").read_bytes()
            self.finalize()
        self.assertEqual(first, (self.campaign / "leads.verified.csv").read_bytes())


class CatchAllStopTests(WaterfallTestCase):
    """layers.email.on_catch_all: stop (FNNL's contract: a catch_all goes to the holdback, never to Prospeo)."""

    def test_catch_all_stop_holds_back_without_any_later_finder(self):
        self.write_routing(lambda r: r["layers"]["email"].update({"on_catch_all": "stop"}))
        rows = base_contacts()
        for row in rows:
            if row["person_id"] == "B1":
                row["email"] = "ben@beta.com"  # the row already carries an email: verified first, no finder
        self.write_contacts(rows)
        self.plan()
        self.assertIn("ben@beta.com", [row["email"] for row in self.queue("queue-verify.csv")])
        self.assertNotIn("B1", self.queue_ids("queue-email-aiark.csv"))
        self.respond("aiark", {"A1": "ada@alpha.com", "A2": "amy@alpha.com"})
        self.plan()
        self.verify({"ada@alpha.com": "catch_all", "amy@alpha.com": "valid", "ben@beta.com": "catch_all"})
        self.plan()
        for provider in FIXTURE_EMAIL_ORDER:
            ids = self.queue_ids(f"queue-email-{provider}.csv")
            self.assertNotIn("A1", ids, provider)
            self.assertNotIn("B1", ids, provider)
        self.assertIn("A3", self.queue_ids("queue-email-aiark.csv"))  # promoted at once

        verdicts = {"ada@alpha.com": "catch_all", "amy@alpha.com": "valid", "ben@beta.com": "catch_all",
                    "avery@alpha.com": "valid"}
        self.drive({("aiark", "A3"): "avery@alpha.com"}, verdicts)
        self.finalize()
        finder_rows = {(provider, pid) for provider, pid in self.queued if pid in {"A1", "B1"}}
        self.assertEqual({("aiark", "A1")}, finder_rows)  # A1 saw one finder; B1 saw none

        holdback = self.by_pid("leads.catchall-holdback.csv")
        self.assertEqual({"A1", "B1"}, set(holdback))
        self.assertEqual("aiark:catch_all(ada@alpha.com)", holdback["A1"]["email_attempt_path"])
        self.assertEqual("catch_all_unresolved", holdback["A1"]["holdback_reason"])
        self.assertEqual("row_existing", holdback["B1"]["email_source"])
        self.assertEqual("row_existing:catch_all(ben@beta.com)", holdback["B1"]["email_attempt_path"])
        verified = self.by_pid("leads.verified.csv")
        self.assertEqual("promoted_fallback", verified["A3"]["wave_slot"])
        self.assertIn("A1 exhausted: EMAIL_CATCH_ALL after 1 rung", verified["A3"]["wave_slot_reason"])
        self.assertIn("Catch-all policy: stop.", self.report())
        self.assert_every_eligible_person_in_exactly_one_file()

    def test_on_catch_all_rejects_an_unknown_value(self):
        self.write_routing(lambda r: r["layers"]["email"].update({"on_catch_all": "hold"}))
        status, _, err = self.cli("plan", *self.state_args())
        self.assertEqual(2, status)
        self.assertIn("on_catch_all must be continue or stop", err)


class RequiresAttemptedTests(WaterfallTestCase):
    """layers.email.requires_attempted: {prospeo: [aiark]} (the contract: never open Prospeo on a row AI Ark
    has not already attempted)."""

    def two_rung_routing(self, with_rule=True):
        def mutate(routing):
            email = routing["layers"]["email"]
            email["order"] = ["aiark", "prospeo"]
            # AI Ark is pinned to need a LinkedIn URL here, so account C (no LinkedIn) cannot run it at all.
            email["requires"] = {"aiark": NAME_KEY + ["linkedin_url"], "prospeo": list(NAME_KEY)}
            email["max_rungs_by_role_tier"] = {tier: 2 for tier in TIERS}
            if with_rule:
                email["requires_attempted"] = {"prospeo": ["aiark"]}
        self.write_routing(mutate)

    def test_prospeo_waits_for_aiark_and_never_opens_a_row_aiark_could_not_try(self):
        c1, c2 = self.pid["Cara"], self.pid["Cole"]
        # Control: without the rule, the rows AI Ark cannot take go straight to Prospeo.
        self.two_rung_routing(with_rule=False)
        self.plan()
        self.assertEqual({c1, c2}, set(self.queue_ids("queue-email-prospeo.csv")))

        self.two_rung_routing(with_rule=True)
        self.plan()
        self.assertEqual({"A1", "A2", "B1", "B2"}, set(self.queue_ids("queue-email-aiark.csv")))
        self.assertEqual([], self.queue_ids("queue-email-prospeo.csv"))
        self.respond("aiark", {})
        self.plan()
        self.assertEqual({"A1", "A2", "B1", "B2"}, set(self.queue_ids("queue-email-prospeo.csv")))

        self.finalize("--allow-pending")
        attempts = {row["person_id"]: row for row in read_rows(self.work / "person-attempts.csv")}
        self.assertEqual("EMAIL_MISSING", attempts[c1]["state"])
        self.assertIn("aiark(missing linkedin_url)", attempts[c1]["skipped_rungs"])
        self.assertIn("prospeo(needs aiark attempted first)", attempts[c1]["skipped_rungs"])
        report = self.report()
        self.assertIn("- prospeo: 2 persons not sent to it (needs aiark attempted first)", report)
        self.assertIn("prospeo runs only after aiark has been attempted", report)
        self.assertNotIn(c1, {pid for provider, pid in self.queued if provider == "prospeo"})

    def test_operator_approved_run_skip_of_the_prerequisite_satisfies_requires_attempted(self):
        # Two rungs that every base contact can take, with the prerequisite rule on.
        self.write_routing(lambda r: r["layers"]["email"].update({
            "order": ["aiark", "prospeo"],
            "requires": {"aiark": list(NAME_KEY), "prospeo": list(NAME_KEY)},
            "requires_attempted": {"prospeo": ["aiark"]},
        }))
        everyone = {"A1", "A2", "B1", "B2", self.pid["Cara"], self.pid["Cole"]}
        reason = "AI Ark returned 5xx on every call (observed)"
        status, _, err = self.cli("plan", *self.state_args(), "--skip-provider", "aiark", "--skip-reason", reason)
        self.assertEqual(2, status)  # an outage no longer opens the rows to prospeo on its own
        self.assertIn("--operator-approved-skip", err)
        self.plan("--skip-provider", "aiark", "--skip-reason", reason, "--operator-approved-skip")
        self.assertEqual(everyone, set(self.queue_ids("queue-email-prospeo.csv")))
        self.plan("--unskip-provider", "aiark")
        self.assertEqual(everyone, set(self.queue_ids("queue-email-aiark.csv")))
        self.assertFalse((self.work / "queue-email-prospeo.csv").exists())

    def test_requires_attempted_must_name_rungs_in_the_order(self):
        self.write_routing(lambda r: r["layers"]["email"].update({"requires_attempted": {"prospeo": ["nosuch"]}}))
        status, _, err = self.cli("plan", *self.state_args())
        self.assertEqual(2, status)
        self.assertIn("requires_attempted", err)
        self.assertIn("nosuch", err)


class VerifyLayerTests(WaterfallTestCase):
    """The verify layer is generalized: the verifier key, its name and its transient set come from routing."""

    def queue_one_email(self):
        self.plan()
        self.respond("aiark", {"A1": "ada@alpha.com", "A2": "amy@alpha.com", "B1": "ben@beta.com"})
        self.plan()

    def test_verify_record_takes_the_verifier_from_routing(self):
        self.queue_one_email()
        before = (self.work / "ledger.jsonl").read_bytes()
        rows = self.verify_rows({"ada@alpha.com": "valid"})
        _, err = self.record("verify", "prospeo", VERIFY_RESULT_HEADER, rows, expect=2)
        self.assertIn("Giggal", err)
        self.assertIn("--provider giggal", err)
        self.assertEqual(before, (self.work / "ledger.jsonl").read_bytes())
        # No --provider: the key comes from layers.verification.provider (routing found through status.json).
        self.record("verify", None, VERIFY_RESULT_HEADER, rows)
        providers = {line["provider"] for line in self.ledger() if line["layer"] == "verify"}
        self.assertEqual({"giggal"}, providers)

    def test_record_needs_a_routing_file_for_the_verify_layer(self):
        self.queue_one_email()
        (self.work / "status.json").unlink()
        rows = self.verify_rows({})
        _, err = self.record("verify", "giggal", VERIFY_RESULT_HEADER, rows, expect=2)
        self.assertIn("--routing", err)
        self.record("verify", "giggal", VERIFY_RESULT_HEADER, rows, extra=("--routing", self.routing_path))

    def test_verify_results_need_the_verifier_raw_status_column(self):
        self.queue_one_email()
        rows = self.verify_rows({})
        header = [column for column in VERIFY_RESULT_HEADER if column != "verifier_raw_status"]
        _, err = self.record("verify", "giggal", header, rows, expect=2)
        self.assertIn("verifier_raw_status", err)

    def test_transient_set_comes_from_routing_and_a_transient_gate_always_counts(self):
        self.write_routing(lambda r: r["layers"]["verification"].update({"transient_raw_statuses": ["timeout"]}))
        self.queue_one_email()
        self.record("verify", "giggal", VERIFY_RESULT_HEADER, [
            # raw `error` is NOT in this fixture's transient set, so its unknown gate is final
            {"email": "ada@alpha.com", "person_ids": "A1", "source_providers": "aiark", "email_status": "unknown",
             "is_catch_all": "", "verifier_raw_status": "error", "verified_by": "giggal"},
            {"email": "amy@alpha.com", "person_ids": "A2", "source_providers": "aiark", "email_status": "unknown",
             "is_catch_all": "", "verifier_raw_status": "timeout", "verified_by": "giggal"},
            {"email": "ben@beta.com", "person_ids": "B1", "source_providers": "aiark", "email_status": "transient",
             "is_catch_all": "", "verifier_raw_status": "busy", "verified_by": "giggal"},
        ])
        results = {line["email"]: line["result"] for line in self.ledger() if line["layer"] == "verify"}
        self.assertEqual({"ada@alpha.com": "unknown", "amy@alpha.com": "transient", "ben@beta.com": "transient"},
                         results)
        self.plan()
        self.assertEqual({"amy@alpha.com", "ben@beta.com"}, {row["email"] for row in self.queue("queue-verify.csv")})
        self.assertIn("A1", self.queue_ids("queue-email-getleads.csv"))

    def test_verifier_key_and_name_are_read_from_routing(self):
        def mutate(routing):
            routing["providers"]["altcheck"] = {"name": "Alt Check (fixture)"}
            routing["layers"]["verification"]["provider"] = "altcheck"
            routing["layers"]["verification"]["cli"] = "scripts/altcheck_verify.mjs"
        self.write_routing(mutate)
        self.verifier = "altcheck"
        self.plan()
        self.respond("aiark", {"A1": "ada@alpha.com"})
        out = self.plan()
        self.assertIn("to verify with Alt Check (fixture) (run it through scripts/altcheck_verify.mjs", out)
        rows = self.verify_rows({"ada@alpha.com": "valid"})
        _, err = self.record("verify", "giggal", VERIFY_RESULT_HEADER, rows, expect=2)
        self.assertIn("--provider altcheck", err)
        self.verify({"ada@alpha.com": "valid"})
        self.finalize("--allow-pending")
        self.assertEqual("Alt Check (fixture)", self.by_pid("leads.verified.csv")["A1"]["verification_provider"])
        self.assertIn("## Verification (Alt Check (fixture))", self.report())


class LiveRoutingTests(WaterfallTestCase):
    """Checks on the LIVE outbound/reference/provider-routing.yaml against outbound/stack-contract.yaml."""

    def live(self):
        return yaml.safe_load(ROUTING_PATH.read_text(encoding="utf-8"))

    def contract(self):
        return yaml.safe_load(CONTRACT_PATH.read_text(encoding="utf-8"))

    @staticmethod
    def flat(text):
        return " ".join(str(text or "").split())

    def test_live_email_order_matches_the_stack_contract(self):
        """The live yaml's email order equals the order recorded in the stack contract.

        How the contract's order is read, and why this way: the contract records the email waterfall as prose
        in lead_data.contact_enrichment.notes, as numbered steps ("STEP 1. AI Ark reveal ...", "STEP 3.
        Prospeo, ONLY on rows ..."), and states it a second time in the slot's `tool` field ("AI Ark ->
        Prospeo (waterfall)"). Parsing free sentences would be brittle, so the test relies only on those two
        stable shapes. From the notes it takes every "STEP n." entry, in step-number order, and keeps the
        provider whose display name (providers.<key>.name in the live yaml) the step's text STARTS with. The
        verifier's steps (the interleaved verification) and STEP 0 (verify what the row already carries, no
        provider) drop out. From `tool` it splits on "->" after dropping the parenthetical. Both must equal
        layers.email.order. So re-ordering the contract's steps, putting a new finder in either place, or
        renaming a provider without updating the yaml fails here instead of drifting silently.
        """
        live, contract = self.live(), self.contract()
        slot = contract["lead_data"]["contact_enrichment"]
        verifier = live["layers"]["verification"]["provider"]
        finders = {key: meta["name"] for key, meta in live["providers"].items() if key != verifier}
        verifier_name = live["providers"][verifier]["name"]

        # approved_stack rule 4 must still point at this slot as the place the email order is recorded.
        self.assertIn("The recorded order for emails is in lead_data.contact_enrichment.notes",
                      self.flat(contract["approved_stack"]["rule"]))

        notes = self.flat(slot["notes"])
        steps = re.findall(r"STEP\s+(\d+)\.\s+(.*?)(?=\s+STEP\s+\d+\.|$)", notes)
        self.assertGreaterEqual(len(steps), 4, "could not find the numbered STEP entries in the contract notes")
        from_notes = []
        for _, text in sorted(steps, key=lambda step: int(step[0])):
            for key, name in finders.items():
                if text.startswith(name) and key not in from_notes:
                    from_notes.append(key)
        verify_steps = [text for _, text in steps if text.startswith(verifier_name)]
        self.assertGreaterEqual(len(verify_steps), 2, "the contract's verify steps no longer name the yaml verifier")

        by_name = {name: key for key, name in finders.items()}
        tool_parts = [part.strip() for part in re.sub(r"\(.*?\)", "", str(slot["tool"])).split("->")]
        from_tool = [by_name.get(part, f"<not in routing: {part}>") for part in tool_parts]

        order = live["layers"]["email"]["order"]
        self.assertEqual(from_notes, order)
        self.assertEqual(from_tool, order)

    def test_live_yaml_encodes_the_contract_catch_all_and_prospeo_rules(self):
        live, contract = self.live(), self.contract()
        notes = self.flat(contract["lead_data"]["contact_enrichment"]["notes"])
        self.assertIn("A catch_all verdict is NOT a rejection: it ends that person's walk and ships, labelled "
                      "catch_all, never going on to a later finder.", notes)
        self.assertIn("Never open AI Ark on a row GetLeads has not already attempted.", notes)
        self.assertIn("Never open Prospeo on a row AI Ark has not already attempted.", notes)
        email = live["layers"]["email"]
        self.assertEqual("stop", email["on_catch_all"])
        self.assertEqual({"aiark": ["getleads"], "prospeo": ["aiark"]}, email["requires_attempted"])

    def test_live_yaml_names_only_approved_providers(self):
        live, contract = self.live(), self.contract()
        self.assertEqual(FNNL_PROVIDERS, set(live["providers"]))
        approved = {str(item["tool"]) for item in contract["approved_stack"]["tools"]}
        for key, meta in live["providers"].items():
            self.assertIn(meta["name"], approved, key)
        for layer, cfg in live["layers"].items():
            for field in ("order", "widening_topup"):
                for provider in cfg.get(field) or []:
                    self.assertIn(provider, live["providers"], f"{layer}.{field}")
        verifier = live["layers"]["verification"]["provider"]
        self.assertEqual("giggal", verifier)
        self.assertEqual(contract["lead_data"]["email_verification"]["tool"], live["providers"][verifier]["name"])

    def test_live_yaml_has_no_phone_layer_and_phone_required_fails_loud(self):
        self.assertNotIn("phone", self.live()["layers"])
        self.routing_path = ROUTING_PATH
        self.write_spec(base_spec(phone_required=True))
        status, _, err = self.cli("plan", *self.state_args(), "--layer", "phone")
        self.assertEqual(2, status)
        self.assertIn("no usable layers.phone.order", err)


class ReservoirRung0Tests(WaterfallTestCase):
    """Aaron flow (see aaron-flow.md section 7): the reservoir is rung 0 of the email waterfall. --reservoir is
    optional (ReservoirRung0Tests opts in via write_reservoir()); every other test class never passes it, so
    the pre-reservoir behaviour is unchanged for them (checked by the full suite staying green)."""

    def test_rung0_hit_ships_without_any_finder_call(self):
        self.write_reservoir([{
            "linkedin_url": "https://www.linkedin.com/in/ada-one", "email": "ada@alpha.com",
            "company_domain": "alpha.com", "verdict": "valid", "verified_at": "2026-09-20", "source": "aiark",
        }])
        self.plan()
        # No finder is paid while the reservoir candidate is unresolved: VERIFY_PENDING halts evaluate_email
        # before next_rung ever runs for A1.
        for provider in FIXTURE_EMAIL_ORDER:
            self.assertNotIn("A1", self.queue_ids(f"queue-email-{provider}.csv"))
        self.assertIn("ada@alpha.com", [row["email"] for row in self.queue("queue-verify.csv")])
        self.drive({}, {"ada@alpha.com": "valid"})
        self.finalize()
        verified = self.by_pid("leads.verified.csv")
        self.assertEqual("ada@alpha.com", verified["A1"]["email"])
        self.assertFalse(any(pid == "A1" for _, pid in self.queued), "A1 should never reach a finder queue")

    def test_rung0_miss_when_stale_falls_through_to_the_normal_finder_order(self):
        self.write_reservoir([{
            "linkedin_url": "https://www.linkedin.com/in/ada-one", "email": "ada@alpha.com",
            "company_domain": "alpha.com", "verdict": "valid", "verified_at": "2026-01-01", "source": "aiark",
        }])
        self.plan()  # 2026-01-01 is well over the 90-day window from today
        self.assertIn("A1", self.queue_ids("queue-email-aiark.csv"))
        self.assertNotIn("ada@alpha.com", [row["email"] for row in self.queue("queue-verify.csv")])

    def test_rung0_catch_all_on_refresh_still_stops_to_holdback_not_to_a_finder(self):
        """A stored `valid` record that re-verifies catch_all in THIS campaign is treated like any other
        catch_all candidate under on_catch_all: stop (FNNL's unchanged catch-all timing rule, D3): it stops
        the walk and goes to the holdback, never falling through to a finder."""
        self.write_routing(lambda r: r["layers"]["email"].update({"on_catch_all": "stop"}))
        self.write_reservoir([{
            "linkedin_url": "https://www.linkedin.com/in/ada-one", "email": "ada@alpha.com",
            "company_domain": "alpha.com", "verdict": "valid", "verified_at": "2026-09-20", "source": "aiark",
        }])
        self.drive({}, {"ada@alpha.com": "catch_all"})
        self.finalize()
        holdback = self.by_pid("leads.catchall-holdback.csv")
        self.assertIn("A1", holdback)
        self.assertFalse(any(pid == "A1" for _, pid in self.queued))


class NoContactsCapAndColleagueProofTests(WaterfallTestCase):
    """Ruling no-contacts-cap (aaron-flow.md section 8): contacts_per_account: all is the default; a number
    stays a one-run operator override (FNNL keeps the override, A-Sales removed the field). Also the
    every-email-verified colleague-proof promotion (classify_candidate / self.proven_domains)."""

    def test_no_cap_all_means_every_eligible_person_at_the_account_ships(self):
        self.write_spec(base_spec(contacts_per_account="all", max_contacts_per_account=None))
        finds = {("aiark", pid): f"{pid.lower()}@alpha.com" for pid in ("A1", "A2", "A3", "A4")}
        verdicts = {f"{pid.lower()}@alpha.com": "valid" for pid in ("A1", "A2", "A3", "A4")}
        self.drive(finds, verdicts)
        self.finalize()
        verified = self.by_pid("leads.verified.csv")
        for pid in ("A1", "A2", "A3", "A4"):
            self.assertIn(pid, verified, pid)
        accounts = {row["company_domain"]: row for row in read_rows(self.work / "account-status.csv")}
        self.assertEqual("all", accounts["alpha.com"]["required"])
        self.assertEqual("ACCOUNT_ALL_WORKED", accounts["alpha.com"]["state"])

    def test_numeric_override_still_caps_at_the_given_number(self):
        self.write_spec(base_spec(contacts_per_account=3, max_contacts_per_account=3))
        finds = {("aiark", pid): f"{pid.lower()}@alpha.com" for pid in ("A1", "A2", "A3")}
        verdicts = {f"{pid.lower()}@alpha.com": "valid" for pid in ("A1", "A2", "A3")}
        self.drive(finds, verdicts)
        self.finalize()
        accounts = {row["company_domain"]: row for row in read_rows(self.work / "account-status.csv")}
        self.assertEqual("3", accounts["alpha.com"]["required"])
        self.assertEqual("ACCOUNT_SATISFIED", accounts["alpha.com"]["state"])
        stagger = self.by_pid("leads.stagger.csv")
        self.assertIn("A4", stagger)  # the 4th person at a 3-capped account is not_needed, not shipped

    def test_second_domain_allowed_by_colleague_proof(self):
        """A1 and A2 (colleagues at alpha.com) both verify valid on othercorp.com. Each proves the domain for
        the OTHER, not for themselves (the self-promotion case list_waterfall.py must refuse: see
        test_domain_mismatch_is_flagged_and_does_not_fill_a_slot, where A1 alone on a mismatch domain still
        goes to review)."""
        self.plan()
        self.respond("aiark", {"A1": "ada@othercorp.com", "A2": "amy@othercorp.com"})
        self.drive({}, {"ada@othercorp.com": "valid", "amy@othercorp.com": "valid"})
        self.finalize()
        verified = self.by_pid("leads.verified.csv")
        self.assertEqual("ada@othercorp.com", verified["A1"]["email"])
        self.assertEqual("amy@othercorp.com", verified["A2"]["email"])

    def test_brand_domain_from_company_alt_domains_proves_a_mismatch_with_no_colleague_needed(self):
        rows = base_contacts()
        for row in rows:
            if row["person_id"] == "A1":
                row["company_alt_domains"] = "othercorp.com"
        write_rows(self.contacts_path, CONTACT_HEADER + ["company_alt_domains"], rows)
        self.plan()
        self.respond("aiark", {"A1": "ada@othercorp.com"})
        self.drive({}, {"ada@othercorp.com": "valid"})
        self.finalize()
        verified = self.by_pid("leads.verified.csv")
        self.assertEqual("ada@othercorp.com", verified["A1"]["email"])


if __name__ == "__main__":
    unittest.main()
