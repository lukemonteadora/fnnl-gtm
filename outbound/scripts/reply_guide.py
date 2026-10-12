#!/usr/bin/env python3
"""Reply guide tooling: leak check, PDF render, and launch-set diff.

Used by /reply-guide (outbound/reference/reply-guide-template.md).

  python outbound/scripts/reply_guide.py check  <client-dir> [--file reply-guide.md]
  python outbound/scripts/reply_guide.py render <client-dir>
  python outbound/scripts/reply_guide.py diff   <client-dir> --launch-set "offer-1@societies,offer-11@trade"

<client-dir> is outbound/profiles/<slug>. The manifest is <client-dir>/reply-guide.manifest.json.

check  : fails (exit 1) on any agency or workspace leak, a spaced dash, or a {{bracket}}
         used in the guide but missing from its "Filling in the brackets" table.
render : runs check, writes exports/<Client>-Reply-Guide.html and .pdf with Edge or Chrome
         headless, then re-checks the PDF's extracted text. Never renders the internal file.
diff   : compares the launch set Phase 3 recorded with the manifest. Exit 0 = unchanged,
         exit 2 = changed or no manifest (rebuild the guide), exit 1 = error.
"""
import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

# Always forbidden in a client-facing guide, whatever the client.
BASE_TERMS = ["FNNL", "fnnl", "Aaron", "Eric Nowoslawski", "Taylor Haren", "Nate Herk",
              "PlusVibe", "Clay", "AI Ark", "GetLeads", "Prospeo", "MillionVerifier", "Giggal",
              "Claude", "we work with", "on behalf of"]
BASE_PATTERNS = [
    (r"\.(md|csv|yaml|yml|json|py|mjs)\b", "a file name"),
    (r"\bruling", "the word 'ruling'"),
    (r"\bskills?\b", "the word 'skill'"),
    (r"(?<![\w/])/[a-z][a-z0-9]+(?:-[a-z0-9]+)+\b", "a slash command"),
    (r"\boffer-\d+\b|\baaron_rank\b|\bpf-[a-z-]+\b", "an internal id or campaign slug"),
    (r" [\u2013\u2014] ", "a spaced dash"),
]
CHROME_PATHS = [
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
]
CSS = """
@page { size: Letter; margin: 0.7in 0.75in; }
body{font-family:"Segoe UI",Arial,sans-serif;font-size:10.5pt;line-height:1.45;color:#1f2328;}
h1{font-size:22pt;color:#0f3d5e;margin:0 0 6pt;border-bottom:3px solid #f28c28;padding-bottom:6pt;}
h2{font-size:14.5pt;color:#0f3d5e;margin:20pt 0 6pt;page-break-after:avoid;border-bottom:1px solid #d0d7de;padding-bottom:3pt;}
h3{font-size:11.5pt;margin:14pt 0 4pt;page-break-after:avoid;}
p{margin:4pt 0 6pt;} ul,ol{margin:4pt 0 8pt 18pt;padding:0;} li{margin:2pt 0;}
table{border-collapse:collapse;width:100%;margin:6pt 0 10pt;font-size:9.5pt;}
th{background:#0f3d5e;color:#fff;text-align:left;padding:5pt 6pt;}
td{border-bottom:1px solid #d0d7de;padding:5pt 6pt;vertical-align:top;} tr{page-break-inside:avoid;}
pre{background:#f4f8fb;border-left:4px solid #f28c28;padding:8pt 10pt;white-space:pre-wrap;font-family:"Segoe UI",Arial,sans-serif;font-size:10pt;margin:4pt 0 10pt;page-break-inside:avoid;border-radius:3px;}
code{font-family:Consolas,monospace;font-size:9.5pt;background:#eef1f4;padding:0 3px;border-radius:2px;}
pre code{background:none;padding:0;font-family:inherit;font-size:inherit;}
blockquote{margin:4pt 0 10pt;padding:6pt 10pt;background:#f7f7f7;border-left:4px solid #0f3d5e;font-style:italic;page-break-inside:avoid;}
blockquote p{margin:0;} hr{border:none;border-top:1px solid #d0d7de;margin:14pt 0;}
"""


def load_manifest(client_dir: Path):
    p = client_dir / "reply-guide.manifest.json"
    if not p.exists():
        return None
    return json.loads(p.read_text(encoding="utf-8"))


def forbidden_terms(manifest):
    terms = list(BASE_TERMS)
    if manifest:
        terms += [t for t in manifest.get("forbidden_terms", []) if t]
    seen, out = set(), []
    for t in terms:  # matching is case-insensitive, so dedupe the same way
        if t.lower() not in seen:
            seen.add(t.lower()); out.append(t)
    return sorted(out, key=str.lower)


def find_leaks(text, manifest):
    problems = []
    for term in forbidden_terms(manifest):
        # Whole-word, case-insensitive for names; "Clay" must not hit "clayton".
        pat = r"(?<![A-Za-z])" + re.escape(term) + r"(?![A-Za-z])"
        for m in re.finditer(pat, text, flags=re.I):
            line = text.count("\n", 0, m.start()) + 1
            problems.append(f"line {line}: forbidden term '{term}'")
    for pat, what in BASE_PATTERNS:
        for m in re.finditer(pat, text):
            line = text.count("\n", 0, m.start()) + 1
            problems.append(f"line {line}: {what} ('{m.group(0).strip()}')")
    return problems


def bracket_problems(md):
    used = set(re.findall(r"\{\{([a-z0-9_]+)\}\}", md))
    m = re.search(r"##[^\n]*Filling in the brackets(.*)$", md, flags=re.S)
    if not m:
        return ["no 'Filling in the brackets' section"]
    table = set(re.findall(r"`\{\{([a-z0-9_]+)\}\}`", m.group(1)))
    return [f"bracket {{{{{b}}}}} is used but not explained in the bracket table" for b in sorted(used - table)]


def cmd_check(client_dir: Path, fname: str, quiet=False):
    path = client_dir / fname
    md = path.read_text(encoding="utf-8")
    manifest = load_manifest(client_dir)
    problems = find_leaks(md, manifest) + bracket_problems(md)
    link = (manifest or {}).get("booking_link_value", "")
    warnings = []
    if link:
        for term in forbidden_terms(manifest):
            if re.search(r"(?<![A-Za-z])" + re.escape(term) + r"(?![A-Za-z])", link, flags=re.I):
                warnings.append(f"the booking link the team pastes carries '{term}', which prospects can see: "
                                f"ask the client for a neutral URL (operator flag, not a guide failure)")
    for w in warnings:
        print("WARNING:", w)
    if problems:
        print(f"CHECK FAIL {path} ({len(problems)}):")
        for p in problems:
            print("  -", p)
        return 1
    if not quiet:
        print(f"CHECK PASS {path}: 0 leaks, every bracket explained")
    return 0


def find_browser():
    for p in CHROME_PATHS:
        if os.path.exists(p):
            return p
    for name in ("msedge", "google-chrome", "chromium", "chrome"):
        w = shutil.which(name)
        if w:
            return w
    return None


def cmd_render(client_dir: Path):
    try:
        import markdown  # noqa
        from pypdf import PdfReader  # noqa
    except ImportError:
        print("ERROR: needs the 'markdown' and 'pypdf' packages: python -m pip install markdown pypdf")
        return 1
    import markdown
    from pypdf import PdfReader
    if cmd_check(client_dir, "reply-guide.md") != 0:
        print("Not rendering: fix the check failures first.")
        return 1
    md = (client_dir / "reply-guide.md").read_text(encoding="utf-8")
    title = re.search(r"^# (.+)$", md, flags=re.M).group(1).strip()
    client = title.replace("Reply Guide", "").strip() or client_dir.name
    stem = re.sub(r"[^A-Za-z0-9]+", "-", client).strip("-") + "-Reply-Guide"
    out = client_dir / "exports"
    out.mkdir(exist_ok=True)
    body = markdown.markdown(md, extensions=["tables", "fenced_code"])
    html_path = out / f"{stem}.html"
    pdf_path = out / f"{stem}.pdf"
    html_path.write_text(f'<!doctype html><html><head><meta charset="utf-8"><title>{title}</title>'
                         f"<style>{CSS}</style></head><body>{body}</body></html>", encoding="utf-8")
    browser = find_browser()
    if not browser:
        print("ERROR: no Edge or Chrome found for the PDF render.")
        return 1
    subprocess.run([browser, "--headless=new", "--disable-gpu", "--no-pdf-header-footer",
                    f"--print-to-pdf={pdf_path.resolve()}", html_path.resolve().as_uri()],
                   capture_output=True, timeout=120)
    if not pdf_path.exists():
        print("ERROR: the browser wrote no PDF.")
        return 1
    reader = PdfReader(str(pdf_path))
    text = "\n".join(p.extract_text() or "" for p in reader.pages)
    leaks = [p for p in find_leaks(text, load_manifest(client_dir)) if "spaced dash" not in p]
    headings = re.findall(r"^## (.+)$", md, flags=re.M)
    missing = [h for h in headings if h.split(". ", 1)[-1][:25] not in text]
    if leaks or missing:
        print(f"RENDER FAIL {pdf_path}: leaks={leaks} missing_sections={missing}")
        return 1
    manifest = load_manifest(client_dir) or {}
    manifest["guide_sha256"] = hashlib.sha256(md.encode("utf-8")).hexdigest()
    manifest["pdf"] = str(pdf_path.relative_to(client_dir)).replace("\\", "/")
    manifest["pdf_pages"] = len(reader.pages)
    (client_dir / "reply-guide.manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"RENDER PASS {pdf_path}: {len(reader.pages)} pages, {len(headings)} of {len(headings)} sections present, 0 leaks in PDF text")
    return 0


def cmd_diff(client_dir: Path, launch_set: str):
    manifest = load_manifest(client_dir)
    phase3 = sorted({k.strip() for k in launch_set.split(",") if k.strip()})
    if manifest is None:
        print("REBUILD: no reply-guide.manifest.json, so this client has no guide on record.")
        print("  Phase 3 launch set:", ", ".join(phase3))
        return 2
    guide = sorted(set(manifest.get("launch_set", [])))
    added = sorted(set(phase3) - set(guide))
    removed = sorted(set(guide) - set(phase3))
    if not added and not removed:
        print(f"UNCHANGED: the guide covers the Phase 3 launch set ({len(guide)} campaigns). Skip the rebuild.")
        return 0
    print("REBUILD: the launch set changed since the guide was built.")
    if added:
        print("  added in Phase 3:  ", ", ".join(added))
    if removed:
        print("  not in Phase 3:    ", ", ".join(removed))
    return 2


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    c = sub.add_parser("check"); c.add_argument("client_dir"); c.add_argument("--file", default="reply-guide.md")
    r = sub.add_parser("render"); r.add_argument("client_dir")
    d = sub.add_parser("diff"); d.add_argument("client_dir"); d.add_argument("--launch-set", required=True)
    a = ap.parse_args()
    cd = Path(a.client_dir)
    if not cd.is_dir():
        print(f"ERROR: {cd} is not a directory"); sys.exit(1)
    if a.cmd == "check":
        sys.exit(cmd_check(cd, a.file))
    if a.cmd == "render":
        sys.exit(cmd_render(cd))
    sys.exit(cmd_diff(cd, a.launch_set))


if __name__ == "__main__":
    main()
