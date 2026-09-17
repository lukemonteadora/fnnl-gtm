---
name: session-distiller
description: End-of-session skill that distills what a working session taught you and folds it back into your editable skill library (.claude/skills). Reads the session transcript, extracts the proven working path plus the durable dead ends, and proposes precise UPDATES to the right existing skills so the next run of a similar task is faster, in two strictly separated phases (Phase 1 proposes, read-only; Phase 2 applies only after the operator approves). Trigger whenever the operator says things like "distill this session", "capture what we learned", "update my skills from this", "save what we learned", "fold this into the skills", "log what this taught me for next time", or "put the proven steps and dead ends where they belong". Also trigger on a bare invocation with no target ("/session-distiller", "what should I distill", "find a session worth distilling"): it auto-discovers past Claude Code sessions, ranks which are most worth distilling, recommends the best one, and works through them one at a time. NOT for: writing a client activity-log entry, summarizing or recapping a session, answering "what did we learn" as a question, creating a brand-new skill, or tuning a skill's trigger description. Those belong to the activity-log, memory, and skill-creator skills.
---

# Session Distiller

Turn a session that taught you something into durable knowledge already written into the right skill, so the next run of a similar task is faster: the proven path and the known traps are there waiting instead of being rediscovered.

This is a maintenance skill that operates on **your own skill library**, not on client data. It does not touch client profiles, the Activity Log, or any campaign artifact.

**Two ways in:**
- **End-of-session distill**, invoked at the end of a session you just worked in. The target is the current session; start at Phase 1.
- **Cold discovery**, invoked fresh, e.g. a bare `/session-distiller` in a new window with nothing in context to distill. Then your first job is to *find* the session worth distilling: run **Phase 0** to discover, score, and shortlist past Claude Code sessions, recommend the best one, and work through them one at a time.
- **Scheduled / unattended (the auto-author)** is invoked by the weekly author-sweep `/schedule` routine, with no human present at runtime. It auto-picks the top candidate from Phase 0, runs Phase 1, and stops at the proposal, never running Phase 2 unattended. See "Scheduled (unattended) mode: the auto-author" below.

## The one rule that governs everything: two phases, never blended

This skill runs in two strictly separated phases. **Phase 1 is read-only.** It analyses, proposes, and writes nothing except appending unconfirmed items to `LEARNINGS.md`. **Phase 2 applies** the approved diffs to `SKILL.md` files, and only after the operator explicitly approves. Phase 2 never re-analyses, re-interprets, or adds anything that was not in the approved Phase 1 proposal. If you find yourself wanting to "improve" a diff during Phase 2, stop. That idea belongs in a new Phase 1.

The reason for the wall: the value of this skill is that the operator can trust an approval. If apply-time creativity can sneak in unreviewed edits, every approval becomes a leap of faith and the skill is worse than useless.

## Scheduled (unattended) mode: the auto-author

When the weekly author-sweep routine invokes this skill there is no human to choose a session or approve a diff at runtime, so behave like this:

- **Phase 0 auto-picks.** Discover and score un-distilled recent sessions, then take the single top-ranked candidate (at most the top two) instead of presenting a shortlist and waiting. Keep the run bounded; do not try to clear the whole backlog in one unattended pass.
- **Run Phase 1 in full.** The analysis is read-only, and the only writes Phase 1 makes are the append-only `LEARNINGS.md` observations it already logs. Those are safe unattended (append-only, and a second sighting is still required before anything becomes a skill edit).
- **Stop at the Phase 1 output. Never run Phase 2 unattended.** Phase 2 edits `SKILL.md` files, a source-of-truth change and the one thing this skill never does without an explicit human approval. The two-phase wall is enforced harder here, not relaxed: a scheduled run proposes, a human applies.
- **Deliver the proposal to chat.** Post the source statement, the evidence table, the proposed diffs, and any contradiction flags, so they can be approved in a later interactive session (where Phase 2 runs normally).
- **Ledger carefully.** Record the session in the distilled-ledger as "Phase-1 proposed, pending approval", with a pointer to where the proposal was posted, so Phase 0 stops re-discovering it cold but the pending skill edits are not lost. Only flip it to "distilled" once Phase 2 has applied the approved edits.

This is the "auto" in auto-author: the trigger and the proposal are automatic, and the `LEARNINGS.md` log compounds on its own, but writing a skill still waits for a human. It is self-improving with a gate on the source of truth, not a free hand over the rulebook. The `/curator` skill is the janitor that keeps this growth from rotting; this is the author that grows it.

## Where things resolve

- **Editable skills (the only files Phase 2 may write):** `.claude/skills/<name>/SKILL.md` in this repo. That is the single source of truth for every skill here.
- **Plugin skills are READ-ONLY.** Anything under the `anthropic-skills:*` (or any other plugin) namespace cannot be edited from here. If a piece of knowledge belongs to a plugin skill, do not try to edit it. Route it to `LEARNINGS.md` with a one-line pointer ("belongs in plugin skill X; can't edit from repo") so it isn't lost.
- **Inactive vendor packs are NOT the library.** Skills sitting under `_vendor-library/` are inert until `/stack-setup` activates them. Never edit a pack in place from here: if a lesson belongs to an inactive pack, log it with a pointer instead, because the pack may never be activated and an edit there would silently do nothing.
- **The log:** `LEARNINGS.md` at the **repo root** (the top level of this GTM repo, beside `CLAUDE.md`). Resolve it relative to the repo root, never as a hardcoded absolute path. This skill runs across every skill family (coldoutbound, engineering, marketing, anything you edit), so the log lives top-level, domain-neutral and discoverable, not buried under any one skill's data folder. It is deliberately **not** subject to the coldoutbound path-resolution rule. If it doesn't exist yet, create it with a one-line header (`# Learnings: unconfirmed observations from session-distiller. Watch for repeats. Newest first.`, matching the header already in use) and start appending. Newest entries first. Tag each entry with its date and which skill or topic it concerns, since the file mixes domains.
- **The ledger:** `.claude/skills/session-distiller/distilled-ledger.md`, this skill's own state file, recording which sessions have already been distilled so Phase 0 stops re-suggesting them. It is operational state, not a skill being edited, so maintaining it does not violate the "don't create files in a skill's folder" non-goal, which is about *target* skills.

---

# === PHASE 0: SESSION DISCOVERY & TRIAGE (cold-discovery only) ===

Run this only when invoked cold with nothing to distill in context (a bare `/session-distiller`). If you were invoked at the end of a working session, skip straight to Phase 1 on the current session. The goal here is to find *which* past session is worth your effort, and to do it cheaply, without reading whole transcripts.

## 0.1 Enumerate candidates

Call `mcp__ccd_session_mgmt__list_sessions` (limit ~30). Keep sessions that: have this GTM repo as their `cwd`, are not the current session, are not archived, and are **not already in the distilled ledger**. Drop untitled or obviously trivial sessions (quick lookups, short chats), since they rarely hold durable method-level knowledge.

## 0.2 Score each candidate cheaply: do NOT read transcripts yet

For each survivor, locate its `.jsonl` (Phase 1, "Locating the right `.jsonl`") and probe it with `grep`, not a full read. Rank by distill-value:

- **Resolved friction (strongest signal):** count `"is_error":true` results. A session with errors that were then *worked through* to success is gold, because that's where the dead-ends-and-fixes live. A zero-error session taught little; an all-error abandoned session has no working path to capture.
- **Size / length:** a bigger transcript (KB, line count) means more work happened. A 4 MB infra session outranks a 200 KB one.
- **Maps to an editable skill:** does the topic, inferred from the title plus the tool-call names used (grep `"name":"…"`), match a skill you can actually edit under `.claude/skills/*`? Infrastructure, list-building, copywriting and deliverability work map to real skills, so yes. Pure plugin-skill work, work against an inactive vendor pack, or pure conversation is low value, since you can't fold the lesson anywhere.
- **Completed:** did the task finish? A completed task yields a real working path *and* dead ends; an abandoned one yields only dead ends (still worth logging, lower priority).

## 0.3 Present the shortlist and recommend one

Show a ranked table: session title · topic · target skill(s) it would update · why it's high-value (e.g. "real dead ends + completed + maps to `coldoutbound-gotchas`") · rough size. **Name the single best session to distill first and say why.** Then stop and let the operator choose, since they may know a session mattered more than its metrics show. Don't auto-start Phase 1; let them pick.

## 0.4 Work them one at a time

Take the chosen session through Phase 1, then Phase 2, in full. When it's done, **append its sessionId + date + a one-line result to the distilled ledger** so it's never re-suggested. Then return to the shortlist and offer the next one. Never batch: one session, full Phase 1/2, operator approval, ledger entry, then the next. This is the "one by one" loop.

---

# === PHASE 1: DISTILL AND PROPOSE (READ-ONLY) ===

## 1. Get the real session record, then state your source

**What "the session" is, concretely.** Your first instinct is the conversation already in your context. That's fine for a short session, but the sessions worth distilling are the long, hard-won ones, and Claude Code **compacts** those: the early turns where the dead ends and the working path actually happened get summarized away. If you distill from a compacted context, your own evidence rule (step 4) can't be satisfied, everything falls to "unverified → log", and the skill quietly does the opposite of its job on exactly the sessions that matter most. So don't rely on context alone. Go to the raw record:

- **Raw transcripts on disk:** under `C:\Users\admin\.claude\projects\`, in the project folder whose name is this repo's absolute path with the drive colon and every path separator replaced by dashes. One `.jsonl` file per session, holding the full turns with every tool call and output (uncompacted). Don't hardcode that folder name: list the `projects` directory and match the folder to this repo. The **most-recently-modified** `.jsonl` is the current session.
- **Or query them via the session tools:** `mcp__ccd_session_mgmt__list_sessions` to find the right session, `mcp__ccd_session_mgmt__search_session_transcripts` to pull the specific calls and outputs you need as evidence. This also covers the case where the operator asks you to distill a **past** session from a fresh window, since context has nothing then and the transcript is the only source.
- **Locating the right `.jsonl`:** strip the `local_` prefix from the `list_sessions` sessionId to get `<id>.jsonl` (e.g. `local_beb097a0-…` → `beb097a0-….jsonl`) in the projects folder above. That's the first try, but sessions run under a **different cwd** are stored under a different project folder, so if the file isn't there, `grep` the projects tree for a distinctive string from that session (a client name, error text, or domain) or use `search_session_transcripts` to find it. For the current session with no id in hand, take the most-recently-modified `.jsonl`.
- These files are large (often 10-30 MB). **Do not read one end to end.** Use `search_session_transcripts`, or `Grep` over the `.jsonl` for the tool name, error string, or endpoint, to pull just the evidence you cite. Skim the current context first to know what to search for, then confirm against the raw transcript.
- **Secrets live in the raw transcript** (tool-call args carry keys, app passwords, cookies). Apply the step-3 secret scrub on everything you pull from it, on the way in.

**Then state your source plainly:** full raw transcript, partial record, or compacted summary only. This sets the ceiling on your confidence. If you could only get a partial or compacted view, lower confidence across the board and push more items to `LEARNINGS.md` than to skill edits, because a half-seen session is a weak basis for a permanent guardrail. Do not claim a completeness you don't have.

## 2. Reconstruct two things

- **The working path:** the clean A-to-Z steps that actually completed the task, with exact tool names, endpoints, navigation, parameters, and sequence. Strip the fumbling; keep only what a clean second run would do.
- **The failures:** every approach that broke, and what fixed it. You'll classify these in step 6 before any of them is allowed near a skill.

## 3. SECRET SCRUB (hard rule, no exceptions)

Never write a secret into a skill or the log. API keys, bearer tokens, passwords, SMTP/app passwords, session cookies, auth headers, account IDs, and any credential seen in a call get replaced with a placeholder: `<ENRICHMENT_API_KEY>`, `<BEARER_TOKEN>`, `<APP_PASSWORD>`. Record the **shape** of the call so it stays reproducible: the endpoint, which header carries the auth, which params it takes, never the live value. If you're unsure whether a string is a secret, treat it as one and redact it. This is the rule with zero tolerance: a leaked credential in a committed skill file is the one mistake here that's genuinely hard to undo.

## 4. Evidence rule

For every durable fact, dead end, and step you record, cite where in the session it happened: the specific tool call, output, or message. If you can't trace a claim to actual session evidence, you don't get to record it as fact. Anything you're reconstructing from memory rather than a visible record is marked **"unverified"** and routed to the log, never to a skill edit. The evidence table in step 10 is where the operator audits this, so make the citations real.

## 5. The empty-session and failed-task cases

If the session produced no durable knowledge, say so plainly and write nothing. A clean "nothing to distill here" is a valid and useful result. If the task was attempted but never actually succeeded, record only the dead ends and state clearly that **there is no confirmed working path.** Never reverse-engineer a working path from a session that didn't complete; a guessed path written as proven is worse than no path.

## 6. Classify every failure: DURABLE or TRANSIENT

Before a failure can become a dead-end guardrail, decide whether it teaches a real lesson or was just noise. Most "errors" are noise. Apply these tests in order:

- **Retry test (strongest signal).** If the exact same call failed and then succeeded unchanged, it's TRANSIENT. Full stop. Discard it.
- **Self-resolve catch.** If an approach failed and then the **same** approach succeeded later in the session, it's TRANSIENT regardless of what the error text said. This is the most common way a fluke leaks through as a false guardrail (a scary error message that resolved itself), so check for it explicitly every time.
- **Method-vs-environment test.** If it was fixed by changing the **environment** (reload, top up a balance, wait out a rate limit, re-auth, retry), it's TRANSIENT, so discard it. If it was fixed by changing the **method** (different endpoint, parameter, field type, tool, or order), it's DURABLE, so keep it.
- As a fast first guess, treat obvious infrastructure or account-state errors (5xx, "renderer frozen", rate limit, empty balance) as probably transient, then confirm with the tests above, which are the real deciders.
- If you can't confidently classify it, treat it as unconfirmed and route it through step 9, not into a skill.

Only DURABLE failures are eligible to become dead ends in a skill. Transient ones get discarded entirely. They don't even go to the log, because a "watch for repeat" on a network blip is just noise.

## 7. Identify the target skill(s) by matching, not by reading everything

Match the session's topic against your existing skill **descriptions** (the `name` + `description` of each `.claude/skills/*/SKILL.md`). Match first, then open only the one or two skills that genuinely fit. Do not read the whole library every run, because that's slow and it tempts you to force knowledge into a skill just because you happened to open it.

## 8. READ each matched skill in full, then pick an outcome per piece of knowledge

Read the matched skill end to end before proposing any edit to it. You can't slot a fact into a flow you haven't seen, and you can't tell "already covered" from "missing" without reading. For each new piece of knowledge, choose exactly one:

- **ALREADY PRESENT and consistent** → make no edit. Tell the operator it's already covered. (Don't re-add what the skill already says; that's bloat.)
- **ALREADY PRESENT but CONTRADICTED by the session** → do **not** overwrite. Flag it. Show the existing line, the new line, and why the session contradicts it. The operator decides, since the session might be the fluke and the skill might be right. Silently overwriting a battle-tested line with a one-session observation is exactly the failure this skill exists to prevent.
- **NOT PRESENT and fits this skill** → propose an edit slotted into the **correct existing section**, integrated with the surrounding flow, not appended at the end as an orphan. If the knowledge changes a step inside an existing sequence, read the steps around it and patch only that step without breaking the chain.
- **NOT PRESENT and does NOT fit this skill** → don't force it in. Point the operator to a better-fitting skill, or park it in `LEARNINGS.md`. Forcing unrelated knowledge into the nearest skill is how skills rot.

**One extra check before any edit lands: does the knowledge name a specific vendor?** If it is only true for one tool, it must be written as a clearly labelled vendor-specific note, not as a general rule, and it must never imply that tool is part of the stack. The stack lives in `outbound/stack-contract.yaml`. A session using a tool is not a decision to adopt it.

## 9. Confidence routing

- **Confirmed structural facts and confirmed DURABLE dead ends** are eligible for a skill edit via the outcomes in step 8.
- **One-off performance claims, unverified claims, and anything unconfirmed do NOT touch a skill.** Before logging one, **search** `LEARNINGS.md` for a prior matching entry (search it, don't read it end to end).
  - If a match exists, this is the **second sighting**: promote it to confirmed and make it eligible for a skill edit (route it back through step 8). Two independent sightings is the bar for turning an observation into a rule.
  - If no match exists, append it to `LEARNINGS.md` tagged **"unconfirmed, watch for repeat"**, with its evidence citation and the date. One occurrence is never enough to write a permanent rule; the log is how a real pattern earns its way in over time.

## 10. OUTPUT OF PHASE 1: present in this order, then STOP

Present, in exactly this order, then stop and wait for the operator's approval. Do not begin Phase 2 on your own.

a. **The source statement** from step 1.

b. **An EVIDENCE TABLE**, one row per durable claim, so the operator can audit before looking at a single diff:

   | Claim | Type (fact / dead-end / step) | Source in session | Confidence |
   |-------|-------------------------------|-------------------|------------|

c. **The proposed diffs**, one per file, in a format precise enough for Phase 2 to apply **verbatim**, because Phase 2 is forbidden from reinterpreting. For each change give: the **file path**, the **section heading** it lands in, and an exact **OLD → NEW** block (the literal existing text to match, and the literal replacement). For a brand-new line, show the exact anchor line it goes after. If you can't produce an exact OLD string, you haven't read the skill closely enough, so go back to step 8. A loose prose description of a change is not an acceptable diff; it forces Phase 2 to invent, which the phase wall exists to prevent.

d. **Contradiction flags**, called out separately under their own heading so they can't be missed, each showing the existing line, the session line, and why they conflict.

If there are no eligible edits, say so. Present the evidence table and whatever went to the log, and note that nothing reaches a skill this round. That's a complete, valid Phase 1.

---

# === PHASE 2: APPLY (ONLY AFTER EXPLICIT APPROVAL) ===

## 11. Write only what was approved, exactly as proposed

Apply only the diffs the operator approved, exactly as shown in Phase 1. Editing discipline:

- **Sharpen or replace the relevant lines, don't just append.** Folding knowledge into the right place is the whole point; a pile of appendices at the bottom of a skill is what this skill is supposed to prevent.
- **Compress trial-and-error into one line:** `Tried X, failed because Y → use Z.` Keep the lesson, drop the saga.
- **Don't delete the trial-and-error entirely.** Its value is the guardrail. Compress it; don't erase it. A bare "use Z" with no "because the obvious X fails" invites the next session to re-walk the dead end.
- **Keep vendor claims labelled as vendor claims.** A lesson proven against one tool goes in that skill's vendor-specific section, never in the vendor-neutral body, and never phrased as though FNNL has adopted the tool.
- Re-run the **secret scrub** (step 3) on the final text you write. It is the last line of defense before the credential is on disk.
- **No spaced em dashes** in anything you write into a skill. Use a period, a comma, parentheses, or a colon. This repo's style rule applies to the text this skill generates, not just to prose written by hand.

## 12. Do not commit or push

Leave the working tree changed and stop. The operator reviews and commits by hand, because these are edits to the source of truth and a human read before they're version-controlled is the safety margin.

*(v2 note, for when an auto-commit step is added: the secret scrub in step 3 becomes even more critical at that point, and any push must be a separate, explicitly confirmed step, never automatic.)*

---

## Non-goals: the lines this skill does not cross

- Don't write any secret into a skill or the log. Redact every credential.
- Don't blend Phase 1 and Phase 2. Phase 1 writes no skill files.
- Don't record any claim you can't trace to session evidence.
- Don't propose an edit to a skill without reading that skill in full first.
- Don't silently overwrite a contradicted line. Flag it and let the operator decide.
- Don't re-add knowledge the skill already contains.
- Don't force unrelated knowledge into the closest skill.
- Don't record transient or environmental failures as dead ends.
- Don't promote a one-off win into a skill rule on a single occurrence. Second sighting is the bar.
- Don't invent a working path from a session that didn't complete.
- Don't create new files in a skill's folder. Edit the `SKILL.md` body only. (`LEARNINGS.md` and this skill's own `distilled-ledger.md` are the exceptions it may create or append.)
- Don't delete trial-and-error entirely. Compress it into a one-line guardrail.
- Don't edit plugin (`anthropic-skills:*`) skills. They're read-only, so route their lessons to the log.
- Don't edit an inactive pack under `_vendor-library/`, and don't let a session's tool usage turn into a declared stack choice.
