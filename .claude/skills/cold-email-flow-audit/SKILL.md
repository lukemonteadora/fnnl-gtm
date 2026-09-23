---
name: cold-email-flow-audit
description: Full-chain conformance auditor for ONE cold-outbound client. Re-reads every CURRENT skill, memory, and policy on disk RIGHT NOW and certifies each pipeline stage from /cold-email-kickoff to the ready-to-launch draft against today's standard - flagging any artifact, default, or memory built under a SUPERSEDED skill version as STALE (existence is not conformance). Holds the audit METHOD, never the criteria, so the auditor itself can't go stale. Also reconciles MEMORY against the current skills (skill wins for stale descriptive memory; an operator directive that disagrees is surfaced and flags the SKILL for update, never silently overwritten), then under auto_execute delegates each fix to the owning skill (or /continue-client) and re-verifies, and ARCHIVES every superseded file (never deletes) to profiles/<client>/_archive/. Read-only and free to audit; spends only inside delegated remediation. Stops at the operator's Start. Triggers - "audit <client> end to end", "is <client>'s pipeline conformant", "check <client> against the current flow", "re-certify <client>", "did anything go stale for <client>", "/cold-email-flow-audit". NOT for new-client onboarding (use /cold-email-kickoff), NOT for auditing the skill files themselves for internal contradictions (that is the manual optimization-audit sweep), NOT for folding session learnings into the skill library (use /session-distiller).
---

# Cold Email Flow Audit

**Certify one client's entire cold-outbound pipeline against today's skills, memories, and policies, and fix what drifted.** Point it at a client and it re-reads the current flow on disk, walks every stage from `/cold-email-kickoff` to the ready-to-launch draft, and judges each existing artifact, default, and memory by one question: *does this still conform to what the skill that produced it says today?* Anything built under an older version of a skill is flagged **STALE** and routed for regeneration, the old file is archived, and a conformance report is written.

This is a **certifier that finds drift**, not a driver that pushes to launch. It can run on any client at any time, including ones everyone assumes are "done," because that is exactly where stale artifacts hide.

## The principle that makes this skill trustworthy: METHOD, never CRITERIA

An auditor that hardcodes the rules it checks ("copy must carry the 3-line signature", "min time gap = 15", "per-contact full-body columns") goes stale the moment those rules change, and then it cheerfully certifies artifacts against **yesterday's** standard, becoming the exact bug it hunts.

So this skill file contains the **method** (how to audit a stage), and **never the criteria** (what a stage requires). At runtime it **derives** every checklist by re-reading the current source of truth (the producing skill's `SKILL.md`, the governing memories, and the cross-cutting policy docs) on disk, right now. Any concrete value mentioned anywhere in this file is an **illustration as of writing, not the standard**: trust the re-read source, never this file's examples. If this file and a re-read skill ever disagree, the re-read skill wins, and this file is what's stale.

## How "built under an outdated skill" is detected

Artifacts carry no version stamp, so there is nothing to version-diff. The only tractable signal is **content-conformance**: does the artifact's content satisfy what the current skill requires? (Example: copy whose personalization rung does not match what the current `/campaign-copywriting` requires for that list fails conformance. Read the rung rule off the skill at audit time rather than from this line: as of 2026-09-18 its Hard Rule 34 and its Pre-Written Email Copy Architecture section state different body defaults and the fork is flagged unresolved, which is exactly the kind of criterion this file must never hardcode.) An artifact built under a superseded rung rule is stale regardless of when it was made, and that is the real stale-copy bug this skill exists to catch systematically.

> **Future enhancement (out of scope here, note only):** producing skills could stamp each artifact with `skill-name + date/git-SHA`, making future audits near-instant. Worth doing later; this skill does not depend on it.

## What this skill owns vs delegates

- **Owns:** re-reading the current flow; classifying memory drift direction; the per-stage existence + conformance checks; the adversarial verification of every finding; the conformance report; the archive-after-regenerate cleanup; the activity-log write-after.
- **Delegates (never reimplements):** every actual fix. Regeneration is handed to the owning skill (`/icp-onboarding`, `/offer-intelligence`, `/market-evidence`, `/lead-magnet-brainstorm`, `/offer-test-slate`, `/lead-source-strategy`, `/data-point-discovery`, `/tam-build`, `/campaign-strategy`, `/email-waterfall`, `/list-quality-scorecard`, `/campaign-copywriting`, `/lifecycle-copy`, the platform spintax + upload skills) or to `/continue-client` for the multi-step tail. Remaining-step routing reads from `/cold-email-kickoff` Step 2.1 / Step 6, the single routing table. Proceed-vs-stop, the spend ceiling, the no-re-ask rule, the hard-stop list, and the browser-fallback rule come from `/autonomous-execution-policy`.

## Boundary: what this is NOT

| Skill | Job | Why this is different |
|---|---|---|
| `/continue-client` | Drive a client to a launched, paused draft | Conformance-checks only the *remaining* chain, as a side effect of moving forward. This audit certifies the *whole* chain, including finished stages, with finding drift as the goal itself. |
| `_OPTIMIZATION-AUDIT-*.md` (manual sweep) | One-time check of the **skill files** for internal contradictions | A dated snapshot of the skills. This audits a **client's artifacts/memory** against the skills, and is re-runnable anytime. |
| `/session-distiller` | Fold session learnings **into** the skill library (session → skills) | Opposite direction. This skill reads skills as the source of truth and conforms artifacts/memory **to** them. |
| `anthropic-skills:consolidate-memory` | Generic memory hygiene (merge dupes, prune index) | This is the narrow, scoped case: *a skill changed, so fix the stale memory it left behind, and redo anything built on the old default.* |

## Interaction Policy

Defers to `/autonomous-execution-policy`. Under `run_state.execution_mode = auto_execute` (opt-in per client; the default is `review_gates`), proceed without pausing: run the audit, apply the delegated fixes, and re-verify. Never re-ask a decision already in `run_state`, `client-profile.yaml`, the activity log, memory, or the operator's latest message. Spend runs against the standing budget in `run_state.spend_ceiling_usd` ($100 per client run, never asked, in either execution mode): auto-approve within it. Stop only for the hard stops below. On a long async wait (an enrichment or copy regen), background-poll and interleave other productive work. Never idle.

## Material Decision Rule

When a finding's remediation reaches a material fork (a provider change, spend above the ceiling, a source-of-truth change, a campaign-direction change, a memory edit with cross-client blast radius, or anything client-facing or live-system-affecting), name the realistic options, recommend the strongest, and say why the alternatives are weaker before committing, per the global Decision & Recommendation Style. For low-risk reversible fixes inside the locked plan, state the recommendation and proceed.

## Activity Log Protocol (read-first / write-after)

Read `profiles/<client>/activity-log.md` (its CURRENT STATE block) before auditing. After the audit, append a one-line LOG entry (newest first) and refresh CURRENT STATE with what was certified, what was found stale, what was regenerated/archived, and what remains. Status vocab: CREATED / UPDATED / EXISTS / PENDING / BLOCKED / DONE / CANCELLED / NOTE. Full protocol: `client-activity-log.md`.

## Canonical paths

Resolve every `profiles/<client>/...`, `scripts/...`, `memory/...`, `client-activity-log.md`, `cold-email-copy-best-practices.md`, `verified-list-gate.md`, and `output-style-guide.md` reference under `<outbound>/` (the data home: `outbound/`), per the repo path-resolution rule, not the current working directory. A reference of the form `/<name>` means that skill in `.claude/skills/`. Client profiles are gitignored, so enumerate and read them with the **Bash/Read tools, not Glob/Grep** (Glob is `.gitignore`-filtered and won't see them). The persistent operator memory lives at the user's `~/.claude/projects/.../memory/` directory (`MEMORY.md` index + topic files), outside this repo. Read it there.

## When to use

- Before pressing Start on any client: a final "is this pipeline actually built to today's flow?" certification.
- After a skill-library update that touched the flow: re-certify in-flight clients so nothing carries a superseded artifact forward.
- Periodically, for a long-running client, to catch silent drift.
- When you're unsure whether an artifact, default, or memory is current.
- Operator says "audit <client> end to end", "is <client> conformant", "check <client> against the current flow", "re-certify <client>", "did anything go stale".

## When NOT to use

- **Brand-new client from zero** (no profile, no ICP) → `/cold-email-kickoff`.
- **Auditing the skill files themselves** for internal contradictions → the manual optimization-audit sweep, not this.
- **Folding session learnings into the skill library** → `/session-distiller`.
- **A single status question** with no conformance concern ("is ExampleCo warmed yet?") → just read the activity log and answer.

## What this skill produces

- A per-client report: `profiles/<client>/cold-email-flow-audit-<date>.md`: headline verdict, a **memory-reconciliation** section, a **per-stage conformance table**, a prioritized **remediation** list, an **archived** section, and an "already conforms: leave alone" section. Optionally exported to a Google Doc.
- Under `auto_execute`: the stale stages **regenerated via their owning skills** and re-verified, the superseded files **archived** (not deleted), and stale **descriptive memory corrected** to match the current skills.
- A refreshed activity log (CURRENT STATE + a LOG entry).

## Source-of-truth registry (what to re-read every run)

Re-read these on disk at the start, never audit from memory of how they work:

1. **The chain skills' current `SKILL.md`** for every stage below: `/cold-email-kickoff`, `/icp-onboarding`, `/offer-intelligence`, `/market-evidence`, `/lead-magnet-brainstorm`, `/offer-test-slate`, `/lead-source-strategy`, `/data-point-discovery`, `/social-proof-bank`, `/tam-build`, `/lead-scoring`, `/campaign-strategy`, `/icp-prompt-builder`, `/email-waterfall`, `/list-quality-scorecard`, `/campaign-copywriting`, `/lifecycle-copy`, the locked platform's spintax + upload + inbox-manager skills (plus its reply manager, if `/stack-setup` activated a pack that provides one), and an inbox-setup tracker, if `/stack-setup` activated a pack that provides one (none ships in this workspace).
2. **Cross-cutting policy docs:** `/autonomous-execution-policy`, `/api-cost-governance`, `/ai-model-routing`, `market-evidence-standard.md` (the research evidence standard), `cold-email-copy-best-practices.md`, `verified-list-gate.md`, `output-style-guide.md`, `coldoutbound-gotchas.md`, `spam-word-checker`.
3. **Memory:** the operator `MEMORY.md` index + the relevant HARD-RULE topic files + this client's onboarding memory.
4. **Repo + global `CLAUDE.md`:** the path-resolution rule, the Decision & Recommendation Style, the Communication & Output Style, the client-activity-log protocol.
5. **This client:** `activity-log.md` CURRENT STATE, `client-profile.yaml` (`run_state` + every `run_state.status.*` flag), and only the campaign artifacts the stages below reference.
6. **This client's intel feed:** `client-intel.md`, read in full right after CURRENT STATE (an audit cares about every `affects` tag), and its freshness per `client-intel-feed.md`. Feed items are hypotheses: one that contradicts a locked decision or a built artifact is surfaced in the report and never auto-applied, and under `auto_execute` a conflict touching offer, list, copy or launch stops that stage's remediation and asks. A missing or stale feed is a one-line flag at the top of the report, never a blocker. `/client-intel-sync` runs on demand, so offer `/client-intel-sync <client>` for a fresh pull.

## Two conformance classes, two check mechanisms

The chain mixes files with live infrastructure; they are checked differently:

- **Artifact stages** (a file on disk) → "does this file's content conform to its producing skill today?"
- **Live / infra stages** (platform or mailbox state) → "does the live state match current policy?", judged from **cheap live reads** (list campaigns, read warmup/mailbox status), never by re-running a paid step.

## Read-only and free to audit

Conformance is judged from artifacts already on disk plus cheap live reads. The audit **never** re-runs paid enrichment, re-verifies emails, or re-crawls a TAM just to check. That would make a QA pass cost like a build. Spending happens only inside delegated remediation, and only through the owning skill, gated by `/api-cost-governance` and the spend ceiling.

---

## Flow

### Stage 0: Memory & defaults conformance (run FIRST)

Memory sets the defaults the rest of the audit judges against, so reconcile it before the artifact walk. For each relevant memory (the operator `MEMORY.md` topic files + this client's onboarding memory), compare it against the current skills you re-read, and **classify the direction of drift before editing anything**:

- **Memory is stale (skill is newer):** the skill moved on; the memory still pins an old default, tool, or rule. → **Auto-correct the memory to match the skill** (this is the common case the operator asked for). Rewrite the one-fact file, update the `MEMORY.md` index pointer, keep `[[links]]`, and record it.
- **Skill is stale (memory is newer):** the memory is a `feedback` / `project` entry recording an explicit operator decision the skill hasn't absorbed yet (e.g. a "REVERSES the old default" directive). Here the **memory is the truth** and the skill is behind. → **Do NOT touch the memory.** Surface it to the operator and **flag the SKILL for update** (note it in the report; a `/session-distiller` pass or a manual skill edit is the fix).
- **Ambiguous / genuine conflict:** can't tell which is authoritative → surface to the operator (Material Decision), edit nothing.

**Policy (operator-confirmed): skill wins for stale *descriptive* memory; protect operator directives.** Auto-correct only memory that merely *describes* a skill mechanic that changed. Anything that looks like an operator directive, or whose correction has cross-client blast radius, is **surfaced, not auto-flipped**, because a memory edit is read by every future session and every client, a far larger blast radius than one client's artifact. Never delete a `feedback`/`project` operator directive to make it "match" a skill. That inverts the source of truth.

Write the outcome into the report's **Memory reconciliation** section: each memory checked, drift direction, action taken (corrected / surfaced / left as-is), and blast radius.

### The stage map (the audit spine)

Walk the stages in order. Each row names the **governing source(s) to re-read** and the **kind of check**: the actual pass/fail bar is whatever the re-read source says today (method, not criteria).

**Artifact stages (file-conformance):**

| Stage | Artifact | Re-read to derive the check |
|---|---|---|
| A. Intake / run_state lock | `client-profile.yaml` → `run_state` | `/cold-email-kickoff` (run_state schema: current capability slots + status flags), `/client-intake-form`, and `<outbound>/stack-contract.yaml` (each locked provider value must match the contract; a value with no contract slot behind it, or a slot still empty, is a finding, never something to fill in) |
| A2. Client context sweep and Slack check | `context-sweep.md`, `slack-context.md`, `client-profile.yaml` → `context_sweep` and `client_comms.slack`, `suppression-list.csv`, plus the intel feed `client-intel.md` and its freshness | `client-context-sweep.md` (the mandatory first-step sweep of Slack channels and DMs, email, the calendar, docs and local files, operator directive 2026-09-24) and `client-slack-check.md` (its Slack channel source, operator directive 2026-09-22). A missing `context_sweep` block is `STALE` for every client, whatever `client_comms.slack` says. A core source still `blocked` and not `waived_by_operator`, or a blocklist named in `context-sweep.md` but absent from `suppression-list.csv`, is non-conformant. A `client_comms.slack` record that is missing or reads `not_checked` or `unavailable` is non-conformant for every client, including ones onboarded before the rule. The fix is the sweep itself, delegated to `/continue-client`. The intel feed is part of A2: `client-intel.md` exists and is fresh per `client-intel-feed.md`, or the report flags it at the top (a flag, never a blocker for the other stages); offer `/client-intel-sync <client>` for a fresh pull |
| B. ICP | `client-profile.yaml` → `icp.*` | `/icp-onboarding` |
| B2. Research | `_research/evidence.csv`, `_research/pain-clusters.md`, `client-profile.yaml` → `research_artifacts` and `run_state.status.research_stage` | `/market-evidence` (synthesize), `/offer-intelligence` (Step 0 and discovery), `market-evidence-standard.md` sections 7, 8 and 15. The checks as of writing: (1) the ledger exists and one free local run, `node outbound/scripts/research/evidence_ledger.mjs stats --client <slug> --strict`, exits 0; (2) `pain-clusters.md` exists and carries a dated Research QA verdict (PASS, DEEPEN or HOLD); (3) `research_artifacts` is current, its `stage`, `qa_verdict` and counts matching the ledger and the clusters file and mirrored in `research_stage`, with no section 8 refresh trigger fired since `last_refreshed`. Check (1) alone proves neither (2) nor (3): with a ledger present, the script exits 1 only on citation-integrity failures, and it exits 0 when no clusters file exists. Research that sits only in legacy folders is `STALE` (built before the ledger existed), delegated to `/offer-intelligence` Step 0, which seeds the ledger without moving the files, then `/market-evidence` synthesize (added 2026-09-23) |
| C. Offer + lead magnet | `offer-intelligence.md`, `lead-magnets.md`, `offer.*` lock | `/offer-intelligence`, `/lead-magnet-brainstorm`, offer-architecture rules, `market-evidence-standard.md` section 12 (each offer and arm cites its clusters and evidence, or carries an `unevidenced` or `contrarian` label) |
| C2. Offer test slate | `offer-test-slate.md`, `offer.test_slate`, each offer's `lead_magnet_yes_honored_by` / `lead_magnet_client_ok` | `/offer-test-slate` (slate mode, client approval optional; scale review after the wave) |
| D. Data-point catalog | `data-point-catalog.md` | `/data-point-discovery` (runs on the locked offer; carries obtainability plus the market source landscape, and is one of the files the approval brief reads for background; the brief's source slides come from each campaign's `lead-source-plan.md`) |
| D2. Social proof + trigger bank | `social-proof-bank.md`, `run_state.status.proof_bank_stage` | `/social-proof-bank` (self-gather-first; proof mapped per segment × service line with copy-ready one-liner + a `poke_the_bear` line reserved for the labeled two-line test arm; data-backed triggers reuse canonical `/data-point-discovery` names; genuine raw-fact gaps routed via `/proof-asset-request` bank mode). Its seed set (the offer-fit seed companies) must exist before F builds, per the phase order in `/cold-email-kickoff` Flow order; the rest runs parallel with F |
| F. TAM | `tam/tam.csv`, `tam/contacts.csv`, `run_state.status.tam_stage` | `/tam-build` (broad good/maybe universe; full_enriched gate: mapped, fit-scored and contacts discovered; signal columns optional) |
| F2. Lead scoring | `lead-scoring-rubric.yaml`, `tam/tam.scored.csv`, `tam/contacts.scored.csv`, `tam/lead-scoring-report.md`, `run_state.status.scoring_stage` | `/lead-scoring` (10-point arithmetic, explicit exclusions, P1 to P5 survival, score-version gate) |
| G. Campaign strategy | `campaign-strategy.md`, `run_state.capacity_request` | `/campaign-strategy`, `/cold-email-kickoff` Step 4 |
| H. Campaign plan | `campaign-plan.md` | `/cold-email-kickoff` Step 5 |
| I. Lead source plan | `campaigns/<slug>/lead-source-plan.md` | `/lead-source-strategy` (Lead Source Plan Mode), `/lead-list-tech-stack-research` |
| J. List build + verify | `campaigns/<slug>/leads.scored.csv`, `leads.verified.csv` | `/icp-prompt-builder`, `/lead-scoring` for external lists, `/email-waterfall`, `verified-list-gate.md` |
| K. List QA | scorecard grade | `/list-quality-scorecard` (grade ≥ B gate) |
| L. Copy | `campaigns/<slug>/variants.yaml`, `copy.md` | `/campaign-copywriting`, `cold-email-copy-best-practices.md`, `spam-word-checker`, the copy/signature/personalization-rung/capability-truth memories |
| M. Spintax | rendered spintax | locked platform's spintax skill |
| N. Draft (stored sequence) | the built sequence/leads/senders/schedule | locked platform's upload skill |

> **Stage letters are stable identifiers, not a contiguous count.** A retired stage leaves its letter unused rather than renumbering the ones after it, so a gap is not a missing stage (E is one such gap and is never reused). A new stage takes the letter of the stage it follows plus a number (A2, B2, C2, D2, F2; P7 after P6). Walk the rows that are here.

> **Order is part of conformance, not just existence.** The offer locks at stage C, then the data-point catalog is built against that locked offer at stage D. So a `data-point-catalog.md` that was not produced against the locked offer was built under a superseded order: treat it as **STALE** and re-read `/data-point-discovery` for what the current catalog must contain. Same shape wherever a stage's input is another stage's output. An artifact that predates the input it is supposed to be built from is stale by construction, whatever its content looks like. The offer at C, for one, is built on the Research QA verdict at B2, so an offer locked before any verdict existed is stale by order. Its fix is the B2 remediation first and then evidence lines on the offer (`/lead-magnet-brainstorm`), never a blind rebuild of the offer, its copy or its drafts: the synthesis may simply confirm the locked offer.

> **Retired-step artifacts are STALE by construction.** Source-signal discovery was retired and its questions were absorbed into `/data-point-discovery`. So a `source-signal-intelligence.md` found on disk is an artifact of a step that no longer exists: flag it STALE, archive it, and do not treat it as satisfying any stage. Likewise a `data-point-catalog.md` that predates the absorption (it answers only the data-point question, with no source-landscape content and no `Ranked Source Signals` section) is STALE even though the file exists. Re-read `/data-point-discovery` for what the current catalog must contain, and `/lead-source-strategy` for the per-campaign source plan at stage I. As everywhere else in this skill, those skills hold the criteria; this row only says where to look.

**Live / infra stages (state-conformance, cheap live reads):**

| Stage | Live state | Re-read to derive the check |
|---|---|---|
| P1. Mailboxes | type (GMAIL/OUTLOOK, not SMTP), min time gap, rotation-batch halves, signatures | the inbox manager for the locked sending platform + the min-gap / rotation-batch / sender-identity memories |
| P2. Warmup | maturity for the live-Start gate | locked inbox manager (plus an inbox-setup tracker, if `/stack-setup` activated a pack that provides one (none ships in this workspace)) |
| P3. Client access | per-client client-access entity + mailbox assignment | the locked platform's inbox manager (client-access SOP memory) |
| P4. Pre-launch gates | warmup / placement+auth / final QA / reply readiness (Gates A to D; Gate D is walked as its own stage, P6) | `/cold-email-kickoff` Pre-launch gates, `/email-deliverability-audit` |
| P5. Platform draft | paused draft: senders attached, schedule, settings, signature on new-thread steps | locked platform's upload skill + that platform's API to read live state |
| P6. Reply readiness (Gate D) | per campaign, the reply-machine files in `campaigns/<slug>/` (`interested-reply.md`, `pre-call.md`), the offer's `offer.qualification`, the named speed-to-lead owner and response target, and how interested replies actually reach that owner today | `/cold-email-kickoff` Pre-launch gates (Gate D), `/lifecycle-copy`, and the locked platform's reply manager if `/stack-setup` activated a pack that provides one. Added by the Aaron process alignment (operator directive 2026-09-22) so a client cannot certify conformant with no reply handling: once a draft exists this stage is never `N/A`. Its files and `run_state` fields are on disk, so it is judged from disk even when the sending platform cannot be read |
| P7. Market feedback | When a wave is live: the last `/market-evidence` feedback run, read from `research_artifacts.last_feedback`, the newest dated entry in the Market feedback log of `_research/pain-clusters.md`, and the Market feedback line in `portfolio-review.md` | `/market-evidence` (feedback mode), `/cold-email-weekly-rhythm`, `market-evidence-standard.md` section 14. The check as of writing: while a wave is live, a feedback run is overdue once 14 days pass from the later of the wave's first send and `last_feedback` (null before the first run), and one is due at each arm read; before launch this stage is `N/A`. The fix is a `/market-evidence` feedback run, which writes research and evidence records only, never a campaign, and never pauses sending (added 2026-09-23). Its files and `run_state` fields are on disk, so it is judged from disk even when the sending platform cannot be read; in that case, judge whether a wave is live from `run_state` and the activity log |

Skip only provider-specific branches that do not apply, such as a step belonging to a sending platform other than the locked one. Do not skip the TAM or lead-scoring stages on the governed flow.

### Per-stage procedure

For each applicable stage:

1. **Re-read** the governing source(s) for that stage (from the registry).
2. **Derive** the required-checks list from them, not from this file.
3. **Locate** the artifact / live state (Bash/Read for gitignored profiles; the platform API for live state).
4. **Existence check:** is it actually there and non-empty?
5. **Conformance check:** does its content/state meet today's derived requirements?
6. **Verdict:** `CONFORMS` / `STALE` (built under a superseded flow) / `MISSING` / `DRIFT` (live state diverged from policy) / `N/A` (path doesn't require it), with **evidence**: the specific rule + the artifact location.
7. **Remediation owner:** which skill regenerates it.

### Adversarial pass (before any finding is acted on)

Every `STALE` / `DRIFT` / `MISSING` finding gets a skeptical second read: *"Am I sure the current skill requires this, or am I misreading it? Is the artifact actually non-conforming, or just formatted differently?"* Only findings that survive the second read are reported and remediated. This prevents the audit from ordering an expensive regeneration on a false alarm: the same discipline that produced the optimization-audit's adversarial check.

### Transitive staleness

After Stage 0 corrects a stale memory default, check whether any client artifact was produced **under the old default**. If yes, that artifact is stale **by inheritance** even if it conforms to its own skill in isolation. Route it through the same remediation. (Example: a memory pinned an old default tool; lists were built with it; the corrected default changes the tool → the affected lists are re-evaluated.)

### Remediation (diagnose, then delegate, never reimplement)

Under `auto_execute`, for each surviving `STALE` / `MISSING` finding, in stage order:

1. **Hand the fix to the owning skill** (or `/continue-client` for the multi-step tail). Pass the locked `run_state`, the artifact path, and the specific rule it failed. The owning skill regenerates to today's standard. Honor every gate (verified-list gate, copy-QA gate, spend ceiling) and the no-re-ask rule.
2. **Re-verify** the regenerated artifact with the same conformance check. Confirm it now `CONFORMS` before moving on.
3. **Then archive** the superseded file (next section), only after the replacement verifies.

The copy-architecture / personalization-rung choice in `/campaign-copywriting` is a surfaced, client-facing fork: resolve it per that skill's rule (don't silently default to list-level templating) and record the rationale. Never reimplement a skill's logic here; this skill routes and verifies.

Under `review_gates`, stop after the report and present the prioritized remediation list for the operator to trigger.

### Cleanup: archive superseded files (never delete)

A regenerated stage is only half the fix: a leftover stale file that "looks done" is what causes the next session to reuse it. So:

- **Archive, don't delete.** Move each superseded or orphaned file to `profiles/<client>/_archive/<date>-flow-audit/`, mirroring its original relative path so it is one-step restorable. Match any archive convention already present in the profile rather than inventing a competing one. **Deletion is never automatic**. Purging the archive is a manual operator action.
- **Order is the safety rule.** Archive the old file **only after** its conforming replacement exists and verifies. Never move the old one aside first. A failed regeneration must never leave the client with nothing.
- **What gets archived:** (a) artifacts the audit superseded, and (b) genuine **orphans**: files no current skill produces anymore, left by a removed/renamed step.
- **Orphans are adversarially verified before moving**: confirm no current skill still reads the file (same false-positive discipline as the STALE check; honors the "never sweep the tree" rule). If a file's content contradicts what it's assumed to be, or the agent didn't generate it, **surface it instead of archiving** (harness safety rule).
- **Never archive** a working/source-of-truth file (`client-profile.yaml`, `activity-log.md`) or anything a live draft still references.
- **Live cleanup is not a file move.** A superseded platform draft is handled by the remediation handoff to the platform skill; removing or replacing a live draft is a Material Decision, not a silent sweep.
- **Manifest.** Write `_archive/<date>-flow-audit/MANIFEST.md`: what moved, from where, why (stage + rule failed), and what replaced it. It feeds the report's Archived section and makes restore trivial.

### Report + write-after

Write `profiles/<client>/cold-email-flow-audit-<date>.md`, leading with the point (per `output-style-guide.md`):

- **Headline verdict:** is this pipeline conformant to today's flow? How many stages were stale, fixed, still blocked?
- **Memory reconciliation:** what was corrected, what was surfaced, drift direction, blast radius.
- **Per-stage conformance table:** Stage · Artifact · Exists · Conforms · Verdict · Rule/evidence · Remediation owner.
- **Remediation:** what was regenerated + re-verified (auto_execute), or the prioritized fix-list (review_gates).
- **Archived:** what was moved and why (from the manifest).
- **Already conforms: leave alone.**

Optionally export to a Google Doc (`scripts/docx_to_gdoc.mjs` path, soft-skip if creds absent). Then append the activity-log LOG entry + refresh CURRENT STATE. Commit the session's own scripts/report per the standing commit rule.

---

## Hard stops (never auto-do, from `/autonomous-execution-policy` §3)

- **Starting / sending a live campaign.** The audit certifies; the operator presses Start.
- **Spend above the approved ceiling**, entering financial credentials, or enabling auto-recharge.
- **Changing a locked provider stack / sending platform**, or any source-of-truth change, without surfacing it.
- **Overwriting an operator-directive memory** to match a skill. Surface it and flag the skill instead.
- **Deleting** anything: the audit archives (reversible move) only; deletion is manual.
- **The pre-launch safety gates** (warmup ≥ 2 weeks, placement/auth, final QA, reply readiness under Gate D) and the **verified-list gate**: these block the live send on fail; autonomy never relaxes them.
- **Filling an empty capability slot.** A provider slot the stack contract leaves empty, or a locked value with no contract slot behind it, is reported as a finding and routed to `/stack-setup`. The audit never picks a vendor to close the gap, whatever the execution mode.
- **Irreversible actions; legal / compliance risk; anything in the global safety rules.**

## Safeguards

- **Method, not criteria.** Never hardcode a stage's standard here. Derive every check from the re-read current skill/memory/policy. If this file disagrees with a re-read skill, this file is the stale one.
- **Re-read on disk; existence is not conformance.** The library changes almost daily. An artifact that merely exists is not built to today's standard.
- **Adversarially verify before acting.** No regeneration or archive on a finding that hasn't survived a skeptical second read.
- **Read-only + free to audit.** Never re-run a paid step to check conformance. Spend only inside delegated remediation, gated by `/api-cost-governance`.
- **Archive, never delete; replacement before archive.** Reversible moves only, after the new artifact verifies, with a manifest.
- **Protect operator directives.** Skill wins for stale descriptive memory; a `feedback`/`project` directive that disagrees is surfaced, not overwritten.
- **One routing table.** Delegate fixes to the owning skills / `/continue-client`; route remaining steps from `/cold-email-kickoff` Step 2.1 / Step 6. Don't maintain a competing one.
- **Plugin-twin check.** Confirm each delegated skill resolves to the **repo** copy, not a stale `anthropic-skills:*` marketplace twin (the optimization-audit's #1 risk). Prefer explicit `/<name>` invocation, which `CLAUDE.md` resolves to the local copy.
- **Stop at the paused draft.** Conformant ≠ launched. The operator owns Start.

## Related skills

- `/cold-email-kickoff`: the from-zero orchestrator and the **single source of truth** for the stage chain, resume routing (Step 2.1), and the per-campaign launch pipeline (Step 6) this audit certifies against.
- `/continue-client`: the forward-driver; this audit hands the multi-step regeneration tail to it. (That skill conformance-checks only the remaining chain; this one certifies the whole chain.)
- `/autonomous-execution-policy`: proceed-vs-stop, the spend ceiling, the no-re-ask rule, the hard-stop list, the don't-idle-wait and browser-fallback rules.
- `/session-distiller`: when a finding is "the SKILL is stale, not the artifact/memory," route the skill update here.
- `/api-cost-governance`: gates any spend inside delegated remediation.
- The chain skills (`/icp-onboarding`, `/offer-intelligence`, `/market-evidence`, `/lead-magnet-brainstorm`, `/offer-test-slate`, `/lead-source-strategy`, `/data-point-discovery`, `/social-proof-bank`, `/tam-build`, `/lead-scoring`, `/campaign-strategy`, `/icp-prompt-builder`, `/email-waterfall`, `/list-quality-scorecard`, `/campaign-copywriting`, `/lifecycle-copy`, the platform spintax/upload/inbox-manager skills, and an inbox-setup tracker, if `/stack-setup` activated a pack that provides one (none ships in this workspace)): re-read for their current standard and delegated to for fixes.
- `client-activity-log.md`, `output-style-guide.md`, `verified-list-gate.md`, `cold-email-copy-best-practices.md`, `coldoutbound-gotchas.md`: the protocol + reference docs the audit reads.
