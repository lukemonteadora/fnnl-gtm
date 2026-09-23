# FNNL Agency GTM System

A cold outbound system for FNNL Agency: skills, scripts, doctrine, and client workflow, built to run inside Claude Code. It handles the whole flow, from onboarding a client through targeting, list building, copy, sending infrastructure, launch, and reporting.

## The one thing to understand first

**The system has no tech stack, and it will not pick one for you.**

Every skill is written against a *job to be done* ("the sending platform", "the tool that finds contact emails"), never a brand name. Which actual tool does each job is recorded in exactly one file:

```
outbound/stack-contract.yaml
```

That file shipped empty. When a skill needs a tool and the slot is blank, the skill stops and sends you to `/stack-setup` rather than guessing.

This is deliberate. A system that quietly assumes a vendor will happily build a campaign on a tool nobody bought.

**FNNL's approved stack (2026-09-22): GetLeads, AI Ark, Prospeo, MillionVerifier, Clay and PlusVibe.** These six are the only tools the system uses, and they govern every future tool choice. The contract's `approved_stack` block maps each to its job and holds the rule: meet every need from the six first, and bring in anything else only with explicit operator approval recorded in that block.

## First run, in order

Each step refuses to guess what the previous one should have established.

| Step | Command | What it does |
|---|---|---|
| 1 | `/stack-setup` | Define FNNL's tools and process. **Everything depends on this.** |
| 2 | `/preflight-credentials` | Confirm the keys for the chosen stack actually resolve. Real keys go in `outbound/scripts/.env`, which is gitignored. |
| 3 | `/cold-email-kickoff` | Onboard the first client, end to end. |
| 4 | `/continue-client` | Resume a client mid-flight. |

Recurring cadence is `/cold-email-weekly-rhythm`. If you would rather browse than follow a checklist, `/cold-email-starter-kit` is the orientation router.

## How a client flows through the system

1. **Intake** (`/client-intake-form`, `/icp-onboarding`, `/client-onboarding-call-summarizer`) captures who they sell to and what they sell. It always starts with the client context sweep (`outbound/reference/client-context-sweep.md`): before any question or research, it reads the client's Slack channels (`outbound/reference/client-slack-check.md`), targeted Slack DMs, email, Drive and shared docs, the calendar, local files and Notion, whichever connectors the session has, so nothing the team already knows gets re-asked and any do-not-contact list goes straight into suppression.
2. **Strategy** (`/lead-source-strategy`, `/offer-intelligence`, `/lead-magnet-brainstorm`, `/offer-test-slate`, `/campaign-strategy`) decides where the list comes from, which offers to test (shown to the client as an offer test plan, approval optional), and which campaigns to run.
3. **List** (`/data-point-discovery`, `/tam-build`, `/lead-scoring`, `/email-waterfall`, `/list-quality-scorecard`) builds the target universe cheaply, scores it, reveals contact details only for leads worth paying for, and gates on quality before anything sends.
4. **Copy** (`/campaign-copywriting`, `/outreach-copywriting`, `/spam-word-checker`, `/social-proof-bank`) writes and QAs the sequences.
5. **Infrastructure** (`/mailbox-mix-strategy`, `/mailbox-pool-staging`, `/mailbox-profile-generator`) stands up domains and mailboxes.
6. **Launch and run** (`/campaign-approval-brief`, the presentation builders, `/cold-email-weekly-rhythm`, `/email-deliverability-audit`) gets client sign-off, ships, and keeps it healthy.

## Folder map

Five directories. The split is by *what reads the file*, not by topic.

| Path | Contents | Who reads it |
|---|---|---|
| `.claude/skills/` | The 60 active skills (56 owned here, plus 4 mirrored persona-consult skills that are edited in Personal GTM System). Edit here; Claude Code loads them live. | Claude, automatically |
| `outbound/` | Everything the skills operate on. | Skills, at runtime |
| `_vendor-library/` | Parked integrations for specific tools. **Nothing loads until `/stack-setup` activates it.** | Nothing, until activated |
| `library/` | Third-party PDFs and DOCX: copywriting courses, prompt packs, spintax samples. | Humans, by hand |
| `client-assets/` | Client deliverables. Local only, gitignored. | You |

Inside `outbound/`:

| Path | Contents |
|---|---|
| `stack-contract.yaml` | **FNNL's tool and process contract. The stack source of truth.** |
| `profiles/<client-slug>/` | Per-client profiles, campaigns, artifacts, activity logs. Gitignored. |
| `scripts/` | Automation scripts, `.env` (gitignored), `credential-registry.json` |
| `memory/` | Skill state files |
| `reference/` | Every doc a skill *reads*: copy doctrine, scoring rubrics, client-facing templates, setup guides |

The line between `library/` and `outbound/reference/` is the useful one. If a skill needs a document at runtime, it belongs in `outbound/reference/`. `library/` is background reading that nothing depends on.

## Ground rules baked into the system

- **Spend is capped, not asked.** Every client run gets a standing $100 budget (operator directive 2026-09-22), and onboarding never asks about spend. Paid data steps inside it run without a confirmation. Anything that would push the run over it stops and asks, and mailbox infrastructure keeps its own purchase approval. Change a client's figure deliberately, never silently.
- **Done means proven.** Skills verify a result against the system that actually holds the truth before reporting success. A tool returning "OK" is not proof the work landed.
- **Cheap filtering before expensive enrichment.** Qualify the company list on free data first. Never pay per record for companies that were never a fit.
- **Recommendations come with the case against them.** Material decisions name the options, recommend one, and say why the alternatives are weaker.

## What is deliberately not here

- **No default tech stack.** The system assumes no vendor. FNNL's own six are recorded in the contract by operator choice, not shipped as a default, and none is proven `live` yet.
- **No clients.** No profiles, lead lists, campaigns, or activity logs.
- **No secrets.** `.env` is gitignored and was never committed. Only `.env.example` ships, and it carries no tool keys.
- **No personal tooling.** Content publishing, personal briefings, and operator-specific trackers from the upstream workspace were removed rather than carried over.

## Provenance

Forked from an upstream cold outbound workspace that ran a different company's stack and clients. Client data, secrets, and lead lists were excluded by the git boundary and never committed. The committed remainder was stripped: vendor integrations moved to `_vendor-library/`, personal skills removed, worked examples genericized, and every hardcoded live resource ID replaced with a placeholder.

The workflow logic, copy doctrine, QA gates, and cost discipline carried over intact. That is the reusable part.

**Treat anything carried over as a well-tested starting point, not verified fact about FNNL's tools.** Confirm on first real call.

## Conventions

`CLAUDE.md` at the repo root is the conventions file every session reads. It covers the no-default-stack rule, how paths resolve, the workspace override of machine-level global settings, the writing style, and the standing rules on decisions, verification, parallel work, and spend. Read it before working in here.
