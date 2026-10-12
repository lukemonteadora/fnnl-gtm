---
name: tool-balance-guard
description: Check each tool's balance, credits or fair use before a phase that uses it; when a tool in the provider order is out of balance, returns 402 or is down, STOP and ask the operator. Never substitute another tool or skip a step without the operator's recorded approval. Report balances after each phase.
---

# Tool Balance Guard

## What this is

A stop rule for every phase that calls a paid tool: list building, email finding, verification, enrichment. The provider order in `outbound/reference/provider-routing.yaml` and `outbound/stack-contract.yaml` names which tool fills each capability role (people search, email finder, verifier, and so on). This skill makes sure that order is honored even when a tool runs dry or goes down: the run waits for the operator, it does not quietly route around the problem.

It sits beside the other gates, it does not replace them:

- `/preflight-credentials` checks that each key is present and well formed. It never checks balance.
- `/api-cost-governance` prices a run, holds it inside the run budget and keeps the ledger (`scripts/api-balance-ledger.md`, created on first use).
- This skill checks that each tool in the order still has balance to do its job, and says what happens when it does not.

## Supersedes the old outage exception (2026-09-28)

Earlier, a finder that was down could be switched off for the run with `--skip-provider`, and the next rung (the enricher) then opened those rows as the finder. That was the "sanctioned exception" to `requires_attempted`. It is retired. A tool that is out of balance or down is now a stop on every rung, the last rung included, and the next tool only picks up its rows after the operator says so in chat for that step of that run.

`outbound/scripts/list_waterfall.py` enforces it: `plan --skip-provider P --skip-reason TEXT` exits 2 unless `--operator-approved-skip` is also passed. The refusal names the reason class (out of balance, down, or switched off) and points here. An approved skip writes `detail.operator_approved: true` on the ledger's skip line, and the report shows the skip reason with "(operator approved)".

## The three rules

1. **Check before the phase.** Before a phase starts, read the balance of every tool that phase will call (the table below). Do not start a phase whose tools cannot finish it.
2. **Out of balance or down means stop and ask, never substitute.** When a tool shows any stop signal below, stop that step, save progress, and ask the operator. Never swap in another tool for that capability role, never reorder the provider order, never skip the rung. The one way through is the operator's explicit say-so, recorded.
3. **Report after every phase.** Close each phase with the balance report below, so the operator sees what the phase used and what is left before the next one starts.

## What stops a step

| Signal | Means | Action |
|---|---|---|
| HTTP 402, "payment required", "insufficient credits" | out of balance | stop, ask the operator to top up |
| Plan credits or fair use used up for the period | out of balance | stop, ask the operator to top up or wait for the reset |
| Wallet cash too low for a paid scrape | out of balance (wallet only) | stop that scrape, ask the operator to add wallet funds |
| Balance below what the phase needs | out of balance | stop before starting, ask the operator |
| 401 or 403, key rejected or missing | down (credentials) | stop, ask the operator to fix the key (`/preflight-credentials`) |
| 5xx, timeouts, connection errors after the retries below | down | stop, ask the operator |
| `429` rate limit with no credit or quota wording | neither | back off and retry the same tool; not a stop |

## Balance checks for FNNL's tools

| Tool | Capability role | How to read the balance | Notes |
|---|---|---|---|
| Giggal | verifier | MCP `giggal_get_credits`, or `outbound/scripts/giggal_verify.mjs` | Reading credits costs nothing. The script checks capacity itself: fewer credits than rows to verify prints STOP, sends nothing and exits 3 (a stop, ruling `verifier-capacity`). `--max` needs `--cap-approved "<reason>"`; a verifier never caps a run silently. |
| GetLeads (plan) | full company export, people search, email finder (rung 1, by LinkedIn URL), enrichment (operator directive 2026-10-06, see `standing-rulings.md` `discovery-flow`) | MCP `get_fair_use` | Plan credits under fair use, reset on the UTC calendar day and month, not a rolling window. A null credit count means no fixed cap, never zero. GetLeads is a paid plan, never describe it as free. |
| GetLeads (wallet) | paid scrapes only (profile monitoring, company followers, website visitors) | MCP `get_wallet_balance` | A second, separate meter. `insufficient_wallet_cash` means add wallet funds; it does not mean the plan credits are out. |
| AI Ark | company sample and keyword mining, the optional parallel company and people searches (only if fast), email finder (rung 2) | Treat HTTP 402 or an insufficient-credits response as out of balance. Optional pre-check: `GET /v1/payments/credits`, which costs no credits. | |
| Prospeo | email finder (rung 3), enrichment | Treat HTTP 402 or an insufficient-credits response as out of balance. | |
| Clay | workspace only | Zero credits, always. | Never a provider rung, and the guard never proposes Clay credits as a fallback. |
| PlusVibe | sending platform | Not a list rung. | Sending-side limits belong to the deliverability skills, not here. |

## A tool that is down

Before calling a tool down, try the same tool's other route (its MCP server or its script in `outbound/scripts/`). Using a second route to the same tool is not a substitution. For 5xx or network errors, retry twice about a minute apart. If it still fails, it is down: stop and ask.

## What to do when a step stops

1. Stop that step. Do not start the next rung on those rows.
2. Save progress: the waterfall ledger and queues already hold it; note the last finished batch for anything run outside `list_waterfall.py`.
3. Tell the operator straight away with the stop block below. Do not wait for the phase checkpoint.
4. Keep other work going that does not need the stopped tool (`/autonomous-execution-policy` section 5).
5. When the operator confirms a top-up or a fix, re-check the balance and resume on the same tool.
6. Log it in the client's activity log: `BLOCKED <tool> out of balance at <step>`, then `NOTE resumed on <tool> after top-up`.

## Never

- Substitute another tool for the one the provider order names, because the named one is out of balance or down.
- Skip a rung, or pass `--skip-provider` without `--operator-approved-skip`, unless the operator said so in chat.
- Propose Clay credits as a fallback.
- Treat a GetLeads wallet shortfall as the plan being out, or the reverse.
- Report a balance you did not read in this session.

## The one exception

The operator says in chat, for that step of that run, to go on without the tool. Only then: run `list_waterfall.py plan ... --skip-provider P --skip-reason "<what happened>" --operator-approved-skip`, and log `NOTE operator override: skipped <tool> at <step>, reason <reason>` in the activity log. The approval covers that step of that run only; the next run starts from the full order again.

## Stop block

```
STOPPED: <tool> (<capability role>) at <step>
Signal   : <402 / insufficient credits / fair use used up / wallet low / 5xx after retries / key rejected>
Balance  : <figure read, with the tool call it came from>
Needed   : <what the rest of the step needs, if known>
Progress : <rows done / rows left, saved in <path>>
Options  : 1. top up or fix <tool>, then I resume on it [Recommended]
           2. approve skipping <tool> for this step of this run (recorded as operator-approved)
Waiting on the operator. Other work continuing: <what>.
```

## Balance report (after each phase)

```
Balances after <phase> (<client>, <date>)
🟢 Giggal : <n> credits (used <n> this phase)
🟢 GetLeads plan   : <fair-use remaining, day and month>
⚪ GetLeads wallet : <cash>, only needed for paid scrapes
🟡 AI Ark          : <credits if checked, or "no 402 seen">
🟢 Prospeo         : <no 402 seen / credits if known>
⚪ Clay            : zero credits, not a rung
```

🔴 out of balance or down (the step stopped), 🟡 under the warning threshold, 🟢 fine, ⚪ not used this phase or not a rung. Mirror the figures to `scripts/api-balance-ledger.md` through `/api-cost-governance`.

## Thresholds

| Tool | Warn (🟡) when |
|---|---|
| Giggal | fewer credits than the next phase's rows to verify |
| GetLeads plan | less than the next phase's pull left in today's or this month's fair use |
| GetLeads wallet | less than the estimated cost of the next paid scrape (`estimate_scrape_cost`) |
| AI Ark, Prospeo | under \$10 or under the next phase's estimate, whichever is higher, when a figure is available |

## Not covered here

- Pricing a run and holding it inside the run budget: `/api-cost-governance`.
- Key presence and shape: `/preflight-credentials`.
- Mailbox, domain and sending limits: the deliverability skills.

## Related

`/api-cost-governance`, `/autonomous-execution-policy` (section 3, hard stops), `/email-waterfall`, `/tam-build`, `/preflight-credentials`.
