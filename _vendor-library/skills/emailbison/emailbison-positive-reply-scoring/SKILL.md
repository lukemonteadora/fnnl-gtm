---
name: emailbison-positive-reply-scoring
description: Pulls replies from an EmailBison campaign, classifies each reply as positive, neutral, negative, OOO, bounce, unsubscribe, or other, and reports positive reply rate. Use 14-21 days after an EmailBison campaign starts or when judging whether a campaign is working.
---

# EmailBison Positive Reply Scoring

Reply rate is not the score. Positive reply rate is the score.

This skill pulls campaign replies from EmailBison, classifies them, and calculates:

```text
positive_reply_rate = positive_replies / total_sent
```

## Inputs

- Campaign ID
- Optional date range

## Fetch Replies (MCP — primary)

Load `mcp__emailbison__list_replies` and `mcp__emailbison__get_campaign_stats` via ToolSearch.

Pull all replies for the campaign:

```text
Tool: mcp__emailbison__list_replies
Params: { "campaign_id": <campaign_id>, "per_page": 100 }
Paginate through all pages until exhausted.
```

For a specific lead's full thread:

```text
Tool: mcp__emailbison__get_reply
Params: { "reply_id": <id> }
```

If the dataset is large (>500 replies), export to CSV instead to avoid token bloat:

```text
Tool: mcp__emailbison__export_replies_csv
Params: { "campaign_id": <campaign_id> }
```

Then parse the CSV locally and run classification against the file.

## Fetch Sent Counts (MCP — primary)

```text
Tool: mcp__emailbison__get_campaign_stats
Params: { "campaign_id": <campaign_id> }
```

For full analytics breakdown (open rate, click rate, bounce breakdown):

```text
Tool: mcp__emailbison__get_campaign_analytics
Params: { "campaign_id": <campaign_id> }
```

## Fetch Replies (CLI fallback — use if MCP is unavailable)

```bash
bison campaigns replies --campaign-id <campaign_id> --pretty
```

## Fetch Sent Counts (CLI fallback)

```bash
bison campaigns stats --campaign-id <campaign_id> --pretty
```

## Classification Schema

See `reply-scoring-core.md` — **Classification schema** (the canonical bucket table, shared with the Smartlead version so the two never drift). Positive reply rate counts only `positive_interested + positive_soft + positive_referral`; exclude `ooo` + `bounce` from denominators. Classify only the first reply per lead.

## Classification Prompt

Use the **Classification prompt** in `reply-scoring-core.md` (canonical, shared with the Smartlead version).

## Output

```text
Campaign 123 - EmailBison Positive Reply Scoring

Total sent:              5,284
Total replies:             212
OOO/bounce excluded:        34
Net replies:               178

positive_interested:        22
positive_soft:              31
positive_referral:           8
neutral_question:           14
negative_notnow:            28
negative_notfit:            52
negative_hostile:            3
unsubscribe:                20
other:                       0

Positive reply rate:      1.15%
Positive share of replies: 34.3%
Unsubscribe rate:         0.38%
Hostile rate:             0.06%
```

## Action Items

Always surface:

- Positive replies needing human response.
- Referrals to add to a follow-up list.
- Hostile replies that may require pausing the sender.
- Unsubscribes that should be confirmed in EmailBison.

## Common Gotchas

1. **Do not count OOO as replies.** They are noise.
2. **Do not trust raw reply rate.** A high unsubscribe campaign is still bad.
3. **Small samples lie.** Under 500 sent is too early for judgment.
4. **EmailBison can mark interested replies.** Still classify manually when measuring campaign quality.

## Reply handling router

See `reply-scoring-core.md` — **Reply handling router** (canonical, shared with the Smartlead version): how each reply class routes to its next action and into `/lifecycle-copy`. For no-reply prospects, the re-engagement copy is `followups.yaml` from `/lifecycle-copy`.

## Suppression Write-Back

See `reply-scoring-core.md` — **Suppression write-back** (canonical, shared): append every `negative_notfit`, `negative_hostile`, `unsubscribe`, and `bounce` to `profiles/<business-slug>/suppression-list.csv` (never `negative_notnow` / `neutral_question`). The upload skills read this file at their List Gate / Suppression Gate, so every future campaign inherits these.

**EmailBison-specific:** confirm unsubscribes are honored in EmailBison (`can_unsubscribe` / opt-out).

## What To Do Next

Respond to positive replies quickly, then use `/experiment-design` to decide whether to scale, revise, or kill the campaign.

If locked `run_state.sending_platform = Smartlead`, this skill is off-path. Use `/positive-reply-scoring` instead.

## Related Skills

- `/emailbison-campaign-upload-public` - creates the campaign
- `/cold-email-weekly-rhythm` - operational cadence
- `/experiment-design` - uses positive reply rate as the decision metric

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short — record status, not raw output. Full protocol: `client-activity-log.md`.
