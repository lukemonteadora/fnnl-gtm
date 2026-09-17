---
name: smartlead-slack-reporting
description: >
  Stand up (or maintain) an always-on Smartlead → Slack reporting system: 10 automated reports —
  daily sends, daily leads-remaining, weekly digest, monthly digest, bounce alerts, interested-reply
  alerts, reply follow-ups, stale-inbox SLA alerts, a near-real-time reply-alert channel that
  @channel-pings the reply team within a minute of a positive reply, and a health-alerts channel that
  @channel-pings the moment a mailbox disconnects/needs reconnection or a campaign is auto-paused for
  high bounce. All posted into Slack on a schedule
  by a Google Apps Script (laptop-independent, free). Mirrors the EmailBison "bison-*" Slack reports but
  driven by Smartlead. Fully portable: repeatable for ANY Smartlead account + ANY Slack workspace by
  swapping the API key, Slack app, and channel ids. Invoke when asked to replicate/recreate the
  Smartlead Slack reporting, set it up for a new company/workspace, or fix/extend the existing one.
---

# Smartlead → Slack Reporting (repeatable deploy)

## What this builds — in one paragraph

Nine Slack channels that fill themselves with reports about your Smartlead cold-email account.
Five are scheduled digests (how much got sent, what's bouncing, how many leads are left, weekly /
monthly roll-ups). Four are reply-driven alerts (someone replied → follow-up list; someone said
they're interested → hot-lead card; a hot lead has been sitting unanswered → SLA nudge; and a
near-real-time `reply-alerts` channel that @channel-pings the reply team within a minute of a
positive reply so they answer ASAP). The engine
is a **Google Apps Script** that runs on Google's cloud every day/hour/10-min on its own — it does
not need anyone's laptop on. A **Node version** (`post.mjs`) mirrors it exactly for local testing or
a VPS/cron fallback. This skill is the runbook to deploy it from scratch for a company, and the
reference for maintaining it.

## When you're invoked, first decide: new deploy or maintenance?

- **Maintenance** (an instance already exists — e.g. the the upstream workspace one): read `DEPLOY.md` for that
  deployment's live ids, make the change in `Code.gs` (source of truth), validate via `post.mjs`,
  then re-paste `Code.gs` into the live Apps Script editor (see Gotchas — editing re-triggers OAuth).
- **New deploy** (a different company / Slack workspace): run the full runbook below. Everything
  company-specific is config; no code needs editing.

## Architecture decision (why it's built this way)

- **Host = Google Apps Script**, not a VPS or an MCP routine. It's free, always-on, Google-hosted
  (laptop-independent), and mirrors how the original EmailBison reports are hosted. A Hetzner VPS +
  cron is the alternative (use `post.mjs` there) — pick it only if you already want a VPS; it's more
  to maintain. An in-session Claude routine isn't always-on, so it's out for production.
- **Slack delivery = a dedicated Slack app + bot token**, not an MCP connector — robust, and the
  connected Slack MCP is usually the wrong workspace. The bot posts via `chat.postMessage`.
- **Real-time alerts = a master-inbox poll**, not Smartlead webhooks. Per-campaign webhook wiring
  across hundreds of rotating campaigns is fragile; one poll auto-covers every campaign. The calm
  `interested-replies` log polls every 10 min; the `reply-alerts` act-now channel polls every 1 min
  (the Apps Script floor) and @channel-pings, which is functionally instant for a human reply team,
  without the webhook fragility. A separate seen-state per channel + seed-silently-on-first-run means
  neither one ever backfills old positives into a ping.
- **Health alerts = the same poll pattern, level-triggered.** `healthAlertPoll` (every 5 min) pulls the
  full mailbox list + campaign roster and diffs against a stored current-broken set, so it alerts once
  per NEW breakage and posts ✅ on recovery rather than re-pinging a persistent problem every cycle. The
  campaign-pause alert is gated on elevated recent bounce (not on every PAUSE) because Smartlead exposes
  no auto-pause flag and routine manual pauses would otherwise train the team to mute the channel.

## Inputs to collect for a new deploy

1. **Smartlead API key** for the account (Settings → API). → `.env` as `SMARTLEAD_API_KEY`.
2. **Admin access to the target Slack workspace** (to install an app). The operator clicks "Allow".
3. **A Google account to own the Apps Script** (ideally one tied to the company). The operator
   authorizes it once.
4. **The campaign naming convention.** The "client" in every report is the **campaign name's prefix
   before `|`** (e.g. `Acme | Q3 Re-hit` → client `Acme`). Confirm campaigns follow `Client | …`.
   If a client appears under more than one spelling, collect the variants for `aliases`.

## The 9 reports (channel · cadence · source)

| Channel (`smartlead-…`) | Cadence | Smartlead source |
|---|---|---|
| `daily-sends-report` | daily 08:00 | per-campaign `analytics-by-date` (today) → sends by client + TOTAL |
| `daily-leads-report` | daily 08:00 | per-campaign `analytics` `campaign_lead_stats.notStarted` → leads-remaining buckets (empty/low/good) |
| `weekly-digest` | Sat 08:00 | windowed sends/bounce + lifetime interested → Client·Sends·Bnc%·Int table |
| `monthly-digest` | 1st 08:00 | same, month-to-date window |
| `bounce-alerts` | **every ~10 min** | per-campaign recent-window bounce rate; **@channel** alert (via `BOUNCE_MENTION`) at `BOUNCE_THRESHOLD` (3%, = the auto-protect level) over `BOUNCE_MIN_SENT` (15) sends in `BOUNCE_WINDOW_DAYS` (3); **includes recently-PAUSED** campaigns (so an auto-paused spike still surfaces); **level-triggered** (one ping per breach, re-arms on recovery); labels by `CLIENT_BY_ID_JSON` when the client is the campaign-name SUFFIX |
| `interested-replies` | every 10 min | master-inbox poll, category Interested/Meeting-Request → hot-lead card (calm log, no ping) |
| `reply-followups` | daily 08:00 | master-inbox replies in last N days, grouped by client + sequence step |
| `stale-inbox` | hourly | interested replies awaiting a response > threshold mins (recent only) |
| `reply-alerts` | **every 1 min** | master-inbox poll of the newest `ALERT_POLL_PAGES`×20; an **actionable category** (default 7: Interested, Meeting Request, Information Request, Uncategorizable by Ai, Referral, Custom Response, Future Contact) → **@channel ping** card with a per-lead Smartlead deep link (`?action=INBOX&leadMap=<email_lead_map_id>`), a contacts-log sheet link, and a one-click **📞 phone-enrich** button (URL button → `doGet` → BetterContact → `phoneJobPoll`, with a **90-day dedup**: `doGet` re-posts a cached phone and skips the paid BetterContact call unless the lead has no number on file or it is >`PHONE_CACHE_DAYS`, default 90, days old — so a lead is never scraped twice within the window). Separate seen-state; seeds silently on first run |
| `health-alerts` | **every 5 min** | **mailbox health**: `GET /email-accounts` (paginated) → any account with `is_smtp_success===false` or `is_imap_success===false` → **@channel ping** card classified as Disconnected (both fail → reconnect) / SMTP-failing (often provider-side) / IMAP-failing, with the provider error + fix. **Campaign health**: roster status transitions ACTIVE→PAUSED, alerted **only when** recent bounce ≥ `HEALTH_BOUNCE_THRESHOLD` (the high-bounce auto-pause; Smartlead has no auto-pause flag, so manual pauses stay quiet). Level-triggered: a `HealthState` blob tracks the current broken set + per-campaign status, alerts on a NEW breakage/pause, posts ✅ on recovery; first run seeds silently with one summary card |

## Data model facts (validated live — don't re-derive)

- Smartlead campaigns are **not tagged to client records** (`client_id` is null). The client is the
  **campaign-name prefix before `|`**. (So per-client analytics endpoints return zeros — group by
  name prefix instead.)
- Windowed stats: `GET /campaigns/{id}/analytics-by-date?start_date&end_date` → `sent_count`,
  `bounce_count`, `reply_count`.
- Lifetime stats: `GET /campaigns/{id}/analytics` → `+ campaign_lead_stats.{interested, notStarted, total}`.
- Roster: `GET /analytics/campaign/list` (filter out `DRAFTED`).
- Replies: `POST /master-inbox/inbox-replies?api_key=` body `{offset, limit}` — **`limit` caps at 20**
  (see Gotchas), api_key in the query NOT the body. Useful fields: `lead_category_id` (1=Interested,
  2=Meeting Request, both "positive"), `lead_first/last_name`, `lead_email`, `email_campaign_name`,
  `current_sequence_number`, `has_new_unread_email`, `last_reply_time`, `is_archived`, `email_lead_id`.
- Smartlead open-tracking is off (0% opens) — digests report Sends / Bounce% / Interested, never opens.

## Runbook

All file paths below resolve under `outbound/scripts/smartlead-slack-reporting/`.

### 1 — Slack app + bot token  (operator clicks Allow)
- https://api.slack.com/apps → **Create New App** → From scratch → name `Smartlead Reports` →
  pick the target workspace.
- **OAuth & Permissions → Bot Token Scopes:** `chat:write`, `channels:manage`, `channels:read`,
  `channels:join`, `groups:write`, `groups:read`. (Add `channels:history` only if you later want the
  bot to read back / delete its own posts — not needed to run.)
- **Install to Workspace → Allow.** Copy the **Bot User OAuth Token** (`xoxb-…`) into `.env` as
  `SLACK_BOT_TOKEN`. (Secret — never paste it in chat.) If install is blocked, a workspace owner approves.

### 2 — Create the 10 channels
Channels are created **private** (operator preference — needs the bot's `groups:write`; invite the team
to each after creation). `SLACK_BOT_TOKEN=xoxb-… node create-channels.mjs` (or pass the token as the first arg). Idempotent —
reuses any channel that already exists. It prints a **CHANNELS_JSON** map (report-key → channel id).
Save that map for steps 3 and 6. (To clone the SAME audience from an existing channel into a new one —
e.g. when adding `reply-alerts` to a deployment whose other channels already have members —
`node replicate-channel.mjs <new-channel-name> <source-channel-id>` creates it and invites the source
channel's members.)

### 3 — Apps Script project  (operator authorizes Google)
1. In the company's Google account: https://script.google.com → **New project** → name `Smartlead Reports`.
2. Paste `Code.gs` into the editor. Open the manifest (⚙ Project Settings → "Show appsscript.json")
   and paste `appsscript.json`. **Paste mojibake-safe** (see Gotchas).
3. **Project Settings → Script Properties** — add:
   - `SMARTLEAD_API_KEY` — from `.env`
   - `SLACK_BOT_TOKEN` — `xoxb-…`
   - `CHANNELS_JSON` — the map from step 2
   - `CLIENT_ALIASES_JSON` *(optional)* — merge name variants, e.g.
     `{"Acme B2B — lookalike":"Acme","In Parallel":"In-Parallel"}`
   - `CLIENT_BY_ID_JSON` *(optional)* — label by Smartlead client_id when the client is the campaign-name SUFFIX, e.g. `{"123456":"ExampleCo"}` (placeholder id: use this client's own Smartlead `client_id`)
   - *(optional tuning, with defaults)* `BOUNCE_THRESHOLD=0.03`, `BOUNCE_MIN_SENT=15`,
     `BOUNCE_WINDOW_DAYS=3`, `BOUNCE_MENTION=<!channel>`, `BOUNCE_INCLUDE_PAUSED=true`, `LEADS_LOW=200`, `STALE_THRESHOLD_MIN=15`, `STALE_MAX_AGE_DAYS=1`,
     `FUP_WINDOW_DAYS=2`, `INTERESTED_CATEGORY_IDS=1,2`, `TZ=Europe/Helsinki`,
     `ALERT_CATEGORY_IDS=1,2`, `ALERT_POLL_PAGES=2`, `ALERT_MENTION=<!channel>` (report 9),
     `HEALTH_MENTION=<!channel>`, `HEALTH_MAX_CARDS=6`, `HEALTH_BOUNCE_THRESHOLD=0.03`,
     `HEALTH_BOUNCE_MIN_SENT=50`, `HEALTH_BOUNCE_WINDOW_DAYS=3` (report 10)
4. Run **`setup()`** once → **Allow** the Google authorization. It creates the state spreadsheet and
   installs all 10 time-based triggers (incl. the 1-min `replyAlertPoll` and the 5-min `healthAlertPoll`).
   *(Maintenance shortcut when `setup()`/Run is blocked by re-consent: add a single trigger via the
   Triggers UI → Add Trigger → pick the function, Time-driven, Minutes/Hour timer, Save. For an
   already-authorized script with no new scopes this needs NO OAuth re-consent.)*

### 4 — Validate (do this; the reply reports have a history of silent failure)
- **Analytics reports:** run `test_ping_`, then `dailySendsReport`, `weeklyDigest`, `dailyLeadsReport`
  in the editor → confirm posts land. Or locally: copy `config.example.json` → `config.local.json`,
  fill in `channels` (the CHANNELS_JSON map) + `aliases`, then `node post.mjs diag` /
  `node post.mjs daily-sends` (Node path mirrors Code.gs exactly).
- **Reply reports (the fragile ones):** `node post.mjs diag` — confirms the master-inbox paginates and
  returns real replies (NOT 0). Then `node post.mjs followups` posts a real digest. `node post.mjs stale`
  should be quiet unless a hot lead is genuinely overdue.
- **Interested-reply seed safety:** in the editor run **`interestedRepliesPoll`** once and check the
  execution log says `seeded N interested leads (no backfill on first run)` and posts **zero** cards.
  This proves the poll won't spam old interested leads into the channel on first activation. (Locally:
  `node post.mjs interested-poll-sim`.)
- **Reply-alert seed safety (CRITICAL, this one @channel-pings):** locally run
  `node post.mjs reply-alert-sim` → must read `RUN 1 … SEEDED N, POSTED 0` then `RUN 2 … POSTED 0`.
  In the editor run **`replyAlertPoll`** once → log must say `reply-alert seeded N (no @channel backfill
  on first run)` and post **zero** cards. If this poll didn't seed silently it would @channel-ping the
  team with every historical positive reply on first activation. To eyeball the card format without
  pinging anyone, run **`test_replyAlertPreview`** (posts one sample, no `@channel`) or
  `node post.mjs reply-alert-preview 1`.
- **Health-alert logic + seed safety (report 10):** locally run `node post.mjs health-selftest` (pure
  diff unit test — proves new-break/recover/**re-break** and the ACTIVE→PAUSED gate; expects 5/5 pass)
  and `node post.mjs health-sim` (two passes over live data: RUN 1 firstRun seeds the current broken
  mailboxes + paused campaigns and posts only the summary, RUN 2 posts 0). To eyeball the card formats
  without an `@channel` ping, run `node post.mjs health-preview` or, in the editor, **`test_healthPreview`**
  (both post sample cards with no ping and no state write). In the editor, the 5-min `healthAlertPoll`
  trigger's first scheduled run seeds silently — confirm in Executions: `healthAlertPoll firstRun=true …
  posted=1`.

### 5 — (optional) Node / VPS fallback
`post.mjs` runs the same reports from Node (cron on a VPS, or manual). It reads secrets from `.env`
and channels/aliases from `config.local.json`. Modes: `scheduled` (sends+weekly+leads+bounce),
`daily-sends`, `weekly`, `monthly`, `leads`, `bounce`, `followups`, `interested`, `stale`, `diag`,
`reply-alert` (live @channel ping), `reply-alert-preview` (one card, no ping), `reply-alert-sim`
(seed-safety proof, posts nothing), `health` (live run, file-backed state), `health-preview` (sample
cards, no ping/state), `health-sim` (seed proof over live data), `health-selftest` (pure diff unit test).

## Config reference

| Where | Key | Meaning | Default |
|---|---|---|---|
| `.env` (secret) | `SMARTLEAD_API_KEY` | Smartlead API key | — |
| `.env` (secret) | `SLACK_BOT_TOKEN` | bot `xoxb-…` token | — |
| Script Property / `config.local.json` | `CHANNELS_JSON` / `channels` | report-key → Slack channel id | — |
| Script Property / `config.local.json` | `CLIENT_ALIASES_JSON` / `aliases` | merge client-name variants | `{}` |
| Script Property | `BOUNCE_THRESHOLD` | bounce alert trigger (fraction) | `0.03` |
| Script Property | `BOUNCE_MIN_SENT` | min sends before a bounce can alert | `15` |
| Script Property | `BOUNCE_WINDOW_DAYS` | recent window for bounce scan | `3` |
| Script Property | `BOUNCE_MENTION` | @channel mention on bounce alerts (empty = silent) | `<!channel>` |
| Script Property | `BOUNCE_INCLUDE_PAUSED` | also scan recently-paused campaigns | `true` |
| Script Property | `CLIENT_BY_ID_JSON` | client_id → label map (suffix-named clients) | `{}` |
| Script Property | `LEADS_LOW` | "running low" leads-remaining threshold | `200` |
| Script Property | `STALE_THRESHOLD_MIN` | mins unanswered before "stale" | `15` |
| Script Property | `STALE_MAX_AGE_DAYS` | only flag interested replies this recent | `1` |
| Script Property | `FUP_WINDOW_DAYS` | reply-followups look-back window | `2` |
| Script Property | `INTERESTED_CATEGORY_IDS` | positive categories (comma list) | `1,2` |
| Script Property | `ALERT_CATEGORY_IDS` | report 9: categories that trigger the @channel ping | `1,2,5,8,3541,3830,4407` |
| Script Property | `ALERT_POLL_PAGES` | report 9: newest 20-item pages scanned each minute | `2` |
| Script Property | `ALERT_MENTION` | report 9: broadcast used to notify (`<!channel>`, `<!here>`, or a user-group `<!subteam^ID>`) | `<!channel>` |
| Script Property | `WEBAPP_URL` | report 9 Phase B: the published web-app URL — use the **Workspace domain form** `https://script.google.com/a/macros/<domain>/s/<id>/exec` (the plain `/macros/s/<id>/exec` throws "unable to open the file" for multi-Google-account users) | — |
| Script Property | `PHONE_CACHE_DAYS` | report 9: dedup window — a lead's phone is re-posted (no BetterContact spend) if enriched within this many days; only re-scraped after | `90` |
| Script Property | `ENRICH_TOKEN` | report 9 Phase B: unguessable token guarding the enrich web-app | — |
| Script Property | `BETTERCONTACT_API_KEY` | report 9 Phase B: BetterContact key for phone enrichment | — |
| Script Property (auto) | `LOG_SHEET_ID` / `LOG_SHEET_URL` | report 9: contacts-log sheet, auto-created on first run | (auto) |
| Script Property | `HEALTH_MENTION` | report 10: broadcast used to notify on a mailbox/campaign problem | `<!channel>` |
| Script Property | `HEALTH_MAX_CARDS` | report 10: > this many NEW breakages at once → one summary card instead of N | `6` |
| Script Property | `HEALTH_BOUNCE_THRESHOLD` | report 10: recent bounce fraction that flags an ACTIVE→PAUSED as a high-bounce auto-pause | `0.03` |
| Script Property | `HEALTH_BOUNCE_MIN_SENT` | report 10: min recent sends before a pause can alert (ignores tiny samples) | `50` |
| Script Property | `HEALTH_BOUNCE_WINDOW_DAYS` | report 10: recent window for the pause bounce check | `3` |
| Script Property (auto) | `HealthState` (state-sheet tab) | report 10: level-trigger state (current broken set + per-campaign status) | (auto) |
| Script Property | `TZ` | trigger timezone | `Europe/Helsinki` |

## Gotchas (these cost real time — read before deploying)

- **Master-inbox `limit` caps at 20.** `POST /master-inbox/inbox-replies` rejects `limit > 20` with
  HTTP 400. `inboxReplies_` **paginates in pages of 20** (newest-first). Originally it asked for 100,
  got a swallowed 400, returned `[]`, and the 3 reply reports silently posted nothing for a while —
  ALWAYS validate the reply reports against live data (`node post.mjs diag` must return >0), never trust
  that they "should" work. Fixed in the bundled code; don't reintroduce a `limit>20`.
- **Two recency windows exist on purpose.** `reply-followups` only shows the last `FUP_WINDOW_DAYS`
  (else it dumps the most-recent 100 every day); `stale-inbox` only flags replies from the last
  `STALE_MAX_AGE_DAYS` (else it re-alerts weeks-old threads every hour forever).
- **Editing `Code.gs` re-triggers Google authorization** (even with unchanged scopes). After any edit
  + save, the first Run / trigger-save hangs until you re-complete the OAuth consent (Review
  permissions → Allow). Re-running `setup()` is only needed if the *trigger set* changed — triggers
  point to "Head" (latest code), so plain code edits go live on save.
- **The editor's function selector can show one function but run the previously-loaded one** (watch
  execution time: `setup` ≈ 9s vs a report ≈ 24s). Select → click away to commit → verify the selector
  → then Run.
- **Mojibake-safe paste (Windows/PowerShell):** PowerShell's default `Get-Content` reads UTF-8 as ANSI
  and turns em-dashes into `â€"`. Stage the clipboard with
  `Set-Clipboard -Value (Get-Content -Raw -Encoding UTF8 <Code.gs>)`, then Ctrl+A / Ctrl+V / Ctrl+S
  in the editor.
- **The connected Slack MCP is often the wrong workspace.** To read/post in the target workspace use
  the bot token or a browser logged into that workspace — verify the workspace before trusting any
  Slack data.

## Files (all under `scripts/smartlead-slack-reporting/`)

- `Code.gs` — the deployed Apps Script (all 10 reports + `setup()`/triggers). **Source of truth.**
- `appsscript.json` — manifest (V8, web-app enabled).
- `post.mjs` — Node mirror of `Code.gs` (local test + VPS/cron fallback). Reads `.env` + `config.local.json`.
- `preview.mjs` — live dry-run (renders reports to console, posts nothing).
- `create-channels.mjs` — creates the 9 channels in any workspace; prints `CHANNELS_JSON`.
- `replicate-channel.mjs` — create one new channel + invite the SAME members as an existing channel (same-audience clone).
- `_health_probe.mjs` — dev-only: dumps the live campaign-status enum + hunts for a pause-reason field + reconfirms the mailbox connection fields (used when building/validating report 10).
- `config.example.json` — template for the per-deployment, non-secret config (channels + aliases).
- `config.local.json` — your filled-in copy (auto-gitignored via `*.local.json`). One per deployment.
- `DEPLOY.md` — the live the upstream workspace deployment record (ids, status, gotchas hit). Per-deployment log.
- `_sl_inbox_probe.mjs`, `_sl_report_probe.mjs` — endpoint shape probers (dev only).

Full spec / background: `outbound/smartlead-slack-reporting.md`.
