---
name: lead-magnet-brainstorm
description: Locks the cold-email front-end offer set (lead magnet, validation arms, icp_inclusion, title_stack, offer_fit_disqualifiers) after /offer-intelligence, before the list build. By default records the offers /ask-aaron decides in the Aaron-lane offer call and runs the rails; the house brainstorm runs on request.
---

# Front-End Offer Builder (lead-magnet-brainstorm)

**From the former description:** Builds and locks the front-end offer set for cold email (Aaron's three buckets; a lead magnet is one bucket, not a separate step). Use after /offer-intelligence discovery mode, whose Candidate Generation Input block it consumes directly rather than re-deriving buyer pain. The offer set LOCKS here, before the list build. Generates candidates across Aaron Shepherd's three offer buckets (service-based, service-delivery-based, lead-magnet or asset-based) with no client-willingness, capacity, effort or free-trial limits at ideation (operator directive 2026-09-22), labels each with the four-sentence test, the why-not and farming-interest checks, the weak-offer screen and who honors a qualified yes, and scores every candidate on a 7-point buyer-pull rubric while keeping all of them visible. Then it checks run_state.execution_mode. auto_execute locks the top-ranked offer that can send today as the primary plus every other qualifying candidate as ranked validation arms (offer.validation_arms, no cap) and proceeds without pausing, and the first wave later launches max(3, qualified contacts / 2,000) of them together, capped at the qualifying candidates, with no head start for the primary, each offer placed only in the list segments its own fit filters admit and shared ground split evenly (operator decision 2026-09-23); review_gates presents ranked options and waits for operator selection. At lock each offer records a scale note showing it is deliverable at the planned send volume or an offer.qualification rule, states material eligibility honestly, passes the Signal-Capability Check (any signal the offer depends on must be obtainable by a capability the stack contract declares), and writes the offer-derived list definition (offer.icp_inclusion, offer.title_stack and offer.offer_fit_disqualifiers) that /tam-build consumes. An existing offer rated Go by validation mode makes new arms optional. The locked set goes to /offer-test-slate for the client. Exact CTA copy is written later in /campaign-copywriting.

**The Aaron lane: by default this skill records Aaron's offer call (the operator's rule of 2026-09-24, adopted here 2026-09-28; `outbound/reference/aaron-lane.md`).** After the research, a fresh `/ask-aaron` sub-agent decides the offers, their order and count, and who each goes to, and his call is final below the operator. On the default path (`/phase-2-research-offer` steps 4 and 5) this skill runs in **recorder mode** only. It writes his offers, his ranking (each offer's `aaron_rank`), his list definition (`icp_inclusion`, `title_stack`, `offer_fit_disqualifiers`) and his fulfillment answers into the fields Save Output defines, word for word, and fills only the mechanical fields (`lead_magnet_client_ok` and the Offer Readiness fields, evidence IDs that resolve his cluster IDs, `evidence_strength`). It then runs the rails in `aaron-lane.md`: truth, the Signal-Capability Check on his targeting, and evidence that resolves (an offer with none is labelled `unevidenced`, never dropped). A failed rail goes back to a fresh Aaron sub-agent for one fix round. This skill never re-scores, re-ranks, re-words or drops his offers, and the 7-point score, the offer-count formula, fit-matched placement and the ranking rules do not override him. Every idea he considered stays visible with its label and his reason, including the ones he leaves out of the test (operator decision 2026-09-22). The candidate generation and scoring run only when the operator asks for the full brainstorm ("run the full offer brainstorm"; `.claude/skills/lead-magnet-brainstorm/references/house-brainstorm.md`). Their output then goes to Aaron as input, and Aaron still decides.

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

Roles this skill uses: company-discovery source, sending platform.

**If a role this step needs is empty or missing in the contract, STOP and route to
`/stack-setup`.** Never substitute a guessed vendor, and never hardcode a tool name into
an artifact this skill writes.

Cold email needs a reason to reply. A vague "book a call" ask is weak unless the market already has high intent.

This skill chooses the front-end offer. It does not write final cold email copy.

The opening paragraph on what this skill builds (a lead magnet is one of Aaron's three buckets, and why the `offer.lead_magnet*` names stay), the front-end offer standard, what `offer.lead_magnet: direct_offer` means and the Offer Architecture gate moved verbatim to `.claude/skills/lead-magnet-brainstorm/references/front-end-offer-standard.md`. Read it when Aaron returns `direct_offer` (no free front end), or when a `cta_direction` needs its risk-reversal context.

Final CTA wording must be handled by `/campaign-copywriting`. Keep CTA output here at direction level only, then let `/campaign-copywriting` apply the confirmed-deliverable gate and the permission-based, value-backed CTA framework.

CTA direction must still be specific enough to prevent generic copy. Name the deliverable, what the prospect receives, why it is useful, and what must be true before it can be promised. Do not leave `/campaign-copywriting` with only a vague "short note" direction unless that generic wording is the deliberate test.

## Material Decision Rule

When this skill reaches a material fork, name the realistic options, recommend the strongest path, and explain why the main alternatives are weaker before committing.

Ask before choices that affect spend beyond an approved budget, provider routing, source of truth, list quality, campaign direction, client-facing output, live systems, scraping or account risk, or legal/compliance risk. For low-risk reversible choices, state the recommendation and proceed.

**Every candidate stays visible (operator directive 2026-09-22).** Do not filter offer candidates out of the ranked list or the client slate. A candidate that fails a buyer-side check keeps its place with its score, its label, and the plain reason it ranks where it does; it just does not enter the first wave by default. The only offers never proposed are ones that would be illegal or deceptive to send, and even then name what was dropped and why.

## Interaction Policy

Defers to `/autonomous-execution-policy`. Under `run_state.execution_mode = auto_execute` (the new-client default since 2026-09-24, paired with `review_protocol: phase_checkpoints` so a run stops only at the one checkpoint that closes each of the four phases, `outbound/reference/phase-protocol.md`; `review_gates` is opt-in), proceed without pausing: pick the strongest option per this skill's rubric, record it to `run_state`/profile, and continue - never re-ask a decision already in `run_state`, the profile, memory, or the operator's latest message. Stop only for the policy's hard-stops (spend over the approved ceiling, live send, credentials, provider/source-of-truth change, safety gates). On a long async wait, background-poll and move to other productive work - never idle.

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short: record status, not raw output. Full protocol: `client-activity-log.md`.

## Client Suggestion Rule

If `client-profile.yaml`, an onboarding form, call notes, or the operator includes a client-suggested lead magnet, treat it as Candidate A. Do not confirm it as the answer.

An offer or lead magnet the client suggested in a meeting or in Slack counts as a client suggestion under this rule, exactly like one in call notes. At the read-state step, right after the activity log's CURRENT STATE, read `profiles/<business-slug>/client-intel.md`: Needs attention and Open items in full, plus Recent activity tagged `offer`. A suggestion found there is a hypothesis: it never silently overwrites a locked offer or an operator-confirmed value, and a conflict goes to the operator (under `auto_execute`, it stops this step and asks). A missing feed, or one more than 2 days old (the newer of the client's own refresh stamp, `clients.<slug>.refreshed_at`, and the global `last_run_at` in `profiles/_intel/state.json`; `client-intel-feed.md` section 8), is a one-line flag at the top of the report, never a blocker; offer `/client-intel-sync <client>` for a fresh pull. Protocol: `client-intel-feed.md`.

Always generate at least 3 additional candidates before scoring, spread across Aaron's three buckets (Generate Candidates below). The client suggestion may win, but it must beat the alternatives on the same rubric and pass the same gates.

In recorder mode the client's suggestion goes to Aaron as an input labelled "client suggestions, rule on each" (`/phase-2-research-offer` step 4), and his ruling on it is recorded like any other offer he considered, visible with his reason. The three additional candidates apply when the house brainstorm runs.

AI/API Routing moved verbatim to `.claude/skills/lead-magnet-brainstorm/references/house-brainstorm.md`. Its rule holds on every path: ideation and recording run in Claude Code with no outside AI provider and no API key (no-AI-API rule, operator directive 2026-09-22), and a context too large for one pass fans out to Claude sub-agents per `/personalization-subagent-pattern`.

## Required Input

**Recorder mode (the default): the input is Aaron's returned `aaron_offer_call` block and his consult file `profiles/<business-slug>/aaron-offer-call.md` (`aaron-lane.md`, Call 1).** His call reads, among its inputs, `website-profile.md` (the live website scrape: what the client sells, charges and already offers, per `outbound/reference/client-website-scrape.md`); a capability the website claims but nobody has confirmed stays a hypothesis, and the truth rail still applies. The Research QA check below still comes first. The house flow's brief inputs (the five sections it loads by name, Candidate A, and what to do when no brief exists) and Intake moved verbatim to `.claude/skills/lead-magnet-brainstorm/references/house-brainstorm.md`, sections Required Input and Intake.

Before asking anything, check for:

```text
profiles/<business-slug>/offer-intelligence.md
```

**Discovery and candidate generation are one continuous offer motion split across two skills.** This skill is the second half of it, so it starts by reading what discovery already established rather than researching pain again. It runs no new web research of its own.

**Check the Research QA verdict first** (`research_artifacts.qa_verdict` in `client-profile.yaml`, or the Research QA section of `_research/pain-clusters.md`; `market-evidence-standard.md` section 7):

- **PASS**: proceed.
- **DEEPEN with loops remaining**: route back to `/offer-intelligence` Stage 2 rather than building offers on research the gate says is thin. Under `review_protocol: phase_checkpoints` the same holds: the loops (at most two, operator decision 2026-09-28) run inside Phase 2 before the Aaron offer call, and after them the gap's clusters are carried in labelled low confidence.
- **PASS with low-confidence labels after two loops**: proceed, carrying each cluster's label into every candidate that relies on it.
- **HOLD**: the step depends on the mode (operator decision 2026-09-23, Aaron pre-launch gap audit; matches the Research QA gate in `/cold-email-kickoff`). Under `review_gates`, the operator decides at Gate 2 (the offer-step review defined in `/cold-email-kickoff`): do not build offers on a HOLD until that decision is made, and follow it when one is already recorded. Under `review_protocol: phase_checkpoints`, a HOLD is carried forward inside Phase 2, never a silent block: every cluster is labelled low confidence, the HOLD reasons lead checkpoint 2, and the missing evidence goes into `client-asks.md` (`/phase-2-research-offer` step 3). Under plain `auto_execute`, proceed with every cluster labelled low confidence, the HOLD reasons at the top of the report, and each cluster's label carried into every candidate that relies on it.
- **No verdict** (a brief written before the research layer landed, 2026-09-24): run `/market-evidence synthesize` first; it seeds the evidence ledger from the existing brief and research files.

## Recording Aaron's offer call (recorder mode)

A field map of `aaron-lane.md` ("Recording" and "Targeting is his call"), kept here so the recorder does not have to re-read the whole lane. `aaron-lane.md` wins on any difference. Every field lands exactly as Save Output below defines it.

| Aaron's return field | Where it goes |
|---|---|
| one set (`segment: all`) | the top-level `offer` block |
| two or more sets (buyer types) | `offer.segments`, one entry per set; the top-level block mirrors the priority-1 set (Offer sets per buyer type) |
| `rank` | each offer's `aaron_rank`, written in the same mapping as `lead_magnet_client_ok:`, above it and at the same indent (the Offer Readiness scripts find an offer's rank that way). It is the key for the `[offer-<aaron_rank>]` client-asks item and for `offer_approval.py`, and it is not `validation_arms[].rank`, which numbers the arms only; both stay (`outbound/reference/offer-readiness.md`) |
| rank 1 with `in_test: true` | `offer.lead_magnet` (the primary) and every field of the primary block. If his rank 1 is `yes_honored_by: client`, this conflicts with Lock One Primary Plus Validation Arms (a waiting client offer goes in as arm 1): flag the conflict at checkpoint 2 for the operator |
| every other `in_test: true` offer | `offer.validation_arms`, in his order |
| `in_test: false` offers | `lead-magnets.md` under `## Every candidate`, with his `why`; never dropped |
| `name`, `details` | `lead_magnet`, `lead_magnet_details` |
| `eligibility` | stated in `lead_magnet_details`, and written as that offer's own `icp_inclusion` entry |
| `cluster_ids`, `pain_angle` | `cluster_ids`, `pain_angle`; the recorder adds the `evidence_ids` and `evidence_strength` that resolve his clusters |
| `who`, `icp_inclusion`, `title_stack`, `offer_fit_disqualifiers` | the list definition (Offer-Fit Disqualifiers and The Offer Writes the List Definition, below). The recorder writes each `check` the locked stack can collect (`outbound/stack-contract.yaml`) and expands the title variations; it never adds, drops or widens a trait |
| `yes_honored_by`, `client_dependency` | `lead_magnet_yes_honored_by`, `lead_magnet_client_dependency`; the recorder sets `lead_magnet_client_ok` (`not_needed` for `agency`, `pending` for `client`). As mechanical fields at lock it also writes the evidence trio `lead_magnet_client_ok_by`, `lead_magnet_client_ok_at` and `lead_magnet_client_ok_evidence` as `null`, `delivery_mode` (`agency`, `client_input`, `client_delivers` or `call_only`, a detail of `yes_honored_by`), and, where known, the `capacity` arithmetic block (planned touches, a labelled GUESS rate, expected yeses, who fulfils, turnaround, a note naming where the cap lives; it holds no cap itself). The trio sits on the three lines directly after `lead_magnet_client_ok:`, in the order `_by`, `_at`, `_evidence`, at the same indent and with no comment line between, because the writer refuses any other layout. It is set later only by `outbound/scripts/offer-readiness/offer_approval.py`, never by hand or by this skill (Offer Readiness, operator decision 2026-09-28; `outbound/reference/offer-readiness.md`) |
| `scale_note`, `qualification` | `lead_magnet_scale_needs`, `qualification` |
| `gap`, `next_step`, `cta_direction` | `lead_magnet_gap`, `lead_magnet_next_step`, `lead_magnet_cta_direction` |
| `delivery_reply`, `input_after_yes`, `if_not_qualified`, `paid_next_step` | `lead-magnets.md` `## Fulfillment plan` (`Delivery reply:`, `Input needed after yes:`, `If they don't qualify:`, `Paid next step, explained:`) |
| `bucket`, `offer_sentence`, `why` | the offer's entry in `lead-magnets.md` |
| `date`, `live_check`, `read`, `offer_count_note`, `divergences_from_house`, `pushback` | stay in `aaron-offer-call.md`; checkpoint 2 shows his divergences and pushback (`aaron-lane.md`), and the lane names no offer-block field for the count note |
| not in his block | `flight` and each arm's `read` are left for `/campaign-strategy`; `lead_magnet_build_owner` (archetype K only) follows K2 in `.claude/skills/lead-magnet-brainstorm/references/offer-archetypes.md` |

Then run the rails (`aaron-lane.md`, The rails) on his offers: truth, the Signal-Capability Check on every `icp_inclusion` check and signal dependency, Offer QA at lock (evidence that resolves), the Artifact-Truth Gate when an offer is a model-generated per-company artifact, and list safety (a client-honored offer sends only after the client's OK; it is drafted before that, with Start held). A failed rail goes back to a fresh Aaron sub-agent for one fix round. The main session logs `DONE Aaron offer call` and sets `run_state.aaron_lane.offer_call` (`aaron-lane.md`, How to run a call, step 5).

Offer Archetypes (the canonical A to K table), Archetype K: the interactive tool, the Saturation Rule and Per-account custom work is open for testing moved verbatim to `.claude/skills/lead-magnet-brainstorm/references/offer-archetypes.md` and `.claude/skills/lead-magnet-brainstorm/references/saturation-and-scale.md`. Read the archetypes file when an offer is an interactive tool (before filling `lead_magnet_build_owner`, K2) or you need an archetype letter; read the per-account section beside the gate below when an offer is a per-account teardown, mockup, sample or personalized page.

## The Artifact-Truth Gate: a generated artifact must be true before it ships (HARD)

**What this governs, and why it is its own gate.** The library has three truth gates and none of them tests the thing itself. **Capability truth** (Hard Rule 28, `/campaign-copywriting`) covers claimed *capabilities*. The **Confirmed Deliverable Gate** covers whether you *can deliver at all*. The **proof-asset gate** (`/proof-asset-request`) covers *proof-claims in copy*. All three test what you **say**. None tests whether an artifact you **built and handed over** is factually correct. That was harmless while every magnet was either a one-time build (archetype K) or human work done after a reply. It stops being harmless the moment an AI generates a per-company artifact at send-scale under the client's persona, because then the artifact is the product and nobody read it.

**When it fires.** Any front-end asset that is (a) **generated per company or per contact**, (b) **by a model**, and (c) **shipped under the client's name**. That includes an AI-built report, teardown, ABM list, mockup, sample deliverable, or "we did a piece of the work for you" artifact. It does NOT fire on archetype K (the prospect enters their own numbers and the tool computes; there is no claim to be wrong about), nor on a static 1:many asset, nor on a per-contact **copy line** (that is personalization, governed by `/campaign-strategy`'s tiers, and is a far smaller commitment than a document).

**The four conditions. All must hold before the first artifact ships.**

- **AT1. Every factual claim about the prospect traces to a real source, with the URL on file.** Same standard the TAM already holds itself to: scraped, not inferred. If the artifact asserts something about their business, the row behind it carries an `evidence_url`. **No inferred claims about their internals** (headcount they haven't published, revenue you estimated, tooling you guessed). A blank is honest; a confident guess about someone's own business, sent to that person, is the fastest way to prove you don't know them.
- **AT2. It is framed as a work sample, not an analysis.** This is the cheapest and highest-leverage condition, and it comes from the motion's own source: *"this is what the output would look like if you were to work with somebody like us."* A **sample** is allowed to be approximate and reads as generous. An **analysis** claims to be true about their business and reads as presumptuous the moment one detail is wrong. Same artifact, same cost, completely different failure mode. If the copy frames it as "here's what we found about you" rather than "here's how we'd work," it fails this gate.
- **AT3. A human reviews the first N artifacts before the batch ships (default N = 20), and the review's failure rate is the gate on scaling.** Not a spot-check afterwards. If more than ~1 in 20 carries a material error, the generator is not ready and the batch does not go. Record the reviewed count and the failure rate. This is the direct analogue of Eric's own rule: never let a vibe-coded, unreviewed line reach a prospect, because one missed edge case sends crazy emails at scale.
- **AT4. The artifact discloses what it is:** built from public data, may be wrong, happy to be corrected. One line, in the artifact. It costs nothing, it is true, and it converts the inevitable error from "they got my business wrong" into "they said it might be off and it was."

**Why AT2 and AT4 do most of the work.** You cannot make an outside-in artifact factually complete, because you are outside. What you *can* do is set the reader's expectation to match what you actually built. The correctness risk is real but it is mostly a **positioning** problem wearing an accuracy costume.

**The gap gate still applies on top (it is not satisfied by shipping work).** Per the Next-Step Gate, an artifact that fully satisfies the reader is a dead end. A generated artifact has a natural, honest gap and it should be named rather than manufactured: you built it from public data, so you do not know their real conversion numbers, which accounts they are already in, or their actual ICP nuances. That is a genuine limit of what an outsider can know, which is what `:241`'s honesty test demands. Record it in `offer.lead_magnet_gap` like any other magnet.

**And the read is on meetings, not replies.** A strong artifact is the strongest reply-inflator there is, so its yeses say nothing about whether anyone wants the paid thing behind it. `/campaign-strategy`'s magnet-inflation guard binds: an asset-led E1 cannot flip `offer_market_proven` by itself. Judge on the meeting rate.

**Status: the gate is live, and so is the motion (operator directive 2026-09-22).** Per-company generated artifacts can be tested like any other offer (Per-account custom work, above). This gate is what makes that safe: it binds before the first artifact ships, in every wave.

Deliverable at Send Scale (who honors a qualified yes, the scale note, the prose definition of `offer.qualification`, the client-supplied-capacity carve-out and the `service_model.front_end_owner: client` override) moved verbatim to `.claude/skills/lead-magnet-brainstorm/references/saturation-and-scale.md`. Read it when Aaron returns `yes_honored_by: client`, a `qualification` block or a scale note that does not fit.

## The Next-Step Gate: every magnet must leave a reason to talk (strong default, ALL candidates)

Encoded from the Aaron Shepherd 589-replies method (2026-07-13), reshaped after review 2026-07-17. Not tool-specific: it applies to every front-end asset this skill can lock, and archetype K's K3 is its strictest instance.

**The failure it prevents.** A magnet's job is to get a reply. But a magnet that fully satisfies the prospect has no reason to lead anywhere: they read it, they think "nice, thanks", and it ends. Aaron's diagnosis of why so many magnets pull a flood of yeses and almost no meetings: people create them *with no natural progression to the next step*, so the loop closes and the conversation dies. **A high reply rate with a dead-end magnet can be worse than a lower reply rate with a live one**, because it spends first-touch reputation and reply-handling time to produce nothing.

**The rule.** Before any magnet is locked, name two things in writing:

1. **The unresolved motive:** what still makes them want to talk after consuming the asset. It does NOT have to be a knowledge gap. Knowledge, capability, capacity, delegation, or plain desire created by a true number all count (see K3 for the full set and why the knowledge-only framing is false).
2. **The next step that resolves it:** the call, analysis, or conversation that closes it, and why it's the natural closer.

**The honesty gate.** Whatever is unresolved must be real, not manufactured by crippling the asset or withholding output it could just give them. A fake gap is a trapdoor and it spends the trust the free asset just bought.

Record both in the candidate's output block (`Unresolved motive:` / `Next step that resolves it:`), and in `offer.lead_magnet_gap` / `lead_magnet_next_step`. A candidate with no unresolved motive is heavily marked down and cannot be the top recommendation.

**Enforcement is HERE, at selection time, not at copy time.** This is a strong default, not a hard veto, and `/campaign-copywriting` only WARNS when the fields are missing, it never blocks. The reason is concrete: the fields landed 2026-07-17 and were populated on zero clients in a prior 8-client book while 7 of 8 carried a real locked magnet, so a hard gate at copy time would fail nearly the whole of that book over a defect never observed in any of them. Backfill existing clients at their next campaign refresh. New magnets get this right from the start, which is the point.

The Diagnostic Order, Generate Candidates Across Aaron's Three Buckets, the Four-Sentence Test and the Scale Note, the "Why Not?" Test and the Farming-Interest Check, and the Weak-Offer Screen moved verbatim to `.claude/skills/lead-magnet-brainstorm/references/house-brainstorm.md`. They run only in the house brainstorm.

## Fulfillment First: the Four Artifacts Before Any Offer Sends (doctrine §11)

**The reply is the start of the promise, not permission to change it** (doctrine §11 bolds this as the corpus's own summary of his reply-stage teaching; it is not his quote, attribution corrected 2026-09-21). Before the primary offer or any validation arm sends, write its four fulfillment artifacts. The agency honoring qualified yeses makes them writable for almost any `agency` offer; a `client` offer's delivery reply is written once the client says yes. **If any one cannot be written honestly, that offer does not send yet.** It stays in the test set and the client slate (operator directive 2026-09-22; this used to block the lock).

1. **Delivery reply:** what we send on a yes, how, and by when. **It splits by offer type** (Aaron process alignment, operator directive 2026-09-22; the house resolution of Aaron's unresolved ledger R20, which he never reconciles between Jul 13 and Sep 21):
   - **A promised asset** (the email promised something we send: a document, a list, a sample, a teardown, a tool's result, a done-for-you creative): deliver what was promised first, with no unexpected booking gate, no calendar link and no proposed times in the delivery reply; the next step sits one layer down and refusable ("calendar's on the next page if you think there's interest", examples §7.3; ledger R03). No offer to walk them through it on a call either: that is a call ask disguised as help, and his rule is "you don't want to add any sort of sales friction until they've actually consumed the value" (S06, transcript 2026-07-13). (operator-approved Aaron alignment, 2026-09-21)
   - **A direct, trial or service offer** (`direct_offer`, or a yes that starts something run with them: a trial, a pilot, a free service engagement): a short reply that proposes two specific times plus the calendar, with no re-selling (Aaron, Sep 21: "Do you have some time available on X or Y? Here's my calendar ... the call is the mechanism"). Where the offer carries an `offer.qualification` rule, the disclosed form rides in the same reply. (Supersedes "never propose times in a delivery reply ... times are proposed only on explicit booking intent" for these offer types, operator-approved alignment 2026-09-21.)
2. **Input needed after yes:** what the prospect must send before we can deliver (a URL, a logo, an invoice, access). Write `none` only if a one-word yes truly suffices: a one-word yes does not supply an invoice, an address, consent, or system access (doctrine §5 step 4).
3. **If they don't qualify:** the honest one-line reply for a yes that fails the offer's `offer.qualification` criteria or that we cannot serve: what they get instead (the client's standard offer), with the real criteria stated plainly; never invent a reason. For an offer with a qualification rule this line is the second half of the qualification step (Deliverable at Send Scale).
4. **Paid next step, explained:** one or two plain sentences on the paid engagement the free thing leads into, as the prospect would read it. It must agree with `Next step that resolves it:` from the Next-Step Gate.

These are fulfillment facts in plain words, not send-ready copy. Final reply wording belongs to `/campaign-copywriting` (Hard Rule 36) and the reply-agent setup skill for the locked sending platform, which read them from `lead-magnets.md` (Save Output).

Score Ideas (the 7-point buyer-pull rubric and the buyer-side labels) moved verbatim to `.claude/skills/lead-magnet-brainstorm/references/house-brainstorm.md`. The rubric scores only in the house brainstorm and never overrides Aaron's rank.

## The Signal-Capability Check (at offer lock, one check, not a research phase)

**This check is now the only thing standing between a signal-dependent offer and an unobtainable signal.** There is no separate source-signal discovery step upstream or downstream to catch it: obtainability is confirmed later in `/data-point-discovery` (kickoff step 3.3), which is after the offer has already locked. So if a signal-dependent offer gets through here, the failure surfaces only once the list is being built around a signal nothing can obtain. That makes this a minute well spent, not a formality. Run it once per saved offer (the primary and each validation arm), never on candidates that lost. It is a check, not research.

**Step 1 decides most cases instantly.** Does this offer's relevance depend on an observable buyer signal, meaning something specific that must be true and visible about a prospect right now before the offer makes sense to send them? **If no, the check passes immediately. Stop here and lock the offer.** Do not open the stack contract, do not name a signal, do not write anything beyond `none`. A free deliverable that is useful to any company in the ICP (most audits, templates, research notes, and the `direct_offer` path) needs no signal, and that is the preferred shape precisely because it has no external dependency.

**Step 2, only if step 1 was yes.** Name the signal in one line, plainly (for example "recently posted a job for an SDR", "runs ads on Meta right now", "uses a named checkout platform").

**Step 3.** Open the stack contract and confirm some slot declares a capability that could obtain that signal:

```text
<outbound>/stack-contract.yaml
```

The usual slots are `lead_data.company_discovery`, `lead_data.contact_discovery`, `lead_data.intent_signals`, `web.search`, and `web.crawl`. A slot counts as declaring the capability when it names a tool (`status: chosen` or `live`) whose stated `capability` plainly covers the signal. A slot at `not_chosen`, `held` or `n/a` declares nothing and does not count. A `retired` slot is not a gap: `web.search` and `web.crawl` are retired because Claude Code does that job natively, so a web-observable signal (ads running, a careers page, site content) counts as obtainable through Claude Code's own per-company web reading (sub-agents with web search and web fetch, a source URL per answer). Only a signal nothing can obtain fails this check (ported from A-Sales, 2026-09-22).

**Step 4, the ruling.**

- **Something declares it, `status: live`:** the dependency is real and proven. Lock the offer.
- **Something declares it, `status: chosen`:** the tool is named but has never been proven against a real call, so treat the dependency as unconfirmed rather than satisfied. Lock the offer and record the signal as a dependency for `/data-point-discovery` to verify at step 3.3. Say so in one line when reporting the lock, so nobody reads `chosen` as working.
- **Nothing declares it:** **the offer is not locked.** Take one of two exits, in this order: drop the signal dependency if the offer still works without it (often it does, and a signal-free offer is the stronger shape anyway), otherwise move to the next-highest-scoring candidate and re-run this check on it. Do not invent a vendor, and do not assume a capability the contract does not name.

Record the outcome either way in `offer.lead_magnet_signal_dependency` (see Save Output). `none` is the common and preferred value.

**This does not replace the Stack Resolution stop at the top of this skill.** If a role this skill actually needs to run is empty in the contract, that stop still fires and still routes to `/stack-setup`. This check is narrower: it is about whether the chosen offer's premise is obtainable, and its remedy is a different offer rather than a different stack.

Lock One Primary Plus Validation Arms (the first-wave offer count, Offers are placed by fit, Rules for arms, After the wave) moved verbatim to `.claude/skills/lead-magnet-brainstorm/references/lock-and-validation-arms.md`. Read it when the house flow locks, when Aaron's rank 1 is `yes_honored_by: client`, or when a question comes up about arms sharing the list, the offer count, launching together, arm status or a winner's promotion; in recorder mode Aaron's ranking and count still win. Offer QA at lock, its last subsection, stays here because it runs on every lock, recorder mode included.

### Offer QA at lock (market-evidence-standard.md section 12)

Before the lock is written, check every locked offer: the primary and every arm, and, when the client has per-buyer-type offer sets, the primary and every arm of each `offer.segments` set:

- It carries `cluster_ids`, `evidence_ids`, `evidence_strength` and `pain_angle`, or an explicit `unevidenced` or `contrarian` label with its reason.
- Every cluster it cites exists in `_research/pain-clusters.md`, and its evidence IDs resolve in the evidence ledger (`_research/evidence.csv`).
- No offer cites a `model_hypothesis` (a model's persona research, or the client's unverified `buyer_pain_hypothesis`) or a `competitor_claim` as its evidence.
- An offer resting on a low-confidence cluster carries that label into its Evidence line and its slate entry.

An unevidenced or contrarian offer still locks and runs as an arm; the label exists so the read-out can tell a failed hypothesis from an untested one. A missing Evidence line is fixed before lock, never waved through. This check adds no pause: under `auto_execute` it runs inside the lock.

## Offer sets per buyer type (operator decision 2026-09-22)

When `/cold-email-kickoff` Step 2.5 confirms two or more buyer segments whose pain or offer fit genuinely differ, **each segment gets its own offer set**: its own primary, validation arms, disqualifiers, client-OK state, proven flag and scale review, generated from that segment's own `Candidate Generation Input` rows. One offer stretched across buyer worlds is urgent to nobody (Aaron defines one buyer per offer, doctrine §5 step 1). A single-segment client, or one whose segments share the same pain and offer fit, is unchanged: the top-level `offer` block is its one set and `offer.segments` is not written. Either way, fit-matched placement applies across the list segments inside each buyer type: each offer runs in every list segment it fits, its own fit filters deciding, not across every list segment (Offers are placed by fit, above; operator decision 2026-09-23, Aaron pre-launch gap audit).

- **Where the sets live:** `offer.segments` in `client-profile.yaml`, one entry per segment, keyed by the slug from the confirmed segment list (the same value `/tam-build` writes in each row's `segment` column). Each entry carries every field of the primary block (Save Output), plus `label` (the plain buyer-type name the client slate shows), `priority` (1 is first), `offer_market_proven` and `scale_review`.
- **The top-level block mirrors the priority-1 segment's set,** so every reader that only knows `offer.lead_magnet` keeps working. When that segment's winner changes, update both places.
- **The resolution rule every consumer uses:** for a company, contact, cell or campaign that belongs to a segment, read `offer.segments[<segment>]` when the client has per-buyer-type offer sets, otherwise the top-level `offer` block.
- **Every gate in this skill runs per segment:** each set gets its own ranked candidates, its own validation arms (no cap), its own Signal-Capability Check, its own scale notes and qualification rules, and its own list definition (disqualifiers, `icp_inclusion`, `title_stack`). `lead-magnets.md` gets one `## Segment: <label>` section per set, and `## Every candidate` lists each segment's candidates under its label.
- **Testing and scale are per segment too:** `/campaign-strategy` runs one Offer-Validation Wave per buyer type on that buyer type's own list, and inside it places that buyer type's offers by fit across its list segments (Offers are placed by fit, above; operator decision 2026-09-23, Aaron pre-launch gap audit), and the first-wave offer formula runs per buyer-type segment on that segment's qualified contacts. Each segment flips, picks its own winner, scales it straight to the rest of its own TAM and gets its own results report (`offer.segments[].offer_market_proven`, `offer.segments[].scale_review`); a segment never borrows another segment's winner. When the client's sending fleet cannot carry every segment's wave at the one-week pace, every segment still launches, the runway stretches, and the priority segments go first in send order (`run_state.capacity_request`). `/offer-test-slate` shows every segment's offers in one client deck, and runs a scale review per segment as each wave reads out, alongside that segment's scale-up (Aaron process alignment, operator directive 2026-09-22).

Output (the per-candidate block the house flow shows, ranked, before locking) moved verbatim to `.claude/skills/lead-magnet-brainstorm/references/house-brainstorm.md`. In recorder mode `lead-magnets.md` carries Aaron's offers under the headings Save Output names.

## Execution Mode Gate

In the Aaron lane (the default, top of this file) the ranked options are Aaron's, and this gate records his call as below. After scoring is complete and ranked options are ready, check `run_state.execution_mode` from `client-profile.yaml`:

Whichever mode applies, the primary offer and every validation arm must clear the buyer-side checks (or be deliberately picked by the operator, with its label shown), clear the Signal-Capability Check, carry its honoring fields (`lead_magnet_yes_honored_by`, `lead_magnet_client_dependency`, `lead_magnet_client_ok`, `lead_magnet_scale_needs`), carry either a scale note that fits the planned volume or an `offer.qualification` rule (an offer with neither is saved ranked down, with the reason), and carry its list definition (`offer_fit_disqualifiers`, plus `icp_inclusion` and `title_stack`) before it is saved (Aaron process alignment, operator directive 2026-09-22). None of these is a pause: the check passes instantly for any offer that needs no signal, and the fields and the disqualifier list are written from the locked offer in minutes. The four fulfillment artifacts are written before an offer sends.

- `auto_execute`: select the highest-ranked candidate that clears the checks and can send today as the primary, and every other qualifying candidate as ranked validation arms (preferring a different bucket for arm 1), all automatically. Do not pause for input. Run the Signal-Capability Check on each; if one fails (nothing in the contract can obtain the signal it depends on), drop the signal dependency or move down the ranking and re-check, still without pausing. Report: "Auto-selected offer: [name] (score: X/7), plus validation arms: [name (score), ...]. First wave: max(3, qualified contacts / 2,000) of these, capped at [N] qualifying, launched together once the TAM gives the count. Reason: [one-sentence rationale tied to ICP pain]. Signal dependency: [none, or the signal plus its ruling]." If fewer than three offers qualify, or no arm survives, say so in the report (Lock One Primary Plus Validation Arms); for a validated Go offer, `validation_arms: []` is normal and the report says "validated Go offer". Then write the list definition (disqualifiers, inclusion filters, title stack), the scale notes and qualification rules, and the fulfillment plan, proceed to Save Output, and hand the test set to `/offer-test-slate` (slate mode).
  - **Archetype K under `auto_execute` (reworked 2026-09-22).** A tool may be auto-locked as an arm like any other candidate: building it for the test is agency work in Claude Code (K2), so no human funding commitment is needed. Putting it live on a subdomain is a live-system change, so that one deploy step pauses for the operator per `/autonomous-execution-policy`, and the tool arm is not scheduled into a flight until it is live.
- `review_gates` (opt-in since 2026-09-24): display all ranked candidates with the recommended primary and validation arms marked. Ask the operator to choose the primary and confirm the arms before saving. Do not continue to strategy or copy until a selection is made.

## Offer-Fit Disqualifiers (produced HERE at offer lock, consumed by `/tam-build`)

Once the offer is locked, before saving, write the list of company types that **cannot use this offer**. This is a required output of offer lock, not an optional extra. Write one list for the primary (`offer.offer_fit_disqualifiers`, the one `/tam-build` reads) and one inside each validation arm. Only the disqualifiers every first-wave offer shares apply to the shared first-wave list; an arm's own extras apply only inside its own cell or on its own offer-derived list (Lock One Primary Plus Validation Arms; Aaron process alignment, operator directive 2026-09-22; supersedes "an arm's list should add no company type the primary's keeps"). Because `/tam-build` applies the top-level list to the whole shared TAM, write into it only company types the whole offer set disqualifies (the four defaults below usually are). A company type only the primary disqualifies stays in the TAM: write it to `offer.primary_cell_disqualifiers` (and name it in `lead-magnets.md` under `## Offer-fit disqualifiers`) as a skip for the primary's own cell, which `/campaign-strategy` applies at cell assignment, so no other offer's list shrinks for it and the primary's cell is no larger than its fit (fit-matched placement, operator decision 2026-09-23). For per-buyer-type offer sets, each `offer.segments` entry carries its own `primary_cell_disqualifiers` for that set's primary.

**Why it lives here.** `/tam-build` runs a free disqualifier pre-screen before any paid classification, and it asks Aaron's gate question: *can this business actually use, stock, deploy, or buy the thing the offer delivers?* That question cannot be answered without the locked offer, and the offer is only known here. Producing the list at lock time is what lets the list build drop hopeless companies for free, before enrichment spend.

**The exact field and location `/tam-build` reads (do not rename, do not relocate):**

```text
outbound/profiles/<business-slug>/client-profile.yaml  ->  offer:  ->  offer_fit_disqualifiers
```

Shape, one entry per disqualified company type:

```yaml
offer:
  offer_fit_disqualifiers:
    - category: <short stable slug, e.g. already_owns_equivalent>
      why: <one line on why this company type cannot use the locked offer>
      check: <the observable that decides it: a firmographic field, the discovery snippet, or a NAME+DOMAIN category match>
```

**Start from these four and keep whichever genuinely apply to this offer.** Do not pad the list; a disqualifier that does not really apply costs real companies.

- **Already has their own version of it.** The canonical case: a company that already owns or runs the thing the offer delivers has nothing to gain from it.
- **Franchise, branch, or head-office-controlled entities that cannot decide locally.** The offer may fit the business perfectly while the person reachable at that location has no authority to say yes.
- **No operational capability to use the deliverable.** No physical footprint, no team, no system, or no process the deliverable plugs into.
- **Existing customers of the client.** Already in the relationship, so a cold front-end offer is at best noise.

**Write the field even when nothing is disqualified.** An empty list and a missing list mean different things to `/tam-build`:

- `offer_fit_disqualifiers: []` plus a one-line `notes` saying why means "this offer genuinely excludes no company type". The gate runs and drops nobody.
- The field **absent** means this step never ran (the normal state for an offer locked before this field existed). `/tam-build` then derives the list itself from the locked offer and says so in its build report, rather than assuming nobody is disqualified. It does not send an already-locked offer back through selection.

**Keep each `check` cheap and precise.** The pre-screen is free only if it reads fields the discovery source already returned. Where a check is a category match, hold `/tam-build`'s existing NAME+DOMAIN-only matching discipline: match on the company name and domain, never on a keyword or specialty blob. Loose keyword matching over-drops real ICP accounts (the repo records 290 false positives against 23 true hits from the looser approach). If a disqualifier can only be decided by a keyword scan or a guess, say so in `check` and let `/tam-build` handle it as a judgement call rather than an auto-drop.

Also write the same list in plain prose into `lead-magnets.md` under a `## Offer-fit disqualifiers` heading, so the operator can see and challenge it. The YAML in `client-profile.yaml` is the source of truth that `/tam-build` reads; the markdown is the human-readable mirror.

## The Offer Writes the List Definition: `offer.icp_inclusion` and `offer.title_stack` (at lock, consumed by `/tam-build`; Aaron process alignment, operator directive 2026-09-22)

The disqualifiers say who cannot use the offer. The offer also says who the list must include and whom to email there, because Aaron derives the list filter from the offer: his Sep 21 build filtered for companies that "has a free trial" because the offer sold trial sign-ups. The intake ICP is a starting point, not a ceiling: the offer may widen or narrow it. So at lock, beside `offer_fit_disqualifiers`, write:

- **`offer.icp_inclusion`**: the offer-derived inclusion filters for the shared first-wave list, one entry per company trait the offer needs (`filter`, `why`, `check`). Each `check` must be obtainable through a capability the stack contract declares, so it passes through the Signal-Capability Check like a signal dependency. Write `[]` with a one-line reason when the ICP's own filters already describe who can use every first-wave offer.
- **`offer.title_stack`**: the full job-title stack generated from the offer: the buying function and seniority it sells to (the intake asks for those, not one title) and every title and title variation that holds them, so `/tam-build` can map every ICP-matching decision-maker on every company (Aaron, May 4).

Both describe the shared list of the offer set: the traits every first-wave offer needs and the buying function they sell to. An arm that needs a materially narrower or different list carries its own `icp_inclusion` and `title_stack` inside its `validation_arms` entry and runs on its own offer-derived list (Lock One Primary Plus Validation Arms). Mirror both in `lead-magnets.md` under a `## List definition` heading. When the fields are absent (an offer locked before 2026-09-22), `/tam-build` derives them from the locked offer and says so in its build report.

## Save Output

Save the brainstorm to:

```text
profiles/<business-slug>/lead-magnets.md
```

After the offer is selected (by operator choice or auto_execute), update `client-profile.yaml` with:

```yaml
offer:
  lead_magnet: <top pick name>  # the PRIMARY offer; still the only field that means "locked"
  aaron_rank: <n>               # Offer Readiness 2026-09-28: the offer's rank in Aaron's offer call (1 = the priority set's primary); same mapping as lead_magnet_client_ok, above it. Not validation_arms[].rank
  lead_magnet_details: <one sentence on what gets delivered, including any material eligibility the offer states up front ("for teams that fit X"), so copy carries it>
  cluster_ids: [<C-xx>]         # 2026-09-24 (market-evidence-standard.md section 12): the pain clusters this offer answers; [] only when evidence_strength is unevidenced or contrarian
  evidence_ids: [<E-xxxx>]      # 2 to 4 representative evidence-ledger rows behind it
  evidence_strength: <strong | good | supporting | unevidenced | contrarian>
  pain_angle: <one line in the buyer's words that the campaign cell carries>
  feedback_ids: []              # written after launch by /market-evidence feedback: reply evidence IDs about this offer
  feedback_summary: null        # one line, in the buyers' words, written by /market-evidence feedback
  lead_magnet_cta_direction: <plain-English ask direction with deliverable, usefulness, and delivery constraint, not final copy>
  lead_magnet_gap: <the loop the asset REOPENS - what the prospect still won't know after consuming it (Next-Step Gate). Required for any real magnet; omit only for `direct_offer`>
  lead_magnet_next_step: <the call / analysis that fills that gap - what the reply routes to>
  lead_magnet_build_owner: <archetype K only: who built it for the test, where it is hosted, and who pays the hosting (K2). Long-term ownership and maintenance are settled in /offer-test-slate scale review>
  lead_magnet_signal_dependency: <`none` when the offer needs no observable buyer signal (common, preferred), otherwise the signal named in one line plus the Signal-Capability Check ruling (`live` / `chosen, unproven`). Read by /data-point-discovery at step 3.3>
  lead_magnet_yes_honored_by: agency   # agency (default) | client: who honors a qualified yes (Deliverable at Send Scale)
  lead_magnet_client_dependency: none  # or the one thing only the client can provide
  lead_magnet_client_ok: not_needed    # not_needed (agency) | pending | yes | no. Sends only at not_needed or yes, never on silence; drafted at pending, Start held (a client-honored primary can be pending, flagged at checkpoint 2)
  lead_magnet_client_ok_by: null       # evidence trio (Offer Readiness 2026-09-28): null at lock; set only by offer_approval.py
  lead_magnet_client_ok_at: null
  lead_magnet_client_ok_evidence: null
  delivery_mode: agency                # agency | client_input | client_delivers | call_only; a detail of lead_magnet_yes_honored_by, set at lock
  capacity: null                       # arithmetic only, where known (offer-readiness.md); the cap lives in qualification.free_unit_cap_per_week
  lead_magnet_scale_needs: <what delivering it at the planned send volume takes, from whom, and whether it fits (the lock check, Deliverable at Send Scale); never a reason to drop>
  qualification:                # Aaron process alignment 2026-09-22. Only for a costly front end (trial, service, custom work); absent for a cheap asset. Required at lock when the scale note does not fit
    criteria: [<plain fit test>, ...]          # who gets the free unit; everyone else gets the standard offer
    form_fields: [<question>, ...]             # the short disclosed form after the yes (e.g. revenue, fit, website)
    free_unit_cap_per_week: <n or null>        # null until /offer-test-slate scale review sets it; never above the client's confirmed capacity where the client supplies the deliverable
  icp_inclusion:                # Aaron process alignment 2026-09-22. Offer-derived inclusion filters for the shared list (e.g. "has a free trial" when the offer sells trial sign-ups); /tam-build reads these beside the disqualifiers
    - filter: <short stable slug>
      why: <why the offer needs this company trait>
      check: <the observable that decides it; must pass the Signal-Capability Check>
  title_stack:                  # Aaron process alignment 2026-09-22. The full job-title stack generated from the offer; /tam-build pulls every ICP-matching decision-maker on every title variation
    function: <the buying function the offer sells to>
    seniority: [<levels>]
    titles: [<every title and its variations>]
  offer_fit_disqualifiers:      # REQUIRED at offer lock. Company types that cannot use this offer; /tam-build reads this in its free pre-screen. `[]` means none apply; absent means this step never ran
    - category: <short stable slug>
      why: <why this company type cannot use the locked offer>
      check: <the observable that decides it; NAME+DOMAIN only for category matches>
  primary_cell_disqualifiers: []  # 2026-09-23 (fit-matched placement). Company types ONLY the primary disqualifies, same shape as above; /campaign-strategy skips them in the primary's own cell at cell assignment. /tam-build never reads it, so the shared TAM keeps them for the other offers
  validation_arms:              # 2026-09-21 (operator-approved Aaron alignment, doctrine §5); uncapped 2026-09-22. Every qualifying candidate, ranked. First wave = max(3, floor(qualified_contacts / 2000)) offers, capped at the qualifying candidates, set by /campaign-strategy from the list, never from send capacity (Aaron process alignment 2026-09-22); [] only when no second candidate qualifies or for a validated Go offer (say why in lead-magnets.md)
    - rank: 1                   # every arm inside the first-wave count launches with the primary the same day, placed by its own fit filters with shared ground split evenly (operator decision 2026-09-23, Aaron pre-launch gap audit); arms beyond the count queue
      flight: <set by /campaign-strategy: 1 = first wave, 2 = next flight; unset = queued>
      read: <written by /campaign-strategy at each read: n, k, time-agreed replies per 1,000, verdict, date>
      status: active            # active | deactivated (no proper responses in the wave) | farming_interest (PROVEN on positives but losing on time-agreed replies per 1,000; reshape to filter better, not scaled) | promoted (won; its fields now sit in the primary block above) | vetoed (the client asked us not to send it) | hold (still reading at the winner pick; stops receiving new first touches, its live sequences finish, its read is recorded as unresolved and it can return as a later test; Aaron process alignment 2026-09-22, supersedes "keeps its cell") | works (PROVEN but not the winner)
      lead_magnet: <arm name>
      aaron_rank: <n>             # this offer's rank in Aaron's offer call; not the arm's own rank above
      lead_magnet_details: <one sentence on what gets delivered>
      cluster_ids: [<C-xx>]       # same fields as the primary (market-evidence-standard.md section 12)
      evidence_ids: [<E-xxxx>]
      evidence_strength: <strong | good | supporting | unevidenced | contrarian>
      pain_angle: <one line in the buyer's words>
      feedback_ids: []            # /market-evidence feedback, after launch; never touches status, read or flight
      feedback_summary: null
      lead_magnet_cta_direction: <plain-English ask direction, not final copy>
      lead_magnet_gap: <the arm's own unresolved motive (Next-Step Gate); omit only for `direct_offer`>
      lead_magnet_next_step: <the call / analysis that resolves it>
      lead_magnet_build_owner: <archetype K only (K2)>
      lead_magnet_signal_dependency: <`none`, or a signal the shared list already carries (or its own offer-derived list carries), plus its ruling>
      lead_magnet_yes_honored_by: agency   # agency | client
      lead_magnet_client_dependency: none  # or the one thing only the client can provide
      lead_magnet_client_ok: not_needed    # not_needed | pending | yes | no. The arm sends only at not_needed or yes; drafted at pending, Start held
      lead_magnet_client_ok_by: null       # evidence trio: null at lock; set only by offer_approval.py
      lead_magnet_client_ok_at: null
      lead_magnet_client_ok_evidence: null
      delivery_mode: agency                # agency | client_input | client_delivers | call_only
      capacity: null                       # same as the primary's
      lead_magnet_scale_needs: <what delivering it at the planned send volume takes, from whom, and whether it fits>
      qualification: <same shape as the primary's; absent for a cheap asset>
      icp_inclusion: []             # only when this arm needs its own offer-derived list; otherwise it shares the set's list
      title_stack: null             # same rule
      offer_fit_disqualifiers: []   # same shape as the primary's; only the disqualifiers every first-wave offer shares apply to the shared list, and this arm's extras apply only in its own cell or its own list (Aaron process alignment 2026-09-22; supersedes the union rule)
  segments:                     # operator decision 2026-09-22. Only when kickoff Step 2.5 confirmed 2+ segments whose pain or offer fit differ; absent otherwise
    - segment: <slug from the confirmed segment list; matches the `segment` column in tam.csv>
      label: <plain buyer-type name, as the client slate shows it>
      priority: 1                 # 1 = the segment the top-level offer block mirrors
      lead_magnet: <this segment's primary>   # plus every other field of the primary block above, including the evidence fields (cluster_ids, evidence_ids, evidence_strength, pain_angle, feedback_ids, feedback_summary), with aaron_rank, the evidence trio, delivery_mode and capacity included
      offer_fit_disqualifiers: []
      primary_cell_disqualifiers: []  # same rule as the top-level field: company types only this segment's primary disqualifies, skipped in its own cell at cell assignment
      validation_arms: []         # same shape as the top-level validation_arms, evidence fields included
      offer_market_proven: false  # this segment's own flip (/campaign-strategy)
      scale_review: null          # this segment's own scale review (/offer-test-slate): a results report plus its winner's offer.qualification review, run alongside that segment's scale-up
```

**Offer Readiness fields (operator decision 2026-09-28; `outbound/reference/offer-readiness.md`).** Every recorded offer, primary, arm or segment entry, carries `aaron_rank` in the same mapping as `lead_magnet_client_ok:`, above it and at the same indent, because the scripts find an offer's rank that way. The evidence trio sits on the three lines directly after `lead_magnet_client_ok:` (`_by`, `_at`, `_evidence`, same indent, no comment line between), is `null` at lock, and is set later only by `outbound/scripts/offer-readiness/offer_approval.py`, never by hand or by this skill. A client-honored offer is drafted at `pending` and its Start is held until the client's yes is recorded that way; silence never counts as a yes. Filling any readiness field this lock left out (`readiness_fields.py`) and writing the read-only board (`build_readiness.py`) belong to `/phase-2-research-offer` step 9, not to this skill.

**Write the fulfillment plan and the arms into `lead-magnets.md` as well**, since the four fulfillment artifacts live there rather than in the YAML: a `## Fulfillment plan` heading with one block per locked offer (primary first, then each arm) carrying `Delivery reply:`, `Input needed after yes:`, `If they don't qualify:` and `Paid next step, explained:`, plus the offer's `Qualification:` line (the criteria, form fields and weekly cap in plain words, or "none, cheap asset"), a `## List definition` heading mirroring `icp_inclusion` and `title_stack` in plain words (The Offer Writes the List Definition), and a `## Validation arms` heading listing each arm, its bucket, its score, and why it was chosen (or, when `validation_arms: []`, why no second candidate survived). Also write an `## Every candidate` heading: the full ranked list with each candidate's score, labels, who honors a qualified yes, scale note and qualification line, including the ones not in the test set, because `/offer-test-slate` shows all of them to the client. The reply-agent setup skill for the locked sending platform and `/campaign-copywriting` read the fulfillment plan from there. Every entry under `## Every candidate` and `## Validation arms` (and under each `## Segment: <label>` section) also carries its **Evidence**, **Pain angle** and (after launch) **Market feedback** lines, which makes `lead-magnets.md` the offer hypothesis register: every offer, the evidence it rests on, and what the market said to it (`market-evidence-standard.md` section 12).

**Plain text by default (operator decision 2026-09-28).** `lead-magnets.md` and every other file this skill writes to the client folder are plain-text markdown. Write a DOCX, PPTX or Google Doc copy only when the operator asks for one.

**When the wave picks a winner** (`/campaign-strategy` flip criterion), a winning arm's fields move into the primary block, the arm's `status` becomes `promoted`, and the previous primary is recorded as an arm with `status: deactivated` (or `works` when it is PROVEN on ground the winner does not share, the two-winners case in After the wave). The top-level `offer_fit_disqualifiers` stays the shared list `/tam-build` applies to the whole TAM, so the swap never copies an arm's full disqualifier list over it: the winner's own-only disqualifiers move into `primary_cell_disqualifiers`, and the previous primary's own-only disqualifiers move into its new arm entry (fit-matched placement, operator decision 2026-09-23). Record the swap in the activity log. It re-uses fields that already passed every gate here, so it is not a new offer lock.

`lead_magnet_gap` is what `/campaign-copywriting` reads to decide which delivery shape applies (the Delivery Message rule in its CTA Hierarchy, Hard Rule 36). A magnet with a real gap earns the pure-value delivery, and its required day 2-3 follow-up carries the ask, aimed at the gap; one without a gap carries one soft, refusable pointer to the next step in the delivery itself, because no follow-up aimed at a gap exists to carry it. For a promised asset, never propose times in the delivery reply, whether or not the asset leaves an open question; the next step sits one layer down and refusable ("calendar's on the next page if you think there's interest", examples §7.3; ledger R03). A direct, trial or service offer is not an asset delivery: its reply proposes two specific times plus the calendar (Aaron, Sep 21; Fulfillment First item 1; Aaron process alignment, operator directive 2026-09-22; supersedes "times are proposed only on explicit booking intent" for those offer types). So this field is load-bearing, not documentation. (operator-approved Aaron alignment, 2026-09-21: a magnet without a gap used to keep "a soft time-proposal at delivery".)

Do not overwrite or delete `offer.client_suggested_*` fields. They are useful context showing what the client originally believed.

Do not save exact CTA example fields from this skill. Exact CTA copy belongs to `/campaign-copywriting`.

## Client asks (`outbound/reference/client-messages.md`)

Anything a recorded offer needs from the client goes into the client's one unsent message, `profiles/<business-slug>/client-asks.md`: the yes or no for each client-honored offer, keyed `[offer-<aaron_rank>]` with class `BLOCKS-START`, one rough capacity question, and any input the offer cannot run without. This skill returns those items as data to the main session, which merges them into the file per `client-messages.md` (`/phase-2-research-offer` step 8); a sub-agent never writes the file itself. This skill never writes a separate ask file and never sends anything: Claude drafts, the operator sends. The client's answer is recorded only through `offer_approval.py` (`offer-readiness.md`), never inferred.

Common Mistakes moved verbatim to `.claude/skills/lead-magnet-brainstorm/references/common-mistakes.md`. Read it as a final self-check before saving a house-flow lock, or when a recorded field looks wrong.

## What To Do Next

The offer locks here, and the rest of the chain is built to fit it. `offer.validation_arms` travels with it: `/campaign-strategy`'s Offer-Validation Wave launches `max(3, floor(qualified_contacts / 2000))` offers together (capped at the qualifying candidates) across the whole qualified list (Aaron process alignment, operator directive 2026-09-22; supersedes "runs the primary plus at least one arm on the same broad list"), each offer in every first-wave list segment it fits, its own fit filters deciding, with shared ground split evenly (operator decision 2026-09-23, Aaron pre-launch gap audit). `offer.icp_inclusion`, `offer.title_stack` and `offer.offer_fit_disqualifiers` are the list definition `/tam-build` builds against. Once `offer.lead_magnet` is set in `client-profile.yaml` (by operator selection or auto_execute), the order is `/offer-test-slate` (slate mode: the client-facing test plan; client approval is optional, so the flow does not wait unless `run_state.offer_slate_approval = required`), then `/data-point-discovery` (step 3.3, where obtainability becomes a measurement against a locked offer rather than a guess), then `/tam-build` (which consumes the list definition from this skill and builds the TAM by filter by default: AI Ark `company_search`, then GetLeads `count_contacts`, recording `run_state.discovery_route`; operator decision 2026-09-28, which overrides "lookalike is a MUST") with `/social-proof-bank` running alongside it (its seed portion, the 5 to 10 companies that best fit the locked offer, runs first only for a group `/tam-build` sends down the lookalike route), then `/lead-scoring`, then `/campaign-strategy`. `/cold-email-kickoff` orchestrates that sequence, so on a guided run hand back to it rather than jumping ahead. On a phased run this lock is `/phase-2-research-offer` step 5: the slate, the per-offer list counts, the client asks and Offer Readiness follow as its steps 6 to 9, and the list build is `/phase-3-list`.

If you are already past the list build and strategy is the only missing piece, run `/campaign-strategy`.

If `execution_mode = review_gates` and no ranked option has been selected yet, stop and ask the operator to choose one. Do not continue to strategy or copy from brainstorm-only ideas.

If a campaign has already been selected, run `/campaign-copywriting`. That skill owns exact CTA wording and must apply `spam-word-checker.md` plus `cold-email-copy-best-practices.md` before copy is shown, saved, exported, spun, or uploaded.

## Outputs and stop conditions (recorder mode)

**Outputs** (all defined in the sections above):

- The `offer:` block in `profiles/<business-slug>/client-profile.yaml`, exactly as Save Output defines it, with each offer's `aaron_rank` and the Offer Readiness fields.
- `profiles/<business-slug>/lead-magnets.md`, plain-text markdown, with `## Fulfillment plan`, `## Validation arms`, `## Every candidate`, `## Offer-fit disqualifiers` and `## List definition`, plus one `## Segment: <label>` section per buyer-type set (Save Output, Offer sets per buyer type).
- The client-ask items, returned to the main session for the `client-asks.md` merge (Client asks).
- One activity-log line and a refreshed CURRENT STATE (Activity Log Protocol), then the hand-off to `/offer-test-slate` (What To Do Next).

**Stop conditions:**

- Research QA is DEEPEN with loops remaining: route back to `/offer-intelligence` (Required Input).
- Research QA is HOLD under `review_gates`: wait for the Gate 2 decision (Required Input).
- A client suggestion in the intel feed conflicts with a locked offer under `auto_execute`: stop this step and ask (Client Suggestion Rule).
- A role this step needs is empty in `outbound/stack-contract.yaml`: stop and route to `/stack-setup` (Stack Resolution).
- A rail still fails after Aaron's one fix round: hold only that item, keep everything else moving, and show it at the next checkpoint (`aaron-lane.md`, The rails).
- An archetype K tool's live deploy: that one step pauses for the operator (Execution Mode Gate).
- `review_gates` with no selection yet: stop and ask (Execution Mode Gate, What To Do Next).
- The policy hard stops (Interaction Policy).

A client-honored offer waiting on the client's yes is not a stop for this skill: it is drafted at `pending` with Start held, and the flow moves on.

## Where the rest lives

Every section below moved verbatim (same wording, numbering and headings) into the skill's own `references/` folder on 2026-09-28. The paths are from the repo root: they are not in `outbound/reference/`.

| Section (as headed in the original) | Now in | Read it when |
|---|---|---|
| Original frontmatter `description` (the full pre-2026-09-28 text) | the **From the former description** line at the top of this file | You need the long description's summary of the house flow |
| Opening paragraph on what this skill builds, the front-end offer standard, `direct_offer`, the Offer Architecture gate | `.claude/skills/lead-magnet-brainstorm/references/front-end-offer-standard.md` | Aaron returns `direct_offer` or no free front end, or a `cta_direction` needs its risk-reversal context |
| AI/API Routing | `.claude/skills/lead-magnet-brainstorm/references/house-brainstorm.md` | The operator asks for the full brainstorm (the no-AI-API rule itself holds everywhere; see the pointer after Client Suggestion Rule) |
| Required Input (the house flow's brief inputs: the five sections, Candidate A, no-brief prompt) | `.claude/skills/lead-magnet-brainstorm/references/house-brainstorm.md` | The operator asks for the full brainstorm |
| Intake | `.claude/skills/lead-magnet-brainstorm/references/house-brainstorm.md` | The operator asks for the full brainstorm |
| Offer Archetypes (the canonical A to K table) | `.claude/skills/lead-magnet-brainstorm/references/offer-archetypes.md` | You need an archetype letter (the saturation map, `/campaign-strategy`'s Offer Archetype column), or the house flow runs |
| Archetype K: the interactive tool (the four gates K1 to K4, Building value into the tool, Build path) | `.claude/skills/lead-magnet-brainstorm/references/offer-archetypes.md` | An offer is an interactive tool: before filling `lead_magnet_build_owner`, the gap-fill math or a tool's gap (K3, K4) |
| Saturation Rule | `.claude/skills/lead-magnet-brainstorm/references/saturation-and-scale.md` | The operator asks for the full brainstorm |
| Per-account custom work is open for testing | `.claude/skills/lead-magnet-brainstorm/references/saturation-and-scale.md` | An offer is per-account custom work (a teardown, mockup, sample or personalized page); read it beside the Artifact-Truth Gate |
| Deliverable at Send Scale: who honors a qualified yes (formerly "Test First, Ask About Scale After") | `.claude/skills/lead-magnet-brainstorm/references/saturation-and-scale.md` | Aaron returns `yes_honored_by: client`, a `qualification` block or a scale note that does not fit; you need the prose definition of `offer.qualification` (its YAML shape is in Save Output above) or the client-supplied-capacity carve-out; or the house flow runs |
| The Diagnostic Order | `.claude/skills/lead-magnet-brainstorm/references/house-brainstorm.md` | The operator asks for the full brainstorm |
| Generate Candidates Across Aaron's Three Buckets | `.claude/skills/lead-magnet-brainstorm/references/house-brainstorm.md` | The operator asks for the full brainstorm |
| The Four-Sentence Test and the Scale Note | `.claude/skills/lead-magnet-brainstorm/references/house-brainstorm.md` | The operator asks for the full brainstorm |
| The "Why Not?" Test and the Farming-Interest Check | `.claude/skills/lead-magnet-brainstorm/references/house-brainstorm.md` | The operator asks for the full brainstorm |
| The Weak-Offer Screen | `.claude/skills/lead-magnet-brainstorm/references/house-brainstorm.md` | The operator asks for the full brainstorm |
| Score Ideas (the 7-point buyer-pull rubric and the buyer-side labels) | `.claude/skills/lead-magnet-brainstorm/references/house-brainstorm.md` | The operator asks for the full brainstorm, or a skill needs the rubric's criteria |
| Lock One Primary Plus Validation Arms (the first-wave offer count, Offers are placed by fit, Rules for arms, After the wave) | `.claude/skills/lead-magnet-brainstorm/references/lock-and-validation-arms.md` | The house flow locks, Aaron's rank 1 is `yes_honored_by: client`, or a question comes up about arms sharing the list, the offer count, launching together, arm status or a winner's promotion (Aaron's ranking and count still win in recorder mode) |
| Output (the per-candidate block) | `.claude/skills/lead-magnet-brainstorm/references/house-brainstorm.md` | The operator asks for the full brainstorm |
| Common Mistakes | `.claude/skills/lead-magnet-brainstorm/references/common-mistakes.md` | A final self-check before saving a house-flow lock, or when a recorded field looks wrong |

Still in this file, for the names other skills cite: Save Output, recorder mode (the top), never-hidden candidates (Material Decision Rule), Stack Resolution, the Artifact-Truth Gate, the Next-Step Gate, Fulfillment First, the Signal-Capability Check, Offer QA at lock, Offer sets per buyer type, the Execution Mode Gate (the offer-selection pause under `review_gates`), Offer-Fit Disqualifiers, the list definition, the `offer.qualification` field (Save Output) and Client asks.
