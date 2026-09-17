---
name: curator
description: Scheduled, library-WIDE health pass over your whole agent system (the skill library in .claude/skills AND the operator memory library) that finds rot and fixes it in two tiers. This is the "curator" piece of a Hermes-style self-improving agent (the background maintenance pass that keeps a self-growing skill+memory library from rotting). It surveys the library for cross-skill DUPLICATION / overlap / twins (incl. plugin-twins and per-vendor skill families, where the same workflow exists once per sending platform), ORPHANS nothing references, internal CONTRADICTIONS across skills, STALENESS vs current truth (dead tools, banned providers, superseded defaults), and MEMORY health (the over-budget MEMORY.md index, oversized index lines, duplicate/overlapping topic files, memories that contradict current skills). Holds the METHOD, never the CRITERIA, so the curator can't itself go stale. Two tiers of fix: a NARROW safe/reversible tier (mechanical memory-index hygiene + append-only logs) may AUTO-APPLY behind a snapshot-first safety layer; everything RISKY (editing/merging/deleting/renaming skills, resolving contradictions, rewriting a memory fact, anything client-facing) stays PROPOSE-ONLY and waits for your approval. Runs Phase 1 (read-only scan + ranked report), then Phase 2 (auto-apply safe tier with archive-before-write, propose the rest). Built to run by hand OR by a weekly /schedule routine that posts to chat. Triggers - "run the curator", "curate my library", "audit my skills/memory for rot", "what's gone stale across my skills", "my MEMORY.md is over budget", "find duplicate/overlapping skills", "weekly library health check", "/curator". NOT for: folding one session's learnings into skills (use /session-distiller), certifying one client's pipeline (use /cold-email-flow-audit), driving a client forward (use /continue-client), or writing brand-new skills/clients from scratch.
---

# Curator — keep the skill + memory library healthy as it grows

**Survey your entire agent library, fix the safe janitorial rot on its own, and propose everything riskier for your approval.** Point it at nothing in particular: it re-reads every skill under `.claude/skills/` and every file in your operator memory library, judges the library against itself and against today's truth, and produces one ranked report of what is rotting and how to fix it. Mechanical, reversible hygiene (the safe tier) it can apply itself behind a snapshot-first safety layer. Anything that changes a fact, a skill, or a file's identity (the risky tier) it proposes, and you approve.

This is the **curator** in the Hermes sense: the background maintenance pass that lets a self-growing skill+memory library keep getting sharper instead of bloating and contradicting itself. It is deliberately the *janitor*, not the *author*: it does not write new skills from experience (that is `/session-distiller`). Build the janitor first, because a library that grows without one rots faster than it improves, which is exactly why your `MEMORY.md` index went over its size budget.

## The two principles that make this skill trustworthy

**1. METHOD, never CRITERIA, so the curator can't go stale.** A maintenance skill that hardcodes "what is stale" (a given provider is banned, the min time gap is 15, a given vendor's twin skills are dead) becomes wrong the moment the library moves on, and then it confidently "fixes" the library toward yesterday's standard, becoming the rot it hunts. So this file holds the **method** (how to scan, how to judge, how to propose) and **derives every standard at runtime** by re-reading the current library on disk. Any concrete example below is an illustration as of writing, not the standard. If this file and the re-read library ever disagree, the library wins and this file is what is stale.

**2. The human gate stays exactly where the blast radius is.** One client's artifact affects one client. One shared skill, or one fact in memory, is read by every future session and every client. So the curator does not have a single on/off autonomy switch. It splits its fixes into two tiers (next section). The **risky tier** (anything that changes a fact, a skill, or a file's identity) is always propose-only, in every mode, scheduled or interactive. The **safe tier** (mechanical, reversible index hygiene plus append-only logs) may auto-apply, but only behind the safety layer below. An agent silently rewriting its own shared rules is how a self-improving loop turns self-corrupting, so the gate never moves off the things that carry real risk. Tiering buys you autopilot on the chores without handing the agent a pen over its own rulebook.

## Two tiers of fix

The tier is decided by blast radius and reversibility, not by how confident the scan feels.

**SAFE tier (may auto-apply, behind the safety layer):** mechanical, reversible, identity-preserving hygiene only.
- Trimming an over-long `MEMORY.md` index line back to a one-line pointer, **only when** the full detail is verifiably already in the linked topic file (so the trim is genuinely lossless).
- Removing an exact-duplicate index line (two pointers to the same file with the same meaning).
- Adding a missing index pointer for an orphan topic file that has no entry.
- Appending to the curator's own in-repo logs (the ledger, an archive manifest).

**RISKY tier (always propose-only, even on a scheduled run):** anything that changes a fact, a skill, or a file's identity.
- Editing, merging, deleting, retiring, or renaming any skill.
- Resolving a cross-skill or skill-vs-memory contradiction (that is a source-of-truth decision).
- Rewriting or merging the *content* of a memory topic file (changing a fact, not just a pointer).
- Editing or removing an operator-directive memory, or renaming any memory file (it breaks `[[links]]` and hrefs).
- Anything client-facing, or anything touching a file a live flow depends on.

When in doubt about which tier a fix is in, it is risky. The safe tier is a short, closed list; everything not on it is propose-only.

## The safety layer (mandatory before ANY safe-tier auto-apply)

The safe tier earns its autonomy only by being un-loseable. Before and during every auto-applied edit:

1. **Archive first.** Snapshot the target file (for a memory edit, the whole `MEMORY.md`, plus any topic file you will touch) into `.claude/skills/curator/_archive/<date>/` **before** editing. That archive is in the repo, so it is the reversibility mechanism. Do **not** rely on git for memory files: the operator memory directory is not in any git repo (verified), so the in-repo archive is the only undo.
2. **Surgical edit, never a full overwrite.** Apply each safe edit as a single-line `Edit` (exact old-string to exact new-string), never a whole-file `Write`. The memory index is written concurrently by the auto-memory system; a full-file overwrite can clobber a memory added seconds earlier, and a surgical single-line edit cannot.
3. **Abort to a proposal on any doubt.** Rely on the Edit tool's "file modified since read" guard as the reread check. If the exact old-string is not found (the line changed underneath, or already differs from what the scan saw), do **not** force it and do **not** retry blind. Downgrade that one item to a proposal, report it, and move on.
4. **One verifiable fact per edit.** Only trim an index line after confirming the dropped detail is present in the linked topic file. If you cannot confirm, propose instead of applying.
5. **Log every auto-apply.** Record each safe edit in the ledger with its archive path, so the run is auditable and reversible by hand.

If any of these cannot be satisfied, the edit is not safe-tier this run. Propose it.

## What this skill owns vs delegates

- **Owns:** the library-WIDE scan across both skills and memory; ranking findings by leverage; the adversarial second read on every finding; the single health report; the safe-tier auto-apply behind the safety layer; archiving superseded files; the weekly-run contract that makes it schedulable.
- **Delegates (never reimplements):** the actual *authoring*. A "the skill is stale / a session taught us something new" fix routes to `/session-distiller` (session to skill) or a manual skill edit. A "this client's artifact is stale" fix routes to `/cold-email-flow-audit`. Heavy memory-content merges can route to `anthropic-skills:consolidate-memory`. The curator finds and proposes; the owning skill writes.

## Boundary — what this is NOT (read before building anything near it)

| Skill | Its job | Why the curator is different |
|---|---|---|
| `/session-distiller` | Fold ONE session's proven lessons INTO the matching skill (session to skills) | Session-scoped and *additive*: it grows the library. The curator is library-WIDE and *subtractive/consolidating*: it prunes and reconciles what is already there. Opposite direction, opposite job. |
| `/cold-email-flow-audit` | Certify ONE client's artifacts/memory against the current skills | Client-scoped; explicitly NOT for the skill files themselves. The curator audits the **library** (skills + operator memory), not any client. |
| `_OPTIMIZATION-AUDIT-*.md` (manual sweep) | A dated, one-time, by-hand check of the skill files for internal contradictions | A snapshot that goes stale. The curator is the **repeatable, method-driven, schedulable engine** for that same idea, extended to the memory library. |
| `anthropic-skills:consolidate-memory` | Generic memory hygiene (merge dupes, prune index), memory only, plugin (un-editable here) | The curator is library-aware: it reconciles memory **against the current skills**, enforces the index budget, and unifies memory + skill health in one scheduled pass. It can hand a heavy content merge to that skill. |
| `/continue-client` | Drive a client forward to a paused draft | Moves client work forward. The curator does no client work at all. |

If a proposed fix would have you re-implement any of the above, stop and delegate to it. Duplicating a sibling skill is the first thing the curator should flag *about itself*.

## Interaction policy

Defers to `/autonomous-execution-policy` for the don't-idle-wait / interleave rule and the hard-stop list, with this tiered model layered on top: the **safe tier auto-applies** (behind the safety layer) in any mode; the **risky tier is always proposed**, and Phase 2 acts on it only after explicit per-proposal approval. This is true on a scheduled run too. The skill spends almost nothing (it reads files; any AI judgment call is a small classify gated by `/api-cost-governance`), so the gate here is editorial, not financial.

## Material decision rule

Every risky-tier proposal (merge, retire, rewrite a shared skill or a memory fact) is a material fork by definition. Per the global Decision & Recommendation Style, each one in the report names the realistic options (merge A into B, keep both and cross-link, retire, leave alone), recommends the strongest, and says why the alternatives are weaker, so your approval is informed, not a rubber stamp.

## Canonical paths (where the curator looks)

- **Skill library (editable):** `.claude/skills/<name>/SKILL.md` in this repo, the single source of truth for every skill. Enumerate with `Glob` on `.claude/skills/*/SKILL.md`.
- **Plugin skills (READ-ONLY):** anything under `anthropic-skills:*` or any other plugin namespace **cannot be edited** from the repo. The curator may still *flag* a plugin-twin (a marketplace skill shadowing a repo skill) as a duplication risk, but the fix is "prefer the repo `/<name>`", never an edit to the plugin.
- **Operator memory library (editable, NOT in git):** the persistent auto-memory at `C:\Users\admin\.claude\projects\C--Users-admin-Documents-01---Claude-GTM-System\memory\` (`MEMORY.md` plus the one-fact topic files). This is outside this repo and is what the over-budget warning refers to. It is **not** the coldoutbound skill-state `memory/` folder, and the coldoutbound path-resolution rule does not apply here. Because it is not under git, the in-repo `_archive/` snapshot is its only undo.
- **Governing references** (re-read to judge "stale"): the repo `CLAUDE.md` (incl. the memory-index size limit and format rules), the global `~/.claude/CLAUDE.md`, and whatever HARD-RULE memories or policy skills a finding touches.

## When to use

- On a weekly cadence (the intended default), invoked by a `/schedule` routine, to catch drift before it compounds.
- When `MEMORY.md` warns it is over budget or partially loaded (the acute trigger this skill was built for).
- After a burst of skill edits or a new-skill spree, to check for fresh duplication or contradiction.
- When you suspect two skills overlap, a skill references a dead tool, or a memory contradicts a skill.
- Operator says "run the curator", "curate my library", "what's gone stale", "find duplicate skills", "/curator".

## When NOT to use

- **Fold a session's lessons into a skill** -> `/session-distiller`.
- **Certify a specific client's pipeline** -> `/cold-email-flow-audit`.
- **Drive a client to launch** -> `/continue-client`.
- **Write a brand-new skill or onboard a new client** -> the relevant creator / `/cold-email-kickoff`.

## What this skill produces

- A dated health report: `.claude/skills/curator/curator-report-<date>.md`, with the headline library-health verdict, the ranked findings, the safe-tier edits it applied (with archive paths), and the risky-tier proposals awaiting approval.
- The safe-tier edits, applied behind the safety layer, with every superseded snapshot in `.claude/skills/curator/_archive/<date>/` and a manifest.
- After your approval, the risky-tier fixes you accepted.
- A running ledger line in `.claude/skills/curator/curator-ledger.md` (date, findings, what auto-applied, what was approved, what was deferred or declined), so successive weekly runs don't re-surface a finding you already handled.

---

# === PHASE 1: SCAN & PROPOSE (READ-ONLY) ===

Phase 1 writes nothing except the report and the ledger. It never edits a skill or a memory file.

## 1. Re-read the library as it is right now

Enumerate every `.claude/skills/*/SKILL.md` and read each one's frontmatter `name` + `description` (cheap, and enough to map the territory); open a full `SKILL.md` body only when a finding requires it. List the operator memory directory and read `MEMORY.md` in full plus any topic file a finding touches. Note plugin (`anthropic-skills:*`) skills separately: they are read-only and only eligible to be flagged, never edited.

State your coverage plainly: did you read every skill description, or sample? A partial scan lowers confidence on "orphan" and "no duplicate exists" claims. Never assert library-wide completeness you did not achieve.

## 2. Scan across the rot dimensions

For each dimension, **derive the standard from the re-read library, not from this file.** Findings are candidates only until they survive the adversarial pass in step 3.

- **Duplication / overlap / twins.** Two skills whose descriptions claim the same job (a platform-family pair, or a repo skill shadowed by an `anthropic-skills:*` plugin-twin). Propose: merge, keep-both-with-an-explicit-boundary-table, or retire the weaker. (Risky tier.)
- **Orphans.** A skill or doc nothing references and no current flow invokes. Adversarially confirm nothing reads it before proposing retirement; an orphan is the easiest false positive. (Retiring a skill is risky tier. Adding a missing *index pointer* for an orphan memory topic file is safe tier.)
- **Internal contradictions.** Two skills, or a skill and a HARD-RULE memory, that assert conflicting defaults. Propose which is authoritative and route the loser to its owning skill; never pick silently. (Risky tier.)
- **Staleness vs current truth.** A skill referencing a tool/provider/default the rest of the library has moved off. Classify drift direction as `/cold-email-flow-audit` Stage 0 does: if a **skill is stale vs a newer operator directive in memory**, the memory wins, flag the skill, don't touch the memory. If a **memory merely describes a skill mechanic that changed**, the skill wins, propose the memory correction. (Risky tier: it changes a fact.)
- **Memory index health.** Is `MEMORY.md` over the size limit `CLAUDE.md` sets? Are index lines longer than the one-line cap (detail that belongs in a topic file)? The fix (trim the index line to a pointer, detail kept in the topic file) is **safe tier** when the detail is verifiably already in the topic file. The index must stay loadable; a truncated index silently drops memories from every session.
- **Memory duplication / drift.** Two topic files covering the same fact, or a memory that contradicts the current skills. Merging topic-file *content* is risky tier. Removing an exact-duplicate *index line* is safe tier.

## 3. Adversarial pass — every finding survives a skeptical second read

Before any finding reaches the report, challenge it: am I sure these two skills truly overlap, or do their descriptions just sound similar while their jobs differ? Is this really an orphan, or does some flow reference it by a name I didn't grep? Is this memory actually stale, or is it a deliberate operator directive the skill simply hasn't absorbed? Only findings that survive are reported. This is the same discipline that keeps `/cold-email-flow-audit` from ordering a regeneration on a false alarm; here it keeps the curator from proposing you delete something load-bearing, and (critically) from auto-applying a "safe" trim that is not actually lossless.

## 4. Protect operator directives (the memory safety rule)

The library wins for **stale descriptive** memory (a memory that merely describes a skill mechanic that has since changed). But a `feedback` / `project` memory that records an explicit operator decision (often phrased "REVERSES the old default", "HARD RULE", "operator directive") is the **source of truth even when a skill disagrees**: there, the skill is behind. Never propose overwriting an operator directive to "match" a skill; surface it and propose flagging the *skill* for update instead. Editing an operator-directive memory is always risky tier, never auto-applied.

## 5. Output of Phase 1 — present, then STOP

Write the report and present it leading with the point (per `output-style-guide.md`), in this order, then stop. Phase 2's safe-tier auto-apply runs next; the risky tier waits for approval.

a. **Coverage statement** (step 1).

b. **Headline verdict**: overall library health, and the single most important thing to fix.

c. **Ranked findings table**: one row per surviving finding (Dimension, What, Evidence, Blast radius, **Tier (safe/risky)**, Recommended action, Confidence). Rank by leverage.

d. **Per-finding detail**: for each, the realistic options, the recommended one and why the alternatives are weaker, and (for an apply-able fix) an exact, verbatim change (file path, section, OLD to NEW block) precise enough to apply without reinterpreting.

e. **Operator-directive flags**, surfaced separately so they cannot be missed.

If nothing survives, say so: a clean "library is healthy this week" is a complete, valid Phase 1.

---

# === PHASE 2: APPLY ===

Phase 2 has two halves. The safe-tier half runs on its own (behind the safety layer). The risky-tier half runs only on explicit approval. Neither half re-analyses or adds anything not in the Phase 1 proposal; if you want to improve a fix during apply, that is a new Phase 1.

## 6. Safe-tier auto-apply (behind the safety layer)

For each safe-tier finding, in this order: archive the target file into `_archive/<date>/`, apply the change as a surgical single-line `Edit`, and on any "file modified since read" or missing old-string, abort that item to a proposal (step "safety layer" above governs every step). After applying, re-measure if relevant (for a `MEMORY.md` trim, confirm the file is back under its size budget) and log the edit with its archive path. Never overwrite a whole memory file.

## 7. Risky-tier apply (only after explicit approval)

Apply only the risky-tier proposals you approved, exactly as written in Phase 1.

- **Archive, don't delete.** Move every superseded, merged-away, or retired file to `_archive/<date>/`, mirroring its path, with a `MANIFEST.md` (what moved, from where, why, what replaced it). Deletion is never automatic; purging the archive is a manual operator action.
- **Replacement before archive.** When a merge produces a new combined skill or a corrected memory, verify the replacement reads correctly **before** archiving the old file. A failed apply must never leave the library with a gap.
- **Delegate authoring.** A skill rewrite/merge is handed to its owning skill or `/session-distiller`, not hand-written here.
- **Secret scrub.** If any moved or edited text carries a credential, redact it to a placeholder before it lands, the same zero-tolerance rule as `/session-distiller`.

## 8. Record and commit

- Append the run to `curator-ledger.md`: date, findings, what auto-applied (with archive paths), what was approved, what was deferred or declined.
- The curator's own outputs (report, ledger, archive, and the in-repo memory snapshots) are this session's artifacts; commit + push them per the standing commit rule. A risky-tier *skill* edit is a source-of-truth change, so surface its diff for a human read before pushing; do not bundle it into an unattended push without that read.

---

# === THE WEEKLY-RUN CONTRACT (how a /schedule routine invokes this) ===

The curator runs unattended on a weekly `/schedule` routine (and, once it exists, on the always-on VPS) and delivers to chat, the same read-and-propose, fail-loud shape as `/cold-email-weekly-rhythm`, plus the safe-tier auto-apply:

- **Safe tier applies; risky tier proposes.** A scheduled run executes Phase 1, auto-applies the safe tier behind the safety layer (archiving first), and delivers the report with the risky tier as proposals for the operator to approve in the channel. It never applies a risky-tier change unattended.
- **Fail loud.** If the scan cannot complete (memory dir unreadable, skills folder moved), report the failure rather than passing silently; a curator that quietly does nothing reads as "library is healthy", which is the worst lie it can tell.
- **Deliver where you will see it.** Post the headline verdict, the ranked findings, and what auto-applied to the chosen channel, with the full report linked. Risky-tier approvals come back through the same channel.
- **Idempotent.** Honour `curator-ledger.md`: don't re-surface a finding the operator already declined; do re-surface one that has gotten worse.

---

## Hard stops (never auto-do)

- **No autonomous apply of the RISKY tier.** Risky-tier fixes run only on explicit per-proposal approval, in every mode, scheduled or interactive. This is the load-bearing safety rule of the whole skill.
- **No safe-tier apply without the full safety layer.** If you cannot archive first, edit surgically, and abort-to-proposal on a concurrent change, the edit is not safe this run; propose it.
- **Never overwrite an operator-directive memory** to match a skill; surface it and flag the skill.
- **Never delete**; archive (reversible) only; purging is manual.
- **Never edit a plugin (`anthropic-skills:*`) skill**; flag only.
- **Never retire/merge a skill still referenced by a live flow** without surfacing it as a material decision.
- Anything in the global safety rules and `/autonomous-execution-policy` hard-stop list.

## Safeguards

- **Method, not criteria.** Derive every standard from the re-read library. If this file disagrees with the live library, this file is the stale one.
- **Tiered, never blurred.** Safe tier is a short closed list and auto-applies only behind the safety layer; everything else is risky and waits for approval. When unsure of the tier, it is risky.
- **Archive is the undo for memory.** The operator memory dir is not in git, so snapshot before every memory edit; the in-repo `_archive/` is the only reversibility.
- **Surgical edits, never a full memory overwrite.** The auto-memory system writes `MEMORY.md` concurrently; single-line edits cannot clobber a freshly added memory, a whole-file write can.
- **Adversarially verify before proposing or applying.** No finding reaches the report, and no trim auto-applies, without surviving a skeptical second read, especially orphans and "this is lossless" claims.
- **Protect operator directives.** Library wins for stale descriptive memory; an operator directive that disagrees is surfaced, never overwritten.
- **Don't become the rot.** If the curator ever overlaps a sibling skill, flag itself and delegate. The first library it keeps honest is its own.

## Related skills

- `/session-distiller` — the *author* half of the self-improving loop (session to skills). The curator is the *janitor* half; together they are the Hermes-style loop. When a finding is "the skill is stale", route the rewrite here.
- `/cold-email-flow-audit` — same method-not-criteria and archive-never-delete DNA, scoped to one client's artifacts. The curator borrows its Stage-0 memory-drift-direction logic and applies it library-wide.
- `anthropic-skills:consolidate-memory` — delegate heavy memory-content merges here; the curator adds the library-awareness, the index-budget enforcement, and the scheduling it lacks.
- `/autonomous-execution-policy` — the don't-idle-wait / interleave rule and the hard-stop list (the curator layers its tiered apply on top: safe auto-applies, risky proposes).
- `/api-cost-governance` — gates the small AI classify calls the scan may make.
- `/cold-email-weekly-rhythm` — the model for the read-and-propose, fail-loud weekly scheduled-run contract.
- `/schedule` — wraps the curator into the weekly routine that delivers its report to your channel.
