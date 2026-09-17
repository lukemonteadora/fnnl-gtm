# Start Here: FNNL Agency GTM System

This is a cold outbound system that runs inside Claude Code. It handles the whole flow: onboarding a client, working out who to target, building and scoring the list, writing the copy, standing up the sending infrastructure, launching campaigns, and reporting on them.

## The one thing to understand first

**The system has no tech stack yet, and it will not pick one for you.**

Every skill is written against a *job to be done* ("the sending platform", "the tool that finds contact emails"), not a brand name. Which actual tool does each job is recorded in exactly one file:

```
02-skills/coldoutbound-skills/stack-contract.yaml
```

That file ships empty. When a skill needs a tool and the slot is blank, the skill stops and sends you to `/stack-setup` rather than guessing.

This is deliberate. A system that quietly assumes a vendor will happily build a campaign on a tool nobody bought.

## First run, in order

**1. `/stack-setup`**
Walks through FNNL's tools capability by capability, and captures FNNL's own process (onboarding steps, approval gates, reporting cadence, what a client actually receives). Writes it all into the stack contract. Nothing else works properly until this is done.

**2. `/preflight-credentials`**
Checks that the API keys for the tools you just recorded actually resolve. Real keys go in `02-skills/coldoutbound-skills/scripts/.env`, which is gitignored and must never be committed.

**3. `/cold-email-kickoff`**
Onboards your first client end to end.

Later: `/continue-client` picks a client back up mid-flight, and `/cold-email-weekly-rhythm` is the recurring operating cadence.

If you would rather browse than follow a checklist, `/cold-email-starter-kit` explains the full workflow and points at the right skill for each stage.

## How a client flows through the system

1. **Intake** (`/client-intake-form`, `/icp-onboarding`, `/client-onboarding-call-summarizer`) captures who they sell to and what they sell.
2. **Strategy** (`/lead-source-strategy`, `/offer-intelligence`, `/lead-magnet-brainstorm`, `/campaign-strategy`) decides where the list comes from, what the offer is, and which campaigns to run.
3. **List** (`/data-point-discovery`, `/tam-build`, `/lead-scoring`, `/email-waterfall`, `/list-quality-scorecard`) builds the target universe cheaply, scores it, reveals contact details only for the leads worth paying for, and gates on quality before anything sends.
4. **Copy** (`/campaign-copywriting`, `/outreach-copywriting`, `/spam-word-checker`, `/social-proof-bank`) writes and QAs the sequences.
5. **Infrastructure** (`/mailbox-mix-strategy`, `/mailbox-pool-staging`, `/mailbox-profile-generator`) stands up domains and mailboxes.
6. **Launch and run** (`/campaign-approval-brief`, the presentation builders, `/cold-email-weekly-rhythm`, `/email-deliverability-audit`) gets client sign-off, ships, and keeps it healthy.

## Ground rules baked into the system

- **Nothing spends money without asking.** The workspace default is a zero spend ceiling, so every paid call gets confirmed. Raise it deliberately, per client, never silently.
- **Done means proven.** Skills verify a result against the system that actually holds the truth before reporting success. A tool returning "OK" is not proof the work landed.
- **Cheap filtering before expensive enrichment.** Qualify the company list on free data first. Never pay per record for companies that were never a fit.
- **Recommendations come with the case against them.** Material decisions name the options, recommend one, and say why the alternatives are weaker.

## Folder map

| Path | What is in it |
|---|---|
| `.claude/skills/` | The 53 active skills. Edit them here; they load live. |
| `_vendor-library/` | Inactive integrations for specific tools. Nothing loads until `/stack-setup` activates it. |
| `02-skills/coldoutbound-skills/` | The stack contract, client profiles, scripts, reference docs |
| `03-prompts/` | Prompt packs and external reference material |
| `04-playbooks/` | Cold email copywriting guides and spintax examples |
| `05-client-assets/` | Client deliverables. Local only, gitignored. |

## Where the rules live

`CLAUDE.md` at the repo root is the conventions file every session reads. It covers the no-default-stack rule, how paths resolve, the workspace override of machine-level global settings, the writing style, and the standing rules on decisions, verification, parallel work, and spend.

## A note on what carried over

This workspace was forked from an existing cold outbound system that ran a different company's stack and clients. The workflow logic, copy doctrine, QA gates, and cost discipline came across intact, and that is the valuable part. Client data, secrets, and lead lists never came across at all.

Anything carried over is a well-tested starting point, not a verified fact about FNNL's tools. Confirm on first real use.
