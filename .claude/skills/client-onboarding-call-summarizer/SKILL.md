---
name: client-onboarding-call-summarizer
description: Turn a raw client / discovery / sales / onboarding call transcript into a structured "what we learned" brief that feeds /icp-onboarding and /client-intake-form. Extracts everything learned about the client's business, ICP, offer, pain, proof, and constraints, maps it to the onboarding fields, captures verbatim ICP pain quotes, and flags what is still unknown to ask. Learning-focused. NO action-item / to-do checklist (that is the personal anthropic-skills:ai-meeting-summarizer; this is the client-onboarding version). Accepts pasted text or Fathom / Otter / Zoom / Teams exports. Runs inside Claude Code (no API spend).
---

# Client Onboarding Call Summarizer

Turn a raw call transcript into onboarding-ready intelligence. This is the **client-facing** sibling of `anthropic-skills:ai-meeting-summarizer`: same transcript-in / structured-notes-out idea, but a different purpose and format. The personal version ends in a task / action-item checklist; **this one does not**. Its only job is to answer two questions: *"What did we learn about this client that belongs in their ICP onboarding / intake?"* and *"What is still unknown, so we know what to ask?"*

## Canonical Profile Root

All profiles/<business-slug> paths in this skill resolve under:

```text
<outbound>/profiles
```

Here `<outbound>` is the root of this skill library - resolve it to wherever the library is currently checked out (local Documents, OneDrive, or a git worktree); never hardcode an absolute path. Do not create client profiles under a `profiles/` folder at your current working directory.

## What this is for (and is not)

- **For:** feeding `/icp-onboarding` and `/client-intake-form` with confirm-or-correct pre-fill, and building the client's record. It captures what was learned, what was mentioned, and any detail valuable to the ICP / offer / source picture.
- **NOT for:** action items, to-do lists, next-step checklists, or meeting-minutes formatting. There is **no "Action Items" section** (by design). If the transcript contains commitments or next steps, fold them into "What We Learned" as context, never as a task list.
- **NOT a decision-maker:** it does not lock an offer, choose an ICP, or write `client-profile.yaml`. It produces notes that `/icp-onboarding` / `/client-intake-form` turn into the profile, so the human still confirms every field.

## Inputs

- A raw transcript: a discovery call, sales call, onboarding / kickoff call, or "go for a walk and talk" voice memo. Accepts pasted text or Fathom / Otter / Zoom / Teams / Granola exports (full, partial, or fragmented).
- Optional: the business slug / name, if known. If it is not stated, infer it from the company named in the transcript, or ask once.
- **Not Slack, email or shared files.** Slack channels and pasted Slack threads are read by the client Slack check (`client-slack-check.md`), which writes `slack-context.md` in this same field-map shape, and the rest of the client context sweep (`client-context-sweep.md`: Slack DMs, email, the calendar, docs and local files) writes `context-sweep.md` the same way, so do not re-summarize them here. A call recording or transcript either one finds (linked in Slack, attached to an email, sitting in a Drive folder) does come here.
- A client meeting found by the client intel feed. `/client-intel-sync` (run on demand) files notetaker recap emails under `profiles/<business-slug>/_intel/meetings/` and lists them in `client-intel.md` (protocol: `client-intel-feed.md`). A recap is the notetaker's summary, not a transcript, so it is context here, never a substitute. When the feed shows an onboarding or discovery call and the full transcript is reachable, run the transcript through this skill to write the onboarding notes.

Works inside Claude Code, with no API spend for the summarization. For a very long transcript, split it into ordered chunks and fan them out across Claude Code sub-agents per `/personalization-subagent-pattern` (one chunk per agent, one output file per agent), then merge and de-duplicate the findings in the session; the output schema below is unchanged. No outside AI provider is used (no-AI-API rule, operator directive 2026-09-22).

## Material Decision Rule

When this skill reaches a material fork, name the realistic options, recommend the strongest path, and explain why the main alternatives are weaker before committing.

Ask before choices that affect spend beyond an approved budget, provider routing, source of truth, list quality, campaign direction, client-facing output, live systems, scraping or account risk, or legal/compliance risk. For low-risk reversible choices, state the recommendation and proceed.

When asking the user, use the Claude Desktop native Interactive Inputs / Choice Prompts pattern from /clarification-first: recommended option first, short choices, and Custom answer last when a custom answer is plausible.

## Interaction Policy

Defers to `/autonomous-execution-policy`. Under `run_state.execution_mode = auto_execute` (the new-client default since 2026-09-24, paired with `review_protocol: phase_checkpoints` so a run stops only at `/cold-email-kickoff`'s four phase checkpoints; `review_gates` is opt-in), proceed without pausing: summarize, write the notes, and continue. Never re-ask a decision already in `run_state`, the profile, memory, or the operator's latest message. There is no spend here, so no spend gate. On a long async wait, background-poll and move to other productive work. Never idle.

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short: record status, not raw output. Full protocol: `client-activity-log.md`.

## What to extract (map every learning to an onboarding field)

Read the whole transcript and pull everything relevant to these field groups (the same shape `/icp-onboarding` and `/client-intake-form` collect). Capture only what was actually said or clearly implied. **Never invent**. Mark anything uncertain.

- **Business:** what they sell (one-liner), website, value prop, how they make money, tone / voice.
- **Best customer / ICP:** the single best existing customer described, the buying function and seniority (plus any example job titles named; the full title stack comes from the locked offer, so never narrow to one title), headcount range, industries in / out, target geography (countries / states / cities in and out of scope).
- **Pain & why-now:** the problems the ICP has *in their own words*, buying triggers, what makes outreach timely.
- **Offer clues:** any front-end offer / lead magnet / CTA the client suggested (a **hypothesis**, never a locked offer), what they legally cannot offer or claim, and any delivery facts they mentioned (capacity remarks are context for the post-test scale review, never a limit on which offers get tested).
- **Proof:** named customers, case studies, metrics, results mentioned.
- **Capability boundary:** deliverable strengths, operational limits, legal / compliance limits.
- **Exclusions & constraints:** competitors / customers to exclude, banned words, regulated-industry constraints.
- **Anything else valuable:** facts about the client, market, competitors, or context worth keeping in the record even if it does not map to a single field.

## Output

Write to:

```text
profiles/<business-slug>/onboarding-call-notes.md
```

Create the profile folder if it does not exist yet. This skill often runs **before** onboarding. For multiple calls, suffix with a date: `onboarding-call-notes-<YYYY-MM-DD>.md`.

Use this structure (note: **no action-item section**):

```markdown
# Onboarding Call Notes: <Client> (<YYYY-MM-DD>)
**Source:** <discovery / sales / onboarding call; pasted text / Fathom / Otter / Zoom / Teams>
**Attendees (if named):** <...>

## What We Learned
<the substance: concise bullets grouped by the field groups above (Business; Best customer / ICP; Pain & why-now; Offer clues; Proof; Capability boundary; Exclusions & constraints; Other). Only what was said or clearly implied.>

## In Their Own Words (verbatim quotes worth keeping)
<exact phrases the client or their market used about pain, goals, or buying. These feed copywriting later. Quote, do not paraphrase. Tag each quote by speaker: the client describing their own buyers is `client_material` (second-hand), and a buyer's own words on a recorded sales call are `sales_call` (`market-evidence-standard.md` section 2), so downstream research never counts the client's opinion as buyer pain.>

## Maps To Onboarding Fields
| Onboarding field | What the call gave us | Confidence |
|---|---|---|
| business one-liner / website / tone | <value or n/a> | high / med / low |
| best customer | | |
| buying function + seniority (example titles) | | |
| headcount min / max | | |
| industries in / out | | |
| geography in / out | | |
| ICP pain / triggers (why-now) | | |
| client-suggested offer / CTA (hypothesis only) | | |
| legal / claim limits (hard) | | |
| delivery facts and capacity remarks (scale-review context, not a filter) | | |
| proof points (customers, metrics) | | |
| exclusions (competitors / customers) / banned words | | |

## Still Unknown: Ask In Onboarding
<the gaps. Every onboarding field the call did NOT cover, phrased as the question /icp-onboarding or /client-intake-form should ask. This replaces the personal version's action items: it is "what's missing for the ICP record," not "to-dos.">

## Notes / Flags
<anything ambiguous, contradictory, or that needs the operator's judgment; missing-information flags. Omit if none.>
```

Always include the **Maps To Onboarding Fields** table and the **Still Unknown** section, even if sparse. A field with no signal is itself a useful "ask this in onboarding" flag. **Never fabricate a value to fill a row**; write `n/a` and push it to Still Unknown.

## What to do next

Hand the notes to onboarding:

- New client with no profile yet → run `/client-intake-form` (or `/icp-onboarding`); use this file as confirm-or-correct pre-fill for every field, and work the **Still Unknown** list as the questions to ask.
- These notes are **evidence / pre-fill, not the profile.** The human confirms each field before it is written to `client-profile.yaml`. Client-suggested offers stay under `offer.client_suggested_*`, never `offer.lead_magnet`.

## Related skills

- `/icp-onboarding` - consumes these notes as pre-fill; this skill answers many of its interview questions in advance
- `/client-intake-form` - same; folds these notes into its pre-fill map
- `/personalization-subagent-pattern` - the sub-agent fan-out (disjoint chunks, merge, dedupe) for very long transcripts
- `client-slack-check.md` - the Slack sibling of this skill: reads the client's Slack channels and writes `slack-context.md` in the same field-map shape, so read both together and flag where a call and the channel disagree
- `client-context-sweep.md` - the mandatory first onboarding step that runs the Slack check plus Slack DMs, email, the calendar, docs and local files, and hands any call transcript it finds to this skill
- `/client-intel-sync` - files meeting recaps from notetaker emails into `client-intel.md` on demand (a recap is a summary, not a transcript); when the feed shows an onboarding or discovery call and the full transcript is reachable, this skill turns it into onboarding notes
- `anthropic-skills:ai-meeting-summarizer` - the personal, action-item version; use that for your own internal meetings, this one for client onboarding
