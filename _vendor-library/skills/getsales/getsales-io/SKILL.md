---
name: getsales-io
description: Basic v0.1 integration for GetSales.io (LinkedIn + email multichannel outreach / sequencing) — a default-stack SENDING platform for forked GTM workspaces. Covers the verified REST API (base amazing.getsales.io, Bearer-JWT auth, 300 req/min), the dep-free client scripts/getsales.mjs, and both MCP paths (official hosted https://mcp.getsales.io via OAuth, plus a local key-only MCP server). Use when run_state.sending_platform = GetSales.io, or to push leads into a GetSales flow. NOT used by the upstream workspace (which sends via Smartlead/EmailBison). Live-untested (no account yet) — optimize when a client actually uses it. Triggers - "getsales", "getsales.io", "add leads to a GetSales flow", "/getsales-io".
---

# GetSales.io (basic v0.1)

> **Status: basic v0.1, live-untested.** Built 2026-06-24 from GetSales' verified API docs. the upstream workspace has no GetSales account, so nothing here has been run against a live key. It is a default-stack sending platform for **forked** workspaces (`/new-gtm-workspace`) or a client who uses GetSales. Optimize (full campaign-build parity with `/smartlead-campaign-upload-public`) when a client actually uses it. Capability-truth: do not claim end-to-end GetSales campaign automation until that work is done.

## What it is and where it fits

GetSales.io is a LinkedIn + email multichannel outreach and sequencing platform (their "Flows" are campaigns/sequences). In the GTM flow it sits at the **sending / campaign platform** layer, an alternative to Smartlead or EmailBison. Lock it the same way: record `run_state.sending_platform = GetSales.io`, and route sending actions here.

## Access

- **Key:** `GETSALES_API_KEY` in `scripts/.env`. It is a JWT (~3-year expiry). Generate it in GetSales: **Workspace Settings → API Keys**.
- **API host:** `https://amazing.getsales.io`. Important gotcha: `api.getsales.io` is the **docs** host and will 404 real API calls. The client defaults to the correct host.
- **Auth:** `Authorization: Bearer <GETSALES_API_KEY>`.
- **Rate limit:** 300 requests/minute/key. Lists paginate with `limit` (default 20, max 100), `offset`, `order_field`, `order_type`.

## How to drive it

**1. Script client (deterministic, recommended for automation)** — `scripts/getsales.mjs` (dep-free Node + fetch):

| Command | Endpoint |
|---|---|
| `node getsales.mjs me` | `GET /id/api/users/current` (auth + connectivity check) |
| `node getsales.mjs flows [--limit N --offset N]` | `GET /flows/api/flows` |
| `node getsales.mjs senders` | `GET /flows/api/sender-profiles` |
| `node getsales.mjs lead-search --json '{...}'` | `POST /leads/api/leads/search` |
| `node getsales.mjs lead-upsert --json '{...}'` | `POST /leads/api/leads/upsert` (import a contact) |
| `node getsales.mjs flow-add-lead --flow <uuid> --json '{...}'` | `POST /flows/api/flows/{uuid}/add-new-lead` |
| `node getsales.mjs call --method GET --path /x/api/y` | generic escape hatch (178 endpoints exist) |

Run `node getsales.mjs me` first to confirm the key works.

**2. MCP (for conversational / full-surface use)** — two options:
- **Official hosted MCP (preferred for breadth):** `https://mcp.getsales.io` (OAuth). Add it in **Claude → Settings → Connectors → Add custom connector**, name `GetSales`, URL `https://mcp.getsales.io`, then authenticate. This mirrors the full API surface and needs no key in the repo.
- **Local key-only MCP (offline / scriptable):** `scripts/mcp/getsales-mcp-server.mjs` (dep-free, wraps the client). Exposes `getsales_me`, `getsales_list_flows`, `getsales_search_leads`, `getsales_list_senders`, `getsales_upsert_lead`, `getsales_add_lead_to_flow`. Register with `command: node`, args the server path, env `GETSALES_API_KEY`.

## Safety + flow discipline

- Do not author LinkedIn or email copy ad hoc inside this sending skill. Run `/outreach-copywriting` for every initial cold message. For full cold-email campaigns, also run `/campaign-copywriting`. Upload only approved copy that passed `outreach-copy-framework.md` plus `/spam-word-checker`.
- Adding leads to a live flow can start outreach. Treat any send-triggering call as a spend/live action: confirm with the operator and respect the locked stack, the same as the Smartlead/EmailBison upload skills. Build drafts/paused where the platform supports it.
- Route key presence through `/preflight-credentials` (registered warn-level, triggers only when `sending_platform = GetSales.io`).
- Path resolution: `scripts/...` resolves under `outbound/` per the repo CLAUDE.md rule.
