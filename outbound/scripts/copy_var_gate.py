#!/usr/bin/env python3
"""copy_var_gate.py: no blank copy variable ever ships (Aaron flow, aaron-flow.md section 9).

PlusVibe fills a {{variable}} from the lead's own column at send time; a blank value would go out as a broken
sentence ("get more  signing up"). This gate runs on the verified lead file before upload, for every campaign whose
copy uses a {{variable}}:

  1. Reads every {{token}} in the campaign's variants.yaml (subjects and bodies, every step and variant).
     `{{sender_signature}}` is PlusVibe's own sender-side fill, never a lead-file column (standing-rulings.md row 23;
     cold_reader_panel.py strips it before per-row rendering for the same reason), so it is excluded here: never
     required as a column, never flagged as blank. A company field that reaches contact rows under a `co_` prefix
     (if a future company-signal merge by company_domain writes one) is read from `co_<token>` when the bare column
     is missing, and the output still gets the bare column PlusVibe's {{token}} needs.
  2. For each lead row, finds the tokens that are blank (empty or whitespace only).
  3. A blank token with a fallback wording in variants.yaml `variable_fallbacks` is filled with that wording, and the
     row goes to leads.upload.csv (column `copy_var_fallback` names the tokens filled).
     A row with a blank token that has no fallback goes to leads.novar.csv when variants.yaml sets
     `blank_variable_route: novar` (Aaron's no-variable version, uploaded as its own campaign), and the no-variable
     copy's own tokens must then be filled on that row; otherwise the row is held in leads.held-blank-var.csv.
  4. Re-reads the outputs: every input row is in exactly one file, and no upload row has a blank token. Any miss is
     an error, never a warning.

Also writes fallback-preview.md (every email that uses a token with a fallback, shown with the fallback in place)
and copy-var-gate.json (counts). Never edits the copy.

  python outbound/scripts/copy_var_gate.py --variants <variants.yaml> --leads <leads.verified.csv> --out-dir <dir>
         [--novar-variants <variants.novar.yaml>] [--check-only]

--check-only: report counts and the preview, write no lead files (run this before the copy is final).
Exit: 0 every row placed, none held | 1 usage or config error (a token with no column in the lead file, a blank or
em-dash fallback, a broken output) | 4 finished with rows held (named at the top of the summary).
"""
import argparse
import csv
import json
import re
import sys
from pathlib import Path

import yaml

TOKEN = re.compile(r"\{\{\s*([A-Za-z0-9_]+)\s*\}\}")

# PlusVibe fills these itself at send time: never a lead-file column, never gated as blank.
SENDER_VARS = {"sender_signature"}

DASHES = (chr(0x2014), chr(0x2013))  # em dash, en dash


def find_tokens(text: str) -> set[str]:
    return set(TOKEN.findall(text))


def tokens_in(variants: dict) -> set[str]:
    found = set()
    for step in variants.get("sequences") or []:
        for v in step.get("variants") or []:
            for field in ("subject", "body"):
                found.update(find_tokens(str(v.get(field) or "")))
    return found - SENDER_VARS


def render(text: str, values: dict) -> str:
    return TOKEN.sub(lambda m: values.get(m.group(1), m.group(0)), text)


def blank(v) -> bool:
    return v is None or not str(v).strip()


def load_yaml(path: str) -> dict:
    data = yaml.safe_load(Path(path).read_text(encoding="utf-8")) or {}
    if not isinstance(data, dict):
        raise SystemExit(f"{path}: not a YAML mapping")
    return data


def fail(msg: str) -> int:
    print(json.dumps({"ok": False, "error": msg}, indent=2))
    return 1


def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--variants", required=True)
    ap.add_argument("--leads", required=True)
    ap.add_argument("--out-dir", required=True)
    ap.add_argument("--novar-variants")
    ap.add_argument("--check-only", action="store_true")
    a = ap.parse_args(argv)

    variants = load_yaml(a.variants)
    used = tokens_in(variants)
    fallbacks = {str(k): v for k, v in (variants.get("variable_fallbacks") or {}).items()}
    route = str(variants.get("blank_variable_route") or "").strip().lower()
    for k, v in fallbacks.items():
        if blank(v):
            return fail(f"variable_fallbacks.{k} is blank: a fallback must be Aaron's wording, never empty")
        if any(d in str(v) for d in DASHES):
            return fail(f"variable_fallbacks.{k} contains an em or en dash")
    novar = None
    if route == "novar":
        if not a.novar_variants:
            return fail("blank_variable_route is novar but --novar-variants was not given")
        novar = load_yaml(a.novar_variants)
    elif route:
        return fail(f"blank_variable_route must be novar or absent, not {route!r}")
    novar_used = tokens_in(novar) if novar else set()

    with open(a.leads, encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        cols = list(reader.fieldnames or [])
        rows = list(reader)
    aliased = sorted(t for t in (used | novar_used) if t not in cols and f"co_{t}" in cols)
    for r in rows:
        for t in aliased:
            r[t] = r.get(f"co_{t}", "")
    cols += aliased
    missing_cols = sorted((used | novar_used) - set(cols))
    if missing_cols:
        return fail(f"the copy uses {', '.join('{{' + c + '}}' for c in missing_cols)} but {a.leads} has no such column")

    upload, to_novar, held = [], [], []
    blank_counts = {t: 0 for t in sorted(used)}
    filled_counts = {t: 0 for t in sorted(used)}
    for r in rows:
        blanks = [t for t in sorted(used) if blank(r.get(t))]
        for t in blanks:
            blank_counts[t] += 1
        no_fb = [t for t in blanks if t not in fallbacks]
        if not no_fb:
            out = dict(r)
            for t in blanks:
                out[t] = str(fallbacks[t]).strip()
                filled_counts[t] += 1
            out["copy_var_fallback"] = " ".join(blanks)
            upload.append(out)
        elif novar is not None and not [t for t in novar_used if blank(r.get(t))]:
            to_novar.append(dict(r, copy_var_fallback="", held_reason=""))
        else:
            reason = "blank " + ", ".join(no_fb) + (" (no fallback in variable_fallbacks"
                                                    + (", and the no-variable copy also needs a blank column)" if novar is not None else ", no novar route)"))
            held.append(dict(r, held_reason=reason))

    # Proof, not trust: every row placed once, and no upload row carries a blank token.
    if len(upload) + len(to_novar) + len(held) != len(rows):
        return fail("row count mismatch after placement")
    still_blank = sum(1 for r in upload for t in used if blank(r.get(t)))
    if still_blank:
        return fail(f"{still_blank} blank token cells remain in the upload rows")

    out_dir = Path(a.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    preview = ["# Fallback preview", "", f"Source: {a.variants}. Each email that uses a variable with a fallback, shown with the fallback in place. Read every sentence: a fallback that breaks the sentence goes back to Aaron (rail 2).", ""]
    for step in variants.get("sequences") or []:
        for v in step.get("variants") or []:
            text = f"{v.get('subject') or ''}\n{v.get('body') or ''}"
            hit = sorted(find_tokens(text) & set(fallbacks))
            if hit:
                preview += [f"## Step {step.get('step')} variant {v.get('label')} (fallback for {', '.join(hit)})", ""]
                if v.get("subject"):
                    preview += [f"Subject: {render(str(v['subject']), fallbacks)}", ""]
                preview += [render(str(v.get("body") or ""), fallbacks).rstrip(), ""]
    unfallen = sorted(t for t in used if t not in fallbacks and t not in ("first_name",))
    (out_dir / "fallback-preview.md").write_text("\n".join(preview) + "\n", encoding="utf-8")

    def write(name, data, extra):
        with open(out_dir / name, "w", encoding="utf-8", newline="") as f:
            w = csv.DictWriter(f, fieldnames=cols + extra, extrasaction="ignore")
            w.writeheader()
            w.writerows(data)

    if not a.check_only:
        write("leads.upload.csv", upload, ["copy_var_fallback"])
        if to_novar:
            write("leads.novar.csv", to_novar, [])
        if held:
            write("leads.held-blank-var.csv", held, ["held_reason"])
        # Re-read what was written.
        with open(out_dir / "leads.upload.csv", encoding="utf-8", newline="") as f:
            back = list(csv.DictReader(f))
        if len(back) != len(upload) or any(blank(r.get(t)) for r in back for t in used):
            return fail("leads.upload.csv failed the re-read check")

    summary = {
        "alert": (f"HELD: {len(held)} of {len(rows)} rows have a blank copy variable with no fallback and are NOT uploaded "
                  f"(leads.held-blank-var.csv). Ask Aaron for a fallback wording or a no-variable version (rail 2)."
                  if held else "every row placed; no blank variable reaches PlusVibe"),
        "ok": not held,
        "variables_used": sorted(used),
        "read_from_co_columns": aliased,
        "variables_without_fallback": unfallen,
        "unused_fallbacks": sorted(set(fallbacks) - used),
        "blank_variable_route": route or None,
        "rows_in": len(rows), "rows_upload": len(upload), "rows_upload_with_fallback": sum(1 for r in upload if r["copy_var_fallback"]),
        "rows_novar": len(to_novar), "rows_held": len(held),
        "blank_by_variable": blank_counts, "filled_by_fallback": filled_counts,
        "check_only": a.check_only, "out_dir": str(out_dir),
    }
    (out_dir / "copy-var-gate.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))
    return 4 if held else 0


if __name__ == "__main__":
    sys.exit(main())
