# Archive: cold-email-kickoff, full pre-change snapshot

- **Source file:** `.claude/skills/cold-email-kickoff/SKILL.md` (FNNL Agency GTM System)
- **Archived:** 2026-09-22, operator directive: remove the offer-ideation limits (client willingness, capacity, effort, free trial) and move the capacity question to after the test
- **Why a full snapshot:** this file carried other sessions' uncommitted edits when it was changed, so the whole file is kept verbatim as the exact pre-change state. Diff it against the live file to see this change alone.
- **Replaced by:** the live file at the same path. `MANIFEST.md` in this folder lists what changed and why.

This is a record, not live doctrine: do not lift any of it back into a skill.

`````markdown
---
name: cold-email-kickoff
description: Single "start here" orchestrator for new cold email operators. Runs a pre-fill discovery pass first (.env, existing profiles, website scrape), then checks for profiles/<business-slug>/intake-form.md - if found, skips all intake questions and reads execution_mode from the form. If no form, it fills the infrastructure and sending-platform capability slots from the stack contract at <outbound>/stack-contract.yaml, never from a default vendor, and stops for /stack-setup when a slot the run needs is empty. Runs /icp-onboarding -> /offer-intelligence (discovery) -> /lead-magnet-brainstorm (offer locks) -> /data-point-discovery -> /tam-build -> /lead-scoring -> /campaign-strategy, then /lead-source-strategy Lead Source Plan Mode after campaign selection, for new offers; or /offer-intelligence (validation) for existing offers. With execution_mode=auto_execute, picks top-ranked offer and campaign without pausing. Runs /mailbox-mix-strategy before any mailbox infrastructure spend. Spend is never asked at onboarding (operator directive 2026-09-22). Every client run gets a standing $100 budget in run_state.spend_ceiling_usd, so paid data steps inside it auto-approve and only a purchase that would push the run over it stops to ask. Mailbox infrastructure is outside that budget and needs the operator's approval of the setup total.
---

# Cold Email Kickoff

The single entry point for a fresh user. Replaces "stare at 29 skills and guess which to run first."

> ⚠️ **Read `coldoutbound-gotchas.md` before any mailbox / profile / export work.** It lists the field-tested dead ends this workspace has already paid for: provider APIs that do not cover mailbox purchase, list endpoints that cap far below the real count, read-only integrations that force a UI-only step, heavy web apps that freeze the renderer, sync-folder paths (such as OneDrive) that lose files, and the profile GIF that must be built with Node `sharp`+`gifenc` rather than Python/`gifencoder`. It also holds the hard agent boundaries: never enter login passwords, never create accounts, and never connect one provider to another on the operator's behalf. Reading it first keeps this run from re-testing them.

## Material Decision Rule

When this skill reaches a material fork, name the realistic options, recommend the strongest path, and explain why the main alternatives are weaker before committing.

Ask before choices that affect spend, provider routing, source of truth, list quality, campaign direction, client-facing output, live systems, scraping or account risk, or legal/compliance risk. For low-risk reversible choices, state the recommendation and proceed.

Do not turn failed or unsafe paths into user-facing options. If this skill's QA rules or stop gates reject a path, filter it out and explain the blocker only when useful.

## Interaction Policy

This skill defers to `/autonomous-execution-policy`. Under `run_state.execution_mode = auto_execute` (the operator's default), proceed without pausing: pick the strongest option per the rubric, record it to `run_state`/profile, and continue — never re-ask a decision already in `run_state`, `client-profile.yaml`, `campaign-plan.md`, memory, or the latest operator message. Spend runs against the standing budget in `run_state.spend_ceiling_usd` ($100 per client run, never asked): auto-approve within it. Stop only for the hard-stops in the policy. On a long async wait, background-poll and move to other productive work — never idle.

## First-Wave Default: validate the offer before scaling

For a new client, the first campaigns exist to prove the offer, not to scale or personalize. While `run_state.offer_market_proven` is `false`, use the Offer-Validation Wave posture in `first-wave-eric-defaults.md`: broad offer tests, minimal per-contact personalization, a TAM-sized 2-to-3-step sequence, and Tue-to-Thu sending. Framework A in `outreach-copy-framework.md` (the direct concrete offer, Aaron's measured winner anatomy) controls Email 1 in every wave: offer first with no greeting, 25 to 35 body words by default (the P.S. sits outside the count), the scope disclosure whenever it reflects the real process, and one primary ask, a soft permission question by default (operator-approved Aaron alignment, 2026-09-21). The phase flag changes strategy and measurement, not the initial-copy framework.

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short — record status, not raw output. Full protocol: `client-activity-log.md`.

## When to use

- First-time cold email operator on this repo
- New client/business being onboarded
- Experienced operator starting a new campaign for a new business
- Anyone who asks "where do I start?"

## What this skill produces

- A populated client profile under the canonical profile root from `/icp-onboarding`
- Offer, lead-magnet, a per-client data-point catalog (`data-point-catalog.md`), company and contact TAMs, a client-and-offer lead-scoring rubric, scored TAM files, campaign strategy, campaign plan, and campaign-level artifacts under the same profile folder
- A locked `run_state` that every later skill must respect
- A `run_state.mailbox_mix_strategy` gate before mailbox infrastructure spend, when setup starts from kickoff
- A next-skill menu based on the locked stack and infrastructure status

## Canonical Profile Root

All profile paths in this skill resolve under:

```text
<outbound>/profiles
```

When this skill says `profiles/<business-slug>/...`, read or write `<outbound>/profiles/<business-slug>/...`. Here `<outbound>` is the root of this skill library - resolve it to wherever the library is currently checked out (local Documents, OneDrive, or a git worktree); never hardcode an absolute path. Do not create client profiles under a `profiles/` folder at your current working directory.

## Provider Lock Rule

Ask for the stack once at the start, save it, and route everything from it.

```yaml
run_state:
  execution_mode: review_gates|auto_execute
  spend_ceiling_usd: 100   # the standing budget per client run (operator directive 2026-09-22). Written automatically, never asked. Paid data steps inside it auto-approve; a purchase that would go over it stops to ask. Mailbox infrastructure is outside it. A figure the operator sets for a client replaces it. Rule: /autonomous-execution-policy section 2
  research_routing: claude_deep_research   # the ONLY value (no-AI-API rule, operator directive 2026-09-22; third_party_ai and claude_native are retired). The Claude native /deep-research fan-out harness is the primary research brain (multi sub-agents run all categories in parallel + adversarial verify), plus Claude's built-in WebSearch/WebFetch; a thin sub-topic gets a second targeted /deep-research or WebSearch/WebFetch pass, never another provider. Native session, no API key of any kind. unset (or a retired value) → treat as claude_deep_research, do NOT stop to ask. ENFORCED: the Stage-1 primary pass MUST be an actual /deep-research invocation (not a single inline WebSearch or a per-row pass). Record ai_research_provider=claude-deep-research + an api-balance-ledger.md provenance line (an audit line with no dollar decrement; research_routing_check.mjs reads it); a research step finishing with no recorded /deep-research primary = flagged violation. Full rule: /ai-model-routing
  infrastructure_stack: <from stack contract>   # composite of the contract's registrar + mailbox provider slots, lowercase, joined with an underscore. No default.
  registrar: <from stack contract>              # No default. Set during /stack-setup, or ask the operator.
  mailbox_provider: <from stack contract>       # No default. Set during /stack-setup, or ask the operator.
  sending_platform: <from stack contract>       # No default. Set during /stack-setup, or ask the operator.
  list_workbench: <from stack contract>         # lead_data.list_workbench. Where lead lists are built so the operator watches them fill (zero-workbench-credit HARD RULE). Unset is NOT a stop: list builds fall back to CSV-only and say so.
  emailbison_instance_url: null|string          # instance URL, filled only when the locked sending platform is self-hosted and needs one
  emailbison_api_token_ready: yes|no|unknown    # applies only when the locked sending platform needs an API token before upload
  sender_personas: null|list   # one realistic human persona per client (first/last name), reused across every domain, inbox, and inbox provider. Set/recorded by the domain-setup skill before any inbox is created; never a role mailbox (team@/info@). Default: one persona per client.
  mailbox_mix_strategy:
    google_percent: null|int
    microsoft_percent: null|int
    basis: null|icp_company_size|operator_override
    confidence: null|low|medium|high
    rationale: null|string
    inboxes_per_domain: 2
    provider_ranges:
      google_domains: null|string
      microsoft_domains: null|string
  status:
    setup_stage: not_started|in_progress|complete
    warmup_stage: not_started|warming|complete
    datapoint_stage: not_started|building|complete
    proof_bank_stage: not_started|building|complete   # /social-proof-bank: the client's Social Proof + Trigger Bank. Built after offer lock + /data-point-discovery, may run IN PARALLEL with tam_stage (needs the locked offer + segments, not the enriched TAM). Soft gate — does not block campaign work; pre-loads the copy-time Proof-Asset Gate.
    tam_stage: none|sample_built|full_enriched   # none=not started; sample_built=bounded sample built+qualified, hold at the GO gate (auto-approves within ceiling under auto_execute, else stops); full_enriched=full qualified universe enriched. /campaign-strategy + /campaign-approval-brief require full_enriched. (the old "complete" meant only a sample — do not use it)
    scoring_stage: none|rubric_ready|complete    # /lead-scoring. Campaign strategy and paid email enrichment are blocked until complete.
    tam_enrichment_path: seat_a|seat_a_then_revcode    # Phase B: Seat A (this Claude Code) ALWAYS builds the full TAM hands-free. seat_a = Seat A completes every collectable column (default). seat_a_then_revcode = Seat A builds what it can, then a generated copy-paste prompt hands ONLY the remaining columns to the embedded agent of the external enrichment workspace the stack contract names (blocking round-trip). Mechanics: /tam-build Layer 1c
    list_stage: not_started|in_progress|complete
    copy_stage: not_started|in_progress|complete
    upload_stage: not_started|draft_created|launched_by_user
list_workbench_tables:        # top-level, NOT inside run_state. Written only when run_state.list_workbench is set.
  companies: { webhook_url: "", ready: false, auto_run_off: false }
  contacts:  { webhook_url: "", ready: false, auto_run_off: false }
  scored:    { webhook_url: "", ready: false, auto_run_off: false }
  send_lists: {}              # one entry per campaign, added when the campaign is selected
```

**List workbench tables.** When `run_state.list_workbench` is set, write the `list_workbench_tables` block above into the client profile with every table not ready. Then, once, before `/tam-build`'s first push, ask the operator to create the `companies`, `contacts` and `scored` tables in the list workbench's UI with an inbound-webhook source, turn auto-run off on each, and write each webhook URL plus `ready: true` and `auto_run_off: true` straight into the profile file. Treat webhook URLs like credentials: never ask for them in chat and never write them to a tracked file. A campaign's send-list table is requested the same way when `/email-waterfall` first needs it. Until a table is ready, the skill that needs it builds CSV-only and says so; it never blocks. Mechanics: `stack-contract.yaml` `lead_data.list_workbench.build_protocol`.

This state is binding. Do not suggest the other registrar, mailbox provider, or sending platform unless the selected path is impossible or the user explicitly asks to change providers.

**The stack contract is the only source of these values.** Read `<outbound>/stack-contract.yaml` and fill each capability slot from it. No slot has a default vendor, and none may be inferred from an API key, from habit, or from another client's profile. If a slot this run needs is empty or missing, **STOP and route the operator to `/stack-setup`**. That stop holds under `auto_execute`, exactly like the credential hard-stop in Step 2.6: choosing a provider is a provider-routing decision, not a rubric choice the execution mode can settle.

Some mailbox providers bundle their own domain registration, so the contract also declares which registrar and mailbox-provider pairings are valid. Route only a pairing it declares valid, and reject any other combination with the contract's stated reason instead of substituting a provider yourself.

## Form Data Is A Hypothesis

Onboarding form answers are research inputs, not locked decisions.

If a profile contains `offer.client_suggested_primary_cta`, `offer.client_suggested_lead_magnet`, or `offer.client_suggested_lead_magnet_details`, pass those into offer work as hypotheses. Do not treat them as `offer.lead_magnet`.

For a new client or new campaign, always run `/offer-intelligence` discovery mode, then `/lead-magnet-brainstorm`, then `/data-point-discovery` against the locked offer, even when the form already includes a lead magnet idea. The shape of the whole chain: buyer and pain, then the offer, then the list built to fit that offer, then the copy. The form idea becomes Candidate A in the brainstorm and must be scored against at least 3 alternatives.

Use validation mode only for a real existing offer backed by live or prior campaign evidence. A form-submitted ROI calculator, audit, template, or trial idea is not an existing validated offer.

## Proof-Asset Collection

**Proof-asset collection.** Good copy needs real evidence: a client you can name, a case study with a real before/after, an exact number. `/client-intake-form` collects these up front, and **Step 3.5 `/social-proof-bank` then builds the full, copy-ready Social Proof + Trigger Bank** (proof mapped per segment × service line, plus the why-now trigger/angle bank) — self-gathering from the intake, call notes, offer-intelligence, and the client's own site before asking the client for anything. That proactive bank is what makes the copy-time gate almost always pass. When a planned angle still needs proof that is not on file, the flow is blunt about the gap and collects it from the client with an easy fill-in form (`proof-asset-request.md`, bank mode for the whole-client sweep) instead of writing hollow or invented copy. `/campaign-strategy` flags any remaining gap earliest and `/campaign-copywriting` enforces the Proof-Asset Gate at copy time. This is a missing-source-material input gate, so it is not relaxed by `auto_execute` (the form is a data request to the client, not a pause that re-asks the operator).

## Flow

### Step 1: Stack routing

**Pre-fill discovery pass (run first, silently, before asking anything):**

1. Check `<outbound>/profiles/*/intake-form.md` and `<outbound>/profiles/*/client-profile.yaml` for prior `run_state` values.
2. Read `.env` and `.env.local` from the workspace root. Treat every key found as evidence that a credential exists, never as a stack decision. Map each key to the capability slot it would serve (sending platform, registrar, mailbox provider, self-hosted instance URL, email verification, lead source) and check it against `<outbound>/stack-contract.yaml`. A key for a provider the contract does not declare is a mismatch to surface to the operator, not a vendor to adopt. AI-provider keys are out of scope here (no-AI-API rule, 2026-09-22): never ask for one at kickoff, and leave the headshot image key to infrastructure setup (Step 6).
3. If a business website URL is available from context, scrape it to build ICP pre-fills for Step 2.

**Intake form fast path:**

Check `<outbound>/profiles/<business-slug>/intake-form.md`:

- If it exists and is valid: read it, populate `run_state` (including `execution_mode`, plus the standing `spend_ceiling_usd: 100`), and **skip all Step 1 stack-routing questions**. Confirm in one line: "Loaded intake form for [business]. Stack: [stack]. Platform: [platform]. Mode: [execution_mode]." Then proceed to Step 2.
- If it does not exist: continue with the stack resolution below. Fill each capability slot from the stack contract, show the value with its source label, and let the user confirm or correct it.

Set these defaults when no intake form is present: `run_state.execution_mode: review_gates` and `run_state.spend_ceiling_usd: 100` (the standing budget, operator directive 2026-09-22, never asked). `auto_execute` is opt-in only: set it solely from a confirmed intake form or an explicit user instruction, never silently. The spend figure changes only when the operator names a different one for this client. These match the defaults `/icp-onboarding` writes, so a profile from either entry path behaves identically.

Before touching business context, resolve the stack from the contract rather than from a vendor menu.

Read `<outbound>/stack-contract.yaml` and fill, in this order:

1. `run_state.registrar` and `run_state.mailbox_provider` from the contract's declared infrastructure pairing, then derive `run_state.infrastructure_stack` as the composite of the two.
2. `run_state.sending_platform` from the contract's sending-platform slot, plus `run_state.emailbison_instance_url` only when that platform is self-hosted and the contract carries an instance URL.

There is no default for any of these slots. If the contract is missing, or a slot this run needs is empty, **STOP** and tell the operator to run `/stack-setup` to declare it. Do not present a vendor menu, do not infer a vendor from a key in `.env`, and do not carry a vendor over from another client. This stop holds under `auto_execute`, because provider routing is a hard stop rather than a rubric choice.

When the contract does declare a slot, confirm it back in one line with its source and let the operator correct it before it is saved, as a Claude Desktop native Interactive Input / Choice Prompt with the contract value as the recommended option. A correction made here is written back to the contract too, so the next run reads the same value.

Do not ask whether domains are purchased, inboxes are warmed, or provider keys are connected during kickoff. Those are execution checks owned by the selected setup, source, verification, or platform manager skill at the moment that check actually matters.

If the user volunteers existing infrastructure status, record it in `run_state.status` as unverified context. Before upload, verify sender readiness through the manager for the locked sending platform. If readiness cannot be verified, stop with the missing verification instead of asking the kickoff question again.

Allowed infrastructure pairings come from the contract, not from this file. `run_state.infrastructure_stack` is the composite of the contract's declared registrar and mailbox provider, written lowercase and joined with an underscore (`<registrar>_<mailbox_provider>`); a provider that bundles its own domain registration fills both slots with itself. Route only a pairing the contract declares valid.

Reject any pairing the contract does not declare, and name the rule it broke (most often a bundled mailbox provider paired with a separate registrar it cannot accept). Do not repair a rejected pairing by picking a substitute provider yourself: stop, show the contract's valid pairings, and let the operator choose or re-run `/stack-setup`.

### Step 2: Load or create the business profile

Check for `<outbound>/profiles/<business-slug>/client-profile.yaml`:

- If it exists and `icp.source = intake_form`: load it silently. Skip `/icp-onboarding` entirely. Proceed to Step 2.5.
- If it exists but was not sourced from an intake form, load it and ask:

```text
I found an existing client profile. What should I use?

A. [Recommended] Use existing profile
B. Start fresh
C. Review differences first
D. Custom answer
```

- If it does not exist, invoke `/icp-onboarding`.

If the profile already has `run_state`, compare it to Step 1 answers. If they conflict, stop and ask the user which one is current before proceeding. Provider drift at this point breaks later steps.

### Step 2.1: Resume routing

If a profile already exists, do not restart from the top. Resume from the earliest incomplete point. Check offer/strategy completeness before infrastructure status — a profile with only form-suggested offer fields is not ready for setup or list work.

| Profile state | Resume at |
|---|---|
| No `client-profile.yaml` | Step 2 (create via `/icp-onboarding`) |
| Profile exists but neither `offer.lead_magnet` nor `offer.offer_validation_path` exists | Step 3A, offer work: `/offer-intelligence` discovery, then `/lead-magnet-brainstorm` |
| Profile contains only `offer.client_suggested_*` fields | Step 3A, `/offer-intelligence` discovery, then `/lead-magnet-brainstorm` with the form idea as Candidate A |
| Offer locked but no `data-point-catalog.md` | Step 3.3 — `/data-point-discovery` |
| `data-point-catalog.md` exists but `proof_bank_stage` not complete (no `social-proof-bank.md`) | Step 3.5 — `/social-proof-bank` (runs in parallel with TAM build; does not block Step 4) |
| Offer locked but `tam_stage` is `none` (no `tam/tam.csv`) | Step 3.4 — `/tam-build` (Phase A sample) |
| `tam_stage = sample_built` (sample only; not the full enriched universe) | Step 3.4 — GO gate (auto-approves within ceiling under `auto_execute`, else operator go) → Phase B full build + enrich; campaign work stays blocked |
| `tam_stage = full_enriched` but `scoring_stage != complete` | Step 3.6, `/lead-scoring` |
| `tam_stage = full_enriched`, `scoring_stage = complete`, but no `campaign-strategy.md` | Step 4, `/campaign-strategy` |
| No launch campaign selected from `campaign-strategy.md` | Step 6 — campaign selection |
| `run_state.status.setup_stage` not complete | Step 6 — infrastructure branch |
| Setup complete but warmup incomplete | Step 6 — list/copy work only; real sending stays blocked |
| Infrastructure ready but no list | Step 6 — list/launch branch (`/lead-source-strategy` Lead Source Plan Mode) |
| List exists but no `variants.yaml` | Step 6 — `/campaign-copywriting` |
| `variants.yaml` exists | Step 6 — spintax then upload for locked `run_state.sending_platform` |

### Step 2.5: Enumerate distinct ICP segments

Before deciding on the offer path, scan `client-profile.yaml` for distinct buyer segments. A new segment is warranted when the ICP has a meaningfully different industry vertical OR a fundamentally different job-title cluster implying different pain, different awareness level, or different offer fit.

Group the industries from `icp_hard_filters.industries_in` into segments. Example for a client targeting Insurance, Banking, and Tourism: (1) Insurance, (2) Banking / Financial Services, (3) Tourism & Hospitality.

Rules:
- Cap at 5 segments. Single-segment clients run Steps 3A-3B once.
- If more than 3 segments exist, ask the user to prioritize the top 3 for discovery work - run offer intelligence on those only.
- If all segments share the same source landscape and offer fit, one combined discovery run is acceptable - flag it explicitly.

Present the segments before proceeding:

```text
I see N distinct ICP segments in your profile:
1. [Segment 1] - [titles / industry]
2. [Segment 2] - [titles / industry]
...

I will run offer intelligence on each and select the lead magnet, then catalog the data points against the locked offer.

A. [Recommended] Proceed with these N segments
B. Merge some segments (explain which)
C. Add a segment not listed above
D. Custom answer
```

Save the confirmed segment list to `run_state` or a note in `client-profile.yaml` before proceeding. Steps 3A runs once per confirmed segment.

### Step 2.6: Credential Preflight Gate

Before any offer research (Steps 3-5) or infrastructure spend (Step 6), verify that the API keys the **locked path** actually needs are present and well-formed. This catches a missing or malformed key in seconds at kickoff instead of failing deep into a run. It is a binary pass/fail gate and a legitimate credential hard-stop under `/autonomous-execution-policy` (a missing required key is a real stop, regardless of `execution_mode`).

Placed here (not literally after Step 1) because the check reads `run_state` from `client-profile.yaml`, which does not exist until Step 2. By this point the stack and platform are locked and persisted, and it is still before any spend.

It checks **presence + shape only** — never balance, never secret values. Balance/spend stays owned by `/api-cost-governance`. The gate stays inside the `coldoutbound-gotchas` hard boundaries: read-only, no passwords, no account creation, no cards.

**1. Persist run_state first.** Write the locked fields to `<outbound>/profiles/<business-slug>/client-profile.yaml` so the script can read them: `run_state.infrastructure_stack`, `run_state.registrar`, `run_state.mailbox_provider`, `run_state.sending_platform`, and `run_state.emailbison_instance_url` (only when the locked sending platform is self-hosted).

**2. Run the preflight:**

```
node "<outbound>/scripts/preflight-credentials.mjs" --profile <business-slug>
```

It resolves required vs optional keys from `scripts/credential-registry.json` × the locked `run_state`, prints a Required/Optional summary with masked tails (last 4 chars), writes `profiles/<business-slug>/preflight-credentials.json` for resumability, and sets an exit code.

**3. Branch on the exit code:**

- **Exit 0 (PASS):** all REQUIRED keys for the locked path are present and well-formed. Append a status-only activity-log line (e.g. `NOTE preflight: 4/4 required keys present (locked stack + sending platform)`) and continue. Under `auto_execute` proceed silently; under `review_gates` show the Required/Optional summary first.
- **Exit 1 (FAIL):** a REQUIRED key is missing/malformed, or the locked path needs a provider absent from the registry (registry gap). **STOP.** Report exactly which REQUIRED keys are missing/malformed for the locked path — this is the credential hard-stop; do not start offer research, domain availability checks, or any purchase. Log `BLOCKED preflight: <KEY> …`. If the script reports a key "found by name in `<slug>-keys.env`", tell the operator to merge it into `scripts/.env` (the runtime reads only `.env`). When the operator adds the key, re-run.
- **Exit 2:** the gate could not scope/verify (no profile, no `run_state`, or registry missing/invalid). **STOP** and print the script's fallback message; fix the profile/registry, then re-run.
- **`node` not found:** do not crash the flow — tell the operator to verify the keys for the locked stack by hand in `scripts/.env`, then continue at their discretion.

Warn-level keys (email verifier, lead-data and lead-source tools) print `⚠` if missing but never block. **Which keys are REQUIRED and which are warn-level is resolved by `scripts/credential-registry.json` against the locked `run_state`, never by a vendor roster in this file.** **No AI key is asked for or flagged at kickoff** (no-AI-API rule, operator directive 2026-09-22): research, crunching and copy run in Claude Code itself and need no key, and the one AI exception, the headshot image key, is "not needed yet" until infrastructure setup starts (Step 6). Do not raise it here. **Warn-level is graceful degradation, NOT "optional extra":** a warn-level key usually belongs to a tool the stack contract expects on a real run, and stays warn only because it degrades to a documented fallback. Email verification is one of several interchangeable tools; the lead-source key is gated later by `/api-cost-governance` when the source is actually chosen.

Standalone re-run at any time with `/preflight-credentials`.

### Step 3: Choose the offer path before doing offer work

Ask one native choice-prompt question:

```text
Are we creating a new front-end offer, or validating a real existing offer backed by campaign evidence?

A. [Recommended for new clients, new campaigns, or form-only ideas] New offer selection
B. Evidence-backed existing offer validation
C. Custom answer
```

Do not run both paths. That creates two sources of truth.

Choose A for new clients, new campaigns, and any onboarding form suggestion that has not already been used in a campaign.

### Step 3A: New-offer path

**Run once per distinct segment confirmed in Step 2.5.** For each segment, pass the segment's ICP parameters (industry, titles, headcount, geography) and any relevant case studies or proof points specific to that vertical.

If all confirmed segments share the same buyer pain and offer fit, one combined discovery run is acceptable - explicitly note it covers all segments.

**Research-routing gate (first research step of the run).** *(Wired enforcement: after the offer-research sub-skills run, execute `node scripts/research/research_routing_check.mjs --skill <skill> --client <business-slug> --json` per research skill — or the no-`--skill` full audit once per client — and treat `violation:true` / exit 1 as a flagged routing violation that blocks declaring research done.)* `run_state.research_routing` has one value, **`claude_deep_research`** (no-AI-API rule, operator directive 2026-09-22: the old `third_party_ai` and `claude_native` values are retired). If it is **unset** or holds a retired value, treat it as `claude_deep_research` and proceed, do NOT stop to ask. The primary pass MUST be an actual **`/deep-research` invocation** (hand it the assembled brief so its sub-agents cover every category in parallel), not a single inline WebSearch or a per-row pass. A thin sub-topic is filled by a second targeted `/deep-research` run or a WebSearch/WebFetch pass, never by another provider. Record `ai_research_provider = claude-deep-research` + an `api-balance-ledger.md` provenance line (an audit line, no dollar decrement); a research step finishing with **no recorded `/deep-research` primary** is a **flagged violation**. No key is needed. Full rule: `/ai-model-routing`.

Invoke `/offer-intelligence` in **discovery mode**. This is the first offer step and it leads with buyer pain: it researches that pain in the prospect's own words from the client profile, the client's website, and public buyer voice. From that pain it maps which offer archetypes are saturated or open in this market and flags contrarian opportunity.

This produces `profiles/<business-slug>/offer-intelligence.md` as a discovery brief. It does not lock an offer. For multi-segment clients, the saturation map must include per-segment ratings when segments differ meaningfully.

Then invoke `/lead-magnet-brainstorm`. It loads the discovery brief and uses the saturation map and ICP pain language to anchor archetype selection.

If the onboarding form suggested a lead magnet, `/lead-magnet-brainstorm` treats it as Candidate A and generates at least 3 additional candidates. The client suggestion can win, but only after it scores higher than the alternatives.

At the end of `/lead-magnet-brainstorm`, ranked candidates are available. Apply `run_state.execution_mode` (`auto_execute` is the recommended default for this operator, per operator directive):

- `auto_execute`: select the highest-scored candidate automatically. Report: "Auto-selected offer: [name] (score: X/7). Reason: [one-sentence rationale]." Write it to `profiles/<business-slug>/lead-magnets.md` and lock in `client-profile.yaml`. Do not pause for input.
- `review_gates`: show ranked options and wait for operator selection. Only then write the chosen offer.

### Step 3B: Existing-offer path

**Research-routing gate (first research step on this branch).** *(Wired enforcement: after the validation research runs, execute `node scripts/research/research_routing_check.mjs --skill offer-intelligence --client <business-slug> --json` and treat `violation:true` / exit 1 as a flagged routing violation that blocks declaring research done.)* Validation mode below runs research. `run_state.research_routing` has one value, **`claude_deep_research`** (the old `third_party_ai` and `claude_native` values are retired by the no-AI-API rule); if it is **unset** or holds a retired value, treat it as `claude_deep_research` and proceed, do NOT stop to ask. The primary pass MUST be an actual **`/deep-research` invocation**, not a single inline WebSearch or a per-row pass, and a thin sub-topic gets a second targeted `/deep-research` or WebSearch/WebFetch pass, never another provider. Record `ai_research_provider = claude-deep-research` + an `api-balance-ledger.md` provenance line (an audit line, no dollar decrement); finishing with **no recorded `/deep-research` primary** is a **flagged violation**. No key is needed. Full rule: `/ai-model-routing`.

Invoke `/offer-intelligence` in **validation mode**. Do not send the offer through `/lead-magnet-brainstorm` as if brainstorming were evaluation.

Validation mode is allowed only when there is evidence that the offer exists outside the form, such as a live campaign, 300+ sends, prior reply data, or an approved existing campaign artifact. If that evidence is missing, go back to Step 3A and treat the client-stated offer as Candidate A.

If the evidence-backed offer was captured during onboarding, read it from `offer.validation_candidate` and verify `offer.validation_candidate_evidence` before invoking validation mode.

- If validation returns Go: lock the offer in `client-profile.yaml`, including `offer_validation_run` and `offer_validation_path`, then proceed through Steps 3.3, 3.4, and 3.6 before Step 4.
- If validation returns Iterate: keep the same offer source of truth, revise only the weak parts, then rerun validation until it scores 6+/7.
- If validation returns Swap or Swap (Contrarian): use the validated replacement offer from evidence, or run `/lead-magnet-brainstorm` only for replacement options informed by validation.

### Step 3.3: Catalog the data points (data-point discovery)

Once the offer is locked, it must be able to pass the copy-time Offer Architecture gate in `/campaign-copywriting`: SQL vs MQL framing, the easy-to-say-yes-to test, and a named risk reversal. If the locked offer has no clean risk reversal or fails the easy-yes test, flag it now so it is resolved before Email 1 rather than at copy time.

After the offer is locked (via Step 3A or 3B) and before the TAM is built, invoke `/data-point-discovery`. Given the locked offer and ICP, it exhaustively catalogs every company- and contact-level data point a campaign could slice on, cross-checks each for obtainability against the actual stack, classifies each `standard` / `client_specific` / `in_reserve`, and ranks by campaign value × obtainability × cost. It also records the market source landscape: where this market's data physically lives, and which of the stack contract's tools can reach it. It writes:

```text
profiles/<business-slug>/data-point-catalog.md
```

**Do not rename the two headings the approval deck parses.** `outbound/scripts/campaign_approval_brief.ps1` reads the literal strings `## Ranked Source Signals` and `- **Source risks:**` out of that catalog to build the client-facing approval deck, so both must stay byte-identical. Renaming either one silently empties a deck section while the script still exits 0. This is a naming guard on the catalog's headings, never a stop gate: do not halt a run over it.

This is **discovery, not collection**: it spends nothing (the brainstorm runs in the Claude Code session, with no AI API call) and reveals/verifies no contacts. The catalog is the contract `/tam-build` collects against. One catalog covers all confirmed segments (per-segment sections when segments differ). On completion set `run_state.status.datapoint_stage: complete`.

### Step 3.4: Build the company-level TAM

> **`/social-proof-bank`'s seed + proof-readiness portion runs BEFORE this step; the rest runs concurrently (parallelize-by-default).** `/tam-build`'s default discovery motion is a **seeded lookalike expansion from the client's case-study / customer companies** (run through whichever lookalike or similar-company tool the stack contract declares), so `/social-proof-bank` must FIRST produce the **per-group seed set** and clear the **Seed-and-Proof Readiness gate**: each proven-motion group needs its seed domains AND copy-ready proof-facts, and a `gap_block` on a group holds THAT group's TAM until the client returns the fact (never the other groups). A group with no case study at all is not a proven-motion group — route it to this step's EXPANSION motion (broad ICP filter, offer-led, no proof gate) as a deliberate net-new play. Once the seed sets exist, launch the **rest** of `/social-proof-bank` (full trigger bank, one-liners) alongside `/tam-build` — that remainder depends only on the locked offer + confirmed segments + `data-point-catalog.md`, NOT the TAM, so do **not** park it behind this step's sample→full **GO gate** (which governs TAM scaling only).

After `/data-point-discovery` (and after `/social-proof-bank`'s seed portion) and before campaign strategy, invoke `/tam-build`. **It builds one group-TAM per case-study group.** Its default discovery motion is a **seeded lookalike expansion from that group's case-study companies (the PROVEN motion)**; a broad ICP filter is the **EXPANSION motion** for net-new segments or a no-proof new offer; **the contact and company database named in the stack contract is the enrichment layer, not the discovery spine** (Case-Study-Anchored Discovery HARD RULE). Reading `data-point-catalog.md`, it builds the addressable company universe **up front, cheaply, at the company level** — the stable core (identity + firmographics) plus the `collect_now` extension columns the ranked catalog selected (sales-motion CTAs, pricing, org-structure depth, running ads, proof / case studies, tech, hiring). Critically it does this in two passes — **qualify then enrich.** Layer 1a attaches cheap firmographics + one homepage crawl across the whole TAM and scores ICP fit (`fit_status` = good/maybe/bad) with an `/icp-prompt-builder` prompt; the fit gate then drops clear bad-fit, and Layer 1b spends the expensive per-record/multi-page enrichment **only on good-fit survivors** (`enrichment_tier = enriched`). Gated-out companies stay in the file, not deleted. It writes:

```text
profiles/<business-slug>/tam/tam.csv
```

This is **Layer 1 only**: discovery + web fetch (WebFetch) + company-database signals + normalization by Claude Code sub-agents (no AI API). It does **not** reveal or verify per-contact emails — that per-credit work is deferred to the live slice in `/email-waterfall`. One `tam.csv` covers all confirmed segments and case-study groups via `segment`, `group`, and `discovery_motion` columns (`proven` = seeded lookalike, `expansion` = broad filter).

**Offer-fit is a HARD survival gate, not just an ICP call.** Because the offer is locked before the TAM is built, `fit_status` is judged against the locked offer as well as the ICP. The gate question is: can this business actually use, stock, deploy, or buy the thing the offer delivers? A company that cannot resolves to `fit_status: bad` and is dropped before Layer 1b enrichment spend, staying in the file rather than being deleted, consistent with the existing gated-out convention. An offer-derived disqualifier list is built at offer lock and applied in the free pre-screen before any paid classification. `/tam-build` owns the exact mechanics, including the NAME+DOMAIN-only matching discipline for auto-DQ.

**Mandatory reporting guard on that gate.** A hard gate can silently starve a launch slice, so after it runs `/tam-build` must report, per segment and per group: companies in, companies dropped by ICP fit, companies dropped by offer fit, survivors. **If any slice falls below the ≥500-company launch floor, that must be flagged loudly at the TOP of the report, naming the offer-fit gate as the cause**, with the option to relax the offer-fit criterion or widen the segment. Never let a slice starve quietly. This is verify-before-done applied to the gate, so do not accept a TAM result that reports survivors without those drop counts.

Spend gate: `/tam-build` runs `/api-cost-governance` first and respects `run_state.spend_ceiling_usd`; collection is **complete, not tiered** — every obtainable `collect_now` signal across the qualified TAM up front (Collection Completeness HARD RULE in `/data-point-discovery`), with `in_reserve` only the narrow exception; if full collection would exceed the ceiling, `/tam-build` surfaces it and recommends raising the ceiling rather than silently dropping signals. If `data-point-catalog.md` is missing, route back to Step 3.3 (`/data-point-discovery`) before building. That gate sits after the offer lock, so it never sends a client back into offer work that is already done.

**Two phases + a GO gate (TAM-First Sequencing HARD RULE — see `/tam-build`).** `/tam-build` first builds a bounded **sample**, validates the fit-rate + data-point collectability, sets `run_state.status.tam_stage: sample_built`, and holds at the GO gate. That gate **auto-approves the full build under `auto_execute` when the previewed enrichment cost is within `run_state.spend_ceiling_usd` and no slice-first launch is on record, and otherwise stops for the operator's explicit "build the full TAM"** (`/tam-build` owns the exact rule). On the go (auto-approved or explicit), it discovers the **full qualified universe**, qualifies cheap, and enriches all survivors with the `collect_now` data points — **either** Seat A automated **or** the operator's external-workspace round-trip (export → operator completes data points → returns the enriched CSV, which is ingested as source of truth; this is a blocking wait). Only when the full survivor set is enriched does it set `run_state.status.tam_stage: full_enriched`. **Do not advance to Step 4 until `tam_stage == full_enriched`** — a `sample_built` TAM blocks campaign work.

### Step 3.5: Build the Social Proof + Trigger Bank

After the offer is locked and `/data-point-discovery` has written `data-point-catalog.md`, invoke `/social-proof-bank`. It builds the client's copy-ready **Social Proof + Trigger Bank** — two banks in one artifact: (1) the client's real case studies mapped one row per **ICP segment × service line** (hard result, timeframe, referenceable client, a copy-ready one-liner, and a `poke_the_bear` pain line used only in the labeled two-line test arm, never as the default opener), and (2) a categorized **Trigger & Angle bank** of why-now signals (each with why it works, a `poke_the_bear` test-arm line, relevant ICPs, and priority). It writes:

```text
profiles/<business-slug>/social-proof-bank.md
```

It **self-gathers first** — from the intake `proof:` block + `icp.triggers`, `onboarding-call-notes.md`, `offer-intelligence.md`, the client's own case-study/website scrape, and any voicenotes — and only routes the genuine **raw-fact** gaps to the client, once, through `/proof-asset-request` (bank mode). The client is never asked for copy: the skill synthesizes every one-liner and `poke_the_bear` test-arm line and runs each through the Copy QA Gate (`spam-word-checker.md` + `cold-email-copy-best-practices.md`). Its data-backed trigger rows reuse `/data-point-discovery`'s exact canonical column names, so it feeds — never forks — `/campaign-strategy`'s Signal-Driven Slice Library and `/campaign-copywriting`'s Signal Angle Library.

**Runs in parallel with Step 3.4.** It needs the locked offer + the confirmed segments (Step 2.5) + `data-point-catalog.md`, NOT the enriched TAM — so under `auto_execute` launch it alongside `/tam-build` rather than after it (parallelize-by-default). It is a **soft gate**: it does not block campaign work, and a still-pending client fact-request does not hold it open (the bank is usable now and upgrades when facts return). The hard enforcement stays the copy-time Proof-Asset Gate in `/campaign-copywriting`, which this pre-loads. On completion set `run_state.status.proof_bank_stage: complete`. Discovery/synthesis only: no per-record spend, and the copy synthesis runs in the Claude Code session (no AI API call).

### Step 3.6: Score the company and contact TAMs

After `tam_stage = full_enriched`, invoke `/lead-scoring`. It inspects the real TAM headers and distributions, the locked offer, ICP, segment definitions, and data-point catalog. It writes the client-and-offer rubric plus `tam/tam.scored.csv`, `tam/contacts.scored.csv`, and `tam/lead-scoring-report.md`.

The score orders the full marketable list from P1 through P5. It does not delete adjacent or low-score buyers. Only explicit exclusions are ineligible. Set `run_state.status.scoring_stage: complete` only when every marketable contact has a score, priority tier, confidence, and reason, and every excluded row has an exclusion reason.

### Step 4: Generate campaign strategy

**Gate (HARD RULE):** do not invoke `/campaign-strategy` until `run_state.status.tam_stage == full_enriched` and `run_state.status.scoring_stage == complete`. If the TAM is `sample_built`, return to Step 3.4. If scoring is incomplete, return to Step 3.6.

Invoke `/campaign-strategy`. It reads `tam/tam.scored.csv` and `tam/contacts.scored.csv` plus the profile, the data-point catalog and the market source landscape it records, the website, and case studies. It proposes campaigns per data point, reports each slice's score distribution, and orders contacts by score without deleting P3, P4, or P5 rows.

```text
profiles/<business-slug>/campaign-strategy.md
```

### Step 5: Synthesize campaign-plan.md

Pull from the artifacts above and write:

```text
profiles/<business-slug>/campaign-plan.md
```

When `data-point-catalog.md` and `offer-intelligence.md` both exist (Step 3.3 always writes the first, and either offer path writes the second), include this per-segment offer summary before the infrastructure section:

```markdown
## Per-Segment Offer Summary
| ICP Segment | Top Source Signal | Open Archetypes | Chosen Lead Magnet | Archetype |
|-------------|-------------------|-----------------|-------------------|-----------|
| [Segment 1] | [signal]          | [e.g. G, F, C]  | [magnet name]     | [letter]  |
| [Segment 2] | [signal]          | [open letters]  | [magnet name]     | [letter]  |
```

Replace "Top 3 Recommended Campaigns" with a per-segment table:

```markdown
## Top Campaign Per Segment
| ICP Segment | Campaign Name | Offer Archetype | Why |
|-------------|---------------|-----------------|-----|
| [Segment 1] | [campaign]    | [letter]        | [one-line rationale] |
| [Segment 2] | [campaign]    | [letter]        | [one-line rationale] |
| All         | [broad campaign] | [letter]     | [one-line rationale] |

Full strategy: profiles/<business-slug>/campaign-strategy.md
```

When `tam/tam.csv` exists, also include the **maximal first-launch wave** from `/campaign-strategy` — every viable, non-overlapping proven-signal `[FL]` slice proposed for simultaneous launch. The wave maximizes proven-signal campaigns and is uncapped (not a fixed top-N); the final capacity trim is applied at Step 6, where the warmed-mailbox count is known.

If either artifact is genuinely missing (an older profile that never ran Step 3.3 data-point discovery, or a run where offer intelligence was skipped), use the original "Top 3 Recommended Campaigns" list format instead, and note which artifact was absent.

Include this exact infrastructure section:

```markdown
## Infrastructure Readiness
Based on kickoff answers:
- [ ] Infrastructure path: <registrar + mailbox provider, from the stack contract>
- [ ] Registrar: <from stack contract>
- [ ] Mailbox provider: <from stack contract>
- [ ] Sending platform: <from stack contract>
- [ ] Self-hosted instance URL, if the locked platform needs one: <url/not applicable/missing>
- [ ] Sender readiness verification: <verified by selected platform manager/not verified yet/blocked>
- [ ] Lead-source access required by lead-source-plan: <not selected yet/ready/blocked>
- [ ] Email verification tool: <chosen tool/not selected yet>
- [ ] Mailbox mix strategy: <Google % / Microsoft %, rationale, or missing - run /mailbox-mix-strategy before setup>
- [ ] Daily send target + sized fleet: <emails/day target (high-volume default 2,000-30,000/day per client), the total warmed mailboxes it implies, recurring ~$3/mailbox/mo spend, and warmup runway - or missing, run /mailbox-mix-strategy Fleet Sizing>

## Run State
<paste run_state YAML>

## Next Steps
<branded by run_state; see Step 6>
```

### Step 6: Provider-locked next-skill menu

Branch on infrastructure readiness, but route from `run_state`.

#### Step 6.0: Infrastructure readiness gate (operator directive, 2026-09-18)

Before showing the menu below, read `infrastructure.infrastructure_stack` in
`<outbound>/stack-contract.yaml`. If its notes carry a `DEFERRED` marker or an
unresolved fork, do NOT route to any domain or mailbox setup skill. Ask the
operator once, plainly:

> Email infrastructure is still deferred at the FNNL contract level. The
> registrar-versus-mailbox-provider domain-purchase fork was never resolved,
> and no infrastructure has been provisioned through this system yet. Before
> this client's setup: is the sending infrastructure already handled, either
> bought elsewhere or an existing pool we can point at, or does it still need
> building?

Route on the answer:

- **Already handled elsewhere.** Record it in `run_state.status` as unverified,
  operator-supplied context. Skip the setup branch and continue to the lead
  source and list work, which is not blocked by this. Verify real sender health
  later through the locked platform's manager before any upload, never on the
  operator's word alone.
- **Still needs building.** The fork has to close first. Stop and route to
  `/stack-setup` to resolve `infrastructure_stack`. Buying domains on an
  unresolved pairing is the expensive mistake this gate exists to prevent.
- **Not sure.** Treat it as "still needs building".

This gate is a deliberate, narrow exception to the "do not ask whether domains
are purchased or inboxes are warmed during kickoff" rule in Step 1. That rule
assumes a settled infrastructure path. FNNL does not have one yet, so the
question is a contract-level blocker rather than an intake question.

**Remove this gate** once `infrastructure_stack` is resolved in the contract and
at least one client's infrastructure has been provisioned through the system.

**If `run_state.status.setup_stage` is not complete or sender readiness has not been verified:**

```text
Your next step is provisioning or verifying the selected domain + inbox setup. Real sending stays blocked until the selected platform manager verifies healthy warmed senders.

A. [Recommended] Start the selected domain + inbox setup now
B. Verify existing senders through the selected platform manager
C. Save the plan and build the lead source plan/list first
D. Custom answer
```

If A, invoke exactly one setup skill from this routing table:

Before invoking the setup skill, check `run_state.mailbox_mix_strategy`.

- If it exists, show the saved Google Workspace / Microsoft 365 mix and continue.
- If it is missing, invoke `/mailbox-mix-strategy` first and save the result in `run_state.mailbox_mix_strategy`.
- If setup was started without enough ICP context to make even a headcount-based guess, `/mailbox-mix-strategy` must ask the direct-start question with a recommended guess, balanced default, and manual override.

**High-volume default sizes the fleet (surface the spend + warmup runway before buying).** Under the high-volume default (operator directive 2026-07-07), the client's daily send target (2,000 to 30,000 emails/day per client, spread across a few big campaigns of 1,000 up to 20,000 leads each) DRIVES how many warmed mailboxes to buy, not the reverse. `/mailbox-mix-strategy` now sizes that fleet (daily target / ~15-20 safe sends per mailbox per day / ~0.5 active-rotation fraction) before it splits Google vs Microsoft within it. That fleet size is a real recurring-spend and warmup-runway decision, not a config flip: roughly ~200 mailboxes (~$600/mo) for 2,000/day, up to ~3,000-4,000 mailboxes (~$9,000-12,000/mo) for 30,000/day, plus weeks of warmup before the fleet can send at target. Surface the sized fleet, its ~$3/mailbox/mo recurring cost, and the warmup runway to the operator BEFORE any mailbox purchase, and default to the low end (~2,000/day), ratcheting up as warmup graduates and the offer proves. Details: `/mailbox-mix-strategy` Fleet Sizing and.

**Check the pre-warmed pool first.** Before provisioning fresh, invoke `/mailbox-pool-staging` to see whether a ready, isolation-clean Stage-1 group already exists for this client's market. If one does, assign it and skip the ~3-week buy-and-warm wait (launch in days, not six weeks). Only provision fresh through the setup skill below if the pool can't serve them.

Do not spend money or run domain availability checks until the mailbox mix strategy is saved or explicitly chosen.

**Credential recheck (before any purchase):** Confirm the Credential Preflight (Step 2.6) passed for the locked path — `profiles/<business-slug>/preflight-credentials.json` shows `"verdict": "PASS"`. If it was never run or shows FAIL, run `/preflight-credentials` and resolve any missing REQUIRED key before spending. (Presence/shape only — `/api-cost-governance` still owns the balance/spend check below.)

**Headshot image key (the one AI exception, asked for here and not before).** Choosing A above is the operator starting cold-email infrastructure setup, so this is the first point the sender-headshot key may be requested: OpenAI, headshots only, used by `/mailbox-profile-generator` (no-AI-API rule, operator directive 2026-09-22). If the persona will get a generated headshot and the key is not yet in `scripts/.env`, ask the operator to add it there (never in chat). It is not part of the Step 2.6 preflight, and it is not needed when the persona is a real person with a real photo.

**Spend gate (before any purchase):** Mailbox infrastructure is outside the standing $100 client budget in `run_state.spend_ceiling_usd`, because that budget covers paid data steps only (operator directive 2026-09-22). So before the first domain or mailbox purchase, show the setup's total (one-time domain cost plus the recurring monthly mailbox cost) and get the operator's approval of that total once. Then auto-approve EVERY purchase whose running total stays inside the approved figure and report each ("Spent $X of $Y approved"). Do NOT re-confirm per purchase; only stop if a purchase would push the running total over it.

Invoke the one domain + inbox setup skill the stack contract names for the locked `registrar` + `mailbox_provider` pairing. If the contract names no setup skill for that pairing, or the skill it names is not present in `.claude/skills/`, STOP and report that gap instead of substituting another provider's setup skill.

Do not show other setup skills as choices. The stack contract already fixed the pairing.

If `run_state.registrar` and `run_state.mailbox_provider` form a pairing the stack contract does not declare valid, stop. That stack is invalid. Ask with a native choice prompt built from the contract's valid pairings, closest one first:

```text
<registrar> cannot be paired with <mailbox provider> under the stack contract: <the contract's stated reason>. Which valid pairing should I use?

A. [Recommended] <closest valid pairing from the contract>
B. <next valid pairing from the contract>
C. Re-run /stack-setup to change the contract
D. Custom answer
```

After setup completes, branch by `run_state.sending_platform` and `run_state.mailbox_provider`:

- If the stack contract names an inbox-manager skill for the locked sending platform, invoke it and run its import-and-start-warmup workflow for mailboxes provisioned by the locked mailbox provider.
- If it names none, or the skill it names is not present in `.claude/skills/`, stop after provisioning and use that platform's own import and warmup workflow. Invoke `/cold-email-inbox-tracker` only after the user confirms import and warmup in that platform. Never silently switch to a different sending platform.

Where an inbox-manager skill exists, it invokes `/cold-email-inbox-tracker` after import/connection, warmup, signatures, and insurance tagging are complete.

Then set:

```yaml
run_state.status.setup_stage: complete
run_state.status.warmup_stage: warming
```

Remind the user that real sending remains blocked until sender readiness is verified by the locked platform manager.

**If infrastructure is ready:**

If no launch campaign has been selected, apply `run_state.execution_mode` (`auto_execute` is the recommended default for this operator, per operator directive):

**When `tam/tam.scored.csv` exists, select a first-launch WAVE, not a single campaign.** `/campaign-strategy` proposes the maximal wave, every proven, non-overlapping signal slice that clears the **≥500-company signal floor**. Apply the capacity trim here. Reveal and verify P1 first, then move through P2 to P5 as capacity opens. Lower tiers stay queued. Dedup every wave campaign against the others and the suppression registry so no company is double-contacted.

- `auto_execute`: when a TAM exists, select the **maximal first-launch wave** (every viable proven-signal slice, capacity-trimmed). Report: "Auto-selected first-launch wave (N of M viable campaigns): [names]. Reason: [one line each]." Without a TAM, select the single top-recommended campaign from `profiles/<business-slug>/campaign-strategy.md`. Proceed to `/lead-source-strategy` Lead Source Plan Mode for each selected campaign without pausing.
- `review_gates`: when a TAM exists, present the **maximal wave** (every viable proven-signal slice) with each campaign's coverage, row counts, and rationale; the operator may launch the whole wave or a subset. Without a TAM, ask the user to pick one campaign using a native choice prompt:

```text
Which campaign should become the launch campaign?

A. [Recommended] <best campaign from campaign-strategy.md>
B. <second-best campaign>
C. <third-best campaign>
D. Custom answer
```

Then invoke `/lead-source-strategy` in **Lead Source Plan Mode** before any list builder or scraper. It writes:

```text
profiles/<business-slug>/campaigns/<campaign-slug>/lead-source-plan.md
```

Before source collection, run `/campaign-approval-brief` when the client needs to review or approve the campaign path. This is the last cheap gate for changing ICP, offer, source signal, or launch campaign before list build and enrichment spend. If `run_state.campaign_approval_brief_needed` is set (from the intake form), honor it: `yes` always runs the brief, `no` skips it. When the field is absent, fall back to the judgment call above.

Choose the source workflow from the source plan, not from tool comfort. The source plan must use `/lead-list-tech-stack-research`, the selected campaign's source options, location fit, and data availability risk before picking the final build path. Default to the list workbench (`run_state.list_workbench`) as the workflow layer, so the operator watches the list fill live instead of receiving a blind CSV. The session does the combining, scoring, and dedupe with FNNL's own keyed tools and pushes finished rows into the workbench table through its inbound webhook, never spending the workbench's own credits (zero-workbench-credit HARD RULE, CLAUDE.md section 7). If no workbench is locked, or the client's table and webhook are not set up yet, fall back to Claude Code native (the session builds the CSV directly) and say so in the source plan. Either way the CSV the downstream skills read is an export of the working list. Another operator path wins only when it is stronger:

| Source signal | Likely source workflow |
|---|---|
| Title + industry only | A contact-database export, only when the person database is the real signal |
| Lookalike accounts | A lookalike / similar-company tool first for similarity; a category-or-revenue database only when that is the signal; Claude's built-in WebSearch/WebFetch for public-web similarity; then contact enrichment |
| Local SMBs | A maps or local-business source (maps scraper, places API, or equivalent) |
| Named accounts or known domains | Domain-to-person enrichment |
| Competitor or thought-leader engagement | An approved social-engagement or social-intent source |
| Niche directory, association, marketplace, event, job board, or custom website pattern | Claude's built-in WebSearch/WebFetch (fanned out across sub-agents for volume), or a custom scrape workflow, with the list workbench as the workflow layer (Claude Code native if no workbench table is ready) |

Every tool the source plan names must be one the stack contract declares; if the fitting capability slot is empty, stop and route to `/stack-setup` rather than reaching for a familiar vendor. A source is allowed only when its data actually fits the campaign signal and target geography, and contact enrichment is not the same thing as source selection.

After source collection, the locked sequence is:

1. `/icp-prompt-builder`
2. `/lead-scoring` for an external list, or score-version validation against `contacts.scored.csv` for a TAM slice
3. `/email-waterfall`
4. `/list-quality-scorecard`
5. `/campaign-copywriting`
6. Platform spintax from `run_state.sending_platform`
7. **Pre-launch gates (all must pass before upload)**, see below
8. Platform upload from `run_state.sending_platform`

Do not move past `/campaign-copywriting` unless Email 1 passes `outreach-copy-framework.md`, all copy passes `spam-word-checker.md` and `cold-email-copy-best-practices.md`, and the confirmed-deliverable CTA gate passes. Spintax and upload must stop and route back to `/campaign-copywriting` if they find failed copy.

### Pre-launch gates (locked sequence: after spintax, before platform upload)

Before invoking the platform upload skill, enforce these three gates in order. Each is binary pass/fail. On any fail, STOP and route to the fix — do not upload, and never start real sending.

**Gate A — Warmup readiness.** Real sending stays blocked until senders are actually warmed. Confirm through the locked platform manager (the inbox-manager skill the stack contract names for `run_state.sending_platform`) that the senders intended for this campaign are warmed at least 2 weeks, not warmup-blocked, and tagged usable (`active`, or `insurance` being promoted). If `run_state.status.warmup_stage` is not `complete` or the manager cannot verify warmed senders, STOP with exactly what is missing. Uploading to a draft is allowed during warmup; **starting/sending is not**.

**Gate B — Pre-launch deliverability / placement.** Before first real send, run a seed / inbox-placement check on the warmed senders (a seed-list placement test, or the locked platform's native placement check). Confirm SPF/DKIM/DMARC pass for each sending domain. If placement is poor or auth fails, STOP and route to `/email-deliverability-audit` (diagnose) → `/deliverability-incident-response` (fix). Do not present placement as proven if no test was actually run — state the gap.

**Gate C — Final QA checklist.** Immediately before upload, confirm: copy passed the copy-QA gate (spam-word-checker + best-practices + confirmed-CTA); spintax renders as natural complete sentences with no banned tokens; lead list passed `/list-quality-scorecard` at grade B or higher; sender assignment count and tags are correct; and 2024+ bulk-sender compliance holds (one-click List-Unsubscribe header, authenticated domain, target spam-complaint rate under 0.3%, bounce under 2-3%). If any item fails, STOP and route to the owning skill.

Only when Gates A, B, and C all pass, proceed to the platform upload skill. Upload still creates a PAUSED draft — the user starts it manually.

Platform handoff: run the spintax, campaign-upload, reply-agent, and reply-scoring skills the stack contract names for the locked `run_state.sending_platform`, and only those. Where the contract names no skill for one of those steps, use that platform's own native workflow (variation, upload, reply AI, reply reporting) and say which step ran natively. Never mix in a step from another platform's toolchain.

**Reply agents** run once the draft campaigns exist (drafted is fine, the agents wait for replies): deploy the per-client reply-agent pack on the locked platform so every inbound reply gets an instant, on-brand response (target under 5 minutes). This is part of standard setup for every new client and every new campaign, not an optional extra.

### Step 7: Offer to open the plan

Print the `campaign-plan.md` path.

## Safeguards

- Do not re-run `/icp-onboarding` blindly. If a profile exists, ask before overwriting.
- Do not override `run_state`. The saved registrar, mailbox provider, and sending platform control the rest of the run.
- Do not auto-invoke infrastructure setup skills. They spend real money. Confirm the selected stack and purchase approval first.
- Do not run infrastructure setup without `run_state.mailbox_mix_strategy`. If missing, run `/mailbox-mix-strategy` before any availability check, domain purchase, inbox purchase, provider setup, or spend approval.
- Do not suggest off-path provider skills. Any skill belonging to a provider other than the locked `sending_platform`, `mailbox_provider`, or `registrar` is off-path, and a registrar + mailbox-provider pairing the stack contract does not declare valid is not an infrastructure stack.
- Do not ask for warmup status during intake. Do verify sender readiness before upload through the selected platform manager, and block launch if that verification is missing.
- If a selected provider path is impossible, explain the blocker and ask the user before changing providers.

## What to do next

Follow the Step 6 branch that matches `run_state`. This skill hands off cleanly to the next provider-locked skill.

## Related skills

- `/autonomous-execution-policy` - cross-cutting policy this skill defers to; governs when to proceed vs stop, the standing spend budget, the no-re-ask rule, the hard-stop list, and the don't-idle-wait rule under `execution_mode = auto_execute`
- `/client-intake-form` - run before kickoff to pre-populate all static answers and set execution_mode; when found, kickoff skips all intake questions
- `/icp-onboarding` - invoked in Step 2 (skipped when icp.source = intake_form)
- `/lead-source-strategy` - single-mode. Invoked in Lead Source Plan Mode at Step 6, after campaign selection and before any list builder, scraper, database pull, or enrichment spend
- `/offer-intelligence` - invoked in discovery mode at Step 3A as the first offer step (buyer pain first), or in validation mode for evidence-backed existing offers
- `/lead-magnet-brainstorm` - invoked only for new offers or validated replacement options
- `/campaign-strategy` - invoked in Step 4 (reads the TAM and proposes campaigns per data point)
- `/lead-scoring` - invoked in Step 3.6 to build the governed P1 through P5 queue before campaign selection or email spend
- `/data-point-discovery` - invoked in Step 3.3 to catalog the data points (`data-point-catalog.md`, the contract the TAM collects against) before `/tam-build`
- `/social-proof-bank` - invoked in Step 3.5 to build the client's copy-ready Social Proof + Trigger Bank (`social-proof-bank.md`); self-gathers first, asks the client (via `/proof-asset-request` bank mode) only for genuine raw-fact gaps; runs in parallel with `/tam-build`, feeds `/campaign-strategy` + `/campaign-copywriting`
- `/tam-build` - invoked in Step 3.4 to build the company-level TAM before campaign strategy
- `/lead-list-tech-stack-research` - tool-fit map used by `/lead-source-strategy` before selecting source, workflow, and enrichment layers
- `/campaign-approval-brief` - creates the client-facing approval brief after campaign selection and Lead Source Plan Mode, before list build when review is needed
- `/mailbox-mix-strategy` - required before mailbox infrastructure setup decides the Google Workspace / Microsoft 365 purchase mix
- `/mailbox-pool-staging` - check the pre-warmed pool for a ready group BEFORE provisioning fresh; owns the Stage 1→2→3 domain lifecycle + cross-client isolation
- `/stack-setup` - declares FNNL Agency's tool for each capability slot in `<outbound>/stack-contract.yaml`; run it before kickoff, and whenever a slot this run needs is still empty
- The domain + inbox setup skill named by the stack contract for the locked registrar + mailbox-provider pairing
- The inbox manager named by the stack contract for the locked sending platform
- The spintax and campaign-upload skills named by the stack contract for the locked sending platform
- The reply-agent setup skill for the locked sending platform; deploys the per-client reply-agent pack once the draft campaigns exist, so inbound replies get instant on-brand responses (under 5 min). Standard for every new client and every new campaign
- `/cold-email-inbox-tracker` - logs completed inbox setups after provider ACTIVE, sending-platform import, and warmup start
- The source-build skills for the tools the stack contract declares - selected only when `/lead-source-strategy` proves they match the campaign signal and target geography
`````
