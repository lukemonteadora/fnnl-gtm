---
name: smartlead-inbox-manager
description: Smartlead-only inbox management. Use when locked run_state.sending_platform = Smartlead to connect/import inboxes, enable warmup, set the per-mailbox minimum time gap (15 min, never empty), set signatures, tag senders (provenance tags = client / mailbox vendor / registrar; rotation-batch tags = Batch N.1 primary / Batch N.2 backup, a balanced mirror-half split per provider×type; plus lifecycle new/insurance/active/retired), create a per-client client-access entity and assign that client's mailboxes to it (HARD RULE — create via public API, assign via browser) AND restrict the client's reply-category view (HARD RULE — hide the 7 noise/negative categories via the Client Access "Remove Categories" multiselect in the browser), review health, and hand off tracker logging.
---

# Smartlead Inbox Manager

> ✅ **Tags + warmup + reads all run via REST — no browser needed. (Root-caused & fixed 2026-06-10.)** The LeadMagic Smartlead MCP's failures were a **broken-client bug, not an API limit**: only its two write tools ship WRONG routes — `update_email_account_tag`→`POST /email-accounts/{id}/tag` (path doesn't exist) and `create_email_account`→`POST /email-accounts` (real path is `/email-accounts/save`) — so both **404**. **Avoid those 2 MCP tools**; the MCP's ~100 read/analytics/campaign/warmup tools are fine. **Tags are NOT UI-only** — apply via public REST: `POST /api/v1/email-accounts/tag-mapping` `{email_account_ids:[≤25], tag_ids:[…]}` (`?api_key=`) **adds** (idempotent — existing tags return `action:"skipped"`); **`DELETE`** the same path removes; `GET /api/v1/email-accounts/tags` lists tag defs (id+name). Use the bundled, verified tool **`scripts/smartlead-tags.mjs`** (`tags` | `accounts [filter]` | `tag-map <accIds> <tagIds>` | `untag <accIds> <tagIds>`). The browser tag UI (Bulk Update → Management → "Add Tags") is now a **fallback only** (if used: type then CLICK the option, never type+Enter — it concatenates junk like `ExampleCoZapmail`). **Zapmail→Smartlead** export needs a saved Zapmail→Smartlead connection (then no password; warmup auto-enables on connect); **Primeforge→Smartlead** and **CSV import** require entering the Smartlead login/mailbox passwords = **USER steps** (never enter passwords, create accounts, or store login passwords). **Client Access is now hands-free** (verified 2026-06-16, NOT a USER step): create the client via the public API `POST /api/v1/client/save` (takes a *generated* client-portal password, not the Smartlead login) and assign its mailboxes in the browser (already-logged-in UI; the assign endpoint is internal/CORS-blocked to the public key) — see **Client-Access (HARD RULE)** below. Full route table: `smartlead-api.md`; field notes: `coldoutbound-gotchas.md`.

> 🔒 **HARD RULE — native connection type only (Google → `GMAIL`, Microsoft → `OUTLOOK`). NO exceptions for Google/MS.** Every Google or Microsoft mailbox MUST enter Smartlead as a **native OAuth account** (`type:"GMAIL"` / `type:"OUTLOOK"`), connected via the **mailbox provider's native Smartlead export** (Zapmail or Primeforge → **Export → Smartlead**). **NEVER** connect a Google/Microsoft mailbox through Smartlead's direct REST `email-accounts/save` with SMTP/IMAP host + app-password — that yields an inferior `type:"SMTP"` account (worse deliverability, app-password fragility, mangled non-ASCII `from_name`, and a fleet inconsistent with the rest). Direct-REST/SMTP connect is permitted **only** for a genuinely custom host that is neither Google nor Microsoft. If the native export is blocked (no saved provider↔Smartlead connection, and the email+password auth in the provider's Export→Smartlead modal is a USER-only step the agent can't perform), **STOP and have the user enable the connection / run the export — do NOT silently fall back to SMTP.** Always **verify after connect**: `GET /api/v1/email-accounts/{id}` → for a Google/MS mailbox `type` must read `GMAIL`/`OUTLOOK`, never `SMTP`. If it reads `SMTP`, the connection is wrong — remove it and redo via native export. (The warmup REST call below is type-agnostic and fine to use on any account.)

Use this skill only when `run_state.sending_platform = Smartlead`, unless the user explicitly asks to inspect a Smartlead account outside an active run.

Zapmail or Primeforge creates the mailboxes. Smartlead manages sending, warmup, tags, sender health, and campaign assignment.

## Core Operations

| Operation | What to do |
|---|---|
| Connect/import senders | Add newly provisioned inboxes to Smartlead |
| Enable warmup | Start warmup on new senders |
| Set signatures | Apply plain-text signatures with physical address |
| Tag insurance | Mark new warmed senders as reserve capacity |
| Promote active | Move only healthy warmed senders into live sending |
| Retire senders | Remove weak senders from live rotation |
| Health review | Export or inspect warmup, reputation, sent count, blocks, and tags |

Use Smartlead UI, API, MCP, or a verified local script if the user has one. Do not claim bundled local scripts exist unless they are present in `scripts/`.

## Interaction Policy

Defers to `/autonomous-execution-policy`. Under `run_state.execution_mode = auto_execute`, proceed without pausing — pick the strongest option per the rubric, record it, continue; never re-ask a recorded decision; confirm spend once against `run_state.spend_ceiling_usd` then auto-approve within it; stop only for the policy's hard-stops. On a long async wait (e.g. the 2-week warmup, mailbox provisioning), background-poll and move to other productive work — never idle.

The Material Decision Rule below governs under `execution_mode = review_gates`; under `auto_execute` this Interaction Policy wins (the safety hard-stops and the spend ceiling are preserved either way).

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short — record status, not raw output. Full protocol: `client-activity-log.md`.

## Material Decision Rule

When this skill reaches a material fork, name the realistic options, recommend the strongest path, and explain why the main alternatives are weaker before committing.

Ask before choices that affect spend, provider routing, source of truth, list quality, campaign direction, client-facing output, live systems, scraping or account risk, or legal/compliance risk. For low-risk reversible choices, state the recommendation and proceed.

Do not turn failed or unsafe paths into user-facing options. If this skill's QA rules or stop gates reject a path, filter it out and explain the blocker only when useful.

When asking the user, use the Claude Desktop native Interactive Inputs / Choice Prompts pattern from /clarification-first: recommended option first, short choices, and Custom answer last when a custom answer is plausible.

## Tag Convention

Three independent tag dimensions. Apply ALL THREE. A sender carries its provenance tags + one rotation-batch tag (+ a lifecycle tag where the client uses lifecycle tracking).

### Lifecycle tags (sender state)

- `new`: just imported or connected, not ready
- `insurance`: warmed reserve senders, not in live campaigns
- `active`: healthy senders allowed in live campaigns
- `retired`: weak, blocked, burned, or removed senders

Do not put brand-new senders directly into `active`.

### Provenance tags (apply at connect/import) — REQUIRED

So a shared Smartlead account stays filterable by client, mailbox host, and registrar. Tag every
imported sender with all three, sourced from the client profile `run_state`:

- **Client name** — e.g. `ExampleCo` (from `business.name`).
- **Mailbox vendor** — the mailbox provider that created the inbox: `Zapmail` or `Primeforge`
  (from `run_state.mailbox_provider`). On a split fleet, tag each sender with the vendor that
  actually hosts it, not the run default.
- **Domain registrar** — where the sending domain was bought: `Spaceship`, `Dynadot`, etc.
  (from `run_state.registrar`).

Example (one ExampleCo Zapmail sender): tags = `ExampleCo`, `Zapmail`, `Spaceship`, `new`.
Example (one ExampleCo Primeforge sender): tags = `ExampleCo`, `Primeforge`, `Spaceship`, `new`.

Apply provenance tags during the connect/import step (below) via REST `POST /email-accounts/tag-mapping`
(use `scripts/smartlead-tags.mjs tag-map <accIds> <tagIds>`; create any missing tag def first with
`scripts/smartlead-tags.mjs create-tag <name> [color]` → real route is **`POST /api/v1/tags`** `{name, color}`,
verified 2026-06-15. **NOT** `POST /email-accounts/tags` — that path is shadowed by `POST /email-accounts/:account_id`
and 400s `"account_id must be a number"`. List defs with `GET /email-accounts/tags`). The MCP's `update_email_account_tag` tool 404s (wrong route — see top of
skill); do NOT use it, and do NOT fall back to grinding the browser tag UI unless REST is genuinely down.
Provenance tags never change after import; only the lifecycle tag moves over a sender's life.

### Rotation batch tags (apply at connect/import) — REQUIRED HARD RULE

**Every batch of mailboxes a client provisions is split into two warmed, mirror-image halves so the
whole fleet never runs at once.** This is the operator's rotating-mailbox-batch strategy: run one half in
live campaigns while the other rests as a warmed backup, then rotate — no mailbox or domain gets maxed.

- **Tag names:** `Batch N.1` (primary) and `Batch N.2` (backup/reserve), where **N is the client's Nth
  provisioning batch** (first purchase = 1, a later top-up = 2, etc.). These tags are generic and shared
  org-wide (like the registrar/vendor tags); combine with the **client** tag to view one client's half
  (e.g. filter `ExampleCo` + `Batch 1.1`). Created via `scripts/smartlead-tags.mjs create-tag "Batch 1.1"`.
- **The split (HARD RULE — balanced mirror):** within the batch, for **EACH `(mailbox provider × mailbox
  type)` cell** — e.g. Primeforge-Google, Primeforge-Microsoft, Zapmail-Google, Zapmail-Microsoft — assign
  **half the mailboxes to `Batch N.1` and half to `Batch N.2`.** Both halves must end up with the same
  provider mix AND the same Google/Microsoft mix, so either half can run a campaign alone. Example: a
  48-mailbox batch of 30 Google + 18 Microsoft → `Batch N.1` = 15 Google + 9 Microsoft, `Batch N.2` =
  15 Google + 9 Microsoft (and balanced per vendor too).
- **Keep whole domains together:** both mailboxes of a domain (e.g. `alex@` + `alexrivera@`) go in the
  SAME half, so resting `Batch N.2` rests entire domains (protects domain reputation). Split by domain
  within each provider×type cell, not by individual mailbox.
- **Odd cells — balance the HALVES, not each cell.** Give each cell `floor(n/2)` domains to each half, then
  distribute the leftover (odd-cell) domains so the two halves stay balanced on **total count + Google/
  Microsoft mix + Primeforge/Zapmail mix**. Do NOT just push every spare to `Batch N.1` — across several odd
  cells that piles up a lopsided split (e.g. a client whose cells run 5/7/5/7 domains would skew 28/20). With balanced
  spare distribution those same cells land a clean 24/24, off-by-one only at the provider×type intersection
  (unavoidable when a cell is odd). Never split a domain across halves.
- **Use the tool:** `scripts/smartlead-rotation-split.mjs <clientSubstr> plan` computes this split (whole
  domains, balanced halves) and prints a balance check; `... apply` tags it via REST (default tag ids =
  `Batch 1.1`/`Batch 1.2`). Run `plan` first, confirm the balance, then `apply`.
- **Rotation tags never change after assignment** (like provenance). Which half is *currently sending* is a
  separate, mutable choice the upload skill + weekly rhythm manage — see below.

Apply rotation tags at the same connect/import step as provenance, via `scripts/smartlead-tags.mjs tag-map`.
Do NOT confuse `Batch N.1/N.2` (rotation halves that cut ACROSS providers) with the mailbox-vendor
provenance tags (`Primeforge`/`Zapmail`) — they are different dimensions.

**Sending uses one half at a time.** `/smartlead-campaign-upload-public` attaches only the currently-active
rotation half (default `Batch N.1`) plus the client + health filters; `Batch N.2` stays warmed in reserve.
Rotate the active half on a cadence (see `/cold-email-weekly-rhythm`) so neither half is over-used. When a
client has multiple batches (1, 2, …), the active set is one half per batch unless the operator says otherwise.

## Client-Access (apply at connect/import) — REQUIRED HARD RULE

**Every client gets a Smartlead client-access entity, and that client's mailboxes are assigned to it.** This is
part of the same import pass as tagging — do it right after the mailboxes land in Smartlead. It groups the
client's senders, scopes reporting, and lets the client be given a read/reply portal later. Operator directive
(2026-06-16): *"Always create a client access in Smartlead and connect the mailboxes for that client."*

**This MUST precede any campaign build (HARD RULE, operator directive 2026-06-22).** The client-access entity has
to exist *before* the first campaign is created for the client — `/smartlead-campaign-upload-public` now opens with
a **Client-Access Gate** that blocks the upload until it does. Creating it here, in the import pass, is what
satisfies that gate ahead of time; a campaign built before the entity exists lands client-less (`client_id = null`)
and falls out of every client filter and the portal.

**Naming convention (copy this template exactly):**
- `name` = the client's **primary contact** (read `client.contact_email` / `comms_owner` from `client-profile.yaml`; e.g. ExampleCo → "Alex Rivera").
- `email` = that contact's email (e.g. `alex@example.com`). **Use the real contact — never fabricate one.**
- `logo` = the **company display name** (e.g. "ExampleCo Ltd").
- `client_permision` = `{ "permission": ["reply_master_inbox"], "retricted_category": [] }`, `logo_url` = `null`.

**Step 1 — CREATE the client (public API, hands-free).** `POST https://server.smartlead.ai/api/v1/client/save?api_key=<KEY>`
with body `{ name, email, permission:["reply_master_inbox"], logo:"<Company>", logo_url:null, password:"<generated>" }`.
- **`password` is REQUIRED** — omitting it returns a `500` DB-insert error. Generate a strong random password
  (handle it like a mailbox password — record it for the operator to share; this is NOT an authentication step).
- Returns `{ ok:true, clientId, name, email, password }` — capture `clientId`. **Appears record-only — no client
  invite/notification observed** (the response carries no invite flag, and the existing real-email clients were
  created without issue) — but this is inferred, not confirmed from the recipient side, so don't treat "no email
  fires" as a guaranteed default when creating against a real external contact; flag it to the operator. Sharing
  portal access is a separate operator action (fine pre-launch).
- First check it doesn't already exist: `GET /api/v1/client/?api_key=<KEY>` (returns id/name/email/logo/uuid + `client_permision`).
- **Bundled tool:** `scripts/smartlead-client.mjs` — `list` | `create "<Contact>" <email> "<Company>"` (auto-generates the password, dedupes by email) | `verify <clientId> <emailSubstr> <expectedCount>` (the post-assignment scope+completeness check).

**Step 2 — ASSIGN the client's mailboxes (BROWSER ONLY — the public key can't do this).** The assign endpoint
is `POST https://server.smartlead.ai/api/email-account/bulk-update-email-account-config` with body
`{ emailAccountIds:[...], updateData:{ clientId:<id> } }` — but it's an **internal app endpoint authenticated by
the browser session**: the public `api_key` doesn't apply, and a page-context `fetch` is **CORS-blocked**
(`app.smartlead.ai` → `server.smartlead.ai`, "Failed to fetch"). So do it in the UI (per `/autonomous-execution-policy`
§6 browser fallback — it's an already-logged-in dashboard, no password entry):
  1. **Email Accounts** page → **search the client** (a domain/email substring that matches all of this client's
     mailboxes and no other client's — e.g. `exampleco`) to filter the list.
  2. ⚠️ **The list is virtualized/paged (~30 rows/page). Scroll the filtered list to the BOTTOM first** so all
     rows load into the DOM — otherwise header **select-all only grabs the ~30 rendered rows** (this bit us: a
     48-mailbox client assigned only 30 on the first pass). Confirm all rows are loaded (count the rendered
     emails) before select-all.
  3. Click the header **select-all** checkbox → **Bulk Update** → **Management** tab → **Add Client** dropdown.
     - The Add-Client dropdown **searches by client `name`** (the contact, e.g. "Alex"), **not** the logo/company.
     - The modal's tabs animate with a **slow sliding carousel** — wait ~2s for Management to settle before clicking the dropdown.
  4. Select the client → **Save**. Only `clientId` changes; warmup, tags, and limits are preserved (the payload
     also carries `dailyReplyLimit:null`, which is a no-op).
- **Scope + completeness check (REQUIRED after):** via the public API `GET /api/v1/client/?...` is for clients;
  use `GET /api/v1/email-accounts/?...` and confirm **exactly the expected count** carry `client_id==<id>` AND
  **zero other-client accounts** got it. If short (virtualization capped select-all), repeat the scroll+select-all
  pass for the remainder. (A page-side guard that blocks out-of-scope ids is a nice extra but the post-hoc API
  count is the real gate.)

This whole step is wired as: create client (API) → assign mailboxes (browser) → verify count (API). It runs in
the import pass alongside tags; `/cold-email-inbox-tracker` logging follows.

### Remove Categories — restrict the client's reply-category view (REQUIRED HARD RULE)

**Operator directive (2026-06-22): every client-access entity must hide the noise/negative reply categories from the client's master-inbox view**, so the client portal surfaces only meaningful replies (Interested, Meeting Request, Information Request, Referral, etc.) and isn't cluttered with bounces, OOOs, and uncategorized junk. This is part of the same import/setup pass as creation + assignment — do it the moment the client-access entity exists, before the client is ever given portal access.

**Default set to remove (hide) — these 7, unless the operator names a different set for a specific client:**

- Do Not Contact
- Out Of Office
- Wrong Person
- Not Interested
- Outdated Email
- Uncategorizable by Ai
- Lead Category Not Assigned  *(the UI pseudo-category for leads with no category; it is NOT a real category in `GET /leads/fetch-categories`)*

**Set it in the BROWSER (UI-only — treat like the mailbox-assign step).** There is no reliable public-API path: the create/save body carries a `retricted_category` field, but the public `GET /api/v1/client/` returns `retricted_category: []` **even after a confirmed UI save that persisted** (verified live 2026-06-22 on a real client record), so the public client object does not surface this field — do NOT trust it to read or (untested) write the value. Set + verify in the UI:

1. **Client Access** (left nav, `/app/client-views`) → click the client row → scroll to the **"Remove Categories"** section ("Select which reply categories to hide from your client in the master inbox").
2. Open the multiselect and click each of the 7 categories (it's a stable multi-select: clicking keeps the dropdown open, the field accumulates the names, positions don't shift). The list is internally scrollable — **scroll the dropdown's own list to the bottom** (drag its inner scrollbar; a page-level wheel scroll moves the page, not the list) to reach **Lead Category Not Assigned**, the last item.
3. Scroll to the bottom of the form and click the primary **Update** (the purple `type=submit` button after "Set Email + Leads Credits" — NOT the greyed Private-Infrastructure "Update").
4. **Verify (browser, REQUIRED):** reload the client page and re-open the Remove Categories dropdown — all 7 must show selected (purple). ⚠ The collapsed field text renders the pseudo-category **"Lead Category Not Assigned" as blank** (you'll see the 6 real names + a trailing comma), so the field text alone looks like 6 — confirm the 7th by opening the dropdown and seeing it highlighted, not by reading the field string.

(To inspect a client record + the live category id list, GET `/api/v1/client/` and `/api/v1/leads/fetch-categories` with the public key. Category ids as of 2026-06-22: Do Not Contact 4, Out Of Office 6, Wrong Person 7, Not Interested 3, Outdated Email 4710, Uncategorizable by Ai 8; Lead Category Not Assigned has no numeric id — it's a UI pseudo-category.)

## Warmup Defaults

### Zapmail mailboxes — HARD RULE (operator 2026-06-26): the Zapmail-recommended config is the standard

**Every Zapmail mailbox warms in Smartlead with Zapmail's "recommended" warmup config — no exceptions, the pool AND every Zapmail client.** Zapmail's mailbox warmup tab has a **"Zapmail recommended"** preset ("warmup values tuned for better deliverability") — keep it **Applied** on every Zapmail mailbox. The recommended config:

| Field | Value |
|---|---|
| Warmup Status | ACTIVE |
| Reply Rate | **75%** |
| Max Emails Per Day | **35** |
| Warmup Min / Max Count | **20 / 30** |
| Rampup | on, **+3 / day** |
| Daily Reply Limit | **15** |
| Auto-Adjust / Weekdays-only | off |

**Source of truth = Zapmail's export.** Zapmail's native Smartlead export carries this FULL config into Smartlead via Smartlead's *internal* API (which has every field, including rampup 3 and the min/max). So: **set Zapmail's warmup config to "recommended" before/at export and let the export apply it — do NOT overwrite it afterward through the Smartlead public API.**

**Public-API limit + backstop (do NOT degrade the config).** The Smartlead *public* warmup API (`POST /email-accounts/{id}/warmup`) exposes only 4 fields — `warmup_enabled`, `total_warmup_per_day`, `daily_rampup` (**floor 5**; <5 → HTTP 400), `reply_rate_percentage` — and CANNOT set rampup 3, the min/max counts, or the daily-reply-limit.
- **RETIRED: the old `40/5/20` "new senders" default.** Enabling warmup via the public API with those values clobbers Zapmail's good config with worse numbers — that is the exact bug that knocked the mailbox pool off-config (2026-06-26). Never use 40/5/20.
- **Only if** a Zapmail mailbox lands un-warmed and the export did not carry the config, enforce the recommended-**aligned** core values via the public API: `{ "warmup_enabled": true, "total_warmup_per_day": 35, "daily_rampup": 5, "reply_rate_percentage": 75 }` (rampup 5 = the public-API floor; the exact 3 + min/max + daily-reply stay with Zapmail's export config). Tool: `scripts/_pool_smartlead_warmup.mjs` (`--enable` to turn on warming, `--reset` to re-apply the values to already-warming accounts).

This binds whenever ANY Zapmail mailbox lands in Smartlead — even if the export ever carried a wrong warmup setting, the recommended config above is the Smartlead default to restore it to.

### Other / non-Zapmail lifecycle states

Insurance senders (warmed reserve, not in live campaigns): `{ "warmup_enabled": true, "total_warmup_per_day": 15, "daily_rampup": 5, "reply_rate_percentage": 20 }` (daily_rampup must be ≥5 via the public API — the old `0` 400s).

Active live senders: `{ "warmup_enabled": false }`.

If the user prefers to keep light warmup on active senders, ask explicitly and record the decision. Do not change this silently.

## Minimum Time Gap (per-mailbox sending throttle) — REQUIRED HARD RULE

**Every mailbox must have its "Minimum time gap (min)" set to `15` — never empty/null.** This is the
per-mailbox throttle that spaces out sends so a mailbox never fires a burst of emails back-to-back (a burst
of messages in quick succession looks robotic and hurts deliverability). It is a per-EMAIL-ACCOUNT setting
(Smartlead API field `minTimeToWaitInMins`, camelCase), and `15` is the operator's standard for the
the upstream workspace fleet.

⚠️ **Do NOT confuse this with the campaign-level `min_time_btw_emails`** in a campaign's schedule
(`POST /campaigns/{id}/schedule`) — that is a separate, campaign-scoped throttle. This rule is ONLY about the
per-mailbox "Minimum time gap (min)". **Never change `min_time_btw_emails` to satisfy this rule.**

- **Apply it in the import pass**, alongside warmup, tags, and client-access — on every newly connected
  mailbox, on BOTH rotation halves (the resting backup half needs it too, so it's send-ready on rotation).
- **Set = browser (the public key can't write this field).** The public API exposes `minTimeToWaitInMins` on
  reads but there is no verified public write for it: the MCP `update_email_account` tool has no such field,
  and the `email-accounts/save` body doesn't carry it. The write goes through Smartlead's internal,
  session-authenticated bulk-config endpoint, which CORS-blocks the public key (same constraint as
  client-assignment). So set it in the already-logged-in UI per `/autonomous-execution-policy` §6 browser
  fallback (no password entry): **Email Accounts → select the mailboxes (scroll the virtualized list to the
  bottom first so select-all grabs them all, same gotcha as client-assign) → Bulk Update → set "Minimum time
  gap (min)" = 15 → Save.** This is exactly the fleet-wide bulk update the operator already ran (2026-06-17).
- **Verify = public API GET (this is the enforceable gate).** `GET /api/v1/email-accounts/?api_key=<KEY>&offset=0&limit=200`
  and assert EVERY account reads `minTimeToWaitInMins == 15` with none null/empty. Make this GET check part of
  the post-import verification, not an afterthought — it's the part that's actually programmable. (Verified
  live 2026-06-17: the the upstream workspace fleet reads `minTimeToWaitInMins: 15`.)

## Signature Template

Use plain text:

```text
{from_name}
{title}
{company}
{address}
```

Required values:

```text
SENDER_FIRST_NAME
SENDER_LAST_NAME
SENDER_TITLE
SENDER_COMPANY_NAME
SENDER_PHYSICAL_ADDRESS
```

In Smartlead sequences, keep `%signature%` at the bottom of the email body.

## Day 1 After Provider Provisioning

After Zapmail or Primeforge provisioning:

0. **Precondition — profile assets set BEFORE import.** Every mailbox must already have its sender
   profile picture (the shared persona headshot/GIF) set at the mailbox provider before it is imported/
   exported into Smartlead. Per the provisioning HARD RULE, the assets are generated by
   `/mailbox-profile-generator` **the moment the persona name is locked** (headshot → company logo →
   crossfade GIF), then applied at the provider — **MCP first, browser only as a fallback**
   (`mcp-tools-routing.md`). Do not import faceless mailboxes and backfill photos later. **Both Primeforge
   and Zapmail support animated GIF profile pictures** (Zapmail GIF support confirmed in the Zapmail UI,
   2026-06-06) — use the GIF on both. For Primeforge: set the profile picture via the `salesforge` MCP
   (`primeforge_update_mailbox`). For Zapmail: try the `zapmail` MCP (`update_mailbox`/`bulk_update_mailboxes`);
   if the MCP exposes no profile-picture write field (re-verify for tool drift), fall back to the Zapmail UI,
   where GIF upload is confirmed. If any mailbox has no profile picture, treat the fleet as
   not-ready-to-import and resolve photos first.
1. Confirm the inboxes exist in Smartlead, **and verify each Google/MS account's connection type** — `GET /api/v1/email-accounts/{id}` must read `GMAIL`/`OUTLOOK`, never `SMTP` (the HARD RULE at the top of this skill). Any `SMTP`-type Google/MS account is mis-connected — remove it and redo via native export *before* tagging/warmup, so two weeks of warmup are never spent on a bad-type mailbox.
2. Apply provenance tags (client name, mailbox vendor, registrar — see Tag Convention) AND the rotation-batch tags (`Batch N.1`/`Batch N.2`, balanced mirror per provider×type, whole domains together — see Rotation batch tags) AND lifecycle tag `new` (if the client uses lifecycle tracking).
3. **Create the client-access entity + assign this client's mailboxes to it** (HARD RULE — create via public API, assign via browser; see Client-Access section). Verify exactly the expected count carry the new `client_id`.
4. Enable warmup using the new-sender defaults — on BOTH halves (the backup half warms too, so it's always send-ready). (Zapmail's native export auto-enables warmup on connect — verify rather than assume.)
5. **Set the per-mailbox minimum time gap to `15`** on every mailbox in BOTH halves (browser Bulk Update; see the Minimum Time Gap HARD RULE), then verify via GET that every `minTimeToWaitInMins == 15` and none are empty.
6. Apply signatures.
7. Change the lifecycle tag from `new` to `insurance` (leave provenance + rotation tags in place).
8. Invoke `/cold-email-inbox-tracker`.

### Import path & credential boundary (how inboxes get INTO Smartlead)

- **Zapmail mailboxes must be ACTIVE before import.** Only `ACTIVE` Zapmail mailboxes have SMTP/IMAP
  credentials/app-passwords; `In Progress` mailboxes have none yet. Verify status is `ACTIVE` before any
  export or Smartlead-side create — do not import `In Progress` mailboxes.
- **Zapmail → Smartlead (two valid paths):**
  1. **Zapmail's own export.** Native export to a connected Smartlead third-party account
     (`export_mailboxes {apps:["SMARTLEAD"], ids:[...]}`). Works WITHOUT entering a Smartlead password
     *only if* a Smartlead connection is already saved in Zapmail (`list_all_third_party_accounts` → app
     `SMARTLEAD`). If saved, the agent can run the export — Zapmail passes the creds internally.
  2. **Create in Smartlead via the Smartlead API.** Once the Zapmail mailboxes are ACTIVE and their
     SMTP/IMAP credentials/app-passwords are available, create the accounts directly with
     `smartlead_create_email_account`. Use this when no saved Zapmail→Smartlead connection exists.
- **Primeforge (and any provider with NO saved Smartlead connection) → Smartlead:** connecting requires
  entering the **Smartlead account login (email + password)** in the provider's Export→Smartlead flow.
  **This is a hard agent boundary — the agent must NOT enter passwords to authenticate, even when the user
  provides the login and explicitly authorizes it.** Hand this one step to the user; do not store the login
  password in repo/memory files (store only the account *email* + workflow for reference). Resume
  (verify health + tags + client assignment) once the user confirms the inboxes landed.
- Account login passwords are never stored or typed by the agent. API keys (already in `api-keys.md`) are fine;
  account passwords are not.

### Working import mechanics (verified 2026-06-06, Zapmail→Smartlead — bake these in)

**Direct REST beats the MCP here.** Smartlead's MCP `smartlead_create_email_account` returns **404** because it
POSTs to the wrong path (`/email-accounts`); the real route is `/email-accounts/save` (below). The warmup MCP
tool rejects valid params. Use the REST API directly with the `SMARTLEAD` key (`?api_key=`):
- Create/connect: `POST https://server.smartlead.ai/api/v1/email-accounts/save` — body `{id:null, from_name, from_email,
  user_name:<email>, password, smtp_host, smtp_port, imap_host, imap_port, max_email_per_day, custom_tracking_url:"",
  bcc:"", signature:"", client_id:null, warmup_enabled:false}`. Returns `{ok:true, emailAccountId}` or
  `ACCOUNT_VERIFICATION_FAILED` with per-protocol `smtpMessage`/`imapMessage`/`error` (read these — they tell you SMTP vs IMAP failed).
- Warmup: `POST /email-accounts/{id}/warmup` — for Zapmail mailboxes use the recommended-aligned body
  `{warmup_enabled:true, total_warmup_per_day:35, daily_rampup:5, reply_rate_percentage:75}` (see the **Warmup Defaults**
  HARD RULE above — never the retired 40/5/20). **`daily_rampup` minimum is 5** (lower → HTTP 400, so the recommended 3 is
  set via Zapmail's export config, not here).

**Get the RIGHT credential from Zapmail.** `retrieve_all_mailboxes` **masks `appPassword` (null)** and ignores the
GOOGLE/MICROSOFT filter (returns Microsoft regardless). Use **`search_mailboxes` (domain= or firstName=)** to get the real
`appPassword`. Per provider for the `email-accounts/save` connect:
- **Google**: `smtp.gmail.com:587` / `imap.gmail.com:993`, password = **`appPassword` with spaces stripped**. The account
  `password` fails SMTP (`534-5.7.9 Application-specific password required`).
- **Microsoft (O365)**: SMTP `smtp.office365.com:587` works with the account `password`, but **IMAP basic-auth is OFF**
  (`outlook.office365.com:993` → `AUTHENTICATE failed`) and there is **no appPassword**. So direct SMTP/IMAP connect
  **cannot** complete for O365 — IMAP requires OAuth.

**Therefore the reliable path for a Zapmail fleet = Zapmail's native export** (it connects via the OAuth Zapmail holds as
tenant admin, which clears O365 IMAP **and** Google's fresh-account web-login lock `534-5.7.14 log in via your web browser`):
1. One-time, USER action: link Smartlead inside Zapmail (`add_third_party_account` needs the Smartlead **login** = an auth
   step the agent won't do — this is the password/authentication boundary; it stays operator-only on EVERY channel,
   browser included, per `/autonomous-execution-policy` §6). Verify with `list_all_third_party_accounts {app:"SMARTLEAD"}`
   (`error` must be null). **This link is the ONLY operator-gated step in the whole import** — everything after it
   (export, warmup, tags, tracker) is agent-runnable hands-free; do not punt those. If a future provider's link/export
   flow is UI-only with no API but does **not** require typing a password (already-logged-in dashboard), complete it
   yourself in the browser per §6 rather than handing it back.
2. `export_mailboxes {apps:["SMARTLEAD"], status:"ACTIVE"}` **per provider** (set serviceProvider). Re-running is safe —
   upserts by email (no dupes) and does NOT reset warmup on already-warming accounts.
3. **Zapmail export does NOT enable warmup** — after each export, poll Smartlead and enable warmup on any account whose
   `warmup_details.status != "ACTIVE"`.
4. Loop export→warmup as mailboxes finish provisioning (`CREATING_PASSWORD` → `ACTIVE`) until the whole fleet is connected.

⚠️ **Connection-type correction (supersedes any "direct-API connect for Google" guidance above).** Per the HARD RULE
at the top of this skill, the direct-REST `email-accounts/save` SMTP/app-password path is **NOT** an acceptable way to
connect a Google or Microsoft mailbox, *even for Google where it technically succeeds* — it creates a `type:"SMTP"`
account instead of the native `type:"GMAIL"`/`"OUTLOOK"` that the provider's native export produces. The SMTP mechanics
documented above are kept only as a reference (and for genuinely custom, non-Google/non-MS hosts). For every Google/MS
mailbox use the provider's **native Smartlead export** (Zapmail or Primeforge → Export → Smartlead), which connects via the
OAuth the provider holds as tenant admin. Verify `type` is `GMAIL`/`OUTLOOK` after connect; if it is `SMTP`, remove that
account and redo via native export. Same provider-native export covers O365 (whose IMAP basic-auth is off) and web-locked
Google — there is no need for the SMTP fallback on either.

**Primeforge → Smartlead native export specifics (verified 2026-06-10 on a live client run):** Mailboxes page → select the client's
ACTIVE mailboxes (use the search box to scope, e.g. by domain) → **Export N mailboxes → To other platforms → Smartlead**.
The "Smartlead Export" modal asks for the **Smartlead account Email + Password** (login) — a USER-only auth step (agent never
types passwords). "Save & Export" stores the connection and pushes the mailboxes as native `GMAIL`/`OUTLOOK`. The
`salesforge` MCP `primeforge_export_mailboxes` is NOT a substitute — it returns `400 "platform/email/password required"`
(it needs that same login). Native export does not necessarily enable warmup — verify and enable warmup per account after.

Tracker handoff fields:

- Client name
- Mailbox
- Domain
- Setup Status: `Warming`
- Mailbox Type
- Domain Provider from `run_state.registrar`
- Inbox Provider from `run_state.mailbox_provider`
- Setup Via: API/MCP or Manual
- Setup By
- Domain Age

Optional (pass only if known — never block tracker logging on these): inbox rate, domain rate, and sending-platform monthly cost, so the tracker can seed the `💰 Costs` tab. Inventory fields above are required; cost fields are optional.

The tracker skill mutates shared state, so it should ask once before generating the writer.

## Promote Insurance To Active

Only promote senders that are:

- Warmed for at least 2 weeks
- Not blocked
- Good reputation
- Correct signature
- Correct provider/account connection
- Not already attached to too many campaigns

Actions:

1. Select healthy `insurance` senders.
2. Change tag to `active`.
3. Disable warmup or set the user-approved active warmup policy.
4. Attach only these active senders during Smartlead upload.

## Weekly Health Review

Review all senders:

```text
email, domain, tags, warmup_status, reputation, sent_today, sent_7d, replies_7d, bounces_7d, blocked_status
```

Flag:

- Reputation bad or declining
- Warmup blocked
- Active sender with no sends
- Insurance sender accidentally attached to a campaign
- Bounce rate above 3%
- Sender below 1% reply rate after 200+ sends
- Mailbox with an empty or ≠15 minimum time gap (`minTimeToWaitInMins` — see the Minimum Time Gap HARD RULE; fix via browser Bulk Update)

## Retire Workflow

For weak senders:

1. Remove from active campaigns.
2. Remove `active`.
3. Add `retired`.
4. Decide whether to keep warmup on at a low level or disable it.
5. Replace through the setup skill selected by locked `run_state.infrastructure_stack`.

## Common Gotchas

- Smartlead is off-path when `run_state.sending_platform = EmailBison`.
- Tags are only useful if the upload skill respects them.
- Warmup blocked usually needs manual review.
- HTML signatures can break rendering. Use plain text unless the user explicitly wants HTML.
- New inboxes need at least 2 weeks of warmup before real sending.

## What To Do Next

After new senders are imported, warmed, signed, and tagged `insurance`, run `/cold-email-inbox-tracker`.

During the post-import warmup wait (~2 weeks), do NOT idle — per `/autonomous-execution-policy`, background-track warmup health and move on to list/copy work or another client. This does not relax the gate: recheck warmup before the pre-launch gate, and the ≥2-week minimum still blocks promotion to `active`.

After at least 2 weeks, promote healthy `insurance` senders to `active`, then continue to list building or Smartlead upload.

If health issues appear, run `/email-deliverability-audit` or `/deliverability-incident-response`.

## Related Skills

- `/dynadot-zapmail-domain-setup`
- `/spaceship-zapmail-domain-setup`
- `/dynadot-primeforge-domain-setup`
- `/spaceship-primeforge-domain-setup`
- `/primeforge-domain-setup`
- `/smartlead-campaign-upload-public`
- `/smartlead-reply-agent-setup` - the reply-side counterpart: once campaigns are drafted/live, deploys the per-client Reply Agent (SmartAgents) pack for instant inbound replies. Needs the client-access entity this skill creates (Client-level agent scope)
- `/email-deliverability-audit`
- `/deliverability-incident-response`
- `/cold-email-inbox-tracker`

