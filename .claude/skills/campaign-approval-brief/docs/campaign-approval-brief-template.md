# Campaign Approval Brief: Authoring Template

> **Two copies of this file exist and must stay identical.**
> `.claude/skills/campaign-approval-brief/docs/` (beside the skill) and
> `outbound/reference/` (the data home the path rule resolves to).
> They were already duplicated upstream and had silently diverged. Edit one, copy it
> to the other in the same change, or the skill and the DOCX converter will disagree
> about what the locked template says.


This is the **authoring contract** for `/campaign-approval-brief`. The skill authors `profiles/<business-slug>/campaign-approval-brief.md` against the skeleton below, then renders it to a **locked 10-slide PPTX deck** via `scripts/approval-brief-pptx/` (see the SKILL.md section "The 10-Slide Contract" for the render pipeline and the Markdown-section → slide mapping). The old `scripts/brief_md_to_docx.ps1` DOCX render is **retired** (kept on disk for history); only the final render format changed (DOCX → PPTX). This file remains the single source of truth for the authored Markdown: **structure** (section order, fixed table columns/rows, role vocabulary) and the **plain writing voice** (the rules + the banned-in-client-prose list). The "DOCX" render steps further down are superseded, so follow the SKILL.md render pipeline.

There is no gold-standard brief in this workspace yet, because no client has been onboarded. The skeleton at
the bottom of this file plus the voice rules below ARE the standard until the first real brief exists. Once
one is written and approved, record it here as the reference:

- `profiles/<client-slug>/campaign-approval-brief.md`

(Profiles are gitignored, so read them locally.)

---

## How To Use This File

1. **Author** `profiles/<business-slug>/campaign-approval-brief.md` by copying the **Copy-Paste Markdown Skeleton** at the bottom of this file and filling it from saved artifacts only (never chat history, never invented decision history). Keep the section order, the fixed table columns/rows, and the plain voice exactly.
2. **Render** to DOCX through the styling engine. Never hand-build the DOCX, and never use Pandoc:

   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts\brief_md_to_docx.ps1 `
     -MarkdownPath "profiles\<business-slug>\campaign-approval-brief.md" `
     -OutputDocx  "profiles\<business-slug>\Campaign Approval Brief - <Client>.docx"
   ```

3. **QA** the authored Markdown against this skeleton (structure first, then voice + banned terms) before rendering. The two QA gates in `SKILL.md` (steps 0 and 0.5) diff against this file.

The reader meets the **campaigns** (Sections 2–3) before the **email mechanics** (Section 4). Put a `---` rule after the metadata block and between every section.

---

## The Locked Visual Template (Design Tokens)

The visual style is locked inside `scripts/brief_md_to_docx.ps1` (the CSS block). **Do not vary fonts, sizes, or colors per client.** These tokens document the RETIRED DOCX render so its look stays reproducible; the live deliverable is the PPTX deck, whose design rules live in `SKILL.md` ("PPTX Design Rules"). The hex values below are the ones baked into that script, carried over from a previous brand. **They are not FNNL Agency's brand colors.** When FNNL's palette is decided, update the accent in the PPTX design rules; there is no need to touch the retired script.

- **Font:** **Calibri** (Segoe UI / Arial fallback, all sans). A separate display face was deliberately not used, because it is not installed on the render box and the presentation renderers can't fall back through a CSS stack. **11 pt** body, **line-height 1.4**, near-black text **#1c1917**.
- **Headings:** H1 **22 pt** accent (**#dd1729**), H2 **15 pt** accent, H3 **12.5 pt** accent.
- **Tables:** full width, accent header (**#dd1729**) with white text, faint-tint zebra (**#fceaec**), white-smoke borders (**#e2e2e2**), padded cells.
- **Copy previews:** off-white blockquotes (**#fafafa**) with an accent left border, one per email variant.
- **Top metadata block:** muted slate-grey (**#5d6c7b**).

If Word COM is unavailable, deliver the Markdown and say the DOCX could not be rendered.

---

## Section Order (11 parts)

Author in exactly this order. Headings must match verbatim. Do **not** hardcode the campaign count in any heading (it is "The Campaigns At A Glance", never "The Three Campaigns…").

1. **Title + metadata block**: `# Campaign Approval Brief: <Client>`, then the fixed labels, one per line, in this order: **Client**, **Client contact**, **Prepared by**, **Date**, **Goal**. Then a `---` rule.
2. **`## 1. Read This First`**: short **bold-led** paragraphs (not a wall): *what this is* (the sign-off, nothing sends), *what we've built* (plain numbers, never the word "TAM" and no migration story), *who we're reaching*, *what we'll offer them* (the offer in one plain sentence), *the unifying idea* (e.g. "why three lists, one offer"), *where things stand* (warm-up / earliest send, no internal tooling), and a pointer to Section 6.
3. **`## 2. The Campaigns At A Glance`**: a table with the **fixed columns** `# | Campaign | Reaches | Offer | Role | Status`; emoji status (✅ Ready / ⚠️ / ⛔), **plain role labels** (see vocabulary below), then a short "why these" paragraph or bullet list and the no-overlap line.
4. **`## 3. Campaign Details`**: one `### Campaign N: <Name> (<count>)` block per campaign. Each block is a two-column table with the **fixed rows** `Who we email / Why they're on this list / What we offer / How we build it / Expected volume / Copy`, followed by **2–3 bullets**: *why the signal matters*, *why this role (<plain label>)*, and *the main risk and how we handle it*, all in plain words, no vendor names, no filter syntax.
5. **`## 4. How We Write & Personalize The Emails`**: **Step 1–4**, written once for all campaigns and placed **after** the campaigns:
   - **Step 1: The sequence.** Describe the short single-thread sequence of 2 to 3 emails over ~two weeks per contact, two versions of the first email to test, reply stops the sequence.
   - **Step 2: What gets personalized.** A plain table with columns `What we mention | Example | Where it comes from`, with **no `{{braces}}`**.
   - **Step 3: Per-company build (before send).** What the per-company research names, in plain words.
   - A **quality-rule blockquote** (`>`): every personalized claim must point to something real; if we can't see it, we don't say it.
   - **Step 4: Load and send.** Light per-recipient variation (with the deliverability gloss), loaded as a **paused draft**, one consistent sender across the warmed mailboxes, nothing sends until the client starts it.
6. **`## 5. Copy Preview`**: every saved variant from `variants.yaml` as blockquotes (one per email variant), **or** the standard pre-list-build placeholder when the brief is written before the list exists (its normal timing). Never invent copy here.
7. **`## 6. What We Need From You`**: **strategic, client-facing decisions only** (approve offers/order, suppression list, proof/claims they're comfortable using, any asset-gate or budget decision). Open with "Mark any you want changed; silence means approved." **Exclude** all technical/internal setup (API keys, workspace IDs, verifier/mailbox/registrar/warmup setup, source-workflow build steps).
8. **`## 7. What Happens Next`**: the operational sequence in plain language (no skill slugs, no vendor names) + a "Things we won't skip" line with the per-campaign stop gates.
9. **`## 8. How We Protect Your Reputation`**: the deliverability and compliance guardrails in plain words.
10. **`## Appendix A: Other Options We Considered`**: alternatives + rejected offers, listed **once** (never repeat an alternatives list inside campaign sections). If alternatives are not explicit in artifacts, write `Not captured in current artifacts.`
11. **`## Appendix B: If You Want To Change Something`**: the four change → consequence lines (target / offer / source / wording).

### Plain role vocabulary (Section 2)

Each role label must read as plain English on its own, followed by a short campaign-specific reason. This replaces any older internal taxonomy.

- **Best odds**: the sharpest reason to act now.
- **Widest reach**: the biggest clean list, fastest read.
- **Small & precise**: short, tightly-aimed, often hand-checked.
- **Queued**: held for a later wave.
- **Extra**: a secondary add-on.

---

## How To Write It: The Voice

The prose is **graded, not just the structure**. Write everything so a smart person who isn't a cold-email specialist understands it on the first read.

**Voice rules:**

- **Lead with the point.** Say what matters first in plain words, then add detail. Section 1 is short **bold-led** paragraphs, not a wall of text.
- **Write for a sharp outsider.** Keep the real industry terms so it stays credible, but **gloss each specialist term in plain words the first time it appears**: e.g. "warm-up (the few-week ramp that builds an account's reputation so messages land in the inbox, not spam)", "mailboxes (the accounts the campaign sends from)".
- **The offer in one plain sentence.** Explain what each prospect actually gets, and why it's useful on its own, without jargon.
- **Plain role labels only**: use the vocabulary above (Best odds / Widest reach / Small & precise / Queued / Extra), each with a campaign-specific reason.
- **Right-size it.** Full sentences, short paragraphs, bullets for real lists. Don't compress two thoughts into one dash-joined line, and don't be so terse it turns cryptic.
- **Source-first logic, plainly.** Explain that the chosen source *proves the campaign signal*, not merely that it's easy to export.
- **No fake certainty.** Don't invent a clean decision trail. If alternatives aren't in the artifacts, write `Not captured in current artifacts.`; if a recommendation differs from the chosen path and the reason isn't explicit, write `Reason not captured.`

**Banned in client prose. Scan and confirm ZERO hits before rendering:**

- **Internal vendor / tool names.** Build the list at scan time from every tool named in `outbound/stack-contract.yaml` (company discovery, contact enrichment, email verifier, registrar, mailbox provider, sending platform, CRM, research), plus any pack name under `_vendor-library/`, plus any other data, scraping or enrichment tool that appears in this client's artifacts. Describe what the tool *does* in plain words instead ("we look up and verify the right contact"). If the contract is still empty there may be nothing to scan for, which is fine.
- **Raw syntax / fragments:** `segment_subtype`, `{{` (any merge-field braces), and any query, column, or filter fragment.
- **Skill slugs:** `/campaign-` (e.g. `/campaign-strategy`, `/campaign-copywriting`), `/tam-build`, or any `/skill-name`.
- **Credit / quota counts** (API credits, token counts, per-tool quotas).
- **The literal word "TAM"**: say "the full market / list / the companies we found" instead.
- **Any platform-migration story** (don't narrate that the plan moved from one sending platform to another, or from a sample to a full build as a tooling event).

The **sending platform** may appear **at most once**, and only as the generic phrase, never by brand name (e.g. "loaded as a paused draft in your sending platform").

**Spaced em dashes are banned everywhere, including this brief's prose.** This is the repo-wide style rule, and it is stricter than an older note that treated the brief as exempt. Never write an em dash or en dash with spaces around it in the brief, the deck, or any client-facing document. Use a period and a second sentence, a comma for a short aside, parentheses for a true aside, or a colon to introduce something. Normal hyphens inside compound words (pre-warmed, two-week, 90-day) are fine. The deck QA in `SKILL.md` scans for `\s[—–]\s` and will fail the render on a hit, so fix it at authoring time. The separate copy hard-stops from `spam-word-checker.md` and `cold-email-copy-best-practices.md` still govern the **email copy** on top of this.

---

## Copy-Paste Markdown Skeleton

Copy everything between the rules below into `profiles/<business-slug>/campaign-approval-brief.md` and fill from saved artifacts. Repeat the `### Campaign N` block once per selected campaign. Angle-bracket `<…>` items are placeholders.

---

```markdown
# Campaign Approval Brief: <Client>

**Client:** <Client legal name, then a one-line plain description of what they do>
**Client contact:** <Name (email)>, or "<Client> (via FNNL Agency)"
**Prepared by:** FNNL Agency
**Date:** <YYYY-MM-DD>
**Goal:** <One sentence: who we're emailing, the conversation we want to open, and where it leads.>

---

## 1. Read This First

**What this is.** Your sign-off before we spend anything on finding contacts or writing the final emails. Nothing here sends. We're asking you to approve the plan below, mainly <the key decisions> (Section 6).

**What we've built.** <Plain numbers: how many companies we found, how many genuinely fit, what we captured about each. Never the word "TAM", no migration/tooling story.>

**Who we're reaching.** <The audience and the decision-makers we target, in plain words.>

**What we'll offer them.** <The offer in one plain sentence: what each prospect actually gets, and why it's useful on its own. If one offer across all lists, say so.>

**<The unifying idea>.** <e.g. "Why three lists, one offer": what's held constant and what that lets us learn.>

**Where things stand.** Your <N> sending mailboxes (the accounts the campaign sends from) are finishing their warm-up (the few-week ramp that builds an account's reputation so messages land in the inbox, not spam), so the earliest real send is around <date>. We build the contact lists and the copy during that window and hand you paused drafts to start.

**What we need from you** is in Section 6, mainly <the headline decisions>.

---

## 2. The Campaigns At A Glance

| # | Campaign | Reaches | Offer | Role | Status |
|---|---|---|---|---|---|
| 1 | **<Name>** (<count>) | <who, in a phrase> | <offer, short> | **<Best odds / Widest reach / Small & precise>**: <campaign-specific reason> | ✅ Ready |
| 2 | **<Name>** (<count>) | <who, in a phrase> | <offer, short> | **<plain role>**: <reason> | ✅ Ready |

**Why these <plain count word>:**
- **<Campaign>**: <one line on why it earns a spot now>.
- **<Campaign>**: <one line>.

No company appears in more than one list, so the campaigns never compete for the same inbox.

---

## 3. Campaign Details

### Campaign 1: <Name> (<count>)

| | |
|---|---|
| **Who we email** | <titles + firmographics + geography, plain> |
| **Why they're on this list** | <the exact signal, in plain words> |
| **What we offer** | <the offer for this list, one sentence> |
| **How we build it** | <plain: take the list companies showing the signal, then look up + verify the right contact, with no tool names> |
| **Expected volume** | <N companies → 1–2 verified decision-makers each> |
| **Copy** | Drafted after the list is built |

- **Why the signal matters:** <why the opener's premise is true and lands as expertise, not a pitch>.
- **Why this role (<plain label>):** <why it earns that role>.
- **The main risk and how we handle it:** <the campaign's own main risk from its lead-source-plan, plus the mitigation>.

<Repeat the ### Campaign N block for each selected campaign.>

---

## 4. How We Write & Personalize The Emails

**Step 1: The sequence.** A short sequence of 2 to 3 emails over about two weeks per contact, all in one thread (the follow-ups build on the first email rather than repeating the same ask). We write two versions of the first email to test, and a reply always stops the sequence.

**Step 2: What gets personalized.** Every email is filled in from facts we already hold about each company, so it reads like a person who looked, not a mass mail-merge:

| What we mention | Example | Where it comes from |
|---|---|---|
| The company's name | "<Example>" | The list we built |
| What they do, in a line | "<a one-line descriptor>" | Their website (already read) |
| Why they're on this list | <the signal, plain> | The signals we checked on each site |
| One specific, public detail about them | <example> | Our AI reads the site as we build each email |
| The contact's first name | "<Example>" | The contact look-up step |

**Step 3: Per-company build (before send).** <What the per-company research names (that company's own site, portal or setup) so the opener reads like a specialist who looked.>

> Quality rule: every personalised claim must point to something real on the company's own site. If we can't see it, we don't say it.

**Step 4: Load and send.** The copy is varied slightly per recipient (light wording variation that protects deliverability, meaning whether emails land in the inbox instead of spam), then loaded as a **paused draft** in your sending platform. All email comes from **<Sender persona>** (one consistent identity) across your <N> warmed mailboxes. Nothing sends until you start it.

---

## 5. Copy Preview

> Copy preview will be available once the contact lists are built and the email copy is written and approved. This brief is intentionally produced before that step, so you can approve the direction before we spend on data.

<If variants.yaml exists and passed the verified-list gate, replace the placeholder with every saved variant as blockquotes, grouped by campaign, email step, and variant label.>

---

## 6. What We Need From You

Mark any you want changed; silence means approved.

1. **<Approve the offers / order>**: <the core strategic approval>.
2. **Suppression list**: any existing customers, active deals, or partners you do **not** want contacted.
3. **Proof you're comfortable using**: confirm which named clients, results, or claims we may reference, and flag anything off-limits.
<Add any asset-gate or budget decision here, with a clear recommendation.>

If none of these companies are existing relationships, just tell us and we proceed.

---

## 7. What Happens Next

1. You approve this brief (<the decisions above>).
2. We build and verify the decision-maker contact lists.
3. We write the copy and run it through our quality gates, then share it for your approval.
4. We load the campaigns as **paused drafts** in your sending platform.
5. Once your mailboxes finish warming and pass deliverability checks, **you** start sending.

**Things we won't skip:** verified contacts only; copy passes our spam, best-practice and call-to-action checks; the list graded B or higher; mailboxes confirmed warmed and authenticated before any real send.

---

## 8. How We Protect Your Reputation

- No links or calendar invites in the first emails. Reply-only and low-friction.
- One consistent sender (<Sender persona>) across every mailbox.
- <Any client-specific compliance framing, e.g. healthcare/GDPR/no invented quotes>.
- One-click unsubscribe, and complaint and bounce rates held to safe levels.
- Real sending stays blocked until warm-up finishes and deliverability is verified.

---

## Appendix A: Other Options We Considered

Evaluated and set aside for later waves:

- **<Alternative campaign / slice>**: <one line on why it's a later wave>.

**Offers considered and not selected:**
- **<Rejected offer>**: <why it wasn't chosen>.

<If alternatives are not explicit in artifacts, write: Not captured in current artifacts.>

---

## Appendix B: If You Want To Change Something

- **Change who we target** → we redo the targeting research and rebuild the list.
- **Change an offer** → we redo the offer research and the copy for that campaign.
- **Change where the list comes from** → we redo the source plan and re-grade the list.
- **Change only the wording** → we just rewrite that campaign's copy.
```
