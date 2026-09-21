---
name: outreach-copywriting
description: Creates and QA-checks first-touch cold written outreach across cold email, LinkedIn DMs, LinkedIn connection notes, SMS, X DMs, and other prospecting channels. Use whenever writing, revising, reviewing, serializing, or preparing initial outbound copy for any channel. Enforces the Framework A initial-offer structure as a hard rule and routes full cold-email campaign work through campaign-copywriting.
---

# Outreach Copywriting

Use this skill for the first written cold touch in any channel.

## Required References

Read and apply these before drafting:

1. `outreach-copy-framework.md`
2. `/spam-word-checker`

For a full cold-email campaign, also run `/campaign-copywriting`. Its list, offer, proof, fulfilment, sequence, artifact, and platform gates remain mandatory.

## Inputs

Confirm or derive:

- channel
- audience and one real recipient example
- specific free deliverable
- 3 to 4 tasks the sender handles
- the one small action the prospect takes
- optional true proof claim

Do not draft around a missing or unfulfillable deliverable. Fix the offer first.

## Drafting Rule

Apply Framework A from `outreach-copy-framework.md` without substituting another framework:

- offer first
- 25 to 35 body words
- 2 to 3 main-body sentences; an optional declarative P.S. is separate but still counts toward the word cap
- exactly 1 question
- mandatory parenthetical workload split
- soft permission question last
- no preamble

For email, include the compliant subject. For subjectless channels, omit it. Obey tighter platform character limits without deleting any required element.

## QA Output

Before showing the copy, report the channel and the mechanical checks: word count, main-body sentence count, question count, parenthetical present, workload split present, CTA last, and fulfilment confirmed.

Rewrite internally until every check passes. Do not show failed copy as an option. Do not upload, schedule, or send unless the user separately authorizes that live action.

## Related Skills

- `/campaign-copywriting`: full cold-email campaign workflow and artifacts
- `/spam-word-checker`: always-on formatting, CTA, opener, and voice guardrails
- `/ask-aaron`: advisory persona consult for a line-by-line teardown or offer pressure-test; never relaxes this skill's hard rules
- The multichannel sending layer for the locked `run_state.sending_platform`, if `/stack-setup` activated a pack that provides one (e.g. `/getsales-io`): it carries the LinkedIn and email touches and is never the copy-authoring source of truth. If no pack is active, use that platform's native surface directly. If neither exists, say so and place the copy manually rather than implying coverage.
