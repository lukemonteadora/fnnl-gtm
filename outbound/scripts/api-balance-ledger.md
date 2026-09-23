# API Balance Ledger

Operational spend tracker read and updated by `/api-cost-governance`.

**Not a secrets file.** No API keys belong here. It does show spend, so keep it out of any public commit.

## Status: empty (no providers configured yet)

FNNL Agency has not chosen its tools, so there are no balances to track. `/stack-setup` records the chosen tools in `stack-contract.yaml`, and each provider gets a row here once it is actually credentialed.

**Do not pre-populate this table with tools FNNL has not bought.** An empty ledger is honest. A ledger full of `UNKNOWN` rows for tools nobody owns makes the cost gate look configured when it is not.

## How it works

- **Warning threshold:** $10 per provider. `/api-cost-governance` flags any provider below it.
- **On top-up:** set that provider's `Balance (USD)` to the figure its dashboard shows, and update `Last top-up`.
- **After a paid run:** the governance skill decrements `Balance` by the run's estimated cost.

### Two provider classes, and why the distinction matters

- **Live-balance providers** expose a remaining-balance or credit-count endpoint. The skill calls it and mirrors the real number here, so the verdict is trustworthy.
- **Ledger-only providers** publish no balance API. Their figure is whatever was last recorded by hand, so it drifts and is often `UNKNOWN`. For these, **any block or warn verdict is an estimate, not a fact**, and the real protection is a hard spend limit set on the provider's own side.

Record the class in the `Source` column when you add a provider, so the skill knows whether it can verify or only estimate. Which class a provider falls in is a property of that vendor, checked when the slot is filled.

### Recording a free live re-check

The free balance and health calls for each of the six tools are listed in the "Live re-check" section of `outbound/reference/provider-capability-matrix.md`. When one runs against FNNL's own account, copy the figure it returned into `Balance (USD)` with its unit and date, set `Source` to `live: <the call>`, and add the same dated reading to that section. Never type a figure that did not come back from a call. Template: `| MillionVerifier | lead_data.email_verification | MILLIONVERIFIER_API_KEY | <credits> credits (live, YYYY-MM-DD) | live: millionverifier_get_credits (free) | n/a | <what the call showed> |`

## Ledger

| Provider | Capability slot | Env var | Balance (USD) | Source | Last top-up | Notes |
|---|---|---|---|---|---|---|
| _(none yet)_ | | | | | | |

<!--
Row format once a provider is live:

| Acme Enrich | lead_data.contact_enrichment | ACME_API_KEY | 42.50 | live-balance (GET /v1/credits) | 2026-09-18 | decrements ~$0.012/record |

Add a row only after:
  1. the tool is recorded in stack-contract.yaml, and
  2. its key resolves via /preflight-credentials, and
  3. a real call has succeeded (status: live).
-->

## Preventing a negative balance

Setting a hard spend limit in each provider's own dashboard is a **required** one-time step, not an optional extra. This ledger cannot stop an overrun on a ledger-only provider, because it only knows what was last typed into it. The provider-side limit is the only real backstop.
