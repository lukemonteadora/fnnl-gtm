**The house brainstorm procedure, moved verbatim from SKILL.md on 2026-09-28. Read it only when the operator asks for the full offer brainstorm ("run the full offer brainstorm"); its output then goes to Aaron as input, and Aaron still decides.**

The original frontmatter description, which summarizes this flow, is kept verbatim as the **From the former description** line at the top of SKILL.md. The Research QA verdict check that opened Required Input stays in SKILL.md and runs first on every path.

## AI/API Routing

All ideation runs in Claude Code (no-AI-API rule, operator directive 2026-09-22): no outside AI provider and no API key. Synthesizing the offer-intelligence brief (its Candidate Generation Input rows, buyer-pain vectors, and saturation map) and archetype-fit reasoning happen in the session; when that context is too large for one pass, fan it out to Claude sub-agents per `/personalization-subagent-pattern` (disjoint slices, one output file per agent, merge and dedupe). Strict rubric scoring and JSON output are done in the session against the rubric below. This skill reads existing research; it does not run new web research (that lives in `/offer-intelligence`). CTA wording stays at direction level for `/campaign-copywriting` (written in the native Claude Code session).

## Required Input (the house flow's brief inputs)

These paragraphs sat under Required Input in SKILL.md, right after the Research QA verdict check.

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

Under `auto_execute` (the new-client default since 2026-09-24), do not ask: answer each item from the profile, `website-profile.md` (the live website scrape: products, pricing, proof and the offers the client already runs, per `outbound/reference/client-website-scrape.md`) and the offer-intelligence brief, and put any item none of them answers on the next checkpoint. A capability the website claims but nobody has confirmed stays a hypothesis here too. Under `review_gates`, ask one at a time using Claude Desktop native Interactive Inputs / Choice Prompts. When the profile, website, or offer-intelligence brief gives a likely answer, pre-fill it as the recommended option.

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
