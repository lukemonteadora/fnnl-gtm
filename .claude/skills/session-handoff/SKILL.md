---
name: session-handoff
description: Writes a copy-paste "resume from here" block (goal, decisions, files, state, next action) so you can /clear and continue in a fresh window. Triggers include "hand this off", "session handoff", "checkpoint this session", "/session-handoff". NOT for skill lessons (/session-distiller) or client records.
---

# Session Handoff

**From the former description:** Write a structured "resume from here" summary so you can wipe context and pick up cleanly in a fresh window, with nothing important lost. Use right before you /clear a session worth continuing, when the context window is getting heavy and Claude is slowing down or drifting, or when you want to move the work to a fresh window or another model. It produces one copy-pasteable handoff block - goal, locked decisions, what shipped, key files with paths, running state, what's verified vs still assumed, open questions, and the exact next action - then you /clear and paste it back to continue. Other triggers: "summarize so I can clear", "write a resume point", "I'm going to clear context". NOT for folding lessons into skills (that's /session-distiller), NOT for a client's continuity record (that's the activity-log + /continue-client), and NOT a plain recap - this is a forward-looking restart point.

Beat context rot. A long conversation makes Claude measurably worse - slower, more forgetful, more likely to hallucinate - and the drop-off starts well before the window is anywhere near full. More context is not better; the right move on a session worth continuing is to **checkpoint and reset**, not to push a bloated window further.

This skill writes the checkpoint: a single, self-contained handoff block precise enough that pasting it into a clean window resumes the work as if nothing was lost. Then you `/clear` (or open a fresh window / another model) and paste it back.

It is deliberately narrow, and it is NOT the other continuity tools:
- **`/session-distiller`** folds durable lessons into the skill library. This does not touch skills - it just lets *you* keep working.
- **The client activity-log + `/continue-client`** are the durable, on-disk record for a specific client across sessions. This is a lightweight in-the-moment restart point for *any* work (client or not), and it does not replace writing the activity-log entry when the work is client work.

## When to hand off

- Before you `/clear` a session that has more to do.
- When the context is getting heavy and quality is slipping (use `/context` to check - see below).
- When you want to continue on a fresh window or move to a different model (the block is model-portable).
- As a rule of thumb, don't let a working session blow far past roughly a quarter of the window before checkpointing. When in doubt, hand off early - a clean window with a tight handoff beats a full one.

## The handoff block (the output)

Produce exactly this, in fenced text so it copies in one go. Lead with the goal, keep it forward-looking, no spaced em dash. Fill every section from what actually happened in the session - if a section is empty, say "none", don't pad.

```
=== SESSION HANDOFF ===

GOAL / WHERE THIS STARTED
  <the objective in one or two lines - what we set out to do>

DECISIONS LOCKED
  <each settled decision the next window must NOT re-litigate - provider, platform,
   offer, ICP, spend ceiling, naming, approach. One line each.>

WHAT SHIPPED
  <what is actually done and verified this session - with the evidence, not just a claim>

KEY FILES / ARTIFACTS  (exact paths)
  <path - what it is and why it matters>

RUNNING STATE
  <what's mid-flight right now: a background job, a campaign in draft, a pending poll,
   a half-written file. Enough that the next window knows what's in motion.>

VERIFIED vs ASSUMED
  <what's confirmed against ground truth vs what's only assumed / not yet checked.
   Carry over anything /verify-execution has NOT confirmed so it isn't taken as done.>

OPEN QUESTIONS / DEFERRED
  <unresolved forks, things parked for later, anything waiting on the operator>

PICK UP HERE
  <the single concrete next action the fresh window should take first>
=== END HANDOFF ===
```

Then tell Luke: copy the block, `/clear`, paste it back to resume.

## Quality bar

- **Self-contained.** A fresh window has zero memory of this session. Spell out names, paths, IDs, and decisions - never "the file we made" or "the client". If it isn't in the block, it's gone.
- **Forward-looking, not a transcript.** Capture state and the next move, not a blow-by-blow of how we got here.
- **Honest about what's done.** "Shipped" means verified (route through `/verify-execution` before you write something into WHAT SHIPPED). Anything you only *believe* is done goes under VERIFIED vs ASSUMED, not WHAT SHIPPED. A handoff that overstates completion re-creates the exact "claimed done, wasn't" failure in the next window.
- **Carry the locked decisions** so the fresh window doesn't re-ask them (`/autonomous-execution-policy`: never re-litigate a recorded decision).

## Context-hygiene commands worth knowing

These are built-in Claude Code commands - point Luke to them; you can't run them for him:

- **`/context`** - visualizes what's eating the window (system prompt, skills, memory, tool results, free space) and often suggests the biggest reclaim. Run it when a session feels heavy to see *what* to trim. MCP servers mostly load on demand, so they cost little until used.
- **`/clear`** - wipes the conversation and starts fresh. The clean slate this skill's handoff block is designed to survive.
- **`/compact`** - built-in summarize-and-continue. It works, but it's slow and you don't control what it keeps; a deliberate handoff + `/clear` gives a tighter, more reliable restart for sessions that matter.

## Anti-patterns

- A vague block ("continue the campaign work") - useless in a fresh window. Be specific enough to act on cold.
- Listing assumed work as shipped. Keep the VERIFIED vs ASSUMED split honest.
- Using this in place of the client activity-log for client work - write both: the activity-log is the durable record, the handoff is the in-the-moment restart.
- Re-summarizing the whole history instead of capturing state + next action.
