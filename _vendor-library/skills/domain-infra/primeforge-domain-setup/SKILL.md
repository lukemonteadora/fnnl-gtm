---
name: primeforge-domain-setup
description: "Public guide: Configure a client-agnostic Primeforge-only cold email infrastructure run with domain purchase, Primeforge workspace proof, provider-aware mailbox ordering, DNS validation, mailbox credential export, and handoff to the sending platform chosen during onboarding. Use when buying domains and purchasing Google Workspace or Microsoft 365 inboxes entirely through Primeforge."
---

# Cold Email Domain Setup: Primeforge (Domain Purchase + Mailboxes)

> ⚠️ **Read `coldoutbound-gotchas.md` before you start.** Most-bitten on Primeforge:
> - `primeforge_list_domains`/`list_mailboxes` MCP **cap at 10, no offset** — pull the full inventory from the logged-in browser tab via the Firebase token → `api.primeforge.ai/workspaces/{wks}/mailboxes?limit=300` (`{domainsWithMailboxes:[{domain,mailboxes}]}`).
> - Profile pic: `primeforge_update_mailbox({id, profilePictureUrl})` accepts an **external URL** (catbox.moe; Primeforge hotlinks it). The update response echoes `""` — **verify with `primeforge_get_mailbox`** (async); don't retry.
> - **Primeforge → Smartlead connect requires the Smartlead login = USER step** (hard agent boundary).

Use this skill only when locked `run_state.infrastructure_stack = primeforge_native`, `run_state.registrar = Primeforge`, and `run_state.mailbox_provider = Primeforge`, unless the user explicitly changes providers.

Hard guard: do not use this skill for `Primeforge + Zapmail`. Primeforge domain purchase is a Primeforge-native bundled domain and mailbox path. If the user wants Zapmail mailboxes, use a Dynadot or Spaceship registrar path instead.

This workflow buys domains inside Primeforge, then purchases Google Workspace or Microsoft 365 inboxes through the same Primeforge account. No external domain registrar is involved.

Because Primeforge owns the domain from the moment of purchase, there is no separate domain-connect step and no external nameserver update. The DNS failure mode here is different from the Spaceship path: the risk is not a cross-system handoff error, it is an unverified Primeforge workspace, wrong provider mix, or mailboxes exported before they reach `active` status. Resolve those before moving forward.

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

Set these before starting. Do not hardcode a client into the skill.

```bash
CLIENT_NAME=Acme
BRAND_KEYWORD=acme
TARGET_PRIMEFORGE_WORKSPACE_NAME=Acme
PRIMEFORGE_WORKSPACE_ID=wks_xxxxxxxxxxxxxxxxxxxx  # required only when using MCP or REST calls that ask for workspaceId
CLIENT_WEBSITE=https://www.acme.com              # required for Primeforge domain forwarding during setup
REGISTRAR=primeforge
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

Keep `INBOXES_PER_DOMAIN=2` unless the user explicitly asks for another number. More inboxes per domain may look efficient on a spreadsheet. In practice, it raises the blast radius when one domain gets weak.

---

## Required Credentials

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

Primeforge is both the registrar and the mailbox infrastructure layer in this workflow. The chosen sending platform is the sender management and warmup layer. Do not add a separate warmup tool to this workflow unless the user explicitly changes the operating model.

### API Reality Check

The public `DarkhorseOne/PrimeForgeApiPortal` repo is a Docusaurus/ReDoc portal for OpenAPI specs. It is not enough by itself to provision cold email inboxes.

What it shows:

- JWT auth pattern: `Authorization: Bearer <access_token>`
- organization/workspace-style endpoints in the auth service
- billing/subscription-style endpoints
- several unrelated services such as HR, CRM, file service, store tracking, and UK compliance

What it does not show:

- mailbox creation endpoint
- domain purchase endpoint
- DNS instruction endpoint
- SPF/DKIM/DMARC record endpoint
- mailbox credential export endpoint
- native EmailBison or Smartlead export endpoint

Use that repo only as weak supporting evidence for auth and organization context. Do not use its HR, CRM, billing, or file-service endpoints as if they create inboxes or buy domains. If Primeforge exposes a real domain purchase or mailbox API in the logged-in account or MCP tools, use that. Otherwise use browser/manual Primeforge setup and verify the output.

---

## Primeforge Domain Purchase Preflight

Run this before searching availability or buying domains.

1. Log into `https://app.primeforge.ai` and confirm the active workspace is `TARGET_PRIMEFORGE_WORKSPACE_NAME`.
2. Confirm the account has domain purchase capability. If the Domains section shows a purchase or search option, the account is ready. If it is absent or blocked by plan tier, stop and ask the user to upgrade or select a different registrar.
3. Confirm `CLIENT_WEBSITE` is set. Domain forwarding requires a destination URL. Do not start purchases with a blank forwarding field.
4. If using Forge MCP, test the connection now:

```text
List my Primeforge domains.
List my Primeforge mailboxes.
```

If the tool returns data from the wrong workspace, stop:

```text
DIAGNOSIS: Primeforge key or session is not scoped to the target workspace.
Switch to <workspace>, regenerate or replace the key if needed, and re-run the preflight.
```

Do not proceed to availability search or domain purchase until the workspace, domain purchase capability, and `CLIENT_WEBSITE` are confirmed.

---

## Spend Gate

Before domain purchase, estimate:

```text
domain_total = DOMAIN_COUNT * $[FILL: Primeforge domain price per domain]
```

If Primeforge's domain search returns exact prices, use those prices instead of the estimate.

Ask the user exactly:

```text
Primeforge domain purchase approval needed.

A. [Recommended] Review the final domain list and cost before buying
B. Approve up to $<domain_total> for Primeforge domain purchases
C. Stop before purchase
D. Custom answer
```

If the user does not choose the explicit approval option, stop before buying domains.

---

## Workflow

### 1. Generate Domain Candidates

Use the brand keyword plus the tiered naming strategy.

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

### 2. Search Availability in Primeforge

Use Primeforge's domain search in the app UI or, if available, the Forge MCP domain search tool. Do not use any external registrar API.

Filter the results to available domains under the price cap. Generate more candidates from the lists above if the initial batch does not produce enough available names.

### 3. Confirm and Purchase Domains in Primeforge

Show the selected domains, individual prices, total estimated cost, and the spend question. Only proceed after exact `YES`.

Purchase domains through Primeforge:

- If using the Primeforge UI: go to Domains > Buy/Search, select each available domain, complete checkout one domain at a time or in a batch if Primeforge supports it.
- If using Forge MCP: invoke the domain purchase tool for each domain.

Wait for each domain to show a confirmed/registered status in Primeforge before proceeding. Do not assume a checkout click means registration is complete; Primeforge may process purchases asynchronously.

Save the purchased-domain list immediately. This list is the source of truth for every step that follows.

### 4. Verify Primeforge Workspace and Mailbox Plan

Use the saved purchased-domain list as the source of truth. Do not set up mailboxes for domains that were not actually purchased.

Confirm in Primeforge:

- the active workspace is `TARGET_PRIMEFORGE_WORKSPACE_NAME`
- the account can create or order Google Workspace and Microsoft 365 mailboxes
- there are enough mailbox slots for:

```text
required_mailboxes = purchased_domain_count * INBOXES_PER_DOMAIN
```

Map the purchased domains to provider groups:

```text
goacme.com     GOOGLE      {firstname}@goacme.com, {firstnamelastname}@goacme.com
tryacme.com    MICROSOFT   {firstname}@tryacme.com, {firstnamelastname}@tryacme.com
```

Confirm in Primeforge:

- the required provider mix is available
- the account supports the purchased domain count
- the chosen mailbox names are acceptable
- DNS will be handled by Primeforge automation (expected, since Primeforge owns the domains)

If using MCP tools such as `primeforge_list_domains` or `primeforge_list_mailboxes`, do not trust a list response that only shows the first 10 rows for a larger run. Verify the full purchased-domain count through the Primeforge UI, domain-specific mailbox queries, or another account-visible export. A 10-row list for a 12-domain run is a tooling cap, not proof that two domains are missing.

Confirm the sending-platform handoff path:

- Confirm `SENDING_PLATFORM` from onboarding or the previous conversation.
- If `EMAILBISON`, confirm whether the transfer will be native integration, CSV import, EmailBison API creation, or manual sender entry.
- If `SMARTLEAD`, confirm whether the transfer will be native integration, CSV import, Smartlead API creation, or manual OAuth/SMTP connection.
- Assume Primeforge has no native integration to the chosen sending platform unless the account clearly shows one.
- Confirm Primeforge can expose every mailbox credential needed by the chosen platform.
- Confirm the chosen platform API key and base URL or workspace access are ready.

If Primeforge cannot support the exact provider mix, stop and ask whether to change the provider plan or use another mailbox provider. Do not silently change the setup because a button was easier to click.

If no import path into the chosen platform is confirmed, stop before ordering inboxes. Buying inboxes without a clean handoff is half a setup.

### 5. Set Up Inboxes

Because Primeforge owns the domains from purchase, there is no separate domain-connect step. The purchased domains are already inside the Primeforge workspace.

### Sender persona (resolve before creating any inbox)

One realistic human persona per client by default. Pick (or generate) a single real-looking full name and use it consistently across **every domain, every inbox, and every inbox provider** (Primeforge and Zapmail alike). Each domain still gets two inboxes — `{firstname}@domain` and `{firstnamelastname}@domain` — but both belong to that same one person. Do not generate a different persona per domain.

- If the client provided sender name(s), use exactly those. Otherwise generate one realistic full name and treat it as the locked persona. Never use a clearly-fake AI name or a fake AI profile picture.
- **Never** use a generic/role mailbox as the sender: no `team@`, `info@`, `hello@`, `sales@`, `admin@`, and never a display name like "{Company} Team". Those read as a company alias, not a person, and kill cold-email trust. A mailbox like `team@example.com` ("ExampleCo Team") is the exact failure this rule exists to prevent.
- **Record the chosen persona in the client profile** under `run_state.sender_personas` so every rerun reuses it and can never silently fall back to a placeholder. If the profile has no recorded persona, generate one and write it back before creating inboxes. See memory `cold-email-sender-identity-preference`.
- **HARD RULE — generate the profile assets the moment the persona name is locked, BEFORE any mailbox is created.** Run `/mailbox-profile-generator` to produce, in order: (1) the OpenAI realistic headshot, (2) the downloaded company logo, (3) the headshot↔logo crossfade GIF (Primeforge renders animated GIF profile pictures). One shared headshot + one shared GIF for the whole client (one persona = identical file on every mailbox). Do **not** create mailboxes until these assets exist — they get applied to each mailbox before export. Never provision faceless mailboxes and backfill photos later.

For each domain:

1. Open `https://app.primeforge.ai` and switch to `TARGET_PRIMEFORGE_WORKSPACE_NAME`.
2. Navigate to the domain in the Domains section.
3. Fill the Domain Forwarding field with `CLIENT_WEBSITE` before setting up inboxes. Do not leave it blank.
4. Skip or uncheck the DMARC notification email option if prompted.
5. Set the provider: `GOOGLE` or `MICROSOFT` per the provider plan.
6. Create 2 inboxes per domain, both belonging to the **same recorded persona** (see "Sender persona" above) — resolve `{firstname}`/`{lastname}` from the locked persona, never a placeholder, the company name, or a role word:
   - `{firstname}@domain`
   - `{firstnamelastname}@domain`
7. Complete any ownership or contact fields required by Primeforge.
8. Repeat for every purchased domain.

If using Forge MCP, request domain inbox creation through Primeforge and verify the returned domain and mailbox list. If mailbox creation returns an error like "some mailboxes already exist", do not retry blindly. Primeforge may have already created the requested mailboxes. Query that domain's mailbox list or check the UI, confirm the exact expected addresses exist, and treat it as success only after the count and addresses match.

### 6. Validate DNS

Primeforge owns these domains. DNS is managed by Primeforge automatically. There is no external registrar to update.

For each domain:

1. Open the domain or status detail screen in Primeforge.
2. Confirm Primeforge shows the domain as connected or DNS as configured.
3. Record the per-domain DNS status in a manifest before running external checks.

Manifest shape:

| Domain | Primeforge DNS status | External validation |
| --- | --- | --- |
| `<domain-a>` | Connected / Configuring | SPF pass / DKIM pass / DMARC pass |
| `<domain-b>` | Connected / Configuring | SPF pass / DKIM pass / DMARC pass |

Run external DNS checks per domain:

```bash
dig TXT <domain> +short
dig TXT _dmarc.<domain> +short
dig MX <domain> +short
```

On Windows, use PowerShell if `dig` is unavailable:

```powershell
Resolve-DnsName -Type TXT <domain>
Resolve-DnsName -Type TXT _dmarc.<domain>
Resolve-DnsName -Type MX <domain>
```

DKIM selector varies by provider. Use the selector Primeforge shows for each domain. Do not hardcode `default` unless Primeforge shows that selector.

Observed Primeforge runs have used Cloudflare nameservers such as:

```text
celeste.ns.cloudflare.com
jermaine.ns.cloudflare.com
```

These are examples of what Primeforge may assign, not defaults you should set manually. Do not touch nameservers on domains Primeforge purchased; Primeforge controls that assignment.

If DNS records are missing after 30 minutes, print exact statuses and stop for diagnosis. Waiting longer without new evidence is not patience. It is a blindfold.

### 7. Poll DNS and Mailbox Status

Do not wait silently.

Every 10 minutes, check:

- domain status in Primeforge
- mailbox provisioning status
- DNS validation status
- SPF, DKIM, and DMARC presence

If no domains validate after 30 minutes, print exact statuses and stop for diagnosis.

Mailbox provisioning can move through pending, scheduled, configuring auth, and active states. Do not export or hand off mailboxes until every target mailbox is `active`. Primeforge export paths may skip non-active mailboxes silently, which creates a fake "success" with missing senders.

### 8. Sending Platform Import Readiness

Primeforge creates the mailbox infrastructure. EmailBison or Smartlead controls warmup, depending on what was chosen during onboarding. The Primeforge job is done only when the mailbox credentials are ready to import into the chosen platform.

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

### 9. Hand Off to the Chosen Sending Platform

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

Use browser automation when MCP or API access cannot finish the job.

Browser fallback handles:

- workspace selection
- domain search and purchase inside Primeforge
- domain forwarding URL entry and DMARC notification email skip
- mailbox ordering
- provider assignment
- DNS status retrieval from Primeforge domain detail screen
- DNS validation review
- export or credential download
- sender import into the chosen platform if Primeforge has no native export

Steps:

1. Open `https://app.primeforge.ai`.
2. Switch to `TARGET_PRIMEFORGE_WORKSPACE_NAME`.
3. Go to Domains > search/purchase. Search for each candidate domain and complete the purchase. Fill Domain Forwarding with `CLIENT_WEBSITE` before checkout. Skip or uncheck the DMARC notification email option.
4. Wait for all purchased domains to show confirmed status.
5. For each domain, select Google Workspace or Microsoft 365 per provider plan.
6. Create 2 inboxes per domain.
7. Open each domain/status detail and confirm Primeforge DNS is configured. Record per-domain DNS status in the manifest.
8. Run external DNS validation (`dig TXT`, `dig TXT _dmarc`, `dig MX`) per domain. Do not hand off until records pass.
9. Export or copy mailbox credentials for the chosen sending platform.
10. Import or manually add the senders in the chosen sending platform.
11. Start warmup in the chosen platform.

If browser automation is unavailable, say:

```text
Browser automation unavailable. Please manually finish these domains in Primeforge: <domain list>. Log in at app.primeforge.ai, switch to <workspace>, search and purchase the domains, fill Domain Forwarding with <CLIENT_WEBSITE>, skip the DMARC notification email, choose <provider plan>, create 2 inboxes per domain, open each domain/status detail, confirm Primeforge DNS is configured, validate public DNS, then export credentials and import into <SENDING_PLATFORM>.
```

---

## Escalation Rules

- Same operation fails 3 times: stop with `ESCALATION NEEDED`, exact error, domains affected, target workspace, target provider, and the needed manual action.
- Primeforge workspace cannot be proven: stop before ordering inboxes.
- Primeforge domain purchase capability is missing or blocked: stop and ask the user to check their Primeforge plan tier or choose a different registrar.
- Primeforge cannot support selected provider mix: stop and ask whether to change the provider plan or use another mailbox provider.
- DNS instructions are missing, inconsistent, or Primeforge bulk DNS conflicts with per-domain detail screens: stop and contact Primeforge support. Do not improvise DNS.
- Required button or action is missing: print `PERMISSION NEEDED: This action requires admin access to <system>. Please log in as admin or provide admin credentials.`
- Any step takes 2x expected time: run diagnostics and print status. Do not wait silently.

---

## Quick Reference

| Action | Method | URL or location |
|---|---|---|
| Primeforge domain search/purchase | UI or Forge MCP | `https://app.primeforge.ai` > Domains |
| Primeforge mailbox setup | UI or Forge MCP | `https://app.primeforge.ai` > Domains > inbox setup |
| Forge MCP | MCP | `https://mcp.salesforge.ai/mcp` |
| Primeforge DNS status | UI | Domain detail screen in `https://app.primeforge.ai` |
| EmailBison app | Browser/API | `EMAILBISON_BASE_URL` |
| Smartlead app | Browser/API | `SMARTLEAD_API_KEY` |

---

## What To Do Next

**Profile assets — generated up front, applied before export.** Per the HARD RULE in "Sender persona,"
the realistic headshot + company logo + crossfade GIF were generated by `/mailbox-profile-generator` the
moment the persona name was locked. **Apply** the one shared headshot + GIF to every Primeforge mailbox
before warmup/export so each sender looks human from day one. Apply via **MCP first, browser only as a
fallback** (`mcp-tools-routing.md`): try the `salesforge` (Forge) MCP (`primeforge_update_mailbox`;
confirm the exact profile-picture field at point-of-use); only fall back to the Primeforge UI if the MCP
has no working profile-picture write. If the assets don't exist yet, stop and run
`/mailbox-profile-generator` now — never warm up faceless mailboxes.

**HARD RULE — profile gate before import.** Do **not** import/export ANY mailbox into the sending tool
(Smartlead/EmailBison/Instantly) until **every** created mailbox has its profile picture applied at the
provider — the **animated GIF wherever the provider supports it (both Primeforge and Zapmail do), falling
back to the plain static headshot image only where a provider/mailbox genuinely can't take a GIF**. Apply
MCP-first, browser only as a fallback. One faceless mailbox means the whole fleet is not-ready-to-import;
resolve photos first, then import.

Then run the sender-platform manager selected during onboarding:

- `EMAILBISON`: `/emailbison-inbox-manager`
- `SMARTLEAD`: `/smartlead-inbox-manager`
- `INSTANTLY` or `OTHER`: use the selected platform's native import and warmup workflow, then invoke `/cold-email-inbox-tracker` only after import and warmup are confirmed.

After platform warmup starts, wait until the warmup policy is satisfied before sending real campaigns. Skipping warmup is not speed. It is reputation damage with a timestamp.

