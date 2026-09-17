---
name: emailbison-lead-manager
description: MCP-first lead operations for EmailBison. Find, add, update, tag, and analyze leads. Use for single lead lookups, small batch imports, tag management, and lead analytics. CLI for bulk CSV imports of 500+ leads.
---

# EmailBison Lead Manager

Use this skill when locked `run_state.sending_platform = EmailBison` or when the user asks to find, add, update, or analyze leads in EmailBison.

All operations run through MCP tools (`mcp__emailbison__*`). Load them via ToolSearch before calling.

## Routing Rule: MCP vs CLI

**MCP** for:
- Finding a specific lead by email or ID
- Adding or updating 1–499 leads
- Tag operations on specific leads
- Analytics and counts
- Exporting leads to CSV

**CLI** for:
- Bulk CSV import of 500+ leads (token-efficient, runs server-side)

```bash
bison leads bulk/csv --file leads.csv --pretty
```

## Core MCP Operations

### Find a Lead by Email or ID

```text
Tool: mcp__emailbison__get_lead
Params: { "email": "john@company.com" }
# or
Params: { "lead_id": 1234 }
```

### List Leads with Filters

```text
Tool: mcp__emailbison__list_leads
Params: {
  "status": "active",       # active, unsubscribed, bounced
  "campaign_id": <id>,      # filter by campaign
  "tag": "hot-lead",        # filter by tag
  "per_page": 50,
  "page": 1
}
```

### Add a New Lead

```text
Tool: mcp__emailbison__create_lead
Params: {
  "email": "sarah@company.com",
  "first_name": "Sarah",
  "last_name": "Jones",
  "company": "TechCorp",
  "title": "Marketing Director",
  "linkedin_url": "https://linkedin.com/in/sarah-jones"
}
```

Custom variables (situation_line, value_line, cta_line) go in the same payload as additional fields. Confirm the custom variable exists in the workspace first — see Variable Creation below.

### Update a Lead

```text
Tool: mcp__emailbison__update_lead
Params: {
  "lead_id": 1234,
  "title": "VP of Sales"
}
```

### Add Tags to Leads

```text
Tool: mcp__emailbison__call_api
Extended tool: add_tags_to_leads
Body: { "lead_ids": [1, 2, 3], "tag_ids": [<tag_id>] }
```

Resolve tag names to IDs first:

```text
Tool: mcp__emailbison__call_api
Extended tool: list_tags
```

### Remove Tags from Leads

```text
Tool: mcp__emailbison__call_api
Extended tool: remove_tags_from_leads
Body: { "lead_ids": [1, 2, 3], "tag_ids": [<tag_id>] }
```

### Get Lead Analytics

```text
Tool: mcp__emailbison__get_leads_analytics
Params: { "campaign_id": <id> }
```

Returns aggregated lead performance: sent, opened, replied, bounced, unsubscribed.

### Count Before Export

Always count before a large export to know what you're pulling:

```text
Tool: mcp__emailbison__bulk_count
Params: { "resource": "leads", "filters": { "campaign_id": <id>, "status": "active" } }
```

### Export Leads to CSV

```text
Tool: mcp__emailbison__export_leads_csv
Params: { "campaign_id": <id>, "status": "active" }
```

The tool saves the file locally. Confirm the file path in the response before referencing it.

## Variable Creation

If a lead has custom variables (e.g. `situation_line`, `cta_line`), the variable must exist in the EmailBison workspace before import.

Check existing variables:

```text
Tool: mcp__emailbison__call_api
Extended tool: list_custom_variables (or search_api_spec for the correct tool name)
```

Create a missing variable:

```text
Tool: mcp__emailbison__call_api
Extended tool: create_custom_variable
Body: { "name": "SITUATION_LINE", "type": "text" }
```

Variable naming: uppercase, underscores only (e.g. `SITUATION_LINE` not `situation_line`).

## Verify Lead Email

Use sparingly — each verification consumes a credit.

```text
Tool: mcp__emailbison__call_api
Extended tool: verify_lead_email
Body: { "lead_id": <id> }
```

## Common Workflows

### "Find the lead john@testlead.com"

```text
Tool: mcp__emailbison__get_lead
Params: { "email": "john@testlead.com" }
```

Print name, title, company, status, campaign assignments, tags.

### "Add the 'Hot Lead' tag to sarah@company.com"

1. Get the lead: `mcp__emailbison__get_lead` → get `lead_id`.
2. List tags: `call_api` → `list_tags` → find `hot-lead` tag ID.
3. Attach tag: `call_api` → `add_tags_to_leads`.

### "Update John's title to VP of Sales"

1. `mcp__emailbison__get_lead` → get `lead_id`.
2. `mcp__emailbison__update_lead` → `{ "lead_id": ..., "title": "VP of Sales" }`.

## Common Gotchas

1. **Tag operations use IDs, not names.** Always resolve tag name → ID first.
2. **Custom variables must exist before import.** Creating a lead with an unknown variable silently ignores it.
3. **Lead import can take up to 5 minutes.** Do not recheck immediately; wait before confirming count.
4. **`email` is the unique identifier.** Duplicate emails update the existing lead, not create a new one.
5. **Unsubscribed leads cannot be re-added to campaigns.** Respect opt-outs.

## What To Do Next

- To add leads to a campaign: use `call_api` → `add_leads_to_campaign` or `/emailbison-campaign-upload-public` for full upload flow.
- To score replies: `/emailbison-positive-reply-scoring`.
- To export and analyze: `mcp__emailbison__export_leads_csv` then open in Excel.

## Related Skills

- `/emailbison-campaign-upload-public` - full campaign + lead import workflow
- `/emailbison-campaign-manager` - campaign lifecycle management
- `/emailbison-reply-manager` - inbox and reply management
- `/list-quality-scorecard` - dedupe and verify leads before import

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short — record status, not raw output. Full protocol: `client-activity-log.md`.
