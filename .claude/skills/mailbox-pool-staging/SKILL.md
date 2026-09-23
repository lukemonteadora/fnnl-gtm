---
name: mailbox-pool-staging
description: Maintains a pre-warmed POOL of cold-email mailboxes so a new client can launch in days, not ~6 weeks, and moves each client through a three-stage domain lifecycle while keeping clients isolated from each other (especially in the same market). It sits ON TOP of whatever provisioning flow FNNL's stack contract selects and ORCHESTRATES it. It never re-implements domain buying, mailbox creation, or warmup. Use when pre-warming Stage-1 .co test inventory in tranches, when a new client signs and needs a ready group (check the pool FIRST, before provisioning fresh), when promoting a proven angle from Stage 1 (.co disposable) to Stage 2 (.com long-term) to Stage 3 (client-branded) with a seamless thread-aware cutover, and when releasing or recycling a group after a client churns. Source of truth is the "Cold Email Mailbox Pool" Google Sheet (DOMAINS / MAILBOXES / DASHBOARD tabs), which the operator creates once. Mirrors /anthropic-skills:cold-email-deliverability for the 21-day ready gate, ~30/day caps, DNS, and retire rules. Defers to /autonomous-execution-policy.
---

# Mailbox Pool Staging

The **pool layer** that sits on top of your provisioning flow. It keeps a pre-warmed inventory of mailbox
**groups**, hands a ready group to each new client through an **isolation gate**, and walks a proven angle
through a **three-stage domain lifecycle** (disposable, then long-term, then branded) without ever dropping a
sequence or a reply.

It does **not** buy domains, create mailboxes, or run warmup. Those stay with the provisioning and
inbox-manager skills for FNNL's chosen stack. This skill is the planner, tracker, allocator, and promoter. It
**orchestrates** `/mailbox-mix-strategy`, the registrar + mailbox-provider provisioning flow,
`/mailbox-profile-generator`, and the sending platform's inbox-manager, and it reads their deliverability
rules rather than re-stating them.

> **Why a pool exists: "launch in days, not six weeks."** A fresh domain needs ~3 weeks of warmup before it
> can send real campaigns. If you wait until a client signs to start, they wait six weeks. Instead you keep
> **disposable .co test groups warming ahead of demand**, so when a client signs you assign a group that is
> *already* warmed and launch immediately. The headline only works if one rule is followed everywhere:
> **when a client signs, check the pool for a ready, unassigned, isolation-clean group FIRST, assign it and
> launch, and only provision fresh if the pool can't serve them.**

## Stack dependency: this skill does not choose tools

Every provisioning, warmup, import, and tagging step below runs against tools declared in
`outbound/stack-contract.yaml` (the `registrar`, `mailbox_provider` and
`sending_platform` slots). **If a slot you need is empty, stop and route the operator to `/stack-setup`.** Do
not pick a tool because a note below names one, and do not infer FNNL's stack from an inert pack in
`_vendor-library/`. A tool recorded as `chosen` is not proven; only `live` means a real call against FNNL's
own account has succeeded.

Where this skill says "the provisioning flow", "the inbox manager", or "the sending platform", it means
whichever skill `/stack-setup` activated for that slot.

## When to use

- **Pre-warm Stage-1 inventory**: provision a tranche of disposable `.co` test groups and warm them ahead of near-term pipeline ("add a Stage-1 tranche for ~N clients").
- **A new client signs**: find and assign a ready, isolation-clean Stage-1 group, then launch (this is the days-not-weeks moment).
- **An angle proves**: promote a client from Stage 1 (`.co`) to Stage 2 (`.com`), or Stage 2 to Stage 3 (branded), with a parallel-warm bridge and a thread-aware cutover.
- **A client churns or a campaign ends**: release the group into quarantine and recycle it under the isolation rules.
- **Inventory / cost check**: "how much free pool inventory do we have?", "what's our idle burn?", "are any Stage-1 domains about to expire?", "any same-market conflicts?" (the DASHBOARD answers these).
- Standalone triggers: "add a Stage-1 tranche", "assign a pool group to <client>", "promote <client> to Stage 2/3", "release <client>'s group", "/mailbox-pool-staging".

## When NOT to use

- **Buying domains / creating mailboxes / configuring warmup** → the registrar + mailbox-provider provisioning skill plus the sending platform's inbox manager. This skill calls them; it never duplicates them.
- **Deciding the Google/Microsoft mix for a signed client** → `/mailbox-mix-strategy`. (This skill only sets the *pool's* speculative pre-warm mix, below.)
- **Per-mailbox tag / warmup / client-access mechanics** → the sending platform's inbox manager.
- **Per-active-client cost + ROI** → the "Cold Email Mailbox Tracker" sheet. This skill tracks *pool* inventory and idle burn; a group's per-client cost is logged in the tracker once it's deployed.
- **Reply triage, deliverability incidents, copy** → their own skills.

## What this skill produces

- The **"Cold Email Mailbox Pool" Google Sheet**: the source of truth, three tabs (DOMAINS / MAILBOXES / DASHBOARD). **The operator creates this sheet once** (see Canonical Paths).
- A **pool home** at `profiles/_mailbox-pool/`: `activity-log.md` (read-first / write-after) + `pool-manifest.md` (tranches, group registry).
- **Group assignments** with an isolation verdict (which ready group goes to a new client, or "provision fresh").
- **Stage promotions** with a parallel-warm bridge plan and a **thread-aware cutover verdict** ("safe to retire the old-stage mailboxes? Y/N plus the still-live threads").
- **Recycling actions**: quarantine + 90-day same-market cooldown + re-warm, or retire.
- A refreshed **DASHBOARD**: counts by stage/status, idle burn rate, ready-and-unassigned per stage, Stage-1 expiry + auto-renew-OFF + same-market-conflict alerts.

## Interaction Policy

Defers to `/autonomous-execution-policy`. Under `run_state.execution_mode = auto_execute` (opt-in per client; the default is `review_gates`), proceed without pausing: apply the rubric, record the decision, and continue. Pool purchases are infrastructure, so they run against the setup total the operator approved once (the standing $100 data budget in `run_state.spend_ceiling_usd` never covers them), auto-approved within that total. Stop only for the hard-stop list (funding a wallet, paying by card, accepting OAuth or terms, anything that authenticates, or pressing a campaign **Start**). On a long async wait (warmup maturity is ~3 weeks), background-poll and move to other productive work, never holding the session idle on a clock. UI-only steps are finished in the browser yourself, hands-free, under the same boundaries (see Automated vs Manual).

## Material Decision Rule

When this skill reaches a material fork, name the realistic options, recommend the strongest path, and explain why the main alternatives are weaker before committing.

Ask before choices that affect spend beyond an approved budget, provider routing, source of truth, list quality, campaign direction, client-facing output, live systems, scraping or account risk, or legal/compliance risk. For low-risk reversible choices, state the recommendation and proceed. When asking, use the native Interactive Inputs / Choice Prompts pattern: recommended option first and labelled, short choices, custom answer last.

## Activity Log Protocol

Before doing pool work, **read** the pool log `profiles/_mailbox-pool/activity-log.md` (its CURRENT STATE block), and, when the work touches a specific client, that client's `profiles/<client>/activity-log.md` too. After any material step (a tranche added, a group assigned, promoted or released, an alert acted on), **append** a one-line entry (newest first) to the relevant log and refresh its CURRENT STATE. Status vocab: CREATED / UPDATED / EXISTS / PENDING / BLOCKED / DONE / CANCELLED / NOTE. Record status, point to the artifact, don't dump output. Full protocol: `client-activity-log.md`.

## Canonical Paths

- **The pool sheet**: title **"Cold Email Mailbox Pool"**, id `<FNNL_MAILBOX_POOL_SHEET_ID>`. **This sheet does not exist yet.** The operator must create it once, build the three tabs to the column contract in "The Google Sheet" below, and replace the `<FNNL_MAILBOX_POOL_SHEET_ID>` placeholder here with the real spreadsheet id. Until that is done, every pool operation is blocked, so say so plainly rather than improvising a different store. Read/write it with the `google-docs` MCP (`readSpreadsheet` / `writeSpreadsheet`; see **Writing rows (HARD RULE)** below, and do NOT use `appendRows` on the data tabs).
- **The per-client tracker**: the separate "Cold Email Mailbox Tracker" sheet, id `<FNNL_MAILBOX_TRACKER_SHEET_ID>`. **This one also has to be created by the operator** and its id filled in here. It is deliberately SEPARATE from the pool sheet: pool inventory is speculative and cross-client, while the tracker is per-active-client cost and ROI. They meet at deploy time (below).
- **Pool home**: `profiles/_mailbox-pool/` (resolves under `outbound/`). The underscore sorts it apart from real clients.
- **Scripts**: `scripts/pool_lib.mjs` + `scripts/pool_allocate.mjs` + `scripts/pool_warmth.mjs` + `scripts/pool_alerts.mjs` + `scripts/pool_cutover.mjs` (resolve under `outbound/`). These are already on disk and are pure logic.

All `profiles/...`, `scripts/...`, `client-activity-log.md` references resolve under `outbound/` per the repo path rule. A `/<name>` reference means that skill in `.claude/skills/`.

## The three-stage domain lifecycle (TLDs are fixed)

| Stage | TLD | Purpose | Provisioned | Auto-renew | Rotation |
|---|---|---|---|---|---|
| **1: TEST / disposable** | **`.co` (hard rule)** | Cheap domains used heavily up front to find a working angle. **Pre-warmed in advance, in tranches.** | Fresh `.co` via the provisioning flow | **OFF, always** (disposability depends on it); alert before expiry for keep-or-drop | Disposable, so send from **all** mailboxes (no rested insurance half) |
| **2: PROVEN / long-term** | **`.com` (always fresh)** | Reached when an angle works. Long-term generic domain. | Fresh `.com` via the flow | ON | Mirror-half rotation (Batch N.1/N.2) via the inbox manager |
| **3: BRANDED / client-owned** | client `.com` (e.g. `getclientbrand.com`) | The client's own brand. | Fresh, always warmed fresh (~3 weeks) | ON | Mirror-half rotation |

**Branded always needs fresh warmup.** There is no shortcut, because a brand-new domain is a brand-new domain. The bridge and thread-aware cutover (below) are what remove the launch gap and prevent dropped replies, NOT skipping warmup.

**The bridge (no launch gap, no dropped replies).** When promoting Stage N to N+1: provision and warm the new-stage domains *in parallel while the current stage keeps sending*. On cutover, point **new** sends at the new-stage mailboxes, but **let the old-stage in-flight sequences and open reply threads finish** before retiring the old mailboxes. `pool_cutover.mjs` is the gate that says when the old mailboxes are safe to retire.

## Data model + how it maps to the sheet and the sending platform

Every domain and mailbox carries: **stage** (1/2/3), **group_id**, **assigned_client** (or `pool` = unassigned), **market** (controlled vocabulary), **status**, and **prior-use history** (previous client + market + release date). The **Google Sheet is the source of truth** for all of it. Sending-platform **tags** mirror the quick-filter dimensions (`stage-1/2/3`, `group-<id>`, `market-<slug>`) so you can filter senders in the platform's UI, but the sheet, not the tags, holds the timelines, prior-use, and cooldown. Apply the tags with whatever tagging path the sending platform's inbox manager documents; if that platform has no tag API, the tags are a convenience the sheet does not depend on.

- **group_id** = the unit you allocate to one client. It is NOT the rotation half. Rotation halves (`Batch N.1/N.2`) are applied *within* a client's deployment by the inbox manager. A Stage-1 group default is **6 domains / 12 mailboxes** (2 mailboxes/domain, locked).
- **market** is a **fixed enum** (dropdown on the sheet), sourced from the client's `client-profile.yaml` ICP, never free text. The same-market isolation guard matches on this exact value; "fintech" vs "financial services" as free text would silently slip the guard, so the vocabulary is controlled. Extend the list in the sheet dropdown and in `pool_lib.mjs MARKETS` together.
- **status** ∈ `provisioning | warming | ready | deployed | quarantined | retired`.
- **prior_use_history** is a compact JSON-array string, e.g. `[{"client":"client-a","market":"SaaS / Software","released":"2026-03-01"}]`.

## Grouping + isolation (the core new logic)

Enforced at allocation by `pool_allocate.mjs find`:

1. **One active client per group.** Only groups whose mailboxes are unassigned (`assigned_client = pool`) are candidates. Never assign a group already active for another client.
2. **Same-market isolation.** Never put a *second* client into a market already held by a different **deployed** client (prospect-pool overlap plus sender-identity confusion). The tool BLOCKS this by default; override only with an explicit decision, and then dedup at the list level (next point).
3. **Recycle cooldown.** A released group is quarantined, tagged with the prior client's market, and **blocked from reassignment to the same market for 90 days**, and must be **re-warmed** before reuse. If it can't be cleanly recycled, mark it `retired`. (`pool_allocate.mjs release` produces the exact quarantine and cooldown updates.)
4. **Ready-only.** Every mailbox in the group must clear the 21-day warmup ready gate (`pool_warmth.mjs`). Never deploy an un-warmed mailbox.

> **Note (not built here):** when you *do* knowingly run two clients in the same market at once, dedup and suppress the prospect lists at the **list-build level** so the same prospect isn't hit by both. That's a list-build concern, handled in `/lead-source-strategy` + `/list-quality-scorecard`, not in this skill.

## Deploy / promote playbook (the operating procedure)

1. **Pre-warm a Stage-1 tranche (ahead of demand).** Decide a tranche size **matched to near-term pipeline** (never speculatively at full scale, because idle warming is the worst burn). For each group: provision **6 `.co` domains** with auto-renew OFF, 2 mailboxes each, via the registrar + mailbox-provider provisioning flow, at the **70/30 Google/Microsoft** pool mix (whole domains stay on one provider, so ~4 Google + 2 Microsoft domains). Apply persona assets via `/mailbox-profile-generator`, import and warm via the sending platform's inbox manager, then log each domain and mailbox into the sheet as `stage 1, group <id>, assigned_client pool, status warming`. Tag `stage-1` + `group-<id>` on the sending platform.
2. **New client signs.** Read the client's market from `client-profile.yaml`. Run `pool_allocate.mjs find`, then assign the recommended ready group (set `assigned_client`, `market`, `status = deployed` in the sheet; create the sending platform's client-access entity; log the mailboxes into the per-client tracker). Launch via the sending platform's campaign-upload skill. **This is the days-not-weeks payoff.** When the ready group cannot carry the pace of the client's capacity request (`run_state.capacity_request.daily_sends_needed`), the whole wave still launches on it: record what the group delivers as `allocated_daily_sends`, report the days to cover, and let the runway stretch. The wave is never cut to fit the group; more capacity is another ready group or a fresh fleet sized by `/mailbox-mix-strategy`, bought within the setup total the operator approves (Aaron process alignment, operator directive 2026-09-22).
3. **Angle proves → Stage 2.** Provision a fresh **`.com`** group via the flow and warm it in parallel while the `.co` campaign keeps running. When ready, cut over: new sends on the `.com` mailboxes; run `pool_cutover.mjs` against the `.co` campaign's leads until `safe_to_retire = true`; then set the `.co` group `status = retired` (or `quarantined` if recyclable).
4. **Long-term → Stage 3 (branded).** Provision and warm the client's branded `.com` in parallel; bridge with the live Stage 1/2 campaign; cut over the same thread-aware way.
5. **Client churns / campaign ends.** `pool_allocate.mjs release`, then write the quarantine + 90-day cooldown + prior-use updates to the sheet, and re-warm before any reuse.

## The Google Sheet (source of truth)

Three tabs, built once by the operator. Header rows are frozen; enum columns are dropdown-validated; auto-calc columns are formulas. **Scripts and operators fill the input columns only and never overwrite the formula columns.**

- **DOMAINS** (`A:S`): `domain, tld, stage, group_id, registrar, acquisition_date, cost_usd, expiry_date, auto_renew, domain_age_days*, spf, dkim, dmarc, tracking, forwarding, dns_ready*, assigned_client, market, status`. `*domain_age_days` = `TODAY − acquisition_date`; `*dns_ready` = `Y` only when SPF+DKIM+DMARC are all `Y` (the launch gate; tracking and forwarding are tracked but don't gate).
- **MAILBOXES** (`A:P`): `handle, parent_domain, stage, group_id, provider, in_smartlead, warmup_start_date, days_warmed*, warmup_health, daily_cap, ready*, assigned_client, market, status, prior_use_history, last_health_check`. `*days_warmed` = `TODAY − warmup_start_date`; `*ready` = `Y` only when `days_warmed ≥ 21` AND `warmup_health = good` AND `in_smartlead = Y` (the deliverability gate, mirrored exactly). **Column-name note:** `in_smartlead` is a legacy name that simply means "is this mailbox connected in the sending platform?". `pool_lib.mjs` and the sheet formulas both key off that exact string, so **do not rename it**; read it as the generic sending-platform-connected flag.
- **DASHBOARD**: counts by stage × status (mailboxes + domains), monthly **burn rate** (see the rate-card note below), **ready-and-unassigned per stage** (free inventory at a glance), and **alerts** (Stage-1 `.co` expiring ≤21d, Stage-1 `.co` with auto-renew ON, mailboxes overdue a health check). The **same-market-conflict** cell and the alert detail are refreshed by `pool_alerts.mjs` (a plain formula can't count distinct clients per market).

**Writing rows (HARD RULE).** The computed columns are open-range `ARRAYFORMULA`s anchored in row 2 that spill down: `domain_age_days` (DOMAINS `J`) + `dns_ready` (DOMAINS `P`), and `days_warmed` (MAILBOXES `H`) + `ready` (MAILBOXES `K`). So for every write: (1) **never use `appendRows`** on DOMAINS/MAILBOXES, because it keys off the spilling formula columns and lands new rows near row 1000. Find the next free row by reading **column A** (the key) and `writeSpreadsheet` there. (2) **Write the input sub-ranges only** (DOMAINS `A:I`, `K:O`, `Q:S`; MAILBOXES `A:G`, `I:J`, `L:P`), and **never** the formula columns (DOMAINS `J`/`P`, MAILBOXES `H`/`K`), because writing into them overwrites the spill, `#REF!`s the whole column, and kills the `ready` gate. The spill fills the computed cells for the new row automatically. (This behaviour was verified live against a Google Sheet built to this exact contract; re-confirm it on the first write to FNNL's own sheet.)

## Helper scripts (the new layer only)

All are **pure logic, no network**. The agent reads the sheet (google-docs MCP) and the sending platform's data (its own MCP or REST), pipes JSON in, and writes results back. Provisioning, warmup, and tagging reuse the stack's own skills and scripts.

| Script | Run | Does |
|---|---|---|
| `pool_lib.mjs` | (imported) | Column contract + deliverability constants (21d, ~30/50 cap, 15-min gap, 90d cooldown, 6/12 group, 70/30 mix) + helpers. Change a number ONLY when the source skill changes. |
| `pool_allocate.mjs` | `find\|release <payload\|->` | Allocation + the 4 isolation rules; and release → quarantine + 90-day cooldown + prior-use. |
| `pool_warmth.mjs` | `<payload\|->` | days-warmed + the ready flag + suggested status transitions. |
| `pool_alerts.mjs` | `<payload\|->` | Same-market conflicts, expiry, auto-renew anomalies, burn rate, ready-and-unassigned, for the DASHBOARD. |
| `pool_cutover.mjs` | `<payload\|->` | Thread-aware cutover: in-flight sequences + unanswered replies on the old-stage mailboxes → `safe_to_retire`. Detection only; the operator confirms the retire. |

**The agent's loop** for any pool op: `readSpreadsheet` the relevant tab(s), then (for warmth and cutover) pull warmup status and campaign leads from the sending platform, pipe JSON to the script, apply the returned updates with `writeSpreadsheet` (input sub-ranges only, see **Writing rows**) plus the platform's tagging path, and write the activity log.

## Automated vs Manual

**Automated (API / MCP, hands-free):**
- Domain availability + purchase with **auto-renew OFF** via the registrar's provisioning skill.
- Mailbox create + assign at the mailbox provider; sending-platform import + warmup config; warmup, health and blacklist reads.
- Stage/group/market **tag mapping** and **client-access create**, where the sending platform exposes them.
- Google Sheet build / read / write / dashboard (google-docs MCP).
- Allocation + isolation, warmth/ready, alerts, and cutover **detection** (the `pool_*.mjs` tools).

**Manual / operator (hard boundaries):**
- **Funding a provider wallet or paying for mailbox capacity** (card).
- Any sending-platform step that is browser-only because it has no public write route (for example assigning mailboxes to a client-access entity, setting a per-mailbox minimum gap, or campaign tag and folder). Finish these in the browser yourself, hands-free, under the same boundaries.
- The cutover **retire** decision (after `pool_cutover.mjs` says safe) and pressing campaign **Start**.
- Re-authenticating the google-docs MCP if its token lapses. If the OAuth app is in Testing mode the token is short-lived, so recommend publishing it to Production to make it permanent.

## Preflight (verify, ask only if missing)

Before any spend: confirm the registrar, mailbox provider, sending platform and `google-docs` MCPs are reachable (a cheap read each); confirm the provisioning skill for `run_state.infrastructure_stack` is present; read keys from env or `scripts/.env` (never hardcode). **Also confirm the pool sheet exists and its id has replaced `<FNNL_MAILBOX_POOL_SHEET_ID>`**, since that is the most common blocker on a fresh workspace. Then price the run from FNNL's real rate card (per-mailbox monthly at the chosen provider, and `.com` / `.co` first-year and renewal at the chosen registrar). **`.co` renewal is typically far more expensive than its first year, which is exactly why Stage-1 auto-renew is OFF and Stage-1 is disposable.** Confirm that holds at FNNL's registrar before relying on it.

## Deliverability mirror (no invented numbers)

Ready gate **21 days** plus warmup ACTIVE/`good` plus connected. Per-mailbox **~30 sends/day** after warmup (12-minute spacing), per-mailbox **min gap 15**, campaign **max 250 new leads/day**. DNS launch gate = **SPF + DKIM + DMARC**. Retire rules: domain under 30 days old and blacklisted → replace; over 90 days → repair; bounce over 3%; reply under 1% after 200 sends. **Honest note:** an earlier brief mentioned a "hard cap 50/mailbox"; that number is not in `/anthropic-skills:cold-email-deliverability` (the real figure is ~30/day). This skill uses ~30/day and documents 50 only as a not-to-exceed ceiling, never a target. If those skills change, change `pool_lib.mjs` to match, not the other way around.

**Warmup preset.** Use whatever warmup preset the mailbox provider's own native export carries into the sending platform, and do not reset it to a weaker default through the platform's public API. Record the preset once for FNNL's provider so the fleet stays consistent. (Reference point from a previous stack, for shape only: one provider's recommended preset was Reply 75 / Max-per-day 35 / Min-Max 20-30 / Rampup +3 / Daily-reply 15, and overwriting it with an older 40/5/20 default was a known regression.)

## Rate card (previous-stack reference, re-price before use)

The DASHBOARD burn-rate math needs per-unit costs. These are the numbers the sheet was originally built with, from a **different company's** accounts, so treat them as placeholders with the right order of magnitude and **replace each one with FNNL's actual price** once `/stack-setup` names the registrar and mailbox provider:

| Line item | Previous-stack figure | Replace with |
|---|---|---|
| Mailbox, monthly (Google or Microsoft, flat) | $3.00 | FNNL's `mailbox_provider` rate |
| Mailbox, monthly (second provider in a split fleet) | $4.50 | FNNL's second provider rate, if any |
| `.com` domain, first year | $8.88 | FNNL's `registrar` rate |
| `.co` domain, first year | $3.48 | FNNL's `registrar` rate (and check the renewal price) |

Keep the tracker's rate card and this one identical, or the burn rate and the per-client cost will disagree.

## Integration map

```
/mailbox-mix-strategy ─┐
                       ▼
/cold-email-kickoff ─► [mailbox-pool-staging] ─(pool hit? assign + launch)─► sending platform: campaign upload
        │                    │  ▲                                                   ▲
        │       (pool miss)  ▼  │ reads ready groups                                │
        └─► registrar + mailbox provider ─► /mailbox-profile-generator ─► sending platform: inbox manager ─► per-client cost tracker
                (buy, auto-renew OFF)            (persona assets)         (import / warmup / tags / client)

Shared state:  client-profile.yaml run_state · stack-contract.yaml · profiles/_mailbox-pool/ · "Cold Email Mailbox Pool" sheet · sending-platform tags
Reads:         /mailbox-mix-strategy, /anthropic-skills:cold-email-deliverability (the numbers), the sending platform's API (warmup/leads)
Called by:     /cold-email-kickoff (check pool first), /cold-email-weekly-rhythm (capacity/rotation), /continue-client (resume)
```

## Safeguards

- **Never deploy an un-warmed mailbox** (the ready gate is the allocation precondition).
- **Pre-warm Stage 1 in tranches sized to near-term pipeline**, never speculatively at full scale, because idle warming is the worst burn. The DASHBOARD's ready-and-unassigned count plus the burn rate make idle inventory visible; keep it lean.
- **Auto-renew OFF on every Stage-1 `.co`**, with expiry alerts (DASHBOARD + `pool_alerts.mjs`).
- **Respect the deliverability caps** (~30/day/mailbox, min gap 15) and never exceed them; 50 is a ceiling, not a target.
- **Retire, don't fight, burned domains** (mirror the deliverability retire rules).
- **Isolation is non-negotiable:** one active client per group; no second client in a live market without an explicit override plus list-level dedup; 90-day same-market cooldown on recycled groups.
- **Orchestrate, never duplicate.** If you find yourself writing domain-buy, mailbox-create, or warmup logic, stop and call the stack's own skill.
- **Never guess a vendor.** An empty slot in `stack-contract.yaml` blocks the step; route to `/stack-setup` instead of substituting a tool from a worked example.

## What to do next

- Pre-warming a tranche → route the buy/create/warm to `/mailbox-mix-strategy`, the registrar + mailbox-provider provisioning skill, `/mailbox-profile-generator`, and the sending platform's inbox manager, then log to the pool sheet.
- Assigning to a signed client → after assignment, continue to `/campaign-copywriting` and the sending platform's campaign-upload skill, and log the mailboxes to the per-client cost tracker.
- A promotion → run the bridge, then gate the retire on `pool_cutover.mjs`.
- A weekly check → this skill's DASHBOARD feeds `/cold-email-weekly-rhythm`'s capacity and rotation decision.

## Related skills

- `/mailbox-mix-strategy`: decides the Google/Microsoft mix and the fleet size for a signed client; this skill sets the *pool's* speculative pre-warm mix (70/30) and decides *how many* groups.
- The registrar + mailbox-provider provisioning skill activated by `/stack-setup`: buys domains and creates mailboxes for each group. Orchestrated, never duplicated.
- `/mailbox-profile-generator`: persona assets applied before mailboxes reach the sending platform.
- The sending platform's inbox manager: import, warmup, the `Batch N.1/N.2` rotation split, client access, tags. This skill reuses it for everything sender-side.
- `/anthropic-skills:cold-email-deliverability` + `/email-deliverability-audit` + `/deliverability-incident-response`: the deliverability rules this skill mirrors.
- `/cold-email-kickoff`: checks the pool first at the infra step. `/continue-client`: considers the pool when resuming. `/cold-email-weekly-rhythm`: reads the DASHBOARD for capacity and rotation.
- `/stack-setup`: declares which tool fills each capability slot. Everything above depends on it.
- `/autonomous-execution-policy`: the proceed-vs-stop, spend-ceiling, and browser-fallback policy this skill defers to.
