# Benchmarks for repeated GTM jobs (Claude-native)

**What this is.** A small, permanent benchmark of FNNL's own repeated GTM jobs. It answers one question: **which Claude Code sub-agent tier does THIS job well enough?** Never "which model is best?". A generic leaderboard can't answer the question for our tasks, and it is never a reason on its own. Results inform the tier routing in `/ai-model-routing` and every change to a canonical prompt.

**What it compares.** Under the no-AI-API rule (CLAUDE.md section 7) the only models in this workspace are Claude Code's own, so a run compares exactly two things:

- **Tiers.** The Agent tool's `model` setting picks which Claude model a sub-agent runs on: `haiku`, `sonnet`, or the session's own model when `model` is left out (called `session` here). It is a setting inside Claude Code, not an API call, and needs no key.
- **Prompt versions.** A canonical prompt before and after an edit, on the same tier and the same cases.

Nothing here calls a model API, holds a key, or talks to a third-party service, and there is no cost column: Claude Code usage is not metered API spend in this workspace.

**What it is not.** A production path. Nothing here sends, enriches or writes to a client file. A benchmark result informs a routing or prompt decision; it does not replace the 20-row agreement check on live work that `/ai-model-routing` requires before a tier moves.

## How a run works

A script cannot launch Claude Code sub-agents, so every run has three steps: the runner prepares, the session fans out, the runner grades.

```bash
# 1. Prepare: one packet per case, plus the fan-out plan
node outbound/evals/run_eval.mjs prepare voc-extraction --tier haiku --repeat 3 --label "baseline 2026-10"

# 2. The session launches the sub-agents listed in the plan (see below)

# 3. Grade the answers, optionally against an earlier run, and log the table
node outbound/evals/run_eval.mjs grade voc-extraction <run-id> --compare <baseline-run-id> --log
```

**1. `prepare <suite> --tier <haiku|sonnet|session>`** reads the suite's cases, builds each case's message pair (the canonical prompt as the instruction, the case as the input) through `lib/prompt.js`, and writes a run folder at `results/<suite>/<run-id>/`:

- `packets/<item-id>.json`: what a sub-agent reads. It holds the message pair and the file to write the answer to. It never holds the gold labels.
- `cases.snapshot.json`: the cases as they were at prepare time, gold included. Only `grade` reads it; the sub-agents are told not to open it.
- `MANIFEST.json`: suite, tier, time, the hash of the prompt text each case saw, the case files and their hashes, the case ids and the batch plan.
- `FANOUT.md`: the plan the session follows, also printed to the screen.

Options: `--repeat 3` answers every case three times, each repeat by a different sub-agent (decide on three repeats, because single runs wobble). `--batch-size` sets items per sub-agent (default 5; case texts are long). `--label` names the run in the log. `--tier session` also needs `--session-model <name>`, the model the session is running on, so the log says which model answered. The run id is the UTC time plus the tier, for example `2026-10-02-09-15-haiku`.

**2. The session fans out.** Following `FANOUT.md`, the session launches one Agent-tool sub-agent per batch, with `model: "haiku"` or `model: "sonnet"` on every call (or no `model` for the session tier), up to 10 in one message, per `/personalization-subagent-pattern`: every packet belongs to exactly one agent, and each agent writes one answer file per item to `outputs/<item-id>.txt`. Paste each agent's prompt exactly as written. No hints, no gold, no extra context: the benchmark measures the tier on the canonical prompt alone, the way production hands that prompt to its extraction sub-agents. If an answer is missing afterwards, launch one more sub-agent on the same tier for just those packets. Never write an answer yourself, because that would measure the session instead of the tier.

**3. `grade <suite> <run-id>`** runs the suite's checks over the answers on disk and prints a pass-rate table per check, plus every failed check with its reason. It says at the top when any answer is missing (and exits with code 3), because a partial run must never read as a full one.

- `--compare <baseline-run-id>` grades the earlier run with the same checks, restricted to the cases both runs share, and adds a baseline row, a delta row and the keep-rule line below. The run being graded is the candidate.
- `--log` appends the dated table to `BENCHMARKS.md` with a blank **Decision** line for a person to fill in. It refuses smoke-test runs, and it refuses a run with missing answers unless `--allow-missing` is passed (the entry is then marked PARTIAL).
- `list [<suite>]` shows every run on disk with its tier and how many answers it has.

## The suites

| Suite | Production job it measures | Canonical prompt (production uses the same file) | Cases |
|---|---|---|---|
| `voc-extraction` | Turning a raw review, forum post, call excerpt or reply into evidence-ledger rows (`/offer-intelligence` vectors, `/market-evidence feedback`) | `voc-extraction/prompt.md` | `cases.yaml` (public, committed) + `cases.local.yaml` (call excerpts, replies, gitignored) |
| `competitor-card` | Reading one competitor page into the page-level competitor-card fields (`/offer-intelligence` Vector 1) | `competitor-card/prompt.md` | `cases.yaml` (frozen public page text, committed) |
| `company-fit` | Applying a client's locked `/icp-prompt-builder` prompt to one company row (`/tam-build`, `/icp-prompt-builder` at scale) | the client's own prompt file, read in place from its profile folder | `cases.local.yaml` only (client data, gitignored) |

Each suite folder holds a `suite.yaml` that names its prompt builder, its case files and which check runs under which metric name. The baseline to beat is whatever tier `/ai-model-routing` assigns the job today.

**Every check is deterministic** (`lib/checks.js`). No model grades another. The checks are:

- **schema**: is the answer valid JSON with exactly the expected fields?
- **verbatim**: is every quote a word-for-word span of the source? This is the source-preservation test.
- **grounding**: does every named competitor, customer or price appear in the source? This is the hallucination test.
- **blank_discipline**: does the answer leave a field blank when the source doesn't state it? This is where cheaper tiers invent triggers and personas.
- **labels** and **recall**: does the answer agree with the gold labels and catch the key statements?
- **verdict** (company-fit): does the fit call match an operator or client decision?

## How results change the system

**The keep rule.** It is the same for moving a job to another tier and for changing a canonical prompt. A candidate is kept only when both halves hold:

1. **On its suite**, the candidate **matches** the baseline on `verbatim`, `grounding` and `blank_discipline` (the hallucination checks) and is **within 5 points** on every other check. Decide on `--repeat 3` runs. `grade --compare` prints this half as a PASSES or FAILS line.
2. **On live work**, the candidate passes the 20-row agreement check `/ai-model-routing` requires: it answers 20 rows the session or the operator already answered, and agreement holds.

Record the call in the run's **Decision** line in `BENCHMARKS.md`. For a tier move, then change the route in `/ai-model-routing`. Say in the commit message what the scores did (for example "haiku matched sonnet on verbatim and grounding, recall 91% vs 94%, kept").

**Changing a canonical prompt (the skill-evolution loop).**

1. Commit the current state first, so the old prompt is one `git revert` away.
2. Run the suite on the current prompt: `prepare ... --label "before: <change>"`, fan out, grade.
3. Edit the prompt file.
4. Run it again on the same tier: `prepare ... --label "after: <change>"`, fan out, then `grade <after-run> --compare <before-run> --log`. The table says whether the prompt really changed (it compares the prompt hashes in the two manifests).
5. Keep the change only if it passes the keep rule. A prompt that merely reads more sophisticated is not a keeper.
6. Commit the prompt and its `BENCHMARKS.md` entry together, and say in the commit message what the scores did.

## Cases

**Seed cases from FNNL's own client research, never invented and never borrowed from another workspace.** Use work the pipeline actually processed:

- `voc-extraction`: the raw sources behind real ledger rows (the `source_url` or `raw_ref` capture of rows in `profiles/<slug>/_research/evidence.csv`), plus sources that correctly produced no rows, as negative controls.
- `competitor-card`: competitor pages a Vector 1 pass actually read, with the page text frozen into the case so a rerun tests the model, not a changed website.
- `company-fit`: companies an operator or the client actually ruled on, each pointing at that client's locked prompt (`vars.icp_prompt_file`, relative to `outbound/`).

**Where a case goes.** Public text goes in `cases.yaml`, with authors reduced to roles (never a person's name or email). Anything client-confidential (call excerpts, replies, client notes, and every company-fit case) goes in `cases.local.yaml`, which is gitignored. Both files are picked up by the same `cases*.yaml` pattern. Aim for 10 to 15 cases per suite: this is a smoke alarm, not a research project.

**Case format.** Each file is a YAML list. A case has an `id` (lowercase letters, digits and dashes; if it is left out, one is made from the description), a `description`, and `vars`: the builder's inputs plus a `gold` block. For example:

```yaml
- id: forum-ops-manager-reconciliation
  description: "Forum post: ops manager on hand-reconciling invoices (<client> research, run 2026-10-02)"
  vars:
    client_context: "One line on what the client sells, to whom."
    platform: "forum.example.com (forum post)"
    source_url: "https://forum.example.com/t/1001"
    source_date: "2026-09-01"
    source_author: "Operations manager"
    source_text: |
      The raw text, pasted unchanged.
    gold:
      label_status: provisional
      evidence_type_any: [forum_post]
      source_class_any: [buyer_quote]
      persona_any: ["operations manager"]
      must_blank: [desired_outcome]
      must_fill: [pain, workaround]
      key_quotes: ["a short span the answer must quote"]
      competitors: []
      max_rows: 5
      expect_empty: false
```

The gold fields per suite are the ones `lib/checks.js` reads: for `competitor-card`, `archetype_any`, `pricing_public`, `customers` and `front_end_offer_present`; for `company-fit`, `qualified` and `basis`. Keep gold conservative, so a careful correct answer passes every check. Never put the gold verdict, or a model's earlier fit label, inside a company-fit case's `company` object: that object is handed to the sub-agent as-is.

**Gold labels carry a `label_status`, and only `client` and `operator` labels count as ground truth.** `operator-list-approval` means the company sat in a list the operator launched (a weaker, list-level approval). `provisional` means the session set the label and an operator spot-check is still due: read the case's source text and its `gold` block, then change `label_status` to `operator`. `synthetic` marks the example files only and never counts.

**Example files are smoke tests, not benchmarks.** `voc-extraction/cases.example.yaml` and `competitor-card/cases.example.yaml` hold two hand-written synthetic cases each (a positive case and a negative control). They load only with `prepare --example`, never mix into a real run, and a run on them is never logged. Use them to check the runner after an edit.

**YAML notes.** There is no YAML library in this workspace, so `lib/yaml-lite.js` reads the subset the case files need (maps, lists, `|` and `>` blocks, `[a, b]` lists, quoted strings, comments). Paste long source text into a `|` block. Quote any single-line value that holds `": "`. Anchors, aliases, tags and tab indentation are rejected with a line number rather than guessed.

## Local only

Cases and results never leave this machine. `results/` and every `cases.local.yaml` are gitignored. Never upload, share or paste a case file, a packet or an answer into a shared doc, a Slack channel or a ticket. The only model that reads them is Claude Code's own sub-agents, exactly as with any other client research in this workspace. `BENCHMARKS.md` is committed because it holds only pass-rate tables, run ids and prompt hashes, never case text, so keep client names out of `--label` too.

## Files

```
outbound/evals/
  README.md              this file
  BENCHMARKS.md          dated results and the decision taken on each (appended by grade --log)
  run_eval.mjs           the runner: prepare, grade, list (plain node, no dependencies, never calls a model)
  lib/checks.js          the deterministic checks
  lib/prompt.js          builds each suite's message pair from the canonical prompt file
  lib/yaml-lite.js       the small YAML reader for suite and case files
  <suite>/suite.yaml     prompt builder, case files, and which check runs under which metric
  <suite>/prompt.md      canonical prompt (voc-extraction, competitor-card)
  <suite>/cases.yaml     public cases (committed)
  <suite>/cases.local.yaml   client-confidential cases (gitignored)
  <suite>/cases.example.yaml synthetic smoke-test cases (voc-extraction, competitor-card)
  results/<suite>/<run-id>/  packets, answers, manifest, fan-out plan, grade (gitignored)
```

No suite ships with real cases yet: add them from the first client whose research has run, starting with `voc-extraction`.
