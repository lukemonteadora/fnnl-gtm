---
name: api-cost-governance
description: Cost + balance gate for any skill that calls a paid AI, data, or enrichment API (whichever providers the workspace stack contract has actually configured). Use BEFORE running any API-calling skill to preview the USD cost, check the relevant key's balance, block if insufficient, and warn when a key is under the threshold. Use AFTER running to report actual tokens/credits/USD and decrement the ledger. Pairs with ai-model-routing.md (which provider) and lead-list-tech-stack-research.md (which data tool).
---

# API Cost Governance

This skill answers three questions for any other skill: **does it call a paid API, what will it cost in USD, and is there enough balance to run it?** It runs as a gate around API-calling skills, not as a flow node.

Honest scope (read first):
- **Pre-run USD estimates are ranges**, computed from expected token/credit volume × published price. Treat as ±50%, not invoices.
- **Post-run actuals are exact only when the call captured a `usage` field** (scripted/MCP calls). For steps that are just Claude Code reasoning with no external call, there is no token meter, so the estimate is logged as the actual.
- **Live balance checks exist only for some providers, so classify each configured provider into one of two classes before you print any verdict.** A **live-balance provider** exposes a remaining-balance or credit-count endpoint you can actually call. A **ledger-only provider** publishes no remaining-balance API at all, so its balance lives in the manual ledger (`scripts/api-balance-ledger.md`), which you update on top-up and this skill decrements per run. Examples of tools in each class (illustrative only, none chosen for FNNL): live-balance, DeepSeek (`GET https://api.deepseek.com/user/balance`) and partial credit counts from search/crawl vendors such as Serper or Spider Cloud; ledger-only, most frontier LLM vendors, including Claude, OpenAI, Perplexity, Grok and MiniMax. **For every ledger-only provider the per-run ⛔/⚠ balance verdict is ESTIMATE-ONLY**, because it can only read the manually-recorded ledger figure (often `UNKNOWN`). Never print a confident block/warn you cannot actually evaluate; for ledger-only providers the real backstop is the provider-side hard limit (see **Preventing Negative Balances**, a REQUIRED one-time setup, not optional). Which class a provider falls into is a property of that vendor, checked when the slot is filled. It is never a statement that FNNL uses it.
- **The ledger is created on first use, never assumed present.** `scripts/api-balance-ledger.md` does not ship with this repo. If it is missing at the first paid run, create it (a header carrying the warning threshold, then one row per configured provider) before writing any balance or decrement. Never report a balance you read from a file that does not exist.
- **A filled slot is not a proven slot.** A tool recorded in the stack contract with status `chosen` has only been named; only status `live` means a real call against FNNL's own account has succeeded. Treat `chosen` as not-yet-usable when deciding whether a balance check or a paid call can actually run, the same way you treat an unverifiable balance.
- **Low-balance warning threshold: $10** per key (configurable in the ledger header).

## The Gate Protocol (run every time an API-calling skill is about to run)

1. **Detect.** Look up the target skill in the [Skill → API Registry](#skill--api-registry). If it calls no paid API → say so, proceed, no gate needed.
2. **Estimate.** Compute the USD range per provider it will call (see [Estimation](#estimation)).
3. **Check balance.** Live-balance providers → call the endpoint and use the returned figure. Ledger-only providers → read `scripts/api-balance-ledger.md`. For a ledger-only provider, show `balance: <ledger figure or "n/a, estimate-only">` and rely on its provider-side hard limit. Do not fabricate an OK/⛔ you can't verify, and do not assume a provider is live-balance just because its slot is filled.
4. **Decide + preview.** Show the operator the preview block below and one of:
   - ✅ sufficient balance → ask for confirmation to run.
   - ⚠️ a key is under $10 → warn, recommend top-up, ask whether to proceed anyway.
   - ⛔ a key is below the estimated cost → **block**; require top-up before running.
5. **Run** only after confirmation.
6. **Report + decrement.** After the run, show actuals (or estimate-as-actual), then subtract from the ledger and note the new balance.

### Pre-run preview block (always show this before running)

```
RUN PREVIEW: <skill name>
APIs it will call : <providers>
Est. cost         : $<low>–$<high>   (basis: <tokens/credits/images>)
  - <Provider A>  : $<low>–$<high>   | balance $<x>  <OK / ⚠ low / ⛔ insufficient>
  - <Provider B>  : $<low>–$<high>   | balance $<x>  <OK / ⚠ low / ⛔ insufficient>
Threshold         : $10/key (balance warning)
Research cap/prov : $<research_budget_usd_per_provider>/provider per client —
  - <Provider A>  : $<spentA> + $<estA-high> / $10  <within / would-EXCEED>
  - <Provider B>  : $<spentB> + $<estB-high> / $10  <within / would-EXCEED>
Verdict           : <PROCEED / WARN-low-balance / BLOCK-topup-required / BLOCK-research-cap>
Proceed? (y/n)
```

### Post-run report block (always show this after running)

```
RUN ACTUALS: <skill name>
  - <Provider A>  : <in/out tokens or credits> → $<actual>   (exact / estimated)
  - <Provider B>  : <…>                          → $<actual>
Total this run    : $<sum>
Ledger updated    : <Provider A> $<old> → $<new> ; <Provider B> $<old> → $<new>
Research spend    : <client> | <Provider A> $<newA>/$10 ; <Provider B> $<newB>/$10  (per-provider caps)
Low-balance flags : <none / Provider X now $<x>, top up>
```

## Per-Client, Per-Provider Research Budget Cap (hard stop)

This is the cap that stops a research task from quietly running up a bill. It is **separate from `run_state.spend_ceiling_usd`** (the whole-run ceiling for ALL spend: domains, mailboxes, enrichment credits). This cap governs ONLY AI research/model spend for a single client.

- **Default `run_state.research_budget_usd_per_provider = 10`: EACH provider is capped at $10 per client.** Every third-party provider the contract locks to a research or crunch slot (`research_provider`, `bulk_classification`, `search`, `crawl`) gets its own independent $10 ceiling. This is **not a single shared $10 pool**; the theoretical max research spend per client is $10 × (providers actually used). Tracked **cumulatively per provider** across every research-calling skill for that client: `lead-source-strategy` (Discovery), `offer-intelligence`, `auto-research-public`, `campaign-strategy`, `data-point-discovery`, `lead-magnet-brainstorm`, `list-quality-scorecard`.
- **The running totals live in `scripts/api-balance-ledger.md`** as a per-client `RESEARCH SPEND` table, **one row per (client × provider)** (`<client> | <provider> | $<spent> / $<cap>`), co-located with the decrements that update it. **Auto-create it, do not assume it exists:** at the FIRST research call for a client, if that client has no `RESEARCH SPEND` rows, seed a zeroed row per provider before estimating; then read it before every subsequent research call and add this run's per-provider high estimate. (The earlier spec put this block in the client `activity-log.md`, where it was never actually created. Keep the single source of truth in the ledger, where the per-run decrement already happens.)
- **HARD STOP per provider.** For each provider this run will call: if `provider_running_total + this_run_provider_estimate_high` would exceed `research_budget_usd_per_provider`, **BLOCK that provider's call, do not run it.** Surface the overage and require the operator to type an explicit higher number for that provider. **Never auto-raise, even under `auto_execute`**, because this is a hard stop, not a warning. (Distinct from the $10/key low-balance *warning*, which is about remaining account balance; this is cumulative *spend* per provider per client.)
- **Primary research is Claude native `/deep-research`; the third-party research tools are the gap-fill complements.** The Claude native `/deep-research` harness does the primary broad pass first (it fans out internally, so one run is many parallel category searches); whatever tool is locked to `research_provider` takes only the gap list, never repeats the broad pass. Per-client anti-waste call caps (from `ai-model-routing.md`): Claude native `/deep-research` **1-2 runs/client** (capped by run-count), the grounded-search gap-fill role **1-3 gap passes/client**, the deep-reasoning gap-fill role **1-3 gap prompts/client**, a pinpoint premium deep-reasoning run **1/client**. Which tool plays each role comes from `research_routing` in the stack contract, never from a default. Raise only by explicit operator approval. Note: Claude native `/deep-research` is **Anthropic-billed**, so it is capped by run-count here and is NOT one of the third-party providers under the $10/provider research cap below. That $10/provider cap governs the third-party helpers, including any tool locked to `research_provider` itself.
- **The deep-reasoning gap-fill role is the blowout risk.** Premium deep-research models count against that provider's $10 at full high estimate, and the per-client call caps above (1-3 gap prompts, 1 pinpoint premium run) apply on top.
- Reset the per-provider totals only when the operator explicitly starts a new research cycle for the client; note the reset in the ledger's `RESEARCH SPEND` table.

## Preventing Negative Balances (provider-side, the real safeguard)

The cap above is a STOP INSTRUCTION inside the workflow. It cannot physically prevent a provider from billing you; only the provider account config can. The skill stops *its own* calls; it does not control the vendor's meter. **This is a REQUIRED one-time setup per provider, not optional advice. Verify it once and record it (a "limits set" note in the ledger header). For every ledger-only provider (no balance API) it is the ONLY real backstop** behind the estimate-only per-run gate. Whichever providers the stack contract ends up selecting, set these once per provider so a surprise `-$50` is impossible. Match the guidance to the provider's billing model:

- **Postpaid, with auto-recharge available (the only billing model that can go negative):** set a **hard monthly usage limit** at or below your tolerance, and turn **auto-recharge OFF**. Postpaid + auto-recharge is the ONLY way a balance goes negative. Examples of providers that bill this way (illustrative only, none chosen for FNNL): OpenAI (Billing → Limits). Where such a provider offers a hosted deep-research route, that route **does spend**: token cost **plus a per-web-search tool cost**, so a deep-research job is not free. Cap each job with the provider's max-tool-calls control, keep it to gap-fill (never a duplicate broad pass), and hold it under the **$10/client per-provider research cap**. The hard monthly limit is the backstop.
- **Prepaid credit or a usage limit:** use the prepaid credit or set the usage limit, and no auto-recharge. Examples (illustrative only, none chosen for FNNL): Perplexity, Grok.
- **Prepaid credit balances that cannot go negative:** keep these on **prepaid credit balances**. They cannot go negative, they just stop. A balance that "stops" is the safe failure mode; a postpaid bill that "continues" is the dangerous one. Examples (illustrative only, none chosen for FNNL): DeepSeek, Serper, Spider Cloud.
- Re-check these after any provider plan change.

## Skill → API Registry

Which skills spend money, on what, and on which key. "Tokens" = LLM token billing; "credits" = per-search/per-page/per-contact billing.

| Skill | Capability slot(s) it spends on | Cost basis | Typical run cost (rough) |
|---|---|---|---|
| `lead-source-strategy` (Discovery) | `research_provider` + `crawl` + `bulk_classification` | tokens + page credits | $0.10–$1.00 |
| `offer-intelligence` | `research_provider` + `crawl` + `bulk_classification` | tokens + page credits | $0.15–$1.50 |
| `auto-research-public` | `research_provider` + `search` + `crawl` + `bulk_classification` | tokens + search/page credits | $0.10–$1.20 |
| `campaign-strategy` | `research_provider` + `crawl` + `bulk_classification` | tokens + page credits | $0.10–$1.00 |
| `campaign-copywriting` | `copywriting` (final copy), `bulk_classification` (QA, optional) | tokens | $0.05–$0.60 |
| `personalization-subagent-pattern` | none by default (Claude Code Task); `bulk_classification`/`research_provider` feed research; a billed `copywriting` API only on the 1,000+ at-scale path | tokens (at scale only) | $0 default; $1–$20+ at scale |
| `lead-magnet-brainstorm` | `bulk_classification` + `research_provider` (deep-reasoning role, no broad pass) | tokens | $0.02–$0.30 |
| `data-point-discovery` | `research_provider` + `bulk_classification` | tokens (one brainstorm pass) | $0.02–$0.30 |
| `tam-build` | `crawl` + `company_discovery` (company records, MCP) + `contact_discovery` (separate connector; if a pack providing one is active, e.g. `/aleads-api`†) + `bulk_classification` + `search` list sources | page + per-record credits + tokens; the contact-discovery connector's own cost model not yet confirmed | scales with TAM size ($1–$50+) |
| `list-quality-scorecard` | `bulk_classification` (premium tier for scoring, cheap tier for bulk) | tokens | $0.02–$0.40 |
| `icp-prompt-builder` | none by default (Claude Code Task); `research_provider`/`bulk_classification` only on the optional at-scale path | tokens (at scale only) | $0 default; varies at scale |
| `prospeo-full-export`† / `prospeo-search-api`† | `contact_enrichment` (this skill's own vendor integration) | contact credits | per Prospeo plan |
| `aleads-api`† (company_search, MCP) | `company_discovery` (this skill's own vendor integration) | company record credits (metered) | per A-Leads plan |
| `aleads-api`† (find_email / find_phone, MCP; its own verify path is retired in favor of whatever fills `email_verification`) | `contact_enrichment` (this skill's own vendor integration) | contact credits (1 per found) | per A-Leads plan |
| `email-waterfall` | Finder: the `contact_enrichment` waterfall, in the order recorded in the contract's `contact_enrichment.notes`. Verify (existing + found emails): `email_verification` | finder = 1 credit/found; verifier = per email; residue waterfall = pay-per-valid | per provider plan |
| `google-maps-list-builder`† | `company_discovery` (local-business source) + `search` | place/page credits | per provider plan |
| `blitz-list-builder`† | `contact_enrichment` (this skill's own vendor integration) | enrichment credits | per Blitz plan |
| `mailbox-profile-generator` | `image_generation` | per image (low, ~$0.04/mailbox) | ~$0.04 × mailboxes (one shared headshot per client = one image) |

† **Listed for the spend class, not loadable today.** These rows ship inert under `_vendor-library/skills/<pack>/` and only become runnable skills when `/stack-setup` activates the matching pack. They stay in the registry so the gate can price that spend class the moment a pack goes live; their presence is not a claim that FNNL has the tool, the pack, or a key. The same applies to any vendor helper script named in this file: verification, enrichment and balance-check helpers live under `_vendor-library/scripts/<vendor>/` and do not reach the live `scripts/` directory until the pack is activated, so treat those commands as what-to-run-once-activated, never as a command available now.

**`intent_signals` has no registry row of its own.** The skill that used to drive engagement-signal tools (`competitor-engagers`) is not present in this fork, so there is no named row to price. That is not a claim that nothing else can spend on this slot: other skills discuss intent and engagement signals, and `intent_signals` is a real contract slot. If any skill or activated pack calls a tool filling `intent_signals`, gate it here on signal/actor credits at the provider's published plan price before it runs.

Skills NOT in this table (kickoff, icp-onboarding, mailbox/domain setup, spintax, uploads, deliverability, DOCX exports, trackers) call **no token-billed AI API**. They run on Claude Code locally and need no cost gate. Domain/registrar/mailbox skills spend money on *services*, not API tokens; flag those by their own published price, not this token model.

**This table names capability slots, never vendors, because there is no default stack to name.** The tool that actually fills each slot is whatever the workspace stack contract at `02-skills/coldoutbound-skills/stack-contract.yaml` is locked to for this client. That contract ships empty. Nothing in this file asserts that any provider is FNNL's default, standard, primary, configured, or keyed. If a slot a skill needs is unset, stop and route the operator to `/stack-setup` rather than substituting a vendor: an unset slot is a blocked run, not license to guess a plausible tool from a worked example or from `_vendor-library/`.

`/preflight-credentials` lists most research and data slots warn-level (won't hard-block) **only because those slots degrade gracefully to a documented fallback** (see `/ai-model-routing` Fallback Rules), never because a slot is skippable. Read a warn-level credential as "this slot has a fallback", not as "this slot is optional". Whether any given slot is genuinely optional for FNNL is a stack-contract decision, recorded there, not asserted here.

**MCP infra ops are a spend surface too.** MCP tool calls (a `registrar` MCP registering or renewing a domain, a `mailbox_provider` or `sending_platform` MCP creating domains and mailboxes) bypass this script registry entirely: a single call can register many domains or create dozens of mailboxes, real money with no script involved. Examples of tools that could fill those slots (illustrative only, none chosen for FNNL): Spaceship, Zapmail, Salesforge. Gate every spending MCP op here exactly like a script: preview USD by the provider's published service price, check funds/balance, confirm, then act. Free reads (list/check/DNS-edit, analytics) need no gate. See `/mcp-tools-routing` for the per-server spend map.

### Machine mirror & ownership split

The provider → credential map (exact env var names, well-formedness shapes, and the `run_state` value that triggers each) is mirrored machine-readably in `scripts/credential-registry.json`. That JSON is the single source of truth read by `/preflight-credentials`, the run_state-scoped Credential Preflight Gate wired into `/cold-email-kickoff` (Step 2.6).

**Ownership split (no duplicated logic):**
- **`/preflight-credentials` owns *presence + shape***: is the key there and well-formed, scoped to the locked `run_state` path. It runs at kickoff, before any spend, and never checks balance.
- **This skill owns *balance + spend***: the USD estimate, the live/ledger balance check, and the decrement. It never re-implements presence/shape.

They share `credential-registry.json`; they do not duplicate each other. When you add a provider or key to the Skill → API Registry above, add it to `credential-registry.json` too, because the preflight FAILS LOUD if the locked path needs a provider that has no registry entry (so drift surfaces immediately instead of passing silently).

## Pricing (reference rates for commonly used providers: VERIFY and update; prices drift)

Per 1M tokens unless noted. **These are published market rates for providers commonly used in this kind of workflow, listed so a USD estimate can be computed at all. Listing a provider here does not mean FNNL uses it, has a key for it, or has chosen it for any slot.** Replace and extend this table for whichever tools `stack-contract.yaml` actually selects. **These are reference figures to keep the estimate honest, not live-fetched prices. Update them here when a provider changes pricing.** Last set: 2026-06.

| Provider | Input | Output | Notes |
|---|---|---|---|
| Claude (Sonnet-class) | ~$3 | ~$15 | Opus higher, Haiku lower; pick the tier actually used |
| OpenAI (GPT-4o-class) | ~$2.50 | ~$10 | mini tier ~$0.15 / ~$0.60 |
| DeepSeek | ~$0.27 | ~$1.10 | cache-hit input much cheaper; live balance API available |
| Grok / xAI | ~$3–5 | ~$15 | verify current tier |
| MiniMax | ~$0.20–1 | ~$1–2 | OpenAI-compatible; verify tier |
| Perplexity (sonar) | ~$1 | ~$1 | plus a per-request search fee |
| Serper | — | — | ~$0.001 per search (credit) |
| Spider Cloud | — | — | ~$0.0001–0.001 per page (credit) |
| Prospeo / A-Leads / WizLeads / Blitz / Apify / Scrap.io / Trigify | — | — | per-contact / per-record / per-actor; use the provider's plan price |
| BetterContact | — | — | per **valid** contact (pay-per-valid waterfall — invalid results cost nothing); est. ~$0.02–0.06/valid by plan, verify in-dashboard. 50 free starter credits; monthly allowance, rollover capped at plan amount, **no auto-recharge**. `GET /api/v2/account` returns `credits_left`. ⚠️ Out-of-credit runs go **"on hold"** (manual Process, no auto-retrigger) — confirm `credits_left` ≥ run size before submitting; the script aborts at 0 |
| Email **verification + catch-all** (the `email_verification` slot) | — | — | per email checked. The capability worth paying for is **two-in-one**: deliverability status plus a separate catch-all flag returned by a single call, rather than two billed passes. Examples of tools that could fill this slot (illustrative only, none chosen for FNNL): Deliverable.co, whose parked vendor pack ships `deliverable_verify.mjs` returning `email_status` + `is_catch_all` in one async call, has **no balance endpoint** (a `402` means out of credits or expired, and `--check` is connectivity only), and reads key `DELIVERABLE_API_KEY`. |
| *Verify-capable finders and standalone verifiers (candidates, not a default):* a contact tool's own verify endpoint (e.g. A-Leads `verify_email`), BounceBan (catch-all), Enrichly, MillionVerifier/Reoon/LeadMagic | — | — | whether verification runs on a dedicated `email_verification` tool or on a finder's own verify endpoint is a stack-contract decision, not a default. A tool filling `contact_enrichment` is not automatically the verifier. Prefer whichever option returns deliverability + catch-all in one call, since two separate calls bill twice per row. |

> **Verify-first cost note:** when a contact row already has an email, the cheap move is verify-first (email + catch-all), a few tenths of a cent per email, NOT a `contact_enrichment` finder run (~$0.02–0.06/valid) that re-discovers an email you already hold. Routing per `/email-waterfall`'s Verification Doctrine: send those rows to the `email_verification` slot (verify + catch-all in one call where the chosen tool supports it), not back through the finder waterfall. Preview the row count × the per-email rate and gate it like any other paid step.

## Estimation

Token estimate per stage = (expected input tokens + expected output tokens). Rough planning sizes:

- **Discovery / web research call** (`research_provider`): ~2–8k in, ~1–3k out per query; 1–5 queries per account.
- **Page extraction** (`crawl`): count pages × per-page credit; text then feeds a crunch call.
- **Crunch / analysis** (`bulk_classification`): can be large input (10–50k) but cheap; ~2–5k out.
- **Final copy** (`copywriting`): ~3–10k in (the clean packet) + ~1–3k out per variant set.
- **QA classification** (`bulk_classification`): ~1–4k in, <1k out.

USD = (input_tokens/1e6 × input_rate) + (output_tokens/1e6 × output_rate), summed per provider, plus any per-search/per-page/per-contact credits. Report a low–high band, not a point estimate. When a skill loops per row (per-lead research), multiply by row count and **say so loudly**: per-row `research_provider` calls are the most common cost blowout (see `ai-model-routing.md` cost rules: prefer one account-level pass reused across contacts).

## Balance Check

Route by the provider class you established above, not by vendor name. Check the class once per configured provider and record it in the ledger header.

- **Live-balance providers:** call the documented balance endpoint, use the returned figure, and still mirror it into the ledger. Examples of endpoints that work this way (illustrative only, none chosen for FNNL): DeepSeek, `GET https://api.deepseek.com/user/balance` with `Authorization: Bearer $DEEPSEEK_API_KEY`; BetterContact, `GET https://app.bettercontact.rocks/api/v2/account` with header `X-API-Key: $BETTERCONTACT_API_KEY` → `credits_left`, which its integration pack exposes as a `--credits` balance + auth check.
- **Partial-credit providers:** a credit count may appear in an account endpoint or in response headers; use it if present, else fall back to the ledger. Search and crawl vendors often behave this way (illustrative only: Serper, Spider Cloud).
- **Ledger-only providers:** read `scripts/api-balance-ledger.md`. There is no public remaining-balance API, so the dashboard number you record on top-up is the source of truth (illustrative only: Claude, OpenAI, Perplexity, Grok, MiniMax).

A vendor integration pack referenced above only exists once `/stack-setup` has activated it. If the script or endpoint is not there, say the balance is unverifiable and fall back to the ledger. Do not invent a reading.

Run a balance read **before** the run (for the gate verdict) and decrement **after** (with actuals). Never run a skill whose required key shows below the estimated cost. Require top-up first. This is deliberate: it stops a run from silently skipping a low-balance key and producing half-enriched or half-researched output.

## Hard Rules

- Never run an API-calling skill without showing the pre-run preview and getting confirmation.
- **TAM signal collection is complete by default; the run ceiling governs it, and raising the ceiling is the recommended default (never auto-applied).** `/tam-build` collects every obtainable Layer-1 signal up front (`/data-point-discovery` Collection Completeness HARD RULE). Signal collection is a MUST, not a tiered subset. **Which governor owns it:** enrichment-time model/crawl spend in `/tam-build` (`bulk_classification` classify/parse, `crawl` page pulls, discovery-source credits) is **enrichment under `run_state.spend_ceiling_usd`**, NOT the per-provider research cap below. That cap governs only the listed research/brainstorm passes (`/data-point-discovery`'s brainstorm, `/lead-source-strategy`, `/offer-intelligence`, etc.), and `/tam-build` is deliberately absent from that skill list, so the $10/provider research cap never gates collection completeness. When the previewed full-collection cost meets or exceeds `spend_ceiling_usd`, STOP and surface it, recommending the operator **raise the ceiling to cover full collection** (completeness drives campaign-slice optionality), with trim-by-rank only on the operator's explicit choice. Never silently drop obtainable signals to fit a ceiling, and never auto-raise the ceiling: the operator decides between raise and trim.
- Never claim an exact USD figure you did not measure. Label estimates as estimates.
- Never assert a provider's live balance you could not actually fetch. Say "ledger figure" when it's the ledger.
- Always warn when any required key is under $10, even if the run would still fit.
- **Never let cumulative research spend on ANY single provider for a client exceed `run_state.research_budget_usd_per_provider` (default $10/provider), HARD STOP per provider, require an explicit operator raise, never auto-raise (even under `auto_execute`).** Add this run's per-provider high estimate to that provider's running `RESEARCH SPEND` line before deciding to run it.
- **The cap is a workflow stop, not a billing guarantee.** Provider-side hard usage limits on postpaid providers, prepaid balances on prepaid ones, and auto-recharge OFF are the real backstop against a negative balance. They must be set on the account; this skill cannot enforce them.
- Always decrement the ledger after a paid run, including estimate-as-actual runs.
- Keep `scripts/api-balance-ledger.md` out of any public commit (it shows spend, not secrets, but it's operational data).
- If pricing looks stale, flag it and update the Pricing table before trusting the estimate.

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short, and record status, not raw output. Full protocol: `client-activity-log.md`.
