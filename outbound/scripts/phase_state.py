#!/usr/bin/env python3
"""Phase tracker for the four-phase client flow (outbound/reference/phase-protocol.md).

State lives in outbound/profiles/<slug>/phases/state.yaml, never in client-profile.yaml,
so this script never rewrites a hand-edited profile. It replaces the older
run_state.checkpoints record (the kickoff's four phase checkpoints) as the phase record.
Phase 4 ends at PAUSED drafts on the sending platform; pressing Start is always the operator's.

  python outbound/scripts/phase_state.py board
  python outbound/scripts/phase_state.py show <slug>
  python outbound/scripts/phase_state.py start <slug> <n> [--note TEXT] [--take-stale-lock]
  python outbound/scripts/phase_state.py checkpoint <slug> <n> --handoff PATH
  python outbound/scripts/phase_state.py approve <slug> <n> --answer TEXT
  python outbound/scripts/phase_state.py reopen <slug> <n> --reason TEXT
  python outbound/scripts/phase_state.py release <slug>
  python outbound/scripts/phase_state.py place <slug> --phase N --status S [--note TEXT] [--legacy]

Exit codes: 0 ok, 2 usage or unknown client, 3 blocked (previous phase not approved,
a checkpoint still open, or the client is locked by another thread).
"""
import argparse
import datetime as dt
import os
import subprocess
import sys

import yaml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROFILES = os.path.join(ROOT, "profiles")
NAMES = {1: "Onboarding", 2: "Research and offer", 3: "List", 4: "Copy and launch"}
HANDOFFS = {1: "phase-1-onboarding.md", 2: "phase-2-offer.md", 3: "phase-3-list.md", 4: "phase-4-launch.md"}
STATUSES = ("not_started", "running", "checkpoint_shown", "approved", "reopened", "needs_review")
STALE_LOCK_HOURS = 12


def now():
    return dt.datetime.now().replace(microsecond=0).isoformat(sep=" ")


def commit():
    try:
        return subprocess.check_output(["git", "-C", ROOT, "rev-parse", "--short", "HEAD"],
                                       stderr=subprocess.DEVNULL, text=True).strip()
    except Exception:
        return "unknown"


def path_for(slug):
    return os.path.join(PROFILES, slug, "phases", "state.yaml")


def blank(slug):
    return {
        "client": slug,
        "current_phase": 1,
        "legacy": False,
        "lock": None,
        "phases": {n: {"name": NAMES[n], "status": "not_started"} for n in NAMES},
        "history": [],
    }


def load(slug, create=False):
    if not os.path.isdir(os.path.join(PROFILES, slug)):
        if not create:
            die(2, f"no profile folder for '{slug}' under outbound/profiles/ (a new client starts with Phase 1)")
        os.makedirs(os.path.join(PROFILES, slug))
    p = path_for(slug)
    if not os.path.exists(p):
        return blank(slug)
    with open(p, encoding="utf-8") as f:
        s = yaml.safe_load(f) or blank(slug)
    s["phases"] = {int(k): v for k, v in (s.get("phases") or {}).items()}
    for n in NAMES:
        s["phases"].setdefault(n, {"name": NAMES[n], "status": "not_started"})
    return s


def save(slug, s, event):
    s["updated"] = now()
    s.setdefault("history", []).insert(0, f"{now()} {event}")
    s["history"] = s["history"][:40]
    os.makedirs(os.path.dirname(path_for(slug)), exist_ok=True)
    with open(path_for(slug), "w", encoding="utf-8", newline="\n") as f:
        yaml.safe_dump(s, f, sort_keys=False, allow_unicode=True, width=100)


def die(code, msg):
    print(("BLOCKED: " if code == 3 else "ERROR: ") + msg)
    sys.exit(code)


def lock_age_hours(lock):
    try:
        return (dt.datetime.now() - dt.datetime.fromisoformat(lock["since"])).total_seconds() / 3600
    except Exception:
        return 1e9


def cmd_start(a):
    s = load(a.slug, create=(a.n == 1))
    n = a.n
    if n > 1:
        prev = s["phases"][n - 1]
        if prev["status"] == "checkpoint_shown":
            die(3, f"Phase {n-1} checkpoint is open (shown {prev.get('shown_on')}). Show it again, record the operator's "
                   f"answer with 'approve {a.slug} {n-1} --answer ...', then start Phase {n}.")
        if prev["status"] != "approved":
            die(3, f"Phase {n-1} ({NAMES[n-1]}) is '{prev['status']}', not approved. Run Phase {n-1} first.")
    lock = s.get("lock")
    if lock and lock.get("phase") != n:
        age = lock_age_hours(lock)
        if age < STALE_LOCK_HOURS and not a.take_stale_lock:
            die(3, f"client is locked by a Phase {lock.get('phase')} thread since {lock.get('since')} "
                   f"({age:.1f} h). One thread per client at a time.")
        if age < STALE_LOCK_HOURS and a.take_stale_lock:
            die(3, f"the lock is only {age:.1f} h old; a lock can be taken over after {STALE_LOCK_HOURS} h.")
    cur = s["phases"][n]
    if cur["status"] == "approved":
        die(3, f"Phase {n} ({NAMES[n]}) is already done for {a.slug} (approved {cur.get('approved_on')}). "
               f"Where it is now: {next_step(s)}. Only if Phase {n} itself must be redone (a broken rail, "
               f"a change the operator marks as breaking, or new client facts): 'reopen {a.slug} {n} --reason ...'.")
    cur.update({"status": "running", "started_on": cur.get("started_on") or now()})
    s["current_phase"] = n
    s["lock"] = {"phase": n, "since": now(), "note": a.note or ""}
    save(a.slug, s, f"START phase {n}" + (f" ({a.note})" if a.note else ""))
    print(f"OK: {a.slug} Phase {n} ({NAMES[n]}) running. Handoff to write: "
          f"profiles/{a.slug}/phases/{HANDOFFS[n]}")


def cmd_checkpoint(a):
    s = load(a.slug)
    cur = s["phases"][a.n]
    if cur["status"] not in ("running", "reopened", "checkpoint_shown"):
        die(3, f"Phase {a.n} is '{cur['status']}'; a checkpoint is shown only at the end of a running phase.")
    handoff = os.path.join(PROFILES, a.slug, a.handoff) if not os.path.isabs(a.handoff) else a.handoff
    if not os.path.exists(handoff):
        die(3, f"handoff file not found: {a.handoff}. Write it before showing the checkpoint.")
    cur.update({"status": "checkpoint_shown", "shown_on": now(),
                "handoff": os.path.relpath(handoff, os.path.join(PROFILES, a.slug)).replace("\\", "/")})
    s["lock"] = None
    save(a.slug, s, f"CHECKPOINT phase {a.n} shown")
    print(f"OK: Phase {a.n} checkpoint shown; lock released. Next: the operator answers, then "
          f"'approve {a.slug} {a.n} --answer ...'.")


def cmd_approve(a):
    s = load(a.slug)
    cur = s["phases"][a.n]
    if cur["status"] != "checkpoint_shown":
        die(3, f"Phase {a.n} is '{cur['status']}'; only a shown checkpoint can be approved.")
    built = commit()
    if str(cur.get("shown_on", "")).startswith("before phase tracking"):
        built = f"pre-phase (built before tracking; approved at {built})"
    cur.update({"status": "approved", "approved_on": now(), "answer": a.answer, "built_under": built})
    s["current_phase"] = a.n + 1 if a.n < 4 else "post_launch"
    s["lock"] = None
    save(a.slug, s, f"APPROVE phase {a.n}: {a.answer}")
    nxt = (f"Phase {a.n+1} ({NAMES[a.n+1]})" if a.n < 4 else
           "the operator reviews the PAUSED drafts on the sending platform and presses Start "
           "(the agent never does); then the post-launch loop")
    print(f"OK: Phase {a.n} approved and frozen at commit {cur['built_under']}. Next: {nxt}.")


def cmd_reopen(a):
    s = load(a.slug)
    cur = s["phases"][a.n]
    if cur["status"] != "approved":
        die(3, f"Phase {a.n} is '{cur['status']}', not approved; there is nothing frozen to reopen.")
    cur.update({"status": "reopened", "reopened_on": now(), "reopen_reason": a.reason})
    for m in range(a.n + 1, 5):
        if s["phases"][m]["status"] in ("approved", "checkpoint_shown", "running"):
            s["phases"][m]["status"] = "needs_review"
    s["current_phase"] = a.n
    save(a.slug, s, f"REOPEN phase {a.n}: {a.reason}")
    print(f"OK: Phase {a.n} reopened; later phases marked needs_review.")


def cmd_release(a):
    s = load(a.slug)
    s["lock"] = None
    save(a.slug, s, "RELEASE lock")
    print("OK: lock released.")


def cmd_place(a):
    s = load(a.slug)
    if a.status not in STATUSES:
        die(2, f"status must be one of {STATUSES}")
    for m in range(1, a.phase):
        if s["phases"][m]["status"] != "approved":
            s["phases"][m].update({"status": "approved", "approved_on": "before phase tracking",
                                   "answer": "placed by backfill", "built_under": "pre-phase"})
    s["phases"][a.phase]["status"] = a.status
    if a.status == "checkpoint_shown":
        s["phases"][a.phase]["shown_on"] = f"before phase tracking (backfill {dt.date.today()})"
    s["current_phase"] = a.phase if a.status != "approved" else (a.phase + 1 if a.phase < 4 else "post_launch")
    s["legacy"] = bool(a.legacy)
    s["placed_by"] = f"backfill {dt.date.today()} (from the activity log; operator to confirm)"
    if a.note:
        s["note"] = a.note
    save(a.slug, s, f"PLACE phase {a.phase} {a.status}" + (" legacy" if a.legacy else ""))
    print(f"OK: {a.slug} placed at Phase {a.phase} ({a.status}).")


def cmd_show(a):
    s = load(a.slug)
    print(yaml.safe_dump(s, sort_keys=False, allow_unicode=True, width=100))


def next_step(s):
    if s.get("legacy"):
        return "older build: review with /continue-client before any phase"
    cp = s.get("current_phase")
    if cp == "post_launch":
        return "the operator presses Start; then weekly rhythm and replies"
    ph = s["phases"][cp]
    st = ph["status"]
    if st == "checkpoint_shown":
        if cp == 4:
            return "the operator reviews the paused drafts and presses Start"
        return f"answer the Phase {cp} checkpoint: say 'Phase {cp + 1} for {s['client']}'"
    if st == "running":
        return f"Phase {cp} in progress"
    if st in ("reopened", "needs_review"):
        return f"Phase {cp} {st.replace('_', ' ')}"
    return f"say 'Phase {cp} for {s['client']}'"


def cmd_board(a):
    rows = []
    for slug in sorted(os.listdir(PROFILES)):
        if slug.startswith("_") or not os.path.isdir(os.path.join(PROFILES, slug)):
            continue
        if not os.path.exists(path_for(slug)):
            rows.append((slug, "-", "not placed", "-", "run /continue-client to place it"))
            continue
        s = load(slug)
        cp = s.get("current_phase")
        label = "post-launch" if cp == "post_launch" else f"{cp}. {NAMES.get(cp, '?')}"
        st = "legacy" if s.get("legacy") else (s["phases"][cp]["status"] if cp in s["phases"] else "-")
        lock = s.get("lock")
        lk = f"P{lock['phase']} since {lock['since'][5:16]}" if lock else "-"
        rows.append((slug, label, st, lk, next_step(s)))
    w = [max(len(str(r[i])) for r in rows + [("Client", "Phase", "Status", "Thread", "Next")]) for i in range(5)]
    hdr = ("Client", "Phase", "Status", "Thread", "Next")
    print("  ".join(h.ljust(w[i]) for i, h in enumerate(hdr)))
    print("  ".join("-" * w[i] for i in range(5)))
    for r in rows:
        print("  ".join(str(c).ljust(w[i]) for i, c in enumerate(r)))


def main():
    p = argparse.ArgumentParser(description="Four-phase client tracker")
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("board")
    for name in ("show", "release"):
        sp = sub.add_parser(name)
        sp.add_argument("slug")
    sp = sub.add_parser("start"); sp.add_argument("slug"); sp.add_argument("n", type=int, choices=[1, 2, 3, 4])
    sp.add_argument("--note"); sp.add_argument("--take-stale-lock", action="store_true")
    sp = sub.add_parser("checkpoint"); sp.add_argument("slug"); sp.add_argument("n", type=int, choices=[1, 2, 3, 4])
    sp.add_argument("--handoff", required=True)
    sp = sub.add_parser("approve"); sp.add_argument("slug"); sp.add_argument("n", type=int, choices=[1, 2, 3, 4])
    sp.add_argument("--answer", required=True)
    sp = sub.add_parser("reopen"); sp.add_argument("slug"); sp.add_argument("n", type=int, choices=[1, 2, 3, 4])
    sp.add_argument("--reason", required=True)
    sp = sub.add_parser("place"); sp.add_argument("slug"); sp.add_argument("--phase", type=int, required=True,
                                                                          choices=[1, 2, 3, 4])
    sp.add_argument("--status", required=True); sp.add_argument("--note"); sp.add_argument("--legacy",
                                                                                         action="store_true")
    a = p.parse_args()
    {"board": cmd_board, "show": cmd_show, "start": cmd_start, "checkpoint": cmd_checkpoint,
     "approve": cmd_approve, "reopen": cmd_reopen, "release": cmd_release, "place": cmd_place}[a.cmd](a)


if __name__ == "__main__":
    main()
