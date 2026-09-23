---
name: lead-scoring
description: Build, tune, validate, and apply the governed 1.0-to-10.0 lead-priority score after the company and contact TAMs exist but before campaign selection, email reveal, verification, or sending. Use for any TAM or campaign list that needs transparent company-fit, contact-fit, and timing points; client-and-offer-level scoring rubrics; priority tiers; hard-exclusion handling; or score-ordered enrichment and outreach.
---

# Lead Scoring

Turn the built company and contact TAM into an auditable outreach queue. The score orders work. It never estimates conversion probability, deletes lower but marketable tiers, or replaces email verification.

## Canonical paths

Resolve every `profiles/<business-slug>/...` and `scripts/...` path under `outbound/`.

Read:

- `profiles/<business-slug>/client-profile.yaml`
- `profiles/<business-slug>/data-point-catalog.md`
- `profiles/<business-slug>/tam/tam.csv`
- `profiles/<business-slug>/tam/contacts.csv`
- `profiles/<business-slug>/suppression-list.csv`, when present
- The locked offer and confirmed segment definitions

Write:

```text
profiles/<business-slug>/lead-scoring-rubric.yaml
profiles/<business-slug>/tam/tam.scored.csv
profiles/<business-slug>/tam/contacts.scored.csv
profiles/<business-slug>/tam/lead-scoring-report.md
```

For an external campaign list that did not originate from the contact TAM, also write:

```text
profiles/<business-slug>/campaigns/<campaign-slug>/leads.scored.csv
```

Never overwrite `tam.csv` or `contacts.csv`. The scored files are derived outputs that can be rebuilt when the offer, ICP, or timing data changes.

## List workbench: publish the queue where the operator can watch (HARD RULE, operator directive 2026-09-22)

The scored queue is published to the list workbench (`run_state.list_workbench`, contract slot `lead_data.list_workbench`) by default, so the operator watches the ranked list fill live instead of receiving a CSV assembled out of sight. The full mechanics live in `<outbound>/stack-contract.yaml` at `lead_data.list_workbench.build_protocol`. This section covers only what scoring does.

- **Readiness.** The `scored` table is ready only when `list_workbench_tables.scored` in `profiles/<business-slug>/client-profile.yaml` has `ready: true`, `auto_run_off: true` (a table that auto-runs columns on arriving rows can spend workbench credits) and a non-empty `webhook_url`; the push script checks all three and exits 3 when any is missing. The operator creates the table in the workbench and fills those in, because the session cannot create tables or columns.
- **Push.** After the scoring script writes the P1-to-P5 contact queue, push it with `node scripts/workbench_push.mjs --client <business-slug> --table scored --stage scored --csv profiles/<business-slug>/tam/contacts.scored.csv`. On the external-campaign path, push `profiles/<business-slug>/campaigns/<campaign-slug>/leads.scored.csv` the same way and add `--campaign <campaign-slug>`. Do not push `tam.scored.csv`, since every contact row already carries its company points. A webhook push costs zero workbench credits, so it is not paid spend.
- **The CSV stays the working copy.** Every downstream skill reads the local scored file, because the workbench's API cannot read a table back below its top plan tier. The table is the operator's live view, and edits made there come back only as a manual export.
- **Fallback, never a block.** If `run_state.list_workbench` is unset or the `scored` table is not ready, write the scored CSV natively and finish scoring. Open the scoring report (`profiles/<business-slug>/tam/lead-scoring-report.md`) and the activity-log entry with "list workbench not ready: scored CSV-only". The push never changes `scoring_stage`.
- **Zero workbench credits.** Scoring is deterministic arithmetic in Claude Code. Never use a workbench AI column, a formula that runs on credits, or a workbench enrichment to compute or fill any score input or tier.
- **Verify.** Compare the script's pushed count to the CSV row count and report "pushed N/N rows to scored (list_stage=scored)". A shortfall goes at the top of the scoring report.

## Workflow position and gate

Run after `/tam-build` has:

1. Built the full company TAM.
2. Applied explicit hard exclusions and the broad `good` / `maybe` / `bad` fit classification.
3. Built the contact TAM with every ICP-relevant decision-maker and the `co_*` company join.

Run before `/campaign-strategy` and before any `/email-waterfall` email reveal or verification call.

Use this run-state field:

```yaml
run_state:
  status:
    scoring_stage: none | rubric_ready | complete
```

- `none`: no approved, schema-valid rubric exists.
- `rubric_ready`: the rubric and normalized tier inputs validate, but the full list is not scored.
- `complete`: every company and contact row was processed; every eligible contact has a score, priority tier, confidence, and reason; every ineligible row has an exclusion reason.

`/campaign-strategy` and `/email-waterfall` must stop when a TAM-backed path has `scoring_stage != complete`.

## Fixed scoring shell

The component maxima never change between clients. Client customization changes the definitions that map actual values into the named tiers.

| Component | Max | Allowed tiers and points |
|---|---:|---|
| `market` | 2.0 | `exact` 2.0, `adjacent` 1.5, `broad` 1.0, `weak` 0.5, `none` 0 |
| `offer` | 1.5 | `clear` 1.5, `strong` 1.0, `plausible` 0.5, `none` 0 |
| `size` | 1.0 | `ideal` 1.0, `adjacent` 0.75, `serviceable` 0.5, `fringe` 0.25, `none` 0 |
| `geo` | 0.5 | `core` 0.5, `expansion` 0.25, `unsupported` 0 |
| `role` | 2.5 | `exact` 2.5, `strong` 2.0, `influencer` 1.5, `adjacent` 1.0, `weak` 0.5, `unrelated` 0 |
| `authority` | 1.5 | `ideal` 1.5, `decision_capable` 1.0, `influencer` 0.5, `none` 0 |
| `timing` | 1.0 | `strong` 1.0, `useful` 0.75, `moderate` 0.5, `weak` 0.25, `none` 0 |

Total maximum: 10.0.

Use only the strongest verified timing signal. Multiple signals never add past 1.0.

## Hard exclusions and marketability

Keep exclusions separate from the score. A high score can never override one, and a low score is never an exclusion by itself.

An explicit exclusion is one of:

- `hard_no` or a client-declared `industries_out` / `hard_no_categories` match
- A client-wide suppression match
- `wrong_entity`
- A legal, compliance, or do-not-contact block
- `fit_status = bad`, where `bad` means genuinely outside the market rather than merely adjacent
- No plausible customer relationship after the company evidence is classified
- No plausible buying relationship after the contact evidence is classified

Treat adjacent but marketable companies as `fit_status = maybe`, not `bad`.

Eligibility requires:

- No explicit exclusion.
- `market_points + offer_points > 0` when both tiers are classified. Both classified as `none` is `no_plausible_customer_relationship`.
- `role_points > 0` when the role tier is classified. A classified `unrelated` is `no_plausible_buying_relationship`.

A blank tier is unknown evidence, never a zero verdict. It earns no points and lowers confidence, but it never makes a row ineligible, so a row with a blank market and offer, or a blank role, stays eligible and the report counts it. When those conditions pass, clamp a raw score below 2.0 to 2.0. This keeps the full marketable range at 2.0 to 10.0. Rows that fail the conditions stay in the scored output with `send_eligible = false` and a machine-readable `exclusion_reason`.

## Build the client rubric

Do not start from a generic title list. Read the real inputs first.

1. Inspect every input CSV header and summarize value coverage for the candidate scoring columns.
2. Read the locked offer, ICP hard and soft filters, segment definitions, data-point catalog, and source evidence.
3. Build one client-and-offer rubric with segment-specific mappings for:
   - Exact, adjacent, broad, weak, and excluded markets.
   - Ideal, adjacent, serviceable, and fringe size bands.
   - Core, approved-expansion, and unsupported geographies.
   - Exact buyers, strong equivalents, influencers, adjacent stakeholders, and unrelated roles.
   - Authority levels in company-size context. A CEO at a 20-person business and a CEO at a 5,000-person business do not automatically have the same buying proximity.
   - Verified company and contact timing signals.
4. Save `lead-scoring-rubric.yaml` as normal YAML with `schema_version`, `score_version`, client, offer, segments, fixed component tables, explicit exclusions, normalization mappings, confidence thresholds, and a default same-wave contact cap of 2.
5. Add `evidence_columns` for all seven components. Each entry lists only real headers from its normalized scoring input. The script rejects a missing or invented header.
6. Validate that the component maxima sum to exactly 10.0 and that every named input column exists or is explicitly marked derived.

Start from `<outbound>/reference/lead-scoring-rubric-template.yaml`, then replace every sample mapping and evidence column with client-specific values. A sample value left in place merely to satisfy validation is a failed rubric.

The rubric scope is the client plus its locked offer set, with per-segment mappings: the `offer` component scores each row against its own segment's primary (`offer.segments[<segment>]` when the client has per-buyer-type offer sets, otherwise the top-level `offer` block; operator decision 2026-09-22). Do not rebuild it per campaign or per scrape. Rebuild only when the ICP or offer changes (an offer arm added to a live wave is a background rescore of the offer component, see Refresh).

## Normalize evidence before arithmetic

AI may interpret messy text. It may not invent the final number.

For each company, emit these named tier fields from real row evidence:

```text
score_market_tier
score_offer_tier
score_size_tier
score_geo_tier
score_market_reason
score_offer_reason
score_size_reason
score_geo_reason
```

For each contact, emit:

```text
score_role_tier
score_authority_tier
score_timing_tier
score_role_reason
score_authority_reason
score_timing_reason
```

Use the rubric's actual input-column mapping. Common source aliases include:

- Company size: `headcount`, `headcount_range`, `headcount_band`, revenue, or ARR bands.
- Company market: `industry`, `description`, `business_model`, `segment`, `sells_to_*`, and relevant client-specific fields.
- Contact role: `job_title`, `title`, `contact_function`.
- Contact authority: `contact_seniority`, `member_management_level`, and documented legacy evidence such as `buyer_tier`, `seniority_rank`, or `dm_tier`.
- Timing: `contact_new_in_seat` and verified `co_*` change or intent signals.

An ambiguous column named `score` is never accepted as the governed total or as component evidence unless the rubric documents exactly what produced it. `fit_confidence`, `source_confidence`, DiscoLike `disco_score`, and similarity are confidence or source priors, never quality points.

Leave a tier blank when the evidence is missing. Never infer a missing field merely to complete the score.

## Deterministic scoring

Run:

```text
python scripts/lead_score.py \
  --rubric profiles/<business-slug>/lead-scoring-rubric.yaml \
  --companies profiles/<business-slug>/tam/tam.scoring-input.csv \
  --contacts profiles/<business-slug>/tam/contacts.scoring-input.csv \
  --company-output profiles/<business-slug>/tam/tam.scored.csv \
  --contact-output profiles/<business-slug>/tam/contacts.scored.csv \
  --report profiles/<business-slug>/tam/lead-scoring-report.md \
  --suppression profiles/<business-slug>/suppression-list.csv
```

The `*.scoring-input.csv` files are rebuildable working files that carry the original row plus normalized tier and reason columns. Keep them under `tam/` or a `_work/` subfolder. They are never campaign send files.

For an external campaign list, build a temporary one-row-per-domain company scoring input from the list's company evidence and keep the person rows as the contact scoring input. Point `--company-output` to the campaign `_work/` folder and `--contact-output` to `campaigns/<campaign-slug>/leads.scored.csv`. Do not reveal email while preparing either input.

The script owns:

- Point lookup and 10-point validation.
- Explicit exclusion handling.
- Company-to-contact join by normalized `company_domain`.
- Score-confidence calculation from weighted evidence coverage.
- One-decimal rounding.
- Priority tiers.
- Stable contact ranking inside each company.
- The same-wave cap marker. Contacts ranked 3+ are staggered, never deleted.
- Distribution and QA reporting.

## Output contract

Keep every original column and append the relevant scoring fields.

Company output:

```text
company_market_points, company_offer_points, company_size_points,
company_geo_points, company_score, company_score_confidence,
company_send_eligible, company_exclusion_reason, score_version, scored_at
```

Contact output:

```text
company_market_points, company_offer_points, company_size_points,
company_geo_points, company_score, contact_role_points,
contact_authority_points, contact_score, timing_points, lead_score,
priority_tier, score_confidence, score_reason, send_eligible,
exclusion_reason, contact_rank_in_company, same_wave_eligible,
score_version, scored_at
```

Priority tiers:

- `P1`: 9.0 to 10.0
- `P2`: 7.0 to 8.9
- `P3`: 5.0 to 6.9
- `P4`: 3.0 to 4.9
- `P5`: 2.0 to 2.9

**Every eligible contact goes out in the first wave, in score order. P1 to P5 is the send order inside the wave, never a hold (Aaron process alignment, operator directive 2026-09-22; supersedes "reveal and verify P1 first, then P2 through P5 as capacity becomes available").** `/email-waterfall` reveals and verifies the whole eligible TAM in one pass in score order, and the sequence receives it in the same order. Within a company, the highest-scoring two contacts may enter the same active wave by default. Rank 3+ stays marked for a later staggered wave. That per-company cap is a send-simultaneity guard, not a tier hold, so it survives this rule unchanged.

**"Capacity" means two named limits, and neither one holds a tier back.**

- **Send capacity:** the daily sends the client's warmed, active sending fleet delivers, recorded as `run_state.capacity_request.allocated_daily_sends`. `/campaign-strategy` writes the capacity request with the wave (`daily_sends_needed` = qualified contacts x sequence steps / ~5 Monday-to-Friday sending days, Aaron's one-week pace), and `/mailbox-mix-strategy` sizes the fleet to the request (or `/mailbox-pool-staging` assigns a pre-warmed pool group). A fleet that delivers less stretches the runway: the wave still covers the whole TAM, only over more days.
- **Run budget:** `run_state.spend_ceiling_usd`, the standing $100 per client run, which caps reveal and verification spend. A whole-TAM reveal that would cross it stops and asks in `/email-waterfall`.

**Coverage line (required at the end of `lead-scoring-report.md`, appended by the session after the script runs, because `scripts/lead_score.py` has no capacity input).** State: eligible contacts; days to cover at the allocated rate (eligible contacts x sequence steps / `allocated_daily_sends`, two steps by default, counted in Monday-to-Friday sending days); the estimated reveal and verification cost for the whole eligible TAM (rates from `/api-cost-governance`) against `spend_ceiling_usd`; and which limit binds. The run budget binds when the reveal estimate exceeds it. Send capacity binds when days to cover runs past about 5 sending days. Name both when both apply. `/lead-scoring` usually runs before `/campaign-strategy` writes the request, so when `capacity_request` or its `allocated_daily_sends` is absent, write "send allocation not yet filed (`/campaign-strategy` writes the capacity request)" in place of days to cover, still report the eligible count and the reveal cost against the budget, and name the budget as the binding limit whenever the estimate exceeds it. This skill never writes or edits `capacity_request` itself.

Once the contact output (`contacts.scored.csv`, or `leads.scored.csv` on the external-campaign path) is written, push it to the list workbench's `scored` table as described above, and put the "pushed N/N rows to scored (list_stage=scored)" count, or the CSV-only fallback note, in the scoring report.

## Score confidence

Score confidence measures evidence coverage, not lead quality.

Calculate `weighted_coverage = component_max_points_with_a_valid_nonblank_tier / 10`.

- `high`: coverage at least 0.85
- `medium`: coverage at least 0.65 and below 0.85
- `low`: coverage below 0.65

A tier of `none`, `unsupported`, or `unrelated` counts as present evidence when the source supports that negative. A blank tier means missing evidence and contributes no coverage.

## Calibration and approval

Use a stratified sample that includes exact fits, adjacent fits, weak fits, missing-data rows, hard exclusions, wrong companies, and wrong titles.

- Under `review_gates`, show the component points and reasons for two 10-row rounds. Lock only after two consecutive rounds need no correction or the operator explicitly locks it.
- Under `auto_execute`, run the same sample checks and rubric validation. Auto-lock only when all schema and invariant checks pass. Stop on an invalid rubric, unsupported tier, missing company join, or unexplained exclusion.

## Refresh

- Rebuild stable company and contact components only when the offer, ICP, segment mapping, or underlying firmographics change.
- When the ICP changes or the locked offer set is replaced by a new lock, immediately set `run_state.status.scoring_stage: none`, increment `score_version`, and block downstream work until the stable components are rebuilt. Promoting a winning arm inside a segment's already-scored offer set, or locking a new segment's set, is a `score_version` bump for that offer component only, never a downstream block (operator decision 2026-09-22). **The same carve-out covers a new offer arm or variant added to a live wave: it triggers a background rescore of the `offer` component only, never a downstream block (Aaron process alignment, operator directive 2026-09-22).** Live cells keep sending in their current order while the rescore runs, and the new `score_version` orders only rows not yet first-touched. Aaron swaps angles inside the live campaign rather than pausing it (Mar 9).
- Recalculate timing tiers and total scores during the monthly TAM refresh, and the same way when `/tam-build` fills a conditional signal column after `full_enriched` was set (signal columns are optional for that flag, so they can join later; Aaron process alignment, operator directive 2026-09-22). That rescore is a background `score_version` bump: rows already first-touched keep their order and nothing downstream blocks.
- Preserve `score_version` so downstream files can prove which rubric produced them.
- A re-score pushes the new scored file to the `scored` table as a new push (the push script refuses a duplicate of the same file). Pushes append rows rather than update them, so tell the operator to filter or clear the old rows in the table, using `score_version` or `scored_at` to tell them apart.

## Downstream rules

- `/campaign-strategy` reads `tam.scored.csv` and `contacts.scored.csv`, reports score distribution per proposed slice, and uses the score for ordering only.
- `/email-waterfall` consumes `leads.scored.csv` or `contacts.scored.csv` in descending priority order. It never calls a paid finder or verifier before `scoring_stage = complete` on a TAM-backed path.
- `/list-quality-scorecard` requires complete score coverage and zero explicit-exclusion leakage. It reports the P1-to-P5 mix but does not punish a healthy adjacent lower tier.
- `/cold-email-flow-audit` treats lead scoring as its own artifact stage between TAM and campaign strategy.

## Stop gates

Stop and fail loud when:

- The rubric maxima do not total exactly 10.0.
- A nonblank tier is outside the controlled vocabulary.
- A required company cannot be joined by `company_domain`.
- An eligible row has no score, priority tier, confidence, or reason.
- An ineligible row has no exclusion reason.
- Any hard-no or suppression row is marked eligible.
- A downstream step tries to filter out P4 or P5 merely because the score is low, or holds any eligible tier out of the first wave.
- A paid email step is attempted before scoring completes.
- The list workbench push reported fewer rows than the scored CSV holds, and one retry also fell short.

A push shortfall is reported at the top of the scoring report and retried once, never silently accepted. That stop applies to the publish step only. It does not reset `scoring_stage` or hold `/campaign-strategy` and `/email-waterfall`, because the local scored CSV they read is intact. A list workbench that is not ready is not a stop gate: it takes the CSV-only fallback above.

## Related skills

- `/data-point-discovery`: supplies the scoreable fields and controlled vocabularies.
- `/tam-build`: builds the company and contact inputs.
- `/icp-prompt-builder`: tunes broad company-fit and normalization judgment.
- `/campaign-strategy`: slices and orders the scored universe.
- `/email-waterfall`: reveals and verifies email in score order.
- `/list-quality-scorecard`: verifies score coverage and send safety.
- `/api-cost-governance`: gates any paid data call a scoring step triggers (normalization itself runs on Claude Code and is not metered).
