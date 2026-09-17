---
name: positive-reply-scoring
description: Smartlead positive reply scoring. Pulls replies from a Smartlead campaign, classifies each as positive/neutral/negative/OOO/bounce/unsubscribe using Claude, and reports the positive reply rate. Use for Smartlead campaigns only. For EmailBison campaigns, use /emailbison-positive-reply-scoring.
---

# Positive Reply Scoring
## Canonical Profile Root

All profiles/<business-slug> paths in this skill resolve under:

```text
<outbound>/profiles
```

Here `<outbound>` is the root of this skill library - resolve it to wherever the library is currently checked out (local Documents, OneDrive, or a git worktree); never hardcode an absolute path. Do not create client profiles under a `profiles/` folder at your current working directory.

This is the Smartlead version. If locked `run_state.sending_platform = EmailBison`, use `/emailbison-positive-reply-scoring`.

**Reply rate tells you if people are paying attention. Positive reply rate tells you if they want what you're selling.** This skill computes the second.

## Why this exists

A campaign can get 5% reply rate and still be a disaster. If 90% of those replies are "unsubscribe" and "not a fit," you're burning your domains for nothing.

The metric that matters is:
```
positive_reply_rate = positive_replies / total_sent
```

Compared side-by-side:
- Campaign A: 1% reply rate, 70% positive -> 0.7% positive reply rate
- Campaign B: 5% reply rate, 10% positive -> 0.5% positive reply rate
- Campaign A wins.

## Classification schema

See `reply-scoring-core.md` — **Classification schema** (the canonical bucket table, shared with the EmailBison version so the two never drift). Positive reply rate counts only `positive_interested + positive_soft + positive_referral`; exclude `ooo` + `bounce` from denominators. Classify only the first reply per lead.

## Inputs

- Smartlead API key (env: `SMARTLEAD_API_KEY`)
- Campaign ID to score
- Optional: client_id (if using a sub-client setup)
- Optional: date range (defaults to full campaign)

## Steps

### 1. Fetch all leads + replies from the campaign

Use the Smartlead API, Smartlead export, or the user's available connector to pull campaign leads and message history. Verify the method works before promising an output file.

The fetch must walk campaign leads, identify leads with replies, fetch message history for each replied lead, and write one object per first reply.
Output schema per reply:
```json
{
  "lead_id": "...",
  "email": "...",
  "lead_first_name": "...",
  "company": "...",
  "reply_time": "ISO timestamp",
  "reply_subject": "...",
  "reply_body": "... full text ...",
  "sequence_step": 1
}
```

### 2. Classify replies in the Claude Code conversation

Once the JSON is written, Claude (the one running this skill) reads the file and classifies each reply. For speed, fan out in batches of 20-30 via the Task tool (see `personalization-subagent-pattern` skill for fan-out mechanics).

Use the **Classification prompt** in `reply-scoring-core.md` (canonical, shared with the EmailBison version).

### 3. Aggregate + compute rates

Aggregate the classified JSON directly in the conversation or with the user's available spreadsheet/script tooling.

Output:
```
Campaign 12345 - Positive Reply Scoring

Total sent:              5,284
Total replies:              212 (4.01%)
  ooo/bounce (excluded):    34
  Net replies:             178

Breakdown:
  positive_interested:    22
  positive_soft:          31
  positive_referral:       8
  neutral_question:       14
  negative_notnow:        28
  negative_notfit:        52
  negative_hostile:        3
  unsubscribe:            20
  other:                   0

Positive reply rate:     1.15% (61 / 5,284)
Positive % of replies:   34.3% (61 / 178)
Negative hostile risk:    0.06% (3 / 5,284)
Unsub rate:              0.38% (20 / 5,284)

Benchmarks (B2B cold email):
  Good positive reply rate: >=1%
  Great: >=2%
  Hostile >0.3% or unsub >2% -> deliverability risk, pause campaign
```

### 4. Save to disk

Write aggregate results to:
```
profiles/<business-slug>/scores/<campaign-id>-<YYYY-MM-DD>.json
```

This builds a history so you can trend positive reply rate over campaigns.

### 5. Flag action items

At the end, surface:

- **Positive replies that need a human response** - list the top 10 `positive_interested` leads and their reply bodies. The user should reply to these within 30 seconds of seeing this report.
- **Referrals that need follow-up** - `positive_referral` labels. Add the referred contacts to a new outreach list.
- **Hostile flags** - any `negative_hostile` replies. Read them manually; consider pausing the inbox if someone is genuinely angry.
- **Unsubscribes** - confirm they're globally suppressed (Smartlead does this automatically, but double-check) and recorded in `suppression-list.csv` (see Suppression Write-Back).

## When to use this skill

- After a campaign has run for at least 14 days (otherwise sample is too small)
- When comparing two campaigns in an experiment (use the same cutoff date for both)
- Weekly as a quality check on running campaigns
- Before deciding to kill or scale a campaign

## Common gotchas

- **Don't trust reply rate alone.** A 5% reply rate from spam-trap replies and unsubscribes is worse than a 2% reply rate from real buyers.
- **Exclude OOO + bounce from denominators.** They're not real replies. The script does this automatically.
- **Smartlead's built-in AI categorization** exists but is less controllable. This skill uses Claude directly for transparency and prompt-tunable classification.
- **Small samples lie.** Below ~500 sent, the positive reply rate has too much noise. Wait for more volume before declaring winners/losers.
- **Classify only FIRST reply per lead.** If a lead replied, you replied, they replied again - only the first reply is the signal. Later messages are the conversation, not the scoring.

## Reply handling router

See `reply-scoring-core.md` — **Reply handling router** (canonical, shared with the EmailBison version): how each reply class routes to its next action and into `/lifecycle-copy`. For no-reply prospects, the re-engagement copy is `followups.yaml` from `/lifecycle-copy`.

## Suppression Write-Back

See `reply-scoring-core.md` — **Suppression write-back** (canonical, shared): append every `negative_notfit`, `negative_hostile`, `unsubscribe`, and `bounce` to `profiles/<business-slug>/suppression-list.csv` (never `negative_notnow` / `neutral_question`). The upload skills read this file at their List Gate / Suppression Gate, so every future campaign inherits these.

**Smartlead-specific:** after writing the suppression rows, push the same contacts to Smartlead's account-wide blocklist via `mcp__smartlead__smartlead_add_lead_to_global_blocklist` so they are blocked across every Smartlead campaign.

## What to do next

**Respond to every `positive_interested` reply within 30 seconds** of seeing it. Then `/experiment-design` to plan the next iteration based on what worked.

**If positive reply rate is <1% after 200+ sends:** the 1% rule failed. Run `/email-deliverability-audit` (are you reaching the inbox?) (check for vague CTAs, generic first lines, em dashes).

**Or wait:** this skill is the Wednesday task in `/cold-email-weekly-rhythm`. Run it weekly going forward.

## Related skills

- `/experiment-design` - uses positive reply rate as the success metric
- `/email-deliverability-audit` - if hostile + unsub are elevated, run this next
- `/emailbison-positive-reply-scoring` - EmailBison version of this workflow
- `/cold-email-weekly-rhythm` - ongoing reply and deliverability cadence

## Script Policy

No bundled Smartlead reply-fetch or aggregation script is required by this skill. If one is added later, verify the filename exists before telling an operator to run it.

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short — record status, not raw output. Full protocol: `client-activity-log.md`.
