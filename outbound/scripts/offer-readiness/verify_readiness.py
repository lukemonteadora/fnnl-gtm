"""Checks a client's Offer Readiness layer against the files (outbound/reference/offer-readiness.md).

    python outbound/scripts/offer-readiness/verify_readiness.py <client-dir> [--baseline <older client-profile.yaml>] [--allow-changed <key> ...]

Exit 0 = PASS (or not applicable), 1 = FAIL. Checks:
  1. Board: one row per offer, matching the profile; the views are current (build_readiness --check);
     no mirror drift.
  2. Samples: every non-call offer whose `sample` block exists has a file on disk or a stated
     blocker (an offer with no `sample` block yet is reported as "not built, Phase 4 step 2").
  3. One client-message path (outbound/reference/client-messages.md): the `Sent:` line lives only
     inside `## Current message` (one line, or none when it reads `Nothing unsent.`); sent messages
     sit under `## Sent` as `### Sent YYYY-MM-DD`; at most one greeting outside `## Sent`; every
     pending arm's `[offer-<rank>]` key is in the current message or a sent one. A legacy file
     (`## Offer section (current message)`) gets the old check, with the greeting count as a note.
     Any older ask draft (offers/client-ask-draft.md, *-asks-draft.md) is a SUPERSEDED pointer
     with no `Sent:` line.
  4. Reply notes: when reply-playbook.md exists it covers every wave campaign, and every Notes
     block (interested-reply.md or the staged offers/reply-notes/<slug>.md) is current and adds no
     other `## ` heading.
  5. Fields: the evidence trio on every approval line (every mirror); no retired names
     (client_ok_by/_at/_evidence without the prefix, weekly_cap, send_cap_per_week); no status-like
     key inside `sample`; `free_unit_cap_per_week` present in every in-place qualification block;
     line endings not mixed.
  6. Optional --baseline: the profile only gained lines (keys listed in --allow-changed may change),
     and no new status-, stage-, approval- or gate-like key was added.
A profile with no Aaron-lane offer reports "not applicable" and exits 0.
"""
import argparse, glob, os, re, subprocess, sys
import yaml

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from readiness_common import EVID, CR, LF, offers_with_mirrors, campaigns_by_offer, drift, asks_sections  # noqa: E402


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("client_dir")
    ap.add_argument("--baseline")
    ap.add_argument("--allow-changed", nargs="*", default=[])
    a = ap.parse_args()
    d = a.client_dir
    fails, notes = [], []
    prof_path = os.path.join(d, "client-profile.yaml")
    raw_text = open(prof_path, encoding="utf-8", newline="").read()
    prof = yaml.safe_load(raw_text) or {}
    ranks = offers_with_mirrors(prof)
    if not ranks:
        print("not applicable: no Aaron-lane offer (aaron_rank + lead_magnet_client_ok) in client-profile.yaml; "
              "the fields arrive when the recorder locks the offer")
        print("RESULT: N/A")
        return
    offers = {r: m[0][1] for r, m in ranks.items()}

    # 1. Board.
    bp = os.path.join(d, "offers", "_readiness-board.md")
    if not os.path.exists(bp):
        fails.append("offers/_readiness-board.md missing (run build_readiness.py)")
        board = ""
    else:
        board = open(bp, encoding="utf-8").read()
    rows = [r for r in board.splitlines() if re.match(r"^\| \d+ \|", r)]
    if board and len(rows) != len(offers):
        fails.append(f"board rows {len(rows)} != offers {len(offers)}")
    for r in rows:
        c = [x.strip() for x in r.strip("|").split("|")]
        b = offers.get(int(c[0]))
        if b is None:
            fails.append(f"board row {c[0]} has no offer in the profile")
            continue
        exp = [str(b.get("lead_magnet")), str(b.get("delivery_mode")), str(b.get("lead_magnet_client_ok"))]
        if c[1:4] != exp:
            fails.append(f"offer {c[0]}: board {c[1:4]} != profile {exp}")
        miss = [str(m) for m in ((b.get("sample") or {}).get("missing") or [])]
        if not c[8].startswith(f"{len(miss)}:") or any(m not in c[8] for m in miss):
            fails.append(f"offer {c[0]}: missing list mismatch")
    notes.append(f"board rows checked: {len(rows)} of {len(offers)} offers")
    drifts = [x for m in ranks.values() for x in drift(m)]
    if drifts:
        fails.append(f"mirror drift: {drifts}")
    if subprocess.run([sys.executable, os.path.join(HERE, "build_readiness.py"), d, "--check"], capture_output=True).returncode != 0:
        fails.append("readiness views are stale vs the profile (run build_readiness.py)")

    # 2. Samples or blockers.
    for rank, b in sorted(offers.items()):
        s = b.get("sample")
        if b.get("delivery_mode") == "call_only" or b.get("lead_magnet_client_ok") == "no":
            continue
        if not s:
            notes.append(f"offer {rank}: sample not built yet (Phase 4 step 2)")
            continue
        p = s.get("path")
        has = bool(p) and os.path.exists(os.path.join(d, p))
        if p and not has:
            fails.append(f"offer {rank}: sample path {p} does not exist")
        if not has and not s.get("missing"):
            fails.append(f"offer {rank}: no sample and no stated blocker")
        if any(re.search(r"status|stage", k) for k in s):
            fails.append(f"offer {rank}: sample carries a status-like key {[k for k in s if re.search(r'status|stage', k)]}")
        notes.append(f"offer {rank}: sample {'file present' if has else 'none'}; blockers {len(s.get('missing') or [])}")

    # 3. One client-message path.
    pending = sorted(r for r, b in offers.items() if b.get("lead_magnet_client_ok") == "pending")
    ap_ = os.path.join(d, "client-asks.md")
    asks = open(ap_, encoding="utf-8").read() if os.path.exists(ap_) else ""
    sec = asks_sections(asks)
    cur = sec["current"] or ""
    has_section = sec["current"] is not None
    sent_lines = re.findall(r"^Sent:.*$", cur, re.M)
    stray = len(re.findall(r"^Sent:.*$", asks, re.M)) - len(sent_lines)
    unsent_none = "Nothing unsent." in cur
    outside_sent = re.split(r"(?m)^## Sent[ ]*$", asks.replace(CR + LF, LF))[0]
    greetings = re.findall(r"^>\s*\**(?:Hi|Hello|Hey|Dear)\b", outside_sent, re.M)
    if pending and not has_section and not sec["sent"]:
        fails.append(f"pending arms {pending} but client-asks.md has no current or sent message")
    if has_section and not unsent_none and len(sent_lines) != 1:
        fails.append(f"client-asks.md current message needs exactly one Sent: line, found {len(sent_lines)}")
    if stray:
        fails.append(f"client-asks.md has {stray} Sent: line(s) outside the current message (sent ones use '### Sent <date>')")
    if has_section and not sec["legacy"]:
        if len(greetings) > 1:
            fails.append(f"client-asks.md has {len(greetings)} greetings outside ## Sent (one unsent message only)")
        for r in pending:
            if f"[offer-{r}]" not in cur and not any(f"[offer-{r}]" in b for _, b in sec["sent"]):
                fails.append(f"pending offer {r}: no [offer-{r}] item in the current or a sent message")
    elif has_section:
        notes.append(f"client-asks.md uses the legacy heading ({len(greetings)} greeting(s) outside ## Sent); "
                     f"it conforms at its next write (client-messages.md)")
    for fp in [os.path.join(d, "offers", "client-ask-draft.md")] + glob.glob(os.path.join(d, "*asks-draft*.md")):
        if os.path.exists(fp):
            txt = open(fp, encoding="utf-8").read()
            if "SUPERSEDED" not in txt[:400] or re.search(r"^Sent:", txt, re.M):
                fails.append(f"{os.path.relpath(fp, d)} is not a superseded pointer (two live message paths)")
    notes.append(f"pending arms: {pending}; current message in client-asks.md: {has_section}; "
                 f"{sent_lines[0] if sent_lines else 'no Sent line'}; sent messages: {len(sec['sent'])}")

    # 4. Reply notes.
    wave = {slug for lst in campaigns_by_offer(d, set(offers)).values() for slug, _ in lst}
    pbp = os.path.join(d, "reply-playbook.md")
    if os.path.exists(pbp):
        covered = set(re.findall(r"^## SDR section: (\S+)", open(pbp, encoding="utf-8").read(), re.M))
        if not wave <= covered:
            fails.append(f"playbook misses wave campaigns {sorted(wave - covered)}")
        r = subprocess.run([sys.executable, os.path.join(HERE, "build_reply_playbook.py"), d, "--check"], capture_output=True, text=True)
        if r.returncode != 0:
            fails.append("reply notes or playbook stale: " + r.stdout.strip()[:300])
        for slug in covered:
            ir = os.path.join(d, "campaigns", slug, "interested-reply.md")
            frag = os.path.join(d, "offers", "reply-notes", f"{slug}.md")
            f = frag if not os.path.exists(ir) else None
            if f and os.path.exists(f):
                heads = re.findall(r"^##\s+(.+)$", open(f, encoding="utf-8").read(), re.M)
                if heads != ["Notes"]:
                    fails.append(f"{slug}: staged notes carry headings {heads} (only '## Notes' is parser-safe)")
            if os.path.exists(ir) and len(re.findall(r"^##\s+Notes\s*$", open(ir, encoding="utf-8").read(), re.M)) != 1:
                fails.append(f"{slug}: interested-reply.md must hold exactly one '## Notes' section")
        notes.append(f"reply notes: {len(covered)} campaigns in the playbook; {len(wave)} wave campaigns with verified rows")
    elif wave:
        notes.append(f"reply notes: not built yet ({len(wave)} wave campaigns; Phase 4 step 3)")

    # 5. Fields.
    ok_lines = len(re.findall(r"^\s*lead_magnet_client_ok:", raw_text, re.M))
    for k in EVID:
        n = len(re.findall(r"^\s*" + k + r":", raw_text, re.M))
        if n != ok_lines:
            fails.append(f"{k}: {n} lines vs {ok_lines} approval lines (run readiness_fields.py)")
    if re.search(r"^\s*(client_ok_by|client_ok_at|client_ok_evidence|weekly_cap|send_cap_per_week):", raw_text, re.M):
        fails.append("retired field names (client_ok_* without the prefix, weekly_cap or send_cap_per_week) in the profile")
    nocap = []
    for m in ranks.values():
        for where, b in m:
            q = b.get("qualification")
            if isinstance(q, dict) and "free_unit_cap_per_week" not in q:
                nocap.append(where)
    if nocap:
        fails.append(f"qualification.free_unit_cap_per_week missing on {nocap}")
    unset = sorted(r for r, b in offers.items() if not b.get("delivery_mode"))
    if unset:
        notes.append(f"delivery_mode not recorded yet on offers {unset} (the recorder sets it at lock)")
    n_mirrors = sum(len(m) for m in ranks.values())
    notes.append(f"approval lines: {ok_lines}; mirrors parsed: {n_mirrors}; evidence trio checked on each")
    raw_bytes = raw_text.encode("utf-8")
    crlf, lf = raw_bytes.count(b"\r\n"), raw_bytes.count(b"\n")
    if crlf and crlf != lf:
        fails.append(f"profile line endings are mixed ({crlf} CRLF of {lf} lines)")

    # 6. Baseline diff.
    if a.baseline:
        before = open(a.baseline, encoding="utf-8").read().splitlines()
        after = raw_text.splitlines()
        added = [l for l in after if l not in set(before)]
        allow = tuple(k + ":" for k in a.allow_changed)
        removed = [l for l in before if l not in set(after) and not l.lstrip().lstrip("- ").startswith(allow)]
        keys = sorted({re.match(r"\s*(?:- )?([A-Za-z_]+):", l).group(1) for l in added if re.match(r"\s*(?:- )?([A-Za-z_]+):", l)})
        bad = [k for k in keys if (re.search(r"status|stage|approv|gate", k) and k not in a.allow_changed)
               or ("client_ok" in k and k not in EVID and k not in a.allow_changed)]
        if bad:
            fails.append(f"new status-like keys vs baseline: {bad}")
        if removed:
            fails.append(f"{len(removed)} profile lines removed or changed vs baseline (first: {removed[0].strip()[:80]})")
        notes.append(f"baseline: +{len(added)} lines, -{len(removed)}; new keys: {', '.join(keys)}")

    print("\n".join(notes))
    print("RESULT:", "PASS" if not fails else "FAIL")
    for f in fails:
        print(" -", f)
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
