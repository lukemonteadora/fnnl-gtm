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

Decision: _pending review_  (replace with what was decided and why, and name the commit that acted on it)
```

---

## Runs

No runs logged yet.
