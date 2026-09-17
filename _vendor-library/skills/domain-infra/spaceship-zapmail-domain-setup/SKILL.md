---
name: spaceship-zapmail-domain-setup
description: "Public guide: Configure a client-agnostic Spaceship + Zapmail cold email infrastructure run with workspace-verified Zapmail keys, manual balance gate, domain purchase, nameserver update, provider-aware mailbox creation, browser fallback, and provider-locked handoff. Use when setting up cold email domains and 2 inboxes per domain through Spaceship and Zapmail."
---

# Cold Email Domain Setup: Spaceship + Zapmail

> ⚠️ **Read `coldoutbound-gotchas.md` before you start** — field-tested dead ends already paid for. Most-bitten on Zapmail:
> - Mailbox **capacity must be PURCHASED before** you can assign/create mailboxes (else "you don't have any mailboxes… purchase mailboxes" error). The current Zapmail MCP has **NO buy-capacity API** (verified 2026-06-16) — buy in the Zapmail **dashboard** (Buy Mailboxes → qty; **Monthly**, Microsoft = Google = $3/mo). **Payment-method rule (no asking): Wallet if its balance ≥ cost, else card** (cost = `TOTAL_MAILBOXES × $3`). After a wallet buy the balance **DROPS** — if it's unchanged, the purchase did NOT go through (re-check, don't assume). Full rule in §6.5.
> - Assign payload: `{ "<domainUUID>": [ {firstName,lastName,mailboxUsername,domainName}, … ] }`, header `x-service-provider`.
> - `list_domains` returns **GOOGLE-only** even under MICROSOFT context — use `list_assignable_domains` w/ `serviceProvider:MICROSOFT`. `retrieve_all_mailboxes` often 500s.
> - **App passwords lag** (2nd inbox per domain) and can **ROTATE on re-provision** (silently breaking a live Smartlead connection — accounts can even vanish from Smartlead). Wait for `appPassword`; re-export stragglers/rotations. Mailboxes stay ACTIVE; nothing is lost at the provider.

Use this skill only when locked `run_state.infrastructure_stack = spaceship_zapmail`, `run_state.registrar = Spaceship`, and `run_state.mailbox_provider = Zapmail`, unless the user explicitly changes providers.

This workflow buys domains on Spaceship, connects them to the correct Zapmail workspace, and creates 2 inboxes per domain. It stops when the expected Zapmail inboxes are `ACTIVE`; sending-platform export and warmup belong to the platform-specific manager skill selected by `run_state.sending_platform`.

The failure mode to avoid is simple: buying domains correctly, then connecting them to the wrong Zapmail workspace. That wastes hours. This skill treats workspace proof as mandatory before any purchase.

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

Set these before starting. Do not hardcode a client into the skill.

```bash
CLIENT_NAME=Acme
BRAND_KEYWORD=acme
TARGET_ZAPMAIL_WORKSPACE_NAME=Acme
REGISTRAR=spaceship
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
  person, and kill cold-email trust. A mailbox like `team@example.com` ("ExampleCo Team") is the
  exact failure this rule exists to prevent.
- **Record the chosen persona in the client profile** under `run_state.sender_personas` so every
  rerun reuses it and can never silently fall back to a placeholder. If the profile has no recorded
  persona, generate one and write it back before creating inboxes.

**HARD RULE — generate the profile assets the moment the persona name is locked, BEFORE any inbox is
created.** As soon as the persona name is set, run `/mailbox-profile-generator` to produce, in this
order: (1) the OpenAI realistic headshot, (2) the downloaded company logo, (3) the headshot↔logo
crossfade GIF. One shared headshot + one shared GIF for the whole client (one persona = identical file
on every mailbox). **Zapmail supports animated GIF profile pictures** (confirmed in the Zapmail UI,
2026-06-06), so use the shared crossfade **GIF** on Zapmail just like Primeforge. Do **not** start
creating inboxes until these assets exist — they get applied at the provider before export. Never
provision faceless mailboxes and backfill photos later.

Provider plan options:

- explicit ranges from `/mailbox-mix-strategy`, for example `GOOGLE_DOMAINS=1-4` and `MICROSOFT_DOMAINS=5-12`
- `all GOOGLE`, only when the saved strategy or manual override says to buy only Google Workspace mailboxes
- `all MICROSOFT`, only when the saved strategy or manual override says to buy only Microsoft 365 mailboxes

Keep `INBOXES_PER_DOMAIN=2` unless the user explicitly asks for another number. More inboxes per domain is not clever. It raises risk.

---

## Required Credentials

### Spaceship

Create a Spaceship API key with permissions for:

- domain availability reads
- domain registration or billing
- domain writes for nameserver updates
- async operation reads

Spaceship uses both headers:

```http
X-API-Key: <SPACESHIP_API_KEY>
X-API-Secret: <SPACESHIP_API_SECRET>
```

You also need real contact IDs:

```bash
SPACESHIP_API_KEY=...
SPACESHIP_API_SECRET=...
SPACESHIP_REGISTRANT_CONTACT_ID=...
SPACESHIP_ADMIN_CONTACT_ID=...
SPACESHIP_TECH_CONTACT_ID=...
SPACESHIP_BILLING_CONTACT_ID=...
```

Do not guess contact IDs. A fake contact ID is a guaranteed failed registration.

### Zapmail

Use the Zapmail MCP Server key generated while logged into the correct client workspace, not the root or admin workspace.

Bad key choice is the core problem. A root workspace key can silently route domains into the wrong workspace. Generate the key from inside `TARGET_ZAPMAIL_WORKSPACE_NAME`.

```bash
ZAPMAIL_API_KEY=...
TARGET_ZAPMAIL_WORKSPACE_NAME=Acme
```

### API vs MCP vs Browser

Do not confuse the key source with the execution path. The default automation path is direct Zapmail REST API calls from PowerShell or Python. The Zapmail MCP package is only a wrapper around the same API surface, and the MCP Server key is the API key source. A live MCP tool is not required to create inboxes.

`x-api-key` is the wrong auth header for Zapmail API calls. If that header returns `401 Invalid API key`, the fix is not browser automation. Use `x-auth-zapmail`.

Zapmail REST headers used by the scripts:

```http
x-auth-zapmail: <ZAPMAIL_API_KEY>
x-workspace-key: <workspace-id>       # when available after preflight
x-service-provider: GOOGLE|MICROSOFT  # provider-aware domain/mailbox calls
```

Use `x-workspace-key` when operating outside the primary workspace or when routing into a known client workspace. Use `x-service-provider` on provider-aware domain and mailbox calls.

---

## Step 0: Preflight Questionnaire

Collect every answer before any availability check or purchase. If any required value is missing, stop. Guessing here spends money and creates cleanup work.

```text
1. Brand keyword for domain generation, for example "acme".
2. Number of domains needed. Default: 12.
3. Sender persona — one realistic human full name per client (client-provided, or generated and recorded in `run_state.sender_personas`). Reuse it across every domain/inbox/provider. Default inboxes are {firstname}@domain and {firstnamelastname}@domain. Never a generic/role mailbox (team@, info@, hello@) or a "{Company} Team" display name. See "Sender persona" above.
4. Google/Microsoft split from `run_state.mailbox_mix_strategy`. If missing, stop and run `/mailbox-mix-strategy` first.
5. Confirm registrar is Spaceship.
6. Spaceship API key, API secret, and registrant/admin/tech/billing contact IDs.
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

Run preflight before checking availability or buying anything.

1. Verify Spaceship credentials with:

```http
GET https://spaceship.dev/api/v1/domains?take=1&skip=0
```

2. Verify contact IDs are set.

3. Verify Zapmail workspace:

```http
GET https://api.zapmail.ai/api/v2/workspaces?page=1&limit=100
x-auth-zapmail: <ZAPMAIL_API_KEY>
```

Print:

```text
Connected to workspace: <workspace name>
```

If the workspace does not match `TARGET_ZAPMAIL_WORKSPACE_NAME`, stop:

```text
DIAGNOSIS: Zapmail key is not scoped to the target workspace.
Regenerate your Zapmail MCP Server key from inside <workspace>, not the root account.
```

4. Confirm the sending-platform handoff path from `run_state.sending_platform`. Do not verify or export to EmailBison in this skill; `/emailbison-inbox-manager` owns that handoff.

---

## Balance Gate (+ how much to top up)

Spaceship charges domain registrations against the **account balance / saved payment method**, not a per-purchase card prompt. Its public docs do not reliably expose a balance endpoint — do not fake one. So before buying, compute the **top-up figure** the operator needs and surface it explicitly. Always give a single concrete number ("top up ≈ $X"), not just a per-domain price — that is what the operator acts on.

**Per-domain reference prices (Spaceship first-year, verified 2026-06 — prices drift, confirm live):**

| TLD | First-year price |
|---|---|
| `.com` | **$8.88** |
| `.co` | **$9.32** |

Confirm the live price per domain from `check_domain_availability` (a non-empty `premiumPricing` means the domain costs MORE than the table — exclude it or budget it separately) or the Spaceship dashboard. Use the table only as the standard-price fallback.

**Top-up estimate — the formula:**

```text
bare_cost = DOMAIN_COUNT × per_domain_price          # e.g. 24 × $8.88 = $213.12
top_up    = ceil(bare_cost × 1.05)                   # ~5% buffer for rounding / a spare name
                                                     # 24 × $8.88  ->  recommend ≈ $225
# VAT: if the account is VAT-charged at checkout (no valid reverse-charge VAT number on file),
# add the local rate. e.g. 25% Swedish VAT (A SALES AB):  24 × $8.88 × 1.25 ≈ $267  ->  recommend ≈ $275.
# Most registrars display all-in prices; if the quoted price already includes tax, skip this line.
```

**Funding is a HARD-STOP (operator action).** The agent must **never add a card, enter payment details, or otherwise fund the balance** — that is the operator's action. If the balance / payment method is not funded, `register_domain` fails with:

```text
422 Unprocessable Entity — "Payment method is not available. Please make sure that you have enough funds on balance."
```

That error is NOT a payload bug — do not permute contacts / privacy / years to "fix" it. It means the Spaceship balance is empty or no payment method is saved. STOP and hand the operator the exact top-up figure (with the TLD breakdown). Reads (`list_domains`, `check_domain_availability`) still work while the balance is empty — only the charge fails — so confirm the names + availability first, then block on funding with the number.

Ask the operator exactly:

```text
Spaceship needs funding before I can register the domains.

Top up ≈ $<top_up>  (covers <DOMAIN_COUNT> × <TLD> at $<per_domain_price> = $<bare_cost>, plus a small buffer).

A. [Recommended] I've topped up the Spaceship balance — register all <DOMAIN_COUNT> now
B. Review the final per-domain prices first, then register
C. Stop before purchase
D. Custom answer
```

Under `auto_execute`, once the operator confirms the balance is funded, register all domains in one run within the spend ceiling — **one-then-batch**: register the first domain, read the actual charge off the async result, then fire the rest, so a price surprise is caught at ×1, not ×N. If the operator has not confirmed funding, stop before spending money.

---

## Workflow

### 1. Generate Domain Candidates

Use the brand keyword plus the same tiered naming strategy.

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

Filters:

- Prefer `.com`, then `.co`.
- Aim for under 20 SLD characters.
- Reject spam-looking substrings like `mega`, `ultra`, and `grp`.
- Screen awkward accidental words.
- Deduplicate globally across clients.

### 2. Check Availability

```http
POST https://spaceship.dev/api/v1/domains/available
```

Spaceship checks up to 20 domains per request. Filter to available domains under the price cap.

### 3. Confirm Balance And Purchase

Show selected domains, prices, total estimated cost, and the top-up question. Only proceed after exact `YES`.

Purchase one domain per request:

```http
POST https://spaceship.dev/api/v1/domains/{domain}
```

Use this body shape. Do not change it unless Spaceship changes the API.

```json
{
  "autoRenew": false,
  "years": 1,
  "privacyProtection": {
    "level": "high",
    "userConsent": true
  },
  "contacts": {
    "registrant": "<SPACESHIP_REGISTRANT_CONTACT_ID>",
    "admin": "<SPACESHIP_ADMIN_CONTACT_ID>",
    "tech": "<SPACESHIP_TECH_CONTACT_ID>",
    "billing": "<SPACESHIP_BILLING_CONTACT_ID>"
  }
}
```

Spaceship returns `202 Accepted` for async purchases. Read the async operation ID from the `spaceship-async-operationid` response header, then poll:

```http
GET https://spaceship.dev/api/v1/async-operations/{operationId}
```

Proceed only when every selected domain is registered. Save the purchased list immediately.

### 4. Connect Domains In Zapmail (BEFORE touching nameservers)

Connect first. Zapmail only tells you the correct nameservers for a domain *after* it is connected, so nameservers must never be set before this step.

Group domains by provider from the provider plan. For each provider group:

```http
POST https://api.zapmail.ai/api/v2/domains/connect-domain
x-auth-zapmail: <ZAPMAIL_API_KEY>
x-workspace-key: <workspace-id>
x-service-provider: GOOGLE|MICROSOFT
Content-Type: application/json
```

Body:

```json
{"domainNames": ["goacme.com", "tryacme.com"]}
```

The connect runs async per domain: `CHECKING_IF_DOMAIN_IS_REGISTERED` → `CHECKING_NS_IN_WHOIS` → `SUCCESS`. Provider groups can advance at different speeds; do not assume one group's state from another.

### 5. Read Each Domain's Expected Nameservers, Then Switch Per-Domain

**Never hardcode nameservers. Never copy one domain's nameservers to another.** ClouDNS routinely assigns a *different* nameserver set per domain/zone. Read each domain's own expected nameservers from its Zapmail connection request and set exactly those at Spaceship.

Poll the connection requests (use a high `limit`; this endpoint's default page is small and its provider filtering is unreliable — fetch all and match by `domainName`):

```http
GET https://api.zapmail.ai/api/v2/domains/connection-requests?page=1&limit=100
x-auth-zapmail: <ZAPMAIL_API_KEY>
x-workspace-key: <workspace-id>
```

Each request once it reaches `CHECKING_NS_IN_WHOIS` exposes:

```json
{
  "domainName": "goacme.com",
  "status": "CHECKING_NS_IN_WHOIS",
  "metadata": {
    "currentNameServers": ["launch1.spaceship.net", "launch2.spaceship.net"],
    "expectedNameservers": ["pns41.cloudns.net", "pns42.cloudns.com", "..."]
  }
}
```

For EACH domain, read its own `metadata.expectedNameservers` and set exactly that list at Spaceship — one domain at a time, no shared/copied list:

```http
PUT https://spaceship.dev/api/v1/domains/{domain}/nameservers
```

```json
{ "provider": "custom", "hosts": ["<that domain's expectedNameservers, verbatim>"] }
```

Rules:
- If a domain has not yet reached `CHECKING_NS_IN_WHOIS` (metadata still `null`), wait and re-poll that domain — do NOT borrow another domain's nameservers as a guess.
- After setting, confirm with `GET https://spaceship.dev/api/v1/domains/{domain}` that the live `nameservers.hosts` equal that domain's expected set.
- Then let Zapmail's WHOIS poller flip the domain to `SUCCESS`. A domain only reaches `SUCCESS`/`ACTIVE` when WHOIS nameservers match what Zapmail expected for THAT domain — treat any domain stuck at `CHECKING_NS_IN_WHOIS` as a nameserver mismatch and re-check its expected set.

> Note: within a single ClouDNS-backed workspace the expected set is often identical across domains, but it is not guaranteed. Verify per domain rather than relying on it.

Immediately verify the domains appear in the target workspace:

```http
GET https://api.zapmail.ai/api/v2/domains?contains=<domain>&page=1&limit=100
```

If domains are missing, do not poll assignable. Diagnose wrong workspace/key.

### 6. Poll Assignable With Diagnostics

Poll every 2 minutes:

```http
GET https://api.zapmail.ai/api/v2/domains/assignable?page=1&limit=100
```

Proceed when at least 95% of domains are assignable.

If count stays `0` after 10 minutes:

1. Call `GET /api/v2/domains`.
2. Check whether the target domains appear in the current workspace.
3. If not, print:

```text
DIAGNOSIS: Domains are not in this workspace. This means the API key is scoped to a different workspace. Stop, switch to the correct workspace, regenerate the MCP key, and re-run.
```

4. If they appear, print every domain and exact status.

## ⚡ Zapmail Mailbox Phase — Confirmed Path & Dead Ends (READ FIRST, save hours)

Hard-won on a live client run (2026-06-06). Follow the confirmed path; do **not** re-test the dead ends — each one cost real time.

**✅ CONFIRMED WORKING PATH (mailbox capacity → ACTIVE):**
1. **Buy capacity per provider** — if a wallet-funded purchase API exists, `purchase_add_on_mailboxes` body `{ "quantity": <n> }`, `serviceProvider`, `workspaceKey`. **The current MCP wrapper has no such endpoint (verified 2026-06-16) → buy in the dashboard** (operator step). Either way: **Monthly** + **Payment-method rule — Wallet if balance ≥ cost, else card (don't ask)** + **verify the wallet balance actually DROPPED** before treating the buy as done. See §6.5. **Note on why this is operator-gated:** normally a dashboard-only buy from a funded wallet is a hands-free browser task (`/autonomous-execution-policy` §6) — but the Zapmail SPA is the documented non-automatable surface (the extension hangs on it, see DEAD ENDS below), so this specific buy stays operator-gated for a *tooling* reason until the capacity-purchase API returns. It is NOT a payment-boundary punt (the wallet is already funded).
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

**Buy capacity (per provider).** Mailbox capacity is per-provider (Google Workspace vs Microsoft 365), bought to match the provider split — e.g. 16 Google + 8 Microsoft domains × 2 inboxes = **32 Google + 16 Microsoft** slots. Wrong split or wrong workspace → assign fails. How to buy depends on the live Zapmail API surface:
- **If a wallet-funded capacity-purchase API exists** (older wrappers exposed `purchase_add_on_mailboxes`, body `{ "quantity": <n> }`, per `serviceProvider`, `workspaceKey` = client workspace), the agent buys it directly from the funded wallet — no per-purchase ask, within the spend ceiling.
- **Current MCP reality (verified 2026-06-16 on a live client run):** the current Zapmail MCP exposes **NO buy-capacity endpoint** in ANY category (checked mailboxes/billing/subscriptions/wallet); `POST /v2/subscriptions/mailboxes` needs an **active `subscriptionId`** but all account subscriptions read `CANCELLED` and there's no create-subscription endpoint. So the **first capacity purchase is a Zapmail DASHBOARD action** (`app.zapmail.ai → switch to the CLIENT workspace → Buy Mailboxes → Google/Microsoft tabs → qty`). The dashboard SPA can't be safely automated (it hangs browser automation), so this is the **operator's** step — hand them the exact per-provider quantities + the payment rule below. (Assign, once capacity exists, is `call_endpoint POST /v2/mailboxes`, body keyed by `domainId` → `[{domainName, mailboxUsername, firstName, lastName}, …]` — see §7.)

**Payment-method rule — HARD DEFAULT, do NOT ask (this is the wallet-vs-card friction the operator asked us to remove).** Pay by **Wallet when the wallet balance covers the cost; otherwise pay by card.** Read the live balance first (`wallet_balance` / raw `GET /v2/wallet/balance`, `clear_cache` first). Cost = `TOTAL_MAILBOXES × $3` (Monthly). `wallet_balance ≥ cost` → **Wallet**; short → **card** — and do **NOT** force a wallet top-up, card is the accepted fallback. The agent itself only ever spends an **already-funded wallet** (it never enters card details / adds a card / enables auto-recharge — that's the operator); when the buy is a dashboard step, give the operator this exact same rule so they pick Wallet-if-funded-else-card with no back-and-forth. **Always verify the charge landed:** a wallet buy makes the balance **DROP by the cost** — if `wallet_balance` is unchanged afterward, the purchase did **not** go through on the wallet (abandoned, or paid by card, or wrong workspace). Don't assume success — re-read the balance and the assignable capacity before reporting done.

**Hands-free purchase-first — HARD RULE (operator 2026-06-16: "do it via MCP yourself, don't punt").** When the agent is authorized to spend a **funded** source (the Zapmail wallet, within the run's ceiling), DEFAULT to completing the buy **programmatically**; handing it to the operator is a genuine last resort, not the first fallback. Exhaust, in order: **(1)** the documented capacity-purchase API if the live MCP exposes one; **(2)** once ANY active mailbox subscription exists on the account, add capacity hands-free via `POST /v2/subscriptions/mailboxes` `{subscriptionId, quantity}` from the funded wallet (`subscriptionId` from `GET /v2/subscriptions` — the most recent non-cancelled one); **(3)** if NO active subscription exists (fresh account/workspace — the real gap), try the **undocumented create path** the way `POST /v2/workspaces` works — probe `POST /v2/subscriptions` (or the dashboard's underlying call) with a **quantity-1** body, then verify the wallet dropped before scaling; **(4)** last resort, drive the dashboard via browser automation, **time-boxed** (the Zapmail SPA is flaky and may hang). Only punt to the operator when **all** of these fail, OR the buy needs **NEW card details** (entering/adding a card is the operator's boundary; spending an already-funded wallet is the agent's remit). "No documented endpoint" ≠ "impossible" — probe the undocumented + UI paths before escalating.

**Billing period: always Monthly** (locked operator preference — do NOT ask; memory `zapmail-mailbox-billing-monthly`). Recurring per-mailbox sub (~$3/mo Monthly), separate from the one-time domain cost.

**Wallet top-up estimate (only if paying by Wallet):** `cost = TOTAL_MAILBOXES × $3` (Monthly, per mailbox, Google and Microsoft both ~$3) — e.g. **48 mailboxes → ≈ $144** for the first month. The Zapmail wallet is **account-level** (shared across every workspace), so read the live balance first (`wallet_balance` / raw `GET /v2/wallet/balance`, `clear_cache` first to avoid a stale reading). **Per the Payment-method rule (above), a top-up is OPTIONAL — if `wallet_balance < cost`, just pay by card; do not force a top-up.** The agent only ever spends an already-funded wallet (never adds a card / enables auto-recharge — operator's action).

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
them to every mailbox before the senders are exported/imported into Smartlead — never import a faceless
mailbox and backfill later. The client constraint is almost always "no clearly fake AI profile
pictures." Because it's one persona, apply the **one shared headshot + one shared GIF** to every mailbox
(different faces for the same person is a trust problem, not personalization). If the assets don't exist
yet, stop and run `/mailbox-profile-generator` now — do not export faceless mailboxes.

Zapmail supports animated GIF profile pictures (confirmed in the Zapmail UI), so set the shared **GIF**.
Apply via **MCP first, browser only as a fallback** (`mcp-tools-routing.md`): try the `zapmail` MCP
(`update_mailbox` / `bulk_update_mailboxes`; confirm the exact profile-picture field at point-of-use). If
the MCP exposes no profile-picture write field (re-verify for tool drift), fall back to the **Zapmail
UI**, where GIF upload is confirmed. Do not block warmup on the photo if no avatar path is available.

**HARD RULE — profile gate before import.** Do **not** import/export ANY mailbox into the sending tool
(Smartlead/EmailBison/Instantly) until **every** created mailbox has its profile picture applied at the
provider — the **animated GIF wherever the provider supports it (both Primeforge and Zapmail do), falling
back to the plain static headshot image only where a provider/mailbox genuinely can't take a GIF**. Apply
MCP-first, browser only as a fallback. One faceless mailbox means the whole fleet is not-ready-to-import;
resolve photos first, then import.

Then branch by locked `run_state.sending_platform`:

- `EmailBison`: run `/emailbison-inbox-manager` and use "Import Zapmail Inboxes To EmailBison And Start Warmup."
- `Smartlead`: run `/smartlead-inbox-manager` for Zapmail-provisioned inboxes. **HARD RULE — keep Zapmail's warmup config on "recommended"** (Reply 75 / Max-per-day 35 / Min-Max 20-30 / Rampup +3 / Daily-reply 15, ACTIVE) so the native export carries it into Smartlead. That is THE warmup standard for every Zapmail mailbox; never let the Smartlead public API reset it to the retired 40/5/20 (the public API can't even set rampup 3 — floor 5). See `/smartlead-inbox-manager` → Warmup Defaults.
- `Instantly` or `Other`: stop and use that platform's native import and warmup workflow. After the user confirms the inboxes are imported and warmup is running, invoke `/cold-email-inbox-tracker`.

Do not export to EmailBison or log the central tracker from this provisioning skill for EmailBison or Smartlead paths. Export/import, MCP setup, warmup, tags, and tracker logging belong to `/emailbison-inbox-manager` or `/smartlead-inbox-manager`.

---

## Browser Fallback

Browser automation is not the default inbox setup path. Use REST first when the workspace ID and domain IDs are already known or saved from a previous run.

Use browser automation only when REST cannot finish a UI-bound or discovery step:

- workspace or domain ID discovery
- wrong-workspace domain moves
- provider assignment when API headers or move endpoint do not work
- workspace-specific key discovery or creation
- UI-only workspace or domain discovery

Steps:

1. Open `https://app.zapmail.ai`.
2. Switch to `TARGET_ZAPMAIL_WORKSPACE_NAME`.
3. Search the affected domains.
4. For each domain or selected batch, open the domain actions menu.
5. Click Move Domain.
6. Select the target workspace.
7. Select Google Workspace or Microsoft 365.
8. Confirm.

If browser automation is unavailable, say:

```text
Browser automation unavailable. Please manually move these domains in Zapmail: <domain list>. Log in at app.zapmail.ai, switch to <workspace>, search each domain, click the domain action menu, choose Move Domain, select <workspace> and <provider>, then confirm.
```

---

## Troubleshooting

- `401 Invalid API key` after using `x-api-key` means the header is wrong. Retry with `x-auth-zapmail`.
- Domains missing from Zapmail after connect means workspace routing or key scope is wrong. Verify `TARGET_ZAPMAIL_WORKSPACE_NAME`, regenerate the key inside that workspace, and pass `x-workspace-key` when available.
- Provider-specific mailbox failures usually mean the provider route is missing or wrong. Retry with `x-service-provider: GOOGLE` or `x-service-provider: MICROSOFT` for the affected group.
- `GET /mailboxes` returning `500` immediately after mailbox creation means inboxes are still provisioning. Do not treat this as a hard failure. Wait a few minutes and poll again, or check domain assignable counts instead.
- EmailBison export, `workspace` values, MCP setup, warmup, tags, and central tracker logging are handled in `/emailbison-inbox-manager`, not here.
- Smartlead import/connection, warmup, tags, and central tracker logging are handled in `/smartlead-inbox-manager`, not here.

---

## Escalation Rules

- Same API operation fails 3 times: stop with `ESCALATION NEEDED`, exact error, domains affected, target workspace, target provider, and the needed manual action.
- Browser automation fails 2 approaches: stop and give exact manual steps.
- Required button or action is missing: print `PERMISSION NEEDED: This action requires admin access to <system>. Please log in as admin or provide admin credentials.`
- Any step takes 2x expected time: run diagnostics and print status. Do not wait silently.

---

## Automation

Use the scripts as templates:

- Windows: `scripts/zapmail_domain_setup.ps1`
- Python fallback: `scripts/zapmail_domain_setup.py`

Both scripts are client-agnostic. Configure the client, domain count, registrar, workspace, provider split, and sending-platform handoff through `.env`.

Required `.env` values:

```bash
CLIENT_NAME=Acme
BRAND_KEYWORD=acme
TARGET_ZAPMAIL_WORKSPACE_NAME=Acme
REGISTRAR=spaceship
DOMAIN_COUNT=12
INBOXES_PER_DOMAIN=2
SENDER_FIRST_NAME=Jane
SENDER_LAST_NAME=Smith
PROVIDER_PLAN=<required from run_state.mailbox_mix_strategy>
SENDING_PLATFORM=EMAILBISON
SPACESHIP_API_KEY=...
SPACESHIP_API_SECRET=...
SPACESHIP_REGISTRANT_CONTACT_ID=...
SPACESHIP_ADMIN_CONTACT_ID=...
SPACESHIP_TECH_CONTACT_ID=...
SPACESHIP_BILLING_CONTACT_ID=...
ZAPMAIL_API_KEY=...
```

---

## Quick Reference

| Action | Method | URL |
|---|---|---|
| Spaceship list domains | GET | `https://spaceship.dev/api/v1/domains?take=1&skip=0` |
| Spaceship availability | POST | `https://spaceship.dev/api/v1/domains/available` |
| Spaceship register | POST | `https://spaceship.dev/api/v1/domains/{domain}` |
| Spaceship async operation | GET | `https://spaceship.dev/api/v1/async-operations/{operationId}` |
| Spaceship nameserver update | PUT | `https://spaceship.dev/api/v1/domains/{domain}/nameservers` |
| Zapmail workspaces | GET | `https://api.zapmail.ai/api/v2/workspaces?page=1&limit=100` |
| Zapmail all domains | GET | `https://api.zapmail.ai/api/v2/domains?page=1&limit=100` |
| Zapmail connect | POST | `https://api.zapmail.ai/api/v2/domains/connect-domain` |
| Zapmail connection requests (per-domain expected nameservers) | GET | `https://api.zapmail.ai/api/v2/domains/connection-requests?page=1&limit=100` |
| Zapmail assignable | GET | `https://api.zapmail.ai/api/v2/domains/assignable?page=1&limit=100` |
| Zapmail move domains | POST | `https://api.zapmail.ai/api/v2/domains/move-workspace` |
| Zapmail create inboxes | POST | `https://api.zapmail.ai/api/v2/mailboxes` |
| Zapmail list mailboxes | GET | `https://api.zapmail.ai/api/v2/mailboxes` |

---

## What To Do Next

If locked `run_state.sending_platform = EmailBison`, run `/emailbison-inbox-manager` after Zapmail inboxes are `ACTIVE` to export the sender emails, confirm they appeared, set up MCP if needed, start warmup, apply signatures, tag senders, and invoke `/cold-email-inbox-tracker`.

If locked `run_state.sending_platform = Smartlead`, run `/smartlead-inbox-manager`. That skill owns warmup, insurance tagging, and `/cold-email-inbox-tracker`.

If locked `run_state.sending_platform = Instantly` or `Other`, use that platform's native import and warmup workflow. Invoke `/cold-email-inbox-tracker` only after the user confirms import is complete and warmup is running.

After warmup starts, wait 2 weeks before sending real campaigns. Skipping warmup is not speed. It is reputation damage with a calendar attached.

