# Archive: lead-magnet-brainstorm, full pre-change snapshot

- **Source file:** `.claude/skills/lead-magnet-brainstorm/SKILL.md` (FNNL Agency GTM System)
- **Archived:** 2026-09-22, operator directive: remove the offer-ideation limits (client willingness, capacity, effort, free trial) and move the capacity question to after the test
- **Why a full snapshot:** this file carried other sessions' uncommitted edits when it was changed, so the whole file is kept verbatim as the exact pre-change state. Diff it against the live file to see this change alone.
- **Replaced by:** the live file at the same path. `MANIFEST.md` in this folder lists what changed and why.

This is a record, not live doctrine: do not lift any of it back into a skill.

`````markdown
---
name: lead-magnet-brainstorm
description: Helps choose a front-end offer for cold emails. Use after /offer-intelligence discovery mode, whose Candidate Generation Input block it consumes directly rather than re-deriving buyer pain. The offer LOCKS here, before the list build. Generates candidates across Aaron Shepherd's three offer buckets, runs the four-sentence test, the twenty-yes economics, the why-not and farming-interest checks, the weak-offer screen and the fulfillment-first reply plan on each, and scores all candidates on a 7-point rubric, then checks run_state.execution_mode - auto_execute locks the top-scored candidate as the primary offer plus one to three validation arms (offer.validation_arms) and proceeds without pausing; review_gates presents ranked options and waits for operator selection. At lock it runs the Signal-Capability Check (any signal the offer depends on must be obtainable by a capability the stack contract declares) and writes the offer-derived disqualifier list that /tam-build's offer-fit gate consumes. Exact CTA copy is written later in /campaign-copywriting.
---

# Lead Magnet Brainstorm
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

**The front-end offer is one real, inspectable unit of the paid work, given free (operator-approved Aaron alignment, 2026-09-21; doctrine §3).** In this skill "lead magnet" means that front-end offer in any of its forms, not only a document. Aaron's standard for it: it is free and says so ("free" or "no cost"; leaving the word out is, in his words, "a huge miss", doctrine §3); it gives the most value for the least work on our end; its delivery odds are effectively 100% (doctrine §4); it bridges naturally into the core offer; it keeps its value if they decline (doctrine §5 step 7); it carries a truthful reason it is free; and it hides no condition ("Remove homework, not honesty", doctrine §3). Do NOT manufacture a filler asset (a generic PDF, a thin report) just to have one, because a useful piece of actual work beats a consultation, a generic audit, a big guarantee, or an AI-generated PDF (doctrine §3). When the client has no natural asset, look for the unit of the paid work first: that is not inventing an asset, it is the offer.

**`offer.lead_magnet: direct_offer` stays a valid locked value, but it is now the exception, not the preferred outcome.** The List Gate, `/tam-build` and `/campaign-copywriting` still accept the sentinel in place of a magnet. Use it only when no unit of the paid work can honestly be given free at twenty yeses, and only for a direct offer that is still a concrete, low-commitment next step: it passes the diagnostic order below and hits none of the weak-offer patterns (a service description, a stretch outcome promise, a performance guarantee on the core service; doctrine §6). Its shape is his lending email (examples §1.2, `[AS-client]`, his own paraphrase): state plainly what we offer, with no pitch. That email closes on "worth a quick coffee chat", a meeting ask, so take the shape, not the close. `direct_offer` is the exception, and Email 1 still closes with his permission CTA (ledger R17 retired the meeting ask), so a yes is permission to share more, not agreement to a call. The reply shares it in one or two sentences plus the information or asset, keeps the call one layer down and refusable, and proposes times only when the prospect asks to talk (explicit booking intent). His permission CTA is "Would that be worth sharing more?" by default (examples §4; `/campaign-copywriting` Hard Rule 32: permission to send or show something, never a meeting). Score it like any other candidate. (operator-approved Aaron alignment, 2026-09-21: this used to name doctrine §8's passive introduction as the legitimate shape, with examples §1.2 as his instance and its coffee-chat close left standing.) The earlier "direct offer is often preferred" paragraph is archived at `outbound/_archive/aaron-alignment-2026-09-21/lead-magnet-brainstorm--direct-offer-default.md` (doctrine §3: "Your offer is not your service", and "The front-end offer now outranks the guarantee-style main offer").

Final CTA wording must be handled by `/campaign-copywriting`. Keep CTA output here at direction level only, then let `/campaign-copywriting` apply the confirmed-deliverable gate and the permission-based, value-backed CTA framework.

CTA direction must still be specific enough to prevent generic copy. Name the deliverable, what the prospect receives, why it is useful, and what must be true before it can be promised. Do not leave `/campaign-copywriting` with only a vague "short note" direction unless that generic wording is the deliberate test.

Whatever offer wins must be able to pass the Offer Architecture gate at copy time: SQL vs MQL framing, the easy-to-say-yes-to test, and a named risk reversal (full gate in `/campaign-copywriting`). Prefer candidates with a clear, low-friction risk reversal. Flag any pick that has none so `/campaign-copywriting` can resolve it before Email 1. In Aaron's method the risk reversal is the free front end itself plus casual risk elimination ("We'll do this for free and then we only move forward if we actually see something worth implementing." `[AS]`, examples §5; it shows the shape, never paste it into client copy, doctrine §9 portability rule), never a money-back guarantee (his "incredibly washed out") and never a performance guarantee on the core service (doctrine §3, §6).

## Material Decision Rule

When this skill reaches a material fork, name the realistic options, recommend the strongest path, and explain why the main alternatives are weaker before committing.

Ask before choices that affect spend, provider routing, source of truth, list quality, campaign direction, client-facing output, live systems, scraping or account risk, or legal/compliance risk. For low-risk reversible choices, state the recommendation and proceed.

Do not turn failed or unsafe paths into user-facing options. If this skill's QA rules or stop gates reject a path, filter it out and explain the blocker only when useful.

## Interaction Policy

Defers to `/autonomous-execution-policy`. Under `run_state.execution_mode = auto_execute` (the operator's default), proceed without pausing: pick the strongest option per this skill's rubric, record it to `run_state`/profile, and continue - never re-ask a decision already in `run_state`, the profile, memory, or the operator's latest message. Stop only for the policy's hard-stops (spend over the approved ceiling, live send, credentials, provider/source-of-truth change, safety gates). On a long async wait, background-poll and move to other productive work - never idle.

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short — record status, not raw output. Full protocol: `client-activity-log.md`.

## Client Suggestion Rule

If `client-profile.yaml`, an onboarding form, call notes, or the operator includes a client-suggested lead magnet, treat it as Candidate A. Do not confirm it as the answer.

Always generate at least 3 additional candidates before scoring, spread across Aaron's three buckets (Generate Candidates below). The client suggestion may win, but it must beat the alternatives on the same rubric and pass the same gates.

## AI/API Routing

Ideation crunch routes per `ai-model-routing.md`: synthesizing the offer-intelligence brief (its Candidate Generation Input rows, buyer-pain vectors, and saturation map) and archetype-fit reasoning across large context → the bulk-classification model; strict rubric scoring and JSON output → a general-purpose model with structured output. Both of those are roles, so `ai-model-routing.md` names which tool fills each one. This skill reads existing research; it does not run new web research (that lives in `/offer-intelligence`). CTA wording stays at direction level for `/campaign-copywriting` (Claude API).

## Required Input

Before asking anything, check for:

```text
profiles/<business-slug>/offer-intelligence.md
```

**Discovery and candidate generation are one continuous offer motion split across two skills.** This skill is the second half of it, so it starts by reading what discovery already established rather than researching pain again. It runs no new web research of its own.

If the brief exists, load these four sections **by name** and work from them:

1. **`Candidate Generation Input`** - the numbered persona + pain + open-archetype rows. **This is the primary input.** Generate candidates against these rows: each serious candidate answers a named pain for a named persona, in an archetype the saturation map left open. If the block carries the optional **cross-client priors** line (other clients' proven offers in this workspace, as patterns only), treat each prior as a hint about an offer shape worth trying, rebuilt around this client's real service and buyer; never carry another client's name, number or data into a candidate.
2. **`Pain by persona`** - the full table behind those rows, including any prioritized persona with no pain evidence (a named gap, not a blank to fill by guessing).
3. **`Saturation Map`** - the open, crowded, and saturated archetypes with their denominator.
4. **`First-Party Buyer Voice`** and **`ICP Pain (in their words)`** - the buyer's exact words, which the offer gets written in.

**Read these rows, do not rebuild them.** Do not re-derive pain, re-rank personas, or re-research the market here. If `Candidate Generation Input` is missing or empty, that is the signal that `/offer-intelligence` discovery mode has not actually finished: route back to it rather than reconstructing its findings inside this skill.

Also load `profiles/<business-slug>/client-profile.yaml` if it exists. If it contains `offer.client_suggested_lead_magnet`, include that suggestion as Candidate A and preserve any `offer.client_suggested_lead_magnet_details` as delivery context.

If the offer-intelligence brief does not exist, ask whether to run `/offer-intelligence` discovery mode first using a native choice prompt:

```text
No offer-intelligence brief exists yet. What should I do?

A. [Recommended] Run /offer-intelligence discovery first
B. Continue with self-reported context and label the brainstorm weaker
C. Stop until the missing brief exists
D. Custom answer
```

## Intake

Ask one at a time using Claude Desktop native Interactive Inputs / Choice Prompts. When the profile, website, or offer-intelligence brief gives a likely answer, pre-fill it as the recommended option.

1. What do you sell, in one sentence?
2. What problem did your best customer have before buying?
3. What could you give or do in under 30 minutes that would be genuinely useful?
4. What can you legally or operationally not promise?

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
| K | Interactive tool | A self-serve calculator or audit that computes a result from the prospect's **own** numbers | Any wave EXCEPT an offer's baseline validation wave, and the client has real data, a repeatable model, or a paid process worth productizing | The gap-fill is per-responder work that scales with success; and a tool leaving no reason to talk dead-ends at "nice, thanks" |

## Archetype K: the interactive tool (scale asset, not a validation asset)

Encoded from the Aaron Shepherd "589 positive replies in 60 days" method (transcript 2026-07-13), reshaped after an adversarial review 2026-07-17.

**Read the evidence honestly before you weight any of this (added 2026-07-17).** This archetype is a **playbook worth testing, not established doctrine**, and the rules below are defaults and design gates rather than laws. The source is one self-promotional YouTube case study: N=1, one client, 60 days, no control, no base rate, reported by someone selling an agency retainer and a paid accelerator off the same video. "Positive reply" has no external definition and is **self-graded by the sender** (in the sending platform the sender assigns the category), so it partly measures his labelling. Aaron's own site reports ~5M sends and ~3,000 calls booked in a year, which is roughly **one call per 1,667 emails**, the credible number in his corpus, precisely because it costs him something, and a useful anchor against the 589. Separately, the "interactive content converts 2x static" claim you'll meet everywhere traces to 2014 opinion polling of 185 marketers rating their *own* performance, sponsored by a company selling interactive-content software; no controlled study exists. None of this means the play is wrong. It means **our own data decides**, and until a build of ours produces a real reply-to-meeting number, nothing here is proven.

**What it is.** Not a PDF. A tiny self-serve page where the prospect drops in a few numbers they already know (store URL + monthly revenue + AOV + conversion rate; or annual revenue + adjusted EBITDA) and gets an instant, specific result computed from *their* inputs. No login, no gate, results in about 60 seconds. Aaron's live examples: a CRO audit showing where a store loses sales, a business-valuation calculator, and an outbound-vs-paid-ads ROI calculator.

**Why it beats a PDF.** A generic document could apply to 10,000 other companies, so it reads as mass-produced and gets ignored. A tool's output is about the reader's own business, so it feels custom without being custom. **The build is one-time and the tool itself then runs at ~zero cost per responder** — but do not stop reading there, because K3's gap-fill reintroduces a real per-responder cost that K2 exists to catch. The honest claim is narrower than "zero marginal cost forever": a tool is the cheapest way to make an asset *feel* bespoke at cold volume, and what it costs after that depends entirely on how expensive its gap is to fill.

**Aaron's own warning, and why the gates below exist.** His 589 is a count of **positive replies, not meetings.** He says it plainly: getting a reply and booking a call are two completely different things, and people who build magnets and calculators with no natural progression to the next step get lots of yeses and, in his words, *"such a low meeting to lead ratio"* (S06, transcript 2026-07-13; attribution corrected 2026-09-21: this used to paraphrase him as "a terrible meeting-to-lead ratio"). The tool is a reply engine by default; whether it also becomes a *meeting* engine is the open question K3 tries to answer, and the honest state of that answer is "plausible, unproven" (see K3). A tool that leaves the reader with no reason to talk is the shape most likely to produce polite dead ends.

### The four gates (K1, K2, K4 are HARD; K3 is a strong default)

These sit on top of the standard eligibility gates, not instead of them. They are deliberately not all the same strength: **K1, K2 and K4 must pass before a tool is locked** (they protect the measurement, the money, and the prospect's trust). **K3 is a strong default, not a veto** — a tool with no unresolved motive is heavily marked down and cannot be the top recommendation, but it is not auto-rejected, because the evidence under the mechanic is one unrun build (see K3). Note K4 governs whatever K3 produces: if there IS a gap, it must be real; a candidate that honestly has no gap fails K3's default, not K4.

**K1 — No tool fronts a baseline Offer-Validation Wave (the measurement-integrity gate).** A tool may not be the E1 asset for the FIRST validation wave on an offer. It is welcome in any follow-on wave, once that offer has a baseline reply read on offer-led copy. K1 binds validation arms too (Lock One Primary Plus Validation Arms, below): a tool is never an arm in a baseline validation wave, for the same measurement reason.

**The reason is measurement, NOT cost.** Getting this reason right matters, because the wrong one invites the wrong exception. A validation wave exists to read one instrument: does this offer draw a reply? A strong tool inflates that reply rate on its own merits (Aaron's own words: it "opens the floodgates"), so fronting a wave with one contaminates the instrument the wave exists to read. You don't want a better number during validation, you want a *true* one. That holds no matter what the tool costs.

**Do not gate this on cost, and do not gate it on `offer_market_proven`.** Both were tried and both are wrong:
- **Cost:** a tool is roughly $0-20/month and hours of Claude Code. The wave it would be gated behind runs ~$460-750 loaded plus 2-4 weeks of warmup. A cost-based gate is false by more than an order of magnitude, and any reader who prices the build will correctly route around it.
- **`offer_market_proven`:** structurally unreachable. This skill runs at kickoff step 3; the flag can only flip at step 6+ (`/campaign-strategy`), after a wave designs AND actually sends. So the flag is *necessarily* false at the moment a magnet is chosen. Gating K on it made the archetype dead code (verified 2026-07-17 against a prior 8-client book: the flag was false or absent on all 8 and had never been true for any of them, ever). A rule whose condition can never hold at the moment of decision is not a gate, it is a deletion.

So the check is on the **campaign's role**: is this the offer's baseline validation wave? If yes, no tool. If it is a follow-on wave, K1 is satisfied and the remaining gates decide.

**Be honest about what this re-keying does and does not change.** On a first pass it changes nothing in practice, and it should not pretend otherwise. This skill runs at kickoff step 3, and for a new client the next wave IS the baseline validation wave by definition, so K1 blocks a tool there exactly as the old rule did. Two things genuinely changed:
- **K has a reachable path at all.** The condition is now "a baseline read has HAPPENED", not "the offer PASSED the reply bar". Those differ: an offer with a mediocre-but-not-dead read (between ~1-per-400 and ~1-per-1,200) was blocked forever by the old flag and is eligible now, because the thing K1 protects (a clean baseline measurement) already exists.
- **The rationale is right**, so the exceptions people reach for are the right ones.

**Mechanically, K is therefore reached on a LATER pass**, by re-invoking this skill after a wave has run, not on the kickoff sweep. That is intended, not a defect. If you are standing at step 3 with a brand-new client, the answer is always no tool, and the correct next action is to go validate the offer, not to look for a way around K1. See `/campaign-strategy` → the magnet-inflation guard, which enforces this rule's twin from the other side (an asset-led reply rate can't flip `offer_market_proven`).

**K2 — Both costs are named, owned, and committed (the capex gate).** A tool has TWO costs, and only one of them is obvious. **(a) The one-time build** (`build_cost_hours`): upfront, lands before a single email sends. Name who builds it, who hosts it, who maintains it when the model or branding changes, **who OWNS it** (the repo, the domain, and any data it collects — an unowned tool is one the payer merely rents, and this must be settled in writing before the build, not after), and who pays. **(b) The per-responder gap-fill** (`per_responder_fill_minutes`): if the tool has a gap (K3), the work of filling it for every prospect who takes it up. Aaron's own fill is a free TAM analysis delivered by hand, one call at a time. This is the cost that grows with success, and the one most likely to be missed.

**Do NOT wave a tool past the Fulfillment Split whenever it has a gap.** It is tempting to, because the tool itself costs ~nothing per responder — but a gap is only a gap if something fills it, so **any tool that clears K3 has per-responder work by construction**, and that work scales with success while the build does not. Run the Fulfillment Split's real test on the fill: **expected positive replies × work-per-fill ≤ committed capacity.** That gate is the right instrument here and it binds hard. (A tool with no gap has no fill and no such cost — but it has also failed K3's default, so it is not the top recommendation anyway. The cheap-and-gapless tool is not a loophole, it is the dead-end shape.) Record both costs as confirmed commitments (`offer.lead_magnet_build_owner`), not assumptions. An unbuilt tool is not a magnet, it is a promise.

**Reconcile with the Premium tier honestly.** K3's tease-then-fill-on-a-hand-raise shape IS the deferred Premium custom-asset play, not an escape from it. K does not abolish the per-account cost; it moves it from every prospect to every hand-raiser, which is a real improvement and is the deferred tier's own economics. So the fill must be a **bounded, pre-defined light analysis with a hard per-responder time cap**, ideally one a script produces rather than a person (our `/tam-build` Phase A is the model: dollars, not hours). The moment the fill starts looking like a genuine custom report, it has walked back into the Premium tier and belongs there, not under the "scalable tool" label.

**K3 — Leave an unresolved motive to talk (strong default; heavily marked down without one, not auto-rejected).** The chain to design against: the email opens a curiosity loop → the tool closes it → the tool leaves something unresolved → the call closes THAT. Aaron's instance: his ROI calculator's core input is total addressable market size, which almost nobody knows offhand, so the result is real but estimated and the natural next step is a free TAM analysis. Name what's unresolved and name the next step that resolves it, before the build.

**A knowledge gap is ONE way to do this, not the only way — do not read this as "hide an input".** The original framing ("the core input must be something the prospect can't know") is false as a universal and its counterexample is easy: a complete deliverability audit that tells them everything (SPF broken, DMARC at p=none, here are the six records to publish) has *zero* knowledge gap and converts precisely **because** it is complete, since completeness is what proved competence. The prospect doesn't want to know, they want it done. The real set of motives is wider:
- **Knowledge** — they can't compute the number themselves (Aaron's TAM).
- **Capability** — they now know exactly what's wrong and can't fix it in-house.
- **Capacity** — they could fix it, and will never get to it.
- **Delegation** — they'd simply rather someone else ran it.
- **Desire** — the tool told them a true number big enough to act on ("you're leaving $400k a year on the table" is complete information and a powerful motive).

Any of these is a valid unresolved motive. What fails is a magnet that leaves **none** of them: fully satisfying, nothing further wanted, no reason to reply again. Note the market evidence points the *other* way on the input question specifically: the closest published case study (CartHook's ROI calculator) deliberately chose "metrics that every store owner either knows or can easily access", i.e. the exact opposite of hiding one. So make the inputs easy and let the *motive* be what's unresolved.

**Why this is a default and not a hard gate.** The mechanic is plausible and Aaron's diagnosis of dead-end magnets is credible, but the evidence under it is thin: his flagship instance is a tool he had not yet run (the transcript shows hypothetical copy for it), and two of the three tools he actually describes as working client builds have no named gap at all. It has not earned veto power. A candidate with no unresolved motive is heavily marked down and cannot be the top recommendation, but it is not auto-rejected.

**K4 — Whatever is unresolved must be real (the honesty gate on K3).** It cannot be manufactured by crippling the tool, hiding a field, or withholding output the tool could just give them. It has to be a genuine limit, and the next step has to actually resolve it. A fake gap is a trapdoor and it burns the trust the free asset just bought.

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
2. Point it at the brand: existing brand guidelines if they exist, otherwise just the client's website — "follow the exact same branding as this site." This gets ~80% of the way there.
3. Rebuild the funnel logic, then restyle to the brand.
4. **Make the inputs easy, and put the unresolved motive somewhere real** (K3). Do NOT read this as "withhold a field": the published evidence runs the other way (CartHook deliberately chose metrics owners already know), and K4 forbids a gap manufactured by crippling the tool. Prefer a motive that is *structural* — a genuine limit of what a self-serve form can know, or a vendor/data boundary — over one you designed in.
5. Add the external reference point (the anchor above) and make it the headline, so it is the first thing seen.
6. Point the CTA at the unresolved motive, and make sure the next step genuinely resolves it.
7. **Push to a SUBDOMAIN of an established domain we already own**, not a fresh standalone one. This is a deliverability decision, not a convenience: Spamhaus treats unknown domain reputation as poor by default, and a brand-new calculator domain is exactly the unknown-reputation case, so it inherits nothing. A subdomain inherits the parent's reputation. **Hosting:** pick a static or edge host whose free tier permits commercial use and has headroom for the campaign's click volume. The arithmetic is small: a 100k-requests/day free tier covers a 30k-sends/day campaign at 5% click-through with about 1.5% of the allowance used. **Read the terms before choosing.** Several popular free tiers explicitly bar commercial use, which an agency build for a paying client hits twice over.

Do not build one on spec. **K1 (not the baseline validation wave) and K2 (a committed, funded, OWNED build) gate the build**; this recipe is what to run after both pass. This recipe is the seed for a dedicated `/interactive-tool-magnet` skill (deferred 2026-07-17: build it against a real build, not a guess). **The cheapest first build is our OWN**, not a client's: FNNL Agency is buyer, builder and payer in one, so K2 self-satisfies, and a free count-only query on the company-discovery source, where the chosen tool offers one, gives a TAM tool a structural K4-proof motive (it cannot take a seed domain; the better seeded number is paid). Aaron makes the prospect *guess* their TAM; we can compute it.

## Saturation Rule

If `offer-intelligence.md` exists:

- Prioritize archetypes marked OPEN.
- Allow CROWDED only when delivery is clearly different.
- Exclude SATURATED unless the user explicitly approves a contrarian test.
- Use contrarian opportunities only when they connect to real ICP pain and delivery capacity.

## Premium custom-asset tier (deferred — not built into this flow)

There is a more expensive offer motion this skill deliberately does **not** run by default: bespoke custom ABM assets (personalized landing pages, mockups, deep intelligence reports), including the "report-as-lead-magnet" play where you tease a cheap light analysis and build the full report only on a hand-raise. This is a multiplier on a working offer for a small set of genuinely high-value named accounts (roughly $50K+ contract value), not a broad cold-volume tactic. For most cold-outbound clients the contract value does not justify the per-account build, so pushing every account to this rung burns effort the math will not repay.

It is recorded here as a **future, operator-decided premium product** (deferred 2026-06-17), priced and scoped separately for high-ACV clients — not something to generate inside the standard offer/copy flow. Archetypes A (audit/diagnostic) and B (data/research note) are the lightweight, in-flow cousins of this motion; use those here.

**Archetype K (interactive tool) is the closest scalable cousin, but read the economics honestly.** This tier is deferred because per-account build cost doesn't repay at typical contract value. A tool improves that trade without abolishing it: it is built once and then computes each prospect's own numbers at ~zero marginal cost, so the "this was made for me" feel arrives at cold volume without a per-account build. **But K3's gap-fill is per-responder work, so K does not remove the per-account cost — it moves it from every prospect to every hand-raiser.** That is a real improvement and it is also, precisely, this deferred tier's own tease-then-build-on-a-hand-raise economics. So K is not a back door around this tier: it is the same trade, made cheaper, and it is gated (K2's Fulfillment Split math on the fill, and K1's bar on fronting a baseline validation wave). Where a client wants bespoke-feeling assets at volume, K is the route, with a bounded and ideally script-produced fill; the premium tier stays deferred. Do not propose custom landing pages or per-account asset builds as a default lead magnet unless the operator has explicitly opened the premium tier for this client. A client offering to do the custom per-prospect work themselves counts as opening this tier - see the Fulfillment Split rule (custom work per prospect is allowed when capacity is confirmed at the expected reply-volume).

**The open question against this deferral (recorded 2026-07-17, not yet resolved).** The deferral's stated reason is an *arithmetic* claim: the per-account build cost doesn't repay at typical contract value. That arithmetic was run against a **human** cost base. An AI-built per-account artifact costs cents and seconds, which is a different sum, and if it comes out the other way then the constraint this tier is deferred behind has moved. Note this cuts *with* the paragraph above, not against it: that paragraph's whole point is that K "does not remove the per-account cost, it moves it from every prospect to every hand-raiser," which is an honest admission that even K's improved trade still assumes the fill is **human** work. An AI artifact is the third option neither models, because it puts a near-zero cost on every prospect at send time. **This does NOT reopen the tier by default.** The deferral stands until a pilot earns it, and the escape hatch above (operator explicitly opens the tier for a client) is the only door. What must be true before any such pilot ships is the **Artifact-Truth Gate** below: the cost fell, but the *risk* did not, because AI made the build cheap and did not make the review cheap. And the K1 measurement-integrity logic applies to it unchanged and for the same reason: a strong artifact inflates a reply rate on its own merits, so it may not front a baseline validation wave either, and its read is on meetings.

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

**Status: the gate is live, the motion is not.** This gate exists so the option is real and safe to test. It does NOT authorize the motion. The premium custom-asset tier above is still deferred, and opening it for a client is still an explicit operator decision.

## Who Delivers the Offer (Fulfillment Split) - HARD

The flow runs a two-party fulfillment split, and the lead-magnet delivery check depends on which party owns what. By default the **agency (operator) owns the entire front end**: inbox infrastructure, sending, reply handling, and delivery of the lead magnet and every front-end promise made in the email. The **client receives only qualified leads / booked meetings** (the SQL hand-off) and delivers only the **back-end paid service** after that hand-off.

So "can this be delivered?" has two owners, and they must never be blurred:

- **Front-end offer / lead magnet / risk reversal -> the front-end owner delivers it (the agency by default).** Lock a magnet only if the front-end owner can produce and deliver it **easily, repeatably, at reply-scale, to every positive responder, with its own resources** - without depending on the client to make it. Reject a "too-good" front-end promise the agency cannot deliver itself, even when it scores well. This is the gate that is missed when a magnet the agency cannot deliver on the client's behalf goes live. Re-checked at copy time by the Confirmed Deliverable Gate in `/campaign-copywriting`.
- **Back-end ask (the meeting -> the paid service) -> the client delivers it.** The outcome the meeting leads to must be one the client can actually fulfill (Capability Truth, Hard Rule 28 in `/campaign-copywriting`).

If a candidate magnet genuinely needs the **client** to fulfill the front end (a client-supplied asset, the client's own senior time, client-specific data), that dependency is not automatic: confirm and resource it with the client **before** the magnet is locked (record it as a Confirmed asset), otherwise drop the candidate.

**Custom work per prospect is allowed, not a no-no.** "Deliverable without custom work per prospect" is the *default* scale test, not an absolute bar. A bespoke-per-prospect front-end offer (a made-for-them teardown, a custom audit, archetype F/G, or the report-as-lead-magnet play) is a legitimate and often high-converting option **when the delivering party has explicitly confirmed capacity to produce it per prospect at the campaign's expected positive-reply volume, and the economics fit** - reserved for a lower-volume, higher-ACV segment, and/or capped by teasing a light version and building the full custom asset only on a hand-raise (Premium custom-asset tier above). If the **client** offers to do the custom per-prospect work, treat that as the client opening this tier: do the volume math (expected replies x work-per-reply <= their committed capacity), record it as a confirmed client-delivered dependency, and it scores normally. What is not allowed is a custom-per-prospect promise nobody has confirmed the capacity to fulfill at reply-scale - that is the mirror-image failure (the offer converts, the deliverer drowns, replies rot).

Override: for a client who runs their own front end, set `service_model.front_end_owner: client` in `client-profile.yaml`; absent that field, assume `agency`.

This does not change the teaser-first economics (tease a cheap light asset, build the full asset only on a hand-raise - the premium custom-asset tier above): the gate is on what is **promised to every responder**, which the front-end owner must be able to honor at reply-scale.

## The Next-Step Gate — every magnet must leave a reason to talk (strong default, ALL candidates)

Encoded from the Aaron Shepherd 589-replies method (2026-07-13), reshaped after review 2026-07-17. Not tool-specific: it applies to every front-end asset this skill can lock, and archetype K's K3 is its strictest instance.

**The failure it prevents.** A magnet's job is to get a reply. But a magnet that fully satisfies the prospect has no reason to lead anywhere: they read it, they think "nice, thanks", and it ends. Aaron's diagnosis of why so many magnets pull a flood of yeses and almost no meetings: people create them *with no natural progression to the next step*, so the loop closes and the conversation dies. **A high reply rate with a dead-end magnet can be worse than a lower reply rate with a live one**, because it spends first-touch reputation and reply-handling time to produce nothing.

**The rule.** Before any magnet is locked, name two things in writing:

1. **The unresolved motive** — what still makes them want to talk after consuming the asset. It does NOT have to be a knowledge gap. Knowledge, capability, capacity, delegation, or plain desire created by a true number all count (see K3 for the full set and why the knowledge-only framing is false).
2. **The next step that resolves it** — the call, analysis, or conversation that closes it, and why it's the natural closer.

**The honesty gate.** Whatever is unresolved must be real, not manufactured by crippling the asset or withholding output it could just give them. A fake gap is a trapdoor and it spends the trust the free asset just bought.

Record both in the candidate's output block (`Unresolved motive:` / `Next step that resolves it:`), and in `offer.lead_magnet_gap` / `lead_magnet_next_step`. A candidate with no unresolved motive is heavily marked down and cannot be the top recommendation.

**Enforcement is HERE, at selection time, not at copy time.** This is a strong default, not a hard veto, and `/campaign-copywriting` only WARNS when the fields are missing, it never blocks. The reason is concrete: the fields landed 2026-07-17 and were populated on zero clients in a prior 8-client book while 7 of 8 carried a real locked magnet, so a hard gate at copy time would fail nearly the whole of that book over a defect never observed in any of them. Backfill existing clients at their next campaign refresh. New magnets get this right from the start, which is the point.

## The Diagnostic Order: walk it before scoring (doctrine §2; operator-approved Aaron alignment, 2026-09-21)

Aaron's spine for judging any offer. Walk it top-down and stop at the highest broken item; do not work on a lower item while a higher one is broken.

0. **The buyer is real and specific.** A named buyer type with a problem they already know they have, plus role, authority, current situation, and exclusions. "Founders" or "B2B companies" is not a buyer. Here the buyer comes from the brief's `Pain by persona` rows, not from this skill.
1. **The offer is a concrete thing, not a description of the company:** what they get, how fast, what they must do, and what risk they take.
2. **We can deliver it at twenty yeses** (the four-sentence test's economics below, and the Fulfillment Split above).
3. **The copy can lead with the offer and every word can be true.** This skill writes no copy, so here it means nothing in the offer rests on a claim we cannot back (Capability Truth, the Proof-Asset Gate).
4. **The next step is one easy action, and each follow-up can earn its place** (the Next-Step Gate above; follow-up direction in Output).
5. **We will judge the right number:** time-agreed replies per 1,000 first touches beside positive-reply rate, never reply count alone (doctrine §0, §2 step 5; `/campaign-strategy` winner pick).

## Generate Candidates Across Aaron's Three Buckets (doctrine §5)

Aaron never validates a single guess: *"When you're coming up with your offer, you're always going to want to test like three or four"* (doctrine §5). Generate from the `Candidate Generation Input` rows across his three buckets, at least one candidate per bucket wherever the real service allows one:

1. **Service-based:** a growth-potential mapping or a bounded, evidence-based diagnostic (named for the decision it clarifies, never "audit"; ledger R09). Usually archetype A, G, I or J.
2. **Service-delivery-based:** *"something tangible to them"*, one real unit of the paid work done free (a free ad creative, a free listing creative, a free video). Usually F or H.
3. **Lead-magnet or asset-based:** an asset valuable in itself (*"If you have a really valuable asset that helps them solve a problem, that's what you're offering"*). Usually B, C, D, J or K (K stays fenced by K1 and K2).

Within the buckets, reach for his first-offer families (doctrine §5 step 2): a done-for-you artifact, a bounded evidence-based diagnostic, a data asset (for example a look-alike list built from the prospect's own best case study), a trial or guided pilot, plus tools such as a calculator or a valuation, and samples or mockups (S13). **Choose on the real service and buyer, not on which is easiest to generate** (doctrine §5). The archetype letter still records each candidate for the saturation map; the bucket makes sure the set is broad enough to test.

**Shape each candidate with the value equation, his way (doctrine §4):**

- **Dream outcome: imply it through the artifact by default.** Keep the magnitude inside the contents of the free thing (his instance: a video walking through a comparable brand already doing 80 million, not "we'll help you get to 80 million in revenue"; doctrine §4, examples §1.4). Deliverable-first stays the default (his measured winner). A conditional that names the outcome and pairs it with a zero-risk term ("if we could [result]... at no cost", a free trial, zero upfront payment) is also his own shape (doctrine §4; his Jun 29 and Sep 14 scripts) and runs as a labeled arm (operator-approved Aaron alignment, 2026-09-21): no proof claim on line one, no guarantee on the core service, and an outcome that is not a stretch (that last limit is the corpus's reading, not his words). Still banned: an outcome stated with no risk term, and the retired bundle of an outcome plus a named comparable and its number on line one (proof goes to the PS, one point). (The arm is a copy arm that `/campaign-copywriting` logs in `copy.md`, not an offer validation arm. This bullet used to read "imply it through the artifact, never promise it", a blanket ban his own Jun 29 and Sep 14 copy contradicts.)
- **Perceived likelihood: shrink what is being judged.** Move the judgment off the big outcome and onto the deliverable, pick a deliverable whose delivery odds are effectively 100%, and weave a near-twin case into the offer instead of asserting proof.
- **Time delay: a date-certain free deliverable.** The day count must be a real capacity term the front-end owner can keep; his "7 days" is an example, not a default (doctrine §0).
- **Effort: strip the prospect to one act** ("All you have to do is record." `[AS-client]`, examples §1.3; shape, not sentences, doctrine §9 portability rule).

The reader must be able to answer three things: *what's in it for them / how long it takes / what they have to do* (doctrine §4).

## The Four-Sentence Test and the Twenty-Yes Economics (every candidate)

Write four plain sentences for every candidate (doctrine §5): **who gets the offer, what they receive, what they must provide, and what happens afterward.** Cross out any outcome you cannot prove or deliver. Then **estimate the total work if 20 qualified buyers say yes.** If the economics break, reduce scope, limit availability truthfully, or use a paid pilot. The capacity gate is Aaron's (doctrine §2 step 2: *"super low friction, easy for you to fulfill, but super valuable for them"*); the specific twenty-buyer figure is this system's safeguard built around his teaching (doctrine §13), and the Fulfillment Split above is the reply-scale version of the same check. Record both in the candidate's output block.

## The "Why Not?" Test and the Farming-Interest Check (every candidate, both must pass)

**The "why not?" test** is his acceptance criterion, stated three separate times (doctrine §4): *"if I don't have to pay a massive amount, I don't have to do a lot of work, and I really want the thing that you're offering, why wouldn't I say yes?"* A candidate that leaves the reader a reason to hesitate (cost, effort, access, a vague deliverable) fails.

**The farming-interest check** catches the offer that passes "why not?" and is still worthless: *"anyone can really make their offer a broad enough question to get a yes, but that doesn't mean anything if the person was never going to buy from you"* (doctrine §4). The offer must be *"specific enough to filter out those who don't and compelling enough to pull in those that do."* Ask whether the people who say yes are the people who buy the paid service. If the free thing attracts a different audience than the paid service, it collects replies without building demand (doctrine §3). Record the ruling as `Why not / farming check:` in the output block.

## The Weak-Offer Screen (reject on sight; doctrine §6, examples §9)

Reject any candidate that is one of these, whatever it scores:

- a performance guarantee on the core service as the front end (his named bad offer: *"offering them 20 to 30 calls per month or they don't pay"*);
- a description of the service instead of the thing they get;
- a dream outcome so large it reads as a stretch;
- an offer that sounds like a project or a headache (a new CRM, a new vendor, a big change);
- a 30, 60 or 90-day window for the front end (a quick win before commitment beats any guarantee window, doctrine §4);
- a template-shaped offer, or a commoditized one with no layer above it;
- generic proof bolted on, or process narration standing in for the offer;
- a market too small to validate;
- a generic stranger audit that creates homework, or back-end access asked for cold (*"they don't know you, they don't like you, they don't trust you"*);
- a broad yes-farming question;
- an inbound or referral offer reused on strangers (his "#1 cold email killer").

**Never name the offer an "audit"** (doctrine §3, examples §8). A bounded, evidence-based diagnostic can survive under a better name that says what decision it clarifies (ledger R09), which is why archetype A stays in the table.

**Aaron's "strategic bait" is not adopted** (doctrine §5: *"Almost a white lie, so to speak"*). Capability-truth governs: a claim of buyer intent that is not specifically true of the recipient fails, and "technically true at the firm level" does not make it true in the sentence the prospect reads.

## Fulfillment First: the Four Artifacts Before Any Offer Locks (doctrine §11)

**The reply is the start of the promise, not permission to change it** (doctrine §11 bolds this as the corpus's own summary of his reply-stage teaching; it is not his quote, attribution corrected 2026-09-21). Before the primary offer or any validation arm locks, write its four fulfillment artifacts. **If any one cannot be written honestly, the offer is not ready to lock.**

1. **Delivery reply:** what we send on a yes, how, and by when. It delivers what was promised first, with no unexpected booking gate and no calendar link in the delivery reply. Never propose times in a delivery reply, whether or not the asset leaves an open question; the next step sits one layer down and refusable ("calendar's on the next page if you think there's interest", examples §7.3; ledger R03); times are proposed only on explicit booking intent. No offer to walk them through it on a call either: that is a call ask disguised as help, and his rule is "you don't want to add any sort of sales friction until they've actually consumed the value" (S06, transcript 2026-07-13). (operator-approved Aaron alignment, 2026-09-21)
2. **Input needed after yes:** what the prospect must send before we can deliver (a URL, a logo, an invoice, access). Write `none` only if a one-word yes truly suffices: a one-word yes does not supply an invoice, an address, consent, or system access (doctrine §5 step 4).
3. **If they don't qualify:** the honest one-line reply for a yes we cannot or will not serve. State the real criteria plainly; never invent a reason.
4. **Paid next step, explained:** one or two plain sentences on the paid engagement the free thing leads into, as the prospect would read it. It must agree with `Next step that resolves it:` from the Next-Step Gate.

These are fulfillment facts in plain words, not send-ready copy. Final reply wording belongs to `/campaign-copywriting` (Hard Rule 36) and the reply-agent setup skill for the locked sending platform, which read them from `lead-magnets.md` (Save Output).

## Score Ideas

Score every candidate, including Candidate A, against the same 7-point offer rubric used by `/offer-intelligence`:

| Criterion | Points | Meaning |
|---|---:|---|
| Addresses #1 ICP pain directly | 0-2 | Does it match the strongest pain from discovery, not just the client's internal pitch? |
| Scalable delivery | 0-1 | Can the **front-end owner (the agency by default - see Fulfillment Split)** deliver it to every positive responder at the campaign's expected reply-volume? Custom-work-per-prospect is not an automatic 0 - it scores when the delivering party has confirmed per-prospect capacity at that volume (Fulfillment Split: custom work is allowed, not a no-no). |
| Proves competence | 0-1 | Does receiving it prove the client understands the problem? |
| Low prospect friction | 0-1 | Can the prospect claim it in under 60 seconds? |
| Differentiated from the field | 0-2 | Is it meaningfully different from competitor offers and saturated archetypes? |

Prioritize candidates scoring 6-7. A 5 can be shown only if it has a clear fix. Do not recommend candidates scoring 4 or lower unless the user asks for weak backup ideas.

**The Aaron gates are pass/fail, not points.** The diagnostic order, the four-sentence test and twenty-yes economics, the "why not?" and farming-interest check, the weak-offer screen, and the four fulfillment artifacts sit outside the 7 points (the rubric itself is this system's scale, doctrine §13). A candidate that fails any of them cannot lock as the primary or as a validation arm, whatever it scores.

The 7 points above are the whole score. **Do not add a signal-obtainability axis to it.** Real obtainability is measured downstream in `/data-point-discovery` (kickoff step 3.3) against actual coverage, not predicted here, so an axis scored at this point would be scored on a guess and would silently change which offer wins. The one real risk that ordering creates is handled by the single check below, which is a pass/fail on the winner rather than a scoring axis.

## The Signal-Capability Check (at offer lock, one check, not a research phase)

**This check is now the only thing standing between a signal-dependent offer and an unobtainable signal.** There is no separate source-signal discovery step upstream or downstream to catch it: obtainability is confirmed later in `/data-point-discovery` (kickoff step 3.3), which is after the offer has already locked. So if a signal-dependent offer gets through here, the failure surfaces only once the list is being built around a signal nothing can obtain. That makes this a minute well spent, not a formality. Run it once per saved offer (the primary and each validation arm), never on candidates that lost. It is a check, not research.

**Step 1 decides most cases instantly.** Does this offer's relevance depend on an observable buyer signal, meaning something specific that must be true and visible about a prospect right now before the offer makes sense to send them? **If no, the check passes immediately. Stop here and lock the offer.** Do not open the stack contract, do not name a signal, do not write anything beyond `none`. A free deliverable that is useful to any company in the ICP (most audits, templates, research notes, and the `direct_offer` path) needs no signal, and that is the preferred shape precisely because it has no external dependency.

**Step 2, only if step 1 was yes.** Name the signal in one line, plainly (for example "recently posted a job for an SDR", "runs ads on Meta right now", "uses a named checkout platform").

**Step 3.** Open the stack contract and confirm some slot declares a capability that could obtain that signal:

```text
<outbound>/stack-contract.yaml
```

The usual slots are `lead_data.company_discovery`, `lead_data.contact_discovery`, `lead_data.intent_signals`, `web.search`, and `web.crawl`. A slot counts as declaring the capability when it names a tool (`status: chosen` or `live`) whose stated `capability` plainly covers the signal. A slot at `not_chosen`, `held` or `n/a` declares nothing and does not count.

**Step 4, the ruling.**

- **Something declares it, `status: live`:** the dependency is real and proven. Lock the offer.
- **Something declares it, `status: chosen`:** the tool is named but has never been proven against a real call, so treat the dependency as unconfirmed rather than satisfied. Lock the offer and record the signal as a dependency for `/data-point-discovery` to verify at step 3.3. Say so in one line when reporting the lock, so nobody reads `chosen` as working.
- **Nothing declares it:** **the offer is not locked.** Take one of two exits, in this order: drop the signal dependency if the offer still works without it (often it does, and a signal-free offer is the stronger shape anyway), otherwise move to the next-highest-scoring candidate and re-run this check on it. Do not invent a vendor, and do not assume a capability the contract does not name.

Record the outcome either way in `offer.lead_magnet_signal_dependency` (see Save Output). `none` is the common and preferred value.

**This does not replace the Stack Resolution stop at the top of this skill.** If a role this skill actually needs to run is empty in the contract, that stop still fires and still routes to `/stack-setup`. This check is narrower: it is about whether the chosen offer's premise is obtainable, and its remedy is a different offer rather than a different stack.

## Lock One Primary Plus Validation Arms (doctrine §5; operator-approved Aaron alignment, 2026-09-21)

Aaron tests three or four offers and lets the market pick (doctrine §5; *"Let the market tell you what you should do"*, doctrine §3). Locking one offer and validating it is validating a single guess. So the lock writes two things:

- **One primary offer** in `offer.lead_magnet` (unchanged field). It stays the only field that means "the offer is locked", and every downstream skill keeps reading it.
- **One to three validation arms** in the new list field `offer.validation_arms`: the next candidates, in score order, that pass every gate the primary passed (the diagnostic order, the weak-offer screen, the four-sentence test and twenty-yes economics, the "why not?" and farming check, the four fulfillment artifacts, the Fulfillment Split, the Next-Step Gate, and the Signal-Capability Check). Each entry carries the same fields as the primary offer block (Save Output).

**Rules for arms:**

- **Prefer an arm from a different bucket than the primary** where one passes every gate, so the first wave tests offers rather than phrasings of one offer. Positioning of the offer is the second test, after the offer itself (doctrine §5 step 9).
- **An arm must be able to run on the primary's list.** `/campaign-strategy` splits the same broad list across the primary and its arms with the same copy skeleton, so the offer is the only variable. An arm may therefore not depend on a buyer signal the broad list does not carry (drop the dependency or skip the candidate). Its `offer_fit_disqualifiers` should add no company type the primary's list keeps; where one does, record it, and `/campaign-strategy` applies the union of disqualifiers to the validation list so every arm sees the same companies.
- **K1 binds arms:** no archetype K tool as an arm in a baseline validation wave.
- **Arms are ranked.** Arm 1 always runs beside the primary; arms 2 and 3 run only when send capacity gives each its own pooled-flip floor. `/campaign-strategy` makes that call at launch, because capacity is unknown here.
- **Empty is an exception, not a default.** If no second candidate passes every gate, generate more across the buckets first. Only if none survives, write `validation_arms: []` and say why in `lead-magnets.md` under `## Validation arms` and in the lock report: a single-offer wave validates one guess.

**After the wave, the market decides.** The winning arm becomes, or stays, `offer.lead_magnet` for scale, and arms that do not get proper responses are deactivated (doctrine §5 step 9: *"deactivat[e] the angles that don't get proper responses"*). `/campaign-strategy`'s flip criterion owns that read: each arm flips on its own pooled positive replies, and among PROVEN arms the winner is the one that does not lose on time-agreed replies per 1,000 first touches; a PROVEN arm that farms interest is reshaped to filter better, not scaled and not killed. Promotion re-uses a candidate that already passed every gate here, so it does not reopen offer work.

## Output

For each idea:

```markdown
**[Offer name]**
Bucket: <service-based / service-delivery-based / lead-magnet or asset-based (doctrine §5)>
What it is: <one sentence>
Who it is for: <ICP segment>
Four-sentence test: <who gets it / what they receive / what they must provide / what happens afterward (doctrine §5)>
At twenty yeses: <the total work if 20 qualified buyers say yes, and whether the economics hold (the twenty-buyer figure is house, doctrine §13)>
What is needed to deliver it: <tools, data, time>
Front-end delivery: <who delivers it - agency by default; if it needs the client, name the dependency to confirm> | agency can deliver at reply-scale: <yes / no>
Why not / farming check: <why a buyer would say yes with no reason to hesitate, AND why the people who say yes are buyers of the paid service rather than farmed interest (doctrine §4)>
Weak-offer screen: <pass, or the pattern it hits (doctrine §6, examples §9)>
Unresolved motive: <what still makes them want to talk after consuming this - knowledge / capability / capacity / delegation / desire (Next-Step Gate)>
Next step that resolves it: <the call / analysis that closes it, and why it's the natural closer>
Delivery reply: <what we send on a yes, how, and by when; delivers first, no booking gate, no calendar link, no proposed times, no offer to walk them through it on a call (doctrine §11; times only on explicit booking intent)>
Input needed after yes: <what the prospect must send before we can deliver, or "none" only if a one-word yes truly suffices>
If they don't qualify: <the honest one-line reply for a yes we cannot or will not serve>
Paid next step, explained: <one or two plain sentences on the paid engagement the free thing leads into>
Build + fill cost: <none, or: build hours + who owns/pays, AND the per-responder fill work with the Fulfillment Split math - archetype K only>
CTA direction: <plain-English ask direction for /campaign-copywriting, not final wording>
Why it should work: <short reason tied to ICP pain>
Signal dependency: <none (needs no observable buyer signal - the common and preferred answer), or: the signal named in one line. On the primary and every arm, add the Signal-Capability Check ruling: declared live / declared but unproven (chosen) / not obtainable>
Risks: <one reason this could fail>
Offer score: X/7
Role at lock: <primary / validation arm 1, 2 or 3 / not locked, with the reason>
```

The four fulfillment fields (`Delivery reply`, `Input needed after yes`, `If they don't qualify`, `Paid next step, explained`) are required for the primary and every arm before lock (doctrine §11). For other candidates, fill them once the candidate is in contention.

Show the ranked options before locking anything. Do not include final CTA lines, subject lines, openers, or send-ready phrasing.

For any candidate, include how the offer can carry Email 1 and its one or two same-thread follow-ups without repeating the same generic deliverable. The sequence is ONE thread with 2 to 3 steps (`/campaign-copywriting` Hard Rule 18); the 4-email / two-thread structure was retired 2026-07-05, so there is no second new-thread purpose to support. In Aaron's method a follow-up either adds to the offer (a pre-handled concern, a benefit layer, a risk reversal, the reason it is free) or strips it back to a lower-friction version of the same offer (his two-minute Loom); it never repeats Email 1 (doctrine §11, ledger R12). Keep this at direction level only.

## Execution Mode Gate

After scoring is complete and ranked options are ready, check `run_state.execution_mode` from `client-profile.yaml`:

Whichever mode applies, the primary offer and every validation arm must pass the Aaron gates (pass/fail, Score Ideas), clear the Signal-Capability Check, carry its four fulfillment artifacts, and carry an `offer_fit_disqualifiers` list before it is saved. None of these is a pause: the check passes instantly for any offer that needs no signal, and the artifacts and the disqualifier list are written from the locked offer in minutes.

- `auto_execute`: select the highest-scored candidate that passes every gate as the primary, and the next one to three gate-passing candidates (ranked, preferring a different bucket) as validation arms, all automatically. Do not pause for input. Run the Signal-Capability Check on each; if one fails (nothing in the contract can obtain the signal it depends on), drop the signal dependency or move down the ranking and re-check, still without pausing. Report: "Auto-selected offer: [name] (score: X/7), plus validation arms: [name (score), ...]. Reason: [one-sentence rationale tied to ICP pain]. Signal dependency: [none, or the signal plus its ruling]." If no arm survives, say so in the report (Lock One Primary Plus Validation Arms). Then write the disqualifier lists and the fulfillment plan and proceed directly to Save Output.
  - **Exception — `auto_execute` can never self-lock an archetype K tool.** K2 is a human commitment of money, time, and ownership that no auto-selection can make on the operator's behalf. So if a K candidate scores highest and K2 is **not already satisfied on file** (a named, funded, owned build), do not auto-lock it: auto-lock the highest-scoring **non-K** candidate instead and report the K candidate as a flagged recommendation ("K scored highest but needs a committed build owner; locked [next candidate] and surfaced K for your decision"). When K2 **is** already satisfied and recorded, K auto-locks normally like any other candidate, subject to K1 (not the baseline validation wave). This resolves the collision between "pick the highest, don't pause" and a gate that structurally requires a person to say yes.
- `review_gates` (default): display all ranked candidates with the recommended primary and validation arms marked. Ask the operator to choose the primary and confirm the arms before saving. Do not continue to strategy or copy until a selection is made.

## Offer-Fit Disqualifiers (produced HERE at offer lock, consumed by `/tam-build`)

Once the offer is locked, before saving, write the list of company types that **cannot use this offer**. This is a required output of offer lock, not an optional extra. Write one list for the primary (`offer.offer_fit_disqualifiers`, the one `/tam-build` reads) and one inside each validation arm. Arms run on the primary's list, so an arm's list should add no company type the primary's keeps (Lock One Primary Plus Validation Arms).

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
- The field **absent** means this step never ran. `/tam-build` should route back here rather than assume nobody is disqualified.

**Keep each `check` cheap and precise.** The pre-screen is free only if it reads fields the discovery source already returned. Where a check is a category match, hold `/tam-build`'s existing NAME+DOMAIN-only matching discipline: match on the company name and domain, never on a keyword or specialty blob. Loose keyword matching over-drops real ICP accounts (the repo records 290 false positives against 23 true hits from the looser approach). If a disqualifier can only be decided by a keyword scan or a guess, say so in `check` and let `/tam-build` handle it as a judgement call rather than an auto-drop.

Also write the same list in plain prose into `lead-magnets.md` under a `## Offer-fit disqualifiers` heading, so the operator can see and challenge it. The YAML in `client-profile.yaml` is the source of truth that `/tam-build` reads; the markdown is the human-readable mirror.

## Save Output

Save the brainstorm to:

```text
profiles/<business-slug>/lead-magnets.md
```

After the offer is selected (by operator choice or auto_execute), update `client-profile.yaml` with:

```yaml
offer:
  lead_magnet: <top pick name>  # the PRIMARY offer; still the only field that means "locked"
  lead_magnet_details: <one sentence on what gets delivered>
  lead_magnet_cta_direction: <plain-English ask direction with deliverable, usefulness, and delivery constraint, not final copy>
  lead_magnet_gap: <the loop the asset REOPENS - what the prospect still won't know after consuming it (Next-Step Gate). Required for any real magnet; omit only for `direct_offer`>
  lead_magnet_next_step: <the call / analysis that fills that gap - what the reply routes to>
  lead_magnet_build_owner: <archetype K only - who builds, hosts, maintains, and pays for the one-time build (gate K2). Must be a confirmed commitment, not an assumption>
  lead_magnet_signal_dependency: <`none` when the offer needs no observable buyer signal (common, preferred), otherwise the signal named in one line plus the Signal-Capability Check ruling (`live` / `chosen, unproven`). Read by /data-point-discovery at step 3.3>
  offer_fit_disqualifiers:      # REQUIRED at offer lock. Company types that cannot use this offer; /tam-build reads this in its free pre-screen. `[]` means none apply; absent means this step never ran
    - category: <short stable slug>
      why: <why this company type cannot use the locked offer>
      check: <the observable that decides it; NAME+DOMAIN only for category matches>
  validation_arms:              # NEW 2026-09-21 (operator-approved Aaron alignment, doctrine §5). 1 to 3 ranked arms beside the primary; [] only when no second candidate passes every gate (say why in lead-magnets.md)
    - rank: 1                   # arm 1 always runs beside the primary; arms 2 and 3 only when /campaign-strategy finds capacity for each arm's pooled-flip floor
      status: active            # active | deactivated (no proper responses in the wave) | farming_interest (PROVEN on positives but losing on time-agreed replies per 1,000; reshape to filter better, not scaled) | promoted (won; its fields now sit in the primary block above)
      lead_magnet: <arm name>
      lead_magnet_details: <one sentence on what gets delivered>
      lead_magnet_cta_direction: <plain-English ask direction, not final copy>
      lead_magnet_gap: <the arm's own unresolved motive (Next-Step Gate); omit only for `direct_offer`>
      lead_magnet_next_step: <the call / analysis that resolves it>
      lead_magnet_build_owner: <archetype K only; K1 keeps a tool out of a baseline validation wave, so normally absent on an arm>
      lead_magnet_signal_dependency: <`none`, or a signal the primary's broad list already carries, plus its ruling>
      offer_fit_disqualifiers: []   # same shape as the primary's; ideally adds nothing the primary's list keeps, and /campaign-strategy applies the union to the validation list
```

**Write the fulfillment plan and the arms into `lead-magnets.md` as well**, since the four fulfillment artifacts live there rather than in the YAML: a `## Fulfillment plan` heading with one block per locked offer (primary first, then each arm) carrying `Delivery reply:`, `Input needed after yes:`, `If they don't qualify:` and `Paid next step, explained:`, and a `## Validation arms` heading listing each arm, its bucket, its score, and why it was chosen (or, when `validation_arms: []`, why no second candidate survived). The reply-agent setup skill for the locked sending platform and `/campaign-copywriting` read the fulfillment plan from there.

**When the wave picks a winner** (`/campaign-strategy` flip criterion), a winning arm's fields move into the primary block, the arm's `status` becomes `promoted`, and the previous primary is recorded as an arm with `status: deactivated`. Record the swap in the activity log. It re-uses fields that already passed every gate here, so it is not a new offer lock.

`lead_magnet_gap` is what `/campaign-copywriting` reads to decide which delivery shape applies (the Delivery Message rule in its CTA Hierarchy, Hard Rule 36). A magnet with a real gap earns the pure-value delivery, and its required day 2-3 follow-up carries the ask, aimed at the gap; one without a gap carries one soft, refusable pointer to the next step in the delivery itself, because no follow-up aimed at a gap exists to carry it. Never propose times in a delivery reply, whether or not the asset leaves an open question; the next step sits one layer down and refusable ("calendar's on the next page if you think there's interest", examples §7.3; ledger R03); times are proposed only on explicit booking intent. So this field is load-bearing, not documentation. (operator-approved Aaron alignment, 2026-09-21: a magnet without a gap used to keep "a soft time-proposal at delivery".)

Do not overwrite or delete `offer.client_suggested_*` fields. They are useful context showing what the client originally believed.

Do not save exact CTA example fields from this skill. Exact CTA copy belongs to `/campaign-copywriting`.

## Common Mistakes

- Offering a front-end magnet the **front-end owner (agency by default) cannot deliver easily at reply-scale** on the client's behalf - or a back-end ask the client cannot fulfill (Capability Truth). See Fulfillment Split.
- Calling a meeting the offer. A meeting is an ask, not a magnet.
- Requiring too much from the prospect.
- Hiding the asset behind a form.
- Using generic "consultation" language.
- **Locking a magnet that dead-ends** (nothing left unresolved, no natural next step). It farms yeses that never become meetings. See the Next-Step Gate.
- **Fronting an offer's baseline validation wave with a tool** (it inflates the reply rate the wave exists to read, so you learn nothing about the offer), or locking one with no committed, funded, OWNED build. See gates K1 and K2. Note K1 is about measurement, not cost: a tool is cheap, and "it's cheap" is not an exception.
- **Reading K3 as "hide an input".** The unresolved motive can be capability, capacity, delegation or desire, not just knowledge, and a gap manufactured by crippling the tool fails K4 outright. Make the inputs easy; let the motive be what's unresolved.
- **Waving a tool past the Fulfillment Split because "it's free per responder".** The tool is; **its gap-fill is not**. Run the volume math (expected positive replies × work-per-fill ≤ committed capacity) on the FILL, not the build. The build is the small cost; the fill grows with success, and it is the one that drowns you.
- **Locking one offer and validating a single guess.** Aaron tests three or four (doctrine §5). Lock a primary plus one to three validation arms, and let the wave pick the winner: each arm flips on positive replies, then the PROVEN arm that does not lose on time-agreed replies per 1,000 scales.
- **Leading with the service instead of an offer.** A service description, a stretch outcome promise, or a guarantee on the core service is a weak offer (doctrine §6); the front end is a free, inspectable unit of the paid work (doctrine §3).
- **Naming the offer an "audit"**, or leaving out the word "free" (doctrine §3, examples §8).
- **Farming interest.** An offer broad enough that anyone says yes collects replies from people who will never buy (doctrine §4). Run the farming-interest check, not only "why not?".
- **Locking an offer whose four fulfillment artifacts cannot be written honestly** (doctrine §11), or one that hides a booking gate, a deposit or an access request until after the yes (doctrine §3: "Remove homework, not honesty").

## What To Do Next

The offer locks here, and the rest of the chain is built to fit it. `offer.validation_arms` travels with it: `/campaign-strategy`'s Offer-Validation Wave runs the primary plus at least one arm on the same broad list. Once `offer.lead_magnet` is set in `client-profile.yaml` (by operator selection or auto_execute), the order is `/data-point-discovery` (step 3.3, where obtainability becomes a measurement against a locked offer rather than a guess), then `/tam-build` (which consumes `offer.offer_fit_disqualifiers` from this skill), then `/social-proof-bank` and `/lead-scoring`, then `/campaign-strategy`. `/cold-email-kickoff` orchestrates that sequence, so on a guided run hand back to it rather than jumping ahead.

If you are already past the list build and strategy is the only missing piece, run `/campaign-strategy`.

If `execution_mode = review_gates` and no ranked option has been selected yet, stop and ask the operator to choose one. Do not continue to strategy or copy from brainstorm-only ideas.

If a campaign has already been selected, run `/campaign-copywriting`. That skill owns exact CTA wording and must apply `spam-word-checker.md` plus `cold-email-copy-best-practices.md` before copy is shown, saved, exported, spun, or uploaded.
`````
