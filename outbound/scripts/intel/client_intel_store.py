#!/usr/bin/env python3
"""Client intel store: the deterministic half of /client-intel-sync.

The Claude session reads meeting recap emails, the calendar, Slack and local
files through whatever read-only connectors it has, decides what each item
means and which client it belongs to, and writes the items to a JSON file.
This script does everything after that, so storage never depends on the model:
it validates, scrubs, dedupes, applies the cross-agency guard, files, renders
and verifies. Stdlib only, plus PyYAML when a profile or config.yaml is read.
It makes no network calls.

Cross-agency guard
  The connectors a session sees can belong to accounts that also hold other
  agencies' clients. An item is filed only under a client that has a profile
  folder (outbound/profiles/<slug>/) or under "agency" (the agency itself). An
  item whose target does not resolve to one of those is dropped and counted.
  It is never written anywhere, and only the count is reported.

Settings (nothing agency-specific is hardcoded)
  Precedence: a command-line flag, then outbound/profiles/_intel/config.yaml,
  then the neutral default.
    agency_name       label for the agency feed               default "Agency"
    internal_domains  our own email domains ("who is us")     default none
    timezone          day boundaries for dates and counts:     default: the
                      "local", "UTC", a fixed offset such as   system local
                      "+08:00", or an IANA name when the       timezone, as
                      zone database (tzdata) is installed      Python reports it
    slack_workspace   the Slack workspace the feed reads      default none
    aliases_file      optional JSON {alias: client name}      default none

Commands
  config                      Print the resolved settings and where they came from.
  roster                      Build profiles/_intel/roster.json (clients, domains,
                              aliases, Slack channel classes) from the client
                              profiles plus profiles/_intel/roster-overrides.json.
  state                       Print profiles/_intel/state.json (cursors, last run).
  state-set --json FILE       Merge cursors / last-run fields into the state.
  ingest --items FILE         Validate, scrub, dedupe, apply the cross-agency
         [--run-id ID]        guard, append items, write meeting files, re-render
         [--dry-run]          every touched feed. --dry-run validates only.
  render [--target T|--all]   Re-render client-intel.md (or the agency feed).
  digest --date YYYY-MM-DD    Write profiles/_intel/daily/<date>.md from the items
         [--coverage FILE]    ingested on that date plus the session's coverage.
  verify [--items FILE]       Integrity check: no duplicates, every feed rendered,
                              and (with --items) every filed item present.
  activity --target SLUG      Add the one client-intel LOG line to the client's
     --when "YYYY-MM-DD HH:MM" activity-log.md and refresh its single "Client intel"
     --new N [--phrase TEXT]  CURRENT STATE line. Touches nothing else; idempotent.
  file-id PATH [--prefix P]   Print a stable id for a local file (content hash).

Layout (all under outbound/profiles/, which is gitignored)
  <slug>/client-intel.md                  live feed that skills read
  <slug>/_intel/intel-log.jsonl           append-only ledger (source of truth)
  <slug>/_intel/meetings/<date>-<t>.md    one file per meeting recap
  _intel/agency/...                       same shape, for items about the agency itself
  _intel/daily/<date>.md                  cross-client digest (+ coverage and drop counts)
  _intel/inbox/                           local files the operator drops in to be read
  _intel/config.yaml, state.json, roster.json, roster-overrides.json

Protocol: outbound/reference/client-intel-feed.md
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import re
import sys
from pathlib import Path

try:
    import yaml  # PyYAML
except ImportError:  # pragma: no cover
    yaml = None

OUTBOUND = Path(__file__).resolve().parents[2]
PROFILES = OUTBOUND / "profiles"
HUB = PROFILES / "_intel"
STATE_FILE = HUB / "state.json"
ROSTER_FILE = HUB / "roster.json"
OVERRIDES_FILE = HUB / "roster-overrides.json"
CONFIG_FILE = HUB / "config.yaml"

# Neutral defaults. Every agency-specific value comes from config.yaml or a flag.
DEFAULT_CONFIG = {
    "agency_name": "Agency",
    "internal_domains": [],
    "timezone": None,
    "slack_workspace": None,
    "aliases_file": None,
}
CLI_OVERRIDES: dict = {}  # filled by main() from command-line flags

SPECIAL_TARGETS = ("agency",)
KINDS = (
    "meeting", "decision", "request", "action_item", "feedback", "update",
    "risk", "announcement", "activity_count", "upcoming", "resolution",
)
AFFECTS = (
    "offer", "icp", "list", "copy", "launch", "infra", "replies", "meetings",
    "billing", "reporting", "engagement", "team", "tooling", "other",
)
# Areas that change what a planning / build / launch skill should do.
PIPELINE_AREAS = {"offer", "icp", "list", "copy", "launch", "infra", "replies", "engagement"}
ATTENTION_KINDS = {"decision", "request", "risk"}
OPEN_KINDS = {"action_item", "request"}
SOURCES = ("email", "calendar", "slack", "file", "manual")
CONFIDENCE = ("stated", "implied")
COUNT_FIELDS = ("title", "summary", "affects", "people")  # what makes a recount a change
FEED_WINDOW_DAYS = 30
ATTENTION_WINDOW_DAYS = 14

# Channels that are never read, whatever a profile or override says.
HARD_EXCLUDE_CHANNEL_PATTERNS = (
    r"api-?keys?", r"(^|[-_.])keys?($|[-_.])", r"secret", r"password", r"passwd",
    r"token", r"credential", r"(^|[-_.])creds?($|[-_.])", r"intel-digest",
)

# --------------------------------------------------------------------------- config


_CFG_CACHE: dict | None = None
_TZ_CACHE: tuple | None = None


def reset_config() -> None:
    """Forget the cached settings (after CONFIG_FILE or CLI_OVERRIDES change)."""
    global _CFG_CACHE, _TZ_CACHE
    _CFG_CACHE, _TZ_CACHE = None, None


def _as_domain_list(value) -> list[str]:
    if value is None:
        return []
    if isinstance(value, str):
        value = value.split(",")
    if not isinstance(value, (list, tuple)):
        raise SystemExit("internal_domains must be a list of domains (or a comma-separated string)")
    out: list[str] = []
    for raw in value:
        d = domain_of(str(raw).strip().lstrip("@")) or ""
        if d and d not in out:
            out.append(d)
    return out


def load_config() -> dict:
    cfg = dict(DEFAULT_CONFIG)
    source = {k: "default" for k in DEFAULT_CONFIG}
    if CONFIG_FILE.exists():
        if yaml is None:
            raise SystemExit(f"{CONFIG_FILE} exists but PyYAML is not installed: "
                             "pip install pyyaml, or pass the settings as flags")
        try:
            data = yaml.safe_load(CONFIG_FILE.read_text(encoding="utf-8")) or {}
        except yaml.YAMLError as e:
            raise SystemExit(f"{CONFIG_FILE} is not valid YAML: {e}")
        if not isinstance(data, dict):
            raise SystemExit(f"{CONFIG_FILE} must be a mapping of settings")
        for k, v in data.items():
            if k in DEFAULT_CONFIG and v not in (None, ""):
                cfg[k], source[k] = v, "config.yaml"
    for k, v in CLI_OVERRIDES.items():
        if k in DEFAULT_CONFIG and v not in (None, ""):
            cfg[k], source[k] = v, "flag"
    cfg["internal_domains"] = _as_domain_list(cfg["internal_domains"])
    cfg["agency_name"] = str(cfg["agency_name"]).strip() or DEFAULT_CONFIG["agency_name"]
    cfg["_source"] = source
    return cfg


def cfg() -> dict:
    global _CFG_CACHE
    if _CFG_CACHE is None:
        _CFG_CACHE = load_config()
    return _CFG_CACHE


_OFFSET = re.compile(r"^(?:UTC|GMT)?\s*([+-])(\d{1,2})(?::?(\d{2}))?$", re.I)


def resolve_tz(name) -> tuple[dt.tzinfo | None, str]:
    """Return (tzinfo, label). tzinfo None means the system local timezone.

    The default is the system local timezone as Python reports it (local rules
    apply per timestamp). "UTC" and fixed offsets always work; an IANA name
    needs the zone database (on Windows, the tzdata package), and a name that
    cannot be loaded fails loud instead of silently shifting every day.
    """
    if name is None or str(name).strip().lower() in ("", "local", "system"):
        off = dt.datetime.now().astimezone().strftime("%z")
        return None, f"system local (currently UTC{off[:3]}:{off[3:]})"
    s = str(name).strip()
    if s.upper() in ("UTC", "Z", "GMT"):
        return dt.timezone.utc, "UTC"
    m = _OFFSET.match(s)
    if m:
        sign, hh, mm = m.group(1), int(m.group(2)), int(m.group(3) or 0)
        if hh > 14 or mm > 59:
            raise SystemExit(f"timezone offset {s!r} is out of range")
        delta = dt.timedelta(hours=hh, minutes=mm)
        return dt.timezone(delta if sign == "+" else -delta), f"UTC{sign}{hh:02d}:{mm:02d}"
    try:
        from zoneinfo import ZoneInfo
        return ZoneInfo(s), s
    except Exception as e:  # ZoneInfoNotFoundError, ValueError, missing tzdata
        raise SystemExit(f"timezone {s!r} could not be loaded ({e.__class__.__name__}). Install the "
                         "tzdata package, use a fixed offset such as +08:00, or remove the setting "
                         "to use the system local timezone.")


def _tz() -> tuple[dt.tzinfo | None, str]:
    global _TZ_CACHE
    if _TZ_CACHE is None:
        _TZ_CACHE = resolve_tz(cfg()["timezone"])
    return _TZ_CACHE


def to_local(d: dt.datetime) -> dt.datetime:
    tzinfo = _tz()[0]
    return d.astimezone(tzinfo) if tzinfo else d.astimezone()


# --------------------------------------------------------------------------- scrub

_PHONE = re.compile(r"(?<![\w/])\+?\d[\d\s().-]{7,}\d(?![\w/])")
_EMAIL = re.compile(r"\b[A-Za-z0-9._%+-]+@([A-Za-z0-9.-]+\.[A-Za-z]{2,})\b")
_SECRET = re.compile(
    r"\b(sk-[A-Za-z0-9_-]{16,}|xox[abpr]-[A-Za-z0-9-]{10,}|AKIA[0-9A-Z]{16}|"
    r"ghp_[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{30,}|[A-Za-z0-9_-]{40,})\b"
)
_DATEISH = re.compile(r"^\d{4}[-/.]\d{2}[-/.]\d{2}")


def scrub(text: str | None, keep_domains=None) -> str | None:
    """Remove phone numbers, personal email addresses and secret-shaped tokens.

    Email addresses keep their domain (useful for client mapping) but lose the
    person: jane@acme.com -> [email @acme.com]. Addresses on one of our own
    internal_domains are kept; with none configured, every address is scrubbed.
    """
    if not text:
        return text
    keep = set(cfg()["internal_domains"] if keep_domains is None else keep_domains)
    text = _SECRET.sub("[secret removed]", text)

    def _email(m: re.Match) -> str:
        dom = m.group(1).lower()
        return m.group(0) if dom in keep else f"[email @{dom}]"

    text = _EMAIL.sub(_email, text)

    def _phone(m: re.Match) -> str:
        s = m.group(0)
        digits = re.sub(r"\D", "", s)
        if _DATEISH.match(s.strip()) or len(digits) < 9:
            return s  # a date or a short number, not a phone
        return "[phone removed]"

    return _PHONE.sub(_phone, text)


# --------------------------------------------------------------------------- utils

def now_iso() -> str:
    return to_local(dt.datetime.now(dt.timezone.utc)).isoformat(timespec="seconds")


def parse_ts(s: str | None) -> dt.datetime | None:
    if not s:
        return None
    s = s.strip().replace("Z", "+00:00")
    try:
        d = dt.datetime.fromisoformat(s)
    except ValueError:
        try:
            d = dt.datetime.strptime(s[:10], "%Y-%m-%d")
        except ValueError:
            return None
    if d.tzinfo is None:
        d = d.replace(tzinfo=dt.timezone.utc)
    return d


def local_day(ts: str) -> str:
    return to_local(parse_ts(ts)).strftime("%Y-%m-%d")


def slugify(s: str, maxlen: int = 48) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", (s or "").lower()).strip("-")
    return (s[:maxlen].rstrip("-")) or "untitled"


def read_json(path: Path, default):
    if not path.exists():
        return default
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def write_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    with tmp.open("w", encoding="utf-8", newline="\n") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")
    tmp.replace(path)


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    with tmp.open("w", encoding="utf-8", newline="\n") as f:
        f.write(text)
    tmp.replace(path)


def domain_of(url: str | None) -> str | None:
    if not url or not isinstance(url, str):
        return None
    d = re.sub(r"^https?://", "", url.strip().lower()).split("/")[0]
    d = d.removeprefix("www.")
    return d or None


# --------------------------------------------------------------------------- targets

def target_dirs(target: str) -> tuple[Path, Path, Path]:
    """Return (feed_md, ledger_jsonl, meetings_dir) for a target."""
    if target in SPECIAL_TARGETS:
        base = HUB / target
        feed = base / f"{target}-intel.md"
        intel = base
    else:
        base = PROFILES / target
        feed = base / "client-intel.md"
        intel = base / "_intel"
    return feed, intel / "intel-log.jsonl", intel / "meetings"


def load_ledger(target: str) -> list[dict]:
    _, ledger, _ = target_dirs(target)
    items = []
    if ledger.exists():
        with ledger.open(encoding="utf-8") as f:
            for n, line in enumerate(f, 1):
                line = line.strip()
                if not line:
                    continue
                try:
                    items.append(json.loads(line))
                except json.JSONDecodeError as e:
                    raise SystemExit(f"corrupt ledger line {ledger}:{n}: {e}")
    return items


def known_targets() -> list[str]:
    """Client slugs: every profile folder that does not start with an underscore."""
    if not PROFILES.exists():
        return []
    return [d.name for d in sorted(PROFILES.iterdir()) if d.is_dir() and not d.name.startswith("_")]


def resolve_target(target, targets: set[str], roster: dict) -> str | None:
    """Map an item's target onto a profiled client or 'agency', or None (drop it).

    Accepts the slug itself, a slug-shaped variant of it, one of the client's
    roster aliases, or one of its website domains. Anything else is not one of
    our clients, so the cross-agency guard drops it.
    """
    if not isinstance(target, str) or not target.strip():
        return None
    t = target.strip()
    if t in targets or t in SPECIAL_TARGETS:
        return t
    s = slugify(t)
    if s in targets:
        return s
    low = t.lower()
    for slug, c in (roster.get("clients") or {}).items():
        if slug not in targets:
            continue
        if s in {slugify(a) for a in c.get("aliases") or []} or low in (c.get("domains") or []):
            return slug
    return None


# --------------------------------------------------------------------------- roster

def _load_profile(slug: str) -> dict:
    p = PROFILES / slug / "client-profile.yaml"
    if not p.exists() or yaml is None:
        return {}
    text = p.read_text(encoding="utf-8")
    try:
        data = yaml.safe_load(text) or {}
        return data if isinstance(data, dict) else {}
    except yaml.YAMLError:
        # A malformed profile still names its client near the top; read just that.
        fallback: dict = {"_yaml_error": True, "business": {}}
        for key in ("name", "website"):
            m = re.search(rf"^\s{{2}}{key}:\s*([^#\n]+)", text, re.M)
            if m:
                fallback["business"][key] = m.group(1).strip().strip("'\"")
        return fallback


def _norm_channel(entry) -> dict | None:
    """One entry of client_comms.slack.channels: {name, id, kind, confirmed}."""
    if isinstance(entry, dict):
        name = str(entry.get("name") or "").lstrip("#").strip()
        cid = entry.get("id")
        cid = str(cid).strip() if cid and str(cid).strip().lower() not in ("blank", "none", "null") else None
        kind = entry.get("kind") or entry.get("role")
        confirmed = entry.get("confirmed")
        return {"name": name, "id": cid, "kind": kind, "confirmed": confirmed} if name or cid else None
    if isinstance(entry, str):  # "#client-acme (C0123ABCD, shared)"
        # Only "#channel (C...)" strings; free text such as "1 DM from ..." is not a channel.
        m = re.match(r"\s*#([a-z0-9._-]+)\s*(?:\((C[A-Z0-9]+|G[A-Z0-9]+))?", entry, re.I)
        if m:
            return {"name": m.group(1), "id": m.group(2), "kind": None, "confirmed": None}
    return None


def _excluded(name: str) -> bool:
    return any(re.search(p, name or "", re.I) for p in HARD_EXCLUDE_CHANNEL_PATTERNS)


def _channel_owner(name: str, clients: dict) -> str | None:
    """The client a channel is named after, from the usual name shapes.

    <slug>, client-<slug>, ext-<slug>, shared-<slug>, <slug>-leads,
    <slug>-signals, <slug>-hot-signals, and <tag>-<slug> / <slug>-<tag> where
    <tag> is the configured agency_name. Only profiled clients can own one.
    """
    tag = re.escape(slugify(cfg()["agency_name"]))
    stem = re.sub(rf"^(?:client|ext|shared|{tag})-", "", name.lower())
    stem = re.sub(rf"-(?:leads|hot-signals|signals|{tag})$", "", stem)
    for slug, c in clients.items():
        if stem == slug or stem in {slugify(a) for a in c["aliases"]}:
            return slug
    return None


def _load_aliases() -> dict:
    raw = cfg().get("aliases_file")
    if not raw:
        return {}
    p = Path(raw)
    if not p.is_absolute():
        p = OUTBOUND / p
    data = read_json(p, {})
    return data if isinstance(data, dict) else {}


def build_roster() -> dict:
    overrides = read_json(OVERRIDES_FILE, {})
    aliases_map = _load_aliases()
    clients: dict[str, dict] = {}
    channel_votes: dict[str, dict] = {}  # channel name -> {id, clients:set, kinds:set}

    for slug in known_targets():
        prof = _load_profile(slug)
        biz = prof.get("business") if isinstance(prof.get("business"), dict) else {}
        cli = prof.get("client") if isinstance(prof.get("client"), dict) else {}
        name = biz.get("name") or cli.get("name") or prof.get("company_name") or prof.get("client_name") or slug
        domains = set()
        for raw in (biz.get("website"), cli.get("website"), prof.get("company_domain"), prof.get("website")):
            d = domain_of(raw)
            if d:
                domains.add(d)
        contact = biz.get("primary_contact") if isinstance(biz.get("primary_contact"), dict) else {}
        if contact.get("email") and "@" in str(contact["email"]):
            domains.add(str(contact["email"]).split("@", 1)[1].lower())
        aliases = {str(name), slug, slug.replace("-", " ")}
        short = re.sub(r"\b(d\.o\.o\.|pte\.? ltd\.?|inc\.?|ltd\.?|llc|oy|gmbh|b\.v\.|software|ai)\b", "",
                       str(name), flags=re.I).strip(" .,-")
        if short and len(short) >= 3:
            aliases.add(short)
        for alias, canonical in aliases_map.items():
            if str(canonical).lower() in {a.lower() for a in aliases}:
                aliases.add(str(alias))
        comms = prof.get("client_comms") if isinstance(prof.get("client_comms"), dict) else {}
        slack = comms.get("slack") if isinstance(comms.get("slack"), dict) else {}
        for entry in slack.get("channels") or []:
            c = _norm_channel(entry)
            if not c or c.get("confirmed") is False:
                continue  # an ambiguous hit the operator never confirmed is not read
            v = channel_votes.setdefault(c["name"], {"id": None, "clients": set(), "kinds": set()})
            v["id"] = v["id"] or c["id"]
            v["clients"].add(slug)
            if c.get("kind"):
                v["kinds"].add(str(c["kind"]))
        clients[slug] = {
            "slug": slug,
            "name": str(name),
            "domains": sorted(domains),
            "aliases": sorted({a for a in aliases if a}, key=str.lower),
            "has_profile": bool(prof),
        }

    # Per-client overrides (extra aliases / domains). Only profiled clients.
    for slug, extra in (overrides.get("clients") or {}).items():
        if slug not in clients:
            continue
        clients[slug]["aliases"] = sorted(set(clients[slug]["aliases"]) | set(extra.get("aliases", [])), key=str.lower)
        clients[slug]["domains"] = sorted(set(clients[slug]["domains"]) | {d.lower() for d in extra.get("domains", [])})

    # Channel classes. Overrides win; then name shapes; then the kinds the profiles recorded.
    channels: dict[str, dict] = {}
    ov_ch = overrides.get("channels") or {}
    for name in sorted(set(channel_votes) | set(ov_ch)):
        v = channel_votes.get(name, {"id": None, "clients": set(), "kinds": set()})
        o = ov_ch.get(name, {})
        cls, client, reason = o.get("class"), o.get("client"), None
        if not cls:
            owner = _channel_owner(name, clients)
            if owner:
                cls = "dedicated_feed" if re.search(r"-(?:hot-)?signals$", name) else "dedicated"
                client = owner
            elif len(v["clients"]) == 1 and v["kinds"] & {"shared", "internal"}:
                cls, client = "dedicated", next(iter(v["clients"]))
            elif v["kinds"] and v["kinds"] <= {"dm_group"}:
                cls, reason = "excluded", "group DM"
            else:
                cls = "agency"  # a general channel: each message is routed by the client it names
        if cls in ("dedicated", "dedicated_feed") and client not in clients:
            cls, client, reason = "excluded", None, "its client has no profile here (cross-agency guard)"
        if _excluded(name):
            cls, client, reason = "excluded", None, "name suggests keys or credentials"
        elif name.startswith("dm-"):
            cls, client, reason = "excluded", None, "DM"
        entry = {
            "name": name,
            "id": o.get("id") or v["id"],
            "class": cls,
            "client": client if cls in ("dedicated", "dedicated_feed") else None,
            "seen_in_profiles": sorted(v["clients"]),
        }
        if reason:
            entry["reason"] = reason
        channels[name] = entry

    c = cfg()
    roster = {
        "built_at": now_iso(),
        "agency_name": c["agency_name"],
        "internal_domains": c["internal_domains"],
        "slack_workspace": c["slack_workspace"],
        "timezone": _tz()[1],
        "clients": clients,
        "channels": channels,
        "notes": ("Generated by client_intel_store.py roster. Edit roster-overrides.json (clients, channels) "
                  "or config.yaml (settings), not this file."),
    }
    write_json(ROSTER_FILE, roster)
    return roster


# --------------------------------------------------------------------------- state

def load_state() -> dict:
    return read_json(STATE_FILE, {"version": 1, "cursors": {"slack": {}}, "runs": []})


def cmd_state_set(path: Path) -> None:
    patch = read_json(path, None)
    if not isinstance(patch, dict):
        raise SystemExit("state-set: JSON object expected")
    st = load_state()
    cur = st.setdefault("cursors", {"slack": {}})
    for k, v in (patch.get("cursors") or {}).items():
        if k == "slack" and isinstance(v, dict):
            cur.setdefault("slack", {}).update(v)
        else:
            cur[k] = v
    for k in ("last_run_at", "last_run_id", "last_run_status", "backfill_done"):
        if k in patch:
            st[k] = patch[k]
    if patch.get("run"):
        st.setdefault("runs", []).append(patch["run"])
        st["runs"] = st["runs"][-60:]
    write_json(STATE_FILE, st)
    print(json.dumps({"ok": True, "state": str(STATE_FILE)}, indent=2))


# --------------------------------------------------------------------------- ingest

REQUIRED = ("id", "source", "occurred_at", "target", "kind", "title")


def validate(item: dict) -> list[str]:
    errs = [f"missing {k}" for k in REQUIRED if not item.get(k)]
    if item.get("source") and item["source"] not in SOURCES:
        errs.append(f"bad source {item['source']!r}")
    if item.get("kind") and item["kind"] not in KINDS:
        errs.append(f"bad kind {item['kind']!r}")
    bad_aff = [a for a in item.get("affects") or [] if a not in AFFECTS]
    if bad_aff:
        errs.append(f"bad affects {bad_aff}")
    if item.get("confidence") and item["confidence"] not in CONFIDENCE:
        errs.append(f"bad confidence {item['confidence']!r}")
    if item.get("occurred_at") and not parse_ts(item["occurred_at"]):
        errs.append(f"bad occurred_at {item['occurred_at']!r}")
    return errs


def clean(item: dict, run_id: str) -> dict:
    out = dict(item)
    out.pop("unmatched_name", None)  # there is no unmatched bucket; never keep another company's name
    for k in ("title", "summary", "quote", "body"):
        if isinstance(out.get(k), str):
            out[k] = scrub(out[k]).strip()
    if isinstance(out.get("people"), list):
        out["people"] = [scrub(p) for p in out["people"] if isinstance(p, str)]
    out["affects"] = sorted(set(out.get("affects") or []))
    if out["kind"] in OPEN_KINDS and not out.get("status"):
        out["status"] = "open"
    out["ingested_at"] = now_iso()
    out["run_id"] = run_id
    return out


def meeting_file(target: str, item: dict) -> Path:
    _, _, mdir = target_dirs(target)
    day = local_day(item["occurred_at"])
    short = slugify(item["id"])[-8:]
    return mdir / f"{day}-{slugify(item['title'], 40)}-{short}.md"


def render_meeting(item: dict) -> str:
    ref = item.get("source_ref") or {}
    link = ref.get("view_url") or ref.get("permalink") or ref.get("recap_url") or ""
    lines = [
        f"# {item['title']}",
        "",
        f"**When:** {item['occurred_at']}  ",
        f"**Source:** {source_label(item)}{f' ([open]({link}))' if link else ''}  ",
        f"**Recap from:** {ref.get('notetaker', 'n/a')}  ",
        f"**Attendee domains:** {', '.join(item.get('attendee_domains') or []) or 'unknown'}  ",
        f"**Affects:** {', '.join(item.get('affects') or []) or 'n/a'}",
        "",
        "> Machine-filed by /client-intel-sync. The recap is the notetaker's summary, not a transcript,",
        "> and client statements are hypotheses until the operator confirms them.",
        "",
    ]
    if item.get("summary"):
        lines += ["## Summary", "", item["summary"], ""]
    if item.get("body"):
        lines += ["## Recap as received", "", item["body"], ""]
    if ref.get("full_notes_url"):
        lines += [f"Full notes (needs the notetaker account): {ref['full_notes_url']}", ""]
    return "\n".join(lines).rstrip() + "\n"


def _record_drops(run_id: str, dropped: int) -> None:
    """Keep the per-day count of guard drops (a number only, never what was dropped)."""
    day = now_iso()[:10]
    path = HUB / "daily" / f"{day}.drops.json"
    hist = [h for h in read_json(path, []) if h.get("run_id") != run_id]
    hist.append({"run_id": run_id, "at": now_iso(), "dropped_not_client": dropped})
    write_json(path, hist)


def cmd_ingest(items_path: Path, run_id: str | None, dry_run: bool = False) -> dict:
    items = read_json(items_path, None)
    if isinstance(items, dict):
        items = items.get("items")
    if not isinstance(items, list):
        raise SystemExit("ingest: expected a JSON list of items (or {items: [...]})")
    run_id = run_id or to_local(dt.datetime.now(dt.timezone.utc)).strftime("run-%Y%m%d-%H%M%S")
    targets = set(known_targets())
    roster = read_json(ROSTER_FILE, {})
    errors, by_target, seen, dropped_idx = [], {}, set(), []
    for i, it in enumerate(items):
        if not isinstance(it, dict):
            errors.append({"index": i, "id": None, "errors": ["not an object"]})
            continue
        if it.get("target"):
            resolved = resolve_target(it["target"], targets, roster)
            if resolved is None:
                dropped_idx.append(i)  # cross-agency guard: not one of our clients, never stored
                continue
            it = {**it, "target": resolved}
        errs = validate(it)
        if not errs and (it["target"], it["id"]) in seen:
            errs = ["duplicate id within this file"]
        if errs:
            errors.append({"index": i, "id": it.get("id"), "errors": errs})
        else:
            seen.add((it["target"], it["id"]))
            by_target.setdefault(it["target"], []).append(it)
    if errors:
        print(json.dumps({"ok": False, "rejected": errors, "dropped_not_client": len(dropped_idx)}, indent=2))
        raise SystemExit(2)  # all-or-nothing: fix the file, then re-run
    if dry_run:
        report = {"ok": True, "dry_run": True, "received": len(items),
                  "targets": {t: len(v) for t, v in sorted(by_target.items())},
                  "dropped_not_client": len(dropped_idx), "dropped_indexes": dropped_idx}
        print(json.dumps(report, indent=2))
        return report

    report = {"ok": True, "run_id": run_id, "received": len(items), "new": 0, "updated": 0, "duplicate": 0,
              "dropped_not_client": len(dropped_idx), "targets": {}}
    for target, its in sorted(by_target.items()):
        ledger_items = load_ledger(target)
        pos = {e["id"]: i for i, e in enumerate(ledger_items)}
        _, ledger, _ = target_dirs(target)
        ledger.parent.mkdir(parents=True, exist_ok=True)
        new, upd, dup = 0, 0, 0
        for it in its:
            c = clean(it, run_id)
            if c["id"] in pos:
                # Everything is append-only except a day's activity count, which is recounted
                # while the day is still open: a changed count replaces the old line.
                old = ledger_items[pos[c["id"]]]
                if c["kind"] == "activity_count" and any(old.get(k) != c.get(k) for k in COUNT_FIELDS):
                    c["first_ingested_at"] = old.get("first_ingested_at") or old.get("ingested_at")
                    ledger_items[pos[c["id"]]] = c
                    upd += 1
                else:
                    dup += 1
                continue
            if c["kind"] == "meeting":
                mf = meeting_file(target, c)
                write_text(mf, render_meeting(c))
                c["meeting_file"] = str(mf.relative_to(PROFILES)).replace("\\", "/")
            pos[c["id"]] = len(ledger_items)
            ledger_items.append(c)
            new += 1
        if new or upd:
            write_text(ledger, "".join(json.dumps(e, ensure_ascii=False) + "\n" for e in ledger_items))
        render_target(target)
        report["targets"][target] = {"new": new, "updated": upd, "duplicate": dup}
        report["new"] += new
        report["updated"] += upd
        report["duplicate"] += dup
    if dropped_idx:
        _record_drops(run_id, len(dropped_idx))
    print(json.dumps(report, indent=2))
    return report


# --------------------------------------------------------------------------- render

def source_label(it: dict) -> str:
    ref = it.get("source_ref") or {}
    if it["source"] == "email":
        return f"Email, {ref.get('notetaker') or 'recap'}"
    if it["source"] == "slack":
        return f"Slack #{ref.get('channel', '?')}"
    if it["source"] == "calendar":
        return "Calendar"
    if it["source"] == "file":
        return f"File {ref.get('file') or ''}".strip()
    return "Manual"


def _link(it: dict) -> str:
    ref = it.get("source_ref") or {}
    url = ref.get("permalink") or ref.get("view_url") or ref.get("html_link")
    return f" [link]({url})" if url else ""


def _line(it: dict, feed_dir: Path) -> str:
    aff = f" · affects: {', '.join(it['affects'])}" if it.get("affects") else ""
    conf = " · implied" if it.get("confidence") == "implied" else ""
    who = f" ({'; '.join(it['people'])})" if it.get("people") else ""
    summary = f": {it['summary']}" if it.get("summary") else ""
    mf = ""
    if it.get("meeting_file"):
        full = PROFILES / it["meeting_file"]
        rel = full.relative_to(feed_dir) if full.is_relative_to(feed_dir) else None
        mf = f" [notes]({str(rel).replace(chr(92), '/')})" if rel else ""
    return f"- **{it['kind'].replace('_', ' ')}** {it['title']}{summary}{who} ({source_label(it)}{conf}){aff}{_link(it)}{mf}"


def _resolved_ids(items: list[dict]) -> set[str]:
    out = set()
    for it in items:
        r = it.get("resolves")
        if isinstance(r, str):
            out.add(r)
        elif isinstance(r, list):
            out.update(x for x in r if isinstance(x, str))
    return out


def feed_sections(items: list[dict]) -> dict:
    """Split a ledger into the feed's sections (shared by render and the activity-log line)."""
    now = dt.datetime.now(dt.timezone.utc)
    resolved = _resolved_ids(items)
    live = [it for it in items if it["id"] not in resolved and it["kind"] != "resolution"]
    live.sort(key=lambda it: parse_ts(it["occurred_at"]), reverse=True)

    def age_days(it):
        return (now - parse_ts(it["occurred_at"])).days

    return {
        "live": live,
        "attention": [
            it for it in live
            if age_days(it) <= ATTENTION_WINDOW_DAYS
            and (it["kind"] in ATTENTION_KINDS or (set(it.get("affects") or []) & PIPELINE_AREAS and it["kind"] in {"decision", "feedback", "request", "risk", "update"}))
            and it["kind"] not in OPEN_KINDS | {"meeting", "activity_count", "upcoming"}
        ],
        "open": [it for it in live if it["kind"] in OPEN_KINDS and it.get("status", "open") == "open"][:30],
        "recent": [it for it in live if age_days(it) <= FEED_WINDOW_DAYS and it["kind"] != "upcoming"],
        "upcoming": [it for it in live if it["kind"] == "upcoming" and parse_ts(it["occurred_at"]) >= now - dt.timedelta(hours=2)],
    }


def render_target(target: str) -> Path:
    feed, ledger, mdir = target_dirs(target)
    items = load_ledger(target)
    st = load_state()
    roster = read_json(ROSTER_FILE, {})
    name = (roster.get("clients", {}).get(target) or {}).get("name") or (
        f"{cfg()['agency_name']} (internal ops)" if target == "agency" else target)
    sec = feed_sections(items)
    attention, open_items, recent, upcoming = sec["attention"], sec["open"], sec["recent"], sec["upcoming"]
    feed_dir = feed.parent

    out = [
        f"# Client Intel: {name} (live feed)",
        "",
        f"**Last synced:** {st.get('last_run_at', 'never')}. **Items on file:** {len(items)}"
        f" (first {min((it['occurred_at'][:10] for it in items), default='n/a')}). "
        "**Sources:** meeting recap emails, calendar, Slack and local files, read through the session's "
        "read-only connectors (each run's digest names the accounts and workspace read).",
        "",
        "Written by `/client-intel-sync` (protocol: `outbound/reference/client-intel-feed.md`). Read the first two",
        "sections before you plan, build, launch or report for this client. Everything here is what someone said",
        "in a meeting or in Slack: treat client statements as hypotheses and confirm anything material with the",
        "operator before it changes a locked decision. Do not edit by hand; the ledger in `_intel/intel-log.jsonl`",
        "is the source of truth and this file is re-rendered from it.",
        "",
        f"## Needs attention (last {ATTENTION_WINDOW_DAYS} days, affects the pipeline)",
        "",
    ]
    out += [_line(it, feed_dir) for it in attention] or ["- Nothing new that changes the offer, list, copy, launch or infrastructure."]
    out += ["", "## Open items (requests and action items not yet closed)", ""]
    out += [_line(it, feed_dir) for it in open_items] or ["- None open."]
    if upcoming:
        out += ["", "## Coming up", ""]
        out += [_line(it, feed_dir) for it in sorted(upcoming, key=lambda i: i["occurred_at"])]
    out += ["", f"## Recent activity (last {FEED_WINDOW_DAYS} days, newest first)", ""]
    if recent:
        day = None
        for it in recent:
            d = local_day(it["occurred_at"])
            if d != day:
                out += ["", f"### {d}"] if day else [f"### {d}"]
                day = d
            out.append(_line(it, feed_dir))
    else:
        out.append("- No activity in the window.")
    meetings = sorted(mdir.glob("*.md"), reverse=True)[:20] if mdir.exists() else []
    out += ["", "## Meeting notes on file", ""]
    out += [f"- [{m.stem}]({str(m.relative_to(feed_dir)).replace(chr(92), '/')})" for m in meetings] or ["- None yet."]
    out += ["", f"Full history: `{str(ledger.relative_to(feed_dir)).replace(chr(92), '/')}`.", ""]
    write_text(feed, "\n".join(out))
    return feed


# --------------------------------------------------------------------------- activity log

_LOG_HEADER = re.compile(r"^#{2,3}\s.*\bLOG\b", re.I)
_STATE_HEADER = re.compile(r"^#{2,3}\s.*CURRENT STATE", re.I)
_INTEL_LINE = re.compile(r"^\s*-\s*\**Client intel\b", re.I)


def cmd_activity(target: str, when: str, new: int, phrase: str) -> dict:
    """Write the one LOG line and the one CURRENT STATE line the protocol allows.

    Touches nothing else in the file. Idempotent: the same LOG line is never added twice.
    Fails loud (ok: false) when the file or its LOG section is missing, instead of guessing.
    """
    path = PROFILES / target / "activity-log.md"
    if target in SPECIAL_TARGETS or not path.exists():
        return {"ok": False, "target": target, "error": "no activity-log.md"}
    raw = path.read_bytes()
    eol = "\r\n" if b"\r\n" in raw else "\n"
    lines = raw.decode("utf-8").split(eol)
    sec = feed_sections(load_ledger(target))
    k, m = len(sec["attention"]), len(sec["open"])
    log_line = (f"- [{when}] client-intel · sync · UPDATED: {new} new items, {k} need attention"
                f"{f' ({phrase})' if phrase else ''}, see client-intel.md")
    state_line = f"  - Client intel (meetings + Slack): synced {when[:10]} · {k} need attention · {m} open items · client-intel.md"

    log_idx = next((i for i, l in enumerate(lines) if _LOG_HEADER.match(l)), None)
    if log_idx is None:
        return {"ok": False, "target": target, "error": "no LOG section header"}
    result = {"ok": True, "target": target, "log": "exists", "state": "unchanged"}
    if log_line not in lines:
        at = log_idx + 1
        while at < len(lines) and not lines[at].strip():
            at += 1  # first entry goes right under the header, after any blank line
        lines.insert(at, log_line)
        result["log"] = "added"

    # The live block, not an archived "(prior) CURRENT STATE" some logs keep below it.
    st_idx = next((i for i, l in enumerate(lines) if _STATE_HEADER.match(l) and "(prior)" not in l.lower()),
                  next((i for i, l in enumerate(lines) if _STATE_HEADER.match(l)), None))
    if st_idx is not None:
        end = next((i for i in range(st_idx + 1, len(lines)) if lines[i].startswith("## ")), len(lines))
        existing = next((i for i in range(st_idx + 1, end) if _INTEL_LINE.match(lines[i])), None)
        if existing is not None:
            if lines[existing] != state_line:
                lines[existing] = state_line
                result["state"] = "replaced"
        else:
            sub = [i for i in range(st_idx + 1, end) if re.match(r"^\s{2,}-\s", lines[i])]
            at = (sub[-1] + 1) if sub else next((i for i in range(end - 1, st_idx, -1) if lines[i].strip()), st_idx) + 1
            lines.insert(at, state_line)
            result["state"] = "added"
    else:
        result["state"] = "no CURRENT STATE block"
    path.write_bytes(eol.join(lines).encode("utf-8"))
    result.update({"need_attention": k, "open_items": m})
    return result


# --------------------------------------------------------------------------- digest

def cmd_digest(date: str, coverage_path: Path | None) -> Path:
    # Coverage accumulates per date, so a second run that day adds to the first instead of hiding it.
    hist_file = HUB / "daily" / f"{date}.coverage.json"
    history = read_json(hist_file, [])
    if coverage_path:
        new_cov = read_json(coverage_path, {})
        rid = new_cov.get("run_id")
        history = [h for h in history if not rid or h.get("run_id") != rid] + [new_cov]
        write_json(hist_file, history)
    drops = read_json(HUB / "daily" / f"{date}.drops.json", [])
    roster = read_json(ROSTER_FILE, {})
    targets = known_targets() + list(SPECIAL_TARGETS)
    per: dict[str, list] = {}
    for t in targets:
        its = [it for it in load_ledger(t) if (it.get("ingested_at") or "")[:10] == date]
        if its:
            per[t] = sorted(its, key=lambda it: it["occurred_at"], reverse=True)
    total = sum(len(v) for v in per.values())
    out = [f"# Client Intel Digest: {date}", ""]
    out.append(f"**{total} new items** across {len([t for t in per if t not in SPECIAL_TARGETS])} clients"
               f"{', plus agency items' if 'agency' in per else ''}.")
    out.append("")
    shortfalls = [(c.get("run_id") or f"run {n}", s) for n, c in enumerate(history, 1) for s in c.get("shortfalls", [])]
    if shortfalls:
        out += ["## Shortfalls (read these first)", ""] + [f"- {s} ({rid})" for rid, s in shortfalls] + [""]
    skipped = sum(int(c.get("skipped_not_client") or 0) for c in history)
    dropped = sum(int(d.get("dropped_not_client") or 0) for d in drops)
    if history or drops:
        out += ["## Cross-agency guard", "",
                f"- {skipped} items skipped while reading and {dropped} dropped at ingest because they were not"
                " about a client with a profile here. None of them was stored; only these counts are kept.", ""]
    attn = []
    for t, its in per.items():
        for it in its:
            if it["kind"] in ATTENTION_KINDS or (set(it.get("affects") or []) & PIPELINE_AREAS and it["kind"] in {"decision", "request", "risk", "feedback"}):
                attn.append((t, it))
    out += ["## Needs attention", ""]
    if attn:
        for t, it in attn:
            nm = (roster.get("clients", {}).get(t) or {}).get("name") or t
            out.append(f"- **{nm}**: {it['title']}{': ' + it['summary'] if it.get('summary') else ''} ({source_label(it)})")
    else:
        out.append("- Nothing that changes an offer, list, copy, launch or infrastructure decision.")
    out += ["", "## By client", ""]
    for t, its in per.items():
        if t in SPECIAL_TARGETS:
            continue
        nm = (roster.get("clients", {}).get(t) or {}).get("name") or t
        out += [f"### {nm} ({len(its)} new), feed: `profiles/{t}/client-intel.md`", ""]
        out += [f"- {it['kind'].replace('_', ' ')}: {it['title']} ({source_label(it)})" for it in its] + [""]
    if "agency" in per:
        out += [f"## {cfg()['agency_name']} internal ops", ""]
        out += [f"- {it['kind'].replace('_', ' ')}: {it['title']} ({source_label(it)})" for it in per["agency"]] + [""]
    for n, cov in enumerate(history, 1):
        out += [f"## Coverage ({cov.get('run_id') or f'run {n}'})", ""]
        acc = cov.get("accounts") or {}
        if acc:
            out.append("- Read: " + "; ".join(f"{k} {v}" for k, v in acc.items() if v))
        w = cov.get("window") or {}
        if w:
            out.append(f"- Window: {w.get('from')} to {w.get('to')}")
        g = cov.get("email") or {}
        if g:
            out.append(f"- Email: {g.get('threads_seen', 0)} recap threads seen, {g.get('recaps_new', 0)} new."
                       f" Senders searched: {', '.join(g.get('senders', [])) or 'n/a'}")
        c = cov.get("calendar") or {}
        if c:
            out.append(f"- Calendar: {c.get('events_seen', 0)} meetings in the window.")
            missing = [m for m in c.get("meetings", []) if not m.get("had_recap")]
            if missing:
                out.append("- Meetings with no recap email (the notetaker was not on, or the operator was not copied):")
                out += [f"  - {m.get('start', '')[:16]} {m.get('title', '')} ({m.get('target', '?')})" for m in missing]
        s = cov.get("slack") or {}
        if s:
            out.append(f"- Slack: workspace {s.get('workspace') or 'not named'}, guard {s.get('guard', 'n/a')};"
                       f" {len(s.get('channels', []))} channels read,"
                       f" {sum(ch.get('messages_read', 0) for ch in s.get('channels', []))} messages.")
            if s.get("unclassified_channels"):
                out.append(f"- Slack channels named after one of our clients but not yet in the roster: "
                           f"{', '.join(s['unclassified_channels'])}")
            if s.get("other_channels_count"):
                out.append(f"- Slack channels not read and not named (not ours, or not classed): {s['other_channels_count']}")
        f = cov.get("files") or {}
        if f:
            out.append(f"- Local files: {f.get('read', 0)} read, {f.get('new', 0)} new items.")
        for b in cov.get("blocked", []):
            out.append(f"- BLOCKED: {b}")
        for note in cov.get("notes", []):
            out.append(f"- Note: {note}")
    path = HUB / "daily" / f"{date}.md"
    write_text(path, "\n".join(out).rstrip() + "\n")
    print(json.dumps({"ok": True, "digest": str(path), "new_items": total}, indent=2))
    return path


# --------------------------------------------------------------------------- verify

def cmd_verify(items_path: Path | None) -> int:
    problems, summary = [], {}
    for t in known_targets() + list(SPECIAL_TARGETS):
        feed, ledger, _ = target_dirs(t)
        if not ledger.exists():
            continue
        items = load_ledger(t)
        ids = [it["id"] for it in items]
        dups = {i for i in ids if ids.count(i) > 1}
        if dups:
            problems.append(f"{t}: duplicate ids {sorted(dups)[:5]}")
        if not feed.exists():
            problems.append(f"{t}: ledger exists but {feed.name} was never rendered")
        elif feed.stat().st_mtime + 1 < ledger.stat().st_mtime:
            problems.append(f"{t}: {feed.name} is older than its ledger (re-render)")
        summary[t] = len(items)
    if items_path:
        want = read_json(items_path, [])
        want = want.get("items") if isinstance(want, dict) else want
        targets, roster = set(known_targets()), read_json(ROSTER_FILE, {})
        missing, dropped = [], 0
        cache: dict[str, set] = {}
        for it in want:
            t = resolve_target(it.get("target"), targets, roster)
            if t is None:
                dropped += 1  # the guard dropped it at ingest; it is expected to be absent
                continue
            cache.setdefault(t, {e["id"] for e in load_ledger(t)})
            if it.get("id") not in cache[t]:
                missing.append(f"{t}:{it.get('id')}")
        summary["_expected"] = len(want) - dropped
        summary["_present"] = summary["_expected"] - len(missing)
        summary["_dropped_not_client"] = dropped
        if missing:
            problems.append(f"{len(missing)} expected items missing: {missing[:5]}")
    print(json.dumps({"ok": not problems, "problems": problems, "items_per_target": summary}, indent=2))
    return 0 if not problems else 1


# --------------------------------------------------------------------------- misc commands

def cmd_file_id(path: Path, prefix: str = "file") -> dict:
    """A stable id for a local file or a saved paste: the prefix plus a content hash."""
    if not path.exists():
        raise SystemExit(f"file-id: {path} not found")
    return {"ok": True, "id": f"{prefix}:{hashlib.sha1(path.read_bytes()).hexdigest()[:12]}"}


def cmd_config() -> dict:
    c = cfg()
    return {
        "ok": True,
        "config_file": str(CONFIG_FILE),
        "config_file_exists": CONFIG_FILE.exists(),
        "agency_name": c["agency_name"],
        "internal_domains": c["internal_domains"],
        "timezone": _tz()[1],
        "slack_workspace": c["slack_workspace"],
        "aliases_file": c["aliases_file"],
        "source": c["_source"],
    }


# --------------------------------------------------------------------------- main

def main(argv=None) -> int:
    common = argparse.ArgumentParser(add_help=False)
    common.add_argument("--agency-name", dest="agency_name", default=argparse.SUPPRESS)
    common.add_argument("--internal-domains", dest="internal_domains", default=argparse.SUPPRESS,
                        help="comma-separated email domains that are us")
    common.add_argument("--timezone", dest="timezone", default=argparse.SUPPRESS,
                        help='"local" (default), "UTC", "+08:00", or an IANA name when tzdata is installed')
    common.add_argument("--slack-workspace", dest="slack_workspace", default=argparse.SUPPRESS)
    common.add_argument("--aliases-file", dest="aliases_file", default=argparse.SUPPRESS)

    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("config", parents=[common])
    sub.add_parser("roster", parents=[common])
    sub.add_parser("state", parents=[common])
    p = sub.add_parser("state-set", parents=[common]); p.add_argument("--json", required=True, type=Path)
    p = sub.add_parser("ingest", parents=[common]); p.add_argument("--items", required=True, type=Path); p.add_argument("--run-id")
    p.add_argument("--dry-run", action="store_true", help="validate only, write nothing")
    p = sub.add_parser("render", parents=[common]); p.add_argument("--target"); p.add_argument("--all", action="store_true")
    p = sub.add_parser("digest", parents=[common]); p.add_argument("--date", required=True); p.add_argument("--coverage", type=Path)
    p = sub.add_parser("verify", parents=[common]); p.add_argument("--items", type=Path)
    p = sub.add_parser("activity", parents=[common]); p.add_argument("--target", required=True); p.add_argument("--when", required=True)
    p.add_argument("--new", type=int, required=True); p.add_argument("--phrase", default="")
    p = sub.add_parser("file-id", parents=[common]); p.add_argument("path", type=Path)
    p.add_argument("--prefix", default="file", choices=("file", "manual"))
    a = ap.parse_args(argv)
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    CLI_OVERRIDES.clear()
    CLI_OVERRIDES.update({k: getattr(a, k) for k in DEFAULT_CONFIG if hasattr(a, k)})
    reset_config()

    if a.cmd == "config":
        print(json.dumps(cmd_config(), indent=2, ensure_ascii=False))
    elif a.cmd == "roster":
        r = build_roster()
        print(json.dumps({"ok": True, "roster": str(ROSTER_FILE), "clients": len(r["clients"]),
                          "timezone": r["timezone"], "slack_workspace": r["slack_workspace"],
                          "internal_domains": r["internal_domains"],
                          "channels": {n: f"{c['class']}{'/' + c['client'] if c['client'] else ''}" for n, c in r["channels"].items()}},
                         indent=2, ensure_ascii=False))
    elif a.cmd == "state":
        print(json.dumps(load_state(), indent=2))
    elif a.cmd == "state-set":
        cmd_state_set(a.json)
    elif a.cmd == "ingest":
        cmd_ingest(a.items, a.run_id, a.dry_run)
    elif a.cmd == "render":
        ts = (known_targets() + list(SPECIAL_TARGETS)) if a.all else [a.target]
        for t in ts:
            if t and target_dirs(t)[1].exists():
                print(render_target(t))
    elif a.cmd == "digest":
        cmd_digest(a.date, a.coverage)
    elif a.cmd == "verify":
        return cmd_verify(a.items)
    elif a.cmd == "activity":
        r = cmd_activity(a.target, a.when, a.new, a.phrase)
        print(json.dumps(r, indent=2, ensure_ascii=False))
        return 0 if r["ok"] else 1
    elif a.cmd == "file-id":
        print(json.dumps(cmd_file_id(a.path, a.prefix), indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
