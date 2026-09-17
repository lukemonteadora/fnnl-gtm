---
name: offer-intelligence
description: Two-mode offer research skill. Discovery mode runs after /icp-onboarding and /lead-source-strategy Source-Signal Discovery Mode, then before /lead-magnet-brainstorm. It researches source-backed pain, ICP pain, competitor offer saturation, and open archetypes so the brainstorm invents from evidence. Validation mode runs standalone when a live campaign underperforms and evaluates an existing offer against market evidence with a Go / Iterate / Swap decision.
---

# Offer Intelligence
## Canonical Profile Root

All profiles/<business-slug> paths in this skill resolve under:

```text
<outbound>/profiles
```

Here `<outbound>` is the root of this skill library - resolve it to wherever the library is currently checked out (local Documents, OneDrive, or a git worktree); never hardcode an absolute path. Do not create client profiles under a `profiles/` folder at your current working directory.

Cold email operators default to two failure modes: (1) copying whatever offer their competitors use, or (2) brainstorming in a vacuum with no market signal. This skill escapes both.

**In discovery mode**, it runs before the offer exists, after source-signal discovery on new-offer paths. It researches the market and source-backed pain first so that `/lead-magnet-brainstorm` invents from evidence, not from gut feel.

**In validation mode**, it runs after an offer is live - evaluating whether the offer is strong, weak, or invisible due to saturation, and deciding whether to keep it or swap it.

## The saturation problem

Market evidence cuts both ways. If competitors are leading with "free audit" and have been for 18 months, that is not evidence that "free audit" works today. It is evidence that it used to work - and that the ICP has now seen it 400 times and auto-deletes it. Following the market into a saturated offer makes you the fifth cold email this week saying the same thing.

The right response to a saturated market is a contrarian offer: the archetype the ICP has never been pitched in this context. Pattern interruption itself has conversion value that no rubric score can capture.

## Offer Architecture gate (shared with copy)

Both modes here feed the three-question Offer Architecture gate that `/campaign-copywriting` runs before Email 1: (1) SQL vs MQL framing, (2) the easy-to-say-yes-to test, (3) a named risk reversal. Evaluate the offer against these as you research. In discovery mode, prefer directions that can name a clean risk reversal and pass the easy-yes test. In validation mode, a Go decision requires all three to hold; a missing risk reversal or a failed easy-yes test is an Iterate or Swap signal, not just a copy problem. Full gate: `/campaign-copywriting` Offer Architecture.

## Material Decision Rule

When this skill reaches a material fork, name the realistic options, recommend the strongest path, and explain why the main alternatives are weaker before committing.

Ask before choices that affect spend, provider routing, source of truth, list quality, campaign direction, client-facing output, live systems, scraping or account risk, or legal/compliance risk. For low-risk reversible choices, state the recommendation and proceed.

Do not turn failed or unsafe paths into user-facing options. If this skill's QA rules or stop gates reject a path, filter it out and explain the blocker only when useful.

When asking the user, use the Claude Desktop native Interactive Inputs / Choice Prompts pattern from /clarification-first: recommended option first, short choices, and Custom answer last when a custom answer is plausible.

## Interaction Policy

Defers to `/autonomous-execution-policy`. Under `run_state.execution_mode = auto_execute` (the operator's default), proceed without pausing: pick the strongest option per this skill's rubric, record it to `run_state`/profile, and continue — never re-ask a decision already in `run_state`, the profile, memory, or the operator's latest message. Stop only for the policy's hard-stops (spend over the approved ceiling, live send, credentials, provider/source-of-truth change, safety gates). On a long async wait, background-poll and move to other productive work — never idle.

---

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short — record status, not raw output. Full protocol: `client-activity-log.md`.

## Mode: Discovery

### When to trigger

- Invoked by `/cold-email-kickoff` after `/icp-onboarding` and `/lead-source-strategy` Source-Signal Discovery Mode, before `/lead-magnet-brainstorm`
- When starting fresh with no existing offer
- When the user wants to understand the market before deciding what to offer

For new clients and new campaigns, source-signal discovery must run before this mode. Evidence-backed existing-offer validation does not require source-signal discovery first.

### What this mode does

Runs the Source-Signal Vector plus Vectors 1-4. No send data exists yet because no campaign exists. Builds a market signal brief covering where pain is observable, why the source signal implies pain now, ICP pain in the prospect's own words, a saturation map of which offer archetypes are overused in this space, and the open or contrarian archetypes that `/lead-magnet-brainstorm` should build toward.

Does **not** evaluate an offer or output a Go/Iterate/Swap decision. There is nothing to evaluate yet. The output is research that feeds invention.

### AI/API Routing

> **Research Routing — HARD RULE (Claude deep-research primary, enforced).** Read `run_state.research_routing`: if it is **unset**, default to **`claude_deep_research`** and proceed. The primary research brain is the Claude native `/deep-research` fan-out harness (multiple sub-agents research every needed category in parallel, fetch real sources, adversarially verify each claim, and synthesize a cited report). Do NOT stop to ask, and do NOT satisfy the primary pass with a bare inline WebSearch (that is the weak `claude_native` path, which is not the same thing as `claude_deep_research`). The operator can explicitly opt back to **`third_party_ai`** (the older Perplexity-led primary); switch to that only on an explicit opt-out. In `claude_deep_research` mode the primary pass MUST be an **actual `/deep-research` invocation** (native inline WebSearch/WebFetch, DiscoGen, or a complement engine do NOT satisfy it) — record `ai_research_provider = claude-deep-research` and append an `api-balance-ledger.md` line; a research step that finishes with **no `/deep-research` primary** is a **flagged violation** (run it, or get a fresh explicit OK to skip). **Wired check:** after the primary pass, run `node scripts/research/research_routing_check.mjs --skill offer-intelligence --client <business-slug> --json` — a `violation:true` / exit 1 means no logged primary; do not declare this research step done until it passes. No third-party key is needed for the primary pass (it is the native harness); a missing `PERPLEXITY_API_KEY` is a credential **HARD-STOP** only if the operator explicitly chose `third_party_ai`. Full rule: `/ai-model-routing`.

This skill runs at `pass_depth = deep` on the single premium-by-default, non-redundant research path (`/ai-model-routing`) — there is no cheap/standard tier to pick. Assemble the research brief (goal, ICP, decision, output, freshness, confidence, source types, VOC?, assumptions, open questions). The Claude native `/deep-research` fan-out harness runs the primary broad pass (web-grounded competitor/ad/market research + cited source discovery via parallel sub-agents, adversarial verification, cited synthesis); Serper and Grok are discovery helpers (raw URLs / X-social), not a second research brain; raw page extraction → Spider Cloud; **ICP-pain VOC mining (Vector 3) → the VOC / Raw-Evidence pipeline** (Grok → Perplexity Search/Serper for the exact discussion URLs → Spider Cloud to scrape, with `source_class` kept); saturation synthesis and pain-language crunch → DeepSeek (bulk + pre-compress raw dumps before any premium model). After the primary pass, fill ONLY its gaps with the demoted gap-fill engines — **Perplexity** (web-grounded gap-fill) and **OpenAI `o4-mini-deep-research`** (thin / technical / multi-step coverage, weak/unsupported claims, missing counterexamples, overclaimed ICP, contradictions); never a duplicate broad pass (`o4-mini-deep-research` default, `o3-deep-research` pinpoint; OpenAI 1-3 prompts/client). When the corpus is too big or references too many, use **scale mode**: Perplexity + OpenAI + Serper EMIT ranked URLs → Spider Cloud scrapes → DeepSeek compresses → Claude Code synthesizes. Run the Validation Gate before the brief is finalized: a pain counts only at `frequency_count >= 3` independent `buyer_quote` sources, counterexamples kept. The brief this skill writes is research, not copy. Keep CTA wording out — final copy is written later by `/campaign-copywriting` (Claude Code native, clean-packet sub-agent) and any CTA must still pass `spam-word-checker.md` and `cold-email-copy-best-practices.md`.

### Inputs

- `profiles/<business-slug>/client-profile.yaml` - ICP, value prop, hard filters
- `profiles/<business-slug>/source-signal-intelligence.md` - required for new-client and new-campaign new-offer paths
- Client website URL
- Competitor names or URLs - ask if not already in the profile

If discovery mode is invoked for a new client or new campaign and `source-signal-intelligence.md` is missing, stop and route to `/lead-source-strategy` Source-Signal Discovery Mode first. Do not lock an offer before source-signal discovery unless this is evidence-backed existing-offer validation.

### Steps

**Source-Signal Vector - observable source context**

- Load `profiles/<business-slug>/source-signal-intelligence.md`.
- Extract the top ranked source signals, capability boundary, why-now hypotheses, likely pain, possible micro-offers, and risks.
- For each top signal, assess:
  1. where the pain signal lives
  2. why the signal implies internal pain now
  3. expected volume and reachability
  4. evidence URL quality
  5. creep risk
  6. offer-fit risk
- Treat possible micro-offers as hypotheses only. They do not become `offer.lead_magnet` until `/lead-magnet-brainstorm` ranks options and the operator selects one.

Extract: 2-4 source-backed pains and 2-4 source-backed micro-offer directions that deserve comparison against competitor and ICP evidence.

---

**Vector 1 - Competitor front-end offers + saturation count**

- Fetch competitor websites. Look at: homepage hero CTA, pricing page CTA, pop-up or inline lead magnets, any "free X" offer, how trial or demo is framed
- Check their LinkedIn company pages for pinned posts or sponsored lead gen content
- If they run LinkedIn Lead Gen Forms, the form title usually names the offer directly
- Search `"[competitor name]" "free" site:linkedin.com` or `"[competitor name]" cold email swipe` for published examples

Extract for each competitor:
1. The specific offer they lead with
2. Which archetype it maps to (A-K from `/lead-magnet-brainstorm`)
3. How long they appear to have been running it

Build the saturation table:

| Competitor | Offer | Archetype | Running how long |
|---|---|---|---|
| [Name] | [Offer] | [Letter] | [Duration or Unknown] |

**Saturation rule:** Count how many competitors use the same archetype.
- 3 or more -> **SATURATED** (ICP is numb to it)
- 2 -> **CROWDED** (notable but not fatal)
- 0-1 -> **OPEN** (uncontested)

A saturated archetype is not evidence the offer works. It is evidence it used to work.

---

**Vector 2 - LinkedIn ads intelligence**

- Search LinkedIn's ad library for competitor or adjacent brands
- Use web search `"[competitor]" linkedin ad OR sponsored OR "lead gen form"` as proxy if direct access is limited
- Look for: what problem does the ad headline name? What CTA? What offer?

Weight correctly:
- Ad running 30+ days with engagement = real spend = high signal
- Fresh or low-engagement ad = hypothesis, not proof = low signal
- Multiple competitors running same angle = cross-reference with Vector 1 to distinguish "validated" from "everyone copied each other"

Extract: the 1-3 offer angles in this space that have real paid spend behind them.

---

**Vector 3 - ICP community signals (VOC / Raw-Evidence)**

This is the VOC layer. Run the **VOC / Raw-Evidence pipeline** defined in `/ai-model-routing` - do NOT just "search and summarize," because a summary hides the sampling and launders marketing copy into "pain":

1. **Grok** - live X / LinkedIn read for current buyer language.
2. **Perplexity Search / Serper** - find the EXACT discussion URLs (Reddit, Quora, G2 / Capterra / Trustpilot, Hacker News, YouTube, industry forums, Slack archives). Query seed: `[ICP job title] + [problem domain] + ("how do I" OR "looking for" OR "recommend" OR "struggling with")`. This hop returns URLs only - it must not summarize.
3. **Spider Cloud** - scrape each thread to clean text; capture exact quotes.
4. Tag every quote with `source_class` (`buyer_quote` / `competitor_claim` / `analyst_claim` / `news`). Only `buyer_quote` counts as pain - a competitor landing page is positioning, not pain.

A question the ICP asks publicly in their own words = a problem they will trade their attention to solve. That problem is the lever your offer should pull.

Extract: the 3-5 problems this ICP complains about in their own language, each as a verbatim `exact_quote` with its `source_url`, `frequency_count` (how many independent `buyer_quote` sources voiced it), and any `counterexample`. A pain only graduates into the brief at `frequency_count >= 3` (Validation Gate in `/ai-model-routing`); record weaker ones as `confidence_score: low`. This exact phrasing feeds copywriting later and anchors the offer brainstorm.

Sample before scaling: collect 20-30 quotes first; expand only if patterns are strong. If community signal is weak (niche market, hard-to-find ICP): note it, weight this vector low, lean more on Vectors 1 and 4.

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

Job postings represent budget decisions. A company spending $80K/year to hire for a problem will pay to solve it.

---

**Synthesize and output the discovery brief**

After source-signal discovery and all four market vectors, build the brief that `/lead-magnet-brainstorm` reads.

Save to `profiles/<business-slug>/offer-intelligence.md`:

```markdown
## Offer Intelligence - [Business Name] (Discovery)
**Date:** YYYY-MM-DD
**Mode:** Discovery
**Status:** Feeds /lead-magnet-brainstorm - no offer locked yet

---

### ICP Pain (in their words)
[3-5 bullets, each a verbatim `exact_quote` with its `source_url`, `frequency_count`, and any `counterexample` from Vector 3 + 4. No paraphrasing - record how they actually describe the problem. Only pains at `frequency_count >= 3` independent `buyer_quote` sources are stated as pain; mark weaker ones `confidence_score: low` (Validation Gate, `/ai-model-routing`).]

---

### Source-Signal Brief

- Primary source signal:
- Why-now hypothesis:
- Likely pain:
- Evidence quality:
- Volume and reachability:
- Creep risk:
- Offer-fit risk:
- Micro-offer hypotheses to compare:

---

### Signal Summary

| Source | Signal found | Confidence |
|---|---|---|
| Source-signal discovery | [top source-backed pain and why-now signal] | High / Med / Low |
| Competitor offers | [what you found] | High / Med / Low |
| LinkedIn ads | [what you found] | High / Med / Low |
| ICP community | [what you found] | High / Med / Low |
| Job postings | [what you found] | High / Med / Low |

---

### Saturation Map

| Archetype | Letter | Status |
|---|---|---|
| Free audit / diagnostic | A | SATURATED / CROWDED / OPEN |
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

> **Don't confuse H and K.** **H** is scoped access to the client's *actual paid product* (a trial, a free account) — its risk is product friction. **K** is a *purpose-built standalone* calculator or audit that is not the product at all: the prospect drops in their own numbers and gets an instant computed result. K is fenced: it may not front an offer's baseline validation wave (K1, a measurement rule, not a cost one) and it needs a committed, funded, owned build (K2) — both in `/lead-magnet-brainstorm`. Score its saturation on whether this ICP is already being sent free calculators, not on the client's product.

**Saturated archetypes (avoid):** [list]
**Crowded archetypes (proceed with caution):** [list]
**Open archetypes (prioritize):** [list]

---

### Recommended direction for /lead-magnet-brainstorm

**Source-backed angle:** Use [primary source signal] to make the offer feel timely and specific without overclaiming buying intent.
**Primary:** Focus invention on [open archetype(s)] - uncontested in this market, aligned with ICP pain #[X].
**Secondary:** [another open archetype] if delivery capacity supports it.
**Avoid:** [saturated archetypes] - ICP has been overexposed, pattern interrupt value is gone.

### Contrarian opportunity (if applicable)
[Only populate if all or most archetypes are saturated/crowded. Name the archetype furthest from the saturated ones and why it could break the pattern.]
```

### What to do next (discovery mode)

Hand off directly to `/lead-magnet-brainstorm`. That skill reads this brief and uses the source-signal brief, saturation map, and ICP pain language to anchor archetype selection instead of working blind.

---

## Mode: Validation

> **Research Routing — HARD RULE (Claude deep-research primary, enforced) applies here too.** Validation mode runs research (Vectors 1–4: competitor / ads / ICP-community / job-postings) and is often the path where `run_state.research_routing` is still **unset** (fresh diagnostic session). Apply the same gate as **AI/API Routing** above: if `research_routing` is unset, default to **`claude_deep_research`** and proceed — the primary brain is the Claude native `/deep-research` fan-out harness. Do NOT stop to ask, and do NOT satisfy the primary pass with a bare inline WebSearch (the weak `claude_native` path is not the same thing as `claude_deep_research`); the operator can explicitly opt back to **`third_party_ai`** (the older Perplexity-led primary) only on an explicit opt-out. In `claude_deep_research` mode the primary pass MUST be an **actual `/deep-research` invocation** (native inline WebSearch/WebFetch, DiscoGen, or a complement engine do NOT satisfy it) — record `ai_research_provider = claude-deep-research` and append an `api-balance-ledger.md` line; finishing with **no `/deep-research` primary** is a **flagged violation**. No third-party key is needed for the primary; a missing key is a credential **HARD-STOP** only if the operator explicitly chose `third_party_ai`. Full rule: `/ai-model-routing`.

### When to trigger

- Live campaign reply rate below 1% after 300+ sends, where the offer is still a plausible bottleneck after checking deliverability, bounce rate, list quality, and copy
- Existing offer has live or prior campaign evidence and the client wants to keep it
- User says "let's test a different offer" - run this before `/experiment-design` so the new offer is market-validated, not random
- After `/lead-magnet-brainstorm` outputs an offer and you want a second opinion before locking. For a fast, hands-off second opinion - especially on a new or contrarian offer whose evidence is thin - run `/roast` on the offer: it returns a green-light / reshape / kill verdict plus the single cheapest test to run before committing copy build and list spend. Treat a thinly-evidenced offer's first small wave as that cheapest test rather than over-investing in a full build up front.

Do not use validation mode just because an onboarding form contains a suggested lead magnet or CTA. A form answer is a hypothesis. For new clients and new campaigns, run `/lead-source-strategy` Source-Signal Discovery Mode first, then discovery mode here, then `/lead-magnet-brainstorm`, with the client suggestion treated as Candidate A.

### Inputs

For validation mode, the existing offer to evaluate can come from `offer.validation_candidate` in `client-profile.yaml` when onboarding captured an evidence-backed offer, or from `profiles/<business-slug>/lead-magnets.md` when a previously locked offer exists. The evidence must be visible in `offer.validation_candidate_evidence`, prior campaign artifacts, or live send data.

If validation mode is requested but the only offer fields are `offer.client_suggested_*` and no evidence pointer exists, stop. Route to `/lead-source-strategy` Source-Signal Discovery Mode, then discovery mode here, then `/lead-magnet-brainstorm` instead. Client suggestions without evidence are candidates, not validation inputs.

- `profiles/<business-slug>/client-profile.yaml` - ICP, value prop, hard filters
- `profiles/<business-slug>/lead-magnets.md` - the existing offer to evaluate
- `profiles/<business-slug>/source-signal-intelligence.md` - optional context for validation; not required when validating a real existing offer with evidence
- `profiles/<business-slug>/offer-intelligence.md` - load if it exists from a prior discovery run (Source-Signal Vector and Vectors 1-4 may already be done; only run Vector 5 when send data exists)
- Client website URL
- Competitor names or URLs
- Live send data (optional) - reply rate and reply sentiment from current campaign

### Steps

**Step 1: Pre-flight - spot obvious broken offers in 2 minutes**

Before any research, run the existing offer through four questions. This catches structurally broken offers without burning research time.

| Question | Red flag if... |
|---|---|
| Would they want this even if they never buy from you? | No -> it's a pitch dressed as a gift |
| Can the front-end owner (the agency by default - see /lead-magnet-brainstorm Fulfillment Split) deliver it to 100 people this week without custom work per person? | No -> scale risk, resolvable: OK if the delivering party has confirmed per-prospect capacity at the expected reply-volume, or it is capped via tease-then-build (Fulfillment Split); otherwise it doesn't scale |
| Does receiving it prove your specific competence? | No -> it's just a gesture |
| Does it require less than 60 seconds from the prospect to claim? | No -> friction kills reply rate |

- 0 red flags: structurally sound. Proceed to research.
- 1 red flag: note the flaw, proceed, factor into final score.
- 2+ red flags: offer is broken structurally. Flag it. Research still runs, but recommendation will almost certainly be Swap.

---

**Step 2: Research vectors**

If a discovery brief already exists at `profiles/<business-slug>/offer-intelligence.md`: the Source-Signal Vector and Vectors 1-4 may already be done. Cross-reference the existing source-signal brief, saturation map, and signal summary. Run Vector 5 only if a campaign is already live and send data exists.

If no discovery brief exists: run the Source-Signal Vector when `source-signal-intelligence.md` is available, then Vectors 1-4, then run Vector 5 only if a campaign is already live and send data exists.

**Source-Signal Vector and Vectors 1-4** - same as discovery mode above. The Source-Signal Vector is optional in validation mode when a real existing offer already has live or prior campaign evidence.

**Vector 5 - Live send data**

- Pull reply rate and classify reply sentiment
- Use the positive reply scoring skill for the locked `run_state.sending_platform`, if `/stack-setup` activated a pack that provides one (vendor packs ship their own, e.g. `/emailbison-positive-reply-scoring`).
  - If no pack is active, classify the replies from that platform's own inbox or reply export directly.
  - If neither exists, say so and score the replies by hand against the buckets below rather than implying coverage.

Classify replies into five buckets:

| Bucket | What it signals |
|---|---|
| Interested | Offer resonated - do not change it |
| Not now / wrong timing | Offer is directionally right, timing problem |
| Wrong person | List problem, not offer problem |
| Not interested (no reason given) | Offer did not create desire - likely offer or copy |
| "Already have something" / "we use X" | Offer is commoditized - strong signal to swap |

Key diagnostics:
- Open rate 30%+ but reply rate below 1% -> offer is a candidate bottleneck only after checking bounce rate, inbox placement or deliverability, list quality, and copy. The subject may have earned attention, but the ask is not proven to be the cause yet.
- Open rate below 20% -> deliverability or subject line problem. Do not blame the offer. Run `/email-deliverability-audit` first.
- Bounce rate above accepted thresholds or repeated wrong-person replies -> list quality problem. Do not swap the offer until the list is fixed.
- Copy that fails `/spam-word-checker` or `cold-email-copy-best-practices.md` -> copy problem. Fix copy before blaming the offer.
- "Already have something" replies appearing more than once -> the archetype is saturated in their mind.

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
| Deliverable at scale by the front-end owner (agency by default), to every positive responder at expected reply-volume - custom-per-prospect counts with confirmed capacity (see /lead-magnet-brainstorm Fulfillment Split) | 0-1 | | |
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
| 3-4 | 5 | **Swap + test** - neither dominant, run two variants via `/experiment-design` |
| 0-2 | Any | **Swap** - structurally broken, replace immediately |

**Go:** Lock the offer in `client-profile.yaml`, proceed to `/campaign-strategy`.

**Iterate:** Rewrite framing, CTA, and specificity. Common moves:
- Make deliverable more specific ("a 5-minute audit" -> "a 3-bullet audit of your subject line sequence")
- Use ICP's own language from Vector 3
- Eliminate friction (no form fill, reply-to-claim)
- Sharpen competence proof ("I'll send you ideas" -> "I'll rewrite your first cold email subject line")

Re-score until the offer hits 6+.

**Swap:** Choose the market alternative or contrarian offer. Write the offer-only experiment hypothesis for `/experiment-design`.

Keep the CTA at **direction-level** here — a plain-English ask direction, not exact send copy. Exact CTA wording is deferred to `/campaign-copywriting`, which writes it later under the verified-list gate (`verified-list-gate.md`) and runs it through `spam-word-checker.md` + `cold-email-copy-best-practices.md`. Do not write exact CTA send phrasing to the validation brief or `client-profile.yaml` — this skill runs before any list exists.

---

**Step 5B: Contrarian offer analysis**

Trigger: saturation override fired, OR both existing and market alternative score below 5, OR user asks "what's the unexpected offer?"

The contrarian offer is the archetype nobody (or almost nobody) in this market is currently using. Its advantage is not evidence it converts - it is the absence of evidence it has been ignored. The ICP has not been trained to delete it yet.

**How to find it:**
1. List all 11 archetypes (A-K)
2. Mark which are SATURATED or CROWDED from the saturation table
3. Remaining archetypes are contrarian candidates (K is gated separately: it needs a committed, owned build and may not front an offer's baseline validation wave, so it is a contrarian candidate only where both hold)
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
**Decision:** Go | Iterate | Swap | Swap (Contrarian)

---

### Signal Summary

| Source | Signal | Confidence |
|---|---|---|
| Competitor offers | | |
| LinkedIn ads | | |
| ICP community | | |
| Job postings | | |
| Send data | | |

**Saturation status:** [SATURATED / CROWDED / OPEN] - [archetype, competitor count]

---

### ICP Pain (in their words)
[3-5 bullets in their exact language]

---

### Scorecard

| Criterion | Existing | Market alternative | Contrarian (if applicable) |
|---|---|---|---|
| Addresses #1 ICP pain | | | |
| Scalable delivery | | | |
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
  saturation_status: saturated | crowded | open
  offer_validation_run: YYYY-MM-DD
  offer_validation_path: profiles/<business-slug>/offer-validations/YYYY-MM-DD-offer-validation.md
```

Only add `offer_validation_run` and `offer_validation_path` when validation mode runs. Keep the existing offer fields compatible for downstream skills.

---

## Common mistakes

- **Using competitor offers as confirmation without checking saturation.** Three competitors offering free audits is not validation. It is a warning. Count the field before following it.
- **Running the contrarian offer just because it's different.** Pattern interruption has value, but an offer disconnected from ICP pain is still a bad offer. The contrarian offer still needs to score well on pain relevance and competence proof - it just gets a pass on differentiation.
- **Swapping offer and copy at the same time.** Combined experiment. You will learn nothing about which change drove the result. Swap the offer, freeze everything else, run `/experiment-design`.
- **Calling the offer broken before 300 sends.** Variance is too high. Deliverability and list issues look identical to offer problems at low volumes.
- **Treating reply rate alone as an offer problem.** Offer is only a candidate bottleneck after deliverability, bounce rate, list quality, and copy have been checked. If open rate is below 20%, run `/email-deliverability-audit` first.
- **Iterating the offer without changing the language.** Iteration means rewriting toward the ICP's own words from Vector 3. Keeping your language gets the same result.
- **Skipping discovery mode because "the client already has a strong offer."** Strong relative to what? Run discovery first so the brainstorm is informed, not assumed.
- **Skipping source-signal discovery on new-offer paths.** You will invent a generic lead magnet before knowing what source context makes the outreach timely. Run `/lead-source-strategy` Source-Signal Discovery Mode first.

---

## Integration

| Skill | Relationship |
|---|---|
| `/icp-onboarding` | Runs before source-signal discovery. Produces the ICP and value prop this skill researches around. |
| `/lead-source-strategy` | Runs in Source-Signal Discovery Mode before this skill on new-offer paths. Produces `source-signal-intelligence.md`. |
| `/lead-magnet-brainstorm` | Runs after discovery mode. Reads the offer-intelligence.md brief to anchor archetype selection and use source-backed pain plus ICP language from Vector 3. |
| `/campaign-strategy` | Reads the locked offer from `client-profile.yaml` and the source-signal brief. The front-end offer suggestions section should defer to this output. |
| `/experiment-design` | If validation mode decision = Swap or Swap (Contrarian), this skill writes the offer-only experiment hypothesis that `/experiment-design` formalizes. |
| `/roast` | Optional fast pre-lock stress test of a candidate offer (hands-off council → green-light / reshape / kill + the single cheapest 48-hour validation test). Useful for a new or contrarian offer before committing build and spend; complements this skill's evidence-based Go/Iterate/Swap rather than replacing it. |
| `/cold-email-kickoff` | Invokes source-signal discovery after `/icp-onboarding`, then this discovery mode before `/lead-magnet-brainstorm`. |
| `/cold-email-weekly-rhythm` | If reply rate drops below 1% on a running campaign, trigger validation mode before changing copy or list. |
| `/email-deliverability-audit` | If open rate is below 20%, run that skill first. Do not diagnose the offer when deliverability may be the actual problem. |

## What to do next

- **Discovery mode complete:** Hand off to `/lead-magnet-brainstorm`. It reads `profiles/<business-slug>/source-signal-intelligence.md` and the brief at `profiles/<business-slug>/offer-intelligence.md`.
- **Validation - Go:** Proceed to `/campaign-strategy`. Offer is locked in `client-profile.yaml`.
- **Validation - Iterate:** Stay here, rewrite using ICP language from Vector 3, re-score. Repeat until score hits 6+.
- **Validation - Swap or Swap (Contrarian):** Take the experiment hypothesis to `/experiment-design`. Run as offer-only experiment. Keep everything else frozen.

