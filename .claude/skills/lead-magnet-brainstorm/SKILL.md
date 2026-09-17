---
name: lead-magnet-brainstorm
description: Helps choose a front-end offer for cold emails. Use after /offer-intelligence discovery mode. Scores all candidates on a 7-point rubric, then checks run_state.execution_mode - auto_execute picks the top-scored candidate and proceeds without pausing; review_gates presents ranked options and waits for operator selection. Exact CTA copy is written later in /campaign-copywriting.
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

**A direct offer with no lead magnet is a valid, often-preferred outcome (the CTA Hierarchy).** Per the offer-first CTA Hierarchy (`/campaign-copywriting` → Offer-First Copy Standard), the booked call is always the goal and a lead magnet is optional, never mandatory. Do NOT invent a front-end asset just to have one. Score the direct-offer path (lead with the offer, close with a soft ask like `Would that be worth sharing more?`) as a first-class candidate alongside any real magnet. A real, low-friction asset can win, especially as a follow-up mechanism, but a manufactured one should not. When the client has no natural free resource to give, the strongest recommendation is usually "no front-end magnet, lead with the direct offer". Record that as `offer.lead_magnet: direct_offer` (the List Gate and `/campaign-copywriting` accept this sentinel in place of a magnet). If every magnet candidate is invented or high-friction, the direct offer wins.

Final CTA wording must be handled by `/campaign-copywriting`. Keep CTA output here at direction level only, then let `/campaign-copywriting` apply the confirmed-deliverable gate and the permission-based, value-backed CTA framework.

CTA direction must still be specific enough to prevent generic copy. Name the deliverable, what the prospect receives, why it is useful, and what must be true before it can be promised. Do not leave `/campaign-copywriting` with only a vague "short note" direction unless that generic wording is the deliberate test.

Whatever offer wins must be able to pass the Offer Architecture gate at copy time: SQL vs MQL framing, the easy-to-say-yes-to test, and a named risk reversal (full gate in `/campaign-copywriting`). Prefer candidates with a clear, low-friction risk reversal. Flag any pick that has none so `/campaign-copywriting` can resolve it before Email 1.

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

Always generate at least 3 additional candidates before scoring. The client suggestion may win, but it must beat the alternatives on the same rubric.

## AI/API Routing

Ideation crunch routes per `ai-model-routing.md`: synthesizing the offer-intelligence brief, source-signal pains, and archetype-fit reasoning across large context → the bulk-classification model; strict rubric scoring and JSON output → a general-purpose model with structured output. Both of those are roles, so `ai-model-routing.md` names which tool fills each one. This skill reads existing research; it does not run new web research (that lives in `/offer-intelligence`). CTA wording stays at direction level for `/campaign-copywriting` (Claude API).

## Required Input

Before asking anything, check for:

```text
profiles/<business-slug>/offer-intelligence.md
```

If it exists, load:

- ICP pain language
- Saturation map
- Recommended direction
- Contrarian opportunity, if any

Also load `profiles/<business-slug>/client-profile.yaml` if it exists. If it contains `offer.client_suggested_lead_magnet`, include that suggestion as Candidate A and preserve any `offer.client_suggested_lead_magnet_details` as delivery context.

Also load `profiles/<business-slug>/source-signal-intelligence.md` if it exists. If it exists, every recommended candidate must connect to at least one ranked source signal or clearly explain why the source signal should not shape the offer.

If it does not exist, ask whether to run `/offer-intelligence` discovery mode first using a native choice prompt:

```text
No offer-intelligence brief exists yet. What should I do?

A. [Recommended] Run /offer-intelligence discovery first
B. Continue with self-reported context and label the brainstorm weaker
C. Stop until the missing brief exists
D. Custom answer
```

## Intake

Ask one at a time using Claude Desktop native Interactive Inputs / Choice Prompts. When the profile, website, source-signal brief, or offer-intelligence brief gives a likely answer, pre-fill it as the recommended option.

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
| A | Audit or diagnostic | A short review of one measurable problem | Agencies, consultants, dev shops, compliance, operations | Everyone offers audits, so the angle must be specific |
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

**Aaron's own warning, and why the gates below exist.** His 589 is a count of **positive replies, not meetings.** He says it plainly: getting a reply and booking a call are two completely different things, and most people who build a magnet like this get a flood of yeses and a terrible meeting-to-lead ratio. The tool is a reply engine by default; whether it also becomes a *meeting* engine is the open question K3 tries to answer, and the honest state of that answer is "plausible, unproven" (see K3). A tool that leaves the reader with no reason to talk is the shape most likely to produce polite dead ends.

### The four gates (K1, K2, K4 are HARD; K3 is a strong default)

These sit on top of the standard eligibility gates, not instead of them. They are deliberately not all the same strength: **K1, K2 and K4 must pass before a tool is locked** (they protect the measurement, the money, and the prospect's trust). **K3 is a strong default, not a veto** — a tool with no unresolved motive is heavily marked down and cannot be the top recommendation, but it is not auto-rejected, because the evidence under the mechanic is one unrun build (see K3). Note K4 governs whatever K3 produces: if there IS a gap, it must be real; a candidate that honestly has no gap fails K3's default, not K4.

**K1 — No tool fronts a baseline Offer-Validation Wave (the measurement-integrity gate).** A tool may not be the E1 asset for the FIRST validation wave on an offer. It is welcome in any follow-on wave, once that offer has a baseline reply read on offer-led copy.

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

Anchor on something real. Aaron's own line on the neighbouring tactic (naming the prospect's industry in the copy) is the binding principle: *don't lie about it.* Only claim the scale, the price, or the industry coverage if it is genuinely true and the data genuinely includes them. This anchor is a direction here; `/campaign-copywriting` owns the final wording and applies the anti-fabrication rule.

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

## Source-Fit Rule

If `source-signal-intelligence.md` exists:

- Tie every serious candidate to a ranked source signal, why-now hypothesis, or source-backed pain.
- Do not rank a candidate first if it only fits the broad ICP but does not make sense for the source signal.
- Treat client-suggested offers as Candidate A, but make them pass the same source-fit check.
- If a strong offer ignores the top source signal, explain whether the source signal is weak, creepy, low-volume, or a bad fit for the client's capability.

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

After the 7-point score, add `Source-signal fit: strong | medium | weak`. A weak source-signal fit cannot be the top recommendation unless the source-signal brief itself is weak and you say why.

## Output

For each idea:

```markdown
**[Offer name]**
What it is: <one sentence>
Who it is for: <ICP segment>
What is needed to deliver it: <tools, data, time>
Front-end delivery: <who delivers it - agency by default; if it needs the client, name the dependency to confirm> | agency can deliver at reply-scale: <yes / no>
Unresolved motive: <what still makes them want to talk after consuming this - knowledge / capability / capacity / delegation / desire (Next-Step Gate)>
Next step that resolves it: <the call / analysis that closes it, and why it's the natural closer>
Build + fill cost: <none, or: build hours + who owns/pays, AND the per-responder fill work with the Fulfillment Split math - archetype K only>
CTA direction: <plain-English ask direction for /campaign-copywriting, not final wording>
Why it should work: <short reason tied to ICP pain>
Source-signal fit: <strong / medium / weak, with the source signal named>
Risks: <one reason this could fail>
Offer score: X/7
```

Show the ranked options before locking anything. Do not include final CTA lines, subject lines, openers, or send-ready phrasing.

For any candidate likely to be used in a 4-step campaign, include how the offer can support two different new-thread purposes without repeating the same generic deliverable. Keep this at direction level only.

## Execution Mode Gate

After scoring is complete and ranked options are ready, check `run_state.execution_mode` from `client-profile.yaml`:

- `auto_execute`: select the highest-scored candidate automatically. Do not pause for input. Report: "Auto-selected offer: [name] (score: X/7). Reason: [one-sentence rationale tied to ICP pain and source-signal fit]." Then proceed directly to Save Output with the chosen candidate.
  - **Exception — `auto_execute` can never self-lock an archetype K tool.** K2 is a human commitment of money, time, and ownership that no auto-selection can make on the operator's behalf. So if a K candidate scores highest and K2 is **not already satisfied on file** (a named, funded, owned build), do not auto-lock it: auto-lock the highest-scoring **non-K** candidate instead and report the K candidate as a flagged recommendation ("K scored highest but needs a committed build owner; locked [next candidate] and surfaced K for your decision"). When K2 **is** already satisfied and recorded, K auto-locks normally like any other candidate, subject to K1 (not the baseline validation wave). This resolves the collision between "pick the highest, don't pause" and a gate that structurally requires a person to say yes.
- `review_gates` (default): display all ranked candidates. Ask the operator to choose one before saving. Do not continue to strategy or copy until a selection is made.

## Save Output

Save the brainstorm to:

```text
profiles/<business-slug>/lead-magnets.md
```

After the offer is selected (by operator choice or auto_execute), update `client-profile.yaml` with:

```yaml
offer:
  lead_magnet: <top pick name>
  lead_magnet_details: <one sentence on what gets delivered>
  lead_magnet_cta_direction: <plain-English ask direction with deliverable, usefulness, and delivery constraint, not final copy>
  lead_magnet_gap: <the loop the asset REOPENS - what the prospect still won't know after consuming it (Next-Step Gate). Required for any real magnet; omit only for `direct_offer`>
  lead_magnet_next_step: <the call / analysis that fills that gap - what the reply routes to>
  lead_magnet_build_owner: <archetype K only - who builds, hosts, maintains, and pays for the one-time build (gate K2). Must be a confirmed commitment, not an assumption>
```

`lead_magnet_gap` is what `/campaign-copywriting` reads to decide whether the no-pitch delivery message applies (the Delivery Message rule in its CTA Hierarchy). A magnet with a real gap earns the pure-value delivery; one without it keeps a soft time-proposal at delivery, because nothing else would carry the prospect to a call. So this field is load-bearing, not documentation.

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

## What To Do Next

If `offer.lead_magnet` is now set in `client-profile.yaml` (by operator selection or auto_execute), run `/campaign-strategy` if strategy is missing.

If `execution_mode = review_gates` and no ranked option has been selected yet, stop and ask the operator to choose one. Do not continue to strategy or copy from brainstorm-only ideas.

If a campaign has already been selected, run `/campaign-copywriting`. That skill owns exact CTA wording and must apply `spam-word-checker.md` plus `cold-email-copy-best-practices.md` before copy is shown, saved, exported, spun, or uploaded.

