---
name: emailbison-spintax
description: Adds EmailBison-compatible spintax to approved cold email sequences without weakening copy QA. Use only after /campaign-copywriting has produced QA-passed copy and locked run_state.sending_platform = EmailBison.
---

# EmailBison Spintax Skill

Use this skill only when locked `run_state.sending_platform = EmailBison`, unless the user explicitly asks to convert or review EmailBison-formatted copy outside an active run.

This skill adds light variation to already approved copy. It must not write new campaign copy, soften CTAs, add greetings, add links, or change the strategic meaning.

It inherits the **verified-list gate** (`verified-list-gate.md`): only spin copy whose source `variants.yaml` was produced by `/campaign-copywriting` under that gate. Approved-copy existence alone is not the entry condition — if no verified slice + locked strategy backs the copy, route back to `/campaign-copywriting` instead of spinning.

## Required Guardrails

Before and after adding spintax, apply:

1. `spam-word-checker.md` (formatting, CTA, opener and voice bans, including Aaron's named kill-list; it no longer carries a keyword blocklist)
2. `cold-email-copy-best-practices.md`
3. Aaron's rejection bank (`aaron-examples.md` §8, in `/ask-aaron`), per the Aaron alignment rules below

If any branch fails, rewrite the branch or route back to `/campaign-copywriting`. Do not output failed spintax.

Hard bans:

- No em dashes, double hyphens, or mid-sentence dash separators.
- No colon-as-runway sentences or comma-wrapped company descriptors.
- No greeting prefixes before the first name.
- No branch that fails `spam-word-checker.md`'s formatting, CTA, opener or voice bans.
- No HTML-first workflow. If HTML is pasted from EmailBison, preserve the minimum required platform tags only and do not add styling.
- No silence-based opt-out wording.
- No weak CTA branches such as generic interest checks or problem confirmation.
- No ego-triggering CTA branches that make the prospect feel like they need the sender.
- No repeated generic CTA deliverable across separate new-thread emails.
- No goodbye or fake wrap-up branch inside a two-thread campaign.

**Aaron alignment: what spintax must never do (operator-approved Aaron alignment, 2026-09-21).** Spintax varies wording only; it never changes the shape the approved copy already passed. No branch may:

- introduce an item from Aaron's named kill-list (doctrine §9, "Banned openers and moves"; the rejection bank in `aaron-examples.md` §8), for example "I hope this email finds you well", "I know you're busy", a self-introduction, a compliment that would fit anyone, a meeting ask he replaced ("would that be worth a chat", examples §4), "audit" as the offer word, jargon or self-declared uniqueness, or a salesy sign-off. Check every branch against the rejection bank.
- move the offer off line one. A branch that puts a pain line, an observation or any preamble ahead of the offer fails: his winning shape is "no pain, no observation, no preamble" (doctrine §9).
- add a greeting. Aaron uses none (doctrine §9), and the greeting ban above stands.
- add an opt-out line to the body, or leave a spintax artifact in it (a literal brace or pipe, or a branch that reads as machine-varied). His signature rules cut both: "That's really not necessary" (doctrine §9). This is a body-copy rule only. The platform's unsubscribe mechanics are unchanged, and any compliance notice already in the approved copy is legal language, kept exactly as written and never spun.
- reintroduce an em dash or en dash of any kind: "no m dashes ever, that screams ChatGPT" (examples §8).

## EmailBison Syntax

EmailBison spintax syntax:

```text
{option one|option two|option three}
```

EmailBison also uses braces for variables, such as `{FIRST_NAME}`. Treat known variables as variables, not spintax.

Preserve EmailBison variables exactly:

```text
{FIRST_NAME}
{LAST_NAME}
{COMPANY}
{TITLE}
{SITUATION_LINE}
{VALUE_LINE}
{CTA_LINE}
```

Never put a variable inside a spintax block unless every option preserves the full variable token cleanly.

## The Golden Rule: No Broken Combinations

Every possible combination must read as a natural, complete sentence.

Make each spintax block self-contained. When adjacent blocks might create broken grammar, spin the full sentence instead of separate fragments.

## What To Spin

Add 2 to 3 options per block.

Safe targets:

- Light verb choices that preserve meaning.
- Full sentence rephrases that keep the same strategy.
- Transition wording only when the sentence still reads naturally.
- Permission-based CTA questions only when every branch keeps the same confirmed deliverable.
- Action-conditional closeout lines only when every branch requires explicit prospect action.

Do not spin:

- EmailBison variables.
- Company names.
- Specific data points, customer names, metrics, pricing, dates, legal language, or compliance wording.
- Research-based personalization.
- The deliverable promised in the CTA.

## CTA Branch Rules

Every CTA branch must preserve:

- setup sentence plus short permission question
- the same confirmed deliverable
- humble permission framing
- easy yes or no reply path

If the original CTA does not meet this standard, stop and route back to `/campaign-copywriting`.

If the sequence has Email 1/2 and Email 3/4 as two thread pairs, spintax must preserve that structure. Do not spin Email 3 into a global reminder, and do not spin Email 4 into a goodbye.

## Output Format

For plain text input, return the spintaxed plain text in a code block.

For EmailBison HTML input, preserve only required tags such as `<br>` and `<div>`, add spintax only to visible text, and return the full result in a code block.

After each email, state:

```text
All branches passed Copy QA.
All combos clean.
```

If a branch needed restructuring to avoid brace conflicts or pass QA, say what changed briefly.

## Multi-Email Sequences

Process one email at a time unless the full approved `variants.yaml` is provided.

For each email:

1. Add light spintax.
2. Walk every adjacent combination.
3. Run the Copy QA Gate.
4. Output only passing text.

## Pre-Written Copy Path (spintax mostly does not apply)

When the campaign uses the pre-written copy path (`/campaign-copywriting` Pre-Written Email Copy Architecture, generated by `/personalization-subagent-pattern`), each contact's Email 1 and Email 3 bodies (`{EMAIL_1_A}`, `{EMAIL_1_B}`, `{EMAIL_3_A}`, `{EMAIL_3_B}`) are already fixed per row at build time (under Hard Rule 34 that is the slice's one shared body, varying only the baked-in first name and any variable that changes what is delivered), so spintax is skipped for those columns (mechanism unchanged). Spintax still applies to the static follow-ups `{EMAIL_2}` and `{EMAIL_4}`, which are one shared body across the segment. Spin only those, under the same Copy QA Gate and hard bans above. Never spin an `{EMAIL_*}` body variable or the static signature block on the step.

## What To Do Next

Launch the spintaxed copy via `/emailbison-campaign-upload-public` only when locked `run_state.sending_platform = EmailBison`.

If locked `run_state.sending_platform = Smartlead`, this skill is off-path. Use `/smartlead-spintax` instead.

## Related Skills

- `/campaign-copywriting` - writes and approves the base copy
- `/spam-word-checker` - formatting, CTA, opener and voice gate, including Aaron's named kill-list (no keyword blocklist)
- `/ask-aaron` - the kill-list and rejection bank behind the Aaron alignment rules above (`aaron-doctrine.md` §9, `aaron-examples.md` §8); advisory only
- `/cold-email-copy-best-practices` - quality and CTA gate
- `/emailbison-campaign-upload-public` - uploads the approved campaign as paused

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short — record status, not raw output. Full protocol: `client-activity-log.md`.
