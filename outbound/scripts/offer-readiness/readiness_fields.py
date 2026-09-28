"""One-time, idempotent migration that adds the Offer Readiness fields to a client's
client-profile.yaml (outbound/reference/offer-readiness.md).

    python outbound/scripts/offer-readiness/readiness_fields.py <client-profile.yaml> [--values <json>] [--dry-run]

Under every `lead_magnet_client_ok:` line (every mirror of every offer) it inserts:
    lead_magnet_client_ok_by / _at / _evidence   null (set later only by offer_approval.py)
    delivery_mode                                 `agency` for agency-honored offers, else null
                                                  (the recorder sets client_input, client_delivers
                                                  or call_only at lock)
plus, when --values supplies them for that offer's aaron_rank, the `capacity` arithmetic and
the `sample` pointer. --values is JSON keyed by aaron_rank: {"1": {"delivery_mode": ...,
"capacity": {...}, "sample": {...}}}; any key given there overrides the default.

It also adds `free_unit_cap_per_week: null` to every `qualification:` block defined in place
(YAML aliases such as `*id002` inherit it). That is the existing home of the weekly free-unit
cap; the migration adds NO other cap field and NO approval status field.

Text-level insertion on purpose: profiles carry comments and YAML anchors that a PyYAML
load/dump would destroy. Line endings are preserved. A profile with no Aaron-lane offer
(no `aaron_rank` beside `lead_magnet_client_ok`) is left untouched.
"""
import argparse, json, os, re, sys
import yaml

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from readiness_common import EVID, OK_KEY_RE, offers_with_mirrors, owner_rank, eol_of_text  # noqa: E402

CAP = "free_unit_cap_per_week:"


def render(values, indent, eol):
    pad = " " * indent
    out = []
    for key, val in values.items():
        if isinstance(val, dict):
            out.append(f"{pad}{key}:{eol}")
            for k2, v2 in val.items():
                out.append(f"{pad}  {k2}: {json.dumps(v2, ensure_ascii=False)}{eol}")
        else:
            out.append(f"{pad}{key}: {json.dumps(val, ensure_ascii=False)}{eol}")
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("profile")
    ap.add_argument("--values", help="JSON keyed by aaron_rank with delivery_mode, capacity, sample")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    raw = open(a.profile, encoding="utf-8", newline="").read()
    ranks = offers_with_mirrors(yaml.safe_load(raw))
    if not ranks:
        print("not applicable: no Aaron-lane offer in this profile (the recorder adds the fields at lock); nothing written")
        return
    honored = {r: m[0][1].get("lead_magnet_yes_honored_by") for r, m in ranks.items()}
    extra = json.load(open(a.values, encoding="utf-8")) if a.values else {}
    eol = eol_of_text(raw)
    lines = raw.splitlines(keepends=True)
    out, added, skipped, caps = [], 0, 0, 0
    for i, line in enumerate(lines):
        out.append(line)
        if re.match(r"^\s*qualification:\s*(&\w+)?\s*$", line):
            nxt = lines[i + 1] if i + 1 < len(lines) else ""
            child = re.match(r"^(\s*)", nxt).group(1)
            if len(child) <= len(line) - len(line.lstrip(" ")):
                continue  # empty mapping; nothing to extend safely
            j, has = i + 1, False
            while j < len(lines) and (lines[j].startswith(child) or not lines[j].strip()):
                if lines[j].startswith(child + CAP):
                    has = True
                j += 1
            if not has:
                out.append(f"{child}{CAP} null{eol}")
                caps += 1
            continue
        m = OK_KEY_RE.match(line)
        if not m:
            continue
        col = len(m.group(1))
        nxt = lines[i + 1] if i + 1 < len(lines) else ""
        if nxt.strip().startswith(EVID[0] + ":"):
            skipped += 1
            continue
        rank = owner_rank(lines, i, col)
        if rank not in ranks:
            sys.exit(f"line {i+1}: lead_magnet_client_ok has no aaron_rank beside it; fix the offer block first")
        vals = {k: None for k in EVID}
        vals["delivery_mode"] = "agency" if honored[rank] == "agency" else None
        vals.update(extra.get(str(rank), {}))
        out.extend(render(vals, col, eol))
        added += 1
    print(f"evidence blocks added: {added}, already present: {skipped}; free_unit_cap_per_week added: {caps}")
    if a.dry_run:
        print("dry run: nothing written")
        return
    if added or caps:
        with open(a.profile, "w", encoding="utf-8", newline="") as f:
            f.writelines(out)


if __name__ == "__main__":
    main()
