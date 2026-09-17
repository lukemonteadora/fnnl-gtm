---
name: ai-model-routing
description: AI/model-fit map AND research-pipeline doctrine for FNNL Agency cold outbound. Use before any research, crawl, crunch, or copy step routes to an AI provider. Defines the brief-first, premium-by-default non-redundant, source-registered, VOC-aware, validation-gated pipeline; separates discovery, gap-fill deep research, extraction, VOC mining, analysis, validation, and final-copy layers so the premium copy model is not the default for bulk crunching and the cheap bulk model is not the default for final copy. The PRIMARY research pass is Claude native multi-agent deep research (the /deep-research fan-out harness), which runs all the research categories in parallel and adversarially verifies its own claims; any third-party research provider is a grounding + gap-fill complement that fills only what the deep-research pass leaves thin. Names NO default vendor: which tool fills each AI capability slot comes from the workspace stack contract. Pairs with lead-list-tech-stack-research.md, which routes the data/scraping/enrichment tools.
---

# AI Model Routing

This is the model-selection reference AND the research-pipeline doctrine for every research, analysis, and copy step in the cold-outbound flow. It is the AI-layer sibling of `lead-list-tech-stack-research.md`: that file decides which **data tool** collects a signal; this file decides which **AI capability** researches, crunches, validates, or writes from it, and in what order.

A weak workflow asks "can Claude Code just do this?" and pours every step through one model. A strong workflow asks "what decision is this serving, how fresh and how confident must it be, which capability fits, and is this step discovery, extraction, VOC, analysis, validation, or final copy?"

Claude Code stays the execution cockpit: it inspects files, routes the workflow, runs scripts, and orchestrates. It does **not** have to personally perform every AI-heavy step. Route the specialized work to the best-fit capability; keep orchestration local.

## There is no default AI vendor

FNNL Agency has not chosen its tools. This file describes **capability slots** and the reasoning for routing work between them. It never declares which vendor FNNL uses.

**The chosen tool for each slot comes from the workspace stack contract at `outbound/stack-contract.yaml`.** It ships empty. The AI and web slots this file routes against are:

| Slot | Capability role |
|---|---|
| `ai.research_provider` | Third-party research engine: grounded web research, deep multi-step reasoning, live social reads |
| `ai.research_routing` | The routing **policy** (which engine leads the primary pass), not a tool |
| `ai.bulk_classification` | Cheap, high-volume crunch: clustering, classification, frequency counts, compressing raw dumps |
| `ai.copywriting` | Premium final-copy generation from a clean research packet |
| `ai.image_generation` | Image and GIF generation (for example mailbox profile headshots) |
| `web.search` | Search API for raw URL and news discovery |
| `web.crawl` | Page extraction: a raw URL to clean markdown or structured text |

Slot names are written here group-qualified (`ai.research_provider`, `web.crawl`) because that is the path into the contract file. Other skills, and `/stack-setup` itself, often use the bare key (`research_provider`, `crawl`). They are the same slot; the prefix is just the contract group it sits under.

**If a slot this run needs is unset, stop and route the operator to `/stack-setup` rather than substituting a vendor.** Do not pick a plausible tool, and do not infer the stack from a vendor named in a worked example or parked in `_vendor-library/`.

**A named tool is not a working tool.** A slot with status `chosen` has only been recorded. Only status `live` means a real call against FNNL's own account has succeeded. Never tell the operator a step can be automated on the strength of `chosen` alone.

Where this file names real vendors, it is illustrating what could fill a slot, never declaring what FNNL uses.

## When To Use This

Use this before:

- `/lead-source-strategy` Discovery mode runs company/market/social research.
- `/offer-intelligence` runs its research vectors.
- `/auto-research-public` researches a target.
- `/campaign-strategy` synthesizes campaign ideas.
- `/lead-magnet-brainstorm` crunches the offer brief.
- `/campaign-copywriting` writes final copy or phone scripts.
- `/list-quality-scorecard` or `/icp-prompt-builder` validate at scale.

Do not add an AI call to a step that does not need one. See [Don't Add AI Just Because It Exists](#dont-add-ai-just-because-it-exists).

## Research Routing: HARD RULE (Claude native deep research primary)

This is the authority for the rule; every research skill points here. **The primary research pass is Claude native multi-agent deep research, the `/deep-research` fan-out harness.** It spawns multiple sub-agents that research every category the brief needs in parallel (market, competitor, ICP pain, social, VOC discovery), fetches and reads real sources, adversarially verifies each claim against those sources, and synthesizes one cited report.

This deeper, self-verifying, multi-agent pass is the default research brain. It is a **runtime capability of the Claude Code session itself, not a purchased slot**, which is exactly why it can be the default in a workspace that has chosen no vendors yet. `run_state.research_routing` picks the primary engine:

- **A. [Default] `claude_deep_research`.** The Claude native `/deep-research` skill runs the primary broad pass (fan-out sub-agents across all needed categories, adversarial verification, cited synthesis). **This is CLAUDE NATIVE, not the Claude API.** It runs inside this Claude Code session on native session inference, invoked directly as the `/deep-research` skill. It does **NOT** consume an API key and is **NOT** run through a provider router. A Claude API path, where one is configured, is scoped ONLY to final COPY generation (see the Copy Generation HARD RULE), never to this research pass. So "Claude research" means the native `/deep-research` skill; a Claude API key is a copy-step concern only.
- **B. `third_party_ai`.** A third-party-led primary pass, run by whatever tool fills `ai.research_provider`. Use only on an **explicit operator opt-out back to it**, for example when a run must keep all research spend on a third-party credit dashboard. This path requires that slot to be filled and its key present; if the slot is empty, this is not a valid routing choice.
- **C. `claude_native`.** Claude's inline WebSearch/WebFetch with no fan-out. This is the WEAK path (one shallow pass, no adversarial verify); it is **never** the default and is not the same thing as `claude_deep_research`. Reserve it for a tiny, throwaway lookup where firing the full `/deep-research` harness would be overkill, and say so.

**Default = `claude_deep_research`.** If `run_state.research_routing` is **unset**, treat it as `claude_deep_research` and run the `/deep-research` primary pass. Do **not** stop to ask. Move to `third_party_ai` or `claude_native` only when the operator explicitly says so; record the choice, honor it for the whole run, and never re-ask. If it is already set, honor it silently. **Do not confuse `claude_deep_research` (the multi-agent harness, the default) with `claude_native` (bare inline WebSearch, the weak path):** a bare inline WebSearch answer never satisfies the primary pass.

**Execution proof: the primary pass is satisfied by a RECORDED deep-research run, not by intent.** In `claude_deep_research` mode the Stage-1 primary pass MUST be an actual `/deep-research` invocation (the fan-out harness), not a single inline WebSearch answer and not a per-row enrichment pass. Then **record proof**: set `run_state.ai_research_provider = claude-deep-research` (append, do not overwrite, if complement engines also ran) AND append a one-line run to the API balance ledger at `scripts/api-balance-ledger.md` (date, skill, `Claude /deep-research (primary), <n> sub-agents / categories`, client). Create that ledger file on first use if it does not exist yet.

**Self-check before you declare any research step done:** if the run produced no recorded `/deep-research` primary while `research_routing = claude_deep_research`, that is a **FLAGGED VIOLATION**. Stop and either run the deep-research primary now, or get a fresh explicit operator OK to proceed without it. Until a deterministic audit script ships with an activated research pack, run this as a structured self-check rather than describing it as automatic.

**Auditability note.** Claude native `/deep-research` is Anthropic-billed, so it does not show on a third-party credit dashboard the way a third-party research provider would. The ledger line plus the activity-log entry are therefore mandatory, so the run stays auditable in-repo (which primary ran, how many categories and sub-agents), even though the dollars sit on a different bill.

**Complement engines (declared, not a fallback).** After the deep-research primary produces its report plus a gap list, route each remaining gap to the engine that is structurally best for it: a **cheap grounded web pass** for a thin sub-topic, a **deep multi-step reasoning agent** for technical gaps, a **live social read** for current X/LinkedIn signal. All three are roles the `ai.research_provider` slot can fill, and a stack may fill them with one tool or several. These are a DECLARED, gap-targeted stage (Stages 2 and 8), recorded in `ai_research_provider`. They fill only what the deep-research pass left thin, and never repeat the broad pass.

No third-party research key is required for the primary pass, because the primary is the native harness. An empty or unkeyed `ai.research_provider` slot therefore degrades only the optional complement stage; it is not a credential hard-stop on primary research. (It IS a hard-stop if the operator explicitly set `research_routing = third_party_ai`, because then the chosen third-party primary must be present and working.)

This governs **research** (discovery, grounding, social, VOC, pain-mining). Extraction, crunch, validation, final copy, and image generation still route per the map regardless of this choice.

## Copy Generation: HARD RULE (premium copy slot, native session fallback)

Final cold-email copy and phone scripts are generated by the **`ai.copywriting` slot**: a premium model working from the clean research packet. **There is no default vendor for this slot.** It must be set during `/stack-setup`.

- **Primary: the configured copywriting model.** Generate the copy through whatever fills `ai.copywriting`, as a billed, logged model call from the clean research packet. Record `ai_copy_provider` with the provider actually used. Spend logs through `/api-cost-governance` like any paid call.
- **Slot unset, no key, or no credits: NOTIFY the operator, then fall back to the native session.** If `ai.copywriting` is unset, its key is absent, or the provider returns a credit or billing error, tell the operator explicitly ("Configured copy model unavailable: <reason>. Generating copy in the native Claude Code session as the approved backup."), then generate the copy in the native Claude Code session and set `ai_copy_provider = claude-native (fallback: <reason>)`. This is the ONLY sanctioned fallback and it is **never silent**.
- **The Copy QA Gate runs regardless of engine.** Initial written cold touches must first pass `outreach-copy-framework.md`; all copy then passes `spam-word-checker.md` plus `cold-email-copy-best-practices.md` plus the rule checklist. No engine swap bypasses them.
- **Why this slot wants a premium model.** Final copy is the one step where model quality shows up directly in the output a prospect reads. It runs on a small, clean input (the packet) and produces a small output, so a premium model here costs cents, while the same model used for bulk classification across a whole TAM costs real money. That asymmetry, not brand preference, is the reason to split the cheap bulk slot from the quality copy slot.
- **A billed API call and a native session call to the same model family differ in billing, logging, and context isolation, not in capability.** The packet-in, QA-out contract is identical either way.

## The Research Pipeline

Research is not "call a provider." It is an ordered pipeline that knows what decision it is serving before it spends a cent. Intent decides routing, so the brief comes first; the cost gate is half-blind without it.

```
0.  RESEARCH BRIEF        assembled from profile + data-point-catalog + campaign slice
                          (goal, market, ICP, decision supported, output, freshness, confidence,
                           source types, VOC?, assumptions to verify, open questions, pass_depth)
1.  PRIMARY RESEARCH      Claude native /deep-research fan-out harness (multi sub-agents run ALL needed
                          categories in parallel: market/source/competitor/ICP-pain discovery + source URLs
                          + adversarial claim verification + cited synthesis + its own gap list)
2.  GAP-FILL RESEARCH     ai.research_provider fills ONLY the primary pass's gaps: a cheap grounded pass on a
                          thin sub-topic, a deep multi-step reasoning agent on technical gaps, a live social
                          read for current X/LinkedIn signal. web.search stays a URL helper. In scale mode
                          these + web.search EMIT ranked URLs, they do NOT scrape
3.  SOURCE REGISTRY       dedupe + relevance-score URLs before crawling (link-generation lands here)
4.  CRAWL / EXTRACT       web.crawl (default); a search-snippet fallback on crawl-fail / no-full-page
5.  VOC / RAW EVIDENCE    separate branch; source_class; exact quotes
6.  BULK CRUNCH           ai.bulk_classification: clustering / classification / frequency counts;
                          compress raw dumps BEFORE expensive models
7.  CLAUDE CODE SYNTHESIS campaign synthesis, scoring, judgment, offer-angle development
8.  GAP-FILL / VERIFY     deep-reasoning delta-critique + Claude-native /deep-research verification on the
                          PARTIAL packet (NOT a duplicate broad pass)
9.  VALIDATION GATE       claim -> evidence_id; quote_count >= 3; counterexamples kept; critique applied
10. CLEAN RESEARCH PACKET conclusions + evidence only; never raw dumps
11. FINAL COPY            ai.copywriting (primary, from clean packet); native Claude Code session = fallback
                          on unset slot / missing key / no credits (NOTIFY first)
12. COPY QA               outreach-copy-framework for the initial written cold touch -> spam-word-checker
                          -> cold-email-copy-best-practices -> rule checklist
```

The Research Routing HARD RULE (above) governs the research stages (1, 2, and 5). Stage 1 is the Claude native `/deep-research` primary by default (`claude_deep_research`); the Stage 2 and Stage 8 complement engines fill only the gaps that primary flagged. They are DECLARED stages, not the broad pass. If the operator opted back to `third_party_ai`, Stage 1 is instead led by the configured `ai.research_provider`. Extraction, crunch, the Validation Gate, and final copy route per this map regardless of the primary-engine choice.

### Stage 0: Research Brief (assembled, not interviewed)

Routing depends on intent, so every research pass opens with a brief. In this flow the intent is already locked upstream, so do NOT re-interview. **ASSEMBLE** the brief from existing artifacts and ask the operator only for fields no artifact supplies (usually just freshness and confidence bar). Re-asking a locked decision violates `/clarification-first` and `/autonomous-execution-policy`.

| Brief field | Source |
|---|---|
| research_goal / decision supported | the calling skill (offer discovery, ICP pain, campaign slice, target research) |
| market / ICP hypothesis | `client-profile.yaml` |
| output needed | the calling skill |
| source types needed + VOC required? | the calling skill / brief |
| data points needed | `data-point-catalog.md` (when `/tam-build` or `/campaign-strategy` is the caller) |
| freshness required | ask if unknown |
| confidence required | ask if unknown |
| known assumptions to verify + open questions | derived from the locked ICP/offer; ask if unknown |
| `pass_depth` | `deep` (market / ICP-pain / VOC / offer) or `per-account-light` (per-row TAM enrichment) |

`pass_depth` is a property of the brief, **defined here once**. **There is no `tier`**: the research path is premium-by-default and non-redundant (below). Other skills point to this definition; they do not need new `run_state` fields for it.

### Premium-by-Default, Non-Redundant Routing

There is ONE active research path. The cheap and standard tiers were removed. **"Premium-by-default" does NOT mean wasteful.** The lever that controls cost is **non-redundancy**, not tier-downgrading. The engines run in non-redundant order: **Claude native `/deep-research`** does the primary broad pass (fan-out sub-agents plus adversarial verify), and the configured complements then fill ONLY the gaps that pass leaves (thin, technical, niche, or live-social coverage). Each runs on what the others cannot do well. That non-redundancy, not tier-downgrading, is the cost lever.

- **Claude native `/deep-research` is the primary research engine** and runs the broad pass FIRST. Because it fans out into multiple sub-agents, one invocation covers ALL the categories the brief needs at once (market scan, cited source discovery, competitor discovery, initial ICP hypotheses, trend scan, discussion/review/forum URL discovery), fetches and reads the real sources, and adversarially verifies each claim against them before synthesizing a cited report. Give it the assembled brief and let it run every category in parallel rather than firing one narrow query at a time. It returns cited claims, source URLs, and **an explicit gap list** (thin areas, unanswered questions, low-confidence or out-of-scope items the complement engines will fill).
- **The complement engines fill gaps; they never repeat the broad pass.** After `/deep-research` (plus extraction and bulk crunch) produce the report and a gap list, route each gap to the engine role that is structurally best for it:

  | Gap in the primary pass | Route to (role) | Why |
  |---|---|---|
  | A thin sub-topic that just needs one more cheap grounded pass | Grounded web search pass | a fast cited web pass on a single narrow question, cheaper than re-running the harness |
  | Deep technical / niche / code / standards / primary-doc reading | Deep-reasoning research agent | stronger on long technical chains a broad pass summarizes too thinly |
  | Multi-step reasoning across sources: the "why," not just the "what" | Deep-reasoning research agent | reasons across sources instead of listing them |
  | What a person said on X / LinkedIn right now (live social signal) | Live social read | live social signal the deep-research pass cannot get from static pages |
  | A single highest-value question that needs an independent second run | Premium pinpoint reasoning run (1/client) | a separate premium reasoning run is a real second opinion on the one call that matters |

  All four roles are filled from `ai.research_provider`. A stack may cover them with one tool or several; the routing logic is the same either way. Examples of tools that could fill these roles (illustrative only, none chosen for FNNL): a grounded search-and-cite API for the cheap pass, a hosted deep-research agent for the technical gaps, a live-social-indexed model for the social read.

  Each returns ONLY the delta for its gap (new evidence, corrected or over-claimed conclusions, contradictions, counterexamples, source-quality issues, what is still missing). None rewrites the deep-research report unless explicitly asked. Record every engine that ran in `ai_research_provider`.
- **Link-generation / scale mode (context too big, or too many references to read directly).** Do NOT feed full pages to the reasoning models. Instead **`/deep-research` plus the deep-reasoning agent plus `web.search` EMIT ranked candidate URLs only** into the Source Registry (they decide *what is worth reading*); **`web.crawl`** scrapes the chosen URLs to clean text; **`ai.bulk_classification`** compresses the bulk dumps; **Claude Code** synthesizes. The expensive models choose sources and reason; the cheap and bulk tools fetch and compress. This keeps every engine in its best-fit role and bounds token cost.
- **Pinpoint escalation:** the premium pinpoint reasoning run, **1/client**, only for the single highest-value question (high-ticket decision, conflicting-evidence ICP, market-entry, offer-strategy risk, final red-team).

**Two research-model tiers inside the `ai.research_provider` slot:**

| Tier | When |
|---|---|
| Standard deep-research model | **default** complement: deep gap-fill on thin, technical, or multi-step topics, source-checking, second-model critique, focused validation; also the link-emitter in scale mode |
| Premium pinpoint reasoning model | **high-value only**: high-ticket client decision, conflicting-evidence ICP, market-entry, offer-strategy risk, source-contradiction audit, "find what the primary missed" on a specific question, final red-team before a major client-facing report. NOT for broad duplicate research unless explicitly approved. |

**Anti-waste caps (enforced by `/api-cost-governance`):**

- Claude native `/deep-research` does the broad research first; the complement engines take only the gap list, never repeat the broad prompt.
- The reasoning models get the packet plus specific gap questions only (or, in scale mode, EMIT links), never raw crawl dumps.
- `ai.bulk_classification` compresses bulk evidence before any complement reasoning pass.
- Max `/deep-research` primary runs per client: **1-2** (it fans out internally, so one run is many parallel category searches; a second run only for a genuinely distinct campaign slice). Max cheap grounded gap passes per client: **1-3**. Max deep-reasoning gap prompts per client: **1-3**. Max premium pinpoint runs: **1**/client. Raise only by explicit operator approval.
- If the primary pass already has strong cited evidence for a claim, the complements **audit, they do not redo**.
- Sample before scaling VOC: 20-30 quotes first; expand to 100-300 only if patterns are strong; stop if weak.
- Every third-party provider is independently capped at **$10/client** (see Cost-Control Rules).

### Stage 3: Source Registry (spec'd; manual table now, validator script pending)

After discovery, do NOT crawl immediately. First record every discovered URL in a source registry so you crawl each one once and can always answer "where did this claim come from." This is also a cost lever: dedupe and relevance-score before paying for crawls.

| Field | Meaning |
|---|---|
| `source_id` | stable id the packet's `evidence_id` points back to |
| `source_url` | the discovered URL |
| `source_type` | reddit / review_site / forum / news / company_site / job_board / social / docs |
| `discovered_by` | deep-research primary / research_provider / search / manual |
| `query_used` | the query that surfaced it |
| `date_found` | when discovery ran |
| `published_date` | when the source itself was published (flag if unknown) |
| `relevance_score` | quick 0-2 triage before paying to crawl |
| `crawl_status` | pending / crawled / failed / skipped |
| `reason_this_source_matters` | one line: why this source is worth crawling for this brief |

**Status (honest):** today this is a STRUCTURED TABLE the session maintains in the pass artifact. The deterministic dedupe and crawl-budget engine is a **pending follow-up**; until it lands, the registry is operator and Claude maintained, not an enforced script. Skip the full registry on `pass_depth = per-account-light`: a per-row TAM pass keeps only `source_url` plus `signal_date`.

### Stage 5: VOC / Raw-Evidence Layer

A grounded *summary* of buyer pain is not buyer pain. It is one model's compression of a sample you never saw. For ICP, offer, and pain work, mine the raw discussion and keep exact quotes.

Pipeline (capability roles, no new vendor):

1. **Live social read** (`ai.research_provider`): current X and LinkedIn language and human signal.
2. **Search** (`web.search`, or a grounded search pass from `ai.research_provider`): find the EXACT discussion URLs (Reddit threads, review-site pages such as G2/Capterra/Trustpilot, Hacker News, YouTube comment pages, niche forums). Use domain filters and `site:` operators. This hop returns URLs only; it must NOT summarize the discussion.
3. **Crawl** (`web.crawl`): scrape each URL to clean text. If a site blocks the crawler, fall back to search snippets or skip the source.
4. Extract every usable quote with a `source_class`, never flattening the distinction:

| source_class | What it is | Weight |
|---|---|---|
| `buyer_quote` | a real user / buyer describing a problem in their words | the gold, counts toward pain |
| `competitor_claim` | a competitor's marketing / landing copy | positioning context, NOT pain |
| `analyst_claim` | a report / analyst / press framing | context, cite carefully |
| `news` | event / announcement | timing signal only |

A competitor landing page and a Reddit complaint must never be scored the same. One is marketing; the other is pain.

VOC evidence rows (one row per quote): `evidence_id`, `source_url`, `source_type`, `date`, `user_persona` (if known), `exact_quote`, `context`, `pain_point`, `urgency_signal`, `current_workaround`, `desired_outcome`, `objection`, `buying_trigger`, `confidence_score`. Major claims need >=3 sourced `buyer_quote` rows where possible; keep counterexamples; do not compress raw evidence into vague summaries too early; never let a model invent buyer language.

**Compliance:** scraped review, forum, and discussion data is for **research and citation only**, not redistribution as a dataset or product. Public pages only.

### Stage 9: Validation Gate (structured self-check + delta critique; deterministic script pending)

Before anything enters the clean packet, every major claim must pass:

- the claim maps to an `evidence_id` that resolves to a real `source_url` in the registry
- source dates are checked; source types are clear
- `frequency_count >= 3` independent `buyer_quote` sources, OR the claim is marked `confidence_score: low` and the operator approves citing it
- unsupported claims are rejected; no single-source conclusion
- counterexamples are recorded, never silently dropped: disagreement is data
- competitor marketing (`source_class: competitor_claim`) is kept separate from real `buyer_quote`s
- targeted critique / gap-fill applied where needed (below)
- a claim with no evidence is a hypothesis, not a fact (same rule as the packet)

This is where the **gap-fill / red-team pass** lands (Stage 8). The Claude native `/deep-research` primary already adversarially verifies its own claims against sources, so this stage is a targeted top-up, not a second broad verification: the **deep-reasoning research agent** (premium pinpoint only when it earns it) digs the thin and technical gaps, and a **cheap grounded pass** cross-checks any single claim still shaky after the primary. Each takes the partial packet plus specific gap questions and returns ONLY the delta: unsupported claims, contradictions, missing counterexamples, source-quality issues, strategic risks, next questions, verdict. Neither re-runs the broad research or rewrites the report. Record every engine that ran in `validation_provider` and the findings in `validation_notes`.

**Status (honest):** the STRONGEST version of this gate is mechanical, a script that resolves every `evidence_id` against the registry and counts `buyer_quote` sources deterministically. **That script does not exist yet.** Until it lands, the gate runs as a STRUCTURED SELF-CHECK in Claude Code, plus the delta critique pass above when the decision warrants it. Do not describe the gate as "mechanical" or "automatic" while it is a self-check; that would overclaim the one capability that justifies it.

## Compact Capability-Fit Map

Vendor names below are illustrative only. None is chosen for FNNL; the actual tool per slot comes from `stack-contract.yaml`.

| Need | Capability slot / role | Role in stack | Weak move |
|---|---|---|---|
| PRIMARY broad research: market / competitor / ICP-pain / source discovery across all needed categories, cited and self-verified | Claude native `/deep-research` skill (runtime, not a purchased slot) | **Primary research engine**, the default | Firing one narrow inline WebSearch and calling it the primary pass, instead of running the multi-agent harness over the whole brief |
| Cheap extra grounded pass on ONE thin sub-topic the primary left shallow | `ai.research_provider`, grounded-search role | Gap-fill grounding helper, not the primary | Re-running a grounded pass across the whole brief the deep-research primary already covered, which is duplicate cost |
| Real-time X / social human-signal read (founder posts, complaints, buyer language) | `ai.research_provider`, live-social role | Social timing and human hook | Treating a like or post as buying intent |
| Mining real buyer voice (Reddit, review sites, HN, YouTube) into exact quotes | live-social read, then `web.search` for URLs, then `web.crawl` to scrape | VOC / raw-evidence layer | Letting the search layer summarize the discussion instead of scraping the exact quotes; summaries hide sampling garbage |
| Filling the gaps the primary pass left thin / technical / niche / multi-step | `ai.research_provider`, deep-reasoning role (typically fire-and-poll) | Complementary, non-redundant gap-fill | Asking it the same broad question the deep-research primary already answered, which is duplicate cost |
| Corpus too big / too many references to read directly | `/deep-research` + deep-reasoning agent + `web.search` EMIT ranked URLs, then `web.crawl` scrapes, then `ai.bulk_classification` compresses, then Claude Code synthesizes | Link-generation / scale mode | Feeding full raw pages into the reasoning models, which blows context and cost |
| Pinpoint high-value reasoning (conflicting-evidence ICP, market-entry, offer risk, final red-team) | `ai.research_provider`, premium pinpoint tier, 1/client | Premium reasoning | Using the premium tier for broad duplicate research |
| Image or GIF generation, or an optional QA voter on high-value copy | `ai.image_generation` (images); any configured cheap model (QA voter) | Image generation / optional QA | Routing JSON, classification, or structured output to a paid provider, which Claude Code handles inline |
| Low-cost bulk synthesis / clustering / pre-compressing raw crawl and VOC dumps before premium models | `ai.bulk_classification` | Bulk crunch and dump pre-compression | Sending raw crawl dumps straight to a premium model instead of compressing first |
| Final high-quality cold email and phone scripts from a clean packet | `ai.copywriting` (PRIMARY); native Claude Code session = notify-then-fallback on unset slot / missing key / no credits | Final copy | Falling back to the native session WITHOUT notifying the operator first, or treating the billing/logging difference as a quality difference |
| Raw URL to clean markdown or structured text | `web.crawl` | Extraction | Asking an LLM to "browse" instead of extracting the page first |
| Backfill a single missing MUST-HAVE field a source left blank (for example a personal `linkedin_url`, `company_linkedin`) | The configured contact-data tool first, then **`web.search` (returns the REAL URL) then a model (confirms the result matches the entity by name plus company/domain)** | Verified field backfill | Letting the LLM emit a URL or value from memory (a hallucinated `linkedin.com/in/...`), or accepting a candidate without confirming name plus company. A wrong value is worse than a blank. Tool: `scripts/linkedin_find_web.mjs` |

A search API (`web.search`) is the raw discovery and URL feed that sits in front of grounded research and crawling. See `lead-list-tech-stack-research.md`. It is a data tool, not a model.

**Nothing is "in" or "out" of the stack until the contract says so.** Do not route research, extraction, crunch, validation, or copy to a tool that is not recorded in `stack-contract.yaml`, and do not rule a tool out on the strength of a vendor name appearing (or not appearing) in this file.

## Clean Research Packet

The final copy step must receive a **clean research packet**, not a messy long-running execution context, whether that step runs as a Claude Code sub-agent or as a billed API call. The packet is conclusions plus evidence, never raw crawl dumps, tool logs, or model scratch.

```
buyer_persona          # who, seniority, real buyer title
account_context        # what the company is / does
business_context       # initiative, expansion, funding, hiring: why it matters
technical_context      # stack, docs/changelog/product signal if relevant
human_hook             # public post / comment, if any (live-social sourced)
verified_signal        # the one proven reason-now
signal_source_url      # working evidence URL
signal_date            # when the signal is from
signal_strength        # strong / medium / weak (do not overclaim weak)
pain_point             # specific, not generic
reason_for_fit         # why this buyer, this company
reason_now             # why this is timely
proof_point            # mechanism or proof we can honestly cite
offer_angle            # direction only
lead_magnet_angle      # direction only
likely_objection       # what they'll push back on
constraints            # tone, banned words, client copy rules
ai_research_provider   # provenance (e.g. claude-deep-research; + any gap-fill helpers that ran)
ai_analysis_provider   # provenance (the bulk-classification tool / Claude Code)
validation_provider    # who ran validation/critique (Claude Code self-check / research_provider tier)
validation_notes       # the delta: unsupported claims, contradictions, gaps flagged + verdict
```

**Deep-pass evidence fields**, added only on `pass_depth = deep` packets (VOC, ICP-pain, offer, market). They are NOT appended to `tam.csv` canonical columns; a `per-account-light` TAM row carries only `signal_source_url`, `signal_date`, and the `ai_*_provider` provenance.

```
evidence_id            # id(s) resolving to source-registry rows
source_type            # reddit / review_site / forum / news / company_site / ...
exact_quote            # verbatim buyer language behind the pain
current_workaround     # what they do today instead
quote_count            # independent buyer_quote sources for this claim
counterexample_count   # sourced quotes that disagree
confidence_score       # high / medium / low, set by the validation gate
buying_trigger         # the event/signal that makes now the time
```

(`persona` in the spec is the base-packet `buyer_persona` field above; do not duplicate it.)

Rule: if a fact in the packet has no `signal_source_url` (or `evidence_id`), it is a hypothesis, not evidence. Copy must not state a hypothesis as a fact. The packet carries the insight, never the tool name. See the prospect-facing copy rules in `campaign-copywriting.md` and `cold-email-copy-best-practices.md`.

### Quick decision tree

- First: assemble the brief (what decision, output, freshness, confidence). There is ONE path, premium-by-default and non-redundant. No tier to pick.
- Broad market / source / competitor / ICP discovery? Run **Claude native `/deep-research`** as the primary pass: hand it the whole brief and let its sub-agents cover every category in parallel with adversarial verification. Search for raw URL expansion, a live social read, and a cheap grounded thin-gap top-up are helpers, not the primary brain.
- Do I need REAL buyer language and pain quotes (not a summary of them)? Use the **live social read** for current X and LinkedIn, then **`web.search`** to find the exact Reddit, review, and forum URLs, then **`web.crawl`** to scrape. Capture exact quotes, and never let the search layer pre-summarize.
- Is it about what a person said on X / LinkedIn / Reddit right now? Use the **live social read** (the underlying data discovery may come from an intent-signals tool; see the tech-stack file).
- Do I just need a URL turned into text? Use **`web.crawl`** (no LLM needed to fetch).
- Do I have a large corpus to compress across 500+ rows in an offline batch script? Use **`ai.bulk_classification`**.
- Did the primary pass come back thin, too technical, or shaky on a sub-topic? Fill ONLY that gap with the **deep-reasoning role** (deep, technical, multi-step), a **cheap grounded cross-check** on one narrow claim, or the **live social read**. Use the premium pinpoint tier only for the one highest-value question. Never a duplicate broad pass.
- Corpus too big or too many references to read directly? Use **scale mode**: let `/deep-research`, the deep-reasoning agent, and `web.search` EMIT ranked URLs, then **`web.crawl`** scrapes, **`ai.bulk_classification`** compresses, and **Claude Code** synthesizes. Do not feed full pages to the reasoning models.
- Am I writing the actual email or phone script? Use **`ai.copywriting`** from a clean research packet. If the slot is unset or its key fails, **notify the operator**, then fall back to the **native Claude Code session**. See the Copy Generation HARD RULE.
- Do I need to generate an image or GIF (for example an inbox profile headshot)? Use **`ai.image_generation`**.

## Credentials

Credential **names** for each filled slot live in `stack-contract.yaml` and are mirrored machine-readably into `scripts/credential-registry.json`. Real values live only in `scripts/.env`, which is gitignored; `scripts/.env.example` carries placeholders and is regenerated by `/stack-setup` to match the chosen stack.

**This file asserts nothing about which keys are present.** Presence and shape are `/preflight-credentials`' job; balance and spend are `/api-cost-governance`' job. If a slot this run needs has no credential, that is a `/stack-setup` gap, not something to work around by substituting a vendor.

## Executable Layer

The primary research pass is a **NATIVE SKILL invocation, not a router call and not an API call**: run the Claude native `/deep-research` skill directly inside this Claude Code session (native session inference, no API key) and hand it the assembled brief so its sub-agents cover every category in parallel. That is available today with an empty stack contract.

Everything else in this pipeline needs a tool in its slot. The integration code for a provider router (grounding, gap-fill, crunch, search, crawl, and billed copy generation through one uniform interface) ships **inactive** in `_vendor-library/` and becomes real only when `/stack-setup` activates the matching pack. Until then, describe those steps as unavailable rather than emitting a call to a script that is not there.

The routing mechanics worth knowing before a pack is activated, because they shape how you plan a run:

- **A provider router is the right shape.** One script with a `--provider` flag, reading keys from `scripts/.env`, returning a single JSON object (`{ ok, provider, model, content, citations?, usage?, error? }`), beats hand-rolling provider HTTP per step. It is also what makes the `ai_*_provider` provenance columns easy to fill honestly.
- **A `--dry-run` flag that makes no call and costs nothing** is the cheapest way to sanity-check a prompt before spending.
- **Deep-research agents are fire-and-poll, not instant.** A hosted deep-research job typically returns a job id with status `queued`, then you poll until `completed`. A job can run for tens of minutes, so do OTHER work between polls and never idle-wait. Cap each job's tool calls to bound cost.
- **Scale mode needs a harvest helper.** Given citation URLs (or a finished deep-research job id) plus a focus statement, the helper crawls each page, compresses each to a tight focus-scoped digest with the bulk model, and emits ONE merged evidence packet. That is the "generate links, then scrape and compress" pattern that stops a big-reference pass from blowing up context.
- **A per-row research surface is a different tool from a broad pass.** Some providers offer a per-company or per-contact structured research surface (give it a domain list, get back a structured per-row answer such as funding, hiring, pricing tier, a why-now trigger, or an ICP-fit verdict). **Scale caveat:** these typically poll the COMPLETE result set back into context, so use them at sample or small-batch scale only. At thousands of rows they flood context, so classify on-disk with the bulk model instead. And do **not** also run a broad research pass over the same rows; that is the duplicate-pass waste this doctrine forbids.

Image and GIF generation (mailbox-profile headshots and logos) runs through `scripts/generate_inbox_profiles.py` via `/mailbox-profile-generator`, not through a text-provider router.

**Still pending (do NOT describe as runnable):** the deterministic Validation Gate and source-registry store. Until they exist, the registry is a manual table and the gate is a structured self-check (see Stages 3 and 9).

## Fallback Rules

Never emit a broken or hardcoded call to a provider whose slot is empty or whose key is absent. Degrade to the named fallback and record which provider actually ran in the `ai_*_provider` columns.

- **`ai.research_provider` unset or unkeyed.** Under the default `claude_deep_research` routing this is **NOT a hard-stop**: the primary pass is the native `/deep-research` harness, which needs no third-party key. An empty slot only removes the optional gap-fill complement stage. Note it in provenance and continue. **It IS a credential HARD-STOP only if the operator explicitly set `run_state.research_routing = third_party_ai`**, because then the third-party engine is the chosen primary. Name the slot to fill and route to `/stack-setup`; do not silently substitute.
- **`ai.image_generation` unset or unkeyed.** Skip image generation and say so. Do not substitute a text provider for an image step.
- **Deep-reasoning gap-fill unavailable** (slot empty, or the job errors or times out). Use **Claude-native `/deep-research`** to fill the gaps instead, and run the Validation Gate as a Claude Code self-check. Record that the deep-reasoning gap-fill pass was skipped. It is a complementary add-on, not required for a run to complete.
- **Any provider absent.** Log the substitution in `ai_research_provider` / `ai_analysis_provider` / `ai_copy_provider` so provenance stays honest.
- **If nothing but the native session is available, the pipeline still runs.** The **primary research pass is the Claude native `/deep-research` harness by default**, so no third-party key is needed for it, and Claude Code also handles crunch, scoring, the validation self-check, and copy locally. **Still never treat a bare inline WebSearch/WebFetch answer as the primary research pass** (that is `claude_native`, the weak path); run the full `/deep-research` fan-out harness instead. Add a grounded gap-fill pass, a live social read, and bulk extraction as each slot gets filled. They enrich, they do not replace the primary.

## Cost-Control Rules

- **One active path: premium-by-default, non-redundant** (no cheap or standard tiers). Cost is controlled by non-redundancy, not tier-downgrading. Do not run the union of all providers on the same question; that is an API buffet, not a pipeline.
- **Run `/api-cost-governance` before any paid provider call** to preview the USD range, check the relevant key's balance, block if a key is below the estimated cost or under the $10 warning threshold, and enforce the anti-waste caps (deep-research primary first; gap-fill prompts 1-3/client; premium pinpoint 1/client). It is the spend gate for every paid skill in its registry.
- **Per-provider research budget: HARD STOP at `run_state.research_budget_usd_per_provider` (default $10 EACH).** Every third-party provider has its own $10/client ceiling on cumulative research spend, not a shared pool. `/api-cost-governance` blocks that provider's call if this pass would exceed its $10 and requires an explicit operator raise. Provider-side hard usage limits, prepaid balances, and auto-recharge OFF are the real backstop against a negative balance.
- **The complement engines never duplicate the primary broad pass.** The primary is Claude native `/deep-research` (1-2 runs/client, because it fans out internally, so one run is many parallel category searches). The complements run only on the *gaps* the primary flagged (thin, technical, niche, live-social). Caps: 1-3 cheap grounded gap passes/client, 1-3 deep-reasoning gap prompts/client, 1 premium pinpoint run/client. If the primary pass already has strong cited evidence for a claim, the complements audit, they do not redo.
- **Crawl only after the Source Registry dedupes and relevance-scores URLs** (deep passes). Duplicate crawl calls are pure waste.
- **Use `web.search` before a grounded research pass when you only need URLs.** A research model is better for synthesis; a search API is cheaper for raw URL discovery.
- Use **`ai.bulk_classification`** for bulk synthesis, clustering, and **pre-compressing raw crawl and VOC dumps before premium models see them** (especially 500+ row batches). **Never send raw crawl dumps directly to a premium model by default.** Tiny interactive corpora (a couple of pages) can be handled inline in Claude Code without a bulk call.
- **Scale mode beats brute force when references are many or context is huge:** have `/deep-research`, the deep-reasoning agent, and `web.search` EMIT ranked candidate URLs only; **`web.crawl`** scrapes the chosen ones; **`ai.bulk_classification`** compresses; **Claude Code** synthesizes. The reasoning models pick sources and reason; they never ingest the full raw corpus.
- **Copy QA defaults to rule-based:** `outreach-copy-framework.md` for the initial written cold touch, plus `spam-word-checker.md`, `cold-email-copy-best-practices.md`, and a rule checklist (plus an optional cheap-model pass). Escalate to a full model audit ONLY for high-ticket, risky-claim, strategic, or client-facing copy, never as the default.
- **Final copy GENERATION routes to `ai.copywriting`**; the native session is the notify-then-fallback when the slot is unset or out of credits. **Synthesis, scoring, JSON subroutines, and copy QA** still default to Claude Code native and inline (or a cheap QA pass). The premium-copy rule is for the final-copy GENERATION step specifically, not every reasoning step.
- Reserve the **deep-reasoning role** for complementary gap-fill, critique, and validation on the primary pass's gaps, **never a duplicate broad research pass.** Claude Code handles JSON, classification, and structured output inline; do not pay a provider for these.
- Do not run the **primary `/deep-research` pass, or any grounded research pass, per row.** Run one account-level (or slice-level) research pass and reuse it across every contact at that account.
- **Sample before scaling VOC:** 20-30 quotes first; expand only if patterns are strong; stop if weak.
- Cache the clean research packet per company so a re-run does not re-pay for research.
- If an AI step does not improve relevance, quality, cost, speed, scale, or QA, skip it.

## Don't Add AI Just Because It Exists

- Static, template, or already-decided copy needs no AI call.
- One provider per job. Stacking three models on one step is cost, not quality.
- **Task-tool sub-agents stay the default for per-lead work AND for clean-context final copy.** `/personalization-subagent-pattern` and `/icp-prompt-builder` run on Claude Code Task sub-agents by design; final copy runs the same way (a sub-agent fed only the clean packet) to get context hygiene without claiming an API quality advantage. AI providers *feed* those agents richer research and context; they do not replace the agents for normal runs. Only the optional at-scale (1,000+ lead) API path those skills already permit, or a headless or production run, routes to a raw provider.
- Provenance columns must reflect reality. If the bulk model ran the crunch, `ai_analysis_provider` names that model, not "Claude" because Claude Code orchestrated it.
- Copy and QA guardrails are never bypassed by a model swap. `outreach-copy-framework.md` controls every initial written cold touch; `spam-word-checker.md` and `cold-email-copy-best-practices.md` remain required regardless of which model drafted.

## Where This Can Fail

- A grounded model still hallucinates if you skip the evidence URL. Keep `signal_source_url` and `evidence_id`.
- Low-cost crunch on a bad corpus produces confident garbage. Garbage-in still applies.
- **Treating a competitor landing page like a buyer complaint.** Enforce `source_class`: marketing copy is positioning context, not pain. Flattening them is how bad ICP thinking starts.
- **Prose that reads as if a script ran.** The Source Registry and Validation Gate are a manual table and a self-check until their scripts exist. Calling them "mechanical" or "automatic" overclaims the very capability that justifies them, so keep the status honest.
- **Calling a declared complement a "fallback."** Claude-native `/deep-research` used to fill a NAMED gap in the chosen primary pass is a logged complement (Stages 2 and 8), not the prohibited silent fallback. Quietly swapping it in *for* a missing primary third-party engine IS the violation. Keep the distinction.
- **Narrating a deep-research call as instant.** A hosted deep-research job is fire-and-poll and can run for tens of minutes. Do not claim such a call returned content in one shot; it returns a job id first, then you poll. Idle-waiting on the poll also violates the don't-idle-wait rule, so do other work between polls.
- **Assuming a tool exists because this file names it as an example.** Every vendor name here is illustrative. Check `stack-contract.yaml`, and check that the slot's status is `live` rather than `chosen`, before you promise the operator a step is automated.
- Social signal is timing and language, not proof of fit. Pair it with account context.
- Routing adds value only when the step is genuinely research, crunch, social, extraction, VOC, validation, or copy heavy. For pure orchestration, file edits, and local execution, Claude Code is correct and no routing is needed.

## Capability-to-Stage Quick Reference

- PRIMARY broad research (all categories, fan-out, adversarial verify, cited synthesis): **Claude native `/deep-research` skill**, the default primary engine
- Cheap grounded gap-fill on ONE thin sub-topic: `ai.research_provider`, grounded-search role (helper, not the primary)
- Social and human hook: `ai.research_provider`, live-social role
- Buyer-voice mining (exact pain quotes): live-social read, then `web.search` for URLs, then `web.crawl` to scrape
- Raw page extraction: `web.crawl` (fallback: search snippets)
- Bulk synthesis and pre-compressing raw crawl/VOC dumps: `ai.bulk_classification`
- Deep technical or multi-step gap-fill on the primary pass: `ai.research_provider`, deep-reasoning role (premium pinpoint tier only when it earns it), never a duplicate broad pass
- Corpus too big or too many references: scale mode. `/deep-research`, the deep-reasoning agent, and `web.search` emit URLs, then `web.crawl` scrapes, `ai.bulk_classification` compresses, Claude Code synthesizes
- Packet validation: the primary `/deep-research` already self-verifies; add a structured self-check in Claude Code plus a targeted gap-fill critique when warranted (validator script pending)
- Image and GIF generation: `ai.image_generation`
- Independent second-opinion QA voter (optional): any configured cheap model
- All inline reasoning, JSON, classification, scoring, synthesis: Claude Code
- Final email and phone copy: `ai.copywriting`; native Claude Code session = notify-then-fallback on unset slot, missing key, or no credits
- Copy QA: outreach-copy-framework for the initial written cold touch, plus spam-word-checker, cold-email-copy-best-practices, and the rule checklist (default); a full model audit only for high-ticket or client-facing work
- Orchestration, file ops, routing: Claude Code (local)

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short, and record status, not raw output. Full protocol: `client-activity-log.md`.
