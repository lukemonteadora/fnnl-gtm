---
name: emailbison-api
description: EmailBison API endpoint reference and patterns. Use for any EmailBison campaign, lead, sender email, warmup, tag, reply, webhook, or workspace operation. Covers Bearer auth, instance base URL, bison CLI usage, optional MCP setup, pagination, and common cold email workflows.
user_invocable: false
---

# EmailBison API Reference

EmailBison is not a Smartlead clone. The weak assumption would be to swap endpoint names and call it done. That will break because EmailBison uses instance-specific base URLs, Bearer tokens, sender emails, custom variables, and campaign `resume` / `pause` actions.

## Authentication

EmailBison uses Bearer tokens.

Create a token in EmailBison:

1. Open **Settings > Developer API**.
2. Click **New API Token**.
3. Prefer an `api-user` token for one workspace.
4. Use `super-admin` only when you intentionally need admin-level workspace switching.

Environment variables:

```bash
EMAILBISON_API_KEY=your_token_here
EMAILBISON_BASE_URL=https://dedi.emailbison.com
```

Every request:

```http
Authorization: Bearer <EMAILBISON_API_KEY>
Content-Type: application/json
```

Base URL is not universal. Use the instance URL for the user's EmailBison workspace, usually something like:

```text
https://dedi.emailbison.com
https://send.yourinstance.com
```

## CLI And Optional MCP

The community `emailbison-cli` wraps the API and can expose MCP tools.

Install and login:

```bash
npm install -g emailbison-cli
bison login --api-key "$EMAILBISON_API_KEY" --base-url "$EMAILBISON_BASE_URL"
bison status --pretty
```

Run as MCP if available in the user's environment:

```bash
bison mcp
```

Do not require MCP for these skills. Treat it as a convenience. REST API and CLI commands are the stable path.

## Core REST Endpoints

### Campaigns

```http
GET   /api/campaigns
POST  /api/campaigns
GET   /api/campaigns/{campaign_id}
PATCH /api/campaigns/{campaign_id}/update
PATCH /api/campaigns/{campaign_id}/resume
PATCH /api/campaigns/{campaign_id}/pause
```

Create:

```json
{ "name": "Campaign Name" }
```

Settings:

```json
{
  "max_emails_per_day": 500,
  "max_new_leads_per_day": 100,
  "plain_text": true,
  "open_tracking": false,
  "reputation_building": true,
  "can_unsubscribe": true,
  "unsubscribe_text": "Unsubscribe"
}
```

CLI:

```bash
bison campaigns list --pretty
bison campaigns create --name "Q2 Outreach"
bison campaigns update --id 123 --max-emails-per-day 500 --max-new-leads-per-day 100 --plain-text true --open-tracking false
bison campaigns pause --campaign-id 123
bison campaigns resume --campaign-id 123
```

### Campaign Schedule

```http
POST /api/campaigns/{campaign_id}/schedule
GET  /api/campaigns/{campaign_id}/schedule
```

Body:

```json
{
  "monday": true,
  "tuesday": true,
  "wednesday": true,
  "thursday": true,
  "friday": true,
  "saturday": false,
  "sunday": false,
  "start_time": "09:00",
  "end_time": "17:00",
  "timezone": "America/New_York",
  "save_as_template": false
}
```

CLI:

```bash
bison campaigns schedule-create --campaign-id 123 \
  --monday true --tuesday true --wednesday true --thursday true --friday true \
  --saturday false --sunday false \
  --start-time "09:00" --end-time "17:00" --timezone "America/New_York"
```

### Sequence Steps

```http
GET  /api/campaigns/{campaign_id}/sequence-steps
POST /api/campaigns/{campaign_id}/sequence-steps
```

Body:

```json
{
  "title": "Main Sequence",
  "sequence_steps": [
    {
      "email_subject": "Question for {FIRST_NAME}",
      "order": 1,
      "email_body": "Plain text body here.",
      "wait_in_days": 0,
      "variant": false,
      "variant_from_step": null,
      "thread_reply": false
    }
  ]
}
```

Variants are separate sequence steps. A variant step must point to the original step using `variant_from_step`. This is not the same shape as Smartlead `seq_variants`.

CLI:

```bash
bison campaigns sequence-steps-create --campaign-id 123 \
  --title "Main Sequence" \
  --sequence-steps '[{"email_subject":"Question for {FIRST_NAME}","order":1,"email_body":"Body","wait_in_days":0,"variant":false,"thread_reply":false}]'
```

### Leads

```http
GET  /api/leads
POST /api/leads
PUT  /api/leads/{id}
POST /api/leads/bulk/csv
```

Single lead:

```json
{
  "first_name": "Jane",
  "last_name": "Smith",
  "email": "jane@example.com",
  "title": "VP Operations",
  "company": "Example Co",
  "custom_variables": [
    { "name": "situation_line", "value": "Saw the new warehouse opening." }
  ]
}
```

Bulk CSV upload:

```http
POST /api/leads/bulk/csv
Content-Type: multipart/form-data
```

Required form fields:

```text
name
csv
columnsToMap[first_name][]
columnsToMap[last_name][]
columnsToMap[email][]
columnsToMap[{OTHER}][]
```

Limits:

- CSV and campaign lead imports cap at 50,000 leads.
- Custom variables must exist in the workspace before assigning values.

CLI:

```bash
bison leads create --email "jane@example.com" --first-name "Jane" --last-name "Smith" --company-name "Example Co"
bison leads bulk-csv --csv ./leads.csv
```

### Attach Leads To Campaign

```http
POST /api/campaigns/{campaign_id}/leads/attach-leads
POST /api/campaigns/{campaign_id}/leads/attach-lead-list
```

Body:

```json
{ "lead_ids": [1, 2, 3] }
```

or:

```json
{ "lead_list_id": 1 }
```

CLI:

```bash
bison campaigns attach-leads --campaign-id 123 --lead-ids '[1,2,3]'
bison campaigns attach-lead-list --campaign-id 123 --lead-list-id 1
```

### Custom Variables

```http
GET  /api/custom-variables
POST /api/custom-variables
```

Body:

```json
{ "name": "situation_line" }
```

Rules:

- Variables are workspace-specific.
- Create them before importing leads with values.
- EmailBison template syntax is uppercase braces, for example `{FIRST_NAME}` or `{SITUATION_LINE}`.

CLI:

```bash
bison custom-variables list --pretty
bison custom-variables create --name situation_line
```

### Sender Emails

EmailBison calls inboxes "sender emails."

```http
GET   /api/sender-emails
PATCH /api/sender-emails/{senderEmailId}
POST  /api/sender-emails/imap-smtp
POST  /api/sender-emails/bulk
```

CLI:

```bash
bison accounts list --pretty
bison accounts get --senderEmailId 123 --pretty
bison accounts update --senderEmailId 123 --from-name "Jane Smith" --daily-limit 30
bison accounts bulk-daily-limits --sender-email-ids '[1,2,3]' --daily-limit 30
bison accounts bulk-signatures --sender-email-ids '[1,2,3]' --signature "Best,\nJane"
bison accounts check-mx --senderEmailId 123
bison accounts bulk-check-mx
```

### Attach Sender Emails To Campaign

```http
POST /api/campaigns/{campaign_id}/sender-emails
```

CLI:

```bash
bison campaigns sender-emails --campaign-id 123
bison campaigns attach-sender-emails --campaign-id 123 --sender-email-ids '[1,2,3]'
bison campaigns remove-sender-emails --campaign-id 123 --sender-email-ids '[3]'
```

### Warmup

```http
GET  /api/warmup
GET  /api/warmup/{senderEmailId}
POST /api/warmup/enable
POST /api/warmup/disable
POST /api/warmup/update-limits
```

CLI:

```bash
bison warmup list --pretty
bison warmup get --senderEmailId 123 --pretty
bison warmup enable --sender-email-ids '[1,2,3]'
bison warmup disable --sender-email-ids '[1,2,3]'
bison warmup update-limits --sender-email-ids '[1,2,3]' --daily-warmup-limit 30
```

### Tags

Tags can attach to sender emails, leads, and campaigns.

```http
GET    /api/tags
POST   /api/tags
POST   /api/tags/attach-to-sender-emails
DELETE /api/tags/attach-to-sender-emails
POST   /api/tags/attach-to-leads
POST   /api/tags/attach-to-campaigns
```

CLI:

```bash
bison tags list --pretty
bison tags create --name active
bison tags attach-to-sender-emails --tag-ids '[10]' --sender-email-ids '[1,2,3]'
bison tags remove-from-sender-emails --tag-ids '[11]' --sender-email-ids '[1,2,3]'
```

### Replies

```http
GET   /api/replies
GET   /api/replies/{id}
PATCH /api/replies/{id}/mark-as-interested
PATCH /api/replies/{id}/mark-as-not-interested
GET   /api/leads/{lead_id_or_email}/replies
GET   /api/leads/{lead_id_or_email}/sent-emails
```

CLI:

```bash
bison replies list --campaign-id 123 --pretty
bison campaigns replies --campaign-id 123 --pretty
bison leads replies --lead-id 456 --pretty
bison replies mark-interested --reply-id 789
```

### Webhooks

Webhooks can fire for email sent, reply received, contact interested, contact unsubscribed, tag changes, sender email disconnects, and warmup-disabled events.

CLI:

```bash
bison webhooks create --url "https://example.com/emailbison-webhook" --event-types '["CONTACT_REPLIED","CONTACT_INTERESTED"]'
bison webhook-events event-types --pretty
bison webhook-events test --webhook-url-id 123 --event-type CONTACT_REPLIED
```

## Pagination

Most list endpoints paginate. The CLI exposes `--page`. REST responses generally include pagination metadata. Scripts must walk pages instead of assuming page 1 is complete.

## TypeScript Pattern

```typescript
const EMAILBISON_API = process.env.EMAILBISON_BASE_URL;
const API_KEY = process.env.EMAILBISON_API_KEY;

async function bison(path: string, options: RequestInit = {}) {
  const res = await fetch(`${EMAILBISON_API}${path}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    throw new Error(`EmailBison ${res.status}: ${await res.text()}`);
  }

  return res.json();
}
```

## What To Do Next

This is a reference skill. Return to the skill that sent you here.

## Related Skills

- `/emailbison-inbox-manager` - sender emails, warmup, signatures, tags
- `/emailbison-campaign-upload-public` - create paused campaigns from `variants.yaml` and `leads.verified.csv`
- `/emailbison-positive-reply-scoring` - classify replies after a campaign runs

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short — record status, not raw output. Full protocol: `client-activity-log.md`.
