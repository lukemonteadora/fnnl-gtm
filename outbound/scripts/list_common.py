#!/usr/bin/env python3
"""Shared helpers for the list-production scripts.

Used by list_waterfall.py, list_qa.py and list_feedback.py (title_classify.py
stays standalone). Pure functions and small file helpers only: no network
calls, no spend. The contract these helpers implement is written down in
outbound/reference/list-production-standard.md.
"""

from __future__ import annotations

import csv
import hashlib
import json
import re
import unicodedata
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

try:
    import yaml
except ImportError as exc:  # pragma: no cover - environment error
    raise SystemExit("PyYAML is required: python -m pip install pyyaml") from exc


# Consumer mailbox domains. A work-email-required campaign treats these per
# buyers.personal_email_policy in the targeting spec.
CONSUMER_DOMAINS = frozenset({
    "gmail.com", "googlemail.com", "outlook.com", "hotmail.com", "live.com", "msn.com", "yahoo.com",
    "yahoo.co.uk", "ymail.com", "icloud.com", "me.com", "mac.com", "aol.com", "proton.me", "protonmail.com",
    "gmx.com", "gmx.de", "gmx.net", "web.de", "mail.com", "zoho.com", "yandex.com", "yandex.ru", "qq.com",
    "163.com", "126.com", "comcast.net", "att.net", "verizon.net", "sbcglobal.net", "bellsouth.net",
    "cox.net", "charter.net", "btinternet.com", "sky.com", "orange.fr", "free.fr", "laposte.net",
    "libero.it", "t-online.de", "hey.com", "fastmail.com",
})

# Local parts that name a function or a shared mailbox rather than a person.
ROLE_LOCAL_PARTS = frozenset({
    "info", "contact", "hello", "hi", "sales", "admin", "administrator", "team", "office", "support", "help",
    "hr", "jobs", "careers", "enquiries", "enquiry", "inquiries", "mail", "marketing", "reception", "accounts",
    "billing", "finance", "service", "customerservice", "noreply", "no-reply", "webmaster", "press", "media",
    "partners", "operations", "ops", "general", "frontdesk",
})

# Words that show a "name" field holds a department or a mailbox, not a person.
NON_PERSON_NAME_WORDS = frozenset({
    "team", "sales", "info", "support", "admin", "administrator", "office", "contact", "hello", "reception",
    "marketing", "accounts", "billing", "hr", "careers", "jobs", "customer", "service", "department",
    "enquiries", "operations", "front", "desk", "unknown", "n/a", "na", "none", "null", "test",
})

COUNTRY_ALIASES = {
    "us": "united states", "usa": "united states", "u s": "united states", "u s a": "united states",
    "united states of america": "united states", "america": "united states",
    "uk": "united kingdom", "u k": "united kingdom", "gb": "united kingdom", "great britain": "united kingdom",
    "england": "united kingdom", "scotland": "united kingdom", "wales": "united kingdom",
    "northern ireland": "united kingdom",
    "uae": "united arab emirates", "u a e": "united arab emirates",
    "ksa": "saudi arabia", "kingdom of saudi arabia": "saudi arabia",
    "deutschland": "germany", "nederland": "netherlands", "the netherlands": "netherlands", "holland": "netherlands",
}


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


# ---------------------------------------------------------------------------
# File helpers
# ---------------------------------------------------------------------------
def read_csv(path: str | Path) -> tuple[list[str], list[dict[str, str]]]:
    p = Path(path)
    with p.open(newline="", encoding="utf-8-sig") as fh:
        reader = csv.DictReader(fh)
        return list(reader.fieldnames or []), [{k: (v if v is not None else "") for k, v in r.items()} for r in reader]


def write_csv(path: str | Path, header: list[str], rows: Iterable[dict[str, Any]]) -> int:
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    n = 0
    with p.open("w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=header, extrasaction="ignore")
        w.writeheader()
        for r in rows:
            w.writerow({k: ("" if r.get(k) is None else r.get(k)) for k in header})
            n += 1
    return n


def merged_header(base: list[str], extra: Iterable[str]) -> list[str]:
    out = list(base)
    for c in extra:
        if c not in out:
            out.append(c)
    return out


def load_yaml(path: str | Path) -> dict[str, Any]:
    return yaml.safe_load(Path(path).read_text(encoding="utf-8")) or {}


def append_jsonl(path: str | Path, records: Iterable[dict[str, Any]]) -> int:
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    n = 0
    with p.open("a", encoding="utf-8") as fh:
        for rec in records:
            fh.write(json.dumps(rec, ensure_ascii=False, sort_keys=True) + "\n")
            n += 1
    return n


def read_jsonl(path: str | Path) -> list[dict[str, Any]]:
    p = Path(path)
    if not p.exists():
        return []
    out = []
    for line in p.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line:
            out.append(json.loads(line))
    return out


# ---------------------------------------------------------------------------
# Normalization (raw values are always preserved by callers; these only
# produce the *_norm companions)
# ---------------------------------------------------------------------------
def norm_email(value: str | None) -> str:
    e = (value or "").strip().lower().strip("<>").strip()
    if e.startswith("mailto:"):
        e = e[7:]
    if e.count("@") != 1:
        return ""
    local, dom = e.split("@")
    if not local or "." not in dom:
        return ""
    return f"{local}@{dom}"


def email_domain(value: str | None) -> str:
    e = norm_email(value)
    return e.split("@", 1)[1] if e else ""


def email_local(value: str | None) -> str:
    e = norm_email(value)
    return e.split("@", 1)[0] if e else ""


def norm_domain(value: str | None) -> str:
    d = (value or "").strip().lower()
    if not d:
        return ""
    d = re.sub(r"^[a-z][a-z0-9+.-]*://", "", d)
    d = d.split("/", 1)[0].split("?", 1)[0].split("#", 1)[0]
    d = d.split("@")[-1]
    d = d.split(":", 1)[0].strip(".")
    if d.startswith("www."):
        d = d[4:]
    return d


def same_org_domain(a: str, b: str) -> bool:
    """True when two domains are equal or one is a subdomain of the other."""
    a, b = norm_domain(a), norm_domain(b)
    if not a or not b:
        return False
    return a == b or a.endswith("." + b) or b.endswith("." + a)


def linkedin_slug(url: str | None) -> str:
    u = (url or "").strip().lower()
    if not u:
        return ""
    m = re.search(r"linkedin\.com/(?:in|pub)/([^/?#]+)", u)
    if m:
        return m.group(1).strip()
    if "/" not in u and " " not in u and "." not in u:
        return u  # a bare member username (some contact tools return only the handle)
    return ""


def norm_name(value: str | None) -> str:
    s = unicodedata.normalize("NFKC", (value or "")).strip()
    s = re.sub(r"\s+", " ", s)
    if s and (s.isupper() or s.islower()):
        s = " ".join(w[:1].upper() + w[1:].lower() if w else w for w in s.split(" "))
    return s


def name_key(value: str | None) -> str:
    s = unicodedata.normalize("NFKD", (value or "")).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z]", "", s)


def norm_country(value: str | None) -> str:
    s = re.sub(r"[^a-z ]", " ", (value or "").strip().lower())
    s = re.sub(r"\s+", " ", s).strip()
    return COUNTRY_ALIASES.get(s, s)


def parse_headcount(value: Any) -> float | None:
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


def headcount_band(n: float | None, bands: list[list[Any]]) -> str:
    if n is None:
        return "missing"
    for lo, hi in bands:
        if (lo is None or n >= float(lo)) and (hi is None or n <= float(hi)):
            return f"{int(lo) if lo is not None else 0}-{int(hi) if hi is not None else ''}".rstrip("-") + ("+" if hi is None else "")
    return "other"


def person_id(row: dict[str, Any]) -> str:
    """Stable id for a person: the LinkedIn slug when present, else a hash of name + company domain."""
    slug = linkedin_slug(row.get("linkedin_url") or row.get("member_linkedin_username") or "")
    if slug:
        return f"li:{slug}"
    first = name_key(row.get("first_name"))
    last = name_key(row.get("last_name"))
    dom = norm_domain(row.get("company_domain") or email_domain(row.get("email")))
    raw = f"{first}|{last}|{dom}"
    return "nm:" + hashlib.sha1(raw.encode("utf-8")).hexdigest()[:16]


def truthy(value: Any) -> bool:
    return str(value).strip().lower() in {"true", "1", "yes", "y", "t"}
