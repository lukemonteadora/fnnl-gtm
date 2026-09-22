---
name: offer-intelligence
description: "Two-mode offer research skill. Discovery mode runs FIRST on the offer path, immediately after /icp-onboarding and before /lead-magnet-brainstorm, and requires no list-side or data-side work beforehand. It follows Aaron Shepherd's three-input research method and leads with buyer pain: the client's own won and lost sales-call recordings, five-layer persona desire research, real public complaints (Reddit, review sites, forums, with an honest record of which platforms were actually read), competitor offer saturation across 5 to 10 competitors, paid-ad angles from the Meta Ad Library and LinkedIn, and open archetypes, with every pain row mapped to the persona who feels it, so the brainstorm invents from evidence. It ends by handing /lead-magnet-brainstorm a named Candidate Generation Input block (persona + pain + open archetype rows) that candidate generation consumes directly instead of re-deriving pain. Obtainability and the list are worked out later, after the offer locks. Validation mode runs standalone when a live campaign underperforms and evaluates an existing offer against market evidence with a Go / Iterate / Swap decision."
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

**In validation mode**, it runs after an offer is live - evaluating whether the offer is strong, weak, or invisible due to saturation, and deciding whether to keep it or swap it.

## The saturation problem

Market evidence cuts both ways. If competitors are leading with "free audit" and have been for 18 months, that is not evidence that "free audit" works today. It is evidence that it used to work - and that the ICP has now seen it 400 times and auto-deletes it. Following the market into a saturated offer makes you the fifth cold email this week saying the same thing.

The right response to a saturated market is a contrarian offer: the archetype the ICP has never been pitched in this context. Pattern interruption itself has conversion value that no rubric score can capture.

## Offer Architecture gate (shared with copy)

Both modes here feed the three-question Offer Architecture gate that `/campaign-copywriting` runs before Email 1: (1) SQL vs MQL framing, (2) the easy-to-say-yes-to test, (3) a named risk reversal. Evaluate the offer against these as you research. In discovery mode, prefer directions that can name a clean risk reversal and pass the easy-yes test. In validation mode, a Go decision requires all three to hold; a missing risk reversal or a failed easy-yes test is an Iterate or Swap signal, not just a copy problem. Full gate: `/campaign-copywriting` Offer Architecture. In Aaron's method the risk reversal is the free front end itself plus casual risk elimination, never a money-back guarantee or a performance guarantee on the core service (doctrine §3, §6; examples §5), and in validation mode a Go also needs the Step 1 diagnostic order to come back clean (doctrine §2).

## Material Decision Rule

When this skill reaches a material fork, name the realistic options, recommend the strongest path, and explain why the main alternatives are weaker before committing.

Ask before choices that affect spend beyond an approved budget, provider routing, source of truth, list quality, campaign direction, client-facing output, live systems, scraping or account risk, or legal/compliance risk. For low-risk reversible choices, state the recommendation and proceed.

**Research findings and offer directions are never filtered out of view (operator directive 2026-09-22).** Report every direction the evidence supports, with its evidence strength, so `/lead-magnet-brainstorm` can generate from all of them. A weak or saturated direction is labelled and ranked, not dropped. The only thing never proposed is a direction that would be illegal or deceptive to send.

When asking the user, use the Claude Desktop native Interactive Inputs / Choice Prompts pattern from /clarification-first: recommended option first, short choices, and Custom answer last when a custom answer is plausible.

## Interaction Policy

Defers to `/autonomous-execution-policy`. Under `run_state.execution_mode = auto_execute` (the operator's default), proceed without pausing: pick the strongest option per this skill's rubric, record it to `run_state`/profile, and continue — never re-ask a decision already in `run_state`, the profile, memory, or the operator's latest message. Stop only for the policy's hard-stops (spend over the approved ceiling, live send, credentials, provider/source-of-truth change, safety gates). On a long async wait, background-poll and move to other productive work — never idle.

---

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short — record status, not raw output. Full protocol: `client-activity-log.md`.

## Mode: Discovery

### When to trigger

- Invoked by `/cold-email-kickoff` immediately after `/icp-onboarding`, before `/lead-magnet-brainstorm`
- When starting fresh with no existing offer
- When the user wants to understand the market before deciding what to offer

This mode runs from the client profile, the client website, the client's own sales-call recordings, and public buyer voice alone. It does not wait on any list, data-point, or obtainability work, all of which now run after the offer locks so they are measured against a real offer instead of a guessed one.

### What this mode does

Runs the First-Party Call Vector, then Vectors 0-4, then the Intersection step. No send data exists yet because no campaign exists. Builds a market signal brief covering buyer pain in the buyer's own words (first-party from the client's won and lost calls, then public), each pain mapped to the persona who feels it, a saturation map of which offer archetypes are overused in this space, and the open or contrarian archetypes that `/lead-magnet-brainstorm` should build toward.

Does **not** evaluate an offer or output a Go/Iterate/Swap decision. There is nothing to evaluate yet. The output is research that feeds invention.

### AI/API Routing

> **Research Routing: HARD RULE (Claude deep-research primary, enforced; no-AI-API rule, operator directive 2026-09-22).** `run_state.research_routing` has exactly one value, **`claude_deep_research`**. If it is unset, set it to that and proceed. If it still holds a retired value (`third_party_ai`, or the bare-WebSearch `claude_native`), treat it as `claude_deep_research` and note the correction in the activity log. The primary research brain is the Claude native `/deep-research` fan-out harness (multiple sub-agents research every needed category in parallel, fetch real sources, adversarially verify each claim, and synthesize a cited report). Do NOT stop to ask, and do NOT satisfy the primary pass with a bare inline WebSearch. The primary pass MUST be an **actual `/deep-research` invocation** (inline WebSearch/WebFetch alone does NOT satisfy it): record `ai_research_provider = claude-deep-research` and append the run-log line to `api-balance-ledger.md` (a provenance record the wired check reads, not an AI spend row). A research step that finishes with **no `/deep-research` primary** is a **flagged violation** (run it, or get a fresh explicit OK to skip). **Wired check:** after the primary pass, run `node scripts/research/research_routing_check.mjs --skill offer-intelligence --client <business-slug> --json`. A `violation:true` / exit 1 means no logged primary; do not declare this research step done until it passes. No API key of any kind is needed: research runs only on Claude Code itself (the harness, its sub-agents, WebSearch and WebFetch), and no other AI provider is ever called. **Scope note:** the First-Party Call Vector sits outside this routing path entirely, because it reads client-supplied recordings and transcripts, spends nothing externally, and picks no engine. It does NOT satisfy or substitute for the `/deep-research` primary pass, so running it first leaves the primary-pass requirement and the wired check exactly where they were. Full rule: `/ai-model-routing`.

This skill runs at `pass_depth = deep` on the single research path in `/ai-model-routing`, which is Claude Code native only (no-AI-API rule, operator directive 2026-09-22); there is no cheap/standard tier to pick. Assemble the research brief (goal, ICP, decision, output, freshness, confidence, source types, VOC?, assumptions, open questions). The Claude native `/deep-research` fan-out harness runs the primary broad pass (web-grounded competitor/ad/market research + cited source discovery via parallel sub-agents, adversarial verification, cited synthesis). Every data step names a capability role, never a vendor, and the stack contract says which tool fills it; a role whose slot is empty, `held` or `not_chosen` is skipped and noted, never filled with a plausible vendor. The AI roles are retired: there is no research-provider, bulk-classification or copywriting model slot to fill, and `web.search` / `web.crawl` are simply the harness's own WebSearch and WebFetch. The routing: WebSearch is a discovery helper that returns raw URLs, not a second research brain; raw page extraction → WebFetch; **persona desire research (Vector 0) → inside the `/deep-research` primary pass**; **ICP-pain VOC mining (Vector 3) → the VOC / Raw-Evidence pipeline**, run against the platforms Vector 3 lists as readable, with `source_class` kept (Reddit follows Vector 3's own Reddit rule: operator paste only); saturation synthesis and pain-language crunch → Claude Code sub-agents fanned out over disjoint batches per `/personalization-subagent-pattern` (each compresses its own slice of the raw dumps to its own output file before the main session synthesizes). The live X / social read no longer exists, so note that gap rather than filling it. After the primary pass, fill ONLY its gaps (thin / technical / multi-step coverage, weak or unsupported claims, missing counterexamples, overclaimed ICP, contradictions) with a second targeted `/deep-research` pass or a targeted WebSearch/WebFetch pass; never another AI provider, and never a duplicate broad pass. When the corpus is too big or references too many, use **scale mode**: WebSearch EMITS ranked URLs → sub-agents working disjoint URL batches read them with WebFetch and compress each batch → the main Claude Code session merges and synthesizes. Run the Validation Gate before the brief is finalized: a pain counts only at `frequency_count >= 3` independent `buyer_quote` sources, counterexamples kept. The brief this skill writes is research, not copy. Keep CTA wording out. Final copy is written later by `/campaign-copywriting` (Claude Code native, clean-packet sub-agent) and any CTA must still pass `spam-word-checker.md` and `cold-email-copy-best-practices.md`.

### Inputs

- `profiles/<business-slug>/client-profile.yaml` - ICP, value prop, hard filters, and `icp_soft_preferences.personas_to_prioritize` (captured by `/icp-onboarding`, and the list every pain row is mapped against)
- The client's own recorded sales calls, won and lost. **Check `sales_call_library` in `client-profile.yaml` FIRST**, because `/icp-onboarding` already asked for this at intake and recorded whether recordings exist, where they live, the rough count, and the won/lost mix. Only request them from the client when that field is absent or says access is still pending. Re-asking for something intake already captured wastes the client's patience on the exact step that depends on their goodwill. `sales_call_library.exists: false` is a real answer: a stated gap, not a prompt to ask again
- `buyer_pain_hypothesis` in `client-profile.yaml` - the client's own unverified belief about what their buyers struggle with, captured at intake. Treat it as the hypothesis this mode sets out to **confirm or overturn**, never as a finding. Where public buyer voice and first-party calls contradict it, say so plainly in the brief: a client wrong about their own buyers' pain is one of the most valuable things this research can surface
- `profiles/<business-slug>/slack-context.md`, when the client Slack check (`client-slack-check.md`) found anything: what the client and the team said in Slack about the buyers, won and lost deals, competitors and objections, plus any call-recording links. A recording or transcript linked there goes through the First-Party Call Vector like any other recording. A Slack message itself is client-stated, the same class as `buyer_pain_hypothesis`: never tag it `first_party_call`
- Client website URL
- Competitor names or URLs - ask if not already in the profile. Target 5 to 10, see the sample-size floor in Vector 1

This mode has no list-side or data-side prerequisite of any kind. Proceed from the client profile, the client website, the client's own call recordings, and public buyer voice. Do not route back to `/lead-source-strategy` or `/data-point-discovery` to satisfy this mode: both run after the offer locks.

### Steps

**How this maps to Aaron's research method (operator directive 2026-09-22).** Aaron researches an offer from three inputs and then intersects them (2026-06-22 and 2026-04-06 videos, doctrine §5): (1) deep research on what the buyer persona deals with every day, at a business level and a personal level; (2) 5 to 10 competitors' Meta ads, to see which angles already have money behind them; (3) the client's won and lost sales calls, for the buyer's exact words. Here, (1) is Vector 0 plus the complaint mining in Vector 3, (2) is Vectors 1 and 2, (3) is the First-Party Call Vector, and the Intersection step after Vector 4 is his "find the commonality, validate it, reword it" move. Vector 3 goes one step past Aaron: his step one is model-led research, and a model-generated pain is a hypothesis, not a fact (doctrine §5, step 1), so Vector 3 checks those hypotheses against what real buyers complain about in public.

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

A saturated archetype is not evidence the offer works. It is evidence it used to work.

---

**Vector 2 - Paid ads intelligence (Meta Ad Library, then LinkedIn)**

Read the **angle and the positioning, not the creative execution**. A competitor running 10 to 50 variations of a single angle has already paid to learn that this market responds to that angle. The variations are them optimizing execution around something already proven, so the angle is the finding. Report what problem the angle names and what it promises, not the headline wording, the stock photo, or the button colour.

**Meta Ad Library (start here, it is public and needs no authentication)**

- Search Meta's Ad Library by advertiser name or Facebook page for each competitor and adjacent brand. It is a public ad-transparency registry, so there is no login, no ad account, and no API key involved. Access detail and the bulk options (a ready-made scraping actor, or a direct crawl with JavaScript rendering, plus the equivalent Google Ads Transparency Center route) are documented in `signal-strategy-playbook.md` under the ads-intelligence substitutes.
- For each advertiser, group the active ads by distinct angle and count the variations behind each one. Ten to fifty variations of a single angle is the strongest read available in this vector: proven paid demand for that angle.
- Note how long each angle has been running. Long-running plus many variations means real budget behind something that works.
- Capture per angle: the problem it names, the promise, the offer or CTA type, the variation count, and how long it has run.

**LinkedIn ads**

- Search LinkedIn's ad library for the same competitor and adjacent brands
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

**Where to look, and what this harness can actually read.** Tested from Claude Code on 2026-09-22. Retest any platform marked untested and log the result, because site blocking changes.

| Platform | Readable by the harness? | How to read it |
|---|---|---|
| Reddit | **No.** Web fetch, web search and the in-app browser all refuse reddit.com, direct requests return HTTP 403, and the free Reddit archive mirrors refuse agents | See the Reddit rule below |
| Trustpilot | Yes, web fetch returns verbatim reviews | Web fetch on each competitor's review page |
| Capterra | Yes, web fetch returns verbatim pros and cons | Web search limited to capterra.com to find the page, then web fetch |
| Hacker News | Yes, through its free public search API | `https://hn.algolia.com/api/v1/search?query=<terms>&tags=comment` |
| G2 | **No**, HTTP 403 | Operator paste only |
| App-store reviews, YouTube comments, niche industry forums | Untested | Try web fetch, then log readable or blocked |
| Quora, LinkedIn, Facebook groups | Expected login wall, untested | Operator paste only |

**The Reddit rule.** No tool in FNNL's approved stack reads Reddit, and the native harness is blocked from it, so **operator paste is the only Reddit route** (operator directive 2026-09-22):

- **Operator paste (zero cost, works today).** Someone on the team reads the threads in their own browser and pastes the post and comment text together with each thread URL. Pasted text counts as `buyer_quote` rows exactly like a fetched page. To keep this to minutes, hand them a short reading list: the subreddits this persona most likely uses (a Vector 0 hypothesis, because the harness cannot search Reddit to confirm them) and the complaint queries below.

If nothing was pasted, Reddit is **unread**: say so in the Signal Summary. Never claim Reddit coverage because Reddit appears in a platform list, and never write a Reddit quote from a search snippet, a model's summary, or memory.

**The pipeline:**

1. **Live X / social read: not available.** That step is retired with the no-AI-API rule (operator directive 2026-09-22), and nothing replaces it. Where the web search in step 2 returns public X or LinkedIn posts, read and quote them like any other page; otherwise note the gap in the Signal Summary.
2. **The harness's web search** finds the EXACT discussion and review URLs on the readable platforms above, using the complaint queries below. This hop returns URLs only. It must not summarize.
3. **The harness's web fetch** reads each page to clean text, and you capture exact quotes. A page the fetch cannot read is logged as unread, never paraphrased from its search snippet.
4. Tag every quote with `source_class` (`buyer_quote` / `competitor_claim` / `analyst_claim` / `news`). Only `buyer_quote` counts as pain. A competitor landing page is positioning, not pain. A competitor's own customer complaining in a review is a `buyer_quote`.
5. Tag every quote with the `persona` who voiced it, using the role or function the poster states about themselves. Pain is felt by a person, not by a company. Two personas inside one ICP often carry completely different pains, and flattening them into a single blob produces an offer that is mildly relevant to everyone and urgent to nobody. Where the stated role maps to an entry in `icp_soft_preferences.personas_to_prioritize`, use that entry's wording so the rows join cleanly. Where the role is genuinely not stated, write `persona: unknown` rather than guessing a role to fill the field.
6. Tag what each complaint is about: `complaint_about: own_workflow` (a problem in how they work today) or `complaint_about: competitor:<name>` (a failure of a product or provider they already use). Competitor complaints are the gap finder for the Intersection step, because they show what the field's current offers leave unsolved.

**Complaint queries.** Search in the words Vector 0 and the client's calls surfaced, never in the client's own jargon. Combine `[persona or job title] + [problem domain]` with three kinds of phrase:

- asking for help: "how do I", "looking for", "recommend", "struggling with"
- complaining: "frustrated with", "sick of", "waste of time", "is it just me", "anyone else"
- switching: "switched from [competitor]", "alternative to [competitor]", "cancelled [competitor]", "[competitor] review"

Then read the 1-to-3-star reviews of each Vector 1 competitor on the readable review sites. What a competitor's customers complain about is the part of the pain its offer leaves unsolved.

A question the ICP asks publicly in their own words = a problem they will trade their attention to solve. That problem is the lever your offer should pull.

Extract: the 3-5 problems this ICP complains about in their own language, each as a verbatim `exact_quote` with its `source_url`, `persona`, `complaint_about`, `frequency_count` (how many independent `buyer_quote` sources voiced it), and any `counterexample`. A pain only graduates into the brief at `frequency_count >= 3` (Validation Gate in `/ai-model-routing`); record weaker ones as `confidence_score: low`. First-party call quotes are a separate, stronger class and never count toward this `frequency_count`, and neither do Vector 0 hypotheses. This exact phrasing feeds copywriting later and anchors the offer brainstorm.

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

Job postings represent budget decisions. A company spending $80K/year to hire for a problem will pay to solve it.

---

**Intersection - find the pain the inputs agree on (Aaron's commonality step)**

Aaron does not pick a pain from any single input. He lays his three inputs side by side, looks for the commonality, validates it against the market, and rewords it in the buyer's language (2026-06-22). Do the same before writing the brief:

1. **Line up the inputs.** Evidenced pain from Vectors 3 and 4 (with Vector 0 as the map of what to look for), competitor angles with paid spend behind them from Vector 2, and the buyer's own words from the First-Party Call Vector.
2. **Pick the lowest-hanging pain:** the one with the strongest real evidence that a front-end offer can relieve quickly. In his experience it is "usually going to be around something revenue related". Treat that as his tendency, not a rule.
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
**Public complaint coverage:** [platforms read, with quotes per platform; platforms unread and why, e.g. "Reddit: unread, nothing pasted"]

---

### First-Party Buyer Voice (the client's own calls)

[From the First-Party Call Vector. One bullet per pain or objection, each carrying the verbatim `exact_quote`, the `persona` who said it, `call_outcome` (won or lost), and what the offer has to answer. These outrank public quotes wherever the two disagree. Never fabricate a quote, and never move a public quote into this section.

If the client has no recordings, write exactly: "Client has no call recordings available. All pain below is reconstructed from public buyer voice." Mark this section's confidence Low and leave it at that. Do not backfill it with Vector 3 material.]

**Offer language rewrite:** [the buyer's own words the offer should adopt, and the client-side jargon each one replaces. `/lead-magnet-brainstorm` and `/campaign-copywriting` inherit this line.]

---

### ICP Pain (in their words)
[3-5 bullets, each a verbatim `exact_quote` with its `source_url`, `persona`, `frequency_count`, and any `counterexample` from Vector 3 + 4. No paraphrasing - record how they actually describe the problem. Only pains at `frequency_count >= 3` independent `buyer_quote` sources are stated as pain; mark weaker ones `confidence_score: low` (Validation Gate, `/ai-model-routing`). First-party call quotes live in the section above and never count toward this `frequency_count`.]

---

### Pain by persona

Every pain row carries the persona who feels it, so `/lead-magnet-brainstorm` and `/campaign-strategy` can aim the offer at a specific buyer instead of an averaged ICP.

| Persona | Pain (their words) | Source class | Frequency or call outcome | Priority |
|---|---|---|---|---|
| [role] | [exact quote] | first_party_call / buyer_quote / job_posting | [N independent sources, or won/lost] | High / Med / Low |

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

> **Don't confuse H and K.** **H** is scoped access to the client's *actual paid product* (a trial, a free account) — its risk is product friction. **K** is a *purpose-built standalone* calculator or audit that is not the product at all: the prospect drops in their own numbers and gets an instant computed result. K runs as its own arm in any wave and is judged on time-agreed replies rather than positives (K1), and the agency builds it for the test (K2); both in `/lead-magnet-brainstorm`, reworked 2026-09-22. Score its saturation on whether this ICP is already being sent free calculators, not on the client's product.

**Saturated archetypes (avoid):** [list]
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
**Secondary:** [another open archetype]. Delivery capacity is not a filter here (operator directive 2026-09-22): `/lead-magnet-brainstorm` records who honors a prospect's yes during the test, and `/offer-test-slate` asks about full volume after the test.
**Avoid:** [saturated archetypes] - ICP has been overexposed, pattern interrupt value is gone.

### Contrarian opportunity (if applicable)
[Only populate if all or most archetypes are saturated/crowded. Name the archetype furthest from the saturated ones and why it could break the pattern.]

### Candidate Generation Input (the handoff `/lead-magnet-brainstorm` consumes)

The rows below are not a summary. They are the working input the next skill invents from, so each one must be filled from the sections above rather than restated loosely. Row 1 is the Intersection section's pain. For a multi-segment client (kickoff Step 2.5 confirmed two or more segments whose pain or offer fit differ), write one `Candidate Generation Input` block per segment, headed with the segment slug, so `/lead-magnet-brainstorm` builds each segment's own offer set (`offer.segments`, operator decision 2026-09-22).

| # | Persona | Pain, in their words | Open archetype(s) to build for | Why this pairing |
|---|---|---|---|---|
| 1 | [persona from Pain by persona] | [exact quote, not paraphrase] | [letter(s) from Open archetypes] | [one line] |
| 2 | | | | |
| 3 | | | | |

**Open archetypes still uncontested:** [letters + names from the Saturation Map's Open line]
**Closed to candidates:** [saturated archetypes, which candidate generation may not build toward without an explicit reason]
**Cross-client priors (optional; patterns only):** [offer patterns that flipped `offer_market_proven` or scaled as winners for OTHER clients in this workspace (their `portfolio-review.md` winners): the offer family, the deliverable's shape, the input asked for, and the next step. Or "none used".]
```

**Cross-client priors are optional and low-confidence (operator-approved Aaron alignment, 2026-09-21; S13, demonstrated).** Aaron's September build reads other clients' winning angles before generating offers, which is a demonstration rather than a tested rule, so a prior is a hint about a shape worth trying and never outranks this client's own evidence. Carry patterns only: never another client's name, number, data or copy, and never a prior as copy.

### What to do next (discovery mode)

Hand off directly to `/lead-magnet-brainstorm`. Discovery and candidate generation are one continuous offer motion split across two skills, so this mode is not finished until the handoff is usable as-is.

**What carries forward, by section name.** `/lead-magnet-brainstorm` opens by reading these four, and reads them rather than rebuilding them:

1. **`Candidate Generation Input`** - the numbered persona + pain + open-archetype rows. This is the primary input: candidates are generated against these rows.
2. **`Pain by persona`** - the full table behind those rows, including the prioritized personas with no pain evidence, which are named gaps rather than blanks.
3. **`Saturation Map`** - the open, crowded, and saturated archetypes with the denominator, so archetype choice is bounded by evidence.
4. **`First-Party Buyer Voice`** and **`ICP Pain (in their words)`** - the exact words the offer gets written in.

Nothing else in this brief is a prerequisite for that handoff. If `Candidate Generation Input` is empty or missing, this mode has not actually finished, so complete it here rather than letting the next skill re-derive pain from scratch.

---

## Mode: Validation

> **Research Routing: HARD RULE (Claude deep-research primary, enforced) applies here too.** Validation mode runs research (Vectors 1–4: competitor / ads / ICP-community / job-postings) and is often the path where `run_state.research_routing` is still **unset** (fresh diagnostic session). Apply the same gate as **AI/API Routing** above: `research_routing` has one value, `claude_deep_research` (set it if unset, and treat a retired `third_party_ai` or `claude_native` value as `claude_deep_research`), so the primary brain is the Claude native `/deep-research` fan-out harness. Do NOT stop to ask, and do NOT satisfy the primary pass with a bare inline WebSearch. The primary pass MUST be an **actual `/deep-research` invocation** (inline WebSearch/WebFetch alone does NOT satisfy it): record `ai_research_provider = claude-deep-research`, append the run-log line to `api-balance-ledger.md` (the provenance record the wired check reads), and run the same `research_routing_check.mjs` check with `--skill offer-intelligence`. Finishing with **no `/deep-research` primary** is a **flagged violation**. No API key of any kind is needed, and no other AI provider is ever called (no-AI-API rule, operator directive 2026-09-22). **Scope note:** validation mode runs the First-Party Call Vector first, and that vector sits outside this routing path entirely (client-supplied recordings, no external spend, no engine choice). It does NOT satisfy or substitute for the `/deep-research` primary pass on Vectors 1-4. Full rule: `/ai-model-routing`.

### When to trigger

- Live campaign reply rate below 1% after 300+ sends, where the offer is still a plausible bottleneck once the deliverability triggers and list quality are clear (Vector 5 Key diagnostics). Copy sits below the offer in the diagnostic order (doctrine §2), so a copy check is not a precondition for suspecting the offer
- Existing offer has live or prior campaign evidence and the client wants to keep it
- User says "let's test a different offer" - run this before `/experiment-design` so the new offer is market-validated, not random
- After `/lead-magnet-brainstorm` outputs an offer and you want a second opinion before locking. For a fast, hands-off second opinion - especially on a new or contrarian offer whose evidence is thin - run `/roast` on the offer: it returns a green-light / reshape / kill verdict plus the single cheapest test to run before committing copy build and list spend. Treat a thinly-evidenced offer's first small wave as that cheapest test rather than over-investing in a full build up front.

Do not use validation mode just because an onboarding form contains a suggested lead magnet or CTA. A form answer is a hypothesis. For new clients and new campaigns, run discovery mode here first (it follows `/icp-onboarding` directly), then `/lead-magnet-brainstorm`, with the client suggestion treated as Candidate A. No list-side or data-side work is a prerequisite for either, because all of it runs after the offer locks.

### Inputs

For validation mode, the existing offer to evaluate can come from `offer.validation_candidate` in `client-profile.yaml` when onboarding captured an evidence-backed offer, or from `profiles/<business-slug>/lead-magnets.md` when a previously locked offer exists. The evidence must be visible in `offer.validation_candidate_evidence`, prior campaign artifacts, or live send data.

If validation mode is requested but the only offer fields are `offer.client_suggested_*` and no evidence pointer exists, **stop**. Do not run validation mode. Route to discovery mode here (which follows `/icp-onboarding` directly), then `/lead-magnet-brainstorm` instead. Client suggestions without evidence are candidates, not validation inputs. This stop is unconditional: missing evidence is the whole reason for it, and the reordering of the chain changes only where the route goes, never whether the stop fires.

- `profiles/<business-slug>/client-profile.yaml` - ICP, value prop, hard filters, `icp_soft_preferences.personas_to_prioritize`
- `profiles/<business-slug>/lead-magnets.md` - the existing offer to evaluate
- The client's own won and lost sales-call recordings - the strongest evidence available for judging whether a live offer matches buyer reality. Request them if not already on file
- `profiles/<business-slug>/offer-intelligence.md` - load if it exists from a prior discovery run (the First-Party Call Vector and Vectors 1-4 may already be done; only run Vector 5 when send data exists)
- Client website URL
- Competitor names or URLs
- Live send data (optional) - reply rate and reply sentiment from current campaign

### Steps

**Step 1: Pre-flight - walk the diagnostic order, then spot obvious broken offers in 2 minutes**

**First, walk Aaron's diagnostic order top-down and stop at the highest broken item (doctrine §2; operator-approved Aaron alignment, 2026-09-21).** Do not work on a lower item while a higher one is broken. The highest broken item is the finding, and it names what Iterate or Swap must fix.

0. **Is the buyer real and specific?** A named buyer type with a problem they already know they have, plus role, authority, current situation and exclusions. "Founders" or "B2B companies" is not a buyer.
1. **Is the offer a concrete thing, or a description of the company?** It must say what they get, how fast, what they must do, and what risk they take.
2. **Is every yes being honored?** Aaron's "easy for you to fulfill" (doctrine §2 step 2). For a live offer this is a fulfillment check: a yes that goes unhonored is a delivery problem to fix before the offer is judged, not evidence against the offer. Full-volume capacity is asked in `/offer-test-slate` scale review, never here (operator directive 2026-09-22; the twenty-buyer figure this item used to cite was this system's number, doctrine §13).
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

**Separately, check fulfillment (not a red flag against the offer).** Is every yes the live offer gets being honored as promised, on time? If not, fix delivery before judging the offer. Whether it can run at full volume is asked in `/offer-test-slate` scale review, never scored here (operator directive 2026-09-22; this used to be the question "can the front-end owner deliver it to 100 people this week without custom work per person?").

---

**Step 2: Research vectors**

If a discovery brief already exists at `profiles/<business-slug>/offer-intelligence.md`: the First-Party Call Vector and Vectors 1-4 may already be done. Cross-reference the existing first-party buyer voice, pain-by-persona table, paid-ads angles, saturation map, and signal summary. Run Vector 5 only if a campaign is already live and send data exists.

If no discovery brief exists: run the First-Party Call Vector, then Vectors 1-4. Then run Vector 5 only if a campaign is already live and send data exists.

**First-Party Call Vector and Vectors 1-4** - same as discovery mode above. Run the First-Party Call Vector here whenever the client has recordings: validation mode's whole job is checking an offer against buyer reality, and the client's own won and lost calls are the closest thing to that reality on file. It is not a hard requirement, because some clients record nothing.

**Vector 5 - Live send data**

- Pull reply rate and classify reply sentiment
- Use the positive reply scoring skill for the locked `run_state.sending_platform`, if `/stack-setup` activated a pack that provides one (vendor packs ship their own, e.g. `/emailbison-positive-reply-scoring`).
  - If no pack is active, classify the replies from that platform's own inbox or reply export directly.
  - If neither exists, say so and score the replies by hand against the buckets below rather than implying coverage.

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

Minimum threshold: do not call the offer broken before 300 sends. Below that, variance is too high to trust.

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
| Perceived value: it sounds like something they would pay for, given free (doctrine §3), ideally anchored to a real price or cost. Delivery effort and scale do not score (operator directive 2026-09-22; `/offer-test-slate` scale review asks about capacity) | 0-1 | | |
| Proves your specific competence in one step | 0-1 | | |
| Requires <60 seconds from prospect to claim | 0-1 | | |
| Differentiated from the field (not just one competitor) | 0-2 (0=same as 3+, 1=same as 1-2, 2=nobody else does this) | | |
| **Total** | **/7** | | |

**Saturation penalty:** If the existing offer's archetype is SATURATED, subtract 2 from its field differentiation score. The ICP's numbness to the archetype is real even if your specific execution is different.

---

**Step 5: Decision framework**

**Saturation override - check first**

If the existing offer's archetype is SATURATED and the market alternative uses the same archetype: do not pick the market alternative. Go to Contrarian Offer analysis before running decision logic. A high-scoring offer in a saturated category will underperform a mid-scoring contrarian because the ICP has already learned to ignore the pattern.

**Normal decision logic**

| Existing offer score | Market alternative score | Decision |
|---|---|---|
| 6-7 | Any | **Go** - existing offer is strong, ship it |
| 5 | 6-7 | **Iterate** - refine framing using ICP language from Vector 3 |
| 5 | 5 | **Iterate** - tighten CTA specificity, both are mid |
| 3-4 | 6-7 | **Swap** - existing offer is weak, replace with market alternative |
| 3-4 | 5 | **Swap + test** - neither dominant, run both as offer-validation arms (`offer.validation_arms`, `/campaign-strategy` Offer-Validation Wave) via `/experiment-design`'s offer-only type |
| 0-2 | Any | **Swap** - structurally broken, replace immediately |

**Go:** Lock the offer in `client-profile.yaml`, proceed to `/campaign-strategy`.

**Iterate:** Rewrite framing, CTA, and specificity. Common moves:
- Make deliverable more specific ("a 5-minute audit" -> "your first three subject lines, rewritten": a done-for-you deliverable, never named an audit; doctrine §3, ledger R09)
- Use ICP's own language from Vector 3
- Eliminate friction (no form fill, reply-to-claim)
- Sharpen competence proof ("I'll send you ideas" -> "I'll rewrite your first cold email subject line")

Re-score until the offer hits 6+.

**Swap:** Choose the market alternative or contrarian offer. If `offer.validation_arms` already holds an active arm that passed every `/lead-magnet-brainstorm` gate, that arm is the first swap candidate. Write the offer-only experiment hypothesis for `/experiment-design`. Any new offer goes through `/lead-magnet-brainstorm` (ranked with its labels and its honoring fields, with its four fulfillment artifacts written before it sends) and into the next `/offer-test-slate` flight.

Keep the CTA at **direction-level** here — a plain-English ask direction, not exact send copy. Exact CTA wording is deferred to `/campaign-copywriting`, which writes it later under the verified-list gate (`verified-list-gate.md`) and runs it through `spam-word-checker.md` + `cold-email-copy-best-practices.md`. Do not write exact CTA send phrasing to the validation brief or `client-profile.yaml` — this skill runs before any list exists.

---

**Step 5B: Contrarian offer analysis**

Trigger: saturation override fired, OR both existing and market alternative score below 5, OR user asks "what's the unexpected offer?"

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

Output a named contrarian offer. Flag it clearly as contrarian - it trades market validation for pattern interruption.

---

**Step 6: Output**

Preserve the discovery brief at `profiles/<business-slug>/offer-intelligence.md`. Save each validation run separately to:

```text
profiles/<business-slug>/offer-validations/YYYY-MM-DD-offer-validation.md
```

Save the CTA at **direction-level** only (`lead_magnet_cta_direction` — a plain-English ask, not final copy), matching the Locked offer block below. Exact send copy is produced later by `/campaign-copywriting` under the verified-list gate (`verified-list-gate.md`). Do not save exact CTA send copy here.

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

Hand off to `/experiment-design` as an offer-only experiment. Keep list, copy, and infrastructure frozen. Only the offer changes.
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

- **Using competitor offers as confirmation without checking saturation.** Three competitors offering free audits is not validation. It is a warning. Count the field before following it.
- **Running the contrarian offer just because it's different.** Pattern interruption has value, but an offer disconnected from ICP pain is still a bad offer. The contrarian offer still needs to score well on pain relevance and competence proof - it just gets a pass on differentiation.
- **Swapping offer and copy at the same time.** Combined experiment. You will learn nothing about which change drove the result. Swap the offer, freeze everything else, run `/experiment-design`.
- **Calling the offer broken before 300 sends.** Variance is too high. Deliverability and list issues look identical to offer problems at low volumes.
- **Treating reply rate alone as an offer problem, or a copy fix as clearing the offer.** Rule out deliverability when one of its triggers fires (bounce above the house threshold, a placement-test flag, reply rate near 0.1%, contacts-per-positive jumping) and rule out list quality; then walk the diagnostic order (doctrine §2), where the offer sits above the copy. Open rate is never the trigger: opens are not tracked in this system (operator-approved Aaron alignment, 2026-09-21).
- **Calling an offer a winner on positive replies alone.** Report time-agreed replies per 1,000 first touches beside the positive-reply rate; a positive lift with no rise in time-agreed replies is farming interest (doctrine §0, §4).
- **Iterating the offer without changing the language.** Iteration means rewriting toward the ICP's own words from Vector 3. Keeping your language gets the same result.
- **Skipping discovery mode because "the client already has a strong offer."** Strong relative to what? Run discovery first so the brainstorm is informed, not assumed.
- **Reconstructing every pain from public strangers while the client's call recordings sit unopened.** Public buyer voice is a proxy. The client's own won and lost sales calls are the buyer saying it directly, in the exact words the offer should use, about this exact category. Ask for the recordings before you mine forums. If the client genuinely has none, state that in the brief rather than letting the gap pass unnoticed.
- **Flattening pain into one ICP blob.** Two personas inside the same ICP feel different pains, and an offer aimed at their average is urgent to nobody. Every pain row carries a `persona`.
- **Firing SATURATED off three competitors.** Three is not a field. Research 5 to 10, record the denominator, and mark the archetype INSUFFICIENT SAMPLE below 5 instead of guessing.
- **Listing Reddit as researched when nothing was read.** The harness cannot read Reddit, and operator paste is the only route. Report the pasted threads and the quotes they gave, or write "Reddit: unread". A platform named in a list is not a platform read.
- **Treating the persona research as buyer pain.** Vector 0 is a model's educated guess about the persona. It tells you where to look and what words to search with. Only a real buyer saying it, in public or on a client call, makes it pain.
- **Reading the ad creative instead of the ad angle.** Fifty variations of one angle is the finding. The headline wording and the imagery are the advertiser optimizing around something already proven, not the proof itself.

---

## Integration

| Skill | Relationship |
|---|---|
| `/icp-onboarding` | Runs immediately before this skill. Produces the ICP, the value prop, `icp_soft_preferences.personas_to_prioritize` (the persona list every pain row maps against), `sales_call_library` (whether the client's won and lost recordings exist and where, which the First-Party Call Vector reads before asking the client for anything), and `buyer_pain_hypothesis` (the client's unverified belief about buyer pain, which this skill confirms or overturns). |
| `/lead-source-strategy` | Runs in Lead Source Plan Mode AFTER campaign selection, far downstream of this skill. The chain is: buyer and pain, then the offer, then the list built to fit that offer, then the copy. Nothing it produces is a prerequisite here. |
| `/lead-magnet-brainstorm` | Runs after discovery mode. Reads the offer-intelligence.md brief to anchor archetype selection, using the first-party buyer language, the pain-by-persona table, the paid-ads angles, and the ICP language from Vector 3. |
| `/offer-test-slate` | Shows this brief's findings to the client (buyer types, problems in the buyer's words, the gap competitors leave) beside the offers `/lead-magnet-brainstorm` builds from them, before the test. Client approval is optional. After the test, its scale review asks what running the winner at full volume takes. |
| `/campaign-strategy` | Reads the locked offer from `client-profile.yaml` and the data-point catalog. The front-end offer suggestions section should defer to this output. |
| `/experiment-design` | If validation mode decision = Swap or Swap (Contrarian), this skill writes the offer-only experiment hypothesis that `/experiment-design` formalizes. |
| `/roast` | Optional fast pre-lock stress test of a candidate offer (hands-off council → green-light / reshape / kill + the single cheapest 48-hour validation test). Useful for a new or contrarian offer before committing build and spend; complements this skill's evidence-based Go/Iterate/Swap rather than replacing it. |
| `/ask-aaron` | Optional persona consult for pressure-testing a candidate offer against Aaron Shepherd's diagnostic (is the buyer real and specific, is it a concrete deliverable or a service description, can every yes in the test be honored, his "easy for you to fulfill" applied at test scale; the twenty-buyer figure was this system's safeguard, doctrine §13, and the full-volume capacity question moved to `/offer-test-slate` scale review on 2026-09-22) or choosing between offer cards. Advisory only; complements the evidence-based Go/Iterate/Swap here rather than replacing it. |
| `/cold-email-kickoff` | Invokes this discovery mode immediately after `/icp-onboarding`, then `/lead-magnet-brainstorm`, then `/data-point-discovery` once the offer is locked. |
| `/cold-email-weekly-rhythm` | If reply rate drops below 1% on a running campaign, trigger validation mode before changing copy or list. |
| `/email-deliverability-audit` | Run it first when a deliverability trigger fires: bounce above the house threshold, a placement-test flag (a trigger to investigate, never decisive alone), reply rate near 0.1%, or contacts-per-positive jumping. Open rate is never the trigger, because opens are not tracked in this system (open tracking stays off on the sending platform). Do not diagnose the offer while a trigger is open. |

## What to do next

- **Discovery mode complete:** Hand off to `/lead-magnet-brainstorm`. It reads the brief at `profiles/<business-slug>/offer-intelligence.md`, starting from its `Candidate Generation Input` block. Nothing list-side or data-side has run at this point, and none of it is needed for the handoff.
- **Validation - Go:** Proceed to `/campaign-strategy`. Offer is locked in `client-profile.yaml`.
- **Validation - Iterate:** Stay here, rewrite using ICP language from Vector 3, re-score. Repeat until score hits 6+.
- **Validation - Swap or Swap (Contrarian):** Take the experiment hypothesis to `/experiment-design`. Run as offer-only experiment. Keep everything else frozen.

