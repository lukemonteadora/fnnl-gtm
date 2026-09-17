---
name: icp-onboarding
description: Conversational intake for cold email campaigns. Checks for icp.source=intake_form first - if found, skips the entire interview and returns to caller. Otherwise runs a pre-fill discovery pass (website scrape, stack contract, .env, existing profile) before any question, then presents each question as a confirm-or-correct card with the suggested value pre-filled. Outputs the canonical profile-root client-profile.yaml for the rest of the cold outbound skill system.
---

# ICP Onboarding
## Canonical Profile Root

All profiles/<business-slug> paths in this skill resolve under:

```text
<outbound>/profiles
```

Here `<outbound>` is the root of this skill library - resolve it to wherever the library is currently checked out (local Documents, OneDrive, or a git worktree); never hardcode an absolute path. Do not create client profiles under a `profiles/` folder at your current working directory.

This skill creates `client-profile.yaml`. Every downstream skill reads it. If this file is vague, the whole campaign gets vague.

## Material Decision Rule

When this skill reaches a material fork, name the realistic options, recommend the strongest path, and explain why the main alternatives are weaker before committing.

Ask before choices that affect spend, provider routing, source of truth, list quality, campaign direction, client-facing output, live systems, scraping or account risk, or legal/compliance risk. For low-risk reversible choices, state the recommendation and proceed.

Do not turn failed or unsafe paths into user-facing options. If this skill's QA rules or stop gates reject a path, filter it out and explain the blocker only when useful.

When asking the user, use the Claude Desktop native Interactive Inputs / Choice Prompts pattern from /clarification-first: recommended option first, short choices, and Custom answer last when a custom answer is plausible.

## Interaction Policy

Defers to `/autonomous-execution-policy`. Under `run_state.execution_mode = auto_execute` (the operator's default), proceed without pausing: pick the strongest option per this skill's rubric, record it to `run_state`/profile, and continue - never re-ask a decision already in `run_state`, the profile, memory, or the operator's latest message. Stop only for the policy's hard-stops (spend over the approved ceiling, live send, credentials, provider/source-of-truth change, safety gates). On a long async wait, background-poll and move to other productive work - never idle.

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short — record status, not raw output. Full protocol: `client-activity-log.md`.

## Form Data Is A Hypothesis

Treat onboarding form answers, call notes, and client-stated offers as starting context, not decisions.

Client-suggested CTAs and lead magnets must be stored under `offer.client_suggested_*` fields. Do not write them to `offer.lead_magnet`, `offer.lead_magnet_details`, or `offer.lead_magnet_cta_direction` during onboarding.

For a new client or new campaign, route through `/lead-source-strategy` Source-Signal Discovery Mode, then `/offer-intelligence` discovery mode, then `/lead-magnet-brainstorm` even when the form already suggests a lead magnet. The client suggestion becomes Candidate A in the brainstorm, not the locked answer.

Use `/offer-intelligence` validation mode only when the client has a real existing offer with evidence, such as a live campaign, prior campaign data, or a previously used offer they explicitly want to keep. A form answer alone is not evidence.

## Intake Form Fast Path (check before anything else)

Check `<outbound>/profiles/<business-slug>/client-profile.yaml`:

- If it exists and `icp.source = intake_form`: the profile was already written by `/client-intake-form`. Report the pre-loaded fields in one summary line and return to the caller immediately. Do not re-interview.
- If it exists without `icp.source = intake_form`: compare `run_state` to any values provided by the caller and proceed with the pre-fill pass below.
- If it does not exist: proceed with the pre-fill pass and interview.

## Pre-Fill Discovery Pass (run before Step 1, always)

Before asking any question, build a pre-fill map silently:

1. If a business website URL is available from context or the caller, scrape it and infer: offer summary, likely buyer titles, apparent headcount range from pricing, industries from homepage imagery and case studies, geography from footer/currency/case study locations, client-suggested offer from services pages, tone from copy voice.
2. Read `<outbound>/stack-contract.yaml` for the tool declared in each capability slot (registrar, mailbox provider, sending platform, email verification, lead sources), then check `.env` and `.env.local` for the matching credentials. A key is evidence that a credential exists, never a stack decision: no `run_state` provider field is filled from a key, from habit, or from another client's profile. If a slot this run needs is empty, leave the field `null` and route the operator to `/stack-setup`. That stop holds under `auto_execute`, because provider routing is a hard stop rather than a rubric choice.
3. Check any existing `client-profile.yaml` for prior values.

Use this pre-fill map to suggest answers for every interview question. Present each question as a confirm-or-correct native choice prompt with the suggested value as the recommended option. The user clicks to accept or types a correction - they do not answer from blank.

## Inputs

Use either:

- Business website URL
- Plain description of what the user sells and to whom
- Existing notes, call transcript, or onboarding answers
- A meeting or voice-memo transcript (a discovery / sales / onboarding call, or the "go for a walk and talk" context dump). Run a raw transcript through `/client-onboarding-call-summarizer` first to turn it into a structured "what we learned" brief mapped to these onboarding fields (no action-item / to-do list), then use that as confirm-or-correct pre-fill for the interview below — and work its "Still Unknown" list as the questions to ask here. It accepts pasted text or Fathom/Otter/Zoom/Teams exports.

If a website is available, inspect it with the browser or normal web research. Do not call a local scraper unless that scraper actually exists in this checkout.

## Geography Is A Source Constraint

Target location is a hard input for source planning. A campaign that works in the United States may fail in Denmark, Germany, Australia, or a smaller local market because the useful directories, registries, job boards, maps coverage, contact databases, and public signals are different.

Do not treat geography as a minor ICP note. Store the target countries, states, regions, cities, and excluded markets clearly enough that `/lead-source-strategy` can research source availability before campaign strategy recommends list sources.

## Output

Save one file:

```text
<outbound>/profiles\<business-slug>\client-profile.yaml
```

Here `<outbound>` is the root of this skill library - resolve it to wherever the library is currently checked out (local Documents, OneDrive, or a git worktree); never hardcode an absolute path. Do not create client profiles under a `profiles/` folder at your current working directory. When this or a downstream skill says `profiles/<business-slug>/...`, resolve it under `<outbound>/profiles`.

## Step 1: Anchor The Business

Ask as a Claude Desktop native Interactive Input / Choice Prompt:

```text
What should I use as the business anchor?

A. [Recommended] Use the business website URL I provide
B. No website - I will provide a two-sentence description
C. Use existing notes or transcript already provided
D. Custom answer
```

If the user gives a website, research it and summarize:

- What the company sells
- Who it appears to sell to
- Core value proposition
- Proof points or case studies
- Proposed ICP starting point

Ask the user to confirm or correct the summary before the interview using a native choice prompt:

```text
Confirm or correct this business summary:

A. [Recommended] Use this summary: <researched one-liner + ICP starting point>
B. Mostly right - I will correct one detail
C. Ask me one follow-up first
D. Custom answer
```

If the user has no website, ask for a two-sentence description with `Custom answer` as the expected selection.

## Step 2: Interview

Batch these into native multi-question confirm-or-correct prompts — group related items together rather than asking one per turn (per `/clarification-first`, which this skill defers to: bundle the genuinely-needed asks upfront so onboarding isn't 10+ sequential round-trips). Use each item below as a native choice-prompt topic, not as a raw typing prompt; where the runtime can't render a batch, fall back to sequential. When research or saved context gives a likely answer, pre-fill it as the recommended option so the user can click to accept instead of typing. Always keep `Custom answer` last.

1. Offer summary
2. Single best customer — and any other real case-study / customer wins. For each, capture the company's website/domain and which sub-industry / what-they-sell group it belongs to (plus the result, timeframe, and whether it can be named), because these companies become the lookalike **seeds** for `/tam-build`'s proven motion and `/social-proof-bank`'s Seed-and-Proof Readiness gate reads them before a proven-motion group's TAM is built. Just capture what the client volunteers here; `/social-proof-bank` structures the seed set and chases any gaps.
3. Buying job title
4. Hard minimum and maximum headcount
5. Industries, categories, or market segments in or out. Use plain business language now. Use a provider's exact taxonomy later only if `/lead-source-strategy` selects that provider.
6. Countries, states, regions, or cities in scope and out of scope. This is required because source coverage changes by market.
7. Relevant buying triggers
8. Preferred sources, blocked sources, or custom scraping limits for lead sourcing
9. Competitors, customers, partners, or domains that must be excluded
10. Current offer or ask suggested by the client or form
11. Front-end offer they can legally and operationally give, plus what would be needed to deliver it
12. Email tone
13. Banned words, compliance limits, or regulated-industry constraints

Use this pattern for open-text intake:

```text
Confirm or correct this:

A. [Recommended] Use this response: <best response from website, notes, or saved profile>
B. Use shorter version: <shorter answer>
C. Ask me one follow-up first
D. Custom answer
```

Use this pattern when no answer can be inferred:

```text
I need this before the profile is useful:

A. [Recommended] Custom answer
B. Not sure - make a reasonable assumption
C. Skip for now and mark unknown
```

Store answers to questions 10 and 11 as client suggestions and capability-boundary context only. They are not locked offer fields.

For new clients and new campaigns, route to `/lead-source-strategy` Source-Signal Discovery Mode, then `/offer-intelligence` discovery mode, then `/lead-magnet-brainstorm`, whether or not the form suggested a lead magnet.

If the user has a real existing offer with live or prior campaign evidence and wants to keep it, store the offer under `offer.validation_candidate`, store the evidence pointer under `offer.validation_candidate_evidence`, then route to `/offer-intelligence` validation mode before strategy.

## Step 3: Hard vs Soft Filters

For each ICP criterion, ask:

```text
If a lead matches everything except <criterion>, do we still reach out?

A. [Recommended based on the criterion] Treat this as a hard filter
B. Treat this as a soft preference
C. Not sure - show me the tradeoff first
D. Custom answer
```

- Yes means soft preference
- No means hard filter

Rules:

- Job title is usually hard.
- Industry is hard only when the market is truly vertical.
- Headcount edges are often soft.
- Triggers are usually soft. They are personalization signals, not always filters.

## Step 4: Write The Profile

Use this schema:

```yaml
business:
  name: <business name>
  website: <url>
  one_liner: <what they sell>
  tone: <casual|formal|peer-to-peer>

icp:
  source: icp-onboarding

run_state:
  execution_mode: review_gates   # default; auto_execute is opt-in only (set by /client-intake-form or the user)
  spend_ceiling_usd: 0           # default; 0 = always confirm before any spend. A number opts into auto-approve under that amount.
  infrastructure_stack: <from stack contract|null>   # the contract's registrar + mailbox provider, lowercase, joined with an underscore
  registrar: <from stack contract|null>              # no default; declared by /stack-setup
  mailbox_provider: <from stack contract|null>       # no default; declared by /stack-setup
  sending_platform: <from stack contract|null>       # no default; declared by /stack-setup, never inferred from an API key
  status:
    setup_stage: not_started
    warmup_stage: not_started
    list_stage: not_started
    copy_stage: not_started
    upload_stage: not_started

offer:
  client_suggested_primary_cta: <current ask from form or notes, if any>
  client_suggested_lead_magnet: <front-end offer suggested by client or form, if any>
  client_suggested_lead_magnet_details: <what the client thinks would be delivered, if known>
  validation_candidate: <existing offer to validate, only if backed by live or prior campaign evidence>
  validation_candidate_evidence: <campaign link, prior artifact path, send-data path, or notes proving it is real>
  lead_magnet: null
  lead_magnet_details: null
  lead_magnet_cta_direction: null
  value_prop: <why prospects should care>

lead_sourcing:
  target_geography_notes: <plain-language description of in-scope and out-of-scope markets>
  preferred_sources: []
  blocked_sources: []
  approved_custom_scraping: false
  approval_required_for_paid_sources: true

capability_boundary:
  deliverable_strengths: []
  proof_points: []   # case-study / customer wins; keep each company's website/domain + sub-industry / what-they-sell group (+ result, timeframe, nameable?) so it can seed /tam-build's proven-motion lookalike
  operational_limits: []
  legal_or_compliance_limits: []
  fulfillment_notes: <what would be needed to deliver a source-backed micro-offer>

icp_hard_filters:
  job_titles:
    - <exact title>
  industries_in:
    - <plain industry or market segment; provider taxonomy only after source selection>
  industries_out: []
  headcount_min: <int>
  headcount_max: <int>
  countries:
    - <country code>
  states: []
  regions_or_cities: []
  excluded_domains: []

icp_soft_preferences:
  triggers: []
  personas_to_prioritize: []

legal:
  banned_words: []
  regulated_industry: false

created_at: <YYYY-MM-DD>
```

## Step 5: Confirm

Print the YAML back to the user and ask if it looks right.

Do not overwrite an existing `client-profile.yaml` without explicit confirmation.

## Common Gotchas

- "SMBs" is not an ICP. Ask for headcount.
- "Anyone who needs this" is not an ICP. Ask for the best customer.
- Include title synonyms.
- A location like "Europe" or "Nordics" is too loose unless the client can explain which countries matter first. Source availability is country-specific.
- Do not force a data provider's industry taxonomy during onboarding. Copy any provider's taxonomy exactly only after `/lead-source-strategy` selects that source.
- Do not make every trigger a hard filter. That shrinks the list too far.

## What To Do Next

After `client-profile.yaml` exists (and after `/stack-setup` has declared any capability slot this client's run still needs):

- New guided start or full locked-platform launch: `/cold-email-kickoff` (the single entry-point orchestrator)
- Guarded draft automation: `/auto-research-public`, only after setup is complete and sender readiness is verified through the locked platform manager

