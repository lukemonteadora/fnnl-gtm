---
name: lifecycle-copy
description: Writes the post-initial-sequence lifecycle email copy that the lifecycle DOCX skills package — no-reply follow-ups (followups.yaml), interested-reply handling (interested-reply.md), and pre-call/booked-call nurture including the no-show email (pre-call.md). Use after the main cold sequence is written by /campaign-copywriting and the campaign needs follow-up, positive-reply, or pre-call nurture copy. This is the producer the lifecycle DOCX skills depend on; without it followups.yaml / interested-reply.md / pre-call.md never exist.
---

# Lifecycle Copy

## Canonical Profile Root

All profiles/<business-slug> paths in this skill resolve under:

```text
<coldoutbound-skills>/profiles
```

Here `<coldoutbound-skills>` is the root of this skill library - resolve it to wherever the library is currently checked out (local Documents, OneDrive, or a git worktree); never hardcode an absolute path. Do not create client profiles under a `profiles/` folder at your current working directory.

## What this skill is

`/campaign-copywriting` writes the main cold sequence to `variants.yaml`. It does **not** write the lifecycle copy that comes after the cold sequence. This skill fills that gap. It produces three lifecycle artifacts, each consumed by a matching DOCX presentation skill:

| Lifecycle flow | This skill writes | Packaged by |
|---|---|---|
| No-reply follow-up / re-engagement | `profiles/<business-slug>/campaigns/<campaign-slug>/followups.yaml` | `/cold-email-followups-docx-presentation` |
| Interested-reply handling (after a positive reply) | `profiles/<business-slug>/campaigns/<campaign-slug>/interested-reply.md` | `/interested-replies-docx-presentation` |
| Pre-call / booked-call nurture (+ no-show email) | `profiles/<business-slug>/campaigns/<campaign-slug>/pre-call.md` | `/pre-call-nurture-docx-presentation` |

This skill writes copy only. It does not package DOCX, upload, or send. The DOCX skills format what this skill produces; they explicitly route back here when their source file is missing.

## When to use

- After `/campaign-copywriting` has produced `variants.yaml` for the campaign and the user wants any of: no-reply follow-ups, an interested-reply flow, or a pre-call nurture flow.
- When a lifecycle DOCX skill reports its source file is missing and routes back to "lifecycle copy creation" — that is this skill.

Pick which flow(s) to write with a native choice prompt (recommended option first, Custom answer last) from `/clarification-first`:

```text
Which lifecycle copy should I write?

A. [Recommended] No-reply follow-ups (followups.yaml)
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
- `profiles/<business-slug>/lead-magnets.md` — the locked offer
- `run_state.sending_platform` — for any platform-specific variable tokens

Do not invent a different offer or CTA than the one locked for the campaign. Lifecycle copy continues the same conversation.

**Verified-list gate (inherited).** This skill runs only after `/campaign-copywriting` produced `variants.yaml` for the slice, which itself passed the verified-list gate (`verified-list-gate.md`). So `followups.yaml` inherits that gate via its parent cold sequence — confirm `variants.yaml` exists before writing it. `interested-reply.md` and `pre-call.md` are post-reply / post-booking (a reply or booking already exists), so they assert only the parent gate, never a fresh `leads.verified.csv` check.

## Copy QA Gate (mandatory — same gate as /campaign-copywriting)

Every subject line, body, and CTA this skill writes must pass, in order, before it is shown to the user or written to any file:

1. `spam-word-checker.md` — banned wording, formatting bans, weak/forbidden CTAs, follow-up-reference openers, silence-based closeout logic
2. `cold-email-copy-best-practices.md` — writing-quality and CTA standards

Also enforce the **Confirmed Deliverable Gate**: every CTA must map to a real, operator-producible deliverable. Hard-stop on unconfirmed audits, scorecards, benchmarks, ROI reports, or trials.

If any line fails QA, rewrite it until it passes. Do not write a file containing failed copy. This skill is not allowed to output unreviewed copy. After writing each file, re-scan it for banned tokens, em dashes, double hyphens, and banned variable roots, exactly as `/campaign-copywriting` does after serializing `variants.yaml`.

## Output 1 — No-reply follow-ups (`followups.yaml`)

For prospects who did not reply to the main sequence. Keep follow-ups short, add a new angle each time, and never open with "just following up" / "circling back" / "bumping this" (banned by `spam-word-checker.md`). Each follow-up must stand on its own and give a fresh reason to reply.

**Context note (short bumps).** A very short "looks manual" bump (a one-line nudge) reads as low-friction, but the effect is diluted when it sits as a reply under a clearly structured first email the prospect can still see. For audiences that get heavy outbound, a standalone fresh-thread re-engagement performs better than an in-thread bump. In-thread bumps remain fine for lower-sophistication segments. Either way, never open with a follow-up-reference line.

**Context note (no-oriented / last touch).** Manipulative breakup framing ("guess the timing isn't right, I'll stop") is now recognized on sight in outbound-aware segments (SaaS, agencies, anyone who runs cold email), and our doctrine already bans silence-based and goodbye closeouts (`spam-word-checker.md`). If a final no-oriented touch is used, prefer a direct close that respects their time: "A one-word reply is enough if you'd rather I step out of your inbox. If the timing changes, my details are below." That is the action-conditional closeout the spam checker allows, not a silence-based promise.

**Pre-write note.** Under the pre-written copy path (`/campaign-copywriting` Pre-Written Email Copy Architecture), re-engagement bumps and any final no-oriented touch are usually static fields shared across the segment (one written version applied to every row), not per-contact AI copy. Write one version, confirm it references the correct pain from the main sequence, and apply it as the static value. This holds whether you use Task sub-agents, Clay, RevCode, Claude Code, or any equivalent enrichment tool. Static copy is faster and cheaper than AI generation for these.

Write to `profiles/<business-slug>/campaigns/<campaign-slug>/followups.yaml`. Match the field names and forms below exactly: the builder parses `subject:` inline (one line) and `body:` as a block scalar (`body: |` with 10-space-indented content). Never use a block scalar for `subject` or an inline escaped string for `body`.

```yaml
name: "<campaign name - must match the campaign slug>"
# TRIGGER: <when this fires, e.g. No reply to the main sequence after N days>
# PURPOSE: <one sentence: what this re-engagement is trying to restart>
# SETUP: <where to build it and which leads to pull, e.g. the no-reply segment after Day N>
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
          <QA-approved body, plain text, new angle, no "following up" opener>
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
<QA-approved body. Move toward the confirmed deliverable or a low-friction next step.
No links or calendar links unless the offer explicitly requires one and it passed QA.>
​```

**Word count:** <N>

## Email 2
**Trigger:** No response to Email 1 after <N> days
**Send as:** Reply on the same thread

​```
<QA-approved body>
​```

**Word count:** <N>

## Notes
<only if needed; otherwise omit>
```

## Output 3 — Pre-call / booked-call nurture (`pre-call.md`)

The nurture drip between a booked call and the call itself, plus a no-show email. The `/pre-call-nurture-docx-presentation` builder reads a `## When to Use` section, `## Email...` headings, `## If They No-Show`, `**Subject:**` / `**Purpose:**` / `**Word count:**` bold-label lines, and fenced body blocks.

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
- `spam-word-checker.md` - banned wording and formatting gate (read inline, applied before any copy is written)
- `cold-email-copy-best-practices.md` - writing-quality and CTA gate (read inline)
- `/cold-email-followups-docx-presentation` - packages `followups.yaml`
- `/interested-replies-docx-presentation` - packages `interested-reply.md`
- `/pre-call-nurture-docx-presentation` - packages `pre-call.md`
- `/clarification-first` - native choice-prompt pattern for the flow-selection question

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short — record status, not raw output. Full protocol: `client-activity-log.md`.
