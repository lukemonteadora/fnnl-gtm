---
name: cold-email-followups-docx-presentation
description: Creates a compact client-facing DOCX presentation for cold email no-reply follow-up or re-engagement sequences from approved followups.yaml files. Use after lifecycle follow-up copy exists and the user wants the sequence packaged with the same shared cold email DOCX formatting as the campaign sequence presentation.
---

# Cold Email Follow-Ups DOCX Presentation Skill
## Canonical Profile Root

All profiles/<business-slug> paths in this skill resolve under:

```text
<outbound>/profiles
```

Here `<outbound>` is the root of this skill library - resolve it to wherever the library is currently checked out (local Documents, OneDrive, or a git worktree); never hardcode an absolute path. Do not create client profiles under a `profiles/` folder at your current working directory.

Create a simple DOCX launch sheet for what gets sent when prospects do not reply.

This skill formats existing follow-up copy. It does not write or rewrite the sequence.

---

## Copy QA Dependency

Before packaging the DOCX, read the source `followups.yaml` and confirm the sendable copy still passes:

1. `spam-word-checker.md`
2. `cold-email-copy-best-practices.md`

Stop and route back to `/campaign-copywriting` if the copy fails. Do not silently rewrite copy inside this DOCX skill.

This inherits the **verified-list gate** (`verified-list-gate.md`) via the parent campaign: `followups.yaml` continues a `variants.yaml` that was produced under the gate. Confirm the parent sequence was gate-built before packaging.

Hard-stop examples include em dashes, double hyphens, mid-sentence dash separators, weak CTAs, unconfirmed CTA deliverables, follow-up-reference openers, or links and calendar links in early outreach without explicit user override.

---

## Source Of Truth

Use the approved follow-up YAML file:

```text
profiles/<business-slug>/campaigns/<campaign-slug>/followups.yaml
```

If the file is missing, report that it is missing and route back to `/lifecycle-copy` (the producer of `followups.yaml`). Do not invent follow-up copy inside this skill.

---

## Output Shape

Keep the document simple:

1. Title
2. Short intro
3. Trigger / purpose
4. Sequence
5. Every email step and variant from the YAML

Do not include tool checklists, broad strategy explanation, or implementation setup unless the source file already contains a short trigger/purpose note.

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
  -SourcePath "profiles/<business-slug>/campaigns/<campaign-slug>/followups.yaml" `
  -FlowType "followups" `
  -OutputName "Cold Email Follow-Ups - Client Name.docx"
```

**Google Doc (when configured).** After the DOCX renders, also create/update a native Google Doc so the client never has to upload it — gated on the one-time setup in `reference/gdoc-export-setup.md`; the script exits `2` and is safely skipped if creds are not set:

```powershell
node scripts\docx_to_gdoc.mjs --in "profiles\<business-slug>\Cold Email Follow-Ups - Client Name.docx" --title "Cold Email Follow-Ups - Client Name"
```

---

## QA

After generation, open the DOCX with Word COM, confirm page count and word count, confirm all YAML email blocks are present, export a temporary PDF sanity check, delete the PDF, and scan for mojibake markers such as garbled accented characters or garbled quote sequences.

If a spam or best-practice issue is found, report it and route back to copy editing. Do not silently rewrite copy.

---

## Related Skills

- `/cold-email-campaign-sequence-docx-presentation`
- `/interested-replies-docx-presentation`
- `/pre-call-nurture-docx-presentation`
- `/campaign-copywriting`

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short — record status, not raw output. Full protocol: `client-activity-log.md`.
