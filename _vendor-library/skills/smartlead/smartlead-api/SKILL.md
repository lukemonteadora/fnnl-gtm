---
name: smartlead-api
description: Smartlead API endpoint reference and patterns. Use for any Smartlead campaign, lead, email account, analytics, or inbox operation. Covers auth, rate limiting, and all commonly used endpoints.
user_invocable: false
---

# Smartlead API Reference

> ✅ **The MCP write-tool 404s were a broken-client bug — now fixed via REST (root-caused 2026-06-10).** The LeadMagic MCP's `smartlead_create_email_account` and `smartlead_update_email_account_tag` return **404 only because they POST to WRONG paths** (`/email-accounts` and `/email-accounts/{id}/tag`); the real, supported routes are `POST /email-accounts/save` and `POST /email-accounts/tag-mapping` (see **Email Account Tags** below). **Avoid those two MCP tools**, but the MCP's ~100 read/analytics/campaign/warmup tools work fine (note: `get_all_email_accounts` "Found 0" counter is buggy — the JSON body is the truth; large payloads spill to a file). **Tags and account-create are NOT UI-only** — both work over REST; the bundled, verified `scripts/smartlead-tags.mjs` wraps the tag routes. Direct REST reads: `GET https://server.smartlead.ai/api/v1/email-accounts/?api_key=<key>&offset=0&limit=200`. Field notes: `coldoutbound-gotchas.md`.

## Authentication

All requests use query parameter auth: `?api_key={SMARTLEAD_API_KEY}`

Environment variable: `$SMARTLEAD_API_KEY`

Base URL: `https://server.smartlead.ai/api/v1`

## Rate Limiting

- **Standard plan:** 2,000 req/min (33 req/sec)
- **Higher plans:** 3,000 req/min (50 req/sec)
- Retry on 429 and 5xx with exponential backoff
- For bulk operations, use `p-limit` or `PQueue` with 8-15 concurrency

## CLI Quick Reference

The `smartlead` CLI (`@smartlead/cli`) wraps all API endpoints. Use it for quick lookups:

```bash
# Campaigns
smartlead campaigns list
smartlead campaigns get <id>
smartlead campaigns create --name "Campaign Name"

# Leads
smartlead leads list --campaign-id <id>
smartlead leads add --campaign-id <id> --file leads.csv

# Email accounts
smartlead email-accounts list
smartlead email-accounts get <id>

# Analytics
smartlead analytics campaign <id>
smartlead analytics overall

# Master inbox
smartlead inbox replies
```

## API Endpoints

### Campaigns

```
GET  /campaigns/{id}                    — Fetch campaign by ID
POST /campaigns/create                  — Create new campaign
POST /campaigns/{id}/status             — Update status (START, PAUSED, STOP)
     Body: { "status": "START" }
```

### Campaign Email Accounts

```
GET    /campaigns/{id}/email-accounts   — List accounts assigned to campaign
POST   /campaigns/{id}/email-accounts   — Add accounts to campaign
       Body: { "email_account_ids": [1, 2, 3] }
DELETE /campaigns/{id}/email-accounts   — Remove accounts from campaign
```

### Campaign Sequences

```
GET  /campaigns/{id}/sequences          — Fetch sequences
POST /campaigns/{id}/sequences          — Save/update sequences
     Body: { "sequences": [{ "seq_number": 1, "seq_delay_details": { "delay_in_days": 0 }, "subject": "...", "email_body": "..." }] }
```

**A/B/C Variants** — use `seq_variants` array inside each sequence:
```json
{
  "sequences": [{
    "seq_number": 1,
    "seq_delay_details": { "delay_in_days": 0 },
    "seq_variants": [
      { "variant_label": "A", "subject": "Subject A", "email_body": "<div>Body A</div>" },
      { "variant_label": "B", "subject": "Subject B", "email_body": "<div>Body B</div>" },
      { "variant_label": "C", "subject": "Subject C", "email_body": "<div>Body C</div>" }
    ]
  }]
}
```
Note: Do NOT include `distribution` field — SmartLead splits evenly automatically.

**Email body order:** content → PS unsub line → `%signature%` (signature always last)

### Campaign Settings & Schedule

```
POST /campaigns/{id}/settings           — Update settings (⚠ REPLACE, not merge — see below)
     Full body (always send ALL of these together):
       { client_id, enable_ai_esp_matching, send_as_plain_text, stop_lead_settings,
         track_settings, follow_up_percentage }

POST /campaigns/{id}/schedule           — Update schedule
     Body: { "timezone": "America/New_York", "days_of_the_week": [1,2,3,4,5],
             "start_hour": "09:00", "end_hour": "15:00", "min_time_btw_emails": 12,
             "max_new_leads_per_day": 500, "schedule_start_time": "2026-06-30T13:00:00.000Z" }
```

**Live campaign object fields (read with `GET /campaigns/{id}` — these are the source-of-truth names + enums; verified 2026-06-19):**

| Setting (UI) | Field on GET | Value / enum |
|---|---|---|
| Client tag | `client_id` | client-access id (set at create via `create_campaign(client_id)`) |
| Don't track opens/clicks | `track_settings` | **WRITE** `["DONT_TRACK_EMAIL_OPEN","DONT_TRACK_LINK_CLICK"]`; **READS BACK** as `["DONT_EMAIL_OPEN","DONT_LINK_CLICK"]` (write enum ≠ read enum — posting the read form 400s) |
| Stop on reply | `stop_lead_settings` | `"REPLY_TO_AN_EMAIL"` |
| Plain text (no HTML) | `send_as_plain_text` | `true` |
| Enhanced Email Sending & Delivery | `enable_ai_esp_matching` | `true` (⚠ defaults `false` on API-created drafts) |
| Prioritise sending pattern | `follow_up_percentage` | `100` (already the default) |
| Timezone / days / window | `scheduler_cron_value` | `{tz, days:[1-5], startHour:"09:00", endHour:"15:00"}` |
| Campaign throttle | `min_time_btwn_emails` | `12` (req field `min_time_btw_emails`; ≠ per-mailbox `minTimeToWaitInMins`=15) |
| Max new leads/day | `max_leads_per_day` | `500` (HARD-RULE default, operator directive 2026-06-23; req field `max_new_leads_per_day`) |
| Start date | `schedule_start_time` | UTC ISO, or `null` |

⚠ **`POST /campaigns/{id}/settings` REPLACES, doesn't merge** — any settings field you omit resets to its default (a partial POST flipped `send_as_plain_text`→`false`, verified 2026-06-19). Always send the full object above. (The `/schedule` endpoint is independent and unaffected.)

⚠ **MCP write wrappers are broken for these** — `smartlead_update_campaign_settings` and `smartlead_update_campaign_schedule` 400 with `"campaign_id is not allowed"`. Use REST `POST /campaigns/{id}/settings` and `POST /campaigns/{id}/schedule` directly (`?api_key=`).

**NOT on the campaign object (no public API to set/verify — UI-only, set via browser §6):** Intelligent AI Lead Categorisation ("Intelli-categorise replies using Smartlead's AI") and High Bounce Rate Auto-Protection ("Activate auto-pause protection from bounces"). Both default OFF on API-created drafts. Distribution mode (Pattern-Based) is also UI-only but defaults correct. Canonical settings spec: `/smartlead-campaign-upload-public` *Campaign settings + schedule (HARD RULE)*.

### Leads

```
GET  /leads/?api_key={key}&email={email}
     — Lookup lead by email address

POST /campaigns/{id}/leads
     — Add leads to campaign (batch up to 100)
     Body: { "lead_list": [{ "email": "...", "first_name": "...", "last_name": "...", "company_name": "...", "custom_fields": { "field1": "value1" } }] }
```

⚠ **The leads upload lies on two failure modes — verify attach, don't trust `upload_count`.** `POST /campaigns/{id}/leads` returns 200 with `upload_count` = batch size even when leads never attach: (1) `ignore_duplicate_leads_in_other_campaign: true` silently skips any email already present in another campaign (on rebuilds, delete the old campaigns first AND set it `false`); (2) a leads/schedule call right after `POST /campaigns/create` hits replication lag and no-ops (poll `GET /campaigns/{id}` until it returns a `status` first). Always confirm with `GET /campaigns/{id}/leads?limit=1` → `total_leads`. Pattern: propagation poll, then dup-flag `false`, then attach-verify with a re-upload loop (no reference script ships in this pack). Full detail: `/smartlead-campaign-upload-public`.

### Analytics

```
GET /analytics/day-wise-overall-stats
    ?api_key={key}&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
    — Day-by-day metrics (sent, opened, clicked, replied, bounced)

GET /analytics/day-wise-positive-reply-stats
    ?api_key={key}&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
    — Day-by-day positive reply counts

GET /analytics/overall-stats-v2
    ?api_key={key}&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
    — Overall campaign metrics for date range

GET /analytics/campaign/list
    ?api_key={key}
    — List all campaigns with summary stats

GET /campaigns/{id}/analytics
    ?api_key={key}
    — Analytics for specific campaign

GET /campaigns/{id}/analytics-by-date
    ?api_key={key}&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
    — Campaign analytics for specific date range (sent_count, reply_count)
```

### Email Accounts (Global)

```
GET  /email-accounts
     ?api_key={key}&offset=0&limit=100
     — List all email accounts (paginated)

GET  /email-accounts/{id}
     ?api_key={key}
     — Get specific email account

POST /email-accounts/save
     — Create/update email account (SMTP details, warmup, etc.)
     ⚠️ This connects as type SMTP (app-password). Per the inbox-manager HARD RULE, use it ONLY for a
        genuinely custom host — NEVER to connect a Google/Microsoft mailbox (those must come in as native
        GMAIL/OUTLOOK via the provider's Export→Smartlead). The MCP's create_email_account 404s because it
        POSTs to /email-accounts instead of /email-accounts/save.

POST /email-accounts/{id}/warmup
     — Enable/update warmup. Body: { "warmup_enabled": true, "total_warmup_per_day": 35,
       "daily_rampup": 5, "reply_rate_percentage": 30 }  (daily_rampup MIN 5; lower → HTTP 400)
```

**Per-mailbox "Minimum time gap (min)" = field `minTimeToWaitInMins`** (camelCase — note the siblings on the
account object are snake_case, easy to get wrong). It is the per-mailbox throttle (minutes between two sends
from that mailbox). **HARD RULE: every mailbox must read `minTimeToWaitInMins == 15`, never null/empty** — see
`/smartlead-inbox-manager`. It is **readable** on `GET /email-accounts` / `GET /email-accounts/{id}`, which is
how you VERIFY the rule, but there is **no verified public write** for it (the MCP `update_email_account` tool
has no such field, and `email-accounts/save` doesn't carry it) — set it in the UI via Bulk Update. ⚠️ Do NOT
confuse it with the **campaign-level** `min_time_btw_emails` in `POST /campaigns/{id}/schedule` (a separate,
campaign-scoped throttle); they are different settings.

### Email Account Tags  ✅ verified 2026-06-10 (NOT UI-only)

Tags are a first-class REST feature. The bundled `scripts/smartlead-tags.mjs` wraps these.

```
GET    /email-accounts/tags
       ?api_key={key}
       — List all tag definitions (id, name, color).                          [VERIFIED]

POST   /email-accounts/tag-mapping
       ?api_key={key}
       Body: { "email_account_ids": [<=25 ids], "tag_ids": [one or more] }
       — ASSIGN (add) tags to accounts. Additive + idempotent: a tag already
         on an account returns action:"skipped","reason":"Mapping already exists".
         Batch in groups of 25 account ids.                                   [VERIFIED 2xx]

DELETE /email-accounts/tag-mapping
       ?api_key={key}
       Body: { "email_account_ids": [...], "tag_ids": [...] }
       — REMOVE tags from accounts (action:"deleted").                        [VERIFIED 2xx]

POST   /email-accounts/tags
       ?api_key={key}
       Body: { "name": "TagName", "color": "#4F46E5" }
       — Create a new tag definition.                  [implemented in script, UNTESTED — confirm a 2xx before relying on it]
```

The MCP's `update_email_account_tag` 404s because it POSTs to `/email-accounts/{id}/tag` (a path that does
not exist) instead of `/email-accounts/tag-mapping`. Tag IDs are stable per account — read them once with
`GET /email-accounts/tags`, then assign by id.

### Campaign Tags (READ-only on the API; assign in UI) + the "folder" reality ⚠ verified live 2026-06-22

**HARD RULE (operator, 2026-06-22): every campaign must carry a Tag = its client's company name, and belong to its `client_id` (client-access entity).** The tag makes it filterable by company; the client groups it under its company. The canonical company string is the one from `client-profile.yaml`; reuse, never duplicate. **Assign the tag via the browser bulk pass in `/smartlead-campaign-upload-public` §D, not from here.**

```
GET /campaigns/{id}?include_tags=true   — READ a campaign's tags. Adds tags[] = [{tag_id,tag_name,tag_color}]
                                          (note the tag_* prefix). ONLY campaign-tag surface on the public
                                          API, and it is READ-only.                                  [VERIFIED]
```

- **Campaign tags have NO public write.** Every write shape 404s `Cannot POST` on the public api_key surface (`POST /campaigns/{id}/tags`, `/campaigns/tag-mapping`, `/campaigns/{id}/tag-mapping`, `/campaigns/{id}/tag`, PATCH `/campaigns/{id}`, …). The web app fires a **session-authenticated GraphQL** mutation to `fe-gql.smartlead.ai/v1/graphql` (Hasura; needs a JWT — **do NOT lift/replay it**). Assign in the UI: the New-Version bulk **⋯ Bulk Actions → Add Tag** (filter `?clientId=<id>` → Select all campaigns → Add Tag → pick company → Add Tags). Verify with `scripts/smartlead-campaign-org-verify.mjs`.
- **The tag *pool* IS API-writable** — `POST /tags { name, color }` → 201, the shared pool listed via `GET /email-accounts/tags`. Pre-create the company tag for consistent name/color: `scripts/smartlead-tags.mjs create-tag "<Company>"`.
- **There is NO real "campaign folder" for a client's campaigns — the company grouping is the `client_id`.** The New-Version "Folders" tab shows company-named entries with a **"C" badge** (auto **client** groupings), but these are NOT manually movable: "Move to Folder" into one reports success yet the folder reads **empty** (verified on two client groupings: both read 0 after a "successful" move), and the stable **Old Version** Folders tab has no such company folders. So assigning `client_id` already files the campaign under its company; do not chase a folder. (The MCP `smartlead_create_folder` / `get_all_folders` are **Smart-Delivery** placement folders — unrelated.) Real folders can only be CREATED fresh (which then duplicate the auto "C" names) — operator chose 2026-06-22 to rely on the client grouping + tag, so don't.

### Master Inbox

```
POST /master-inbox/inbox-replies
     Body: { "api_key": "...", "offset": 0, "limit": 50, "message_type": "RECEIVED" }
     — Fetch inbox replies with filtering and pagination
```

## Sub-Client / Custom API Key Pattern

- **Normal sub-clients:** Pass `?api_key={MAIN_KEY}&client_id={CLIENT_ID}` on all requests
- **Custom API key clients:** Use the client's own API key directly, no `client_id` param

## TypeScript Pattern

```typescript
const SMARTLEAD_API = "https://server.smartlead.ai/api/v1";
const API_KEY = process.env.SMARTLEAD_API_KEY;

// GET example
const res = await fetch(`${SMARTLEAD_API}/campaigns/${campaignId}?api_key=${API_KEY}`);
const campaign = await res.json();

// POST example (add leads)
const res = await fetch(`${SMARTLEAD_API}/campaigns/${campaignId}/leads?api_key=${API_KEY}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ lead_list: leads.slice(0, 100) }),
});
```

## Performance tip: cache the email-accounts list

If you hit `/email-accounts` more than a few times per script, paginate once at the start and keep the result in memory. Smartlead's pagination returns 100 per page — for accounts with thousands of inboxes, a full walk takes 30+ seconds.

For persistent caching across scripts, write the list to a local JSON file and refresh on a timer (e.g. every hour). The `/smartlead-inbox-manager` skill has scripts that implement this pattern.

---

## What to do next

This is a reference skill — no direct next step. Used by all skills that interact with Smartlead (`/smartlead-inbox-manager`, `/smartlead-campaign-upload-public`, `/email-deliverability-audit`, `/positive-reply-scoring`, `/deliverability-incident-response`, etc.).

Return to the skill that sent you here.

## Related skills

- Every skill that touches Smartlead uses this reference.

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short — record status, not raw output. Full protocol: `client-activity-log.md`.
