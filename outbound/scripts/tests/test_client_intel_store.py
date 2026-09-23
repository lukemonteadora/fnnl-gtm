"""Tests for outbound/scripts/intel/client_intel_store.py.

Run: cd outbound/scripts && python -m unittest tests.test_client_intel_store
Every test runs against a throwaway profiles/ tree in a temp dir, never the real one.
Fixtures are neutral: made-up clients (acme, beta-co) and .example domains.
"""
import contextlib
import importlib.util
import io
import json
import re
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT_PATH = Path(__file__).resolve().parents[1] / "intel" / "client_intel_store.py"
SPEC = importlib.util.spec_from_file_location("client_intel_store", SCRIPT_PATH)
store = importlib.util.module_from_spec(SPEC)
sys.modules["client_intel_store"] = store
SPEC.loader.exec_module(store)

PATCHED = ("PROFILES", "HUB", "STATE_FILE", "ROSTER_FILE", "OVERRIDES_FILE", "CONFIG_FILE")


def _meeting(**kw):
    base = {
        "id": "email:abc123",
        "source": "email",
        "occurred_at": "2026-09-22T15:00:00Z",
        "target": "acme",
        "kind": "meeting",
        "title": "Weekly sync",
        "summary": "Agreed to pause the healthcare segment.",
        "body": "* Pause healthcare\n* Call Jane on +44 7517 967764",
        "affects": ["list"],
        "source_ref": {"notetaker": "ExampleNotes", "view_url": "https://mail.example/x"},
    }
    base.update(kw)
    return base


class StoreTest(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.tmp = Path(self._tmp.name)
        profiles = self.tmp / "profiles"
        hub = profiles / "_intel"
        clients = (
            ("acme", "https://www.acme.example", "acme-leads", "internal"),
            ("beta-co", "beta.example", "shared-beta-co", "shared"),
        )
        for slug, site, channel, kind in clients:
            (profiles / slug).mkdir(parents=True)
            (profiles / slug / "client-profile.yaml").write_text(
                f"business:\n  name: {slug.title()}\n  website: {site}\n"
                f"client_comms:\n  slack:\n    status: harvested\n    channels:\n"
                f"      - {{name: {channel}, id: C{slug.upper().replace('-', '')}, kind: {kind}, confirmed: true}}\n",
                encoding="utf-8",
            )
        (profiles / "_verify").mkdir(parents=True)  # underscore folders are not clients
        self._saved = {k: getattr(store, k) for k in PATCHED}
        store.PROFILES = profiles
        store.HUB = hub
        store.STATE_FILE = hub / "state.json"
        store.ROSTER_FILE = hub / "roster.json"
        store.OVERRIDES_FILE = hub / "roster-overrides.json"
        store.CONFIG_FILE = hub / "config.yaml"
        store.CLI_OVERRIDES.clear()
        store.reset_config()
        self._quiet = contextlib.redirect_stdout(io.StringIO())
        self._quiet.__enter__()
        store.build_roster()

    def tearDown(self):
        self._quiet.__exit__(None, None, None)
        for k, v in self._saved.items():
            setattr(store, k, v)
        store.CLI_OVERRIDES.clear()
        store.reset_config()
        self._tmp.cleanup()

    def items(self, items):
        p = self.tmp / "items.json"
        p.write_text(json.dumps(items), encoding="utf-8")
        return p

    def feed(self, slug="acme"):
        return (store.PROFILES / slug / "client-intel.md").read_text(encoding="utf-8")

    def write_config(self, text):
        store.CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)
        store.CONFIG_FILE.write_text(text, encoding="utf-8")
        store.reset_config()

    def all_profile_text(self):
        return "\n".join(p.read_text(encoding="utf-8", errors="replace")
                         for p in store.PROFILES.rglob("*") if p.is_file())

    # ------------------------------------------------------------------ the 13 upstream cases, re-keyed

    def test_roster_skips_underscore_folders_and_maps_channels(self):
        r = store.build_roster()
        self.assertEqual(set(r["clients"]), {"acme", "beta-co"})
        self.assertEqual(r["clients"]["acme"]["domains"], ["acme.example"])
        self.assertEqual(r["channels"]["acme-leads"]["class"], "dedicated")
        self.assertEqual(r["channels"]["acme-leads"]["client"], "acme")
        self.assertEqual(r["channels"]["shared-beta-co"]["client"], "beta-co")

    def test_roster_hard_excludes_secret_channels_even_if_overridden(self):
        store.OVERRIDES_FILE.parent.mkdir(parents=True, exist_ok=True)
        store.OVERRIDES_FILE.write_text(json.dumps({"channels": {
            "ai-api-keys": {"class": "agency"}, "team-keys": {"class": "agency"},
            "client-creds": {"class": "dedicated", "client": "acme"}}}), encoding="utf-8")
        r = store.build_roster()
        for name in ("ai-api-keys", "team-keys", "client-creds"):
            self.assertEqual(r["channels"][name]["class"], "excluded", name)

    def test_scrub_removes_phone_personal_email_and_secrets_but_keeps_dates(self):
        self.write_config("internal_domains: [ourteam.example]\n")
        s = store.scrub("Call +447517967764 or jane@acme.example, cc ops@ourteam.example on 2026-09-22. "
                        "key sk-abcdefghijklmnopqrstuvwx")
        self.assertNotIn("7517967764", s)
        self.assertIn("[phone removed]", s)
        self.assertNotIn("jane@acme.example", s)
        self.assertIn("[email @acme.example]", s)
        self.assertIn("ops@ourteam.example", s)  # our own configured domain is kept
        self.assertIn("2026-09-22", s)
        self.assertNotIn("sk-abc", s)

    def test_ingest_is_idempotent_and_files_meetings(self):
        p = self.items([_meeting(), {
            "id": "slack:CACME:1790000000.000100", "source": "slack", "occurred_at": "2026-09-22T09:00:00Z",
            "target": "acme", "kind": "request", "title": "Client asks to exclude existing customers",
            "affects": ["list"], "source_ref": {"channel": "acme-leads"},
        }])
        r1 = store.cmd_ingest(p, "run-1")
        self.assertEqual((r1["new"], r1["duplicate"]), (2, 0))
        r2 = store.cmd_ingest(p, "run-2")
        self.assertEqual((r2["new"], r2["duplicate"]), (0, 2))
        ledger = store.PROFILES / "acme" / "_intel" / "intel-log.jsonl"
        self.assertEqual(len(ledger.read_text(encoding="utf-8").strip().splitlines()), 2)
        meetings = list((store.PROFILES / "acme" / "_intel" / "meetings").glob("*.md"))
        self.assertEqual(len(meetings), 1)
        self.assertNotIn("7517", meetings[0].read_text(encoding="utf-8"))
        feed = self.feed()
        self.assertIn("Open items", feed)
        self.assertIn("exclude existing customers", feed)
        self.assertEqual(store.cmd_verify(p), 0)

    def test_ingest_rejects_malformed_items_all_or_nothing(self):
        p = self.items([_meeting(), _meeting(id="email:zzz", kind="gossip")])
        with self.assertRaises(SystemExit):
            store.cmd_ingest(p, "run-x")
        self.assertFalse((store.PROFILES / "acme" / "_intel" / "intel-log.jsonl").exists())

    def test_agency_items_file_under_the_configured_label_and_there_is_no_unmatched_bucket(self):
        self.write_config("agency_name: Northwind\n")
        r = store.cmd_ingest(self.items([
            _meeting(id="email:ops1", target="agency", kind="announcement", title="New onboarding checklist"),
            _meeting(id="email:u1", target="unmatched", kind="update", unmatched_name="Some Other Company",
                     title="Unpaid invoice, call scheduled"),
        ]), "run-u")
        self.assertEqual((r["new"], r["dropped_not_client"]), (1, 1))
        feed = (store.HUB / "agency" / "agency-intel.md").read_text(encoding="utf-8")
        self.assertIn("Northwind (internal ops)", feed)
        self.assertIn("New onboarding checklist", feed)
        self.assertFalse((store.HUB / "unmatched").exists())
        self.assertNotIn("Some Other Company", self.all_profile_text())

    def test_resolution_closes_an_open_item(self):
        req = {"id": "slack:C1:1.1", "source": "slack", "occurred_at": "2026-09-20T09:00:00Z", "target": "acme",
               "kind": "action_item", "title": "Send the DNC list", "source_ref": {"channel": "acme-leads"}}
        store.cmd_ingest(self.items([req]), "r1")
        self.assertIn("Send the DNC list", self.feed().split("## Recent")[0])
        res = {"id": "slack:C1:2.2", "source": "slack", "occurred_at": "2026-09-21T09:00:00Z", "target": "acme",
               "kind": "resolution", "title": "DNC list received", "resolves": "slack:C1:1.1",
               "source_ref": {"channel": "acme-leads"}}
        store.cmd_ingest(self.items([res]), "r2")
        self.assertNotIn("Send the DNC list", self.feed().split("## Recent")[0])

    def test_digest_puts_shortfalls_first_and_lists_meetings_without_recap(self):
        store.cmd_ingest(self.items([_meeting()]), "run-d")
        line = (store.PROFILES / "acme" / "_intel" / "intel-log.jsonl").read_text(encoding="utf-8").splitlines()[0]
        today = json.loads(line)["ingested_at"][:10]
        cov = self.tmp / "cov.json"
        cov.write_text(json.dumps({
            "shortfalls": ["Slack connector not authorized"],
            "calendar": {"events_seen": 2, "meetings": [
                {"title": "Beta kickoff", "start": "2026-09-22T10:00", "had_recap": False, "target": "beta-co"}]},
        }), encoding="utf-8")
        text = store.cmd_digest(today, cov).read_text(encoding="utf-8")
        self.assertLess(text.index("Shortfalls"), text.index("Needs attention"))
        self.assertIn("Beta kickoff", text)
        self.assertIn("the operator was not copied", text)

    def test_activity_adds_one_log_line_and_one_state_line_idempotently(self):
        log = store.PROFILES / "acme" / "activity-log.md"
        log.write_bytes((
            "# Acme: Activity Log\r\n\r\n## \U0001F4CD CURRENT STATE  (updated 2026-09-20)\r\n"
            "- **Last action:** x\r\n- **Workstreams:**\r\n  - Infra: ok\r\n  - Copy: drafted\r\n"
            "- **Key refs:** profile\r\n\r\n## CURRENT STATE (old duplicate)\r\n  - Copy: stale\r\n\r\n"
            "## \U0001F4DC LOG  (newest first)\r\n- [2026-09-20 10:00] copy · write · DONE: v1\r\n"
        ).encode("utf-8"))
        store.cmd_ingest(self.items([{
            "id": "slack:C1:9.9", "source": "slack", "occurred_at": "2026-09-22T09:00:00Z", "target": "acme",
            "kind": "decision", "title": "Client vetoed the audit offer", "affects": ["offer"],
            "source_ref": {"channel": "acme-leads"}}]), "r")
        r1 = store.cmd_activity("acme", "2026-09-23 07:40", 1, "offer veto")
        self.assertTrue(r1["ok"])
        self.assertEqual((r1["log"], r1["state"]), ("added", "added"))
        r2 = store.cmd_activity("acme", "2026-09-23 07:40", 1, "offer veto")
        self.assertEqual((r2["log"], r2["state"]), ("exists", "unchanged"))
        text = log.read_bytes().decode("utf-8")
        self.assertNotIn("\n", text.replace("\r\n", ""))  # CRLF preserved, no bare LF
        lines = text.split("\r\n")
        self.assertEqual(sum("client-intel · sync" in l for l in lines), 1)
        self.assertEqual(sum(l.lstrip().startswith("- Client intel") for l in lines), 1)
        first_block = text.split("## CURRENT STATE (old duplicate)")[0]
        self.assertIn("Client intel (meetings + Slack)", first_block)  # only the first block is touched
        self.assertIn("- [2026-09-20 10:00] copy", lines[lines.index(next(l for l in lines if "client-intel ·" in l)) + 1])

    def test_activity_fails_loud_without_a_log_section(self):
        (store.PROFILES / "acme" / "activity-log.md").write_text("# Acme\n\nno sections\n", encoding="utf-8")
        self.assertFalse(store.cmd_activity("acme", "2026-09-23 07:40", 1, "")["ok"])
        self.assertFalse(store.cmd_activity("beta-co", "2026-09-23 07:40", 1, "")["ok"])  # no file at all

    def test_activity_count_is_recounted_in_place_other_kinds_stay_first_write(self):
        def count(n):
            return {"id": "slack:CFEED:count:2026-09-23:acme", "source": "slack", "occurred_at": "2026-09-23T09:00:00Z",
                    "target": "acme", "kind": "activity_count", "title": f"Acme meetings booked: {n}",
                    "affects": ["meetings"], "source_ref": {"channel": "feed"}}
        self.assertEqual(store.cmd_ingest(self.items([count(3)]), "r1")["new"], 1)
        r = store.cmd_ingest(self.items([count(5)]), "r2")
        self.assertEqual((r["new"], r["updated"], r["duplicate"]), (0, 1, 0))
        r = store.cmd_ingest(self.items([count(5)]), "r3")
        self.assertEqual((r["new"], r["updated"], r["duplicate"]), (0, 0, 1))
        ledger = (store.PROFILES / "acme" / "_intel" / "intel-log.jsonl").read_text(encoding="utf-8").strip().splitlines()
        self.assertEqual(len(ledger), 1)
        self.assertEqual(json.loads(ledger[0])["title"], "Acme meetings booked: 5")
        # A non-count item with a changed body is still first-write-wins.
        store.cmd_ingest(self.items([_meeting()]), "r4")
        r = store.cmd_ingest(self.items([_meeting(summary="changed")]), "r5")
        self.assertEqual((r["updated"], r["duplicate"]), (0, 1))
        self.assertEqual(store.cmd_verify(None), 0)

    def test_digest_accumulates_coverage_across_runs_on_the_same_day(self):
        store.cmd_ingest(self.items([_meeting()]), "run-a")
        today = json.loads((store.PROFILES / "acme" / "_intel" / "intel-log.jsonl").read_text(encoding="utf-8")
                           .splitlines()[0])["ingested_at"][:10]
        cov = self.tmp / "c.json"
        cov.write_text(json.dumps({"run_id": "run-a", "shortfalls": ["Email connector expired"]}), encoding="utf-8")
        store.cmd_digest(today, cov)
        cov.write_text(json.dumps({"run_id": "run-b", "notes": ["second run"]}), encoding="utf-8")
        text = store.cmd_digest(today, cov).read_text(encoding="utf-8")
        self.assertIn("Email connector expired (run-a)", text)  # the first run's shortfall survives
        self.assertIn("## Coverage (run-a)", text)
        self.assertIn("## Coverage (run-b)", text)
        cov.write_text(json.dumps({"run_id": "run-b", "notes": ["second run, rerun"]}), encoding="utf-8")
        text = store.cmd_digest(today, cov).read_text(encoding="utf-8")
        self.assertEqual(text.count("## Coverage (run-b)"), 1)  # same run id replaces, not duplicates

    def test_state_set_merges_slack_cursors(self):
        p = self.tmp / "s.json"
        p.write_text(json.dumps({"cursors": {"slack": {"C1": "1.0"}}, "last_run_at": "x"}), encoding="utf-8")
        store.cmd_state_set(p)
        p.write_text(json.dumps({"cursors": {"slack": {"C2": "2.0"}, "email_after_epoch": 5}}), encoding="utf-8")
        store.cmd_state_set(p)
        st = store.load_state()
        self.assertEqual(st["cursors"]["slack"], {"C1": "1.0", "C2": "2.0"})
        self.assertEqual(st["cursors"]["email_after_epoch"], 5)
        self.assertEqual(st["last_run_at"], "x")

    # ------------------------------------------------------------------ cross-agency guard

    def test_cross_agency_items_are_dropped_counted_and_never_stored(self):
        marker = "ZEBRA-CANARY-7731"
        items = [
            _meeting(),
            _meeting(id="email:other1", target="other-agency-client", title=f"{marker} renewal call",
                     body=f"{marker} notes"),
            {"id": f"slack:CX:count:2026-09-23:other-agency-client", "source": "slack",
             "occurred_at": "2026-09-23T09:00:00Z", "target": "other-agency-client", "kind": "activity_count",
             "title": f"{marker} meetings booked: 4"},
        ]
        p = self.items(items)
        dry = store.cmd_ingest(p, "run-g", dry_run=True)
        self.assertEqual((dry["dropped_not_client"], dry["dropped_indexes"]), (2, [1, 2]))
        self.assertFalse((store.PROFILES / "acme" / "_intel").exists())  # dry run writes nothing
        r = store.cmd_ingest(p, "run-g")
        self.assertEqual((r["new"], r["dropped_not_client"]), (1, 2))
        self.assertEqual(set(r["targets"]), {"acme"})
        self.assertFalse((store.PROFILES / "other-agency-client").exists())  # never creates a profile folder
        self.assertNotIn(marker, self.all_profile_text())  # nothing of the dropped items is stored anywhere
        drops = json.loads(next((store.HUB / "daily").glob("*.drops.json")).read_text(encoding="utf-8"))
        self.assertEqual(drops, [{"run_id": "run-g", "at": drops[0]["at"], "dropped_not_client": 2}])
        # verify expects only the filed items; the dropped ones are counted, not missing.
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            self.assertEqual(store.cmd_verify(p), 0)
        summary = json.loads(buf.getvalue())["items_per_target"]
        self.assertEqual((summary["_expected"], summary["_present"], summary["_dropped_not_client"]), (1, 1, 2))
        # The digest carries the count, never the content.
        day = json.loads((store.PROFILES / "acme" / "_intel" / "intel-log.jsonl").read_text(encoding="utf-8")
                         .splitlines()[0])["ingested_at"][:10]
        cov = self.tmp / "cov.json"
        cov.write_text(json.dumps({"run_id": "run-g", "skipped_not_client": 5,
                                   "accounts": {"email": "ops@ourteam.example", "slack_workspace": "ourteam"}}),
                       encoding="utf-8")
        text = store.cmd_digest(day, cov).read_text(encoding="utf-8")
        self.assertIn("5 items skipped while reading and 2 dropped at ingest", text)
        self.assertIn("Read: email ops@ourteam.example; slack_workspace ourteam", text)
        self.assertNotIn(marker, text)

    def test_target_resolves_by_slug_alias_or_domain_only_to_profiled_clients(self):
        roster = store.build_roster()
        targets = set(store.known_targets())
        self.assertEqual(store.resolve_target("acme", targets, roster), "acme")
        self.assertEqual(store.resolve_target("Beta Co", targets, roster), "beta-co")  # display name
        self.assertEqual(store.resolve_target("acme.example", targets, roster), "acme")  # website domain
        self.assertEqual(store.resolve_target("agency", targets, roster), "agency")
        for foreign in ("unmatched", "acme-health", "other.example", "", None):
            self.assertIsNone(store.resolve_target(foreign, targets, roster), foreign)
        r = store.cmd_ingest(self.items([_meeting(target="Acme")]), "run-r")
        self.assertEqual(set(r["targets"]), {"acme"})

    def test_roster_classes_channels_by_the_kind_the_slack_check_recorded(self):
        prof = store.PROFILES / "acme" / "client-profile.yaml"
        prof.write_text(
            "business:\n  name: Acme\n  website: acme.example\n"
            "client_comms:\n  slack:\n    channels:\n"
            "      - {name: acme-leads, id: CACME, kind: internal, confirmed: true}\n"
            "      - {name: sales, id: CSALES, kind: mention, confirmed: true}\n"
            "      - {name: mpdm-acme-team, id: GDM1, kind: dm_group, confirmed: true}\n"
            "      - {name: acme-maybe, id: CMAYBE, kind: internal, confirmed: false}\n"
            "      - {name: northwind-acme, id: CTAG, kind: internal}\n",
            encoding="utf-8")
        self.write_config("agency_name: Northwind\n")
        r = store.build_roster()
        ch = r["channels"]
        self.assertEqual((ch["sales"]["class"], ch["sales"]["client"]), ("agency", None))
        self.assertEqual(ch["mpdm-acme-team"]["class"], "excluded")
        self.assertNotIn("acme-maybe", ch)  # unconfirmed hits are not read
        self.assertEqual((ch["northwind-acme"]["class"], ch["northwind-acme"]["client"]), ("dedicated", "acme"))
        store.OVERRIDES_FILE.write_text(json.dumps({"channels": {
            "orbit-leads": {"class": "dedicated", "client": "orbit"}}}), encoding="utf-8")
        ch = store.build_roster()["channels"]
        self.assertEqual(ch["orbit-leads"]["class"], "excluded")  # a client with no profile here is never read

    # ------------------------------------------------------------------ no agency-specific defaults

    def test_no_agency_specific_defaults(self):
        self.assertEqual(store.DEFAULT_CONFIG, {"agency_name": "Agency", "internal_domains": [], "timezone": None,
                                                "slack_workspace": None, "aliases_file": None})
        self.assertFalse(store.CONFIG_FILE.exists())
        c = store.cfg()
        self.assertEqual((c["internal_domains"], c["slack_workspace"], c["aliases_file"]), ([], None, None))
        # With no internal domains configured, every address loses its person.
        self.assertEqual(store.scrub("ping ops@anything.example"), "ping [email @anything.example]")
        r = store.build_roster()
        self.assertEqual((r["internal_domains"], r["slack_workspace"]), ([], None))
        self.assertTrue(r["timezone"].startswith("system local"))
        store.cmd_ingest(self.items([_meeting(id="email:a1", target="agency", kind="announcement")]), "run-n")
        self.assertIn("# Client Intel: Agency (internal ops)", (store.HUB / "agency" / "agency-intel.md").read_text(encoding="utf-8"))
        # The source carries no workspace id, email domain, named timezone or path into another repo.
        src = SCRIPT_PATH.read_text(encoding="utf-8")
        self.assertIsNone(re.search(r"\bT0[0-9A-Z]{8,}\b", src), "hardcoded Slack team id")
        self.assertIsNone(re.search(r"[\"'][a-z0-9.-]+\.(?:co|com|io|ai|net|org)[\"']", src), "hardcoded domain")
        self.assertIsNone(re.search(r"[\"'][A-Z][a-z]+/[A-Z][A-Za-z_]+[\"']", src), "hardcoded IANA zone")
        self.assertNotIn("../", src)
        self.assertFalse(hasattr(store, "ALIASES_FILE"))

    def test_config_file_and_flags_set_the_settings(self):
        self.write_config("agency_name: Northwind\ninternal_domains: ['@OurTeam.example', 'https://www.ops.example/']\n"
                          "slack_workspace: northwind-hq\n")
        c = store.cfg()
        self.assertEqual((c["agency_name"], c["internal_domains"], c["slack_workspace"]),
                         ("Northwind", ["ourteam.example", "ops.example"], "northwind-hq"))
        self.assertEqual(c["_source"]["agency_name"], "config.yaml")
        store.CLI_OVERRIDES.update({"agency_name": "Flagged", "internal_domains": "a.example,b.example"})
        store.reset_config()
        c = store.cfg()
        self.assertEqual((c["agency_name"], c["internal_domains"]), ("Flagged", ["a.example", "b.example"]))
        self.assertEqual(c["slack_workspace"], "northwind-hq")  # the flag overrides only what it names
        self.write_config("- not\n- a mapping\n")
        with self.assertRaises(SystemExit):
            store.cfg()

    def test_timezone_sets_day_boundaries_and_an_unknown_zone_fails_loud(self):
        late = _meeting(id="email:tz1", occurred_at="2026-09-22T20:00:00Z")
        self.write_config("timezone: '+08:00'\n")
        self.assertEqual(store.meeting_file("acme", late).name[:10], "2026-09-23")
        self.assertTrue(store.now_iso().endswith("+08:00"))
        self.write_config("timezone: '-05:00'\n")
        self.assertEqual(store.meeting_file("acme", late).name[:10], "2026-09-22")
        self.write_config("timezone: UTC\n")
        self.assertEqual(store.local_day("2026-09-22T23:30:00-02:00"), "2026-09-23")
        self.write_config("timezone: Mars/Olympus_Mons\n")
        with self.assertRaises(SystemExit):
            store.now_iso()

    def test_file_id_is_a_stable_content_hash(self):
        f = self.tmp / "recap.txt"
        f.write_text("notes from the call", encoding="utf-8")
        a = store.cmd_file_id(f)["id"]
        self.assertTrue(re.fullmatch(r"file:[0-9a-f]{12}", a))
        self.assertEqual(store.cmd_file_id(f)["id"], a)
        self.assertTrue(store.cmd_file_id(f, "manual")["id"].startswith("manual:"))
        f.write_text("notes from the call, edited", encoding="utf-8")
        self.assertNotEqual(store.cmd_file_id(f)["id"], a)


if __name__ == "__main__":
    unittest.main()
