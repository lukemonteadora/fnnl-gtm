# Smartlead → Slack Reporting (replicating the EmailBison reporting system)

**What this is.** the upstream workspace runs a polished EmailBison → Slack reporting system in the A SALES Slack
workspace (a "Bison" sidebar section with 8 channels). As clients migrate from EmailBison to
Smartlead, we need the *same* reports driven by Smartlead instead. This doc is the source of truth:
it records exactly what the Bison reports look like, maps each one to a Smartlead data source, and
defines the build. Plain-English summary first, exact specs below.

> **Note (2026-06-24):** this doc captures the original 8-report build. Two more have shipped since —
> report 9 `reply-alerts` (1-min @channel hot-reply ping) and report 10 `health-alerts` (5-min @channel
> ping for a mailbox disconnect/needs-reconnect/sending-failure or a campaign auto-paused for high bounce).
> The **living reference for all 10 reports is the `/smartlead-slack-reporting` skill** (`.claude/skills/…/SKILL.md`)
> + `scripts/smartlead-slack-reporting/DEPLOY.md`; treat those as authoritative where this older doc says "8".

**Status:** ✅ **LIVE / DEPLOYED (2026-06-15).** All 8 reports run on schedule via Apps Script
("Smartlead Reports [Claude Code]", owner <OPERATOR_EMAIL>) posting to 8 `smartlead-*` channels in the
the upstream workspace Slack (app "Smartlead Reports"). Google-cloud-hosted, laptop-independent. The 8th report
(interested replies) is a 10-min master-inbox poll, not a webhook. Full deploy record + gotchas in
`scripts/smartlead-slack-reporting/DEPLOY.md`. Decisions: Apps Script (mirror Bison) · all 8 reports ·
channels created by me.

**Build artifacts** (in `scripts/smartlead-slack-reporting/`): `Code.gs` (8 reports + webhook receiver,
validated logic), `appsscript.json`, `preview.mjs` (live dry-run / VPS fallback — **verified rendering
all report tables with real numbers**), `create-channels.mjs`, `_sl_report_probe.mjs`, `DEPLOY.md` (step-by-step).

**Validated data model** (corrects the original spec): Smartlead campaigns are NOT tagged to client
records (`client_id` null) → the client is the **campaign-name prefix before `|`**. Per-campaign windowed
stats from `/campaigns/{id}/analytics-by-date`; lifetime + `campaign_lead_stats.{interested,notStarted}`
from `/campaigns/{id}/analytics`. Live dry-run (30d): 1,529 sends / 0.3% bounce / 500 interested / 46 clients.
Tuning notes: bounce alerts use a *recent* window (lifetime scan is too noisy — flagged 40+ campaigns);
naming variants merged via optional `CLIENT_ALIASES_JSON`.

---

## 1. What exists today (the EmailBison system we're copying)

- **Where:** the reporting Slack workspace (`<company>-workspace.slack.com`, team `<SLACK_TEAM_ID>`), sidebar
  section **"Bison"** (section id `Csl0BBGBJESQY`) — 8 channels.
- **Backend (inferred from the messages):** a custom automation (Google Apps Script is the most
  likely host — the daily reports carry **"View in Google Sheets"** and **"Bison Client API Keys"**
  buttons) that stores one EmailBison API key per client, pulls each client's stats, writes a Google
  Sheet, and posts formatted messages to Slack. Plus EmailBison's own Slack app for real-time events.
- **Two posting mechanisms:**
  1. **Scheduled digests** — a "Daily Report" / custom app posts tables on a clock (daily/weekly/monthly).
  2. **Real-time event cards** — the **EmailBison** Slack app posts the moment something happens
     (interested reply, stale inbox, etc.).

### The 8 Bison channels (observed live 2026-06-15)

| Channel | Cadence | What it posts |
|---|---|---|
| `bison-daily-sends-report` | Daily ~08:01 | Per-client **sends** table → `Client \| Sends`, ending `TOTAL`. Buttons: View in Google Sheets, Bison Client API Keys. Header: `📊 Daily Send Report — 14th June, Sunday`. |
| `bison-daily-leads-report` | Daily | **Remaining lead inventory** per client ("X new leads left"), a "clients looking good" list, footer `32 clients — 8 empty • 17 low • 7 good`. Flags campaigns about to run dry. Button: Bison Client API Keys. |
| `bison-weekly-digest` | Weekly (Sat ~07:59) | Per-client `Client \| Sends \| Bnc% \| Int` table + `TOTAL` + summary line `Totals: 33,626 sends \| 0.5% bounces \| 2 interested \| 32 clients`. Header `📊 Weekly Digest — w/e 13th June, Saturday`. |
| `bison-monthly-digest` | Monthly | Same table as weekly, month window. Summary `May totals: 242,402 sends \| 1.1% bounces \| 22 interested \| 31 days tracked \| 32 clients`. |
| `bison-bounce-alerts` | Threshold-triggered | `🚨 High Bounce Rate — PAUSE NOW`. Fields: Client, Campaign, **Bounce Rate `5.1% (129/2520)`**, Top Cause, **Bounce Breakdown** (Unknown / Invalid / Blocked counts), **MX-record analysis** of bouncing domains (Google Workspace / M365 / Proofpoint / Other with %), Likely cause, and an **`@a teammate` action: pause this campaign**. |
| `bison-interested-replies` | Real-time | `🔥 Interested Reply — <Client>` card: 👤 lead, ✉️ email, 💼 job title, 🏢 company, 🎯 campaign, 🕐 received, ✉️ subject, 💬 their reply (quoted), button **Find Mobile Number**. Posted by EmailBison app. |
| `bison-reply-followups` | Daily ~08:01 | `📋 Reply Follow-Ups — 10th June`. `N client(s) with active leads:` then per lead: name (email) — Step N — status (In Sequence / Replied / unsubscribed). Footers: "FUP created, no prospects added: …" and "No FUP campaign: …". |
| `bison-stale-inbox` | Hourly | `⏰ Stale Inbox Alert — N waiting`. "These interested replies have been sitting for **15+ mins** without a response:" → per lead: Client — Name (email) — Xh/Xm ago. Footer `Checked hourly. Threshold: 15 mins.` An SLA watchdog so hot leads get answered fast. |

---

## 2. Smartlead can supply every one of these (verified live 2026-06-15)

The Smartlead account carried **8 clients** mirroring Bison (client names removed from this vendor
copy). Last-30-day overall stats returned live (sent, replied, bounced and bounce rate all
populated). Smartlead supports **per-campaign webhooks** for real-time events.

### Report → Smartlead data source map

| Report | Smartlead source (MCP / REST) |
|---|---|
| Daily sends (per client) | `smartlead_analytics_client_overall_stats` per day, or `smartlead_analytics_day_wise_overall_stats`; client roster from `smartlead_analytics_client_list`; campaigns per client from `smartlead_list_campaigns`. |
| Daily leads remaining | Per campaign: `smartlead_get_campaign_lead_statistics` (total vs not-yet-contacted); aggregate per client; bucket empty/low/good. |
| Weekly digest (Sends/Bnc%/Int) | `smartlead_analytics_client_overall_stats` (sent, bounced) + interested from `smartlead_analytics_lead_category_wise_response` / category "Interested" over the week, per client. |
| Monthly digest | Same as weekly, 1st-of-month → today window. |
| Bounce alerts | `smartlead_analytics_overall_stats_v2` / per-campaign `smartlead_get_campaign_statistics` for bounce_rate; campaign-level threshold check; bounce reasons from bounced-lead categories; MX analysis = DNS MX lookup on bouncing recipient domains (same as Bison's enrichment step). |
| Interested replies (real-time) | Webhook `LEAD_CATEGORY_UPDATED` → category "Interested" (or `EMAIL_REPLY` + classify); lead details via `smartlead_fetch_lead_by_email` / message history. |
| Reply follow-ups | `smartlead_list_leads_by_campaign` filtered to replied; sequence step + status per lead. |
| Stale inbox | Interested leads with a reply but no outbound response in 15+ min: `smartlead_fetch_lead_message_history` direction check; polled ≤15 min. |

---

## 3. Proposed build

**New Slack channels** (mirror the Bison set, `smartlead-` prefix), grouped in a new "Smartlead"
sidebar section in the A SALES workspace:
`smartlead-daily-sends-report`, `smartlead-daily-leads-report`, `smartlead-weekly-digest`,
`smartlead-monthly-digest`, `smartlead-bounce-alerts`, `smartlead-interested-replies`,
`smartlead-reply-followups`, `smartlead-stale-inbox`.

**Engine** = one Node module (`scripts/smartlead-slack-reporting.mjs`) with a sub-command per report,
each producing a Slack Block Kit payload byte-for-byte matching the Bison layout. `--dry-run` prints
payloads without posting (read-only, no spend). Scheduled digests run on a clock; real-time alerts
run from Smartlead webhooks (or a ≤15-min poll if we avoid hosting a public endpoint).

**Slack delivery** = a dedicated Slack app / incoming webhooks in the A SALES workspace (mirrors how
the Bison "Daily Report" app posts). The currently-connected Slack MCP is the **12 Mavens** workspace,
NOT the upstream workspace — it cannot post here, so we need an the upstream workspace webhook/bot token or the the upstream workspace Slack MCP.

---

## 4. Open decisions (operator) — see chat

- **A. Host/scheduler:** Google Apps Script (mirror Bison, always-on, free) vs Hetzner VPS cron
  (matches the VPS goal, not built yet) vs Claude Code scheduled routine (stand up now, MCP-native).
- **B. Slack delivery:** dedicated the upstream workspace Slack app + incoming webhooks (robust, mirrors Bison) vs
  connect the upstream workspace Slack as an MCP connector.
- **C. Real-time alerts:** Smartlead webhooks (instant, needs an always-on endpoint) vs frequent poll.
- **D. Channels:** confirm `smartlead-` prefix + the 8-channel set; who creates them (operator vs me via browser).

---

## 5. Key facts / gotchas

- Connected **Slack MCP = 12 Mavens**, not the upstream workspace. Verify workspace before trusting any Slack data;
  to read/post in the upstream workspace use the browser (logged in as the operator) or an the upstream workspace webhook/MCP.
- EmailBison MCP is connected to the upstream workspace's instance (`<SELF_HOSTED_INSTANCE_HOST>`, workspace "<workspace-name>"
  id 215) — useful for cross-checking Bison numbers, not needed for the Smartlead reports.
- `smartlead_list_campaigns` returns a very large payload — paginate/filter in scripts, never dump to context.
- `smartlead_fetch_lead_categories` MCP tool is mis-wired (asks for leadId); use REST or
  `smartlead_analytics_lead_category_wise_response` for the "Interested" category.
- **Master-inbox `limit` caps at 20.** `POST /master-inbox/inbox-replies` rejects `limit > 20` with
  HTTP 400; you must **paginate in pages of 20** (newest-first via `offset`). This silently broke the
  3 reply-based reports until 2026-06-16 — `inboxReplies_` asked for `limit:100`, got a swallowed 400,
  and returned `[]`, so reply-followups / stale-inbox / interested-replies posted nothing in
  production. Fixed with pagination in both `Code.gs` and `post.mjs`. Two recency windows were added at
  the same time: `FUP_WINDOW_DAYS` (default 2) bounds reply-followups, `STALE_MAX_AGE_DAYS` (default 1)
  stops stale-inbox re-alerting ancient threads. Interested categories are now `1,2` (Interested +
  Meeting Request) via `INTERESTED_CATEGORY_IDS`.
- Smartlead open rate is 0% (open tracking off for deliverability) — digests should NOT report opens
  (Bison's tables don't either: they track Sends / Bounce% / Interested).
