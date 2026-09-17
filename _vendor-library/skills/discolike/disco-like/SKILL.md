---
name: disco-like
description: The authoritative reference + capability map for DiscoLike — a proprietary crawl of 70M+ company websites across 180+ countries (SSL-validated ~98%, refreshed every 90 days). Use for COMPANY discovery (lookalike from seed domains or natural-language ICP), per-company / per-contact AI RESEARCH (DiscoGen), CONTACT discovery and search (ContaGen + search-contacts), ICP-fit VALIDATION, firmographic ENRICHMENT (bizdata / growth / footprint score / website text), and SEGMENTATION (tags, saved queries, exclusion lists). Other list-building skills (`/tam-build`, `/data-point-discovery`, `/lead-source-strategy`, `/campaign-strategy`, `/email-waterfall`, `/blitz-list-builder`) should read the Capability Map below to use every feature correctly and cheaply. Outputs company-domain or contact CSV for downstream qualification, enrichment, and the email waterfall.
---

# Disco-Like

DiscoLike finds and researches companies (and the people in them) from a proprietary web crawl — **not** a LinkedIn-scraped database. That is its edge: it covers niche verticals, local businesses, and non-English markets that LinkedIn-dependent tools miss. Use it for **company discovery and research**, then qualify, enrich contacts, verify emails, and run list QA downstream.

> This file is both the **operating skill** (how to run a discovery/research job well) and the **capability map** that every other list-building skill reads to know what DiscoLike can do, what each tool costs, and what the current plan actually allows. If you only read one section before routing work to DiscoLike, read **Capability Map** and **Plan Reality**.

## Material Decision Rule

When this skill reaches a material fork, name the realistic options, recommend the strongest path, and explain why the main alternatives are weaker before committing.

Ask before choices that affect spend, provider routing, source of truth, list quality, campaign direction, client-facing output, live systems, scraping or account risk, or legal/compliance risk. For low-risk reversible choices, state the recommendation and proceed.

Do not turn failed or unsafe paths into user-facing options. If this skill's QA rules or stop gates reject a path, filter it out and explain the blocker only when useful.

When asking the user, use the Claude Desktop native Interactive Inputs / Choice Prompts pattern from `/clarification-first`: recommended option first, short choices, and Custom answer last when a custom answer is plausible.

## Access — two paths (MCP is the feature-complete surface)

DiscoLike is reachable two ways. They share one account and one plan, so the **Plan Reality** gates below apply to both.

- **MCP (default for interactive / agentic runs in Claude Code).** Server `discolike` (`https://api.discolike.com/v1/mcp`), tools named `mcp__discolike__*`. Auth is **OAuth 2.0, browser-based — NOT the API key**; it is already authenticated and `√ Connected` in this build (see [[coldoutbound-mcp-servers]]). The MCP exposes the **whole surface** — Discover, DiscoGen, ContaGen, validate-icp-fit, contact search/match, counts, enrichment, segmentation/tags/saved-queries, account. Per the repo MCP-first rule, **prefer the MCP tool** over a script or browser whenever it can do the op. If the session ever shows "Needs authentication," the clean fix is `/mcp` → discolike → Authenticate → Allow (the operator is logged in; one click, no password).
- **REST API (headless / VPS / bulk-script path).** Base `https://api.discolike.com/v1/`. Auth header **`x-discolike-key: <key>`** (NOT `Authorization: Bearer`, NOT `x-api-key`). Key is `DISCOLIKE_API_KEY` in `scripts/.env` and the [[api-keys]] registry — load it, never re-ask. Use REST when there is no live MCP session (scheduled VPS jobs, deterministic resumable bulk pulls). The repo's helper scripts use `GET /v1/discover?domain=<seed>&country=<ISO2>&max_records=<n≥5>` (also `icp_text=` / one-call `icp_prompt=`); `max_records` minimum is 5. The REST surface the scripts use today is essentially `/discover` — the richer DiscoGen/ContaGen/validate/segmentation tools live on the MCP, so reach for the MCP when you need them.

**The UI mirrors this surface.** DiscoLike's app sections (Discover, DiscoGen, ContaGen, segmentation, the filter panels) map one-to-one onto the MCP tools and account feature flags documented here — the programmatic surface IS the authoritative source for what each UI section does, so this file is kept in sync from `account-status` + `list-discogen-integrations`, not from screen-scraping.

## Plan Reality — check `account-status` once per session (this is load-bearing)

`mcp__discolike__account-status` returns the plan, **feature flags**, and limits. Several powerful filters and tools are **plan-gated** — calling a gated feature does not silently degrade, it is unavailable. **Always build the recommended flow from the flags that are actually ON for the live plan; treat the rest as upgrade-only.**

**Current plan: `pro`** (verified 2026-07-03 via `account-status`). Spend cap **$199/mo** (MTD ~$128). Upgraded from Starter — `query_exclusion`, `query_inclusion`, and `segmentation` are now ON, and the company exclusion list holds up to **30,000** domains.

| Feature flag | On `pro`? | Tools / params it powers | Plan needed if off |
|---|---|---|---|
| `discover` | ✅ | `discover-similar-companies`, `count-matching-domains` | — |
| `contacts` | ✅ | `search-contacts`, `count-contacts`, `match-contacts`, `contact-lookup` | — |
| `discogen` | ✅ | `run-discogen`, `run-discogen-personas`, `validate-icp-fit`, `generate-contacts` (ContaGen) | — |
| `extract` | ✅ | `extract-website-text` | — |
| `append` / `bizdata` | ✅ | `append-data` (datasets `bizdata`, `redirects`, `domain_status`, `growth`), `business-profile` | — |
| `score` | ✅ | `digital-footprint-score`, `growth-metrics` | — |
| `saved_queries` | ✅ | `save-mcp-query`, `list-saved-queries`, tags (`add`/`remove`/`list`/`get-domains-by-tags`) | — |
| `usage` | ✅ | `usage-statistics` | — |
| `query_exclusion` | ✅ | `exclusion_query_id` filter in discover/search — **the self-dedup + suppression lever** | — |
| `query_inclusion` | ✅ | `inclusion_query_id` filter in discover/search (search *within* a saved list) | — |
| `segmentation` | ✅ | AI clustering of a domain list into groups — **use it to form case-study GROUPS** | — |
| `tech_stack_filtering` | ❌ | `tech_stack` / `negate_tech_stack` filter in discover/count | **team** |
| `vendors` | ❌ | `append-data` dataset `vendors` (tech-stack of a domain) | **team** |
| `bulk_matching` | ❌ | `bulk-match-contacts` | **team** |
| `company_matching` | ❌ | fuzzy company-name → domain resolution | **team** |
| `subdomain_targeting` | ❌ | `subdomain` / `negate_subdomain` filter | **company** |
| `domain_redirects` | ❌ | `append-data` dataset `redirects` as a standalone signal | **team** |
| `public_link_data` / `subsidiaries_data` / `linkage` | ❌ | SEC/Crunchbase links, parent/subsidiary graph | **enterprise** |

**Limits on Pro:** company exclusion list size = **30,000**; contact exclusion list size = **60,000**.

**Self-dedup + suppression (now ON — use it).** DiscoLike bills **per record RETURNED**, and lookalike paging otherwise re-returns the same companies (~5:1 dup). Because `query_exclusion` is now available, save the query's already-pulled domains to an exclusion list and reference it (`exclusion_query_id`) on the next discover page, so DiscoLike returns and BILLS only net-new companies — client-side dedupe cleans the list but does NOT save the charge. The same exclusion pattern applies to the client's existing customers, prior-wave companies, and the suppression registry (prevents double-CONTACT, not just double-pay). Confirm the exclusion filter is honored on the run before relying on the saving.

**Case-study grouping via AI Segmentation (now ON).** Upload the client's customer / case-study list and let DiscoLike cluster it into sub-verticals; each cluster becomes a case-study **GROUP** (its own seed set → its own group-TAM → its own campaign, per `/tam-build`'s Case-Study-Anchored Discovery HARD RULE). This is the fastest way to form the groups instead of guessing them.

**Still gated on Pro (upgrade-only):** discovery cannot filter by `tech_stack` / `vendors` (team), and there is no bulk / fuzzy name-matching (team). So "find companies using HubSpot" is **not** a Pro discovery filter — get that signal a different way (DiscoGen research with `web_search`, or a tech-stack tool in `/lead-list-tech-stack-research`), or recommend the upgrade. `/data-point-discovery` must therefore NOT catalog `tech_stack` / `key_vendors` as *DiscoLike-obtainable*.

| Gated workflow (upgrade value — input for the operator, not usable today) | Why it's powerful | Tier |
|---|---|---|
| **Tech-stack / vendor filters** (e.g. Shopify stores without a Facebook pixel; reverse-engineer the ICP from what the client's best customers use) | A cross-check that's near-impossible any other way — plus a ready outreach angle | **team** |
| **Match** (names→domains, then search *within* that list — include-by-list already works on Pro) | Turns ANY external list (conference attendees, registries, directories) into a searchable DiscoLike universe | **team** |

These are real revenue levers — worth weighing against the $199/mo Pro cap when a client's campaign needs one of them.

## Capability Map — what each tool does, what it costs, when to use it

Cost classes: **FREE** = no per-record credit; **REC** = bills per record returned (the DiscoLike credit — records are the cost driver); **BYOK** = uses *your own* configured LLM + Serper keys, so the spend is your Grok/OpenAI tokens + Serper queries, **not** a DiscoLike per-contact credit; **NET-NEW** = free for a domain already in your discovered/enriched set within the cache window, otherwise one net-new record. **Cache window = ~90 days / 3 months** (CEO playbook: records are charged once and cached for 3 months; re-running a search rebuilds it free in-window; after 3 months keywords/homepages have changed, the cache invalidates, and you pay to repopulate — consistent with DiscoLike's 90-day data refresh). *Note: the `extract-website-text` tool description says "this billing cycle"; treat the 90-day cache as the governing rule and verify if a domain near the edge re-bills.*

### Discover & count (company universe)
| Tool | Cost | Use when |
|---|---|---|
| `discover-similar-companies` | REC (per company) | **The primary prospecting tool.** Build a company list from seed domains (lookalike), a natural-language ICP, structured filters, or any hybrid. See **Discover** below. |
| `count-matching-domains` | FREE (verified — no records/spend/request charge, runtime-probed 2026-06-12, **re-verified 2026-07-17**) | Preview how many companies match a set of **structured** filters BEFORE paying to discover. Call it liberally to size a universe. Does NOT accept seed `domain`/`icp_text`/`icp_prompt` (those are discover-only) — for a seed/ICP-text query, size it with a small `max_records` discover sample instead. **Also on REST** (`GET /v1/count?country=US&employee_range=11,50` with `x-discolike-key`, no MCP OAuth needed), so it works in headless/non-interactive sessions. **The seed rejection is schema-level, not a silent ignore** (2026-07-17 probe): passing `domain`/`icp_text`/`icp_prompt` returns `{"detail":[{"type":"extra_forbidden",...}]}`, so you can never accidentally believe a filter count is a seeded count. That hard boundary is what makes it a structurally honest gap for archetype K (see `/lead-magnet-brainstorm` K4). |

### AI research — DiscoGen (per-company) & persona research (per-contact)
| Tool | Cost | Use when |
|---|---|---|
| `run-discogen` | BYOK (+NET-NEW context) | Offload per-COMPANY research (funding, hiring, pricing tiers, news, competitor/positioning, any "is this true of the company?" question) across up to 10,000 domains in parallel — instead of crawling/web-searching them one by one yourself. Auto-detects output format. **Async → poll `get-discogen-status`.** |
| `run-discogen-personas` | BYOK | Same, per-CONTACT (recent activity, publications, job change, talking points) given persona IDs from `search-contacts`/`contact-lookup`. Async → poll. |
| `validate-icp-fit` | BYOK (+NET-NEW context) | Score domains `yes`/`partial`/`no` + confidence + reasoning against an ICP sentence; DiscoLike writes the prompt. Cheapest structured fit pass **for a sample / small batch**. Async → poll. ⚠️ **Scale ceiling below** — returns ALL verdicts to context; not for thousands of rows. |
| `get-discogen-status` | FREE | Poll a DiscoGen/validate/ContaGen task by `task_id` every 30–60s until `completed`/`failed`/`cancelled`. |
| `cancel-discogen` | FREE | Stop a running task. |
| `list-discogen-integrations` | FREE | List configured LLM + search providers and their UUIDs. **Call before pinning a non-default model.** See **Model Routing**. |

### Contact discovery, search, match, enrich
| Tool | Cost | Use when |
|---|---|---|
| `generate-contacts` (ContaGen) | BYOK (not billed per contact) | DISCOVER new contacts at a list of domains via your own LLM+search (ICP/persona text + domains). Returns candidate rows (name, title, dept, seniority, email, LinkedIn, skills) + the company **email pattern**. Web search always on. Async → poll. Treat `email`/`linkedin` as **candidate data** until verified. |
| `search-contacts` | REC (per contact) | Find indexed decision-makers by role/seniority/dept/skills/company. Results keyed by company domain with a nested `contacts` array. `icp_prompt` auto-extracts filters; auto-chains company discovery for company-level signals. `results_by_company` (default 5) spreads results across more companies; set `0` to uncap per company. ⚠ **Index/`has_email` mode is NOT a sendable-contact source** — see the callout below. |
| `count-contacts` | FREE | Preview contact volume for the same filters before paying. |
| `match-contacts` | FREE (no credits) | Look up a **named** person → `persona_id` + match score. |
| `contact-lookup` | REC | Hydrate ONE `persona_id` or LinkedIn URL into full contact data (email, phone, skills, history). |
| `bulk-match-contacts` | REC (if `enrich`) | Batch-match up to 500 names; `enrich=true` hydrates full data. **Gated → team plan** (not on Starter). |

> **⚠ HARD RULE — `generate-contacts` is the sendable-contact path, NOT `search-contacts` index mode.** `search-contacts` in index/`has_email` mode returns the company **email pattern** (`{first_initial}{last_name}@domain`) and, on thinly-indexed companies (e.g. small local/healthcare orgs), can return **fabricated names** — these are pattern guesses, not real people, and they bounce. (Proven live on a B2B SaaS client 2026-06-13: index-mode names like "Haresh Jaiswal" were fabricated, and BetterContact found 0/25 of the pattern emails.) For contacts you intend to email, use **`generate-contacts`** (real named execs + title + LinkedIn, web-search backed) or a people-DB; treat any `email`/`linkedin` as candidate data and verify it in `/email-waterfall`. **Never ship a list of pattern emails or names-missing rows** — `/email-waterfall`'s Verification Doctrine requires a real first + last name before any finder runs and rejects index/pattern emails. `match-contacts`/`contact-lookup`/`bulk-match-contacts` (named-person hydration) are fine because they key on a real person.

### Enrichment (firmographics, growth, footprint, website text)
| Tool | Cost | Use when |
|---|---|---|
| `business-profile` | REC | One domain → firmographics (name, status, footprint score, address, phones, socials, description, keywords, industry, employees, revenue, business model). |
| `append-data` | REC (per domain) | Bulk-enrich up to 100 domains. Datasets: `bizdata` ✅, `redirects`/`domain_status`/`growth` ✅, `vendors` ❌(team). Pick only the datasets you need. |
| `growth-metrics` | REC | One domain → 5 quarters of employee/footprint/subdomain trend (modeled from ~20 web signals). |
| `digital-footprint-score` | REC | One domain → 1–800 web-authority score + component breakdown. A reliable **company-scale / activity proxy**. |
| `extract-website-text` | NET-NEW | Homepage text (English-translated) from the cached crawl, instant (no live crawl). **FREE for a domain already discovered/enriched this cycle** — a major cost lever for fit checks on companies you just discovered. |

### Segmentation, saved queries, tags, exclusion lists
| Tool | Cost | Use when |
|---|---|---|
| `save-mcp-query` | FREE | Persist discovery/contacts/append results as a query visible in the app (action: `discover`/`segment`/`contacts`/`append`/`match`); keep domain + custom columns (e.g. similarity). |
| `list-saved-queries` | FREE | Reuse a prior list or fetch a `query_id` for inclusion/exclusion (inclusion/exclusion themselves are pro-gated). |
| `add-tags-to-query` / `remove-tags-from-query` / `list-tags` | FREE | Organize saved queries by label (e.g. `fintech`). |
| `get-domains-by-tags` | FREE | Pull all domains from queries with a tag (`any`/`all` match; paginated). |
| `save-exclusion-list` | FREE* | Save domains/persona_ids to exclude later. *Company exclusion list size = 0 on Starter (contacts up to 20,000); referencing it in discovery needs `query_exclusion` (pro). On Starter, dedupe excluded **companies** client-side. |

### Account
| Tool | Cost | Use when |
|---|---|---|
| `account-status` | FREE | Plan, feature flags, limits, MTD usage. **Call once at the start of a DiscoLike job** to know what's allowed. |
| `usage-statistics` | FREE | Month-to-date requests/records/spend, max spend, credits — for `/api-cost-governance`. |

## Model Routing — GPT 5.3 default, Grok 4.3 strong alternative, Serper search

Every DiscoGen-family tool (`run-discogen`, `run-discogen-personas`, `validate-icp-fit`, `generate-contacts`) accepts `integration_id` (which LLM) and `search_provider_id` (which web-search engine). These run **BYOK** — on the account's own provider keys — so the cost is the underlying model tokens + Serper queries, not a DiscoLike credit.

**Default = GPT 5.3** for validate/DiscoGen/ContactGen (DiscoLike CEO recommendation, June 2026 — "it got cheaper since GPT 5.5 came out, and works really well"; decided with the operator 2026-06-12).

> **⚠️ Important — GPT 5.3 must be PINNED; you can't get it by omitting the param.** The DiscoLike **org default is still Grok 4.3** (`is_default=true`), so *omitting* `integration_id` gives you Grok, not GPT 5.3. To make GPT 5.3 the default, pass `integration_id = f23a3f29-1a6f-4ab6-a35a-71cf3140019e` on every DiscoGen-family call. (Alternatively, change the org default to GPT 5.3 in the DiscoLike app → then omitting it works; not done as of 2026-06-12.)

- **Search default = Serper** (`serper/search`, **$0.001/query**) — omit `search_provider_id` to use it.
- **Strong alternative = Grok 4.3** (`xai/grok-4.3`) — omit `integration_id` to use it (it's the org default). **Use Grok specifically when you need X/Twitter search** — `include_x_search` is xAI-only — for social / "why-now" signals; and as the fallback if GPT 5.3 errors or rate-limits.
- **CEO hard rule: don't drop below GPT 5.3 / Grok 4.3.** Older models get "neutered" when new ones launch and start missing companies they used to know — the few cents saved aren't worth the recall loss.

**Current integration UUIDs (verify live with `list-discogen-integrations` — these are account-specific and can change):**

| Role | Name | `integration_id` | Web search |
|---|---|---|---|
| LLM — **default** (pin this) | OpenAI GPT 5.3 | `f23a3f29-1a6f-4ab6-a35a-71cf3140019e` | yes |
| LLM — **alternative / X-search** | Grok 4.3 | `e81031d6-f1e5-4533-9fb0-6017145c7a92` | yes (+ `include_x_search`) |
| LLM — cheap crunch (no web) | DeepSeek Reasoner | `4ea6564f-3b58-4843-b273-7e68c695c592` | no |
| Search — **default** | Serper | `c08f249e-d780-4d8d-a064-8a6c7bd036c7` | $0.001/query |

Notes that change routing:
- **`include_x_search` (X/Twitter) works on xAI models only** — so switch to Grok 4.3 for social / "why-now" signals that need X.
- A model with `supports_web_search=false` (DeepSeek Reasoner, o3-mini) ignores `web_search=true` — only use those for context-only crunching, never for live research.
- **Search depth is a direct cost lever**: `search_context_size` = `low` (2 queries), `medium` (4), `high` (6). Default `low` for `run-discogen`; `validate-icp-fit` defaults `web_search=false` (homepage context only — cheapest). Raise depth only when the question genuinely needs off-homepage evidence (funding, news, hiring, partnerships).
- This pairs with `/ai-model-routing`: DiscoGen is a **BYOK research surface** (GPT 5.3 default + Serper); don't duplicate a Perplexity/Claude pass over the same domains.

## HARD RULES — cost control + ICP filter (bind EVERY DiscoLike discovery call)

DiscoLike bills **per record RETURNED, not per unique company**, so BOTH duplicate rows and out-of-ICP rows are billed. These two hard rules stop that spend at the source. They bind every `discover-similar-companies` / REST `/discover` call (and their `count` previews), in this skill and in `/tam-build`.

### HARD RULE A — No overpull: count first, one clean pull, exclusion-guarded top-ups.

The ~5:1 dup cost on an early client build (14,000 rows billed for only ~2,708 real companies) came from RE-PULLING a finite lookalike universe seven times without a server-side exclusion list. Never repeat it:

1. **Count before you pay (free).** Run `count-matching-domains` (or a small `max_records` discover sample for a seed/ICP-text query, which counts can't take) to size the universe FIRST. Set volume expectations off THAT number, never off a broad firmographic count. If the real universe is ~2,700, do not try to pull 7,000.
2. **One clean, correctly-configured pull.** Up to 10 seeds, `consensus=10`, `min_similarity=70`, `variance=MEDIUM`, an explicit `max_records`. Let `variance=MEDIUM` auto-stop when it senses noise. That single pull IS the lookalike TAM for that seed set.
3. **Any follow-up pull MUST be exclusion-guarded (self-dedup).** If one pull is not enough, do NOT re-run the same or a rotated query blind. Save the pulled domains to a company exclusion list (`save-exclusion-list`) and pass `exclusion_query_id` on the next pull, so DiscoLike returns and BILLS only net-new companies. This is available now on **Pro** (company exclusion list = 30,000; it was Pro-gated on the old Starter plan, which is exactly why that early build could not use it and paid for the dups). Widen with a lower `min_similarity` or fresh seeds, but always under the exclusion.
4. **Saturation = widen under the exclusion, not blind re-pull.** When a fresh 100-sample's fit drops below ~20%, or new-unique-per-page collapses, the *current* query is saturated: do not re-pull the same or a rotated query blind (that only re-pays for the dups steps 1-3 exist to prevent). Under the high-volume default ([[high-volume-default-doctrine]]), saturation is instead the cue to WIDEN the query along the fit-gated ladder (fresh/stronger seeds → lower `min_similarity` toward 60 → new markets → wider headcount bands → merge sibling group-TAMs → broad ICP filter last), always UNDER the exclusion list (`exclusion_query_id`) so DiscoLike bills only net-new. Keep the thresholds distinct: the ~20% new-unique-per-page collapse is the widen SIGNAL on one query; the ≥80% sample-fit rubric is the TUNING target for the tight core, NOT the widening stop (widening deliberately reaches less-similar companies, so fit drops there by design, and past-core companies are flagged `discovery_motion = expansion`). The true STOP for expansion is when a widened query's fit drops below the rubric's ~50% REWORK floor (you are pulling noise), or the campaign's 1,000-20,000 lead target is reached, whichever first. Never stop merely because a company-count target is hit before then, and never require every widened rung to re-clear 80%. Only volume pulled below the ~50% rework floor is bounce risk, not volume (per `/tam-build`).

### HARD RULE B — Every discover/count call carries the client's employee-size range + location (+ hard filters).

Never run a bare lookalike or ICP-text query without the client's structured ICP filters attached, or DiscoLike returns and bills out-of-ICP companies. On EVERY `discover`/`count` call, read `client-profile.yaml` `icp_hard_filters` and pass:

- **`employee_range`** = the client's exact `headcount_buckets_in` (as `"min,max"`), AND
- **`country`** (ISO-2 / region alias) and **`state`** wherever the ICP is geo-bounded, AND
- any other hard filter the ICP sets (`revenue_range`, `business_model`, `language`, and `negate_category` for hard-no verticals).

Never a hardcoded range. Because `employee_range` is bucket-based and returns any OVERLAPPING bucket (requesting `100,2000` also returns `51-200` down to 51 and `1001-5000` up to 5,000, all billed), also **post-filter the returned rows to the exact `headcount` bucket set** after the pull. **Lookalike (`domain`-seed) mode honors these same filters at the same granularity, so attach them to the lookalike too, not only to filter-only queries.**

## Cost-efficient recommended flow (cost-safe)

Records are the cost driver. The whole game is **size cheaply → validate on a small sample → only then scale → enrich only survivors.** This mirrors `/tam-build`'s qualify-then-enrich logic. It IMPLEMENTS Hard Rules A + B above.

> **Don't re-pay to re-derive fit.** DiscoLike already crawled these sites and returns each company's `description`, `industry`, `business_model`, and `keywords` (plus free homepage text via `extract-website-text`). So **never run an external crawler (Spider) + search (Serper) just to judge ICP fit** — classify the text DiscoLike already gave you, on-disk with DeepSeek. Keep the fit *gate* though: `disco_score`/similarity is a relevance prior, not a good/bad verdict (verified ~68% true-ICP on lookalike, ~39% on category), so a cheap classify still earns its keep — it removes off-ICP rows AND stops you paying per-record enrichment on them. Reserve a deeper crawl only for the minority of rows too ambiguous to judge from the returned text + homepage.

1. **`account-status`** once — confirm plan + flags (so you don't build a flow on a gated feature).
2. **Size before you pay.** Run `count-matching-domains` on the structured filters to see universe size (free). For a seed/ICP-text query (which counts can't take), pull a small `max_records` discover sample instead.
3. **Discover a small sample** (50–100) with `icp_prompt` (one-shot) or seed `domain` + structured filters set to the client's **exact** `icp_hard_filters` buckets (see Discover caveats).
4. **Validate the 100-record sample and TUNE THE QUERY to 80%+ before scaling (the CEO's core loop).** Run DiscoLike `validate-icp-fit` on the sample (server-side, ~40¢/100), then read the fit score against this rubric:

   | Sample fit | What to do |
   |---|---|
   | **80%+** | **Done — stop touching the query. Tweaking a query that already validates well makes it worse.** 92% is excellent. |
   | 75–80% | Minor tweaks only — review keywords, seed domains, industry group, business model. |
   | <75% | Work on it: run the Claude feedback loop below, check/replace the industry group, swap weak seeds. |
   | <50% | Rework the search from scratch. |

   **The Claude feedback loop (how to tune):** feed the sample (it returns each company's homepage text + the lookalike domains) plus the client onboarding form to Claude and ask "is this aligned with the ICP?" Claude can suggest removing a sentence from the lookalike text, nuking or adding a keyword, or swapping a seed domain — tweak, resubmit, re-validate. A powerful move: **promote the validated-`yes` companies into the seed set** (still max 10 total). `/icp-prompt-builder` (Claude-native, no API spend) is the alternative when you want a reusable fit prompt rather than DiscoLike's one-shot verdict. **Hard verticals are real** — expect ~1 in 10 searches (e.g. robotics, where healthcare/agri/manufacturing robotics blend) to top out messy no matter what; the other 9 land ~90%.
   - **At full-TAM scale, never read thousands of verdicts inline** — once the query validates 80%+, scale it and run any per-row fit label as a file-based DeepSeek-classify batch off the captured discover text (`/tam-build` Layer 1a), per the Scale ceiling above.
5. **Scale** with `discover-similar-companies` once fit is locked, paging deeper rather than re-pulling (see Saturation levers). Apply the bucket post-filter.
6. **Enrich survivors only** — `append-data` (`bizdata` for the batch; `growth`/`score` where the campaign needs them). `extract-website-text` is free for already-discovered domains.
7. **Research (optional)** — `run-discogen` on survivors for the campaign's "why-now"/qualifier questions (`web_search` only where needed).
8. **Contacts** — for contacts you intend to email, use ContaGen **`generate-contacts`** (real named execs + title + LinkedIn) as the sendable-contact path; `search-contacts` index/`has_email` mode is firmographic signal only, NOT a sendable source (it returns pattern emails + can fabricate names — see the Contact-discovery callout). Verify emails downstream in `/email-waterfall`, never trust raw `email`/`linkedin`, and never run the waterfall finder on a row without a real first + last name.
9. **Save + tag** the result (`save-mcp-query` + tags) so a later wave or refresh reuses it.

Every paid step routes through `/api-cost-governance` (preview records × per-record, check balance, post-run ledger) before scaling — the sample in step 3 is the cheap first pass.

## Discover — the filter reference (and how to get accurate lists)

`discover-similar-companies` takes all inputs inside `filters`. Four discovery modes, combinable:

- **`icp_prompt`** (one-shot, recommended start): a natural-language ICP. Auto-extracts structured filters, generates ICP text, suggests seed domains, and returns `applied_filters` so you can see what it inferred and refine.
- **`icp_text`**: raw semantic vector search — does NOT auto-extract filters; you set structure yourself (more control, for iteration).
- **`domain`** (lookalike): up to 10 seed domains. **Seed quality caps list quality** — see Seed Quality Rules.
- **Structured filters** (combine with any of the above): `category` (54 industries, each with a precise definition — read it; a raw `category=X` pull is noisy, e.g. ~39% true-ICP for HEALTHCARE because vendors/SaaS get labeled under the vertical), `country` (ISO-2 + region aliases EU/LATAM/MENA/APAC/NORDICS/DACH/BENELUX/GCC/ASEAN/CEE/ANZ), `state`, `employee_range` (`"min,max"`), `revenue_range` (`"min,max"` raw numbers), `business_model` (B2B/B2C/B2G/D2C/…), `language` (48), `phrase_match` (up to 20 exact site-text fragments — a strong precision lever), `social` presence, `start_date`, `min/max_digital_footprint` (0–800), and `negate_*` variants of nearly all. Gated on Starter: `tech_stack`, `subdomain`, `exclusion_query_id`, `inclusion_query_id` (see Plan Reality).

**Output control:** `max_records` (5–10000, default 100), `offset` (paging), `fields` (trim the payload), `format` (`rows`/`columnar`), `exclude_leadgen` (default true — keeps junk lead-gen sites out; leave on), `include_search_domains` (default false — keeps your seeds out of results).

**⚠️ SET THESE EXPLICITLY for a normal lookalike — the MCP defaults are the EXTREME settings, not the everyday ones (per the DiscoLike CEO cheat sheet, June 2026).** Leaving them unset gives tightest-consensus + no-similarity-floor + max-variance all at once — over-narrow AND unfiltered AND noisy.

| Param | MCP default | Set to (normal lookalike) | Why |
|---|---|---|---|
| `consensus` | `1` (tightest) | **`10`** | The UI default. One seed auto-appends ~9 more from top results, so the vector reflects the whole seed set. `consensus=1` is the niche "give me a perfect clone of this ONE company" (VC-style) setting — rarely what you want. |
| `min_similarity` | `0` (no floor) | **`70`** | The UI default similarity floor; raise to `80` occasionally, almost never lower. |
| `variance` | `UNRESTRICTED` (fills the pull no matter the noise) | **`MEDIUM`** | Lets the system auto-stop when it senses noise. Use `UNRESTRICTED` only for hard verticals where it stops too soon — then validate batches manually. |
| `exclude_leadgen` | `true` | leave **`true`** | Keeps junk lead-gen sites out. |
| `redirect` (redirect-to-real-domain) | `false` | leave **off** | CEO: "it's going to be garbage." |

**Headcount/revenue bucket-overlap caveat (verified 2026-06-12, see [[discolike-tam-build-gotchas]]):** `employee_range` is **bucket-based and returns any OVERLAPPING bucket.** Requesting `100,2000` returns the whole `51-200` bucket (down to 51) AND the whole `1001-5000` bucket (up to 5,000). DiscoLike still charges the per-record credit for every overlapping-bucket row. So (a) set the range to the client's **exact** `headcount_buckets_in`, and (b) **post-filter returned rows by their `headcount` bucket** to the ICP set. Lookalike (`domain`-seed) mode applies the same firmographic filters at the same bucket granularity — not looser. Buckets: 1-10, 11-50, 51-200, 201-500, 501-1000, 1001-5000, 5001-10000, 10001+.

### Saturation levers — getting MORE, more-accurate companies

Lookalike off a fixed seed set **saturates** — the similarity universe is finite, so deep pulls hit heavy duplicates (~5:1 dup ratio observed; see [[discolike-tam-build-gotchas]]). To widen coverage and accuracy instead of re-paying for dups:

> **High-volume default: saturation is a TRIGGER TO WIDEN, not a stop.** Under the high-volume default ([[high-volume-default-doctrine]]), a group-TAM's natural saturation (~2,700 companies off one seed set) is the cue to WIDEN the query toward the campaign's 1,000-20,000 lead volume target, using the levers below in this fit-gated order: (1) more/stronger seeds, (2) lower `min_similarity` toward 60 / raise `variance`, (3) more markets/geographies, (4) wider headcount bands, (5) merge sibling seed sets / group-TAMs into one big campaign, (6) broad ICP-filter top-up last. This reframes the per-query saturation reads in this subsection (the ~20% fit / unique-per-page-collapse signals): those tell you the *current* query is exhausted, so it is time to widen, not that TAM-building is over. The fit gate is anchored correctly: **≥80% is the TUNING target for the tight seeded core, NOT the widening stop.** Widening (rungs 3 to 5) deliberately reaches less-similar-but-still-relevant companies, so sample fit drops there by design, and that is allowed. Keep widening while the pull stays on-ICP down to the rubric's ~50% REWORK floor; flag companies pulled past the tight proven-fit core as `discovery_motion = expansion` (offer-led copy). **STOP when fit hits the ~50% rework floor (noise) OR the volume target is reached, whichever first.** Never a blanket ≥80% and never merely a company-count. Requiring 80% on every widened rung would throttle the very company-expansion the 1,000-20,000 lead target needs; only volume pulled *below* the ~50% rework floor is bounce risk, not volume (see `/tam-build`'s expansion ladder).

- **`variance`** (`LOW` → `MID_LOW` → `MEDIUM` → `MID_HIGH` → `HIGH` → `UNRESTRICTED`): result diversity. Raise it to break out of the tight cluster around the seeds; lower it to stay laser-close.
- **`consensus`** (1–20): how many top result-vectors are combined into the search vector. Higher = broader / less specific; lower = tighter to the strongest match.
- **`min_similarity`** (0–99): keep only matches at/above a floor. Raise for precision, lower to widen the net.
- **`offset` paging**: page deeper for net-new rows instead of re-running the same query (which returns the same dups). Dedupe by `domain` across pages.
- **Diversify the query**: rotate seed sets, add `icp_text` variants, or add `phrase_match` fragments that capture the buying signal — more than mechanically deepening one query.
- **`enhanced`** / **`auto_phrase_match`** / **`auto_icp_text`**: AI re-rank / auto-derive helpers when you want DiscoLike to tighten relevance from your inputs.

> The baseline values for `consensus`/`min_similarity`/`variance` are in the operating-defaults table above — these levers WIDEN off that baseline (raise `variance` toward `UNRESTRICTED`, lower `min_similarity` below 70, raise `consensus`).

**Scaling a validated query — the CEO method (sample-gate every batch).** Once your 100-record sample validates 80%+ (see the flow + thresholds below), crank `max_records` to 10,000 and pull. Expect the system to **auto-stop before 10k when it senses noise** — that is the `variance=MEDIUM` behavior, by design. Need more? Pull the **next 10,000 under a company exclusion list (HARD RULE A above)** — save the pulled batch's domains via `save-exclusion-list` and pass `exclusion_query_id` on the next pull, so DiscoLike returns and bills ONLY net-new companies. This is available now on **Pro** (company exclusion list = 30,000 domains). It was PRO-gated on the old Starter plan, which is exactly why that early client build had to dedupe by `domain` after the fact in raw REST `offset` paging and paid the ~5:1 dup cost. Never page a finite lookalike blind without the exclusion. On each new batch, validate a fresh 100-record sample to read the noise. **Stop pulling when sample fit drops below ~20%** — below that you are just trailing and re-paying for noise. Quality decays across batches (first batch ~90% fit, trailing end far lower) — that is expected.

## DiscoGen, ContaGen & validate-icp-fit — usage rules

- **`validate-icp-fit` is a SAMPLE tool — that's by design, not a workaround.** The compute runs **on DiscoLike's side** (no Claude-token burn, clean context) and it appends the full company profile + homepage text to the prompt **for free**, so the model has a rich environment; you pay only your own model tokens — **~40¢ per 100 records on Grok**. The CEO workflow validates **100-record samples**, never the full pull: tune the query until a sample hits 80%+, then validate one 100-sample per scaled 10k batch to watch decay. So the right pattern is *validate samples, trust the tuned query for the bulk* — not "validate every row."
- **⚠️ SCALE CEILING — don't run `validate-icp-fit`/`run-discogen` inline over thousands of rows.** Two reasons: the poll returns the COMPLETE result set into your context (low-hundreds reads fine; thousands flood the conversation — verified on a live client build, [[discolike-tam-build-gotchas]] #4), **and** at ~40¢/100 a 10k validate is ~$40. When you DO need a per-row fit label on the whole set (e.g. `/tam-build`'s gate before paying to enrich), run a **file-based DeepSeek-classify batch on disk** off the discover text already captured (`description`/`industry`/`business_model`/`keywords`) — **~$0.40 per ~2.7k rows, ~27× cheaper than native Validate at that scale, and results never enter context.** Division of labor: native Validate = sample tuning + per-batch QC (accuracy matters, cost trivial at 100 rows); on-disk DeepSeek = full-set residual classifier before enrichment (cost matters at scale).
- **Reality check (the upstream workspace internal, from the playbook):** Sebastian measured DiscoLike's native scoring at **~98% accurate**. The rare misses are **false-negatives** — DiscoLike said *bad* fit but the Spider+DeepSeek check said *good*. So **trust native Validate for the bulk, and spot-check the `bad`/`no` verdicts (not the `maybe`s) on high-stakes lists** with the Spider+DeepSeek pipeline to recover the few good companies it wrongly dropped.
- **Always async.** These return a `task_id` immediately. Poll `get-discogen-status` every 30–60s until `completed` — do not fire-and-forget; downstream work waits on the result. On a long batch, background-poll and do other useful work (per `/autonomous-execution-policy`).
- **Pick `context_mode` for cost.** `run-discogen`: `website` (firmographics + homepage, default) / `profile` (firmographics only, cheaper) / `domain` (name only, cheapest — pair with `web_search`). `run-discogen-personas`: `name_only` → `profile` → `company` → `full` (richest/most expensive). Use the lightest mode that can answer the question.
- **Enable `web_search` only when the homepage can't answer it.** Funding, hiring, news, pricing-page detail, partnerships, reviews, competitor positioning → `web_search=true`. Anything stated on the homepage → leave it off (cheaper). Then size depth with `search_context_size`.
- **ContaGen returns candidate data — but it returns REAL people.** `generate-contacts` discovers *new* personas via LLM + web search (real names, titles, LinkedIn); treat `email`/`linkedin` as unverified until `/email-waterfall` validates them, but the **person is real**, which makes it the correct sendable-contact source. It does not bill per contact (BYOK). Contrast with `search-contacts` index/`has_email` mode, which returns the company email *pattern* and can fabricate names on thinly-indexed companies — candidate firmographic signal, not a list you can email. Never feed pattern emails or names-missing rows into the send path.
- **`validate-icp-fit` vs `run-discogen` for fit:** use `validate-icp-fit` when you want a clean `yes`/`partial`/`no` + confidence + reasoning (it engineers the prompt); use `run-discogen` for any other structured per-company question.

## Field notes from the DiscoLike CEO onboarding (June 2026)

Operational tactics from the playbook, beyond the core flow:

**Contacts — `generate-contacts` (ContaGen) is ~3× LinkedIn coverage.** It reads each company's industry/description/homepage and picks the best source per vertical (state bar associations for legal, medical directories for doctors, LinkedIn + Crunchbase for SaaS), so it finds owners who live on Instagram/Facebook/Twitter — the SMB / e-commerce people LinkedIn misses. Run it with your **Serper key (web research on)**: LinkedIn URLs come via Google, so they're 1–2 days fresh vs other providers' ~6-month-stale data (most only re-scrape on a bounce). Write persona text **loosely** — `CEO, Founder, Owner, Partner, Senior` — the search gravitates to the definition, so you don't miss people on an exact-title mismatch; grab ~5/company and let Claude drop the couple of bad ones (better than a coverage hole). One run hits ~80/100 companies; run it again or with a different model (Gemini/GPT/Grok each have small per-vertical edges) to push toward 90.

**Emails & phones (current state — re-check, this moves fast).** ContaGen doesn't discover emails yet; a built-in validator was said to be ~2–3 weeks out (as of June 2026). Meanwhile resolve emails with Claude Code + a bounce-checker MCP — patterns are predictable, so first+last name resolves 85–90%. No mobile data yet — workaround is `run-discogen` with Grok (more willing to surface a cell from name + title than GPT).

**`run-discogen` signal tricks.** Better than Clay for signals because the profile + homepage are appended free, so the model has a lot to work with. **Traffic-estimate trick:** ask for an *estimate* of monthly traffic (Gemini), not "the traffic" — as an estimate it answers (a free SEMrush-ish read); no number usually means the site is too small to register. It can also pull Google-Maps data (review counts, number of locations — e.g. dealers with 5+ locations).

**Digital footprint = the real company-size signal.** DiscoLike sees every subdomain (vendor + IT-created); summed, that's the footprint. Use it to size companies **where LinkedIn lies** — a delivery firm with 6,000 drivers can show 60 on LinkedIn because drivers don't maintain profiles. Near-zero footprint = mom-and-pop (don't spend on contacts/outreach); ~500 = a real operation. **Subdomain history is a "why-now" trigger:** a newly created subdomain (new MCP server, Supabase, Kafka) = a new initiative = a fresh, specific outreach angle.

**Append use-cases.** `domain_status` / redirect also **recovers renamed companies** (old name in → new name out; history goes back years) — list hygiene. `growth` (quarter-over-quarter footprint) is **gold for fast-growing SaaS, useless on old-school** (construction, doctor offices grow inside without growing the footprint). `vendors` → find the dominant tool across a client's customers = a discovery filter + angle (team-gated).

**You don't always need lookalikes — broad non-vector patterns are legit.** `category` + `phrase_match` + country/size with no seeds at all (e.g. all SaaS that mention "webinar"); the "industry chessboard" (lock a primary `category`, `negate_category` the secondaries you don't want); a single phrase can be huge — "student portal" surfaced ~24,000 education companies in one shot. `phrase_match` supports **forcing a term — prefix `+` to require a word** (e.g. `+cart`).

**Workflow:** test new searches in the **UX** (you get a visual), then once you like them, **automate via MCP** in Claude Code and stop hand-driving the UI — more than half of DiscoLike's clients run via MCP, and the MCP can do slightly more than the UX.

## Sourcing the Seeds — ICP-grounded (do this BEFORE lookalike discovery)

**In the PROVEN motion (the default discovery spine per `/tam-build`'s Case-Study-Anchored Discovery HARD RULE), the seeds ARE the group's validated case-study / customer companies from `/social-proof-bank`** — one seed set per case-study group, so one group-TAM per group. The tiers below are how you source and strengthen that seed set; the client's real case-study/customer companies are the strongest tier and the reason the proven motion beats a broad filter on precision. Lookalike quality is capped by seed quality, and the seeds must REPRESENT the client's ideal customer — not just any companies. Source them in this order, stopping at the first tier that yields **≥5 strong, on-ICP seed domains** for the high-volume default (keeping the ≤10-seed cap and the CEO's AI-5 + client-5 balance below). More and stronger seeds is the first rung of the fit-gated expansion ladder that widens a group-TAM toward its 1,000-20,000 lead volume target (see `[[high-volume-default-doctrine]]` and `/tam-build`), so aim for 5+ when the client has them. The ≥5 is a TARGET, not a blocking floor: if the client genuinely has fewer than 5 real case-study / customer companies, fall back down the cascade and proceed with what's on-ICP (the hard floor for using DiscoLike at all stays ≥3, per When To Use). Anchor every tier to the client's locked ICP; record which tier produced the seeds (+ source URLs) in the activity log and the TAM build report so seed provenance is traceable.

> **Seed mechanics — the CEO's 5 + 5 rule.** Hit **Analyze ICP** first: the wizard (a GPT + Claude combo) suggests **5 seed domains**, usually good ones chosen for *clean* website text. Then add **up to 5 of the client's own domains on top** — but KEEP the AI's 5, so there's no tunnel vision. **Stay at ≤10 domains total.** Be careful with client domains: some company sites have blurry/junky text, and **junk source text → junk results** — which is exactly why the AI's good-text picks balance the mix. Under the hood, **the seed domains and the lookalike text each drive the vector search 50/50** (domains = half the embedding, text = the other half), so you're defining a custom mini-category that no industry dropdown contains. As you tune, **promote validated-`yes` companies into the seed set** (still ≤10). One search = one vertical — never mix verticals (lighting fixtures + shoes) in a single search; it confuses the vector.

**Tier 0 — the client's locked ICP + research (always the anchor).** Read `profiles/<client>/client-profile.yaml` — `icp.*`, `icp_hard_filters` (size buckets, industries, geography, revenue), `icp_segments`, `example_ideal_clients`, `proof.case_studies` — plus the research artifacts (`offer-intelligence.md`, `source-signal-intelligence.md`). If `example_ideal_clients` / `case_studies` already name real customers or look-alikes, resolve them to primary domains — those are your seeds. Whatever the tier, **always pass the ICP as `icp_text`/`icp_prompt` AND the hard filters (country, exact `headcount_buckets_in`, industries) to DiscoLike** so discovery anchors on the ICP, not just the seed vectors (see the bucket caveat above).

**Tier 1 — scrape the client's own website for case-study / customer companies.** When the profile has no usable seed domains, crawl the client's site (Spider Cloud via `ai_router.mjs --provider spider --url <page> --request chrome`, or `extract-website-text` for a quick homepage read) for pages that name real customers: `/customers`, `/case-studies`, `/case-study/*`, `/testimonials`, `/success-stories`, logo walls, "trusted by" sections. Resolve each named company to its primary domain (`business-profile` or a quick search), and KEEP ONLY those that match the ICP — drop partners, investors, integrations, and aspirational big-brand logos that aren't realistic customers. Real named customers are the strongest possible seeds.

**Tier 2 — AI-generate a representative ICP seed list (≤10).** If the website yields too few or off-ICP companies, build the seed list with research per `/ai-model-routing`, honoring `run_state.research_routing`: name **up to 10 REAL companies** that match the locked ICP (right industry, size band, buyer, sales motion, geography), each with a real resolvable domain and a one-line "why it fits"; discard any that fail the hard filters. These are EXEMPLARS for DiscoLike to expand, never the TAM itself, and never invented/unresolvable domains.

**Then:** dedupe the seeds, add the client's own domain + competitors + existing customers to the **server-side exclusion list** (`save-exclusion-list` → `exclusion_query_id`, now available on Pro — and add the query's own prior-batch domains to it as you page so DiscoLike bills only net-new; see **Self-dedup + suppression** in Plan Reality), and run the recommended flow (sample → validate → scale).

## Seed Quality Rules

**Good seeds:** same ICP, same buyer problem, similar company size, similar sales motion.
**Bad seeds:** big-brand logos that aren't realistic customers; mixed industries with no shared buying reason; competitors selling to a different buyer; companies included only because the name is recognized.

## Output

Write a CSV:

```text
domain,company_name,industry,headcount_range,headcount,location_country,location_state,location_city,linkedin_url,description,source
```

Use `source=discolike` (or the actual provider name).

> **For `/tam-build` (source-native full capture):** keep the FULL discover payload for every company — every field returned (the columns above PLUS `disco_score`/similarity and anything else present), never trimmed to domain + name + score. If you also call the deeper enrichers (`business-profile`, `growth-metrics`, `digital-footprint-score`, `append-data`), keep their full native field set too. `/tam-build` maps these onto its STABLE CORE and keeps the rest as source-native extension columns.

## Stop Gates

Stop if:

- Sample ICP fit is below ~40% — fix seeds/exclusions/filters before scaling.
- The seed list mixes unrelated markets.
- Exclusion domains are missing (the client's own domain, competitors, existing customers).
- The user has not approved discovery/enrichment spend (route through `/api-cost-governance`).
- A flow depends on a **plan-gated** feature (tech_stack filter, query inclusion/exclusion, segmentation, bulk matching) — surface the limit and the upgrade, don't pretend it ran.

## When To Use / When Not To Use

**Use** when you have 3–10 known-good customer/prospect domains and want more like them; when you want to expand a small ICP into a larger company universe; when you need per-company AI research at scale (DiscoGen); when title filters elsewhere are too broad. **Don't use** as the primary spine when the real signal is a specific directory/job-board/event source (that's `/lead-source-strategy`), a local-SMB/maps universe (`/google-maps-list-builder`), or SaaS ARR/category specifically (GetLatka) — and don't use it when you can't produce ≥3 on-ICP seeds even via the Sourcing the Seeds cascade.

## What To Do Next

Run `/icp-prompt-builder` on the sample (or `validate-icp-fit`). Then route to `/blitz-list-builder` or ContaGen/`search-contacts` for contacts, `/email-waterfall` for email verification, and `/list-quality-scorecard` before copy or upload.

## Related Skills

- `/tam-build` — DiscoLike is one of its two primary discovery spines; this file is its DiscoLike capability reference.
- `/data-point-discovery` — catalogs DiscoLike-obtainable data points (respect the Plan Reality gates here).
- `/lead-source-strategy` — routes lookalike campaigns to DiscoLike first.
- `/ai-model-routing` — DiscoGen is a BYOK research surface (GPT 5.3 default + Serper; Grok 4.3 for X-search); don't duplicate its passes.
- `/api-cost-governance` — preview/gate before any paid (REC) call.
- `/icp-prompt-builder`, `/blitz-list-builder`, `/email-waterfall`, `/list-quality-scorecard`.

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short — record status, not raw output. Full protocol: `client-activity-log.md`.
