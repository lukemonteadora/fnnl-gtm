---
name: lead-magnet-brainstorm
description: Builds and locks the front-end offer set for cold email (Aaron's three buckets; a lead magnet is one bucket, not a separate step). Use after /offer-intelligence discovery mode, whose Candidate Generation Input block it consumes directly rather than re-deriving buyer pain. The offer set LOCKS here, before the list build. Generates candidates across Aaron Shepherd's three offer buckets (service-based, service-delivery-based, lead-magnet or asset-based) with no client-willingness, capacity, effort or free-trial limits at ideation (operator directive 2026-09-22), labels each with the four-sentence test, the why-not and farming-interest checks, the weak-offer screen and who honors a qualified yes, and scores every candidate on a 7-point buyer-pull rubric while keeping all of them visible. Then it checks run_state.execution_mode. auto_execute locks the top-ranked offer that can send today as the primary plus every other qualifying candidate as ranked validation arms (offer.validation_arms, no cap) and proceeds without pausing, and the first wave later launches max(3, qualified contacts / 2,000) of them together, capped at the qualifying candidates, with no head start for the primary, each offer placed only in the list segments its own fit filters admit and shared ground split evenly (operator decision 2026-09-23); review_gates presents ranked options and waits for operator selection. At lock each offer records a scale note showing it is deliverable at the planned send volume or an offer.qualification rule, states material eligibility honestly, passes the Signal-Capability Check (any signal the offer depends on must be obtainable by a capability the stack contract declares), and writes the offer-derived list definition (offer.icp_inclusion, offer.title_stack and offer.offer_fit_disqualifiers) that /tam-build consumes. An existing offer rated Go by validation mode makes new arms optional. The locked set goes to /offer-test-slate for the client. Exact CTA copy is written later in /campaign-copywriting.
---

# Front-End Offer Builder (lead-magnet-brainstorm)

This skill builds and locks the **front-end offer set**: the free, concrete offers a cold email leads with, generated across Aaron's three buckets (service-based, service-delivery-based, lead-magnet or asset-based; doctrine §5). In Aaron's framework a lead magnet is not a separate concept and not a separate step. It is one of the three buckets (*"If you have a really valuable asset that helps them solve a problem, that's what you're offering"*, May 4; Jul 13 calls it "an intro offer ... a lead magnet offer"), and it is never the default: no bucket outranks another by default, and each candidate ranks on buyer pull alone. The skill name, the `offer.lead_magnet*` fields and `lead-magnets.md` keep their names only for compatibility with existing profiles and scripts; read "lead magnet" in them as "front-end offer" (Aaron process alignment, operator directive 2026-09-22).

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

**The front-end offer is one real, inspectable unit of the paid work, given free (operator-approved Aaron alignment, 2026-09-21; doctrine §3).** In this skill "lead magnet" means that front-end offer in any of its forms, not only a document. Aaron's standard for it: it is free and says so ("free" or "no cost"; leaving the word out is, in his words, "a huge miss", doctrine §3); it gives the most value for the least work on our end; its delivery odds are effectively 100% (doctrine §4); it bridges naturally into the core offer; it keeps its value if they decline (doctrine §5 step 7); it carries a truthful reason it is free; and it hides no condition ("Remove homework, not honesty", doctrine §3). Do NOT manufacture a filler asset (a generic PDF, a thin report) just to have one, because a useful piece of actual work beats a consultation, a generic audit, a big guarantee, or an AI-generated PDF (doctrine §3). When the client has no natural asset, look for the unit of the paid work first: that is not inventing an asset, it is the offer. These standards are design aims that shape and rank a candidate, never filters that remove one (operator directive 2026-09-22; see Deliverable at Send Scale).

**`offer.lead_magnet: direct_offer` stays a valid locked value, but it is now the exception, not the preferred outcome.** It means **no front-end offer at all, just the main service**: the email states the client's main service plainly and asks permission to share more. It is not a service-delivery front-end offer (one real unit of the paid work given free, such as a free creative or a free first piece of the work), which is a normal bucket-2 candidate that ranks on buyer pull like any other and is never second-class. Aaron never leads with the main service when a front end can exist ("Your offer is not your service", doctrine §3), which is why `direct_offer` stays the exception (Aaron process alignment, operator directive 2026-09-22). The List Gate, `/tam-build` and `/campaign-copywriting` still accept the sentinel in place of a front-end offer. Use it only when no unit of the paid work can honestly be given free, even to qualified yeses behind an `offer.qualification` rule, and only for a direct offer that is still a concrete, low-commitment next step: it passes the diagnostic order below and hits none of the weak-offer patterns (a service description, a stretch outcome promise, a performance guarantee on the core service; doctrine §6). Its shape is his lending email (examples §1.2, `[AS-client]`, his own paraphrase): state plainly what we offer, with no pitch. That email closes on "worth a quick coffee chat", a meeting ask, so take the shape, not the close. `direct_offer` is the exception, and Email 1 still closes with his permission CTA (ledger R17 retired the meeting ask), so a yes is permission to share more, not agreement to a call. The reply shares it in one or two sentences, then proposes two specific times plus the calendar, with no re-selling (Aaron, Sep 21: "Do you have some time available on X or Y? Here's my calendar ... the call is the mechanism"; the reply rule splits by offer type, see Fulfillment First item 1; Aaron process alignment, operator directive 2026-09-22; supersedes "proposes times only when the prospect asks to talk", operator-approved alignment 2026-09-21). His permission CTA is "Would that be worth sharing more?" by default (examples §4; `/campaign-copywriting` Hard Rule 32: permission to send or show something, never a meeting). Score it like any other candidate. (operator-approved Aaron alignment, 2026-09-21: this used to name doctrine §8's passive introduction as the legitimate shape, with examples §1.2 as his instance and its coffee-chat close left standing.) The earlier "direct offer is often preferred" paragraph is archived at `outbound/_archive/aaron-alignment-2026-09-21/lead-magnet-brainstorm--direct-offer-default.md` (doctrine §3: "Your offer is not your service", and "The front-end offer now outranks the guarantee-style main offer").

Final CTA wording must be handled by `/campaign-copywriting`. Keep CTA output here at direction level only, then let `/campaign-copywriting` apply the confirmed-deliverable gate and the permission-based, value-backed CTA framework.

CTA direction must still be specific enough to prevent generic copy. Name the deliverable, what the prospect receives, why it is useful, and what must be true before it can be promised. Do not leave `/campaign-copywriting` with only a vague "short note" direction unless that generic wording is the deliberate test.

Whatever offer wins must be able to pass the Offer Architecture gate at copy time: SQL vs MQL framing, the easy-to-say-yes-to test, and a named risk reversal (full gate in `/campaign-copywriting`). Prefer candidates with a clear, low-friction risk reversal. Flag any pick that has none so `/campaign-copywriting` can resolve it before Email 1. In Aaron's method the risk reversal is the free front end itself plus casual risk elimination ("We'll do this for free and then we only move forward if we actually see something worth implementing." `[AS]`, examples §5; it shows the shape, never paste it into client copy, doctrine §9 portability rule), never a money-back guarantee (his "incredibly washed out") and never a performance guarantee on the core service (doctrine §3, §6).

## Material Decision Rule

When this skill reaches a material fork, name the realistic options, recommend the strongest path, and explain why the main alternatives are weaker before committing.

Ask before choices that affect spend beyond an approved budget, provider routing, source of truth, list quality, campaign direction, client-facing output, live systems, scraping or account risk, or legal/compliance risk. For low-risk reversible choices, state the recommendation and proceed.

**Every candidate stays visible (operator directive 2026-09-22).** Do not filter offer candidates out of the ranked list or the client slate. A candidate that fails a buyer-side check keeps its place with its score, its label, and the plain reason it ranks where it does; it just does not enter the first wave by default. The only offers never proposed are ones that would be illegal or deceptive to send, and even then name what was dropped and why.

## Interaction Policy

Defers to `/autonomous-execution-policy`. Under `run_state.execution_mode = auto_execute` (the new-client default since 2026-09-24, paired with `review_protocol: phase_checkpoints` so a run stops only at `/cold-email-kickoff`'s four phase checkpoints; `review_gates` is opt-in), proceed without pausing: pick the strongest option per this skill's rubric, record it to `run_state`/profile, and continue - never re-ask a decision already in `run_state`, the profile, memory, or the operator's latest message. Stop only for the policy's hard-stops (spend over the approved ceiling, live send, credentials, provider/source-of-truth change, safety gates). On a long async wait, background-poll and move to other productive work - never idle.

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short: record status, not raw output. Full protocol: `client-activity-log.md`.

## Client Suggestion Rule

If `client-profile.yaml`, an onboarding form, call notes, or the operator includes a client-suggested lead magnet, treat it as Candidate A. Do not confirm it as the answer.

An offer or lead magnet the client suggested in a meeting or in Slack counts as a client suggestion under this rule, exactly like one in call notes. At the read-state step, right after the activity log's CURRENT STATE, read `profiles/<business-slug>/client-intel.md`: Needs attention and Open items in full, plus Recent activity tagged `offer`. A suggestion found there is a hypothesis: it never silently overwrites a locked offer or an operator-confirmed value, and a conflict goes to the operator (under `auto_execute`, it stops this step and asks). A missing feed, or one more than 2 days old (the newer of the client's own refresh stamp, `clients.<slug>.refreshed_at`, and the global `last_run_at` in `profiles/_intel/state.json`; `client-intel-feed.md` section 8), is a one-line flag at the top of the report, never a blocker; offer `/client-intel-sync <client>` for a fresh pull. Protocol: `client-intel-feed.md`.

Always generate at least 3 additional candidates before scoring, spread across Aaron's three buckets (Generate Candidates below). The client suggestion may win, but it must beat the alternatives on the same rubric and pass the same gates.

## AI/API Routing

All ideation runs in Claude Code (no-AI-API rule, operator directive 2026-09-22): no outside AI provider and no API key. Synthesizing the offer-intelligence brief (its Candidate Generation Input rows, buyer-pain vectors, and saturation map) and archetype-fit reasoning happen in the session; when that context is too large for one pass, fan it out to Claude sub-agents per `/personalization-subagent-pattern` (disjoint slices, one output file per agent, merge and dedupe). Strict rubric scoring and JSON output are done in the session against the rubric below. This skill reads existing research; it does not run new web research (that lives in `/offer-intelligence`). CTA wording stays at direction level for `/campaign-copywriting` (written in the native Claude Code session).

## Required Input

Before asking anything, check for:

```text
profiles/<business-slug>/offer-intelligence.md
```

**Discovery and candidate generation are one continuous offer motion split across two skills.** This skill is the second half of it, so it starts by reading what discovery already established rather than researching pain again. It runs no new web research of its own.

**Check the Research QA verdict first** (`research_artifacts.qa_verdict` in `client-profile.yaml`, or the Research QA section of `_research/pain-clusters.md`; `market-evidence-standard.md` section 7):

- **PASS**: proceed.
- **DEEPEN with loops remaining**: route back to `/offer-intelligence` Stage 2 rather than building offers on research the gate says is thin. Under `review_protocol: phase_checkpoints`, the operator has already ruled at checkpoint 2: when the operator chose to build offers, proceed with the gap's clusters labelled low confidence.
- **PASS with low-confidence labels after two loops**: proceed, carrying each cluster's label into every candidate that relies on it.
- **HOLD**: the step depends on the mode (operator decision 2026-09-23, Aaron pre-launch gap audit; matches the Research QA gate in `/cold-email-kickoff`). Under `review_gates`, the operator decides at Gate 2 (the offer-step review defined in `/cold-email-kickoff`): do not build offers on a HOLD until that decision is made, and follow it when one is already recorded. Under `review_protocol: phase_checkpoints`, the operator has already ruled at `/cold-email-kickoff` checkpoint 2: follow that answer. Under plain `auto_execute`, proceed with every cluster labelled low confidence, the HOLD reasons at the top of the report, and each cluster's label carried into every candidate that relies on it.
- **No verdict** (a brief written before the research layer landed, 2026-09-24): run `/market-evidence synthesize` first; it seeds the evidence ledger from the existing brief and research files.

If the brief exists, load these five sections **by name** and work from them:

1. **`Candidate Generation Input`** - the numbered persona + pain + open-archetype rows. **This is the primary input.** Generate candidates against these rows: each serious candidate answers a named pain for a named persona, in an archetype the saturation map left open. If the block carries the optional **cross-client priors** line (other clients' proven offers in this workspace, as patterns only), treat each prior as a hint about an offer shape worth trying, rebuilt around this client's real service and buyer; never carry another client's name, number or data into a candidate.
2. **`Pain by persona`** - the full table behind those rows, including any prioritized persona with no pain evidence (a named gap, not a blank to fill by guessing).
3. **`Saturation Map`** - the open, crowded, and saturated archetypes with their denominator.
4. **`First-Party Buyer Voice`** and **`ICP Pain (in their words)`** - the buyer's exact words, which the offer gets written in.
5. **`_research/pain-clusters.md`** - the clusters behind every row, with their counts, opportunity scores, Research QA labels and the Language bank (the verbatim buyer phrases per cluster). Every candidate names the clusters it answers (`market-evidence-standard.md` section 12).

**Read these rows, do not rebuild them.** Do not re-derive pain, re-rank personas, or re-research the market here. If `Candidate Generation Input` is missing or empty, that is the signal that `/offer-intelligence` discovery mode has not actually finished: route back to it rather than reconstructing its findings inside this skill.

Also load `profiles/<business-slug>/client-profile.yaml` if it exists. If it contains `offer.client_suggested_lead_magnet`, include that suggestion as Candidate A and preserve any `offer.client_suggested_lead_magnet_details` as delivery context.

If the offer-intelligence brief does not exist, under `auto_execute` run `/offer-intelligence` discovery first (the recommended answer) without asking. Under `review_gates`, ask using a native choice prompt:

```text
No offer-intelligence brief exists yet. What should I do?

A. [Recommended] Run /offer-intelligence discovery first
B. Continue with self-reported context and label the brainstorm weaker
C. Stop until the missing brief exists
D. Custom answer
```

## Intake

Under `auto_execute` (the new-client default since 2026-09-24), do not ask: answer each item from the profile, the website and the offer-intelligence brief, and put any item none of them answers on the next checkpoint. Under `review_gates`, ask one at a time using Claude Desktop native Interactive Inputs / Choice Prompts. When the profile, website, or offer-intelligence brief gives a likely answer, pre-fill it as the recommended option.

1. What do you sell, in one sentence?
2. What problem did your best customer have before buying?
3. What does your best customer get from you that they would happily pay for? (We look for a real piece of it to give away free. How much work that takes on our side is not a filter.)
4. What can you legally or operationally not promise?

Question 4 labels candidates; it does not shrink the list. A legal or regulatory limit rules an offer out (name it, and why, in the ranked list). An operational limit becomes that offer's client dependency, its scale note or its `offer.qualification` rule (Deliverable at Send Scale), never a reason to drop it (operator directive 2026-09-22).

Use this pattern for each open-text intake item:

```text
Confirm or correct this:

A. [Recommended] Use this response: <best response from saved context or research>
B. Use shorter version: <shorter answer>
C. Ask me one follow-up first
D. Custom answer
```

If no evidence supports a recommendation, use:

```text
I need this before the offer choice is useful:

A. [Recommended] Custom answer
B. Not sure - make a cautious assumption
C. Skip for now and mark unknown
```

If the discovery brief already answers question 2, use the brief instead of re-asking.

## Offer Archetypes

Use these as directions, not copy examples.

This table is the canonical archetype reference for the cold-outbound flow. The letters A-K are the single source of truth that `/offer-intelligence` (saturation map) and `/campaign-strategy` (Offer Archetype column) cite. Keep the letters and their order stable.

| Letter | Archetype | What it gives | Best when | Main risk |
|---|---|---|---|---|
| A | Audit or diagnostic | A short review of one measurable problem | Agencies, consultants, dev shops, compliance, operations | Everyone offers audits, so the angle must be specific. Never *name* the offer an audit ("the word audit is just so overplayed", doctrine §3): a bounded, evidence-based diagnostic ships under a name that says what decision it clarifies (ledger R09). The letter stays A as the saturation key |
| B | Data or research note | A useful finding about their segment or peer group | The client has data, benchmarks, or repeatable research | Generic reports get ignored |
| C | Competitive intel | A public pattern from competitors or peers | Buyers care about market movement | Fabricated competitor claims destroy trust |
| D | Template or checklist | A usable asset the prospect can apply | The client has a strong repeatable process | Gated PDFs kill replies |
| E | Introduction | A real intro to a useful person or group | The sender has the network | Fake or weak intros are worse than no offer |
| F | Quick-win work | A small piece of useful work | The work proves competence fast | Delivery cost can explode |
| G | Specific observation | A sharp point about the prospect | High-ACV or highly researched outbound | Thin research turns into fake personalization |
| H | Limited product access | A scoped trial or account | Activation is easy and support cost is low | Product friction kills the reply |
| I | Working session | A short session with one concrete outcome | High-ACV, later-stage buyers | It becomes a disguised sales call |
| J | Benchmark | A comparison against a peer set | The client can calculate the metric credibly | Weak benchmarks feel made up |
| K | Interactive tool | A self-serve calculator or audit that computes a result from the prospect's **own** numbers | The client has real data, a repeatable model, or a paid process worth productizing. Runs as its own arm in any wave, including the first (K1) | The gap-fill is per-responder work that scales with success; and a tool leaving no reason to talk dead-ends at "nice, thanks" |

## Archetype K: the interactive tool

Encoded from the Aaron Shepherd "589 positive replies in 60 days" method (transcript 2026-07-13), reshaped after an adversarial review 2026-07-17.

**Read the evidence honestly before you weight any of this (added 2026-07-17).** This archetype is a **playbook worth testing, not established doctrine**, and the rules below are defaults and design gates rather than laws. The source is one self-promotional YouTube case study: N=1, one client, 60 days, no control, no base rate, reported by someone selling an agency retainer and a paid accelerator off the same video. "Positive reply" has no external definition and is **self-graded by the sender** (in the sending platform the sender assigns the category), so it partly measures his labelling. Aaron's own site reports ~5M sends and ~3,000 calls booked in a year, which is roughly **one call per 1,667 emails**, the credible number in his corpus, precisely because it costs him something, and a useful anchor against the 589. Separately, the "interactive content converts 2x static" claim you'll meet everywhere traces to 2014 opinion polling of 185 marketers rating their *own* performance, sponsored by a company selling interactive-content software; no controlled study exists. None of this means the play is wrong. It means **our own data decides**, and until a build of ours produces a real reply-to-meeting number, nothing here is proven.

**What it is.** Not a PDF. A tiny self-serve page where the prospect drops in a few numbers they already know (store URL + monthly revenue + AOV + conversion rate; or annual revenue + adjusted EBITDA) and gets an instant, specific result computed from *their* inputs. No login, no gate, results in about 60 seconds. Aaron's live examples: a CRO audit showing where a store loses sales, a business-valuation calculator, and an outbound-vs-paid-ads ROI calculator.

**Why it beats a PDF.** A generic document could apply to 10,000 other companies, so it reads as mass-produced and gets ignored. A tool's output is about the reader's own business, so it feels custom without being custom. **The build is one-time and the tool itself then runs at ~zero cost per responder.** But do not stop reading there, because K3's gap-fill reintroduces a real per-responder cost that K2 exists to catch. The honest claim is narrower than "zero marginal cost forever": a tool is the cheapest way to make an asset *feel* bespoke at cold volume, and what it costs after that depends entirely on how expensive its gap is to fill.

**Aaron's own warning, and why the gates below exist.** His 589 is a count of **positive replies, not meetings.** He says it plainly: getting a reply and booking a call are two completely different things, and people who build magnets and calculators with no natural progression to the next step get lots of yeses and, in his words, *"such a low meeting to lead ratio"* (S06, transcript 2026-07-13; attribution corrected 2026-09-21: this used to paraphrase him as "a terrible meeting-to-lead ratio"). The tool is a reply engine by default; whether it also becomes a *meeting* engine is the open question K3 tries to answer, and the honest state of that answer is "plausible, unproven" (see K3). A tool that leaves the reader with no reason to talk is the shape most likely to produce polite dead ends.

### The four gates (K4 is HARD; K3 is a strong default; K1 and K2 reworked 2026-09-22)

These sit on top of the standard checks, not instead of them. **K4 must pass before a tool sends** (it protects the prospect's trust). **K3 is a strong default, not a veto**: a tool with no unresolved motive is heavily marked down and cannot be the top recommendation, but it is not auto-rejected, because the evidence under the mechanic is one unrun build (see K3). K4 governs whatever K3 produces: if there IS a gap, it must be real. **K1 and K2 used to keep tools out of the first test and behind a funded build commitment. The operator retired both limits on 2026-09-22** (the offer-limits removal; deliverability at send scale is now a lock check, see Deliverable at Send Scale), and they now read as below. The retired text is archived at `outbound/_archive/offer-limits-removal-2026-09-22/`.

**K1: a tool runs as its own arm, in any wave, and is judged on meetings (reworked 2026-09-22).** A tool may be tested in the first wave like any other offer. The risk the old rule guarded is real: a strong tool pulls positive replies on its own merits (Aaron: it "opens the floodgates"), so its yes rate says little about whether anyone wants the paid service. That risk is now handled in the measurement instead of by keeping the tool out of the test. A tool always runs as **its own validation arm**, never as the asset fronting another offer's cell (which would contaminate that offer's read), and like every arm it is judged on **time-agreed replies per 1,000 first touches**. Its positive replies alone can never flip `offer_market_proven` (`/campaign-strategy` magnet-inflation guard).

**K2: name who builds and hosts it for the test, and cost the gap-fill (reworked 2026-09-22).** A tool has TWO costs. **(a) The build** (`build_cost_hours`): for a test, the agency builds it in Claude Code (hours, per the build path below) and hosts it on a subdomain of a domain we already own. Record who built it, where it is hosted, and who pays the hosting in `offer.lead_magnet_build_owner`. Long-term ownership (the repo, the domain, any data it collects) and maintenance are settled in writing in `/offer-test-slate` scale review, before a client takes it over. **(b) The per-responder gap-fill** (`per_responder_fill_minutes`): if the tool has a gap (K3), the work of filling it for every prospect who takes it up (Aaron's own fill is a free TAM analysis delivered by hand). Any tool that clears K3 has per-responder work by construction, and that work grows with success. The agency honors it for qualified responders like any other front-end work. Its cost at the planned send volume (expected positive replies × work-per-fill) goes into `lead_magnet_scale_needs` at lock; where that does not fit, an `offer.qualification` rule caps how many responders get the hand-delivered fill each week, and the rest get the tool's own result plus the standard offer (Deliverable at Send Scale; Aaron process alignment, operator directive 2026-09-22; supersedes "for the scale review, where it sizes scaled volume"). It is never a reason to drop the tool. Keep the fill a bounded, pre-defined analysis with a per-responder time cap, ideally one a script produces (our `/tam-build` Phase A is the model: dollars, not hours), so it stays cheap to honor.

**K3: Leave an unresolved motive to talk (strong default; heavily marked down without one, not auto-rejected).** The chain to design against: the email opens a curiosity loop → the tool closes it → the tool leaves something unresolved → the call closes THAT. Aaron's instance: his ROI calculator's core input is total addressable market size, which almost nobody knows offhand, so the result is real but estimated and the natural next step is a free TAM analysis. Name what's unresolved and name the next step that resolves it, before the build.

**A knowledge gap is ONE way to do this, not the only way: do not read this as "hide an input".** The original framing ("the core input must be something the prospect can't know") is false as a universal and its counterexample is easy: a complete deliverability audit that tells them everything (SPF broken, DMARC at p=none, here are the six records to publish) has *zero* knowledge gap and converts precisely **because** it is complete, since completeness is what proved competence. The prospect doesn't want to know, they want it done. The real set of motives is wider:
- **Knowledge:** they can't compute the number themselves (Aaron's TAM).
- **Capability:** they now know exactly what's wrong and can't fix it in-house.
- **Capacity:** they could fix it, and will never get to it.
- **Delegation:** they'd simply rather someone else ran it.
- **Desire:** the tool told them a true number big enough to act on ("you're leaving $400k a year on the table" is complete information and a powerful motive).

Any of these is a valid unresolved motive. What fails is a magnet that leaves **none** of them: fully satisfying, nothing further wanted, no reason to reply again. Note the market evidence points the *other* way on the input question specifically: the closest published case study (CartHook's ROI calculator) deliberately chose "metrics that every store owner either knows or can easily access", i.e. the exact opposite of hiding one. So make the inputs easy and let the *motive* be what's unresolved.

**Why this is a default and not a hard gate.** The mechanic is plausible and Aaron's diagnosis of dead-end magnets is credible, but the evidence under it is thin: his flagship instance is a tool he had not yet run (the transcript shows hypothetical copy for it), and two of the three tools he actually describes as working client builds have no named gap at all. It has not earned veto power. A candidate with no unresolved motive is heavily marked down and cannot be the top recommendation, but it is not auto-rejected.

**K4: Whatever is unresolved must be real (the honesty gate on K3).** It cannot be manufactured by crippling the tool, hiding a field, or withholding output the tool could just give them. It has to be a genuine limit, and the next step has to actually resolve it. A fake gap is a trapdoor and it burns the trust the free asset just bought.

**K4 cannot be self-certified, and that is its main weakness.** The party judging whether the gap is real is the party that wants it to be real, and every agency sincerely believes its own gap is genuine. Prose introspection ("would they find it reasonable?") is not enough. Two ways to make it external, in order of preference:
1. **Ask five real ICP prospects** (or five of the client's own customers): *"did you know this number before?"* Four of five say no, the motive is real. Four of five say yes, the tool is a toy and the candidate dies. Costs a week and nothing, and it is the cheapest kill-test in this whole archetype.
2. **Let the gap be structural rather than designed** (the strongest form, because there is nothing to fake). If the honest limit is a tool's or the data's own boundary rather than our discretion, K4 satisfies itself. Worked example: if the company-discovery source exposes a free count-only query that structurally cannot accept a seed domain or ICP text (those being discover-only and paid), a TAM tool can compute a real free count from filters while the *better* seeded number genuinely requires the paid run. That limit is the tool's, not ours, so it cannot drift into a manufactured gap under commercial pressure. Read the stack contract for whichever tool fills the role, and confirm the limit is real before leaning on it.

Note the coherence problem to avoid: Aaron's own TAM-input trick is arguably a manufactured gap by construction (his calculator *could* have asked for easier inputs). Prefer form 2 where it's available.

### Building value into the tool (the inherent-value anchor)

A tool is worth what it cost to acquire, and the prospect can't see that unless you say it. Anchor it on something true and external, and make that the headline:

- **What it cost to produce the data:** "based on 10 million cold emails sent and $50,000+ in Meta ad spend." The reader is getting, free, a finding they would have had to spend that to learn.
- **What clients pay for the same process:** "this is the exact audit we run for clients paying $10,000+."
- **What the equivalent costs annually:** "this platform costs $6,000/year; this is the first look, free."

Anchor on something real. Aaron's own line on the neighbouring tactic (naming the prospect's industry in the copy) is the binding principle: *"I wouldn't go lying about the industry type"* (examples §1.6, his industry variant; S06, transcript 2026-07-13; attribution corrected 2026-09-21: this used to italicize a paraphrase, "don't lie about it"). Only claim the scale, the price, or the industry coverage if it is genuinely true and the data genuinely includes them. This anchor is a direction here; `/campaign-copywriting` owns the final wording and applies the anti-fabrication rule.

**Optional: a VSL in the tool's header.** A short video of the sender walking through how to read the result puts a face to the name, removes confusion about how to use it, and states the natural next step. Cheap, and it lifts the meeting rate rather than the reply rate.

### Build path (Claude Code, no engineer)

Recorded so the archetype is real rather than aspirational. Aaron built his in about seven plain-English prompts in Claude Code, non-technically. The sequence that worked:

1. Feed a reference: an existing tool of ours, or a competitor's, or any model found online. "Here's one for reference, build a new version."
2. Point it at the brand: existing brand guidelines if they exist, otherwise just the client's website: "follow the exact same branding as this site." This gets ~80% of the way there.
3. Rebuild the funnel logic, then restyle to the brand.
4. **Make the inputs easy, and put the unresolved motive somewhere real** (K3). Do NOT read this as "withhold a field": the published evidence runs the other way (CartHook deliberately chose metrics owners already know), and K4 forbids a gap manufactured by crippling the tool. Prefer a motive that is *structural* (a genuine limit of what a self-serve form can know, or a vendor/data boundary) over one you designed in.
5. Add the external reference point (the anchor above) and make it the headline, so it is the first thing seen.
6. Point the CTA at the unresolved motive, and make sure the next step genuinely resolves it.
7. **Push to a SUBDOMAIN of an established domain we already own**, not a fresh standalone one. This is a deliverability decision, not a convenience: Spamhaus treats unknown domain reputation as poor by default, and a brand-new calculator domain is exactly the unknown-reputation case, so it inherits nothing. A subdomain inherits the parent's reputation. **Hosting:** pick a static or edge host whose free tier permits commercial use and has headroom for the campaign's click volume. The arithmetic is small: a 100k-requests/day free tier covers a 30k-sends/day campaign at 5% click-through with about 1.5% of the allowance used. **Read the terms before choosing.** Several popular free tiers explicitly bar commercial use, which an agency build for a paying client hits twice over.

Build one when a tool candidate is in the test set (primary or arm). The agency builds it for the test (K2), so no separate funding decision is needed; putting it live on a subdomain is a live-system change, so that deploy step pauses for the operator per `/autonomous-execution-policy`. This recipe is the seed for a dedicated `/interactive-tool-magnet` skill (deferred 2026-07-17: build it against a real build, not a guess). **The cheapest first build is our OWN**, not a client's: FNNL Agency is buyer, builder and payer in one, so K2 self-satisfies, and a free count-only query on the company-discovery source, where the chosen tool offers one, gives a TAM tool a structural K4-proof motive (it cannot take a seed domain; the better seeded number is paid). Aaron makes the prospect *guess* their TAM; we can compute it.

## Saturation Rule

If `offer-intelligence.md` exists:

- Prioritize archetypes marked OPEN.
- A CROWDED candidate needs a clearly different delivery or a named gap competitors leave.
- A SATURATED candidate ranks lower (its differentiation score already carries the penalty) and must name the gap competitors leave, with its evidence. Saturation never removes a candidate, never keeps one with a named gap out of the first wave when its score earns a place, and never overrides a higher-scoring candidate. Heavy competitor ad spend behind the archetype is evidence of demand (Aaron, Sep 21). (Aaron process alignment, operator directive 2026-09-22; supersedes "rank SATURATED archetypes last and keep them out of the first test flight unless the operator picks one".)
- Use contrarian opportunities when they connect to real ICP pain. Delivery capacity is not a filter at ideation (operator directive 2026-09-22); it is checked at lock (Deliverable at Send Scale).

## Per-account custom work is open for testing (the Premium-tier deferral is retired, operator directive 2026-09-22)

Bespoke per-prospect offers are generated and ranked like any other candidate: a made-for-them teardown, mockup, sample, personalized landing page, deep intelligence report, or the report-as-lead-magnet play (tease a light version, build the full asset on a hand-raise). They are often the most compelling offers a buyer can get, and they are Aaron's signature move: do a piece of the actual work and send it (doctrine §1, §3).

- **The agency produces them for qualified yeses**, with Claude Code doing most of the build. The first wave sends at full volume, not as a small test, so a per-account offer carries an `offer.qualification` rule unless its scale note shows the agency can build one for every yes at the planned volume (Deliverable at Send Scale; Aaron process alignment, operator directive 2026-09-22; supersedes "at test scale the agency produces them for the handful to few dozen yeses a test brings").
- **Their cost at the planned send volume goes into `lead_magnet_scale_needs`** at lock and is shown to the client in the slate; `/offer-test-slate` scale review later reviews the qualification cap against real reply numbers.
- **A model-generated per-company artifact still passes the Artifact-Truth Gate below before the first one ships.** The cost of building fell; the cost of being wrong about a prospect's business did not.
- **The read is on meetings, not replies.** A strong custom artifact inflates positive replies on its own merits, so it runs as its own arm and is judged on time-agreed replies per 1,000 first touches (`/campaign-strategy`'s magnet-inflation guard), the same way as an archetype K tool (K1).

The old deferral ("a future, operator-decided premium product", "do not propose custom landing pages or per-account asset builds as a default lead magnet unless the operator has explicitly opened the premium tier") and its open question about AI cost are archived verbatim at `outbound/_archive/offer-limits-removal-2026-09-22/`.

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

## Deliverable at Send Scale: who honors a qualified yes (formerly "Test First, Ask About Scale After"; Aaron process alignment, operator directive 2026-09-22)

**Ideation has no client or capacity limits.** Never drop or down-rank a candidate at ideation because the client might not want it, because it needs a free trial or access to the client's product, because it takes real effort, or because it needs custom work per prospect. Rank candidates on buyer pull (Score Ideas). Aaron's own order is to generate a lot, test three or four, and *"let the market tell you what you should do"* (doctrine §3, §5). **Capacity is settled at lock, not after the test.** The first wave sends the whole qualified list at full volume, not a small test flight, so every locked offer must be deliverable *"at the scale of the emails that you're sending"* (Aaron, Sep 21). (Supersedes "the capacity question belongs after the market has picked a winner, in `/offer-test-slate` scale review", operator directive 2026-09-22.)

**The honesty rule: every QUALIFIED yes gets what the email promised, on time.** A cold email under the client's name is a promise to a stranger (doctrine §3: "Remove homework, not honesty"; §11: the reply is the start of the promise, not permission to change it). Aaron's own delivery standard, *"easy for you to fulfill"* (doctrine §2 step 2), is applied at the planned send volume. Two cases keep that honest at volume (supersedes "every yes in the test gets what the email promised", operator directive 2026-09-22):

- **A cheap asset stays ungated.** When a unit costs little to deliver (a document, a list we already build, a tool's own result, a short video), every yes gets it, and the offer carries no `offer.qualification`.
- **A costly front end gets a disclosed qualification step after the yes** (a trial, a free service or pilot, custom per-prospect work). A short form (for example revenue, fit, website) decides who gets the free unit and who gets the client's standard offer. Aaron, Sep 21: *"just because someone raises their hand doesn't mean you have to provide that free thing to them. You can now go through and cherry-pick"*, and interest *"just means that you've validated the demand"*. The step is disclosed, never a trapdoor: **material eligibility is stated honestly in the offer itself** ("for teams that fit X"), not hidden until after the yes (doctrine §3), and a yes that does not qualify gets the honest `If they don't qualify` reply (Fulfillment First).

So record, for every candidate:

- **`lead_magnet_yes_honored_by`: who honors a qualified yes.**
  - `agency` (the default). The agency owns the front end: inboxes, sending, replies, and delivering what the email promises. The client receives qualified conversations and delivers the paid service. The agency can honor almost any front-end offer with its own resources and Claude Code, including custom per-prospect work, inside its scale note or its qualification cap, so an `agency` offer needs no client input to send (`lead_magnet_client_ok: not_needed`).
  - `client`, when only the client can honor it: access to their product or a trial of it, a price, discount or guarantee term they would have to stand behind, their own people's time, their physical goods, or licensed or regulated work only they may do. Name the one thing in `lead_magnet_client_dependency` and set `lead_magnet_client_ok: pending`. The offer is ranked and shown like any other and goes in the client slate flagged "Needs your OK". It sends only once the client says yes. Silence is not a yes.
- **`lead_magnet_scale_needs`: the scale note.** What delivering it at the planned send volume takes, from whom, and whether that fits (for example "about 40 custom teardowns a week from our side, fits" or "the client's team honoring about 15 trials a week, needs a cap"). The planned volume is the offer's first-wave cell (about 2,000 first-touch contacts, first-touched over roughly one Monday-to-Friday sending week at the pace `/campaign-strategy` plans in `run_state.capacity_request`) and, if it wins, the rest of the TAM at that pace. Estimate weekly yeses from a stated benchmark positive-reply rate, labelled as an estimate, never an invented result.
- **`offer.qualification`** (on the primary block and on each arm; absent for a cheap asset): `{criteria: [...], form_fields: [...], free_unit_cap_per_week: <n or null>}`. `criteria` are the plain fit tests that decide who gets the free unit; `form_fields` are the few questions the disclosed form asks; `free_unit_cap_per_week` is how many free units the honoring party can deliver a week (`null` until known; `/offer-test-slate` scale review sets it with the client). Qualified yeses beyond the cap get the standard offer.

**At lock, each offer needs one of the two: a scale note showing it fits the planned volume, or an `offer.qualification` rule that keeps delivery inside capacity.** An offer with neither ranks below every offer that has one, with the reason shown in the ranked list and the slate. It is never hidden or dropped. **Carve-out:** where the client literally supplies the deliverable (their trial seats, their people, their stock), a qualification step cannot create capacity the client does not have, so the cap never exceeds what the client confirmed in `lead_magnet_client_dependency`, and the client's confirmed capacity still caps sends for that offer (`/offer-test-slate` scale review).

**The back-end ask is still the client's real service.** The meeting leads to the paid service the client actually sells, and copy never claims a capability the client does not have (Capability Truth, Hard Rule 28 in `/campaign-copywriting`).

Override: for a client who runs their own front end, set `service_model.front_end_owner: client` in `client-profile.yaml`. Then every offer's yes is client-honored and needs the client's OK before it sends. Absent that field, assume `agency`.

The retired gate ("Lock a magnet only if the front-end owner can produce and deliver it easily, repeatably, at reply-scale", "Reject a 'too-good' front-end promise the agency cannot deliver itself, even when it scores well", "otherwise drop the candidate", and custom work per prospect allowed only with capacity confirmed at reply-volume) is archived verbatim at `outbound/_archive/offer-limits-removal-2026-09-22/`. The same-day rule that followed it ("Test First, Ask About Scale After": test on a handful of yeses, ask about full volume only after the test) is superseded by the lock check above; its text is archived at `outbound/_archive/aaron-process-alignment-2026-09-23/lead-magnet-brainstorm--pre-change.md`.

## The Next-Step Gate: every magnet must leave a reason to talk (strong default, ALL candidates)

Encoded from the Aaron Shepherd 589-replies method (2026-07-13), reshaped after review 2026-07-17. Not tool-specific: it applies to every front-end asset this skill can lock, and archetype K's K3 is its strictest instance.

**The failure it prevents.** A magnet's job is to get a reply. But a magnet that fully satisfies the prospect has no reason to lead anywhere: they read it, they think "nice, thanks", and it ends. Aaron's diagnosis of why so many magnets pull a flood of yeses and almost no meetings: people create them *with no natural progression to the next step*, so the loop closes and the conversation dies. **A high reply rate with a dead-end magnet can be worse than a lower reply rate with a live one**, because it spends first-touch reputation and reply-handling time to produce nothing.

**The rule.** Before any magnet is locked, name two things in writing:

1. **The unresolved motive:** what still makes them want to talk after consuming the asset. It does NOT have to be a knowledge gap. Knowledge, capability, capacity, delegation, or plain desire created by a true number all count (see K3 for the full set and why the knowledge-only framing is false).
2. **The next step that resolves it:** the call, analysis, or conversation that closes it, and why it's the natural closer.

**The honesty gate.** Whatever is unresolved must be real, not manufactured by crippling the asset or withholding output it could just give them. A fake gap is a trapdoor and it spends the trust the free asset just bought.

Record both in the candidate's output block (`Unresolved motive:` / `Next step that resolves it:`), and in `offer.lead_magnet_gap` / `lead_magnet_next_step`. A candidate with no unresolved motive is heavily marked down and cannot be the top recommendation.

**Enforcement is HERE, at selection time, not at copy time.** This is a strong default, not a hard veto, and `/campaign-copywriting` only WARNS when the fields are missing, it never blocks. The reason is concrete: the fields landed 2026-07-17 and were populated on zero clients in a prior 8-client book while 7 of 8 carried a real locked magnet, so a hard gate at copy time would fail nearly the whole of that book over a defect never observed in any of them. Backfill existing clients at their next campaign refresh. New magnets get this right from the start, which is the point.

## The Diagnostic Order: walk it before scoring (doctrine §2; operator-approved Aaron alignment, 2026-09-21)

Aaron's spine for judging any offer. Walk it top-down and stop at the highest broken item; do not work on a lower item while a higher one is broken.

0. **The buyer is real and specific.** A named buyer type with a problem they already know they have, plus role, authority, current situation, and exclusions. "Founders" or "B2B companies" is not a buyer. Here the buyer comes from the brief's `Pain by persona` rows, not from this skill.
1. **The offer is a concrete thing, not a description of the company:** what they get, how fast, what they must do, and what risk they take.
2. **Every qualified yes can be honored at send scale.** Aaron's "easy for you to fulfill" (doctrine §2 step 2), at "the scale of the emails that you're sending" (Sep 21): the agency honors qualified yeses by default, a client-only offer waits for the client's OK, and the offer shows a fitting scale note or carries an `offer.qualification` rule (Deliverable at Send Scale). An offer with neither ranks down; it never drops (Aaron process alignment, operator directive 2026-09-22; supersedes "full-volume capacity is asked after the test").
3. **The copy can lead with the offer and every word can be true.** This skill writes no copy, so here it means nothing in the offer rests on a claim we cannot back (Capability Truth, the Proof-Asset Gate).
4. **The next step is one easy action, and each follow-up can earn its place** (the Next-Step Gate above; follow-up direction in Output).
5. **We will judge the right number:** time-agreed replies per 1,000 first touches beside positive-reply rate, never reply count alone (doctrine §0, §2 step 5; `/campaign-strategy` winner pick).

## Generate Candidates Across Aaron's Three Buckets (doctrine §5)

Aaron never validates a single guess: *"When you're coming up with your offer, you're always going to want to test like three or four"* (doctrine §5). Generate from the `Candidate Generation Input` rows across his three buckets, at least one candidate per bucket wherever the real service allows one, and as many strong candidates as the research supports. His own build asks for ten offer variations and says *"You could probably test all of them if you wanted to"* (masterclass, 2026-05-04). Do not pre-filter for what the client might agree to or what is easy to deliver; ideation stays unfiltered, and deliverability at send scale is checked only at lock (Deliverable at Send Scale):

1. **Service-based:** a growth-potential mapping or a bounded, evidence-based diagnostic (named for the decision it clarifies, never "audit"; ledger R09). Usually archetype A, G, I or J.
2. **Service-delivery-based:** *"something tangible to them"*, one real unit of the paid work done free (a free ad creative, a free listing creative, a free video). Usually F or H.
3. **Lead-magnet or asset-based:** an asset valuable in itself (*"If you have a really valuable asset that helps them solve a problem, that's what you're offering"*). Usually B, C, D, J or K (a K tool runs as its own arm and the agency builds it for the test, K1 and K2).

Within the buckets, reach for his first-offer families (doctrine §5 step 2): a done-for-you artifact, a bounded evidence-based diagnostic, a data asset (for example a look-alike list built from the prospect's own best case study), a trial or guided pilot, plus tools such as a calculator or a valuation, and samples or mockups (S13). **Choose on the real service and buyer, not on which is easiest to generate** (doctrine §5). The archetype letter still records each candidate for the saturation map; the bucket makes sure the set is broad enough to test. A trial, a guided pilot, or a pay-on-results or no-upfront-fee term is a normal candidate here (his trial family, doctrine §5 step 2; performance pricing stays legitimate, doctrine §3). It is usually client-honored, so it carries its one client dependency and goes to the client for an OK before it sends.

**Shape each candidate with the value equation, his way (doctrine §4):**

- **Dream outcome: the sentence shape follows the offer type (operator decision 2026-09-23, Aaron pre-launch gap audit; Aaron Sep 7, Sep 14, Sep 21).** For a free deliverable, imply the outcome through the artifact: keep the magnitude inside the contents of the free thing (his instance: a video walking through a comparable brand already doing 80 million, not "we'll help you get to 80 million in revenue"; doctrine §4, examples §1.4), and the deliverable conditional is the default ("if we could [deliverable] at no cost ...", Sep 7; his measured winner). For a free trial, a pilot or a pay-on-result offer, the conditional that names the outcome and pairs it with its risk term is the default, not an arm ("if I had a way to [outcome] ... and you only pay per [unit], would that be worth a quick test?", Sep 21; "if we could help you get [result] ... free for [x] days", Sep 14; also his Jun 29 script, doctrine §4). Either shape may run the other as a labeled arm. Limits unchanged: no proof claim on line one, no guarantee on the core service (pay only on a counted result is not a guarantee), and an outcome that is not a stretch (that last limit is the corpus's reading, not his words). Still banned: an outcome stated with no risk term, and the retired bundle of an outcome plus a named comparable and its number on line one (proof goes to the PS, one point). (A shape arm is a copy arm that `/campaign-copywriting` logs in `copy.md`, not an offer validation arm. This bullet used to read "imply it through the artifact, never promise it", a blanket ban his own Jun 29 and Sep 14 copy contradicts; the 2026-09-21 version ran the outcome conditional only as a labeled arm, replaced 2026-09-23.)
- **Perceived likelihood: shrink what is being judged.** Move the judgment off the big outcome and onto the deliverable, pick a deliverable whose delivery odds are effectively 100%, and weave a near-twin case into the offer instead of asserting proof.
- **Time delay: a date-certain free deliverable.** The day count must be a real capacity term the front-end owner can keep; his "7 days" is an example, not a default (doctrine §0).
- **Effort: strip the prospect to one act** ("All you have to do is record." `[AS-client]`, examples §1.3; shape, not sentences, doctrine §9 portability rule).

The reader must be able to answer three things: *what's in it for them / how long it takes / what they have to do* (doctrine §4).

**Pay only on a counted result is a strong front-end pattern (operator decision 2026-09-23, Aaron pre-launch gap audit; Aaron Aug 24, where seven of his fifteen model offers work this way, and Sep 21).** The prospect pays nothing until a result they can count happens: per showed meeting, per trial sign-up, per recovered dollar, per saved call, or only if they hire. The count must be something the prospect can verify (a UTM, a calendar booking, an invoice). It is not a performance guarantee: a guarantee promises a volume and refunds the shortfall ("20 to 30 calls a month or you don't pay"), which Aaron rejects, while pay-on-result charges per unit actually delivered. It sets a price term, so only the client can honor it: record `lead_magnet_yes_honored_by: client` with the price term as its `lead_magnet_client_dependency`, and it goes in the client slate flagged "Needs your OK" and sends only once the client says yes, like any client-honored offer (Deliverable at Send Scale). Record the counted unit and how it is tracked in `offer.lead_magnet_details`.

## The Four-Sentence Test and the Scale Note (every candidate)

Write four plain sentences for every candidate (doctrine §5): **who gets the offer, what they receive, what they must provide, and what happens afterward.** Cross out any outcome you cannot prove or deliver. That is a truth check on the claim. Then write the **scale note** (`lead_magnet_scale_needs`): what delivering this offer at the planned send volume takes, from whom, and whether it fits; where it does not fit, write the offer's `offer.qualification` rule and state its material eligibility in the offer itself (Deliverable at Send Scale). The scale note is shown to the client in the slate. It never drops a candidate; an offer with neither a fitting scale note nor a qualification rule ranks down (Aaron process alignment, operator directive 2026-09-22; supersedes "it never drops or down-ranks a candidate" and "asked about in the scale review", operator directive 2026-09-22). This section used to run "twenty-yes economics" as a kill gate; the twenty-buyer figure was always this system's number, not Aaron's (doctrine §13), and the retired text is archived at `outbound/_archive/offer-limits-removal-2026-09-22/`. Record the four sentences and the scale note in the candidate's output block.

## The "Why Not?" Test and the Farming-Interest Check (every candidate; a failure ranks it down and is shown, never hidden)

**The "why not?" test** is his acceptance criterion, stated three separate times (doctrine §4): *"if I don't have to pay a massive amount, I don't have to do a lot of work, and I really want the thing that you're offering, why wouldn't I say yes?"* A candidate that leaves the reader a reason to hesitate (cost, effort, access, a vague deliverable) fails.

**The farming-interest check** catches the offer that passes "why not?" and is still worthless: *"anyone can really make their offer a broad enough question to get a yes, but that doesn't mean anything if the person was never going to buy from you"* (doctrine §4). The offer must be *"specific enough to filter out those who don't and compelling enough to pull in those that do."* Ask whether the people who say yes are the people who buy the paid service. If the free thing attracts a different audience than the paid service, it collects replies without building demand (doctrine §3). Record the ruling as `Why not / farming check:` in the output block.

## The Weak-Offer Screen (label and rank last; doctrine §6, examples §9)

Label any candidate that is one of these. A labelled candidate stays in the ranked list and the client slate with the pattern named, ranks below every unlabelled candidate, and enters the test set only when the operator deliberately picks it (for example as a contrarian arm). The list is Aaron's own buyer-side evidence of what fails (doctrine §6); the old reject-on-sight hardness was this system's, retired 2026-09-22 so no idea is hidden from the operator or the client:

- a performance guarantee on the core service as the front end (his named bad offer: *"offering them 20 to 30 calls per month or they don't pay"*). Pay only on a counted result is not a guarantee and is not labelled (Pay only on a counted result, above; operator decision 2026-09-23, Aaron pre-launch gap audit);
- a description of the service instead of the thing they get;
- a dream outcome so large it reads as a stretch;
- an offer that sounds like a project or a headache (a new CRM, a new vendor, a big change);
- a 30, 60 or 90-day results-guarantee window for the front end, for example "results in 90 days or your money back" (a quick win before commitment beats any guarantee window, doctrine §4). A free trial or pilot of any length is not this pattern and is not labelled: Aaron recommends a 30-day trial on the prospect's own data and a 30-day pilot (Aug 24) and ran "a quick 14-day test" (Sep 21) (operator decision 2026-09-23, Aaron pre-launch gap audit);
- a template-shaped offer, or a commoditized one with no layer above it;
- generic proof bolted on, or process narration standing in for the offer;
- a market too small to validate;
- a generic stranger audit that creates homework, or back-end access asked for cold (*"they don't know you, they don't like you, they don't trust you"*);
- a broad yes-farming question;
- an inbound or referral offer reused on strangers (his "#1 cold email killer").

**Never name the offer an "audit"** (doctrine §3, examples §8). A bounded, evidence-based diagnostic can survive under a better name that says what decision it clarifies (ledger R09), which is why archetype A stays in the table.

**Aaron's "strategic bait" is not adopted** (doctrine §5: *"Almost a white lie, so to speak"*). Capability-truth governs: a claim of buyer intent that is not specifically true of the recipient fails, and "technically true at the firm level" does not make it true in the sentence the prospect reads.

## Fulfillment First: the Four Artifacts Before Any Offer Sends (doctrine §11)

**The reply is the start of the promise, not permission to change it** (doctrine §11 bolds this as the corpus's own summary of his reply-stage teaching; it is not his quote, attribution corrected 2026-09-21). Before the primary offer or any validation arm sends, write its four fulfillment artifacts. The agency honoring qualified yeses makes them writable for almost any `agency` offer; a `client` offer's delivery reply is written once the client says yes. **If any one cannot be written honestly, that offer does not send yet.** It stays in the test set and the client slate (operator directive 2026-09-22; this used to block the lock).

1. **Delivery reply:** what we send on a yes, how, and by when. **It splits by offer type** (Aaron process alignment, operator directive 2026-09-22; the house resolution of Aaron's unresolved ledger R20, which he never reconciles between Jul 13 and Sep 21):
   - **A promised asset** (the email promised something we send: a document, a list, a sample, a teardown, a tool's result, a done-for-you creative): deliver what was promised first, with no unexpected booking gate, no calendar link and no proposed times in the delivery reply; the next step sits one layer down and refusable ("calendar's on the next page if you think there's interest", examples §7.3; ledger R03). No offer to walk them through it on a call either: that is a call ask disguised as help, and his rule is "you don't want to add any sort of sales friction until they've actually consumed the value" (S06, transcript 2026-07-13). (operator-approved Aaron alignment, 2026-09-21)
   - **A direct, trial or service offer** (`direct_offer`, or a yes that starts something run with them: a trial, a pilot, a free service engagement): a short reply that proposes two specific times plus the calendar, with no re-selling (Aaron, Sep 21: "Do you have some time available on X or Y? Here's my calendar ... the call is the mechanism"). Where the offer carries an `offer.qualification` rule, the disclosed form rides in the same reply. (Supersedes "never propose times in a delivery reply ... times are proposed only on explicit booking intent" for these offer types, operator-approved alignment 2026-09-21.)
2. **Input needed after yes:** what the prospect must send before we can deliver (a URL, a logo, an invoice, access). Write `none` only if a one-word yes truly suffices: a one-word yes does not supply an invoice, an address, consent, or system access (doctrine §5 step 4).
3. **If they don't qualify:** the honest one-line reply for a yes that fails the offer's `offer.qualification` criteria or that we cannot serve: what they get instead (the client's standard offer), with the real criteria stated plainly; never invent a reason. For an offer with a qualification rule this line is the second half of the qualification step (Deliverable at Send Scale).
4. **Paid next step, explained:** one or two plain sentences on the paid engagement the free thing leads into, as the prospect would read it. It must agree with `Next step that resolves it:` from the Next-Step Gate.

These are fulfillment facts in plain words, not send-ready copy. Final reply wording belongs to `/campaign-copywriting` (Hard Rule 36) and the reply-agent setup skill for the locked sending platform, which read them from `lead-magnets.md` (Save Output).

## Score Ideas

Score every candidate, including Candidate A, against the same 7-point offer rubric used by `/offer-intelligence`:

| Criterion | Points | Meaning |
|---|---:|---|
| Addresses #1 ICP pain directly | 0-2 | Does it answer the top-scoring cluster in `_research/pain-clusters.md` (2), or another well-evidenced cluster (1), not just the client's internal pitch? Name the cluster ID. A candidate that answers no cluster scores 0 here and is labelled `unevidenced` or `contrarian`, never dropped. |
| Perceived value | 0-1 | Does it sound like something they would pay for, given free? (doctrine §3: *"it sounds like something that they would pay money for"*), ideally anchored to a real price or cost (inherent value). Delivery effort and scale never score here (operator directive 2026-09-22); they go in the scale note and the lock check. |
| Proves competence | 0-1 | Does receiving it prove the client understands the problem? |
| Low prospect friction | 0-1 | Can the prospect claim it in under 60 seconds? |
| Differentiated from the field | 0-2 | Is it meaningfully different from competitor offers and saturated archetypes? |

Rank every candidate by score and show all of them, with their scores and labels (operator directive 2026-09-22). The test set leads with the highest scorers. A candidate scoring 4 or lower is shown with the one change that would lift it.

**The buyer-side checks are labels, not points and not deletions.** The diagnostic order (items 0, 1, 3, 4 and 5), the four-sentence test, the "why not?" and farming-interest check, and the weak-offer screen sit outside the 7 points (the rubric itself is this system's scale, doctrine §13). A candidate that fails one keeps its place in the ranked list and the client slate with the failure named; it enters the test set only when the operator deliberately picks it. The four fulfillment artifacts gate the send, not the lock. The retired capacity gates (twenty-yes economics, the Fulfillment Split) are no longer checks; the one capacity check left is the lock check in Deliverable at Send Scale, and an offer with neither a fitting scale note nor an `offer.qualification` rule ranks below every offer that has one (Aaron process alignment, operator directive 2026-09-22).

The 7 points above are the whole score. **Do not add a signal-obtainability axis to it.** Real obtainability is measured downstream in `/data-point-discovery` (kickoff step 3.3) against actual coverage, not predicted here, so an axis scored at this point would be scored on a guess and would silently change which offer wins. The one real risk that ordering creates is handled by the single check below, which is a pass/fail on the winner rather than a scoring axis.

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

## Lock One Primary Plus Validation Arms (doctrine §5; operator-approved Aaron alignment, 2026-09-21; first wave reworked, Aaron process alignment, operator directive 2026-09-22)

Aaron tests three or four offers at once and lets the market pick (doctrine §5; *"Let the market tell you what you should do"*, doctrine §3; *"start with four different offers and position them the exact same way"*, Feb 23). Locking one offer and validating it is validating a single guess. So the lock writes two things:

- **One primary offer** in `offer.lead_magnet` (unchanged field). It stays the only field that means "the offer is locked", and every downstream skill keeps reading it. The primary is simply the rank-1 candidate that can send today (`lead_magnet_client_ok` is `not_needed` or `yes`) and the default holder of `offer.lead_magnet`: the offer that stays there unless another arm wins. **It gets no head start.** Every first-wave offer launches the same day and runs in every first-wave list segment it fits, its own fit filters deciding, with shared ground split evenly (Offers are placed by fit, below; operator decision 2026-09-23, Aaron pre-launch gap audit, which replaces "every first-wave offer runs as an equal cell in every first-wave campaign and segment", 2026-09-22, cited to Aaron Apr 6: *"run them across all of your campaigns"*); Creative Ideas, a positioning of one offer, moves to the positioning phase after the winner is picked. (Supersedes "because the Creative Ideas, Lookalike and sold-to campaigns carry it", operator-approved alignment 2026-09-21.) A higher-ranked `client` offer still waiting for the client's OK goes in as arm 1 instead, flagged in the slate, and is promoted if it wins.
- **Validation arms** in the list field `offer.validation_arms`: every other candidate that clears the buyer-side checks (the diagnostic order, the weak-offer screen, the "why not?" and farming check, the Next-Step Gate) and the Signal-Capability Check, in rank order, **with no cap** (operator directive 2026-09-22), plus any labelled candidate the operator deliberately adds. Each entry carries the same fields as the primary offer block (Save Output).

**The first-wave offer count is set by the list, not by send capacity** (Aaron process alignment, operator directive 2026-09-22). First-wave offer count = `max(3, floor(qualified_contacts / 2000))`, where `qualified_contacts` is the wave's send-eligible contacts, capped at the number of qualifying candidates (fewer than 3 only when fewer qualify, and the report says so). Aaron sources: Apr 6 (*"one front-end offer per every single, let's call it like 2,000 leads"*), May 4 (*"you're always going to want to test like three or four"*). For per-buyer-type offer sets, the formula runs per buyer-type segment on that segment's qualified contacts (Offer sets per buyer type, below). The qualified-contact count does not exist yet at lock (the list is built after the offer), so this skill locks every qualifying candidate, ranked, and `/campaign-strategy` applies the count once the TAM gives it. The whole qualified list goes out, each contact to a first-wave offer that fits it (Offers are placed by fit, below), at about 2,000 first-touch contacts per offer, with about 1,300 as the hard minimum per offer, pooled across the list segments it runs in, below which no result can be called. The list is never shrunk to fit a chosen number of offers, and offers are never cut to fit send capacity. (Supersedes "`/campaign-strategy` decides how many run in the first flight from warmed send capacity", the sizing of the list to the offers, and "the primary plus at least one arm", operator decisions 2026-09-21 and 2026-09-22.)

**Offers are placed by fit, not run everywhere (operator decision 2026-09-23, Aaron pre-launch gap audit; Aaron Sep 7: each offer matched to the tier it fits, "this is going to be the one where the GLP-1 offer works the best").** The count rule is unchanged: `max(3, floor(qualified_contacts / 2000))`, capped at the qualifying candidates, launched together, the primary with no head start. What changed is where each offer runs. Here a "list segment" is a cut of the first-wave list (the lookalike core, the widened rows, a sold-to cut, a data-source split), not a buyer type in `offer.segments`. An offer's cell is every first-wave contact that passes **that offer's own** fit filters: its `offer_fit_disqualifiers`, its own-only disqualifiers (for the primary these sit in `offer.primary_cell_disqualifiers`, Offer-Fit Disqualifiers below; for an arm, in its own `offer_fit_disqualifiers`), and its `icp_inclusion`. So an offer runs in every first-wave list segment it fits and in none it does not. Where two or more offers fit the same rows, those rows are split evenly and disjointly across the fitting offers (equal cells on shared ground). Each offer is read POOLED across every list segment it runs in, against the ~1,300 floor as before. The winner pick compares offers only on ground they share (matched counts in the list segments where both run); an offer that runs alone in a list segment is judged there only against the absolute PROVEN and DEAD lines. Placement comes from each offer's own filters applied at cell assignment by `/campaign-strategy`, never from a desk guess. Inside the wave, P1 to P5 score order still sends the best-fit rows first (Aaron Sep 7: "run A and B first"). For a client whose offers all fit the whole list, nothing changes. Per-buyer-type offer sets (`offer.segments`) are unchanged: each buyer type keeps its own offer set, and fit-matched placement applies across the list segments inside it. (This replaces "every offer runs as an equal cell in every first-wave campaign and segment", Aaron process alignment, operator directive 2026-09-22.)

**Rules for arms:**

- **Prefer an arm from a different bucket than the primary** where one passes every gate, so the first wave tests offers rather than phrasings of one offer. Positioning of the offer is the second test, after the offer itself (doctrine §5 step 9).
- **Arms share the first wave's list.** `/campaign-strategy` places each first-wave offer on the rows its own fit filters admit and splits shared ground evenly and disjointly across the offers that fit it (Offers are placed by fit, above; operator decision 2026-09-23, Aaron pre-launch gap audit, which replaces "splits the whole qualified list evenly across every first-wave offer"), with the same copy skeleton, so the offer is the only variable. **Only the shared disqualifiers (the company types every first-wave offer disqualifies) apply to the shared list.** An arm whose own `offer_fit_disqualifiers` would remove companies the other offers keep either is simply not placed on its own disqualified rows (those rows go to the offers that fit them), or, when it needs a materially narrower or different list (its own `icp_inclusion` or `title_stack`), runs on its own offer-derived list as a separate cell. The other offers' lists never shrink for it. (Aaron process alignment, operator directive 2026-09-22; supersedes "`/campaign-strategy` applies the union of disqualifiers to the validation list", operator-approved alignment 2026-09-21: a union of disqualifiers is an intersection of usable companies, so every added arm shrank every arm's list.) An arm may not depend on a buyer signal the shared list does not carry unless it runs on its own offer-derived list; otherwise drop the dependency.
- **K1 for arms:** an archetype K tool runs as its own arm (never as the asset fronting another offer's cell) and is judged on time-agreed replies per 1,000 first touches.
- **Every offer inside the first-wave count launches together; only arms beyond the count queue.** All first-wave offers start the same day on the same schedule (Aaron, May 18: *"load them all up into the sequencer, I split test, and launch them all at the exact same time"*). Capacity is sized to the volume, never trimmed: when the client's warmed sending fleet delivers less than the plan needs, the wave still covers the whole list at the allocated rate and the runway stretches (`run_state.capacity_request`, `/campaign-strategy`); an offer is never queued for sender capacity. Arms beyond the count wait and join as soon as a place in the count frees up (an arm is switched off, or the winner is picked), placed by their own fit filters (operator decision 2026-09-23, Aaron pre-launch gap audit). `/campaign-strategy` sets each arm's `flight`. An arm sends only when its `lead_magnet_client_ok` is `not_needed` or `yes`, and never after the client vetoed it; while a client-honored arm inside the count waits for the OK, the next sendable arm takes its place in the count, placed by its own fit filters rather than inheriting the waiting arm's rows. (Supersedes "arm 1 runs beside the primary; further arms join the first flight only when send capacity gives each its own pooled-flip floor", operator directive 2026-09-22.)
- **Empty is an exception, not a default.** If fewer than three candidates qualify, generate more across the buckets first. Only if none survives, write `validation_arms: []` and say why in `lead-magnets.md` under `## Validation arms` and in the lock report: a single-offer wave validates one guess.
- **Exception: an existing offer that `/offer-intelligence` validation mode rated Go.** New arms are optional (Aaron, Apr 13: *"If you're pretty sure you've got a good offer, running a bunch of variations of it isn't necessarily going to be the highest leverage thing"*). The default first-wave test is segments and data sources plus positioning variants of that offer, so `validation_arms: []` with the reason "validated Go offer" is a normal lock; add arms only when the operator wants them (Aaron process alignment, operator directive 2026-09-22).

**After the wave, the market decides.** The winning arm becomes, or stays, `offer.lead_magnet` for scale, and arms that do not get proper responses are switched off inside the live campaign (doctrine §5 step 9: *"deactivat[e] the angles that don't get proper responses"*). `/campaign-strategy`'s flip criterion owns that read: each arm flips on its own pooled positive replies, and among PROVEN arms the winner is the one that does not lose on time-agreed replies per 1,000 first touches; a PROVEN arm that farms interest is reshaped to filter better, not scaled and not killed. At the winner pick (made on matched cell counts on shared ground), arms still in HOLD stop receiving new first touches, their live sequences finish, the untouched rows the winner fits go to it, and the parked arm's read is recorded as unresolved so it can return as a later test (Aaron process alignment, operator directive 2026-09-22; supersedes "another arm's win never retires it"). Losers are switched off by the DEAD line and by the winner pick, never by a ratio. **Reallocation follows fit too (operator decision 2026-09-23, Aaron pre-launch gap audit).** An untouched row the winner does not fit goes to the strongest offer that does fit it (a PROVEN arm first, otherwise the arm already placed there keeps it). Two PROVEN offers that share no ground are not compared: each is the winner on its own ground and scales there. `offer.lead_magnet` holds one offer, so the one whose fitting ground holds more qualified rows holds it, and the other is recorded `works` in its arm entry and scales on its own list segments from there. Promotion re-uses a candidate that already passed every gate here, so it does not reopen offer work. **The winner goes to the rest of the TAM immediately, with no client scale-review gate.** `/offer-test-slate` scale review reports the results to the client and reviews the winner's `offer.qualification` rule: the client's capacity answer sets how many qualified yeses get the free unit each week, and the rest get the standard offer. Where the client literally supplies the deliverable, the client's confirmed capacity still caps sends for that offer (Deliverable at Send Scale carve-out). (Aaron process alignment, operator directive 2026-09-22; supersedes "before the winner scales, `/offer-test-slate` scale review records what running it at full volume takes; `/campaign-strategy` sizes the coverage wave to that answer", operator directive 2026-09-22.)

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

## Output

For each idea:

```markdown
**[Offer name]**
Bucket: <service-based / service-delivery-based / lead-magnet or asset-based (doctrine §5)>
What it is: <one sentence>
Who it is for: <ICP segment>
Four-sentence test: <who gets it / what they receive / what they must provide / what happens afterward (doctrine §5)>
Scale note: <what delivering it at the planned send volume takes, from whom, and whether it fits (lead_magnet_scale_needs). A candidate with neither a fitting scale note nor a qualification rule ranks down, never drops>
Qualification: <none (a cheap asset, every yes gets it) / offer.qualification: the criteria, the form fields, the weekly free-unit cap (a costly front end: trial, service, custom work)>
Eligibility stated in the offer: <the material criteria the offer names up front ("for teams that fit X"), or none; written into lead_magnet_details so copy carries it>
What is needed to deliver it: <tools, data, time>
Who honors a qualified yes: <agency (default) / client: the one thing only the client can provide; needs the client's OK before it sends>
Why not / farming check: <why a buyer would say yes with no reason to hesitate, AND why the people who say yes are buyers of the paid service rather than farmed interest (doctrine §4)>
Weak-offer screen: <pass, or the pattern it hits (doctrine §6, examples §9)>
Unresolved motive: <what still makes them want to talk after consuming this - knowledge / capability / capacity / delegation / desire (Next-Step Gate)>
Next step that resolves it: <the call / analysis that closes it, and why it's the natural closer>
Delivery reply: <what we send on a yes, how, and by when. A promised asset: delivers first, no booking gate, no calendar link, no proposed times, no offer to walk them through it on a call (doctrine §11, Jul 13). A direct, trial or service offer: a short reply proposing two specific times plus the calendar, no re-selling (Sep 21)>
Input needed after yes: <what the prospect must send before we can deliver, or "none" only if a one-word yes truly suffices>
If they don't qualify: <the honest one-line reply for a yes that fails offer.qualification or that we cannot serve: the standard offer, with the real criteria>
Paid next step, explained: <one or two plain sentences on the paid engagement the free thing leads into>
Build + fill: <none, or (archetype K): who builds and hosts it for the test, and the per-responder fill work>
CTA direction: <plain-English ask direction for /campaign-copywriting, not final wording>
Why it should work: <short reason tied to ICP pain>
Evidence: <the cluster IDs it answers, 2 to 4 evidence IDs, the strongest tier behind it (strong / good / supporting), and the Language-bank phrase it borrows; or `unevidenced` / `contrarian` with the reason (market-evidence-standard.md section 12)>
Pain angle: <one line in the buyer's words that the campaign cell will carry>
Market feedback: <added after launch by /market-evidence feedback: dated reply IDs and counts (positive, objections by type, questions); blank before launch>
Signal dependency: <none (needs no observable buyer signal - the common and preferred answer), or: the signal named in one line. On the primary and every arm, add the Signal-Capability Check ruling: declared live / declared but unproven (chosen) / not obtainable>
Risks: <one reason this could fail>
Offer score: X/7
List definition: <icp_inclusion filters and title_stack this offer needs, or "shares the set's list"; its own offer_fit_disqualifiers>
Role at lock: <primary (rank 1, no head start) / validation arm N / not in the test set yet, with the plain reason (it stays in the list and the slate)>
```

The four fulfillment fields (`Delivery reply`, `Input needed after yes`, `If they don't qualify`, `Paid next step, explained`) are required for the primary and every arm before lock (doctrine §11), and so are the scale note, the qualification line and the list definition (Aaron process alignment, operator directive 2026-09-22). For other candidates, fill them once the candidate is in contention.

Show every candidate, ranked, before locking anything. Do not include final CTA lines, subject lines, openers, or send-ready phrasing.

For any candidate, include how the offer can carry Email 1 and its one or two same-thread follow-ups without repeating the same generic deliverable. The sequence is ONE thread with 2 to 3 steps (`/campaign-copywriting` Hard Rule 18); the 4-email / two-thread structure was retired 2026-07-05, so there is no second new-thread purpose to support. In Aaron's method a follow-up either adds to the offer (a pre-handled concern, a benefit layer, a risk reversal, the reason it is free) or strips it back to a lower-friction version of the same offer (his two-minute Loom); it never repeats Email 1 (doctrine §11, ledger R12). Keep this at direction level only.

## Execution Mode Gate

After scoring is complete and ranked options are ready, check `run_state.execution_mode` from `client-profile.yaml`:

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
  lead_magnet_client_ok: not_needed    # not_needed (agency) | pending | yes | no. Sends only at not_needed or yes, never on silence; the primary is always sendable today
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
      lead_magnet_client_ok: not_needed    # not_needed | pending | yes | no. The arm sends only at not_needed or yes
      lead_magnet_scale_needs: <what delivering it at the planned send volume takes, from whom, and whether it fits>
      qualification: <same shape as the primary's; absent for a cheap asset>
      icp_inclusion: []             # only when this arm needs its own offer-derived list; otherwise it shares the set's list
      title_stack: null             # same rule
      offer_fit_disqualifiers: []   # same shape as the primary's; only the disqualifiers every first-wave offer shares apply to the shared list, and this arm's extras apply only in its own cell or its own list (Aaron process alignment 2026-09-22; supersedes the union rule)
  segments:                     # operator decision 2026-09-22. Only when kickoff Step 2.5 confirmed 2+ segments whose pain or offer fit differ; absent otherwise
    - segment: <slug from the confirmed segment list; matches the `segment` column in tam.csv>
      label: <plain buyer-type name, as the client slate shows it>
      priority: 1                 # 1 = the segment the top-level offer block mirrors
      lead_magnet: <this segment's primary>   # plus every other field of the primary block above, including the evidence fields (cluster_ids, evidence_ids, evidence_strength, pain_angle, feedback_ids, feedback_summary)
      offer_fit_disqualifiers: []
      primary_cell_disqualifiers: []  # same rule as the top-level field: company types only this segment's primary disqualifies, skipped in its own cell at cell assignment
      validation_arms: []         # same shape as the top-level validation_arms, evidence fields included
      offer_market_proven: false  # this segment's own flip (/campaign-strategy)
      scale_review: null          # this segment's own scale review (/offer-test-slate): a results report plus its winner's offer.qualification review, run alongside that segment's scale-up
```

**Write the fulfillment plan and the arms into `lead-magnets.md` as well**, since the four fulfillment artifacts live there rather than in the YAML: a `## Fulfillment plan` heading with one block per locked offer (primary first, then each arm) carrying `Delivery reply:`, `Input needed after yes:`, `If they don't qualify:` and `Paid next step, explained:`, plus the offer's `Qualification:` line (the criteria, form fields and weekly cap in plain words, or "none, cheap asset"), a `## List definition` heading mirroring `icp_inclusion` and `title_stack` in plain words (The Offer Writes the List Definition), and a `## Validation arms` heading listing each arm, its bucket, its score, and why it was chosen (or, when `validation_arms: []`, why no second candidate survived). Also write an `## Every candidate` heading: the full ranked list with each candidate's score, labels, who honors a qualified yes, scale note and qualification line, including the ones not in the test set, because `/offer-test-slate` shows all of them to the client. The reply-agent setup skill for the locked sending platform and `/campaign-copywriting` read the fulfillment plan from there. Every entry under `## Every candidate` and `## Validation arms` (and under each `## Segment: <label>` section) also carries its **Evidence**, **Pain angle** and (after launch) **Market feedback** lines, which makes `lead-magnets.md` the offer hypothesis register: every offer, the evidence it rests on, and what the market said to it (`market-evidence-standard.md` section 12).

**When the wave picks a winner** (`/campaign-strategy` flip criterion), a winning arm's fields move into the primary block, the arm's `status` becomes `promoted`, and the previous primary is recorded as an arm with `status: deactivated` (or `works` when it is PROVEN on ground the winner does not share, the two-winners case in After the wave). The top-level `offer_fit_disqualifiers` stays the shared list `/tam-build` applies to the whole TAM, so the swap never copies an arm's full disqualifier list over it: the winner's own-only disqualifiers move into `primary_cell_disqualifiers`, and the previous primary's own-only disqualifiers move into its new arm entry (fit-matched placement, operator decision 2026-09-23). Record the swap in the activity log. It re-uses fields that already passed every gate here, so it is not a new offer lock.

`lead_magnet_gap` is what `/campaign-copywriting` reads to decide which delivery shape applies (the Delivery Message rule in its CTA Hierarchy, Hard Rule 36). A magnet with a real gap earns the pure-value delivery, and its required day 2-3 follow-up carries the ask, aimed at the gap; one without a gap carries one soft, refusable pointer to the next step in the delivery itself, because no follow-up aimed at a gap exists to carry it. For a promised asset, never propose times in the delivery reply, whether or not the asset leaves an open question; the next step sits one layer down and refusable ("calendar's on the next page if you think there's interest", examples §7.3; ledger R03). A direct, trial or service offer is not an asset delivery: its reply proposes two specific times plus the calendar (Aaron, Sep 21; Fulfillment First item 1; Aaron process alignment, operator directive 2026-09-22; supersedes "times are proposed only on explicit booking intent" for those offer types). So this field is load-bearing, not documentation. (operator-approved Aaron alignment, 2026-09-21: a magnet without a gap used to keep "a soft time-proposal at delivery".)

Do not overwrite or delete `offer.client_suggested_*` fields. They are useful context showing what the client originally believed.

Do not save exact CTA example fields from this skill. Exact CTA copy belongs to `/campaign-copywriting`.

## Common Mistakes

- **An offer with no Evidence line, or one that hides a weak cluster.** Every candidate names the clusters it answers and their strength, or carries an `unevidenced` or `contrarian` label. A low-confidence cluster keeps its label on every offer built on it.
- **Dropping or down-ranking an offer at ideation because the client might not want it, it needs a free trial, it takes effort, or it needs custom work per prospect.** Rank it on buyer pull, then at lock record who honors a qualified yes and show it is deliverable at send scale with a scale note or an `offer.qualification` rule (Deliverable at Send Scale).
- **Promising every yes the free unit on a costly front end, or gating a cheap asset.** A trial, a service or custom work gets a disclosed qualification step after the yes, with its eligibility stated in the offer; a cheap asset goes to every yes (Aaron, Sep 21, cherry-pick; Aaron process alignment, operator directive 2026-09-22).
- **Giving the primary a head start, sizing the list to the offers, or running an offer where it does not fit.** Every first-wave offer launches the same day with no head start and runs in every first-wave list segment it fits (its own fit filters decide), not across every list segment, with shared ground split evenly (operator decision 2026-09-23, Aaron pre-launch gap audit); the offer count follows the list (`max(3, floor(qualified_contacts / 2000))`, capped at the qualifying candidates), never the reverse (Aaron process alignment, operator directive 2026-09-22).
- **Sending a `client` offer before the client's OK, or a back-end ask the client cannot fulfill** (Capability Truth).
- Calling a meeting the offer. A meeting is an ask, not a front-end offer.
- Requiring too much from the prospect.
- Hiding the asset behind a form.
- Using generic "consultation" language.
- **Locking a magnet that dead-ends** (nothing left unresolved, no natural next step). It farms yeses that never become meetings. See the Next-Step Gate.
- **Letting a tool front another offer's cell, or letting its positive replies pick the winner.** A tool runs as its own arm and is judged on time-agreed replies per 1,000 first touches, like every arm (K1).
- **Reading K3 as "hide an input".** The unresolved motive can be capability, capacity, delegation or desire, not just knowledge, and a gap manufactured by crippling the tool fails K4 outright. Make the inputs easy; let the motive be what's unresolved.
- **Forgetting a tool's gap-fill in the scale note.** The tool is free per responder; **its gap-fill is not**. Put the volume math (expected positive replies × work-per-fill at the planned send volume) in `lead_magnet_scale_needs` at lock, and cap the hand-delivered fill with an `offer.qualification` rule when it does not fit (K2; Aaron process alignment, operator directive 2026-09-22).
- **Locking one offer and validating a single guess.** Aaron tests three or four (doctrine §5). Lock a primary plus every qualifying arm, ranked, launch the first-wave count together, and let the wave pick the winner: each arm flips on positive replies, then the PROVEN arm that does not lose on time-agreed replies per 1,000 scales.
- **Leading with the service instead of an offer.** A service description, a stretch outcome promise, or a guarantee on the core service is a weak offer (doctrine §6); the front end is a free, inspectable unit of the paid work (doctrine §3).
- **Naming the offer an "audit"**, or leaving out the word "free" (doctrine §3, examples §8).
- **Farming interest.** An offer broad enough that anyone says yes collects replies from people who will never buy (doctrine §4). Run the farming-interest check, not only "why not?".
- **Hiding a candidate.** Every candidate stays in the ranked list and the client slate with its score and labels; failing a check lowers its rank, it never deletes it.
- **Sending an offer whose four fulfillment artifacts cannot be written honestly** (doctrine §11), or one that hides a booking gate, a deposit or an access request until after the yes (doctrine §3: "Remove homework, not honesty").

## What To Do Next

The offer locks here, and the rest of the chain is built to fit it. `offer.validation_arms` travels with it: `/campaign-strategy`'s Offer-Validation Wave launches `max(3, floor(qualified_contacts / 2000))` offers together (capped at the qualifying candidates) across the whole qualified list (Aaron process alignment, operator directive 2026-09-22; supersedes "runs the primary plus at least one arm on the same broad list"), each offer in every first-wave list segment it fits, its own fit filters deciding, with shared ground split evenly (operator decision 2026-09-23, Aaron pre-launch gap audit). `offer.icp_inclusion`, `offer.title_stack` and `offer.offer_fit_disqualifiers` are the list definition `/tam-build` builds against. Once `offer.lead_magnet` is set in `client-profile.yaml` (by operator selection or auto_execute), the order is `/offer-test-slate` (slate mode: the client-facing test plan; client approval is optional, so the flow does not wait unless `run_state.offer_slate_approval = required`), then `/data-point-discovery` (step 3.3, where obtainability becomes a measurement against a locked offer rather than a guess), then `/social-proof-bank`'s seed portion (the 5 to 10 companies that best fit the locked offer, which seed `/tam-build`'s lookalike), then `/tam-build` (which consumes the list definition from this skill) with the rest of `/social-proof-bank` running alongside it, then `/lead-scoring`, then `/campaign-strategy`. `/cold-email-kickoff` orchestrates that sequence, so on a guided run hand back to it rather than jumping ahead.

If you are already past the list build and strategy is the only missing piece, run `/campaign-strategy`.

If `execution_mode = review_gates` and no ranked option has been selected yet, stop and ask the operator to choose one. Do not continue to strategy or copy from brainstorm-only ideas.

If a campaign has already been selected, run `/campaign-copywriting`. That skill owns exact CTA wording and must apply `spam-word-checker.md` plus `cold-email-copy-best-practices.md` before copy is shown, saved, exported, spun, or uploaded.

