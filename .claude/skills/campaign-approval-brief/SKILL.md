---
name: campaign-approval-brief
description: Creates a client-facing approval brief for selected campaign paths, explaining the ICP, source signal, offer, lead-source path, campaign order, client-facing asset needs, and saved copy variants from artifacts without inventing missing decision history. The deliverable is a locked 10-slide PPTX deck (a founder skims it in under 2 minutes).
---

# Campaign Approval Brief

## Canonical Profile Root

All profiles/<business-slug> paths in this skill resolve under:

```text
<outbound>/profiles
```

Here `<outbound>` is the root of this skill library - resolve it to wherever the library is currently checked out (local Documents, OneDrive, or a git worktree); never hardcode an absolute path. Do not create client profiles under a `profiles/` folder at your current working directory. `scripts/...` likewise resolves under `<outbound>/scripts`.

Create a client-facing approval brief before list build whenever possible.

This skill explains why the selected campaign path was chosen. It is not a conversation transcript, and it must not invent a clean decision trail when the artifacts do not contain one.

## DELIVERABLE FORMAT (HARD RULE)

**The approval brief is delivered as a PPTX deck** in the locked 10-slide format below: a professional presentation a founder can skim in under two minutes, not a text document. This is a hard rule: never hand over only a Markdown or DOCX file. The pipeline is:

1. **Author** the Markdown brief from saved artifacts (the content + voice contract is unchanged; see Source Of Truth, Data Rules, and the template's voice rules). This step carries all the client-facing QA: no vendor/tool names, no "TAM", no `{{braces}}`, no skill slugs, the plain role vocabulary, the "What We Need From You" exclusions.
2. **Map** that Markdown onto the 10 slides (see The 10-Slide Contract).
3. **Render** the PPTX with the locked design library (see Required Builder), so every client's deck is visually identical.
4. **QA** by rendering each slide to an image and viewing it, plus a text scan of the generated file.

The old DOCX render (`scripts/brief_md_to_docx.ps1`) is **retired** for this skill. The script stays on disk for history; do not point new work at it. Author against the Markdown skeleton exactly as before. Only the render target changed (DOCX → PPTX).

## Interaction Policy

Defers to `/autonomous-execution-policy`. Under `run_state.execution_mode = auto_execute` (the operator's default), proceed without pausing: pick the strongest option per this skill's rubric, record it to `run_state`/profile, and continue, and never re-ask a decision already in `run_state`, the profile, memory, or the operator's latest message. Stop only for the policy's hard-stops (spend over the approved ceiling, live send, credentials, provider/source-of-truth change, safety gates). On a long async wait, background-poll and move to other productive work, never idle.

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short: record status, not raw output. Full protocol: `client-activity-log.md`.

## Trigger

Use this skill after:

1. `/campaign-strategy` has created `profiles/<business-slug>/campaign-strategy.md`
2. One or more launch or queued campaign paths have been selected
3. `/lead-source-strategy` Lead Source Plan Mode has written each selected campaign's `lead-source-plan.md`

Best timing: before list build, enrichment spend, copy upload, or live sending.

Also use it after `/campaign-copywriting` when the user wants a client brief explaining the "why" behind finished campaign copy.

---

## Pre-Flight Check (REQUIRED BEFORE GENERATING)

**TAM-First Gate (check FIRST).** On the TAM-first flow, do not approve a brief for campaigns that aren't grounded in the real, enriched lead list. If the selected campaigns were derived from a TAM, read `run_state.status.tam_stage` (see `/tam-build`): it must be **`full_enriched`**. If it is `sample_built` or unset, **HARD STOP**: the campaigns are built on a sample or on imagined data points; route back to `/tam-build` (operator GO → Phase B full build + enrich) and `/campaign-strategy`, then return. A `tam/tam.csv` existing on disk is not sufficient (it can be a sample); the flag is the authority. This mirrors `/campaign-strategy`'s gate so the rule holds even if this skill is invoked directly. (An existing-offer *validation* path that intentionally never built a TAM is exempt, because there is no TAM to enrich.)

Before writing any content, check every selected campaign's artifacts for required fields. If any field is missing or blank, **stop immediately, list every missing item by campaign, and do not proceed until the gaps are resolved**.

Do not generate a partial brief. A brief with "Not captured in current artifacts" throughout every decision card is worse than no brief.

### Required fields per campaign's `lead-source-plan.md`

Every field must be present and non-empty before authoring. Each one feeds a specific part of the deck.

| Field | Location in lead-source-plan.md | What it feeds |
|---|---|---|
| `**Campaign:**` | File header | Campaign name (Slide 3 grid) |
| `**ICP:**` | File header | Slide 3 "who we email" |
| `**Offer:**` | File header | Slide 2 + Slide 3 |
| `**Campaign angle:**` | Campaign Hypothesis section | Slide 3 role note / Slide 4 |
| `**Why this list should care now:**` | Campaign Hypothesis section | Slide 3 / Slide 4 |
| `**Source family:**` | Primary Source Path section | Slide 4 "how we build it" (plain words, no tool name) |
| `**Specific collection source or tool:**` | Primary Source Path section | Slide 4 (translate the tool to plain language) |
| `**Contact enrichment layer:**` | Primary Source Path section | Slide 4 ("look up + verify the contact") |
| `**Exact signal:**` | Primary Source Path section | Slide 3 "why they're on this list" |
| `**Target geography:**` | Primary Source Path section | Slide 3 reach |
| `**Why this beats a generic database pull:**` | Primary Source Path section | Slide 3 role note |
| `**Expected volume:**` | Primary Source Path section | Slide 1 stats + Slide 3 reach |
| `**Location coverage risk:**` | Primary Source Path section | Slide 3 / Slide 10 stop gates |
| `**Data availability risk:**` | Primary Source Path section | Slide 3 / Slide 10 stop gates |

### Required profile-level fields

| Field | File | What it drives |
|---|---|---|
| `**Primary:**` / `**Secondary:**` / `**Avoid:**` lines | `offer-intelligence.md` | Appendix A (options considered) |
| `## Primary Offer` / `## Archived / Not Selected` | `lead-magnets.md` | Appendix A (rejected offers) |
| Campaign names in campaign-strategy.md table | `campaign-strategy.md` | Slide 3 grid |

If any required field is missing, print the STOP block (list each missing `**Label:**` field by campaign + any missing profile-level field), then route back to `/lead-source-strategy` Lead Source Plan Mode and re-run. Only proceed to authoring once all required fields are confirmed present.

## Source Of Truth

Read only explicit evidence from saved artifacts:

```text
profiles/<business-slug>/client-profile.yaml
profiles/<business-slug>/source-signal-intelligence.md
profiles/<business-slug>/offer-intelligence.md
profiles/<business-slug>/lead-magnets.md
profiles/<business-slug>/campaign-strategy.md
profiles/<business-slug>/campaign-plan.md
profiles/<business-slug>/campaign-approval-brief.md          # the authored Markdown (deck content source)
profiles/<business-slug>/campaigns/<campaign-slug>/lead-source-plan.md
profiles/<business-slug>/campaigns/<campaign-slug>/variants.yaml
```

`variants.yaml` is optional. If it exists, use every saved variant for the copy-preview + full-sequence slides. If it is missing, do not invent copy.

Do not read chat history as the source of truth. The deck must be reproducible from saved campaign artifacts.

## Copy QA Dependency

If `variants.yaml` exists, read the saved copy before packaging it into the deck and confirm it still passes:

1. `spam-word-checker.md`
2. `cold-email-copy-best-practices.md`

Stop and route back to `/campaign-copywriting` if the copy fails. Do not rewrite copy inside this skill.

Hard-stop examples include em dashes, double hyphens, mid-sentence dash separators, colon-as-runway sentences, comma-wrapped company descriptors, weak CTAs, repeated generic new-thread CTA deliverables, unconfirmed CTA deliverables, broken two-thread 4-step structure, follow-up-reference openers, goodbye or fake wrap-up emails, or links and calendar links in emails 1-3 without explicit user override.

**Copy Preview gate (Slides 6-7 only).** Include finalized copy on the copy-preview + full-sequence slides only when the campaign's slice passed the verified-list gate (`verified-list-gate.md`): a `leads.verified.csv` exists and `variants.yaml` was produced by `/campaign-copywriting` under that gate. When the deck is built pre-list-build (its normal, intended timing), there is no verified slice yet, so **replace the copy-preview slide with a single placeholder line** ("Copy preview available once the list is built and copy is approved") and drop the full-sequence slide. The deck itself is NOT gated on a verified list; only the two copy slides are. Never block deck generation waiting for a list.

## Required Builder

This skill is author-then-render. The visual template is LOCKED in a reusable pptxgenjs library so every client's deck is visually identical.

### Files (under `<outbound>/scripts/approval-brief-pptx/`)

- `lib.mjs`: **the locked design system.** `createBrief({ theme })` returns slide-factory methods: `cover`, `threeCards`, `campaignGrid`, `stepFlow`, `decisions`, `copyPreview`, `sequenceGrid`, `twoColumn`, `changeList`, `save`. Each method owns its layout; you never restyle inside it. **Do not fork per client**: extend the library if a new slide shape is genuinely needed.
- `<client>.mjs`: **per-client content only.** Exports `meta` (`{ client, docTitle, theme:{accent,accent2}, defaultOut }`) and `buildSlides(b)` (an array of thunks, one per slide, that call the `b.*` methods with content authored from the Markdown brief). If a previous client's `.mjs` is already in that folder, copy its shape; otherwise read `lib.mjs` and follow each method's signature. Never invent a new slide shape here.
- `build.mjs`: the runner. `node build.mjs <client> "<out.pptx>"`.
- `_probe.mjs`: a debug helper that renders each slide to its own 1-slide file (isolates a slide PowerPoint rejects).
- `export_png.ps1` and `export_pdf.ps1`: QA render via PowerPoint COM (this box has no LibreOffice/poppler).
- `rezip.mjs`: normalizes a pptx if a strict opener rejects it (rarely needed).

### Build + QA commands

```bash
# one-time: install the renderer local to scripts/ (NOT -g, because it must travel with the repo)
npm --prefix "<outbound>/scripts" install pptxgenjs jszip

# 1. author profiles/<client>/campaign-approval-brief.md  (unchanged authoring step)
# 2. write/refresh scripts/approval-brief-pptx/<client>.mjs  (content + slide order only)
# 3. build into a TEMP (non-OneDrive) path: COM render can fail against the synced repo path
node "<outbound>/scripts/approval-brief-pptx/build.mjs" <client> "%TEMP%/<client>-brief.pptx"
```

```powershell
# 4. QA render every slide to PNG via PowerPoint COM (from the TEMP path)
powershell -File "<outbound>\scripts\approval-brief-pptx\export_png.ps1" `
  -Pptx "$env:TEMP\<client>-brief.pptx" -OutDir "$env:TEMP\brief-png" -Width 1600 -Height 900
```

```bash
# 5. VIEW every slideNN.png (overflow, overlap, low-contrast text, empty vs cramped).
# 6. content QA (see QA section): unzip the pptx, extract <a:t> text, grep banned strings.
# 7. copy the validated pptx into the profile as the deliverable:
cp "%TEMP%/<client>-brief.pptx" "profiles/<client>/Campaign Approval Brief - <Client>.pptx"
```

If PowerPoint is unavailable (no COM), deliver the `.pptx` and say the slide images could not be rendered for QA, but still run the text QA (step 6).

## The 10-Slide Contract

Author the Markdown in the 11-part section order (below), then map it onto these slides. Aim for 8–11 slides; the default is 10. **Appendix A and Appendix B are ALWAYS their own slides (hard rule).**

| # | Slide | Style | Library method | Sourced from |
|---|---|---|---|---|
| 1 | **Cover**: client, by-line + date, "Campaign Approval Brief", one-line subtitle, and 3–4 real build stats in a contrasting bottom panel | Dark | `cover` | Metadata block + real numbers (verified contacts, lists, markets, % verified) |
| 2 | **The short version**: 3 cards: what this is / what we offer / what we need | Light | `threeCards` | Section 1 + Section 6 |
| 3 | **The campaigns at a glance**: a card grid (1 campaign → a hero card; 2–6 → a 3×2 grid) with a plain role label + status badge each | Light | `campaignGrid` | Section 2 (+ condensed Section 3) |
| 4 | **How we reach them**: the guide-first / signal logic as a lead line, then the per-contact build as a 3–4 step flow, plus the quality-rule bar | Light | `stepFlow` | Section 1 ("why") + Section 4 |
| 5 | **Action required**: the client's decisions with REQUIRED / CONFIRM / OPTIONAL badges | Dark | `decisions` | Section 6 |
| 6 | **Copy preview**: Email 1 in a full email frame (From / To / Subject with divider lines, body below, subject in the accent color) on the left; 3–4 "Why It Works" annotation cards on the right | Light | `copyPreview` | Section 5 (or placeholder when pre-list-build) |
| 7 | **The full sequence**: every email in a 2×2 card grid on one light slide; a consistent accent per thread; full body text at 9–9.5pt (shrink to 8.5pt before splitting to a second slide; only split if 8.5pt still overflows); a muted day label per card. No "Why It Works" here, because this slide is for reading the copy | Light | `sequenceGrid` | Section 5 |
| 8 | **Appendix A: What else we considered** (REQUIRED slide) | Light | `twoColumn` | Appendix A |
| 9 | **Appendix B: If you want to change something** (REQUIRED slide) | Light | `changeList` | Appendix B |
| 10 | **Next steps**: a 3–4 step process flow + a one-line guarantee/summary | Dark | `stepFlow` (onDark) | Section 7 (+ Section 8 reputation line) |

Markdown section order to author against (voice + skeleton in `reference/campaign-approval-brief-template.md`): 1. Read This First · 2. The Campaigns At A Glance · 3. Campaign Details · 4. How We Write & Personalize The Emails · 5. Copy Preview · 6. What We Need From You · 7. What Happens Next · 8. How We Protect Your Reputation · Appendix A: Other Options We Considered · Appendix B: If You Want To Change Something. The deck **condenses** Section 3 into the Slide 3 cards (full per-campaign detail stays in the Markdown); calibrate the "all key content present" QA check to decisions/claims, not a 1:1 text match.

## PPTX Design Rules (locked)

These are encoded in `lib.mjs`. They exist here as the contract and the QA checklist.

- **`LAYOUT_16x9`** (10" × 5.625"). Hex colors **never** carry a leading `#`.
- **Palette:** a dark charcoal/navy base, **one bright accent chosen to fit the topic** (never default to generic blue: e.g. amber for Bitcoin, teal/coral/sage elsewhere), white/off-white for card backgrounds. The accent is the one thing chosen per client (`meta.theme.accent`); everything else is fixed.
- **Rhythm:** dark slides for the cover, the decision slide, and the final slide; light for content slides. Alternate for visual rhythm.
- **Every slide has ≥1 visual element** (stat callout, timeline/step flow, card grid, or split layout). **Never a bullet-point-only slide**: a list becomes cards with numbers.
- **Typography:** Cambria for all headings (bold, 24–41pt by slide), Calibri for body (8.5–13pt). **Never Aptos.**
- **Cards:** rounded rectangles (`rectRadius` ~0.06–0.08), subtle shadow (opacity ~0.06–0.08), no border stripes. Differentiate cards by background tint + shadow, **not** accent bars.
- **No decorative stripes or accent bars on slide/card edges. No underlines under titles.**
- **Eyebrow pattern on every slide:** a small all-caps label at the top (e.g. "THE CAMPAIGNS", "ACTION REQUIRED"), then the large Cambria title below it.
- **Never reuse a shadow/option object** across `addShape` calls; the library uses an `mkShadow(op)` factory.

## Renderer gotchas (this Windows box)

- **No LibreOffice / poppler.** The prompt-guide `soffice` + `pdftoppm` QA path does not run here. Use **PowerPoint COM** (`export_png.ps1`, or `export_pdf.ps1` + a PDF viewer), the Windows twin of the Word-COM DOCX render. Run it from `%TEMP%`, not the OneDrive-synced repo path (COM export can fail writing into the synced folder), then copy the `.pptx` into the profile.
- **Negative extents = "corrupt".** If a text box or shape is computed with a **non-positive width/height** (e.g. a grid card shorter than its stacked content, so `h = ch - offset < 0`), pptxgenjs emits an invalid `<a:ext cy="-…">` and PowerPoint refuses to open the file ("corrupted and unreadable"). `lib.mjs` guards every text box with `put()` (`Math.max(dim, 0.1)`) and clamps corner radius under half the shorter side, so keep those guards. If you add a slide method, size content to fit the card; when unsure, `_probe.mjs` isolates the offending slide.
- **Strict-open fallback.** pptxgenjs output normally opens in PowerPoint directly. If a strict consumer ever rejects it, run `rezip.mjs <in> <out>` (puts `[Content_Types].xml` first).

## QA (required before delivering)

1. **Structural conformance.** The deck has the locked slides in order; Appendix A ("What else we considered") and Appendix B ("If you want to change something") are present as their own slides; the cover carries real stats (not fabricated); role labels use the plain vocabulary; the decision slide uses REQUIRED / CONFIRM / OPTIONAL badges.
2. **Every slide opens.** Open the built `.pptx` via PowerPoint COM (or `_probe.mjs` per slide). Zero "could not open / corrupt" errors.
3. **View every slide image.** Export PNGs and look at each: no text overflowing its card, no overlapping elements, no low-contrast text, no cramped-vs-empty imbalance. Fix and re-render until clean. Copy bodies on the sequence slide must be **complete** (shrink font before truncating; never truncate copy).
4. **Content text scan.** Unzip the `.pptx`, extract the `<a:t>` runs, and confirm **zero** banned-in-client-prose strings:
   - **Internal vendor and tool names.** Build the scan list at run time from every tool named in `outbound/stack-contract.yaml` (any slot: company discovery, contact enrichment, email verifier, registrar, mailbox provider, sending platform, CRM, research). Add the name of any other tool that actually appears in this client's artifacts, and any pack name under `_vendor-library/`. If the contract is still empty, the list is short or empty, which is fine and honest. Describe what the tool *does* in plain words instead of naming it.
   - Raw syntax (`segment_subtype`, `{{`, query/column fragments), skill slugs (`/campaign-`, `/tam-build`), the literal word "TAM", credit/quota counts, and **any spaced em/en dash** (`\s[—–]\s`). Fix every hit and re-render.
5. **Key content present.** Confirm the client name, every selected campaign, the offer, the decisions/asks, the copy preview (when applicable), and both appendices appear.
6. **Placeholder scan.** No leftover `lorem`, `ipsum`, `TODO`, or `[insert…]`.

## Data Rules

- Do not invent missing decision history.
- If alternatives are not explicit in artifacts, write `Not captured in current artifacts.` (Appendix A).
- If a recommendation differs from the chosen path and the reason is not explicit, write `Reason not captured.`
- Explain source-first logic plainly: the chosen source must prove the campaign signal, not merely be easy to export.
- Keep the language simple. No internal tool chatter, no broad strategy essay, no fake certainty.
- Cover stats must be **real and pulled from the brief/profile** (verified-contact count, list count, market count, % verified, headline proof), never fabricated to fill the panel.
- Include copy previews only from `variants.yaml`; do not draft new copy inside this skill.
- Lead-source summaries must come from each selected campaign's current `lead-source-plan.md`.
- Do not mutate upstream artifacts from this skill.

## "What We Need From You" Rules (Slide 5)

This slide is not a technical setup checklist. It holds the strategic decisions and client-provided assets that unblock launch (ICP, source paths, copy, asset-gate confirmation), each carrying a REQUIRED / CONFIRM / OPTIONAL badge.

Include only client-facing needs that change campaign content or require client material:

- customer exclusion / suppression CSV
- benchmark data or customer metrics needed for a promised benchmark
- explicit approval for a new offer, proof claim, or asset the client must provide

Exclude technical or internal launch tasks (API keys, workspace IDs, list-building, verifier, mailbox, registrar, warmup or sending-platform configuration, and any source-workflow build step the operator can do without client input).

If the selected campaigns need no new client-provided assets, say that plainly.

## Output Shape

Keep the deck tight and client-facing, in the plain voice defined in the template's "How To Write It: The Voice" section.

- Alternatives appear **once**, on Appendix A (Slide 8). Never repeat an alternatives list on the campaign slides.
- Slide 3 condenses the campaigns; the per-campaign why/risk detail lives in the authored Markdown, not on the slide.
- Slide 4 explains the sequence + what gets personalized (plain words, no `{{braces}}`) and comes **after** the campaigns.
- An asset-gated or queued campaign is marked with its status badge on Slide 3 and restated as a decision on Slide 5.

## Workflow Position

This deck explains campaign logic and shows saved copy variants when requested. It does not replace:

- `/cold-email-campaign-sequence-docx-presentation`, which shows the full email sequence and variants
- `/list-quality-scorecard`, which grades the final list
- `/campaign-copywriting`, which writes final copy and owns copy QA

If the client changes a decision:

- ICP change: rerun source-signal discovery, offer intelligence if affected, campaign strategy, and lead-source planning.
- Offer change: rerun offer intelligence or lead-magnet brainstorm, then campaign strategy and copy.
- Source change: rerun lead-source planning, the selected source workflow, and list QA.
- Copy angle change: rerun `/campaign-copywriting` only.

## Related Skills

- `/campaign-strategy` - creates campaign options and launch context
- `/lead-source-strategy` - creates source-signal intelligence and selected lead-source plans
- `/offer-intelligence` - supplies market and saturation evidence
- `/lead-magnet-brainstorm` - selects the front-end offer
- `/campaign-copywriting` - writes final campaign copy
- `/cold-email-campaign-sequence-docx-presentation` - creates the full sequence deck after copy is approved
