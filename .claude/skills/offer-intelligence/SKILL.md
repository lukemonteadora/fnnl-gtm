---
name: offer-intelligence
description: "Offer evidence in two modes. Discovery runs after /icp-onboarding and before the Aaron offer call: buyer pain, competitors and ads go into the evidence ledger and the brief. Under the Aaron flow default, a known market skips new research and an unfamiliar market gets one quick fanned-out pass (aaron-flow.md section 4); the full deep-research pass below runs only when Luke asks. Validation reads a live offer's results (Go, Iterate or Swap). It never proposes, ranks or drops an offer; Aaron's call does."
---

**From the former description:** Discovery runs first on the offer path and needs no list-side or data-side work beforehand; obtainability and the list are worked out later, after the offer locks. It opens by reading the research that already exists (it never redoes research), grounds the work in a 10 to 25 company research sample built from public pages, and follows Aaron Shepherd's three-input research method, leading with buyer pain: the client's own won and lost sales-call recordings, five-layer persona desire research, real public complaints (Reddit, review sites, forums, with an honest record of which platforms were actually read), competitor cards and offer saturation across 5 to 10 competitors, paid-ad angles from the Meta Ad Library and LinkedIn read in the built-in browser pane, and job postings, with every pain row mapped to the persona who feels it. Every piece of evidence becomes a tiered, sourced row in the client's evidence ledger (`market-evidence-standard.md`). `/market-evidence synthesize` then counts, clusters, scores and gates it (Research QA: PASS, DEEPEN with at most two targeted loops, or HOLD) before the Intersection step writes a named Candidate Generation Input block (persona, pain and competitor-form evidence rows citing cluster IDs) that the Aaron offer call reads instead of re-deriving pain. Validation mode weighs the replies the live offer earned. It never proposes, ranks or drops an offer.

# Offer Intelligence
## Canonical Profile Root

All profiles/<business-slug> paths in this skill resolve under:

```text
<outbound>/profiles
```

Here `<outbound>` is the root of this skill library - resolve it to wherever the library is currently checked out (local Documents, OneDrive, or a git worktree); never hardcode an absolute path. Do not create client profiles under a `profiles/` folder at your current working directory.

Cold email operators default to two failure modes: (1) copying whatever offer their competitors use, or (2) brainstorming in a vacuum with no market signal. This skill escapes both by collecting the evidence. It does not create offers: offer creation is decided only by a fresh `/ask-aaron` sub-agent reading Aaron's live Notion content bank (`aaron-lane.md`, Call 1), and this skill's brief is one of that call's inputs.

**In discovery mode**, it runs first on the offer path, immediately after `/icp-onboarding` and before the offer exists. It researches buyer pain and the market so that the Aaron offer call (recorded by `/lead-magnet-brainstorm` in recorder mode) decides from evidence, not from gut feel. The order of the whole chain is: buyer and pain, then the offer, then the list built to fit that offer, then the copy. Nothing in this mode waits on any list or data work.

**Discovery mode is the research phase, and it does two jobs in order (operator directive 2026-09-22).** First it **extends and clarifies what onboarding captured**: read what `/icp-onboarding` recorded, name what is thin, vague or missing (the buying function, the pain hypothesis, the competitors, the call library), and close those gaps from the client's site, the client, or the research itself. The intake ICP is a starting point, not a ceiling; the offer may later widen or narrow it. Then it **researches the vertical, the market and the ICP for real problems in the buyers' own words**: the client's won and lost sales calls first; then public opinion from the vertical on review sites, forums and public posts (mine demand: what people are talking about and the objections they raise), with Reddit read only from an operator paste and X or LinkedIn posts only where WebSearch returns them, each gap logged (Vector 3); then competitor offers and what competitors fund in paid ads (the Meta Ad Library and LinkedIn ads, read in the harness's built-in browser pane, with WebSearch only to find an advertiser's page). **Heavy competitor ad spend behind an offer is evidence of demand** (a house evidence rule), never a reason to close an offer form. In an unfamiliar market, Claude sub-agents do the research (the `/deep-research` fan-out plus WebSearch, WebFetch and the built-in browser pane in AI/API Routing, never another research provider). The output is a set of real, named problems with sources, which is the evidence the Aaron offer call reads. **Every piece of evidence is written as a row in the client's evidence ledger** (`_research/evidence.csv`, per `market-evidence-standard.md`), raw captures stay in the run folder, and the research does not hand off to offers until `/market-evidence synthesize` has counted, clustered, scored and checked it (the Research QA gate). The brief this skill writes is the synthesis on top of that ledger, never the only place the evidence lives.

**In validation mode**, it runs after an offer is live - evaluating whether the offer is strong, weak, or invisible due to saturation, and deciding whether to keep it or swap it.

## The saturation problem

Market evidence cuts both ways. If competitors are leading with "free audit" and have been for 18 months, that is not evidence that "free audit" works today. The ICP may have seen it 400 times and auto-delete it, and following the market into a saturated offer makes you the fifth cold email this week saying the same thing. It is also evidence that buyers care about the problem: heavy competitor ad spend behind an offer shows demand (a house evidence rule: real money behind something means people care about it).

So saturation is **evidence, reported by offer form with the gap competitors leave**. It never ranks, limits or closes an offer, and never overrides a higher-scoring alternative. The saturation count is handed to the Aaron offer call as an input: Aaron decides what is tested (`aaron-lane.md`). This skill describes each competitor's offer form in plain words (what the competitor hands the buyer) and counts how many competitors use the same form, with the denominator beside it.

## Offer Architecture gate (shared with copy)

Both modes here feed the three-question Offer Architecture gate that `/campaign-copywriting` runs before Email 1: (1) SQL vs MQL framing, (2) the easy-to-say-yes-to test, (3) a named risk reversal. Evaluate an existing offer against these as you research. In discovery mode, note in the evidence which buyer concerns bear on the risk reversal and the easy-yes test, as facts for the Aaron offer call; this skill does not steer which offers get built. In validation mode, a Go decision requires all three to hold; a missing risk reversal or a failed easy-yes test is an Iterate or Swap signal, not just a copy problem. Full gate: `/campaign-copywriting` Offer Architecture. What counts as a valid risk reversal for an offer is Aaron's call (Aaron's live notes, via `/ask-aaron`), not a house rule set here. In validation mode a Go also needs the Step 1 diagnostic order to come back clean.

## Material Decision Rule

When this skill reaches a material fork, name the realistic options, recommend the strongest path, and explain why the main alternatives are weaker before committing.

Ask before choices that affect spend beyond an approved budget, provider routing, source of truth, list quality, campaign direction, client-facing output, live systems, scraping or account risk, or legal/compliance risk. For low-risk reversible choices, state the recommendation and proceed.

**Research findings and offer directions are never filtered out of view (operator directive 2026-09-22).** Report every pain and market finding the evidence supports, with its evidence strength, so the Aaron offer call (recorded by `/lead-magnet-brainstorm` in recorder mode) sees all of it. A weak or saturated finding is labelled, not dropped. This skill never proposes, ranks or drops an offer; the only thing it never passes on is a finding that would be illegal or deceptive to send.

When asking the user, use the Claude Desktop native Interactive Inputs / Choice Prompts pattern from /clarification-first: recommended option first, short choices, and Custom answer last when a custom answer is plausible.

## Interaction Policy

Defers to `/autonomous-execution-policy`. Under `run_state.execution_mode = auto_execute` (the new-client default since 2026-09-24, paired with `review_protocol: phase_checkpoints` so a run stops only at checkpoint A (Phase 2) and checkpoint B (Phase 4), while Phases 1 and 3 auto-approve (Aaron flow, see `aaron-flow.md`), `phase-protocol.md`; `review_gates` is opt-in), proceed without pausing: pick the strongest option per this skill's rubric, record it to `run_state`/profile, and continue. Never re-ask a decision already in `run_state`, the profile, memory, or the operator's latest message. Stop only for the policy's hard-stops (spend over the approved ceiling, live send, credentials, provider/source-of-truth change, safety gates). On a long async wait, background-poll and move to other productive work. Never idle.

---

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short: record status, not raw output. Full protocol: `client-activity-log.md`.

## Mode: Discovery

### When to trigger

- Invoked by `/cold-email-kickoff` immediately after `/icp-onboarding`, before the Aaron offer call
- When starting fresh with no existing offer
- When the user wants to understand the market before deciding what to offer
- Under the Aaron flow default (`aaron-flow.md` section 4): every trigger above still applies, but runs the quick mode below unless Luke asks for the full pass
- DEEPEN (Research QA) never fires under the Aaron flow default, because the gate itself is off by default (`/market-evidence` section 4); a thin quick-mode brief is a labelled gap, not a DEEPEN loop

This mode runs from the client profile, the client website, the client's own sales-call recordings, and public buyer voice alone. It does not wait on any list, data-point, or obtainability work, all of which now run after the offer locks so they are measured against a real offer instead of a guessed one.

### What this mode does

Runs Step 0 (research scope: reuse what exists) and the research sample, then the First-Party Call Vector and Vectors 0-4 with every item written to the evidence ledger, then `/market-evidence synthesize` and its Research QA gate, then the Intersection step. No send data exists yet because no campaign exists. Builds a market signal brief covering buyer pain in the buyer's own words (first-party from the client's won and lost calls, then public), each pain mapped to the persona who feels it, and a saturation map of which offer forms competitors already use in this space (evidence only, described in plain words, with denominators and the gap competitors leave).

Does **not** evaluate an offer, output a Go/Iterate/Swap decision, or propose which offers to build. There is nothing to evaluate yet. The output is research that the Aaron offer call reads.

### Aaron flow quick mode (the default in this worktree)

See `aaron-flow.md` section 4. The full pass below (`/deep-research` or its sub-agent fan-out, Vectors 0-4, Stage 1 depth) is not the default; it runs only when Luke asks for it or the client-facing stakes call for it. The default is quick demand mining:

1. **Decide known vs. unfamiliar.** Known market: the operator, a prior client in the same vertical, or research already on file names the top 2-3 pains and the competitor landscape with reasonable confidence. Unfamiliar market: none of that is true.
2. **2a. Known market.** Skip new research entirely. Pull the existing clusters (or the operator's/prior client's stated pains) straight into Step 0's reuse path, write them into the ledger as `model_hypothesis` rows if they are not already sourced, and move to `/market-evidence synthesize`'s short clustering.
3. **2b. Unfamiliar market.** Run exactly one fanned-out research pass, 3 sub-agents on disjoint routes, each writing its own batch file into a `quick` run folder (standard section 1):
   - (a) Reddit/LinkedIn/X and general public opinion, via WebSearch and, for LinkedIn/X and any JavaScript-rendered page, the built-in browser pane
   - (b) Meta Ad Library, via the built-in browser pane (read-only, no login)
   - (c) Competitor sites and their named offers, via WebFetch
   Each row still becomes a tiered, sourced ledger row exactly as in the full pass (`market-evidence-standard.md`); only the number of passes and the depth per pass shrink, never the typing or sourcing rules.
4. **Comparison.** Quick mode trades floor-to-ceiling coverage (3-10 competitors, 20-30 quotes, the harness's adversarial verification) for one fast read, accepting thinner Research QA coverage until Luke asks for the full pass.
5. **Logging.** The activity log and `research_artifacts.method` both record which path ran (`aaron_flow_known`, `aaron_flow_quick`, or the full pass's `claude-deep-research` / `claude-subagent-fanout`), so a later full pass is never mistaken for having already happened.
6. **Brief completeness.** The Intersection step and Candidate Generation Input still run on whatever evidence exists (even a `model_hypothesis`-only known-market pull), labelled by confidence; a thin brief is a labelled gap, never a blocker.

When Luke asks for the full pass, or the client-facing stakes (a large spend commitment, a sensitive vertical) call for it, run AI/API Routing and Steps below in full, at Stage 1 depth (`market-evidence-standard.md` section 8).

### AI/API Routing

**Aaron flow default:** this routing, and the `/deep-research` primary-pass requirement below, govern the full pass only. The Aaron flow quick mode above is the default and is not a violation of this HARD RULE; it is a separate, lighter path that this rule does not reach until Luke asks for the full pass.

> **Research Routing: HARD RULE (Claude deep-research primary, enforced; no-AI-API rule, operator directive 2026-09-22).** `run_state.research_routing` has exactly one value, **`claude_deep_research`**. If it is unset, set it to that and proceed. If it still holds a retired value (`third_party_ai`, or the bare-WebSearch `claude_native`), treat it as `claude_deep_research` and note the correction in the activity log. The primary research brain is the Claude native `/deep-research` fan-out harness (`anthropic-skills:deep-research`, run through the Skill tool: multiple sub-agents research every needed category in parallel, fetch real sources, adversarially verify each claim, and synthesize a cited report). When the harness is unavailable or rate-limited, its declared fallback is a flat fan-out of 4 to 8 research sub-agents from the same brief, logged as `claude-subagent-fanout`; that is still Claude Code, never another provider. Do NOT stop to ask, and do NOT satisfy the primary pass with a bare inline WebSearch. The primary pass MUST be an **actual `/deep-research` invocation, or its declared fan-out when the harness fails** (inline WebSearch/WebFetch alone does NOT satisfy it): record `ai_research_provider = claude-deep-research` (or `claude-subagent-fanout` when the fallback ran) and append the run-log line to `api-balance-ledger.md` (a provenance record the wired check reads, not an AI spend row). A research step that finishes with **no `/deep-research` primary** is a **flagged violation** (run it, or get a fresh explicit OK to skip). **Wired check:** after the primary pass, run `node scripts/research/research_routing_check.mjs --skill offer-intelligence --client <business-slug> --json`. A `violation:true` / exit 1 means no logged primary; do not declare this research step done until it passes. No API key of any kind is needed: research runs only on Claude Code itself (the harness, its sub-agents, WebSearch, WebFetch and the built-in browser pane), and no other AI provider is ever called. **Scope note:** the First-Party Call Vector sits outside this routing path entirely, because it reads client-supplied recordings and transcripts, spends nothing externally, and picks no engine. It does NOT satisfy or substitute for the `/deep-research` primary pass, so running it first leaves the primary-pass requirement and the wired check exactly where they were. Full rule: `/ai-model-routing`.

This skill runs at `pass_depth = deep` on the single research path in `/ai-model-routing`, which is Claude Code native only (no-AI-API rule, operator directive 2026-09-22); there is no cheap/standard tier to pick. Assemble the research brief (goal, ICP, decision, output, freshness, confidence, source types, VOC?, assumptions, open questions). The Claude native `/deep-research` fan-out harness runs the primary broad pass (web-grounded competitor/ad/market research + cited source discovery via parallel sub-agents, adversarial verification, cited synthesis). Every data step names a capability role, never a vendor, and the stack contract says which tool fills it; a role whose slot is empty, `held` or `not_chosen` is skipped and noted, never filled with a plausible vendor. The AI roles are retired: there is no research-provider, bulk-classification or copywriting model slot to fill, and `web.search` / `web.crawl` are simply the harness's own WebSearch and WebFetch. The routing: WebSearch is a discovery helper that returns raw URLs, not a second research brain; raw page extraction → WebFetch, plus the harness's built-in browser pane (`mcp__Claude_Browser__navigate`, then `get_page_text`) for pages that render only client-side, such as the Meta and LinkedIn ad libraries. The browser pane is read-only here: never log in, decline non-essential cookies, and read ad libraries in bulk by fanning advertisers out across sub-agents (disjoint advertiser sets, one output file each), never by hand-checking them one by one. Never fall back to Claude in Chrome for research, because it acts in the operator's real browser with their own sign-ins. **Persona desire research (Vector 0) → inside the `/deep-research` primary pass**; **ICP-pain VOC mining (Vector 3) → the VOC / Raw-Evidence pipeline**, run against the platforms Vector 3 lists as readable, with `source_class` kept (Reddit follows Vector 3's own Reddit rule: operator paste only); evidence extraction → sub-agents on a small model tier (the Agent tool's `model` setting, for example `haiku`) writing ledger batch files over disjoint batches of the raw captures per `/personalization-subagent-pattern` (one output file per agent, then a post-merge dedup); clustering, counting, scoring and the gate → `/market-evidence synthesize`. The live X / social read no longer exists, so note that gap rather than filling it. After the primary pass, fill ONLY its gaps (thin / technical / multi-step coverage, weak or unsupported claims, missing counterexamples, overclaimed ICP, contradictions) with a second targeted `/deep-research` pass or targeted WebSearch, WebFetch or browser-pane reads; never another AI provider, and never a duplicate broad pass. When the corpus is too big or references too many, use **scale mode**: WebSearch EMITS ranked URLs → sub-agents working disjoint URL batches read them with WebFetch and compress each batch → the main Claude Code session merges and synthesizes. The Validation Gate is the Research QA gate in `/market-evidence synthesize` (see "Evidence synthesis and the Research QA gate" below): a public pain still counts only at 3 or more independent `buyer_quote` sightings, now counted by `outbound/scripts/research/evidence_ledger.mjs stats` rather than by hand, counterexamples kept. The brief this skill writes is research, not copy. Keep CTA wording out. Final copy is written later by `/campaign-copywriting` (Claude Code native, clean-packet sub-agent) and any CTA must still pass `spam-word-checker.md` and `cold-email-copy-best-practices.md`.

### Inputs

- `profiles/<business-slug>/client-profile.yaml` - ICP, value prop, hard filters, and `icp_soft_preferences.personas_to_prioritize` (captured by `/icp-onboarding`, and the list every pain row is mapped against)
- The client's own recorded sales calls, won and lost. **Check `sales_call_library` in `client-profile.yaml` FIRST**, because `/icp-onboarding` already asked for this at intake and recorded whether recordings exist, where they live, the rough count, and the won/lost mix. Only request them from the client when that field is absent or says access is still pending. Re-asking for something intake already captured wastes the client's patience on the exact step that depends on their goodwill. `sales_call_library.exists: false` is a real answer: a stated gap, not a prompt to ask again
- `buyer_pain_hypothesis` in `client-profile.yaml` - the client's own unverified belief about what their buyers struggle with, captured at intake. Treat it as the hypothesis this mode sets out to **confirm or overturn**, never as a finding. Where public buyer voice and first-party calls contradict it, say so plainly in the brief: a client wrong about their own buyers' pain is one of the most valuable things this research can surface
- `profiles/<business-slug>/slack-context.md`, when the client Slack check (`client-slack-check.md`) found anything: what the client and the team said in Slack about the buyers, won and lost deals, competitors and objections, plus any call-recording links. A recording or transcript linked there goes through the First-Party Call Vector like any other recording. A Slack message itself is client-stated, the same class as `buyer_pain_hypothesis`: never tag it `first_party_call`
- **The live website profile (required, HARD RULE, operator directive 2026-09-24)**: `profiles/<business-slug>/website-profile.md` and the `website_scrape:` block in `client-profile.yaml`, written at onboarding by the live scrape (`client-website-scrape.md`): each product and solution, pricing, who they sell to, proof, the offers and calls to action they already run, the competitors they name, and their own words for the problem. **The primary research pass does not start until `website_scrape.status` is `done` or `partial`, or `no_website` confirmed by the operator.** If the block is missing, run the scrape now; if it is past `refresh_due` and this is a refresh run, re-scrape. If it is `blocked` after every route, stop and ask the operator for a different URL, pasted page text, or the go-ahead to research without it (a hard stop in `/autonomous-execution-policy` section 3; under `phase_checkpoints` Phase 1 auto-approves and has already asked it, `phase-protocol.md`). The website read does **not** satisfy the `/deep-research` primary pass or the wired routing check, and nothing in it is written to the evidence ledger: it is the client's self-description, which this research tests
- Competitor names or URLs - ask if not already in the profile (under `auto_execute`, find them in research instead of asking, and list them at the next checkpoint). Start from the competitors and "vs" pages in `website-profile.md` section 8. Target 5 to 10, see the sample-size floor in Vector 1
- **Research that already exists** - the `research_artifacts:` block in `client-profile.yaml`, everything in `profiles/<business-slug>/_research/`, an older `offer-intelligence.md`, `offer-validations/`, `context-sweep.md` (what onboarding's client context sweep found in Slack channels and DMs, email, Drive, the calendar, Notion and local files: its Resources Found are research that already exists, and its Constraints & Instructions register bounds every offer; if it is missing, run the sweep per `client-context-sweep.md` before any new research), and any older research folder kept in another shape (for example `research/`, `_research-raw/` or `first-party-calls/`). Step 0 reads these first so no research is repeated
- **The client intel feed**: `profiles/<business-slug>/client-intel.md` and the meeting recaps it links. Step 0 reads it too, before any new research: Needs attention and Open items in full, plus Recent activity tagged `offer` or `icp`, and the meeting notes and feedback items. What the client or the team said in a meeting or in Slack is client-stated, the same class as `slack-context.md` above (never `first_party_call`, which only an actual recording or transcript of a buyer call earns), and it becomes evidence only as ledger rows written the normal way (`market-evidence-standard.md`), never lifted straight into `evidence.csv`. It is a hypothesis: it never silently overwrites an operator-confirmed value or a locked decision, and a conflict goes to the operator (under `auto_execute`, a conflict touching offer, list, copy or launch stops this step and asks). A missing feed, or one that is stale by the rule in `client-intel-feed.md`, is a one-line flag at the top of the report, never a blocker; offer `/client-intel-sync <client>` for a fresh pull. Protocol: `client-intel-feed.md`

This mode has no list-side or data-side prerequisite of any kind. Proceed from the client profile, the client website, the client's own call recordings, and public buyer voice. Do not route back to `/lead-source-strategy` or `/data-point-discovery` to satisfy this mode: both run after the offer locks.

### Steps

**How the research is organized (operator directive 2026-09-22).** The research runs from three inputs and then intersects them: (1) deep research on what the buyer persona deals with every day, at a business level and a personal level; (2) 5 to 10 competitors' Meta ads, to see which angles already have money behind them; (3) the client's won and lost sales calls, for the buyer's exact words. Here, (1) is Vector 0 plus the complaint mining in Vector 3, (2) is Vectors 1 and 2, (3) is the First-Party Call Vector, and the Intersection step after Vector 4 finds the commonality, validates it and rewords it. A model-generated pain is a hypothesis, not a fact, so Vector 3 checks Vector 0's hypotheses against what real buyers complain about in public. What offers to create from this evidence is not decided here; it is the Aaron offer call's job.

**Step 0 - Research scope: reuse what exists, never redo it**

Before any new research, read what the client already has (the "Research that already exists" input above, `context-sweep.md` included, plus the client intel feed) and decide the scope of this run:

| Situation | Scope | Run folder |
|---|---|---|
| No research on file (new client, new market) | Full Stage 1: every vector below | `_research/runs/<YYYY-MM-DD>-discovery/` |
| Research exists but `research_artifacts.last_refreshed` is older than 90 days, or a new segment, market or offer direction starts | Refresh: re-run the stale or missing vectors only; carry the rest forward | `_research/runs/<YYYY-MM-DD>-refresh/` |
| The Research QA gate returned DEEPEN | Targeted Stage 2: only the gaps its deepen brief names | `_research/runs/<YYYY-MM-DD>-deepen-<n>/` |
| Research is current and passed the gate | Skip to the Intersection step; say so | none |

**Older research is referenced, never moved.** When a client has research on file in an older shape (numbered research notes, a raw-capture folder, a `research/` folder, a folder of call transcripts, a buyer-voice table), extract its quotes and findings into ledger rows once, with `raw_ref` pointing at the original file and `collected_by: legacy-seed`, before new research starts. Then research only what the seeded ledger lacks. Record the original paths in `research_artifacts.legacy_files`.

**The website profile sets the research agenda (every scope above except "skip").** Read `website-profile.md` before the first vector runs and put its section 13 (Research hooks) into the research brief as named items: the products and pricing-implied segments to test (who can afford each tier, and does that group feel the pain), the claims the site makes about the buyer's problem (each a hypothesis for the vectors to confirm or overturn, like `buyer_pain_hypothesis`), the named customers (for Step 0.5), the named competitors (for Vector 1), and the offers the client already runs (the baseline row of the Vector 1 saturation map). Its section 12 (what the site does not say) goes to the brief's open questions. A testimonial or case-study pain on the site is a lead to look for in buyer-side sources, never a ledger row.

**Step 0.5 - The research sample (free)**

Before drawing any conclusion, name 10 to 25 real companies that fit the ICP and write them to `_research/market-sample.md` (`market-evidence-standard.md` section 11): the client's named customers and case studies (start with `website-profile.md` section 5), competitors' named customers, employers found through job posts, and search results that match the ICP. It grounds persona research and job-post reading in real companies and makes the ICP-specificity check concrete. It is **not** the seed set (seeds, needed only for a group `/tam-build` sends down the lookalike route, are chosen for offer fit, after lock, by `/social-proof-bank`; TAM discovery is filter-first by default, operator decision 2026-09-28), and it triggers no paid lookup: no call to the company-discovery tool, the contact discovery tool or the contact enrichment tool before the offer locks. Build it from public pages with WebSearch and WebFetch.

**How every vector records its evidence**

Each vector's sub-agent writes its findings as ledger rows (`market-evidence-standard.md` section 3) to its own batch file, `_research/runs/<run>/batch-<vector>-<n>.json`, and saves any capture that cannot be re-fetched (an operator paste, a browser-pane page text, a transcript excerpt) in the same run folder. A short narrative note per vector (`<vector>-notes.md`) is optional working material. A sub-agent that turns raw sources into rows is handed the canonical extraction instruction `outbound/evals/voc-extraction/prompt.md` (the same prompt the benchmark in `outbound/evals/` measures, so edit it only through the loop in `outbound/evals/README.md`), plus the vector's own brief. The orchestrator ingests the batches with `node outbound/scripts/research/evidence_ledger.mjs ingest --client <business-slug> --in outbound/profiles/<business-slug>/_research/runs/<run> --run <run>`, fixes any rejected row from its source, and never types rows or counts by hand. The ledger is written only through that script. The evidence types each vector produces:

| Vector | `evidence_type` (tier) | `source_class` |
|---|---|---|
| First-Party Call Vector | `sales_call` (strong) for the buyer's own words; `client_material` (good) for the client describing their buyers | `first_party_call` |
| Vector 0, persona desire | `model_hypothesis` (never counted) | `model_hypothesis` |
| Vector 1, competitors | `competitor_claim` (supporting, context only); `competitor_case_study` (good) for named customer stories | `competitor_claim` |
| Vector 2, paid ads | `ad` (supporting) | `competitor_claim` |
| Vector 3, public complaints | `forum_post` or `review` (good); `social_post` or `video` (supporting); `purchase_behavior` (strong) when a buyer says they paid for, switched from or cancelled something | `buyer_quote` |
| Vector 4, job postings | `job_post` (good) | `job_posting` |

**First-Party Call Vector - the client's own won and lost sales calls**

This is the only first-party pain input in the chain. Every other vector reconstructs pain from public strangers. The client's recorded sales calls are the buyer saying it directly, to the client, about this exact category, so they outrank every public source wherever the two disagree. Run this vector first and let its language set the terms the rest of the research is measured against.

- Ask the client for recordings or transcripts of recent sales calls, both **won and lost**. Lost calls matter more than won ones for offer design, because they name the objection that actually stopped the deal.
- Aim for 5 to 10 calls with a mix of both outcomes. Fewer is still worth mining, just mark the confidence down.
- Read or transcribe them and pull the buyer's **exact words**: how they name the problem, the jargon and shorthand they use for it, the objections they raise, the alternative they compared against, and what they had already tried.

Extract, per pain or objection:
1. `exact_quote` - verbatim, never cleaned up or paraphrased
2. `persona` - the role of the person who said it, mapped against `icp_soft_preferences.personas_to_prioritize` where it fits
3. `call_outcome` - won or lost
4. `source_class: first_party_call`
5. What this implies the offer has to answer

Then **reword the offer direction into that language**. If the client's buyers say "coverage gaps" and the client's own website says "risk exposure optimization", the offer says "coverage gaps". Take the website's side of that contrast from `website-profile.md` section 9 (the site's own phrases for the problem and the outcome), so the gap between how the client talks and how buyers talk is written down, not remembered. This rewrite is the point of the vector, not a nice-to-have: carry it into the brief as an explicit offer-language line that the Aaron offer call and `/campaign-copywriting` inherit.

**Hard rules for this vector:**
- **Never fabricate a quote.** If you did not read it in a real recording or transcript, it does not go in the brief.
- **Never present a public quote as a first-party one.** `source_class` is the guard. `first_party_call` means a real client sales call and nothing else.
- **A first-party quote does not count toward Vector 3's `frequency_count`.** The `frequency_count >= 3` floor governs public buyer voice and stays exactly as it is. First-party call evidence is a different and stronger class, so a single objection from a real lost deal is reportable on its own, tagged and outcome-labelled. Do not mix the two pools in either direction.
- **If the client has no recordings, state that plainly in the brief** in the First-Party Buyer Voice section, mark that section's confidence Low, and proceed on public buyer voice alone. Do not silently omit the section, and do not quietly backfill it with Vector 3 material.

This vector reads client-supplied material, so it carries no external research spend and no routing gate of its own.

---

**Vector 0 - Persona desire research (five layers)**

The first research step is deep research on what the buyer persona deals with day to day, at a business level and a personal level, because the pain that makes a stranger reply sits where the two meet. Run it inside the `/deep-research` primary pass, once per persona in `icp_soft_preferences.personas_to_prioritize` (or once per persona the evidence derives, when that list is empty), using four inputs: persona and job title, industry, geography, and the client's service.

Cover five layers per persona:

1. **Business pain points:** the operational and revenue problems the role owns.
2. **Emotional and personal drivers:** what the person fears, wants, or is judged on. An illustration: the driver was not "I need help with staffing", it was "I need someone who won't waste my time and will actually deliver."
3. **Trigger events:** the moments that make this persona reachable (a funding round, a lost key hire, a regulation change, a new target). Record them here; `/data-point-discovery` later decides which ones the list can actually detect.
4. **Worldview and language:** what they believe about the problem, the words they use for it, and the phrasing that gets a cold email filtered out.
5. **Competitive landscape:** what they have already been pitched, bought, or tried.

**Everything Vector 0 produces is a hypothesis.** Tag each row `source_class: model_hypothesis`. A model's account of a persona's pain is a guess until a real buyer says it, so a hypothesis never counts toward `frequency_count`, never enters the ICP Pain section as pain, and never enters copy as a fact about a named person. Its jobs are to tell Vector 3 which complaints to hunt for and which words to search with, and to give the Intersection step a map of the persona. A hypothesis that Vector 3 or the client's calls corroborate becomes evidence under that source's class. One they contradict is reported as overturned, the same way `buyer_pain_hypothesis` is.

Discovery mode only. Validation mode reuses Vector 0 from an existing brief when one is on file and does not rerun it. With no brief on file, validation mode runs without Vector 0, so wherever validation mode says "Vectors 1-4" it means exactly that.

---

**Vector 1 - Competitor front-end offers + saturation count**

**Sample-size floor: research 5 to 10 competitors.** A saturation verdict is a claim about a field, and a field of two or three is not a field. Below 5 there is no denominator that can carry the word "saturated". Build the list from the client profile, the competitors the client names, the competitors and "vs" pages in `website-profile.md` section 8, and a search for adjacent players serving the same ICP, until you have at least 5. Record the count, because the verdict is only auditable next to its denominator. Put the client's own current offers and calls to action (`website-profile.md` section 6) in the saturation map as its first row, marked as the client's, so the map shows whether the client already sits in a crowded offer form. That row never counts toward a competitor saturation count.

- Fetch competitor websites. Look at: homepage hero CTA, pricing page CTA, pop-up or inline lead magnets, any "free X" offer, how trial or demo is framed
- Check their LinkedIn company pages for pinned posts or sponsored lead gen content
- If they run LinkedIn Lead Gen Forms, the form title usually names the offer directly
- Search `"[competitor name]" "free" site:linkedin.com` or `"[competitor name]" cold email swipe` for published examples

Extract for each competitor:
1. The specific offer they lead with
2. The offer's form, in plain words: what the competitor hands the buyer (for example "a free written teardown of the buyer's site", "a benchmark report", "a 15-minute call"). No letters, no table to map it to: describe it, and group competitors whose forms are the same in substance
3. How long they appear to have been running it

Also fill a **competitor card** for each one in `_research/competitors-and-ads.md` (`market-evidence-standard.md` section 10), researching only what helps a GTM decision: who they sell to, their main promise (their headline, verbatim), the front-end offer and its form in plain words, pricing model or visible price, named customers and case studies (each a `competitor_case_study` ledger row), their lead magnets, what their customers complain about (review rows from Vector 3, cited by evidence ID), their strengths as buyers describe them, and the gap they leave. Competitor marketing is `competitor_claim`: context, never proof. Read a competitor's pricing, case-study and customer pages one by one with WebFetch, and in the browser pane when a page renders only client-side. A sub-agent reading one competitor page fills the page-level fields (promise, front-end offer and its form, prices, named customers, lead magnets, main call to action) from the canonical instruction `outbound/evals/competitor-card/prompt.md`, which the benchmark measures; the session adds the cross-page fields (complaints, strengths, the gap).

Build the saturation table. Head it with the denominator:

**Competitors researched: [N]**

| Competitor | Offer | Offer form (what the buyer receives) | Running how long |
|---|---|---|---|
| [Name] | [Offer] | [plain-words description of the form] | [Duration or Unknown] |

**Saturation rule:** Count how many competitors use the same offer form, out of the total number you actually researched (the denominator).
- Denominator below 5 -> **INSUFFICIENT SAMPLE**. SATURATED may not be fired at all. Report how many competitors were researched and how many used the form, and leave the form unverdicted until the sample reaches 5.
- Denominator 5 or more, 3 or more competitors using the form -> **SATURATED** (the ICP may be numb to it)
- Denominator 5 or more, 2 using it -> **CROWDED**
- Denominator 5 or more, 0-1 using it -> **OPEN** (uncontested by competitors)

A saturated offer form is not evidence the offer works or fails for this client today; the ICP may be numb to the form. It is also evidence that buyers care about the problem (competitor spend shows demand, a house evidence rule). The verdict is reported as evidence, with the gap competitors leave, for the Aaron offer call. It never ranks, limits or closes an offer; Aaron decides what is tested (`aaron-lane.md`).

---

**Vector 2 - Paid ads intelligence (Meta Ad Library, then LinkedIn)**

Read the **angle and the positioning, not the creative execution**. A competitor running 10 to 50 variations of a single angle has already paid to learn that this market responds to that angle. The variations are them optimizing execution around something already proven, so the angle is the finding. Report what problem the angle names and what it promises, not the headline wording, the stock photo, or the button colour.

**Meta Ad Library (start here, it is public and needs no authentication)**

- Search Meta's Ad Library by advertiser name or Facebook page for each competitor and adjacent brand. It is a public ad-transparency registry, so there is no login, no ad account, and no API key involved. **Read it in the harness's built-in browser pane** (`mcp__Claude_Browser__navigate` to `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=<CC>&q=<advertiser>&search_type=keyword_unordered`, then `get_page_text` or a screenshot). The Ad Library is a client-side app: WebFetch gets a dropped connection or an empty shell, while the browser pane renders the ads and their copy (tested 2026-09-23). Read only: never log in, and decline non-essential cookies if a banner appears. Never fall back to Claude in Chrome, because it acts with the operator's real sign-ins. Use WebSearch only to find an advertiser's page name. Google's Ads Transparency Center is the equivalent public Google route and would be read the same way in the browser pane, but that read is not yet tested (it is Untested in the read-route verdicts of `market-evidence-standard.md` section 9), so run the "Test a read route before trusting it" steps there before its reads count as coverage. With many advertisers, read them one after another in the pane, not in parallel. Mark an advertiser unread only when the browser pane also fails, and say so; there is no scraper route outside the approved stack (`stack-contract.yaml`). Each angle becomes an `ad` row in the ledger, with its variation count and run length in `notes`.
- **What the Meta library shows and hides.** Dynamic-creative ads show placeholders such as `{{product.brand}}` where the copy should be, so read the ad's cards or its detail view for the real text before naming the angle. For an active ad, compute days running from its start date. Spend and reach appear only on EU-targeted and political ads, so for most advertisers the money behind an angle is read from how long its ads have run and how many variations it has.
- For each advertiser, group the active ads by distinct angle and count the variations behind each one. Ten to fifty variations of a single angle is the strongest read available in this vector: proven paid demand for that angle.
- Note how long each angle has been running. Long-running plus many variations means real budget behind something that works.
- Capture per angle: the problem it names, the promise, the offer or CTA type, the variation count, and how long it has run.

**LinkedIn ads**

- Search LinkedIn's ad library for the same competitor and adjacent brands. It is public with no login: open `https://www.linkedin.com/ad-library/search?accountOwner=<advertiser>` in the built-in browser pane and read it with `get_page_text`. WebFetch gets HTTP 403 there, but the browser pane renders the ads, including creator posts "Promoted by" the advertiser (tested 2026-09-23). The public ad library is a different surface from LinkedIn behind its login wall, which stays operator paste per the Vector 3 platform table. The same browser rules apply: read only, never log in, never Claude in Chrome.
- `accountOwner` is a fuzzy name match that pulls in partners' and similarly named advertisers' ads, so once you have the advertiser's company ID from its ad-library URL, scope by `companyIds=<id>` instead. Use `keyword=<phrase>` in place of `accountOwner` to see who else pays to run an angle.
- Dates, impressions and targeting appear only on EU-targeted ads, and the library gives no variant count. Count variations by reading the ads themselves, and write the run length as Unknown when no date is shown rather than guessing it.
- Use web search `"[competitor]" linkedin ad OR sponsored OR "lead gen form"` only as a fallback when the ad library itself cannot be reached. A search-result proxy is weaker than the library, so mark anything sourced that way low confidence
- Look for: what problem does the ad headline name? What CTA? What offer?

Weight correctly:
- Ad running 30+ days with engagement = real spend = high signal
- Many variations of one angle = the advertiser already validated that angle = high signal
- Fresh or low-engagement ad = hypothesis, not proof = low signal
- Multiple competitors running same angle = cross-reference with Vector 1 to distinguish "validated" from "everyone copied each other"

Extract: the 1-3 offer angles in this space that have real paid spend behind them, each with the platform it was found on and the variation count where available.

---

**Vector 3 - Real complaints in the buyer's own words (VOC / Raw-Evidence)**

This is the VOC layer, and it is where Vector 0's hypotheses meet real buyers. Go where this ICP complains and asks for help in public (Reddit, review sites, forums, community Q&A) and collect what they actually say. Run the **VOC / Raw-Evidence pipeline** defined in `/ai-model-routing`. Do NOT just "search and summarize", because a summary hides the sampling and launders marketing copy into "pain".

**Where to look, and what this harness can actually read.** Tested from Claude Code on 2026-09-22 and 2026-09-23. Retest any platform marked untested and log the result, because site blocking changes.

| Platform | Readable by the harness? | How to read it |
|---|---|---|
| Reddit | **No.** Web fetch, web search and the built-in browser pane all refuse reddit.com, direct and RSS requests are rate-limited (HTTP 429), and the free Reddit archive mirrors refuse agents | See the Reddit rule below |
| Trustpilot | Yes, web fetch returns verbatim reviews | Web fetch on each competitor's review page. A review title ending in "…" is Trustpilot's own auto-title, not the reviewer's words, so quote the review body |
| Capterra | Yes, web fetch returns verbatim pros and cons | Web search limited to capterra.com to find the page, then web fetch. Capterra mixes in syndicated Software Advice reviews: keep or drop them deliberately, and flag them so one review is never counted twice |
| Hacker News | Yes, through its free public search API | `https://hn.algolia.com/api/v1/search?query=<terms>&tags=comment` |
| G2 | **No**, HTTP 403, and a device check stops the browser pane too | Operator paste only. Check a pasted G2 quote against a Wayback Machine capture of the page (or the same review on another site) before it counts. Capterra usually covers the same product with cleaner fields, so read it first |
| YouTube comments and transcripts | Untested | Test web fetch and the browser pane on one video, then log readable or blocked; operator paste is the fallback. Comments from buyers, not from the creator, are the `buyer_quote` rows |
| App-store reviews, niche industry forums | Untested | Try web fetch, then log readable or blocked |
| Quora, LinkedIn, Facebook groups | Expected login wall, untested | Operator paste only |

**Test a route before trusting it.** Before a platform's rows count, prove the route against the platform itself: open 2 or 3 of the URLs it returned directly (in the browser pane or with web fetch) and confirm the quotes are really there, and run one fabrication probe (a nonsense query, or a source you know is empty) that must come back empty. **An empty result is not proof of absence:** a route can return nothing, with no error, for a page that plainly has content, so run the check before logging a platform as quiet. Log a dated verdict per platform (readable, partial or blocked) in the run folder, and flag this table for an update when a verdict changes.

**The Reddit rule.** No tool in FNNL's approved stack reads Reddit, and the native harness is blocked from it, so **operator paste is the only Reddit route** (operator directive 2026-09-22):

- **Operator paste (zero cost, works today).** Someone on the team reads the threads in their own browser and pastes the post and comment text together with each thread URL. Pasted text counts as `buyer_quote` rows exactly like a fetched page, with the raw paste saved in the run folder because it cannot be re-fetched. To keep this to minutes, hand them a short reading list: the subreddits this persona most likely uses (a Vector 0 hypothesis, because the harness cannot search Reddit to confirm them) and the complaint queries below.

If nothing was pasted, Reddit is **unread**: say so in the Signal Summary. Never claim Reddit coverage because Reddit appears in a platform list, and never write a Reddit quote from a search snippet, a model's summary, or memory.

**The pipeline:**

1. **Live X / social read: not available.** That step is retired with the no-AI-API rule (operator directive 2026-09-22), and nothing replaces it. Where the web search in step 2 returns public X or LinkedIn posts, read and quote them like any other page; otherwise note the gap in the Signal Summary.
2. **The harness's web search** finds the EXACT discussion and review URLs on the readable platforms above, using the complaint queries below. This hop returns URLs only. It must not summarize.
3. **The harness's web fetch** reads each page to clean text, and you capture exact quotes. When a page renders only client-side, try the built-in browser pane (read only, never signed in). A page neither can read is logged as unread, never paraphrased from its search snippet.
4. Tag every quote with `source_class` (`buyer_quote` / `competitor_claim` / `analyst_claim` / `news`). Only `buyer_quote` counts as pain. A competitor landing page is positioning, not pain. A competitor's own customer complaining in a review is a `buyer_quote`.
5. Tag every quote with the `persona` who voiced it, using the role or function the poster states about themselves. Pain is felt by a person, not by a company. Two personas inside one ICP often carry completely different pains, and flattening them into a single blob produces an offer that is mildly relevant to everyone and urgent to nobody. Where the stated role maps to an entry in `icp_soft_preferences.personas_to_prioritize`, use that entry's wording so the rows join cleanly. Where the role is genuinely not stated, write `persona: unknown` rather than guessing a role to fill the field.
6. Tag what each complaint is about: `complaint_about: own_workflow` (a problem in how they work today) or `complaint_about: competitor:<name>` (a failure of a product or provider they already use). Competitor complaints are the gap finder for the Intersection step, because they show what the field's current offers leave unsolved. In the ledger, the competitor's name goes in `competitor_mentioned`; an own-workflow complaint leaves it blank.
7. Write every quote as a ledger row with the full field set (`market-evidence-standard.md` section 3): alongside `exact_quote`, `source_url`, `source_date`, `persona` and `source_class`, fill `situation`, `pain`, `trigger`, `workaround`, `workaround_gap` (why the current workaround is not enough), `consequence`, `desired_outcome`, `alternative_considered`, `competitor_mentioned` and `objection` wherever the source says them, and leave them blank rather than infer them. Keep the buyer's wording: "We spend half of Monday cleaning the CRM" is the finding; "operational CRM inefficiency" is not.

**Complaint queries.** Search in the words Vector 0 and the client's calls surfaced, never in the client's own jargon. Combine `[persona or job title] + [problem domain]` with three kinds of phrase:

- asking for help: "how do I", "looking for", "recommend", "struggling with"
- complaining: "frustrated with", "sick of", "waste of time", "is it just me", "anyone else"
- switching: "switched from [competitor]", "alternative to [competitor]", "cancelled [competitor]", "[competitor] review"

Then read the 1-to-3-star reviews of each Vector 1 competitor on the readable review sites. What a competitor's customers complain about is the part of the pain its offer leaves unsolved.

A question the ICP asks publicly in their own words = a problem they will trade their attention to solve. That problem is the lever your offer should pull.

Extract: every usable quote as a ledger row (step 7). The 3-5 problems the brief reports are the top clusters `/market-evidence synthesize` forms from those rows, each with a verbatim `exact_quote`, its `source_url`, `persona`, `complaint_about` (`competitor_mentioned` in the ledger), and any counterevidence, and its `frequency_count` is the independent `buyer_quote` sighting count from `evidence_ledger.mjs stats`, never typed by hand. A pain only graduates into the brief at 3 or more independent sightings (the Research QA gate); weaker ones stay visible, labelled `confidence_score: low`. First-party call quotes are a separate, stronger class and never count toward this `frequency_count`, and neither do Vector 0 hypotheses. This exact phrasing feeds copywriting later and is part of the evidence the Aaron offer call reads.

Sample before scaling: collect 20-30 quotes first; expand only if patterns are strong. If community signal is weak (niche market, hard-to-find ICP): note it, weight this vector low, lean more on Vectors 1 and 4.

**Record platform coverage.** List which platforms were read and how many quotes each gave, and which were unread and why. This goes into the Signal Summary's ICP community row, so a reader can see at a glance whether "Reddit" means read or only listed.

---

**Vector 4 - Job posting analysis**

- Search Indeed, LinkedIn Jobs for roles the ICP is actively hiring
- Focus on roles that signal the problem your client solves
- Read full job descriptions, not just titles

Extract:
1. What problem are they solving by hiring this role?
2. What tools or processes does the JD mention? (signals what they already have and what's missing)
3. What outcomes is the hire accountable for? (the ICP's pressure point - a good offer relieves it)
4. Are multiple companies posting the same role? (recurring hire = systemic pain = strong offer angle)
5. Which `persona` owns this problem? Use the role the hire reports into or works alongside, so a job-posting pain carries a persona like every other pain row and joins the pain-by-persona table.
6. Write each posting as a `job_post` ledger row (`source_class: job_posting`), with the problem, the outcome the hire owns and the tools named in its fields. Prefer postings from the research-sample companies, and add new employers to the sample.

Job postings represent budget decisions. A company spending \$80K/year to hire for a problem will pay to solve it.

---

**Evidence synthesis and the Research QA gate (`/market-evidence synthesize`)**

Once the vectors have written their batches, run `/market-evidence` in `synthesize` mode. It ingests the batches, clusters the rows into problems in the buyers' own words, counts sightings with `evidence_ledger.mjs stats`, scores every cluster on the 8-factor opportunity rubric, and runs the Research QA gate (`market-evidence-standard.md` sections 5 to 7). Its outputs are `_research/pain-clusters.md` and a refreshed `research_artifacts:` block.

| Verdict | What this skill does next |
|---|---|
| PASS | Continue to the Intersection step, working from the clusters |
| DEEPEN | Run Stage 2 on the gaps the deepen brief names, and only those (a new `deepen-<n>` run folder; the routes the brief names: a targeted `/deep-research` pass, WebSearch, WebFetch, the browser pane, or an operator paste), then re-run synthesize. At most two loops; after the second, the verdict becomes PASS with low-confidence labels, or HOLD. Under `review_protocol: phase_checkpoints` (the new-client default since 2026-09-24) the loops run the same way, automatically, inside Phase 2 (`/phase-2-research-offer`, operator decision 2026-09-28), with no stop before the Aaron offer call |
| HOLD | Under `review_gates`, present it with its reasons at Gate 2 (the offer-step review defined in `/cold-email-kickoff`), where the operator decides, and wait for that decision before continuing. Under `review_protocol: phase_checkpoints`, it is carried forward as under plain `auto_execute` (next sentence), the Aaron offer call still runs, and the HOLD reasons lead the Phase 2 checkpoint (`/phase-2-research-offer`), with the missing evidence merged into `client-asks.md` (`client-messages.md`). Under plain `auto_execute`, continue to the Intersection step with every cluster labelled low confidence, the HOLD reasons at the top of the brief, and the missing evidence (usually call recordings) requested from the client and logged PENDING |

Staged depth follows `market-evidence-standard.md` section 8. Research here runs on Claude Code alone and spends nothing, so the stages bound effort and time, not money. If a step ever does make a metered call (a count or lookup the operator asks for, a platform read that uses credits), `/tool-balance-guard` runs first: a tool that is out of balance, down or switched off is a stop to ask the operator, never a reason to substitute another tool or skip the step (operator decision 2026-09-28). Weak clusters are never dropped; they are labelled and ranked.

**Intersection - find the pain the inputs agree on (the commonality step)**

Do not pick a pain from any single input. Lay the three inputs side by side, look for the commonality, validate it against the market, and reword it in the buyer's language. Do this before writing the brief:

1. **Line up the inputs.** The pain clusters from `/market-evidence synthesize`, ranked by opportunity score (they already combine Vectors 3 and 4 and the first-party calls, with Vector 0 as the map of what to look for), competitor angles with paid spend behind them from Vector 2, and the buyer's own words from the First-Party Call Vector.
2. **Pick the lowest-hanging pain:** the cluster with the strongest real evidence (its opportunity score and its Research QA result) that a front-end offer could relieve quickly. Name it by cluster ID. Do not assume it is revenue related or any other type; the evidence decides.
3. **Validate it against paid spend.** If competitors already pay to advertise offers in this pain's category (Vector 2), the market has shown it cares. An unvalidated pain is not dropped. It is marked lower confidence.
4. **Find the gap.** Name the part of the pain the competitors' ads do not address, using the `complaint_about: competitor:<name>` quotes from Vector 3 as evidence. An illustration of what a gap looks like: every clinical-ops staffing competitor pitched finding talent fast, but the research pain was interview load (a VP interviewing 30 candidates to find two good ones). The gap is stated as a finding, never as an offer to build.
5. **Reword it in the buyer's words** from the First-Party Buyer Voice section, or from Vector 3 quotes when the client has no recordings.

The result is the Intersection section of the brief, and it becomes row 1 of `Candidate Generation Input` (the evidence table the Aaron offer call reads). If no pain clears step 2 with real evidence (only `model_hypothesis` rows exist), say so plainly. Never promote a hypothesis to fill the slot.

---

**Synthesize and output the discovery brief**

After the First-Party Call Vector, Vectors 0-4 and the Intersection step, build the brief that the Aaron offer call reads (`aaron-lane.md`, Call 1; recorded by `/lead-magnet-brainstorm` in recorder mode).

Save to `profiles/<business-slug>/offer-intelligence.md`:

```markdown
## Offer Intelligence - [Business Name] (Discovery)
**Date:** YYYY-MM-DD
**Mode:** Discovery
**Status:** Evidence for the Aaron offer call - no offer locked yet
**Competitors researched:** [N] (floor is 5, see Vector 1)
**First-party call recordings reviewed:** [N won / N lost, or "none available from client"]
**Evidence base:** [ledger rows by tier (E-0001..E-nnnn); pain clusters in `_research/pain-clusters.md`; Research QA verdict and date; research sample of N companies in `_research/market-sample.md`]
**Public complaint coverage:** [platforms read, with quotes per platform; platforms unread and why, e.g. "Reddit: unread, nothing pasted"]

---

### First-Party Buyer Voice (the client's own calls)

[From the First-Party Call Vector. One bullet per pain or objection, each carrying the verbatim `exact_quote`, the `persona` who said it, `call_outcome` (won or lost), and what the offer has to answer. These outrank public quotes wherever the two disagree. Never fabricate a quote, and never move a public quote into this section.

If the client has no recordings, write exactly: "Client has no call recordings available. All pain below is reconstructed from public buyer voice." Mark this section's confidence Low and leave it at that. Do not backfill it with Vector 3 material.]

**Offer language rewrite:** [the buyer's own words the offer should adopt, and the client-side jargon each one replaces. The Aaron offer call and `/campaign-copywriting` inherit this line.]

---

### ICP Pain (in their words)
[3-5 bullets, one per top cluster from `_research/pain-clusters.md`: its cluster ID, a verbatim `exact_quote` with its evidence ID and `source_url`, the `persona`, its sighting count from `evidence_ledger.mjs stats` (never typed by hand), and any counterevidence. No paraphrasing - record how they actually describe the problem. Only pains at `frequency_count >= 3` independent `buyer_quote` sources are stated as pain; mark weaker ones `confidence_score: low` (the Research QA gate, `/market-evidence`). First-party call quotes live in the section above and never count toward this `frequency_count`.]

---

### Pain by persona

Every pain row carries the persona who feels it, so the Aaron offer call and `/campaign-strategy` can see which specific buyer feels which pain instead of an averaged ICP.

| Persona | Pain (their words) | Cluster | Source class | Frequency or call outcome | Priority |
|---|---|---|---|---|---|
| [role] | [exact quote] | [C-xx] | first_party_call / buyer_quote / job_posting | [N independent sightings, or won/lost] | High / Med / Low |

**Prioritized personas from the ICP:** [`icp_soft_preferences.personas_to_prioritize` from `client-profile.yaml`]
**Prioritized personas with no pain evidence found:** [list, or "none"]. A prioritized persona with no evidence is a gap to name out loud, not a blank to leave sitting.

If `icp_soft_preferences.personas_to_prioritize` is absent or empty, which is common on a profile written under an older flow, do not stall and do not invent a priority list. Derive the personas from the evidence itself, fill the table from those, and write "ICP supplied no persona priority list, personas below are derived from evidence" on the Prioritized personas line.

---

### Paid Ads Angles (Vector 2)

Angles only. The creative execution is not the finding. Ten to fifty variations behind one angle means the market already pays for that angle.

| Angle (problem named + promise) | Platform | Advertiser | Variations | Running how long | Signal strength |
|---|---|---|---|---|---|
| | Meta / LinkedIn | | [count or Unknown] | [Duration or Unknown] | High / Med / Low |

---

### Signal Summary

| Source | Signal found | Confidence |
|---|---|---|
| First-party sales calls | [the buyer's own words, and the objection that stopped lost deals, or "none available"] | High / Med / Low |
| Persona desire research (Vector 0) | [hypotheses only: which were corroborated and which overturned] | Hypothesis |
| Competitor offers | [what you found, with the denominator] | High / Med / Low |
| Meta Ad Library | [angles with real paid spend, and variation counts] | High / Med / Low |
| LinkedIn ads | [what you found] | High / Med / Low |
| ICP community | [what you found, plus platforms read and unread] | High / Med / Low |
| Job postings | [what you found] | High / Med / Low |

---

### Saturation Map

**Competitors researched (the denominator):** [N]. Below 5, every verdict is INSUFFICIENT SAMPLE and SATURATED may not be fired at all.

| Offer form (what competitors hand the buyer, in plain words) | Competitors using it (of N) | Status | Gap competitors leave |
|---|---|---|---|
| [for example "a free written teardown of the buyer's site"] | [n of N] | SATURATED / CROWDED / OPEN / INSUFFICIENT SAMPLE | [the part of the pain this form does not address, or "no gap found"] |

One row per distinct form found among the competitors researched (and the client's own current offer, marked as the client's, never counted). There is no fixed list of forms to fill in: a form appears only if a competitor actually uses it.

**Saturated forms:** [list, each with the gap competitors leave, or "no gap found"]
**Crowded forms:** [list]
**Open forms (no or one competitor uses it):** [list]
**Unverdicted (INSUFFICIENT SAMPLE, denominator below 5):** [list, or "none, denominator is [N]"]

This map is evidence for the Aaron offer call. It never ranks, limits or closes an offer; Aaron decides what is tested (aaron-lane.md).

---

### Intersection (the commonality step)

**Lowest-hanging pain:** [exact quote and persona, with the evidence behind it: independent `buyer_quote` count and any first-party call]
**Paid-spend validation:** [the Vector 2 competitor angles already selling into this pain's category, or "not validated, lower confidence"]
**The gap competitors miss:** [the part of the pain their ads do not address, with the competitor-complaint quotes that show it]
**In the buyer's words:** [the phrasing from First-Party Buyer Voice, or from Vector 3 when there are no recordings]
**Vector 0 hypotheses overturned:** [list, or "none"]

---

### Evidence notes for the Aaron offer call

**Buyer language to use:** [the exact words from the First-Party Buyer Voice section. Where the client had no recordings, fall back to the Vector 3 quotes and say so. Offer and copy wording is written in these words.]
**Persona with the strongest evidence:** [the persona from the Pain by persona table carrying the strongest, best-evidenced pain, and one line on why the evidence beats the others]
**Proven paid angles:** [from Paid Ads Angles. Name the angle, not the creative.]
**Delivery capacity** is not a filter at research (operator directive 2026-09-22). It is checked at lock by `/lead-magnet-brainstorm` in recorder mode (a scale note or an `offer.qualification` rule).

This section records evidence only. It names no offer form to build or avoid and ranks no offer; Aaron decides what is tested (aaron-lane.md).

### Candidate Generation Input (the evidence table the Aaron offer call reads)

The rows below are not a summary. They are the working input the Aaron offer call reads, so each one must be filled from the sections above rather than restated loosely. Row 1 is the Intersection section's pain. For a multi-segment client (kickoff Step 2.5 confirmed two or more segments whose pain or offer fit differ), write one `Candidate Generation Input` block per segment, headed with the segment slug, so the Aaron offer call decides each segment's own offer set (`offer.segments`, operator decision 2026-09-22).

| # | Persona | Pain, in their words | Cluster (opportunity score) | Evidence strength | Competitor offer forms already aimed at this pain (with the gap they leave) | Notes |
|---|---|---|---|---|---|---|
| 1 | [persona from Pain by persona] | [exact quote, not paraphrase, with its evidence ID] | [C-xx (n/16)] | [strong / good / supporting] | [plain-words forms from the Saturation Map, with n of N, or "none seen"] | [one line] |
| 2 | | | | | | |
| 3 | | | | | | |

**Offer forms by saturation (evidence only):** [Open, Crowded and Saturated forms from the Saturation Map, each with its denominator, the gap competitors leave and the paid-ad spend behind it, which counts as demand evidence. This map is evidence for the Aaron offer call. It never ranks, limits or closes an offer; Aaron decides what is tested (aaron-lane.md).]
**Cross-client priors (optional; patterns only):** [offer patterns that flipped `offer_market_proven` or scaled as winners for OTHER clients in this workspace (their `portfolio-review.md` winners): the offer family, the deliverable's shape, the input asked for, and the next step. Or "none used".]
```

**Cross-client priors are optional and low-confidence (operator-approved 2026-09-21).** A prior is a hint from the record of what happened for other clients, and it never outranks this client's own evidence. It is passed to the Aaron offer call as data only; this skill does not turn it into an offer. Carry patterns only: never another client's name, number, data or copy, and never a prior as copy.

### What to do next (discovery mode)

Hand off to the Aaron offer call (`aaron-lane.md`, Call 1, run by a fresh `/ask-aaron` sub-agent and recorded by `/lead-magnet-brainstorm` in recorder mode) once `/market-evidence synthesize` has returned its verdict (PASS, or HOLD carried forward with its labels: under plain `auto_execute` directly, under `review_gates` only once the operator decides so at Gate 2). Under `review_protocol: phase_checkpoints`, the handoff stays inside Phase 2 (`/phase-2-research-offer`): the verdict goes straight to the Aaron offer call (call 1 in `aaron-lane.md`), `/lead-magnet-brainstorm` records his call, and the verdict and any HOLD reasons lead the Phase 2 checkpoint. This mode is not finished until the brief is usable as-is by the Aaron offer call.

**What carries forward, by section name.** The Aaron offer call opens by reading these five, and reads them rather than rebuilding them:

1. **`Candidate Generation Input`** - the numbered persona + pain + competitor-form evidence rows. This is the primary input the call reads.
2. **`Pain by persona`** - the full table behind those rows, including the prioritized personas with no pain evidence, which are named gaps rather than blanks.
3. **`Saturation Map`** - the competitor offer forms with their denominators and the gaps they leave. Evidence only; it never bounds what Aaron proposes.
4. **`First-Party Buyer Voice`** and **`ICP Pain (in their words)`** - the exact words the offer gets written in.
5. **`_research/pain-clusters.md`** - the clusters behind every row, their counts and opportunity scores, the Research QA verdict, and the Language bank. Every offer the Aaron call proposes cites the clusters it answers (`market-evidence-standard.md` section 12).

Nothing else in this brief is a prerequisite for that handoff. If `Candidate Generation Input` is empty or missing, this mode has not actually finished, so complete it here rather than letting the next step re-derive pain from scratch.

---

## Mode: Validation

> **Research Routing: HARD RULE (Claude deep-research primary, enforced) applies here too.** Validation mode runs research (Vectors 1–4: competitor / ads / ICP-community / job-postings) and is often the path where `run_state.research_routing` is still **unset** (fresh diagnostic session). Apply the same gate as **AI/API Routing** above: `research_routing` has one value, `claude_deep_research` (set it if unset, and treat a retired `third_party_ai` or `claude_native` value as `claude_deep_research`), so the primary brain is the Claude native `/deep-research` fan-out harness (`anthropic-skills:deep-research`), or its declared sub-agent fan-out (`claude-subagent-fanout`) when the harness is unavailable. Do NOT stop to ask, and do NOT satisfy the primary pass with a bare inline WebSearch. The primary pass MUST be an **actual `/deep-research` invocation, or its declared fan-out** (inline WebSearch/WebFetch alone does NOT satisfy it): record `ai_research_provider = claude-deep-research` (or `claude-subagent-fanout`), append the run-log line to `api-balance-ledger.md` (the provenance record the wired check reads), and run the same `research_routing_check.mjs` check with `--skill offer-intelligence`. Finishing with **no `/deep-research` primary** is a **flagged violation**. Thin sub-topics are filled exactly as in discovery mode (a targeted `/deep-research` pass, WebSearch, WebFetch or the browser pane), and extraction runs on small-model sub-agents writing ledger rows. No API key of any kind is needed, and no other AI provider is ever called (no-AI-API rule, operator directive 2026-09-22). **Scope note:** validation mode runs the First-Party Call Vector first, and that vector sits outside this routing path entirely (client-supplied recordings, no external spend, no engine choice). It does NOT satisfy or substitute for the `/deep-research` primary pass on Vectors 1-4. Full rule: `/ai-model-routing`.

### When to trigger

- Live campaign reply rate below 1% after 300+ sends, where the offer is still a plausible bottleneck once the deliverability triggers and list quality are clear (Vector 5 Key diagnostics). Copy sits below the offer in the diagnostic order (Step 1), so a copy check is not a precondition for suspecting the offer. **300 sends only triggers a look, on raw reply rate; it never calls the offer broken.** Calling an offer broken needs about 1,300 first-touch contacts on the arm (Step 2, Minimum threshold; operator directive 2026-09-22)
- Existing offer has live or prior campaign evidence and the client wants to keep it
- User says "let's test a different offer" - run this before `/experiment-design` so the new offer is market-validated, not random
- After the Aaron offer call (recorded by `/lead-magnet-brainstorm` in recorder mode) outputs an offer and you want a second opinion before locking. For a fast, hands-off second opinion, especially on a new offer whose evidence is thin, run `/roast` on the offer: it returns a green-light / reshape / kill verdict plus the single cheapest test to run before committing copy build and list spend. The cheapest honest market test of a thinly-evidenced offer is one arm at the normal per-arm size (about 2,000 first-touch contacts planned, about 1,300 minimum) inside the first wave, beside the other offers, not a separate small wave that cannot reach significance (operator directive 2026-09-22).

Do not use validation mode just because an onboarding form contains a suggested lead magnet or CTA. A form answer is a hypothesis. For new clients and new campaigns, run discovery mode here first (it follows `/icp-onboarding` directly), then the Aaron offer call, with the client suggestion handed to that call as an input, not a locked candidate. No list-side or data-side work is a prerequisite for either, because all of it runs after the offer locks.

### Inputs

For validation mode, the existing offer to evaluate can come from `offer.validation_candidate` in `client-profile.yaml` when onboarding captured an evidence-backed offer, or from `profiles/<business-slug>/lead-magnets.md` when a previously locked offer exists. The evidence must be visible in `offer.validation_candidate_evidence`, prior campaign artifacts, or live send data.

If validation mode is requested but the only offer fields are `offer.client_suggested_*` and no evidence pointer exists, **stop**. Do not run validation mode. Route to discovery mode here (which follows `/icp-onboarding` directly), then the Aaron offer call instead. Client suggestions without evidence are inputs to that call, not validation inputs. This stop is unconditional: missing evidence is the whole reason for it, and the reordering of the chain changes only where the route goes, never whether the stop fires.

- `profiles/<business-slug>/client-profile.yaml` - ICP, value prop, hard filters, `icp_soft_preferences.personas_to_prioritize`
- `profiles/<business-slug>/lead-magnets.md` - the existing offer to evaluate
- The client's own won and lost sales-call recordings - the strongest evidence available for judging whether a live offer matches buyer reality. Request them if not already on file
- `profiles/<business-slug>/offer-intelligence.md` - load if it exists from a prior discovery run (the First-Party Call Vector and Vectors 1-4 may already be done; only run Vector 5 when send data exists)
- `profiles/<business-slug>/_research/` - the evidence ledger, the pain clusters and their Market feedback log, and the competitor cards, when they exist. Step 0 of discovery mode (reuse, never redo) applies here too
- `website-profile.md` and the `website_scrape:` block (the same requirement as discovery mode: run the live scrape per `client-website-scrape.md` if the block is missing or past `refresh_due`). In validation mode it also checks the live offer against what the client actually sells and charges today
- Competitor names or URLs
- Live send data (optional) - reply rate and reply sentiment from current campaign

### Steps

**Step 1: Pre-flight - walk the diagnostic order, then spot obvious broken offers in 2 minutes**

**First, walk the house diagnostic order top-down and stop at the highest broken item (evidence logic for judging an existing offer, operator-approved 2026-09-21).** Do not work on a lower item while a higher one is broken. The highest broken item is the finding, and it names what Iterate or Swap must fix.

0. **Is the buyer real and specific?** A named buyer type with a problem they already know they have, plus role, authority, current situation and exclusions. "Founders" or "B2B companies" is not a buyer.
1. **Is the offer a concrete thing, or a description of the company?** It must say what they get, how fast, what they must do, and what risk they take.
2. **Is every qualified yes being honored, at the volume being sent?** For a live offer this is a fulfillment check against its lock record: a scale note showing it fits the send volume, or an `offer.qualification` rule that decides who gets the free unit and who gets the standard offer (`/lead-magnet-brainstorm` references/saturation-and-scale.md, Deliverable at Send Scale). A qualified yes that goes unhonored is a delivery problem to fix before the offer is judged, not evidence against the offer. An offer locked with neither record gets one now through `/lead-magnet-brainstorm` (operator directive 2026-09-22).
3. **Does the copy lead with the offer, and is every word true?** Only now read the live draft.
4. **Is the next step one easy action, and does each follow-up earn its place?**
5. **Are we judging the right number?** Time-agreed replies per 1,000 first touches beside positive-reply rate, never reply count alone.

Then run the existing offer through four quick questions. They are the fast check for item 1, and they catch structurally broken offers without burning research time.

| Question | Red flag if... |
|---|---|
| Would they want this even if they never buy from you? | No -> it's a pitch dressed as a gift |
| Does it sound like something they would pay for, given free? | No -> low perceived value: a gesture, not a gift worth replying for |
| Does receiving it prove your specific competence? | No -> it's just a gesture |
| Does it require less than 60 seconds from the prospect to claim? | No -> friction kills reply rate |

- 0 red flags: structurally sound. Proceed to research.
- 1 red flag: note the flaw, proceed, factor into final score.
- 2+ red flags: offer is broken structurally. Flag it. Research still runs, but recommendation will almost certainly be Swap.

**Separately, check fulfillment (not a red flag against the offer).** Is every qualified yes the live offer gets being honored as promised, on time, at the current send volume? If not, fix delivery (or add the missing `offer.qualification` rule) before judging the offer. Deliverability at send scale is checked, never scored here (operator directive 2026-09-22).

---

**Step 2: Research vectors**

If a discovery brief already exists at `profiles/<business-slug>/offer-intelligence.md`: the First-Party Call Vector and Vectors 1-4 may already be done. Cross-reference the existing first-party buyer voice, pain-by-persona table, paid-ads angles, saturation map, and signal summary. Run Vector 5 only if a campaign is already live and send data exists.

**When live replies exist, run `/market-evidence feedback` first,** so the replies enter the ledger as strong-tier evidence (objections, competitor mentions, timing reasons, confusion), **then `/market-evidence synthesize`** over the whole ledger. The Go / Iterate / Swap decision is then made on clusters that already include what the market said to this offer. Refresh only the vectors Step 0 finds stale or missing. This step stays dormant until the locked `run_state.sending_platform` is live and has sent: with no replies there is nothing to feed back, so go straight to synthesize.

If no discovery brief exists: run the First-Party Call Vector, then Vectors 1-4. Then run Vector 5 only if a campaign is already live and send data exists.

**First-Party Call Vector and Vectors 1-4** - same as discovery mode above. Run the First-Party Call Vector here whenever the client has recordings: validation mode's whole job is checking an offer against buyer reality, and the client's own won and lost calls are the closest thing to that reality on file. It is not a hard requirement, because some clients record nothing.

**Vector 5 - Live send data**

- Pull reply rate and classify reply sentiment
- Use the positive reply scoring skill for the locked `run_state.sending_platform`, if `/stack-setup` activated a pack that provides one (vendor packs ship their own, e.g. `/emailbison-positive-reply-scoring`).
  - If no pack is active, classify the replies from that platform's own inbox or reply export directly.
  - If neither exists, say so and score the replies by hand against the buckets below rather than implying coverage.
- The replies themselves are evidence: once `/market-evidence feedback` has ingested them as `outbound_reply` rows (tier strong) with their objection, competitor and timing tags, the five buckets below are counted from the ledger rather than re-read by hand

Classify replies into five buckets:

| Bucket | What it signals |
|---|---|
| Interested | Offer resonated - do not change it, unless the interest never moves toward a time (farming interest, below) |
| Not now / wrong timing | Offer is directionally right, timing problem |
| Wrong person | List problem, not offer problem |
| Not interested (no reason given) | Offer did not create desire - likely offer or copy |
| "Already have something" / "we use X" | Offer is commoditized - strong signal to swap |

Key diagnostics, in this order:
- **Deliverability first, but only on a trigger (operator-approved 2026-09-21).** Bounce above the house threshold, a placement test flagging it (a trigger to investigate, never decisive alone), a reply rate sitting near 0.1%, or contacts-per-positive jumping -> run `/email-deliverability-audit` first and do not blame the offer yet. **Open rate is never the trigger:** open tracking stays off on the sending platform, so open rate reads 0% and cannot diagnose anything (house rule: opens are not tracked). The retired open-rate branches are archived at `outbound/_archive/aaron-alignment-2026-09-21/offer-intelligence--vector-5-open-rate-diagnostics.md`.
- Bounce rate above accepted thresholds or repeated wrong-person replies -> list quality problem. Do not swap the offer until the list is fixed.
- **No deliverability trigger fired and the list is clean -> the offer is a live candidate.** Walk the Step 1 diagnostic order; the highest broken item is the finding.
- Copy that fails `/spam-word-checker` or `cold-email-copy-best-practices.md` -> fix it before relaunch (a house QA gate). A clean copy pass never clears the offer: copy sits below the offer in the diagnostic order, and a rewrite cannot save a weak offer.
- "Already have something" replies appearing more than once -> this offer form is saturated in their mind.
- **Positive replies rising with no rise in time-agreed replies -> farming interest:** the offer is easy to say yes to but not specific enough to filter out people who will never buy. Treat it as an Iterate signal, not a win and not a kill: record the finding, and any reshaped offer comes from the Aaron offer call (see Step 5). Time-agreed replies are positive replies whose thread moves toward a time, counted with `/campaign-strategy`'s magnet-inflation-guard proxy; they pick winners and gate scaling, and never move the offer-validation flip, which reads positive replies.

Minimum threshold: do not call the offer broken before an arm has reached about 1,300 first-touch contacts (the flow's per-arm floor; about 2,000 are planned per offer) and its last contacts have had the sequence plus a few days of grace. Below that, variance is too high to trust (operator directive 2026-09-22).

---

**Step 3: Synthesize the signal**

Answer four questions:

1. **What problem does this ICP publicly, repeatedly admit they have?** (Vectors 3 + 4 - use their language)
2. **What offer forms are competitors leading with, and which have real spend or longevity?** (Vectors 1 + 2 - distinguish validated from hypothetical)
3. **Does the existing offer address #1 AND differentiate from #2?** Yes to both -> candidate for Go. No to either -> candidate for Iterate or Swap.
4. **Is the existing offer's form saturated to the point the ICP may be numb to it?** (Saturation table from Vector 1)
   - SATURATED -> record it with the gap competitors leave, and apply the Step 4 penalty
   - CROWDED -> proceed, weight differentiation heavily
   - OPEN -> proceed normally

---

**Step 4: Score the existing offer vs. the market**

| Criterion | Points | Existing offer | Market alternative |
|---|---|---|---|
| Directly addresses #1 ICP pain from signal | 0-2 (0=no, 1=partially, 2=yes) | | |
| Perceived value: it sounds like something they would pay for, given free, ideally anchored to a real price or cost. Delivery effort and scale do not score (operator directive 2026-09-22); deliverability at send scale is a lock check in `/lead-magnet-brainstorm` in recorder mode | 0-1 | | |
| Proves your specific competence in one step | 0-1 | | |
| Requires <60 seconds from prospect to claim | 0-1 | | |
| Differentiated from the field (not just one competitor) | 0-2 (0=same as 3+, 1=same as 1-2, 2=nobody else does this) | | |
| **Total** | **/7** | | |

**Saturation penalty:** If the existing offer's form is SATURATED (denominator 5 or more), subtract 2 from its field differentiation score. The ICP's numbness to the form may be real even if your specific execution is different. This adjusts the score of an existing offer for the verdict; it is evidence, not a ruling on what may be tested.

---

**Step 5: Decision framework**

**Saturation check - run first**

If the existing offer's form is SATURATED and the market alternative uses the same form, name the gap competitors leave for the saturated form and record it beside the scores. Saturation already lowers the existing offer's score through the Step 4 penalty. It never closes the form and never overrides a higher-scoring alternative: heavy competitor ad spend behind a form is evidence of demand, and the market, not the desk, settles whether the pattern is too tired. If no gap can be named, say so in the Recommendation. Any replacement or reshaped offer is not authored here: see Step 5B.

**Normal decision logic**

| Existing offer score | Market alternative score | Decision |
|---|---|---|
| 6-7 | Any | **Go** - existing offer is strong, ship it |
| 5 | 6-7 | **Iterate** - the existing offer needs reshaping; hand off to the Aaron offer call (below) |
| 5 | 5 | **Iterate** - both are mid; hand off to the Aaron offer call (below) |
| 3-4 | 6-7 | **Swap** - the existing offer is weak; hand off to the Aaron offer call (below), with the market alternative's score as evidence |
| 3-4 | 5 | **Swap + test** - neither dominant; hand off to the Aaron offer call, which decides which offers are tested as `offer.validation_arms` (`/campaign-strategy` Offer-Validation Wave, `/experiment-design` offer-only type) |
| 0-2 | Any | **Swap** - structurally broken; hand off to the Aaron offer call (below) |

The score comparison is the verdict evidence on the existing offer. It does not name, rank or write a replacement.

**Go:** Lock the offer in `client-profile.yaml` as the primary. **New offer arms are optional for a Go offer.** The default first-wave test is segments and data sources plus positioning variants of this offer, so `offer.validation_arms` may be `[]` with the reason "validated Go offer"; add arms only when the operator wants them, and only through an Aaron offer call recorded by `/lead-magnet-brainstorm` (operator directive 2026-09-22). Proceed to `/campaign-strategy`.

**Iterate:** Record the failure read (the highest broken item from the Step 1 diagnostic order, the reply buckets, the objections in the ledger, the buyer's own words from Vector 3 and the first-party calls). Re-score the existing offer once against that finding so the verdict is on file. Then hand off, as below. The reshaped offer comes from the Aaron offer call; this skill does not rewrite it.

**Swap:** Record the same evidence and the failure read, plus the competitor-form map and the market alternative's score, then hand off, as below. If `offer.validation_arms` already holds an active arm that passed every rail in `/lead-magnet-brainstorm` (recorder mode), it is reported as an existing option, not chosen here. Write the offer-only experiment hypothesis skeleton for `/experiment-design` only after Aaron's call has named the replacement.

**Hand-off to Aaron (Iterate needing a new offer, and every Swap):** run a fresh `/ask-aaron` offer call (`aaron-lane.md`, Call 1) with these inputs: the evidence-ledger clusters, the failure read, the existing offer as it ran (with its results), the Saturation Map of competitor forms (evidence only), and the first-party and reply language. Aaron proposes the replacement or reshaped offer, and `/lead-magnet-brainstorm` in recorder mode records his answer word for word. The recorded offers then run as a fresh multi-offer flight of simultaneous cells, list and copy frozen so the offer is the only variable, shown on the next `/offer-test-slate`.

Keep the CTA at **direction-level** here: a plain-English ask direction, not exact send copy. Exact CTA wording is deferred to `/campaign-copywriting`, which writes it later under the verified-list gate (`verified-list-gate.md`) and runs it through `spam-word-checker.md` + `cold-email-copy-best-practices.md`. Do not write exact CTA send phrasing to the validation brief or `client-profile.yaml`, because this skill runs before any list exists.

---

**Step 5B: Replacement or unexpected offer (hand-off to the Aaron offer call)**

This skill does not invent a replacement, contrarian or "unexpected" offer. When the Step 5 verdict is Swap, when Iterate needs a new offer, when both the existing offer and the market alternative score below 5, or when someone asks "what's the unexpected offer?", run the Aaron hand-off in Step 5 (a fresh `/ask-aaron` offer call, `aaron-lane.md`, Call 1). Give it the evidence, the failure read and the Saturation Map of competitor forms. Aaron proposes the offer; `/lead-magnet-brainstorm` in recorder mode records it.

---

**Step 6: Output**

Preserve the discovery brief at `profiles/<business-slug>/offer-intelligence.md`. Save each validation run separately to:

```text
profiles/<business-slug>/offer-validations/YYYY-MM-DD-offer-validation.md
```

Save the CTA at **direction-level** only (`lead_magnet_cta_direction`, a plain-English ask, not final copy), matching the Locked offer block below. Exact send copy is produced later by `/campaign-copywriting` under the verified-list gate (`verified-list-gate.md`). Do not save exact CTA send copy here.

```markdown
## Offer Intelligence - [Business Name] (Validation)
**Date:** YYYY-MM-DD
**Mode:** Validation
**Existing offer evaluated:** [what they had]
**Evidence reviewed:** [offer.validation_candidate_evidence, campaign artifact, or send-data source]
**Pre-flight red flags:** [0 / 1 / 2+ - list any]
**Competitors researched:** [N] (floor is 5, see Vector 1)
**First-party call recordings reviewed:** [N won / N lost, or "none available from client"]
**Decision:** Go | Iterate | Swap
**Evidence base:** [ledger rows by tier, clusters used (IDs), replies ingested; Research QA verdict and date]

---

### Signal Summary

| Source | Signal | Confidence |
|---|---|---|
| First-party sales calls | | |
| Competitor offers | | |
| Meta Ad Library | | |
| LinkedIn ads | | |
| ICP community | | |
| Job postings | | |
| Send data | | |

**Saturation status of the existing offer's form:** [SATURATED / CROWDED / OPEN / INSUFFICIENT SAMPLE] - [the form in plain words, competitors using it out of competitors researched. SATURATED may not be fired on a denominator below 5.] Evidence for the Aaron offer call; it never ranks, limits or closes an offer (aaron-lane.md).

**Saturation Map (competitor offer forms, evidence only):** [the same table as in discovery mode: form, n of N, status, gap competitors leave]

---

### ICP Pain (in their words)
[3-5 bullets in their exact language, each tagged with the `persona` who voiced it and its source class. First-party call quotes are labelled as such and never blended into the public-source counts.]

---

### Scorecard

| Criterion | Existing | Market alternative (the strongest competing offer form found, scored as evidence only) |
|---|---|---|
| Addresses #1 ICP pain | | |
| Perceived value | | |
| Proves competence | | |
| Low prospect friction | | |
| Differentiated from field | | |
| **Total /7** | | |

---

### Recommendation
[One paragraph - state the decision, name the existing offer, cite the evidence, note what to watch for. On Iterate or Swap, say that the replacement or reshaped offer is pending the Aaron offer call.]

---

### Locked offer

Fill this block only on a **Go** (the existing offer, locked as it ran). On Iterate or Swap write "Pending: fresh Aaron offer call (aaron-lane.md, Call 1)" and fill it from the recorded call once it exists.

**Offer name:**
**What it is:** [one sentence]
**Delivery method:** [what you actually send or do]
**CTA direction:** [plain-English ask direction; exact copy belongs in /campaign-copywriting]
**Why this over the alternatives:** [one sentence]

---

### If decision is Iterate or Swap - hand-off to the Aaron offer call

Record here the inputs handed to the fresh `/ask-aaron` offer call: the failure read (highest broken item, reply buckets, objections), the evidence clusters used (IDs), the existing offer and its results, and the Saturation Map of competitor forms (evidence only). Aaron proposes the replacement or reshaped offer; `/lead-magnet-brainstorm` in recorder mode records it. The recorded offers run as a fresh multi-offer flight of simultaneous cells with list, copy and infrastructure frozen, so the offers are the only variable, and `/experiment-design` formalizes the offer-only experiment from the offer Aaron named.
```

Update `client-profile.yaml`:

```yaml
offer:
  lead_magnet: <locked offer name>
  lead_magnet_details: <one sentence>
  lead_magnet_cta_direction: <plain-English ask direction, not final copy>
  offer_intelligence_run: YYYY-MM-DD
  offer_decision: go | iterate | swap
  saturation_status: saturated | crowded | open | insufficient_sample
  offer_validation_run: YYYY-MM-DD
  offer_validation_path: profiles/<business-slug>/offer-validations/YYYY-MM-DD-offer-validation.md
```

Only add `offer_validation_run` and `offer_validation_path` when validation mode runs. Keep the existing offer fields compatible for downstream skills. On **Swap + test**, the second offer is an entry in `offer.validation_arms` (same fields as the primary block, `/lead-magnet-brainstorm` Save Output) only after the Aaron offer call has named it and `/lead-magnet-brainstorm` in recorder mode has recorded it and run its rails; this skill never writes a new offer into the profile. On Iterate or Swap, leave the `lead_magnet*` fields as they are until that record exists.

---

## Common mistakes

- **Using competitor offers as confirmation without checking saturation.** Three competitors offering a free teardown is not validation that yours will work. It is demand evidence and a fatigue warning at once. Count the field, then name the gap they leave and pass both to the Aaron offer call.
- **Authoring the replacement offer here.** On a Swap or an Iterate that needs a new offer, this skill records the evidence and hands off to a fresh Aaron offer call. It never names, ranks or writes the new offer itself.
- **Swapping offer and copy at the same time.** Combined experiment. You will learn nothing about which change drove the result. Swap the offer, freeze everything else, run `/experiment-design`.
- **Calling the offer broken before an arm has reached about 1,300 first-touch contacts.** Variance is too high below the flow's per-arm floor, and deliverability and list issues look identical to offer problems at low volumes (operator directive 2026-09-22).
- **Letting saturation rank, limit or close an offer.** The saturation count is evidence, reported by offer form with the gap competitors leave. Competitor ad spend behind an offer is evidence of demand, so a saturated form with a real gap is still open to the Aaron offer call. Aaron decides what is tested (`aaron-lane.md`).
- **Treating reply rate alone as an offer problem, or a copy fix as clearing the offer.** Rule out deliverability when one of its triggers fires (bounce above the house threshold, a placement-test flag, reply rate near 0.1%, contacts-per-positive jumping) and rule out list quality; then walk the diagnostic order (Step 1), where the offer sits above the copy. Open rate is never the trigger: opens are not tracked in this system (operator-approved 2026-09-21).
- **Calling an offer a winner on positive replies alone.** Report time-agreed replies per 1,000 first touches beside the positive-reply rate; a positive lift with no rise in time-agreed replies is farming interest.
- **Iterating the offer without carrying the buyer's language into the hand-off.** The Aaron offer call needs the ICP's own words from Vector 3 and the first-party calls alongside the failure read. Handing over only your own description of the problem gets the same result.
- **Skipping discovery mode because "the client already has a strong offer."** Strong relative to what? Run discovery first so the Aaron offer call is informed, not assumed.
- **Reconstructing every pain from public strangers while the client's call recordings sit unopened.** Public buyer voice is a proxy. The client's own won and lost sales calls are the buyer saying it directly, in the exact words the offer should use, about this exact category. Ask for the recordings before you mine forums. If the client genuinely has none, state that in the brief rather than letting the gap pass unnoticed.
- **Flattening pain into one ICP blob.** Two personas inside the same ICP feel different pains, and an offer aimed at their average is urgent to nobody. Every pain row carries a `persona`.
- **Firing SATURATED off three competitors.** Three is not a field. Research 5 to 10, record the denominator, and mark the offer form INSUFFICIENT SAMPLE below 5 instead of guessing.
- **Listing Reddit as researched when nothing was read.** The harness cannot read Reddit, and operator paste is the only route. Report the pasted threads and the quotes they gave, or write "Reddit: unread". A platform named in a list is not a platform read.
- **Treating the persona research as buyer pain.** Vector 0 is a model's educated guess about the persona. It tells you where to look and what words to search with. Only a real buyer saying it, in public or on a client call, makes it pain.
- **Typing counts by hand.** "Appeared in 12 threads" comes from `evidence_ledger.mjs stats`, never from a tally kept in the session. Hand counts drift and double-count syndicated quotes.
- **Handing the offer call thin research before the Research QA verdict.** The Intersection step and the Candidate Generation Input wait for `/market-evidence synthesize`. A HOLD is carried forward with its labels (under `review_gates`, after the operator's Gate 2 decision), never skipped silently.
- **Redoing research that already exists.** Step 0 reads the ledger and any older research first; a refresh fills gaps, it does not restart.
- **Reading the ad creative instead of the ad angle.** Fifty variations of one angle is the finding. The headline wording and the imagery are the advertiser optimizing around something already proven, not the proof itself.

---

## Integration

| Skill | Relationship |
|---|---|
| `/market-evidence` | Called after the vectors (`synthesize`: clusters, counts, opportunity scores and the Research QA gate) and after launch (`feedback`: replies and calls become evidence, dormant until the sending platform is live). This skill collects; `/market-evidence` counts, checks and learns. Standard: `market-evidence-standard.md`. |
| `/icp-onboarding` | Runs immediately before this skill. Produces the ICP, the value prop, `icp_soft_preferences.personas_to_prioritize` (the persona list every pain row maps against), `sales_call_library` (whether the client's won and lost recordings exist and where, which the First-Party Call Vector reads before asking the client for anything), and `buyer_pain_hypothesis` (the client's unverified belief about buyer pain, which this skill confirms or overturns). |
| `/lead-source-strategy` | Runs in Lead Source Plan Mode AFTER campaign selection, far downstream of this skill. The chain is: buyer and pain, then the offer, then the list built to fit that offer, then the copy. Nothing it produces is a prerequisite here. |
| `/lead-magnet-brainstorm` | Runs after discovery mode as the RECORDER of the Aaron offer call. It records Aaron's answer word for word and runs the rails; it does not select forms or generate candidates from this brief. |
| `/offer-test-slate` | Shows this brief's findings to the client (buyer types, problems in the buyer's words, the gap competitors leave) beside the offers the Aaron offer call decided (recorded by `/lead-magnet-brainstorm`), before the test. Client approval is optional. After the wave reads out, its scale review reports the results to the client and reviews the winner's `offer.qualification` rule; it is not a volume gate (operator directive 2026-09-22). |
| `/campaign-strategy` | Reads the locked offer from `client-profile.yaml` and the data-point catalog. The front-end offer suggestions section should defer to this output. |
| `/experiment-design` | If validation mode decision = Iterate or Swap, the hand-off to the Aaron offer call comes first; once Aaron has named the offer, the offer-only experiment hypothesis is written for `/experiment-design` to formalize, and the offers run as a fresh multi-offer flight recorded through `/lead-magnet-brainstorm`. |
| `/roast` | Optional fast pre-lock stress test of a candidate offer (hands-off council → green-light / reshape / kill + the single cheapest 48-hour validation test). Useful for a new offer before committing build and spend; complements this skill's evidence-based Go/Iterate/Swap rather than replacing it. |
| `/ask-aaron` | Makes the offer call right after this skill's research passes the Research QA gate, and his call is final below the operator (the Aaron lane, operator directive 2026-09-24, `aaron-lane.md`, Call 1). A fresh sub-agent reads Aaron's live Notion content bank and decides what offers are tested; this skill's brief is one of its inputs, and on a validation Iterate or Swap this skill hands the failure read and evidence to a new call. It never sends or spends; `/lead-magnet-brainstorm` records his call. Complements the evidence-based Go/Iterate/Swap verdict rather than replacing it. |
| `/phase-2-research-offer` | Runs this discovery mode (or validation mode on a real existing offer) after Phase 1 (`/phase-1-onboarding`, which ran `/icp-onboarding`), then the Research QA gate, the Aaron offer call and `/lead-magnet-brainstorm`; `/data-point-discovery` follows once the offer is locked. `/cold-email-kickoff` routes to it (`phase-protocol.md`). |
| `/cold-email-weekly-rhythm` | If a running campaign's raw reply rate drops below 1% after 300+ sends, its Monday 1% rule sends it to `/deliverability-incident-response` first; once that clears deliverability and the list, it opens validation mode here (a look, not a verdict: calling the offer broken needs about 1,300 first-touch contacts per arm) before copy or list change. Its cross-campaign offer diagnosis and `/market-evidence feedback`'s routing rules (repeated contradiction, `already_have` or `confusion` in replies) open validation mode too. |
| `/email-deliverability-audit` | Run it first when a deliverability trigger fires: bounce above the house threshold, a placement-test flag (a trigger to investigate, never decisive alone), reply rate near 0.1%, or contacts-per-positive jumping. Open rate is never the trigger, because opens are not tracked in this system (open tracking stays off on the sending platform). Do not diagnose the offer while a trigger is open. |

## What to do next

- **Discovery mode complete** (the Research QA verdict is PASS, or HOLD carried forward with labels, which under `review_gates` needs the operator's Gate 2 decision first): Hand off to the Aaron offer call (`aaron-lane.md`, Call 1; recorded by `/lead-magnet-brainstorm` in recorder mode). It reads the brief at `profiles/<business-slug>/offer-intelligence.md`, starting from its `Candidate Generation Input` and `Saturation Map` sections. Nothing list-side or data-side has run at this point, and none of it is needed for the handoff.
- **Validation - Go:** Proceed to `/campaign-strategy`. Offer is locked in `client-profile.yaml`. New offer arms are optional; the default test is segments and data sources plus positioning variants of this offer.
- **Validation - Iterate:** Record the failure read and re-score the existing offer once, then hand off to a fresh Aaron offer call (Step 5). The reshaped offer comes from Aaron and is recorded by `/lead-magnet-brainstorm`; the market reads it, not the desk score (operator directive 2026-09-22).
- **Validation - Swap:** Record the evidence and hand off to a fresh Aaron offer call (Step 5). The recorded offers run as a fresh multi-offer flight of simultaneous cells, with list and copy frozen; `/experiment-design` formalizes the offer-only hypothesis (operator directive 2026-09-22).

