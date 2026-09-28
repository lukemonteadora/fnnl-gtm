"""The only writer of an offer's client approval (outbound/reference/offer-readiness.md).

    python outbound/scripts/offer-readiness/offer_approval.py set <client-dir> <aaron-rank> yes --terms "<exactly what the client confirmed>" --by "<who>" --evidence "<permalink|email id|meeting note>" [--at YYYY-MM-DD] [--dry-run]
    python outbound/scripts/offer-readiness/offer_approval.py set <client-dir> <aaron-rank> no  --by "<who>" --evidence "<...>" [--at YYYY-MM-DD] [--dry-run]

Writes `lead_magnet_client_ok` plus its evidence (lead_magnet_client_ok_by, _at, _evidence)
in EVERY mirror of that offer in client-profile.yaml (top level and each segment), then
appends one line to activity-log.md. Text-level edit, so comments and YAML anchors survive.

On a yes (Capability Truth, /offer-test-slate): --terms is required and replaces
`lead_magnet_client_dependency` in every mirror, so copy can claim only what was confirmed.
On a no for a validation arm: that arm's existing `status` becomes `vetoed` in every mirror,
the rank is appended to `test_slate.vetoed_offers`, and `test_slate.client_response`
becomes `vetoed_some`. On a no for the primary offer: nothing is promoted automatically
(promotion changes an offer, which is the recorder's job under Aaron's call); the script
prints and logs the follow-on action instead.

Refuses: agency-honored offers (their value stays `not_needed`, no approval exists), an
empty --evidence, a yes without --terms, an offer rank with no mirrors, mirrors that
disagree on who honors the yes, a profile not yet migrated (run readiness_fields.py first),
and a block-scalar dependency it cannot rewrite safely. `lead_magnet_client_ok` remains the
one approval value; no status field is added. A client `no` reopens a frozen Phase 2
(phase-protocol.md); a `yes` or evidence does not.

Every match on the approval key uses the colon (`lead_magnet_client_ok:`): without it the
prefixed evidence keys match too.
"""
import argparse, datetime, os, re, sys
import yaml

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from readiness_common import CR, LF, EVID, OK_KEY_RE, owner_rank, eol_of_text  # noqa: E402

KEYS = ("lead_magnet_client_ok",) + EVID


def indent(line):
    return len(line) - len(line.lstrip(" "))


def eol_of(line):
    return CR + LF if line.endswith(CR + LF) else LF


def block_bounds(lines, i, col):
    """The mapping that holds line i at column col: from its list-item start to its end."""
    start = i
    for j in range(i - 1, -1, -1):
        if not lines[j].strip():
            continue
        if indent(lines[j]) < col:
            start = j if re.match(r"^\s*- ", lines[j]) and indent(lines[j]) == col - 2 else j + 1
            break
    end = len(lines)
    for j in range(i + 1, len(lines)):
        if lines[j].strip() and indent(lines[j]) < col:
            end = j
            break
    return start, end


def key_line(lines, start, end, col, key):
    for j in range(start, end):
        m = re.match(r"^(\s*)(- )?" + key + r":(.*)$", lines[j].rstrip(CR + LF))
        if m and len(m.group(1)) + (2 if m.group(2) else 0) == col:
            return j, m
    return None, None


def yaml_str(s):
    return '"' + s.replace("\\", "\\\\").replace('"', '\\"') + '"'


def test_slate_bounds(lines):
    t = next((k for k, l in enumerate(lines) if re.match(r"^\s*test_slate:\s*$", l.rstrip(CR + LF))), None)
    if t is None:
        return None, None
    col = indent(lines[t])
    end = next((k for k in range(t + 1, len(lines)) if lines[k].strip() and indent(lines[k]) <= col), len(lines))
    return t + 1, end


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["set"])
    ap.add_argument("client_dir")
    ap.add_argument("offer", help="aaron_rank of the offer, e.g. 1 or offer-1")
    ap.add_argument("value", choices=["yes", "no"])
    ap.add_argument("--by", required=True)
    ap.add_argument("--evidence", required=True)
    ap.add_argument("--terms", default="", help="required on yes: exactly what the client confirmed")
    ap.add_argument("--at", default=datetime.date.today().isoformat())
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    if not a.evidence.strip():
        sys.exit("refused: --evidence is empty (a Slack permalink, email id or meeting note is required)")
    if not a.by.strip():
        sys.exit("refused: --by is empty (who gave the answer)")
    if a.value == "yes" and not a.terms.strip():
        sys.exit("refused: a yes needs --terms (exactly what the client confirmed; copy may claim only that)")
    try:
        datetime.date.fromisoformat(a.at)
    except ValueError:
        sys.exit(f"refused: --at {a.at!r} is not YYYY-MM-DD")
    digits = re.sub(r"\D", "", a.offer)
    if not digits:
        sys.exit(f"refused: {a.offer!r} is not an offer rank")
    rank = int(digits)
    prof = os.path.join(a.client_dir, "client-profile.yaml")
    raw = open(prof, encoding="utf-8", newline="").read()
    parsed = yaml.safe_load(raw)
    primary_rank = ((parsed or {}).get("offer") or {}).get("aaron_rank")
    lines = raw.splitlines(keepends=True)

    hits = []
    for i, line in enumerate(lines):
        m = OK_KEY_RE.match(line)
        if m and owner_rank(lines, i, len(m.group(1))) == rank:
            hits.append((i, len(m.group(1))))
    if not hits:
        sys.exit(f"refused: no offer with aaron_rank {rank}")

    blocks = [(i, col) + block_bounds(lines, i, col) for i, col in hits]
    honored = set()
    for i, col, s, e in blocks:
        j, m = key_line(lines, s, e, col, "lead_magnet_yes_honored_by")
        honored.add(m.group(3).split("#")[0].strip() if m else None)
    if len(honored) != 1:
        sys.exit(f"refused: mirrors disagree on lead_magnet_yes_honored_by: {honored}")
    if honored == {"agency"}:
        sys.exit("refused: agency-honored offer; its lead_magnet_client_ok stays not_needed")

    new = {"lead_magnet_client_ok": a.value, "lead_magnet_client_ok_by": yaml_str(a.by),
           "lead_magnet_client_ok_at": yaml_str(a.at), "lead_magnet_client_ok_evidence": yaml_str(a.evidence)}
    changed, extra = 0, []
    for i, col, s, e in blocks:
        for k in range(i, i + len(KEYS)):
            m = re.match(r"^(\s*)([a-z_]+):", lines[k]) if k < len(lines) else None
            if not m or len(m.group(1)) != col or m.group(2) != KEYS[k - i]:
                sys.exit(f"refused: line {k+1} is not the expected evidence field (run readiness_fields.py first)")
            tail = re.search(r"\s+#.*$", lines[k].rstrip(CR + LF)) if m.group(2) == "lead_magnet_client_ok" else None
            lines[k] = f"{' ' * col}{m.group(2)}: {new[m.group(2)]}{tail.group(0) if tail else ''}{eol_of(lines[k])}"
            changed += 1
        if a.value == "yes":
            j, m = key_line(lines, s, e, col, "lead_magnet_client_dependency")
            if j is None:
                sys.exit(f"refused: no lead_magnet_client_dependency in the mirror at line {i+1}")
            if m.group(3).strip()[:1] in (">", "|"):
                sys.exit(f"refused: line {j+1} is a block scalar; rewrite the dependency by hand")
            lines[j] = f"{' ' * col}lead_magnet_client_dependency: {yaml_str('CONFIRMED ' + a.at + ': ' + a.terms)}{eol_of(lines[j])}"
            changed += 1
        elif rank != primary_rank:
            j, m = key_line(lines, s, e, col, "status")
            if j is None:
                sys.exit(f"refused: the arm at line {i+1} has no status key to set to vetoed")
            lead = "- " if lines[j].lstrip().startswith("- ") else ""
            lines[j] = f"{' ' * (col - len(lead))}{lead}status: vetoed{eol_of(lines[j])}"
            changed += 1

    if a.value == "no" and rank != primary_rank:
        ts, te = test_slate_bounds(lines)
        if ts is None:
            sys.exit("refused: offer.test_slate not found (vetoed_offers and client_response live there)")
        v = next((k for k in range(ts, te) if re.match(r"^\s*vetoed_offers:", lines[k])), None)
        r = next((k for k in range(ts, te) if re.match(r"^\s*client_response:", lines[k])), None)
        if v is None or r is None:
            sys.exit("refused: test_slate.vetoed_offers or test_slate.client_response not found")
        col, eol = indent(lines[v]), eol_of(lines[v])
        item = f"{' ' * col}- {{aaron_rank: {rank}, at: {yaml_str(a.at)}, by: {yaml_str(a.by)}}}{eol}"
        if re.match(r"^\s*vetoed_offers:\s*(\[\]|null|~)?\s*$", lines[v].rstrip(CR + LF)):
            lines[v] = f"{' ' * col}vetoed_offers:{eol}"
            lines.insert(v + 1, item)
            if r > v:
                r += 1
        else:
            k = v + 1
            while k < len(lines) and lines[k].lstrip().startswith("- ") and indent(lines[k]) == col:
                k += 1
            lines.insert(k, item)
            if r >= k:
                r += 1
        lines[r] = f"{' ' * indent(lines[r])}client_response: vetoed_some{eol_of(lines[r])}"
        changed += 2
        extra.append(f"arm {rank} status vetoed in {len(hits)} mirrors; test_slate.vetoed_offers += {rank}; client_response vetoed_some")
    if a.value == "no" and rank == primary_rank:
        extra.append("PRIMARY vetoed: not promoted automatically. Next: the recorder re-records the offer block under "
                     "Aaron's call (/lead-magnet-brainstorm recorder mode, fresh /ask-aaron sub-agent); a client no "
                     "reopens a frozen Phase 2 (phase-protocol.md)")
    if a.value == "yes":
        extra.append(f"lead_magnet_client_dependency set to the confirmed terms in {len(hits)} mirrors")

    after = yaml.safe_load("".join(lines))
    if ((after or {}).get("offer") or {}).get("aaron_rank") != primary_rank:
        sys.exit("refused: the edit changed the primary offer; nothing written")
    print(f"offer {rank}: {len(hits)} mirrors, {changed} lines -> {a.value} (by {a.by}, {a.at})")
    for x in extra:
        print(" -", x)
    if a.dry_run:
        print("dry run: nothing written")
        return
    open(prof, "w", encoding="utf-8", newline="").write("".join(lines))

    log = os.path.join(a.client_dir, "activity-log.md")
    entry_text = (f"- [{a.at}] offer-approval · offer {rank} · UPDATED: lead_magnet_client_ok = {a.value} "
                  f"(by {a.by}; evidence: {a.evidence}). {'; '.join(extra)}. Written by offer_approval.py.")
    if not os.path.exists(log):
        print("profile written; activity-log.md not found, log this by hand:\n" + entry_text)
        return
    txt = open(log, encoding="utf-8", newline="").read()
    anchor = re.search(r"^## LOG.*$", txt, re.M)
    if not anchor:
        print("profile written; activity-log.md has no '## LOG' header, log this by hand:\n" + entry_text)
        return
    eol = eol_of_text(txt)
    pos = anchor.end() + len(eol)
    if txt[pos:pos + len(eol)] == eol:
        pos += len(eol)
    open(log, "w", encoding="utf-8", newline="").write(txt[:pos] + entry_text + eol + txt[pos:])
    print("activity-log.md: entry added")


if __name__ == "__main__":
    main()
