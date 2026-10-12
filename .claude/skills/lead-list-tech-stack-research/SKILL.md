---
name: lead-list-tech-stack-research
description: Source-tool fit map for cold outbound list building, and the obtainability backbone /data-point-discovery checks data points against. Use before /lead-source-strategy picks a source path, scraper, contact database or enrichment stack. Each slot's tool comes from outbound/stack-contract.yaml, never this file.
---

**From the former description:** It separates workflow layer, source-of-truth signal, collection tool, contact enrichment, and QA so the contact layer is never mistaken for the source-of-truth signal, and it catalogs candidate tools per capability slot. The tool actually chosen for each slot is read from the workspace stack contract at outbound/stack-contract.yaml, never from this file; any catalogued tool outside its `approved_stack` is OUT OF STACK, needs operator approval.

# Lead List Tech Stack Research

Use this as the tool-selection reference for `/lead-source-strategy`. It is not a mandate to use every tool. A weak lead plan starts with "what can Prospeo export?" A strong lead plan starts with "where does the campaign signal naturally live, and what tool is best at collecting that signal?"

## Compact Tool-Fit Map

Each row names the capability **slot** that owns the need. The tool that actually fills a slot is read from the workspace stack contract at `outbound/stack-contract.yaml`. The tools in the second column are examples of what *could* fill the slot. "None chosen for FNNL" labels in this file mean the example is not a routing instruction; some examples happen to be FNNL tools, and the contract says which.

> **Approved-stack rule (operator directive 2026-09-22).** FNNL's tools are the closed list in the `approved_stack` block of `outbound/stack-contract.yaml`. Meet every need from that list first, and check each listed tool's full surface (its MCP tool list and API docs) before declaring a gap. Any other tool named in this file is a catalogue example: raise it only as "OUT OF STACK, needs operator approval", never as the path, and never credential or spend on it until the operator approves it by name and it is recorded in `approved_stack.approved_exceptions`. A slot at status `held` declares nothing, exactly like `not_chosen`.

| Need | Slot, and candidate tools (illustrative only, none chosen for FNNL) | Role in stack | Weak move |
|---|---|---|---|
| Combine sources, score rows, dedupe, run APIs, prepare final CSV | `lead_data.list_workbench` (the list workbench) by default; the session itself natively as fallback; optionally a spreadsheet-style workspace (e.g. RevCode) | Workflow layer. The working list lives in a workbench table the operator watches fill live: the session sources and enriches with FNNL's own API-keyed tools and pushes finished rows in through the table's inbound webhook, spending zero workbench credits. If no workbench table is ready, the Claude Code session builds the CSV directly and says so | Treating the workspace as the source, or expecting the automated flow to drive a workspace that has no API; spending the workbench's own credits (its built-in search, enrichments, or AI columns) instead of FNNL's API keys |
| The company universe for the TAM (the default; operator decision 2026-09-28) | `company_discovery`, the filter build: count and filter first in the `layers.company_discovery` order of `outbound/reference/provider-routing.yaml` (the company search tool's 200 to 300 company sample through its enum pre-step for industries, locations and technologies, and the keyword mining that refines the search, then GetLeads `count_contacts` (§16) and the full company export on the refined search, rolled up to one row per company domain; operator directive 2026-10-06, see `standing-rulings.md` `discovery-flow`) | Account discovery (the filter build, `/tam-build` filter-first discovery); record `run_state.discovery_route` | Carrying industry as a provider industry-taxonomy include instead of the keyword stack; putting a reveal or lookup-by-person call in the discovery order |
| True lookalike or company-similarity discovery | `company_discovery`, similarity mode (in stack, the tool `layers.company_discovery.lookalike` in `provider-routing.yaml` names, still untested; DiscoLike is OUT OF STACK, needs operator approval), seeded from the 5 to 10 companies that best fit the locked offer | Account discovery, the exception route: only when the offer needs a lookalike AND the TAM is small or hard to build by filters | Running it on a big TAM that filters can describe; using a SaaS database just because the target is SaaS |
| SaaS revenue, ARR, category, growth, or funding-stage fit | `company_discovery`, SaaS-specific (e.g. GetLatka, OUT OF STACK, needs operator approval; in stack, GetLeads funding filters and `list_funding_signals`, §16) | SaaS account database. If the chosen tool exposes no API, it is UI-only and cannot be scripted from here | Using it for generic lookalikes when similarity is the real signal |
| Title, person, verified email, broad company filters | `contact_discovery`, in the `layers.people_discovery` order of `provider-routing.yaml` (read it there; GetLeads at the companies that passed fit, AI Ark via `aiark_people.mjs` in parallel only if fast; operator directive 2026-10-06, see `standing-rulings.md` `discovery-flow` and `ai-ark-people-discovery.md` Step 3) | Contact database | Calling it the source when the signal came from jobs, directories, events, or lookalikes |
| Company + contact data, email find, tech filters | One vendor spanning `company_discovery` + `contact_discovery` + `contact_enrichment` (the stack contract says which tool does; every address it finds is still checked by the `email_verification` tool) | Combined company/contact data and email find | Trusting one provider as complete, or skipping the verifier because the finder self-checks |
| Highest-find-rate work email + mobile, with a built-in self-check | `contact_enrichment`, waterfall type (e.g. BetterContact, OUT OF STACK, needs operator approval; FNNL's email order is `layers.email` in `provider-routing.yaml`, blank rows only, a catch-all ending the walk and shipping labelled `catch_all` per `standing-rulings.md` `catch-all`) | Waterfall contact enrichment (Layer 2, per-contact). Where the contract records a waterfall order in `lead_data.contact_enrichment.notes`, a multi-provider waterfall is normally the fallback that runs after the primary finder, and its output is still re-verified by the `email_verification` tool | Running it across the whole TAM before scoring and campaign selection, instead of on the campaign-confirmed contacts (in the first wave those are the whole scored, eligible TAM; Aaron process alignment, operator directive 2026-09-22); treating its own 4-layer self-check as the send-gate (the configured verifier re-verifies every finder's output, no source exempt); using it to "verify" an email a row already had |
| Sales Navigator exports or LinkedIn-first person lists | `contact_discovery`, LinkedIn-first (e.g. WizLeads, OUT OF STACK, needs operator approval) | LinkedIn/Sales Nav extraction and verification | Confusing LinkedIn filters with offer logic |
| Local SMB discovery | `company_discovery`, local (in stack: the company search tool's geo and keyword filters; Apify Maps, Serper Places and Scrap.io are OUT OF STACK, needs operator approval) | Local business source | Forcing local businesses into LinkedIn or Prospeo |
| Public websites, directories, event pages, job boards, marketplaces | `search` + `crawl` (in FNNL the harness's WebSearch and WebFetch plus sub-agents, or a custom parser; Serper, Spider Cloud and Apify are OUT OF STACK, needs operator approval) | Source discovery and extraction | Ignoring the source because it is harder than a database pull |
| Website text, pricing pages, public product signals | `crawl` (in FNNL the harness's WebFetch, with WebSearch to find the pages; Spider Cloud and DiscoLike are OUT OF STACK, needs operator approval) | Evidence extraction and account scoring | Referencing a weak or unverified page signal in copy |
| Social or competitor intent | `intent_signals` (e.g. GetLeads engager monitoring (§16, paid from its wallet cash), competitor-engagers; Trigify is OUT OF STACK, needs operator approval) | Timing and context signal. This slot is genuinely optional: if FNNL is not buying intent data it is set to `n/a` and stops being offered as a path | Treating a like as buying intent |
| Known domains to people | `contact_discovery` in domain mode, in the `layers.people_discovery` order (GetLeads, AI Ark in parallel only if fast; see `ai-ark-people-discovery.md` Step 3), then the `layers.email` finders for blank rows | Domain-to-person enrichment | Buying a fresh list before enriching the known account set |
| Sizing a filter before you spend on it | A `contact_discovery` tool with an exact count that reveals no record (e.g. GetLeads `count_contacts`, §16; it runs on the GetLeads plan and its fair use, so read the meter rather than assuming it is free) | Sizing, and a department-size proxy with no per-contact reveal when scoped by `domains[]` + `job_functions[]` | Paying a per-record enricher to answer a question an exact count already answers |
| Funding rounds or M&A as a why-now trigger | `intent_signals` with first-class funding/acquisition feeds (e.g. GetLeads `list_funding_signals`, `list_acquisition_signals` (§16)) | Timing signal. Few tools return these as a first-class feed, so check what the slot's tool actually covers before assuming it is handled | Treating "they raised" as buying intent with no offer match |
| LinkedIn engagers on a profile, or a company page's followers | `intent_signals` (e.g. GetLeads `add_monitored_profile` / `lookup_company_linkedin_followers` (§16)) | Paid social scrape. Where a vendor splits plan credits from a **prepaid wallet**, scrapes bill to the wallet, not the credits | Confusing a vendor's two balances and reporting "out of credits" when only the wallet is empty (§16) |
| Cheap bulk extraction from Crunchbase, StoreLeads, BuiltWith, and LinkedIn (company followers / public group members) on a pay-as-you-go budget | `crawl`, bulk/low-cost (e.g. LeadsFriday, OUT OF STACK, needs operator approval) | Low-cost extraction layer. Treat it as extraction; whether its own waterfall/verification features get used is a separate decision belonging to the `contact_enrichment` and `email_verification` slots | Treating its scraped database dumps as a verified source-of-truth signal, or skipping ICP/source logic just because the data is cheap |

> **An MCP connector visible in a session is not a chosen tool.** A connector can appear in the tool list while being unauthenticated, unpaid, or simply not the tool FNNL picked. Apollo (Apollo.io) is the usual example, but the rule is general. Routing comes from the stack contract, never from what happens to be on screen. If the slot a need maps to is filled by something else, do not propose or route to the visible connector, and if the slot is empty, stop and route the operator to `/stack-setup` rather than substituting whatever is authenticated today.

> **There is no declared stack in this file.** Which tool fills each capability slot (`company_discovery`, `contact_discovery`, `contact_enrichment`, `email_verification`, `intent_signals`) is sourced from the workspace stack contract at `outbound/stack-contract.yaml`, whose `approved_stack` block is the closed list of FNNL's tools. Two kinds of slot no longer need a vendor at all (no-AI-API rule, operator directive 2026-09-22): `search` and `crawl` are the harness's own WebSearch and WebFetch, and the former AI slots (`research_provider` / `bulk_classification` / `copywriting`) are retired, because research, classification, extraction and copy all run on Claude Code itself (the `/deep-research` harness, sub-agents, and the main session). A third-party search API or crawler named below is a catalogue example like any other tool. Nothing in this file asserts what FNNL has keyed, callable, or verified: the sections below catalog the market, they do not inventory the account. If a slot is unset, stop and route the operator to `/stack-setup` rather than substituting a vendor. Two rules when reading the contract: a slot whose status is `chosen` has only been recorded, not proven (only `live` means a real call against FNNL's own account has succeeded), and the live per-field provider **order** lives in `outbound/reference/provider-routing.yaml` (`layers.*`), under the contract's waterfall in `lead_data.contact_enrichment.notes`, mirrored into `/email-waterfall`. Read the contract fresh rather than trusting a remembered list. A stale stack list is exactly how this file goes wrong downstream, because `/data-point-discovery` cross-references every candidate data point against it.

> **Capability-gap analysis depends on which tools get chosen, so run it against the filled slots, not against this catalog.** Before concluding a data point is unobtainable, check what the contract's tools actually cover. Two gaps persist across most common stacks and are worth knowing in advance:
> - **Search-time filtering versus post-list enrichment is the distinction that matters.** A tool earns a place by filtering at *search* time, narrowing the universe **before** the list is built, rather than enriching a list you already hold (Prospeo is the usual example of a search-time filterer). Some data points have a cheap post-list path and no search-time path at all: **department-level headcount growth rate** (a per-record growth enricher such as DiscoLike `growth-metrics` runs on a list you already have, so it can never act as a discovery gate) and the **sold-to** axis (derivable post-list for free, so it can never surface a company that does not state its end customer publicly). If the chosen `contact_discovery` or `company_discovery` tool has no search-time filter for these, treat them as post-list scoring fields, not targeting filters. Some tools close part of this cheaply: an exact-count endpoint (e.g. GetLeads `count_contacts`, §16, on its plan meter) filters on department (`job_functions`), founded year, funding, revenue, and technologies at count time, with no record revealed.
> - **A docs-search MCP server is not a data provider.** Some connectors only search a vendor's public website and cannot return a contact or a company, so any line that routes to one for contact or company data is a bug regardless of what the contract says.

> **Filter-first discovery and the tool-balance guard (operator decisions 2026-09-28).** Company discovery counts and filters the universe first, in the `layers.company_discovery` order of `outbound/reference/provider-routing.yaml`, and records `run_state.discovery_route`; a lookalike is the exception route (`/tam-build`). Reveal and lookup-by-person calls never sit in the discovery order. The people, email and backfill orders are in the same file: read them there, never restate them from this catalog. A tool that is out of balance, down or switched off stops the step and asks the operator (`/tool-balance-guard`). Never substitute another tool, never reorder, never propose the list workbench's own credits, and never skip a rung unless the operator approved it (`outbound/scripts/list_waterfall.py plan --skip-provider <p> --skip-reason <text> --operator-approved-skip`).

> **Signal-driven acquisition (the eight timing/context signals):** for job change, department headcount, headcount growth, founded year, ads intelligence, job-change detection, jobs/JD content, and profile/work-history, the per-signal slices, copy angles, and full with/without-tool acquisition recipes live in `signal-strategy-playbook.md` (slices → `/campaign-strategy` Signal-Driven Slice Library; copy → `/campaign-copywriting` Signal Angle Library; data points → `/data-point-discovery`). That playbook names specific premium tools as the primary path for several signals (Prospeo search-time filters, LeadMagic endpoints, §15 below). Read those as illustrative, not as configuration: check the matching slot in the stack contract first, and where the slot's tool covers the signal more cheaply, prefer it. Several signals the playbook calls premium-only do have a cheap path in some tools, for example department headcount and founded year as free search-time count filters, plus funding and acquisition feeds the playbook does not cover at all. Treat any "only tool X can do this" claim in the playbook as a claim to re-test against the chosen stack, not a standing fact.

> **Sold-to axis (who a company sells to) is a FREE on-disk classification, not a new scrape.** The `sold_to` group (`sells_to_vertical`, `sells_to_customer_size`, `sells_to_department`, `sells_to_motion`) is `fill_method = derived`: `/tam-build` classifies it with Claude Code sub-agents in the same pass that scores `fit_status`, from text the `company_discovery` and `contact_discovery` tools already returned (typically a company description, keywords, and business-model field) plus the free homepage `extract-website-text`. No per-company credit, no new tool run. Per the Collection Routing Priority ladder below, this routes to the cheapest capable tool by default: the inputs are already captured, so it costs nothing beyond the classify pass, so do **not** route it to a paid scraper. Coverage is honestly `med` (many B2B firms publish "industries we serve" pages or vertical case studies; some state their end customer only implicitly). Native search-time sold-to filters (who a company sells to, customer size, sold-into department) exist in some premium tools, Prospeo v2 among them; treat that as a shortcut worth considering only if such a tool is what `contact_discovery` is actually locked to, never as an assumed capability. Slices → `/campaign-strategy`; data points → `/data-point-discovery`.

## Collection Routing Priority: cheapest capable tool (minimize paid scrapers)

When more than one tool can collect a signal, route to the **cheapest tool that actually returns it**. The light layer (the `crawl` and `search` roles, which in FNNL are the harness's WebFetch and WebSearch, plus Claude Code sub-agent extraction) plus free public data does most of the work; a paid scraper is a last resort, only when nothing lighter can get the field. This ladder is the default for `/data-point-discovery` `source_tool` assignment, `/tam-build` Layer 1b enrich + Layer 1c workflow-layer handoff, and any list-build collection step.

1. **Already-paid spine first.** For lists built on the chosen `company_discovery` / `contact_discovery` spine, take any field those tools or their native enrichers return before fetching it elsewhere, because it is already paid for. (Typical coverage to check for: a company-search endpoint returning firmographics, sales-motion signals, tech and hiring; a contact endpoint returning rows by title or by domain; a similarity tool returning business profile, growth metrics, and appended data.) **Then the gap-fill provider for the still-blank cells, never as the spine.** That is the exhaust-then-gap-fill ordering: run the primary across the whole survivor set first, then route only the still-blank cells onward, in the `provider-routing.yaml` order for that field (under `lead_data.contact_enrichment.notes` in the stack contract). A gap-filler's credits are usually already paid too, and where a provider offers an **exact count that reveals no record** (e.g. GetLeads `count_contacts`, on its plan meter), size any pull with it before spending a credit on search or export (§16). A rung out of balance stops and asks (`/tool-balance-guard`); it is never skipped for the next one.
2. **Free public / official data.** Government, regulator, and official directory datasets (e.g. CMS `data.cms.gov`, NCQA recognition directory, SEC EDGAR, state licensing boards). Zero cost, authoritative, always first for any regulated/official fact.
3. **The `crawl` role** (in FNNL, the harness's WebFetch; a scripted crawler such as Spider Cloud is an OUT OF STACK, needs operator approval catalogue example): the default for ANY website, article, careers/ATS, or HTML page. Where the crawler exposes these settings, crawl `request:'http'` **proxy-off** first (fast, ~0.5s); escalate to `'chrome'` (JS render) only when http returns 0 pages, and turn the proxy on only for a confirmed bot wall. Per-page cheap. **Throughput is concurrency-bound, not per-site: see the fast-crawl settings in §7.**
4. **The `search` role** (in FNNL, the harness's WebSearch; a search API such as Serper is an OUT OF STACK, needs operator approval catalogue example): Google Search / News / **Places** to find pages, news/timing signals, and Google ratings. A search API's **Places** endpoint is the light substitute for a paid Maps scraper (rating + review count). ≈\$0.001–0.003/query.
5. **Claude Code sub-agent extraction** (this rung was "a cheap AI tool" until the no-AI-API rule, operator directive 2026-09-22): Claude Code sub-agents fanned out over disjoint batches per `/personalization-subagent-pattern` turn the scraped/searched text into the structured value, with the main session handling the nuanced cases (per `/ai-model-routing`). No AI model on any API key. JSON-only, blank-when-unsupported.
6. **Paid scrapers: OUT OF STACK, needs operator approval** (e.g. Apify, Scrap.io; none is in FNNL's approved stack). Raise one only when no stack tool obtains the field, and spend nothing on it until the operator approves it by name. Genuine scraper-only cases: Google-Maps **review text** (per-review sentiment), ad-library / running-ads, some social scrapers. Gate every paid-scraper run through `/api-cost-governance`; if even the paid tool isn't available, **leave the field blank** (a blank is honest).

## Layer Order Pattern (the order of the layers, not a declared stack)

For most source-first campaigns, use this order. The order is fixed; which tool fills each layer is not.

1. **Workflow layer** (contract slot `lead_data.list_workbench`, locked per client as `run_state.list_workbench`): the list workbench by default. The working list lives in a workbench table the operator watches fill live: the running Claude Code session sources and enriches with FNNL's own API-keyed tools and pushes finished rows in through the table's inbound webhook, and it never spends the workbench's own credits (zero-workbench-credit HARD RULE, CLAUDE.md section 7). If no workbench table is ready, the session combines sources, scores, dedupes, and prepares the final CSV directly via MCP tools plus scripts, and says so. A spreadsheet-style workspace (illustrative only, none chosen for FNNL: RevCode) is the optional alternative for the same work. Reach for one when you want a spreadsheet UI, saved or shareable workflows, or a local no-row-ceiling engine. A workspace with **no API** is a manual, human-in-the-loop tool, so the automated flow must never depend on it. The choice is safe either way because the contract between skills is the CSV plus canonical columns plus data dictionary, never a workspace artifact, so both paths produce an identical downstream file and nothing else in the flow changes. Caveat for a *large* list built natively: Python is unavailable in this Claude Code env (see `/coldoutbound-gotchas`), so process via a Node script (deterministic steps) or Claude Code sub-agents over disjoint batches (per `/personalization-subagent-pattern`) rather than reading 100K rows into context, or run that heavy step in a workspace whose local engine handles 100K+ rows directly.
2. **Source-of-truth signal:** the public place where the campaign proof actually lives.
3. **Collection tool:** whatever fills `company_discovery`, `search`, or `crawl`, or a custom parser.
4. **Contact enrichment:** people in the `layers.people_discovery` order and emails in the `layers.email` order of `outbound/reference/provider-routing.yaml` (the first rung exhausted across the whole survivor set, then the next rung on still-blank cells only), and every result checked by the `email_verification` tool; a catch-all ends that person's walk and ships labelled `catch_all` (operator directive 2026-10-06, see `standing-rulings.md` `catch-all`). The file sits under the contract's waterfall (`lead_data.contact_enrichment.notes`), mirrored into `/email-waterfall`. There is no default in this skill: an unset slot means stop and route the operator to `/stack-setup`, and a rung out of balance, down or switched off stops and asks (`/tool-balance-guard`).
5. **QA and verification:** `/icp-prompt-builder`, `/email-waterfall`, `/list-quality-scorecard`.

Do not collapse these layers into one vendor unless one vendor truly owns the source signal and the contact path.

## TAM Build: Layer 1 (cheap, up front) vs Layer 2 (paid, per slice)

When building the whole TAM up front (see `/tam-build`), split the stack by what it costs. Layer 1 is company-level and flat/per-page cheap, so it is affordable across the ENTIRE TAM. Layer 2 is per-contact-credit and only runs on the slice a campaign actually sends to.

**Layer 1: company-level, build across the whole TAM up front (cheap):**

- Account discovery (filter-first, `/tam-build`, operator decision 2026-09-28; overrides the old lookalike-spine rule): a filter build by default in the `layers.company_discovery` order of `provider-routing.yaml` (the company search tool's sample through its enum pre-step and the keyword mining that refines the search, then GetLeads `count_contacts` and the full company export on it; operator directive 2026-10-06, see `standing-rulings.md` `discovery-flow`), with industry carried as the keyword stack and `run_state.discovery_route` recorded. A lookalike seeded from 5 to 10 offer-fit companies runs only when the offer needs a lookalike AND the TAM is small or hard to build by filters. Reveal and lookup-by-person calls never sit in the discovery order. Augment/extend only: `search` (coverage) and Claude web research. A local-business scraper or a SaaS-revenue database is OUT OF STACK, needs operator approval (the maps integration pack ships inert in `_vendor-library/` until `/stack-setup` activates it)
- Firmographics: the discovery tool itself, or a similarity/firmographic enricher
- Web-crawl signals (sales-motion CTAs, pricing, proof / case studies, tech / vendor, hiring, security): the `crawl` tool (plus `search` to find the pages)
- Demand signal (running Meta / Google ads): an ad-library / transparency scraper (OUT OF STACK, needs operator approval; e.g. Apify Actors)
- Org-structure depth (sales-leader-vs-IC, CRO / VP Sales / CMO present): an **exact-count endpoint** on the `contact_discovery` tool, scoped by `domains[]` + `job_functions[]` / `seniority[]` / `personas[]`. Where the tool returns an exact count without revealing a record (e.g. GetLeads `count_contacts`, §16, on its plan meter), it is a true company-level aggregate with no per-contact reveal, and a `where_sql` predicate can reach org role-count fields directly (e.g. `MARKETING_ROLE_COUNT_ORG >= 5`). If the slot's tool instead charges per record for this, it is a Layer 2 cost and does not belong here.
- Normalize / crunch: Claude Code sub-agents over disjoint batches (per `/personalization-subagent-pattern`); process / dedupe / score: the workflow layer (the list workbench by default, `run_state.list_workbench`, with rows pushed in by its inbound webhook at zero workbench credits; the session natively as fallback, or a workspace with a local no-row-ceiling engine on large lists)

**Layer 2: per-contact, defer to the live campaign slice (per-credit, expensive at TAM scale):**

- Contact DISCOVERY (real named people: first+last+title+LinkedIn; the discovery itself, with no email reveal, runs up front across the whole qualified TAM in `/tam-build` Layer 1d, because `full_enriched` means mapped, fit-scored and contacts discovered; signal columns optional): the people search runs in GetLeads at the companies that passed company fit, with AI Ark (`aiark_people.mjs`) in parallel only if fast, deduped by LinkedIn slug then email, never as a gap-fill rung (operator directive 2026-10-06, see `standing-rulings.md` `discovery-flow` and `ai-ark-people-discovery.md` Step 3). The order is `layers.people_discovery` in `provider-routing.yaml`; GetLeads `count_contacts` stays the exact size check, and a lookup-by-person or decision-maker reveal never runs at discovery. **Never use a contact-index / `has_email` mode that returns the company email *pattern* rather than a real person for a sendable list**: pattern guesses fabricate names and bounce (one similarity vendor's version of this trap is documented in its integration pack, which ships inert in `_vendor-library/` until `/stack-setup` activates it). ⛔ **And NEVER discover contacts from a LinkedIn/Google search: a `site:linkedin.com/in` query plus an AI title-picker is BANNED.** Google's cached snippets give the AI **no employment-currency signal**, so it returns retired/departed people whose rows still pass every downstream gate. Contacts come only from a source with a **current-employer field**. (This does not touch the sanctioned search-plus-AI *backfill* of a LinkedIn URL for someone you already have.) Full rule: `/email-waterfall`.
- Work email / mobile **FINDER** (when a real-named row has NO email): the finders in the `layers.email` order of `provider-routing.yaml` (GetLeads by LinkedIn URL, then AI Ark on what GetLeads did not close, then Prospeo on what AI Ark did not close, Giggal after each; operator directive 2026-10-06, see `standing-rulings.md` `discovery-flow`), blank rows only, each result checked by the verifier; a multi-provider waterfall (e.g. BetterContact) is OUT OF STACK, needs operator approval. The order is the file's, not a preference re-decided per run, and a rung out of balance stops and asks (`/tool-balance-guard`). GetLeads needs the person's LinkedIn URL; AI Ark and Prospeo need first+last+domain. Where a people row already carries an email, it is verified first, before any finder is paid. (Per-tool routing detail in `/email-waterfall`.)
- Email **VERIFICATION + catch-all** (when a row ALREADY has an email: verify-first, don't pay a finder to re-discover it): the `email_verification` tool. Prefer a **two-in-one** verifier whose single call returns both a deliverability status (deliverable/undeliverable/risky/unknown) AND a catch-all flag, covering deliverability AND catch-all in one pass, so no separate catch-all tool is needed. A verifier that collapses catch-all into valid or invalid will quietly inflate bounce rate. **Every finder's output is re-verified through the `email_verification` tool before sending: no source is exempt, and a finder's own internal self-check is a provider signal, not the send-gate.** The verifier of record is the `email_verification` tool in the stack contract (`outbound/scripts/giggal_verify.mjs`); §14 is an OUT OF STACK, needs operator approval catalogue note. Routing owned by `/email-waterfall`'s Verification Doctrine.

Rule: build Layer 1 for the whole TAM; spend Layer 2 only on the contacts a campaign has confirmed it sends to. In the first wave that is the whole scored, eligible TAM, revealed and verified in P1 to P5 order, with the standing \$100 run budget still stopping and asking (Aaron process alignment, operator directive 2026-09-22). Never run per-contact reveal / verification across the whole TAM up front, before scoring and campaign selection: that is the expensive move the "right order" avoids. **Within Layer 2, verify any existing email FIRST (email + catch-all) before paying a finder to discover a new one. Finding when you already have a verifiable email double-pays.** Preview both layers through `/api-cost-governance` before spending.

# Lead List Ideas From The Candidate Tool Catalog

Research date: May 26, 2026

> **Stack status (read first).** Of the tool sections below, only §5 (Prospeo) and §16 (GetLeads) cover tools in FNNL's approved stack (`approved_stack` in `outbound/stack-contract.yaml`); the rest of the stack has no section here. Every other tool section is an OUT OF STACK, needs operator approval: a research note, never a default path. The live order per field is `outbound/reference/provider-routing.yaml`.

This is an idea bank. It is not a plan to build every list.

The weak move is to ask, "What lists can this tool make?" and then build huge lists because the tool can. The better move is to ask:

- Who is the buyer?
- What signal proves they might care now?
- Can we reach the right person?
- Can we say something specific without sounding creepy or fake?
- Is this data source reliable enough for the claim we will make?

If a list does not pass those questions, it is just data wearing a lead-list costume.

## Source Notes

I used public vendor pages and help docs where possible. Vendor claims can be biased, so treat coverage numbers and accuracy claims as marketing claims until tested on your own campaigns.

Main sources checked:

- [RevCode](https://revcode.app/)
- [A-Leads product page](https://a-leads.co/product/)
- [A-Leads accuracy article](https://a-leads.co/education/articles/how-accurate-is-your-data/)
- [WizLeads](https://wizleads.io/)
- [Scrap.io](https://scrap.io/)
- [Prospeo people search guide](https://help.prospeo.io/en/article/how-to-search-for-people-leads-1rzrnrl/)
- [Prospeo filters guide](https://help.prospeo.io/en/article/people-search-filters-explained-cppbsm/)
- [Prospeo API docs](https://prospeo.io/api-docs)
- [DiscoLike](https://discolike.com/)
- [Spider Cloud](https://spider.cloud/)
- [GetLatka](https://getlatka.com/)
- [Serper](https://serper.dev/)
- [Apify lead generation page](https://apify.com/use-cases/lead-generation)
- [Apify homepage](https://apify.com/)
- [Trigify](https://www.trigify.io/)
- [Trigify intro docs](https://help.trigify.io/articles/9831878-introduction)
- [Trigify social signals docs](https://help.trigify.io/help/articles/2314560-social-signals)
- [LeadsFriday](https://www.leadsfriday.com/) (added June 8, 2026)

## How To Use This

Use this as a menu. Pick one list type, define the buyer, then run a small data-quality sample before building volume.

Good first data-quality sample (is the list clean and on target? This is not a reply test):

- 50 companies if the list is account-based.
- 100 to 250 people if the list is person-based.
- 25 to 50 local businesses if the list needs manual website checks.
- 10 to 20 examples if the list depends on social intent or website text.

These samples check fit, identity and deliverability before spend. They are far too small to judge replies or an offer: a good offer usually shows zero positive replies at this size. Reply tests run at the Offer-Validation Wave's pooled read (about 2,000 to 3,000 first-touch contacts per offer, 1,300 at minimum, `/campaign-strategy`), so never kill a list or an offer on a data-quality sample (operator directive 2026-09-22).

Before spending credits on any paid stack tool (GetLeads plan credits or wallet cash, Prospeo, and the rest of `approved_stack`), run `/api-cost-governance` to preview the USD/credit cost, check the balance, and block if a key is below cost or under the \$10 warning threshold. Every other paid tool named in this catalog is OUT OF STACK, needs operator approval and gets no spend until approved. A stack tool that is out of balance or down (a missing key, a failed health check, a lasting outage) is never skipped or substituted: the step stops and asks the operator to top up or fix it, then resumes on the same tool (`/tool-balance-guard`, operator decision 2026-09-28). The list workbench's own credits are never the fallback.

## Benchmark A Vendor Before You Pay For It

Every find-rate, coverage, and accuracy number in this catalog is the vendor's own marketing until it has been tested on your data. Run this before any vendor is added, swapped, or paid for. Full method: `eric-deliverability-doctrine.md` Part 2.

1. **Build a frozen, dated reference sample** from a source you are authorized to access: your own recent positive replies, a manually checked set of companies, or a known-good address list. Freeze it and date it, so every candidate is judged on the same rows.
2. **Run every candidate against that exact same sample.** A benchmark taken on different rows is not a comparison.
3. **Measure two things, not one.** Raw coverage alone is close to worthless. What counts is each candidate's **incremental unique correct contribution** over what the current stack already returns, and its **false-negative rate**, meaning how often it wrongly rejects something you know is good. A vendor that looks weak on a general benchmark can still earn its slot by recovering exactly the records the current stack misses.
4. **For contact and company discovery**, score each route on owner/contact accuracy, usable coverage, false positives, unique finds, cost, and time against the same manually verified answer key, then take the **deduplicated union** rather than crowning a single winner.
5. **For email verifiers specifically**, run addresses you *know* are live (they recently produced real replies) through each candidate. A verifier that flags a meaningful share of that known-good set as catch-all or invalid is silently costing real yield. Swap on the lower false-negative rate **on your own data**, never on either vendor's stated accuracy.
6. **The failure mode this prevents.** Do not buy every provider just because an agency with many customers can justify the spend. More vendors stacked without this test means more cost and more places for stale or wrong data to enter, not more coverage.

---

# 1. RevCode

## What It Is

RevCode is a GTM engineering workspace. The public site describes it as a programmable spreadsheet where every column can be a function. The demo text shows an agent creating tables, adding computed fields, running code, using APIs, enriching emails with Prospeo, scoring leads, and working with extensions such as Prospeo, Findymail, Instantly, LeadMagic, and HeyReach.

RevCode is not mainly a data source. It is the operating layer that combines sources, cleans data, runs API calls, adds scoring, dedupes rows, and turns messy inputs into usable lists.

## Lead Lists You Can Build

- Raw CSV to enriched prospect list
  - Start with any company or person CSV.
  - Add email, mobile, LinkedIn, company domain, employee size, industry, score, and notes.
  - Best when you already have a rough list but need it made usable.

- Domain list to decision-maker list
  - Input: company domains.
  - Add: titles to target, email finder, mobile finder, one best contact per account, suppression checks.
  - Good for account-based outbound.

- Company list to buying-fit score
  - Input: company names or domains.
  - Add: industry, headcount, revenue range, tech stack, hiring signals, website keywords, social signals.
  - Output: high, medium, low fit.

- Lead QA list
  - Check if rows have real domains, valid names, current titles, verified emails, duplicate contacts, bad characters, missing company names, and risky free-mail addresses.
  - This is boring, which means it matters.

- Multi-source waterfall enrichment list
  - Try A-Leads first.
  - If missing data, try Prospeo.
  - If still missing, try another provider.
  - Add a final status: verified, catch-all, no email, no person match, company mismatch.

- No-row-limit bulk processing list
  - RevCode says it runs locally and has no row ceiling.
  - Use it for 50K, 100K, or 500K-row cleanup jobs where normal SaaS tools get expensive or slow.

- Lookalike account scoring list
  - Input: best customers.
  - Pull similar companies from DiscoLike, Prospeo, A-Leads, or Latka.
  - Score by how closely they match your best customer pattern.

- ICP mismatch rejection list
  - Build a list of leads you should not contact.
  - Example: wrong employee range, wrong country, no website, student emails, agencies when you want SaaS, enterprise when you want SMB.
  - This prevents volume from poisoning a campaign.

- "One best lead per company" list
  - Use RevCode logic to limit one contact per account.
  - Useful when the offer should hit one owner, CEO, VP, or founder first.

- Multi-contact buying committee list
  - Add 2 to 5 contacts per company.
  - Example: CEO, VP Sales, Head of RevOps, Marketing Director, Sales Ops.
  - Best for bigger deals.

- Website-personalized lead list
  - Crawl each website with Spider Cloud.
  - Extract specific facts.
  - Add a custom message angle column.
  - This only works if the fact is real and relevant. Do not fake personalization from weak text.

- Local business scoring list
  - Pull businesses from Scrap.io or Apify.
  - Crawl websites with Spider Cloud.
  - Score based on missing website, weak reviews, missing booking link, old site, slow mobile page, no social proof, no online form.

- SaaS company revenue-fit list
  - Pull company data from Latka.
  - Add contact data from Prospeo or A-Leads.
  - Score by ARR, growth, funding, customer count, pricing model, and category.

- Social-intent follow-up list
  - Pull signals from Trigify.
  - Add contact details from A-Leads or Prospeo.
  - Add outreach angle from original post or comment.

- Search-result prospect list
  - Use Serper to find pages by keyword.
  - Use Spider Cloud to extract structured data.
  - Use Prospeo or A-Leads to find people at those companies.

- Competitor comparison page list
  - Serper query examples:
    - `"alternative to [competitor]"`
    - `"best [category] tools"`
    - `"[competitor] vs"`
  - Extract companies that publish or rank for comparison topics.
  - Useful for companies already in a category conversation.

- Hiring-trigger list
  - Pull job posting signals from Prospeo or A-Leads.
  - Add company growth score.
  - Add contacts who own the department hiring.

- Tech-stack migration list
  - Pull companies using a competitor tool from Prospeo, DiscoLike, or A-Leads.
  - Add "why migrate" angle based on current stack.
  - Example: Shopify plus Klaviyo users for an ecommerce retention tool.

- Account gap list
  - Input: current CRM or campaign list.
  - Find accounts with no verified email, no mobile, no LinkedIn, no decision-maker, no website, no industry, or no region.
  - Output: what needs enrichment.

- Suppression and DNC list
  - Centralize people and companies that should not be contacted.
  - Match on email, domain, LinkedIn URL, company name, and fuzzy variants.

- Deliverability-safe export list
  - Only include verified emails.
  - Exclude risky catch-all unless intentionally separated.
  - Remove role accounts unless the campaign is built for them.
  - Remove generic emails for person-based outreach.

- API-backed live refresh list
  - Re-run enrichment before launch.
  - Mark stale rows.
  - Use "last verified at" fields.

- Campaign-ready final export
  - Output columns for sequencer import:
    - first name
    - last name
    - title
    - company
    - domain
    - email
    - email status
    - LinkedIn URL
    - country
    - segment
    - source
    - reason for fit
    - custom opener data
    - suppression status

### AI-Routing + Source-Signal Column Groups

These extend the campaign-ready export above for source-signal-first campaigns where the row must carry its proof, its AI provenance, and its copy inputs. Build only the groups a given campaign needs. Do not bloat every list with all of them.

**Canonical-schema reconciliation (read this first):** the source-evidence vocabulary is owned by `/lead-source-strategy`, whose required CSV fields are `source, source_type, source_url, evidence_url, signal, fit_reason, source_confidence`. The columns below **map onto** that schema. They do not rename it. `/list-quality-scorecard` dimension 5 and `/icp-prompt-builder` both read the canonical names, so keep them intact.

- **Discovery group** (maps onto the canonical signal fields):
  - `source_signal` ↔ canonical `signal`
  - `signal_source_url` ↔ canonical `evidence_url`
  - `signal_source_type` ↔ canonical `source_type`
  - `signal_date` (additive: when the signal is from)
  - `signal_strength` (additive: strong / medium / weak; never overclaim weak)

- **Contact group:** the existing export columns (first/last/title/company/domain/email/LinkedIn) plus `buyer_persona`.

- **Enrichment group:** `enrichment_status`, `email_status`, `phone_status`.

- **Source-evidence group** (kept by canonical name): `source`, `source_url`, `fit_reason`, `source_confidence`, plus `account_context`, `business_context`, `technical_context`, `human_hook`.

- **Scoring group:**
  - `confidence_score` (additive: the row's overall fit score; distinct from `source_confidence`, which is evidence strength)
  - `reason_for_fit`, `reason_now`, `pain_point`, `likely_objection`

- **AI-routing group** (provenance: which provider ran each stage):
  - `ai_research_provider`, `ai_analysis_provider`, `ai_copy_provider`
  - Under the no-AI-API rule (operator directive 2026-09-22) each of these records a Claude Code label (for example `claude-deep-research` for the research primary). The column names are kept because downstream skills read them.

- **Copy group:** `offer_angle`, `lead_magnet_angle`, `email_opener`, `phone_opener`, `proof_point`.

- **QA group:** `qa_status`, `suppression_status`.

- **Export group:** `final_sequence_segment`, `export_ready`.

For which provider owns each stage and how the `ai_*_provider` columns get populated, see `ai-model-routing.md`.

## Tiny Features That Matter

- Computed columns let you turn raw data into decision fields.
- Bring-your-own API keys means you are not stuck in one data vendor.
- Local runs help with larger files and sensitive working data.
- Agent-native workflow means you can describe a column and have code created for it.
- API extensions make it useful as a glue layer between lead sources.
- It can act like a cheap Clay replacement for custom workflows if you are willing to define the logic.

## Where It Can Fail

- RevCode will not save a weak ICP. It will just process bad logic faster.
- If your function is wrong, every row can be wrong.
- "Any API" is powerful, but you still need API access, rate limits, and legal permission.
- Local processing helps privacy, but third-party enrichment calls still send data to vendors.

---

# 2. A-Leads (OUT OF STACK, needs operator approval)

## What It Is

A-Leads is a B2B contact and company data platform. Its public product page claims people and company search, verified emails, phone numbers, LinkedIn profiles, company details, firmographics, buying intent, sales signals, technology data, job postings, career changes, CRM exports, Chrome extension, and API access.

Vendor pages mention 100M+ verified contacts in one section and 320M+ verified B2B contacts in another. Treat that as a vendor claim until you benchmark it on your own ICP.

> **Access: MCP connector.** A-Leads is reached through the **A-Leads MCP connector** (`https://mcp.a-leads.co`, added as a Claude custom connector), which exposes **9** tools: `aleads_company_search`, `aleads_advanced_search`, `aleads_find_email` (+`aleads_bulk_find_email`), `aleads_verify_email` (+`aleads_bulk_verify_email`), `aleads_find_phone`, `aleads_get_user_details`, `aleads_get_saved_searches`. Billing is metered/pay-as-you-go. Note on `aleads_advanced_search` (people/contact search): it is a real, callable tool, but broad market-filter results from it need per-row verification, and the two contact-discovery shapes worth knowing are a domain-batch lookup (`bulk_domains`) and a filtered people search. **Verification is a separate slot:** `aleads_verify_email` / `aleads_bulk_verify_email` exist, but whether they or a dedicated verifier fill `email_verification` comes from the stack contract (§14 covers what to look for in a verifier). The MCP has **no lookalike/`similar` tool**, so lookalike discovery belongs to whatever fills `company_discovery`. The full tool reference, gotchas, and the Layer-1/Layer-2 split live in this vendor's integration pack, which ships inert in `_vendor-library/` and becomes loadable only once `/stack-setup` activates it. The direct REST API is a legacy path.

## Lead Lists You Can Build

- Verified email lead list
  - Filter by job title, industry, location, company size, and other ICP fields.
  - Only export contacts with verified emails.

- Mobile-number calling list
  - Build lists where phone contact matters.
  - Best for markets where calling is acceptable and expected.
  - Watch cost because mobile numbers can cost more credits.

- LinkedIn-plus-email list
  - Get contacts with LinkedIn profile and verified email.
  - Useful for multichannel outreach.

- Decision-maker list
  - CEOs, founders, owners, partners, presidents, managing directors.
  - Good for SMB and founder-led companies.

- Department-head list
  - Heads of Sales, Marketing, Operations, HR, Finance, IT, RevOps.
  - Best when the offer solves a department pain.

- Industry-specific contact list
  - Example: finance leaders in healthcare companies.
  - Example: operations directors in logistics.
  - Example: HR leaders in staffing firms.

- Geography-specific list
  - Build by country, state, city, or region.
  - Useful for local campaigns, regulatory limits, or timezone-based calling.

- Employee-size segment list
  - 1 to 10 employees.
  - 11 to 50 employees.
  - 51 to 200 employees.
  - 201 to 500 employees.
  - 501 to 1,000 employees.
  - 1,000+ employees.
  - This matters because the same offer can fail across the wrong company size.

- Tech-stack lead list
  - Target companies based on frameworks, CRMs, marketing tools, or vendors they use.
  - Example: HubSpot users, Salesforce users, Shopify users, Klaviyo users, WordPress users.

- Competitor-user list
  - Target companies using a competitor or adjacent tool.
  - Example: companies using HubSpot, Mailchimp, Shopify, or a payment tool.
  - Only do this if the message makes sense. "I saw you use X" is weak unless the pain is clear.

- Buying-intent list
  - Target companies showing research behavior or purchase signals.
  - Best for outreach where timing matters.

- Sales-signal list
  - Build based on company activity that suggests a need.
  - Example: researching a category, changing vendors, hiring, or expanding.

- Job-posting lead list
  - Target companies actively hiring for roles related to your offer.
  - Example: companies hiring SDRs for sales training.
  - Example: companies hiring data engineers for a data tool.
  - Example: companies hiring recruiters for HR software.

- Career-change lead list
  - Find people who recently changed jobs or left a company.
  - New leaders often buy tools, agencies, and services early in role.

- Fast-growing company list
  - Use hiring and job trend signals to find companies expanding.
  - Good for offers tied to scale, process, hiring, data, ops, or automation.

- Real-time enrichment refresh list
  - Upload stale records.
  - Refresh email, phone, title, company details, and firmographics.

- CRM clean-up list
  - Find missing phone numbers, emails, LinkedIn URLs, domains, or titles.
  - Push to HubSpot or export to CSV.

- Outreach-ready data list
  - Build lists designed to go directly into a sequencer.
  - Include email status, phone status, LinkedIn URL, title, company, industry, and source.

- High-deliverability-only list
  - Filter to contacts with verified email.
  - Exclude unverifiable and risky contacts.
  - Good for protecting sending reputation.

- EMEA-focused list
  - A-Leads marketing claims strong coverage in EMEA and the US.
  - Test before scaling.

- US-focused list
  - Build normal outbound lists by title, industry, size, and location.

- "Free trial users of tools" list
  - If tool attributes are available, target companies using products with free trials or public pricing.
  - Good for SaaS categories where buying behavior is visible.

- Agency prospect list
  - Target agencies by niche, size, region, and tool use.
  - Example: marketing agencies using HubSpot or Shopify ecosystem tools.

- Founder-led startup list
  - Target founders and owners at smaller companies.
  - Add company size, tech stack, and intent filters to avoid junk.

- Enterprise stakeholder list
  - Target directors, VPs, and heads at larger companies.
  - Add department and seniority filters.

- Warm LinkedIn prospecting list
  - Use Chrome extension while browsing LinkedIn.
  - Find verified emails and phones from profiles you are already researching.

## Tiny Features That Matter

- Triple email verification is marketed as syntax, SMTP, catch-all, and domain checks.
- Phone validation is marketed as carrier and invalid-number checking.
- Duplicate and invalid detection can reduce wasted credits.
- Real-time enrichment is useful when stale data is killing campaigns.
- CRM and outreach exports reduce manual copy-paste errors.
- Chrome extension can help when you are manually prospecting on LinkedIn or company pages.

## Where It Can Fail

- Data vendor "verified" does not mean the person is the right buyer.
- Mobile numbers can increase reach but also increase compliance and brand risk.
- Buying intent can be vague. It needs a real offer match.
- Tech-stack data can be incomplete if the technology is not visible.
- If you trust only one data vendor, you will miss accounts and also overtrust bad rows.

---

# 3. WizLeads (OUT OF STACK, needs operator approval)

## What It Is

WizLeads is focused on LinkedIn Sales Navigator scraping, email enrichment, and bulk email verification. The public site says you can paste a Sales Navigator URL, run account-less scraping, use smart link splitting to bypass the 100-page Sales Navigator limit, enrich business emails, verify catch-all domains, detect SEG, export CSV, and use a REST API.

This is a strong list-building tool when your source of truth is Sales Navigator.

## Lead Lists You Can Build

- Sales Navigator search export list
  - Build a LinkedIn Sales Navigator search.
  - Paste the URL into WizLeads.
  - Export the people and company fields.

- Account-less Sales Navigator list
  - Scrape without connecting your own LinkedIn or Sales Navigator account.
  - This may reduce personal account risk, but it does not remove platform policy risk.

- Email-enriched Sales Navigator list
  - Take scraped leads and find verified business emails.
  - Good when you like Sales Navigator targeting but need emails for cold outreach.

- Bulk-verified LinkedIn list
  - Upload or scrape a list.
  - Verify emails before sending.

- Large Sales Navigator split list
  - Use smart link splitting for searches that would otherwise hit limits.
  - Useful for large markets.

- Title-specific LinkedIn list
  - Example: VP Sales at B2B SaaS companies in the US.
  - Example: Marketing Directors at finance companies with 51 to 200 employees.
  - Example: Operations Managers at logistics companies in the UK.

- Recent-role or tenure-based list
  - Sales Navigator data can include current role and company tenure fields.
  - Use this for "new in role" or "stable decision-maker" campaigns.

- Company-size Sales Navigator list
  - Use Sales Navigator employee count filters.
  - Then enrich and verify.

- Location-based professional list
  - Build by person location or company geography.
  - Good for region-specific campaigns.

- LinkedIn open-profile list
  - Export fields that include profile status where available.
  - Useful for LinkedIn-first follow-up.

- Premium-profile list
  - Export and segment profiles marked as premium where available.
  - This is not buying intent by itself. Do not overread it.

- Email-provider segment list
  - WizLeads returns email provider data.
  - Segment by Google, Microsoft, or other providers when email infrastructure matters.

- Catch-all separated list
  - Split contacts into verified, catch-all resolved, catch-all risky, and not found.
  - Use different sending rules for each segment.

- SEG-aware deliverability list
  - SEG means secure email gateway.
  - Segment domains where verification is harder or false positives are more likely.

- LinkedIn-to-CSV agency list
  - Build repeatable CSV exports for clients.
  - Useful if your agency work already starts from Sales Navigator searches.

- Multi-role account list
  - Run separate Sales Nav searches by title.
  - Merge in RevCode.
  - Build 2 to 4 contacts per account.

- Single-best-contact account list
  - Use search logic to find only the best title first.
  - Dedupe to one contact per domain.

- Competitor employee or alumni list
  - Use LinkedIn filters to find people at or formerly at certain companies.
  - Good for recruiting, partnerships, or market research.
  - Be careful with privacy and relevance.

- Event or association keyword list
  - Use Sales Navigator keywords for event names, associations, certifications, or communities.
  - Then enrich and verify.

- Niche role Boolean list
  - Use Sales Navigator search syntax and filters to find hard-to-classify roles.
  - Example: "revenue operations" OR "sales operations" OR "gtm operations".

## Tiny Features That Matter

- CSV export makes it easy to feed RevCode, Clay, Smartlead, EmailBison, or a CRM.
- Account-less mode is useful when you do not want to connect a LinkedIn account.
- Smart link splitting matters for scale.
- Waterfall email lookup across multiple providers can reduce missing emails.
- Catch-all resolution protects deliverability better than simple SMTP checks.
- Webhooks and REST API support automated list building.

## Where It Can Fail

- Sales Navigator is only as good as LinkedIn profile data.
- A beautiful Sales Nav search can still be a bad buyer list.
- Scraping LinkedIn has platform policy risk.
- Account-less mode does not mean "risk-free."
- The biggest mistake is using Sales Nav filters as a substitute for offer logic.

---

# 4. Scrap.io (OUT OF STACK, needs operator approval)

## What It Is

Scrap.io is a local lead generation tool for extracting business data from Google Maps, Apple Maps, and Bing Maps. The public page says it can extract names, addresses, phone numbers, emails, websites, social links, reviews, ratings, categories, and more. It supports city, state, country, category, precision filters, polygon or radius geosearch, REST API, and MCP access.

This is best for local businesses that may not appear well in LinkedIn-style B2B databases.

## Lead Lists You Can Build

- Local business category list
  - Example: restaurants in Chicago.
  - Example: lawyers in Atlanta.
  - Example: dentists in Dallas.
  - Good for SMB offers.

- City-specific SMB list
  - Build all businesses in one city for a category.
  - Useful for local service, agency, insurance, finance, recruiting, and telecom offers.

- Statewide category list
  - Example: roofing companies in Texas.
  - Example: med spas in California.
  - Example: logistics companies in Florida.

- Country-wide category list
  - Use when you need scale.
  - Be careful. Country-wide lists get sloppy fast.

- Polygon geosearch list
  - Draw around neighborhoods, industrial parks, business districts, malls, ports, campuses, or trade zones.
  - Strong for local offers where exact geography matters.

- Radius list around anchor locations
  - Around a competitor.
  - Around a convention center.
  - Around a hospital.
  - Around a construction zone.
  - Around a wealthy neighborhood.

- Multi-map business list
  - Compare Google Maps, Apple Maps, and Bing Maps.
  - Useful for finding businesses missing from one platform.

- Businesses with no website
  - Best for web design, local SEO, booking systems, reputation management, or digital setup.

- Businesses with website but no email
  - Good for contact-form campaigns or phone-first outreach.

- Businesses with email
  - Build direct outreach lists where email is available.

- Businesses with phone only
  - Build call lists.
  - Good when the buyer is local and phone is normal.

- Businesses with mobile number
  - Useful for owner-operated trades and small services.
  - Higher compliance risk. Use carefully.

- High-review local authority list
  - Filter by many reviews and strong rating.
  - Good for partnerships, franchising, review tools, or local market maps.

- Low-rating improvement list
  - Businesses with weak ratings.
  - Good for reputation management, ops consulting, CX tools.
  - Weak message if you insult them. Do not open with "your reviews are bad."

- Low-review-count list
  - Businesses with few reviews.
  - Good for review generation, SEO, and local marketing.

- Businesses with Facebook or Instagram
  - Good for social ads, influencer, content, and brand offers.

- Businesses without social links
  - Good for social setup or local marketing.

- Business category plus rating list
  - Example: 4.5+ star dentists in a city.
  - Example: 3.0 to 4.0 star restaurants with many reviews.

- Business category plus website status list
  - Has website.
  - No website.
  - Website but no contact form.
  - Website but no visible email.

- Review-rich vertical list
  - Hotels, restaurants, clinics, salons, agencies, home services, gyms.
  - Good for sentiment analysis or reputation offers.

- Local franchise prospect list
  - Find repeated brand names across cities.
  - Useful for franchise, multi-location, or regional operator campaigns.

- Competitor neighborhood conquest list
  - Draw around competitor locations.
  - Build nearby alternatives.
  - Useful for local ads, B2B services, or partnership outreach.

- Local market density list
  - Count how many businesses exist by category in each area.
  - Useful before deciding which city or niche to sell into.

- "Hidden from LinkedIn" list
  - Small businesses, trades, local shops, independent clinics, local agencies.
  - This is Scrap.io's real value. LinkedIn misses a lot of these.

- API-fed daily local lead list
  - Use REST API to search, filter, and export on a schedule.
  - Good for ongoing prospect feeds.

- AI-agent local search list
  - Use MCP to let an AI agent search and export businesses through natural language.

## Tiny Features That Matter

- Google, Apple, and Bing Maps coverage gives more local surface area.
- Category coverage matters for niche local targeting.
- Filters by website, phone, email, rating, reviews, and socials reduce junk.
- Polygon/radius search is a big deal for hyperlocal outbound.
- REST API makes repeatable local lead generation possible.
- MCP makes it usable inside agent workflows.

## Where It Can Fail

- Maps data often gives businesses, not decision-makers.
- Many emails are generic inboxes.
- Local businesses can be low ACV, so list size alone is not a win.
- Scraped public data still needs compliance review.
- Some listings are closed, duplicated, or stale. Always QA a sample.

---

# 5. Prospeo

> **This is a capability record, not a routing instruction.** Prospeo is a candidate for `contact_discovery`; whether it is the tool FNNL uses comes from the stack contract, and nothing in this section says it is. Before planning a campaign around any list idea below, confirm the slot and confirm status `live`, not just `chosen`.
>
> **Most of what this section describes is available from other tools too**, so check the filled slot before assuming Prospeo is required: contact search, department size / founded year / funding / revenue / technologies as search-time filters (some tools expose these in an exact count that reveals no record, §16), email finding plus verification (§13, §14), and tenure or time-in-seat (a `job_duration_months`-style field, the flagship contact why-now signal).
>
> **The genuinely distinctive remainder is narrow:** department-level **headcount growth rate** and the **sold-to axis**, both as *search-time* filters (narrowing the universe before the list exists, versus enriching a list you already hold). If Prospeo is ever the chosen tool, re-read `signal-strategy-playbook.md` for the per-signal recipe, and re-check its "Prospeo exclusive" claims against §16 first, because several tools have since closed parts of that gap.

## What It Is

Prospeo is a B2B prospecting and enrichment platform. The help docs say People Search can find leads from a database of 300M+ contacts, with 30+ filters. Filters include person fields, company fields, technologies, job postings, job changes, buying intent, funding, revenue, headcount growth, company attributes, email provider, and more. Prospeo also has APIs for search and enrichment.

On paper Prospeo is one of the most flexible list builders in this catalog. Whether it is available to a given campaign depends entirely on the stack contract: see the note above.

## Lead Lists You Can Build

- Person search lead list
  - Search people by title, department, seniority, location, contact availability, and experience.

- Verified-work-email list
  - Only export contacts with verified work emails.
  - Good for cold email.

- Mobile-available list
  - Build calling or SMS-ready lists where legally allowed.

- Email-and-mobile list
  - Use AND logic when you need both.
  - Higher cost, but better multichannel coverage.

- C-suite list
  - CEO, COO, CFO, CTO, CMO, CRO, founder.
  - Best for smaller companies or strategic offers.

- Department leader list
  - Sales, marketing, HR, finance, operations, IT, engineering, legal, product.

- Seniority-based list
  - Founder/owner.
  - C-suite.
  - VP.
  - Head.
  - Director.
  - Manager.
  - Senior individual contributor.

- Boolean title list
  - Use AND, OR, parentheses, exclusions, and exact title logic.
  - Example: `director AND (marketing OR demand generation)`.

- Person location list
  - Build by where the person is located.

- Company HQ location list
  - Build by where the company is based.

- Time-in-current-role list
  - New in role: likely to review tools.
  - Long in role: likely stable and experienced.

- Time-in-current-company list
  - New at company can suggest change mandate.
  - Long at company can suggest internal influence.

- Total experience list
  - Filter for seasoned buyers or early-career operators.

- Job-change list
  - People who changed jobs in the last 90, 180, 270, or 365 days.
  - Strong for "new leader" campaigns.

- Company include list
  - Upload a target account list.
  - Find people only at those companies.

- Company exclude list
  - Exclude current customers, competitors, prior bounced domains, or do-not-contact accounts.

- Bulk company upload to contacts
  - Upload domains or company names.
  - Find matching people.

- Industry list
  - Use industry classifications.
  - Good for broad vertical campaigns.

- NAICS or SIC code list
  - Better for old-school industries, regulated sectors, manufacturing, healthcare, government-adjacent markets, and finance.

- Company keyword list
  - Match company data, social media keywords, or SEO keywords.
  - Good for niche categories that industry tags miss.

- Employee headcount list
  - Total company size by range.

- Department headcount list
  - Target companies with a large or small department.
  - Example: companies with a growing sales team.

- Revenue-range list
  - Filter companies by annual revenue.
  - Best when budget matters.

- Funding-stage list
  - Seed, Series A, Series B, growth, recently funded, or amount raised.
  - Good for startup-focused offers.

- Last funding date list
  - Recently funded companies often hire, buy tools, and change vendors.

- Technology-user list
  - Companies using tools such as Salesforce, HubSpot, Shopify, or Wappalyzer-tracked technologies.

- Technology-exclusion list
  - Companies not using a tool.
  - Example: ecommerce stores not using Klaviyo.

- Competitor replacement list
  - Companies using a competitor.
  - Add timing signal or pain signal before outreach.

- Founded-year list
  - New companies.
  - Mature companies.
  - Companies founded in a certain wave.

- Headcount-growth list
  - Companies growing by percentage over a period.
  - Can be filtered by department.

- Department-growth list
  - Sales headcount growth.
  - Marketing headcount growth.
  - Engineering headcount growth.
  - HR headcount growth.

- Job-posting trigger list
  - Companies hiring specific roles.
  - Example: hiring SDRs, data engineers, customer success managers, recruiters.

- Buying-intent topic list
  - Companies researching topics relevant to your category.
  - Prospeo says intent is powered by Bombora.

- Email-provider list
  - Microsoft.
  - Google.
  - Proofpoint.
  - Mimecast.
  - Other.
  - Useful for deliverability, email security, IT, and migration campaigns.

- Company attribute list
  - Companies with demo.
  - Companies with free trial.
  - Companies with public pricing.
  - Companies with mobile app.
  - Companies with online reviews.
  - Companies with downloadable product.

- One lead per company list
  - Prospeo can limit how many leads appear per company.
  - Useful for clean account-based lists.

- Duplicate-control list
  - Hide already saved, exported, or uploaded exclusion-list contacts.
  - Good for agency operations.

- CSV enrichment list
  - Upload a CSV and enrich missing fields.

- CRM push list
  - Push selected leads directly to HubSpot, Salesforce, Lemlist, Instantly, or connected tools.

- API search list
  - Use Prospeo Search Person API for custom list building.
  - Note: docs say API returns up to 25,000 results per search.

- API bulk-enriched list
  - Search first, enrich later.
  - Useful when you want to preview fit before spending more on contact data.

## Tiny Features That Matter

- Contact-detail filters prevent wasting time on unreachable people.
- Include and exclude company lists are essential for clean ABM.
- Boolean title search is needed for messy real-world role names.
- Job change is one of the better timing signals.
- Job posting and headcount growth are stronger than static firmographics.
- Email provider can create smart IT or deliverability segments.
- Company attributes are useful for SaaS targeting.

## Where It Can Fail

- Prospeo docs say Wappalyzer technology data tracks web-based technologies only. It cannot reliably detect internal tools like Slack, accounting software, or private HR systems.
- Buying intent is not proof of buying. It is a hint.
- The API has result limits. Plan pagination and search slicing.
- People data can go stale. Refresh before launch.
- The best filters still need a clear offer.

---

# 6. DiscoLike (OUT OF STACK, needs operator approval)

## What It Is

DiscoLike is a company-domain and target-account discovery tool. Its site focuses on natural-language company search, exact phrase matching, domain lookalike search, website text, firmographics, vendor data, list validation, domain matching, ICP discovery from current client lists, and coverage across small, private, and international companies.

DiscoLike is strong for account discovery, not contact enrichment.

## Lead Lists You Can Build

- Natural-language ICP account list
  - Describe the exact kind of company you want.
  - Example: "B2B SaaS companies selling workflow automation to law firms."
  - DiscoLike ranks domains by similarity.

- Lookalike company list
  - Input 4 to 5 best customer domains.
  - Get companies that look similar based on website text and firmographics.

- Best-customer clone list
  - Upload current customers.
  - Identify the shared patterns.
  - Build more companies matching those patterns.

- Website phrase-match list
  - Exact homepage phrases.
  - Example:
    - "we help dentists"
    - "SOC 2 compliance"
    - "Shopify Plus agency"
    - "managed IT services"
    - "AI voice agent"

- Problem-language list
  - Find companies whose websites mention a pain.
  - Example: "reduce chargebacks", "automate onboarding", "lower churn", "improve collections."

- Use-case language list
  - Target companies describing the use case your offer solves.
  - Better than generic industry tags.

- Buyer-segment discovery list
  - Upload a mixed client list.
  - Let DiscoLike segment it into groups.
  - Then build separate lists for each segment.

- Long-tail private company list
  - Find smaller, private, international businesses that LinkedIn-style sources miss.

- Non-obvious vertical list
  - Use website descriptions to find verticals that are not captured by standard categories.
  - Example: "companies that manage field technicians for utilities."

- Competitor-adjacent company list
  - Find companies describing themselves like your competitor's best-fit customers.

- Vendor-usage list
  - Target companies using vendors on their website or subdomains.
  - Example: companies using certain chat widgets, analytics tools, ecommerce tools, CMS, payment vendors, or forms.

- Tech-stack and vendor list
  - DiscoLike claims more vendor data than many technographic providers.
  - Use this for web-visible vendors, not hidden internal tools.

- Website-function list
  - Companies with certain functions implemented on the site.
  - Example: booking, marketplace, portal, calculator, quote request, checkout, job board.

- Subdomain-based list
  - Companies with app, docs, careers, partners, developers, status, academy, or support subdomains.
  - Useful for SaaS, marketplace, developer-tool, or enablement campaigns.

- Mobile-app signal list
  - Companies with mobile apps linked from the site.
  - Good for app analytics, mobile testing, app marketing, or payment tools.

- Social-footprint list
  - Companies with certain social links or no visible social presence.

- Maps-location signal list
  - Companies with location/map references.
  - Useful for local or multi-location businesses.

- Company-start-date list
  - DiscoLike says foundational data can see accurate company start dates.
  - Use for new-company or mature-company segmentation.

- Growth-pattern account list
  - Use growth signals if available.
  - Best for accounts likely to be scaling.

- "Missing domain" cleanup list
  - Upload account names.
  - Match missing domains.
  - Useful for CRM cleaning.

- "Validate and rank external list"
  - Upload an existing list.
  - Validate records, append firmographics, and rank fit.

- "Find companies missed by LinkedIn" list
  - Especially useful in obscure B2B niches where company websites say more than LinkedIn profiles.

- Language-specific international list
  - DiscoLike says it works across 48 languages.
  - Useful for non-English country targeting.

- TAM mapping list
  - Build a total addressable market by domain.
  - Then enrich contacts through Prospeo, A-Leads, or another provider.

## Tiny Features That Matter

- Natural-language search avoids rigid industry categories.
- Domain lookalike search is strong for finding "companies like these customers."
- Exact phrase matching is strong for niche pains and website intent.
- Website-level matching can find companies traditional databases miss.
- Uploading a current client list can reveal ICP patterns you did not manually name.
- Domain validation is useful before enrichment.

## Where It Can Fail

- DiscoLike gives accounts, not always people.
- Website text can be old, vague, or marketing fluff.
- Vendor detection does not equal active internal usage.
- Similar-looking companies are not always similar buyers.
- You still need contact enrichment, dedupe, and campaign logic.

---

# 7. Spider Cloud (OUT OF STACK, needs operator approval)

## What It Is

Spider Cloud is a web crawling, scraping, search, screenshot, links, and browser API for AI agents and data pipelines. Its public page says it can turn URLs into clean markdown, structured JSON, screenshots, or other formats. It also mentions AI extraction, headless browser, proxies, bot-detection handling, and default robots.txt compliance.

Spider Cloud is not a lead database. It turns websites and pages into structured data you can use to qualify leads.

## Fast-crawl settings (measured: read before any large crawl)

Crawl throughput is **concurrency-bound, not per-site-bound.** A single crawl returns in ~0.5s in *any* mode, so the way to go fast is to run many in parallel and keep each call cheap, not to tune one call. Measured on a 1,800-site healthcare batch (2026-06-12): naive defaults ran ~15 rows/min; the settings below hit ~133 rows/min (~9x), zero rate-limit rejections.

- **`proxy_enabled: false`.** The premium proxy is an **8–9x slowdown** (≈86s/page vs ≈10s) *and* returns fewer pages. Crawl proxy-off by default; turn the proxy on only as a last resort for a confirmed bot wall.
- **`request: 'http'` first; escalate to `'chrome'` only on an empty (0-page) result.** Raw-HTTP handles the server-rendered majority in ~0.5s; reserve the headless browser (slower) for the minority http can't render. `'smart'` works but http-first is faster and more predictable.
- **`limit: 2` pages**, not 4+. Homepage + one internal page covers most company-level facts; more pages just costs time and credits.
- **Concurrency ≈ 40 workers.** Measured 16→49 rows/min, 40→133 rows/min, both **0 × 429** across Spider + the sibling providers in that run (Serper and an AI extractor; the AI extractor is retired under the no-AI-API rule, operator directive 2026-09-22, and extraction now runs after the crawl in Claude Code sub-agents). ~40 is the sweet spot; in that run the extractor's latency was the next ceiling past it. Push higher only while watching **which provider 429s first** (the "master instrument"); that provider is your real cap, and stopping there is the rule.
- **Run independent providers in parallel** (e.g. a Serper Places lookup alongside the crawl) with `Promise.all`, not serially: a row's wall-time becomes the *max* of the two, not the sum.
- **"Run more workers/agents" does NOT add capacity past the provider ceiling.** Every crawl funnels through the one Spider account; more callers just queue or trigger 429s. The levers are the per-call config above + concurrency to the 429 knee, not more parallel callers.
- **Direct `fetch()` is not a rescue path** for sites Spider can't crawl: on a bot-walled/JS tail it recovered only ~4/60 (403s + timeouts). Those need the chrome/proxy escalation or stay blank. Don't build a "just fetch it yourself" fallback expecting it to save the hard cases.
- **Kill orphaned crawl processes before relaunching.** A backgrounded crawl can survive a machine sleep or a killed task and keep appending to the same output file. Two writers waste credits and can interleave lines. Check for stray PIDs (`Get-CimInstance Win32_Process -Filter "Name='node.exe'"`) first; an append-only + resume-on-done design makes any duplicates harmless, but kill the orphan anyway.

## Lead Lists You Can Build

- Website keyword intent list
  - Crawl company websites.
  - Find pages mentioning pains, use cases, products, regulations, certifications, or industries.

- Pricing-page list
  - Find companies with public pricing.
  - Extract plan names, price points, free trial, enterprise tier, and product-led growth signals.

- No-pricing-page list
  - Useful if selling pricing research, conversion optimization, or sales-led GTM help.

- Careers-page hiring list
  - Crawl careers pages.
  - Extract open roles, department, location, remote status, and hiring velocity.

- Job-description tech-stack list
  - Extract tools mentioned in job posts.
  - Better for internal/backend tech than website pixel tracking.

- Integration-page list
  - Find companies integrating with Salesforce, HubSpot, Shopify, Slack, Stripe, QuickBooks, Snowflake, or other tools.

- Partner-directory list
  - Crawl partner pages or directories.
  - Extract agencies, integrators, consultants, resellers, VARs, MSPs, affiliates, or ecosystem partners.

- Customer-logo extraction list
  - Crawl competitor websites.
  - Extract customer logos or case studies.
  - Be careful: logos do not prove active use.

- Case-study account list
  - Extract named customers, use cases, industries, outcomes, and contacts if public.

- Review-site company list
  - Crawl public review pages where allowed.
  - Extract vendors, ratings, review volume, complaints, categories.

- Directory scraper list
  - Chamber of commerce.
  - Trade associations.
  - Franchise directories.
  - Marketplace vendor directories.
  - Software directories.
  - Event sponsor pages.

- Event sponsor and speaker list
  - Crawl conference websites.
  - Extract sponsors, speakers, exhibitors, titles, companies, and topics.

- Webinar guest list
  - Crawl public webinar pages.
  - Extract company names, speakers, themes, and categories.

- Product catalog list
  - Crawl ecommerce or B2B catalog sites.
  - Extract products, categories, brands, stock signals, prices, and distributors.

- "Missing conversion basics" website list
  - Detect no CTA, no form, no calendar, no phone, no case studies, no privacy page, no mobile-friendly layout if you also screenshot or analyze rendered pages.

- Local website quality list
  - Combine with Scrap.io.
  - Crawl each local business site.
  - Score for age, page speed hints, forms, broken links, no HTTPS, missing tracking, no booking, no reviews, no schema.

- Security/compliance page list
  - Find companies with SOC 2, ISO 27001, HIPAA, GDPR, DPA, security pages, or missing security pages.

- Developer-docs list
  - Companies with API docs, SDKs, changelog, status page, developer portal.
  - Useful for developer tools, API security, docs tools, or partnership campaigns.

- Changelog activity list
  - Crawl changelogs and release notes.
  - Extract recent product activity.

- Blog-topic list
  - Identify companies writing about a topic.
  - Useful for content-led timing and partnership campaigns.

- Competitor mention list
  - Find sites that mention a competitor.
  - Good for integrations, alternatives, comparison, or migration offers.

- Broken-page or outdated-content list
  - Crawl websites for stale pages, old copyright, old events, 404s, or broken links.
  - Good for web agencies, SEO, or maintenance offers.

- Screenshot-based visual list
  - Use screenshots to classify websites by visual quality or UI issues.
  - Strong for design and CRO offers if scored honestly.

- "Contact page exists" list
  - Extract contact forms, emails, phones, office locations, and support channels.

- Form-detection list
  - Find companies with request-demo, quote, appointment, application, or contact forms.

- Sitemap-based market list
  - Crawl sitemaps to understand product, service, or location footprint.

- Newsroom and press list
  - Crawl press pages to extract launches, funding, partnerships, awards, and expansion.

- AI-ready website dataset
  - Convert a website to clean markdown/JSON.
  - Feed into RevCode for scoring and custom fields.

## Tiny Features That Matter

- Clean markdown saves time and reduces LLM noise.
- Structured JSON extraction lets you define the exact fields you want.
- Screenshots help when the lead quality signal is visual.
- Links extraction helps find contact, careers, pricing, docs, and integration pages.
- Browser mode helps with rendered pages.
- Robots.txt compliance is on by default, which matters.

## Where It Can Fail

- Spider Cloud needs good seed URLs. It will not magically know your market.
- Crawling is not the same as permission to use data for outreach.
- Website data can be messy, blocked, or outdated.
- AI extraction can hallucinate if you do not verify a sample.
- It is powerful for qualification, but weak as a standalone contact source.

---

# 8. GetLatka (OUT OF STACK, needs operator approval)

## What It Is

GetLatka is a SaaS company database with revenue, ARR, growth, funding, valuation, customers, ACV, pricing, founder interview data, industries, locations, and AI search. Its homepage says it organizes CEO-reported SaaS data and has 90,500+ companies, 91 filters, 5,000+ interviews, and Excel export.

This is best for SaaS account lists, not general B2B.

## Lead Lists You Can Build

- SaaS company by ARR list
  - \$0 to \$1M ARR.
  - \$1M to \$5M ARR.
  - \$5M to \$10M ARR.
  - \$10M+ ARR.
  - \$50M+ ARR.

- High-growth SaaS list
  - Companies with strong year-over-year growth.
  - Good for agencies, tools, hiring, GTM services, and finance offers.

- Fastest-growing AI startup list
  - Latka highlights AI companies with growth rates.
  - Useful for AI ecosystem offers.

- Bootstrapped SaaS list
  - Companies with meaningful revenue but no or low funding.
  - Good for efficient-growth offers.

- Funded SaaS list
  - Companies with recent or high total funding.
  - Good for hiring, GTM, finance, RevOps, and agency offers.

- Valuation-based list
  - Companies above or below certain valuation ranges.
  - Useful for investor, M&A, founder, and enterprise tool campaigns.

- Customer-count list
  - Companies with many customers.
  - Good for support, lifecycle, retention, analytics, and product-led growth offers.

- High-ACV SaaS list
  - Companies with large average contract value.
  - Better for enterprise sales tools, enablement, onboarding, CS, security, and implementation services.

- Low-ACV or PLG list
  - Companies with lower monthly pricing or self-serve plans.
  - Good for conversion, activation, onboarding, lifecycle email, analytics.

- Pricing-model list
  - Per-seat.
  - Freemium.
  - Usage-based.
  - Custom enterprise.
  - Cheap self-serve.

- Largest-customer signal list
  - Some profiles include largest customer details.
  - Useful for account strategy and segmentation.

- Category-specific SaaS list
  - CRM.
  - HR software.
  - Sales software.
  - Analytics.
  - AI.
  - Finance software.
  - Ecommerce software.
  - Security software.

- Location-specific SaaS list
  - Countries, cities, US states.
  - Good for regional campaigns and event-based prospecting.

- Founder interview lead list
  - Use interview-derived facts as context.
  - Example: growth channel, funding, pricing, customer size, top problem.

- Recent interview list
  - "New this week" companies.
  - Good for timely outreach if the angle is relevant.

- SaaS growth-channel list
  - Companies using SEO, marketplace, community, outbound, PLG, partners, or other growth tactics when available.

- SaaS maturity list
  - Founded year, ARR, funding, customer count, employees.
  - Segment by stage instead of category alone.

- Tiny-team-big-revenue list
  - Companies with small teams and meaningful ARR.
  - Good for automation, ops, AI agents, recruiting, finance, and founder support.

- Enterprise-SaaS list
  - High ARR, high ACV, many employees, enterprise customers.

- Product-led SaaS list
  - Free trial, freemium, low price, large user base.

- Sales-led SaaS list
  - High ACV, custom pricing, enterprise customers.

- Investor or M&A research list
  - Use revenue, growth, funding, valuation, and category to spot targets.

- SaaS contact-enrichment seed list
  - Export company accounts from Latka.
  - Enrich contacts through Prospeo or A-Leads.

## Tiny Features That Matter

- ARR and growth help estimate budget better than employee count alone.
- Founder interview data gives stronger personalization than generic firmographics.
- Export to Excel helps downstream enrichment.
- Category, geography, tags, and pricing can create niche SaaS segments.
- AI search can speed up weird queries.

## Where It Can Fail

- It is mostly SaaS. Do not use it for restaurants, local services, manufacturing, or broad SMB.
- It is company data, not contact data.
- CEO-reported data can still be incomplete or old.
- High-growth companies are attractive, which means more competition.
- Revenue fit does not prove pain fit.

---

# 9. Serper (OUT OF STACK, needs operator approval)

## What It Is

Serper is a Google Search API. Its public page says it supports Search, Images, News, Maps, Places, Videos, Shopping, Scholar, Patents, and Autocomplete. It returns structured Google result data such as organic results, knowledge graph, people also ask, related searches, images, and more.

Serper is best for finding pages, companies, URLs, and signals from Google. It is not a contact database.

## Lead Lists You Can Build

- Google search domain list
  - Search keywords tied to your ICP.
  - Extract domains.
  - Enrich accounts later.

- Niche keyword company list
  - Example: `"Shopify Plus agency" "New York"`.
  - Example: `"SOC 2 consultant" "healthcare"`.
  - Example: `"managed IT services" "law firms"`.

- Page-title list
  - Use search operators like `intitle:`.
  - Find companies with exact offer, market, or category pages.

- URL-pattern list
  - Use `inurl:partners`, `inurl:integrations`, `inurl:case-studies`, `inurl:pricing`, `inurl:customers`.

- Competitor alternative list
  - Find pages ranking for:
    - `[competitor] alternative`
    - `[competitor] vs`
    - `best [category] tools`
  - Good for category-aware accounts.

- Directory extraction seed list
  - Use Serper to find directories.
  - Use Spider Cloud or Apify to extract entries.

- Local Places list
  - Use Maps or Places search to find local businesses.
  - Good when you need a fast Google-based local seed.

- News-trigger list
  - Companies in recent news.
  - Funding, hiring, layoffs, launches, expansions, lawsuits, awards, partnerships.

- Product-launch list
  - News and organic results around "launches", "announces", "introduces", "raises".

- Hiring-search list
  - Search for job pages, careers pages, or job posts.
  - Then crawl with Spider Cloud.

- Review and complaint list
  - Search for phrases like:
    - `"alternatives to"`
    - `"problems with"`
    - `"reviews"`
    - `"complaints"`
  - Useful for market research, not always outreach.

- Forum and community signal list
  - Search Quora, forums, Stack Overflow, Hacker News, niche communities.
  - Reddit is not searched or scraped here: Claude's tools cannot read it, so it enters only as thread text an operator pasted with its URL (operator directive 2026-09-22).
  - Label forum content as opinion, not fact.

- Patent-based R&D list
  - Use Patents search for companies working on specific technologies.
  - Good for deep tech, manufacturing, AI, biotech, hardware.

- Scholar-based research org list
  - Find labs, universities, researchers, and companies tied to academic topics.
  - Good for research-heavy markets.

- Shopping seller list
  - Use Shopping search for brands, retailers, and product sellers.
  - Good for ecommerce and vendor analysis.

- Image result brand list
  - Find brands in visual-heavy categories.
  - Use carefully. Image results are noisy.

- Autocomplete demand list
  - Use autocomplete for pain terms and buyer language.
  - Better for market research and copy angles than direct prospecting.

- People-also-ask insight list
  - Extract common buyer questions.
  - Use to shape segmentation and messaging.

- Related-search expansion list
  - Use related searches to find market subcategories you missed.

- "Site search" list
  - Search inside target directories or platforms.
  - Example: `site:exampledirectory.com "category"`.

- SERP ownership list
  - Find companies ranking for valuable keywords.
  - Good for SEO, partnership, and competitive campaigns.

- Content gap list
  - Companies with weak content or missing pages in a category.
  - Needs Spider Cloud and manual QA.

## Tiny Features That Matter

- Search API gives fast URL discovery.
- News results create timing signals.
- Maps/Places can seed local business lists.
- Patents and Scholar are underrated for deep-tech prospecting.
- Related searches and PAA help reveal market language.
- Structured output saves manual scraping.

## Where It Can Fail

- SERP results are pages, not verified companies.
- Google ranking does not prove company fit.
- Search results are duplicate-heavy.
- You need Spider Cloud, Prospeo, A-Leads, or RevCode after Serper to make the list usable.
- Google results shift. Save query date and source URL.

---

# 10. Apify (OUT OF STACK, needs operator approval)

## What It Is

Apify is a web scraping and automation platform with many ready-made Actors. Its site says it has 32,000+ Actors, APIs, scheduling, integrations, MCP support, Google Maps lead generation, website crawling, social media scrapers, proxies, unblocking, and cloud deployment.

Apify is a toolbox, not one tool. Actor quality varies.

## Lead Lists You Can Build

- Google Maps business list
  - Category, rating, geography, phone, email, website, social profiles.
  - Similar use case to Scrap.io, but via Apify Actors.

- Local SMB lead list
  - Restaurants, clinics, trades, salons, real estate agencies, gyms, schools, law firms, accountants.

- Business review list
  - Extract ratings, review counts, review text, review recency.
  - Good for reputation, local SEO, customer experience, or operations offers.

- Social media profile list
  - Use Instagram, TikTok, Facebook, or other social Actors.
  - Extract profiles, follower counts, posts, bios, links, and engagement where supported.

- Social post engagement list
  - Find users who comment on or engage with relevant posts.
  - Quality depends heavily on actor and platform rules.

- Competitor audience list
  - Scrape public followers, commenters, likers, or profile mentions where tools support it.
  - High compliance and policy risk. Test carefully.

- Hashtag audience list
  - Instagram or TikTok profiles using specific hashtags.
  - Good for creator, ecommerce, local, event, or community markets.

- Creator or influencer lead list
  - Build by niche, follower count, recent content, engagement, geography.

- Ecommerce seller list
  - Scrape marketplaces, stores, product pages, and seller directories.
  - Good for ecommerce tools, logistics, payments, ads, review software.

- Amazon seller or product category list
  - Use Amazon-related Actors.
  - Extract product categories, brands, sellers, prices, reviews.

- Real estate listing and agent list
  - Scrape real estate platforms where allowed.
  - Extract agents, agencies, properties, locations, price ranges.

- Job board company list
  - Use Indeed or job-site Actors.
  - Extract companies hiring for specific roles.

- Website content crawl list
  - Use Website Content Crawler to turn pages into text for AI scoring.

- Public directory list
  - Crawl directories and associations.
  - Extract member companies and contacts.

- Event exhibitor list
  - Scrape event pages, sponsor pages, speaker pages, exhibitor directories.

- App marketplace list
  - Scrape app stores, plugin marketplaces, Shopify apps, WordPress plugins, HubSpot apps, Salesforce AppExchange, Chrome extensions.

- SaaS integration ecosystem list
  - Scrape integration directories.
  - Find companies building on or around a platform.

- YouTube channel or video-comment list
  - Build creator, educator, or niche audience lists.

- Podcast guest list
  - Scrape podcast pages or directories for guests and companies.

- Product Hunt launch list
  - Build recently launched tech company lists.

- Reddit topic list
  - Operator paste only: Claude's tools cannot read Reddit, and no Reddit scraper or Reddit API route is used (operator directive 2026-09-22). Someone reads the threads in their own browser and pastes the text with each thread URL; if nothing was pasted, Reddit is logged as unread.
  - Treat posts as opinion and context, not verified fact.

- Scheduled new-lead monitor
  - Run Actors daily or weekly.
  - Get new listings, new posts, new jobs, new reviews, or new companies.

- API-fed enrichment pipeline
  - Run Actor.
  - Export data to RevCode.
  - Enrich with A-Leads or Prospeo.

- CRM sync list
  - Push outputs through integrations to Google Sheets, Zapier, HubSpot, Salesforce, or other tools.

- AI-agent source list
  - Use Apify MCP so an AI workflow can call selected Actors.

## Tiny Features That Matter

- Actor marketplace gives breadth.
- Scheduling lets you monitor new changes.
- API access makes repeatable pipelines possible.
- Integrations reduce manual export steps.
- Proxies and unblocking help with harder sites.
- MCP makes it useful inside AI-agent workflows.

## Where It Can Fail

- Actor quality is uneven.
- A working Actor today can break tomorrow when a website changes.
- Platform terms vary by source site.
- Some social scraping is high-risk.
- You need sampling and QA before trusting outputs.
- Apify is great for extraction, but it does not decide your ICP.

---

# 11. Trigify (OUT OF STACK, needs operator approval)

## What It Is

Trigify is a social listening and signal intelligence tool. Its public pages say it captures professional and social signals, runs AI workflows, routes insights to teams, integrates with CRMs and sales tools, and supports platforms such as LinkedIn, X, Reddit, YouTube, and podcasts through its monitoring docs. Trigify docs describe signals, social workflows, and lead enrichment when a prospect shows intent.

This is best for timing and context. It is not a classic static database.

## Lead Lists You Can Build

- LinkedIn profile-engagement list
  - Track a public LinkedIn profile.
  - Capture people who like or comment on posts.
  - Enrich with role, seniority, and company data where available.

- Competitor-post engager list
  - Track competitor posts.
  - Pull people engaging with their content.
  - Good for warm outreach if the topic matches your offer.

- Thought-leader audience list
  - Track industry creators.
  - Find people repeatedly engaging with relevant topics.

- Brand-post engager list
  - Track your own company posts.
  - Turn warm engagement into outbound or CRM tasks.

- Influencer-audience list
  - Track paid or organic influencers in your category.
  - Build lead lists from people engaging with specific posts.

- Commenter-only list
  - Comments are stronger than likes.
  - Extract comment text for context.

- High-intent comment list
  - People asking for recommendations.
  - People complaining about a tool.
  - People describing a problem.
  - People comparing vendors.

- Competitor comparison list
  - Prospects mentioning a competitor in a buying context.

- Negative competitor sentiment list
  - People frustrated with a competitor.
  - Be careful. Vulture-style outreach can backfire.

- Buying-question list
  - Social posts where someone asks:
    - "What tool should I use for..."
    - "Does anyone know a good..."
    - "Looking for recommendations..."

- Reddit topic-intent list
  - Not a route in this flow: the only Reddit route is operator paste (someone reads the threads in their own browser and pastes the text with each thread URL; operator directive 2026-09-22), so a tool's subreddit tracking is not used.
  - Pasted threads can still show people or companies tied to a specific problem.
  - Reddit is opinion. Do not treat it as verified company data.

- X mention list
  - Track brand, competitor, category, or pain mentions.

- YouTube comment list
  - Track videos in your category.
  - Find engaged users and common objections.

- Podcast mention list
  - Track category conversations and guests.
  - Use for account research and timing.

- Social revenue attribution list
  - Connect social engagement to CRM contacts or accounts.
  - Useful for warm follow-up and attribution.

- Product-feedback lead list
  - People asking for features or complaining about gaps.
  - Good for product-led or competitive campaigns.

- Brand-mention surge list
  - Companies or people mentioning your brand more often.

- Sentiment-spike list
  - Detect sudden positive or negative movement around a topic.

- Risk-detection list
  - For PR, brand, product, or support teams.
  - Not every signal is a sales lead.

- Key-account monitoring list
  - Track target accounts and people.
  - Trigger alerts when they post, comment, change role, or mention relevant topics.

- New-role social signal list
  - Find people announcing a new role or position change.

- Event conversation list
  - Track hashtags, speaker posts, conference mentions.
  - Build accounts engaging around the event.

- Warm outbound sequence list
  - Use original post/comment as the reason for outreach.
  - This is where Trigify can beat cold static data.

- CRM auto-enrichment trigger list
  - When a prospect shows intent, enrich the CRM record.

- Workflow-triggered lead list
  - Signal detected.
  - Context analyzed.
  - Lead enriched.
  - Task or sequence created.

## Tiny Features That Matter

- Original post and comment context helps make outreach specific.
- Signals can have severity and category.
- Workflows can route to sales, marketing, product, support, or CRM.
- Social signals create timing, which static databases lack.
- LinkedIn engagement monitoring can create evergreen lead flow.

## Where It Can Fail

- A like is weak intent.
- A comment is stronger, but still not proof of buying.
- Social engagement lists go stale fast. Speed matters.
- The message must reference context naturally.
- Social scraping and enrichment need compliance review.
- Trigify should qualify leads, not replace ICP filters.

---

# 12. LeadsFriday (OUT OF STACK, needs operator approval)

Added: June 8, 2026

## What It Is

LeadsFriday (`leadsfriday.com`) is a pay-as-you-go B2B lead **extraction** platform. It scrapes contact and company records out of *existing* databases and platforms and exports them to CSV.

**Where it earns its place is extraction only, from these four sources:**
- **Crunchbase:** company data (company-only, not people)
- **StoreLeads:** Shopify / ecommerce stores
- **BuiltWith:** companies by web-visible technology
- **LinkedIn:** Company Followers and Public Group Members

The platform also markets email/phone waterfall enrichment, email verification, and other LinkedIn/Sales-Navigator scrapes. **Treat those as a separate decision that belongs to the `contact_enrichment` and `email_verification` slots**, not something you inherit by using the extraction side. Route enrichment and verification through whatever those slots are locked to, in the waterfall order recorded at `lead_data.contact_enrichment.notes`, per the `/email-waterfall` skill. Do not default to an extraction vendor's own waterfall just because you are already using it for extraction: if it is genuinely the better option, it should win the slot on its merits.

The site cites pre-compiled datasets (e.g. 3.5M+ Crunchbase companies, 3.5M+ Shopify stores). Treat every such count as a vendor marketing claim until you benchmark it on your own ICP.

**Where it sits in the stack:** LeadsFriday is a *low-cost extraction layer* (a cheap way to pull rows out of the five sources above), not a source-of-truth signal and not the contact-enrichment layer. Its distinctive pitch is price and no subscription: pay-as-you-go credits, minimum 10 credits to start.

**Pricing (vendor-stated, PAYG, verify before relying on it):**
- Crunchbase companies: ~\$3.50 per 1,000 companies
- LinkedIn company followers: ~\$3.00 per 1,000 followers
- (StoreLeads / BuiltWith / LinkedIn group members billed per result on the same credit system: confirm current rate in-app before a large pull)

Because it bills per result on a small floor, it is genuinely cheap for high-volume extraction, which is exactly why the discipline below matters. Cheap data tempts you to skip ICP and source logic. Don't.

## Lead Lists You Can Build

- Crunchbase company list
  - Pull companies (not people) by Crunchbase attributes for an account-based seed list, then enrich contacts separately through the usual contact layer.

- Shopify / ecommerce store list (StoreLeads)
  - Build a list of Shopify stores for ecommerce-tooling offers (retention, reviews, logistics, ads).

- Tech-stack list (BuiltWith)
  - Target companies by web-visible technologies. Same limitation as Prospeo/Wappalyzer. It sees web-visible tech only, not internal tools.

- LinkedIn company-followers list
  - Pull the followers of a competitor or category-leader company page.
  - Treat following as weak intent, not buying intent. Qualify before outreach.

- LinkedIn public-group-member list
  - Extract members of a relevant public LinkedIn group.
  - Same caution as Trigify-style social lists: group membership is context, not a buying signal.

Every one of these is a raw extract. Hand it to the usual pipeline: `/icp-prompt-builder` to qualify, the contact layer (A-Leads, then GetLeads §16, then BetterContact for the residue, verified by Deliverable.co; see `/email-waterfall`) to fill and verify emails, `/list-quality-scorecard` before upload.

## Tiny Features That Matter

- Pay-as-you-go with a low credit floor means you can test on a small batch before committing volume. Use that.
- Four extraction sources (Crunchbase, StoreLeads, BuiltWith, LinkedIn followers/group members) from one cheap tool reduces vendor-hopping for raw pulls.
- CSV export feeds straight into RevCode, `/icp-prompt-builder`, the contact layer, `/list-quality-scorecard`, and the locked sending-platform upload path.

## Where It Can Fail

- It scrapes *other* platforms (LinkedIn). That carries the same platform-TOS and account-risk exposure as any LinkedIn scraper. Third-party scraping is not risk-free. Treat it as a compliance decision, not a default.
- Its big database counts are marketing claims. Benchmark coverage and accuracy on a 25–50 row sample before scaling.
- Cheap per-result pricing makes it easy to over-pull volume and poison a campaign. The price is not a reason to skip ICP, source-signal, and QA logic.
- It is extraction-only for us. The output rows are unverified and often missing emails. They are not send-ready. Always route through the contact/verification layer before upload.
- Crunchbase is company-only here. You still need a contact layer for people.
- It is not account discovery. It will not tell you *which* companies to target. That's the primary spine (a DiscoLike case-study-seeded lookalike by default, or a broad ICP filter for net-new segments, with A-Leads as the enrichment layer; see `/tam-build`), augmented by Serper+Spider / GetLatka / the source signal.

## Cost-Governance Note

LeadsFriday is a paid, credit-based tool. Before any extraction run, route through `/api-cost-governance` to preview the USD/credit cost, check the balance, and block if under cost or the \$10 warning threshold. The same gate applies to every paid tool in this catalog, with no exceptions.

---

# 13. BetterContact (OUT OF STACK, needs operator approval)

Added: June 13, 2026

## What It Is

BetterContact (`bettercontact.rocks`) is a **waterfall** email and phone enrichment API. You hand it a person (name + company, or a LinkedIn URL), and it queries **20+ data providers in sequence** until one returns a work email and/or a mobile number, then runs the result through a 4-layer verification check and, on a **pay-only-for-valid** credit model, charges only when the data passes. The pitch is a higher find rate than any single provider (it claims 60–70% higher email find rates and ~88% phone discovery) for the same effort, because it aggregates many sources instead of betting on one. Treat those numbers as vendor claims until benchmarked on your own ICP.

This is a candidate for the **all-in-one waterfall at the Layer-2 contact step** (`/email-waterfall`). A multi-provider waterfall normally sits as the **residue-only fallback**, running after the primary finder rather than as the first call, but the actual position is whatever the contract records at `lead_data.contact_enrichment.notes`. It is not account discovery and not a lead source: it does not tell you *which* companies to target (that is the `company_discovery` spine, see `/tam-build`). It is the layer that turns a chosen person-row into a verified, sendable contact.

**What a waterfall like this is good at, versus a single-provider finder:** it queries many providers, so it usually beats any single provider's coverage; it runs its own check in the same call (a provider signal only, since the `email_verification` tool still performs the send-gate verification, per `/email-waterfall`); and pay-per-valid means you don't burn credits on misses. The trade is cost per row and latency, which is why single-provider finders normally run first and a waterfall cleans up the residue. Use a single provider instead when it returns the row more cheaply, when the operator prefers it, or when the row shape fits it better.

**Access: API plus script (no official MCP).** BetterContact ships a clean REST API. There is **no official BetterContact MCP server**, only third-party wrappers via Composio / Make / Pipedream, which add a dependency and their own cost. Per the repo's MCP-vs-scripts doctrine, bulk/async/resumable enrichment is a script job rather than an MCP call. A working script for this vendor (`bettercontact_enrich.mjs`) ships **parked** under `_vendor-library/scripts/`, outside the live `scripts/` directory, so it is not runnable as written until `/stack-setup` activates the matching pack. The flags described below document what that script does; they are not commands to run today.

- Base URL: `https://app.bettercontact.rocks/api/v2`
- Auth: header `X-API-Key: <key>` (env var `BETTERCONTACT_API_KEY` in `scripts/.env`)
- `GET /account` → credits balance + auth check (free)
- `POST /async` → submit 1–100 contacts (`enrich_email_address`, `enrich_phone_number` flags) → returns a request `id`
- `GET /async/{id}` → poll until `status` reaches `terminated` (lifecycle `not_started` → `in_progress` → `terminated`: the script waits through the first two); returns per-contact `contact_email_address` + `contact_email_address_status` (`deliverable` / `catch_all_safe` / `catch_all_not_safe` / `undeliverable`), `email_provider`, and phone when requested. Note: the live API does not echo `custom_fields` back, so the script joins results by batch index (with a count check)
- Free tier: 50 starter credits, enough to prove the pipeline end-to-end before committing budget.

## Lead Lists You Can Build

These are all *enrichment passes over an already-targeted person list*, not standalone sources:

- Verified-work-email fill list
  - Input: person rows (name + company/domain, or LinkedIn URL) with missing emails.
  - Output: verified work email + deliverability status, ready for the send file.

- Highest-coverage recovery list
  - Rows the primary `contact_enrichment` provider could not find an email for.
  - Run them through BetterContact's waterfall to recover the long tail before giving up on the row.

- Email + mobile multichannel list
  - Add `--phone` to also pull mobile numbers for a calling/SMS channel where legally allowed.
  - Higher cost and higher compliance risk. Use deliberately, not by default.

- Deliverability-classified list (still verifier-gated)
  - BetterContact's built-in self-check gives a first cut, separating likely-`valid` from catch-all/risky/undeliverable.
  - But the send-gate is the `email_verification` tool: re-verify the `valid` cut through it and feed only its `valid` (plus operator-approved catch-all) to the sequencer; route the rest to `leads.review.csv`. A finder's own self-check never substitutes for the verifier.

- Catch-all-resolved segment
  - BetterContact distinguishes `catch_all_safe` from `catch_all_not_safe`.
  - Treat `catch_all_safe` as review (not auto-send) and `catch_all_not_safe` as risky. The operator decides per list whether any catch-all is worth sending.

- CRM / stale-list refresh
  - Re-run an old contact list to recover dead emails with fresh waterfall data before a re-engagement campaign.

## Tiny Features That Matter

- Waterfall across 20+ providers in one call: higher find rate than any single source, no manual provider-hopping.
- Pay-only-for-valid: credits are not burned on misses, which makes the cost preview an upper bound, not the actual spend.
- Built-in 4-layer self-check: a useful provider signal, but **NOT the send-gate**. Per the universal-verifier rule, every email it sources is still re-verified through the `email_verification` tool before sending, exactly like any other finder's output.
- Async batch API (≤100/request) with poll-or-webhook: fits a deterministic, resumable script better than an interactive tool.
- **Per-account batches process in PARALLEL:** probed 2026-06-16: 6 concurrent batches ran with no `on_hold`/queue and ~3.5× effective speedup. `bettercontact_enrich.mjs --concurrency N` (default 4) keeps N batches in flight, so a multi-batch list finishes far faster than one-at-a-time. The real speed lever is `--concurrency`, not contacts-per-request (already capped at 100). The server's useful concurrency tops out ~3–4, and the 60 req/min API limit still holds (the pool polls well under it), so don't push past ~5 or run multiple instances (that risks the `on_hold` throttle). `--concurrency 1` = old strictly-sequential mode.
- `custom_fields` echo lets the script join results back to the exact input row; `bettercontact_enrich.mjs` falls back to an index join with a count check if the echo is ever absent.
- 50 free credits to benchmark before paying.

## Where It Can Fail

- It is enrichment, not discovery. It will not improve a bad ICP or a wrong target list. Garbage rows in, verified-garbage out.
- Find rate depends on the input quality; a clean `linkedin_url` or an exact `company_domain` lifts results well above a fuzzy company name.
- The waterfall takes minutes, not seconds. This is an async submit-then-poll flow, never a synchronous lookup. Build it as a two-step job (the script already does).
- Vendor find-rate claims (60–70% higher, 88% phone) are marketing until benchmarked on your ICP. Benchmark it properly rather than by feel: run this vendor and its alternatives against one frozen, dated sample, and score each on its **incremental unique correct contribution** over what the current stack already returns plus its **false-negative rate**, not on raw coverage. Method: **Benchmark A Vendor Before You Pay For It** above, from `eric-deliverability-doctrine.md` Part 2.
- Mobile numbers raise compliance and brand risk: only enable `--phone` when calling/SMS is appropriate and legal for that market.
- Per-contact credits are expensive at TAM scale: keep it on the live campaign slice (Layer 2), never the whole TAM.

## Cost-Governance Note

BetterContact is a paid, credit-based tool. Before any enrichment run, route through `/api-cost-governance` to preview the credit/USD cost (the `--dry-run` eligible-row count is the upper bound; pay-per-valid means actual spend is usually lower), check the balance, and block if the key is under cost or the \$10 warning threshold. The same gate applies to every paid tool in this catalog. If this vendor's parked script is ever activated, its `--max-credits N` flag is the hard pre-submit stop worth wiring into that gate.

## Credit Planning: Avoid the "On Hold" Trap

BetterContact runs on a **monthly credit allowance**, not a usage-based wallet, and it has **no auto-recharge**. The key rule: **never run out of credits while a run is in flight.** The moment credits hit 0, BetterContact parks enrichment requests as **"on hold"**, and held calls do **NOT** automatically retrigger when you add credits later. You must manually **Process** the on-hold queue in the API Cockpit, and processing still consumes credits. A balance that goes to 0 mid-run therefore strands the remainder of the batch.

Practical prevention (apply on every run and when sizing the plan):

- **Check the balance before you submit, top up before you hit the limit.** The step-0 `--credits` call is load-bearing; the script now also auto-checks the live balance before submitting: it aborts at a 0 balance and warns when the balance is below the eligible-row count, so it never silently creates an on-hold queue.
- **Plan around the monthly allowance.** Pricing tiers: Free = 50 one-time signup credits; **Starter \$15/mo = 200 credits; Pro \$49/mo = 1,000–50,000** (tiered); Enterprise \$799+/mo. Costing is **1 credit = 1 verified email, 10 credits = 1 verified phone**, pay-per-valid (only valid results charge). Unused credits **roll over, capped at your plan's monthly amount.** For recurring or high-volume sending, size the monthly plan above real volume rather than topping up reactively after each stall.
- **Respect the rate limits:** **60 requests/minute, ≤100 contacts per request.** The script's 100-row sequential batches stay well under this, but do **not** run multiple instances concurrently, which trips BetterContact's throttle (it queues batches as `on_hold`).
- **Estimate credits from volume.** If the operator gives a rough daily/weekly request count, compute the monthly credits needed (≈ verified-emails/mo + 10×verified-phones/mo, adjusted for the find rate) and recommend the matching plan tier so the account never runs dry.

---

# 14. Deliverable.co (OUT OF STACK, needs operator approval; FNNL's verifier of record is set in the stack contract)

## What It Is

Deliverable.co (`app.deliverable.co`, docs `docs.deliverable.co`) is an **A-Leads sub-product** and a candidate for the `email_verification` slot. Its distinguishing capability is that it is a **two-in-one** verifier: a single async call returns both `email_status` (`deliverable` | `undeliverable` | `risky` | `unknown`) **and** `is_catch_all` (boolean), covering deliverability AND catch-all/accept-all in one pass, so no separate catch-all tool is needed. That is the property `/stack-setup` tells the operator to ask about, because a verifier that collapses catch-all into valid or invalid will quietly inflate bounce rate. Whether Deliverable.co is the chosen verifier comes from the stack contract; there is no default.

## Where It Fits

Layer-2 **VERIFY** step in `/email-waterfall`: verify both (a) emails a row already has (verify-first) and (b) emails **any** finder just produced, whichever finder that was. The doctrine is slot-level, not vendor-level: **the configured `email_verification` tool is the send-gate for EVERY email source, with no exceptions.** A finder's own internal waterfall self-check is a provider signal, not a substitute for verification, so its output is re-verified exactly like any other finder's. A verifier does NOT find emails (that is the finders' job) and is NOT a lead source.

## How To Run It

A working integration script for this vendor (`deliverable_verify.mjs`, zero-dependency Node, reading a `DELIVERABLE_API_KEY` from `scripts/.env`) ships **parked** under `_vendor-library/scripts/`, outside the live `scripts/` directory. It is not runnable as written until `/stack-setup` activates the matching pack. What it does, as a description of the capability shape a verifier integration needs:

- A `--check` mode for connectivity (verifies one address; there is no balance endpoint).
- A `--verify <email>` mode for one email.
- A CSV mode (`[--email-col x] [--out y] [--concurrency 8] [--max N]`) verifying every email via the **single-async parallel** path (fast), writing a `.deliverable.csv` with the canonical `email_status` (the gate: `valid`/`catch_all`/`invalid`/`risky`/`unknown`/`no_email`, which is what the rest of `/email-waterfall` reads) plus `is_catch_all` / `deliverable_raw_status` / `verified_by` columns and a gate-count summary.
- A `--bulk <input.csv>` mode for the bulk-file endpoint (upload, poll, download). **Only for very large unattended jobs**, because the bulk queue is slow. A job can be re-polled with `--bulk-status <file_id>`.

## API

Base `https://api.deliverable.co/gateway`, auth header `x-api-key`. Single: `POST /verify/single {email}` → `task_id`; poll `POST /verify/single/status {task_id}` → `{processing_status, email_status, is_catch_all}`. Bulk: `POST /verify/bulk` (multipart `file`+`fileName`, ≤25MB, one email/line) → `file_id`; poll `POST /verify/bulk/status {file_id}` → `{status, download_url}`; list `GET /verify/bulk/files?page&pageSize`. Errors: 400 / 401 / 402 / 413 / 429. **No balance/credits endpoint:** a `402` means out of credits / expired.

## Gate Mapping (catch-all OVERRIDES deliverable)

A catch-all "deliverable" is NOT clean valid:
- `deliverable` + `is_catch_all:false` → **valid** (send-safe)
- `deliverable` + `is_catch_all:true` → **catch_all** (review / operator-approved only)
- `undeliverable` → **invalid**
- `risky` → **risky** · `unknown` → **unknown**

Send only `valid`. `catch_all` / `risky` / `unknown` → review; `invalid` / no-email → BetterContact residue (per `/email-waterfall`).

## Tiny Things That Matter

- **Single-async is fast; bulk is a slow queue.** Live test: 3 emails via single-async finished in <10s; a 3-email bulk file was still `pending` after 5+ minutes. Default to single-async for campaign slices; use `--bulk` only for very large unattended jobs.
- **No balance endpoint:** you cannot pre-read credits, so `--check` is connectivity only and a `402` mid-run = out of credits. Top up at `app.deliverable.co`.
- It correctly flags catch-all domains that a plain deliverability verifier calls "valid" (e.g. stripe.com → `deliverable` + `is_catch_all:true`). That is the whole point: never auto-send a catch-all "deliverable" row.

## Cost-Governance Note

Deliverable.co is paid / credit-based with no balance API. Route a slice through `/api-cost-governance` (preview row count × per-email rate); since there is no balance read, the gate is a connectivity `--check` plus handling a `402` as "out of credits."

---

# 15. LeadMagic (premium signal enrichment; OUT OF STACK, needs operator approval)

## What It Is

LeadMagic is a B2B signal-enrichment API with four endpoints relevant to this flow: **Ads Intelligence** (Google / Meta / LinkedIn ads running, plus some spend estimates), **Jobs Data** (10M+ postings, daily refresh, full JD content), **Profile Search** (structured work history, education, certifications, follower range at 1 credit/profile, and email-to-profile matching), and a **Job Change Detector** (batch-check known LinkedIn URLs for company moves, 3 credits/contact). LeadMagic is also the company behind the Smartlead sending platform; this entry is the **separate enrichment product**, not the sender.

## What It Would Add, And What Already Covers It

LeadMagic is a premium shortcut: faster and cleaner per signal, at a per-credit price. It is worth evaluating only against what the already-filled slots cover, because **every signal it handles has a cheaper composite path built from `search`, `crawl`, and Claude Code sub-agent extraction** (in FNNL, WebSearch, WebFetch and sub-agents; no AI model on any API key, operator directive 2026-09-22):

- **Ads Intelligence** → an ad-library / transparency scraper, or a `crawl` plus sub-agent extraction pass (§10, §7). LinkedIn Ads is the one piece a generic crawl path does not replicate.
- **Jobs Data / JD content** → `search` to find the ATS URL (`site:lever.co` / `greenhouse.io` / `workable.com "[company]"`), `crawl` to fetch it, a sub-agent to extract the pain-language copy variable (§9, §7). A contact database's job-posting filters handle the targeting layer.
- **Profile / work history** → `crawl` in JS-render mode on the profile plus a sub-agent extraction, with a cheap description-field pre-filter so you only crawl the flagged rows (§2, §7).
- **Job Change Detector** (known warm list) → continuous monitoring from the `intent_signals` tool, or saved-lead alerts from a LinkedIn-first contact source (§11, §3).

The full with/without-LeadMagic recipe per signal is in `signal-strategy-playbook.md`.

## What Would Justify Choosing It

High volume where the per-row composite crawl cost and rate-limit risk exceed LeadMagic's per-credit price: email-to-profile matching on a large email-only list (a crawler needs a profile URL as input, whereas LeadMagic matches the email directly), or a one-time job-change batch-check across 2,000+ archive contacts. Below that volume, the composite path usually wins on cost. That is a slot decision for `/stack-setup`, and any spend routes through `/api-cost-governance`. Before it is stacked on top of the primary provider, benchmark it for incremental unique contribution on a frozen sample per **Benchmark A Vendor Before You Pay For It** above: a second or third provider has to recover records the primary actually misses, or it is only adding cost.

---

# 16. GetLeads

Added: July 17, 2026

## What It Is

GetLeads is a B2B contact database plus a **signal** layer, reached over an authenticated MCP connector. Two things earn it a section rather than a line in the contact-layer list:

1. **`count_contacts` returns an exact count without revealing a record.** That makes it an unusually cheap sizing tool, and a **department-size proxy** when scoped by `domains[]` + `job_functions[]` (company-level aggregate, no per-contact reveal). It has returned `credits_used: 0` in tests, but GetLeads is never free: the count runs on the plan and its fair use (`get_fair_use`), search, export and enrichment draw plan credits, and paid scrapes draw wallet cash. Exact counts are rare, so a tool that offers one is worth weighing for `contact_discovery` on that basis alone.
2. **It carries signals few tools return as a first-class feed:** funding rounds, acquisitions, LinkedIn engager monitoring, and company-page follower scrapes. Reconstructing those from a news scrape is materially worse, so check whether the `intent_signals` slot already covers them before building a workaround.

Its place in each field's order is set in `outbound/reference/provider-routing.yaml`, never here: since 2026-10-06 (operator directive, see `standing-rulings.md` `discovery-flow`) it runs the full company export on the refined AI Ark search (rolled up to one row per company domain), the people search at the companies that passed fit, and the first email rung (by LinkedIn URL). The exhaust-then-gap-fill ordering governs wherever it sits: run the earlier rung across the survivor set first, then route only the still-blank cells onward.

## Access

**MCP connector, OAuth.** GetLeads authenticates over MCP OAuth rather than an API key, so it has **no `.env` entry at all**. That matters for a general reason: for an OAuth-based connector, absence from `scripts/.env` says nothing about whether the tool is available. Check the stack contract and the connector's own auth state, and do not go hunting for a key that would never exist.

Two calls establish whether it is usable, and both are worth running before anything else: `getleads_health` (expects `{"ok": true}`) and a `count_contacts` call with a narrow filter, which should return a count and thereby prove the auth and the count behavior together (record the `credits_used` it reports; never assume it).

## Billing: TWO separate balances (this causes a recurring misdiagnosis)

Read this before reporting any GetLeads balance problem. There are **two independent balances**, and confusing them produces a confident, wrong "we are out of credits."

| | **Plan credits** | **Prepaid wallet cash** |
|---|---|---|
| Pays for | Contact search, export, enrichment | **Paid scrapes only:** profile monitoring, company followers |
| Read via | `count_contacts` (`creditsRemaining`), `getleads_contacts_health` | `get_wallet_balance` |
| When empty | Search / export fail | `insufficient_wallet_cash` on scrapes. **Search and export are unaffected.** |

Three rules that follow:

- **`creditsRemaining: null` means UNLIMITED, not zero.** Unlimited-plan accounts report `null`. Never read `null` as "out of credits."
- **Never report "out of credits" from the wallet balance.** A \$0 wallet says nothing at all about search or export.
- **The two move independently.** The classic failure state looks like this: a healthy finite plan-credit balance (a finite number means the account is not on the unlimited plan) sitting alongside a **\$0.00 wallet with auto-top-up off**. Contact search and export work fine, while a profile-monitoring or company-followers scrape fails `insufficient_wallet_cash`. That is precisely the state that generates the false "out of credits" report. Always read both numbers live before diagnosing; neither is ever a standing fact.

## Lead Lists You Can Build

- **Filter-sizing pass (run before any search or export spend)**
  - `count_contacts` returns exact `total_matching` plus `exportable_rows` (capped at `max_export_rows`, default 50k per export).
  - Size a slice, test a filter, or sanity-check a segment's reach before committing to it, with no record revealed. (For launch eligibility, the governing floor is company-level and owned by `/campaign-strategy`. Read it there rather than assuming a contact count clears it.)

- **Department-size / org-depth list (count only)**
  - Scope `count_contacts` by `domains[]` + `job_functions[]` (or `seniority[]` / `personas[]`) for a company-level department count with no per-contact reveal.
  - `where_sql` reaches the org role-count columns directly, e.g. `MARKETING_ROLE_COUNT_ORG >= 5`.
  - This is a count-only substitute for the premium company-level aggregate the playbook assumes (Layer 1 above), and it is why `signal-strategy-playbook.md` §2's "Prospeo exclusive" claim should be re-tested rather than believed.

- **Funding-signal list** (`list_funding_signals`)
  - Recently funded companies as a first-class feed, rather than reconstructing it from a news search.
  - Funding is a why-now trigger, not buying intent. It can equally mean hiring chaos (see Hard Truths).

- **Acquisition / M&A signal list** (`list_acquisition_signals`)
  - Companies in an acquisition event. Strong for integration, migration, consolidation, and RevOps offers.
  - Few tools expose this as a ready-made feed, so it is worth checking the `intent_signals` slot before assuming you have to reconstruct it.

- **LinkedIn engager list** (`add_monitored_profile`, then `list_profile_monitoring_leads`)
  - Monitor a profile and collect who engages with its posts, with backfill across existing posts.
  - Overlaps any other competitor-engager motion (Trigify, §11, is OUT OF STACK, needs operator approval). Same caution: **a like is weak intent.**
  - Paid scrape billed to the **wallet**. Vendor-stated ≈\$0.012 per engager. Price it with `estimate_scrape_cost` first.

- **Company-followers list** (`lookup_company_linkedin_followers`)
  - Followers of a competitor or category-leader page. (LeadsFriday's follower extract, §12, is OUT OF STACK, needs operator approval.)
  - Paid scrape billed to the **wallet**. Vendor-stated ≈\$0.0035 per follower with a ≈\$8.75 minimum. Confirm with `estimate_scrape_cost`.

- **Domain-to-people list** (`search_contacts` + `domains[]`, or `getleads_lookup_colleagues_by_domain`)
  - A known account list to named contacts. Size it with `count_contacts` first.

- **Email / LinkedIn cross-fill** (`getleads_get_emails_from_linkedin_batch`, `getleads_get_linkedin_urls_from_emails_batch`, `getleads_enrich_person_batch`)
  - Fill a missing email from a LinkedIn URL, or the reverse. This is the sanctioned backfill direction: enriching a row you already hold, never discovering a new contact from a search snippet.
  - Every email still passes through the `email_verification` tool before sending. No source is exempt.

## Tiny Features That Matter

- **`count_contacts` is exact and reveals no record.** Run it before `search_contacts` / `export_contacts`, every time. This is the highest-leverage habit with this tool.
- **`estimate_scrape_cost` prices a paid scrape before it runs.** Use it as the `/api-cost-governance` preview for monitoring and follower pulls.
- **`recommend_filters`, `get_available_values`, `get_available_columns`** resolve valid filter values instead of guessing (an unknown `personas` value errors with the valid list).
- **`where_sql`** reaches catalog columns the curated filters do not expose, AND-combined with them.
- **Search-time filters worth knowing:** `founded_year`, `total_funding`, `revenue`, `technologies`, `employees`, `industries`, `followers`, `monthly_traffic`, `entity_types`, `has_web_app` / `has_mobile_app`, `skills`, geography, plus `email_status` (`VALID` / `CATCH_ALL` / `INVALID`), `require_email`, `require_phone`. Note `email_status` takes `VALID`, never "verified".
- **`configure_auto_topup`** exists for the wallet. Leave it off unless the operator asks: it is standing spend.

## Where It Can Fail

- **The two-balance confusion is the number-one failure.** See the billing table. It reads as a hard outage and is usually just an empty wallet.
- **`job_titles` is a substring text-match and over-matches.** It catches "Assistant to CEO", "Owner's Representative" (a real AEC job function, not ownership), and "Owner at [a different company]". Always post-filter a title substring match before treating it as a seniority filter.
- **A strict founder/owner/CEO title search understates coverage**, especially in AEC and professional services where the boss is titled President or Principal. Size the wider-title gap with `count_contacts` before concluding the data is not there.
- **Use `search_contacts` for batch domain+title work, not `lookup_decision_makers`**, which is single-domain-or-browser-upload only (its batch link needs a manual CSV upload in a browser, so it is not hands-free).
- **Its account discovery is a people search rolled up.** In the company discovery order it runs the full export on the refined search (operator directive 2026-10-06, see `standing-rulings.md` `discovery-flow`), and the companies it finds are the distinct domains on its contact rows, so a company with no title-matching person never shows up. The discovery route is the filter build by default, a lookalike only as the exception (`/tam-build` filter-first discovery).
- **The prices above are vendor-stated**, like every other number in this file. Verify with `estimate_scrape_cost` before relying on them.
- **A like or a follow is not buying intent.** Engager and follower lists need qualification before outreach (see Hard Truths).

## Cost-Governance Note

Two balances means two gates. **Contact search / export / enrichment:** run `count_contacts` first and treat it as the row-count preview, then route through `/api-cost-governance` before `search_contacts` / `export_contacts` spends plan credits. **Paid scrapes (profile monitoring, company followers):** preview with `estimate_scrape_cost` and check `get_wallet_balance` live. If the wallet is empty or below the estimate, the scrape stops and asks for an operator-approved top-up first (`create_topup_link`, `/tool-balance-guard`); no other tool stands in for it. Do not enable auto-top-up to route around that gate, because it converts a per-run approval into standing spend.

---

# High-Value Combo Recipes

These are stronger than using tools one by one.

> **Read the tool names below as roles, not as routing.** These recipes were written against a particular set of vendors. The **recipe shapes are the IP and they still hold**; the names are placeholders. Substitute per slot: a contact-database step means whatever fills `contact_discovery`, an email-filling step means `contact_enrichment` run primary-first then gap-filled, and every email lands at the `email_verification` tool before sending. If a named tool is not what a slot is locked to, do not reach for it, and if the slot is empty, stop and route the operator to `/stack-setup`. Any named tool outside `approved_stack` is OUT OF STACK, needs operator approval: a research note, never a default path.

## Combo 1: Tech-Stack ABM List

Use when selling a tool that replaces, integrates with, or improves another tool.

- Find accounts:
  - Prospeo technologies
  - A-Leads technologies
  - DiscoLike vendor data
- Enrich contacts:
  - Prospeo or A-Leads
- Process:
  - RevCode
- Optional timing:
  - Trigify competitor mentions
- Output:
  - Companies using target tech
  - Buyer contacts
  - Reason for fit
  - Verified email
  - Risk label

Example lists:

- Shopify stores using Klaviyo.
- HubSpot users hiring RevOps.
- Salesforce users with small sales teams.
- WordPress businesses with slow sites.
- Companies using competitor chat widgets.

## Combo 2: Local SMB Opportunity List

Use when selling to local businesses.

- Find businesses:
  - Scrap.io or Apify Google Maps
- Crawl sites:
  - Spider Cloud
- Score:
  - RevCode
- Enrich:
  - A-Leads, Prospeo, or generic site contacts
- Output:
  - Business name
  - Category
  - Location
  - Phone
  - Email
  - Website problem
  - Rating/reviews
  - Outreach angle

Example lists:

- Dentists with weak websites and many reviews.
- Restaurants with strong reviews but no online booking.
- Law firms with no clear CTA.
- Med spas with Instagram but poor website conversion.
- Contractors with no email listed but active phone.

## Combo 3: SaaS Growth Account List

Use when selling to SaaS companies.

- Find accounts:
  - GetLatka
- Add ICP filters:
  - ARR, growth, funding, category, pricing, geography
- Enrich people:
  - Prospeo or A-Leads
- Add social timing:
  - Trigify
- Process:
  - RevCode

Example lists:

- AI SaaS companies growing 100%+ YoY.
- Bootstrapped SaaS companies above \$10M ARR.
- Seed to Series A SaaS hiring sales roles.
- PLG SaaS with freemium and high user count.
- Enterprise SaaS with high ACV and new funding.

## Combo 4: Social Intent Outreach List

Use when timing matters more than static firmographics.

- Find signal:
  - Trigify
- Enrich:
  - Prospeo or A-Leads
- Add account context:
  - Serper, Spider Cloud, or DiscoLike
- Process:
  - RevCode

Example lists:

- People commenting on competitor complaint posts.
- Prospects asking for tool recommendations.
- Engagers on thought-leader posts about your category.
- Target accounts posting about a new initiative.
- New role announcements from ICP buyers.

## Combo 5: Search-to-Account Research List

Use when there is no clean database filter for the market.

- Discover pages:
  - Serper
- Extract companies:
  - Spider Cloud or Apify
- Clean and dedupe:
  - RevCode
- Enrich contacts:
  - Prospeo or A-Leads

Example lists:

- Companies with "SOC 2 automation" pages.
- Agencies with Shopify Plus partner pages.
- Vendors listed in niche association directories.
- Event sponsors in a specific industry.
- Companies publishing competitor comparison pages.

## Combo 6: Stale CRM Revive List

Use when old data exists but quality is unknown.

- Input:
  - Old CSV or CRM export
- Validate domains:
  - DiscoLike
- Enrich people:
  - Prospeo or A-Leads
- Verify emails:
  - WizLeads, Prospeo, or A-Leads
- Score and suppress:
  - RevCode

Output segments:

- Ready to send.
- Needs manual review.
- Missing decision-maker.
- No verified email.
- Bad company fit.
- Suppressed.

---

# Best List Ideas To Build First

If you want practical starting points, build these before chasing weird edge cases.

> **Read the tool names below as roles, not as routing.** Whether any named entry is buildable depends entirely on which tools fill the slots. Translate as you read: a verified-email list by title/industry/size comes from `contact_discovery` plus `contact_enrichment`, sized first with an exact count where the tool offers one. For the timing ideas, job-change and new-in-seat come from a tenure field (`job_duration_months`-style) on the contact database, funding and M&A from `intent_signals`, and news triggers from `search`. Headcount-growth-rate targeting often has **no search-time path at all** (see the capability-gap note near the top), because a growth-metrics enricher only enriches a list you already hold. Any named tool outside `approved_stack` is OUT OF STACK, needs operator approval: a research note, never a default path.

## Best For Cold Email

- Prospeo verified-email list by title, industry, company size, and buying intent.
- A-Leads verified contact list by role, location, industry, and technology.
- WizLeads Sales Navigator scrape with email verification and catch-all separation.
- DiscoLike lookalike account list enriched with Prospeo contacts.
- GetLatka SaaS account list enriched through Prospeo or A-Leads.

## Best For Local SMB

- Scrap.io category plus city list.
- Scrap.io polygon list around high-value neighborhoods.
- Apify Google Maps list with reviews and website data.
- Scrap.io no-website list.
- Scrap.io low-review or weak-rating list, then manually QA before outreach.

## Best For SaaS

- GetLatka high-growth SaaS by category.
- GetLatka bootstrapped \$10M+ ARR list.
- Prospeo funded SaaS with target department headcount growth.
- Prospeo companies hiring target roles.
- DiscoLike natural-language ICP for SaaS subsegments.

## Best For Timing

- Prospeo job-change list.
- Prospeo job-posting list.
- Prospeo buying-intent list.
- Trigify competitor-engagement list.
- Serper news-trigger list.

## Best For Weird Niches

- DiscoLike website phrase-match list.
- DiscoLike natural-language ICP list.
- Serper search-result seed list.
- Spider Cloud directory extraction list.
- Apify niche directory Actor list.

---

# Feature-To-List Map

Use this when you know the signal you want but not the tool. Any named tool outside `approved_stack` is OUT OF STACK, needs operator approval: a research note, never a default path.

## If You Need Contact Data

The live order is `layers.people_discovery` and `layers.email` in `outbound/reference/provider-routing.yaml`; read it there, never from this list. The shape is the first rung exhausted, then the next rung on still-blank cells, and every email checked by the verifier of record.

- The first rung in `layers.people_discovery`, called first and exhausted across the whole survivor set. Size any pull with an exact count before you spend, where the tool offers one (e.g. GetLeads `count_contacts`, §16)
- Its `parallel_if_fast` source, only when fast and deduped by person: a parallel source, never a gap-fill rung for still-blank cells (operator directive 2026-10-06, see `standing-rulings.md` `discovery-flow`)
- OUT OF STACK, needs operator approval: a waterfall `contact_enrichment` provider for the residue (e.g. BetterContact: 20+ providers, pay-per-valid, finds and pre-checks work email / mobile in one call)
- OUT OF STACK, needs operator approval: a cheap bulk extractor for *raw* contact rows from its supported sources only (e.g. LeadsFriday: unverified, no emails attached, so enrich and verify downstream)

## If You Need LinkedIn Sales Navigator Data

- WizLeads

## If You Need Local Business Data

- Scrap.io
- Apify
- Serper Maps/Places

## If You Need Website Text Signals

- DiscoLike
- Spider Cloud
- Serper plus Spider Cloud

## If You Need SaaS Revenue Or Growth

- GetLatka

## If You Need Social Intent

- Trigify
- Apify social Actors
- Serper for public forum discovery

## If You Need Custom Workflow Logic

- RevCode

## If You Need Search Discovery

- Serper
- Spider Cloud search
- Apify Actors

## If You Need Repeatable Automation

Automation depends on one thing: whether the chosen tool exposes an API or MCP connector that this flow can actually call. Tools in this catalog that do (illustrative only, none chosen for FNNL): RevCode, Apify, A-Leads MCP, GetLeads MCP (§16), BetterContact API (async email/phone enrichment plus verification), Deliverable.co API (verification, §14), Serper API, Spider Cloud API, DiscoLike API.

**The general rule matters more than any list:** a tool with a web UI but no API can still be driven by hand, it just cannot be scripted in this flow. So before promising automation for a step, check that the slot's tool has a callable surface and that the credential for it resolves (`/preflight-credentials`). Prospeo, WizLeads, Scrap.io, and Trigify are examples of tools that are commonly used through their UI. Never tell the operator a step is automated on the strength of a tool being named: status `chosen` in the contract is a record, not a proven call.

---

# Hard Truths Before You Build

- More filters do not mean better targeting.
- More rows do not mean more replies.
- "Verified email" does not mean "good buyer."
- "Intent" does not mean "ready to buy."
- "Uses competitor" does not mean "wants to switch."
- "Liked a post" does not mean "book a meeting."
- "Has no website" does not mean "has budget."
- "Recently funded" can mean buying, hiring, or total chaos.
- "High growth" can mean budget, but also no time to talk.
- Every list needs a reason for fit and a reason for timing.

## Minimum QA Before Sending

For every list, sample at least 25 rows and check:

- Is the company real?
- Is the domain correct?
- Is the person still at the company?
- Is the title a real buyer title?
- Is the email verified?
- Is the company in the right geography?
- Is the company in the right size range?
- Does the signal actually support the message?
- Is the outreach legal and acceptable for that market?
- Would the first line sound normal if the buyer read it out loud?

If the answer is no, fix the list before writing copy.

---

# Quick Tool Ranking By Use Case

These are rankings by **fit**, a market judgment about which tool is best suited to a job. They are not a statement of what FNNL has. The tool actually chosen for each capability slot comes from `outbound/stack-contract.yaml`; where a ranking and the contract disagree, the contract wins, and an empty slot means stop and route the operator to `/stack-setup`. Any named tool outside `approved_stack` is OUT OF STACK, needs operator approval: a research note, never a default path.

## Best Account Discovery

1. The filter build in the `layers.company_discovery` order of `provider-routing.yaml` (the default; `/tam-build` filter-first discovery)
2. GetLeads funding and acquisition feeds (§16), when the trigger itself is the discovery signal
3. A lookalike only on `/tam-build`'s exception route, through the tool `layers.company_discovery.lookalike` names
4. OUT OF STACK, needs operator approval: DiscoLike, GetLatka for SaaS only, Serper plus Spider Cloud, Scrap.io for local businesses

## Common Person And Contact Data Options

Use only after the source-of-truth signal is chosen. These are contact layers, not default lead sources.

The ranking is by position in the waterfall, not by vendor preference:

1. The first rung in `layers.people_discovery` (`provider-routing.yaml`): the first call, exhausted across the whole survivor set
2. Its `parallel_if_fast` source, only when fast and deduped by person, never a gap-fill rung (operator directive 2026-10-06, see `standing-rulings.md` `discovery-flow`); size every pull with an exact count where available (e.g. GetLeads `count_contacts`, §16)
3. OUT OF STACK, needs operator approval: a waterfall `contact_enrichment` provider for the residue (e.g. BetterContact: all-in-one email/phone finder plus verification across 20+ providers, pay-per-valid; `/email-waterfall`)
4. OUT OF STACK, needs operator approval: a cheap bulk extractor for raw contact rows from its supported sources only (e.g. LeadsFriday: extraction-only, unverified output, enrich and verify downstream, and weigh scraping-TOS risk)

## Best Local Lead Source

1. Scrap.io
2. Apify Google Maps Actors
3. Serper Maps/Places

## Best Social Intent

1. Trigify
2. Apify social Actors
3. Serper for public discovery

## Best Workflow Builder

1. RevCode
2. Apify for scraper automation
3. Prospeo, Scrap.io, WizLeads, Serper, and Spider Cloud APIs as inputs

## Best "Find Something Other Databases Miss"

1. DiscoLike
2. Spider Cloud
3. Serper
4. Apify

---

# Final Practical Recommendation

Do not build one giant universal lead list.

Build separate lists by source and signal:

Each list type below names the slot that builds it. Tools in parentheses are illustrative only, none chosen for FNNL.

- Static fit list:
  - `company_discovery` plus `contact_discovery`: the filter build in the `provider-routing.yaml` order by default (GetLeads §16 is one rung), a lookalike only on `/tam-build`'s exception route. A SaaS-revenue database is OUT OF STACK, needs operator approval.

- Timing list:
  - `intent_signals` for funding and acquisition feeds (e.g. GetLeads §16), a tenure field on `contact_discovery` for new-in-seat (`job_duration_months`-style), and `search` for news triggers.

- Local list:
  - `company_discovery` in local mode (the company search tool's geo and keyword filters; Scrap.io, Apify and a search API's Places endpoint are OUT OF STACK, needs operator approval).

- Website signal list:
  - `crawl` plus `search` (in FNNL the harness's WebFetch and WebSearch; Spider Cloud, DiscoLike and Serper are OUT OF STACK, needs operator approval).

- Final processing:
  - The workflow layer: the list workbench by default (rows pushed in by its inbound webhook, zero workbench credits), the session natively as fallback, or a spreadsheet-style workspace (e.g. RevCode).

The strongest lead list is not the biggest one. It is the one where every row has:

- clear buyer fit
- clear contact path
- clear reason now
- clear reason your offer belongs in the conversation

That is the bar. Anything below that is just spreadsheet decoration.

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short: record status, not raw output. Full protocol: `client-activity-log.md`.
