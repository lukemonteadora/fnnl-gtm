---
name: preflight-credentials
description: Fast pass/fail check that the API keys the locked run_state path needs are present and well-formed, before any spend. Called in Phase 1 (/phase-1-onboarding, kickoff scope). Use for "verify my keys", "check my credentials", "are my API keys set", "preflight credentials". Not a run entry point.
---

# Credential Preflight (helper / gate)

**From the former description:** It checks only the keys the locked path needs (registrar, mailbox_provider, sending_platform, plus warn-level email_verification and lead-data slot keys). It never asks for or flags an AI key (no-AI-API rule, 2026-09-22); the one exception, the headshot image key, is requested only at infrastructure setup. Which tool fills each capability slot comes from the workspace stack contract, never from a default. Also run it before kicking off infrastructure or research for a client. It is a HELPER/GATE that `/cold-email-kickoff` reaches through `/phase-1-onboarding`, not a run entry point or orchestrator.

A thin wrapper around `scripts/preflight-credentials.mjs`. It answers one question: **are the API keys the locked `run_state` path needs present and well-formed?** It does not orchestrate a run, choose providers, spend money, or replace `/cold-email-kickoff`.

> This is subordinate to `/cold-email-kickoff`. Phase 1 invokes this exact check at kickoff scope (`/phase-1-onboarding`, after the stack slots are read into `run_state`, before any spend; `phase-protocol.md`); Phase 4 re-runs it at `launch` scope before the paused drafts (`/phase-4-copy-launch`), and an infrastructure run uses `infra` scope before any purchase. Run it standalone only to spot-check keys; to actually start a client, use `/cold-email-kickoff`.

## Scope & boundaries

- **Presence + shape only.** Is the key there and well-formed (length, no placeholder, expected prefix where known)? It never checks balance. `/api-cost-governance` owns balance and spend, and `/tool-balance-guard` checks each paid tool's balance before a phase's first paid step.
- **A warn is not a licence to skip or substitute at run time (`/tool-balance-guard`, operator decision 2026-09-28).** Warn-level keys stay warn so a missing key never blocks onboarding or a step that does not use the tool. But a tool that is out of balance or down at the step that uses it, including a missing key, stops that step and asks the operator. It is never skipped and another tool is never substituted for it (this overrides the older "finder down, enricher becomes finder" exception); a skip needs the operator's approval, recorded with `--operator-approved-skip`.
- **Scoped to the locked path.** Only the keys the chosen `registrar` + `mailbox_provider` + `sending_platform` need are REQUIRED. `email_verification` and the lead-data slots (`company_discovery`, `contact_discovery`, `contact_enrichment`, `intent_signals`) are WARN-level. Which tool actually fills each slot, and therefore which variable gets checked, is whatever that slot is locked to for this client, sourced from the workspace stack contract at `outbound/stack-contract.yaml` crossed with the locked `run_state`. There is no default, and nothing in this file declares a stack. If a slot the locked path needs is unset, stop and route the operator to `/stack-setup` rather than substituting a vendor.
- **No AI key is checked, required or warned on (no-AI-API rule, operator directive 2026-09-22).** The only AI is Claude Code itself (the session, its sub-agents, the `/deep-research` harness, and its built-in WebSearch/WebFetch), which needs no key. So the retired slots `research_provider`, `bulk_classification`, `copywriting` and the third-party web `search` / `crawl` slots are never checked, and the registry no longer carries entries for them. **The one exception, `image_generation` (OpenAI, headshots only, asked for at infrastructure setup), is "not needed yet" here:** its key is requested only when `/mailbox-profile-generator` runs or the operator says to start setting up cold-email infrastructure, never at onboarding, intake, kickoff, preflight, stack setup or workspace creation. The registry marks it `on-demand` with a trigger this gate never selects, so it cannot show up as missing.
- **Research routing needs no key.** `run_state.research_routing` has one value, `claude_deep_research` (the Claude native `/deep-research` harness); the old `third_party_ai` and `claude_native` values are retired, and nothing in the registry is elevated to REQUIRED by routing any more. (Known code gap: the script's one-line `research` summary still names a retired third-party provider, and still says REQUIRED if a profile carries the retired `third_party_ai` value. Ignore that line: no such key is in the registry, so nothing is actually checked or blocked. A code fix is pending.)
- **WARN-level ≠ "optional extra."** A warn means that slot degrades gracefully to a documented fallback, not that the slot is skippable. If a slot this run actually uses is unset in the stack contract, or filled but unkeyed, fill it for a full-quality run rather than shrugging it off. Tools that authenticate as MCP connectors (set up in Claude → Connectors) have no `.env` key at all, so they surface as a connector check rather than a key check. Irrelevant providers are never listed.
- **A PASS is not proof the stack works.** Presence and shape are strictly weaker than a successful call. A slot recorded as `chosen` in the stack contract has only been named; only `live` means a real call against FNNL's own account has succeeded. Exit 0 means the keys resolve, not that the tools run.
- **Secret hygiene.** Prints only `✓ present` / `✗ MISSING` / `⚠ malformed` or a masked last-4 tail. Never prints, logs, or writes a full key value.
- **Inside `coldoutbound-gotchas` hard boundaries.** Read-only: no passwords, no account creation, no cards.

## Run it

```
node "<outbound>/scripts/preflight-credentials.mjs" [--profile <slug>] [--scope kickoff|infra|launch|full] [--validate]
```

- `--profile <slug>`: check this client's `profiles/<slug>/client-profile.yaml`. If omitted, it picks the most-recently-modified profile that has a `run_state` block (or tells you how to pass one).
- `--scope`: which step the check is for (operator decision 2026-09-22). `kickoff` (the default): infrastructure and sending-platform keys only warn, and an empty or `deferred` registrar or mailbox slot is allowed, so offer research, lists and copy are never blocked. `infra`: before an infrastructure purchase, the registrar and mailbox slots and keys are required. `launch`: before sender verification and draft upload, the sending-platform slot and keys are required. `full`: every key the registry marks `fail` is required (the old behaviour).
- `--validate`: optional live ping, **off by default**. Only pings where a free endpoint exists for the configured provider; everything else stays presence+shape. Default mode makes zero API calls.

It reads `scripts/credential-registry.json` (the single source of truth, mirrored from `/api-cost-governance`) × the locked `run_state`, prints a Required / Optional summary, and writes `profiles/<slug>/preflight-credentials.json`.

## Reading the result

- **Exit 0, PASS.** All REQUIRED keys present and well-formed. Safe to proceed. A `⚠` on a warn-level key is not a blocker, but it is **not** "ignore me" either: if it lands on a slot this run genuinely uses, add the key for a full-quality run, because it only stayed warn thanks to a documented fallback. A genuine ⚠-and-skip is fine only for a slot this run does not use.
- **Exit 1, FAIL.** A REQUIRED key is missing/malformed, or the locked path needs a provider with no registry entry. Add the named key to `scripts/.env` and re-run. If the output says a key was "found by name in `<slug>-keys.env`", merge that file into `scripts/.env`, because the runtime reads only `.env`.
- **Exit 2, cannot scope.** No profile, no `run_state`, or the registry is missing/invalid. Fix that and re-run.

> Windows note: to *simulate* a missing key for testing without editing `.env`, set it empty via Bash (`SOME_API_KEY='' node ...`). PowerShell's `$env:KEY=''` removes the variable instead of passing it empty, so the file value would still win.

## Related

- `/cold-email-kickoff`: the real entry point; `/phase-1-onboarding` calls this at kickoff scope.
- `/tool-balance-guard`: the balance and down-tool stop before each phase's first paid step; a key this gate warned on becomes that guard's stop at the step that uses the tool.
- `/api-cost-governance`: owns balance and spend; shares `scripts/credential-registry.json` with this gate.
- `/autonomous-execution-policy`: a missing REQUIRED key is a legitimate credential hard-stop.
