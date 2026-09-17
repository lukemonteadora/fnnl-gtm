---
name: stack-setup
description: Define FNNL Agency's cold outbound tech stack and process, then wire the whole system to it. Interviews the operator capability by capability (registrar, mailbox provider, sending platform, company discovery, contact enrichment, email verification, AI routing, CRM, reporting, deliverables), writes the answers into outbound/stack-contract.yaml, activates any matching integration pack from _vendor-library/ into .claude/skills/, regenerates scripts/.env.example with only the credentials the chosen stack actually needs, and reports what is still missing. Also captures FNNL's own process overrides (onboarding steps, approval gates, reporting cadence, deliverable format). Run this FIRST, before onboarding any client. Triggers - "stack setup", "set up our stack", "what tools do we use", "wire up the stack", "configure the system", "/stack-setup". NOT for onboarding a client (that is /cold-email-kickoff), and NOT for resuming a client (/continue-client).
---

# Stack Setup (define FNNL Agency's tools and process, then wire the system to them)

This workspace ships with **no tech stack**. Every skill is written against a capability role ("the sending platform"), not a brand. This skill is what turns those roles into real tools.

Run it once when you learn FNNL's stack, and again whenever a tool changes.

## What this is NOT

- **Not `/cold-email-kickoff`.** That onboards a *client* into this workspace. It assumes the stack already exists. If the stack contract is empty, kickoff will send the operator here first.
- **Not `/preflight-credentials`.** That verifies keys already declared. This skill decides *which* keys are needed at all.
- **Not `/new-gtm-workspace`.** That forks the whole system for a different operating company.

## Path resolution

`stack-contract.yaml`, `scripts/...`, `profiles/...` resolve under `outbound/`, per the repo `CLAUDE.md` path rule. `_vendor-library/` resolves from the repo root.

## Material Decision Rule

Tool choice changes cost, list quality, and what the system can automate, so it is material. For each capability slot: name the realistic options, recommend one with a reason, say why the alternatives are weaker, then let the operator decide. Never pick a vendor silently. Use native Interactive Inputs where available (recommended option first, `Custom answer` last), per `/clarification-first`.

## The one rule that matters most

**Capability truth.** Never record a tool as `live`, and never tell the operator the system can drive it, until a real call against that tool has succeeded. A tool the operator *named* is `chosen`. A tool with a key in `.env` is still only `chosen`. It becomes `live` when something actually ran. Writing `live` on an untested tool is the single failure that makes this whole system untrustworthy downstream, because every later skill treats `live` as permission to proceed unattended.

---

## Step 0: Read the current contract

Read `stack-contract.yaml` and report the current state in one short table: slot, tool, status. If slots are already filled, this is an update run, so ask which slots the operator wants to revisit rather than re-interviewing everything.

If the file is missing, stop. Something stripped it; do not invent a replacement.

---

## Step 1: Establish what FNNL actually has

Before asking slot by slot, ask three framing questions. The answers often fill several slots at once and stop you asking about tools they will never buy.

1. **What is FNNL already paying for?** An existing subscription usually wins over a better tool nobody has bought.
2. **Who owns the accounts, FNNL or the client?** If sending happens inside the client's own platform, the integration, the data-handling rules, and the reporting path all change.
3. **What is the monthly budget for data and sending tools?** This decides whether the contact layer can afford a waterfall (several enrichment providers in sequence) or has to be a single provider.

Record the answers in `process_overrides.notes`.

---

## Step 2: Walk the capability slots

Go layer by layer, in this order. The order is deliberate: infrastructure decisions constrain the data decisions, and both constrain what the AI layer is asked to do.

### 2.1 Sending infrastructure

Ask about `registrar`, `mailbox_provider`, `sending_platform`.

Before locking `sending_platform`, confirm these three things with the operator, because each one silently removes a capability from the system if the answer is no:

| Confirm | If no |
|---|---|
| REST API for campaign create + lead upload | Campaign upload stays manual. Say so plainly; do not imply automation. |
| Spintax or equivalent variation support | The spintax step is skipped, and copy variation has to come from more variants instead. |
| Programmatic access to replies | Reply scoring and inbox triage cannot be automated. |

Then derive `infrastructure_stack` from the registrar plus mailbox provider pair.

`mailbox_mix_strategy` is a decision, not a tool. Route to `/mailbox-mix-strategy` and record the outcome.

### 2.2 Lead data

Ask about `company_discovery`, `contact_discovery`, `contact_enrichment`, `email_verification`, `intent_signals`.

Two rules to hold the line on here:

- **Keep the source-of-truth signal separate from the contact layer.** A tool that finds a person at a company is not the same as a tool that decides the company belongs on the list. If the operator names one tool for both, record it in both slots but note the overlap, because it usually means the targeting is weaker than it looks.
- **If more than one enrichment tool is named, write down the waterfall order** (which runs first, which only fills the gaps the first one left). Cheapest-first only saves money when the order is recorded and actually followed. Put the order in the `contact_enrichment.notes` field and mirror it into `/email-waterfall`.

For `email_verification`, ask explicitly whether the tool reports catch-all as its own signal, separate from valid and invalid. A verifier that collapses the two will quietly inflate bounce rate.

`intent_signals` is genuinely optional. If FNNL is not buying intent data, set it to `n/a` so downstream skills stop offering it as a path.

### 2.3 AI and research

Ask about `research_provider`, `bulk_classification`, `copywriting`, `image_generation`.

Push back if the operator wants one model for everything. The cheap model that can classify 40,000 companies is almost never the model you want writing final copy, and using the premium model for bulk classification is where TAM-scale costs run away. Recommend splitting at minimum between a cheap bulk slot and a quality copy slot, and say why.

Record the routing policy in `research_routing` and cross-check it against `/ai-model-routing`.

### 2.4 Web access

Ask about `search` and `crawl`. Both are usually cheap and both unblock research and signal detection, so if the operator has no preference, say that these are low-cost enablers and recommend filling them.

### 2.5 Operations

Ask about `crm`, `reporting_destination`, `document_generation`, `spreadsheet`.

For `document_generation`, note that the repo already ships working DOCX and PPTX builders under `scripts/`. Recommend keeping them unless FNNL has a real reason to move to another format, because they are already wired to the four client-facing presentation skills.

For `spreadsheet`, if `/mailbox-pool-staging` will be used, the operator must create the two sheets and replace `<FNNL_MAILBOX_POOL_SHEET_ID>` and `<FNNL_MAILBOX_TRACKER_SHEET_ID>`.

---

## Step 3: Capture FNNL's own process

The system ships with a default cold outbound process. Where FNNL works differently, FNNL wins. Ask about each `process_overrides` key:

- `client_onboarding_steps`: FNNL's own onboarding sequence, if it differs from `/cold-email-kickoff`.
- `approval_gates`: what a client must sign off on, and at which point. This is the one most likely to differ between agencies, and getting it wrong is client-visible.
- `campaign_naming_convention`: so campaigns stay findable across clients and platforms.
- `reporting_cadence`: how often clients get reporting, and in what format.
- `deliverable_format`: what FNNL actually hands a client at each stage.
- `copy_review_policy`: who reviews copy before it goes live, and whether that is a hard gate.

**Leave a key null if the operator does not know yet.** Null means "use the built-in default", which is documented and safe. An invented process is worse than no override, because later skills will enforce it as though FNNL had asked for it.

---

## Step 4: Write the contract

Update `stack-contract.yaml`:

- Set `tool` and `status` on each answered slot. Use `chosen`, not `live`, unless a real call has already succeeded.
- Fill `credentials` with the environment variable **names** each tool needs. Names and placeholders only, never real key values.
- Set `meta.last_reviewed` to today.
- Leave `meta.stack_locked: false` until every required slot is `live`.

Read the file back after writing and confirm the slots you intended to change actually changed. Do not report this step done on the strength of the write call returning without error.

---

## Step 5: Activate matching vendor packs

`_vendor-library/` holds complete, previously-working integrations that are **not loaded** by default. Nothing in there runs until it is activated, which is what keeps this workspace genuinely stack-free.

Read `_vendor-library/README.md` for the current inventory. For each chosen tool that matches an available pack:

1. Confirm with the operator that they want it activated.
2. Move the pack's skills from `_vendor-library/skills/<vendor>/<skill>` to `.claude/skills/<skill>`.
3. Move the pack's scripts from `_vendor-library/scripts/<vendor>/` into `outbound/scripts/`.
4. Record the pack name in that slot's `vendor_pack` field.
5. **Review the activated pack before trusting it.** These packs came from a different company's workspace. Search the activated files for placeholder IDs (`<...>` style) and for any account-specific assumption, and fix what you find. An activated pack is a working scaffold, not a verified integration.

If a chosen tool has **no** matching pack, say so plainly and record it as a capability gap in Step 7. Do not imply the system can drive a tool it has no integration for.

---

## Step 6: Regenerate the credential surface

1. Rewrite `scripts/.env.example` so it lists exactly the credential names the chosen stack needs, and nothing else. Names and placeholders only.
2. Update `scripts/credential-registry.json` to match, so `/preflight-credentials` scopes its checks to the real stack.
3. Tell the operator to put real values in `scripts/.env`, which is gitignored and must never be committed.
4. Run `/preflight-credentials` and report which keys resolve and which are still missing.

Never ask the operator to paste a key into the chat, and never write a real key value into any tracked file.

---

## Step 7: Report

Give the operator a short, scannable report:

1. **The stack**, one line per filled slot: capability, tool, status.
2. **Still empty**, listing each unfilled slot and what it blocks. Be concrete: "no email verification chosen, so bounce risk is unmanaged and `/list-quality-scorecard` cannot gate on deliverability."
3. **Activated packs**, and which chosen tools have no pack (the capability gaps).
4. **Credentials**, which resolve and which are missing.
5. **Process overrides captured**, and which were left at the built-in default.
6. **The next step**, which is normally `/cold-email-kickoff` for the first client, but only once the infrastructure and lead-data slots are filled.

State plainly whether the stack is ready to run a real client, and if it is not, say exactly what is missing. A half-filled contract that gets reported as ready is how a campaign launches on a tool nobody credentialed.

---

## Safety

- Never authenticate, pay, purchase, or accept an OAuth grant on the operator's behalf. Account signup and login are theirs to do.
- Never write a real API key into a tracked file. `.env` only, and `.env` is gitignored.
- Activating a vendor pack is reversible (it is a move). Buying a tool is not, so anything that costs money is the operator's call and gets confirmed first.
- If the operator names a tool you do not recognize, say so and ask how it is accessed (REST API, MCP connector, browser only). Do not assume an integration exists.
