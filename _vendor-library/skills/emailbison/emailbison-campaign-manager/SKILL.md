---
name: emailbison-campaign-manager
description: MCP-first campaign lifecycle management for EmailBison. Create, inspect, pause, resume, and compare campaigns. Use when managing active campaigns, monitoring performance, or doing campaign triage. CLI used only for bulk-pausing 5+ broken campaigns at once.
---

# EmailBison Campaign Manager

Use this skill when locked `run_state.sending_platform = EmailBison` or when the user asks to manage EmailBison campaigns.

All operations run through MCP tools (`mcp__emailbison__*`). Load them via ToolSearch before calling.

## Routing Rule: MCP vs CLI

**MCP** for everything except:
- Bulk-pausing or bulk-resuming 5+ campaigns simultaneously → CLI loop is faster and cheaper on tokens

**CLI bulk pause pattern:**

```bash
for id in 101 102 103 104 105; do
  bison campaigns pause --campaign-id $id
done
```

## Core MCP Operations

### List All Campaigns

```text
Tool: mcp__emailbison__list_campaigns
Params: {} (or add filters like status, page)
```

Returns campaign names, IDs, status, creation date.

### Get Campaign Details

```text
Tool: mcp__emailbison__get_campaign
Params: { "campaign_id": <id> }
```

### Get Campaign Stats

```text
Tool: mcp__emailbison__get_campaign_stats
Params: { "campaign_id": <id> }
```

Returns sent count, open rate, reply rate, bounce rate.

### Get Campaign Analytics (Cross-Campaign Comparison)

```text
Tool: mcp__emailbison__get_campaign_analytics
Params: { "campaign_ids": [101, 102, 103] }
```

Use this when the user asks "which campaign is performing best?"

### Create a Campaign

```text
Tool: mcp__emailbison__create_campaign
Params: {
  "name": "Campaign Name",
  "plain_text": true,
  "open_tracking": false,
  "reputation_building": true,
  "can_unsubscribe": true,
  "max_new_leads_per_day": 50
}
```

After creating, add sequence steps and senders via `/emailbison-campaign-upload-public`.

### Pause a Campaign (Single)

```text
Tool: mcp__emailbison__call_api
Extended tool: pause_campaign
Body: { "campaign_id": <id> }
```

### Resume a Campaign (Single)

```text
Tool: mcp__emailbison__call_api
Extended tool: resume_campaign
Body: { "campaign_id": <id> }
```

### Add Leads to a Campaign

```text
Tool: mcp__emailbison__call_api
Extended tool: add_leads_to_campaign
Body: { "campaign_id": <id>, "lead_ids": [1, 2, 3] }
```

For 500+ leads, use the CLI bulk path from `/emailbison-campaign-upload-public`.

### Remove Leads from a Campaign

```text
Tool: mcp__emailbison__call_api
Extended tool: remove_leads_from_campaign
Body: { "campaign_id": <id>, "lead_ids": [1, 2, 3] }
```

## Common Workflows

### "Which campaign is doing best?"

1. Call `mcp__emailbison__list_campaigns` to get all active campaign IDs.
2. Call `mcp__emailbison__get_campaign_analytics` with all IDs.
3. Rank by positive reply rate or reply rate depending on what the user wants.

### "Pause all broken campaigns"

If >4 campaigns need pausing, use CLI loop. If 1–4, use MCP `pause_campaign` via `call_api` for each.

### "Create a schedule for my campaign"

```text
Tool: mcp__emailbison__call_api
Extended tool: create_schedule (or update_schedule)
Body: {
  "campaign_id": <id>,
  "days": ["Monday","Tuesday","Wednesday","Thursday","Friday"],
  "start_time": "09:00",
  "end_time": "17:00",
  "timezone": "America/New_York"
}
```

If the schedule tool isn't in core tools, discover it first:

```text
Tool: mcp__emailbison__discover_tools
Params: { "query": "schedule" }
```

## Common Gotchas

1. **Resume ≠ Launch.** Resuming a paused campaign is fine. Launching a brand-new campaign should always go through manual QA in the EmailBison UI first.
2. **Sequence steps need to exist before resume.** A campaign with no steps will send nothing.
3. **Stats lag by up to 1 hour.** Don't judge performance in the first 24 hours.
4. **Bulk analytics are capped.** If the API limits cross-campaign comparisons, pull stats per campaign and aggregate locally.

## What To Do Next

- To upload leads and sequence: `/emailbison-campaign-upload-public`
- To score positive replies: `/emailbison-positive-reply-scoring`
- To manage sender emails and warmup: `/emailbison-inbox-manager`

## Related Skills

- `/emailbison-campaign-upload-public` - full campaign creation + lead import
- `/emailbison-inbox-manager` - sender email management
- `/emailbison-positive-reply-scoring` - reply classification and scoring
- `/emailbison-lead-manager` - lead search, update, and tagging

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short — record status, not raw output. Full protocol: `client-activity-log.md`.
