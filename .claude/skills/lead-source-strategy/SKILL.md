---
name: lead-source-strategy
description: Two-mode source-first router for cold email campaigns. Source-Signal Discovery Mode runs after /icp-onboarding and before /offer-intelligence so source evidence and market source reality shape offer creation. Lead Source Plan Mode runs after campaign selection and before any list source, scraper, database pull, contact enrichment, custom workflow, or enrichment spend.
---

# Lead Source Strategy
## Canonical Profile Root

All profiles/<business-slug> paths in this skill resolve under:

```text
<outbound>/profiles
```

Here `<outbound>` is the root of this skill library - resolve it to wherever the library is currently checked out (local Documents, OneDrive, or a git worktree); never hardcode an absolute path. Do not create client profiles under a `profiles/` folder at your current working directory.

This skill has two jobs:

1. Before offer selection, discover which public source signals expose real prospect pain.
2. After campaign selection, choose the final source path for list building.

It does not scrape, enrich, verify, write copy, upload, or lock an offer. Discovery mode writes signal intelligence and market source reality. Plan mode writes a source plan that proves the list source matches the selected campaign.

Defaulting to whichever contact database or maps scrape is easiest is weak thinking. Use a source when it is the best evidence for the signal. Otherwise, build from the source that actually proves fit.

In Lead Source Plan Mode, read `/lead-list-tech-stack-research` before choosing the source stack. That skill is the tool-fit map. This skill makes the decision.

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

Use **Source-Signal Discovery Mode** after `/icp-onboarding` and before `/offer-intelligence` for new clients, new campaigns, or any new front-end offer path. This mode helps the offer work start from observable market context instead of a generic ICP.

Keep the flow intact: ICP/capability boundary -> source-signal discovery -> offer intelligence -> lead magnet -> campaign strategy -> final source plan. Do not add a separate source-research phase. Put market and location source research inside Source-Signal Discovery, then let campaign strategy use it.

Use **Lead Source Plan Mode** after `/campaign-strategy` and after the user chooses the first campaign to launch.

Run Lead Source Plan Mode before any list-source action, including:

- account discovery
- contact database export
- local or maps extraction
- website, directory, job-board, event-page, marketplace, or custom scraping
- social-intent collection
- workflow build in RevCode, Clay, spreadsheets, scripts, APIs, or MCP tools
- domain-to-person enrichment
- paid source credits or enrichment spend

## Inputs

For both modes, read:

- `profiles/<business-slug>/client-profile.yaml`
- Client website URL, if available
- onboarding form responses or call notes, if available
- any source preferences or blocked sources in `client-profile.yaml`
- target geography fields from `client-profile.yaml`, including countries, states, regions, cities, and excluded markets

For Source-Signal Discovery Mode, also read any capability, proof, delivery, legal, or compliance constraints from the profile. If the client suggested a lead magnet, treat it as a hypothesis only.

For Lead Source Plan Mode, also read:

- `lead-list-tech-stack-research.md`
- `profiles/<business-slug>/campaign-strategy.md`
- selected campaign name and row
- `profiles/<business-slug>/source-signal-intelligence.md`, if present
- `profiles/<business-slug>/offer-intelligence.md`, if present
- `profiles/<business-slug>/lead-magnets.md`, if present

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

Do not chase a clever source the client cannot serve. Do not lock an offer just because a source looks interesting. Source-first means the source signal constrains the micro-offer; it does not replace market reasoning or delivery reality.

In discovery mode, choose source signals from observable pain and timing.

In plan mode, choose the source from the selected campaign signal, not from tool comfort.

Ask:

1. What exact signal makes this prospect relevant?
2. Where does that signal naturally live?
3. Does that source actually cover the target geography?
4. Are there country-specific directories, registries, associations, marketplaces, job boards, event pages, or public databases that beat a generic contact database?
5. Can we collect it at useful volume?
6. Can we reach the right person after collection?
7. Can we reference the signal without sounding fake, creepy, or overfit?
8. What source would miss these leads?
9. What offer would this source make believable?
10. What could fail if we overread the signal?

If the answer is "we only know titles and industries," a database pull may be fine. If the answer is "they appeared in a niche directory, joined a platform ecosystem, posted about a pain, sponsored an event, or show a public website pattern," a generic database pull is probably the lazy path.

If the target market is location-specific, do not recommend a source family until you have checked whether it has usable coverage there. "Scrape directories" is not a strategy if the directory barely covers Denmark. A Denmark-specific registry, association, event list, marketplace, or public database may beat every global tool in the folder.

## Tool Role Separation Rule

Every Lead Source Plan must separate the stack into five roles:

1. **Workflow layer:** **Claude Code native by default** — the running session combines sources, runs API calls, scores, dedupes, and prepares the final CSV directly. **RevCode is the preferred optional workspace** for the same work (no API, so manual/human-in-the-loop) — use it when you want its UI, shareable workflows, or local large-list engine; it yields an identical CSV (same canonical columns), so nothing downstream changes (full rule in `/lead-list-tech-stack-research`). Clay, spreadsheets, scripts, APIs, or MCP tools are also allowed when they fit better.
2. **Source-of-truth signal:** the public source where the campaign proof actually lives.
3. **Collection tool:** the best tool for collecting that signal, such as DiscoLike, GetLatka, Serper, Spider Cloud, Scrap.io, Apify, Trigify, a database, or a custom parser.
4. **Contact discovery + enrichment:** discover real named people from a contact database with a **current-employer field** (Clay `search-contacts` / A-Leads `advanced_search`, DiscoLike `generate-contacts`, or a people-DB — never `search-contacts` index mode, which fabricates names; ⛔ and **never from a LinkedIn/Google search via Serper + an AI title-picker**, banned 2026-07-17 because Google's cached snippets carry no employment-currency signal and yield retired/departed people — see `/email-waterfall`) so every row has a real first + last name **who still works there**; then, for rows with no email, the FINDER = **A-Leads `find_email` (find) + Deliverable.co (verify + catch-all) first (HARD RULE), BetterContact ONLY on the residue** (no email found, or `undeliverable`/`catch_all`/`risky`/`unknown`), with Prospeo/WizLeads/Blitz further fallback. If a row already has an email, it is **verified first with Deliverable.co** (verify + catch-all in one), not re-found — that ordering and the Deliverable.co verify routing are owned by `/email-waterfall`'s Verification Doctrine.
5. **QA and verification:** `/icp-prompt-builder`, /email-waterfall, and `/list-quality-scorecard`.

Do not collapse these roles into Prospeo because Prospeo has good contact data. Prospeo is usually a contact database or enrichment layer. It is the source only when title, company, technology, job-change, or Prospeo-native data is the real source of truth.

Default role choices:

- Claude Code native is the default workflow layer; RevCode is the preferred optional workspace for it (no API, so manual) — neither is the source.
- A contact database is the strongest contact layer available, never the default list source. The source-of-truth signal decides who belongs on the list; the contact layer only finds the people at those companies.
- For true lookalike or company-similarity discovery, use whatever fills `lead_data.company_discovery`. Some similarity tools also do per-company AI research, contact discovery, and ICP-fit validation. Before routing a job to one, read its capability map and current plan feature gates, because these features are commonly plan-gated: if `/stack-setup` activated a pack for it, that pack documents them; otherwise check the vendor's own docs.
- GetLatka is preferred when SaaS ARR, revenue stage, growth, category, or SaaS database coverage is the actual signal.
- Serper plus Spider Cloud or Apify wins when the signal lives on a public website, directory, job board, event page, marketplace, or search result.

## AI/API Routing

> **Research Routing — HARD RULE (Claude deep-research primary, enforced).** Read `run_state.research_routing`: if it is **unset**, default to **`claude_deep_research`** and proceed. The primary research brain is the Claude native `/deep-research` fan-out harness (multiple sub-agents research every needed category in parallel, fetch real sources, adversarially verify each claim, and synthesize a cited report). Do NOT stop to ask, and do NOT satisfy the primary pass with a bare inline WebSearch (that is the weak `claude_native` path, which is not the same thing as `claude_deep_research`). The operator can explicitly opt back to **`third_party_ai`** (the older Perplexity-led primary); switch to that only on an explicit opt-out. In `claude_deep_research` mode the primary pass MUST be an **actual `/deep-research` invocation** (native inline WebSearch/WebFetch, DiscoGen, or a complement engine do NOT satisfy it) — record `ai_research_provider = claude-deep-research` and append an `api-balance-ledger.md` line; a research step that finishes with **no `/deep-research` primary** is a **flagged violation** (run it, or get a fresh explicit OK to skip). **Wired check:** after the primary pass, run `node scripts/research/research_routing_check.mjs --skill lead-source-strategy --client <business-slug> --json` — a `violation:true` / exit 1 means no logged primary; do not declare this research step done until it passes. No third-party key is needed for the primary pass (it is the native harness); a missing `PERPLEXITY_API_KEY` is a credential **HARD-STOP** only if the operator explicitly chose `third_party_ai`. Full rule: `/ai-model-routing`.

The five tool roles above are data layers. AI/model routing is a parallel layer for Discovery mode's research, and it runs the single premium-by-default, non-redundant path in `/ai-model-routing` — there is no cheap/standard tier. The Claude native `/deep-research` fan-out harness runs the primary broad pass (web-grounded company/market research via parallel sub-agents, source fetch, adversarial verification, cited synthesis). Perplexity, OpenAI `o4-mini-deep-research`, and Grok are demoted to gap-fill + grounding helpers that fill ONLY the gaps the primary pass leaves (thin / technical / too-broad / unverified), never a duplicate broad pass (Perplexity for web-grounded gap-fill, Serper/Grok for raw URLs / X-social, `o4-mini-deep-research` default with `o3-deep-research` pinpoint; OpenAI 1-3 prompts/client); raw URL extraction → Spider Cloud; bulk synthesis / pain-extraction / pre-compressing raw dumps → DeepSeek. When references are too many, scale mode has the helpers EMIT ranked URLs → Spider Cloud scrapes → DeepSeek compresses → Claude Code synthesizes. When a campaign signal lives in buyer discussion (Reddit, review sites, forums, YouTube), collect it through the **VOC / Raw-Evidence pipeline** in `/ai-model-routing` (Grok → Perplexity Search/Serper for the exact discussion URLs → Spider Cloud to scrape; tag `source_class`), not a loose web search - and every source carries a `source_url`. See `ai-model-routing.md` for the full pipeline (Brief → `/deep-research` primary → Source Registry → Spider extract → VOC → DeepSeek → Claude Code synthesis → Perplexity/OpenAI gap-fill + validation → Packet → Copy → QA), env-var names, and the fallbacks used when a helper key (Perplexity or MiniMax) is absent. This skill produces evidence, not emails — do not route final copy here; that is `/campaign-copywriting` (Claude Code native, clean-packet sub-agent) from a clean packet. Keep the canonical CSV fields (`source, source_type, source_url, evidence_url, signal, fit_reason, source_confidence`) intact; the AI-routing columns in `lead-list-tech-stack-research.md` map onto them.

## Accepted Source Families

Use any public, legal, campaign-relevant source family that fits the signal:

- Workflow layers: Claude Code native by default (the session builds the CSV directly); RevCode as the preferred optional workspace (no API, so manual — for its UI or local large-list engine); Clay, spreadsheets, scripts, APIs, MCP tools, or manual QA for combining and scoring sources
- Contact databases and enrichment: the **email finder** finds first, the **email verifier** verifies every address including a separate catch-all signal, and the **waterfall enricher** runs on the residue ONLY. That ordering is the HARD RULE, not any particular brand. Resolve each role from `stack-contract.yaml` (`lead_data.contact_discovery`, `lead_data.contact_enrichment`, `lead_data.email_verification`); if a role is empty, stop and route to `/stack-setup`. **Whichever finder produces the email, the verifier of record verifies it**, and the residue it cannot clear (invalid, catch-all, risky, unknown) plus rows no finder closed go to the waterfall enricher to recover a new address, whose output is then re-verified by the same verifier. No source is exempt. Record the waterfall order in `lead_data.contact_enrichment.notes` and mirror it in `/email-waterfall`.
- Company discovery: the tool in `lead_data.company_discovery`, plus public company databases and official company registries (examples of the category: a lookalike engine, a firmographic database, a registry pull).
- Local business sources: Google Maps, Scrap.io, Apify Maps actors, Serper Maps or Places
- Search discovery: Serper, Spider Cloud search, Google operators, news, patents, scholar, shopping, images when relevant
- Website extraction: Spider Cloud, Apify, custom crawlers, public website pages
- Social intent: Trigify, competitor engagers, public LinkedIn activity, X, Reddit, YouTube, podcasts
- Public directories: associations, certification directories, partner directories, marketplaces, app stores, agency directories, vendor ecosystems
- Event sources: exhibitor lists, sponsor pages, speaker pages, public attendee pages, conference schedules
- Hiring sources: job boards, careers pages, LinkedIn Jobs, Indeed, niche job boards
- Tech-stack sources: whichever contact or company database in the contract exposes a technologies field, plus public site tags and a dedicated technographics service.

Do not treat this list as complete. If a human could find the signal publicly in 10 minutes, it can be considered.

## Mode 1: Source-Signal Discovery

Run this before `/offer-intelligence` on new-offer paths.

The goal is not to build the list yet. The goal is to find source-backed pain signals that can shape the offer, lead magnet, and later campaign strategy.

### Discovery Steps

1. Define the capability boundary:
   - what the client can actually deliver
   - proof points or case studies
   - legal and operational limits
   - hard ICP filters
   - any client-suggested offer, stored only as a hypothesis
2. Define the market boundary:
   - target countries, states, regions, cities, and excluded markets
   - language requirements, if relevant
   - whether the market is local, national, regional, or global
3. Build a Market Source Landscape before judging signals:
   - public sources that exist in the target geography
   - weak or missing sources in that geography
   - country-specific directories, registries, associations, marketplaces, job boards, event pages, public databases, and platform ecosystems
   - possible blue-ocean sources a generic contact database would miss
   - whether Prospeo, Google Maps, social scraping, or custom scraping has real coverage for that market
4. Identify 5-8 source families where the ICP's pain may be visible.
5. Pull a small public sample or evidence examples for each promising source family. Do not spend enrichment credits or scrape at scale.
6. Score each signal on:
   - pain proximity
   - timing
   - specificity
   - evidence URL quality
   - target geography fit
   - source availability risk
   - expected volume
   - buyer reachability
   - creep risk
   - offer-fit risk
7. Rank the top source signals.
8. Propose possible micro-offers only as hypotheses for `/offer-intelligence` and `/lead-magnet-brainstorm`.

### Source-Signal Discovery Output

Write:

```text
profiles/<business-slug>/source-signal-intelligence.md
```

Use this structure:

```markdown
# Source Signal Intelligence - <Client>

## Capability Boundary
- What the client can deliver:
- Proof available:
- Operational limits:
- Legal or compliance limits:
- Hard ICP filters:

## Market Source Landscape
- Target geography:
- Out-of-scope geography:
- Source reality summary:
- Strong market-specific sources:
- Weak or missing sources:
- Blue-ocean source candidates:
- Contact database fit:
- Maps/local data fit:
- Directory/registry fit:
- Social or event-source fit:
- Source risks:

## Ranked Source Signals
| Rank | Source family | Exact observable signal | Target geography fit | Evidence examples | Why-now hypothesis | Likely pain | Possible micro-offers | Risks |
|---:|---|---|---|---|---|---|---|---|
| 1 |  |  |  |  |  |  |  |  |

## Recommended Source-Backed Direction For /offer-intelligence
- Primary source signal:
- Why it should shape the offer:
- Source-backed pain language:
- Signals to avoid:
- Micro-offers to test as hypotheses:
```

Do not write to `offer.lead_magnet`. Do not create a second locked offer field. This file is evidence for offer work, not a decision. It is also consumed later by `/data-point-discovery` (kickoff Step 3.4, after the offer locks) as the seed for the exhaustive per-client data-point catalog.

## Mode 2: Lead Source Plan

Use this mode only after `/campaign-strategy` and after the operator selects one campaign to launch.

### Source Path Selection

Use this routing logic:

This table is a starting map, not a shortcut. Apply the Market Source Landscape and the selected campaign row before choosing the final source. A source that is strong in one country can be useless in another.

Start every plan with Claude Code native as the workflow layer (RevCode is the preferred optional workspace if you want it) unless another operator path is stronger. Then pick the source-of-truth signal and collection tool.

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
| Event sponsorship / exhibiting | Serper to find the event, Spider Cloud to crawl its sponsor / exhibitor / speaker pages, DeepSeek to extract the roster (the ladder in `/lead-list-tech-stack-research`; a sponsor page is plain HTML, so it never reaches a paid scraper) | Claude Code native to normalize the roster and join `co_event_*` onto companies; contact enrichment after the ICP pass | Scraping the famous shows. See the Quality Rule below |
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

- **Workflow layer:** <Claude Code native by default; RevCode or equivalent if used>
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

- **Workflow layer:** <Claude Code native by default; RevCode or equivalent if used — orchestrates all steps below>
- **Company cleanup:** <Dedup, ICP filter, suppression>
- **Contact finding:** <the contact-discovery tool from the stack contract, a sales-navigator-style export, or manual lookup>
- **Email finding:** <Waterfall sequence>
- **Verification:** <MillionVerifier or equivalent>
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
- **Event sponsorship is three signals in one artifact, and the middle one is the valuable one.** A company that paid to sponsor or exhibit at a show has disclosed, voluntarily and at real cost: (1) **budget** (they paid), (2) **who they sell to** (they paid to stand in a room full of one specific buyer), and (3) a **dated why-now** (the event has a date). Number 2 is the reason to bother. The `sold_to` axis is the highest-leverage message-differential cut we have (`/campaign-strategy`, `sold-to-axis-doctrine`), and today it is *derived* by classifying website text at `med` coverage. A sponsor roster is a near-100%-precision `sold_to` oracle instead: a company that paid $40k to stand in a GTM room has stated who it sells to more reliably than any homepage classifier can infer it. Treat a sponsor list as ground truth for `sells_to_*`, not just as another list to scrape.
- **Sponsor lists: niche and regional shows only, never the famous ones (HARD).** Eric's own list-building doctrine praises custom scraping as "hidden gold, less competition" and then his demo pulls Dreamforce and SaaStr, which are the single most-scraped sponsor lists in B2B software. Those inboxes are the most-hit in the market, so the famous shows invert the very advantage the source family exists for. A 200-sponsor roster from a regional or vertical show is the play. If the event has its own Wikipedia page, assume every competitor already mailed that list this quarter and pick a different show.
- **Events enter as a company signal, not as the TAM spine.** Sponsorship joins onto companies as `co_event_*` per `/tam-build`'s Layer 1d. Building a list whose source of truth *is* the event roster is this skill's source-signal-first motion and is fine; what it must not do is displace the case-study-seeded lookalike as the TAM discovery spine (`/tam-build` Case-Study-Anchored Discovery HARD RULE).
- Use Claude Code native as the default operating layer for multi-source lists, scoring, dedupe, evidence preservation, and final export preparation — the session builds the CSV directly via MCP + scripts. RevCode is the preferred optional workspace for the same work (no API, so manual/human-in-the-loop — reach for it for its UI or local large-list engine). Either path produces an identical CSV, so nothing downstream changes.
- Do not pick a source because it is easy if another public source proves campaign fit or target-geography fit better.
- Do not scrape a niche source at scale until a small sample passes `/icp-prompt-builder`.
- Do not enrich thousands of rows until the source sample shows at least 40% ICP fit.
- Do not reference a signal in copy unless the row has an `evidence_url` or a strong source note.
- Do not treat social engagement, job posts, reviews, or tech stack as buying intent by itself. It is a reason to research, not proof they want to buy.

## What To Do Next

After Source-Signal Discovery Mode, run `/offer-intelligence` discovery mode. It should read `profiles/<business-slug>/source-signal-intelligence.md` before `/lead-magnet-brainstorm` locks a front-end offer.

After Lead Source Plan Mode, run the selected source workflow. Then run:

1. `/icp-prompt-builder`
2. /email-waterfall
3. `/list-quality-scorecard`
4. `/campaign-copywriting`

Only then proceed to the upload path matching locked `run_state.sending_platform`.

## Related Skills

- `/lead-list-tech-stack-research` - tool-fit map that separates workflow layer, source signal, collection, contact enrichment, and QA
- `/icp-onboarding` - produces the profile and capability boundary this skill reads in discovery mode
- `/offer-intelligence` - consumes `source-signal-intelligence.md` before lead magnet selection
- `/data-point-discovery` - later consumes `source-signal-intelligence.md` (kickoff Step 3.4, after offer lock) to seed the per-client data-point catalog
- `/lead-magnet-brainstorm` - uses source-backed pain signals to score micro-offers
- `/campaign-strategy` - produces the campaign ideas this skill routes in plan mode
- `/icp-prompt-builder` - qualifies source samples before scale
- /email-waterfall - fills and verifies email data
- `/list-quality-scorecard` - grades the final list before copy or upload
- Contact-database export path - use when a person database is truly the best source (whichever pack `/stack-setup` activated, otherwise the provider's own export)
- Maps or local-business extraction path - use when maps data is truly the best source (whichever pack `/stack-setup` activated, otherwise the provider's own export)
- Company-lookalike path - a company-similarity tool, from whichever pack `/stack-setup` activated, otherwise the vendor's own UI or API
- Domain-to-person path - whichever pack `/stack-setup` activated, otherwise the provider's own export
- LinkedIn or social engagement path - no skill ships for this capability, so collect it through the approved social-intent source named in the source plan

