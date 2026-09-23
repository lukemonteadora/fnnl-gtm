import contextlib
import copy
import csv
import importlib.util
import io
import socket
import tempfile
import time
import unittest
from pathlib import Path
from unittest import mock

import yaml


SCRIPT_PATH = Path(__file__).resolve().parents[1] / "lead_score.py"
SPEC = importlib.util.spec_from_file_location("lead_score", SCRIPT_PATH)
lead_score = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(lead_score)


COMPANY_HEADERS = [
    "company_domain",
    "industry",
    "description",
    "headcount_range",
    "country",
    "fit_status",
    "hard_no",
    "score_market_tier",
    "score_offer_tier",
    "score_size_tier",
    "score_geo_tier",
]

CONTACT_HEADERS = [
    "company_domain",
    "first_name",
    "last_name",
    "linkedin_url",
    "job_title",
    "timing_signal",
    "hard_no",
    "score_role_tier",
    "score_authority_tier",
    "score_timing_tier",
]


def rubric():
    return {
        "schema_version": 1,
        "score_version": "fixture-v1",
        "segments": [
            {
                "name": "default",
                "market_mappings": {"exact": [], "adjacent": [], "broad": [], "weak": [], "excluded": []},
                "offer_mappings": {"clear": [], "strong": [], "plausible": [], "none": []},
                "size_mappings": {"ideal": [], "adjacent": [], "serviceable": [], "fringe": []},
                "geography_mappings": {"core": [], "expansion": [], "unsupported": []},
                "persona_mappings": {"exact": [], "strong": [], "influencer": [], "adjacent": [], "weak": [], "unrelated": []},
                "authority_mappings": {"ideal": [], "decision_capable": [], "influencer": [], "none": []},
                "timing_signal_mappings": {"strong": [], "useful": [], "moderate": [], "weak": [], "none": []},
            }
        ],
        "components": copy.deepcopy(lead_score.CANONICAL_COMPONENTS),
        "tier_columns": copy.deepcopy(lead_score.DEFAULT_TIER_COLUMNS),
        "reason_columns": copy.deepcopy(lead_score.DEFAULT_REASON_COLUMNS),
        "evidence_columns": {
            "market": ["industry"],
            "offer": ["description"],
            "size": ["headcount_range"],
            "geo": ["country"],
            "role": ["job_title"],
            "authority": ["job_title"],
            "timing": ["timing_signal"],
        },
        "eligibility": {
            "explicit_exclusion_columns": [
                "hard_no",
                "wrong_entity",
                "compliance_block",
                "do_not_contact",
                "suppressed",
            ],
            "fit_status_bad_is_ineligible": True,
            "marketable_min_score": 2.0,
        },
        "confidence": {"high_min": 0.85, "medium_min": 0.65},
        "same_wave_contact_cap": 2,
    }


def company(domain, market="exact", offer="clear", size="ideal", geo="core", **extra):
    row = {
        "company_domain": domain,
        "industry": "example",
        "description": "example",
        "headcount_range": "100-500",
        "country": "US",
        "fit_status": "good",
        "hard_no": "",
        "score_market_tier": market,
        "score_offer_tier": offer,
        "score_size_tier": size,
        "score_geo_tier": geo,
    }
    row.update(extra)
    return row


def contact(
    domain,
    first="Alex",
    last="Buyer",
    role="exact",
    authority="ideal",
    timing="strong",
    **extra,
):
    slug = f"{first}-{last}".lower()
    row = {
        "company_domain": domain,
        "first_name": first,
        "last_name": last,
        "linkedin_url": f"https://linkedin.com/in/{slug}",
        "job_title": "VP Sales",
        "timing_signal": "new leader",
        "hard_no": "",
        "score_role_tier": role,
        "score_authority_tier": authority,
        "score_timing_tier": timing,
    }
    row.update(extra)
    return row


def write_csv(path, headers, rows):
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=headers, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def read_csv(path):
    with path.open("r", encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


class LeadScoringTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)

    def tearDown(self):
        self.temp.cleanup()

    def run_score(self, companies, contacts, rubric_data=None, suppression_rows=None, suffix=""):
        rubric_path = self.root / f"rubric{suffix}.yaml"
        companies_path = self.root / f"companies{suffix}.csv"
        contacts_path = self.root / f"contacts{suffix}.csv"
        company_output = self.root / f"tam.scored{suffix}.csv"
        contact_output = self.root / f"contacts.scored{suffix}.csv"
        report = self.root / f"report{suffix}.md"
        rubric_path.write_text(yaml.safe_dump(rubric_data or rubric(), sort_keys=False), encoding="utf-8")
        write_csv(companies_path, COMPANY_HEADERS, companies)
        write_csv(contacts_path, CONTACT_HEADERS, contacts)
        args = [
            "--rubric",
            str(rubric_path),
            "--companies",
            str(companies_path),
            "--contacts",
            str(contacts_path),
            "--company-output",
            str(company_output),
            "--contact-output",
            str(contact_output),
            "--report",
            str(report),
            "--scored-at",
            "2026-08-04T00:00:00+00:00",
        ]
        if suppression_rows is not None:
            suppression = self.root / f"suppression{suffix}.csv"
            write_csv(
                suppression,
                ["email", "linkedin_url", "company_domain", "reason"],
                suppression_rows,
            )
            args.extend(["--suppression", str(suppression)])
        stdout = io.StringIO()
        stderr = io.StringIO()
        with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
            status = lead_score.main(args)
        return status, stdout.getvalue(), stderr.getvalue(), company_output, contact_output, report

    def test_contract_totals_exactly_ten_points(self):
        total = sum(component["max_points"] for component in lead_score.CANONICAL_COMPONENTS.values())
        self.assertEqual(10.0, total)
        self.assertEqual(2.5, lead_score.CANONICAL_COMPONENTS["role"]["points"]["exact"])
        self.assertEqual(1.0, lead_score.CANONICAL_COMPONENTS["timing"]["points"]["strong"])

    def test_exact_and_adjacent_rows_survive_with_stable_tiers(self):
        status, _, error, _, output, _ = self.run_score(
            [
                company("perfect.example"),
                company("fringe.example", market="weak", offer="plausible", size="fringe", geo="unsupported", fit_status="maybe"),
            ],
            [
                contact("perfect.example"),
                contact("fringe.example", first="Fran", role="weak", authority="none", timing="none"),
            ],
        )
        self.assertEqual(0, status, error)
        rows = {row["company_domain"]: row for row in read_csv(output)}
        self.assertEqual("10.0", rows["perfect.example"]["lead_score"])
        self.assertEqual("P1", rows["perfect.example"]["priority_tier"])
        self.assertEqual("2.0", rows["fringe.example"]["lead_score"])
        self.assertEqual("P5", rows["fringe.example"]["priority_tier"])
        self.assertEqual("true", rows["fringe.example"]["send_eligible"])

    def test_irrelevant_company_and_unrelated_title_cannot_pass(self):
        status, _, error, _, output, _ = self.run_score(
            [company("wrong-company.example", fit_status="bad"), company("wrong-title.example")],
            [contact("wrong-company.example"), contact("wrong-title.example", role="unrelated")],
        )
        self.assertEqual(0, status, error)
        rows = {row["company_domain"]: row for row in read_csv(output)}
        self.assertEqual("false", rows["wrong-company.example"]["send_eligible"])
        self.assertIn("fit_status=bad", rows["wrong-company.example"]["exclusion_reason"])
        self.assertEqual("", rows["wrong-company.example"]["lead_score"])
        self.assertEqual("false", rows["wrong-title.example"]["send_eligible"])
        self.assertEqual("no_plausible_buying_relationship", rows["wrong-title.example"]["exclusion_reason"])

    def test_hard_no_and_suppression_are_exclusions_not_low_scores(self):
        blocked = contact("hard-no.example", hard_no="true")
        suppressed = contact("suppressed.example", first="Sam", last="Suppressed")
        status, _, error, _, output, _ = self.run_score(
            [company("hard-no.example"), company("suppressed.example")],
            [blocked, suppressed],
            suppression_rows=[
                {
                    "email": "",
                    "linkedin_url": suppressed["linkedin_url"],
                    "company_domain": "",
                    "reason": "client_suppression",
                }
            ],
        )
        self.assertEqual(0, status, error)
        rows = {row["company_domain"]: row for row in read_csv(output)}
        self.assertEqual("explicit:hard_no", rows["hard-no.example"]["exclusion_reason"])
        self.assertEqual("suppression:linkedin_url", rows["suppressed.example"]["exclusion_reason"])
        self.assertTrue(all(row["lead_score"] == "" for row in rows.values()))

    def test_missing_evidence_gets_zero_points_and_low_confidence(self):
        status, _, error, _, output, _ = self.run_score(
            [company("missing.example", offer="", size="", geo="")],
            [contact("missing.example", role="weak", authority="", timing="")],
        )
        self.assertEqual(0, status, error)
        row = read_csv(output)[0]
        self.assertEqual("0.0", row["company_offer_points"])
        self.assertEqual("0.0", row["timing_points"])
        self.assertEqual("2.5", row["lead_score"])
        self.assertEqual("low", row["score_confidence"])
        self.assertIn("offer=missing", row["score_reason"])

    def test_blank_relationship_tiers_are_unknown_not_exclusions(self):
        status, _, error, company_output, output, report = self.run_score(
            [
                company("blank-relationship.example", market="", offer=""),
                company("all-blank.example", market="", offer="", size="", geo=""),
                company("one-negative.example", market="none", offer=""),
                company("blank-role.example"),
            ],
            [
                contact("blank-relationship.example", role=""),
                contact("all-blank.example", role="", authority="", timing=""),
                contact("one-negative.example", timing=""),
                contact("blank-role.example", role=""),
            ],
        )
        self.assertEqual(0, status, error)
        self.assertTrue(all(row["company_send_eligible"] == "true" for row in read_csv(company_output)))
        rows = {row["company_domain"]: row for row in read_csv(output)}
        self.assertEqual(
            {
                "blank-relationship.example": ("true", "", "4.0", "P4", "low"),
                "all-blank.example": ("true", "", "2.0", "P5", "low"),
                "one-negative.example": ("true", "", "5.5", "P3", "medium"),
                "blank-role.example": ("true", "", "7.5", "P2", "medium"),
            },
            {
                domain: (
                    row["send_eligible"],
                    row["exclusion_reason"],
                    row["lead_score"],
                    row["priority_tier"],
                    row["score_confidence"],
                )
                for domain, row in rows.items()
            },
        )
        self.assertIn("role=missing", rows["blank-role.example"]["score_reason"])
        self.assertIn(
            "Eligible contacts on an unclassified relationship (blank market and offer, or blank role): 4.",
            report.read_text(encoding="utf-8"),
        )

    def test_classified_negatives_and_explicit_exclusions_still_exclude_blank_rows(self):
        status, _, error, _, output, _ = self.run_score(
            [
                company("classified-none.example", market="none", offer="none"),
                company("blank-bad-fit.example", market="", offer="", fit_status="bad"),
                company("blank-hard-no.example", market="", offer="", hard_no="true"),
                company("clean.example"),
            ],
            [
                contact("classified-none.example"),
                contact("blank-bad-fit.example", role=""),
                contact("blank-hard-no.example", role=""),
                contact("clean.example", first="Hana", role="", hard_no="true"),
                contact("clean.example", first="", last="", role="", linkedin_url=""),
            ],
        )
        self.assertEqual(0, status, error)
        rows = read_csv(output)
        self.assertEqual(
            [
                ("blank-bad-fit.example", "company:explicit:fit_status=bad"),
                ("blank-hard-no.example", "company:explicit:hard_no"),
                ("classified-none.example", "company:no_plausible_customer_relationship"),
                ("clean.example", "explicit:hard_no"),
                ("clean.example", "missing_contact_identity"),
            ],
            sorted((row["company_domain"], row["exclusion_reason"]) for row in rows),
        )
        self.assertTrue(all(row["send_eligible"] == "false" and row["lead_score"] == "" for row in rows))

    def test_arithmetic_uses_exact_component_points_before_final_rounding(self):
        status, _, error, _, output, _ = self.run_score(
            [company("rounding.example", offer="strong", size="adjacent", geo="core")],
            [
                contact(
                    "rounding.example",
                    role="influencer",
                    authority="influencer",
                    timing="moderate",
                )
            ],
        )
        self.assertEqual(0, status, error)
        row = read_csv(output)[0]
        self.assertEqual("4.3", row["company_score"])
        self.assertEqual("6.8", row["lead_score"])

    def test_contacts_are_ranked_and_only_two_are_same_wave_eligible(self):
        contacts = [
            contact("committee.example", first="Cory", role="influencer", authority="influencer", timing="none"),
            contact("committee.example", first="Alex", role="exact", authority="ideal", timing="strong"),
            contact("committee.example", first="Blair", role="strong", authority="decision_capable", timing="useful"),
        ]
        status, _, error, _, output, _ = self.run_score([company("committee.example")], contacts)
        self.assertEqual(0, status, error)
        rows = read_csv(output)
        self.assertEqual(["1", "2", "3"], [row["contact_rank_in_company"] for row in rows])
        self.assertEqual(["true", "true", "false"], [row["same_wave_eligible"] for row in rows])
        self.assertEqual(["Alex", "Blair", "Cory"], [row["first_name"] for row in rows])

    def test_invalid_rubric_and_unavailable_evidence_column_fail_loud(self):
        bad_points = rubric()
        bad_points["components"]["market"]["max_points"] = 2.1
        with self.assertRaises(lead_score.ScoreError):
            lead_score.validate_rubric(bad_points)

        bad_column = rubric()
        bad_column["evidence_columns"]["market"] = ["not_a_real_header"]
        status, _, error, _, _, _ = self.run_score(
            [company("bad-column.example")], [contact("bad-column.example")], bad_column
        )
        self.assertEqual(2, status)
        self.assertIn("unavailable company evidence columns", error)

    def test_identical_input_and_rubric_are_byte_deterministic(self):
        companies = [company("stable.example")]
        contacts = [contact("stable.example", first="Zoe"), contact("stable.example", first="Amy")]
        first = self.run_score(companies, contacts, suffix="-a")
        second = self.run_score(companies, contacts, suffix="-b")
        self.assertEqual(0, first[0], first[2])
        self.assertEqual(0, second[0], second[2])
        self.assertEqual(first[3].read_bytes(), second[3].read_bytes())
        self.assertEqual(first[4].read_bytes(), second[4].read_bytes())

    def test_common_client_schema_aliases_preserve_evidence(self):
        aliases = {
            "amigo": ("company_domain", "title", "title"),
            "creatim": ("company_domain", "title", "seniority"),
            "goodsign": ("company_domain", "job_title", "seniority_rank"),
            "ryshe": ("company_domain", "job_title", "member_management_level"),
        }
        for name, (domain_column, title_column, authority_column) in aliases.items():
            with self.subTest(name=name):
                company_headers = [
                    domain_column,
                    "industry",
                    "description",
                    "headcount_range",
                    "country",
                    "score_market_tier",
                    "score_offer_tier",
                    "score_size_tier",
                    "score_geo_tier",
                ]
                contact_headers = [
                    domain_column,
                    "first_name",
                    "last_name",
                    title_column,
                    authority_column,
                    "co_score",
                    "timing_signal",
                    "score_role_tier",
                    "score_authority_tier",
                    "score_timing_tier",
                ]
                contact_headers = list(dict.fromkeys(contact_headers))
                data = rubric()
                data["evidence_columns"]["role"] = [title_column]
                data["evidence_columns"]["authority"] = [authority_column]
                company_row = company(f"{name}.example")
                contact_row = contact(f"{name}.example")
                company_row[domain_column] = company_row.pop("company_domain")
                contact_row[domain_column] = contact_row.pop("company_domain")
                contact_row[title_column] = contact_row.pop("job_title")
                contact_row[authority_column] = "decision maker"
                contact_row["co_score"] = "999"
                company_path = self.root / f"{name}-companies.csv"
                contact_path = self.root / f"{name}-contacts.csv"
                write_csv(company_path, company_headers, [company_row])
                write_csv(contact_path, contact_headers, [contact_row])
                validated = lead_score.validate_rubric(data)
                lead_score.validate_input_contract(validated, company_headers, contact_headers)
                company_scored, by_domain = lead_score.score_companies(
                    [company_row], validated, "2026-08-04T00:00:00+00:00"
                )
                scored = lead_score.score_contacts(
                    [contact_row], by_domain, validated, lead_score.load_suppression(None), "2026-08-04T00:00:00+00:00"
                )
                self.assertEqual("10.0", scored[0]["lead_score"])
                self.assertNotEqual(scored[0]["co_score"], scored[0]["lead_score"])
                self.assertEqual("true", scored[0]["send_eligible"])
                self.assertEqual(1, len(company_scored))

    def test_thirty_thousand_contacts_without_network_or_email_provider(self):
        rows = [
            contact(
                "scale.example",
                first=f"Person{i:05d}",
                last="Scale",
                role="weak" if i % 5 == 0 else "exact",
                timing="none" if i % 3 == 0 else "strong",
            )
            for i in range(30000)
        ]
        started = time.monotonic()
        with mock.patch.object(socket, "create_connection", side_effect=AssertionError("network call")):
            status, _, error, _, output, report = self.run_score([company("scale.example")], rows)
        elapsed = time.monotonic() - started
        self.assertEqual(0, status, error)
        self.assertEqual(30000, len(read_csv(output)))
        self.assertIn("Paid email calls made by this scorer: 0", report.read_text(encoding="utf-8"))
        self.assertLess(elapsed, 30.0)


if __name__ == "__main__":
    unittest.main()
