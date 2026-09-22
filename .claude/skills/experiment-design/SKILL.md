---
name: experiment-design
description: Framework for running single-variable cold email experiments. Defines experiment types (offer-only, list-only, copy-only, combined), the test order (offer, then positioning of the offer, then CTA and delivery, with list cuts in parallel and subject lines last), confidence weighting, minimum sample sizes, and success criteria judged on time-agreed replies beside positive replies. Use when the user wants to improve a campaign, test a new list vs old one, compare copy variants, or run offer-validation arms. Prevents the #1 learning-loop mistake - changing list + copy + offer at once and losing all signal. Includes a Generative Proposal Mode that mines tam/tam.csv (from /tam-build) and prior results to propose ranked, data-grounded experiment candidates for the next round.
---

# Experiment Design
## Canonical Profile Root

All profiles/<business-slug> paths in this skill resolve under:

```text
<outbound>/profiles
```

Here `<outbound>` is the root of this skill library - resolve it to wherever the library is currently checked out (local Documents, OneDrive, or a git worktree); never hardcode an absolute path. Do not create client profiles under a `profiles/` folder at your current working directory.

If you change your list, your copy, and your offer at the same time, you learn nothing. This skill forces you to isolate one variable per experiment so you actually learn what's working.

## Why this exists

Most cold email operators run "throw-everything" experiments. Campaign 1 gets a new list, new copy, and a new offer. It works better. They declare victory. But they can't tell you WHY - was it the list? The copy? The offer?

Then campaign 2 changes all three again. Regression. Nobody knows why.

This skill is the antidote: plan each experiment around ONE variable, keep everything else constant, and confidence-weight the results.

## Material Decision Rule

When this skill reaches a material fork, name the realistic options, recommend the strongest path, and explain why the main alternatives are weaker before committing.

Ask before choices that affect spend beyond an approved budget, provider routing, source of truth, list quality, campaign direction, client-facing output, live systems, scraping or account risk, or legal/compliance risk. For low-risk reversible choices, state the recommendation and proceed.

Do not turn failed or unsafe paths into user-facing options. If this skill's QA rules or stop gates reject a path, filter it out and explain the blocker only when useful.

When asking the user, use the Claude Desktop native Interactive Inputs / Choice Prompts pattern from /clarification-first: recommended option first, short choices, and Custom answer last when a custom answer is plausible.

## The four experiment types

### A. List-only experiment
- **What varies:** the list (targeting criteria)
- **What stays fixed:** copy, offer, sending infrastructure, sequence timing
- **What you learn:** whether this segment is a better fit than the baseline
- **Confidence on learnings:** HIGH on targeting, LOW on copy (because copy wasn't tested)

### B. Copy-only experiment
- **What varies:** the copy (subject, body, sequence, or A/B variant)
- **What stays fixed:** list, offer, infrastructure
- **What you learn:** whether this copy resonates with this audience
- **Confidence on learnings:** HIGH on copy, LOW on targeting

### C. Combined experiment (use sparingly)
- **What varies:** list AND copy (and sometimes offer)
- **What stays fixed:** only infrastructure
- **When to use:** launching a whole new campaign for a new ICP. You can't isolate because everything is new.
- **Confidence on learnings:** MEDIUM on everything. Use as hypothesis-generation, not conclusion.

### D. Offer-only experiment (the offer-validation arms; operator-approved Aaron alignment, 2026-09-21)
- **What varies:** the front-end offer (the free deliverable and what depends on it), nothing else
- **What stays fixed:** the list (the same broad list, split evenly and at random), the copy skeleton, the sequence and timing, and the infrastructure split
- **What you learn:** which offer the market actually wants, the highest-leverage question in cold email (doctrine §3: "It is truly the 80/20")
- **When to use:** first, before any copy test. `/campaign-strategy`'s Offer-Validation Wave runs the primary offer plus at least one arm from `offer.validation_arms` this way from the first wave, and `/offer-intelligence` hands its Swap hypotheses here. Aaron tests three or four offers (doctrine §5), one variable at a time (doctrine §5 step 9).
- **How it is judged:** per arm, on `/campaign-strategy`'s pooled flip (PROVEN / DEAD / HOLD on raw positive replies, never pooled across arms), not on the sample table in Step 3. Among PROVEN arms the winner is the one that does not lose on time-agreed replies per 1,000 first touches; a PROVEN arm that farms interest is reshaped, not scaled.
- **Confidence on learnings:** HIGH on the offer, once each arm's pooled read decides; LOW on copy and list.

## Generative Proposal Mode (propose experiments from the TAM)

Use this mode when you do not have a hypothesis yet and want the system to **propose** the next round of experiments from data you already hold — the self-improving loop. It reads:

- `profiles/<business-slug>/tam/tam.csv` (the company-level TAM from `/tam-build`)
- `profiles/<business-slug>/data-point-catalog.md` (the `/data-point-discovery` catalog — since the full obtainable signal set is collected up front, next-wave tests come from untested **combinations** of the already-collected columns, plus any genuinely-new `in_reserve` point added at refresh)
- `profiles/<business-slug>/experiments/*.yaml` and `*.json` (prior experiment plans, results, decisions)
- `profiles/<business-slug>/retrospectives/*.md` (quarterly patterns, if any)

Then it outputs **ranked single-variable experiment candidates grounded in columns that already exist**:

1. **Mine the TAM for untested slices — `enrichment_tier = enriched` rows only.** Each candidate is a list-only experiment defined by populated TAM columns with enough rows that have not been tested yet (e.g. `has_demo_cta = true AND sales_ic_count = 0`, row count N). **Slice only `enriched` rows: a blank `gate_role = enrich` column on an enriched row is a real negative, but a blank on a `qualified_out` row is a gate-skip (never collected), not data — never build a slice on it.** (If a legacy `tam.csv` has no `enrichment_tier` column, treat all rows as eligible.) Never propose a slice with too few rows for the sample-size table below. Also mine `data-point-catalog.md` for `in_reserve` rows (catalogued but not yet collected): proposing one means **collecting that column first**, which routes through `/tam-build`'s tiering + `/api-cost-governance` as new Layer-1 spend (gated), not an automatic crawl.
2. **Mine results for copy/offer variables.** From `experiments/*.json` and reply-scoring history, surface copy or angle variables worth a copy-only test against the current baseline. **Propose the offer queue first:** every queued or still-reading arm in `offer.validation_arms` (and in each segment's set in `offer.segments`) (with `lead_magnet_client_ok` `not_needed` or `yes`) is an offer-only (type D) candidate against the current winner, ranked ahead of copy and list candidates (Aaron's test order: offer, then positioning, then CTA, doctrine §5 step 9).
3. **Rank by expected positive-reply lift × confidence × row availability.** Prefer candidates that isolate one variable and have the rows to reach significance.
4. **One variable per candidate:** list-only, copy-only or offer-only, never two at once. Combined tests are only for genuinely new ICPs.
5. **Human approval gate.** Present the ranked candidates (recommended first) and let the operator pick which to run. Do not auto-launch sends. Under `auto_execute`, you may auto-select the top candidate(s) for the next wave and write their plan files, but launching still goes through the upload skill's paused-draft + manual-start gate.

For each approved candidate, drop into **The Framework** below to write the full experiment plan (`experiments/YYYY-MM-DD-<name>.yaml`).

## The Framework

### Step 1: Name your hypothesis

Every experiment starts with a one-sentence hypothesis:

> "Targeting Heads of Marketing at 50-200 person B2B SaaS companies will get a higher positive reply rate than our current VP Sales baseline, because [reason]."

Or:

> "Offering a free look-alike list of 100 companies shaped like their best client will get more time-agreed replies per 1,000 first touches than our current free teardown offer, because [reason]."

(House example, conforms to Framework A: an offer-only test, the first rung of the test order below. The earlier question-opener example is archived at `outbound/_archive/aaron-alignment-2026-09-21/experiment-design--hypothesis-example-and-priority-order.md`; operator-approved Aaron alignment, 2026-09-21.)

If you can't write the hypothesis in one sentence, you don't understand the experiment yet. Go back.

### Step 2: Identify the single variable

Write down exactly what changes and what stays the same.

```
Variable: Target job title
Change: "VP Sales" -> "Head of Marketing"

Constants:
- Industry filter: unchanged
- Headcount: unchanged
- Geography: unchanged
- Copy: unchanged (same sequence)
- Offer: unchanged (same lead magnet)
- Sending infrastructure: unchanged (same 20 domains, 40 inboxes)
- Send schedule: unchanged
```

If ANY constant is actually changing, stop. Either lock it down, or reclassify as a combined experiment.

### Baseline sanity check - the 1% rule

Before running any experiment, confirm your baseline is healthy: **overall reply rate >=1% after 200+ sends.** If your baseline is below 1% after 200 sends, the problem isn't your experiment - your infrastructure, list, offer or copy is already broken. Run `/email-deliverability-audit` first when a deliverability trigger fires (bounce above the house threshold, a placement-test flag, reply rate near 0.1%, contacts-per-positive jumping; `/offer-intelligence` Vector 5). Otherwise the offer is the live candidate, per Aaron's diagnostic order (doctrine §2). Open rate never decides this: opens are not tracked in this system (operator-approved Aaron alignment, 2026-09-21).

Running an experiment on a broken baseline is wasted effort: you'll learn that "both arms are bad," not "which arm wins." **Offer-only (type D) tests are exempt (operator directive 2026-09-22):** when deliverability is ruled out and the offer is the broken thing, the fix IS a new offer test, so a sub-1% baseline routes to the next offer flight (`/campaign-strategy`), and only copy and list tests wait for a healthy baseline.

### Step 3: Calculate minimum sample size

The smaller your effect, the more leads you need. Use these rough rules for cold email:

> **This is read-out, not launch eligibility.** These sends-per-arm minimums tell you how long to run a controlled A/B test before the result is trustworthy. Whether a signal slice is worth *launching* at all is a separate, upstream gate owned by `/campaign-strategy`: the **≥500-company signal floor** (≥500 enriched companies must carry the signal; HARD RULE, operator directive 2026-07-12, which retired the old ≥100-company and ≥100-contact floors). The floor is a company-level count; these minimums are contact-level sends. A near-floor slice is launch-eligible but thin to read, so give it full daily volume and the 21-day run to accumulate enough sends.

| Current baseline | Expected lift | Minimum sends per arm |
|---|---|---|
| 1% positive reply rate | 2x (1% -> 2%) | ~500 |
| 1% positive reply rate | 1.5x (1% -> 1.5%) | ~2,000 |
| 1% positive reply rate | 1.2x (1% -> 1.2%) | ~10,000 |
| 2% positive reply rate | 2x (2% -> 4%) | ~250 |
| 2% positive reply rate | 1.5x (2% -> 3%) | ~1,000 |

Rule of thumb: **if your test has fewer than 500 sends per arm, you can't tell signal from noise.**

For most beginners, 2,000 sends per arm is the right default.

> **Read this table with its assumption in view (operator-approved Aaron alignment, 2026-09-21).** Every row assumes a 1-2% positive-reply baseline. Real bands can run far lower: Eric's above-average contacts-per-positive band (1 per 150 to 1 per 400) is roughly 0.25% to 0.67% positive, and at that rate even 2,000 sends per arm cannot see a 2x lift (his arithmetic). So read **copy tests on raw reply rate**, the more frequent event, and make **offer calls on `/campaign-strategy`'s pooled flip**, judged per arm, never on this table. No number in the table changes.

### Step 4: Build the success criteria up front

Before launching, write:

```
Success = positive reply rate > X% (our current baseline is Y%)
Failure = positive reply rate < Z%
Inconclusive = between X and Z
Guard = time-agreed replies per 1,000 first touches not below the control's
Required sample: at least N sends per arm, reported after day 21 of sequence
```

For an offer-only test (type D), the success line is `/campaign-strategy`'s per-arm flip on positive replies, followed by its time-agreed winner pick, not a positive-reply target from this table.

Decide now - not after seeing the data. This prevents "oh we learned something else instead" rationalization.

### Step 5: Launch both arms simultaneously

Same day, same sending infrastructure split, same sequence. If your control arm sends Monday and your variant arm sends Thursday, day-of-week effects will confound the test.

Best practice on most sending platforms: create two campaigns, assign each half of your inboxes, launch at the exact same time, same schedule.

### Step 6: Measure at day 21

Wait until the full sequence (one thread of 2 to 3 steps, Hard Rule 18, plus the reply grace period) has finished for ALL leads. Measuring earlier biases toward the first email's reply rate.

Pull metrics via the positive-reply scoring path for the locked `run_state.sending_platform`: the scoring skill from whichever pack `/stack-setup` activated, otherwise that platform's own reply export, otherwise a hand-classified reply read with the gap stated.

- Total sent (per arm)
- Total replies (per arm)
- Positive replies (per arm, classified by Claude)
- Positive reply rate = positive replies / total sent
- **Time-agreed replies per 1,000 first touches** (per arm): positive replies whose thread moves toward a time, counted with `/campaign-strategy`'s magnet-inflation-guard sending-platform proxy, divided by first-touch contacts, times 1,000. Report it beside the positive-reply rate: a positive reply is not a booked call (doctrine §0, §2 step 5; operator-approved Aaron alignment, 2026-09-21).

Secondary metrics (report but don't optimize for):
- Overall reply rate (positive replies / total sent is primary, but this shows raw engagement)
- Bounce rate (sanity check - if one arm bounces more, your list is bad, not your copy)

Open rate is not reported: opens are not tracked in this system (open tracking stays off on the sending platform), so it reads 0% and means nothing (doctrine §9, "Don't track opens").

### Step 7: Weight the learnings

Use this framework when reporting:

```
Experiment: <name>
Type: List-only | Copy-only | Combined
Variable: <what changed>

Result: <winner name> at <positive reply rate>% vs <baseline>%
Confidence: HIGH | MEDIUM | LOW (based on experiment type + sample size)

Learnings (by confidence):
  HIGH confidence:
    - <thing you can trust>
  MEDIUM confidence:
    - <thing that looks good but needs replication>
  LOW confidence:
    - <thing you're speculating about>
```

HIGH only if: experiment type isolates the variable AND sample size meets the minimum.

### Step 8: Decide what to do with the result

- **Winner by >=20% lift, HIGH confidence:** adopt as new baseline. Document. Move to next experiment.
- **Winner by 10-20% lift, HIGH confidence:** run a replication experiment with fresh leads. If it wins again, adopt.
- **Winner by <10% lift:** inconclusive. Run bigger next time or drop.
- **Loser:** document WHY you think it lost. Don't just move on - the loss is a learning.
- **Combined experiment winner:** do NOT adopt as a new baseline. Instead, split into single-variable follow-ups to figure out which part actually drove the lift.
- **A winner must not lose on time-agreed replies per 1,000 first touches** (operator-approved Aaron alignment, 2026-09-21). An arm that wins on positive-reply rate but whose time-agreed replies are zero or clearly lag the control's is labeled farming interest (doctrine §4): do not adopt or scale it, and reshape it so it filters better (more specific) rather than killing it. "Clearly lag" has no numeric cut-off: it is judged against the other arm, and the operator confirms. The lift thresholds above are unchanged.

## What NOT to experiment on (at first)

If you're just starting out, **don't run controlled copy experiments** until you have a baseline. You need a control before you can test a single variable. **The offer is the exception** (operator-approved Aaron alignment, 2026-09-21): the Offer-Validation Wave tests it from the first wave, as offer-only arms on the same broad list (type D above), because the offer is the highest-leverage lever and every later test sits on top of it (doctrine §3, §5).

**Coverage waves are not controlled experiments, and they are how you build that baseline.** A TAM-driven Wave 1 (see `/campaign-strategy` → Launch waves) launches several **list-only** slices at once while holding the offer and copy approach **constant**, so positive-reply differences are attributable to the list/signal. That is a coverage portfolio, not a confounded multi-variable test: it is the right move once the offer is validated, and it produces the baseline. Reserve single-variable copy experiments, and positioning tests of the winning offer, for Wave 2+, once a slice's baseline exists.

**The test order (Aaron's; doctrine §5 step 9, §9; operator-approved Aaron alignment, 2026-09-21):**
1. **The offer** (the offer-validation arms: which free deliverable the market wants)
2. **The positioning of the offer** (how the same offer is framed; under Framework A the opener is the offer, so opener tests live here)
3. **The CTA and delivery** (the ask, and what happens after the yes)

**In parallel from launch, not in sequence:** data source and segment (list cuts). The coverage wave's list-only slices and the sold-to splits are this lever; they run alongside the rungs above instead of waiting behind them.

**After those:**
4. **Sequence timing** (Day 3 vs Day 2 follow-up; live delays stay a house decision)
5. **Sequence length** (2 steps vs 3, within the single-thread 2-to-3-step rule; the 4-step / two-thread structure was retired 2026-07-05)
6. **Subject line, last.** Aaron calls it the lowest-leverage lever, *"never going to be the highest leverage thing to update"* (doctrine §9). Test it only once the offer, its positioning and the CTA are settled.

Don't test a lower rung while a higher one is broken (doctrine §2): no CTA or subject-line test on an offer that has not won its arm. The earlier list-first order (which ranked subject lines third) is archived at `outbound/_archive/aaron-alignment-2026-09-21/experiment-design--hypothesis-example-and-priority-order.md`.

## Common mistakes

- **A/B testing inside one campaign.** A sending platform's built-in A/B variant feature mixes the data - fine for small copy tweaks, terrible for hypothesis testing. Use TWO campaigns for real isolation.
- **"I'll test 3 things at once."** You'll learn nothing.
- **Calling it early.** Wait 21 days minimum. Cold email replies trickle in over weeks.
- **Changing infrastructure mid-test.** If one arm uses new domains and one uses old, deliverability skews everything.
- **Ignoring bounce rate.** If variant's bounce rate is 2x control, the list is bad - not the copy. Disqualify the test.
- **Declaring a winner on replies alone.** A positive-reply lift with no rise in time-agreed replies per 1,000 first touches is farming interest (doctrine §4). Report both, every time.
- **Testing subject lines or CTAs before the offer has won.** The offer is the 80/20 (doctrine §3); walk the test order top-down.

## Output: experiment plan file

At the end of planning, write to:

```
profiles/<business-slug>/experiments/YYYY-MM-DD-<name>.yaml
```

Schema:

```yaml
experiment:
  name: <short name>
  hypothesis: <one sentence>
  type: offer-only | list-only | copy-only | combined
  variable: <what changes>
  constants: <list of what stays fixed>

success_criteria:
  positive_reply_rate_target: <float>
  baseline: <float>
  minimum_sends_per_arm: <int>
  measurement_date: <YYYY-MM-DD>

arms:
  control:
    campaign_id: <tbd until launch>
    description: <what's in the control>
  variant:
    campaign_id: <tbd until launch>
    description: <what's in the variant>

results: <empty until day 21>
  control_positive_reply_rate: null
  variant_positive_reply_rate: null
  control_time_agreed_per_1000: null    # time-agreed replies per 1,000 first touches (added 2026-09-21)
  variant_time_agreed_per_1000: null
  winner: null
  confidence: null
  decision: null
```

## References

- Positive-reply scoring for the locked `run_state.sending_platform` - the measurement workflow, from whichever pack `/stack-setup` activated or that platform's native reply export
- Use the sample-size rules in this file unless a separate calculator is actually present in the repo

---

## What to do next

Launch the planned experiment through the campaign upload path for the locked `run_state.sending_platform`: the upload skill from whichever pack `/stack-setup` activated, otherwise that platform's native campaign create plus lead upload. If the slot is empty, stop and route the operator to `/stack-setup`. Use the `variants.yaml` from `/campaign-copywriting`.

Then wait 21 days before evaluating. Reply rate needs that long to stabilize. After 21 days, run the positive-reply scoring path for the locked `run_state.sending_platform` on each arm.

If you do not have 2,000+ leads per experiment arm, you cannot detect normal-sized effects. (Offer arms may still launch below this and ride HOLD under `/campaign-strategy`'s pooled flip, which never kills an arm on a small sample.) Build a bigger list first through the source path `/lead-source-strategy` selects.

## Related skills

- `/tam-build` - the company-level TAM that Generative Proposal Mode mines for untested slices
- `/campaign-copywriting` - produces the copy variants this experiment tests
- Campaign upload for the locked `run_state.sending_platform` - whichever pack `/stack-setup` activated, otherwise that platform's native campaign create plus lead upload
- Positive-reply scoring for the locked `run_state.sending_platform` - whichever pack `/stack-setup` activated, otherwise that platform's native reply export

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short — record status, not raw output. Full protocol: `client-activity-log.md`.
