# Google Docs / Sheets / Drive MCP: one-time setup

This connects Claude (Code and Desktop) directly to your Google **Docs, Sheets, Drive**, and (if you grant
them) **Gmail and Calendar**, so skills can read and write those natively instead of going through the
browser. It's the [`@a-bonus/google-docs-mcp`](https://github.com/a-bonus/google-docs-mcp) server.

**What it adds vs. what we already had.** We already had a small script (`scripts/docx_to_gdoc.mjs`) that
turns a rendered Word `.docx` into a native Google Doc. That stays, because it's the one thing that
preserves full Word formatting on the way in (the MCP can't do that). The MCP is the other direction:
once a doc or sheet exists, the MCP can read it, edit it, format cells, append rows, search Drive, create
new docs/sheets from markdown, and so on. So: **the script is for "render a polished DOCX into a Doc"; the
MCP is for "read and manipulate Docs/Sheets/Drive live."** Use both.

> **Heads-up on access scope.** This MCP asks for the **full Google Drive** scope (it can see and edit
> *all* files in the connected Google account), plus Docs, Sheets, Gmail (read + modify), and Calendar
> (events). That's broader than the export script, which only ever touches files *it* created
> (`drive.file`). You're approving real access to your Google account. Use the same account you're happy
> automating against, and you can revoke it any time at <https://myaccount.google.com/permissions>.

---

## STATUS: not configured yet (work through the steps below)

This connection has not been set up in this fork. Run Steps 1 to 4, then record what you configured
here so the next operator can re-authorize or extend scopes without rediscovering it:

- **Google Cloud project:** `<FNNL_GCP_PROJECT_NAME>` (`<FNNL_GCP_PROJECT_ID>`) on `<operator-google-account>`.
- **OAuth client:** a **Desktop** client named `<FNNL_OAUTH_CLIENT_NAME>`. Client ID
  `<FNNL_OAUTH_CLIENT_ID>.apps.googleusercontent.com`. (Keep the client secret out of this file; it
  belongs only in your Claude Code config.)
- **Consent screen:** External / Testing, with `<operator-google-account>` added as a test user.
- **APIs to enable:** Google Docs, Google Sheets, Google Drive. (Gmail and Calendar can be left off.)
- **Scopes at sign-in:** Docs, Drive, Sheets **only** is the least-privilege setup; decline the Gmail and
  Calendar scopes on the consent screen. The refresh token is saved to
  `C:\Users\admin\.config\google-docs-mcp\token.json`.
- **Register in Claude Code** at user scope with `MCP_TOOL_GROUPS=docs,drive,sheets,utils`, then verify
  **✔ Connected** plus a live Drive API call. The `mcp__google-docs__*` tools appear on the next Claude Code
  session start.

### ⚠️ Important: the app is in "Testing", so the token expires every 7 days

Google expires refresh tokens for **External apps in "Testing" mode after 7 days**. So the connection will
stop working **7 days after you authorize** and the MCP will throw auth errors until it is re-authorized.
Two ways to handle it:

- **Re-authorize weekly (simplest):** re-run the Step 3 `auth` command whenever it breaks. No
  account changes, smallest footprint. The 30-second cost is a weekly chore.
- **Publish the app to Production (durable, but a trade-off):** Google Auth Platform → **Audience** →
  **Publish app**. This removes the 7-day expiry so the token lasts indefinitely. The trade-offs: the app
  becomes nominally "available to any Google user" (in practice no one else has your client secret, and an
  "unverified app" warning deters), and because the full Drive scope is *restricted*, Google will say the app
  "needs verification" (a CASA security review). For personal/owner-only use you can run it unverified in
  production. Verification is only needed to remove the warning or serve real external users. It's
  reversible (you can switch back to Testing).

**To extend to Gmail/Calendar later:** enable the Gmail + Calendar APIs in the project, re-run the Step 3
`auth` command and tick those boxes on the consent screen, then set `MCP_TOOL_GROUPS=all` (`claude mcp
remove google-docs -s user`, then re-add).

---

## Step 1: Create one Google Cloud OAuth client (used by both the MCP and the export script)

You only need **one** OAuth client for everything Google in this repo. If you already created one for the
DOCX export (see [`gdoc-export-setup.md`](gdoc-export-setup.md)), reuse that same client here. Just enable
the extra APIs in Step 2.

1. Go to <https://console.cloud.google.com/> → project dropdown → **New Project** (e.g. "FNNL Agency GTM"). Select it.
2. **Create the OAuth client:** APIs & Services → **Credentials** → **Create credentials** → **OAuth client ID**
   → Application type **Desktop app** → **Create**. Copy the **Client ID** and **Client secret**. You'll need
   them in Steps 3 and 4.

## Step 2: Enable the APIs and add the scopes

Because the server requests all of these at sign-in, you must enable them or the authorization will fail.

1. **Enable APIs:** APIs & Services → **Library** → enable each of:
   **Google Docs API**, **Google Sheets API**, **Google Drive API**, **Gmail API**, **Google Calendar API**.
   *(If you only ever want Docs/Sheets/Drive, you can skip Gmail and Calendar, but then you must also tell
   the server not to ask for them; see "Narrowing the tools" below. The simplest, working path is to enable
   all five.)*
2. **Consent screen:** APIs & Services → **OAuth consent screen** → User type **External** → fill in app name
   and your email → Save. Add your own Google address (`<operator-google-account>`) under **Test users**
   (test mode is fine, no need to publish). When prompted for scopes, the relevant ones are:
   `documents`, `spreadsheets`, `drive`, `gmail.modify`, `calendar.events` (the server also asks for the
   Apps Script `script.external_request` scope).

## Step 3: Authorize once (saves a refresh token locally)

Run this from any PowerShell window, pasting in the Client ID and Secret from Step 1:

```powershell
$env:GOOGLE_CLIENT_ID="<your client id>"
$env:GOOGLE_CLIENT_SECRET="<your client secret>"
npx -y @a-bonus/google-docs-mcp auth
```

Your browser opens the Google consent screen → approve. The refresh token is saved to
`C:\Users\admin\.config\google-docs-mcp\token.json`. (The client ID/secret are **not** stored in that file —
they're supplied each time the server starts, in Step 4.)

## Step 4: Register the server in Claude Code (the reliable local path)

The committed `.mcp.json` already has a `google-docs` entry, but it uses `${GOOGLE_CLIENT_ID}` /
`${GOOGLE_CLIENT_SECRET}` placeholders. That copy is for repo/web/cloud portability and only resolves if
those environment variables are set. For your local machine, register it in **user scope with the literal
credentials**, exactly like the other working servers (spaceship, smartlead, zapmail, …) live in
`~/.claude.json`:

```powershell
claude mcp add google-docs -s user `
  -e GOOGLE_CLIENT_ID="<your client id>" `
  -e GOOGLE_CLIENT_SECRET="<your client secret>" `
  -- cmd /c npx -y @a-bonus/google-docs-mcp
```

> **Why `cmd /c npx` and not plain `npx`?** On this Windows build the other working user-scope servers
> (spaceship, smartlead, zapmail) are all registered as `cmd /c npx -y <pkg>`. That's the form that
> connects. (The committed `.mcp.json` uses plain `npx` on purpose: that copy targets Linux/cloud.) If you
> run the `claude mcp add` command from **git-bash** instead of PowerShell, prefix it with
> `MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL='*'` so the `/c` isn't mangled into `C:/`.

Restart Claude Code (or reconnect MCP) and you should see `google-docs` connect with its Docs/Sheets/Drive
(and Gmail/Calendar) tools.

---

## Narrowing the tools (optional)

`auth` always grants all the scopes above, but you can hide the Gmail/Calendar **tools** from Claude by
adding `MCP_TOOL_GROUPS` when you register. Valid groups: `docs`, `drive`, `sheets`, `utils`, `gmail`,
`calendar`, `all`. For Sheets/Docs/Drive only:

```powershell
claude mcp add google-docs -s user `
  -e GOOGLE_CLIENT_ID="<id>" -e GOOGLE_CLIENT_SECRET="<secret>" `
  -e MCP_TOOL_GROUPS="docs,drive,sheets,utils" `
  -- cmd /c npx -y @a-bonus/google-docs-mcp
```

This only changes which tools appear. It does **not** reduce what you granted at sign-in.

## Troubleshooting

- **First connect shows "Failed to connect". This is expected once.** On a fresh package, `npx -y`
  has to download it, and the first `claude mcp list` / connect often times out mid-download. Just retry
  (run `claude mcp list` again, or reconnect), or pre-warm by running `npx -y @a-bonus/google-docs-mcp auth`
  first (which forces the download). It connects on the second attempt.
- **Authorization errors / "scope not allowed":** confirm all five APIs are enabled and your email is a
  Test User on the consent screen. Then re-run the Step 3 `auth` command.
- **Auth errors on the Apps Script scope (`script.external_request`):** the server also requests this
  sixth scope. Test users can usually consent to it without extra setup; if `auth` errors on it
  specifically, enable the **Apps Script API** in the same project and retry.
- **Upgraded and Gmail/Calendar tools error:** delete `C:\Users\admin\.config\google-docs-mcp\token.json`
  and re-run `auth`. Older tokens predate those scopes.
- **Server won't start:** make sure `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` were passed (Step 4). Try
  `npx -y @a-bonus/google-docs-mcp` manually and read stderr.

## Security notes

- The refresh token lives only in `C:\Users\admin\.config\google-docs-mcp\token.json`; the client ID/secret
  live in your Claude Code user config (`~/.claude.json`). Treat both like API keys.
- Revoke access any time at <https://myaccount.google.com/permissions>.
- The committed `.mcp.json` holds only `${ENV}` placeholders. No secrets are committed to the repo.
