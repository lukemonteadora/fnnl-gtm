---
name: mailbox-mix-strategy
description: Provider-agnostic strategy gate for choosing the Google Workspace vs Microsoft 365 mailbox purchase mix, and for sizing the total warmed mailbox fleet, before any cold email infrastructure setup spends money. Use before ANY registrar or mailbox-provider setup skill runs, whenever domains or inboxes are about to be bought.
---

# Mailbox Mix Strategy
## Canonical Profile Root

All profiles/<business-slug> paths in this skill resolve under:

```text
<outbound>/profiles
```

Here `<outbound>` is the root of this skill library - resolve it to wherever the library is currently checked out (local Documents, OneDrive, or a git worktree); never hardcode an absolute path. Do not create client profiles under a `profiles/` folder at your current working directory.

Use this skill before any domain or inbox purchase. It first sizes the total warmed mailbox count from the client's daily send target (the high-volume default), then decides how many of those are Google Workspace and how many Microsoft 365 based on ICP company size and segment.

This is a purchase-planning skill only. It does not configure provider accounts, domain records, authentication records, warmup, exports, or sending-platform imports.

## Interaction Policy

Defers to `/autonomous-execution-policy`. Under `run_state.execution_mode = auto_execute`, proceed without pausing: pick the strongest option per the rubric, record it, continue; never re-ask a recorded decision; confirm spend once against `run_state.spend_ceiling_usd` then auto-approve within it; stop only for the policy's hard-stops. On a long async wait (e.g. the 2-week warmup, mailbox provisioning), background-poll and move to other productive work, never idle.

**Mix already recorded → use it silently.** If `run_state.mailbox_mix_strategy` is ALREADY recorded (`google_percent`/`microsoft_percent` and `provider_ranges` present), use it as-is and skip every question below, and never re-ask. Under `auto_execute`, when the mix is MISSING, choose the recommended mix per this skill's own Strategy Defaults logic, record it to `run_state`, and proceed. Do not pause for operator selection. The Direct-Start Question is for `review_gates` only (or a genuine no-default fork).

**Fleet-sizing is a SEPARATE gate from the split (do not let a recorded split skip it).** The skip above covers only the Google/Microsoft split. The high-volume Fleet Sizing step below is gated independently: if `run_state.mailbox_mix_strategy.mailbox_count` and `daily_send_target` are NOT recorded (the case for any client whose split was set under the old skill, before fleet-sizing existed), run Fleet Sizing now and record them, even when the split is already present. Treat a missing `mailbox_count` as a re-trigger for the fleet-sizing portion only, never as a reason to re-ask the split. (A stale profile can also be routed through `/cold-email-flow-audit`, which will detect the missing fleet-sizing and route back here.)

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short: record status, not raw output. Full protocol: `client-activity-log.md`.

## Hard Gate

Every inbox infrastructure skill must check for:

```yaml
run_state:
  mailbox_mix_strategy:
    google_percent: <int>
    microsoft_percent: <int>
    basis: icp_company_size|operator_override
    confidence: low|medium|high
    rationale: <short explanation>
```

If `run_state.mailbox_mix_strategy` exists, use it.

If it is missing, stop before any availability check, domain purchase, inbox purchase, provider setup, or spend approval, then run this skill.

If setup was started directly and ICP context is incomplete, ask the direct-start question below.

## Inputs

Read available context in this order:

1. `profiles/<business-slug>/client-profile.yaml`
2. `profiles/<business-slug>/campaign-plan.md`
3. `profiles/<business-slug>/campaign-strategy.md`
4. The user's latest stated ICP, employee-size range, and target segment
5. The planned domain count and inbox count

Do not ask for anything already present in those files.

## Strategy Defaults

Use these as the starting recommendation:

| ICP pattern | Default purchase mix |
|---|---|
| Enterprise-heavy ICP, usually 500+ employees, corporate operations, regulated industries, public sector, IT, finance, insurance, healthcare, or logistics | 30% Google / 70% Microsoft |
| Mid-market ICP, usually 100-500 employees | 50% Google / 50% Microsoft |
| SMB or founder-led ICP, usually under 100 employees, agencies, ecommerce, local services, startups, creator businesses, or lean software companies | 70% Google / 30% Microsoft |
| Mixed or unclear ICP | 50% Google / 50% Microsoft |

Normal recommendations should not exceed 80/20 unless the user explicitly overrides the mix.

Say clearly when the recommendation is only a guess based on headcount or segment. Company size is a useful clue, not proof.

## Direct-Start Question

Scope: this operator ask is for `review_gates` (or a genuine no-default fork). Under `auto_execute`, per the Interaction Policy, do not ask. Choose the recommended mix, record it, and proceed.

When no prior recommendation exists, ask exactly:

```text
No mailbox mix strategy is saved yet. Pick the Google Workspace / Microsoft 365 mix before buying inboxes.

A. [Recommended] Guess based on ICP size: <Google %> / <Microsoft %>
B. Balanced default: 50% Google / 50% Microsoft
C. Manual override: user provides exact percentages
D. Custom answer
```

If the recommendation is based only on headcount or segment, add:

```text
This is a guess, not evidence. It is good enough to avoid a blind default, but weak enough to revisit after campaign data.
```

## Fleet Sizing to the Daily Send Target (high-volume default)

Before the Google/Microsoft split (above) chooses the mix, this step sizes the total warmed mailbox count the client needs. Under the high-volume default (doctrine: `high-volume-default-doctrine`), a client's normal target is **2,000 to 30,000 emails SENT per day**, spread across a few big campaigns (1,000 up to 20,000 leads per campaign). The operator picks a number inside that band. Default to the low end (~2,000/day) to start, then ratchet the fleet up as warmup graduates and the offer proves.

**Capacity is the binding constraint.** Safe daily sends equal active warmed mailboxes times the safe per-mailbox rate. Two multipliers set the fleet size:

- **Safe per-mailbox rate is roughly 15 to 20 cold sends per mailbox per day.** Plan with that band, but read the real number from the warmup / campaign config for the locked platform. Never hardcode it.
- **Active-rotation fraction is roughly 0.5.** Only ONE rotation mirror-half sends at a time (see the Rotation Batch Split below and `mailbox-rotation-batch-rule`), so active mailboxes are about total x 0.5.

**Fleet-sizing formula:**

```text
total warmed mailboxes  =  daily target D  /  safe-per-mailbox-rate (~15-20)  /  active-rotation-fraction (~0.5)
```

Worked examples (at ~15-20 sends/mailbox/day, ~0.5 active, and an example rate of ~$3/mailbox/mo). The
per-mailbox rate is an **illustration, not FNNL's price**: read the real rate from whichever provider fills
the `mailbox_provider` slot in `outbound/stack-contract.yaml`, and if that slot is
empty, run `/stack-setup` before quoting any spend figure.

| Daily send target | Total warmed mailboxes | Recurring mailbox spend | Plus |
|---|---|---|---|
| 2,000/day  | ~200          | ~$600/mo           | weeks of warmup runway |
| 10,000/day | ~1,000        | ~$3,000/mo         | weeks of warmup runway |
| 30,000/day | ~3,000-4,000  | ~$9,000-12,000/mo  | weeks of warmup runway |

**Surface this LOUDLY before any infra purchase.** A per-client 2k-30k/day target is a MAJOR scale-up, not a config flip. For scale: a comparable agency sending account, measured 2026-07-07 in a previous operation, ran only ~1,000-1,300 emails/day **in total across every client**, with bounce brushing the 3% ceiling. That is a reference data point from someone else's account, not FNNL's ground truth, but it is the right order of magnitude to compare against. FNNL's own current daily volume is whatever its sending platform actually reports, so read it rather than assuming. Either way the sized fleet is a real recurring-spend and time decision, not a setting. State the three numbers explicitly to the operator, in one place, before buying anything: (1) the resulting fleet size, (2) the recurring per-mailbox spend at FNNL's actual provider rate, and (3) the weeks of warmup runway before that fleet can send at target. Under `review_gates` this is an operator decision. Under `auto_execute` it stays bounded by `run_state.spend_ceiling_usd`: if the sized fleet's recurring or upfront cost would exceed the ceiling, surface it and hold rather than silently buying a smaller fleet.

**The split applies WITHIN the sized fleet.** Everything else in this skill (the Google/Microsoft mix, the Rounding Rules) operates on this total, never the reverse. The sized fleet then splits into two warmed mirror halves per the Rotation Batch Split below (`mailbox-rotation-batch-rule`), which is exactly why the active-rotation fraction is ~0.5. Size for the target, split for the provider mix, then halve for rotation.

## Rounding Rules

Convert percentages into domain groups, not individual inbox tricks.

- Preserve `INBOXES_PER_DOMAIN=2` unless the user explicitly changes it.
- For small pools, keep at least one domain on the minority provider when the recommendation is mixed.
- Round to the nearest whole domain count.
- Write explicit provider ranges for setup, for example `GOOGLE_DOMAINS=1-4` and `MICROSOFT_DOMAINS=5-12`.

## Rotation Batch Split (HARD RULE)

Every batch of mailboxes a client provisions (any count of domains or inboxes) is split into **two warmed,
mirror-image halves**: `Batch N.1` (primary) and `Batch N.2` (backup/reserve), where N is the client's Nth
provisioning batch. This is the rotating-mailbox-batch strategy: only one half sends in live campaigns at a
time while the other rests as a warmed backup, then they rotate, so no mailbox or domain gets maxed out.

Plan the split at purchase time so the halves come out balanced:

- For **EACH `(provider × type)` cell** (each combination of a mailbox provider and Google-vs-Microsoft, so
  with two providers you get four cells), half the mailboxes go to `Batch N.1` and half to `Batch N.2`. Both
  halves must end with the same provider mix AND the same Google/Microsoft mix. Example: 48 mailboxes = 30
  Google + 18 Microsoft → each half = 15 Google + 9 Microsoft (and balanced per provider too).
- **Keep whole domains together.** Both inboxes of a domain go in the same half, so resting a half rests
  whole domains. Because `INBOXES_PER_DOMAIN=2`, split each provider×type cell by DOMAIN: `floor(n/2)`
  domains to each half, then distribute any odd-cell leftovers so the two halves stay balanced on total,
  on Google/Microsoft mix, and on provider mix. Don't blindly push every spare to one half, because across
  several odd cells that skews the split. If the sending-platform pack activated by `/stack-setup` ships a
  rotation-split helper script, use it rather than splitting by hand.
- This is why the mix is expressed in **whole domain groups** (see Rounding Rules): it keeps the rotation
  split clean. Aim for an even domain count per provider×type cell where the purchase size allows.

The split is recorded here, but the `Batch N.1`/`Batch N.2` tags are physically applied to the senders later,
at import, by the sending platform's inbox-manager skill (whichever pack `/stack-setup` activated for the
`sending_platform` slot). Not here. This skill only ensures the planned purchase can be cleanly halved and
notes the intended split.

## Output

Save or paste this block into `run_state` and, when a campaign plan exists, into `campaign-plan.md` under Infrastructure Readiness:

```yaml
mailbox_mix_strategy:
  google_percent: <int>
  microsoft_percent: <int>
  basis: icp_company_size|operator_override
  confidence: low|medium|high
  rationale: <short explanation>
  daily_send_target: <int emails/day; high-volume default band 2000-30000, start low>
  mailbox_count: <int total warmed mailboxes sized from daily_send_target>
  inboxes_per_domain: 2
  provider_ranges:
    google_domains: <range or none>
    microsoft_domains: <range or none>
  decided_at: <YYYY-MM-DD>
```

Then continue to the locked inbox infrastructure setup skill.

## What To Do Next

Continue to the infrastructure setup skill named by `run_state.infrastructure_stack` for this client. If that
field is unset, resolve it from the `registrar` and `mailbox_provider` slots in
`outbound/stack-contract.yaml` and record it. **If either slot is empty, stop and route
the operator to `/stack-setup`**, and do not guess a registrar or a mailbox provider from a worked example.

Do not let any setup skill silently choose a Google/Microsoft split, and do not let it silently choose a
fleet size either.
