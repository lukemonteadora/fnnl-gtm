---
name: cold-email-weekly-rhythm
description: Operational playbook AND the automatable weekly engine for running cold email continuously. Prescribes the manual Monday / Wednesday / Friday / biweekly / monthly / quarterly cadence, and defines a scheduled Weekly Scheduled Review that sweeps every active client — reading inboxes and replies, checking deliverability and warmed sending capacity, then deciding the next move (launch a new signal-first campaign, scale a winner, hold, or diagnose a flopping offer across campaigns) and landing human-approved paused drafts. Runs read-and-propose only, never sends, fails loud. Use this as your ongoing cadence once your first campaign is live; it is both the schedule and the brain the weekly /schedule routine invokes. What separates hobbyist from top 1% operators isn't tooling — it's consistency.
---

# Cold Email Weekly Rhythm
## Canonical Profile Root

All profiles/<business-slug> paths in this skill resolve under:

```text
<coldoutbound-skills>/profiles
```

Here `<coldoutbound-skills>` is the root of this skill library - resolve it to wherever the library is currently checked out (local Documents, OneDrive, or a git worktree); never hardcode an absolute path. Do not create client profiles under a `profiles/` folder at your current working directory.

Having 29 cold email skills doesn't help if you don't run them on a schedule. This is that schedule — and now also the automatable engine that can run the read-and-decide half of it for you.

**Two layers.** (1) A **manual playbook** — you put the rhythm on your own calendar (Step 1 below) and run the prescribed skill at the prescribed time. (2) An **automatable Weekly Scheduled Review** (its own section below) — a scheduled run that does the *reading, scoring, and proposing* across every active client and lands paused drafts for you to approve. The playbook stays the system of record and the fallback; the scheduled review removes the weekly drudgery without ever sending on its own. Both layers are the same skill — the review section is just the manual cadence's read-and-propose spine, consolidated and made schedulable.

## Material Decision Rule

When this skill reaches a material fork, name the realistic options, recommend the strongest path, and explain why the main alternatives are weaker before committing.

Ask before choices that affect spend, provider routing, source of truth, list quality, campaign direction, client-facing output, live systems, scraping or account risk, or legal/compliance risk. For low-risk reversible choices, state the recommendation and proceed.

Do not turn failed or unsafe paths into user-facing options. If this skill's QA rules or stop gates reject a path, filter it out and explain the blocker only when useful.

When asking the user, use the Claude Desktop native Interactive Inputs / Choice Prompts pattern from /clarification-first: recommended option first, short choices, and Custom answer last when a custom answer is plausible.

---

## Step 1 (required before using this skill): Put the rhythm on your calendar

Open Google Calendar / Outlook / Apple Reminders / whatever you actually look at every day. Create these as recurring events. Copy the titles and cadences exactly.

| Event title | Cadence |
|---|---|
| Cold email: Weekly Scheduled Review (automatable engine — see section below) | Every Monday, 8:30 am, before the manual tasks |
| Cold email: Monday deliverability audit | Every Monday, 9:00 am |
| Cold email: Wednesday positive-reply sweep | Every Wednesday, 10:00 am |
| Cold email: Friday campaign retrospectives | Every Friday, 3:00 pm |
| Cold email: Inbox rotation | Every other Monday, 11:00 am |
| Cold email: Monthly spam placement test | 1st of each month, 10:00 am |
| Cold email: Monthly TAM refresh + experiment proposal | 1st of each month, 11:00 am |
| Cold email: Quarterly experiment review | First Monday of each quarter, 1:00 pm |

**Do not skip Step 1.** The difference between hobbyist and top-1% cold email operators is that the top-1% operators actually run these tasks on their declared cadence, week after week. Your calendar is the accountability system. This skill doesn't have a built-in reminder — intentionally — because if it did and it broke, your ops would silently fail.

**Optional automation (fail-loud only).** The read-and-propose parts — the Monday audit read, the Wednesday positive-reply sweep, the warmed-capacity check, and the Monthly TAM refresh + experiment proposal — are consolidated into the **Weekly Scheduled Review** section below, runnable as a `/schedule` weekly routine (or on the always-on VPS later). Two rules keep this safe and resolve the silent-failure risk above: (1) the routine only **reads, scores, and proposes** — it never starts a send; every launch stays a human-approved paused draft; and (2) it must **fail loud** — alert (Slack/email) on a missed run, an errored run, or an empty proposal, so a dead routine can't masquerade as "all clear." Keep the manual calendar as the fallback; the routine is a convenience, not the system of record.

---

## Weekly Scheduled Review — the automatable read-and-decide engine

This is the consolidated, schedulable form of the read-and-propose spine of the manual tasks below (the Monday deliverability read, the Wednesday reply sweep, the Friday keep/scale/kill decision, and the Monthly TAM-refresh + experiment proposal), plus three pieces no other skill owns today: a **warmed-capacity check**, a **cross-campaign offer/copy-flop diagnosis**, and a **Scale sub-routine**. It runs **weekly** as a `/schedule` cloud routine, **sweeping every active client**, and lands a Slack digest plus per-client paused drafts. It is signal-first throughout: every campaign it proposes is a real signal slice, never invented targeting.

It does **not** replace the manual cadence below — that stays the system of record and the fallback. This engine just removes the weekly drudgery of the *reading and proposing*; the decisions it reaches are the same ones the manual Monday/Wednesday/Friday/Monthly steps reach, gathered into one run.

### Hard rules (what keeps it safe)

1. **Read-and-propose only — never sends.** Every launch and every scale-up ends at a **human-approved paused draft**. Pressing Start stays the one hard stop (per `/autonomous-execution-policy`).
2. **Fail loud.** A missed run, an errored run, or an empty proposal must alert (Slack/email). A dead routine must never masquerade as "all clear."
3. **Spend-gated.** Any TAM refresh or list enrichment it triggers routes through `/api-cost-governance` and respects `run_state.spend_ceiling_usd`. Within the ceiling it proceeds; over it, it stops and flags.
4. **Never re-asks recorded decisions.** It reads `run_state`, the activity-log, and memory before proposing, so it doesn't re-surface a settled choice (per `/autonomous-execution-policy`).
5. **Never picks a tool.** Every provider it routes to comes from the locked `run_state` and `<coldoutbound-skills>/stack-contract.yaml`. If a capability slot the run needs is empty, it fails loud and routes to `/stack-setup` instead of choosing a vendor. A scheduled run has no operator watching, so an invented provider is exactly the silent failure these rules exist to prevent.

### How it runs

- A `/schedule` weekly cloud routine invokes this skill in review mode. Written to be portable to the always-on VPS later with no change to the logic.
- It builds the **active-client set** from `profiles/*` — every client whose `client-profile.yaml` `run_state` shows launched/live campaigns (cross-checked against the locked sending platform's live campaign list via MCP).
- For each active client it runs the seven-step weekly run below, then emits that client's section of the Slack digest and writes `profiles/<client>/portfolio-review.md`.
- Read-only platform analytics are free; the only spend is an in-ceiling TAM refresh or per-slice enrichment it proposes and you approve.

### The weekly run (per client)

**Step 1 — Read state.** Load the activity-log CURRENT STATE, `run_state`, the prior `campaign-strategy.md`, `experiments/*.json`, `retrospectives/*.md`, and the client's `suppression-list.csv`. This is what prevents redoing finished work or re-proposing a killed slice.

**Step 2 — Inbox / reply check.** Run the reply scorer the stack contract names for the locked `run_state.sending_platform`, plus a master-inbox read. Classify everything that came in since the last run — `positive_interested` / `positive_soft` / `positive_referral` / `not_now` / `wrong_person` / `negative_hostile` / `bounce` — and **surface the ones that need a human**: every interested reply, every referral, every hostile. It **never auto-replies** (replying is a human action). Negative/unsubscribe/bounce feed the suppression loop as usual.

**Step 3 — Deliverability flags.** Read the trailing 7-day fleet reply rate and bounce rate (the Monday-audit signal). Flag any campaign under the 1% reply-rate rule and any inbox bouncing above 2%. A deliverability flag **blocks** any launch-new or scale proposal for the affected senders until it's cleared via `/deliverability-incident-response` — you don't pour volume onto a leaking fleet.

**Step 3b — Catch-all reintroduction (HARD RULE — runs EVERY week for EVERY campaign that has a holdback; operator directive 2026-06-26).** Catch-alls are held OUT of campaigns on young domains and reintroduced once the sending domains mature (see `/email-waterfall` → *Catch-All Timing*). **This skill is the standing owner + scheduler of that reintroduction** — launching a campaign valid-only automatically creates this obligation, and this step discharges it. It is **not optional and not skippable**: every weekly run, scan every active campaign for a per-campaign **holdback** of catch-alls (a non-empty `leads.catchall-holdback.csv`, or paused catch-all leads in the live campaign — the `profiles/_catchall-removal/` registry lists them). For each one:

1. **Compute maturity from real sending, not the draft date.** Read the campaign's **first-send date** + trailing reply and bounce stats from the locked platform's analytics. The gate clears when the campaign has **~2–3 weeks (≥14–21 days) of actual sending** AND **positive replies have come in** AND **bounce is healthy** (under the Step-3 threshold) AND there is **no open deliverability flag** for its senders.
2. **Gate not clear → HOLD** (domains still young, no positive replies yet, bounce hot, or a deliverability flag open). Re-check next week. Never reintroduce onto an unproven or flagged campaign.
3. **Gate clear → AUTO-PREPARE, then one-click approve (operator choice 2026-06-26).** Automatically pull the next **controlled slice** of the held catch-alls from the holdback (a slice at a time, not all at once), re-render/validate it against the campaign's current copy, and **stage it as a ready-to-go addition surfaced for a one-click approval in the weekly digest** (where the catch-alls sit paused inside the live campaign rather than held back in a file, stage a one-click *resume* of the next slice). Do **NOT** auto-send it live — consistent with this skill's Hard Rule #1 (read-and-propose; a human approves anything that goes live). A catch-all that already passed the email-verification step does **not** need re-verifying to come back; it was only timing-gated. After each approved slice, re-check bounce before staging the next.

This is precautionary reputation hygiene for young domains, NOT a bounce-cause claim — diagnose any actual bounce spike from the SMTP DSN reasons (`coldoutbound-bounce-diagnosis-doctrine`), never from a catch-all correlation. **Fail loud:** if a campaign has held catch-alls but the maturity read fails, alert rather than silently skipping.

**Step 4 — Capacity / "enough volume?" check.** See the capacity model below. Output one plain verdict per client: *room for N more leads/day → enough to launch one new campaign next week*, or *at capacity → scale a winner on the rested rotation half, or start a domain purchase (~2-week lead time)*.

**Step 5 — Next-move decision.** Two gates, then the diagnosis:
- **Gate A — TAM signal freshness.** Were the TAM's signal columns refreshed within ~30 days? If stale, propose a `/tam-build` refresh first (cost-gated) — fresh signals are required before generating new why-now slices **and** before scaling a why-now winner (job-change/funding/new-exec signals decay fastest).
- **Gate B — portfolio maturity (the "enough data to decide?" gate).** Count **mature** campaigns: live ≥21 days **and** ≥300 sends each. If **fewer than 3 mature campaigns across at least 2 distinct signals**, the portfolio is too thin to diagnose anything systemic — **skip the diagnosis and just propose the next new signal slice** (more coverage). This is the rule that stops a premature "the offer is dead" call when you've only launched a few campaigns.
- **Diagnosis (only when the portfolio is mature enough).** See the cross-campaign diagnosis below. It decides between **launch-new / scale / hold / diagnose-offer**, bounded by the Step-4 capacity verdict.

**Step 6 — Execute to paused drafts.**
- **Launch-new** routes through `/campaign-strategy` (next-wave signal slices, `[FL]` ≥100-company floor, offer + copy held constant) → the per-slice pipeline (`/lead-source-strategy` → `/email-waterfall` verify → `/list-quality-scorecard` → `/campaign-copywriting` → spintax → paused upload).
- **Scale** runs the Scale sub-routine below.
- **Diagnose-offer** routes to `/offer-intelligence` validation mode (Go / Iterate / Swap), and — because offer and copy are confounded under a constant-copy wave — also flags a copy re-check against `/campaign-copywriting` + `cold-email-copy-best-practices.md`.
- **Reintroduce catch-alls** (per Step 3b) for every campaign whose domains have matured: auto-prepare the next controlled slice from `leads.catchall-holdback.csv` (or the paused catch-all leads) and **stage it for one-click approval** in the digest — re-rendered against the campaign's current copy, ready to add/resume on approval. Never auto-sent. Re-check bounce after each approved slice before staging the next. This is the discharge of the standing reintroduction obligation that every valid-only launch created.
- **Hold** when capacity is full and nothing is a clear winner yet: keep running, re-read next week.

**Step 7 — Emit.** Write the client's `profiles/<client>/portfolio-review.md` entry (newest first) and add the client's section to the Slack digest. Update the activity-log per the protocol.

### Capacity model (the "enough volume?" check)

Compute, from the inbox tracker and the locked platform's analytics:

- **Total warmed daily capacity** = (count of healthy inboxes in the **active** rotation half, `Batch N.1` or `Batch N.2`, per the inbox manager for the locked sending platform) × each inbox's configured daily send limit. Only the sending half counts; the rested mirror half is warmed backup.
- **Current consumption** = daily sends across all live campaigns for the client.
- **Headroom** = total warmed daily capacity − current consumption.
- **Pool inventory** = ready-and-unassigned groups on the `/mailbox-pool-staging` DASHBOARD. Before recommending a domain purchase (the ~2-week wait), check whether a pre-warmed pool group already covers the need.

**Verdict:** a new campaign is launchable only if headroom can give it enough daily volume to reach its sample-size minimum within ~3–4 weeks (the same capacity-trim logic `/campaign-strategy` and `/experiment-design` use — a near-floor slice needs full daily volume and the 21-day run to be readable). If headroom is too thin: **don't launch new** — either **scale onto the rested rotation half** (the cheap capacity already warmed) or **start a domain purchase cycle** through the setup skill for `run_state.infrastructure_stack` (~2-week lead, so flag it early). The verdict is what bounds Step 5 — the engine never proposes more campaigns than the warmed fleet can actually carry.

### Cross-campaign offer/copy-flop diagnosis

This fires only when Gate B says the portfolio is mature enough. The inference is **licensed by Wave-1 design**: a coverage wave holds **offer and copy constant** while the **list/signal varies** across campaigns. So if **many campaigns across different signals are all below the client's established positive-reply baseline while deliverability is clean**, the failing factor is the **common** one — **offer or copy, not the list** (the lists differed).

Walk the same rule-out ladder `/offer-intelligence` already enforces, applied **across** the portfolio — do not shortcut to "offer":

1. **Open/deliverability** (open rate <20% or sub-1% reply with bounce/placement issues) → it's deliverability, not the offer → `/email-deliverability-audit` / `/deliverability-incident-response`.
2. **Bounce / wrong-person replies** high → list-quality problem, not the offer → fix lists first.
3. **Copy** fails `/spam-word-checker` or `cold-email-copy-best-practices.md` → copy problem → re-check copy.
4. **Only then, offer.** If deliverability, bounce, list, and copy are all clean and the flatness spans **≥3 mature campaigns over ≥2 distinct signals**, flag the **common factor = offer-or-copy** and route to `/offer-intelligence` validation **plus** a copy re-check (the constant-copy wave can't separate the two alone). Never call the offer broken below 300 sends per campaign.

A single individual dud campaign is **not** this trigger — that's the per-campaign Friday keep/iterate/kill path, and the existing per-campaign `/offer-intelligence` validation trigger (one campaign sub-1% after 300 sends). This cross-campaign diagnosis is specifically for *"the offer itself is flopping across the board."* Both the maturity floor and the distinct-signal count are sensible defaults — tune them in `client-profile.yaml` if a client's economics justify it.

### Scale sub-routine (owned here — the gap no other skill fills)

For a **winner** (positive-reply rate ≥2× the client's baseline, HIGH confidence per `/experiment-design`), scale it **without confounding the result** — offer and copy stay frozen:

1. **Re-check signal freshness** (Gate A) — a winner scaled a month later needs fresh signal rows, especially why-now signals.
2. **Expand the slice's list** — pull more enriched-TAM rows carrying the **same signal** (the same `[FL]` predicate), deduped against the `suppression-list.csv` and everyone already contacted, then run them through `/email-waterfall` (Layer-2 reveal + email verification) and `/list-quality-scorecard`. Same signal, more rows — not a new angle.
3. **Add sending capacity** — assign more warmed inboxes / raise daily volume within the Step-4 headroom, using the rested rotation half (the locked platform inbox manager's rotation tags) if the active half is maxed. Keep the 15-minute min-gap and warmup settings intact.
4. **Land a paused draft** — the scaled-up campaign is built and paused for your Start. Offer and copy unchanged, so the lift stays attributable to volume, not a hidden variable.

If there's no warmed headroom to scale into, the Scale move surfaces a **domain-purchase recommendation** instead (the ~2-week lead-time flag), rather than silently doing nothing.

### Outputs

**Slack digest** (per the reporting-channel setup for the locked sending platform): one weekly post, one section per active client, written in the plain, scannable style of `output-style-guide.md`:

- **What to launch next week** — the proposed new signal slice(s) or scale-ups, each with its signal, matching company count, and one-line rationale (or "hold — at capacity / not enough data yet").
- **Replies to handle** — counts of interested / referral / hostile, with the ones needing a human this week.
- **Deliverability flags** — any campaign under 1% or inbox over 2% bounce.
- **Capacity** — the plain "room for one more / at capacity" verdict.

**`profiles/<client>/portfolio-review.md`** — newest-first log, the audit trail behind the digest:

```markdown
## <YYYY-MM-DD> Weekly Review — <client>
- Portfolio maturity: <N mature campaigns / M signals>  → diagnosis run? <yes/no>
- Replies: <interested>/<referral>/<hostile>; needs-human: [...]
- Deliverability: <clean | flags: ...>
- Capacity: <headroom verdict>
- TAM signal freshness: <fresh | refreshed this run | refresh proposed>
- Decision: <launch-new | scale | both | hold | diagnose-offer>
- Routed to: <skills invoked> ; drafts created (paused): [...]
- Reasoning: <one or two lines>
```

---

## Monday — Deliverability audit (15 min)

**Run:**

```bash
/email-deliverability-audit over the last 7 days of send data
```

(If scoping the audit, pass the active campaign IDs to `/email-deliverability-audit` and state the scope in the report.)

**Review:**

- Fleet reply rate over last 7 days — must be >=1% (the 1% rule)
- Flagged campaigns (`flag_low_reply = TRUE`)
- Flagged inboxes (`flag_high_bounce = TRUE`)

**Action:**

- If any campaign failed the 1% rule: run `/deliverability-incident-response` → triage decision tree
- If bounce rate spiked above 2%: pause the offending campaign immediately, then triage
- If everything clean: log the check in a weekly journal, close the tab

---

## Wednesday — Positive-reply sweep (30-60 min depending on volume)

**Run:**

```bash
# Run only the reply-scoring skill the stack contract names for the locked
# run_state.sending_platform. No other platform's scorer runs.
/<reply-scoring skill for the locked sending platform>
```

**Review:**

- Any `positive_interested` or `positive_soft` replies — these are leads wanting to engage
- Any `positive_referral` replies — these are people saying "talk to Jane instead"
- Any `negative_hostile` replies — red flag, investigate

**Action:**

- Respond to every `positive_interested` reply within 30 seconds of seeing it. Do not batch these — a reply feeling like it took minutes to return converts 3x better than one that took hours.
- For referrals: reach out to the referred person within 24h, mention the referrer by name.
- For hostile: apologize, remove from all lists, investigate why they were flagged for hostility (often signals bad targeting).

**Time management:** if you have >50 positive replies per week, you're at the scale where you should hand off to a dedicated closer/AE. Do that handoff Wednesday morning so they can work replies by Wednesday afternoon.

---

## Friday — Campaign retrospectives (20 min per campaign)

**Identify campaigns hitting their 21-day mark this week.** (21 days is the minimum for reply-rate signal to stabilize.)

For each one:

1. Run the reply-scoring skill the stack contract names for locked `run_state.sending_platform`, scoped to this campaign (`--campaign-id=<id>`)
2. Compare to previous campaigns' positive reply rate baselines
3. Decide:
   - **Winner (positive reply rate >=2x-baseline):** keep running, consider scaling (clone to more inboxes)
   - **Middling (near baseline):** iterate on copy or list — run `/experiment-design` Monday to plan the next variant
   - **Loser (<50% of baseline):** kill it. Document why in the experiment log.

4. Log the result in `profiles/<business-slug>/experiments/<YYYY-MM-DD>-<campaign>.json`:
   - `positive_reply_rate`, `reply_rate`, `bounce_rate`
   - Your decision (keep / iterate / kill) + reasoning
   - Hypothesis for next iteration (if iterating)

**Critical:** do not skip the log. Over a quarter, these logs become the input for `/experiment-design` quarterly reviews. Without the history, you can't learn across campaigns.

---

## Every other Monday — Inbox rotation (30 min)

**Run:** the inbox health export/check inside the manager matching locked `run_state.sending_platform`.

**Review the CSV:**

- Any inboxes with reputation "bad"?
- Any inboxes with `is_warmup_blocked: true`?
- Any inboxes with <5 sends/day despite being in active campaigns?

**Action:**

- **Rotate the active mailbox-batch half (the core of this step).** Every client fleet is split into mirror halves `Batch N.1` / `Batch N.2` (see the locked platform inbox manager's Rotation batch tags). Swap which half is sending: move live campaigns onto the rested half and let the half that's been sending rest as warmed backup. Because the halves are balanced mirrors (same provider + Google/Microsoft mix), the swap is transparent to a campaign. This is what stops any mailbox or domain from being maxed. Do the swap by changing which `Batch N.x` tag the campaign's sender selection uses (re-attach senders in the locked platform manager) — never run both halves at once.
- Retire failing inboxes through the locked inbox manager.
- Remove retired inboxes from active campaigns.
- Keep warmup and sending settings consistent with the selected platform manager skill (both halves stay warmed even while one rests).

**If a rotation half is getting thin (failures leave <half the mirror healthy):** kick off a new domain purchase cycle using the setup skill selected by locked `run_state.infrastructure_stack`. It takes about 2 weeks from purchase to sendable, so you need to start early.

---

## Monthly (1st of the month) — Spam placement test (25 min active, test runs ~20 min)

**Run:** the spam-placement test available for the locked sending platform: its own native placement test where it has one, or an external inbox-placement tool where it does not.

**Review:**

- Overall inbox placement % — target: >=85%
- Spam filter triggers — which filters fired, which senders affected

**Action:**

- **>=90% inbox placement:** great. Keep doing what you're doing.
- **80-90%:** yellow. Look at spam-filter-details. Start fixing the highest-frequency trigger next week.
- **<80%:** red. Pause the campaign, run `/deliverability-incident-response`, fix before sending more.

---

## Monthly (1st) — TAM refresh + experiment proposal (20 min)

**Run:**

- `/tam-build` refresh — re-collect the catalog's volatile `collect_now` signals (running ads, hiring, pricing changes, new case studies) and add new companies; cost-gated by `/api-cost-governance` (refresh re-crawls only the volatile signals, not the whole set — the full obtainable set was already collected at build time per the Collection Completeness rule). Collect any genuinely-new `in_reserve` point (a newly-obtainable signal, or one an approved experiment needs) when it appears. Stable firmographics refresh quarterly, not monthly.
- `/experiment-design` Generative Proposal Mode — mine the refreshed `tam/tam.csv` plus `experiments/*.json` for ranked, data-grounded experiment candidates for the next wave.

**Review:** the proposed experiment candidates (recommended first), with TAM row counts.

**Action:** approve the next wave's experiments (human gate — nothing sends automatically), then run each approved slice through the full per-slice pipeline — `/icp-prompt-builder` → `/email-waterfall` (Layer-2 contact reveal + verification on that slice) → `/list-quality-scorecard` → **then** `/campaign-copywriting` → spintax → paused upload. The verified-list gate (`verified-list-gate.md`) requires the slice be verified before any copy, so copy comes after `/email-waterfall`, never before. Decline or reshape any candidate whose slice is too thin per the sample-size table in `/experiment-design`.

This is the self-improving loop: refreshed data in, ranked next-round experiments out, human approves, paused drafts created.

---

## Quarterly (first Monday of each quarter) — Experiment review (90 min)

Read all `experiments/*.json` from the last quarter. Identify patterns:

- Which campaigns had the highest positive reply rate?
- Which list sources produced the best leads?
- Which copy angles resonated (Observation → Implication? Pain? Social proof?)
- Which ICP archetypes converted best?

**Output:** a 1-page Q<N> retrospective saved to `profiles/<business-slug>/retrospectives/<YYYY>-Q<N>.md` with:

- Top 3 campaigns + what made them work
- Bottom 3 campaigns + what to avoid
- 3-5 hypotheses for next quarter's experiments
- Adjust ICP in `client-profile.yaml` if the data suggests a different segment performs better

Use the retrospective as input to design next quarter's experiments via `/experiment-design`.

---

## What to skip

You do NOT need to:

- Check the sending platform every day (Wednesday sweep catches everything important)
- Obsess over daily reply-rate fluctuations (wait for 7-day averages)
- Read every positive reply in real time — set up notifications if you want immediacy, but the Wednesday sweep is the system

Daily pokes at your cold email stack are a procrastination pattern, not a performance pattern.

---

## What to do next

This skill IS the loop. Your next action is the next calendar event on your list — or, if the **Weekly Scheduled Review** routine is set up, read its Monday digest and approve (or decline) the paused drafts it proposed.

**Or if you haven't run a campaign yet:** skip this skill entirely. Come back after your first campaign hits the 7-day mark.

## Related skills

- `/email-deliverability-audit` — the Monday and Monthly tasks; the Weekly Scheduled Review's deliverability-flags step
- The reply-scoring skill for the locked sending platform: the Wednesday and Friday tasks, and the Review's inbox/reply-check step
- The inbox manager for the locked sending platform: selected by locked `run_state.sending_platform` for biweekly sender rotation, the Review's capacity model, and the Scale sub-routine's added inboxes
- `/deliverability-incident-response` — when the Monday audit (or the Review's deliverability flags) flags something
- `/campaign-strategy` — the Weekly Scheduled Review's launch-new route; slices the enriched TAM into the next signal-first wave
- `/offer-intelligence` — the Review's diagnose-offer route (validation mode, Go / Iterate / Swap) when a flop spans multiple campaigns
- `/email-waterfall`, `/list-quality-scorecard` — the per-slice verify + QA the Review's launch-new and Scale routes run before copy
- `/experiment-design` — the quarterly retrospective and the Monthly proposal feed into this (Generative Proposal Mode); the Review uses its sample-size minimums and confidence weighting
- `/tam-build` — the Monthly TAM refresh re-crawls company-level signals; the Review's Gate A freshness check triggers it when signals are stale
- The reporting-channel setup for the locked sending platform: where the Weekly Scheduled Review posts its digest
- `/schedule` — runs the Weekly Scheduled Review as a weekly cloud routine (VPS-portable later)
- `/api-cost-governance`, `/autonomous-execution-policy` — the spend gate and the proceed-vs-stop / never-re-ask / fail-loud rules the Review defers to
- The domain + inbox setup skill the stack contract names for the locked registrar + mailbox-provider pairing - used when the insurance pool runs low

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short — record status, not raw output. Full protocol: `client-activity-log.md`.
