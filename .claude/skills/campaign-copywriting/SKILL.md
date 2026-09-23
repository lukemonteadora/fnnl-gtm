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

Ask before choices that affect spend beyond an approved budget, provider routing, source of truth, list quality, campaign direction, client-facing output, live systems, scraping or account risk, or legal/compliance risk. For low-risk reversible choices, state the recommendation and proceed.

Do not turn copy that failed the writing QA into a user-facing option: fix it. But never hide an offer or arm that a delivery or proof gate is holding (a client-honored offer waiting for the client's OK, an angle waiting for proof): list it with its blocker, so it stays visible to the operator and the client slate (operator directive 2026-09-22).

When asking the user, use the Claude Desktop native Interactive Inputs / Choice Prompts pattern from /clarification-first: recommended option first, short choices, and Custom answer last when a custom answer is plausible.

## Interaction Policy

Defers to `/autonomous-execution-policy`. Under `run_state.execution_mode = auto_execute` (opt-in per client; the default is `review_gates`), proceed without pausing: pick the strongest option per this skill's rubric, record it to `run_state`/profile, and continue. Never re-ask a decision already in `run_state`, the profile, memory, or the operator's latest message. Stop only for the policy's hard-stops (spend over the approved ceiling, live send, credentials, provider/source-of-truth change, safety gates). On a long async wait, background-poll and move to other productive work. Never idle. Autonomy does NOT relax the Copy QA Gate: `spam-word-checker.md` and `cold-email-copy-best-practices.md` remain HARD gates: every variant must still pass both before it is shown, approved, serialized, or uploaded, regardless of execution mode.

---

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short: record status, not raw output. Full protocol: `client-activity-log.md`.

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

Every Email 1 must follow `outreach-copy-framework.md` (Framework A). That file is Framework A's single home: the mechanical checklist, the precedence rule, and Aaron Shepherd's curated exemplar set under the heading `## Framework A (house name): the direct concrete offer, Aaron's measured winner anatomy` (`/ask-aaron` holds the full doctrine and dated conflict ledger behind it). This section gives the shape for quick reference and records which parts are Aaron's own finding and which are house hardness, because Hard Rule 27 lives in this skill. It does not duplicate the exemplar set.

**The default anatomy: Aaron's measured winner** (his 1.5M-email study, S02 2026-05-11, `aaron-doctrine.md` §9):
- **Subject:** 2 to 4 words, all lowercase, 0 to 2 variables, curiosity plus relevance, never deceptive (no "FW:", fake thread, emergency, invoice, or account fault).
- **Body:** 25 to 35 words and 2 to 3 sentences, both counted on the body only: the optional P.S. sits outside the count but must be short and do one job (operator-approved Aaron alignment, 2026-09-21). One to two lines plus the optional P.S. His floor governs a body a little under 25: it passes only if it still carries the whole offer (his §1.1 model body runs about 22 words). No greeting word: "Hey", "Hi", and "Hello" fail, even though his §2.4 draft starts "Hey," (exemplars show shape; the stated rule governs). It opens straight on the offer: "no pain, no observation, no preamble." A first name is optional and may open the email, as in his models (examples §1.1, §1.3); his first-name-second move (doctrine §9) is an alternative trick, not a rule.
- **The offer sentence** is usually a conditional around a free concrete deliverable (`if we could [deliverable] at no cost ...`), with the dream outcome implied by what the deliverable contains (doctrine §4). The sentence shape follows the offer type (operator decision 2026-09-23, Aaron pre-launch gap audit; Aaron Sep 7, Sep 14, Sep 21). For a free deliverable, deliverable-first stays the default (his measured winner; Sep 7, "if we could [deliverable] at no cost ..."). For a free trial, a pilot or a pay-on-result offer, a conditional that names the outcome and pairs it with its risk term is the default, not an arm ("if I had a way to [outcome] ... and you only pay per [unit], would that be worth a quick test?", Sep 21; "if we could help you get [result] ... free for [x] days", Sep 14; doctrine §4, his Jun 29 script). Either shape may run the other as a labeled arm. The limits are unchanged: no proof claim on line one, no guarantee on the core service (pay only on a counted result is not a guarantee), and an outcome that is not a stretch (that last limit is the corpus's reading, not his words). Still banned: an outcome stated with no risk term, and the retired bundle of an outcome plus a named comparable and its number on line one (proof goes to the PS, one point). The word "free" or "no cost" is stated (some older exemplars, examples §2.1 and §2.4, omit it; never copy that omission).
- **A scope disclosure** of 3 to 4 real tasks we handle plus the one small thing they do, as a parenthetical or in prose, whenever it reflects the real process. Never invented.
- **One soft permission CTA.** Default `Would that be worth sharing more?`, his signature ask (examples §4).
- **An optional P.S. doing ONE job:** the relevance or signal demoted from line one (the opening-line swap, examples §1.1), or one same-mechanism near-twin proof point in plain legible numbers, or a casual risk-elimination or reason-it's-free line, or the deliverable's own terms (its turnaround and the one small thing they do, as in the examples §1.5 winner's P.S., whose teardown credits them with showing effort and making it easy to say yes).
- **Two canonical shapes, A/B-tested against each other** (ledger R14): the one-liner (offer plus CTA, optionally no P.S.; it may be a single sentence, since "When the offer is strong, the email can literally be one sentence", doctrine §9) versus two lines plus a P.S.
- **The floor** (doctrine §9, "almost too short"): never so short it reads like a bump. It must still carry the offer.

**Labeled variants, never the default.** Each one is recorded in `copy.md` as a logged test arm or an explicit awareness-driven choice: the two-line relevance or pain-first pair (ledger R14; line one is a common validated pain that "builds a little bit of pain but doesn't focus on it too much", and the hook's pain must match the offer's pain); a no-CTA variant (examples §4); a longer variant for solution-aware or saturated markets (ledger R07 and R19, a logged A/B arm only); the offer-sentence shape that is not the offer type's default, meaning the outcome conditional with its risk term on a free-deliverable offer or the deliverable conditional on a trial, pilot or pay-on-result offer (doctrine §4; the boundary in the offer-sentence bullet above; operator decision 2026-09-23, Aaron pre-launch gap audit); a relevance question opener at any awareness level (Sep 21, on a solution-aware list: "first name, do you currently offer a trial?"; S08's soft neutral question for less-aware buyers is one case of it), run only when the question is literally relevant to the offer, answerable honestly either way, and implies no relationship or internal thread, never a question-form pain opener; a soft conditional statement close in place of the CTA question (Sep 21: "... if you're open to that kind of thing"), which is still the one primary ask, stated conditionally, and is neither the no-CTA arm nor the banned `Just reply "Yes"` opt-in; a no-number version, when the deliverable's number makes the line less conversational (Sep 21: "I'd rather try it without"; the default keeps the number, and no number is ever invented); a proof P.S. run as an A/B pair against the same email with no P.S., whenever an on-file proof point exists (Sep 21: "try it, see which one works better"); a brief truthful context line when the asset needs framing (S13); and the call-out form, only when the observed thing is what we offer to work on (doctrine §8), demoted to the P.S. by default. R18, his Sep 14 compliment opener, is recorded for study only: he flags it as an exception he is normally against and scopes it to one client's offer. It is not a runnable variant in governed campaigns; running it needs an explicit operator approval as a logged test, with carve-outs to Hard Rules 19, 30 and 34. (The relevance question opener at any awareness level, the soft conditional close, the no-number version and the proof-P.S. pair are Aaron process alignment, operator directive 2026-09-22; the question opener supersedes "less-aware buyers only", 2026-09-21.)

**Three Email 1 variants by default (Aaron process alignment, operator directive 2026-09-22; supersedes the two-variant `email_1_a`/`email_1_b` convention, 2026-07-05).** Email 1 runs three variants by default: `email_1_a`, `email_1_b`, `email_1_c`, one variable changed per variant (A is the control), more letters allowed (Aaron, Sep 21: variant one, variant two, variant three; Mar 9: one variable at a time). The natural single variables are the ones above: the R14 shape pair, the proof-P.S. pair, one labeled opener or close arm, the no-number version, or the CTA wording. The columns, the export gate and the upload wiring for every declared letter live in Pre-Written Email Copy Architecture below.

**What is Aaron's own and what is house hardness** (the corrected source table, doctrine §13 and ledger R07):

| Element | Source | Status now |
|---|---|---|
| Offer on line one, no pain, no observation, no preamble | Aaron's own measured finding (S02) | Default. Departures only as the labeled variants above |
| An outcome named in the offer conditional | Aaron's own shape when paired with a zero-risk term (doctrine §4; his Jun 29, Sep 14 and Sep 21 scripts). The blanket ban on it was house hardening credited to him | The default for a free trial, a pilot or a pay-on-result offer, and a labeled arm on a free-deliverable offer, where deliverable-first stays the default, under the boundary in the offer-sentence bullet above (operator-approved Aaron alignment, 2026-09-21; offer-type split, operator decision 2026-09-23, Aaron pre-launch gap audit) |
| 25 to 35 words, 2 to 3 sentences, one to two lines | Aaron's own measured winner (S02) | Default band, counted on the body with the P.S. excluded, with his floor and his saturation exception (a longer version runs only as a logged A/B arm). The universal hard cap was house hardness and is relaxed (operator-approved Aaron alignment, 2026-09-21) |
| The 3-to-4-task scope disclosure | Aaron's own device and sizing (S02) | Default whenever it reflects the real process, as a parenthetical or in prose. "Mandatory" was house hardness and is relaxed (operator-approved Aaron alignment, 2026-09-21) |
| 2-to-4-word lowercase subject | Aaron's own; he also rates subject lines the lowest-leverage lever | Kept. Subject lines are tested last (doctrine §9) |
| Subject variables | Aaron says "one to two variables" and shows zero-variable subjects | 0 to 2 variables. "Exactly one merge token" was house hardness and is relaxed (operator-approved Aaron alignment, 2026-09-21) |
| Question count | "Exactly one question" was house; S13 shows multi-question copy | One primary ask: one CTA question by default, no stacked asks ("Give one primary action", doctrine §9) (operator-approved Aaron alignment, 2026-09-21) |
| Question openers | "Never a question opener" was house hardness; S08 adds a soft-question path, and his Sep 21 build opens a solution-aware list on "do you currently offer a trial?" | Allowed as the labeled relevance question opener at any awareness level, literally relevant and implying no relationship. Question-form pain openers stay banned (operator-approved Aaron alignment, 2026-09-21; widened from "less-aware buyers only" by Aaron process alignment, operator directive 2026-09-22) |
| Capability truth, the Proof-Asset Gate, deliverability formatting, compliance, the QA gates, relevance-first subjects, plain vocabulary, "a number in the offer" | House safeguards, not Aaron's (doctrine §13) | Kept and labeled house. "A number in the offer" is satisfied by the deliverable's own quantity, turnaround, or effort numbers; any benchmark or cost-of-inaction figure goes to the P.S. as its single proof or relevance point. The number is the default, not a hard fail: a no-number version runs as a labeled arm (Aaron process alignment, operator directive 2026-09-22) |

**Portability rule (doctrine §9).** "it's the script framework that's doing all of the heavy lifting here, not the specific words." Aaron's examples show SHAPE. Never paste his sentences into client copy; change the offer, the pain, and the CTA wording to the client.

This rule overrides every older live or retired instruction in this skill that calls for a 50-to-90-word or 70-to-90-word Email 1, a setup line before the offer, stacked asks, an outcome stated with no risk term, or an outcome plus a named comparable on line one (the outcome conditional with its risk term above is his own shape and is not overridden: it is the default for a trial, pilot or pay-on-result offer and a labeled arm otherwise; operator-approved Aaron alignment, 2026-09-21; operator decision 2026-09-23, Aaron pre-launch gap audit). Truth, capability, deliverability, and fulfilment gates remain mandatory. If the offer cannot carry the message without setup, stop and repair the offer or audience (doctrine §2: fix the highest broken item first) rather than switching Email 1 to a pain-led or observation-led framework. A labeled variant is a test arm run beside a working default, never a rescue for an offer that cannot stand alone. The pre-2026-09-21 text of this section is archived at `outbound/_archive/aaron-alignment-2026-09-21/campaign-copywriting--framework-a-and-offer-first-standard.md`.

---

## Offer-First Copy Standard (Aaron method): the default for cold copy

This is the controlling standard for offer-first / offer-validation copy (`copy_mode = offer_validation` / `offer_market_proven = false`), and it is the DEFAULT for a new client and any first wave. Sourced from Aaron Shepherd's real doctrine, not a paraphrase invented here: the full corpus, his verbatim examples and rejections, and the dated conflict ledger resolving where he's changed his own position over time all live in `/ask-aaron` (advisory; consult it for teardowns or offer pressure-testing, never to relax this skill's governed contract). Where any older rule in this skill (a mandated question / diagnostic opener, per-contact copy personalization, minimize-we, a mode split) conflicts with this section, **this section wins, and the older rule is retired.** As of 2026-07-05 there is only ONE copy mode: offer-first. The proven-mode 1-to-1 diagnostic register, the question-first / diagnostic-mirror openers, per-contact copy personalization (former Hard Rule 34), the Question-First Opener Framework, and the personalization-density length band are **RETIRED** (archived under `outbound/_archive/proven-mode-1to1-retired-2026-07-05/`). Any residual `proven-mode`, `copy_mode`, `offer_market_proven`, `diagnostic-mirror`, or `question-first` language elsewhere in this skill or the peripheral skills is superseded and reads as retired. Signals remain in play for **targeting only** (which companies and contacts to email, campaign slicing, and which offer a segment gets), never for per-contact copy.

**Write FOR the real list and a real contact, never in a vacuum (HARD RULE, 2026-07-12).** Before writing a single line, pin down exactly who this copy is for and pull REAL examples from the verified send list: the concrete job titles + company type/industry + company size + geography (e.g. "CFOs / finance leaders at MSP & cloud managed-service providers, Nordics + near-Europe, 100-3000 employees"), and 2-3 real contacts from `leads.verified.csv` by name, title, company, domain (e.g. "Mark Grafton, CFO, Node4"). Write the email TO that person, and pressure-test every line with "would [real contact] find this specific and true, and is it about what they actually bill for?". This kills the failure mode of writing generic copy in a vacuum and re-adjusting it blind over and over: the words get concrete because you know exactly who reads them. **Record the audience definition + the sample contacts at the top of `copy.md`.**

**Start from the offer. Nothing else matters if the offer is wrong.** Build and score it on the value equation: (dream outcome × perceived likelihood of achievement) ÷ (time delay × effort / sacrifice). Then run the Four Concretes.

**Apply the value equation Aaron's way (doctrine §4, operator-approved Aaron alignment, 2026-09-21).** For a free deliverable, imply the dream outcome through the artifact (doctrine §4). The sentence shape follows the offer type (operator decision 2026-09-23, Aaron pre-launch gap audit; Aaron Sep 7, Sep 14, Sep 21). For a free deliverable, deliverable-first stays the default (his measured winner; Sep 7, "if we could [deliverable] at no cost ..."). For a free trial, a pilot or a pay-on-result offer, a conditional that names the outcome and pairs it with its risk term is the default, not an arm ("if I had a way to [outcome] ... and you only pay per [unit], would that be worth a quick test?", Sep 21; "if we could help you get [result] ... free for [x] days", Sep 14; doctrine §4, his Jun 29 script). Either shape may run the other as a labeled arm. The limits are unchanged: no proof claim on line one, no guarantee on the core service (pay only on a counted result is not a guarantee), and an outcome that is not a stretch (that last limit is the corpus's reading, not his words). Still banned: an outcome stated with no risk term, and the retired bundle of an outcome plus a named comparable and its number on line one (proof goes to the PS, one point). Raise perceived likelihood by shrinking what is judged (the deliverable, which is easy to believe) and by weaving a near-twin case into the offer, not by asserting proof. Collapse time with a date-certain free deliverable; the day count must be a real capacity term (his "7 days" is an example, not a default). Strip the prospect down to one act. The reader must be able to answer three things: what's in it for them, how long it takes, and what they have to do. Then run his "why not?" test and the farming-interest check together: the offer must be "specific enough to filter out those who don't and compelling enough to pull in those that do" (doctrine §4), because an offer can be easy to say yes to and still worthless.

**Be specific but simple: name what is lost or gained, then stop (HARD RULE, 2026-07-12).** Name the noun and move on. Not vague, not over-listed. RIGHT: "where you're losing the most revenue." WRONG (vague, the most WHAT?): "where you're losing the most." WRONG (over-listed filler): "where you're losing the most: the usage that goes unbilled and the seat changes that never hit the invoice, and what getting it back is worth." Name the thing concretely (revenue), keep it plain, do not pad with a mechanism list that adds length.

**Don't label the reader with their own segment / industry / acronym (HARD RULE, 2026-07-12).** The recipient already knows what they are; naming their category AT them ("MSPs lose 4-9%", "for SaaS companies like you", "as a fintech, you...") reads generic and templated, like a mass email to a list, and often smuggles in the jargon this copy is supposed to avoid. Speak to their SITUATION and to "you" directly (the company-name variable is not a default in copy; of that substitution Aaron says "which I actually hate", examples §8), and attribute a benchmark to its real CAUSE, not their category: not "the 4 to 9% MSPs lose" but "the 4 to 9% lost to manual billing." (A benchmark like this never sits in lines one or two of Email 1; it goes to the P.S. as its single proof or relevance point, or to Email 2.) The segment is how we TARGET the list (who receives the email), never a label repeated back to the reader in the copy. (A word the reader naturally uses about their own work is fine; the ban is on category-labeling them, especially with an acronym.)

**The Four Concretes (offer-validation inputs, not an Email 1 packing list).** Only #1 (the specific deliverable) is required before copy is written (operator directive 2026-09-22). #2 to #4 are captured whenever they exist and never hold an offer-led test: a new offer or buyer type without a differentiator, an outcome number or a named proof point ships the truthful Framework A version, where the offer carries the email, and upgrades when they arrive (doctrine §4: raise believability by shrinking what is judged, not by adding proof). Framework A then compresses only the specific free deliverable and, when it reflects the real process, the scope disclosure into Email 1. Concrete #3 (the outcome) is implied through what the deliverable contains on a free-deliverable offer, and named on line one, paired with its risk term, only in the outcome conditional, which is the default for a trial, pilot or pay-on-result offer and a labeled arm otherwise (doctrine §4; the boundary in the Framework A section; operator-approved Aaron alignment, 2026-09-21; operator decision 2026-09-23, Aaron pre-launch gap audit). A quantified outcome is captured when it exists, never required (see below). Concrete #4 (proof) is one point at most, in the P.S. or deferred to Email 2, never in lines one or two (doctrine §9, examples §6). The differentiator lives in the P.S., follow-ups, or reply path:
1. What exactly are you offering? (a crisp one-line service)
2. Why would I work with you? (a real differentiator)
3. What exact result or number could I get? (a quantified outcome)
4. What did your last client get? (a named, recognizable proof plus its number)

These are captured upstream (`/offer-intelligence`, `/social-proof-bank`, `client-profile.yaml`, the intake); the copy step only checks. Do not cram all four into Email 1 and break Framework A. A missing concrete is handled two-tier, exactly like the Proof-Asset Gate. **Hollow without it** (an angle whose whole premise is the missing concrete, such as a proof-led angle): hold that angle only, fire `proof-asset-request.md`, and ship the slice's offer-led version meanwhile. **Would only strengthen it:** flag the gap, ship the truthful Framework A version, and upgrade later. Never invent the number.

**A quantified outcome is captured when it exists, never required, and never forced into Framework A Email 1 (operator decision 2026-09-23, Aaron pre-launch gap audit; none of Aaron's three September offer lines carries an outcome number, and his Sep 14 criterion is "very tangible"; replaces the 2026-08-12 rule that required one in the offer record).** Only the specific deliverable (Four Concretes #1) is required before copy is written. A real outcome number or cost-of-inaction figure, when the client has one, is kept in the offer record and may ride the P.S., Email 2 or the reply path; it is never invented to fill the slot. In Email 1, the number in the offer sentence is the deliverable's own quantity, turnaround, or effort (a list of 100, a 24-hour turnaround, 2 minutes to skim). A benchmark or cost-of-inaction figure never sits in lines one or two, and neither does an outcome figure outside the outcome conditional with its risk term (the default for a trial, pilot or pay-on-result offer, a labeled arm otherwise; doctrine §4; operator-approved Aaron alignment, 2026-09-21; operator decision 2026-09-23, Aaron pre-launch gap audit); it goes to the P.S. as its single proof or relevance point, or to Email 2, or to the reply path. Never fabricate a figure or overload the first message to satisfy an older packing rule.

**The inherent-value anchor: a SECOND number that prices the free thing (Aaron's method, written up here 2026-07-17; attribution restored, operator-approved Aaron alignment, 2026-09-21).** The anchor is his, from his July 13 2026 video (doctrine §3; the raw transcript is `20260713_I-Generated-589-Positive-Replies-in-60-days-From-Cold-Email.md` in the local `Aaron-Shepherd-Transcripts/` archive, doctrine §15). His term is *inherent value*: a client's tool is "the exact same audit that they run for their brand new clients that pay, you know, $10,000 and above"; another client's valuation tool shows "something that costs $6,000 every single year, but you're getting the first glimpse of it for free"; and his own calculator "compared 10 million emails to $50,000 plus in Meta Ad spend", so the reader gets the finding "without any of the upfront spend or any of the risk on their end". An earlier 2026-09-21 pass relabeled this rule house because the `/ask-aaron` corpus did not carry it at the time; the corpus now does (doctrine §3). What is house is the split below (a second number, never the outcome number) and the binding constraints. This is a different number doing a different job, and confusing the two is the mistake to avoid. The three sources above answer *"what could I get / what am I losing"*: the reader's outcome, which the Four Concretes capture when it exists (never required; operator decision 2026-09-23, Aaron pre-launch gap audit). The anchor answers a question the reader asks about the **asset itself**: *"why is this free thing worth my attention?"* It only applies when the E1 offers a real asset, and it never substitutes for the outcome number.

Anchor on what the asset genuinely cost to acquire or would cost to buy:
- **What it cost to produce the data:** `I just ran a test of 10 million cold emails and $50,000+ in Meta ad spend to determine the most cost-effective way to scale in 2026.` The reader gets, free, a finding they'd have had to spend that to learn.
- **What clients pay for the same process:** `this is the exact review we run for clients paying $10,000+.` (Never "audit": it is a dead word to a cold reader, doctrine §3, ledger R09.)
- **What the equivalent costs annually:** `the platform runs $6,000/year; this is the first look, free.`

These three lines illustrate the pattern only, and they are house wording, not his sentences: the first is a cleanup of his own demo email (quoted verbatim from examples §1.6 under "Which shape leads" below; he says "50,000 plus in meta", with no dollar sign), and the other two rephrase his two client anchors quoted above. Their figures are Aaron's and his clients', not ours or any of our clients': never paste them into copy, because a borrowed total is a false claim (doctrine §9: never borrow Aaron's agency totals as your own).

**Binding constraints:** (a) it must be **true**; (b) it prices the asset, so it never stands in for the outcome number (a real outcome number, when one exists, is recorded separately in the offer record; none is required, operator decision 2026-09-23, Aaron pre-launch gap audit); (c) include it in Framework A Email 1 only when the full message still passes the default anatomy (Hard Rule 27); otherwise it rides the P.S., Email 2, or the reply path.

**The number goes IN the offer, plain and direct (parts (b) and (c) are a HARD RULE, 2026-07-12; part (a)'s number is a default, not a hard fail, Aaron process alignment, operator directive 2026-09-22; label corrected, operator decision 2026-09-23, Aaron pre-launch gap audit; operator-approved Aaron alignment, 2026-09-21).** Three parts, all checkable:
- **(a) Wire the deliverable's own number INTO the offer sentence, value-first, NEVER a story-telling preamble.** The number that belongs in the offer sentence is the deliverable's quantity, turnaround, or effort, not a benchmark, and not an outcome unless the email runs the outcome conditional with its risk term, the default for a trial, pilot or pay-on-result offer and a labeled arm otherwise (doctrine §4; operator-approved Aaron alignment, 2026-09-21; operator decision 2026-09-23, Aaron pre-launch gap audit). This is the default, not a hard fail: a no-number version runs as a labeled arm when the number makes the line less conversational (Sep 21, on his own "14-day test": "that comes off as a little bit less conversational"), and a real outcome number, when one exists, stays in the locked offer record either way (Aaron process alignment, operator directive 2026-09-22; never required, operator decision 2026-09-23, Aaron pre-launch gap audit). **WRONG** (marketing narration before the offer): "Usage-based billing loses 4 to 9% of revenue, and for MSPs the true-up is where most of it hides. If we could..." Also wrong: an outcome promise plus a named comparable on line one ("if we could save you X%, just like we did for [client]"), which asks the reader to believe the big claim instead of the small deliverable (doctrine §4). A figure like the 4 to 9% belongs in the P.S. as its single point, or in Email 2. The model is Aaron's own test winner (examples §1.5, `[AI-endorsed]`, self-reported as the best-performing copy in his bake-off):

  > "If we could build you a no-cost list of 100 companies that look like case study, same shape, same buying signals, would that be useful? PS, 24-hour turnaround takes you 2 minutes to skim."

  Every number is the deliverable's own: 100 companies, a 24-hour turnaround, 2 minutes of the reader's effort. "no cost" says free out loud, "case study" is his case-study variable used as the deliverable's target (in this system it is the prospect's own best client, `own_best_client`, one of the per-contact variables Hard Rule 34 allows, where the data holds it, and otherwise the slice's near-twin case written into the shared body), and the PS "does a lot of the heavy lifting" (his teardown, examples §1.5). The loser it beat, same offer and same list, with the value buried behind a pain opener (`[ANTI]`):

  > "Spending too much time prospecting for new high-value clients, we can generate a look-alike list of 100 companies matching the profile of your case study client, open to a 2-minute skim of the CSV."

  His verdict: *"the value is still here, it's just buried."* Two notes so the exemplar is not over-read. Its CTA, `would that be useful?`, is now on the Email 1 whitelist (Hard Rule 32; Aaron process alignment, operator directive 2026-09-22; supersedes the 2026-09-21 note that it was not). And the portability rule applies (doctrine §9): copy the shape, never these sentences. The pre-2026-09-21 RIGHT example (an outcome promise with a named comparable on line one) is archived at `outbound/_archive/aaron-alignment-2026-09-21/campaign-copywriting--framework-a-and-offer-first-standard.md`.
- **(b) No source citations in the email body.** A prospect does not need "(MGI Research)", "(Gartner)", or "(2024 study)" to be persuaded; it adds length and reads like a report, not a peer. Keep the provenance in our records (`copy.md` / `offer-intelligence.md`), never in the sent email.
- **(c) Plain, direct vocabulary, Hormozi tone, no buzzwords or jargon-metaphors.** Write the way a plain-spoken operator talks to a peer. BANNED as buzzy/vague: `leak` / `leakage`, `unlock`, `leverage`, `streamline`, `optimize`, `supercharge`, `seamless`, `synergy`, `empower`, `robust`, `game-changer`, `frictionless`, `turnkey`. Say the plain thing instead: not "where your billing leaks" but "where you're losing revenue most" / "lose to manual billing" / "get paid for everything you deliver". A real industry term the buyer actually uses (`true-up`, `usage-based billing`) is fine; a buzz-metaphor dressed up as insight is not. (An internal offer or campaign NAME may keep a term like "Billing Leakage Teardown"; prospect-facing copy stays plain.)

**The four steps, in order:**

1. **Offer (operator-approved Aaron alignment, 2026-09-21; offer-type templates, operator decision 2026-09-23, Aaron pre-launch gap audit).** Lock it as one sentence. For a free deliverable: `if we could [free concrete deliverable, with its own quantity, turnaround, or effort] at no cost ([3 to 4 things we handle]; you'd only [one small act])`, closed by the soft permission CTA. For a free trial, a pilot or a pay-on-result offer: `If I had a way to [outcome for the prospect's own business] [and you only pay per [counted unit] / free for [N] days], would that be worth a quick test?`. The sentence shape follows the offer type (operator decision 2026-09-23, Aaron pre-launch gap audit; Aaron Sep 7, Sep 14, Sep 21). For a free deliverable, deliverable-first stays the default (his measured winner; Sep 7, "if we could [deliverable] at no cost ..."). For a free trial, a pilot or a pay-on-result offer, a conditional that names the outcome and pairs it with its risk term is the default, not an arm ("if I had a way to [outcome] ... and you only pay per [unit], would that be worth a quick test?", Sep 21; "if we could help you get [result] ... free for [x] days", Sep 14; doctrine §4, his Jun 29 script). Either shape may run the other as a labeled arm. The limits are unchanged: no proof claim on line one, no guarantee on the core service (pay only on a counted result is not a guarantee), and an outcome that is not a stretch (that last limit is the corpus's reading, not his words). Still banned: an outcome stated with no risk term, and the retired bundle of an outcome plus a named comparable and its number on line one (proof goes to the PS, one point). A comparable goes to one of two places: it becomes the deliverable's target (the prospect's own best client, `own_best_client`, per contact where the data holds it, or else the slice's case study written into the shared body, as in "100 companies that look like [their best client]"), or it becomes the P.S.'s single proof point (doctrine §4, §9; examples §1.5). The risk reversal is casual risk elimination: free until the result, never a money-back guarantee, and "no strings attached" only when literally true (examples §5). Truth-bound: use the risk reversal the front-end owner can actually deliver: the agency/operator for a front-end promise (a free deliverable or teaser), the client for a back-end/product term (pay-on-results, which is a price term, not a guarantee). When the client has not agreed to honor the term (no `lead_magnet_client_ok: yes` for that arm), use the free-first work the agency can deliver itself; a client-backed term like pay-on-results runs as its own offer arm once the client OKs it (`/offer-test-slate`). See the Confirmed Deliverable Gate (front-end) and Capability Truth (back-end). The offer basically IS the copy ("This almost is the copy", doctrine §9). The old outcome-first formula is archived at `outbound/_archive/aaron-alignment-2026-09-21/campaign-copywriting--framework-a-and-offer-first-standard.md`.
2. **Subject. Framework A controls (HARD RULE, 2026-08-12; operator-approved Aaron alignment, 2026-09-21).** Use 2 to 4 lowercase words and 0 to 2 variables (Aaron says "one to two variables" and also shows zero-variable subjects), curiosity plus relevance, never deceptive (doctrine §9; his endorsed and rejected subjects are in examples §3). "your [the offer's own object]" passes the relevance test (Sep 21: "just your trial, super short, conversational"), and `fyi {{first_name}}` is a normal option (Aaron process alignment, operator directive 2026-09-22). Keep raw statistics, percentages, hype, and the offer out of the subject. The subject must still match the body and pass `spam-word-checker.md`. Subject lines are his lowest-leverage lever, so they are tested last (doctrine §9).
3. **Body = Framework A (operator-approved Aaron alignment, 2026-09-21).** Open straight on the free deliverable (for a trial, pilot or pay-on-result offer, the outcome with its risk term; operator decision 2026-09-23, Aaron pre-launch gap audit), include the scope disclosure whenever it reflects the real process (parenthetical or prose), and close with one soft permission CTA, by default `Would that be worth sharing more?`. The body follows the default anatomy in the Framework A section above: 25 to 35 body words and 2 to 3 body sentences (the declarative P.S. sits outside both counts, short and doing one job), one primary ask. Risk-reversal words (`free`, `no obligation`, `no cost`, `risk-free`) are allowed in the body, sparingly, never in the subject (`spam-word-checker.md` → Allowed in the Body). Say "free" or "no cost" out loud; leaving it out is, in Aaron's words, "a huge miss" (examples §8).
4. **Follow-ups: the sequence is two emails by default, three at most (Email 1 plus one or two follow-ups); each follow-up earns its place and stands alone (operator-approved Aaron alignment, 2026-09-21).** Aaron on a 5-email sequence: "Absolutely do not do this in 2026 at all" (examples §7.1), and his study puts 58% of losers in follow-ups (doctrine §9). Hard Rule 18's 2-to-3-step cap stands: two emails by default at every TAM size, a third only in a genuinely small market (roughly under 3,000 qualified contacts, a house threshold) or as a tested arm. Each follow-up takes one of his **three directions**, newest first (Sep 21: "Either you reduce the length of the email ... and then reduce the friction of the CTA ..., or you lean on a different version of the value prop"; examples §7.1; ledger R12, doctrine §11): **strip it back** (a shorter email with a lower-friction ask), **a different value prop or mechanism for the same offer**, or **add to it** (pre-handle a real concern, add a benefit layer, add a risk reversal, or give the reason it is free). If Email 1 was already stripped back, take one of the other two. (Aaron process alignment, operator directive 2026-09-22; supersedes the two-direction fork, 2026-09-21.) A lower-friction restatement of the same offer, such as a two-minute video that shows how it works, PASSES; repeating Email 1 FAILS. Higher-friction ask first, lower-friction second (the friction ladder, doctrine §11), with the reverse allowed as a test. **Don't re-hammer the same headline number/stat across emails (HARD RULE, 2026-07-12):** whichever email carries a figure states it once; a later email carries the value a FRESH way (the consequence in plain words, a different angle) and does NOT repeat the same figure. Repeating "4 to 9%" (or any stat) in every email reads mechanical. The number is a one-time hit, not a refrain.

**Risk reversal beats personalization (2026).** The offer-first lever is a casual, reasonable-person risk elimination ("the first look is free, no obligation", "if it's not a fit, no hard feelings"; Aaron's own model lines are in examples §5), not heavy per-contact personalization. Free until the result; never a money-back guarantee (he calls it "incredibly washed out", examples §5); "no strings attached" only when it is literally true. Keep personalization minimal (operator-approved Aaron alignment, 2026-09-21): `{{first_name}}` is optional, the company-name variable is not a default (examples §8), and the preferred variable is the case study used as the TARGET of the deliverable, never as social proof (doctrine §9). **At most two per-contact variables, inside the offer sentence** (Aaron process alignment, operator directive 2026-09-22; supersedes first-name-only variation, 2026-09-21): `{{sells_to_vertical}}` (who the prospect sells to), `{{service_offered}}` (their own product or service), or `{{own_best_client}}` (their own best client as the deliverable's target, his case-study variable, with the slice's near-twin case as the fallback). Aaron, Sep 21: "there's two personalizations that I'm thinking of ... The first is who their ideal customer is, and then second, the actual service that they offer." Hard Rule 34 holds the full rule. Do not bolt a diagnostic-mirror opener or per-contact signal onto offer-first copy; that per-contact-copy approach is retired (proven-mode retirement, 2026-07-05; ledger R13).

**Slice-shared signal facts in the body: the line between targeting and copy (HARD RULE, operator ruling 2026-07-17).** A competitor name or a public customer complaint MAY appear in the email body, but ONLY when the ENTIRE slice shares that fact. One campaign targeting "customers of Competitor X" gets one shared body that names X, because every reader of that body is a customer of X. That makes it slice-level shared copy, not per-contact personalization. Three bounds, all binding:

1. **It is never the opener.** Hard Rule 19 stands: the opener is offer-led. The shared fact rides INSIDE the offer sentence, or in the P.S., which is the default home for relevance demoted from line one (the opening-line swap, examples §1.1), never in line 1. The P.S. placement was added (operator-approved Aaron alignment, 2026-09-21); the three bounds are otherwise unchanged.
2. **Per-contact reference stays banned.** "I saw *your* review from Mary" is out, and so is every observational opener. The copy states the fact as the slice's reality, never as something we looked up about this particular reader.
3. **The fact must be true of every contact in the slice.** If it is not, the slice is wrong, not the copy. Fix the targeting rather than hedge the sentence.

This is the same targeting-versus-copy line the per-contact variables walk (`sells_to_vertical` may ride inside the offer sentence as a per-contact variable under Hard Rule 34, never as an observation), extended to two more signals. It does NOT reopen observational per-contact copy personalization, which stays retired.

**Why this was always permitted, and why it is worth using.** The operative rule has always been "never PER-CONTACT copy", not "never in copy", so this names a boundary that already existed rather than moving one. Eric Nowoslawski's evidence for the upside: a newsletter service naming a competitor in the body got a large AI lab to reply, because the email named that lab's best-known rival. The competitor name did the work precisely BECAUSE it was true of the whole slice, which is exactly what let it ship as one shared line.

### The CTA Hierarchy: offer-first, lead magnet optional, rotate across steps (HARD RULE, canonical)

This is the canonical CTA doctrine for cold copy (operator `/goal`, 2026-07-07). Every other skill that touches CTAs (`cold-email-copy-best-practices.md` CTA Standards, `/personalization-subagent-pattern`, `/lead-magnet-brainstorm`, the List Gate, the Offer Architecture gate) points here; state it once, here, and reference it elsewhere.

**The booked call is always the real goal.** Every CTA is just a low-friction way to earn the first "yes". Once a prospect replies yes, the reply routes them to the real next step (the Delivery Message rule below governs exactly how). This is honest friction-laddering, never bait-and-switch. Whatever the CTA names (an asset, a look, a conversation) must be real, and every yes it produces must be honored as promised (the Confirmed Deliverable Gate and Capability Truth, Hard Rule 28, still bind). Aaron himself warns against opening with deceit, so the low-commitment yes earns attention with a genuine offer behind it, then earns the call one refusable rung at a time (doctrine §11). Judge it on meetings, not replies (operator-approved Aaron alignment, 2026-09-21): report time-agreed replies per 1,000 first touches beside positive-reply rate, because a reply and a booked call are different things (doctrine §0, §2 step 5), and a lift in positives with no rise in time-agreed replies is farming interest, not a winner (doctrine §4).

**The Delivery Message: no pitch when the asset carries the gap (HARD RULE, 2026-07-17); the reply splits by offer type (Aaron process alignment, operator directive 2026-09-22).** This governs the message that goes out *after* a prospect replies yes, and it is conditional by design (operator decision, 2026-07-17). The first two branches below govern a **promised asset** (a real magnet, something we send); the last two govern a **direct, trial or service offer** and the qualification step for costly front ends. For a promised asset, read `offer.lead_magnet_gap` from `client-profile.yaml`:

- **Gap present (a real magnet with an unresolved motive, per the Next-Step Gate in `/lead-magnet-brainstorm`): the delivery message delivers the promised asset first, with no pitch, no proposed time, no calendar link, and no booking gate (operator-approved Aaron alignment, 2026-09-21).** Send the thing, in Aaron's own shape from his July 13 2026 video (examples §7.3; doctrine §11): "Great first name, here's a link to the results or tool." then the link, then "Curious to get your take on it." The house template adapts his line: `Great {{first_name}}, here's the link. Curious to get your take on it.` (attribution restored, operator-approved Aaron alignment, 2026-09-21; it was labeled a house example). The next step is not deleted. It stays present one layer down and refusable, which is what Aaron actually does: no second calendar link, because he doesn't want to "force-feed them the calendar", just the pointer that the "calendar's on the next page if you think there's interest" (examples §7.3; doctrine §11; ledger R03, the only outright reversal in his ledger). So the next step lives inside the asset (its last page or closing section) or in the day 2-3 follow-up below, never as a demand in the delivery email. **His reasoning, attribution restored (operator-approved Aaron alignment, 2026-09-21):** per the same July 13 2026 video (examples §7.3, §8; doctrine §11), a call ask on the delivery means "you're inherently reducing the value of the thing that you're providing", so the prospect feels "they're getting caught in like a trapdoor"; his rule is "you don't want to add any sort of sales friction until they've actually consumed the value." An earlier 2026-09-21 pass labeled this reasoning house because the corpus lacked it at the time; only the gloss that the free thing "had a price" is house wording, not his. Doctrine §11 is explicit that the rule is not "no ask": deliver something of substance, and keep the next ask present but one step removed and refusable. The delivery reply is one of the four fulfillment-first artifacts written before the offer locks (doctrine §11; `/lead-magnet-brainstorm`). If the reply asks a question, answer it in one sentence and leave the loop open ("One sentence is almost always the better move", examples §7.3).

  **"No pitch on the delivery email" is NOT "no ask ever, by anyone": the follow-up is REQUIRED (2026-07-17).** This is the hole that made the rule dangerous as first written: it stripped the only ask in the funnel and specified nothing to replace it, which left "the prospect hits the gap and books a call on their own" as the mechanism. That is not a mechanism, it is a hope, and hope has no conversion rate. So a gap-present delivery is a **small cadence, not one email**, and all three parts are mandatory:
  - **Delivery (day 0):** the asset, no pitch, no proposed time, no calendar link; the next step sits one layer down and refusable. As above.
  - **Follow-up (day 2-3):** the ask, aimed squarely at the unresolved motive. Trigger on tool usage if it's tracked, otherwise on time. `Did the numbers look about right? The one thing it can't work out on its own is [the gap]. Should I run the real one for you?` This is where the next step gets asked for directly, *after* the value landed, in the shape of Aaron's post-interest subsequence: curiosity about the asset plus one refusable ask, with escalation to a call happening on their reply, not on a timer (examples §7.2). The day 2-3 timing is a house reading of an open question in his teaching (ledger R20), labeled house (operator-approved Aaron alignment, 2026-09-21). His July 13 2026 rule is "you don't want to add any sort of sales friction until they've actually consumed the value" (examples §7.3; doctrine §11), while his Apr 20 and Sep 14 videos have a rep call interested replies within 5 minutes (examples §7.2; ledger R20). House reading until the operator rules: trigger on tool usage wherever it is tracked, so the ask lands after the value is consumed; the time trigger is the fallback, and it can fire before the asset has been used. (Attribution restored 2026-09-21; the earlier short form "no sales friction until they've consumed the value" was a paraphrase that dropped his "actually".)
  - **Close (day 7):** one guilt-free out. `Should I run it for you? If it's not a fit, no hard feelings.`

  Name who sends it (the mailbox that delivered the asset), on what trigger, and on what day, in `copy.md`. **A gap-present sequence with no follow-up defined fails QA**: that combination is the "flood of yeses, no meetings" failure wearing the costume of the fix.

  **And name the number that proves it failed, before it ships.** As first written this rule could not fail: if no meetings came, the explanation was "they haven't hit the gap yet", which is unmeasurable and quietly blames the prospect. Set the kill threshold up front (the honest one: replies that reach the follow-up and still never take the next step), and if it misses, the gap was weak. K4 asks whether the gap is *real*; nothing else asks whether it is *motivating*, and a real-but-weak gap passes every gate and still produces nothing.
- **No gap (`lead_magnet_gap` absent or empty on a real magnet) (operator-approved Aaron alignment, 2026-09-21).** For a real magnet with no gap: deliver the asset first, then carry the next step in the same message as one soft, refusable pointer to where it lives. Never propose times in a delivery reply, whether or not the asset leaves an open question; the next step sits one layer down and refusable ("calendar's on the next page if you think there's interest", examples §7.3; ledger R03). No calendar link, and no offer to walk them through it on a call: that is his own counter-example in his July 13 2026 video (examples §7.3, §8), "if it'd be worth 30 minutes to chat, I would love to walk you through like X, Y, and Z and how it applies to you". Times go out only when the prospect asks to talk (explicit booking intent, doctrine §11). Without a gap, nothing else would carry the prospect to a call, so dropping the next step here just produces a polite dead end: the low meeting-to-lead ratio Aaron himself names for low-friction offers (doctrine §3 and examples §8, in his July 13 words, of magnets "with no natural progression to the next step": "so many people say yes to them, but you have such a low meeting to lead ratio") and the farming-interest failure (doctrine §4).
- **A direct, trial or service offer: two specific times plus the calendar (Aaron process alignment, operator directive 2026-09-22; supersedes the 2026-09-21 rule that a `direct_offer` yes was permission to share more and got times only on explicit booking intent).** This covers `lead_magnet: direct_offer` and any front end that is a trial, a pilot, or the client's or agency's service time, as opposed to a promised asset. Email 1 still closes with a permission CTA (ledger R17 retired the meeting ask), but the reply to the yes is short, answers any question in one sentence, and proposes two specific times plus the calendar, with no re-selling. Aaron, Sep 21: "Do you have some time available on X or Y? Here's my calendar", because "the call is the mechanism" (the same pattern in his Sep 14 and Apr 13 videos, examples §7.2). Every interested reply on these offers also gets a **call within about 5 minutes** (Sep 14, Sep 21), from the call script in `interested-reply.md` (`/lifecycle-copy`). The alert comes from the locked sending platform's interested-reply webhook where the platform offers one. The always-on receiver for that webhook does not exist yet, so until it does the reply sweep runs several times a day and the 5-minute call is a target rather than a mechanism; say so in the pre-Start report.
- **Qualification after the yes, for costly front ends (Aaron process alignment, operator directive 2026-09-22).** Where the front end is a trial, service time, or custom work and the locked offer carries `offer.qualification`, the reply routes the yes through a short, disclosed qualification form before the free unit is promised, and a prospect who does not qualify is offered the standard offer instead. Sep 21: "just because someone raises their hand doesn't mean you have to provide that free thing to them." Material eligibility is stated honestly in the offer itself ("for teams that fit X"), so the step is never a surprise. Cheap assets stay ungated and deliver-first, as above, and call timing on a plain asset request stays the house reading of Aaron's unresolved ledger R20 (the day 2-3 follow-up above). No blanket booking link goes on every positive.

**Every reply, gap or not, is matched to its intent and its offer type (doctrine §11).** Asset request: send it, plus only the input question delivery genuinely needs. Interested reply on a direct, trial or service offer: two times plus the calendar, the qualification form where `offer.qualification` applies, and the 5-minute call. Fit question: verified eligibility. Price question: a real price or the one variable needed. Booking intent: propose times. Referral: thank them and follow the referral. Objection: answer it in one sentence. Opt-out: stop. Never classify every positive word as a sales-qualified lead. Reply speed, the call script, and the post-interest subsequence live in the reply-agent setup skill for the locked sending platform and `/lifecycle-copy` (examples §7.2). The cold-sequence link and calendar bans (Hard Rules 14 and 15) cover the cold steps only; warm replies follow these reply rules.

The rule is the causal logic, not the surface tactic. **Never strip the delivery ask without a real gap in place**: that combination is the worst of both worlds, and it is the specific mistake this rule exists to prevent. If a magnet has no gap, the fix is to give it one (or drop it for the direct offer), not to go quiet at delivery and hope.

**The open-loop chain: every step sells only the NEXT step (the spine under all of this).** The chain is Aaron's own, gap links included (attribution restored, operator-approved Aaron alignment, 2026-09-21), from his July 13 2026 video (doctrine §9, §11): "The only thing that you have to think about is selling the next step." Each step builds curiosity for the next ("The whole point of the first line is to build curiosity to get to the CTA"), up to "The whole point of the lead magnet is to build curiosity to get them to book that call", and the asset opens the gap the call closes: "this creates the gap. You solve the gap with the book call." It also rests on his three goals in order ("getting opened, getting read, and getting responded to", doctrine §9), his open loops (doctrine §10), and his sales funnel inside the campaign (doctrine §11). What is house is the Next-Step Gate that enforces the gap link (`/lead-magnet-brainstorm`). It is the simplest way to keep a sequence honest about what each part is for. The subject's only job is to earn the open. The first line's only job is to get them to the CTA. The CTA's only job is to get the yes. The asset's only job is to open the gap. **The gap's job is to make the call the obvious answer.** Nothing in the chain tries to do the job of a later link: an E1 that tries to sell the call is skipping three steps, which is why pitch-first copy fails. Each link closes the loop the one before it opened, and opens the next.

**Order of preference for the ask (offer-first, lead magnet optional):**

1. **Framework A soft permission CTA (the Email 1 default; operator-approved Aaron alignment, 2026-09-21).** State the free deliverable (and the scope disclosure when it reflects the real process), then close with one soft permission question: by default `Would that be worth sharing more?`, with the full whitelist at Hard Rule 32. The ask is permission to send or show something, not a meeting (ledger R17). Do not use a statement-only `Just reply "Yes"...` close in Email 1: the default close is one soft permission question, a CTA-free Email 1 runs only as the labeled no-CTA test arm, and a soft conditional statement close ("... if you're open to that kind of thing", Sep 21) runs only as its own labeled arm (Aaron process alignment, operator directive 2026-09-22).
2. **Easy-yes opt-in naming a real asset (follow-ups or post-reply only).** `Just reply "Yes" and I'll [send it over].` remains valid after the initial cold touch when the channel step's own rules allow it. It is not a compliant Email 1 close under Framework A.

**Which shape leads: the deliverable-first conditional for a free deliverable, the outcome conditional with its risk term for a trial, pilot or pay-on-result offer (operator-approved Aaron alignment, 2026-09-21; the asset-strength rule REFINED 2026-07-17; offer-type split, operator decision 2026-09-23, Aaron pre-launch gap audit).** For a free-deliverable offer, the default Email 1 sentence is a conditional wrapped around a free concrete deliverable (`if we could [deliverable] at no cost ...`, the Framework A anatomy above). The sentence shape follows the offer type (operator decision 2026-09-23, Aaron pre-launch gap audit; Aaron Sep 7, Sep 14, Sep 21). For a free deliverable, deliverable-first stays the default (his measured winner; Sep 7, "if we could [deliverable] at no cost ..."). For a free trial, a pilot or a pay-on-result offer, a conditional that names the outcome and pairs it with its risk term is the default, not an arm ("if I had a way to [outcome] ... and you only pay per [unit], would that be worth a quick test?", Sep 21; "if we could help you get [result] ... free for [x] days", Sep 14; doctrine §4, his Jun 29 script). Either shape may run the other as a labeled arm. The limits are unchanged: no proof claim on line one, no guarantee on the core service (pay only on a counted result is not a guarantee), and an outcome that is not a stretch (that last limit is the corpus's reading, not his words). Still banned: an outcome stated with no risk term, and the retired bundle of an outcome plus a named comparable and its number on line one (proof goes to the PS, one point). The comparable moves to one of two places: the deliverable's target (the prospect's own best client per contact, or the slice's case study, examples §1.5; Hard Rule 34) or the P.S.'s single proof point (doctrine §9, examples §6). In the deliverable default, the dream outcome is implied by what the deliverable contains (doctrine §4). The older lean, the "#1 conditional" with an outcome, a named comparable and its number on line one, is retired. It is archived at `outbound/_archive/aaron-alignment-2026-09-21/campaign-copywriting--framework-a-and-offer-first-standard.md`, together with the asset-announcement Email 1 that used to be quoted here as "Aaron's 589-positive-reply campaign". That email is Aaron's own copy, but not the client email behind the 589 replies: it is his demo for his own ROI calculator, onto which he translates the structure of that client campaign, from his July 13 2026 video (examples §1.6, `[AS-draft]`). Attribution restored (operator-approved Aaron alignment, 2026-09-21): the old label got the campaign wrong, and an earlier 2026-09-21 pass then wrongly called it not his. Verbatim from examples §1.6 (the raw transcript also carries a "[music]" caption tag inside it): "First name, I just ran a test of 10 million cold emails and 50,000 plus in meta ad spend to determine the most cost-effective way to scale in 2026. Do you mind if I send it to you?" (that CTA is also in examples §4). It is a demonstration, not a measured result (ledger R11): it shows the shape of the labeled asset-announcement variant below, and the portability rule applies (doctrine §9).

- **Asset-announcement Email 1 (a labeled variant, never the default).** An Email 1 that announces a real asset instead of wrapping it in the conditional runs only as a logged test arm or an explicit awareness-driven choice (the brief truthful context line that frames an asset, S13, doctrine §8). It must carry a true inherent-value anchor (Hard Rule 37), imply the outcome through what the asset contains rather than promise it (doctrine §4), and still pass the default anatomy's word band and single ask. A weak announcement (`I put together a short read on X`) never qualifies: it buries the value and farms low-intent replies.
- **No asset, or a thin one** (a short read, a generic overview, a PDF) → the deliverable-first conditional leads, and the thin asset becomes the risk-elimination P.S. or the Email 2 strip-back, never the Email 1 headline.

**Optional industry-level personalization of the announcement (truth-bound).** The claim can be narrowed to the reader's world (`...the most cost-effective way to scale [industry] in 2026`), which lands harder than a generic test. Aaron's own constraint binds here and is non-negotiable: **don't lie about the industry** (never claim an exact-industry case for a loosely similar one, doctrine §9). Only name it if the client has genuinely fulfilled for that industry and the underlying data genuinely includes it. This is segment-level, not per-contact, so it does not reopen retired per-contact copy personalization; and it names the reader's *market*, not the reader's *category label*, so the don't-label-the-reader rule still binds.

**Lead magnet optional (preference, not a ban).** A real free resource or lead magnet is welcome, especially as a follow-up mechanism (below); it is never promised unless it will exist by the time the first yes needs it. Building a real asset for the campaign's offer (a calculator, a list, a sample) is a legitimate offer, not a manufactured one (operator directive 2026-09-22; Aaron built his own ROI calculator for a campaign, 2026-07-13). What stays banned is a filler asset (a generic PDF, a thin report) made just to have one. When there is no real asset, the direct offer-led CTA carries the whole sequence. `offer.lead_magnet: direct_offer` (equivalently `none`) is a valid locked outcome (the exception, not the preferred one, per `/lead-magnet-brainstorm`), and the List Gate accepts a locked direct-offer CTA in place of a magnet. `/lead-magnet-brainstorm` may conclude "no front-end magnet, the direct offer is stronger" and that is a first-class result, not a gap.

**Rotate the CTA across the sequence: no two steps use the same CTA sentence (HARD RULE, checkable).** The sentence-rotation half is house, from the operator's own complaint. The old "same mechanism" half is replaced by Aaron's follow-up fork (operator-approved Aaron alignment, 2026-09-21). The failure case this fixes: the same CTA sentence on all three steps reads as a repetitive loop and gets ignored (the operator's exact complaint about a prior 3-step sequence). Each step earns its own distinct CTA sentence, and each follow-up takes one of Aaron's three directions (Sep 21 and examples §7.1; ledger R12, doctrine §11; Aaron process alignment, operator directive 2026-09-22, supersedes the two-direction fork):

- **Email 1 (offer ask):** one soft permission question, by default `Would that be worth sharing more?`.
- **Email 2 (strip back, a different value prop, or add to it):** if Email 1 carried the full offer, strip back to the same offer with a lower-friction ask (the friction ladder: the heavier ask first, the lighter one second, doctrine §11), for example `If it's easier, I recorded a 3-minute video showing exactly how this works. Mind if I send it over?` (house example, conforms). The follow-up CTA may also be a conditional statement with no question mark, as in Aaron's own Sep 21 Email 2 ("If it's easier, I can send over a quick video elaborating on how we ..."). Or lean on a different value prop or mechanism for the same offer. If Email 1 was already stripped back, take one of the other two: a different value prop, or add to it (pre-handle a real concern, add a benefit layer, add a risk reversal, or give the reason it is free).
- **Email 3 (a genuinely small market, roughly under 3,000 qualified contacts, or a tested arm):** another of the three directions, with a DIFFERENT CTA sentence again. Never a re-run of Email 1's or Email 2's line. It may run as a new thread with its own subject only as a logged arm (Hard Rule 18).

The check is mechanical: read the CTA sentences side by side. If any two are the same sentence, it FAILS (house). And any follow-up that repeats Email 1 (the same offer at the same friction, with nothing added and nothing stripped) FAILS: "they didn't swap up what the thing is that they were actually offering at any point" (examples §7.1). A lower-friction restatement of the SAME offer PASSES, because that is Aaron's preferred de-escalation (doctrine §11); the older "same mechanism = fail" test is retired for that reason. "Add to it" is NOT permission to repeat Email 1's CTA sentence: the offer can repeat, the CTA sentence does not.

**Worked example (the operator's exact complaint, then the fix).**

WRONG (same CTA on all three steps, repetitive, gets ignored):
- E1: `...Would that be worth sharing more?`
- E2: `...Would that be worth sharing more?`
- E3: `...Would that be worth sharing more?`

RIGHT (house example, conforms to Framework A; rotated CTA sentences, one thread, no invented magnet):
- E1 (offer ask, the one-liner shape): `If we could set up a working one-tap reorder page for you at no cost (we'd build it, load your products and test it; you'd only send your catalog), would that be worth sharing more?`
- E2 (strip back: the same offer at lower friction): `If it's easier, I recorded a 3-minute video showing exactly how the one-tap reorder flow runs. Mind if I send it over?`
- E3 (add to it: a risk reversal and what they keep; a small market or a tested arm only): `Worth noting the page is yours to keep either way, and the build stays on us until buyers are actually reordering through it. Should I put it together?`

The previous E1 (an outcome promise plus a named comparable on line one) and E3 (a company-name placeholder) are archived at `outbound/_archive/aaron-alignment-2026-09-21/campaign-copywriting--framework-a-and-offer-first-standard.md`. Aaron's own Email 1 shape is the examples §1.5 winner quoted above; his follow-up forms are quoted in the Follow-Up Sequence Framework below (examples §7.1).

**The 13 Questions Gate (Hormozi). HARD RULE at sequence and reply-path level.** Every campaign must have truthful answers to the thirteen questions a prospect may ask, but Framework A controls what appears in Email 1. Do not cram Layer 1 proof, identity, workflow, and status handling into the 25-to-35-word initial message. Carry those answers across the optional P.S., follow-ups, reply path, and sender signature.

- *Layer 1, Foundational (covered across Email 1, signature, optional P.S., and reply path):* (1) **Who are you?** name and company. (2) **Why me?** audience-offer fit. (3) **What do you want?** the specific free deliverable. (4) **Why should I believe you?** true proof when available. (5) **What do I do next?** the single soft permission question.
- *Layer 2: Friction (physical effort):* (6) **Will this change my workflow?** it plugs into their existing tools without chaos. (7) **Do I do the heavy lifting, or you?** done-for-you, not homework. (8) **What's the immediate micro-value just for replying?** an instant win or asset before any meeting (the free-first teardown / lead magnet), or, for a trial or performance-pricing arm, the arm's own risk-reversal term ("you pay nothing unless it works"), which Aaron keeps legitimate (doctrine §3). (9) **How much of my time will this cost?** compress the ask to seconds or a one-word reply.
- *Layer 3: Psychological (ego and status):* (10) **Will I look stupid or lose status if I reply?** the solution makes them the hero to their boss or team. (11) **Will this person spam me if I show interest?** give an easy, guilt-free out. (12) **Does this force me to admit my current system is a failure?** frame the problem as an external, blameless enemy, never their mistake. (13) **Are you trapping me into a high-pressure pitch?** a zero-pitch promise, purely data and value.

Before lock, confirm the sequence answers all thirteen and violates none: a line that creates status risk, implies spam, or blames the prospect fails. Source: Alex Hormozi.

**DOCUMENT the coverage, don't hand-wave it (HARD RULE, 2026-07-12).** This is a checkpoint list a cold email MUST answer, not a vibe. In `copy.md`, write a short table mapping each of the 13 questions to the exact line that answers it (see a prior client campaign's `copy.md` for the format). If a question has no line, the copy is not done: it is the most common reason copy reads vague. Common misses to check for explicitly: **#6 (will this change my workflow?)**: say it plugs in, no big project. **#11 (will you spam me?)**: an easy, guilt-free out in casual risk-elimination form, such as Aaron's "If it's not a fit, no hard feelings." (examples §5), never a line that names the non-reply or frames the sequence as a chase (doctrine §11; the older "I won't chase you" example is retired, operator-approved Aaron alignment, 2026-09-21). **#12 (does this say my system failed?)**: frame the problem as a blameless external enemy ("the process drifts on its own"), never the prospect's mistake.

Full method reference: `/ask-aaron` (`aaron-doctrine.md` and `aaron-examples.md`, including the rejection bank in examples §8); `first-wave-eric-defaults.md`; `cold-email-copy-best-practices.md` (Build the offer on the value equation, Opener Standards, CTA Standards).

---

## AI/API Routing: native Claude Code session (HARD RULE)

Final copy and phone scripts are **written in the native Claude Code session** (no-AI-API rule, operator directive 2026-09-22; this supersedes the 2026-06-17 "generated via the Claude API by default" directive, and its no-key fallback branch is gone because native is the path). A clean-packet sub-agent (the Agent tool, handed only the packet) is fine, and helps context hygiene on a long run. Write only from a clean research packet (schema: `/ai-model-routing`, Clean Research Packet: persona, account/business/technical context, verified signal plus evidence URL, pain, proof point, offer/CTA direction, constraints), plus three research fields: `buyer_language` (the verbatim buyer phrases this copy may borrow, each with its evidence ID, from the Language bank in `_research/pain-clusters.md`), `current_workaround` (what the buyer does today instead, from the cluster the offer arm answers), and `cluster_ids` (the clusters the offer arm answers, from its `offer.validation_arms` entry, or the primary's block). Do not feed the writer raw crawl output, tool logs, research scratch, or the raw evidence ledger. No outside AI provider, API key, router script, or list-workbench AI column drafts, briefs, or polishes copy at any stage.

Record the engine in `ai_copy_provider` (`claude-native`, or `claude-native (sub-agent)` when a clean-packet sub-agent wrote it). Routing never bypasses the Copy QA Gate below or the Required Guardrails above: the QA gate runs identically whichever of the two drafted the copy.

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
- **Edit in Aaron's order before any cosmetic pass** (doctrine §9, load-bearing; operator-approved Aaron alignment, 2026-09-21): 1) fix the offer; 2) remove unsupported facts; 3) make the output and the effort clear; 4) choose one next action; 5) remove filler; 6) only then apply word count, channel rules, and style. Then run his per-line QA loop: for every line, what job does it do and which fact supports it? Cut lines with no job and flag lines with no evidence.
- **Check every draft against the rejection bank** (`aaron-examples.md` §8 in the `/ask-aaron` skill, plus the weak-offer table in §9). If a line matches something he killed, apply the fix from that row before anything else. Where the fix is "Lead with the dream outcome directly" (his poke-the-bear row), apply it through the offer-sentence shape that fits the offer type, the deliverable conditional or the outcome conditional with its risk term (the boundary at Hard Rule 19), never as a bare outcome with no risk term, which he rejects (doctrine §4; operator-approved Aaron alignment, 2026-09-21; operator decision 2026-09-23, Aaron pre-launch gap audit).
- **Run his pre-send test** (doctrine §9): would I answer this? If "if I received that email, I definitely would not be answering it" is true of the draft, it is not done.
- **Aaron's kill-list is absent** (doctrine §9 "Banned openers and moves", examples §8): no "I hope this email finds you well" or "I know you're busy"; no introducing yourself or your company; no fake relevance or fit-anyone compliments; no asking for a proposal, pricing, or a meeting too early; no criticizing the prospect; no emojis; no storytelling or picture-painting before the offer; no deceptive subject framing; never "audit" as the offer word; no jargon or self-declared uniqueness; no hook-payoff mismatch; no question-form pain openers; no long essay emails; no loaded hypotheticals ("What if you could double revenue?"); no unverified problem assumptions ("Still losing money to X?"); no free offer that never says "free" or "no cost"; no metrics the buyer ignores; no robotic, template-shaped copy; no salesy sign-off ("Thanks for the time"); no opt-out line or spintax artifact in the body (the opt-out mechanics live outside the body and stay governed by compliance and the upload skill).
- Remove pressure language, promotional wording, fake urgency, and unsafe unsubscribe logic.
- Remove weak follow-up framing, follow-up-reference openers, generic openers, weak CTAs, and ego-triggering CTAs.
- Remove em dashes, double hyphens, and mid-sentence dash separators from sendable copy. (Aaron's own rule too: "no m dashes ever, that screams ChatGPT", doctrine §9.)
- Remove colon-as-runway sentences where `:` is used to stretch one sentence into a long list or multi-clause paragraph. Split the thought into short sentences instead.
- Remove comma-wrapped company descriptors such as `Company, descriptor, result`. Put the descriptor in its own sentence.
- Confirm Email 1 follows the Framework A default anatomy (Hard Rule 27; operator-approved Aaron alignment, 2026-09-21): no greeting word ("Hey", "Hi", "Hello" fail), and a first name is optional and may open the email; the free deliverable on line one, with "free" or "no cost" stated; the scope disclosure whenever it reflects the real process; one soft permission CTA; 25 to 35 body words and 2 to 3 body sentences, the declarative P.S. outside both counts (the one-liner shape may be a single sentence); an optional P.S. that is short and does exactly one job. Any departure is a labeled variant recorded in `copy.md` as a logged test arm or an awareness-driven choice. Email 1 carries three variants by default (`email_1_a`, `email_1_b`, `email_1_c`; more letters allowed), each of B and C changing exactly one variable against A, the control (Aaron process alignment, operator directive 2026-09-22). Follow-ups use their own forward-looking question (or conditional statement re-offer) and CTA-rotation rules.
- Confirm every CTA (and every line) keeps the prospect on top. For Email 1 the default is `Would that be worth sharing more?`, Aaron's signature ask (examples §4). Also accepted: his other variants from examples §4 (`Is that worth sharing more?`, `Mind if I send it to you?`, `Do you mind if I send it to you?`, and the two he writes without sentence case or a question mark, used here as `Worth sharing more?` and `Would that be worth sending over?`; for a free tool or trial, his July 13 and Sep 14 CTAs as scoped at Hard Rule 32, `Open to testing it for free?` and `Would you be open to trying it out?`; and, added by Aaron process alignment, operator directive 2026-09-22, `Would that be worth a quick test?` for pilot, trial and pay-per-result offers plus `Would that be useful?` and `Would that be helpful?`), and the house phrasings `Would that be worth hearing more?` / `Open to it?` / `May I send it over to you?` / `Can I send it across?` / `Would it help if I sent it?` (German `Darf ich es Ihnen schicken?`). One primary ask, never stacked asks (doctrine §9). The statement-only opt-in `Just reply "Yes" and I'll…` is reserved for later steps, because Email 1's default close is one soft permission question; the soft conditional statement close runs only as its labeled arm. REJECT and rewrite any `Want me to send…?`, `Want us to send…?`, `Want the link?`, `Did you want…?`, `Interested?`, `Let me know if you'd like…`, `Worth a look?`, a meeting ask such as "worth a chat" (examples §4, `[ANTI]`), or anything that reads as needy, presumptuous, scripted, sketchy, or like there is a catch.
- Confirm every CTA references a deliverable or next step with a named honorer for every yes: the agency by default, the client only with `lead_magnet_client_ok: yes` (Confirmed Deliverable Gate).
- Confirm every email ends with a CTA (a clear next step or question), including the follow-ups (Email 2, and Email 3 in a 3-step); no dead-end soft close that trails off with nothing to answer (Hard Rule 31). The one exception is the labeled no-CTA variant, run only as a logged A/B arm (examples §4). Follow-up CTAs are soft (a light re-offer, a forward-looking question, or a conditional statement re-offer such as "If it's easier, I can send over a quick video ...", Sep 21), never a repeated hard ask or a goodbye.
- Confirm each follow-up takes one of Aaron's three directions (Sep 21, examples §7.1; ledger R12, doctrine §11; Aaron process alignment, operator directive 2026-09-22): strip it back (a shorter email with a lower-friction ask), a different value prop or mechanism for the same offer, or add to it (pre-handle a real concern, add a benefit layer, add a risk reversal, or give the reason it is free); if Email 1 was already stripped back, take one of the other two. A lower-friction restatement of the same offer PASSES; repeating Email 1 FAILS; a vague "short note" FAILS. **Checkable no-repeat CTA test:** read the sequence's CTA sentences side by side; if any two are the same sentence, it FAILS (Hard Rule 21; the older "same mechanism" test is retired, operator-approved Aaron alignment, 2026-09-21). Each follow-up also passes the standalone test: it could be the first email read, it never names the non-reply, and it never assumes they scroll up (doctrine §11).
- Confirm every claim the copy makes about the client's own product or service maps to a real, deliverable capability. No invented features, integrations, tools, metrics, or results the client cannot fulfill (capability truth, Hard Rule 28). This is most important when copy is AI-generated at scale.
- Confirm the Proof-Asset Gate passed: any named client, case study, or exact number the copy leans on is real and on file. No vague stand-in ("a leading firm"), no unnamed placeholder where the angle needs a name, no invented metric, no silent omission of proof the angle needs. If a BLOCK-tier proof gap exists, copy for that angle is held and the fill-in form (proof-asset-request.md) routed to the client, not papered over.
- **Confirm every pain, objection or workaround line traces to the research** (`market-evidence-standard.md` section 13). Each one cites a cluster ID in `_research/pain-clusters.md` (recorded on the `copy.md` Research basis line), or is phrased as a genuine question the reader can answer either way rather than as a claim. The question branch never licenses what the kill-list above bans: no question-form pain opener, no loaded hypothetical, no unverified problem assumption ("Still losing money to X?"). A `model_hypothesis` (a model's persona research, or the client's unverified `buyer_pain_hypothesis`) never appears as a fact. No public quote from the Language bank is attributed to the prospect or presented as their own words: the copy borrows the buyer's phrasing as plain wording, and it never invents a statistic.
- Confirm the Offer Architecture gate passed before any Email 1 copy was written (SQL/MQL framing, the easy-to-say-yes and "why not?" test, the farming-interest check, named risk reversal).
- **WARN (does not block): the Next-Step Gate.** If `offer.lead_magnet_gap` / `offer.lead_magnet_next_step` are missing for a real magnet, emit a warning naming the client and carry on with the existing CTA behavior. Do NOT fail QA and do NOT block the copy. **Why this warns instead of blocking:** the fields were introduced 2026-07-17 and are populated on zero existing clients, while 7 of 8 have a real locked magnet, so a hard gate here would fail nearly the whole client book on a defect never observed in any of them. The requirement is real but it belongs UPSTREAM at magnet-selection time (`/lead-magnet-brainstorm` → the Next-Step Gate), not at copy time on legacy profiles. Backfill the existing clients at their next campaign refresh, not retroactively. Not applicable to `lead_magnet: direct_offer`.
- Confirm the **reply after a yes follows Hard Rule 36, split by offer type** (Aaron process alignment, operator directive 2026-09-22). **Promised asset:** the asset is delivered first, with no pitch, no proposed time, no calendar link, and no booking gate, whether or not the asset leaves an open question (operator-approved Aaron alignment, 2026-09-21). When `lead_magnet_gap` is set, the next step sits one layer down and refusable (inside the asset, or in the day 2-3 follow-up). When it is absent, one soft, refusable pointer to the next step rides the delivery ("calendar's on the next page if you think there's interest", examples §7.3). Times go out only on explicit booking intent, never in an asset-delivery reply, and the next step is never stripped without a real motive in place (doctrine §11, examples §7.3, ledger R03). **Direct, trial or service offer** (including `lead_magnet: direct_offer`): a short reply that answers any question in one sentence and proposes two specific times plus the calendar, with no re-selling (Sep 21), plus the 5-minute call from the script in `interested-reply.md`. **Costly front end with `offer.qualification`:** the disclosed qualification form sits between the yes and the free unit, and the offer states the eligibility up front; cheap assets stay ungated. (Supersedes the 2026-09-21 check that a `direct_offer` reply proposed no times.)
- Confirm a **gap-present sequence defines its follow-up** (Hard Rule 36): the day 2-3 ask aimed at the unresolved motive, and the day 7 guilt-free close, with sender + trigger + day named in `copy.md`, plus the kill number. A pure-value delivery with no follow-up FAILS: it strips the only ask and replaces it with hope.
- Confirm any **asset-announcement Email 1** runs as a labeled variant, never the default, and earned its slot (Hard Rule 37): it carries a true inherent-value anchor, and it implies the outcome through what the asset contains rather than promising it (doctrine §4). Without the anchor, the deliverable-first conditional leads instead.
- Confirm the **inherent-value anchor is true and correctly slotted** (Hard Rule 37): it prices the asset, is not inflated (scale, spend, price, industry coverage), and does not stand in for the Concrete #3 outcome number.
- Confirm the new-thread Email 1 opens with an OFFER-LED opener (leads with the offer itself), never a vague self-introduction or a homepage summary. (Question-first / diagnostic-mirror openers are retired with proven-mode; see the Offer-First Copy Standard. The relevance question opener is a different thing and runs only as a labeled variant, at any awareness level, literally relevant and implying no relationship (Aaron process alignment, operator directive 2026-09-22); question-form pain openers stay banned.)
- Confirm the sequence and reply path answer the **13 Questions Gate** without cramming the answers into Email 1. Framework A controls Email 1; proof, workflow detail, and status-risk handling may move to the optional P.S., follow-ups, or reply path. No line creates status risk, implies spam, or blames the prospect.
- Run the Shared-Asset Platitude Read (defined below) before lock: a forced skeptical pass over each shared Email 1 variant (the offer sentence, the scope disclosure, the P.S., and the CTA) and each follow-up body. Revise any asset that reads as vendor wallpaper or a forced hook.
- Confirm no observational opener phrases appear ("I noticed", "I saw that", "Congrats on", "I stumbled upon", "I came across", "I wanted to reach out").
- Confirm no dumb personalization: the copy never names the contact's job title or role ("As CTO…", "for a Founder like you") and never echoes a raw data field as surface mail-merge ("I see you're in SaaS", "based in Berlin"). Offer-first copy is the clean shared offer-led copy for everyone (`{{first_name}}` optional; the company-name variable is not a default, examples §8), plus at most two per-contact variables inside the offer sentence (`{{sells_to_vertical}}`, `{{service_offered}}`, `{{own_best_client}}`, Hard Rule 34), each sourced and never read back as an observation ("I see you sell to X") or as surveillance; observational per-contact copy personalization stays retired.
- Confirm any **competitor name or public customer complaint in the body is SLICE-SHARED, not per-contact** (Hard Rule 38). All three bounds are checkable: the fact is true of every contact in the slice (if not, the slice is wrong, not the copy); it rides inside the offer sentence or the P.S. and never opens the email (Hard Rule 19); and no line refers to it as this reader's own ("I saw your review from Mary"). A campaign targeting "customers of Competitor X" may name X in one shared body. This does not reopen per-contact copy personalization, which stays retired.
- Confirm no fake-familiarity or warmup phrasing appears in any email or follow-up (no "hope you're well"/"hope this finds you well", "just checking in"/"following up"/"following up on my last"/"circling back"/"touching base"/"bumping this"/"just nudging", "did you see my last email", "Are you the right person to send it to?" outside a named enterprise case (examples §7.1), "I wanted to reach out"/"connect", unearned flattery, any phrase implying shared history, or any warmup before the first relevant line; Hard Rule 30).
- Confirm the first two lines of every email and follow-up pass the said-out-loud test: they carry a point of view and/or spoken rhythm and sound like a real person, not a brochure or textbook. Follow-ups stand alone: each could be the first email read, and none references the earlier email or names the non-reply (doctrine §11, Hard Rule 30).
- Confirm the signature is not baked into any email body or CSV column; it belongs on the sending-tool step (template path: in the step body; pre-written path: appended below the `{{email_*}}` variable).
- Confirm the subject line of Email 1 is a clean shared template on the step: 2 to 4 words, lowercase, 0 to 2 variables, spam-checked, credible in isolation, and never deceptive (no fake "FW:", thread, emergency, invoice, or account fault; doctrine §9). "your [the offer's own object]" and `fyi {{first_name}}` pass (Aaron process alignment, operator directive 2026-09-22). Per-contact subject columns remain retired. The threaded follow-ups carry no subject; only a final follow-up planned as the logged new-thread arm carries its own subject (Hard Rule 18).
- Confirm every email is formatted as short blocks separated by blank lines, not one dense paragraph (Hard Rule 25). Email 1's default is the offer plus CTA as one block, with an optional P.S. as its own block. Only the labeled two-line relevance or pain-first arm puts a relevance or pain line in its own first block, and a pain line never shares a block with the offer and CTA. Applies to every email, not just Email 1.
- Confirm no cold email opens on a greeting word ("Hey", "Hi", "Hello"; doctrine §9). A first name may open the email (examples §1.1, §1.3). Right after a `{first_name},` the next word is lowercase unless it is a proper noun (Hard Rule 29), with no mid-sentence capital like `Name, Each ...`. In the pre-write column model the name is baked into each `email_*` body, so scan the columns, not just the step.
- Confirm grammar is clean and every sentence reads naturally aloud, with no awkward over-compression, dropped connective words, run-ons, or comma splices. A deliberate spoken sentence start ("thinking I could ...", "asking because ...") passes when it reads naturally aloud (Hard Rule 26).
- **Offer-first is the only copy mode (proven-mode retired 2026-07-05).** Write Framework A for every Email 1: the default anatomy (Hard Rule 27), offer-led, the scope disclosure whenever it reflects the real process, one primary ask, minimal personalization, and a soft permission close. There is no `copy_mode` / `offer_market_proven` branch anymore; a residual value on the campaign is ignored.
- Confirm Email 1's body (the P.S. excluded) sits in the default 25-to-35-word band: a longer version only as a logged A/B arm for a solution-aware or saturated market (ledger R07); a body a little under 25 only if it still carries the whole offer, never so short it reads like a bump (doctrine §9). Keep follow-ups under 50 words (house), with the same spec as Email 1: short, standalone, conversational, one clear CTA (doctrine §11). In offer-led copy "we" is fine when it states the sender's real workload or team capability, which is how Aaron's own offer sentence and scope disclosure read (Hard Rule 33).
- Confirm the proof rule (doctrine §9, examples §6): at most one proof point, never in lines one or two, in the P.S. or deferred to Email 2; a near-twin, same-mechanism case in plain named numbers with no acronyms; never generic ("we've worked with hundreds of clients"), never Aaron's own totals presented as ours, never an exact-industry claim for a loosely similar case, and a P.S. never contradicts the body.
- Confirm the sequence is ONE thread with 2 to 3 steps (Email 1 plus one or two same-thread follow-ups): 2 by default at every TAM size, 3 only in a genuinely small market (roughly under 3,000 qualified contacts) or as a tested arm. A final follow-up as a new thread with its own subject appears only as a logged arm, planned in `copy.md`, within the three-touch cap. No Email 4 (Hard Rule 18).
- Keep wording plain, specific, and recipient-centered.
- Confirm variables use `{{double_braces}}`.
- Confirm the markdown copy and YAML copy match exactly.
- Run a literal scan on final `variants.yaml` after serialization for em dashes, banned formatting/CTA/opener phrases, and unsafe phrases. If a sendable variable name reads as awkward or scraped-looking, rename the variable and update the list/enrichment schema before upload.

Provider note (copy-QA tiering; no-AI-API rule, operator directive 2026-09-22): **default QA is rule-based** - `spam-word-checker.md` + `cold-email-copy-best-practices.md` + the rule checklist above, run in the session. There is no cheap-model pass and no outside-model API pass for copy QA. Escalate to a deeper audit (a fresh Claude sub-agent with a clean context, handed the copy, the packet and the audit list below, plus the `advisor` tool when the session has one) ONLY when the stakes justify it: high-ticket campaign, risky/unsupported claim, unclear evidence, strategic campaign, or client-facing deliverable. The audit checks: spammy wording, unsupported claims, weak CTA, too much hype, bad personalization, proof/claim mismatch, unclear pain, too long, too salesy, and copy that does not match the buyer's own language (checked against the Language bank in `_research/pain-clusters.md`). Whatever model runs, `spam-word-checker.md` and `cold-email-copy-best-practices.md` remain the source of truth and the final gate - no AI substitution removes these two guardrail passes.

If a campaign needs a term that the spam checker bans, ask the user for explicit approval before using it. Otherwise, rewrite.

### Shared-Asset Platitude Read (forced pass, before lock)

A campaign's whole list inherits a tiny set of shared copy: each Email 1 variant (the offer sentence, the scope disclosure, the P.S., and the CTA) and each follow-up body. Per-account trigger openers and the situation-line opener (the `situation_line` variable) no longer exist in Email 1 (Hard Rules 19 and 34). Those few assets carry the entire campaign's blast radius. Before locking copy, run one forced skeptical read over them. This is a discipline gate, not a quality oracle: its only job is to stop a dead, vendor-wallpaper asset from shipping to the whole list. (Scope updated under the operator-approved Aaron alignment, 2026-09-21. The old opener-and-trigger scope is archived at `outbound/_archive/aaron-alignment-2026-09-21/campaign-copywriting--copy-qa-gate-and-steps.md`.)

**Scope: NOT per contact.**
- The shared assets every contact inherits: each Email 1 variant's offer sentence, scope disclosure, P.S., and CTA, and each follow-up body.
- Each shared asset is ONE asset to read once, no matter how many rows share it. Never run this per row across the full list; that is the per-contact cost the design deliberately avoids.

**The read: a platitude / weakest-line test, never a reply prediction.** Ask it of each asset: "Is this deliverable specific and true enough that no other vendor could send it to any list (Aaron's company-swap test, doctrine §8)? Name the one line a busy {persona} mentally deletes on." Output per asset: the weakest-line callout plus a verdict, earned vs vendor wallpaper. The whole-email question, Aaron's pre-send test ("would I answer this?", doctrine §9), runs separately in the Gate Requirements above; this read only finds the weakest line.

**Engine and its ceiling.** Run inline in the Claude Code session (no extra spend). This is same-model grading (Claude reading Claude's own copy), the agree-with-itself weakness the rest of this gate already lives with. It is acceptable HERE only because the bar is platitude detection: forcing the read to name the single weakest line and say what is generic or forced about it catches a platitude even same-model. Do NOT trust this read for anything subtler than platitude / forced-hook detection, and never present it as a reply-rate predictor.

**Action and status.** If an asset reads as wallpaper or a forced hook, revise that one asset, re-run the spam-word + best-practices checks on the new wording, then proceed. "Passed the read" is NOT "solved": record the shared Email 1 as a hypothesis pending real reply data, judged on time-agreed replies beside positive replies (doctrine §2 step 5), never as a win. An arm (or an in-campaign copy variant) is read once it has reached its ~1,300 first-touch floor AND its last contacts have had the 2-email sequence plus a few days of grace (about 7 to 10 days from their first touch). Never read early because a window passed (Aaron process alignment, operator directive 2026-09-22; supersedes the fixed ~21-day window, which this line used to state as "~day 21"). The read rules live in `/experiment-design`. The value here is discipline on the highest-blast-radius asset (a forcing function against a rushed rubber-stamp), not superior judgment.

---

## List Gate (verified slice required before any sendable copy)

The list drives the message. So this skill must not produce sendable copy or write `variants.yaml` until the **verified-list gate** passes for this campaign slice (canonical definition: `verified-list-gate.md`). All three must hold:

1. **Verified slice**: `profiles/<business-slug>/campaigns/<campaign-slug>/leads.verified.csv` exists and is non-empty (from `/email-waterfall`). **"Verified" is a hard standard, not "an email exists":** every sending email must be **third-party email-verified AND catch-all verified**, and every row must carry a **real first + last name** (the `/email-waterfall` Verification Doctrine). That standard is met EITHER by verify-first on an email the row already had (the email verifier: verify + catch-all in one call) OR by a waterfall enricher finder run (which delivers both at once). A waterfall is one valid path, not a universal requirement. Index/pattern-derived emails, fabricated-name rows, or a list that only passed a bare verifier with no catch-all check do NOT satisfy this: route back to `/email-waterfall`. Confirm `email_status = valid` on every send row (catch-all/risky live in `leads.review.csv`, never the send file).
2. **List grade:** that slice passed `/list-quality-scorecard` at grade **B or better and a list-QA PASS** (`verified-list-gate.md`).
3. **Locked strategy:** the campaign is a selected row in `campaign-strategy.md`, its `lead-source-plan.md` exists, `client-profile.yaml` `offer.lead_magnet` is locked (a real magnet, OR the `direct_offer` sentinel when the offer-first play uses a direct offer-led CTA and no magnet, per the CTA Hierarchy), and `run_state.sending_platform` is locked.

If any condition fails, **STOP**: name the failed condition and route to its producer (`/email-waterfall` → `/list-quality-scorecard`, or `/campaign-strategy` / `/lead-source-strategy`). Do not write speculative or placeholder copy "to be filled once the list is ready"; you cannot write the message before the verified list exists. Autonomy never relaxes this (it is a hard-stop in `/autonomous-execution-policy`). The only exception is an explicit operator override for a re-run on an already-verified external list.

---

## Confirmed Deliverable Gate

Before writing any CTA, confirm the prospect can receive exactly what the CTA offers after a positive reply.

**Whose yes this is (operator directive 2026-09-22).** This gate governs the **front-end** deliverable: the lead magnet, the free asset, the front-end promise. It asks one question: *can every yes this campaign will actually produce be honored as promised, on time?* Read the offer's honoring fields (`/lead-magnet-brainstorm` Save Output; for a client with per-buyer-type offer sets, the campaign's offer comes from its segment's entry in `offer.segments`):

- `lead_magnet_yes_honored_by: agency` (the default: the agency owns inboxes, sending, replies and front-end delivery; the client receives qualified conversations and delivers the paid service). The agency honors the yeses itself, including custom per-prospect work, at the volume this campaign will send. In the first wave each offer runs as an equal cell of the whole qualified TAM (`/campaign-strategy`), so this passes once the delivery path below is known and the offer's lock record carries a scale note or an `offer.qualification` rule that covers that cell's yeses (Aaron process alignment, operator directive 2026-09-22; supersedes "a test flight produces a handful to a few dozen yeses per offer"). It needs no client approval.
- `lead_magnet_yes_honored_by: client`: passes only when `lead_magnet_client_ok: yes`. At `pending` or `no`, do not write send-ready copy for that offer; write the other offers in the flight. Never write copy for an offer the client vetoed.

Full-volume capacity is not this gate's question. At offer lock each offer records a scale note or an `offer.qualification` rule (`/lead-magnet-brainstorm`); the winner scales to the rest of the TAM immediately, and the client's capacity answer after the test sets how many qualified yeses get the free unit per week, capping sends only where the client itself supplies the deliverable (their trial seats, their people, their stock; `/offer-test-slate` scale-review mode is a results report, never a volume gate). (Aaron process alignment, operator directive 2026-09-22; supersedes "`/campaign-strategy` sizes scaled volume to the answer".) This gate used to ask whether the agency could deliver "at reply-scale, to every positive responder", which stopped per-prospect and client-dependent offers before they were ever tested; that wording is archived at `outbound/_archive/offer-limits-removal-2026-09-22/`. Back-end product/service capability is the separate Capability Truth gate (Hard Rule 28) below. Canonical rule and the optional `service_model.front_end_owner` override: `/lead-magnet-brainstorm` -> Test First, Ask About Scale After.

Allowed deliverable categories:

- In-body observation: the email already contains the useful observation, and the CTA offers a short follow-on note.
- Public case study or reference: the named customer, metric, or proof point is publicly available or client-approved.
- Conversation: the sender can book a real call through the approved calendar workflow after a positive reply. It is a next step after a yes (one layer down, or on explicit booking intent), never Email 1's ask (ledger R17; operator-approved Aaron alignment, 2026-09-21).
- Company-specific note: the operator can produce the note manually or through the approved enrichment workflow.
- Confirmed asset: the client has explicitly confirmed the asset exists and can be sent.
- Client-honored offer with the client's OK on file (`lead_magnet_client_ok: yes`): the client has agreed to honor the yeses this campaign produces (a trial, product access, a term they stand behind, their people's time).
- Operator-producible deliverable: the agency can produce it for every yes this campaign will produce, from data it can actually get. Per-prospect production work planned in the offer's fulfillment plan (`lead-magnets.md`) counts, and an offer the agency honors needs no client approval.

Hard stops:

- Do not promise audits, scorecards, benchmarks, ROI estimates, teardown documents, or reports until the data, method, and delivery path are confirmed. The agency confirms this itself (it knows where the data comes from and has produced one real example); the client's approval is not required for an offer the agency honors.
- If the deliverable is uncertain, fix the offer (doctrine §2); never downgrade Email 1 to a meeting ask (ledger R17). Fixing it can mean swapping in a deliverable that is confirmed; what is retired is the old fallback of downgrading the CTA to a conversation (operator-approved Aaron alignment, 2026-09-21).
- Record the deliverable category in Step 3 before writing final copy.

---

## Proof-Asset Gate (collect missing proof before writing copy that needs it)

Sibling to the Confirmed Deliverable Gate above and to Capability Truth (Hard Rule 28), and a distinct rule. Do not blur the four:

- Capability truth (Hard Rule 28): never claim a product capability the client cannot deliver.
- Confirmed Deliverable Gate: never promise a CTA deliverable you cannot fulfill after a positive reply.
- Proof-asset gate (this rule): never write copy whose credibility needs hard proof (a named client, a real case study, or an exact number) you do not have on file. Collect it first.
- **Artifact-Truth Gate** (`/lead-magnet-brainstorm`): never ship a model-generated, per-company artifact under the client's name unless its claims trace to real sources, it is framed as a work sample rather than an analysis, a human has reviewed the first 20, and it discloses what it is. **Note the axis these four split on.** The first three all test what you **say**; the fourth tests what you **hand over**, which is why it is not covered by the other three and why it needed its own gate. It fires only on per-company *generated artifacts* (an AI-built report, teardown, ABM list, sample deliverable), never on archetype K tools or on a per-contact copy line. If the campaign ships no such artifact, it does not apply.

When an angle references a named client, a case study, or an exact metric that is NOT on file (`social-proof-bank.md`, `client-profile.yaml`, `offer-intelligence.md`, an approved artifact, or the intake), be blunt about the gap and collect the real proof from the client. Check `social-proof-bank.md` first: a segment-matched `proof_status = on_file` row already carries the real result and a copy-ready `one_liner`, so the gate passes; a `gap_block` row for that segment is the gate firing (its raw-fact request may already be PENDING with the client via `/proof-asset-request` bank mode). Do not cover it with vague wording ("a leading firm", "significant results"), an unnamed stand-in where the angle needs a name, an invented number, or a silent omission. Decide the tier on one question: is the angle hollow without this proof, or just less strong?

- BLOCK (hollow without it): the angle's credibility hinges on the missing proof. Emit the fill-in form (`proof-asset-request.md`), route it to the client, and do not ship hollow copy for that angle. Switch to a different angle the on-file proof already supports, or ship the slice's offer-led version without the proof line (the offer carries it, doctrine §9) and add the proof-led angle when the proof returns. Never hold a whole slice's offer test waiting on the client's proof (operator directive 2026-09-22).
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
- `profiles/<business-slug>/_research/pain-clusters.md` (from `/market-evidence`): the pain clusters and their **Language bank** (3 to 8 verbatim buyer phrases per cluster, each with its evidence ID). The first place to look for the buyer's own words. Four places draw their wording from it: the offer sentence, the P.S., Email 2's objection job (a pre-handled concern, Hard Rule 21), and the pain line of the labeled pain-first arm. The offer arm's `cluster_ids`, `evidence_ids` and `pain_angle` (`offer.validation_arms` in `client-profile.yaml`, or the primary's block; per segment in `offer.segments` when the client has per-buyer-type offer sets) say which clusters this campaign's copy answers. Every pain, objection or workaround line traces to a cluster here or is phrased as a question (Copy QA Gate), so the pain-first arm runs only on a cluster: its pain line opens the email, and a question-form pain opener stays banned.
- `profiles/<business-slug>/offer-intelligence.md`: its **First-Party Buyer Voice** section (the buyer's words from the client's own won and lost calls) and that section's **Offer language rewrite** line (the buyer's words the offer should adopt, and the client jargon each one replaces). Same four uses as the Language bank.
- With no `pain-clusters.md` yet (a client whose research predates the evidence ledger), the missing research routes to `/offer-intelligence` Step 0, which seeds the ledger from the legacy research files, then to `/market-evidence` synthesize. It never holds the offer-led copy, which carries no pain line by default; until the clusters exist, any pain, objection or workaround line is phrased as a question.
- `profiles/<business-slug>/social-proof-bank.md` (from `/social-proof-bank`): the client's copy-ready proof + trigger bank. The **first** place to look for a segment-matched proof line (its `one_liner`); a `proof_status = on_file` row is ready evidence, a `gap_block` row is the gate firing. (The `poke_the_bear` diagnostic-mirror opener it also holds is retired with proven-mode; use only the proof.)
- `profiles/<business-slug>/campaigns/<campaign-slug>/lead-source-plan.md`: **required** when producing sendable copy (the List Gate's locked-strategy condition), not optional
- `profiles/<business-slug>/campaigns/<campaign-slug>/leads.verified.csv` + the slice's `/list-quality-scorecard` result: **required** (the List Gate); the verified slice is what the copy is written for

Treat saved campaign artifacts as the source of truth over chat memory. Do not drift away from the locked offer, lead magnet, proof constraints, or campaign role unless the user explicitly changes them.

If given only a website, research it before Step 1.

If information is missing but the work can proceed with a reasonable assumption, state the assumption. Ask only when the missing context materially changes the campaign.

---

## Offer Architecture (complete before writing Email 1)

Run this gate before Step 1 produces any direction and before a single line of copy is written. Offer selection happens upstream in `/offer-intelligence` and `/lead-magnet-brainstorm`; this is the copy-time confirmation that the locked offer is actually sendable. If you cannot answer all three questions cleanly, the offer is not ready. Fix the offer first. Sequence structure and copy quality cannot compensate for a weak or high-friction offer. Walk Aaron's diagnostic top-down and stop at the highest broken item (doctrine §2): 0) the buyer is real and specific; 1) the offer is a concrete thing (what they get, how fast, what they must do, what risk they take), not a company description; 2) every yes it produces can be honored (the agency honors test yeses by default, a client-only offer needs the client's OK, and full-volume capacity is asked after the test in `/offer-test-slate`); 3) only then, the copy leads with the offer and every word is true; 4) one easy next step, with each follow-up earning its place; 5) it is judged on the right number, never reply count alone.

**Frame it on the value equation and the Four Concretes (offer-first, HARD).** Before the three questions below, confirm the offer is built on the value equation ((dream outcome × perceived likelihood) ÷ (time × effort)) and that the locked offer names Four Concretes #1, the specific deliverable (the one-line offer), which is the only one required. The other three, (2) the differentiator, (3) a quantified outcome number, and (4) the named recognizable proof plus its number, are captured when they exist and never required (operator decision 2026-09-23, Aaron pre-launch gap audit). A missing concrete is handled two-tier like the Proof-Asset Gate: hollow-without-it → hold the angle, fire the proof-asset request, ship an honest interim that describes the outcome without a fabricated number; would-only-strengthen → flag, ship the concrete-as-possible version, upgrade when it lands. Never invent the number. Apply the equation Aaron's way (doctrine §4): the outcome is implied through the deliverable, likelihood rises by shrinking what is judged, time collapses with a date-certain free deliverable, and effort shrinks to one act. The reader must be able to answer what's in it for them, how long it takes, and what they have to do. Full definition: the Offer-First Copy Standard above and `cold-email-copy-best-practices.md` → Build the offer on the value equation.

**Question 1: SQL or MQL framing?** SQL (Sales Qualified Lead): the prospect commits to a sales conversation. Higher friction. Use when the offer is naturally easy to say yes to, with clear pain, obvious ROI, and low switching cost. MQL (Marketing Qualified Lead): the prospect raises their hand for a resource, deliverable, or insight. Lower friction. Use when the offer requires behavior change, a crowded market, or a long sales cycle. If unsure, default to MQL framing. You can escalate to SQL after they engage.

**Question 2: Easy-to-say-yes-to test, plus Aaron's "why not?" test and the farming-interest check (operator-approved Aaron alignment, 2026-09-21).** Read the offer out loud. Would someone say yes to this on a busy Tuesday afternoon without needing to ask their boss? That is his "why not?" test (doctrine §4): if the reader pays little, does little work, and genuinely wants the thing, why wouldn't they say yes? Then the farming-interest check: is it "specific enough to filter out those who don't and compelling enough to pull in those that do"? A broad question anyone can say yes to fails, however easy it is. If it fails, chunk DOWN: name a specific, concrete deliverable that is interesting on its own and speaks to the end result the buyer wants. Never chunk up into a service description or a bare outcome promise with no risk term ("we help [ICP] increase [outcome]"): that is his named weak offer, a description of the service instead of the result (doctrine §6). An outcome conditional paired with its risk term is a different thing: the default for a trial, pilot or pay-on-result offer and a labeled arm otherwise (doctrine §4; operator-approved Aaron alignment, 2026-09-21; operator decision 2026-09-23, Aaron pre-launch gap audit).

**Question 3: What is the risk reversal?** Name exactly one: pay-on-results (with the outcome, attribution, exclusions, and timing defined, doctrine §3), no-commitment trial, free deliverable first, or conditional engagement (build it first, pay only if satisfied). Never a money-back guarantee (examples §5: "incredibly washed out"; removed under the operator-approved Aaron alignment, 2026-09-21), and never a performance guarantee on the core service as the front end (his named bad offer, doctrine §6). The default is casual risk elimination: free until the result (examples §5). If none apply, the offer is harder to say yes to than it needs to be. Do not proceed until one is identified and documented. Whatever you name must still pass the Confirmed Deliverable Gate above. Only promise what someone will actually honor after a positive reply: the agency by default, the client only with `lead_magnet_client_ok: yes` (Confirmed Deliverable Gate).

Record the SQL/MQL decision and the risk reversal in Step 3 before writing final copy.

---

## Step 1: Confirm Campaign Direction

### What To Do Silently

0. **Check the List Gate first** (see List Gate above): confirm `leads.verified.csv` exists for this slice, it passed `/list-quality-scorecard` at grade B or better with a list-QA PASS (`verified-list-gate.md` condition 2), and the strategy is locked. If any fails, STOP and route to the producer: do not start copy.
1. Read all provided context.
2. Identify target audience.
3. Identify the trigger or reason this audience is being contacted.
4. Identify the core pain, desired outcome, or business situation.
5. Identify the offer and proof points.
5a. **Select the most relevant proof point for this specific segment or ICP.** Look in `social-proof-bank.md` first: it is already mapped one row per ICP segment × service line, so the segment-matched row hands you the real result and the copy-ready `one_liner`. (The `poke_the_bear` diagnostic-mirror opener is retired with proven-mode; use the proof `one_liner` only.) Do not default to the most prominent case study if a more relevant one exists or if it is a poor fit. Use this selection hierarchy:
   - Direct match (same industry, similar company size, same geography): use with full metric if available. Wherever it is used, the proof is one point at most, in the P.S. or deferred to Email 2, never in lines one or two (doctrine §9, examples §6); a near-twin case can instead become the deliverable's target (examples §1.5).
   - Close match (adjacent industry or similar challenge): use with careful framing; do not claim cross-industry metrics as if they are directly applicable.
   - No match (available case studies are too different in industry or situation): if the angle does NOT need proof, omit the proof reference and let the offer carry the email (Aaron's shortest documented winner carried "no logos, no revenue figures, no case studies", examples §1.2). If the email feels thin without proof, the fix is the offer, not the CTA: fix the offer (doctrine §2); never downgrade Email 1 to a meeting ask (ledger R17). This replaces the old "downgrade the CTA to a conversation or in-body observation deliverable category" fallback (operator-approved Aaron alignment, 2026-09-21). But if the angle's credibility actually needs a named client, a case study, or an exact number you do not have, do NOT silently omit it. Apply the Proof-Asset Gate (see below): be blunt about the gap and collect the real proof from the client via the fill-in form before shipping hollow copy.
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

The first line is the offer, normally the deliverable-first conditional (Hard Rule 19, the Framework A anatomy). What this step chooses is the subject strategy and, only when a labeled variant is deliberately chosen and logged, which variant (operator-approved Aaron alignment, 2026-09-21; the older five-type list, which included signal-led and proof-led first lines, is archived at `outbound/_archive/aaron-alignment-2026-09-21/campaign-copywriting--copy-qa-gate-and-steps.md`).

Subject strategies (2 to 4 lowercase words, 0 to 2 variables, curiosity plus relevance; his endorsed and rejected subjects are in examples §3):

- Relevance: names the topic, or a real signal the whole slice shares, without the offer or a statistic. "your [the offer's own object]" counts: his Sep 21 subject for a trial sign-up offer was "just your trial, super short, conversational" (Aaron process alignment, operator directive 2026-09-22).
- Casual: a short lowercase subject with the first name, the way a peer would write it. His "fyi first name", written `fyi {{first_name}}`, is a normal option (examples §3; Aaron process alignment, operator directive 2026-09-22; supersedes the 2026-09-21 ruling that ran it only as a labeled test variant).
- Resource-led: implies the useful artifact or finding without naming the offer.

Where relevance or a signal belongs in the body, it goes to the P.S. (the opening-line swap, examples §1.1), never ahead of the offer (the labeled relevance question opener aside). Proof never leads (doctrine §9). Per-contact AI context lines in the copy are retired; only the at most two per-contact variables of Hard Rule 34 ride, inside the offer sentence. A subject that names an open role works only if the reader is the hiring person (examples §3).

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
- shape: the one-liner or two lines plus a P.S. (the ledger R14 A/B pair), and any labeled variant with the reason it is logged
- the Email 1 variant set: three by default (A, B, C), with the one variable each of B and C changes against A
- per-contact variables: none, or at most two of `sells_to_vertical`, `service_offered`, `own_best_client`, inside the offer sentence, with the approved no-variable body for rows missing a value
- follow-up direction (strip it back, a different value prop or mechanism, or add to it) and CTA rotation
- thread structure
- whether to include a P.S. line, and its one job
- whether each element can pass the Copy QA Gate

### What To Present

```markdown
## Step 3: Body Structure

**Approved Strategy:** [strategy]
**Approved Subject:** [subject]
**Approved First Line:** [first line]

**Body Logic:**
- Value angle: [angle]
- Proof: [one point at most, in the P.S. or Email 2, never lines one or two; or none]
- Personalization: [`{{first_name}}` optional; at most two per-contact variables inside the offer sentence (`{{sells_to_vertical}}`, `{{service_offered}}`, `{{own_best_client}}` as the deliverable's target), each sourced, with the slice's near-twin case and the approved no-variable body as fallbacks; no company-name variable by default]
- Shape: [one-liner or two lines plus a P.S. (ledger R14 A/B pair); any labeled variant and why it is logged]
- Email 1 variants: [A = control; B = the one variable it changes; C = the one variable it changes; any further letter and why]
- CTA type: [CTA category]
- CTA deliverable category: [in-body observation / public case study / conversation / company-specific note / confirmed asset / client-honored offer with the client's OK / operator-producible deliverable]
- CTA setup purpose: [what the prospect receives and why it is worth their time]
- CTA permission framing: [short humble question style]
- P.S. line: [none / relevance demoted from line one / one near-twin proof point / risk elimination or reason it's free / the deliverable's own terms (turnaround and their one small act); one job only]

**Sequence Logic:**
- Email 1: [new thread, 2-to-4-word lowercase subject with 0 to 2 variables; the Framework A default anatomy (25 to 35 words, the free deliverable on line one, scope disclosure when real, one soft permission CTA, optional one-job P.S.); test the offer first, then its positioning, then the CTA, with subject lines last (doctrine §5 step 9, §9)]
- Email 2: [SAME thread, follow-up, Day 3. Strip it back (the same offer with a lower-friction ask, such as a short video), lean on a different value prop or mechanism for the same offer, or add to it (a real concern pre-handled, a benefit layer, a risk reversal, or the reason it's free); its OWN CTA sentence (a question or a conditional statement re-offer); standalone; soft CTA, never a dead-end soft close]
- Email 3 (a genuinely small market, roughly under 3,000 qualified contacts, or a tested arm): [Day 6. SAME thread by default; a new thread with its own subject only as a logged arm, planned here and shipped threaded until an upload path wires it. Another of the three directions, with a DIFFERENT CTA sentence again; standalone; soft CTA, never a goodbye]
- Step count: 2 by default at every TAM size, 3 only in a small market or as a tested arm. ONE thread by default, three touches at most, no Email 4. Sending runs Monday to Friday.
- CTA rotation check: [the CTA sentences read side by side are all different (Hard Rule 21), and no follow-up repeats Email 1 at the same friction (CTA Hierarchy)]
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

Only output final copy after the user confirms the structure **and the List Gate passes** (verified slice + grade B or better and list-QA PASS + locked strategy; see List Gate). If the gate is not satisfied, STOP here: do not serialize `variants.yaml`.

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

**Variant A** ([word count] words), the control
```text
[QA-approved email body]
```

**Variant B** ([word count] words), changes one variable against A: [name it]
```text
[QA-approved email body]
```

**Variant C** ([word count] words), changes one variable against A: [name it]
```text
[QA-approved email body]
```

(Three Email 1 variants by default, `email_1_a` / `email_1_b` / `email_1_c`; add Variant D and on only when a test needs them, one variable each. Aaron process alignment, operator directive 2026-09-22.)

### Email 2 (Day 3)

Same thread as Email 1 (no subject). Email 2 takes one of the three follow-up directions: strip it back, a different value prop or mechanism, or add to it (Hard Rule 21).

**Variant A** ([word count] words)
```text
[QA-approved email body]
```

### Email 3 (Day 6)

A genuinely small market (roughly under 3,000 qualified contacts) or a tested arm only. SAME thread as Email 1 (no subject) by default; as the logged new-thread arm it carries its own 2-to-4-word subject (planned here, shipped threaded until an upload path wires it, Hard Rule 18). Another of the three directions, such as the biggest benefit, a risk reversal, or the reason it's free (Hard Rules 18 and 21).

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
- [x] Email 1 follows the Framework A default anatomy and closes with one soft permission CTA (default `Would that be worth sharing more?`, whitelist at Hard Rule 32) after the free deliverable and, when real, the scope disclosure; follow-ups use their approved slot CTA.
- [x] Email 1 has three variants by default, each of B and C changing exactly one variable against A, each named above.
- [x] Edited in Aaron's order (offer, unsupported facts, output and effort, one next action, filler, then length and style); every line has a job and a supporting fact.
- [x] Checked against the rejection bank (`aaron-examples.md` §8) and the kill-list; nothing he rejected survives.
- [x] Pre-send test passed: I would answer this email.
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
          <QA-approved body, the control>
      - label: B
        subject: "<same QA-approved subject>"
        body: |
          <QA-approved body, one variable changed against A>
      - label: C
        subject: "<same QA-approved subject>"
        body: |
          <QA-approved body, one variable changed against A>
  - step: 2
    delay_days: 3
    variants:
      - label: A
        subject: ""
        body: |
          <QA-approved body>
  - step: 3
    delay_days: 3
    variants:
      - label: A
        subject: ""   # threaded follow-up, no subject; a planned new-thread arm lives in copy.md until an upload path wires it (Hard Rule 18)
        body: |
          <QA-approved body>
```

Step 1 carries three variants by default (A, B, C; add D and on only when a test needs them), all with the same subject so the body is the isolated variable, and every `- label:` sits at the same six-space indent, because the sequence DOCX builder only picks up labels at that indent. Step 3 exists only in a genuinely small market (roughly under 3,000 qualified contacts) or as a tested arm. `schedule.days: [1, 2, 3, 4, 5]` is Monday to Friday, the default sending week (Tue to Thu only as a tested variant or for a tiny TAM). (Aaron process alignment, operator directive 2026-09-22.)

**Cadence (Aaron process alignment, operator directive 2026-09-22; judgment call, logged).** Two emails by default at every TAM size; a third only in a genuinely small market (roughly under 3,000 qualified contacts, a house threshold) or as a tested arm (supersedes the sequence-length-by-TAM table). Cadence Day 0 and Day 3; when a third runs, Day 0, 3, 6. `delay_days` is read here as the wait after the previous step, so step 3's value moved from 7 to 3 to make the day labels and Aaron's 2-to-3-day gap agree. That per-step reading is not yet verified on FNNL's own sending platform: confirm on the first upload that the locked sending platform (`run_state.sending_platform`) treats the value as a per-step wait rather than a delay from Day 0, and if it counts from Day 0, write 3 and 6 instead.

The sequence is one thread: step 1 (Email 1) is the new thread with a non-empty subject; steps 2 and 3 (the follow-ups) are threaded replies with empty subjects. If the sending platform supports explicit threading metadata, mark steps 2 and 3 as thread replies and step 1 as the new thread. There is no step 4 (Hard Rule 18). A final follow-up planned as the logged new-thread arm (Hard Rule 18) is written in `copy.md`, not in this file, because no upload path in this workspace wires a non-threaded final step yet; `variants.yaml` carries the threaded version that ships.

The literal `subject: "..."` shown above is the live rule for both template and pre-written paths. Email 1 uses one shared subject template for the whole campaign or offer-angle slice, on every Email 1 variant. It must contain 2 to 4 lowercase words and 0 to 2 variables (operator-approved Aaron alignment, 2026-09-21; doctrine §9). Do not generate per-contact subject columns. Email 2 and optional Email 3 inherit the thread and carry no subject.

Do not write YAML that contains unapproved copy, placeholder copy, failed copy, or copy that differs from the reviewed markdown.

YAML body format must use block scalar syntax (`body: |`) with 10-space indented content. Inline escaped strings (`body: "line1\nline2"`) are not parsed correctly by the scripts that read `variants.yaml` line by line (for example `scripts/campaign_docx_presentation.ps1`, the sequence DOCX renderer) and must not be used.

---

## copy.md Requirement

After writing `variants.yaml`, also write a human-readable `copy.md` to:

```text
profiles/<business-slug>/campaigns/<campaign-slug>/copy.md
```

`copy.md` is the canonical human review record for the campaign. It is not generated from `variants.yaml`: it contains everything needed to review, edit, brief, or re-deliver the campaign without opening the YAML.

`variants.yaml` is the machine upload format. `copy.md` is the human review format. Both must exist for every campaign. They must match on all body copy, subjects, and variables.

### Required sections in copy.md

```markdown
# Campaign Copy - <Campaign Name>

**Date:** <YYYY-MM-DD>
**Campaign:** <Campaign name>
**ICP:** <Target titles, company type, size, geography>
**Lead magnet:** <What is offered and how it is delivered. Reference lead-magnets.md.>
**Research basis:** <the offer arm's `pain_angle`; the cluster IDs (`_research/pain-clusters.md`) and the Language-bank phrases the copy used, each phrase with its evidence ID; any pain, objection or workaround line phrased as a question because no cluster backs it; "no pain line" when the copy carries none>
**Tone:** <casual / peer-to-peer / formal>
**Sending platform:** <the locked `run_state.sending_platform` value, resolved from the stack contract>
**Shape and labeled variants:** <one-liner or two lines plus a P.S. (the ledger R14 A/B pair); every labeled variant run as a logged test arm or awareness-driven choice, and why; "none" if none>
**Compliance:** <any sender identification a client's counsel or the recipient's jurisdiction requires in the signature (for example a postal address), and its source; "none" if none>
**Personalization rung:** <`personalization_rung`: the slice's shared body, varying per row by `{{first_name}}` and at most two per-contact variables inside the offer sentence (name them, their source column, and the approved no-variable body for rows missing a value), plus the first-20 review result (Hard Rule 34)>
**Email 1 variants:** <A = control; B = the one variable it changes; C = the one variable it changes; any further letter and why>
**Reply path:** <offer type (promised asset, or direct / trial / service), the reply rule it gets (Hard Rule 36), and `offer.qualification` when one applies>
**Sequence:** <2 steps, or 3 with the reason (small market with its qualified-contact count, or the tested arm); whether a final follow-up is planned as the logged new-thread arm (planned only; the threaded version ships until an upload path wires it)>

---

## Sequence Structure

<Table: Step | Thread | Angle tested>

---

## Spam + Best-Practices QA Notes

<Inline notes confirming which banned tokens were specifically avoided, formatting rules confirmed, CTA rules confirmed. Campaign-specific, not a generic list.>

---

## Variables

<Table: Variable | Source | Example value>

### AI variable prompt for `{{variable_name}}`
<If any variable is AI-generated, include the exact prompt the Claude Code sub-agents ran to generate it (AI generation happens only in Claude Code; list-workbench AI columns are banned on every key, and results reach the workbench by webhook) and the first-20-review instruction. For the pre-written copy path, this is the full per-contact email body prompt from `/personalization-subagent-pattern`.>

---

## Email 1 - Day 0 (New Thread), Thread 1: <Angle name>

### Subject Line Options
1. `subject-a`
2. `subject-b`
3. `subject-c`   ← show 2-3 options per new-thread email

---

**Variant A** (~XX words) - control: <angle description>
[copy block]

**Variant B** (~XX words) - changes one variable against A: <which one>
[copy block]

**Variant C** (~XX words) - changes one variable against A: <which one>
[copy block]

<further letters only when a test needs them, one variable each>

<if the body uses a per-contact variable: the approved no-variable version of each variant, for rows missing a sourced value>

---

## Email 2 - Day 3 (Same Thread, No Subject), 2 to 3 days after Email 1: <direction: strip back / different value prop or mechanism / add to it>

<the single follow-up body with its word count>

---

## Email 3 - Day 6, 2 to 3 days after Email 2 (small market or tested arm only): <direction>

<the single follow-up body with its word count; Same Thread, No Subject by default. Only when it is planned as the logged new-thread arm, add its own 2-to-4-word lowercase subject here, name the arm, and note that the threaded version ships until an upload path wires a non-threaded final step>

---

## (No Email 4: the 4-email / two-thread structure is retired 2026-07-05)

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
- [ ] Email 1 opens with an offer-led opener (leads with the offer); the variant test rides Email 1 with three variants by default (A, B, C), each of B and C changing one variable against A (for example the one-liner vs two lines plus a P.S., ledger R14, or the proof P.S. against no P.S.); offer arms in an offer-validation wave are their own cells (`/campaign-strategy`)
- [ ] Offer passed the Offer Architecture gate before Email 1 (SQL/MQL, the easy-yes and "why not?" test, the farming-interest check, named risk reversal)
- [ ] Email 1 leads with the offer (offer-led opener), not a signal observation; `{{first_name}}` optional (it may open the email); no greeting word; no company-name variable by default; at most two per-contact variables, sourced, inside the offer sentence, first 20 values human-reviewed (Hard Rule 34; per-contact signal openers retired)
- [ ] Any labeled variant (the R14 pain-first pair, the offer-sentence shape that is not the offer type's default (operator decision 2026-09-23, Aaron pre-launch gap audit), no-CTA, longer, relevance question opener, soft conditional statement close, no-number, proof P.S. against no P.S., context line, call-out) is recorded in the header as a logged test arm or awareness-driven choice
- [ ] Edited in Aaron's order (offer, unsupported facts, output and effort, one next action, filler, then length and style); every line has a job and a supporting fact (doctrine §9)
- [ ] Checked against the rejection bank (`aaron-examples.md` §8) and the kill-list; nothing he rejected survives
- [ ] Pre-send test passed: I would answer this email (doctrine §9)
- [ ] Shared-Asset Platitude Read run on each Email 1 variant (offer sentence, scope disclosure, P.S., CTA) and each follow-up body; any vendor-wallpaper asset revised; the shared Email 1 recorded as a hypothesis pending reply data, not a win
- [ ] No observational openers ("I noticed", "I saw that", "Congrats on", "I stumbled upon", "I came across")
- [ ] Line 1 is OFFER-LED and carries no signal (Hard Rule 19; the signal-first opener is retired 2026-07-17). A logged opener arm from Hard Rule 19's list is the one exception to offer-first, and the offer then arrives in the very next sentence (operator decision 2026-09-23, Aaron pre-launch gap audit). Any slice-shared signal fact in the BODY or P.S. (Hard Rule 38) passes the implication test (Signal-First Anti-Patterns): it states what the fact MEANS for the reader, never a description of what the sender saw, a compliment on the signal, the bare fact with no "so what", or flattery as a bridge into a pitch
- [ ] Signal Angle Library used ONLY as slice-level angle guidance (which pain to lead with, which proof to pick for this slice), never as an opener template (its opener templates are retired 2026-07-17). Its caveats honored: no raw department headcount recited as a copy line (surveillance); no customer list/logos recited back and no "I saw you sell to X" line for the sold-to axis (surveillance twin), with vertical-matched proof that is real and on file; champion re-engagement sent only where the prior relationship was real; JD content quoted only when live and publicly accessible; one work-history reference per email, relevant to the offer
- [ ] Each follow-up takes one of Aaron's three directions (strip it back with a lower-friction ask, a different value prop or mechanism for the same offer, or add to it), never re-sends Email 1 at the same friction (Hard Rule 21)
- [ ] The follow-ups (Email 2, Email 3) support Email 1 in the same thread (a new-thread final follow-up only as a planned, logged arm) and end with a SOFT CTA (a light re-offer, a forward-looking question, or a conditional statement re-offer): never a dead-end soft close with nothing to answer, never a repeated hard ask, never a goodbye (Hard Rule 31)
- [ ] No goodbye or closeout language anywhere in the sequence
- [ ] Email 1 ends with one soft permission CTA (default `Would that be worth sharing more?`; whitelist at Hard Rule 32, including `Would that be worth a quick test?`, `Would that be useful?`, `Would that be helpful?`), or the conditional statement in its labeled arm, after the named free deliverable and, when real, the scope disclosure; no stacked asks; no statement-only `Just reply "Yes"...` CTA, `Want me to…`, `Want us to send…`, `Interested?`, or `Worth a look?`
- [ ] Every CTA deliverable has a named honorer for every yes (the agency, or the client with `lead_magnet_client_ok: yes`)
- [ ] Each follow-up either adds something Email 1 left out or restates the same offer at lower friction; none is a re-send, and no two steps share a CTA sentence
- [ ] Every email ends with a CTA or next step (Email 1 the primary value-backed CTA, the follow-ups a soft CTA); no email left as a dead end, except a labeled no-CTA test arm
- [ ] Email 1 signs off with first name plus company name, no title and no location (Hard Rule 23), plus any legally required identification recorded under Compliance and the phone line only when `sender_persona.phone` is set; the follow-ups (Email 2, Email 3) sign off with AT LEAST the first name, since a follow-up sign-off is mandatory, never zero (an unsigned follow-up is a QA failure)
- [ ] Signature is configured on the sending-tool step, not baked into any email body or CSV column
- [ ] Every email formatted as short blocks separated by blank lines, not one dense paragraph: Email 1's offer plus CTA as one block and an optional P.S. as its own block; a pain line only in the labeled R14 arm, never in the offer's block (Hard Rule 25)
- [ ] No cold email opens on a greeting word ("Hey", "Hi", "Hello"); after a `{first_name},` the next word is lowercase unless a proper noun (no `Name, Each ...` mid-sentence capital); in the pre-write path, checked inside each `email_*` column
- [ ] Grammar clean, reads naturally aloud, no awkward over-compression or dropped connective words (a deliberate spoken sentence start such as "thinking I could ..." passes, Hard Rule 26)
- [ ] The reply path matches the offer type (Hard Rule 36): a promised asset is delivered first with no times; a direct, trial or service yes gets two times plus the calendar and the 5-minute call; `offer.qualification` applied where the front end is costly
- [ ] Zero fake-familiarity phrases (no "hope you're well," "just checking in," "following up on my last," "circling back," "touching base," "bumping this," "I wanted to reach out/connect," unearned flattery)
- [ ] First two lines pass the said-out-loud test (sounds like a real person, not a textbook)
- [ ] At least one of: a point of view or spoken rhythm, carried inside the offer sentence or the P.S. (no preamble token before the offer)
- [ ] No warmup sentence before the first relevant line
- [ ] Each follow-up stands alone: it could be the first email read, and it never references the earlier email, names the non-reply, or assumes they scroll up (no "following up on my last")
- [ ] Human-voice variant set up as a test against the clean version, not assumed to win
- [ ] Email 1's body sits in the default 25-to-35-word band with 2 to 3 sentences, the declarative P.S. outside both counts, short and doing one job (the one-liner may be one sentence; a body a little under 25 only if it still carries the whole offer); longer only as a logged A/B arm (ledger R07); never so short it reads like a bump. The follow-ups are under 50 words. No padding or filler.
- [ ] Proof: at most one point, in the P.S. or Email 2, never lines one or two; near-twin, same-mechanism, plain named numbers, no acronyms
- [ ] Pre-written path only: every row's `email_*` column (`email_1_a`, `email_1_b`, `email_1_c` and any further declared letter) carries its variant's shared slice body, varying only the baked-in first name and at most two per-contact variable values inside the offer sentence; rows missing a value carry the approved no-variable version (no blank rows)
- [ ] Email 1's subject is a clean shared template on the step (2 to 4 words, lowercase, 0 to 2 variables, spam-checked, never deceptive; "your [the offer's own object]" and `fyi {{first_name}}` pass); per-contact subject columns are retired; the follow-ups carry no subject
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

This is the column-delivery mechanism the upload to the locked sending platform reads, in that platform's own custom-field syntax: the lead list carries one complete body column per live sequence step and Email 1 variant: `email_1_a`, `email_1_b`, `email_1_c` (three Email 1 variants by default, a further letter only when a test needs it), `email_2`, and optional `email_3`. Each sending-tool step references only its body column plus the step-level signature. **Under Hard Rule 34 (resolved; operator-approved Aaron alignment, 2026-09-21), every row's column carries its variant's shared slice body.** What varies per row is the contact's first name, where the body uses it, and at most two per-contact variable values inside the offer sentence (`sells_to_vertical`, `service_offered`, `own_best_client`), baked in as literal text the same way (Aaron process alignment, operator directive 2026-09-22; supersedes first-name-only variation, 2026-09-21). A row with no sourced value carries the slice's approved version of that body without the variable, and where no per-contact case study exists the slice's near-twin case is written into the shared body. Email 1 still follows the Framework A anatomy; the column mechanism cannot lengthen it, add a hook before the offer, add a stacked ask, or create a per-contact subject. It does not replace the `variants.yaml` + `{{double_braces}}` template model above: the shared body IS the `variants.yaml` body, rendered per row.

- Template model (`variants.yaml`): one well-written email body per step with a few variables assembled at send time. Use when the sending tool expands the variables reliably and one strong email covers the slice.
- Pre-written (column) model: the slice's shared body is rendered per row (the name and any per-contact variable values baked in) and exported as a single field per step. Use it whenever the upload to the locked sending platform reads per-contact columns (the `email_*` columns, in that platform's variable syntax; mechanism unchanged), or whenever a variable must be baked in because the sending tool will not expand a merge field inside another field.

**The rung is resolved: the shared slice body (Hard Rule 34, operator-approved Aaron alignment, 2026-09-21).** The signal's primary job is list relevance, not copy content (doctrine §8), and Aaron superseded per-contact insert stacking in favour of personalizing the ICP or slice variable (ledger R13). So there is no per-contact full-body default anymore, and `deal_value_tier` (set by `/data-point-discovery`) no longer selects a per-contact copy rung; signals and collected data still pick the slice and the offer each slice gets. The case study used as the deliverable's target (doctrine §9, examples §1.5) is the prospect's own best client per contact (`own_best_client`) where the data holds it, and the slice-level near-twin otherwise; with `sells_to_vertical` and `service_offered` these are the only per-contact variables, at most two per email, inside the offer sentence (Aaron process alignment, operator directive 2026-09-22). Still record `personalization_rung` with its one-line rationale in `copy.md` and the activity log (the shared slice body, the per-contact variables it uses, and their fallback), so older records stay readable and no later session has to reverse-engineer the choice. The old per-contact full-body default is archived at `outbound/_archive/aaron-alignment-2026-09-21/campaign-copywriting--pre-written-email-copy-architecture.md`.

**Downstream artifact note.** The approval brief (`/campaign-approval-brief`), the sequence DOCX (`/cold-email-campaign-sequence-docx-presentation`), and the `copy.md` review record are all generated from `variants.yaml`. Because the body is shared per slice, `variants.yaml` and `copy.md` carry the real body (with its per-contact variables as `{{placeholders}}`) and the `email_*` columns are its per-row rendering, so write both for every campaign; the downstream artifacts then show exactly what ships.

### The core shift

Template model: static copy in the sending tool, variables assembled at send time.

Pre-written model: the shared body is rendered per contact before it reaches the sequencer and stored as one text field per email slot. The sending tool receives only a ready-to-send body. No assembly in the sequencer, no conditional logic in the sending tool. Within this path, "no variables, no assembly, no conditionals in the sequencer" is the rule. It does not change the Variable Schema or the `variants.yaml` template path above.

In this repo the per-row rendering step is `/personalization-subagent-pattern` (parallel Task sub-agents that already enforce this Copy QA Gate and `spam-word-checker.md`). Under Hard Rule 34 it renders the shared slice body and bakes in the first name and the at most two per-contact variable values; where the data lacks `service_offered` or `own_best_client`, its Claude sub-agents derive them from the prospect's own site with an evidence URL, never an AI column. It does not write per-contact prose. The same principle applies to a deterministic Claude Code script over a CSV. AI columns in the list workbench are not an equivalent path: they are banned on every key (no-AI-API rule, operator directive 2026-09-22), so the rendered rows are pushed into the workbench by webhook. The canonical generation prompt for this path lives in `/personalization-subagent-pattern`.

### Per-contact rows (one shared body per slice)

Each live email copy column holds one complete body per contact row: its variant's shared slice body. There is no per-row wording decision inside the generation prompt and no separate fallback column (Hard Rule 34). The per-row differences are the baked-in first name, where the body uses it, and at most two per-contact variable values inside the offer sentence. When a row has no sourced value for a variable the body uses, the row carries the slice's approved version of that body without the variable (written once in `copy.md` beside the main body), never a guessed value. Email 1 always begins with the approved offer (a labeled opener arm aside). Email 2 and optional Email 3 are same-thread follow-ups.

### Column naming convention

Email 1 runs three variants by default: `email_1_a`, `email_1_b`, `email_1_c`, one variable changed per variant (A is the control), more letters allowed (Aaron, Sep 21: variant one, variant two, variant three; Mar 9: one variable at a time). (Aaron process alignment, operator directive 2026-09-22; supersedes the two-variant `email_1_a`/`email_1_b` convention, 2026-07-05.)

- `email_1_a` = Email 1 (Thread 1), Variant A, the control
- `email_1_b` = Email 1 (Thread 1), Variant B, one variable changed against A
- `email_1_c` = Email 1 (Thread 1), Variant C, one (different) variable changed against A
- `email_1_d` and on = further Email 1 variants, only when the campaign's `variants.yaml` declares them, one variable each
- `email_2` = Email 2 (reply to Thread 1), supporting email, single variant (no split), one complete body per contact
- `email_3` = Email 3 (optional third step, SAME thread; a genuinely small market or a tested arm only), single variant (no split), one complete body per contact
- (no `email_3_a` / `email_3_b` split columns and no `email_4`: the 4-email / two-thread structure is retired 2026-07-05; Email 2 and Email 3 are single-variant same-thread follow-ups)
- No subject columns. Email 1 uses one shared static subject template containing 2 to 4 lowercase words and 0 to 2 variables, on every Email 1 variant. Email 2 and Email 3 inherit the thread.

These `email_*` columns contain the BODY only (no subject text, no signature, no sign-off inside the body cell). Each body is formatted as short blocks separated by blank lines (the blank lines live inside the CSV cell), never one dense paragraph. Where the shared body uses the contact's first name (optional, and it may open the email, examples §1.1) or a per-contact variable, the value is baked into the text, so the sending-tool step is only `{{email_1_a}}` plus the signature: there is no separate `{{first_name}}` or `{{sells_to_vertical}}` token on the step. Bake the values in rather than nesting a merge field inside the column: sending tools do not reliably expand a merge field that sits inside another custom-field value. The blank lines between blocks inside the cell are what produce the email's paragraph breaks, so confirm in a live preview that the sending tool renders them as line breaks before launch (if it does not, the body must carry the breaks as the tool's own markup).

**The Email 1 subject is shared and static at the campaign level.** It contains 2 to 4 lowercase words and 0 to 2 variables, in the shape of his "question about topic" (examples §3; he says of it *"That one's always a good one."*), with the slice's topic typed in, for example `question about [topic]`. His other endorsed subject, "fyi first name", written `fyi {{first_name}}`, is a normal option, and "your [the offer's own object]" (his Sep 21 "your trial") passes the relevance test (Aaron process alignment, operator directive 2026-09-22; supersedes the 2026-09-21 ruling that ran `fyi {{first_name}}` only as a labeled test variant). The shared subject rides every Email 1 body variant so the body remains the isolated test variable. Follow-ups inherit the thread. The signature is appended in the sending-tool step.

### Sending-tool variable usage and signature

Each new-thread step carries a SHARED static subject line in its subject field and the per-campaign BODY variable in its body field, plus the static signature block. (Per-contact subjects are retired 2026-07-05.) The full body lives inside the pre-written field. The signature is static sender identity (one persona per client), configured once in the step, never written into the CSV.

Email 1 step (Campaign A):

```text
Subject: question about [topic]          ← [topic] is the slice's topic, typed in once (not a merge field)

{{email_1_a}}

{first name}
{company name}
{phone}          ← only when client has supplied a sender phone (sender_persona.phone)
```

Any line a client's counsel or the recipient's jurisdiction requires (for example a sender postal address) is added exactly as required and recorded under Compliance in `copy.md` (Hard Rule 23). Email 1 Variant B uses the same shared subject template and `{{email_1_b}}`, Variant C uses it with `{{email_1_c}}`, and any further declared letter the same way, each followed by the same signature block. Email 2 and optional Email 3 have an empty subject because they are threaded replies; their bodies are `{{email_2}}` and `{{email_3}}`.

### Split testing: within-campaign variants (preferred where the platform supports them) or across campaigns

The Email 1 variant columns (`email_1_a`, `email_1_b`, `email_1_c`, and any further declared letter) can be wired two ways. Pick by platform. Either way the upload wires one variation per declared Email 1 column on the locked sending platform (`run_state.sending_platform`), confirms the platform takes that many variations with an even split, and stops rather than dropping Variant C (Aaron process alignment, operator directive 2026-09-22; supersedes the two-variant 50/50 wiring).

- **Within-campaign variants (preferred when the sending platform supports native variant slots; resolve the platform from the stack contract).** One campaign per slice. Email 1 holds one variation per declared column (A, B and C by default), split evenly across all of them. Every variation uses the same shared subject and follow-ups, so reply differences trace cleanly to the body copy. Use the campaign-upload skill for the locked `run_state.sending_platform`, if `/stack-setup` activated a pack that provides one. If no pack is active, set the variations and the even split in that platform's native campaign builder. If neither exists, say so and build it by hand rather than implying coverage. Confirm on the first build that the platform accepts three or more variations on one step and splits contacts evenly across them, and record it. If it caps a step at two variations, stop and report it; never drop Variant C to make the upload fit.
- **Across campaigns (platform-agnostic fallback).** One campaign per declared Email 1 column, sharing the same list split evenly between them: Campaign A pulls `email_1_a`, Campaign B pulls `email_1_b`, and Campaign C pulls `email_1_c`. Use only when the sending tool cannot run native within-step variants.

Either way every Email 1 variant shares `email_2` and optional `email_3`; the follow-ups are not split (Sep 21 shows three step-one variants and a single step two).

### Export gate

Never export a row where any required output column is blank. Filter to rows where `first_name`, `company_name`, every Email 1 variant column the campaign declares (by default `email_1_a`, `email_1_b` and `email_1_c`), and every live follow-up column are non-empty (Aaron process alignment, operator directive 2026-09-22; supersedes "both required Email 1 variant columns"). A blank body means generation failed. Validate the shared subject template once, then scan every body column for banned punctuation and tokens. Confirm every row's body equals its variant's shared slice body (or the slice's approved no-variable version) apart from the baked-in first name and at most two per-contact variable values inside the offer sentence (Hard Rule 34), and that the first 20 filled variable values passed human review. Confirm Email 1 passes the Framework A default-anatomy checks and that no signature or sign-off was baked into a body column.

---

## Core Copywriting Framework

### Philosophy

- The offer is the product; the copy is only its delivery vehicle (doctrine §1, §3). Fix the offer before touching a word.
- Research picks the list and the slice. A signal's primary job is list relevance, not copy content (doctrine §8, ledger R13; operator-approved Aaron alignment, 2026-09-21).
- Shorter usually wins, but clarity wins over arbitrary length.
- Earn replies before trying to book meetings.
- Give each email one job.
- Make the email about the recipient's situation, not the sender's company.
- Use plain language that sounds like a credible person.
- Frame broad claims as observations only when they can be defended.

---

## Hard Rules

1. No em dashes, double hyphens, or mid-sentence dash separators in outbound copy.
2. Company variable is always `{{company_name}}`, never `{{company}}`. It is not a default in copy (operator-approved Aaron alignment, 2026-09-21): of that substitution Aaron says "which I actually hate" (examples §8), and the preferred variable is the case study used as the deliverable's target: the prospect's own best client (`{{own_best_client}}`, per contact) where the data holds it, else the slice's near-twin case written into the shared body (Hard Rule 34; Aaron process alignment, operator directive 2026-09-22).
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
15. No calendar links in emails 1-3. A trial or tool arm is never blocked by this or by Hard Rule 14: its link goes in the reply to a yes, not in emails 1 to 3. Hard Rules 14 and 15 cover the cold steps only; a warm reply follows Hard Rule 36 (a direct, trial or service yes gets two times plus the calendar).
16. Do not use `:` to make one sentence carry a long list, proof stack, or multi-clause explanation. Split it.
17. Do not use comma-wrapped company descriptors. Write the company descriptor as its own sentence.
18. **Single thread, 2 to 3 steps (HARD RULE).** Every campaign is ONE thread by default: Email 1 (new thread, offer-led) plus one or two same-thread follow-ups. Two emails by default at every TAM size; a third only in a genuinely small market (roughly under 3,000 qualified contacts, a house threshold) or as a tested arm (supersedes the sequence-length-by-TAM table). Cadence Day 0 and Day 3; when a third runs, Day 0, 3, 6. Send Monday to Friday. **The final follow-up may run as a new thread** (its own 2-to-4-word lowercase subject, a different variation of the same offer or a different pain, not a thread reply) only as a logged test arm recorded in `copy.md` (Aaron, Apr 13: "take it a step further by removing the thread ... Different subject line, different variation of the offer, different pain point"). Never more than three touches, never a 4th email. **Not runnable yet:** no upload path in this workspace wires a non-threaded final step with its own subject, so plan the arm in `copy.md` and ship the threaded version until one does (flagged 2026-09-23). (Aaron process alignment, operator directive 2026-09-22; supersedes the TAM-size trigger and "never a second new thread", 2026-07-05. The old 4-email / two-independent-thread structure stays RETIRED 2026-07-05; any "Email 4" reference elsewhere in this skill is superseded, and Email 3 is the optional third follow-up.)
19. **Every new-thread email opens with an OFFER-LED opener: it leads with the offer itself, a free concrete deliverable stated as what they get, how fast, and what they must do, with the dream outcome implied by the deliverable on a free-deliverable offer, or named with its risk term in the outcome conditional below, the default for a trial, pilot or pay-on-result offer (doctrine §4; operator decision 2026-09-23, Aaron pre-launch gap audit), never a flat statement, an observation, or a vague self-introduction (operator-approved Aaron alignment, 2026-09-21).** Leading with a clear, concrete offer is the point ("no pain, no observation, no preamble", doctrine §9); the banned pitch is a vague self-introduction or a homepage summary. The sentence shape follows the offer type (operator decision 2026-09-23, Aaron pre-launch gap audit; Aaron Sep 7, Sep 14, Sep 21). For a free deliverable, deliverable-first stays the default (his measured winner; Sep 7, "if we could [deliverable] at no cost ..."). For a free trial, a pilot or a pay-on-result offer, a conditional that names the outcome and pairs it with its risk term is the default, not an arm ("if I had a way to [outcome] ... and you only pay per [unit], would that be worth a quick test?", Sep 21; "if we could help you get [result] ... free for [x] days", Sep 14; doctrine §4, his Jun 29 script). Either shape may run the other as a labeled arm. The limits are unchanged: no proof claim on line one, no guarantee on the core service (pay only on a counted result is not a guarantee), and an outcome that is not a stretch (that last limit is the corpus's reading, not his words). Still banned: an outcome stated with no risk term, and the retired bundle of an outcome plus a named comparable and its number on line one (proof goes to the PS, one point). A comparable becomes the deliverable's target or the P.S.'s single proof point. (Question-first and diagnostic-mirror openers are RETIRED with proven-mode, 2026-07-05.) A new-thread email is one that starts its own thread with its own subject; here that is Email 1 (the single new thread). A new-thread email that opens with a generic statement, an observation, or a vague self-introduction is a hard failure. **The only departures are the labeled variants in the Framework A section** (the two-line relevance or pain-first pair, ledger R14; the offer-sentence shape that is not the offer type's default, under the boundary above, doctrine §4; a relevance question opener at any awareness level, literally relevant and implying no relationship, never a question-form pain opener (Sep 21; widened from S08's less-aware case by Aaron process alignment, operator directive 2026-09-22); a brief truthful context line, S13; the call-out form, demoted to the P.S. by default), each recorded in `copy.md` as a logged test arm or an explicit awareness-driven choice, never the default. An opener arm among them (the pain-first pair, the relevance question opener, the context line, or a call-out not demoted to the P.S.) puts the offer in the very next sentence (operator decision 2026-09-23, Aaron pre-launch gap audit). In-thread follow-ups (Email 2, and Email 3 in a 3-step) continue the thread and open however best moves the conversation (stripping it back to lower friction, a different value prop or mechanism, or adding to the offer); a final follow-up planned as the logged new-thread arm (Hard Rule 18) still leads with the offer. The old wording ("the dream outcome made specific plus the risk reversal") is archived at `outbound/_archive/aaron-alignment-2026-09-21/campaign-copywriting--hard-rules.md`.
20. Email 2 (and Email 3, in a 3-step) are same-thread follow-ups supporting Email 1 (a final follow-up may run as a new thread only as the logged arm in Hard Rule 18). They are not global reminders, last emails, or goodbye emails.
21. **Each follow-up must MOVE, never re-send Email 1 (operator-approved Aaron alignment, 2026-09-21; three directions, Aaron process alignment, operator directive 2026-09-22, superseding the two-direction fork).** It takes one of Aaron's three directions, newest first (Sep 21; examples §7.1; ledger R12, doctrine §11): **strip it back** (a shorter email with a lower-friction ask, such as a short video that shows how it works), **a different value prop or mechanism for the same offer** (Sep 21: "lean on a different version of the value prop"), or **add to it** (pre-handle a real concern, add a benefit layer, add a risk reversal, or give the reason it is free); if Email 1 was already stripped back, take one of the other two. A follow-up CTA may be a conditional statement re-offer rather than a question ("If it's easier, I can send over a quick video ...", his Sep 21 Email 2). A lower-friction restatement of the same offer PASSES; repeating Email 1 at the same friction FAILS. Each follow-up stands alone, earns its place (follow-ups are 58% of his study's losers, doctrine §9), and never names the non-reply. **No two steps use the same CTA sentence (checkable, house).** Read the sequence's CTA sentences side by side: if any two are the same sentence, it fails QA. The older "or offer the same mechanism" test is retired, because it failed Aaron's preferred de-escalation. "Add to it" is NOT permission to repeat Email 1's CTA line: the offer can repeat, the CTA sentence rotates. Full doctrine: the Offer-First Copy Standard → The CTA Hierarchy.
22. Final copy must follow the saved campaign plan, selected campaign strategy, lead-source plan, and locked offer or lead magnet.
23. **Email 1 (the single new thread) closes with the sender's first name and company name, each on its own line: no job title and no location (operator-approved Aaron alignment, 2026-09-21).** Aaron: "Just put your name, put your company name. You don't even really need your job title. Just super simple." He cuts the location too (doctrine §9). Reading his "Just put your name" as the first name alone is a house reading; he does not say first or full name (operator-approved Aaron alignment, 2026-09-21). The phone line is house too: it is added only when `sender_persona.phone` is set. **Legal requirements override style** (the doctrine's own rule, not Aaron's words: doctrine §11 states "Campaign caps, legal requirements, and opt-outs override." in the corpus author's voice): where a client's counsel or the recipient's jurisdiction requires a sender postal address or other identification, add exactly what is required and record it under Compliance in `copy.md` as a compliance requirement, not a style choice. Confirm this per client before launch, because the old city-and-country line was never a postal address: for US recipients, commercial email law is commonly read as requiring a valid physical postal address, which is a question for counsel, not a style call. The in-thread follow-ups (Email 2, and Email 3 in a 3-step) may sign off with the first name alone, but a sign-off there is still MANDATORY: every email in the sequence, follow-ups included, ends with at least a name. A follow-up with no sign-off at all is a hard failure (it renders as an unsigned fragment). Each signature line renders on its own line; never collapse the block. Do not spin the signature. The old 3-line block (full name, title @ company, city and country) is archived at `outbound/_archive/aaron-alignment-2026-09-21/campaign-copywriting--hard-rules.md`.
24. The signature lives in the sending-tool campaign step, never in per-contact lead or CSV data. In the `variants.yaml` template path it is part of the campaign step body. In the pre-written copy path the body variable (`email_1_a`, etc.) carries no sign-off, and the static signature block is appended below the variable on the sending-tool step. See Pre-Written Email Copy Architecture.
25. **Format every email as short blocks separated by blank lines, never one dense paragraph; the layout default changed (operator-approved Aaron alignment, 2026-09-21).** The default Email 1 layout is Aaron's measured winner (doctrine §9): the offer plus the CTA as one block, then an optional P.S. as its own block. His two canonical shapes are A/B-tested against each other (ledger R14): the one-liner (the offer and CTA in one block, the P.S. optional) and two lines plus a P.S. The pain-first or relevance-first two-liner survives only as that labeled R14 test arm: its first block is the pain or relevance line, its second block is the offer plus CTA, and the pain never shares a block with the offer and CTA. **Each block is one idea, usually one or two short sentences, never the whole email crammed together.** A blank line between blocks is required. Blank lines are whitespace, not banned formatting (the plain-text rule bans HTML, bold, italics, color, and images, never paragraph spacing). House example, conforms to Framework A (the one-liner with a P.S.: 33 body words, plus a 10-word P.S. outside the count):

    ```text
    If we could build you a free seat-by-seat check of last month's usage against your invoices (we'd pull the export, match every seat and list each gap), would that be worth sharing more?

    PS, 48-hour turnaround, and you'd only send one export file.
    ```

    The old layout (situation, then pain, then proof, then the offer and CTA) and its example are archived at `outbound/_archive/aaron-alignment-2026-09-21/campaign-copywriting--hard-rules.md`.
26. Grammar must be clean and phrasing natural. No awkward constructions, run-ons, comma splices, garden-path sentences, or dropped connective words. A missing "where", "that", or article reads as broken English. Read every sentence aloud and fix it before it is shown. **Carve-out (Aaron process alignment, operator directive 2026-09-22):** a deliberate spoken sentence start ("thinking I could ...", "asking because ...") passes when it reads naturally aloud (Sep 21: "starting sentences fairly informally like asking, thinking"). Broken grammar still fails: natural does not mean sloppy (doctrine §9).
27. **Framework A controls Email 1 length and shape: a default 25-to-35-word band; follow-ups stay under 50; hardness relaxed to Aaron's stated positions (operator-approved Aaron alignment, 2026-09-21).** Count the body words, including any name; the optional P.S. sits outside the count (it must be short and do one job), and so do the subject and signature. The 25-to-35 band, 2 to 3 sentences, and one to two lines are Aaron's own measured winner (S02; doctrine §9, §13); what was house was making them a hard cap in every market. Now: 2 to 3 body sentences, the declarative P.S. outside the count (the one-liner shape may be a single sentence); his floor applies (never so short it reads like a bump; a body a little under 25 passes only if it still carries the whole offer); a longer version runs only as a logged A/B arm for a solution-aware or saturated market (ledger R07). One primary ask replaces "exactly 1 question": one CTA question by default, no stacked asks. The scope disclosure (3 to 4 real tasks we handle plus their one small act, as a parenthetical or in prose) is the default whenever it reflects the real process, never "mandatory" and never invented. Never pad, and never delete a required word until the offer, scope disclosure, or CTA stops reading naturally. The full anatomy and the Aaron-vs-house source table are in the Framework A section at the top of this skill; the exemplar set is in `outreach-copy-framework.md` under `## Framework A (house name): the direct concrete offer, Aaron's measured winner anatomy`.
28. Capability truth. Never claim a product capability, feature, integration, result, or outcome the client cannot actually deliver. Every claim about what the client does or offers must map to a real, documented capability (from `client-profile.yaml`, `offer-intelligence.md`, or the locked offer). A client-honored arm's term (a trial, a price, a guarantee, their people's time) counts as documented only once the client has confirmed that specific term, written in `lead_magnet_client_dependency` with its limits and recorded as `lead_magnet_client_ok: yes`; the copy may claim exactly what was confirmed and nothing wider. A bare "yes" to the slate, or the field alone, never makes a claim about the client's product true. This is separate from "never fabricate facts about the prospect": the risk here is the email promising something the client's sales team cannot fulfill. When the supporting capability is not documented, leave the claim out rather than invent it. This is the single biggest failure mode of AI-generated copy at scale, so when generation is automated, the generator must be given the client's real capability list and held strictly inside it.
29. **Greeting casing; examples updated (operator-approved Aaron alignment, 2026-09-21).** Cold emails carry no greeting word ("Hey", "Hi", "Hello"), but a first name may open the email (examples §1.1, §1.3). When the body continues on the same line right after a leading `{first_name},`, the first word is lowercase unless it is a proper noun (company name, product, brand, or acronym), because the name and the opener are one sentence and a mid-sentence capital reads as broken. Client-agnostic example: WRONG `Katrin, If we could build you a free seat-by-seat check of last month's usage...` RIGHT `Katrin, if we could build you a free seat-by-seat check of last month's usage...` When the next word legitimately is a proper noun, keep its capital: `Katrin, Loom works too if a written note is easier.` The same applies anywhere else a name is followed by a comma, such as the delivery reply (`Great Katrin, here's the link.`). In the pre-write column model the name is baked into each `email_*` body, so the generator must emit the opener already cased correctly (lowercase common word, or proper-noun capital) in the column; there is no separate step that can fix it later. The old examples (a situation opener and an observation opener) are archived at `outbound/_archive/aaron-alignment-2026-09-21/campaign-copywriting--hard-rules.md`.
30. Human voice, not fake warmth (see Human Voice, Not Fake Warmth). NEVER write fake-familiarity or warmup phrasing in any cold email or follow-up: no "hope you're well"/"hope this finds you well," "just checking in"/"following up"/"following up on my last"/"circling back"/"touching base"/"bumping this"/"just nudging," "did you see my last email," "I wanted to reach out"/"I wanted to connect," "I know you're busy," unearned flattery ("big fan of what you're building," "saw you're crushing it"), any phrase implying shared history, or any warmup sentence before the first relevant line. Personality lives INSIDE the first relevant line (a point of view plus spoken rhythm), never in a preamble. Every cold email and follow-up must pass the said-out-loud test: read the first two lines aloud; if they sound like a brochure or a textbook, rewrite until they sound like a real person. **Follow-ups stand alone (operator-approved Aaron alignment, 2026-09-21):** treat each as possibly the first one read; never reference the earlier email, never name the non-reply, and never assume they scroll up (doctrine §11). This replaces the older "imply the prior touch" rule. **Framing tokens ("quick one," "this'll sound random but") are retired as a lever (operator-approved Aaron alignment, 2026-09-21):** a token before the offer is a preamble, and Email 1 opens straight on the offer with "no pain, no observation, no preamble" (doctrine §9). The old text of this rule is archived at `outbound/_archive/aaron-alignment-2026-09-21/campaign-copywriting--hard-rules.md`.
31. Every email ends with a CTA, no dead ends. Email 1 ends with one soft permission CTA after the free deliverable and, when it reflects the real process, the scope disclosure. The follow-ups carry a soft, low-friction CTA with its own wording, never a repeated hard ask, goodbye, or last-touch line. The one exception is Aaron's no-CTA variant (examples §4), which runs only as a labeled, logged A/B arm, never the default (operator-approved Aaron alignment, 2026-09-21).
32. **Make "yes" the easy answer; the prospect stays on top; default updated (operator-approved Aaron alignment, 2026-09-21).** Email 1 closes with one soft permission question. The default is `Would that be worth sharing more?`, Aaron's signature ask (examples §4; ledger R17). His other variants are accepted: `Is that worth sharing more?`, `Mind if I send it to you?`, `Do you mind if I send it to you?`, and, in sentence case, `Worth sharing more?` and `Would that be worth sending over?`. His July 13 and Sep 14 CTAs, verbatim from examples §4, are accepted where the offer is a free tool to test or a free trial: "Open to testing it for free." (`[AS-draft]`, Jul 13) and "would you be open to trying it out" (`[AS-client]`, Sep 14), written in Email 1 as the questions `Open to testing it for free?` and `Would you be open to trying it out?` (the same house punctuation as above). His Sep 14 statement "let me know and I'll shoot you over the trial link", which he calls "almost like the second CTA", never closes Email 1 on its own: it runs only inside the logged R19 longer arm, as a second close asking for the same reply (ledger R19; operator-approved Aaron alignment, 2026-09-21). **Added by Aaron process alignment, operator directive 2026-09-22:** `Would that be worth a quick test?` for pilot, trial and pay-per-result offers (his Sep 21 Email 1 close, because the prospect sees "this isn't something that they're going to have to pay you a retainer for"), and `Would that be useful?` and `Would that be helpful?` (his examples §1.5 bake-off winner and §2.6). The house phrasings `Would that be worth hearing more?`, `Open to it?`, `May I send it over?`, `Can I send it across?`, and `Would it help if I sent it?` stay accepted as house variants. The ask is permission to send, show, or test something, never a meeting ("worth a chat" is his retired `[ANTI]` form). The one statement close Email 1 may carry is the labeled soft conditional statement arm ("... if you're open to that kind of thing", Sep 21), a single conditional ask. The statement-only opt-in `Just reply "Yes" and I'll...` may be used after the initial cold touch, but not in Email 1. NEVER use `Want me to send it?`, `Want us to send it?`, `Want the link?`, `Did you want…?`, `Interested?`, `Let me know if you'd like…`, or `Worth a look?`.
33. **Write 1-to-1: first-person singular, minimize "we" and "us".** The email is one person writing to one person, so default to "I". Reserve "we"/"us" for genuinely collective facts that cannot honestly be said as "I" (a real team result, a true company capability). **Exemption (operator-approved Aaron alignment, 2026-09-21): the offer conditional and the scope disclosure use "we" whenever it states the team's real work**, which is Aaron's own form ("if we could ideate, script, edit, and record", examples §1.1; "we would ideate, write the script, do the editing and design the thumbnail. All you have to do is record", doctrine §4). Frame the client's value around the prospect ("you're one of the few who...") rather than "we help teams like you." Do not over-apply into stilted copy. Full rule: `cold-email-copy-best-practices.md` (Write 1-to-1).
34. **RESOLVED in favour of this rule: one shared body per campaign or offer-angle slice (operator-approved Aaron alignment, 2026-09-21).** The signal's primary job is list relevance, not copy content (doctrine §8), and Aaron superseded per-contact insert stacking in favour of personalizing the ICP or slice variable (ledger R13). The per-contact `email_*` columns that the upload to the locked sending platform reads (`email_1_a` / `email_1_b` / `email_1_c` / `email_2` / `email_3`, in that platform's variable syntax) stay exactly as they are as a mechanism: each row's column carries its variant's shared slice body with `{{first_name}}` baked in. **Up to two per-contact variables (Aaron process alignment, operator directive 2026-09-22; supersedes first-name-only variation, the house choice of 2026-09-21).** R13 bans stacked per-contact inserts, not a variable already in the data (doctrine §8), and Aaron's Sep 21 build runs two: "The first is who their ideal customer is, and then second, the actual service that they offer." So each email may carry, besides the first name, **at most two** of: `{{sells_to_vertical}}` (who the prospect sells to, an existing column), `{{service_offered}}` (the prospect's own product or service, a short phrase, new column), and `{{own_best_client}}` (optional new column: the prospect's own best client from their own site, used as the TARGET of the deliverable, his case-study variable). Binding bounds: each value is already in the data or cheaply derived, and carries a `_source` evidence URL (`service_offered` and `own_best_client` are derived by Claude sub-agents in `/personalization-subagent-pattern`, never by an AI column in the list workbench); it sits **inside the offer sentence**, never as an opener, never as a stacked AI line, never phrased as an observation ("I saw you sell to X"), and never as surveillance (no customer lists, headcounts or named employees read back); the first 20 filled values get a human review before the list scales (refine the derivation if more than 3 of 20 are vague, awkward or wrong); and a row with no sourced value carries the slice's approved version of the body without that variable (the fallback body), never a guess. Where no per-contact case study exists, the slice's near-twin case is written into the shared body. The per-contact full-body default and the unresolved-fork flag (2026-09-18) are retired; the flag is archived at `outbound/_archive/aaron-alignment-2026-09-21/campaign-copywriting--hard-rules.md`. Keep recording `personalization_rung` with its rationale in `copy.md` and the activity log. **RETIRED 2026-07-05 (proven-mode retirement).** Per-contact subject and body personalization (`{{subject_1}}` / `{{subject_3}}` per-contact columns, light-touch relevancy off each row) is retired. Offer-first copy is shared: one offer-led body per Email 1 variant and one subject template per campaign or offer-angle slice, with only the per-contact variables above filled per row. The Email 1 subject is 2 to 4 lowercase words with 0 to 2 variables (for example `{{first_name}}`); this is a shared template, not a per-contact generated subject column. Threaded follow-ups carry no subject.
35. **CTA Hierarchy: Framework A first, then rotate across steps.** Email 1 uses one soft permission question (default `Would that be worth sharing more?`) after a real, specific free deliverable (or, for a trial, pilot or pay-on-result offer, the outcome with its risk term; operator decision 2026-09-23, Aaron pre-launch gap audit). Later steps may use an easy-yes statement, another forward-looking question, or a conditional statement re-offer (Sep 21; Aaron process alignment, operator directive 2026-09-22), but no two steps share the same CTA sentence, and no follow-up repeats Email 1 at the same friction; a lower-friction restatement of the same offer is allowed, per doctrine §11 (operator-approved Aaron alignment, 2026-09-21). Never invent a lead magnet to satisfy the skeleton (a filler asset nobody asked for); a real asset built for the campaign's offer is fine, as long as it exists before the first yes needs it.
36. **The reply after a yes splits by offer type. For a promised asset: deliver it first, with no pitch, no proposed time, no calendar link, and no booking gate, and keep the next step present one layer down and refusable (operator decision 2026-07-17); behavior aligned to Aaron and his attribution restored (operator-approved Aaron alignment, 2026-09-21). For a direct, trial or service offer: two specific times plus the calendar, and a call within about 5 minutes (Aaron process alignment, operator directive 2026-09-22).** The promised-asset half is Aaron's own position (ledger R03, the only outright reversal in his ledger; doctrine §11; examples §7.3): he sends the asset, does not "force-feed them the calendar", and leaves the next step where the prospect can take it ("calendar's on the next page if you think there's interest"). The no-pitch reasoning is his too (attribution restored, operator-approved Aaron alignment, 2026-09-21), from his July 13 2026 video (examples §7.3; doctrine §11): with a call ask on the delivery the prospect feels "they're getting caught in like a trapdoor", and "you don't want to add any sort of sales friction until they've actually consumed the value." An earlier 2026-09-21 pass labeled that reasoning house because the corpus lacked it at the time; only the gloss that the free thing "had a price" is house. **A delivery reply for a promised asset never proposes times, whether or not the asset leaves an open question;** the next step sits one layer down and refusable (examples §7.3; ledger R03), and times go out only when the prospect asks to talk (explicit booking intent, doctrine §11). Conditional on `offer.lead_magnet_gap` in `client-profile.yaml`. **Gap present:** the delivery (day 0) carries the asset and no demand; the next step lives inside the asset or in the follow-up (day 2-3) aimed at the unresolved motive, and a guilt-free close (day 7) ends it. A gap-present sequence with no follow-up defined FAILS QA: "they'll hit the gap and book on their own" is a hope, not a mechanism. Name the kill number before it ships (replies that reach the follow-up and still never take the next step), because K4 tests whether the gap is *real* and nothing tests whether it is *motivating*. **No gap, real magnet:** deliver the asset plus one soft, refusable pointer to the next step one layer down ("calendar's on the next page if you think there's interest", examples §7.3); no calendar link and no proposed times. **A direct, trial or service offer, including `lead_magnet: direct_offer` (Aaron process alignment, operator directive 2026-09-22; supersedes the 2026-09-21 branch under which a `direct_offer` yes was permission to share more and got times only on explicit booking intent):** the no-times rule above governs promised assets only. For these offers the first reply is short, answers any question in one sentence, and proposes two specific times plus the calendar, with no re-selling (Sep 21: "Do you have some time available on X or Y? Here's my calendar"; "the call is the mechanism"), and every interested reply gets a call within about 5 minutes from the call script in `interested-reply.md` (Sep 14, Sep 21). The always-on receiver for the sending platform's interested-reply webhook does not exist yet, so the reply sweep runs several times a day until it does and the 5-minute call is a target, not a mechanism. **Qualification after the yes:** a costly front end (a trial, service time, or custom work) with `offer.qualification` routes the yes through a short, disclosed qualification form before the free unit is promised, and a prospect who does not qualify gets the standard offer (Sep 21); cheap assets stay ungated and deliver-first. No blanket booking link on every positive. Call timing on a plain asset request stays the house reading of the unresolved ledger R20. Every reply answers a question in one sentence and matches its intent (doctrine §11). **Never strip the next step without a real motive AND a defined follow-up.** The old text of this rule is archived at `outbound/_archive/aaron-alignment-2026-09-21/campaign-copywriting--hard-rules.md`. Full rule: the Offer-First Copy Standard → The CTA Hierarchy → The Delivery Message.
37. **The inherent-value anchor prices the asset, never the outcome.** The anchor is Aaron's own method, attribution restored (operator-approved Aaron alignment, 2026-09-21): in his July 13 2026 video (doctrine §3), the source behind the old "Aaron's 589-replies method" label, he prices each free asset ("$10,000 and above", "$6,000 every single year", "10 million emails to $50,000 plus in Meta Ad spend"). An earlier 2026-09-21 pass labeled it house because the corpus did not carry it at the time; it now does. House: the split (it prices the asset and never stands in for the outcome) and the slotting below. Keep any real outcome number separately in the locked offer record (captured when it exists, never required; operator decision 2026-09-23, Aaron pre-launch gap audit). Include an asset anchor in Email 1 only when it is true and the whole message still passes the Framework A anatomy; an Email 1 built around announcing the asset is a labeled variant, never the default. Otherwise move it to the optional P.S., follow-up, or reply path.
38. **A slice-SHARED signal fact may ride inside the offer; per-contact reference stays banned (operator ruling, 2026-07-17).** A competitor name or a public customer complaint may appear in the body ONLY when the ENTIRE slice shares that fact (one campaign targeting "customers of Competitor X", one shared body naming X). That is slice-level shared copy, not personalization. Three binding bounds: it is NEVER the opener (Hard Rule 19 stands, so the fact rides inside the offer sentence, or in the P.S., the default home for relevance demoted from line one, a placement added (operator-approved Aaron alignment, 2026-09-21)); per-contact reference stays banned ("I saw *your* review from Mary") along with every observational opener; and the fact must be true of every contact in the slice, or the slice is wrong rather than the copy. Same targeting-versus-copy line the per-contact variables of Hard Rule 34 walk (`sells_to_vertical` may ride inside the offer sentence, never as an observation), extended to two more signals. Does NOT reopen observational per-contact copy personalization, which stays retired. Full rule: the Offer-First Copy Standard → Slice-shared signal facts in the body.
39. **Framework A controls the initial cold touch.** Stated once, at Hard Rule 27 and in `outreach-copy-framework.md`. This entry exists only so this rule number is not silently reused for something else; it does not restate the rule a third time. Its old hardness (never a question opener, exactly one question, exactly one merge token, a mandatory parenthetical, a hard 25-to-35 cap in every market) was relaxed to Aaron's stated positions (doctrine §13, ledger R07) at Hard Rule 27 and in the Framework A section (operator-approved Aaron alignment, 2026-09-21).

---

## AI Personalization Decision Framework

**Scope after Hard Rule 34's resolution (operator-approved Aaron alignment, 2026-09-21; widened by Aaron process alignment, operator directive 2026-09-22).** Beyond the first name, only the per-contact variables Hard Rule 34 names enter the copy (`sells_to_vertical`, `service_offered`, `own_best_client`), at most two per email, inside the offer sentence. `service_offered` and `own_best_client` may be cheaply derived by Claude sub-agents from the prospect's own site (`/personalization-subagent-pattern`), each with an evidence URL, as short factual phrases; never by an AI column in the list workbench. AI variables that only add relevance wording per contact (observation lines, context lines, relevancy nudges) are per-contact inserts, which Aaron superseded (ledger R13); use AI enrichment to pick the slice and the offer instead, and put slice-level context in the shared body. Everything below applies within that scope.

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

**At scale (20+ leads):** generate these per-lead AI variables with `/personalization-subagent-pattern` (parallel Task sub-agents) rather than by hand. It enforces the same QA above and the `spam-word-checker.md` rules, then feeds the variables back into this copy. For small batches, write them inline. Under Hard Rule 34 this per-lead generation serves enrichment that picks slices and offers, plus the at most two per-contact variables Hard Rule 34 allows; the per-row rendering bakes in the first name and those values, and nothing else.
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

Targeting and slicing only, never copy (ledger R13, Hard Rule 34; operator-approved Aaron alignment, 2026-09-21). These are per-contact observations: they choose the slice, the offer each slice gets, and who is emailed, never a line in the email. A fact true of every contact in a slice can still ride inside the offer sentence or the P.S. as shared slice copy (Hard Rule 38), never as a per-contact insert.

- tenure or role context
- recent content topic
- competitor or category context
- technology stack
- team growth signal
- account-specific research signal

### Per-Contact Copy Variables (at most two per email, inside the offer sentence; Hard Rule 34)

Aaron process alignment, operator directive 2026-09-22. Each carries a `_source` evidence URL; rows missing a value get the fallback body.

- `{{sells_to_vertical}}`: who the prospect sells to (existing column)
- `{{service_offered}}`: the prospect's own product or service, a short phrase (new column)
- `{{own_best_client}}`: the prospect's own best client, from their own site, used as the deliverable's target (new column, optional)

### AI-Generated Variables

Slice-level use by default (Hard Rule 34). The exceptions are the two Aaron runs per contact (Sep 21), which may enter the offer sentence as the per-contact variables above: customer type (as `sells_to_vertical`) and product or service category (as `service_offered`), each derived by Claude sub-agents, never by an AI column. The case study the deliverable targets is per contact as `own_best_client` where sourced, else set per slice. The company-name variable above is not a default in copy (Hard Rule 2).

- customer type (per contact as `{{sells_to_vertical}}`, Aaron process alignment, operator directive 2026-09-22)
- product or service category (per contact as `{{service_offered}}`, same directive)
- use case
- business context
- pain point: targeting and slicing only, never copy (ledger R13, Hard Rule 34); a model-generated pain point is a hypothesis, never a fact about a named person (doctrine §5 step 1)
- relevant observation: targeting and slicing only, never copy (ledger R13, Hard Rule 34)

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

- Email 1: the default 25-to-35-word band and 2 to 3 sentences, both counted on the body with the declarative P.S. outside the count (short, one job), one primary ask (Hard Rule 27). The one-liner shape may be a single sentence; a longer version runs only as a logged A/B arm (ledger R07); never so short it reads like a bump.
- Follow-ups should be short, usually under 50 words, with the same spec as Email 1: short, standalone, conversational, one clear CTA (doctrine §11).

### Structure

Aaron's four beats, "Catch their attention, drop the offer, clear CTA, bang." (doctrine §9), in the Framework A anatomy (structure updated; operator-approved Aaron alignment, 2026-09-21):

1. The offer, on line one: a free concrete deliverable, usually as a conditional, with "free" or "no cost" said out loud and the scope disclosure whenever it reflects the real process.
2. One soft permission CTA.
3. Optional P.S. doing ONE job: the relevance demoted from line one, one near-twin proof point, a casual risk-elimination or reason-it's-free line, or the deliverable's own terms (turnaround and their one small act, examples §1.5).

Every part must pass the Copy QA Gate. The old structure (situation recognition, value claim and proof, CTA) is archived at `outbound/_archive/aaron-alignment-2026-09-21/campaign-copywriting--email-structure-signature-and-openers.md`.

### Layout

Write the email as short blocks separated by blank lines, not one dense paragraph. The two canonical shapes, A/B-tested against each other (ledger R14):

```text
[The offer, the scope disclosure when real, and the soft permission CTA. The one-liner.]

[Optional P.S. doing one job.]
```

```text
[The offer and the scope disclosure when real.]

[The soft permission CTA.]

[P.S. doing one job.]
```

The pain-first or relevance-first two-liner (a pain or relevance line as its own first block, then the offer and CTA) runs only as the labeled R14 test arm, never the default (Hard Rule 25). A blank line between blocks is required. This is whitespace, not banned formatting. It is what makes the email scannable in a busy inbox and on a phone. The blank lines are part of the body: in the pre-written copy path they are stored inside the `email_*` CSV cell; in the template path they are in the step body.

### Signature (sign-off)

Email 1 (the single new thread) closes with the sender's first name and the company name, each on its own line: no job title and no location (Hard Rule 23; operator-approved Aaron alignment, 2026-09-21). Aaron's rule is the name and the company, no title, "Just super simple"; he also cuts the location and salesy sign-offs such as "Thanks for the time" (doctrine §9). First name only is the house reading of his "Just put your name" (operator-approved Aaron alignment, 2026-09-21). The same-thread follow-ups (Email 2, and Email 3 in a 3-step) sign with the first name only. Use this format for Email 1, plus the house phone line, which is added only when `sender_persona.phone` is set:

```text
{first name}
{company name}
{phone}          ← only when client has supplied a sender phone (sender_persona.phone)
```

**Legal requirements override style** (the doctrine's own rule, not Aaron's words: doctrine §11 states "Campaign caps, legal requirements, and opt-outs override." in the corpus author's voice): where a client's counsel or the recipient's jurisdiction requires a sender postal address or other identification, add exactly what is required as its own line and record it under Compliance in `copy.md` and in the activity log, as a compliance requirement, not a style choice. Confirm this per client before launch; the old city-and-country line was never a postal address.

In-thread follow-ups (Email 2 and optional Email 3) MUST still sign off, but the first name alone is enough. A follow-up with no sign-off is a hard failure. In the pre-write path, the follow-up steps are `{{email_2}}` / `{{email_3}}` followed by the first-name sign-off, set on the step.

- The first name is the sender persona's first name (from `client-profile.yaml` `sender_persona.name`). The company name comes from `client-profile.yaml` / the client's public contact page. No title line, so never invent a title for a fabricated persona. The old 3-line block (full name, title @ company, city and country) is archived at `outbound/_archive/aaron-alignment-2026-09-21/campaign-copywriting--email-structure-signature-and-openers.md`.
- Render each signature line on its own line. On platforms that store HTML bodies, separate the lines with `<br>` or separate `<div>`s. Never collapse the block onto one line. **On a sending platform that stores bodies as HTML (verified on one such platform 2026-06-19): a raw `\n` in the STATIC step text is collapsed by the platform's HTML store and renders run-together (`Jane DoePartnerships @ ExampleCoNew York, USA`), so the appended signature MUST use `<br>` line breaks, never `\n`.** This applies only to the static step text; the merge field `{{email_1_a}}` carries the per-contact body, whose `\n\n` block breaks such a platform DOES convert, so leave those as `\n` in the CSV. Resolve the sending platform from the stack contract (if the slot is empty, stop and route to `/stack-setup`), and always verify with that platform's own email preview on a real lead before launch.
- **Phone line (optional, house):** the phone line is added only when `sender_persona.phone` is set (in `client-profile.yaml`); append it as the last line, joined with the same `<br>`. Use ONE fixed number per persona: the persona is one real human, so it never shows two or three different numbers across the client's campaigns. If the client gives several numbers, the first is primary and the rest live in `sender_persona.phone_pool` as spares (swap if a number is ever flagged/burned). If `phone` is absent or `pending` ("Soon"), it is not set: the name-and-company block stands; never invent a number. The phone is static sender identity, configured once on the step exactly like the rest of the block.
- Do not spin, AI-vary, or A/B-test the signature (phone included).
- Place the signature in the sending tool, never in per-contact lead or CSV data. In the `variants.yaml` template path it is part of the campaign step body. In the pre-written copy path (see Pre-Written Email Copy Architecture) the body variable carries no sign-off, and the static signature block is appended below the variable on the sending-tool step, for example `{{email_1_a}}` followed by the name-and-company block (plus the phone line, and any Compliance line).

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
- built with 0 to 2 variables (operator-approved Aaron alignment, 2026-09-21: Aaron says "one to two variables" and also shows zero-variable subjects, doctrine §9)
- curiosity plus relevance, so a reader who does not care about the topic can tell (examples §3)
- tested last: subject lines are his lowest-leverage lever (doctrine §9)

Avoid:

- generic curiosity
- fake urgency
- promotional phrasing
- fake thread prefixes, and any implied emergency, invoice, account fault, or internal relationship that does not exist
- over-personalized scraped fields
- subject lines that promise more than the body delivers

---

## Opener Strategy

**The opener leads with the OFFER (Hard Rule 19).** Three bullets here used to say otherwise ("reference the recipient's situation first", "use a real signal when available", "avoid broad claims before the relevance signal"). That was signal-first ordering, and it is **RETIRED (2026-07-17)** with the Signal-First Opener Rule below: the offer comes first, not the situation or the signal. A slice-SHARED signal fact may ride inside the offer sentence (Hard Rule 38), never ahead of it.

Openers should:

- lead with the offer itself: a free concrete deliverable, with the dream outcome implied by what it contains (doctrine §4). The sentence shape follows the offer type (operator decision 2026-09-23, Aaron pre-launch gap audit; Aaron Sep 7, Sep 14, Sep 21). For a free deliverable, deliverable-first stays the default (his measured winner; Sep 7, "if we could [deliverable] at no cost ..."). For a free trial, a pilot or a pay-on-result offer, a conditional that names the outcome and pairs it with its risk term is the default, not an arm ("if I had a way to [outcome] ... and you only pay per [unit], would that be worth a quick test?", Sep 21; "if we could help you get [result] ... free for [x] days", Sep 14; doctrine §4, his Jun 29 script). Either shape may run the other as a labeled arm. The limits are unchanged: no proof claim on line one, no guarantee on the core service (pay only on a counted result is not a guarantee), and an outcome that is not a stretch (that last limit is the corpus's reading, not his words). Still banned: an outcome stated with no risk term, and the retired bundle of an outcome plus a named comparable and its number on line one (proof goes to the PS, one point).
- avoid greetings and pleasantries
- avoid sender-centered setup
- avoid generic AI summaries

If the offer could be sent by any competitor to any list, rewrite it (Aaron's company-swap test, doctrine §8). Note the level this test now runs at: the opener is deliberately SHARED across the whole campaign or slice (`{{first_name}}` optional, no company-name variable by default), so "it applies to many people" is by design and is not the failure. The failure is an offer so broad it is specific to no one. Make it specific to the slice, not to the individual.

---

## Signal-First Opener Rule (RETIRED 2026-07-17)

**The Signal-First Opener Rule and its four Execution Patterns are RETIRED (2026-07-17), superseded by the Offer-First Copy Standard's offer-led opener (Hard Rule 19).** They mandated that the first line reference the trigger that put the prospect on the list. Hard Rule 19 requires the first line to lead with the OFFER. No signal opens a cold email. The full retired rule and its four patterns are archived at `outbound/_archive/signal-first-opener-retired-2026-07-17/signal-first-opener-rule-and-execution-patterns.md` rather than quoted here, since a fully-quoted retired rule with no marker on its own subsections is exactly what let three live QA rows keep enforcing it after retirement.

**What survives.** Signals remain fully in play for **targeting**: which slice gets its own campaign, and which offer that slice gets. A slice-SHARED signal fact may also ride INSIDE the offer sentence (Hard Rule 38). What is retired is the signal as the OPENER, and per-contact signal copy (Hard Rule 34).

**The two subsections below are LIVE and unaffected by this retirement**, each under its own header:
- **Signal-First Anti-Patterns:** the observational-opener ban and the implication test. Still the canonical bank, still pointed to by `spam-word-checker.md`, `/personalization-subagent-pattern`, and `/campaign-strategy`. That ban is unrelated to the opener question and survives intact.
- **Signal Angle Library:** retrofitted (2026-07-17) to slice-level angle guidance. Its opener templates are retired (also archived, see that section below); the rest is live.

### Signal-First Anti-Patterns: the six ways a line leaks the signal (LIVE, survives the 2026-07-17 retirement above)

**This bank is NOT retired, and the marker above does NOT scope it.** It is the canonical enforcement home of the observational-opener ban and the implication test, and `cold-email-copy-best-practices.md`, `spam-word-checker.md`, `/campaign-strategy`, and `/personalization-subagent-pattern` all point here. That ban is independent of the offer-led-opener question: "I noticed" / "I saw that" / "Congrats on" announce scraping and add no information wherever they sit, so they stay banned in every email.

**The retirement changed WHERE this applies, not WHETHER.** No signal opens a cold email (Hard Rule 19: the opener is offer-led), and no line anywhere in the sequence may leak a signal in any of the six ways below. The bank now carries each pattern's Wrong lines and one fix for all of them; the "Right" rewrites that used to follow each Wrong line are retired (operator-approved Aaron alignment, 2026-09-21).

Below are the six ways it goes wrong, the fix, and the one test that catches all of them.

One rule sits under every pattern: **start from the IMPLICATION of the data point, not the data point itself.** Every "Wrong" line below describes what the sender saw. The prospect does not care that you found the information; they care what it changes for them. But an implication earns a place in copy only when it is true of every contact in the slice. A consequence you infer, or a model generates, is a hypothesis, never a fact about a named company, and it never becomes a question probe (doctrine §5 step 1: "Model-generated pain points are hypotheses, not facts"; doctrine §11; examples §8).

**1. Observational openers (the most common mistake).** Announcing that you saw the signal instead of stating what it implies.
Wrong: "I saw [Company] is hiring SDRs."
Wrong: "I noticed you recently raised a Series B."
Wrong: "I came across [Company] and noticed you're running HubSpot."
Wrong: "I saw that [Company] recently hired a new CRO."
Wrong: "I saw you sell to [vertical]." (and worse, reciting their customer list back: "I saw you sell to Acme, Globex, and Initech.")

**2. Complimenting the signal instead of using it.** Congratulating them on the event instead of extracting its consequence.
Wrong: "Congrats on the Series B! Really impressive growth."
Wrong: "Loved your recent LinkedIn post about [topic]."
Wrong: "Congrats on the new VP Sales hire at [Company]."

**3. Mentioning the signal but not extracting the implication.** Naming the fact and stopping, leaving the prospect to supply the "so what."
Wrong: "I noticed [Company] has a Head of Marketing role open."
Wrong: "I saw [Company] is using Salesforce."
Wrong: "I noticed [Company] recently expanded into the US market."

**4. Leading with generic industry pain before the signal.** Opening on a platitude any competitor could send, then bolting the signal on after.
Wrong: "Most companies at your stage struggle to hit pipeline targets. I saw [Company] has a VP Sales role open."
Wrong: "B2B companies in [industry] often deal with slow onboarding. I noticed [Company] is hiring a Customer Success Manager."
Wrong: "A lot of [industry] companies struggle with manual reporting. I saw you recently hired a new Head of Finance."

**5. Burying the signal at the end.** Leading with your pitch and tucking the relevance behind it.
Wrong: "We help B2B companies scale their outbound pipeline. I noticed [Company] is hiring an SDR which caught my attention."
Wrong: "Our platform helps finance teams close faster. By the way, I saw [Company] recently closed a funding round."

**6. Using the signal as a flattery bridge into a pitch.** Praising the signal as a runway into "we could help."
Wrong: "I saw [Company] was named one of the fastest-growing companies in [region]. That is really impressive, and it made me think you might be dealing with some scaling challenges we could help with."

**The fix for every Wrong line (operator-approved Aaron alignment, 2026-09-21):** a slice-shared signal fact rides inside the offer sentence or the P.S., true of every contact in the slice and never framed as this reader's own (Hard Rule 38); a signal that cannot meet that stays in targeting and out of the copy. The Right rewrites that used to sit here are archived at `outbound/_archive/aaron-alignment-2026-09-21/campaign-copywriting--signal-first-right-lines.md`: they stated unverified generalizations as facts about a named company ("3x headcount push", "data hygiene breaks down before quota does"), carried per-company facts, and ended on question probes (doctrine §5 step 1, §11; examples §8).

**The test to apply before writing any line that states a signal fact.** If you are describing what you saw, noticed, or came across, you are writing an observation, not a signal line. Rewrite it from the implication of the data point, not the data point itself, and only when that implication is true of the whole slice. The prospect does not care that you found the information. They care what it means for their situation.

### Signal Angle Library (slice-level angle guidance for the eight timing/context signals plus the sold-to axis). RETROFITTED 2026-07-17, LIVE

**This Library is LIVE and is NOT retired. What retired is its opener templates, not the Library.** Read the distinction before using it, because the two halves now have opposite statuses:

- **LIVE: the Library as slice-level angle guidance.** What a signal MEANS, which pain to lead with for that slice, and which proof to pick so it is recognizable to that reader. This is what `/campaign-strategy` consumes (its Signal-Driven Slice Library names this as the matching copy extract) and what the `/social-proof-bank` Trigger & Angle bank feeds with its `data_backed = y` rows. All of that stands.
- **RETIRED (2026-07-17): the opener templates below, as openers.** Each one puts the signal in the first line, which Hard Rule 19 no longer permits. They are retained as angle reference, not as lines to send.
- **LIVE: every caveat.** The anti-surveillance caveats (department headcount, sold-to customer lists), relationship truth on champion re-engagement, source truth on JD content, and the recognizable-proof rule are all bans. They survive intact and are enforced by the QA checklist.

**How to use it now.** It informs WHICH shared message a SLICE gets, never a per-contact opener. The signal picks the slice, the offer opens the email (Hard Rule 19), and the Library tells you which pain and which proof that slice's shared body should carry. Where a slice-SHARED signal fact belongs in the body at all, Hard Rule 38 governs: it rides inside the offer sentence, never Line 1, and never as this reader's own. Observational per-contact copy personalization stays retired (Hard Rule 34 allows only its at most two per-contact variables, inside the offer sentence), so the `[bracketed]` placeholders below are slice-level fills, not per-contact ones.

#### Retired opener templates (archived, not to be sent)

The nine per-signal opener templates that used to live here are retired with the Signal-First Opener Rule above (each puts the signal in Line 1). They're archived at `outbound/_archive/signal-first-opener-retired-2026-07-17/signal-angle-library-opener-templates.md`, preserved for their angle logic (which pain a signal implies, which proof fits it), not as sendable copy. The matching TAM slices are in `/campaign-strategy` (Signal-Driven Slice Library); full slices, combos, and acquisition paths are in `signal-strategy-playbook.md`. The nine signals covered: job change, department headcount, headcount growth, founded year, ads intelligence, champion re-engagement, jobs data/JD content, profile/work history, and who-they-sell-to. Every caveat attached to each signal (anti-surveillance on department headcount and the sold-to customer list, relationship truth on champion re-engagement, source truth on JD content, one work-history reference per email) is still LIVE and still enforced by the QA checklist below, even though the opener line itself is retired. On the sold-to axis, `sells_to_vertical` alone may ride inside the offer sentence as a per-contact variable (Hard Rule 34; Aaron process alignment, operator directive 2026-09-22), as the audience the deliverable serves ("...in front of 50 [sells_to_vertical] buyers"), never as "I saw you sell to X"; likewise `own_best_client` names one client as the deliverable's target, never a list of their customers read back.

---

## Opener Framework (Email 1 and Email 3)

The current rule is short: every new-thread email opens with an OFFER-LED opener that leads with the offer itself (a free concrete deliverable with the dream outcome implied by it, or, for a trial, pilot or pay-on-result offer, the outcome named with its risk term, either shape able to run the other as a labeled arm, doctrine §4; operator-approved Aaron alignment, 2026-09-21; operator decision 2026-09-23, Aaron pre-launch gap audit), per the Offer-First Copy Standard and Hard Rule 19, never a warmup or self-introduction. The opener is shared across the whole slice; the per-row fills are an optional `{{first_name}}` (it may open the email) and, inside the offer sentence, at most two per-contact variables (Hard Rule 34; Aaron process alignment, operator directive 2026-09-22). There is no per-contact opener generation and no personalization-source priority order.

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
- Aaron's own bans on the same theme (operator-approved Aaron alignment, 2026-09-21; doctrine §9, §11; examples §7.1, §8): "I know you're busy", "just nudging", "did you see my last email?", any line that names the non-reply, "recognize you're probably slammed", introducing yourself or your company, and any preamble token before the offer

Why these fail on a cold list: most recipients never registered your first email, so "following up on my last" reads as "what email?"; the few who saw it and ignored it are reminded they ignored you; and these are the most pattern-matched phrases in the inbox, so the brain files the message as an automated sequence before reading the next line. (These extend the observational-opener bans in `spam-word-checker.md` and the Signal-First Anti-Patterns bank above, which survives the 2026-07-17 signal-first-opener retirement.)

**Aaron's voice spec (doctrine §9, Voice).** Casual first person, peer to peer. A "text from a friend" feel, but competent: natural does not mean sloppy, and there is no false intimacy. Plain words, no jargon, never self-declared uniqueness. It must not read like a template, because a reader who recognizes a template stops reading however good the offer is (doctrine §1).

### The said-out-loud test (apply to every cold email and follow-up)
Read the first two lines out loud. Would a busy, competent person who actually knows this world say this to a peer? If it sounds like a brochure, a press release, or a textbook explaining how the industry works, it fails. Rewrite until it sounds like a real person talking. A line passes only if it has at least one of:
- **A point of view**, not just a fact ("quietly," "never notice," "only ever slips one way")
- **Spoken rhythm** (contractions, a short punchy clause, the cadence of speech)

(A third option, an honest frame about the cold contact such as "quick one," is retired: it is a preamble before the offer, doctrine §9; operator-approved Aaron alignment, 2026-09-21.)

**The statement/explainer trap (the most common failure mode, and the one that produced the worst prior copy).** An opener that explains how the industry works (a true, neutral, textbook sentence with no point of view) is the most common way a cold email reads as vendor wallpaper. It is grammatically clean and factually correct, which is exactly why it slips through unnoticed. It still fails: it is picture-painting before the offer, which Aaron bans (doctrine §9). The fix is not a question, since a question-form pain opener is banned too; the fix is to open on the offer and demote any relevance to the P.S. (the opening-line swap below). Client-agnostic example, WRONG (industry explainer): `Marie, smart meters and dynamic tariffs mean every read has to land cleanly in what the customer gets charged.` The old RIGHT example, a question-form opener, is archived at `outbound/_archive/aaron-alignment-2026-09-21/campaign-copywriting--human-voice-cta-and-follow-ups.md` (operator-approved Aaron alignment, 2026-09-21).

### Where the voice lives
Not in a preamble before the point: every word before the offer is a word that gets you deleted, because you have not earned the warmup. The voice goes INTO the offer sentence and the P.S. Same facts, with a person behind them, and the offer first. Aaron's own before/after, his most transferable copy move (examples §1.1, `[AS]`):

> **Before (rejected):** "Hey first name, notice you're running static ads on Meta, so thought I'd reach out if we could ideate, script, edit, and record one free UGC ad creative for you. Would that be worth sharing more?"

> **After (his model):** "first name, if we could ideate, script, edit, and record one free UGC ad creative for you. Would that be worth sharing more? PS, thought it'd be relevant since you're currently running ads on Meta and 100% of them are static."

The relevance was not deleted; it was demoted to the P.S. The scope disclosure sits in prose ("ideate, script, edit, and record"), there is one free deliverable, and leading with the offer gets to the reader before they can fall off (doctrine §9). Two notes so the exemplar is not over-read. His After version opens on the bare name, which is allowed: the first name is optional and may open the email, and his first-name-second move (doctrine §9) is an alternative trick, not a rule. His P.S. sits outside the 25-to-35 body count; the body here runs about 22 words, a little under 25, which passes because it still carries the whole offer. And the portability rule applies (doctrine §9): copy the shape, never these sentences. The old flat-to-voice pair (a pain line that also labeled the reader "MSPs") is archived at `outbound/_archive/aaron-alignment-2026-09-21/campaign-copywriting--human-voice-cta-and-follow-ups.md`.

### The two levers (optional: test them, never assume)
1. **Inject a point of view**: a fact states what is true, an observation states what you think about it. It lives inside the offer sentence or the P.S., the way "same shape, same buying signals" in Aaron's winner is elaboration that "pushes that value forward" (examples §1.5), never in a line placed before the offer.
2. **Spoken rhythm**: use contractions ("you're," "it's," "they'll"); vary sentence length (a short clause after a longer one creates a human beat); cut connective fluff ("furthermore," "additionally," "as such," "in order to").

The micro human-framing token ("Marie, quick one.") that used to be lever 1 is retired: it is a preamble before the offer (doctrine §9; operator-approved Aaron alignment, 2026-09-21). The old lever list and its pain-line examples are archived at `outbound/_archive/aaron-alignment-2026-09-21/campaign-copywriting--human-voice-cta-and-follow-ups.md`.

### Email 1 examples
Aaron's curated exemplar set lives in `outreach-copy-framework.md` under `## Framework A (house name): the direct concrete offer, Aaron's measured winner anatomy`. The examples §1.5 winner and its loser are quoted in the Offer-First Copy Standard above, and the §1.1 swap just above. The old four-vertical flat-to-voice set is archived at `outbound/_archive/aaron-alignment-2026-09-21/campaign-copywriting--human-voice-cta-and-follow-ups.md`: every "voice" line in it opened on pain, observation, or proof instead of the offer (operator-approved Aaron alignment, 2026-09-21).

### Follow-up examples (the trap → what works)
- Trap (banned): "following up from my message a few days ago" / "just circling back on the below" / "bumping this to the top of your inbox." It fails because she likely never saw email 1, and the phrasing screams sequence.
- What works: a standalone message that does one job and never mentions the earlier email (doctrine §11). Aaron's own pair (examples §7.1, `[AS]`):

> **Bad:** "just following up on the above, interested in having me create that for you"
> **Good:** "interested in a free UGC ad creative"
> **Good (variant):** "interested in a 2-minute video that explains our XYZ process"

His de-escalation form, the same offer at lower friction, is the Loom follow-up: "Should I send you a two-minute Loom video showing you exactly how this works?" (examples §7.1). Shape, not sentences (doctrine §9). The old "works" list ("didn't want this to get buried", "one more nudge and I'll leave you alone", "figured this was worth a second try", "last one from me on this") is retired because each one names the non-reply or reads as a closeout (doctrine §11); it is archived at `outbound/_archive/aaron-alignment-2026-09-21/campaign-copywriting--human-voice-cta-and-follow-ups.md`.

### Reconciling with the offer-led opener (CORRECTED 2026-07-17)

**Superseded text, retained so the correction is visible:** this section used to say that when a real signal exists, the *signal still leads the first line* ("Marie, saw the SDR role's been open 50 days. Quick thought on that."). That contradicts Hard Rule 19 and is **RETIRED** with the Signal-First Opener Rule (2026-07-17). It also modelled an observational opener ("saw the SDR role..."), which was banned independently the whole time.

**The rule now:** the **offer leads the first line, always**, signal or no signal (Hard Rule 19; the only departures are the labeled variants, logged as test arms). The human touch lives in HOW the offer is voiced, never in a warmup before it and never in a signal bolted in front of it. No framing token delays the offer (retired; operator-approved Aaron alignment, 2026-09-21). Where a slice-SHARED signal fact earns a place, it rides inside the offer sentence or in the P.S. (Hard Rule 38), never ahead of the offer.

There is no longer a signal/no-signal branch here: every list, broad or sliced, gets the offer-led opener, so human voice plus the offer carry the open in both cases. Both levers matter, because the offer and the voice are the only things doing the work.

### Discipline (do not pick by vibe)
Whether a given human-voice variant beats the clean version is testable, and good operators disagree. Do not assume any variant helps. Run the clean version against the human-voice version (same offer, same CTA, at least 25 leads each) and judge on positive-reply rate with time-agreed replies per 1,000 first touches beside it; a winner must not lose on the meetings number (doctrine §0, §2 step 5). **The hard rule is the prohibition and the said-out-loud test; a specific lever is a hypothesis, not a law.**

---

## CTA Strategy

Use one value-backed CTA. Low friction matters, but a CTA that gives the prospect no reason to answer is weak.

Acceptable CTA types:

- value exchange
- resource offer
- routing question
- conversation (never Email 1's ask: if an offer seems to need a meeting ask, fix the offer, doctrine §2, and never downgrade Email 1 to a meeting ask, ledger R17; operator-approved Aaron alignment, 2026-09-21)
- concrete next-step recommendation

Email 1 uses Framework A: name the free deliverable first (for a trial, pilot or pay-on-result offer, the outcome with its risk term; operator decision 2026-09-23, Aaron pre-launch gap audit), include the scope disclosure whenever it reflects the real process, and end with one soft permission CTA (operator-approved Aaron alignment, 2026-09-21). The ask is permission to send or show something, not a meeting (ledger R17).

**Email 1 (the new thread): one soft permission question, by default.**

- `Would that be worth sharing more?` (the default, Aaron's signature ask, examples §4)
- his variants: `Is that worth sharing more?`, `Mind if I send it to you?`, `Do you mind if I send it to you?`, `Worth sharing more?`, `Would that be worth sending over?` (the last two normalized to sentence case and a question mark; examples §4 writes them without); for a free tool or trial, `Open to testing it for free?` (Jul 13) and `Would you be open to trying it out?` (Sep 14), normalized the same way, with his Sep 14 statement second CTA confined to the R19 longer arm (Hard Rule 32)
- his asks added by Aaron process alignment, operator directive 2026-09-22: `Would that be worth a quick test?` (pilot, trial and pay-per-result offers, Sep 21), `Would that be useful?` (examples §1.5), `Would that be helpful?` (examples §2.6)
- house variants: `Would that be worth hearing more?`, `Open to it?`, `Can I send it over?`

The full whitelist is at Hard Rule 32. The statement-only `Just reply "Yes"...` pattern remains available after the initial cold touch, but not in Email 1, whose default close is one soft permission question. A CTA-free Email 1 runs only as the labeled no-CTA test arm (examples §4), and a soft conditional statement close ("... if you're open to that kind of thing", Sep 21) only as its own labeled arm.

Acceptable permission-question alternatives (use when they read more naturally):

- `Can I send it over?`
- `Can I share it?`
- `Would it help if I sent that over?`

**Follow-ups (Email 2, and Email 3 in a 3-step): a forward-looking question or a conditional statement re-offer.**

- a light re-offer of that thread's deliverable framed as a question (`Should I pull it together for your accounts?`, `Would it help to see that breakdown?`)
- a routing question tied to the thread's angle
- a conditional statement re-offer at lower friction, no question mark needed, as in Aaron's Sep 21 Email 2: "If it's easier, I can send over a quick video elaborating on how we ..." (Aaron process alignment, operator directive 2026-09-22; shape, not sentence)

The friction ladder (doctrine §11): the heavier ask first and the lighter one second (for example a short video that shows how it works), with the reverse allowed as a test.

Avoid (needy / obligated / presumptuous):

- `Want me to send it?`
- `Want us to send it?`
- `Want me to share it?`
- `Interested?`
- `Let me know if you'd like…`
- `Worth a look?`
- CTAs that only ask whether the problem exists
- CTAs that make the prospect feel desperate for the sender's help

Harder CTAs are allowed only outside Email 1 (ledger R17; operator-approved Aaron alignment, 2026-09-21), and only when they provide clear direction and the strategy deliberately accepts the friction, such as a specific call, review, or next-step recommendation.

The recipient should be able to answer quickly. Avoid CTAs that require scheduling, multiple decisions, or a large commitment unless the user has explicitly chosen that approach.

Each follow-up takes one of Aaron's three directions (Sep 21; ledger R12, doctrine §11; Aaron process alignment, operator directive 2026-09-22): strip it back to the same offer with a lower-friction ask (a video, a short written version), lean on a different value prop or mechanism for the same offer, or add to it (a real concern pre-handled, a benefit layer, a risk reversal, the reason it's free). Do not keep offering the same vague note just because it is low friction, and never repeat Email 1 at the same friction (operator-approved Aaron alignment, 2026-09-21).

**Every email gets a CTA (follow-ups included).** Email 2 and optional Email 3 are not exempt. They close with a SOFT CTA, a light re-offer of Email 1's deliverable, a small forward-looking question, or a conditional statement re-offer ("If it's easier, I can send over ..."), so the reader always has a next step. A support email that trails off into a dead-end soft close ("happy to walk through it whenever," "the note still stands." with no ask) leaves the reader nothing to answer and fails QA. Re-offer, do not re-pitch; ask, do not nag. Email 2 re-offers Email 1's deliverable at lower friction, through a different value prop, or with something added, and Email 3 takes another of the three directions. This is within-thread reinforcement and matches Hard Rule 21, which since 2026-09-21 allows a lower-friction restatement of the same offer and forbids two steps sharing a CTA sentence (this resolves the older tension between this paragraph and the "same mechanism" test). Acceptable soft-CTA phrasings: `Should I pull it together for your accounts?`, `Should I sketch that out?`, `Open to that?`. Keep them off the banned `Want me to send it?` / `Worth a look?` stems.

---

## Follow-Up Sequence Framework

Every campaign is a single thread with 2 to 3 steps (Hard Rule 18): Email 1 plus one or two same-thread follow-ups. Two emails by default at every TAM size; a third only in a genuinely small market (roughly under 3,000 qualified contacts, a house threshold) or as a tested arm (supersedes the sequence-length-by-TAM table); a new-thread final follow-up only as a planned, logged arm. Aaron's own ceiling agrees: two emails, maybe three at the absolute most (examples §7.1). Each follow-up must earn its place, because his study puts 58% of losers in follow-ups (doctrine §9). Cadence Day 0 and Day 3; when a third runs, Day 0, 3, 6. Send Monday to Friday. His entire evidence is 2 to 3 days between emails (doctrine §11), so each follow-up's `delay_days` is 3, read as the wait after the previous step (Email 3's delay was 7; the per-step reading is flagged for confirmation on the first upload in the `variants.yaml` schema note). (Aaron process alignment, operator directive 2026-09-22.)

### Email 1 - Thread 1 New Thread

Use a new subject, an OFFER-LED opener (leads with the offer), the primary test angle, and the clearest campaign-plan offer, in three variants by default (A, B, C, each of B and C changing one variable against A). Build the opener per the Offer-First Copy Standard. (Question-first openers are retired with proven-mode.)

### Email 2 - Thread 1 Support

Use the same thread. Email 2 has the same spec as Email 1: short, standalone, conversational, one clear CTA (doctrine §11). It does one job (useful context, one meaningful point, a lower commitment, or a real objection) in one of three directions (Aaron process alignment, operator directive 2026-09-22): strip it back to the same offer with a lower-friction ask, lean on a different value prop or mechanism for the same offer, or add to it (a real concern pre-handled, a benefit layer, a risk reversal, the reason it's free, or the single proof point Email 1 deferred, examples §6). If Email 1 was already stripped back, take one of the other two. Close with a soft CTA (a light re-offer of Email 1's deliverable, a small forward-looking question, or a conditional statement re-offer such as "If it's easier, I can send over a quick video ...") so the reader always has a next step; never trail off into a dead-end soft close. Treat it as possibly the first email read: never narrate that it is a follow-up, never name the non-reply, and never assume they scroll up. No storytelling (doctrine §9). Updated (operator-approved Aaron alignment, 2026-09-21); the old "proof, story, useful context" wording is archived at `outbound/_archive/aaron-alignment-2026-09-21/campaign-copywriting--human-voice-cta-and-follow-ups.md`.

### Email 3 - Third Follow-up (a genuinely small market or a tested arm only)

By default use the SAME thread as Email 1 and Email 2, with an empty subject (Hard Rule 18 and the `variants.yaml` schema). Take a different direction from Email 2 (strip back, a different value prop or mechanism, or add a different layer such as the biggest benefit, a risk reversal, or the reason it's free), with a CTA sentence of its own (Hard Rule 21). It must still stand alone as a message, because the reader may not have read the earlier two. **As a logged arm only**, it may be planned as a new thread: its own 2-to-4-word lowercase subject, not a thread reply, a different variation of the same offer or a different pain (Aaron, Apr 13; Aaron process alignment, operator directive 2026-09-22; supersedes "never a fresh new-thread attempt", 2026-07-05). No upload path in this workspace wires that non-threaded step yet, so the threaded version ships until one does (Hard Rule 18). (Question-first openers are retired with proven-mode.)

### (No Email 4: the 4-email / two-thread structure was retired 2026-07-05)

There is no fourth step. Every campaign is ONE thread with 2 to 3 steps by default, and never more than three touches even when the final follow-up is planned as the logged new-thread arm.

---

## Split Testing Rules

When entering a new audience or testing a new signal, test meaningfully different Email 1 angles before scaling.

**Aaron's testing order (doctrine §5 step 9; operator-approved Aaron alignment, 2026-09-21).** The offer first, then the positioning of the offer, then the CTA and delivery; data source and segment are tested in parallel from launch; subject lines, his lowest-leverage lever, go last (doctrine §9). In an offer-validation wave the variable is the offer itself: the primary offer (`offer.lead_magnet`) and its validation arms (`offer.validation_arms`, written by `/lead-magnet-brainstorm`) run in the whole qualified TAM placed by fit (each offer where its own fit filters pass, equal cells on shared ground), launched together on the same copy skeleton, the primary with no head start, each arm judged on its own, and each cell's Email 1 carries its own three copy variants (Aaron process alignment, operator directive 2026-09-22); `/campaign-strategy` owns how arms are wired and judged. Judge winners on meetings, not replies: time-agreed replies per 1,000 first touches beside positive-reply rate, and a winner must not lose on it (doctrine §0, §2 step 5).

Rules:

- Keep structure consistent across variants.
- Change one variable at a time, not every variable at once (doctrine §5 step 9; Mar 9: "change one minute variable in every single one").
- **Email 1 runs three variants by default** (`email_1_a`, `email_1_b`, `email_1_c`; Sep 21: "variant one, variant two, variant three"): A is the control, and B and C each change exactly one variable against it. More letters are allowed when a test needs them, one variable each. (Aaron process alignment, operator directive 2026-09-22; supersedes two Email 1 variants.)
- Map each variant to one pain or value category.
- Do not split-test failed deliverability.
- The variant test and the QA standard ride Email 1; the follow-ups are single-variant same-thread replies (Sep 21 shows three step-one variants and one step two).
- The two canonical shapes (the one-liner vs two lines plus a P.S., ledger R14) are a standing A/B pair and a natural B or C; the proof P.S. against no P.S. is another, whenever on-file proof exists. Any other labeled variant runs only as a logged arm.
- Switch off a losing Email 1 variant in flight only on the read rules in `/experiment-design` (its ~1,300 first-touch floor, then the sequence plus grace), never on a ratio against the leader.
- Each follow-up must move the conversation (strip it back, a different value prop or mechanism, or add to it, Hard Rule 21), not a minor rewrite of Email 1's CTA.
- Every variant must pass the Copy QA Gate.

---

## Spintax Rules

Use spintax only after final copy is approved.

- Every branch must pass `spam-word-checker.md`.
- Every branch must preserve the same meaning.
- Do not create so many branches that quality becomes uneven.
- Do not spin variables into broken grammar.
- **No spintax on any Email 1 variant column** (`email_1_a`, `email_1_b`, `email_1_c`, and any further declared letter). Each variant is fixed per row at build time and changes exactly one variable against A, so spinning it would blur the one-variable test the three variants exist to run. Spintax may apply to the shared follow-up text (`email_2`, optional `email_3`) only, in the locked sending platform's own variation syntax, and never to an `{{email_*}}` token itself or the signature (Aaron process alignment, operator directive 2026-09-22).

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
| First line carries NO signal (the signal-first opener is retired 2026-07-17; Hard Rule 19 governs). Any slice-shared signal fact rides INSIDE the offer sentence or in the P.S., is true of every contact in the slice, and is never framed as this reader's own (Hard Rule 38) | |
| Offer passed the Offer Architecture gate before writing, including the "why not?" test and the farming-interest check (doctrine §4) | |
| Email 1 uses an offer-led opener (leads with the offer), a labeled opener arm aside (Hard Rule 19; the offer then arrives in the very next sentence; operator decision 2026-09-23, Aaron pre-launch gap audit): by default a free concrete deliverable with "free" or "no cost" stated; no greeting word ("Hey", "Hi", "Hello"); a first name is optional and may open the email. The sentence shape follows the offer type (operator decision 2026-09-23, Aaron pre-launch gap audit; Aaron Sep 7, Sep 14, Sep 21). For a free deliverable, deliverable-first stays the default (his measured winner; Sep 7, "if we could [deliverable] at no cost ..."). For a free trial, a pilot or a pay-on-result offer, a conditional that names the outcome and pairs it with its risk term is the default, not an arm ("if I had a way to [outcome] ... and you only pay per [unit], would that be worth a quick test?", Sep 21; "if we could help you get [result] ... free for [x] days", Sep 14; doctrine §4, his Jun 29 script). Either shape may run the other as a labeled arm. The limits are unchanged: no proof claim on line one, no guarantee on the core service (pay only on a counted result is not a guarantee), and an outcome that is not a stretch (that last limit is the corpus's reading, not his words). Still banned: an outcome stated with no risk term, and the retired bundle of an outcome plus a named comparable and its number on line one (proof goes to the PS, one point). | |
| Any labeled variant (the R14 pain-first pair, the offer-sentence shape that is not the offer type's default (operator decision 2026-09-23, Aaron pre-launch gap audit), no-CTA, longer, relevance question opener, soft conditional statement close, no-number, proof P.S. against no P.S., context line, call-out) is recorded in `copy.md` as a logged test arm or awareness-driven choice | |
| Email 1 has three variants by default (`email_1_a`, `email_1_b`, `email_1_c`; more letters only when a test needs them), each of B and C changing exactly one variable against A | |
| Edited in Aaron's order (offer, unsupported facts, output and effort, one next action, filler, then length and style), with the per-line QA loop (doctrine §9) | |
| Checked against the rejection bank (`aaron-examples.md` §8) and the kill-list (doctrine §9) | |
| Pre-send test passed: I would answer this email (doctrine §9) | |
| Slice-level angle (which pain and which proof this slice leads with) connects to the email's core pain angle; no per-contact opener personalization (retired); at most two per-contact variables, sourced, inside the offer sentence (Hard Rule 34) | |
| No observational opener phrases | |
| No hallucinated facts | |
| Variables formatted correctly | |
| Recipient-centered copy, written 1-to-1 (first-person "I"; "we/us" for genuine team/company facts, including the offer conditional and the scope disclosure when they state the team's real work, Hard Rule 33) | |
| Email 1 ends with one soft permission CTA (default `Would that be worth sharing more?`, whitelist at Hard Rule 32, including `Would that be worth a quick test?`, `Would that be useful?`, `Would that be helpful?`), or the conditional statement in its labeled arm, after the free deliverable and, when real, the scope disclosure; no stacked asks; no statement-only `Just reply "Yes"...`, `Want me to…`, `Want us to send…`, `Interested?`, or `Worth a look?` | |
| CTA references a confirmed deliverable | |
| Length: the body (P.S. excluded) in the default 25-to-35-word band; longer only as a logged A/B arm for a solution-aware or saturated market (ledger R07); never so short it reads like a bump (no padding, no long-but-low-signal) | |
| Proof: at most one point, in the P.S. or Email 2, never lines one or two; near-twin, same-mechanism, plain named numbers, no acronyms (doctrine §9, examples §6) | |
| Reads naturally aloud | |
| Subject line matches the body | |
| No colon-as-runway sentences | |
| No comma-wrapped company descriptors | |
| Single thread, 2 to 3 steps (Email 1 + 1-2 same-thread follow-ups); 2 by default at every TAM size, 3 only in a genuinely small market (roughly under 3,000 qualified contacts) or as a tested arm; a new-thread final follow-up only as a planned, logged arm; never more than three touches; cadence Day 0, 3 (6); sending Monday to Friday (Hard Rule 18) | |
| The variant test rides Email 1 (three variants by default); the follow-ups are single-variant | |
| Each follow-up moves the conversation (strip it back with a lower-friction ask, a different value prop or mechanism for the same offer, or add to it), never a re-send of Email 1 at the same friction; no two steps share a CTA sentence (Hard Rule 21) | |
| The reply after a yes matches the offer type (Hard Rule 36): a promised asset delivered first with no times; a direct, trial or service yes gets two times plus the calendar and the 5-minute call; `offer.qualification` applied to costly front ends | |
| Email 2 (and Email 3 in a 3-step) are same-thread follow-ups that move the conversation and stand alone: none references the earlier email, names the non-reply, or assumes they scroll up (doctrine §11) | |
| Email 1 closes with first name plus company name, no title and no location, plus the phone line only when `sender_persona.phone` is set and any legally required line recorded under Compliance (Hard Rule 23); the follow-ups (Email 2 and optional Email 3) may sign off with the first name alone, but a sign-off is mandatory on every email | |
| Signature lives on the sending-tool step, not in any email body or CSV column | |
| Emails formatted as short blocks separated by blank lines, not one dense paragraph: Email 1's offer plus CTA as one block and an optional P.S. as its own block (Hard Rule 25) | |
| Grammar clean and natural, no awkward over-compression or dropped connective words (a deliberate spoken sentence start passes, Hard Rule 26) | |
| Email 1 follows the Framework A default anatomy (Hard Rule 27): 25 to 35 body words and 2 to 3 body sentences, the declarative P.S. outside both counts (the one-liner may be one sentence), one primary ask, the scope disclosure whenever it reflects the real process; subject 2 to 4 lowercase words with 0 to 2 variables; follow-ups under 50 words | |
| Pre-written path: every row's `email_*` column (`email_1_a`, `email_1_b`, `email_1_c` and any further declared letter, `email_2`, optional `email_3`) carries its variant's shared slice body, varying only the baked-in first name and at most two per-contact variable values inside the offer sentence; rows missing a value carry the approved no-variable version; no blank rows (Hard Rule 34) | |
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

Reading note (added 2026-09-21, Aaron alignment; the weights are unchanged): "Proof quality" scores whether the claims are believable. In Aaron's method that comes mostly from shrinking what is judged to the deliverable and weaving a near-twin case in (doctrine §4), so an Email 1 that carries no proof, or defers its one proof point to the P.S. or Email 2, is not penalized for it (doctrine §9, ledger R08).

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
11. The offer is the 80/20: fix the offer before any copy edit, and judge the result on meetings, not replies (doctrine §2, §3).

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
| 1. Variation | that platform's native spintax/variant workflow, written in that platform's own variant syntax, on the follow-up text only (never on an Email 1 variant column; Spintax Rules) |
| 2. Upload | that platform's native campaign-upload workflow, in that platform's own import format (custom-field naming, variant slots, body/HTML shape), with one Email 1 variation per declared column (`email_1_a`, `email_1_b`, `email_1_c` by default) on an even split, stopping rather than dropping Variant C (Split testing, above), and the schedule Monday to Friday |

What the upload wiring cannot do yet: no upload path in this workspace wires a non-threaded final step, so a new-thread final follow-up arm stays planned in `copy.md` and the threaded version ships (Hard Rule 18). (Aaron process alignment, operator directive 2026-09-22.)

Never suggest or assume any platform other than the one locked in `run_state.sending_platform`. Only ask to change platforms if the locked path is impossible or the user explicitly asks.

If copy fails QA, rewrite through this skill before moving forward.

## Related Skills

- `/campaign-strategy`: produces the campaign brief this skill writes from
- `/icp-onboarding`: produces client profile context
- `/market-evidence`: owns `_research/pain-clusters.md` and its Language bank, the buyer's words this skill borrows. Its feedback mode routes buyer language that beats the live copy's wording back here for the next wave's copy
- `/cold-email-campaign-sequence-docx-presentation`: creates the client-facing campaign sequence DOCX after approved YAML exists
- `/lifecycle-copy`: writes the post-sequence lifecycle copy (`followups.yaml`, `interested-reply.md`, `pre-call.md`). This skill writes the main cold sequence (`variants.yaml`); `/lifecycle-copy` continues it into follow-up, interested-reply, and pre-call flows. Run it before the lifecycle DOCX skills below.
- `/cold-email-followups-docx-presentation`: packages the no-reply follow-up DOCX from `followups.yaml` (produced by `/lifecycle-copy`)
- `/interested-replies-docx-presentation`: packages the positive-reply handling DOCX from `interested-reply.md` (produced by `/lifecycle-copy`)
- `/pre-call-nurture-docx-presentation`: packages the booked-call nurture DOCX from `pre-call.md` (produced by `/lifecycle-copy`)
- `/campaign-approval-brief`: creates the client-facing decision brief explaining why this campaign path was chosen
- `/spam-word-checker`: mandatory formatting, CTA, opener, and voice guardrail
- `/ask-aaron`: advisory persona consult on offers and copy (offer pressure-testing, line-by-line teardowns, follow-up sequencing); never relaxes this skill's governed contract. Since the operator-approved Aaron alignment (2026-09-21), the hardness this skill once added to Aaron's own findings (a universal cap, exactly one question, exactly one merge token, a mandatory parenthetical) is relaxed to his stated positions, while the house safeguards that are not his (capability truth, the Proof-Asset Gate, deliverability formatting, compliance, the QA gates) stay, labeled house. The rejection bank in its `aaron-examples.md` §8 is part of this skill's Copy QA Gate. Any further departure from this contract for a governed campaign still has to come back here as an explicit approved exception
- `/email-waterfall`, `/list-quality-scorecard`: produce and grade the verified slice the List Gate requires before any copy
- `/stack-setup`: resolves the capability roles this skill needs (sending platform, email verifier, waterfall enricher) when the stack contract leaves one empty

