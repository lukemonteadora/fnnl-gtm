# Google Docs auto-export — one-time setup

This wires the cold-outbound DOCX renderers (campaign approval brief, campaign-sequence and lifecycle presentations) so that every render also creates a **native, formatted Google Doc** in your Google Drive automatically. No more "transfer and upload" into Google Docs.

**Why a setup step at all?** The connected Drive tool can only auto-convert plain text/CSV, and it can't reliably push a full DOCX. So a tiny uploader script (`scripts/docx_to_gdoc.mjs`) uses *your own* Google credential to upload the DOCX with Drive's conversion flag — producing a real Google Doc you can open, edit, and share. You do this once (~10 minutes); after that it's fully automatic.

The script uses the least-privilege **`drive.file`** scope: it can only touch files it creates (its own export folder and the Docs it makes) — it cannot see the rest of your Drive.

> **Related:** for *native* read/write of Docs, Sheets, and Drive (beyond this one-way DOCX export) there's now a Google MCP — see [`google-docs-mcp-setup.md`](google-docs-mcp-setup.md). It's complementary: this script preserves full Word formatting on import (the MCP can't); the MCP edits docs/sheets live afterward. Both can share the **same** OAuth client you create below — just enable the extra APIs the MCP needs.

---

## What you do once (~10 min)

### 1. Create / pick a Google Cloud project
Go to <https://console.cloud.google.com/> → top project dropdown → **New Project** (name it e.g. "FNNL Agency GTM"). Select it.

### 2. Enable the Drive API
APIs & Services → **Library** → search "Google Drive API" → **Enable**.

### 3. Configure the consent screen
APIs & Services → **OAuth consent screen** → User type **External** → fill app name (e.g. "FNNL Agency GTM") and your email → Save.
On **Test users**, add your own Google address (`<operator-google-account>`). Test mode is fine; you don't need to publish.

### 4. Create an OAuth client ID
APIs & Services → **Credentials** → **Create credentials** → **OAuth client ID** → Application type **Desktop app** → Create.
Copy the **Client ID** and **Client secret**.

### 5. Put the client into `scripts/.env`
Add these two lines to `outbound/scripts/.env`:

```
GOOGLE_OAUTH_CLIENT_ID=<your client id>
GOOGLE_OAUTH_CLIENT_SECRET=<your client secret>
```

### 6. Capture a refresh token
From the `scripts/` folder run:

```
node gdoc_auth.mjs
```

Your browser opens the Google consent screen → approve. The terminal prints a line like:

```
GOOGLE_OAUTH_REFRESH_TOKEN=1//0g....
```

Paste that line into `scripts/.env` too.

### 7. Test it
```
node docx_to_gdoc.mjs --in "../profiles/<client-slug>/Campaign Approval Brief - <Client>.docx" --title "Campaign Approval Brief - <Client>"
```

It prints `CREATED <link>` (or `UPDATED <link>` on later runs) and, on first run, a `GDRIVE_FOLDER_ID=…` line — add that to `scripts/.env` to pin the destination folder. Done.

---

## How it's used after setup

The skills run it automatically right after rendering the DOCX:

```
node scripts/docx_to_gdoc.mjs --in "<rendered .docx>" --title "<doc title>"
```

- **First render** of a brief → creates a Google Doc in the **"FNNL Agency - Cold Outbound"** Drive folder.
- **Re-renders** of the same title → update the *same* Doc, so any link you've shared stays valid.
- If the creds aren't set up yet, the script exits with code `2` and the skills simply skip the Google Doc and deliver the DOCX as before — nothing breaks.

## Security notes

- The refresh token and client secret live only in `scripts/.env` (already gitignored). Treat them like any API key.
- To revoke access later: <https://myaccount.google.com/permissions> → remove the app.
- Scope is `drive.file` — the script never reads your existing Drive files, only the ones it creates.
