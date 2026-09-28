---
name: mcp-tools-routing
description: "Infra and sending-tool MCP routing for FNNL cold outbound. Use before any domain, DNS, mailbox, campaign-upload or deliverability/reporting step to decide MCP tool vs script vs raw API; also routes the read-only client-context connectors. Every spend op goes through /api-cost-governance."
---

**From the former description:** The infra-layer sibling of ai-model-routing.md (which routes Claude Code's own research, crunching and copy) and lead-list-tech-stack-research.md (which routes data tools). The read-only client-context connectors it routes are Slack, email, calendar, file storage and Notion, used by the client context sweep and /client-intel-sync. CRITICAL: MCP tool calls are a new spend surface, so route every spend op through /api-cost-governance.

# MCP Tools Routing

This is the tool-selection reference for the **infrastructure and sending** steps of the cold-outbound flow: registrars, DNS, mailbox providers, sending platforms, and their reporting. It is the third routing sibling:

- `ai-model-routing.md`: how **Claude Code itself** researches, crunches, and writes. Since the no-AI-API rule (operator directive 2026-09-22) there is no third-party AI model to route; the one AI call left is the headshot image (see the routing table below).
- `lead-list-tech-stack-research.md`: which **data tool** collects a signal.
- **this file**: which **infra/sending tool** (MCP server, script, or raw API) performs a domain, mailbox, campaign, or reporting action.

MCP servers give Claude live, native tool access to the infra and sending layer instead of hand-rolling HTTP. Which servers exist in any given run is whatever this workspace has configured (the repo `.mcp.json` plus whatever is enabled in Claude Code), not a fixed set, so confirm what is actually connected at point-of-use rather than assuming. MCP servers do **not** replace the bulk scripts; they sit alongside them. This file is the routing doctrine, not an install guide.

> Runtime note (assumption): the runtime may execute a marketplace or packaged copy of a skill rather than this editable folder, so an edit made here does not automatically take effect at runtime. Confirm which copy is live before relying on a change made in this file. Per-skill routing blocks are a follow-up gated on that, and are not done here because they would not yet take effect at runtime.

## ⚠️ Cost gate first: MCP is a new spend surface

`/api-cost-governance` (the STANDING PROTOCOL) was built around a **script registry**, so it knows which `.py`/`.ps1` scripts spend money. **MCP tool calls bypass that registry entirely.** A single MCP call can register 24 domains or create 48 mailboxes: real money, no script involved. The operator's standing rule is "never silently auto-spend": every charge is previewed and reported, it runs without a question only inside an approved budget (the standing \$100 per client run for paid data steps, operator directive 2026-09-22; the setup total the operator approved for infrastructure), and there is a top-up gate and a \$10 warning.

**Therefore: any MCP op that spends money routes through `/api-cost-governance` exactly like a script: preview USD, check balance/funds, check it against the approved budget (inside it, the budget is the confirmation and nothing is asked; over it, ask), then act.**

| MCP op class (by capability slot) | Spends real money? | Gate before running |
|---|---|---|
| `registrar`: register / buy / renew a domain | **Yes** (registration fee) | **/api-cost-governance** |
| `mailbox_provider`: create a domain, create mailboxes | **Yes** (per-mailbox cost) | **/api-cost-governance** |
| `registrar`: list domains, check availability, read or edit DNS, nameservers | No | none (free read/config) |
| `sending_platform`: campaign / lead / account reads, statistics, analytics, deliverability reads | No (covered by the subscription) | none |
| `mailbox_provider`: list or read mailboxes and domains, export mailboxes into the sending platform | No | none |
| `sending_platform`: create campaign, add leads, update mailbox settings | No per-call $, but a **live-system write** | confirm before touching a live campaign |

If unsure whether a tool spends, treat it as spend and gate it.

## ⚠️ HARD RULE: MCP first, browser automation only as a fallback

**Always try the MCP tool first for any infra/sending/provider action. Use browser automation
(Claude-in-Chrome) only when no MCP can do it** (the capability is missing or unsupported on that
server), and **say so explicitly** when you fall back.

This is a separate axis from "MCP-first vs scripts-first" below (which is about bulk/determinism):

- **MCP vs scripts** → decided by *volume + determinism* (bulk → script; one-off → MCP).
- **MCP vs browser** → MCP **always wins** when it can do the op. Browser is a last resort, not a peer.

Order of preference for any provider op: **MCP tool → bundled script/raw API → browser automation.**

Why this is a hard rule: browser automation against provider dashboards (campaign tagging, mailbox
purchase and exports, client views) is slow and fragile. Renderer freezes, comboboxes that don't clear,
viewport resizes that shift click coordinates, silent half-saves. Past sessions lost time and created
junk state going to the browser for things an MCP call does cleanly. Before any browser fallback:

1. Search the MCP servers actually configured in this workspace for a tool that does it, and check
   whether the activated vendor pack for that slot ships a script instead. Tool sets drift, so confirm
   at point-of-use and don't assume absence.
2. If the write API/MCP is **read-only or 404s on the write**, that counts as "MCP can't do it", so
   a script/raw API or browser fallback is justified. Note which one and why.
3. Only then use Claude-in-Chrome, and state explicitly that no MCP path existed.

## The capability slots (category level)

FNNL's infra tools are not settled: the registrar and mailbox slots are `held` (email infra is deferred by the operator), while the sending platform is chosen. What follows are **capability slots**, not a stack. The actual tool in each slot is whatever `stack-contract.yaml` locks it to, and per client whatever the matching `run_state` field locks it to. There is no default. If a slot is unset, stop and route the operator to `/stack-setup` rather than substituting a vendor.

A named tool is also not a working tool. Per `/stack-setup`'s capability-truth rule, a slot at status `chosen` has only been recorded, while `live` means a real call against FNNL's own account has succeeded. Never tell the operator a step can be automated on the strength of `chosen` alone.

Tool names below are categories, not signatures. Confirm the exact tool at point-of-use (server tool lists are not enumerated here to avoid drift).

| Capability slot | Role in the flow | Domain of tools that fill it | Where the real answer comes from |
|---|---|---|---|
| `registrar` | Buy the domains and hold their DNS | domain search/registration, DNS records (SPF/DKIM/DMARC/MX), nameservers, contacts, privacy | `outbound/stack-contract.yaml`; per client `run_state.registrar` and `run_state.infrastructure_stack` |
| `mailbox_provider` | Create and hold the sending mailboxes | domain management, mailbox create/update, export of mailboxes into the sending platform | `stack-contract.yaml`; per client `run_state.mailbox_provider` |
| `sending_platform` | Send the campaigns and report on them | campaigns, leads, email accounts, statistics, deliverability | `stack-contract.yaml`; per client `run_state.sending_platform` |

> **Approved-stack rule (operator directive 2026-09-22).** FNNL's tools are the closed list in the `approved_stack` block of `outbound/stack-contract.yaml`. Meet every need from that list first, and check each listed tool's full surface (its MCP tool list and API docs) before declaring a gap. Any other tool named in this file is a catalogue example: raise it only as "OUT OF STACK, needs operator approval", never as the path, and never credential or spend on it until the operator approves it by name and it is recorded in `approved_stack.approved_exceptions`. A slot at status `held` declares nothing, exactly like `not_chosen`.

Examples of tools that could fill these slots (illustrative only, not routing instructions): `spaceship-mcp` for registrar plus DNS; `zapmail` and `salesforge` (Primeforge) for the mailbox provider, the Forge one being HTTP with an `X-Primeforge-Key` header; `smartlead` (LeadMagic) and `emailbison` for the sending platform, EmailBison being self-hosted so it needs an instance URL as well as a key.

**There is no default sending platform.** The sending platform is whatever `run_state.sending_platform` is locked to for this client, sourced from the workspace stack contract at `outbound/stack-contract.yaml`. It must be set during `/stack-setup`, and if the slot is unset, stop and route the operator to `/stack-setup` rather than substituting a vendor. The downstream rule that matters: route every sending-platform read and write to whichever platform that client actually uses, never to a remembered or assumed one. Platform-specific skills (`smartlead-*`, `emailbison-*`) ship inert in `_vendor-library/skills/` for the platforms they name, and become available only once `/stack-setup` activates the matching pack.

## Output / productivity capability: documents, sheets, and file storage

Separate from the infra and sending slots above, the flow writes approval briefs, trackers, and reports into documents and spreadsheets. Those are the `document_generation` and `spreadsheet` slots, plus `reporting_destination` for where a report lands. Each is whatever the workspace stack contract at `outbound/stack-contract.yaml` is locked to. There is no default. If a slot is unset, produce the artifact as a local file and route the operator to `/stack-setup` rather than substituting a vendor. Whether any of this is reachable through an MCP server is a separate question answered by what is actually connected in this run, so confirm at point-of-use.

One integration that could fill this role (illustrative only, nothing chosen for FNNL) is a **`google-docs`** MCP such as `@a-bonus/google-docs-mcp`, which gives Claude native read/write on Google **Docs, Sheets, and Drive** (and optionally Gmail plus Calendar). Setup and scope details: [`google-docs-mcp-setup.md`](../../../outbound/reference/google-docs-mcp-setup.md). It needs broad Google scopes (full Drive) and a one-time browser auth, so it does nothing until the operator completes that setup.

A document server of this kind is an **output** surface, not infra. It touches no provider spend, so nothing in this section is gated by `/api-cost-governance`. It is all free reads and writes inside the operator's own account.

Routing for any document, spreadsheet, or file-storage operation once such a server is connected (per the MCP-first hard rule above):

| Operation | Use | Notes |
|---|---|---|
| Read/edit a Doc or Sheet, append rows, format cells, create a Doc/Sheet from markdown, search file storage | **the connected document MCP** | Native, no browser. The biggest win is a tracker skill such as `cold-email-inbox-tracker`, which otherwise writes its sheet through browser automation or Apps Script. Prefer the Sheets tools whenever the document server is connected, browser only as fallback. |
| Render a polished **DOCX** into a native Google Doc (approval briefs, presentations), only when the operator asked for that DOCX (generated client files are plain text by default, operator decision 2026-09-28) | **`docx_to_gdoc.mjs` script** | Keep the script. It preserves full Word formatting on import, which the MCP cannot do. The two are complementary, not a replacement. |
| Gmail / Calendar reads or writes | **the connected document MCP**, *only if those tool groups were enabled at install* | Sensitive scopes. Off unless the operator opted in. That opt-in governs writes and this document MCP's own Gmail and Calendar tool groups. The client context sweep and `/client-intel-sync` do not wait on it: they read email and the calendar through whatever connector the session already has (next row), read-only, and never send, draft, label, trash or write an event. |
| Read client context: Slack channels and DMs, email, calendar, Drive or other file storage, Notion, for the client context sweep and `/client-intel-sync` | **whatever read connectors the session actually has**, read-only | Read-only client-context sources (operator ruling 2026-09-24), not stack tools: they fill no slot in `stack-contract.yaml`, are never credentialed or spent on, and the six-tools rule does not apply to them (the same reasoning `client-slack-check.md` gives for Slack). Many of these connectors also expose send, post, draft, label, trash and event tools; none of them is ever called. Protocols: `client-context-sweep.md` and `client-intel-feed.md`. |

**Client-context reads (added 2026-09-24).** Name the account or workspace actually searched, every time: "nothing found" only counts for that account or workspace. The connectors a session sees may belong to the operator's other agency and hold many unrelated clients, so an item is filed only under a client that has an FNNL profile (`outbound/profiles/<slug>/`); anything about another company is dropped (never stored, never summarized), and the run report counts the drops. The MCP-first, browser-fallback hard rule above does not apply to these reads. When a connector is absent, unauthorized or on the wrong account, the source is logged per `client-context-sweep.md` (a core source is `blocked`, the calendar and Notion `not_connected`; the Slack check says `unavailable`) and the fallback is an operator paste, never a browser session on the operator's own sign-ins. Nothing here posts, replies or sends.

## Routing: MCP-first vs scripts-first

The dividing line is **volume and determinism**: bulk work goes to batched, resumable scripts rather than one tool call per item.

| Situation | Use | Why |
|---|---|---|
| One-off / low-volume infra op (fix a DNS record, provision a handful of mailboxes, check a domain) | **MCP** | Fast, native, no script to maintain |
| Status / reporting / analytics read (campaign numbers, deliverability, mailbox health) | **MCP** | Live reads, free, no API script needed, the cleanest win |
| Bulk domain setup (a 24-domain bulk run for one client, etc.) | **Scripts** (the bulk setup scripts from the activated `registrar` + `mailbox_provider` pack, e.g. `zapmail_domain_setup.*` and the registrar's own scripts) | Deterministic, resumable, rate-limit handling, cost-batched |
| Bulk mailbox provisioning | **Scripts** | Same: batch + resumable + one cost gate, not N tool calls |
| Bulk lead upload to a campaign | **Scripts / raw API** | Throughput; MCP is per-call |
| Per-lead personalization | **Task sub-agents** (`personalization-subagent-pattern`) | Unchanged: MCPs feed context, they do not replace the agents |
| Mailbox-profile image/GIF generation (`mailbox-profile-generator`) | **Script** (`generate_inbox_profiles.py`) for asset generation; **MCP** to *apply* the picture at the `mailbox_provider` | Image gen isn't an MCP capability, but applying the avatar is, so MCP-first per the hard rule above. The headshot is the one AI API call left (OpenAI, headshots only, asked for at infrastructure setup) |

## Stage map: where each slot lands in the flow

- **Domain registration + DNS** → the `registrar` slot (DNS lives with the registrar unless the operator has split it). DNS reads/edits and availability checks are free, so use them freely. Registration is a **spend op**, so gate it. Bulk setup (many domains) stays on the scripts from the activated pack (`spaceship+zapmail-domain-setup`, `spaceship+primeforge-domain-setup`, `dynadot+*` and the rest are registrar-plus-provider *pairings*, so use only the one matching the locked stack).
- **Mailbox provisioning** → the `mailbox_provider` slot, whichever provider is locked. Small N → MCP (gated, spend). Bulk → scripts (`zapmail_domain_setup.*`, `primeforge-domain-setup`, and the other pairing scripts). Mailbox mix per `mailbox-mix-strategy`.
- **Campaign upload** (the locked platform's upload skill, e.g. `smartlead-campaign-upload-public` inside that pack, plus `auto-research-public`) → create the campaign and small ops via the `sending_platform` MCP; bulk lead upload stays scripted.
- **Deliverability + reporting** (`email-deliverability-audit`, `list-quality-scorecard`, plus the deliverability-test and reply-scoring skills inside the activated sending-platform pack) → `sending_platform` MCP reads. **Biggest clean win**: live stats with no API script to maintain, and no spend.

## When NOT to reach for an MCP

- The op is bulk (≥ a batch) and a resumable script already exists → script wins.
- The op spends money and you have not run `/api-cost-governance` → gate first, always.
- Pure orchestration, file edits, local execution → Claude Code inline, no MCP.
- The client doesn't use that platform. Never pull one sending platform's stats for a client whose `run_state.sending_platform` is a different platform, or vice-versa.
- A copy/QA guardrail applies: `spam-word-checker.md` and `cold-email-copy-best-practices.md` stay source of truth regardless of tool.

## Where this can fail

- **Silent spend** is the top risk: the MCP makes "buy domains / make mailboxes" a one-liner. Gate every spend op.
- Keys resolve from `scripts/.env` and the credential registry, and `.mcp.json` uses `${ENV}` placeholders, so a web or cloud run needs those env vars set or the server won't connect. Whether any particular key actually resolves is a `/preflight-credentials` question, never an assumption made here.
- Wrong sender platform per client → reconcile against the client profile before any sending-platform write.
- Tool drift: server tool sets change across versions, so confirm the exact tool at point-of-use rather than trusting a remembered signature.

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short, and record status, not raw output. Full protocol: `client-activity-log.md`.
