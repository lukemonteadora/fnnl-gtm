# Clay as the list-building workspace: what it actually does, and who does what

**Status, updated 2026-09-22.** Clay is in `outbound/stack-contract.yaml` as `lead_data.list_workbench`, status `chosen` (not yet `live`), and is one of FNNL's approved six tools. Skills still name the role ("the list workbench"), never the brand. This document records how the workspace actually works so the skill rewiring is built on verified behavior rather than on assumptions.

## HARD RULE: zero Clay credits, and build lead lists in Clay (operator directive 2026-09-22)

FNNL never runs anything in Clay that consumes Clay credits. Clay is where lead lists are built and watched, never a data vendor paid through Clay's own balance. Every tool used inside Clay runs on FNNL's own API key. Lead lists are built in a Clay table by default so the operator sees them fill live. The full rule (six numbered clauses, including default-deny for anything unproven and the Actions meter) lives in the stack contract at `lead_data.list_workbench.credit_policy_rule`, with a summary in CLAUDE.md section 7. **Where this document and that rule disagree, the rule wins.**

## Why this exists

FNNL is moving list building out of blind CSVs assembled inside Claude and into a live Clay workspace, where columns are visible, rows can be inspected and deleted by hand, and manual columns can be added. That is a real improvement: a CSV built without seeing the data is a guess until someone opens it, whereas a Clay table shows the actual fill rate per column while it is still cheap to change course.

It also retires a whole step. `source-signal-intelligence.md` existed to PREDICT what data the stack could obtain, before spending. A live sample measures the same thing for pennies. That is why source-signal discovery was deleted on 2026-09-19 and `/data-point-discovery` absorbed the question.

## VERIFIED: what the Clay MCP can and cannot do

Checked live on 2026-09-19 against the connected workspace. **This is the part most likely to be assumed wrong.**

**Workspace: Dorsia Labs (id `651677`), confirmed by the operator as FNNL's on 2026-09-22 and re-checked live the same day.** The 2026-09-19 check below ran while the connector still pointed at `a-sales.co` (id `161971`), the previous company's workspace, where no client list is ever built. The connector is an account-level connection, so it points wherever the operator last authorized it: run `get-current-workspace` (free) before any Clay work and stop if it does not return `651677`.

**Enforced in code.** Since 2026-09-22 the project hook `.claude/hooks/clay-credit-guard.mjs` (wired in `.claude/settings.json`) blocks every connector tool except the four free read calls, and blocks the known credit-spending tool names on any server. Tested live: an allowed call passes, a blocked call is refused. It only guards Claude Code; columns run inside the Clay web app are covered by the rule's clause 4 (key check plus a 1-to-5-row credit test), not by the hook.

**Read this list as what the connector is technically able to do, not what FNNL permits.** Under the zero-credit rule, the searches, enrichment columns and subroutines below all bill Clay credits and are prohibited. The only MCP calls allowed are free metadata and read calls (`get-current-workspace`, `list_subroutines`, `get-task`, `get-task-context`). The connector's tool set also changed on a 2026-09-22 reconnect (the `search-*` tools were replaced by `find-and-enrich-*` tools), and the rule covers both generations.

**Claude CAN (technically):**
- Run a company or contact search, which creates a task and returns a `taskId`.
- Add enrichment columns to that search. Standard types: Headcount Growth, Recent News, Investors, Company Competitors, Company Customers, Tech Stack, Website Traffic, Open Jobs, Revenue Model, Annual Revenue, Latest Funding. Plus `Custom`, which answers an open research question per row.
- Run one of the workspace's five configured subroutines on a search: **Company Latest Funding, Website Traffic, Website Technology Stack, Work Email, Mobile Phone Number**.
- Read results back and answer inline.
- Query audience accounts, contacts, and deals in natural language.

**Claude CANNOT:**
- Create a Clay table.
- Duplicate a template.
- Add a manual column.
- Create or edit a workflow.
- Read a table that was built in the Clay UI.

There is no tool for any of those. This is the single most important line in this file: a plan that assumes "Claude builds the table from my template" hits a wall on the first run.

## The real division of labor

**The operator owns structure.** Building tables, duplicating the template for a new client, adding and arranging columns, wiring workflows, deleting rows by hand, and any judgement call about what the table should look like. All of this happens in the Clay UI.

**Claude owns volume and research, on FNNL's own keys.** Sourcing and enriching rows with FNNL's own API-keyed tools (outside Clay), pushing the finished rows into the operator's table through its inbound webhook so the list fills live, and reasoning over what came back. Claude never runs Clay's own searches, enrichments or subroutines, because those spend Clay credits. Claude is the hands on a structure the operator defines, not the architect of the structure.

**The operator owns the table setup that makes this work.** Before a list build, the operator creates or duplicates the client's table in the Clay UI with an inbound-webhook source, adds any enrichment columns connected with FNNL's own keys, and records the webhook URL in the client's gitignored profile. Claude cannot create tables or columns, so this step is always the operator's.

This is the inverse of the intuitive reading, and it is fine. The expensive, repetitive, high-volume work is the part Claude can do.

## What this changes about obtainability

Under the retired flow, `/data-point-discovery` predicted a `coverage` number per data point and `/tam-build` later discovered the truth. Under Clay, the honest sequence is:

1. `/data-point-discovery` ranks the data points by campaign value against the locked offer, and records a PREDICTED obtainability and coverage. That prediction is a starting hypothesis, not a finding.
2. A small sample runs in the workspace.
3. The ACTUAL fill rate per column settles it, before the full build spends anything meaningful.

A predicted coverage number that a live sample disproves an hour later is worth less than the sample. Record the prediction, then let the sample overrule it.

## Before any of this becomes real

1. **Done: Clay is in the contract** as `lead_data.list_workbench` (status `chosen`), and only in that slot. It is not a data vendor here: under the zero-credit rule its own searches and enrichments are never used.
2. **Done: the workspace question.** FNNL's workspace is Dorsia Labs (651677), confirmed 2026-09-22.
3. **Done (2026-09-22): the list-building skills are wired.** `/tam-build`, `/lead-scoring` and `/email-waterfall` push each stage's rows into the client's tables by inbound webhook, per `lead_data.list_workbench.build_protocol` in the stack contract, using `scripts/workbench_push.mjs`. They fall back to CSV-only, and say so, while a table is not ready.
4. **Still open before the first live build.** `CLAY_API_KEY` in `.env` is empty (the webhook path does not need it, the Routines API does). No client table or webhook exists yet: the operator creates each table in the Clay UI and records its webhook URL in the client's gitignored profile. The slot stays `chosen`, not `live`, until the first real push lands in FNNL's workspace.
5. **Skills keep naming the capability role**, never the brand: "the list workbench", not "Clay".

## Spend

Clay has two meters. **Data credits** (Clay's own data and enrichments) are prohibited outright under the zero-credit rule: no spend ceiling, `auto_execute` setting, or approved exception unlocks them. **Actions** (platform usage) are still consumed when a column runs on FNNL's own key. That is allowed, but it is spend, so it routes through `/api-cost-governance` against `run_state.spend_ceiling_usd` (a standing $100 per client run, never asked: Actions inside it run without a confirmation, and a run that would go over it stops and asks). The zero-cost path is to enrich outside Clay with FNNL's keys and push rows in by webhook: webhook import, viewing, manual edits, formulas, filters and CSV export cost nothing on either meter. Reading results back and listing subroutines are free metadata calls.

**Catch-all label, checked:** an earlier worry was that the catch-all label `/email-waterfall`'s timing gate needs might only exist in Clay's own waterfall layer, which this rule puts off-limits. The 2026-09-22 verifier swap removes that dependency on paper: the verifier of record returns catch-all as its own result (see `lead_data.email_verification.notes`). It is still `chosen`, not `live`, so confirm the label on a real call before the first live list build.
