---
name: lifecycle-copy
description: "Writes the copy after the cold sequence: interested-reply templates and call script (interested-reply.md), pre-call nurture (pre-call.md) and re-engagement (followups.yaml). Run right after /campaign-copywriting; the first two are required before Start. Use for reply, pre-call or no-reply copy."
---

**From the former description:** `interested-reply.md` holds one reply template per reply category plus a call script; `pre-call.md` holds a confirmation page, its FAQs and the no-show email; `followups.yaml` is the later re-engagement of non-repliers. `interested-reply.md` and `pre-call.md` are required for every campaign before the operator presses Start (Gate D, reply readiness), so write them as soon as `/campaign-copywriting` has produced the cold sequence, never after the first positive reply lands. Replies split by offer type, so a promised asset is delivered first with no times and a direct, trial or service yes gets two specific times plus the calendar. This is the producer the lifecycle DOCX skills depend on; without it `followups.yaml`, `interested-reply.md` and `pre-call.md` never exist.

# Lifecycle Copy

**Plain-text outputs (operator decision 2026-09-28).** The files this skill writes (`followups.yaml`, `interested-reply.md`, `pre-call.md`) are the deliverables. The DOCX skills that package them run only when the operator asks for a DOCX, never as a default next step.

## Canonical Profile Root

All profiles/<business-slug> paths in this skill resolve under:

```text
<outbound>/profiles
```

Here `<outbound>` is the root of this skill library - resolve it to wherever the library is currently checked out (local Documents, OneDrive, or a git worktree); never hardcode an absolute path. Do not create client profiles under a `profiles/` folder at your current working directory.

## What this skill is

`/campaign-copywriting` writes the main cold sequence to `variants.yaml`. It does **not** write the lifecycle copy that comes after the cold sequence. This skill fills that gap. It produces three lifecycle artifacts, each of which a matching DOCX presentation skill can package when the operator asks for a DOCX:

| Lifecycle flow | This skill writes | Packaged by |
|---|---|---|
| Re-engagement of non-repliers (a separate, later sequence) | `profiles/<business-slug>/campaigns/<campaign-slug>/followups.yaml` | `/cold-email-followups-docx-presentation` |
| Interested-reply handling (after a positive reply) | `profiles/<business-slug>/campaigns/<campaign-slug>/interested-reply.md` | `/interested-replies-docx-presentation` |
| Pre-call / booked-call nurture (+ no-show email) | `profiles/<business-slug>/campaigns/<campaign-slug>/pre-call.md` | `/pre-call-nurture-docx-presentation` |

This skill writes copy only. It does not package DOCX, upload, or send. The DOCX skills format what this skill produces; they explicitly route back here when their source file is missing.

## When to use

- **Before every campaign's Start (required).** As soon as `/campaign-copywriting` has produced `variants.yaml` for the campaign, write `interested-reply.md` (one reply template per category plus the `## Call Script`) and `pre-call.md` (the `## Confirmation Page` plus the pre-call sequence). Both are Gate D (reply readiness) inputs, so the operator's Start waits on them: a first reply inside 5 minutes cannot happen when the templates are only written after the first positive lands (Aaron, Sep 21: replies drafted "based on templates that we've established for each client specifically and what their offer is", then fired off "almost immediately"). The orchestration skills (`/cold-email-kickoff`, `/continue-client`) enforce the gate. (Aaron process alignment, operator directive 2026-09-22; supersedes writing these two files only on request or once a positive reply exists.)
- Later, for re-engagement of non-repliers (`followups.yaml`): a separate sequence at least one month after the main sequence's last touch (Output 1).
- When a lifecycle DOCX skill reports its source file is missing and routes back to "lifecycle copy creation". That is this skill.

Pick which flow(s) to write with a native choice prompt (recommended option first, Custom answer last) from `/clarification-first`:

```text
Which lifecycle copy should I write?

A. [Recommended] Interested-reply handling (interested-reply.md), required before Start
B. Pre-call / booked-call nurture (pre-call.md), required before Start
C. Re-engagement of non-repliers (followups.yaml), a later sequence
D. Custom answer
```

Multiple may be selected. Write each requested file independently. Before a campaign's Start, A and B are both required: if either is missing, write it without asking.

## Material Decision Rule

When this skill reaches a material fork, name the realistic options, recommend the strongest path, and explain why the main alternatives are weaker before committing.

Ask before choices that affect spend beyond an approved budget, provider routing, source of truth, list quality, campaign direction, client-facing output, live systems, scraping or account risk, or legal/compliance risk. For low-risk reversible choices, state the recommendation and proceed.

## Inputs

Read for context before writing lifecycle copy:

- `profiles/<business-slug>/client-profile.yaml`: ICP, offer, tone
- `profiles/<business-slug>/campaigns/<campaign-slug>/variants.yaml`: the main cold sequence this lifecycle copy continues; match its voice, offer, and confirmed-deliverable CTA
- `profiles/<business-slug>/lead-magnets.md`: the locked offer, including its fulfillment lines (`Input needed after yes:`, `If they don't qualify:`, and the paid next step), which `interested-reply.md` is built from (doctrine §11, the fulfillment-first reply plan)
- `run_state.sending_platform`: for any platform-specific variable tokens
- The offer's type (a promised asset, or a direct, trial or service offer) and, for a costly front end (a trial, a service, custom work), its `offer.qualification` rule in `client-profile.yaml` (`criteria`, `form_fields`, `free_unit_cap_per_week`), which `/lead-magnet-brainstorm` writes at offer lock. The type decides the shape of the yes reply; the rule feeds the qualification step and the call script's prequalification questions. A cheap asset has no rule.
- `profiles/<business-slug>/offer-intelligence.md`: the real objections `/offer-intelligence` found, from its First-Party Buyer Voice section (the client's won and lost calls) first, then its public buyer pain and objections. They become the FAQs on the `pre-call.md` confirmation page and the objection templates in `interested-reply.md`. Never invent an objection the research did not find.
- The booking calendar link (or, where `offer.qualification` applies, the qualification page that leads to it; recorded in `run_state.booking_link` when the operator gave it at the Phase 1 checkpoint, `/phase-1-onboarding`) and the speed-to-lead owner: the person the operator named at Gate D to call interested replies, recorded in `run_state.speed_to_lead_owner`. Copy the owner, with the 5-minute target, onto the `Speed-to-lead owner:` line in the `## When to Use` header of the campaign's `interested-reply.md`. If either is unknown, write the placeholder and report it as a Gate D gap; never invent a link or a name.

Do not invent a different offer or CTA than the one locked for the campaign (for an offer-validation arm, that is the arm's own offer in `offer.validation_arms`, or in its segment's `offer.segments` entry when the client has per-buyer-type offer sets). Lifecycle copy continues the same conversation. The one exception is re-engagement (Output 1), which may carry a different offer, but only one already locked in `offer.lead_magnet` or `offer.validation_arms` with its four fulfillment artifacts in `lead-magnets.md`, never an invented one (operator-approved Aaron alignment, 2026-09-21).

**Verified-list gate (inherited).** This skill runs only after `/campaign-copywriting` produced `variants.yaml` for the slice, which itself passed the verified-list gate (`verified-list-gate.md`). So `followups.yaml` inherits that gate via its parent cold sequence; confirm `variants.yaml` exists before writing it. `interested-reply.md` and `pre-call.md` are written before Start but only ever sent after a reply or a booking, so they assert only the parent gate, never a fresh `leads.verified.csv` check.

## Copy QA Gate (mandatory, same gate as /campaign-copywriting)

Every subject line, body, and CTA this skill writes must pass, in order, before it is shown to the user or written to any file:

1. `spam-word-checker.md`: formatting bans, weak/forbidden CTAs, opener and voice bans (including follow-up-reference openers and Aaron's named kill-list, doctrine §9), and silence-based closeout logic. It no longer carries a keyword blocklist.
2. `cold-email-copy-best-practices.md`: writing-quality and CTA standards
3. Aaron's rejection bank (`aaron-examples.md` §8, in `/ask-aaron`): check every draft against it, then run his pre-send test, where "if I received that email, I definitely would not be answering it" must be false (doctrine §9). (Operator-approved Aaron alignment, 2026-09-21.)

Also enforce the **Confirmed Deliverable Gate**: every CTA must map to a real deliverable with a named honorer for every yes: the agency by default, the client only with `lead_magnet_client_ok: yes` (`/campaign-copywriting` Confirmed Deliverable Gate). Hard-stop only on a deliverable nobody will honor, or one whose data, method and delivery path are not known yet. **A pending arm** (`lead_magnet_client_ok: pending`) gets its lifecycle copy drafted like any other, marked Start-held, and that copy makes no claim the client has not confirmed: a client term is claimed only once `offer_approval.py` has written it into `lead_magnet_client_dependency` with `lead_magnet_client_ok: yes`. A `no` or `vetoed` arm gets no lifecycle copy (Offer Readiness, operator decision 2026-09-28; `offer-readiness.md`).

If any line fails QA, rewrite it until it passes. Do not write a file containing failed copy. This skill is not allowed to output unreviewed copy. After writing each file, re-scan it for banned tokens, em dashes, double hyphens, and banned variable roots, exactly as `/campaign-copywriting` does after serializing `variants.yaml`.

**Link and calendar rules: cold steps versus warm replies** (Aaron process alignment, operator directive 2026-09-22; supersedes applying the cold-sequence link and calendar bans to every lifecycle file). The cold-sequence bans (for example `cold-email-copy-best-practices.md`'s "Keep calendar links out of emails 1-3") govern cold steps only. `followups.yaml` goes to people who never replied, so it is cold and those bans hold there in full. `interested-reply.md` and `pre-call.md` are warm, because a reply or a booking already exists, and they follow this file's reply rules instead: no calendar link and no times in an asset delivery reply (ledger R03); a booking link on booking intent and on a direct, trial or service yes (Aaron, Sep 21: "Here's my calendar"); the call link and the confirmation-page link in `pre-call.md`. Every other gate above applies to warm copy unchanged.

## Output 1: No-reply follow-ups (`followups.yaml`)

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

## Output 2: Interested-reply handling (`interested-reply.md`)

What gets sent, and said on the phone, after a prospect replies positively ("yes, tell me more", "send info", "worth a quick test", booked a call). This is Markdown, not YAML. The `/interested-replies-docx-presentation` builder reads a `## When to Use` section, `## Email...` headings, the `## Call Script` section, `**Trigger:**` / `**Send as:**` / `**Subject:**` / `**Word count:**` bold-label lines, fenced body blocks, and a `## Notes` section. Put every body, the call script included, inside a plain triple-backtick fence with no language tag, and use no other bold labels, because the builder renders only fenced text and those labels. (The template below shows its inner fences with an invisible zero-width space so they display inside this skill file; the real `interested-reply.md` and `pre-call.md` use plain triple backticks, or the builder will not see the fence.) **`## Notes` is the only extra `## ` heading allowed** (Offer Readiness, operator decision 2026-09-28; `offer-readiness.md`): `lifecycle_docx_presentation.ps1` gives `## When to Use`, `## Call Script`, `## Confirmation Page` and `## Notes` their own modes and turns every other `## ` heading into an email step, so any new heading becomes a fake email in the DOCX. Inside `## Notes` the builder reads plain lines only (bold labels print as literal asterisks, fence markers are dropped, `### ` prints as text), so the block uses plain `- ` bullets with plain-text labels.

**The `## Notes` block is written by a script, not by hand** (Offer Readiness, operator decision 2026-09-28). After this file is written, run `python outbound/scripts/offer-readiness/build_reply_playbook.py <client-dir>`. It inserts (or refreshes in place) one `## Notes` block, placed last after `## Call Script`, holding what counts as a yes, the turnaround, the fulfillment handoff, the call brief, Aaron's FAQ lines, the never-claim list and the hand-to-human triggers. It also compiles `reply-playbook.md`, a paste view the operator may use in the reply inbox on the locked sending platform; Claude never creates or edits a reply agent from it, and a reply agent stays on draft-and-approve until 80% of its first 50 drafts go out with light or no edits. Never write a second `## Notes` block by hand. **New prospect-facing lines** (an FAQ answer, the over-cap reply a qualified yes gets once the week's `free_unit_cap_per_week` is used) **are Aaron's call** (`aaron-lane.md`): they come from a fresh `/ask-aaron` sub-agent and are recorded word for word, never house copy, and they still pass the Copy QA Gate rails. **The asset yes-reply is Aaron's delivery reply word for word:** frame DR, or DR-input for an input request (`aaron-copy-frames.md`, "The delivery reply"), as his copy call recorded it under `delivery_replies` in `aaron-copy-call.md`. The Notes block never rewrites it.

**After the yes: Aaron's reply-stage rules (operator-approved Aaron alignment, 2026-09-21; the offer-type split, the qualification step and speed to lead added by the Aaron process alignment, operator directive 2026-09-22).** The reply is the start of the promise, not permission to change it (doctrine §11). Someone who said "send it" to a promised asset agreed to receive it, not to a meeting, form, subscription or purchase, so a cheap asset stays ungated.

**The qualification step for costly front ends** (Aaron process alignment, operator directive 2026-09-22; supersedes the 2026-09-21 reading that any form after a yes is a surprise the prospect never agreed to). When a trial, service or custom-work front end carries an `offer.qualification` rule, a short, disclosed qualification step decides who gets the free unit and who gets the standard offer. Aaron, Sep 21: "just because someone raises their hand doesn't mean you have to provide that free thing to them. You can now go through and cherry-pick." Disclosed means two things: the offer already states material eligibility ("for teams that fit X", set at offer lock), and the reply names the step in one plain clause before the prospect meets it (a couple of questions on the booking page, or asked by the caller on the call). It is never sprung after the fact. The questions are the rule's `form_fields` (his Sep 21 form asks for annual revenue, openness to a done-for-you partner, and the website). A qualified yes gets the free unit while the week's `free_unit_cap_per_week` has room. A yes that misses the `criteria` gets the standard offer, or the locked `If they don't qualify:` line when there is no standard offer to make. A qualified yes that arrives after the week's cap is used also gets the standard offer; that is the house reading behind `/offer-test-slate`'s scale review (the capacity answer sets how many qualified yeses get the free unit each week, and the rest get the standard offer), not an Aaron rule, since he names no weekly cap. Where the client literally supplies the deliverable (their trial seats, their people, their stock), the client's confirmed capacity still caps it.

**Reply by offer type** (Aaron process alignment, operator directive 2026-09-22; supersedes the 2026-09-21 rule that a `direct_offer` yes gets no proposed times unless the prospect asks to talk). Email 1 depends on what the cold email offered, and no positive gets a blanket booking link:

- **A promised asset: Email 1 is the delivery reply** (ledger R03, the only outright reversal in his ledger; examples §7.3; Jul 13). For a free-deliverable offer, deliver the promised asset first, or, when delivery needs something from them, ask only for the inputs in the locked offer's `Input needed after yes:` line. No booking gate, no calendar link, no proposed times and no offer to walk them through it on a call in the delivery reply ("We don't want to force-feed them the calendar.", examples §7.3). A walk-through offer is a call ask disguised as help; his rule is "you don't want to add any sort of sales friction until they've actually consumed the value" (S06, transcript 2026-07-13). The asset's own link is the delivery, so it is fine. The next ask stays present but one layer down and refusable; his shape is "calendar's on the next page if you think there's interest" (examples §7.3). A call is a stated requirement only when the offer genuinely needs one.
- **A direct, trial or service offer: Email 1 proposes two specific times plus the calendar, with no re-selling.** The cold email closes on a permission CTA (ledger R17 retired the meeting ask there), so a yes is usually a request for more information, and on these offers the call is how that information gets shared. Aaron, Sep 21: "in most cases the person just wants some more information, and the call is the mechanism to do that", with the reply "Do you have some time available on X or Y? Here's my calendar". Write one or two sentences: a short acknowledgement, two real open slots from the closer's calendar in the prospect's time zone, and the calendar link for when neither works. If they asked a question, answer it in one sentence first. No recap of the offer, no case studies, no process walk-through. Where `offer.qualification` applies, the calendar link is the qualification page (the short form, then the calendar), and the reply names that step in one clause.
- **How this sits with Hard Rule 36** (`/campaign-copywriting`, the Delivery Message). They must say the same thing. On the asset path, with `offer.lead_magnet_gap` present, the delivery carries the asset and no demand, and the first follow-up carries the ask; with no gap, the asset goes out with one soft, refusable pointer to the next step. Never propose times in an asset delivery reply, whether or not the asset leaves an open question ("calendar's on the next page if you think there's interest", examples §7.3; ledger R03). On a direct, trial or service yes, Email 1 is the two-times-plus-calendar reply above. Any reply agent or inbox manager for the locked sending platform must draft from this file's templates and follow the same split. If the Hard Rule 36 text you are reading disagrees with this split (times or a calendar link in an asset delivery, or a direct, trial or service yes held back from proposing times), surface the mismatch to the operator instead of choosing silently.
- **Match the response to intent** (doctrine §11; the working categories are this system's safeguard built on his information-versus-booking distinction, not his own list, doctrine §13). An asset request gets the asset plus any input question delivery needs. A yes to a direct, trial or service offer gets the two-times reply above. A fit question gets verified eligibility; a no-fit answer gets the standard offer where `offer.qualification` applies, otherwise the locked offer's `If they don't qualify:` line. A price question gets a real price or the one variable it depends on. Booking intent gets two specific times or the real booking link. A referral gets thanks and one ask for the right person. An objection gets one honest sentence. An opt-out stops. Do not treat every positive word as a sales-qualified lead.
- **Answer in one sentence and leave the loop open.** "One sentence is almost always the better move" (doctrine §9). A reply with the full process, pricing and three case studies answers everything and leaves no reason to take the next step (doctrine §10).
- **Speed to lead** (Aaron process alignment, operator directive 2026-09-22; supersedes the 2026-09-21 wording that left the first reply to a live-drafting reply agent where the stack contract names one and made the call an optional escalation). The first reply goes out inside 5 minutes where possible (doctrine §11), pre-drafted from this file's category template so a person edits it rather than writing from a blank page. **Every interested reply on a direct, trial or service offer also gets a call within about 5 minutes** (Sep 14; Sep 21: "that 5-minute speed to lead"; "the kicker" on Apr 20, examples §7.2), made by the speed-to-lead owner from this file's `## Call Script`. The chain (the locked sending platform's interested-reply webhook where it offers one, the phone number from the replier's own reply or signature first and then the contact-enrichment slot's phone reveal where the stack contract declares one, then the call) is defined once, in `reply-scoring-core.md` (Speed to lead). **The always-on webhook receiver does not exist yet**, so until it does the reply sweep runs several times a day during sending hours, and every report states that the 5-minute call is a target, not yet a mechanism. **A plain asset request is different.** His own teaching is unresolved on when that call starts (ledger R20): the July 13 video says no sales push until the asset has been used, while his Apr 20 and Sep 14 videos call interested replies within 5 minutes. House reading until the operator rules, which is not Aaron's ruling: on an asset offer, call repliers who ask for a meeting, and interested replies that ask about working together, within minutes; for a plain asset request, deliver first and hold any call until the asset has been used (attribution corrected 2026-09-21: this used to present that scoping as ledger R20's). Calling and texting compliance by jurisdiction is the operator's call; this skill does not rule on it. Any reply agent or inbox manager for the locked sending platform must say the same thing as this file.
- **Email 2 onward is the post-interest subsequence** (examples §7.2), triggered on **"positive, not yet booked"** (Aaron process alignment, operator directive 2026-09-22; supersedes the "no response to Email 1" trigger). It covers every positive replier who has no booked call a few days after Email 1, including one who replied again but never booked (Apr 20: "put them into a subsequence that then reminds them to book that discovery call"; Sep 21: people who showed interest but have not converted "slowly start to trickle in"). A booking stops it and hands the prospect to `pre-call.md`. One to three emails shortly after interest (his instance: two, three or six days, maybe one after that; the exact delays are a house decision). On an asset offer each one shows curiosity about the asset (did they get a chance to dive into it, any thoughts on it). On a direct, trial or service offer with no asset, each one is a curiosity-led booking reminder instead: a light question about what they wanted to see, then the same two-times-or-calendar ask. Never a bump or a guilt trip, and never name the non-reply. The ask stays the same across the steps, and escalation happens on their reply, not on a timer. When Hard Rule 36 defers the call ask to the first follow-up, that follow-up aims it at the unresolved motive (`offer.lead_magnet_gap`) and keeps it refusable; Hard Rule 36's day-7 close keeps that same ask and stays guilt-free. Add further `## Email N` blocks the same way, three subsequence emails at most.

**Category templates** (Aaron process alignment, operator directive 2026-09-22). Write one `## Email 1: <category>` block for each reply category this offer can produce, so every reply is pre-drafted from a template instead of from scratch (Aaron, Sep 21: replies drafted "based on templates that we've established for each client specifically and what their offer is"). At minimum: the yes reply for this offer's type (asset delivery, or two times plus the calendar), booking intent, price question and referral; the qualification outcome where `offer.qualification` applies, otherwise a not-a-fit block built on the `If they don't qualify:` line; and one objection block for each top objection in `offer-intelligence.md`, when it records any. Opt-outs get no template: they stop. Where the offer carries a weekly free-unit cap, the over-cap reply is one more `## Email 1: <category>` block, written by a fresh `/ask-aaron` sub-agent (Offer Readiness, operator decision 2026-09-28); FAQ answers go in the script-built `## Notes` block, not in new headings.

**The call script** (`## Call Script`, required on every direct, trial or service offer and on any asset offer whose house R20 reading calls a replier). Its shape follows the setter script Aaron describes (Sep 14, examples §7.2): an opener, two specific slots ("Thursday at 2 or Friday at 1 p.m. Do either of those times work for you?"), a disclosed ask to answer a couple of questions before booking, two or three prequalification questions taken from `offer.qualification.criteria` (or from the ICP when the offer has no rule), then a voicemail and a text fallback when nobody answers. The text fallback is sendable copy and passes the Copy QA Gate; the spoken lines keep the same voice (short, plain, no pressure) but are not held to the email formatting rules.

Write to `profiles/<business-slug>/campaigns/<campaign-slug>/interested-reply.md`:

```markdown
# Interested-Reply Flow - <Campaign Name>

## When to Use
A prospect replied positively to the cold sequence.
Offer type: <asset | direct | trial | service>. Qualification rule: <a one-line summary of offer.qualification, or none>.
Speed-to-lead owner: <the person the operator named at Gate D>. Target: a first reply and, on a direct, trial or service offer, a call within about 5 minutes.

## Email 1: <the yes reply for this offer type>
**Trigger:** Positive reply to the offer
**Send as:** Reply on the same thread
**Subject:** <only if starting a new thread; otherwise omit>

​```
<QA-approved body.
Asset offer: deliver the promised asset (its link is the delivery) in Aaron's frame DR word for word, or ask only for the inputs in `Input needed after yes:` in frame DR-input (aaron-copy-frames.md). One or two sentences, one refusable next step one layer down. No calendar link, no proposed times, no offer to walk them through it on a call.
Direct, trial or service offer: one or two sentences with two specific times and the calendar link (the qualification page where offer.qualification applies, named in one clause). No re-selling.>
​```

**Word count:** <N>

## Email 1: Booking intent
**Trigger:** The prospect asks to talk or asks for times
**Send as:** Reply on the same thread

​```
<QA-approved body. Two specific times plus the calendar link, in one or two sentences.>
​```

**Word count:** <N>

## Email 1: <next category, e.g. Qualification outcome, Price question, Referral, Objection>
**Trigger:** <the reply category>
**Send as:** Reply on the same thread

​```
<QA-approved body. One sentence answering the category, one refusable next step.>
​```

**Word count:** <N>

## Email 2
**Trigger:** Positive, not yet booked, <N> days after Email 1
**Send as:** Reply on the same thread

​```
<QA-approved body. Asset offer: curiosity about the asset (did they get a chance to look, any thoughts), the same refusable ask. Direct, trial or service offer: a curiosity-led booking reminder with the same two-times-or-calendar ask. Never a bump.>
​```

**Word count:** <N>

## Call Script
​```
Caller: <the speed-to-lead owner>. Call within about 5 minutes of the interested reply.

Opener: <one line: who is calling, and that they are following up on the reply about <offer>.>

Slots: <two real open times from the closer's calendar, e.g. "Thursday at 2 or Friday at 1. Do either of those work for you?">

Prequalification: <"Do you mind answering a couple of quick questions before I book this in?", then 2 or 3 questions from offer.qualification.criteria, or from the ICP when there is no rule.>

Voicemail: <one or two sentences: name, why you called, and that a text with two times is on its way.>

Text fallback: <QA-approved, one or two sentences: the two times and the calendar link.>
​```

## Notes
<written by build_reply_playbook.py after this file exists; never hand-written. Plain "- Label: text" bullets only: what counts as a yes, turnaround, fulfillment handoff, call brief, Aaron's FAQ lines, never-claim, hand-to-human triggers>
```

## Output 3: Pre-call / booked-call nurture (`pre-call.md`)

The confirmation page and the nurture drip between a booked call and the call itself, plus a no-show email. The `/pre-call-nurture-docx-presentation` builder reads a `## When to Use` section, the `## Confirmation Page` section, `## Email...` headings, `## If They No-Show`, a `## Notes` section, `**Subject:**` / `**Purpose:**` / `**Word count:**` bold-label lines, and fenced body blocks (plain triple-backtick fences, no language tag, no other bold labels).

**The job of the pre-call stage** (Aaron process alignment, operator directive 2026-09-22). Pre-answer what the buyer needs settled to decide, so the call is not a Q&A. Aaron, Sep 21: booked prospects are "nurtured with pre-call assets such as a confirmation page", so they arrive "with all of the information that they need in order to make a decision, and the call doesn't become some massive Q&A session." **The `## Confirmation Page`** is the copy for the page the prospect sees right after booking: one line confirming the call, what happens on it, anything to have ready, and a short FAQ. Every FAQ answers a real objection that `/offer-intelligence` found (its First-Party Buyer Voice from won and lost calls first, then the public objections), in the buyer's own words, and each one's source objection is recorded in `## Notes`, never on the page. Never invent an objection to fill the FAQ: three real ones beat six made-up ones. Hosting the page (the booking tool's own confirmation screen or a simple page) is outside this skill, and its URL is the `{{confirmation_page_link}}` variable.

**Pre-call rules (operator-approved Aaron alignment, 2026-09-21).** Each email does one job, stays short, standalone and conversational, and carries one clear next step (doctrine §11: email two has the same spec as email one). Each job is pre-answering one question the buyer needs settled before the call. Email 2's proof point is one point only: a near-twin, same-mechanism result with one plain named number and no acronyms, never generic proof (doctrine §9, examples §6). One next step at a time: the call link plus at most one resource, never a pile of links (doctrine §11); the confirmation page counts as that one resource. The no-show email offers the rebook without guilt, blame or fake urgency (examples §7.1).

Write to `profiles/<business-slug>/campaigns/<campaign-slug>/pre-call.md`:

```markdown
# Pre-Call Nurture Flow - <Campaign Name>

## When to Use
A prospect has booked a call. The confirmation page shows at booking; the emails send between booking and the call.
Variables used: {{first_name}}, {{call_time}}, {{call_link}}, {{confirmation_page_link}} (list only the ones the copy uses).

## Confirmation Page
​```
<QA-approved page copy. One line confirming the call and {{call_time}}. What happens on the call, in two or three plain sentences. What to have ready, if anything.

FAQ

Q: <a real objection from offer-intelligence.md, in the buyer's words>
A: <one to three sentences, honest, no hype>

Q: <the next real objection>
A: <answer>>
​```

## Email 1
**Subject:** <QA-approved subject>
**Purpose:** Confirm the call, set one expectation, and link the confirmation page

​```
<QA-approved body>
​```

**Word count:** <N>

## Email 2
**Subject:** <QA-approved subject>
**Purpose:** Pre-answer the top remaining question with one near-twin proof point or one FAQ answer

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

## Notes
FAQ sources: <each FAQ's objection and where offer-intelligence.md found it (a won or lost call, or a named public source)>
```

## What to do next

Before a campaign's Start, report its reply readiness for Gate D in one line per item: `interested-reply.md` with its category templates and `## Call Script`; `pre-call.md` with its `## Confirmation Page`; the offer's `offer.qualification` rule where the offer has a costly front end; the named speed-to-lead owner; the 5-minute target on the `Speed-to-lead owner:` line. Name every placeholder still open (the calendar link, the owner, an FAQ with no objection source) as a gap rather than rounding it up to ready, and log the result in the activity log. The orchestration skills run the gate itself.

After writing a lifecycle file and passing QA, package it only when the operator asks for a DOCX (plain-text outputs, operator decision 2026-09-28); the Markdown or YAML file is the deliverable:

- `followups.yaml` → `/cold-email-followups-docx-presentation`
- `interested-reply.md` → `/interested-replies-docx-presentation`
- `pre-call.md` → `/pre-call-nurture-docx-presentation`

If copy fails QA at the DOCX stage, that skill routes back here. Fix the copy, re-run QA, then re-package.

## Related skills

- `/campaign-copywriting` - writes the main cold sequence (`variants.yaml`); this skill continues that voice and offer into lifecycle copy
- `spam-word-checker.md` - formatting, CTA, opener and voice gate, with no keyword blocklist (read inline, applied before any copy is written)
- `cold-email-copy-best-practices.md` - writing-quality and CTA gate (read inline)
- `/ask-aaron` - the doctrine behind this skill's follow-up and after-the-yes rules (`aaron-doctrine.md` §9 and §11, `aaron-examples.md` §7 and the §8 rejection bank). In the Aaron lane (`aaron-lane.md`) his copy call writes the delivery reply, and a fresh sub-agent call writes any new prospect-facing reply line; this skill records those word for word
- `aaron-copy-frames.md` - Aaron's copy frames: DR and DR-input for the delivery reply, FU1 to FU4 for follow-up shapes worth borrowing in `followups.yaml`; `outbound/scripts/aaron_frame_check.py` checks frame ids where a file records them
- The inbox manager or reply-agent setup skill for the locked `run_state.sending_platform`, if `/stack-setup` activated a pack that provides one - pre-drafts each reply from `interested-reply.md`'s category templates for a person to edit, and its booking and qualifying guidance must match `interested-reply.md`. If no pack is active, the replies are drafted from these templates in that platform's own reply inbox; if neither exists, say so and draft them by hand.
- `/lead-magnet-brainstorm` - writes the locked offer's `Input needed after yes:` and `If they don't qualify:` lines, and the `offer.qualification` rule for costly front ends, that `interested-reply.md` uses
- `/offer-intelligence` - finds the real objections that become the confirmation-page FAQs in `pre-call.md` and the objection templates in `interested-reply.md`
- `reply-scoring-core.md` - the speed-to-lead chain, the `meeting_book_rate` definition, the unanswered-positives list and the response-latency audit that check these templates in use
- `/phase-4-copy-launch` (step 3, the reply machine), `/cold-email-kickoff`, `/continue-client` - run this skill and Gate D (reply readiness) before the operator's Start
- `offer-readiness.md` and `outbound/scripts/offer-readiness/build_reply_playbook.py` - the script-built `## Notes` block and `reply-playbook.md`
- `/cold-email-followups-docx-presentation` - packages `followups.yaml`
- `/interested-replies-docx-presentation` - packages `interested-reply.md`
- `/pre-call-nurture-docx-presentation` - packages `pre-call.md`
- `/clarification-first` - native choice-prompt pattern for the flow-selection question

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short: record status, not raw output. Full protocol: `client-activity-log.md`.
