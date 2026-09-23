---
name: list-quality-scorecard
description: Pre-send quality scorecard for a scored and verified lead list. Row-level first, it drops or quarantines failing rows (suppressed, duplicate, broken-name, bad-title, domain-mismatch) and grades the remainder, and it blocks the whole list only on a systemic failure (unverified rows, SERP-sourced or pattern-named contacts, exclusion or scoring leakage). Reports the P1 through P5 mix without penalizing adjacent lower-score leads. Run after /email-waterfall and before upload.
---

# List Quality Scorecard

A CSV of 5,000 leads is not the same as a good list of 5,000 leads. This skill grades your list across 9 dimensions BEFORE you send, catching preventable waste.

**Row-level first (Aaron process alignment, operator directive 2026-09-22; supersedes the house rule that one whole-list letter grade decides the list, with "rebuild the list" at F).** Failing rows are dropped or quarantined, then the 9 dimensions and the letter grade are computed on the remainder, and the grade B upload gate applies to that remainder. Only a systemic failure blocks the whole list. Aaron's Sep 21 scorecard works this way: he removed 151 already-suppressed rows and 150 rows with broken name fields, then shipped the rest.

## Material Decision Rule

When this skill reaches a material fork, name the realistic options, recommend the strongest path, and explain why the main alternatives are weaker before committing.

Ask before choices that affect spend beyond an approved budget, provider routing, source of truth, list quality, campaign direction, client-facing output, live systems, scraping or account risk, or legal/compliance risk. For low-risk reversible choices, state the recommendation and proceed.

Do not turn failed or unsafe paths into user-facing options. If this skill's QA rules or stop gates reject a path, filter it out and explain the blocker only when useful.

When asking the user, use the Claude Desktop native Interactive Inputs / Choice Prompts pattern from /clarification-first: recommended option first, short choices, and Custom answer last when a custom answer is plausible.

## Interaction Policy

Defers to `/autonomous-execution-policy`. Under `run_state.execution_mode = auto_execute` (opt-in per client; the default is `review_gates`), proceed without pausing: pick the strongest option per this skill's rubric, record it to `run_state`/profile, and continue. Never re-ask a decision already in `run_state`, the profile, memory, or the operator's latest message. Stop only for the policy's hard-stops (spend over the approved ceiling, live send, credentials, provider/source-of-truth change, safety gates). On a long async wait, background-poll and move to other productive work. Never idle. Autonomy does NOT relax the copy-QA gates: `spam-word-checker.md` and `cold-email-copy-best-practices.md` remain HARD gates that block on fail regardless of execution mode.

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short: record status, not raw output. Full protocol: `client-activity-log.md`.

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
- **Systemic check result** (pass, or the systemic failure that blocks the whole list)
- **Row-level cleanup summary** (rows dropped, quarantined, or moved back to the stagger queue, per check, and the share of the list each check removed)
- **Letter grade** (A+ to F), computed on the remainder
- **9 dimension scores** (each 0-100; Dimension 5 may read N/A)
- **Top 5 issues to fix**
- **Pre-send checklist**
- **P1 through P5 distribution**, median score, and low-confidence count

It also rewrites the send file. The clean remainder is written back as `leads.verified.csv` (the file every downstream gate and the upload read), after the pre-scorecard file is kept as `leads.verified.pre-scorecard.csv` so every removal stays auditable. Quarantined rows go to `leads.review.csv` with `review_reason = scorecard_<check>` (add the `review_reason` column when the file does not carry one yet). Same-wave overflow rows go back to the stagger queue in the scored source file. Dropped rows (suppression matches, duplicate emails) leave the send file but stay in the pre-scorecard copy, so nothing is deleted. The list workbench's send-list table still holds the pre-scorecard rows, because a webhook push appends and cannot remove, so the scorecard states the removed count and the operator filters those rows there; the upload reads the local file either way.

## AI/API Routing

Grading this list runs in the Claude Code session (no-AI-API rule, operator directive 2026-09-22); no outside AI provider or API key is used. The scorecard math and letter-grade rules in this file remain the source of truth, and everything countable (fill rates, duplicates, verification status, score fields) is computed in plain code, not judged. ICP-fit and title-relevance judgment that needs reasoning is done by Claude in-session; on a large list, it and any free-text normalization of titles and industries fan out across Claude Code sub-agents per `/personalization-subagent-pattern` (disjoint row batches, one output file per agent, post-merge dedup). Record the validator in `ai_analysis_provider` (`claude-native`, or `claude-native (sub-agents)`) and the outcome in `qa_status`. Dimension 5 keys off the canonical `evidence_url` and `source_confidence` fields: keep those names.

## Usage

Create the scorecard by reading the CSV directly or using the user's available spreadsheet/script tooling. Optional `client-profile.yaml` context lets the scorecard compare your list against declared ICP filters from `/icp-onboarding`.

## Step 1: systemic blocks (the whole list fails)

Run these binary checks before any row-level cleanup. Each one means an upstream gate failed, so no row in the file can be trusted and dropping the bad rows would hide the fault. Fail the list and route it back:

- **Unverified rows.** Any send-file row whose email did not pass the email verifier to the `/email-waterfall` standard. Route back to `/email-waterfall`.
- **SERP-sourced or pattern-named contacts.** Any contact discovered from a LinkedIn or Google search with an AI title-picker, or a list whose names were pattern- or index-constructed by its discovery source (Dimension 9's provenance check). Route back to contact discovery.
- **Exclusion or scoring leakage (the `/lead-scoring` gate failed).** Any row with `send_eligible != true`, an exclusion reason, an explicit hard-no, or `fit_status = bad` / `co_fit_status = bad`; a blank or invalid `lead_score`, `priority_tier`, `score_reason`, `score_version`, or `scored_at`; a score outside 2.0 to 10.0 or a tier that does not match the numeric score; or a score version that differs from the active client-and-offer rubric. Route back to `/lead-scoring`.

## Step 2: row-level cleanup (drop or quarantine, then grade the rest)

When no systemic block fires, clean the file row by row, then compute the 9 dimensions on the remainder:

- **Suppression match:** drop. `/email-waterfall` already stops before any paid spend on a suppressed row, so a match here is one added after that check (new unsubscribes and negative replies from live campaigns). It is removed, not a list failure.
- **Duplicate email:** drop all but the highest-scored row.
- **`same_wave_eligible != true`:** move back to the stagger queue (a later wave), never deleted.
- **Broken name fields on individual rows** (blank last name, all-caps, email-as-name, "Admin", "Info"): quarantine.
- **Bad title** (Dimension 6 patterns) and **domain mismatch** (Dimension 8's domain-relevance check): quarantine. Role or generic mailboxes are not removed here; Dimension 7 grades their share.
- **A row whose copy states a row-level signal it has no evidence for** (only when Dimension 5 applies): move it to the offer-led variant with no signal line, or quarantine it.

Report the count and share each check removed. A large share is a source-quality finding for `/lead-source-strategy` and the next build, not a block on the clean remainder.

Report the score distribution. Do not lower the grade because the list contains P3, P4, or P5 rows. Those are marketable adjacent leads by design. Grade identity, provenance, suppression safety, verification, and evidence integrity instead.

## The 9 dimensions

### 1. Email verification coverage (critical)

- **What:** % of emails that are fully verified to standard, i.e. **third-party email-verified AND catch-all verified** (the `/email-waterfall` Verification Doctrine). Both checks are always required; how they were achieved is not. A send-safe email is one that EITHER (a) already existed and **passed verify-first** (email + catch-all via Deliverable.co), no waterfall needed, OR (b) was **found by a BetterContact waterfall**, whose 4-layer check + catch-all classification delivers both at once. "An email exists", "passed a bare verifier with no catch-all check", or an index/pattern-derived email does NOT count as verified here.
- **Rule:** The hard pass/fail verification gate is owned by `/email-waterfall` (it blocks upload unless the send file is 100% verified to that standard). This dimension **reports** coverage; it does not impose a second, conflicting threshold. A clean send list should read 100% here because the waterfall/verify gate already enforced it.
- **Score:** 100 if the list is 100% verification-checked (waterfall gate passed); drops proportionally with any unchecked rows (0 if <50% checked). If this reads below 100%, the list bypassed `/email-waterfall`: route it back, do not send.

### 2. Duplicate email rate

- **What:** % of duplicate emails in the list
- **Rule:** <1% acceptable, >5% is a problem. Duplicates are dropped in Step 2, so the remainder normally reads 100 here; the pre-cleanup rate goes in the cleanup summary as a source-quality finding.
- **Score:** 100 at 0%, drops linearly

### 3. Duplicate domain rate

- **What:** max # of leads from any single domain
- **Rule:** 1-2 leads per domain ideal. 5+ suggests you're over-indexing on one company.
- **Score:** 100 if avg <2 per domain, 60 if avg 2-5, 30 if >5

### 4. Title relevance

- **What:** % of rows with a plausible buying role under the approved lead-scoring rubric
- **Rule:** On governed lists, a row with `send_eligible = true` passes. That flag is `/lead-scoring`'s verdict, so never re-derive it from `contact_role_points`: a blank role tier and a classified `unrelated` role both score 0.0, and only the `score_reason` token tells them apart. A blank role (`role=missing` in `score_reason`) is missing evidence, not a failed role. It passes, and the report counts those rows without grading them down. Exact titles should score higher, but approved influencers and adjacent stakeholders do not reduce quality merely because their title is not exact. On legacy unscored lists only, fall back to the old exact-title and synonym check.
- **Score:** 100 when every row passes. Scoring leakage is only a classified `unrelated` role (`role=unrelated` in `score_reason`) on a row with `send_eligible = true`: force the Step 1 systemic block. A blank role is never leakage.

### 5. Source signal integrity (scored only when the copy references a row-level signal)

- **When it applies (Aaron process alignment, operator directive 2026-09-22; supersedes scoring it on every list):** only when the copy references, or the campaign plan says the copy will reference, a row-level signal, meaning a per-row fact stated about that prospect (a job post, a funding round, an event appearance, a tech install). Otherwise mark it **N/A** and drop it from the weighting, so a broad offer-first list is never marked down for a signal it never claimed. Aaron's own scorecard checks relevance (titles, ICP alignment, domain relevance, bad filtering), not signal provenance (Sep 21), and his lists often carry no signal (Sep 14). If copy written after this scorecard adds a row-level signal line, re-score this dimension before upload.
- **What:** % of the signal-referencing rows with a clear source, signal, fit reason, and evidence
- **Rule:** Each referenced row needs `evidence_url` or a strong provider/source note. Weak source proof makes personalization unsafe.
- **Score:** 100 if >=90% have usable source proof, 50 if 60-90%, 0 if <60%

### 6. Bad-title detection

- **What:** % of titles matching known-bad patterns
- **Bad patterns:** `intern`, `assistant`, `coordinator`, `student`, `part-time`, `retired`, non-English titles when targeting US
- **Rule:** <2% is normal, >10% means your source or title filter is too loose. Bad-title rows are quarantined in Step 2, so the remainder normally reads 100 here; the pre-cleanup share goes in the cleanup summary as a source-quality finding.
- **Score:** 100 if <2%, drops sharply after

### 7. Role / generic mailbox density

- **What:** % of emails sent to a role/generic mailbox instead of a named person, i.e. the local-part is `info`, `contact`, `hello`, `sales`, `admin`, `team`, `office`, `support`, `hr`, or similar.
- **Rule:** <5% acceptable for B2B outbound. Role inboxes draw lower reply rates and a higher spam-complaint risk than a named person's mailbox. (True **catch-all domain** density is a different signal and is already covered by Dimension 1's catch-all verification + the `is_catch_all` column from Deliverable.co / BetterContact. Don't re-measure it here.)
- **Score:** 100 if <5%, 50 at 5-15%, 0 if >15%

### 8. ICP fit

- **What:** % of rows with a plausible customer relationship and current governed score
- **Requires:** the active rubric and scored fields on governed lists
- **Rule:** On governed lists, a row with `send_eligible = true` and no explicit exclusion passes. Never re-derive fit from `company_market_points + company_offer_points`: a blank tier and a classified `none` both score 0, and only the `score_reason` tokens tell them apart. A blank market or offer tier (`market=missing` or `offer=missing` in `score_reason`) is missing evidence that passes, and the report counts those rows without grading them down. Scoring leakage is only a row whose market and offer were both classified `none` (the `market=none` and `offer=none` tokens both present in `score_reason`) that still carries `send_eligible = true`: force the Step 1 systemic block. One `none` beside a blank tier (for example `market=none` with `offer=missing`) still passes. Ideal firmographics score higher for ordering, but an approved adjacent industry, serviceable size, or expansion geography does not lower the QA grade. On legacy unscored lists only, fall back to direct profile filters.
- **Domain relevance (folded in here, Aaron process alignment, operator directive 2026-09-22):** each row's email domain matches its `company_domain`, and that `company_domain` is the company that was scored as the ICP match. A mismatch (a free-mail address, a different company's domain, a stale parent or acquired-company domain) is quarantined in Step 2 with `review_reason = scorecard_domain_mismatch`, since some mismatches are legitimate (a separate corporate email domain) and a person can confirm them. Aaron names "domain relevance" as one of his Sep 21 scorecard checks without defining it, so this reading is the house's.

### 9. Name quality (gate: fabricated/pattern names fail the list)

- **What:** % with both first_name AND last_name populated AND looking like a **real, verifiable** human
- **Checks:** Not all-caps, not fake names ("Admin", "Info"), not email-as-name, and **not pattern/index-constructed** (e.g. a name back-derived from a `{first_initial}{last_name}@domain` email, or a DiscoLike `search-contacts` index-mode row). A real first + last name is the `/email-waterfall` finder key: a list missing it, or carrying fabricated names, is not Layer-2-valid and must be re-discovered via `generate-contacts`/a people-DB before it can be enriched or sent.
- **⛔ PROVENANCE CHECK:** how were these people discovered? (hard gate, operator directive 2026-07-17.) Read the list's `source` / discovery provenance. **Any contact discovered from a LinkedIn/Google search (Serper `site:linkedin.com/in` + an AI title-picker) FAILS the list**: that method is banned in `/email-waterfall` because Google's cached snippets carry no employment-currency signal, so it returns people who have **retired or left the company**. ⚠ **This dimension is the ONLY gate that can catch it, so it cannot be skipped.** Every other check goes green on these rows: the name is a real human, the LinkedIn URL is real, and a departed person's old mailbox often still verifies `valid`. Staleness is invisible to every test except "where did this person come from?" So ask that question here. Contacts must come from a database with a **current-employer field** (A-Leads `advanced_search`, ContaGen, Prospeo / LeadMagic). A list that cannot state its contact-discovery source does not pass. (This does not penalize the sanctioned *backfill* of a `linkedin_url` onto a contact discovered from a real DB, through `/email-waterfall`'s LinkedIn backfill: that is a field fill, not a discovery source.)
- **Rule:** Broken name fields on individual rows are quarantined in Step 2 and the remainder is graded (Aaron removed 150 broken-name rows and shipped, Sep 21). Pattern- or index-constructed names produced by a discovery source are a Step 1 systemic block (route back to contact discovery, do not send), because the source itself fabricates people. **A SERP-discovered contact set is likewise a systemic block regardless of name quality:** re-discover from a current-employer database before sending.
- **Score:** on the remainder, 100 if 95%+ real-named, drops linearly; force the Step 1 block if pattern/fabricated names from a discovery source are detected.

### LinkedIn coverage (B2B completeness: reported, not weighted into the grade)

- **What:** % of B2B contacts with a populated `linkedin_url`. (B2C lists are exempt. Skip this check.)
- **Why:** `linkedin_url` is a data-quality must-have for B2B contacts (operator directive 2026-06-20). It powers reply-handling and future personalization, and it should be on the finalized list AND mapped to the sending platform's native LinkedIn profile field on upload, where that platform has one.
- **Rule:** Like Dimension 1, this **reports** coverage rather than imposing a second hard gate (the "fill it" responsibility lives in `/email-waterfall`). Aim for full coverage; the honest ceiling varies by population (Nordic / larger firms ~high; small US-healthcare / SMB lower because many owners lack a findable profile). A wrong LinkedIn is worse than a blank one: never count a guessed URL as coverage.
- **Action item when coverage is low:** route the blanks back through `/email-waterfall`'s LinkedIn backfill. The contact-discovery tool's own name+domain lookup first (whatever fills `lead_data.contact_discovery` in the stack contract; use that tool's own API skill if `/stack-setup` activated a pack for it). Never use the list workbench's built-in search for this: it spends the workbench's own credits, which the zero-workbench-credit HARD RULE forbids (CLAUDE.md section 7). Then the stack contract's contact-enrichment tools for the residue (a returned profile URL is written only when the record's name AND company match the contact), and, as a last resort on a small residue, the Claude sub-agent WebSearch check `/email-waterfall` describes, under the same match gate. The old third-party web-search-plus-model residue script is retired (no-AI-API rule, operator directive 2026-09-22). Do NOT block the send on residual blanks that have no confident match.

## Letter grade mapping

Weighted average across the 9 dimensions, computed on the remainder after Step 2. Verification, source signal integrity, and ICP fit are weighted 2x. When Dimension 5 is N/A it is removed from both the numerator and the denominator, so the total weight drops from 12 to 10 (the 8 dimensions present, with verification and ICP fit still 2x):

| Average | Grade | Action |
|---|---|---|
| 90-100 | A+ / A | Ship it |
| 80-89 | B | Minor fixes, then ship |
| 70-79 | C | Fix top 3 issues first |
| 60-69 | D | Serious cleanup required |
| <60 | F | Don't send this remainder. Row-level issues were already removed, so a low grade here means a cause Step 2 cannot fix row by row: find it, fix it upstream, and re-run. |

## Example output

```
=== List Quality Scorecard ===

File: leads.verified.csv (2,147 rows)
Systemic check: PASS (100% verified, contacts from a current-employer contact database, no exclusion or scoring leakage)

Row-level cleanup (2,147 -> 1,991 rows):
- 23 duplicate emails dropped (1.1%)
- 31 suppression matches dropped (1.4%)
- 64 Coordinators quarantined as bad titles (3.0%)
- 12 broken name fields quarantined (0.6%)
- 18 email/company domain mismatches quarantined (0.8%)
- 8 same-wave overflow rows moved back to the stagger queue

Grade on the remainder: A (95/100 = weighted sum 950 / total weight 10, since Dimension 5 is N/A)

Dimensions (on 1,991 rows):
1. Email verification:     100/100  (100% verified)
2. Duplicate emails:       100/100  (duplicates dropped in cleanup)
3. Duplicate domains:      100/100  (avg 1.6 per domain)
4. Title relevance:        100/100  (every row a plausible buyer; 61% exact titles)
5. Source signal integrity:   N/A   (offer-led copy, no row-level signal line; removed from the weighting)
6. Bad-title detection:    100/100  (bad titles quarantined in cleanup)
7. Role mailbox density:    50/100  (6.0% role mailboxes)
8. ICP fit:                100/100  (every row a plausible customer; 88% ideal firmographics, the rest approved adjacent)
9. Name quality:           100/100  (97% real-named after cleanup)

Top issues found:
1. 119 role mailboxes (6.0%) remain - above Dimension 7's 5% band, so it scores 50; graded, not removed; tighten the source filter for the next build
2. 64 Coordinators came through the title filter - tighten the seniority filter at the source for the next build
3. 18 rows carry a different domain than the scored company - review leads.review.csv before any reintroduction

Pre-send checklist:
[x] Deduplicate by email
[x] Drop suppression matches
[x] Quarantine bad titles, broken names, and domain mismatches
[x] Move same-wave overflow back to the stagger queue
[ ] Hold back ALL catch-alls on a young domain (Catch-All Timing gate, /email-waterfall) - reintroduce after ~2-3 weeks of positive sending, not a permanent drop
[ ] If copy later adds a row-level signal line, re-score Dimension 5 before upload
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

**If the remainder grades below B:** fix the top 3 issues (from scorecard output), then re-run this skill: quarantine what can be removed row by row, regrade, and upload once the remainder reaches B. Don't upload a remainder that grades C or lower: bounces and low reply rates will damage domain reputation.

**If a systemic block fired** (unverified rows, SERP-sourced or pattern-named contacts, exclusion or scoring leakage): route the list back to the owning skill named in Step 1. Nothing ships until it is fixed.

**If Step 2 removed a large share** (for example 30%+ bad titles): the clean remainder can still ship, but the source filter is loose. Fix it before spending more on email finding or enrichment for the next batch.

## Related skills

- `/icp-prompt-builder` - more surgical ICP fit scoring (AI per-company)
- `/icp-onboarding` - produces the `client-profile.yaml` this skill checks against
- `/lead-source-strategy` - produces the source plan and evidence requirements
- `/lead-scoring` - owns the score, eligibility, priority tiers, and within-company rank
- /email-waterfall - run BEFORE this skill for verification coverage

## The 1% rule alignment

A list that scores below C-grade is very likely to produce reply rates below 1%, which violates the 1% rule (see `/email-deliverability-audit`). Catching list issues here saves you the deliverability hangover later.

