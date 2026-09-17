# RevCode custom extensions — the upstream workspace stack pack

**What this is.** Four ready-to-upload RevCode *custom extensions* — one JSON manifest per tool — that wire the parts of your active stack RevCode doesn't already ship into RevCode's agent and column functions. Each file is a complete manifest you upload as-is.

**What's in the box (the gaps RevCode doesn't already cover):**

| File | Tool | What RevCode gains | Methods |
|---|---|---|---|
| `aleads.json` | **A-Leads** | Company filter search, lookalike companies, people search, work-email finding, phone finding, email verification | 7 |
| `discolike.json` | **DiscoLike** | Lookalike company discovery from a seed domain or a natural-language ICP (REST `/discover`) | 1 |
| `serper.json` | **Serper** | Google web search, news, places, and maps as structured JSON | 4 |
| `spider-cloud.json` | **Spider Cloud** | Scrape a page, crawl a site, list links, web search (renders JS, beats bot walls) | 4 |

**Why only these four.** RevCode already ships built-in extensions for the rest of your stack — Apollo, Prospeo, Icypeas, Apify, Smartlead, EmailBison, Instantly, Blitz, Findymail, LeadMagic, and HeyReach — and handles OpenAI / Anthropic / MiniMax / OpenRouter natively in its **AI Providers** panel. Rebuilding those would just duplicate what's there, so this pack covers only the tools that were missing. (A-Leads is the one your in-app RevCode agent was blocked on.)

---

## How to upload (per file)

A RevCode extension wraps exactly one provider (one base URL, one auth), so you upload **one file at a time** — repeat these steps for each of the four.

1. In RevCode, open **Extensions** (left sidebar → *Browse all…*, or the Extensions screen).
2. Click **Create extension** (top right) → the **Upload custom extension** dialog opens (it uploads to your **the upstream workspace** team).
3. Click **Load from file** and pick one of the `.json` files in this folder (or open the file, copy its contents, and paste into the **Manifest JSON** box).
4. Click **Upload to the upstream workspace**. The extension becomes available to the whole team on next sync; its methods can be called from the agent, column functions, and cloud deployments.
5. Repeat for the remaining files.

## Add your API key after upload (keys are NOT in these files)

These manifests are **keyless by design** — they declare a credential field, not the secret. RevCode stores your key in its own encrypted credential store, never in the manifest. After uploading an extension:

1. Open the extension's page → **Connections** → **Add connection**.
2. Paste the key into the field it asks for, and pick the scope (Personal / Team / Local).

The key each one wants (all already in your registry / `scripts/.env`):

| Extension | Field label | Your env var | Auth sent |
|---|---|---|---|
| A-Leads | A-Leads API Key | `ALEADS_API_KEY` | header `x-api-key` |
| DiscoLike | DiscoLike API Key | `DISCOLIKE_API_KEY` | header `x-discolike-key` |
| Serper | Serper API Key | `SERPER_API_KEY` | header `X-API-KEY` |
| Spider Cloud | Spider Cloud API Key | `SPIDER_API_KEY` | header `Authorization: Bearer …` |

---

## Validate before/after editing

Every file here passes RevCode's **own** manifest validator. To re-check after any edit, run RevCode's bundled CLI (read-only — no upload, no team change):

```
node "C:\Program Files\Revcode\resources\cli\bin\gtm-pilot.js" extensions validate <path-to.json>
```

A pass returns `{ "valid": true, "id": ..., "methods": [...] }`. (This is the authoritative check; it's the same `validateManifest()` the upload uses.)

## Confirmed vs inferred — read before first run

The manifests are schema-valid and the auth/URLs are right, but a few request/response details are inferred and should be confirmed on first live run. A wrong path 404s; a wrong response key just returns `null` (the call still runs).

| Item | Status |
|---|---|
| All four base URLs + auth headers | **Confirmed** (your key registry + router code) |
| A-Leads request bodies (wrappers, params) | **Confirmed** from the `/aleads-api` skill (OpenAPI-verified) |
| Serper endpoints + response keys (`organic`, `news`, `places`) | **Confirmed** from your router |
| Spider **`/crawl`** | **Confirmed** from your router |
| Spider `/scrape`, `/links`, `/search` | **Inferred** from the Spider MCP tool names — verify the path on first run |
| DiscoLike params beyond `domain`/`country`/`max_records`/`icp_*` | not added (REST surface unconfirmed) |
| A-Leads + DiscoLike `response` maps (the `raw` whole-response fields) | **Inferred** — see below |

## Notes & known limits

- **A-Leads plan-gating.** Several A-Leads endpoints currently return `500` with no message on the the upstream workspace key because the services aren't activated on the plan (confirmed 2026-06-08). The methods are correct; once A-Leads activates the services (`support@a-leads.co`), they'll return data. `find-email/personal` returns a clear `403` until activated.
- **`response` mappings.** Where the live response shape is documented (Serper, Spider) the methods map the useful keys (`organic`, `news`, page `content`, etc.). Where it wasn't confirmed (A-Leads, DiscoLike REST) each method returns the **whole response** under a `raw` field (`path: ""` = the entire payload in RevCode's mapper, which never throws on a missing path). Once you see a real response, add precise field mappings — see the schema reference below.
- **DiscoLike is intentionally thin here.** Its feature-complete surface (DiscoGen research, contact search, ICP-fit validation, enrichment, segmentation) is its **MCP server**, already connected in Claude Code. This REST extension just exposes company discovery so it can run as a RevCode column function.

---

## Manifest schema reference (for adding more later)

Derived from RevCode's own built-in manifests and its `validateManifest()` (in the `gtm-pilot` bundle). Validate any new manifest with the CLI command shown under **Validate before/after editing** above. Note: `execution`, `rateLimits`, and `connectionCheck` are optional — but **if you include `execution`, `execution.rateLimitSignals` (a non-empty string array) is required**, along with `maxConcurrentRequests` and `retry`.

```jsonc
{
  "id": "kebab-slug",                 // unique; don't collide with a built-in id
  "name": "Display Name",
  "version": "1.0.0",
  "description": "...",
  "author": "the upstream workspace (custom)",
  "category": "enrichment|scraping|data|verification|communication|ai|other",
  "baseUrl": "https://api.example.com/v1",   // http(s), NO trailing slash; method paths append
  "auth": {
    "type": "api-key|bearer|basic|oauth2|custom",
    "setup": { "fields": [{ "key": "apiKey", "label": "API Key", "type": "secret|text" }], "helpUrl": "..." },
    "inject": { "headers": { "X-API-Key": "{{apiKey}}" } }   // {{fieldKey}} = the value entered at connect-time
  },
  "execution": {                       // optional block — but if present, ALL of these are needed:
    "maxConcurrentRequests": 2, "minDelayMs": 300,
    "retry": { "maxAttempts": 3, "backoff": "none|linear|exponential", "baseDelayMs": 1000, "maxDelayMs": 30000 },
    "rateLimitSignals": ["429", "rate limit", "too many requests"]   // required when execution is present
  },
  "methods": {
    "methodId": {
      "name": "...", "description": "...", "instructions": "...(optional)",
      "endpoint": { "method": "GET|POST|PUT|PATCH|DELETE", "path": "/route" },
      "params": {                      // required (use {} if none)
        "foo": { "type": "string|number|boolean|object|array", "required": true,
                 "description": "...", "default": 10, "minimum": 0, "maximum": 100,
                 "location": "query|body" }   // default body on POST; set query for GET/query params
      },
      "response": {                    // required; path = dot/index path into the JSON, "" = whole response
        "field": { "path": "data.field", "type": "string|number|boolean|json|array" },
        "raw":   { "path": "", "type": "json" }
      },
      "bodyMapping": {                 // optional — shapes the POST body
        "wrapper": "data",             //   nest all body params under "data"
        "topLevel": ["page"],          //   …except these, which stay at the top level
        "rootParam": "input"           //   OR: one object param IS the entire body
      },
      "category": "people_enrichment|company_enrichment|email_finding|email_verification|phone_finding|search|scraping|ads|jobs|signals|outreach|other",
      "generateFunction": false
    }
  }
}
```

**Request assembly, in plain terms:** `baseUrl` + `endpoint.path` is the URL. `auth.inject` adds the auth header/param/body, filling `{{fieldKey}}` from the connection. Each `param` goes in the body by default (query if `location: "query"`); `bodyMapping` then nests body params under `wrapper`, keeps `topLevel` ones outside it, or (with `rootParam`) sends one object param as the whole body. The response is filtered through `response`: each key pulls `path` out of the JSON (missing path → `null`, never an error).
