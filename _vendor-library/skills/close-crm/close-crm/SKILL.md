---
name: close-crm
description: Basic v0.1 integration for Close.com (Close CRM) — the default-stack CRM layer for forked GTM workspaces (a capability the the upstream workspace system does not otherwise have). Covers the verified REST API (base api.close.com/api/v1, HTTP Basic auth with the API key as username, singular trailing-slash paths), the dep-free client scripts/close.mjs, and both MCP paths (official hosted https://mcp.close.com/mcp with Close-API-Key headers, plus a local key-only MCP server). Use to sync leads/opportunities/activities into Close (e.g. push a positive reply into a pipeline). NOT used by the upstream workspace today. Live-untested (no account yet) — optimize when a client actually uses it. Triggers - "close crm", "close.com", "push lead to close", "log to close", "/close-crm".
---

# Close.com / Close CRM (basic v0.1)

> **Status: basic v0.1, live-untested.** Built 2026-06-24 from Close's verified API docs. the upstream workspace has no Close account, so nothing here has been run against a live key. It is the default-stack **CRM** layer for **forked** workspaces (`/new-gtm-workspace`) or a client who uses Close. CRM is a new capability area for this system. Optimize (the reply→pipeline sync, field mapping, dedupe) when a client actually uses it. Capability-truth: do not claim a working CRM sync until that work is done.

## What it is and where it fits

Close is a sales CRM (leads, contacts, opportunities, activities). This system has no CRM step today; Close adds one. The natural hook in the GTM flow is **downstream of reply handling**: when a reply is positive or a call is booked, create/update a Close lead, add an opportunity, and log the activity, so the pipeline lives in the CRM rather than only in the inbox. It is orthogonal to sending (works alongside Smartlead/EmailBison/GetSales).

## Access

- **Key:** `CLOSE_API_KEY` in `scripts/.env`. It starts with `api_` and has two dot-separated parts (id.secret). Generate it in Close: **Settings → Developer → API Keys**.
- **API base:** `https://api.close.com/api/v1`.
- **Auth:** HTTP Basic where the **API key is the username and the password is empty** — `Authorization: Basic base64("<CLOSE_API_KEY>:")` (note the trailing colon). The client handles this.
- **Paths:** singular resource nouns with a **trailing slash** (`/lead/`, `/contact/`, `/opportunity/`, `/activity/note/`).
- **Rate limits:** per endpoint-group, per-key and per-org (org = 3× key). On HTTP 429, back off by the `rate_reset` seconds in the response.

## How to drive it

**1. Script client (deterministic, recommended for automation)** — `scripts/close.mjs` (dep-free Node + fetch):

| Command | Endpoint |
|---|---|
| `node close.mjs me` | `GET /me/` (auth + connectivity check) |
| `node close.mjs leads [--query "..." --limit N]` | `GET /lead/` |
| `node close.mjs lead-get --id <id>` | `GET /lead/{id}/` |
| `node close.mjs lead-create --json '{...}'` | `POST /lead/` |
| `node close.mjs lead-update --id <id> --json '{...}'` | `PUT /lead/{id}/` |
| `node close.mjs contact-create --json '{...}'` | `POST /contact/` |
| `node close.mjs opps [--limit N]` | `GET /opportunity/` |
| `node close.mjs opp-create --json '{...}'` | `POST /opportunity/` |
| `node close.mjs note --json '{...}'` | `POST /activity/note/` |
| `node close.mjs search --json '{...}'` | `POST /data/search/` (advanced filtering) |
| `node close.mjs call --method GET --path /x/` | generic escape hatch |

Run `node close.mjs me` first to confirm the key works.

**2. MCP (for conversational / full-surface use)** — two options:
- **Official hosted MCP (preferred for breadth):** `https://mcp.close.com/mcp`. Add it directly:
  ```
  claude mcp add --scope user --transport http close https://mcp.close.com/mcp \
    --header "Close-API-Key: ${CLOSE_API_KEY}" --header "Close-Scope: mcp.read"
  ```
  Scopes: `mcp.read` (read-only), `mcp.write_safe` (read + write), `mcp.write_destructive` (+ delete). Start with `mcp.read`.
- **Local key-only MCP (offline / scriptable):** `scripts/mcp/close-mcp-server.mjs` (dep-free, wraps the client). Exposes `close_me`, `close_search_leads`, `close_get_lead`, `close_list_opportunities`, `close_search`, `close_create_lead`. Register with `command: node`, args the server path, env `CLOSE_API_KEY`.

## Safety + flow discipline

- Writes create real CRM records. Treat create/update/delete as live actions: confirm with the operator, prefer the read scope (`mcp.read`) until a sync is designed, and never bulk-write from a half-built mapping.
- Route key presence through `/preflight-credentials` (registered warn-level under the new `crm` tier; triggers only when a CRM is configured).
- Path resolution: `scripts/...` resolves under `02-skills/coldoutbound-skills/` per the repo CLAUDE.md rule.
