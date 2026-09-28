import contextlib
import csv
import importlib.util
import io
import json
import sys
import tempfile
import unittest
from pathlib import Path

import yaml


SCRIPT_PATH = Path(__file__).resolve().parents[1] / "list_qa.py"
SPEC = importlib.util.spec_from_file_location("list_qa", SCRIPT_PATH)
list_qa = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
sys.modules["list_qa"] = list_qa  # dataclasses resolve annotations through sys.modules
SPEC.loader.exec_module(list_qa)


HEADER = [
    "first_name", "last_name", "company_name", "company_domain", "linkedin_url", "job_title", "email",
    "email_status", "is_catch_all", "email_source", "email_verified_at", "wave_slot", "lead_score",
    "priority_tier", "send_eligible", "fit_status", "headcount", "country", "industry", "source", "source_arm",
    "person_company_domain", "title_status", "title_role_tier", "title_buyer_priority", "title_seniority",
    "title_functions", "title_rule", "title_classifier",
]

TITLES = {
    "exact": "VP Revenue Operations",
    "strong": "Director of Revenue Operations",
    "influencer": "Revenue Operations Manager",
}

FIRSTS = ["Alice", "Brian", "Carla", "David", "Elena", "Frank", "Grace", "Henry", "Irene", "James", "Karen",
          "Louis", "Maria", "Nolan", "Olivia", "Peter", "Quentin"]
LASTS = ["Abbott", "Barnes", "Cortez", "Dunn", "Ellis", "Fowler", "Garcia", "Hayes", "Ingram", "Jensen", "Keller",
         "Lowe", "Moreno", "Nash", "Ortiz", "Porter", "Quinlan"]


def target_spec(**overrides):
    spec = {
        "schema_version": 1,
        "client": "acme",
        "spec_version": "acme-targeting-v1",
        "status": "locked",
        "account": {
            "geography": {"countries_in": ["United States"], "countries_out": []},
            "headcount": {"min": 20, "max": 499, "borderline_pct": 15},
            "industries_out": ["gambling"],
            "exclusions": {"domains": [], "competitor_domains": ["rival.com"], "existing_customer_domains": [],
                           "existing_customers_file": None, "internal_domains": []},
        },
        "buyers": {
            "contacts_per_account": 2,
            "max_contacts_per_account": 2,
            "work_email_required": True,
            "personal_email_policy": "fail",
            "function_families": [{"id": "revops", "name": "Revenue Operations",
                                   "include_patterns": ["revenue operations"], "exclude_patterns": []}],
            "role_tiers": {
                "exact": [{"functions": ["revops"], "seniority": ["c_level", "vp", "head"]}],
                "strong": [{"functions": ["revops"], "seniority": ["director"]}],
                "influencer": [{"functions": ["revops"], "seniority": ["manager"]}],
            },
            "generic_executive": {"default_tier": "review", "size_rules": []},
            "title_exclusions": ["intern", "student", "retired"],
            "contact_exclusions": {"linkedin_urls": [], "emails": [], "name_patterns": []},
        },
        "expectations": {
            "max_share_out_of_headcount_range": 0.05,
            "max_share_out_of_geography": 0.03,
            "max_share_non_target_function": 0.05,
            "max_share_missing_headcount": 0.25,
            "min_share_exact_or_strong": 0.40,
            "headcount_bands": [[1, 19], [20, 99], [100, 249], [250, 499], [500, 999], [1000, None]],
        },
    }
    spec.update(overrides)
    return spec


def lead(first, last, domain, tier="exact", *, title=None, company=None, email=None, headcount="150",
         country="United States", email_source="aiark", source_arm="aiark_lookalike", slug=None, **extra):
    slug = slug or f"{first}-{last}-{domain.split('.')[0]}".lower()
    row = {
        "first_name": first,
        "last_name": last,
        "company_name": company or domain.split(".")[0].title() + " Inc",
        "company_domain": domain,
        "linkedin_url": f"https://www.linkedin.com/in/{slug}/",
        "job_title": title or TITLES[tier],
        "email": email or f"{first.lower()}@{domain}",
        "email_status": "valid",
        "is_catch_all": "false",
        "email_source": email_source,
        "email_verified_at": "2026-09-20T00:00:00+00:00",
        "wave_slot": "primary",
        "lead_score": "7.5",
        "priority_tier": "P2",
        "send_eligible": "true",
        "fit_status": "good",
        "headcount": headcount,
        "country": country,
        "industry": "software",
        "source": "aiark_people_search",
        "source_arm": source_arm,
    }
    row.update(extra)
    if "priority_tier" not in extra:   # lead_score.py always writes the tier that matches the score
        sc = float(row["lead_score"])
        row["priority_tier"] = "P1" if sc >= 9 else "P2" if sc >= 7 else "P3" if sc >= 5 else "P4" if sc >= 3 else "P5"
    return row


def fixture_rows():
    rows = []
    tiers = {1: "exact", 2: "strong", 0: "influencer"}
    for i in range(1, 18):
        dom = f"co{i:02d}.com"
        kw = {"email_source": "aiark" if i <= 10 else "prospeo",
              "source_arm": "aiark_lookalike" if i % 2 else "aiark_filter"}
        if i == 3:
            kw["country"] = "US"
        if i == 4:
            kw["country"] = "USA"
        if i == 5:
            kw["wave_slot"] = "promoted_fallback"
        if i in (7, 8):
            kw["headcount"] = ""  # joined from the company file
        if i == 9:
            kw["fit_status"] = "maybe"
        if i in (15, 16):  # classified upstream by the AI pass
            kw.update(title="Revenue Systems Lead", title_status="pass", title_role_tier="strong",
                      title_buyer_priority="P2", title_seniority="head" if i == 15 else "",
                      title_functions="revops", title_rule="ai_verdict", title_classifier="ai")
            rows.append(lead(FIRSTS[i - 1], LASTS[i - 1], dom, **kw))
            continue
        rows.append(lead(FIRSTS[i - 1], LASTS[i - 1], dom, tiers[i % 3], **kw))
    # three contacts at one company: the third overflows the 2-per-company cap
    rows.append(lead("Dana", "Exact", "dense.com", "exact", lead_score="9"))
    rows.append(lead("Evan", "Strong", "dense.com", "strong", lead_score="8"))
    rows.append(lead("Fay", "Influence", "dense.com", "influencer", lead_score="7"))
    # non-target title
    rows.append(lead("Gus", "Engineer", "co18.com", title="Head of Engineering"))
    # four under-20 companies, all from one email source
    for j, (f, l_) in enumerate([("Hal", "Tiny"), ("Ida", "Small"), ("Jon", "Micro"), ("Kay", "Mini")]):
        rows.append(lead(f, l_, f"co{19 + j}.com", headcount="5", email_source="getleads",
                         source_arm="getleads_search"))
    rows.append(lead("Jane", "Doe", "co23.com", email="jane.doe@gmail.com"))
    rows.append(lead("Mia", "Mismatch", "co24.com", email="mia@co24mail.com"))
    rows.append(lead("Ned", "Catchall", "co25.com", email_status="catch_all", is_catch_all="true"))
    rows.append(lead("Sam", "Suppressed", "co26.com", email="sam@co26.com"))
    rows.append(lead("Pat", "Hostile", "hostile.com", company="Hostile Corp"))
    rows.append(lead("Ann", "Active", "co27.com", email="ann@co27.com"))
    rows.append(lead("Dana", "Dup", "co28.com", slug="dana-dup", email="dana@co28.com", lead_score="8"))
    rows.append(lead("Dana", "Dup", "co28.com", slug="dana-dup", email="d.dup@co28.com", lead_score="6"))
    rows.append(lead("Lee", "Twice", "co29.com", slug="lee-one", email="lee@co29.com", lead_score="7"))
    rows.append(lead("Leo", "Twice", "co29.com", slug="lee-two", email="lee@co29.com", lead_score="5"))
    rows.append(lead("Info", "Desk", "co30.com", email="info@co30.com"))
    rows.append(lead("Smith", "Smith", "co31.com"))
    rows.append(lead("John23", "Parker", "co32.com", email="jparker@co32.com"))
    rows.append(lead("Bob", "Rival", "rival.com"))
    rows.append(lead("Wendy", "Moved", "co33.com", person_company_domain="otherco.com"))
    return rows


def write_csv(path, header, rows):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=header, extrasaction="ignore")
        w.writeheader()
        for r in rows:
            w.writerow({k: r.get(k, "") for k in header})


def read_csv(path):
    with path.open(encoding="utf-8-sig", newline="") as fh:
        return list(csv.DictReader(fh))


class ListQATestBase(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        root = Path(self.tmp.name)
        self.profile = root / "profiles" / "acme"
        self.dir = self.profile / "campaigns" / "wave1"
        self.dir.mkdir(parents=True)
        self.spec_path = self.profile / "targeting-spec.yaml"
        self.spec_path.write_text(yaml.safe_dump(target_spec(), sort_keys=False), encoding="utf-8")
        self.rows = fixture_rows()
        write_csv(self.dir / "leads.verified.csv", HEADER, self.rows)
        self.suppression = self.profile / "suppression-list.csv"
        write_csv(self.suppression,
                  ["email", "company_domain", "linkedin_url", "company_name", "reason", "source_campaign", "date_added"],
                  [{"email": "sam@co26.com", "company_domain": "co26.com", "company_name": "Co26 Inc",
                    "reason": "unsubscribe", "source_campaign": "old", "date_added": "2026-09-01"},
                   {"company_domain": "hostile.com", "company_name": "Hostile Corp", "reason": "negative_hostile",
                    "source_campaign": "old", "date_added": "2026-09-02"}])
        self.active = root / "active-export.csv"
        write_csv(self.active, ["Email", "First Name", "Campaign"],
                  [{"Email": "ann@co27.com", "First Name": "Ann", "Campaign": "live-1"}])
        self.companies = root / "tam.csv"
        write_csv(self.companies, ["company_domain", "headcount", "country"],
                  [{"company_domain": "co07.com", "headcount": "60", "country": "United States"},
                   {"company_domain": "co08.com", "headcount": "300", "country": "United States"}])

    def tearDown(self):
        self.tmp.cleanup()

    def run_qa(self, *extra, suppression=True, dir_=None):
        argv = ["run", "--dir", str(dir_ or self.dir), "--spec", str(self.spec_path),
                "--companies", str(self.companies), "--active-leads", str(self.active)]
        if suppression:
            argv += ["--suppression", str(self.suppression)]
        argv += list(extra)
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = list_qa.main(argv)
        return code, out.getvalue(), err.getvalue()

    def score(self, sample_path):
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = list_qa.main(["score-sample", "--dir", str(self.dir), "--sample", str(sample_path)])
        return code, out.getvalue(), err.getvalue()

    def by_email(self, name):
        return {r["email"]: r for r in read_csv(self.dir / name)}


class RunRoutingTest(ListQATestBase):
    def test_rows_land_in_the_right_file_with_the_right_reason(self):
        code, _, err = self.run_qa()
        self.assertEqual(code, 0, err)

        ready = read_csv(self.dir / "leads.verified.csv")
        self.assertEqual(len(ready), 21)
        self.assertTrue(all(r["qa_status"] == "pass" for r in ready))
        self.assertTrue(all(r["qa_severity"] in ("PASS", "INFO", "WARN") for r in ready))
        for col in ["first_name_norm", "company_domain_norm", "headcount_num", "headcount_source", "person_key",
                    "qa_icp", "qa_title", "qa_seniority", "qa_company_match", "qa_contact", "qa_suppression",
                    "qa_reasons", "email_source", "title_status"]:
            self.assertIn(col, ready[0])
        ready_by_email = {r["email"]: r for r in ready}
        self.assertEqual(ready_by_email["grace@co07.com"]["headcount_source"], "companies_file")
        self.assertEqual(ready_by_email["grace@co07.com"]["headcount_num"], "60")
        self.assertEqual(ready_by_email["carla@co03.com"]["country_norm"], "united states")
        self.assertIn("fit_maybe", ready_by_email["irene@co09.com"]["qa_reasons"])
        self.assertIn("seniority_unknown", ready_by_email["peter@co16.com"]["qa_reasons"])
        self.assertIn("dana@co28.com", ready_by_email)   # the better duplicate is kept
        self.assertIn("lee@co29.com", ready_by_email)
        self.assertEqual(ready_by_email["lee@co29.com"]["first_name"], "Lee")
        self.assertIn("dana@dense.com", ready_by_email)
        self.assertIn("evan@dense.com", ready_by_email)

        rejected = self.by_email("leads.rejected.csv")
        expected = {
            "gus@co18.com": "title_non_target_function:engineering",
            "hal@co19.com": "headcount_out_of_range",
            "kay@co22.com": "headcount_out_of_range",
            "jane.doe@gmail.com": "personal_email",
            "sam@co26.com": "suppressed:unsubscribe",
            "pat@hostile.com": "suppressed:negative_hostile",
            "ann@co27.com": "already_active",
            "d.dup@co28.com": "duplicate_of:li:dana-dup",
            "info@co30.com": "broken_name:non_person_word",
            "smith@co31.com": "broken_name:first_equals_last",
            "jparker@co32.com": "broken_name:contains_digits",
            "bob@rival.com": "excluded_account:competitor_domains",
            "wendy@co33.com": "wrong_company",
        }
        for email, reason in expected.items():
            self.assertIn(email, rejected, email)
            self.assertIn(reason, rejected[email]["qa_reasons"], email)
            self.assertEqual(rejected[email]["qa_severity"], "CRITICAL")
        dup_email = [r for r in read_csv(self.dir / "leads.rejected.csv") if r["first_name"] == "Leo"]
        self.assertEqual(len(dup_email), 1)
        self.assertIn("duplicate_of:li:lee-one", dup_email[0]["qa_reasons"])
        self.assertEqual(dup_email[0]["qa_suppression"], "FAIL")
        self.assertEqual(len(read_csv(self.dir / "leads.rejected.csv")), 16)

        review = self.by_email("leads.review.csv")
        self.assertEqual(list(review), ["mia@co24mail.com"])
        self.assertEqual(review["mia@co24mail.com"]["review_reason"], "qa_email_domain_mismatch")
        holdback = self.by_email("leads.catchall-holdback.csv")
        self.assertEqual(list(holdback), ["ned@co25.com"])
        self.assertEqual(holdback["ned@co25.com"]["holdback_reason"], "catch_all_unresolved")
        stagger = self.by_email("leads.stagger.csv")
        self.assertEqual(list(stagger), ["fay@dense.com"])
        self.assertEqual(stagger["fay@dense.com"]["stagger_reason"], "density_overflow")

        pre = read_csv(self.dir / "leads.verified.pre-scorecard.csv")
        self.assertEqual(len(pre), 40)
        self.assertNotIn("qa_status", pre[0])

    def test_report_leads_with_the_attributed_anomaly_and_has_no_dashes(self):
        code, _, err = self.run_qa()
        self.assertEqual(code, 0, err)
        report = (self.dir / "list-qa-report.md").read_text(encoding="utf-8")
        self.assertIn("**Verdict: READY WITH WARNINGS, manual QA pending.**", report)
        anomalies, built = report.index("## Anomalies"), report.index("## What we built")
        self.assertLess(anomalies, built)
        section = report[anomalies:built]
        self.assertIn("CRITICAL", section)
        self.assertIn("4 of 4 out-of-range rows came from email source getleads (getleads supplied 10.0% of all input rows)",
                      section)
        self.assertIn("source arm getleads_search", section)
        self.assertIn("**21 campaign-ready contacts across 20 companies**", report)
        order = ["## Distributions", "## Removed during QA", "## Six-dimension row gate", "## Nine-dimension grade",
                 "## Manual stratified QA", "## Issues caught and fix-loop recommendations", "## Next step"]
        positions = [report.index(h) for h in order]
        self.assertEqual(positions, sorted(positions))
        self.assertIn("Grade A", report)
        self.assertNotIn("\u2014", report)
        self.assertNotIn("\u2013", report)

    def test_existing_queue_rows_survive_with_a_union_header(self):
        write_csv(self.dir / "leads.review.csv", ["email", "person_id", "review_reason", "waterfall_note"],
                  [{"email": "old@earlier.com", "person_id": "li:old-person", "review_reason": "risky",
                    "waterfall_note": "from the waterfall"}])
        code, _, err = self.run_qa()
        self.assertEqual(code, 0, err)
        review = self.by_email("leads.review.csv")
        self.assertEqual(set(review), {"old@earlier.com", "mia@co24mail.com"})
        self.assertEqual(review["old@earlier.com"]["waterfall_note"], "from the waterfall")
        self.assertIn("qa_reasons", review["mia@co24mail.com"])


class BlockAndRerunTest(ListQATestBase):
    def test_unverified_row_blocks_without_touching_the_send_file(self):
        rows = [lead("Alice", "Abbott", "co01.com"), lead("Brian", "Barnes", "co02.com", email_status="risky")]
        write_csv(self.dir / "leads.verified.csv", HEADER, rows)
        before = (self.dir / "leads.verified.csv").read_bytes()
        code, out, _ = self.run_qa()
        self.assertEqual(code, 3)
        self.assertEqual((self.dir / "leads.verified.csv").read_bytes(), before)
        self.assertFalse((self.dir / "leads.rejected.csv").exists())
        report = (self.dir / "list-qa-report.md").read_text(encoding="utf-8")
        self.assertTrue(report.splitlines()[2].startswith("**Verdict: BLOCKED (systemic).**"))
        self.assertIn("email waterfall", report)
        self.assertIn("the email verifier", report)   # the role, never a brand
        self.assertNotIn("\u2014", report)

    def test_banned_source_and_scoring_leakage_block(self):
        cases = [
            ({"source": "serp site:linkedin.com/in"}, "contact discovery"),
            ({"send_eligible": "false"}, "lead scoring"),
            ({"fit_status": "bad"}, "lead scoring"),
        ]
        for extra, owner in cases:
            with self.subTest(extra=extra):
                rows = [lead("Alice", "Abbott", "co01.com"), lead("Brian", "Barnes", "co02.com", **extra)]
                write_csv(self.dir / "leads.verified.csv", HEADER, rows)
                code, _, _ = self.run_qa()
                self.assertEqual(code, 3)
                report = (self.dir / "list-qa-report.md").read_text(encoding="utf-8")
                self.assertIn("BLOCKED", report.splitlines()[2])
                self.assertIn(owner, report)

    def test_rerun_reads_the_pre_scorecard_copy_and_does_not_duplicate_queues(self):
        code, _, err = self.run_qa()
        self.assertEqual(code, 0, err)
        counts = {n: len(read_csv(self.dir / n)) for n in
                  ("leads.rejected.csv", "leads.review.csv", "leads.catchall-holdback.csv", "leads.stagger.csv")}

        code, _, err = self.run_qa()
        self.assertEqual(code, 2)
        self.assertIn("--rerun", err)

        # without --suppression: the profile-level suppression list is auto-detected
        code, _, err = self.run_qa("--rerun", suppression=False)
        self.assertEqual(code, 0, err)
        self.assertEqual(len(read_csv(self.dir / "leads.verified.csv")), 21)
        for name, n in counts.items():
            self.assertEqual(len(read_csv(self.dir / name)), n, name)
        self.assertIn("suppressed:unsubscribe", self.by_email("leads.rejected.csv")["sam@co26.com"]["qa_reasons"])
        self.assertEqual(len(read_csv(self.dir / "leads.verified.pre-scorecard.csv")), 40)

    def test_rerun_after_a_spec_change_moves_rows_out_of_stale_queues(self):
        write_csv(self.dir / "leads.stagger.csv", ["person_id", "state", "stagger_reason", "ready_email"],
                  [{"person_id": "li:waterfall-person", "state": "NOT_NEEDED",
                    "stagger_reason": "not_needed: the account already has 2 ready contacts"}])
        code, _, err = self.run_qa()
        self.assertEqual(code, 0, err)
        self.assertIn("fay@dense.com", self.by_email("leads.stagger.csv"))

        spec = target_spec()
        spec["buyers"]["max_contacts_per_account"] = 3
        self.spec_path.write_text(yaml.safe_dump(spec), encoding="utf-8")
        code, _, err = self.run_qa("--rerun")
        self.assertEqual(code, 0, err)
        self.assertIn("fay@dense.com", self.by_email("leads.verified.csv"))
        stagger = read_csv(self.dir / "leads.stagger.csv")
        self.assertEqual([r["person_id"] for r in stagger], ["li:waterfall-person"])  # the waterfall's row survives

    def test_draft_spec_and_missing_customer_file_exit_2(self):
        self.spec_path.write_text(yaml.safe_dump(target_spec(status="draft")), encoding="utf-8")
        code, _, err = self.run_qa()
        self.assertEqual(code, 2)
        self.assertIn("draft", err)
        spec = target_spec()
        spec["account"]["exclusions"]["existing_customers_file"] = "missing-customers.csv"
        self.spec_path.write_text(yaml.safe_dump(spec), encoding="utf-8")
        code, _, err = self.run_qa()
        self.assertEqual(code, 2)
        self.assertIn("existing_customers_file", err)
        self.assertFalse((self.dir / "leads.rejected.csv").exists())


class FixRegressionTest(unittest.TestCase):
    """The three fixes made after the first real run on an archived client list (2026-09-23)."""

    def test_related_corporate_domains_ship_with_a_warning(self):
        rel = list_qa.related_org_domain
        self.assertTrue(rel("berkschc.org", "berkschc.net"))                  # same name, other ending
        self.assertTrue(rel("optioncare.com", "optioncarehealth.com"))        # one name contains the other
        self.assertTrue(rel("coxhealth.com", "coxhealthathome.com"))
        self.assertTrue(rel("acme.co.uk", "acme.com"))
        self.assertFalse(rel("gohealthuc.com", "ghuctest.com"))               # a different name stays a review
        self.assertFalse(rel("beta.com", "acme.com"))
        self.assertFalse(rel("abc.com", "abcdef.com"))                        # too short to trust containment

    def test_banned_source_terms_are_specific(self):
        hits = lambda v: any(t in v for t in list_qa.BANNED_SOURCE_TERMS)   # noqa: E731
        self.assertTrue(hits("serp_site:linkedin_ai_pick"))
        self.assertTrue(hits("serp_api_people"))            # "serp" also catches any SERP API vendor name
        self.assertTrue(hits("company_index_mode"))
        self.assertFalse(hits("google_maps"))
        self.assertFalse(hits("pattern_verified"))

    def test_score_tier_mismatch_is_scoring_leakage(self):
        header = list(HEADER)
        good = lead("Ann", "Lee", "a.com", lead_score="9.2")
        bad_tier = lead("Bob", "Kay", "b.com", lead_score="9.2", priority_tier="P3")
        out_of_range = lead("Cy", "Moe", "c.com", lead_score="1.0", priority_tier="P5")
        self.assertEqual(list_qa.systemic_blocks(header, [good]), [])
        blocks = list_qa.systemic_blocks(header, [good, bad_tier, out_of_range])
        leak = [b for b in blocks if b["check"] == "scoring_leakage"]
        self.assertEqual(len(leak), 1)
        self.assertEqual({r["first_name"] for r in leak[0]["rows"]}, {"Bob", "Cy"})


class OneEmployerManyDomainsTest(ListQATestBase):
    """Ported 2026-09-28: one real employer behind several company domains slips past the per-company cap."""

    def test_one_employer_behind_two_company_domains_is_a_warning_not_a_removal(self):
        rows = [lead("Alice", "Abbott", "co01.com"),
                lead("Hana", "Host", "hilton.com", "exact"),
                lead("Hugo", "Host", "hilton.com", "strong"),
                # a sibling brand domain whose buyer mails from the parent's domain: related, so it ships
                lead("Holly", "Host", "hiltongrandvacations.com", "exact", email="holly@hilton.com"),
                # personal mailboxes are never grouped, even across companies
                lead("Gina", "Gmail", "co02.com", email="gina@gmail.com"),
                lead("Gabe", "Gmail", "co03.com", email="gabe@gmail.com"),
                lead("Gwen", "Gmail", "co04.com", email="gwen@gmail.com")]
        spec = target_spec()
        spec["buyers"]["personal_email_policy"] = "allow"
        self.spec_path.write_text(yaml.safe_dump(spec, sort_keys=False), encoding="utf-8")
        write_csv(self.dir / "leads.verified.csv", HEADER, rows)
        code, out, err = self.run_qa()
        self.assertEqual(code, 0, err)
        ready = self.by_email("leads.verified.csv")
        for email in ("hana@hilton.com", "hugo@hilton.com", "holly@hilton.com"):
            self.assertIn(email, ready)      # a warning never removes a row
        self.assertEqual(json.loads(out)["warning_anomalies"], 1)
        report = (self.dir / "list-qa-report.md").read_text(encoding="utf-8")
        section = report[report.index("## Anomalies"):report.index("## What we built")]
        self.assertIn("**WARNING: One real employer behind several company domains", section)
        self.assertIn("1 employer, 3 campaign-ready contacts", section)
        self.assertIn("@hilton.com: 3 contacts across 2 company domains", section)
        self.assertNotIn("@gmail.com", section)
        self.assertNotIn("—", report)
        self.assertNotIn("–", report)

    def test_the_flag_needs_two_company_domains_and_more_than_the_cap_or_two_offers(self):
        def row(email, dom, offer=""):
            return {"email_domain": email, "company_domain_norm": dom, "offer": offer}
        flag = list_qa.one_employer_many_domains
        self.assertEqual([], flag([row("a.com", "a.com")] * 5, 2))                       # one company domain
        self.assertEqual([], flag([row("a.com", "a.com"), row("a.com", "b.com")], 2))    # at the cap, one offer
        hit = flag([row("a.com", "a.com"), row("a.com", "b.com"), row("a.com", "b.com")], 2)
        self.assertEqual([("a.com", 3, 2, 0)], [(d, len(rs), c, o) for d, rs, c, o in hit])
        two_offers = flag([row("a.com", "a.com", "o1"), row("a.com", "b.com", "o2")], 2)
        self.assertEqual(["a.com"], [d for d, *_ in two_offers])
        self.assertEqual([], flag([row("a.com", "a.com"), row("a.com", "b.com"), row("a.com", "c.com")], None))
        self.assertEqual([], flag([row("gmail.com", "a.com"), row("gmail.com", "b.com"), row("gmail.com", "c.com")], 2))


class PortedPolicyTest(ListQATestBase):
    """Policies pinned when this script was ported into this workspace (2026-09-24)."""

    def test_blank_title_is_parked_for_review_not_rejected(self):
        blank = lead("Brian", "Barnes", "co02.com")
        blank["job_title"] = ""
        write_csv(self.dir / "leads.verified.csv", HEADER, [lead("Alice", "Abbott", "co01.com"), blank])
        code, out, err = self.run_qa()
        self.assertEqual(code, 0, err)       # a blank title is not scoring leakage and does not block
        self.assertNotIn('"blocked": true', out)
        review = self.by_email("leads.review.csv")
        self.assertIn("brian@co02.com", review)
        self.assertEqual(review["brian@co02.com"]["review_reason"], "qa_title_missing")
        self.assertEqual(review["brian@co02.com"]["title_status"], "missing")
        self.assertNotIn("brian@co02.com", self.by_email("leads.rejected.csv"))
        self.assertEqual(list(self.by_email("leads.verified.csv")), ["alice@co01.com"])

    def write_suppression(self, rows):
        path = self.profile / "suppression-client.csv"
        write_csv(path, ["email", "company_domain", "linkedin_url", "company_name", "reason", "source_campaign",
                         "date_added"], rows)
        return path

    def test_company_level_row_blocks_the_domain_and_a_person_row_keeps_colleagues(self):
        path = self.write_suppression([
            {"company_domain": "co01.com", "reason": "client_blocklist", "date_added": "2026-09-24"},
            {"email": "dana@dense.com", "company_domain": "dense.com", "reason": "unsubscribe",
             "date_added": "2026-09-24"},
        ])
        code, _, err = self.run_qa("--suppression", str(path), suppression=False)
        self.assertEqual(code, 0, err)
        rejected = self.by_email("leads.rejected.csv")
        self.assertIn("suppressed:client_blocklist", rejected["alice@co01.com"]["qa_reasons"])
        self.assertIn("suppressed:unsubscribe", rejected["dana@dense.com"]["qa_reasons"])
        ready = self.by_email("leads.verified.csv")
        self.assertIn("evan@dense.com", ready)    # a person-level row never suppresses colleagues
        self.assertIn("fay@dense.com", ready)     # and with Dana out, Fay fits the 2-per-company cap

    def test_domain_suppression_matches_lead_score(self):
        path = self.write_suppression([
            {"company_domain": "co01.com", "reason": "client_blocklist"},
            {"company_domain": "hostile.com", "company_name": "Hostile Corp", "reason": "negative_hostile"},
            {"email": "pat@hostile2.com", "company_domain": "hostile2.com", "reason": "negative_hostile"},
            {"email": "sam@co26.com", "company_domain": "co26.com", "reason": "unsubscribe"},
            {"linkedin_url": "https://www.linkedin.com/in/lee-one/", "company_domain": "co29.com",
             "reason": "negative_notfit"},
        ])
        lead_score_path = Path(__file__).resolve().parents[1] / "lead_score.py"
        spec = importlib.util.spec_from_file_location("lead_score_for_list_qa_test", lead_score_path)
        lead_score = importlib.util.module_from_spec(spec)
        assert spec.loader is not None
        spec.loader.exec_module(lead_score)
        scored = lead_score.load_suppression(path)
        qa = list_qa.load_suppression(path, False)
        expected = {"co01.com", "hostile.com", "hostile2.com"}   # person rows at co26 and co29 stay person-level
        self.assertEqual(scored["hostile_domain"] | scored["company_domain"], expected)
        self.assertEqual(set(qa.domain.exact), expected)


class SampleTest(ListQATestBase):
    def ready_tiers(self):
        return {r["title_role_tier"] for r in read_csv(self.dir / "leads.verified.csv")}

    def test_sample_covers_every_tier_and_adds_rejected_controls(self):
        code, _, err = self.run_qa()
        self.assertEqual(code, 0, err)
        sample = read_csv(self.dir / "qa-sample.csv")
        ready = [r for r in sample if r["sample_kind"] == "ready"]
        controls = [r for r in sample if r["sample_kind"] == "rejected_control"]
        self.assertEqual(len(ready), 21)  # fewer ready rows than the default 25: all of them
        self.assertTrue(1 <= len(controls) <= 5)
        self.assertTrue(all(r["qa_reasons"] for r in controls))
        self.assertEqual(self.ready_tiers(), {r["title_role_tier"] for r in ready})
        for col in list_qa.SAMPLE_COLUMNS:
            self.assertIn(col, sample[0])
        self.assertTrue(all(r["correct_company"] == "" for r in sample))

    def test_small_sample_still_covers_every_stratum_value(self):
        code, _, err = self.run_qa("--sample-size", "5")
        self.assertEqual(code, 0, err)
        ready = [r for r in read_csv(self.dir / "qa-sample.csv") if r["sample_kind"] == "ready"]
        self.assertLess(len(ready), 21)
        self.assertEqual(self.ready_tiers(), {r["title_role_tier"] for r in ready})
        self.assertIn("classifier=ai", ";".join(r["strata"] for r in ready))
        self.assertIn("wave_slot=promoted_fallback", ";".join(r["strata"] for r in ready))
        self.assertEqual({"aiark", "prospeo"}, {r["email_source"] for r in ready})

    def fill(self, rows, no_rows=()):
        for r in rows:
            answer = "yes" if r["sample_kind"] == "ready" else "no"
            r.update(correct_company=answer, correct_title=answer, current_employee=answer)
        for r, col in no_rows:
            r[col] = "no"
        path = self.dir.parent / "reviewed.csv"
        write_csv(path, list(rows[0].keys()), rows)
        return path

    def test_score_sample_pass(self):
        code, _, err = self.run_qa()
        self.assertEqual(code, 0, err)
        path = self.fill(read_csv(self.dir / "qa-sample.csv"))
        code, _, err = self.score(path)
        self.assertEqual(code, 0, err)
        report = (self.dir / "list-qa-report.md").read_text(encoding="utf-8")
        self.assertIn("**Result: PASS**", report)
        self.assertIn("21/21 correct company", report)
        self.assertIn("21/21 current employee", report)
        self.assertIn("**Verdict: READY WITH WARNINGS.**", report)
        self.assertEqual(report.count("## Manual stratified QA"), 1)
        self.assertNotIn("\u2014", report)

    def test_score_sample_fails_on_three_no_answers_sharing_one_email_source(self):
        code, _, err = self.run_qa()
        self.assertEqual(code, 0, err)
        rows = read_csv(self.dir / "qa-sample.csv")
        prospeo = [r for r in rows if r["sample_kind"] == "ready" and r["email_source"] == "prospeo"][:3]
        self.assertEqual(len(prospeo), 3)
        path = self.fill(rows, zip(prospeo, ["correct_company", "correct_title", "current_employee"]))
        code, out, err = self.score(path)
        self.assertEqual(code, 4, err)
        self.assertIn("email_source=prospeo", out)
        report = (self.dir / "list-qa-report.md").read_text(encoding="utf-8")
        self.assertIn("**Result: FAIL**", report)
        self.assertIn("20/21 correct company", report)   # the rates alone would pass
        self.assertIn("`email_source=prospeo`: 3 rows", report)
        self.assertIn("**Verdict: NOT READY.**", report)


if __name__ == "__main__":
    unittest.main()
