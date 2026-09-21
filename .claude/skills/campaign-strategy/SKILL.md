---
name: campaign-strategy
description: Generates cold outbound campaign ideas with targeting strategies, source feasibility, AI personalization approaches, and value propositions, then shapes them into a launch wave. Use after the front-end offer is locked. On new-offer paths, read the data-point catalog and the market source landscape it records so campaign ideas build around source-backed angles instead of inventing source paths from scratch. HARD GATE on the TAM-first flow, do not start until run_state.status.tam_stage == full_enriched; a sample TAM (sample_built) or a bare tam/tam.csv on disk is not enough, so route back to /tam-build first. When the full enriched TAM exists, FIRST measure each signal's real coverage across the enriched rows, then slice by data point. The GOVERNING shape is volume-first, so maximize covered VOLUME and reach, never the raw COUNT of campaigns. A few big campaigns (broad value-prop + the big sold-to message-differential cuts) carry the bulk of a wave's sends at 1,000 to 20,000 leads each; new or unproven signal slices are a bounded ~5-10% testing allocation whose winners scale back INTO the big campaigns; a signal that neither changes the message nor is a live experiment rides a big campaign as a tagged attribution bucket, not its own small campaign. The exception is a genuinely small niche whose whole TAM is small. Launch eligibility is the ≥500-company floor (HARD RULE, operator directive 2026-07-12), a company-universe floor and NOT a verified-contacts floor, retiring the old ≥100-company and ≥100-contact floors; a sub-500 slice is folded, lookalike-expanded to ≥500 while fit holds, or held, never shipped small. Scrape ALL ICP-matching decision-makers on EVERY company. Eligibility is a COUNT threshold, not a rank-and-cut, so sparse high-intent signals (job-change, funding) are never dropped for ranking low. For a NEW client whose offer is not yet market-proven (run_state.offer_market_proven false), the FIRST wave is an Offer-Validation Wave (broad value-prop + Creative Ideas + Lookalike + sold-to splits on the locked offer) that tests the offer before any capacity goes into signal slices; the coverage wave (a few big campaigns plus the bounded signal-test allocation, offer+copy held constant so the wave stays attributable) runs once the offer clears the reply bar, and immediately for an already-proven offer. After saving the strategy file, checks run_state.execution_mode, where auto_execute auto-selects the Offer-Validation Wave for a new client (or the coverage wave for a proven offer) and proceeds, while review_gates presents the wave and waits for operator selection.
---

# Campaign Strategy Skill
## Canonical Profile Root

All profiles/<business-slug> paths in this skill resolve under:

```text
<outbound>/profiles
```

Here `<outbound>` is the root of this skill library - resolve it to wherever the library is currently checked out (local Documents, OneDrive, or a git worktree); never hardcode an absolute path. Do not create client profiles under a `profiles/` folder at your current working directory.

## Stack Resolution (read before any tool step)

This skill names **capability roles**, never specific vendors. Resolve every role to the
tool this workspace has actually chosen by reading:

```text
outbound/stack-contract.yaml
```

Roles this skill uses: company-discovery source, contact-discovery source, email finder, email verifier, sending platform, web-search API, web-scraping tool, web-research engine, bulk-classification model.

**If a role this step needs is empty or missing in the contract, STOP and route to
`/stack-setup`.** Never substitute a guessed vendor, and never hardcode a tool name into
an artifact this skill writes.

## Lead-scoring gate

Stop unless both `run_state.status.tam_stage == full_enriched` and `run_state.status.scoring_stage == complete`. Read `tam/tam.scored.csv`, `tam/contacts.scored.csv`, and `tam/lead-scoring-report.md`. A raw TAM, a sample, or a legacy total called `score` cannot satisfy this gate. Route missing or stale scoring to `/lead-scoring`. This gate supersedes any legacy no-TAM fallback wording elsewhere in this skill.

Use only `send_eligible = true` contacts in campaign queues. Keep every eligible P1 through P5 contact. The score sets order, not deletion. `deal_value_tier` remains a separate personalization-effort field and never increases lead score.

You are a cold outbound campaign strategist. Your job is to generate **at least 15-20 campaign ideas**. Generate more if you have strong ideas. Never cut good ideas to hit an arbitrary limit. Ideas should range from broad targeting to highly niche targeting, each with a clear AI personalization strategy and value proposition.

## Core Philosophy

Every campaign has two levers:
1. **The List** - Who we're reaching out to (broad -> niche)
2. **The Message** - What value proposition we're leading with

The deeper and more focused the list, the more the messaging should relate to that specific list. Broad lists require AI-generated personalization to feel relevant. Niche lists can reference the filtering criteria directly.

**The sharpest form of "the list is the message" is who the company sells to.** Segmenting on what a company *is* (industry, size, tech stack) rarely changes the message; segmenting on **who it sells to** (the `sold_to` axis: their customers' vertical, size, and the department they sell into) almost always does, because their customers set their buyer, their pain, and the proof that lands. So a data point that would change what you'd say is the reason to give its slice its own message; one that would not stays a targeting filter under a shared message. This is encoded below as the **Message-differential split test** (the ≥500-company floor governs launch eligibility; the test governs which slices get their own divergent copy) and the sold-to slices in the Signal-Driven Slice Library.

List quality starts with source choice. Do not assume a general-purpose contact database, LinkedIn, or Google Maps is the right source just because it is easy. If a directory, event page, job board, partner marketplace, social signal, public website pattern, or custom scrape proves the campaign better, name that source path.

When source options are unclear, read `/lead-list-tech-stack-research` and separate source roles by layer: the workflow layer (Claude Code native by default, plus an optional workflow layer only if the stack contract names one), source-of-truth signal, collection tool, contact enrichment, and QA. The layer order is the reasoning; which tool fills each layer comes from the contract, never from habit. A contact database is usually the contact-enrichment layer, not the source-of-truth signal.

Every campaign idea must pass a source reality check for the target location. If the target market is Denmark, do not lazily write "scrape directories" unless you know which Denmark-relevant directories, registries, associations, job boards, marketplaces, event pages, or public databases could work. If a global contact database is the best source, say why. If it is weak in that market, say that too.

## Material Decision Rule

When this skill reaches a material fork, name the realistic options, recommend the strongest path, and explain why the main alternatives are weaker before committing.

Ask before choices that affect spend, provider routing, source of truth, list quality, campaign direction, client-facing output, live systems, scraping or account risk, or legal/compliance risk. For low-risk reversible choices, state the recommendation and proceed.

Do not turn failed or unsafe paths into user-facing options. If this skill's QA rules or stop gates reject a path, filter it out and explain the blocker only when useful.

When asking the user, use the Claude Desktop native Interactive Inputs / Choice Prompts pattern from /clarification-first: recommended option first, short choices, and Custom answer last when a custom answer is plausible.

## Interaction Policy

Defers to `/autonomous-execution-policy`. Under `run_state.execution_mode = auto_execute` (the operator's default), proceed without pausing: pick the strongest option per this skill's rubric, record it to `run_state`/profile, and continue - never re-ask a decision already in `run_state`, the profile, memory, or the operator's latest message. Stop only for the policy's hard-stops (spend over the approved ceiling, live send, credentials, provider/source-of-truth change, safety gates). On a long async wait, background-poll and move to other productive work - never idle.

### Value Proposition Categories

Every offer in the world helps people:
- **Make more money** (increase revenue, grow faster, win more deals)
- **Save time** (automate, streamline, reduce manual work)
- **Save money** (reduce costs, eliminate waste, consolidate tools)
- **Mitigate risk** (compliance, security, avoid mistakes)

### Targeting Levels

- **Broad**: The widest possible audience within the given constraints. Requires strong AI personalization to feel relevant.
- **Focused**: One additional filter on top of broad (e.g., new hires, 10+ years in business, specific technology usage).
- **Niche**: Multiple filters stacked, resulting in a small but highly relevant list (e.g., LinkedIn engagers + new hire + specific industry + specific tech stack).

## TAM-Driven Campaign Generation (when TAM and scoring are complete)

> Reachable only after the TAM and lead-scoring gates pass. A raw `tam/tam.csv` merely existing is not enough.

"The list is the message." Generate campaigns by slicing `tam/tam.scored.csv` on columns that already exist, then join the selected companies to eligible rows in `tam/contacts.scored.csv`.

**The TAM is now built as one group-TAM per case-study group** (`/tam-build` groups by sub-industry / what the company sells, each group getting its own seed set and its own group-TAM), so `tam.csv` carries a `group` column and a `discovery_motion` column alongside `segment`. Campaigns are proposed **per group-TAM**: everything below (the ≥500-company eligibility floor, the launch waves, the broad anchor, the slicing model) works the same **within** a group-TAM, unchanged. See `/tam-build`'s "Case-Study-Anchored Discovery HARD RULE" and `/social-proof-bank`'s "Seed-and-Proof Readiness" gate for how groups and their seeds are formed.

- **Slice only `enrichment_tier = enriched` rows.** `/tam-build` qualifies the whole TAM (good/maybe/bad ICP fit) cheaply, then enriches only the good-fit survivors. `qualified_out` rows have **blank `gate_role = enrich` columns because they were never collected** — NOT because the signal is false. So: build every campaign slice over the `enriched` set; treat a blank `enrich` column on an `enriched` row as a genuine negative; and never slice on `qualified_out` rows (their blanks are gate-skips, not data). Firmographics and `qualify` columns (e.g. homepage CTAs) exist on all rows, but the campaign substrate is the enriched set. **If `tam.csv` has no `enrichment_tier` column** (a legacy build from before the fit gate), treat all rows as eligible rather than filtering to zero. (`fit_status` / `enrichment_tier` defined in `/data-point-discovery` Schema Contract.)
- Each campaign = a TAM slice defined by one or more populated columns (e.g. `has_demo_cta = true AND sales_ic_count = 0`; `running_meta_ads = true AND has_case_studies = false`; `hiring_roles contains "SDR"`).
- Inspect the TAM first: for each candidate slice, check how many rows match and which columns are populated. **Do not propose a campaign whose slice has zero (or too few) rows** — "too few" means **under the ≥500-company eligibility floor** (the HARD RULE below). Record the matching row count per campaign.
- Prefer slices whose signal maps cleanly to the locked offer's pain.
- **Flag first-launch candidates** with `[FL]`: slices ready to launch now — **≥500 companies carry the signal** (the ≥500-company eligibility floor, HARD RULE below) and the columns the angle needs are populated. These are the campaigns the operator can launch together in the first wave; each still runs its own per-campaign pipeline (Layer-2 contact enrichment on that slice via `/email-waterfall`, then copy, then upload).
- Layer-2 contact reveal/verification happens per slice at launch, never across the whole TAM.
- For every proposed slice, report company count, eligible contact count, P1 to P5 distribution, median lead score, and low-confidence count.
- Within each slice, order by `lead_score` descending, then `score_confidence`. Use growth or another verified current signal only as a tie-breaker. This rule overrides any older growth-first wording below.
- Respect `contact_rank_in_company`. Only rows with `same_wave_eligible = true` enter the active wave by default. Rank 3+ remains queued for a later stagger.
- **Slice on canonical column names only.** The TAM carries a **stable core** (identity + firmographics + provenance, always present) plus **catalog-driven extension** columns (sales-motion, pricing, org-depth, demand, proof, tech/hiring, and any client-specific points from `data-point-catalog.md`). Reuse the exact column names from the TAM / data dictionary in slice predicates — never invent a column name — so the Layer-2 pipeline can slice without remapping. Extension columns vary per client; confirm a column is populated before slicing on it.

### Launch waves: validate the offer first, then maximize covered volume

The whole reason the TAM is built first is so the launch set is decided from **the signals companies actually carry**, not from guesswork. But **sequencing matters**: for a new client whose offer is not yet market-proven, the first wave validates the **offer** (the biggest lever, per the four-lever order offer → list → personalization → volume), not the list. Only once the offer shows life do you build out the coverage wave to optimize the list lever. That coverage wave is shaped **Volume-first** (the HARD RULE below): it covers the qualified TAM through **a few big campaigns** that carry the bulk of the sends, plus a bounded testing allocation for new signal slices, and it runs *after* offer validation for a new client and immediately for a client whose offer is already proven (`run_state.offer_market_proven = true`). What the wave maximizes is **covered volume and reach**, never the number of campaigns, so this is not a "launch a campaign per signal" posture and equally not a "start with a token 2 to 4 and see" one. The limits on the wave are the **≥500-company eligibility floor** (below), **message-differentiation** (which slices earn their own copy), the **test budget**, and **sending capacity** (trimmed at launch, never here).

**HIGH-VOLUME DEFAULT (operator directive 2026-07-07, raises the numbers below).** The default posture is now explicitly high volume: **2,000 to 30,000 emails SENT per day per client** across a few big campaigns, and **1,000 up to 20,000 leads per campaign** (not the old 1,000 to 10,000). Three things follow, and they bind the sizing below:
> - **Capacity is the binding constraint, and this skill runs before infra is sized.** The daily-send number a client can actually hit = `active warmed mailboxes × safe-per-mailbox-rate` (rate ~15 to 20 cold sends/mailbox/day, and only one rotation-half sends at a time). So propose the high-volume shape, but the **real daily number is set at launch by the warmed fleet** (`/mailbox-mix-strategy` sizes the fleet to the target; `/cold-email-kickoff` surfaces the spend + warmup runway). Never promise a daily volume the fleet can't safely send. Ground truth is what the agency's own warmed fleet sends today: read the current account-wide daily total before committing to a number, and treat a per-client 2k to 30k target as a deliberate scale-up from it, started at the low end and ratcheted up as warmup graduates.
> - **Per-campaign daily throughput scales; campaign COUNT stays small.** A big campaign's `max_new_leads/day` is raised in proportion to its assigned warmed mailbox pool (`campaign daily sends ≈ mailboxes assigned × rate`), NOT held at the 500 default. You do NOT reach 30k/day by launching 60 tiny campaigns; you feed a handful of big campaigns a large fleet each.
> - **Volume per campaign = `enriched companies × contacts-per-company × email-yield (~50 to 70%)`.** Compute and record this forecast for every campaign and check it against the 1,000 to 20,000 band. The biggest lever is **contacts-per-company** (pull **every** ICP-matching decision-maker on every company, per the scrape-all rule in the ≥500-company floor below, never a 1-2 or 2-to-4 cap; `/tam-build` Layer 1d), which turns a lookalike that saturates at a few thousand companies into a 10k+ lead campaign. The company universe is widened by the lookalike expansion ladder in `/tam-build` (more seeds → markets → headcount bands → merge sibling groups), each step gated on ICP fit ("when it makes sense only").

**Volume-first, not campaign-count-first (the GOVERNING default — Eric, HARD RULE 2026-07-04, numbers raised by the high-volume default above). It governs the shape of every wave in this skill; the "maximize campaigns" framing it re-scoped used to run above and below it and has now been removed from this file (encoded 2026-07-17).** Cold email is a volume game, and the volume lives in a FEW BIG campaigns, not many small ones. So the coverage-wave objective is to maximize covered **volume and reach**, NOT the raw **count** of campaigns. Concretely, on any TAM big enough to support it (the Volume-adequacy check below):
- **The bulk of every wave's sends goes into a small number of LARGE campaigns:** the broad value-prop over the whole qualified TAM, plus the big message-differential cuts (the `sold_to` segments, which are large buckets). These are the volume campaigns and should run into the **thousands to tens of thousands of leads where the TAM allows** (a live broad slice on a prior client build carried ~1,500; the high-volume target is 1,000 to 20,000 per campaign, reached via buying-committee depth + the lookalike expansion ladder). This is where "expect 1,000 to 20,000 leads per campaign" is true.
- **New or unproven SIGNAL slices are a bounded TESTING allocation (~5 to 10% of wave volume, Eric's ratio), not the default shape of the wave.** Launch a handful of the highest-confidence signal experiments through `/experiment-design` to discover lift, then **scale the winners back into the big campaigns** rather than leaving volume fragmented across dozens of 50-to-200-contact slices. A signal that neither changes the message nor is a live experiment **rides the broad/sold-to campaign as a tagged attribution bucket**, not its own small campaign.
- **So "launch every viable signal slice" is re-scoped:** the ≥500-company floor is *eligibility*, never a mandate to launch that slice standalone, and campaign COUNT is minimized to what volume, message-differentiation, and the test budget actually require. The one exception is a genuinely small niche whose whole TAM is small (a narrow regional vertical, say): there, small campaigns are correct and the ICP-adequacy check fires instead. The honest boundary: a big TAM belongs in a few big campaigns; a small niche stays small; never fragment a big TAM into a pile of tiny slices to inflate the campaign count.

**Offer-Validation Wave first, before the coverage wave (HARD RULE, new client or any offer not yet market-proven).** The offer is locked from *research* (`/offer-intelligence` + `/lead-magnet-brainstorm`), which is not the same as *market-proven*. Slicing ten signal micro-campaigns on an unvalidated offer risks ten flops that burn freshly-warmed capacity and first-touch reputation to learn one thing (the offer is weak) that one clean broad campaign would have told you first. So when `run_state.offer_market_proven` is false (the default for a new client), the **first wave is an Offer-Validation Wave**: a small, focused set that tests the offer against the biggest, cleanest lists, differentiated by **message** rather than by a sparse timing signal.
> - The **broad value-prop campaign** (Section 2's No-AI / broad pattern): the offer's cleanest read, minimal personalization, over the whole qualified TAM. This is the offer's baseline pulse.
> - The required **Creative Ideas** and **Lookalike** campaigns (always-include): both test the offer while proving research and best-fit.
> - The **sold-to splits** (the `sold_to` axis): message-differentiated by who the company sells to, which reshapes the buyer, pain, and proof **without** needing a timing signal, so the validation wave is differentiated but not thin.
>
> All on the locked offer. This wave answers "does this offer get replies, and which broad message resonates?" before any capacity is fragmented into signal slices. **The gate:** if the Offer-Validation Wave clears the reply / positive-reply bar, set `run_state.offer_market_proven = true` and proceed to the coverage wave (Wave 1 below). If it flops, iterate the **offer** first (`/offer-intelligence` validation mode: Go / Iterate / Swap); do NOT fan out signal slices on a dead offer. For a client whose offer is **already market-proven** (a returning client, or after this wave passes), skip straight to the coverage wave. This is the four-lever order made concrete: validate the offer (lever 1) before optimizing the list (lever 2). It does **not** change the ≥500-company floor or the volume-first shape below; it sequences them behind a cheap offer read.

> **Framework A copy + the flip criterion (Offer-Validation Wave defaults, `offer_market_proven = false`).** Because this wave proves the offer, keep the broad-value-prop posture and minimal per-contact personalization, but use the same Framework A initial-copy rule as every other wave: Email 1 is 25 to 35 body words, opens with the specific free deliverable, keeps the workload split in parentheses, and ends with its only question, a soft permission CTA. Use a 2-to-3-step sequence sized by TAM, recognizable proof only, no observational opener, and Tue-to-Thu sending. The phase flag controls strategy and the flip criterion, not a separate copy register. Full ruleset: `first-wave-eric-defaults.md` and `outreach-copy-framework.md`.
>
> **The flip criterion (pooled across the wave, with an explicit hold state). HARD RULE, re-derived 2026-07-17; replaces the old per-campaign ~300-send version.** The old rule held each campaign to ~300 first-touch sends, then flipped `offer_market_proven` true at roughly 1 positive per 400 contacted or dead at worse than 1 per 1,200. It could not actually decide. A positive reply at the 1-per-400 band is a rare event (Poisson mean 0.75 across 300 sends), so a genuinely good offer shows **zero** positives about 47% of the time and a dead offer shows at least one about 22% of the time: a coin toss dressed as a gate. That is the real reason `offer_market_proven` has never flipped for any client (that, plus most validation waves simply have not sent yet). Two corrections, both encoded here.
>
> **1. Judge the wave POOLED, not per-campaign.** The flag gates one decision about one shared offer (fan out the coverage wave, or iterate the offer), so pool every validation campaign's first-touch contacts into a single count `n` and its positive replies into a single count `k`. Count a positive from **any** step of the sequence (not first-touch only), once the sequence has had its ~21-day window to run. This also fixes an old denominator bug: the previous rule read a full-sequence reply against a first-touch-only send count. **Guard against a pooled false positive:** no single campaign may carry the flip on its own, and if a best-fit slice (say the Lookalike campaign) clears the bar while the broad campaign stays flat, that is a **list** finding (the offer lands on a narrower list), not an offer win, so do not flip `proven` on it.
>
> **2. Three states, not two: PROVEN / DEAD / HOLD.** With `n` = pooled first-touch contacts and `k` = pooled positive replies:
> - **Flip PROVEN** (`run_state.offer_market_proven = true`, proceed to the coverage wave) when `k >= 2 + n/660`. A genuinely strong offer (1-per-400) clears this at about 1,600 pooled contacts, so a good offer is rewarded early instead of made to wait.
> - **Flip DEAD** (iterate the **offer** via `/offer-intelligence` validation mode: Go / Iterate / Swap, plus Eric's SQL to MQL and chunk-up/down reframes; never fan out signal slices on a dead offer) when `k <= n/660 - 2`. This line is unreachable below ~1,300 pooled contacts, so a zero-positive wave under ~1,300 is **not** a kill. You may not call an offer dead below ~1,300 pooled first-touch contacts.
> - **HOLD** in between: keep sending the validation wave and let the pooled sample grow, but do not fan out the coverage wave and do not tear up the offer. Hold is active, not idle. The wave keeps sending, so `n` climbs on its own toward one of the two boundaries.
>
> Ready-reckoner (the same formula, rounded, positives needed to flip): at ~1,300 pooled contacts, PROVEN at k>=4 or DEAD at k=0; ~2,000 pooled, PROVEN at k>=6 or DEAD at k<=1; ~3,000 pooled, PROVEN at k>=7 or DEAD at k<=2; ~4,000 pooled, PROVEN at k>=9 or DEAD at k<=4. Any k between the two numbers at a given size is HOLD.
>
> **Two floors, do not merge them.** The ~300-first-touch-sends figure (`/cold-email-weekly-rhythm`) is the per-campaign **raw-reply** readability floor and stays correct for that job (raw reply runs ~1 to 3%, so 300 sends gives a readable raw count, and it gates a negative call inside a >=3-mature-campaign check). This offer flip reads the far rarer **positive**-reply event, so it is judged **pooled at the ~1,300+ floor above**, never per-campaign at 300. It also needs the **positive** reply count specifically, so if reply categorization is off, hand-read and tag the replies first (raw reply rate cannot flip this flag).
>
> **The magnet-inflation guard on the flip (HARD RULE, 2026-07-17).** The flip criterion is measuring **the offer**, and it only measures the offer if the offer is what earned the reply. A strong free asset earns yeses on its own merits — the asset is interesting, so people say send it — and those yeses say nothing about whether anyone wants the paid thing behind it. Aaron Shepherd's own warning is the source: his 589 positive replies came from a lead-magnet front end, and he states plainly that getting a reply and booking a call are two completely different things, and that magnet-led campaigns routinely produce a flood of yeses with a terrible meeting-to-lead ratio. A magnet-inflated positive-reply rate that flips `offer_market_proven = true` fans the coverage wave out across an offer nobody has actually validated — the exact failure this whole gate exists to prevent, arriving through the front door with good-looking numbers.
>
> So: **read the flip on offer-led copy.** The validation wave should lead with the direct offer (the CTA Hierarchy's default), which makes the positive reply a genuine read on the offer. If the wave's E1 is instead **asset-led** (an easy-yes opt-in fronting a real magnet), the reply rate is a read on the *asset*, not the offer, and **it cannot flip the flag by itself**. In that case require a downstream signal that the offer (not the asset) is what's working: meetings booked, or positive replies that survive the asset hand-off and convert to a booked call. Judge on the meeting rate, not the yes rate. If neither is measurable yet, hold the flag at false and keep reading; a false `proven` is far more expensive than a slow one. (Archetype K interactive tools cannot front a baseline validation wave at all: gate K1 in `/lead-magnet-brainstorm` bars them precisely because they are the strongest reply-inflators we have, and this guard is that rule's twin from the measurement side. This guard covers the non-tool magnets that *can* legitimately appear here.) **Escape hatch, so this can't deadlock:** if meetings are genuinely not measurable (they land on the client's calendar past the SQL hand-off, and the reporting stack only reads the sending platform's reply categories), do NOT sit at `false` indefinitely, because that stalls the coverage wave forever. Either use the nearest observable proxy the sending platform does expose (positive replies that survive the asset hand-off and continue the thread toward a time), or re-run the wave offer-led and read the flip cleanly. Both are decidable; "hold and keep reading" is not.

**Signal coverage — measure it first (this drives the whole wave).** Before choosing campaigns, compute each sliceable signal's **real coverage**: the count and % of `enrichment_tier = enriched` rows that carry a usable value for it. `/tam-build`'s build report already writes this **Signal Coverage Table** — read it; recompute from `tam.csv` if absent. Coverage is measured over **enriched rows only** — `qualified_out` rows are blank by design and would make every signal look artificially sparse. This coverage table is the evidence the launch set is built from: the **count** of enriched companies carrying each signal is what the ≥500-company eligibility floor (below) tests — ≥500 makes it launch-eligible, under 500 does not. A signal 40% of a multi-thousand-company TAM carries is comfortably above the floor; one no enriched company carries is not a campaign at all.

**≥500-company eligibility floor (HARD RULE, launch eligibility; operator directive 2026-07-12, encoded 2026-07-17).** A slice becomes a launch campaign only when it targets **at least 500 companies**, counted over `enrichment_tier = enriched` rows only (`qualified_out` rows are blank by design). 500 is the absolute floor, never lower. This is the concrete, binding form of "viable": the inclusion test is a hard count, not a judgment. **This is a company-universe floor, NOT a verified-contacts floor.** A slice with ≥500 companies QUALIFIES even if its verified contacts come back fewer, and a slice under 500 companies does NOT ship regardless of contact count. The operator confirmed this exact reading against a prior client's medical-practice slice (817 companies / 396 verified contacts, which qualifies on the company axis). The target is 500 companies or 1,000+ contacts, the more the better. **This supersedes and RETIRES both the old ≥100-company floor and the old ≥100-contact floor.** There is no contacts floor any more; eligibility is measured purely on the company axis. The signal must also be **proven**, an actually-populated signal column, never invented or assumed, so every campaign is **signal-first**, its slice predicate a real signal. **A ≥500-company slice is launch-eligible**, which is not the same as launching it standalone: maximize covered volume and reach, not the raw campaign count (Volume-first above governs the shape, and standalone signal campaigns are the bounded test allocation). **Maximize contacts by scraping ALL ICP-matching decision-makers on EVERY company** in the qualifying set. Use every ICP job title the client's ICP lists (5, 10, however many per segment), across all companies, never 1-2 per company and never a tight cap. This is the primary contacts-per-company lever. **This is a threshold by COUNT, not a rank-and-cut:** never rank signals by coverage and drop the lower ones. The highest-intent "why-now" signals (job change, funding, new exec) are inherently the *sparsest* at company level, so a sparse signal is never dropped for ranking low against a broader one. Coverage only sets launch *order* when capacity forces a choice (intent and offer-fit weigh alongside it). The earlier "40% of companies carry it" framing is **illustrative of magnitude only**, and the binding gate is the absolute ≥500-company count; the % is informational and for ordering. **A signal under 500 companies is not its own campaign, is never deleted, and is never shipped small.** Raising the floor to 500 makes the sparsest high-intent signals much harder to qualify, so the remedy is one of three, never "launch it small anyway": fold it into a qualifying campaign, lookalike-expand it to ≥500 while ICP fit holds (widen while fit holds), or hold it for a later wave. Keep the sub-threshold signal catalogued either way; it may cross 500 at the monthly refresh or as the TAM grows.

**Message-differential split test: what earns a slice its OWN copy (Eric "the list is the message" doctrine, 2026-07-04).** The ≥500-company floor above is *launch eligibility*: clearing it makes a slice eligible, and how many slices become their own standalone campaign is governed by Volume-first above (most ride the big broad/sold-to campaigns; standalone signal campaigns are the bounded test allocation). Layered on top is a separate *copy-treatment* question: does this data point change **what you'd say**? A launched slice earns its **own divergent copy/angle** only when the data point changes the message. A slice that clears ≥500 but wouldn't change the copy (a `headcount_range` band, `founded_year` on its own, a title like CEO-vs-founder) still launches, but as a **targeting filter / attribution bucket** riding the wave's shared copy, not with its own written angle. Segmenting on **who the company sells to** (the `sold_to` axis: their customers' vertical, size, and the department they sell into) **almost always** changes the message (different buyer, different pain, different proof) and is the strongest reason to write a slice its own copy. So the two decisions stay distinct: **a ≥500-company slice is launch-eligible** (Volume-first governs standalone-vs-tagged), and **write divergent copy only for the message-differential ones** (never manufacture a different message for a slice whose data point doesn't change what you'd say, the copy-side twin of "never contrive a thin slice to inflate the count" below). This is the same targeting-filter-vs-copy-variable line the department-headcount caveat already draws, generalized: a data point that only *selects* the list is a filter; one that changes the *message* earns its own copy.

**How it sits with Wave 1 (sharpens, does not fight it).** Wave 1 deliberately holds offer + copy constant across slices so reply-rate differences are attributable, so in Wave 1 *every* slice rides the shared copy by design. The message-differential test is therefore mostly a Wave 2+ guide: as copy begins to diverge, it decides which slices are worth writing their own angle (the sold-to and why-now slices) and which stay attribution buckets under the shared message. Launch eligibility (the ≥500-company floor) and copy divergence (message-differential) are two different decisions; both hold, and neither reduces the other.

> **The one stricter reading, flagged not encoded (operator call).** Eric's literal rule is about *splitting into a separate campaign*, so a stricter reading would let the message-differential test decide **which slices launch at all**, refusing to run a campaign for a slice whose data point doesn't change the message even when ≥500 companies carry it. That version cuts the launch set further than Volume-first already does, so it is **not** encoded here; it stays the operator's deliberate call (stress-test via `/consultant`). The encoded version above keeps every ≥500-company slice launch-eligible and only governs which get divergent copy.

Enumerate **every** viable `[FL]` slice (no cap on what you propose), then group them into the launch wave below. Enumerating a slice is not a promise to launch it standalone: Volume-first decides which slices become big campaigns, which ride one as a tagged attribution bucket, and which few run as bounded experiments.

- **Wave 1 — coverage wave (list-only).** *For a new client this runs only after the Offer-Validation Wave passes; for an already-proven offer (`run_state.offer_market_proven = true`) it is the first wave.* Shape it **Volume-first**: the bulk of the wave's sends goes into a **few big campaigns** (the broad value-prop over the whole qualified TAM, plus the big sold-to message-differential cuts), and the eligible signal slices ride those campaigns as tagged attribution buckets, except for the bounded ~5-10% testing allocation that runs as standalone experiments. Every campaign in the wave must (1) clear the **≥500-company eligibility floor** and (2) not overlap, so dedup the selected slices against each other and the client suppression registry so no company is contacted by two campaigns at once. Hold the **offer and copy approach constant** across the wave; vary only the slice/signal (and its list-appropriate personalization). Holding offer+copy constant is what keeps the wave clean: every reply-rate difference traces to the list, so the coverage wave is an *attributable* baseline (what `/experiment-design` needs), not a confounded test. What is maximized here is covered **volume and reach**, never the campaign count, and it comes only from real, non-overlapping, viable slices, never from contriving thin slices to inflate the number.
- **Wave 2 — exploit + expand.** Scale the Wave-1 slices with the best positive-reply rate, add any viable slices the capacity trim held back, and introduce new data-point combinations. Because the full obtainable signal set is collected up front (`/data-point-discovery` Collection Completeness rule), Wave 2 mostly mines **untested combinations of columns already in `tam.csv`**, plus any genuinely-new `in_reserve` point added at refresh. Here you can begin clean single-variable copy/offer experiments against the established baseline.
- **Wave 3+ — continuous.** Driven by `/cold-email-weekly-rhythm` + `/experiment-design`: keep mining untested slices, retire losers, test the next variable.

**Volume adequacy — cold email is a volume game, so forecast it and anchor on the broad campaign (Eric).** Before locking the wave, forecast each campaign's real contact volume: `enriched companies in the slice × contacts-per-company × email-yield (≈50 to 70%)`. Two rules follow.
1. **The broad / value-prop campaign is the volume anchor and should be pushed to the 1,000 to 20,000 lead band the TAM allows** (high-volume default). The ≥500-company floor is launch *eligibility*, a minimum and never a volume target, so clearing it starts the job rather than finishing it. A healthy broad campaign is thousands to tens of thousands of leads (reference from a prior client build: one broad slice carried ~1,500 leads; the high-volume target grows that by scraping every ICP-matching decision-maker per company and by the `/tam-build` lookalike expansion ladder). **Contacts are not the gate, companies are.** A signal slice can be legitimately thin on contacts, so a 50-to-200-contact why-now slice is fine **provided it spans ≥500 companies**, which is the same company-universe reading the floor above settles (817 companies yielding 396 verified contacts qualifies). What is never fine is a slice under 500 companies. Volume comes from the broad anchor plus the total across the wave, not from every slice being large. Do not fragment a big TAM into only small slices and skip the broad anchor.
2. **ICP-adequacy check (surface, do not paper over).** If the whole enriched TAM cannot produce a single ≥500-company campaign, or its × yield cannot give the broad anchor real volume AND clear the per-campaign raw-reply readability floor (~300 first-touch sends, `/cold-email-weekly-rhythm`; the pooled offer-validation flip is judged separately at its own ~1,300-contact floor, see the flip criterion above) on each launched campaign, the ICP is too small to be a volume game on its own. That is an offer/ICP decision, not something to hide behind a pile of tiny slices: surface it and widen the lever the TAM can afford (all ICP job titles / the full buying committee, headcount band, geography, adjacent verticals, or the `/tam-build` lookalike expansion ladder while ICP fit holds). **Shipping a sub-500-company campaign is an explicit operator exception to the HARD RULE above, never something this skill proposes on its own:** surface the shortfall and the widening options, and let the operator make that call. The standing example is a genuinely small Nordic niche client whose live campaigns sat well under 500; the directive surfaces cases like it rather than auto-acting on them. A big TAM sliced into many small campaigns is a process miss, not a small niche.

**Weak-data companies are not forced into a contrived signal campaign.** Covering volume means reaching every in-ICP company through a *real* campaign, never manufacturing fake signals to fill a roster. If a set of in-ICP companies carries no signal that clears the ≥500-company floor, do **not** contrive a thin signal campaign for them. Put them in the **broad campaign** (value-prop-led, no-signal or light AI personalization; see Section 2's No-AI campaign pattern), which is the wave's volume anchor and where they belong anyway. A clean broad campaign for relevant companies beats a forced niche campaign on weak data.

**The cap on how many actually launch is sending capacity, applied at launch — not here.** This skill runs before infrastructure is known, so it does not size the wave by inbox count. Propose the **full** set of viable non-overlapping campaigns; the **capacity trim happens at launch** (`/cold-email-kickoff` Step 6 / upload), where the warmed-mailbox count is known and each launched campaign must get enough daily volume to reach its sample-size minimum within ~3–4 weeks. (Layering: the **≥500-company eligibility floor** is *launch eligibility* — a company-level count; this sends-based sample-size minimum is *read-out* — a slice near the 500-company floor is launch-eligible but thin to read, so give it full daily volume and the ~21-day run to accumulate a readable reply count. The floor governs whether to launch; sends/runtime govern when the result is trustworthy.) More warmed inboxes → more simultaneous campaigns; thin capacity → launch the highest-priority viable ones now (by intent/offer-fit + coverage) and queue the rest for the next wave. The queue is a capacity constraint, never a reason to propose fewer.

**Order the send by growth when the TAM outruns capacity (Eric; silent ordering, never a filter).** When the TAM is bigger than the warmed fleet can actually send to, the question is not who to delete. It is who to contact *first*. Order the send queue by growth signal: companies carrying headcount growth (`sales_headcount_growth_6mo`, `headcount_trend`) get contacted before flat or shrinking ones. Eric's reasoning is that there are broadly two kinds of companies, the ones trying to grow and the ones content with the status quo, and more growth means more problems to solve, so a growing company is likelier to need what you sell. Out of a 50,000-contact TAM, the first list he pulls is the ~5,000 whose company grew headcount 1%+ in six months. **Headcount is the workable growth signal today**; traffic growth would serve the same purpose, but nothing in the stack collects the history yet (the change-detection gap), so do not order against a traffic-growth column that isn't there.

Three constraints make this **ordering** rather than a filter, and they are the load-bearing part:
1. **It is deliberately NOT a TAM filter.** Eric narrows a big TAM for precision. The high-volume operator directive (2026-07-07, the newest volume authority) does the opposite: it widens the lookalike to reach 2,000 to 30,000 sends/day, expanding while ICP fit holds down to the ~50% rework floor. A growth pre-filter would shrink the very TAM this flow is straining to grow, so as an **exclusion** it fights that rule. As **ordering** it serves it. Nobody is deleted or excluded: flat and shrinking companies stay in the TAM and get contacted later in the queue.
2. **It is not buildable as a discovery filter anyway, so do not try to build it as one later.** Growth is generally sold as per-record enrichment on a list you already hold, not as a search-time filter at discovery, and a search-time growth filter is a premium tier where it exists at all. Check what the contract's company-discovery source actually offers before assuming otherwise, and treat this as mechanically an enrich-then-order pass over the built TAM, never a gate at discovery.
3. **It only pays when capacity is the binding constraint,** which the high-volume operator directive (2026-07-07) says it normally is (an account's real daily total sits well below a per-client 2,000 to 30,000 target until the warmed fleet is scaled to match). If the warmed fleet can cover the whole TAM, ordering changes nothing but the sequence. It costs nothing either way: no new columns and no new spend, because it reuses growth columns `/tam-build` already collects.

**The growth signal stays OUT of the copy.** Eric uses it silently and never mentions it in the email. This is the same targeting-filter-vs-copy-variable line the Message-differential split test draws above: growth here *selects the send order*, it does not change what you'd say. (A growth slice can still earn its own campaign on its own merits inside the bounded test allocation, per the Signal-Driven Slice Library's growth rows. The ordering pass itself stays invisible to the reader.) Rationale and the Eric source: `/ask-eric` (`eric-doctrine.md` section 8, the growth filter) (growth as a prioritization pass, not a TAM filter).

When there is no full scored TAM, stop and route to `/tam-build`, then `/lead-scoring`. Website research may shape ideas, but it cannot bypass the governed campaign-selection gate.

### Personalization tier — match the effort to the account's likely value

This is a light steer on top of the launch waves above, not a competing taxonomy. Personalization is a ladder of cost and effort — token swap, one AI line, full per-contact written copy, and (rarely) bespoke custom assets — and each rung only earns its keep above a certain account value. The skill is matching the rung to the account, not pushing every account to the fanciest rung. The fancy asset is a multiplier on a working offer and a tight list, never the lever itself, so fix the offer and the slice first; add heavier personalization only where the likely deal value pays for the effort.

When `tam.csv` carries `deal_value_tier` (the free derived contract-value estimate from `/tam-build`), use it to set personalization depth per slice or account:

- **`low` tier (bulk of a volume list):** static or one AI line. A clean broad campaign with a strong value prop beats over-personalizing a low-value account.
- **`mid` tier:** the full per-contact pre-written copy path (`/personalization-subagent-pattern`) — one well-built personalized body per contact.
- **`high` tier (small, genuinely high-value named accounts):** full per-contact copy, and this is the only place a bespoke custom-asset motion (personalized landing page, report, mockup) would ever be justified. That premium asset tier is **not built into this flow** — it is a separate, operator-decided product for high-ACV clients (deferred 2026-06-17); do not generate custom assets here.

Honest caveat: `deal_value_tier` is an estimate from firmographics and only matters when the TAM has real spread in deal value. If the ICP is uniform (every account is roughly the same size), the tier is nearly constant — keep personalization depth consistent across the wave and do not manufacture a tiering distinction that the data does not support.

### Signal-Driven Slice Library (the eight timing/context signals + the sold-to axis)

A curated menu of the highest-conviction campaign slices, expressed as predicates on the **canonical TAM columns** `/tam-build` already collects, anchored to the slicing model above (each campaign is a TAM slice on populated columns; flag `[FL]` when matching rows clear the `/experiment-design` minimum). A starting menu, not a cap. Full per-signal detail, all sub-slices, and acquisition paths live in `signal-strategy-playbook.md`; the matching copy is the runnable extract in `/campaign-copywriting` (Signal Angle Library). Every slice runs on the collection roles the stack contract resolves (contact-discovery source, company-discovery source, web-scraping tool, web-search API, bulk-classification model); any extra people-database fallback is an optional premium shortcut, never assumed live. The department, contact-job-change, and JD-content columns referenced below are the `/data-point-discovery` catalog extensions for these signals. Confirm a column is populated before slicing on it.

**When `social-proof-bank.md` exists, its Trigger & Angle bank is the client-specific, populated instance of this menu.** Read it to see which of these general signals THIS client actually has a ready angle and poke-the-bear opener for (its `data_backed = y` rows carry the same canonical column names as the predicates below), and which **message-only** triggers to add beyond the TAM (its `data_backed = n` rows — events, macro shifts, seasonal/budget-flush timing, competitor moves — which run on a non-TAM `acquisition` path, not a free slice). The bank feeds this menu; it does not replace it.

| Signal | Highest-conviction slice predicate (canonical columns) | Campaign angle |
|---|---|---|
| **Job change — new exec** | `new_sales_leader_90d = true`, or Layer-2 contact `job_change_recency = 0-90d AND job_change_type = new_company` at Director+ seniority | New-exec buying window: first 60 days are audit-and-rebuild. |
| **Job change — promotion** | Layer-2 `job_change_type = promotion` AND newly holds a budget title | Authority just shifted to them; speak to the pain they now own. |
| **Job change — quieter window** | `job_change_recency = 180-270d` | Past the 30-day chaos, not yet locked into contracts; less competed than 90d. |
| **Department — sales, no RevOps** | `sales_ic_count BETWEEN 10 AND 30 AND revops_count <= 2` | Sales capacity, no infrastructure. (Targeting filter only — never a copy line; see the surveillance caveat in `/campaign-copywriting`.) |
| **Department — eng-heavy, sales-light** | `eng_count >= 30 AND sales_ic_count <= 5` | Product-led; GTM motion not built; CTO/VP-Eng is first buyer. |
| **Headcount growth — fast** | `sales_headcount_growth_6mo in {25-50%, 50%+}` | Growth outran the process; bad data and onboarding drag arriving. |
| **Headcount growth — decline/restructure** | `sales_headcount_growth_6mo = decline OR headcount_trend = shrinking` | Same number, fewer people; efficiency and automation angle. |
| **Founded year — cohort** | `founded_year` band (e.g. 2021–2023 scaling-pain; ≤2009 legacy-stack) | Stage-specific pain: founding-era process under pressure. |
| **Ads — running** | `running_google_ads = true OR running_meta_ads = true` (× `has_case_studies = false` or a hiring column for two-signal confirmation) | Paid top-of-funnel without a matching outbound motion; channel-handoff gap. |
| **Ads — not running at scale** | `running_google_ads = false AND running_meta_ads = false AND headcount_range >= 51-200` | Outbound is the only top-of-funnel; cold email is more relevant, not less. |
| **Jobs data — hiring the signal role** | `hiring_roles contains "SDR"` (or RevOps, or your buyer's department) AND `jd_pain_language` populated | The JD names the pain in the buyer's own words; lead with it before the new hire starts. |
| **Profile / work history (Layer 2)** | contact `previous_company` in {competitor, champion company} OR `certifications` match | The context they carry changes how the pain shows up; skip the basics. |
| **Sold-to: customer vertical** ⭐ (flagship message-differential) | `sells_to_vertical` grouped into ≥500-company buckets (e.g. sells-into-legal vs sells-into-restaurants) | Their world defines their buyer, pain, and proof. The axis that most changes the message. One campaign per vertical bucket, each with its own proof. |
| **Sold-to: customer size** | `sells_to_customer_size = enterprise` (vs `smb`) | Selling up-market vs down-market is a different motion (deal size, cycle, buyer sophistication); lead with that motion's pain. |
| **Sold-to: sold-into department** | `sells_to_department = finance` (or `legal`, `marketing`, …) | The department they sell into sets their buyer and their compliance/proof bar. |
| **Sold-to: GTM motion** | `sells_to_motion = b2c` (vs `b2b`) | Coarse first cut: different economics, buyer, and proof entirely. |

**The sold-to axis is the flagship message-differential split (Eric doctrine).** "Who they sell to almost always changes what you say," so a viable `sells_to_*` slice is the strongest reason to give a campaign its own copy (per the Message-differential split test above). Slice on the clean enums (`sells_to_customer_size` / `sells_to_department` / `sells_to_motion`) as hard predicates; use `sells_to_vertical` (free text) to **group** into ≥500-company buckets and as the concrete **copy variable**, never as a raw enum predicate (it would return zero silently). Coverage is `med`, so a sold-to slice matches a real but partial subset; read its count from the Signal Coverage Table like any other signal. Copy angles live in `/campaign-copywriting` (Signal Angle Library) and `signal-strategy-playbook.md` §9.

**Job Change Detector is a different motion, not a TAM slice.** Champion re-engagement — a known warm list (past contacts, clients, churned, ghosted) detected as having moved companies — runs on an **uploaded contact archive, not `tam.csv`**. Build it as its own campaign, and only send where the prior relationship was real (playbook §6; copy caveat in `/campaign-copywriting`).

**Signal combos (layer timing + context in one row — the strongest copy):**
- **Growth + Jobs:** `sales_headcount_growth_6mo in {25-50%,50%+} AND hiring_roles contains "AE"` — incoming reps inherit today's infrastructure.
- **Founded + Growth:** `founded_year in 2021–2023 AND sales_headcount_growth_6mo in {25-50%,50%+}`. Founding-era process under its first real pressure (check whether the company-discovery source covers both signals in one pass).
- **Ads + Growth:** `(running_google_ads OR running_meta_ads) AND sales_headcount_growth_6mo >= 25-50%` — two-track growth with no shared data layer.
- **Job change + work history (Layer 2):** new exec whose `previous_company` carried a relevant operational context.
- **Jobs (JD content) + work history (Layer 2):** contact who previously ran the exact function named in the company's current job posting.

**Launch priority when capacity forces an order (NOT a one-at-a-time cap).** When capacity or the test budget can't accommodate every standalone signal experiment at once, this is the order to run them in (highest reply-rate-per-effort first, all runnable in-stack): (1) job change + work history, (2) jobs data / JD content, (3) growth + jobs, (4) ads, (5) founded year, (6) department headcount, (7) job-change detector. This is the playbook's Build Priority table. It sets the *sequence*, not a limit, and it governs only the slices that actually run **standalone**, which Volume-first bounds to the ~5-10% testing allocation (offer and copy held constant, slices non-overlapping). The rest ride the big campaigns as tagged attribution buckets. So it is **not** "build one signal, wait two weeks, then add the next," and equally not a licence to give every signal its own campaign. Coverage and offer-fit weigh alongside this order so a viable high-intent signal is never deferred behind a broad low-intent one.

### Contact-signal campaigns outrank company-signal campaigns — HARD RULE (operator directive 2026-06-29)

A **contact-level** signal (a why-now about the *person* — new-in-seat decision-maker, promotion into a budget title, work-history context) is **higher-intent than a company-level** signal (a state of the *company* — running ads, hiring, billing-migration). So:

- **Build campaigns at BOTH levels, but rank contact-signal slices ABOVE company-signal slices** at equal viability. When capacity forces an order, a viable contact-signal campaign launches before a company-only one. (This generalizes the existing #1 priority "job change + work history" to *every* contact-signal slice.) The flagship is **`contact_new_in_seat`**, a decision-maker in their first ~12 months, collected at Layer-1 cost. This signal comes from the contact-discovery source's role-tenure filter (a job-duration or months-in-current-role field). Confirm the contract's contact-discovery source actually exposes that filter before building the slice, and check how it is scoped: some sources only expose tenure filtering against a supplied domain list rather than as a free search, which changes how the slice is assembled (`/data-point-discovery` Contact-discovery signal tier; pulled in `/email-waterfall` contact-list assembly). **Never assume the filter exists because a signal library names it.**
- **Company-span floor for a contact-signal slice (⚠ INTERPRETATION of the directive, flagged for operator correction).** The 2026-07-12 directive **retires the old ≥100-contact floor** and sets eligibility at ≥500 target companies, "the addressable company set the campaign targets". It does not spell out how that lands on a *contact*-signal slice such as `contact_new_in_seat`, so what follows is this skill's reading rather than a quoted rule. The only coherent one is that the slice's **company span** must clear the floor: the contacts carrying the signal must sit across **≥500 companies**. Count the distinct companies in the slice's contact pool from the contact-discovery source's Layer-1 pull, **before any email reveal**, and test that count against 500. **There is no contacts floor any more**, so a slice spanning ≥500 companies qualifies even when it yields far fewer contacts, the same company-universe reading the prior-client case above settles. Under 500 companies of span, fold those contacts into a qualifying campaign, lookalike-expand while ICP fit holds, or hold for a later wave; never ship it small, and keep the sub-threshold signal catalogued (it may cross 500 as the TAM grows). **Operator note:** this is the one place this skill extends the directive instead of quoting it, so if you meant a different reading (a contact-count target rather than a company-span test), correct this bullet.
- **Contacts carry both layers.** Because `/email-waterfall` joins company signals onto each contact (`co_*`) and tags the Tier-1 contact signals, the strongest slices **stack** a contact why-now with a company signal (e.g. `contact_new_in_seat = true AND co_billing_migration_signal = true`) — the highest-intent predicate available. Prefer these stacked slices whenever the stacked predicate itself spans ≥500 companies; there is one floor now, tested on the stacked slice, not a separate floor per signal.

## Proof-Asset Gap Check (per planned angle)

When you plan an angle or slice, check whether it leans on a specific proof asset: a named client, a real case study, or an exact number/metric. If that proof is NOT already on file (`social-proof-bank.md`, `client-profile.yaml`, `offer-intelligence.md`, an approved artifact, or the intake), do not quietly assume the copywriter will fill it in or soften it later. Check `social-proof-bank.md` first — a segment-matched `proof_status = on_file` row means the proof is ready; a `gap_block` row for that segment means the gate should fire now. Flag the gap now and decide the tier on one question: is the angle hollow without this proof, or just less strong?

- BLOCK (hollow without it): the angle's whole credibility depends on the missing proof. Do not lock the slice on that angle until the proof exists. Emit the fill-in form (`proof-asset-request.md`) to the client, and either switch the slice to an angle the on-file evidence already supports or hold it until the proof returns.
- FLAG-AND-PROCEED (would only strengthen): the angle stands on a real signal already. Record the gap in the strategy output, emit the form, and let the slice proceed, to be upgraded when the proof returns.

**A group's `discovery_motion` sets its copy posture (the discriminator).** For a **`proven`** group (case-study-seeded lookalike), a segment-matched case study exists, so its campaigns get client-specific proof in copy (pull it from `/social-proof-bank`). For an **`expansion`** group (broad ICP filter for a net-new segment, or a no-proof new offer), **no client-specific proof exists for that group yet**, so its campaigns run **offer-led with NO client-specific proof**: an angle leaning on a named client, case study, or exact metric is a **BLOCK** on an expansion group (there is nothing on file to fill it), and the slice must switch to an offer-led angle. Do not claim client-specific proof on an expansion-motion group. This is a different axis from the Offer-Validation Wave: offer-validation asks whether the *offer* is proven, `discovery_motion` asks whether *this group* has a case study, and a proven-offer client can still have an expansion group.

This is a missing-source-material input gate, not an operator pause, so it is not relaxed by `auto_execute` (the form is a data request to the client, not a re-ask of the operator). Carry any flagged gap forward into the strategy output so `/campaign-copywriting` sees it and its own Proof-Asset Gate fires. Doctrine: memory.

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short — record status, not raw output. Full protocol: `client-activity-log.md`.

## TAM-First Gate — HARD RULE (read BEFORE generating anything)

Campaign ideas must be grounded in data points that actually exist in the real lead list — so on the TAM-first flow this skill **may not generate any campaign until the full TAM is built and enriched.** Before doing anything else, read `run_state.status.tam_stage` (see `/tam-build`):

- **`full_enriched`** → proceed. The whole qualified universe is enriched; `tam/tam.csv` is the real, complete substrate to slice.
- **`sample_built`** → **HARD STOP.** This is only a validation sample, not the full enriched universe. Do **not** slice campaigns off it and do **not** fall back to the website+ICP protocol to manufacture campaigns. Route back to `/tam-build` (the operator GO gate → Phase B full build + enrich), then return here once `tam_stage == full_enriched`.
- **`none` / unset** → only the **explicit TAM-less path** (an existing-offer *validation* run that intentionally never ran `/tam-build`) may use the website+ICP fallback below. On a new-offer TAM-first flow, route to `/data-point-discovery` → `/tam-build` first; do not invent targeting.

This gate is binding regardless of `execution_mode`. A `tam/tam.csv` file existing on disk is **not** sufficient — it can be a sample; the `tam_stage == full_enriched` flag is the authority. `/campaign-approval-brief` enforces the same gate downstream.

## Input Requirements

You will receive one or more of:
- A website URL (minimum required input)
- A `client-profile.yaml` produced by `/icp-onboarding` (strongly recommended because it contains ICP, offer, and hard/soft filters already codified)
- A `data-point-catalog.md` from `/data-point-discovery` (kickoff Step 3.3). It carries the obtainability picture and the market source landscape, including its `Ranked Source Signals` section
- A `tam/tam.csv` from `/tam-build` (the company-level TAM with firmographic + signal columns, plus a `fit_status` / `enrichment_tier` fit-gate column set). When present, treat the `enrichment_tier = enriched` rows as the primary substrate: generate campaigns by slicing existing columns on enriched rows, not by inventing targeting and not over gate-skipped (`qualified_out`) rows.
- A `tam/contacts.csv` from `/tam-build` Layer-1d (the **contact-level TAM** — decision-makers at good-fit companies, carrying the Tier-1 contact signals + the `co_*` company-signal join + the `email_found` flag, built up front, NO email reveal). When present, slice contact-signal campaigns on it (e.g. `contact_new_in_seat = true`), test its **company span** against the ≥500-company floor (see the Contact-signal section above), and prefer slices that stack a contact why-now with a `co_*` company signal. Contact-signal campaigns outrank company-signal campaigns at equal viability (see the Contact-signal section above). Email reveal for the confirmed contacts stays in `/email-waterfall`, never here.
- A `lead-magnets.md` from `/lead-magnet-brainstorm` (optional, but the chosen magnet shapes front-end offer suggestions)
- An `offer-intelligence.md` discovery brief (optional, but use it to understand why the locked offer was selected)
- A `social-proof-bank.md` from `/social-proof-bank` (the client's copy-ready Case Studies + Trigger bank). When present, use it two ways: (1) **weight each candidate slice by whether real, segment-matched proof exists** for it — a slice whose segment has an on-file case study is stronger than one whose proof is a `gap_block`; (2) **pull its data-backed trigger rows straight into the Signal-Driven Slice Library below** — those rows already reuse the canonical `/data-point-discovery` column names, so each maps onto a TAM slice, and its message-only trigger rows (events / macro / seasonal / competitor) surface angles the TAM can't produce. A slice resting on a `gap_block` proof row is flagged for the Proof-Asset Gap Check, not silently locked.
- Target audience parameters (titles, company size, location, industries)
- Source constraints, such as preferred sources, blocked sources, custom scraping approval, or paid-source approval rules
- Onboarding form responses
- Call transcript or account manager notes
- Specific constraints or focus areas

If a `client-profile.yaml` exists at `profiles/<business-slug>/`, load it first. Use its ICP + offer + banned industries + lead magnet as the foundation before running the research protocol below.

If `data-point-catalog.md` exists, use its `Ranked Source Signals` section and the market source landscape it records before recommending campaign sources. If it is missing for a new-offer path, stop and run `/data-point-discovery` on the locked offer (kickoff Step 3.3, which sits after the offer lock and before `/tam-build`) instead of inventing source options inside this skill. That route goes forward to data-point discovery only. The locked offer is not reopened.

If `tam/tam.csv` exists **and `run_state.status.tam_stage == full_enriched`** (see the TAM-First Gate above — a sample `tam.csv` does NOT qualify), load it and make it the primary substrate for campaign generation (see TAM-Driven Campaign Generation below). Each campaign should map to a slice of the TAM defined by columns that are actually populated; do not propose a campaign whose slice has no rows. When the TAM is genuinely absent (an existing-offer validation path that intentionally skipped `/tam-build`), fall back to the website + ICP research protocol below — but never use that fallback to route around a `sample_built` TAM.

## Locked Offer Rule

Only `offer.lead_magnet` means the front-end offer is locked.

If `client-profile.yaml` contains only `offer.client_suggested_primary_cta`, `offer.client_suggested_lead_magnet`, or `offer.client_suggested_lead_magnet_details`, stop. Those are hypotheses from the form, not decisions. Run `/offer-intelligence` in discovery mode, then `/lead-magnet-brainstorm` to lock the offer, then `/data-point-discovery` on that locked offer, before generating campaign strategy.

If `offer.lead_magnet` exists but no `data-point-catalog.md` exists and no `offer.offer_validation_path` or `offer_validation_path` evidence pointer exists, stop. This is a locked new-offer path that has not yet run data-point discovery. Run `/data-point-discovery` on the locked offer (kickoff Step 3.3), then return here. Do not rerun `/offer-intelligence` or `/lead-magnet-brainstorm`. The offer is already locked, and data-point discovery now runs against it rather than feeding it. If the source evidence genuinely undermines the locked offer, surface that to the operator as a finding rather than reopening completed offer work from inside this skill.

If `offer.lead_magnet` exists, treat it as the locked front-end offer. Use `offer.lead_magnet_details`, `offer.lead_magnet_cta_direction`, or older exact CTA fields only as supporting detail. Do not invent additional front-end offers in this skill. Campaign ideas may vary list, trigger, personalization, proof, and angle, but the front-end offer must stay consistent with the locked offer unless the user explicitly asks to revisit it. On new-offer paths, use `data-point-catalog.md` to prioritize campaign angles and source paths that match the source-backed pain behind the locked offer.

If no offer is locked, do not fill the gap inside `/campaign-strategy`. Run `/offer-intelligence` in discovery mode, then `/lead-magnet-brainstorm` to lock the offer, then `/data-point-discovery` on that locked offer, before generating campaign strategy.

### When Given a Website - Deep Research Protocol

> **Research Routing - HARD RULE (Claude native deep research primary, enforced) applies before this web research.** If `run_state.research_routing` is **unset**, default to **`claude_deep_research`**: the Claude native `/deep-research` fan-out harness (multi sub-agents research all needed categories in parallel, fetch real sources, adversarially verify each claim, synthesize a cited report) is the primary research brain. Proceed, do NOT stop to ask. Switch to **`third_party_ai`** (the older third-party web-research engine as primary) only on an explicit operator opt-out; **`claude_native`** (bare inline WebSearch, the weak path) is never the default and never satisfies the primary pass. In `claude_deep_research` mode the primary pass MUST be an **actual `/deep-research` invocation** (a single inline WebSearch, or any complement research engine, does NOT satisfy it). Record `ai_research_provider = claude-deep-research` and append an `api-balance-ledger.md` line; finishing in `claude_deep_research` mode with **no recorded `/deep-research` primary** is a **flagged violation**. No third-party key is needed for the primary pass. A missing API key for the web-research engine is a credential **HARD-STOP** only if the operator explicitly set `research_routing = third_party_ai`. Full rule: `/ai-model-routing` (see also **AI Strategy Principles** below).

**Do not guess at URLs.** Start at the homepage and follow actual navigation links.

#### Step 1: Homepage Analysis
- Fetch the homepage
- Extract all navigation links from the header/menu
- Identify the core value proposition and positioning
- Note the primary target audience mentioned

#### Step 2: Systematic Page Crawling
Visit these pages by finding them in the navigation (URLs vary by site):
- **Customers/Case Studies page**: This is CRITICAL. Extract EVERY customer mentioned.
- **Features/Product page**: Specific capabilities, use cases, differentiators
- **Pricing page**: Target market signals, tiers, buyer personas
- **About page**: Company story, team, mission
- **Blog**: Skim for content themes (don't go deep)

#### Step 3: Case Study Deep Dive
For EVERY case study or customer mentioned, extract:
- Company name
- Industry/vertical
- Company size (if mentioned)
- Specific metrics/results achieved
- Quote or testimonial
- What problem they solved

**This is essential for lookalike campaigns.**

#### Step 4: Customer Discovery Analysis
After gathering all case studies, analyze patterns:
- What industries appear most frequently?
- What company sizes are represented?
- What roles/titles bought the product?
- What common problems did they solve?
- Are there customer types NOT mentioned in the given targeting that should be?

**Challenge the given targeting if your research suggests broader or different ICP.** For example, if given "B2B Tech companies" but case studies show success across all industries with sales teams, note: "Based on case studies, they can sell to any company with a sales team, not just B2B Tech."

#### Step 5: Extract Key Information
1. What problem do they solve?
2. Who is their ideal customer (based on case study patterns, not just what they claim)?
3. What are their key differentiators?
4. What results/outcomes do they deliver (with specific metrics)?
5. What data could we pull from a prospect's public presence to make outreach relevant?
6. What unique job titles or team structures indicate a good fit?

#### Step 6: Source Reality Check
Use the target geography and `Market Source Landscape` to check whether each campaign idea has a real list behind it:
- Which public sources exist in the target market?
- Which obvious sources are weak, empty, paywalled, platform-risky, or missing there?
- Which local registries, directories, associations, job boards, marketplaces, event pages, or public databases may be a blue-ocean source?
- What source options exist for this campaign, including non-database options?
- What evidence must be captured before copy may reference the signal?

Do not reject a creative campaign because there is no existing skill for the source. Existing skills are execution tools, not strategy defaults.

## The "Manual Research" Test

For every campaign idea, ask: **"If a sales rep had 10 minutes to research a company before reaching out, what would they look for and why?"**

This grounds your suggestions in reality. The best campaigns automate what a great sales rep would do manually.

## AI Strategy Principles

> **Research Routing - HARD RULE (Claude native deep research primary, enforced).** Read `run_state.research_routing`: if it is **unset**, default to **`claude_deep_research`** and proceed. The primary research brain is the Claude native `/deep-research` fan-out harness (multi sub-agents research all needed categories in parallel, fetch real sources, adversarially verify each claim, synthesize a cited report). Do NOT stop to ask. Switch to **`third_party_ai`** (the older third-party web-research engine as primary) only on an explicit operator opt-out; **`claude_native`** (bare inline WebSearch, the weak path) is never the default and never satisfies the primary pass. In `claude_deep_research` mode the primary pass MUST be an **actual `/deep-research` invocation** (a single inline WebSearch, or any complement research engine, does NOT satisfy it). Record `ai_research_provider = claude-deep-research` and append an `api-balance-ledger.md` line; a research step that finishes in `claude_deep_research` mode with **no recorded `/deep-research` primary** is a **flagged violation**. No third-party key is needed for the primary pass. A missing API key for the web-research engine is a credential **HARD-STOP** only if the operator explicitly set `research_routing = third_party_ai` (then name the key to add to `scripts/.env`); do not silently substitute the weak bare-WebSearch `claude_native` path for a chosen primary. Full rule: `/ai-model-routing`.

**Model routing note:** the "AI Strategy" concepts below are per-campaign personalization patterns, not model choices. For this skill's own research and synthesis, route per `ai-model-routing.md`: the broad primary research pass (market/competitor/case-study/ICP-pain discovery, cited + self-verified) -> Claude native `/deep-research` fan-out harness; the web-research engine fills only the thin gaps it leaves; social reads -> whichever model the contract names for social research; site extraction -> the web-scraping tool; crunching case studies and campaign-idea synthesis across large context -> the bulk-classification model; structured idea-table formatting -> a general-purpose model. Each of those is a role, so read the stack contract for the tool that fills it rather than assuming one. This skill produces strategy, not copy, and does not loosen the publicly-available-data constraint below.

All AI personalization must use **publicly available data**:
- Website content (headlines, product pages, about page, blog posts)
- LinkedIn profiles and activity (posts, engagement, job changes)
- Job postings and descriptions
- Technology stack (via BuiltWith, Wappalyzer, etc.)
- News and press releases
- Social media presence
- Industry association memberships
- Podcast appearances, speaking engagements
- Funding announcements
- Hiring patterns

**Data sources to AVOID:**
- **G2, Capterra, Trustpilot reviews**: These platforms protect their data heavily. Do not suggest scraping reviewer names or review content because it is not reliably accessible.
  - **Worth testing (2026-07-17), NOT verified. The AVOID rule above stands until someone actually tests it.** A research pass suggests this blanket AVOID is partly stale, but that is a **lead, not a finding**. Trustpilot's reported public all-reviews endpoint has never actually been called here, so its behavior is **unverified**: we do not know whether it returns review *text*. The cheapest thing to test first is the Google-reviews path (use the web-search API's places lookup to find the place, then the web-scraping tool to pull review text, reported at roughly $0.0006/review with no per-place cap), but only once the contract names both roles and the keys resolve. Watch the plan tier on whichever scraping tool fills the role, since a free tier (often a ~$5/mo cap) would throttle any real pull. Google Reviews are already treated as usable under "Local Business Data" below. **G2 stays a hard AVOID either way:** it is genuinely gated behind a contracted `ds_reviews.read` scope with no public price. Do not turn any of this into a stated capability without a real test, and do not open a paid review-platform account without the operator's go-ahead. Trail: an internal 2026-07-17 signal-tier review that was not carried into this workspace; the live doctrine is `/ask-eric` (`eric-doctrine.md` section 8).
- **Private revenue figures, internal metrics, proprietary databases**: We cannot access these.
- **Freemium/existing user data**: Campaigns targeting people already using the product (e.g., free tier users, certification graduates) are nurture/PLG motions, not cold outbound. Flag these separately if suggested.

### Common AI Strategy Patterns

1. **Website Analysis**: Parse prospect's site to generate relevant use cases, identify pain points, or create custom recommendations
2. **LinkedIn Engagement Signals**: Target people engaging with specific content, companies, or thought leaders
3. **New Hire Detection**: Recent role changes indicate openness to new tools/approaches
4. **Technology Stack Filtering**: Using/not using certain tools signals sophistication or gaps
5. **Job Description Parsing**: Hiring for certain roles indicates priorities and budget
6. **Tenure-Based Messaging**: Years in business or role tenure affects messaging angle
7. **Content/Podcast Scraping**: Reference their public content to show genuine research
8. **Association Membership**: Scrape industry associations for targeted lists
9. **Audit/Ranking Data**: Generate audits (SEO, ChatGPT rankings, etc.) as value-add
10. **Competitive Intelligence**: Reference their competitors or market position

### Advanced Data Enrichment Capabilities

**Remember: an AI research agent (Claude Code, or whatever agentic enrichment tool the stack contract names) can find virtually ANY publicly available information.** If a human could find it with 10 minutes of Googling, an AI research agent can find it at scale. Be creative. We have gone as deep as finding high school football scores on Friday to email coaches about on Monday.

#### LinkedIn Data (High-Value Signals)
- **LinkedIn Engagement**: People who liked/commented on specific posts, companies, or thought leaders
- **Followers of Competitor Accounts**: People following competitive LinkedIn company pages
- **LinkedIn Post Activity**: Recent posts, posting frequency, topics they write about
- **Past Company Experience**: People who used to work at current customers (warm intro angle)
- **Team Member Count by Role**: Count salespeople, engineers, marketers at a company

#### Company Enrichment
- **Web Traffic Data**: Traffic trends, sources, engagement metrics
- **Fundraising Data**: Recent rounds, investors, funding amount, stage
- **Technology Stack**: Tools installed on website (BuiltWith, Wappalyzer, PredictLeads)
- **Open Job Postings**: Source lists from job boards, or enrich existing lists with hiring data
- **Employee Count Changes**: Hiring velocity, team growth patterns
- **Companies Using Specific Technologies**: Source or enrich for tech stack

#### Local Business Data
- **Google Maps Data**: Business listings, categories, hours, contact info
- **Google Reviews**: Review count, average rating, recent review content, specific complaints
  - **Reviews are a TARGETING signal, not an opener (CORRECTED 2026-07-17).** This bullet used to read "open with the issue itself, signal-first, e.g. 'Mary's review flagged [specific issue]...'". Both halves are retired: the signal-first opener is superseded by the offer-led opener (`/campaign-copywriting` Hard Rule 19), and one named reviewer's complaint is a per-contact fact, which Hard Rule 34 keeps out of copy. Slice instead on the shared complaint CATEGORY, so every company in the slice carries it; that shared complaint may then ride inside the offer sentence (Hard Rule 38), never in Line 1. The "not I saw" ban is unrelated and survives intact (`/campaign-copywriting` Signal-First Anti-Patterns, live).
- **Local Business Waterfalls**: Phone numbers and contacts for businesses without strong LinkedIn presence

#### Contact Enrichment
- **Mobile Phone Numbers**: Waterfall across multiple providers
- **Recent Hire Detection**: Filter for people who started in role within X months
- **Name-Drop Other Employees**: Find colleagues in specific departments to reference
- **Past Company Experience Matching**: Find prospects who used to work at client's current customers

#### Sales Navigator / Premium Data
- **Sales Navigator Scraping**: Via a Sales Navigator export/scraping tool, if the stack contract names one
- **Saved Search Monitoring**: Track when new people match criteria

#### Creative Data Sources (An AI Research Agent Can Find These)
- **Podcast Guest Appearances**: Who has appeared on industry podcasts
- **Speaking Engagements**: Conference speakers, webinar presenters
- **Award Winners**: Industry awards, "Top 40 Under 40" lists, etc.
- **News Mentions**: Press releases, media coverage
- **Court Records / Public Filings**: For relevant industries (legal, real estate, etc.)
- **Event Attendees**: Scrape attendee lists from public event pages
- **Sports Scores**: Local high school/college sports for hyper-local personalization
- **Weather Events**: Reference recent weather for relevant industries (roofing, HVAC, etc.)

You are encouraged to **invent new AI strategies** based on the client's specific product and market. If a human could find the data publicly, we can automate it.

### Sourcing vs. Enriching Lists

When building campaigns, understand the difference:

**SOURCING** = Pulling a list of companies/people that ALL match a specific criteria
- Use when: The filter is a hard requirement (e.g., "only companies that raised Series A")
- Example: Source all companies that raised funding in last 6 months from Crunchbase

**ENRICHING** = Taking an existing list and adding data to filter/personalize
- Use when: The filter is one of many criteria, or you're personalizing an existing list
- Example: Take a list of SaaS companies and enrich with funding data, then filter for funded ones

**Key insight**: Enriching is often cheaper and more scalable than sourcing. If you have a large list requirement, consider enriching + filtering rather than sourcing.

#### Common Sourcing Methods

These are source **families**, described by the capability they need. The tool that fills each one comes from the stack contract, never from this list.

- **Contact-discovery source / LinkedIn**: Standard contact search with title, company size, industry, location filters
- **Google Maps**: Local businesses by category and location
- **Workflow layer (Claude Code native by default, plus spreadsheets, plus an optional workflow tool if the contract names one)**: Merging, scoring, dedupe, source evidence, and final CSV preparation
- **Contact databases and enrichment layers (the contact-discovery source plus any people-database fallbacks)**: Use as the source only when title, company, technology, Sales Navigator, or provider-native data is the real source of truth
- **Local and map-based discovery (a maps scraper, or the web-search API's places lookup)**: Local business discovery by category and area
- **Company-discovery source**: True lookalike and account-similarity expansion. Add a revenue/growth database alongside it when SaaS ARR, revenue stage, growth, or category coverage is the signal
- **Web-search API + web-scraping tool / custom crawler**: Search-to-account, directory, website-pattern, event, marketplace, or association extraction
- **Social-signal tools / competitor engagers**: Public social or competitor engagement signals
- **Website-technology detection (BuiltWith, Wappalyzer, or equivalent)**: Companies using specific website technologies
- **Job Boards (Indeed, LinkedIn Jobs)**: Companies with open roles matching criteria
- **Funding databases (Crunchbase, PitchBook, or equivalent)**: Funded companies by stage, amount, date
- **Sales Navigator**: Advanced people search with saved search monitoring
- **Industry Associations**: Scrape member directories
- **Event Attendee Lists**: Conference and webinar registrants

#### Common Enrichment Methods
- **Fundraising**: Enrich any company list with funding data
- **Tech Stack**: Enrich with technologies detected on website
- **Hiring Signals**: Enrich with open job postings
- **Web Traffic**: Enrich with traffic trends and sources
- **LinkedIn Data**: Enrich contacts with recent posts, engagement, tenure
- **Google Reviews**: Enrich local businesses with review data

## Required Campaign Types

These campaigns MUST appear in every output. They are proven to work across virtually all clients:

### 1. Creative Ideas Campaign (Always Include)
- **AI Strategy**: Analyze prospect's website to generate 3 specific use cases for how they could use the client's product
- **Why it works**: Shows you did research, provides immediate value, demonstrates capability
- **Structure**: "I had an idea for {{company}}..." + 3 bullet points of specific ideas

### 2. New Hire Campaign (Always Include)
- **List Filter**: People who started in target role within last 90 days
- **Why it works**: New leaders are actively looking for quick wins and open to new tools
- **AI Strategy**: Pull start date, previous company, detect what they're inheriting

### 3. Lookalike Campaign (Always Include)
- **List Filter**: Companies similar to the client's best case study customers
- **Why it works**: If it worked for similar companies, it should work for them
- **Requires**: Deep case study research to identify patterns (industry, size, tech stack, growth stage)
- **AI Strategy**: Reference the similar company: "We helped [case study company] who's similar to you..."
- **Multi-segment rule**: For clients with 2+ distinct ICP segments, generate one lookalike campaign per segment when case study evidence exists for each. A lookalike targeting Insurance companies and a lookalike targeting Banking companies are different campaigns for different buyer contexts - list them separately in the table with distinct ICP Segment values.

## Creative Stretch Campaigns

Go beyond the obvious. Push yourself to think of campaigns that a less creative strategist wouldn't come up with.

### Techniques for Deeper Creativity:

**1. Quantify the Pain (the cost, not the raw count)**
- Use a headcount or department count to compute a COST, never to recite the number back at the prospect: "If each of the SDRs spends 5 hours/week researching, that's 50 hours/week of selling time lost." The implication is the line; the raw count is targeting input only.
- Do NOT recite a scraped count at the prospect ("You have 10 SDRs") and do NOT name-drop individual employees ("I saw Mike, Laura, and James on your team"). Both read as surveillance, and the second also trips the observational-opener ban. Lead with what the number means, per `/campaign-copywriting` Signal-First Anti-Patterns and the Signal Angle Library (department-headcount caveat).

**2. Detect Unusual Job Titles**
- Some job titles signal perfect fit (e.g., "GTM Engineer" for a GTM tool)
- Look for titles unique to the client's space
- Target companies WITH that title, or companies WITHOUT it (both can work)

**3. Invert Signals (Use Carefully)**
- Instead of "has GTM Engineer," try "has VP Sales but NO GTM Engineer"
- The absence of something can signal opportunity

**IMPORTANT: Only invert signals that are reliably detectable.**
- Job titles are reliably detectable via LinkedIn.
- Job postings are reliably detectable.
- Do not use tech stack absence as a hard signal. If we do not detect a tool, that does not mean they do not use it.
- Do not use "No enrichment tool detected" as a campaign premise.

If you can't reliably prove the absence, don't build a campaign around it.

**4. Combine Multiple Signals**
- Stack 3-4 filters for hyper-niche lists
- Example: "New VP Sales + hiring SDRs + uses Salesforce + posted about scaling outbound"

**5. Estimate Hidden Data**
- Estimate what data matters to their team based on their business
- Suggest specific data points you could gather. Name the specific thing their SDRs likely need and explain that we can pull it automatically.

**6. Role-Specific Workflows**
- What does a day in the life look like for the target role?
- What manual tasks do they do that could be automated?
- What data do they wish they had but don't?

**7. Detect Team Structure**
- Count people in specific roles via LinkedIn
- Identify org structure (do they have RevOps? Dedicated SDR team? Sales Engineers?)
- Tailor messaging to their team composition

## Output Format

### Section 1: Campaign Ideas Table

Express each campaign's **List Filters** as scored-TAM column predicates. Add the matching company count, eligible contact count, and P1 through P5 distribution. Mark first-launch-ready campaigns with `[FL]` only when at least 500 companies carry the signal and the needed columns are populated.

Create a markdown table with these columns, ordered from **broadest to most niche**:

| Campaign Name | ICP Segment | Offer Archetype | Targeting Level | List Filters | Company Count | Eligible Contacts | Score Distribution | Source Strategy | Source Options | Location Fit | Data Availability Risk | Primary Source | Backup Source | Evidence Needed | AI Strategy | Value Proposition | Campaign Overview |

**Column Definitions:**

- **Campaign Name**: A short, descriptive title (e.g., "ChatGPT Ranking Audit", "New VP Welcome Campaign", "Service Titan Users")
- **ICP Segment**: Which ICP segment this campaign targets. Use segment names from `client-profile.yaml` industries (e.g., "Insurance", "Banking", "Tourism"). Use "All" only when the campaign is genuinely relevant to every segment without modification.
- **Offer Archetype**: The offer archetype letter (A-K from `/lead-magnet-brainstorm`) this campaign leads with. Must match the locked `offer.lead_magnet`. When `offer-intelligence.md` exists, mark SATURATED archetypes with [!] . For multi-segment clients, the archetype should reflect the saturation map for the campaign's target segment.
- **Targeting Level**: Broad, Focused, or Niche
- **List Filters**: What criteria define this list beyond the base parameters (e.g., "None - base list", "New hires <90 days", "Engages with AI content on LinkedIn + uses HubSpot")
- **Company Count**: Distinct eligible target companies in the slice
- **Eligible Contacts**: Contacts with `send_eligible = true` before paid email reveal
- **Score Distribution**: P1, P2, P3, P4, and P5 counts plus median score and low-confidence count
- **Source Strategy**: Why this source family fits the campaign signal and target geography better than a generic database pull, or why a database pull is enough
- **Source Options**: All viable source options worth considering before final source planning, including local or country-specific sources when they exist
- **Location Fit**: How well the source path fits the target country, state, region, or city
- **Data Availability Risk**: The main risk that the source may not have enough usable rows, enough evidence, enough contact paths, or enough market coverage
- **Primary Source**: The best starting source, named as the capability role the stack contract resolves (the contact-discovery source, the company-discovery source, a people-database fallback, the web-search API, the web-scraping tool, a maps or local-business scraper) or as the concrete public source itself (Google Maps, a directory, association, marketplace, event page, job board, public website, or custom scrape target). Do not list the workflow layer as the primary source unless owned CRM/CSV cleanup genuinely is the source; otherwise name it as the workflow layer in Source Strategy. Never write a brand name here that the stack contract has not filled in.
- **Backup Source**: The fallback source if the primary source has poor coverage, weak evidence, high cost, or platform risk
- **Evidence Needed**: The row-level proof needed before copy may reference the signal, such as `evidence_url`, job post URL, directory profile, event page, review URL, website page, social post, or provider source note
- **AI Strategy**: How we personalize at scale (e.g., "Generate use case from website content", "Pull ChatGPT ranking for their keywords", "None - static copy")
- **Value Proposition**: The core promise/angle (e.g., "Help them rank higher in AI search to capture more leads", "Save 10 hours/week on data enrichment")
- **Campaign Overview**: Detailed description of how the campaign works, what the email flow looks like, what research is included, and enough context to hand off to a copywriter

**Campaign Overview should include:**
- The hook or opening angle
- What personalized elements are included
- The call-to-action approach, not final CTA wording
- How the locked offer or lead magnet is preserved
- How Email 1 and its one or two same-thread follow-ups can test different purposes without inventing a new offer
- Any proof points or case studies to reference
- A `proof_gap:` note when the angle leans on a named client, case study, or exact number that is NOT on file (per the Proof-Asset Gap Check above): record the missing proof, the tier (BLOCK or FLAG-AND-PROCEED), and that the `proof-asset-request.md` form was emitted, so `/campaign-copywriting` inherits the gap. Omit the line when the angle has no proof gap.
- Specific variables or research points to include
- How this differs from other campaigns in the table

Exact CTA copy belongs in `/campaign-copywriting`, where it must use the permission-based, value-backed CTA framework and pass `spam-word-checker.md` plus `cold-email-copy-best-practices.md`.

Do not solve CTA variety by inventing extra front-end offers. If Email 1 and Email 3 need different CTA substance, vary the angle, proof path, deliverable framing, or use of the locked lead magnet while staying inside the campaign plan.

### Section 2: No-AI Campaigns

At least one campaign that uses **zero AI personalization**. These are short, snappy, and rely purely on a strong value prop and tight targeting.

Format as a brief description:
- Campaign name
- Why it works without AI
- The core message structure

### Section 3: Front-End Offer

If `offer.lead_magnet` exists in `client-profile.yaml`, restate it and explain how the campaign ideas use it. Do not suggest alternative offers.

If no locked offer exists, or if only `offer.client_suggested_*` fields exist, stop and route to `/offer-intelligence` discovery mode, then `/lead-magnet-brainstorm` to lock the offer, then `/data-point-discovery` on that locked offer. This skill should not invent front-end offers independently.

Format:

```markdown
### Front-End Offer

**Locked offer:** [offer.lead_magnet]
**Details:** [offer.lead_magnet_details]
**CTA direction:** [offer.lead_magnet_cta_direction, or summarize older exact CTA fields as direction only]
**Source-signal basis:** [primary source-backed pain or why-now signal from the `Ranked Source Signals` section of data-point-catalog.md, unless this is evidence-backed existing-offer validation]
**How strategy uses it:** [brief rationale connecting the offer to campaign angles]
```

## Example Output Structure

```markdown
## Campaign Strategy for [Client Name]

**Target Audience (Given)**: [Summarize the base parameters provided]
**Target Geography**: [Countries, states, regions, cities, and excluded markets]
**Core Value Proposition**: [What the client ultimately sells]
**Key Differentiators**: [What makes them unique]

---

### Customer Discovery Analysis

**Case Studies Reviewed:**
| Company | Industry | Size | Key Metric | Problem Solved |
|---------|----------|------|------------|----------------|
| [Company 1] | [Industry] | [Size] | [Metric] | [Problem] |
| [Company 2] | [Industry] | [Size] | [Metric] | [Problem] |
| ... | ... | ... | ... | ... |

**Patterns Identified:**
- Most common industries: [List]
- Company sizes: [Range]
- Roles that bought: [Titles]
- Common problems: [List]

**Targeting Recommendation:**
[If research suggests broader or different ICP than what was given, note it here. E.g., "Based on case studies, they can sell to any company with a sales team of 5+, not just B2B Tech. Consider expanding targeting."]

**Best Customers for Lookalike Campaign:** [List 3-5 case study companies that would make good lookalike targets]

### Market Source Landscape Used

**Strong source paths:** [Market-specific sources from the market source landscape in data-point-catalog.md]
**Weak or risky source paths:** [Sources with poor coverage, weak evidence, high cost, or platform risk]
**Blue-ocean sources:** [Country-specific or niche sources a generic database would miss]

---

### Campaign Ideas

| Campaign Name | ICP Segment | Offer Archetype | Targeting Level | List Filters | Source Strategy | Source Options | Location Fit | Data Availability Risk | Primary Source | Backup Source | Evidence Needed | AI Strategy | Value Proposition | Campaign Overview |
|--------------|-------------|-----------------|-----------------|--------------|-----------------|----------------|--------------|------------------------|----------------|---------------|-----------------|-------------|-------------------|-------------------|
| Creative Use Case | All | [letter] | Broad | None - base list | Start from a broad account source that covers the target market, then enrich website content for real personalization | Company-discovery source, web-search API plus web-scraping tool, country-specific company registry, contact-discovery source if coverage is strong | [Explain target-market fit] | Broad databases may miss local firms or lack evidence URLs | Best available account source for this market | Alternate database or local registry source | Company website URL and page text | Analyze website to generate 3 specific use cases | Help them [outcome] faster | Open from a researched company idea, generate 3 specific ways they could use [product] based on their website content, reference [case study] showing [result], and route the CTA toward the locked front-end offer. |
| New Leader Welcome | [Segment] | [letter] | Focused | Started role <90 days | Source from role-change data only if that signal is available in the target geography | Contact-discovery source, a people-database fallback, LinkedIn role-change source, web-search API public announcement search | [Explain target-market fit] | Role-change data may be thin outside major markets | Best verified role-change source for this market | Web-search API plus public announcement search | Current role, start date, profile or announcement URL | Pull start date, previous company | Help new leaders make an impact quickly | Acknowledge the new-role context, connect the locked offer to a quick win, and use a low-friction CTA approach that `/campaign-copywriting` will turn into final QA-approved copy. |
| ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... |

### No-AI Campaigns

**[Campaign Name]**
- Why it works: [Explanation]
- Core message: [Brief structure]

### Front-End Offer

**Locked offer:** [Offer from client-profile.yaml]
**Details:** [Details from client-profile.yaml]
**CTA direction:** [CTA direction from client-profile.yaml, not final copy]
**Source-signal basis:** [Source-backed pain or why-now signal from the `Ranked Source Signals` section of data-point-catalog.md]
**How strategy uses it:** [How the campaign ideas route prospects toward the locked offer]
```

## Quality Checklist

Before finalizing output, verify:
- [ ] At least 15-20 campaign ideas (more if you have strong ideas)
- [ ] When `tam/tam.csv` exists: a **Signal Coverage Table** (count + % of `enriched` rows per sliceable signal) is computed first; every campaign maps to a real TAM slice with a real row count (no zero-row campaigns); **every** proven signal that **≥500 companies carry** (the ≥500-company eligibility floor) is flagged `[FL]` and placed in the **Wave-1 coverage wave** (non-overlapping; offer + copy held constant), either riding a big campaign as a tagged attribution bucket or, for the bounded ~5-10% test allocation, running as its own campaign. Signals are NOT coverage-ranked-and-cut, so viable sparse high-intent signals (job-change, funding, new-exec) are kept in as long as ≥500 companies carry them. A signal under 500 companies is folded into a qualifying campaign, lookalike-expanded to ≥500 while ICP fit holds, or held for a later wave, never deleted and never shipped small. In-ICP companies with no signal clearing the ≥500-company floor are routed to the broad campaign, not a forced/contrived data-point campaign
- [ ] **Volume-first wave shape (the GOVERNING default):** the wave maximizes covered VOLUME and reach, never campaign COUNT. A few big campaigns (the broad value-prop anchor + the big sold-to message-differential cuts) carry the bulk of the sends at 1,000 to 20,000 leads each; new or unproven signal slices are held to a bounded ~5-10% testing allocation and their winners scale back INTO the big campaigns; a signal that neither changes the message nor is a live experiment rides a big campaign as a tagged attribution bucket instead of its own small campaign. The only exception is a genuinely small niche whose whole TAM is small (there the ICP-adequacy check fires instead). A big TAM fragmented into a pile of small campaigns is a process miss
- [ ] **≥500-company floor + scrape-all-DMs (HARD RULE):** every proposed campaign targets **≥500 companies**, measured as a company-universe floor and NOT a verified-contacts floor (≥500 companies qualifies even when verified contacts come back fewer; under 500 companies never ships regardless of contact count), and the contact plan pulls **ALL** ICP-matching decision-makers (every ICP job title the client's ICP lists) on **EVERY** company in the qualifying set, never 1-2 per company and never a tight cap
- [ ] **Offer-validation-first for a new client:** when `run_state.offer_market_proven` is false, the FIRST wave is the Offer-Validation Wave (broad value-prop + Creative Ideas + Lookalike + sold-to splits, on the locked offer), and the signal coverage wave is deferred to the next wave, not launched up front. The coverage wave is gated behind the offer clearing the reply bar (or `offer_market_proven = true`)
- [ ] **Message-differential split test applied:** every ≥500-company slice is launch-eligible (Volume-first: standalone signal campaigns are the bounded test allocation, not the wave's default shape); the test governs copy only. A slice gets its OWN divergent copy/angle only when the data point changes what you'd say; slices that clear ≥500 but don't change the message (size band, `founded_year` alone, title) still launch but ride the wave's shared copy as attribution buckets, not their own written angle
- [ ] **Sold-to axis considered when present:** when `tam/tam.csv` carries `sells_to_vertical` / `sells_to_customer_size` / `sells_to_department` / `sells_to_motion`, the sold-to slices (the flagship message-differential axis) are proposed for any `sells_to_*` grouping ≥500 companies carry, sliced on the clean enums and grouped/copy-varied on the free-text vertical
- [ ] When `tam/tam.csv` exists: slices are built over `enrichment_tier = enriched` rows only; no slice uses a `qualified_out` row, and a blank `enrich` column on an enriched row is read as a real negative (not missing data)
- [ ] When `deal_value_tier` is present and the TAM has real deal-value spread: personalization depth is matched to the tier (low tier gets static or one AI line; mid/high tier gets full per-contact copy; no bespoke custom assets generated here). When the tier is nearly constant (uniform ICP), depth is kept consistent and no false tiering distinction is manufactured
- [ ] Campaigns ordered from broadest to most niche
- [ ] **ICP Segment column populated** for all campaigns - "All" used only when the campaign applies to every segment without modification
- [ ] **Offer Archetype column populated** - SATURATED archetypes flagged with [!]  when `offer-intelligence.md` exists
- [ ] **Creative Ideas campaign included** (required)
- [ ] **New Hire campaign included** (required)
- [ ] **Lookalike campaign included** (required based on case study research) - one lookalike per distinct ICP segment when segment-specific case studies exist
- [ ] At least 2-3 "Creative Stretch" campaigns that go beyond the obvious
- [ ] Each AI strategy uses only publicly available data
- [ ] Each campaign has Source Strategy, Source Options, Location Fit, Data Availability Risk, Primary Source, Backup Source, and Evidence Needed
- [ ] Each campaign source recommendation reflects the target geography and the `Market Source Landscape`
- [ ] New-offer paths use `data-point-catalog.md`, or the skill stopped and routed back to `/data-point-discovery`
- [ ] A general-purpose contact database or Google Maps is used only when it is genuinely the best source for the campaign signal, and every named source resolves to a capability role in the stack contract rather than an assumed brand
- [ ] Campaign overviews have enough detail for copywriter handoff
- [ ] At least one no-AI campaign included
- [ ] Locked front-end offer included, or strategy stopped and routed to `/offer-intelligence` + `/lead-magnet-brainstorm` + `/data-point-discovery` on the locked offer
- [ ] Campaign overviews preserve the locked offer or lead magnet instead of inventing new offers
- [ ] Campaign overviews define the sequence as ONE thread with 2 to 3 steps (`/campaign-copywriting` Hard Rule 18: 2 by default, 3 only for a small TAM). No second new thread and no Email 4; the 4-email / two-thread structure was retired 2026-07-05
- [ ] Value propositions tied to: make money, save time, save money, or mitigate risk
- [ ] At least one "Golden ICP" style campaign (what a rep would send after 10 min of manual research)
- [ ] Customer discovery analysis completed, with targeting challenged if research suggests broader ICP

## Output Location

Save the full strategy brief to:

```
profiles/<business-slug>/campaign-strategy.md
```

This is the handoff document for `/campaign-copywriting`. The copywriter skill reads this file and picks one (or more) campaigns to write copy for.

## Execution Mode Gate

After saving `campaign-strategy.md`, check `run_state.execution_mode` from `client-profile.yaml`:

- `auto_execute`: when `tam/tam.csv` exists, first read `run_state.offer_market_proven`. **If false (new client / offer not market-proven): auto-select the Offer-Validation Wave** (the broad value-prop campaign + the required Creative Ideas and Lookalike + the sold-to splits, all on the locked offer); do **not** fan out the signal coverage wave yet. Report: "Auto-selected Offer-Validation Wave: [names]. Signal coverage wave deferred until the offer clears the reply bar." **If true (proven offer): auto-select the coverage wave**, shaped Volume-first: a few big campaigns (the broad value-prop anchor + the big sold-to cuts) carrying the bulk of the sends, plus the bounded ~5-10% signal-test allocation. Every campaign must clear the **≥500-company eligibility floor** and be non-overlapping, offer + copy held constant. Do not inflate the campaign count; the goal is maximum covered volume and reach, not as many campaigns as the data supports. Keep viable sparse high-intent signals (job-change, funding, new-exec) in; do **not** coverage-rank-and-cut them, and fold or lookalike-expand any slice that misses the floor rather than shipping it small. Pull ALL ICP-matching decision-makers on every company in the qualifying set. Dedup selected slices against each other + the suppression registry. The final **capacity trim** (how many can actually reach significance in ~3 to 4 weeks on the warmed-mailbox count) is applied at launch in `/cold-email-kickoff` Step 6; thin capacity launches the highest-priority viable ones now (intent/offer-fit + coverage) and queues the rest. Respect `run_state.spend_ceiling_usd`. Report: "Auto-selected coverage wave (N campaigns covering M companies, ~K forecast leads): [names]. Reason: [one line each]." Without a TAM, select the single top-ranked campaign as before. Proceed to `/lead-source-strategy` Lead Source Plan Mode for each selected campaign without pausing.
- `review_gates` (default): if `run_state.offer_market_proven` is false, present the **Offer-Validation Wave** first (broad value-prop + Creative Ideas + Lookalike + sold-to splits, on the locked offer), and note the signal coverage wave is queued for after the offer clears the reply bar. If true, present the **coverage wave** in its Volume-first shape: the few big campaigns that carry the bulk of the sends, plus the bounded signal-test allocation, every campaign clearing ≥500 companies, each with its coverage (count + % of enriched rows), TAM row count, forecast lead volume, and one-line rationale (or top campaigns if no TAM). Use native choice prompts; the operator may launch the presented wave or trim to a subset. Wait for operator selection before proceeding.

## What to do next

Take the **first wave** and run `/lead-source-strategy` in Lead Source Plan Mode for each campaign before any list builder, scraper, database pull, or enrichment spend. The first wave is the **Offer-Validation Wave** for a new client (`run_state.offer_market_proven` false: broad value-prop + Creative Ideas + Lookalike + sold-to splits, on the locked offer), or the **coverage wave** for a proven offer (the few big campaigns plus the bounded signal-test allocation, when a TAM exists), or one campaign idea (no TAM). After the source plan and list QA are complete, run `/campaign-copywriting`.

Not every brainstormed idea is a viable campaign: a slice becomes one only once **≥500 companies** carry its signal (the ≥500-company eligibility floor) and the offer is validated. For a new client, validate the offer first (the Offer-Validation Wave), then, once it clears the reply bar, launch the coverage wave (a few big campaigns carrying the bulk of the sends, plus the bounded ~5-10% signal-test allocation, non-overlapping, capacity-trimmed at launch, offer + copy held constant). For a proven offer, go straight to the coverage wave; without a TAM, pick a single campaign. Maximize the **volume and reach** you cover, never the campaign count, then learn from positive-reply rate and expand into the next wave. (Volume comes only from real coverage and full decision-maker depth, never from contriving thin slices to inflate the count.)

If you do not have inboxes and a list yet, pause here. Come back after the setup skill selected by locked `run_state.infrastructure_stack`, the 2-week warmup, and `/lead-source-strategy` for the selected campaign. Do not jump straight to a list builder.

## Related skills

- `/ask-eric` - the live home of the Eric Nowoslawski doctrine this skill cites inline throughout ("the list is the message", the sold-to axis, the growth filter, the signal tier list in `eric-doctrine.md` section 8). Advisory only: it never sends, spends, or edits live systems. Where his teaching and this skill's governed rules diverge, the governed rule wins and the divergence gets surfaced, never silently swapped.

- `/tam-build` - produces the company and contact TAMs
- `/lead-scoring` - produces the scored TAM files and governed queue this skill must read
- `/icp-onboarding` - produces the `client-profile.yaml` this skill reads
- `/data-point-discovery` - produces `data-point-catalog.md` after the offer locks (kickoff Step 3.3), carrying the obtainability picture and the market source landscape this skill slices on
- `/lead-source-strategy` - produces the per-campaign `lead-source-plan.md` in Lead Source Plan Mode after campaign selection
- `/offer-intelligence` - produces the discovery brief that informs the offer
- `/lead-magnet-brainstorm` - picks the locked offer this strategy builds around
- `/campaign-copywriting` - writes the actual emails for campaigns defined here
- `/cold-email-kickoff` - the orchestrator that runs ICP + lead magnet + this skill in sequence

