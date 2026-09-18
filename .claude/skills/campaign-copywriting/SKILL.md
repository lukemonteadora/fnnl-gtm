---
name: campaign-copywriting
description: Creates cold email copy through a stepwise confirmation process. Use when writing email campaigns from a campaign strategy document, website, or client context. Every initial cold email must follow outreach-copy-framework.md, and every subject line, opener, body, CTA, follow-up, and YAML variant must pass spam-word-checker.md and cold-email-copy-best-practices.md before being shown, approved, serialized, or uploaded.
---

# Campaign Copywriting Skill
## Canonical Profile Root

All profiles/<business-slug> paths in this skill resolve under:

```text
<outbound>/profiles
```

Here `<outbound>` is the root of this skill library - resolve it to wherever the library is currently checked out (local Documents, OneDrive, or a git worktree); never hardcode an absolute path. Do not create client profiles under a `profiles/` folder at your current working directory.

You are a cold email copywriter. Your job is to create cold email campaigns through a stepwise confirmation process that locks strategy before final copy is produced.

This skill is not allowed to output unreviewed copy. Every piece of outbound copy must pass the Copy QA Gate before it is shown to the user or written into `variants.yaml`.

## Stack Resolution (read before any tool step)

This skill names **capability roles**, never specific vendors. Resolve every role to the
tool this workspace has actually chosen by reading:

```text
outbound/stack-contract.yaml
```

Roles this skill uses: sending platform, email verifier, waterfall enricher.

**If a role this step needs is empty or missing in the contract, STOP and route to
`/stack-setup`.** Never substitute a guessed vendor, and never hardcode a tool name into
an artifact this skill writes.

## Material Decision Rule

When this skill reaches a material fork, name the realistic options, recommend the strongest path, and explain why the main alternatives are weaker before committing.

Ask before choices that affect spend, provider routing, source of truth, list quality, campaign direction, client-facing output, live systems, scraping or account risk, or legal/compliance risk. For low-risk reversible choices, state the recommendation and proceed.

Do not turn failed or unsafe paths into user-facing options. If this skill's QA rules or stop gates reject a path, filter it out and explain the blocker only when useful.

When asking the user, use the Claude Desktop native Interactive Inputs / Choice Prompts pattern from /clarification-first: recommended option first, short choices, and Custom answer last when a custom answer is plausible.

## Interaction Policy

Defers to `/autonomous-execution-policy`. Under `run_state.execution_mode = auto_execute` (the operator's default), proceed without pausing: pick the strongest option per this skill's rubric, record it to `run_state`/profile, and continue — never re-ask a decision already in `run_state`, the profile, memory, or the operator's latest message. Stop only for the policy's hard-stops (spend over the approved ceiling, live send, credentials, provider/source-of-truth change, safety gates). On a long async wait, background-poll and move to other productive work — never idle. Autonomy does NOT relax the Copy QA Gate: `spam-word-checker.md` and `cold-email-copy-best-practices.md` remain HARD gates — every variant must still pass both before it is shown, approved, serialized, or uploaded, regardless of execution mode.

---

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short — record status, not raw output. Full protocol: `client-activity-log.md`.

## Required Guardrails

Before writing or reviewing any campaign copy, apply these files in order:

1. `outreach-copy-framework.md`
2. `spam-word-checker.md`
3. `cold-email-copy-best-practices.md`

`outreach-copy-framework.md` is the source of truth for the first written cold touch across every outreach channel. For cold email, it controls the Email 1 structure, length, question count, workload parenthetical, CTA position, and subject shape.

`spam-word-checker.md` is the source of truth for formatting bans, CTA and opener bans, the buzzword and jargon-metaphor ban list, fake-familiarity bans, the implication test, and unsubscribe/closeout logic. Note its enumerated spam-keyword list was REMOVED 2026-09-18 by operator directive, so do not expect a generic banned-word lookup: the named ban lists above are what it still holds, and real placement problems route to `/email-deliverability-audit` or `/deliverability-incident-response`.

`cold-email-copy-best-practices.md` is the source of truth for writing quality, readability, inbox-rate discipline, personalization standards, CTA friction, and sequence quality.

If any draft fails any required guide, rewrite internally until it passes. Do not show failed copy as an option.

---

## Framework A: the Email 1 hard structure (HARD RULE, 2026-08-12)

Every Email 1 must follow `outreach-copy-framework.md` (Framework A). That file is Framework A's single home: the mechanical checklist, the precedence rule, and the sourced breakdown of which piece is Aaron Shepherd's own finding versus this workspace's own hardening (`/ask-aaron` holds the full doctrine and dated conflict ledger behind it). This section used to restate the whole rule a second time; it is stated once, there, to avoid exactly the kind of drift that produces two sections both claiming to be "the controlling rule."

The shape, for quick reference: open with a specific free deliverable (never setup, pain, signal, observation, proof, or sender context); 25 to 35 body words, excluding subject and signature; 2 to 3 main-body sentences and exactly 1 question (an optional declarative P.S. is separate but still counts toward the word cap); the workload split in parentheses (3 to 4 sender tasks, exactly 1 small prospect action, using a semicolon, comma, or period, never a dash); end with the soft permission question; a 2-to-4-word lowercase subject with exactly 1 merge token.

This rule overrides every older live or retired instruction in this skill that calls for a 50-to-90-word or 70-to-90-word Email 1, a setup line before the offer, an initial easy-yes statement with no question, more than one question, or omission of the workload parenthetical. Truth, capability, deliverability, and fulfilment gates remain mandatory. If the offer cannot carry the message without setup, stop and repair the offer or audience rather than switching Email 1 to a pain-led or observation-led framework.

---

## Offer-First Copy Standard (Aaron method) — the default for cold copy

This is the controlling standard for offer-first / offer-validation copy (`copy_mode = offer_validation` / `offer_market_proven = false`), and it is the DEFAULT for a new client and any first wave. Sourced from Aaron Shepherd's real doctrine, not a paraphrase invented here: the full corpus, his verbatim examples and rejections, and the dated conflict ledger resolving where he's changed his own position over time all live in `/ask-aaron` (advisory; consult it for teardowns or offer pressure-testing, never to relax this skill's governed contract). Where any older rule in this skill (a mandated question / diagnostic opener, per-contact copy personalization, minimize-we, a mode split) conflicts with this section, **this section wins, and the older rule is retired.** As of 2026-07-05 there is only ONE copy mode: offer-first. The proven-mode 1-to-1 diagnostic register, the question-first / diagnostic-mirror openers, per-contact copy personalization (former Hard Rule 34), the Question-First Opener Framework, and the personalization-density length band are **RETIRED** (archived under `outbound/_archive/proven-mode-1to1-retired-2026-07-05/`). Any residual `proven-mode`, `copy_mode`, `offer_market_proven`, `diagnostic-mirror`, or `question-first` language elsewhere in this skill or the peripheral skills is superseded and reads as retired. Signals remain in play for **targeting only** (which companies and contacts to email, campaign slicing, and which offer a segment gets), never for per-contact copy.

**Write FOR the real list and a real contact, never in a vacuum (HARD RULE, 2026-07-12).** Before writing a single line, pin down exactly who this copy is for and pull REAL examples from the verified send list: the concrete job titles + company type/industry + company size + geography (e.g. "CFOs / finance leaders at MSP & cloud managed-service providers, Nordics + near-Europe, 100-3000 employees"), and 2-3 real contacts from `leads.verified.csv` by name, title, company, domain (e.g. "Mark Grafton, CFO, Node4"). Write the email TO that person, and pressure-test every line with "would [real contact] find this specific and true, and is it about what they actually bill for?". This kills the failure mode of writing generic copy in a vacuum and re-adjusting it blind over and over: the words get concrete because you know exactly who reads them. **Record the audience definition + the sample contacts at the top of `copy.md`.**

**Start from the offer. Nothing else matters if the offer is wrong.** Build and score it on the value equation: (dream outcome × perceived likelihood of achievement) ÷ (time delay × effort / sacrifice). Then run the Four Concretes.

**Be specific but simple: name what is lost or gained, then stop (HARD RULE, 2026-07-12).** Name the noun and move on. Not vague, not over-listed. RIGHT: "where you're losing the most revenue." WRONG (vague, the most WHAT?): "where you're losing the most." WRONG (over-listed filler): "where you're losing the most: the usage that goes unbilled and the seat changes that never hit the invoice, and what getting it back is worth." Name the thing concretely (revenue), keep it plain, do not pad with a mechanism list that adds length.

**Don't label the reader with their own segment / industry / acronym (HARD RULE, 2026-07-12).** The recipient already knows what they are; naming their category AT them ("MSPs lose 4-9%", "for SaaS companies like you", "as a fintech, you...") reads generic and templated, like a mass email to a list, and often smuggles in the jargon this copy is supposed to avoid. Speak to their SITUATION and to "you" / {{company_name}} directly, and attribute a benchmark to its real CAUSE, not their category: not "the 4 to 9% MSPs lose" but "the 4 to 9% lost to manual billing." The segment is how we TARGET the list (who receives the email), never a label repeated back to the reader in the copy. (A word the reader naturally uses about their own work is fine; the ban is on category-labeling them, especially with an acronym.)

**The Four Concretes (offer-validation inputs, not an Email 1 packing list).** The locked offer must answer all four before copy is written. Framework A then compresses only the specific free deliverable and workload split into Email 1; differentiator and proof may live in the optional P.S., follow-ups, or reply path when they do not fit the 35-word cap:
1. What exactly are you offering? (a crisp one-line service)
2. Why would I work with you? (a real differentiator)
3. What exact result or number could I get? (a quantified outcome)
4. What did your last client get? (a named, recognizable proof plus its number)

These are captured upstream (`/offer-intelligence`, `/social-proof-bank`, `client-profile.yaml`, the intake); the copy step only checks. Do not cram all four into Email 1 and break Framework A. A missing concrete is handled two-tier, exactly like the Proof-Asset Gate. **Hollow without it:** hold the angle and fire `proof-asset-request.md`. **Would only strengthen it:** flag the gap, ship the truthful Framework A version, and upgrade later. Never invent the number.

**Quantified value is required in the locked offer record, not forcibly in every Framework A Email 1 (UPDATED 2026-08-12).** Keep a real outcome number or cost-of-inaction figure upstream so the offer can be judged honestly. Put it in Email 1 only when it fits naturally inside the specific deliverable without breaking the 25-to-35-word cap. Otherwise keep it for the optional P.S., follow-up, or reply path. Never fabricate a figure or overload the first message to satisfy an older packing rule.

**The inherent-value anchor: a SECOND number that prices the free thing (2026-07-17, Aaron 589-replies method).** This is a different number doing a different job, and confusing the two is the mistake to avoid. The three sources above answer *"what could I get / what am I losing"* — the reader's outcome, which the Four Concretes require. The anchor answers a question the reader asks about the **asset itself**: *"why is this free thing worth my attention?"* It only applies when the E1 offers a real asset, and it never substitutes for the outcome number.

Anchor on what the asset genuinely cost to acquire or would cost to buy:
- **What it cost to produce the data:** `I just ran a test of 10 million cold emails and $50,000+ in Meta ad spend to determine the most cost-effective way to scale in 2026.` The reader gets, free, a finding they'd have had to spend that to learn.
- **What clients pay for the same process:** `this is the exact audit we run for clients paying $10,000+.`
- **What the equivalent costs annually:** `the platform runs $6,000/year; this is the first look, free.`

**Binding constraints:** (a) it must be **true**; (b) it prices the asset, so the locked offer record still needs a separate outcome number; (c) include it in Framework A Email 1 only when the full message still passes the 25-to-35-word cap, workload parenthetical, and exact-one-question checks.

**The number goes IN the offer, plain and direct (HARD RULE, 2026-07-12).** Three parts, all checkable:
- **(a) Wire the number INTO the offer sentence, value-first, NEVER a story-telling preamble.** The offer leads with the value; the number is part of that value, not a lead-in essay. **WRONG** (marketing narration): "Usage-based billing loses 4 to 9% of revenue, and for MSPs the true-up is where most of it hides. If we could..." **RIGHT** (value-first, boom): "if we could save {{company_name}} the 4 to 9% MSPs lose to manual billing, just like we did for Atea, all you'd have to do is [tiny effort]." Same number, but it now hits inside the offer instead of after a two-sentence setup.
- **(b) No source citations in the email body.** A prospect does not need "(MGI Research)", "(Gartner)", or "(2024 study)" to be persuaded; it adds length and reads like a report, not a peer. Keep the provenance in our records (`copy.md` / `offer-intelligence.md`), never in the sent email.
- **(c) Plain, direct vocabulary, Hormozi tone, no buzzwords or jargon-metaphors.** Write the way a plain-spoken operator talks to a peer. BANNED as buzzy/vague: `leak` / `leakage`, `unlock`, `leverage`, `streamline`, `optimize`, `supercharge`, `seamless`, `synergy`, `empower`, `robust`, `game-changer`, `frictionless`, `turnkey`. Say the plain thing instead: not "where your billing leaks" but "where you're losing revenue most" / "lose to manual billing" / "get paid for everything you deliver". A real industry term the buyer actually uses (`true-up`, `usage-based billing`) is fine; a buzz-metaphor dressed up as insight is not. (An internal offer or campaign NAME may keep a term like "Billing Leakage Teardown"; prospect-facing copy stays plain.)

**The four steps, in order:**

1. **Offer.** Lock it as one sentence: `if [dream outcome, made specific], just like we did for [named comparable + its number], all you'd have to do is [tiny effort]`, plus the risk reversal. Truth-bound: use the risk reversal the front-end owner can actually deliver - the agency/operator for a front-end promise (a free deliverable or teaser), the client for a back-end/product guarantee (pay-on-results). When the client cannot promise results, use the free-first work the agency can deliver itself. See the Confirmed Deliverable Gate (front-end) and Capability Truth (back-end). The offer basically IS the copy.
2. **Subject. Framework A controls (HARD RULE, 2026-08-12).** Use 2 to 4 lowercase words and exactly one merge token, normally `{{first_name}}`. Keep raw statistics, percentages, hype, and the offer out of the subject. The subject must still match the body and pass `spam-word-checker.md`.
3. **Body = Framework A.** Lead with the specific free deliverable, keep the mandatory workload split in parentheses, and end with the only question: a soft permission CTA such as `Would that be worth hearing more?`. The body is 25 to 35 words, with 2 to 3 main-body sentences and exactly 1 question. An optional declarative P.S. is separate from the main-body sentence count but stays inside the same word cap. Risk-reversal words (`free`, `no obligation`, `no cost`, `risk-free`) are allowed in the body, sparingly, never in the subject (`spam-word-checker.md` → Allowed in the Body).
4. **Follow-ups: two, maybe three, each stands alone, never re-send the same pitch.** Two directions only: (a) switch the mechanism to lower friction (a 3-minute video, a written teardown, a lead magnet), or (b) double down on the single biggest benefit or the risk reversal that got missed. Cap offer-first sequences at two or three total touches. **Don't re-hammer the same headline number/stat across emails (HARD RULE, 2026-07-12):** E1 states the number; the follow-up carries the value a FRESH way (the consequence in plain words, a different angle), it does NOT repeat the same figure. Repeating "4 to 9%" (or any stat) in every email reads mechanical. The number is a one-time hit, not a refrain.

**Risk reversal beats personalization (2026).** The offer-first lever is a casual, reasonable-person risk elimination ("the first look is free, no obligation", "if it's not a fit, no hard feelings"), not heavy per-contact personalization. Keep personalization minimal: first name plus company only. Do not bolt a diagnostic-mirror opener or per-contact signal onto offer-first copy; that per-contact-copy approach is retired (proven-mode retirement, 2026-07-05).

**Slice-shared signal facts in the body: the line between targeting and copy (HARD RULE, operator ruling 2026-07-17).** A competitor name or a public customer complaint MAY appear in the email body, but ONLY when the ENTIRE slice shares that fact. One campaign targeting "customers of Competitor X" gets one shared body that names X, because every reader of that body is a customer of X. That makes it slice-level shared copy, not per-contact personalization. Three bounds, all binding:

1. **It is never the opener.** Hard Rule 19 stands: the opener is offer-led. The shared fact rides INSIDE the offer sentence, never in line 1.
2. **Per-contact reference stays banned.** "I saw *your* review from Mary" is out, and so is every observational opener. The copy states the fact as the slice's reality, never as something we looked up about this particular reader.
3. **The fact must be true of every contact in the slice.** If it is not, the slice is wrong, not the copy. Fix the targeting rather than hedge the sentence.

This is the same targeting-filter-vs-copy-variable line `sells_to_vertical` already walks, extended to two more signals. It does NOT reopen per-contact copy personalization, which stays retired.

**Why this was always permitted, and why it is worth using.** The operative rule has always been "never PER-CONTACT copy", not "never in copy", so this names a boundary that already existed rather than moving one. Eric Nowoslawski's evidence for the upside: a newsletter service naming a competitor in the body got a large AI lab to reply, because the email named that lab's best-known rival. The competitor name did the work precisely BECAUSE it was true of the whole slice, which is exactly what let it ship as one shared line.

### The CTA Hierarchy: offer-first, lead magnet optional, rotate across steps (HARD RULE, canonical)

This is the canonical CTA doctrine for cold copy (operator `/goal`, 2026-07-07). Every other skill that touches CTAs (`cold-email-copy-best-practices.md` CTA Standards, `/personalization-subagent-pattern`, `/lead-magnet-brainstorm`, the List Gate, the Offer Architecture gate) points here; state it once, here, and reference it elsewhere.

**The booked call is always the real goal.** Every CTA is just a low-friction way to earn the first "yes". Once a prospect replies yes, the reply routes them to the real next step (the Delivery Message rule below governs exactly how). This is honest friction-laddering, never bait-and-switch. Whatever the CTA names (an asset, a look, a conversation) must be real and deliverable at reply-scale (the Confirmed Deliverable Gate and Capability Truth, Hard Rule 28, still bind). Aaron himself warns against opening with deceit, so the low-commitment yes earns attention with a genuine offer behind it, then converts to the call.

**The Delivery Message: no pitch when the asset carries the gap (HARD RULE, 2026-07-17).** This governs the message that goes out *after* a prospect replies yes, and it is conditional by design (operator decision, 2026-07-17). Read `offer.lead_magnet_gap` from `client-profile.yaml`:

- **Gap present (a real magnet with an unresolved motive, per the Next-Step Gate in `/lead-magnet-brainstorm`): the delivery message is PURE VALUE, zero call ask.** Send the thing and get out of the way: `Great {{first_name}}, here's the link. Curious to get your take on it.` Nothing else. **Do not propose a time, do not offer to walk them through it, do not add "if it's worth 30 minutes...".** Aaron's reasoning, which is the whole point: the moment you attach a sales ask to the free thing, you announce that the free thing had a price, you reduce the value of what you just gave, and the prospect feels the trapdoor close. So no sales friction lands until they have actually consumed the value.

  **"No ask on the delivery email" is NOT "no ask ever, by anyone" — the follow-up is REQUIRED (2026-07-17).** This is the hole that made the rule dangerous as first written: it stripped the only ask in the funnel and specified nothing to replace it, which left "the prospect hits the gap and books a call on their own" as the mechanism. That is not a mechanism, it is a hope, and hope has no conversion rate. So a gap-present delivery is a **small cadence, not one email**, and all three parts are mandatory:
  - **Delivery (day 0):** the link, pure value, no ask. As above.
  - **Follow-up (day 2-3):** the ask, aimed squarely at the unresolved motive. Trigger on tool usage if it's tracked, otherwise on time. `Did the numbers look about right? The one thing it can't work out on its own is [the gap]. Want me to run the real one for you?` This is where the call gets asked for, *after* the value landed, which is exactly what Aaron's "no sales friction until they've consumed the value" actually licenses.
  - **Close (day 7):** one guilt-free out. `Happy to leave it there if the timing's off. Want me to run it, or should I let you get back to it?`

  Name who sends it (the mailbox that delivered the asset), on what trigger, and on what day, in `copy.md`. **A gap-present sequence with no follow-up defined fails QA** — that combination is the "flood of yeses, no meetings" failure wearing the costume of the fix.

  **And name the number that proves it failed, before it ships.** As first written this rule could not fail: if no meetings came, the explanation was "they haven't hit the gap yet", which is unmeasurable and quietly blames the prospect. Set the kill threshold up front (the honest one: replies that reach the follow-up and still never take the next step), and if it misses, the gap was weak. K4 asks whether the gap is *real*; nothing else asks whether it is *motivating*, and a real-but-weak gap passes every gate and still produces nothing.
- **No gap (`lead_magnet_gap` absent or empty, or `lead_magnet: direct_offer`): keep the soft time-proposal at delivery.** Send the asset and propose a time, or propose a time directly. Without a gap, nothing else would carry the prospect to a call, so stripping the ask here just produces a polite dead end — Aaron's own "high reply rate, terrible meeting-to-lead ratio" failure. A direct offer never had this problem: the conversation *is* the offer, so asking for it is not a pitch bolted onto a gift.

The rule is the causal logic, not the surface tactic. **Never strip the delivery ask without a real gap in place** — that combination is the worst of both worlds, and it is the specific mistake this rule exists to prevent. If a magnet has no gap, the fix is to give it one (or drop it for the direct offer), not to go quiet at delivery and hope.

**The open-loop chain: every step sells only the NEXT step (the spine under all of this).** Aaron's framing, and it is the simplest way to keep a sequence honest about what each part is for. The subject's only job is to earn the open. The first line's only job is to get them to the CTA. The CTA's only job is to get the yes. The asset's only job is to open the gap. **The gap's job is to make the call the obvious answer.** Nothing in the chain tries to do the job of a later link: an E1 that tries to sell the call is skipping three steps, which is why pitch-first copy fails. Each link closes the loop the one before it opened, and opens the next.

**Order of preference for the ask (offer-first, lead magnet optional):**

1. **Framework A soft permission CTA (the Email 1 default).** State the specific free deliverable and workload split, then close with the message's only question, such as `Would that be worth hearing more?`, `Open to it?`, or `Can I send it over?`. Do not use a statement-only `Just reply "Yes"...` CTA in Email 1 because Framework A requires exactly one question.
2. **Easy-yes opt-in naming a real asset (follow-ups or post-reply only).** `Just reply "Yes" and I'll [send it over].` remains valid after the initial cold touch when the channel step's own rules allow it. It is not a compliant Email 1 close under Framework A.

**Which shape leads: follow the asset's strength, not a fixed rank (REFINED 2026-07-17).** The standing lean is to the #1 conditional structure (`if we could [outcome], just like we did for [proof + number], all you'd hand over is [tiny effort]`) over an asset-announcement opener — and that lean is right *by default*, because a weak asset-announcement (`I put together a short read on X`) buries the dream outcome and farms low-intent replies. But the lean was never absolute (the operator's own words: "not a hard must always"), and Aaron's 589-positive-reply campaign was itself an asset-announcement E1:

> `{{first_name}}, I just ran a test of 10 million cold emails and $50,000+ in Meta ad spend to determine the most cost-effective way to scale in 2026. Do you mind if I send it to you?`

So the structure was never the problem — **a payload with no inherent value was.** The condition that decides it:

- **Asset carries a strong inherent-value anchor** (a real tool, a real test at real scale, a real paid process given free) **and the dream outcome sits inside the announcement sentence** → the asset-announcement E1 is the marquee play, and Aaron's own data backs it. Note his sentence does both jobs at once: it prices the asset (10M emails / $50k) *and* names the outcome (the most cost-effective way to scale), which is exactly why it isn't the weak shape.
- **No asset, or a thin one** (a short read, a generic overview, a PDF) → the #1 conditional leads, and the thin asset becomes the risk-reversal PS or the E2 mechanism switch, never the E1 headline.

The rule is: an asset-announcement E1 has to earn the slot with a real anchor. It does not get it by default, and the conditional remains the default when the anchor isn't there.

**Optional industry-level personalization of the announcement (truth-bound).** The claim can be narrowed to the reader's world (`...the most cost-effective way to scale [industry] in 2026`), which lands harder than a generic test. Aaron's own constraint binds here and is non-negotiable: **don't lie about the industry.** Only name it if the client has genuinely fulfilled for that industry and the underlying data genuinely includes it. This is segment-level, not per-contact, so it does not reopen retired per-contact copy personalization; and it names the reader's *market*, not the reader's *category label*, so the don't-label-the-reader rule still binds.

**Lead magnet optional (preference, not a ban).** A real free resource or lead magnet is welcome, especially as a follow-up mechanism (below); it is simply never manufactured when none naturally exists. When there is no real asset, the direct offer-led CTA carries the whole sequence. `offer.lead_magnet: direct_offer` (equivalently `none`) is a valid, often-preferred locked outcome, and the List Gate accepts a locked direct-offer CTA in place of a magnet. `/lead-magnet-brainstorm` may conclude "no front-end magnet, the direct offer is stronger" and that is a first-class result, not a gap.

**Rotate the CTA across the sequence: no two steps use the same CTA (HARD RULE, checkable).** The failure case this fixes: the same CTA sentence on all three steps reads as a repetitive loop and gets ignored (the operator's exact complaint about a prior 3-step sequence). Each step earns its own distinct ask AND mechanism:

- **Email 1 (offer ask):** one soft permission question, normally `Would that be worth hearing more?`; this is the message's only question.
- **Email 2 (mechanism switch):** a DIFFERENT, lower-friction mechanism with its own ask. A 3-minute video, a written teardown, or a real lead magnet: `If it's easier, I recorded a 3-minute video showing exactly how this works. Mind if I send it over?`
- **Email 3 (small-TAM 3-step only, double-down):** double down on a DIFFERENT lever (the biggest benefit, or the risk reversal that got missed) with a DIFFERENT ask again. Never a re-run of Email 1's or Email 2's line.

The check is mechanical: read the CTA sentences side by side. If any two are the same sentence, or offer the same mechanism, it FAILS. Rewrite. "Double down" is NOT permission to repeat Email 1's CTA: the lever repeats, the CTA sentence does not.

**Worked example (the operator's exact complaint, then the fix).**

WRONG (same CTA on all three steps, repetitive, gets ignored):
- E1: `...Would that be worth sharing more?`
- E2: `...Would that be worth sharing more?`
- E3: `...Would that be worth sharing more?`

RIGHT (rotated ask plus mechanism, one thread, no invented magnet):
- E1 (offer ask): `If we could get your buyers placing reorders in one tap, just like we did for [named comparable], all you'd hand over is your catalog. Would that be worth sharing more?`
- E2 (mechanism switch): `If it's easier, I recorded a 3-minute video showing exactly how the one-tap reorder flow runs. Mind if I send it over?`
- E3 (double-down on a different lever): `Worth noting the build is on us until the reorder flow is live and actually converting. Happy to show you what that looks like for [company]. Should I put it together?`

**The 13 Questions Gate (Hormozi). HARD RULE at sequence and reply-path level.** Every campaign must have truthful answers to the thirteen questions a prospect may ask, but Framework A controls what appears in Email 1. Do not cram Layer 1 proof, identity, workflow, and status handling into the 25-to-35-word initial message. Carry those answers across the optional P.S., follow-ups, reply path, and sender signature.

- *Layer 1, Foundational (covered across Email 1, signature, optional P.S., and reply path):* (1) **Who are you?** name and company. (2) **Why me?** audience-offer fit. (3) **What do you want?** the specific free deliverable. (4) **Why should I believe you?** true proof when available. (5) **What do I do next?** the single soft permission question.
- *Layer 2 — Friction (physical effort):* (6) **Will this change my workflow?** it plugs into their existing tools without chaos. (7) **Do I do the heavy lifting, or you?** done-for-you, not homework. (8) **What's the immediate micro-value just for replying?** an instant win or asset before any meeting (the free-first teardown / lead magnet). (9) **How much of my time will this cost?** compress the ask to seconds or a one-word reply.
- *Layer 3 — Psychological (ego and status):* (10) **Will I look stupid or lose status if I reply?** the solution makes them the hero to their boss or team. (11) **Will this person spam me if I show interest?** give an easy, guilt-free out. (12) **Does this force me to admit my current system is a failure?** frame the problem as an external, blameless enemy, never their mistake. (13) **Are you trapping me into a high-pressure pitch?** a zero-pitch promise, purely data and value.

Before lock, confirm the sequence answers all thirteen and violates none: a line that creates status risk, implies spam, or blames the prospect fails. Source: Alex Hormozi.

**DOCUMENT the coverage, don't hand-wave it (HARD RULE, 2026-07-12).** This is a checkpoint list a cold email MUST answer, not a vibe. In `copy.md`, write a short table mapping each of the 13 questions to the exact line that answers it (see a prior client campaign's `copy.md` for the format). If a question has no line, the copy is not done: it is the most common reason copy reads vague. Common misses to check for explicitly: **#6 (will this change my workflow?)**: say it plugs in / no big project; **#11 (will you spam me?)**: an explicit "I won't chase you" in the final email; **#12 (does this say my system failed?)**: frame the problem as a blameless external enemy ("the process drifts on its own"), never the prospect's mistake.

Full method reference: the Aaron transcript and swipe file; `first-wave-eric-defaults.md`; `cold-email-copy-best-practices.md` (Build the offer on the value equation, Opener Standards, CTA Standards).

---

## AI/API Routing — Claude API primary, native session fallback (HARD RULE)

Final copy and phone scripts are **GENERATED via the Claude API by default** (operator directive 2026-06-17; canonical rule: `ai-model-routing.md` → Copy Generation Engine HARD RULE). Generate the copy through `scripts/research/ai_router.mjs --provider claude` (a current strong Claude model, e.g. `claude-opus-4-8`), and only from a clean research packet (the schema in `ai-model-routing.md`: persona, account/business/technical context, verified signal plus evidence URL, pain, proof point, offer/CTA direction, constraints). Do not feed Claude raw crawl output, tool logs, or research scratch. A cheaper third-party model may draft a copy brief from research, but the brief feeds the packet: it does not produce sendable copy.

**No key / no credits → NOTIFY the operator, then fall back to the native session.** If `CLAUDE_API_KEY` / `ANTHROPIC_API_KEY` is absent from `scripts/.env`, or the API returns a credit/billing error, tell the operator explicitly ("Claude API unavailable: <reason>. Generating copy in the native Claude Code session as the approved backup."), then write the copy in this native Claude Code session. This fallback is the ONLY sanctioned substitute and is never silent. ✅ As of 2026-06-17 `CLAUDE_API_KEY` is configured + verified live, so the API-primary path is ACTIVE (generate with `--model claude-opus-4-8`); the fallback now triggers only on a later credit/billing error.

Record the engine actually used in `ai_copy_provider` (`claude-api`, or `claude-native (fallback: <reason>)`). Routing never bypasses the Copy QA Gate below or the Required Guardrails above — the QA gate runs identically whichever engine drafted the copy (same model family; the choice is billing/logging/isolation, not quality).

---

## Copy QA Gate

Run this gate before Step 2 output, Step 3 output, Step 4 output, and before writing `variants.yaml`.

### Copy Surfaces To Scan

- subject lines
- first lines
- body copy
- CTAs
- P.S. lines
- follow-ups
- closeout lines
- variable values used inside copy
- every markdown variant
- every YAML `subject` and `body`
- the raw serialized `variants.yaml` file exactly as the upload tool will read it
- every spintax branch, if spintax is included

### Gate Requirements

- Pass `spam-word-checker.md`. It enforces formatting, CTA, opener, and voice discipline, not a banned-word keyword list (that list was removed 2026-09-18; see that file for why).
- Pass `cold-email-copy-best-practices.md`.
- Remove pressure language, promotional wording, fake urgency, and unsafe unsubscribe logic.
- Remove weak follow-up framing, follow-up-reference openers, generic openers, weak CTAs, and ego-triggering CTAs.
- Remove em dashes, double hyphens, and mid-sentence dash separators from sendable copy.
- Remove colon-as-runway sentences where `:` is used to stretch one sentence into a long list or multi-clause paragraph. Split the thought into short sentences instead.
- Remove comma-wrapped company descriptors such as `Company, descriptor, result`. Put the descriptor in its own sentence.
- Confirm Email 1 follows Framework A mechanically: 25 to 35 body words, 2 to 3 main-body sentences, exactly 1 question, the specific free deliverable first, the workload split in parentheses, and the soft permission question last. An optional P.S. is declarative, excluded from the main-body sentence count, and included in the word count. Follow-ups use their own forward-looking question and CTA-rotation rules.
- Confirm every CTA (and every line) keeps the prospect on top. For Email 1, accept the permission phrasings `Would that be worth hearing more?` / `Open to it?` / `May I send it over to you?` / `Can I send it across?` / `Would it help if I sent it?` (German `Darf ich es Ihnen schicken?`). The statement-only opt-in `Just reply "Yes" and I'll…` is reserved for later steps because Email 1 must contain exactly one question. REJECT and rewrite any `Want me to send…?`, `Want us to send…?`, `Want the link?`, `Did you want…?`, `Interested?`, `Let me know if you'd like…`, `Worth a look?`, or anything that reads as needy, presumptuous, scripted, sketchy, or like there is a catch.
- Confirm every CTA references a deliverable or next step the operator can actually provide.
- Confirm every email ends with a CTA — a clear next step or question — including the follow-ups (Email 2, and Email 3 in a 3-step); no dead-end soft close that trails off with nothing to answer (Hard Rule 31). Follow-up CTAs are soft (a light re-offer or a forward-looking question), never a repeated hard ask or a goodbye.
- Confirm each follow-up moves the conversation (switch the mechanism or double down on a different lever), never re-sending Email 1's same ask or a vague "short note". **Checkable no-repeat CTA test:** read the sequence's CTA sentences side by side; if any two are the same sentence or offer the same mechanism, it FAILS. "Double down" rotates the CTA sentence, it does not reuse Email 1's (Hard Rule 21).
- Confirm every claim the copy makes about the client's own product or service maps to a real, deliverable capability. No invented features, integrations, tools, metrics, or results the client cannot fulfill (capability truth, Hard Rule 28). This is most important when copy is AI-generated at scale.
- Confirm the Proof-Asset Gate passed: any named client, case study, or exact number the copy leans on is real and on file. No vague stand-in ("a leading firm"), no unnamed placeholder where the angle needs a name, no invented metric, no silent omission of proof the angle needs. If a BLOCK-tier proof gap exists, copy for that angle is held and the fill-in form (proof-asset-request.md) routed to the client, not papered over.
- Confirm the Offer Architecture gate passed before any Email 1 copy was written (SQL/MQL framing, easy-to-say-yes test, named risk reversal).
- **WARN (does not block) — the Next-Step Gate.** If `offer.lead_magnet_gap` / `offer.lead_magnet_next_step` are missing for a real magnet, emit a warning naming the client and carry on with the existing CTA behavior. Do NOT fail QA and do NOT block the copy. **Why this warns instead of blocking:** the fields were introduced 2026-07-17 and are populated on zero existing clients, while 7 of 8 have a real locked magnet, so a hard gate here would fail nearly the whole client book on a defect never observed in any of them. The requirement is real but it belongs UPSTREAM at magnet-selection time (`/lead-magnet-brainstorm` → the Next-Step Gate), not at copy time on legacy profiles. Backfill the existing clients at their next campaign refresh, not retroactively. Not applicable to `lead_magnet: direct_offer`.
- Confirm the **delivery message matches the gap** (Hard Rule 36): pure value with zero call ask when `lead_magnet_gap` is set; soft time-proposal retained when it is absent. The ask is never stripped without a real motive in place.
- Confirm a **gap-present sequence defines its follow-up** (Hard Rule 36): the day 2-3 ask aimed at the unresolved motive, and the day 7 guilt-free close, with sender + trigger + day named in `copy.md`, plus the kill number. A pure-value delivery with no follow-up FAILS — it strips the only ask and replaces it with hope.
- Confirm any **asset-announcement E1 earned its slot** (Hard Rule 37): it carries a true inherent-value anchor AND the dream outcome sits inside the announcement sentence. Without the anchor, the conditional structure leads instead.
- Confirm the **inherent-value anchor is true and correctly slotted** (Hard Rule 37): it prices the asset, is not inflated (scale, spend, price, industry coverage), and does not stand in for the Concrete #3 outcome number.
- Confirm the new-thread Email 1 opens with an OFFER-LED opener (leads with the offer itself), never a vague self-introduction or a homepage summary. (Question-first / diagnostic-mirror openers are retired with proven-mode; see the Offer-First Copy Standard.)
- Confirm the sequence and reply path answer the **13 Questions Gate** without cramming the answers into Email 1. Framework A controls Email 1; proof, workflow detail, and status-risk handling may move to the optional P.S., follow-ups, or reply path. No line creates status risk, implies spam, or blames the prospect.
- Run the Shared-Asset Platitude Read (defined below) before lock: a forced skeptical pass over the shared opener, offer body, proof, and CTA, plus every per-account trigger opener. Revise any asset that reads as vendor wallpaper or a forced hook.
- Confirm no observational opener phrases appear ("I noticed", "I saw that", "Congrats on", "I stumbled upon", "I came across", "I wanted to reach out").
- Confirm no dumb personalization: the copy never names the contact's job title or role ("As CTO…", "for a Founder like you") and never echoes a raw data field as surface mail-merge ("I see you're in SaaS", "based in Berlin"). Offer-first copy is the clean shared offer-led copy for everyone (first name plus company only); per-contact copy personalization is retired.
- Confirm any **competitor name or public customer complaint in the body is SLICE-SHARED, not per-contact** (Hard Rule 38). All three bounds are checkable: the fact is true of every contact in the slice (if not, the slice is wrong, not the copy); it rides inside the offer sentence and never opens the email (Hard Rule 19); and no line refers to it as this reader's own ("I saw your review from Mary"). A campaign targeting "customers of Competitor X" may name X in one shared body. This does not reopen per-contact copy personalization, which stays retired.
- Confirm no fake-familiarity or warmup phrasing appears in any email or follow-up (no "hope you're well"/"hope this finds you well", "just checking in"/"following up"/"following up on my last"/"circling back"/"touching base"/"bumping this", "I wanted to reach out"/"connect", unearned flattery, any phrase implying shared history, or any warmup before the first relevant line — Hard Rule 30).
- Confirm the first two lines of every email and follow-up pass the said-out-loud test: they carry a point of view and/or spoken rhythm and sound like a real person, not a brochure or textbook. Follow-ups imply the prior touch without "following up on my last."
- Confirm the signature is not baked into any email body or CSV column; it belongs on the sending-tool step (template path: in the step body; pre-written path: appended below the `{{email_*}}` variable).
- Confirm the subject line of Email 1 is a clean shared template on the step: 2 to 4 words, lowercase, exactly 1 merge token, spam-checked, and credible in isolation. Per-contact subject columns remain retired. The threaded follow-ups carry no subject.
- Confirm every email is formatted as short blocks separated by blank lines, not one dense paragraph (opener plus situation / pain / proof / offer plus CTA — each its own block, pain never combined with the offer/CTA). Applies to every email, not just Email 1.
- Confirm that right after the `{first_name},` greeting the next word is lowercase unless it is a proper noun (Hard Rule 29) — no mid-sentence capital like `Name, Each ...`. In the pre-write column model this is baked into each `email_*` body, so scan the columns, not just the step.
- Confirm grammar is clean and every sentence reads naturally aloud, with no awkward over-compression, dropped connective words, run-ons, or comma splices.
- **Offer-first is the only copy mode (proven-mode retired 2026-07-05).** Write Framework A for every Email 1: 25 to 35 words, offer-led, mandatory workload parenthetical, exactly 1 question, minimal personalization, and a soft permission close. There is no `copy_mode` / `offer_market_proven` branch anymore; a residual value on the campaign is ignored.
- Confirm Email 1 is 25 to 35 words and follows every Framework A mechanical check. Keep follow-ups under 50 words. In offer-led copy "we" is fine when it states the sender's real workload or team capability.
- Confirm the sequence is ONE thread with 2 to 3 steps (Email 1 plus one or two same-thread follow-ups): 2 by default, 3 only for a small TAM. No second new thread, no Email 4 (Hard Rule 18).
- Keep wording plain, specific, and recipient-centered.
- Confirm variables use `{{double_braces}}`.
- Confirm the markdown copy and YAML copy match exactly.
- Run a literal scan on final `variants.yaml` after serialization for em dashes, banned formatting/CTA/opener phrases, and unsafe phrases. If a sendable variable name reads as awkward or scraped-looking, rename the variable and update the list/enrichment schema before upload.

Provider note (copy-QA tiering per `ai-model-routing.md`): **default QA is rule-based and cheap** - `spam-word-checker.md` + `cold-email-copy-best-practices.md` + the rule checklist above (plus an optional cheap-model pass). **Do NOT default to a paid frontier-model API pass for copy QA.** Escalate to a stronger model audit (Claude Code, or whatever third-party model this workspace has configured) ONLY when the stakes justify it: high-ticket campaign, risky/unsupported claim, unclear evidence, strategic campaign, or client-facing deliverable. The audit checks: spammy wording, unsupported claims, weak CTA, too much hype, bad personalization, proof/claim mismatch, unclear pain, too long, too salesy, and copy that does not match the buyer's own language. Whatever model runs, `spam-word-checker.md` and `cold-email-copy-best-practices.md` remain the source of truth and the final gate - no AI substitution removes these two guardrail passes.

If a campaign needs a term that the spam checker bans, ask the user for explicit approval before using it. Otherwise, rewrite.

### Shared-Asset Platitude Read (forced pass, before lock)

A campaign's whole list inherits a tiny set of shared copy — usually one generic segment opener, one offer body, one proof line, one CTA — plus a handful of per-account trigger openers. Those few assets carry the entire campaign's blast radius, and the generic opener is what reaches every contact who has no personal signal (often most of the list). Before locking copy, run one forced skeptical read over them. This is a discipline gate, not a quality oracle: its only job is to stop a dead, vendor-wallpaper opener from shipping to the whole list.

**Scope — NOT per contact.**
- The shared assets every contact inherits: the generic/segment opener (the `situation_line`, or the default Email 1 / Email 3 opener), the offer body, the proof line(s), and the CTA.
- Each per-account trigger opener (the personalized Email 1 / Email 3 opener lines written for strong-signal accounts).
- The generic opener is ONE asset to read once, no matter how many rows share it. Never run this per row across the full list — that is the per-contact cost the design deliberately avoids.

**The read — a platitude / weakest-line test, never a reply prediction.** Ask the wrong question and the read is useless: a skeptic asked "would you reply to this generic opener?" answers no, correctly and uselessly, every time (it has no personal hook by design). Ask the copy-quality question instead.
- Shared generic opener: "This is a segment opener with no personal hook, by design. Given that, is the pain it names specific and true enough to feel earned, or could any vendor send it? Name the one line a busy {persona} mentally deletes on."
- Per-account trigger opener: "Does this signal genuinely connect to the email's pain, or is it a forced or irrelevant hook? Name the weakest line."
- Output per asset: the weakest-line callout plus a verdict — earned vs vendor wallpaper (generic), or connected vs forced (trigger).

**Engine and its ceiling.** Run inline in the Claude Code session (no extra spend). This is same-model grading — Claude reading Claude's own copy — the agree-with-itself weakness the rest of this gate already lives with. It is acceptable HERE only because the bar is platitude detection: forcing the read to name the single weakest line and say what is generic or forced about it catches a platitude even same-model. Do NOT trust this read for anything subtler than platitude / forced-hook detection, and never present it as a reply-rate predictor.

**Action and status.** If an asset reads as wallpaper or a forced hook, revise that one asset, re-run the spam-word + best-practices checks on the new wording, then proceed. "Passed the read" is NOT "solved": record the shared opener as a hypothesis pending real reply data (~day 21), never as a win. The value here is discipline on the highest-blast-radius asset — a forcing function against a rushed rubber-stamp — not superior judgment.

---

## List Gate (verified slice required before any sendable copy)

The list drives the message — so this skill must not produce sendable copy or write `variants.yaml` until the **verified-list gate** passes for this campaign slice (canonical definition: `verified-list-gate.md`). All three must hold:

1. **Verified slice**: `profiles/<business-slug>/campaigns/<campaign-slug>/leads.verified.csv` exists and is non-empty (from `/email-waterfall`). **"Verified" is a hard standard, not "an email exists":** every sending email must be **third-party email-verified AND catch-all verified**, and every row must carry a **real first + last name** (the `/email-waterfall` Verification Doctrine). That standard is met EITHER by verify-first on an email the row already had (the email verifier: verify + catch-all in one call) OR by a waterfall enricher finder run (which delivers both at once). A waterfall is one valid path, not a universal requirement. Index/pattern-derived emails, fabricated-name rows, or a list that only passed a bare verifier with no catch-all check do NOT satisfy this: route back to `/email-waterfall`. Confirm `email_status = valid` on every send row (catch-all/risky live in `leads.review.csv`, never the send file).
2. **List grade** — that slice passed `/list-quality-scorecard` at grade **B or better**.
3. **Locked strategy** — the campaign is a selected row in `campaign-strategy.md`, its `lead-source-plan.md` exists, `client-profile.yaml` `offer.lead_magnet` is locked (a real magnet, OR the `direct_offer` sentinel when the offer-first play uses a direct offer-led CTA and no magnet, per the CTA Hierarchy), and `run_state.sending_platform` is locked.

If any condition fails, **STOP** — name the failed condition and route to its producer (`/email-waterfall` → `/list-quality-scorecard`, or `/campaign-strategy` / `/lead-source-strategy`). Do not write speculative or placeholder copy "to be filled once the list is ready"; you cannot write the message before the verified list exists. Autonomy never relaxes this (it is a hard-stop in `/autonomous-execution-policy`). The only exception is an explicit operator override for a re-run on an already-verified external list.

---

## Confirmed Deliverable Gate

Before writing any CTA, confirm the prospect can receive exactly what the CTA offers after a positive reply.

**Whose deliverable this is (fulfillment split).** This gate governs the **front-end** deliverable - the lead magnet, the free asset, the front-end promise - which by default the **operator/agency delivers, not the client** (the agency owns inbox management, sending, replies, and front-end delivery; the client receives only qualified leads and delivers the back-end paid service). So "can this be delivered?" here means *can the agency deliver it, at reply-scale, to every positive responder* - not "did the client say it's a nice idea." Back-end product/service capability is the separate Capability Truth gate (Hard Rule 28) below. Canonical rule and the optional `service_model.front_end_owner` override: `/lead-magnet-brainstorm` -> Who Delivers the Offer (Fulfillment Split).

Allowed deliverable categories:

- In-body observation: the email already contains the useful observation, and the CTA offers a short follow-on note.
- Public case study or reference: the named customer, metric, or proof point is publicly available or client-approved.
- Conversation: the sender can book a real call through the approved calendar workflow after a positive reply.
- Company-specific note: the operator can produce the note manually or through the approved enrichment workflow.
- Confirmed asset: the client has explicitly confirmed the asset exists and can be sent.
- Operator-producible deliverable: the operator can produce it without hidden data, client approval, or unplanned production work.

Hard stops:

- Do not promise audits, scorecards, benchmarks, ROI estimates, teardown documents, or reports until the data, method, and delivery path are confirmed.
- If the deliverable is uncertain, downgrade the CTA to a confirmed deliverable or a conversation.
- Record the deliverable category in Step 3 before writing final copy.

---

## Proof-Asset Gate (collect missing proof before writing copy that needs it)

Sibling to the Confirmed Deliverable Gate above and to Capability Truth (Hard Rule 28), and a distinct rule. Do not blur the four:

- Capability truth (Hard Rule 28): never claim a product capability the client cannot deliver.
- Confirmed Deliverable Gate: never promise a CTA deliverable you cannot fulfill after a positive reply.
- Proof-asset gate (this rule): never write copy whose credibility needs hard proof (a named client, a real case study, or an exact number) you do not have on file. Collect it first.
- **Artifact-Truth Gate** (`/lead-magnet-brainstorm`): never ship a model-generated, per-company artifact under the client's name unless its claims trace to real sources, it is framed as a work sample rather than an analysis, a human has reviewed the first 20, and it discloses what it is. **Note the axis these four split on.** The first three all test what you **say**; the fourth tests what you **hand over**, which is why it is not covered by the other three and why it needed its own gate. It fires only on per-company *generated artifacts* (an AI-built report, teardown, ABM list, sample deliverable), never on archetype K tools or on a per-contact copy line. If the campaign ships no such artifact, it does not apply.

When an angle references a named client, a case study, or an exact metric that is NOT on file (`social-proof-bank.md`, `client-profile.yaml`, `offer-intelligence.md`, an approved artifact, or the intake), be blunt about the gap and collect the real proof from the client. Check `social-proof-bank.md` first: a segment-matched `proof_status = on_file` row already carries the real result and a copy-ready `one_liner`, so the gate passes; a `gap_block` row for that segment is the gate firing (its raw-fact request may already be PENDING with the client via `/proof-asset-request` bank mode). Do not cover it with vague wording ("a leading firm", "significant results"), an unnamed stand-in where the angle needs a name, an invented number, or a silent omission. Decide the tier on one question: is the angle hollow without this proof, or just less strong?

- BLOCK (hollow without it): the angle's credibility hinges on the missing proof. Emit the fill-in form (`proof-asset-request.md`), route it to the client, and do not ship hollow copy for that angle. Switch to a different angle the on-file proof already supports, or hold the slice until the proof returns.
- FLAG-AND-PROCEED (would only strengthen): the copy already stands on a real signal or observation. Flag the gap plainly, emit the form, proceed with the viable version now, and upgrade the copy when the proof returns.

Not relaxed by `auto_execute`. This is a missing-source-material input gate, modeled on the List Gate, not an operator pause. The form is a data request to the client, so it is fully compatible with hands-free execution. Proceeding past a BLOCK-tier gap with hollow or invented proof is a hard-rule violation regardless of execution mode. Procedure and form template: `proof-asset-request.md`. Doctrine: memory.

---

## How This Skill Works

This skill operates like a structured intake flow. Confirm key decisions before final copy is produced.

The single-thread 2-to-3-step flow:

1. Confirm campaign direction.
2. Confirm subject line and first-line strategy.
3. Confirm body structure.
4. Output final copy and matching `variants.yaml`.

At each confirmation step, present 2 to 3 strategy options with a recommendation. Keep options focused on direction and structure. Do not present any copy that has not passed the Copy QA Gate.

---

## Input Sources

You may receive:

- campaign strategy document
- website URL
- client context
- onboarding form
- call transcript
- account manager notes
- existing campaign performance
- lead list or account research

When working from a profile folder, read the saved artifacts before choosing copy direction:

- `profiles/<business-slug>/client-profile.yaml`
- `profiles/<business-slug>/campaign-plan.md`
- `profiles/<business-slug>/campaign-strategy.md`
- `profiles/<business-slug>/lead-magnets.md`
- `profiles/<business-slug>/social-proof-bank.md` (from `/social-proof-bank`) — the client's copy-ready proof + trigger bank. The **first** place to look for a segment-matched proof line (its `one_liner`); a `proof_status = on_file` row is ready evidence, a `gap_block` row is the gate firing. (The `poke_the_bear` diagnostic-mirror opener it also holds is retired with proven-mode; use only the proof.)
- `profiles/<business-slug>/campaigns/<campaign-slug>/lead-source-plan.md` — **required** when producing sendable copy (the List Gate's locked-strategy condition), not optional
- `profiles/<business-slug>/campaigns/<campaign-slug>/leads.verified.csv` + the slice's `/list-quality-scorecard` result — **required** (the List Gate); the verified slice is what the copy is written for

Treat saved campaign artifacts as the source of truth over chat memory. Do not drift away from the locked offer, lead magnet, proof constraints, or campaign role unless the user explicitly changes them.

If given only a website, research it before Step 1.

If information is missing but the work can proceed with a reasonable assumption, state the assumption. Ask only when the missing context materially changes the campaign.

---

## Offer Architecture (complete before writing Email 1)

Run this gate before Step 1 produces any direction and before a single line of copy is written. Offer selection happens upstream in `/offer-intelligence` and `/lead-magnet-brainstorm`; this is the copy-time confirmation that the locked offer is actually sendable. If you cannot answer all three questions cleanly, the offer is not ready. Fix the offer first. Sequence structure and copy quality cannot compensate for a weak or high-friction offer.

**Frame it on the value equation and the Four Concretes (offer-first, HARD).** Before the three questions below, confirm the offer is built on the value equation ((dream outcome × perceived likelihood) ÷ (time × effort)) and that the copy can answer a buyer's Four Concretes: (1) the one-line service, (2) the differentiator, (3) the quantified outcome number, (4) the named recognizable proof plus its number. A missing concrete is handled two-tier like the Proof-Asset Gate: hollow-without-it → hold the angle, fire the proof-asset request, ship an honest interim that describes the outcome without a fabricated number; would-only-strengthen → flag, ship the concrete-as-possible version, upgrade when it lands. Never invent the number. Full definition: the Offer-First Copy Standard above and `cold-email-copy-best-practices.md` → Build the offer on the value equation.

**Question 1: SQL or MQL framing?** SQL (Sales Qualified Lead): the prospect commits to a sales conversation. Higher friction. Use when the offer is naturally easy to say yes to, with clear pain, obvious ROI, and low switching cost. MQL (Marketing Qualified Lead): the prospect raises their hand for a resource, deliverable, or insight. Lower friction. Use when the offer requires behavior change, a crowded market, or a long sales cycle. If unsure, default to MQL framing. You can escalate to SQL after they engage.

**Question 2: Easy-to-say-yes-to test.** Read the offer out loud. Would someone say yes to this on a busy Tuesday afternoon without needing to ask their boss? If yes, proceed. If no, either chunk UP (talk about results, not method, "we help [ICP] increase [outcome]" instead of naming your service category) or chunk DOWN (name a specific, concrete deliverable that is interesting on its own).

**Question 3: What is the risk reversal?** Name exactly one: pay-on-results, money-back guarantee, no-commitment trial, free deliverable first, or conditional engagement (build it first, pay only if satisfied). If none apply, the offer is harder to say yes to than it needs to be. Do not proceed until one is identified and documented. Whatever you name must still pass the Confirmed Deliverable Gate above. Only promise what the operator can actually deliver after a positive reply.

Record the SQL/MQL decision and the risk reversal in Step 3 before writing final copy.

---

## Step 1: Confirm Campaign Direction

### What To Do Silently

0. **Check the List Gate first** (see List Gate above): confirm `leads.verified.csv` exists for this slice, it passed `/list-quality-scorecard` at grade B+, and the strategy is locked. If any fails, STOP and route to the producer — do not start copy.
1. Read all provided context.
2. Identify target audience.
3. Identify the trigger or reason this audience is being contacted.
4. Identify the core pain, desired outcome, or business situation.
5. Identify the offer and proof points.
5a. **Select the most relevant proof point for this specific segment or ICP.** Look in `social-proof-bank.md` first — it is already mapped one row per ICP segment × service line, so the segment-matched row hands you the real result and the copy-ready `one_liner`. (The `poke_the_bear` diagnostic-mirror opener is retired with proven-mode; use the proof `one_liner` only.) Do not default to the most prominent case study if a more relevant one exists or if it is a poor fit. Use this selection hierarchy:
   - Direct match (same industry, similar company size, same geography): use with full metric if available.
   - Close match (adjacent industry or similar challenge): use with careful framing; do not claim cross-industry metrics as if they are directly applicable.
   - No match (available case studies are too different in industry or situation): if the angle does NOT need proof, omit the proof reference and let the personalized observation, competitive context, or offer carry the email, downgrading the CTA to a "conversation" or "in-body observation" deliverable category. But if the angle's credibility actually needs a named client, a case study, or an exact number you do not have, do NOT silently omit it. Apply the Proof-Asset Gate (see below): be blunt about the gap and collect the real proof from the client via the fill-in form before shipping hollow copy.
   Never reference a proof point that would confuse the recipient, feel irrelevant, or require them to make a logical leap the email does not bridge.
6. Identify useful variables and remove variables that would create obvious or forced personalization.
7. Confirm the selected campaign's offer, lead magnet, and CTA direction match the saved campaign plan.
8. Check whether the angle can be written without banned wording from `spam-word-checker.md`.

### What To Present

```markdown
## Step 1: Campaign Direction

**Target Audience:** [audience]
**Trigger Or Relevance Signal:** [signal]
**Core Pain Or Situation:** [pain or situation]
**Offer:** [plain offer]
**Proof Point:** [proof available]
**Recommended Campaign Angle:** [brief direction]

**Variables Available:**
- {{variable_name}}: [purpose and source]

**Risk Check:**
- [deliverability, claim, data, or personalization risk]

**Choose Next Step:**
A. [Recommended] Approve this direction and move to subject line / first-line strategy
B. Adjust the target, signal, pain, offer, or proof first
C. Ask me one follow-up before moving on
D. Custom answer
```

Do not include reusable email copy in Step 1.

---

## Step 2: Confirm Subject Line And First-Line Strategy

Select the single strongest strategy, present it as the locked choice, and proceed. Do not present multiple options or ask the user to choose between approaches unless they explicitly request alternatives or push back on the recommendation.

### Strategy Types

Use one of these strategy types when they fit the campaign:

- Research signal: uses a real observable trigger or account signal.
- Whole-offer: makes the recipient self-select based on clear relevance.
- AI-assisted context: uses a short AI-generated variable only when it adds non-obvious relevance.
- Proof-led: starts from credible outcome evidence.
- Resource-led: offers a useful artifact or finding with low friction.

Avoid generic curiosity, pressure, fake urgency, and subject lines that would not match the body.

### What To Present

```markdown
## Step 2: Subject Line And First-Line Strategy

**Strategy:** [strategy name]
**Subject:** [QA-approved subject]
**First Line:** [QA-approved first line]
**Why This Fits:** [one sentence reason tied to the campaign direction]
**QA:** Passed spam-word checker and best-practices review.

Proceeding to body structure. Let me know if you'd like a different angle.
```

If the chosen strategy fails QA, rewrite internally until it passes. Do not show failed copy. Do not ask the user to choose between options - choose the best one and go.

Alternatives are available on request only. Do not volunteer them unless the user is unsatisfied with the recommendation.

---

## Step 3: Confirm Body Structure

Once the subject and first line are approved, confirm the body logic before writing final variants.

### What To Decide

- value angle
- proof point
- personalization variables
- CTA type
- CTA deliverable category
- CTA setup sentence purpose
- CTA permission question style
- follow-up angle rotation
- thread structure
- whether to include a P.S. line
- whether each element can pass the Copy QA Gate

### What To Present

```markdown
## Step 3: Body Structure

**Approved Strategy:** [strategy]
**Approved Subject:** [subject]
**Approved First Line:** [first line]

**Body Logic:**
- Value angle: [angle]
- Proof: [proof]
- Personalization: [variables to use]
- CTA type: [CTA category]
- CTA deliverable category: [in-body observation / public case study / conversation / company-specific note / confirmed asset / operator-producible deliverable]
- CTA setup purpose: [what the prospect receives and why it is worth their time]
- CTA permission framing: [short humble question style]
- P.S. line: [yes/no and purpose]

**Sequence Logic:**
- Email 1: [new thread, 2-to-4-word lowercase subject with exactly one merge token; 25-to-35-word Framework A body; specific free deliverable first; mandatory workload parenthetical; exactly one question; soft permission CTA last; A/B the offer / subject here]
- Email 2: [SAME thread, follow-up. Switch the mechanism (a 3-minute video, a written teardown, or a real lead magnet) with its OWN ask, a different CTA sentence from Email 1; soft CTA, never a dead-end soft close]
- Email 3 (small-TAM 3-step only): [SAME thread, follow-up. Double down on a DIFFERENT lever (the biggest benefit, or the risk reversal that got missed) with a DIFFERENT ask again; soft CTA, never a goodbye]
- Step count: 2 by default, 3 for a small TAM. ONE thread throughout, no second new thread, no Email 4.
- CTA rotation check: [the CTA sentences read side by side are all different, no two share a sentence or a mechanism (Hard Rule 21, CTA Hierarchy)]
- Offer alignment: [how the locked offer appears; if `offer.lead_magnet: direct_offer`, the direct offer-led CTA carries the sequence, no invented magnet]

**QA Notes:**
- Spam-word checker: pass expected after final wording.
- Best-practices review: pass expected after final wording.
- Confirmed deliverable gate: pass expected after final wording.
- Known wording risks to avoid: [risks]

Confirm this structure before I write the final copy.
```

Use structure language, not unreviewed body copy.

---

## Step 4: Output Final Copy

Only output final copy after the user confirms the structure **and the List Gate passes** (verified slice + grade B+ + locked strategy; see List Gate). If the gate is not satisfied, STOP here — do not serialize `variants.yaml`.

Before presenting final copy:

1. Draft all variants.
2. Run the Copy QA Gate on every line.
3. Rewrite anything that fails.
4. Confirm the final markdown and YAML versions match exactly.
5. Only then show final copy.

### Output Format

~~~markdown
## Final Campaign Copy

### Email 1 (Day 0)

**Subject Line Options:**
1. [QA-approved subject]
2. [QA-approved subject]
3. [QA-approved subject]

**Variant A** ([word count] words)
```text
[QA-approved email body]
```

**Variant B** ([word count] words)
```text
[QA-approved email body]
```

**Variant C** ([word count] words)
```text
[QA-approved email body]
```

### Email 2 (Day 3-4)

Same thread as Email 1 (no subject). Email 2 is the mechanism-switch follow-up.

**Variant A** ([word count] words)
```text
[QA-approved email body]
```

### Email 3 (Day 7-10)

SAME thread as Email 1 (no subject), small-TAM 3-step only. The double-down follow-up: reinforce the biggest benefit or the risk reversal that got missed (Hard Rule 18).

**Variant A** ([word count] words)
```text
[QA-approved email body]
```

### Variables Used

| Variable | Source | Purpose |
|---|---|---|
| {{variable_name}} | [source] | [purpose] |

### QA Checklist

- [x] Spam-word checker passed.
- [x] Best-practices review passed.
- [x] No banned words, phrases, formatting patterns, fake urgency, or unsafe unsubscribe logic.
- [x] Subject lines passed deliverability review.
- [x] Email 1 ends with its only question, the approved soft permission close after the offer and workload parenthetical; follow-ups use their approved slot CTA.
- [x] CTAs reference confirmed deliverables only.
- [x] Variables use `{{double_braces}}`.
- [x] Markdown copy and YAML copy match exactly.
~~~

---

## variants.yaml Requirement

After presenting the markdown-formatted copy, also write a machine-readable `variants.yaml` to:

```text
profiles/<business-slug>/campaigns/<campaign-slug>/variants.yaml
```

The YAML body content must match the markdown body exactly:

- same words
- same variables
- same line breaks
- same subjects
- same sequence order
- same approved variants

Before writing YAML, run the Copy QA Gate again against every YAML `subject` and `body` field. After writing YAML, re-open the raw `variants.yaml` file and scan the serialized text exactly as the upload tool will read it. If serialization, variable names, escaping, comments, or copied metadata introduce banned wording or em dashes into sendable subjects or bodies, fix the YAML or the markdown so they match exactly and pass.

### Schema

```yaml
name: "<campaign name>"
schedule:
  timezone: America/New_York
  days: [1, 2, 3, 4, 5]
  start_hour: "08:00"
  end_hour: "17:00"
  min_time_btw_emails: 10
  max_leads_per_day: 30
inbox_selection:
  tag: active
  count: 20
sequences:
  - step: 1
    delay_days: 0
    variants:
      - label: A
        subject: "<QA-approved subject>"
        body: |
          <QA-approved body>
  - step: 2
    delay_days: 3
    variants:
      - label: A
        subject: ""
        body: |
          <QA-approved body>
  - step: 3
    delay_days: 7
    variants:
      - label: A
        subject: ""   # no second new thread — Email 3 is a threaded follow-up, no subject (Hard Rule 18)
        body: |
          <QA-approved body>
```

The sequence is one thread: step 1 (Email 1) is the new thread with a non-empty subject; steps 2 and 3 (the follow-ups) are threaded replies with empty subjects. If the sending platform supports explicit threading metadata, mark steps 2 and 3 as thread replies and step 1 as the new thread. There is no second new thread and no step 4 (Hard Rule 18).

The literal `subject: "..."` shown above is the live rule for both template and pre-written paths. Email 1 uses one shared subject template for the whole campaign or offer-angle slice. It must contain 2 to 4 lowercase words and exactly one merge token. Do not generate per-contact subject columns. Email 2 and optional Email 3 inherit the thread and carry no subject.

Do not write YAML that contains unapproved copy, placeholder copy, failed copy, or copy that differs from the reviewed markdown.

YAML body format must use block scalar syntax (`body: |`) with 10-space indented content. Inline escaped strings (`body: "line1\nline2"`) are not parsed correctly by the campaign approval brief script and must not be used.

---

## copy.md Requirement

After writing `variants.yaml`, also write a human-readable `copy.md` to:

```text
profiles/<business-slug>/campaigns/<campaign-slug>/copy.md
```

`copy.md` is the canonical human review record for the campaign. It is not generated from `variants.yaml` — it contains everything needed to review, edit, brief, or re-deliver the campaign without opening the YAML.

`variants.yaml` is the machine upload format. `copy.md` is the human review format. Both must exist for every campaign. They must match on all body copy, subjects, and variables.

### Required sections in copy.md

```markdown
# Campaign Copy - <Campaign Name>

**Date:** <YYYY-MM-DD>
**Campaign:** <Campaign name>
**ICP:** <Target titles, company type, size, geography>
**Lead magnet:** <What is offered and how it is delivered. Reference lead-magnets.md.>
**Tone:** <casual / peer-to-peer / formal>
**Sending platform:** <the locked `run_state.sending_platform` value, resolved from the stack contract>

---

## Sequence Structure

<Table: Step | Thread | Angle tested>

---

## Spam + Best-Practices QA Notes

<Inline notes confirming which banned tokens were specifically avoided, formatting rules confirmed, CTA rules confirmed. Campaign-specific — not a generic list.>

---

## Variables

<Table: Variable | Source | Example value>

### AI variable prompt for `{{variable_name}}`
<If any variable is AI-generated, include the exact enrichment-layer prompt here (whatever tool fills the enrichment and copy-generation slot: Claude Code, an external enrichment platform's AI column, or equivalent) and the first-20-review instruction. For the pre-written copy path, this is the full per-contact email body prompt from `/personalization-subagent-pattern`.>

---

## Email 1 - Day 0 (New Thread) — Thread 1: <Angle name>

### Subject Line Options
1. `subject-a`
2. `subject-b`
3. `subject-c`   ← show 2-3 options per new-thread email

---

**Variant A** (~XX words) - <angle description>
[copy block]

**Variant B** (~XX words) - <angle description>
[copy block]

---

## Email 2 - Day 3 (Same Thread, No Subject) — Supporting Email 1

<variants with word counts>

---

## Email 3 - Day 6-7 (Same Thread, No Subject) — small-TAM 3-step only: double-down follow-up

### Subject Line Options
1. `subject-a`
2. `subject-b`
3. `subject-c`

<variants with word counts>

---

## (No Email 4 — the 4-email / two-thread structure is retired 2026-07-05)

<variants with word counts>

---

## QA Checklist

### Spam-word check
- [ ] <each relevant banned token confirmed absent, campaign-specific>
- [ ] No em dashes - confirmed
- [ ] No space-hyphen-space mid-sentence separators - confirmed
- [ ] No colon before a list inside a single sentence - confirmed
- [ ] No comma-wrapped company descriptors - confirmed
- [ ] Banned CTAs absent - confirmed

### Best-practices check
- [ ] Email 1 opens with an offer-led opener (leads with the offer); the A/B variant test rides Email 1
- [ ] Offer passed the Offer Architecture gate before Email 1 (SQL/MQL, easy-yes test, named risk reversal)
- [ ] Email 1 leads with the offer (offer-led opener), not a signal observation; personalization is first name plus company only (per-contact signal openers retired)
- [ ] Shared-Asset Platitude Read run on the shared opener, offer body, proof, and CTA, and on every per-account trigger opener; any vendor-wallpaper or forced-hook asset revised; shared opener recorded as a hypothesis pending reply data, not a win
- [ ] No observational openers ("I noticed", "I saw that", "Congrats on", "I stumbled upon", "I came across")
- [ ] Line 1 is OFFER-LED and carries no signal (Hard Rule 19; the signal-first opener is retired 2026-07-17). Any slice-shared signal fact in the BODY (Hard Rule 38) passes the implication test (Signal-First Anti-Patterns): it states what the fact MEANS for the reader, never a description of what the sender saw, a compliment on the signal, the bare fact with no "so what", or flattery as a bridge into a pitch
- [ ] Signal Angle Library used ONLY as slice-level angle guidance (which pain to lead with, which proof to pick for this slice), never as an opener template (its opener templates are retired 2026-07-17). Its caveats honored: no raw department headcount recited as a copy line (surveillance); no customer list/logos recited back and no "I saw you sell to X" line for the sold-to axis (surveillance twin), with vertical-matched proof that is real and on file; champion re-engagement sent only where the prior relationship was real; JD content quoted only when live and publicly accessible; one work-history reference per email, relevant to the offer
- [ ] Each follow-up moves the conversation (switch the mechanism or double down), never re-sends Email 1's pitch
- [ ] The follow-ups (Email 2, Email 3) support Email 1 in the same thread and end with a SOFT CTA (a light re-offer or a forward-looking question) — never a dead-end soft close with nothing to answer, never a repeated hard ask, never a goodbye (Hard Rule 31)
- [ ] No goodbye or closeout language anywhere in the sequence
- [ ] Email 1 ends with its only question, a soft permission CTA after the named free deliverable and workload split; no statement-only `Just reply "Yes"...` CTA, `Want me to…`, `Want us to send…`, `Interested?`, or `Worth a look?`
- [ ] CTA deliverables confirmed and operator-producible
- [ ] Each follow-up offers a different mechanism or deliverable from Email 1 (switch or double-down), never a re-send
- [ ] Every email ends with a CTA / next step — Email 1 the primary value-backed CTA, the follow-ups a soft CTA — no email left as a dead end
- [ ] Email 1 signs off with the full signature ({full name} / {title} @ {company name} / {company location} / + phone as a 4th line when `sender_persona.phone` is set); the follow-ups (Email 2, Email 3) sign off with AT LEAST the first name — a follow-up sign-off is mandatory, never zero (an unsigned follow-up is a QA failure)
- [ ] Signature is configured on the sending-tool step, not baked into any email body or CSV column
- [ ] Every email formatted as short blocks (opener / pain / proof / offer+CTA, each its own block, pain never combined with the offer/CTA), not one dense paragraph
- [ ] After the `{first_name},` greeting the next word is lowercase unless a proper noun (no `Name, Each ...` mid-sentence capital); in the pre-write path, checked inside each `email_*` column
- [ ] Grammar clean, reads naturally aloud, no awkward over-compression or dropped connective words
- [ ] Zero fake-familiarity phrases (no "hope you're well," "just checking in," "following up on my last," "circling back," "touching base," "bumping this," "I wanted to reach out/connect," unearned flattery)
- [ ] First two lines pass the said-out-loud test (sounds like a real person, not a textbook)
- [ ] At least one of: a point of view, spoken rhythm, or a 2-4 word honest framing token
- [ ] No warmup sentence before the first relevant line
- [ ] Follow-up implies the prior touch without asking the reader to remember it (no "following up on my last")
- [ ] Human-voice variant set up as a test against the clean version, not assumed to win
- [ ] Email 1 is 25 to 35 words, with 2 to 3 main-body sentences and exactly 1 question; any optional P.S. is declarative and included in the word count. The follow-ups are under 50 words. No padding or filler.
- [ ] Pre-written path only: contacts with no relevant data got the fallback general copy in the same column (no blank rows)
- [ ] Email 1's subject is a clean shared template on the step (2 to 4 words, lowercase, exactly 1 merge token, spam-checked); per-contact subject columns are retired; the follow-ups carry no subject
- [ ] Plain text only, no links in emails 1-3

---

## Scoring (Email 1, Variant A)

| Dimension | Score | Notes |
|---|---|---|
| Relevance | /25 | |
| Value clarity | /25 | |
| Proof quality | /15 | |
| CTA friction | /15 | |
| Readability | /10 | |
| Deliverability | /10 | |
| **Total** | **/100** | Ready / Revise |

---

## Sequence Summary

<Table: Step | Thread | Day | Subject | Angle | Variants | Words>
```

Do not write a `copy.md` that omits the QA checklist, scoring, or sequence summary. Do not write a `copy.md` that contains copy not in `variants.yaml` or omits copy that is in `variants.yaml`.

---

## Pre-Written Email Copy Architecture

This is the standard model for genuine per-contact personalization: the lead list carries one complete body column per live sequence step and Email 1 variant: `email_1_a`, `email_1_b`, `email_2`, and optional `email_3`. Each sending-tool step references only its body column plus the step-level signature. Email 1 still has to follow Framework A exactly. Personalization cannot lengthen it, add a hook before the offer, remove the workload parenthetical, add a question, or create a per-contact subject. It does not replace the `variants.yaml` + `{{double_braces}}` template model above. For the pre-write path, keep a representative `variants.yaml` rendered with the fallback body when downstream review artifacts need it.

- Template model (`variants.yaml`): one well-written email body per step with a few personalization variables assembled at send time. Use when one strong email plus light variables covers the list.
- Pre-written model: the enrichment and copy generation layer writes the entire email body per contact and exports it as a single field. Use when each contact needs a genuinely relevant version of the same approved offer and you want full quality control visible before export.

**Choosing the rung is a MATERIAL, surfaced decision — never a silent default.** Template vs pre-written changes the client-facing copy, so it falls under the Material Decision Rule even under `auto_execute`: state which model you picked and why in `copy.md` and to the operator, and do not quietly ship list-level templating when the list could carry genuine per-contact copy. The default for a real lead list is **per-contact pre-written full-body** (the standard), tuned by `deal_value_tier` (`/data-point-discovery` → `/personalization-subagent-pattern`): low-tier / uniform lists lean template, mid/high-tier or lists where each account carries its own collected signal get the full per-contact body. There are exactly two cases where **template is the CORRECT call, not a shortcut** — name which one applies when you use it: (1) the campaign's relevance is purely segment/list-level (one shared trigger the whole slice inherits) and no per-contact research hook was collected, so a per-contact column would only be the same sentence reworded; or (2) the wave is a deliberate **single-variable signal test** whose locked strategy holds copy constant across slices so reply differences trace to the list signal (vary only the segment opener). If neither exception holds, **surface the fork before committing** — per-contact full-body usually wins more replies, and picking template trades that away. Record the chosen `personalization_rung` plus its one-line rationale in `copy.md` and the activity log, so a later session or the operator never has to reverse-engineer why the copy was personalized at the level it was.

**Downstream artifact note.** The approval brief (`/campaign-approval-brief`), the sequence DOCX (`/cold-email-campaign-sequence-docx-presentation`), and the `copy.md` review record are all generated from `variants.yaml`. A campaign run purely through the pre-write path has no `variants.yaml`, so those artifacts are skipped unless you also produce one. If the campaign needs a client approval brief or a sequence DOCX, generate a representative `variants.yaml` (one variant per step, showing the structure) plus a `copy.md` alongside the per-contact `email_*` columns. Otherwise, treat the enrichment table itself as the review record and say so.

### The core shift

Template model: static copy in the sending tool, variables assembled at send time.

Pre-written model: the full email body is written per contact before it reaches the sequencer and stored as one text field per email slot. The sending tool receives only a ready-to-send body. No assembly in the sequencer, no conditional logic in the sending tool. Within this path, "no variables, no assembly, no conditionals in the sequencer" is the rule. It does not change the Variable Schema or the `variants.yaml` template path above.

In this repo the enrichment and copy generation layer is `/personalization-subagent-pattern` (parallel Task sub-agents that already enforce this Copy QA Gate and `spam-word-checker.md`). The same principle applies in an external enrichment platform's AI columns, a Claude Code script over a CSV, or any equivalent pipeline. The canonical AI generation prompt for this path lives in `/personalization-subagent-pattern`.

### Per-contact conditional logic (personalized or fallback in the same column)

Each live email copy column holds one complete body per contact row, either a relevant personalized version or the fallback version. There is no separate fallback column. The decision happens inside the generation prompt, not in the sending tool. Email 1 always begins with the approved offer, so relevant data may sharpen truthful wording but may not become a hook or setup before the offer. Email 2 and optional Email 3 are same-thread follow-ups.

### Column naming convention

- `email_1_a` = Email 1 (Thread 1), Variant A, primary angle
- `email_1_b` = Email 1 (Thread 1), Variant B, alternative angle for split testing
- `email_2` = Email 2 (reply to Thread 1), supporting email, single variant (no split), one complete body per contact
- `email_3` = Email 3 (optional third step, SAME thread, small-TAM only), the double-down follow-up, single variant (no split), one complete body per contact
- (no `email_3_a` / `email_3_b` second-thread columns and no `email_4` — the 4-email / two-thread structure is retired 2026-07-05; Email 2 and Email 3 are single-variant same-thread follow-ups)
- No subject columns. Email 1 uses one shared static subject template containing 2 to 4 lowercase words and exactly one merge token. Email 2 and Email 3 inherit the thread.

These `email_*` columns contain the BODY only (no subject text, no signature, no sign-off inside the body cell). Each body is formatted as short blocks separated by blank lines (the blank lines live inside the CSV cell), never one dense paragraph. Each column also includes the greeting with the contact's first name baked into the text (for example `Tommi, ...`), so the sending-tool step is only `{{email_1_a}}` plus the signature — there is no separate `{{first_name}}` token on the step. Bake the name in rather than nesting `{{first_name}}` inside the column: sending tools do not reliably expand a merge field that sits inside another custom-field value. The blank lines between blocks inside the cell are what produce the email's paragraph breaks, so confirm in a live preview that the sending tool renders them as line breaks before launch (if it does not, the body must carry the breaks as the tool's own markup).

**The Email 1 subject is shared and static at the campaign level.** It contains 2 to 4 lowercase words and exactly one merge token, such as `fyi {{first_name}}`. It rides both Email 1 body variants so the body remains the isolated A/B variable. Follow-ups inherit the thread. The signature is appended in the sending-tool step.

### Sending-tool variable usage and signature

Each new-thread step carries a SHARED static subject line in its subject field and the per-campaign BODY variable in its body field, plus the static signature block. (Per-contact subjects are retired 2026-07-05.) The full body lives inside the pre-written field. The signature is static sender identity (one persona per client), configured once in the step, never written into the CSV.

Email 1 step (Campaign A):

```text
Subject: fyi {{first_name}}

{{email_1_a}}

{full name}
{title} @ {company name}
{company location}
{phone}          ← only when client has supplied a sender phone (sender_persona.phone)
```

Email 1 Variant B uses the same shared subject template and `{{email_1_b}}`, followed by the same signature block. Email 2 and optional Email 3 have an empty subject because they are threaded replies; their bodies are `{{email_2}}` and `{{email_3}}`.

### Split testing: within-campaign variants (preferred where the platform supports them) or across campaigns

The Email 1 A/B columns (`email_1_a`/`email_1_b`) can be wired two ways. Pick by platform:

- **Within-campaign variants (preferred when the sending platform supports native variant slots; resolve the platform from the stack contract).** One campaign per slice. Email 1 holds Variant A and Variant B, split 50/50. Both use the same shared subject and follow-ups, so reply differences trace cleanly to the body copy.
- **Across campaigns (platform-agnostic fallback).** Two campaigns per slice sharing the same list: Campaign A pulls `email_1_a`, and Campaign B pulls `email_1_b`. Use only when the sending tool cannot run native within-step variants.

Either way both variants share `email_2` and optional `email_3`; the follow-ups are not split.

### Export gate

Never export a row where any required output column is blank. Filter to rows where `first_name`, `company_name`, both required Email 1 variant columns, and every live follow-up column are non-empty. A blank body means generation failed. Validate the shared subject template once, then scan every body column for banned punctuation and tokens. Confirm Email 1 passes the Framework A mechanical checks and that no signature or sign-off was baked into a body column.

---

## Core Copywriting Framework

### Philosophy

- Research is the personalization. Use real signals when available.
- Shorter usually wins, but clarity wins over arbitrary length.
- Earn replies before trying to book meetings.
- Give each email one job.
- Make the email about the recipient's situation, not the sender's company.
- Use plain language that sounds like a credible person.
- Frame broad claims as observations only when they can be defended.

---

## Hard Rules

1. No em dashes, double hyphens, or mid-sentence dash separators in outbound copy.
2. Company variable is always `{{company_name}}`, never `{{company}}`.
3. Do not use generic curiosity as a subject line.
4. Personalized subject lines must pass the spam checker.
5. Do not start follow-ups by saying you are following up.
6. Every email must stand alone.
7. Put the strongest relevant phrase early for preview text.
8. Do not use copy that sounds promotional, desperate, or automated.
9. Do not use silence-based closeout promises.
10. Do not output failed copy for comparison.
11. Do not use dash parentheticals for proof or company descriptors.
12. Do not use weak CTAs that only ask whether a problem exists.
13. Do not use ego-triggering CTA wording that makes the prospect feel like they need the sender.
14. No links in emails 1-3 unless the user explicitly approves an override.
15. No calendar links in emails 1-3.
16. Do not use `:` to make one sentence carry a long list, proof stack, or multi-clause explanation. Split it.
17. Do not use comma-wrapped company descriptors. Write the company descriptor as its own sentence.
18. **Single thread, 2 to 3 steps (HARD RULE, TAM-size dependent).** Every campaign is ONE thread: Email 1 (new thread, offer-led) plus one or two same-thread follow-ups. Default 2 steps (Email 1 + Email 2); go to 3 steps (add Email 3, still same thread) only for a SMALL TAM, where squeezing the limited list justifies the extra touch. Never a second new thread, never a 4th email. (The old 4-email / two-independent-thread structure is RETIRED 2026-07-05; every "Email 3 as a new thread" or "Email 4" reference elsewhere in this skill is superseded and reads as: Email 3 = the optional third same-thread follow-up, and there is no Email 4.)
19. **Every new-thread email opens with an OFFER-LED opener: it leads with the offer itself (the dream outcome made specific plus the risk reversal), never a flat statement, an observation, or a vague self-introduction.** Leading with a clear, concrete offer is the point; the banned pitch is a vague self-introduction or a homepage summary. (Question-first and diagnostic-mirror openers are RETIRED with proven-mode, 2026-07-05.) A new-thread email is one that starts its own thread with its own subject; here that is Email 1 (the single new thread). A new-thread email that opens with a generic statement, an observation, or a vague self-introduction is a hard failure. In-thread follow-ups (Email 2, and Email 3 in a 3-step) continue the thread and open however best moves the conversation (a mechanism switch or a double-down on the risk reversal).
20. Email 2 (and Email 3, in a 3-step) are same-thread follow-ups supporting Email 1. They are not global reminders, last emails, or goodbye emails.
21. Each follow-up must MOVE, never re-send Email 1's pitch: switch the mechanism (offer a 3-minute video, a written teardown, a lead magnet) or double down on the single biggest benefit or the risk reversal that got missed. **No two steps use the same CTA (checkable).** Read the sequence's CTA sentences side by side: if any two are the same sentence, or offer the same mechanism, it fails QA. "Double down" is NOT permission to repeat Email 1's CTA line: the lever repeats, the CTA sentence rotates. Full doctrine: the Offer-First Copy Standard → The CTA Hierarchy.
22. Final copy must follow the saved campaign plan, selected campaign strategy, lead-source plan, and locked offer or lead magnet.
23. Email 1 (the single new thread) must close with the full 3-line signature block — line 1 `{full name}`, line 2 `{title} @ {company name}`, line 3 `{company location}` (city + country) — not just a first name. First-name-only sign-off is allowed ONLY on the in-thread follow-ups (Email 2, and Email 3 in a 3-step) — but a sign-off there is still MANDATORY: every email in the sequence, follow-ups included, ends with at least a name. A follow-up with no sign-off at all is a hard failure (it renders as an unsigned fragment). Each signature line renders on its own line; never collapse the block. Use a broad title if the persona has none; do not spin the signature.
24. The signature lives in the sending-tool campaign step, never in per-contact lead or CSV data. In the `variants.yaml` template path it is part of the campaign step body. In the pre-written copy path the body variable (`email_1_a`, etc.) carries no sign-off, and the static signature block is appended below the variable on the sending-tool step. See Pre-Written Email Copy Architecture.
25. Format every email as short blocks separated by blank lines, never one dense paragraph. Default layout: opener plus situation, then the pain or insight, then the proof, then the offer plus CTA — each its own block. **Each block is one idea — usually one or two short sentences, three at most — never the whole email crammed together. A short email may fold the pain into the opener/situation block and may combine the proof with the offer plus CTA, but the pain never shares a block with the offer/CTA. A tight Email 1 is two blocks: opener (situation, carrying the pain) and the offer plus CTA.** A blank line between blocks is required. Blank lines are whitespace, not banned formatting (the plain-text rule bans HTML, bold, italics, color, and images, never paragraph spacing). Client-agnostic example — WRONG, three sentences crammed into one block: `Most leaks hide in the monthly true-up, where one stale seat count never makes it onto the statement. We mapped where providers most often lose revenue and turned it into a reusable finding you can check against. Can I send it over?` RIGHT, the pain in one block and the offer plus CTA in the next:

    ```text
    Most leaks hide in the monthly true-up, where one stale seat count never makes it onto the statement.

    We mapped where providers most often lose revenue and turned it into a reusable finding you can check against. Can I send it over?
    ```
26. Grammar must be clean and phrasing natural. No awkward constructions, run-ons, comma splices, garden-path sentences, or dropped connective words. A missing "where", "that", or article reads as broken English. Read every sentence aloud and fix it before it is shown.
27. **Framework A controls Email 1 length: 25 to 35 body words; follow-ups stay under 50.** Count the greeting and optional P.S., but not the subject or signature. Email 1 uses 2 to 3 main-body sentences and exactly 1 question. An optional P.S. is declarative and excluded from the main-body sentence count, but included in the word count. Never pad, and never delete a required word until the offer, workload split, or CTA stops reading naturally. Full structure (offer-first opening, the 3-to-4-task workload parenthetical, the subject rule, and the sourced Aaron-vs-house-hardening breakdown): `outreach-copy-framework.md`.
28. Capability truth. Never claim a product capability, feature, integration, result, or outcome the client cannot actually deliver. Every claim about what the client does or offers must map to a real, documented capability (from `client-profile.yaml`, `offer-intelligence.md`, or the locked offer). This is separate from "never fabricate facts about the prospect": the risk here is the email promising something the client's sales team cannot fulfill. When the supporting capability is not documented, leave the claim out rather than invent it. This is the single biggest failure mode of AI-generated copy at scale, so when generation is automated, the generator must be given the client's real capability list and held strictly inside it.
29. Greeting casing. When the body continues on the same line right after the `{first_name},` greeting, the first word is lowercase unless it is a proper noun (company name, product, brand, or acronym). The greeting and the opener are one sentence, so a mid-sentence capital reads as broken. Client-agnostic example — WRONG: `Katrin, Each month the mix of work shifts and someone reconciles it by hand.` RIGHT: `Katrin, each month the mix of work shifts and someone reconciles it by hand.` When the opener legitimately starts with a proper noun, keep its capital: `Katrin, Acme just migrated its ERP, so the team is reconciling two systems.` In the pre-write column model the greeting and first name are baked into each `email_*` body, so the generator must emit the opener already cased correctly (lowercase common word, or proper-noun capital) in the column — there is no separate step that can fix it later.
30. Human voice, not fake warmth (see Human Voice, Not Fake Warmth). NEVER write fake-familiarity or warmup phrasing in any cold email or follow-up — no "hope you're well"/"hope this finds you well," "just checking in"/"following up"/"following up on my last"/"circling back"/"touching base"/"bumping this," "I wanted to reach out"/"I wanted to connect," unearned flattery ("big fan of what you're building," "saw you're crushing it"), any phrase implying shared history, or any warmup sentence before the first relevant line. Personality lives INSIDE the first relevant line (a point of view plus spoken rhythm), never in a preamble. Every cold email and follow-up must pass the said-out-loud test: read the first two lines aloud; if they sound like a brochure or a textbook, rewrite until they sound like a real person. Follow-ups imply the prior touch without asking the reader to remember it. Framing tokens ("quick one," "this'll sound random but") are optional, testable hypotheses — never assumed to win; A/B them against the clean version.
31. Every email ends with a CTA, no dead ends. Email 1 ends with Framework A's only question, a soft permission CTA after the specific free deliverable and workload split. The follow-ups carry a soft, low-friction CTA that rotates both the mechanism and wording, never a repeated hard ask, goodbye, or last-touch line.
32. **Make "yes" the easy answer; the prospect stays on top.** Email 1 closes with one soft permission question such as `Would that be worth hearing more?`, `Would that be worth sharing more?` (interchangeable; the second is Aaron's own most-used phrasing), `Open to it?`, `May I send it over?`, `Can I send it across?`, or `Would it help if I sent it?`. The statement-only opt-in `Just reply "Yes" and I'll...` may be used after the initial cold touch, but not in Email 1. NEVER use `Want me to send it?`, `Want us to send it?`, `Want the link?`, `Did you want…?`, `Interested?`, `Let me know if you'd like…`, or `Worth a look?`.
33. **Write 1-to-1: first-person singular, minimize "we" and "us".** The email is one person writing to one person, so default to "I". Reserve "we"/"us" for genuinely collective facts that cannot honestly be said as "I" (a real team result, a true company capability). Frame the client's value around the prospect ("you're one of the few who...") rather than "we help teams like you." Do not over-apply into stilted copy; quoting the prospect's own likely "We help..." line back to them is the diagnostic mirror, not a violation. Full rule: `cold-email-copy-best-practices.md` (Write 1-to-1).
34. **RETIRED 2026-07-05 (proven-mode retirement).** Per-contact subject and body personalization (`{{subject_1}}` / `{{subject_3}}` per-contact columns, light-touch relevancy off each row) is retired. Offer-first copy is shared: one offer-led body and one subject template per campaign or offer-angle slice. The Email 1 subject is 2 to 4 lowercase words with exactly one merge token, normally `{{first_name}}`; this is a shared template, not a per-contact generated subject column. Threaded follow-ups carry no subject.
35. **CTA Hierarchy: Framework A first, then rotate across steps.** Email 1 uses one soft permission question after a real, specific free deliverable. Later steps may use an easy-yes statement or another forward-looking question, but no two steps share the same CTA sentence or mechanism. Never invent a lead magnet to satisfy the skeleton.
36. **The delivery message after a yes: no pitch on the delivery email when the asset leaves a real motive, and a REQUIRED follow-up that carries the ask (operator decision 2026-07-17, reshaped same day after review).** Conditional on `offer.lead_magnet_gap` in `client-profile.yaml`. **Gap present:** delivery (day 0) is PURE VALUE, zero call ask (`Great {{first_name}}, here's the link. Curious to get your take on it.`) — attaching a sales ask to the free thing announces it had a price and springs the trapdoor. **But the ask is deferred, never deleted:** a follow-up (day 2-3) aimed at the unresolved motive carries it, and a guilt-free close (day 7) ends it. A gap-present sequence with no follow-up defined FAILS QA — "they'll hit the gap and book on their own" is a hope, not a mechanism. Name the kill number before it ships (replies that reach the follow-up and still never take the next step), because K4 tests whether the gap is *real* and nothing tests whether it is *motivating*. **No gap, or `lead_magnet: direct_offer`:** keep the soft time-proposal at delivery. **Never strip the delivery ask without a real motive AND a defined follow-up.** Full rule: the Offer-First Copy Standard → The CTA Hierarchy → The Delivery Message.
37. **The inherent-value anchor prices the asset, never the outcome.** Keep the separate outcome number in the locked offer record. Include an asset anchor in Email 1 only when it is true and the whole message still passes Framework A. Otherwise move it to the optional P.S., follow-up, or reply path.
38. **A slice-SHARED signal fact may ride inside the offer; per-contact reference stays banned (operator ruling, 2026-07-17).** A competitor name or a public customer complaint may appear in the body ONLY when the ENTIRE slice shares that fact (one campaign targeting "customers of Competitor X", one shared body naming X). That is slice-level shared copy, not personalization. Three binding bounds: it is NEVER the opener (Hard Rule 19 stands, so the fact rides inside the offer sentence); per-contact reference stays banned ("I saw *your* review from Mary") along with every observational opener; and the fact must be true of every contact in the slice, or the slice is wrong rather than the copy. Same targeting-filter-vs-copy-variable line `sells_to_vertical` already walks, extended to two more signals. Does NOT reopen per-contact copy personalization (Hard Rule 34), which stays retired. Full rule: the Offer-First Copy Standard → Slice-shared signal facts in the body.
39. **Framework A controls the initial cold touch.** Stated once, at Hard Rule 27 and in `outreach-copy-framework.md`. This entry exists only so this rule number is not silently reused for something else; it does not restate the rule a third time.

---

## AI Personalization Decision Framework

Before adding AI-generated company context, ask whether it changes the relevance of the email.

Use AI variables when:

- the product or service applies differently based on the prospect's business
- the buyer context changes the strongest value angle
- the variable adds non-obvious relevance
- the variable can be written naturally in a short line

Skip AI variables when:

- the use case is identical across the list
- the variable only summarizes the prospect's website
- the line would still work if the company name changed
- the variable creates awkward wording or scraped-looking copy

Required AI variable QA:

- factual
- short
- non-obvious
- no banned tokens

**At scale (20+ leads):** generate these per-lead AI variables with `/personalization-subagent-pattern` (parallel Task sub-agents) rather than by hand. It enforces the same QA above and the `spam-word-checker.md` rules, then feeds the variables back into this copy. For small batches, write them inline. This is the wiring that puts personalization in the main copy line.
- grammatically safe in context
- first 20 generated values reviewed before scaling when AI personalization is used
- prompt refined before full run if more than 3 of the first 20 values are vague, generic, awkward, or factually off

---

## Offer Framework

Every offer should map to one main value category:

1. Save time.
2. Create business value.
3. Reduce cost or waste.

Rotate angles across follow-ups only when the new angle is meaningfully different. Do not repeat the same claim in different words.

---

## Variable Schema

### Core Variables

- `{{first_name}}`
- `{{company_name}}`
- `{{role_title}}`
- `{{company_domain}}`
- `{{industry}}`

### High-Signal Variables

- tenure or role context
- recent content topic
- competitor or category context
- technology stack
- team growth signal
- account-specific research signal

### AI-Generated Variables

- customer type
- product or service category
- use case
- business context
- pain point
- relevant observation

### Proof Variables

- proof category
- result
- metric
- customer type
- timeframe

### Formatting

Always use `{{double_braces}}` in drafts.

Never quote, bold, italicize, or decorate variables.

---

## Email Structure

### Target Length

- Email 1: 25 to 35 body words, 2 to 3 main-body sentences, exactly 1 question (Hard Rule 27). Any optional P.S. is declarative and included in the word cap.
- Follow-ups should be short, usually under 50 words.

### Structure

1. Situation recognition.
2. Value claim and proof.
3. Value-backed CTA.
4. Optional P.S. line only when it adds a different relevant angle.

Every part must pass the Copy QA Gate.

### Layout

Write the email as short blocks separated by blank lines, not one dense paragraph:

```text
{{first_name}}, [opener plus the situation or signal. 1 to 2 sentences.]

[The pain or insight. 1 to 2 sentences.]

[The proof, then the CTA.]
```

A blank line between blocks is required. This is whitespace, not banned formatting. It is what makes the email scannable in a busy inbox and on a phone. The blank lines are part of the body: in the pre-written copy path they are stored inside the `email_*` CSV cell; in the template path they are in the step body.

### Signature (sign-off)

Email 1 (the single new thread) MUST close with a full signature block, not a first name alone. A fuller signature reads as a real person at a real company and supports legitimacy. The same-thread follow-ups (Email 2, and Email 3 in a 3-step) sign with the first name only. Use this 3-line format for Email 1, plus an optional 4th phone line when the client has supplied a number:

```text
{full name}
{title} @ {company name}
{company location}
{phone}          ← 4th line, only when client has supplied a sender phone (sender_persona.phone)
```

In-thread follow-ups (Email 2 and optional Email 3) MUST still sign off, but the first name alone is enough. A follow-up with no sign-off is a hard failure. In the pre-write path, the follow-up steps are `{{email_2}}` / `{{email_3}}` followed by the first-name sign-off, set on the step.

- The full name is the sender persona's full name (from `client-profile.yaml` `sender_persona.name`). The company name + location come from `client-profile.yaml` / the client's public contact page. `{company location}` is the company's city + country (e.g. "Espoo, Finland"), not necessarily the full street address.
- Line 2 puts the title and company on one line joined by ` @ ` (e.g. `Partner @ ExampleCo`). If the persona has no defined title, use a broad, defensible one (e.g. Partner). Do not invent a specific senior title for a fabricated persona.
- Render each signature line on its own line. On platforms that store HTML bodies, separate the lines with `<br>` or separate `<div>`s. Never collapse the block onto one line. **On a sending platform that stores bodies as HTML (verified on one such platform 2026-06-19): a raw `\n` in the STATIC step text is collapsed by the platform's HTML store and renders run-together (`Jane DoePartnerships @ ExampleCoNew York, USA`), so the appended signature MUST use `<br>` line breaks, never `\n`.** This applies only to the static step text; the merge field `{{email_1_a}}` carries the per-contact body, whose `\n\n` block breaks such a platform DOES convert, so leave those as `\n` in the CSV. Resolve the sending platform from the stack contract (if the slot is empty, stop and route to `/stack-setup`), and always verify with that platform's own email preview on a real lead before launch.
- **Phone line (optional 4th line):** when `client-profile.yaml` `sender_persona.phone` is set, append it as a 4th line below the location, joined with the same `<br>`. Use ONE fixed number per persona — the persona is one real human, so it never shows two or three different numbers across the client's campaigns. If the client gives several numbers, the first is primary and the rest live in `sender_persona.phone_pool` as spares (swap if a number is ever flagged/burned). If `phone` is absent or `pending` ("Soon"), the 3-line block stands — never invent a number. The phone is static sender identity, configured once on the step exactly like the rest of the block.
- Do not spin, AI-vary, or A/B-test the signature (phone included).
- Place the signature in the sending tool, never in per-contact lead or CSV data. In the `variants.yaml` template path it is part of the campaign step body. In the pre-written copy path (see Pre-Written Email Copy Architecture) the body variable carries no sign-off, and the static signature block is appended below the variable on the sending-tool step, for example `{{email_1_a}}` followed by the 3-line (or 4-line with phone) block.

---

## Subject Line Strategy

Email 1 subject lines must be:

- 2 to 4 words
- plain
- connected to the body
- low drama
- clear of banned wording
- credible if seen in isolation
- lowercase
- built with exactly 1 merge token, normally `{{first_name}}`

Avoid:

- generic curiosity
- fake urgency
- promotional phrasing
- fake thread prefixes
- over-personalized scraped fields
- subject lines that promise more than the body delivers

---

## Opener Strategy

**The opener leads with the OFFER (Hard Rule 19).** Three bullets here used to say otherwise ("reference the recipient's situation first", "use a real signal when available", "avoid broad claims before the relevance signal"). That was signal-first ordering, and it is **RETIRED (2026-07-17)** with the Signal-First Opener Rule below: the offer comes first, not the situation or the signal. A slice-SHARED signal fact may ride inside the offer sentence (Hard Rule 38), never ahead of it.

Openers should:

- lead with the offer itself: the dream outcome made specific, plus the risk reversal
- avoid greetings and pleasantries
- avoid sender-centered setup
- avoid generic AI summaries

If the offer could be sent by any competitor to any list, rewrite it. Note the level this test now runs at: the opener is deliberately SHARED across the whole campaign or slice (first name plus company only), so "it applies to many people" is by design and is not the failure. The failure is an offer so broad it is specific to no one. Make it specific to the slice, not to the individual.

---

## Signal-First Opener Rule (RETIRED 2026-07-17)

**The Signal-First Opener Rule and its four Execution Patterns are RETIRED (2026-07-17), superseded by the Offer-First Copy Standard's offer-led opener (Hard Rule 19).** They mandated that the first line reference the trigger that put the prospect on the list. Hard Rule 19 requires the first line to lead with the OFFER. No signal opens a cold email. The full retired rule and its four patterns are archived at `outbound/_archive/signal-first-opener-retired-2026-07-17/signal-first-opener-rule-and-execution-patterns.md` rather than quoted here, since a fully-quoted retired rule with no marker on its own subsections is exactly what let three live QA rows keep enforcing it after retirement.

**What survives.** Signals remain fully in play for **targeting**: which slice gets its own campaign, and which offer that slice gets. A slice-SHARED signal fact may also ride INSIDE the offer sentence (Hard Rule 38). What is retired is the signal as the OPENER, and per-contact signal copy (Hard Rule 34).

**The two subsections below are LIVE and unaffected by this retirement**, each under its own header:
- **Signal-First Anti-Patterns:** the observational-opener ban and the implication test. Still the canonical bank, still pointed to by `spam-word-checker.md`, `/personalization-subagent-pattern`, and `/campaign-strategy`. That ban is unrelated to the opener question and survives intact.
- **Signal Angle Library:** retrofitted (2026-07-17) to slice-level angle guidance. Its opener templates are retired (also archived, see that section below); the rest is live.

### Signal-First Anti-Patterns: the six ways a line leaks the signal (LIVE, survives the 2026-07-17 retirement above)

**This bank is NOT retired, and the marker above does NOT scope it.** It is the canonical enforcement home of the observational-opener ban and the implication test, and `cold-email-copy-best-practices.md`, `spam-word-checker.md`, `/campaign-strategy`, and `/personalization-subagent-pattern` all point here. That ban is independent of the offer-led-opener question: "I noticed" / "I saw that" / "Congrats on" announce scraping and add no information wherever they sit, so they stay banned in every email.

**The retirement changed WHERE this applies, not WHETHER.** Read the examples below for the test, not for the opener shape. Every "Right" line here puts the signal in Line 1, which is **no longer how a cold email opens** (Hard Rule 19: the opener is offer-led). They now illustrate two live things: how a slice-SHARED signal fact is stated when it rides inside the offer sentence (Hard Rule 38), and how the anti-surveillance rule reads in practice. Do not lift one as an opener.

Below are the six ways it goes wrong, each with the exact rewrite, and the one test that catches all of them.

One rule sits under every pattern: **start from the IMPLICATION of the data point, not the data point itself.** Every "Wrong" line below describes what the sender saw. Every "Right" line states what it means for the prospect. The prospect does not care that you found the information; they care what it changes for them.

**1. Observational openers (the most common mistake).** Announcing that you saw the signal instead of stating what it implies.
Wrong: "I saw [Company] is hiring SDRs."
Right: "[Company] has [N] SDR roles open right now. That usually means the pipeline engine is being built from scratch."
Wrong: "I noticed you recently raised a Series B."
Right: "Series B closes usually trigger a 3x headcount push in the first 90 days. Is that what you're navigating right now?"
Wrong: "I came across [Company] and noticed you're running HubSpot."
Right: "[Company] is running HubSpot without a dedicated RevOps owner. That gap shows up fast once the team hits 15 reps."
Wrong: "I saw that [Company] recently hired a new CRO."
Right: "A new CRO at [Company] means the sales motion is getting rebuilt. The first 60 days are usually about fixing what the data cannot explain."
Wrong: "I saw you sell to [vertical]." (and worse, reciting their customer list back: "I saw you sell to Acme, Globex, and Initech.")
Right: "Selling into [vertical] usually means a smaller buying committee and a higher compliance bar. That changes where deals stall. Is that the part slowing you down?"

**2. Complimenting the signal instead of using it.** Congratulating them on the event instead of extracting its consequence.
Wrong: "Congrats on the Series B! Really impressive growth."
Right: "Series B at [Company]'s stage usually means the next 90 days are all hiring and systems. Is GTM infrastructure on the list?"
Wrong: "Loved your recent LinkedIn post about [topic]."
Right: "If [topic from post] is a real problem for your team right now, [specific operational consequence] is probably showing up too."
Wrong: "Congrats on the new VP Sales hire at [Company]."
Right: "A new VP Sales usually means the first 30 days are spent figuring out what the pipeline data actually means. Is that where you are right now?"

**3. Mentioning the signal but not extracting the implication.** Naming the fact and stopping, leaving the prospect to supply the "so what."
Wrong: "I noticed [Company] has a Head of Marketing role open."
Right: "Head of Marketing open for [X] days means someone is running the function without a clear owner. Is that falling on the founder right now?"
Wrong: "I saw [Company] is using Salesforce."
Right: "[Company] is on Salesforce without a dedicated admin based on your current postings. That usually means data hygiene breaks down before quota does."
Wrong: "I noticed [Company] recently expanded into the US market."
Right: "[Company] is running a US expansion without a local GTM team yet. That gap between market entry and first local hire is where pipeline stalls."

**4. Leading with generic industry pain before the signal.** Opening on a platitude any competitor could send, then bolting the signal on after.
Wrong: "Most companies at your stage struggle to hit pipeline targets. I saw [Company] has a VP Sales role open."
Right: "VP Sales role open for [X] days is a long time to run a sales org without a head. Who owns quota right now?"
Wrong: "B2B companies in [industry] often deal with slow onboarding. I noticed [Company] is hiring a Customer Success Manager."
Right: "[N] CSM roles open at [Company] usually means the current team is at capacity and churn is starting to show. Is that what is driving the hire?"
Wrong: "A lot of [industry] companies struggle with manual reporting. I saw you recently hired a new Head of Finance."
Right: "A new Head of Finance at [Company]'s stage almost always means the first project is cleaning up what the old reporting could not explain."

**5. Burying the signal at the end.** Leading with your pitch and tucking the relevance behind it.
Wrong: "We help B2B companies scale their outbound pipeline. I noticed [Company] is hiring an SDR which caught my attention."
Right: "[N] SDR roles open at [Company]. That volume usually means the current list-building process cannot keep up with demand."
Wrong: "Our platform helps finance teams close faster. By the way, I saw [Company] recently closed a funding round."
Right: "[Company] closed a [round]. Most teams hit capacity in their current systems before the new hires even start."

**6. Using the signal as a flattery bridge into a pitch.** Praising the signal as a runway into "we could help."
Wrong: "I saw [Company] was named one of the fastest-growing companies in [region]. That is really impressive, and it made me think you might be dealing with some scaling challenges we could help with."
Right: "[Company] scaled to [headcount] in [timeframe]. Teams that grow that fast usually hit the same three operational walls in the same order. Is [specific wall] one of them?"

**The test to apply before writing Line 1.** If you are describing what you saw, noticed, or came across, you are writing an observation, not a signal line. Rewrite it by starting from the implication of the data point, not the data point itself. The prospect does not care that you found the information. They care what it means for their situation.

(The conversational "right now" in several Right examples is the temporal adverb, not the banned promotional `now`; the carve-out is recorded in `spam-word-checker.md`.)

### Signal Angle Library (slice-level angle guidance for the eight timing/context signals plus the sold-to axis). RETROFITTED 2026-07-17, LIVE

**This Library is LIVE and is NOT retired. What retired is its opener templates, not the Library.** Read the distinction before using it, because the two halves now have opposite statuses:

- **LIVE: the Library as slice-level angle guidance.** What a signal MEANS, which pain to lead with for that slice, and which proof to pick so it is recognizable to that reader. This is what `/campaign-strategy` consumes (its Signal-Driven Slice Library names this as the matching copy extract) and what the `/social-proof-bank` Trigger & Angle bank feeds with its `data_backed = y` rows. All of that stands.
- **RETIRED (2026-07-17): the opener templates below, as openers.** Each one puts the signal in the first line, which Hard Rule 19 no longer permits. They are retained as angle reference, not as lines to send.
- **LIVE: every caveat.** The anti-surveillance caveats (department headcount, sold-to customer lists), relationship truth on champion re-engagement, source truth on JD content, and the recognizable-proof rule are all bans. They survive intact and are enforced by the QA checklist.

**How to use it now.** It informs WHICH shared message a SLICE gets, never a per-contact opener. The signal picks the slice, the offer opens the email (Hard Rule 19), and the Library tells you which pain and which proof that slice's shared body should carry. Where a slice-SHARED signal fact belongs in the body at all, Hard Rule 38 governs: it rides inside the offer sentence, never Line 1, and never as this reader's own. Per-contact copy personalization stays retired (Hard Rule 34), so the `[bracketed]` placeholders below are slice-level fills, not per-contact ones.

#### Retired opener templates (archived, not to be sent)

The nine per-signal opener templates that used to live here are retired with the Signal-First Opener Rule above (each puts the signal in Line 1). They're archived at `outbound/_archive/signal-first-opener-retired-2026-07-17/signal-angle-library-opener-templates.md`, preserved for their angle logic (which pain a signal implies, which proof fits it), not as sendable copy. The matching TAM slices are in `/campaign-strategy` (Signal-Driven Slice Library); full slices, combos, and acquisition paths are in `signal-strategy-playbook.md`. The nine signals covered: job change, department headcount, headcount growth, founded year, ads intelligence, champion re-engagement, jobs data/JD content, profile/work history, and who-they-sell-to. Every caveat attached to each signal (anti-surveillance on department headcount and the sold-to customer list, relationship truth on champion re-engagement, source truth on JD content, one work-history reference per email) is still LIVE and still enforced by the QA checklist below, even though the opener line itself is retired.

---

## Opener Framework (Email 1 and Email 3)

The current rule is short: every new-thread email opens with an OFFER-LED opener that leads with the offer itself (the dream outcome made specific plus the risk reversal), per the Offer-First Copy Standard and Hard Rule 19, never a warmup or self-introduction. The opener is shared across the whole slice, filled only with `{{first_name}}` / `{{company}}`. There is no per-contact opener generation and no personalization-source priority order.

The pre-2026-07-05 question-first / diagnostic-mirror opener framework, its per-contact personalization-source priority order, and its worked examples (including one that ran ~85 words, over the current cap) are archived at `outbound/_archive/proven-mode-1to1-retired-2026-07-05/opener-framework-and-personalization-priority.md`. They were left fully quoted in this file for a long time despite being retired, which is exactly the kind of drift that makes a live-looking instruction dangerous; do not resurrect them into live copy.

---

## Human Voice, Not Fake Warmth (Hard Rule)

The warmth in an internal-team email comes from a relationship that already exists, not from the casual words. A cold prospect has no relationship with you. Bolt a casual preamble onto a cold email and you get the costume without the body: fake familiarity, which reads worse than being direct. Personality in cold email never lives in a warmup. It lives inside the first relevant line. **Voice, not warmth.**

Two different things get called "personality." Only one belongs in cold outbound.
- **Chit-chat warmth (BANNED):** "hope you're well," "saw you're crushing it," "following up from my last note." Implies a relationship that does not exist.
- **Human voice (REQUIRED):** cadence, a point of view, the sound of a busy person who knows the world and dashed off a note.

### Hard prohibition (never write in any cold email or cold follow-up)
- "Hope you're doing well" / "Hope this finds you well" / "Hope you're having a great week"
- "Just checking in" / "Just following up" / "Following up on my last email" / "Circling back" / "Touching base" / "Bumping this"
- "I wanted to reach out" / "I wanted to connect"
- "Saw you're crushing it" / "Big fan of what you're building" (unearned flattery to a stranger)
- Any phrase that implies shared history or that the reader already knows who you are
- Any warmup sentence placed before the first relevant line

Why these fail on a cold list: most recipients never registered your first email, so "following up on my last" reads as "what email?"; the few who saw it and ignored it are reminded they ignored you; and these are the most pattern-matched phrases in the inbox, so the brain files the message as an automated sequence before reading the next line. (These extend the observational-opener bans in `spam-word-checker.md` and the Signal-First Anti-Patterns bank above, which survives the 2026-07-17 signal-first-opener retirement.)

### The said-out-loud test (apply to every cold email and follow-up)
Read the first two lines out loud. Would a busy, competent person who actually knows this world say this to a peer? If it sounds like a brochure, a press release, or a textbook explaining how the industry works, it fails. Rewrite until it sounds like a real person talking. A line passes only if it has at least one of:
- **A point of view**, not just a fact ("quietly," "never notice," "only ever slips one way")
- **Spoken rhythm** (contractions, a short punchy clause, the cadence of speech)
- **An honest frame about the cold contact itself** ("quick one," "this'll sound random")

**The statement/explainer trap (the most common failure mode, and the one that produced the worst prior copy).** An opener that explains how the industry works — a true, neutral, textbook sentence with no point of view and no question — is the most common way a cold email reads as vendor wallpaper. It is grammatically clean and factually correct, which is exactly why it slips through unnoticed. It still fails the test. Rewrite it into a real question or a line that carries a point of view. Client-agnostic example — WRONG (industry explainer): `Marie, smart meters and dynamic tariffs mean every read has to land cleanly in what the customer gets charged.` RIGHT (question with a point of view): `Marie, how long does it take one of your new customers to get a first charge that's actually right?`

### Where the voice lives
Not in a preamble before the point — every word before the first relevant line is a word that gets you deleted, because you have not earned the warmup. The voice goes INTO the relevant line. Same facts, with a person behind them.

> Flat (fails, reads like a textbook): By month end, the seats a customer uses and the seats on their invoice rarely match. The gap runs one way.
> Human voice (passes): Most MSPs are quietly billing less than they deliver every month and never notice. The seat count drifts from what's actually in use, and it only ever slips one way.

### The three levers (optional — test them, never assume)
1. **Micro human-framing token** — 2 to 4 words, never a full sentence, right after the first name, honest about being a stranger instead of faking closeness: "Marie, quick one." / "Marie, this'll sound random but" / "Marie, odd question" / "Marie, straight to it." Use at most one; never stack two. These are NOT "hope you're well" (that fakes a relationship).
2. **Inject a point of view** — a fact states what is true, an observation states what you think about it: "Seat counts can drift over a month" → "Seat counts always drift one way, and it's never in your favor." "Reconciliation is spread across tools" → "Nobody actually owns the full reconciliation, which is exactly why it leaks."
3. **Spoken rhythm** — use contractions ("you're," "it's," "they'll"); vary sentence length (a short clause after a longer one creates a human beat); cut connective fluff ("furthermore," "additionally," "as such," "in order to").

### Email 1 examples across verticals (flat → human voice)
- **MSP / IT** — Flat: "IT providers frequently experience revenue leakage during the monthly reconciliation process." Voice: "Marie, quick one. Most MSPs are quietly billing less than they deliver every month and never notice it."
- **Recruiting** — Flat: "Hiring senior Shopify engineers in a competitive market often takes longer than expected." Voice: "Marie, a senior Shopify role open this long usually means the search stalled, not that you're being picky. We placed three of these last quarter, all under three weeks."
- **eCommerce / retention** — Flat: "Many DTC brands underinvest in post-purchase email flows, which lowers repeat revenue." Voice: "Marie, most DTC brands I look at leave repeat revenue on the table because the post-purchase flow stops after one email. Yours might be doing the same."
- **SaaS switching** — Flat: "Teams using [Competitor] often encounter limitations with reporting at scale." Voice: "Marie, if you're on [Competitor], the reporting probably stops being useful right about the time you actually need it. That's usually when teams come to us."

### Follow-up examples (the trap → what works)
- Trap (banned): "following up from my message a few days ago" / "just circling back on the below" / "bumping this to the top of your inbox." It fails because she likely never saw email 1, and the phrasing screams sequence.
- Works (imply a prior touch without making her remember it or feel bad): "didn't want this to get buried" / "one more nudge and I'll leave you alone" / "figured this was worth a second try" / "last one from me on this."

### Reconciling with the offer-led opener (CORRECTED 2026-07-17)

**Superseded text, retained so the correction is visible:** this section used to say that when a real signal exists, the *signal still leads the first line* ("Marie, saw the SDR role's been open 50 days. Quick thought on that."). That contradicts Hard Rule 19 and is **RETIRED** with the Signal-First Opener Rule (2026-07-17). It also modelled an observational opener ("saw the SDR role..."), which was banned independently the whole time.

**The rule now:** the **offer leads the first line, always**, signal or no signal (Hard Rule 19). The human touch lives in HOW the offer is voiced, never in a warmup before it and never in a signal bolted in front of it. A framing token stays 2 to 4 words and delays the offer by no more than that ("Marie, quick one." then straight into the offer). Where a slice-SHARED signal fact earns a place, it rides inside the offer sentence (Hard Rule 38), not ahead of it.

There is no longer a signal/no-signal branch here: every list, broad or sliced, gets the offer-led opener, so human voice plus the offer carry the open in both cases. Levers 1-2 matter most, because the offer and the voice are the only things doing the work.

### Discipline (do not pick by vibe)
Whether a given human-voice variant beats the clean version is testable, and good operators disagree about specific tokens. Do not assume "quick one" helps. Run the clean version against the human-voice version — same offer, same CTA, at least 25 leads each — and let positive reply rate decide. **The hard rule is the prohibition and the said-out-loud test; a specific lever is a hypothesis, not a law.**

---

## CTA Strategy

Use one value-backed CTA. Low friction matters, but a CTA that gives the prospect no reason to answer is weak.

Acceptable CTA types:

- value exchange
- resource offer
- routing question
- conversation
- concrete next-step recommendation

Email 1 uses Framework A: name the specific free deliverable first, keep the sender/prospect workload split in parentheses, and end with the message's only question.

**Email 1 (the new thread): a soft permission question is mandatory.**

- `Would that be worth hearing more?`
- `Would that be worth sharing more?`
- `Open to it?`
- `Can I send it over?`

The statement-only `Just reply "Yes"...` pattern remains available after the initial cold touch, but it is not Framework A compliant for Email 1 because it would leave the message with zero questions.

Acceptable permission-question alternatives (use when they read more naturally):

- `Can I send it over?`
- `Can I share it?`
- `Would it help if I sent that over?`

**Follow-ups (Email 2, and Email 3 in a 3-step): a forward-looking question.**

- a light re-offer of that thread's deliverable framed as a question (`Should I pull it together for your accounts?`, `Would it help to see that breakdown?`)
- a routing question tied to the thread's angle

Avoid (needy / obligated / presumptuous):

- `Want me to send it?`
- `Want us to send it?`
- `Want me to share it?`
- `Interested?`
- `Let me know if you'd like…`
- `Worth a look?`
- CTAs that only ask whether the problem exists
- CTAs that make the prospect feel desperate for the sender's help

Harder CTAs are allowed only when they provide clear direction and the strategy deliberately accepts the friction, such as a specific call, review, or next-step recommendation.

The recipient should be able to answer quickly. Avoid CTAs that require scheduling, multiple decisions, or a large commitment unless the user has explicitly chosen that approach.

Each follow-up needs different CTA substance from Email 1: switch the mechanism (a video, a teardown, a lead magnet) or double down on the biggest benefit or risk reversal. Do not keep offering the same vague note just because it is low friction.

**Every email gets a CTA (follow-ups included).** Email 2 and optional Email 3 are not exempt. They close with a SOFT CTA, a light re-offer of Email 1's deliverable or a small forward-looking question, so the reader always has a next step. A support email that trails off into a dead-end soft close ("happy to walk through it whenever," "the note still stands." with no ask) leaves the reader nothing to answer and fails QA. Re-offer, do not re-pitch; ask, do not nag. Email 2 re-offers Email 1's deliverable, and Email 3 doubles down on a different lever. This is within-thread reinforcement and does not conflict with Hard Rule 21, which requires each step to move the conversation and forbids two steps sharing a CTA. Acceptable soft-CTA phrasings: `Should I pull it together for your accounts?`, `Should I sketch that out?`, `Open to that?`. Keep them off the banned `Want me to send it?` / `Worth a look?` stems.

---

## Follow-Up Sequence Framework

Every campaign is a single thread with 2 to 3 steps (Hard Rule 18): Email 1 plus one or two same-thread follow-ups (2 by default, 3 for a small TAM).

### Email 1 - Thread 1 New Thread

Use a new subject, an OFFER-LED opener (leads with the offer), the primary test angle, and the clearest campaign-plan offer. Build the opener per the Offer-First Copy Standard. (Question-first openers are retired with proven-mode.)

### Email 2 - Thread 1 Support

Use the same thread. Support Email 1 with proof, story, useful context, or a sharper explanation. Close with a soft CTA — a light re-offer of Email 1's deliverable or a small forward-looking question — so the reader always has a next step; never trail off into a dead-end soft close. Keep it light (re-offer, do not re-pitch), and do not open by narrating that this is a follow-up.

### Email 3 - Same-Thread Double-Down Follow-up (small-TAM 3-step only)

Use the SAME thread as Email 1 and Email 2, with an empty subject (Hard Rule 18 and the `variants.yaml` schema). Double down on a DIFFERENT lever from Email 2: the biggest benefit, or the risk reversal that got missed. It must still stand alone as a message, because the reader may not have read the earlier two, but it is the third step of one thread and never a fresh new-thread attempt. (Question-first openers are retired with proven-mode.)

### (No Email 4: the 4-email / two-thread structure was retired 2026-07-05)

There is no fourth step and no second thread. Every campaign is ONE thread with 2 to 3 steps.

---

## Split Testing Rules

When entering a new audience or testing a new signal, test meaningfully different Email 1 angles before scaling.

Rules:

- Keep structure consistent across variants.
- Change the angle, not every variable at once.
- Map each variant to one pain or value category.
- Do not split-test failed deliverability.
- The A/B variant test and the QA standard ride Email 1; the follow-ups are single-variant same-thread replies.
- Each follow-up must move the conversation (switch the mechanism or double down on the risk reversal), not a minor rewrite of Email 1's CTA.
- Every variant must pass the Copy QA Gate.

---

## Spintax Rules

Use spintax only after final copy is approved.

- Every branch must pass `spam-word-checker.md`.
- Every branch must preserve the same meaning.
- Do not create so many branches that quality becomes uneven.
- Do not spin variables into broken grammar.

After spintax is added, rerun the Copy QA Gate.

---

## QA Checklist

Run before finalizing any campaign.

| Criteria | Pass/Fail |
|---|---|
| Spam-word checker passed (formatting, CTA, opener, voice) | |
| Best-practices review passed | |
| No em dashes, double hyphens, or mid-sentence dash separators | |
| No fake urgency or pressure | |
| No unsafe unsubscribe or closeout logic | |
| First line carries NO signal (the signal-first opener is retired 2026-07-17; Hard Rule 19 governs). Any slice-shared signal fact rides INSIDE the offer sentence, is true of every contact in the slice, and is never framed as this reader's own (Hard Rule 38) | |
| Offer passed the Offer Architecture gate before writing | |
| Email 1 uses an offer-led opener (leads with the offer) | |
| Slice-level angle (which pain and which proof this slice leads with) connects to the email's core pain angle; no per-contact opener personalization (retired, Hard Rule 34) | |
| No observational opener phrases | |
| No hallucinated facts | |
| Variables formatted correctly | |
| Recipient-centered copy, written 1-to-1 (first-person "I"; "we/us" only for genuine team/company facts) | |
| Email 1 ends with its only question, a soft permission CTA after the specific free deliverable and workload parenthetical; no statement-only `Just reply "Yes"...`, `Want me to…`, `Want us to send…`, `Interested?`, or `Worth a look?` | |
| CTA references a confirmed deliverable | |
| Length fits the register: tight for low-signal/templated; longer only when earned by real prospect-about substance (no padding, no long-but-low-signal) | |
| Reads naturally aloud | |
| Subject line matches the body | |
| No colon-as-runway sentences | |
| No comma-wrapped company descriptors | |
| Single thread, 2 to 3 steps (Email 1 + 1-2 same-thread follow-ups); 2 default, 3 small-TAM (Hard Rule 18) | |
| The A/B split test rides Email 1; the follow-ups are single-variant | |
| Each follow-up moves the conversation (switch mechanism or double down), never a re-send | |
| Email 2 (and Email 3 in a 3-step) are same-thread follow-ups that move the conversation | |
| Email 1 closes with the full signature ({full name} / {title} @ {company name} / {company location} / + phone 4th line when the client has one); the follow-ups (Email 2 and optional Email 3) may sign off with the first name alone, but a sign-off is mandatory on every email | |
| Signature lives on the sending-tool step, not in any email body or CSV column | |
| Emails formatted as short blocks separated by blank lines, not one dense paragraph | |
| Grammar clean and natural, no awkward over-compression or dropped connective words | |
| Email 1 is 25 to 35 body words, with 2 to 3 main-body sentences, exactly 1 question, and the workload split in parentheses; any optional P.S. is declarative and inside the word cap; follow-ups under 50 words | |
| Pre-written path: fallback copy lands in the same column with no blank rows | |
| Copy follows the saved campaign plan and locked offer | |
| Markdown and YAML match exactly | |

All must pass before shipping.

---

## Scoring Rubric

Canonical 6-dimension rubric, identical to `/cold-email-copy-best-practices` (the source of truth for writing-quality scoring) and the per-variant scoring block above. Do not introduce a divergent rubric.

| Dimension | Weight | What Is Measured |
|---|---:|---|
| Relevance | 25 | Specific reason for outreach |
| Value clarity | 25 | Clear offer and outcome |
| Proof quality | 15 | Claims are believable, specific, and relevant |
| CTA friction | 15 | Easy, low-pressure reply path |
| Readability | 10 | Short, plain, easy to scan |
| Deliverability | 10 | Formatting and wording avoid inbox risk |

Scoring:

- 85 or higher: ready to show
- 70 to 84: revise once more
- below 70: rethink the angle or offer

---

## Final Reminders

1. Work stepwise.
2. Present strategy options before final copy.
3. Run the Copy QA Gate before showing any copy.
4. Use `spam-word-checker.md` as the formatting, CTA, opener, and voice source of truth.
5. Use `cold-email-copy-best-practices.md` as the writing quality source of truth.
6. Research beats cleverness.
7. Specificity beats hype.
8. Simpler usually wins.
9. YAML must match markdown exactly.
10. Re-read the final `variants.yaml` from disk before handoff; do not rely on the draft in memory.

---

## What To Do Next

After `variants.yaml` is written and the final copy passes QA, ask once:

```text
Choose the DOCX presentation pack next step.

A. [Recommended] Create the campaign sequence DOCX only
B. Create every available DOCX pack with existing source files
C. Skip DOCX and continue to spintax/upload
D. Custom answer
```

If the user chooses A, run `/cold-email-campaign-sequence-docx-presentation`. If the user chooses B, run `/cold-email-campaign-sequence-docx-presentation` plus any lifecycle DOCX skills whose source files already exist:

- `/cold-email-followups-docx-presentation`
- `/interested-replies-docx-presentation`
- `/pre-call-nurture-docx-presentation`

Do this before any spintax or upload step. The DOCX steps use approved YAML/Markdown files as the source of truth and create compact client-facing launch sheets with the full sequence copy. If a lifecycle source file is missing, report it plainly and skip that DOCX. Do not invent lifecycle copy inside a DOCX step.

After the sequence DOCX offer, also ask:

```text
Choose the campaign approval brief next step.

A. [Recommended if client approval is needed] Create the approval brief
B. Skip approval brief and continue
C. Show what the brief would include first
D. Custom answer
```

If the user chooses A, run `/campaign-approval-brief` for the selected campaign, launch pair, or selected campaign set. This brief uses isolated per-campaign mini-briefs: summary table, decision logic, alternatives considered, risks, client prompts, expanded lead-source summary, and saved copy previews from `variants.yaml`. It does not replace the full sequence DOCX and must not invent missing decision history.

If copy is approved, resolve the sending platform: read `run_state.sending_platform` from the profile or campaign plan, and if that slot is empty or missing there and in the stack contract, STOP and route to `/stack-setup`. Then run the variation and upload steps below in that platform's own syntax and import format. This skill ships no platform-specific upload workflow and names no default platform: the serialization details belong to whichever tool fills the sending-platform slot.

| Step | What runs for the locked `run_state.sending_platform` |
|---|---|
| 1. Variation | that platform's native spintax/variant workflow, written in that platform's own variant syntax |
| 2. Upload | that platform's native campaign-upload workflow, in that platform's own import format (custom-field naming, variant slots, body/HTML shape) |

Never suggest or assume any platform other than the one locked in `run_state.sending_platform`. Only ask to change platforms if the locked path is impossible or the user explicitly asks.

If copy fails QA, rewrite through this skill before moving forward.

## Related Skills

- `/campaign-strategy`: produces the campaign brief this skill writes from
- `/icp-onboarding`: produces client profile context
- `/cold-email-campaign-sequence-docx-presentation`: creates the client-facing campaign sequence DOCX after approved YAML exists
- `/lifecycle-copy`: writes the post-sequence lifecycle copy (`followups.yaml`, `interested-reply.md`, `pre-call.md`). This skill writes the main cold sequence (`variants.yaml`); `/lifecycle-copy` continues it into follow-up, interested-reply, and pre-call flows. Run it before the lifecycle DOCX skills below.
- `/cold-email-followups-docx-presentation`: packages the no-reply follow-up DOCX from `followups.yaml` (produced by `/lifecycle-copy`)
- `/interested-replies-docx-presentation`: packages the positive-reply handling DOCX from `interested-reply.md` (produced by `/lifecycle-copy`)
- `/pre-call-nurture-docx-presentation`: packages the booked-call nurture DOCX from `pre-call.md` (produced by `/lifecycle-copy`)
- `/campaign-approval-brief`: creates the client-facing decision brief explaining why this campaign path was chosen
- `/spam-word-checker`: mandatory formatting, CTA, opener, and voice guardrail
- `/ask-aaron`: advisory persona consult on offers and copy (offer pressure-testing, line-by-line teardowns, follow-up sequencing); never relaxes this skill's governed contract
- `/email-waterfall`, `/list-quality-scorecard`: produce and grade the verified slice the List Gate requires before any copy
- `/stack-setup`: resolves the capability roles this skill needs (sending platform, email verifier, waterfall enricher) when the stack contract leaves one empty

