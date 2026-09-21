# Clay as the list-building workspace: what it actually does, and who does what

**Status: reference only, as of 2026-09-19.** Clay is NOT in `outbound/stack-contract.yaml` yet. Every slot in that contract is still `not_chosen`, so no skill routes to Clay and no skill should name it. This document records how the workspace actually works so the eventual `/stack-setup` entry and skill rewiring are built on verified behavior rather than on assumptions. **Do not treat this file as permission to use Clay in a skill.**

## Why this exists

FNNL is moving list building out of blind CSVs assembled inside Claude and into a live Clay workspace, where columns are visible, rows can be inspected and deleted by hand, and manual columns can be added. That is a real improvement: a CSV built without seeing the data is a guess until someone opens it, whereas a Clay table shows the actual fill rate per column while it is still cheap to change course.

It also retires a whole step. `source-signal-intelligence.md` existed to PREDICT what data the stack could obtain, before spending. A live sample measures the same thing for pennies. That is why source-signal discovery was deleted on 2026-09-19 and `/data-point-discovery` absorbed the question.

## VERIFIED: what the Clay MCP can and cannot do

Checked live on 2026-09-19 against the connected workspace. **This is the part most likely to be assumed wrong.**

Connection is pinned to workspace **`a-sales.co`** (id `161971`). Anything Claude runs lands there, not in a workspace chosen per client. Confirm that is the intended home for FNNL client work before wiring anything.

**Claude CAN:**
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

**Claude owns volume and research.** Running searches, adding enrichment columns to those searches, running the five subroutines, pulling results back, and reasoning over what came back. Claude is the hands on a structure the operator defines, not the architect of the structure.

This is the inverse of the intuitive reading, and it is fine. The expensive, repetitive, high-volume work is the part Claude can do.

## What this changes about obtainability

Under the retired flow, `/data-point-discovery` predicted a `coverage` number per data point and `/tam-build` later discovered the truth. Under Clay, the honest sequence is:

1. `/data-point-discovery` ranks the data points by campaign value against the locked offer, and records a PREDICTED obtainability and coverage. That prediction is a starting hypothesis, not a finding.
2. A small sample runs in the workspace.
3. The ACTUAL fill rate per column settles it, before the full build spends anything meaningful.

A predicted coverage number that a live sample disproves an hour later is worth less than the sample. Record the prediction, then let the sample overrule it.

## Before any of this becomes real

1. **Run `/stack-setup`** and record Clay in the slots it actually fills. On the evidence above that is the list-building workspace and part of the contact-enrichment waterfall, not the company-discovery source of truth, since the searches still run against Clay's own data.
2. **Resolve the workspace question.** `a-sales.co` is not an FNNL-named workspace. Decide whether FNNL client work belongs there, in a new workspace, or in one workspace per client.
3. **Only then rewire the skills.** Until the contract names Clay, every skill correctly treats it as an unknown vendor and stops. That guardrail is working as designed, so do not route around it by hardcoding Clay into a skill.
4. **Write the skills against the capability role**, never the brand, exactly as every other skill in this repo is written. "The list-building workspace", not "Clay".

## Spend

Searches and enrichments consume Clay credits. That is real per-record spend and it routes through `/api-cost-governance` against `run_state.spend_ceiling_usd`, which defaults to 0, meaning confirm before every paid call. Reading results back and listing subroutines are free metadata calls.
