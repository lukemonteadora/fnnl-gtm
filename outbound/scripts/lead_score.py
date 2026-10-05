#!/usr/bin/env python3
"""Deterministic 10-point lead scoring for the governed cold-outbound flow.

AI or a human first maps messy row evidence into the controlled tier columns
defined by the client's lead-scoring rubric. This script owns only validation,
point arithmetic, exclusions, confidence, ranking, and report generation.
It performs no network calls and never reveals or verifies an email.

A blank tier is unknown evidence: it earns no points and lowers confidence, but
it never excludes a row. Only explicit exclusions, fit_status=bad, suppression,
a missing contact identity, and a classified zero relationship (market and offer
both `none`, or role `unrelated`) make a row ineligible.
"""

from __future__ import annotations

import argparse
import csv
import json
import math
import sys
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

try:
    import yaml
except ImportError as exc:  # pragma: no cover - environment error
    raise SystemExit("PyYAML is required: python -m pip install pyyaml") from exc


CANONICAL_COMPONENTS: dict[str, dict[str, Any]] = {
    "market": {
        "max_points": 2.0,
        "points": {"exact": 2.0, "adjacent": 1.5, "broad": 1.0, "weak": 0.5, "none": 0.0},
    },
    "offer": {
        "max_points": 1.5,
        "points": {"clear": 1.5, "strong": 1.0, "plausible": 0.5, "none": 0.0},
    },
    "size": {
        "max_points": 1.0,
        "points": {"ideal": 1.0, "adjacent": 0.75, "serviceable": 0.5, "fringe": 0.25, "none": 0.0},
    },
    "geo": {
        "max_points": 0.5,
        "points": {"core": 0.5, "expansion": 0.25, "unsupported": 0.0},
    },
    "role": {
        "max_points": 2.5,
        "points": {
            "exact": 2.5,
            "strong": 2.0,
            "influencer": 1.5,
            "adjacent": 1.0,
            "weak": 0.5,
            "unrelated": 0.0,
        },
    },
    "authority": {
        "max_points": 1.5,
        "points": {"ideal": 1.5, "decision_capable": 1.0, "influencer": 0.5, "none": 0.0},
    },
    "timing": {
        "max_points": 1.0,
        "points": {"strong": 1.0, "useful": 0.75, "moderate": 0.5, "weak": 0.25, "none": 0.0},
    },
}

DEFAULT_TIER_COLUMNS = {
    "market": "score_market_tier",
    "offer": "score_offer_tier",
    "size": "score_size_tier",
    "geo": "score_geo_tier",
    "role": "score_role_tier",
    "authority": "score_authority_tier",
    "timing": "score_timing_tier",
}

DEFAULT_REASON_COLUMNS = {
    component: DEFAULT_TIER_COLUMNS[component].replace("_tier", "_reason")
    for component in DEFAULT_TIER_COLUMNS
}

DEFAULT_EXCLUSION_COLUMNS = [
    "hard_no",
    "wrong_entity",
    "compliance_block",
    "do_not_contact",
    "suppressed",
]

REQUIRED_SEGMENT_MAPPINGS = {
    "market_mappings": {"exact", "adjacent", "broad", "weak", "excluded"},
    "offer_mappings": {"clear", "strong", "plausible", "none"},
    "size_mappings": {"ideal", "adjacent", "serviceable", "fringe"},
    "geography_mappings": {"core", "expansion", "unsupported"},
    "persona_mappings": {"exact", "strong", "influencer", "adjacent", "weak", "unrelated"},
    "authority_mappings": {"ideal", "decision_capable", "influencer", "none"},
    "timing_signal_mappings": {"strong", "useful", "moderate", "weak", "none"},
}

COMPANY_OUTPUT_COLUMNS = [
    "company_market_points",
    "company_offer_points",
    "company_size_points",
    "company_geo_points",
    "company_score",
    "company_score_confidence",
    "company_send_eligible",
    "company_exclusion_reason",
    "score_version",
    "scored_at",
]

CONTACT_OUTPUT_COLUMNS = [
    "company_market_points",
    "company_offer_points",
    "company_size_points",
    "company_geo_points",
    "company_score",
    "contact_role_points",
    "contact_authority_points",
    "contact_score",
    "timing_points",
    "lead_score",
    "priority_tier",
    "score_confidence",
    "score_reason",
    "send_eligible",
    "exclusion_reason",
    "contact_rank_in_company",
    "same_wave_eligible",
    "score_version",
    "scored_at",
]


class ScoreError(RuntimeError):
    """Raised when a rubric or scoring input violates the contract."""


def norm_text(value: Any) -> str:
    return str(value or "").strip()


def norm_tier(value: Any) -> str:
    return norm_text(value).lower().replace("-", "_").replace(" ", "_")


def norm_domain(value: Any) -> str:
    domain = norm_text(value).lower()
    for prefix in ("https://", "http://"):
        if domain.startswith(prefix):
            domain = domain[len(prefix) :]
    if domain.startswith("www."):
        domain = domain[4:]
    return domain.split("/", 1)[0].rstrip(".")


def norm_url(value: Any) -> str:
    return norm_text(value).lower().rstrip("/")


def is_explicit(value: Any) -> bool:
    text = norm_text(value).lower()
    if not text or text in {
        "0",
        "false",
        "no",
        "n",
        "none",
        "null",
        "unknown",
        "n/a",
        "na",
        "not_applicable",
        "allowed",
        "ok",
    }:
        return False
    return True


def is_false(value: Any) -> bool:
    return norm_text(value).lower() in {"0", "false", "no", "n"}


def point_text(value: float) -> str:
    if math.isclose(value, round(value)):
        return f"{value:.1f}"
    return f"{value:.2f}".rstrip("0")


def read_csv(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    if not path.exists():
        raise ScoreError(f"missing CSV: {path}")
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        headers = list(reader.fieldnames or [])
        if not headers:
            raise ScoreError(f"CSV has no header: {path}")
        duplicates = [name for name, count in Counter(headers).items() if count > 1]
        if duplicates:
            raise ScoreError(f"CSV has duplicate headers {duplicates}: {path}")
        return headers, [dict(row) for row in reader]


def write_csv(path: Path, headers: list[str], rows: Iterable[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=headers, extrasaction="ignore", lineterminator="\n")
        writer.writeheader()
        for row in rows:
            writer.writerow({name: row.get(name, "") for name in headers})


def append_headers(headers: list[str], additions: Iterable[str]) -> list[str]:
    blocked = set(additions)
    return [name for name in headers if name not in blocked] + list(additions)


def load_rubric(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise ScoreError(f"missing rubric: {path}")
    with path.open("r", encoding="utf-8") as handle:
        rubric = yaml.safe_load(handle)
    if not isinstance(rubric, dict):
        raise ScoreError("rubric root must be a mapping")
    return validate_rubric(rubric)


def validate_rubric(rubric: dict[str, Any]) -> dict[str, Any]:
    if rubric.get("schema_version") != 1:
        raise ScoreError("rubric schema_version must equal 1")
    score_version = norm_text(rubric.get("score_version"))
    if not score_version:
        raise ScoreError("rubric score_version is required")

    segments = rubric.get("segments")
    if not isinstance(segments, list) or not segments:
        raise ScoreError("rubric segments must be a non-empty list")
    for index, segment in enumerate(segments, start=1):
        if not isinstance(segment, dict) or not norm_text(segment.get("name")):
            raise ScoreError(f"rubric segment {index} requires a name")
        for mapping_name, expected_keys in REQUIRED_SEGMENT_MAPPINGS.items():
            mapping = segment.get(mapping_name)
            if not isinstance(mapping, dict) or set(mapping) != expected_keys:
                raise ScoreError(
                    f"rubric segment {segment.get('name')} {mapping_name} must be exactly "
                    f"{sorted(expected_keys)}"
                )
            if not all(isinstance(values, list) for values in mapping.values()):
                raise ScoreError(
                    f"rubric segment {segment.get('name')} {mapping_name} values must be lists"
                )

    supplied = rubric.get("components")
    if not isinstance(supplied, dict):
        raise ScoreError("rubric components mapping is required")
    if set(supplied) != set(CANONICAL_COMPONENTS):
        raise ScoreError(f"rubric components must be exactly {sorted(CANONICAL_COMPONENTS)}")

    max_total = 0.0
    for name, expected in CANONICAL_COMPONENTS.items():
        actual = supplied.get(name) or {}
        try:
            actual_max = float(actual.get("max_points"))
        except (TypeError, ValueError) as exc:
            raise ScoreError(f"component {name} max_points must be numeric") from exc
        if not math.isclose(actual_max, expected["max_points"]):
            raise ScoreError(
                f"component {name} max_points must be {expected['max_points']}, got {actual_max}"
            )
        actual_points = actual.get("points")
        if not isinstance(actual_points, dict):
            raise ScoreError(f"component {name} points mapping is required")
        if set(actual_points) != set(expected["points"]):
            raise ScoreError(
                f"component {name} tiers must be exactly {sorted(expected['points'])}"
            )
        for tier, expected_points in expected["points"].items():
            try:
                actual_value = float(actual_points[tier])
            except (TypeError, ValueError) as exc:
                raise ScoreError(f"component {name}.{tier} must be numeric") from exc
            if not math.isclose(actual_value, expected_points):
                raise ScoreError(
                    f"component {name}.{tier} must be {expected_points}, got {actual_value}"
                )
        max_total += actual_max
    if not math.isclose(max_total, 10.0):
        raise ScoreError(f"component maxima must total 10.0, got {max_total}")

    tier_columns = rubric.get("tier_columns") or {}
    reason_columns = rubric.get("reason_columns") or {}
    rubric["tier_columns"] = {**DEFAULT_TIER_COLUMNS, **tier_columns}
    rubric["reason_columns"] = {**DEFAULT_REASON_COLUMNS, **reason_columns}

    confidence = rubric.get("confidence") or {}
    high_min = float(confidence.get("high_min", 0.85))
    medium_min = float(confidence.get("medium_min", 0.65))
    if not (0 <= medium_min < high_min <= 1):
        raise ScoreError("confidence thresholds must satisfy 0 <= medium_min < high_min <= 1")
    rubric["confidence"] = {"high_min": high_min, "medium_min": medium_min}

    eligibility = rubric.get("eligibility") or {}
    exclusions = eligibility.get("explicit_exclusion_columns", DEFAULT_EXCLUSION_COLUMNS)
    if not isinstance(exclusions, list) or not all(norm_text(item) for item in exclusions):
        raise ScoreError("eligibility.explicit_exclusion_columns must be a non-empty string list")
    rubric["eligibility"] = {
        "explicit_exclusion_columns": exclusions,
        "fit_status_bad_is_ineligible": eligibility.get("fit_status_bad_is_ineligible", True),
        "marketable_min_score": float(eligibility.get("marketable_min_score", 2.0)),
    }
    if not math.isclose(rubric["eligibility"]["marketable_min_score"], 2.0):
        raise ScoreError("eligibility.marketable_min_score must equal 2.0")

    # No contacts cap (ruling no-contacts-cap, aaron-flow.md section 12/13): the score only orders the
    # send, so it auto-locks on this script's own checks with no review rounds. Every eligible contact is
    # same-wave eligible; list_qa.py's split spreads a company's contacts round-robin across the campaign
    # file instead. A rubric that still sets same_wave_contact_cap is accepted and ignored.
    rubric["same_wave_contact_cap"] = None
    rubric["score_version"] = score_version
    return rubric


def validate_input_contract(
    rubric: dict[str, Any], company_headers: list[str], contact_headers: list[str]
) -> None:
    """Prove every scoring tier and declared evidence column exists in its input."""
    company_components = {"market", "offer", "size", "geo"}
    contact_components = {"role", "authority", "timing"}
    company_set = set(company_headers)
    contact_set = set(contact_headers)

    missing_tiers = []
    for component in sorted(company_components):
        column = rubric["tier_columns"][component]
        if column not in company_set:
            missing_tiers.append(f"company:{component}={column}")
    for component in sorted(contact_components):
        column = rubric["tier_columns"][component]
        if column not in contact_set:
            missing_tiers.append(f"contact:{component}={column}")
    if missing_tiers:
        raise ScoreError(
            "normalized tier columns are missing from the scoring inputs: "
            + ", ".join(missing_tiers)
        )

    evidence = rubric.get("evidence_columns")
    if not isinstance(evidence, dict) or set(evidence) != set(CANONICAL_COMPONENTS):
        raise ScoreError(
            f"rubric evidence_columns must be exactly {sorted(CANONICAL_COMPONENTS)}"
        )
    for component in sorted(CANONICAL_COMPONENTS):
        columns = evidence.get(component)
        if not isinstance(columns, list) or not columns or not all(norm_text(item) for item in columns):
            raise ScoreError(f"evidence_columns.{component} must be a non-empty string list")
        available = company_set if component in company_components else contact_set
        missing = [column for column in columns if column not in available]
        if missing:
            scope = "company" if component in company_components else "contact"
            raise ScoreError(
                f"rubric declares unavailable {scope} evidence columns for {component}: {missing}"
            )


def component_value(
    row: dict[str, Any], component: str, rubric: dict[str, Any], row_label: str
) -> tuple[str, float, bool]:
    column = rubric["tier_columns"][component]
    raw = row.get(column, "")
    tier = norm_tier(raw)
    if not tier:
        return "", 0.0, False
    allowed = CANONICAL_COMPONENTS[component]["points"]
    if tier not in allowed:
        raise ScoreError(
            f"unsupported {component} tier {raw!r} in {row_label}; allowed={sorted(allowed)}"
        )
    return tier, float(allowed[tier]), True


def confidence_label(available_weight: float, maximum: float, rubric: dict[str, Any]) -> str:
    coverage = available_weight / maximum if maximum else 0.0
    if coverage >= rubric["confidence"]["high_min"]:
        return "high"
    if coverage >= rubric["confidence"]["medium_min"]:
        return "medium"
    return "low"


def explicit_exclusion(row: dict[str, Any], rubric: dict[str, Any]) -> str:
    for column in rubric["eligibility"]["explicit_exclusion_columns"]:
        for candidate in (column, f"co_{column}"):
            if candidate in row and is_explicit(row.get(candidate)):
                return f"explicit:{candidate}"
    if rubric["eligibility"]["fit_status_bad_is_ineligible"]:
        for column in ("fit_status", "co_fit_status"):
            if norm_text(row.get(column)).lower() == "bad":
                return f"explicit:{column}=bad"
    return ""


def load_suppression(path: Path | None) -> dict[str, set[str]]:
    result = {"email": set(), "linkedin_url": set(), "hostile_domain": set(), "company_domain": set()}
    if path is None or not path.exists():
        return result
    _, rows = read_csv(path)
    for row in rows:
        email = norm_text(row.get("email")).lower()
        linkedin = norm_url(row.get("linkedin_url"))
        domain = norm_domain(row.get("company_domain"))
        reason = norm_text(row.get("reason")).lower()
        if email:
            result["email"].add(email)
        if linkedin:
            result["linkedin_url"].add(linkedin)
        # A person-level entry never suppresses colleagues. negative_hostile blocks
        # the whole domain, and so does a company-level entry (no email, no
        # LinkedIn), such as a client blocklist row. Matches list_qa.py.
        if domain and reason == "negative_hostile":
            result["hostile_domain"].add(domain)
        elif domain and not (email or linkedin):
            result["company_domain"].add(domain)
    return result


def suppression_reason(row: dict[str, Any], suppression: dict[str, set[str]]) -> str:
    email = norm_text(row.get("email")).lower()
    linkedin = norm_url(row.get("linkedin_url") or row.get("url"))
    domain = norm_domain(row.get("company_domain") or row.get("domain"))
    if email and email in suppression["email"]:
        return "suppression:email"
    if linkedin and linkedin in suppression["linkedin_url"]:
        return "suppression:linkedin_url"
    if domain and domain in suppression["hostile_domain"]:
        return "suppression:negative_hostile_domain"
    if domain and domain in suppression.get("company_domain", ()):
        return "suppression:company_domain"
    return ""


def person_identity(row: dict[str, Any]) -> str:
    linkedin = norm_url(row.get("linkedin_url") or row.get("url"))
    if linkedin:
        return linkedin
    first = norm_text(row.get("first_name"))
    last = norm_text(row.get("last_name"))
    if first and last:
        return f"{first.lower()}|{last.lower()}"
    full = norm_text(row.get("full_name") or row.get("name"))
    return full.lower()


def priority_tier(score: float) -> str:
    if score >= 9.0:
        return "P1"
    if score >= 7.0:
        return "P2"
    if score >= 5.0:
        return "P3"
    if score >= 3.0:
        return "P4"
    return "P5"


def score_companies(
    rows: list[dict[str, str]], rubric: dict[str, Any], scored_at: str
) -> tuple[list[dict[str, Any]], dict[str, dict[str, Any]]]:
    scored: list[dict[str, Any]] = []
    by_domain: dict[str, dict[str, Any]] = {}
    for index, source in enumerate(rows, start=2):
        row = dict(source)
        domain = norm_domain(row.get("company_domain") or row.get("domain"))
        if not domain:
            raise ScoreError(f"company row {index} has no company_domain/domain")
        if domain in by_domain:
            raise ScoreError(f"duplicate company_domain after normalization: {domain}")

        tiers: dict[str, str] = {}
        points: dict[str, float] = {}
        present: dict[str, bool] = {}
        for component in ("market", "offer", "size", "geo"):
            tier, value, is_present = component_value(row, component, rubric, f"company {domain}")
            tiers[component], points[component], present[component] = tier, value, is_present

        # A blank tier is missing evidence, not a negative verdict. Only a market and
        # offer that were both classified and both score zero rule out a customer.
        zero_relationship = points["market"] + points["offer"] <= 0
        relationship_classified = present["market"] and present["offer"]
        exclusion = explicit_exclusion(row, rubric)
        if not exclusion and zero_relationship and relationship_classified:
            exclusion = "no_plausible_customer_relationship"
        eligible = not exclusion
        company_score = sum(points.values())
        available_weight = sum(
            CANONICAL_COMPONENTS[name]["max_points"] for name, exists in present.items() if exists
        )
        company_confidence = confidence_label(available_weight, 5.0, rubric)

        row.update(
            {
                "company_market_points": point_text(points["market"]),
                "company_offer_points": point_text(points["offer"]),
                "company_size_points": point_text(points["size"]),
                "company_geo_points": point_text(points["geo"]),
                "company_score": f"{round(company_score + 1e-9, 1):.1f}",
                "company_score_confidence": company_confidence,
                "company_send_eligible": "true" if eligible else "false",
                "company_exclusion_reason": exclusion,
                "score_version": rubric["score_version"],
                "scored_at": scored_at,
            }
        )
        row["_score_meta"] = {
            "tiers": tiers,
            "points": points,
            "present": present,
            "relationship_unknown": zero_relationship and not relationship_classified,
        }
        scored.append(row)
        by_domain[domain] = row
    return scored, by_domain


def score_reason(
    row: dict[str, Any], company: dict[str, Any], tiers: dict[str, str], rubric: dict[str, Any]
) -> str:
    parts = []
    for component in ("market", "offer", "size", "geo"):
        tier = company["_score_meta"]["tiers"].get(component) or "missing"
        parts.append(f"{component}={tier}")
    for component in ("role", "authority", "timing"):
        parts.append(f"{component}={tiers.get(component) or 'missing'}")

    evidence = []
    for component in ("market", "offer", "size", "geo"):
        reason_column = rubric["reason_columns"][component]
        reason = norm_text(company.get(reason_column))
        if reason:
            evidence.append(f"{component}: {reason}")
    for component in ("role", "authority", "timing"):
        reason_column = rubric["reason_columns"][component]
        reason = norm_text(row.get(reason_column))
        if reason:
            evidence.append(f"{component}: {reason}")
    base = "; ".join(parts)
    if evidence:
        base += "; " + " | ".join(evidence)
    return base[:800]


def score_contacts(
    rows: list[dict[str, str]],
    companies: dict[str, dict[str, Any]],
    rubric: dict[str, Any],
    suppression: dict[str, set[str]],
    scored_at: str,
) -> list[dict[str, Any]]:
    scored: list[dict[str, Any]] = []
    for index, source in enumerate(rows, start=2):
        row = dict(source)
        domain = norm_domain(row.get("company_domain") or row.get("domain"))
        if not domain:
            raise ScoreError(f"contact row {index} has no company_domain/domain")
        company = companies.get(domain)
        if company is None:
            raise ScoreError(f"contact row {index} cannot join company_domain={domain}")

        tiers: dict[str, str] = {}
        points: dict[str, float] = {}
        present: dict[str, bool] = {}
        for component in ("role", "authority", "timing"):
            tier, value, is_present = component_value(row, component, rubric, f"contact row {index}")
            tiers[component], points[component], present[component] = tier, value, is_present

        exclusion = ""
        if is_false(company.get("company_send_eligible")):
            exclusion = f"company:{company.get('company_exclusion_reason') or 'ineligible'}"
        if not exclusion:
            exclusion = explicit_exclusion(row, rubric)
        if not exclusion:
            exclusion = suppression_reason(row, suppression)
        if not exclusion and not person_identity(row):
            exclusion = "missing_contact_identity"
        # A blank role is unknown and stays eligible; only a classified `unrelated` excludes.
        if not exclusion and present["role"] and points["role"] <= 0:
            exclusion = "no_plausible_buying_relationship"

        company_points = company["_score_meta"]["points"]
        company_score = sum(company_points.values())
        contact_score = points["role"] + points["authority"]
        raw_score = company_score + contact_score + points["timing"]
        eligible = not exclusion
        lead_score = (
            round(
                max(rubric["eligibility"]["marketable_min_score"], min(10.0, raw_score))
                + 1e-9,
                1,
            )
            if eligible
            else None
        )

        available_weight = sum(
            CANONICAL_COMPONENTS[name]["max_points"]
            for name, exists in company["_score_meta"]["present"].items()
            if exists
        ) + sum(
            CANONICAL_COMPONENTS[name]["max_points"] for name, exists in present.items() if exists
        )
        score_confidence = confidence_label(available_weight, 10.0, rubric)

        row.update(
            {
                "company_market_points": point_text(company_points["market"]),
                "company_offer_points": point_text(company_points["offer"]),
                "company_size_points": point_text(company_points["size"]),
                "company_geo_points": point_text(company_points["geo"]),
                "company_score": company["company_score"],
                "contact_role_points": point_text(points["role"]),
                "contact_authority_points": point_text(points["authority"]),
                "contact_score": f"{contact_score:.1f}",
                "timing_points": point_text(points["timing"]),
                "lead_score": f"{lead_score:.1f}" if lead_score is not None else "",
                "priority_tier": priority_tier(lead_score) if lead_score is not None else "",
                "score_confidence": score_confidence,
                "score_reason": score_reason(row, company, tiers, rubric),
                "send_eligible": "true" if eligible else "false",
                "exclusion_reason": exclusion,
                "contact_rank_in_company": "",
                "same_wave_eligible": "false",
                "score_version": rubric["score_version"],
                "scored_at": scored_at,
            }
        )
        row["_score_meta"] = {
            "tiers": tiers,
            "points": points,
            "identity": person_identity(row),
            "relationship_unknown": company["_score_meta"]["relationship_unknown"] or not present["role"],
        }
        scored.append(row)

    confidence_rank = {"high": 3, "medium": 2, "low": 1}
    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in scored:
        if row["send_eligible"] == "true":
            domain = norm_domain(row.get("company_domain") or row.get("domain"))
            grouped[domain].append(row)
    for contacts in grouped.values():
        contacts.sort(
            key=lambda row: (
                -float(row["lead_score"]),
                -confidence_rank[row["score_confidence"]],
                -float(row["contact_role_points"]),
                -float(row["contact_authority_points"]),
                row["_score_meta"]["identity"],
            )
        )
        for rank, row in enumerate(contacts, start=1):
            row["contact_rank_in_company"] = str(rank)
            row["same_wave_eligible"] = "true"

    scored.sort(
        key=lambda row: (
            0 if row["send_eligible"] == "true" else 1,
            -float(row["lead_score"] or -1),
            -confidence_rank[row["score_confidence"]],
            int(row["contact_rank_in_company"] or 999999),
            norm_domain(row.get("company_domain") or row.get("domain")),
            row["_score_meta"]["identity"],
        )
    )
    return scored


def build_report(
    rubric_path: Path,
    company_rows: list[dict[str, Any]],
    contact_rows: list[dict[str, Any]],
    rubric: dict[str, Any],
    scored_at: str,
) -> str:
    eligible = [row for row in contact_rows if row["send_eligible"] == "true"]
    ineligible = [row for row in contact_rows if row["send_eligible"] != "true"]
    priority = Counter(row["priority_tier"] for row in eligible)
    confidence = Counter(row["score_confidence"] for row in contact_rows)
    exclusions = Counter(row["exclusion_reason"] for row in ineligible)
    staggered = sum(row["same_wave_eligible"] == "false" for row in eligible)
    company_eligible = sum(row["company_send_eligible"] == "true" for row in company_rows)
    unknown_relationship = sum(row["_score_meta"]["relationship_unknown"] for row in eligible)

    lines = [
        "# Lead Scoring Report",
        "",
        f"**Score version:** `{rubric['score_version']}`",
        f"**Scored at:** `{scored_at}`",
        f"**Rubric:** `{rubric_path}`",
        "",
        "## Outcome",
        "",
        f"- Companies: {len(company_rows)} total, {company_eligible} eligible.",
        f"- Contacts: {len(contact_rows)} total, {len(eligible)} eligible, {len(ineligible)} excluded.",
        f"- Eligible contacts on an unclassified relationship (blank market and offer, or blank role): {unknown_relationship}. Missing evidence lowers confidence and never excludes.",
        f"- Same-wave cap: none (ruling no-contacts-cap); {staggered} eligible contacts held for a later company stagger.",
        "- Every eligible score from P1 through P5 remains in the outreach queue.",
        "",
        "## Priority distribution",
        "",
        "| Tier | Contacts |",
        "|---|---:|",
    ]
    for tier in ("P1", "P2", "P3", "P4", "P5"):
        lines.append(f"| {tier} | {priority[tier]} |")
    lines.extend(["", "## Score confidence", "", "| Confidence | Contacts |", "|---|---:|"])
    for label in ("high", "medium", "low"):
        lines.append(f"| {label} | {confidence[label]} |")
    lines.extend(["", "## Exclusions", "", "| Reason | Contacts |", "|---|---:|"])
    if exclusions:
        for reason, count in exclusions.most_common():
            lines.append(f"| `{reason}` | {count} |")
    else:
        lines.append("| none | 0 |")
    lines.extend(
        [
            "",
            "## QA checks",
            "",
            f"- Eligible contacts missing a score: {sum(not row['lead_score'] for row in eligible)}",
            f"- Eligible contacts missing a priority tier: {sum(not row['priority_tier'] for row in eligible)}",
            f"- Eligible contacts missing a reason: {sum(not row['score_reason'] for row in eligible)}",
            f"- Ineligible contacts missing an exclusion reason: {sum(not row['exclusion_reason'] for row in ineligible)}",
            "- Paid email calls made by this scorer: 0",
            "",
        ]
    )
    return "\n".join(lines)


def strip_meta(rows: Iterable[dict[str, Any]]) -> list[dict[str, Any]]:
    return [{key: value for key, value in row.items() if not key.startswith("_score_")} for row in rows]


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Apply the governed deterministic 10-point lead score")
    parser.add_argument("--rubric", required=True, type=Path)
    parser.add_argument("--companies", required=True, type=Path)
    parser.add_argument("--contacts", required=True, type=Path)
    parser.add_argument("--company-output", required=True, type=Path)
    parser.add_argument("--contact-output", required=True, type=Path)
    parser.add_argument("--report", required=True, type=Path)
    parser.add_argument("--suppression", type=Path)
    parser.add_argument(
        "--scored-at",
        help="ISO-8601 timestamp. Defaults to current UTC; pass a fixed value for reproducible fixtures.",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    scored_at = args.scored_at or datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    try:
        rubric = load_rubric(args.rubric)
        company_headers, company_input = read_csv(args.companies)
        contact_headers, contact_input = read_csv(args.contacts)
        validate_input_contract(rubric, company_headers, contact_headers)
        suppression = load_suppression(args.suppression)
        company_scored, company_by_domain = score_companies(company_input, rubric, scored_at)
        contact_scored = score_contacts(contact_input, company_by_domain, rubric, suppression, scored_at)

        company_clean = strip_meta(company_scored)
        contact_clean = strip_meta(contact_scored)
        write_csv(args.company_output, append_headers(company_headers, COMPANY_OUTPUT_COLUMNS), company_clean)
        write_csv(args.contact_output, append_headers(contact_headers, CONTACT_OUTPUT_COLUMNS), contact_clean)
        report = build_report(args.rubric, company_scored, contact_scored, rubric, scored_at)
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(report, encoding="utf-8")

        result = {
            "ok": True,
            "companies": len(company_clean),
            "contacts": len(contact_clean),
            "eligible_contacts": sum(row["send_eligible"] == "true" for row in contact_clean),
            "company_output": str(args.company_output),
            "contact_output": str(args.contact_output),
            "report": str(args.report),
            "score_version": rubric["score_version"],
        }
        print(json.dumps(result, ensure_ascii=False))
        return 0
    except ScoreError as exc:
        print(json.dumps({"ok": False, "error": str(exc)}, ensure_ascii=False), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
