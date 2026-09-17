"""
Mailbox Profile Generator  (skill: mailbox-profile-generator)
-------------------------------------------------------------
Provider-agnostic asset generator. The asset generation (headshot, logo, GIF) does not
depend on the provider; this script's INBOX ENUMERATION is currently Primeforge-shaped
(it lists active inboxes from a Primeforge workspace). For Zapmail or other providers,
pass the locked persona name(s) directly and reuse one shared headshot/GIF per client.

Fetches active inboxes from a PrimeForge workspace, generates:
  1. A GPT Image natural business profile photo (gender-aware)
  2. The company logo found via web search (LinkedIn preferred, most colorful wins)
  3. A smooth crossfade GIF combining both

Output lands in (override with PROFILE_OUTPUT_ROOT — set it to the client's sender-identity folder):
  $PROFILE_OUTPUT_ROOT\\{WorkspaceName}\\{FirstName}_{LastName}_{safe_email}\\
  (fallback when unset: ~\\Documents\\Mailbox Profiles\\...)

Usage:
  python generate_inbox_profiles.py [--filter SUBSTRING] [--skip-headshot] [--skip-logo] [--dry-run]
"""

import argparse
import base64
import io
import json
import os
import re
import shutil
import time
import urllib.parse
from collections import Counter
from pathlib import Path

import requests
from dotenv import load_dotenv
from openai import OpenAI
from PIL import Image, ImageEnhance, ImageFilter

# --------------------------------------------------------------------------- #
# Configuration
# --------------------------------------------------------------------------- #

load_dotenv(Path(__file__).parent / ".env")

OPENAI_API_KEY               = os.getenv("OPENAI_API_KEY", "")
PRIMEFORGE_API_KEY           = os.getenv("PRIMEFORGE_API_KEY") or os.getenv("X_PRIMEFORGE_KEY", "")
FORGE_MCP_URL                = os.getenv("FORGE_MCP_URL", "https://mcp.salesforge.ai/mcp")
TARGET_WORKSPACE             = os.getenv("TARGET_PRIMEFORGE_WORKSPACE_NAME", "")

# Output root: ALWAYS prefer PROFILE_OUTPUT_ROOT (per-client sender-identity folder). The fallback is a
# provider-neutral generic folder, only used when the env var is unset. Do not hardcode a client/provider
# path here — set PROFILE_OUTPUT_ROOT per run (see the mailbox-profile-generator skill).
OUTPUT_ROOT = Path(os.getenv("PROFILE_OUTPUT_ROOT") or (Path.home() / "Documents" / "Mailbox Profiles"))

GIF_SIZE          = (400, 400)
HOLD_FRAMES       = 8     # frames of solid image at each end
CROSSFADE_FRAMES  = 18    # frames for each transition
FRAME_DURATION_MS = 80    # ms per frame
REQUEST_DELAY_SEC = 1.0   # politeness delay between inboxes

# Override gender-guesser for ambiguous first names: {"Name": "male" | "female"}
GENDER_OVERRIDES: dict[str, str] = {}

# --------------------------------------------------------------------------- #
# Argument parsing
# --------------------------------------------------------------------------- #

def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Generate PrimeForge inbox profile images and GIFs")
    p.add_argument("--inbox-file", default="", help="Read inboxes from a local JSON file instead of PrimeForge")
    p.add_argument("--filter",        default="", help="Only process inboxes containing this substring")
    p.add_argument("--skip-headshot", action="store_true", help="Skip GPT Image headshot generation")
    p.add_argument("--skip-logo",     action="store_true", help="Skip company logo search")
    p.add_argument("--dry-run",       action="store_true", help="Print plan without calling paid APIs")
    p.add_argument("--company-name-override", default="", help="Use this company name for all output logos/GIFs")
    p.add_argument("--logo-file", default="", help="Use one local logo file for all inboxes instead of web search")
    p.add_argument("--require-count", type=int, default=0, help="Stop unless the filtered inbox count matches")
    p.add_argument("--require-domains", default="", help="Comma-separated exact domain set required before generation")
    p.add_argument("--overwrite-headshot", action="store_true", help="Regenerate shared sender headshots even when they already exist")
    p.add_argument("--overwrite-gif", action="store_true", help="Regenerate GIFs even when output files already exist")
    p.add_argument("--hold-frames", type=int, default=HOLD_FRAMES, help="Number of still frames before and after each transition")
    p.add_argument("--crossfade-frames", type=int, default=CROSSFADE_FRAMES, help="Number of frames used for each crossfade")
    p.add_argument("--frame-duration-ms", type=int, default=FRAME_DURATION_MS, help="Milliseconds to display each GIF frame")
    return p.parse_args()

# --------------------------------------------------------------------------- #
# PrimeForge: fetch inboxes
# --------------------------------------------------------------------------- #

def fetch_inboxes() -> list[dict]:
    """Return list of inbox dicts with at minimum: email, first_name, last_name."""
    headers = {
        "Authorization": f"Bearer {PRIMEFORGE_API_KEY}",
        "Content-Type": "application/json",
    }
    # Try the Forge MCP /tools/call endpoint to list mailboxes in the workspace.
    # If your workspace uses a different endpoint, adjust the tool name below.
    payload = {
        "tool": "list_mailboxes",
        "params": {"workspace": TARGET_WORKSPACE},
    }
    try:
        resp = requests.post(f"{FORGE_MCP_URL}/tools/call", headers=headers, json=payload, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        mailboxes = data.get("result", data.get("mailboxes", []))
        if isinstance(mailboxes, list) and mailboxes:
            return _normalize_inboxes(mailboxes)
    except Exception as exc:
        print(f"[warn] Forge MCP list_mailboxes failed ({exc}), trying direct API...")

    # Fallback: PrimeForge OpenAPI REST endpoint
    try:
        resp = requests.get(
            "https://api.primeforge.io/v1/mailboxes",
            headers=headers,
            params={"workspace": TARGET_WORKSPACE, "limit": 500},
            timeout=30,
        )
        resp.raise_for_status()
        return _normalize_inboxes(resp.json().get("data", resp.json()))
    except Exception as exc:
        raise RuntimeError(
            f"Could not fetch inboxes from PrimeForge. Check PRIMEFORGE_API_KEY and "
            f"TARGET_PRIMEFORGE_WORKSPACE_NAME.\nError: {exc}"
        )


def load_inboxes_from_file(path: str) -> list[dict]:
    source = Path(path).expanduser()
    if not source.exists():
        raise SystemExit(f"--inbox-file does not exist: {source}")

    data = json.loads(source.read_text(encoding="utf-8"))
    if isinstance(data, dict):
        raw = data.get("mailboxes", [])
    else:
        raw = data

    normalized: list[dict] = []
    for item in raw:
        if isinstance(item, str):
            item = {"email": item}
        email = (item.get("email") or "").strip().lower()
        if not email or "@" not in email:
            continue
        local, _, domain = email.partition("@")
        first = (item.get("first_name") or item.get("firstName") or "").strip()
        last = (item.get("last_name") or item.get("lastName") or "").strip()
        if not first:
            parts = re.split(r"[._-]", local)
            first = parts[0].capitalize() if parts else local.capitalize()
            last = parts[1].capitalize() if len(parts) > 1 else ""
        normalized.append({
            "email": email,
            "local": local,
            "domain": domain,
            "first_name": first.capitalize(),
            "last_name": last.capitalize(),
            "company_name": item.get("company_name") or _company_from_domain(domain),
        })
    return normalized


def _normalize_inboxes(raw: list) -> list[dict]:
    """Normalize varying PrimeForge API response shapes into a consistent dict."""
    normalized = []
    for item in raw:
        email = item.get("email") or item.get("address") or item.get("mailbox") or ""
        if not email:
            continue
        local, _, domain = email.partition("@")
        # Prefer explicit name fields; fall back to splitting the local part on dots/underscores
        first = item.get("first_name") or item.get("firstName") or ""
        last  = item.get("last_name")  or item.get("lastName")  or ""
        if not first:
            parts = re.split(r"[._-]", local)
            first = parts[0].capitalize() if parts else local.capitalize()
            last  = parts[1].capitalize() if len(parts) > 1 else ""
        company = _company_from_domain(domain)
        normalized.append({
            "email":        email,
            "local":        local,
            "domain":       domain,
            "first_name":   first.capitalize(),
            "last_name":    last.capitalize(),
            "company_name": company,
        })
    return normalized


def _company_from_domain(domain: str) -> str:
    """Turn 'acmedomain.com' into 'Acmedomain', 'get-acme.com' into 'Get Acme'."""
    base = domain.split(".")[0]
    return re.sub(r"[-_]", " ", base).title()


def _parse_required_domains(raw: str) -> set[str]:
    return {d.strip().lower() for d in raw.split(",") if d.strip()}


def validate_inboxes(inboxes: list[dict], require_count: int, require_domains: set[str]) -> None:
    """Fail before paid image generation when the target mailbox set is wrong."""
    errors: list[str] = []
    domains = {i["domain"].lower() for i in inboxes}

    if require_count and len(inboxes) != require_count:
        errors.append(f"Expected {require_count} inboxes, found {len(inboxes)}.")

    if require_domains and domains != require_domains:
        missing = sorted(require_domains - domains)
        extra = sorted(domains - require_domains)
        if missing:
            errors.append("Missing required domains: " + ", ".join(missing))
        if extra:
            errors.append("Unexpected domains: " + ", ".join(extra))

    bad_names = [
        i["email"]
        for i in inboxes
        if not i.get("first_name") or not i.get("last_name")
    ]
    if bad_names and (require_count or require_domains):
        errors.append("Missing usable first/last name for: " + ", ".join(bad_names))

    if errors:
        raise SystemExit("Inbox validation failed before generation:\n- " + "\n- ".join(errors))

    if require_domains:
        counts = Counter(i["domain"].lower() for i in inboxes)
        print("Validated target domains:")
        for domain in sorted(require_domains):
            print(f"  {domain}: {counts[domain]} inbox(es)")


def _safe_filename(value: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9._ -]+", "", value).strip()
    cleaned = re.sub(r"\s+", "_", cleaned)
    return cleaned or "Company"


def prepare_shared_logo(logo_file: str, workspace_root: Path, company_name: str, dry_run: bool) -> Path | None:
    if not logo_file:
        return None

    source = Path(logo_file).expanduser()
    if not source.exists():
        raise SystemExit(f"--logo-file does not exist: {source}")

    shared_dir = workspace_root / "_shared"
    shared_logo = shared_dir / f"{_safe_filename(company_name or 'Company')}_logo.png"

    if dry_run:
        print(f"[dry-run] would copy shared logo: {source} -> {shared_logo}")
        return source

    shared_dir.mkdir(parents=True, exist_ok=True)
    img = Image.open(source).convert("RGBA")
    img = _square_crop(img, GIF_SIZE[0])
    img.save(shared_logo, "PNG")
    print(f"Shared logo saved: {shared_logo}")
    return shared_logo

# --------------------------------------------------------------------------- #
# Gender detection
# --------------------------------------------------------------------------- #

def detect_gender(first_name: str, client: OpenAI) -> str:
    name = first_name.strip()
    if name in GENDER_OVERRIDES:
        return GENDER_OVERRIDES[name]

    try:
        import gender_guesser.detector as gender_lib
        d = gender_lib.Detector()
        result = d.get_gender(name)
        if result in ("male", "mostly_male"):
            return "male"
        if result in ("female", "mostly_female"):
            return "female"
    except ImportError:
        pass

    # Fall back to GPT-4o-mini for ambiguous or non-Western names
    try:
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{
                "role": "user",
                "content": (
                    f"Is the first name '{name}' more commonly male or female? "
                    "Reply with exactly one word: male or female."
                ),
            }],
            max_tokens=5,
        )
        answer = resp.choices[0].message.content.strip().lower()
        if "female" in answer:
            return "female"
    except Exception:
        pass

    return "male"  # safe default

# --------------------------------------------------------------------------- #
# Headshot generation (GPT Image)
# --------------------------------------------------------------------------- #

# Backdrop tint for the sender headshot. Deliberately brand-neutral by default.
# Set BACKDROP_COLOR to the CLIENT's own brand colour so the photo sits alongside
# their identity. It must never carry another client's palette.
BACKDROP_COLOR = os.environ.get("BACKDROP_COLOR", "a soft neutral gray")

HEADSHOT_PROMPT_TEMPLATE = (
    "Create a realistic everyday business profile photo of a {gender} professional. "
    "This is not a close-up headshot. It should look like a normal account profile photo taken quickly on a modern phone. "
    "Show the upper torso from lower chest upward, with both shoulders and more shirt visible. "
    "The face should take up less than one third of the image height, with a natural head-to-body ratio and extra wall space around the person. "
    "Use a slight three-quarter angle, a little camera-height variation, mild asymmetry, and an off-center crop, as if someone else took it casually. "
    "Expression should be relaxed and normal, with a small uneven closed-mouth smile, not a perfect stock-photo grin. "
    "Use casual business clothing, such as a plain button-up or knit shirt, no suit jacket, no tie, no name tag, and no badge. "
    "Use a simple matte wall background in " + BACKDROP_COLOR + ", not a blurred office or city background. "
    "Use natural indoor light, normal skin texture, slight lens softness, mild JPEG-like realism, a little unevenness, and small imperfections. "
    "No text, no name tag, no badge, no visible writing, no company logo, no signage, no watermark, and no letters anywhere in the image. "
    "Avoid airbrushed skin, oversized head, face-dominant crop, perfect centered framing, cinematic lighting, shallow depth-of-field blur, glamour retouching, or ultra-sharp studio quality."
)


def generate_headshot(first_name: str, gender: str, client: OpenAI, out_path: Path, dry_run: bool, overwrite: bool) -> bool:
    if out_path.exists() and not overwrite:
        print(f"  [skip] headshot already exists: {out_path.name}")
        return True
    prompt = HEADSHOT_PROMPT_TEMPLATE.format(gender=gender, first_name=first_name)
    if dry_run:
        print(f"  [dry-run] GPT Image prompt: {prompt[:80]}...")
        return True
    for attempt in range(2):
        try:
            result = client.images.generate(
                model="gpt-image-1",
                prompt=prompt if attempt == 0 else (
                    f"Realistic casual business profile photo of a {gender} person, "
                    "phone camera look, plain pale teal-gray wall background, upper torso visible, face less than one third of frame height, "
                    "off-center framing, natural imperfections, "
                    "no text, no badge, no name tag, no visible writing."
                ),
                size="1024x1024",
                quality="low",
                n=1,
            )
            image = result.data[0]
            if image.b64_json:
                img_data = base64.b64decode(image.b64_json)
            elif image.url:
                img_data = requests.get(image.url, timeout=30).content
            else:
                raise RuntimeError("Image response had no b64_json or url")
            img = Image.open(io.BytesIO(img_data)).convert("RGB")
            img = _naturalize_headshot(img)
            img.save(out_path, "JPEG", quality=82, subsampling=2, optimize=True)
            print(f"  [ok] headshot saved: {out_path.name}")
            return True
        except Exception as exc:
            print(f"  [warn] headshot attempt {attempt+1} failed: {exc}")
    return False


def _naturalize_headshot(img: Image.Image) -> Image.Image:
    """Reduce the over-sharp, airbrushed look common in generated profile photos."""
    img = img.filter(ImageFilter.GaussianBlur(0.18))
    img = ImageEnhance.Sharpness(img).enhance(0.86)
    img = ImageEnhance.Contrast(img).enhance(0.98)
    img = ImageEnhance.Color(img).enhance(0.96)

    noise = Image.effect_noise(img.size, 5).convert("L")
    noise = ImageEnhance.Contrast(noise).enhance(0.55)
    noise_rgb = Image.merge("RGB", (noise, noise, noise))
    return Image.blend(img, noise_rgb, 0.018)

# --------------------------------------------------------------------------- #
# Company logo search
# --------------------------------------------------------------------------- #

def fetch_logo(company_name: str, domain: str, out_path: Path, dry_run: bool) -> bool:
    if out_path.exists():
        print(f"  [skip] logo already exists: {out_path.name}")
        return True
    if dry_run:
        print(f"  [dry-run] would search logo for: {company_name}")
        return True

    candidates = _search_logo_candidates(company_name, domain)
    if not candidates:
        print(f"  [warn] no logo found for {company_name}, using placeholder")
        _make_placeholder_logo(company_name, out_path)
        return True

    best = _pick_most_colorful(candidates)
    if best:
        try:
            img_data = requests.get(best, timeout=15, headers={"User-Agent": "Mozilla/5.0"}).content
            img = Image.open(io.BytesIO(img_data)).convert("RGBA")
            img = _square_crop(img, GIF_SIZE[0])
            img.save(out_path, "PNG")
            print(f"  [ok] logo saved: {out_path.name}")
            return True
        except Exception as exc:
            print(f"  [warn] logo download failed ({exc}), using placeholder")

    _make_placeholder_logo(company_name, out_path)
    return True


def _search_logo_candidates(company_name: str, domain: str) -> list[str]:
    """
    Uses DuckDuckGo image search (no API key required) to find logo URLs.
    Tries LinkedIn company page first, then general logo search.
    """
    queries = [
        f"{company_name} site:linkedin.com/company",
        f"{company_name} company logo transparent",
        f"{domain} logo",
    ]
    found: list[str] = []
    for query in queries:
        urls = _ddg_image_search(query)
        found.extend(urls)
        if len(found) >= 5:
            break
    return found[:8]


def _ddg_image_search(query: str) -> list[str]:
    """Lightweight DuckDuckGo image search that returns direct image URLs."""
    try:
        encoded = urllib.parse.quote_plus(query)
        # DuckDuckGo instant answer API (no key needed, returns JSON)
        resp = requests.get(
            f"https://duckduckgo.com/?q={encoded}&iax=images&ia=images&format=json",
            headers={"User-Agent": "Mozilla/5.0"},
            timeout=10,
        )
        # DuckDuckGo image search via their hidden API
        token_resp = requests.get(
            f"https://duckduckgo.com/?q={encoded}&t=h_&iax=images&ia=images",
            headers={"User-Agent": "Mozilla/5.0"},
            timeout=10,
        )
        vqd_match = re.search(r'vqd="([^"]+)"', token_resp.text)
        if not vqd_match:
            return []
        vqd = vqd_match.group(1)
        img_resp = requests.get(
            "https://duckduckgo.com/i.js",
            params={"q": query, "vqd": vqd, "f": ",,,,,", "p": "1"},
            headers={"User-Agent": "Mozilla/5.0", "Referer": "https://duckduckgo.com/"},
            timeout=10,
        )
        results = img_resp.json().get("results", [])
        return [r["image"] for r in results if r.get("image")]
    except Exception:
        return []


def _pick_most_colorful(urls: list[str]) -> str | None:
    """Download thumbnails and return the URL of the most colorful one (highest avg saturation)."""
    best_url = None
    best_saturation = -1.0
    for url in urls:
        try:
            data = requests.get(url, timeout=8, headers={"User-Agent": "Mozilla/5.0"}).content
            img = Image.open(io.BytesIO(data)).convert("HSV") if hasattr(Image, "HSV") else \
                  Image.open(io.BytesIO(data)).convert("RGB")
            # Compute mean saturation via HSV conversion
            hsv = img.convert("HSV") if img.mode != "HSV" else img
            _, s, _ = hsv.split()
            avg_sat = sum(s.getdata()) / (s.width * s.height)
            if avg_sat > best_saturation:
                best_saturation = avg_sat
                best_url = url
        except Exception:
            continue
    return best_url


def _square_crop(img: Image.Image, size: int) -> Image.Image:
    """Center-crop to square, then resize."""
    w, h = img.size
    side = min(w, h)
    left = (w - side) // 2
    top  = (h - side) // 2
    img = img.crop((left, top, left + side, top + side))
    return img.resize((size, size), Image.LANCZOS)


def _make_placeholder_logo(company_name: str, out_path: Path) -> None:
    """Create a solid-color square with the company initial as fallback."""
    from PIL import ImageDraw, ImageFont
    colors = [(67, 120, 220), (220, 80, 67), (67, 180, 120), (180, 120, 67), (120, 67, 180)]
    color = colors[hash(company_name) % len(colors)]
    img = Image.new("RGBA", GIF_SIZE, color + (255,))
    draw = ImageDraw.Draw(img)
    initial = company_name[0].upper() if company_name else "?"
    # Use a large default font
    try:
        font = ImageFont.truetype("arial.ttf", size=160)
    except Exception:
        font = ImageFont.load_default()
    bbox = draw.textbbox((0, 0), initial, font=font)
    tx = (GIF_SIZE[0] - (bbox[2] - bbox[0])) // 2 - bbox[0]
    ty = (GIF_SIZE[1] - (bbox[3] - bbox[1])) // 2 - bbox[1]
    draw.text((tx, ty), initial, fill=(255, 255, 255, 255), font=font)
    img.save(out_path, "PNG")

# --------------------------------------------------------------------------- #
# GIF creation (smooth crossfade)
# --------------------------------------------------------------------------- #

def create_crossfade_gif(
    headshot_path: Path,
    logo_path: Path,
    gif_path: Path,
    dry_run: bool,
    hold_frames: int,
    crossfade_frames: int,
    frame_duration_ms: int,
    overwrite: bool,
) -> bool:
    if hold_frames < 1 or crossfade_frames < 1 or frame_duration_ms < 20:
        raise SystemExit("GIF timing values are invalid. Use positive frame counts and at least 20 ms per frame.")

    if gif_path.exists() and not overwrite:
        print(f"  [skip] GIF already exists: {gif_path.name}")
        return True
    if dry_run:
        print(f"  [dry-run] would create GIF: {gif_path.name}")
        return True
    try:
        person = Image.open(headshot_path).convert("RGBA").resize(GIF_SIZE, Image.LANCZOS)
        logo   = Image.open(logo_path).convert("RGBA").resize(GIF_SIZE, Image.LANCZOS)

        frames: list[Image.Image] = []

        def rgba_to_rgb(img: Image.Image) -> Image.Image:
            bg = Image.new("RGB", img.size, (255, 255, 255))
            bg.paste(img, mask=img.split()[3])
            return bg

        # Hold on person
        for _ in range(hold_frames):
            frames.append(rgba_to_rgb(person))

        # Crossfade person to logo
        for i in range(1, crossfade_frames + 1):
            alpha = i / crossfade_frames
            blended = Image.blend(person, logo, alpha=alpha)
            frames.append(rgba_to_rgb(blended))

        # Hold on logo
        for _ in range(hold_frames):
            frames.append(rgba_to_rgb(logo))

        # Crossfade logo to person
        for i in range(1, crossfade_frames + 1):
            alpha = i / crossfade_frames
            blended = Image.blend(logo, person, alpha=alpha)
            frames.append(rgba_to_rgb(blended))

        frames[0].save(
            gif_path,
            format="GIF",
            save_all=True,
            append_images=frames[1:],
            loop=0,
            duration=frame_duration_ms,
            optimize=False,
        )
        print(f"  [ok] GIF saved: {gif_path.name}  ({gif_path.stat().st_size // 1024} KB)")
        return True
    except Exception as exc:
        print(f"  [error] GIF creation failed: {exc}")
        return False

# --------------------------------------------------------------------------- #
# Main
# --------------------------------------------------------------------------- #

def main() -> None:
    args = parse_args()

    if not args.inbox_file and not PRIMEFORGE_API_KEY:
        raise SystemExit("PRIMEFORGE_API_KEY (or X_PRIMEFORGE_KEY) is not set in .env")
    if not args.skip_headshot and not args.dry_run and not OPENAI_API_KEY:
        raise SystemExit("OPENAI_API_KEY is not set in .env (required for GPT Image headshots)")
    if not TARGET_WORKSPACE:
        raise SystemExit("TARGET_PRIMEFORGE_WORKSPACE_NAME is not set in .env")

    openai_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

    if args.inbox_file:
        print(f"\nLoading inboxes from: {args.inbox_file}")
        inboxes = load_inboxes_from_file(args.inbox_file)
    else:
        print(f"\nFetching inboxes from PrimeForge workspace: {TARGET_WORKSPACE}")
        inboxes = fetch_inboxes()
    if args.filter:
        inboxes = [i for i in inboxes if args.filter.lower() in i["email"].lower()]
    if args.company_name_override:
        for inbox in inboxes:
            inbox["company_name"] = args.company_name_override
    required_domains = _parse_required_domains(args.require_domains)
    validate_inboxes(inboxes, args.require_count, required_domains)
    print(f"Found {len(inboxes)} inbox(es) to process\n")

    workspace_root = OUTPUT_ROOT / TARGET_WORKSPACE
    workspace_root.mkdir(parents=True, exist_ok=True)
    shared_logo_path = prepare_shared_logo(
        args.logo_file,
        workspace_root,
        args.company_name_override or "Company",
        args.dry_run,
    )

    results = {"ok": 0, "failed": 0, "skipped": 0}
    generated_headshot_cache: set[Path] = set()

    for inbox in inboxes:
        email      = inbox["email"]
        first      = inbox["first_name"]
        last       = inbox["last_name"]
        company    = inbox["company_name"]
        local      = inbox["local"]
        domain     = inbox["domain"]

        safe_email = _safe_filename(email.replace("@", "_at_"))
        folder_name = f"{first}_{last}_{safe_email}" if last else f"{first}_{safe_email}"
        out_dir = workspace_root / folder_name
        out_dir.mkdir(parents=True, exist_ok=True)

        headshot_path = out_dir / f"{first}_{last}_headshot.jpg"
        shared_headshot_path = workspace_root / "_shared" / f"{first}_{last}_headshot.jpg"
        safe_company  = _safe_filename(company)
        logo_path     = out_dir / f"{safe_company}_logo.png"
        gif_path      = out_dir / f"{first}_{last}_{safe_company}_profile.gif"

        print(f"-> {email}  ({first} {last} | {company})")

        # Step 1: headshot
        if not args.skip_headshot:
            if shared_headshot_path.exists() and not headshot_path.exists():
                shutil.copyfile(shared_headshot_path, headshot_path)
                print(f"  [ok] shared headshot copied: {headshot_path.name}")
            if shared_headshot_path in generated_headshot_cache and shared_headshot_path.exists():
                shutil.copyfile(shared_headshot_path, headshot_path)
                print(f"  [ok] regenerated shared headshot copied: {headshot_path.name}")
            else:
                gender = detect_gender(first, openai_client)
                print(f"  gender: {gender}")
                if not generate_headshot(first, gender, openai_client, headshot_path, args.dry_run, args.overwrite_headshot):
                    results["failed"] += 1
                    continue
                if not args.dry_run and headshot_path.exists() and (args.overwrite_headshot or not shared_headshot_path.exists()):
                    shared_headshot_path.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copyfile(headshot_path, shared_headshot_path)
                    generated_headshot_cache.add(shared_headshot_path)

        # Step 2: logo
        if shared_logo_path:
            if args.dry_run:
                print(f"  [dry-run] would use shared logo: {shared_logo_path}")
            else:
                shutil.copyfile(shared_logo_path, logo_path)
                print(f"  [ok] shared logo copied: {logo_path.name}")
        elif not args.skip_logo:
            if not fetch_logo(company, domain, logo_path, args.dry_run):
                results["failed"] += 1
                continue

        # Step 3: GIF (only if both source files exist or dry-run)
        if headshot_path.exists() and logo_path.exists():
            if not create_crossfade_gif(
                headshot_path,
                logo_path,
                gif_path,
                args.dry_run,
                args.hold_frames,
                args.crossfade_frames,
                args.frame_duration_ms,
                args.overwrite_gif,
            ):
                results["failed"] += 1
                continue
        elif not args.dry_run:
            print(f"  [skip] GIF skipped - missing source file(s)")
            results["skipped"] += 1
            continue

        results["ok"] += 1
        time.sleep(REQUEST_DELAY_SEC)

    print(f"\nDone.  {results['ok']} ok  {results['failed']} failed  {results['skipped']} skipped")
    print(f"Output folder: {workspace_root}")


if __name__ == "__main__":
    main()
