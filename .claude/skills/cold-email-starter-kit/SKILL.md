---
name: cold-email-starter-kit
description: Beginner router for the cold outbound skills. Use when someone wants to learn the full cold email workflow or asks where to start. Routes real client work to the four phase skills, starting with /phase-1-onboarding ("Phase 1 for <client>"), and resumes to /continue-client, never to stale reference docs.
---

# Cold Email Starter Kit

This is the orientation layer, not the operating checklist.

## Before anything else: is the stack set up?

This workspace ships with **no default tech stack**; FNNL's own approved stack is recorded in the contract's `approved_stack` block. Skills are written against capability roles ("the sending platform"), not brand names, and the actual tools live in `<outbound>/stack-contract.yaml`.

**Check that file first.** If the infrastructure and lead-data slots are still `not_chosen` or `held` (a `held` slot has `tool: null` and declares nothing), stop and run **`/stack-setup`**. Client work cannot proceed on an empty contract, and no skill should guess a vendor to get around it.

Once the stack is recorded, run `/preflight-credentials` to confirm the keys resolve.

For real client work after that, a client runs in four phases, each started in a fresh thread (operator decisions 2026-09-24 and 2026-09-28, `outbound/reference/phase-protocol.md`):

1. `/phase-1-onboarding` ("Phase 1 for <client>"): the context sweep, the website scrape, the folder refresh for a returning client, the profile and the ICP.
2. `/phase-2-research-offer` ("Phase 2 for <client>"): the research, the Research QA gate, the Aaron offer call and the offer slate.
3. `/phase-3-list` ("Phase 3 for <client>"): the TAM (filter-first), the Aaron campaign and copy call, and the verified list per campaign.
4. `/phase-4-copy-launch` ("Phase 4 for <client>"): Aaron's copy recorded, the reply machine, and PAUSED drafts. Pressing Start stays the operator's.

Each phase runs hands-free and stops once, at its checkpoint (at most 4 questions), then freezes once the operator approves it. To resume a client, say "continue <client>" (`/continue-client`). To see where every client is, run `python outbound/scripts/phase_state.py board`. `/cold-email-kickoff` is the reference procedure behind the phase skills, not a fifth entry point.

## Canonical Profile Root

All profile paths in this skill resolve under:

```text
<outbound>/profiles
```

When this skill says `profiles/<business-slug>/...`, read or write `<outbound>/profiles/<business-slug>/...`. Here `<outbound>` is the root of this skill library - resolve it to wherever the library is currently checked out (local Documents, OneDrive, or a git worktree); never hardcode an absolute path. Do not create client profiles under a `profiles/` folder at your current working directory.

Do not route users to old numbered legacy docs from earlier versions of this repo. The reusable source of truth is the root skill set in this folder.

## Material Decision Rule

When this skill reaches a material fork, name the realistic options, recommend the strongest path, and explain why the main alternatives are weaker before committing.

Ask before choices that affect spend beyond an approved budget, provider routing, source of truth, list quality, campaign direction, client-facing output, live systems, scraping or account risk, or legal/compliance risk. For low-risk reversible choices, state the recommendation and proceed.

Do not turn untrue, unsafe or non-compliant paths into user-facing options. Offer candidates, ICP segments and test arms are never hidden for effort, capacity or "the client may not want it" reasons: they stay visible with their label and the reason they rank where they do (operator directive 2026-09-22).

When asking the user, use the Claude Desktop native Interactive Inputs / Choice Prompts pattern from /clarification-first: recommended option first, short choices, and Custom answer last when a custom answer is plausible.

## Flow Map (orientation only, the phase skills and `/cold-email-kickoff` are the authority)

This is a high-level map so a newcomer can see the shape of the workflow. It is **not** the operating checklist and is intentionally not detailed: the phase skills own the order and the stops, and `/cold-email-kickoff` holds the exact steps and gates they run. If this map and those skills ever disagree, the skills are correct.

**The shape in one sentence:** Buyer and pain, then the offer, then the list built to fit that offer, then the copy.

0. **Workspace setup, once:** `/stack-setup` (records FNNL's tools + process into the stack contract) then `/preflight-credentials`
1. **Start a client (Phase 1):** `/phase-1-onboarding` (the context sweep, the website scrape, then the profile and ICP; locks that client's run_state from the contract)
2. **Research & offer (Phase 2):** offer intelligence → market evidence and the Research QA gate → the Aaron offer call, recorded by lead-magnet brainstorm (the offer locks here) → offer test slate
   **List & strategy (Phase 3):** data-point discovery → filter-first TAM build → campaign strategy → the Aaron campaign and copy call
3. **Infrastructure:** mailbox-mix-strategy → domain setup → inbox manager → tracker
4. **List:** lead-source plan → approval brief → source build → qualify → email waterfall → list-quality scorecard
5. **Copy (Phase 4):** campaign copywriting records Aaron's copy and runs the rails (with copy-QA gate) → spintax
6. **Launch (Phase 4):** upload as a PAUSED draft → user starts it manually
7. **Ongoing:** weekly rhythm, deliverability checks, positive-reply scoring

For the real sequence with all prerequisites and gates, start Phase 1 for the client (`/phase-1-onboarding`), or resume with `/continue-client`.

## Non-Negotiable Rules

- Lock the client's stack in `run_state` from the contract before business strategy. An empty infrastructure slot or an unkeyed sending platform never holds research, the offer, lists, copy or the paused draft; it blocks only an infrastructure purchase or pressing Start (operator decision 2026-09-22).
- Save the stack in `run_state` and respect it.
- Do not suggest provider paths outside the locked stack.
- Do not ask startup questions about provider keys, purchased domains, or warmup age. Check access and sender readiness only inside the selected execution skill when needed.
- Lock the new front-end offer first, then run `/data-point-discovery` on that locked offer to create `data-point-catalog.md`, before any list work. At offer lock, confirm the stack can actually obtain any buyer signal the offer's relevance depends on (the Signal-Capability Check that `/lead-magnet-brainstorm` owns).
- Do not let a campaign idea into strategy unless its source path has a plausible target-geography fit.
- Do not build a list before `/lead-source-strategy` Lead Source Plan Mode decides what signal the list must prove.
- Do not treat onboarding form offers as locked. Store them under `offer.client_suggested_*`, then run discovery and ranked brainstorm.
- Do not ask about spend at startup. Paid data steps run inside the standing \$100 budget per client run (`run_state.spend_ceiling_usd`); confirm only a purchase that would push the run over it, plus the setup total once before any mailbox infrastructure purchase.
- A tool that is out of balance or down stops its step and asks the operator (`/tool-balance-guard`); never switch to another tool or skip a rung without the operator's recorded approval.
- Generated client files are plain text (Markdown, or CSV, YAML and JSON for scripts); a DOCX, deck, PDF or Google Doc is built only when the operator asks for that file.
- Wait at least 2 weeks after warmup starts before real sending.
- Never upload a campaign from unverified copy or a list below B grade.
- Upload skills create draft or paused campaigns only. The user starts the campaign manually.

## Local Environment

Use `scripts/.env.example` as the template. Real credentials belong in a local `.env` file that is ignored by `.gitignore`.

Never put client passwords, JWTs, domain export payloads, purchased-domain JSON, or mailbox CSVs inside reusable skill docs.

## What To Do Next

For a new client, say "Phase 1 for <client>" (`/phase-1-onboarding`), then start each later phase in a fresh thread. For a client already in flight, say "continue <client>" (`/continue-client`).

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short: record status, not raw output. Full protocol: `client-activity-log.md`.
