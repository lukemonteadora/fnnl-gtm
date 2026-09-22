---
name: outreach-copywriting
description: Creates and QA-checks first-touch cold written outreach across cold email, LinkedIn DMs, LinkedIn connection notes, SMS, X DMs, and other prospecting channels. Use whenever writing, revising, reviewing, serializing, or preparing initial outbound copy for any channel. Enforces the Framework A Email 1 contract (Aaron Shepherd's measured winner anatomy, aligned 2026-09-21) as a hard rule and routes full cold-email campaign work through campaign-copywriting.
---

# Outreach Copywriting

Use this skill for the first written cold touch in any channel.

## Required References

Read and apply these before drafting:

1. `outreach-copy-framework.md` (the Email 1 contract, B1 to B15, and Aaron's verbatim exemplars)
2. `/spam-word-checker`

For a full cold-email campaign, also run `/campaign-copywriting`. Its list, offer, proof, fulfilment, sequence, artifact, and platform gates remain mandatory.

## Inputs

Confirm or derive (Aaron asks for the same kind of inputs before he writes: the front-end offer, who we're reaching out to, the core outcome, social proof, and case studies, doctrine §9):

- channel
- audience and one real recipient example
- specific free deliverable, and whether it is free (if it is, the copy says "free" or "no cost")
- the real scope: the 3 to 4 tasks the sender genuinely handles and the one small action the prospect takes, or "not applicable" when the real process has no such split
- the deliverable's target, when it is aimed at a case study: the prospect's own best client (`own_best_client`, per contact) where the data holds it, or else the slice's real, sourced case-study name written into the shared body (B5)
- any per-contact variables: at most two, already in the data or cheaply derived with an evidence URL (`sells_to_vertical`, `service_offered`, `own_best_client`), placed inside the offer sentence, never as an opener or a stacked line (B13; Aaron process alignment, operator directive 2026-09-22)
- the optional P.S. job, if any (one of four, B1): the relevance line demoted from line one, one near-twin proof point, a casual risk-elimination or reason-it's-free line, or the deliverable's turnaround and the prospect's one small act
- optional true proof claim, on file

Do not draft around a missing deliverable, or one with no named honorer for this arm's test yeses (the agency by default, the client only with `lead_magnet_client_ok: yes`). Fix the offer first (doctrine §2: the offer before the copy).

## Drafting Rule

Apply the Framework A contract from `outreach-copy-framework.md` without substituting another framework. It is Aaron's measured winner anatomy, the direct concrete offer (doctrine §8, §9), and the house safeguards in B15 stay:

- no greeting, and the offer first: "no pain, no observation, no preamble" (B1)
- no greeting word; the first name optional; it may open the email or sit later in the sentence (his first-name-second trick); no company-name variable by default (B1, B5)
- 25 to 35 body words by default, with the optional P.S. excluded from the count (it stays short and does one job); a body a little under 25 words is acceptable whenever it still carries the whole offer (the one-liner is the common case, not the only one); longer only as a logged A/B arm (B4, B14) (operator-approved Aaron alignment, 2026-09-21)
- 2 to 3 main-body sentences, or one for the one-liner; an optional declarative P.S. doing one of the four B1 jobs sits outside both the sentence count and the word count (B1, B2)
- one primary ask: the soft permission CTA last, by default `Would that be worth sharing more?`, or a whitelisted variant such as `Would that be worth a quick test?` (pilot, trial and pay-per-result offers), `Would that be useful?` or `Would that be helpful?` (B1, B14; the three added by Aaron process alignment, operator directive 2026-09-22)
- the scope disclosure whenever it reflects the real process, as a parenthetical or in prose, never invented (B1, B14)
- proof: none, or one near-twin point in the P.S. (B6)
- shapes: the one-liner, or two lines plus a P.S. (B2); pain-first, relevance-question opener (any awareness level), context-led, longer, no-CTA, soft conditional statement close, no-number, and proof-P.S.-versus-no-P.S. versions only as labeled variants (B3; the last four and the wider question opener added by Aaron process alignment, operator directive 2026-09-22)
- for cold email, three Email 1 variants by default (A, B, C), A the control and each of B and C changing one variable against it (B3); more letters when a test needs them
- Aaron's kill-list (B9) and his rejection bank (`aaron-examples.md` §8)
- shape, not sentences: never paste Aaron's lines into client copy (B12)

(operator-approved Aaron alignment, 2026-09-21: "exactly 1 question" and the "mandatory parenthetical workload split" were relaxed to Aaron's stated positions, B14.)

For email, include a compliant subject: 2 to 4 lowercase words, 0 to 2 variables, curiosity plus relevance, never deceptive ("your [the offer's own object]" and `fyi {{first_name}}` pass). For subjectless channels, omit it. Obey tighter platform character limits with the one-liner shape: drop the P.S. first, then the scope disclosure, before touching the offer.

## Editing Order

Draft, then edit in Aaron's order (B11, doctrine §9): fix the offer; remove unsupported facts; make the output and the effort clear; choose one next action; remove filler; only then apply word count, channel rules, and style. Run the per-line QA loop, then the pre-send test: would I answer this?

## QA Output

Before showing the copy, report the channel and the mechanical checks from `outreach-copy-framework.md` (Mechanical QA): the shape or labeled variant, body word count (P.S. excluded), main-body sentence count, primary asks and question marks, no greeting word, deliverable first, "free" stated, scope disclosure present or not applicable, CTA last, the P.S. job, proof, variables, subject, em dashes, the rejection-bank check, and fulfilment confirmed.

Rewrite internally until every check passes. Do not show failed copy as an option. Do not upload, schedule, or send unless the user separately authorizes that live action.

## Related Skills

- `/campaign-copywriting`: full cold-email campaign workflow and artifacts
- `/spam-word-checker`: always-on formatting, CTA, opener, and voice guardrails
- `/ask-aaron`: advisory persona consult for a line-by-line teardown or offer pressure-test; never relaxes this skill's hard rules
- The multichannel sending layer for the locked `run_state.sending_platform`, if `/stack-setup` activated a pack that provides one (e.g. `/getsales-io`): it carries the LinkedIn and email touches and is never the copy-authoring source of truth. If no pack is active, use that platform's native surface directly. If neither exists, say so and place the copy manually rather than implying coverage.
