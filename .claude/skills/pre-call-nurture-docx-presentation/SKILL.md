---
name: pre-call-nurture-docx-presentation
description: Creates a compact client-facing DOCX presentation for pre-call nurture flows from approved Markdown files such as pre-call.md, including the confirmation page and its FAQs. Use when packaging what the prospect sees at booking and what gets sent between booking and the sales call, using the same shared cold email DOCX formatting as the campaign sequence presentation.
---

# Pre-Call Nurture DOCX Presentation Skill
## Canonical Profile Root

All profiles/<business-slug> paths in this skill resolve under:

```text
<outbound>/profiles
```

Here `<outbound>` is the root of this skill library - resolve it to wherever the library is currently checked out (local Documents, OneDrive, or a git worktree); never hardcode an absolute path. Do not create client profiles under a `profiles/` folder at your current working directory.

Create a simple DOCX for the drip between booking and call.

This skill formats existing pre-call copy. It does not write or rewrite the nurture flow.

---

## Copy QA Dependency

Before packaging the DOCX, read the source Markdown and confirm the sendable copy still passes:

1. `spam-word-checker.md`
2. `cold-email-copy-best-practices.md`

Stop and route back to `/lifecycle-copy` (the producer of `pre-call.md`) if the copy fails. Do not silently rewrite copy inside this DOCX skill.

This copy is written before the campaign's Start (Gate D, reply readiness) but only ever sent after a booking, so it inherits the parent campaign's **verified-list gate** (`verified-list-gate.md`) rather than re-checking a verified list. Confirm the parent sequence was gate-built; do not run a fresh `leads.verified.csv` check here.

Hard-stop examples include em dashes, double hyphens, mid-sentence dash separators, weak CTAs, unconfirmed CTA deliverables, follow-up-reference openers, or unsafe link and calendar usage. **Warm copy is judged by the warm rules** (Aaron process alignment, operator directive 2026-09-22; supersedes applying the cold-sequence link and calendar bans here). The cold-sequence bans, such as `cold-email-copy-best-practices.md`'s "Keep calendar links out of emails 1-3", apply to cold steps only. In `pre-call.md` the call link and the confirmation-page link are expected and must not be flagged; "unsafe" means a pile of links (more than the call link plus one resource per email, `/lifecycle-copy` Output 3) or a confirmation-page FAQ that answers an objection `/offer-intelligence` never found.

---

## Source Of Truth

Use the approved Markdown file:

```text
profiles/<business-slug>/campaigns/<campaign-slug>/pre-call.md
```

If the file is missing, report that it is missing and route back to `/lifecycle-copy` (the producer of `pre-call.md`).

---

## Output Shape

Keep the document simple:

1. Title
2. Short intro
3. When to use
4. Variables needed, if present in source
5. Confirmation Page (`## Confirmation Page`: the page copy and its FAQs), rendered as its own section before the sequence
6. Sequence
7. Scheduled emails plus no-show email, if present
8. Short notes only if already present in source (for `pre-call.md`, the FAQ sources)

The parser reads `## Confirmation Page`, `## Email...` headings, `## If They No-Show`, `**Subject:**`, fenced email body blocks, word count, purpose, variables, and notes. `## Confirmation Page` renders under its own heading with one paragraph per line (so each FAQ question and answer keeps its own line) and no subject line (added to `scripts/lifecycle_docx_presentation.ps1` on 2026-09-23 for the Aaron process alignment). A section that comes before the first email renders before the sequence.

---

## Formatting Contract

Use the exact same contract as `/cold-email-campaign-sequence-docx-presentation`:

- Calibri font
- 0.75 inch margins
- Title: 20 pt bold
- Section headings: 16 pt bold
- Trigger / purpose labels: 12 pt bold
- Supporting text: 9.5 pt
- Email headers: 12 pt bold
- Subject lines: 10 pt bold
- Email body paragraphs: 10 pt, `List Paragraph`, 8 pt spacing after

---

## Required Builder

```powershell
powershell -ExecutionPolicy Bypass -File scripts\lifecycle_docx_presentation.ps1 `
  -ProfileSlug "<business-slug>" `
  -SourcePath "profiles/<business-slug>/campaigns/<campaign-slug>/pre-call.md" `
  -FlowType "pre-call" `
  -OutputName "Pre-Call Nurture Flow - Client Name.docx"
```

**Google Doc (when configured).** After the DOCX renders, also create/update a native Google Doc so the client never has to upload it: gated on the one-time setup in `reference/gdoc-export-setup.md`; the script exits `2` and is safely skipped if creds are not set:

```powershell
node scripts\docx_to_gdoc.mjs --in "profiles\<business-slug>\Pre-Call Nurture Flow - Client Name.docx" --title "Pre-Call Nurture Flow - Client Name"
```

---

## QA

After generation, open the DOCX with Word COM, confirm the Confirmation Page section and the scheduled and no-show blocks are present, export a temporary PDF sanity check, delete the PDF, and scan for mojibake markers such as garbled accented characters or garbled quote sequences.

If a spam or best-practice issue is found, report it and route back to copy editing. Do not silently rewrite copy.

---

## Related Skills

- `/cold-email-campaign-sequence-docx-presentation`
- `/cold-email-followups-docx-presentation`
- `/interested-replies-docx-presentation`
- `/lifecycle-copy` (writes `pre-call.md`)
- `/campaign-copywriting`

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short: record status, not raw output. Full protocol: `client-activity-log.md`.
