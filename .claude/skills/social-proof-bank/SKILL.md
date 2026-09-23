---
name: social-proof-bank
description: Build a per-client, copy-ready Social Proof + Trigger Bank BEFORE copy is written. Two banks in one artifact - (1) a Case Studies / proof bank (one row per ICP segment x service line, each with the hard result, timeframe, referenceable client, a copy-ready one-liner written as the single PS proof line, and an optional pain line for a labeled two-line test arm, kept in the poke_the_bear field), and (2) a Trigger & Angle bank (categorized why-now signals, each with why it works, an optional test-arm line, relevant ICPs, and priority). Gathers everything WE can find ourselves first (intake proof block + triggers, onboarding-call notes, Slack context, offer-intelligence, website / case-study scrape, voicenotes), and only asks the client - via the existing proof-asset-request form - for the genuine RAW-FACT gaps we cannot find. The client is never asked for copy; the skill synthesizes every one-liner and test-arm line to pass the Copy QA Gate. Also produces the per-group SEED SET, the 5 to 10 companies that best fit the LOCKED offer (the client's offer-fit case-study and customer companies first, topped up with researched offer-fit exemplar companies, or exemplars alone for a brand-new offer with no proof), which seeds /tam-build's DEFAULT lookalike discovery motion, and enforces a per-group Seed-and-Proof Readiness gate in which each group's seeds must exist BEFORE that group's TAM is built, while missing copy-facts are flagged and collected in parallel and hold only the proof-led copy variant. Runs after the offer is locked and /data-point-discovery; its seed+gate portion runs before /tam-build for every group, the rest in parallel with /tam-build, before /campaign-strategy and /campaign-copywriting. Triggers include "build the proof bank", "social proof bank", "gather <client>'s case studies and triggers", "proof and trigger bank", and "/social-proof-bank".
---

# Social Proof + Trigger Bank

Build the client's **evidence-and-angle asset** once, up front, in copy-ready form, so every campaign for that client draws from real proof and real timing signals instead of the copywriter re-hunting them per campaign or writing hollow copy.

Two banks live in one artifact:

1. **Case Studies bank (proof).** One row per **ICP segment x service line**: the hard result, the timeframe, the referenceable client (and whether we may name it), a **copy-ready one-liner** written as the email's single PS proof line, and an optional **`poke_the_bear`** pain line tied to that proof, used only in a labeled two-line test arm (both defined in The two copy-ready lines, below).
2. **Trigger & Angle bank (why-now -> message).** A categorized library of the timing signals that create a reason to reach out - each with why it works, an optional **`poke_the_bear`** test-arm line, the relevant ICP segments, and a priority. It is the *messaging* companion to `/data-point-discovery`'s *targeting* catalog: same signals, but written as angles the copywriter can use, plus the message-only triggers (events, macro shifts, seasonal, competitor moves) that never become a TAM column.

**The one-line rule.** Gather it ourselves first; only ask the client for the raw facts we genuinely cannot find; never ask the client to write copy. We synthesize the one-liner and the optional `poke_the_bear` line from the gathered facts, and every synthesized line passes the Copy QA Gate.

This is the proactive front end to the **Proof-Asset Gate**. A well-built bank is what makes the copy-time gate in `/campaign-copywriting` and `/campaign-strategy` almost always pass, because the proof the copy needs is already on file, mapped to the segment, and pre-written.

## What this is, and what it is NOT

- **This IS** a per-client, populated, durable asset - the client's *actual* case studies mapped to their *actual* segments, and their *actual* observed triggers with *actual*, validated test-arm lines. It is the populated instance the two example workbooks show.
- **This is NOT** the general copy rulesets. `/campaign-strategy`'s **Signal-Driven Slice Library** (which slice to build) and `/campaign-copywriting`'s **Signal Angle Library** (how to open on a signal) are general, skill-embedded frameworks. This bank FEEDS them with the client-specific, populated rows: PS-ready proof and optional test-arm lines, never default openers. It does not restate or fork them, and it never invents a new signal vocabulary.
- **This is NOT** `/data-point-discovery`. That skill catalogs which prospect DATA to collect to filter and slice the TAM (the targeting layer). This bank is the MESSAGING layer: given a signal we can observe, what does it MEAN for the buyer and what proof answers it. Every trigger row that maps to a collectable data point **reuses that skill's canonical column name** (`change_timing`, `sold_to`, `contact_new_in_seat`, etc.) so the two never drift apart.
- **This is NOT** the reactive gap-ask. `/proof-asset-request` is the single client-facing form. This skill USES it (extended to a bank mode) for the gaps it cannot fill itself. It does not create a second client-ask path.

## Works for any client, in any industry (HARD)

Nothing in this skill is bound to a vertical, a business model, or the digital-agency example. It runs the same for a SaaS vendor, a manufacturer, a healthcare provider, a local home-services business, an ecommerce brand, a consultancy, a law firm, or an agency. Two rules keep it agnostic:

- **`service_line` means "whatever this client sells."** Read it as the client's own unit of offering, whatever that is: a service line (agency), a product or SKU family (manufacturer / ecommerce), a module or plan (SaaS), a procedure or program (healthcare / education), a practice area (professional services), or a job type (trades). Map one case-study row per **ICP segment x that unit**. Never assume "service".
- **The columns and trigger categories are fixed; the VALUES are generated from the actual client.** Every worked example anywhere in this skill or its reference doc is illustration only - derive the real rows from this client's own proof and market. The proof columns (result / timeframe / named client / territory) are universal. The trigger categories adapt: the data-backed ones reuse `/data-point-discovery`'s canonical names (which are themselves industry-agnostic), and the message-only ones (events, macro/regulatory shifts, seasonal/budget timing, competitor moves) exist for every market, only the specific instances differ. If a client's industry has an idiosyncratic proof or trigger type, add it as a row, do not force it into an agency-shaped slot.

How the same columns read across industries (illustrative):

| Client type | `service_line` is... | a real `result` looks like... | a live `trigger_signal` looks like... |
|---|---|---|---|
| B2B SaaS | a plan / module | "cut churn 22% in 2 quarters" | new VP hire, funding round, competitor price change |
| Manufacturer / distributor | a product family | "reduced lead time 18 days" | new plant, tariff change, ERP migration |
| Healthcare provider | a procedure / program | "cut no-show rate from 19% to 7%" | new clinic location, payer/reg change, new medical director |
| Local / home services | a job type | "booked 40% more jobs in 90 days" | seasonal demand window, new competitor in the area, storm/season event |
| Ecommerce / DTC | a category / SKU line | "grew repeat-purchase revenue 3x" | peak-season timing, platform migration, new ad spend |
| Professional services | a practice area | "recovered $480k in one review" | year-end / regulatory deadline, new leadership, M&A activity |

## Material Decision Rule

When this skill reaches a material fork, name the realistic options, recommend the strongest path, and explain why the main alternatives are weaker before committing.

Ask before choices that affect spend beyond an approved budget, provider routing, source of truth, list quality, campaign direction, client-facing output, live systems, scraping or account risk, or legal/compliance risk. For low-risk reversible choices, state the recommendation and proceed.

When asking the user, use the Claude Desktop native Interactive Inputs / Choice Prompts pattern from `/clarification-first`: recommended option first, short choices, and Custom answer last when a custom answer is plausible.

## Interaction Policy

Defers to `/autonomous-execution-policy`. Under `run_state.execution_mode = auto_execute` (the new-client default since 2026-09-24, paired with `review_protocol: phase_checkpoints` so a run stops only at `/cold-email-kickoff`'s four phase checkpoints; `review_gates` is opt-in), proceed without pausing: self-gather, synthesize the banks, write the artifact, and route only the genuine raw-fact gaps to the client via `/proof-asset-request` - never re-ask a decision already in `run_state`, the profile, memory, or the operator's latest message. There is no per-record spend here and no AI API call: copy synthesis runs in the Claude Code session or its sub-agents (no-AI-API rule, operator directive 2026-09-22; supersedes "an optional small AI pass gated by `/api-cost-governance`"), so there is no purchase gate. On a long async wait (e.g. waiting on the client's returned facts), background-poll and move to other productive work - never idle.

**The client-ask is not relaxed by `auto_execute`, and it is also not a pause.** Emitting the fill-in form for a genuine raw-fact gap is a data request to the client (a missing-source-material input gate, like the List Gate), fully compatible with hands-free execution. What `auto_execute` never permits is papering a gap over with an invented number, a vague "a leading firm", or a fabricated client - that is a hard-rule violation in any mode (see the Proof-Asset Gate in `/campaign-copywriting`).

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short - record status, not raw output. Full protocol: `client-activity-log.md`.

## Canonical Profile Root

All `profiles/<business-slug>/...` paths in this skill resolve under:

```text
<outbound>/profiles
```

Here `<outbound>` is the root of this skill library - resolve it to wherever the library is currently checked out (local Documents, OneDrive, or a git worktree); never hardcode an absolute path. Do not create client profiles under a `profiles/` folder at your current working directory.

## When it runs (placement)

After the offer is locked and `/data-point-discovery` has produced `data-point-catalog.md`, and **before** `/campaign-strategy` and `/campaign-copywriting`. It needs the locked offer + the confirmed ICP segments (from `/cold-email-kickoff` Step 2.5) + the data-point catalog's signal vocabulary. It does **not** need the enriched TAM. **Placement is now split (see Seed-and-Proof Readiness below).** The **seed set** must be ready **before** `/tam-build` runs that group (each proven group's proof-facts are collected in parallel and never hold it, operator directive 2026-09-22), because `/tam-build`'s default discovery motion is a lookalike expansion seeded from these offer-fit companies. The rest of the bank (the full trigger bank, message-only angles, the synthesized one-liners) still **runs in parallel with `/tam-build`**. `/cold-email-kickoff` invokes the seed+gate portion before Step 3.5 and the parallel portion at **Step 3.6**.

**Mostly a soft gate, with ONE hard exception.** The bank's copy layer (triggers, one-liners) is a soft gate: campaign strategy and TAM work do not stall waiting for it, and the copy-time Proof-Asset Gate in `/campaign-copywriting` stays the HARD backstop this skill pre-loads. **The hard exception is the Seed-and-Proof Readiness gate below:** every group's seed set (its 5 to 10 offer-fit companies) must exist before its lookalike runs. (A `gap_block` on the group's proof-facts used to hold its TAM until the client returned the fact. Since 2026-09-22 it holds only the proof-led copy angle; the group's offer-led copy ships without the proof line, operator directive.) Set `run_state.status.proof_bank_stage` (`not_started` | `building` | `complete`) so a resume knows where it left off.

## Seed-and-Proof Readiness: the pre-TAM gate for every group (HARD)

`/tam-build`'s default discovery motion is a **lookalike expansion seeded from the companies that best fit the locked offer**, run through whatever tool fills the `company_discovery` slot in the stack contract (its Case-Study-Anchored Discovery HARD RULE; the lookalike stays the discovery spine, operator ruling 2026-09-22). So this bank has a second job beyond copy proof: it produces the **seed set** each group's lookalike is built from, and that must be ready for a group **before** `/tam-build` runs it. This is the one part of the bank that is a HARD pre-TAM gate, not the soft parallel build.

**Seeds = the 5 to 10 companies that best fit the LOCKED offer** (Aaron process alignment, operator directive 2026-09-22; supersedes "seeded from the client's own case-study / customer companies" regardless of offer fit). Build each group's seed set in this order:
1. **The client's own case-study and customer companies that fit THIS offer** come first (Aaron, Jun 22: "focus on the companies I've already gotten results for"). A customer the offer would not suit is not a seed for this offer, however good the result.
2. **Top up to 5 to 10 with researched offer-fit exemplar companies** when the client has fewer: real companies with resolvable domains that clearly match the offer's buyer, each with a one-line "why it fits", found by Claude sub-agents (a targeted `/deep-research` pass, or WebSearch and WebFetch), or through the seed tiers of the company-discovery pack's skill where `/stack-setup` activated one (for example `/disco-like`'s exemplar tier). Mark each seed as a client win or an exemplar, and never invent a company or a domain.
3. **A brand-new offer with no proof is seeded the same way, from exemplars alone,** not from a bare category filter.

When the locked test set holds several offers, pick seeds that fit the set, because each offer runs in every first-wave segment it fits (its own fit filters decide; operator decision 2026-09-23), the lookalike core included, so seeds that suit only one offer shrink the shared ground the offers are compared on. The seed cap of whichever tool fills `company_discovery` still applies.

**A GROUP** = a case-study cluster by sub-industry / what the company sells or serves (the same `icp_segment x service_line` / sold-to cell used below). A group may hold 2+ case studies or just 1. **Each group gets its own seed set, its own group-TAM, and its own campaign(s)** in `/tam-build` and `/campaign-strategy`; more proven groups mean more TAMs and more campaigns. Use an AI **segmentation** feature, if the tool filling the `company_discovery` slot offers one (often plan-gated, so confirm before relying on it), to cluster a customer list into groups instead of guessing them.

**SEED vs PROOF are two different gates, do not conflate them:**
- **SEED** (feeds discovery): the **company domains** that anchor the lookalike, the 5 to 10 that best fit the locked offer. A seed only has to REPRESENT the offer's ideal buyer, so it may be a results-backed case study, a plain happy customer, or a flagged researched exemplar. Record the seed domains per group so `/tam-build` and whatever tool fills `company_discovery` can read them, whether that is a skill from a pack `/stack-setup` activated (e.g. `/disco-like`), the tool's own native surface, or a manual pass if neither exists.
- **PROOF-FACTS** (feed copy): the exact result number, timeframe, and referenceable client the copy will later need. This is the readiness gate.

**The gate, per group, at seed time:**
1. **Proven-motion group** = the client has at least one real customer win for it that fits the locked offer. Identify the seed domains (offer-fit wins first, exemplars to top up) AND confirm the group carries copy-ready proof-facts (at least one case study with a real `result` plus `timeframe` plus a nameable-or-describable client). If the seed set exists but the proof-facts are missing or thin, **flag the specific gap and collect it from the client (the fill sheet or `/proof-asset-request`) in parallel with that group's TAM build.** The seeds gate the lookalike build; the proof-facts gate only copy that names or quantifies the case study. So a `gap_block` no longer holds the group (operator directive 2026-09-22): its offer-led Framework A copy ships without the proof line, and the proof-led angle is added when the facts return.
2. **No offer-fit case study for a group** (or a brand-new offer with no proof) = it is NOT a proven-motion group. Seed it from 5 to 10 researched offer-fit exemplar companies and route it to `/tam-build`'s **EXPANSION motion** (the same lookalike, exemplar-seeded, `discovery_motion = expansion`, offer-led copy, no client-specific proof, no proof gate) as a deliberate net-new play, not a bare category filter (Aaron process alignment, operator directive 2026-09-22; supersedes "route it to the broad ICP filter"). Never invent a seed: if no credible offer-fit exemplar can be found, say so and let `/tam-build` fall back to its broad ICP filter.

Everything else in the bank stays the soft, parallel build described below.

## Inputs (self-gather source order - HARD ORDER)

Gather in this order and stop asking the client the moment we have the fact ourselves. Every value carries a `source` tag so a later session can see where it came from and how solid it is.

1. **Intake form proof block + triggers** - `client-profile.yaml` `proof:` (`referenceable_clients`, `case_studies`, `hard_numbers`, `naming_constraints`) and `icp.triggers`. Also `offer.deliverable_constraints` and `best_customer`.
2. **Onboarding-call notes** - `profiles/<slug>/onboarding-call-notes*.md` (from `/client-onboarding-call-summarizer`): its "What We Learned" -> Proof and Pain & why-now sections, and the **verbatim** "In Their Own Words" quotes (these are what make a `poke_the_bear` pain line validated rather than guessed).
3. **Slack context** - `profiles/<slug>/slack-context.md` (from the client Slack check, `client-slack-check.md`): named customers, results, case studies, shared proof files and why-now triggers the client or the team mentioned in Slack, plus its verbatim "In Their Own Words" quotes. Tag these `source: slack`. A Slack claim of a result is still client-stated: check naming permission and the number itself exactly as for an intake answer. If `client_comms.slack.status` is `unavailable`, note in the bank header that Slack was not read.
   - **Client intel feed:** `profiles/<slug>/client-intel.md` (Needs attention and Open items in full, plus Recent activity tagged `offer`, `copy` or `icp`) and the recaps in `profiles/<slug>/_intel/meetings/`: results, case studies, named customers and numbers mentioned in meetings or Slack since onboarding. Tag meeting items `call_notes` and Slack items `slack`. They are client-stated proof, so they need the usual confirmation (a real result the client can defend, its timeframe, and naming permission per `proof.naming_constraints`) before a one-liner states them, and they never overwrite a confirmed `proof:` value. A conflict goes to the operator (under `auto_execute`, one that touches copy stops this step and asks). A missing feed, or one that is stale by the rule in `client-intel-feed.md`, is a one-line flag, not a blocker. Protocol: `client-intel-feed.md`.
   - **Context sweep:** `profiles/<slug>/context-sweep.md` (from the onboarding context sweep, `client-context-sweep.md`), its **Resources Found** section above all: case studies, testimonials and customer lists found in Slack, email, Drive or shared docs. Open each resource it marks as read through the connector that holds it, and tag each fact by where the sweep found it: `slack`, `email` or `drive` (a meeting recap is `call_notes`). This is client-stated proof too, so the same checks apply as for Slack (a real result the client can defend, its timeframe, and naming permission per `proof.naming_constraints`). A customer list is a seed candidate: its offer-fit companies join the Seed Set as client wins. A missing `context-sweep.md`, or a core source it records as `blocked`, is a note in the bank header, not a blocker.
4. **Offer-intelligence** - `profiles/<slug>/offer-intelligence.md`: the ICP Pain (in their words) vectors, the proof/competitor findings, and the saturation map. Mine each named result and pain for a case-study row or a trigger row.
5. **Website + case-study scrape** - the client's own case-studies / customers / results pages (Spider/Serper per `/lead-list-tech-stack-research`). This is where most real results, named clients, territories, and timeframes actually live. Extract them verbatim; never round or invent a number.
6. **Voicenotes / transcripts** - any raw client voice memo or call transcript the operator supplies. Route long ones through `/client-onboarding-call-summarizer` first, then mine the notes.
7. **Data-point catalog** - `profiles/<slug>/data-point-catalog.md`: the `change_timing`, `sold_to`, `demand`, `tech_hiring`, and contact-discovery signal rows. Each collectable signal becomes a **data-backed** trigger row (reuse its canonical column name verbatim).

Only a fact that is **still blank after all seven passes** routes to the client. Route it through `/proof-asset-request` (bank mode) as an easy fill-in form for the missing RAW FACTS only - never for a one-liner or a test-arm line.

## Division of labor (why the client-ask stays tiny)

The example workbooks encode this exactly: the client supplies raw proof facts (result, timeframe, named client, territory, service line); the operator column "poke the bear question" and the "one-liner (for copy)" are marked "will complete this" - **we** write them.

- **Client supplies (only if we can't find it):** the raw facts - the result/metric, the timeframe, the referenceable client name, the territory, the service line, and permission to name.
- **We synthesize (always, never asked of the client):** the copy-ready `one_liner` and the optional `poke_the_bear` line, both defined in The two copy-ready lines (below) and both written to pass the Copy QA below. The bank's payoff is proof that is already segment-matched and PS-ready.

## The two copy-ready lines (definitions; operator-approved Aaron alignment, 2026-09-21)

Stated once, here. The reference doc `social-proof-bank.md` carries worked examples only. Both field names stay, because `/campaign-copywriting`, `/campaign-strategy` and the xlsx builder read them; what they hold changed on 2026-09-21. The old diagnostic-mirror "poke the bear" opener is gone: that register was already retired as an opener with proven-mode (2026-07-05), and Aaron's rejection bank kills the poke-the-bear curiosity opener outright (examples §8).

**`one_liner` is the single PS proof line.** Proof sits low in Aaron's hierarchy: one point maximum, never in line one or two, PS only, or saved for email two (doctrine §9, examples §6). So the `one_liner` is written in PS form with exactly one plain, named number, from a near-twin case (same space, similar size, doctrine §4) that used the same mechanism the offer uses (same-mechanism proof, doctrine §9). His template, `[AS]` examples §6: "Client went from X bad result to X good result using this exact process." Borrow the shape, not the words (doctrine §9 portability rule). Rules that travel with it:
- **One number.** When a row has two results, the line carries the one this buyer cares about (metrics the buyer ignores are on his rejection list, examples §8); the `result` cell keeps both.
- **No acronyms:** "as soon as you jump into really crazy acronyms and things like that, you lost them" (examples §6).
- **Never generic** ("we've worked with hundreds of clients" is on his refusal list, `[ANTI]` examples §6), never another firm's totals presented as the client's, and never an exact-industry claim for a close-match case (Procedure step 2).
- **Never contradicts the body** it sits under (doctrine §9).

**`poke_the_bear` is the optional line one of a labeled two-line test arm, never the default opener.** Aaron's default opens straight on the offer with "no pain, no observation, no preamble" (doctrine §9), and he rejects the poke-the-bear curiosity opener: "that was your typical poke the bear, basically trying to create intrigue before presenting the offer" (`[ANTI]`, examples §8). He keeps one controlled use: the two-line pattern, where line one is a common validated pain or a relevance line and line two is the offer, A/B-tested against the one-liner (ledger R14, doctrine §9). That test arm is the only place this field is used, and `/campaign-copywriting` records it as a labeled arm. Rules:
- **A statement, never a question.** Question-form pain openers are on his kill-list ("kind of sounds like a cheesy ad", examples §8), so the value is declarative even though the field name, and the xlsx header "Poke the Bear Question", keep the old wording. The soft neutral question for less-aware buyers (doctrine §8, framework 4) is a separate variant that `/campaign-copywriting` owns; this field never carries it.
- **Capped.** It "builds a little bit of pain but doesn't focus on it too much" (doctrine §9): one short clause, no picture-painting.
- **Validated, never guessed.** A common pain the client's buyers state in their own words (call notes, offer-intelligence), never a model-generated pain presented as fact (doctrine §5 step 1). For a trigger row it may instead be the relevance line: what the signal means for the buyer, never that we saw it.
- **Matched to the offer's pain.** The pain in line one must be the pain the offer in line two solves; his hook-payoff rule rejects "leaning on one pain point and then using a different solution, which isn't correlated at all" (examples §8).
- **Optional.** Leave it blank when no validated line exists. A blank beats an invented pain.

A trigger's default job is list relevance: it picks the slice, and the offer carries the email (doctrine §8). Where that relevance earns copy space, it goes to the PS by default (the opening-line swap, examples §1.1), not line one.

## Procedure

1. **Read state + self-gather.** Read the seven sources above in order. Build a working set of proof facts (per segment x service line) and trigger facts (per signal). Tag every fact with its `source`. Never fabricate a value to fill a cell - a genuinely-absent fact stays blank and becomes a client-ask candidate.

2. **Map proof to segments.** For each confirmed ICP segment (Step 2.5) crossed with each service line the client actually delivers, place the best-matching real case study. A segment x service-line cell with no real proof is a **gap** - do not manufacture one. (The proof-relevance hierarchy in `/campaign-copywriting` Step 1 - direct match / close match / no match - governs which real case study best fits a segment; a close-match case study is placed with a "close match" note, never dressed up as a direct-industry metric. Aaron's rule is the same: never claim a case is from the recipient's exact industry when it is only loosely similar, doctrine §9.)

3. **Synthesize the copy-ready lines** (self, no client-ask). For each proof row write the `one_liner` (the single PS proof line, built only on the real facts) and, only where a validated pain exists, the `poke_the_bear` test-arm line, both per The two copy-ready lines above. For each trigger row write its `poke_the_bear` only where a validated pain or relevance line exists. Run every synthesized line through the Copy QA Gate before it is written to the artifact (see Copy QA below). The synthesis runs in the Claude Code session, or on Claude sub-agents over disjoint row batches when the bank is large (`/personalization-subagent-pattern`); no AI API is called (no-AI-API rule, operator directive 2026-09-22; supersedes "a small AI pass gated by `/api-cost-governance`").

4. **Build the trigger bank, reusing canonical vocabulary.** For each trigger, set `data_backed`:
   - `y` when the trigger maps to a collectable TAM/contact column - fill `canonical_column` with the **exact** `/data-point-discovery` name (`new_sales_leader_90d`, `sells_to_vertical`, `contact_new_in_seat`, `running_meta_ads`, `hiring_roles`/`jd_pain_language`, `funded_last_90d`, ...). These rows FEED `/campaign-strategy`'s Signal-Driven Slice Library and `/campaign-copywriting`'s Signal Angle Library with the client-specific angle (and the optional test-arm line).
   - `n` when it is a message-only trigger with no TAM column (events / webinars, macro or regulatory shifts, seasonal / budget-flush timing, competitor moves, a prospect's public LinkedIn post, competitor-user signals). These are the NEW value the bank adds beyond the data catalog; note their `acquisition` (how the signal is spotted - manual, social listening, a per-campaign research pull) so `/campaign-strategy` knows they are not a free TAM slice.
   Never invent a new category name for a `data_backed = y` row; only the message-only rows may use the extra categories.

5. **Decide the tier on each gap** (mirrors the Proof-Asset Gate):
   - **BLOCK** - a planned or likely angle is hollow without this proof (its whole credibility hinges on a named client / case study / number we don't have). Mark the row `proof_status = gap_block`. A `gap_block` holds only the proof-led copy variant, never the slice: the slice ships offer-led, and the proof line joins later as an A/B arm when the fact returns (`/proof-asset-request`; Aaron process alignment, operator directive 2026-09-22).
   - **FLAG** - the proof would only strengthen copy that already stands on a real signal. Mark `proof_status = gap_flag`.
   Everything we found ourselves is `proof_status = on_file`.

6. **Emit ONE client-ask for the real gaps (the client-fill Google Sheet + ready message).** If any `gap_block` or `gap_flag` rows exist, or a campaign needs a case study we don't have, build the client the **fill sheet** and draft a ready message for the operator to send. Facts only, never copy. Claude never sends the message or shares the sheet with the client itself: sending a message on the operator's behalf needs the operator's explicit yes, so the draft goes into the run's one batched client message, `profiles/<business-slug>/client-asks.md` (`/cold-email-kickoff` "How a run stops"), and never holds the flow. The canonical structure, the industry-mixed example rows (the fill-guide), and the outreach copy all live in `social-proof-bank-client-fill-template.md` (resolved under `outbound/`). Do this:
   - **Build the Google Sheet.** Preferred: create a live Google Sheet via the **google-docs MCP** (`createSpreadsheet` → `writeSpreadsheet`/`appendRows`; `setFilePermission` to share it with the client only once the operator says so) with the three tabs from the template: "Start here" (what / why / how + the worked example rows so the client has a guide), "Your results" (the grid to fill, pre-filled with everything already on file marked "confirm", blank rows grouped by the ICP segments we still need proof for), and the optional "Timing + competitors" tab. If the google-docs MCP or its credentials are unavailable, fall back to the tested builder `python "<outbound>/scripts/social_proof_bank_to_xlsx.py" --client <business-slug> --template` → writes `social-proof-bank-client-fill.xlsx` (same three tabs + examples) for the operator to upload to Drive.
   - **Ask ONLY for raw facts** (result, timeframe, client name, permission to name, territory, which service/product line), grouped by segment. The client never writes a one-liner or a `poke_the_bear` line.
   - **Draft the ready message.** Use the draft email OR Slack message in the template (each covers **what** it is, **why** it matters, **how** to fill it), with the sheet link dropped in, and add it to `client-asks.md` for the operator to send. Log it PENDING in the activity log.
   - `/proof-asset-request` bank mode is the same gate for a lighter, paste-back markdown ask when a full sheet is overkill (one or two blanks). Same rule: raw facts only.

7. **Write the artifact** `profiles/<slug>/social-proof-bank.md` (schema below). Set `run_state.status.proof_bank_stage: complete` when the self-gather + synthesis pass is done and the client-ask (if any) is emitted - a pending client-ask does not hold the stage open, because the bank is usable now and upgrades when facts return.

8. **On the client's return:** fold the returned raw facts into the bank, flip those rows `on_file`, re-synthesize their one-liner + poke-the-bear, record the confirmed proof back into `client-profile.yaml` `proof:` so the gate does not re-fire next campaign, update the activity log to DONE, and (optionally) regenerate the client-facing xlsx.

9. **Optional client-facing export.** The source of truth is always the markdown. When the operator wants to send the bank to the client (to confirm facts or as a shared asset), generate the xlsx mirror - two sheets (Case Studies, Trigger Bank), matching the example layout - with the tested builder:

   ```
   python "<outbound>/scripts/social_proof_bank_to_xlsx.py" --client <business-slug>
   ```

   It reads `profiles/<slug>/social-proof-bank.md` and writes `profiles/<slug>/social-proof-bank.xlsx` (needs `openpyxl`; `pip install openpyxl` if absent). Regenerate it from the markdown after any update - never hand-edit the xlsx as a second source of truth. For a Google Sheet instead, convert the xlsx via the google-docs MCP after export.

   The same script's `--template` mode (`... --template`) writes the separate **client-fill** workbook (`social-proof-bank-client-fill.xlsx`) used in step 6 - a blank three-tab sheet with the industry-mixed example rows baked in. Two distinct outputs: the mirror is the populated bank (internal/confirmation); the template is the empty fill sheet we send the client.

## Copy QA (every synthesized line)

Every `one_liner` and `poke_the_bear` is sendable copy, so it passes the same guardrails before it is written to the bank:

- Pass `spam-word-checker.md` (formatting, CTA, opener and voice bans, including Aaron's named kill-list; no em dashes, no colon-as-runway, no comma-wrapped company descriptors). It no longer carries a keyword blocklist.
- Pass `cold-email-copy-best-practices.md`, and check every line against Aaron's rejection bank (`aaron-examples.md` §8, in `/ask-aaron`). The `one_liner` meets the PS proof rules and the `poke_the_bear` line meets the test-arm rules in The two copy-ready lines: a statement, capped, validated, matched to the offer's pain, never a warmup, never an observational "I noticed / I saw that / congrats on" (operator-approved Aaron alignment, 2026-09-21).
- **Capability truth + Proof-Asset truth:** a one-liner may only state a real, on-file result the client can defend, and only name a client we are allowed to name (`proof.naming_constraints`). No invented metric, no unnamed stand-in dressed as a name, no cross-industry metric claimed as directly applicable.
- **Anti-surveillance:** the sold-to and department triggers carry the same caveat as the Signal Angle Library - never recite the prospect's customer list, logos, or a raw headcount back at them; state what the signal MEANS, not that we saw it.

A synthesized line that cannot pass is not written; drop to a broader angle the real proof supports, or leave the row as a gap and route the fact request.

## Output schema: `social-proof-bank.md`

At the profile root, sibling to `data-point-catalog.md`. Segment-aware: one file, per-segment sections when segments differ (like `data-point-catalog.md`). Markdown with two tables + a prose header.

Header: client, date, segments covered, source coverage summary (how many rows came from self-gather vs a client-ask), `proof_bank_stage`, any open `/proof-asset-request` (bank mode) with its PENDING date, and the **per-group Seed Set** (each group's 5 to 10 offer-fit seed domains, each marked client win or researched exemplar with its one-line "why it fits", plus the group's `discovery_motion` = `proven` | `expansion`) that `/tam-build` reads to seed the lookalike.

**Bank 1 - Case Studies (proof).** One row per ICP segment x service line:

| Column | Meaning |
|---|---|
| `icp_segment` | the confirmed segment (Step 2.5) or sold-to bucket this proof serves |
| `service_line` | the specific thing the client delivered (their service / offer variant) |
| `territory` | geography of the engagement (drives geo-matched proof selection) |
| `result` | the hard outcome / metric, verbatim from the real source - never rounded or invented |
| `timeframe` | when / over what period (e.g. `Jan 25 - Jan 26`, `10+ years`, `post-launch 2024`) |
| `named_client` | the referenceable client name, or a described-not-named stand-in if naming is off-limits |
| `naming_ok` | `y` / `n` (from `proof.naming_constraints`) - `n` means describe, do not name |
| `seed_domain` | the case-study/customer company's primary domain, a lookalike SEED for this group when the company fits the locked offer (resolve `named_client` to its domain; blank only if genuinely unresolvable; exemplar seeds live in the header Seed Set, not in this proof table). Naming constraints do NOT block seeding: a `naming_ok = n` company can still seed the lookalike even though it cannot be named in copy |
| `group` | the case-study group this row belongs to (sub-industry / what-they-sell cluster); rows sharing a `group` share a seed set and one group-TAM |
| `discovery_motion` | `proven` (lookalike led by this group's offer-fit wins) or `expansion` (no offer-fit case study: lookalike seeded from researched offer-fit exemplars, offer-led copy). The flag tracks proof, not mechanism: both are seeded lookalikes, and `/campaign-strategy` reads `proven` as "client proof may appear in copy", so an exemplar-seeded group is never flagged `proven` (Aaron process alignment, operator directive 2026-09-22) |
| `one_liner` | **synthesized** single PS proof line: one plain named number, near-twin, same mechanism (passes Copy QA; see The two copy-ready lines) |
| `poke_the_bear` | **synthesized, optional** line one for a labeled two-line test arm: a short, validated pain statement matched to the offer's pain, never a question, never the default opener (passes Copy QA; blank when no validated line exists) |
| `proof_status` | `on_file` / `gap_block` / `gap_flag` |
| `source` | `intake` / `call_notes` / `slack` / `email` / `drive` / `offer_intel` / `website` / `voicenote` / `client_form` |

**Bank 2 - Trigger & Angle bank (why-now -> message).** One row per trigger:

| Column | Meaning |
|---|---|
| `category` | for `data_backed = y`: the `/data-point-discovery` group (`change_timing` / `sold_to` / `demand` / `tech_hiring` / `proof` / contact-signal). For message-only: `events` / `macro_shift` / `seasonal` / `competitive` / `behavioural` / `competitor_users` |
| `trigger_signal` | the observable event (e.g. "new C-suite hire within 60 days", "competitor raised price") |
| `canonical_column` | for `data_backed = y`: the EXACT `/data-point-discovery` column name; blank for message-only |
| `data_backed` | `y` (maps to a TAM/contact column -> feeds a slice) / `n` (message-only, no TAM column) |
| `acquisition` | how the signal is spotted (`tam_column` / `manual` / `social_listening` / `per_campaign_research`) - message-only rows name their non-TAM source |
| `why_it_works` | one line on why this trigger creates a real reason to reach out |
| `poke_the_bear` | **synthesized, optional** test-arm line for this trigger: a short pain or relevance statement (what the signal means, never that we saw it), never a question (passes Copy QA; blank when no validated line exists) |
| `relevant_icps` | which segments / tiers this trigger applies to (`All`, `Tier 1`, a named segment) |
| `priority` | `urgent` / `high` / `medium` |
| `source` | where the trigger came from |

Keep the "add rows as you discover new signals" spirit of the example: the trigger bank is appended over the client's life, not frozen at build time.

## Stop Gates

- **No offer lock / no segments.** If `offer.lead_magnet` is not locked or the confirmed segment list (Step 2.5) is missing, route back - proof can't be mapped to a segment x service line without them.
- **No fabricated proof, ever.** A gap stays a gap. Do not fill a `result`, `named_client`, or number with an invented value, a vague "a leading firm", or a cross-industry metric claimed as directly applicable. Route the fact request instead. This holds in every execution mode.
- **No client-ask for copy.** The form only ever requests raw facts. If you catch yourself asking the client to write a one-liner or a test-arm line, stop - that is our job.
- **No parallel vocabulary.** A `data_backed = y` trigger row must reuse an existing `/data-point-discovery` canonical column name. If a signal has no canonical name and no TAM column, it is `data_backed = n` (message-only), not a new data column.

## What to do next

- `/tam-build`: for every group it WAITS on this skill's seed set (offer-fit wins and exemplars for a proven group, exemplars for an expansion group) before it builds that group (the seeds feed the lookalike); missing proof-facts never hold it. For everything else, `/tam-build` runs in parallel with the rest of the bank. Let the parallel part finish the prospect universe.
- Then `/campaign-strategy` reads `social-proof-bank.md` alongside `tam.csv`: it pulls the data-backed triggers into its Signal-Driven Slice Library and knows which slices can carry a proof line. **Proof availability does not move a slice's priority or volume:** a slice without proof ships offer-led, and the proof line joins later as an A/B arm (Aaron, Sep 21: proof "puts up that sales friction ... try it, see which one works better"). (Aaron process alignment, operator directive 2026-09-22; supersedes "it weights each slice by whether real, segment-matched proof exists".)
- Then `/campaign-copywriting` reads the bank: it selects the segment-matched `one_liner` as the PS proof line (or email two's single proof point), uses a `poke_the_bear` line only inside a labeled two-line test arm, and its Proof-Asset Gate now finds the proof already on file.

## Related skills

- `/proof-asset-request` - the single client-facing gap-ask form; this skill invokes it (bank mode) for genuine raw-fact gaps only
- `/data-point-discovery` - the targeting-layer catalog whose canonical signal names the trigger bank reuses verbatim (never forks)
- `/client-intake-form` - collects the proof block + triggers up front; the bank's first self-gather source
- `/client-onboarding-call-summarizer` - turns call transcripts / voicenotes into the proof + verbatim-pain notes the bank mines
- `/offer-intelligence` - the ICP-pain and proof research the bank draws case-study and trigger rows from
- `/campaign-strategy` - reads the bank; its Signal-Driven Slice Library is fed by the data-backed triggers
- `/campaign-copywriting` - reads the bank; its Proof-Asset Gate and Signal Angle Library consume the proof rows (PS-ready one-liners) and, for labeled test arms only, the `poke_the_bear` lines
- `/ask-aaron` - the doctrine behind the two copy-ready lines (`aaron-doctrine.md` §9, `aaron-examples.md` §6 and the §8 rejection bank); advisory only
- `/cold-email-kickoff` - invokes this skill at Step 3.5 (after offer lock + `/data-point-discovery`, parallel with `/tam-build`, before `/campaign-strategy`)
- `/continue-client`, `/cold-email-flow-audit` - resume / certify this gate as part of the chain
- `/ai-model-routing` - the no-AI-API rule: copy synthesis runs in Claude Code (the session or its sub-agents), never on an outside AI API (operator directive 2026-09-22)
- Reference doc: `social-proof-bank.md` (procedure detail, worked example, the xlsx export). Client-fill Google Sheet structure + example rows + ready email/Slack messages: `social-proof-bank-client-fill-template.md`. Doctrine: memory.
