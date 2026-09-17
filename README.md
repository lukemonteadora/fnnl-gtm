# FNNL Agency GTM System

A cold outbound system for FNNL Agency: skills, playbooks, scripts, and client workflow, built to run inside Claude Code.

**This workspace ships with no tech stack.** Every skill is written against a capability role ("the sending platform", "the contact enrichment tool"), never a brand name. Which tool fills which role is declared in one place, and that file starts empty.

## Start here

Run these in order. Each one refuses to guess what the previous step should have established.

| Step | Command | What it does |
|---|---|---|
| 1 | `/stack-setup` | Define FNNL's tools and process. **Everything depends on this.** |
| 2 | `/preflight-credentials` | Confirm the keys for the chosen stack actually resolve. |
| 3 | `/cold-email-kickoff` | Onboard the first client. |
| 4 | `/continue-client` | Resume a client mid-flight. |

Not sure where to begin? `/cold-email-starter-kit` is the orientation router.

## How the no-default-stack design works

`02-skills/coldoutbound-skills/stack-contract.yaml` is the single source of truth for FNNL's tools. It has a slot per capability (registrar, mailbox provider, sending platform, company discovery, contact discovery, contact enrichment, email verification, intent signals, AI research, bulk classification, copywriting, web search, web crawl, CRM, reporting, document generation, spreadsheets) plus a section for FNNL's own process overrides.

Every slot ships empty. When a skill needs a tool and the slot is empty, the skill **stops and routes you to `/stack-setup`** instead of assuming a vendor.

Per client, the locked tools live in that client's own `run_state` block, inheriting from the contract.

## Structure

| Path | Contents |
|---|---|
| `.claude/skills/` | The 53 active skills. Single source of truth, loaded live by Claude Code. |
| `_vendor-library/` | **Inactive** integrations for specific tools. Nothing here loads until `/stack-setup` activates it. |
| `02-skills/coldoutbound-skills/` | Skill data: the stack contract, client profiles, scripts, reference docs |
| `00-start-here/` | Orientation docs |
| `03-prompts/` | Prompt packs |
| `04-playbooks/` | Cold email copywriting guides, spintax examples |
| `05-client-assets/` | Client work. Local only, gitignored. |

## What the skills cover

**Setup and strategy:** stack setup, client intake, ICP onboarding, offer intelligence, lead source strategy, lead magnet brainstorm, campaign strategy, experiment design

**List building:** data point discovery, TAM build, lead scoring, email waterfall, list quality scorecard, personalization fan-out

**Copy:** campaign copywriting, outreach copywriting, lifecycle copy, spam word checker, social proof bank, proof asset request

**Infrastructure:** mailbox mix strategy, mailbox pool staging, mailbox profile generator, credential preflight

**Deliverability:** deliverability audit, incident response

**Running campaigns:** weekly rhythm, flow audit, continue client, approval briefs, four client-facing presentation builders

**Working practice:** verify execution, autonomous execution policy, API cost governance, clarification first, roast, consultant, curator, session handoff, session distiller

## What is deliberately not here

- **No default tech stack.** No vendor is assumed, configured, or credentialed.
- **No clients.** No profiles, lead lists, campaigns, or activity logs.
- **No secrets.** `.env` is gitignored and was never committed. Only `.env.example` ships, and it has no tool keys.
- **No personal tooling.** Content publishing, personal briefings, and operator-specific trackers from the upstream workspace were removed rather than carried over.

## Provenance

Forked from an upstream cold outbound workspace that ran a different company's stack and clients. Client data, secrets, and lead lists were excluded by the git boundary (never committed). The committed remainder was stripped: vendor integrations moved to `_vendor-library/`, personal skills removed, worked examples genericized, and every hardcoded live resource ID replaced with a placeholder.

The workflow logic, copy doctrine, QA gates, and cost discipline carried over intact. That is the reusable part.

**Treat anything carried over as a well-tested starting point, not verified fact about FNNL's tools.** Confirm on first real call.

## Conventions

`CLAUDE.md` holds the repo conventions: the no-default-stack rule, path resolution, the workspace override of machine-level global doctrine, communication style, and the standing rules on decisions, verification, and spend. Read it before working in here.
