---
name: auto-research-public
description: Guarded research orchestration for building a draft campaign from one target-company domain. Uses only the locked run_state.sending_platform, verifies sender readiness through that platform manager, runs copy QA, and stops at draft or paused review instead of launching live campaigns.
---

# Auto Research Public
## Canonical Profile Root

All profiles/<business-slug> paths in this skill resolve under:

```text
<outbound>/profiles
```

Here `<outbound>` is the root of this skill library - resolve it to wherever the library is currently checked out (local Documents, OneDrive, or a git worktree); never hardcode an absolute path. Do not create client profiles under a `profiles/` folder at your current working directory.

This is a guarded locked-platform orchestration path.

It does not launch live campaigns. It builds research, list, personalization, and draft upload assets, then stops for manual review.

## Material Decision Rule

When this skill reaches a material fork, name the realistic options, recommend the strongest path, and explain why the main alternatives are weaker before committing.

Ask before choices that affect spend beyond an approved budget, provider routing, source of truth, list quality, campaign direction, client-facing output, live systems, scraping or account risk, or legal/compliance risk. For low-risk reversible choices, state the recommendation and proceed.

Do not turn failed or unsafe paths into user-facing options. If this skill's QA rules or stop gates reject a path, filter it out and explain the blocker only when useful.

When asking the user, use the Claude Desktop native Interactive Inputs / Choice Prompts pattern from /clarification-first: recommended option first, short choices, and Custom answer last when a custom answer is plausible.

## Platform Capability Gate

This skill ends in a draft campaign upload, so it needs a sending platform whose API can create a campaign and upload leads. Read `run_state.sending_platform` before anything else:

- **Slot empty:** stop and route the operator to `/stack-setup`. Do not guess a platform and do not infer one from a worked example.
- **Locked platform has a campaign-create plus lead-upload API:** run the whole skill, Step 1 through Step 6.
- **Locked platform has no such API:** run Steps 1 through 5, stop before Step 6, and hand the artifacts over for a manual campaign build. Say plainly that the upload step is manual rather than implying coverage.

## Hard Prerequisites

Before doing any work, verify:

- `client-profile.yaml` exists under `profiles/<business-slug>/`
- `run_state.sending_platform` is locked, or recorded as `deferred` (it is needed only at Step 6, the draft upload)
- `offer.lead_magnet` exists, or the user approved a validated existing offer with an `offer_validation_path`
- For new-offer paths, `profiles/<business-slug>/data-point-catalog.md` exists and includes its `Ranked Source Signals` section (written by `/data-point-discovery` on the locked offer, kickoff Step 3.3)
- Selected platform, source, and verifier access are available locally when those selected execution skills require them
- Source-tool credentials are available for the source selected by `/lead-source-strategy` Lead Source Plan Mode, or the run must stop after `lead-source-plan.md` until credentials or approval are ready

Infrastructure is not a prerequisite for research, the list or the copy (operator decision 2026-09-22): `run_state.status.setup_stage` and sender readiness are verified through the locked sending platform manager at Step 6, before the paused draft is uploaded, and warmup gates only Start.

If any prerequisite fails, stop and route to the missing skill. Do not fill the gap inside this skill.

If the profile contains only `offer.client_suggested_primary_cta`, `offer.client_suggested_lead_magnet`, or `offer.client_suggested_lead_magnet_details`, stop. Client suggestions are not locked offers. Route to `/offer-intelligence` discovery mode, then `/lead-magnet-brainstorm` to lock the offer, then `/data-point-discovery` on that locked offer, before continuing.

If `offer.lead_magnet` exists but `data-point-catalog.md` is missing and there is no `offer.offer_validation_path` or `offer_validation_path` evidence pointer, stop. This is a locked new-offer path that has not yet run data-point discovery. Run `/data-point-discovery` on the locked offer (kickoff Step 3.3), then resume here, before campaign or list work. The offer stays locked. Do not reopen `/offer-intelligence` or `/lead-magnet-brainstorm`.

## Output

Create campaign artifacts under:

```text
profiles/<business-slug>/campaigns/<YYYY-MM-DD>-<target-domain>/
```

Required files:

- `target-research.md`
- `lead-source-plan.md`
- `source-config.json` or `filters.json` only when the selected source needs one
- `leads.raw.csv`
- `leads.verified.csv`
- `personalization-fields.csv` if personalization is used
- `variants.yaml`
- `copy-qa.md`
- `upload-report.md`

## Workflow

### 1. Research the target company

Use public website research only.

Write `target-research.md` with:

- What the company does
- Who they sell to
- Relevant public proof or trigger signals
- Why this company is a useful lookalike or campaign seed
- Target-market source clues, including local directories, registries, marketplaces, job boards, event pages, or public databases that may matter
- Any risky assumptions that need user confirmation

> **Research Routing: HARD RULE (Claude native deep research primary, enforced; no-AI-API rule, operator directive 2026-09-22).** `run_state.research_routing` has exactly one value, **`claude_deep_research`**. If it is unset, set it to that and proceed. If it still holds a retired value (`third_party_ai`, or the bare-WebSearch `claude_native`), treat it as `claude_deep_research` and note the correction in the activity log. The primary research brain is the Claude native `/deep-research` fan-out harness (multi sub-agents research all needed categories in parallel, fetch real sources, adversarially verify each claim, synthesize a cited report). Do NOT stop to ask. The primary pass MUST be an **actual `/deep-research` invocation** (a single inline WebSearch or WebFetch does NOT satisfy it). Record `ai_research_provider = claude-deep-research` and append the run-log line to `api-balance-ledger.md` (a provenance record that `scripts/research/research_routing_check.mjs` reads, not an AI spend row). A research step that finishes with **no recorded `/deep-research` primary** is a **flagged violation** (run it, or get a fresh explicit OK to skip). No API key of any kind is needed: research runs only on Claude Code itself (the harness, its sub-agents, WebSearch and WebFetch), and no other AI provider is ever called. Full rule: `/ai-model-routing`.

**AI/API routing:** route this research per `ai-model-routing.md` on the single Claude Code native path (no cheap/standard tier, no other AI provider; no-AI-API rule, operator directive 2026-09-22). Assemble the research brief, then the **Claude native `/deep-research` fan-out harness runs the primary broad pass** (multi sub-agents cover all needed categories in parallel, namely discovery, grounding, competitor, and ICP-pain, fetching real sources, adversarially verifying each claim, and synthesizing a cited report + a gap list); crawl/extract the company site → WebFetch; buyer-voice / pain on review sites / forums → the **VOC / Raw-Evidence pipeline** (WebSearch for the exact discussion URLs → WebFetch to read them; tag `source_class`, keep exact quotes). Reddit cannot be read by Claude's tools, so it enters only as thread text an operator pasted with its URL; if nothing was pasted, log Reddit as unread. The live X / social read no longer exists, so note that gap. Crunch the extracted text into `target-research.md` facts and pain signals → Claude Code sub-agents fanned out over disjoint batches per `/personalization-subagent-pattern` (each pre-compresses its own raw dumps to its own output file); structured fit classification → Claude Code inline. After the primary pass, fill ONLY the gaps it flagged with a second targeted `/deep-research` pass (thin / technical / multi-step coverage) or a targeted WebSearch/WebFetch pass (one thin sub-topic, raw URLs); never a duplicate broad pass and never another AI provider (`/deep-research` primary 1-2 runs/client). When the corpus is too big or there are too many references, use **scale mode**: `/deep-research` and WebSearch EMIT ranked URLs → sub-agents read their own URL batch with WebFetch and compress it → the main Claude Code session synthesizes. Don't feed full pages to the synthesizing session. Before the packet, run the **Validation Gate**: every claim resolves to an `evidence_id`/`source_url`, pains need `frequency_count >= 3` `buyer_quote` sources, counterexamples kept; record `validation_provider` / `validation_notes`. Record which provider ran in `ai_research_provider` / `ai_analysis_provider`. Copy is written downstream in Step 4 by `/campaign-copywriting` (Claude Code native, clean-packet sub-agent) from a clean packet, never inline in this research step.

### 2. Build the lead source plan

Read `profiles/<business-slug>/client-profile.yaml`.

Invoke `/lead-source-strategy` in Lead Source Plan Mode for the selected campaign and target-company seed.

Write `lead-source-plan.md` under the campaign folder. The plan must choose the source from `/lead-list-tech-stack-research`, the campaign signal, target geography, campaign strategy source options, and data availability risk, not from tool comfort. Prospeo and Google Maps are allowed only when they are the best source for the signal and market. Contact enrichment is not the same thing as source selection.

If the selected source is a database pull, write `filters.json` or `source-config.json` using that provider's real taxonomy. If the source is a directory, website crawl, event page, marketplace, social signal, or custom scrape, write `source-config.json` with the target URLs, fields, limits, and approval status.

### 3. Pull and verify leads from the source plan

Use the source workflow selected in `lead-source-plan.md`. Do not choose a workflow just because this folder already has a skill for it. Where a source needs a vendor tool, use the pack `/stack-setup` activated for it; if no pack is active, use that tool's own export or API; if neither exists, collect by hand and say so.

Examples:

- Default workflow layer: the list workbench (`run_state.list_workbench`) for combining sources, scoring, dedupe, evidence preservation, and final export preparation. The working list lives in a workbench table the operator watches fill live: the session enriches with FNNL's own API-keyed tools and pushes rows in through the table's inbound webhook, and it never spends the workbench's own credits (zero-workbench-credit HARD RULE, CLAUDE.md section 7). Fallback when no workbench table is ready: Claude Code native (the session builds the CSV directly and says so). RevCode optional as a manual workspace (no API)
- Title + industry only: a contact-database export (Prospeo, A-Leads, WizLeads) only when the person database is the real source signal
- Local SMBs: a maps or local-business extractor (Google Maps, Scrap.io, Apify Maps, Serper Places)
- Lookalike accounts: a company-similarity tool first for similarity (for example DiscoLike); GetLatka only when SaaS ARR/category is the signal; WebSearch plus WebFetch (the harness's own tools) for public-web similarity
- Niche directories, websites, marketplaces, event pages, or job boards: WebSearch plus WebFetch, Apify, or a custom scrape workflow, with the list workbench as the workflow layer (rows pushed in by webhook, zero workbench credits), or Claude Code native (or RevCode) as the fallback when no workbench table is ready
- Social intent: an approved social-engagement source (competitor engagers, Trigify, or equivalent)

Then run:

1. `/icp-prompt-builder`
2. /email-waterfall
3. `/list-quality-scorecard`

Stop if the list grade is below B.

### 4. Write copy

**List Gate (assert; do not assume Step 3 ran).** Before any copy, confirm the verified-list gate (`verified-list-gate.md`) for this slice: `leads.verified.csv` exists and is non-empty, the slice passed `/list-quality-scorecard` at grade B+, and the offer/strategy are locked (Hard Prerequisites above). If any fails, STOP and route to `/email-waterfall` → `/list-quality-scorecard` — never write copy before the verified list exists.

First confirm the Offer Architecture gate from `/campaign-copywriting` passes for the locked offer: SQL vs MQL framing, the easy-to-say-yes-to test, and a named risk reversal. If it does not pass cleanly, fix the offer before any copy is written.

Run `/campaign-copywriting`.

Before showing, saving, exporting, spinning, or uploading any copy, apply:

1. `outreach-copy-framework.md` to Email 1
2. `spam-word-checker.md`
3. `cold-email-copy-best-practices.md`

Save only QA-passed copy to `variants.yaml`.

Email 1 must pass the Framework A contract in `outreach-copy-framework.md` (the direct concrete offer, Aaron's measured winner anatomy; operator-approved Aaron alignment, 2026-09-21): offer first with no greeting; 25 to 35 body words and 2 to 3 body sentences by default, with the optional declarative P.S. outside both counts (short, one job); the scope disclosure of 3 to 4 real sender tasks and one minimal prospect action whenever it reflects the real process; and one primary ask, a soft permission question by default, last. Its subject must be 2 to 4 lowercase words with 0 to 2 variables. Statement-only opt-ins such as `Just reply "Yes"`, per-contact subjects, and long personalized exceptions fail. The same single-thread campaign must also pass the remaining hard copy rules, including no follow-up-reference openers, no em dashes, no double hyphens, no mid-sentence dash separators, no colon-as-runway sentences, no comma-wrapped company descriptors, no goodbye or fake wrap-up emails, and no links or calendar links in emails 1-3 unless the user explicitly approved an override.

The copy must also open every new-thread email with an OFFER-LED opener (`/campaign-copywriting` Hard Rule 19: lead with the offer itself, a free concrete deliverable, never an outcome promise, the one exception being the labeled outcome-conditional arm with its zero-risk term at the Hard Rule 19 boundary; relevance and proof move to the P.S.), carry no observational openers ("I noticed", "I saw that", "Congrats on", "I stumbled upon", "I came across"), and keep the signature on the sending-tool step rather than baked into any body or CSV column.

**Corrected 2026-07-17.** The paragraph above used to mandate the opposite: "open signal-first using one of the four Signal-First Execution Patterns" and "lead Email 1 and Email 3 with a question-first opener whose personalization connects to the email's core pain angle". Both are retired and both are superseded by the offer-led opener: the signal-first opener on 2026-07-17, and the question-first opener on 2026-07-05 with proven-mode. Signals now drive TARGETING, meaning which slice gets which campaign and offer. A slice-SHARED signal fact may ride inside the offer sentence when it is true of every contact in the slice (Hard Rule 38), but no signal opens a cold email, and per-contact signal copy is retired (Hard Rule 34). The observational-opener ban above is unaffected by either retirement and stays fully in force. See `/campaign-copywriting` Offer-First Copy Standard, Hard Rule 19, Hard Rule 38, and Signal-First Anti-Patterns (live).

### 5. Personalization, if needed

If the campaign uses per-lead personalization, use `/personalization-subagent-pattern`.

For the pre-written copy path, `/personalization-subagent-pattern` (full email body mode) fills each row's `email_1_a` / `email_1_b` with its slice's one shared, approved body (B13), varying only the first name; per-contact Email 1 bodies are retired (Hard Rule 34, operator-approved Aaron alignment, 2026-09-21). Email 2 and optional Email 3 remain same-thread follow-ups in `email_2` / `email_3`. The locked sending platform's Email 1 step then carries just the `email_1_a` variable plus the static signature block, and uses one shared static Framework A subject.

Do not scale personalization until the approval loop passes:

- One single-lead sample reviewed
- Batches of 10 reviewed
- Two consecutive rounds with zero edits, or explicit user approval to lock

Spot-check at least 5 random rows before upload.

### 6. Draft upload only

Run the spintax pass and then the draft upload for the locked `run_state.sending_platform`, in that order:

1. **Spintax pass.** Use the spintax skill from whichever pack `/stack-setup` activated for that platform. If no pack is active, apply that platform's own spintax syntax directly. If the platform has no spintax support, skip the pass and record the skip in `upload-report.md`.
2. **Draft upload.** Use the campaign upload skill from whichever pack `/stack-setup` activated for that platform. If no pack is active, use that platform's native campaign create plus lead upload API.

Never run one platform's spintax or upload path against a different platform. Syntax and field names are not portable, so a borrowed path produces a confidently broken campaign.

If the locked platform has no campaign-create API, stop here per the Platform Capability Gate. Hand over `variants.yaml`, `leads.verified.csv`, and an `upload-report.md` that states exactly what still has to be built by hand, and do not claim a draft exists.

If spintax or upload QA finds any copy issue, stop and route back to `/campaign-copywriting`. Do not fix copy inside this orchestration skill.

The upload must create a draft or paused campaign only.

Forbidden:

- Activating a campaign
- Resuming a campaign
- Setting a campaign live
- Bypassing manual review because the automation "already checked it"

Set, only when the draft upload in Step 6 actually ran:

```yaml
run_state.status.upload_stage: draft_created
```

## Final Handoff

**If Step 6 created the draft, print:**

```text
Draft or paused campaign created in the locked sending platform.

Review before launch:
- Lead count matches leads.verified.csv
- Sender pool uses only active healthy senders
- Copy preview matches variants.yaml
- Custom variables render correctly
- Schedule is correct
- Tracking settings match the campaign plan

The user must start the campaign manually in the locked sending platform.
```

**If the Platform Capability Gate stopped the run before Step 6, print instead:**

```text
Research, list, copy QA, and personalization artifacts are complete. No campaign exists yet.

The locked sending platform has no campaign-create API, so the campaign must be built by hand from:
- variants.yaml (the QA-passed copy)
- leads.verified.csv (the verified send list)
- personalization-fields.csv, when personalization was used

Leave run_state.status.upload_stage unset. Do not report a draft as created.
```

## Related Skills

- `/cold-email-kickoff` - the single entry-point orchestrator (safer full launch path)
- `/data-point-discovery` - required after the offer locks on new-offer paths (kickoff Step 3.3); its `data-point-catalog.md` carries the obtainability picture and the market source landscape
- `/lead-source-strategy` - Lead Source Plan Mode, required before list routing
- `/lead-list-tech-stack-research` - source-tool fit map used before source and enrichment routing
- Contact-database export path - title and industry list pulls, only when the source plan selects one (whichever pack `/stack-setup` activated, otherwise the provider's own export)
- /email-waterfall - email finding and verification
- `/list-quality-scorecard` - required pre-upload list QA
- `/campaign-copywriting` - writes QA-gated copy
- `/personalization-subagent-pattern` - optional personalization approval loop
- Spintax pass for the locked `run_state.sending_platform` - whichever pack `/stack-setup` activated, otherwise that platform's own spintax syntax
- Campaign upload for the locked `run_state.sending_platform` - draft or paused upload only, from whichever pack `/stack-setup` activated, otherwise that platform's native API

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short — record status, not raw output. Full protocol: `client-activity-log.md`.
