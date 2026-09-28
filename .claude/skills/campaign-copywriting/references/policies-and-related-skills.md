This file holds the Material Decision Rule, the full Interaction Policy, the DOCX-pack and approval-brief menus of What To Do Next, and the Related Skills list of `/campaign-copywriting`, moved verbatim from `../SKILL.md` on 2026-09-28 (the Interaction Policy's checkpoint wording, the menus' ask lines and the `/ask-aaron` entry were updated the same day for the phase map, plain-text outputs and the Aaron lane). Read the first two at a material fork or before an `auto_execute` or `review_gates` decision in this skill, the menus only once the operator asks for a DOCX pack or the approval brief, and Related Skills when you need the skill that owns a neighbouring step. Words like "above" and "below" refer to the original single-file order; the "Where the rest lives" table in `../SKILL.md` says where each named section now is.

## Material Decision Rule

When this skill reaches a material fork, name the realistic options, recommend the strongest path, and explain why the main alternatives are weaker before committing.

Ask before choices that affect spend beyond an approved budget, provider routing, source of truth, list quality, campaign direction, client-facing output, live systems, scraping or account risk, or legal/compliance risk. For low-risk reversible choices, state the recommendation and proceed.

Do not turn copy that failed the writing QA into a user-facing option: fix it. But never hide an offer or arm that a delivery or proof gate is holding (a client-honored offer waiting for the client's OK, an angle waiting for proof): list it with its blocker, so it stays visible to the operator and the client slate (operator directive 2026-09-22).

When asking the user, use the Claude Desktop native Interactive Inputs / Choice Prompts pattern from /clarification-first: recommended option first, short choices, and Custom answer last when a custom answer is plausible.

## Interaction Policy

Defers to `/autonomous-execution-policy`. Under `run_state.execution_mode = auto_execute` (the new-client default since 2026-09-24, paired with `review_protocol: phase_checkpoints` so a run stops only at the one checkpoint that closes each of the four phases, `outbound/reference/phase-protocol.md`; `review_gates` is opt-in), proceed without pausing: pick the strongest option per this skill's rubric, record it to `run_state`/profile, and continue. Never re-ask a decision already in `run_state`, the profile, memory, or the operator's latest message. Stop only for the policy's hard-stops (spend over the approved ceiling, live send, credentials, provider/source-of-truth change, safety gates). On a long async wait, background-poll and move to other productive work. Never idle. Autonomy does NOT relax the Copy QA Gate: `spam-word-checker.md` and `cold-email-copy-best-practices.md` remain HARD gates: every variant must still pass both before it is shown, approved, serialized, or uploaded, regardless of execution mode.

---

## What To Do Next: the DOCX-pack and approval-brief menus

These menus sit under What To Do Next in `../SKILL.md`, whose first paragraph says they are never asked, in any mode.

The menus are kept as the reference for what to run once the operator has asked. For a DOCX pack:

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

When asked, do this before any spintax or upload step. The DOCX steps use approved YAML/Markdown files as the source of truth and create compact client-facing launch sheets with the full sequence copy. If a lifecycle source file is missing, report it plainly and skip that DOCX. Do not invent lifecycle copy inside a DOCX step.

For the approval brief, once the operator has asked for it:

```text
Choose the campaign approval brief next step.

A. [Recommended if client approval is needed] Create the approval brief
B. Skip approval brief and continue
C. Show what the brief would include first
D. Custom answer
```

If the user chooses A, run `/campaign-approval-brief` for the selected campaign, launch pair, or selected campaign set. This brief uses isolated per-campaign mini-briefs: summary table, decision logic, alternatives considered, risks, client prompts, expanded lead-source summary, and saved copy previews from `variants.yaml`. It does not replace the full sequence DOCX and must not invent missing decision history.

---

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
- `/ask-aaron`: writes the copy in Call 2 of the Aaron lane, the campaign and copy call, and his call is final over this skill's house contract, below the operator (operator directive 2026-09-24, `outbound/reference/aaron-lane.md`); only the rails in that file and the operator's rule in `outbound/reference/aaron-copy-frames.md` bind him, and the standing operator exception in that call's prompt is the explicit exception his doctrine section 13 asks for. Also a consult for a draft teardown. On attribution, its doctrine file corrects a common error worth knowing here: the 25-to-35-word count, the 2-to-4-word lowercase subject, the 3-to-4-task parenthetical and offer-first are **Aaron's own stated findings** from his 1.5M-email study, not inventions of this repo; what was this repo's policy is their **hardness**. The rejection bank in `aaron-examples.md` §8 is part of this skill's Copy QA Gate in the house flow.
- `/email-waterfall`, `/list-quality-scorecard`: produce and grade the verified slice the List Gate requires before any copy
- `/stack-setup`: resolves the capability roles this skill needs (sending platform, email verifier, waterfall enricher) when the stack contract leaves one empty
- `/phase-4-copy-launch`: runs this skill in recorder mode as its step 1, then spintax (step 4), the upload stop (step 6), the paused drafts (step 7) and checkpoint 4, the launch review (`outbound/reference/phase-protocol.md`)
