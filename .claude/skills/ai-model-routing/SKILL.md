---
name: ai-model-routing
description: "AI routing AND research-pipeline doctrine for FNNL Agency cold outbound, under the no-AI-API rule (operator directive 2026-09-22): the only AI is Claude Code itself (the session, its sub-agents, the /deep-research fan-out harness, its built-in WebSearch and WebFetch, and since 2026-09-24 the built-in browser pane for read-only page reads). Use before any research, page-read, crunch, critique, or copy step. Defines the brief-first, non-redundant, evidence-ledger-backed, VOC-aware, validation-gated pipeline and separates discovery, gap-fill, extraction, VOC mining, bulk crunch, analysis, validation, and final-copy layers. Sub-agents are routed by model tier through the Agent tool's model setting (no API call): a small model extracts and tags, a mid model clusters, compares and judges one item at a time, and the session's strongest model synthesizes, builds offers, runs QA verdicts and writes copy. The PRIMARY research pass is the deep-research harness (the plugin skill anthropic-skills:deep-research), or its declared flat sub-agent fan-out, logged as claude-subagent-fanout, when the harness is unavailable. Thin spots are filled by a second targeted /deep-research or WebSearch/WebFetch pass, evidence is counted and checked through scripts/research/evidence_ledger.mjs and the Research QA gate in market-evidence-standard.md, bulk crunch is Claude sub-agent fan-out, critique is differentiated Claude sub-agents, and final copy is written in the native session. The third-party research, bulk-classification, copywriting, search, and crawl slots are retired; the one surviving AI slot is image generation for sender headshots only. Pairs with lead-list-tech-stack-research.md, which routes the data/scraping/enrichment tools, and with market-evidence-standard.md, which defines the evidence the research produces."
---

# AI Model Routing

This is the routing reference AND the research-pipeline doctrine for every research, analysis, and copy step in the cold-outbound flow. It is the AI-layer sibling of `lead-list-tech-stack-research.md`: that file decides which **data tool** collects a signal; this file decides which **Claude Code capability** researches, crunches, validates, or writes from it, and in what order. The evidence those steps produce, and how it is counted and checked, is defined in `market-evidence-standard.md`.

A weak workflow pours every step through one undifferentiated pass. A strong workflow asks "what decision is this serving, how fresh and how confident must it be, and is this step discovery, extraction, VOC, analysis, validation, or final copy?" and then gives each step the right Claude Code tool (the fan-out harness, a targeted web pass, a batch of sub-agents, or the session itself), at the cheapest model tier that still does the job well.

Claude Code is the execution cockpit and the only AI in the flow. It inspects files, routes the workflow, runs scripts, and orchestrates, and it also does the research, crunch, critique, and writing through its own tools.

## There is no AI vendor: Claude Code is the only AI (no-AI-API rule, operator directive 2026-09-22)

The operator's rule: this workflow makes **no third-party AI API calls and no Claude API calls made with a key**. The only AI is Claude Code itself:

- the running session,
- its sub-agents (the Task/Agent tool),
- the Claude native `/deep-research` fan-out harness,
- its built-in WebSearch and WebFetch tools,
- the built-in browser pane (added 2026-09-24): the `mcp__Claude_Browser__*` tools, used for `navigate` and `get_page_text` on pages WebFetch cannot render, such as JavaScript apps like the Meta and LinkedIn ad libraries. It is a capability of the Claude desktop app, not a vendor, so it fills no stack slot and needs no key. It is read-only: never log in to a site through it, never submit a form, decline non-essential cookies, never use it where a platform needs an account to read, and read one page at a time rather than across parallel sub-agents. It exists only when the session runs in the desktop app; when it is absent, the page is logged as unread. The read routes per platform are `market-evidence-standard.md` section 9. Claude in Chrome (the `mcp__claude-in-chrome__*` extension) is never used for research, because it acts inside the operator's real browser with their own sign-ins.

There is no "gap-fill engine", no "complement engine", no "model panel of other families", and no third-party "cheap model pass" any more. Where earlier versions of this file routed work to a third-party AI slot, the Claude-native tool in the table below now does that job. A cheaper model for simple work still exists, but it is a Claude sub-agent on a lower tier (the Agent tool's `model` setting, [Model tiers for sub-agents](#model-tiers-for-sub-agents) below), not another provider.

**The one exception is sender headshots.** `ai.image_generation` survives for persona headshots only: OpenAI, headshots only, asked for at infrastructure setup. It is recorded as an operator-approved exception in `approved_stack.approved_exceptions` of `outbound/stack-contract.yaml` (2026-09-22). Its key is **never** requested or flagged as missing at onboarding, intake, kickoff, preflight, stack setup, or workspace creation. `/mailbox-profile-generator` asks for it only when the headshot step actually runs, or when the operator says to start setting up cold-email infrastructure.

> **Approved-stack rule (operator directive 2026-09-22).** FNNL's tools are the closed list in the `approved_stack` block of `outbound/stack-contract.yaml`. Meet every need from that list first, and check each listed tool's full surface (its MCP tool list and API docs) before declaring a gap. Any other tool named in this file is a catalogue example: raise it only as "OUT OF STACK, needs operator approval", never as the path, and never credential or spend on it until the operator approves it by name and it is recorded in `approved_stack.approved_exceptions`. A slot at status `held` declares nothing, exactly like `not_chosen`.

The AI and web slots in the contract, and what does each job now:

| Slot | Status (2026-09-22) | What does the job now |
|---|---|---|
| `ai.research_provider` (every role it used to cover: grounded search, deep reasoning, live social, premium pinpoint) | **retired** | Primary: the `/deep-research` harness. Gaps: a second targeted `/deep-research` run or a WebSearch/WebFetch pass. Live X read: not available (see Stage 5). |
| `ai.research_routing` | a policy, not a tool | `claude_deep_research` (the primary). If the harness fails, the declared sub-agent fan-out runs instead and is logged as `claude-subagent-fanout` (see the Research Routing HARD RULE) |
| `ai.bulk_classification` | **retired** | Claude sub-agents fanned out per `/personalization-subagent-pattern`; deterministic filters stay in plain code |
| `ai.copywriting` | **retired** | The native Claude Code session (a clean-packet sub-agent is fine) |
| `ai.image_generation` | kept, headshots only | The approved exception above, run by `/mailbox-profile-generator` |
| `web.search` | **retired as a third-party slot** | The harness's built-in WebSearch |
| `web.crawl` | **retired as a third-party slot** | The harness's built-in WebFetch; the built-in browser pane for a JavaScript page WebFetch cannot render (2026-09-24, read-only) |

Slot names are written here group-qualified (`ai.research_provider`, `web.crawl`) because that is the path into the contract file. Other skills, and `/stack-setup` itself, often use the bare key (`research_provider`, `bulk_classification`, `copywriting`, `search`, `crawl`). They are the same slots.

**A retired slot is not a gap.** Its `tool` is null by design. If a skill, an old profile, or a worked example routes work to one, do that job with the Claude-native tool in the table and do **not** send the operator to `/stack-setup` to fill it. Never credential, buy, or call a third-party AI tool to fill it either.

**Do not confuse the retired contract slot `ai.research_provider` with the provenance field `run_state.ai_research_provider`** (and its packet twins `ai_analysis_provider`, `ai_copy_provider`, `validation_provider`). The provenance fields keep their names, because 50+ skills read them. Only their values change, for example `claude-deep-research`, `claude-subagent-fanout`, `claude-websearch`, `claude-subagents`, `claude-native`.

The data slots this file does not govern (discovery, enrichment, verification, the list workbench) keep the full stack-contract discipline: if a data slot a run needs is unset, stop and route the operator to `/stack-setup`, and a `chosen` tool is not a `live` tool.

### Model tiers for sub-agents

Sub-agents are routed by job, not all run on the top model. Every Task/Agent call takes a `model` setting. It picks which Claude model the sub-agent runs on inside this Claude Code session, so it is not an API call, needs no key, and stays inside the no-AI-API rule.

| Job | Tier (Agent tool `model`) | Examples |
|---|---|---|
| Mechanical extraction, tagging, normalization, filling shared text into columns, quote spot-checks | small (`"haiku"`) | Tagging replies in `/market-evidence feedback`; extracting evidence-ledger fields from a fetched page; filling a slice's pre-written bodies into the `email_*` columns |
| Judgment on one item: reading a site to answer a structured question, per-company why-now research, fit classification with a locked prompt | mid (`"sonnet"`) | `/tam-build` per-company research; `/icp-prompt-builder` scoring at scale |
| Clustering, comparing competitors, building competitor cards | mid (`"sonnet"`) for large or multi-segment sets; the session otherwise | `/market-evidence synthesize` on more than about 150 ledger rows |
| Synthesis, offers, strategy, QA verdicts, opportunity scores, copy | the session's strongest model (omit `model` so the sub-agent inherits it, or do the work in the session) | The Research QA verdict; `/lead-magnet-brainstorm`; `/campaign-copywriting` |

**Moving a recurring job down a tier needs proof first.** Before a job moves from the session to `sonnet`, or from `sonnet` to `haiku`, run a 20-row agreement check: have the candidate tier answer the same 20 rows the session (or the operator) already answered, compare, and lock in the cheaper tier only if agreement holds. Otherwise stay one tier up. The move also needs a pass on the benchmark described in `outbound/evals/README.md`. Re-run the check when a job's inputs change.

## Model Benchmarks (Claude-native, 2026-09-24)

**The rule.** Never ask "which model is best?". Ask "which Claude Code tier does THIS workflow well enough?", and answer it with a benchmark on our own work. The harness is `outbound/evals/`: its `README.md` is the operator guide and `BENCHMARKS.md` is the dated decision log. It calls no model API and holds no key: a script cannot launch sub-agents, so `run_eval.mjs prepare` writes the case packets and a fan-out plan, the session runs the sub-agents on the tier under test (the Agent tool's `model`), and `run_eval.mjs grade` scores the answers on disk.

- **What is benchmarked.** The repeated jobs where a cheaper tier would help most: `voc-extraction` (raw source to ledger rows), `competitor-card` (one competitor page to card fields) and `company-fit` (a client's locked `/icp-prompt-builder` prompt on one company row). Reply tagging joins once replies are stored on disk.
- **Who is compared.** Claude tiers only (`haiku`, `sonnet`, the session's own model), and canonical prompt versions before and after an edit. No other model family, ever (the no-AI-API rule).
- **How it scores.** Deterministic checks only (`outbound/evals/lib/checks.js`): valid schema, quotes verbatim from the source, no invented competitors, customers or prices, fields left blank when the source is silent, and agreement with gold labels. No model grades another. Gold labels carry a `label_status`, and only `client` and `operator` labels count as ground truth.
- **Local only.** Cases hold client research, so cases built from client data (`cases.local.yaml`) and every raw result stay on this machine (gitignored).

**Moving a job down a tier** needs both halves:

1. On its suite (`--repeat 3`), the cheaper tier **matches** the current one on `verbatim`, `grounding` and `blank_discipline` (the hallucination checks) and is **within 5 points** on the rest.
2. The 20-row agreement check on live work ([Model tiers for sub-agents](#model-tiers-for-sub-agents) above) still passes.

Record the decision in `BENCHMARKS.md`, then edit the route here.

**Canonical prompts are benchmarked in place.** `outbound/evals/voc-extraction/prompt.md` is the instruction every extraction sub-agent is handed (in `/offer-intelligence` and `/market-evidence`), and `outbound/evals/competitor-card/prompt.md` is the instruction for reading one competitor page in Vector 1. The `company-fit` suite reads each client's locked prompt from its profile folder. Because production and the benchmark read the same file, an edit to one of these prompts goes through the before-and-after loop in `outbound/evals/README.md`, and the commit message says what the scores did.

## When To Use This

Use this before:

- `/offer-intelligence` runs its research vectors, and `/market-evidence` synthesizes them.
- `/lead-source-strategy` Discovery mode runs company/market/social research.
- `/data-point-discovery` runs its brainstorm pass.
- `/auto-research-public` researches a target.
- `/campaign-strategy` synthesizes campaign ideas.
- `/lead-magnet-brainstorm` builds offers from the research.
- `/campaign-copywriting` writes final copy or phone scripts.
- `/list-quality-scorecard`, `/icp-prompt-builder` or `/tam-build` classify at scale.
- `/consultant` or `/roast` run a critic or second-opinion panel.

Do not add an AI step to a step that does not need one. See [Don't Add AI Just Because It Exists](#dont-add-ai-just-because-it-exists).

## Research Routing: HARD RULE (Claude native deep research primary)

This is the authority for the rule; every research skill points here. **The primary research pass is Claude native multi-agent deep research, the `/deep-research` fan-out harness.** It spawns multiple sub-agents that research every category the brief needs in parallel (market, competitor, ICP pain, social, VOC discovery), fetches and reads real sources, adversarially verifies each claim against those sources, and synthesizes one cited report.

It is a **runtime capability of the Claude Code session itself, not a purchased slot**, and it needs no API key.

**What `/deep-research` means in this library.** The harness is the plugin skill `anthropic-skills:deep-research`, invoked through the Skill tool. There is no repo skill of that name in `.claude/skills/`, so do not go looking for one there (an upstream run on 2026-09-23 lost time doing exactly that). Every mention of `/deep-research` in this workspace means that plugin skill.

**The declared fallback when the harness is unavailable.** When the harness is not available in the session, errors, or is rate-limited, the sanctioned fallback is a **declared flat fan-out of 4 to 8 Claude research sub-agents** working from the same assembled brief: one research category each (for example market, competitors, ICP pain, buyer voice, triggers), disjoint output files, a post-merge uniqueness check per `/personalization-subagent-pattern`, and sub-agents that never spawn sub-agents of their own. Log it as `claude-subagent-fanout`. This replaces the 2026-09-22 rule, which said to retry once and then stop for a fresh operator OK before proceeding on WebSearch/WebFetch alone. The fan-out is a real multi-agent primary pass, so it runs without asking; it is simply logged for what it was, never as `claude-deep-research`.

`run_state.research_routing` (no-AI-API rule, operator directive 2026-09-22; fallback added 2026-09-24):

- **`claude_deep_research` (the primary, and the value a profile carries).** The deep-research harness runs the primary broad pass (fan-out sub-agents across all needed categories, adversarial verification, cited synthesis). **This is CLAUDE NATIVE, not the Claude API.** It runs inside this Claude Code session on native session inference, invoked through the Skill tool. It does **NOT** use an API key and is **NOT** run through a provider router.
- **If the harness fails: the logged `claude-subagent-fanout` fallback.** This is a provenance label written to `ai_research_provider` and the run ledger when the fallback above ran. It is not a second routing value, so a profile's `run_state.research_routing` stays `claude_deep_research` either way.
- **Retired values.** `third_party_ai` (a primary pass led by a third-party research tool) is retired together with the third-party research slot. `claude_native` is no longer a routing value either. If a profile still carries either one, run the primary as `claude_deep_research` and note the normalization in the activity log. Do not ask the operator to pick between them.

**Unset means `claude_deep_research`.** If `run_state.research_routing` is unset, run the primary pass. Do **not** stop to ask.

**A bare inline WebSearch is never the primary pass.** Inline WebSearch/WebFetch (one shallow pass, no fan-out, no adversarial verify) is the right tool for a tiny throwaway lookup and for the targeted gap passes in Stages 2 and 8. It never satisfies the Stage-1 primary, and it is not the fallback either: the fallback is the declared multi-agent fan-out.

**Execution proof: the primary pass is satisfied by a RECORDED run, not by intent.** The Stage-1 primary pass MUST be an actual harness invocation or the declared fan-out, not a single inline WebSearch answer and not a per-row enrichment pass. Then **record proof**: set `run_state.ai_research_provider` to `claude-deep-research` or `claude-subagent-fanout` (append, do not overwrite, when gap passes also ran, for example `claude-deep-research + claude-websearch`) AND append a one-line run record to the ledger at `scripts/api-balance-ledger.md` (date, skill, `Claude /deep-research (primary), <n> sub-agents / categories` or `Claude sub-agent fan-out (primary fallback), <n> sub-agents / categories`, client). That line is an audit record, not a spend row: it carries no cost. Create the ledger file on first use if it does not exist yet.

**Self-check before you declare any research step done:** if the run produced no recorded primary (harness or declared fan-out), that is a **FLAGGED VIOLATION**. Stop and run the primary now, through the harness or, if it is unavailable, the fan-out. Where the ledger line exists, `scripts/research/research_routing_check.mjs --skill <skill> --client <client> --json` audits it, and it counts both `claude-deep-research` and `claude-subagent-fanout` as a primary. The script can only see runs that left a ledger line, so the line itself is mandatory.

**Auditability note.** Claude Code usage is not a per-call metered API spend in these skills, so no credit dashboard shows the run. The ledger line plus the activity-log entry are what keep it auditable in-repo (which primary ran, how many categories and sub-agents).

**Gap-fill passes (declared, not a fallback).** After the deep-research primary produces its report plus a gap list, fill each remaining gap with a Claude-native tool:

- **A thin sub-topic:** a targeted WebSearch/WebFetch pass on that one narrow question.
- **A deep, technical, niche, or multi-step gap:** a second, narrowly scoped `/deep-research` run on the named gap question.
- **What a person said on X or LinkedIn right now:** the live X read no longer exists. Use WebSearch where it returns public posts, and log the gap. LinkedIn engagers and post signals come from the data tool in `lead_data.intent_signals`, which is a data vendor, not an AI provider.

These are DECLARED stages (Stages 2 and 8), recorded in `ai_research_provider`. They fill only what the primary pass flagged and never repeat the broad pass. No third-party provider fills a gap.

**Web retrieval and per-company research:**

- The harness (or its declared fan-out) is the research default. Its sub-agents search, fetch and read sources themselves.
- WebSearch and WebFetch handle gap-fill questions and one-off reads (a client's own website, a single page a pass needs in full).
- The built-in browser pane (2026-09-24) reads a JavaScript page WebFetch cannot render, such as the Meta and LinkedIn ad libraries. Read-only, never logged in, and only when the session runs in the desktop app. Never Claude in Chrome.
- **The same structured question across a domain list** (funding, hiring, pricing tier, why-now trigger, ICP-fit verdict) runs on **mid-model sub-agents** (`model: "sonnet"`) using WebSearch and WebFetch, fanned out per `/personalization-subagent-pattern` (disjoint domain batches, one output file per agent, post-merge dedup), with results pushed into the list workbench by webhook. Answers stay unverified until a sample is spot-checked against the source pages. Never loop the primary research pass per row.
- No AI column in the list workbench, on any key (the zero-workbench-credit rule in `CLAUDE.md`).

This governs **research** (discovery, grounding, social, VOC, pain-mining). Extraction, crunch, validation, and final copy route per the map below.

## Copy Generation: HARD RULE (native Claude Code session)

Final cold-email copy and phone scripts are written **in the native Claude Code session** from the clean research packet (no-AI-API rule, operator directive 2026-09-22). A clean-packet sub-agent (a Task sub-agent fed only the packet) is fine, and it is the preferred way to get context hygiene.

- **This supersedes the 2026-06-17 directive** that generated copy through a Claude API call by default, and it retires the `ai.copywriting` slot. There is no API copy path and no "no key, notify, then fall back" branch. Native is the path.
- **Record `ai_copy_provider = claude-native`** (or `claude-native (sub-agent)` when a clean-packet sub-agent wrote it).
- **The Copy QA Gate runs regardless.** Initial written cold touches must first pass `outreach-copy-framework.md`; all copy then passes `spam-word-checker.md` plus `cold-email-copy-best-practices.md` plus the rule checklist, plus the research-trace check (every pain line traces to a pain cluster, `market-evidence-standard.md` section 13). Nothing bypasses them.
- **Quality comes from the packet and the gate.** Copy is good when it is built on a clean, evidence-backed packet and passes the QA gate. A sub-agent that sees only the packet gives the same context isolation a separate model call used to give, without any key.

## The Research Pipeline

Research is not "call a tool." It is an ordered pipeline that knows what decision it is serving before it spends any effort. Intent decides routing, so the brief comes first.

```
0.  RESEARCH BRIEF        assembled from profile + existing research + data-point-catalog + campaign slice
                          (goal, market, ICP, decision supported, output, freshness, confidence,
                           source types, VOC?, assumptions to verify, open questions, pass_depth)
1.  PRIMARY RESEARCH      the deep-research harness (anthropic-skills:deep-research; multi sub-agents run
                          ALL needed categories in parallel: market/source/competitor/ICP-pain discovery +
                          source URLs + adversarial claim verification + cited synthesis + its own gap
                          list), or its declared flat sub-agent fan-out (claude-subagent-fanout)
2.  GAP-FILL RESEARCH     fills ONLY the primary pass's gap list: a targeted WebSearch/WebFetch pass on a
                          thin sub-topic, or a second narrowly scoped /deep-research run on a technical or
                          multi-step gap. No third-party provider. In scale mode these EMIT ranked URLs,
                          they do NOT read every page
3.  SOURCE REGISTRY       candidate URLs deduped and triaged before reading (a table in the run folder)
4.  READ / EXTRACT        WebFetch (default); the built-in browser pane for JavaScript pages; small-model
                          sub-agents extract. A page nobody could read is logged as unread, never a snippet
5.  VOC / RAW EVIDENCE    every item becomes an evidence-ledger row (market-evidence-standard.md section 3);
                          exact quotes; Reddit by operator paste only
6.  BULK CRUNCH           tagging and extraction on small-model sub-agents, clustering on mid-model
                          sub-agents, all in disjoint batches (one output file each, merge, dedupe);
                          deterministic filters in plain code; compress raw dumps BEFORE synthesis
7.  SYNTHESIS             /market-evidence synthesize: clusters, counts, opportunity scores (strongest
                          model); then campaign synthesis, judgment, offer-angle development
8.  GAP-FILL / VERIFY     quote spot-checks, targeted /deep-research or WebSearch/WebFetch on the PARTIAL
                          packet's named gaps, plus a differentiated Claude sub-agent critic (NOT a
                          duplicate broad pass)
9.  VALIDATION GATE       the Research QA gate: evidence_ledger.mjs stats + the judged checks;
                          PASS / DEEPEN / HOLD
10. CLEAN RESEARCH PACKET conclusions + evidence IDs only; never raw dumps
11. FINAL COPY            native Claude Code session (a clean-packet sub-agent is fine)
12. COPY QA               outreach-copy-framework for the initial written cold touch -> spam-word-checker
                          -> cold-email-copy-best-practices -> rule checklist -> research trace
```

The Research Routing HARD RULE (above) governs the research stages (1, 2, 5, and 8). Stage 1 is always the harness, or its declared fan-out when the harness is unavailable; Stages 2 and 8 fill only the gaps that primary flagged. Every stage runs inside Claude Code.

### Stage 0: Research Brief (assembled, not interviewed)

Routing depends on intent, so every research pass opens with a brief. In this flow the intent is already locked upstream, so do NOT re-interview. **ASSEMBLE** the brief from existing artifacts, starting with what research already exists for this client (the `research_artifacts:` block in `client-profile.yaml`, the `_research/` folder, and any older research folders), and ask the operator only for fields no artifact supplies (usually just freshness and confidence bar). Re-asking a locked decision violates `/clarification-first` and `/autonomous-execution-policy`.

| Brief field | Source |
|---|---|
| research_goal / decision supported | the calling skill (offer discovery, ICP pain, campaign slice, target research) |
| what is already known | `research_artifacts:`, `_research/pain-clusters.md`, older research folders |
| market / ICP hypothesis | `client-profile.yaml` |
| output needed | the calling skill |
| source types needed + VOC required? | the calling skill / brief |
| data points needed | `data-point-catalog.md` (when `/tam-build` or `/campaign-strategy` is the caller) |
| freshness required | ask if unknown |
| confidence required | ask if unknown |
| known assumptions to verify + open questions | derived from the locked ICP/offer; ask if unknown |
| `pass_depth` | `deep` (market / ICP-pain / VOC / offer) or `per-account-light` (per-row TAM enrichment) |

`pass_depth` is a property of the brief, **defined here once**. **There is no research `tier`** (the model tiers above are about which Claude model a sub-agent runs on, not about research depth): the research path is premium-by-default and non-redundant (below). Other skills point to this definition; they do not need new `run_state` fields for it. The source registry and the Research QA gate fire on `deep` passes only; `/tam-build` runs `per-account-light`, keeping only `signal_source_url`, `signal_date` and provenance per row.

### Premium-by-Default, Non-Redundant Routing

There is ONE active research path. "Premium-by-default" means the full `/deep-research` harness is always the primary, never a shallow inline answer. It does NOT mean wasteful: the lever that keeps a run lean is **non-redundancy**. Every extra pass costs session time and context even though it is not metered API spend, so each pass runs only on what the others did not cover.

- **Claude native `/deep-research` is the primary research engine** (or, when the harness is unavailable, its declared sub-agent fan-out) and runs the broad pass FIRST. Because it fans out into multiple sub-agents, one invocation covers ALL the categories the brief needs at once (market scan, cited source discovery, competitor discovery, initial ICP hypotheses, trend scan, discussion/review/forum URL discovery), fetches and reads the real sources, and adversarially verifies each claim against them before synthesizing a cited report. Give it the assembled brief and let it run every category in parallel rather than firing one narrow query at a time. It returns cited claims, source URLs, and **an explicit gap list** (thin areas, unanswered questions, low-confidence or out-of-scope items).
- **Gap passes fill gaps; they never repeat the broad pass.** After `/deep-research` (plus extraction and bulk crunch) produce the report and a gap list, route each gap to the Claude-native tool that fits it:

  | Gap in the primary pass | Route to | Why |
  |---|---|---|
  | A thin sub-topic that just needs one more grounded look | A targeted WebSearch/WebFetch pass | a fast cited pass on a single narrow question, far lighter than re-running the harness |
  | Deep technical / niche / code / standards / primary-doc reading | A second, narrowly scoped `/deep-research` run on that gap question | its sub-agents read and cross-check the primary docs a broad pass only summarizes |
  | Multi-step reasoning across sources: the "why," not just the "what" | Claude Code synthesis over the sources already fetched, or the same narrow `/deep-research` run | reason across the evidence in hand before fetching more |
  | What a person said on X / LinkedIn right now (live social signal) | WebSearch where it returns public posts; LinkedIn engagers from the intent-signals data tool; otherwise log the gap | the live X read no longer exists (no-AI-API rule) |
  | A single highest-value question that needs an independent second opinion | A differentiated Claude sub-agent critic (fresh context, adversarial brief), plus the advisor reviewer when available (1/client) | a genuinely independent second pass on the one call that matters, without another model family |

  Each returns ONLY the delta for its gap (new evidence, corrected or over-claimed conclusions, contradictions, counterexamples, source-quality issues, what is still missing). None rewrites the deep-research report unless explicitly asked. Record every pass that ran in `ai_research_provider`.
- **Link-generation / scale mode (context too big, or too many references to read directly).** Do NOT pull full pages into the orchestrating session. Instead **`/deep-research` plus WebSearch EMIT ranked candidate URLs only** into the Source Registry (they decide *what is worth reading*); **small-model Claude sub-agents (`model: "haiku"`), fanned out over disjoint URL batches, WebFetch the chosen URLs** and each writes evidence rows or a tight, focus-scoped digest to its own output file; the rows go into the evidence ledger through `evidence_ledger.mjs ingest`, and the digests are merged and de-duplicated into one evidence packet; **Claude Code** synthesizes from the ledger and the digests only. The session picks sources and reasons; the sub-agents fetch and compress. That keeps context bounded.
- **Pinpoint escalation:** the sub-agent critic above, **1/client**, only for the single highest-value question (high-ticket decision, conflicting-evidence ICP, market-entry, offer-strategy risk, final red-team).

**Anti-waste caps (run discipline, not spend gates):**

- Claude native `/deep-research` does the broad research first; gap passes take only the gap list, never repeat the broad prompt.
- The critic and synthesis steps get the packet plus specific gap questions only (or, in scale mode, sub-agent digests), never raw page dumps.
- Sub-agents compress bulk evidence before any synthesis or critique pass sees it.
- Max `/deep-research` primary runs per client: **1-2** (it fans out internally, so one run is many parallel category searches; a second run only for a genuinely distinct campaign slice). Max targeted WebSearch/WebFetch gap passes per client: **1-3**. Max narrow gap `/deep-research` runs per client: **1-3**. Max pinpoint critic runs: **1**/client. Max deepen loops from the Research QA gate: **2**. Raise only when the operator asks.
- If the primary pass already has strong cited evidence for a claim, the gap passes **audit, they do not redo**.
- Sample before scaling VOC: 20-30 quotes first; expand to 100-300 only if patterns are strong; stop if weak.

### Stage 3: Source Registry

After discovery, do NOT read everything immediately. First record every candidate URL in a registry table in the run folder (`_research/runs/<run>/sources.md`) so each one is read once. This is also an effort lever: dedupe and relevance-score before reading.

| Field | Meaning |
|---|---|
| `source_url` | the discovered URL |
| `source_type` | reddit / review_site / forum / news / company_site / job_board / social / docs |
| `discovered_by` | deep-research primary / sub-agent fan-out / websearch gap pass / operator paste / manual |
| `query_used` | the query that surfaced it |
| `date_found` | when discovery ran |
| `published_date` | when the source itself was published (flag if unknown) |
| `relevance_score` | quick 0-2 triage before reading |
| `crawl_status` | pending / crawled / failed / skipped (crawled = read with WebFetch or the browser pane, or pasted) |
| `reason_this_source_matters` | one line: why this source is worth reading for this brief |

The registry itself is a table the session keeps; it answers "what did we find, and what did we read." Once a page is read, what it yields goes into the evidence ledger (`_research/evidence.csv`) through `outbound/scripts/research/evidence_ledger.mjs`, which validates and dedupes each row and assigns the stable `evidence_id` every downstream claim cites. That is how "where did this claim come from" is always answerable. Skip the registry on `pass_depth = per-account-light`: a per-row TAM pass keeps only `signal_source_url` plus `signal_date`.

### Stage 5: VOC / Raw-Evidence Layer

A *summary* of buyer pain is not buyer pain. It is one pass's compression of a sample you never saw. For ICP, offer, and pain work, mine the raw discussion and keep exact quotes.

Pipeline (Claude-native tools only):

1. **Search** (the primary pass or the built-in WebSearch): find the EXACT discussion URLs (review-site pages such as Capterra and Trustpilot, Hacker News through its free Algolia search API, YouTube comment pages, niche forums). Use domain filters and `site:` operators. This hop returns URLs only; it must NOT summarize the discussion.
2. **Read** (the built-in WebFetch; the built-in browser pane for a JavaScript page WebFetch cannot render): fetch each URL to clean text. A page nobody could read is logged as unread in the registry, never paraphrased from its search snippet.
3. **Social:** the live X read no longer exists. Use WebSearch where it returns public posts, and log the gap in provenance. LinkedIn engagers and post signals come from the intent-signals data tool, not from an AI.
4. Every usable item becomes an evidence-ledger row with its `evidence_type`, tier and `source_class` (the full lists are in `market-evidence-standard.md` sections 2 and 3). Small-model sub-agents (`model: "haiku"`) write the rows to their own batch files, and `outbound/scripts/research/evidence_ledger.mjs ingest` validates, dedupes and assigns the IDs. Never flatten the `source_class` distinction; the four classes that matter most here:

| source_class | What it is | Weight |
|---|---|---|
| `buyer_quote` | a real user / buyer describing a problem in their words (operator-pasted Reddit text counts here) | the gold, counts toward pain |
| `competitor_claim` | a competitor's marketing / landing copy | positioning context, NOT pain |
| `analyst_claim` | a report / analyst / press framing | context, cite carefully |
| `news` | event / announcement | timing signal only |

A competitor landing page and a Reddit complaint must never be scored the same. One is marketing; the other is pain.

**Reddit and G2 cannot be read by the harness** (tested 2026-09-22: its web fetch, web search and in-app browser all refuse reddit.com, and G2 returns HTTP 403; Trustpilot, Capterra and the Hacker News search API were readable). **The only Reddit route is operator paste**: someone reads the threads in their own browser and pastes the text plus the thread URL into the session. Pasted text counts as `buyer_quote`, with the thread URL as its `source_url`. There is no Reddit API, scraper, or third-party AI route. `/offer-intelligence` Vector 3 carries the same rule, and G2 pages count only when pasted the same way. If nothing was pasted, log Reddit (and G2) as unread. Never infer Reddit coverage from a search step that names it.

The ledger row carries the exact quote, the source, its date, the persona as stated, and the situation, pain, trigger, workaround, consequence, desired outcome and objection when the source says them (column list: `market-evidence-standard.md` section 3). Nobody types rows into `evidence.csv` by hand. Major claims need 3 or more independent sightings where possible (the counting rules are in the standard's section 4); keep counterexamples; do not compress raw evidence into vague summaries too early; never let a model invent buyer language.

**Compliance:** collected review, forum, and discussion text is for **research and citation only**, not redistribution as a dataset or product. Public pages only; never log in to a platform to read it.

### Stage 9: Validation Gate (the Research QA gate)

The validation gate is the **Research QA gate**, run by `/market-evidence synthesize` and defined in `market-evidence-standard.md` section 7. It has two halves:

- **Mechanical checks** come from one free local run of `node outbound/scripts/research/evidence_ledger.mjs stats` (no network, no AI): every cited ID resolves to a real ledger row with a URL or raw capture, recency, independence (enough sightings from more than one site), no single loud source, no hypothesis or competitor claim cited as evidence, ICP match, and no double counting of syndicated quotes.
- **Judged checks** are run against the files: a quote-fidelity spot-check (a small-model sub-agent re-reads a few random quotes against their sources), traceability of every summary line to cluster IDs, commercial meaning, reachability, the client's ability to solve the pain, honest coverage (platforms read and unread), and honest prevalence language.

The verdict is **PASS** (offers may be built), **DEEPEN** (the gaps are fixable with more research: a targeted Stage 2 pass on the named gaps only, then the gate runs again, at most two loops; a platform unread by policy, such as Reddit or G2 with nothing pasted, is a stated coverage gap, never a reason to deepen), or **HOLD** (more public research cannot fix it: under `review_gates` the operator decides at the offer-step review, and under `auto_execute` the clusters go forward labelled low confidence with the reasons flagged; handling per `market-evidence-standard.md` section 7). This is the deterministic validator this file used to list as pending; it now exists as `evidence_ledger.mjs` plus the gate. The same principles still hold: a claim with no evidence is a hypothesis, not a fact; counterexamples are recorded, never silently dropped; competitor marketing is kept apart from buyer pain.

This is where the **gap-fill / red-team pass** lands (Stage 8). The `/deep-research` primary already adversarially verifies its own claims against sources, so this stage is a targeted top-up, not a second broad verification: a narrow `/deep-research` run digs the thin and technical gaps, a WebSearch/WebFetch cross-check tests any single claim still shaky after the primary, and a **differentiated Claude sub-agent critic** (plus the advisor reviewer when available) red-teams the partial packet. Each takes the partial packet plus specific gap questions and returns ONLY the delta: unsupported claims, contradictions, missing counterexamples, source-quality issues, strategic risks, next questions, verdict. None re-runs the broad research or rewrites the report. Record every pass that ran in `validation_provider` (for example the Research QA gate run, the critic sub-agents) and the findings in `validation_notes`.

**Status (honest):** only half of the gate is mechanical. The `stats` checks are computed by the script and can be called mechanical. The judged checks are Claude's judgment against the files, plus the delta critique pass above when the decision warrants it. Do not describe the whole gate as "automatic"; that would overclaim the judged half.

## Compact Capability-Fit Map

Every capability below is Claude Code native, except headshot image generation (the one approved exception).

| Need | Claude Code capability | Role in stack | Weak move |
|---|---|---|---|
| PRIMARY broad research: market / competitor / ICP-pain / source discovery across all needed categories, cited and self-verified | The `/deep-research` skill (`anthropic-skills:deep-research`, runtime, not a purchased slot), or its declared sub-agent fan-out when the harness is unavailable | **Primary research engine**, always | Firing one narrow inline WebSearch and calling it the primary pass, instead of running the multi-agent harness (or the fan-out) over the whole brief |
| One more grounded look at ONE thin sub-topic the primary left shallow | A targeted WebSearch/WebFetch pass | Gap-fill helper, not the primary | Re-running a pass across the whole brief the primary already covered, which is duplicate effort |
| Real-time X / social human-signal read (founder posts, complaints, buyer language) | WebSearch where it returns public posts; LinkedIn engagers from the intent-signals data tool; otherwise a logged gap | Social timing and human hook | Treating a like or post as buying intent, or claiming a live X read that no longer exists |
| Mining real buyer voice (review sites, HN, YouTube, forums) into exact quotes | WebSearch for URLs, then WebFetch (or the browser pane) to read, then small-model sub-agents write evidence-ledger rows; Reddit and G2 by operator paste only | VOC / raw-evidence layer | Letting the search layer summarize the discussion instead of reading the exact quotes; implying Reddit was read when nothing was pasted |
| Filling the gaps the primary pass left thin / technical / niche / multi-step | A second, narrowly scoped `/deep-research` run on the gap question | Non-redundant gap-fill | Asking it the same broad question the primary already answered |
| Corpus too big / too many references to read directly | `/deep-research` + WebSearch EMIT ranked URLs, then small-model sub-agents WebFetch disjoint batches and write ledger rows or digests, then merge and dedupe, then Claude Code synthesizes | Link-generation / scale mode | Pulling full raw pages into the orchestrating session, which blows context |
| Pinpoint high-value reasoning (conflicting-evidence ICP, market-entry, offer risk, final red-team) | A differentiated Claude sub-agent critic plus the advisor reviewer when available, 1/client | Independent second opinion | Using it for broad duplicate research, or reaching for another model family |
| Critic / second-opinion / judge panels (`/consultant`, `/roast`) | Differentiated Claude sub-agent personas plus the advisor reviewer when available; web fact-checks via WebSearch/WebFetch | Critique | Calling a model from another family for "diversity" |
| Sender persona headshots | `ai.image_generation`: OpenAI, headshots only, asked for at infrastructure setup (the approved exception) | Image generation | Using the exception for any other image, or asking for its key before infrastructure setup |
| Extraction, tagging, normalization at volume; pre-compressing raw page and VOC dumps before synthesis | Small-model Claude sub-agents (`model: "haiku"`) fanned out per `/personalization-subagent-pattern` (disjoint batches, one output file each, post-merge dedupe); deterministic filters in plain code | Bulk crunch and dump pre-compression | One agent reading the whole corpus, overlapping batches that return duplicate or convergent output, or pushing a raw 500-row dump through the main session |
| Clustering and comparison | The session, or mid-model sub-agents (`model: "sonnet"`) for large or multi-segment sets | Analysis | Clustering by the client's features instead of the buyer's problem |
| The same structured question across a whole domain list | Mid-model sub-agents with WebSearch/WebFetch, results pushed into the list workbench by webhook | Per-company research at list scale | Looping the primary research pass per row, or any list-workbench AI column |
| Counting, dedup and the mechanical research checks | `outbound/scripts/research/evidence_ledger.mjs` (`ingest`, `stats`; plain code, no AI) | Evidence bookkeeping | Counting sightings by eye, or typing ledger rows by hand |
| Is the research good enough to build offers? | `/market-evidence synthesize` and its Research QA gate (PASS / DEEPEN / HOLD) | Research sufficiency verdict | Building offers on an unchecked summary |
| Final high-quality cold email and phone scripts from a clean packet | The native Claude Code session (a clean-packet sub-agent is fine) | Final copy | Writing copy inside a long, messy execution context instead of from the clean packet |
| Raw URL to clean text | WebFetch; the built-in browser pane for a JavaScript page such as an ad library (read-only, never logged in) | Extraction | Answering from memory about a page instead of fetching it, or paraphrasing a search snippet in place of the page |
| Backfill a single missing MUST-HAVE field a source left blank (for example a personal `linkedin_url`, `company_linkedin`) | The configured contact-data tool first, then **WebSearch (returns the REAL URL), then Claude confirms the result matches the entity by name plus company/domain** | Verified field backfill | Emitting a URL or value from memory (a hallucinated `linkedin.com/in/...`), or accepting a candidate without confirming name plus company. A wrong value is worse than a blank |

WebSearch is the raw discovery and URL feed that sits in front of research and page reads. See `lead-list-tech-stack-research.md`. It is a harness tool, not a purchased slot.

**For data tools, nothing is "in" or "out" of the stack until the contract says so.** For AI, the rule is closed: no third-party AI tool is added to fill a retired slot, whatever a worked example, a catalogue, or a connected MCP server suggests.

## Clean Research Packet

The final copy step must receive a **clean research packet**, not a messy long-running execution context, whether it runs in the session or in a clean-packet sub-agent. The packet is conclusions plus evidence IDs, never raw page dumps, tool logs, or scratch work.

```
buyer_persona          # who, seniority, real buyer title
account_context        # what the company is and does
business_context       # initiative, expansion, funding, hiring: why it matters
verified_signal        # the one proven reason-now, if any
signal_source_url      # working evidence URL
signal_date            # when the signal is from
signal_strength        # strong / medium / weak (do not overclaim weak)
cluster_ids            # the pain clusters this message rests on (_research/pain-clusters.md)
pain_point             # specific, not generic, in the buyer's words
buyer_language         # verbatim Language-bank phrases, each with its evidence ID
current_workaround     # what they do today instead, from the cluster
reason_for_fit         # why this buyer, this company
reason_now             # why this is timely
proof_point            # mechanism or proof we can honestly cite
offer_angle            # direction only (the offer arm's pain angle)
likely_objection       # from the cluster's objections or the market feedback clusters
constraints            # tone, banned words, client copy rules
ai_research_provider   # provenance: claude-deep-research | claude-subagent-fanout, plus any claude-websearch gap passes
ai_analysis_provider   # provenance: claude-subagents (with the model tier) / Claude Code
validation_provider    # the Research QA gate run, the sub-agent critic, the advisor
validation_notes       # the delta and the verdict
```

**Deep-pass evidence fields** (`evidence_id`s, `quote_count`, `counterexample_count`, `confidence_score`, `buying_trigger`) are added only on `pass_depth = deep` packets (VOC, ICP-pain, offer, market). They come from the evidence ledger and `evidence_ledger.mjs stats`, never typed by hand, and they are NOT appended to `tam.csv` canonical columns; a `per-account-light` TAM row carries only `signal_source_url`, `signal_date`, and the `ai_*_provider` provenance.

Rule: if a fact in the packet has no `signal_source_url` (or `evidence_id`), it is a hypothesis, not evidence. Copy must not state a hypothesis as a fact. The packet carries the insight, never the tool name. See the prospect-facing copy rules in `campaign-copywriting.md` and `cold-email-copy-best-practices.md`.

### Quick decision tree

- First: assemble the brief (what decision, output, freshness, confidence), starting from the research that already exists. There is ONE path, premium-by-default and non-redundant. No research tier to pick, and no provider to pick.
- Broad market / source / competitor / ICP discovery? Run **Claude native `/deep-research`** (`anthropic-skills:deep-research`) as the primary pass: hand it the whole brief and let its sub-agents cover every category in parallel with adversarial verification. If the harness is unavailable, run the **declared sub-agent fan-out** and log `claude-subagent-fanout`. Targeted WebSearch/WebFetch passes are helpers, not the primary brain.
- Do I need REAL buyer language and pain quotes (not a summary of them)? Use **WebSearch** to find the exact review and forum URLs, then **WebFetch** (or the browser pane for a JavaScript page) to read them, write **evidence-ledger rows**, and ask the operator to paste any Reddit threads that matter. Capture exact quotes, and never let the search layer pre-summarize.
- Is it about what a person said on X / LinkedIn / Reddit right now? X: WebSearch where it returns public posts, otherwise log the gap. LinkedIn: the intent-signals data tool. Reddit: operator paste only.
- Do I just need a URL turned into text? Use **WebFetch**; the **built-in browser pane** when the page is a JavaScript app (read-only, desktop app only); otherwise log it as unread.
- Do I need the same structured answer for every company on a list? **Mid-model sub-agents** (`model: "sonnet"`) with WebSearch/WebFetch, results pushed into the list workbench by webhook.
- Do I have a large corpus to tag, extract or compress (500+ rows)? Fan it out across **small-model sub-agents** (`model: "haiku"`) in disjoint batches per `/personalization-subagent-pattern`, with deterministic filters in plain code first.
- Is the research good enough to build offers? Run **`/market-evidence synthesize`** and its Research QA gate.
- Did the primary pass come back thin, too technical, or shaky on a sub-topic? Fill ONLY that gap with a **narrow `/deep-research` run** (deep, technical, multi-step) or a **targeted WebSearch/WebFetch cross-check** on one narrow claim. Use the **sub-agent critic** only for the one highest-value question. Never a duplicate broad pass.
- Corpus too big or too many references to read directly? Use **scale mode**: `/deep-research` and WebSearch EMIT ranked URLs, small-model sub-agents WebFetch disjoint batches and write ledger rows or digests, the outputs are merged and de-duplicated, and **Claude Code** synthesizes.
- Do I need a second opinion or a critic panel? Use **differentiated Claude sub-agent personas** plus the advisor reviewer when available. No other model family.
- Am I writing the actual email or phone script? Write it in the **native Claude Code session** from a clean research packet (a clean-packet sub-agent is fine). See the Copy Generation HARD RULE.
- Do I need a sender headshot? Use **`ai.image_generation`** through `/mailbox-profile-generator`, and only then ask for its key. Nothing else generates images.

## Credentials

No research, crunch, critique, or copy step needs an AI key. The only AI credential anywhere in the flow is the headshot key (OpenAI, headshots only, asked for at infrastructure setup), and it is never requested or flagged as missing before that point. Third-party AI keys and Claude API keys are retired: they do not belong in `scripts/.env.example` or `scripts/credential-registry.json`, and no skill asks for them.

Credential **names** for the data slots live in `stack-contract.yaml` and are mirrored machine-readably into `scripts/credential-registry.json`. Real values live only in `scripts/.env`, which is gitignored; `scripts/.env.example` carries placeholders and is regenerated by `/stack-setup` to match the chosen stack.

**This file asserts nothing about which keys are present.** Presence and shape are `/preflight-credentials`' job; balance and spend are `/api-cost-governance`' job.

## Executable Layer

Everything in this pipeline runs today, with no AI key and no activated pack:

- **Primary research** is a **native skill invocation, not a router call and not an API call**: invoke the plugin skill `anthropic-skills:deep-research` through the Skill tool inside this Claude Code session and hand it the assembled brief so its sub-agents cover every category in parallel. Fallback: the declared flat fan-out of 4 to 8 research sub-agents, logged as `claude-subagent-fanout`.
- **Gap passes and page reads** are the built-in WebSearch and WebFetch tools, plus the built-in browser pane (`mcp__Claude_Browser__*`: `navigate`, then `get_page_text`) for a JavaScript page, read-only, when the session runs in the desktop app. No key.
- **Bulk crunch and per-row research** run as Task sub-agents on the `model` tier from [Model tiers for sub-agents](#model-tiers-for-sub-agents), per `/personalization-subagent-pattern`: partition the rows into disjoint batches (10 to 20 items per agent for reasoning-heavy rows, larger for light classification), give each agent its own output file, merge by a stable id, then de-duplicate and check for convergent output. Per-row web research at TAM scale runs the same way, with each sub-agent using WebSearch/WebFetch, at sample scale first. Do **not** also run a broad research pass over the same rows; that is the duplicate-pass waste this doctrine forbids.
- **Critic panels** are sub-agents given differentiated personas and adversarial briefs, plus the advisor reviewer when the session has one.
- **Evidence ledger:** `outbound/scripts/research/evidence_ledger.mjs`. `ingest` validates sub-agent batch files, dedupes, assigns evidence IDs and appends to `_research/evidence.csv` (the only way rows get in); `stats` computes per-cluster counts and the mechanical Research QA checks. Plain code: no network, no AI, no key.
- **Research QA gate:** `/market-evidence synthesize`, per `market-evidence-standard.md` section 7 (the `stats` half plus the judged half; PASS / DEEPEN / HOLD).
- **Research-routing audit:** `scripts/research/research_routing_check.mjs` checks that each research-skill run logged a primary in the ledger, counting both `claude-deep-research` and `claude-subagent-fanout` as a primary.
- **Benchmarks:** `outbound/evals/run_eval.mjs` (`prepare`, then the session's sub-agent fan-out, then `grade`), per [Model Benchmarks](#model-benchmarks-claude-native-2026-09-24). Plain code, no model call.
- **Headshots:** `scripts/generate_inbox_profiles.py`, run by `/mailbox-profile-generator` (the one approved AI exception).

The scripts that used to call AI provider APIs were archived on 2026-09-22 (see `outbound/_archive/no-ai-api-2026-09-22/MANIFEST.md`). Nothing in this pipeline calls them, and none is to be restored as a research, crunch, or copy path.

**The registry and the gate are no longer pending.** The source registry is a table in the run folder (Stage 3); the stable IDs, the counting and the mechanical checks are `evidence_ledger.mjs`; the verdict is the Research QA gate (Stage 9).

## Fallback Rules

Never emit a call to a third-party AI provider or a keyed Claude API call, and never substitute one when a Claude-native step struggles. Degrade inside Claude Code and record what actually ran.

- **The `/deep-research` harness is unavailable, errors, or is rate-limited.** Run the declared flat sub-agent fan-out (4 to 8 research sub-agents, one category each, same brief) and log it as `claude-subagent-fanout` in `ai_research_provider`, the ledger line and the activity log. No operator OK is needed. This replaces the 2026-09-22 rule (retry once, then stop for a fresh operator OK before running on WebSearch/WebFetch alone). Never present a bare inline answer as the primary pass.
- **A gap pass comes back empty or thin.** Record the gap as open in `validation_notes` and mark the affected claims low-confidence. Do not escalate to another provider.
- **WebFetch is blocked on a site.** Try the built-in browser pane when the session has it (read-only, never logged in). Still blocked, or no pane: skip the source and log it as unread in the registry. Never substitute a search snippet for the page. Reddit and G2: operator paste only; if nothing was pasted, log them as unread.
- **A live social read is requested.** It is not available. Use WebSearch where it returns public posts and log the gap.
- **A sub-agent batch fails or returns malformed output.** Re-run that batch alone on the same partition. Never collapse to one agent reading everything, and never route the batch to a paid model.
- **The `ai.image_generation` key is absent when the headshot step runs.** Ask for it at that point, which is the only moment the rule allows. If the operator declines, skip image generation and say so. Do not substitute a text model for an image step.
- **Provenance stays honest.** Log what actually ran in `ai_research_provider` / `ai_analysis_provider` / `ai_copy_provider` / `validation_provider`.
- **The whole pipeline runs on Claude Code alone.** That is the design, not a degraded mode. The one thing that never counts as the primary research pass is a bare inline WebSearch/WebFetch answer; run the full `/deep-research` fan-out harness, or its declared sub-agent fan-out, instead.

## Cost-Control Rules

- **One active path: premium-by-default, non-redundant.** Do not run every tool on the same question; that is a buffet, not a pipeline.
- **Claude Code usage is not a per-call metered API spend in these skills.** The session, its sub-agents, `/deep-research`, and WebSearch/WebFetch get no token preview and no spend row in the ledger. The only AI spend row is the headshot image call. `/api-cost-governance` still gates every paid data-vendor call and that headshot call.
- **There is no AI research budget.** The old per-provider research cap (`run_state.research_budget_usd_per_provider`) was removed on 2026-09-22 because no AI provider is left for it to cap. No skill writes, reads or blocks on it; ignore it in older profiles. Research is bounded by the run caps below, not by dollars.
- **Cheapest tier that does the job.** Small-model sub-agents for mechanical work, mid-model for judgment on one item and for large clustering jobs, the session for synthesis, offers, verdicts and copy ([Model tiers for sub-agents](#model-tiers-for-sub-agents)). A job moves down a tier only after the 20-row agreement check.
- **Gap passes never duplicate the primary broad pass.** The primary is `/deep-research` (1-2 runs/client, because it fans out internally). Gap passes run only on the gaps it flagged: 1-3 targeted WebSearch/WebFetch passes/client, 1-3 narrow gap `/deep-research` runs/client, 1 pinpoint critic/client. These caps bound session time and context. If the primary already has strong cited evidence for a claim, the gap passes audit, they do not redo.
- **Read only after the Source Registry dedupes and relevance-scores URLs** (deep passes). Duplicate reads are pure waste.
- **Use WebSearch before a `/deep-research` run when you only need URLs.**
- **Compress in sub-agents before synthesis.** Never pull raw page or VOC dumps straight into the orchestrating session by default; have sub-agents digest them in disjoint batches first (especially 500+ row batches). Tiny interactive corpora (a couple of pages) can be handled inline.
- **Scale mode beats brute force when references are many or context is huge:** `/deep-research` and WebSearch EMIT ranked candidate URLs only; small-model sub-agents WebFetch and write ledger rows or digests; Claude Code synthesizes from the ledger and the merged digests.
- **Copy QA defaults to rule-based:** `outreach-copy-framework.md` for the initial written cold touch, plus `spam-word-checker.md`, `cold-email-copy-best-practices.md`, a rule checklist, and the research trace. Add a sub-agent critic ONLY for high-ticket, risky-claim, strategic, or client-facing copy, never as the default.
- **Final copy GENERATION happens in the native session**, as do synthesis, scoring, JSON subroutines, and copy QA.
- Do not run the **primary `/deep-research` pass per row.** Run one account-level (or slice-level) research pass and reuse it across every contact at that account.
- **Sample before scaling VOC:** 20-30 quotes first; expand only if patterns are strong; stop if weak.
- Cache the clean research packet per company so a re-run does not redo research.
- **Cache and reuse research.** Existing research is read first (Stage 0); a refresh fills gaps and stale areas only, and older research folders are referenced, never moved.
- If an AI step does not improve relevance, quality, speed, scale, or QA, skip it.

## Don't Add AI Just Because It Exists

- Static, template, or already-decided copy needs no AI step.
- One tool per job. Stacking passes on one step is time and context, not quality.
- **Task-tool sub-agents are the default for per-lead work, bulk crunch, AND clean-context final copy.** `/personalization-subagent-pattern` and `/icp-prompt-builder` run on Claude Code Task sub-agents by design; final copy runs the same way (a sub-agent fed only the clean packet) to get context hygiene. At 1,000+ leads, run more sub-agent batches (in sequential waves if needed); there is no raw-provider path.
- Provenance columns must reflect reality. If sub-agents ran the crunch, `ai_analysis_provider` says `claude-subagents` (and which tier, for example `claude-subagents (haiku)`), not a vague "Claude".
- Copy and QA guardrails are never bypassed. `outreach-copy-framework.md` controls every initial written cold touch; `spam-word-checker.md` and `cold-email-copy-best-practices.md` remain required regardless of who drafted.

## Where This Can Fail

- A web-grounded pass still hallucinates if you skip the evidence URL. Keep `signal_source_url` and `evidence_id`.
- Sub-agent crunch on a bad corpus produces confident garbage. Garbage-in still applies.
- **Treating a competitor landing page like a buyer complaint.** Enforce `source_class`: marketing copy is positioning context, not pain. Flattening them is how bad ICP thinking starts.
- **Prose that reads as if a script ran.** Only the `evidence_ledger.mjs stats` half of the Research QA gate is mechanical; the judged checks and the source registry are Claude's work against the files. Calling the whole gate "automatic" overclaims, so keep the status honest.
- **A smaller model quietly losing quality.** Tier moves need the 20-row agreement check; re-check when a job's inputs change.
- **Calling a declared gap pass a "fallback," or a fallback a primary.** A targeted WebSearch/WebFetch pass or a narrow `/deep-research` run that fills a NAMED gap in the primary is a logged gap pass (Stages 2 and 8), not a silent fallback. The declared sub-agent fan-out that stands in for an unavailable harness is logged as `claude-subagent-fanout`, never as `claude-deep-research`. Quietly swapping a bare WebSearch in *for* the missing primary IS the violation. Log each run for what it was.
- **Claiming coverage the harness cannot reach.** Reddit and G2 are unreadable by WebFetch, WebSearch, and the browser pane, and the live X read is gone. Log them as unread gaps rather than implying a search step covered them.
- **Reaching for another model family.** A second opinion comes from a differentiated Claude sub-agent plus the advisor reviewer, never another provider. If a skill, an example, or a connected MCP server suggests one, it is retired by the no-AI-API rule.
- **Fan-out without partitioning.** Overlapping batches produce duplicate or convergent output. Partition first, give each agent its own output file, and de-duplicate after the merge.
- **Assuming a data tool exists because a file names it.** Check `stack-contract.yaml`, and check that the slot's status is `live` rather than `chosen`, before you promise the operator a step is automated.
- Social signal is timing and language, not proof of fit. Pair it with account context.
- Routing adds value only when the step is genuinely research, crunch, social, extraction, VOC, validation, or copy heavy. For pure orchestration, file edits, and local execution, Claude Code works directly and no routing is needed.

## Capability-to-Stage Quick Reference

- PRIMARY broad research (all categories, fan-out, adversarial verify, cited synthesis): **Claude native `/deep-research` skill** (`anthropic-skills:deep-research`), always; its declared sub-agent fan-out (`claude-subagent-fanout`) when the harness is unavailable
- One more grounded look at ONE thin sub-topic: a targeted WebSearch/WebFetch pass (helper, not the primary)
- Social and human hook: WebSearch where it returns public posts; LinkedIn engagers from the intent-signals data tool; the live X read no longer exists
- Buyer-voice mining (exact pain quotes): WebSearch for URLs, then WebFetch to read, then evidence-ledger rows; Reddit and G2 by operator paste only
- Raw page extraction: WebFetch; one JavaScript app page (an ad library): the built-in browser pane, read-only; unreadable pages logged as unread, never a snippet
- Extraction, tagging, and pre-compressing raw page/VOC dumps: small-model Claude sub-agents fanned out per `/personalization-subagent-pattern`; deterministic filters in plain code
- Clustering and comparison: the session, or mid-model sub-agents for large sets
- Counting, dedup, mechanical research QA: `outbound/scripts/research/evidence_ledger.mjs` (no AI)
- Deep technical or multi-step gap-fill on the primary pass: a narrow `/deep-research` run on the gap question, never a duplicate broad pass
- Corpus too big or too many references: scale mode. `/deep-research` and WebSearch emit URLs, small-model sub-agents WebFetch disjoint batches and write ledger rows or digests, the outputs are merged and de-duplicated, Claude Code synthesizes
- Research sufficiency verdict (packet validation): `/market-evidence synthesize` and its Research QA gate (`market-evidence-standard.md` section 7), plus a targeted gap pass or sub-agent critic when warranted
- Critic / second-opinion panels (`/consultant`, `/roast`): differentiated Claude sub-agent personas plus the advisor reviewer when available
- Sender headshots: `ai.image_generation` (the approved exception, headshots only, key asked for at infrastructure setup)
- All inline reasoning, JSON, classification, scoring, synthesis: Claude Code
- Final email and phone copy: the native Claude Code session (a clean-packet sub-agent is fine)
- Copy QA: outreach-copy-framework for the initial written cold touch, plus spam-word-checker, cold-email-copy-best-practices, the rule checklist, and the research trace (default); a sub-agent critic only for high-ticket or client-facing work
- Orchestration, file ops, routing: Claude Code (local)

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short, and record status, not raw output. Full protocol: `client-activity-log.md`.
