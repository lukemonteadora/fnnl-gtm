---
name: mailbox-profile-generator
description: Generate the client's ONE sender-persona profile assets (a natural realistic headshot from an AI image model, the company logo from the web, and a smooth headshot-to-logo crossfade GIF), then set them on every mailbox at whichever mailbox provider FNNL uses. Provider-agnostic. Output lands under the client's sender-identity folder (PROFILE_OUTPUT_ROOT). Run it as a HARD-RULE step the moment the persona name is locked and BEFORE any mailbox is created or set up.
---

# Mailbox Profile Generator

Use this skill to generate and set the sender-persona profile assets for a client's mailboxes, across
**any** mailbox provider. It produces the realistic headshot, the company logo, and the animated crossfade
GIF, then sets them at the provider.

This skill is **provider-agnostic**. The asset generation is identical for every provider; only the
*apply/upload* step differs by provider (see "Setting the profile at the provider").

## Which provider, which image model? Read the stack contract

This skill needs two things from FNNL's stack, and it does not assume either one:

- **The mailbox provider** (the `mailbox_provider` slot in `outbound/stack-contract.yaml`),
  because that is where the avatar gets applied.
- **The AI image model** used for the headshot. This is the ONE AI API call left in the flow (no-AI-API
  rule, operator directive 2026-09-22): OpenAI `gpt-image-1`, headshots only, the operator-approved
  exception for the `image_generation` slot. No other AI provider is used here: the logo fetch is plain web
  scraping or Claude's built-in WebSearch/WebFetch, never an AI call. **Its key is asked for
  only when this step runs, or when the operator says to start setting up cold-email infrastructure**,
  never at onboarding, intake, kickoff, preflight, stack setup or workspace creation.

**If the `mailbox_provider` slot is empty, stop and route the operator to `/stack-setup`.** Do not pick a
provider or a model because a worked example below happens to name one. A tool recorded as `chosen` is not proven; only `live`
means a real call against FNNL's own account has succeeded.

## Field-tested in THIS env, do NOT re-test (full list: `/coldoutbound-gotchas`)

These were tried and burned a cycle on live client builds in an earlier workspace (2026-06 onward). The
first group is vendor-neutral and holds anywhere. The second group applied to a **previous stack** and is
kept only so the detail is not lost.

### Vendor-neutral (trust these)

- **Build the GIF without Python.** `python` and the bundled `generate_inbox_profiles.py` may NOT run here
  (no real interpreter, only WindowsApps shims). WORKS: Node v24 plus `npm install sharp gifenc`.
  **AVOID `gifencoder`**: it pulls native `canvas`, whose node-pre-gyp build fails. Pipeline: `sharp`
  (decode/resize/composite + SVG raster at `density:150, limitInputPixels:false`) to raw RGBA frames, then
  `gifenc` (pure JS). Template that produced a clean 400x400 / 32-frame / ~1.3 MB GIF:
  `profiles/<client>/assets/gifbuild/build.js`.
- **Keep the image prompt ASCII-only.** An em dash or a smart quote in the `curl -d` JSON gives a
  "unicode decode error". If the image API returns base64 rather than a URL, decode it with `base64 -d`
  (no Python needed).
- **Save assets in the REPO** (`profiles/<client>/assets/`). The `~/Documents/...` OneDrive path
  dehydrates and loses generated files mid-session (a headshot vanished this way).
- **Host the GIF at a public URL before applying it.** Most providers fetch the image from a URL rather than
  accepting an upload over the API:
  `curl -F "reqtype=fileupload" -F "fileToUpload=@x.gif" https://catbox.moe/user/api.php` gives a permanent
  URL with no account. Check per provider whether it **re-hosts** the image (a CDN URL later appears on the
  mailbox record) or **hotlinks** it (keep the hosted file alive forever).
- **Profile-picture writes are usually async.** A clean `200` often echoes the *pre-save* state (an empty or
  `null` picture field). That is NOT a failure. Re-read the mailbox record a minute later to confirm, and do
  NOT retry on the empty response.
- **Provider list endpoints can cap with no offset.** Before trusting a `list_*` call for a full inventory,
  check whether it caps. If it does, pull the inventory from the provider's own REST API using the session
  token from a logged-in browser tab instead of re-calling the capped tool.
- **If a provider has no profile-picture API, browser automation is still hands-free.** "No API" does NOT
  mean "hand it to the operator". Two blockers show up repeatedly, with a workaround for each:
  1. The Chrome `file_upload` tool rejects agent-generated files, and a provider app's CSP commonly blocks
     every external in-page `fetch`, so you cannot pull the GIF bytes into the page normally.
  2. **Workaround (no native file picker):** host the GIF, navigate the SAME tab to the raw GIF URL (now
     same-origin, so `fetch` works), do `fetch` to `arrayBuffer` to `btoa` into `window.name`. `window.name`
     **survives cross-origin navigation** back to the provider app. Decode it to a `File`, and for each
     `input[type=file]`: set `input.files` via `DataTransfer` and **invoke the React `onChange` prop
     directly** (`inp[__reactProps$...].onChange({target:inp,...})`; a plain dispatched `change` event alone
     did NOT update the preview, calling the React handler did), then click **Save**. If the app has separate
     Google and Microsoft views, sweep them separately. Clear `window.name` when done, because a ~4.7 MB
     value can freeze the renderer on later navigations.
  3. **Verify the save really uploaded**, do not trust the UI: the mailbox record's picture field should flip
     to a NEW provider-CDN URL (that proves the backend uploaded, rather than a client-side field being set),
     and any per-row pending badge clears once the provider syncs to the underlying Google/Microsoft account.
     Propagation to the real account avatar is async (seconds to minutes).
  Handing it to the operator is only the fallback when browser automation is genuinely unavailable.

### Vendor-specific notes (a PREVIOUS stack, verify before trusting them here)

Naming a tool below does not put it in FNNL's stack. The stack lives in `stack-contract.yaml`, and an empty
slot means run `/stack-setup`. The matching integration packs sit inert in `_vendor-library/`.

- **Image model (still current: this is FNNL's approved headshot exception):** `dall-e-3` did NOT exist on the OpenAI key in use. **`gpt-image-1`** worked and returns
  base64. Do NOT pass `response_format` (it is rejected).
- **Primeforge apply (worked via MCP, hands-free):** `primeforge_update_mailbox({id, profilePictureUrl})`
  accepts an **external** URL. Primeforge **hotlinks** it, so keep the hosted file live; no S3 upload needed.
  The update RESPONSE echoes `profilePictureUrl:""`, which is pre-save state and NOT a failure. Confirm with
  `primeforge_get_mailbox` and do not retry on the empty response.
- **Primeforge mailbox/domain IDs:** `primeforge_list_domains` and `primeforge_list_mailboxes` **cap at 10
  with no offset**, so you cannot page to the rest. Pull the full inventory from the logged-in browser tab via
  the Firebase token (IndexedDB `firebaseLocalStorageDb`, then `stsTokenManager.accessToken`):
  `api.primeforge.ai/workspaces/{wks}/mailboxes?limit=300` returns
  `{domainsWithMailboxes:[{domain,mailboxes}]}`.
- **Zapmail profile picture via MCP, hands-free, verified 2026-06-16.** `update_mailbox` accepts a **hosted
  image URL**: body `{ "mailboxData":[ {"mailboxId":"<id>", "profilePicture":"<public URL>"}, ... ] }` returns
  `200 "User details changes are in progress"`, echoes `profileUrl`, and `failureDetails:[]`. Host the GIF
  publicly first; Zapmail's backend fetches it and re-hosts it on its CDN. **Bulk-capable**: many entries per
  call (48 mailboxes in 2 calls, one `GOOGLE` and one `MICROSOFT`). It is **async**: the record's
  `profilePicture` flips from `null` to a `cdn.zapmail.ai/...` URL only after processing, which can lag
  minutes, so `search_mailboxes` may read `null` immediately after a clean 200. Verify on a later re-read
  (and via the app's `POST /api/v4/mailbox/list` per provider). This **SUPERSEDED** the older
  "no API, so use browser automation" path for that provider.
- **Zapmail legacy browser-automation avatar path** (before 2026-06-16 its `updateMailbox` body was
  name/username/status only, and `search_api_endpoints "profile picture"` returned 0 results). Field-proven
  hands-free on a 24-mailbox fleet, 2026-06-12. The avatar lived in the **Mailboxes, select-all, Edit Details
  bulk modal**, one hidden `<input type=file>` per row. The two blockers and the `window.name` workaround are
  the vendor-neutral version above. Verify via the app's own same-origin API:
  `POST /api/v4/mailbox/list?page=1&limit=50` returns `data.domains[].mailboxes[].profilePicture` for the
  CURRENT view's provider, so sweep Microsoft and Google separately.

## Interaction Policy

Defers to `/autonomous-execution-policy`. Under `run_state.execution_mode = auto_execute` (the operator's default), proceed without pausing: pick the strongest option per this skill's rubric, record it to `run_state`/profile, and continue, and never re-ask a decision already in `run_state`, the profile, memory, or the operator's latest message. Stop only for the policy's hard-stops (spend over the approved ceiling, live send, credentials, provider or source-of-truth change, safety gates). Note that the HARD-RULE order-of-operations and profile-gate-before-import rules below are not relaxed by autonomy. On a long async wait, background-poll and move to other productive work, never idle.

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short: record status, not raw output. Full protocol: `client-activity-log.md`.

## HARD RULE: order of operations (do not reorder)

Profile assets are generated **up front, the moment the persona name is locked, and BEFORE any mailbox
is created or set up**. Never backfilled after import.

> **ATOMIC-UNIT HARD RULE (operator 2026-06-16):** the persona's profile asset is ONE inseparable unit =
> **headshot + company logo + crossfade GIF.** The act of acquiring the headshot, whether you *generate*
> an AI headshot for an invented persona OR *grab a real photo* for a real named person, ALWAYS, in the
> **same pass**, also pulls the company logo and builds the crossfade GIF. **Never stop at a bare headshot
> and "backfill" the logo or GIF later.** A headshot with no GIF is an incomplete asset, full stop. (This rule
> exists because a real-photo grab via another flow once stopped at the headshot and skipped the GIF.)

The locked sequence, every time:

1. **Lock the persona name.** Resolve the client's ONE sender persona (client-provided, or generated
   once and recorded in `run_state.sender_personas`). Nothing below runs until the name is locked.
2. **Obtain the headshot, then immediately continue to 3+4 (do NOT stop here).** EITHER generate the AI
   headshot for an invented persona, OR, when the persona is a **real named person** (e.g. a real client
   employee who takes the calls), grab their **real photo** from the web (company team page or LinkedIn,
   with client awareness). **Never an AI face for a real person.** Save as `.jpg`/`.png`/`.webp` and QA it.
   Acquiring this headshot is the trigger for 3+4 in the same pass.
3. **Download the company logo** from the web to `.png`/`.svg` (grab it now, as part of the same step, not a separate later task).
4. **Build the crossfade GIF** (headshot to company logo) immediately. **Use the GIF wherever the provider
   renders animated GIFs**, and fall back to the static headshot only for a provider that genuinely cannot
   take one. Confirm GIF support for FNNL's chosen provider once, then record it. Build mechanics (no
   Python): Node plus `sharp` plus `gifenc`, per the field-tested note above and the
   `profiles/<client>/assets/gifbuild/build.js` template.
5. **Only then set up the mailboxes.** Create inboxes and apply the assets at the provider *before*
   exporting or importing them into the sending platform. If the chosen provider has no profile-picture API,
   the avatar is the **browser-automation** path (field-proven), not hand-to-operator.

**Profile gate before import (hard rule):** after ALL mailboxes are created successfully at the provider,
and BEFORE importing or exporting any of them into the sending platform, apply the profile picture to
**every** mailbox: the **animated GIF wherever the provider supports it**, falling back to the plain static
headshot image only where a provider or mailbox genuinely can't take a GIF. Never import a faceless mailbox
and add the photo later. If any mailbox in a fleet has no profile set, treat the whole fleet as
not-ready-to-import and resolve photos first.

## HARD RULE: MCP first, browser only as a fallback

For every step that touches a provider (logo fetch, headshot/GIF upload, setting the avatar), **try the
provider's MCP tool first**. Only fall back to browser automation (Claude-in-Chrome) when the MCP
genuinely cannot do it, meaning the capability is missing or unsupported, and say so explicitly when you fall
back. MCP is faster, deterministic, and avoids the renderer and coordinate fragility that browser automation
introduces. This mirrors the global rule in `/mcp-tools-routing`.

A crossfade between a realistic headshot and the company logo makes senders look more credible and
stands out in inbox threads, on providers that render animated GIFs.

Do not generate glossy studio-style LinkedIn portraits. For mailbox profile photos, the safer style is
a normal account photo: upper torso visible, realistic head-to-body ratio, plain matte background,
slight off-center framing, normal skin texture, and no fake office blur. Never allow name tags,
badges, text, logos, signage, or visible writing in the headshot.

The default sender model is **one persona per client**: a single real-looking human used across
every domain, inbox, and mailbox provider. Under that default, all mailboxes belong to the same sender, so
generate one shared headshot and one shared GIF, then reuse that exact file for every mailbox. Creating
different faces for one person is not personalization. It is a trust problem with nicer lighting. (Only
generate multiple faces when the client explicitly provided multiple named reps.)

Do not upload the GIFs until the final shared GIF has been visually checked. Reject and regenerate
if the headshot looks AI-made: oversized head, too-perfect crop, stock-photo smile, blurred office
background, waxy skin, over-sharp eyes, name tag, badge, signage, or visible text.

---

## Prerequisites

### Environment variables

**Do not hardcode key names from this file.** Two keys are needed, and their exact variable names depend on
which tools FNNL chose:

1. **The headshot image key** (`OPENAI_API_KEY`: OpenAI, headshots only, asked for at infrastructure
   setup). **This step is where it is requested.** When a generated headshot is needed and the key is not
   yet in `scripts/.env`, ask the operator to add it there (never in chat) and wait. `/preflight-credentials`
   deliberately never checks it (the registry marks it `on-demand`), so a kickoff PASS says nothing about
   it. Skip it entirely when the persona is a real person with a real photo.
2. **The mailbox provider key**, for applying the avatar. This is whichever tool fills the
   `mailbox_provider` slot in `outbound/stack-contract.yaml`. A split fleet across two
   providers needs both providers' keys.

Resolve the actual variable names this way: look up the chosen tool in `stack-contract.yaml`, then read that
provider's declared env var name(s) from `outbound/scripts/credential-registry.json`
(a catalogue of "if you chose tool X, these are its variables", not a declaration of FNNL's stack). Copy
`scripts/.env.example` to a local ignored `scripts/.env` and fill in those names. Confirm the mailbox
provider key resolves by running `/preflight-credentials`, which scopes the check to the locked `run_state`
path (the headshot key is not part of that check, see item 1).

If the `mailbox_provider` slot is empty, stop and run `/stack-setup` rather than guessing a key name.

> **Script scope note.** The bundled `scripts/generate_inbox_profiles.py` is a **legacy helper wired to one
> specific provider**: it enumerates inboxes from a Primeforge workspace, which is why it reads
> `PRIMEFORGE_API_KEY`, `TARGET_PRIMEFORGE_WORKSPACE_NAME` and `OPENAI_API_KEY` (those exact names are baked
> into the script, so do not rename them). It only applies if FNNL's `mailbox_provider` slot resolves to that
> provider and the matching `_vendor-library` pack is active. The **asset generation itself is provider-
> neutral**: headshot, logo, and GIF depend only on the persona name plus company, not the provider. For any
> other fleet, generate the assets by passing the locked persona name(s) directly (one shared headshot and
> GIF per client), then apply them per "Setting the profile at the provider" below. Do not let the script's
> provider-shaped enumeration imply this skill is tied to one provider.

### Python packages (only for the legacy bundled script)

```bash
pip install openai pillow requests python-dotenv gender-guesser
```

Run this once, and only if you are actually using the bundled script on a machine with a real Python
interpreter. The Node path above needs none of it.

---

## Run (the legacy bundled script)

```bash
cd scripts
python generate_inbox_profiles.py
```

The script processes every active inbox in the configured workspace and prints progress per inbox. Failed
inboxes are logged but do not stop the run.

### Optional flags

```bash
# Process only inboxes whose email contains a substring (useful for testing one domain)
python generate_inbox_profiles.py --filter exampledomain.com

# Skip headshot generation and only fetch logos + make GIFs (saves image credits on reruns)
python generate_inbox_profiles.py --skip-headshot

# Skip logo search and only generate headshots (when logos already exist)
python generate_inbox_profiles.py --skip-logo

# Regenerate an existing shared sender headshot once, then reuse it across matching inboxes
python generate_inbox_profiles.py --overwrite-headshot

# Regenerate existing GIF files and optionally tune animation pacing
python generate_inbox_profiles.py --overwrite-gif --hold-frames 8 --crossfade-frames 18 --frame-duration-ms 80

# Dry run: print what would be generated without calling any paid API
python generate_inbox_profiles.py --dry-run

# Client-safe run for lookalike domains: one company name, one verified logo, exact count/domain gates
python generate_inbox_profiles.py `
  --filter exampleco `
  --company-name-override ExampleCo `
  --logo-file "C:\path\to\ExampleCo_logo.png" `
  --require-count 24 `
  --require-domains "withexampleco.com,runexampleco.com,meetexampleco.com,sendexampleco.com,findexampleco.com,examplecocore.com,examplecoai.com,examplecolink.com,examplecoway.com,exampleconet.com,examplecolab.com,oneexampleco.com"
```

---

## Output

For each inbox the script creates a folder and three files:

```
$PROFILE_OUTPUT_ROOT\   (set per client; fallback when unset: %USERPROFILE%\Documents\Mailbox Profiles\)
└── {WorkspaceName}\
    └── {FirstName}_{LastName}_{safe_email}\
        ├── {FirstName}_{LastName}_headshot.jpg       ← AI-generated natural business profile photo
        ├── {CompanyName}_logo.png                    ← Company logo from the web
        └── {FirstName}_{LastName}_{CompanyName}_profile.gif  ← Smooth crossfade GIF
```

Files are skipped (not regenerated) if they already exist, so reruns are idempotent.

### Where persona assets live (this GTM system)

The script's fallback default is `~/Documents/Mailbox Profiles/`, but in this repo a client's persona
assets are co-located with that client's profile so everything about their outbound identity lives in
one place. **Always** set `PROFILE_OUTPUT_ROOT` per client before running:

```bash
PROFILE_OUTPUT_ROOT=...\outbound\profiles\{client-slug}\sender-identity
```

The `profiles/` tree is gitignored, so persona images (PII) stay local and are never committed.
Record the persona (name, addresses, photo requirement) in
`profiles/{client-slug}/sender-identity/sender-identity.md`. The shared headshot lives alongside it, e.g.
`profiles/{client-slug}/sender-identity/{Persona_First}_{Persona_Last}_headshot.png`.

For client lookalike domains, do not let the script web-search each domain as if it were a separate
company. Use `--company-name-override` and `--logo-file` so every sender gets the same verified
client logo.

If multiple mailboxes belong to the same sender, generate one headshot for that sender and reuse it
across the mailbox set. Do not create different faces for the same person.

For same-sender runs, use the `_shared\{FirstName}_{LastName}_{CompanyName}_profile.gif` file as
the upload source. Folder-level copies are for auditability and fallback, not a reason to upload
slightly different files.

---

## GIF spec

| Property | Value |
|---|---|
| Dimensions | 400 × 400 px |
| Frames | 37 total by default: 8 hold, 18 crossfade, 8 hold, 18 crossfade back, then GIF encoder optimization |
| Frame duration | 80 ms |
| Cycle duration | ~4.16 seconds |
| Loop | Infinite |
| File size | Keep under 5 MB; shared GIFs from past builds have run around 2.8-3.1 MB |

Most mailbox providers render animated GIF profile pictures, but confirm it once for FNNL's chosen provider
and record the answer rather than assuming. Keep the file under 5 MB either way.

---

## Setting the profile at the provider

After the assets exist, set them on every mailbox **before** export or import into the sending platform.
**MCP first, browser only as a fallback** (see the hard rule above).

### The generic apply loop (any provider)

1. **Resolve the provider** from the `mailbox_provider` slot in `stack-contract.yaml`. Empty slot means stop
   and run `/stack-setup`. Do not guess.
2. **Try the provider's MCP write first.** Look for a mailbox-update tool with a profile-picture or image
   field. Most take a **hosted URL**, not a file upload, so host the shared GIF publicly first.
3. **If the MCP has no profile-picture field, re-verify before giving up** (tool sets drift, and one provider
   gained the field months after it was documented as missing). Search the provider's API surface for
   "profile picture" or "image" once, then fall back to **browser automation** using the hands-free pattern
   in the field-tested notes above.
4. **Expect async.** A clean `200` can echo an empty picture field. Re-read the mailbox record later to
   confirm, and do not retry on the empty response.
5. **Verify at the record, not in the UI.** The mailbox's picture field should hold a real URL (a provider
   CDN URL if the provider re-hosts, or your hosted URL if it hotlinks). Only then is the mailbox done.
6. **Record the outcome** for that provider (does it take a URL, does it re-host, is it bulk-capable, does it
   render GIFs) so the next fleet does not re-discover it.

Do not block warmup on the photo if no avatar path is available at all, but do treat the fleet as
not-ready-to-import until the profile gate above is satisfied.

### Safe-apply rules (all providers)

- Confirm the expected mailbox count and exact domains before touching profile pictures.
- Apply is only possible once the mailbox is editable. If a row is still `Processing` or `Scheduled` with
  no editable modal or record, skip it and return later. Do not pretend a non-editable mailbox was set.
- For same-sender runs (the default), use the shared `.gif` or headshot from `_shared`, not a per-mailbox
  variant. Every mailbox of one persona must carry the identical file.
- Set, re-read the same mailbox, and verify the picture changed before moving on.
- Do not assume a bulk profile upload exists unless the API or UI clearly supports it for the exact
  selected mailbox count.
- If the provider's UI needs a local file and the Chrome file-upload tool rejects agent-generated files,
  browser file uploads may also require `Allow access to file URLs` on the extension. The hosted-URL plus
  `window.name` workaround above avoids the native file picker entirely.

### Handoff to the sending platform

Finish and verify the provider profile upload **first**, then hand off to whichever sending-platform
inbox-manager skill `/stack-setup` activated for the `sending_platform` slot. Do not treat a local GIF
generation run as proof that senders are ready to import. Import still requires confirmed mailboxes at the
provider, a credentials or OAuth path, MX and authentication checks, signatures, tagging, and warmup.

---

## Cost estimate

| Item | Cost |
|---|---|
| AI headshot (1024x1024, low quality) | low per-image cost |
| Logo search | Free (web scraping) |
| GIF generation | Free (local: Node `sharp` + `gifenc`, or Pillow on the legacy script) |

When multiple mailboxes use the same sender name, generate one headshot and reuse it across those mailboxes.

---

## Troubleshooting

**Logo not found:** The script falls back to a solid-color placeholder with the company initial.
You can manually drop a `{CompanyName}_logo.png` into the inbox folder and rerun with
`--skip-logo` to regenerate only the GIF.

**Image content policy rejection:** Rare for business headshots. If triggered, the script retries
once with a simplified prompt. If it fails again, the inbox is skipped and logged.

**Wrong gender detected:** Edit the `GENDER_OVERRIDES` dict at the top of `generate_inbox_profiles.py`:

```python
GENDER_OVERRIDES = {
    "Alex": "male",
    "Jordan": "female",
}
```

**Provider API rate limits:** The script adds a 1-second delay between inboxes by default.
Increase `REQUEST_DELAY_SECONDS` in the script if you hit 429 errors.
