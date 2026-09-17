---
name: smartlead-campaign-upload-public
description: Upload a CSV of leads + a variants YAML (produced by /campaign-copywriting) to Smartlead as a DRAFT campaign. Handles tag-scoped inbox selection, A/B/C variant assembly, custom field mapping, schedule config, and batch lead upload. ALWAYS creates in DRAFT for manual review in Smartlead UI. Use after /campaign-copywriting, just before the campaign goes live.
---

# Smartlead Campaign Upload
## Canonical Profile Root

All profiles/<business-slug> paths in this skill resolve under:

```text
<coldoutbound-skills>/profiles
```

Here `<coldoutbound-skills>` is the root of this skill library - resolve it to wherever the library is currently checked out (local Documents, OneDrive, or a git worktree); never hardcode an absolute path. Do not create client profiles under a `profiles/` folder at your current working directory.

Use this skill only when locked `run_state.sending_platform = Smartlead`, unless the user explicitly asks for a Smartlead upload outside an active run.

Takes a `variants.yaml` (written by `/campaign-copywriting`) and a `leads.verified.csv` (the verified list from `/email-waterfall`) and creates a DRAFT campaign in Smartlead. A plain `leads.csv` is accepted only behind an explicit operator `verified_flag` override (see List Gate). You review the result in the Smartlead UI and press Start manually.

**This skill does NOT ship any email copy.** Copy comes from `/campaign-copywriting`. This skill is the mechanical upload layer only.

## Client-Access Gate (exists FIRST — HARD RULE)

**Before you create, sequence, or touch ANY campaign for this client, the client's Smartlead client-access entity must already exist.** This is the first thing to confirm in the build — ahead of parsing the list, the copy, or anything else. The client-access entity is the company grouping every campaign is filed under (`client_id`, §A); a campaign built before it exists lands **client-less** (`client_id = null`), which is exactly the orphan state that drops a campaign out of every client filter and the client portal (see the `client_id = null` orphan note under §D). Creating the entity after the fact and back-tagging is avoidable rework — so it comes first, by rule.

**Check (always, up front):** `GET /api/v1/client/?api_key=<KEY>` (or `node scripts/smartlead-client.mjs list`) and match the **`logo`** field to the client's company display name from `client-profile.yaml` (e.g. ExampleCo Ltd → `<client_id>`). Capture the `client_id` for §A. ⚠ `<client_id>` is a placeholder: look the real ids up in your own Smartlead account and never reuse an id from this doc.

**If it's missing → STOP. Do not build the campaign.** Route to `/smartlead-inbox-manager` → Client-Access to **create it first** (public API `POST /client/save`, hands-free) and assign this client's mailboxes to it (browser), then come back here. This is a hard precondition, not a step you can defer to "tag it later": the entity must exist before the first `POST /campaigns/create`. (`/smartlead-inbox-manager` owns creation in the import pass, so in a normal flow it already ran — this gate is the guarantee that the upload never proceeds when it didn't.)

Once the entity is confirmed, §A attaches its `client_id` to each campaign. The gate here is "does the entity exist"; §A is "wire it onto every campaign."

A fully-configured client-access entity also has its **Remove Categories** set (the noise/negative reply categories hidden from the client's master-inbox view) — a HARD RULE owned by `/smartlead-inbox-manager` (its "Remove Categories" section). It doesn't block this upload, but if you created the entity here as a fallback, hand the category-restriction step back to `/smartlead-inbox-manager` so the client view isn't shipped cluttered.

## Copy QA Dependency

Before upload, parse `variants.yaml` and confirm every sendable subject and body still passes:

1. `spam-word-checker.md`
2. `cold-email-copy-best-practices.md`

Stop and route back to `/campaign-copywriting` if the file contains failed copy. Do not rewrite copy inside this upload skill.

Hard-stop examples:

- em dashes, double hyphens, or mid-sentence dash separators
- colon-as-runway sentences or comma-wrapped company descriptors
- weak or ego-triggering CTAs
- CTAs without setup sentence plus short permission question
- repeated generic CTA deliverables across separate new-thread emails
- CTAs that reference unconfirmed deliverables
- broken two-thread 4-step structure when the campaign plan expects Email 1/2 and Email 3/4 thread pairs
- follow-up-reference openers
- observational openers ("I noticed", "I saw that", "Congrats on", "I stumbled upon", "I came across")
- goodbye or fake wrap-up emails inside a two-thread campaign
- links or calendar links in emails 1-3 without explicit user override
- pre-write path: any blank `email_*` body column, a signature baked into a body column, an Email 1 / Email 3 body over 90 words, a body that is one dense paragraph instead of blank-line-separated blocks, or awkward/ungrammatical phrasing

## List Gate (verified slice required)

This upload requires a **verified** send file. Before assembling the campaign, confirm the verified-list gate passed for this slice (canonical: `verified-list-gate.md`):

- `leads.verified.csv` exists and is non-empty (from `/email-waterfall`), and the slice passed `/list-quality-scorecard` at grade B+;
- `variants.yaml` came from `/campaign-copywriting` under that gate; and `run_state.sending_platform = Smartlead` is locked.

**`leads.verified.csv` is mandatory.** A plain `leads.csv` is accepted **only** behind an explicit operator `verified_flag` override — for the legitimate case of re-uploading an already-verified external list. Absent that override, an unverified `leads.csv` is a STOP: route to `/email-waterfall`. Never upload an unverified list by default.

## Warmup is NOT a precondition for drafting (HARD RULE)

**Operator directive (2026-06-17):** as soon as the copy sequence is approved / QA-passed and the verified list is ready (and `run_state.sending_platform = Smartlead`), run this upload and build the campaign **completely** — create it, save the full sequence with all variants, load every lead, **attach the correct sender accounts**, set tracking + stop-on-reply + schedule — and leave it in DRAFT. The operator's only remaining job is **review + press Start**.

Do **not** wait for the mailboxes to finish warming before creating the draft. Warmup status (and inbox-placement / Gates A/B/C) gate the **live send only**, never the draft build. A campaign fully staged while warmup runs means launch is a single click the day the senders mature — which is exactly what the operator wants. Building the draft sends nothing, so there is no safety reason to hold it.

(The `verified-list-gate` and Copy QA dependency below still apply — drafting proceeds on *copy-approved + list-verified + platform-locked*, regardless of warmup.)

## Why DRAFT only

Cold email launches should never happen from automation. You hit Start in the Smartlead UI after reviewing:
- Subject lines + body previews
- Inbox assignments (correct tag? correct count?)
- Lead count and a few random lead rows
- Schedule (timezone + hours + throttle)

The upload process sets all of this up in DRAFT so the review is simple: verify, then click Start manually.

## Material Decision Rule

When this skill reaches a material fork, name the realistic options, recommend the strongest path, and explain why the main alternatives are weaker before committing.

Ask before choices that affect spend, provider routing, source of truth, list quality, campaign direction, client-facing output, live systems, scraping or account risk, or legal/compliance risk. For low-risk reversible choices, state the recommendation and proceed.

Do not turn failed or unsafe paths into user-facing options. If this skill's QA rules or stop gates reject a path, filter it out and explain the blocker only when useful.

When asking the user, use the Claude Desktop native Interactive Inputs / Choice Prompts pattern from /clarification-first: recommended option first, short choices, and Custom answer last when a custom answer is plausible.

## Inputs

### `leads.verified.csv` (required; `leads.csv` only via `verified_flag` override)

Required input is `leads.verified.csv`, the final verified list written by `/email-waterfall`. A plain `leads.csv` is accepted **only** when the operator sets an explicit `verified_flag` override (the re-upload-an-already-verified-list case). Without that override, a missing `leads.verified.csv` is a STOP — route back to `/email-waterfall` (see List Gate).

Required columns:
- `email`
- `first_name`
- `last_name`
- `company_name`

**`linkedin_url` → map to Smartlead's NATIVE `linkedin_profile` field, not a custom field (operator directive 2026-06-20).** Smartlead has a reserved native lead field `linkedin_profile` that the lead view surfaces for reply-handling; a custom `linkedin_url` field is invisible there and merge-only. In the add-leads payload (`POST /campaigns/{id}/leads`, lead object), set `linkedin_profile` = the CSV `linkedin_url` value. (You may also keep a custom `linkedin_url` for merge-field use, but the native field is the required home — the 2026-06-20 backfill existed partly because LinkedIn was only ever written to the custom field.) `linkedin_url` should be present for every B2B contact per `/email-waterfall` (verified Serper+OpenAI backfills any the finders missed); it is a data-quality must-have, not optional, for B2B lists.

Optional columns (passed through to Smartlead as custom fields):
- `company_domain`
- `title`
- `email_1_a`, `email_1_b`, `email_2`, `email_3_a`, `email_3_b`, `email_4` (pre-written full email bodies — one complete body per contact, one column per sequence step and variant; the standard for per-contact personalization, see Pre-Written Email Copy Architecture below). Every step has its own column, including the supporting emails `email_2` and `email_4`; the Smartlead step body is only `{{email_N_x}}` plus the signature, with the greeting and first name baked into the column.
- `subject_1`, `subject_3` (pre-written per-contact SUBJECT lines for the two new-thread emails — one subject per contact per new-thread email, relevancy-angled (light touch off the whole data row) with the offer held constant; the Smartlead step subject is `{{subject_1}}` / `{{subject_3}}`, never a static literal, campaign-copywriting Hard Rule 34). Email 2 and Email 4 are threaded replies and carry no subject.
- `situation_line` (AI-generated per-lead context — lighter fragment alternative to the full-body columns above; personalizes only one sentence of an otherwise-shared body)
- `value_line` (AI-generated value mapping — fragment alternative)
- `cta_line` (AI-generated CTA angle — fragment alternative)

Additional AI variable columns produced by `/campaign-copywriting` or `/personalization-subagent-pattern` must be named fields only. Do not accept arbitrary columns without updating this skill.

### `variants.yaml`

Produced by `/campaign-copywriting`. The schema must match the required fields in that skill and this upload skill.

Minimum required: `name`, `schedule`, `inbox_selection`, `sequences` with at least one step.

## Pre-Written Email Copy Architecture (pre-write path)

Two copy models feed this upload. The default is the `variants.yaml` template model above. The alternative is the pre-written copy path (canonical: `/campaign-copywriting` Pre-Written Email Copy Architecture, generated by `/personalization-subagent-pattern`), where each contact already holds a complete email body per slot and Smartlead receives only the finished text. Both produce a DRAFT for manual review. The tool that wrote the columns does not matter (Task sub-agents, Clay, RevCode, Claude Code, or equivalent enrichment tool); what matters is that every body column is complete before upload.

### Contact table variable map (pre-write path)

Input columns (enrichment and signal data, populated first): `first_name`, `company_name` (both required, do not send if blank), `job_title`, `signal_field`, `campaign_reason`, `linkedin_post_hook`, `company_description`.

Output columns. The `email_*` columns hold the BODY only (no subject text, no signature, no sign-off inside the body cell); the greeting and first name are baked into each body, so the step needs no separate `{{first_name}}` token. The subject line is its OWN per-contact column (`subject_1` / `subject_3`) — NOT a static literal on the step (Hard Rule 34):

| Column | Generated by | Split? | Smartlead variable |
|---|---|---|---|
| `subject_1` | generation step (per contact, relevancy-angled (light touch off the whole data row), offer constant) | No (shared across A/B) | `{{subject_1}}` (step 1 subject field) |
| `email_1_a` | generation step (personalized or fallback per row) | Yes (Variant A) | `{{email_1_a}}` |
| `email_1_b` | generation step (personalized or fallback per row) | Yes (Variant B) | `{{email_1_b}}` |
| `email_2` | generation step (per contact; shared text broadcast to every row when no per-contact angle) | No | `{{email_2}}` |
| `subject_3` | generation step (per contact, relevancy-angled (light touch off the whole data row), offer constant) | No (shared across A/B) | `{{subject_3}}` (step 3 subject field) |
| `email_3_a` | generation step (personalized or fallback per row) | Yes (Variant A) | `{{email_3_a}}` |
| `email_3_b` | generation step (personalized or fallback per row) | Yes (Variant B) | `{{email_3_b}}` |
| `email_4` | generation step (per contact; shared text broadcast to every row when no per-contact angle) | No | `{{email_4}}` |

`subject_1` and `subject_3` are one subject per contact per new-thread email — the SAME value rides both body variants (A and B) so the body stays the isolated A/B test variable. Email 2 and Email 4 are threaded replies with an empty subject.

### Smartlead step body (pre-write path)

Each new-thread sequence step carries a per-contact SUBJECT variable in its subject field and a per-contact BODY variable in its body field, plus a static sign-off: the full 3-line signature block on new-thread steps (Email 1 / Email 3), and at least the first name on follow-up steps (Email 2 / Email 4). Every step ends with a sign-off — none is left unsigned. No other static copy, no other variables. The subject field of Email 1 is `{{subject_1}}` and of Email 3 is `{{subject_3}}` (per-contact, relevancy-angled off the whole data row, offer constant — Hard Rule 34), never a static literal string. Email 2 and Email 4 are threaded replies with an empty subject.

Email 1 step (Campaign A):

```text
Subject: {{subject_1}}

{{email_1_a}}

{full name}
{title} @ {company name}
{company location}
```

Campaign B uses subject `{{subject_1}}` (same subject on both variants — body is the isolated A/B variable) with body `{{email_1_b}}` and the same signature block. Email 3 steps use subject `{{subject_3}}` with body `{{email_3_a}}` / `{{email_3_b}}` and the full signature block. Email 2 and Email 4 steps use `{{email_2}}<br><br>{first name}` / `{{email_4}}<br><br>{first name}` — in-thread replies that sign off with the first name only, but **a sign-off is REQUIRED: every step, follow-ups included, ends with at least the first name. Never leave a follow-up step as a bare `{{email_2}}` / `{{email_4}}` with no sign-off** (it renders as an unsigned fragment — a hard failure). The signature is static sender identity (one persona per client), set once on the step, never written into the CSV. Example follow-up step body:

```text
{{email_2}}

{first name}
```

(stored on the step as `{{email_2}}<br><br>{first name}` — the same `<br>`-not-`\n` rule below applies).

> **HARD RULE — line breaks in the STATIC step text MUST be `<br>`, never `\n` (Smartlead gotcha, verified live 2026-06-19).** Smartlead stores the step `email_body` as HTML. A raw newline (`\n`) in the **static** step text (the signature, or any literal line you type/POST onto the step) is **collapsed** in HTML and renders run-together — e.g. POSTing `{{email_1_a}}\n\nJane Doe\nPartnerships @ ExampleCo\nNew York, USA` shows in the editor and the sent email as `{{email_1_a}}Jane DoePartnerships @ ExampleCoNew York, USA`. **Build the static signature with `<br>`:** `{{email_1_a}}<br><br>Full Name<br>Title @ Company<br>City, Country`. This is also correct for plain-text campaigns — Smartlead converts `<br>` to a newline at plain-text send time. The **opposite** is true for the **merge field's own value**: `{{email_1_a}}` (a custom field) carries the per-contact body's `\n\n` block breaks, and Smartlead **does** convert those custom-field newlines to line breaks on render, so the pre-written `email_*` column keeps its `\n` (do NOT put `<br>` inside the CSV body — only the static step text uses `<br>`). **Always confirm with the Sequence Preview on a real lead** (sequence step → ▶ Preview → pick a lead): the SUBJECT LINE (`{{subject_1}}` on E1, `{{subject_3}}` on E3) must resolve to real per-contact text — an unrendered `{{subject_1}}` token or a blank subject in the preview is a hard failure, more visible than a body glitch — AND the body blocks AND the signature must each render on their own lines before the draft is called done. Check EVERY step, not just Email 1 — on the follow-up steps (Email 2 / Email 4) confirm the first-name sign-off is present and on its own line; a follow-up step that previews with no sign-off is a hard failure to fix before launch.

### Split testing — use Smartlead's native within-campaign variants

Smartlead supports native A/B variants on a sequence step, so split-test INSIDE one campaign — do not build two campaigns. Each new-thread step carries two variants: Variant A `email_body` = `{{email_1_a}}` + signature, Variant B = `{{email_1_b}}` + signature (Email 3 likewise with `{{email_3_a}}` / `{{email_3_b}}`). Set `variant_distribution_type: "MANUAL_EQUAL"` so Smartlead splits each contact's send 50/50. The same per-contact subject variable (`{{subject_1}}` on E1, `{{subject_3}}` on E3) rides both variants, so the body is the isolated tested variable. The support steps (Email 2, Email 4) stay single-variant. This holds mailboxes + schedule constant across A and B, so reply deltas trace to the copy. The leads carry all six body columns as custom fields (`email_1_a`/`email_1_b`/`email_2`/`email_3_a`/`email_3_b`/`email_4`); one campaign references all of them. The across-campaigns model (Campaign A pulls `_a`, Campaign B pulls `_b`) is only a fallback for platforms without native within-step variants — it is not needed on Smartlead. (Reference build: a per-contact build script wired to those six body columns; no such script ships in this pack.)

### Export gate (pre-write path)

Never upload a row where any required body column is blank. Filter to rows where `first_name` and `company_name` are non-empty, all six `email_*` columns are non-empty, AND `subject_1` and `subject_3` are non-empty. A blank body column means the generation step errored for that row; a blank subject column ships an empty subject line (a hard failure). Investigate before upload. Re-scan every body column AND both subject columns for em dashes and banned tokens, and confirm no signature was baked into a body column, before creating the draft.

## Usage

Use the Smartlead UI, API, MCP, or a verified local script if one has been added to this checkout. Do not claim a bundled upload script exists unless it is present and tested.

Required inputs:

```text
profiles/<business-slug>/campaigns/<campaign-slug>/leads.verified.csv
profiles/<business-slug>/campaigns/<campaign-slug>/variants.yaml
```
Output:
```
[ok] Campaign created: #12345678
[ok] Sequence saved (3 steps, 3 variants on step 1)
[ok] 20 inboxes attached (client + active rotation half Batch 1.1 + healthy, LRU by daily_sent_count)
[ok] 1,847 leads uploaded (20 batches)
[ok] Client tagged (ExampleCo Ltd -> client_id 123456)
[ok] Company tag applied (ExampleCo) via bulk Add Tag (UI); company grouping = client (no separate folder)
[ok] Schedule set (M-F 09:00-15:00 Europe/Stockholm, every 12 min ~30/day/sender, start Tue, max 500/day)
[ok] Settings: plain-text on, opens/clicks off, enhanced-delivery on (API); intelli-categorise + bounce-protect on (UI)

Campaign is in DRAFT. Review + Start:
https://app.smartlead.ai/app/email-campaign/12345678
```

## Suppression Gate

Before building the campaign, filter the send file against the client suppression registry:

```text
profiles/<business-slug>/suppression-list.csv   (schema defined in /email-waterfall)
```

Drop every lead matching on `email`, then `linkedin_url`, then `company_domain` (the whole domain when the suppression reason is `negative_hostile`), then `company_name` fuzzy. A suppressed contact must never enter a campaign. Also push suppressed/opted-out contacts to Smartlead's account-wide blocklist via `mcp__smartlead__smartlead_add_lead_to_global_blocklist`, so they are blocked across every Smartlead campaign, not just this one. If the suppression file is absent, treat it as empty and continue. Report the suppressed-row count in the upload summary.

## Catch-All Timing Gate (HARD RULE, operator directive 2026-06-26)

**A new campaign on a young domain uploads `valid`-only — catch-alls are excluded from the initial upload, even when Deliverable.co-verified.** A verified catch-all is necessary but not sufficient to send; the sending domains must first have ~2–3 weeks of positive sending. So before upload, split the send file: ship only `valid` (`deliverable` + `is_catch_all:false`); route every `catch_all` row (even verified ones) to a per-campaign **holdback** (`leads.catchall-holdback.csv`) **with its rendered per-contact copy preserved**, never into the campaign. This is precautionary reputation hygiene for young domains, not a bounce-cause claim (diagnose real bounce spikes from the SMTP DSN reasons — `coldoutbound-bounce-diagnosis-doctrine`). Full rule + the gate mapping live in `/email-waterfall` → *Catch-All Timing*. Report the held-back catch-all count in the upload summary.

**Launching valid-only AUTOMATICALLY creates a standing catch-all reintroduction obligation for this campaign (HARD RULE — every launch, no exceptions).** You do not schedule it manually. `/cold-email-weekly-rhythm` (Step 3b) is the standing scheduler: every week it scans for campaigns with a `leads.catchall-holdback.csv`, auto-detects when this campaign's domains have matured (~2–3 weeks of actual positive sending with healthy bounce + replies in), and **auto-prepares the held catch-alls as a one-click approval** to add back in a controlled ramp (operator choice 2026-06-26 — staged for approval, never auto-sent). So the holdback you write here is not a dead file: it is the queue the weekly engine drains once the domain earns it.

## Upload flow

0. **Client-Access Gate (FIRST).** Confirm the client's client-access entity exists (`GET /api/v1/client/`, match `logo` = company name) and capture its `client_id`. If missing, STOP and create it via `/smartlead-inbox-manager` Client-Access before any campaign is created (see *Client-Access Gate* above).
1. Load `SMARTLEAD_API_KEY` or confirm authenticated Smartlead access.
2. Parse `leads.verified.csv` (or `leads.csv` only under the `verified_flag` override; see List Gate), validate required columns, count rows, drop any row matching the client suppression list (see Suppression Gate), and **hold back catch-alls (see Catch-All Timing Gate) — upload `valid`-only on a young domain.**
3. Parse `variants.yaml`.
4. Create the Smartlead campaign **with the client tag** (`client_id` from the client-access entity — see *Campaign settings + schedule* §A).
5. Add sequence steps and A/B/C variants.
6. Select senders by: **client tag** + **currently-active rotation half** (`Batch N.1`/`Batch N.2`, default `Batch N.1`) + **health** (warmup `status:ACTIVE`, good reputation, not blocked, bounce <3% — read from the account/warmup data, NOT from a lifecycle tag). Only ADD a lifecycle-`active` tag filter for clients that actually maintain lifecycle tags — the the upstream workspace fleet currently does **not** (senders carry only provenance + rotation tags), so requiring an `active` tag there would select zero senders. **HARD RULE: never attach both halves of the same batch at once** — the other half is the warmed backup that rests while this half sends (operator's rotating-batch strategy; see `/smartlead-inbox-manager` Rotation batch tags). Rotate which half is active on a cadence (`/cold-email-weekly-rhythm`), not within a single campaign.
7. Upload leads in batches with custom fields mapped from CSV. **Map `linkedin_url` → the lead's native `linkedin_profile` field** (not a custom field — see Required/Optional columns above); after upload, spot-verify a lead shows `linkedin_profile` populated, not just a custom `linkedin_url`.
8. Apply the **campaign settings + schedule** per the *Campaign settings + schedule (HARD RULE)* section: client `client_id` (§A), full schedule with the timezone/start-date rules (§B), the General toggles (§C), and the company **Tag** (§D) — API for the schedule + the four API-settable toggles (incl. `enable_ai_esp_matching: true`); browser §6 for Intelli-categorise + Bounce-protection **and** the company Tag. (No folder step — the company grouping is the `client_id`; see §D.) **Verify each before printing the URL.**
9. Print campaign URL. **Do not activate.**

## Lead upload: attach verification + dedup flag (HARD RULE)

Two failure modes make `POST /campaigns/{id}/leads` return **200 with `upload_count` = batch size while the leads never actually attach**. The upload response lies in both cases, so **always confirm attachment with `GET /campaigns/{id}/leads?limit=1` → `total_leads`** — never trust `upload_count` (it reports the batch size regardless of how many leads actually landed).

- **Cross-campaign dedup silently skips leads.** With `ignore_duplicate_leads_in_other_campaign: true` in the leads `settings`, Smartlead silently drops any lead whose email already exists in **another** campaign in the account — no error, still 200, `upload_count` still the full batch size, but the leads do NOT attach. This bit a rebuild where the same leads still lived in the old (about-to-be-replaced) draft campaigns: an identical-list campaign attached **0** leads, and a superset attached only its net-new rows. **FIX:** when rebuilding or replacing campaigns that share leads with existing ones, **delete the old campaigns first** AND set `ignore_duplicate_leads_in_other_campaign: false` in the upload `settings`.
- **Replication lag right after create.** A step (schedule or leads) run immediately after `POST /campaigns/create` can hit Smartlead's replication lag — it returns 200 but no-ops (the schedule 404s "Campaign not found"; leads are silently dropped). **Poll `GET /campaigns/{id}` until it returns a `status`** before running any subsequent step.

Working pattern: propagation poll + dup-flag `false` + attach verify with a re-upload loop (no reference script ships in this pack).

## Campaign settings + schedule (set in the draft build — HARD RULE)

**Operator directive (2026-06-19).** Every draft this skill builds must come out already configured — the operator should only review + press Start, never hand-set timezone, throttle, tracking, or the delivery toggles. Most are set hands-free over the API; a handful are set in the Smartlead UI (Campaign Settings General toggles **plus** the Campaigns-list **company Tag**) via the `/autonomous-execution-policy` §6 browser fallback (they are not exposed on the campaign API object). Confirm every one before declaring the draft done.

Field names + enum strings below are read live off configured campaigns (`GET /campaigns/{id}`) — use them verbatim; a guessed key silently no-ops.

### A. Tag the client to the campaign (REQUIRED)

Assign the campaign to the client's Smartlead **client-access entity** (the one `/smartlead-inbox-manager` created in the import pass), so reporting + the client portal scope to it.

- **Set it via `POST /campaigns/{id}/settings`** — include `client_id` in the full settings object (§C). **This is the verified path** (live 2026-06-19, on existing drafts; works whether or not the campaign was created with a client). Look up the id from the client list (`GET /api/v1/client/?api_key=...`, or `scripts/smartlead-client.mjs list`), matching on `logo` = company name (e.g. ExampleCo Ltd → `<client_id>`; a placeholder, look the real id up in your own account). Never fabricate. The entity must already exist by this point — the *Client-Access Gate* at the top of this skill blocks the build until it does; if you somehow reach §A and it's missing, that gate was skipped: stop and create it via `/smartlead-inbox-manager` Client-Access first.
- **Create-time `client_id`** (`smartlead_create_campaign({ name, client_id })` / `POST /campaigns/create`) is tidier for new campaigns, but ⚠ **UNTESTED — confirm it sticks on first use** (the sibling MCP campaign-write tools are broken, and the reference build left `client_id` null at create). If a `GET` shows it didn't take, fall back to the settings-POST above.
- **Verify (always):** `GET /campaigns/{id}` → `client_id` equals the client's id (not `null`).

### B. Schedule — set via API

`POST /campaigns/{id}/schedule` (or `smartlead_update_campaign_schedule`). Request fields: `timezone`, `days_of_the_week`, `start_hour`, `end_hour`, `min_time_btw_emails`, `max_new_leads_per_day`, `schedule_start_time`. (They read back on the campaign GET as `scheduler_cron_value{tz,days,startHour,endHour}`, `min_time_btwn_emails`, `max_leads_per_day`, `schedule_start_time`.)

| Setting | Value |
|---|---|
| Send days | Mon–Fri → `days_of_the_week: [1,2,3,4,5]` |
| Window | `start_hour: "09:00"`, `end_hour: "15:00"` |
| Throttle | every 12 min → `min_time_btw_emails: 12` (≈30 sends/day/sender over the 6-hour window). This is the **campaign** throttle — do NOT confuse it with the **per-mailbox** `minTimeToWaitInMins: 15` from `/smartlead-inbox-manager`; both exist and are set independently. |
| Timezone | derive from the campaign's target geography (rule below) |
| Start date | next Tue/Thu after 3 weeks of warmup (rule below) |
| Max new leads/day | `max_new_leads_per_day: 500` (HARD-RULE default — operator directive 2026-06-23; set 500 on every campaign. Tune down only for a deliberately gentler ramp on a tiny list) |

**Timezone rule — derive, don't ask.** Read the campaign's target geography from the locked strategy slice (`campaign-plan.md` / the `/campaign-strategy` slice) or `client-profile.yaml` targeting:

- US-targeted campaign → `America/New_York`
- EU / pan-Europe campaign → `Europe/Stockholm`
- Single specific country → that country's primary business timezone (UK → `Europe/London`, Germany → `Europe/Berlin`, Australia → `Australia/Sydney`, etc.) — "whatever's closest" to the focused country.
- No geographic signal anywhere → fall back to the client's home-market timezone; only ask if even that is unknown.

**Start-date rule.** `schedule_start_time` is the campaign's first send moment, stored in UTC.

- Compute warmup-complete = first warmup day + 21 days (3 weeks; read the warmup start from the inbox set / `activity-log.md`).
- Pick the next **Tuesday or Thursday on/after** that date → that date at `start_hour` local, converted to UTC for `schedule_start_time` (09:00 Europe/Stockholm summer = `07:00Z`; 09:00 America/New_York summer = `13:00Z`).
- **If the mailboxes are already ≥3 weeks warm**, don't auto-pick — ask the operator when to schedule (one of the rare asks; batch it).
- A future `schedule_start_time` is safe on a draft: even if Started early, Smartlead holds sending until that moment — the staged-launch behavior we want.

### C. Campaign Settings (General) — API vs browser split

Confirm all of these before done. (Verified live 2026-06-19: on an **API-created** draft, items marked ⚠ default OFF and must be actively set; the rest default correct — just confirm.)

**Set + verify over the API.** Write with REST `POST /campaigns/{id}/settings` (NOT the MCP — `smartlead_update_campaign_settings` is a broken wrapper, 400s "campaign_id is not allowed"); read back on `GET /campaigns/{id}`.

> ⚠ **`POST /campaigns/{id}/settings` REPLACES — it resets any settings field you OMIT back to its default** (verified 2026-06-19: a partial POST silently flipped `send_as_plain_text` to `false`). **Always POST the FULL settings object in one call**, never a partial patch:
> ```json
> { "client_id": 123456, "enable_ai_esp_matching": true, "send_as_plain_text": true,
>   "stop_lead_settings": "REPLY_TO_AN_EMAIL",
>   "track_settings": ["DONT_TRACK_EMAIL_OPEN","DONT_TRACK_LINK_CLICK"], "follow_up_percentage": 100 }
> ```
> *(`client_id: 123456` above is a placeholder. Substitute this client's real Smartlead `client_id`, read from `GET /api/v1/client/`.)*

- Plain text ON → `send_as_plain_text: true` (leave "Force plain text as content type" OFF).
- Don't track opens + clicks → SET `track_settings: ["DONT_TRACK_EMAIL_OPEN","DONT_TRACK_LINK_CLICK"]` — the **write** enum. ⚠ It reads back on GET as `["DONT_EMAIL_OPEN","DONT_LINK_CLICK"]`; **read enum ≠ write enum** — POSTing the read form 400s `"Invalid track_settings value"`.
- Stop on reply → `stop_lead_settings: "REPLY_TO_AN_EMAIL"`.
- ⚠ **Enhanced Email Sending & Delivery ON → `enable_ai_esp_matching: true`** (the "Auto-analyse leads mailbox email service providers" box). **Defaults OFF on API-created drafts — actively set it.**
- `follow_up_percentage: 100` — already the default everywhere ("Prioritise sending pattern = 100% follow ups"), but **include it in the full object** so the replace-on-POST doesn't reset it.

**Set in the Smartlead UI via §6 browser fallback** — these two are NOT on the campaign API object, so there's no public API to set or verify them; do them in the same build via the **verified UI navigation path (live 2026-06-23):** open the campaign → click the **edit ✏️ (pencil)** top-right → **Setup** step (top stepper) → **Modify Settings** on the *Campaign Settings* card → **General** tab → scroll to the two sections near the bottom (they sit under the ESP-provider split, just above the end) → set them → **Save General Settings** → re-open to verify. (The old "gear ⚙ → Campaign Settings" wording was imprecise — it's the edit-pencil wizard's Setup step.) **Driving notes:** the modal scroll target is the modal body (~mid-modal), not the page; the **Re-activate** days field only appears AFTER you check its box; screenshots can time out on this heavy SPA, so a `javascript_tool` DOM read is a reliable fallback for verifying control state. Both ⚠ DEFAULT OFF on API-created drafts (but an already-built draft from a prior pass may already have Intelli-categorise + bounce set — in that case the only delta is the new **Re-activate=14d** box; verify each, don't assume):

- ⚠ **Intelligent AI Lead Categorisation → select "Intelli-categorise replies using Smartlead's AI"** (defaults to "Don't categorise lead with AI"). The category list is **empty** on API-created drafts — open the dropdown and select the 8 standard categories: **Do Not Contact, Information Request, Out Of Office, Wrong Person, Interested, Meeting Request, Not Interested, Referral**. Then check **all three** OOO sub-options exactly as the operator's reference screenshot shows: **"Ignore the auto-categorised OOO reply from the reply %"**, **"Re-activate auto-categorised OOO lead after a delay"** with **14** typed in the days field, and **"Automatically restart ai-categorised OOO when lead returns"**. (**Operator directive 2026-06-23 — this OVERRIDES the earlier guidance to skip the "Re-activate…(deprecated)" box.** Smartlead labels that box deprecated, but the operator wants it ON at 14 days; set it. The screenshot is the source of truth for this panel.)
- ⚠ **High Bounce Rate Auto-Protection → check "Activate auto-pause protection from bounces"** and type **3** in the threshold field (it's empty by default; 3 = auto-pause at 3% bounces — the HARD-RULE standard, operator directive 2026-06-23). Then **Save General Settings** and re-open to confirm both persisted.

**Leave at default — already correct on API-created drafts, just confirm:** Email Variant & Spintax Distribution = **Pattern-Based** (don't switch to Randomized), Company-Level Auto-Pause OFF, Isolated Lead Email Provider Sending = Send To All, Domain-level Rate Limiting OFF, Unsubscribe message OFF. **Private Infrastructure / Select Servers is per-campaign infra, not a default — leave it to the campaign's actual need; don't auto-pick a SmartInfra/dedicated-IP server.**

### D. Campaign Tag (company name) + company grouping — set in the browser (HARD RULE)

**Operator directive (2026-06-22, revised after live verification).** Every campaign this skill builds (and every campaign in the account) must be **tagged with the client's company name**, and must belong to its **client-access entity** (`client_id`, §A). Together these give the operator a campaign that is both filterable by company (the tag) and grouped under its company (the client). Apply the tag to **every** campaign, not just the active draft.

**⚠ There is no separate "campaign folder" to create — the company grouping IS the client.** Smartlead's New-Version "Folders" tab shows company-named entries with a small **"C" badge** (one entry per client company). These are **auto-generated CLIENT groupings, not real movable folders.** Verified live 2026-06-22: "Move to Folder" into a "C"-badged company entry reports a success toast but the folder stays **empty** (the move silently no-ops), and the stable **Old Version** Folders tab has **no** such company folders at all (only unrelated real folders). So **do NOT try to create a company folder or move campaigns into one** — assigning the campaign's `client_id` (§A) already files it under its company in the client view. (If a future need calls for literal folders, you must CREATE brand-new real folders, which then sit duplicated alongside the auto "C" entries — only do this on explicit operator request; the operator chose 2026-06-22 to rely on the client grouping + tag instead.)

**Canonical name (one string, used for the tag, the campaign-name suffix, and the client-access entity).** Use the company display name from `client-profile.yaml` (the same name the client-access entity was created under). **Reuse** an existing tag of that name (case-insensitive) — never create a duplicate. (Where the client-access entity's display name differs from the working short name, e.g. entity "ExampleCo Ltd" but the team calls it "ExampleCo", keep ONE agreed string. The workspace's tag set runs one tag per client company plus the agency's own, so reuse the existing tag instead of creating a near-duplicate.)

**The campaign tag is UI-only — NO public API write (verified 2026-06-22).** Reads work (`GET /campaigns/{id}?include_tags=true` → `tags[]` with `tag_id`/`tag_name`/`tag_color`); every write shape 404s on the public api_key surface (the UI fires a **session-authed GraphQL** mutation to `fe-gql.smartlead.ai/v1/graphql` — do NOT lift/replay that token). So assign the tag in the browser §6 pass. **The reliable bulk method (New Version):**

1. Filter the Email Campaigns list to one company — navigate to `…/email-campaigns-v2?clientId=<id>` (look up the id with `scripts/smartlead-client.mjs list`). `Select all campaigns` grabs the WHOLE client's set across pages (the "N selected" banner may show only the loaded page count, but the action applies to all — e.g. it tagged 26 when the banner said 17).
2. Header checkbox → **Select all campaigns** → **Apply Selection** → toolbar **⋯ Bulk Actions** → **Add Tag** → type the company name → click the matching tag → **Add Tags** (toast "Tag added to: N successful").
3. Pre-create the tag *definition* over the API for consistent name/color: `node scripts/smartlead-tags.mjs create-tag "<Company>"` (or `POST /tags {name,color}`).
4. **Verify over the API:** `node scripts/smartlead-campaign-org-verify.mjs` reads every campaign's `tags[]` and reports tagged-vs-missing per company.

Driving-the-UI notes (learned 2026-06-22, save future debugging): the bulk dropdown **menu fades in** — wait ~3 s before clicking an item; the Quasar **tag select only filters on REAL keystrokes** (programmatic value-set won't open the dropdown — type with the keyboard); campaigns with **`client_id = null`** don't appear under any client filter (the legacy "FUP Interested"/"Golf" orphans) and the New-Version list hides some COMPLETED ones, so a small legacy tail may stay untagged — that's expected, not a failure.

> **Honest hands-free scope:** API-hands-free for the client `client_id`, the schedule, and the four API-settable General toggles. **Three things need the browser §6 pass** (no public API surface) — Intelli-categorise, Bounce-protection, and the company **Tag**. There is **no folder step** (the company grouping is the client). Do the three in the same build; do not hand them back to the operator.

## Gotchas

- **Tags must exist and be applied to inboxes first.** Use `/smartlead-inbox-manager` to tag inboxes (provenance + rotation `Batch N.1`/`Batch N.2`; lifecycle only where the client uses it) before running this upload. Selection keys off the rotation half + health, not a lifecycle tag — so it still works on the the upstream workspace fleet, which carries no lifecycle tags.
- **Rotation half (HARD RULE).** Attach only ONE rotation half per batch — the active half (default `Batch N.1`). The backup half (`Batch N.2`) stays warmed in reserve and must not be attached to live campaigns at the same time. This is the rotating-mailbox-batch strategy: never run the whole fleet at once, so no mailbox/domain gets maxed.
- **Inbox count.** If `inbox_selection.count` exceeds tagged inboxes, attach all available healthy senders and warn.
- **Minimum time gap (per-mailbox throttle).** Before attaching senders, GET their accounts and confirm every selected mailbox reads `minTimeToWaitInMins == 15` (not empty). If any is empty or ≠15, fix it in `/smartlead-inbox-manager` (browser Bulk Update) before going live — never launch on a mailbox with no send throttle. This is a quick read-only check, not a setting step (the upload skill doesn't set it). Note: this is the **per-mailbox** "Minimum time gap (min)", NOT the campaign schedule's `min_time_btw_emails`.
- **Leads CSV size.** Larger runs may hit API rate limits. Use batching and retry.
- **Variants.yaml mismatch.** If `/campaign-copywriting` did not produce the expected schema, stop with a clear error pointing at the offending field.
- **Email duplicates.** Smartlead deduplicates per campaign server-side. Still, dedupe your CSV first with `/list-quality-scorecard`.

## What to do next

**Open the Smartlead URL printed at the end. Review the campaign. Hit Start when satisfied.** The upload process deliberately does not auto-activate.

**Set up reply readiness now (don't wait for Start):** the draft exists, so run `/smartlead-reply-agent-setup` to make sure this client has its Reply Agent (SmartAgents) pack. Then every inbound reply gets an instant, on-brand draft (or auto-send for OOO/auto-replies) the moment the campaign goes live, hitting the under-5-minute reply target. A new campaign under the same client + offer is already covered by the existing Client-level agents; a campaign with a materially different offer may warrant Campaign-level agents.

After Start:
- Wait 21 days, then run `/positive-reply-scoring` on the campaign to measure.
- Every Monday: run `/email-deliverability-audit` over the last 7 days of send data (see `/cold-email-weekly-rhythm`).

**Or wait:** if the best-practice check flagged issues, go back to `/campaign-copywriting` and revise before uploading.

## Related skills

- `/campaign-copywriting` - produces `variants.yaml`
- `/smartlead-inbox-manager` - required prep: inboxes must be tagged (client + provenance + rotation `Batch N.1`/`Batch N.2`) and warmed before upload; the active rotation half + health drive selection
- `/list-quality-scorecard` - dedupe + verify the lead list before upload
- `/smartlead-reply-agent-setup` - deploy the client's Reply Agent (SmartAgents) pack once this draft exists, so inbound replies get instant on-brand responses (under 5 min)
- `/positive-reply-scoring` - run 21 days post-launch to measure
- `/cold-email-weekly-rhythm` - operational cadence after launch

## File Policy

This checkout does not require a bundled Smartlead upload script. If one is added later, update this section with the actual filename after verifying it exists.

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short — record status, not raw output. Full protocol: `client-activity-log.md`.
