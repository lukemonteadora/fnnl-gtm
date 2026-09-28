---
name: icp-prompt-builder
description: Interactive loop to build and tune the prompt that classifies broad company fit (good, maybe, bad) and whether a claimed signal is supported, for /tam-build and external lists. NOT the governed 10-point priority score (use /lead-scoring).
---

# ICP Prompt Builder

**From the former description:** It is a cheap evidence-classification step, not the governed score. Adjacent marketable companies stay maybe. /lead-scoring owns the final transparent company, contact, and timing score before email spend. It runs inside Phase 3 (`/phase-3-list`, through `/tam-build`).

## Canonical Profile Root

All profiles/<business-slug> paths in this skill resolve under:

```text
<outbound>/profiles
```

Here `<outbound>` is the root of this skill library - resolve it to wherever the library is currently checked out (local Documents, OneDrive, or a git worktree); never hardcode an absolute path. Do not create client profiles under a `profiles/` folder at your current working directory.

Before paying to enrich thousands of companies, tune the qualification prompt on a small sample.

List builders and scrapers return companies or contacts. They do not know your client's ICP well enough to decide what should be sent.

**Two places this runs:**

1. **TAM fit gate (company-level, in `/tam-build` Layer 1a).** Tune the prompt on a ~40-row mixed sample of the cheap TAM layer (firmographics + the homepage crawl), then `/tam-build` scores `fit_status` (`good`/`maybe`/`bad`) across the whole TAM to gate the expensive extension enrichment to good-fit companies only. Inputs are company rows (no contacts), and the output maps to `fit_status` rather than `qualified` true/false.
2. **Per-campaign source sample (the original use, below).** After a lead source returns a sample for a chosen campaign, tune or reuse the prompt to qualify that slice before enrichment spend.

The loop below is identical for both; only the input sample and the place it runs differ. **The prompt tuned at the TAM gate is saved and reused at the per-campaign step**: don't re-tune from scratch; re-tune only if the campaign signal changes what "fit" means.

## Material Decision Rule

When this skill reaches a material fork, name the realistic options, recommend the strongest path, and explain why the main alternatives are weaker before committing.

Ask before choices that affect spend beyond an approved budget, provider routing, source of truth, list quality, campaign direction, client-facing output, live systems, scraping or account risk, or legal/compliance risk. For low-risk reversible choices, state the recommendation and proceed.

Do not turn failed or unsafe paths into user-facing options. If this skill's QA rules or stop gates reject a path, filter it out and explain the blocker only when useful.

When asking the user, use the Claude Desktop native Interactive Inputs / Choice Prompts pattern from /clarification-first: recommended option first, short choices, and Custom answer last when a custom answer is plausible.

## Interaction Policy

Defers to `/autonomous-execution-policy`. Under `run_state.execution_mode = auto_execute` (the new-client default since 2026-09-24, paired with `review_protocol: phase_checkpoints` so a run stops only at the one checkpoint that closes each of the four phases, `phase-protocol.md`; `review_gates` is opt-in), proceed without pausing: pick the strongest option per this skill's rubric, record it to `run_state`/profile, and continue. Never re-ask a decision already in `run_state`, the profile, memory, or the operator's latest message. Stop only for the policy's hard-stops (spend over the approved ceiling, live send, credentials, provider/source-of-truth change, safety gates). On a long async wait, background-poll and move to other productive work. Never idle.

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short: record status, not raw output. Full protocol: `client-activity-log.md`.

## Inputs

- `profiles/<business-slug>/client-profile.yaml`
- `profiles/<business-slug>/campaigns/<campaign-slug>/lead-source-plan.md`, when it exists
- A sample CSV from any selected source path, including company-lookalike tools, domain-to-person builders, maps and local-business extractors, contact-database exports, social-engagement sources, directories, job boards, event pages, marketplaces, web search and crawl results, or custom website scrapes
- At least 50 mixed rows if possible
- **For the TAM fit gate:** a ~40-row mixed sample of `tam.csv`'s cheap layer (identity + firmographics + the homepage-derived fields) from `/tam-build` Layer 1a: no contacts, no extension columns yet

Preserve these source fields when available:

```text
source,source_type,source_url,evidence_url,signal,fit_reason,source_confidence
```

## AI/API Routing

Everything AI in this skill runs inside Claude Code (no-AI-API rule, operator directive 2026-09-22). The tuning loop and the at-scale scoring pass both run on Claude Code Task sub-agents, fanned out per `/personalization-subagent-pattern` (disjoint batches, one output file per agent, post-merge dedup). Optional web-grounded context that helps judge fit comes from WebSearch/WebFetch inside those sub-agents, or from a `/deep-research` pass when a whole segment needs it. No outside AI provider, API key, or list-workbench AI column scores or crunches descriptions. Deterministic filters stay in plain code. Preserve the canonical source fields above (`evidence_url`, `source_confidence`, `signal`).

**Model tier for scoring (the Task tool's `model` setting, not an API call; `/ai-model-routing`, Model tiers for sub-agents).** At-scale scoring (Applying At Scale below) runs the locked prompt on mid-model sub-agents (`model: "sonnet"`) by default. Drop to the small model (`model: "haiku"`) only after a **20-row agreement check**: have a haiku sub-agent score 20 rows the operator already confirmed during the tuning loop, compare its labels with the confirmed ones, and switch only if they agree. Otherwise stay on sonnet. Where a suite exists for the job (for this scoring, the `company-fit` suite), the switch also needs a pass on its benchmark (`outbound/evals/README.md`); without a suite, the 20-row agreement check is still required.

## The Loop

### 1. Gather Context

Load `client-profile.yaml`.

Confirm:

- Ideal customer
- Must-have filters
- Disqualifiers
- Soft preferences
- Campaign signal from `lead-source-plan.md`
- Fields available in the sample CSV

### 2. Select 10 Test Companies

Pick a mixed batch:

- Likely good fits
- Likely bad fits
- Edge cases
- Different industries, sizes, and geographies

Each row should have at minimum:

- `company_domain`
- `company_name`
- `industry`
- `headcount`
- `description`
- `source`
- `signal`
- `evidence_url` when the campaign plans to reference the signal in copy

### 3. Build The Prompt

Use this structure:

```text
You are an ICP evaluator for <client>.

Target ICP:
<from client-profile.yaml>

Must match:
- <hard filter>

Disqualify if:
- <disqualifier>

Available fields:
- <CSV fields>

Campaign source plan:
<source family, exact signal, and evidence requirements from lead-source-plan.md>

Return JSON per company:
{
  "qualified": true | false,
  "confidence": 0.0-1.0,
  "signal_supported": true | false,
  "source_confidence": "high" | "medium" | "low",
  "reason": "one sentence that covers ICP fit and whether the source signal is real"
}
```

For the **TAM fit-gate** use, return `fit_status` (`good` | `maybe` | `bad`) instead of `qualified`. `bad` is reserved for a genuinely outside-market company, wrong entity, or no plausible customer relationship. Adjacent industries, serviceable sizes, approved expansion markets, and other imperfect but real prospects are `maybe`. Keep `confidence` as `fit_confidence` and drop `signal_supported` because there is no campaign signal yet. `/tam-build` enriches `good` and `maybe`; `/lead-scoring` later ranks them.

### 4. Score 10 Rows

Use Claude Code Task sub-agents for the scoring pass.

Show the user a table:

```text
Company | Qualified | Signal Supported | Confidence | Reason
```

### 5. Collect Corrections

**Under `auto_execute` (the new-client default since 2026-09-24), do not ask.** An independent sub-agent that never saw the prompt's reasons labels the same stratified rows (two 10-row rounds, 20 in all). Lock when it agrees with the prompt's `qualified` call (or its `fit_status` call, for the TAM fit-gate use) on at least 17 of 20 and no hard exclusion was scored as qualified (or as anything but `bad`, for the TAM fit-gate use). On disagreement, fix the prompt and re-run, at most two rounds; a third disagreement stops and asks, because a fit prompt that an independent reader keeps overruling would spend the budget on the wrong companies. Report the agreement count at the next checkpoint (`/cold-email-kickoff`, "How a run stops"). The same pattern as `/lead-scoring`'s `auto_execute` calibration.

Under `review_gates`, ask:

```text
Which rows are wrong?

A. [Recommended if all rows look right] No corrections
B. I will name the wrong row numbers and why
C. Show me the scoring logic before I correct it
D. Custom answer
```

If the user gives corrections, update the prompt and run a new batch.

If the user gives zero corrections, count that as one approved round.

### 6. Stop Rule

The prompt is locked only when:

- Two consecutive 10-row rounds have zero corrections, or
- The user explicitly says to lock it, or
- Under `auto_execute`, the independent sub-agent check in step 5 passes

One correction resets the approval streak.

### 7. Save

Save the final prompt to:

```text
profiles/<business-slug>/icp-prompt.txt
```

Append metadata to `client-profile.yaml`:

```yaml
icp_qualification_prompt:
  path: profiles/<business-slug>/icp-prompt.txt
  tuned_at: YYYY-MM-DD
  rounds_to_convergence: <int>
  final_batch_size: 10
```

## Applying At Scale

Default path:

1. Split the remaining list into batches of 20-50.
2. Run Task sub-agents with the locked prompt, `model: "sonnet"` by default (drop to `model: "haiku"` only after the 20-row agreement check described in AI/API Routing above).
3. Keep every `good` and `maybe` row. Low confidence or an unsupported campaign signal may lower score confidence, offer points, or timing points. It is not a deletion rule.
4. Exclude only `bad` rows and explicit hard exclusions, with a written reason.
5. Preserve `source`, `source_type`, `source_url`, `evidence_url`, `signal`, `fit_reason`, and `source_confidence`.
6. Save the classified list as `leads.fit-reviewed.csv`, then invoke `/lead-scoring` to produce `campaigns/<campaign-slug>/leads.scored.csv` before `/email-waterfall`.

If the user has a separate deterministic scoring script or spreadsheet workflow, use that only after the prompt is locked. An AI-provider API pipeline or a list-workbench AI column is not an option (no-AI-API rule); a bigger list gets more sub-agent batches, not a different engine.

## Recommended Flow

**At TAM build (company-level fit gate):**

1. `/data-point-discovery` → `/tam-build` discovers the universe + cheap firmographics + homepage crawl (Layer 1a)
2. `/icp-prompt-builder` tunes the fit prompt on a ~40-row cheap-layer sample
3. `/tam-build` scores `fit_status` across the TAM and enriches `good`+`maybe` only (Layer 1b)

**Per campaign (the original source-sample use):**

1. `/icp-onboarding`
2. `/lead-source-strategy`
3. One source sample
4. `/icp-prompt-builder` (reuse the prompt tuned at the TAM gate; re-tune only if the campaign signal changes fit)
5. Scale the list source only after the prompt is locked
6. `/lead-scoring` for an external list, or carry forward the current scored TAM fields for a TAM slice
7. `/email-waterfall`
8. `/list-quality-scorecard`
9. Locked platform upload only after copy QA

## Common Mistakes

- Scoring 50 at once. It hides errors.
- Letting the prompt that scored the rows judge them. Under `review_gates` the user approves; under `auto_execute` an independent sub-agent that never saw the reasons does (step 5).
- Ignoring negative examples.
- Treating soft triggers as hard filters.
- Accepting a claimed signal without `evidence_url` or a strong source note.
- Forgetting to save the prompt.
- Treating `qualified`, `fit_confidence`, or an old `score` field as the governed 10-point lead score.

## Related Skills

- `/icp-onboarding`
- `/lead-source-strategy`
- The source path `/lead-source-strategy` selects (company-lookalike, domain-to-person, maps or local-business, contact-database export, or social engagement), run through whichever pack `/stack-setup` activated for that tool, otherwise the provider's own export
- /email-waterfall
- `/list-quality-scorecard`

