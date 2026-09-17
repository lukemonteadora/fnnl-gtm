---
name: dynadot-zapmail-domain-setup
description: "Public guide: Configure a client-agnostic Dynadot + Zapmail cold email infrastructure run with workspace-verified Zapmail keys, balance confirmation, domain purchase, nameserver update, provider-aware mailbox creation, browser fallback, and provider-locked handoff. Use when setting up cold email domains and 2 inboxes per domain through Dynadot and Zapmail."
---

# Cold Email Domain Setup: Dynadot + Zapmail

> ⚠️ **Read `coldoutbound-gotchas.md` before you start** — field-tested dead ends already paid for. Most-bitten on Zapmail:
> - Mailbox **capacity must be PURCHASED before** `assign_new_mailboxes_to_domains` (else "you don't have any mailboxes… purchase mailboxes" error). There is **NO purchase API** (`purchase_add_on_mailboxes` → "fetch failed") — buy in the Zapmail **UI** (Buy Mailboxes → qty → Pay using **Wallet**, not Stripe; **Microsoft = $3/mo Monthly**, same as Google).
> - `list_domains` returns **GOOGLE-only** even under MICROSOFT context — use `list_assignable_domains` w/ `serviceProvider:MICROSOFT`.
> - **App passwords lag** (2nd inbox per domain) and can **ROTATE on re-provision** (silently breaking a live Smartlead connection). Wait for `appPassword`; re-export stragglers/rotations. Mailboxes stay ACTIVE; nothing is lost.

Use this skill only when locked `run_state.infrastructure_stack = dynadot_zapmail`, `run_state.registrar = Dynadot`, and `run_state.mailbox_provider = Zapmail`, unless the user explicitly changes providers.

This is the Dynadot registrar path for the same Zapmail safety model used by the Spaceship workflow: prove workspace first, confirm registrar balance before purchase, create 2 inboxes per domain, and never wait silently.

## Material Decision Rule

When this skill reaches a material fork, name the realistic options, recommend the strongest path, and explain why the main alternatives are weaker before committing.

Ask before choices that affect spend, provider routing, source of truth, list quality, campaign direction, client-facing output, live systems, scraping or account risk, or legal/compliance risk. For low-risk reversible choices, state the recommendation and proceed.

Do not turn failed or unsafe paths into user-facing options. If this skill's QA rules or stop gates reject a path, filter it out and explain the blocker only when useful.

When asking the user, use the Claude Desktop native Interactive Inputs / Choice Prompts pattern from /clarification-first: recommended option first, short choices, and Custom answer last when a custom answer is plausible.

## Interaction Policy

Defers to `/autonomous-execution-policy`. Under `run_state.execution_mode = auto_execute` (the operator's default), run this setup **hands-free**: generate the domain list, buy domains + mailbox capacity, assign inboxes, and poll — without per-step asks — using the saved persona, mailbox mix, and `billing = Monthly` from `run_state`/memory (never re-ask them). Confirm the spend ceiling ONCE at run start, then auto-approve domain + capacity purchases within it (buy from a funded wallet/saved method; report each charge). Stop only for the policy's hard-stops — chiefly **funding** (entering card details / adding a card / enabling auto-recharge is the operator's action) and spend over the ceiling. On provisioning/propagation waits, background-poll and move to other work — never idle.

---

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short — record status, not raw output. Full protocol: `client-activity-log.md`.

## Mailbox Mix Hard Gate

Before any availability check, domain purchase, inbox purchase, provider setup, or spend approval, check `run_state.mailbox_mix_strategy`.

- If it exists, use the saved Google Workspace / Microsoft 365 purchase mix.
- If it is missing, stop and run `/mailbox-mix-strategy` before continuing. That skill owns the direct-start question (ICP-size guess / balanced default / manual override), the guess-vs-evidence wording, and the `INBOXES_PER_DOMAIN=2` rule.

Do not silently default to first-half Google and second-half Microsoft for a live setup.

---

## Run Variables

```bash
CLIENT_NAME=Acme
BRAND_KEYWORD=acme
TARGET_ZAPMAIL_WORKSPACE_NAME=Acme
REGISTRAR=dynadot
DOMAIN_COUNT=12
INBOXES_PER_DOMAIN=2
SENDER_FIRST_NAME=Jane         # PLACEHOLDER — replace with the client's chosen persona. See "Sender persona" below. Never ship Jane Smith.
SENDER_LAST_NAME=Smith         # A real-looking human name, never a company word or role (no "Team", "Info", "Sales").
PROVIDER_PLAN=<required from run_state.mailbox_mix_strategy>
SENDING_PLATFORM=EMAILBISON
```

### Sender persona (do this before any inbox is created)

One realistic human persona per client by default. Pick (or generate) a single real-looking
full name and use it consistently across **every domain, every inbox, and every inbox provider**
(Zapmail and Primeforge alike). Each domain still gets two inboxes — `{firstname}@domain` and
`{firstnamelastname}@domain` — but both belong to that same one person.

- If the client provided sender name(s), use exactly those. Otherwise generate one realistic name
  (Zapmail's `generate_name_pairs` is fine) and treat it as the locked persona.
- **Never** use a generic/role mailbox as the sender: no `team@`, `info@`, `hello@`, `sales@`,
  `admin@`, and never a display name like "{Company} Team". Those read as a company alias, not a
  person, and kill cold-email trust.
- **Record the chosen persona in the client profile** under `run_state.sender_personas` so every
  rerun reuses it and can never silently fall back to a placeholder. If the profile has no recorded
  persona, generate one and write it back before creating inboxes.

**HARD RULE — generate the profile assets the moment the persona name is locked, BEFORE any inbox is
created.** As soon as the persona name is set, run `/mailbox-profile-generator` to produce, in this
order: (1) the OpenAI realistic headshot, (2) the downloaded company logo, (3) the headshot↔logo
crossfade GIF. One shared headshot + one shared GIF for the whole client (one persona = identical file
on every mailbox). **Zapmail supports animated GIF profile pictures** (confirmed in the Zapmail UI,
2026-06-06), so use the shared crossfade **GIF** on Zapmail just like Primeforge. Do **not** start
creating inboxes until these assets exist — they get applied at the provider before export.

Provider plan options:

- explicit ranges from `/mailbox-mix-strategy`, for example `GOOGLE_DOMAINS=1-4` and `MICROSOFT_DOMAINS=5-12`
- `all GOOGLE`, only when the saved strategy or manual override says to buy only Google Workspace mailboxes
- `all MICROSOFT`, only when the saved strategy or manual override says to buy only Microsoft 365 mailboxes

Keep `INBOXES_PER_DOMAIN=2` unless the user explicitly changes the operating model.

---

## Required Credentials

### Dynadot

1. Log into Dynadot.
2. Go to Tools > API.
3. Enable API access.
4. Whitelist your current IP address.
5. Store:

```bash
DYNADOT_API_KEY=...
```

### Zapmail

Use the Zapmail MCP Server key generated inside the target client workspace, not the root or admin workspace.

```bash
ZAPMAIL_API_KEY=...
TARGET_ZAPMAIL_WORKSPACE_NAME=Acme
```

Using the root workspace key can silently route domains to the wrong workspace. That is the stupid failure this guide is built to prevent.

### API vs MCP vs Browser

Do not confuse the key source with the execution path. The default automation path is direct Zapmail REST API calls from PowerShell or Python. The Zapmail MCP package is only a wrapper around the same API surface, and the MCP Server key is the API key source. A live MCP tool is not required to create inboxes.

`x-api-key` is the wrong auth header for Zapmail API calls. If that header returns `401 Invalid API key`, the fix is not browser automation. Use `x-auth-zapmail`.

Zapmail REST headers used by the scripts:

```http
x-auth-zapmail: <ZAPMAIL_API_KEY>
x-workspace-key: <workspace-id>
x-service-provider: GOOGLE|MICROSOFT
```

Use `x-workspace-key` when operating outside the primary workspace or when routing into a known client workspace. Use `x-service-provider` on provider-aware domain and mailbox calls.

---

## Step 0: Preflight Questionnaire

Collect every answer before any availability check or purchase. If any required value is missing, stop.

```text
1. Brand keyword for domain generation, for example "acme".
2. Number of domains needed. Default: 12.
3. Sender persona — one realistic human full name per client (client-provided, or generated and recorded in `run_state.sender_personas`). Reuse it across every domain/inbox/provider. Default inboxes are {firstname}@domain and {firstnamelastname}@domain. Never a generic/role mailbox (team@, info@, hello@) or a "{Company} Team" display name. See "Sender persona" above.
4. Google/Microsoft split from `run_state.mailbox_mix_strategy`. If missing, stop and run `/mailbox-mix-strategy` first.
5. Confirm registrar is Dynadot.
6. Dynadot API key and confirmation that the current IP is whitelisted.
7. Zapmail API key generated inside the target client workspace.
8. Zapmail workspace or sub-workspace ID for `x-workspace-key`, if applicable.
9. Target sending platform from locked `run_state.sending_platform`: EmailBison, Smartlead, Instantly, or other.
10. If EmailBison: whitelabel instance URL and whether the Developer API token is ready. Do not export here.
11. Max price per domain. Default: $15.
12. Confirm that the agent must show the final domain list and cost estimate before purchasing.
```

Default values are allowed only when the user accepts them. Do not proceed to purchase until the selected domain list, per-domain prices, and total estimated cost are shown and the user gives explicit purchase approval.

---

## Mandatory Preflight

1. Verify Dynadot access and balance:

```http
GET https://api.dynadot.com/api3.json?key=<DYNADOT_API_KEY>&command=account_info
```

2. Verify Zapmail workspace:

```http
GET https://api.zapmail.ai/api/v2/workspaces?page=1&limit=100
```

Print:

```text
Connected to workspace: <workspace name>
```

If it does not match `TARGET_ZAPMAIL_WORKSPACE_NAME`, stop and regenerate the Zapmail MCP Server key from inside the correct workspace.

3. Confirm the sending-platform handoff path from `run_state.sending_platform`. Do not verify or export to EmailBison in this skill; `/emailbison-inbox-manager` owns that handoff.

---

## Balance Gate

Dynadot exposes wallet balance through `account_info`, but still ask for an explicit purchase gate because this step spends money.

After availability returns prices, calculate the total and ask:

```text
Dynadot balance approval needed.

A. [Recommended] Review balance and final cost before buying
B. Balance is topped up and I approve up to $<estimated_total>
C. Stop before purchase
D. Custom answer
```

If the user does not choose the explicit approval option, stop before purchase.

---

## Workflow

### 1. Generate Domain Candidates

Use the same brand-based naming strategy as the Spaceship path.

Tier 1:

```text
go{brand}.com       try{brand}.com      get{brand}.com
my{brand}.com       the{brand}.com      hey{brand}.com
use{brand}.com      run{brand}.com      one{brand}.com
```

Tier 2:

```text
{brand}hq.com       {brand}hub.com      {brand}now.com
{brand}app.com      {brand}pro.com      {brand}lab.com
{brand}ai.com       {brand}co.com       {brand}go.com
```

Tier 3:

```text
go{brand}hq.com     try{brand}hub.com   get{brand}pro.com
```

Full prefix list:

```text
go, get, try, join, find, search, explore, reach, access, boost,
team, send, email, connect, launch, start, build, discover, meet,
use, hello, hey, my, the, top, best, run, open, live, grow,
with, via, one, all, new, pro
```

Full suffix list:

```text
hub, hq, online, today, direct, teams, projects, outreach, works,
signal, scope, flow, edge, radar, desk, global, core, base, systems,
engine, link, next, source, circle, stack, zone, path, spot, wave,
grid, point, shift, field, net, way, pulse, vault, peak, sync, lab
```

### 2. Check Availability

Dynadot search supports up to 100 domains per request:

```http
GET https://api.dynadot.com/api3.json?key=<key>&command=search&show_price=1&currency=USD&domain0=goacme.com
```

Filter to available domains under the price cap.

### 3. Confirm Balance And Purchase

Show selected domains, prices, total, and the top-up question. Only proceed after exact `YES`.

Register one domain per request:

```http
GET https://api.dynadot.com/api3.json?key=<key>&command=register&domain=goacme.com&duration=1
```

Save the purchased list immediately.

### 4. Connect Domains In Zapmail (BEFORE touching nameservers)

Connect first. Zapmail only reveals the correct nameservers for a domain *after* it is connected, so nameservers must never be set before this step.

Group domains by provider and call:

```http
POST https://api.zapmail.ai/api/v2/domains/connect-domain
x-auth-zapmail: <ZAPMAIL_API_KEY>
x-workspace-key: <workspace-id>
x-service-provider: GOOGLE|MICROSOFT
```

Then verify each domain exists in the target workspace using `GET /api/v2/domains`.

### 5. Read Each Domain's Expected Nameservers, Then Switch Per-Domain

**Never hardcode nameservers. Never apply one shared NS set across a batch.** ClouDNS routinely assigns a *different* nameserver set per domain/zone. Read each domain's own expected nameservers from its Zapmail connection request and set exactly those.

```http
GET https://api.zapmail.ai/api/v2/domains/connection-requests?page=1&limit=100
x-auth-zapmail: <ZAPMAIL_API_KEY>
x-workspace-key: <workspace-id>
```

Once a domain reaches `CHECKING_NS_IN_WHOIS`, its `metadata.expectedNameservers` lists that domain's nameservers. Set them **one domain per `set_ns` call** with that domain's own values — do NOT batch multiple domains into a single `set_ns` with shared `ns0..ns3`:

```http
GET https://api.dynadot.com/api3.json?key=<key>&command=set_ns&domain=goacme.com&ns0=<expected[0]>&ns1=<expected[1]>&ns2=<expected[2]>&ns3=<expected[3]>
```

Do not encode commas as `%2C`. In Python use `urlencode(params, safe=",")`.

Rules:
- If a domain's metadata is still `null` (not yet at `CHECKING_NS_IN_WHOIS`), wait and re-poll that domain — never borrow another domain's nameservers as a guess.
- A domain only flips to `SUCCESS`/`ACTIVE` when WHOIS nameservers match what Zapmail expected for THAT domain. Treat any domain stuck at `CHECKING_NS_IN_WHOIS` as a per-domain nameserver mismatch and re-check its expected set. Do not use a fixed 20-minute wait.
- Within one ClouDNS-backed workspace the expected set is often identical across domains, but it is not guaranteed — verify per domain.

### 6. Poll Assignable With Diagnostics

Poll `GET /api/v2/domains/assignable` every 2 minutes. Proceed when at least 95% are assignable.

If assignable count stays `0` after 10 minutes:

- call `GET /api/v2/domains`
- if domains are missing, diagnose wrong workspace/key
- if domains exist, print exact statuses

Never poll silently past 10 minutes of zero progress.

## ⚡ Zapmail Mailbox Phase — Confirmed Path & Dead Ends (READ FIRST, save hours)

Hard-won on a live client run (2026-06-06). Follow the confirmed path; do **not** re-test the dead ends — each one cost real time.

**✅ CONFIRMED WORKING PATH (mailbox capacity → ACTIVE):**
1. **Buy capacity per provider** — `mcp__zapmail__purchase_add_on_mailboxes…`, body `{ "quantity": <n> }`, `serviceProvider` = `GOOGLE`/`MICROSOFT`, `workspaceKey` = client workspace. Wallet-funded, **Monthly** (don't ask). (Dashboard `/mailboxes/purchase` is the saved-card alternative.)
2. **Wait until capacity is API-visible** — `mcp__zapmail__retrieve_all_mailboxes…` (per provider) shows `availableMailboxes ≥ n`. Dashboard buys lag minutes→~a day; API buys are immediate. Don't assign before this.
3. **Assign in batches of ≤3 domains** — `mcp__zapmail__assign_new_mailboxes_to_domains…`, `serviceProvider` + `workspaceKey`, body keyed by `domainId` → list of `{domainName, mailboxUsername, firstName, lastName}` (2 per domain). Returns `"Mailboxes will be assigned shortly"` + ids.
4. **Poll to ACTIVE** — `retrieve_all_mailboxes` until `IN_PROGRESS → ACTIVE` (don't idle-wait; background-poll + do other work). ACTIVE exposes SMTP/app-password creds.
5. **Apply persona photo → export to Smartlead** (only once ACTIVE).

**❌ DEAD ENDS — DO NOT RETRY:**
- **`POST /api/v2/mailboxes` (legacy "create", via call_endpoint) to assign** → `400 "you don't have any mailboxes…"`. It is NOT the assign endpoint and never consumes pre-purchased capacity. Use `assign_new_mailboxes_to_domains`.
- **`mailboxData: [...]` array body** → 500/422. Correct shape is the **domainId-keyed object**; the username field is **`mailboxUsername`** (not `username`).
- **Assigning before capacity is API-visible** → the same `400 "no mailboxes"`. This is the sync lag, NOT a body bug — do not permute the payload; wait for `availableMailboxes > 0`.
- **One big assign payload (e.g. 18 mailboxes / 9 domains)** → `fetch failed` timeout. Split into ≤3-domain (≤6-mailbox) batches.
- **Driving the Zapmail dashboard via the Chrome extension** → the SPA never reaches `document_idle`; clicks/types/screenshots hang ~45s then fail (~6 in a row). Do not automate the Zapmail UI — use the MCP action tools. (UI is a last-resort human-only fallback.)
- **`file_upload` of an agent-generated CSV** (for dashboard Bulk Upload) → rejected: only user-shared files upload. Don't build that path.
- **Double-buying capacity via API to "fix" dashboard-bought invisibility** → wasteful; it becomes visible after the sync lag. Wait, don't re-buy.
- **Enabling auto-recharge / adding a card to fund the wallet** → not the agent's action (card entry + standing config). If the wallet is short and no card is saved, STOP and hand to the operator with the exact shortfall.
- **Trusting `domains/assignable` or `connection-requests` default listings** → buggy pagination + unreliable provider filter (returns only one provider's batch, counts contradict). Pass `search=`/`domainName=` to force all records and match by `domainName`. Trust `status:"ACTIVE"` in `/domains` over the `assignable` count.
- **Trusting a cached wallet reading** → the legacy `wallet_balance` MCP returned a stale `$67` when the real balance was `$49`. `clear_cache` first, or use `get_wallet_balance` / the dashboard for ground truth.

**ℹ️ True facts (not bugs):**
- Zapmail **wallet is account-level** (shared across every workspace), not per-workspace — a balance drop can be another client's spend.
- Dashboard "Buy Mailboxes" opens a **Stripe invoice tab even when paid from the wallet** — that's the receipt, not a second charge.
- **Diacritics persist fine** in `firstName`/`lastName` (e.g. "Špende"); keep `mailboxUsername` ASCII. The diacritic was never the cause of a failure (ASCII attempts failed too).
- `profilePicture` is a Zapmail CDN URL; no API image-upload tool was found — the image must be hosted/uploaded (dashboard "Upload Image") to get the URL. Don't block warmup on the photo.

---

### 6.5 Purchase Mailbox Capacity (two-step model: BUY capacity, then ASSIGN it)

Zapmail separates **buying mailbox capacity** from **assigning** mailboxes to domains. You must buy capacity in the target workspace first; only then can you assign. Verified end-to-end on a live client run (2026-06-06).

**The legacy `POST /api/v2/mailboxes` "create" call does NOT consume pre-purchased capacity** — it returns `HTTP 400: "you don't have any mailboxes in your account. Please purchase mailboxes"` even when capacity exists. Ignore that endpoint. Use the **Zapmail MCP action tools** below.

**Buy capacity (per provider).** Mailbox capacity is per-provider (Google Workspace vs Microsoft 365), bought to match the provider split — e.g. 3 Google domains + 9 Microsoft domains × 2 inboxes = **6 Google + 18 Microsoft** slots. Wrong split or wrong workspace → assign fails. Two ways to buy:
- **API (preferred, agent can do it):** `mcp__zapmail__purchase_add_on_mailboxes…` — **wallet-funded**, body `{ "quantity": <n> }` (quantity is required; send per provider via `serviceProvider`), `workspaceKey` = client workspace. Buys from the Zapmail **wallet** balance.
- **Dashboard:** `app.zapmail.ai → Mailboxes → Buy New Mailbox` (`/mailboxes/purchase`), separate Google/Microsoft tabs. Used when buying with a saved card instead of wallet.

**Billing period: always Monthly** (locked operator preference — do NOT ask; memory `zapmail-mailbox-billing-monthly`). Recurring per-mailbox sub (~$3/mo Monthly), separate from the one-time domain cost.

**Funding boundary (hard-stop, per `/autonomous-execution-policy`).** The agent MAY buy capacity from an **already-funded wallet** (or already-saved card) within the run's spend ceiling — no per-purchase ask. The agent must **never enter card details, add a card, or enable auto-recharge** — that's the operator's action. If `get_wallet_balance` is short and no saved card exists, STOP with exactly the shortfall (e.g. "wallet $49, need $54 — top up the wallet or save a card") and meanwhile go do other productive work (don't idle).

**Capacity sync lag.** Capacity bought via the **dashboard** can take time (minutes up to ~a day) to become **API-visible** — until then `retrieve_all_mailboxes` shows `purchasedMailboxes: 0` / `availableMailboxes: 0` and assign returns the 400 above. API-bought capacity (`purchase_add_on_mailboxes`) is visible immediately. Before assigning, confirm `availableMailboxes` ≥ the count you intend to assign (`mcp__zapmail__retrieve_all_mailboxes…`, per provider). If 0 after a dashboard buy, **don't idle** — background-poll and do other work, re-check later.

### 7. Assign Inboxes (Zapmail MCP, NOT the legacy create endpoint)

Default is 2 inboxes per domain, both belonging to the **same recorded persona** (see "Sender persona"): `{firstname}@domain` + `{firstnamelastname}@domain`. Resolve from the locked persona — never a placeholder, company name, or role word. If you're about to create `team@`/`info@`/"{Company} Team", stop: the persona wasn't resolved.

Assign with **`mcp__zapmail__assign_new_mailboxes_to_domains…`**, passing `workspaceKey` (client workspace) + `serviceProvider` (`GOOGLE` or `MICROSOFT`, matching the domains). Body is **keyed by domainId**, each value a list of mailbox objects:

```json
{
  "<domainId>": [
    {"domainName": "godomain.com", "mailboxUsername": "jane",      "firstName": "Jane", "lastName": "Doe"},
    {"domainName": "godomain.com", "mailboxUsername": "janedoe",   "firstName": "Jane", "lastName": "Doe"}
  ]
}
```

Get each `domainId` from `mcp__zapmail__list_assignable_domains…` (or `retrieve_all_mailboxes`). Success returns `{"message": "Mailboxes will be assigned shortly", "data": [<mailboxId>...]}` — mailboxes then provision `IN_PROGRESS → ACTIVE`.

Rules learned the hard way:
- **Provider-scoped.** Google domains assign only under `serviceProvider=GOOGLE`; Microsoft under `MICROSOFT`. The dashboard's domain dropdown is filtered by the top-right provider toggle — the API equivalent is the `serviceProvider` header.
- **Batch ≤ 3 domains (≤ 6 mailboxes) per call.** A large 18-mailbox payload times out (`fetch failed`); 6 at a time succeeds. Split the run into batches of ≤3 domains.
- **Transient `fetch failed`** on these POST tools is common — retry. Before re-sending a failed assign, re-check `availableMailboxes` to confirm nothing partially landed (avoid double-assign).
- **Don't drive the browser for assignment.** The Zapmail SPA hangs browser automation; the assign API is the reliable path. (Dashboard "Assign Now" Bulk-Upload CSV is a manual fallback for a human only.)
- **Diacritics are fine** in `firstName`/`lastName` (e.g. "Špende") — they persist correctly; keep `mailboxUsername` ASCII.

### 8. Poll Mailboxes Until Active

Poll `mcp__zapmail__retrieve_all_mailboxes…` (per provider) until the expected inboxes flip `IN_PROGRESS → ACTIVE`. ACTIVE mailboxes expose SMTP/IMAP credentials (`password`/`appPassword`); `IN_PROGRESS` have none, so **export to the sending platform is blocked until ACTIVE**.

**Do not idle-wait** (per `/autonomous-execution-policy` + memory `dont-idle-wait-interleave`). Provisioning to ACTIVE can take ~15 min to a few hours. Start a background poll and **move on to other productive work** (another client's setup, list/copy work, the profile photo prep) — recheck when the poll fires. Don't sit in a tight loop.

If the expected count does not appear or statuses stall beyond 2x the expected window, print the exact missing inboxes and statuses. (`mcp__zapmail__retry_creation_of_failed_mailboxes…` can re-trigger stuck ones.)

### 9. Provisioning Complete And Handoff

Stop this skill when the expected Zapmail inboxes are `ACTIVE`. Print the active mailbox list, provider split, Zapmail workspace used, and any missing or stalled mailboxes.

**Apply the sender profile assets (required, BEFORE exporting to the sending platform).** The assets
were already generated when the persona name was locked (see "Sender persona" → HARD RULE). Now **apply**
the **one shared headshot + one shared GIF** to every mailbox (one persona = one face) before export —
never import a faceless mailbox and backfill later. The client constraint is almost always "no clearly
fake AI profile pictures." If the assets don't exist yet, stop and run `/mailbox-profile-generator` now.
Zapmail supports animated GIF profile pictures (confirmed in the Zapmail UI), so set the shared **GIF**.
Apply via **MCP first, browser only as a fallback** (`mcp-tools-routing.md`): try the `zapmail` MCP
(`update_mailbox` / `bulk_update_mailboxes`; confirm the exact field at point-of-use). If the MCP exposes
no profile-picture write field (re-verify for tool drift), fall back to the **Zapmail UI**, where GIF
upload is confirmed. Do not block warmup on the photo if no avatar path is available.

**HARD RULE — profile gate before import.** Do **not** import/export ANY mailbox into the sending tool
(Smartlead/EmailBison/Instantly) until **every** created mailbox has its profile picture applied at the
provider — the **animated GIF wherever the provider supports it (both Primeforge and Zapmail do), falling
back to the plain static headshot image only where a provider/mailbox genuinely can't take a GIF**. Apply
MCP-first, browser only as a fallback. One faceless mailbox means the whole fleet is not-ready-to-import;
resolve photos first, then import.

Then branch by locked `run_state.sending_platform`:

- `EmailBison`: run `/emailbison-inbox-manager` and use "Import Zapmail Inboxes To EmailBison And Start Warmup."
- `Smartlead`: run `/smartlead-inbox-manager` for Zapmail-provisioned inboxes.
- `Instantly` or `Other`: stop and use that platform's native import and warmup workflow. After the user confirms the inboxes are imported and warmup is running, invoke `/cold-email-inbox-tracker`.

Do not export to EmailBison or log the central tracker from this provisioning skill for EmailBison or Smartlead paths. Export/import, MCP setup, warmup, tags, and tracker logging belong to `/emailbison-inbox-manager` or `/smartlead-inbox-manager`.

---

## Browser Fallback

Browser automation is not the default inbox setup path. Use REST first when the workspace ID and domain IDs are already known or saved from a previous run.

Use browser automation only when REST cannot finish a UI-bound or discovery step:

- workspace or domain ID discovery
- wrong-workspace domain move
- provider assignment
- workspace-specific key creation
- UI-only workspace or domain discovery

Fallback steps:

1. Open `https://app.zapmail.ai`.
2. Switch to `TARGET_ZAPMAIL_WORKSPACE_NAME`.
3. Search affected domains.
4. Use Move Domain.
5. Select workspace.
6. Select Google Workspace or Microsoft 365.
7. Confirm.

If browser automation is unavailable, give exact manual steps and the affected domain list.

---

## Troubleshooting

- `401 Invalid API key` after using `x-api-key` means the header is wrong. Retry with `x-auth-zapmail`.
- Domains missing from Zapmail after connect means workspace routing or key scope is wrong. Verify `TARGET_ZAPMAIL_WORKSPACE_NAME`, regenerate the key inside that workspace, and pass `x-workspace-key` when available.
- Provider-specific mailbox failures usually mean the provider route is missing or wrong. Retry with `x-service-provider: GOOGLE` or `x-service-provider: MICROSOFT` for the affected group.

---

## Escalation Rules

- Same API operation fails 3 times: stop with `ESCALATION NEEDED`, exact error, domains, workspace, provider, and needed manual action.
- Browser automation fails 2 approaches: stop with exact manual steps.
- Required action missing: print `PERMISSION NEEDED: This action requires admin access to <system>. Please log in as admin or provide admin credentials.`
- Any step takes 2x expected time: print diagnostics, not silence.

---

## Quick Reference

| Action | Method | URL |
|---|---|---|
| Dynadot account info | GET | `https://api.dynadot.com/api3.json?key=KEY&command=account_info` |
| Dynadot search | GET | `https://api.dynadot.com/api3.json?key=KEY&command=search&show_price=1&domain0=...` |
| Dynadot register | GET | `https://api.dynadot.com/api3.json?key=KEY&command=register&domain=X&duration=1` |
| Dynadot nameservers | GET | `https://api.dynadot.com/api3.json?key=KEY&command=set_ns&domain=X,Y&ns0=...` |
| Zapmail workspaces | GET | `https://api.zapmail.ai/api/v2/workspaces?page=1&limit=100` |
| Zapmail all domains | GET | `https://api.zapmail.ai/api/v2/domains?page=1&limit=100` |
| Zapmail connect | POST | `https://api.zapmail.ai/api/v2/domains/connect-domain` |
| Zapmail assignable | GET | `https://api.zapmail.ai/api/v2/domains/assignable?page=1&limit=100` |
| Zapmail move domains | POST | `https://api.zapmail.ai/api/v2/domains/move-workspace` |
| Zapmail create inboxes | POST | `https://api.zapmail.ai/api/v2/mailboxes` |

---

## Related Skills

- `/spaceship-zapmail-domain-setup` - alternate registrar path
- `/emailbison-inbox-manager`, `/smartlead-inbox-manager` - selected by locked sending platform for export/import, warmup, signatures, tags, and `/cold-email-inbox-tracker`
- `/cold-email-inbox-tracker` - logs Instantly/Other setups only after the user confirms import and warmup in that platform
- `/email-deliverability-audit` - check SPF, DKIM, DMARC, and domain health

