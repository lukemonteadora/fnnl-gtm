# Signal Strategy Playbook: Timing and Context Signals, and How to Obtain Them

> **What this is.** The canonical reference for the eight timing/context signals this cold-outbound flow can slice campaigns on, plus each signal's campaign slices, copy angles, and acquisition paths. Skills read it; it is not itself a skill. Resolve any skill reference to `signal-strategy-playbook.md` here under `outbound/`.
>
> **How it maps into the live skills** (the runnable extracts live in the skills; this doc is the superset):
> - **Copy Rules (the six observational-opener failure modes)** below are ALREADY enforced in `/campaign-copywriting` (Signal-First Anti-Patterns), `cold-email-copy-best-practices.md` (Opener Standards), and `/spam-word-checker` (Observational Opener Bans). (`/personalization-subagent-pattern`'s per-contact generation prompt, once a fourth home, was archived on 2026-09-21 with per-contact copy.) They are repeated here so the playbook is self-contained; the skills are the enforcement home.
> - **The eight signals' campaign slices + the five combos + Build Priority** → `/campaign-strategy` (Signal-Driven Slice Library).
> - **The eight signals' copy angles + per-signal caveats** → `/campaign-copywriting` (Signal Angle Library).
> - **The signals as data points** (what to collect, obtainability) → `/data-point-discovery`, collected at `/tam-build` Layer 1 and `/email-waterfall` Layer 2.
> - **Acquisition paths / tool routing** → `/lead-list-tech-stack-research`.
>
> **Tool-status note (FNNL Agency).** Read this before acting on any tool name below. This playbook was written against a **previous company's tool stack**, and it still names that company's tools throughout (Prospeo, LeadMagic, A-Leads, DiscoLike, Spider Cloud, Serper, Apify, DeepSeek, WizLeads, Trigify and the rest). **FNNL Agency has not chosen its tools yet. None of these is in use here, none is keyed, and none is a default.** Treat every brand name in this doc as an illustrative example of a tool that could fill the capability being described, never as a statement about what FNNL has.
>
> **The live answer for any capability is `stack-contract.yaml`**, which ships with every slot at `tool: null`, `status: not_chosen`. Before running a path below, read the matching slot (`lead_data.contact_discovery`, `lead_data.contact_enrichment`, `web.crawl`, `web.search`, `ai.bulk_classification`, and so on). If the slot you need is still empty, stop and run `/stack-setup` rather than assuming a vendor. A slot marked `chosen` is not yet proven; only `live` means a real call against FNNL's own account has succeeded.
>
> **What survives the stack change is the whole point of this doc:** which buying signals are worth chasing, what each one proves, how to detect it, what it costs to obtain, and what no substitute path can give you. That reasoning is tool-independent. Only the routing is not.
>
> **Copy-template note.** The example opener lines below are the faithful source archive and may contain em-dashes. The **runnable, normalized** versions (em-dashes replaced with a period or comma per the absolute no-em-dash rule, and the `[First name] —` lead rendered as `[First name],`) live in `/campaign-copywriting` (Signal Angle Library). Generate from the skill, not from this archive.
>
> **Opener-doctrine reconciliation (2026-07-17). Read this before lifting any example line below.** Every example opener in this doc puts the signal in the first line. That is the **signal-first opener, and it is RETIRED (2026-07-17)**, superseded by the offer-led opener (`/campaign-copywriting` Hard Rule 19: Line 1 leads with the offer itself, the dream outcome made specific plus the risk reversal). Both flat statements of "the signal is the opener" (in Copy Rule 4, and in the Job-change section's rules) are retired with it. **What this doc is still for, and why it stands:** the signals themselves, their campaign slices, and their ANGLE logic (what a signal means, which pain to lead with for that slice, which proof that slice will recognize). All of that is live. **What no longer applies:** its lines as openers. Signals now drive TARGETING, meaning which slice gets which campaign and offer. A slice-SHARED signal fact may ride inside the offer sentence when it is true of every contact in the slice (Hard Rule 38), never in Line 1, and per-contact signal copy is retired (Hard Rule 34). **The six Copy Rules below are unaffected and stay in force:** the observational-opener ban and the implication test never depended on where the signal sits, so read those examples for the TEST, not for the opener shape. Enforcement home: `/campaign-copywriting` (Signal-First Anti-Patterns, live).

*Routing reference: `/lead-list-tech-stack-research` decides which tool actually fills a capability for a given client, against `stack-contract.yaml`. Every acquisition path below is described as a capability first, with named tools only as examples of what can fill it.*

---

## Copy Rules (Read Before Writing Any Email)

Every example in this doc follows the same framework. Learn the pattern so you can apply it to any signal, not just these eight. (These six rules are the enforcement-home doctrine in `/campaign-copywriting` Signal-First Anti-Patterns; the implication test governs all of them.)

**1. No observational openers.**
Do not write "I saw / I noticed / I came across." Lead with the signal as a stated fact, then extract what it means.

- Wrong: "I saw [Company] is hiring SDRs."
- Right: "[Company] has [N] SDR roles open right now. That usually means the pipeline engine is being built from scratch."

**2. Do not compliment the signal.**
The signal is a fact, not a gift to the prospect. Congratulating them on it delays the point.

- Wrong: "Congrats on the Series B! Really impressive growth."
- Right: "Series B at [Company]'s stage usually means the next 90 days are all hiring and systems. Is GTM infrastructure on the list?"

**3. Always extract the implication.**
Stating the signal without the consequence is just surveillance. The implication is the value.

- Wrong: "I noticed [Company] has a Head of Marketing role open."
- Right: "Head of Marketing open for [X] days means someone is running the function without a clear owner. Is that falling on the founder right now?"

**4. Do not lead with generic pain before the signal.**
~~The signal is the opener.~~ (**Retired 2026-07-17:** the offer is the opener, per `/campaign-copywriting` Hard Rule 19. See the Opener-doctrine reconciliation at the top of this doc.) Generic pain is a closer or a question, not a setup. **This rule itself survives:** it is failure mode 4 in the live Signal-First Anti-Patterns bank and never depended on where the signal sits. Where a slice-SHARED signal fact appears in the body (Hard Rule 38), do not bolt generic industry pain in front of it.

- Wrong: "Most companies at your stage struggle to hit pipeline targets. I saw [Company] has a VP Sales role open."
- Right: "VP Sales role open for [X] days is a long time to run a sales org without a head. Who owns quota right now?"

**5. Do not bury the signal at the end.**
If the signal earns you the conversation, it goes first.

- Wrong: "We help B2B companies scale their outbound pipeline. I noticed [Company] is hiring an SDR which caught my attention."
- Right: "[N] SDR roles open at [Company]. That volume usually means the current list-building process cannot keep up with demand."

**6. Do not use the signal as flattery into a pitch.**
Signals are evidence of a problem, not a compliment bridge.

- Wrong: "I saw [Company] was named one of the fastest-growing companies in [region]. That is really impressive, and it made me think you might be dealing with some scaling challenges we could help with."
- Right: "[Company] scaled to [headcount] in [timeframe]. Teams that grow that fast usually hit the same three operational walls in the same order. Is [specific wall] one of them?"

---

## How to Read This Doc

Each section covers one signal in this structure:

1. What it proves about a company or person
2. Campaign slices you can build from it
3. Concrete copy angles with example lines
4. **Acquisition path: the direct capability.** The single capability that returns this signal cleanly, usually as a search-time filter, named as a job rather than a brand. Where a tool is named it is an example of something that does that job, not a tool FNNL holds.
5. **Acquisition path: substitutes.** How to get the same signal when nothing in the stack exposes that capability, by assembling cheaper or more general capabilities (crawling, search, classification) into the same answer. Techniques, parameters, concurrency limits, and per-row costs are the useful part and they are kept verbatim.
6. **What the substitutes do not cover.** The honest limit of the workaround, so nobody promises a client a signal the chosen stack cannot actually deliver.

Combined signal combos are at the end. Two standing reminders as you read: a capability is only usable once its slot in `stack-contract.yaml` is filled and `live`, and a named tool's plan tier (which filter sits on which plan) is a claim about that vendor at the time of writing, so re-confirm it before planning around it.

---

## 1. Job Change Filter

**Capability needed:** a contact-discovery database with a native job-change filter, ideally offering date windows (last 90, 180, 270, 365 days) and a promotion-only toggle. (Prospeo's Growth/Pro tier is one tool that exposes this. Check `lead_data.contact_discovery` in `stack-contract.yaml` for what FNNL actually has.)

### What It Proves

Someone moved to a new company or got promoted within the last 90 to 365 days. New roles open a buying window. New executives audit tools, rebuild processes, and make early vendor decisions before the existing contracts get inherited. This is one of the highest-intent timing signals in cold outbound.

### Campaign Slices

**Slice A — New leader, new company (strongest signal)**
Filter: Changed companies in last 90 days + VP/Director/C-suite seniority + ICP industry + ICP headcount. One new leader per account. This is your "new exec buying window" campaign.

**Slice B — Promotion within same company (underused)**
Filter: Job change = promotion only + same company + newly holds a budget title (Manager to Director, Director to VP). They just gained authority they did not have before. Same company. Different power.

**Slice C — New to role, 180 to 270 day window**
Filter: Changed companies in last 180 to 270 days + ICP profile. Past the chaos of the first 30 days, not yet locked into contracts. The 90-day window is over-competed. 180 days is quieter.

### Email Copy Angles

**New company, new exec:**
> "[New title] at [new company] after [X] years at [previous company]. That kind of move usually means the first 60 days are spent auditing what carries over and what gets rebuilt from scratch. [Offer in one sentence]. Worth a quick look?

**Promotion within same company:**
> "[New title] at [company] usually means ownership of [pain they now own] just shifted your way. We help [similar title]s at [company type] with [specific problem]. Is [pain] on your radar right now?

**Came from a company that used a relevant tool:**
> "[Previous company] ran [competitor or adjacent tool]. Moving to [new company] without that infrastructure usually means rebuilding the same capability from scratch. We help with [specific part]. Is that on your list?

**Rules for this section:**
Only reference the previous company if it is publicly visible on LinkedIn and directly relevant to the offer. Keep the first line to one sentence. ~~The signal is the opener.~~ (**Retired 2026-07-17:** the offer is the opener, per `/campaign-copywriting` Hard Rule 19. See the Opener-doctrine reconciliation at the top of this doc.) The offer still needs to be sharp.

### Acquisition Path: Direct (a native job-change filter)

If the contact-discovery tool in the stack has a dedicated job-change filter, this is the cleanest path: filter your full ICP at the search level, export, and the job change date comes back as a column on the row. It is the most complete path because the timing filter runs *before* you spend any credit. Prospeo Growth/Pro is an example of a tool built this way, with date-range options (last 90, 180, 270, 365 days) plus a promotion-only toggle. When evaluating any candidate for this slot, those two features (the date window and the promotion split) are the things to ask about.

### Acquisition Path: Substitutes (no native job-change filter)

**Option 1: A LinkedIn-search exporter on top of Sales Navigator (closest equivalent for net-new discovery)**

Sales Navigator has a native "Changed jobs in past 90 days" people filter, and a separate "Promoted in last 90 days" filter. Combine either with your other ICP filters (title, company size, industry, geography), then hand the search URL to an export tool that turns a LinkedIn search into rows (WizLeads is one such tool). This is the strongest substitute, because Sales Nav is the underlying data source most job-change databases resell anyway. Limitations: it requires a Sales Nav subscription, and it does not separate "changed companies" from "promoted" unless you apply the specific filter.

**Option 2: A job-change monitoring service (monitoring an existing list, not net-new discovery)**

A monitoring tool watches a contact list you upload and fires an alert when someone changes jobs (Trigify is one example). Upload your warm contacts, past clients, or previously-engaged prospects, and you get told when any of them move. Note this is a different job from a job-change *filter*: a filter discovers new job-changers at scale across a universe you do not yet own, monitoring watches a list you already hold. Best for champion re-engagement campaigns. Not for building a fresh list of 500 new-to-role leaders.

**Option 3: A job-tenure filter as an approximation (no extra cost)**

Some contact-discovery tools expose a job-tenure filter instead of a job-change filter. A-Leads, for example, has `min_job_duration_months` / `max_job_duration_months` in its advanced search, where `max_job_duration_months: 3` returns people currently in role for 3 months or less. Tenure captures new-company arrivals and promotions together, without separating them. It is not the same as "recently changed companies" but it approximates the buying-window concept well. If a tool like that is already being run for ICP list building, this is a free addition with no extra credit cost, which makes it the cheapest proxy available.

**When to use each:**
- Want to discover 200+ new job-changers across your TAM → Sales Nav job-change filter plus an exporter
- Want to monitor a warm list of 100 to 500 known contacts → a job-change monitoring service
- Want a rough proxy at zero extra cost on a list you are already building → a job-tenure filter at `max_job_duration_months: 3`

### What the Substitutes Do Not Cover

The 270 and 365-day job-change windows, and the promotion-only toggle, are not available in Sales Nav on standard plans. A purpose-built job-change filter also returns the change date as a column at export time with no manual review, whereas the Sales Nav path requires you to actively work the filter result. Above roughly 1,000 contacts per campaign, the dedicated filter is faster and cheaper per row than any substitute here.

---

## 2. Headcount by Department

**Capability needed:** a company database that filters on *per-department* headcount at search time, not just total company size. (Prospeo's Growth/Pro tier is one tool that exposes this. Check `lead_data.company_discovery` in `stack-contract.yaml`.)

### What It Proves

The size of a specific department tells you more than total headcount. A 100-person company with 3 salespeople is a completely different buyer than a 100-person company with 40 salespeople. Department size reveals where the company is investing, what their operational reality looks like, and whether your offer is premature or overdue.

### Campaign Slices

**Slice A — Growing sales team, no RevOps support**
Filter: Sales department 10 to 30 people, RevOps/Operations department 0 to 2 people. These companies have sales capacity but no infrastructure. They need data, sequencing, and process.

**Slice B — Large engineering, tiny sales**
Filter: Engineering department 30+ people, Sales department 0 to 5 people. Product-led company. The VP Engineering or CTO is likely the first buyer for developer tools. The sales motion has not been built yet.

**Slice C — Large marketing, small sales**
Filter: Marketing department 10+, Sales department 0 to 5. Demand gen exists. Sales development does not. Cold email infrastructure, SDR tooling, or outbound setup is the play.

**Slice D — Small IT team relative to company size**
Filter: Company 200+ employees, IT department 1 to 3 people. These teams are stretched. IT security, SaaS management, and compliance tools are overdue.

### Email Copy Angles

**Sales team without RevOps:**
> "[Company] has [X] AEs and no dedicated RevOps owner based on what is public. That ratio usually means everything runs on spreadsheets and good intentions until it breaks. We help teams at that stage [specific result]. Is that where things are right now?

**Engineering-heavy, sales-light:**
> "[Company]'s engineering team is [3x] the size of the current sales org. Product-led companies at that ratio usually hit the first real GTM wall around now — distribution without a dedicated motion. We work with teams in exactly that position. Worth a 20-minute conversation?

**On using department headcount in copy:**
This signal works better as a targeting filter than as a direct personalization line. Referencing it directly — "I see you have 14 people in Sales" — can read as surveillance. Use it to select who to reach and what problem to lead with, not as the first sentence of the email.

### Acquisition Path: Direct (a department-headcount filter)

A company database with department-level filtering lets you set minimum and maximum ranges *per department* before you spend any credit, and returns the department count as a dedicated column at export. This is the only shape that runs cleanly at TAM scale, because the filtering happens before the list is built. Prospeo Growth/Pro is an example of a tool with this filter.

### Acquisition Path: Substitutes (no department-headcount filter)

**Option 1: Crawl LinkedIn company "People" pages (best for a known account list)**

LinkedIn's company "People" tab shows a department breakdown with headcounts. URL pattern: `linkedin.com/company/[company-slug]/people/`. Use the crawling capability (`web.crawl`) with JavaScript rendering enabled, since the page is JS-rendered (in Spider Cloud that is `request: 'chrome'`), extract the raw HTML, then pass it through the bulk-classification model (`ai.bulk_classification`) to parse department labels and their counts. Run at 40 concurrent workers. Viable for 100 to 500 accounts per run. LinkedIn rate limits apply above that, so spread runs across sessions or days to avoid blocks.

**Option 2: Sales Navigator company cards plus an exporter (manual per account but exportable)**

Sales Navigator company cards display department headcount when you view a company profile. For a list of 50 to 100 priority accounts, pull the department breakdown from each company card. An export tool (WizLeads is one) can also export people-level data from Sales Nav searches filtered by department, letting you count results as a proxy for department size. Slower than crawling for large lists, but no scraping risk.

**Option 3: Total headcount only (rough proxy, not equivalent)**

Most contact databases carry company size ranges but no department-level breakdown. You can roughly infer department imbalance by counting how many contacts the tool returns per title keyword for a company domain (search for Sales titles at a specific domain and count the results), but this burns credits and is not reliable. Use it only as a last-resort sanity check on specific accounts, never as a bulk targeting filter.

### What the Substitutes Do Not Cover

A native department filter runs at search time across the entire TAM before any spend. Crawling runs post-list: you need an account list first, then you crawl it. So the crawl path cannot efficiently build a list of "all companies in the US with 10 to 30 sales reps" from scratch. It can only enrich a list you already have.

---

## 3. Headcount Growth Rate

**Capability needed:** a company database that returns a precise headcount growth percentage per department, over a settable time window, as a search-time filter. (Prospeo's Growth/Pro tier is an example. Check `lead_data.company_discovery`.)

### What It Proves

A company that added 50 percent to its sales team in six months is in a different buying state than one that has been flat for two years. Growth is a budget signal. It means someone made the decision to invest. It also means the pain of scale is either here or arriving soon.

### Campaign Slices

**Slice A — Sales team growing fast**
Filter: Sales department growth 40%+ in last 6 months. These companies are actively building GTM infrastructure. They will buy tools that help the new team hit numbers.

**Slice B — Engineering growing, everything else flat**
Filter: Engineering headcount +50%+ in 6 months. Build mode. Developer tools, API security, compliance, cloud infra.

**Slice C — Company headcount declining**
Filter: Headcount declining or flat year over year. Different campaign. Cost-saving and efficiency angle. "Do more with fewer people" framing.

**Slice D — Sales department shrinking**
Filter: Sales headcount down 20%+ in last 6 months. Recent layoffs or restructure. They cut team members and now need efficiency. High-value segment for automation and AI tools if timed correctly.

### Email Copy Angles

**Fast growth:**
> "[Company]'s sales team is [X%] larger than it was [timeframe] ago. Teams that grow that fast usually hit [specific pain: bad data, onboarding drag, territory conflicts] before the process catches up. We help teams at this stage [specific result]. Is that where you are right now?

**Decline or restructure:**
> "[Company]'s sales team is [X%] smaller than it was [timeframe] ago. Most teams in that position are being asked to hit the same number with fewer people. We help with [efficiency angle]. Open to hearing more?

**Growth plus open headcount (use in combo with Jobs Data):**
> "[X] SDR roles open and the team already [Y%] larger than last quarter. That is usually when the incoming reps inherit a list that was never cleaned. [Offer]. Worth a quick look before the next cohort starts?

### Acquisition Path: Direct (a department growth-rate filter)

A database with a headcount-growth-rate filter lets you set a growth percentage range and a time window per department, at search time, before exporting. This is rare: a precise percentage growth number at department level, usable as a filter, is the hardest capability in this doc to source. Prospeo Growth/Pro is an example of a tool that has it.

### Acquisition Path: Substitutes (no growth-rate filter)

**Option 1: A company-growth endpoint on the company-discovery tool (best proxy, usually no marginal cost)**

Some company-discovery tools expose a growth endpoint alongside their profile data (DiscoLike's API has a `growth-metrics` endpoint, for example). These typically return company-level growth indicators including headcount direction, but not a department split. When the tool is already building the account list, this costs nothing extra per row, which makes it the first thing to check. Run it on the full TAM account list during Layer 1 enrichment, before any per-credit contact spend.

**Option 2: Sales Navigator growth filter plus an exporter (department-level, if the plan allows)**

Sales Navigator includes headcount growth percentage filters on its Advanced and Advanced Plus plans, and in some configurations these can be set per department. An export tool turns the results into rows. Where the Sales Nav plan supports it, this is the cleanest department-level growth path short of a native filter.

**Option 3: Crawl LinkedIn company pages (directional only)**

LinkedIn shows headcount trend language on some company pages, for example "38% growth in the last 2 years." A crawler with JavaScript rendering can extract that text, and the bulk-classification model can sort it into growing, flat, or declining. Use this as a directional tag, not a precise percentage. It is a snapshot of what LinkedIn shows today, not a historical rate you can control for window length.

**Option 4: News search (directional, no numbers)**

For accounts already in your list, run a search query per company: `"[company]" "hiring" OR "expanding" OR "growing team"` for growth signals, or `"[company]" "layoffs" OR "restructured" OR "reduced headcount"` for decline. The search capability (`web.search`) returns news articles, and the classification model turns them into growth or decline tags. No percentage numbers. Works best for companies with media coverage, and is close to useless for small or private companies.

**When to use each:**
- Building a TAM account list from scratch → the company-discovery tool's own growth endpoint during Layer 1, since it is usually already paid for
- You have Sales Nav Advanced or Advanced Plus → the Sales Nav growth filter plus an exporter
- You have a finished account list and need directional growth tags → LinkedIn crawl plus classification
- You want confirming news evidence on high-priority accounts → news search queries

### What the Substitutes Do Not Cover

Precise department-level growth percentage, as a search-time filter at TAM scale, is not reproducible by any substitute here. A company-growth endpoint gives you company-level direction. LinkedIn text gives you a rough directional indicator. Neither lets you run "show me all companies where the sales team grew 40%+ in 6 months" as a filter before building your list.

---

## 4. Founded Year

**Capability needed:** almost any company database, since founded year is near-universal. A search-time range filter is the nice-to-have. (Prospeo carries it on all paid plans and DiscoLike returns it in its company profile, to name two.)

### What It Proves

Company age is a proxy for buying stage, product maturity, technical debt, process sophistication, and budget behavior. A company founded in 2021 behaves differently from one founded in 2012. Same industry. Same headcount. Completely different buyer psychology and operational reality.

### Campaign Slices

**Slice A — 2 to 4 year old companies (2021 to 2023)**
Survived early chaos, have a product, have some revenue, hitting first scaling pains. This is the best buying window for most GTM tools, outbound infrastructure, and growth services.

**Slice B — 5 to 7 year old companies (2018 to 2020)**
Past the scrappy phase. Either growing well or stuck. Process debt accumulating. May have outgrown founding-era tools. Migration or upgrade conversations.

**Slice C — Pre-2010 companies (15+ years old)**
Enterprise-adjacent. Long sales cycles. Established tools. The framing shifts to "the version of this problem you are running into now did not exist when you built the original solution."

**Slice D — Very new companies (less than 18 months, 2024 to 2025)**
Pre-infrastructure. Founder-led sales. Use "you are at the stage where X becomes the bottleneck" framing.

### Email Copy Angles

**3-year-old company:**
> "[Company] is [X] years old. [Industry] companies at that stage typically hit [specific pain] before the process catches up. The teams that address it early [outcome]. Is that on your radar?

**5 to 7 year old company:**
> "[X] years on [tool or process] usually means it was right for the size you were, not the size you are. We help [title] teams past the startup phase and not yet enterprise. Is [pain] something you are actively solving or tolerating?

**Older, mature company:**
> "[Company] has been running [process or approach] since [founding decade]. That generation of [category] usually handles [pain] the same way — manually, until it stops working. We work with [similar mature companies] on the modern version of that problem. Worth a 20-minute conversation?

### Acquisition Path: Direct (a founded-year filter)

A company database with a founded-year filter lets you set a range (2019 to 2022, say) before exporting, and returns the year as a column. Clean and fast. This filter is common, so treat its absence as a reason to question the tool rather than to plan a workaround.

### Acquisition Path: Substitutes (no founded-year filter)

**Option 1: The company-discovery tool's own profile data (best, usually no marginal cost)**

Most company-discovery tools store company start date as part of the company profile (DiscoLike returns it from its `business-profile` / `append-data` endpoints, for example). If that tool is already building the account list, founded year comes back during the standard enrichment call at no extra credit cost per row. Cheapest and cleanest. Run it as part of Layer 1 on every TAM build.

**Option 2: A bulk extractor against Crunchbase (cheap extraction for bulk)**

Crunchbase has founded year for the vast majority of B2B companies, and extraction-only tools can pull company data from it at low cost (LeadsFriday is one such tool). Use this to fill founding year for an account list the primary source did not cover or returned blank on.

**Option 3: Search plus crawl (fills gaps for specific accounts)**

Search for `site:crunchbase.com "[company name]"` to get the Crunchbase company page URL, then crawl that page and extract the founded year field. The same pair also works on LinkedIn About sections (which frequently include founding year) and on company websites (About pages, team pages). Use it for 50 to 100 specific accounts after the cheaper bulk paths have run.

**Option 4: Classify the company description (last resort, unreliable)**

Contact and company databases often return a free-text company description that sometimes states the founding year. Pass that text to the classification model with the prompt: "Extract the founding year from this company description. Return the year as a number. If not mentioned, return null." Works on maybe 30 to 40 percent of rows. Free if the description was already pulled. Do not rely on it as a primary source.

**Recommended order:**
Company-profile data first → a bulk Crunchbase extractor for gaps → search plus crawl for remaining blanks → description extraction as cleanup.

### What the Substitutes Do Not Cover

Nothing meaningful. Founded year is the easiest signal here to obtain without a dedicated filter. Standard company-profile data handles most of a TAM, and Crunchbase via an extractor or a crawl fills the rest.

---

## 5. Ads Intelligence

**Capability needed:** an ads-intelligence lookup that returns, per company, which paid platforms it is currently advertising on. (LeadMagic's Ads Intelligence endpoint is one example. There is no slot for this in `stack-contract.yaml`, so it is either part of what `lead_data.intent_signals` buys or it is assembled from `web.crawl` and `ai.bulk_classification` as below.)

### What It Proves

A company running paid ads has a marketing budget, an owner of demand gen, and an active growth motion. What they are advertising reveals their product positioning, target audience, and current focus. This is both a buying signal and a personalization source for copy.

### Campaign Slices

**Slice A — Running Google Ads in your category**
Companies bidding on keywords adjacent to your offer know the problem exists and are spending to solve it. Your offer either directly addresses it or complements it.

**Slice B — Running ads AND hiring in growth or marketing**
Two-signal confirmation. Growth investment confirmed at two layers. Budget is real and committed.

**Slice C — Running Meta Ads but not Google Ads**
Primarily B2C motion or product-aware brand. Different buyer psychology. Adjust offer framing accordingly.

**Slice D — Not running any ads despite 50+ employees**
Either cost-disciplined or demand gen has not started. Outbound is the only top-of-funnel they have. This makes cold email more relevant, not less.

**Slice E — Running LinkedIn or B2B platform ads**
This company is deliberately targeting decision-makers. They have a polished GTM motion. Likely a higher-budget buyer.

### Email Copy Angles

**Running ads, growth motion:**
> "[Company] is running [Google/LinkedIn] ads. Paid top-of-funnel without a matching outbound motion usually means [specific problem: inconsistent pipeline, wrong ICP in the funnel, no handoff between channels]. We help with [offer]. Worth a look?

**Running ads with a specific positioning:**
> "[Company]'s current ads are targeting [audience or message]. Teams running that positioning usually hit [specific operational consequence] before they figure out the right handoff between paid and outbound. We help [title] teams at that stage with [problem]. Is [pain] something you are solving or just managing?

**Not running ads:**
> "[Company] is not running paid acquisition at [size] and [stage]. That usually means outbound is carrying most of the pipeline weight without dedicated support. [Offer]. Are you open to a quick conversation?

### Acquisition Path: Direct (an ads-intelligence endpoint)

A dedicated ads-intelligence endpoint covers Google Ads, Meta Ads, LinkedIn Ads, and other B2B platforms in one call per company, returning running/not-running status plus spend estimates for some platforms. LeadMagic's Ads Intelligence endpoint is an example. Where this exists it belongs in Layer 1 during TAM enrichment, because it is a single call rather than a multi-step assembly.

### Acquisition Path: Substitutes (no ads-intelligence endpoint)

The substitute is to read the public ad-transparency registries yourself. Two ways, and they differ on cost versus reliability rather than on what they can see.

**Option 1: A scraping-actor platform against Meta's Ad Library**

Meta's Ad Library is publicly accessible without authentication. A ready-made actor on a scraping platform (Apify hosts one, for example) searches by advertiser name or Facebook page URL and returns active ads, copy, and creative. Run it to confirm whether a company is advertising on Meta or Instagram. Cost is compute credits per run rather than per row, which makes it bulk-friendly on a known account list.

**Option 2: The same approach against Google's Ads Transparency Center**

Google Ads Transparency Center (`adstransparency.google.com`) is also public. An equivalent actor checks whether a company is running Google Ads and returns ad copy samples. Same setup as Meta: run it against the account list in bulk.

**Option 3: Direct crawl (cheaper for confirm/deny on a large list)**

Both registries are ordinary web pages, so the crawling capability with JavaScript rendering can fetch them and the classification model can decide: running ads, or not. This is cheaper per row than a scraping actor, but less reliable on pages with heavy anti-bot protection. Test the crawl on 20 rows before scaling. If quality holds, crawl the bulk and reserve the actor for the rows the crawl fails on.

**Full substitute workflow:**
1. Account list from the company-discovery tool (Layer 1)
2. Crawl Meta Ad Library pages for each company domain → classify → `meta_ads_running: true/false`
3. Crawl Google Ads Transparency pages → classify → `google_ads_running: true/false`
4. Fall back to a scraping actor for any rows the crawl could not resolve
5. Segment: running ads (one campaign angle) versus not running (a different angle)

### What the Substitutes Do Not Cover

LinkedIn Ads data is not available through the Meta or Google transparency registries. No public page confirms whether a company is running LinkedIn Ads, so that one needs either a LinkedIn-side tool or a paid ads-intelligence endpoint. Actual spend estimates are likewise unavailable from public transparency pages, and B2B programmatic ad platforms have no public transparency layer at all.

---

## 6. Job Change Detector

**Capability needed:** a batch job-change lookup: pass in a list of contacts you already hold and get back which of them have moved. (LeadMagic has a standalone endpoint for this, for example.) Note this is the inverse of Signal 1: there you filter a universe you do not own, here you re-check a list you do.

### What It Proves

This is not about finding new prospects. This is about tracking a known contact list and detecting when someone you already know has moved to a new company. The use case is champion re-engagement, not net-new discovery.

### Campaign Slices

**Slice A — Former champion motion**
Take your list of past contacts, clients, or engaged prospects. Detect who moved to a new company. They already know your product. They are warm by default at the new company.

**Slice B — Former ghosted prospect**
VP of Sales at Company A never replied to you six months ago. They just joined Company B as CRO. Re-engage. Different company, different context, different budget.

**Slice C — Where did your churned customers go?**
Pull contacts from churned clients. Detect where the key people moved. They may have moved to a company that fits your ICP. They know your product.

**Slice D — Competitive displacement**
Pull contacts who bought from a competitor. Detect movers. At the new company they have not yet signed a competitor contract. Clean slate.

### Email Copy Angles

**Former client contact at new company:**
> "[First name] — [New company] is a different machine than [previous company]. We worked with [previous company]'s team on [specific thing]. If [same pain] is starting to surface at [new company], it is worth a quick call. Same problem, different context.

**Ghosted prospect, now at new company:**
> "[First name] — [Previous company] was not the right fit when we last spoke. [New company]'s at a different stage now. We help [title] teams at [type of company] with [problem]. Is the timing better? 15 minutes?

**Churned customer contact:**
> "[First name] — [New company] is a different environment than [previous company]. The [pain] you were dealing with there usually shows up in a different form at a company this size. Happy to pick up where we left off. Worth a quick call?

**Rule for this copy:**
Only send if the previous relationship or touchpoint was real. Pretending you have a relationship you do not have will be called out immediately.

### Acquisition Path: Direct (a batch job-change lookup)

A batch detector runs on demand: pass a list of known contact LinkedIn URLs, the tool checks them against its profile index, and it returns everyone who changed companies. LeadMagic's Job Change Detector is an example, priced at 3 credits per contact against a 100M+ profile index. The shape to look for is retroactive and on-demand, because that is what a one-time sweep of an archive list needs.

### Acquisition Path: Substitutes (no batch job-change lookup)

**Option 1: A continuous monitoring service (best for ongoing monitoring of a known list)**

A monitoring tool watches an uploaded list (past clients, engaged prospects, churned customers) and fires alerts when someone moves. Trigify is one such tool. The key difference from a batch lookup is *when* it runs: monitoring is continuous and forward-looking, a batch lookup is retroactive and on demand. For 100 to 500 high-value contacts watched long-term, monitoring is the better fit. For a one-time check of a 2,000-row archive, a batch lookup is cheaper.

**Option 2: Sales Navigator saved-lead alerts plus an exporter (semi-manual, smaller lists)**

Save the key contacts as leads in Sales Navigator. Sales Nav fires "changed jobs" alerts in the notifications feed when a saved lead moves, and an export tool turns the flagged contacts into rows when alerts come in. Semi-manual, workable for a shortlist of 50 to 150 priority contacts, not practical for bulk monitoring.

**Option 3: Search plus crawl (spot-check for the top 20 to 30 accounts only)**

For a small watchlist: search `"[first name] [last name]" "[company they left]" site:linkedin.com`, then crawl the returned LinkedIn profile URL and check whether the current employer field has changed. Not scalable for bulk. Use it only for must-watch accounts.

**When to use each:**
- Ongoing warm-list monitoring → a continuous monitoring service
- One-time batch check of archive contacts → Sales Nav alerts on saved leads, then export the flagged rows
- Spot checks on 20 to 30 specific contacts → search plus crawl

### What the Substitutes Do Not Cover

Automated, retroactive detection across 2,000+ known contacts at low cost is the gap. Monitoring services work but only look forward from the day you upload, so they never tell you who moved last year. Crawling every contact's profile is expensive and rate-limited at that volume. For a one-time retroactive sweep of a large archive, a batch lookup endpoint or a Sales Nav Advanced export with job-change filters is the only practical path.

---

## 7. Jobs Data Endpoint

**Capability needed:** a jobs-data lookup that returns every open role at a company with the full job-description text, not just a yes/no on whether they are hiring. (LeadMagic's Jobs endpoint is an example.) The JD text is the valuable part, because it is the buyer's pain in the buyer's own words.

### What It Proves

A company posting a specific role right now is spending money and has an unsolved problem. The job description contains pain written in the buyer's own language. This is the most literal proof of need you can find without a sales call.

### Campaign Slices

**Slice A — Hiring SDRs or BDRs**
They are building outbound. They need email infrastructure, data, training, sequencing. Direct buying signal for GTM tooling.

**Slice B — Hiring RevOps or Sales Ops**
The company is formalizing its GTM stack. They are about to evaluate or buy tools. Get in before the new hire decides what they are building.

**Slice C — Hiring in your buyer's department**
If you sell to marketing teams and they are hiring a Demand Gen Manager, that role will own a budget you want. Get to the current Head of Marketing now while they are still running everything alone.

**Slice D — Hiring roles that name the problem**
A company hiring a "Data Quality Manager" has a data problem. A company hiring a "Sales Enablement Manager" has a coaching and content problem. These roles are the symptom. Your offer is the treatment.

**Slice E — Posting the same role repeatedly**
Companies re-posting the same role are struggling with retention or cannot find the right person. High internal pressure signal.

### Email Copy Angles

**Direct signal, SDR hiring:**
> "[Company] has [N] SDR roles open right now. That volume usually means the list-building process cannot keep up with demand. We help outbound teams [specific result]. Before the new reps start, is it worth making sure the infrastructure is ready?

**Using actual JD language:**
> "The RevOps role at [company] lists [specific requirement from the JD, e.g. 'cleaning up the CRM and building attribution'] as a primary project. [Comparable client type] described the same scope before they started working with us. Is that the active problem right now?

**Role open a long time:**
> "[Role] role open for [X] days at [company]. Teams that take this long to fill this position usually run the function without a clear owner for months. [Offer] might be worth a look before you are fully into the new motion. Open to a quick call?

**Rule for JD-based copy:**
Only quote or reference JD content that is currently live and publicly accessible. Do not fabricate specifics.

### Acquisition Path: Direct (a jobs endpoint with JD content)

A jobs endpoint returns role title, JD content, location, and posting date for every open role at a company in a single API call, refreshed daily across millions of postings. LeadMagic's Jobs endpoint is an example of that shape. Where it exists, it is used twice: at Layer 1 for targeting, and at Layer 2 for copy personalization variables.

### Acquisition Path: Substitutes (no jobs endpoint)

This is the signal that substitutes best, because job postings are public by nature. The workflow below reproduces most of a jobs endpoint's value at a much lower cost per row. It splits the signal into two layers, which is the key insight: *knowing a role is open* and *having the JD text* are different capabilities with different prices.

**Step 1: Targeting layer, a job-posting filter on the contact or company database**

Some contact databases let you filter on the fact that a company is hiring for a given role (A-Leads exposes a `job_posting_title` filter in its advanced search, and Prospeo has the same capability from its Starter tier up). Filter for companies actively hiring SDRs, RevOps, or whatever role signals your buyer, and you get a list of matching companies and contacts. This confirms the role exists. It does not return the JD content itself, which is what Step 2 is for.

**Step 2: JD content layer, crawl the ATS pages (the workhorse)**

Most companies post jobs through an applicant tracking system with a public URL, and those pages crawl cleanly. Rendering mode matters for cost, so match it to the page:

- Lever.co pages: plain HTTP fetch (server-rendered, fast and cheap)
- Greenhouse.io pages: plain HTTP fetch (server-rendered)
- Workable.com pages: plain HTTP fetch (server-rendered)
- LinkedIn Jobs pages: JavaScript rendering (costs more)

(In Spider Cloud those two modes are `request: 'http'` and `request: 'chrome'`. Any crawler filling `web.crawl` should expose the same distinction, and if it does not, assume you are paying rendering cost on every page.)

Extract role title, full JD text, department, requirements, technologies mentioned, and team size references. Pass the extracted text to the classification model to pull out pain-language variables: what specific problem this JD describes, what tools they mention, what the team looks like. Output a structured `email_opener` column ready for upload to the sending platform.

**Step 2a: Finding the ATS URLs, via search**

If you do not already hold the ATS URL per company, the search capability finds it:
- `site:lever.co "[company name]"` → returns all Lever-hosted job listings for that company
- `site:greenhouse.io "[company name]"` → same for Greenhouse
- `site:workable.com "[company name]"` → same for Workable

Pass the returned URLs straight to the crawler.

**Step 3: LinkedIn-hosted postings only, a scraping actor (last resort)**

Some smaller companies post exclusively on LinkedIn without a dedicated ATS. For those, a purpose-built LinkedIn Jobs actor on a scraping platform (Apify hosts one) is the only reliable path. More expensive per run than a crawl, so use it only for the rows where Steps 1 and 2 found no ATS URL.

**Full substitute workflow:**

1. Job-posting-title filter (`job_posting_title` or the equivalent on the chosen tool) → 500 companies hiring SDRs (targeting layer, usually included in an existing subscription)
2. Search → find Lever/Greenhouse/Workable URLs for each company → roughly $0.001 per query
3. Crawl in plain HTTP mode → JD pages → extract full text → cheap per page
4. Classification model → extract pain-language variables → a structured `email_opener` column
5. LinkedIn Jobs actor → fill the rows with no ATS page found

This delivers actual JD content for copy personalization. It is not as fast as one API call per company, but it produces the same output (pain language in the buyer's own words) at a lower per-row cost on most lists.

### What the Substitutes Do Not Cover

A jobs endpoint covers all major job boards and aggregators in one call with daily refresh, including platforms that are hard to crawl (some aggregators, paid boards, private listings). The crawl path only works for companies with public ATS pages on Lever, Greenhouse, or Workable. Companies that post only to Indeed, ZipRecruiter, or an internal careers page without a public ATS URL get missed entirely, and you will not know which ones they are without checking.

---

## 8. Profile Search

**Capability needed:** a profile lookup that returns structured work history, education, certifications, and follower range for a person, ideally matched from an email address as well as from a LinkedIn URL. (LeadMagic does this at 1 credit per profile, for example.)

### What It Proves

Where someone came from tells you what they know, what they have already tried, and what biases they carry into their current role. A VP of Sales who spent eight years at Salesforce before joining a 50-person startup sees the world differently from one who grew up in agency sales. That context changes how you position your offer and what you can skip in the pitch.

### Campaign Slices

**Slice A — People who came from a specific company**
Former employees of Company X are now at ICP companies. Especially useful when Company X is a competitor user, a known champion company, or a company that had the exact problem you solve.

**Slice B — People with specific certifications**
Targeting IT buyers? People with AWS, Azure, CISSP, or SOC certifications are technically sophisticated. They do not need the basics explained. They need specificity.

**Slice C — People who changed industries**
Someone who spent 10 years in finance and is now running ops at a SaaS company brings unusual context. Cross-domain background creates a natural opener tied to that unique perspective.

**Slice D — High follower count (thought leaders)**
If someone has 10K+ LinkedIn followers, they are an influencer in their space. LinkedIn DM or engagement-first motion usually outperforms cold email. A referral or mutual connection angle matters more here.

### Email Copy Angles

**Came from relevant previous company:**
> "[X] years at [previous company] before [current company] means you have seen [pain] at scale. We help [current company type] get ahead of it before it gets to that point. Worth a quick conversation?

**Certification-based (technical buyer):**
> "[Certification] means you already know where [technical problem] breaks down in practice. [Offer with technical specificity] — no oversimplification needed. Does that match what you are dealing with at [company]?

**Cross-industry background:**
> "[X] years in [previous industry] before [current industry] means [specific operational context they uniquely carry]. That combination changes how [pain] shows up. [Offer]. Worth a conversation?

**Long tenure at previous company, now building at a new one:**
> "[Previous company] for [X] years, then [current company]. That is a builder's pattern. Most [title]s who make that move are specifically trying to build what they could not at the previous scale. [Offer for builders]. Is that what is happening here?

**Rules for profile-based copy:**
Never reference specific details from early career or education unless directly relevant to the offer. Work history is a context signal for framing, not a pickup line. One background reference per email.

### Acquisition Path: Direct (a structured profile lookup)

Pass a LinkedIn URL, get back a clean structured object: work history, education, certifications, follower range. Priced per profile (1 credit is typical, as with LeadMagic). Best used to enrich a campaign slice where work history is the personalization input, rather than across a whole TAM.

### Acquisition Path: Substitutes (no profile lookup)

**Option 1: Take it as a byproduct of the Sales Navigator export (best, no additional cost)**

If the list originates from a Sales Navigator search, the export already includes previous companies and titles from the profile card. For a job-change campaign built with Signal 1, work history arrives free as a byproduct of the export you already ran, with no extra step. This is the most practical path whenever the campaign is LinkedIn-first.

**Option 2: Crawl the LinkedIn profile URLs (bulk enrichment)**

Where the list holds LinkedIn URLs, crawl each profile page with JavaScript rendering enabled and extract the work-history section, then have the classification model parse the raw text into structured fields: `previous_company`, `previous_title`, `tenure_years`, `certifications_mentioned`. Viable for 100 to 500 high-value contacts where the personalization payoff justifies the crawl cost. LinkedIn anti-scraping protections bite at higher volumes, so run at 20 to 30 concurrent workers and spread runs across days for lists above 200 profiles.

**Option 3: Classify the bio or headline text you already have (fast qualifier, partial signal)**

Contact databases usually return a bio or headline field (A-Leads calls it `member_description`), and it often names a previous company or a certification. Have the classification model scan the whole batch with a prompt like: "Does this bio mention working at [specific target company] or holding [specific certification]? Return `true` or `false`." Use it as a cheap pre-filter to decide which contacts deserve a full profile crawl, instead of crawling everyone.

**Option 4: Search-result snippets (fast, rough, for small lists)**

Query `"[first name] [last name]" "[current company]" site:linkedin.com`. The search snippet often shows the current title plus a fragment of the "about" or previous-position text, at roughly $0.001 per query. Good for a quick check on 20 to 50 specific contacts before committing to a full profile scrape.

**Recommended order for a 200-person campaign slice:**
1. Bio/headline text → classification qualifier → flag contacts with relevant background keywords
2. Profile crawl with JavaScript rendering → only for flagged contacts (maybe 30 to 60 of the 200)
3. Classification model structure extraction → `previous_company`, `tenure`, `certification` columns
4. For contacts sourced from Sales Nav, use the export → work history is already there

### What the Substitutes Do Not Cover

Email-to-profile matching is the real gap. A profile-lookup endpoint can take an email address and match it against its own profile index, so it works on an email-first list with no LinkedIn URLs in it. Every substitute above needs a LinkedIn URL as input, so an email-first list simply cannot be enriched this way. Bulk structured work history at around 1 credit per profile is also cheaper than crawling once the slice gets large.

---

## 9. Who They Sell To (the sold-to axis)

**Capability needed:** nothing new, in the normal case. The sold-to axis is classifiable from text the TAM build already captures, using the bulk-classification model (`ai.bulk_classification`). A company database with native sold-to filters at search time is the premium shortcut (Prospeo v2 exposes these, for example), and it is the only way to filter *before* the list is built.

### What It Proves

Who a company sells to (their customers' vertical, the size of those customers, the department they sell into) defines their entire world: different buyers, different pain, different proof. This is the axis Eric Nowoslawski calls the one that "almost always changes what you say." Segmenting on what a company IS (industry, size, tech stack) rarely changes the message. Segmenting on who they SELL TO almost always does. A company selling into legal teams lives in a different reality than one selling to restaurant owners, so the right opener, the right pain, and the right proof are different for each even when the two companies are the same size in the same industry.

### Campaign Slices

**Slice A — By customer vertical**
Group `sells_to_vertical` into buckets, e.g. sells-into-legal vs sells-into-restaurants vs sells-into-healthcare. Each bucket is a distinct buyer world, so each earns its own pain and proof. The vertical name itself becomes the copy variable.

**Slice B — By customer size (up-market vs down-market)**
Filter `sells_to_customer_size = enterprise` vs `sells_to_customer_size = smb`. Selling up-market is a different motion and a different pain than selling down-market: enterprise-sellers wrestle with long cycles, procurement, and security reviews, while SMB-sellers wrestle with volume, churn, and self-serve. The size band picks which pain and which proof you lead with.

**Slice C — By sold-into department**
Filter `sells_to_department = finance` vs `sells_to_department = marketing`. A company that sells into finance buyers speaks a compliance-and-controls language. One that sells into marketing buyers speaks a pipeline-and-attribution language. The department they sell into tells you the vocabulary and the proof their own world runs on.

**Slice D — By motion**
Filter `sells_to_motion = b2c` vs `sells_to_motion = b2b`. The coarsest and cheapest first cut. A B2C-motion company and a B2B-motion company have almost nothing in common operationally, so this split alone often changes the message.

The ≥500-company floor applies to whichever grouping you slice on: a sold-to bucket is launch-viable only when ≥500 companies carry it (the same floor every other signal answers to; HARD RULE, operator directive 2026-07-12, which retired the old ≥100-company and ≥100-contact floors). Group the free-text `sells_to_vertical` into ≥100-company buckets before treating a vertical as its own campaign.

### Email Copy Angles

**By customer vertical (the vertical name is the variable):**
> "[Company] sells into [vertical, e.g. law firms]. That means every deal rides on [the proof that vertical trusts, e.g. security and confidentiality], not on speed. Teams selling into that world usually hit [specific pain] before the process catches up. We help with [offer]. Is that where things are right now?

**By customer size (size picks the pain and proof to lead with):**
> "[Company] sells to [enterprise / SMB] buyers. At that end of the market the wall is usually [long procurement cycles / volume and churn], and it shows up right around [stage]. We work with teams selling into exactly that motion. Worth a quick look?

**By sold-into department (department picks the vocabulary):**
> "[Company]'s buyers sit in [finance / marketing]. Selling into that function usually means the whole motion turns on [controls and compliance / pipeline and attribution], and that is where most teams at your stage feel the drag. We help with [offer]. Is that the active problem?

**Rules for this section:**
State the sold-to fact and extract the implication. Never write "I saw you sell to [X]." Never recite their customer list back to them, because listing who they sell to is surveillance, not insight. The value is what selling into that world implies about their pain and their proof, so lead with the implication, not the observation. Use the vertical name as the concrete variable, and let the customer-size and sold-into-department reads decide which pain and which proof you lead with.

### Acquisition Path: Classify from captured text (the default, and it is free)

This is the key point: the sold-to axis is classifiable at no marginal cost from text the TAM build already captures. No new per-company scrape, no extra credit.

The inputs are the free text the qualify pass already holds: whatever company description, keywords, and business-model fields the discovery and contact tools return (DiscoLike returns `description` / `keywords` / `business_model`, A-Leads returns `company_description`), plus the free homepage text extraction (the `extract-website-text` call, or whatever the chosen crawler names its equivalent). Classify all of it on-disk in the same pass that scores `fit_status`, deriving `sells_to_vertical`, `sells_to_customer_size`, `sells_to_department`, and `sells_to_motion` per company. Because the text is already captured and the classifier already runs, this adds no marginal cost per row.

Coverage is honestly `med`, not high. Many B2B firms state "industries we serve" or show vertical case studies that make their end customer clear, which is where this path is strong. But some companies state their end customer only implicitly, so the columns go thin on firms that never name who they sell to publicly. Mark it `med` and do not overclaim.

### Acquisition Path: Premium shortcut (a native sold-to filter)

Some company databases expose native filters for who a company sells to, the size of their customers, and the department they sell into, all at search time (Prospeo v2 is the example this doc was written against). That is faster and cleaner, because the filter runs before you spend any credit and returns the axis as a column at export. Like every other named tool here it is an example, not a tool FNNL holds. The classification path above is the default precisely because it needs no new vendor.

### What the Substitutes Do Not Cover

Search-time filtering on the sold-to axis, across the whole TAM before the list is built, is what classification cannot do. Classification works POST-list: it enriches a list you already have, and it cannot narrow the universe to "only companies that sell into legal at enterprise size" before you build it. Classification also goes thin on companies that never state their end customer publicly, whereas a search-time filter would simply not surface them at all. So: to build a list from scratch on the sold-to axis you need the native filter, and to enrich a TAM you already have, free classification covers most of the value.

---

## Combined Signal Strategies

These are the combinations that produce the strongest copy because they layer timing, context, and offer relevance in one row. Each one lists the direct path (both capabilities present) and the substitute path (neither present).

### Combo 1: Job Change + Profile Search
**Direct:** a job-change filter set to new-company-in-90-days, plus a structured profile lookup.
**Substitute:** a Sales Nav export carries job-change data and prior work history in one pull, so this combo is achievable with no dedicated tool at all when the list starts from Sales Navigator. It is the cheapest strong combo in the doc.

**Slice:** New VP Sales at ICP company who previously worked at a company with a relevant operational context.

**Copy:**
> "[First name] — [Previous company] was a [specific characterization, e.g. 'high-volume outbound operation']. [New company]'s a different machine, but [specific pain they shared] usually shows up at the same stage regardless. We worked with [previous company]'s team on exactly that. 15 minutes?

---

### Combo 2: Headcount Growth + Jobs Data
**Direct:** a department growth-rate filter (sales team +40% in 6 months) plus a jobs endpoint.
**Substitute:** a company-level growth endpoint, plus a job-posting-title filter for the hiring signal, plus a crawl for the JD content. Three capabilities instead of two, but none of them exotic.

**Slice:** Companies that are both growing their sales team and posting for more roles at the same time.

**Copy:**
> "[Company]'s sales team grew [X%] last quarter and there are still [N] open AE roles. The incoming reps are going to inherit whatever list and infrastructure exists today. That is the moment when bad data starts costing quota. We help teams get ahead of that. Worth a call before the next cohort starts?

---

### Combo 3: Founded Year + Headcount Growth
**Direct:** a founded-year filter plus a department growth-rate filter (sales team growing 30%+).
**Substitute:** company-profile data for founded year plus a company-level growth endpoint. A single company-discovery tool often covers both halves on its own (DiscoLike does, for instance), which makes this the easiest combo to assemble.

**Slice:** 3 to 5 year old companies just now scaling their sales team for the first time.

**Copy:**
> "[Company] is [X] years old and the sales team grew [Y%] in the last [timeframe]. That combination usually means the founding-era process is under real pressure. The system that worked at 5 reps does not survive 15. We help [title]s at this stage [result]. Is that where you are?

---

### Combo 4: Ads Intelligence + Headcount Growth
**Direct:** an ads-intelligence endpoint plus a department growth-rate filter.
**Substitute:** the Meta and Google ad-transparency registries for ads-running confirmation (via a scraping actor or a crawl), plus a company-level growth endpoint for direction. LinkedIn Ads data stays out of reach either way.

**Slice:** Companies investing simultaneously in paid acquisition and outbound headcount.

**Copy:**
> "[Company] is running [platform] ads and the sales team grew [X%] in the last [timeframe]. Two-track growth without a shared data layer usually means the paid and outbound motions are pulling from different pictures of the same accounts. We help teams in that position [specific result]. Open to a quick call?

---

### Combo 5: Jobs Data (JD Content) + Profile Search
**Direct:** a jobs endpoint for JD content plus a profile lookup for work history.
**Substitute:** search plus crawl for the JD content off ATS pages, and a Sales Nav export for work history. Achievable with no dedicated tool as long as the contacts are LinkedIn-sourced.

**Slice:** Contact at target company who previously ran the exact function referenced in the company's current job posting.

**Copy:**
> "[First name] — [Company] has a RevOps role open that looks like the same scope you were running at [previous company]. The hire is going to land in the same environment you built from scratch there. We helped [similar company] set that function up. Worth a conversation before the new person starts?

---

## Build Priority

Based on signal-to-reply-rate ratio and on how much is lost when the direct capability is missing. The Gap column is the one that should drive a buying decision: a large gap is an argument for filling that capability slot, a small gap says the substitute is good enough.

| Priority | Signal | Direct capability | Substitute path | Gap |
|---|---|---|---|---|
| 1 | Job Change + Profile Search | Job-change filter + profile lookup | Sales Nav export (handles both) | Minimal. Sales Nav is nearly equivalent. |
| 2 | Jobs Data (JD content) | Jobs endpoint with JD text | Job-posting filter + crawl + search + classification | Minimal. The crawl workflow is close. |
| 3 | Headcount Growth + Jobs Data | Department growth-rate filter | Company-level growth endpoint + job-posting filter + crawl | Moderate. Growth % is directional, not precise. |
| 4 | Who They Sell To | Search-time sold-to filters | Classify from captured description and homepage text (free, post-list) | Moderate. Search-time filtering needs the native filter; post-list classification is free but med coverage. |
| 5 | Ads Intelligence | Ads-intelligence endpoint | Meta/Google transparency registries via actor or crawl | Partial. LinkedIn Ads not replicable. |
| 6 | Founded Year | Founded-year filter | Standard company-profile data | None. Ordinary company data covers it. |
| 7 | Headcount by Department | Department headcount filter | Crawl LinkedIn People page + classification | Moderate. Cannot filter at TAM scale, only enrich a known list. |
| 8 | Job Change Detector (known list) | Batch job-change lookup | Monitoring service + Sales Nav saved-lead alerts | Small for ongoing monitoring. Larger for one-time batch checks. |

Launch as many of these signal campaigns as your warmed sending capacity supports, as one Wave-1 coverage portfolio with offer and copy held constant and slices non-overlapping. The priority order above sets the **launch sequence** when capacity forces a choice (lead with the highest reply-rate-per-effort signals), **not** a one-at-a-time cap. The aim is to maximize the number of proven, viable signal campaigns live at once; thin capacity launches the top-priority ones now and queues the rest for the next wave. "Viable" = **≥500 enriched companies carry the signal** (the ≥500-company signal floor, `/campaign-strategy`'s HARD RULE, operator directive 2026-07-12, which retired the old ≥100-company and ≥100-contact floors); never contrive a thin slice just to add a campaign.

**Collection vs launch are different layers (HARD RULE).** Launch sequencing is about **launch**, not data collection. The TAM build collects **every obtainable signal and data point up front across the whole qualified TAM** (the Collection Completeness HARD RULE in `/data-point-discovery` and `/tam-build`) — signal collection is a MUST, never optional or tiered — so the full slice menu always exists for the client. You then *launch* campaign slices from that menu, maximizing the proven-signal campaigns each wave runs depending on which signals each company carries.

---

*Tools named as examples in this doc, none of them FNNL's: A-Leads, DiscoLike, WizLeads, Spider Cloud, Serper, Apify, Trigify, LeadsFriday, BetterContact, Deliverable.co, DeepSeek, RevCode, Blitz, GetLatka, Scrap.io, Prospeo, LeadMagic, Apollo, Sales Navigator. They illustrate what a capability looks like when a tool fills it. Which tool FNNL actually uses for each capability is recorded in `stack-contract.yaml` and nowhere else.*
