# Campaign Approval Brief: Authoring Template

> **Two copies of this file exist and must stay identical.**
> `.claude/skills/campaign-approval-brief/docs/` (beside the skill) and
> `outbound/reference/` (the data home the path rule resolves to).
> They were already duplicated upstream and had silently diverged. Edit one and copy
> it to the other in the same change, so the two never drift apart again.


This is the **authoring contract** for `/campaign-approval-brief`. The skill authors `profiles/<business-slug>/campaign-approval-brief.md` against the skeleton below. **The Markdown is the deliverable and the source of record** (generated client files are plain text by default, operator decision 2026-09-28). The locked 10-slide PPTX deck (the pptxgenjs library at `scripts/approval-brief-pptx/`, SKILL.md "The 10-Slide Contract" for the Markdown-section → slide mapping) is built only when the operator asks for it. The old `scripts/brief_md_to_docx.ps1` DOCX render is **retired** (kept on disk for history). This file remains the single source of truth for the authored Markdown: **structure** (section order, fixed table columns/rows, role vocabulary) and the **plain writing voice** (the rules + the banned-in-client-prose list).

There is no gold-standard brief in this workspace yet, because no client has been onboarded. The skeleton at
the bottom of this file plus the voice rules below ARE the standard until the first real brief exists. Once
one is written and approved, record it here as the reference:

- `profiles/<client-slug>/campaign-approval-brief.md`

(Profiles are gitignored, so read them locally.)

---

## How To Use This File

1. **Author** `profiles/<business-slug>/campaign-approval-brief.md` by copying the **Copy-Paste Markdown Skeleton** at the bottom of this file and filling it from saved artifacts only (never chat history, never invented decision history). Keep the section order, the fixed table columns/rows, and the plain voice exactly.
2. **QA** the authored Markdown against this skeleton (structure first, then voice and banned terms) before it is handed over. The QA steps in SKILL.md (structural conformance and the content text scan) check against this file.
3. **Stop there: the Markdown is what the operator gets.** Only when the operator asks for the deck version, map it onto the locked 10-slide deck, render it and QA it through the SKILL.md pipeline (The 10-Slide Contract, Required Builder, QA). Never hand-build the deck, and never point new work at the retired `scripts/brief_md_to_docx.ps1`.

The reader meets the **campaigns** (Sections 2–3) before the **email mechanics** (Section 4). Put a `---` rule after the metadata block and between every section.

---

## The Old DOCX Look (Design Tokens, Retired)

These tokens styled the retired DOCX render (the CSS block in `scripts/brief_md_to_docx.ps1`) and are kept for history only. A requested deck's look is locked in `scripts/approval-brief-pptx/lib.mjs` (SKILL.md, PPTX Design Rules). The hex values below are the ones baked into that script, carried over from a previous brand. **They are not FNNL Agency's brand colors.** When FNNL's palette is decided, update the accent in the PPTX design rules; there is no need to touch the retired script.

- **Font:** **Calibri** (Segoe UI / Arial fallback, all sans). A separate display face was deliberately not used, because it is not installed on the render box and the presentation renderers can't fall back through a CSS stack. **11 pt** body, **line-height 1.4**, near-black text **#1c1917**.
- **Headings:** H1 **22 pt** accent (**#dd1729**), H2 **15 pt** accent, H3 **12.5 pt** accent.
- **Tables:** full width, accent header (**#dd1729**) with white text, faint-tint zebra (**#fceaec**), white-smoke borders (**#e2e2e2**), padded cells.
- **Copy previews:** off-white blockquotes (**#fafafa**) with an accent left border, one per email variant.
- **Top metadata block:** muted slate-grey (**#5d6c7b**).

---

## Section Order (11 parts)

Author in exactly this order. Headings must match verbatim. Do **not** hardcode the campaign count in any heading (it is "The Campaigns At A Glance", never "The Three Campaigns…").

1. **Title + metadata block**: `# Campaign Approval Brief: <Client>`, then the fixed labels, one per line, in this order: **Client**, **Client contact**, **Prepared by**, **Date**, **Goal**. Then a `---` rule.
2. **`## 1. Read This First`**: short **bold-led** paragraphs (not a wall): *what this is* (the sign-off, nothing sends), *what we've built* (plain numbers, never the word "TAM" and no migration story), *who we're reaching*, *what we'll offer them* (the offer in one plain sentence), *the unifying idea* (e.g. "why three lists, one offer"), *where things stand* (warm-up / earliest send, no internal tooling), and a pointer to Section 6.
3. **`## 2. The Campaigns At A Glance`**: a table with the **fixed columns** `# | Campaign | Reaches | Offer | Role | Status`; emoji status (✅ Ready / ⚠️ / ⛔), **plain role labels** (see vocabulary below), then a short "why these" paragraph or bullet list and the no-overlap line.
4. **`## 3. Campaign Details`**: one `### Campaign N: <Name> (<count>)` block per campaign. Each block is a two-column table with the **fixed rows** `Who we email / Why they're on this list / What we offer / How we build it / Expected volume / Copy`, followed by **2–3 bullets**: *why the signal matters*, *why this role (<plain label>)*, and *the main risk and how we handle it*, all in plain words, no vendor names, no filter syntax.
5. **`## 4. How We Write & Personalize The Emails`**: **Step 1–4**, written once for all campaigns and placed **after** the campaigns:
   - **Step 1: The sequence.** One thread per contact, sent Monday to Friday: Email 1 on day 0 and a follow-up on day 3. A third email goes out on day 6 only on a small list (roughly under 3,000 qualified contacts, the house threshold in `/campaign-copywriting` Hard Rule 18) or as a logged test, so never promise three emails by default. Email 1 is written in three versions (A is the control; B and C each change exactly one thing against A). A reply stops the sequence (Aaron process alignment, operator directive 2026-09-22).
   - **Step 2: What gets personalized.** A plain table with columns `What we mention | Example | Where it comes from`, with **no `{{braces}}`**. Each campaign has one approved body per email version, shared by everyone on that list. Per contact, only the first name (optional) and at most two sourced facts change, inside the offer sentence (`/campaign-copywriting` Hard Rule 34). There is no company-name row (the company-name variable is not a default in copy), no per-contact "why they're on this list" or signal row, and no per-contact observation written by AI. A fact that is true of everyone on a list may be written into that list's shared body. The skeleton's "Why they're on this list" row is that case: it is written once per list and is the same for everyone on it, never filled in per contact.
   - **Step 3: Checking the per-contact facts.** A person reviews the first 20 filled-in facts before a list scales, and a contact with no sourced fact gets the approved version without it, never a guess.
   - A **quality-rule blockquote** (`>`): every per-contact fact must be sourced; if we can't source it, we don't use it.
   - **Step 4: Load and send.** Light per-recipient variation (with the deliverability gloss), loaded as a **paused draft**, one consistent sender across the warmed mailboxes, nothing sends until the client starts it.
6. **`## 5. Copy Preview`**: every saved variant from `variants.yaml` as blockquotes (one per email variant), **or** the standard pre-list-build placeholder when the brief is written before the list exists (its normal timing). Never invent copy here.
7. **`## 6. What We Need From You`**: **strategic, client-facing decisions only** (approve offers/order, suppression list, proof/claims they're comfortable using, any asset-gate or budget decision, and the reply-readiness items only they can supply: who on their team calls an interested reply and the booking calendar, when their team takes those calls, plus the qualifying questions for a trial, service or custom-work offer they deliver). Open with "Mark any you want changed; silence means approved." Silence approves the plan, never a client-delivered offer: name each offer still waiting on the client's yes, say in plain words that its campaign is ready but paused until they say yes, and point to the offer readiness board (`profiles/<business-slug>/offers/_readiness-board.md`, `offer-readiness.md`) instead of restating its rows. Keep the same asks, in the same words, as the one unsent `client-asks.md` (`client-messages.md`). **Exclude** all technical/internal setup (API keys, workspace IDs, verifier/mailbox/registrar/warmup setup, source-workflow build steps).
8. **`## 7. What Happens Next`**: the operational sequence in plain language (no skill slugs, no vendor names) + a "Things we won't skip" line with the per-campaign stop gates.
9. **`## 8. How We Protect Your Reputation`**: the deliverability and compliance guardrails in plain words.
10. **`## Appendix A: Other Options We Considered`**: the alternatives, listed **once** (never repeat an alternatives list inside campaign sections), in up to three groups:
    - **Later-wave campaigns and slices** from `campaign-strategy.md`.
    - **Offers considered and not in this test:** the candidates under `## Every candidate` in `lead-magnets.md` that sit outside the test set, plus the directions `offer-intelligence.md` ranked lower (its `**Rank lower:**` line, or the legacy `**Avoid:**` line), each with its plain reason. Ranked lower is never presented as ruled out. Every offer in the test, including any queued behind the first wave, belongs in Sections 1 and 2, not here.
    - **Problems we heard and are not leading with**, only when `_research/pain-clusters.md` exists: the clusters no offer in the test answers (each offer's `cluster_ids` in `client-profile.yaml`, per segment where the client has `offer.segments`, say which clusters it answers), highest opportunity score first, with weak ones labelled rather than dropped. Write each one in the buyers' own words from the file. Copy each count from the file (it comes from the evidence ledger), never type or re-tally it by hand, and never turn it into a percentage. Keep each cluster's confidence label, and when the file's Research QA verdict is HOLD, say plainly that the research behind these is still thin. Never present a hypothesis (the client's or a model's guess about buyer pain) as something buyers said, and never print a cluster or evidence ID.
    - If alternatives are not explicit in artifacts, write `Not captured in current artifacts.`
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

**Banned in client prose. Scan and confirm ZERO hits before the brief is handed over:**

- **Internal vendor / tool names.** Build the list at scan time from every tool named in `outbound/stack-contract.yaml` (company discovery, contact enrichment, email verifier, registrar, mailbox provider, sending platform, CRM, research), plus any pack name under `_vendor-library/`, plus any other data, scraping or enrichment tool that appears in this client's artifacts. Describe what the tool *does* in plain words instead ("we look up and verify the right contact"). If the contract is still empty there may be nothing to scan for, which is fine.
- **Raw syntax / fragments:** `segment_subtype`, `{{` (any merge-field braces), and any query, column, or filter fragment.
- **Research reference IDs:** cluster IDs (`C-01`) and evidence IDs (`E-0001`) from the research files. Say what the buyers said, not the reference number.
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

**What we'll offer them.** <The offer in one plain sentence: what each prospect actually gets, and why it's useful on its own. If one offer across all lists, say so. When several offers are under test, say plainly that every company that fits is loaded in the first send, that each offer goes only to the buyers it suits (its own fit filters decide), and that where two or more offers suit the same buyers, those buyers are split evenly between them so each offer gets a fair, equal share. Then say that as soon as one offer clearly wins, it goes to everyone not yet emailed whom it suits, and the rest get the strongest offer that suits them. List the offers in that first send, and any queued behind them, exactly as the offer slate (`offer-test-slate.md`) showed them, each with its buyer type; offers still in the test never go in Appendix A.>

**<The unifying idea>.** <e.g. "Why three lists, one offer" or "One list, three offers, one winner": what's held constant and what that lets us learn.>

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
| **Expected volume** | <N companies → every matching decision-maker at each, about <n> verified contacts> |
| **Copy** | Drafted after the list is built |

- **Why the signal matters:** <why this signal makes the list a good fit for the offer right now, in plain words>.
- **Why this role (<plain label>):** <why it earns that role>.
- **The main risk and how we handle it:** <the campaign's own main risk from its lead-source-plan, plus the mitigation>.

<Repeat the ### Campaign N block for each selected campaign.>

---

## 4. How We Write & Personalize The Emails

**Step 1: The sequence.** Each contact gets a short sequence in one thread, sent Monday to Friday: Email 1 on day 0 and a follow-up on day 3. <Only when a campaign runs a third email (a small list, roughly under 3,000 qualified contacts, or a logged test), add: "On <campaign>, a third email follows on day 6."> Each follow-up builds on the first email rather than repeating the same ask. We write three versions of Email 1 and send them side by side: version A is the baseline, and B and C each change one thing against it, so the replies show which version works best. A reply always stops the sequence.

**Step 2: What gets personalized.** Each campaign sends one shared message, and at most two facts about each company are filled in inside the offer itself, so the offer names the right thing for them without guessing:

| What we mention | Example | Where it comes from |
|---|---|---|
| The contact's first name (optional) | "<Example>" | The contact look-up step |
| What they sell, in a short phrase | "<example>" | Their own website, with the page saved as the source |
| Who they sell to | "<example>" | Their own website, with the page saved as the source |
| Their own best client, as the one our offer is for | "<example>" | Their own case studies or client list, with the page saved |
| Why they're on this list, only when it is true of every company on it | <the shared reason, plain> | The list itself, so it is the same for everyone |

**Step 3: Checking the per-contact facts.** Before a list scales, a person reviews the first 20 filled-in facts, and we tighten how we find them if more than 3 of the 20 are vague, awkward or wrong. A contact with no sourced fact gets the approved version of the email without it.

> Quality rule: every per-contact fact must come from our list data or the company's own public site. If we can't source it, that contact gets the version without it. We never guess, and we never read someone's customer list, headcount or staff back to them.

**Step 4: Load and send.** The copy is varied slightly per recipient (light wording variation that protects deliverability, meaning whether emails land in the inbox instead of spam), then loaded as a **paused draft** in your sending platform. All email comes from **<Sender persona>** (one consistent identity) across your <N> warmed mailboxes. Nothing sends until you start it.

---

## 5. Copy Preview

> Copy preview will be available once the contact lists are built and the email copy is written and approved. This brief is intentionally produced before that step, so you can approve the direction before we spend on data.

<If variants.yaml exists and passed the verified-list gate, replace the placeholder with every saved variant as blockquotes, grouped by campaign, email step, and variant label.>

---

## 6. What We Need From You

Mark any you want changed; silence means approved.

1. **<Approve the offers / order>**: <the core strategic approval>.
<For each offer you deliver that still needs your yes: **<offer in plain words>**: ready and paused; it starts only after you say yes. Agency-delivered offers need no yes and are not listed here.>
2. **Suppression list**: any existing customers, active deals, or partners you do **not** want contacted.
3. **Proof you're comfortable using**: confirm which named clients, results, or claims we may reference, and flag anything off-limits.
4. **Who calls back a yes** <only when your team takes the calls>: the person on your team who calls anyone who replies with interest, ideally within about 5 minutes, and the booking calendar we offer two times from.
5. **Who gets the free <thing we offer>** <only for a trial, service or custom-work offer you deliver>: the few short questions that decide who gets it and who gets your standard offer instead.
<Add any asset-gate or budget decision here, with a clear recommendation.>

If none of these companies are existing relationships, just tell us and we proceed.

---

## 7. What Happens Next

1. You approve this brief (<the decisions above>).
2. We build and verify the decision-maker contact lists. Every contact is checked on its own, any that fail are removed, and then the list as a whole is graded.
3. We write the copy and run it through our quality gates, then share it for your approval.
4. We set up reply handling before anything sends (a reply for each kind of answer, a short call script, and the page someone sees after booking), then load the campaigns as **paused drafts**, ready for you to start.
5. Once your mailboxes finish warming and pass deliverability checks, **you** start sending. Every company on the list goes into that first send on weekdays. Each offer goes only to the buyers it suits, and where two or more offers suit the same buyers, those buyers are split evenly between them. We read the results daily in the first week. Once one offer wins, it goes to everyone not yet emailed whom it suits, and the rest get the strongest offer that suits them.

**Things we won't skip:** verified contacts only; copy passes our spam, best-practice and call-to-action checks; every contact checked and failing ones removed before the list is graded B or higher; reply handling ready before the first send; mailboxes confirmed warmed and authenticated before any real send.

---

## 8. How We Protect Your Reputation

- No links or calendar invites in the first emails. We only ask for a reply, which keeps it low-friction.
- One consistent sender (<Sender persona>) across every mailbox.
- <Any client-specific compliance framing, e.g. healthcare/GDPR/no invented quotes>.
- One-click unsubscribe, and complaint and bounce rates held to safe levels.
- Real sending stays blocked until warm-up finishes and deliverability is verified.

---

## Appendix A: Other Options We Considered

Evaluated and set aside for later waves:

- **<Alternative campaign / slice>**: <one line on why it's a later wave>.

**Offers considered and not in this test:**
- **<Offer or direction>**: <why it ranks lower, in plain words>.

**Problems we heard and are not leading with:** <only when the research file exists; otherwise delete this group>
- **"<the problem, in the buyers' own words>"**: <how often it came up, copied from the file, e.g. "came up in 6 discussions and 2 sales calls">, <its confidence, e.g. "still thin">. <One line on why no offer in this test leads with it.>

<If alternatives are not explicit in artifacts, write: Not captured in current artifacts.>

---

## Appendix B: If You Want To Change Something

- **Change who we target** → we redo the targeting research and rebuild the list.
- **Change an offer** → we redo the offer research and the copy for that campaign.
- **Change where the list comes from** → we redo the source plan and re-grade the list.
- **Change only the wording** → we just rewrite that campaign's copy.
```
