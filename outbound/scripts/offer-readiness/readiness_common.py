"""Shared helpers for the Offer Readiness scripts (outbound/reference/offer-readiness.md).

An offer is any mapping in client-profile.yaml that carries both `aaron_rank` and
`lead_magnet_client_ok` (the Aaron-lane schema). One offer is usually stored several
times ("mirrors"): the top-level `offer` block mirrors the priority-1 segment, and each
`offer.segments[]` entry carries its own primary and validation arms. Every script reads
and writes all mirrors of an offer together.

Profiles recorded before the Aaron lane (no `aaron_rank`) have no offers here; the
scripts report that as "not applicable" rather than failing.
"""
import csv, glob, os, re

CR, LF = chr(13), chr(10)
EVID = ("lead_magnet_client_ok_by", "lead_magnet_client_ok_at", "lead_magnet_client_ok_evidence")
# Match the approval key WITH its colon: without it the prefixed evidence keys match too.
OK_KEY_RE = re.compile(r"^(\s*)lead_magnet_client_ok:")
# Fields that must agree across every mirror of one offer. `qualification` may differ by
# segment on purpose, so it is not a drift key.
DRIFT_KEYS = ["lead_magnet", "lead_magnet_yes_honored_by", "lead_magnet_client_ok", *EVID,
              "delivery_mode", "capacity", "sample", "status"]


def offers_with_mirrors(profile):
    """{aaron_rank: [(where, block), ...]} for every Aaron-lane offer mirror."""
    o = (profile or {}).get("offer") or {}
    found = []

    def add(block, where):
        if isinstance(block, dict) and block.get("aaron_rank") is not None and "lead_magnet_client_ok" in block:
            # PyYAML (YAML 1.1) reads a bare `yes` / `no` as a boolean; the schema's values are strings.
            v = block["lead_magnet_client_ok"]
            if isinstance(v, bool):
                block["lead_magnet_client_ok"] = "yes" if v else "no"
            found.append((block["aaron_rank"], where, block))

    add(o, "offer")
    for i, arm in enumerate(o.get("validation_arms") or []):
        add(arm, f"offer.validation_arms[{i}]")
    for s in o.get("segments") or []:
        if not isinstance(s, dict):
            continue
        name = s.get("segment", "?")
        add(s, f"segments.{name}")
        for i, arm in enumerate(s.get("validation_arms") or []):
            add(arm, f"segments.{name}.validation_arms[{i}]")
    by_rank = {}
    for rank, where, block in found:
        by_rank.setdefault(rank, []).append((where, block))
    return by_rank


def primary_rank(profile):
    o = (profile or {}).get("offer") or {}
    return o.get("aaron_rank")


def drift(mirrors):
    first = mirrors[0][1]
    return [f"{where}.{k}" for where, b in mirrors[1:] for k in DRIFT_KEYS if b.get(k) != first.get(k)]


def owner_rank(lines, i, col):
    """The aaron_rank of the mapping that holds line i at column col."""
    for j in range(i - 1, -1, -1):
        m = re.match(r"^(\s*)(- )?aaron_rank:\s*(\d+)", lines[j])
        if m and len(m.group(1)) + (2 if m.group(2) else 0) == col:
            return int(m.group(3))
    return None


def eol_of_text(raw):
    return CR + LF if CR + LF in raw else LF


def campaigns_by_offer(client_dir, ranks):
    """{rank: [(slug, rows)]} from each campaign's leads.verified.csv `offer` column.
    A campaign counts only when that column holds a known offer rank."""
    out = {}
    for f in sorted(glob.glob(os.path.join(client_dir, "campaigns", "*", "leads.verified.csv"))):
        slug = os.path.basename(os.path.dirname(f))
        with open(f, encoding="utf-8-sig", newline="") as fh:
            rows = list(csv.DictReader(fh))
        if not rows or "offer" not in rows[0]:
            continue
        m = re.search(r"\d+", str(rows[0]["offer"] or ""))
        if m and int(m.group()) in ranks:
            out.setdefault(int(m.group()), []).append((slug, len(rows)))
    return out


CURRENT_HEADINGS = ("## Current message", "## Offer section (current message)")  # second = legacy


def asks_sections(text):
    """{'current': str|None, 'legacy': bool, 'sent': [(date, block)] newest first} from client-asks.md
    (outbound/reference/client-messages.md). A section runs from its `## ` heading to the next one."""
    import datetime
    text = text.replace(CR + LF, LF)
    parts = re.split(r"(?m)^(?=## )", text)
    current, legacy, sent = None, False, []
    for p in parts:
        first = p.split(LF, 1)[0].strip()
        if first in CURRENT_HEADINGS and current is None:
            current, legacy = p, first != CURRENT_HEADINGS[0]
        elif first == "## Sent":
            for blk in re.split(r"(?m)^(?=### Sent )", p)[1:]:
                m = re.match(r"### Sent (\d{4}-\d{2}-\d{2})", blk)
                if m:
                    sent.append((datetime.date.fromisoformat(m.group(1)), blk))
    sent.sort(key=lambda t: t[0], reverse=True)
    return {"current": current, "legacy": legacy, "sent": sent}


def ask_state(client_dir, rank=None):
    """(label, sent_date) for one offer's client ask. The clock runs from the newest `### Sent` entry
    carrying `[offer-<rank>]`; otherwise from the `Sent:` line inside the current message."""
    import datetime
    p = os.path.join(client_dir, "client-asks.md")
    if not os.path.exists(p):
        return None, None
    s = asks_sections(open(p, encoding="utf-8").read())
    if rank is not None:
        for d, blk in s["sent"]:
            if f"[offer-{rank}]" in blk:
                return f"sent {d.isoformat()}", d
    if s["current"] is None:
        return "no current message", None
    m = re.search(r"^Sent:\s*(\S+)", s["current"], re.M)
    if not m:
        return "no Sent: line", None
    try:
        return f"sent {m.group(1)}", datetime.date.fromisoformat(m.group(1))
    except ValueError:
        return "draft, NOT SENT", None


def comparable(text):
    """A generated view with its volatile lines removed (the GENERATED header, which carries
    the profile's sha1, and the `Regenerated <date>` lines), so `--check` flags real content
    drift only, not a new day or an unrelated write to the profile."""
    if text is None:
        return None
    keep = [l for l in text.replace(CR + LF, LF).split(LF)
            if not l.startswith("<!-- GENERATED by") and not l.startswith("Regenerated ")]
    return LF.join(keep)
