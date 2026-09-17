"""
Client-agnostic cold email domain setup template.

Configure the run through .env values such as CLIENT_NAME, BRAND_KEYWORD,
DOMAIN_COUNT, and TARGET_ZAPMAIL_WORKSPACE_NAME.

Windows users should prefer scripts/zapmail_domain_setup.ps1. This Python file
is kept as a cross-platform template and fallback.
"""

from __future__ import annotations

import json
import os
import re
import sys
import time
import urllib.parse
from pathlib import Path
from typing import Any

try:
    import requests
except ImportError:
    print("\nESCALATION NEEDED: Python dependency 'requests' is missing. Install with: python -m pip install requests python-dotenv")
    raise SystemExit(1)

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None

if load_dotenv:
    load_dotenv()


SPACESHIP_BASE = "https://spaceship.dev/api/v1"
DYNADOT_BASE = "https://api.dynadot.com/api3.json"
ZAPMAIL_BASE = "https://api.zapmail.ai/api/v2"

# Nameservers are NOT hardcoded. ClouDNS assigns a (potentially different)
# nameserver set per domain/zone. After connecting a domain in Zapmail, read that
# domain's own metadata.expectedNameservers from GET /domains/connection-requests
# and set exactly those at the registrar. The values below are only a historical
# example of the shape - never use them as a default.
EXAMPLE_NAMESERVERS_DO_NOT_USE = [
    "pns61.cloudns.net",
    "pns62.cloudns.com",
    "pns63.cloudns.net",
    "pns64.cloudns.uk",
]

PREFIXES = [
    "go", "get", "try", "join", "find", "search", "explore", "reach",
    "access", "boost", "team", "send", "email", "connect", "launch",
    "start", "build", "discover", "meet", "use", "hello", "hey", "my",
    "the", "top", "best", "run", "open", "live", "grow", "with", "via",
    "one", "all", "new", "pro",
]

SUFFIXES = [
    "hub", "hq", "online", "today", "direct", "teams", "projects",
    "outreach", "works", "signal", "scope", "flow", "edge", "radar",
    "desk", "global", "core", "base", "systems", "engine", "link",
    "next", "source", "circle", "stack", "zone", "path", "spot", "wave",
    "grid", "point", "shift", "field", "net", "way", "pulse", "vault",
    "peak", "sync", "lab",
]

SCRIPT_DIR = Path(__file__).resolve().parent


def env(name: str, default: str | None = None, required: bool = False) -> str:
    value = os.getenv(name, default)
    if required and not value:
        print(f"\nESCALATION NEEDED: Missing required environment variable: {name}")
        raise SystemExit(1)
    return value or ""


def zapmail_api_key() -> str:
    value = os.getenv("ZAPMAIL_API_KEY") or os.getenv("ZAPMAIL_MCP_API_KEY")
    if not value:
        fail("Missing required environment variable: ZAPMAIL_API_KEY or ZAPMAIL_MCP_API_KEY")
    return value


CLIENT_NAME = env("CLIENT_NAME", "example-client")
BRAND_KEYWORD = env("BRAND_KEYWORD", "acme").lower().replace(" ", "")
TARGET_WORKSPACE_NAME = env("TARGET_ZAPMAIL_WORKSPACE_NAME", required=True)
REGISTRAR = env("REGISTRAR", "spaceship").lower()
DOMAIN_COUNT = int(env("DOMAIN_COUNT", "12"))
INBOXES_PER_DOMAIN = int(env("INBOXES_PER_DOMAIN", "2"))
SENDER_FIRST_NAME = env("SENDER_FIRST_NAME", "Jane")
SENDER_LAST_NAME = env("SENDER_LAST_NAME", "Smith")
USERNAME_SHORT = env("SENDER_USERNAME_SHORT", SENDER_FIRST_NAME.lower())
USERNAME_FULL = env(
    "SENDER_USERNAME_FULL",
    f"{SENDER_FIRST_NAME}{SENDER_LAST_NAME}".lower(),
)
PROVIDER_PLAN = env("PROVIDER_PLAN", "")
EXPORT_APP = env("EXPORT_APP", "EMAILBISON").upper()
SENDING_PLATFORM = env("SENDING_PLATFORM", EXPORT_APP).upper()
RUN_ZAPMAIL_EXPORT = env("RUN_ZAPMAIL_EXPORT", "false").lower() in {"1", "true", "yes"}
TLD = env("TLD", "com").lstrip(".")
MAX_PRICE_USD = float(env("MAX_PRICE_USD", "15"))
DRY_RUN = env("DRY_RUN", "false").lower() in {"1", "true", "yes"}

WORKSPACE_ID = env("ZAPMAIL_WORKSPACE_KEY", "")


def fail(message: str, code: int = 1) -> None:
    print(f"\nESCALATION NEEDED: {message}")
    raise SystemExit(code)


def permission_needed(system: str, action: str) -> None:
    fail(
        f"PERMISSION NEEDED: This action requires admin access to {system}. "
        f"Please log in as admin or provide admin credentials. Needed action: {action}"
    )


def checkpoint(name: str, data: Any) -> None:
    safe_client = re.sub(r"[^a-zA-Z0-9_-]+", "-", CLIENT_NAME.strip()).strip("-").lower()
    path = SCRIPT_DIR / f"{safe_client}_{name}.json"
    path.write_text(json.dumps(data, indent=2, sort_keys=True), encoding="utf-8")
    print(f"Checkpoint saved: {path}")


def request_json(
    method: str,
    url: str,
    *,
    operation: str,
    headers: dict[str, str] | None = None,
    params: dict[str, Any] | None = None,
    payload: Any = None,
    attempts: int = 3,
    timeout: int = 30,
) -> tuple[Any, requests.Response]:
    last_error = ""
    for attempt in range(1, attempts + 1):
        try:
            response = requests.request(
                method,
                url,
                headers=headers,
                params=params,
                json=payload,
                timeout=timeout,
            )
            if response.status_code < 400:
                if response.text.strip():
                    try:
                        return response.json(), response
                    except ValueError:
                        return {"raw": response.text}, response
                return {}, response
            last_error = f"HTTP {response.status_code}: {response.text[:800]}"
        except requests.RequestException as exc:
            last_error = str(exc)
        print(f"{operation} failed attempt {attempt}/{attempts}: {last_error}")
        if attempt < attempts:
            time.sleep(min(5 * attempt, 15))
    fail(f"{operation} failed after {attempts} attempts. Exact error: {last_error}")


def require_config() -> None:
    if INBOXES_PER_DOMAIN != 2:
        fail("This template is locked to 2 inboxes per domain. Change only with explicit approval.")
    google_ranges = env("GOOGLE_DOMAINS", "")
    microsoft_ranges = env("MICROSOFT_DOMAINS", "")
    if not google_ranges and not microsoft_ranges and not PROVIDER_PLAN.strip():
        fail(
            "Missing mailbox mix strategy. Run /mailbox-mix-strategy first, then set "
            "GOOGLE_DOMAINS and MICROSOFT_DOMAINS or an explicit all-GOOGLE/all-MICROSOFT PROVIDER_PLAN."
        )
    if google_ranges or microsoft_ranges:
        for index in range(1, DOMAIN_COUNT + 1):
            assigned = index in parse_ranges(google_ranges) or index in parse_ranges(microsoft_ranges)
            if not assigned:
                fail(
                    f"Mailbox mix ranges do not assign a provider for domain index {index}. "
                    "Fix GOOGLE_DOMAINS/MICROSOFT_DOMAINS from /mailbox-mix-strategy before setup."
                )
    else:
        plan = PROVIDER_PLAN.lower()
        if "all google" not in plan and "all microsoft" not in plan:
            fail(
                "PROVIDER_PLAN must come from /mailbox-mix-strategy. Use explicit "
                "GOOGLE_DOMAINS/MICROSOFT_DOMAINS ranges for mixed setups; do not rely on a first-half default."
            )
    if REGISTRAR not in {"spaceship", "dynadot"}:
        fail("REGISTRAR must be either 'spaceship' or 'dynadot'.")
    zapmail_api_key()
    if REGISTRAR == "spaceship":
        for key in [
            "SPACESHIP_API_KEY",
            "SPACESHIP_API_SECRET",
            "SPACESHIP_REGISTRANT_CONTACT_ID",
            "SPACESHIP_ADMIN_CONTACT_ID",
            "SPACESHIP_TECH_CONTACT_ID",
            "SPACESHIP_BILLING_CONTACT_ID",
        ]:
            env(key, required=True)
    else:
        env("DYNADOT_API_KEY", required=True)


def spaceship_headers() -> dict[str, str]:
    return {
        "X-API-Key": env("SPACESHIP_API_KEY"),
        "X-API-Secret": env("SPACESHIP_API_SECRET"),
        "Content-Type": "application/json",
    }


def zapmail_headers(provider: str | None = None) -> dict[str, str]:
    headers = {
        "x-auth-zapmail": zapmail_api_key(),
        "Content-Type": "application/json",
    }
    if WORKSPACE_ID:
        headers["x-workspace-key"] = WORKSPACE_ID
    if provider:
        headers["x-service-provider"] = provider
    return headers


def generate_candidates() -> list[str]:
    override = env("DOMAIN_CANDIDATES", "")
    if override:
        return [d.strip().lower() for d in override.split(",") if d.strip()]

    candidates: list[str] = []
    for prefix in PREFIXES:
        candidates.append(f"{prefix}{BRAND_KEYWORD}.{TLD}")
    for suffix in SUFFIXES:
        candidates.append(f"{BRAND_KEYWORD}{suffix}.{TLD}")
    for prefix in PREFIXES:
        for suffix in SUFFIXES:
            candidates.append(f"{prefix}{BRAND_KEYWORD}{suffix}.{TLD}")

    seen: set[str] = set()
    clean: list[str] = []
    for domain in candidates:
        sld = domain.split(".", 1)[0]
        if domain in seen or len(sld) > 40:
            continue
        if any(bad in sld for bad in ("mega", "ultra", "grp")):
            continue
        seen.add(domain)
        clean.append(domain)
    return clean


def parse_ranges(value: str) -> set[int]:
    indexes: set[int] = set()
    for part in value.split(","):
        part = part.strip()
        if not part:
            continue
        if "-" in part:
            start, end = [int(x.strip()) for x in part.split("-", 1)]
            indexes.update(range(start, end + 1))
        else:
            indexes.add(int(part))
    return indexes


def provider_for_index(index_one_based: int) -> str:
    google_ranges = env("GOOGLE_DOMAINS", "")
    microsoft_ranges = env("MICROSOFT_DOMAINS", "")
    if google_ranges or microsoft_ranges:
        if index_one_based in parse_ranges(google_ranges):
            return "GOOGLE"
        if index_one_based in parse_ranges(microsoft_ranges):
            return "MICROSOFT"
        fail(f"No provider assigned for domain index {index_one_based}.")

    plan = PROVIDER_PLAN.lower()
    if "all google" in plan:
        return "GOOGLE"
    if "all microsoft" in plan:
        return "MICROSOFT"
    fail(
        f"No explicit provider assigned for domain index {index_one_based}. "
        "Run /mailbox-mix-strategy and set GOOGLE_DOMAINS/MICROSOFT_DOMAINS."
    )


def assign_providers(domains: list[str]) -> dict[str, str]:
    return {domain: provider_for_index(i + 1) for i, domain in enumerate(domains)}


def preflight() -> None:
    print("[Preflight] Checking config and credentials...")
    require_config()

    if REGISTRAR == "spaceship":
        request_json(
            "GET",
            f"{SPACESHIP_BASE}/domains",
            operation="Spaceship credential check",
            headers=spaceship_headers(),
            params={"take": 1, "skip": 0},
        )
    else:
        data, _ = request_json(
            "GET",
            DYNADOT_BASE,
            operation="Dynadot account_info check",
            params={"key": env("DYNADOT_API_KEY"), "command": "account_info"},
        )
        print(f"Dynadot account_info response received: {str(data)[:300]}")

    workspaces, _ = request_json(
        "GET",
        f"{ZAPMAIL_BASE}/workspaces",
        operation="Zapmail workspace check",
        headers=zapmail_headers(),
        params={"page": 1, "limit": 100},
    )
    workspace_items = extract_workspace_items(workspaces)
    target = next(
        (w for w in workspace_items if str(w.get("name", "")).lower() == TARGET_WORKSPACE_NAME.lower()),
        None,
    )
    if not target:
        names = ", ".join(str(w.get("name")) for w in workspace_items[:20])
        fail(
            "Zapmail key cannot prove access to the target workspace. "
            f"Expected '{TARGET_WORKSPACE_NAME}'. Seen: {names}. "
            f"Regenerate the Zapmail MCP Server key from inside {TARGET_WORKSPACE_NAME}, not the root account."
        )

    global WORKSPACE_ID
    WORKSPACE_ID = str(target.get("id") or WORKSPACE_ID)
    print(f"Connected to workspace: {target.get('name')}")
    checkpoint("preflight_workspace", target)

    if RUN_ZAPMAIL_EXPORT:
        accounts, _ = request_json(
            "GET",
            f"{ZAPMAIL_BASE}/exports/accounts/third-party",
            operation=f"Zapmail {EXPORT_APP} linked-account check",
            headers=zapmail_headers(),
            params={"app": EXPORT_APP},
        )
        if not extract_export_accounts(accounts):
            print(
                f"DIAGNOSIS: No linked {EXPORT_APP} account was found in Zapmail. "
                "Browser fallback or manual dashboard linking is needed before export."
            )
    else:
        print(
            "Zapmail export check skipped. RUN_ZAPMAIL_EXPORT is false; "
            f"handoff belongs to {SENDING_PLATFORM}."
        )


def extract_workspace_items(data: Any) -> list[dict[str, Any]]:
    if isinstance(data, dict):
        value = data.get("data", data)
        if isinstance(value, list):
            return [x for x in value if isinstance(x, dict)]
        if isinstance(value, dict):
            for key in ("workspaces", "items", "data"):
                if isinstance(value.get(key), list):
                    return [x for x in value[key] if isinstance(x, dict)]
    return []


def extract_export_accounts(data: Any) -> list[dict[str, Any]]:
    if isinstance(data, dict):
        value = data.get("data", data)
        if isinstance(value, dict) and isinstance(value.get("accounts"), list):
            return [x for x in value["accounts"] if isinstance(x, dict)]
        if isinstance(value, list):
            return [x for x in value if isinstance(x, dict)]
    return []


def extract_domains(data: Any) -> list[dict[str, Any]]:
    if isinstance(data, list):
        return [x for x in data if isinstance(x, dict)]
    if isinstance(data, dict):
        value = data.get("data", data)
        if isinstance(value, list):
            return [x for x in value if isinstance(x, dict)]
        if isinstance(value, dict):
            for key in ("domains", "items", "data"):
                if isinstance(value.get(key), list):
                    return [x for x in value[key] if isinstance(x, dict)]
    return []


def domain_name(item: dict[str, Any]) -> str:
    return str(item.get("domain") or item.get("domainName") or item.get("name") or "").lower()


def domain_id(item: dict[str, Any]) -> str:
    return str(item.get("id") or item.get("uuid") or "")


def check_availability(candidates: list[str]) -> list[dict[str, Any]]:
    if REGISTRAR == "spaceship":
        return spaceship_availability(candidates)
    return dynadot_availability(candidates)


def spaceship_availability(candidates: list[str]) -> list[dict[str, Any]]:
    available: list[dict[str, Any]] = []
    for i in range(0, len(candidates), 20):
        batch = candidates[i : i + 20]
        data, _ = request_json(
            "POST",
            f"{SPACESHIP_BASE}/domains/available",
            operation="Spaceship availability check",
            headers=spaceship_headers(),
            payload={"domains": batch},
        )
        for item in data.get("domains", []):
            if item.get("result") != "available":
                continue
            price = 10.99
            for price_item in item.get("premiumPricing", []):
                if price_item.get("operation") == "register":
                    price = float(price_item.get("price") or price)
            if price <= MAX_PRICE_USD:
                available.append({"domain": item["domain"], "price": price})
        if len(available) >= DOMAIN_COUNT:
            break
    return available[:DOMAIN_COUNT]


def dynadot_availability(candidates: list[str]) -> list[dict[str, Any]]:
    available: list[dict[str, Any]] = []
    for i in range(0, len(candidates), 100):
        batch = candidates[i : i + 100]
        params: dict[str, Any] = {
            "key": env("DYNADOT_API_KEY"),
            "command": "search",
            "show_price": "1",
            "currency": "USD",
        }
        for idx, domain in enumerate(batch):
            params[f"domain{idx}"] = domain
        data, _ = request_json("GET", DYNADOT_BASE, operation="Dynadot availability check", params=params)
        results = (
            data.get("SearchResponse", {}).get("SearchResults", [])
            if isinstance(data, dict)
            else []
        )
        for item in results:
            if str(item.get("Available", "")).lower() != "yes":
                continue
            price = float(str(item.get("Price", "11")).replace("$", "") or 11)
            if price <= MAX_PRICE_USD:
                available.append({"domain": item.get("DomainName"), "price": price})
        if len(available) >= DOMAIN_COUNT:
            break
    return available[:DOMAIN_COUNT]


def confirm_balance(selected: list[dict[str, Any]]) -> None:
    total = sum(float(item.get("price") or 11) for item in selected)
    fallback_estimate = DOMAIN_COUNT * 11
    estimate = total if total > 0 else fallback_estimate
    print("\nSelected domains:")
    for item in selected:
        print(f"  {item['domain']}  ${float(item.get('price') or 11):.2f}")
    print(f"Estimated registrar cost: ${estimate:.2f}")
    answer = input(f"Have you topped up at least ${estimate:.2f} in {REGISTRAR.title()}? Type YES to continue: ")
    if answer.strip() != "YES":
        fail(f"Purchase stopped. Top up {REGISTRAR.title()} before proceeding.", code=0)


def purchase_domains(selected: list[dict[str, Any]]) -> list[str]:
    if DRY_RUN:
        domains = [item["domain"] for item in selected]
        print(f"DRY_RUN enabled. Would purchase: {domains}")
        return domains
    if REGISTRAR == "spaceship":
        return purchase_spaceship(selected)
    return purchase_dynadot(selected)


def purchase_spaceship(selected: list[dict[str, Any]]) -> list[str]:
    contacts = {
        "registrant": env("SPACESHIP_REGISTRANT_CONTACT_ID"),
        "admin": env("SPACESHIP_ADMIN_CONTACT_ID"),
        "tech": env("SPACESHIP_TECH_CONTACT_ID"),
        "billing": env("SPACESHIP_BILLING_CONTACT_ID"),
    }
    purchased: list[str] = []
    for item in selected:
        domain = item["domain"]
        _, response = request_json(
            "POST",
            f"{SPACESHIP_BASE}/domains/{domain}",
            operation=f"Spaceship purchase {domain}",
            headers=spaceship_headers(),
            payload={
                "autoRenew": False,
                "years": 1,
                "privacyProtection": {"level": "high", "userConsent": True},
                "contacts": contacts,
            },
        )
        operation_id = response.headers.get("spaceship-async-operationid")
        if operation_id:
            poll_spaceship_async(operation_id, domain)
        purchased.append(domain)
        checkpoint("purchased_domains", purchased)
    return purchased


def poll_spaceship_async(operation_id: str, domain: str, timeout_min: int = 10) -> None:
    deadline = time.time() + timeout_min * 60
    while time.time() < deadline:
        data, _ = request_json(
            "GET",
            f"{SPACESHIP_BASE}/async-operations/{operation_id}",
            operation=f"Spaceship async poll {domain}",
            headers=spaceship_headers(),
        )
        status = data.get("status")
        if status == "success":
            print(f"Registered: {domain}")
            return
        if status == "failed":
            fail(f"Spaceship purchase failed for {domain}: {data.get('details')}")
        print(f"Spaceship still processing {domain}: {status}")
        time.sleep(5)
    fail(f"Spaceship purchase took longer than expected for {domain}. Operation ID: {operation_id}")


def purchase_dynadot(selected: list[dict[str, Any]]) -> list[str]:
    purchased: list[str] = []
    for item in selected:
        domain = item["domain"]
        data, _ = request_json(
            "GET",
            DYNADOT_BASE,
            operation=f"Dynadot purchase {domain}",
            params={
                "key": env("DYNADOT_API_KEY"),
                "command": "register",
                "domain": domain,
                "duration": 1,
            },
        )
        text = json.dumps(data).lower()
        if "success" not in text and "responsecode\": 0" not in text.replace(" ", ""):
            fail(f"Dynadot purchase response did not look successful for {domain}: {data}")
        purchased.append(domain)
        checkpoint("purchased_domains", purchased)
        time.sleep(1)
    return purchased


def get_expected_nameservers(domains: list[str], timeout_min: int = 15) -> dict[str, list[str]]:
    """Poll Zapmail connection requests until each domain exposes its own
    metadata.expectedNameservers (set once a domain reaches CHECKING_NS_IN_WHOIS).
    Returns {domain: [nameservers]} read PER DOMAIN - never shared or guessed."""
    if DRY_RUN:
        print(f"DRY_RUN enabled. Would read per-domain expected nameservers for: {domains}")
        return {d: list(EXAMPLE_NAMESERVERS_DO_NOT_USE) for d in domains}
    wanted = {d.lower() for d in domains}
    found: dict[str, list[str]] = {}
    deadline = time.time() + timeout_min * 60
    while time.time() < deadline and len(found) < len(wanted):
        data, _ = request_json(
            "GET",
            f"{ZAPMAIL_BASE}/domains/connection-requests",
            operation="Zapmail connection requests (per-domain expected nameservers)",
            headers=zapmail_headers(),
            params={"page": 1, "limit": 100},
        )
        rows = data.get("data", {}).get("data", []) if isinstance(data, dict) else []
        for row in rows:
            name = (row.get("domainName") or "").lower()
            meta = row.get("metadata") or {}
            expected = meta.get("expectedNameservers") if isinstance(meta, dict) else None
            if name in wanted and expected and name not in found:
                found[name] = expected
                print(f"  {name}: expected nameservers = {expected}")
        if len(found) < len(wanted):
            time.sleep(20)
    missing = sorted(wanted - set(found))
    if missing:
        fail(
            "Could not read expected nameservers for: "
            f"{missing}. These domains have not reached CHECKING_NS_IN_WHOIS yet. "
            "Do NOT guess or copy another domain's nameservers - re-run once they advance."
        )
    return found


def switch_nameservers(expected_by_domain: dict[str, list[str]]) -> None:
    """Set each domain's OWN expected nameservers. Never share one set across domains."""
    if DRY_RUN:
        print(f"DRY_RUN enabled. Would switch nameservers per-domain: {expected_by_domain}")
        return
    for domain, hosts in expected_by_domain.items():
        if not hosts:
            fail(f"No expected nameservers resolved for {domain}; refusing to guess.")
        if REGISTRAR == "spaceship":
            request_json(
                "PUT",
                f"{SPACESHIP_BASE}/domains/{domain}/nameservers",
                operation=f"Spaceship nameserver update {domain}",
                headers=spaceship_headers(),
                payload={"provider": "custom", "hosts": hosts},
            )
        else:
            params = {
                "key": env("DYNADOT_API_KEY"),
                "command": "set_ns",
                "domain": domain,  # one domain per call - no shared batch nameservers
            }
            for idx, host in enumerate(hosts):
                params[f"ns{idx}"] = host
            url = f"{DYNADOT_BASE}?{urllib.parse.urlencode(params, safe=',')}"
            request_json("GET", url, operation=f"Dynadot nameserver update {domain}")
    checkpoint("nameserver_updates", {"expected_by_domain": expected_by_domain})


def connect_domains(domains_by_provider: dict[str, list[str]]) -> None:
    for provider, domains in domains_by_provider.items():
        for i in range(0, len(domains), 50):
            batch = domains[i : i + 50]
            if DRY_RUN:
                print(f"DRY_RUN enabled. Would connect {batch} as {provider}")
                continue
            request_json(
                "POST",
                f"{ZAPMAIL_BASE}/domains/connect-domain",
                operation=f"Zapmail connect domains as {provider}",
                headers=zapmail_headers(provider),
                payload={"domainNames": batch},
            )
    checkpoint("zapmail_connected_domains", domains_by_provider)


def list_zapmail_domains(provider: str | None = None) -> list[dict[str, Any]]:
    data, _ = request_json(
        "GET",
        f"{ZAPMAIL_BASE}/domains",
        operation="Zapmail list all domains",
        headers=zapmail_headers(provider),
        params={"page": 1, "limit": 100},
    )
    return extract_domains(data)


def verify_domains_in_workspace(domains: list[str]) -> None:
    seen: dict[str, dict[str, Any]] = {}
    for provider in ("GOOGLE", "MICROSOFT"):
        for item in list_zapmail_domains(provider):
            name = domain_name(item)
            if name:
                seen[name] = item
    missing = [domain for domain in domains if domain.lower() not in seen]
    if missing:
        print(f"DIAGNOSIS: Domains missing from target workspace: {missing}")
        fail(
            "Domains are not in this workspace. This means the API key is scoped to a different workspace. "
            f"Stop, switch to {TARGET_WORKSPACE_NAME}, regenerate the MCP key, and re-run."
        )


def get_assignable(provider: str | None = None) -> list[dict[str, Any]]:
    data, _ = request_json(
        "GET",
        f"{ZAPMAIL_BASE}/domains/assignable",
        operation="Zapmail assignable poll",
        headers=zapmail_headers(provider),
        params={"page": 1, "limit": 100},
    )
    return extract_domains(data)


def diagnose_assignable_zero(domains: list[str]) -> None:
    print("\nDIAGNOSIS: Assignable count is still 0 after 10 minutes.")
    all_items: dict[str, dict[str, Any]] = {}
    for provider in ("GOOGLE", "MICROSOFT"):
        for item in list_zapmail_domains(provider):
            name = domain_name(item)
            if name:
                all_items[name] = item
    missing = [domain for domain in domains if domain.lower() not in all_items]
    if missing:
        fail(
            "Domains are not in this workspace. This means the API key is scoped to a different workspace. "
            f"Missing domains: {missing}. Switch to {TARGET_WORKSPACE_NAME}, regenerate the MCP key, and re-run."
        )
    for domain in domains:
        item = all_items[domain.lower()]
        print(f"  {domain}: status={item.get('status')} assignedMailboxesCount={item.get('assignedMailboxesCount')}")


def wait_for_assignable(domains: list[str], timeout_min: int = 90) -> dict[str, str]:
    deadline = time.time() + timeout_min * 60
    first_poll = time.time()
    diagnosed_zero = False
    assigned: dict[str, str] = {}
    target = max(1, int(len(domains) * 0.95))
    while time.time() < deadline:
        for provider in ("GOOGLE", "MICROSOFT"):
            for item in get_assignable(provider):
                name = domain_name(item)
                if name in {d.lower() for d in domains}:
                    assigned[name] = domain_id(item)
        print(f"Assignable: {len(assigned)}/{len(domains)}")
        if len(assigned) >= target:
            checkpoint("domain_uuids", assigned)
            return assigned
        if len(assigned) == 0 and not diagnosed_zero and time.time() - first_poll >= 10 * 60:
            diagnose_assignable_zero(domains)
            diagnosed_zero = True
        time.sleep(2 * 60)
    fail(f"Zapmail assignable polling exceeded {timeout_min} minutes. Assigned: {assigned}")


def create_inboxes(domain_ids: dict[str, str], providers: dict[str, str]) -> None:
    domains_by_provider: dict[str, list[tuple[str, str]]] = {"GOOGLE": [], "MICROSOFT": []}
    for domain, uuid in domain_ids.items():
        domains_by_provider[providers[domain]].append((domain, uuid))

    for provider, items in domains_by_provider.items():
        for i in range(0, len(items), 25):
            batch = items[i : i + 25]
            payload = {uuid: mailbox_payload(domain) for domain, uuid in batch}
            if DRY_RUN:
                print(f"DRY_RUN enabled. Would create inboxes for {len(batch)} {provider} domains")
                continue
            try:
                request_json(
                    "POST",
                    f"{ZAPMAIL_BASE}/mailboxes",
                    operation=f"Zapmail create mailbox batch {provider}",
                    headers=zapmail_headers(provider),
                    payload=payload,
                )
            except SystemExit:
                print(f"Batch failed for {provider}; retrying one domain at a time.")
                for domain, uuid in batch:
                    request_json(
                        "POST",
                        f"{ZAPMAIL_BASE}/mailboxes",
                        operation=f"Zapmail create mailbox retry {domain}",
                        headers=zapmail_headers(provider),
                        payload={uuid: mailbox_payload(domain)},
                    )
    checkpoint("mailbox_creation_requested", {"domains": list(domain_ids)})


def mailbox_payload(domain: str) -> list[dict[str, str]]:
    return [
        {
            "firstName": SENDER_FIRST_NAME,
            "lastName": SENDER_LAST_NAME,
            "mailboxUsername": USERNAME_SHORT,
            "domainName": domain,
        },
        {
            "firstName": SENDER_FIRST_NAME,
            "lastName": SENDER_LAST_NAME,
            "mailboxUsername": USERNAME_FULL,
            "domainName": domain,
        },
    ]


def list_mailboxes(provider: str | None = None) -> list[dict[str, Any]]:
    data, _ = request_json(
        "GET",
        f"{ZAPMAIL_BASE}/mailboxes",
        operation="Zapmail mailbox status poll",
        headers=zapmail_headers(provider),
        params={"page": 1, "limit": 100, "contains": USERNAME_SHORT},
    )
    value = data.get("data", data) if isinstance(data, dict) else data
    if isinstance(value, dict):
        for key in ("mailboxes", "items", "data"):
            if isinstance(value.get(key), list):
                return [x for x in value[key] if isinstance(x, dict)]
    if isinstance(value, list):
        return [x for x in value if isinstance(x, dict)]
    return []


def wait_for_active_mailboxes(domains: list[str], timeout_min: int = 720) -> None:
    expected = len(domains) * INBOXES_PER_DOMAIN
    deadline = time.time() + timeout_min * 60
    while time.time() < deadline:
        all_mailboxes = list_mailboxes("GOOGLE") + list_mailboxes("MICROSOFT")
        matching = [
            m for m in all_mailboxes
            if any(str(m.get("email", "")).lower().endswith(f"@{d.lower()}") for d in domains)
        ]
        active = [m for m in matching if str(m.get("status", "")).upper() == "ACTIVE"]
        print(f"Active mailboxes: {len(active)}/{expected}")
        if len(active) >= expected:
            checkpoint("active_mailboxes", active)
            return
        if matching:
            for item in matching[:10]:
                print(f"  {item.get('email')}: {item.get('status')}")
        time.sleep(10 * 60)
    fail(f"Mailbox activation exceeded {timeout_min} minutes. Export blocked.")


def export_mailboxes() -> None:
    if DRY_RUN:
        print(f"DRY_RUN enabled. Would export ACTIVE inboxes to {EXPORT_APP}.")
        return
    data, _ = request_json(
        "POST",
        f"{ZAPMAIL_BASE}/exports/mailboxes",
        operation=f"Zapmail export to {EXPORT_APP}",
        headers=zapmail_headers(),
        payload={
            "apps": [EXPORT_APP],
            "ids": [],
            "excludeIds": [],
            "tagIds": [],
            "contains": USERNAME_SHORT,
            "status": "ACTIVE",
        },
    )
    checkpoint("export_response", data)


def main() -> None:
    preflight()
    candidates = generate_candidates()
    selected = check_availability(candidates)
    if len(selected) < DOMAIN_COUNT:
        fail(f"Only {len(selected)} domains available, but DOMAIN_COUNT is {DOMAIN_COUNT}.")

    confirm_balance(selected)
    purchased = purchase_domains(selected)
    providers = assign_providers(purchased)
    checkpoint("provider_plan", providers)

    # Connect in Zapmail FIRST - Zapmail only reveals each domain's correct
    # nameservers after connect. Then read per-domain expected nameservers and
    # set each domain's own set. Never hardcode or share one nameserver set.
    grouped: dict[str, list[str]] = {"GOOGLE": [], "MICROSOFT": []}
    for domain, provider in providers.items():
        grouped[provider].append(domain)
    connect_domains(grouped)
    expected_by_domain = get_expected_nameservers(purchased)
    switch_nameservers(expected_by_domain)
    verify_domains_in_workspace(purchased)

    raw_domain_ids = wait_for_assignable(purchased)
    # Normalize keys back to the selected domain spelling.
    domain_ids = {domain: raw_domain_ids[domain.lower()] for domain in purchased if domain.lower() in raw_domain_ids}
    created_domains = list(domain_ids.keys())
    create_inboxes(domain_ids, providers)
    wait_for_active_mailboxes(created_domains)
    print()
    if RUN_ZAPMAIL_EXPORT:
        export_mailboxes()
        print(f"Setup complete. Confirm exported senders in {EXPORT_APP} and start warmup.")
    else:
        print("Zapmail provisioning complete. Export/import was not run.")
        print(
            f"Next: import or connect ACTIVE inboxes in {SENDING_PLATFORM}, "
            "start warmup, apply signatures, tag insurance, then log tracker."
        )
    print("Wait 2 weeks before sending real campaigns.")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        fail("Interrupted by user.", code=130)
