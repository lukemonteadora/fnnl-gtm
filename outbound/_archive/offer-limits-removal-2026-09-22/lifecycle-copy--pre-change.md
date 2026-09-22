# Archive: lifecycle-copy, full pre-change snapshot

- **Source file:** `.claude/skills/lifecycle-copy/SKILL.md` (FNNL Agency GTM System)
- **Archived:** 2026-09-22, operator directive: remove the offer-ideation limits (client willingness, capacity, effort, free trial) and move the capacity question to after the test
- **Why a full snapshot:** this file carried other sessions' uncommitted edits when it was changed, so the whole file is kept verbatim as the exact pre-change state. Diff it against the live file to see this change alone.
- **Replaced by:** the live file at the same path. `MANIFEST.md` in this folder lists what changed and why.

This is a record, not live doctrine: do not lift any of it back into a skill.

`````markdown
---
name: lifecycle-copy
description: Writes the post-initial-sequence lifecycle email copy that the lifecycle DOCX skills package — no-reply follow-ups (followups.yaml), interested-reply handling (interested-reply.md), and pre-call/booked-call nurture including the no-show email (pre-call.md). Use after the main cold sequence is written by /campaign-copywriting and the campaign needs follow-up, positive-reply, or pre-call nurture copy. This is the producer the lifecycle DOCX skills depend on; without it followups.yaml / interested-reply.md / pre-call.md never exist.
---

# Lifecycle Copy

## Canonical Profile Root

All profiles/<business-slug> paths in this skill resolve under:

```text
<outbound>/profiles
```

Here `<outbound>` is the root of this skill library - resolve it to wherever the library is currently checked out (local Documents, OneDrive, or a git worktree); never hardcode an absolute path. Do not create client profiles under a `profiles/` folder at your current working directory.

## What this skill is

`/campaign-copywriting` writes the main cold sequence to `variants.yaml`. It does **not** write the lifecycle copy that comes after the cold sequence. This skill fills that gap. It produces three lifecycle artifacts, each consumed by a matching DOCX presentation skill:

| Lifecycle flow | This skill writes | Packaged by |
|---|---|---|
| Re-engagement of non-repliers (a separate, later sequence) | `profiles/<business-slug>/campaigns/<campaign-slug>/followups.yaml` | `/cold-email-followups-docx-presentation` |
| Interested-reply handling (after a positive reply) | `profiles/<business-slug>/campaigns/<campaign-slug>/interested-reply.md` | `/interested-replies-docx-presentation` |
| Pre-call / booked-call nurture (+ no-show email) | `profiles/<business-slug>/campaigns/<campaign-slug>/pre-call.md` | `/pre-call-nurture-docx-presentation` |

This skill writes copy only. It does not package DOCX, upload, or send. The DOCX skills format what this skill produces; they explicitly route back here when their source file is missing.

## When to use

- After `/campaign-copywriting` has produced `variants.yaml` for the campaign and the user wants any of: re-engagement of non-repliers, an interested-reply flow, or a pre-call nurture flow.
- When a lifecycle DOCX skill reports its source file is missing and routes back to "lifecycle copy creation" — that is this skill.

Pick which flow(s) to write with a native choice prompt (recommended option first, Custom answer last) from `/clarification-first`:

```text
Which lifecycle copy should I write?

A. [Recommended] Re-engagement of non-repliers (followups.yaml)
B. Interested-reply handling (interested-reply.md)
C. Pre-call / booked-call nurture (pre-call.md)
D. Custom answer
```

Multiple may be selected. Write each requested file independently.

## Material Decision Rule

When this skill reaches a material fork, name the realistic options, recommend the strongest path, and explain why the main alternatives are weaker before committing.

Ask before choices that affect spend, provider routing, source of truth, list quality, campaign direction, client-facing output, live systems, scraping or account risk, or legal/compliance risk. For low-risk reversible choices, state the recommendation and proceed.

## Inputs

Read for context before writing lifecycle copy:

- `profiles/<business-slug>/client-profile.yaml` — ICP, offer, tone
- `profiles/<business-slug>/campaigns/<campaign-slug>/variants.yaml` — the main cold sequence this lifecycle copy continues; match its voice, offer, and confirmed-deliverable CTA
- `profiles/<business-slug>/lead-magnets.md` — the locked offer, including its fulfillment lines (`Input needed after yes:`, `If they don't qualify:`, and the paid next step), which `interested-reply.md` is built from (doctrine §11, the fulfillment-first reply plan)
- `run_state.sending_platform` — for any platform-specific variable tokens

Do not invent a different offer or CTA than the one locked for the campaign (for an offer-validation arm, that is the arm's own offer in `offer.validation_arms`). Lifecycle copy continues the same conversation. The one exception is re-engagement (Output 1), which may carry a different offer, but only one already locked in `offer.lead_magnet` or `offer.validation_arms` with its four fulfillment artifacts in `lead-magnets.md`, never an invented one (operator-approved Aaron alignment, 2026-09-21).

**Verified-list gate (inherited).** This skill runs only after `/campaign-copywriting` produced `variants.yaml` for the slice, which itself passed the verified-list gate (`verified-list-gate.md`). So `followups.yaml` inherits that gate via its parent cold sequence — confirm `variants.yaml` exists before writing it. `interested-reply.md` and `pre-call.md` are post-reply / post-booking (a reply or booking already exists), so they assert only the parent gate, never a fresh `leads.verified.csv` check.

## Copy QA Gate (mandatory — same gate as /campaign-copywriting)

Every subject line, body, and CTA this skill writes must pass, in order, before it is shown to the user or written to any file:

1. `spam-word-checker.md` — formatting bans, weak/forbidden CTAs, opener and voice bans (including follow-up-reference openers and Aaron's named kill-list, doctrine §9), and silence-based closeout logic. It no longer carries a keyword blocklist.
2. `cold-email-copy-best-practices.md` — writing-quality and CTA standards
3. Aaron's rejection bank (`aaron-examples.md` §8, in `/ask-aaron`): check every draft against it, then run his pre-send test, where "if I received that email, I definitely would not be answering it" must be false (doctrine §9). (Operator-approved Aaron alignment, 2026-09-21.)

Also enforce the **Confirmed Deliverable Gate**: every CTA must map to a real, operator-producible deliverable. Hard-stop on unconfirmed audits, scorecards, benchmarks, ROI reports, or trials.

If any line fails QA, rewrite it until it passes. Do not write a file containing failed copy. This skill is not allowed to output unreviewed copy. After writing each file, re-scan it for banned tokens, em dashes, double hyphens, and banned variable roots, exactly as `/campaign-copywriting` does after serializing `variants.yaml`.

## Output 1 — No-reply follow-ups (`followups.yaml`)

For prospects who did not reply to the main sequence. **Aaron's follow-up rules govern this file (operator-approved Aaron alignment, 2026-09-21).** They replace the earlier "add a new angle each time" line and the two context notes on short bumps and a no-oriented last touch, archived at `outbound/_archive/aaron-alignment-2026-09-21/lifecycle-copy--followup-context-notes.md`.

- **Two emails by default, three at most.** On a 5-email sequence he says "Absolutely do not do this in 2026 at all." and "You want to max it at two, maybe three messages at the absolute most" (examples §7.1). His 1.5M-email study puts 58% of all losers in follow-ups (doctrine §9, self-reported), so every email here must earn its place. Re-engaging non-repliers is a house motion his corpus does not cover (doctrine §15: no complete follow-up sequence), and it may never become messages 4 to 6 of one push. **Re-engagement is a separate, later sequence** (operator-approved Aaron alignment, 2026-09-21): its own campaign, with its own new thread and its own two emails by default, three at most, so Hard Rule 18's one thread per campaign still holds; it starts at least one month after the main sequence's last touch (the one-month floor is house; Eric's re-blast window is one to three months, `/ask-eric`, `eric-doctrine.md` §6); and it carries a new angle or offer, never the same copy. (This used to leave its timing to a house decision with no minimum gap, so it could run straight on from the main sequence.)
- **Standalone, one job** (doctrine §11). Write each email as if it is the first one they read. It does one job: useful context, one meaningful point, a lower commitment, or a real objection. Never "just following up", "just nudging" or "did you see my last email" (examples §7.1), nor the house-banned "bumping this"; never name the non-reply; never assume they scroll up; no guilt trips, no fake urgency; no "Are you the right person to send it to?" (only at enterprise, with a named alternative, examples §7.1). A one-line email must still carry the offer. His floor: "It's almost too short… this almost feels like the just bumping it up type follow-up, which everybody hates." (doctrine §9).
- **The two-mode fork** (ledger R12). Either add to it (pre-handle a concern, add a benefit layer, add a risk reversal, give the reason it is free) or strip it back (the bare offer at lower friction). If the main sequence was already stripped back, add. A lower-friction restatement of the same offer passes (de-escalation) and counts as a new angle; repeating the main sequence fails, which is his teardown of a failed follow-up: "they didn't swap up what the thing is that they were actually offering at any point" (examples §8).
- **The friction ladder** (doctrine §11). Higher-friction ask first, lower-friction ask second; the reverse order is allowed as a test. His named lower rung, `[AS]` examples §7.1: "Should I send you a two-minute Loom video showing you exactly how this works?" Borrow the shape, not the sentence: "it's the script framework that's doing all of the heavy lifting here, not the specific words" (doctrine §9).
- **Every email has the same spec as the first one** (doctrine §11): "short, to the point, conversational, but exist on its own, clear CTA, same idea."
- **Cadence.** Aaron's whole evidence is a 2-to-3-day gap between two emails (doctrine §11). The exact `delay_days` is a house decision, and nothing here changes a live delay.
- **No breakup email and no opt-out line in the body.** His signature rules cut opt-out lines ("That's really not necessary", doctrine §9), and a goodbye does none of the four jobs above, so the last email is still one job with the same ask. Unsubscribe mechanics are platform-level and unchanged. Where a client's counsel or the recipient's jurisdiction requires a visible opt-out notice, add exactly what is required, record it as a compliance requirement, and keep it action-conditional per `spam-word-checker.md` (Unsubscribe / Closeout Line Rules), never silence-based.

**Pre-write note.** Under the pre-written copy path (`/campaign-copywriting` Pre-Written Email Copy Architecture), re-engagement emails are static fields shared across the segment (one written version applied to every row; Hard Rule 34 makes one shared body the default), not per-contact AI copy. Write one version, confirm it carries a new angle or offer, never the main sequence's copy (a different offer only when it is already locked, see Inputs; and, if it carries a pain line, the same pain its offer solves, doctrine §9 hook-payoff rule), and apply it as the static value. (operator-approved Aaron alignment, 2026-09-21: this used to require that it restate the same locked offer as the main sequence.) This holds whether you use Task sub-agents, Clay, RevCode, Claude Code, or any equivalent enrichment tool. Static copy is faster and cheaper than AI generation for these.

Write to `profiles/<business-slug>/campaigns/<campaign-slug>/followups.yaml`. Match the field names and forms below exactly: the builder parses `subject:` inline (one line) and `body:` as a block scalar (`body: |` with 10-space-indented content). Never use a block scalar for `subject` or an inline escaped string for `body`.

```yaml
name: "<campaign name - must match the campaign slug>"
# TRIGGER: <when this fires, e.g. No reply to the main sequence, at least one month after its last touch>
# PURPOSE: <one sentence: what this re-engagement is trying to restart>
# SETUP: <where to build it and which leads to pull, e.g. the no-reply segment, pulled no sooner than one month after the main sequence's last touch>
schedule:
  timezone: America/New_York
  days: [1, 2, 3, 4, 5]
  start_hour: "08:00"
  end_hour: "17:00"
  min_time_btw_emails: 10
  max_leads_per_day: 20
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
          <QA-approved body, plain text, standalone, one job, a new angle or offer (never the main sequence's copy), no "following up" opener>
      - label: B
        subject: "<QA-approved subject>"
        body: |
          <QA-approved body>
  - step: 2
    delay_days: <N>
    variants:
      - label: A
        subject: "<QA-approved subject>"
        body: |
          <QA-approved body>
```

The builder `scripts/lifecycle_docx_presentation.ps1` (run via `/cold-email-followups-docx-presentation`) reads `name:`, the `# TRIGGER:` / `# PURPOSE:` / `# SETUP:` comment lines, each `- step:` with its `delay_days:`, and each `- label:` with an inline `subject:` and a `body: |` block. Use those exact names and forms. For threaded replies with no subject, use an empty inline subject (`subject: ""`).

## Output 2 — Interested-reply handling (`interested-reply.md`)

What gets sent after a prospect replies positively ("yes, tell me more", "send info", booked a call). This is Markdown, not YAML — the `/interested-replies-docx-presentation` builder reads a `## When to Use` section, `## Email...` headings, `**Trigger:**` / `**Send as:**` / `**Subject:**` / `**Word count:**` bold-label lines, fenced body blocks, and a `## Notes` section.

**After the yes: Aaron's reply-stage rules (operator-approved Aaron alignment, 2026-09-21).** The reply is the start of the promise, not permission to change it (doctrine §11): someone who said "send it" agreed to receive it, not to a surprise meeting, form, subscription or purchase.

- **Email 1 is the delivery reply** (ledger R03, the only outright reversal in his ledger; examples §7.3). For a free-deliverable offer, deliver the promised asset first, or, when delivery needs something from them, ask only for the inputs in the locked offer's `Input needed after yes:` line. No booking gate, no calendar link, no proposed times and no offer to walk them through it on a call in the delivery reply ("We don't want to force-feed them the calendar.", examples §7.3). A walk-through offer is a call ask disguised as help; his rule is "you don't want to add any sort of sales friction until they've actually consumed the value" (S06, transcript 2026-07-13). The asset's own link is the delivery, so it is fine. The next ask stays present but one layer down and refusable; his shape is "calendar's on the next page if you think there's interest" (examples §7.3). A call is a stated requirement only when the offer genuinely needs one.
- **How this sits with Hard Rule 36** (`/campaign-copywriting`, the Delivery Message, as aligned on 2026-09-21). They must say the same thing. With `offer.lead_magnet_gap` present, the delivery carries the asset and no demand, and the first follow-up carries the ask. With no gap, the asset goes out with one soft, refusable pointer to the next step. `direct_offer` is the exception, and Email 1 still closes with his permission CTA (ledger R17 retired the meeting ask), so a yes is permission to share more, not agreement to a call. The reply shares it in one or two sentences plus the information or asset, keeps the call one layer down and refusable, and proposes times only when the prospect asks to talk (explicit booking intent). Never propose times in a delivery reply, whether or not the asset leaves an open question; the next step sits one layer down and refusable ("calendar's on the next page if you think there's interest", examples §7.3; ledger R03); times are proposed only on explicit booking intent. That is the same rule the reply-agent setup skill for the locked sending platform must follow. If the Hard Rule 36 text you are reading still proposes times at delivery, for a free deliverable or on a `direct_offer` yes, surface the mismatch to the operator instead of choosing silently. (operator-approved Aaron alignment, 2026-09-21: times used to be proposed in the first reply on any `direct_offer` yes, because "the conversation is the offer".)
- **Match the response to intent** (doctrine §11; the working categories are this system's safeguard built on his information-versus-booking distinction, not his own list, doctrine §13). An asset request gets the asset plus any input question delivery needs. A fit question gets verified eligibility, and a no-fit answer uses the locked offer's `If they don't qualify:` line. A price question gets a real price or the one variable it depends on. Booking intent gets times or the real booking link. A referral gets thanks and one ask for the right person. An objection gets one honest sentence. An opt-out stops. Do not treat every positive word as a sales-qualified lead.
- **Answer in one sentence and leave the loop open.** "One sentence is almost always the better move" (doctrine §9). A reply with the full process, pricing and three case studies answers everything and leaves no reason to take the next step (doctrine §10).
- **Speed.** The first reply goes out inside 5 minutes where possible (doctrine §11). The reply-agent setup skill for the locked sending platform drafts it live where the stack contract names one, and the optional call-the-interested-replies escalation ("the kicker", examples §7.2) lives there too. His own teaching is unresolved on when that call starts (ledger R20): the July 13 video says no sales push until the asset has been used, while his Apr 20 and Sep 14 videos call interested replies within 5 minutes. House reading until the operator rules, the same one the reply-agent setup skill for the locked sending platform must use: call repliers who ask for a meeting, and interested replies that ask about working together, within minutes; for a plain asset request, deliver first and hold any call until the asset has been used (attribution corrected 2026-09-21: this used to present that scoping as ledger R20's). Keep this file and that skill's guidance saying the same thing.
- **Email 2 onward is the post-interest subsequence** (examples §7.2): one to three emails shortly after interest (his instance: two, three or six days, maybe one after that; the exact delays are a house decision). Each one shows curiosity about the asset (did they get a chance to dive into it, any thoughts on it), never a bump or a guilt trip, and never names the non-reply. The ask stays the same across the steps, and escalation happens on their reply, not on a timer. When Hard Rule 36 defers the call ask to the first follow-up, that follow-up aims it at the unresolved motive (`offer.lead_magnet_gap`) and keeps it refusable; Hard Rule 36's day-7 close keeps that same ask and stays guilt-free. Add further `## Email N` blocks the same way, three subsequence emails at most.

Write to `profiles/<business-slug>/campaigns/<campaign-slug>/interested-reply.md`:

```markdown
# Interested-Reply Flow - <Campaign Name>

## When to Use
A prospect replied positively to the cold sequence.

## Email 1
**Trigger:** Positive reply received
**Send as:** Reply on the same thread
**Subject:** <only if starting a new thread; otherwise omit>

​```
<QA-approved body. Deliver the promised asset (its link is the delivery), or ask only for the inputs in `Input needed after yes:`.
One or two sentences, one refusable next step. No calendar link, no offer to walk them through it on a call, and no proposed times unless the prospect asked to talk (explicit booking intent); a direct_offer yes gets the offer shared in one or two sentences plus the information or asset.>
​```

**Word count:** <N>

## Email 2
**Trigger:** No response to Email 1 after <N> days
**Send as:** Reply on the same thread

​```
<QA-approved body. Curiosity about the asset (did they get a chance to look, any thoughts), the same refusable ask, never a bump.>
​```

**Word count:** <N>

## Notes
<only if needed; otherwise omit>
```

## Output 3 — Pre-call / booked-call nurture (`pre-call.md`)

The nurture drip between a booked call and the call itself, plus a no-show email. The `/pre-call-nurture-docx-presentation` builder reads a `## When to Use` section, `## Email...` headings, `## If They No-Show`, `**Subject:**` / `**Purpose:**` / `**Word count:**` bold-label lines, and fenced body blocks.

**Pre-call rules (operator-approved Aaron alignment, 2026-09-21).** Each email does one job, stays short, standalone and conversational, and carries one clear next step (doctrine §11: email two has the same spec as email one). Email 2's proof point is one point only: a near-twin, same-mechanism result with one plain named number and no acronyms, never generic proof (doctrine §9, examples §6). One next step at a time: the call link plus at most one resource, never a pile of links (doctrine §11). The no-show email offers the rebook without guilt, blame or fake urgency (examples §7.1).

Write to `profiles/<business-slug>/campaigns/<campaign-slug>/pre-call.md`:

```markdown
# Pre-Call Nurture Flow - <Campaign Name>

## When to Use
A prospect has booked a call. These send between booking and the call.
Variables used: {{first_name}}, {{call_time}}, {{call_link}} (list only the ones the copy uses).

## Email 1
**Subject:** <QA-approved subject>
**Purpose:** Confirm the call and set one expectation

​```
<QA-approved body>
​```

**Word count:** <N>

## Email 2
**Subject:** <QA-approved subject>
**Purpose:** Add one useful pre-call resource or proof point

​```
<QA-approved body>
​```

**Word count:** <N>

## If They No-Show
**Subject:** <QA-approved subject>

​```
<QA-approved body. Warm, low-pressure, offer to rebook. No guilt, no fake urgency.>
​```

**Word count:** <N>
```

## What to do next

After writing a lifecycle file and passing QA, offer to package it:

- `followups.yaml` → `/cold-email-followups-docx-presentation`
- `interested-reply.md` → `/interested-replies-docx-presentation`
- `pre-call.md` → `/pre-call-nurture-docx-presentation`

If copy fails QA at the DOCX stage, that skill routes back here. Fix the copy, re-run QA, then re-package.

## Related skills

- `/campaign-copywriting` - writes the main cold sequence (`variants.yaml`); this skill continues that voice and offer into lifecycle copy
- `spam-word-checker.md` - formatting, CTA, opener and voice gate, with no keyword blocklist (read inline, applied before any copy is written)
- `cold-email-copy-best-practices.md` - writing-quality and CTA gate (read inline)
- `/ask-aaron` - the doctrine behind this skill's follow-up and after-the-yes rules (`aaron-doctrine.md` §9 and §11, `aaron-examples.md` §7 and the §8 rejection bank); advisory only
- The reply-agent setup skill for the locked sending platform (the one the stack contract names) - drafts the first reply live; its booking and qualifying guidance must match `interested-reply.md`
- `/lead-magnet-brainstorm` - writes the locked offer's `Input needed after yes:` and `If they don't qualify:` lines that `interested-reply.md` uses
- `/cold-email-followups-docx-presentation` - packages `followups.yaml`
- `/interested-replies-docx-presentation` - packages `interested-reply.md`
- `/pre-call-nurture-docx-presentation` - packages `pre-call.md`
- `/clarification-first` - native choice-prompt pattern for the flow-selection question

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short — record status, not raw output. Full protocol: `client-activity-log.md`.
`````
