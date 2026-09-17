---
name: deliverability-test-public
description: Smartlead-only inbox type comparison. Compares reply rates, bounce rates, and positive reply rates by inbox type using Smartlead exports/API data. Use only when run_state.sending_platform = Smartlead.
---

# Deliverability Test Public

This skill is Smartlead-only.

If `run_state.sending_platform` is EmailBison, Instantly, or Other, do not run it. Use `/email-deliverability-audit` and the selected platform's native analytics instead.

## Purpose

Compare performance by inbox type:

- Gmail / Google Workspace
- Outlook / Microsoft 365
- SMTP or provider-connected senders

Use it to report:

- Which sender type gets replies?
- Which sender type bounces?
- Which sender type should be retired or kept as insurance?

## Inputs

Collect from Smartlead export/API:

```text
email, sender_type, sent, replies, positive_replies, bounces, campaign_id, tags
```

Use a 7-day lookback for weekly checks and 30 days for deeper decisions.

## Steps

1. Confirm `run_state.sending_platform = Smartlead`.
2. Export sender-level analytics from Smartlead.
3. Group rows by sender type.
4. Calculate:
   - sent
   - replies
   - positive replies, if classified
   - bounces
   - reply rate
   - positive reply rate
   - bounce rate
5. Compare only groups with at least 500 sends. Smaller groups are too noisy.

## Output

```markdown
# Smartlead Inbox Type Comparison - <date>

| Type | Inboxes | Sent | Replies | Positive replies | Bounces | Reply % | Positive % | Bounce % |
|---|---:|---:|---:|---:|---:|---:|---:|---:|

## Takeaways
- <what is winning>
- <what is risky>
- <what needs more sample>

## Actions
- <retire, keep, or investigate>
```

## Rules

- Do not call raw reply rate a win if positive reply rate is weak.
- Do not compare groups with tiny sample sizes.
- Do not retire an inbox type from one bad day.
- If one sender type is clearly failing, route to `/smartlead-inbox-manager`.

## What To Do Next

If one type is underperforming, use `/smartlead-inbox-manager` to retag, retire, or keep senders in insurance.

If the issue may be DNS, copy, or list quality, run `/email-deliverability-audit`.

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short — record status, not raw output. Full protocol: `client-activity-log.md`.
