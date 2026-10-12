#!/usr/bin/env python3
"""Email, phone and people waterfall PLANNER and LEDGER for list production.

The waterfall itself calls providers through MCP tools and HTTP, which a Python
script cannot do. So this script only plans and records. It never calls a
network API and never spends anything:

  plan      decide, per account and per person, what to try next, and write one
            queue file per provider that has work (plus queue-verify.csv for
            the email verifier on the email layer)
  record    append a provider's (or the email verifier's) results to the ledger
  status    print the current state summary
  finalize  write the send file, the catch-all holdback, the review file, the
            stagger file, the attempt history and the plain-English report

State is never stored mutably. Every command recomputes it from the contacts
CSV, the append-only ledger (<campaignDir>/_waterfall/ledger.jsonl), the
targeting spec and provider-routing.yaml. That is what gives same-person-first
enrichment, person fallback, the per-account stop, depth caps, verification
de-dupe, attempt history and provider benchmarking. "Latest" always means the
latest line in ledger order, never the timestamp.

Nothing about a vendor is hard-coded. provider-routing.yaml names every tool:
  - the finder order per layer (layers.<layer>.order) and each rung's inputs;
  - the email verifier (layers.verification.provider) and its display name
    (providers.<key>.name), which is what lands in verification_provider;
  - the verifier's raw statuses that count as transient
    (layers.verification.transient_raw_statuses);
  - what a catch_all verdict does (layers.email.on_catch_all: continue keeps
    walking the finders and holds the catch_all as the person's fallback;
    stop ends that person's waterfall and sends the address to the holdback);
  - which rung may only run after another has finished for the same row
    (layers.<layer>.requires_attempted, for example {prospeo: [aiark]}).
A rung switched off with --skip-provider counts as satisfied for
requires_attempted. Since 2026-09-28 (/tool-balance-guard) every
--skip-provider also needs --operator-approved-skip: a provider that is out of
balance, over its fair use, answering 402 or down is a STOP that waits for the
operator, never a skip that hands its rows to the next rung. The flag says the
operator has said in chat to go on without that provider, and the ledger's
skip line records it (detail.operator_approved).

Usage:
  list_waterfall.py plan --dir D --contacts C --spec S --routing R
        [--layer email|phone|people] [--companies T]
        [--skip-provider P --skip-reason TEXT] [--unskip-provider P] [--allow-draft]
        [--operator-approved-skip]   (required with every --skip-provider: the operator said in chat
                                      to go on without that provider; /tool-balance-guard)
        [--reservoir PATH] [--reservoir-max-age-days N]   (Aaron flow, aaron-flow.md section 7: rung 0
                                      of the email waterfall; optional, off by default)
  list_waterfall.py record --dir D --layer email|phone|people|verify [--provider P] --results F [--routing R]
        (the verify layer takes the verifier key from the routing file: --routing, or the
        file the last plan used, which plan writes to _waterfall/status.json)
  list_waterfall.py status --dir D --contacts C --spec S --routing R [--reservoir PATH]
  list_waterfall.py finalize --dir D --contacts C --spec S --routing R [--allow-pending]
        [--reservoir PATH] [--reservoir-max-age-days N]   (finalize also writes every aiark/prospeo
                                      candidate's verdict back to the reservoir when --reservoir is given)

Exit codes: 0 ok; 2 input or contract error (nothing recorded); 3 finalize
refused because waterfall work is still pending.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter, defaultdict
from datetime import date
from pathlib import Path
from typing import Any, Iterable

sys.path.insert(0, str(Path(__file__).resolve().parent))

from list_common import (  # noqa: E402
    CONSUMER_DOMAINS,
    append_jsonl,
    email_domain,
    load_yaml,
    merged_header,
    norm_domain,
    norm_email,
    now_iso,
    person_id,
    read_csv,
    read_jsonl,
    same_org_domain,
    truthy,
    write_csv,
)
# Aaron flow (see aaron-flow.md section 7). The lead reservoir is rung 0 of the email waterfall; reservoir.py
# is a sibling, standard-library-only module in this same scripts folder (no PyYAML dependency).
import reservoir  # noqa: E402


TIERS = ["exact", "strong", "influencer", "adjacent", "weak"]
TIER_RANK = {tier: index for index, tier in enumerate(TIERS)}
NON_BUYER_TIERS = {"unrelated", "excluded"}
GATES = {"valid", "catch_all", "invalid", "risky", "unknown"}
BAD_GATES = {"invalid", "risky", "unknown"}
# Raw verifier statuses treated as transient when the routing file does not set
# layers.verification.transient_raw_statuses. A transient result is retried
# retry_transient times, then counts as unknown. A gate of "transient" written
# by the verifier CLI is always transient, whatever the raw status says.
DEFAULT_TRANSIENT_RAW = frozenset({"timeout", "error", "submit_failed", "rate_limited", ""})
TRANSIENT_GATE = "transient"
NOT_VERIFIED_RAW = "not_verified"  # the verifier CLI stopped before this email was checked (for example, no credits)
VERIFY_RAW_COLUMN = "verifier_raw_status"
CATCH_ALL_POLICIES = {"continue", "stop"}
DEFAULT_CATCH_ALL_POLICY = "continue"
RESULT_STATUSES = {"found", "not_found", "error"}
CONTROL_RESULTS = {"skipped", "unskipped"}
FINDER_NAME_FIELDS = ["first_name", "last_name"]
ROW_EXISTING = "row_existing"
DEFAULT_RETRY = 1
UNRANKED = 10**9

PHONE_NOT_REQUIRED = "phone not required by the targeting spec; skipped"
# /tool-balance-guard (ported 2026-09-28). A skip reason that says the provider ran out of balance, credits or fair
# use, or that it is down. Both are a stop, never a skip, unless the operator approved going on without it. The two
# patterns only choose the wording of the refusal: every --skip-provider needs --operator-approved-skip.
BALANCE_REASON = re.compile(
    r"\b402\b|credit|balance|quota|top[- ]?up|insufficient|out of funds|spending limit|wallet|fair[- ]?use|"
    r"records remaining|payment required",
    re.IGNORECASE)
OUTAGE_REASON = re.compile(
    r"\b(401|403|5\d\d)\b|invalidated|outage|\bdown\b|unavailable|missing key|no key|key missing|auth|"
    r"health check|timed? ?out|timeout|network|connection|unreachable|not responding",
    re.IGNORECASE)
SERIAL_NOTE = "run this queue one call at a time, never in parallel"

FIELD_ALIASES = {
    "job_title": ["job_title", "title"],
    "company_domain": ["company_domain", "domain"],
    "company_linkedin": ["company_linkedin", "company_linkedin_url"],
    "linkedin_url": ["linkedin_url"],
    "phone": ["phone", "phone_number"],
}

EXHAUSTED_FINALS = {"EMAIL_CATCH_ALL", "EMAIL_INVALID", "EMAIL_MISSING", "EMAIL_DOMAIN_MISMATCH", "READY_REVIEW"}
REVIEW_REASON = {
    "EMAIL_INVALID": "invalid",
    "EMAIL_MISSING": "no_email",
    "EMAIL_DOMAIN_MISMATCH": "domain_mismatch",
    "READY_REVIEW": "personal_email",
}

EMAIL_QUEUE_COLUMNS = [
    "person_id", "first_name", "last_name", "company_domain", "company_name",
    "company_linkedin", "linkedin_url", "job_title", "title_role_tier",
]
VERIFY_QUEUE_COLUMNS = ["email", "person_ids", "source_providers"]
PHONE_QUEUE_COLUMNS = [
    "person_id", "first_name", "last_name", "company_domain", "company_name",
    "linkedin_url", "email", "job_title",
]
PEOPLE_QUEUE_COLUMNS = ["company_domain", "company_name", "company_linkedin", "target_count", "needed"]

VERIFIED_COLUMNS = [
    "email", "email_original", "email_status", "is_catch_all", "email_source", "email_verified_at",
    "verification_provider", "person_id", "wave_slot", "wave_slot_reason", "email_attempt_path",
    "email_candidates",
]
PHONE_OUTPUT_COLUMNS = ["phone", "phone_source", "phone_status"]
HOLDBACK_COLUMNS = [
    "email", "email_original", "email_status", "is_catch_all", "email_source", "email_verified_at",
    "verification_provider", "person_id", "holdback_reason", "wave_slot", "email_attempt_path",
    "email_candidates",
]
REVIEW_COLUMNS = [
    "person_id", "review_reason", "review_email", "review_email_status", "email_source", "final_state",
    "email_attempt_path", "email_candidates", "review_detail",
]
STAGGER_COLUMNS = ["person_id", "state", "stagger_reason", "ready_email"]
ATTEMPT_COLUMNS = [
    "company_domain", "person_id", "first_name", "last_name", "job_title", "tier", "priority_order",
    "state", "wave_slot", "rungs", "skipped_rungs", "candidates",
]
ACCOUNT_COLUMNS = ["company_domain", "required", "ready", "state", "persons_tried", "promotions"]

ACCOUNT_MEANING = {
    "ACCOUNT_SATISFIED": "has the full number of ready contacts; nobody else there is worked",
    "ACCOUNT_ALL_WORKED": "no contacts cap (ruling no-contacts-cap): every eligible person was worked, "
                          "and at least one is ready to send",
    "ACCOUNT_PARTIAL": "has some ready contacts but fewer than needed, and nobody eligible is left to try",
    "ACCOUNT_NO_READY_CONTACT": "every eligible person was tried and none ended with a sendable email",
    "ACCOUNT_IN_PROGRESS": "still has waterfall work pending",
    "ACCOUNT_NO_ELIGIBLE_PERSON": "no eligible person to work (all failed the send, title or tier checks)",
}


class WaterfallError(RuntimeError):
    """An input or contract violation. The CLI exits 2 and records nothing."""


# ---------------------------------------------------------------------------
# Small helpers
# ---------------------------------------------------------------------------
def as_bool(value: Any, default: bool) -> bool:
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    return truthy(value)


def norm_token(value: Any) -> str:
    return str(value or "").strip().lower().replace("-", "_").replace(" ", "_")


def field_value(row: dict[str, Any], name: str) -> str:
    for key in FIELD_ALIASES.get(name, [name]):
        value = row.get(key)
        if value is not None and str(value).strip():
            return str(value).strip()
    return ""


def missing_inputs(row: dict[str, Any], fields: Iterable[str]) -> list[str]:
    return [name for name in fields if not field_value(row, name)]


def account_alt_domains(p: dict[str, Any]) -> frozenset[str]:
    """Ruling every-email-verified (aaron-flow.md section 8): a brand domain the company's own record names.
    Reads an optional `company_alt_domains` column (comma- or pipe-separated domains). No current FNNL contacts
    file populates this column, so this degrades gracefully to an empty set until one does; it is a stated gap,
    not a guess at a format no tool emits."""
    raw = field_value(p["row"], "company_alt_domains")
    if not raw:
        return frozenset()
    parts = re.split(r"[|,]", raw)
    return frozenset(norm_domain(part) for part in parts if norm_domain(part))


def parse_number(value: Any, default: float) -> float:
    try:
        return float(str(value).strip())
    except (TypeError, ValueError):
        return default


def norm_phone(raw: Any) -> str:
    text = str(raw or "").strip()
    digits = re.sub(r"\D", "", text)
    if not digits:
        return ""
    return ("+" if text.startswith("+") else "") + digits


def plural(count: int, word: str) -> str:
    return f"{count} {word}" if count == 1 else f"{count} {word}s"


def pct(numerator: int, denominator: int) -> str:
    if not denominator:
        return "n/a"
    return f"{numerator * 100 / denominator:.0f}%"


def money(value: float) -> str:
    return f"${value:.2f}"


def first(items: Iterable[Any]) -> Any:
    for item in items:
        return item
    return None


def work_dir(campaign_dir: Path) -> Path:
    return Path(campaign_dir) / "_waterfall"


def ledger_path(campaign_dir: Path) -> Path:
    return work_dir(campaign_dir) / "ledger.jsonl"


# ---------------------------------------------------------------------------
# Config loading
# ---------------------------------------------------------------------------
def load_spec(path: Path, allow_draft: bool, enforce: bool) -> dict[str, Any]:
    if not Path(path).exists():
        raise WaterfallError(f"missing targeting spec: {path}")
    spec = load_yaml(path)
    if not isinstance(spec, dict):
        raise WaterfallError(f"targeting spec root must be a mapping: {path}")
    status = str(spec.get("status") or "").strip().lower()
    if status != "locked" and enforce and not allow_draft:
        raise WaterfallError(
            f"{path} is status={spec.get('status')!r}, not locked; lock it (or pass --allow-draft for a dry run)"
        )
    buyers = spec.get("buyers") or {}
    if not isinstance(buyers, dict):
        raise WaterfallError("targeting spec buyers must be a mapping")
    policy = str(buyers.get("personal_email_policy") or "fail").strip().lower()
    if policy not in {"fail", "review", "allow"}:
        raise WaterfallError(f"buyers.personal_email_policy must be fail, review or allow, got {policy!r}")
    return spec


def spec_buyers(spec: dict[str, Any]) -> dict[str, Any]:
    return spec.get("buyers") or {}


def load_routing(path: Path) -> dict[str, Any]:
    if not Path(path).exists():
        raise WaterfallError(f"missing provider routing: {path}")
    routing = load_yaml(path)
    if not isinstance(routing, dict) or not isinstance(routing.get("layers"), dict):
        raise WaterfallError(f"provider routing needs a layers mapping: {path}")
    return routing


def layer_cfg(routing: dict[str, Any], layer: str) -> dict[str, Any]:
    layers = routing.get("layers") or {}
    if layer == "people":
        cfg = layers.get("people_discovery") or layers.get("people")
        label = "people_discovery"
    else:
        cfg = layers.get(layer)
        label = layer
    if not isinstance(cfg, dict) or not isinstance(cfg.get("order"), list) or not cfg["order"]:
        if layer == "phone":
            raise WaterfallError(
                "the targeting spec needs phones but provider routing has no usable layers.phone.order "
                "(no phone source is set in the routing file); set buyers.phone_required to false, or add "
                "a phone layer once the stack contract records a phone source"
            )
        raise WaterfallError(f"provider routing has no usable layers.{label}.order")
    check_requires_attempted(cfg, label)
    return cfg


def layer_order(cfg: dict[str, Any]) -> list[str]:
    return [str(item) for item in cfg.get("order") or []]


def rung_requires(cfg: dict[str, Any], provider: str, extra: Iterable[str]) -> list[str]:
    base = list((cfg.get("requires") or {}).get(provider) or [])
    return list(dict.fromkeys([str(item) for item in base] + list(extra)))


def requires_attempted(cfg: dict[str, Any], provider: str) -> list[str]:
    """Rungs that must have finished for this row before `provider` may run on it."""
    return [str(item) for item in (cfg.get("requires_attempted") or {}).get(provider) or []]


def check_requires_attempted(cfg: dict[str, Any], label: str) -> None:
    rules = cfg.get("requires_attempted")
    if rules is None:
        return
    if not isinstance(rules, dict):
        raise WaterfallError(f"layers.{label}.requires_attempted must be a mapping of provider to a list of providers")
    order = layer_order(cfg)
    for provider, prereqs in rules.items():
        if not isinstance(prereqs, list):
            raise WaterfallError(f"layers.{label}.requires_attempted.{provider} must be a list")
        # A name outside the order could never finish, so the rung would be held back forever. Fail loud.
        unknown = [str(name) for name in [provider, *prereqs] if str(name) not in order]
        if unknown:
            raise WaterfallError(
                f"layers.{label}.requires_attempted names {unknown}, which are not in the {label} order {order}"
            )


def unmet_prereqs(ledger: "Ledger", layer: str, cfg: dict[str, Any], provider: str, completed: set[str]) -> list[str]:
    """The prerequisites of `provider` that are NOT yet satisfied for this row (empty list = may run).

    A prerequisite is satisfied when it finished for this row, or when it is switched off for the run with
    --skip-provider, which since 2026-09-28 needs --operator-approved-skip (/tool-balance-guard).
    """
    return [
        prereq for prereq in requires_attempted(cfg, provider)
        if prereq not in completed and ledger.skip_reason(layer, prereq) is None
    ]


def provider_meta(routing: dict[str, Any], provider: str) -> dict[str, Any]:
    return (routing.get("providers") or {}).get(provider) or {}


def provider_name(routing: dict[str, Any], provider: str) -> str:
    return str(provider_meta(routing, provider).get("name") or provider)


def verification_cfg(routing: dict[str, Any]) -> dict[str, Any]:
    cfg = (routing.get("layers") or {}).get("verification") or {}
    return cfg if isinstance(cfg, dict) else {}


def verifier_key(routing: dict[str, Any]) -> str:
    key = str(verification_cfg(routing).get("provider") or "").strip()
    if not key:
        raise WaterfallError("provider routing has no layers.verification.provider (the email verifier of record)")
    return key


def transient_raw_statuses(routing: dict[str, Any]) -> frozenset[str]:
    values = verification_cfg(routing).get("transient_raw_statuses")
    if values is None:
        return DEFAULT_TRANSIENT_RAW
    if not isinstance(values, list):
        raise WaterfallError("layers.verification.transient_raw_statuses must be a list")
    return frozenset(str(value if value is not None else "").strip().lower() for value in values)


def catch_all_policy(email_cfg: dict[str, Any]) -> str:
    policy = str(email_cfg.get("on_catch_all") or DEFAULT_CATCH_ALL_POLICY).strip().lower()
    if policy not in CATCH_ALL_POLICIES:
        raise WaterfallError(f"layers.email.on_catch_all must be continue or stop, got {policy!r}")
    return policy


# ---------------------------------------------------------------------------
# Contacts
# ---------------------------------------------------------------------------
def resolve_tier(row: dict[str, Any]) -> str:
    return norm_token(row.get("title_role_tier")) or norm_token(row.get("score_role_tier"))


def load_contacts(path: Path) -> tuple[list[str], list[dict[str, Any]], dict[str, Any]]:
    if not Path(path).exists():
        raise WaterfallError(f"missing contacts CSV: {path}")
    header, rows = read_csv(path)
    if not header:
        raise WaterfallError(f"contacts CSV has no header: {path}")
    has_send = "send_eligible" in header
    seen: set[str] = set()
    persons: list[dict[str, Any]] = []
    duplicates = 0
    for index, row in enumerate(rows):
        pid = str(row.get("person_id") or "").strip() or person_id(row)
        if pid in seen:
            duplicates += 1
            continue
        seen.add(pid)
        company = norm_domain(field_value(row, "company_domain"))
        tier = resolve_tier(row)
        reason = ""
        if not company:
            reason = "no_company_domain"
        elif has_send and not truthy(row.get("send_eligible")):
            reason = "send_eligible_false"
        elif norm_token(row.get("title_status")) == "fail":
            reason = "title_status_fail"
        elif tier in NON_BUYER_TIERS:
            reason = f"tier_{tier}"
        rank_value = parse_number(row.get("contact_rank_in_company"), float(UNRANKED))
        persons.append({
            "pid": pid,
            "row": row,
            "index": index,
            "company": company,
            "tier": tier,
            "tier_rank": TIER_RANK.get(tier, len(TIERS)),
            "lead_score": parse_number(row.get("lead_score"), -1.0),
            "rank": rank_value,
            "eligible": not reason,
            "ineligible_reason": reason,
            "priority_order": 0,
            "role": "",
            "wave_slot": "",
            "wave_slot_reason": "",
            "ev": None,
        })
    stats = {
        "path": str(path),
        "rows": len(rows),
        "duplicates": duplicates,
        "ineligible": Counter(p["ineligible_reason"] for p in persons if not p["eligible"]),
    }
    return header, persons, stats


def priority_key(p: dict[str, Any]) -> tuple[Any, ...]:
    """Buyer priority before ease of enrichment."""
    return (p["tier_rank"], -p["lead_score"], p["rank"], p["pid"])


# ---------------------------------------------------------------------------
# Ledger
# ---------------------------------------------------------------------------
class Ledger:
    """Indexes of the append-only ledger. Order within every list is ledger order."""

    def __init__(self, lines: list[dict[str, Any]]):
        self.lines = lines
        self.attempts: dict[str, dict[str, list[dict[str, Any]]]] = {
            "email": defaultdict(list),
            "phone": defaultdict(list),
            "people": defaultdict(list),
        }
        self.verify: dict[str, list[dict[str, Any]]] = defaultdict(list)
        self.control_latest: dict[tuple[str, str], dict[str, Any]] = {}
        self.control_history: list[dict[str, Any]] = []
        for line in lines:
            layer = str(line.get("layer") or "")
            result = str(line.get("result") or "")
            provider = str(line.get("provider") or "")
            if result in CONTROL_RESULTS:
                self.control_latest[(layer, provider)] = line
                self.control_history.append(line)
                continue
            if layer == "verify":
                key = norm_email(line.get("email") or line.get("value"))
                if key:
                    self.verify[key].append(line)
            elif layer in ("email", "phone"):
                self.attempts[layer][str(line.get("person_id") or "")].append(line)
            elif layer == "people":
                self.attempts["people"][norm_domain(line.get("company_domain"))].append(line)

    def skip_reason(self, layer: str, provider: str) -> str | None:
        line = self.control_latest.get((layer, provider))
        if line and line.get("result") == "skipped":
            return str((line.get("detail") or {}).get("reason") or "no reason given")
        return None

    def ever_skipped(self, layer: str, provider: str) -> bool:
        return any(
            line.get("layer") == layer and line.get("provider") == provider and line.get("result") == "skipped"
            for line in self.control_history
        )


def completion(attempts: list[dict[str, Any]], retry_on_error: int) -> tuple[set[str], list[str]]:
    """A provider is complete after a found/not_found line, or after more errors than the retry allowance."""
    done: set[str] = set()
    errors: Counter[str] = Counter()
    attempted: list[str] = []
    for line in attempts:
        provider = str(line.get("provider") or "")
        if provider not in attempted:
            attempted.append(provider)
        result = line.get("result")
        if result in ("found", "not_found"):
            done.add(provider)
        elif result == "error":
            errors[provider] += 1
    done |= {provider for provider, count in errors.items() if count > retry_on_error}
    return done, attempted


def next_rung(
    ledger: Ledger,
    layer: str,
    cfg: dict[str, Any],
    row: dict[str, Any],
    completed: set[str],
    cap: int | None,
    extra_required: Iterable[str],
) -> tuple[str, bool, int]:
    """First provider not run-skipped, with its inputs and its requires_attempted rungs finished, not
    completed, inside the depth cap.

    Returns (provider or "", depth_capped, frontier index).
    """
    order = layer_order(cfg)
    extra = list(extra_required)
    used = sum(1 for provider in order if provider in completed)
    for index, provider in enumerate(order):
        if provider in completed:
            continue
        if ledger.skip_reason(layer, provider) is not None:
            continue
        if missing_inputs(row, rung_requires(cfg, provider, extra)):
            continue
        if unmet_prereqs(ledger, layer, cfg, provider, completed):
            continue
        if cap is not None and used >= cap:
            return "", True, index
        return provider, False, index
    return "", False, len(order)


# ---------------------------------------------------------------------------
# The engine: every state, recomputed
# ---------------------------------------------------------------------------
class Engine:
    def __init__(self, persons: list[dict[str, Any]], spec: dict[str, Any], routing: dict[str, Any], ledger: Ledger,
                 reservoir_path: Path | None = None, reservoir_max_age_days: int = reservoir.DEFAULT_MAX_AGE_DAYS):
        self.persons = persons
        self.spec = spec
        self.routing = routing
        self.ledger = ledger
        # Aaron flow (see aaron-flow.md section 7). Loaded once; a missing path or missing file is a graceful
        # no-op (empty store), so the waterfall runs exactly as before when no reservoir is given.
        self.reservoir_path = reservoir_path
        self.reservoir_max_age_days = reservoir_max_age_days
        self.reservoir_store = reservoir.load_store(reservoir_path) if reservoir_path else {}
        self.reservoir_today = date.today()
        # Ruling every-email-verified (aaron-flow.md section 8). A work email on a domain that is not the
        # person's own company domain ships only when that domain is proven same-company: a colleague at the
        # same company already verified on it (computed below, once per account, from this run's own ledger).
        # Keyed domain -> set of pids whose own candidate proved it, so a person never proves it for themselves.
        self.proven_domains: dict[str, set[str]] = {}
        buyers = spec_buyers(spec)
        raw_cap = buyers.get("contacts_per_account")
        cap_token = str(raw_cap).strip().lower() if raw_cap is not None else ""
        if raw_cap is None or cap_token in {"all", "unlimited", ""}:
            # Ruling no-contacts-cap (aaron-flow.md section 8, locked doctrine): every verified buyer at a fit
            # company ships; "all" (or the field left out) is the default. A number here is a one-run operator
            # override only (FNNL keeps this override; A-Sales removed the field entirely).
            self.required: int | None = None
            self.required_label = "all"
        else:
            self.required = max(1, int(parse_number(raw_cap, 1)))
            self.required_label = str(self.required)
        self.work_required = as_bool(buyers.get("work_email_required"), True)
        self.policy = str(buyers.get("personal_email_policy") or "fail").strip().lower()
        self.phone_required = as_bool(buyers.get("phone_required"), False)
        self.email_cfg = layer_cfg(routing, "email")
        self.order = layer_order(self.email_cfg)
        self.retry = int(parse_number(self.email_cfg.get("retry_on_error"), DEFAULT_RETRY))
        caps = self.email_cfg.get("max_rungs_by_role_tier") or {}
        self.caps = {tier: int(parse_number(caps.get(tier), len(self.order))) for tier in TIERS}
        self.blank_cap = min(self.caps.values())
        self.on_catch_all = catch_all_policy(self.email_cfg)
        verification = verification_cfg(routing)
        self.retry_transient = int(parse_number(verification.get("retry_transient"), 1))
        self.verifier = verifier_key(routing)
        self.verifier_name = provider_name(routing, self.verifier)
        self.transient_raw = transient_raw_statuses(routing)
        self._phone_cfg: dict[str, Any] | None = None
        self.claimed: dict[str, str] = {}
        self.accounts: list[dict[str, Any]] = []
        self._evaluate()

    # -- phone config is only needed when the phone layer is used ------------
    @property
    def phone_cfg(self) -> dict[str, Any]:
        if self._phone_cfg is None:
            self._phone_cfg = layer_cfg(self.routing, "phone")
        return self._phone_cfg

    @property
    def phone_retry(self) -> int:
        # The routing file sets no phone retry_on_error; default to the email layer's value.
        return int(parse_number(self.phone_cfg.get("retry_on_error"), self.retry))

    # -- email ----------------------------------------------------------------
    def verdict_for(self, email: str) -> tuple[str | None, dict[str, Any] | None, bool, bool]:
        """(verdict, verdict line, needs verification, transient retries exhausted)."""
        lines = self.ledger.verify.get(email, [])
        final = [line for line in lines if line.get("result") in GATES]
        if final:
            return str(final[-1]["result"]), final[-1], False, False
        transient = sum(1 for line in lines if line.get("result") == "transient")
        if transient <= self.retry_transient:
            return None, None, True, False
        return "unknown", lines[-1], False, True

    def classify_candidate(self, p: dict[str, Any], cand: dict[str, Any]) -> None:
        domain = email_domain(cand["email"])
        cand.update(kind="work", verdict=None, verdict_line=None, needs_verify=False, transient_exhausted=False)
        if domain in CONSUMER_DOMAINS and self.work_required and self.policy != "allow":
            cand["kind"] = "personal"
            if self.policy == "fail":
                cand["verdict"] = "personal_rejected"  # rejected without a verifier call
                return
        elif domain not in CONSUMER_DOMAINS and not same_org_domain(domain, p["company"]):
            provers = self.proven_domains.get(domain, set()) - {p["pid"]}
            if provers or domain in account_alt_domains(p):
                # Ruling every-email-verified (aaron-flow.md section 8): a colleague (a different person) at
                # the same company already verified valid on this domain, or the company's own record names
                # it as a brand domain. Either way it is proven same-company, not a wrong-company email. A
                # person's own candidate never proves the domain for themselves (provers excludes p["pid"]).
                cand["kind"] = "work"
                cand["colleague_verified_domain"] = True
            else:
                cand["kind"] = "mismatch"
        verdict, line, needs, exhausted = self.verdict_for(cand["email"])
        cand.update(verdict=verdict, verdict_line=line, needs_verify=needs, transient_exhausted=exhausted)

    def evaluate_email(self, p: dict[str, Any]) -> dict[str, Any]:
        row, pid = p["row"], p["pid"]
        attempts = self.ledger.attempts["email"].get(pid, [])
        cands: list[dict[str, Any]] = []
        by_email: dict[str, dict[str, Any]] = {}

        def add(raw: Any, provider: str) -> None:
            email = norm_email(raw)
            if not email:
                return
            if email in by_email:
                if provider not in by_email[email]["providers"]:
                    by_email[email]["providers"].append(provider)
                return
            cand = {"email": email, "raw": str(raw).strip(), "providers": [provider], "source": provider}
            self.classify_candidate(p, cand)
            by_email[email] = cand
            cands.append(cand)

        # Aaron flow (see aaron-flow.md sections 7-8). Rung 0: a reservoir match verified `valid` within the
        # freshness window is tried before the email the row carries or any paid finder. Giggal still
        # verifies it fresh in this campaign's own ledger (the reservoir only ever saves a finder credit).
        if self.reservoir_store:
            rec, _why = reservoir.find_for_person(
                self.reservoir_store, row.get("linkedin_url"), field_value(row, "email"), p["company"],
                self.reservoir_max_age_days, self.reservoir_today,
            )
            if rec:
                add(rec["email"], "reservoir")

        add(field_value(row, "email"), ROW_EXISTING)
        for line in attempts:
            if line.get("result") == "found":
                add(line.get("value") or line.get("email"), str(line.get("provider") or ""))

        completed, attempted = completion(attempts, self.retry)
        attempted_index = [self.order.index(provider) for provider in attempted if provider in self.order]
        ev: dict[str, Any] = {
            "cands": cands,
            "attempts": attempts,
            "completed": completed,
            "attempted": attempted,
            "rungs_used": sum(1 for provider in self.order if provider in completed),
            "state": "",
            "final": "",
            "next": "",
            "chosen": None,
            "best": None,
            "depth_capped": False,
            "exhaust_reason": "",
            "frontier": max(attempted_index) if attempted_index else 0,
        }

        # READY: a same-org (or allowed personal) email the email verifier marked valid. A valid email
        # already owned by a higher-priority person is not reusable (no duplicate send rows).
        for cand in cands:
            if cand["kind"] == "work" and cand["verdict"] == "valid":
                owner = self.claimed.get(cand["email"])
                if owner and owner != pid:
                    cand["kind"] = "shared"
                    cand["shared_with"] = owner
                    continue
                self.claimed[cand["email"]] = pid
                ev.update(state="READY", final="READY", chosen=cand, best=cand)
                return ev

        if any(cand["needs_verify"] for cand in cands):
            ev["state"] = "VERIFY_PENDING"
            return ev

        # Policy review: a verified personal email ends this person's waterfall as READY_REVIEW. It never
        # fills a slot, so the next person at the account is promoted.
        personal = first(c for c in cands if c["kind"] == "personal" and c["verdict"] == "valid")
        if personal:
            ev.update(state="EXHAUSTED", final="READY_REVIEW", best=personal,
                      exhaust_reason="a personal email verified valid (personal_email_policy review)")
            return ev

        # on_catch_all: stop. A work-domain catch_all verdict ends this person's waterfall and the address goes
        # to the holdback. No later finder runs: catch-all is a property of the domain, so any other address a
        # finder returned at that domain would verify catch_all too. This also covers an email the row already
        # carried (verified first, before any finder). The next person at the account is promoted as usual.
        if self.on_catch_all == "stop":
            stopped = first(c for c in cands if c["kind"] == "work" and c["verdict"] == "catch_all")
            if stopped:
                ev.update(state="EXHAUSTED", final="EMAIL_CATCH_ALL", best=stopped,
                          exhaust_reason="catch_all verdict (on_catch_all stop: holdback, no later finder)")
                return ev

        cap = self.caps.get(p["tier"], self.blank_cap)
        provider, capped, frontier = next_rung(
            self.ledger, "email", self.email_cfg, row, completed, cap, FINDER_NAME_FIELDS
        )
        ev["frontier"] = frontier
        if provider:
            ev.update(state="EMAIL_PENDING", next=provider)
            return ev

        ev["state"] = "EXHAUSTED"
        ev["depth_capped"] = capped
        if capped:
            ev["exhaust_reason"] = f"depth cap reached ({plural(cap, 'rung')} for tier {p['tier'] or 'blank'})"
        elif attempted:
            ev["exhaust_reason"] = "every usable rung was tried"
        else:
            ev["exhaust_reason"] = ("no usable rung (missing input, skipped for this run, or waiting on a rung "
                                    "that must be attempted first)")
        work_catch_all = first(c for c in cands if c["kind"] == "work" and c["verdict"] == "catch_all")
        mismatch = first(c for c in cands if c["kind"] == "mismatch" and c["verdict"] == "valid") or first(
            c for c in cands if c["kind"] == "mismatch" and c["verdict"] == "catch_all"
        )
        if work_catch_all:
            ev.update(final="EMAIL_CATCH_ALL", best=work_catch_all)
        elif mismatch:
            ev.update(final="EMAIL_DOMAIN_MISMATCH", best=mismatch)
        elif cands:
            ev.update(final="EMAIL_INVALID", best=cands[-1])
        else:
            ev.update(final="EMAIL_MISSING", best=None)
        return ev

    @staticmethod
    def tried(p: dict[str, Any]) -> bool:
        ev = p["ev"]
        if not ev:
            return False
        return bool(ev["attempted"]) or any(c["verdict"] in GATES for c in ev["cands"])

    def _evaluate(self) -> None:
        groups: dict[str, list[dict[str, Any]]] = defaultdict(list)
        for p in self.persons:
            if p["company"]:
                groups[p["company"]].append(p)
        for company in sorted(groups):
            everyone = groups[company]
            eligible = sorted((p for p in everyone if p["eligible"]), key=priority_key)
            account = {"company": company, "persons": eligible, "all": everyone, "required": self.required,
                       "required_label": self.required_label}
            for position, p in enumerate(eligible, start=1):
                p["priority_order"] = position
            self.proven_domains = {}
            for p in eligible:
                p["ev"] = self.evaluate_email(p)
            # Ruling every-email-verified (aaron-flow.md section 8), second pass: a colleague at this same
            # company already verified valid on a domain that first looked like a mismatch proves that domain
            # same-company, so any candidate there is promoted from mismatch to work and re-evaluated. Keyed by
            # pid, not just by domain: a person's OWN valid-but-wrong-domain email never proves itself (that
            # would promote any deliverable wrong-company address), it only proves the domain for a colleague.
            mismatch_proof: dict[str, set[str]] = defaultdict(set)
            for p in eligible:
                for cand in p["ev"]["cands"]:
                    if cand["kind"] == "mismatch" and cand["verdict"] == "valid":
                        mismatch_proof[email_domain(cand["email"])].add(p["pid"])
            if mismatch_proof:
                self.proven_domains = dict(mismatch_proof)
                for p in eligible:
                    p["ev"] = self.evaluate_email(p)
            self._assign_roles(account)
            self.accounts.append(account)

    def _assign_roles(self, account: dict[str, Any]) -> None:
        eligible = account["persons"]
        required = self.required
        if not eligible:
            account.update(state="ACCOUNT_NO_ELIGIBLE_PERSON", ready=0, tried=0, promotions=0)
            return
        ready = [p for p in eligible if p["ev"]["state"] == "READY"]
        if required is None:
            # Ruling no-contacts-cap (aaron-flow.md section 8, locked doctrine): every verified buyer at a fit
            # company ships, so there is no per-account stop, no "ready_over_cap" and no "waiting" for a slot.
            for p in eligible:
                state = p["ev"]["state"]
                if state == "READY":
                    p["role"] = "ready"
                elif state == "EXHAUSTED":
                    p["role"] = "finished"
                else:
                    p["role"] = "active"
            if any(p["role"] == "active" for p in eligible):
                account["state"] = "ACCOUNT_IN_PROGRESS"
            elif ready:
                account["state"] = "ACCOUNT_ALL_WORKED"
            else:
                account["state"] = "ACCOUNT_NO_READY_CONTACT"
        elif len(ready) >= required:
            wave = {p["pid"] for p in ready[:required]}
            for p in eligible:
                state = p["ev"]["state"]
                if state == "READY":
                    p["role"] = "ready" if p["pid"] in wave else "ready_over_cap"
                elif state == "EXHAUSTED" and self.tried(p):
                    p["role"] = "finished"  # finished work keeps its state even when demoted
                else:
                    p["role"] = "not_needed"  # the per-account stop
            account["state"] = "ACCOUNT_SATISFIED"
        else:
            slots = required - len(ready)
            for p in eligible:
                state = p["ev"]["state"]
                if state == "READY":
                    p["role"] = "ready"
                elif state == "EXHAUSTED":
                    p["role"] = "finished"
                elif slots > 0:
                    p["role"] = "active"
                    slots -= 1
                else:
                    p["role"] = "waiting"
            if any(p["role"] in ("active", "waiting") for p in eligible):
                account["state"] = "ACCOUNT_IN_PROGRESS"
            elif ready:
                account["state"] = "ACCOUNT_PARTIAL"
            else:
                account["state"] = "ACCOUNT_NO_READY_CONTACT"
        for p in eligible:
            if required is None:
                p["wave_slot"] = "primary"
                p["wave_slot_reason"] = "every eligible person at the account is worked (ruling no-contacts-cap)"
            elif p["priority_order"] <= required:
                p["wave_slot"] = "primary"
                p["wave_slot_reason"] = f"within the top {required} by buyer priority"
            elif p["role"] in ("ready", "active", "finished"):
                p["wave_slot"] = "promoted_fallback"
                p["wave_slot_reason"] = self._promotion_reason(p, eligible)
            else:
                p["wave_slot"] = ""
                p["wave_slot_reason"] = ""
        account["ready"] = sum(1 for p in eligible if p["role"] == "ready")
        account["tried"] = sum(1 for p in eligible if self.tried(p))
        account["promotions"] = sum(1 for p in eligible if p["wave_slot"] == "promoted_fallback")

    @staticmethod
    def _promotion_reason(p: dict[str, Any], eligible: list[dict[str, Any]]) -> str:
        above = [
            q for q in eligible
            if q["priority_order"] < p["priority_order"] and q["role"] == "finished"
        ]
        if not above:
            return "promoted: higher-priority persons at this account finished first"
        parts = [
            f"{q['pid']} exhausted: {q['ev']['final']} after {plural(q['ev']['rungs_used'], 'rung')}"
            for q in above
        ]
        return "promoted after " + "; ".join(parts)

    # -- iteration helpers ------------------------------------------------------
    def eligible_persons(self) -> list[dict[str, Any]]:
        return [p for account in self.accounts for p in account["persons"]]

    def wave_persons(self) -> list[dict[str, Any]]:
        return [p for p in self.eligible_persons() if p["role"] == "ready"]

    # -- phone ----------------------------------------------------------------
    def evaluate_phone(self, p: dict[str, Any]) -> dict[str, Any]:
        row, pid = p["row"], p["pid"]
        attempts = self.ledger.attempts["phone"].get(pid, [])
        base = {"attempts": attempts, "phone": "", "source": "", "next": ""}
        existing = norm_phone(field_value(row, "phone"))
        if existing:
            return {**base, "state": "PHONE_FOUND", "label": "PHONE_FOUND", "phone": existing, "source": ROW_EXISTING}
        for line in attempts:
            if line.get("result") == "found":
                phone = norm_phone(line.get("value"))
                if phone:
                    return {**base, "state": "PHONE_FOUND", "label": "PHONE_FOUND", "phone": phone,
                            "source": str(line.get("provider") or "")}
        completed, _ = completion(attempts, self.phone_retry)
        provider, _, _ = next_rung(self.ledger, "phone", self.phone_cfg, row, completed, None, [])
        if provider:
            return {**base, "state": "PHONE_PENDING", "label": f"PHONE_PENDING:{provider}", "next": provider}
        return {**base, "state": "PHONE_MISSING", "label": "PHONE_MISSING"}


# ---------------------------------------------------------------------------
# Labels and row builders
# ---------------------------------------------------------------------------
def person_state(p: dict[str, Any]) -> str:
    role, ev = p["role"], p["ev"]
    if role == "waiting":
        return "WAITING"
    if role == "not_needed":
        return "NOT_NEEDED"
    if ev["state"] == "READY":
        return "READY"
    if ev["state"] == "EXHAUSTED":
        return ev["final"]
    if ev["state"] == "VERIFY_PENDING":
        return "VERIFY_PENDING"
    return f"EMAIL_PENDING:{ev['next']}"


def verdict_label(cand: dict[str, Any] | None) -> str:
    if cand is None:
        return ""
    if cand["kind"] == "shared":
        return f"shared_email({cand.get('shared_with', '')})"
    if cand["verdict"] == "personal_rejected":
        return "personal_rejected"
    verdict = cand["verdict"] or "unverified"
    if cand["kind"] == "personal":
        return f"personal_{verdict}"
    if cand["kind"] == "mismatch":
        return f"domain_mismatch_{verdict}"
    return verdict


def attempt_path(ev: dict[str, Any]) -> str:
    by_email = {cand["email"]: cand for cand in ev["cands"]}
    parts: list[str] = []

    def found_part(provider: str, cand: dict[str, Any] | None, raw: str) -> str:
        label = verdict_label(cand) if cand else "unparseable"
        email = cand["email"] if cand else raw
        return f"{provider}:{label}" if label == "valid" else f"{provider}:{label}({email})"

    row_cand = first(c for c in ev["cands"] if c["source"] == ROW_EXISTING)
    if row_cand:
        parts.append(found_part(ROW_EXISTING, row_cand, row_cand["email"]))
    for line in ev["attempts"]:
        provider = str(line.get("provider") or "")
        result = str(line.get("result") or "")
        if result == "found":
            email = norm_email(line.get("value") or line.get("email"))
            parts.append(found_part(provider, by_email.get(email), str(line.get("value") or "")))
        else:
            parts.append(f"{provider}:{result}")
    return " > ".join(parts)


def candidates_text(ev: dict[str, Any]) -> str:
    return "; ".join(
        f"{cand['email']}|{'+'.join(cand['providers'])}|{verdict_label(cand)}" for cand in ev["cands"]
    )


def verified_at(cand: dict[str, Any] | None) -> str:
    if not cand or not cand.get("verdict_line"):
        return ""
    line = cand["verdict_line"]
    return str((line.get("detail") or {}).get("verified_at") or line.get("ts") or "")


def missing_skips(engine: Engine, p: dict[str, Any]) -> list[tuple[str, list[str]]]:
    """Rungs this person was routed past because the row lacked the rung's input."""
    ev = p["ev"]
    out = []
    for index, provider in enumerate(engine.order):
        if index >= ev["frontier"] or provider in ev["attempted"]:
            continue
        missing = missing_inputs(p["row"], rung_requires(engine.email_cfg, provider, FINDER_NAME_FIELDS))
        if missing:
            out.append((provider, missing))
    return out


def run_skip_passes(engine: Engine, p: dict[str, Any]) -> list[str]:
    """Rungs this person was routed past because the provider was skipped for the run."""
    ev = p["ev"]
    out = []
    for index, provider in enumerate(engine.order):
        if index >= ev["frontier"] or provider in ev["attempted"]:
            continue
        if missing_inputs(p["row"], rung_requires(engine.email_cfg, provider, FINDER_NAME_FIELDS)):
            continue
        if engine.ledger.ever_skipped("email", provider):
            out.append(provider)
    return out


def prereq_holds(engine: Engine, p: dict[str, Any]) -> list[tuple[str, list[str]]]:
    """Rungs this person was routed past because a requires_attempted rung had not finished for them."""
    ev = p["ev"]
    out = []
    for index, provider in enumerate(engine.order):
        if index >= ev["frontier"] or provider in ev["attempted"] or provider in ev["completed"]:
            continue
        if missing_inputs(p["row"], rung_requires(engine.email_cfg, provider, FINDER_NAME_FIELDS)):
            continue
        if engine.ledger.ever_skipped("email", provider):
            continue
        unmet = unmet_prereqs(engine.ledger, "email", engine.email_cfg, provider, ev["completed"])
        if unmet:
            out.append((provider, unmet))
    return out


def email_queue_row(p: dict[str, Any]) -> dict[str, Any]:
    row = p["row"]
    return {
        "person_id": p["pid"],
        "first_name": field_value(row, "first_name"),
        "last_name": field_value(row, "last_name"),
        "company_domain": p["company"],
        "company_name": field_value(row, "company_name"),
        "company_linkedin": field_value(row, "company_linkedin"),
        "linkedin_url": field_value(row, "linkedin_url"),
        "job_title": field_value(row, "job_title"),
        "title_role_tier": p["tier"],
    }


def phone_queue_row(p: dict[str, Any]) -> dict[str, Any]:
    row = p["row"]
    chosen = p["ev"]["chosen"]
    return {
        "person_id": p["pid"],
        "first_name": field_value(row, "first_name"),
        "last_name": field_value(row, "last_name"),
        "company_domain": p["company"],
        "company_name": field_value(row, "company_name"),
        "linkedin_url": field_value(row, "linkedin_url"),
        "email": chosen["email"] if chosen else "",
        "job_title": field_value(row, "job_title"),
    }


# ---------------------------------------------------------------------------
# plan
# ---------------------------------------------------------------------------
def clear_queues(work: Path, layer: str) -> None:
    if not work.exists():
        return
    patterns = [f"queue-{layer}-*.csv"]
    if layer == "email":
        patterns.append("queue-verify.csv")
    for pattern in patterns:
        for path in work.glob(pattern):
            path.unlink()


def build_control_lines(args: argparse.Namespace, cfg: dict[str, Any], layer: str) -> list[dict[str, Any]]:
    skips = args.skip_provider or []
    unskips = args.unskip_provider or []
    if not skips and not unskips:
        return []
    if skips and not (args.skip_reason or "").strip():
        raise WaterfallError("--skip-provider needs --skip-reason (a skip is never silent)")
    if skips and not getattr(args, "operator_approved_skip", False):
        raise WaterfallError(skip_refusal(skips, args.skip_reason))
    order = layer_order(cfg)
    unknown = [provider for provider in skips + unskips if provider not in order]
    if unknown:
        raise WaterfallError(f"provider(s) {unknown} are not in the {layer} routing order {order}")
    ts = now_iso()
    lines = []
    for provider in skips:
        lines.append({
            "ts": ts, "layer": layer, "provider": provider, "company_domain": "", "person_id": "",
            "result": "skipped", "value": "", "email": "", "cost_usd": None,
            "detail": {"scope": "run", "reason": args.skip_reason.strip(), "operator_approved": True},
        })
    for provider in unskips:
        lines.append({
            "ts": ts, "layer": layer, "provider": provider, "company_domain": "", "person_id": "",
            "result": "unskipped", "value": "", "email": "", "cost_usd": None,
            "detail": {"scope": "run", "reason": (args.skip_reason or "").strip() or "operator unskip"},
        })
    return lines


def skip_refusal(skips: list[str], reason: str) -> str:
    """Why a --skip-provider without --operator-approved-skip is refused (/tool-balance-guard)."""
    if BALANCE_REASON.search(reason):
        what = "out of balance (credits, fair use, wallet or a 402)"
    elif OUTAGE_REASON.search(reason):
        what = "down"
    else:
        what = "switched off"
    return (f"{skips} would be skipped as {what}, and a provider that is {what} is a stop, not a skip: its rows "
            "never pass to the next rung without the operator's say-so. Stop that step, save progress, and ask the "
            "operator to top it up or fix it, then resume on the same provider (/tool-balance-guard). Only when the "
            "operator has said in chat to go on without it, re-run with --operator-approved-skip.")


def queue_line(routing: dict[str, Any], name: str, provider: str, count: int, noun: str) -> str:
    meta = provider_meta(routing, provider)
    label = meta.get("name") or provider
    line = f"{name}: {plural(count, noun)} for {label}."
    if str(meta.get("concurrency") or "") == "serial_only":
        line += f" {SERIAL_NOTE}."
    return line


def run_skip_lines(ledger: Ledger, layer: str, order: list[str]) -> list[str]:
    out = []
    for provider in order:
        reason = ledger.skip_reason(layer, provider)
        if reason is not None:
            out.append(f"skipped for this run: {provider} ({reason})")
    return out


def plan_email(engine: Engine, routing: dict[str, Any], work: Path) -> tuple[list[str], dict[str, Any]]:
    verify: dict[str, dict[str, list[str]]] = {}
    queues: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for p in engine.eligible_persons():
        if p["role"] != "active":
            continue
        ev = p["ev"]
        if ev["state"] == "VERIFY_PENDING":
            for cand in ev["cands"]:
                if not cand["needs_verify"]:
                    continue
                slot = verify.setdefault(cand["email"], {"person_ids": [], "providers": []})
                if p["pid"] not in slot["person_ids"]:
                    slot["person_ids"].append(p["pid"])
                for provider in cand["providers"]:
                    if provider not in slot["providers"]:
                        slot["providers"].append(provider)
        elif ev["state"] == "EMAIL_PENDING":
            queues[ev["next"]].append(email_queue_row(p))

    lines: list[str] = []
    pending: dict[str, int] = {}
    if verify:
        rows = [
            {"email": email, "person_ids": "|".join(v["person_ids"]), "source_providers": "|".join(v["providers"])}
            for email, v in verify.items()
        ]
        write_csv(work / "queue-verify.csv", VERIFY_QUEUE_COLUMNS, rows)
        pending["verify"] = len(rows)
        line = f"queue-verify.csv: {plural(len(rows), 'email')} to verify with {engine.verifier_name}"
        cli = str(verification_cfg(routing).get("cli") or "").strip()
        line += f" (run it through {cli}, then record with --layer verify)." if cli else " (then record with --layer verify)."
        lines.append(line)
    for provider in engine.order:
        rows = queues.get(provider) or []
        if not rows:
            continue
        name = f"queue-email-{provider}.csv"
        write_csv(work / name, EMAIL_QUEUE_COLUMNS, rows)
        pending[provider] = len(rows)
        lines.append(queue_line(routing, name, provider, len(rows), "person"))
    if not pending:
        lines.append("no email work pending: run finalize.")
    lines.extend(run_skip_lines(engine.ledger, "email", engine.order))
    return lines, pending


def plan_phone(engine: Engine, routing: dict[str, Any], work: Path) -> tuple[list[str], dict[str, Any], Counter]:
    queues: dict[str, list[dict[str, Any]]] = defaultdict(list)
    states: Counter[str] = Counter()
    for p in engine.wave_persons():
        phone = engine.evaluate_phone(p)
        states[phone["label"]] += 1
        if phone["state"] == "PHONE_PENDING":
            queues[phone["next"]].append(phone_queue_row(p))
    lines: list[str] = []
    pending: dict[str, int] = {}
    for provider in layer_order(engine.phone_cfg):
        rows = queues.get(provider) or []
        if not rows:
            continue
        name = f"queue-phone-{provider}.csv"
        write_csv(work / name, PHONE_QUEUE_COLUMNS, rows)
        pending[provider] = len(rows)
        lines.append(queue_line(routing, name, provider, len(rows), "person"))
    if not pending:
        lines.append("no phone work pending.")
    lines.extend(run_skip_lines(engine.ledger, "phone", layer_order(engine.phone_cfg)))
    return lines, pending, states


def company_included(row: dict[str, Any], header: list[str]) -> bool:
    conditions = []
    if "enrichment_tier" in header:
        conditions.append(norm_token(row.get("enrichment_tier")) == "enriched")
    if "fit_status" in header:
        conditions.append(norm_token(row.get("fit_status")) in {"good", "maybe"})
    return any(conditions) if conditions else True


def evaluate_people(
    companies_path: Path,
    contacts_header: list[str],
    persons: list[dict[str, Any]],
    spec: dict[str, Any],
    routing: dict[str, Any],
    ledger: Ledger,
) -> list[dict[str, Any]]:
    if not Path(companies_path).exists():
        raise WaterfallError(f"missing companies CSV: {companies_path}")
    cfg = layer_cfg(routing, "people")
    minimum = max(1, int(parse_number(spec_buyers(spec).get("min_target_persons_per_account"), 2)))
    retry = int(parse_number(cfg.get("retry_on_error"), DEFAULT_RETRY))
    header, rows = read_csv(companies_path)
    has_title_status = "title_status" in contacts_header
    totals: Counter[str] = Counter()
    targets: Counter[str] = Counter()
    for p in persons:
        if not p["company"]:
            continue
        totals[p["company"]] += 1
        if has_title_status:
            is_target = norm_token(p["row"].get("title_status")) == "pass"
        else:
            is_target = p["tier"] in TIERS
        if is_target:
            targets[p["company"]] += 1
    out: list[dict[str, Any]] = []
    seen: set[str] = set()
    for row in rows:
        if not company_included(row, header):
            continue
        key = norm_domain(field_value(row, "company_domain"))
        if not key or key in seen:
            continue
        seen.add(key)
        total, target = totals.get(key, 0), targets.get(key, 0)
        item = {"company": key, "row": row, "total": total, "target": target, "min": minimum, "next": ""}
        if target >= minimum:
            item["state"] = "TARGET_PERSON_FOUND"
        else:
            completed, _ = completion(ledger.attempts["people"].get(key, []), retry)
            provider, _, _ = next_rung(ledger, "people", cfg, row, completed, None, [])
            if provider:
                item.update(state=f"PEOPLE_PENDING:{provider}", next=provider)
            elif total == 0:
                item["state"] = "PERSON_NOT_FOUND"
            elif target == 0:
                item["state"] = "PERSON_FOUND_NO_TARGET"
            else:
                item["state"] = "TARGET_PARTIAL"
        out.append(item)
    return out


def plan_people(items: list[dict[str, Any]], routing: dict[str, Any], work: Path) -> tuple[list[str], dict[str, Any]]:
    cfg = layer_cfg(routing, "people")
    queues: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for item in items:
        if item["next"]:
            queues[item["next"]].append({
                "company_domain": item["company"],
                "company_name": field_value(item["row"], "company_name"),
                "company_linkedin": field_value(item["row"], "company_linkedin"),
                "target_count": item["target"],
                "needed": item["min"] - item["target"],
            })
    lines: list[str] = []
    pending: dict[str, int] = {}
    for provider in layer_order(cfg):
        rows = queues.get(provider) or []
        if not rows:
            continue
        name = f"queue-people-{provider}.csv"
        write_csv(work / name, PEOPLE_QUEUE_COLUMNS, rows)
        pending[provider] = len(rows)
        lines.append(queue_line(routing, name, provider, len(rows), "company"))
    if not pending:
        lines.append("no people-discovery work pending.")
    return lines, pending


def counts_text(counter: Counter) -> str:
    if not counter:
        return "none"
    return ", ".join(f"{key} {value}" for key, value in sorted(counter.items()))


def write_status(work: Path, payload: dict[str, Any]) -> None:
    work.mkdir(parents=True, exist_ok=True)
    (work / "status.json").write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def cmd_plan(args: argparse.Namespace) -> int:
    spec = load_spec(args.spec, args.allow_draft, enforce=True)
    routing = load_routing(args.routing)
    layer = args.layer
    if layer == "phone" and not as_bool(spec_buyers(spec).get("phone_required"), False):
        print(PHONE_NOT_REQUIRED)
        return 0
    cfg = layer_cfg(routing, layer)
    header, persons, stats = load_contacts(args.contacts)
    if layer == "people" and not args.companies:
        raise WaterfallError("--layer people needs --companies <company CSV>")
    if layer == "people" and not Path(args.companies).exists():
        raise WaterfallError(f"missing companies CSV: {args.companies}")
    control = build_control_lines(args, cfg, layer)
    work = work_dir(args.dir)
    work.mkdir(parents=True, exist_ok=True)
    if control:
        append_jsonl(ledger_path(args.dir), control)
    ledger = Ledger(read_jsonl(ledger_path(args.dir)))
    clear_queues(work, layer)
    status: dict[str, Any] = {
        "generated_at": now_iso(),
        "layer": layer,
        "routing_version": routing.get("routing_version"),
        # record --layer verify reads the verifier from this file when it is not given --routing.
        "routing_path": str(Path(args.routing).resolve()),
        "spec_version": spec.get("spec_version"),
    }
    out: list[str] = []
    if layer == "people":
        items = evaluate_people(args.companies, header, persons, spec, routing, ledger)
        lines, pending = plan_people(items, routing, work)
        states = Counter(item["state"] for item in items)
        out.append(f"people-discovery plan: {plural(len(items), 'company')} in scope "
                   f"(routing {routing.get('routing_version')}).")
        out.append(f"companies: {counts_text(states)}")
        out.extend(lines)
        out.extend(run_skip_lines(ledger, "people", layer_order(cfg)))
        status.update(companies=dict(states), pending=pending)
    else:
        engine = Engine(persons, spec, routing, ledger, args.reservoir, args.reservoir_max_age_days)
        eligible = engine.eligible_persons()
        account_states = Counter(account["state"] for account in engine.accounts)
        person_states = Counter(person_state(p) for p in eligible)
        if layer == "email":
            lines, pending = plan_email(engine, routing, work)
            out.append(f"email waterfall plan: {plural(len(engine.accounts), 'account')}, "
                       f"{plural(len(eligible), 'eligible person')} "
                       f"({sum(stats['ineligible'].values())} not eligible), "
                       f"{engine.required_label} ready contacts needed per account "
                       f"(routing {routing.get('routing_version')}).")
            out.append(f"accounts: {counts_text(account_states)}")
            out.append(f"persons: {counts_text(person_states)}")
            out.extend(lines)
            status.update(accounts=dict(account_states), persons=dict(person_states), pending=pending)
        else:
            lines, pending, phone_states = plan_phone(engine, routing, work)
            out.append(f"phone waterfall plan: {plural(len(engine.wave_persons()), 'ready person')} in the wave.")
            out.append(f"phones: {counts_text(phone_states)}")
            out.extend(lines)
            status.update(phones=dict(phone_states), pending=pending, accounts=dict(account_states))
        status["run_skips"] = {
            provider: engine.ledger.skip_reason(layer, provider)
            for provider in layer_order(cfg)
            if engine.ledger.skip_reason(layer, provider) is not None
        }
    write_status(work, status)
    out.append("next: run each queue against its provider, record the results with `record`, then plan again.")
    print("\n".join(out))
    return 0


# ---------------------------------------------------------------------------
# record
# ---------------------------------------------------------------------------
def parse_cost(value: Any, label: str) -> float | None:
    text = str(value or "").strip()
    if not text:
        return None
    try:
        return float(text.lstrip("$"))
    except ValueError as exc:
        raise WaterfallError(f"{label}: cost_usd {text!r} is not a number") from exc


def parse_detail(text: Any) -> dict[str, Any]:
    raw = str(text or "").strip()
    if not raw:
        return {}
    if raw.startswith("{"):
        try:
            value = json.loads(raw)
            if isinstance(value, dict):
                return value
        except json.JSONDecodeError:
            pass
    return {"note": raw}


def require_columns(header: list[str], columns: list[str], path: Path) -> None:
    missing = [column for column in columns if column not in header]
    if missing:
        raise WaterfallError(f"results file {path} is missing column(s) {missing}; nothing was recorded")


def reject_offenders(offenders: list[str], queue: Path, results: Path, what: str) -> None:
    if offenders:
        unique = list(dict.fromkeys(offenders))
        shown = ", ".join(unique[:50]) + (" ..." if len(unique) > 50 else "")
        raise WaterfallError(
            f"rejected {results}: {plural(len(unique), what)} not in the current queue {queue.name} "
            f"(a provider may have returned another company's rows): {shown}. Nothing was recorded."
        )


def record_email(provider: str, queue_rows: list[dict[str, str]], header: list[str],
                 rows: list[dict[str, str]], queue: Path, results: Path) -> list[dict[str, Any]]:
    require_columns(header, ["person_id", "status"], results)
    queued = {row["person_id"]: row for row in queue_rows}
    reject_offenders([row.get("person_id", "").strip() or "(blank)" for row in rows
                      if row.get("person_id", "").strip() not in queued], queue, results, "person_id")
    bad = sorted({row.get("status", "") for row in rows if norm_token(row.get("status")) not in RESULT_STATUSES})
    if bad:
        raise WaterfallError(f"results file {results} has status value(s) {bad}; use found, not_found or error")
    ts = now_iso()
    records = []
    for row in rows:
        pid = row["person_id"].strip()
        status = norm_token(row.get("status"))
        raw = str(row.get("email") or "").strip()
        email = norm_email(raw)
        detail = parse_detail(row.get("detail"))
        if str(row.get("provider_email_status") or "").strip():
            detail["provider_email_status"] = str(row["provider_email_status"]).strip()
        if status == "found" and not email:
            status = "not_found"
            detail["found_without_usable_email"] = raw
        company = norm_domain(queued[pid].get("company_domain"))
        if status == "found":
            domain = email_domain(email)
            if domain not in CONSUMER_DOMAINS and company and not same_org_domain(domain, company):
                detail["domain_mismatch"] = True
        records.append({
            "ts": ts, "layer": "email", "provider": provider, "company_domain": company, "person_id": pid,
            "result": status, "value": raw if status == "found" else "", "email": email if status == "found" else "",
            "cost_usd": parse_cost(row.get("cost_usd"), str(results)), "detail": detail,
        })
    return records


def record_phone(provider: str, queue_rows: list[dict[str, str]], header: list[str],
                 rows: list[dict[str, str]], queue: Path, results: Path) -> list[dict[str, Any]]:
    require_columns(header, ["person_id", "status"], results)
    queued = {row["person_id"]: row for row in queue_rows}
    reject_offenders([row.get("person_id", "").strip() or "(blank)" for row in rows
                      if row.get("person_id", "").strip() not in queued], queue, results, "person_id")
    bad = sorted({row.get("status", "") for row in rows if norm_token(row.get("status")) not in RESULT_STATUSES})
    if bad:
        raise WaterfallError(f"results file {results} has status value(s) {bad}; use found, not_found or error")
    ts = now_iso()
    records = []
    for row in rows:
        pid = row["person_id"].strip()
        status = norm_token(row.get("status"))
        raw = str(row.get("phone") or "").strip()
        phone = norm_phone(raw)
        detail = parse_detail(row.get("detail"))
        if status == "found" and not phone:
            status = "not_found"
            detail["found_without_usable_phone"] = raw
        if phone and status == "found":
            detail["phone_norm"] = phone
        records.append({
            "ts": ts, "layer": "phone", "provider": provider,
            "company_domain": norm_domain(queued[pid].get("company_domain")), "person_id": pid,
            "result": status, "value": raw if status == "found" else "", "email": "",
            "cost_usd": parse_cost(row.get("cost_usd"), str(results)), "detail": detail,
        })
    return records


def record_people(provider: str, queue_rows: list[dict[str, str]], header: list[str],
                  rows: list[dict[str, str]], queue: Path, results: Path) -> list[dict[str, Any]]:
    require_columns(header, ["company_domain", "status"], results)
    queued = {norm_domain(row.get("company_domain")) for row in queue_rows}
    reject_offenders([row.get("company_domain", "").strip() or "(blank)" for row in rows
                      if norm_domain(row.get("company_domain")) not in queued], queue, results, "company_domain")
    bad = sorted({row.get("status", "") for row in rows if norm_token(row.get("status")) not in RESULT_STATUSES})
    if bad:
        raise WaterfallError(f"results file {results} has status value(s) {bad}; use found, not_found or error")
    ts = now_iso()
    records = []
    for row in rows:
        detail = parse_detail(row.get("detail"))
        detail["returned_count"] = int(parse_number(row.get("returned_count"), 0))
        records.append({
            "ts": ts, "layer": "people", "provider": provider,
            "company_domain": norm_domain(row.get("company_domain")), "person_id": "",
            "result": norm_token(row.get("status")), "value": "", "email": "",
            "cost_usd": parse_cost(row.get("cost_usd"), str(results)), "detail": detail,
        })
    return records


def record_verify(provider: str, queue_rows: list[dict[str, str]], header: list[str],
                  rows: list[dict[str, str]], queue: Path, results: Path,
                  transient_raw: frozenset[str] = DEFAULT_TRANSIENT_RAW) -> list[dict[str, Any]]:
    require_columns(header, ["email", "email_status", VERIFY_RAW_COLUMN], results)
    queued = {norm_email(row.get("email")) for row in queue_rows}
    queued.discard("")
    reject_offenders([str(row.get("email") or "").strip() or "(blank)" for row in rows
                      if norm_email(row.get("email")) not in queued], queue, results, "email")
    records = []
    ts = now_iso()
    bad_gates = []
    for row in rows:
        raw_status = str(row.get(VERIFY_RAW_COLUMN) or "").strip().lower()
        gate = str(row.get("email_status") or "").strip().lower()
        if raw_status == NOT_VERIFIED_RAW:
            # The verifier stopped before checking this email (for example, out of credits). Recorded for the
            # history only: it is not a verdict and uses no transient retry, so the email stays pending.
            result = NOT_VERIFIED_RAW
        elif raw_status in transient_raw or gate == TRANSIENT_GATE:
            # Decided from the raw status (the configured transient set) or an explicit transient gate, never
            # from a final-looking gate: a verifier CLI may write gate unknown on a timeout.
            result = "transient"
        elif gate in GATES:
            result = gate
        else:
            bad_gates.append(gate or "(blank)")
            continue
        catch_all_text = str(row.get("is_catch_all") or "").strip()
        detail = {
            "raw_status": raw_status,
            "is_catch_all": truthy(catch_all_text) if catch_all_text else None,
            "cache_hit": truthy(row.get("cache_hit")),
            "verified_at": str(row.get("verified_at") or "").strip(),
        }
        records.append({
            "ts": ts, "layer": "verify", "provider": provider, "company_domain": "", "person_id": "",
            "result": result, "value": str(row.get("email") or "").strip(), "email": norm_email(row.get("email")),
            "cost_usd": parse_cost(row.get("cost_usd"), str(results)), "detail": detail,
        })
    if bad_gates:
        raise WaterfallError(
            f"results file {results} has email_status value(s) {sorted(set(bad_gates))} that are not a gate; "
            "nothing was recorded"
        )
    return records


def record_routing(args: argparse.Namespace) -> dict[str, Any]:
    """The routing file for record: --routing, else the file the last plan used (from _waterfall/status.json)."""
    if args.routing:
        return load_routing(args.routing)
    status_path = work_dir(args.dir) / "status.json"
    recorded = ""
    if status_path.exists():
        try:
            recorded = str(json.loads(status_path.read_text(encoding="utf-8")).get("routing_path") or "")
        except (json.JSONDecodeError, AttributeError):
            recorded = ""
    if not recorded:
        raise WaterfallError("record --layer verify needs the routing file: pass --routing (no plan has recorded one "
                             f"in {status_path}). Nothing was recorded.")
    return load_routing(Path(recorded))


def cmd_record(args: argparse.Namespace) -> int:
    layer = args.layer
    provider = (args.provider or "").strip()
    extra: dict[str, Any] = {}
    if layer == "verify":
        routing = record_routing(args)
        verifier = verifier_key(routing)
        provider = provider or verifier
        if provider != verifier:
            raise WaterfallError(
                f"the verify layer records the email verifier of record only: {provider_name(routing, verifier)} "
                f"(--provider {verifier}, from layers.verification.provider). Nothing was recorded."
            )
        extra["transient_raw"] = transient_raw_statuses(routing)
        queue = work_dir(args.dir) / "queue-verify.csv"
    else:
        if not provider:
            raise WaterfallError("--provider is required")
        queue = work_dir(args.dir) / f"queue-{layer}-{provider}.csv"
    if not queue.exists():
        raise WaterfallError(f"no current queue file {queue}; run plan first. Nothing was recorded.")
    results = Path(args.results)
    if not results.exists():
        raise WaterfallError(f"missing results file: {results}")
    _, queue_rows = read_csv(queue)
    header, rows = read_csv(results)
    builder = {"email": record_email, "phone": record_phone, "people": record_people, "verify": record_verify}[layer]
    records = builder(provider, queue_rows, header, rows, queue, results, **extra)
    # One append at the end, after every check passed: a rejected file leaves the ledger untouched.
    append_jsonl(ledger_path(args.dir), records)
    tally = Counter(record["result"] for record in records)
    print(f"recorded {plural(len(records), 'line')} for {layer}/{provider}: {counts_text(tally)}.")
    mismatches = sum(1 for record in records if (record.get("detail") or {}).get("domain_mismatch"))
    if mismatches:
        print(f"flagged {plural(mismatches, 'email')} whose domain is not the person's company (domain_mismatch).")
    return 0


# ---------------------------------------------------------------------------
# status
# ---------------------------------------------------------------------------
def load_state(args: argparse.Namespace, enforce_spec: bool) -> tuple[dict, dict, list, list, dict, Engine]:
    spec = load_spec(args.spec, getattr(args, "allow_draft", False), enforce=enforce_spec)
    routing = load_routing(args.routing)
    header, persons, stats = load_contacts(args.contacts)
    ledger = Ledger(read_jsonl(ledger_path(args.dir)))
    engine = Engine(persons, spec, routing, ledger,
                    getattr(args, "reservoir", None), getattr(args, "reservoir_max_age_days", reservoir.DEFAULT_MAX_AGE_DAYS))
    return spec, routing, header, persons, stats, engine


def email_pending_counts(engine: Engine) -> Counter:
    pending: Counter[str] = Counter()
    for p in engine.eligible_persons():
        if p["role"] != "active":
            continue
        if p["ev"]["state"] == "VERIFY_PENDING":
            pending["verify"] += 1
        elif p["ev"]["state"] == "EMAIL_PENDING":
            pending[p["ev"]["next"]] += 1
    return pending


def cmd_status(args: argparse.Namespace) -> int:
    spec, routing, _, _, stats, engine = load_state(args, enforce_spec=False)
    eligible = engine.eligible_persons()
    lines = []
    if str(spec.get("status") or "").lower() != "locked":
        lines.append(f"note: the targeting spec is status={spec.get('status')!r}, not locked.")
    lines.append(f"accounts ({len(engine.accounts)}): {counts_text(Counter(a['state'] for a in engine.accounts))}")
    lines.append(f"persons ({len(eligible)} eligible, {sum(stats['ineligible'].values())} not eligible): "
                 f"{counts_text(Counter(person_state(p) for p in eligible))}")
    lines.append(f"pending email work (persons per provider; verify counts persons): "
                 f"{counts_text(email_pending_counts(engine))}")
    if engine.phone_required:
        phones = Counter(engine.evaluate_phone(p)["label"] for p in engine.wave_persons())
        lines.append(f"phones for the wave: {counts_text(phones)}")
    lines.extend(run_skip_lines(engine.ledger, "email", engine.order))
    print("\n".join(lines))
    return 0


# ---------------------------------------------------------------------------
# finalize
# ---------------------------------------------------------------------------
def reservoir_writeback_candidates(engine: Engine) -> list[dict[str, Any]]:
    """Aaron flow (see aaron-flow.md section 7). Every distinct candidate email an aiark or prospeo rung found
    for a person, with a real verifier gate, written back so a later list never re-pays that finder for
    the same person. row_existing and reservoir-sourced candidates are excluded by reservoir.ALLOWED_SOURCES
    (they may be client-supplied or already came from the reservoir itself)."""
    rows: list[dict[str, Any]] = []
    for p in engine.eligible_persons():
        row = p["row"]
        for cand in p["ev"]["cands"]:
            if cand["source"] not in reservoir.ALLOWED_SOURCES or cand["verdict"] not in GATES:
                continue
            rows.append({
                "first_name": field_value(row, "first_name"),
                "last_name": field_value(row, "last_name"),
                "linkedin_url": field_value(row, "linkedin_url"),
                "job_title": field_value(row, "job_title"),
                "company_name": field_value(row, "company_name"),
                "company_domain": p["company"],
                "email": cand["email"],
                "verdict": cand["verdict"],
                "verified_at": verified_at(cand),
                "source": cand["source"],
            })
    return rows


def build_outputs(engine: Engine, header: list[str], phone_ran: bool) -> dict[str, list[dict[str, Any]]]:
    verified, holdback, review, stagger, attempts, accounts = [], [], [], [], [], []
    for account in engine.accounts:
        eligible = account["persons"]
        accounts.append({
            "company_domain": account["company"], "required": engine.required_label, "ready": account["ready"],
            "state": account["state"], "persons_tried": account["tried"], "promotions": account["promotions"],
        })
        for p in eligible:
            ev, row, role = p["ev"], p["row"], p["role"]
            path = attempt_path(ev)
            state = person_state(p)
            skipped = [f"{provider}(missing {', '.join(fields)})" for provider, fields in missing_skips(engine, p)]
            skipped += [f"{provider}(skipped for the run)" for provider in run_skip_passes(engine, p)]
            skipped += [f"{provider}(needs {' and '.join(unmet)} attempted first)"
                        for provider, unmet in prereq_holds(engine, p)]
            attempts.append({
                "company_domain": p["company"], "person_id": p["pid"],
                "first_name": field_value(row, "first_name"), "last_name": field_value(row, "last_name"),
                "job_title": field_value(row, "job_title"), "tier": p["tier"], "priority_order": p["priority_order"],
                "state": state, "wave_slot": p["wave_slot"], "rungs": path, "skipped_rungs": "; ".join(skipped),
                "candidates": candidates_text(ev),
            })
            original = str(row.get("email") or "").strip()
            if role == "ready":
                chosen = ev["chosen"]
                out = dict(row)
                out.update({
                    "email": chosen["email"],
                    "email_original": original if original and norm_email(original) != chosen["email"] else "",
                    "email_status": "valid", "is_catch_all": "false", "email_source": chosen["source"],
                    "email_verified_at": verified_at(chosen), "verification_provider": engine.verifier_name,
                    "person_id": p["pid"], "wave_slot": p["wave_slot"], "wave_slot_reason": p["wave_slot_reason"],
                    "email_attempt_path": path, "email_candidates": len(ev["cands"]),
                })
                if phone_ran:
                    phone = engine.evaluate_phone(p)
                    out["phone"] = phone["phone"] or str(row.get("phone") or "")
                    out["phone_source"] = phone["source"]
                    out["phone_status"] = {"PHONE_FOUND": "found", "PHONE_MISSING": "missing"}.get(
                        phone["state"], "pending")
                verified.append(out)
            elif role == "finished" and ev["final"] == "EMAIL_CATCH_ALL":
                best = ev["best"]
                out = dict(row)
                out.update({
                    "email": best["email"],
                    "email_original": original if original and norm_email(original) != best["email"] else "",
                    "email_status": "catch_all", "is_catch_all": "true", "email_source": best["source"],
                    "email_verified_at": verified_at(best), "verification_provider": engine.verifier_name,
                    "person_id": p["pid"], "holdback_reason": "catch_all_unresolved", "wave_slot": p["wave_slot"],
                    "email_attempt_path": path, "email_candidates": len(ev["cands"]),
                })
                holdback.append(out)
            elif role == "finished":
                best = ev["best"]
                out = dict(row)
                out.update({
                    "person_id": p["pid"], "review_reason": REVIEW_REASON.get(ev["final"], "invalid"),
                    "review_email": best["email"] if best else "",
                    "review_email_status": verdict_label(best) if best else "",
                    "email_source": best["source"] if best else "", "final_state": ev["final"],
                    "email_attempt_path": path, "email_candidates": len(ev["cands"]),
                    "review_detail": f"{ev['exhaust_reason']}; {plural(ev['rungs_used'], 'rung')} used",
                })
                review.append(out)
            else:
                if role == "waiting":
                    reason = "waiting: higher-priority persons at this account are still being worked"
                elif role == "not_needed":
                    reason = f"not_needed: the account already has {engine.required} ready contacts"
                elif role == "ready_over_cap":
                    reason = f"ready_over_account_cap: the account already has {engine.required} ready contacts"
                else:
                    reason = f"pending: waterfall work not finished at finalize ({state})"
                out = dict(row)
                out.update({
                    "person_id": p["pid"], "state": state, "stagger_reason": reason,
                    "ready_email": ev["chosen"]["email"] if role == "ready_over_cap" and ev["chosen"] else "",
                })
                stagger.append(out)
    return {
        "verified": verified, "holdback": holdback, "review": review, "stagger": stagger,
        "attempts": attempts, "accounts": accounts,
    }


def build_report(engine: Engine, spec: dict[str, Any], routing: dict[str, Any], stats: dict[str, Any],
                 outputs: dict[str, list[dict[str, Any]]], phone_ran: bool) -> str:
    eligible = engine.eligible_persons()
    ledger = engine.ledger
    buyers = spec_buyers(spec)
    account_states = Counter(account["state"] for account in engine.accounts)
    finals = Counter(p["ev"]["final"] for p in eligible if p["role"] == "finished")
    roles = Counter(p["role"] for p in eligible)
    tried = [p for p in eligible if Engine.tried(p)]
    lines: list[str] = [
        "# Email Waterfall Report",
        "",
        "What this is: the result of the email waterfall for this campaign. People were worked one at a time in "
        f"buyer-priority order. Every email any tool found was checked by {engine.verifier_name} (the email verifier) "
        "before the next tool was tried, and an account stopped being worked once it had enough ready contacts. Use it to "
        "see what is ready to send, what is held back, what needs a human look, and how each tool performed.",
        "",
        f"Generated {now_iso()}. Routing `{routing.get('routing_version')}` ({routing.get('status')}). "
        f"Targeting spec `{spec.get('spec_version')}` ({spec.get('status')}).",
        "",
        "## Inputs",
        "",
        f"- Contacts file: `{stats['path']}` with {plural(stats['rows'], 'row')}; "
        f"{plural(stats['duplicates'], 'duplicate person row')} ignored.",
        f"- Eligible persons: {len(eligible)} across {plural(len(engine.accounts), 'account')}. "
        f"Not eligible: {sum(stats['ineligible'].values())}"
        + (f" ({counts_text(stats['ineligible'])})." if stats["ineligible"] else "."),
        f"- Ready contacts needed per account: {engine.required_label}. Work email required: "
        f"{'yes' if engine.work_required else 'no'}. Personal email policy: {engine.policy}.",
        "- Most tools a person may use, by buyer tier: "
        + ", ".join(f"{tier} {engine.caps[tier]}" for tier in TIERS)
        + f" (blank tier {engine.blank_cap}).",
        f"- Email tool order: {' > '.join(engine.order)}."
        + "".join(f" {provider} runs only after {' and '.join(requires_attempted(engine.email_cfg, provider))} "
                  "has been attempted for that person (unless switched off for the run)."
                  for provider in engine.order if requires_attempted(engine.email_cfg, provider)),
        f"- Catch-all policy: {engine.on_catch_all}. "
        + ("A catch_all verdict ends that person's waterfall; the address goes to the holdback and no later tool "
           "runs for them." if engine.on_catch_all == "stop" else
           "A catch_all verdict is kept as the person's fallback and the next tool still runs."),
        f"- Email verifier: {engine.verifier_name}. A transient verification result (raw status "
        f"{', '.join(repr(value) for value in sorted(engine.transient_raw))}, or a transient gate) is retried "
        f"{plural(engine.retry_transient, 'time')}, then treated as unknown.",
        "",
        "## Accounts",
        "",
        "| Result | Accounts | What it means |",
        "|---|---:|---|",
    ]
    for state in ("ACCOUNT_SATISFIED", "ACCOUNT_ALL_WORKED", "ACCOUNT_PARTIAL", "ACCOUNT_NO_READY_CONTACT",
                  "ACCOUNT_IN_PROGRESS", "ACCOUNT_NO_ELIGIBLE_PERSON"):
        lines.append(f"| {state} | {account_states.get(state, 0)} | {ACCOUNT_MEANING[state]} |")
    pending_people = sum(1 for p in eligible if p["role"] == "active")
    lines += [
        "",
        "## People",
        "",
        "| Outcome | Persons | File |",
        "|---|---:|---|",
        f"| Ready to send ({engine.verifier_name} `valid`) | {len(outputs['verified'])} | leads.verified.csv |",
        f"| Catch-all held back (a domain that accepts any address, so a pass does not prove the person exists) "
        f"| {finals.get('EMAIL_CATCH_ALL', 0)} | leads.catchall-holdback.csv |",
        f"| Invalid (emails found, none usable) | {finals.get('EMAIL_INVALID', 0)} | leads.review.csv |",
        f"| No email found by any tool | {finals.get('EMAIL_MISSING', 0)} | leads.review.csv |",
        f"| Email at a different company domain | {finals.get('EMAIL_DOMAIN_MISMATCH', 0)} | leads.review.csv |",
        f"| Personal email only (review) | {finals.get('READY_REVIEW', 0)} | leads.review.csv |",
        f"| Ready but over the per-account cap | {roles.get('ready_over_cap', 0)} | leads.stagger.csv |",
        f"| Waiting (not tried yet, kept for later) | {roles.get('waiting', 0)} | leads.stagger.csv |",
        f"| Not needed (account already full, kept for a later wave) | {roles.get('not_needed', 0)} "
        f"| leads.stagger.csv |",
        f"| Still pending (finalized early) | {pending_people} | leads.stagger.csv |",
        "",
        "Invalid and missing are kept apart on purpose: a failed email is not a failed person, and \"no email "
        "found\" is not the same as \"email found but bad\".",
        "",
        "## Fallback promotions",
        "",
    ]
    promoted = [p for p in eligible if p["wave_slot"] == "promoted_fallback"]
    if engine.required is None:
        lines.append("No contacts cap (ruling no-contacts-cap): every eligible person at every account is worked, "
                     "so there is no fallback promotion to report.")
    else:
        lines.append(f"{plural(len(promoted), 'person')} outside an account's top {engine.required_label} were "
                     "worked because someone above them was exhausted.")
    for p in promoted[:25]:
        lines.append(f"- {p['pid']} ({p['company']}, {person_state(p)}): {p['wave_slot_reason']}")
    if len(promoted) > 25:
        lines.append(f"- ... and {len(promoted) - 25} more (see _waterfall/person-attempts.csv).")

    # Verification
    verify_lines = [line for line in ledger.lines if line.get("layer") == "verify"]
    final_by_email: dict[str, str] = {}
    for line in verify_lines:
        if line.get("result") in GATES:
            final_by_email[norm_email(line.get("email") or line.get("value"))] = str(line["result"])
    cache_hits = sum(1 for line in verify_lines if (line.get("detail") or {}).get("cache_hit") is True)
    transient = sum(1 for line in verify_lines if line.get("result") == "transient")
    not_verified = sum(1 for line in verify_lines if line.get("result") == NOT_VERIFIED_RAW)
    occurrences = 0
    unique_seen: set[str] = set()
    personal_rejected = 0
    transient_exhausted = set()
    for p in eligible:
        for cand in p["ev"]["cands"]:
            if cand["verdict"] == "personal_rejected":
                personal_rejected += 1
                continue
            if cand["verdict"] in GATES:
                occurrences += len(cand["providers"])
                unique_seen.add(cand["email"])
            if cand.get("transient_exhausted"):
                transient_exhausted.add(cand["email"])
    verify_cost = sum(float(line.get("cost_usd") or 0) for line in verify_lines)
    lines += [
        "",
        f"## Verification ({engine.verifier_name})",
        "",
        f"- Unique emails verified: {len(final_by_email)} "
        f"({counts_text(Counter(final_by_email.values()))}).",
        f"- Verification results recorded: {len(verify_lines)}; cache hits: {cache_hits}; transient results: "
        f"{transient} ({plural(len(transient_exhausted), 'email')} ran out of retries and count as unknown).",
        f"- Emails the verifier stopped before checking (not_verified, left pending, no retry used): {not_verified}",
        f"- Verifications avoided (duplicate emails whose verdict was reused): {max(0, occurrences - len(unique_seen))}",
        f"- Personal emails rejected without a verification call (policy fail): {personal_rejected}",
        f"- Verification cost recorded: {money(verify_cost)}",
        "",
        "## Provider performance (email)",
        "",
        "Found % is persons with an email returned over persons attempted. New valid counts persons whose first "
        "valid email came from that tool (its incremental coverage). Cumulative ready % is new valid so far over "
        f"the {plural(len(tried), 'person')} the waterfall worked.",
        "",
        "| Tool | Persons attempted | Emails found | Found % | Valid | Catch-all | Invalid, risky or unknown "
        "| Other (personal, other domain, shared, unverified) | New valid | Cumulative ready % | Cost | "
        "Cost per new valid |",
        "|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|",
    ]
    table_order = [ROW_EXISTING] + engine.order
    pstats = {name: {"attempted": set(), "found": set(), "valid": 0, "catch_all": 0, "bad": 0, "other": 0,
                     "new_valid": 0} for name in table_order}

    def bucket(stat: dict[str, Any], cand: dict[str, Any] | None) -> None:
        if cand is None:
            stat["other"] += 1
        elif cand["verdict"] in BAD_GATES:
            stat["bad"] += 1
        elif cand["kind"] == "work" and cand["verdict"] == "valid":
            stat["valid"] += 1
        elif cand["kind"] == "work" and cand["verdict"] == "catch_all":
            stat["catch_all"] += 1
        else:
            stat["other"] += 1

    for p in eligible:
        ev = p["ev"]
        by_email = {cand["email"]: cand for cand in ev["cands"]}
        row_cand = first(c for c in ev["cands"] if c["source"] == ROW_EXISTING)
        if row_cand:
            stat = pstats[ROW_EXISTING]
            stat["attempted"].add(p["pid"])
            stat["found"].add(p["pid"])
            bucket(stat, row_cand)
        pairs: set[tuple[str, str]] = set()
        for line in ev["attempts"]:
            provider = str(line.get("provider") or "")
            stat = pstats.setdefault(provider, {"attempted": set(), "found": set(), "valid": 0, "catch_all": 0,
                                                "bad": 0, "other": 0, "new_valid": 0})
            if provider not in table_order:
                table_order.append(provider)
            stat["attempted"].add(p["pid"])
            if line.get("result") != "found":
                continue
            email = norm_email(line.get("value") or line.get("email"))
            if not email or (provider, email) in pairs:
                continue
            pairs.add((provider, email))
            stat["found"].add(p["pid"])
            bucket(stat, by_email.get(email))
        if ev["state"] == "READY" and ev["chosen"]:
            source = ev["chosen"]["source"]
            pstats.setdefault(source, {"attempted": set(), "found": set(), "valid": 0, "catch_all": 0, "bad": 0,
                                       "other": 0, "new_valid": 0})["new_valid"] += 1
    costs: Counter[str] = Counter()
    errors: Counter[tuple[str, str]] = Counter()
    for line in ledger.lines:
        if line.get("result") in CONTROL_RESULTS:
            continue
        if line.get("layer") == "email":
            costs[str(line.get("provider") or "")] += float(line.get("cost_usd") or 0)
        if line.get("result") == "error":
            errors[(str(line.get("layer")), str(line.get("provider")))] += 1
    cumulative = 0
    for name in table_order:
        stat = pstats[name]
        cumulative += stat["new_valid"]
        cost = costs.get(name, 0.0)
        label = f"{name} (already on the row, verified first)" if name == ROW_EXISTING else name
        per_valid = f"${cost / stat['new_valid']:.4f}" if stat["new_valid"] else "n/a"
        lines.append(
            f"| {label} | {len(stat['attempted'])} | {len(stat['found'])} | "
            f"{pct(len(stat['found']), len(stat['attempted']))} | {stat['valid']} | {stat['catch_all']} | "
            f"{stat['bad']} | {stat['other']} | {stat['new_valid']} | {pct(cumulative, len(tried))} | "
            f"{money(cost)} | {per_valid} |"
        )

    # Skips
    lines += ["", "## Skipped rungs", ""]
    if ledger.control_history:
        lines.append("Run-scope skips (a tool switched off for the whole run, for example a connector outage):")
        seen_keys = []
        for line in ledger.control_history:
            key = (str(line.get("layer")), str(line.get("provider")))
            if key not in seen_keys:
                seen_keys.append(key)
        for layer, provider in seen_keys:
            history = [line for line in ledger.control_history
                       if line.get("layer") == layer and line.get("provider") == provider]
            latest = history[-1]
            reason = (latest.get("detail") or {}).get("reason") or "no reason given"
            skip_reasons = [str((line.get("detail") or {}).get("reason") or "no reason given")
                            + (" (operator approved)" if (line.get("detail") or {}).get("operator_approved") else "")
                            for line in history if line.get("result") == "skipped"]
            now = "still skipped" if latest.get("result") == "skipped" else "back on"
            routed = ""
            if layer == "email":
                count = sum(1 for p in eligible if provider in run_skip_passes(engine, p))
                routed = f" {plural(count, 'person')} were routed past it to the next tool."
            lines.append(f"- {layer} {provider}: {now} (latest change {latest.get('ts')}: {reason}). "
                         f"Skip reason: {'; '.join(skip_reasons) or reason}.{routed}")
    else:
        lines.append("Run-scope skips: none.")
    lines.append("")
    lines.append("Skipped for missing input (the row lacks what that tool needs, so it was passed over):")
    missing_counts: Counter[str] = Counter()
    missing_fields: dict[str, set[str]] = defaultdict(set)
    for p in eligible:
        if p["role"] not in ("ready", "ready_over_cap", "active", "finished"):
            continue
        for provider, fields in missing_skips(engine, p):
            missing_counts[provider] += 1
            missing_fields[provider].update(fields)
    if missing_counts:
        for provider in engine.order:
            if missing_counts.get(provider):
                lines.append(f"- {provider}: {plural(missing_counts[provider], 'person')} skipped "
                             f"(missing input: {', '.join(sorted(missing_fields[provider]))})")
    else:
        lines.append("- none")
    lines.append("")
    lines.append("Held back by requires_attempted (a tool that may only run after another has been tried for that "
                 "person, and that one had not been):")
    held_counts: Counter[str] = Counter()
    held_by: dict[str, set[str]] = defaultdict(set)
    for p in eligible:
        if p["role"] not in ("ready", "ready_over_cap", "active", "finished"):
            continue
        for provider, unmet in prereq_holds(engine, p):
            held_counts[provider] += 1
            held_by[provider].update(unmet)
    if held_counts:
        for provider in engine.order:
            if held_counts.get(provider):
                lines.append(f"- {provider}: {plural(held_counts[provider], 'person')} not sent to it "
                             f"(needs {', '.join(sorted(held_by[provider]))} attempted first)")
    else:
        lines.append("- none")

    # Errors
    lines += ["", "## Errors", ""]
    if errors:
        for (layer, provider), count in sorted(errors.items()):
            lines.append(f"- {layer} {provider}: {plural(count, 'error')} recorded.")
        lines.append(f"- An error is retried {plural(engine.retry, 'time')} per person before that tool counts as "
                     "tried.")
    else:
        lines.append("- none")

    # Domain mismatch
    flagged = [line for line in ledger.lines if line.get("layer") == "email"
               and (line.get("detail") or {}).get("domain_mismatch")]
    lines += ["", "## Domain mismatch flags", ""]
    if flagged:
        lines.append(f"{plural(len(flagged), 'email')} came back at a domain that is not the person's company. They "
                     "never fill a slot, and a verified one goes to review. A cluster from one tool can mean that "
                     "tool returned another company's rows.")
        for line in flagged[:20]:
            lines.append(f"- {line.get('person_id')} ({line.get('company_domain')}): {line.get('email')} "
                         f"from {line.get('provider')}")
    else:
        lines.append("- none")

    if phone_ran:
        phones = [engine.evaluate_phone(p) for p in engine.wave_persons()]
        phone_states = Counter(phone["state"] for phone in phones)
        sources = Counter(phone["source"] for phone in phones if phone["state"] == "PHONE_FOUND")
        lines += [
            "",
            "## Phone",
            "",
            f"- Ready persons in the wave: {len(phones)}. Phone found: {phone_states.get('PHONE_FOUND', 0)} "
            f"({counts_text(sources)}); missing: {phone_states.get('PHONE_MISSING', 0)}; pending: "
            f"{phone_states.get('PHONE_PENDING', 0)}.",
            f"- Phone tool order: {' > '.join(layer_order(engine.phone_cfg))}. The routing file sets no phone "
            f"retry, so an error is retried {plural(engine.phone_retry, 'time')} (the email layer's value).",
        ]
    lines += [
        "",
        "## Next step",
        "",
        "Run `/list-quality-scorecard` on `leads.verified.csv` before copy or upload. Catch-alls come back later "
        "through `/cold-email-weekly-rhythm` once the sending domains have matured.",
        "",
        "Paid calls made by this script: 0. It only plans and records.",
        "",
    ]
    return "\n".join(lines)


def cmd_finalize(args: argparse.Namespace) -> int:
    spec, routing, header, _, stats, engine = load_state(args, enforce_spec=False)
    eligible = engine.eligible_persons()
    phone_ran = engine.phone_required or bool(engine.ledger.attempts["phone"])
    pending = {p["pid"] for p in eligible if p["role"] == "active"}
    if engine.phone_required:
        pending |= {p["pid"] for p in engine.wave_persons() if engine.evaluate_phone(p)["state"] == "PHONE_PENDING"}
    if pending and not args.allow_pending:
        print(f"{len(pending)} persons still have waterfall work; run plan and work the queues, or pass "
              "--allow-pending to finalize anyway.", file=sys.stderr)
        return 3
    outputs = build_outputs(engine, header, phone_ran)
    campaign = Path(args.dir)
    work = work_dir(args.dir)
    verified_extra = VERIFIED_COLUMNS + (PHONE_OUTPUT_COLUMNS if phone_ran else [])
    counts = {
        "leads.verified.csv": write_csv(campaign / "leads.verified.csv",
                                        merged_header(header, verified_extra), outputs["verified"]),
        "leads.catchall-holdback.csv": write_csv(campaign / "leads.catchall-holdback.csv",
                                                 merged_header(header, HOLDBACK_COLUMNS), outputs["holdback"]),
        "leads.review.csv": write_csv(campaign / "leads.review.csv",
                                      merged_header(header, REVIEW_COLUMNS), outputs["review"]),
        "leads.stagger.csv": write_csv(campaign / "leads.stagger.csv",
                                       merged_header(header, STAGGER_COLUMNS), outputs["stagger"]),
        "_waterfall/person-attempts.csv": write_csv(work / "person-attempts.csv", ATTEMPT_COLUMNS,
                                                    outputs["attempts"]),
        "_waterfall/account-status.csv": write_csv(work / "account-status.csv", ACCOUNT_COLUMNS,
                                                   outputs["accounts"]),
    }
    report = build_report(engine, spec, routing, stats, outputs, phone_ran)
    (campaign / "email-waterfall-report.md").write_text(report, encoding="utf-8")
    placed = sum(counts[name] for name in ("leads.verified.csv", "leads.catchall-holdback.csv",
                                           "leads.review.csv", "leads.stagger.csv"))
    if placed != len(eligible):
        raise WaterfallError(f"internal check failed: {placed} rows written for {len(eligible)} eligible persons")
    reservoir_tally = None
    if args.reservoir:
        # Aaron flow (see aaron-flow.md section 7). Every distinct aiark/prospeo candidate this run verified
        # goes back into the reservoir, so the next list for this or another client never re-pays a finder for
        # the same person. Reuses the store Engine.__init__ already loaded, so this is the only read of it.
        reservoir_rows = reservoir_writeback_candidates(engine)
        reservoir_tally = reservoir.writeback_rows(reservoir_rows, engine.reservoir_store, engine.reservoir_today)
        reservoir.save_store(args.reservoir, engine.reservoir_store)
    lines = []
    if str(spec.get("status") or "").lower() != "locked":
        lines.append(f"note: the targeting spec is status={spec.get('status')!r}, not locked.")
    if pending:
        lines.append(f"finalized with {plural(len(pending), 'person')} still pending (--allow-pending); they are in "
                     "leads.stagger.csv.")
    lines += [f"{name}: {plural(count, 'row')}" for name, count in counts.items()]
    if reservoir_tally is not None:
        saved = sum(v for k, v in reservoir_tally.items() if k not in
                    ("refused_source_not_an_fnnl_finder", "skipped_no_email", "skipped_no_verdict"))
        lines.append(f"reservoir updated: {plural(saved, 'record')} written to {args.reservoir}.")
    lines.append("email-waterfall-report.md written. Next: /list-quality-scorecard.")
    print("\n".join(lines))
    return 0


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Plan and record the email, phone and people waterfall (no network calls).",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    sub = parser.add_subparsers(dest="command", required=True)

    def state_args(p: argparse.ArgumentParser) -> None:
        p.add_argument("--dir", required=True, type=Path, help="the campaign folder; work files go in <dir>/_waterfall")
        p.add_argument("--contacts", required=True, type=Path, help="contacts.scored.csv (optionally title-classified)")
        p.add_argument("--spec", required=True, type=Path, help="targeting-spec.yaml")
        p.add_argument("--routing", required=True, type=Path, help="provider-routing.yaml")
        p.add_argument("--allow-draft", action="store_true", help="accept a targeting spec that is not locked")
        # Aaron flow (see aaron-flow.md section 7). Optional and off by default: no --reservoir means the
        # waterfall behaves exactly as it did before the reservoir existed.
        p.add_argument("--reservoir", type=Path, default=None,
                       help="lead reservoir store (rung 0 of the email waterfall); omit to run without one")
        p.add_argument("--reservoir-max-age-days", type=int, default=reservoir.DEFAULT_MAX_AGE_DAYS,
                       help=f"reservoir freshness window in days (default {reservoir.DEFAULT_MAX_AGE_DAYS})")

    plan = sub.add_parser("plan", help="write the next queue per provider")
    state_args(plan)
    plan.add_argument("--layer", choices=["email", "phone", "people"], default="email")
    plan.add_argument("--companies", type=Path, help="company CSV (people layer)")
    plan.add_argument("--skip-provider", action="append", help="skip this provider for the rest of the run")
    plan.add_argument("--skip-reason", help="why the provider is skipped (required with --skip-provider)")
    plan.add_argument("--unskip-provider", action="append", help="turn a skipped provider back on")
    plan.add_argument("--operator-approved-skip", action="store_true",
                      help="required with --skip-provider: the operator said in chat to go on without that provider "
                           "(out of balance or down is otherwise a stop, /tool-balance-guard)")

    record = sub.add_parser("record", help="append provider or email verifier results to the ledger")
    record.add_argument("--dir", required=True, type=Path)
    record.add_argument("--layer", required=True, choices=["email", "phone", "people", "verify"])
    record.add_argument("--provider", help="provider key; for the verify layer it defaults to (and must equal) "
                        "layers.verification.provider")
    record.add_argument("--results", required=True, type=Path)
    record.add_argument("--routing", type=Path,
                        help="provider-routing.yaml (verify layer; defaults to the file the last plan used)")

    status = sub.add_parser("status", help="print the current state summary")
    state_args(status)

    finalize = sub.add_parser("finalize", help="write the send, holdback, review and stagger files and the report")
    state_args(finalize)
    finalize.add_argument("--allow-pending", action="store_true",
                          help="finalize even though some persons still have waterfall work")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(sys.argv[1:] if argv is None else argv)
    handlers = {"plan": cmd_plan, "record": cmd_record, "status": cmd_status, "finalize": cmd_finalize}
    try:
        return handlers[args.command](args)
    except WaterfallError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
