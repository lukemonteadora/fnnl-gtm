#!/usr/bin/env python3
"""Deterministic title and function classifier for list production.

Reads a contacts CSV and the client's targeting spec
(profiles/<slug>/targeting-spec.yaml, template in
outbound/reference/targeting-spec-template.yaml) and classifies every title on
FUNCTION and SENIORITY separately, then maps the pair to a buyer role tier:

    exact (buyer P1), strong (P2), influencer (P3), adjacent (P4), weak (P5),
    unrelated or excluded (not a buyer).

Rules run first. Only titles the rules cannot decide are marked `ambiguous`,
de-duplicated by normalized title, and written to a queue for an AI pass (in
this workspace that pass is Claude Code sub-agents, never a model API: the
no-AI-API rule in CLAUDE.md section 7). The
AI verdicts are merged back with --merge-ai, so a title that appears 100 times
costs one verdict. A blank title is `missing`, never a fail.

Seniority words alone never pass a title: "Head of Engineering" fails when the
target function is Revenue Operations, even though "Head" is a target seniority.

This script makes no network calls and spends nothing.

Classify:
    python title_classify.py --spec <targeting-spec.yaml> --contacts <in.csv> \
        --out <out.csv> [--companies tam.csv] [--title-col job_title] \
        [--ambiguous-out <queue.csv>] [--report <report.md>] \
        [--emit-scoring-tiers] [--allow-draft]

Merge AI verdicts for the ambiguous titles:
    python title_classify.py --spec <spec> --contacts <classified.csv> \
        --merge-ai <ai.csv> --out <out.csv> [--emit-scoring-tiers]
"""

from __future__ import annotations

import argparse
import csv
import re
import sys
from collections import Counter
from pathlib import Path
from typing import Any

try:
    import yaml
except ImportError as exc:  # pragma: no cover - environment error
    raise SystemExit("PyYAML is required: python -m pip install pyyaml") from exc


TIERS = ["exact", "strong", "influencer", "adjacent", "weak"]
BUYER_PRIORITY = {"exact": "P1", "strong": "P2", "influencer": "P3", "adjacent": "P4", "weak": "P5"}
SENIORITY_ORDER = ["owner_founder", "c_level", "vp", "head", "director", "manager", "individual"]

# Acronyms and synonyms expanded before any matching, so a pattern written one
# way matches every spelling. Keys are whole words on the normalized title.
EXPANSIONS = {
    "ceo": "chief executive officer",
    "coo": "chief operations officer",
    "cfo": "chief financial officer",
    "cro": "chief revenue officer",
    "cmo": "chief marketing officer",
    "cto": "chief technology officer",
    "cio": "chief information officer",
    "ciso": "chief information security officer",
    "chro": "chief human resources officer",
    "cao": "chief administrative officer",
    "vp": "vice president",
    "svp": "senior vice president",
    "evp": "executive vice president",
    "avp": "assistant vice president",
    "gm": "general manager",
    "dir": "director",
    "mgr": "manager",
    "sr": "senior",
    "jr": "junior",
    "ops": "operations",
    "revops": "revenue operations",
    "salesops": "sales operations",
    "hr": "human resources",
    "it": "information technology",
    "cx": "customer experience",
    "gtm": "go to market",
    "bd": "business development",
    "biz": "business",
    "cofounder": "co founder",
    "cmio": "chief medical information officer",
    "cnio": "chief nursing information officer",
}
# Multi-word synonyms applied after expansion.
PHRASE_SYNONYMS = [
    ("operating officer", "operations officer"),
    ("rev ops", "revenue operations"),
    ("sales ops", "sales operations"),
    ("go-to-market", "go to market"),
]

# "administrator" is deliberately in no level: a Practice or Hospital Administrator
# runs the business in healthcare, a Systems Administrator is an IT individual
# contributor (caught by the IT non-target family). A spec that knows its
# industry places it with buyers.seniority_patterns, e.g. {head: ["administrator"]}.
BUILTIN_SENIORITY: dict[str, list[str]] = {
    "owner_founder": ["owner", "co owner", "founder", "co founder", "proprietor", "managing partner", "founding partner"],
    "c_level": ["chief", "president", "c suite", "c level", "managing director", "executive director"],
    "vp": ["vice president", "senior vice president", "executive vice president", "assistant vice president"],
    "head": ["head", "general manager"],
    "director": ["director"],
    "manager": ["manager", "supervisor"],
    "individual": ["analyst", "specialist", "associate", "coordinator", "representative", "rep",
                   "account executive", "engineer", "consultant", "agent", "clerk",
                   "technician", "assistant", "officer", "staff", "receptionist", "scheduler"],
}

# Titles that are pure leadership with no function word. Their tier depends on
# company size and comes from buyers.generic_executive in the spec.
GENERIC_EXEC_PHRASES = [
    "chief executive officer", "chief executive", "president", "owner", "co owner", "founder", "co founder",
    "managing director", "general manager", "executive director", "managing partner",
    "proprietor", "founding partner", "principal",
]
GENERIC_FILLER = {"and", "of", "the", "co", "interim", "acting", "deputy", "senior", "executive",
                  "officer", "chief", "board", "chairman", "chair", "chairwoman", "chairperson",
                  "partner", "a", "an", "global", "group", "operator", "company", "business"}

# Functions that are rarely buyers. A title matching one of these and no target
# family fails deterministically. Any family whose words overlap a target family
# is dropped automatically, so a client that targets IT can still target IT.
BUILTIN_NON_TARGET: dict[str, list[str]] = {
    "engineering": ["engineering", "engineer", "software", "developer", "devops", "architect", "firmware"],
    "technology": ["technology", "technical", "infrastructure"],
    "information_technology": ["information technology", "information officer", "information systems",
                               "systems administrator", "network"],
    "security": ["security", "cyber", "cybersecurity"],
    "data": ["data science", "data scientist", "data engineering", "machine learning", "business intelligence"],
    "legal": ["legal", "counsel", "attorney", "lawyer", "paralegal"],
    "compliance": ["compliance", "regulatory", "audit", "auditor"],
    "human_resources": ["human resources", "talent", "recruiting", "recruiter", "recruitment", "payroll",
                        "benefits", "people operations", "learning and development"],
    "finance": ["finance", "financial", "accounting", "accountant", "controller", "treasury", "tax",
                "bookkeeper", "payable", "receivable"],
    "product": ["product management", "product manager", "product owner"],
    "design": ["designer", "ux", "ui"],
    "clinical": ["nurse", "nursing", "physician", "clinician", "therapist", "pharmacist", "dentist", "surgeon"],
    "facilities": ["facilities", "maintenance", "janitorial", "custodial"],
    "education": ["teacher", "professor", "faculty", "lecturer"],
}

# Status words that fail a title outright, even beside a target role
# ("Retired President and CEO"). Every other title_exclusions entry is a ROLE
# exclusion: it fails a pure match, but a title that also carries a target
# function or a general leadership phrase ("CEO and Medical Director") goes to
# the AI review queue instead, because the person may still be the buyer.
ABSOLUTE_EXCLUSIONS = {"intern", "internship", "student", "trainee", "apprentice", "retired", "former", "ex",
                       "volunteer", "seeking", "looking for", "open to work", "emeritus"}

_WORD_RE = re.compile(r"[^a-z0-9 ]+")
_AT_COMPANY_RE = re.compile(r"\s+(?:at|@)\s+(.+)$", re.IGNORECASE)


class SpecError(Exception):
    """The targeting spec is missing or malformed."""


def normalize_title(raw: str, expansions: dict[str, str] | None = None) -> str:
    """Lowercase, drop company suffixes and punctuation, expand acronyms."""
    expansions = EXPANSIONS if expansions is None else expansions
    t = (raw or "").strip().lower()
    if not t:
        return ""
    t = re.sub(r"\s+(at|@)\s+.*$", "", t)            # "VP Sales at Acme" -> "vp sales"
    t = t.replace("&", " and ").replace("/", " and ").replace("+", " and ")
    t = t.replace("-", " ").replace("_", " ")
    t = _WORD_RE.sub(" ", t)
    words = [expansions.get(w, w) for w in t.split()]
    t = " ".join(words)
    for a, b in PHRASE_SYNONYMS:
        t = re.sub(rf"\b{re.escape(a)}\b", b, t)
    return re.sub(r"\s+", " ", t).strip()


def _has_phrase(text: str, phrase: str) -> bool:
    return bool(phrase) and re.search(rf"\b{re.escape(phrase)}\b", text) is not None


def parse_headcount(value: Any) -> float | None:
    """Accept 120, "120", "51-200", "51 to 200", "10001+"; return a representative number."""
    if value is None:
        return None
    s = str(value).strip().replace(",", "")
    if not s:
        return None
    try:
        return float(s)
    except ValueError:
        pass
    nums = [float(n) for n in re.findall(r"\d+(?:\.\d+)?", s)]
    if not nums:
        return None
    if len(nums) >= 2:
        return (nums[0] + nums[1]) / 2
    return nums[0]


class Classifier:
    def __init__(self, spec: dict[str, Any]):
        buyers = spec.get("buyers") or {}
        if not buyers:
            raise SpecError("targeting spec has no buyers block")
        # Acronyms mean different things by industry ("CMO" is marketing in SaaS and
        # medical in healthcare), so a spec may override any expansion.
        self.expansions = dict(EXPANSIONS)
        for k, v in (buyers.get("acronym_overrides") or {}).items():
            self.expansions[str(k).strip().lower()] = str(v).strip().lower()
        norm = lambda x: normalize_title(x, self.expansions)  # noqa: E731
        self.norm = norm
        fams = buyers.get("function_families") or []
        if not fams:
            raise SpecError("targeting spec has no buyers.function_families; a title list cannot be judged without them")
        self.targets: dict[str, dict[str, list[str]]] = {}
        for fam in fams:
            fid = fam.get("id")
            if not fid:
                raise SpecError("every function family needs an id")
            inc = [norm(p) for p in fam.get("include_patterns") or [] if str(p).strip()]
            if not inc:
                raise SpecError(f"function family {fid} has no include_patterns")
            exc = [norm(p) for p in fam.get("exclude_patterns") or [] if str(p).strip()]
            self.targets[fid] = {"include": inc, "exclude": exc}

        all_target_patterns = [p for f in self.targets.values() for p in f["include"]]
        self.non_targets: dict[str, list[str]] = {}
        for nid, pats in BUILTIN_NON_TARGET.items():
            npats = [norm(p) for p in pats]
            if any(_has_phrase(tp, np_) or _has_phrase(np_, tp) for tp in all_target_patterns for np_ in npats):
                continue  # overlaps a target family: not a non-target for this client
            self.non_targets[nid] = npats
        for extra in buyers.get("non_target_functions") or []:
            nid = extra.get("id") or "custom"
            self.non_targets[nid] = [norm(p) for p in extra.get("patterns") or []]

        sen = {k: [norm(p) for p in v] for k, v in BUILTIN_SENIORITY.items()}
        for level, pats in (buyers.get("seniority_patterns") or {}).items():
            if level not in SENIORITY_ORDER:
                raise SpecError(f"unknown seniority level in seniority_patterns: {level}")
            sen[level] = sen.get(level, []) + [norm(p) for p in pats]
        # Longest pattern first, so "vice president" is consumed before "president".
        self.seniority_patterns = sorted(
            ((lvl, p) for lvl, pats in sen.items() for p in pats if p),
            key=lambda x: -len(x[1]),
        )

        self.explicit: dict[str, str] = {}
        for tier, titles in (buyers.get("explicit_titles") or {}).items():
            if tier not in TIERS:
                raise SpecError(f"explicit_titles has unknown tier {tier}")
            for t in titles or []:
                self.explicit[norm(t)] = tier

        self.rules: list[tuple[str, dict[str, Any]]] = []
        for tier in TIERS:
            for rule in (buyers.get("role_tiers") or {}).get(tier) or []:
                funcs = set(rule.get("functions") or [])
                unknown = funcs - set(self.targets)
                if unknown:
                    raise SpecError(f"role_tiers.{tier} names unknown function families: {sorted(unknown)}")
                sens = set(rule.get("seniority") or [])
                bad = sens - set(SENIORITY_ORDER)
                if bad:
                    raise SpecError(f"role_tiers.{tier} names unknown seniority levels: {sorted(bad)}")
                self.rules.append((tier, {"functions": funcs, "any": bool(rule.get("any_function")), "seniority": sens}))

        self.below_action = buyers.get("below_seniority_action", "fail")
        ge = buyers.get("generic_executive") or {}
        self.generic_default = ge.get("default_tier", "review")
        self.generic_size_rules = ge.get("size_rules") or []
        self.size_overrides = buyers.get("size_overrides") or []
        self.exclusions = [norm(p) for p in buyers.get("title_exclusions") or [] if str(p).strip()]
        self.exclusion_exceptions = {norm(t) for t in buyers.get("exclusion_exceptions") or []}
        self.authority_map = buyers.get("authority_by_seniority") or {}
        self.authority_size_rules = buyers.get("authority_size_rules") or []
        self.generic_phrases = [norm(p) for p in GENERIC_EXEC_PHRASES]

    # -- detection helpers -------------------------------------------------
    def seniority_of(self, norm: str) -> str:
        work = f" {norm} "
        found: set[str] = set()
        for level, pat in self.seniority_patterns:
            rx = re.compile(rf"\b{re.escape(pat)}\b")
            if rx.search(work):
                found.add(level)
                work = rx.sub(" _ ", work)
        for level in SENIORITY_ORDER:
            if level in found:
                return level
        return ""

    def target_functions(self, norm: str) -> list[str]:
        hits = []
        for fid, fam in self.targets.items():
            if any(_has_phrase(norm, p) for p in fam["include"]) and not any(_has_phrase(norm, p) for p in fam["exclude"]):
                hits.append(fid)
        return hits

    def non_target_function(self, norm: str) -> str:
        for nid, pats in self.non_targets.items():
            if any(_has_phrase(norm, p) for p in pats):
                return nid
        return ""

    def _has_generic_phrase(self, norm: str) -> bool:
        return any(_has_phrase(norm, p) for p in self.generic_phrases)

    def is_generic_exec(self, norm: str) -> bool:
        work = f" {norm} "
        hit = False
        for p in sorted(self.generic_phrases, key=len, reverse=True):
            rx = re.compile(rf"\b{re.escape(p)}\b")
            if rx.search(work):
                hit = True
                work = rx.sub(" ", work)
        if not hit:
            return False
        rest = [w for w in work.split() if w not in GENERIC_FILLER]
        return not rest

    @staticmethod
    def _in_band(headcount: float | None, rule: dict[str, Any]) -> bool:
        if headcount is None:
            return False
        lo, hi = rule.get("headcount_min"), rule.get("headcount_max")
        if lo is not None and headcount < float(lo):
            return False
        if hi is not None and headcount > float(hi):
            return False
        return lo is not None or hi is not None

    def authority(self, seniority: str, headcount: float | None) -> str:
        if not seniority:
            return ""
        auth = self.authority_map.get(seniority, "")
        for rule in self.authority_size_rules:
            if seniority in set(rule.get("seniority") or []) and self._in_band(headcount, rule):
                auth = rule.get("authority", auth)
        return auth

    # -- the classification --------------------------------------------------
    def classify(self, raw_title: str, headcount: float | None = None) -> dict[str, str]:
        norm = self.norm(raw_title)
        out = {
            "title_normalized": norm, "title_seniority": "", "title_functions": "",
            "title_non_target": "", "title_role_tier": "", "title_buyer_priority": "",
            "title_status": "", "title_rule": "", "title_reason": "", "title_classifier": "rules",
            "title_authority_tier": "",
            "title_at_company": "",
        }
        m = _AT_COMPANY_RE.search((raw_title or "").strip())
        if m:
            out["title_at_company"] = m.group(1).strip()   # list_qa.py checks it against company_name
        if not norm:
            out.update(title_status="missing", title_rule="blank_title", title_reason="no title on the row (unknown, not a fail)")
            return out

        seniority = self.seniority_of(norm)
        out["title_seniority"] = seniority
        out["title_authority_tier"] = self.authority(seniority, headcount)

        if norm not in self.exclusion_exceptions:
            for pat in self.exclusions:
                if not _has_phrase(norm, pat):
                    continue
                if pat not in ABSOLUTE_EXCLUSIONS:
                    rest = re.sub(r"\b" + re.escape(pat) + r"\b", " ", norm)
                    if self.target_functions(rest) or self._has_generic_phrase(rest):
                        return self._ambiguous(out, f"exclusion_mixed_title:{pat}",
                                               f"contains the excluded term '{pat}' but also a target or leadership role")
                out.update(title_role_tier="excluded", title_status="fail", title_rule=f"title_exclusion:{pat}",
                           title_reason=f"title contains the excluded term '{pat}'")
                return out

        if norm in self.explicit:
            tier = self.explicit[norm]
            return self._pass(out, tier, "explicit_title", f"listed as a {tier} title in the targeting spec")

        funcs = self.target_functions(norm)
        out["title_functions"] = "|".join(funcs)
        if funcs:
            tier = None
            for t, rule in self.rules:
                if (rule["any"] or rule["functions"] & set(funcs)) and seniority in rule["seniority"]:
                    tier = t
                    break
            if tier:
                for ov in self.size_overrides:
                    if (set(ov.get("functions") or funcs) & set(funcs)) and seniority in set(ov.get("seniority") or [seniority]) \
                            and self._in_band(headcount, ov) and ov.get("tier") in TIERS:
                        tier = ov["tier"]
                return self._pass(out, tier, "function_and_seniority",
                                  f"target function {'/'.join(funcs)} at {seniority} level")
            if seniority:
                if self.below_action == "review":
                    return self._ambiguous(out, "function_below_seniority",
                                           f"target function {'/'.join(funcs)} but {seniority} level is in no tier rule")
                out.update(title_role_tier="unrelated", title_status="fail", title_rule="below_seniority",
                           title_reason=f"target function {'/'.join(funcs)} but {seniority} level is below every tier rule")
                return out
            return self._ambiguous(out, "function_no_seniority",
                                   f"target function {'/'.join(funcs)} with no recognizable seniority")

        non_target = self.non_target_function(norm)
        if non_target and seniority == "owner_founder":
            # An owner who also practices a non-target trade ("Co-Owner/Therapist") usually buys
            # for the business, so a person decides, not a rule.
            out["title_non_target"] = non_target
            return self._ambiguous(out, "owner_with_non_target_function",
                                   f"owner or founder who also names a {non_target.replace('_', ' ')} role")
        if non_target:
            out.update(title_non_target=non_target, title_role_tier="unrelated", title_status="fail",
                       title_rule=f"non_target_function:{non_target}",
                       title_reason=f"{non_target.replace('_', ' ')} role, not a target function"
                                    + (f" (seniority {seniority} does not rescue it)" if seniority else ""))
            return out

        if self.is_generic_exec(norm):
            tier, basis = None, "the default tier (no size rule applied)"
            for rule in self.generic_size_rules:
                if self._in_band(headcount, rule):
                    tier, basis = rule.get("tier"), f"company size (headcount ~{headcount:.0f})"
                    break
            if tier is None:
                tier = self.generic_default
            if tier in TIERS:
                return self._pass(out, tier, "generic_executive",
                                  f"general leadership title; tier set by {basis}")
            return self._ambiguous(out, "generic_executive_review", "general leadership title with no size rule to place it")

        if seniority == "individual":
            out.update(title_role_tier="unrelated", title_status="fail", title_rule="individual_no_target_function",
                       title_reason="individual-contributor title with no target function")
            return out
        if seniority:
            return self._ambiguous(out, "seniority_only", f"{seniority} level but no known function word")
        return self._ambiguous(out, "unrecognized", "no known function or seniority word")

    @staticmethod
    def _pass(out: dict[str, str], tier: str, rule: str, reason: str) -> dict[str, str]:
        out.update(title_role_tier=tier, title_buyer_priority=BUYER_PRIORITY[tier], title_status="pass",
                   title_rule=rule, title_reason=reason)
        return out

    @staticmethod
    def _ambiguous(out: dict[str, str], rule: str, reason: str) -> dict[str, str]:
        out.update(title_status="ambiguous", title_rule=rule, title_reason=reason)
        return out


# ---------------------------------------------------------------------------
# CSV plumbing
# ---------------------------------------------------------------------------
OUT_COLUMNS = ["title_raw", "title_normalized", "title_seniority", "title_functions", "title_non_target",
               "title_role_tier", "title_buyer_priority", "title_status", "title_rule", "title_reason",
               "title_classifier", "title_authority_tier", "title_at_company"]
SCORING_COLUMNS = ["score_role_tier", "score_role_reason", "score_authority_tier", "score_authority_reason"]


def read_csv(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    with path.open(newline="", encoding="utf-8-sig") as fh:
        reader = csv.DictReader(fh)
        return list(reader.fieldnames or []), [dict(r) for r in reader]


def write_csv(path: Path, header: list[str], rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=header, extrasaction="ignore")
        w.writeheader()
        for r in rows:
            w.writerow({k: r.get(k, "") for k in header})


def detect_title_col(header: list[str], override: str | None) -> str:
    if override:
        if override not in header:
            raise SystemExit(f"--title-col {override} not in the CSV header")
        return override
    for c in ("job_title", "title", "Title", "Job Title", "person_title"):
        if c in header:
            return c
    raise SystemExit("no title column found; pass --title-col")


def load_headcounts(path: Path | None, domain_col: str, hc_col: str) -> dict[str, str]:
    if not path:
        return {}
    _, rows = read_csv(path)
    return {(r.get(domain_col) or "").strip().lower(): r.get(hc_col, "") for r in rows if r.get(domain_col)}


def add_scoring_columns(row: dict[str, str]) -> None:
    tier = row.get("title_role_tier", "")
    if tier in TIERS:
        row["score_role_tier"] = tier
    elif tier in ("unrelated", "excluded"):
        row["score_role_tier"] = "unrelated"
    else:
        row["score_role_tier"] = ""      # ambiguous or missing: unknown evidence, never a zero
    row["score_role_reason"] = f"{row.get('title_classifier', 'rules')}:{row.get('title_rule', '')}: {row.get('title_reason', '')}".strip()
    row["score_authority_tier"] = row.get("title_authority_tier", "")
    row["score_authority_reason"] = f"seniority={row.get('title_seniority') or 'unknown'}" if row.get("title_authority_tier") else ""


def classify_file(args: argparse.Namespace, clf: Classifier) -> int:
    header, rows = read_csv(Path(args.contacts))
    tcol = detect_title_col(header, args.title_col)
    hc_by_domain = load_headcounts(Path(args.companies) if args.companies else None, args.domain_col, args.headcount_col)
    for r in rows:
        hc_raw = (r.get(args.headcount_col) or r.get("co_headcount") or r.get("company_headcount")
                  or hc_by_domain.get((r.get(args.domain_col) or "").strip().lower(), ""))
        res = clf.classify(r.get(tcol, ""), parse_headcount(hc_raw))
        r.update(res)
        r["title_raw"] = r.get(tcol, "")
        if args.emit_scoring_tiers:
            add_scoring_columns(r)
    extra = OUT_COLUMNS + (SCORING_COLUMNS if args.emit_scoring_tiers else [])
    out_header = header + [c for c in extra if c not in header]
    write_csv(Path(args.out), out_header, rows)

    amb = [r for r in rows if r["title_status"] == "ambiguous"]
    queue: dict[str, dict[str, str]] = {}
    counts: Counter[str] = Counter()
    for r in amb:
        key = r["title_normalized"]
        counts[key] += 1
        queue.setdefault(key, {"title_normalized": key, "example_raw_title": r["title_raw"],
                               "title_seniority": r["title_seniority"], "title_functions": r["title_functions"],
                               "rule": r["title_rule"], "rows": "0"})
    for k, q in queue.items():
        q["rows"] = str(counts[k])
    if args.ambiguous_out:
        write_csv(Path(args.ambiguous_out),
                  ["title_normalized", "example_raw_title", "title_seniority", "title_functions", "rule", "rows"],
                  sorted(queue.values(), key=lambda q: -int(q["rows"])))
    if args.report:
        write_report(Path(args.report), rows, queue, counts)
    s = Counter(r["title_status"] for r in rows)
    print(f"classified {len(rows)} rows: " + ", ".join(f"{k}={v}" for k, v in sorted(s.items()))
          + f"; distinct ambiguous titles for the AI pass: {len(queue)}")
    return 0


def merge_ai(args: argparse.Namespace) -> int:
    header, rows = read_csv(Path(args.contacts))
    if "title_normalized" not in header:
        raise SystemExit("--merge-ai needs a file already classified by this script")
    _, ai_rows = read_csv(Path(args.merge_ai))
    verdicts: dict[str, dict[str, str]] = {}
    for a in ai_rows:
        key = normalize_title(a.get("title_normalized") or a.get("title") or "")
        tier = (a.get("title_role_tier") or a.get("classification") or "").strip().lower()
        if not key:
            continue
        if tier not in TIERS + ["unrelated", "excluded"]:
            raise SystemExit(f"AI verdict for '{key}' has an invalid tier '{tier}' (use {TIERS + ['unrelated', 'excluded']})")
        verdicts[key] = {"tier": tier, "reason": (a.get("reason") or a.get("title_reason") or "").strip()}
    applied = 0
    for r in rows:
        if r.get("title_status") != "ambiguous":
            continue
        v = verdicts.get(r.get("title_normalized", ""))
        if not v:
            continue
        r["title_role_tier"] = v["tier"]
        r["title_status"] = "pass" if v["tier"] in TIERS else "fail"
        r["title_buyer_priority"] = BUYER_PRIORITY.get(v["tier"], "")
        r["title_rule"] = "ai_verdict"
        r["title_reason"] = v["reason"] or "AI verdict"
        r["title_classifier"] = "ai"
        applied += 1
        if args.emit_scoring_tiers:
            add_scoring_columns(r)
    extra = OUT_COLUMNS + (SCORING_COLUMNS if args.emit_scoring_tiers else [])
    write_csv(Path(args.out), header + [c for c in extra if c not in header], rows)
    left = sum(1 for r in rows if r.get("title_status") == "ambiguous")
    print(f"merged {len(verdicts)} AI verdicts onto {applied} rows; still ambiguous: {left}")
    if args.emit_explicit_titles:
        snippet: dict[str, list[str]] = {t: [] for t in TIERS}
        for key, v in sorted(verdicts.items()):
            if v["tier"] in TIERS:
                snippet[v["tier"]].append(key)
        Path(args.emit_explicit_titles).write_text(
            "# Paste reviewed entries into buyers.explicit_titles so the next run decides them by rule.\n"
            + yaml.safe_dump({"explicit_titles": snippet}, sort_keys=False), encoding="utf-8")
    return 0


def write_report(path: Path, rows: list[dict[str, str]], queue: dict[str, dict[str, str]], counts: Counter[str]) -> None:
    n = len(rows) or 1
    status = Counter(r["title_status"] for r in rows)
    tiers = Counter(r["title_role_tier"] or "(none)" for r in rows)
    rules = Counter(r["title_rule"].split(":")[0] for r in rows)
    lines = ["# Title classification report", "",
             f"Rows: {len(rows)}. Decided by rule: {status['pass'] + status['fail']} "
             f"({(status['pass'] + status['fail']) / n:.0%}). Ambiguous rows: {status['ambiguous']} "
             f"across {len(queue)} distinct titles (the AI pass classifies titles, not rows). Missing titles: {status['missing']}.",
             "", "## By status", ""]
    lines += [f"- {k}: {v} ({v / n:.1%})" for k, v in status.most_common()]
    lines += ["", "## By buyer tier", ""]
    lines += [f"- {k}{' (' + BUYER_PRIORITY[k] + ')' if k in BUYER_PRIORITY else ''}: {v}" for k, v in tiers.most_common()]
    lines += ["", "## By deciding rule", ""]
    lines += [f"- {k}: {v}" for k, v in rules.most_common()]
    fails = Counter(r["title_raw"] for r in rows if r["title_status"] == "fail")
    lines += ["", "## Most common failed titles (check for false negatives)", ""]
    lines += [f"- {t} ({c})" for t, c in fails.most_common(25)]
    lines += ["", "## Most common ambiguous titles (the AI queue)", ""]
    lines += [f"- {k} ({counts[k]})" for k, _ in counts.most_common(25)]
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def load_spec(path: Path, allow_draft: bool) -> dict[str, Any]:
    spec = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    if spec.get("status") != "locked" and not allow_draft:
        raise SpecError(f"{path} is status={spec.get('status')!r}, not locked; lock it (or pass --allow-draft for a dry run)")
    return spec


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--spec", required=True)
    ap.add_argument("--contacts", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--companies", help="company CSV to join headcount from (by domain)")
    ap.add_argument("--title-col")
    ap.add_argument("--domain-col", default="company_domain")
    ap.add_argument("--headcount-col", default="headcount")
    ap.add_argument("--ambiguous-out")
    ap.add_argument("--report")
    ap.add_argument("--merge-ai")
    ap.add_argument("--emit-explicit-titles", help="with --merge-ai: write a YAML snippet of the AI verdicts for review")
    ap.add_argument("--emit-scoring-tiers", action="store_true",
                    help="also write score_role_tier / score_authority_tier for /lead-scoring")
    ap.add_argument("--allow-draft", action="store_true")
    args = ap.parse_args(argv)
    try:
        spec = load_spec(Path(args.spec), args.allow_draft)
        if args.merge_ai:
            return merge_ai(args)
        return classify_file(args, Classifier(spec))
    except SpecError as exc:
        print(f"SPEC ERROR: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
