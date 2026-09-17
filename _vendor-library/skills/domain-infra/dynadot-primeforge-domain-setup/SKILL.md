---
name: dynadot-primeforge-domain-setup
description: "Public guide: Configure a client-agnostic Dynadot + Primeforge cold email infrastructure run with registrar balance confirmation, domain purchase, Primeforge workspace proof, provider-aware mailbox ordering, DNS validation, mailbox credential export, and handoff to the sending platform chosen during onboarding. Use when buying domains through Dynadot and purchasing Google Workspace or Microsoft 365 inboxes through Primeforge."
---

# Cold Email Domain Setup: Dynadot + Primeforge

> ⚠️ **Read `coldoutbound-gotchas.md` before you start.** Most-bitten on Primeforge:
> - `primeforge_list_domains`/`list_mailboxes` MCP **cap at 10, no offset** — pull the full inventory from the logged-in browser tab via the Firebase token → `api.primeforge.ai/workspaces/{wks}/mailboxes?limit=300`.
> - Profile pic: `primeforge_update_mailbox({id, profilePictureUrl})` accepts an **external URL** (catbox.moe). The update response echoes `""` — **verify with `primeforge_get_mailbox`**; don't retry.
> - **Primeforge → Smartlead connect requires the Smartlead login = USER step** (hard agent boundary).

Use this skill only when locked `run_state.infrastructure_stack = dynadot_primeforge`, `run_state.registrar = Dynadot`, and `run_state.mailbox_provider = Primeforge`, unless the user explicitly changes providers.

This is the Dynadot registrar path for buying domains, then purchasing Google Workspace or Microsoft 365 inboxes through Primeforge.

This workflow keeps the order clean: buy domains in Dynadot first, then connect those purchased domains in Primeforge, then set up inboxes. Do not block registrar work with Primeforge checks unless Primeforge is the system buying the domains.

## Material Decision Rule

When this skill reaches a material fork, name the realistic options, recommend the strongest path, and explain why the main alternatives are weaker before committing.

Ask before choices that affect spend, provider routing, source of truth, list quality, campaign direction, client-facing output, live systems, scraping or account risk, or legal/compliance risk. For low-risk reversible choices, state the recommendation and proceed.

Do not turn failed or unsafe paths into user-facing options. If this skill's QA rules or stop gates reject a path, filter it out and explain the blocker only when useful.

When asking the user, use the Claude Desktop native Interactive Inputs / Choice Prompts pattern from /clarification-first: recommended option first, short choices, and Custom answer last when a custom answer is plausible.

## Interaction Policy

Defers to `/autonomous-execution-policy`. Under `run_state.execution_mode = auto_execute` (the operator's default), proceed without pausing: pick the strongest option per this skill's rubric, record it to `run_state`/profile, and continue — never re-ask a decision already in `run_state`, the profile, memory, or the operator's latest message. Spend still gates on the single upfront `run_state.spend_ceiling_usd` — autonomy auto-approves domain and mailbox purchases only while the running total stays within that ceiling, and stops the moment a charge would exceed it; it never means unlimited spend. Other hard-stops still apply (live send, credentials/standing billing, provider/source-of-truth change, safety gates), and on a long async wait (provisioning, DNS/WHOIS propagation) background-poll and move to other productive work — never idle.

---

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short — record status, not raw output. Full protocol: `client-activity-log.md`.

## Mailbox Mix Hard Gate

Before any availability check, domain purchase, inbox purchase, provider setup, workspace capacity check for ordering, or spend approval, check `run_state.mailbox_mix_strategy`.

- If it exists, use the saved Google Workspace / Microsoft 365 purchase mix.
- If it is missing, stop and run `/mailbox-mix-strategy` before continuing. That skill owns the direct-start question (ICP-size guess / balanced default / manual override), the guess-vs-evidence wording, and the `INBOXES_PER_DOMAIN=2` rule.

Do not silently default to first-half Google and second-half Microsoft for a live setup.

---

## Run Variables

```bash
CLIENT_NAME=Acme
BRAND_KEYWORD=acme
TARGET_PRIMEFORGE_WORKSPACE_NAME=Acme
PRIMEFORGE_WORKSPACE_ID=wks_xxxxxxxxxxxxxxxxxxxx  # required only when using MCP or REST calls that ask for workspaceId
CLIENT_WEBSITE=https://www.acme.com              # required for Primeforge domain forwarding during connect
REGISTRAR=dynadot
DOMAIN_COUNT=12
INBOXES_PER_DOMAIN=2
SENDER_FIRST_NAME=Jane
SENDER_LAST_NAME=Smith
PROVIDER_PLAN=<required from run_state.mailbox_mix_strategy>
SENDING_PLATFORM=EMAILBISON|SMARTLEAD|INSTANTLY|OTHER
```

Provider plan options:

- explicit ranges from `/mailbox-mix-strategy`, for example `GOOGLE_DOMAINS=1-4` and `MICROSOFT_DOMAINS=5-12`
- `all GOOGLE`, only when the saved strategy or manual override says to buy only Google Workspace mailboxes
- `all MICROSOFT`, only when the saved strategy or manual override says to buy only Microsoft 365 mailboxes

Keep `INBOXES_PER_DOMAIN=2` unless the user explicitly changes the operating model. More inboxes per domain is not a clever scale hack. It concentrates risk.

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

### Primeforge

Primeforge can be operated through the app UI and, where available, through the Forge MCP Server. Do not invent private API endpoints.

Store:

```bash
PRIMEFORGE_API_KEY=...
TARGET_PRIMEFORGE_WORKSPACE_NAME=Acme
PRIMEFORGE_WORKSPACE_ID=wks_xxxxxxxxxxxxxxxxxxxx
CLIENT_WEBSITE=https://www.acme.com
```

If using the Forge MCP Server, include only the keys you actually use:

```bash
FORGE_MCP_URL=https://mcp.salesforge.ai/mcp
PRIMEFORGE_API_KEY=...
```

Use the Primeforge header exactly when configuring the remote MCP server:

```bash
claude mcp add salesforge --transport streamable-http --url https://mcp.salesforge.ai/mcp --header "X-Primeforge-Key: <PRIMEFORGE_API_KEY>"
```

Primeforge is the mailbox infrastructure layer. The chosen sending platform is the sender management and warmup layer. Do not add a separate warmup tool to this workflow unless the user explicitly changes the operating model.

Primeforge domain connect requires the browser app in current production runs. Do not promise full API autonomy for domain connection. The reliable path is browser-assisted setup plus verification.

### API Reality Check

The public `DarkhorseOne/PrimeForgeApiPortal` repo is a Docusaurus/ReDoc portal for OpenAPI specs. It is not enough by itself to provision cold email inboxes.

What it shows:

- JWT auth pattern: `Authorization: Bearer <access_token>`
- organization/workspace-style endpoints in the auth service
- billing/subscription-style endpoints
- several unrelated services such as HR, CRM, file service, store tracking, and UK compliance

What it does not show:

- mailbox creation endpoint
- domain connection endpoint
- DNS instruction endpoint
- SPF/DKIM/DMARC record endpoint
- mailbox credential export endpoint
- native EmailBison or Smartlead export endpoint

Use that repo only as weak supporting evidence for auth and organization context. Do not use its HR, CRM, billing, or file-service endpoints as if they create inboxes. If Primeforge exposes a real mailbox API in the logged-in account or MCP tools, use that. Otherwise use browser/manual Primeforge setup and verify the output.

---

## Registrar Preflight

Run this before checking availability or buying domains. This preflight is only for Dynadot because Dynadot is the system spending registrar money.

1. Verify Dynadot access:

```http
GET https://api.dynadot.com/api3.json?key=<DYNADOT_API_KEY>&command=account_info
```

2. Verify Dynadot balance:

```http
GET https://api.dynadot.com/api3.json?key=<DYNADOT_API_KEY>&command=get_account_balance
```

Do not buy domains if Dynadot credentials, IP whitelist, balance/payment readiness, or explicit spend approval are missing. Primeforge checks happen after the purchased-domain list exists because Primeforge is not buying the domains in this workflow.

---

## Spend Gate

Dynadot exposes wallet balance, but still ask for an explicit spend gate because this step spends money.

After availability returns prices, calculate:

```text
domain_total = sum(selected domain prices)
```

Ask exactly:

```text
Domain purchase approval needed.

A. [Recommended] Review the final domain list and cost before buying
B. Approve up to $<domain_total> for Dynadot domain purchases
C. Stop before purchase
D. Custom answer
```

If the user does not choose the explicit approval option, stop before purchase.

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

Dynadot search supports up to 100 domains per request:

```http
GET https://api.dynadot.com/api3.json?key=<key>&command=search&show_price=1&currency=USD&domain0=goacme.com
```

Filter to available domains under the price cap.

### 3. Confirm Balance And Purchase Domains

Show selected domains, prices, total estimated domain cost, and the spend question. Only proceed after exact `YES`.

Register one domain per request:

```http
GET https://api.dynadot.com/api3.json?key=<key>&command=register&domain=goacme.com&duration=1
```

Save the purchased list immediately.

### 4. Verify Primeforge Workspace And Mailbox Plan

Use the saved purchased-domain list as the source of truth. Do not ask Primeforge to create domains that were not actually bought.

Log into `https://app.primeforge.ai` and confirm:

- the active workspace is `TARGET_PRIMEFORGE_WORKSPACE_NAME`
- the account can create or order Google Workspace and Microsoft 365 mailboxes
- there are enough mailbox slots for:

```text
required_mailboxes = purchased_domain_count * INBOXES_PER_DOMAIN
```

If using Forge MCP, test the connection now:

```text
List my Primeforge domains.
List my Primeforge mailboxes.
```

If the tool returns data from the wrong workspace, stop. Wrong workspace setup is still a failure, even if the registrar work succeeded.

Map the purchased domains to provider groups:

```text
goacme.com     GOOGLE      {firstname}@goacme.com, {firstnamelastname}@goacme.com
tryacme.com    MICROSOFT   {firstname}@tryacme.com, {firstnamelastname}@tryacme.com
```

Confirm in Primeforge:

- the required provider mix is available
- the account supports the purchased domain count
- the chosen mailbox names are acceptable
- DNS will be handled by Primeforge automation or by records Primeforge provides

If using MCP tools such as `primeforge_list_domains` or `primeforge_list_mailboxes`, do not trust a list response that only shows the first 10 rows for a larger run. Verify the full purchased-domain count through the Primeforge UI, domain-specific mailbox queries, or another account-visible export. A 10-row list for a 12-domain run is a tooling cap, not proof that two domains are missing.

Confirm the sending-platform handoff path:

- Confirm `SENDING_PLATFORM` from onboarding or the previous conversation.
- If `EMAILBISON`, confirm whether the transfer will be native integration, CSV import, EmailBison API creation, or manual sender entry.
- If `SMARTLEAD`, confirm whether the transfer will be native integration, CSV import, Smartlead API creation, or manual OAuth/SMTP connection.
- Assume Primeforge has no native integration to the chosen sending platform unless the account clearly shows one.
- Confirm Primeforge can expose every mailbox credential needed by the chosen platform.
- Confirm the chosen platform API key and base URL or workspace access are ready.

If Primeforge cannot support the exact provider mix, stop and ask whether to change the provider plan or use another mailbox provider. Do not silently flip Google to Microsoft or Microsoft to Google.

If no import path into the chosen platform is confirmed, stop before ordering inboxes. Buying inboxes without a clean handoff is half a setup.

### 5. Hand Domains To Primeforge And Set Up Inboxes

Connect the purchased domains in the correct Primeforge workspace, then set up the inboxes for each domain.

### Sender persona (resolve before creating any inbox)

One realistic human persona per client by default. Pick (or generate) a single real-looking full name and use it consistently across **every domain, every inbox, and every inbox provider** (Primeforge and Zapmail alike). Each domain still gets two inboxes — `{firstname}@domain` and `{firstnamelastname}@domain` — but both belong to that same one person. Do not generate a different persona per domain.

- If the client provided sender name(s), use exactly those. Otherwise generate one realistic full name and treat it as the locked persona. Never use a clearly-fake AI name or a fake AI profile picture.
- **Never** use a generic/role mailbox as the sender: no `team@`, `info@`, `hello@`, `sales@`, `admin@`, and never a display name like "{Company} Team". Those read as a company alias, not a person, and kill cold-email trust. A mailbox like `team@example.com` ("ExampleCo Team") is the exact failure this rule exists to prevent.
- **Record the chosen persona in the client profile** under `run_state.sender_personas` so every rerun reuses it and can never silently fall back to a placeholder. If the profile has no recorded persona, generate one and write it back before creating inboxes. See memory `cold-email-sender-identity-preference`.
- **HARD RULE — generate the profile assets the moment the persona name is locked, BEFORE any mailbox is created.** Run `/mailbox-profile-generator` to produce, in order: (1) the OpenAI realistic headshot, (2) the downloaded company logo, (3) the headshot↔logo crossfade GIF (Primeforge renders animated GIF profile pictures). One shared headshot + one shared GIF for the whole client (one persona = identical file on every mailbox). Do **not** create mailboxes until these assets exist — they get applied to each mailbox before export. Never provision faceless mailboxes and backfill photos later.

Primeforge domain connect is browser/UI required in the current observed workflow:

1. Open `https://app.primeforge.ai`.
2. Switch to `TARGET_PRIMEFORGE_WORKSPACE_NAME`.
3. Go to Domains > Connect Domain.
4. Enter the purchased domain.
5. Fill the Domain Forwarding field with `CLIENT_WEBSITE` before payment. Do not leave it blank.
6. Skip or uncheck the DMARC notification email option.
7. Pay or initiate the connect action. Expect a Primeforge domain-connect fee per domain.
8. Repeat for every purchased domain, then let propagation run in the background.

For each domain, set:

- provider: `GOOGLE` or `MICROSOFT`
- inboxes per domain: `2`
- mailbox local parts (both belong to the **same recorded persona** — see "Sender persona" above; resolve from the locked persona, never a placeholder, the company name, or a role word):
  - `{firstname}@domain`
  - `{firstnamelastname}@domain`
- ownership/contact fields required by Primeforge

If using Forge MCP, ask for domain and mailbox creation through Primeforge, then verify the returned domain and mailbox list. If using the UI, use browser automation or manual steps.

If mailbox creation returns an error like "some mailboxes already exist", do not retry blindly. Primeforge may have already created the requested mailboxes during domain connect. Query that domain's mailbox list or check the UI, confirm the exact expected addresses exist, and treat it as success only after the count and addresses match.

### 6. Configure DNS

Primeforge DNS is domain-specific by default. Do not touch Dynadot until every target domain has its own DNS instruction captured.

Hard rule:

1. Open each Primeforge domain or status detail screen.
2. Copy that domain's own `Set nameserver values` or DNS record instructions.
3. Build a domain-to-DNS manifest before changing the registrar.
4. Apply registrar changes one domain at a time from the manifest.

Manifest shape:

| Domain | Primeforge DNS instruction | Dynadot action |
| --- | --- | --- |
| `<domain-a>` | `<ns-a-1>`, `<ns-a-2>` | Update only `<domain-a>` |
| `<domain-b>` | `<ns-b-1>`, `<ns-b-2>` | Update only `<domain-b>` |

Use the DNS path Primeforge gives for each individual domain:

- If Primeforge gives nameservers, update that domain's Dynadot nameservers to exactly the values in that domain's manifest row.
- If Primeforge gives DNS records, add the exact SPF, DKIM, DMARC, MX, and tracking records it provides for that domain.
- If Primeforge handles DNS through its own automation, verify that specific domain shows as connected in Primeforge before moving on.

Do not use Primeforge `Bulk DNS update`, and do not copy one active domain's nameservers across all domains, unless every target domain has been opened and each domain-specific screen shows the same exact hosts. Same registrar, same workspace, or same mailbox provider is not enough proof.

Observed Primeforge runs have used Cloudflare nameservers such as:

```text
celeste.ns.cloudflare.com
jermaine.ns.cloudflare.com
```

These are examples, not defaults. Use them only if Primeforge shows them for that exact domain. Never use Zapmail ClouDNS nameservers such as `pns61.cloudns.net` on a Primeforge setup unless Primeforge itself shows them for that exact domain.

Dynadot per-domain nameserver update pattern, default for Primeforge:

```http
GET https://api.dynadot.com/api3.json?key=<key>&command=set_ns&domain=goacme.com&ns0=<primeforge-ns-for-goacme-1>&ns1=<primeforge-ns-for-goacme-2>
```

Repeat one `set_ns` call per domain using that domain's manifest row.

Dynadot batching is allowed only when every batched domain has the exact same Primeforge-provided nameservers after per-domain verification. If batching is proven safe, do not encode commas as `%2C`; in Python use `urlencode(params, safe=",")`.

### 7. Poll DNS And Mailbox Status

Do not wait silently.

Every 10 minutes, check:

- domain status in Primeforge
- mailbox provisioning status
- DNS validation status
- SPF, DKIM, and DMARC presence

Expected DNS checks:

```bash
dig TXT <domain> +short
dig TXT _dmarc.<domain> +short
dig MX <domain> +short
```

DKIM selector varies by provider. Use the selector Primeforge provides. Do not hardcode `default` unless Primeforge shows that selector for the domain.

If no domains validate after 30 minutes, print exact statuses and stop for diagnosis. Silent waiting is just hiding a setup failure.

Mailbox provisioning can move through pending, scheduled, configuring auth, and active states. Do not export or hand off mailboxes until every target mailbox is `active`. Primeforge export paths may skip non-active mailboxes silently, which creates a fake "success" with missing senders.

### 8. Sending Platform Import Readiness

Primeforge creates the mailbox infrastructure. EmailBison or Smartlead controls warmup, depending on what was chosen during onboarding. The Primeforge job is done only when the mailbox credentials are ready to import into that chosen platform.

Before importing into the chosen platform, verify:

- all expected inboxes exist
- login/auth method is available
- SPF, DKIM, DMARC pass
- no inbox is flagged, blocked, or disconnected
- each mailbox has the data the chosen platform needs:
  - email address
  - provider type
  - SMTP host, port, username, and password or app password when SMTP is used
  - IMAP host, port, username, and password or app password when IMAP is used
  - OAuth connection instructions if SMTP/IMAP credentials are not available
  - from name

If Primeforge cannot expose the required credentials, stop and use browser/manual OAuth connection in the chosen platform. Do not pretend a CSV import will work without credentials.

### 9. Hand Off To The Chosen Sending Platform

Import ready inboxes into the sending platform selected during onboarding or the previous conversation.

Preferred order:

1. Native Primeforge integration to the chosen platform, only if the account clearly has it.
2. CSV import using exported Primeforge mailbox credentials.
3. API sender creation using Primeforge mailbox credentials.
4. Manual sender creation using OAuth or credentials copied from Primeforge.

CSV should include at minimum:

```csv
email,from_name,provider,smtp_host,smtp_port,smtp_username,smtp_password,imap_host,imap_port,imap_username,imap_password,domain,tag
```

**HARD RULE — profile gate before import.** Do **not** import/export ANY mailbox into the sending tool
(Smartlead/EmailBison/Instantly) until **every** created mailbox has its profile picture applied at the
provider — the **animated GIF wherever the provider supports it (both Primeforge and Zapmail do), falling
back to the plain static headshot image only where a provider/mailbox genuinely can't take a GIF**. Apply
MCP-first, browser only as a fallback. One faceless mailbox means the whole fleet is not-ready-to-import;
resolve photos first, then import.

After import, branch by `SENDING_PLATFORM`:

- `EMAILBISON`: run `/emailbison-inbox-manager` to confirm sender emails exist, run MX/auth checks, start warmup, apply signatures, and tag senders.
- `SMARTLEAD`: run `/smartlead-inbox-manager` to confirm inboxes exist, enable warmup with the agreed ramp, apply signatures, and tag inboxes.
- `INSTANTLY` or other: stop after Primeforge mailbox readiness and use that platform's native import and warmup workflow.

Direct Primeforge auto-export with a browser Firebase JWT is an EmailBison-only fallback, not the default Primeforge handoff. Use it only when `SENDING_PLATFORM=EMAILBISON`, all target mailboxes are `active`, and the visible Primeforge/EmailBison account flow requires that export path. Get a fresh JWT from the logged-in browser session; do not use `PRIMEFORGE_API_KEY` or the MCP header key as a Bearer token. If a Primeforge MCP export tool strips required EmailBison fields, use direct REST with placeholders only:

```bash
curl -s -X POST "https://api.primeforge.ai/workspaces/<PRIMEFORGE_WORKSPACE_ID>/mailboxes/auto-export" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <PRIMEFORGE_FIREBASE_JWT>" \
  -d '{
    "platformLogin": "<EMAILBISON_LOGIN_EMAIL>",
    "platformPassword": "<EMAILBISON_LOGIN_PASSWORD>",
    "platformWorkspace": "<EMAILBISON_WORKSPACE_NAME>",
    "platformAppUrl": "<EMAILBISON_INSTANCE_URL>",
    "platformClientId": "<EMAILBISON_CLIENT_ID>",
    "exportPlatform": "emailbison",
    "excludedIds": [],
    "includedIds": []
  }'
```

Never present that REST export path for Smartlead, Instantly, or other sending platforms.

Start real sending only after the chosen platform's warmup policy is met. Primeforge being done does not mean the inboxes are ready to send.

---

## Browser Fallback

Use browser automation when MCP or API access cannot finish:

- workspace selection
- domain connect, including required forwarding URL and skipped DMARC notification email
- mailbox ordering
- provider assignment
- DNS instruction retrieval
- DNS validation review
- export or credential download
- sender import into the chosen platform if Primeforge has no native export

Fallback steps:

1. Open `https://app.primeforge.ai`.
2. Switch to `TARGET_PRIMEFORGE_WORKSPACE_NAME`.
3. Connect each purchased domain.
4. Fill Domain Forwarding with `CLIENT_WEBSITE` before payment.
5. Skip or uncheck the DMARC notification email option.
6. Select Google Workspace or Microsoft 365 per provider plan.
7. Create 2 inboxes per domain.
8. Open each domain/status detail and copy the per-domain DNS instructions into a manifest.
9. Apply each manifest row in Dynadot one domain at a time. Do not use Primeforge `Bulk DNS update`, and do not use a Dynadot batch unless the manifest proves every target has the same exact hosts.
10. Re-open each domain in Dynadot and verify the stored nameservers or records match the manifest, then return to Primeforge and verify status.
11. Export or copy mailbox credentials for the chosen sending platform.
12. Import or manually add the senders in the chosen sending platform.
13. Start warmup in the chosen platform.

If browser automation is unavailable, give exact manual steps and the affected domain list. Require the operator to open each Primeforge domain/status detail, copy each domain's own DNS instructions into a manifest, apply each manifest row in Dynadot one domain at a time, verify Dynadot matches the manifest, then verify public DNS and Primeforge status.

---

## Escalation Rules

- Same provider operation fails 3 times: stop with `ESCALATION NEEDED`, exact error, domains, workspace, provider, and needed manual action.
- Primeforge workspace cannot be proven: stop before ordering inboxes.
- Primeforge cannot support selected provider mix: stop and ask whether to change the provider plan or use another mailbox provider.
- DNS instructions are missing, inconsistent, or Primeforge bulk DNS conflicts with per-domain detail screens: stop and contact Primeforge support. Do not improvise DNS or copy nameservers from another domain.
- Required action missing: print `PERMISSION NEEDED: This action requires admin access to <system>. Please log in as admin or provide admin credentials.`
- Any step takes 2x expected time: print diagnostics, not silence.

---

## Quick Reference

| Action | Method | URL or location |
|---|---|---|
| Dynadot account info | GET | `https://api.dynadot.com/api3.json?key=KEY&command=account_info` |
| Dynadot search | GET | `https://api.dynadot.com/api3.json?key=KEY&command=search&show_price=1&domain0=...` |
| Dynadot register | GET | `https://api.dynadot.com/api3.json?key=KEY&command=register&domain=X&duration=1` |
| Dynadot nameservers | GET | `https://api.dynadot.com/api3.json?key=KEY&command=set_ns&domain=X,Y&ns0=...` |
| Primeforge app | Browser | `https://app.primeforge.ai` |
| Forge MCP | MCP | `https://mcp.salesforge.ai/mcp` |
| EmailBison app | Browser/API | `EMAILBISON_BASE_URL` |
| Smartlead app | Browser/API | `SMARTLEAD_API_KEY` |

---

## Related Skills

- `/spaceship-primeforge-domain-setup` - alternate registrar path
- `/mailbox-profile-generator` - **the moment the persona name is locked, BEFORE creating mailboxes**, generate the realistic headshot + company logo + crossfade GIF; apply to every mailbox before export (MCP first, browser only as a fallback)
- `/emailbison-inbox-manager`, `/smartlead-inbox-manager` - import Primeforge mailboxes into the chosen platform, start warmup, apply signatures, and tag senders
- `/email-deliverability-audit` - check SPF, DKIM, DMARC, and domain health

