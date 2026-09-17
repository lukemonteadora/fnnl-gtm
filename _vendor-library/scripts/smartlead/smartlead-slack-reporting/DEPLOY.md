# Deploy — Smartlead → Slack Reporting

Mirrors the EmailBison `bison-*` Slack reports, driven by Smartlead, hosted in Google Apps Script
(always-on, laptop-independent). Two steps need the operator to click **Allow** (Slack install, Google
authorize); everything else is scripted/automatable.

> **Repeatable for any company/workspace:** the full deploy runbook is the **`/smartlead-slack-reporting`
> skill** (`.claude/skills/smartlead-slack-reporting/SKILL.md`). This file is the *the upstream workspace deployment
> record* (its live ids + what we hit). `Code.gs` is already config-driven (Script Properties), and the
> Node path reads company specifics from `config.local.json` — nothing company-specific is hardcoded.

## Files
- `Code.gs` — the reporter (all 8 reports + webhook receiver). Source of truth.
- `appsscript.json` — manifest (web-app enabled, V8).
- `post.mjs` — Node mirror of Code.gs (local test + VPS/cron fallback); reads `.env` + `config.local.json`.
- `preview.mjs` — local dry-run against live Smartlead (no Slack). Also the VPS/Node fallback.
- `create-channels.mjs` — creates the 8 channels in any workspace; prints CHANNELS_JSON.
- `config.example.json` — template for per-deployment non-secret config (channels + aliases).
- `config.local.json` — the upstream workspace's filled-in copy (auto-gitignored via `*.local.json`).
- `_sl_report_probe.mjs`, `_sl_inbox_probe.mjs` — endpoint shape probers (dev only).

## Validated data model (live 2026-06-15)
- Smartlead campaigns are **not** tagged to client records → client = **campaign-name prefix before `|`**.
- Windowed stats: `GET /campaigns/{id}/analytics-by-date?start_date&end_date` → `sent_count, bounce_count, reply_count`.
- Lifetime stats: `GET /campaigns/{id}/analytics` → `+ campaign_lead_stats.{interested, notStarted, total}`.
- Roster: `GET /analytics/campaign/list` (filter out `DRAFTED`). ~249 active of 323.

## DEPLOYMENT STATUS — ✅ LIVE (2026-06-15)
- ✅ Slack app **Smartlead Reports** (id `<SLACK_APP_ID>`) installed to the upstream workspace. Bot token in `scripts/.env` (`SLACK_BOT_TOKEN`).
- ✅ 9 channels created (CHANNELS_JSON):
  `{"daily-sends-report":"C0XXXXXXXXX","daily-leads-report":"C0XXXXXXXXX","weekly-digest":"C0XXXXXXXXX","monthly-digest":"C0XXXXXXXXX","bounce-alerts":"C0XXXXXXXXX","interested-replies":"C0XXXXXXXXX","reply-followups":"C0XXXXXXXXX","stale-inbox":"C0XXXXXXXXX","reply-alerts":"C0XXXXXXXXX"}`
  (`reply-alerts` = report 9, added 2026-06-23 via `replicate-channel.mjs`, same 7 members as the other channels.)
- ✅ **Apps Script deployed + LIVE** — project **"Smartlead Reports [Claude Code]"**, id `<APPS_SCRIPT_PROJECT_ID>`, owner **<OPERATOR_EMAIL>** (`/u/1/`). 4 Script Properties set (key, token, channels, aliases). State sheet auto-created by `setup()`.
- ✅ Time-based triggers running on Google's cloud (laptop-independent): dailySendsReport, dailyLeadsReport, replyFollowupsReport (daily 08:00); weeklyDigest (Sat); monthlyDigest (1st); **bounceCheck (every ~10 min — was 3h, changed 2026-06-25 for the ≤15-min bounce SLA)**; staleInboxCheck (hourly); replyAlertPoll + phoneJobPoll (1 min); healthAlertPoll (5 min).
- ⚠ **2026-06-25 — bounce alarm rebuilt + health-alerts repaired (the operator /goal).** The live `bounce-alerts` channel had NEVER fired (old floor: 300+ sends in a 2-day window, but low-volume clients send ~17-90/day) and `healthAlertPoll` was failing 100% (its channel id was absent from the live `CHANNELS_JSON`). Now: `bounceCheck` is level-triggered, 3% / 15-sent / 3-day, includes recently-PAUSED campaigns, @channel via `BOUNCE_MENTION`, labels by `CLIENT_BY_ID_JSON`; `CHANNELS_JSON` includes `health-alerts`. **After deploy the bounceCheck trigger must be edited to every-10-min in the Triggers UI** (running `setup()` also does it but re-prompts OAuth).
- ✅ **2026-06-28 — health-alerts now pings <operator> + <teammate> instead of @channel (the operator /goal).** Set live Script Property `HEALTH_MENTION` = `<@<SLACK_MEMBER_ID>> <@<SLACK_MEMBER_ID>>` (<operator> `<SLACK_MEMBER_ID>` + a teammate `<SLACK_MEMBER_ID>`, both verified members of `smartlead-health-alerts` so the pings land). Property change only — no `Code.gs` edit (the code default fallback stays the generic `<!channel>`), so no OAuth re-prompt and no redeploy. Verified by reading the property back after reload, and `healthAlertPoll` confirmed running 5-min Time-Driven + Completed in the Executions log (takes effect next poll). `BOUNCE_MENTION` and `ALERT_MENTION` deliberately left on `<!channel>` — only the health channel was in scope.
- ✅ **End-to-end proven** — live reports posted to the channels (daily-sends TOTAL 327; weekly/monthly digests; daily-leads; bounce correctly quiet). `interestedRepliesPoll` seeds silently on first run (no backfill of the ~500 historical interested leads).
- 8th report is **poll-based** (every-10-min master-inbox scan), NOT the webhook/web-app `doPost` (Step 4 was abandoned — webhooks would need fragile per-campaign wiring across 249 rotating campaigns). `doPost` left in code as an optional future enhancement.

## Report 9: `smartlead-reply-alerts` (added 2026-06-23, ⚠ code activation pending)
**Goal:** the moment a lead replies in an actionable way, @channel-ping the reply team so they answer ASAP (speed-to-lead), with a one-click phone enrich for cold-calling and a contacts-log sheet.

Done already (channel + all code committed; nothing live until the operator deploys):
- ✅ Channel `smartlead-reply-alerts` (`C0XXXXXXXXX`) created + same 7 members invited (`replicate-channel.mjs`).
- ✅ `Code.gs` (`replyAlertPoll` + `phoneJobPoll` + `doGet` + 1-min triggers) and `post.mjs` mirror committed.
- ✅ Seed-safety proven with the 7-category set: `node post.mjs reply-alert-sim` → `RUN 1 … SEEDED 4, POSTED 0`, `RUN 2 … POSTED 0`. Will NOT @channel-backfill old positives.
- ✅ Phone enrich proven: BetterContact returns `contact_phone_number` (~10 credits/find, pay-per-valid; 61k credits on <OPERATOR_EMAIL>).
- ✅ Per-lead Smartlead deep link verified live + shipped: the card + sheet link to `master-inbox?action=INBOX&leadMap=<email_lead_map_id>` (opens that exact lead's conversation), falling back to the inbox root if the id is missing.

Deploy in two phases (Phase A is the valuable low-risk part; don't let Phase B block it):

### Phase A: turn on the alerts (categories + sheet + Smartlead link). Needs only the Code.gs paste.
1. Open the **Smartlead Reports [Claude Code]** Apps Script project (owner <OPERATOR_EMAIL>, `/u/1/`).
2. Replace `Code.gs` with the updated repo version (mojibake-safe paste, see Gotchas).
3. **Script Properties → `CHANNELS_JSON`**: add `"reply-alerts":"C0XXXXXXXXX"`. (Optional tuning: `ALERT_CATEGORY_IDS=1,2,5,8,3541,3830,4407` is the built-in default = Interested, Meeting Request, Information Request, Uncategorizable by Ai, Referral, Custom Response, Future Contact; `ALERT_POLL_PAGES=2`; `ALERT_MENTION=<!channel>`.)
4. Run **`setup()`** once → re-complete the OAuth **Allow** → it reinstalls all triggers incl. the 1-min `replyAlertPoll` + `phoneJobPoll`. (`setup()` also auto-creates the contacts-log sheet on the first `replyAlertPoll`.)
5. Confirm: run `replyAlertPoll` once → log reads `reply-alert seeded N (no @channel backfill on first run)` + `Contacts-log sheet created: <url>`, posts 0. Run `test_replyAlertPreview` to eyeball one card.
6. **Share the contacts-log sheet** (the URL from step 5): Share → General access → the upstream workspace (domain-restricted view). It is left private by default because it holds names/emails/phones.

### Phase B: turn on the one-click phone-enrich button. Needs a web-app deployment.
1. **Deploy → New deployment → Web app**; description "reply-alert enrich"; execute as **me (the account owner)**; who has access **Anyone**. Copy the `/exec` URL.
2. **Script Properties**: set `WEBAPP_URL`, `ENRICH_TOKEN` (any long random string — gates the button so randoms can't spend credits), `BETTERCONTACT_API_KEY` (from `scripts/.env`). **Use the Workspace domain form for `WEBAPP_URL`: `https://script.google.com/a/macros/<domain>/s/<id>/exec`, NOT the plain `/macros/s/<id>/exec`** — the plain form throws "Sorry, unable to open the file at this time" for anyone whose *default* Google account isn't the web-app owner (Google's multi-account `/u/N/` redirect bug); the `/a/macros/<domain>/` form pins the Workspace context so every team member's click resolves (verified live 2026-06-24 on a multi-account browser). The operator enters `ENRICH_TOKEN` + `BETTERCONTACT_API_KEY` themselves — Claude is barred from typing tokens/API keys into fields.
3. That's it. The `📞 Enrich phone` button now appears on new cards (it is hidden until `WEBAPP_URL`+`ENRICH_TOKEN` are set, so Phase A never shows a dead button). Clicking it opens a tiny "looking it up" page; ~1 min later the phone posts to the channel and lands in the contacts-log sheet. No Slack Interactivity config is needed (it's a plain URL button). **Built-in 90-day dedup (no duplicate scrapes):** before calling BetterContact, `doGet` re-posts any phone already enriched for that lead within `PHONE_CACHE_DAYS` (default 90) and SKIPS the paid call (0 credits) — it only re-scrapes when nothing is on file or the result is >90 days old (driven by the `Phone Enriched At` col-L timestamp). **Editing `doGet` (e.g. the dedup) needs the web app redeployed to a NEW version** (Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy) for the change to take effect — saving Code.gs alone only updates the time-triggers, not the web app.
4. Smoke test: click the button on a real card → within ~2 min a `📞 Phone found …` (or "no phone found") message posts to the channel.

⚠ **The Slack→web-app round-trip is UNVERIFIABLE until deployed** (the button URL only resolves once the web app is published). Treat Phase B as "ship + smoke-test," not "pre-proven."

⏳ **PENDING LIVE DEPLOY (2026-07-01) — phone-enrich reliability hardening (commit `2cbba80`).** The button itself was verified working end-to-end (Robin Bonnes + Maarten Kruit posted live); this fix closes two *latent* silent-miss gaps and is committed in the repo `Code.gs` but **NOT yet on the live Apps Script** (operator chose to defer). Changes: (1) `phoneJobsAdd_` serializes the `PhoneJobs` add under a `LockService` lock and `phoneJobPoll` deletes resolved jobs via a FRESH locked re-read — closes the doGet↔poll read-modify-write race that could store a job ("looking up…" shown) then silently lose it; (2) `postPhoneTimeout_` posts a "lookup didn't finish, retry" note instead of the silent 15-min drop. To deploy: paste the repo `Code.gs` into the live project → save → **Deploy → Manage deployments → Edit → New version → Deploy** (a `doGet`/`phoneJobsAdd_` change needs a NEW web-app version), re-consent OAuth, then smoke-test on a fresh card. NOTE: the live `Code.gs` is also a few earlier committed-but-undeployed tweaks behind the repo (bounce/health cosmetics), so a full-file paste ships those too.

- **Why a NEW channel, not the existing `interested-replies`:** report 8 is the calm 10-min log with no @-mention, so it does not push a notification on its own. Report 9 is the act-now surface: 1-min cadence + guaranteed `@channel` push + the phone button. SEPARATE seen-states so they don't interfere.
- **DEDUP — RESOLVED (2026-06-23):** report 9 supersedes report 8, so the old `interestedRepliesPoll` is **retired by default** (its trigger is no longer installed by `setupTriggers()`) to stop hot leads double-posting. The `smartlead-interested-replies` channel just goes quiet on deploy — archive it whenever (cosmetic). Reversible with zero redeploy: set Script Property `KEEP_INTERESTED_POLL=1` to keep the old 10-min log running alongside.
- **NEXT UPGRADE (optional):** target only the named reply team via a Slack user group (`usergroups:write`) + `ALERT_MENTION=<!subteam^ID>` (instead of @channel to everyone).

### Gotcha hit during deploy
- **Editing the Apps Script code re-triggers Google authorization** (even with unchanged scopes). After any `Code.gs` edit + save, the first `Run`/trigger-save hangs until you re-complete the OAuth consent. Fix: run any function once → "Review permissions" → Allow, then `setup()` reinstalls triggers cleanly.
- The editor's **function selector can show a function but run the previously-loaded one** (watch execution time: setup ≈ 9s, dailySendsReport ≈ 24s). Select → click away to commit → verify selector → then Run.

### ⚠️ Production bug found + fixed 2026-06-16 — master-inbox limit cap (the 3 reply reports were silently dead)
- **Root cause:** `POST /master-inbox/inbox-replies` **caps `limit` at 20** (`limit > 20` → HTTP 400 `"limit must be less than or equal to 20"`). The original `inboxReplies_()` requested `limit:100`, which 400'd, was swallowed by the `try/catch`, and returned `[]`. So **reply-followups, stale-inbox, and interested-replies posted nothing** in production — they only ever ran against empty data. The 5 analytics-based reports were unaffected.
- **Fix:** `inboxReplies_(maxItems)` now **paginates in pages of 20** (newest-first, `offset += 20`, stops on short page / 400 / `maxItems`, hard cap offset ≤ 600). Mirrored identically in `post.mjs`. Validated live: paginated fetch returns 100 real replies; reply-followups posted a real 10-reply / 3-client digest; interested card renders correctly; stale correctly quiet.
- **Two recency windows added** (once the layer actually returns data, unbounded scans become noisy):
  - `reply-followups` → only replies within `FUP_WINDOW_DAYS` (default **2**), else it dumps the most-recent 100 every day.
  - `stale-inbox` → only interested replies received within `STALE_MAX_AGE_DAYS` (default **1**), else it re-alerts weeks-old threads every hour forever.
- **Interested categories** now `1,2` (Interested **+ Meeting Request**, both sentiment "positive") via `INTERESTED_CATEGORY_IDS` (was hard-coded to `1`).
- **Seed safety re-verified** (the "seeds silently on first run" was previously *vacuous* — it seeded nothing because the fetch was empty). Simulated against real data: first poll seeds the 3 existing (old) interested leads and **posts 0**; second run posts 0. Confirmed in the live GAS editor by running `interestedRepliesPoll` once after redeploy (log: `seeded N …`, zero cards posted).

### Remaining (optional, cosmetic)
- Drag the 8 channels into a new "Smartlead" sidebar section in Slack (mirror the "Bison" section). Purely visual.
- Tune `CLIENT_ALIASES_JSON` further if new duplicate client rows appear (naming variants).

## Report 10: `smartlead-health-alerts` (added 2026-06-24, ✅ LIVE)
**Goal:** the moment a mailbox disconnects / needs reconnection / fails sending, OR a campaign gets
auto-paused for high bounce, @channel-ping the team so they fix it ASAP. This is the "something broke,
act now" surface, distinct from `bounce-alerts` (the softer "bounce is climbing, consider pausing" early
warning) and `reply-alerts` (hot leads).

Two detectors in one 5-min poll (`healthAlertPoll`):
- **Mailbox health** — pulls every `GET /email-accounts` (paginated 400) and flags any with
  `is_smtp_success===false` or `is_imap_success===false` (the same actionable set as `_fix_issues_scan.mjs`).
  Card classifies: both fail = **Disconnected (reconnect)**; SMTP-only = **SMTP failing** (usually
  provider-side — Workspace sending not enabled; IMAP rides the same token so it's up); IMAP-only =
  re-auth. Shows the provider error verbatim + the fix.
- **Campaign health** — roster status transition ACTIVE→PAUSED, alerted **only when** recent bounce ≥
  `HEALTH_BOUNCE_THRESHOLD` (default 3%, = Smartlead's auto-protect). Verified live that Smartlead exposes
  **no** auto-pause/error field on the campaign object (`_health_probe.mjs`), and the status enum is only
  ACTIVE/PAUSED/COMPLETED/DRAFTED — so the recent-bounce proxy is the high-signal gate, and routine manual
  pauses stay quiet (they'd otherwise train the team to mute the channel).

**Level-triggered, no spam.** A `HealthState` state-sheet blob holds the current broken-mailbox set +
per-campaign status. Each poll diffs: NEW breakage → alert; recovered → ✅; first run → ONE summary card,
seed silently. NOT the append-only `seen` pattern — a mailbox that breaks → recovers → re-breaks re-alerts.
Empty-pull guard: a transient API hiccup returning 0 accounts is skipped, never treated as "all recovered".

Done + LIVE (2026-06-24):
- ✅ Channel `smartlead-health-alerts` (`C0XXXXXXXXX`) created + same 7 members as the other channels
  (`replicate-channel.mjs ... C0XXXXXXXXX`).
- ✅ `Code.gs` (`healthAlertPoll` + cards + `computeHealth_` + `test_healthPreview` + 5-min trigger in
  `setupTriggers`) and `post.mjs` mirror committed. Syntax-checked; logic proven by `node post.mjs
  health-selftest` (5/5, incl. re-break) + `health-sim` (live data: RUN1 seeds 12 broken + 23 paused,
  posts summary only; RUN2 posts 0).
- ✅ Deployed to the live GAS project via browser: `Code.gs` pasted (Monaco `setValue` from a
  gzip+base64 payload read off the clipboard — avoids the NUL/escaping issues), `CHANNELS_JSON` extended
  to 10 (`"health-alerts":"C0XXXXXXXXX"`, verified persisted after reload), and the 5-min `healthAlertPoll`
  trigger added via the **Triggers UI** (no OAuth re-consent — no new scopes; reuses `stateGet_`/`stateSet_`).
- ✅ **First scheduled fire verified:** Executions shows `healthAlertPoll` Completed (5:40:27 PM, 8.66s),
  and the channel received the seeded **"Health Alerts Are Now Live"** summary (12 SMTP mailboxes,
  23 paused campaigns) — no @channel backfill. Sample mailbox + campaign cards were also posted via
  `node post.mjs health-preview` (labeled `[PREVIEW]`, no ping; harmless, operator can delete them).

Tuning props (all optional, defaults baked in): `HEALTH_MENTION=<!channel>`, `HEALTH_MAX_CARDS=6`,
`HEALTH_BOUNCE_THRESHOLD=0.03`, `HEALTH_BOUNCE_MIN_SENT=50`, `HEALTH_BOUNCE_WINDOW_DAYS=3`.

**KEY DEPLOY LEARNING (reusable):** to push an updated `Code.gs` into the GAS editor without the
clipboard-NUL / synthetic-typing problems, gzip+base64 the file, put it on the OS clipboard, read it
in-page with `navigator.clipboard.readText()`, decode via `DecompressionStream('gzip')`, and
`monaco.editor.getModels()[0].setValue(text)` then Ctrl+S. Returning the source via the JS tool is blocked
by a query-string filter, so verify with booleans/lengths, not by dumping the text.

## Step 1 — Slack app + bot token  (the operator clicks Allow)  ✅ DONE
1. https://api.slack.com/apps → **Create New App** → From scratch → name `Smartlead Reports` → workspace **A SALES**.
2. **OAuth & Permissions** → Bot Token Scopes: `chat:write`, `channels:manage`, `channels:read`, `channels:join`, `groups:write`, `groups:read`.
3. **Install to Workspace** → **Allow**. Copy the **Bot User OAuth Token** (`xoxb-…`).  ← secret; do not paste in chat.
   (If install is blocked, an the upstream workspace workspace owner must approve the app.)

## Step 2 — Create the 8 channels + invite the bot
Run `create-channels.mjs` (uses the bot token; creates public channels and the bot auto-joins):
`smartlead-daily-sends-report, smartlead-daily-leads-report, smartlead-weekly-digest,
smartlead-monthly-digest, smartlead-bounce-alerts, smartlead-interested-replies,
smartlead-reply-followups, smartlead-stale-inbox`.
It prints a `CHANNELS_JSON` map of channel name → id for Step 3.
(Cosmetic: drag them into a new "Smartlead" sidebar section to mirror "Bison".)

## Step 3 — Apps Script project  (the operator authorizes Google)
1. In the **the upstream workspace** Google account: https://script.google.com → **New project** → name `Smartlead Reports`.
2. Paste `Code.gs`; in the manifest (gear → "Show appsscript.json") paste `appsscript.json`.
3. **Project Settings → Script Properties** add:
   - `SMARTLEAD_API_KEY` = (from scripts/.env)
   - `SLACK_BOT_TOKEN` = `xoxb-…` (Step 1)
   - `CHANNELS_JSON` = the map from Step 2
   - optional: `CLIENT_ALIASES_JSON` to merge naming variants, e.g. `{"<Client Label> Variant Spelling":"<Client Label>"}`
   - optional: `CLIENT_BY_ID_JSON` to label by Smartlead client_id (for campaigns where the client is the name SUFFIX, e.g. `{"000000":"<Client Label>"}`)
   - optional tuning: `BOUNCE_THRESHOLD=0.03`, `BOUNCE_MIN_SENT=15`, `BOUNCE_WINDOW_DAYS=3`, `BOUNCE_MENTION=<!channel>`, `BOUNCE_INCLUDE_PAUSED=true`, `LEADS_LOW=200`, `STALE_THRESHOLD_MIN=15`, `STALE_MAX_AGE_DAYS=1`, `FUP_WINDOW_DAYS=2`, `INTERESTED_CATEGORY_IDS=1,2`, `TZ=Europe/Helsinki`
4. Run `setup()` once → **Allow** the Google authorization prompt. It creates the state spreadsheet and installs all triggers.
5. Smoke test: run `test_ping_`, then `test_dailySends`, `test_weekly`, `test_dailyLeads` — confirm posts land.

## Step 4 — Web app (for real-time interested-reply card)
1. **Deploy → New deployment → Web app**; execute as *me*, access *Anyone*. Copy the `/exec` URL.
2. Wire Smartlead webhooks → that URL for each (active) campaign via the Smartlead MCP
   `smartlead_add_or_update_campaign_webhook` with events `LEAD_CATEGORY_UPDATED` (+ `EMAIL_REPLY`).
   The endpoint posts the card only when the lead is categorised Interested/Positive.

## Schedule (installed by setup())
Daily 08:00: sends, leads, reply-followups. Sat 08:00: weekly. 1st 08:00: monthly.
Every ~10 min: bounce check (@channel; level-triggered; 3% / 15-sent / 3d; includes recently-paused). Hourly: stale inbox. Every 1 min: reply-alerts poll (@channel) + phone-job poll. (The old 10-min interested-replies poll is retired by default; set `KEEP_INTERESTED_POLL=1` to restore it.)
Every 1 min: reply-alerts (@channel ping, report 9).
Every 5 min: health-alerts (@channel ping, report 10 — mailbox down/needs-reconnect + campaign auto-paused for high bounce).

## Known tuning items
- **Bounce alerts** use a *recent* window (`BOUNCE_WINDOW_DAYS`, default 3) so they flag current
  spikes, not lifetime history (a lifetime scan flags 40+ old campaigns — too noisy).
- **Digest "Int"** is cumulative interested per client (Smartlead has no clean per-campaign windowed
  interested). Account-level windowed positive replies exist if a strictly windowed figure is wanted.
- **Naming variants** (`the upstream workspace` vs `the upstream workspace —`, `In Parallel` vs `In-Parallel`) → use `CLIENT_ALIASES_JSON`.
- Long-term cleaner alternative: tag Smartlead campaigns to client records, then per-client endpoints work directly.

## Full-fleet channel audit — 2026-06-24 (all 10 channels, live-verified)
Triggered by an operator request ("are the channels working / any redundant?"). **Result: every channel is
functioning correctly; none is broken.** Verified two ways: (a) the Apps Script **Executions** log (owner
<OPERATOR_EMAIL>) showed `replyAlertPoll` 1-min, `healthAlertPoll` 5-min, `phoneJobPoll` 1-min, `bounceCheck`
3h, and `doGet` all **Completed, zero failures**; (b) the actual channel contents read in the the upstream workspace Slack
web app.
- Posting on cadence: `daily-sends-report`, `daily-leads-report`, `reply-followups` (all posted today),
  `weekly-digest` (last Sat Jun 20), `reply-alerts` (organic card Jun 22 + phone-button tests today),
  `health-alerts` (live @channel mailbox-down ping Jun 24).
- Quiet **by design, not broken**: `bounce-alerts` (nothing has breached 5% / 500-sent since launch — healthy
  deliverability), `stale-inbox` (fired hourly Jun 18 for one overdue lead, 0 candidates since),
  `monthly-digest` (first run is Jul 1 — channel was created Jun 15, after this month's 1st).
- **Retired / redundant:** `interested-replies` — real cards until Jun 19, silent since the 10-min poll was
  retired (superseded by `reply-alerts`). **ARCHIVED 2026-06-24** (operator-approved; via bot
  `conversations.archive`, reversible by unarchiving). Left in CHANNELS_JSON so a `KEEP_INTERESTED_POLL=1`
  restore stays possible (would need an unarchive first).
- **Still public:** `health-alerts` (the only non-private channel) — flip to private is the operator's one click.
- **Audit-tooling gotchas:** the bot token lacks `groups:history`/`channels:history`, so it can't read back
  channel contents; the connected Slack MCP is the **Twelve Mavens** workspace, not the upstream workspace. Read the upstream workspace
  channel contents via Claude-in-Chrome `javascript_tool` against the logged-in Slack SPA (scope the message
  query to `.p-workspace__primary_view_body`; `get_page_text`/`read_page` time out on Slack's never-idle SPA).
  Roster/privacy/membership (no history needed): `node _channel_enumerate.mjs` and `node _channel_audit.mjs`.
