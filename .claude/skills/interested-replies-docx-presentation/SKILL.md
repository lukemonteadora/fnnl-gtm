---
name: interested-replies-docx-presentation
description: Creates a compact client-facing DOCX presentation for interested-reply handling sequences from approved Markdown files such as interested-reply.md. Use when packaging what gets sent after a prospect replies positively, using the same shared cold email DOCX formatting as the campaign sequence presentation.
---

# Interested-Replies DOCX Presentation Skill
## Canonical Profile Root

All profiles/<business-slug> paths in this skill resolve under:

```text
<outbound>/profiles
```

Here `<outbound>` is the root of this skill library - resolve it to wherever the library is currently checked out (local Documents, OneDrive, or a git worktree); never hardcode an absolute path. Do not create client profiles under a `profiles/` folder at your current working directory.

Create a simple DOCX for what gets sent when someone bites.

This skill formats existing interested-reply copy. It does not write or rewrite the reply flow.

---

## Copy QA Dependency

Before packaging the DOCX, read the source Markdown and confirm the sendable copy still passes:

1. `spam-word-checker.md`
2. `cold-email-copy-best-practices.md`

Stop and route back to `/campaign-copywriting` if the copy fails. Do not silently rewrite copy inside this DOCX skill.

This is post-reply (a positive reply already exists), so it inherits the parent campaign's **verified-list gate** (`verified-list-gate.md`) rather than re-checking a verified list. Confirm the parent sequence was gate-built; do not run a fresh `leads.verified.csv` check here.

Hard-stop examples include em dashes, double hyphens, mid-sentence dash separators, weak CTAs, unconfirmed CTA deliverables, follow-up-reference openers, or unsafe link and calendar usage.

---

## Source Of Truth

Use the approved Markdown file:

```text
profiles/<business-slug>/campaigns/<campaign-slug>/interested-reply.md
```

If the file is missing, report that it is missing and route back to `/lifecycle-copy` (the producer of `interested-reply.md`).

---

## Output Shape

Keep the document simple:

1. Title
2. Short intro
3. When to use
4. Sequence
5. Every email block from the Markdown file
6. Short notes only if already present in the source

The parser should read `## Email...` headings, `**Trigger:**`, `**Send as:**`, fenced email body blocks, optional subject lines, word count, and notes.

---

## Formatting Contract

Use the exact same contract as `/cold-email-campaign-sequence-docx-presentation`:

- Calibri font
- 0.75 inch margins
- Title: 20 pt bold
- Section headings: 16 pt bold
- Trigger / send-as labels: 12 pt bold
- Supporting text: 9.5 pt
- Email headers: 12 pt bold
- Subject lines: 10 pt bold
- Email body paragraphs: 10 pt, `List Paragraph`, 8 pt spacing after

---

## Required Builder

```powershell
powershell -ExecutionPolicy Bypass -File scripts\lifecycle_docx_presentation.ps1 `
  -ProfileSlug "<business-slug>" `
  -SourcePath "profiles/<business-slug>/campaigns/<campaign-slug>/interested-reply.md" `
  -FlowType "interested-reply" `
  -OutputName "Interested-Replies Sequence - Client Name.docx"
```

**Google Doc (when configured).** After the DOCX renders, also create/update a native Google Doc so the client never has to upload it — gated on the one-time setup in `reference/gdoc-export-setup.md`; the script exits `2` and is safely skipped if creds are not set:

```powershell
node scripts\docx_to_gdoc.mjs --in "profiles\<business-slug>\Interested-Replies Sequence - Client Name.docx" --title "Interested-Replies Sequence - Client Name"
```

---

## QA

After generation, open the DOCX with Word COM, confirm expected email blocks are present, export a temporary PDF sanity check, delete the PDF, and scan for mojibake markers such as garbled accented characters or garbled quote sequences.

If a spam or best-practice issue is found, report it and route back to copy editing. Do not silently rewrite copy.

---

## Related Skills

- `/cold-email-campaign-sequence-docx-presentation`
- `/cold-email-followups-docx-presentation`
- `/pre-call-nurture-docx-presentation`
- `/campaign-copywriting`

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short — record status, not raw output. Full protocol: `client-activity-log.md`.
