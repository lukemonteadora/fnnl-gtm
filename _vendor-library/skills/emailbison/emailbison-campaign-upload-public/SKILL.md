---
name: emailbison-campaign-upload-public
description: Upload a CSV of leads plus a variants YAML from /campaign-copywriting to EmailBison as a paused campaign for manual review. Handles variable conversion, custom variable creation, lead import, sequence steps, schedule, sender email assignment, and campaign settings. Never resumes the campaign automatically.
---

# EmailBison Campaign Upload

Use this skill only when locked `run_state.sending_platform = EmailBison`, unless the user explicitly asks for an EmailBison upload outside an active run.

Takes `variants.yaml` and `leads.verified.csv` (the verified list from `/email-waterfall`), then creates an EmailBison campaign that is ready for review. A plain `leads.csv` is accepted only behind an explicit operator `verified_flag` override (see List Gate).

It does **not** launch the campaign. In EmailBison, launching means `PATCH /api/campaigns/{campaign_id}/resume`. Do not call that from the upload script.

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
- `variants.yaml` came from `/campaign-copywriting` under that gate; and `run_state.sending_platform = EmailBison` is locked.

**`leads.verified.csv` is mandatory.** A plain `leads.csv` is accepted **only** behind an explicit operator `verified_flag` override — for the legitimate case of re-uploading an already-verified external list. Absent that override, an unverified `leads.csv` is a STOP: route to `/email-waterfall`. Never upload an unverified list by default.

## Material Decision Rule

When this skill reaches a material fork, name the realistic options, recommend the strongest path, and explain why the main alternatives are weaker before committing.

Ask before choices that affect spend, provider routing, source of truth, list quality, campaign direction, client-facing output, live systems, scraping or account risk, or legal/compliance risk. For low-risk reversible choices, state the recommendation and proceed.

Do not turn failed or unsafe paths into user-facing options. If this skill's QA rules or stop gates reject a path, filter it out and explain the blocker only when useful.

When asking the user, use the Claude Desktop native Interactive Inputs / Choice Prompts pattern from /clarification-first: recommended option first, short choices, and Custom answer last when a custom answer is plausible.

## Inputs

### Environment

```bash
EMAILBISON_API_KEY=your_token_here
EMAILBISON_BASE_URL=https://dedi.emailbison.com
```

### `leads.verified.csv` (required; `leads.csv` only via `verified_flag` override)

Required input is `leads.verified.csv`, the final verified list written by `/email-waterfall`. A plain `leads.csv` is accepted **only** when the operator sets an explicit `verified_flag` override (the re-upload-an-already-verified-list case). Without that override, a missing `leads.verified.csv` is a STOP — route back to `/email-waterfall` (see List Gate).

Required:

- `email`
- `first_name`
- `last_name`
- `company_name` or `company`

Optional mapped fields:

- `company_domain`
- `title`
- `linkedin_url`
- `situation_line`
- `value_line`
- `cta_line`
- `situation_line_a`, `value_line_a`, etc.
- `email_1_a`, `email_1_b`, `email_3_a`, `email_3_b` (pre-written full email bodies, one complete body per contact; pre-write path only, see Pre-Written Email Copy Architecture below)
- `email_2`, `email_4` (full supporting or breakup bodies; usually static)

EmailBison custom variables must exist before import. The upload flow must create missing variables or fail clearly.

### `variants.yaml`

Produced by `/campaign-copywriting`.

Minimum:

- `name`
- `schedule`
- `inbox_selection`
- `sequences`

## Variable Conversion

Convert Smartlead variables to EmailBison variables:

| Smartlead | EmailBison |
|---|---|
| `{{first_name}}` | `{FIRST_NAME}` |
| `{{last_name}}` | `{LAST_NAME}` |
| `{{company_name}}` | `{COMPANY}` |
| `{{title}}` | `{TITLE}` |
| `{{situation_line}}` | `{SITUATION_LINE}` |
| `{{value_line}}` | `{VALUE_LINE}` |
| `{{cta_line}}` | `{CTA_LINE}` |
| `{{email_1_a}}` | `{EMAIL_1_A}` |
| `{{email_1_b}}` | `{EMAIL_1_B}` |
| `{{email_2}}` | `{EMAIL_2}` |
| `{{email_3_a}}` | `{EMAIL_3_A}` |
| `{{email_3_b}}` | `{EMAIL_3_B}` |
| `{{email_4}}` | `{EMAIL_4}` |

Custom variables:

1. Strip `{{` and `}}`.
2. Convert to uppercase.
3. Replace non-alphanumeric runs with `_`.
4. Create the EmailBison custom variable if missing.

Example:

```text
{{recent_trigger_a}} -> {RECENT_TRIGGER_A}
```

## Pre-Written Email Copy Architecture (pre-write path)

Two copy models feed this upload. The default is the `variants.yaml` template model. The alternative is the pre-written copy path (canonical: `/campaign-copywriting` Pre-Written Email Copy Architecture, generated by `/personalization-subagent-pattern`), where each contact already holds a complete email body per slot and EmailBison receives only the finished text. Both produce a paused campaign for manual review. The tool that wrote the columns does not matter (Task sub-agents, Clay, RevCode, Claude Code, or equivalent enrichment tool); what matters is that every body column is complete before upload.

### Contact table variable map (pre-write path)

Input columns (enrichment and signal data, populated first): `first_name`, `company_name`, `job_title`, `signal_field`, `campaign_reason`, `linkedin_post_hook`, `company_description`. `first_name` and `company_name` are required, do not import if blank.

Output columns (pre-written bodies, body only, no subject, no signature, no sign-off):

| Column | Generated by | Split? | EmailBison variable |
|---|---|---|---|
| `email_1_a` | generation step (personalized or fallback per row) | Yes (Variant A) | `{EMAIL_1_A}` |
| `email_1_b` | generation step (personalized or fallback per row) | Yes (Variant B) | `{EMAIL_1_B}` |
| `email_2` | static or light AI | No | `{EMAIL_2}` |
| `email_3_a` | generation step (personalized or fallback per row) | Yes (Variant A) | `{EMAIL_3_A}` |
| `email_3_b` | generation step (personalized or fallback per row) | Yes (Variant B) | `{EMAIL_3_B}` |
| `email_4` | static or light AI | No | `{EMAIL_4}` |

These body columns are EmailBison custom variables. They must exist in the workspace before import, same as any other custom variable.

### EmailBison step body (pre-write path)

Each sequence step contains only its variable, plus the static signature block on new-thread steps. No other static copy, no other variables.

Email 1 step (Campaign A):

```text
{EMAIL_1_A}

[full name]
[title] @ [company name]
[company location]
```

The signature block is typed as literal text (the persona's actual name, title, company, and location), not as EmailBison variables. Campaign B uses `{EMAIL_1_B}` with the same signature block. Email 3 steps use `{EMAIL_3_A}` / `{EMAIL_3_B}` with the full signature block. Email 2 and Email 4 steps use `{EMAIL_2}` / `{EMAIL_4}` (in-thread replies; first-name-only sign-off if any). The signature is static sender identity (one persona per client), typed once into the step, never written into the CSV. Keep `plain_text: true`.

### Split testing at the campaign level

Pre-write split testing is across campaigns, not inside one. Upload the same lead list to Campaign A and Campaign B. Campaign A's steps pull `{EMAIL_1_A}` / `{EMAIL_3_A}`; Campaign B's pull `{EMAIL_1_B}` / `{EMAIL_3_B}`. Both share `{EMAIL_2}` and `{EMAIL_4}`. This replaces the in-step A/B/C variant handling for the pre-write path: the variation already lives in the column, so each campaign uses a single straight sequence.

### Export gate (pre-write path)

Never import a row where any required body column is blank. Filter to rows where `first_name` and `company_name` are non-empty and all six `email_*` columns are non-empty. A blank body column means the generation step errored for that row. Investigate before import. Re-scan every body column for em dashes and banned tokens, and confirm no signature was baked into a body column, before creating the campaign.

## Suppression Gate

Before building the campaign, filter the send file against the client suppression registry:

```text
profiles/<business-slug>/suppression-list.csv   (schema defined in /email-waterfall)
```

Drop every lead matching on `email`, then `linkedin_url`, then `company_domain` (the whole domain when the suppression reason is `negative_hostile`), then `company_name` fuzzy. A suppressed contact must never enter a campaign. Keep `can_unsubscribe: true` so opt-outs are honored, and confirm unsubscribed/negative contacts are recorded in `suppression-list.csv` (the reply-scoring skills write them). If the suppression file is absent, treat it as empty and continue. Report the suppressed-row count in the upload summary.

## Catch-All Timing Gate (HARD RULE, operator directive 2026-06-26)

**A new campaign on a young domain imports `valid`-only — catch-alls are excluded from the initial import, even when Deliverable.co-verified.** A verified catch-all is necessary but not sufficient to send; the sending domains must first have ~2–3 weeks of positive sending. Before import, split the send file: import only `valid` (`deliverable` + `is_catch_all:false`); route every `catch_all` row (even verified ones) to a per-campaign **holdback** (`leads.catchall-holdback.csv`) **with its rendered per-contact copy preserved**, never into the campaign. Precautionary reputation hygiene for young domains, not a bounce-cause claim (diagnose real bounce spikes from SMTP DSN reasons). Full rule lives in `/email-waterfall` → *Catch-All Timing*. Report the held-back catch-all count in the upload summary.

**Launching valid-only AUTOMATICALLY creates a standing catch-all reintroduction obligation for this campaign (HARD RULE — every launch, no exceptions).** You do not schedule it manually. `/cold-email-weekly-rhythm` (Step 3b) is the standing scheduler: every week it scans for campaigns with a `leads.catchall-holdback.csv`, auto-detects when this campaign's domains have matured (~2–3 weeks of actual positive sending with healthy bounce + replies in), and **auto-prepares the held catch-alls as a one-click approval** to add back in a controlled ramp (operator choice 2026-06-26 — staged for approval, never auto-sent).

## Routing Rule: MCP vs CLI for Lead Import

**Use MCP** (`mcp__emailbison__create_lead` in a loop) when:
- Test uploads or batches under 500 leads
- You need immediate per-lead confirmation or error visibility

**Use CLI** (`bison leads bulk/csv`) when:
- Production imports of 500+ leads
- The CSV already exists and token efficiency matters
- You're syncing 10,000+ leads, where an MCP per-lead loop would cost too much

## Usage

MCP-first flow (recommended for most uploads):

Load the EmailBison MCP tools via ToolSearch (`mcp__emailbison__*`) before calling them.

Step sequence:
1. Call `mcp__emailbison__create_campaign` with name from `variants.yaml`.
2. Use `mcp__emailbison__call_api` with `update_campaign_settings` to set `plain_text: true`, `open_tracking: false`, `reputation_building: true`, `can_unsubscribe: true`, `max_new_leads_per_day`.
3. Use `call_api` with `create_schedule` for the sending schedule.
4. Use `call_api` with `create_sequence_step` for each step (see Sequence Variant Handling below).
5. If leads are small enough for connector calls, use `mcp__emailbison__create_lead` per lead. If the list is larger, use the EmailBison UI/API bulk import available in the target workspace.
6. Use `call_api` with `add_leads_to_campaign` to attach imported leads.
7. Resolve active sender email IDs via `call_api` with `list_sender_emails` filtered by tag `active`.
8. Use `call_api` with `add_sender_emails_to_campaign` to attach senders.
9. Print campaign ID and QA checklist. Stop. Do not resume.

Bulk fallback for larger lead imports:

- Use the EmailBison UI import or verified EmailBison API bulk endpoint for the selected whitelabel instance.
- Validate headers, columns, custom variables, and row counts before attaching leads to the campaign.
- Do not claim a local upload script exists unless it has been added to `scripts/` and tested.
Expected output (either path):

```text
Campaign created: #123
Custom variables verified: 8
Lead list imported: 1847 leads
Sequence created: 4 steps, variants converted
Sender emails attached: 20
Schedule set: M-F 09:00-17:00 America/New_York

Campaign is paused for review.
Open EmailBison and resume manually after QA.
```

## Bulk Import Flow

1. Load `EMAILBISON_API_KEY` and `EMAILBISON_BASE_URL`.
2. Parse and validate `leads.verified.csv` (or `leads.csv` only under the `verified_flag` override; see List Gate), drop any row matching the client suppression list (see Suppression Gate), and **hold back catch-alls (see Catch-All Timing Gate) — import `valid`-only on a young domain.**
3. Parse and validate `variants.yaml`.
4. Convert all sequence variables to EmailBison syntax.
5. Create or verify custom variables.
6. Create campaign via `POST /api/campaigns`.
7. Update campaign settings:
   - `plain_text: true`
   - `open_tracking: false`
   - `reputation_building: true`
   - `can_unsubscribe: true`
   - `max_new_leads_per_day` from YAML
8. Create schedule via `POST /api/campaigns/{campaign_id}/schedule`.
9. Create sequence steps via `POST /api/campaigns/{campaign_id}/sequence-steps`.
10. Import leads via the EmailBison UI or verified API bulk import endpoint.
11. Attach leads or the imported lead list to the campaign.
12. Resolve sender emails by tag, usually `active`.
13. Attach sender emails to the campaign.
14. Print campaign ID and manual QA checklist.
15. Stop. Do not resume.

## Sequence Variant Handling

Smartlead stores A/B/C variants inside a sequence step. EmailBison represents variants as sequence steps with `variant: true` and `variant_from_step`.

Implementation rule:

1. Create the primary A step first.
2. Fetch or capture the created step ID.
3. Create B/C as variant steps pointing to A.
4. Preserve `order`, `wait_in_days`, and `thread_reply`.

If the API cannot return created step IDs cleanly, list the campaign sequence steps after creation:

```bash
bison campaigns sequence-steps-list --campaign-id <id> --pretty
```

## Sender Email Assignment

Resolve active sender emails:

```bash
bison tags list --pretty
bison accounts list --pretty
```

Filter sender emails tagged `active`, then attach:

```bash
bison campaigns attach-sender-emails --campaign-id <id> --sender-email-ids '[1,2,3]'
```

If there are fewer active senders than requested, attach all available and warn. Do not silently attach insurance or retired senders.

## Manual QA Checklist

Before resuming in EmailBison:

- Subject lines render correctly.
- Variables render as `{FIRST_NAME}`, not `{{first_name}}`.
- Custom variables exist in the workspace.
- Sequence variants point to the correct base step.
- Sender emails are the intended `active` senders.
- Schedule and timezone are correct.
- Open tracking is off unless the user explicitly chose it.
- Lead count matches the CSV.
- Pre-write path: each new-thread step is the body variable (`{EMAIL_1_A}` / `{EMAIL_3_A}`) followed by the static signature block; no signature is baked into the `email_*` columns, and no `email_*` column is blank.

## Common Gotchas

1. **Wrong base URL.** `EMAILBISON_BASE_URL` must be the workspace instance.
2. **Missing custom variables.** EmailBison will not magically create every variable at send time.
3. **Brace conflict.** `{FIRST_NAME}` is a variable. `{option one|option two}` is spintax.
4. **Variants are not Smartlead `seq_variants`.** They are separate steps.
5. **Do not auto-resume.** Manual review is the safety gate.
6. **Lead imports can take minutes.** Adding leads to an active campaign can take up to 5 minutes to sync.

## What To Do Next

Open EmailBison, review the paused campaign, and resume it manually when satisfied.

After 21 days, run `/emailbison-positive-reply-scoring`.

If locked `run_state.sending_platform = Smartlead`, this skill is off-path. Use `/smartlead-campaign-upload-public` instead.

## Related Skills

- `/campaign-copywriting` - produces `variants.yaml`
- `/emailbison-inbox-manager` - required prep for active sender emails
- `/list-quality-scorecard` - dedupe and verify leads before upload
- `/emailbison-positive-reply-scoring` - run after the campaign has reply data

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short — record status, not raw output. Full protocol: `client-activity-log.md`.
