# API Balance Ledger

Operational spend tracker read and updated by `/api-cost-governance`.

**Not a secrets file.** No API keys belong here. It does show spend, so keep it out of any public commit.

## Status: dated returned-data readings available

The previous empty header was stale against the authenticated calls already recorded below. October 5 balances and bounded new-wave usage are recorded in the dated section at the end. Credits are not USD wallet balances. Older unpriced usage remains unreconciled.

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
| AI Ark | lead_data.contact_enrichment | AI_ARK_API_KEY | 49,547.2 credits, 2026-10-05 | live: GET /payments/credits | not checked | 54-credit delta in October 5 new wave; dated snapshot |
| MillionVerifier (retired 2026-10-12) | lead_data.email_verification | MILLIONVERIFIER_API_KEY | 4,401 credits, 2026-10-05 | live: free credits endpoint | not checked | Replaced by Giggal on 2026-10-12; kept as history. Delayed balance updates; batch charged-credit attribution uncertain |
| Giggal | lead_data.email_verification | GIGGAL_API_KEY | 50,055 credits, 2026-10-12 | live: GET /v1/credits (free) | not checked | After the 2026-10-12 live probes (50,095 after the first 6-credit probe, 45 credits used in all); 1 credit per address, `unknown` refunded; the catch-all check bills every catch-all address in its source job |
| Prospeo | lead_data.contact_enrichment | PROSPEO_API_KEY | 1,725 credits, 2026-10-05 | live: GET /account-information | not checked | Six-credit delta in October 5 new wave; dated snapshot |

<!--
Row format once a provider is live:

| Acme Enrich | lead_data.contact_enrichment | ACME_API_KEY | 42.50 | live-balance (GET /v1/credits) | 2026-09-18 | decrements ~$0.012/record |

Add a row only after:
  1. the tool is recorded in stack-contract.yaml, and
  2. its key resolves via /preflight-credentials, and
  3. a real call has succeeded (status: live).
-->

## Run log (research provenance, not AI spend)

| Date | Skill | Provider(s) | Tokens | USD | Exact/Est | Balance |
|---|---|---|---|---|---|---|
| 2026-09-24 | offer-intelligence discovery (propfuel) | claude-subagent-fanout (deep-research harness unavailable) | n/a | 0.00 | n/a | n/a |
| 2026-09-29 | offer-intelligence discovery (fnnl-agency) | claude-subagent-fanout (deep-research harness unavailable; 9 sub-agents) | n/a | 0.00 | n/a | n/a |
| 2026-09-24 | data-point-discovery brainstorm (propfuel) | claude-subagent-fanout (deep-research harness unavailable; 5 research sub-agents + form990 pass) | n/a | 0.00 | n/a | n/a |
| 2026-09-25 | tam-build Phase A (propfuel): company counts, 300-row sample pull, 98-row rework pull, 17-account buyer probe | AI Ark (FNNL key) | n/a | about 0.78 to 1.92 (195.5 credits at $0.004 to $0.0098, labelled estimate) | credits exact (live 60,099 to 59,903.5), USD est | 59,903.5 credits (live: GET /payments/credits, 2026-09-25) |
| 2026-09-30 | phase-3-list slice 1 (fnnl-agency): TAM counts, company fit, people_search and export_single for the four NOW campaigns | AI Ark (FNNL key) | n/a | about 40.6 to 99.5 (10,154 credits at $0.004 to $0.0098, labelled estimate) | credits exact (live 59,903.2 to 49,749.2), USD est | 49,749.2 credits (live: GET /payments/credits, 2026-10-01) |
| 2026-10-01 | phase-4 samples (fnnl-agency): look-alike sample lists for key4 and key7 (150 credit cap) | AI Ark (FNNL key) | n/a | about 0.59 to 1.45 (148 credits at $0.004 to $0.0098, labelled estimate) | credits exact (live 49,749.2 to 49,601.2) | 49,601.2 credits (live: GET /payments/credits, 2026-10-01) |
| 2026-09-30 | phase-3-list slice 1 (fnnl-agency): email verification of 4 campaigns, mostly shared-cache hits | MillionVerifier (FNNL key) | n/a | not priced here (2,950 credits used) | credits exact (live 7,361 to 4,411) | 4,411 credits (live: millionverifier credits call, 2026-10-01) |
| 2026-09-30 | phase-3-list slice 1 (fnnl-agency): Prospeo enrich-person on blanks and rejects, only_verified_email | Prospeo (FNNL key) | n/a | not priced here (269 credits used) | credits exact (live 2,000 to 1,731) | 1,731 credits (live: Prospeo account call, 2026-10-01) |
| 2026-10-06 | phase-2 rerun AI Ark sample and refine (propfuel): counts, 3 samples (200+100+100), 5 exclude audits | AI Ark (FNNL key) | n/a | about 1.00 to 2.45 (249.5 credits at $0.004 to $0.0098, labelled estimate) | credits exact (live 49,547.2 to 49,297.7), USD est | 49,297.7 credits (live: GET /payments/credits, 2026-10-06) |
| 2026-10-06 | phase-3-list (propfuel): AI Ark people pull at scale on search-final.json (2,629 people) plus the client-list domain pull (786 people, 12 slices) | AI Ark (FNNL key) | n/a | about 6.87 to 16.84 (1,718 credits at $0.004 to $0.0098, labelled estimate) | credits exact (live 49,297.7 to 47,579.7), USD est | 47,579.7 credits (live: GET /payments/credits, 2026-10-06) |
| 2026-10-06 | phase-3-list (propfuel): ED/CEO fallback pull (3,294 people) plus email waterfall AI Ark rung (export/single, found only) for C1 and C2 | AI Ark (FNNL key) | n/a | about 11.54 to 28.27 (2,885 credits at $0.004 to $0.0098, labelled estimate) | credits exact (live 47,579.7 to 44,694.7), USD est | 44,694.7 credits (live: GET /payments/credits, 2026-10-06) |
| 2026-10-06 | phase-3-list (propfuel): email waterfall Prospeo rung (bulk-enrich-person, only_verified_email, found only) | Prospeo (FNNL key) | n/a | about 14.64 (244 credits at the conservative $0.06 reference) | credits exact (live 1,725 to 1,481), USD est | 1,481 credits (live: Prospeo account call, 2026-10-06) |
| 2026-10-06 | phase-3-list (propfuel): MillionVerifier on every email from GetLeads, AI Ark and Prospeo (C1 + C2 + ED widening) | MillionVerifier (FNNL key) | n/a | about 5.96 (1,528 credits at about $0.0039, reference) | credits exact (live 4,398 to 2,870), USD est | 2,870 credits (live: millionverifier credits call, 2026-10-06) |
| 2026-10-06 | phase-3-list (propfuel): GetLeads email rung (from-linkedin) on 2,331 people | GetLeads (Unlimited plan, fair use) | n/a | 0.00 marginal (1,743 fair-use units of 500,000 daily) | fair use exact | 498,257 daily remaining (live: get_fair_use, 2026-10-06) |

## Preventing a negative balance

Setting a hard spend limit in each provider's own dashboard is a **required** one-time step, not an optional extra. This ledger cannot stop an overrun on a ledger-only provider, because it only knows what was last typed into it. The provider-side limit is the only real backstop.

## October 5: new S1/key7 agency recovery wave

Separate new wave under the standing $100 allowance; bounded stage allocation $12. Original wave usage above is preserved and remains partly unpriced. No card charge, top-up or billing change.

| Provider | Before → after returned credits | Exact observation | USD credit-value estimate |
|---|---|---|---:|
| AI Ark | 49,601.2 → 49,547.2 | 54-credit delta, 74 existing people processed | $0.5292 |
| Prospeo | 1,731 → 1,725 | Six-credit delta, 53 residue results | $0.3600 |
| MillionVerifier | 4,411 initial; 4,401 later | 58 network requests plus two cache hits; balance updates delayed, not fully attributable | $0.2262 request-value reference |
| Total | | | $1.1154, about $1.12 |

These are published-reference estimates, not actual invoices. Prospeo's conservative $0.06 unit estimate covers conflicting own-site published references. Verifier requests are not asserted to equal observed charged credits. Price sources, saved provider summaries and final 109-person disposition: [verification report](../../client-assets/2026-10-05-milan-handoff/agency-verification-results.md).
