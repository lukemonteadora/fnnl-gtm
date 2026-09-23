#!/usr/bin/env python3
"""Final list QA gate for list production (the list-quality-scorecard, in code).

Reads a campaign's verified send file (leads.verified.csv, written by
list_waterfall.py) and the client's targeting spec, then:

  1. blocks the whole list on a systemic upstream failure (a row the email
     verifier has not passed, a banned contact-discovery source, scoring
     leakage) and exits 3 without touching leads.verified.csv;
  2. normalizes every row (raw values kept, *_norm companions added) and joins
     missing headcount, country and industry from the company file;
  3. gates every row on six dimensions (ICP fit, title, seniority, company
     match, contact quality, suppression), each PASS / WARN / REVIEW / FAIL;
  4. de-duplicates (email, LinkedIn slug, name plus company domain);
  5. moves account-density overflow to the stagger queue (never deleted);
  6. rewrites leads.verified.csv with campaign-ready rows only and routes the
     rest to leads.rejected.csv, leads.review.csv, leads.catchall-holdback.csv
     and leads.stagger.csv (leads.verified.pre-scorecard.csv keeps the input);
  7. measures distributions and anomalies against the spec's expectations and
     attributes each anomaly to the email source and source arm behind it;
  8. grades the campaign-ready remainder on the nine scorecard dimensions;
  9. draws a stratified manual QA sample (qa-sample.csv) for an independent
     reviewer, scored later with the score-sample command.

No network calls, no spend. The report is list-qa-report.md in --dir.

Tools are named by role, never by brand: "the email verifier" is the tool in
the email-verifier slot of stack-contract.yaml (lead_data.email_verification),
and "the sending platform" is the locked run_state.sending_platform. The
provider order for each layer lives in the stack contract
(lead_data.contact_enrichment.notes) and its machine-readable mirror,
outbound/reference/provider-routing.yaml; this script reads neither.

--active-leads takes the sending platform's lead export (every lead active in
the client's other campaigns). The email column is found by name and then by
content, so any export with one email column works. The column names of the
current sending platform's export (PlusVibe in the stack contract today) are
UNVERIFIED: no live export has been read yet, because that slot is `chosen`,
not `live`. Check the "Cross-campaign duplicates" line in the report names
the column you expect on the first real run.

Usage:
    python list_qa.py run --dir <campaignDir> --spec <targeting-spec.yaml>
        [--leads <file>] [--companies tam.csv] [--suppression suppression-list.csv]
        [--active-leads F ...] [--signal-copy] [--sample-size N] [--seed 7]
        [--rerun] [--allow-draft]
    python list_qa.py score-sample --dir <campaignDir> --sample <reviewed.csv>

Exit codes: 0 ok (run) or manual QA PASS (score-sample); 2 usage, spec or
idempotency error; 3 systemic block; 4 manual QA FAIL.
"""

from __future__ import annotations

import argparse
import json
import random
import re
import shutil
import sys
import unicodedata
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from list_common import (  # noqa: E402
    CONSUMER_DOMAINS,
    NON_PERSON_NAME_WORDS,
    ROLE_LOCAL_PARTS,
    email_domain,
    email_local,
    headcount_band,
    linkedin_slug,
    merged_header,
    name_key,
    norm_country,
    norm_domain,
    norm_email,
    norm_name,
    now_iso,
    parse_headcount,
    person_id,
    read_csv,
    same_org_domain,
    truthy,
    write_csv,
)
from title_classify import OUT_COLUMNS as TITLE_OUT_COLUMNS  # noqa: E402
from title_classify import Classifier, SpecError, load_spec  # noqa: E402


EXIT_OK = 0
EXIT_ERROR = 2
EXIT_BLOCKED = 3
EXIT_QA_FAIL = 4

LEADS_FILE = "leads.verified.csv"
PRE_FILE = "leads.verified.pre-scorecard.csv"
REJECTED_FILE = "leads.rejected.csv"
REVIEW_FILE = "leads.review.csv"
HOLDBACK_FILE = "leads.catchall-holdback.csv"
STAGGER_FILE = "leads.stagger.csv"
SAMPLE_FILE = "qa-sample.csv"
REPORT_FILE = "list-qa-report.md"

LEVELS = {"PASS": 0, "INFO": 1, "WARN": 2, "REVIEW": 3, "FAIL": 4}
DIMENSIONS = [
    ("qa_icp", "ICP fit"),
    ("qa_title", "Title / function fit"),
    ("qa_seniority", "Seniority / buyer fit"),
    ("qa_company_match", "Company / domain match"),
    ("qa_contact", "Contact quality"),
    ("qa_suppression", "Suppression / risk"),
]
BUYER_TIERS = ["exact", "strong", "influencer", "adjacent", "weak"]
TIER_RANK = {t: i for i, t in enumerate(BUYER_TIERS)}
DEFAULT_BANDS = [[1, 19], [20, 99], [100, 249], [250, 499], [500, 999], [1000, None]]
DEFAULT_EXPECTATIONS: dict[str, Any] = {
    "max_share_out_of_headcount_range": 0.05,
    "max_share_out_of_geography": 0.03,
    "max_share_non_target_function": 0.02,
    "max_share_missing_headcount": 0.25,
    "min_share_exact_or_strong": 0.40,
}
DUPLICATE_SHARE_LIMIT = 0.05

CATCH_ALL_STATUSES = {"catch_all", "catch-all", "catchall", "accept_all"}
SOURCE_COLUMNS = ["source", "source_type", "contact_source", "discovery_source"]
# Discovery sources that carry no current-employer signal or fabricate names. Kept
# specific on purpose: a bare "google" or "pattern" would block legitimate values
# such as google_maps or pattern_verified. Matching is by substring, so "serp"
# also covers any SERP API vendor whose name starts with it.
BANNED_SOURCE_TERMS = ["site:linkedin", "serp", "google_search", "google search", "googlesearch",
                       "websearch_linkedin", "index_mode", "index mode", "index-mode", "pattern_name",
                       "pattern-name", "pattern_email", "pattern-email", "pattern_constructed",
                       "pattern-constructed", "pattern constructed"]

ROW_HEADCOUNT_COLS = ["headcount", "co_headcount", "company_headcount", "employee_count", "headcount_range",
                      "co_headcount_range"]
ROW_COUNTRY_COLS = ["location_country", "co_location_country", "country", "company_country", "co_country",
                    "hq_country"]
ROW_INDUSTRY_COLS = ["industry", "co_industry", "company_industry"]
COMPANY_DOMAIN_COLS = ["company_domain", "domain", "website", "company_website"]
COMPANY_HEADCOUNT_COLS = ROW_HEADCOUNT_COLS + ["employees", "size"]
CURRENT_EMPLOYER_COLS = ["person_company_domain", "current_company_domain"]
TITLE_COLS = ["job_title", "title", "Title", "Job Title", "person_title"]

COMPANION_COLUMNS = [
    "first_name_norm", "last_name_norm", "email_norm", "email_domain", "company_domain_norm", "linkedin_slug",
    "country_norm", "headcount_num", "headcount_band", "headcount_source", "country_source", "industry_norm",
    "industry_source", "person_key",
]
QA_COLUMNS = [d for d, _ in DIMENSIONS] + ["qa_status", "qa_severity", "qa_reasons"]
REVIEWER_COLUMNS = ["correct_company", "correct_title", "current_employee", "verdict_notes"]
SAMPLE_COLUMNS = ["sample_id", "sample_kind", "strata", "first_name", "last_name", "job_title", "title_role_tier",
                  "company_name", "company_domain", "headcount_num", "country_norm", "linkedin_url", "email_domain",
                  "email_source", "qa_reasons"] + REVIEWER_COLUMNS

NAME_TOKEN_STOP = {"inc", "llc", "ltd", "the", "group", "health", "and", "corp", "company"}
COMPANY_SUFFIXES = {"inc", "llc", "ltd", "corp", "co", "gmbh"}
BAD_TITLE_RX = re.compile(r"\b(intern|assistant|coordinator|student|part[\s-]?time|retired|trainee|apprentice)\b",
                          re.IGNORECASE)
# Rejections a reviewer can second-guess. Policy rejections (suppressed, already
# active, duplicate, personal email, excluded account) are never false negatives.
JUDGMENT_PREFIXES = ("title_", "headcount_out_of_range", "out_of_geography", "excluded_industry", "wrong_company",
                     "broken_name")

REMOVAL_CATEGORIES: list[tuple[str, tuple[str, ...]]] = [
    ("Suppressed (suppression list or spec contact exclusions)", ("suppressed", "contact_excluded")),
    ("Broken names", ("broken_name",)),
    ("Wrong company (the provider says the person works elsewhere)", ("wrong_company",)),
    ("Irrelevant titles", ("title_",)),
    ("Out of ICP (size, geography, industry, excluded account)",
     ("headcount_out_of_range", "out_of_geography", "excluded_industry", "excluded_account")),
    ("Not verified (blocked upstream by the systemic check)", ("not_verified",)),
    ("Duplicates", ("duplicate_of",)),
    ("Already active in another campaign", ("already_active",)),
    ("Personal email", ("personal_email",)),
]


class QAError(Exception):
    """A usage, input or configuration problem (exit 2)."""


# ---------------------------------------------------------------------------
# Small helpers
# ---------------------------------------------------------------------------
def clean(value: Any) -> str:
    return "" if value is None else str(value).strip()


def first_value(row: dict[str, Any], cols: list[str]) -> tuple[str, str]:
    for c in cols:
        v = clean(row.get(c))
        if v:
            return v, c
    return "", ""


def fmt_num(x: float | None) -> str:
    if x is None:
        return ""
    return str(int(x)) if float(x).is_integer() else f"{x:g}"


def share(n: int, d: int) -> float:
    return n / d if d else 0.0


def pct(n: int, d: int) -> str:
    return f"{share(n, d):.1%}"


def plural(n: int, one: str, many: str | None = None) -> str:
    return f"{n} {one if n == 1 else (many or one + 's')}"


def ascii_lower(s: str | None) -> str:
    return unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode().lower()


def company_name_key(name: str | None) -> str:
    words = re.findall(r"[a-z0-9]+", ascii_lower(name))
    return "".join(w for w in words if w not in COMPANY_SUFFIXES)


def meaningful_tokens(text: str | None) -> set[str]:
    return {w for w in re.findall(r"[a-z0-9]+", ascii_lower(text)) if len(w) >= 3 and w not in NAME_TOKEN_STOP}


def term_regex(term: str) -> re.Pattern[str] | None:
    words = re.findall(r"[a-z0-9]+", ascii_lower(term))
    if not words:
        return None
    return re.compile(r"\b" + r"[\s\-_.&/]+".join(re.escape(w) for w in words) + r"\b")


def as_float(value: Any) -> float | None:
    try:
        return None if value is None or clean(value) == "" else float(value)
    except (TypeError, ValueError):
        return None


def email_status_class(row: dict[str, Any]) -> str:
    """valid | catch_all | "" (not proven verified by the email verifier)."""
    if not norm_email(row.get("email")):
        return ""
    s = clean(row.get("email_status")).lower()
    if s in CATCH_ALL_STATUSES or (s == "valid" and truthy(row.get("is_catch_all"))):
        return "catch_all"
    return "valid" if s == "valid" else ""


def row_label(row: dict[str, Any]) -> str:
    name = f"{clean(row.get('first_name'))} {clean(row.get('last_name'))}".strip() or "(no name)"
    return f"{name} <{clean(row.get('email')) or 'no email'}> at {clean(row.get('company_domain')) or '(no domain)'}"


def row_id(row: dict[str, Any]) -> str:
    return clean(row.get("person_id")) or clean(row.get("email_norm")) or row_label(row)


def source_arm(row: dict[str, Any]) -> str:
    return clean(row.get("source_arm")) or clean(row.get("source")) or "(blank)"


def email_source(row: dict[str, Any]) -> str:
    return clean(row.get("email_source")) or "(blank)"


class DomainIndex:
    """Domain lookup with same_org_domain semantics (equal, or one a subdomain of the other)."""

    def __init__(self) -> None:
        self.exact: dict[str, str] = {}
        self.parents: dict[str, str] = {}

    def __len__(self) -> int:
        return len(self.exact)

    def add(self, domain: Any, label: str = "") -> None:
        d = norm_domain(clean(domain))
        if not d:
            return
        self.exact.setdefault(d, label)
        parts = d.split(".")
        for i in range(1, len(parts) - 1):
            self.parents.setdefault(".".join(parts[i:]), label)

    def match(self, domain: str) -> str | None:
        d = norm_domain(domain)
        if not d:
            return None
        parts = d.split(".")
        for i in range(0, len(parts) - 1):
            s = ".".join(parts[i:])
            if s in self.exact:
                return self.exact[s]
        return self.parents.get(d)


# ---------------------------------------------------------------------------
# Configuration: spec, suppression, active leads, companies
# ---------------------------------------------------------------------------
@dataclass
class Context:
    spec: dict[str, Any]
    spec_path: Path
    hc_min: float | None
    hc_max: float | None
    borderline_pct: float
    countries_in: set[str]
    countries_out: set[str]
    industries_out: list[tuple[str, re.Pattern[str]]]
    exclusions: dict[str, DomainIndex]
    max_contacts: int | None
    personal_policy: str
    ex_emails: set[str]
    ex_slugs: set[str]
    ex_name_rx: list[re.Pattern[str]]
    expectations: dict[str, Any]
    bands: list[list[Any]]
    notes: list[str] = field(default_factory=list)


def resolve_ref(value: str, bases: list[Path]) -> Path | None:
    p = Path(value)
    if p.is_absolute():
        return p if p.exists() else None
    for base in bases:
        cand = base / p
        if cand.exists():
            return cand
    return None


def detect_domain_col(header: list[str]) -> str:
    for c in COMPANY_DOMAIN_COLS:
        if c in header:
            return c
    return header[0] if header else ""


def build_context(spec: dict[str, Any], spec_path: Path, campaign_dir: Path) -> Context:
    account = spec.get("account") or {}
    buyers = spec.get("buyers") or {}
    hc = account.get("headcount") or {}
    bp = as_float(hc.get("borderline_pct"))
    geo = account.get("geography") or {}
    industries_out = []
    for term in account.get("industries_out") or []:
        rx = term_regex(str(term))
        if rx is not None:
            industries_out.append((clean(term), rx))

    excl = account.get("exclusions") or {}
    exclusions: dict[str, DomainIndex] = {}
    for key in ("domains", "competitor_domains", "existing_customer_domains", "internal_domains"):
        idx = DomainIndex()
        for d in excl.get(key) or []:
            idx.add(d, key)
        if len(idx):
            exclusions[key] = idx
    notes: list[str] = []
    ecf = clean(excl.get("existing_customers_file"))
    if ecf:
        path = resolve_ref(ecf, [spec_path.parent, campaign_dir, Path.cwd(), SCRIPT_DIR.parent])
        if path is None:
            raise QAError(f"SPEC ERROR: account.exclusions.existing_customers_file {ecf!r} was not found (looked beside "
                          "the spec, in --dir, the working folder and outbound/). Fix the path or remove it; QA will "
                          "not run without the existing-customer list the spec names.")
        header, rows = read_csv(path)
        col = detect_domain_col(header)
        idx = DomainIndex()
        for r in rows:
            idx.add(r.get(col), "existing_customers_file")
        exclusions["existing_customers_file"] = idx
        notes.append(f"existing customers file {path.name}: {len(idx)} domains")

    policy = clean(buyers.get("personal_email_policy") or "fail").lower()
    if policy not in {"fail", "review", "allow"}:
        raise QAError(f"SPEC ERROR: buyers.personal_email_policy must be fail, review or allow, not {policy!r}")
    cap = buyers.get("max_contacts_per_account", buyers.get("contacts_per_account"))
    max_contacts = int(cap) if as_float(cap) is not None and float(cap) > 0 else None

    ce = buyers.get("contact_exclusions") or {}
    ex_name_rx = []
    for pat in ce.get("name_patterns") or []:
        try:
            ex_name_rx.append(re.compile(str(pat), re.IGNORECASE))
        except re.error as exc:
            raise QAError(f"SPEC ERROR: buyers.contact_exclusions.name_patterns {pat!r} is not a valid regex: {exc}")

    expectations = dict(DEFAULT_EXPECTATIONS)
    expectations.update({k: v for k, v in (spec.get("expectations") or {}).items() if v is not None})
    bands = expectations.get("headcount_bands") or DEFAULT_BANDS
    return Context(
        spec=spec,
        spec_path=spec_path,
        hc_min=as_float(hc.get("min")),
        hc_max=as_float(hc.get("max")),
        borderline_pct=15.0 if bp is None else bp,
        countries_in={norm_country(c) for c in geo.get("countries_in") or [] if clean(c)},
        countries_out={norm_country(c) for c in geo.get("countries_out") or [] if clean(c)},
        industries_out=industries_out,
        exclusions=exclusions,
        max_contacts=max_contacts,
        personal_policy=policy,
        ex_emails={e for e in (norm_email(x) for x in ce.get("emails") or []) if e},
        ex_slugs={s for s in (linkedin_slug(x) for x in ce.get("linkedin_urls") or []) if s},
        ex_name_rx=ex_name_rx,
        expectations=expectations,
        bands=bands,
        notes=notes,
    )


@dataclass
class Suppression:
    path: Path | None
    found: bool
    auto_detected: bool
    entries: int = 0
    email: dict[str, str] = field(default_factory=dict)
    slug: dict[str, str] = field(default_factory=dict)
    domain: DomainIndex = field(default_factory=DomainIndex)
    name: dict[str, str] = field(default_factory=dict)


def resolve_suppression(arg: str | None, campaign_dir: Path) -> tuple[Path | None, bool]:
    if arg:
        return Path(arg), False
    for cand in (campaign_dir.parent.parent / "suppression-list.csv", campaign_dir / "suppression-list.csv"):
        if cand.exists():
            return cand, True
    return None, True


def load_suppression(path: Path | None, auto: bool) -> Suppression:
    s = Suppression(path=path, found=bool(path and path.exists()), auto_detected=auto)
    if not s.found or path is None:
        return s
    _, rows = read_csv(path)
    for r in rows:
        reason = clean(r.get("reason")).lower() or "unspecified"
        email = norm_email(r.get("email"))
        slug = linkedin_slug(r.get("linkedin_url"))
        dom = norm_domain(clean(r.get("company_domain")))
        cname = company_name_key(r.get("company_name"))
        if not (email or slug or dom or cname):
            continue
        s.entries += 1
        if email:
            s.email.setdefault(email, reason)
        if slug:
            s.slug.setdefault(slug, reason)
        # A person-level entry (it names an email or a LinkedIn) never suppresses
        # the person's colleagues. Only negative_hostile suppresses a whole
        # domain; a company-level entry (no email, no LinkedIn), such as a
        # client_blocklist row, is company-wide. lead_score.py applies the same
        # domain rule before email spend; this script also matches subdomains
        # and a company-name-only row, which lead_score.py does not.
        company_wide = reason == "negative_hostile" or not (email or slug)
        if dom and company_wide:
            s.domain.add(dom, reason)
        if cname and company_wide:
            s.name.setdefault(cname, reason)
    return s


def detect_email_col(header: list[str], rows: list[dict[str, str]]) -> str:
    lowered = {h.strip().lower(): h for h in header}
    for cand in ("email", "lead_email", "email_address", "email address", "e-mail", "emailaddress", "lead email"):
        if cand in lowered:
            return lowered[cand]
    for h in header:
        hl = h.lower()
        if "email" in hl and not any(x in hl for x in ("status", "verified", "sent", "source", "domain", "count")):
            return h
    best, best_hits = "", 0
    for h in header:
        hits = sum(1 for r in rows[:200] if norm_email(r.get(h)))
        if hits > best_hits:
            best, best_hits = h, hits
    return best


def load_active_leads(paths: list[str]) -> tuple[set[str], list[str]]:
    # The sending platform's lead export. Its real column names are UNVERIFIED
    # for the current platform, so the email column is detected by name, then by
    # content (detect_email_col), rather than assumed.
    emails: set[str] = set()
    notes = []
    for p in paths:
        path = Path(p)
        if not path.exists():
            raise QAError(f"--active-leads file not found: {path}")
        header, rows = read_csv(path)
        col = detect_email_col(header, rows)
        if not col:
            raise QAError(f"--active-leads file {path.name} has no email column this script can find")
        before = len(emails)
        for r in rows:
            e = norm_email(r.get(col))
            if e:
                emails.add(e)
        notes.append(f"{path.name} (column {col}, {plural(len(emails) - before, 'new email')})")
    return emails, notes


def load_companies(path: Path | None) -> dict[str, dict[str, str]]:
    if path is None:
        return {}
    if not path.exists():
        raise QAError(f"--companies file not found: {path}")
    header, rows = read_csv(path)
    col = detect_domain_col(header)
    out: dict[str, dict[str, str]] = {}
    for r in rows:
        d = norm_domain(clean(r.get(col)))
        if d:
            out.setdefault(d, r)
    return out


def _domain_label(d: str) -> str:
    """The registrable name without its ending: berkschc.org -> berkschc, x.co.uk -> x."""
    parts = norm_domain(d).split(".")
    if len(parts) >= 3 and parts[-2] in {"co", "com", "org", "net", "ac", "gov", "edu"} and len(parts[-1]) == 2:
        return parts[-3]
    return parts[-2] if len(parts) >= 2 else (parts[0] if parts else "")


def related_org_domain(email_dom: str, company_dom: str, company_name: str = "") -> bool:
    """A sibling corporate email domain that plainly belongs to the same organization.

    True when the two names match on a different ending (berkschc.net / berkschc.org),
    when one name contains the other and the shorter has 5+ characters
    (optioncare.com / optioncarehealth.com, coxhealth.com / coxhealthathome.com), or when
    the email name equals the compacted company name. Anything else stays a REVIEW,
    because a different domain can also mean a different employer.
    """
    a, b = _domain_label(email_dom), _domain_label(company_dom)
    if not a or not b:
        return False
    if a == b:
        return True
    short, long_ = sorted((a, b), key=len)
    if len(short) >= 5 and short in long_:
        return True
    ck = re.sub(r"[^a-z0-9]", "", (company_name or "").lower())
    return len(a) >= 5 and bool(ck) and (a == ck or (len(ck) >= 5 and ck in a))


# ---------------------------------------------------------------------------
# Step 1: systemic blocks
# ---------------------------------------------------------------------------
def systemic_blocks(header: list[str], rows: list[dict[str, str]]) -> list[dict[str, Any]]:
    blocks: list[dict[str, Any]] = []
    if "email_status" not in header:
        bad = list(rows)
        detail = "The file has no email_status column, so no row can be proven verified by the email verifier."
    else:
        bad = [r for r in rows if not email_status_class(r)]
        statuses = Counter((clean(r.get("email_status")).lower() or "(blank)") if norm_email(r.get("email"))
                           else "(no usable email)" for r in bad)
        detail = ("Statuses found: " + ", ".join(f"{k} {v}" for k, v in statuses.most_common()) + ". "
                  "The send file must be 100% `valid` by the email verifier (a verified catch-all is also "
                  "accepted here and routed to the catch-all holdback).")
    if bad:
        blocks.append({"check": "not_verified", "title": "Rows the email verifier has not passed",
                       "owner": "the email waterfall (/email-waterfall)", "rows": bad, "detail": detail,
                       "fix": "Re-run the email waterfall so every send-file row passes the email verifier, and "
                              "move risky, unknown and invalid rows to leads.review.csv there."})

    banned = []
    terms: Counter[str] = Counter()
    for r in rows:
        for col in SOURCE_COLUMNS:
            v = clean(r.get(col)).lower()
            hit = next((t for t in BANNED_SOURCE_TERMS if t in v), "")
            if hit:
                banned.append(r)
                terms[f"{col}={clean(r.get(col))}"] += 1
                break
    if banned:
        blocks.append({"check": "banned_source", "title": "Contacts from a banned discovery source",
                       "owner": "contact discovery (the people-discovery tools, in the `layers.people_discovery` "
                                "order of provider-routing.yaml)",
                       "rows": banned,
                       "detail": "SERP or Google-searched people (no current-employer signal) and pattern- or "
                                 "index-constructed names are banned. Found: "
                                 + ", ".join(f"{k} ({v})" for k, v in terms.most_common(5)) + ".",
                       "fix": "Re-discover these contacts from a current-employer database in the approved "
                              "discovery order (the stack contract, mirrored in provider-routing.yaml), then re-run "
                              "the waterfall."})

    leak = []
    why: Counter[str] = Counter()
    for r in rows:
        reasons = []
        if "send_eligible" in header and not truthy(r.get("send_eligible")):
            reasons.append(f"send_eligible={clean(r.get('send_eligible')) or '(blank)'}")
        for col in ("fit_status", "co_fit_status"):
            if clean(r.get(col)).lower() == "bad":
                reasons.append(f"{col}=bad")
        if "lead_score" in header:   # a governed (scored) list: its score fields must be whole and consistent
            raw = clean(r.get("lead_score"))
            try:
                score = float(raw)
            except ValueError:
                score = None
            if score is None or not (2.0 <= score <= 10.0):
                reasons.append(f"lead_score={raw or '(blank)'}")
            elif "priority_tier" in header:
                want = "P1" if score >= 9.0 else "P2" if score >= 7.0 else "P3" if score >= 5.0 else "P4" if score >= 3.0 else "P5"
                if clean(r.get("priority_tier")).upper() != want:
                    reasons.append("priority_tier_mismatch")
            for col in ("score_version", "scored_at"):
                if col in header and not clean(r.get(col)):
                    reasons.append(f"{col}=(blank)")
        if reasons:
            leak.append(r)
            why.update(reasons)
    if leak:
        blocks.append({"check": "scoring_leakage", "title": "Scoring leakage (ineligible rows in the send file)",
                       "owner": "lead scoring (/lead-scoring)", "rows": leak,
                       "detail": "Found: " + ", ".join(f"{k} ({v})" for k, v in why.most_common()) + ".",
                       "fix": "Re-run lead scoring and rebuild the send file from send_eligible = true rows only."})
    return blocks


# ---------------------------------------------------------------------------
# Step 2: normalize
# ---------------------------------------------------------------------------
def normalize_rows(rows: list[dict[str, Any]], ctx: Context, companies: dict[str, dict[str, str]]) -> None:
    for i, r in enumerate(rows):
        r["_idx"] = i
        r["_codes"] = []
        r["first_name_norm"] = norm_name(r.get("first_name"))
        r["last_name_norm"] = norm_name(r.get("last_name"))
        r["email_norm"] = norm_email(r.get("email"))
        r["email_domain"] = email_domain(r.get("email"))
        dom_raw, _ = first_value(r, COMPANY_DOMAIN_COLS)
        r["company_domain_norm"] = norm_domain(dom_raw)
        r["linkedin_slug"] = linkedin_slug(r.get("linkedin_url") or r.get("member_linkedin_username"))
        co = companies.get(r["company_domain_norm"]) or {}

        hc_raw, _ = first_value(r, ROW_HEADCOUNT_COLS)
        n = parse_headcount(hc_raw)
        src = "row"
        if n is None:
            n = parse_headcount(first_value(co, COMPANY_HEADCOUNT_COLS)[0]) if co else None
            src = "companies_file" if n is not None else "missing"
        r["_hc"] = n
        r["headcount_num"] = fmt_num(n)
        r["headcount_source"] = src
        r["headcount_band"] = headcount_band(n, ctx.bands)

        country, _ = first_value(r, ROW_COUNTRY_COLS)
        src = "row"
        if not country:
            country = first_value(co, ROW_COUNTRY_COLS)[0] if co else ""
            src = "companies_file" if country else "missing"
        r["country_norm"] = norm_country(country)
        r["country_source"] = src

        industry, _ = first_value(r, ROW_INDUSTRY_COLS)
        src = "row"
        if not industry:
            industry = first_value(co, ROW_INDUSTRY_COLS)[0] if co else ""
            src = "companies_file" if industry else "missing"
        r["industry_norm"] = industry.lower()
        r["industry_source"] = src

        r["person_key"] = f"{name_key(r.get('first_name'))}|{name_key(r.get('last_name'))}|{r['company_domain_norm']}"
        if not clean(r.get("person_id")):
            r["person_id"] = person_id(r)


# ---------------------------------------------------------------------------
# Step 3: six-dimension row gate
# ---------------------------------------------------------------------------
def add(row: dict[str, Any], dim: str, level: str, code: str) -> None:
    row["_codes"].append((dim, level, code))


def classify_missing_titles(rows: list[dict[str, Any]], spec: dict[str, Any], header: list[str]) -> int:
    todo = [r for r in rows if not clean(r.get("title_status"))]
    if not todo:
        return 0
    clf = Classifier(spec)  # SpecError propagates (exit 2)
    tcol = next((c for c in TITLE_COLS if c in header), "")
    cache: dict[tuple[str, float | None], dict[str, str]] = {}
    for r in todo:
        title = clean(r.get(tcol)) if tcol else ""
        key = (title, r["_hc"])
        if key not in cache:
            cache[key] = clf.classify(title, r["_hc"])
        r.update(cache[key])
        r["title_raw"] = title
    return len(todo)


def title_code(rule: str) -> str:
    rule = clean(rule)
    if not rule:
        return "title_fail"
    return rule if rule.startswith("title_") else f"title_{rule}"


def broken_name_reason(first: str, last: str, company: str) -> str:
    if not first or re.fullmatch(r"[\W_]+", first):
        return "blank_first"
    for part in (first, last):
        low = part.lower()
        if "@" in low:
            return "contains_email"
        if "http" in low or "www" in low:
            return "contains_url"
        if len(re.findall(r"\d", part)) >= 2:
            return "contains_digits"
    low_first = first.lower()
    if low_first in NON_PERSON_NAME_WORDS or any(w in NON_PERSON_NAME_WORDS for w in re.split(r"[\s,]+", low_first)):
        return "non_person_word"
    fk, lk = name_key(first), name_key(last)
    if fk and lk and fk == lk:
        return "first_equals_last"
    ck = company_name_key(company)
    if fk and ck and fk == ck:
        return "first_is_company"
    return ""


def gate_row(r: dict[str, Any], ctx: Context, supp: Suppression, active: set[str]) -> None:
    # 1. ICP fit
    n = r["_hc"]
    if ctx.hc_min is not None or ctx.hc_max is not None:
        band = ctx.borderline_pct / 100.0
        if n is None:
            add(r, "qa_icp", "WARN", "headcount_missing")
        elif ctx.hc_min is not None and n < ctx.hc_min:
            add(r, "qa_icp", *(("WARN", "headcount_borderline") if n >= ctx.hc_min * (1 - band)
                               else ("FAIL", "headcount_out_of_range")))
        elif ctx.hc_max is not None and n > ctx.hc_max:
            add(r, "qa_icp", *(("WARN", "headcount_borderline") if n <= ctx.hc_max * (1 + band)
                               else ("FAIL", "headcount_out_of_range")))
    if ctx.countries_in or ctx.countries_out:
        c = r["country_norm"]
        if not c:
            add(r, "qa_icp", "WARN", "country_missing")
        elif (ctx.countries_in and c not in ctx.countries_in) or c in ctx.countries_out:
            add(r, "qa_icp", "FAIL", "out_of_geography")
    if ctx.industries_out:
        text = " ".join([r["industry_norm"], ascii_lower(clean(r.get("company_name"))), r["company_domain_norm"]])
        hit = next((t for t, rx in ctx.industries_out if rx.search(text)), "")
        if hit:
            add(r, "qa_icp", "FAIL", f"excluded_industry:{hit}")
    for list_name, idx in ctx.exclusions.items():
        if idx.match(r["company_domain_norm"]) or (r["email_domain"] and idx.match(r["email_domain"])):
            add(r, "qa_icp", "FAIL", f"excluded_account:{list_name}")
            break
    if "maybe" in (clean(r.get("fit_status")).lower(), clean(r.get("co_fit_status")).lower()):
        add(r, "qa_icp", "INFO", "fit_maybe")

    # 2. Title / function fit
    # Blank-title policy (kept as ported on purpose): a blank title is `missing`
    # (title_classify.py), which is unknown evidence and never a fail. Upstream,
    # lead_score.py keeps a blank tier send-eligible; here the row is parked in
    # leads.review.csv (review_reason qa_title_missing) for a person to confirm,
    # never rejected and never shipped unseen. The split is deliberate.
    st = clean(r.get("title_status")).lower()
    if st == "fail":
        add(r, "qa_title", "FAIL", title_code(r.get("title_rule", "")))
    elif st == "ambiguous":
        add(r, "qa_title", "REVIEW", "title_ambiguous")
    elif st in ("missing", ""):
        add(r, "qa_title", "REVIEW", "title_missing")
    elif st != "pass":
        add(r, "qa_title", "REVIEW", f"title_status_unknown:{st}")

    # 3. Seniority / buyer fit (judged only on a passing title)
    if st != "pass":
        r["_na"] = {"qa_seniority"}
    else:
        tier = clean(r.get("title_role_tier")).lower()
        if tier in ("adjacent", "weak"):
            add(r, "qa_seniority", "INFO", "buyer_tier_low")
        elif tier not in ("exact", "strong", "influencer"):
            add(r, "qa_seniority", "WARN", "buyer_tier_unknown")
        if not clean(r.get("title_seniority")):
            add(r, "qa_seniority", "WARN", "seniority_unknown")

    # 4. Company / domain match
    cd, ed = r["company_domain_norm"], r["email_domain"]
    current, _ = first_value(r, CURRENT_EMPLOYER_COLS)
    if current and cd and not same_org_domain(current, cd):
        add(r, "qa_company_match", "FAIL", "wrong_company")
    if ed in CONSUMER_DOMAINS:
        level = {"fail": "FAIL", "review": "REVIEW", "allow": "INFO"}[ctx.personal_policy]
        add(r, "qa_company_match", level, "personal_email")
    elif not cd:
        add(r, "qa_company_match", "REVIEW", "company_domain_missing")
    elif ed and not same_org_domain(ed, cd):
        if related_org_domain(ed, cd, clean(r.get("company_name"))):
            add(r, "qa_company_match", "WARN", "email_domain_related")
        else:
            add(r, "qa_company_match", "REVIEW", "email_domain_mismatch")
    tac = clean(r.get("title_at_company"))
    if tac:
        company = clean(r.get("company_name"))
        co_tokens = meaningful_tokens(company) | meaningful_tokens(cd.split(".")[0] if cd else "")
        tac_tokens = meaningful_tokens(tac)
        tk, ck = company_name_key(tac), company_name_key(company)
        compact = bool(tk and ck and (tk in ck or ck in tk))
        if tac_tokens and (company or cd) and not (tac_tokens & co_tokens) and not compact:
            add(r, "qa_company_match", "WARN", "title_names_other_company")

    # 5. Contact quality
    if email_status_class(r) == "catch_all":
        add(r, "qa_contact", "REVIEW", "catch_all")
    first, last = clean(r.get("first_name")), clean(r.get("last_name"))
    why = broken_name_reason(first, last, clean(r.get("company_name")))
    if why:
        add(r, "qa_contact", "FAIL", f"broken_name:{why}")
    else:
        if len(name_key(first)) == 1:
            add(r, "qa_contact", "WARN", "name_initial_only")
        if not last:
            add(r, "qa_contact", "REVIEW", "last_name_missing")
    local = email_local(r.get("email"))
    if local and (local in ROLE_LOCAL_PARTS or local.split("+", 1)[0] in ROLE_LOCAL_PARTS):
        add(r, "qa_contact", "WARN", "role_mailbox")
    if not clean(r.get("linkedin_url")):
        add(r, "qa_contact", "WARN", "linkedin_missing")

    # 6. Suppression / risk
    e, slug = r["email_norm"], r["linkedin_slug"]
    reason = None
    if e and e in supp.email:
        reason = supp.email[e]
    elif slug and slug in supp.slug:
        reason = supp.slug[slug]
    else:
        reason = supp.domain.match(cd) if cd else None
        if reason is None and ed and ed not in CONSUMER_DOMAINS:
            reason = supp.domain.match(ed)
        if reason is None:
            ck = company_name_key(r.get("company_name"))
            reason = supp.name.get(ck) if ck else None
    if reason is not None:
        add(r, "qa_suppression", "FAIL", f"suppressed:{reason}")
    full = clean(r.get("full_name")) or f"{first} {last}".strip()
    if (e and e in ctx.ex_emails) or (slug and slug in ctx.ex_slugs) or any(rx.search(full) for rx in ctx.ex_name_rx):
        add(r, "qa_suppression", "FAIL", "contact_excluded")
    if e and e in active:
        add(r, "qa_suppression", "FAIL", "already_active")


def finalize_row(r: dict[str, Any]) -> None:
    worst_all = 0
    for dim, _ in DIMENSIONS:
        if dim in r.get("_na", set()):
            r[dim] = "N/A"
            continue
        worst = max((LEVELS[lv] for d, lv, _ in r["_codes"] if d == dim), default=0)
        worst_all = max(worst_all, worst)
        r[dim] = {0: "PASS", 1: "PASS", 2: "WARN", 3: "REVIEW", 4: "FAIL"}[worst]
    has_info = any(lv == "INFO" for _, lv, _ in r["_codes"])
    r["qa_severity"] = {4: "CRITICAL", 3: "REVIEW", 2: "WARN"}.get(worst_all, "INFO" if has_info else "PASS")
    if worst_all == 4:
        r["qa_status"] = "rejected"
    elif worst_all == 3:
        other_review = [c for _, lv, c in r["_codes"] if lv == "REVIEW" and c != "catch_all"]
        r["qa_status"] = "review" if other_review else "holdback"
    else:
        r["qa_status"] = "pass"


def set_reasons(r: dict[str, Any]) -> None:
    seen: list[str] = []
    for _, _, code in r["_codes"]:
        if code not in seen:
            seen.append(code)
    r["qa_reasons"] = "|".join(seen)


# ---------------------------------------------------------------------------
# Steps 4 and 5: de-duplicate, account density
# ---------------------------------------------------------------------------
STATUS_RANK = {"pass": 0, "holdback": 1, "review": 2}


def rank_key(r: dict[str, Any]) -> tuple[Any, ...]:
    score = as_float(r.get("lead_score"))
    wave = clean(r.get("wave_slot")).lower()
    return (STATUS_RANK.get(r["qa_status"], 3),
            TIER_RANK.get(clean(r.get("title_role_tier")).lower(), 5),
            -(score if score is not None else -1e9),
            0 if wave == "primary" else 1 if wave == "promoted_fallback" else 2,
            r["_idx"])


def dedupe(rows: list[dict[str, Any]]) -> int:
    cands = [r for r in rows if r["qa_status"] != "rejected"]
    parent = {r["_idx"]: r["_idx"] for r in cands}

    def find(x: int) -> int:
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    owner: dict[tuple[str, str], int] = {}
    for r in cands:
        keys = []
        if r["email_norm"]:
            keys.append(("e", r["email_norm"]))
        if r["linkedin_slug"]:
            keys.append(("l", r["linkedin_slug"]))
        f, l_, d = r["person_key"].split("|")
        if f and l_ and d:
            keys.append(("p", r["person_key"]))
        for k in keys:
            if k in owner:
                a, b = find(owner[k]), find(r["_idx"])
                if a != b:
                    parent[b] = a
            else:
                owner[k] = r["_idx"]
    groups: dict[int, list[dict[str, Any]]] = defaultdict(list)
    for r in cands:
        groups[find(r["_idx"])].append(r)
    dropped = 0
    for members in groups.values():
        if len(members) < 2:
            continue
        members.sort(key=rank_key)
        kept = members[0]
        kept_id = clean(kept.get("person_id")) or kept["email_norm"]
        for r in members[1:]:
            add(r, "qa_suppression", "FAIL", f"duplicate_of:{kept_id}")  # standard section 10: dimension 6
            r["qa_suppression"] = "FAIL"
            r["qa_severity"] = "CRITICAL"
            r["qa_status"] = "rejected"
            dropped += 1
    return dropped


def apply_density(rows: list[dict[str, Any]], cap: int | None) -> int:
    if not cap:
        return 0
    by_dom: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for r in rows:
        if r["qa_status"] == "pass" and r["company_domain_norm"]:
            by_dom[r["company_domain_norm"]].append(r)
    moved = 0
    for members in by_dom.values():
        if len(members) <= cap:
            continue
        members.sort(key=rank_key)
        for r in members[cap:]:
            add(r, "density", "INFO", "density_overflow")
            r["qa_status"] = "stagger"
            moved += 1
    return moved


# ---------------------------------------------------------------------------
# Step 6: outputs
# ---------------------------------------------------------------------------
def append_queue(path: Path, header: list[str], new_rows: list[dict[str, Any]],
                 rejudged: tuple[set[str], set[str]]) -> tuple[int, int]:
    """Append rows to a shared queue file (union header). Returns (added, skipped).

    Rows another script wrote (list_waterfall.py: no qa_status) are always kept.
    Rows an earlier QA run wrote (they carry qa_status) for a person this run
    re-judged are dropped first, so a rerun after a spec change never leaves one
    person in both the send file and a queue.
    """
    old_header, old_rows = read_csv(path) if path.exists() else ([], [])
    ids, emails = rejudged
    before = len(old_rows)
    old_rows = [r for r in old_rows
                if not (clean(r.get("qa_status"))
                        and (clean(r.get("person_id")) in ids or norm_email(r.get("email")) in emails))]
    removed = before - len(old_rows)
    seen_ids = {clean(r.get("person_id")) for r in old_rows} - {""}
    seen_emails = {norm_email(r.get("email")) for r in old_rows} - {""}
    added = []
    for r in new_rows:
        pid, em = clean(r.get("person_id")), r.get("email_norm") or norm_email(r.get("email"))
        if (pid and pid in seen_ids) or (em and em in seen_emails):
            continue
        added.append(r)
        if pid:
            seen_ids.add(pid)
        if em:
            seen_emails.add(em)
    if added or removed or not path.exists():
        write_csv(path, merged_header(old_header, header), old_rows + added)
    return len(added), len(new_rows) - len(added)


def first_review_code(r: dict[str, Any]) -> str:
    codes = [c for _, lv, c in r["_codes"] if lv == "REVIEW"]
    non_catch = [c for c in codes if c != "catch_all"]
    code = (non_catch or codes or ["unspecified"])[0]
    return "qa_" + code.split(":", 1)[0]


# ---------------------------------------------------------------------------
# Step 7: distributions and anomalies
# ---------------------------------------------------------------------------
def has_code(r: dict[str, Any], prefix: str, level: str | None = None) -> bool:
    return any(c.startswith(prefix) and (level is None or lv == level) for _, lv, c in r["_codes"])


DIST_SPECS: list[tuple[str, Callable[[dict[str, Any]], str]]] = [
    ("Company size bands", lambda r: r["headcount_band"]),
    ("Buyer tier", lambda r: clean(r.get("title_role_tier")).lower() or "(blank)"),
    ("Title function family", lambda r: clean(r.get("title_functions"))
     or (f"non-target: {clean(r.get('title_non_target'))}" if clean(r.get("title_non_target")) else "(none)")),
    ("Seniority", lambda r: clean(r.get("title_seniority")) or "(unknown)"),
    ("Country", lambda r: r["country_norm"] or "(missing)"),
    ("Email source", email_source),
    ("Source / source arm", source_arm),
    ("Email status", lambda r: clean(r.get("email_status")).lower() or "(blank)"),
    ("Fit status", lambda r: clean(r.get("fit_status")).lower() or clean(r.get("co_fit_status")).lower() or "(blank)"),
    ("Title classifier", lambda r: clean(r.get("title_classifier")).lower() or "(blank)"),
]


def band_order(bands: list[list[Any]]) -> list[str]:
    labels = []
    for lo, hi in bands:
        probe = float(lo) if lo is not None else float(hi) if hi is not None else 0.0
        labels.append(headcount_band(probe, bands))
    return labels + ["other", "missing"]


def ordered_values(name: str, counter: Counter[str], bands: list[list[Any]]) -> list[str]:
    if name == "Company size bands":
        fixed = band_order(bands)
    elif name == "Buyer tier":
        fixed = BUYER_TIERS + ["unrelated", "excluded", "(blank)"]
    else:
        return [k for k, _ in sorted(counter.items(), key=lambda kv: (-kv[1], kv[0]))]
    return [k for k in fixed if counter.get(k)] + sorted(k for k in counter if k not in fixed)


def attribution(offenders: list[dict[str, Any]], all_rows: list[dict[str, Any]], label: str,
                base_label: str = "all input rows") -> str:
    if not offenders:
        return ""
    total = len(all_rows)
    parts = []
    for col_label, getter in (("email source", email_source), ("source arm", source_arm)):
        c = Counter(getter(r) for r in offenders)
        base = Counter(getter(r) for r in all_rows)
        top, k = c.most_common(1)[0]
        detail = ", ".join(f"{v} {cnt}" for v, cnt in c.most_common(5))
        parts.append(f"{k} of {len(offenders)} {label} came from {col_label} {top} ({top} supplied "
                     f"{pct(base[top], total)} of {base_label}). By {col_label}: {detail}.")
    return " ".join(parts)


def find_anomalies(rows: list[dict[str, Any]], ready: list[dict[str, Any]], ctx: Context) -> list[dict[str, Any]]:
    exp = ctx.expectations
    n = len(rows)
    out: list[dict[str, Any]] = []

    def check(level: str, key: str, offenders: list[dict[str, Any]], limit: float, title: str, label: str,
              fix: str, base_rows: list[dict[str, Any]] | None = None, below: bool = False) -> None:
        base_label = "all input rows" if base_rows is None else "the campaign-ready rows"
        base_rows = rows if base_rows is None else base_rows
        s = share(len(offenders), len(base_rows))
        tripped = (s < limit) if below else (s > limit)
        if not base_rows or not tripped:
            return
        out.append({"level": level, "key": key, "count": len(offenders), "base": len(base_rows), "share": s,
                    "limit": limit, "title": title, "fix": fix,
                    "attribution": attribution(offenders, base_rows, label, base_label)})

    hc = [r for r in rows if has_code(r, "headcount_out_of_range", "FAIL")]
    lo = sum(1 for r in hc if ctx.hc_min is not None and r["_hc"] < ctx.hc_min)
    rng = f"{fmt_num(ctx.hc_min) or 'no floor'} to {fmt_num(ctx.hc_max) or 'no ceiling'}"
    check("CRITICAL", "headcount", hc, float(exp["max_share_out_of_headcount_range"]),
          f"{len(hc)} of {n} input rows ({pct(len(hc), n)}) are outside the {rng} headcount range "
          f"({lo} below the floor, {len(hc) - lo} above the ceiling; limit "
          f"{float(exp['max_share_out_of_headcount_range']):.0%})",
          "out-of-range rows",
          "The provider's company-size filter is leaking. Add a post-provider headcount check to that discovery arm, "
          "or cross-check headcount from a second source, then re-run the build. The rows were already rejected here.")
    geo = [r for r in rows if has_code(r, "out_of_geography", "FAIL")]
    check("CRITICAL", "geography", geo, float(exp["max_share_out_of_geography"]),
          f"{len(geo)} of {n} input rows ({pct(len(geo), n)}) are outside the target geography (limit "
          f"{float(exp['max_share_out_of_geography']):.0%})",
          "out-of-geography rows",
          "Tighten the discovery filter's country setting for the arm named above. The rows were already rejected here.")
    tf = [r for r in rows if r["qa_title"] == "FAIL"]
    rules = Counter(title_code(r.get("title_rule", "")).split(":")[0] for r in tf)
    check("CRITICAL", "title", tf, float(exp["max_share_non_target_function"]),
          f"{len(tf)} of {n} input rows ({pct(len(tf), n)}) failed title fit (limit "
          f"{float(exp['max_share_non_target_function']):.0%}; by rule: "
          + ", ".join(f"{k} {v}" for k, v in rules.most_common(4)) + ")",
          "failed-title rows",
          "The title rules or the people-search titles are too broad. Fix the targeting spec (function families, "
          "non_target_functions, title_exclusions), re-run title_classify.py, and tighten the people search for the "
          "source named above.")
    miss = [r for r in rows if r["headcount_source"] == "missing"]
    check("WARNING", "missing_headcount", miss, float(exp["max_share_missing_headcount"]),
          f"{len(miss)} of {n} input rows ({pct(len(miss), n)}) have no headcount anywhere (limit "
          f"{float(exp['max_share_missing_headcount']):.0%}), so company size cannot be trusted as a filter",
          "rows without headcount",
          "Cross-check headcount from the company file (--companies tam.csv) or a second provider before relying on "
          "size, and fill it upstream for the arm named above.")
    if ready:
        low = [r for r in ready if clean(r.get("title_role_tier")).lower() not in ("exact", "strong")]
        top = len(ready) - len(low)
        check("WARNING", "top_tiers", low, 1 - float(exp["min_share_exact_or_strong"]),
              f"Only {top} of {len(ready)} campaign-ready rows ({pct(top, len(ready))}) are exact or strong buyers "
              f"(expected at least {float(exp['min_share_exact_or_strong']):.0%})",
              "lower-tier ready rows",
              "Too few top-tier buyers came through. Check that people discovery searches the exact and strong titles "
              "at every account (min_target_persons_per_account) and that the spec's role tiers are not too narrow.",
              base_rows=ready)
    dup = [r for r in rows if has_code(r, "duplicate_of")]
    check("WARNING", "duplicates", dup, DUPLICATE_SHARE_LIMIT,
          f"{len(dup)} of {n} input rows ({pct(len(dup), n)}) were duplicates (limit {DUPLICATE_SHARE_LIMIT:.0%})",
          "duplicate rows",
          "The waterfall let duplicates through. De-duplicate by email, LinkedIn and name plus domain before any "
          "enrichment spend (email waterfall, required order step 1).")
    out.sort(key=lambda a: 0 if a["level"] == "CRITICAL" else 1)
    return out


# ---------------------------------------------------------------------------
# Step 8: nine-dimension grade
# ---------------------------------------------------------------------------
def letter_for(score: int) -> str:
    if score >= 97:
        return "A+"
    if score >= 90:
        return "A"
    if score >= 80:
        return "B"
    if score >= 70:
        return "C"
    if score >= 60:
        return "D"
    return "F"


def nine_dimension_grade(ready: list[dict[str, Any]], signal_copy: bool) -> dict[str, Any]:
    n = len(ready)
    names = ["Email verification coverage", "Duplicate email rate", "Duplicate domain rate", "Title relevance",
             "Source signal integrity", "Bad-title detection", "Role / generic mailbox density", "ICP fit",
             "Name quality"]
    weights = [2, 1, 1, 1, 2, 1, 1, 2, 1]
    if n == 0:
        dims = [{"name": nm, "score": 0, "weight": w, "note": "no campaign-ready rows"} for nm, w in zip(names, weights)]
        return {"score": 0, "letter": "F", "dims": dims, "total_weight": sum(weights)}

    valid = sum(1 for r in ready if email_status_class(r) == "valid")
    p1 = valid / n * 100
    d1 = 100 if valid == n else (round(p1) if p1 >= 50 else 0)
    dup_e = n - len({r["email_norm"] for r in ready})
    p2 = dup_e / n * 100
    d2 = max(0, round(100 - p2 * 10))
    doms = Counter(r["company_domain_norm"] or r["email_domain"] for r in ready)
    avg = n / len(doms)
    d3 = 100 if avg <= 2 else 60 if avg <= 5 else 30
    rel = sum(1 for r in ready if r["qa_title"] == "PASS")
    p4 = rel / n * 100
    d4 = 100 if p4 >= 80 else 50 if p4 >= 40 else 0
    if signal_copy:
        proven = sum(1 for r in ready if clean(r.get("evidence_url"))
                     and (clean(r.get("signal")) or clean(r.get("fit_reason"))))
        p5 = proven / n * 100
        d5: int | None = 100 if p5 >= 90 else 50 if p5 >= 60 else 0
        n5 = f"{proven} of {n} rows ({p5:.0f}%) carry an evidence_url plus a signal or fit_reason"
    else:
        d5, n5 = None, "N/A: the copy states no row-level signal (pass --signal-copy when it does)"
    bad = sum(1 for r in ready if BAD_TITLE_RX.search(clean(r.get("job_title")) or clean(r.get("title"))))
    p6 = bad / n * 100
    d6 = 100 if p6 < 2 else max(0, round(100 - (p6 - 2) * 10))
    role = sum(1 for r in ready if (email_local(r.get("email")) or "").split("+", 1)[0] in ROLE_LOCAL_PARTS)
    p7 = role / n * 100
    d7 = 100 if p7 < 5 else 50 if p7 <= 15 else 0
    fit = sum(1 for r in ready if r["qa_icp"] != "FAIL" and r["qa_company_match"] != "FAIL")
    p8 = fit / n * 100
    d8 = 100 if p8 >= 80 else 70 if p8 >= 50 else 40

    def real_name(r: dict[str, Any]) -> bool:
        fn, ln = clean(r.get("first_name")), clean(r.get("last_name"))
        if not fn or not ln or "@" in fn + ln:
            return False
        if fn.isupper() and len(fn) > 3:
            return False
        return fn.lower() not in NON_PERSON_NAME_WORDS

    real = sum(1 for r in ready if real_name(r))
    p9 = real / n * 100
    d9 = 100 if p9 >= 95 else round(p9)
    scores = [d1, d2, d3, d4, d5, d6, d7, d8, d9]
    notes = [
        f"{valid} of {n} rows valid by the email verifier ({p1:.0f}%)",
        f"{dup_e} duplicate emails ({p2:.1f}%)",
        f"avg {avg:.1f} contacts per company, max {max(doms.values())} ({len(doms)} companies)",
        f"{rel} of {n} rows pass title fit ({p4:.0f}%)",
        n5,
        f"{bad} titles match intern, assistant, coordinator and similar ({p6:.1f}%)",
        f"{role} role mailboxes ({p7:.1f}%)",
        f"{fit} of {n} rows inside the ICP with a matching company ({p8:.0f}%)",
        f"{real} of {n} rows have a real first and last name ({p9:.0f}%)",
    ]
    dims = [{"name": nm, "score": s, "weight": w, "note": nt} for nm, s, w, nt in zip(names, scores, weights, notes)]
    present = [d for d in dims if d["score"] is not None]
    total_w = sum(d["weight"] for d in present)
    score = round(sum(d["score"] * d["weight"] for d in present) / total_w)
    return {"score": score, "letter": letter_for(score), "dims": dims, "total_weight": total_w}


# ---------------------------------------------------------------------------
# Step 9: stratified manual QA sample
# ---------------------------------------------------------------------------
STRATA: list[tuple[str, Callable[[dict[str, Any]], str]]] = [
    ("tier", lambda r: clean(r.get("title_role_tier")).lower() or "(blank)"),
    ("band", lambda r: r["headcount_band"]),
    ("country", lambda r: r["country_norm"] or "(missing)"),
    ("email_source", email_source),
    ("classifier", lambda r: clean(r.get("title_classifier")).lower() or "(blank)"),
    ("source_arm", source_arm),
    ("wave_slot", lambda r: clean(r.get("wave_slot")).lower() or "(blank)"),
]
STRATA_EXTRA: list[tuple[str, Callable[[dict[str, Any]], str]]] = [
    ("function", lambda r: (clean(r.get("title_functions")).split("|")[0]) or "(none)"),
]


def default_sample_size(n: int) -> int:
    return 25 if n < 1000 else 50 if n < 5000 else 100


def draw_sample(ready: list[dict[str, Any]], rejected: list[dict[str, Any]], size: int | None,
                seed: int) -> tuple[list[dict[str, Any]], list[dict[str, Any]], int]:
    rng = random.Random(seed)
    n = len(ready)
    target = min(size if size is not None else default_sample_size(n), n)
    order = list(range(n))
    rng.shuffle(order)

    def pref(i: int) -> int:
        r = ready[i]
        return (0 if clean(r.get("title_classifier")).lower() == "ai" else 1) \
            + (0 if clean(r.get("wave_slot")).lower() == "promoted_fallback" else 1)

    chosen: list[int] = []
    chosen_set: set[int] = set()
    for _, fn in STRATA:
        for v in sorted({fn(r) for r in ready}):
            if any(fn(ready[i]) == v for i in chosen):
                continue
            cands = sorted((i for i in order if fn(ready[i]) == v), key=pref)  # stable: shuffled within preference
            chosen.append(cands[0])
            chosen_set.add(cands[0])
    remaining = target - len(chosen)
    if remaining > 0:
        pool = [i for i in order if i not in chosen_set]
        groups: dict[str, list[int]] = defaultdict(list)
        for i in pool:
            groups[STRATA[0][1](ready[i])].append(i)
        quotas = {k: len(v) * remaining / len(pool) for k, v in groups.items()}
        alloc = {k: int(q) for k, q in quotas.items()}
        leftover = remaining - sum(alloc.values())
        for k in sorted(quotas, key=lambda k: (-(quotas[k] - alloc[k]), k))[:leftover]:
            alloc[k] += 1
        for k, members in groups.items():
            chosen.extend(members[:alloc[k]])
    ready_sample = [ready[i] for i in chosen]

    judged = [r for r in rejected if any(lv == "FAIL" and c.startswith(JUDGMENT_PREFIXES) for _, lv, c in r["_codes"])]
    judged_ids = {r["_idx"] for r in judged}
    policy = [r for r in rejected if r["_idx"] not in judged_ids]
    rng.shuffle(judged)
    rng.shuffle(policy)
    controls: list[dict[str, Any]] = []
    seen_cats: set[str] = set()
    for r in judged:  # one per rejection reason first, for spread
        cat = next(c for _, lv, c in r["_codes"] if lv == "FAIL").split(":")[0]
        if cat not in seen_cats and len(controls) < 5:
            controls.append(r)
            seen_cats.add(cat)
    for r in judged + policy:
        if len(controls) >= 5:
            break
        if all(r["_idx"] != c["_idx"] for c in controls):
            controls.append(r)
    return ready_sample, controls, target


def strata_string(r: dict[str, Any]) -> str:
    return ";".join(f"{k}={fn(r)}" for k, fn in STRATA + STRATA_EXTRA)


def sample_rows(ready_sample: list[dict[str, Any]], controls: list[dict[str, Any]]) -> list[dict[str, str]]:
    out = []
    for i, (kind, r) in enumerate([("ready", r) for r in ready_sample] + [("rejected_control", r) for r in controls], 1):
        out.append({
            "sample_id": f"S{i:03d}", "sample_kind": kind, "strata": strata_string(r),
            "first_name": clean(r.get("first_name")), "last_name": clean(r.get("last_name")),
            "job_title": clean(r.get("job_title")) or clean(r.get("title")),
            "title_role_tier": clean(r.get("title_role_tier")), "company_name": clean(r.get("company_name")),
            "company_domain": clean(r.get("company_domain")), "headcount_num": r["headcount_num"],
            "country_norm": r["country_norm"], "linkedin_url": clean(r.get("linkedin_url")),
            "email_domain": r["email_domain"], "email_source": clean(r.get("email_source")),
            "qa_reasons": r["qa_reasons"],
            "correct_company": "", "correct_title": "", "current_employee": "", "verdict_notes": "",
        })
    return out


# ---------------------------------------------------------------------------
# Report
# ---------------------------------------------------------------------------
STATE_RX = re.compile(r"<!-- list-qa-state: (\{.*?\}) -->")
VERDICT_RX = re.compile(r"^\*\*Verdict: .*$", re.MULTILINE)


def compute_verdict(state: dict[str, Any]) -> tuple[str, str]:
    if state.get("blocked"):
        return ("BLOCKED (systemic)", "An upstream step failed, so no row in this file can be trusted. Nothing was "
                                      "cleaned or shipped, and leads.verified.csv was left untouched.")
    problems = []
    if state["ready"] == 0:
        problems.append("no row survived QA")
    if state["grade_score"] < 80:
        problems.append(f"the clean remainder grades {state['grade_letter']} ({state['grade_score']}/100), below "
                        "the B needed to ship")
    mq = state.get("manual_qa", "pending")
    if mq == "fail":
        problems.append("the manual stratified QA failed")
    if problems:
        return "NOT READY", "Do not write copy yet: " + "; ".join(problems) + ". Fix upstream and re-run."
    warn = state["critical_anomalies"] + state["warning_anomalies"]
    base = (f"{state['ready']} campaign-ready contacts across {state['companies']} companies, grade "
            f"{state['grade_letter']} ({state['grade_score']}/100).")
    if warn:
        base += (f" {state['critical_anomalies']} critical and {state['warning_anomalies']} warning anomalies lead "
                 "this report: the offending rows are already out, but fix the upstream cause before the next build.")
    if mq == "pending":
        label = "READY WITH WARNINGS, manual QA pending" if warn else "READY, manual QA pending"
        return label, base + " The stratified sample in qa-sample.csv still needs an independent reviewer."
    return ("READY WITH WARNINGS" if warn else "READY"), base + " The manual stratified QA passed."


def next_step_text(state: dict[str, Any], campaign_dir: Path) -> str:
    label, _ = compute_verdict(state)
    if label.startswith("BLOCKED"):
        return ("Route the file back to the owner named for each block above, rebuild leads.verified.csv there, then "
                "run `python list_qa.py run` again. Nothing goes to copy until the systemic check passes.")
    if label == "NOT READY":
        return ("Fix the causes above upstream (the fix-loop list says where), rebuild or re-classify, then re-run QA. "
                "After a spec-only change, `python list_qa.py run --rerun ...` re-reads "
                "leads.verified.pre-scorecard.csv. Copy waits for grade B or better and a manual QA PASS.")
    if "pending" in label:
        return (f"Have an independent reviewer fill the reviewer columns in {SAMPLE_FILE}, then run "
                f"`python list_qa.py score-sample --dir {campaign_dir} --sample <reviewed file>`. Grade B or better "
                "plus a manual QA PASS clears the list for copy (/campaign-copywriting).")
    return ("Grade B or better and the manual QA passed: move to copy (/campaign-copywriting), then upload as a paused "
            "draft on the sending platform (/cold-email-kickoff Step 6). Fix any warnings above upstream before the "
            "next build.")


def md_table(headers: list[str], rows: list[list[Any]]) -> list[str]:
    out = ["| " + " | ".join(headers) + " |", "|" + "|".join("---" for _ in headers) + "|"]
    out += ["| " + " | ".join(str(c) for c in row) + " |" for row in rows]
    return out


def replace_section(text: str, header: str, body: str) -> str:
    lines = text.split("\n")
    try:
        start = lines.index(header)
    except ValueError:
        return text.rstrip("\n") + f"\n\n{header}\n\n{body.strip()}\n"
    end = next((i for i in range(start + 1, len(lines)) if lines[i].startswith("## ")), len(lines))
    new = lines[:start] + [header, "", body.strip(), ""] + lines[end:]
    return "\n".join(new)


def state_comment(state: dict[str, Any]) -> str:
    return f"<!-- list-qa-state: {json.dumps(state, sort_keys=True)} -->"


def write_blocked_report(path: Path, campaign_dir: Path, input_path: Path, n: int, blocks: list[dict[str, Any]],
                         spec: dict[str, Any]) -> None:
    state = {"blocked": True, "input_rows": n}
    label, why = compute_verdict(state)
    lines = [f"# List QA report: {campaign_dir.name}", "", f"**Verdict: {label}.** {why}", "", state_comment(state), "",
             f"What this is: the final quality gate on this campaign's send file ({input_path.name}, {n} rows, "
             f"targeting spec {clean(spec.get('spec_version')) or '(no spec_version)'}). Generated {now_iso()} by "
             "list_qa.py. The checks below are systemic: each one means an upstream step failed, so dropping the bad "
             "rows here would hide the fault.", "", "## Systemic blocks", ""]
    for i, b in enumerate(blocks, 1):
        rows = b["rows"]
        lines += [f"### {i}. {b['title']}", "",
                  f"- **Rows affected:** {len(rows)} of {n} ({pct(len(rows), n)}).",
                  f"- **Owning upstream step:** {b['owner']}.",
                  f"- **What we found:** {b['detail']}",
                  "- **Examples:** " + "; ".join(row_label(r) for r in rows[:5]) + ".",
                  f"- **Fix:** {b['fix']}", ""]
    lines += ["## Next step", "", next_step_text(state, campaign_dir), ""]
    path.write_text("\n".join(lines), encoding="utf-8")


def build_report(ctx: Context, campaign_dir: Path, input_path: Path, rows: list[dict[str, Any]],
                 ready: list[dict[str, Any]], routed: dict[str, list[dict[str, Any]]], anomalies: list[dict[str, Any]],
                 grade: dict[str, Any], sample_info: dict[str, Any], checks: dict[str, Any],
                 state: dict[str, Any]) -> str:
    n = len(rows)
    label, why = compute_verdict(state)
    spec = ctx.spec
    L: list[str] = [f"# List QA report: {campaign_dir.name}", "", f"**Verdict: {label}.** {why}", "",
                    state_comment(state), "",
                    f"What this is: the final quality gate on this campaign's send file. It checked all {n} rows of "
                    f"{input_path.name} against the targeting spec ({clean(spec.get('spec_version')) or 'no spec_version'}, "
                    f"status {clean(spec.get('status')) or 'unknown'}), removed or parked the rows that failed, and "
                    f"graded what is left. Generated {now_iso()} by list_qa.py. Read the verdict and the anomalies "
                    "first; the detail follows.", ""]

    # (2) anomalies
    L += ["## Anomalies (critical first)", ""]
    if not anomalies:
        L += ["None. The list's shape matches the spec's expectations for size, geography, title fit, headcount "
              "coverage, buyer tiers and duplicates.", ""]
    for a in anomalies:
        L += [f"- **{a['level']}: {a['title']}.**", f"  - Attribution: {a['attribution']}", f"  - Fix: {a['fix']}"]
    if anomalies:
        L += ["", "Anomalies never block by themselves: the offending rows were already rejected row by row. They "
                  "lead the report because the cause sits upstream and will repeat on the next build.", ""]

    # (3) what we built
    companies = len({r["company_domain_norm"] or r["email_domain"] for r in ready})
    L += ["## What we built", "",
          f"**{plural(len(ready), 'campaign-ready contact')} across {plural(companies, 'company', 'companies')}**, "
          f"out of {plural(n, 'input row')}. Rejected: {len(routed['rejected'])}. Review queue: "
          f"{len(routed['review'])}. Catch-all holdback: {len(routed['holdback'])}. Stagger queue (a later wave): "
          f"{len(routed['stagger'])}. Nothing was deleted: the untouched input is in {PRE_FILE}.", "",
          "What was checked on every row:", ""]
    L += [f"- {c}" for c in checks["lines"]]
    L += [""]

    # (4) distributions
    L += ["## Distributions", "",
          "Input is every row before cleanup (to catch provider or filter leaks); campaign-ready is the rewritten "
          f"{LEADS_FILE}.", ""]
    for name, fn in DIST_SPECS:
        cin = Counter(fn(r) for r in rows)
        cout = Counter(fn(r) for r in ready)
        values = ordered_values(name, cin, ctx.bands)
        L += [f"### {name}", ""]
        L += md_table(["Value", "Input", "Input %", "Campaign-ready", "Ready %"],
                      [[v, cin[v], pct(cin[v], n), cout.get(v, 0), pct(cout.get(v, 0), len(ready))] for v in values])
        L += [""]

    # (5) removed during QA
    rej = routed["rejected"]
    L += ["## Removed during QA", "",
          f"{plural(len(rej), 'row')} rejected and written to {REJECTED_FILE} with their reasons. A row can carry "
          "more than one reason, so the categories can add up to more than the total.", ""]
    cat_rows = []
    for cat, prefixes in REMOVAL_CATEGORIES:
        k = sum(1 for r in rej if any(lv == "FAIL" and c.startswith(prefixes) for _, lv, c in r["_codes"]))
        cat_rows.append([cat, k])
    L += md_table(["Reason", "Rows"], cat_rows) + [""]
    codes = Counter(c for r in rej for _, lv, c in r["_codes"] if lv == "FAIL")
    if codes:
        L += ["By exact reason code:", ""]
        L += md_table(["Reason code", "Rows"], [[f"`{c}`", k] for c, k in codes.most_common()]) + [""]
    L += ["Routed, not removed:", "",
          f"- Review queue ({REVIEW_FILE}): {len(routed['review'])}. A person confirms each one "
          f"({sample_info['review_added']} added, {sample_info['review_skipped']} already there).",
          f"- Catch-all holdback ({HOLDBACK_FILE}): {len(routed['holdback'])}. Verified catch-alls wait for the "
          "Catch-All Timing gate (about 2 to 3 weeks of positive sending on the sending domains).",
          f"- Stagger queue ({STAGGER_FILE}): {len(routed['stagger'])}. Contacts over the "
          f"{ctx.max_contacts or 'unset'}-per-company cap, kept for a later wave.", ""]

    # (6) six-dimension table
    L += ["## Six-dimension row gate", "", "Every input row, per dimension. The worst dimension decides the row: FAIL "
          "rejects it, REVIEW parks it, WARN ships it flagged.", ""]
    six = []
    for dim, title in DIMENSIONS:
        c = Counter(r[dim] for r in rows)
        six.append([title, c["PASS"], c["WARN"], c["REVIEW"], c["FAIL"], c["N/A"]])
    L += md_table(["Dimension", "PASS", "WARN", "REVIEW", "FAIL", "N/A"], six) + [""]
    warn_codes = Counter(c for r in ready for _, lv, c in r["_codes"] if lv in ("WARN", "INFO"))
    if warn_codes:
        L += ["Flags on the campaign-ready rows (they ship, flagged): "
              + ", ".join(f"`{c}` {k}" for c, k in warn_codes.most_common()) + ".", ""]

    # (7) nine-dimension grade
    L += ["## Nine-dimension grade", "",
          f"**Grade {grade['letter']} ({grade['score']}/100)** on the {len(ready)} campaign-ready rows: a weighted "
          f"average over total weight {grade['total_weight']} (verification, source signal integrity and ICP fit "
          "count double; source signal integrity drops out when it is N/A). A+ is 97 and up, A 90 to 96, B 80 to 89, "
          "C 70 to 79, D 60 to 69, F below 60.", ""]
    L += md_table(["#", "Dimension", "Score", "Weight", "Note"],
                  [[i, d["name"], "N/A" if d["score"] is None else f"{d['score']}/100", f"{d['weight']}x", d["note"]]
                   for i, d in enumerate(grade["dims"], 1)])
    li = sum(1 for r in ready if clean(r.get("linkedin_url")))
    L += ["", f"LinkedIn coverage (reported, not graded): {li} of {len(ready)} campaign-ready rows "
              f"({pct(li, len(ready))}).", ""]

    # (8) manual QA
    L += ["## Manual stratified QA", "", manual_pending_text(sample_info, campaign_dir), ""]

    # (9) issues
    L += ["## Issues caught and fix-loop recommendations", ""]
    L += [f"{i}. {t}" for i, t in enumerate(issue_lines(anomalies, rej, routed, grade, ready, checks), 1)] + [""]

    # (10) next step
    L += ["## Next step", "", next_step_text(state, campaign_dir), ""]
    return "\n".join(L)


def manual_pending_text(info: dict[str, Any], campaign_dir: Path) -> str:
    over = ""
    if info["ready_rows"] > info["target"]:
        over = (f" The target was {info['target']} rows; covering every stratum value took {info['ready_rows']}, and "
                "coverage wins over the target.")
    return (f"**Status: awaiting reviewer.** Sample drawn: {SAMPLE_FILE} with {info['ready_rows']} campaign-ready "
            f"rows plus {info['controls']} rejected rows as a false-negative control (seed {info['seed']}).{over}\n\n"
            "The ready rows are stratified across buyer tier, company size band, country, email source, title "
            "classifier (rules or AI), source arm and wave slot: every value present gets at least one row "
            "(AI-classified and promoted-fallback rows first), and the rest are filled at random in proportion to "
            "buyer tier.\n\n"
            "How to review: give the file to a person, or to a fresh Claude sub-agent that has not seen the classifier "
            "verdicts (hide the title_role_tier and qa_reasons columns from a blind reviewer). For each row fill "
            "correct_company, correct_title and current_employee with yes, no or unsure; verdict_notes is free text. "
            f"Then run `python list_qa.py score-sample --dir {campaign_dir} --sample <reviewed file>`.\n\n"
            "Pass bar: at least 90% yes on correct company and on correct title, at least 90% on current employee once "
            "5 or more answers are determinable (unsure answers are left out), and no systematic failure (3 or more "
            "ready rows with a no that share one stratum value).")


def issue_lines(anomalies: list[dict[str, Any]], rej: list[dict[str, Any]], routed: dict[str, list[dict[str, Any]]],
                grade: dict[str, Any], ready: list[dict[str, Any]], checks: dict[str, Any]) -> list[str]:
    out = [f"{a['level']}: {a['title']}. Fix: {a['fix']}" for a in anomalies]

    def count(prefixes: tuple[str, ...]) -> list[dict[str, Any]]:
        return [r for r in rej if any(lv == "FAIL" and c.startswith(prefixes) for _, lv, c in r["_codes"])]

    def top_source(rs: list[dict[str, Any]]) -> str:
        v, k = Counter(email_source(r) for r in rs).most_common(1)[0]
        return f" ({k} of {len(rs)} from email source {v})"

    pointers = [
        (("suppressed", "contact_excluded"), "Suppression matches",
         "Normal: the suppression list keeps growing from live campaigns. A large share means the waterfall's "
         "suppression cross-check ran on a stale list; re-run it before enrichment spend next time."),
        (("broken_name",), "Broken names", "Owner: contact discovery; check that source's name quality."),
        (("wrong_company",), "Wrong company",
         "The provider's current-employer field names another company. Owner: contact discovery; re-discover from "
         "a current-employer source."),
        (("title_",), "Failed title fit",
         "Owner: the targeting spec and the people search; fix the spec, re-run title_classify.py, and tighten the "
         "search titles."),
        (("headcount_out_of_range", "out_of_geography", "excluded_industry", "excluded_account"),
         "Out of ICP or an excluded account", "Owner: company discovery filters (/tam-build)."),
        (("duplicate_of",), "Duplicates", "Owner: the email waterfall's de-duplication step."),
        (("already_active",), "Already active in another campaign",
         "Owner: the cross-campaign de-duplication before enrichment spend."),
        (("personal_email",), "Personal email under a fail policy", "Owner: the email finder rungs."),
    ]
    for prefixes, label, text in pointers:
        rs = count(prefixes)
        if rs:
            out.append(f"{label}: {plural(len(rs), 'row')}{top_source(rs)}. {text}")
    if routed["review"]:
        reasons = Counter(first_review_code(r) for r in routed["review"])
        out.append(f"Review queue: {plural(len(routed['review']), 'row')} for a person to confirm in {REVIEW_FILE} ("
                   + ", ".join(f"{k} {v}" for k, v in reasons.most_common()) + ").")
    for d in grade["dims"]:
        if d["score"] is not None and d["score"] < 100 and ready:
            out.append(f"Grade dimension '{d['name']}' scored {d['score']}/100: {d['note']}.")
    li_missing = sum(1 for r in ready if not clean(r.get("linkedin_url")))
    if li_missing:
        out.append(f"{li_missing} campaign-ready rows have no LinkedIn URL. Backfill through the email waterfall's "
                   "LinkedIn backfill (the `layers.linkedin_backfill` order in provider-routing.yaml); a blank beats "
                   "a wrong URL.")
    out += checks.get("warnings", [])
    if not out:
        out.append("No issues beyond routine removals. The list is clean on every check above.")
    return out


# ---------------------------------------------------------------------------
# Commands
# ---------------------------------------------------------------------------
def cmd_run(args: argparse.Namespace) -> int:
    campaign_dir = Path(args.dir)
    if not campaign_dir.is_dir():
        raise QAError(f"--dir {campaign_dir} is not a folder")
    spec_path = Path(args.spec)
    if not spec_path.exists():
        raise QAError(f"--spec {spec_path} not found")
    try:
        spec = load_spec(spec_path, args.allow_draft)
    except SpecError as exc:
        raise QAError(f"SPEC ERROR: {exc}") from exc
    ctx = build_context(spec, spec_path, campaign_dir)
    supp_path, auto = resolve_suppression(args.suppression, campaign_dir)
    supp = load_suppression(supp_path, auto)
    active, active_notes = load_active_leads(args.active_leads or [])
    companies = load_companies(Path(args.companies) if args.companies else None)

    leads_path = Path(args.leads) if args.leads else campaign_dir / LEADS_FILE
    pre_path = campaign_dir / PRE_FILE
    out_path = campaign_dir / LEADS_FILE
    if not leads_path.exists():
        raise QAError(f"leads file not found: {leads_path}")
    header, rows = read_csv(leads_path)
    if "qa_status" in header:
        if not args.rerun:
            raise QAError(f"{leads_path.name} already has a qa_status column, so it was QA'd already. Pass --rerun to "
                          f"re-run from {PRE_FILE}. If this file is an edited export from the list workbench, do not "
                          "use --rerun (it would drop the edits): strip the QA columns and run without it.")
        if not pre_path.exists():
            raise QAError(f"--rerun needs {pre_path}, which does not exist")
        input_path = pre_path
        header, rows = read_csv(pre_path)
    else:
        input_path = leads_path
        if leads_path.resolve() != pre_path.resolve():
            shutil.copyfile(leads_path, pre_path)

    # Step 1
    blocks = systemic_blocks(header, rows)
    report_path = campaign_dir / REPORT_FILE
    if blocks:
        write_blocked_report(report_path, campaign_dir, input_path, len(rows), blocks, spec)
        print(json.dumps({"ok": False, "blocked": True, "blocks": [b["check"] for b in blocks],
                          "rows_affected": {b["check"]: len(b["rows"]) for b in blocks}, "report": str(report_path)}))
        return EXIT_BLOCKED

    # Steps 2 and 3
    normalize_rows(rows, ctx, companies)
    try:
        classified = classify_missing_titles(rows, spec, header)
    except SpecError as exc:
        raise QAError(f"SPEC ERROR (needed to classify {sum(1 for r in rows if not clean(r.get('title_status')))} "
                      f"unclassified titles): {exc}") from exc
    for r in rows:
        gate_row(r, ctx, supp, active)
        finalize_row(r)

    # Steps 4 and 5
    dedupe(rows)
    apply_density(rows, ctx.max_contacts)
    for r in rows:
        set_reasons(r)

    # Step 6
    extra = ["person_id"] + (TITLE_OUT_COLUMNS if classified else []) + COMPANION_COLUMNS + QA_COLUMNS
    out_header = merged_header(header, extra)
    routed: dict[str, list[dict[str, Any]]] = {k: [r for r in rows if r["qa_status"] == k]
                                               for k in ("pass", "rejected", "review", "holdback", "stagger")}
    ready = routed["pass"]
    write_csv(out_path, out_header, ready)
    write_csv(campaign_dir / REJECTED_FILE, out_header, routed["rejected"])
    for r in routed["review"]:
        r["review_reason"] = first_review_code(r)
    for r in routed["holdback"]:
        r["holdback_reason"] = "catch_all_unresolved"
    for r in routed["stagger"]:
        r["stagger_reason"] = "density_overflow"
    rejudged = ({clean(r.get("person_id")) for r in rows} - {""}, {r["email_norm"] for r in rows} - {""})
    rv_added, rv_skipped = append_queue(campaign_dir / REVIEW_FILE, out_header + ["review_reason"], routed["review"],
                                        rejudged)
    append_queue(campaign_dir / HOLDBACK_FILE, out_header + ["holdback_reason"], routed["holdback"], rejudged)
    append_queue(campaign_dir / STAGGER_FILE, out_header + ["stagger_reason"], routed["stagger"], rejudged)

    # Steps 7 and 8
    anomalies = find_anomalies(rows, ready, ctx)
    grade = nine_dimension_grade(ready, args.signal_copy)

    # Step 9
    ready_sample, controls, target = draw_sample(ready, routed["rejected"], args.sample_size, args.seed)
    write_csv(campaign_dir / SAMPLE_FILE, SAMPLE_COLUMNS, sample_rows(ready_sample, controls))
    sample_info = {"ready_rows": len(ready_sample), "controls": len(controls), "target": target, "seed": args.seed,
                   "review_added": rv_added, "review_skipped": rv_skipped}

    checks = describe_checks(ctx, supp, active, active_notes, rows, classified, args)
    companies_n = len({r["company_domain_norm"] or r["email_domain"] for r in ready})
    state = {"blocked": False, "input_rows": len(rows), "ready": len(ready), "companies": companies_n,
             "grade_score": grade["score"], "grade_letter": grade["letter"],
             "critical_anomalies": sum(1 for a in anomalies if a["level"] == "CRITICAL"),
             "warning_anomalies": sum(1 for a in anomalies if a["level"] == "WARNING"), "manual_qa": "pending"}
    report = build_report(ctx, campaign_dir, input_path, rows, ready, routed, anomalies, grade, sample_info, checks,
                          state)
    report_path.write_text(report, encoding="utf-8")
    label, _ = compute_verdict(state)
    print(json.dumps({"ok": True, "verdict": label, "input_rows": len(rows), "ready": len(ready),
                      "rejected": len(routed["rejected"]), "review": len(routed["review"]),
                      "holdback": len(routed["holdback"]), "stagger": len(routed["stagger"]),
                      "grade": grade["letter"], "score": grade["score"],
                      "critical_anomalies": state["critical_anomalies"], "warning_anomalies": state["warning_anomalies"],
                      "sample_rows": len(ready_sample) + len(controls), "report": str(report_path)}))
    return EXIT_OK


def describe_checks(ctx: Context, supp: Suppression, active: set[str], active_notes: list[str],
                    rows: list[dict[str, Any]], classified: int, args: argparse.Namespace) -> dict[str, Any]:
    warnings = []
    hc = (f"{fmt_num(ctx.hc_min) or 'no floor'} to {fmt_num(ctx.hc_max) or 'no ceiling'} "
          f"(borderline {fmt_num(ctx.borderline_pct)}%)") if (ctx.hc_min is not None or ctx.hc_max is not None) \
        else "no headcount gate in the spec"
    geo = ", ".join(sorted(ctx.countries_in)) or "any country"
    if ctx.countries_out:
        geo += "; never " + ", ".join(sorted(ctx.countries_out))
    excl = ", ".join(f"{k} {len(v)}" for k, v in ctx.exclusions.items()) or "none listed"
    joined = Counter(r["headcount_source"] for r in rows)
    lines = [
        "Systemic check passed: every row is `valid` by the email verifier or a verified catch-all, no contact came "
        "from a SERP, Google search or pattern-built source, and no row is ineligible by lead scoring.",
        f"ICP fit: headcount {hc}; geography {geo}; {plural(len(ctx.industries_out), 'excluded industry term')}; "
        "excluded "
        f"accounts ({excl}). Headcount came from the row for {joined['row']}, from the company file for "
        f"{joined['companies_file']}, and is missing for {joined['missing']}.",
        "Title and function fit against the spec's "
        + plural(len((ctx.spec.get("buyers") or {}).get("function_families") or []), "function family",
                 "function families")
        + f": {classified} classified here by title_classify.py rules, {len(rows) - classified} carried from "
        "upstream.",
        "Seniority and buyer tier on every passing title (adjacent and weak buyers ship, flagged low).",
        f"Company and domain match: the provider's current-employer domain, personal email policy "
        f"({ctx.personal_policy}), email domain against company domain, and 'at Company' titles.",
        "Contact quality: catch-all status, name integrity (blank, email or URL in a name, digits, department "
        "words, first name equal to last name or to the company), initials, role mailboxes and LinkedIn coverage.",
    ]
    if supp.found:
        lines.append(f"Suppression: {supp.path.name if supp.path else ''} ({supp.entries} entries"
                     f"{', auto-detected' if supp.auto_detected else ''}) matched on email, LinkedIn, hostile or "
                     "company-level domain, and company name; plus the spec's contact exclusions.")
    else:
        where = f" at {supp.path}" if supp.path else ""
        lines.append(f"Suppression: no suppression list found{where}, so only the spec's contact exclusions ran.")
        warnings.append(f"No suppression list was checked{where}. Pass --suppression "
                        "profiles/<client>/suppression-list.csv once it exists, or confirm the client has none yet.")
    if active_notes:
        lines.append(f"Cross-campaign duplicates against {plural(len(active_notes), 'active-lead file')} "
                     f"({plural(len(active), 'email')}): "
                     + "; ".join(active_notes) + ".")
    else:
        lines.append("Cross-campaign duplicates: no --active-leads export was passed, so this was not checked.")
        warnings.append("No --active-leads export was checked. Export the client's active leads from the sending "
                        "platform (run_state.sending_platform) and re-run with --active-leads to rule out "
                        "cross-campaign duplicates.")
    lines.append(f"Duplicates by email, LinkedIn and name plus company domain; account density capped at "
                 f"{ctx.max_contacts or 'no cap'} campaign-ready contacts per company.")
    lines += [f"Also loaded: {n}." for n in ctx.notes]
    return {"lines": lines, "warnings": warnings}


def normalize_answer(value: Any) -> str:
    v = clean(value).lower()
    if v in {"yes", "y", "true", "1", "correct"}:
        return "yes"
    if v in {"no", "n", "false", "0", "wrong", "incorrect"}:
        return "no"
    if v in {"unsure", "?", "maybe", "unknown", "not sure", "n/a", "na"}:
        return "unsure"
    return ""


def parse_strata(value: str) -> dict[str, str]:
    out = {}
    for part in clean(value).split(";"):
        if "=" in part:
            k, v = part.split("=", 1)
            out[k.strip()] = v.strip()
    return out


def cmd_score_sample(args: argparse.Namespace) -> int:
    campaign_dir = Path(args.dir)
    report_path = campaign_dir / REPORT_FILE
    sample_path = Path(args.sample) if args.sample else campaign_dir / SAMPLE_FILE
    if not report_path.exists():
        raise QAError(f"{report_path} not found: run `list_qa.py run` first")
    if not sample_path.exists():
        raise QAError(f"sample file not found: {sample_path}")
    header, rows = read_csv(sample_path)
    missing = [c for c in ("sample_kind", "correct_company", "correct_title", "current_employee") if c not in header]
    if missing:
        raise QAError(f"{sample_path.name} is missing columns: {', '.join(missing)}")
    ready = [r for r in rows if clean(r.get("sample_kind")) == "ready"]
    controls = [r for r in rows if clean(r.get("sample_kind")) == "rejected_control"]
    questions = [("correct_company", "correct company"), ("correct_title", "correct title"),
                 ("current_employee", "current employee")]
    stats = {}
    for col, _ in questions:
        answers = [normalize_answer(r.get(col)) for r in ready]
        yes, no, unsure = answers.count("yes"), answers.count("no"), answers.count("unsure")
        stats[col] = {"yes": yes, "no": no, "unsure": unsure, "det": yes + no, "blank": answers.count("")}
    company_ok = stats["correct_company"]["det"] > 0 and share(stats["correct_company"]["yes"],
                                                               stats["correct_company"]["det"]) >= 0.90
    title_ok = stats["correct_title"]["det"] > 0 and share(stats["correct_title"]["yes"],
                                                           stats["correct_title"]["det"]) >= 0.90
    emp = stats["current_employee"]
    emp_judged = emp["det"] >= 5
    emp_ok = (not emp_judged) or share(emp["yes"], emp["det"]) >= 0.90

    for r in ready:
        r["_strata"] = parse_strata(r.get("strata", ""))
        if clean(r.get("email_source")):
            r["_strata"].setdefault("email_source", clean(r.get("email_source")))
    keys = {k for r in ready for k in r["_strata"]}
    uniform = {k for k in keys if len({r["_strata"].get(k, "") for r in ready}) <= 1}
    failing = [r for r in ready if any(normalize_answer(r.get(c)) == "no" for c, _ in questions)]
    by_value: dict[tuple[str, str], list[str]] = defaultdict(list)
    for r in failing:
        for k, v in r["_strata"].items():
            if k not in uniform:
                by_value[(k, v)].append(clean(r.get("sample_id")))
    systematic = sorted(((k, v, ids) for (k, v), ids in by_value.items() if len(ids) >= 3),
                        key=lambda x: (-len(x[2]), x[0], x[1]))
    passed = company_ok and title_ok and emp_ok and not systematic
    false_neg = [r for r in controls if all(normalize_answer(r.get(c)) == "yes" for c, _ in questions)]

    L = [f"**Result: {'PASS' if passed else 'FAIL'}** (scored {now_iso()} from {sample_path.name}; "
         f"{len(ready)} campaign-ready rows and {len(controls)} rejected controls).", ""]
    for col, label in questions:
        s = stats[col]
        L.append(f"- {s['yes']}/{s['det']} {label} ({pct(s['yes'], s['det'])}; {s['unsure']} unsure and "
                 f"{s['blank']} blank answers left out)")
    if not emp_judged:
        L.append(f"- Current employee is not judged: only {emp['det']} determinable answers (5 needed).")
    L += ["", "Pass bar: at least 90% yes on correct company and correct title, at least 90% on current employee "
              "once 5 or more answers are determinable, and no systematic failure (3 or more ready rows with a no "
              "that share one stratum value; a value every sampled row shares is not counted).", ""]
    if not ready or stats["correct_company"]["det"] == 0 or stats["correct_title"]["det"] == 0:
        L += ["The reviewer columns are empty or all unsure, so the sample cannot pass yet.", ""]
    if systematic:
        L += ["Systematic failures (rows with at least one no, grouped by the stratum value they share):", ""]
        L += [f"- `{k}={v}`: {len(ids)} rows ({', '.join(ids)})" for k, v, ids in systematic]
        L += [""]
    else:
        L += ["Systematic failures: none.", ""]
    if false_neg:
        L += [f"Possible false negatives: the reviewer marked {len(false_neg)} rejected-control rows all yes ("
              + ", ".join(f"{clean(r.get('sample_id'))} rejected for {clean(r.get('qa_reasons')) or 'unknown'}"
                          for r in false_neg)
              + "). Check whether the rule that rejected them is too strict.", ""]
    elif controls:
        L += [f"Rejected controls: none of the {len(controls)} was marked all yes, so no false negatives surfaced.", ""]
    fixes = []
    if stats["correct_company"]["no"]:
        fixes.append("company no answers point to contact discovery or the company join (wrong domain or a stale "
                     "employer); check the email source or arm named above")
    if stats["correct_title"]["no"]:
        fixes.append("title no answers point to the targeting spec: fix the function families or tiers and re-run "
                     "title_classify.py")
    if emp["no"]:
        fixes.append("current-employee no answers point to stale discovery data: re-discover from a current-employer "
                     "source")
    if fixes:
        L += ["Fix loop: " + "; ".join(fixes) + ". Then re-run `list_qa.py run --rerun`, draw a new sample and score it "
                                                "again.", ""]

    text = report_path.read_text(encoding="utf-8")
    m = STATE_RX.search(text)
    state = json.loads(m.group(1)) if m else {"blocked": False, "ready": 0, "companies": 0, "grade_score": 0,
                                              "grade_letter": "F", "critical_anomalies": 0, "warning_anomalies": 0}
    state["manual_qa"] = "pass" if passed else "fail"
    label, why = compute_verdict(state)
    text = replace_section(text, "## Manual stratified QA", "\n".join(L))
    text = replace_section(text, "## Next step", next_step_text(state, campaign_dir))
    text = VERDICT_RX.sub(lambda _: f"**Verdict: {label}.** {why}", text, count=1)
    if m:
        text = STATE_RX.sub(lambda _: state_comment(state), text, count=1)
    report_path.write_text(text, encoding="utf-8")
    print(json.dumps({"ok": passed, "manual_qa": state["manual_qa"], "verdict": label,
                      **{f"{col}_yes": stats[col]["yes"] for col, _ in questions},
                      **{f"{col}_determinable": stats[col]["det"] for col, _ in questions},
                      "systematic": [f"{k}={v}" for k, v, _ in systematic],
                      "possible_false_negatives": len(false_neg), "report": str(report_path)}))
    return EXIT_OK if passed else EXIT_QA_FAIL


def parse_args(argv: list[str]) -> argparse.Namespace:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="command", required=True)
    run = sub.add_parser("run", help="QA a campaign's verified send file")
    run.add_argument("--dir", required=True, help="campaign folder (profiles/<slug>/campaigns/<campaign>)")
    run.add_argument("--spec", required=True, help="targeting-spec.yaml")
    run.add_argument("--leads", help=f"input file (default <dir>/{LEADS_FILE})")
    run.add_argument("--companies", help="company file (tam.csv) to join missing headcount, country and industry")
    run.add_argument("--suppression", help="suppression-list.csv (default: auto-detect profiles/<slug>/suppression-list.csv)")
    run.add_argument("--active-leads", nargs="+", action="extend", default=[],
                     help="the sending platform's lead exports, for cross-campaign duplicates (the export's column "
                          "names are UNVERIFIED for the current platform; the email column is auto-detected)")
    run.add_argument("--signal-copy", action="store_true", help="the copy states a row-level signal (scores dimension 5)")
    run.add_argument("--sample-size", type=int, help="manual QA sample size (default 25, 50 or 100 by list size)")
    run.add_argument("--seed", type=int, default=7)
    run.add_argument("--rerun", action="store_true", help=f"re-run QA from <dir>/{PRE_FILE}")
    run.add_argument("--allow-draft", action="store_true", help="accept a draft targeting spec (dry runs only)")
    sc = sub.add_parser("score-sample", help="score a reviewed manual QA sample")
    sc.add_argument("--dir", required=True)
    sc.add_argument("--sample", help=f"reviewed sample CSV (default <dir>/{SAMPLE_FILE})")
    return ap.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(sys.argv[1:] if argv is None else argv)
    try:
        if args.command == "run":
            return cmd_run(args)
        return cmd_score_sample(args)
    except QAError as exc:
        print(json.dumps({"ok": False, "error": str(exc)}, ensure_ascii=False), file=sys.stderr)
        return EXIT_ERROR


if __name__ == "__main__":
    raise SystemExit(main())
