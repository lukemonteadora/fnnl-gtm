---
name: coldoutbound-gotchas
description: Field-tested "what works / what to AVOID" reference for mailbox provisioning, sender profile pictures, and mailbox-provider to sending-platform operations. Read this BEFORE infra/profile/export work to skip dead ends already paid for. "AVOID" = already tried, wasted time, confirmed not to work. Split into vendor-neutral lessons (trustworthy anywhere) and clearly labelled vendor-specific notes from a previous stack (verify before trusting them on FNNL's tools).
---

# Coldoutbound Field-Tested Gotchas (what works / what to AVOID)

Hard-won on live client builds in an earlier workspace (2026-06-05 onward). Each "AVOID" was actually tried
and burned a cycle. Read the relevant section before you start so you don't re-test the same dead ends.

## How to read this file (IMPORTANT)

This file has two halves, and they carry very different weight:

- **The main body below is vendor-neutral.** These lessons are about the environment, image tooling,
  provisioning behaviour, connection hygiene, and sender organisation. They hold regardless of which tools
  FNNL picks.
- **"Vendor-specific notes" at the bottom applied to a PREVIOUS stack.** They are kept because the detail is
  expensive to rediscover, but they are **not** a statement about FNNL's tools and **not** permission to use
  those tools. Verify any of it before you trust it here.

FNNL's actual tool per capability is declared in `outbound/stack-contract.yaml` (the
`registrar`, `mailbox_provider`, `sending_platform` and other slots). **If the slot you need is empty, stop
and route the operator to `/stack-setup`.** Do not pick a tool because a note below mentions it.

## Environment

- **Python may NOT be available** in this Claude Code env (`python`/`py`/`python3` can resolve to WindowsApps
  shims, not a real interpreter). The canonical `scripts/generate_inbox_profiles.py` (needs Python + Pillow)
  **can't run here** in that case. Build assets with Node (below), or hand that script to a machine with a
  real Python install.
- **Node v24 IS available.** Use it for image work.
- **OneDrive path trap:** loose folders under `C:\Users\admin\Documents\` (e.g. a stray
  `Documents\Mailbox Profiles\...`) are OneDrive-redirected and **dehydrate/lose files mid-session** (a
  generated headshot vanished this way). Save ALL generated assets INSIDE the repo:
  `outbound/profiles/<client>/assets/`. The repo root itself is local and safe.
- **Heavy web apps freeze the browser renderer** (sending platforms, mailbox providers, registrar dashboards):
  `screenshot`/`zoom`/`javascript_tool` time out ("renderer may be frozen"). Recover by reloading the tab.
  `find`/`read_page` (DOM) keep working while screenshots are frozen, so use them, and use **ref-based clicks**
  (find, then click by `ref`): pixel coordinates drift because the viewport RESIZES between screenshots.

## Profile pictures: headshot + logo crossfade GIF

- **Build the GIF in Node:** `npm install sharp gifenc` WORKS. **AVOID `gifencoder`**: it pulls native
  `canvas` which fails the node-pre-gyp build. Pipeline: `sharp` (decode/resize/composite + SVG raster) to
  raw RGBA frames, then `gifenc` (pure-JS GIF encode).
  - sharp rasterizing an SVG at high density gives "Input image exceeds pixel limit". Use
    `sharp(svgPath, { density: 150, limitInputPixels: false })`.
  - Working spec: 400x400, 32 frames (hold, crossfade, hold, crossfade-back), ~1.3 MB. Template:
    `profiles/<client>/assets/gifbuild/build.js`.
- **Keep any image-generation prompt ASCII-only.** An em dash or a smart quote inside `curl -d` JSON gives a
  "unicode decode error". If the image API returns base64 rather than a URL, decode it with `base64 -d`
  (no Python needed).
- **Hosting the GIF so a provider can fetch it:**
  `curl -F "reqtype=fileupload" -F "fileToUpload=@x.gif" https://catbox.moe/user/api.php` returns a permanent
  public URL with no account. Some providers **hotlink** that URL rather than re-hosting it, so keep the
  hosted file live. Check per provider whether it re-hosts (a CDN URL appears on the mailbox record) or hotlinks.
- **Profile-picture writes are commonly async.** A clean `200` often echoes the *pre-save* state (an empty or
  `null` picture field). That is NOT a failure and NOT a reason to retry. Re-read the mailbox record a minute
  later and confirm there; retrying on the empty response just double-writes.
- **Not every mailbox provider exposes a profile-picture write at all.** Before planning a hands-free avatar
  run, search the provider's API surface for an image / profile-picture field. If there is none, the avatar is
  a UI step (browser automation, or hand it to the operator). Do not burn cycles hunting for a hidden endpoint.

## Mailbox provisioning (any provider)

- **Capacity may have to be PURCHASED before mailboxes can be assigned**, and the purchase path is often
  UI/wallet-only with no working API. If an assign call fails with a "you don't have enough mailboxes" style
  error, that is a capacity problem, not a payload problem. **AVOID hunting for a purchase API.** Check the
  provider's docs once, then route the purchase to the operator (funding and card payment are a hard agent
  boundary, below).
- **Mailboxes take minutes to go ACTIVE**, and **app passwords populate with a lag** (in a 2-per-domain layout
  the second inbox typically lags). Do NOT export a mailbox to the sending platform before its app password is
  ready, or it won't connect. Re-export later to catch the stragglers.
- **App passwords can ROTATE** on a provider re-provision or sync. This silently BREAKS existing
  sending-platform connections (accounts may even disappear from the sending platform). Fix = re-export with
  the fresh credentials. The mailboxes themselves stay ACTIVE; nothing is lost at the provider.
- **Provider list endpoints often cap or paginate badly.** Before relying on a `list_*` call for a full
  inventory, check whether it caps and whether it supports an offset. If it caps with no offset you cannot
  page to the rest, so pull the full inventory from the provider's own REST API instead, using the session
  token from a logged-in browser tab.
- **A provider's list call may silently filter by the current context.** If a domain or mailbox you know
  exists is missing from a list response, suspect a context filter (Google vs Microsoft view, workspace
  scope) before you suspect the data.

## Connecting mailboxes to the sending platform

- **HARD RULE: Google/Microsoft mailboxes connect as the platform's NATIVE Gmail/Outlook account type ONLY,
  via the mailbox provider's native export. NEVER as generic SMTP.** Connecting a Google or Microsoft mailbox
  by posting SMTP/IMAP host + app password to the sending platform's REST API is forbidden *even though it
  often succeeds*: it creates a generic SMTP account, which means weaker deliverability, app-password
  fragility, a mangled non-ASCII sender name, and an inconsistent fleet. Always use the provider's
  **Export to sending platform** flow (native OAuth). Direct-REST/SMTP connect is allowed ONLY for a genuinely
  custom, non-Google and non-Microsoft host. **Verify after connect:** re-read the email account and confirm
  its type is the native Gmail/Outlook type, not SMTP. If it is SMTP, remove it and redo it natively. If
  native export is blocked because it needs the sending-platform login (a USER step), STOP and hand to the
  operator. Do NOT fall back to SMTP. (This rule exists because a batch of Google mailboxes was once connected
  as SMTP via direct REST and had to be torn down and redone natively.)
- **A saved provider-side connection removes the password step.** If the mailbox provider already holds a
  saved connection to the sending platform (check the provider's third-party-accounts list), its native export
  passes credentials internally and needs no password from you. Export is typically async, and **warmup often
  auto-enables on connect**, so verify that rather than re-enabling it.
- **Multiple operator logins on one sending-platform organisation are the SAME org**, so exports triggered
  from different logins all land in one place. Don't treat a second login as a second workspace.

## Tagging and organizing senders

- **Check for a real tag API before accepting "tags are UI-only".** A guessed endpoint returning 404 proves
  the guess was wrong, not that the capability is missing. Read the platform's actual API reference (or the
  MCP package source) and find the real route before falling back to the browser.
- **In a browser tag combobox: type the tag, then CLICK the dropdown option** (the existing one, or the
  "create new" entry). Do NOT batch type+Enter+type+Enter. The field often doesn't auto-clear, so Enter
  CONCATENATES tags into junk (`ExampleCoProviderName`, `ExampleCoProviderNameRegistrar`) that then pollutes
  the dropdown for everyone. If junk tag definitions get created, delete them.
- Use **ref-based clicks** (find, then click `ref`); the viewport resizes so pixel coords drift. A bulk-update
  modal can freeze the renderer on first open. Reloading recovers, and already-applied chips persist.
- **House tag convention** (shared agency account): `[Vendor] | [Gmail/Outlook] | [Client] (count)`, e.g.
  `<MailboxProvider> | Gmail | ExampleCo (10)`. Match it; confirm the scheme with the operator if their ask differs.
- **An MCP tool set can contain individually broken write tools while the rest is fine.** If a write tool
  404s, read the package source and compare its path to the platform's real route before concluding the
  capability doesn't exist. Note the broken tool by name and route around it; don't abandon the whole MCP.
- **A "Found 0" style counter in an MCP response can be buggy.** The JSON body is the truth. Large payloads
  may spill to a file rather than into the response.

## HARD AGENT BOUNDARIES: never do, don't retry, don't store creds

These stay off-limits even when the operator provides the login and explicitly authorizes them. State the
rule and hand to the operator.

- **Any provider-to-sending-platform connect that requires entering the sending-platform account login** in
  order to authenticate. USER step. (A provider's export MCP tool generally can't do it either: it needs
  platform, email and password that the schema doesn't expose.)
- **CSV import of mailboxes into the sending platform.** The CSV carries the mailbox SMTP passwords, so
  uploading it means submitting passwords to authenticate. USER step. (The agent MAY prepare the CSV; the
  operator does the upload.)
- **Client-access or sub-account creation** on the sending platform: account creation plus password plus an
  access-control grant. USER step.
- **Funding a provider wallet or paying by card.** USER step, always.
- **Never store account login passwords** in the repo or in memory. Store only the account *email* plus the
  workflow. API keys in the credential surface are fine; account passwords are not.

---

## Vendor-specific notes (these applied to a PREVIOUS stack, verify before trusting them on FNNL's tools)

Everything below was proven against a different company's accounts, plans, and API tiers. It is reference
material, not FNNL's configuration. **Naming a tool here does not put it in FNNL's stack.** The stack lives in
`outbound/stack-contract.yaml`, and an empty slot means run `/stack-setup`. The matching
integration packs sit inert in `_vendor-library/` until `/stack-setup` activates them.

### Image generation (OpenAI)

- **Still current for FNNL.** OpenAI is the one approved AI exception (operator directive 2026-09-22):
  headshots only, asked for at infrastructure setup, never at kickoff or preflight. Every other AI provider
  is retired under the no-AI-API rule, so this is the only AI API gotcha that still applies.
- `dall-e-3` did NOT exist on the key in use ("The model 'dall-e-3' does not exist"). **`gpt-image-1`** worked
  and returns base64 (no URL). Do NOT pass `response_format`, which `gpt-image-1` rejects with
  "Unknown parameter: 'response_format'".

### Primeforge (mailbox provider)

- **Profile picture via MCP WORKS, hands-free:** `primeforge_update_mailbox({ id, profilePictureUrl })` accepts
  an **external** URL. The update RESPONSE echoes `profilePictureUrl:""` (pre-save state), which is NOT a
  failure; `primeforge_get_mailbox` confirms it is actually set (async write). Do NOT retry on the empty
  response. Primeforge **hotlinks** the hosted GIF rather than re-hosting it, so keep the hosted file live.
  You do NOT need to reverse-engineer Primeforge's S3 upload (the `primeforge-prod.s3...` URLs seen on some
  mailboxes are just UI uploads; external URLs work fine).
- **Getting mailbox and domain IDs: the MCP list caps at 10.** `primeforge_list_domains` and
  `primeforge_list_mailboxes` **cap at 10 results with no offset**, so you canNOT page to the rest. AVOID
  relying on them for a full inventory (this wasted multiple calls re-fetching the same 10). Instead hit the
  Primeforge REST API from the logged-in browser tab, using the Firebase auth token:

  ```js
  // token: IndexedDB 'firebaseLocalStorageDb' → store 'firebaseLocalStorage' → value.stsTokenManager.accessToken
  fetch('https://api.primeforge.ai/workspaces/<wks>/domains?limit=300', {headers:{Authorization:'Bearer '+token}})
  //   → { domains: [ { domain:{ id, sld, platform, ... }, mailboxCount } ] }
  fetch('https://api.primeforge.ai/workspaces/<wks>/mailboxes?limit=300', {headers:{Authorization:'Bearer '+token}})
  //   → { domainsWithMailboxes: [ { domain:{...}, mailboxes:[ { id, username, ... } ] } ] }
  ```

### Zapmail (mailbox provider)

- **Capacity must be PURCHASED before assigning.** `assign_new_mailboxes_to_domains` (POST /api/v2/mailboxes)
  fails with "Mailboxes can't be assigned because you don't have ... mailboxes ... purchase mailboxes and try
  again" until slots are bought. There was **NO working purchase API** (`purchase_add_on_mailboxes` returned
  "fetch failed"; the API docs exposed no purchase endpoint). AVOID hunting for a purchase API.
- **Purchase via the Zapmail UI** (browser): Home, then **Buy Mailboxes**, toggle provider (Google / Microsoft
  icons, top-right), set qty, Pay Now, then **"Pay using Wallet"** (NOT Stripe/card). At the time,
  **Microsoft = $3/mo monthly** (same as Google; yearly $2.5 and quarterly $2.7 existed but billed a big
  upfront, so Monthly was the pick). Wallet funds it. **Re-check all pricing before quoting it.**
- After capacity exists, the assign payload is
  `{ "<domainUUID>": [ {firstName,lastName,mailboxUsername,domainName}, ... ] }` with header
  `x-service-provider: GOOGLE|MICROSOFT`.
- **`list_domains` returned GOOGLE-provider domains only**, even under MICROSOFT context (a quirk). To get the
  Microsoft domains, use `list_assignable_domains` with `serviceProvider: MICROSOFT`.
- **Profile picture via MCP, hands-free, verified 2026-06-16.** `update_mailbox` accepts a hosted image URL:
  body `{ "mailboxData":[ {"mailboxId":"<id>", "profilePicture":"<public URL>"}, ... ] }` returns
  `200 "User details changes are in progress"`, echoes `profileUrl`, and `failureDetails:[]`. Zapmail's
  backend fetches the hosted image and re-hosts it on its CDN. Bulk-capable (many entries per call; 48
  mailboxes went in 2 calls, one `GOOGLE` and one `MICROSOFT`). It is **async**: `profilePicture` flips from
  `null` to a `cdn.zapmail.ai/...` URL only after processing, which can lag minutes.

### Zapmail to sending-platform export

- Native export needed NO password because a sending-platform connection was already saved in Zapmail:
  `list_all_third_party_accounts` shows the saved app entry (e.g. `<operator-email>`). Then
  `export_mailboxes { apps:["<SENDING_PLATFORM>"], ids:[...] }` and Zapmail passes the credentials internally.
  Export is async, and warmup auto-enabled on connect (verify; don't re-enable).

### Smartlead (sending platform)

- **The Smartlead MCP (LeadMagic, `smartlead-mcp-by-leadmagic` v1.6.2) had exactly TWO broken write tools;
  everything else worked.** Root-caused 2026-06-10 by reading the package source:
  `smartlead_update_email_account_tag` POSTs to `/email-accounts/{id}/tag` (a path that doesn't exist) and
  `smartlead_create_email_account` POSTs to `/email-accounts` (the real path is `/email-accounts/save`), so
  both **404**. AVOID those 2 tools. The MCP's roughly 100 read, analytics, campaign and warmup tools were
  fine (`get_all_email_accounts` works, though its "Found 0" counter is buggy and the JSON body is the truth).
  Direct REST reads also worked:
  `GET https://server.smartlead.ai/api/v1/email-accounts/?api_key=<SENDING_PLATFORM_API_KEY>&offset=0&limit=200`.
  The old "guessed endpoints all 404'd, so tags must be UI-only" note was a WRONG-PATH dead end.
- **Tags are NOT UI-only (corrected 2026-06-10).** Apply via REST `POST /api/v1/email-accounts/tag-mapping`
  with `{email_account_ids:[<=25], tag_ids:[...]}` (plus `?api_key=`). That adds and is idempotent (duplicates
  return `action:"skipped"`); `DELETE` on the same path removes; `GET /email-accounts/tags` lists the tag
  definitions. The `smartlead-tags.mjs` helper in the Smartlead vendor pack does this
  (`tags` | `accounts [filter]` | `tag-map` | `untag`; verified 2xx). The browser path is a **FALLBACK ONLY**:
  Email Accounts, select rows, **Bulk Update**, **Management** tab, "Add Tags" combobox (NOT the General tab,
  and NOT the Warm Up tab's "Custom Warmup Identifier Tag").
- Bulk Update tabs: **General** (SMTP/signature/tracking), **Warm Up**, **Management** (Add Tags / Add Client).

---
Cross-refs: persona and profile order, plus the MCP-first photo rules, live in `/mailbox-profile-generator`.
MCP routing lives in `/mcp-tools-routing`. The import and credential boundary lives with whichever
sending-platform inbox-manager skill `/stack-setup` activated.

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short: record status, not raw output. Full protocol: `client-activity-log.md`.
