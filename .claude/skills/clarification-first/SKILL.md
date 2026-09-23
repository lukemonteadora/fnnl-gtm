---
name: clarification-first
description: Use before complex, ambiguous, expensive, or high-risk GTM/cold-email/document tasks where missing context would materially change the output. Helps decide what to ask, when to proceed with assumptions, and how to avoid unnecessary questions.
---

# Clarification First

Use this skill when missing context would change the answer, spend money, touch live systems, alter provider routing, or create client-facing deliverables.

Do not use it for short answers or obvious single-step requests.

## Interaction Policy

This skill defers to `/autonomous-execution-policy`. Under `run_state.execution_mode = auto_execute` (opt-in per client; the default is `review_gates`), proceed without pausing: pick the strongest option per the rubric, record it to `run_state`/profile, and continue. Never re-ask a decision already in `run_state`, `client-profile.yaml`, `campaign-plan.md`, memory, or the latest operator message. Spend runs against the standing budget in `run_state.spend_ceiling_usd` ($100 per client run, never asked, in either execution mode): auto-approve within it. Stop only for the hard-stops in the policy. On a long async wait, background-poll and move to other productive work. Never idle.

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short: record status, not raw output. Full protocol: `client-activity-log.md`.

## Decision Rule

Ask before proceeding when the missing answer affects:

- Provider stack
- Spend beyond the run's standing budget (a paid data step inside the standing $100 in `run_state.spend_ceiling_usd` is already approved and never asked), or an infrastructure purchase outside an approved setup total
- Client identity
- Target market
- Offer source of truth
- Sending platform
- Live system mutation
- Legal or compliance risk
- Client-facing document content

Proceed with stated assumptions when the risk is low and the user can easily correct the result.

Under autonomous execution (`execution_mode = auto_execute`), the hard-stop list in `/autonomous-execution-policy` governs what still requires the operator. Bundle any genuinely-needed asks into ONE upfront batch rather than one question per step.

## Material Decision And Recommendation Style

For any material decision, name the realistic options, recommend the strongest path, explain why the main alternatives are weaker, then either ask or proceed.

Ask before choices that affect provider routing, spend beyond the run's standing budget, source of truth, target market, ICP, offer, list source, list quality, copy direction, client-facing output, live systems, scraping or account risk, or legal/compliance risk.

For low-risk reversible choices, state the recommendation and proceed. Do not ask just to look careful.

Under autonomous execution (`execution_mode = auto_execute`), the `/autonomous-execution-policy` hard-stop list governs which decisions still require the operator; everything else is auto-picked per the rubric and recorded. Bundle any genuinely-needed asks into ONE upfront batch rather than one question per step.

## Questions

Ask no more than three questions at once.

Use Claude Desktop native Interactive Inputs / Choice Prompts for every user-facing question unless the user explicitly asks for a freeform interview.

Hard truth: do not merely print an A/B/C text menu when the Claude Desktop runtime can render an interactive prompt. Use the native interface first. The text card format below is only the fallback when the runtime cannot render the interactive element.

Interactive prompt rules:

- Use single-select choice options for one decision.
- Use multi-select checkboxes only when multiple independent answers can be true.
- Use a ranking interface only when the user needs to prioritize options.
- Use sliders or visual widgets only when Claude Desktop supports them and the answer is naturally numeric or visual.
- Ask with 2 to 4 options for normal single-select decisions.
- Put the strongest recommendation first and label it `[Recommended]`.
- Put `Custom answer` or `Other / custom answer` last when the user might need to provide their own answer.
- Keep each option short enough to click or copy.
- Accept either the option letter, the option text, or a natural-language correction.
- When a prior file, website, research result, or `run_state` gives a likely answer, pre-fill it as the recommended option instead of asking the user to type from scratch.
- When the answer is factual status and no evidence exists, do not pretend to know. Make `Not sure - check first` the recommended option.
- For spend beyond the run's standing budget, an infrastructure purchase, live-system mutation, scraping risk, legal/compliance, or client-facing approval (Luke's review of a client-facing document; the client's own approval of an offer is optional and never a pause, per `/offer-test-slate`), the safe recommendation is review or pause unless the user explicitly chooses approval. A paid data step inside the standing $100 budget is not on this list: it runs without a question.

Fallback text format, only if native Interactive Inputs are unavailable:

```text
I need one decision before moving:

A. [Recommended] <option>
B. <option>
C. <option>
D. Custom answer
```

For open text prompts, propose the best answer first:

```text
Confirm or correct this:

A. [Recommended] Use this: <pre-filled answer from research or saved context>
B. Use a shorter version: <shorter version>
C. Ask me one follow-up first
D. Custom answer
```

## Required Stack Questions For Cold Email

Before GTM/cold email execution, confirm only the provider stack:

1. Infrastructure path:
   - Dynadot domains + Zapmail mailboxes
   - Spaceship domains + Zapmail mailboxes
   - Dynadot domains + Primeforge mailboxes
   - Spaceship domains + Primeforge mailboxes
   - Primeforge native domains + Primeforge mailboxes
2. Sending platform: EmailBison, Smartlead, Instantly, or Other

Save the chosen path in `run_state.infrastructure_stack`, then derive `run_state.registrar` and `run_state.mailbox_provider` from it.

Hard rule: `registrar = Primeforge` is valid only with `mailbox_provider = Primeforge`. Do not create or accept `Primeforge domains + Zapmail mailboxes`. If the user wants Zapmail mailboxes, route domain buying through Dynadot or Spaceship.

Do not ask startup questions about whether domains are already purchased, whether inboxes have reached a warmup age, or whether provider API keys are connected. Those checks happen later inside the selected setup, lead-source, verification, or platform manager skill.

## Do Not Ask

Do not ask questions just to look careful.

Do not ask for information already present in:

- `client-profile.yaml`
- `campaign-plan.md`
- `run_state`
- The user's latest message
- Current local files

If local context conflicts with the user's latest answer, stop and ask which source is current.
