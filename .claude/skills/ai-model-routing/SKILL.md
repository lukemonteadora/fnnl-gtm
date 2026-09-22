---
name: ai-model-routing
description: "AI routing AND research-pipeline doctrine for FNNL Agency cold outbound, under the no-AI-API rule (operator directive 2026-09-22): the only AI is Claude Code itself (the session, its sub-agents, the /deep-research fan-out harness, and its built-in WebSearch and WebFetch). Use before any research, page-read, crunch, critique, or copy step. Defines the brief-first, non-redundant, source-registered, VOC-aware, validation-gated pipeline and separates discovery, gap-fill, extraction, VOC mining, bulk crunch, analysis, validation, and final-copy layers. The PRIMARY research pass is the Claude native /deep-research harness; thin spots are filled by a second targeted /deep-research or WebSearch/WebFetch pass, bulk crunch is Claude sub-agent fan-out, critique is differentiated Claude sub-agents, and final copy is written in the native session. The third-party research, bulk-classification, copywriting, search, and crawl slots are retired; the one surviving AI slot is image generation for sender headshots only. Pairs with lead-list-tech-stack-research.md, which routes the data/scraping/enrichment tools."
---

# AI Model Routing

This is the routing reference AND the research-pipeline doctrine for every research, analysis, and copy step in the cold-outbound flow. It is the AI-layer sibling of `lead-list-tech-stack-research.md`: that file decides which **data tool** collects a signal; this file decides which **Claude Code capability** researches, crunches, validates, or writes from it, and in what order.

A weak workflow pours every step through one undifferentiated pass. A strong workflow asks "what decision is this serving, how fresh and how confident must it be, and is this step discovery, extraction, VOC, analysis, validation, or final copy?" and then gives each step the right Claude Code tool: the fan-out harness, a targeted web pass, a batch of sub-agents, or the session itself.

Claude Code is the execution cockpit and the only AI in the flow. It inspects files, routes the workflow, runs scripts, and orchestrates, and it also does the research, crunch, critique, and writing through its own tools.

## There is no AI vendor: Claude Code is the only AI (no-AI-API rule, operator directive 2026-09-22)

The operator's rule: this workflow makes **no third-party AI API calls and no Claude API calls made with a key**. The only AI is Claude Code itself:

- the running session,
- its sub-agents (the Task/Agent tool),
- the Claude native `/deep-research` fan-out harness,
- its built-in WebSearch and WebFetch tools.

There is no "gap-fill engine", no "complement engine", no "model panel of other families", and no "cheap model pass" any more. Where earlier versions of this file routed work to a third-party AI slot, the Claude-native tool in the table below now does that job.

**The one exception is sender headshots.** `ai.image_generation` survives for persona headshots only: OpenAI, headshots only, asked for at infrastructure setup. It is recorded as an operator-approved exception in `approved_stack.approved_exceptions` of `outbound/stack-contract.yaml` (2026-09-22). Its key is **never** requested or flagged as missing at onboarding, intake, kickoff, preflight, stack setup, or workspace creation. `/mailbox-profile-generator` asks for it only when the headshot step actually runs, or when the operator says to start setting up cold-email infrastructure.

> **Approved-stack rule (operator directive 2026-09-22).** FNNL's tools are the closed list in the `approved_stack` block of `outbound/stack-contract.yaml`. Meet every need from that list first, and check each listed tool's full surface (its MCP tool list and API docs) before declaring a gap. Any other tool named in this file is a catalogue example: raise it only as "OUT OF STACK, needs operator approval", never as the path, and never credential or spend on it until the operator approves it by name and it is recorded in `approved_stack.approved_exceptions`. A slot at status `held` declares nothing, exactly like `not_chosen`.

The AI and web slots in the contract, and what does each job now:

| Slot | Status (2026-09-22) | What does the job now |
|---|---|---|
| `ai.research_provider` (every role it used to cover: grounded search, deep reasoning, live social, premium pinpoint) | **retired** | Primary: the `/deep-research` harness. Gaps: a second targeted `/deep-research` run or a WebSearch/WebFetch pass. Live X read: not available (see Stage 5). |
| `ai.research_routing` | a policy, not a tool | One valid value: `claude_deep_research` |
| `ai.bulk_classification` | **retired** | Claude sub-agents fanned out per `/personalization-subagent-pattern`; deterministic filters stay in plain code |
| `ai.copywriting` | **retired** | The native Claude Code session (a clean-packet sub-agent is fine) |
| `ai.image_generation` | kept, headshots only | The approved exception above, run by `/mailbox-profile-generator` |
| `web.search` | **retired as a third-party slot** | The harness's built-in WebSearch |
| `web.crawl` | **retired as a third-party slot** | The harness's built-in WebFetch |

Slot names are written here group-qualified (`ai.research_provider`, `web.crawl`) because that is the path into the contract file. Other skills, and `/stack-setup` itself, often use the bare key (`research_provider`, `bulk_classification`, `copywriting`, `search`, `crawl`). They are the same slots.

**A retired slot is not a gap.** Its `tool` is null by design. If a skill, an old profile, or a worked example routes work to one, do that job with the Claude-native tool in the table and do **not** send the operator to `/stack-setup` to fill it. Never credential, buy, or call a third-party AI tool to fill it either.

**Do not confuse the retired contract slot `ai.research_provider` with the provenance field `run_state.ai_research_provider`** (and its packet twins `ai_analysis_provider`, `ai_copy_provider`, `validation_provider`). The provenance fields keep their names, because 50+ skills read them. Only their values change, for example `claude-deep-research`, `claude-websearch`, `claude-subagents`, `claude-native`.

The data slots this file does not govern (discovery, enrichment, verification, the list workbench) keep the full stack-contract discipline: if a data slot a run needs is unset, stop and route the operator to `/stack-setup`, and a `chosen` tool is not a `live` tool.

## When To Use This

Use this before:

- `/lead-source-strategy` Discovery mode runs company/market/social research.
- `/offer-intelligence` runs its research vectors.
- `/auto-research-public` researches a target.
- `/campaign-strategy` synthesizes campaign ideas.
- `/lead-magnet-brainstorm` crunches the offer brief.
- `/campaign-copywriting` writes final copy or phone scripts.
- `/list-quality-scorecard` or `/icp-prompt-builder` validate at scale.
- `/consultant` or `/roast` run a critic or second-opinion panel.

Do not add an AI step to a step that does not need one. See [Don't Add AI Just Because It Exists](#dont-add-ai-just-because-it-exists).

## Research Routing: HARD RULE (Claude native deep research primary)

This is the authority for the rule; every research skill points here. **The primary research pass is Claude native multi-agent deep research, the `/deep-research` fan-out harness.** It spawns multiple sub-agents that research every category the brief needs in parallel (market, competitor, ICP pain, social, VOC discovery), fetches and reads real sources, adversarially verifies each claim against those sources, and synthesizes one cited report.

It is a **runtime capability of the Claude Code session itself, not a purchased slot**, and it needs no API key. `run_state.research_routing` has **one valid value** (no-AI-API rule, operator directive 2026-09-22):

- **`claude_deep_research` (the only value).** The Claude native `/deep-research` skill runs the primary broad pass (fan-out sub-agents across all needed categories, adversarial verification, cited synthesis). **This is CLAUDE NATIVE, not the Claude API.** It runs inside this Claude Code session on native session inference, invoked directly as the `/deep-research` skill. It does **NOT** use an API key and is **NOT** run through a provider router.
- **Retired values.** `third_party_ai` (a primary pass led by a third-party research tool) is retired together with the third-party research slot. `claude_native` is no longer a routing value either. If a profile still carries either one, run the `/deep-research` primary as `claude_deep_research` and note the normalization in the activity log. Do not ask the operator to pick between them.

**Unset means `claude_deep_research`.** If `run_state.research_routing` is unset, run the `/deep-research` primary pass. Do **not** stop to ask.

**A bare inline WebSearch is never the primary pass.** Inline WebSearch/WebFetch (one shallow pass, no fan-out, no adversarial verify) is the right tool for a tiny throwaway lookup and for the targeted gap passes in Stages 2 and 8. It never satisfies the Stage-1 primary.

**Execution proof: the primary pass is satisfied by a RECORDED deep-research run, not by intent.** The Stage-1 primary pass MUST be an actual `/deep-research` invocation (the fan-out harness), not a single inline WebSearch answer and not a per-row enrichment pass. Then **record proof**: set `run_state.ai_research_provider = claude-deep-research` (append, do not overwrite, when gap passes also ran, for example `claude-deep-research + claude-websearch`) AND append a one-line run record to the ledger at `scripts/api-balance-ledger.md` (date, skill, `Claude /deep-research (primary), <n> sub-agents / categories`, client). That line is an audit record, not a spend row: it carries no cost. Create the ledger file on first use if it does not exist yet.

**Self-check before you declare any research step done:** if the run produced no recorded `/deep-research` primary, that is a **FLAGGED VIOLATION**. Stop and either run the deep-research primary now, or get a fresh explicit operator OK to proceed without it. Where the ledger line exists, `scripts/research/research_routing_check.mjs --skill <skill> --client <client> --json` audits it. The script can only see runs that left a ledger line, so the line itself is mandatory.

**Auditability note.** Claude Code usage is not a per-call metered API spend in these skills, so no credit dashboard shows the run. The ledger line plus the activity-log entry are what keep it auditable in-repo (which primary ran, how many categories and sub-agents).

**Gap-fill passes (declared, not a fallback).** After the deep-research primary produces its report plus a gap list, fill each remaining gap with a Claude-native tool:

- **A thin sub-topic:** a targeted WebSearch/WebFetch pass on that one narrow question.
- **A deep, technical, niche, or multi-step gap:** a second, narrowly scoped `/deep-research` run on the named gap question.
- **What a person said on X or LinkedIn right now:** the live X read no longer exists. Use WebSearch where it returns public posts, and log the gap. LinkedIn engagers and post signals come from the data tool in `lead_data.intent_signals`, which is a data vendor, not an AI provider.

These are DECLARED stages (Stages 2 and 8), recorded in `ai_research_provider`. They fill only what the primary pass flagged and never repeat the broad pass. No third-party provider fills a gap.

This governs **research** (discovery, grounding, social, VOC, pain-mining). Extraction, crunch, validation, and final copy route per the map below.

## Copy Generation: HARD RULE (native Claude Code session)

Final cold-email copy and phone scripts are written **in the native Claude Code session** from the clean research packet (no-AI-API rule, operator directive 2026-09-22). A clean-packet sub-agent (a Task sub-agent fed only the packet) is fine, and it is the preferred way to get context hygiene.

- **This supersedes the 2026-06-17 directive** that generated copy through a Claude API call by default, and it retires the `ai.copywriting` slot. There is no API copy path and no "no key, notify, then fall back" branch. Native is the path.
- **Record `ai_copy_provider = claude-native`** (or `claude-native (sub-agent)` when a clean-packet sub-agent wrote it).
- **The Copy QA Gate runs regardless.** Initial written cold touches must first pass `outreach-copy-framework.md`; all copy then passes `spam-word-checker.md` plus `cold-email-copy-best-practices.md` plus the rule checklist. Nothing bypasses them.
- **Quality comes from the packet and the gate.** Copy is good when it is built on a clean, evidence-backed packet and passes the QA gate. A sub-agent that sees only the packet gives the same context isolation a separate model call used to give, without any key.

## The Research Pipeline

Research is not "call a tool." It is an ordered pipeline that knows what decision it is serving before it spends any effort. Intent decides routing, so the brief comes first.

```
0.  RESEARCH BRIEF        assembled from profile + data-point-catalog + campaign slice
                          (goal, market, ICP, decision supported, output, freshness, confidence,
                           source types, VOC?, assumptions to verify, open questions, pass_depth)
1.  PRIMARY RESEARCH      Claude native /deep-research fan-out harness (multi sub-agents run ALL needed
                          categories in parallel: market/source/competitor/ICP-pain discovery + source URLs
                          + adversarial claim verification + cited synthesis + its own gap list)
2.  GAP-FILL RESEARCH     fills ONLY the primary pass's gap list: a targeted WebSearch/WebFetch pass on a
                          thin sub-topic, or a second narrowly scoped /deep-research run on a technical or
                          multi-step gap. No third-party provider. In scale mode these EMIT ranked URLs,
                          they do NOT read every page
3.  SOURCE REGISTRY       dedupe + relevance-score URLs before reading them (link-generation lands here)
4.  READ / EXTRACT        WebFetch (default); WebSearch snippets on a fetch failure or blocked site
5.  VOC / RAW EVIDENCE    separate branch; source_class; exact quotes; Reddit by operator paste only
6.  BULK CRUNCH           Claude sub-agents fanned out in disjoint batches (one output file each, merge,
                          dedupe); deterministic filters in plain code; compress raw dumps BEFORE synthesis
7.  CLAUDE CODE SYNTHESIS campaign synthesis, scoring, judgment, offer-angle development
8.  GAP-FILL / VERIFY     targeted /deep-research or WebSearch/WebFetch on the PARTIAL packet's named gaps,
                          plus a differentiated Claude sub-agent critic (NOT a duplicate broad pass)
9.  VALIDATION GATE       claim -> evidence_id; quote_count >= 3; counterexamples kept; critique applied
10. CLEAN RESEARCH PACKET conclusions + evidence only; never raw dumps
11. FINAL COPY            native Claude Code session (a clean-packet sub-agent is fine)
12. COPY QA               outreach-copy-framework for the initial written cold touch -> spam-word-checker
                          -> cold-email-copy-best-practices -> rule checklist
```

The Research Routing HARD RULE (above) governs the research stages (1, 2, 5, and 8). Stage 1 is always the Claude native `/deep-research` primary; Stages 2 and 8 fill only the gaps that primary flagged. Every stage runs inside Claude Code.

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

There is ONE active research path. "Premium-by-default" means the full `/deep-research` harness is always the primary, never a shallow inline answer. It does NOT mean wasteful: the lever that keeps a run lean is **non-redundancy**. Every extra pass costs session time and context even though it is not metered API spend, so each pass runs only on what the others did not cover.

- **Claude native `/deep-research` is the primary research engine** and runs the broad pass FIRST. Because it fans out into multiple sub-agents, one invocation covers ALL the categories the brief needs at once (market scan, cited source discovery, competitor discovery, initial ICP hypotheses, trend scan, discussion/review/forum URL discovery), fetches and reads the real sources, and adversarially verifies each claim against them before synthesizing a cited report. Give it the assembled brief and let it run every category in parallel rather than firing one narrow query at a time. It returns cited claims, source URLs, and **an explicit gap list** (thin areas, unanswered questions, low-confidence or out-of-scope items).
- **Gap passes fill gaps; they never repeat the broad pass.** After `/deep-research` (plus extraction and bulk crunch) produce the report and a gap list, route each gap to the Claude-native tool that fits it:

  | Gap in the primary pass | Route to | Why |
  |---|---|---|
  | A thin sub-topic that just needs one more grounded look | A targeted WebSearch/WebFetch pass | a fast cited pass on a single narrow question, far lighter than re-running the harness |
  | Deep technical / niche / code / standards / primary-doc reading | A second, narrowly scoped `/deep-research` run on that gap question | its sub-agents read and cross-check the primary docs a broad pass only summarizes |
  | Multi-step reasoning across sources: the "why," not just the "what" | Claude Code synthesis over the sources already fetched, or the same narrow `/deep-research` run | reason across the evidence in hand before fetching more |
  | What a person said on X / LinkedIn right now (live social signal) | WebSearch where it returns public posts; LinkedIn engagers from the intent-signals data tool; otherwise log the gap | the live X read no longer exists (no-AI-API rule) |
  | A single highest-value question that needs an independent second opinion | A differentiated Claude sub-agent critic (fresh context, adversarial brief), plus the advisor reviewer when available (1/client) | a genuinely independent second pass on the one call that matters, without another model family |

  Each returns ONLY the delta for its gap (new evidence, corrected or over-claimed conclusions, contradictions, counterexamples, source-quality issues, what is still missing). None rewrites the deep-research report unless explicitly asked. Record every pass that ran in `ai_research_provider`.
- **Link-generation / scale mode (context too big, or too many references to read directly).** Do NOT pull full pages into the orchestrating session. Instead **`/deep-research` plus WebSearch EMIT ranked candidate URLs only** into the Source Registry (they decide *what is worth reading*); **Claude sub-agents, fanned out over disjoint URL batches, WebFetch the chosen URLs** and each writes a tight, focus-scoped digest to its own output file; the digests are merged and de-duplicated into one evidence packet; **Claude Code** synthesizes from that packet. The session picks sources and reasons; the sub-agents fetch and compress. That keeps context bounded.
- **Pinpoint escalation:** the sub-agent critic above, **1/client**, only for the single highest-value question (high-ticket decision, conflicting-evidence ICP, market-entry, offer-strategy risk, final red-team).

**Anti-waste caps (run discipline, not spend gates):**

- Claude native `/deep-research` does the broad research first; gap passes take only the gap list, never repeat the broad prompt.
- The critic and synthesis steps get the packet plus specific gap questions only (or, in scale mode, sub-agent digests), never raw page dumps.
- Sub-agents compress bulk evidence before any synthesis or critique pass sees it.
- Max `/deep-research` primary runs per client: **1-2** (it fans out internally, so one run is many parallel category searches; a second run only for a genuinely distinct campaign slice). Max targeted WebSearch/WebFetch gap passes per client: **1-3**. Max narrow gap `/deep-research` runs per client: **1-3**. Max pinpoint critic runs: **1**/client. Raise only when the operator asks.
- If the primary pass already has strong cited evidence for a claim, the gap passes **audit, they do not redo**.
- Sample before scaling VOC: 20-30 quotes first; expand to 100-300 only if patterns are strong; stop if weak.

### Stage 3: Source Registry (spec'd; manual table now, validator script pending)

After discovery, do NOT read everything immediately. First record every discovered URL in a source registry so each one is read once and you can always answer "where did this claim come from." This is also an effort lever: dedupe and relevance-score before reading.

| Field | Meaning |
|---|---|
| `source_id` | stable id the packet's `evidence_id` points back to |
| `source_url` | the discovered URL |
| `source_type` | reddit / review_site / forum / news / company_site / job_board / social / docs |
| `discovered_by` | deep-research primary / websearch gap pass / operator paste / manual |
| `query_used` | the query that surfaced it |
| `date_found` | when discovery ran |
| `published_date` | when the source itself was published (flag if unknown) |
| `relevance_score` | quick 0-2 triage before reading |
| `crawl_status` | pending / crawled / failed / skipped (crawled = read with WebFetch or pasted) |
| `reason_this_source_matters` | one line: why this source is worth reading for this brief |

**Status (honest):** today this is a STRUCTURED TABLE the session maintains in the pass artifact. The deterministic dedupe and read-budget engine is a **pending follow-up**; until it lands, the registry is operator and Claude maintained, not an enforced script. Skip the full registry on `pass_depth = per-account-light`: a per-row TAM pass keeps only `source_url` plus `signal_date`.

### Stage 5: VOC / Raw-Evidence Layer

A *summary* of buyer pain is not buyer pain. It is one pass's compression of a sample you never saw. For ICP, offer, and pain work, mine the raw discussion and keep exact quotes.

Pipeline (Claude-native tools only):

1. **Search** (the built-in WebSearch): find the EXACT discussion URLs (review-site pages such as Capterra and Trustpilot, Hacker News, YouTube comment pages, niche forums). Use domain filters and `site:` operators. This hop returns URLs only; it must NOT summarize the discussion.
2. **Read** (the built-in WebFetch): fetch each URL to clean text. If a site blocks the fetch, fall back to search snippets or skip the source.
3. **Social:** the live X read no longer exists. Use WebSearch where it returns public posts, and log the gap in provenance. LinkedIn engagers and post signals come from the intent-signals data tool, not from an AI.
4. Extract every usable quote with a `source_class`, never flattening the distinction:

| source_class | What it is | Weight |
|---|---|---|
| `buyer_quote` | a real user / buyer describing a problem in their words (operator-pasted Reddit text counts here) | the gold, counts toward pain |
| `competitor_claim` | a competitor's marketing / landing copy | positioning context, NOT pain |
| `analyst_claim` | a report / analyst / press framing | context, cite carefully |
| `news` | event / announcement | timing signal only |

A competitor landing page and a Reddit complaint must never be scored the same. One is marketing; the other is pain.

**Reddit and G2 cannot be read by the harness** (tested 2026-09-22: its web fetch, web search and in-app browser all refuse reddit.com, and G2 returns HTTP 403; Trustpilot, Capterra and the Hacker News search API were readable). **The only Reddit route is operator paste**: someone reads the threads in their own browser and pastes the text plus the thread URL into the session. Pasted text counts as `buyer_quote`, with the thread URL as its `source_url`. There is no Reddit API, scraper, or third-party AI route. `/offer-intelligence` Vector 3 carries the same rule, and G2 pages count only when pasted the same way. If nothing was pasted, log Reddit (and G2) as unread. Never infer Reddit coverage from a search step that names it.

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

This is where the **gap-fill / red-team pass** lands (Stage 8). The `/deep-research` primary already adversarially verifies its own claims against sources, so this stage is a targeted top-up, not a second broad verification: a narrow `/deep-research` run digs the thin and technical gaps, a WebSearch/WebFetch cross-check tests any single claim still shaky after the primary, and a **differentiated Claude sub-agent critic** (plus the advisor reviewer when available) red-teams the partial packet. Each takes the partial packet plus specific gap questions and returns ONLY the delta: unsupported claims, contradictions, missing counterexamples, source-quality issues, strategic risks, next questions, verdict. None re-runs the broad research or rewrites the report. Record every pass that ran in `validation_provider` and the findings in `validation_notes`.

**Status (honest):** the STRONGEST version of this gate is mechanical, a script that resolves every `evidence_id` against the registry and counts `buyer_quote` sources deterministically. **That script does not exist yet.** Until it lands, the gate runs as a STRUCTURED SELF-CHECK in Claude Code, plus the delta critique pass above when the decision warrants it. Do not describe the gate as "mechanical" or "automatic" while it is a self-check; that would overclaim the one capability that justifies it.

## Compact Capability-Fit Map

Every capability below is Claude Code native, except headshot image generation (the one approved exception).

| Need | Claude Code capability | Role in stack | Weak move |
|---|---|---|---|
| PRIMARY broad research: market / competitor / ICP-pain / source discovery across all needed categories, cited and self-verified | The `/deep-research` skill (runtime, not a purchased slot) | **Primary research engine**, always | Firing one narrow inline WebSearch and calling it the primary pass, instead of running the multi-agent harness over the whole brief |
| One more grounded look at ONE thin sub-topic the primary left shallow | A targeted WebSearch/WebFetch pass | Gap-fill helper, not the primary | Re-running a pass across the whole brief the primary already covered, which is duplicate effort |
| Real-time X / social human-signal read (founder posts, complaints, buyer language) | WebSearch where it returns public posts; LinkedIn engagers from the intent-signals data tool; otherwise a logged gap | Social timing and human hook | Treating a like or post as buying intent, or claiming a live X read that no longer exists |
| Mining real buyer voice (review sites, HN, YouTube, forums) into exact quotes | WebSearch for URLs, then WebFetch to read; Reddit and G2 by operator paste only | VOC / raw-evidence layer | Letting the search layer summarize the discussion instead of reading the exact quotes; implying Reddit was read when nothing was pasted |
| Filling the gaps the primary pass left thin / technical / niche / multi-step | A second, narrowly scoped `/deep-research` run on the gap question | Non-redundant gap-fill | Asking it the same broad question the primary already answered |
| Corpus too big / too many references to read directly | `/deep-research` + WebSearch EMIT ranked URLs, then sub-agents WebFetch and digest disjoint batches, then merge and dedupe, then Claude Code synthesizes | Link-generation / scale mode | Pulling full raw pages into the orchestrating session, which blows context |
| Pinpoint high-value reasoning (conflicting-evidence ICP, market-entry, offer risk, final red-team) | A differentiated Claude sub-agent critic plus the advisor reviewer when available, 1/client | Independent second opinion | Using it for broad duplicate research, or reaching for another model family |
| Critic / second-opinion / judge panels (`/consultant`, `/roast`) | Differentiated Claude sub-agent personas plus the advisor reviewer when available; web fact-checks via WebSearch/WebFetch | Critique | Calling a model from another family for "diversity" |
| Sender persona headshots | `ai.image_generation`: OpenAI, headshots only, asked for at infrastructure setup (the approved exception) | Image generation | Using the exception for any other image, or asking for its key before infrastructure setup |
| Bulk synthesis / clustering / classification / pre-compressing raw page and VOC dumps before synthesis | Claude sub-agents fanned out per `/personalization-subagent-pattern` (disjoint batches, one output file each, post-merge dedupe); deterministic filters in plain code | Bulk crunch and dump pre-compression | One agent reading the whole corpus, or overlapping batches that return duplicate or convergent output |
| Final high-quality cold email and phone scripts from a clean packet | The native Claude Code session (a clean-packet sub-agent is fine) | Final copy | Writing copy inside a long, messy execution context instead of from the clean packet |
| Raw URL to clean text | WebFetch | Extraction | Answering from memory about a page instead of fetching it |
| Backfill a single missing MUST-HAVE field a source left blank (for example a personal `linkedin_url`, `company_linkedin`) | The configured contact-data tool first, then **WebSearch (returns the REAL URL), then Claude confirms the result matches the entity by name plus company/domain** | Verified field backfill | Emitting a URL or value from memory (a hallucinated `linkedin.com/in/...`), or accepting a candidate without confirming name plus company. A wrong value is worse than a blank |

WebSearch is the raw discovery and URL feed that sits in front of research and page reads. See `lead-list-tech-stack-research.md`. It is a harness tool, not a purchased slot.

**For data tools, nothing is "in" or "out" of the stack until the contract says so.** For AI, the rule is closed: no third-party AI tool is added to fill a retired slot, whatever a worked example, a catalogue, or a connected MCP server suggests.

## Clean Research Packet

The final copy step must receive a **clean research packet**, not a messy long-running execution context, whether it runs in the session or in a clean-packet sub-agent. The packet is conclusions plus evidence, never raw page dumps, tool logs, or scratch work.

```
buyer_persona          # who, seniority, real buyer title
account_context        # what the company is / does
business_context       # initiative, expansion, funding, hiring: why it matters
technical_context      # stack, docs/changelog/product signal if relevant
human_hook             # public post / comment, if any (WebSearch-sourced; there is no live X read)
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
ai_research_provider   # provenance (e.g. claude-deep-research; + any claude-websearch gap passes)
ai_analysis_provider   # provenance (claude-subagents / Claude Code)
validation_provider    # who ran validation/critique (Claude Code self-check / sub-agent critic / advisor)
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

- First: assemble the brief (what decision, output, freshness, confidence). There is ONE path, premium-by-default and non-redundant. No tier to pick, and no provider to pick.
- Broad market / source / competitor / ICP discovery? Run **Claude native `/deep-research`** as the primary pass: hand it the whole brief and let its sub-agents cover every category in parallel with adversarial verification. Targeted WebSearch/WebFetch passes are helpers, not the primary brain.
- Do I need REAL buyer language and pain quotes (not a summary of them)? Use **WebSearch** to find the exact review and forum URLs, then **WebFetch** to read them, and ask the operator to paste any Reddit threads that matter. Capture exact quotes, and never let the search layer pre-summarize.
- Is it about what a person said on X / LinkedIn / Reddit right now? X: WebSearch where it returns public posts, otherwise log the gap. LinkedIn: the intent-signals data tool. Reddit: operator paste only.
- Do I just need a URL turned into text? Use **WebFetch**.
- Do I have a large corpus to classify or compress (500+ rows)? Fan it out across **Claude sub-agents** in disjoint batches per `/personalization-subagent-pattern`, with deterministic filters in plain code first.
- Did the primary pass come back thin, too technical, or shaky on a sub-topic? Fill ONLY that gap with a **narrow `/deep-research` run** (deep, technical, multi-step) or a **targeted WebSearch/WebFetch cross-check** on one narrow claim. Use the **sub-agent critic** only for the one highest-value question. Never a duplicate broad pass.
- Corpus too big or too many references to read directly? Use **scale mode**: `/deep-research` and WebSearch EMIT ranked URLs, sub-agents WebFetch and digest disjoint batches, the digests are merged and de-duplicated, and **Claude Code** synthesizes.
- Do I need a second opinion or a critic panel? Use **differentiated Claude sub-agent personas** plus the advisor reviewer when available. No other model family.
- Am I writing the actual email or phone script? Write it in the **native Claude Code session** from a clean research packet (a clean-packet sub-agent is fine). See the Copy Generation HARD RULE.
- Do I need a sender headshot? Use **`ai.image_generation`** through `/mailbox-profile-generator`, and only then ask for its key. Nothing else generates images.

## Credentials

No research, crunch, critique, or copy step needs an AI key. The only AI credential anywhere in the flow is the headshot key (OpenAI, headshots only, asked for at infrastructure setup), and it is never requested or flagged as missing before that point. Third-party AI keys and Claude API keys are retired: they do not belong in `scripts/.env.example` or `scripts/credential-registry.json`, and no skill asks for them.

Credential **names** for the data slots live in `stack-contract.yaml` and are mirrored machine-readably into `scripts/credential-registry.json`. Real values live only in `scripts/.env`, which is gitignored; `scripts/.env.example` carries placeholders and is regenerated by `/stack-setup` to match the chosen stack.

**This file asserts nothing about which keys are present.** Presence and shape are `/preflight-credentials`' job; balance and spend are `/api-cost-governance`' job.

## Executable Layer

Everything in this pipeline runs today, with no AI key and no activated pack:

- **Primary research** is a **native skill invocation, not a router call and not an API call**: run the Claude native `/deep-research` skill directly inside this Claude Code session and hand it the assembled brief so its sub-agents cover every category in parallel.
- **Gap passes and page reads** are the built-in WebSearch and WebFetch tools.
- **Bulk crunch and per-row research** run as Task sub-agents per `/personalization-subagent-pattern`: partition the rows into disjoint batches (10 to 20 items per agent for reasoning-heavy rows, larger for light classification), give each agent its own output file, merge by a stable id, then de-duplicate and check for convergent output. Per-row web research at TAM scale runs the same way, with each sub-agent using WebSearch/WebFetch, at sample scale first. Do **not** also run a broad research pass over the same rows; that is the duplicate-pass waste this doctrine forbids.
- **Critic panels** are sub-agents given differentiated personas and adversarial briefs, plus the advisor reviewer when the session has one.
- **Research-routing audit:** `scripts/research/research_routing_check.mjs` checks that each research-skill run logged its `/deep-research` primary in the ledger.
- **Headshots:** `scripts/generate_inbox_profiles.py`, run by `/mailbox-profile-generator` (the one approved AI exception).

The scripts that used to call AI provider APIs were archived on 2026-09-22 (see `outbound/_archive/no-ai-api-2026-09-22/MANIFEST.md`). Nothing in this pipeline calls them, and none is to be restored as a research, crunch, or copy path.

**Still pending (do NOT describe as runnable):** the deterministic Validation Gate and source-registry store. Until they exist, the registry is a manual table and the gate is a structured self-check (see Stages 3 and 9).

## Fallback Rules

Never emit a call to a third-party AI provider or a keyed Claude API call, and never substitute one when a Claude-native step struggles. Degrade inside Claude Code and record what actually ran.

- **The `/deep-research` harness is unavailable or errors.** Say so and retry once. If it still fails, get a fresh explicit operator OK before proceeding on targeted WebSearch/WebFetch passes alone, and log that run as a flagged exception in the ledger line and the activity log. Never present a bare inline answer as the primary pass.
- **A gap pass comes back empty or thin.** Record the gap as open in `validation_notes` and mark the affected claims low-confidence. Do not escalate to another provider.
- **WebFetch is blocked on a site.** Fall back to WebSearch snippets, or skip the source and note it in the registry. Reddit and G2: operator paste only; if nothing was pasted, log them as unread.
- **A live social read is requested.** It is not available. Use WebSearch where it returns public posts and log the gap.
- **A sub-agent batch fails or returns malformed output.** Re-run that batch alone on the same partition. Never collapse to one agent reading everything, and never route the batch to a paid model.
- **The `ai.image_generation` key is absent when the headshot step runs.** Ask for it at that point, which is the only moment the rule allows. If the operator declines, skip image generation and say so. Do not substitute a text model for an image step.
- **Provenance stays honest.** Log what actually ran in `ai_research_provider` / `ai_analysis_provider` / `ai_copy_provider` / `validation_provider`.
- **The whole pipeline runs on Claude Code alone.** That is the design, not a degraded mode. The one thing that never counts as the primary research pass is a bare inline WebSearch/WebFetch answer; run the full `/deep-research` fan-out harness instead.

## Cost-Control Rules

- **One active path: premium-by-default, non-redundant.** Do not run every tool on the same question; that is a buffet, not a pipeline.
- **Claude Code usage is not a per-call metered API spend in these skills.** The session, its sub-agents, `/deep-research`, and WebSearch/WebFetch get no token preview and no spend row in the ledger. The only AI spend row is the headshot image call. `/api-cost-governance` still gates every paid data-vendor call and that headshot call.
- **There is no AI research budget.** The old per-provider research cap (`run_state.research_budget_usd_per_provider`) was removed on 2026-09-22 because no AI provider is left for it to cap. No skill writes, reads or blocks on it; ignore it in older profiles. Research is bounded by the run caps below, not by dollars.
- **Gap passes never duplicate the primary broad pass.** The primary is `/deep-research` (1-2 runs/client, because it fans out internally). Gap passes run only on the gaps it flagged: 1-3 targeted WebSearch/WebFetch passes/client, 1-3 narrow gap `/deep-research` runs/client, 1 pinpoint critic/client. These caps bound session time and context. If the primary already has strong cited evidence for a claim, the gap passes audit, they do not redo.
- **Read only after the Source Registry dedupes and relevance-scores URLs** (deep passes). Duplicate reads are pure waste.
- **Use WebSearch before a `/deep-research` run when you only need URLs.**
- **Compress in sub-agents before synthesis.** Never pull raw page or VOC dumps straight into the orchestrating session by default; have sub-agents digest them in disjoint batches first (especially 500+ row batches). Tiny interactive corpora (a couple of pages) can be handled inline.
- **Scale mode beats brute force when references are many or context is huge:** `/deep-research` and WebSearch EMIT ranked candidate URLs only; sub-agents WebFetch and digest; Claude Code synthesizes from the merged digests.
- **Copy QA defaults to rule-based:** `outreach-copy-framework.md` for the initial written cold touch, plus `spam-word-checker.md`, `cold-email-copy-best-practices.md`, and a rule checklist. Add a sub-agent critic ONLY for high-ticket, risky-claim, strategic, or client-facing copy, never as the default.
- **Final copy GENERATION happens in the native session**, as do synthesis, scoring, JSON subroutines, and copy QA.
- Do not run the **primary `/deep-research` pass per row.** Run one account-level (or slice-level) research pass and reuse it across every contact at that account.
- **Sample before scaling VOC:** 20-30 quotes first; expand only if patterns are strong; stop if weak.
- Cache the clean research packet per company so a re-run does not redo research.
- If an AI step does not improve relevance, quality, speed, scale, or QA, skip it.

## Don't Add AI Just Because It Exists

- Static, template, or already-decided copy needs no AI step.
- One tool per job. Stacking passes on one step is time and context, not quality.
- **Task-tool sub-agents are the default for per-lead work, bulk crunch, AND clean-context final copy.** `/personalization-subagent-pattern` and `/icp-prompt-builder` run on Claude Code Task sub-agents by design; final copy runs the same way (a sub-agent fed only the clean packet) to get context hygiene. At 1,000+ leads, run more sub-agent batches (in sequential waves if needed); there is no raw-provider path.
- Provenance columns must reflect reality. If sub-agents ran the crunch, `ai_analysis_provider` says `claude-subagents`, not a vague "Claude".
- Copy and QA guardrails are never bypassed. `outreach-copy-framework.md` controls every initial written cold touch; `spam-word-checker.md` and `cold-email-copy-best-practices.md` remain required regardless of who drafted.

## Where This Can Fail

- A web-grounded pass still hallucinates if you skip the evidence URL. Keep `signal_source_url` and `evidence_id`.
- Sub-agent crunch on a bad corpus produces confident garbage. Garbage-in still applies.
- **Treating a competitor landing page like a buyer complaint.** Enforce `source_class`: marketing copy is positioning context, not pain. Flattening them is how bad ICP thinking starts.
- **Prose that reads as if a script ran.** The Source Registry and Validation Gate are a manual table and a self-check until their scripts exist. Calling them "mechanical" or "automatic" overclaims the very capability that justifies them, so keep the status honest.
- **Calling a declared gap pass a "fallback."** A targeted WebSearch/WebFetch pass or a narrow `/deep-research` run that fills a NAMED gap in the primary is a logged gap pass (Stages 2 and 8), not a silent fallback. Quietly swapping a bare WebSearch in *for* the missing `/deep-research` primary IS the violation. Keep the distinction.
- **Claiming coverage the harness cannot reach.** Reddit and G2 are unreadable by WebFetch, WebSearch, and the browser pane, and the live X read is gone. Log them as unread gaps rather than implying a search step covered them.
- **Reaching for another model family.** A second opinion comes from a differentiated Claude sub-agent plus the advisor reviewer, never another provider. If a skill, an example, or a connected MCP server suggests one, it is retired by the no-AI-API rule.
- **Fan-out without partitioning.** Overlapping batches produce duplicate or convergent output. Partition first, give each agent its own output file, and de-duplicate after the merge.
- **Assuming a data tool exists because a file names it.** Check `stack-contract.yaml`, and check that the slot's status is `live` rather than `chosen`, before you promise the operator a step is automated.
- Social signal is timing and language, not proof of fit. Pair it with account context.
- Routing adds value only when the step is genuinely research, crunch, social, extraction, VOC, validation, or copy heavy. For pure orchestration, file edits, and local execution, Claude Code works directly and no routing is needed.

## Capability-to-Stage Quick Reference

- PRIMARY broad research (all categories, fan-out, adversarial verify, cited synthesis): **Claude native `/deep-research` skill**, always
- One more grounded look at ONE thin sub-topic: a targeted WebSearch/WebFetch pass (helper, not the primary)
- Social and human hook: WebSearch where it returns public posts; LinkedIn engagers from the intent-signals data tool; the live X read no longer exists
- Buyer-voice mining (exact pain quotes): WebSearch for URLs, then WebFetch to read; Reddit and G2 by operator paste only
- Raw page extraction: WebFetch (fallback: search snippets)
- Bulk synthesis, classification, and pre-compressing raw page/VOC dumps: Claude sub-agents fanned out per `/personalization-subagent-pattern`; deterministic filters in plain code
- Deep technical or multi-step gap-fill on the primary pass: a narrow `/deep-research` run on the gap question, never a duplicate broad pass
- Corpus too big or too many references: scale mode. `/deep-research` and WebSearch emit URLs, sub-agents WebFetch and digest disjoint batches, the digests are merged and de-duplicated, Claude Code synthesizes
- Packet validation: the primary `/deep-research` already self-verifies; add a structured self-check in Claude Code plus a targeted gap pass or sub-agent critic when warranted (validator script pending)
- Critic / second-opinion panels (`/consultant`, `/roast`): differentiated Claude sub-agent personas plus the advisor reviewer when available
- Sender headshots: `ai.image_generation` (the approved exception, headshots only, key asked for at infrastructure setup)
- All inline reasoning, JSON, classification, scoring, synthesis: Claude Code
- Final email and phone copy: the native Claude Code session (a clean-packet sub-agent is fine)
- Copy QA: outreach-copy-framework for the initial written cold touch, plus spam-word-checker, cold-email-copy-best-practices, and the rule checklist (default); a sub-agent critic only for high-ticket or client-facing work
- Orchestration, file ops, routing: Claude Code (local)

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short, and record status, not raw output. Full protocol: `client-activity-log.md`.
