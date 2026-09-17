---
name: emailbison-inbox-manager
description: Programmatic sender email management for EmailBison. Use after creating inboxes through Zapmail, Primeforge, or when managing an EmailBison sender fleet. Covers sender emails, warmup, daily limits, signatures, MX checks, active/insurance/retired tags, and campaign sender assignment.
---

# EmailBison Inbox Manager

Use this skill only when locked `run_state.sending_platform = EmailBison`, unless the user explicitly asks for EmailBison sender management outside an active run.

EmailBison calls inboxes **sender emails**. If you call them Smartlead inboxes in scripts, you will confuse the API shape and break the workflow.

This skill manages EmailBison sender emails through the `bison` CLI or direct REST API.

After `/dynadot-zapmail-domain-setup`, `/spaceship-zapmail-domain-setup`, `/dynadot-primeforge-domain-setup`, `/spaceship-primeforge-domain-setup`, or `/primeforge-domain-setup`, this skill is required for EmailBison setups. Without it, inboxes may exist at the provider, but they are not confirmed in EmailBison and warmup has not started.

## Interaction Policy

Defers to `/autonomous-execution-policy`. Under `run_state.execution_mode = auto_execute`, proceed without pausing — pick the strongest option per the rubric, record it, continue; never re-ask a recorded decision; confirm spend once against `run_state.spend_ceiling_usd` then auto-approve within it; stop only for the policy's hard-stops. On a long async wait (e.g. the 2-week warmup, mailbox provisioning), background-poll and move to other productive work — never idle.

The Material Decision Rule below governs under `execution_mode = review_gates`; under `auto_execute` this Interaction Policy wins (the safety hard-stops and the spend ceiling are preserved either way). The ASK prompts in the Primeforge/Zapmail import workflows are likewise `review_gates`-scoped; under `auto_execute`, take the recommended A path (import + start warmup), record it, and continue.

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short — record status, not raw output. Full protocol: `client-activity-log.md`.

## Material Decision Rule

When this skill reaches a material fork, name the realistic options, recommend the strongest path, and explain why the main alternatives are weaker before committing.

Ask before choices that affect spend, provider routing, source of truth, list quality, campaign direction, client-facing output, live systems, scraping or account risk, or legal/compliance risk. For low-risk reversible choices, state the recommendation and proceed.

Do not turn failed or unsafe paths into user-facing options. If this skill's QA rules or stop gates reject a path, filter it out and explain the blocker only when useful.

When asking the user, use the Claude Desktop native Interactive Inputs / Choice Prompts pattern from /clarification-first: recommended option first, short choices, and Custom answer last when a custom answer is plausible.

## Prerequisites

Environment:

```bash
EMAILBISON_API_KEY=your_token_here
EMAILBISON_BASE_URL=https://sequence.yourcompany.co
```

`EMAILBISON_BASE_URL` is the client whitelabel instance URL. Do not use `app.emailbison.com`; there is no universal EmailBison app URL for every workspace.

Recommended CLI setup:

```bash
npm install -g emailbison-cli
bison login --api-key "$EMAILBISON_API_KEY" --base-url "$EMAILBISON_BASE_URL"
bison status --pretty
```

## Routing Rule: MCP vs CLI

Use **MCP** (`mcp__emailbison__*`) when:
- Inspecting or updating <=10 individual sender emails
- Reading warmup stats for a specific sender
- Toggling warmup on/off for a small batch via `call_api`

Use **CLI** (`bison`) when:
- Running bulk MX/DNS health checks across all senders (`bulk-check-mx`)
- Applying warmup limits to 10+ senders in one shot
- Bulk-applying signatures to the entire fleet
- Building the health dashboard (requires pulling multiple data sources efficiently)

## MCP Operations

Load the `mcp__emailbison__*` tools via ToolSearch before calling them.

| Operation | MCP Tool |
|---|---|
| List sender accounts | `call_api` -> extended tool `list_sender_emails` |
| Get warmup stats (single sender) | `call_api` -> extended tool `get_sender_email_warmup_stats` |
| Enable warmup (single/few senders) | `call_api` -> extended tool `update_sender_email_warmup` with `warmup_enabled: true` |
| Disable warmup | `call_api` -> extended tool `update_sender_email_warmup` with `warmup_enabled: false` |
| Check workspace | `mcp__emailbison__get_active_workspace_info` |

Example - enable warmup for a single sender via MCP:

```text
Tool: mcp__emailbison__call_api
Extended tool: update_sender_email_warmup
Body: { "sender_email_id": 42, "warmup_enabled": true, "daily_warmup_limit": 30 }
```

If the `call_api` tool requires discovery first, call `mcp__emailbison__discover_tools` to list all extended tools and confirm the correct parameter shape.

## Core Operations

| Operation | What it does | CLI |
|---|---|---|
| List senders | Shows sender emails and IDs | `bison accounts list --pretty` |
| Check sender | Shows one sender's config | `bison accounts get --senderEmailId <id>` |
| Enable warmup | Turns warmup on | `bison warmup enable --sender-email-ids '[1,2]'` |
| Disable warmup | Turns warmup off | `bison warmup disable --sender-email-ids '[1,2]'` |
| Warmup limit | Sets daily warmup max | `bison warmup update-limits --sender-email-ids '[1,2]' --daily-warmup-limit 30` |
| Daily send limit | Sets campaign send cap | `bison accounts bulk-daily-limits --sender-email-ids '[1,2]' --daily-limit 30` |
| Signature | Bulk-applies sender signature | `bison accounts bulk-signatures --sender-email-ids '[1,2]' --signature "..."` |
| Tags | Adds/removes active/insurance/retired | `bison tags attach-to-sender-emails ...` |
| MX check | Verifies sender setup | `bison accounts bulk-check-mx` |

## Active Vs Insurance

Use the same operating model as the Smartlead path:

- `active` - warmed senders currently assigned to live campaigns.
- `insurance` - warmed senders held in reserve.
- `retired` - damaged, disconnected, or poor-performing senders.

**Rotation batches also apply here (HARD RULE — platform-agnostic).** Every batch of mailboxes is split into
two warmed mirror halves, `Batch N.1` (primary) / `Batch N.2` (backup), balanced per `(provider × type)` cell
with whole domains kept together — the operator's rotating-mailbox-batch strategy so the whole fleet never
sends at once. Apply the `Batch N.1`/`Batch N.2` tags at import alongside the lifecycle tags, attach only the
active half to live campaigns, and swap halves on the biweekly cadence (`/cold-email-weekly-rhythm`). The
canonical definition lives in `/smartlead-inbox-manager` (Rotation batch tags); mirror it on EmailBison tags.

Create tags if missing:

```bash
bison tags create --name active
bison tags create --name insurance
bison tags create --name retired
```

Attach a tag:

```bash
bison tags attach-to-sender-emails --tag-ids '[<tag_id>]' --sender-email-ids '[1,2,3]'
```

Remove a tag:

```bash
bison tags remove-from-sender-emails --tag-ids '[<tag_id>]' --sender-email-ids '[1,2,3]'
```

## Warmup Settings

New senders:

```bash
bison warmup enable --sender-email-ids '[1,2,3]'
bison warmup update-limits --sender-email-ids '[1,2,3]' --daily-warmup-limit 30
```

Insurance senders:

```bash
bison warmup enable --sender-email-ids '[1,2,3]'
bison warmup update-limits --sender-email-ids '[1,2,3]' --daily-warmup-limit 15
```

Active senders:

```bash
bison warmup disable --sender-email-ids '[1,2,3]'
bison accounts bulk-daily-limits --sender-email-ids '[1,2,3]' --daily-limit 30
```

Do not assume warmup can save a weak campaign. Warmup preserves reputation. It does not fix bad targeting, bad copy, or high bounce rates.

Default warmup settings for newly imported Zapmail senders:

- Daily warmup limit: 30 emails/day.
- Provider: private pool, unless the account has a deliberate reason to use another pool.
- Keep warmup running permanently alongside cold sends unless the user explicitly changes the operating model.

## EmailBison MCP Setup

Set up MCP after export is confirmed or when the user wants future EmailBison automation from Claude.

```bash
claude mcp add --transport http --scope user emailbison https://mcp.emailbison.com/mcp \
  --header "Authorization: Bearer <API_TOKEN>" \
  --header "Instance-URL: <EMAILBISON_INSTANCE_URL>"
```

- `API_TOKEN`: create in EmailBison Settings > Developer API with the `api-user` role.
- `EMAILBISON_INSTANCE_URL`: the whitelabel instance URL, for example `https://sequence.yourcompany.co`.
- After adding MCP, verify the connection before relying on MCP tools for warmup changes.

If MCP is unavailable or not configured, use the `bison` CLI or the EmailBison UI. Do not block warmup just because MCP is not ready.

## Signature Template

Default:

```text
{from_name}
{title}
{company}
{address}
```

Required `.env` values for generating the signature:

```bash
SENDER_FIRST_NAME=Jane
SENDER_LAST_NAME=Smith
SENDER_TITLE=Founder
SENDER_COMPANY_NAME=Acme
SENDER_PHYSICAL_ADDRESS=123 Main St, Suite 400, Austin, TX 78701
```

Bulk apply:

```bash
bison accounts bulk-signatures \
  --sender-email-ids '[1,2,3]' \
  --signature "Best,\nJane Smith\nFounder\nAcme\n123 Main St, Suite 400, Austin, TX 78701"
```

Keep signatures plain text or very simple HTML. Fancy signatures are deliverability debt.

## Import Primeforge Mailboxes To EmailBison And Start Warmup

Use this workflow immediately after Primeforge says the mailboxes are provisioned and DNS is verified.

Assume Primeforge has no native EmailBison integration unless the account clearly shows one. The practical paths are CSV import, direct EmailBison API creation, or manual sender entry.

Before doing anything, confirm:

- `EMAILBISON_API_KEY` exists.
- `EMAILBISON_BASE_URL` exists.
- Primeforge mailboxes exist and match the expected count.
- SPF, DKIM, DMARC, and MX are verified for each domain.
- Each mailbox has either SMTP/IMAP credentials or a clear OAuth/manual connection path.

Ask:

```text
Primeforge mailboxes are provisioned. What should I do next?

A. [Recommended] Import them into EmailBison and start EmailBison warmup now
B. Stop before import and warmup
C. Review mailbox and DNS checks first
D. Custom answer
```

If the user chooses B, stop. Say: "Warmup has not started. Come back to `/emailbison-inbox-manager` when you want to import these Primeforge mailboxes into EmailBison."

If the user chooses A, run this workflow:

### 1. Build The Import Sheet

Export from Primeforge if possible. If not, build the sheet manually from the mailbox details.

Minimum columns:

```csv
email,from_name,provider,smtp_host,smtp_port,smtp_username,smtp_password,imap_host,imap_port,imap_username,imap_password,domain,tag
```

Use `insurance` as the default tag for new senders. They should warm before being assigned to live campaigns.

If Primeforge only supports OAuth connection and does not expose SMTP/IMAP credentials, skip CSV and use the manual EmailBison connection path. A CSV without credentials is fake progress.

### 2. Import Or Create Senders In EmailBison

Use the best available path:

- Native Primeforge to EmailBison integration, only if visible in the account.
- EmailBison CSV import if the UI supports the needed fields.
- EmailBison API sender creation if credentials are available.
- Manual sender creation with OAuth if credentials are not available.

Do not continue until every expected sender appears in EmailBison.

### 3. Confirm Senders Appeared In EmailBison

```bash
bison accounts list --pretty
```

Match by sender email/domain. If a sender is missing, fix the import before warmup.

### 4. Collect Sender Email IDs

```bash
SENDER_IDS='[1,2,3]'
```

### 5. Run MX Check

```bash
bison accounts bulk-check-mx
```

If any sender fails MX/auth checks, do not start real sending from that sender. Fix DNS in Primeforge or the registrar first.

### 6. Enable EmailBison Warmup

```bash
bison warmup enable --sender-email-ids "$SENDER_IDS"
bison warmup update-limits --sender-email-ids "$SENDER_IDS" --daily-warmup-limit 30
```

### 7. Apply Signatures

```bash
bison accounts bulk-signatures --sender-email-ids "$SENDER_IDS" --signature "$SIGNATURE"
```

Use a real physical mailing address in the signature. Missing address is a compliance and trust problem.

### 8. Tag As Insurance

```bash
bison tags list --pretty
bison tags create --name insurance
bison tags attach-to-sender-emails --tag-ids '[<insurance_tag_id>]' --sender-email-ids "$SENDER_IDS"
```

If `insurance` already exists, use the existing tag ID. Do not create duplicates.

### 9. Confirm Warmup Started

```bash
bison warmup list --pretty
bison accounts list --pretty
```

Print:

```text
Primeforge mailboxes are imported into EmailBison. Warmup started in EmailBison. These senders are tagged insurance.
Wait 2 weeks before sending real emails.
```

During this ~2-week warmup wait, do NOT idle — per `/autonomous-execution-policy`, background-track warmup health and move on to list/copy work or another client. This does not relax the gate: recheck warmup before the pre-launch gate, and the ≥2-week minimum still blocks real sending.

## Import Zapmail Inboxes To EmailBison And Start Warmup

Use this workflow immediately after Zapmail says the new inboxes are ACTIVE.

Before doing anything, confirm:

- `EMAILBISON_API_KEY` exists.
- `EMAILBISON_BASE_URL` exists.
- If MCP will be used, `EMAILBISON_BASE_URL` matches the MCP `Instance-URL` header.
- `ZAPMAIL_API_KEY` exists.
- EmailBison is linked as a third-party export account in Zapmail.
- Zapmail mailboxes are `ACTIVE`, not `In Progress`. Mailboxes must be ACTIVE before importing to EmailBison — only `ACTIVE` mailboxes have SMTP/IMAP credentials/app-passwords; `In Progress` ones have none yet.

Ask:

```text
Zapmail inboxes are ACTIVE and ready. What should I do next?

A. [Recommended] Export/import them to EmailBison and start warmup now
B. Stop before export/import and warmup
C. Review Zapmail export account and mailbox status first
D. Custom answer
```

If the user chooses B, stop. Say: "Warmup has not started. Come back to `/emailbison-inbox-manager` when you want to import these Zapmail inboxes into EmailBison and start warmup."

If the user chooses A, run this workflow:

### 1. Discover The Linked EmailBison Workspace

Before exporting, resolve which EmailBison workspace to use:

```http
GET https://api.zapmail.ai/api/v2/exports/accounts/third-party?app=EMAILBISON
x-auth-zapmail: <ZAPMAIL_API_KEY>
```

The response lists linked accounts. Each has an identifier in the format `<numeric-id>|<emailbison-api-token>`. Skip any that show `Missing Client ID`; those are broken Google OAuth configurations and cannot be used for Google Workspace exports. If more than one healthy account is linked, ask which workspace to use. Save the full selected value as `EMAILBISON_WORKSPACE_VALUE`.

### 2. Export ACTIVE Zapmail Mailboxes To EmailBison

For a mixed Google + Microsoft setup, run two separate exports. For a single-provider setup, run one with the matching provider header.

Google mailboxes:

```http
POST https://api.zapmail.ai/api/v2/exports/mailboxes
x-auth-zapmail: <ZAPMAIL_API_KEY>
x-service-provider: GOOGLE
Content-Type: application/json

{
  "apps": ["EMAILBISON"],
  "workspace": "<EMAILBISON_WORKSPACE_VALUE>",
  "ids": [],
  "excludeIds": [],
  "tagIds": [],
  "contains": "<sender-name-filter>",
  "status": "ACTIVE"
}
```

Microsoft mailboxes:

```http
POST https://api.zapmail.ai/api/v2/exports/mailboxes
x-auth-zapmail: <ZAPMAIL_API_KEY>
x-service-provider: MICROSOFT
Content-Type: application/json

{
  "apps": ["EMAILBISON"],
  "workspace": "<EMAILBISON_WORKSPACE_VALUE>",
  "ids": [],
  "excludeIds": [],
  "tagIds": [],
  "contains": "<sender-name-filter>",
  "status": "ACTIVE"
}
```

The `workspace` field is required. Omitting it returns `422`. The value must be the full `<numeric-id>|<api-token>` string, not the Zapmail workspace ID.

If this returns `400 Error authenticating`, use the browser fallback:

1. Open `https://app.zapmail.ai/mailboxes/export`.
2. Set the provider toggle in the top-right corner. `G` = Google, Windows icon = Microsoft.
3. Click Export next to the correct EmailBison workspace.
4. Ask the user what to enter for Workspace Name before filling the field.
5. Click Proceed to Export.
6. Switch provider and repeat if needed.
7. Verify at `https://app.zapmail.ai/mailboxes/export/history`: one entry per provider, showing the expected mailbox count.

Do not export `In Progress` mailboxes. That fails silently or creates a cleanup problem.

### 3. Confirm Senders Appeared In EmailBison

Poll EmailBison until the imported senders appear:

```bash
bison accounts list --pretty
```

Match by sender email/domain. If they do not appear, wait a few minutes and check again. Do not continue to warmup until they exist in EmailBison.

### 4. Collect Sender Email IDs

Create a sender ID list from the imported senders:

```bash
SENDER_IDS='[1,2,3]'
```

### 5. Run MX Check

```bash
bison accounts bulk-check-mx
```

If any sender fails MX/auth checks, do not start real sending from that sender. Fix DNS or reconnect in Zapmail first.

### 6. Enable Warmup And Set New-Sender Limit

```bash
bison warmup enable --sender-email-ids "$SENDER_IDS"
bison warmup update-limits --sender-email-ids "$SENDER_IDS" --daily-warmup-limit 30
```

If MCP is connected, you may instead use the EmailBison MCP `update_sender_email_warmup` operation through `call_api` for each sender email. Keep the same starting limit: 30/day.

### 7. Apply Signatures

```bash
bison accounts bulk-signatures --sender-email-ids "$SENDER_IDS" --signature "$SIGNATURE"
```

Use a real physical mailing address in the signature. Missing address is a compliance and trust problem.

### 8. Create Or Resolve Insurance Tag

```bash
bison tags list --pretty
bison tags create --name insurance
```

If `insurance` already exists, use the existing tag ID. Do not create duplicates.

### 9. Attach Insurance Tag

```bash
bison tags attach-to-sender-emails --tag-ids '[<insurance_tag_id>]' --sender-email-ids "$SENDER_IDS"
```

### 10. Confirm Warmup Started

```bash
bison warmup list --pretty
bison accounts list --pretty
```

Print:

```text
Warmup started in EmailBison. These senders are tagged insurance.
Wait 2 weeks before sending real emails.
```

During this ~2-week warmup wait, do NOT idle — per `/autonomous-execution-policy`, background-track warmup health and move on to list/copy work or another client. This does not relax the gate: recheck warmup before the pre-launch gate, and the ≥2-week minimum still blocks real sending.

### 11. Log To The Central Inbox Tracker

After warmup is confirmed, invoke `/cold-email-inbox-tracker` to log these sender emails to the central Google Sheet tracker. Do not create a local `.xlsx` tracker for the main handoff anymore. A local workbook is a stale second source of truth.

Pass the confirmed sender inventory and the locked `run_state` values into the tracker skill:

- `Client name`: from `run_state` or the active profile.
- `Mailbox`: each EmailBison sender email.
- `Domain`: derived from each sender email.
- `Setup Status`: `Warming`.
- `Mailbox Type`: `Google Workspace`, `Microsoft 365`, or `Private Infrastructure` based on the provider split used during provisioning.
- `Domain Provider`: `Spaceship`, `Dynadot`, or `Other` from locked `run_state.registrar`.
- `Inbox Provider`: `Zapmail`, `PrimeForge`, `PremiumInboxes`, or `Other` from locked `run_state.mailbox_provider`.
- `Setup Via`: `MCP (API)` if API/MCP was used, otherwise `Manual`.
- `Setup By`: the operator name.
- `Domain Age`: `Brand New` unless the user explicitly says these are aged domains.

Optional (pass only if known — never block tracker logging on these): inbox rate, domain rate, and sending-platform monthly cost, so the tracker can seed the `💰 Costs` tab. Inventory fields above are required; cost fields are optional.

The tracker skill asks once before generating the Apps Script writer because it mutates live shared tracker state. Do not ask for every field again if the data is already known from this workflow.

## Day 1 After Zapmail Provisioning

This is the shorter checklist version of the import workflow above.

1. Export ACTIVE inboxes from Zapmail to EmailBison using the linked EmailBison `workspace` value and the matching `x-service-provider` header.
2. Confirm they appear as sender emails:

```bash
bison accounts list --pretty
```

3. Check MX records:

```bash
bison accounts bulk-check-mx
```

4. Enable warmup and set conservative limits:

```bash
bison warmup enable --sender-email-ids '[1,2,3]'
bison warmup update-limits --sender-email-ids '[1,2,3]' --daily-warmup-limit 30
```

5. Apply signatures:

```bash
bison accounts bulk-signatures --sender-email-ids '[1,2,3]' --signature "$SIGNATURE"
```

6. Tag as `insurance`.
7. Invoke `/cold-email-inbox-tracker` and log the imported sender emails with `Setup Status = Warming`.

Wait 2 weeks before real sending. During that ~2-week wait, do NOT idle — per `/autonomous-execution-policy`, background-track warmup health and move on to other productive work; recheck warmup before the pre-launch gate. The ≥2-week minimum still blocks real sending.

## Promote Insurance To Active

```bash
# 1. Inspect warmup
bison warmup list --pretty

# 2. Inspect senders
bison accounts list --pretty

# 3. Move selected senders from insurance to active
bison tags remove-from-sender-emails --tag-ids '[<insurance_tag_id>]' --sender-email-ids '[1,2,3]'
bison tags attach-to-sender-emails --tag-ids '[<active_tag_id>]' --sender-email-ids '[1,2,3]'

# 4. Disable warmup and set sending limits
bison warmup disable --sender-email-ids '[1,2,3]'
bison accounts bulk-daily-limits --sender-email-ids '[1,2,3]' --daily-limit 30
```

## Health Dashboard Pattern

There is no single Smartlead-style health endpoint. Build the dashboard from:

```bash
bison accounts list --pretty
bison warmup list --pretty
bison accounts bulk-check-mx
bison campaigns stats --campaign-id <id> --pretty
bison accounts replies --senderEmailId <id> --pretty
```

Minimum health columns:

```text
sender_email, sender_id, tags, warmup_status, daily_limit, daily_warmup_limit, mx_status, campaigns_count, replies_count
```

## Common Gotchas

1. **Instance URL is required.** There is no one base URL for every account.
2. **Sender emails are workspace-bound.** You cannot reuse the same sender in multiple workspaces.
3. **Tags are IDs in API calls.** Resolve tag names to IDs first.
4. **Warmup status is separate from sender config.** Pull both.
5. **Google bulk upload is not first-party supported.** Custom SMTP is the cleanest API path.
6. **Daily limit and warmup limit are different.** Do not confuse them.
7. **Zapmail export `workspace` is not the Zapmail workspace ID.** It is the full EmailBison linked-account value, such as `214|xxxxx`.
8. **Provider filtering matters.** For mixed Google/Microsoft Zapmail pools, export and verify each provider separately.

## What To Do Next

If senders are warmed and tagged `active`, proceed to list-building and then `/emailbison-campaign-upload-public`.

If locked `run_state.sending_platform = Smartlead`, this skill is off-path. Use `/smartlead-inbox-manager` instead.

## Related Skills

- `/emailbison-api` - underlying API reference
- `/emailbison-campaign-upload-public` - attaches active sender emails to a campaign
- `/email-deliverability-audit` - DNS and deliverability audit, with Smartlead-specific parts treated as platform-specific
- `/cold-email-inbox-tracker` - logs warmed EmailBison sender emails to the central Google Sheet tracker after import and warmup confirmation

