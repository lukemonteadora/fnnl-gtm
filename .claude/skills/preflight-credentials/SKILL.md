---
name: preflight-credentials
description: Run-state-scoped credential preflight. Verifies ONLY the API keys the locked run_state path needs (registrar, mailbox_provider, sending_platform, plus warn-level AI, research, email_verification and lead-data slot keys) are present and well-formed, a fast binary pass/fail gate before any spend. Which tool fills each capability slot comes from the workspace stack contract, never from a default. Use when the operator says "verify my keys", "check my credentials", "are my API keys set", "preflight credentials", or before kicking off infra/research for a client. This is a HELPER/GATE that /cold-email-kickoff calls at Step 2.6. It is NOT a run entry point or orchestrator.
---

# Credential Preflight (helper / gate)

A thin wrapper around `scripts/preflight-credentials.mjs`. It answers one question: **are the API keys the locked `run_state` path needs present and well-formed?** It does not orchestrate a run, choose providers, spend money, or replace `/cold-email-kickoff`.

> This is subordinate to `/cold-email-kickoff`. Kickoff invokes this exact check at **Step 2.6** (after the stack/platform are locked and persisted, before any spend). Run it standalone only to spot-check keys; to actually start a client, use `/cold-email-kickoff`.

## Scope & boundaries

- **Presence + shape only.** Is the key there and well-formed (length, no placeholder, expected prefix where known)? It never checks balance. `/api-cost-governance` owns balance and spend.
- **Scoped to the locked path.** Only the keys the chosen `registrar` + `mailbox_provider` + `sending_platform` need are REQUIRED. The AI and research slots (`research_provider`, `bulk_classification`, `copywriting`, `image_generation`), `email_verification`, the lead-data slots (`company_discovery`, `contact_discovery`, `contact_enrichment`, `intent_signals`) and the web access slots (`search`, `crawl`) are WARN-level. Which tool actually fills each slot, and therefore which variable gets checked, is whatever that slot is locked to for this client, sourced from the workspace stack contract at `02-skills/coldoutbound-skills/stack-contract.yaml` crossed with the locked `run_state`. There is no default, and nothing in this file declares a stack. If a slot the locked path needs is unset, stop and route the operator to `/stack-setup` rather than substituting a vendor.
- **Research routing decides whether `research_provider` is REQUIRED.** The routing value sets this, not anything about the slot itself. Under the default `run_state.research_routing = claude_deep_research`, the primary research pass runs on the Claude native `/deep-research` harness, which needs no third-party key, so `research_provider` is off the critical path and its key stays warn-level: missing it costs an optional grounding pass, not the primary pass. **The `research_provider` key is elevated to REQUIRED (hard-stop) ONLY when the operator explicitly set `run_state.research_routing = third_party_ai`**, where the primary pass runs on whatever fills that slot and cannot run without it. Do not confuse the default `claude_deep_research` (the multi-agent harness) with `claude_native` (bare inline WebSearch, the weak path). The concrete variable name checked comes from `scripts/credential-registry.json`, never from an assumption about which engine fills the slot.
- **WARN-level ≠ "optional extra."** A warn means that slot degrades gracefully to a documented fallback, not that the slot is skippable. If a slot this run actually uses is unset in the stack contract, or filled but unkeyed, fill it for a full-quality run rather than shrugging it off. Tools that authenticate as MCP connectors (set up in Claude → Connectors) have no `.env` key at all, so they surface as a connector check rather than a key check. Irrelevant providers are never listed.
- **A PASS is not proof the stack works.** Presence and shape are strictly weaker than a successful call. A slot recorded as `chosen` in the stack contract has only been named; only `live` means a real call against FNNL's own account has succeeded. Exit 0 means the keys resolve, not that the tools run.
- **Secret hygiene.** Prints only `✓ present` / `✗ MISSING` / `⚠ malformed` or a masked last-4 tail. Never prints, logs, or writes a full key value.
- **Inside `coldoutbound-gotchas` hard boundaries.** Read-only: no passwords, no account creation, no cards.

## Run it

```
node "<coldoutbound-skills>/scripts/preflight-credentials.mjs" [--profile <slug>] [--validate]
```

- `--profile <slug>`: check this client's `profiles/<slug>/client-profile.yaml`. If omitted, it picks the most-recently-modified profile that has a `run_state` block (or tells you how to pass one).
- `--validate`: optional live ping, **off by default**. Only pings where a free endpoint exists for the configured provider; everything else stays presence+shape. Default mode makes zero API calls.

It reads `scripts/credential-registry.json` (the single source of truth, mirrored from `/api-cost-governance`) × the locked `run_state`, prints a Required / Optional summary, and writes `profiles/<slug>/preflight-credentials.json`.

## Reading the result

- **Exit 0, PASS.** All REQUIRED keys present and well-formed. Safe to proceed. A `⚠` on a warn-level key is not a blocker, but it is **not** "ignore me" either: if it lands on a slot this run genuinely uses, add the key for a full-quality run, because it only stayed warn thanks to a documented fallback. A genuine ⚠-and-skip is fine only for a slot this run does not use.
- **Exit 1, FAIL.** A REQUIRED key is missing/malformed, or the locked path needs a provider with no registry entry. Add the named key to `scripts/.env` and re-run. If the output says a key was "found by name in `<slug>-keys.env`", merge that file into `scripts/.env`, because the runtime reads only `.env`.
- **Exit 2, cannot scope.** No profile, no `run_state`, or the registry is missing/invalid. Fix that and re-run.

> Windows note: to *simulate* a missing key for testing without editing `.env`, set it empty via Bash (`SOME_API_KEY='' node ...`). PowerShell's `$env:KEY=''` removes the variable instead of passing it empty, so the file value would still win.

## Related

- `/cold-email-kickoff`: the real entry point; calls this at Step 2.6.
- `/api-cost-governance`: owns balance and spend; shares `scripts/credential-registry.json` with this gate.
- `/autonomous-execution-policy`: a missing REQUIRED key is a legitimate credential hard-stop.
