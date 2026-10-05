#!/usr/bin/env python3
"""Lead reservoir: a local store of people FNNL's own tools have found, with their last MillionVerifier verdict.

Aaron flow (see aaron-flow.md section 7). The reservoir is rung 0 of the email waterfall in list_waterfall.py: a
person whose candidate email MillionVerifier rated `valid` ("ok") within the last 90 days is tried on that email
again before AI Ark or Prospeo is paid for them. MillionVerifier still verifies every email before it ships; the
reservoir only ever saves a finder credit, never a verifier credit (see the split note below).

Store:   outbound/profiles/_reservoir/contacts.jsonl (gitignored with the rest of outbound/profiles/, see
         .gitignore's "**/profiles/" rule). One JSON record per line, one record per person.
Key:     the normalized LinkedIn slug, else the lowercase email (record_key()).
Fields:  identity (first_name, last_name, full_name, linkedin_url), title, company (company_name, company_domain),
         email, verdict (MillionVerifier's gate: valid, catch_all, invalid, unknown), verified_at (ISO date),
         source (the FNNL tool that found the email: aiark or prospeo), first_seen, last_seen.
Never:   client names, campaign membership, suppression rows, client-supplied lists, or anything a client gave us.
         Only rows FNNL's own finders returned go in. writeback enforces this with an explicit source allowlist
         (ALLOWED_SOURCES = aiark, prospeo) rather than a blocklist of everything it must not be: under the Aaron
         flow FNNL has exactly two finder tools, so naming them is the more precise translation of the same rule.
         A row sourced "row_existing" (the contacts file's own email column, which may be client-supplied) is
         always refused, even though its MillionVerifier verdict is also written to the ledger.

Reservoir vs. the verification cache (millionverifier_verify.mjs, outbound/profiles/_cache/verify-cache.jsonl):
these are two different, complementary stores, not one duplicated under two names.
  - verify-cache.jsonl is keyed by EMAIL: email -> verdict. It exists so the SAME email is never re-paid for,
    inside a run or across runs.
  - this reservoir is keyed by PERSON (LinkedIn slug, else email): person -> the emails FNNL's finders have found
    for them. It exists so the SAME finder credit is never re-paid for a person AI Ark or Prospeo already
    resolved, on a prior list for this client or another one.
A person found again still goes through MillionVerifier fresh, inside the new campaign's own ledger: this module
deliberately does NOT port A-Sales's cache cross-check (load_cache_verdicts / newer_failure), which guarded a
stored verdict against having gone stale relative to a newer cache entry. That guard is unneeded here because
every reservoir hit is re-verified before it can ship; re-verification alone already catches an address that went
bad since it was stored. The cost of this simplification: rung 0 only ever saves a finder credit, never a
MillionVerifier credit. Acceptable, because finder calls are the rate-limited, discovery-cost rungs the
no-contacts-cap era most needs to avoid re-paying, and MillionVerifier calls are the cheap, high-volume step by
design.

Commands:
  lookup    --in <candidates.csv> --out <csv> [--max-age-days 90]
            fills an EMPTY email column for a row whose person has a `valid` reservoir record verified within the
            window, at the same company. Adds reservoir_hit (1 or 0), source=reservoir on a hit, and
            reservoir_verified_at. Every reused email still goes through MillionVerifier before it ships.
  writeback --in <verified.csv> [--no-source-check]
            upserts every row with a real MillionVerifier gate (valid, catch_all, invalid, unknown) whose source
            column names an FNNL finder. A row sourced any other way is refused and counted, never stored.
  stats     counts by gate, and how many `valid` records are fresh within the window.

Every command takes --store <path>. Writes are atomic (a uniquely named temp file in the same folder, then
os.replace), LF only, so a crash mid-write never leaves a partial or corrupt store. Standard library only (no
PyYAML), so this module has no dependency on list_common.py and can run standalone.
Exit codes: 0 ok; 2 input error.
"""
from __future__ import annotations

import argparse
import csv
import json
import os
import re
import sys
import uuid
from collections import Counter
from datetime import date
from pathlib import Path
from typing import Any, Iterable

csv.field_size_limit(10**9)

DEFAULT_STORE = Path(__file__).resolve().parent.parent / "profiles" / "_reservoir" / "contacts.jsonl"
DEFAULT_MAX_AGE_DAYS = 90

FIELDS = ["key", "first_name", "last_name", "full_name", "title", "company_name", "company_domain",
          "linkedin_url", "email", "verdict", "verified_at", "source", "first_seen", "last_seen"]

# MillionVerifier's own gate vocabulary (list_waterfall.py's RESULT_TO_GATE): valid, catch_all, invalid, unknown.
# No "risky" gate in this set.
GATES = {"valid", "catch_all", "invalid", "unknown"}
# Ruling (aaron-flow.md section 7): a reservoir hit is tried first only on MillionVerifier's "ok" (gate "valid").
# A stored catch_all still goes to the holdback under the catch-all timing rule, so it is not a rung-0 hit either.
RUNG0_GATES = {"valid"}

# FNNL's two finder tools (stack-contract.yaml). Anything else writing to the reservoir would risk storing
# client-supplied or suppression data, which the reservoir must never hold.
ALLOWED_SOURCES = {"aiark", "prospeo"}


class ReservoirError(Exception):
    pass


# ---------------------------------------------------------------------------
# Normalizers (copied rather than imported from list_common.py, so this file
# needs no PyYAML and can run standalone)
# ---------------------------------------------------------------------------
def linkedin_slug(url: str | None) -> str:
    u = (url or "").strip().lower()
    if not u:
        return ""
    m = re.search(r"linkedin\.com/(?:in|pub)/([^/?#]+)", u)
    if m:
        return m.group(1).strip()
    if "/" not in u and " " not in u and "." not in u:
        return u  # a bare member handle (some contact tools return only the username)
    return ""


def norm_email(value: str | None) -> str:
    e = (value or "").strip().lower()
    return e if "@" in e and " " not in e else ""


def norm_domain(value: str | None) -> str:
    d = (value or "").strip().lower()
    d = re.sub(r"^[a-z]+://", "", d).split("/")[0].split("?")[0]
    return d[4:] if d.startswith("www.") else d


# Second-level labels shared by unrelated companies (acme.co.uk and other.co.uk both end in "co"): never a match.
GENERIC_LABELS = {"co", "com", "org", "net", "ac", "gov", "edu", "ltd", "plc", "or", "ne", "go", "gob", "nic"}


def root_label(domain: str) -> str:
    parts = (domain or "").lower().split(".")
    return parts[-2] if len(parts) >= 2 else parts[0]


def same_root(a: str, b: str) -> bool:
    ra = root_label(a)
    return bool(ra) and ra not in GENERIC_LABELS and len(ra) > 2 and ra == root_label(b)


def record_key(linkedin: str | None, email: str | None) -> str:
    return linkedin_slug(linkedin) or norm_email(email)


def parse_day(value: str | None) -> date | None:
    v = (value or "").strip()
    if not v:
        return None
    try:
        return date.fromisoformat(v[:10])
    except ValueError:
        return None


def iso_day(value: str | None, fallback: date) -> str:
    d = parse_day(value)
    return (d or fallback).isoformat()


def slug_of_row(row: dict[str, str]) -> str:
    return linkedin_slug(row.get("linkedin_url")) or linkedin_slug(row.get("linkedin_slug"))


# ---------------------------------------------------------------------------
# Store
# ---------------------------------------------------------------------------
def load_store(path: str | Path) -> dict[str, dict[str, str]]:
    """key -> record. A missing store is empty. A later line for the same key wins."""
    p = Path(path)
    store: dict[str, dict[str, str]] = {}
    if not p.exists():
        return store
    with p.open(encoding="utf-8") as fh:
        for n, line in enumerate(fh, start=1):
            if not line.strip():
                continue
            try:
                rec = json.loads(line)
            except json.JSONDecodeError as exc:
                raise ReservoirError(f"{p}: line {n} is not JSON ({exc})") from exc
            key = rec.get("key") or record_key(rec.get("linkedin_url"), rec.get("email"))
            if key:
                store[key] = {f: str(rec.get(f) or "") for f in FIELDS} | {"key": key}
    return store


def save_store(path: str | Path, store: dict[str, dict[str, str]]) -> None:
    """Atomic: the whole store goes to a temp file in the same folder, which then replaces the store."""
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    tmp = p.with_name(f".{p.name}.{os.getpid()}.{uuid.uuid4().hex[:8]}.tmp")
    with tmp.open("w", encoding="utf-8", newline="\n") as fh:
        for key in sorted(store):
            fh.write(json.dumps({f: store[key].get(f, "") for f in FIELDS}, ensure_ascii=False) + "\n")
    os.replace(tmp, p)


# ---------------------------------------------------------------------------
# Lookup (rung 0)
# ---------------------------------------------------------------------------
def same_company(rec: dict[str, str], domains: Iterable[str]) -> bool:
    """The stored person still works where the candidate row says: the stored company domain, or the stored
    email's domain, matches or shares a root label with one of the candidate's domains. A person who moved
    employers is not a hit."""
    doms = {norm_domain(d) for d in domains if norm_domain(d)}
    if not doms:
        return True  # the candidate names no company, so there is nothing to contradict
    rec_dom = norm_domain(rec.get("company_domain"))
    email_dom = norm_domain((rec.get("email") or "").split("@")[-1])
    for d in doms:
        for x in (rec_dom, email_dom):
            if x and (x == d or x.endswith("." + d) or d.endswith("." + x) or same_root(x, d)):
                return True
    return False


def find(store: dict[str, dict[str, str]], slug: str, domains: Iterable[str], max_age_days: int,
          today: date) -> tuple[dict[str, str] | None, str]:
    """(record, "hit") or (None, reason). Reasons: no_slug, no_match, not_valid, stale, other_company."""
    if not slug:
        return None, "no_slug"
    rec = store.get(slug)
    if not rec or not norm_email(rec.get("email")):
        return None, "no_match"
    if rec.get("verdict") not in RUNG0_GATES:
        return None, "not_valid"
    day = parse_day(rec.get("verified_at"))
    if day is None or (today - day).days > max_age_days:
        return None, "stale"
    if not same_company(rec, domains):
        return None, "other_company"
    return rec, "hit"


def find_for_person(store: dict[str, dict[str, str]], linkedin_url: str | None, email: str | None,
                      company_domain: str | None, max_age_days: int, today: date) -> tuple[dict[str, str] | None, str]:
    """Convenience wrapper for a caller (list_waterfall.py) holding a person's row rather than a CSV row."""
    key = record_key(linkedin_url, email)
    return find(store, key, [company_domain or ""], max_age_days, today)


def lookup_rows(rows: list[dict[str, str]], store: dict[str, dict[str, str]], max_age_days: int,
                 today: date) -> tuple[list[dict[str, str]], Counter]:
    out, tally = [], Counter()
    for r in rows:
        row = dict(r)
        row.setdefault("email", "")
        row.setdefault("source", "")
        row["reservoir_hit"], row["reservoir_verified_at"] = "0", ""
        if norm_email(row.get("email")):
            tally["email_already_present"] += 1
            out.append(row)
            continue
        rec, why = find(store, slug_of_row(row), [row.get("company_domain", "")], max_age_days, today)
        tally[why] += 1
        if rec:
            row.update({"email": rec["email"], "source": "reservoir", "reservoir_hit": "1",
                        "reservoir_verified_at": rec.get("verified_at", "")})
        out.append(row)
    return out, tally


# ---------------------------------------------------------------------------
# Writeback
# ---------------------------------------------------------------------------
def refused_source(row: dict[str, str]) -> str:
    """Empty string when the row's source is an allowed FNNL finder; otherwise the refusal reason."""
    src = (row.get("source") or row.get("email_source") or row.get("provider") or "").strip().lower()
    return "" if src in ALLOWED_SOURCES else f"source={src or '(blank)'}"


def writeback_rows(rows: Iterable[dict[str, str]], store: dict[str, dict[str, str]], today: date,
                    source_check: bool = True) -> Counter:
    """Upsert every row with a real MillionVerifier gate, sourced from an FNNL finder. Only the reservoir's own
    fields are kept, so a campaign, offer, client or suppression column in the input never reaches the store."""
    tally: Counter = Counter()
    by_email = {r["email"]: k for k, r in store.items() if r.get("email")}
    for r in rows:
        if source_check:
            reason = refused_source(r)
            if reason:
                tally["refused_source_not_an_fnnl_finder"] += 1
                continue
        email = norm_email(r.get("email"))
        if not email:
            tally["skipped_no_email"] += 1
            continue
        verdict = (r.get("verdict") or r.get("gate") or "").strip().lower()
        if verdict not in GATES:
            tally["skipped_no_verdict"] += 1
            continue
        src = (r.get("source") or r.get("email_source") or r.get("provider") or "").strip().lower()
        slug = slug_of_row(r)
        key = slug or by_email.get(email) or email
        # dedupe: a person first stored by email moves to their slug once one is known
        if slug and email in store and email != slug:
            old = store.pop(email)
            store.setdefault(slug, old | {"key": slug})
            tally["merged_email_record_into_slug"] += 1
        new = {
            "first_name": (r.get("first_name") or "").strip(),
            "last_name": (r.get("last_name") or "").strip(),
            "full_name": (r.get("full_name") or f"{r.get('first_name', '')} {r.get('last_name', '')}").strip(),
            "title": (r.get("title") or r.get("job_title") or "").strip(),
            "company_name": (r.get("company_name") or "").strip(),
            "company_domain": norm_domain(r.get("company_domain")),
            "linkedin_url": (r.get("linkedin_url") or (f"https://www.linkedin.com/in/{slug}" if slug else "")).strip(),
        }
        at = iso_day(r.get("verified_at"), today)
        old = store.get(key)
        if old is None:
            rec = {f: "" for f in FIELDS}
            rec.update(new)
            rec.update({"key": key, "email": email, "verdict": verdict, "verified_at": at,
                        "source": src, "first_seen": today.isoformat()})
            tally["inserted"] += 1
        else:
            rec = dict(old)
            rec.update({k: v for k, v in new.items() if v})
            if at >= (old.get("verified_at") or ""):  # an older verdict never overwrites a newer one
                rec.update({"email": email, "verdict": verdict, "verified_at": at, "source": src or rec.get("source", "")})
            tally["updated"] += 1
        rec["last_seen"] = today.isoformat()
        store[key] = rec
        by_email[email] = key
    return tally


def stats(store: dict[str, dict[str, str]], today: date, max_age_days: int) -> dict[str, Any]:
    days = [d for d in (parse_day(r.get("verified_at")) for r in store.values()) if d]
    fresh = sum(1 for r in store.values() if r.get("verdict") in RUNG0_GATES
                and (d := parse_day(r.get("verified_at"))) and (today - d).days <= max_age_days)
    return {
        "records": len(store),
        "by_verdict": dict(Counter(r.get("verdict", "") for r in store.values())),
        "keyed_by_linkedin_slug": sum(1 for k in store if "@" not in k),
        "keyed_by_email": sum(1 for k in store if "@" in k),
        f"valid_verified_within_{max_age_days}_days": fresh,
        "by_source": dict(Counter(r.get("source", "") for r in store.values())),
        "oldest_verified_at": min(days).isoformat() if days else "",
        "newest_verified_at": max(days).isoformat() if days else "",
    }


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
def read_csv(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    if not path.exists():
        raise ReservoirError(f"input not found: {path}")
    with path.open(newline="", encoding="utf-8-sig") as fh:
        rd = csv.DictReader(fh)
        rows = [{k: (v if v is not None else "") for k, v in r.items() if k is not None} for r in rd]
        return list(rd.fieldnames or []), rows


def write_csv(path: Path, fields: list[str], rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(path.name + "." + uuid.uuid4().hex[:8] + ".tmp")
    with tmp.open("w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=fields, extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)
    os.replace(tmp, path)


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Lead reservoir (Aaron flow): lookup, writeback, stats.")
    ap.add_argument("command", choices=["lookup", "writeback", "stats"])
    ap.add_argument("--store", default=str(DEFAULT_STORE), help="the store (default outbound/profiles/_reservoir/contacts.jsonl)")
    ap.add_argument("--in", dest="inp", help="lookup: candidates CSV; writeback: verified CSV")
    ap.add_argument("--out", help="lookup: output CSV")
    ap.add_argument("--max-age-days", type=int, default=DEFAULT_MAX_AGE_DAYS, help="lookup and stats: freshness window")
    ap.add_argument("--source-check", dest="source_check", action="store_true", default=True,
                    help="writeback: refuse rows whose source is not an FNNL finder (the default)")
    ap.add_argument("--no-source-check", dest="source_check", action="store_false", help=argparse.SUPPRESS)
    ap.add_argument("--today", help=argparse.SUPPRESS)  # fixed date for tests
    a = ap.parse_args(argv)
    try:
        today = parse_day(a.today) or date.today()
        store = load_store(a.store)
        if a.command == "stats":
            print(json.dumps({"store": str(a.store), **stats(store, today, a.max_age_days)}, indent=1))
            return 0
        if not a.inp:
            raise ReservoirError(f"{a.command} needs --in")
        fields, rows = read_csv(Path(a.inp))
        if a.command == "lookup":
            if not a.out:
                raise ReservoirError("lookup needs --out")
            out, tally = lookup_rows(rows, store, a.max_age_days, today)
            extra = [c for c in ("email", "source", "reservoir_hit", "reservoir_verified_at") if c not in fields]
            write_csv(Path(a.out), fields + extra, out)
            print(json.dumps({"rows": len(rows), "hits": tally.get("hit", 0), "by_reason": dict(tally), "out": a.out}, indent=1))
            return 0
        tally = writeback_rows(rows, store, today, source_check=a.source_check)
        if tally.get("inserted") or tally.get("updated") or tally.get("merged_email_record_into_slug"):
            save_store(a.store, store)
        print(json.dumps({"rows": len(rows), **dict(tally), "records_now": len(store), "store": str(a.store)}, indent=1))
        return 0
    except ReservoirError as e:
        print(f"reservoir error: {e}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
