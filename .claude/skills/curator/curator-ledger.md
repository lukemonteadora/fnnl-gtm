# Curator Ledger

Running state for `/curator` — which runs happened, what was found, and what was approved / applied / deferred / declined. Newest first. The weekly scheduled run reads this to avoid re-surfacing a finding you already declined (and to re-surface one that has since gotten worse).

## 2026-06-22 — first run (manual, built alongside the skill)

- **Coverage:** operator memory library — full read; skill library — description-level skim of all 75 skills (bodies not read this run).
- **Findings:** 5 (full detail in `curator-report-2026-06-22.md`).
- **APPLIED (approved by operator):** Finding 1 — trimmed ~18 over-long `MEMORY.md` index lines back to one-line pointers. `MEMORY.md` 24,379 B → 17,176 B (~7.2 KB headroom under the ~24.4 KB ceiling, up from ~0). All 57 topic files left untouched; lossless for recall. Also added the new `curator-skill` pointer.
- **RESOLVED externally:** Finding 2 — the orphaned `openrouter-evaluation-decision.md` was indexed by the auto-memory system mid-run (now in the index).
- **DEFERRED / not acted on:** Finding 3 (research-routing cluster merge + the "ask-first" file named after superseded behavior) — lower priority, surfaced for a later decision, not auto-done. Findings 4–5 (plugin-twins; `positive-reply-scoring` vs `emailbison-positive-reply-scoring`) — candidates only, need skill-body reads in a full weekly run; Finding 4 is already tracked as "plugin-twin disable pending" in the optimization-audit memory.
- **Next run should:** do the full skill-body audit (Findings 4–5 verification) and re-check the research-routing cluster (Finding 3) if not yet resolved.

## Queued — library-wide style normalization (logged 2026-06-22)

A new operator style rule landed this session: no spaced em dash (the "dash + space" prose clause break) in any artifact (see the `no-spaced-em-dash` memory). It applies going forward. The curator's own files and the ~76 legacy skills still use that prose tic. **Queue a library-wide pass** that rewrites prose clause-break em dashes as periods, commas, or parentheses, while leaving the structured `[Title](file) ...` index-line separators alone (those are structural, and the auto-memory system uses the same separator). This is a curator-class task by definition (a single style rule applied across the whole library), so it belongs in a future run rather than a one-off manual scrub of a few files.
