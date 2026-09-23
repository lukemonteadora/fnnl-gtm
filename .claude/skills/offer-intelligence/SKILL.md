---
name: offer-intelligence
description: "Two-mode offer research skill. Discovery mode runs FIRST on the offer path, immediately after /icp-onboarding and before /lead-magnet-brainstorm, and requires no list-side or data-side work beforehand. It opens by reading the research that already exists (it never redoes research), grounds the work in a free 10 to 25 company research sample, and follows Aaron Shepherd's three-input research method, leading with buyer pain: the client's own won and lost sales-call recordings, five-layer persona desire research, real public complaints (Reddit, review sites, forums, with an honest record of which platforms were actually read), competitor cards and offer saturation across 5 to 10 competitors, paid-ad angles from the Meta Ad Library and LinkedIn read in the built-in browser pane, and job postings, with every pain row mapped to the persona who feels it, so the brainstorm invents from evidence. Every piece of evidence becomes a tiered, sourced row in the client's evidence ledger (market-evidence-standard.md). /market-evidence synthesize then counts, clusters, scores and gates it (Research QA: PASS, DEEPEN with at most two targeted loops, or HOLD) before the Intersection step hands /lead-magnet-brainstorm a named Candidate Generation Input block (persona + pain + open archetype rows citing cluster IDs) that candidate generation consumes directly instead of re-deriving pain. Obtainability and the list are worked out later, after the offer locks. Validation mode runs standalone when a live campaign underperforms and evaluates an existing offer against market evidence, including the replies it earned, with a Go / Iterate / Swap decision."
---

# Offer Intelligence
## Canonical Profile Root

All profiles/<business-slug> paths in this skill resolve under:

```text
<outbound>/profiles
```

Here `<outbound>` is the root of this skill library - resolve it to wherever the library is currently checked out (local Documents, OneDrive, or a git worktree); never hardcode an absolute path. Do not create client profiles under a `profiles/` folder at your current working directory.

Cold email operators default to two failure modes: (1) copying whatever offer their competitors use, or (2) brainstorming in a vacuum with no market signal. This skill escapes both.

**In discovery mode**, it runs first on the offer path, immediately after `/icp-onboarding` and before the offer exists. It researches buyer pain and the market so that `/lead-magnet-brainstorm` invents from evidence, not from gut feel. The order of the whole chain is: buyer and pain, then the offer, then the list built to fit that offer, then the copy. Nothing in this mode waits on any list or data work.

**Discovery mode is the research phase, and it does two jobs in order (Aaron process alignment, operator directive 2026-09-22).** First it **extends and clarifies what onboarding captured**: read what `/icp-onboarding` recorded, name what is thin, vague or missing (the buying function, the pain hypothesis, the competitors, the call library), and close those gaps from the client's site, the client, or the research itself. The intake ICP is a starting point, not a ceiling; the offer may later widen or narrow it. Then it **researches the vertical, the market and the ICP for real problems in the buyers' own words**: the client's won and lost sales calls first; then public opinion from the vertical on review sites, forums and public posts (Aaron, Sep 21: "mine demand, see what people are talking about ... the objections that people have"), with Reddit read only from an operator paste and X or LinkedIn posts only where WebSearch returns them, each gap logged (Vector 3); then competitor offers and what competitors fund in paid ads (the Meta Ad Library and LinkedIn ads, read in the harness's built-in browser pane, with WebSearch only to find an advertiser's page). **Heavy competitor ad spend behind an offer is evidence of demand** (Aaron, Sep 21), never a reason to close an offer type. In an unfamiliar market, Claude sub-agents do the research (Aaron, Sep 21, reaches for Claude when the space is unfamiliar; here that is the `/deep-research` fan-out plus WebSearch, WebFetch and the built-in browser pane in AI/API Routing, never another research provider). The output is a set of real, named problems with sources, which feeds the offer. **Every piece of evidence is written as a row in the client's evidence ledger** (`_research/evidence.csv`, per `market-evidence-standard.md`), raw captures stay in the run folder, and the research does not hand off to offers until `/market-evidence synthesize` has counted, clustered, scored and checked it (the Research QA gate). The brief this skill writes is the synthesis on top of that ledger, never the only place the evidence lives.

**In validation mode**, it runs after an offer is live - evaluating whether the offer is strong, weak, or invisible due to saturation, and deciding whether to keep it or swap it.

## The saturation problem

Market evidence cuts both ways. If competitors are leading with "free audit" and have been for 18 months, that is not evidence that "free audit" works today. The ICP may have seen it 400 times and auto-delete it, and following the market into a saturated offer makes you the fifth cold email this week saying the same thing. It is also evidence that buyers care about the problem: heavy competitor ad spend behind an offer shows demand (Aaron, Sep 21: when competitors put "a massive amount of spend behind something ... we know that that offer is something that people actually care about").

So saturation **lowers an offer's rank and requires naming the gap competitors leave**; it never closes an archetype and never overrides a higher-scoring alternative (Aaron process alignment, operator directive 2026-09-22; supersedes "the right response to a saturated market is a contrarian offer" as the only answer). Two answers compete on the same rubric: the same archetype aimed at the gap the competitors leave, and a contrarian offer (the archetype the ICP has never been pitched in this context), whose pattern interruption has conversion value that no rubric score can capture.

## Offer Architecture gate (shared with copy)

Both modes here feed the three-question Offer Architecture gate that `/campaign-copywriting` runs before Email 1: (1) SQL vs MQL framing, (2) the easy-to-say-yes-to test, (3) a named risk reversal. Evaluate the offer against these as you research. In discovery mode, prefer directions that can name a clean risk reversal and pass the easy-yes test. In validation mode, a Go decision requires all three to hold; a missing risk reversal or a failed easy-yes test is an Iterate or Swap signal, not just a copy problem. Full gate: `/campaign-copywriting` Offer Architecture. In Aaron's method the risk reversal is the free front end itself plus casual risk elimination, never a money-back guarantee or a performance guarantee on the core service (doctrine §3, §6; examples §5), and in validation mode a Go also needs the Step 1 diagnostic order to come back clean (doctrine §2).

## Material Decision Rule

When this skill reaches a material fork, name the realistic options, recommend the strongest path, and explain why the main alternatives are weaker before committing.

Ask before choices that affect spend beyond an approved budget, provider routing, source of truth, list quality, campaign direction, client-facing output, live systems, scraping or account risk, or legal/compliance risk. For low-risk reversible choices, state the recommendation and proceed.

**Research findings and offer directions are never filtered out of view (operator directive 2026-09-22).** Report every direction the evidence supports, with its evidence strength, so `/lead-magnet-brainstorm` can generate from all of them. A weak or saturated direction is labelled and ranked, not dropped. The only thing never proposed is a direction that would be illegal or deceptive to send.

When asking the user, use the Claude Desktop native Interactive Inputs / Choice Prompts pattern from /clarification-first: recommended option first, short choices, and Custom answer last when a custom answer is plausible.

## Interaction Policy

Defers to `/autonomous-execution-policy`. Under `run_state.execution_mode = auto_execute` (the operator's default), proceed without pausing: pick the strongest option per this skill's rubric, record it to `run_state`/profile, and continue. Never re-ask a decision already in `run_state`, the profile, memory, or the operator's latest message. Stop only for the policy's hard-stops (spend over the approved ceiling, live send, credentials, provider/source-of-truth change, safety gates). On a long async wait, background-poll and move to other productive work. Never idle.

---

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short: record status, not raw output. Full protocol: `client-activity-log.md`.

## Mode: Discovery

### When to trigger

- Invoked by `/cold-email-kickoff` immediately after `/icp-onboarding`, before `/lead-magnet-brainstorm`
- When starting fresh with no existing offer
- When the user wants to understand the market before deciding what to offer

This mode runs from the client profile, the client website, the client's own sales-call recordings, and public buyer voice alone. It does not wait on any list, data-point, or obtainability work, all of which now run after the offer locks so they are measured against a real offer instead of a guessed one.

### What this mode does

Runs Step 0 (research scope: reuse what exists) and the research sample, then the First-Party Call Vector and Vectors 0-4 with every item written to the evidence ledger, then `/market-evidence synthesize` and its Research QA gate, then the Intersection step. No send data exists yet because no campaign exists. Builds a market signal brief covering buyer pain in the buyer's own words (first-party from the client's won and lost calls, then public), each pain mapped to the persona who feels it, a saturation map of which offer archetypes are overused in this space, and the open or contrarian archetypes that `/lead-magnet-brainstorm` should build toward.

Does **not** evaluate an offer or output a Go/Iterate/Swap decision. There is nothing to evaluate yet. The output is research that feeds invention.

### AI/API Routing

> **Research Routing: HARD RULE (Claude deep-research primary, enforced; no-AI-API rule, operator directive 2026-09-22).** `run_state.research_routing` has exactly one value, **`claude_deep_research`**. If it is unset, set it to that and proceed. If it still holds a retired value (`third_party_ai`, or the bare-WebSearch `claude_native`), treat it as `claude_deep_research` and note the correction in the activity log. The primary research brain is the Claude native `/deep-research` fan-out harness (`anthropic-skills:deep-research`, run through the Skill tool: multiple sub-agents research every needed category in parallel, fetch real sources, adversarially verify each claim, and synthesize a cited report). When the harness is unavailable or rate-limited, its declared fallback is a flat fan-out of 4 to 8 research sub-agents from the same brief, logged as `claude-subagent-fanout`; that is still Claude Code, never another provider. Do NOT stop to ask, and do NOT satisfy the primary pass with a bare inline WebSearch. The primary pass MUST be an **actual `/deep-research` invocation, or its declared fan-out when the harness fails** (inline WebSearch/WebFetch alone does NOT satisfy it): record `ai_research_provider = claude-deep-research` (or `claude-subagent-fanout` when the fallback ran) and append the run-log line to `api-balance-ledger.md` (a provenance record the wired check reads, not an AI spend row). A research step that finishes with **no `/deep-research` primary** is a **flagged violation** (run it, or get a fresh explicit OK to skip). **Wired check:** after the primary pass, run `node scripts/research/research_routing_check.mjs --skill offer-intelligence --client <business-slug> --json`. A `violation:true` / exit 1 means no logged primary; do not declare this research step done until it passes. No API key of any kind is needed: research runs only on Claude Code itself (the harness, its sub-agents, WebSearch, WebFetch and the built-in browser pane), and no other AI provider is ever called. **Scope note:** the First-Party Call Vector sits outside this routing path entirely, because it reads client-supplied recordings and transcripts, spends nothing externally, and picks no engine. It does NOT satisfy or substitute for the `/deep-research` primary pass, so running it first leaves the primary-pass requirement and the wired check exactly where they were. Full rule: `/ai-model-routing`.

This skill runs at `pass_depth = deep` on the single research path in `/ai-model-routing`, which is Claude Code native only (no-AI-API rule, operator directive 2026-09-22); there is no cheap/standard tier to pick. Assemble the research brief (goal, ICP, decision, output, freshness, confidence, source types, VOC?, assumptions, open questions). The Claude native `/deep-research` fan-out harness runs the primary broad pass (web-grounded competitor/ad/market research + cited source discovery via parallel sub-agents, adversarial verification, cited synthesis). Every data step names a capability role, never a vendor, and the stack contract says which tool fills it; a role whose slot is empty, `held` or `not_chosen` is skipped and noted, never filled with a plausible vendor. The AI roles are retired: there is no research-provider, bulk-classification or copywriting model slot to fill, and `web.search` / `web.crawl` are simply the harness's own WebSearch and WebFetch. The routing: WebSearch is a discovery helper that returns raw URLs, not a second research brain; raw page extraction → WebFetch, plus the harness's built-in browser pane (`mcp__Claude_Browser__navigate`, then `get_page_text`) for pages that render only client-side, such as the Meta and LinkedIn ad libraries. The browser pane is read-only here: never log in, decline non-essential cookies, and read one page at a time rather than across parallel sub-agents. Never fall back to Claude in Chrome for research, because it acts in the operator's real browser with their own sign-ins. **Persona desire research (Vector 0) → inside the `/deep-research` primary pass**; **ICP-pain VOC mining (Vector 3) → the VOC / Raw-Evidence pipeline**, run against the platforms Vector 3 lists as readable, with `source_class` kept (Reddit follows Vector 3's own Reddit rule: operator paste only); evidence extraction → sub-agents on a small model tier (the Agent tool's `model` setting, for example `haiku`) writing ledger batch files over disjoint batches of the raw captures per `/personalization-subagent-pattern` (one output file per agent, then a post-merge dedup); clustering, counting, scoring and the gate → `/market-evidence synthesize`. The live X / social read no longer exists, so note that gap rather than filling it. After the primary pass, fill ONLY its gaps (thin / technical / multi-step coverage, weak or unsupported claims, missing counterexamples, overclaimed ICP, contradictions) with a second targeted `/deep-research` pass or targeted WebSearch, WebFetch or browser-pane reads; never another AI provider, and never a duplicate broad pass. When the corpus is too big or references too many, use **scale mode**: WebSearch EMITS ranked URLs → sub-agents working disjoint URL batches read them with WebFetch and compress each batch → the main Claude Code session merges and synthesizes. The Validation Gate is the Research QA gate in `/market-evidence synthesize` (see "Evidence synthesis and the Research QA gate" below): a public pain still counts only at 3 or more independent `buyer_quote` sightings, now counted by `outbound/scripts/research/evidence_ledger.mjs stats` rather than by hand, counterexamples kept. The brief this skill writes is research, not copy. Keep CTA wording out. Final copy is written later by `/campaign-copywriting` (Claude Code native, clean-packet sub-agent) and any CTA must still pass `spam-word-checker.md` and `cold-email-copy-best-practices.md`.

### Inputs

- `profiles/<business-slug>/client-profile.yaml` - ICP, value prop, hard filters, and `icp_soft_preferences.personas_to_prioritize` (captured by `/icp-onboarding`, and the list every pain row is mapped against)
- The client's own recorded sales calls, won and lost. **Check `sales_call_library` in `client-profile.yaml` FIRST**, because `/icp-onboarding` already asked for this at intake and recorded whether recordings exist, where they live, the rough count, and the won/lost mix. Only request them from the client when that field is absent or says access is still pending. Re-asking for something intake already captured wastes the client's patience on the exact step that depends on their goodwill. `sales_call_library.exists: false` is a real answer: a stated gap, not a prompt to ask again
- `buyer_pain_hypothesis` in `client-profile.yaml` - the client's own unverified belief about what their buyers struggle with, captured at intake. Treat it as the hypothesis this mode sets out to **confirm or overturn**, never as a finding. Where public buyer voice and first-party calls contradict it, say so plainly in the brief: a client wrong about their own buyers' pain is one of the most valuable things this research can surface
- `profiles/<business-slug>/slack-context.md`, when the client Slack check (`client-slack-check.md`) found anything: what the client and the team said in Slack about the buyers, won and lost deals, competitors and objections, plus any call-recording links. A recording or transcript linked there goes through the First-Party Call Vector like any other recording. A Slack message itself is client-stated, the same class as `buyer_pain_hypothesis`: never tag it `first_party_call`
- Client website URL
- Competitor names or URLs - ask if not already in the profile. Target 5 to 10, see the sample-size floor in Vector 1
- **Research that already exists** - the `research_artifacts:` block in `client-profile.yaml`, everything in `profiles/<business-slug>/_research/`, an older `offer-intelligence.md`, `offer-validations/`, and any older research folder kept in another shape (for example `research/`, `_research-raw/` or `first-party-calls/`). Step 0 reads these first so no research is repeated

This mode has no list-side or data-side prerequisite of any kind. Proceed from the client profile, the client website, the client's own call recordings, and public buyer voice. Do not route back to `/lead-source-strategy` or `/data-point-discovery` to satisfy this mode: both run after the offer locks.

### Steps

**How this maps to Aaron's research method (operator directive 2026-09-22).** Aaron researches an offer from three inputs and then intersects them (2026-06-22 and 2026-04-06 videos, doctrine §5): (1) deep research on what the buyer persona deals with every day, at a business level and a personal level; (2) 5 to 10 competitors' Meta ads, to see which angles already have money behind them; (3) the client's won and lost sales calls, for the buyer's exact words. Here, (1) is Vector 0 plus the complaint mining in Vector 3, (2) is Vectors 1 and 2, (3) is the First-Party Call Vector, and the Intersection step after Vector 4 is his "find the commonality, validate it, reword it" move. Vector 3 goes one step past Aaron: his step one is model-led research, and a model-generated pain is a hypothesis, not a fact (doctrine §5, step 1), so Vector 3 checks those hypotheses against what real buyers complain about in public.

**Step 0 - Research scope: reuse what exists, never redo it**

Before any new research, read what the client already has (the "Research that already exists" input above) and decide the scope of this run:

| Situation | Scope | Run folder |
|---|---|---|
| No research on file (new client, new market) | Full Stage 1: every vector below | `_research/runs/<YYYY-MM-DD>-discovery/` |
| Research exists but `research_artifacts.last_refreshed` is older than 90 days, or a new segment, market or offer direction starts | Refresh: re-run the stale or missing vectors only; carry the rest forward | `_research/runs/<YYYY-MM-DD>-refresh/` |
| The Research QA gate returned DEEPEN | Targeted Stage 2: only the gaps its deepen brief names | `_research/runs/<YYYY-MM-DD>-deepen-<n>/` |
| Research is current and passed the gate | Skip to the Intersection step; say so | none |

**Older research is referenced, never moved.** When a client has research on file in an older shape (numbered research notes, a raw-capture folder, a `research/` folder, a folder of call transcripts, a buyer-voice table), extract its quotes and findings into ledger rows once, with `raw_ref` pointing at the original file and `collected_by: legacy-seed`, before new research starts. Then research only what the seeded ledger lacks. Record the original paths in `research_artifacts.legacy_files`.

**Step 0.5 - The research sample (free)**

Before drawing any conclusion, name 10 to 25 real companies that fit the ICP and write them to `_research/market-sample.md` (`market-evidence-standard.md` section 11): the client's named customers and case studies, competitors' named customers, employers found through job posts, and search results that match the ICP. It grounds persona research and job-post reading in real companies and makes the ICP-specificity check concrete. It is **not** the seed set (seeds are chosen for offer fit, after lock, by `/social-proof-bank`), and it triggers no paid lookup: no call to the company-discovery tool, the contact discovery tool or the contact enrichment tool before the offer locks. Build it from public pages with WebSearch and WebFetch.

**How every vector records its evidence**

Each vector's sub-agent writes its findings as ledger rows (`market-evidence-standard.md` section 3) to its own batch file, `_research/runs/<run>/batch-<vector>-<n>.json`, and saves any capture that cannot be re-fetched (an operator paste, a browser-pane page text, a transcript excerpt) in the same run folder. A short narrative note per vector (`<vector>-notes.md`) is optional working material. The orchestrator ingests the batches with `node outbound/scripts/research/evidence_ledger.mjs ingest --client <business-slug> --in outbound/profiles/<business-slug>/_research/runs/<run> --run <run>`, fixes any rejected row from its source, and never types rows or counts by hand. The ledger is written only through that script. The evidence types each vector produces:

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

Then **reword the offer direction into that language**. If the client's buyers say "coverage gaps" and the client's own website says "risk exposure optimization", the offer says "coverage gaps". This rewrite is the point of the vector, not a nice-to-have: carry it into the brief as an explicit offer-language line that `/lead-magnet-brainstorm` and `/campaign-copywriting` inherit.

**Hard rules for this vector:**
- **Never fabricate a quote.** If you did not read it in a real recording or transcript, it does not go in the brief.
- **Never present a public quote as a first-party one.** `source_class` is the guard. `first_party_call` means a real client sales call and nothing else.
- **A first-party quote does not count toward Vector 3's `frequency_count`.** The `frequency_count >= 3` floor governs public buyer voice and stays exactly as it is. First-party call evidence is a different and stronger class, so a single objection from a real lost deal is reportable on its own, tagged and outcome-labelled. Do not mix the two pools in either direction.
- **If the client has no recordings, state that plainly in the brief** in the First-Party Buyer Voice section, mark that section's confidence Low, and proceed on public buyer voice alone. Do not silently omit the section, and do not quietly backfill it with Vector 3 material.

This vector reads client-supplied material, so it carries no external research spend and no routing gate of its own.

---

**Vector 0 - Persona desire research (Aaron's five layers)**

Aaron's step one is deep research on what the buyer persona deals with day to day, at a business level and a personal level, because the pain that makes a stranger reply sits where the two meet (2026-06-22, 2026-04-06). Run it inside the `/deep-research` primary pass, once per persona in `icp_soft_preferences.personas_to_prioritize` (or once per persona the evidence derives, when that list is empty), using the four inputs he feeds it: persona and job title, industry, geography, and the client's service.

Cover five layers per persona:

1. **Business pain points:** the operational and revenue problems the role owns.
2. **Emotional and personal drivers:** what the person fears, wants, or is judged on. His worked example: the driver was not "I need help with staffing", it was "I need someone who won't waste my time and will actually deliver."
3. **Trigger events:** the moments that make this persona reachable (a funding round, a lost key hire, a regulation change, a new target). Record them here; `/data-point-discovery` later decides which ones the list can actually detect.
4. **Worldview and language:** what they believe about the problem, the words they use for it, and the phrasing that gets a cold email filtered out.
5. **Competitive landscape:** what they have already been pitched, bought, or tried.

**Everything Vector 0 produces is a hypothesis.** Tag each row `source_class: model_hypothesis`. A model's account of a persona's pain is a guess until a real buyer says it, so a hypothesis never counts toward `frequency_count`, never enters the ICP Pain section as pain, and never enters copy as a fact about a named person (doctrine §5, step 1). Its jobs are to tell Vector 3 which complaints to hunt for and which words to search with, and to give the Intersection step a map of the persona. A hypothesis that Vector 3 or the client's calls corroborate becomes evidence under that source's class. One they contradict is reported as overturned, the same way `buyer_pain_hypothesis` is.

Discovery mode only. Validation mode reuses Vector 0 from an existing brief when one is on file and does not rerun it. With no brief on file, validation mode runs without Vector 0, so wherever validation mode says "Vectors 1-4" it means exactly that.

---

**Vector 1 - Competitor front-end offers + saturation count**

**Sample-size floor: research 5 to 10 competitors.** A saturation verdict is a claim about a field, and a field of two or three is not a field. Below 5 there is no denominator that can carry the word "saturated". Build the list from the client profile, the competitors the client names, and a search for adjacent players serving the same ICP, until you have at least 5. Record the count, because the verdict is only auditable next to its denominator.

- Fetch competitor websites. Look at: homepage hero CTA, pricing page CTA, pop-up or inline lead magnets, any "free X" offer, how trial or demo is framed
- Check their LinkedIn company pages for pinned posts or sponsored lead gen content
- If they run LinkedIn Lead Gen Forms, the form title usually names the offer directly
- Search `"[competitor name]" "free" site:linkedin.com` or `"[competitor name]" cold email swipe` for published examples

Extract for each competitor:
1. The specific offer they lead with
2. Which archetype it maps to (A-K from `/lead-magnet-brainstorm`)
3. How long they appear to have been running it

Also fill a **competitor card** for each one in `_research/competitors-and-ads.md` (`market-evidence-standard.md` section 10), researching only what helps a GTM decision: who they sell to, their main promise (their headline, verbatim), the front-end offer and its archetype, pricing model or visible price, named customers and case studies (each a `competitor_case_study` ledger row), their lead magnets, what their customers complain about (review rows from Vector 3, cited by evidence ID), their strengths as buyers describe them, and the gap they leave. Competitor marketing is `competitor_claim`: context, never proof. Read a competitor's pricing, case-study and customer pages one by one with WebFetch, and in the browser pane when a page renders only client-side.

Build the saturation table. Head it with the denominator:

**Competitors researched: [N]**

| Competitor | Offer | Archetype | Running how long |
|---|---|---|---|
| [Name] | [Offer] | [Letter] | [Duration or Unknown] |

**Saturation rule:** Count how many competitors use the same archetype, out of the total number you actually researched (the denominator).
- Denominator below 5 -> **INSUFFICIENT SAMPLE**. SATURATED may not be fired at all. Report how many competitors were researched and how many used the archetype, and leave the archetype unverdicted until the sample reaches 5.
- Denominator 5 or more, 3 or more competitors using the archetype -> **SATURATED** (ICP is numb to it)
- Denominator 5 or more, 2 using it -> **CROWDED** (notable but not fatal)
- Denominator 5 or more, 0-1 using it -> **OPEN** (uncontested)

A saturated archetype is not evidence the offer works for this client today; the ICP may be numb to the form. It is evidence that buyers care about the problem (competitor spend shows demand, Aaron, Sep 21). A SATURATED verdict therefore ranks the archetype lower and asks for the gap competitors leave; it never closes it (Aaron process alignment, operator directive 2026-09-22).

---

**Vector 2 - Paid ads intelligence (Meta Ad Library, then LinkedIn)**

Read the **angle and the positioning, not the creative execution**. A competitor running 10 to 50 variations of a single angle has already paid to learn that this market responds to that angle. The variations are them optimizing execution around something already proven, so the angle is the finding. Report what problem the angle names and what it promises, not the headline wording, the stock photo, or the button colour.

**Meta Ad Library (start here, it is public and needs no authentication)**

- Search Meta's Ad Library by advertiser name or Facebook page for each competitor and adjacent brand. It is a public ad-transparency registry, so there is no login, no ad account, and no API key involved. **Read it in the harness's built-in browser pane** (`mcp__Claude_Browser__navigate` to `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=<CC>&q=<advertiser>&search_type=keyword_unordered`, then `get_page_text` or a screenshot). The Ad Library is a client-side app: WebFetch gets a dropped connection or an empty shell, while the browser pane renders the ads and their copy (tested 2026-09-23). Read only: never log in, and decline non-essential cookies if a banner appears. Never fall back to Claude in Chrome, because it acts with the operator's real sign-ins. Use WebSearch only to find an advertiser's page name. Google's Ads Transparency Center is the equivalent public Google route and is read the same way in the browser pane. With many advertisers, read them one after another in the pane, not in parallel. Mark an advertiser unread only when the browser pane also fails, and say so; there is no scraper route outside the approved stack (`stack-contract.yaml`). Each angle becomes an `ad` row in the ledger, with its variation count and run length in `notes`.
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

Extract: every usable quote as a ledger row (step 7). The 3-5 problems the brief reports are the top clusters `/market-evidence synthesize` forms from those rows, each with a verbatim `exact_quote`, its `source_url`, `persona`, `complaint_about` (`competitor_mentioned` in the ledger), and any counterevidence, and its `frequency_count` is the independent `buyer_quote` sighting count from `evidence_ledger.mjs stats`, never typed by hand. A pain only graduates into the brief at 3 or more independent sightings (the Research QA gate); weaker ones stay visible, labelled `confidence_score: low`. First-party call quotes are a separate, stronger class and never count toward this `frequency_count`, and neither do Vector 0 hypotheses. This exact phrasing feeds copywriting later and anchors the offer brainstorm.

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

Job postings represent budget decisions. A company spending $80K/year to hire for a problem will pay to solve it.

---

**Evidence synthesis and the Research QA gate (`/market-evidence synthesize`)**

Once the vectors have written their batches, run `/market-evidence` in `synthesize` mode. It ingests the batches, clusters the rows into problems in the buyers' own words, counts sightings with `evidence_ledger.mjs stats`, scores every cluster on the 8-factor opportunity rubric, and runs the Research QA gate (`market-evidence-standard.md` sections 5 to 7). Its outputs are `_research/pain-clusters.md` and a refreshed `research_artifacts:` block.

| Verdict | What this skill does next |
|---|---|
| PASS | Continue to the Intersection step, working from the clusters |
| DEEPEN | Run Stage 2 on the gaps the deepen brief names, and only those (a new `deepen-<n>` run folder; the routes the brief names: a targeted `/deep-research` pass, WebSearch, WebFetch, the browser pane, or an operator paste), then re-run synthesize. At most two loops; after the second, the verdict becomes PASS with low-confidence labels, or HOLD |
| HOLD | Under `review_gates`, show the operator the verdict and its reasons and wait for their decision before continuing. Under `auto_execute`, continue to the Intersection step with every cluster labelled low confidence, the HOLD reasons at the top of the brief, and the missing evidence (usually call recordings) requested from the client and logged PENDING |

Staged depth follows `market-evidence-standard.md` section 8. Research here runs on Claude Code alone and spends nothing, so the stages bound effort and time, not money. Weak clusters are never dropped; they are labelled and ranked.

**Intersection - find the pain the inputs agree on (Aaron's commonality step)**

Aaron does not pick a pain from any single input. He lays his three inputs side by side, looks for the commonality, validates it against the market, and rewords it in the buyer's language (2026-06-22). Do the same before writing the brief:

1. **Line up the inputs.** The pain clusters from `/market-evidence synthesize`, ranked by opportunity score (they already combine Vectors 3 and 4 and the first-party calls, with Vector 0 as the map of what to look for), competitor angles with paid spend behind them from Vector 2, and the buyer's own words from the First-Party Call Vector.
2. **Pick the lowest-hanging pain:** the cluster with the strongest real evidence (its opportunity score and its Research QA result) that a front-end offer can relieve quickly. Name it by cluster ID. In his experience it is "usually going to be around something revenue related". Treat that as his tendency, not a rule.
3. **Validate it against paid spend.** If competitors already pay to advertise offers in this pain's category (Vector 2), the market has shown it cares. An unvalidated pain is not dropped. It is marked lower confidence.
4. **Find the gap.** Name the part of the pain the competitors' ads do not address, using the `complaint_about: competitor:<name>` quotes from Vector 3 as evidence. His worked example: every clinical-ops staffing competitor pitched finding talent fast, but the research pain was interview load (a VP interviewing 30 candidates to find two good ones), so the offer became three pre-vetted clinical-ops candidates on the VP's desk in 14 days.
5. **Reword it in the buyer's words** from the First-Party Buyer Voice section, or from Vector 3 quotes when the client has no recordings.

The result is the Intersection section of the brief, and it becomes row 1 of `Candidate Generation Input`. If no pain clears step 2 with real evidence (only `model_hypothesis` rows exist), say so plainly. Never promote a hypothesis to fill the slot.

---

**Synthesize and output the discovery brief**

After the First-Party Call Vector, Vectors 0-4 and the Intersection step, build the brief that `/lead-magnet-brainstorm` reads.

Save to `profiles/<business-slug>/offer-intelligence.md`:

```markdown
## Offer Intelligence - [Business Name] (Discovery)
**Date:** YYYY-MM-DD
**Mode:** Discovery
**Status:** Feeds /lead-magnet-brainstorm - no offer locked yet
**Competitors researched:** [N] (floor is 5, see Vector 1)
**First-party call recordings reviewed:** [N won / N lost, or "none available from client"]
**Evidence base:** [ledger rows by tier (E-0001..E-nnnn); pain clusters in `_research/pain-clusters.md`; Research QA verdict and date; research sample of N companies in `_research/market-sample.md`]
**Public complaint coverage:** [platforms read, with quotes per platform; platforms unread and why, e.g. "Reddit: unread, nothing pasted"]

---

### First-Party Buyer Voice (the client's own calls)

[From the First-Party Call Vector. One bullet per pain or objection, each carrying the verbatim `exact_quote`, the `persona` who said it, `call_outcome` (won or lost), and what the offer has to answer. These outrank public quotes wherever the two disagree. Never fabricate a quote, and never move a public quote into this section.

If the client has no recordings, write exactly: "Client has no call recordings available. All pain below is reconstructed from public buyer voice." Mark this section's confidence Low and leave it at that. Do not backfill it with Vector 3 material.]

**Offer language rewrite:** [the buyer's own words the offer should adopt, and the client-side jargon each one replaces. `/lead-magnet-brainstorm` and `/campaign-copywriting` inherit this line.]

---

### ICP Pain (in their words)
[3-5 bullets, one per top cluster from `_research/pain-clusters.md`: its cluster ID, a verbatim `exact_quote` with its evidence ID and `source_url`, the `persona`, its sighting count from `evidence_ledger.mjs stats` (never typed by hand), and any counterevidence. No paraphrasing - record how they actually describe the problem. Only pains at `frequency_count >= 3` independent `buyer_quote` sources are stated as pain; mark weaker ones `confidence_score: low` (the Research QA gate, `/market-evidence`). First-party call quotes live in the section above and never count toward this `frequency_count`.]

---

### Pain by persona

Every pain row carries the persona who feels it, so `/lead-magnet-brainstorm` and `/campaign-strategy` can aim the offer at a specific buyer instead of an averaged ICP.

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

| Archetype | Letter | Status |
|---|---|---|
| Free audit / diagnostic | A | SATURATED / CROWDED / OPEN / INSUFFICIENT SAMPLE |
| Data / research piece | B | |
| Competitive intel | C | |
| Template / checklist | D | |
| Intro / connection | E | |
| Quick-win free work | F | |
| Specific-to-them analysis | G | |
| Limited access to the client's product | H | |
| 15-min working session | I | |
| Benchmark / comparison | J | |
| Purpose-built interactive tool | K | |

> **Don't confuse H and K.** **H** is scoped access to the client's *actual paid product* (a trial, a free account), and its risk is product friction. **K** is a *purpose-built standalone* calculator or audit that is not the product at all: the prospect drops in their own numbers and gets an instant computed result. K runs as its own arm in any wave and is judged on time-agreed replies rather than positives (K1), and the agency builds it for the test (K2); both in `/lead-magnet-brainstorm`, reworked 2026-09-22. Score its saturation on whether this ICP is already being sent free calculators, not on the client's product.

**Saturated archetypes (rank lower, never closed):** [list, each with the gap competitors leave, or "no gap found"]
**Crowded archetypes (proceed with caution):** [list]
**Open archetypes (prioritize):** [list]
**Unverdicted (INSUFFICIENT SAMPLE, denominator below 5):** [list, or "none, denominator is [N]"]

---

### Intersection (Aaron's commonality step)

**Lowest-hanging pain:** [exact quote and persona, with the evidence behind it: independent `buyer_quote` count and any first-party call]
**Paid-spend validation:** [the Vector 2 competitor angles already selling into this pain's category, or "not validated, lower confidence"]
**The gap competitors miss:** [the part of the pain their ads do not address, with the competitor-complaint quotes that show it]
**In the buyer's words:** [the phrasing from First-Party Buyer Voice, or from Vector 3 when there are no recordings]
**Vector 0 hypotheses overturned:** [list, or "none"]

---

### Recommended direction for /lead-magnet-brainstorm

**Buyer language to use:** [the exact words from the First-Party Buyer Voice section. Where the client had no recordings, fall back to the Vector 3 quotes and say so. The offer gets written in these words.]
**Target persona:** [the persona from the Pain by persona table carrying the strongest, best-evidenced pain, and one line on why it beats the others]
**Proven paid angle to borrow or avoid:** [from Paid Ads Angles. Name the angle, not the creative.]
**Primary:** Focus invention on [open archetype(s)] - uncontested in this market, aligned with ICP pain #[X].
**Secondary:** [another open archetype]. Delivery capacity is not a filter at research or ideation (operator directive 2026-09-22). At lock, `/lead-magnet-brainstorm` checks each offer is deliverable at the planned send volume, with a scale note or an `offer.qualification` rule (Aaron process alignment, operator directive 2026-09-22; supersedes "`/offer-test-slate` asks about full volume after the test").
**Rank lower:** [saturated archetypes] - the ICP has seen them often, so each needs the gap competitors leave (named, with its evidence) to earn a place. Saturation never closes an archetype or overrides a higher-scoring direction (Aaron process alignment, operator directive 2026-09-22; supersedes "Avoid").

### Contrarian opportunity (if applicable)
[Only populate if all or most archetypes are saturated/crowded. Name the archetype furthest from the saturated ones and why it could break the pattern.]

### Candidate Generation Input (the handoff `/lead-magnet-brainstorm` consumes)

The rows below are not a summary. They are the working input the next skill invents from, so each one must be filled from the sections above rather than restated loosely. Row 1 is the Intersection section's pain. For a multi-segment client (kickoff Step 2.5 confirmed two or more segments whose pain or offer fit differ), write one `Candidate Generation Input` block per segment, headed with the segment slug, so `/lead-magnet-brainstorm` builds each segment's own offer set (`offer.segments`, operator decision 2026-09-22).

| # | Persona | Pain, in their words | Cluster (opportunity score) | Evidence strength | Open archetype(s) to build for | Why this pairing |
|---|---|---|---|---|---|---|
| 1 | [persona from Pain by persona] | [exact quote, not paraphrase, with its evidence ID] | [C-xx (n/16)] | [strong / good / supporting] | [letter(s) from Open archetypes] | [one line] |
| 2 | | | | | | |
| 3 | | | | | | |

**Open archetypes still uncontested:** [letters + names from the Saturation Map's Open line]
**Saturated (ranked lower, never closed):** [saturated archetypes, each with the gap competitors leave and the paid-ad spend behind it, which counts as demand evidence. Candidate generation may build toward one when it names that gap; it ranks below an equal-scoring open direction and never displaces a higher-scoring one (Aaron process alignment, operator directive 2026-09-22; supersedes "Closed to candidates", which contradicted this file's own never-filtered rule)]
**Cross-client priors (optional; patterns only):** [offer patterns that flipped `offer_market_proven` or scaled as winners for OTHER clients in this workspace (their `portfolio-review.md` winners): the offer family, the deliverable's shape, the input asked for, and the next step. Or "none used".]
```

**Cross-client priors are optional and low-confidence (operator-approved Aaron alignment, 2026-09-21; S13, demonstrated).** Aaron's September build reads other clients' winning angles before generating offers, which is a demonstration rather than a tested rule, so a prior is a hint about a shape worth trying and never outranks this client's own evidence. Carry patterns only: never another client's name, number, data or copy, and never a prior as copy.

### What to do next (discovery mode)

Hand off to `/lead-magnet-brainstorm` once `/market-evidence synthesize` has returned its verdict (PASS, or HOLD carried forward with its labels). Discovery and candidate generation are one continuous offer motion split across two skills, so this mode is not finished until the handoff is usable as-is.

**What carries forward, by section name.** `/lead-magnet-brainstorm` opens by reading these five, and reads them rather than rebuilding them:

1. **`Candidate Generation Input`** - the numbered persona + pain + open-archetype rows. This is the primary input: candidates are generated against these rows.
2. **`Pain by persona`** - the full table behind those rows, including the prioritized personas with no pain evidence, which are named gaps rather than blanks.
3. **`Saturation Map`** - the open, crowded, and saturated archetypes with the denominator, so archetype choice is bounded by evidence.
4. **`First-Party Buyer Voice`** and **`ICP Pain (in their words)`** - the exact words the offer gets written in.
5. **`_research/pain-clusters.md`** - the clusters behind every row, their counts and opportunity scores, the Research QA verdict, and the Language bank. Every candidate `/lead-magnet-brainstorm` builds cites the clusters it answers (`market-evidence-standard.md` section 12).

Nothing else in this brief is a prerequisite for that handoff. If `Candidate Generation Input` is empty or missing, this mode has not actually finished, so complete it here rather than letting the next skill re-derive pain from scratch.

---

## Mode: Validation

> **Research Routing: HARD RULE (Claude deep-research primary, enforced) applies here too.** Validation mode runs research (Vectors 1–4: competitor / ads / ICP-community / job-postings) and is often the path where `run_state.research_routing` is still **unset** (fresh diagnostic session). Apply the same gate as **AI/API Routing** above: `research_routing` has one value, `claude_deep_research` (set it if unset, and treat a retired `third_party_ai` or `claude_native` value as `claude_deep_research`), so the primary brain is the Claude native `/deep-research` fan-out harness (`anthropic-skills:deep-research`), or its declared sub-agent fan-out (`claude-subagent-fanout`) when the harness is unavailable. Do NOT stop to ask, and do NOT satisfy the primary pass with a bare inline WebSearch. The primary pass MUST be an **actual `/deep-research` invocation, or its declared fan-out** (inline WebSearch/WebFetch alone does NOT satisfy it): record `ai_research_provider = claude-deep-research` (or `claude-subagent-fanout`), append the run-log line to `api-balance-ledger.md` (the provenance record the wired check reads), and run the same `research_routing_check.mjs` check with `--skill offer-intelligence`. Finishing with **no `/deep-research` primary** is a **flagged violation**. Thin sub-topics are filled exactly as in discovery mode (a targeted `/deep-research` pass, WebSearch, WebFetch or the browser pane), and extraction runs on small-model sub-agents writing ledger rows. No API key of any kind is needed, and no other AI provider is ever called (no-AI-API rule, operator directive 2026-09-22). **Scope note:** validation mode runs the First-Party Call Vector first, and that vector sits outside this routing path entirely (client-supplied recordings, no external spend, no engine choice). It does NOT satisfy or substitute for the `/deep-research` primary pass on Vectors 1-4. Full rule: `/ai-model-routing`.

### When to trigger

- Live campaign reply rate below 1% after 300+ sends, where the offer is still a plausible bottleneck once the deliverability triggers and list quality are clear (Vector 5 Key diagnostics). Copy sits below the offer in the diagnostic order (doctrine §2), so a copy check is not a precondition for suspecting the offer. **300 sends only triggers a look, on raw reply rate; it never calls the offer broken.** Calling an offer broken needs about 1,300 first-touch contacts on the arm (Step 2, Minimum threshold; Aaron process alignment, operator directive 2026-09-22; supersedes "300 sends is enough to call an offer broken")
- Existing offer has live or prior campaign evidence and the client wants to keep it
- User says "let's test a different offer" - run this before `/experiment-design` so the new offer is market-validated, not random
- After `/lead-magnet-brainstorm` outputs an offer and you want a second opinion before locking. For a fast, hands-off second opinion - especially on a new or contrarian offer whose evidence is thin - run `/roast` on the offer: it returns a green-light / reshape / kill verdict plus the single cheapest test to run before committing copy build and list spend. The cheapest honest market test of a thinly-evidenced offer is one arm at the normal per-arm size (about 2,000 first-touch contacts planned, about 1,300 minimum) inside the first wave, beside the other offers, not a separate small wave that cannot reach significance (Aaron, Mar 9: "the more volume you're able to send, the faster you're able to figure out an angle that works"; Aaron process alignment, operator directive 2026-09-22; supersedes "treat a thinly-evidenced offer's first small wave as that cheapest test").

Do not use validation mode just because an onboarding form contains a suggested lead magnet or CTA. A form answer is a hypothesis. For new clients and new campaigns, run discovery mode here first (it follows `/icp-onboarding` directly), then `/lead-magnet-brainstorm`, with the client suggestion treated as Candidate A. No list-side or data-side work is a prerequisite for either, because all of it runs after the offer locks.

### Inputs

For validation mode, the existing offer to evaluate can come from `offer.validation_candidate` in `client-profile.yaml` when onboarding captured an evidence-backed offer, or from `profiles/<business-slug>/lead-magnets.md` when a previously locked offer exists. The evidence must be visible in `offer.validation_candidate_evidence`, prior campaign artifacts, or live send data.

If validation mode is requested but the only offer fields are `offer.client_suggested_*` and no evidence pointer exists, **stop**. Do not run validation mode. Route to discovery mode here (which follows `/icp-onboarding` directly), then `/lead-magnet-brainstorm` instead. Client suggestions without evidence are candidates, not validation inputs. This stop is unconditional: missing evidence is the whole reason for it, and the reordering of the chain changes only where the route goes, never whether the stop fires.

- `profiles/<business-slug>/client-profile.yaml` - ICP, value prop, hard filters, `icp_soft_preferences.personas_to_prioritize`
- `profiles/<business-slug>/lead-magnets.md` - the existing offer to evaluate
- The client's own won and lost sales-call recordings - the strongest evidence available for judging whether a live offer matches buyer reality. Request them if not already on file
- `profiles/<business-slug>/offer-intelligence.md` - load if it exists from a prior discovery run (the First-Party Call Vector and Vectors 1-4 may already be done; only run Vector 5 when send data exists)
- `profiles/<business-slug>/_research/` - the evidence ledger, the pain clusters and their Market feedback log, and the competitor cards, when they exist. Step 0 of discovery mode (reuse, never redo) applies here too
- Client website URL
- Competitor names or URLs
- Live send data (optional) - reply rate and reply sentiment from current campaign

### Steps

**Step 1: Pre-flight - walk the diagnostic order, then spot obvious broken offers in 2 minutes**

**First, walk Aaron's diagnostic order top-down and stop at the highest broken item (doctrine §2; operator-approved Aaron alignment, 2026-09-21).** Do not work on a lower item while a higher one is broken. The highest broken item is the finding, and it names what Iterate or Swap must fix.

0. **Is the buyer real and specific?** A named buyer type with a problem they already know they have, plus role, authority, current situation and exclusions. "Founders" or "B2B companies" is not a buyer.
1. **Is the offer a concrete thing, or a description of the company?** It must say what they get, how fast, what they must do, and what risk they take.
2. **Is every qualified yes being honored, at the volume being sent?** Aaron's "easy for you to fulfill" (doctrine §2 step 2), at "the scale of the emails that you're sending" (Aaron, Sep 21). For a live offer this is a fulfillment check against its lock record: a scale note showing it fits the send volume, or an `offer.qualification` rule that decides who gets the free unit and who gets the standard offer (`/lead-magnet-brainstorm`, Deliverable at Send Scale). A qualified yes that goes unhonored is a delivery problem to fix before the offer is judged, not evidence against the offer. An offer locked with neither record gets one now through `/lead-magnet-brainstorm` (Aaron process alignment, operator directive 2026-09-22; supersedes "full-volume capacity is asked in `/offer-test-slate` scale review, never here"; the twenty-buyer figure this item used to cite was this system's number, doctrine §13).
3. **Does the copy lead with the offer, and is every word true?** Only now read the live draft.
4. **Is the next step one easy action, and does each follow-up earn its place?**
5. **Are we judging the right number?** Time-agreed replies per 1,000 first touches beside positive-reply rate, never reply count alone (doctrine §0, §2 step 5).

Then run the existing offer through four quick questions. They are the fast check for item 1, and they catch structurally broken offers without burning research time.

| Question | Red flag if... |
|---|---|
| Would they want this even if they never buy from you? | No -> it's a pitch dressed as a gift |
| Does it sound like something they would pay for, given free? (doctrine §3) | No -> low perceived value: a gesture, not a gift worth replying for |
| Does receiving it prove your specific competence? | No -> it's just a gesture |
| Does it require less than 60 seconds from the prospect to claim? | No -> friction kills reply rate |

- 0 red flags: structurally sound. Proceed to research.
- 1 red flag: note the flaw, proceed, factor into final score.
- 2+ red flags: offer is broken structurally. Flag it. Research still runs, but recommendation will almost certainly be Swap.

**Separately, check fulfillment (not a red flag against the offer).** Is every qualified yes the live offer gets being honored as promised, on time, at the current send volume? If not, fix delivery (or add the missing `offer.qualification` rule) before judging the offer. Deliverability at send scale is checked, never scored here (Aaron process alignment, operator directive 2026-09-22; supersedes "asked in `/offer-test-slate` scale review"; this used to be the question "can the front-end owner deliver it to 100 people this week without custom work per person?").

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
- **Deliverability first, but only on a trigger (operator-approved Aaron alignment, 2026-09-21).** Bounce above the house threshold, a placement test flagging it (a trigger to investigate, never decisive alone), a reply rate sitting near 0.1%, or contacts-per-positive jumping -> run `/email-deliverability-audit` first and do not blame the offer yet. **Open rate is never the trigger:** open tracking stays off on the sending platform, so open rate reads 0% and cannot diagnose anything (doctrine §9, "Don't track opens"; Eric agrees). The retired open-rate branches are archived at `outbound/_archive/aaron-alignment-2026-09-21/offer-intelligence--vector-5-open-rate-diagnostics.md`.
- Bounce rate above accepted thresholds or repeated wrong-person replies -> list quality problem. Do not swap the offer until the list is fixed.
- **No deliverability trigger fired and the list is clean -> the offer is a live candidate.** Walk the Step 1 diagnostic order (doctrine §2); the highest broken item is the finding.
- Copy that fails `/spam-word-checker` or `cold-email-copy-best-practices.md` -> fix it before relaunch (a house QA gate). A clean copy pass never clears the offer: copy sits below the offer in the diagnostic order, and a rewrite cannot save a weak offer (doctrine §2, §9).
- "Already have something" replies appearing more than once -> the archetype is saturated in their mind.
- **Positive replies rising with no rise in time-agreed replies -> farming interest** (doctrine §4): the offer is easy to say yes to but not specific enough to filter out people who will never buy. Treat it as an Iterate signal, not a win and not a kill: reshape the offer so it is more specific and filters better. Time-agreed replies are positive replies whose thread moves toward a time, counted with `/campaign-strategy`'s magnet-inflation-guard proxy; they pick winners and gate scaling, and never move the offer-validation flip, which reads positive replies.

Minimum threshold: do not call the offer broken before an arm has reached about 1,300 first-touch contacts (the flow's per-arm floor; about 2,000 are planned per offer) and its last contacts have had the sequence plus a few days of grace. Below that, variance is too high to trust (Aaron, May 4: every segment "was at least 1,000 prospects"; Aaron process alignment, operator directive 2026-09-22; supersedes "300 sends").

---

**Step 3: Synthesize the signal**

Answer four questions:

1. **What problem does this ICP publicly, repeatedly admit they have?** (Vectors 3 + 4 - use their language)
2. **What offers are competitors leading with, and which have real spend or longevity?** (Vectors 1 + 2 - distinguish validated from hypothetical)
3. **Does the existing offer address #1 AND differentiate from #2?** Yes to both -> candidate for Go. No to either -> candidate for Iterate or Swap.
4. **Is the market-validated archetype saturated to the point the ICP is numb to it?** (Saturation table from Vector 1)
   - SATURATED -> flag for Contrarian Offer analysis regardless of score
   - CROWDED -> proceed, weight differentiation heavily
   - OPEN -> proceed normally

---

**Step 4: Score the existing offer vs. the market**

| Criterion | Points | Existing offer | Market alternative |
|---|---|---|---|
| Directly addresses #1 ICP pain from signal | 0-2 (0=no, 1=partially, 2=yes) | | |
| Perceived value: it sounds like something they would pay for, given free (doctrine §3), ideally anchored to a real price or cost. Delivery effort and scale do not score (operator directive 2026-09-22); deliverability at send scale is a lock check in `/lead-magnet-brainstorm` (Aaron process alignment, operator directive 2026-09-22) | 0-1 | | |
| Proves your specific competence in one step | 0-1 | | |
| Requires <60 seconds from prospect to claim | 0-1 | | |
| Differentiated from the field (not just one competitor) | 0-2 (0=same as 3+, 1=same as 1-2, 2=nobody else does this) | | |
| **Total** | **/7** | | |

**Saturation penalty:** If the existing offer's archetype is SATURATED, subtract 2 from its field differentiation score. The ICP's numbness to the archetype is real even if your specific execution is different.

---

**Step 5: Decision framework**

**Saturation check - run first**

If the existing offer's archetype is SATURATED and the market alternative uses the same archetype, run Contrarian Offer analysis (Step 5B) before the decision logic and add its pick as a candidate beside the other two. Saturation already lowers rank through the Step 4 penalty; here it also requires naming the gap competitors leave for any saturated option that stays in play. It never closes the archetype and never overrides a higher-scoring alternative: heavy competitor ad spend behind the archetype is evidence of demand (Aaron, Sep 21), and the market, not the desk, settles whether the pattern is too tired (Aaron process alignment, operator directive 2026-09-22; supersedes "do not pick the market alternative" and "a high-scoring offer in a saturated category will underperform a mid-scoring contrarian"). If no gap can be named, say so in the Recommendation.

**Normal decision logic**

| Existing offer score | Market alternative score | Decision |
|---|---|---|
| 6-7 | Any | **Go** - existing offer is strong, ship it |
| 5 | 6-7 | **Iterate** - refine framing using ICP language from Vector 3 |
| 5 | 5 | **Iterate** - tighten CTA specificity, both are mid |
| 3-4 | 6-7 | **Swap** - existing offer is weak, replace with market alternative |
| 3-4 | 5 | **Swap + test** - neither dominant, run both as offer-validation arms (`offer.validation_arms`, `/campaign-strategy` Offer-Validation Wave) via `/experiment-design`'s offer-only type |
| 0-2 | Any | **Swap** - structurally broken, replace immediately |

**Go:** Lock the offer in `client-profile.yaml` as the primary. **New offer arms are optional for a Go offer** (Aaron, Apr 13: "If you're pretty sure you've got a good offer, running a bunch of variations of it isn't necessarily going to be the highest leverage thing"). The default first-wave test is segments and data sources plus positioning variants of this offer, so `offer.validation_arms` may be `[]` with the reason "validated Go offer"; add arms through `/lead-magnet-brainstorm` only when the operator wants them (Aaron process alignment, operator directive 2026-09-22; supersedes "run `/lead-magnet-brainstorm` for validation arms to test beside it"). Proceed to `/campaign-strategy`.

**Iterate:** Rewrite framing, CTA, and specificity. Common moves:
- Make deliverable more specific ("a 5-minute audit" -> "your first three subject lines, rewritten": a done-for-you deliverable, never named an audit; doctrine §3, ledger R09)
- Use ICP's own language from Vector 3
- Eliminate friction (no form fill, reply-to-claim)
- Sharpen competence proof ("I'll send you ideas" -> "I'll rewrite your first cold email subject line")

Re-score once to check the rewrite answers the finding, then let the market read it, not the desk: the iterated offer goes to `/lead-magnet-brainstorm`, which runs it in a fresh multi-offer flight beside other qualifying candidates as simultaneous cells, with list and copy frozen so the offer is the only variable (Aaron, Apr 6: "you really want to test a ton of different offers first"; Mar 2: "Let the market tell you what you should do"; Aaron process alignment, operator directive 2026-09-22; supersedes "re-score until the offer hits 6+").

**Swap:** Choose the market alternative or contrarian offer. If `offer.validation_arms` already holds an active arm that passed every `/lead-magnet-brainstorm` gate, that arm is the first swap candidate. Write the offer-only experiment hypothesis for `/experiment-design`. Any new offer goes through `/lead-magnet-brainstorm` (ranked with its labels and its honoring fields, with its four fulfillment artifacts written before it sends) and into a fresh multi-offer flight run as simultaneous cells, list and copy frozen, shown on the next `/offer-test-slate` (Aaron process alignment, operator directive 2026-09-22; supersedes a one-offer swap).

Keep the CTA at **direction-level** here: a plain-English ask direction, not exact send copy. Exact CTA wording is deferred to `/campaign-copywriting`, which writes it later under the verified-list gate (`verified-list-gate.md`) and runs it through `spam-word-checker.md` + `cold-email-copy-best-practices.md`. Do not write exact CTA send phrasing to the validation brief or `client-profile.yaml`, because this skill runs before any list exists.

---

**Step 5B: Contrarian offer analysis**

Trigger: the Step 5 saturation check fired (a SATURATED existing offer and a same-archetype market alternative), OR both existing and market alternative score below 5, OR user asks "what's the unexpected offer?"

The contrarian offer is the archetype nobody (or almost nobody) in this market is currently using. Its advantage is not evidence it converts - it is the absence of evidence it has been ignored. The ICP has not been trained to delete it yet.

**How to find it:**
1. List all 11 archetypes (A-K)
2. Mark which are SATURATED or CROWDED from the saturation table
3. Remaining archetypes are contrarian candidates, K included (it runs as its own arm and is judged on time-agreed replies, K1 in `/lead-magnet-brainstorm`)
4. Score each on all criteria except field differentiation (it automatically scores 2)
5. Pick the highest-scoring candidate

**Directional guide:**
- If audit (A) is saturated -> consider competitive intel (C) or quick-win free work (F)
- If data/report (B) is saturated -> consider specific-to-them observation (G) or working session (I)
- If templates/checklists (D) are saturated -> consider intro/connection (E) or benchmark (J)
- If everyone offers meetings -> offer to send the value async, no call required

Output a named contrarian offer. Flag it clearly as contrarian - it trades market validation for pattern interruption. It joins the candidates on its score; it does not replace a higher-scoring one (Aaron process alignment, operator directive 2026-09-22).

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
**Decision:** Go | Iterate | Swap | Swap (Contrarian)
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

**Saturation status:** [SATURATED / CROWDED / OPEN / INSUFFICIENT SAMPLE] - [archetype, competitors using it out of competitors researched. SATURATED may not be fired on a denominator below 5.]

---

### ICP Pain (in their words)
[3-5 bullets in their exact language, each tagged with the `persona` who voiced it and its source class. First-party call quotes are labelled as such and never blended into the public-source counts.]

---

### Scorecard

| Criterion | Existing | Market alternative | Contrarian (if applicable) |
|---|---|---|---|
| Addresses #1 ICP pain | | | |
| Perceived value | | | |
| Proves competence | | | |
| Low prospect friction | | | |
| Differentiated from field | | | |
| **Total /7** | | | |

---

### Recommendation
[One paragraph - state the decision, name the offer, cite the evidence, note what to watch for.]

---

### Locked offer

**Offer name:**
**What it is:** [one sentence]
**Delivery method:** [what you actually send or do]
**CTA direction:** [plain-English ask direction; exact copy belongs in /campaign-copywriting]
**Why this over the alternatives:** [one sentence]

---

### If decision is Swap - experiment hypothesis

"Leading with [new offer] will outperform [existing offer] for [ICP] because [reason from research]."

Route the new offer through `/lead-magnet-brainstorm` into a fresh multi-offer flight: the swap candidate plus the other qualifying candidates, run as simultaneous cells. Keep list, copy, and infrastructure frozen, so the offers are the only variable. `/experiment-design` formalizes the hypothesis as an offer-only experiment. (Aaron process alignment, operator directive 2026-09-22; supersedes a one-offer swap.)
```

Update `client-profile.yaml`:

```yaml
offer:
  lead_magnet: <locked offer name>
  lead_magnet_details: <one sentence>
  lead_magnet_cta_direction: <plain-English ask direction, not final copy>
  offer_intelligence_run: YYYY-MM-DD
  offer_decision: go | iterate | swap | swap-contrarian
  saturation_status: saturated | crowded | open | insufficient_sample
  offer_validation_run: YYYY-MM-DD
  offer_validation_path: profiles/<business-slug>/offer-validations/YYYY-MM-DD-offer-validation.md
```

Only add `offer_validation_run` and `offer_validation_path` when validation mode runs. Keep the existing offer fields compatible for downstream skills. On **Swap + test**, record the second offer as an entry in `offer.validation_arms` (same fields as the primary block, `/lead-magnet-brainstorm` Save Output) once it has passed that skill's gates; never write a second offer anywhere else.

---

## Common mistakes

- **Using competitor offers as confirmation without checking saturation.** Three competitors offering free audits is not validation that yours will work. It is demand evidence and a fatigue warning at once. Count the field, then name the gap they leave before following it.
- **Running the contrarian offer just because it's different.** Pattern interruption has value, but an offer disconnected from ICP pain is still a bad offer. The contrarian offer still needs to score well on pain relevance and competence proof - it just gets a pass on differentiation.
- **Swapping offer and copy at the same time.** Combined experiment. You will learn nothing about which change drove the result. Swap the offer, freeze everything else, run `/experiment-design`.
- **Calling the offer broken before an arm has reached about 1,300 first-touch contacts.** Variance is too high below the flow's per-arm floor, and deliverability and list issues look identical to offer problems at low volumes (Aaron process alignment, operator directive 2026-09-22; supersedes "before 300 sends").
- **Letting saturation close an archetype.** Saturation lowers rank and asks for the gap competitors leave. Competitor ad spend behind an offer is evidence of demand (Aaron, Sep 21), so a saturated archetype with a real gap can still run as an arm.
- **Treating reply rate alone as an offer problem, or a copy fix as clearing the offer.** Rule out deliverability when one of its triggers fires (bounce above the house threshold, a placement-test flag, reply rate near 0.1%, contacts-per-positive jumping) and rule out list quality; then walk the diagnostic order (doctrine §2), where the offer sits above the copy. Open rate is never the trigger: opens are not tracked in this system (operator-approved Aaron alignment, 2026-09-21).
- **Calling an offer a winner on positive replies alone.** Report time-agreed replies per 1,000 first touches beside the positive-reply rate; a positive lift with no rise in time-agreed replies is farming interest (doctrine §0, §4).
- **Iterating the offer without changing the language.** Iteration means rewriting toward the ICP's own words from Vector 3. Keeping your language gets the same result.
- **Skipping discovery mode because "the client already has a strong offer."** Strong relative to what? Run discovery first so the brainstorm is informed, not assumed.
- **Reconstructing every pain from public strangers while the client's call recordings sit unopened.** Public buyer voice is a proxy. The client's own won and lost sales calls are the buyer saying it directly, in the exact words the offer should use, about this exact category. Ask for the recordings before you mine forums. If the client genuinely has none, state that in the brief rather than letting the gap pass unnoticed.
- **Flattening pain into one ICP blob.** Two personas inside the same ICP feel different pains, and an offer aimed at their average is urgent to nobody. Every pain row carries a `persona`.
- **Firing SATURATED off three competitors.** Three is not a field. Research 5 to 10, record the denominator, and mark the archetype INSUFFICIENT SAMPLE below 5 instead of guessing.
- **Listing Reddit as researched when nothing was read.** The harness cannot read Reddit, and operator paste is the only route. Report the pasted threads and the quotes they gave, or write "Reddit: unread". A platform named in a list is not a platform read.
- **Treating the persona research as buyer pain.** Vector 0 is a model's educated guess about the persona. It tells you where to look and what words to search with. Only a real buyer saying it, in public or on a client call, makes it pain.
- **Typing counts by hand.** "Appeared in 12 threads" comes from `evidence_ledger.mjs stats`, never from a tally kept in the session. Hand counts drift and double-count syndicated quotes.
- **Building offers before the Research QA verdict.** The Intersection step and the Candidate Generation Input wait for `/market-evidence synthesize`. A HOLD is carried forward with its labels, never skipped silently.
- **Redoing research that already exists.** Step 0 reads the ledger and any older research first; a refresh fills gaps, it does not restart.
- **Reading the ad creative instead of the ad angle.** Fifty variations of one angle is the finding. The headline wording and the imagery are the advertiser optimizing around something already proven, not the proof itself.

---

## Integration

| Skill | Relationship |
|---|---|
| `/market-evidence` | Called after the vectors (`synthesize`: clusters, counts, opportunity scores and the Research QA gate) and after launch (`feedback`: replies and calls become evidence, dormant until the sending platform is live). This skill collects; `/market-evidence` counts, checks and learns. Standard: `market-evidence-standard.md`. |
| `/icp-onboarding` | Runs immediately before this skill. Produces the ICP, the value prop, `icp_soft_preferences.personas_to_prioritize` (the persona list every pain row maps against), `sales_call_library` (whether the client's won and lost recordings exist and where, which the First-Party Call Vector reads before asking the client for anything), and `buyer_pain_hypothesis` (the client's unverified belief about buyer pain, which this skill confirms or overturns). |
| `/lead-source-strategy` | Runs in Lead Source Plan Mode AFTER campaign selection, far downstream of this skill. The chain is: buyer and pain, then the offer, then the list built to fit that offer, then the copy. Nothing it produces is a prerequisite here. |
| `/lead-magnet-brainstorm` | Runs after discovery mode. Reads the offer-intelligence.md brief to anchor archetype selection, using the first-party buyer language, the pain-by-persona table, the paid-ads angles, and the ICP language from Vector 3. |
| `/offer-test-slate` | Shows this brief's findings to the client (buyer types, problems in the buyer's words, the gap competitors leave) beside the offers `/lead-magnet-brainstorm` builds from them, before the test. Client approval is optional. After the wave reads out, its scale review reports the results to the client and reviews the winner's `offer.qualification` rule alongside the winner's scale-up; it is not a volume gate (Aaron process alignment, operator directive 2026-09-22). |
| `/campaign-strategy` | Reads the locked offer from `client-profile.yaml` and the data-point catalog. The front-end offer suggestions section should defer to this output. |
| `/experiment-design` | If validation mode decision = Iterate, Swap or Swap (Contrarian), this skill writes the offer-only experiment hypothesis that `/experiment-design` formalizes; the offers themselves run as a fresh multi-offer flight through `/lead-magnet-brainstorm`. |
| `/roast` | Optional fast pre-lock stress test of a candidate offer (hands-off council → green-light / reshape / kill + the single cheapest 48-hour validation test). Useful for a new or contrarian offer before committing build and spend; complements this skill's evidence-based Go/Iterate/Swap rather than replacing it. |
| `/ask-aaron` | Optional persona consult for pressure-testing a candidate offer against Aaron Shepherd's diagnostic (is the buyer real and specific, is it a concrete deliverable or a service description, can every qualified yes be honored, his "easy for you to fulfill" applied at the planned send volume; the twenty-buyer figure was this system's safeguard, doctrine §13, and the deliverable-at-send-scale check sits at offer lock in `/lead-magnet-brainstorm`, Aaron process alignment, operator directive 2026-09-22) or choosing between offer cards. Advisory only; complements the evidence-based Go/Iterate/Swap here rather than replacing it. |
| `/cold-email-kickoff` | Invokes this discovery mode immediately after `/icp-onboarding`, then `/lead-magnet-brainstorm`, then `/data-point-discovery` once the offer is locked. |
| `/cold-email-weekly-rhythm` | If a running campaign's raw reply rate drops below 1% after 300+ sends, its Monday 1% rule sends it to `/deliverability-incident-response` first; once that clears deliverability and the list, it opens validation mode here (a look, not a verdict: calling the offer broken needs about 1,300 first-touch contacts per arm) before copy or list change. Its cross-campaign offer diagnosis and `/market-evidence feedback`'s routing rules (repeated contradiction, `already_have` or `confusion` in replies) open validation mode too. |
| `/email-deliverability-audit` | Run it first when a deliverability trigger fires: bounce above the house threshold, a placement-test flag (a trigger to investigate, never decisive alone), reply rate near 0.1%, or contacts-per-positive jumping. Open rate is never the trigger, because opens are not tracked in this system (open tracking stays off on the sending platform). Do not diagnose the offer while a trigger is open. |

## What to do next

- **Discovery mode complete** (the Research QA verdict is PASS, or HOLD carried forward with labels): Hand off to `/lead-magnet-brainstorm`. It reads the brief at `profiles/<business-slug>/offer-intelligence.md`, starting from its `Candidate Generation Input` block. Nothing list-side or data-side has run at this point, and none of it is needed for the handoff.
- **Validation - Go:** Proceed to `/campaign-strategy`. Offer is locked in `client-profile.yaml`. New offer arms are optional; the default test is segments and data sources plus positioning variants of this offer (Aaron, Apr 13).
- **Validation - Iterate:** Rewrite using ICP language from Vector 3, re-score once, then route the rewrite to `/lead-magnet-brainstorm` as a cell in a fresh multi-offer flight. The market reads it, not the desk score (Aaron process alignment, operator directive 2026-09-22; supersedes "repeat until score hits 6+").
- **Validation - Swap or Swap (Contrarian):** Route the new offer through `/lead-magnet-brainstorm` into a fresh multi-offer flight run as simultaneous cells, with list and copy frozen; `/experiment-design` formalizes the offer-only hypothesis (Aaron process alignment, operator directive 2026-09-22; supersedes a one-offer swap).

