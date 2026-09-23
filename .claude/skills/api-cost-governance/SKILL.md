---
name: api-cost-governance
description: Cost + balance gate for any skill that calls a paid data, enrichment or infrastructure API (whichever providers the workspace stack contract has actually configured), plus the one approved AI call left, the sender headshot image. Research, crunching and copy run in Claude Code itself and are not gated here (no-AI-API rule, 2026-09-22). Use BEFORE running any API-calling skill to preview the USD cost, check the relevant key's balance, block if insufficient, and warn when a key is under the threshold. Use AFTER running to report actual credits/images/USD and decrement the ledger. Pairs with ai-model-routing.md (how Claude Code routes its own work) and lead-list-tech-stack-research.md (which data tool).
---

# API Cost Governance

This skill answers three questions for any other skill: **does it call a paid API, what will it cost in USD, and is there enough balance to run it?** It runs as a gate around API-calling skills, not as a flow node.

**No-AI-API rule (operator directive 2026-09-22).** The only AI in this flow is Claude Code itself: the session, its sub-agents, the `/deep-research` harness, and its built-in WebSearch and WebFetch. Research, bulk classification, QA, copy and web search/crawl all run there, and Claude Code usage is not a per-call metered API spend in these skills, so none of it gets a token preview or a ledger decrement here. No AI-provider token rows remain. **The one exception is the sender headshot image** (`image_generation`: OpenAI, headshots only, asked for at infrastructure setup), which is still previewed, confirmed and decremented like any paid call. Everything else this gate prices is data-vendor, verification, workbench or infrastructure spend, and those rules are unchanged.

**There is no research budget (removed 2026-09-22).** The old per-client, per-provider research cap (`run_state.research_budget_usd_per_provider`, $10 per provider) existed to cap third-party AI research spend, and none is left, so it is gone: no skill writes it, reads it, or blocks on it, and a value in an older profile is ignored. The one research trace this skill keeps is the `/deep-research` provenance line. Each research skill appends one line to `scripts/api-balance-ledger.md` recording `claude-deep-research` (or `claude-subagent-fanout` when the harness failed and the declared fan-out ran) as the primary that ran, with no dollar decrement, because `scripts/research/research_routing_check.mjs` reads it to prove a real primary pass happened. If a research pass ever triggers a paid data-vendor call (a sample pull, for example), that call is priced and gated like any other paid data step, under the run's budget.

Honest scope (read first):
- **Pre-run USD estimates are ranges**, computed from expected credit/record/image volume × published price. Treat as ±50%, not invoices.
- **Post-run actuals are exact only when the call captured a `usage` or credit field** (scripted/MCP calls). Otherwise the estimate is logged as the actual. Steps that are just Claude Code reasoning have no external call and no meter, and are not logged as spend at all.
- **Live balance checks exist only for some providers, so classify each configured provider into one of two classes before you print any verdict.** A **live-balance provider** exposes a remaining-balance or credit-count endpoint you can actually call. A **ledger-only provider** publishes no remaining-balance API at all, so its balance lives in the manual ledger (`scripts/api-balance-ledger.md`), which you update on top-up and this skill decrements per run. Examples of tools in each class (illustrative only, not a statement of FNNL's stack): live-balance, BetterContact (`credits_left`, see Balance Check below); ledger-only, the headshot image provider (OpenAI) and Deliverable.co (no balance endpoint). **For every ledger-only provider the per-run ⛔/⚠ balance verdict is ESTIMATE-ONLY**, because it can only read the manually-recorded ledger figure (often `UNKNOWN`). Never print a confident block/warn you cannot actually evaluate; for ledger-only providers the real backstop is the provider-side hard limit (see **Preventing Negative Balances**, a REQUIRED one-time setup, not optional). Which class a provider falls into is a property of that vendor, checked when the slot is filled. It is never a statement that FNNL uses it.
- **The ledger is created on first use, never assumed present.** `scripts/api-balance-ledger.md` does not ship with this repo. If it is missing at the first paid run, create it (a header carrying the warning threshold, then one row per configured provider) before writing any balance or decrement. Never report a balance you read from a file that does not exist.
- **A filled slot is not a proven slot.** A tool recorded in the stack contract with status `chosen` has only been named; only status `live` means a real call against FNNL's own account has succeeded. Treat `chosen` as not-yet-usable when deciding whether a balance check or a paid call can actually run, the same way you treat an unverifiable balance.
- **Low-balance warning threshold: $10** per key (configurable in the ledger header).

## The Gate Protocol (run every time an API-calling skill is about to run)

1. **Detect.** Look up the target skill in the [Skill → API Registry](#skill--api-registry). If it calls no paid API → say so, proceed, no gate needed.
2. **Estimate.** Compute the USD range per provider it will call (see [Estimation](#estimation)).
3. **Check balance.** Live-balance providers → call the endpoint and use the returned figure. Ledger-only providers → read `scripts/api-balance-ledger.md`. For a ledger-only provider, show `balance: <ledger figure or "n/a, estimate-only">` and rely on its provider-side hard limit. Do not fabricate an OK/⛔ you can't verify, and do not assume a provider is live-balance just because its slot is filled.
4. **Decide + preview.** Show the operator the preview block below and one of:
   - ✅ sufficient balance and the run's total stays inside its budget (`run_state.spend_ceiling_usd`, a standing $100 per client run, never asked) → run it and report the charge. The standing budget is the confirmation (`/autonomous-execution-policy` section 2).
   - ⚠️ a key is under $10 → warn, recommend top-up, ask whether to proceed anyway.
   - ⛔ the run's total would go over its budget → **stop** and ask the operator to raise the budget for this client.
   - ⛔ a key is below the estimated cost → **block**; require top-up before running.
   - Mailbox infrastructure (domains, mailbox capacity) is outside the $100 data budget. It runs only against the setup total the operator approved for that setup.
5. **Run** when the verdict allows it: a ✅ inside the budget runs straight away, and anything else waits for the operator.
6. **Report + decrement.** After the run, show actuals (or estimate-as-actual), then subtract from the ledger and note the new balance.

### Pre-run preview block (always show this before running)

```
RUN PREVIEW: <skill name>
APIs it will call : <providers>
Est. cost         : $<low>–$<high>   (basis: <credits/records/emails/images>)
  - <Provider A>  : $<low>–$<high>   | balance $<x>  <OK / ⚠ low / ⛔ insufficient>
  - <Provider B>  : $<low>–$<high>   | balance $<x>  <OK / ⚠ low / ⛔ insufficient>
Threshold         : $10/key (balance warning)
Run budget        : $<spent so far> + $<this run, high> of $<spend_ceiling_usd>  <within / OVER>
Verdict           : <PROCEED / WARN-low-balance / STOP-over-budget / BLOCK-topup-required>
Proceed? (asked only on WARN or STOP; a PROCEED inside the budget just runs)
```

### Post-run report block (always show this after running)

```
RUN ACTUALS: <skill name>
  - <Provider A>  : <credits / images used>     → $<actual>   (exact / estimated)
  - <Provider B>  : <…>                          → $<actual>
Total this run    : $<sum>
Ledger updated    : <Provider A> $<old> → $<new> ; <Provider B> $<old> → $<new>
Budget used       : $<running total> of $<spend_ceiling_usd>
Low-balance flags : <none / Provider X now $<x>, top up>
```

## Preventing Negative Balances (provider-side, the real safeguard)

The Gate Protocol above is a STOP INSTRUCTION inside the workflow. It cannot physically prevent a provider from billing you; only the provider account config can. The skill stops *its own* calls; it does not control the vendor's meter. **This is a REQUIRED one-time setup per provider, not optional advice. Verify it once and record it (a "limits set" note in the ledger header). For every ledger-only provider (no balance API) it is the ONLY real backstop** behind the estimate-only per-run gate. Whichever providers the stack contract ends up selecting, set these once per provider so a surprise `-$50` is impossible. Match the guidance to the provider's billing model:

- **Postpaid, with auto-recharge available (the only billing model that can go negative):** set a **hard monthly usage limit** at or below your tolerance, and turn **auto-recharge OFF**. Postpaid + auto-recharge is the ONLY way a balance goes negative. The headshot image provider bills this way (OpenAI, Billing → Limits), and it is used for headshots only, so a low hard monthly limit is enough. The hard monthly limit is the backstop.
- **Prepaid credit or a usage limit:** use the prepaid credit or set the usage limit, and no auto-recharge.
- **Prepaid credit balances that cannot go negative:** keep these on **prepaid credit balances**. They cannot go negative, they just stop. A balance that "stops" is the safe failure mode; a postpaid bill that "continues" is the dangerous one. Most per-record data vendors bill this way.
- Re-check these after any provider plan change.

## Skill → API Registry

Which skills spend money, on what, and on which key. "Credits" = per-record/per-contact/per-email billing; "per image" = the headshot call.

| Skill | Capability slot(s) it spends on | Cost basis | Typical run cost (rough) |
|---|---|---|---|
| `lead-source-strategy` (Discovery), `offer-intelligence`, `market-evidence`, `auto-research-public`, `campaign-strategy`, `data-point-discovery`, `lead-magnet-brainstorm`, `list-quality-scorecard`, `icp-prompt-builder`, `campaign-copywriting`, `personalization-subagent-pattern` | **no AI API** (no-AI-API rule, 2026-09-22): research is `/deep-research` plus WebSearch/WebFetch, crunching and QA are Claude Code sub-agents, copy is written in the native session, at any volume | not a metered per-call spend here; only a data-vendor call such a skill makes is priced, per the `company_discovery` / `contact_*` rows | $0 API spend by default; a data-vendor sample pull is priced at that vendor's plan rate |
| `tam-build` | `company_discovery` (company records, MCP) + `contact_discovery` (separate connector; if a pack providing one is active, e.g. `/aleads-api`†). Homepage crawls and fit classification run on Claude Code (WebFetch + sub-agents) and cost nothing here | per-record credits; the contact-discovery connector's own cost model not yet confirmed | scales with TAM size ($1–$50+) |
| `prospeo-full-export`† / `prospeo-search-api`† | `contact_enrichment` (this skill's own vendor integration) | contact credits | per Prospeo plan |
| `aleads-api`† (company_search, MCP) | `company_discovery` (this skill's own vendor integration) | company record credits (metered) | per A-Leads plan |
| `aleads-api`† (find_email / find_phone, MCP; its own verify path is retired in favor of whatever fills `email_verification`) | `contact_enrichment` (this skill's own vendor integration) | contact credits (1 per found) | per A-Leads plan |
| `email-waterfall` | Finder: the `contact_enrichment` waterfall, in the order recorded in the contract's `contact_enrichment.notes`. Verify (existing + found emails): `email_verification` | finder = 1 credit/found; verifier = per email; residue waterfall = pay-per-valid | per provider plan |
| `google-maps-list-builder`† | `company_discovery` (local-business source) | place credits | per provider plan |
| `blitz-list-builder`† | `contact_enrichment` (this skill's own vendor integration) | enrichment credits | per Blitz plan |
| `mailbox-profile-generator` | `image_generation`: the ONE AI API call left (OpenAI `gpt-image-1`, headshots only, operator-approved exception 2026-09-22; key asked for at infrastructure setup) | per image (low, ~$0.04 per image) | ~$0.04 × headshots (one shared headshot per client by default = one image) |

† **Listed for the spend class, not loadable today.** These rows ship inert under `_vendor-library/skills/<pack>/` and only become runnable skills when `/stack-setup` activates the matching pack. They stay in the registry so the gate can price that spend class the moment a pack goes live; their presence is not a claim that FNNL has the tool, the pack, or a key. The same applies to any vendor helper script named in this file: verification, enrichment and balance-check helpers live under `_vendor-library/scripts/<vendor>/` and do not reach the live `scripts/` directory until the pack is activated, so treat those commands as what-to-run-once-activated, never as a command available now.

**`intent_signals` has no registry row of its own.** The skill that used to drive engagement-signal tools (`competitor-engagers`) is not present in this fork, so there is no named row to price. That is not a claim that nothing else can spend on this slot: other skills discuss intent and engagement signals, and `intent_signals` is a real contract slot. If any skill or activated pack calls a tool filling `intent_signals`, gate it here on signal/actor credits at the provider's published plan price before it runs.

Skills NOT in this table (kickoff, icp-onboarding, spintax, uploads, deliverability, DOCX exports, trackers) call **no AI API** and no metered data API. They run on Claude Code locally and need no cost gate. Domain/registrar/mailbox setup skills are the exception: they spend money on *services*, so price them by their own published service price and gate them against the setup total the operator approved (the standing $100 data budget never covers infrastructure).

**This table names capability slots, never vendors, because there is no default stack to name.** The tool that actually fills each slot is whatever the workspace stack contract at `outbound/stack-contract.yaml` is locked to for this client. That contract ships empty. Nothing in this file asserts that any provider is FNNL's default, standard, primary, configured, or keyed. If a slot a skill needs is unset, stop and route the operator to `/stack-setup` rather than substituting a vendor: an unset slot is a blocked run, not license to guess a plausible tool from a worked example or from `_vendor-library/`.

`/preflight-credentials` lists most data slots warn-level (won't hard-block) **only because those slots degrade gracefully to a documented fallback**, never because a slot is skippable. It lists no AI key at all: research, crunching and copy need none, and the headshot image key is not needed until infrastructure setup starts. Read a warn-level credential as "this slot has a fallback", not as "this slot is optional". Whether any given slot is genuinely optional for FNNL is a stack-contract decision, recorded there, not asserted here.

**MCP infra ops are a spend surface too.** MCP tool calls (a `registrar` MCP registering or renewing a domain, a `mailbox_provider` or `sending_platform` MCP creating domains and mailboxes) bypass this script registry entirely: a single call can register many domains or create dozens of mailboxes, real money with no script involved. Examples of tools that could fill those slots (illustrative only, none chosen for FNNL): Spaceship, Zapmail, Salesforge. Gate every spending MCP op here exactly like a script: preview USD by the provider's published service price, check funds/balance, check it against the approved budget, then act. Infrastructure ops run against the setup total the operator approved once for that setup (then no per-purchase confirmation inside it), and a paid data pull runs inside the run's standing $100 budget with no confirmation. Free reads (list/check/DNS-edit, analytics) need no gate. See `/mcp-tools-routing` for the per-server spend map.

### Machine mirror & ownership split

The provider → credential map (exact env var names, well-formedness shapes, and the `run_state` value that triggers each) is mirrored machine-readably in `scripts/credential-registry.json`. That JSON is the single source of truth read by `/preflight-credentials`, the run_state-scoped Credential Preflight Gate wired into `/cold-email-kickoff` (Step 2.6).

**Ownership split (no duplicated logic):**
- **`/preflight-credentials` owns *presence + shape***: is the key there and well-formed, scoped to the locked `run_state` path. It runs at kickoff, before any spend, and never checks balance.
- **This skill owns *balance + spend***: the USD estimate, the live/ledger balance check, and the decrement. It never re-implements presence/shape.

They share `credential-registry.json`; they do not duplicate each other. When you add a provider or key to the Skill → API Registry above, add it to `credential-registry.json` too, because the preflight FAILS LOUD if the locked path needs a provider that has no registry entry (so drift surfaces immediately instead of passing silently).

## Pricing (reference rates for commonly used providers: VERIFY and update; prices drift)

Per the unit noted in each row. No per-token LLM rows remain: research, crunching and copy run in Claude Code, which these skills do not meter per call (no-AI-API rule, 2026-09-22). **These are published market rates for providers commonly used in this kind of workflow, listed so a USD estimate can be computed at all. Listing a provider here does not mean FNNL uses it, has a key for it, or has chosen it for any slot.** Replace and extend this table for whichever tools `stack-contract.yaml` actually selects. **These are reference figures to keep the estimate honest, not live-fetched prices. Update them here when a provider changes pricing.** Last set: 2026-06.

| Provider | Input | Output | Notes |
|---|---|---|---|
| OpenAI image (`gpt-image-1`), headshots only | n/a | n/a | per image, low cost (~$0.04 or less at the lower quality tiers; verify the current price). The one AI API call left, an operator-approved exception (2026-09-22); ledger-only, postpaid, so set a hard monthly limit |
| Prospeo / A-Leads / WizLeads / Blitz / Apify / Scrap.io / Trigify | n/a | n/a | per-contact / per-record / per-actor; use the provider's plan price |
| BetterContact | n/a | n/a | per **valid** contact (pay-per-valid waterfall, invalid results cost nothing); est. ~$0.02–0.06/valid by plan, verify in-dashboard. 50 free starter credits; monthly allowance, rollover capped at plan amount, **no auto-recharge**. `GET /api/v2/account` returns `credits_left`. ⚠️ Out-of-credit runs go **"on hold"** (manual Process, no auto-retrigger): confirm `credits_left` ≥ run size before submitting; the script aborts at 0 |
| Email **verification + catch-all** (the `email_verification` slot) | n/a | n/a | per email checked. The capability worth paying for is **two-in-one**: deliverability status plus a separate catch-all flag returned by a single call, rather than two billed passes. Examples of tools that could fill this slot (illustrative only, none chosen for FNNL): Deliverable.co, whose parked vendor pack ships `deliverable_verify.mjs` returning `email_status` + `is_catch_all` in one async call, has **no balance endpoint** (a `402` means out of credits or expired, and `--check` is connectivity only), and reads key `DELIVERABLE_API_KEY`. |
| *Verify-capable finders and standalone verifiers (candidates, not a default):* a contact tool's own verify endpoint (e.g. A-Leads `verify_email`), BounceBan (catch-all), Enrichly, MillionVerifier/Reoon/LeadMagic | n/a | n/a | whether verification runs on a dedicated `email_verification` tool or on a finder's own verify endpoint is a stack-contract decision, not a default. A tool filling `contact_enrichment` is not automatically the verifier. Prefer whichever option returns deliverability + catch-all in one call, since two separate calls bill twice per row. |

> **Verify-first cost note:** when a contact row already has an email, the cheap move is verify-first (email + catch-all), a few tenths of a cent per email, NOT a `contact_enrichment` finder run (~$0.02–0.06/valid) that re-discovers an email you already hold. Routing per `/email-waterfall`'s Verification Doctrine: send those rows to the `email_verification` slot (verify + catch-all in one call where the chosen tool supports it), not back through the finder waterfall. Preview the row count × the per-email rate and gate it like any other paid step.

## Estimation

There are no token estimates any more (no-AI-API rule, 2026-09-22): research, crunching, QA and copy run in Claude Code and are not priced here. What gets estimated:

- **Data-vendor records** (`company_discovery`, `contact_discovery`, `contact_enrichment`): records × per-record credit, at the provider's plan price.
- **Email verification** (`email_verification`): emails × per-email rate.
- **Headshot image** (`image_generation`): images × per-image rate (normally one shared headshot per client).

USD = Σ (units × unit rate) per provider. Report a low–high band, not a point estimate. When a skill loops per row (a per-contact reveal or verify), multiply by row count and **say so loudly**: per-row paid calls on rows that should have been filtered out first are the most common cost blowout, so qualify cheaply before enriching.

## Balance Check

Route by the provider class you established above, not by vendor name. Check the class once per configured provider and record it in the ledger header.

- **Live-balance providers:** call the documented balance endpoint, use the returned figure, and still mirror it into the ledger. An example of an endpoint that works this way (illustrative only, none chosen for FNNL): BetterContact, `GET https://app.bettercontact.rocks/api/v2/account` with header `X-API-Key: $BETTERCONTACT_API_KEY` → `credits_left`, which its integration pack exposes as a `--credits` balance + auth check.
- **Partial-credit providers:** a credit count may appear in an account endpoint or in response headers; use it if present, else fall back to the ledger. Some data vendors behave this way.
- **Ledger-only providers:** read `scripts/api-balance-ledger.md`. There is no public remaining-balance API, so the dashboard number you record on top-up is the source of truth (illustrative only: the headshot image provider, OpenAI; Deliverable.co).

A vendor integration pack referenced above only exists once `/stack-setup` has activated it. If the script or endpoint is not there, say the balance is unverifiable and fall back to the ledger. Do not invent a reading.

Run a balance read **before** the run (for the gate verdict) and decrement **after** (with actuals). Never run a skill whose required key shows below the estimated cost. Require top-up first. This is deliberate: it stops a run from silently skipping a low-balance key and producing half-enriched or half-researched output.

## Hard Rules

- Never run an API-calling skill without showing the pre-run preview. Inside the run's standing budget the budget is the confirmation. A run that would go over it, a low or insufficient balance, and any infrastructure purchase outside an approved setup total all wait for the operator.
- **Zero-workbench-credit rule: the list workbench's own credits are PROHIBITED, not gated** (operator directive 2026-09-22; full text in `stack-contract.yaml` at `lead_data.list_workbench.credit_policy_rule`, summary in CLAUDE.md section 7). This gate never approves a call that draws the workbench's own data credits: its native enrichments or data providers on its own account, its waterfalls or AI columns on its credits, or its connector's search, enrich and subroutine tools. **The workbench's AI columns are banned on every key, FNNL's own included** (no-AI-API rule, 2026-09-22): any AI reasoning happens in Claude Code and the result is pushed into the table by webhook. No `spend_ceiling_usd`, `auto_execute`, or approved exception changes that; only a new explicit operator directive does. Every tool run inside the workbench must use FNNL's own API key. If a tool cannot be keyed there, run it outside the workbench with FNNL's key and push the rows in by the table's inbound webhook, and never fall back to the workbench's credits when a key is missing or failing. Treat any workbench action whose billing is unverified as credit-consuming. A keyed column still consumes the workbench's platform-usage meter (Actions): that is allowed spend, so preview it here like any paid call (inside the run's standing $100 budget it runs without a confirmation), and prefer the zero-cost webhook path when it gives the same result.
- **TAM signal collection is conditional; the run ceiling governs it, and signals are trimmed before companies or contacts** (Aaron process alignment, operator directive 2026-09-22; supersedes the 2026-06-29 "signal collection is a MUST" rule and its "raise the ceiling to cover full collection" default). `/tam-build` always collects firmographics, fit, offer-relevance fields, contacts and the free Layer-1 fields that come with the rows; a paid why-now or intent signal is collected only when the offer cannot find its buyers from firmographics or a live test needs it (the Collection Scope rule in `/data-point-discovery`). **Which governor owns it:** enrichment-time spend in `/tam-build` (discovery-source and per-record credits; the classify/parse and page-pull work runs on Claude Code sub-agents with WebFetch and costs nothing here) is **enrichment under `run_state.spend_ceiling_usd`**. When the previewed collection cost meets or exceeds `spend_ceiling_usd`, STOP and surface it, recommending the operator **trim the conditional signals first and keep companies, fit and contacts**; raising the ceiling stays the operator's call. Never silently drop companies or contacts to fit a ceiling, and never auto-raise the ceiling: the operator decides between trim and raise.
- Never claim an exact USD figure you did not measure. Label estimates as estimates.
- Never assert a provider's live balance you could not actually fetch. Say "ledger figure" when it's the ledger.
- Always warn when any required key is under $10, even if the run would still fit.
- **This gate is a workflow stop, not a billing guarantee.** Provider-side hard usage limits on postpaid providers, prepaid balances on prepaid ones, and auto-recharge OFF are the real backstop against a negative balance. They must be set on the account; this skill cannot enforce them.
- Always decrement the ledger after a paid run, including estimate-as-actual runs.
- Keep `scripts/api-balance-ledger.md` out of any public commit (it shows spend, not secrets, but it's operational data).
- If pricing looks stale, flag it and update the Pricing table before trusting the estimate.

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short, and record status, not raw output. Full protocol: `client-activity-log.md`.
