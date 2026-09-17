---
name: cold-email-campaign-sequence-docx-presentation
description: Creates a compact client-facing DOCX presentation from one or more approved cold email campaign variants.yaml files after campaign-copywriting.md finishes. Use when the user wants a repeatable DOCX launch sheet, MVP campaign presentation, or client overview showing target, angle, and full email sequence copy with the shared cold email DOCX formatting.
---

# Cold Email Campaign Sequence DOCX Presentation Skill
## Canonical Profile Root

All profiles/<business-slug> paths in this skill resolve under:

```text
<coldoutbound-skills>/profiles
```

Here `<coldoutbound-skills>` is the root of this skill library - resolve it to wherever the library is currently checked out (local Documents, OneDrive, or a git worktree); never hardcode an absolute path. Do not create client profiles under a `profiles/` folder at your current working directory.

Create a simple DOCX launch sheet after approved campaign copy exists.

This skill is for presenting the campaign sequence to a client. It is not for rewriting copy.

---

## Copy QA Dependency

Before packaging the DOCX, read the source `variants.yaml` and confirm the sendable copy still passes:

1. `spam-word-checker.md`
2. `cold-email-copy-best-practices.md`

Stop and route back to `/campaign-copywriting` if the copy fails. Do not silently rewrite copy inside this DOCX skill.

This also inherits the **verified-list gate** (`verified-list-gate.md`): the `variants.yaml` it packages must have been produced by `/campaign-copywriting` under that gate (verified slice + list grade ≥ B + locked strategy). Confirm that upstream before packaging — do not package copy for a slice that never had a verified list.

Hard-stop examples include em dashes, double hyphens, mid-sentence dash separators, colon-as-runway sentences, comma-wrapped company descriptors, weak CTAs, repeated generic new-thread CTA deliverables, unconfirmed CTA deliverables, broken two-thread 4-step structure, follow-up-reference openers, goodbye or fake wrap-up emails, or links and calendar links in emails 1-3 without explicit user override.

---

## Trigger

Use this skill after `/campaign-copywriting` writes one or more approved `variants.yaml` files and the user selects the DOCX presentation pack option.

```text
Choose the DOCX presentation pack next step.

A. [Recommended] Create the campaign sequence DOCX only
B. Create every available DOCX pack with existing source files
C. Skip DOCX and continue to spintax/upload
D. Custom answer
```

Also use it when the user asks for:

- campaign sequence presentation
- DOCX launch sheet
- client-facing campaign overview
- MVP campaign plan document
- repeatable campaign DOCX after copywriting

---

## Source Of Truth

Use the approved YAML files only:

```text
profiles/<business-slug>/campaigns/<campaign-slug>/variants.yaml
```

Do not rewrite the email copy unless the user explicitly asks. If a QA issue is found, stop and route back to `/campaign-copywriting`.

---

## Output Shape

The DOCX must stay stupid simple:

1. Title
2. Short 1 to 2 sentence intro
3. Campaign Snapshot
4. One section per campaign
5. Each campaign section shows:
   - `Target:`
   - target text
   - `Angle:`
   - angle text
   - `Sequence`
   - every email step and every variant from YAML

Do not include:

- prepared for / prepared by
- long executive summaries
- tooling checklists
- scrape tool instructions
- risk essays
- next steps unless the user asks
- broad strategy explanation

---

## Formatting Contract

Match this style exactly:

| Element | Font | Size | Bold | Spacing |
|---|---|---:|---|---|
| Title | Calibri | 20 | yes | after 3 |
| Campaign Snapshot heading | Calibri | 16 | yes | before 9, after 3 |
| Campaign section heading | Calibri | 16 | yes | before 9, after 3 |
| `Target:` / `Angle:` labels | Calibri | 12 | yes | after 2 |
| Target / angle text | Calibri | 9.5 | no | after 2 |
| `Sequence` heading | Calibri | 16 | yes | before 4, after 3 |
| Email header | Calibri | 12 | yes | before 5, after 1 |
| Subject line | Calibri | 10 | yes | after 8 |
| Email body paragraphs | Calibri | 10 | no | after 8 |

Use Word paragraph styles as follows:

- Title: `Title`
- Main headings: `Heading 1`
- Sequence heading: `Heading 2`
- Subject and body copy: `List Paragraph`
- Target and angle text: `Normal`

Use 0.75 inch page margins.

---

## Required Builder

Use the reusable script:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\campaign_docx_presentation.ps1 `
  -ProfileSlug "<business-slug>" `
  -CampaignSlugs "campaign-one,campaign-two" `
  -OutputName "First 3 Campaign Launch Overview - Client Name.docx"
```

**Google Doc (when configured).** After the DOCX renders, also create/update a native Google Doc so the client never has to upload it — gated on the one-time setup in `docs/gdoc-export-setup.md`; the script exits `2` and is safely skipped if creds are not set:

```powershell
node scripts\docx_to_gdoc.mjs --in "profiles\<business-slug>\First 3 Campaign Launch Overview - Client Name.docx" --title "First 3 Campaign Launch Overview - Client Name"
```

Optional arguments:

```powershell
-DocTitle "Client Name - First 3 Campaign Launches"
-Intro "MVP launch sheet for the first campaign sequence."
-TargetsJson '{"campaign-one":"Quality managers in Sweden and Denmark."}'
-AnglesJson '{"campaign-one":"Website-specific use case angle."}'
```

If target or angle is not provided, use a short placeholder:

```text
Target: Add target audience here.
Angle: Add campaign angle here.
```

Ask the user for the target and angle only if the document is for client delivery and the missing fields would make the output look unfinished.

---

## QA

After generating the DOCX:

1. Open it with Word COM.
2. Confirm page count and word count.
3. Confirm every campaign slug appears.
4. Confirm every YAML variant block appears.
5. Export a temporary PDF as a render sanity check, then delete the PDF unless the user asks for it.
6. Scan text for obvious mojibake markers such as garbled accented characters or garbled quote sequences.
7. Do not run broad rewrites or formatting regeneration on a user-edited DOCX unless explicitly asked.

If Word COM is unavailable, say so and do not pretend visual verification passed.

---

## Handoff From Campaign Copywriting

After `/campaign-copywriting` writes `variants.yaml`, ask:

```text
Choose the campaign sequence DOCX next step.

A. [Recommended] Create the campaign sequence DOCX
B. Skip the DOCX
C. Show the source files first
D. Custom answer
```

If the user chooses A:

1. Read the generated YAML path.
2. Read campaign direction from the just-finished copywriting context.
3. Run this skill.
4. Return only the DOCX path and brief verification.

Do not ask about sending platform, upload, or spintax in this DOCX step unless the user brings it up.

---

## Related Skills

- `/campaign-copywriting` - writes approved campaign copy and YAML
- `/cold-email-followups-docx-presentation` - creates the no-reply follow-up DOCX
- `/interested-replies-docx-presentation` - creates the positive-reply handling DOCX
- `/pre-call-nurture-docx-presentation` - creates the booked-call nurture DOCX
- `/spam-word-checker` - checks copy risk before DOCX export
- `/cold-email-copy-best-practices` - writing-quality gate before DOCX export

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short — record status, not raw output. Full protocol: `client-activity-log.md`.
