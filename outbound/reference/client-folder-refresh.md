# Client folder refresh (re-onboarding cleanup)

**What this is.** When a client we worked with before is onboarded again, their profile folder still holds files from the earlier work, some of them out of date. This step checks every file against what we know now, updates the stale ones, and moves the rest to an archive, so the folder only holds current, confirmable information. Operator decision 2026-09-28: archive (never delete), hands-free, results shown at checkpoint A (Phase 1 auto-approves under the Aaron flow).

Run by `/phase-1-onboarding` and by `/continue-client` when it re-onboards a client. Paths resolve under `outbound/`.

## 1. When it runs

- Only when `profiles/<slug>/` already held files **before this run began** (anything besides what this run's sweep and scrape just wrote). A brand-new client skips it with one log line: `NOTE folder refresh skipped (new client)`.
- **After** the context sweep (`client-context-sweep.md`, including the Slack read in `client-slack-check.md`) and the live website scrape (`client-website-scrape.md`), because those are the current facts old files are compared against. Never before them.
- Once per onboarding run. A rerun on the same day reads the existing `folder-refresh.md` and handles only files changed since.

## 2. Inventory

List every file under `profiles/<slug>/` (Bash or Read; the tree is gitignored, so Glob and Grep cannot see it). Skip `_archive/`, `_research/runs/` raw captures, and the files this run just wrote. For each file record: path, last-modified date, the skill or phase that produced it (from the activity log, a handoff, or its own header), and whether it is protected (section 4).

Large sets (over about 20 files) fan out to sub-agents by folder, each writing its own `%TEMP%` result file, merged by path afterwards (the parallelize rule in CLAUDE.md section 7).

## 3. Label each file

Compare each file's facts against the current sources: this run's `context-sweep.md` and `slack-context.md` (with the `client_comms.slack` block), `website-profile.md`, `client-intel.md`, the activity log's CURRENT STATE, and the skills as they read today (reuse `/cold-email-flow-audit`'s content-conformance method: re-read the producing skill, never a hardcoded checklist).

| Label | Meaning | Action |
|---|---|---|
| **CURRENT** | Still matches the current sources. | Keep as is. |
| **UPDATE** | Mostly sound, but some facts are stale or can no longer be confirmed. | Edit in place: rewrite a stale line from the newer source, and remove a line no current source confirms. Add a short `Refreshed <date>` note at the top listing each change and its source. Never rewrite the whole file from scratch. |
| **SUPERSEDED** | Replaced by newer work, or built under a flow we no longer use (a pre-Aaron offer, a campaign built for a tool outside FNNL's approved stack, an old research format). | Archive (section 5). |
| **UNVERIFIABLE** | Its core claims can't be confirmed by any current source. | Archive and list it for checkpoint A to show the operator. |

Rules for judging:
- "Can't confirm" is not "false". An older fact that no current source mentions, but nothing contradicts, is removed from a working file only when it would steer a decision (ICP, offer, proof, constraint). Background detail may stay with a `(unconfirmed since <date>)` tag.
- A proof fact (a named client, a number, a testimonial) that can't be confirmed is never carried forward as proof. Remove it from the `proof:` block and merge a reconfirm item into the unsent message in `client-asks.md` (`client-messages.md`).
- A constraint the client gave (a vetoed offer, a do-not-contact rule, a compliance limit) is never dropped for being old. Keep it and list it at the checkpoint to reconfirm.
- Where old and new sources conflict, the newer dated source wins in the file, and the conflict is listed at the checkpoint. A locked decision still changes only when the operator confirms it (the same rule the sweep follows).

## 4. Protected files (never moved; edit only as stated)

- `suppression-list.csv`: never edited or archived. Suppression only narrows who is emailed.
- `activity-log.md`: append-only; gets the refresh entry.
- `phases/state.yaml`: written only by `phase_state.py`.
- `client-profile.yaml`: UPDATE only, block by block, never archived. Mode, protocol and budget values in `run_state` are never overwritten.
- Anything tied to a live or drafted campaign on the sending platform, live mailboxes, or the list workbench table (campaign folders with a sending-platform campaign id, lead files already uploaded). Flag drift; don't move.
- Frozen phase handoffs in `phases/`: never edited silently. If new facts contradict one, flag it for reopening per `phase-protocol.md` section 4 and ask at checkpoint A.
- This run's own sweep and scrape outputs.

## 5. Archive, never delete

- Move each SUPERSEDED or UNVERIFIABLE file to `profiles/<slug>/_archive/<YYYY-MM-DD>-folder-refresh/`, mirroring its original relative path so it restores in one step. Match any archive convention already in the profile (for example `/cold-email-flow-audit`'s `<date>-flow-audit/`).
- Before editing an UPDATE file, copy the original into the same archive folder, so every edit is reversible too.
- Write `MANIFEST.md` in that folder: each file, where it came from, its label, why, and what replaced it (if anything).
- Nothing is ever hard-deleted. Purging the archive is a manual operator action.

## 6. Outputs

- `profiles/<slug>/folder-refresh.md`: the date, counts per label, and a table of every file with its label, the reason and the source used. Then the checkpoint items (conflicts, constraints to reconfirm, UNVERIFIABLE files, frozen phases to reopen).
- `client-profile.yaml` block (top level, never inside `run_state`):
  ```yaml
  folder_refresh:
    last_run_at: <ISO date>
    report: folder-refresh.md
    archive_dir: _archive/<date>-folder-refresh/
    counts: {current: N, updated: N, archived: N, protected: N}
    open_items: N
  ```
- One activity-log line: `UPDATED folder refresh: N kept, N updated, N archived (folder-refresh.md)`.

## 7. Verify before calling it done

Re-list the folder and check: every inventoried file is either still present (CURRENT, UPDATE, protected) or present in the archive folder with a MANIFEST line; the counts match; no protected file moved. Report the numbers, not just a verdict.
