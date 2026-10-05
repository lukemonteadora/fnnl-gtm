"""Frame-conformance check for Aaron-lane copy (the operator's rule, 2026-09-24).

Every subject, email and delivery reply in an `aaron_campaign_call` record must be built on one of
Aaron's own example emails, frame by frame. The frames, their fixed words and the rules behind this
check are in outbound/reference/aaron-copy-frames.md. That file is the spec; this script is its test.
The procedure around it (the two Aaron calls, the rails) is outbound/reference/aaron-lane.md.

Usage:
    python outbound/scripts/aaron_frame_check.py --client <slug> [--quiet]
    python outbound/scripts/aaron_frame_check.py <file with the record> [--quiet]

--client reads outbound/profiles/<slug>/aaron-copy-call.md, the Call 2 consult file. A path reads that
file instead: a consult or plan whose YAML record sits under a "## Machine-readable record" heading, a
Markdown file whose first ```yaml block holds `aaron_campaign_call`, or a bare .yaml file.

Exit code 0 means no FAIL (WARN lines are structure-only frames or items a person must confirm, such as
a campaign being held until its asset exists). Exit code 1 means at least one email broke its frame.
Exit code 2 means the record could not be found or read. Regex and PyYAML only; no network call.

Aaron flow (see aaron-flow.md): F11 is live and checked on its exact fixed words, F11-v2 (a three-line
frame) and FU5 are added, S6 ("quick idea") is added, and subject length is governed by SUBJECT_WORDS
(2 or 3 words) instead of a word cap; the frame's own sentence count still governs email length.
"""
import argparse
import io
import os
import re
import sys

import yaml

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
PROFILES = os.path.join(REPO_ROOT, "outbound", "profiles")
CONSULT_FILE = "aaron-copy-call.md"

FN = r"\{\{first_name\}\}"

# Offer-line frames: a regex on the offer paragraph (the email minus its PS). None = structure-only.
OFFER = {
    "F1": rf"^{FN}, if we could .+ one free .+ for you\. Would that be worth sharing more\?$",
    "F2": rf"^(?i:({FN}, )?if we could build you a no-cost .+, would that be useful\?)$",
    "F3": rf"^(?i:({FN}, )?if we could .+, (would that be|is that) worth sharing more\?)$",
    "F4": r"^(?i:hey, if we could send you .+ that .+, would that be worth sending over\?)$",
    "F5": rf"^{FN},? if we .+ in the next .+ at absolutely no cost\.\s+So, we would .+\. All you have to do is .+\.$",
    "F6": rf"^{FN}, (I|we) just .+\. (Do you mind|Mind) if I send it to you\?$",
    "F6-v2": rf"^{FN}, just built an? .+ that .+\. Open to testing it for free\.$",
    # F11 is live (confirmed from the raw captions 2026-09-30), so it is checked on his exact fixed words.
    "F11": rf"^{FN}, if I had a way to .+ to .+, and you only pay per .+, would that be worth a quick test\?$",
    # F11-v2 is three lines (question, "Asking" line, "Thinking" line). The word after "Asking" is a caption
    # guess, so it is not fixed. Its lines are joined before matching (MULTI_LINE below).
    "F11-v2": (rf"^{FN}, do you currently offer an? .+\? Asking(?: \w+)? I found a way to .+\. "
               r"Thinking I could .+ and we could sort out .+ if you're open to that kind of thing\.$"),
    "F8": None, "F9": None, "F10": None,
}
# Frames written as several short lines. Their main paragraphs are joined into one line before the offer check,
# so the blank-line layout Aaron uses and a single-newline layout are checked the same way.
MULTI_LINE = {"F11-v2"}
STRUCTURE_HINT = {
    "F8": r"(?i)would you be open to trying it out.*shoot you over the",
    "F9": r"Happy to share the thinking if you're open\.$",
    "F10": r"(?i)^we're not here to sell you anything",
}
PS = {
    "P1": r"^PS, thought it'd be relevant since .+\.$",
    "P2": r"^PS, .+ takes you .+ to .+\.$",
    "P3": (r"^PS,? (tested this for .+ recently\. .+|.+ went from .+ to .+ using this exact process\."
           r"|we've actually just run this exact same process for .+ who ended up getting .+ in .+\.)$"),
    "P3c": r"^PS, .+ saw an? \d[\d,.]*% lift in .+\.$",
    "P4": r"^PS, obviously this is free, no call required\. I'll just send it over to you and then you can decide if it's worth .+\.$",
    "P5": r"^PS, we're doing a small batch of complimentary .+\.$",
}
FOLLOW = {
    "FU1": r"^(?i:interested in an? .+\?)",
    "FU2": r"^Should I send you a two-minute .+ showing you exactly how .+\?$",
    "FU3": None,
    "FU4": None,
    # FU5 is live (Sep 21, raw captions): his "if it's easier" video Email 2. "if it's easier" offers an easier
    # route to the same thing and does not name the non-reply, so it passes the standalone rule.
    "FU5": rf"^{FN}, (?i:if it's easier, I can send over a quick video elaborating on how we .+\.)$",
}
FU3_WORDS = r"FYI, this isn't|this doesn't take a lot of time"
SUBJECT = {
    "S1": r"^question about [a-z0-9 ]+$",
    "S2": rf"^fyi {FN}$",
    "S3": r"^your (recent|new) [a-z0-9 ]+$",
    "S4": r"^[a-z0-9 ]+ problem$",
    "S5": r"^your [a-z0-9 ]+$",
    "S6": r"^quick idea$",
}
# Aaron flow (aaron-flow.md section 7): two or three lowercase words, one subject per campaign.
SUBJECT_WORDS = (2, 3)
DR = {
    "DR": rf"^Great {FN}, here's a link to .+\.\s*\[link\]\s*Curious to get your take on it\.$",
    "DR-input": rf"^Great {FN}, here's a link to .+\.\s*\[link\]\s*.+\.$",
}
NOT_STANDALONE = r"(?i)\beasier option\b|\binstead\b|as I mentioned|\babove\b|last email|following up|\bbump|scroll|my last|did you see"
EXISTENCE = {"F6", "F6-v2"}

results = []


def rec(level, where, msg):
    results.append((level, where, msg))


def split(body):
    paras = [p.strip() for p in body.strip().split("\n\n") if p.strip()]
    ps = [p for p in paras if p.startswith("PS")]
    main = [" ".join(p.split()) for p in paras if not p.startswith("PS")]
    return main, [" ".join(p.split()) for p in ps]


def check_offer_line(fid, line, where):
    if fid not in OFFER:
        rec("FAIL", where, f"offer frame {fid!r} is not in aaron-copy-frames.md")
        return
    pat = OFFER[fid]
    if pat is None:
        hint = STRUCTURE_HINT.get(fid)
        if hint and not re.search(hint, line, re.S):
            rec("WARN", where, f"{fid} is structure-only and its marker words are missing")
        else:
            rec("WARN", where, f"{fid} is structure-only: a person confirms the slot order")
        return
    if not re.match(pat, line, re.S):
        rec("FAIL", where, f"offer line does not keep {fid}'s fixed words and slot order: {line[:90]!r}")


def check_email(e, where, control_line=None, held=None):
    fid = e.get("frame")
    body = e.get("body") or ""
    main, ps = split(body)
    if not fid:
        rec("FAIL", where, "no frame named")
        return
    if " + " in str(fid) or "(" in str(fid):
        rec("FAIL", where, f"combination written into frame ({fid!r}); use ps, line_two or add")
        return
    if fid == "F7":
        two = e.get("line_two")
        if len(main) != 2:
            rec("FAIL", where, f"F7 needs exactly two lines above any PS, found {len(main)}")
        else:
            if main[0].endswith("?"):
                rec("FAIL", where, "F7 line one is a question (his rejection bank kills question-form pain openers)")
            if not two:
                rec("FAIL", where, "F7 without line_two")
            else:
                check_offer_line(two, main[1], where + " line two")
                if control_line and norm(main[1]) != norm(control_line):
                    rec("WARN", where, "F7 line two differs from the control, so the variant tests more than the pain line")
            rec("WARN", where, "F7 has no verbatim source: structure checked, the pain line's cluster is confirmed by a person")
        base = two
    else:
        if fid in MULTI_LINE and main:
            main = [" ".join(main)]
        if len(main) != 1:
            rec("FAIL", where, f"{fid} is one offer paragraph, found {len(main)}")
        else:
            check_offer_line(fid, main[0], where)
        base = fid
    p = e.get("ps")
    if p and not ps:
        rec("FAIL", where, f"ps {p} named but the email has no PS")
    if ps and not p:
        rec("FAIL", where, "email has a PS but names no ps frame")
    if p and ps:
        if p not in PS:
            rec("FAIL", where, f"ps frame {p!r} is not in aaron-copy-frames.md")
        elif not re.match(PS[p], ps[0]):
            rec("FAIL", where, f"PS does not keep {p}'s fixed words: {ps[0][:90]!r}")
    if len(ps) > 1:
        rec("FAIL", where, "more than one PS")
    if base in EXISTENCE:
        if held:
            rec("PASS", where, f"{base} existence frame on a held campaign")
        else:
            rec("WARN", where, f"{base} says the asset exists: confirm the campaign holds until it does")
    if not any(r[1].startswith(where) and r[0] == "FAIL" for r in results):
        rec("PASS", where, f"{fid}" + (f" + {p}" if p else "") + (f" (line two {e.get('line_two')})" if fid == "F7" else ""))


def check_follow(f, where):
    fid, add, body = f.get("frame"), f.get("add"), " ".join((f.get("body") or "").split())
    if not fid or " + " in str(fid):
        rec("FAIL", where, f"follow-up frame missing or a combination ({fid!r}); use add")
        return
    if fid not in FOLLOW:
        rec("FAIL", where, f"follow-up frame {fid!r} is not in aaron-copy-frames.md")
        return
    if FOLLOW[fid] and not re.match(FOLLOW[fid], body):
        rec("FAIL", where, f"does not keep {fid}'s fixed words: {body[:90]!r}")
    if add:
        if add not in ("FU3", "FU4"):
            rec("FAIL", where, f"add {add!r} must be FU3 or FU4")
        elif add == "FU3" and not re.search(FU3_WORDS, body):
            rec("WARN", where, "FU3 add without its fixed words: structure-only, a person confirms the added point")
    if re.search(NOT_STANDALONE, body):
        rec("FAIL", where, "not standalone: it points back at Email 1 or names the non-reply")
    fb = f.get("fallback_if_no_recording")
    if fb:
        check_follow({"frame": fb.get("frame"), "body": fb.get("body")}, where + " fallback")
    if not any(r[1] == where and r[0] == "FAIL" for r in results):
        rec("PASS", where, fid + (f" + {add}" if add else ""))


def norm(line):
    """Drop a leading first name and re-capitalize, so a name lead-in does not make the same line look different."""
    line = re.sub(rf"^{FN}, ", "", line.strip())
    return line[:1].upper() + line[1:]


def cta(line):
    line = norm(line)
    s = re.split(r"(?<=[.?!])\s+", line.strip())
    if not s:
        return ""
    # A one-sentence frame (F11, F4) is its whole body, so its slot fills differ between arms.
    # Only the closing clause after the last comma is the CTA there. Aaron flow (see aaron-flow.md).
    if len(s) == 1 and "," in s[0]:
        return s[0].rsplit(",", 1)[1].strip()
    return s[-1]


def load_record(path):
    """Return the aaron_campaign_call mapping from a consult, plan or bare YAML file."""
    with io.open(path, encoding="utf-8") as fh:
        text = fh.read().replace("\r\n", "\n")
    if "## Machine-readable record" in text:
        m = re.search(r"```yaml\n(.*?)\n```", text.split("## Machine-readable record", 1)[1], re.S)
        if not m:
            raise ValueError("no ```yaml block under '## Machine-readable record'")
        text = m.group(1)
    elif "```yaml" in text:
        blocks = re.findall(r"```yaml\n(.*?)\n```", text, re.S)
        text = next((b for b in blocks if "aaron_campaign_call" in b), blocks[0] if blocks else "")
    data = yaml.safe_load(text)
    if not isinstance(data, dict):
        raise ValueError("the record is not a YAML mapping")
    call = data.get("aaron_campaign_call", data)
    if not isinstance(call, dict) or "campaigns" not in call:
        raise ValueError("no aaron_campaign_call record with a campaigns list")
    return call


def parse_args(argv):
    ap = argparse.ArgumentParser(
        prog="aaron_frame_check.py",
        description="Check every subject, Email 1 variant, follow-up and delivery reply in an Aaron-lane "
                    "aaron_campaign_call record against its frame in outbound/reference/aaron-copy-frames.md.",
        epilog="Exit 0: no FAIL. Exit 1: at least one FAIL. Exit 2: the record could not be found or read.",
    )
    ap.add_argument("path", nargs="?", help="consult, plan or .yaml file holding the record")
    ap.add_argument("--client", metavar="SLUG",
                    help=f"read outbound/profiles/<SLUG>/{CONSULT_FILE} (used when no path is given)")
    ap.add_argument("--profiles-dir", default=PROFILES,
                    help="override the profiles folder (default: this repo's outbound/profiles)")
    ap.add_argument("--quiet", action="store_true", help="print WARN and FAIL lines only")
    args = ap.parse_args(argv)
    if not args.path and not args.client:
        ap.error("give a record path or --client <slug>")
    return args


def main(argv=None):
    args = parse_args(sys.argv[1:] if argv is None else argv)
    results.clear()
    path = args.path or os.path.join(args.profiles_dir, args.client, CONSULT_FILE)
    if not os.path.isfile(path):
        print(f"ERROR record not found: {path}")
        return 2
    try:
        call = load_record(path)
    except (ValueError, yaml.YAMLError) as exc:
        print(f"ERROR could not read the record in {path}: {exc}")
        return 2
    rebuild = call.get("frame_rebuild") or {}
    n_email = 0
    for c in call.get("campaigns", []):
        seq = c.get("sequence")
        if c.get("launch") != "now" or not seq:
            continue
        slug = c.get("campaign_slug", "?")
        # A campaign counts as held when its record carries a `hold` line, or its `why` says HOLD.
        held = bool(c.get("hold")) or bool(re.search(r"\bHOLD\b", str(c.get("why", ""))))
        sf, subj = seq.get("subject_frame"), str(seq.get("subject") or "")
        if sf not in SUBJECT:
            rec("FAIL", f"{slug} subject", f"subject_frame {sf!r} is not S1 to S6")
        elif not SUBJECT_WORDS[0] <= len(subj.split()) <= SUBJECT_WORDS[1]:
            rec("FAIL", f"{slug} subject", f"{subj!r} is {len(subj.split())} words; the Aaron flow allows 2 or 3")
        elif not re.match(SUBJECT[sf], subj) or subj != subj.lower():
            rec("FAIL", f"{slug} subject", f"{subj!r} does not keep {sf}")
        else:
            rec("PASS", f"{slug} subject", sf)
        variants = seq.get("email_1_variants", [])
        control = next((split(v.get("body") or "")[0][0] for v in variants
                        if v.get("frame") != "F7" and split(v.get("body") or "")[0]), None)
        ctas = set()
        # T5 (his own test, Sep 21): an F11-v2 arm run against an F11 arm keeps its soft partnership close,
        # so its CTA is left out of the shared-CTA count. Only when the campaign also has an F11 arm.
        has_f11 = any(v.get("frame") == "F11" for v in variants)
        for v in variants:
            n_email += 1
            check_email(v, f"{slug} E1-{v.get('label')}", control, held)
            m, _ = split(v.get("body", ""))
            if v.get("frame") == "F11-v2" and has_f11:
                continue
            if m:
                last = cta(m[-1])
                if last.endswith("?") or re.search(r"(?i)open to|let me know|happy to share", last):
                    ctas.add(last)
        if len(ctas) > 1:
            rec("FAIL", f"{slug} CTA", f"Email 1 variants carry {len(ctas)} different CTAs: {sorted(ctas)}")
        for f in seq.get("follow_ups", []):
            n_email += 1
            check_follow(f, f"{slug} step {f.get('step')}")
    for i, d in enumerate(call.get("delivery_replies") or rebuild.get("delivery_replies") or []):
        fid, body = d.get("frame"), (d.get("body") or "").strip()
        where = f"reply {i + 1} ({str(d.get('offer', ''))[:30]})"
        if fid not in DR:
            rec("FAIL", where, f"reply frame {fid!r} is not DR or DR-input")
        elif not re.match(DR[fid], body, re.S):
            rec("FAIL", where, f"does not keep {fid}'s fixed words: {' '.join(body.split())[:90]!r}")
        else:
            rec("PASS", where, fid)
    for level, where, msg in results:
        if not args.quiet or level != "PASS":
            print(f"{level:4}  {where}: {msg}")
    counts = {k: sum(1 for r in results if r[0] == k) for k in ("PASS", "WARN", "FAIL")}
    print(f"\nemails checked: {n_email} | PASS {counts['PASS']} | WARN {counts['WARN']} | FAIL {counts['FAIL']}")
    return 1 if counts["FAIL"] else 0


if __name__ == "__main__":
    sys.exit(main())
