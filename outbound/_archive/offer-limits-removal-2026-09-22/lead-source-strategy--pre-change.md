# Archive: lead-source-strategy, full pre-change snapshot

- **Source file:** `.claude/skills/lead-source-strategy/SKILL.md` (FNNL Agency GTM System)
- **Archived:** 2026-09-22, operator directive: remove the offer-ideation limits (client willingness, capacity, effort, free trial) and move the capacity question to after the test
- **Why a full snapshot:** this file carried other sessions' uncommitted edits when it was changed, so the whole file is kept verbatim as the exact pre-change state. Diff it against the live file to see this change alone.
- **Replaced by:** the live file at the same path. `MANIFEST.md` in this folder lists what changed and why.

This is a record, not live doctrine: do not lift any of it back into a skill.

`````markdown
---
name: lead-source-strategy
description: Single-purpose source router for cold email campaigns. Produces the per-campaign lead source plan at profiles/<slug>/campaigns/<campaign-slug>/lead-source-plan.md, naming the source-of-truth signal, the collection tool, the contact layer, and the QA path for the ONE campaign the operator selected. Runs after /campaign-strategy and after campaign selection, and BEFORE any list source, scraper, database pull, contact enrichment, custom workflow, or enrichment spend. Every tool it names must be one the stack contract declares; if a needed slot is empty, it stops and routes to /stack-setup.
---

# Lead Source Strategy
## Canonical Profile Root

All profiles/<business-slug> paths in this skill resolve under:

```text
<outbound>/profiles
```

Here `<outbound>` is the root of this skill library - resolve it to wherever the library is currently checked out (local Documents, OneDrive, or a git worktree); never hardcode an absolute path. Do not create client profiles under a `profiles/` folder at your current working directory.

This skill has one job: after campaign selection, choose the final source path for list building and write it down.

It does not scrape, enrich, verify, write copy, upload, or lock an offer. It writes a lead source plan that proves the list source matches the selected campaign.

Defaulting to whichever contact database or maps scrape is easiest is weak thinking. Use a source when it is the best evidence for the signal. Otherwise, build from the source that actually proves fit.

Read `/lead-list-tech-stack-research` before choosing the source stack. That skill is the tool-fit map. This skill makes the decision.

> **Approved-stack rule (operator directive 2026-09-22).** FNNL's tools are the closed list in the `approved_stack` block of `outbound/stack-contract.yaml`. Meet every need from that list first, and check each listed tool's full surface (its MCP tool list and API docs) before declaring a gap. Any other tool named in this file is a catalogue example: raise it only as "OUT OF STACK, needs operator approval", never as the path, and never credential or spend on it until the operator approves it by name and it is recorded in `approved_stack.approved_exceptions`. A slot at status `held` declares nothing, exactly like `not_chosen`.

## Material Decision Rule

When this skill reaches a material fork, name the realistic options, recommend the strongest path, and explain why the main alternatives are weaker before committing.

Ask before choices that affect spend, provider routing, source of truth, list quality, campaign direction, client-facing output, live systems, scraping or account risk, or legal/compliance risk. For low-risk reversible choices, state the recommendation and proceed.

Do not turn failed or unsafe paths into user-facing options. If this skill's QA rules or stop gates reject a path, filter it out and explain the blocker only when useful.

When asking the user, use the Claude Desktop native Interactive Inputs / Choice Prompts pattern from /clarification-first: recommended option first, short choices, and Custom answer last when a custom answer is plausible.

## Interaction Policy

Defers to `/autonomous-execution-policy`. Under `run_state.execution_mode = auto_execute` (the operator's default), proceed without pausing: pick the strongest option per this skill's rubric, record it to `run_state`/profile, and continue — never re-ask a decision already in `run_state`, the profile, memory, or the operator's latest message. Stop only for the policy's hard-stops (spend over the approved ceiling, live send, credentials, provider/source-of-truth change, safety gates). On a long async wait, background-poll and move to other productive work — never idle.

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short — record status, not raw output. Full protocol: `client-activity-log.md`.

## When To Use

Use this skill after `/campaign-strategy` and after the user chooses the first campaign to launch. That is its only entry point.

Keep the flow intact: buyer and pain, then the offer, then the list built to fit that offer, then the copy. Concretely, that is `/icp-onboarding` -> `/offer-intelligence` discovery -> `/lead-magnet-brainstorm` (the offer locks here) -> `/data-point-discovery` -> `/tam-build` -> `/social-proof-bank` -> `/lead-scoring` -> `/campaign-strategy` -> this skill.

This skill has one procedure and no modes. An older route that says "Lead Source Plan Mode" means this skill, so follow it straight here. Do not split it into a separate research phase earlier in the chain either. It researches the source landscape for the one selected campaign, under the research routing rule below, and that research belongs here at campaign time rather than as its own step before the list is built.

Run it before any list-source action, including:

- account discovery
- contact database export
- local or maps extraction
- website, directory, job-board, event-page, marketplace, or custom scraping
- social-intent collection
- workflow build in RevCode, Clay, spreadsheets, scripts, APIs, or MCP tools
- domain-to-person enrichment
- paid source credits or enrichment spend

## Inputs

Read:

- `profiles/<business-slug>/client-profile.yaml`
- Client website URL, if available
- onboarding form responses or call notes, if available
- any source preferences or blocked sources in `client-profile.yaml`
- target geography fields from `client-profile.yaml`, including countries, states, regions, cities, and excluded markets
- any capability, proof, delivery, legal, or compliance constraints from the profile
- `lead-list-tech-stack-research.md`
- `profiles/<business-slug>/campaign-strategy.md`
- selected campaign name and row
- `profiles/<business-slug>/data-point-catalog.md`, if present, for what the stack can actually obtain
- `profiles/<business-slug>/offer-intelligence.md`, if present
- `profiles/<business-slug>/lead-magnets.md`, if present

The front-end offer is already locked by the time this skill runs, so read it and never write it. Take `offer.lead_magnet` and the lead-magnet detail fields from `profiles/<business-slug>/client-profile.yaml`, plus `profiles/<business-slug>/lead-magnets.md`, and make sure the source path you choose puts people on the list that the locked offer actually serves.

Optional source preferences:

```yaml
lead_sourcing:
  preferred_sources: []
  blocked_sources: []
  approved_custom_scraping: false
  approval_required_for_paid_sources: true
```

## Core Rule

Capability boundary first, source signal second.

Do not chase a clever source the client cannot serve. This skill never locks, re-opens, or edits an offer. By the time it runs the offer is already locked, so source-first means the source signal has to prove the locked offer is believable to the buyer that source puts on the list. It does not replace market reasoning or delivery reality.

Choose the source from the selected campaign signal, not from tool comfort.

**Do not rewrite the offer to fit an attractive source.** Do not write to `offer.lead_magnet`, do not re-open the locked offer, and do not create a second locked offer field. A tempting source is a reason to consider a source path, never a reason to swap the offer out from under the rest of the chain.

Ask:

1. What exact signal makes this prospect relevant?
2. Where does that signal naturally live?
3. Does that source actually cover the target geography?
4. Are there country-specific directories, registries, associations, marketplaces, job boards, event pages, or public databases that beat a generic contact database?
5. Can we collect it at useful volume?
6. Can we reach the right person after collection?
7. Can we reference the signal without sounding fake, creepy, or overfit?
8. What source would miss these leads?
9. Does this source make the locked offer believable to the people it puts on the list?
10. What could fail if we overread the signal?

If the answer is "we only know titles and industries," a database pull may be fine. If the answer is "they appeared in a niche directory, joined a platform ecosystem, posted about a pain, sponsored an event, or show a public website pattern," a generic database pull is probably the lazy path.

If the target market is location-specific, do not recommend a source family until you have checked whether it has usable coverage there. "Scrape directories" is not a strategy if the directory barely covers Denmark. A Denmark-specific registry, association, event list, marketplace, or public database may beat every global tool in the folder.

## Tool Role Separation Rule

Every Lead Source Plan must separate the stack into five roles:

1. **Workflow layer: the list workbench by default** (`run_state.list_workbench`, resolved from the stack contract). The working list lives in a workbench table so the operator can watch it fill live instead of receiving a blind CSV. The session sources and enriches with FNNL's own API-keyed tools, combines, scores, and dedupes, then pushes finished rows into the table through its inbound webhook. It never spends the workbench's own credits (zero-workbench-credit HARD RULE, CLAUDE.md section 7). The operator creates the table in the workbench UI, since the session cannot create tables or columns there. **Fallback: Claude Code native.** If no workbench is locked, or the client's table and webhook are not set up yet, the session builds the CSV directly and says so in the plan. RevCode (no API, so manual and human-in-the-loop), spreadsheets, scripts, APIs, or MCP tools remain allowed when they fit better (full rule in `/lead-list-tech-stack-research`). Whatever the surface, the CSV the downstream skills read is an export of the working list, with the same canonical columns, so nothing downstream changes.
2. **Source-of-truth signal:** the public source where the campaign proof actually lives.
3. **Collection tool:** the best tool for collecting that signal, such as DiscoLike, GetLatka, Serper, Spider Cloud, Scrap.io, Apify, Trigify, a database, or a custom parser.
4. **Contact discovery + enrichment:** discover real named people from a contact database with a **current-employer field** (A-Leads `advanced_search`, DiscoLike `generate-contacts`, or a people-DB — never `search-contacts` index mode, which fabricates names; ⛔ and **never from a LinkedIn/Google search via Serper + an AI title-picker**, banned 2026-07-17 because Google's cached snippets carry no employment-currency signal and yield retired/departed people — see `/email-waterfall`) so every row has a real first + last name **who still works there**; then, for rows with no email, the FINDER = **A-Leads `find_email` (find) + Deliverable.co (verify + catch-all) first (HARD RULE), BetterContact ONLY on the residue** (no email found, or `undeliverable`/`catch_all`/`risky`/`unknown`), with Prospeo/WizLeads/Blitz further fallback. If a row already has an email, it is **verified first with Deliverable.co** (verify + catch-all in one), not re-found — that ordering and the Deliverable.co verify routing are owned by `/email-waterfall`'s Verification Doctrine. Never discover or enrich contacts through the list workbench's own built-in search or enrichment, because those spend the workbench's credits (zero-workbench-credit HARD RULE); contacts come from FNNL's own keyed tools and are pushed into the workbench.
5. **QA and verification:** `/icp-prompt-builder`, /email-waterfall, and `/list-quality-scorecard`.

Do not collapse these roles into Prospeo because Prospeo has good contact data. Prospeo is usually a contact database or enrichment layer. It is the source only when title, company, technology, job-change, or Prospeo-native data is the real source of truth.

Default role choices:

- The list workbench is the default workflow layer (rows pushed in by webhook, zero workbench credits), with Claude Code native as the fallback when no workbench table is ready; RevCode stays an optional manual workspace. None of them is the source.
- A contact database is the strongest contact layer available, never the default list source. The source-of-truth signal decides who belongs on the list; the contact layer only finds the people at those companies.
- For true lookalike or company-similarity discovery, use whatever fills `lead_data.company_discovery`. Some similarity tools also do per-company AI research, contact discovery, and ICP-fit validation. Before routing a job to one, read its capability map and current plan feature gates, because these features are commonly plan-gated: if `/stack-setup` activated a pack for it, that pack documents them; otherwise check the vendor's own docs.
- GetLatka is preferred when SaaS ARR, revenue stage, growth, category, or SaaS database coverage is the actual signal.
- Serper plus Spider Cloud or Apify wins when the signal lives on a public website, directory, job board, event page, marketplace, or search result.

## AI/API Routing

> **Research Routing: HARD RULE (Claude deep-research primary, enforced; no-AI-API rule, operator directive 2026-09-22).** `run_state.research_routing` has exactly one value, **`claude_deep_research`**. If it is unset, set it to that and proceed. If it still holds a retired value (`third_party_ai`, or the bare-WebSearch `claude_native`), treat it as `claude_deep_research` and note the correction in the activity log. The primary research brain is the Claude native `/deep-research` fan-out harness (multiple sub-agents research every needed category in parallel, fetch real sources, adversarially verify each claim, and synthesize a cited report). Do NOT stop to ask, and do NOT satisfy the primary pass with a bare inline WebSearch. The primary pass MUST be an **actual `/deep-research` invocation** (inline WebSearch/WebFetch alone does NOT satisfy it): record `ai_research_provider = claude-deep-research` and append the run-log line to `api-balance-ledger.md` (a provenance record the wired check reads, not an AI spend row). A research step that finishes with **no `/deep-research` primary** is a **flagged violation** (run it, or get a fresh explicit OK to skip). **Wired check:** after the primary pass, run `node scripts/research/research_routing_check.mjs --skill lead-source-strategy --client <business-slug> --json`. A `violation:true` / exit 1 means no logged primary; do not declare this research step done until it passes. No API key of any kind is needed: research runs only on Claude Code itself (the harness, its sub-agents, WebSearch and WebFetch), and no other AI provider is ever called. Full rule: `/ai-model-routing`.

The five tool roles above are data layers. Research routing is a parallel layer for this skill's own market and source research, and it runs the single Claude Code native path in `/ai-model-routing` (no cheap/standard tier, no other AI provider). The Claude native `/deep-research` fan-out harness runs the primary broad pass (web-grounded company/market research via parallel sub-agents, source fetch, adversarial verification, cited synthesis). Gaps the primary pass leaves (thin / technical / too-broad / unverified) are filled by a second targeted `/deep-research` pass or a targeted WebSearch/WebFetch pass, never a duplicate broad pass. Raw URLs → WebSearch; page extraction → WebFetch; bulk synthesis / pain-extraction / pre-compressing raw dumps → Claude Code sub-agents fanned out over disjoint batches per `/personalization-subagent-pattern`. When references are too many, scale mode has WebSearch EMIT ranked URLs → sub-agents read their own URL batch with WebFetch and compress it → the main Claude Code session synthesizes. The live X / social read no longer exists, so note that gap rather than claiming X coverage. When a campaign signal lives in buyer discussion (review sites, forums, YouTube), collect it through the **VOC / Raw-Evidence pipeline** in `/ai-model-routing` (WebSearch for the exact discussion URLs → WebFetch to read them; tag `source_class`), not a loose web search, and every source carries a `source_url`. Reddit is the exception: Claude's tools cannot read it, so it enters only as text an operator pasted with its thread URL, and otherwise it is logged as unread. See `ai-model-routing.md` for the full pipeline (Brief → `/deep-research` primary → Source Registry → WebFetch extract → VOC → sub-agent crunch → Claude Code synthesis → targeted gap-fill + validation → Packet → Copy → QA). This skill produces evidence, not emails. Do not route final copy here; that is `/campaign-copywriting` (Claude Code native, clean-packet sub-agent) from a clean packet. Keep the canonical CSV fields (`source, source_type, source_url, evidence_url, signal, fit_reason, source_confidence`) intact; the AI-routing columns in `lead-list-tech-stack-research.md` map onto them.

## Accepted Source Families

Use any public, legal, campaign-relevant source family that fits the signal:

- Workflow layers: the list workbench by default (the session pushes finished rows into its table by webhook, zero workbench credits); Claude Code native as the fallback when no workbench table is ready (the session builds the CSV directly); RevCode as an optional manual workspace (no API, for its UI or local large-list engine); spreadsheets, scripts, APIs, MCP tools, or manual QA for combining and scoring sources
- Contact databases and enrichment: the **email finder** finds first, the **email verifier** verifies every address including a separate catch-all signal, and the **waterfall enricher** runs on the residue ONLY. That ordering is the HARD RULE, not any particular brand. Resolve each role from `stack-contract.yaml` (`lead_data.contact_discovery`, `lead_data.contact_enrichment`, `lead_data.email_verification`); if a role is empty, stop and route to `/stack-setup`. **Whichever finder produces the email, the verifier of record verifies it**, and the residue it cannot clear (invalid, catch-all, risky, unknown) plus rows no finder closed go to the waterfall enricher to recover a new address, whose output is then re-verified by the same verifier. No source is exempt. Record the waterfall order in `lead_data.contact_enrichment.notes` and mirror it in `/email-waterfall`.
- Company discovery: the tool in `lead_data.company_discovery`, plus public company databases and official company registries (examples of the category: a lookalike engine, a firmographic database, a registry pull).
- Local business sources: Google Maps, Scrap.io, Apify Maps actors, Serper Maps or Places
- Search discovery: the harness's WebSearch (what `web.search` means in FNNL); catalogue examples Serper, Spider Cloud search; Google operators, news, patents, scholar, shopping, images when relevant
- Website extraction: the harness's WebFetch (what `web.crawl` means in FNNL); catalogue examples Spider Cloud, Apify, custom crawlers; public website pages
- Social intent: Trigify, competitor engagers, public LinkedIn activity, X, Reddit (operator paste only: Claude's tools cannot read it), YouTube, podcasts
- Public directories: associations, certification directories, partner directories, marketplaces, app stores, agency directories, vendor ecosystems
- Event sources: exhibitor lists, sponsor pages, speaker pages, public attendee pages, conference schedules
- Hiring sources: job boards, careers pages, LinkedIn Jobs, Indeed, niche job boards
- Tech-stack sources: whichever contact or company database in the contract exposes a technologies field, plus public site tags and a dedicated technographics service.

Do not treat this list as complete. If a human could find the signal publicly in 10 minutes, it can be considered.

## The Lead Source Plan

Run this only after `/campaign-strategy` and after the operator selects one campaign to launch.

### Source Path Selection

Use this routing logic:

This table is a starting map, not a shortcut. Apply the target market's real source reality and the selected campaign row before choosing the final source. A source that is strong in one country can be useless in another.

Start every plan with the list workbench as the workflow layer (rows pushed in by webhook, zero workbench credits), or Claude Code native if no workbench table is ready, unless another operator path is stronger. Where the table below names RevCode or Claude Code native as the workflow surface, read it as whichever surface the plan uses; RevCode stays an optional manual workspace. Then pick the source-of-truth signal and collection tool.

| Campaign signal | Source-of-truth signal and collection tool | Workflow and contact layer | Common trap |
|---|---|---|---|
| Title + industry only | Prospeo, A-Leads, WizLeads, or Sales Navigator if the person database is the real source | RevCode for cleanup and QA; same provider or email waterfall for contact data | Pretending this is niche |
| Known good customer lookalikes | DiscoLike first for similarity (for the TAM spine this is the proven-motion default: seed the lookalike from the client's validated case-study companies, see Quality Rules and `/tam-build`); GetLatka only when SaaS ARR/category is the actual signal; Serper plus Spider Cloud for public-web similarity | RevCode to merge and score; Prospeo, A-Leads, WizLeads, or Blitz for contacts | Exporting generic titles first |
| Local SMB category or location | Scrap.io, Google Maps, Apify Maps, Serper Places | RevCode for dedupe and scoring; owner-finding or email waterfall for contacts | Assuming LinkedIn coverage is enough |
| Public website pattern | Serper plus Spider Cloud, Apify, or custom parser | RevCode to classify pages and keep evidence URLs; contact enrichment after ICP pass | Trying to force the pattern into Prospeo filters |
| Niche directory or association | Directory scrape, Spider Cloud, Apify, custom parser | RevCode to normalize member rows; domain-to-person enrichment | Ignoring the directory because it is harder |
| Platform or ecosystem membership | Partner directories, app marketplaces, integration pages, tech-stack source | RevCode to merge directory and tech evidence; contact enrichment later | Using only a generic technology filter |
| Social pain or intent | Trigify, competitor-engagers, social post/comment source | RevCode for context scoring and compliance flags; contact enrichment after sample QA | Treating a like as buying intent |
| Hiring trigger | Job boards, careers pages, Serper, Spider Cloud, LinkedIn Jobs, Indeed, or Prospeo job signals when Prospeo is the native job source | RevCode to preserve job URLs; buyer enrichment after company qualification | Treating any hiring as relevant |
| Event sponsorship / exhibiting | WebSearch to find the event, WebFetch to read its sponsor / exhibitor / speaker pages, Claude Code sub-agents to extract the roster (the ladder in `/lead-list-tech-stack-research`; a sponsor page is plain HTML, so it never reaches a paid scraper) | Claude Code native to normalize the roster and join `co_event_*` onto companies; contact enrichment after the ICP pass | Scraping the famous shows. See the Quality Rule below |
| SaaS revenue or growth fit | GetLatka, funding databases, Seedtable, Crunchbase, Serper news | RevCode for growth-stage scoring; contact enrichment after account fit | Guessing ARR from headcount |
| Old CRM or CSV | Owned CRM/CSV as the source of truth | RevCode or spreadsheet cleanup, enrichment waterfall, suppression, then QA | Buying a fresh list before fixing owned data |

### Required Output

Write:

```text
profiles/<business-slug>/campaigns/<campaign-slug>/lead-source-plan.md
```

Use this structure. The header block and bold-label format are **required** — the campaign approval brief script reads these exact `**Label:** value` patterns. Plain bullets without bold labels will produce "Not captured in current artifacts" throughout the approval brief.

```markdown
# Lead Source Plan - <Campaign Name>

**Campaign:** <Campaign name — must match campaign slug and campaign-strategy.md row>
**Date:** <YYYY-MM-DD>
**ICP:** <Exact titles, company type, size, geography — must match client-profile.yaml hard filters>
**Offer:** <Offer / lead magnet name — must match lead-magnets.md locked choice>
**Sending platform:** <The locked `run_state.sending_platform`. If that slot is empty, stop and route to /stack-setup rather than naming one here>

---

## Campaign Hypothesis

- **Campaign angle:** <One sentence: what the campaign is leading with and why>
- **Why this list should care now:** <The specific reason this audience has active pain or budget right now>

---

## Source Stack

- **Workflow layer:** <the list workbench by default (rows pushed in by webhook, zero workbench credits); Claude Code native CSV if no workbench table is ready; RevCode or equivalent if used>
- **Source-of-truth signal:** <The specific observable signal that proves fit — job posting, hire trigger, association directory entry, etc.>
- **Collection tool:** <Which tool pulls the initial list>
- **Contact enrichment:** <Which tool finds the person after the company is qualified>
- **QA and verification:** <Verifier + list quality scorecard reference>

---

## Primary Source Path

- **Source family:** <Category: hiring trigger / association directory / regulator registry / named account / maps / etc.>
- **Specific collection source or tool:** <Exact tool and method — LinkedIn Jobs, SZZ directory, Google Maps, A-Leads, etc.>
- **Contact enrichment layer:** <Real-named discovery first from a source with a current-employer field, never an index/pattern mode; then for no-email rows the email finder, then the verifier of record (verify plus catch-all). HARD RULE: the waterfall enricher runs ONLY on the residue (no email found, or undeliverable / catch-all / risky / unknown), and existing-email rows go verify-first per `/email-waterfall`. Name the actual tools from `stack-contract.yaml`.>
- **Exact signal:** <The specific observable thing that puts a company on this list>
- **Target geography:** <Countries, regions, or cities>
- **Market-specific source options considered:**
  - <Option 1: name + why considered or rejected>
  - <Option 2: name + why considered or rejected>
- **Location coverage risk:** <Low / Medium / High + brief reason>
- **Data availability risk:** <Low / Medium / High + brief reason>
- **Why this beats a generic database pull:** <Specific reason the source-of-truth signal proves fit that a generic title export cannot>
- **Expected row type:** company-level first | person-level | mixed
- **Expected volume:** <N qualified companies → N verified contacts after enrichment>

---

## Backup Source Path

- **Source family:** <Fallback category>
- **Specific collection source or tool:** <Fallback tool>
- **Contact enrichment layer:** <Fallback enrichment path>
- **When to switch:** <Specific trigger condition to move to backup>

---

## Fields To Collect

Required lead source fields:
- `source`
- `source_type`
- `source_url`
- `evidence_url`
- `signal`
- `fit_reason`
- `source_confidence`

Campaign-specific fields:
- `<field_name>`: <why it matters for this campaign>

---

## Enrichment Path

- **Workflow layer:** <the list workbench by default (rows pushed in by webhook, zero workbench credits); Claude Code native CSV if no workbench table is ready; RevCode or equivalent if used. Orchestrates all steps below>
- **Company cleanup:** <Dedup, ICP filter, suppression>
- **Contact finding:** <the contact-discovery tool from the stack contract, a sales-navigator-style export, or manual lookup>
- **Email finding:** <Waterfall sequence>
- **Verification:** <the `email_verification` tool from the stack contract>
- **Suppression:** <Existing client list + prior campaign records>

---

## QA And Stop Gates

- **Sample size before scaling:** <How many rows to review before full run>
- **ICP prompt requirement:** <Run /icp-prompt-builder before contact enrichment spend>
- **Manual spot checks:** <What to manually verify and at what sample size>
- **Stop if:** <Specific numeric conditions that pause the workflow>
- **Approval needed before paid or high-risk scraping:** <What requires explicit sign-off>

---

## Next Skills

1. <selected source skill, RevCode workflow, or custom scrape workflow>
2. /icp-prompt-builder
3. /email-waterfall
4. /list-quality-scorecard
5. /campaign-copywriting
```

**Critical format note:** Every label in `## Primary Source Path` and `## Backup Source Path` must use `- **Label:** value` syntax (dash space double-asterisk Label colon double-asterisk space value). The campaign approval brief script parses these exact patterns. A plain `- Label: value` without bold will not be read.

## Required CSV Fields

Every list source should preserve these fields through enrichment:

```text
source,source_type,source_url,evidence_url,signal,fit_reason,source_confidence
```

Definitions:

- `source`: vendor or website name, such as Prospeo, Scrap.io, TechServe directory, Serper, Spider Cloud
- `source_type`: database, maps, directory, website, social, job_board, event, marketplace, search, owned_csv, custom
- `source_url`: source page, search URL, export source, or provider name if no public URL exists
- `evidence_url`: the page that proves the signal for that row, when available
- `signal`: the reason the row belongs in this campaign
- `fit_reason`: one sentence connecting the signal to the ICP and offer
- `source_confidence`: high, medium, low

If a source cannot preserve evidence, mark `source_confidence=low` unless there is another strong verification path.

## Approval Rules

Ask before scaling when:

- paid API or database credits will be used
- custom scraping is needed and `approved_custom_scraping` is not true
- the source is social, platform-sensitive, or likely to trigger account risk
- the source includes personal data beyond normal B2B contact data
- the source has unclear terms, login walls, or sensitive regulated-market data

Public web data is allowed as a source candidate. That does not make it automatically worth scraping.

## Quality Rules

- A contact database or a maps scrape is allowed. Neither is a default.
- Do not call a contact-enrichment provider the source unless that provider owns the source-of-truth signal.
- For lookalike campaigns, use DiscoLike first unless the selected signal is specifically SaaS revenue, ARR, growth, or category coverage.
- **Company-discovery for the TAM is not a free operator's pick between whichever two tools are keyed. It follows the two-motion rule (a precision choice, not a cost one).** The DEFAULT (proven motion) is a **lookalike expansion seeded from the client's validated case-study / customer companies**, built per case-study group, run through whatever fills `lead_data.company_discovery`. Seeding from real wins is the highest-fidelity company match, which is why it is the default: it is signal-first, not the easy path. A **broad ICP filter** (a company-search or category / natural-language ICP query on that same slot) is the deliberate EXPANSION / net-new motion, used for a segment the client has not sold to yet or a brand-new offer with no proof. The contact layer is enrichment, never the source-of-truth signal.
- For public-web, directory, job-board, event, marketplace, or pricing-page signals, use Serper plus Spider Cloud, Apify, or a custom parser before contact enrichment.
- **Event sponsorship is three signals in one artifact, and the middle one is the valuable one.** A company that paid to sponsor or exhibit at a show has disclosed, voluntarily and at real cost: (1) **budget** (they paid), (2) **who they sell to** (they paid to stand in a room full of one specific buyer), and (3) a **dated why-now** (the event has a date). Number 2 is the reason to bother. The `sold_to` axis is the highest-leverage message-differential cut we have (`/campaign-strategy`), and today it is *derived* by classifying website text at `med` coverage. A sponsor roster is a near-100%-precision `sold_to` oracle instead: a company that paid $40k to stand in a GTM room has stated who it sells to more reliably than any homepage classifier can infer it. Treat a sponsor list as ground truth for `sells_to_*`, not just as another list to scrape.
- **Sponsor lists: niche and regional shows only, never the famous ones (HARD).** Eric's own list-building doctrine praises custom scraping as "hidden gold, less competition" and then his demo pulls Dreamforce and SaaStr, which are the single most-scraped sponsor lists in B2B software. Those inboxes are the most-hit in the market, so the famous shows invert the very advantage the source family exists for. A 200-sponsor roster from a regional or vertical show is the play. If the event has its own Wikipedia page, assume every competitor already mailed that list this quarter and pick a different show.
- **Events enter as a company signal, not as the TAM spine.** Sponsorship joins onto companies as `co_event_*` per `/tam-build`'s Layer 1d. Building a list whose source of truth *is* the event roster is this skill's source-first motion and is fine; what it must not do is displace the case-study-seeded lookalike as the TAM discovery spine (`/tam-build` Case-Study-Anchored Discovery HARD RULE).
- Use the list workbench as the default operating layer for multi-source lists, so the operator watches the list fill live. The session does the scoring, dedupe, and evidence preservation with FNNL's own keyed tools via MCP and scripts, then pushes finished rows into the workbench table through its inbound webhook, never spending the workbench's own credits (zero-workbench-credit HARD RULE). If no workbench is locked, or the client's table and webhook are not set up yet, fall back to Claude Code native: the session builds the CSV directly and the plan says so. RevCode stays an optional manual workspace for the same work (no API, for its UI or local large-list engine). Every path produces the same canonical CSV as an export of the working list, so nothing downstream changes.
- Do not pick a source because it is easy if another public source proves campaign fit or target-geography fit better.
- Do not scrape a niche source at scale until a small sample passes `/icp-prompt-builder`.
- Do not enrich thousands of rows until the source sample shows at least 40% ICP fit.
- Do not reference a signal in copy unless the row has an `evidence_url` or a strong source note.
- Do not treat social engagement, job posts, reviews, or tech stack as buying intent by itself. It is a reason to research, not proof they want to buy.

## What To Do Next

Once the plan is written, run the selected source workflow. Then run:

1. `/icp-prompt-builder`
2. /email-waterfall
3. `/list-quality-scorecard`
4. `/campaign-copywriting`

Only then proceed to the upload path matching locked `run_state.sending_platform`.

## Related Skills

- `/ask-eric` - the live home of the Eric list-building doctrine this skill cites inline, including the five list-building methods and the sponsor-list quality rule. `eric-deliverability-doctrine.md` Part 2 carries his benchmark-before-you-pay method for choosing between source providers. Advisory only.

- `/lead-list-tech-stack-research` - tool-fit map that separates workflow layer, source signal, collection, contact enrichment, and QA
- `/icp-onboarding` - produces the profile, the hard ICP filters, and the capability boundary this skill reads
- `/offer-intelligence` - runs far earlier in the chain; its buyer-pain research feeds the offer that `/lead-magnet-brainstorm` then locks
- `/lead-magnet-brainstorm` - locks the front-end offer into `offer.lead_magnet`; this skill reads that locked offer and never writes it
- `/data-point-discovery` - runs earlier (kickoff Step 3.3); catalogs what the stack can actually obtain, which this skill's source path has to respect
- `/campaign-strategy` - produces the campaign ideas, and the selected campaign row this skill routes
- `/icp-prompt-builder` - qualifies source samples before scale
- /email-waterfall - fills and verifies email data
- `/list-quality-scorecard` - grades the final list before copy or upload
- Contact-database export path - use when a person database is truly the best source (whichever pack `/stack-setup` activated, otherwise the provider's own export)
- Maps or local-business extraction path - use when maps data is truly the best source (whichever pack `/stack-setup` activated, otherwise the provider's own export)
- Company-lookalike path - a company-similarity tool, from whichever pack `/stack-setup` activated, otherwise the vendor's own UI or API
- Domain-to-person path - whichever pack `/stack-setup` activated, otherwise the provider's own export
- LinkedIn or social engagement path - no skill ships for this capability, so collect it through the approved social-intent source named in the source plan
`````
