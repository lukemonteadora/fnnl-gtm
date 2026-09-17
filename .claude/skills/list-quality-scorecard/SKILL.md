---
name: list-quality-scorecard
description: Pre-send quality scorecard for a scored and verified lead list. Blocks hard-no leakage, missing governed scores, bad identities, weak provenance, and unsafe emails. Reports the P1 through P5 mix without penalizing adjacent lower-score leads. Run after /email-waterfall and before upload.
---

# List Quality Scorecard

A CSV of 5,000 leads is not the same as a good list of 5,000 leads. This skill grades your list across 9 dimensions BEFORE you send, catching preventable waste.

## Material Decision Rule

When this skill reaches a material fork, name the realistic options, recommend the strongest path, and explain why the main alternatives are weaker before committing.

Ask before choices that affect spend, provider routing, source of truth, list quality, campaign direction, client-facing output, live systems, scraping or account risk, or legal/compliance risk. For low-risk reversible choices, state the recommendation and proceed.

Do not turn failed or unsafe paths into user-facing options. If this skill's QA rules or stop gates reject a path, filter it out and explain the blocker only when useful.

When asking the user, use the Claude Desktop native Interactive Inputs / Choice Prompts pattern from /clarification-first: recommended option first, short choices, and Custom answer last when a custom answer is plausible.

## Interaction Policy

Defers to `/autonomous-execution-policy`. Under `run_state.execution_mode = auto_execute` (the operator's default), proceed without pausing: pick the strongest option per this skill's rubric, record it to `run_state`/profile, and continue — never re-ask a decision already in `run_state`, the profile, memory, or the operator's latest message. Stop only for the policy's hard-stops (spend over the approved ceiling, live send, credentials, provider/source-of-truth change, safety gates). On a long async wait, background-poll and move to other productive work — never idle. Autonomy does NOT relax the copy-QA gates: `spam-word-checker.md` and `cold-email-copy-best-practices.md` remain HARD gates that block on fail regardless of execution mode.

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short — record status, not raw output. Full protocol: `client-activity-log.md`.

## Why this exists

The three campaign failure modes cold email runners hit most:

1. **Bad list** - the copy doesn't matter when you're emailing the wrong people
2. **Unverified emails** - bounces burn domain reputation
3. **ICP drift** - you think you're targeting VPs, but the list is mostly Managers

Each of these is catchable before you send, in 5 minutes, for free.

## Inputs

A CSV with at minimum these columns:
- `email` - the primary email
- `first_name`, `last_name`
- `job_title` OR `title`
- `company_name` OR `company`
- `company_domain` (optional, derived from email if missing)
- `company_industry` (optional, used for ICP fit scoring)
- `company_headcount` (optional, used for ICP fit scoring)
- `source`, `source_type`, `source_url` (recommended, required for source scoring)
- `evidence_url`, `signal`, `fit_reason`, `source_confidence` (recommended, required when copy references the source signal)
- `lead_score`, `priority_tier`, `score_confidence`, `score_reason`, `send_eligible`, `exclusion_reason` (required on the governed flow)
- component point fields, `contact_rank_in_company`, `same_wave_eligible`, `score_version`, `scored_at` (required on the governed flow)

## Output

A markdown scorecard saved to `profiles/<business-slug>/campaigns/<campaign-slug>/list-quality-scorecard.md` (the canonical campaign directory; matches `email-waterfall`'s `email-waterfall-report.md`). If no campaign slug is set yet, save to `profiles/<business-slug>/list-quality-scorecard.md`. The scorecard contains:
- **Letter grade** (A+ to F)
- **9 dimension scores** (each 0-100)
- **Top 5 issues to fix**
- **Pre-send checklist**
- **P1 through P5 distribution**, median score, and low-confidence count

## AI/API Routing

Grading this list is a structured-output / classification job, so when a model is used it routes to OpenAI per `ai-model-routing.md`; the scorecard math and letter-grade rules in this file remain the source of truth. ICP-fit and title-relevance judgment that needs reasoning can use OpenAI; bulk free-text normalization of titles and industries can use DeepSeek for cost. Do not route grading to Claude — reserve Claude for final copy. Record the validating provider in `ai_analysis_provider` / `qa_status`. Dimension 5 keys off the canonical `evidence_url` and `source_confidence` fields — keep those names.

## Usage

Create the scorecard by reading the CSV directly or using the user's available spreadsheet/script tooling. Optional `client-profile.yaml` context lets the scorecard compare your list against declared ICP filters from `/icp-onboarding`.

## Lead-scoring integrity gate

Run this binary gate before calculating the 9 dimensions. Fail the list and route it back to `/lead-scoring` or `/email-waterfall` when any send-file row has:

- `send_eligible != true`, an exclusion reason, an explicit hard-no, a suppression match, or `fit_status = bad` / `co_fit_status = bad`.
- A blank or invalid `lead_score`, `priority_tier`, `score_reason`, `score_version`, or `scored_at`.
- A score outside 2.0 to 10.0 or a tier that does not match the numeric score.
- `same_wave_eligible != true` for the current active wave.
- A score version that differs from the active client-and-offer rubric.

Report the score distribution. Do not lower the grade because the list contains P3, P4, or P5 rows. Those are marketable adjacent leads by design. Grade identity, provenance, suppression safety, verification, and evidence integrity instead.

## The 9 dimensions

### 1. Email verification coverage (critical)

- **What:** % of emails that are fully verified to standard — i.e. **third-party email-verified AND catch-all verified** (the `/email-waterfall` Verification Doctrine). Both checks are always required; how they were achieved is not. A send-safe email is one that EITHER (a) already existed and **passed verify-first** (email + catch-all via Deliverable.co) — no waterfall needed — OR (b) was **found by a BetterContact waterfall**, whose 4-layer check + catch-all classification delivers both at once. "An email exists", "passed a bare verifier with no catch-all check", or an index/pattern-derived email does NOT count as verified here.
- **Rule:** The hard pass/fail verification gate is owned by `/email-waterfall` (it blocks upload unless the send file is 100% verified to that standard). This dimension **reports** coverage; it does not impose a second, conflicting threshold. A clean send list should read 100% here because the waterfall/verify gate already enforced it.
- **Score:** 100 if the list is 100% verification-checked (waterfall gate passed); drops proportionally with any unchecked rows (0 if <50% checked). If this reads below 100%, the list bypassed `/email-waterfall` — route it back, do not send.

### 2. Duplicate email rate

- **What:** % of duplicate emails in the list
- **Rule:** <1% acceptable, >5% is a problem
- **Score:** 100 at 0%, drops linearly

### 3. Duplicate domain rate

- **What:** max # of leads from any single domain
- **Rule:** 1-2 leads per domain ideal. 5+ suggests you're over-indexing on one company.
- **Score:** 100 if avg <2 per domain, 60 if avg 2-5, 30 if >5

### 4. Title relevance

- **What:** % of rows with a plausible buying role under the approved lead-scoring rubric
- **Rule:** On governed lists, `contact_role_points > 0` and `send_eligible = true` pass. Exact titles should score higher, but approved influencers and adjacent stakeholders do not reduce quality merely because their title is not exact. On legacy unscored lists only, fall back to the old exact-title and synonym check.
- **Score:** 100 when every row has a plausible buying role. Force the integrity gate to fail if an unrelated role leaked into the send file.

### 5. Source signal integrity

- **What:** % of rows with a clear source, signal, fit reason, and evidence when required
- **Rule:** If the campaign references a source signal, each referenced row needs `evidence_url` or a strong provider/source note. Weak source proof makes personalization unsafe.
- **Score:** 100 if >=90% have usable source proof, 50 if 60-90%, 0 if <60%

### 6. Bad-title detection

- **What:** % of titles matching known-bad patterns
- **Bad patterns:** `intern`, `assistant`, `coordinator`, `student`, `part-time`, `retired`, non-English titles when targeting US
- **Rule:** <2% is normal, >10% means your source or title filter is too loose
- **Score:** 100 if <2%, drops sharply after

### 7. Role / generic mailbox density

- **What:** % of emails sent to a role/generic mailbox instead of a named person — i.e. the local-part is `info`, `contact`, `hello`, `sales`, `admin`, `team`, `office`, `support`, `hr`, or similar.
- **Rule:** <5% acceptable for B2B outbound. Role inboxes draw lower reply rates and a higher spam-complaint risk than a named person's mailbox. (True **catch-all domain** density is a different signal and is already covered by Dimension 1's catch-all verification + the `is_catch_all` column from Deliverable.co / BetterContact — don't re-measure it here.)
- **Score:** 100 if <5%, 50 at 5-15%, 0 if >15%

### 8. ICP fit

- **What:** % of rows with a plausible customer relationship and current governed score
- **Requires:** the active rubric and scored fields on governed lists
- **Rule:** `company_market_points + company_offer_points > 0`, `send_eligible = true`, and no explicit exclusion pass. Ideal firmographics score higher for ordering, but an approved adjacent industry, serviceable size, or expansion geography does not lower the QA grade. On legacy unscored lists only, fall back to direct profile filters.

### 9. Name quality (gate — fabricated/pattern names fail the list)

- **What:** % with both first_name AND last_name populated AND looking like a **real, verifiable** human
- **Checks:** Not all-caps, not fake names ("Admin", "Info"), not email-as-name, and **not pattern/index-constructed** (e.g. a name back-derived from a `{first_initial}{last_name}@domain` email, or a DiscoLike `search-contacts` index-mode row). A real first + last name is the `/email-waterfall` finder key — a list missing it, or carrying fabricated names, is not Layer-2-valid and must be re-discovered via `generate-contacts`/a people-DB before it can be enriched or sent.
- **⛔ PROVENANCE CHECK — how were these people discovered? (hard gate, operator directive 2026-07-17.)** Read the list's `source` / discovery provenance. **Any contact discovered from a LinkedIn/Google search (Serper `site:linkedin.com/in` + an AI title-picker) FAILS the list** — that method is banned in `/email-waterfall` because Google's cached snippets carry no employment-currency signal, so it returns people who have **retired or left the company**. ⚠ **This dimension is the ONLY gate that can catch it, so it cannot be skipped.** Every other check goes green on these rows: the name is a real human, the LinkedIn URL is real, and a departed person's old mailbox often still verifies `valid`. Staleness is invisible to every test except "where did this person come from?" — so ask that question here. Contacts must come from a database with a **current-employer field** (Clay `search-contacts`, A-Leads `advanced_search`, ContaGen, Prospeo / LeadMagic). A list that cannot state its contact-discovery source does not pass. (This does not penalize the sanctioned Serper+OpenAI *backfill* of a `linkedin_url` onto a contact discovered from a real DB — that is a field fill, not a discovery source.)
- **Rule:** 95%+ real first+last names acceptable; any meaningful share of pattern/fabricated names is a hard fail (route back to contact discovery, do not send). **A SERP-discovered contact set is likewise a hard fail regardless of name quality** — re-discover from a current-employer database before sending.
- **Score:** 100 if 95%+ real-named, drops linearly; force to fail if pattern/fabricated names are detected.

### LinkedIn coverage (B2B completeness — reported, not weighted into the grade)

- **What:** % of B2B contacts with a populated `linkedin_url`. (B2C lists are exempt — skip this check.)
- **Why:** `linkedin_url` is a data-quality must-have for B2B contacts (operator directive 2026-06-20). It powers reply-handling and future personalization, and it should be on the finalized list AND mapped to the sending platform's native LinkedIn profile field on upload, where that platform has one.
- **Rule:** Like Dimension 1, this **reports** coverage rather than imposing a second hard gate (the "fill it" responsibility lives in `/email-waterfall`). Aim for full coverage; the honest ceiling varies by population (Nordic / larger firms ~high; small US-healthcare / SMB lower because many owners lack a findable profile). A wrong LinkedIn is worse than a blank one — never count a guessed URL as coverage.
- **Action item when coverage is low:** route the blanks back through `/email-waterfall`'s LinkedIn backfill. Clay `search-contacts-by-name` (name+domain) first (a 2026-07-12 report that A-Leads' `aleads_advanced_search` was retired was wrong, corrected 2026-07-14: see that provider's own API skill if `/stack-setup` activated its pack, and Clay remains a valid option here regardless), then verified Serper+OpenAI (URL from a real `linkedin.com/in` result, confirmed by name+company match; tool `scripts/linkedin_find_web.mjs`). Do NOT block the send on residual blanks that have no confident match.

## Letter grade mapping

Weighted average across 9 dimensions. Verification, source signal integrity, and ICP fit are weighted 2x:

| Average | Grade | Action |
|---|---|---|
| 90-100 | A+ / A | Ship it |
| 80-89 | B | Minor fixes, then ship |
| 70-79 | C | Fix top 3 issues first |
| 60-69 | D | Serious cleanup required |
| <60 | F | Don't send. Rebuild the list. |

## Example output

```
=== List Quality Scorecard ===

File: leads.csv (2,147 rows)
Grade: B (84/100)

Dimensions:
1. Email verification:    100/100  (100% verified, good)
2. Duplicate emails:       95/100  (1.1% duplicates - trim before send)
3. Duplicate domains:      78/100  (avg 2.4 per domain - some over-concentration)
4. Title relevance:        82/100  (85% titles match "VP Sales" / "Head of Sales")
5. Source signal integrity: 76/100  (18% missing evidence_url for signal-based copy)
6. Bad-title detection:    92/100  (3% Coordinators slipped in - filter)
7. Catch-all density:      80/100  (8% catch-all - hold back for young domains; reintroduce after maturity)
8. ICP fit:                88/100  (88% match declared industry filter)
9. Name quality:           97/100  (good)

Top 5 issues to fix:
1. 23 emails are duplicates (1.1%) - deduplicate before upload
2. 386 rows are missing evidence_url for the campaign signal - add evidence or remove signal-based copy
3. 64 leads are on catch-all addresses (3.0%) - hold in the catch-all holdback (reintroduce after domain maturity), not the initial send
4. 64 Coordinators in the list - filter by seniority >= Manager
5. 147 leads cluster on 12 domains (>5 each) - cap at 3 per domain

Pre-send checklist:
[ ] Deduplicate by email
[ ] Hold back ALL catch-alls on a young domain (Catch-All Timing gate, /email-waterfall) - reintroduce after ~2-3 weeks of positive sending, not a permanent drop
[ ] Filter out bad titles
[ ] Cap per-domain concentration
[ ] Remove or rewrite rows where the claimed signal lacks evidence
[ ] Re-run verifier if list shrunk >10%
```

## When to use

- AFTER the selected source workflow from `/lead-source-strategy`
- AFTER email finding and verification (/email-waterfall)
- BEFORE upload to the locked `run_state.sending_platform`

## When NOT to use

- On a list of <100 contacts. Sample too small for reliable stats. **This is a sample-size threshold on contact rows, not a campaign-eligibility floor, and it deliberately did NOT move when the eligibility floor rose to 500.** Eligibility is a separate company-axis test owned by `/campaign-strategy` (≥500 target companies, operator directive 2026-07-12). A compliant campaign can target 817 companies and still verify only 396 contacts, and that list grades normally here. Raising this number to match the company floor would tell that campaign to skip the scorecard, and that would skip Dimension 9's provenance gate.
- On a fully static list (same every send). Check once, reuse.

## Script Policy

No bundled scorecard script is currently required for this skill. If the user adds one later, keep this doc honest: name the actual file and verify it exists before telling an operator to run it.

## What to do next

**If grade >= B:** `/campaign-copywriting` to write the emails. Then upload with locked `run_state.sending_platform`:

- **Slot empty:** stop and route the operator to `/stack-setup`. Do not guess a platform.
- **A pack is active for the locked platform:** use the campaign upload skill `/stack-setup` activated for it.
- **No pack is active:** use that platform's native campaign create plus lead upload. If it exposes no such API, say so and hand the list over for a manual build.

Only show the upload path matching the locked `run_state.sending_platform`.

**If grade < C:** fix the top 3 issues (from scorecard output), re-run this skill until grade >= B. Don't upload a C-grade list - bounces and low reply rates will damage domain reputation.

**Or wait:** if large fixes are needed (missing email verification, 30%+ bad titles), address those BEFORE spending more on email-finding or enrichment.

## Related skills

- `/icp-prompt-builder` - more surgical ICP fit scoring (AI per-company)
- `/icp-onboarding` - produces the `client-profile.yaml` this skill checks against
- `/lead-source-strategy` - produces the source plan and evidence requirements
- `/lead-scoring` - owns the score, eligibility, priority tiers, and within-company rank
- /email-waterfall - run BEFORE this skill for verification coverage

## The 1% rule alignment

A list that scores below C-grade is very likely to produce reply rates below 1%, which violates the 1% rule (see `/email-deliverability-audit`). Catching list issues here saves you the deliverability hangover later.

