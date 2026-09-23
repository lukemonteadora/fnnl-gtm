# Client Activity Log: Protocol (read-first / write-after)

**Purpose:** Give every session (Claude Code or Claude Chat, even fresh context) a fast, reliable answer to:
*what was the last thing done, what's still pending, what's blocked, what's complete*, for a single client, across
**all** cold-outbound skill flows (not just email infrastructure).

This is the single source of truth for *status*. Detailed artifacts (e.g. `infra-setup-state.md`, CSVs, profiles) stay
where they are; the activity log is the short, scannable index that points to them.

## The file

One per client: **`profiles/<client>/activity-log.md`**. If it doesn't exist when you start work on a client, create it
from the template below.

## THE TWO RULES (apply to every cold-outbound skill, every session)

1. **READ FIRST.** Before doing anything for a client, open `profiles/<client>/activity-log.md` and read the
   **CURRENT STATE** block (top). That tells you where things stand so you never redo work or lose the thread.
2. **WRITE AFTER.** After any material step (something **newly built, updated, confirmed-already-exists, left pending,
   blocked, completed, or cancelled**), do both:
   - **Append** a one-line entry to the top of the `LOG` section (newest first).
   - **Update** the `CURRENT STATE` block so the snapshot stays true (overwrite it; it's a living summary).

"Material step" = anything you'd want a future session to know: created a resource, changed a status, hit a blocker,
made a decision, finished a workstream. Skip trivia (reading a file, a single search). Keep entries to one line.

## Entry format

```
- [YYYY-MM-DD HH:MM] <AREA> · <ACTION> · <STATUS>: <one-line detail + pointer to artifact/id if any>
```

- **AREA**: the skill or workstream, e.g. `infra`, `icp`, `lead-source`, `offer`, `lead-magnet`, `copy`, `campaign`,
  `list-qa`, `tracker`, `deliverability`.
- **STATUS** (fixed vocab): `CREATED` · `UPDATED` · `EXISTS` (was already there, no action needed) · `PENDING`
  (started, not finished / time-gated) · `BLOCKED` (needs something, say what) · `DONE` (workstream complete) ·
  `CANCELLED` · `NOTE` (decision/observation).
- Keep detail short; link to the detailed file or include the key id/email/url.

## Template (new client)

```markdown
# <Client>: Activity Log

## 📍 CURRENT STATE  (updated <date>)
- **Last action:** <one line>
- **Next action:** <one line>
- **Open blockers:** <one line, or "none">
- **Workstreams:**
  - Infra (domains/mailboxes/sending): <one-line status>
  - ICP / targeting: <status>
  - Lead sources / lists: <status>
  - Offer / lead magnet: <status>
  - Copy / sequences: <status>
  - Campaigns (on the locked sending platform): <status>
- **Key refs:** <profile yaml, infra-setup-state.md, tracker link, workspace ids>

## 📜 LOG  (newest first)
- [YYYY-MM-DD HH:MM] <area> · <action> · <STATUS>: <detail>
```

## Notes

- Newest-first so a fresh session reads the top and immediately knows the latest. No scrolling.
- The log records **status**, not raw data. Don't paste large outputs; point to the artifact instead.
- This protocol is referenced by every cold-outbound skill and by the global rule in `~/.claude/CLAUDE.md`.
- Related: `autonomous-execution-policy.md` (how to proceed), this file (how to remember).
