---
name: market-evidence
description: "Turns collected market research into counted, checked evidence, and keeps it learning after launch. Mode synthesize runs inside /offer-intelligence discovery, after its collection vectors and before /lead-magnet-brainstorm. It ingests the evidence batches into the client's evidence ledger with scripts/research/evidence_ledger.mjs, clusters pains in the buyers' own words, counts sightings honestly, and scores every cluster on the 8-factor opportunity rubric with cited evidence IDs. It then runs the Research QA gate: PASS, DEEPEN (at most two targeted Stage 2 loops) or HOLD. Its outputs are _research/pain-clusters.md and the research_artifacts index. Mode feedback runs from /cold-email-weekly-rhythm at each arm read, and at least every two weeks while a wave is live. It turns human replies, objections, competitor mentions, timing reasons and client call notes into strong-tier evidence rows, re-clusters, adds evidence lines to lead-magnets.md and the offer arms, and writes a dated results review that routes next steps to the owning skills. Triggers: synthesize the research, cluster the pains, run research QA, is the research good enough, update the research from replies, what did the market say, /market-evidence. It never collects research itself (that is /offer-intelligence), never locks an offer, never edits a live campaign, and never moves the offer-validation flip."
---

# Market Evidence

## Canonical Profile Root

All `profiles/<business-slug>` paths in this skill resolve under `<outbound>/profiles`, where `<outbound>` is the root of this skill library wherever it is checked out. Never hardcode an absolute path. The standard this skill enforces is `market-evidence-standard.md` (resolves to `outbound/reference/`). Read it before the first run in a session; this file does not restate its tables.

**Why this skill exists.** Research used to end as a narrative brief: quotes inside prose, counts typed by hand, no check that the evidence was good enough before offers were built, and no route for what prospects said after launch to change the research. This skill is the missing middle. `/offer-intelligence` collects, this skill counts, clusters, scores and checks, and `/lead-magnet-brainstorm` builds offers only from what passed. After launch, this skill turns the market's answers back into evidence. AI compresses the market here; it never invents it.

## Material Decision Rule

When this skill reaches a material fork, name the realistic options, recommend the strongest path, and explain why the main alternatives are weaker before committing. Ask before choices that affect spend beyond the approved budget, provider routing, source of truth, campaign direction, client-facing output or live systems. For low-risk reversible choices, state the recommendation and proceed.

**Nothing is hidden (operator directive 2026-09-22).** Every cluster, including weak, thin or contradicted ones, stays visible with its label, its counts and the reason it ranks where it does. Only content that would be untrue or unsafe to use is dropped, and the drop is stated.

## Interaction Policy

Defers to `/autonomous-execution-policy`. Under `run_state.execution_mode = auto_execute` (the new-client default since 2026-09-24, paired with `review_protocol: phase_checkpoints` so a run stops only at `/cold-email-kickoff`'s four phase checkpoints; `review_gates` is opt-in), proceed without pausing: under plain `auto_execute` (see `phase_checkpoints` below), the Research QA gate runs its bounded deepen loop and then proceeds with labels (below); it is never a silent pause. Under `review_gates`, the verdict rides along with Gate 2 (the offer-step review defined in `/cold-email-kickoff`), where the operator decides on a HOLD. Under `review_protocol: phase_checkpoints`, research is one run: no deepen loop runs on its own. The verdict, the deepen brief and any HOLD reasons go to `/cold-email-kickoff` checkpoint 2, and a loop runs only if the operator picks it there (one targeted loop, then the offer phase). Never re-ask a decision already recorded in `run_state`, the profile, memory or the operator's latest message.

## Activity Log Protocol

Before client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block). After any material step, **append** a one-line entry (newest first) to its LOG and refresh CURRENT STATE, including the Research workstream line. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Full protocol: `client-activity-log.md`.

## When To Run

| Situation | Mode |
|---|---|
| `/offer-intelligence` discovery or validation finished its collection vectors | `synthesize` |
| A deepen loop finished its targeted research | `synthesize` (re-run) |
| "Is the research good enough to build offers?" | `synthesize` (the gate only, if the clusters are current) |
| `/cold-email-weekly-rhythm` reads an arm, or two weeks passed with a wave live | `feedback` |
| The client shares call recordings, call notes or win/loss notes after launch | `feedback` |
| "What did the market say?" / "update the research from replies" | `feedback` |
| After launch, the client intel feed (`profiles/<slug>/client-intel.md`) shows buyer objections, lead-quality feedback or meeting outcomes the client relayed since `last_feedback` | `feedback` |

**Do not use it** to collect new research (route to `/offer-intelligence`), to lock or rewrite an offer (`/lead-magnet-brainstorm`), to call an arm dead or scale a winner (`/cold-email-weekly-rhythm` owns the flip and the reads), or to edit a live campaign.

## Inputs and Outputs

| Reads | Writes |
|---|---|
| `profiles/<slug>/client-profile.yaml` (`research_artifacts:`, `capability_boundary`, `icp_*`, `offer.*`, `run_state`) | `profiles/<slug>/_research/evidence.csv` (only through `evidence_ledger.mjs ingest`) |
| `profiles/<slug>/_research/runs/<run>/batch-*.json` (collection output) | `profiles/<slug>/_research/pain-clusters.md` |
| `profiles/<slug>/_research/evidence.csv`, `pain-clusters.md`, `competitors-and-ads.md`, `market-sample.md` | `client-profile.yaml`: `research_artifacts:` and `run_state.status.research_stage` |
| `profiles/<slug>/offer-intelligence.md`, `lead-magnets.md` | `lead-magnets.md` evidence lines and `offer.validation_arms[].feedback_ids` / `feedback_summary` (feedback mode) |
| The sending platform's reply surface (feedback mode, only once the stack contract's sending-platform slot is `live`), and reply labels in the `reply-scoring-core.md` classes when a reply-scoring pass already ran this cycle | `activity-log.md` |
| `profiles/<slug>/client-intel.md` (feedback mode: the client intel feed, `client-intel-feed.md`) | Nothing: feed items reach `evidence.csv` only through `evidence_ledger.mjs ingest` |

This skill makes no paid call and runs no primary research pass, so it writes no line in `scripts/api-balance-ledger.md`.

---

## Mode: synthesize

### Step 0: Context (never redo research)

Read the activity log, the `research_artifacts:` block, and everything already in `_research/`. Note which clusters exist, when the ledger was last refreshed, and which older research files `/offer-intelligence` Step 0 seeded. If the clusters are current and no new batches exist, skip to Step 5 (the gate) and say so.

### Step 1: Ingest

Ingest every batch file from the current run folder:

```bash
node outbound/scripts/research/evidence_ledger.mjs ingest --client <slug> --in outbound/profiles/<slug>/_research/runs/<run_id> --run <run_id> --json
```

- Exit 0: all rows valid. Exit 2: some rows rejected; fix each rejected row from its source and re-ingest the same folder (already-ingested rows are skipped as duplicates, so re-running is safe). Never hand-edit the CSV to get around a rejection.
- Read the summary: rows ingested, duplicates skipped, syndicated quotes flagged, emails redacted.

### Step 2: Cluster

Group the active, non-hypothesis rows into problem clusters, written in the buyer's words (standard section 5).

- **Who does it.** Up to about 150 rows: the session. Larger ledgers, or several segments: mid-model sub-agents (Agent tool `model: "sonnet"`), one segment or one disjoint row range each, each writing a proposed cluster map to its own file under the run folder. The session merges the maps, resolves overlaps, and writes the final file. Clusters that agents converged on from different rows are merged, not double-listed.
- **Rules.** Cluster by the buyer's problem, not the client's features. Keep cluster IDs stable across runs; never renumber. Put each cluster's IDs on its `evidence:` line and any disagreeing rows on `counterevidence:`. A row may sit in more than one cluster when it genuinely speaks to both. `model_hypothesis` rows never go on an `evidence:` line; list which hypotheses were corroborated or overturned in the Summary instead.
- **Fill each cluster block** from the rows themselves: who feels it, trigger, current workaround, why it fails, consequence, desired outcome, alternatives, objections, buyer language (verbatim, with IDs), confidence, open questions. Leave a field as "not found" rather than infer it.

### Step 3: Count

```bash
node outbound/scripts/research/evidence_ledger.mjs stats --client <slug> --json
```

Paste each cluster's `counts_line` into its **Counts** line. Counts are never typed by hand. Fix every mechanical FAIL (an unknown ID, a hypothesis or competitor claim on an `evidence:` line, a row with no source) before scoring. Report `unassigned_rows` in the Summary: rows no cluster uses are either a missing cluster or noise, and the Summary says which.

### Step 4: Score

Score every cluster on the 8-factor opportunity rubric (standard section 6), in the session (strongest model). Each non-zero score cites evidence IDs, or a profile field for reachability and ability to solve. A score with no citation is 0. Write the **Opportunity scores** table with a notes column holding the citations. The score orders clusters; it removes none.

### Step 5: Research QA gate

Run the 15 checks (standard section 7). Q1-Q4, Q6-Q8 and Q10 come from `stats`. For Q5, send 5 randomly chosen quotes from the top clusters to one small-model sub-agent (`model: "haiku"`) that re-reads each source (WebFetch, the built-in browser pane for a page WebFetch cannot render, or the raw capture for pastes and calls) and reports exact match, paraphrase or not found. The rest are judged against the files. Record each check as PASS, FLAG or FAIL, with a note, in the **Research QA** section.

**Evidence saturation (the stopping rule, added 2026-09-23).** Research stops when more of it would no longer change the decision, not when a source count is reached. Before the verdict, compare the cluster map before and after the newest evidence (the last collection batch, deepen run or feedback run; on a first synthesis, the last fifth of the rows by `evidence_id`) and record one line in the Research QA section:

- **Saturated** when the newest evidence added no new cluster, did not reorder the top three clusters, and changed none of the top clusters' trigger, workaround, desired outcome, objections or alternatives. It only added more sightings of what was already there. Say "saturated: enough evidence to test" and stop collecting. Never deepen to raise a count.
- **Still moving** when any of those changed. The movement itself names the gap for the deepen brief.

Before offers are built, the research must show: independent sources (Q3), more than one source type where the market has them, every major claim tied to evidence IDs, at least one repeated problem pattern, the buyer's context, and a trigger, a current workaround and the alternatives wherever the evidence has them. Uncertainty is marked, not hidden. Most of this is already inside the 15 checks. Saturation adds the question of whether looking harder would change anything. A **deepen brief names a missing thing** (a top cluster with no trigger or workaround, a persona with no first-hand voice, a readable platform the ICP lives on that nobody read, a claim resting on one loud source), never "more sources". No arbitrary quotas: "find 50 forum posts" is not a gap. A platform only an operator paste can reach (Reddit, G2, Quora, LinkedIn posts), or one whose read route is untested (YouTube today), is never a deepen gap: it is a stated coverage gap with a paste reading list (standard section 9).

**Verdict:**

- **PASS**: at least one cluster scores 10 or more out of 16 and passes Q1-Q10. Set `research_stage: qa_pass`. Offer creation may begin, with every cluster carried forward.
- **DEEPEN**: the gaps are fixable with research inside this workspace and the evidence is still moving (saturation above). A saturated ledger with thin clusters gets PASS with low-confidence labels, not another loop. Write a **deepen brief** in the Research QA section: each gap, the cluster it affects, and the vector or read route that fixes it (standard section 9: WebSearch fanned out across sub-agents for URL volume, WebFetch for pages, the built-in browser pane for JavaScript pages and ad libraries, the Hacker News API, the client for call recordings). Platforms only a paste can reach go in the brief's coverage gaps with their paste reading list, not in its gap list. Set `research_stage: qa_deepen` and hand the brief back to `/offer-intelligence` Stage 2 (run folder `deepen-1`, then `deepen-2`), then re-run this mode. **At most two deepen loops.** After the second, the verdict becomes PASS with the weak clusters labelled low confidence, or HOLD. Under `review_protocol: phase_checkpoints` the brief is written the same way but not run: it goes to checkpoint 2 as an option (see Interaction Policy).
- **HOLD**: research cannot fix it (the evidence is all hypotheses, the client cannot solve any cluster, the buyer cannot be reached). Set `research_stage: qa_hold`. Under `review_gates`, show it at Gate 2 and ask how to proceed. Under `review_protocol: phase_checkpoints`, the HOLD reasons lead `/cold-email-kickoff` checkpoint 2 and the operator decides there. Under plain `auto_execute`, proceed to `/lead-magnet-brainstorm` with every cluster labelled low confidence, the HOLD reasons at the top of the report, and a request to the client for the missing evidence (usually call recordings) logged PENDING. Never a silent block, never a silent pass.

### Step 6: Write and record

- `pain-clusters.md`: Summary (every bullet cites cluster IDs), one section per cluster, Opportunity scores, Research QA, the **Language bank** (3 to 8 verbatim phrases per cluster, with IDs), and the Market feedback log (empty until launch).
- `client-profile.yaml`: refresh `research_artifacts:` (`stage`, `qa_verdict`, `qa_date`, `last_refreshed`, `evidence_rows`, `clusters`, `top_clusters`, `files`, `legacy_files`, `coverage_gaps_stated_honestly`, each unread platform with its paste reading list) and mirror `stage` into `run_state.status.research_stage`. Re-parse the YAML after writing.
- Hand the cluster IDs to `/offer-intelligence` so its Intersection step, Pain by persona table and Candidate Generation Input cite them.
- Activity log: one line with the verdict, the top clusters and their counts, and the gaps.

---

## Mode: feedback

### Step 0: Context

Read the activity log, `research_artifacts.last_feedback`, the live campaigns and arms (`offer.validation_arms`, `campaign-strategy.md`), and which cluster and pain angle each arm was built on. Everything since `last_feedback` is in scope.

**Dormant until the sending platform is live.** Read the `sending_platform` slot in `stack-contract.yaml`. Feedback mode has replies to read only once that slot's status is `live` (a real call against FNNL's own account has succeeded) and a wave has sent. While it is `chosen` or unset, say so in one line and stop. Call or win/loss notes the client shares before launch are first-party evidence for `/offer-intelligence`, not feedback.

### Step 1: Pull the replies

Pull human replies since the last run from the sending platform's reply surface. Use the inbox manager for the locked `run_state.sending_platform`, if `/stack-setup` activated a pack that provides one. If no pack is active, use that platform's own reply export or read API directly. If neither exists, say so and ask the operator for a reply export, rather than implying coverage. When a reply-scoring pass already labelled this cycle's replies with the `outbound/reference/reply-scoring-core.md` classes, reuse its labels. Save the raw pull to `_research/runs/<YYYY-MM-DD>-feedback/replies-<date>.json`. Skip out-of-office and automated replies (count them, do not ingest them). Add any call recordings, call notes or win/loss notes the client shared since the last run.

**Client intel feed.** Also read `profiles/<slug>/client-intel.md`: Needs attention and Open items in full, plus every item since `last_feedback` of kind `feedback`, `risk` or `request` tagged `replies`, `meetings`, `icp` or `offer` (buyer objections the client relayed, lead-quality feedback, meeting outcomes). They are candidate evidence. Put them in their own batch file in the `<date>-feedback` run folder, count them apart from the replies, and let them enter `evidence.csv` only through `evidence_ledger.mjs ingest`, typed and tiered by the normal rules (`market-evidence-standard.md` sections 2 and 14). A feed item is never `outbound_reply`, and the sync never writes evidence itself. What the client said is a hypothesis, never an override of a locked decision. A missing feed, or one more than 2 days old (the newer of the client's own refresh stamp, `clients.<slug>.refreshed_at`, and the global `last_run_at` in `profiles/_intel/state.json`; `client-intel-feed.md` section 8), is a one-line flag at the top of the report, not a reason to stop (offer `/client-intel-sync <client>`). Protocol: `client-intel-feed.md`.

The raw pull holds prospect names and emails. It stays in the gitignored run folder and is never pasted into chat, Slack or a client document.

### Step 2: Tag

Tag every human reply with the feedback taxonomy (standard section 14): the reply label (a `reply-scoring-core.md` class), objection, competitor mentioned, timing reason (`trigger`), desired outcome, unexpected use case, question asked. Up to about 50 replies: the session. More: small-model sub-agents (`model: "haiku"`), disjoint reply ranges, one batch file each (`batch-feedback-<n>.json`), each handed the canonical extraction instruction `outbound/evals/voc-extraction/prompt.md` plus this step's reply-specific fields. Each row uses `evidence_type: outbound_reply`, `source_class: outbound_reply`, `source_thread: <sending_platform>:<campaign_id>:<lead_id>` (the tool named in `run_state.sending_platform`), `raw_ref` pointing at the raw pull, `source_author` set to the role (never the name), the reply body without signature or quoted thread as `exact_quote`, and `notes` carrying `reply_label=<label>` plus any question or unexpected use. Call notes become `sales_call` or `interview` rows.

### Step 3: Ingest and re-synthesize

Ingest the feedback batches (Step 1 of synthesize, run folder `<date>-feedback`), then re-run synthesize Steps 2 to 4 on the whole ledger. Replies can strengthen a cluster, contradict it (`counterevidence:`), or form a new one (a repeated objection such as `already_have` is often its own cluster). Re-run the stats; never carry old counts forward.

### Step 4: Tie results to the offers

- Append a dated **Market feedback** line to each tested candidate's Evidence line in `lead-magnets.md`: the reply IDs, and how many were positive, objections (by type) or questions.
- In `client-profile.yaml`, add the reply IDs to that arm's `offer.validation_arms[].feedback_ids` and a one-line `feedback_summary` in the buyer's words. **Never touch an arm's `status`, `read` or `flight`, and never set `offer_market_proven`.** `/cold-email-weekly-rhythm` owns the pooled read and the flip.

### Step 5: Results review (research side)

Add a dated entry at the top of the **Market feedback log** in `pain-clusters.md`:

```markdown
### YYYY-MM-DD · <wave or arm read>
- Evidence added: <n> replies (E-xxxx..E-yyyy), <n> call notes. <n> out-of-office skipped.
- What the market said: <the strongest signals, each with cluster IDs and counts>
- What changed in the research: <clusters strengthened, contradicted, new>
- What it means for the offers: <per arm, in plain words, without calling any arm dead>
- Next tests, routed: <each recommendation and the skill that owns it>
- Not decided here: the offer-validation flip and arm reads (/cold-email-weekly-rhythm).
```

**Routing rules for recommendations:**

| What the feedback shows | Route to |
|---|---|
| A top cluster contradicted by 3 or more replies, `already_have` on one arm 3 or more times, or `confusion` 3 or more times (the offer is not concrete, Aaron diagnostic item 1) | `/offer-intelligence` validation mode |
| A new or strengthened cluster with no offer built on it | `/lead-magnet-brainstorm` (a new candidate) |
| A persona, industry or company type replying well outside the ICP, or `wrong_person` repeatedly | `/icp-onboarding` assumptions, then `/campaign-strategy` |
| Buyer language that beats the copy's wording | `/campaign-copywriting` (next wave's copy) |
| An unexpected use case with 2 or more sightings | `/offer-intelligence` (research it) and `/lead-magnet-brainstorm` |

### Step 6: Record

Refresh `research_artifacts:` (`evidence_rows`, `clusters`, `top_clusters`, `last_feedback`) and the activity log (one line: replies ingested, what changed, what was routed where).

---

## Model Routing Inside This Skill

Per `/ai-model-routing`, on Claude Code's own model tiers only (the Agent tool's `model` setting): no helper, no third-party AI and no API call (the no-AI-API rule). Small-model sub-agents (`model: "haiku"`) tag replies, extract fields and spot-check quotes. Mid-model sub-agents (`model: "sonnet"`) propose cluster maps for large or multi-segment ledgers. The session's strongest model merges clusters, scores, runs the verdict and writes the results review. Parallel sub-agents always get disjoint inputs and their own output files, and the merge is checked for convergent duplicates (`/personalization-subagent-pattern`). Extraction and tagging sub-agents get `outbound/evals/voc-extraction/prompt.md` as their instruction. Any edit to that prompt goes through the before-and-after loop in `outbound/evals/README.md`, and a tier change for this job follows `/ai-model-routing`.

## Hard Rules

- **Never invent a quote, a count or a source.** Counts come from `evidence_ledger.mjs stats`; quotes come from the ledger.
- **Hypotheses never count.** `model_hypothesis` rows and the client's `buyer_pain_hypothesis` are tracked, never cited as evidence.
- **Competitor claims are context, never pain or proof.**
- **No prevalence percentages** without a quantitative source and its sample size. Say "appeared across 18 discussions, 7 reviews and 4 sales calls".
- **Never hide a cluster.** Weak clusters are labelled and ranked.
- **The ledger is append-only.** Only the script writes rows; a person may only change `status` (for example `retracted`, with a reason in `notes`).
- **No prospect identity in the ledger.** Roles, never names or emails.
- **Never edit a live campaign, never move the flip, never lock an offer.**

## Verify Before Done

Before reporting a run complete, prove it against the files:

- `stats --json` runs clean: no FAIL on any cluster that the Summary or an offer relies on, and `unassigned_rows` is explained.
- Every cluster heading in `pain-clusters.md` has an `evidence:` line, and every Counts line matches the latest `stats` output.
- The verdict, the `research_artifacts:` block and `run_state.status.research_stage` agree, and the YAML re-parses.
- In feedback mode, the number of reply rows ingested equals the human replies pulled minus exact duplicates (report both numbers).

## Integration

| Skill | Relationship |
|---|---|
| `/offer-intelligence` | Collects the evidence (Vectors 0-4, first-party calls, the research sample) into run-folder batches, calls synthesize, runs the deepen loops, and cites the cluster IDs in its brief. Validation mode reads the feedback clusters. |
| `/lead-magnet-brainstorm` | Builds offers only after the gate; every candidate cites clusters and evidence (standard section 12). Receives new-candidate recommendations from feedback mode. |
| `/cold-email-kickoff` | Runs the gate between Step 3A's research and `/lead-magnet-brainstorm`, and shows the verdict at Gate 2 under `review_gates`, or at checkpoint 2 under `review_protocol: phase_checkpoints`. |
| `/cold-email-weekly-rhythm` | Calls feedback mode at each arm read and at least every two weeks while a wave is live. Owns the flip, the reads and the winner pick. |
| `/campaign-strategy` | Each offer cell records its cluster IDs and pain angle. |
| `/campaign-copywriting` | Draws pain wording from the Language bank; every pain line traces to a cluster. |
| `/continue-client`, `/cold-email-flow-audit` | Check `research_stage` and these files as part of the chain. |
| `/ai-model-routing` | The model-tier routing and the research-routing rule. The read routes this skill's deepen briefs name are in standard section 9. |

## What To Do Next

- **Synthesize PASS**: back to `/offer-intelligence` for the Intersection and the brief, then `/lead-magnet-brainstorm`.
- **Synthesize DEEPEN**: `/offer-intelligence` Stage 2 with the deepen brief, then this mode again. Under `review_protocol: phase_checkpoints`, `/cold-email-kickoff` checkpoint 2 instead, and the loop runs only if the operator picks it there.
- **Synthesize HOLD**: Gate 2 under `review_gates`; checkpoint 2 under `review_protocol: phase_checkpoints`; under plain `auto_execute`, `/lead-magnet-brainstorm` with low-confidence labels and the missing evidence requested.
- **Feedback done**: the routed skills in the results review, and `/cold-email-weekly-rhythm` for the reads it owns.
