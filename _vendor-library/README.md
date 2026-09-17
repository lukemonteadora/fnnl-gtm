# Vendor Library (inactive integrations)

## What this folder is

Complete, previously-working integrations for specific tools, kept **outside** `.claude/skills/` so that **nothing here loads or runs**. Claude Code only loads skills from `.claude/skills/`, so a pack sitting in this folder is inert.

This is what lets the workspace ship with genuinely **no default tech stack** while still not throwing away working code. FNNL Agency has not chosen its tools yet. When it does, `/stack-setup` activates only the packs that match, and the rest stay inert.

## Where these came from (read this before trusting any of it)

These packs were built and proven inside a **different company's** GTM workspace, against **that company's** accounts, plans, and API tiers. They were carried over because the integration logic is real and rebuilding it from zero would be wasteful.

They have **not** been verified against FNNL Agency's accounts. Treat an activated pack as a **working scaffold, not a proven integration**. Account-specific details have been replaced with `<PLACEHOLDER>` style markers, but assumptions about plan tier, rate limits, available endpoints, and workspace structure may still be baked in.

The rule is `/stack-setup`'s capability-truth rule: a pack is `chosen` when activated, and only becomes `live` after a real call against FNNL's own account has succeeded.

## Inventory

### Skills

| Pack | Capability it fills | Skills | Notes |
|---|---|---|---|
| `smartlead` | Sending platform | `smartlead-api`, `smartlead-campaign-upload-public`, `smartlead-inbox-manager`, `smartlead-reply-agent-setup`, `smartlead-slack-reporting`, `smartlead-spintax`, `positive-reply-scoring`, `deliverability-test-public` | The most complete pack here. Campaign upload, inbox management, spintax, reply scoring, and a recurring reporting system. |
| `emailbison` | Sending platform | `emailbison-api`, `emailbison-campaign-manager`, `emailbison-campaign-upload-public`, `emailbison-inbox-manager`, `emailbison-lead-manager`, `emailbison-positive-reply-scoring`, `emailbison-reply-manager`, `emailbison-spintax` | Full alternative sending platform. Self-hosted, so it also needs an instance URL, not just a key. |
| `domain-infra` | Registrar + mailbox provider | `spaceship-primeforge-domain-setup`, `spaceship-zapmail-domain-setup`, `dynadot-primeforge-domain-setup`, `dynadot-zapmail-domain-setup`, `primeforge-domain-setup` | Five registrar/provider **combinations**, not five tools. Activate only the pairing FNNL actually buys on. |
| `a-leads` | Contact discovery + enrichment | `aleads-api` | Was the primary contact layer upstream. Access is account-gated, so confirm FNNL can get an account before planning around it. |
| `discolike` | Company discovery | `disco-like` | Lookalike company discovery from seed companies. Reached via an MCP connector, not a plain API key. |
| `prospeo` | Contact enrichment | `prospeo-full-export`, `prospeo-search-api` | Contact database with a bulk CSV export path. |
| `blitz` | Contact enrichment | `blitz-list-builder` | Domain-to-person enrichment when you already hold the target company domains. |
| `google-maps` | Company discovery | `google-maps-list-builder` | Local/SMB discovery by category and geography. |
| `close-crm` | CRM | `close-crm` | Basic v0.1 scaffold. Was never tested against a live account upstream, and has no reply-to-pipeline sync. |
| `getsales` | Sending platform | `getsales-io` | Basic v0.1 scaffold for multichannel (LinkedIn plus email). Was never tested against a live account upstream, and lacks campaign-build parity. |

### Scripts

| Pack | Contents |
|---|---|
| `smartlead` | REST client, campaign org verify, rotation split, tags, warmup set, undeliverable clean, the Slack reporting system |
| `a-leads` | Self-test plus batch grind helpers |
| `close-crm` | REST client, local MCP server |
| `getsales` | REST client, local MCP server |
| `zapmail` | Domain setup in PowerShell and Python |
| `bettercontact` | Waterfall enrichment client |
| `deliverable` | Email verification client |
| `discolike` | Sampling helper |
| `perplexity` | Research client |

### Other

`revcode-extensions/` holds tool capability descriptors carried over from the upstream workspace. Reference material only.

## How to activate a pack

Normally you do not do this by hand. Run **`/stack-setup`**, which activates the right packs as part of recording FNNL's stack, and updates the credential surface at the same time.

To do it manually:

1. Move the skills: `_vendor-library/skills/<pack>/<skill>` into `.claude/skills/<skill>`.
2. Move the scripts: contents of `_vendor-library/scripts/<pack>/` into `02-skills/coldoutbound-skills/scripts/`.
3. Record the tool in the matching slot of `02-skills/coldoutbound-skills/stack-contract.yaml`, and set that slot's `vendor_pack` to the pack name.
4. Add the credential **names** to `scripts/.env.example` and `scripts/credential-registry.json`. Put real values only in `scripts/.env`, which is gitignored.
5. Search the activated files for `<PLACEHOLDER>` markers and fill them in.
6. Run `/preflight-credentials`, then make one real call before marking the slot `live`.

## Packs are self-contained

Each pack carries everything it needs, including a copy of the shared MCP stdio library where a pack ships an MCP server. That duplication is deliberate: it means a pack can be activated or moved without a broken import, and it means deleting a pack you will never use cannot break a pack you do.

## How to deactivate

Move the skill folders back under `_vendor-library/skills/<pack>/` and clear the slot in `stack-contract.yaml`. Because deactivating is just a move, activation is always reversible.

## What is deliberately not here

Personal and operator-specific skills from the upstream workspace (content publishing, personal briefings, a named person's recurring meeting prep, a specific operator's tracker) were removed outright rather than parked. They are not integrations, so there is nothing for FNNL to activate.
