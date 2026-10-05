---
name: cold-email-weekly-rhythm
description: The weekly operating cadence and scheduled review engine for live cold email. It sweeps every active client's replies, deliverability and capacity, then proposes the next move as paused drafts. Read-and-propose only, never sends. Use once a campaign is live, or for the weekly /schedule review.
---

# Cold Email Weekly Rhythm

**From the former description:** It is both the operational playbook (the manual Monday / Wednesday / Friday / biweekly / monthly / quarterly cadence) and the automatable weekly engine the weekly /schedule routine invokes. The scheduled review reads inboxes and replies, checks deliverability and warmed sending capacity, then decides the next move (launch a new signal-first campaign, scale a winner, hold, or diagnose a flopping offer across campaigns) and lands human-approved paused drafts. It fails loud. What separates hobbyist from top 1% operators isn't tooling. It's consistency.

## Canonical Profile Root

All profiles/<business-slug> paths in this skill resolve under:

```text
<outbound>/profiles
```

Here `<outbound>` is the root of this skill library - resolve it to wherever the library is currently checked out (local Documents, OneDrive, or a git worktree); never hardcode an absolute path. Do not create client profiles under a `profiles/` folder at your current working directory.

Having 29 cold email skills doesn't help if you don't run them on a schedule. This is that schedule, and now also the automatable engine that can run the read-and-decide half of it for you.

**Two layers.** (1) A **manual playbook**: you put the rhythm on your own calendar (Step 1 below) and run the prescribed skill at the prescribed time. (2) An **automatable Weekly Scheduled Review** (its own section below): a scheduled run that does the *reading, scoring, and proposing* across every active client and lands paused drafts for you to approve. The playbook stays the system of record and the fallback; the scheduled review removes the weekly drudgery without ever sending on its own. Both layers are the same skill: the review section is just the manual cadence's read-and-propose spine, consolidated and made schedulable.

## Material Decision Rule

When this skill reaches a material fork, name the realistic options, recommend the strongest path, and explain why the main alternatives are weaker before committing.

Ask before choices that affect spend beyond an approved budget, provider routing, source of truth, list quality, campaign direction, client-facing output, live systems, scraping or account risk, or legal/compliance risk. For low-risk reversible choices, state the recommendation and proceed.

Do not turn untrue, unsafe or non-compliant paths into user-facing options. Offer candidates, ICP segments and test arms are never hidden for effort, capacity or "the client may not want it" reasons: they stay visible with their label and the reason they rank where they do (operator directive 2026-09-22).

When asking the user, use the Claude Desktop native Interactive Inputs / Choice Prompts pattern from /clarification-first: recommended option first, short choices, and Custom answer last when a custom answer is plausible.

---

## Step 1 (required before using this skill): Put the rhythm on your calendar

Open Google Calendar / Outlook / Apple Reminders / whatever you actually look at every day. Create these as recurring events. Copy the titles and cadences exactly.

| Event title | Cadence |
|---|---|
| Cold email: Weekly Scheduled Review (automatable engine, see section below) | Every Monday, 8:30 am, before the manual tasks |
| Cold email: Monday deliverability audit | Every Monday, 9:00 am |
| Cold email: interested-reply sweep (speed to lead, until the webhook receiver exists; see section below) | Several times a day, Monday to Friday |
| Cold email: first-week daily read (after every launch) | Every sending day of the first week after a launch |
| Cold email: Wednesday positive-reply catch-up sweep | Every Wednesday, 10:00 am |
| Cold email: Friday campaign retrospectives | Every Friday, 3:00 pm |
| Cold email: Inbox rotation | Every other Monday, 11:00 am |
| Cold email: market feedback (`/market-evidence` feedback; see Weekly Scheduled Review Step 5) | Every other Monday while a wave is live, plus at each arm read (dormant until the sending platform is live) |
| Cold email: Monthly PlusVibe placement test | 1st of each month, 10:00 am |
| Cold email: Monthly TAM refresh + experiment proposal | 1st of each month, 11:00 am |
| Cold email: Quarterly experiment review | First Monday of each quarter, 1:00 pm |

**Do not skip Step 1.** The difference between hobbyist and top-1% cold email operators is that the top-1% operators actually run these tasks on their declared cadence, week after week. Your calendar is the accountability system. This skill doesn't have a built-in reminder (intentionally) because if it did and it broke, your ops would silently fail.

**Optional automation (fail-loud only).** The read-and-propose parts (the Monday audit read, the Wednesday positive-reply sweep, the warmed-capacity check, and the Monthly TAM refresh + experiment proposal) are consolidated into the **Weekly Scheduled Review** section below, runnable as a `/schedule` weekly routine (or on the always-on VPS later). Two rules keep this safe and resolve the silent-failure risk above: (1) the routine only **reads, scores, and proposes**: it never starts a send; every launch stays a human-approved paused draft; and (2) it must **fail loud**: alert (Slack/email) on a missed run, an errored run, or an empty proposal, so a dead routine can't masquerade as "all clear." Keep the manual calendar as the fallback; the routine is a convenience, not the system of record.

**Reconciling this cadence with Eric's health-check rhythm (`eric-deliverability-doctrine.md`).** His described rhythm is daily spam checks, weekly reply-rate reviews, seed tests, and forwarding tests. The cadence above already covers the reply-rate review (the Monday deliverability audit reads the trailing 7-day fleet reply rate), and it does run a spam-placement check, but **monthly rather than daily**. The real gaps are **seed tests and forwarding tests**: no step above runs either one. Carry the doctrine's reconciliation with any of these you add. They are legitimate as **infrastructure diagnostics** (is the sending layer healthy?) and not as a **campaign report card** (did this campaign perform?), which is why running them here does not contradict refusing to judge a campaign by its placement score or bounce rate. This note names what the cadence covers and what it misses. It does not change the cadence above.

---

## Weekly Scheduled Review: the automatable read-and-decide engine

This is the consolidated, schedulable form of the read-and-propose spine of the manual tasks below (the Monday deliverability read, the Wednesday reply sweep, the Friday keep/scale/kill decision, and the Monthly TAM-refresh + experiment proposal), plus three pieces no other skill owns today: a **warmed-capacity check**, a **cross-campaign offer/copy-flop diagnosis**, and a **Scale sub-routine**. It runs **weekly** as a `/schedule` cloud routine, **sweeping every active client**, and lands a Slack digest plus per-client paused drafts. It is signal-first throughout: every campaign it proposes is a real signal slice, never invented targeting.

It does **not** replace the manual cadence below. That stays the system of record and the fallback. This engine just removes the weekly drudgery of the *reading and proposing*; the decisions it reaches are the same ones the manual Monday/Wednesday/Friday/Monthly steps reach, gathered into one run.

### Hard rules (what keeps it safe)

1. **Read-and-propose only: never sends.** Every launch and every scale-up ends at a **human-approved paused draft**. Pressing Start stays the one hard stop (per `/autonomous-execution-policy`).
2. **Fail loud.** A missed run, an errored run, or an empty proposal must alert (Slack/email). A dead routine must never masquerade as "all clear."
3. **Spend-gated.** Any TAM refresh or list enrichment it triggers routes through `/api-cost-governance` and respects `run_state.spend_ceiling_usd`. Within the ceiling it proceeds; over it, it stops and flags.
4. **Never re-asks recorded decisions.** It reads `run_state`, the activity-log, and memory before proposing, so it doesn't re-surface a settled choice (per `/autonomous-execution-policy`).
5. **Never picks a tool.** Every provider it routes to comes from the locked `run_state` and `<outbound>/stack-contract.yaml`. If a capability slot the run needs is empty, it fails loud and routes to `/stack-setup` instead of choosing a vendor. It never substitutes one tool for another either: a tool that is out of balance, down or switched off stops that client's spend step and asks the operator (`/tool-balance-guard`; a skip is valid only with `--operator-approved-skip` recorded, operator decision 2026-09-28). A scheduled run has no operator watching, so an invented provider is exactly the silent failure these rules exist to prevent.

### How it runs

- A `/schedule` weekly cloud routine invokes this skill in review mode. Written to be portable to the always-on VPS later with no change to the logic.
- It builds the **active-client set** from `profiles/*`: every client whose `client-profile.yaml` `run_state` shows launched/live campaigns (cross-checked against the locked sending platform's live campaign list via MCP).
- It opens with `python outbound/scripts/phase_state.py board` (`phase-protocol.md`). A client still inside one of the four phases (1 Onboarding, 2 Research and Offer, 3 List, 4 Copy and Launch) is not in the active set: its phase tracker, not this loop, owns its next step, and the digest lists it with its phase and next step in one line. The weekly loop takes a client over once the operator has pressed Start.
- For each active client it runs the seven-step weekly run below, then emits that client's section of the Slack digest and writes `profiles/<client>/portfolio-review.md`.
- Read-only platform analytics are free; the only spend is a TAM refresh or per-slice enrichment, which runs inside the client's standing \$100 run budget without asking. Anything that would go over the budget is proposed for your approval instead.

### The weekly run (per client)

**Step 1: Read state.** Load the activity-log CURRENT STATE, `run_state`, the prior `campaign-strategy.md`, `experiments/*.json`, `retrospectives/*.md`, and the client's `suppression-list.csv`. This is what prevents redoing finished work or re-proposing a killed slice.

Also read the client intel feed, `profiles/<slug>/client-intel.md` (Needs attention and Open items in full, and Recent activity across every tag, since this run is a report), and the intel sync's run digests from the last 7 days (location per `client-intel-feed.md`). What a client said in a meeting or Slack is a hypothesis: it never overwrites `run_state` or a recorded decision, and a conflict is raised for the operator in the client's section of the Slack digest (under `auto_execute`, a conflict touching offer, list, copy or launch holds that client's proposal and asks). A missing feed, or one more than 2 days old (the newer of the client's own refresh stamp, `clients.<slug>.refreshed_at`, and the global `last_run_at` in `profiles/_intel/state.json`; `client-intel-feed.md` section 8), is a one-line flag at the top of the client's digest section, not a blocker (offer `/client-intel-sync <client>` when a launch or scale proposal depends on it). Protocol: `client-intel-feed.md`.

Also list each client's pending offer approvals (Offer Readiness, operator decision 2026-09-28; `outbound/reference/offer-readiness.md`). When the client has an Aaron-lane offer block, run `python outbound/scripts/offer-readiness/build_readiness.py <client-dir>` and copy the "Pending approvals and nudges" part of `offers/_readiness-board.md` into that client's digest section: each arm whose ask (the sent message in `client-asks.md` that carried its `[offer-<rank>]` item, `client-messages.md`) is 48 or more hours old, with its one-line nudge draft for the operator to send, or "ask not sent, no clock" when it was never sent. Nothing is sent automatically, silence never counts as a yes, and the intel feed never sets `yes`: only `offer_approval.py`, with evidence, records a client approval. Any new ask this run raises for the client (a capacity answer, a scale-review question) is merged into the client's one unsent `profiles/<slug>/client-asks.md` under `client-messages.md`, never sent by this skill.

**Step 2: Inbox / reply check.** Run the reply-scoring skill for the locked `run_state.sending_platform`, if `/stack-setup` activated a pack that provides one, plus a master-inbox read. If no pack is active, read that platform's own reply export and master inbox directly and classify with `reply-scoring-core.md`; if neither can be read, say so and fail loud rather than reporting "no replies". Classify everything that came in since the last run (`positive_interested` / `positive_soft` / `positive_referral` / `not_now` / `wrong_person` / `negative_hostile` / `bounce`) and **surface the ones that need a human**: every interested reply, every referral, every hostile, and **every positive still unanswered** (all three positive classes with no human reply yet), time-agreed first, each with the minutes since it arrived. List all of them, never a top-N cut (Aaron process alignment, operator directive 2026-09-22). Also tag each positive reply whose thread moves toward a time as **time-agreed** (the magnet-inflation guard's sending-platform proxy, `/campaign-strategy`), because winner picks and scaling are judged on it (operator-approved Aaron alignment, 2026-09-21; doctrine §0, §2 step 5). Beside it, report **`meeting_book_rate`** exactly as `reply-scoring-core.md` defines it (meetings booked / positive replies), counting bookings from the client's booking calendar or CRM when one is readable, otherwise from the operator's reported count, and say which. When neither source exists, report it as "not measured" with the reason, never a count inferred from threads, because a thread cannot see a phone booking (Aaron process alignment, operator directive 2026-09-22). It measures reply handling, not offer demand, so it never replaces time-agreed replies per 1,000 first touches for picking arms. Then run the **speed-to-lead audit**: for every positive, the minutes from its reply to the first human reply (from the thread) and, on a direct, trial or service offer, to the first call (from the call log or CRM, or operator-reported), against the 5-minute target, with every miss listed. This audit checks the response path; it is not the response path (**Speed to lead**, below, is). It **never auto-replies** (replying is a human action). This step is the weekly catch-up, so any interested reply found here without a human touch is a speed-to-lead miss to report. Negative/unsubscribe/bounce feed the suppression loop as usual.

**Step 3: Deliverability flags.** Read the trailing 7-day fleet reply rate and bounce rate (the Monday-audit signal). Flag any campaign under the 1% reply-rate rule and any inbox bouncing above 2%. Beside bounce, report the **complaint proxy**: `hostile_per_1000` (hostile replies per 1,000 sends, `reply-scoring-core.md`), since M365 senders give no Postmaster complaint data (Aaron flow (see aaron-flow.md), section 10). There is no house threshold yet; report the number and its trend. Also read the **mailbox age clock** (below) for any domain crossing into the ~45-sending-day band. A deliverability flag **blocks** any launch-new or scale proposal for the affected senders until it's cleared via `/deliverability-incident-response`, because you don't pour volume onto a leaking fleet.

**Step 3b: Catch-all reintroduction (HARD RULE: runs EVERY week for EVERY campaign that has a holdback; operator directive 2026-06-26).** Catch-alls are held OUT of campaigns on young domains and reintroduced once the sending domains mature (see `/email-waterfall` → *Catch-All Timing*). **This skill is the standing owner + scheduler of that reintroduction**. Launching a campaign valid-only automatically creates this obligation, and this step discharges it. It is **not optional and not skippable**: every weekly run, scan every active campaign for a per-campaign **holdback** of catch-alls (a non-empty `leads.catchall-holdback.csv`, or paused catch-all leads in the live campaign: the `profiles/_catchall-removal/` registry lists them). For each one:

1. **Compute maturity from real sending, not the draft date.** Read the campaign's **first-send date** + trailing reply and bounce stats from the locked platform's analytics. The gate clears when the campaign has **~2–3 weeks (≥14–21 days) of actual sending** AND **positive replies have come in** AND **bounce is healthy** (under the Step-3 threshold) AND there is **no open deliverability flag** for its senders.
2. **Gate not clear → HOLD** (domains still young, no positive replies yet, bounce hot, or a deliverability flag open). Re-check next week. Never reintroduce onto an unproven or flagged campaign.
3. **Gate clear → AUTO-PREPARE, then one-click approve (operator choice 2026-06-26).** Automatically pull the next **controlled slice** of the held catch-alls from the holdback (a slice at a time, not all at once), re-render/validate it against the campaign's current copy, and **stage it as a ready-to-go addition surfaced for a one-click approval in the weekly digest** (where the catch-alls sit paused inside the live campaign rather than held back in a file, stage a one-click *resume* of the next slice). Do **NOT** auto-send it live, consistent with this skill's Hard Rule #1 (read-and-propose; a human approves anything that goes live). A catch-all that already passed the email-verification step does **not** need re-verifying to come back; it was only timing-gated. After each approved slice, re-check bounce before staging the next.

This is precautionary reputation hygiene for young domains, NOT a bounce-cause claim: diagnose any actual bounce spike from the SMTP DSN reasons, never from a catch-all correlation. **Fail loud:** if a campaign has held catch-alls but the maturity read fails, alert rather than silently skipping.

**Step 4: Capacity / "enough volume?" check.** See the capacity model below. Output one plain verdict per client: *room for N more leads/day → enough to launch one new campaign next week*, or *at capacity → scale a winner on the rested rotation half, or propose a domain purchase for the operator's approval (~2-week lead time)*. The first wave and the winner's scale-up are never trimmed to this verdict: they run at the allocated rate and the runway stretches (capacity model below).

**Step 5: Next-move decision.** Two gates, then the diagnosis:
- **Gate A: TAM signal freshness.** Were the TAM's signal columns refreshed within ~30 days? If stale, propose a `/tam-build` refresh first (cost-gated). Fresh signals are required before generating new why-now slices **and** before scaling a why-now winner (job-change/funding/new-exec signals decay fastest).
- **Gate B: portfolio maturity (the "enough data to decide?" gate).** Count **mature** campaigns: ≥300 first-touch sends each (the raw-reply readability floor, unchanged) **and** the sequence plus a few days of grace has run on those sends, about 7 to 10 days from the 300th contact's first touch (Aaron process alignment, operator directive 2026-09-22; supersedes "live ≥21 days", house). If **fewer than 3 mature campaigns across at least 2 distinct signals**, the portfolio is too thin to diagnose anything systemic, so **skip the diagnosis. The default next move is more volume on the current winner and its positioning variants** (the rest of its TAM rows, then a widening on the `/tam-build` expansion-for-volume ladder, filter-first: count and filter the company universe before any lookalike seeding, which is an exception, operator decision 2026-09-28) **before proposing a new signal slice** (Aaron process alignment, operator directive 2026-09-22; supersedes "just propose the next new signal slice"; Aaron, Feb 23: with replies low he pushed volume and kept iterating). With no winner picked yet, the move is to keep the offer test sending toward its floor. This is the rule that stops a premature "the offer is dead" call when you've only launched a few campaigns.
- **Diagnosis (only when the portfolio is mature enough).** See the cross-campaign diagnosis below. It decides between **launch-new / scale / hold / diagnose-offer**, bounded by the Step-4 capacity verdict.
- **Offer-Validation Wave read (while `run_state.offer_market_proven` is false; per segment when the client has per-buyer-type offer sets).** Read `/campaign-strategy`'s flip criterion per arm on pooled positive replies (PROVEN / DEAD / HOLD), never pooled across arms, with each arm pooled across the segments it runs in; report each arm's cells by segment and compare offers only on shared ground, the segments where both run (each offer runs in every first-wave segment it fits, its own fit filters deciding, not across every segment; operator decision 2026-09-23, replaces the offer x segment matrix). **Read timing:** an arm is read once it has reached its ~1,300 first-touch floor AND its last contacts have had the 2-email sequence plus a few days of grace (about 7 to 10 days from their first touch). Never read early because a window passed (Aaron process alignment, operator directive 2026-09-22; supersedes the fixed ~21-day window; `/experiment-design` Step 6). In the first week after a launch, read daily for bounce, deliverability and reply handling only, never for an arm call. Report time-agreed replies per 1,000 first touches beside the positive-reply rate for every arm, with `meeting_book_rate` (Step 2) beside them; among PROVEN arms, propose as winner the one that does not lose on time-agreed replies per 1,000, picked at matched cell counts on shared ground (an offer alone in a segment is judged there only against the PROVEN and DEAD lines), and label a PROVEN arm whose time-agreed replies are zero or clearly lag the other arms as farming interest (judged against the other arms; the operator confirms): not scaled, routed to reshape the offer so it filters better, not killed. **Losers go off two ways only:** propose deactivating a DEAD arm, and propose the winner-pick retirement: at the winner pick (made on matched cell counts on shared ground), arms still in HOLD stop receiving new first touches, their live sequences finish, the untouched rows the winner fits go to it (rows it does not fit go to the strongest offer that fits them, per `/campaign-strategy`), and the parked arm's read is recorded as unresolved (in `offer.validation_arms[].read`) so it can return as a later test (Aaron process alignment, operator directive 2026-09-22; supersedes 'another arm's win never retires it'). Never propose a cut because an arm trails the leader by a ratio at the floor. With per-buyer-type offer sets, each segment is read, picks its winner and is retired on its own; a segment never borrows another segment's winner. This read is not the Gate B maturity diagnosis, which is for coverage waves (operator-approved Aaron alignment, 2026-09-21).
- **Market feedback: the research side of every read** (`/market-evidence` feedback, `market-evidence-standard.md` section 14; added 2026-09-24). **Dormant until the sending platform is live:** it runs only once `run_state.sending_platform` is set, that tool's slot in `stack-contract.yaml` is `status: live`, and a wave is actually sending. Until then it is skipped and reported as dormant, never as "no replies". Once live, run it at each arm read, and in any weekly run where a wave is live and 14 days have passed since the later of the wave's first send and `research_artifacts.last_feedback` (which is null before the first run). The replies come from the same read Step 2 already does (the reply-scoring pack for the locked `run_state.sending_platform` when `/stack-setup` activated one, otherwise that platform's own reply surface and native reply export, classified with `reply-scoring-core.md`), so it needs no separate integration. Every human reply since the last run, plus any call notes the client shared, becomes a strong-tier evidence row tagged with its objection, competitor mentioned, timing reason, desired outcome, question and any unexpected use. The clusters are re-synthesized, the arms gain `feedback_ids` and a one-line `feedback_summary`, and a dated results review lands in the Market feedback log of `_research/pain-clusters.md`. It writes research and evidence records only (the evidence ledger, `pain-clusters.md`, the evidence lines in `lead-magnets.md`, the arms' `feedback_ids` and `feedback_summary`, and `research_artifacts`), never a campaign, so it stays inside Hard Rule 1. It never moves the flip, never touches an arm's `status`, `read` or `flight`, and never makes the winner pick: this skill owns all of those. It is never a scale gate either, so the winner still scales at once. Its routed recommendations (standard section 14) go to their owning skills. With per-buyer-type offer sets, each segment's arms get their own feedback lines.
- **The winner scales at once; the scale review is a results report** (Aaron process alignment, operator directive 2026-09-22; supersedes the scale review as a volume gate and the coverage wave sized to the client's scale-review answer, operator directive 2026-09-22). When the read picks a winner, propose the retirement above and **Scale** in Step 6 the same week, with positioning variants of the winner starting inside the big campaigns (`/experiment-design`). Run `/offer-test-slate` in scale-review mode alongside it, never ahead of it: it reports the results to the client and reviews the offer's qualification rule (`offer.qualification`), and the client's capacity answer sets how many qualified yeses get the free unit each week while the rest get the standard offer. **Carve-out:** where the client literally supplies the deliverable (their trial seats, their people, their stock), a qualification step cannot create capacity the client does not have, so the client's confirmed capacity still caps sends for that offer. With per-buyer-type offer sets, each segment scales its own winner and gets its own results report (`offer.segments[].scale_review`). When every arm is switched off, the scale review still reports the results and the move is Diagnose-offer. Propose **Start next offer flight** in Step 6 only for queued arms beyond the first wave's offer count (`max(3, floor(qualified_contacts / 2000))`, per segment when the client has per-buyer-type offer sets) and parked arms brought back as a later test, when they can send (`lead_magnet_client_ok` is `not_needed` or `yes`). An arm still pending the client's answer is not dropped: it is drafted like any other (copy with no unconfirmed claim, list, paused campaign) and held at Start until the client says yes; a `no` or vetoed arm is never built (Offer Readiness, operator decision 2026-09-28; `outbound/reference/offer-readiness.md`).

**Step 6: Execute to paused drafts.**
- **Launch-new** routes through `/campaign-strategy` (next-wave signal slices, `[FL]` ≥500-company floor (HARD RULE, operator directive 2026-07-12), offer + copy held constant) → the per-slice pipeline (`/lead-source-strategy` → `/email-waterfall` verify → `/list-quality-scorecard` → `/campaign-copywriting` → spintax → paused upload).
- **Start next offer flight** routes through `/campaign-strategy`. The first wave already covers the whole qualified TAM, so a flight exists only for arms beyond the first wave's offer count, parked arms brought back, and later positioning tests (Aaron process alignment, operator directive 2026-09-22). Those arms that can send run as offer-only cells against the current winner as control, fed from uncontacted TAM rows first and a widening on the `/tam-build` expansion-for-volume ladder when none remain, then the per-slice pipeline as in Launch-new. Re-render the client slate (`/offer-test-slate`) when a flight starts.
- **Scale** of the offer-test winner is the retirement in Step 5 (the untouched rows the winner fits go to the winner in the big campaigns, and rows it does not fit go to the strongest offer that fits them, per `/campaign-strategy`; with its positioning variants as in-campaign Email 1 variants, one variable each, `/experiment-design`). Scale of a winning signal slice runs the Scale sub-routine below.
- **Diagnose-offer** routes to `/offer-intelligence` validation mode (Go / Iterate / Swap), and, because offer and copy are confounded under a constant-copy wave, also flags a copy re-check against `/campaign-copywriting` + `cold-email-copy-best-practices.md`. `/market-evidence` feedback's routing rules (`market-evidence-standard.md` section 14) can also open this validation route, from what replies say rather than from rates: a top cluster contradicted by 3 or more replies, `already_have` 3 or more times on one arm, or `confusion` 3 or more times. A validation run opened either way proposes; the arm reads, the flip and the winner pick stay with this skill.
- **Reintroduce catch-alls** (per Step 3b) for every campaign whose domains have matured: auto-prepare the next controlled slice from `leads.catchall-holdback.csv` (or the paused catch-all leads) and **stage it for one-click approval** in the digest, re-rendered against the campaign's current copy, ready to add/resume on approval. Never auto-sent. Re-check bounce after each approved slice before staging the next. This is the discharge of the standing reintroduction obligation that every valid-only launch created.
- **Hold** when capacity is full and nothing is a clear winner yet: keep running, re-read next week.

**Step 7: Emit.** Write the client's `profiles/<client>/portfolio-review.md` entry (newest first) and add the client's section to the Slack digest. Update the activity-log per the protocol.

### Capacity model (the "enough volume?" check)

Compute, from the inbox tracker and the locked platform's analytics:

- **Total warmed daily capacity** = (count of healthy inboxes in the **active** rotation half, `Batch N.1` or `Batch N.2`, per the inbox manager for the locked sending platform) × each inbox's configured daily send limit. Only the sending half counts; the rested mirror half is warmed backup.
- **Current consumption** = daily sends across all live campaigns for the client.
- **Headroom** = total warmed daily capacity − current consumption.
- **Pool inventory** = ready-and-unassigned groups on the `/mailbox-pool-staging` DASHBOARD. Before recommending a domain purchase (the ~2-week wait), check whether a pre-warmed pool group already covers the need.

**Verdict:** a new signal slice is launchable only if headroom can give it enough daily volume to reach its sample-size minimum within ~3–4 weeks (a near-floor slice needs full daily volume, and its read waits for the floor, then the sequence plus grace, `/experiment-design` Step 6). The first wave and the winner's scale-up are never trimmed to headroom. Capacity is sized to the volume, never trimmed (Aaron process alignment, operator directive 2026-09-22; supersedes the capacity trim at launch). If the fleet delivers less than `daily_sends_needed`, the wave still covers the whole TAM at the allocated rate and the runway stretches; report days to cover (in Monday-to-Friday sending days, against `run_state.capacity_request`: `daily_sends_needed` vs `allocated_daily_sends`). Offers and TAM rows are never cut to fit. Put any shortfall to the operator as a capacity request: size the fleet to the request through `/mailbox-mix-strategy`, or assign a ready pre-warmed group from `/mailbox-pool-staging`, and any mailbox purchase needs the operator's approval of the setup total (outside the \$100 run budget). If headroom is too thin for a new slice: **don't launch new**. Either **scale onto the rested rotation half** (the cheap capacity already warmed) or **propose a domain purchase cycle** through the setup skill for `run_state.infrastructure_stack` for the operator's approval (~2-week lead, so flag it early). The verdict is what bounds Step 5: the engine never proposes more new signal slices than the warmed fleet can actually carry.

### Mailbox age clock (Aaron flow (see aaron-flow.md), section 10)

Track every mailbox and domain by **sending days actually used**, not calendar days: a day only counts if the inbox sent on it. Roll this up by domain and by rotation batch (oldest and median sending-days-in-use, plus a count in each band), reading from whichever source is available, in this order: the locked sending platform's own account-age/sending stats first, then `/mailbox-mix-strategy`'s central tracker, then the rotation-swap log, then a manual derivation from the first-send date and the inbox's pause history as the last resort.

- **Under ~45 sending days:** healthy, no action.
- **~45 sending days:** order and warm the replacement batch now (`/mailbox-mix-strategy`), so the new batch is ready before the old one needs retiring. This is a recommendation only, never an auto-buy: nothing is purchased without the operator's approval of the infrastructure setup.
- **~60-90 sending days:** retire the batch (rotate it out of active sending). Retire sooner than the band if a health flag (bounce, the complaint proxy, or a failed placement test) hits that batch first; a health flag always overrides the age clock.

Report the roll-up in Step 3, the Monday audit, and the Outputs digest (below), beside bounce and the complaint proxy. This clock tracks infrastructure age, not campaign performance, so it never substitutes for the deliverability-flag or placement-test checks above.

### Cross-campaign offer/copy-flop diagnosis

This fires only when Gate B says the portfolio is mature enough. The inference is **licensed by Wave-1 design**: a coverage wave holds **offer and copy constant** while the **list/signal varies** across campaigns (positioning variants of the winner, when running, are the same variant set in every big campaign, so they stay part of the common factor). So if **many campaigns across different signals are all below the client's established positive-reply baseline while deliverability is clean**, the failing factor is the **common** one: **offer or copy, not the list** (the lists differed).

Walk the same rule-out ladder `/offer-intelligence` already enforces, applied **across** the portfolio. Do not shortcut to "offer":

1. **Deliverability, on a trigger only** (operator-approved Aaron alignment, 2026-09-21): bounce above the Step 3 threshold, a placement-test flag (a trigger to investigate, never decisive alone), a reply rate near 0.1%, or contacts-per-positive jumping → it's deliverability, not the offer → `/email-deliverability-audit` / `/deliverability-incident-response`. Open rate is never this trigger: opens are not tracked here (open tracking stays off on the sending platform), so it reads 0% (doctrine §9, "Don't track opens"; Eric agrees). With no trigger fired, the offer stays a live candidate (doctrine §2 order) and the ladder continues.
2. **Bounce / wrong-person replies** high → list-quality problem, not the offer → fix lists first. **Find which list layer from provenance, not by guessing (added 2026-09-24).** This branch is **dormant until the sending platform is live**: it runs only once `run_state.sending_platform` is set, that tool's slot in `stack-contract.yaml` is `status: live`, and a wave is actually sending, and until then it is reported as dormant, never as "no list problem". Once live, for each campaign with 30+ first touches, export its leads from the sending platform (the lead export of the pack `/stack-setup` activated for the locked `run_state.sending_platform`, or that platform's native export when no pack is active) and run `python scripts/list_feedback.py --dir <campaign dir> --leads-export <export> --replies <this week's replies, classified with reply-scoring-core.md>`. The export's lead-status and bounce values have not been checked against a real export yet (UNVERIFIED), so confirm the script recognized them before trusting a zero bounce count. It joins outcomes back to each lead's email source, buyer tier, function, seniority and size band. Its report names:
   - a provider (email source) bouncing above 3%, a candidate to demote in the stack contract's waterfall (`lead_data.contact_enrichment.notes`, mirrored in `provider-routing.yaml`), and only after the bounces are diagnosed from real DSN reasons (the delivery-failure codes the receiving server returned);
   - a buyer tier or function with sends and no positives, the candidate to move in the targeting spec;
   - groups converting at twice the campaign rate, the candidates to widen.

   Put its recommendations in the digest as proposals only. It never edits the targeting spec, the routing file or the stack contract itself. A provider-order change is a provider change, so it waits for the operator's decision (a hard-stop under `/autonomous-execution-policy`); once accepted, the contract's waterfall note changes first and the yaml follows. Every accepted change is logged in the spec's `changes` or the yaml's `evidence` (`list-production-standard.md` section 15, campaign handoff and results feedback).
3. **Copy** fails `/spam-word-checker` or `cold-email-copy-best-practices.md` → copy problem → re-check copy.
4. **Only then, offer.** If deliverability, bounce, list, and copy are all clean and the flatness spans **≥3 mature campaigns over ≥2 distinct signals**, flag the **common factor = offer-or-copy** and route to `/offer-intelligence` validation **plus** a copy re-check (the constant-copy wave can't separate the two alone; where positioning variants of the winner are running, their in-flight reads feed that re-check). Never flag the offer below 300 sends per campaign (the raw-reply floor), and never call an offer arm dead on this diagnosis: that call belongs to `/campaign-strategy`'s pooled flip at ~1,300+ first touches per arm (Aaron process alignment, operator directive 2026-09-22; supersedes "300 sends is enough to call an offer broken", house). The 300-send floor governs this rate-based flag only. `/market-evidence` feedback's routing rules (`market-evidence-standard.md` section 14) can open the same validation route on reply content without waiting for this ladder, and that route only proposes too: it never calls an arm dead.

A single individual dud campaign is **not** this trigger. That case belongs to the per-campaign Friday keep/iterate/kill path, the existing per-campaign `/offer-intelligence` validation trigger (one campaign sub-1% after 300 sends), and `/market-evidence` feedback's routing rules (`market-evidence-standard.md` section 14), which open validation mode on reply content (repeated contradiction, `already_have` or `confusion`) rather than on rates. This cross-campaign diagnosis is specifically for *"the offer itself is flopping across the board."* Both the maturity floor and the distinct-signal count are sensible defaults: tune them in `client-profile.yaml` if a client's economics justify it.

### Scale sub-routine (owned here: the gap no other skill fills)

This sub-routine scales a winning **signal slice**. The offer-test winner scales through the Step 5 retirement instead, with its positioning variants running in the big campaigns (Aaron process alignment, operator directive 2026-09-22). For a winning signal slice (positive-reply rate ≥2× the client's baseline, HIGH confidence per `/experiment-design`, and not below the baseline on time-agreed replies per 1,000 first touches, because a positive lift with no rise in time-agreed replies is farming interest, not a winner; doctrine §4, operator-approved Aaron alignment, 2026-09-21), scale it **without confounding the result**, so offer and copy stay frozen:

1. **Re-check signal freshness** (Gate A): a winner scaled a month later needs fresh signal rows, especially why-now signals.
2. **Expand the slice's list**: pull more enriched-TAM rows carrying the **same signal** (the same `[FL]` predicate), deduped against the `suppression-list.csv` and everyone already contacted, then run them through `/email-waterfall` (Layer-2 reveal + email verification) and `/list-quality-scorecard`. Same signal, more rows, not a new angle.
3. **Add sending capacity**: assign more warmed inboxes / raise daily volume within the Step-4 headroom, using the rested rotation half (the locked platform inbox manager's rotation tags) if the active half is maxed. Keep the 15-minute min-gap and warmup settings intact.
4. **Land a paused draft**: the scaled-up campaign is built and paused for your Start. Offer and copy unchanged, so the lift stays attributable to volume, not a hidden variable.

If there's no warmed headroom to scale into, the Scale move surfaces a **capacity request** (`run_state.capacity_request`, sized to the volume) and a **domain-purchase recommendation** for the operator's approval of the setup total (the ~2-week lead-time flag), rather than silently doing nothing.

### Outputs

**Slack digest** (per the reporting-channel setup for the locked sending platform): one weekly post, one section per active client, written in the plain, scannable style of `output-style-guide.md`:

- **What to launch next week**: the proposed new signal slice(s) or scale-ups, each with its signal, matching company count, and one-line rationale (or "hold, at capacity / not enough data yet").
- **Replies to handle:** counts of interested / referral / hostile, with every positive still unanswered listed (no top-N cut), plus speed to lead: whether it ran on the platform's webhook alert or in sweep mode (sweep mode until the receiver exists, so the 5-minute call is a target, not yet a mechanism), the latency audit (time to first human reply, time to first call against the 5-minute target) and every miss.
- **Deliverability flags**: any campaign under 1% or inbox over 2% bounce, the complaint proxy (`hostile_per_1000`, beside bounce) and its trend, and the mailbox age clock roll-up (oldest/median sending days by domain, counts in each band, any domain at ~45 needing a replacement order or at 60-90 needing retirement).
- **Meeting book rate:** `meeting_book_rate` (Step 2, meetings booked / positive replies, `reply-scoring-core.md`), with its source (calendar/CRM, operator-reported, or not measured), reported on its own as a reference point, not a benchmark (Aaron flow (see aaron-flow.md), section 11).
- **Offer read:** per campaign, and per arm in an Offer-Validation Wave (pooled across the segments it runs in, shown by segment, with offers compared only on shared ground), the positive-reply rate beside time-agreed replies per 1,000 first touches (Step 2, with its source: calendar/CRM, operator-reported, or not measured), plus each validation arm's flip state (PROVEN / DEAD / HOLD), any farming-interest label, and any arm parked at a winner pick with its read unresolved (operator-approved Aaron alignment, 2026-09-21; parked arms added by Aaron process alignment, operator directive 2026-09-22).
- **Capacity:** the plain "room for one more / at capacity" verdict, plus days to cover the TAM against `run_state.capacity_request` and any capacity request put to the operator.

**`profiles/<client>/portfolio-review.md`**: newest-first log, the audit trail behind the digest:

```markdown
## <YYYY-MM-DD> Weekly Review: <client>
- Portfolio maturity: <N mature campaigns / M signals>  → diagnosis run? <yes/no>
- Replies: <interested>/<referral>/<hostile>; unanswered positives (all): [...]; speed to lead: <webhook | sweep mode>, first human reply <median min>, calls within 5 min <n of m>, misses: [...]
- Offer read: positive-reply rate <x%> | time-agreed per 1,000 first touches <y> (per arm and segment while validating; arm flip states; parked arms)
- Meeting book rate: <z% (calendar/CRM | operator-reported | not measured)> (reference point, not a benchmark)
- Market feedback: <ran `/market-evidence` feedback (n replies ingested; results review in `_research/pain-clusters.md`; routed to: ...) | not due (last run YYYY-MM-DD) | no wave live | dormant: sending platform not live>
- Deliverability: <clean | flags: ...>; complaint proxy: <hostile_per_1000>; mailbox age clock: <oldest/median sending days; bands: <45 N, ~45 N, 60-90 N>
- Capacity: <headroom verdict>
- TAM signal freshness: <fresh | refreshed this run | refresh proposed>
- Decision: <launch-new | scale | both | hold | diagnose-offer>
- Routed to: <skills invoked> ; drafts created (paused): [...]
- Reasoning: <one or two lines>
```

---

## Every send day: speed to lead on interested replies

Interested replies are handled in real time, not in a weekly sweep (Aaron process alignment, operator directive 2026-09-22; supersedes "the Wednesday sweep is the system", house). Aaron's setter is on every interested reply within about 5 minutes (Sep 14, Sep 21). Where no active pack provides a reply manager for the locked sending platform, this section is the reply cadence; where one does, run this same cadence through it.

- **Owner.** Read the named speed-to-lead owner from `run_state.speed_to_lead_owner` and the `Speed-to-lead owner:` header line of the campaign's `interested-reply.md`, both recorded at Gate D, reply readiness, before the operator's Start. If either is missing on a live campaign, that is a Gate D breach: say so in the digest and route to the operator, because only the operator names the owner.
- **Target.** The owner gives every interested reply a human touch within 5 minutes during the send window. A yes to a direct, trial or service offer gets a short reply proposing two specific times plus the calendar, with no re-selling, and then a call from the `## Call Script` in `interested-reply.md` (Aaron, Sep 21). A costly front end (a trial, a service, custom work) routes the yes through the `offer.qualification` form before the free unit is promised. A promised asset is delivered first, with no times, and the next step goes one layer down (Jul 13, ledger R03); the delivery email itself stays pure value with no calendar push. **Every interested reply still gets a call, asset requests included** (ruling `call-every-interested-reply`, standing-rulings.md, 2026-10-05; Aaron flow (see aaron-flow.md), section 11): the call follows the asset, it does not replace it. Call timing otherwise stays the house reading of Aaron's unresolved ledger R20 (`/lifecycle-copy`). No blanket booking link on every positive.
- **Phone.** The number comes from the replier's own signature or reply first, then from the contact-enrichment slot's phone reveal where the stack contract declares one: one lookup per replier, inside the run's standing budget. If neither gives a number, the reply is the touch and the digest says so.
- **Mechanism, target state.** The locked sending platform's interested-reply webhook, where the platform offers one, raises a human alert and the owner acts on it.
- **Mechanism, today.** The always-on webhook receiver does **not** exist yet. Until it does, the reply sweep runs several times a day, Monday to Friday (for example at the start, middle and end of the send window), the 5-minute call is a target rather than a mechanism, and every weekly digest says speed to lead is running in sweep mode. Run the sweep with the inbox manager for the locked `run_state.sending_platform`, if `/stack-setup` activated a pack that provides one. If no pack is active, use that platform's own master inbox directly. If neither exists, say so and do the sweep by hand from whatever the platform exposes, rather than implying coverage.
- **What each sweep surfaces.** Every positive still unanswered (`positive_interested`, `positive_soft` and `positive_referral` with no human reply yet), time-agreed first, each with the minutes since it arrived and the matching `interested-reply.md` template to reply from. List all of them, never a top-N cut. A human edits and sends every reply; this skill never sends.
- **Meetings booked.** Keep meetings booked current from the client's booking calendar or CRM when one is readable, phone-booked and form-booked included, otherwise from the operator's reported count, and say which. That feeds `meeting_book_rate` (defined in `reply-scoring-core.md`) and the latency audit in Weekly Scheduled Review Step 2.
- **Catch-up, not the system.** The Wednesday sweep and Weekly Scheduled Review Step 2 find any interested reply that slipped through and report it as a miss.

---

## Monday: Deliverability audit (15 min)

**Run:**

```bash
/email-deliverability-audit over the last 7 days of send data
```

(If scoping the audit, pass the active campaign IDs to `/email-deliverability-audit` and state the scope in the report.)

**Review:**

- Fleet reply rate over last 7 days: must be >=1% (the 1% rule)
- Flagged campaigns (`flag_low_reply = TRUE`)
- Flagged inboxes (`flag_high_bounce = TRUE`)
- Hostile replies per 1,000 sends (the complaint proxy, `reply-scoring-core.md`), beside bounce, and its trend
- Mailbox age clock: any domain at ~45 sending days (order/warm the replacement) or 60-90 (retire)

**Action:**

- A deliverability check starts with a PlusVibe placement test (ruling `placement-test`, standing-rulings.md, 2026-10-05): >=85% inbox clears the list for triage; 70-85% is a grey zone, re-run once with different senders before trusting it; <70% is critical, pause and go to `/deliverability-incident-response`. A test not run is reported as a gap, never as a pass.
- If any campaign failed the 1% rule: run `/deliverability-incident-response` → triage decision tree. If the triage clears deliverability and the list, and the campaign has 300+ sends, open `/offer-intelligence` validation mode for it as a look, never a verdict (calling an offer arm dead stays with `/campaign-strategy`'s pooled read at ~1,300+ first touches). This is the per-campaign validation trigger the offer diagnosis above refers to.
- If bounce rate spiked above 2%: pause the offending campaign immediately, then triage
- If a domain's age clock reads ~45 sending days: open `/mailbox-mix-strategy` to order and warm the replacement batch (recommendation only; nothing is purchased without the operator's approval).
- If everything clean: log the check in a weekly journal, close the tab

---

## Wednesday: positive-reply catch-up sweep (30-60 min depending on volume)

This is the catch-up behind real-time speed to lead (section above), not the system that handles interested replies (Aaron process alignment, operator directive 2026-09-22).

**Run:**

```bash
# Run only the reply-scoring skill the stack contract names for the locked
# run_state.sending_platform. No other platform's scorer runs.
/<reply-scoring skill for the locked sending platform>
```

If no pack provides a reply-scoring skill for the locked platform, read that platform's own reply export directly and classify with `reply-scoring-core.md`; if neither exists, say so rather than reporting a clean inbox.

**Review:**

- Any `positive_interested` or `positive_soft` replies: these are leads wanting to engage
- Any `positive_referral` replies: these are people saying "talk to Jane instead"
- Any `negative_hostile` replies: red flag, investigate

**Action:**

- Any `positive_interested` or `positive_soft` reply still without a human touch: handle it now, the same way as in real time (section above), and log it as a speed-to-lead miss with how long it waited.
- For referrals: reach out to the referred person within 24h, mention the referrer by name.
- For hostile: apologize, remove from all lists, investigate why they were flagged for hostility (often signals bad targeting).
- Update meetings booked from the client's booking calendar or CRM (phone-booked and form-booked included), or from the operator's reported count when neither is readable, and say which, so `meeting_book_rate` (Weekly Scheduled Review, Step 2) is current.

**Time management:** if you have >50 positive replies per week, you're at the scale where you should hand off to a dedicated closer/AE or setter, whom the operator then names as the speed-to-lead owner (`run_state.speed_to_lead_owner` and the `Speed-to-lead owner:` line of each campaign's `interested-reply.md`).

---

## Friday: Campaign retrospectives (20 min per campaign)

**Identify campaigns that became readable this week:** past their sample floor (~300 first-touch sends for a campaign's raw-reply read, or the `/experiment-design` minimum for a controlled test), with the sequence plus a few days of grace run on those contacts, about 7 to 10 days from the last counted first touch. Never read early because a window passed (Aaron process alignment, operator directive 2026-09-22; supersedes the fixed 21-day mark, house). Offer arms are not judged here: they use the pooled flip and the winner pick in Weekly Scheduled Review Step 5.

For each one:

1. Run the reply-scoring skill the stack contract names for locked `run_state.sending_platform`, scoped to this campaign (`--campaign-id=<id>`)
2. Compare to previous campaigns' positive reply rate baselines
3. Decide:
   - **Winner (positive reply rate >=2x-baseline, and not below baseline on time-agreed replies per 1,000 first touches; operator-approved Aaron alignment, 2026-09-21):** keep running, consider scaling (clone to more inboxes). A positive lift with no rise in time-agreed replies is farming interest (doctrine §4): treat it as Middling, not scaled, and reshape it so it filters better rather than killing it.
   - **Middling (near baseline):** iterate on copy or list. Run `/experiment-design` Monday to plan the next variant
   - **Loser (<50% of baseline), on an adequate sample only:** switch it off (no new first touches, live sequences finish) and document why in the experiment log. This cut may fire only once the campaign's expected positives at the baseline rate reach about 8 (first-touch contacts × baseline positive rate ≥ 8: about 3,200 contacts at a 1-per-400 baseline, about 5,300 at 1-per-660). Below that it reads as Middling and keeps sending. The ~300-send floor makes a campaign readable on raw reply; this cut judges the far rarer positive event, so it needs the larger sample. Why the gate (Aaron process alignment, operator directive 2026-09-22): positives are rare, so at the ~1,300 floor an arm exactly as good as the leader shows 2 or fewer positives about 37% of the time (Poisson, mean 3.25), and this rule would switch off a baseline-quality campaign about 16% of the time (1-per-400 baseline, k ≤ 1). At an expected 8 positives that false cut falls to about 4%. The 8-positive line is house Poisson arithmetic, not an Aaron or operator number (Aaron gives no threshold, Mar 9), so the operator may tune it. It never applies to offer arms, which go off only at the DEAD line or the winner pick.

4. Log the result in `profiles/<business-slug>/experiments/<YYYY-MM-DD>-<campaign>.json`:
   - `positive_reply_rate`, `reply_rate`, `bounce_rate`, `time_agreed_per_1000` (time-agreed replies per 1,000 first touches, added 2026-09-21), `meeting_book_rate` (meetings booked / positive replies as `reply-scoring-core.md` defines it, with its source, added 2026-09-22)
   - Your decision (keep / iterate / kill) + reasoning
   - Hypothesis for next iteration (if iterating)

**Critical:** do not skip the log. Over a quarter, these logs become the input for `/experiment-design` quarterly reviews. Without the history, you can't learn across campaigns.

**Domain retirement is a separate, domain-level review (`eric-deliverability-doctrine.md`).** Eric runs a scheduled weekly review, typically Friday, that cancels domains replying under roughly 1%. Note what it acts on: **a domain, not a campaign.** It is not the keep/iterate/kill decision above, and it is not the Monday 1% rule (which flags a *campaign's* reply rate). His own caveat travels with it: this is a **capacity-management habit, not a root-cause diagnosis.** A reply-rate shortfall points at the offer or the list far more often than at the sending domain, so check those first. Used as a root-cause fix, the rule retires healthy domains that were merely carrying a weak offer.

---

## Every other Monday: Inbox rotation (30 min)

**Run:** the inbox health export/check inside the manager matching locked `run_state.sending_platform`.

**Review the CSV:**

- Any inboxes with reputation "bad"?
- Any inboxes with `is_warmup_blocked: true`?
- Any inboxes with <5 sends/day despite being in active campaigns?

**Action:**

- **Rotate the active mailbox-batch half (the core of this step).** Every client fleet is split into mirror halves `Batch N.1` / `Batch N.2` (see the locked platform inbox manager's Rotation batch tags). Swap which half is sending: move live campaigns onto the rested half and let the half that's been sending rest as warmed backup. Because the halves are balanced mirrors (same provider + Google/Microsoft mix), the swap is transparent to a campaign. This is what stops any mailbox or domain from being maxed. Do the swap by changing which `Batch N.x` tag the campaign's sender selection uses (re-attach senders in the locked platform manager). Never run both halves at once.
- Retire failing inboxes through the locked inbox manager.
- Remove retired inboxes from active campaigns.
- Keep warmup and sending settings consistent with the selected platform manager skill (both halves stay warmed even while one rests).
- Update the **mailbox age clock** (sending days by domain and batch, above): roll it forward from this rotation's sending data, and flag any domain newly into the ~45 or 60-90 band.

**If a rotation half is getting thin (failures leave <half the mirror healthy), OR the mailbox age clock shows domains crossing into the ~45-sending-day band:** kick off a new domain purchase cycle using the setup skill selected by locked `run_state.infrastructure_stack`. It takes about 2 weeks from purchase to sendable, so you need to start early. This is a recommendation; the operator approves any purchase (Aaron flow (see aaron-flow.md), section 10).

---

## Monthly (1st of the month): PlusVibe placement test (25 min active, test runs ~20 min)

**Run:** PlusVibe's own placement test (ruling `placement-test`, standing-rulings.md, 2026-10-05; Aaron flow (see aaron-flow.md), section 10). Read its cost on the FNNL plan before first use (`/api-cost-governance`); the operator's OK is asked once, at checkpoint A, and then stored as the ruling, not re-asked every run. A test not run this month is stated as a gap in the digest, never reported as a pass.

**Review:**

- Overall inbox placement %, target: >=85%
- Spam filter triggers: which filters fired, which senders affected

**Action:**

- **>=85% inbox placement:** clean. Keep doing what you're doing; the offer/copy diagnosis above is looked at last, not first.
- **70-85%:** grey zone. Re-run once with different senders before trusting the number either way; look at spam-filter-details and start fixing the highest-frequency trigger next week.
- **<70%:** critical. Pause the campaign, run `/deliverability-incident-response`, fix before sending more.

---

## Monthly (1st): TAM refresh + experiment proposal (20 min)

**Run:**

- `/tam-build` refresh: re-collect the catalog's volatile `collect_now` signals (running ads, hiring, pricing changes, new case studies) and add new companies; cost-gated by `/api-cost-governance` (refresh re-crawls only the volatile signals the build actually collected, per the Collection Scope rule in `/data-point-discovery`, which collects a why-now or intent signal only when the offer or a live test needs it; Aaron process alignment, operator directive 2026-09-22, supersedes the Collection Completeness rule). Collect any genuinely-new `in_reserve` point (a newly-obtainable signal, or one an approved experiment needs) when it appears. Stable firmographics refresh quarterly, not monthly.
- `/experiment-design` Generative Proposal Mode: mine the refreshed `tam/tam.csv`, `experiments/*.json`, and the Market feedback log in `_research/pain-clusters.md` (what replies said, which clusters strengthened or broke, and the next tests `/market-evidence` feedback routed) for ranked, data-grounded experiment candidates for the next wave.

**Review:** the proposed experiment candidates (recommended first), with TAM row counts.

**Action:** approve the next wave's experiments (human gate: nothing sends automatically), then run each approved slice through the full per-slice pipeline: `/icp-prompt-builder` → `/email-waterfall` (Layer-2 contact reveal + verification on that slice) → `/list-quality-scorecard` → **then** `/campaign-copywriting` → spintax → paused upload. The verified-list gate (`verified-list-gate.md`) requires the slice be verified before any copy, so copy comes after `/email-waterfall`, never before. Decline or reshape any candidate whose slice is too thin per the sample-size table in `/experiment-design`.

This is the self-improving loop: refreshed data and the market's own answers (the Market feedback logs) in, ranked next-round experiments out, human approves, paused drafts created.

---

## Quarterly (first Monday of each quarter): Experiment review (90 min)

Read all `experiments/*.json` from the last quarter. Identify patterns:

- Which campaigns had the highest positive reply rate?
- Which offers, and which validation arms, won on time-agreed replies per 1,000 first touches, not just on positives?
- Which list sources produced the best leads?
- Which copy angles resonated (Observation → Implication? Pain? Social proof?)
- Which ICP archetypes converted best?
- What was the `meeting_book_rate` (meetings booked / positive replies, `reply-scoring-core.md`), read on its own, as a reference point and not a benchmark (Aaron's self-reported 20-25%, aiming for 30%, is a reference point only, Aaron flow (see aaron-flow.md), section 11)? If it sits well under the client's own trend while positives are healthy, the gap is in the reply machine (speed to lead, the call script, the qualification step, the confirmation page), not the offer.
- Which arms were parked unresolved at a winner pick, and is any worth bringing back as a later test?

**Output:** a 1-page Q<N> retrospective saved to `profiles/<business-slug>/retrospectives/<YYYY>-Q<N>.md` with:

- Top 3 campaigns + what made them work
- Bottom 3 campaigns + what to avoid
- 3-5 hypotheses for next quarter's experiments
- Adjust ICP in `client-profile.yaml` if the data suggests a different segment performs better

Use the retrospective as input to design next quarter's experiments via `/experiment-design`.

---

## What to skip

You do NOT need to:

- Check campaign stats every day once a launch is past its first week (the Monday and Friday reads catch the rest). In the first week after a launch, read daily for bounce, deliverability and reply handling, with no arm call before the floor.
- Obsess over daily reply-rate fluctuations (wait for 7-day averages)

Interested replies are the exception to this whole list: they are handled in real time (**Speed to lead**, above), and the Wednesday sweep is only the catch-up (Aaron process alignment, operator directive 2026-09-22; supersedes "the Wednesday sweep is the system", house).

Daily pokes at your cold email stack are a procrastination pattern, not a performance pattern.

---

## What to do next

This skill IS the loop. Your next action is the next calendar event on your list. Or, if the **Weekly Scheduled Review** routine is set up, read its Monday digest and approve (or decline) the paused drafts it proposed.

**Or if you haven't run a campaign yet:** skip this skill until launch day. The speed-to-lead sweep and the first-week daily read start with the first send.

## Related skills

- `/email-deliverability-audit`: the Monday and Monthly tasks; the Weekly Scheduled Review's deliverability-flags step
- The reply-scoring skill for the locked sending platform: the Wednesday and Friday tasks, and the Review's inbox/reply-check step
- `reply-scoring-core.md`: the reply classes and the canonical `meeting_book_rate` definition this skill reports
- `/lifecycle-copy`: writes each campaign's `interested-reply.md` (category templates, `## Call Script`, the `Speed-to-lead owner:` line) and `pre-call.md`, which the speed-to-lead sweep works from
- `/offer-test-slate`: scale-review mode, the results report and `offer.qualification` review that runs alongside the winner's scale-up
- The inbox manager for the locked sending platform: selected by locked `run_state.sending_platform` for biweekly sender rotation, the Review's capacity model, and the Scale sub-routine's added inboxes
- `/deliverability-incident-response`: when the Monday audit (or the Review's deliverability flags) flags something
- `/campaign-strategy`: the Weekly Scheduled Review's launch-new route; slices the enriched TAM into the next signal-first wave
- `/offer-intelligence`: the Review's diagnose-offer route (validation mode, Go / Iterate / Swap) when a flop spans multiple campaigns, or when a `/market-evidence` feedback results review routes there
- `/market-evidence`: the Review's feedback run (feedback mode) at each arm read and at least every two weeks while a wave is live, dormant until the sending platform is live. It turns replies and call notes into evidence and writes the Market feedback log; it writes research and evidence records only, never a campaign, and never moves the flip, an arm's read, or the winner pick
- `/email-waterfall`, `/list-quality-scorecard`: the per-slice verify + QA the Review's launch-new and Scale routes run before copy
- `/experiment-design`: the quarterly retrospective and the Monthly proposal feed into this (Generative Proposal Mode); the Review uses its sample-size minimums and confidence weighting
- `/tam-build`: the Monthly TAM refresh re-crawls company-level signals; the Review's Gate A freshness check triggers it when signals are stale
- The reporting-channel setup for the locked sending platform: where the Weekly Scheduled Review posts its digest
- `/schedule`: runs the Weekly Scheduled Review as a weekly cloud routine (VPS-portable later)
- `/api-cost-governance`, `/autonomous-execution-policy`: the spend gate and the proceed-vs-stop / never-re-ask / fail-loud rules the Review defers to
- The domain + inbox setup skill the stack contract names for the locked registrar + mailbox-provider pairing - used when the insurance pool runs low

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short: record status, not raw output. Full protocol: `client-activity-log.md`.
