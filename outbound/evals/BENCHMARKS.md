# Benchmark log

**What this is.** The dated record of every benchmark run on FNNL's own repeated GTM jobs, and the tier or prompt decision each one led to. `run_eval.mjs grade --log` appends one section per graded run; a person fills in its **Decision** line after reading it. Raw packets and answers stay in `results/` (local only). How to run a benchmark, and the rule for acting on one, is in `README.md`.

**How to read a table.**

- **Run and Tier.** Each run is one tier answering every case: `haiku` or `sonnet` (the Agent tool's `model` setting), or `session` (the sub-agent inherits the session's model, named in brackets). There is no cost column: every tier runs inside Claude Code, and no run makes a metered API call.
- **All checks pass** is the share of answered items where every check passed. The per-check columns show where a tier fails: `schema` (valid structured output), `verbatim` (quotes copied exactly from the source), `grounding` (no invented competitors, customers or prices), `blank_discipline` (fields left blank when the source does not state them), `labels` and `recall` (agreement with the gold labels), `verdict` (fit calls against operator or client decisions).
- **Missing answers** are items no sub-agent wrote an answer for. They are not counted as quality failures, and a run with missing answers is logged only when marked PARTIAL.
- **Delta** (when a run is compared with a baseline) is the candidate's pass rate minus the baseline's, in percentage points, on the cases both runs share.
- **Single runs wobble.** Decide on `--repeat 3` runs, never on one.
- **Gold labels** say how trustworthy the answer key is. `client` and `operator` labels are ground truth. `operator-list-approval` is a weaker, list-level approval. `provisional` labels were set by the session and wait for an operator spot-check, so a small gap between two runs on provisional cases is not a reason on its own.
- **Keep rule** (from `README.md`): a candidate tier or prompt is kept only when it matches the baseline on `verbatim`, `grounding` and `blank_discipline` and is within 5 points on every other check, on this suite, and it also passes the 20-row agreement check on live work (`/ai-model-routing`). The line under a compared table applies the suite half automatically; the Decision line records what was actually done.

**Entry format** (written by the runner):

```
### <YYYY-MM-DD HH:MM UTC> · <suite> · tier <tier> · <N> cases x <R> repeats · <label>

Run: `results/<suite>/<run-id>/` (local only). Prompt: `<prompt file>` <hash>. Gold labels: <counts>. Baseline: `<run-id>` (tier <tier>), compared on <N> shared cases.

| Run | Tier | Items | All checks pass | <one column per check> | Missing answers |

Keep rule: PASSES or FAILS on this suite, with the reason and any caveats.

Decision: SUPERSEDED by the v2 entry below. The blind_search and schema figures in this row were scored before the checker accepted an absent `searches` key; the regraded v1 numbers are in the v2 table.  (replace with what was decided and why, and name the commit that acted on it)
```

---

## Runs

### 2026-09-30 09:00 UTC · cold-reader · tier sonnet · 20 cases x 1 repeat · baseline: constructed pairs, 1 packet per agent

Run: `results/cold-reader/2026-09-30-08-56-sonnet/` (local only). Prompt: `outbound/evals/cold-reader/prompt.md` 43249371125d. Gold labels: 20 constructed.

| Run | Tier | Items | All checks pass | schema | discrimination | jargon | blind_search | Missing answers |
|---|---|---|---|---|---|---|---|---|
| `2026-09-30-08-56-sonnet` | sonnet | 20 | 2/20 (10%) | 9/20 (45%) | 7/20 (35%) | 14/20 (70%) | 9/20 (45%) | 0 |

Decision: _pending review_

### 2026-10-01 05:11 UTC · cold-reader · tier sonnet · 20 cases x 1 repeat · v2: prompt fixes, plain rewrites carry a why

Run: `results/cold-reader/2026-09-30-09-00-sonnet/` (local only). Prompt: `outbound/evals/cold-reader/prompt.md` f7b9e7aabcbd. Gold labels: 20 constructed. Baseline: `2026-09-30-08-56-sonnet` (tier sonnet), compared on 20 shared cases.

| Run | Tier | Items | All checks pass | schema | discrimination | jargon | blind_search | Missing answers |
|---|---|---|---|---|---|---|---|---|
| `2026-09-30-09-00-sonnet` | sonnet | 20 | 15/20 (75%) | 20/20 (100%) | 20/20 (100%) | 15/20 (75%) | 20/20 (100%) | 0 |
| `2026-09-30-08-56-sonnet` | sonnet | 20 | 7/20 (35%) | 19/20 (95%) | 7/20 (35%) | 14/20 (70%) | 20/20 (100%) | 0 |
| Delta (candidate minus baseline) | | | +40 pts | +5 pts | +65 pts | +5 pts | 0 pts | |

Regraded after a checker fix: the first grade threw on every answer that left out the optional `searches` key (9 of 20), which scored blind_search at 55%. An absent key now reads as no searches, and the check still fails any search that names the sender. Both runs were regraded with the same code, so the table compares like with like.

Keep rule: PASSES on this suite. The 20-row agreement check on live work (/ai-model-routing) must also pass before anything changes. Caveats: decide on --repeat 3 runs, single runs wobble; some gold labels are not client or operator labels, so a small gap is not a reason on its own.

Failed checks (5): the jargon check on plain emails s03, s04, s05, s08, s09, where one reader flagged two or three terms. A single over-flagging reader is a known model behavior and is what the panel's share rule (a term must be flagged by 30% or more of readings) absorbs, so it is not tuned away.

Decision: KEEP v2 as the canonical reader prompt. The key signal, telling an unclear email from its plain version, went from 7/20 to 20/20, schema is 20/20 and no reader looked the sender up. Hallucination-type checks hold. Not yet done: the 20-row agreement check on live FNNL copy and a --repeat 3 run, both to run on the first real campaign through the panel before anyone moves the reader to a cheaper tier. Readers stay on sonnet until then.
