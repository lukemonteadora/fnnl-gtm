---
name: personalization-subagent-pattern
description: "Reusable pattern for fanning per-lead or per-row work across parallel Claude Code Task sub-agents: 1 sample, rounds of 10 until two clean rounds, then full fan-out with batch safety (disjoint slices, one file per agent, count checks, resume, dedup). Always the Task tool, never an AI API."
---

# Personalization Sub-Agent Pattern

**From the former description:** Reusable approval-loop pattern for fanning out per-lead generation across parallel Claude Code Task sub-agents. Shows the user 1 sample, collects feedback, runs 10 more, approves, runs 10 more, stops when 2 consecutive rounds have zero edits, then scales to the full list. ALWAYS uses Claude Code Task tool sub-agents. Use when any skill needs per-lead research that places leads into slices or sources the at most two per-contact copy variables (sells_to_vertical, service_offered, own_best_client) with an evidence URL, or needs the per-contact email body columns (email_1_a, email_1_b and email_1_c by default) filled with a slice's shared approved body and those values. Any generated initial cold touch must pass the Framework A contract in outreach-copy-framework.md. (Updated 2026-09-28: the batch-safety rules below also govern the non-copy fan-outs other skills run on this pattern, such as `/tam-build` company fit, `/lead-scoring` normalization and title passes.)

## Canonical Profile Root

All profiles/<business-slug> paths in this skill resolve under:

```text
<outbound>/profiles
```

Here `<outbound>` is the root of this skill library - resolve it to wherever the library is currently checked out (local Documents, OneDrive, or a git worktree); never hardcode an absolute path. Do not create client profiles under a `profiles/` folder at your current working directory.

Per-lead work at scale (researching the fields that place each lead in a slice, or filling every row's body columns) needs parallel generation. Claude Code's Task tool lets you fan out to many sub-agents in parallel, each handling a slice of the lead list. This skill defines the reusable approval-loop pattern.

## Framework A hard gate

Before a sub-agent generates or fills any initial cold email or other first written cold touch, read `<outbound>/reference/outreach-copy-framework.md`. Its Email 1 contract (B1 to B15) controls the finished message. It overrides older word-count, layout, opener, subject, proof, and CTA examples anywhere in this file.

For Email 1, every row's body must:

- carry its variant's shared, approved slice body (B13): the same text in every row, varying only the first name and at most two per-contact variable values inside the offer sentence (`sells_to_vertical`, `service_offered`, `own_best_client`), each sourced and baked in as literal text (Aaron process alignment, operator directive 2026-09-22; supersedes first-name-only variation). A row with no sourced value for a variable gets the slice's approved version of the body without it; where no per-contact case study exists, the slice's case-study name is already written into the shared body (B5);
- open on the specific offer with no greeting word, never a hook, observation, pain setup, or self-introduction (B1); the first name, if the approved body uses it, is optional; it may open the email or sit later in the sentence (his first-name-second trick);
- use no company-name variable by default (B5);
- contain 25 to 35 body words by default, with the optional P.S. excluded from the count (it stays short and does one job), as are the subject and the sending-tool signature (B1, B4, B14; operator-approved Aaron alignment, 2026-09-21);
- contain 2 to 3 main-body sentences (one for the one-liner) and one primary ask, the soft permission CTA, last (B14);
- carry the scope disclosure whenever it reflects the real process (B1, B14);
- use one shared static email subject that is 2 to 4 lowercase words with 0 to 2 variables (B1, B14).

(operator-approved Aaron alignment, 2026-09-21: this gate used to count a greeting and the P.S. inside the 25 to 35 words, and to require exactly one question, a mandatory parenthetical, and exactly one merge token in the subject; it also allowed a per-contact personalized body. The at most two per-contact variables and the three Email 1 variants are Aaron process alignment, operator directive 2026-09-22.)

**The 25 to 35 word line does not apply to Aaron-lane copy (Aaron flow, see aaron-flow.md section 9; removed limit, section 13 item 12).** When `run_state.aaron_lane` is active and Email 1 is built frame by frame from `aaron-copy-frames.md`, that frame's own sentence count sets the body length, not the word window in the bullet above. Every other part of this gate still binds Aaron-lane copy unchanged: the no-greeting open, no company-name variable by default, the soft-permission CTA last, the scope disclosure, the one shared lowercase subject, the at-most-two per-contact variable cap, and the `spam-word-checker.md` plus `cold-email-copy-best-practices.md` passes before export. Only the word count is lifted; nothing else in Framework A is.

Per-contact subjects, per-contact bodies, stacked per-contact inserts, long diagnostic first touches, statement-only opt-ins such as `Just reply "Yes"`, and a second new-thread Email 3 are retired (the one exception is a final follow-up planned as a logged new-thread arm under `/campaign-copywriting` Hard Rule 18, which no upload path wires yet, so the threaded version ships). Follow-ups remain in the same thread and use the follow-up rules from `/campaign-copywriting`.

**What this skill still generates per lead (B13).** Three jobs survive the shared-body rule: (1) per-lead research that places each lead in a slice (a targeting input, never copy), sourced and never fabricated; (2) sourcing the per-contact copy variables the approved body uses, where the data does not already hold them: `service_offered` (the prospect's own product or service, a short phrase from their own site) and `own_best_client` (the prospect's own best client, from the case studies or client logos on their own site, used as the deliverable's target), each with its evidence URL in a `_source` column (`sells_to_vertical` is an existing column and needs no research). These are derived by Claude sub-agents here, never by an AI column in the list workbench, and they travel like any other column, including through the workbench webhook push; and (3) filling each row's `email_*` columns with its variant's approved shared text, with the literal first name and those at most two values baked in (Aaron process alignment, operator directive 2026-09-22). Where no per-contact case study exists, the slice's case-study name is written into the slice's shared body (B5). Per-contact observation lines, value lines, and relevancy nudges are retired: Aaron's ledger R13 supersedes per-contact insert stacking in favor of personalizing the ICP or slice variable, and `/campaign-copywriting` Hard Rule 34's fork is resolved in favor of Hard Rule 34 (operator-approved Aaron alignment, 2026-09-21).

## Always Task tool, never an API key

This skill runs entirely inside Claude Code via the Task tool. No AI-provider SDK or API calls of any kind, and no API key (no-AI-API rule, operator directive 2026-09-22). This is intentional:

- **No extra API spend.** Uses your Claude Code plan.
- **No key management.** Works out of the box.
- **Parallel by design.** Claude Code spawns multiple Task sub-agents in one message, letting 100 leads finish in the time it takes to personalize 10.

At very large scale (1,000+ leads), scale by running more Task sub-agent batches in waves (around 10 concurrent agents per wave), not by shipping the prompt to an API. The old optional API throughput path is retired. TUNING, normal campaign runs and very large runs all go through the Task tool.

Cost and speed come from the model tier instead. Each Task call takes a `model` setting that picks which Claude model the sub-agent runs on inside Claude Code: a small model for mechanical fills, a mid model for per-lead judgment (see [Model routing per job](#model-routing-per-job-pass-model-on-every-task-call) below). That setting is not an API call and needs no key, so it stays inside the no-AI-API rule.

## AI/API Routing

What *feeds* the sub-agents is Claude-native too (no-AI-API rule, operator directive 2026-09-22); the Task-tool default above stands. Per tier: the research that builds each lead's `company_description` and signal context comes from the `/deep-research` harness for segment-level context and from WebSearch/WebFetch run by the sub-agents themselves for per-company pages, with any bulk crunching done by more sub-agent batches. Data-vendor fields (firmographics, signals from the stack contract's tools) feed in as-is. The Task-tool sub-agents remain the generator for per-lead research fields and column fills. For high-tier or high-ACV leads, make the clean research packet that feeds the agent richer; for broad or low-tier leads, lean on lighter context (the vendor firmographics plus the company's cached Spider homepage text). **The homepage is fetched once per company, not once per use (operator directive 2026-10-12):** `/tam-build` Layer 1a step 0 already ran `outbound/scripts/research/spider_fit_fetch.mjs fetch`, so read `site/<company_domain>.json` (or the `batch` files) from that run folder for what the company sells, who it serves and its own wording. Never fetch it again, and a company whose site was flagged thin, parked or redirect gets research from WebFetch or the discovery text instead. For deeper pages on a high-tier lead, `fetch --pages 3` on that lead's company only (it passes the same balance check). Use the lead's `deal_value_tier` from the TAM (the free derived contract-value estimate) as the tier signal for research depth only: it decides how rich a lead's research packet is when its slicing research needs one, and never whether a lead gets a per-contact Email 1 body, because Email 1 carries the slice's shared body (B13; operator-approved Aaron alignment, 2026-09-21; this used to let a `high` or `mid` tier justify a full per-contact written body). Never spend heavy research effort on a low-value lead. (Caveat: when the list's `deal_value_tier` is nearly constant, the ICP is uniform and tiering adds little, so keep depth consistent.) Final sendable copy still follows `/campaign-copywriting` (written in the native Claude Code session). Never replace Task sub-agents with an API key; there is no at-scale exception.

## The approval loop (before full fan-out)

Don't personalize 500 leads and then discover the prompt is wrong. Loop first, then scale.

### Round 0 - Sample on 1 lead

1. Pick one lead from the batch with a rich `company_description`.
2. Show the user: "Here's the research I'm working with for this lead. Does this value look right, and is it sourced?"
3. Display what YOU would generate for the per-lead research field the campaign needs for slicing (with its source URL), or the filled `email_1_a` body for this row. Never a per-contact observation line, value line, or CTA context (B13).
4. Ask with a native choice prompt:
   ```text
   Does this feel right?

   A. [Recommended if it matches the campaign] Approve this direction
   B. I will edit the wording or logic
   C. Show one alternate version first
   D. Custom answer
   ```

### Round 1-N - Batch of 10 with approval

1. Spawn one Task sub-agent with the current prompt + 10 leads.
2. Display all 10 results in a table:
   ```
   Lead                  | research field (for slicing)            | source                        | filled email_1_a (first words)
   jane@acme.com         | The researched value and its slice      | Evidence URL                  | If we could build you ...
   john@otherco.com      | ...                                     | ...                           | ...
   ```
3. Ask with a native choice prompt:
   ```text
   Any edits?

   A. [Recommended if the batch is right] No edits
   B. I will point at row numbers and say what is wrong
   C. Re-run with a stricter prompt
   D. Custom answer
   ```
4. If the user has edits, update the prompt (or add rules like "never use the word X") and re-run a new batch.
5. If the user has **zero edits for 2 consecutive rounds**, the prompt is locked. Scale to the full list.

### Scale - Full fan-out

Once locked:
- Split remaining leads into batches of 10-20.
- Launch 3-10 parallel Task sub-agents (one per variant x batch).
- Merge results by `lead_id`.

**No-duplicate-output guard (HARD RULE, the safe fan-out contract from `/autonomous-execution-policy` section 9).** Parallel agents can't see each other's work, so fanning out without a guard produces duplicates. Enforce all three layers, every run:

1. **Disjoint inputs.** Partition leads so every `lead_id` goes to exactly one agent×variant. Verify the batches cover the whole slice with zero overlap before launch. No lead personalized twice.
2. **Disjoint output targets.** Each agent writes its own `/tmp/personalization-<batch-id>.json` (or `/tmp/prewrite-<batch-id>.json`), never a shared file, then you merge by `lead_id`. This is already the pattern below; never collapse it to one shared output file (concurrent writes double-append or clobber).
3. **Post-merge uniqueness check.** After merging, scan for convergent duplicates: different leads that got near-identical lines (the "Repetition across leads" failure in Quality checks below). De-dupe by content and re-run the offending batch with an explicit diversity instruction. Partitioning stops overlap; only this step catches convergence.

   **Scope under B13 (operator-approved Aaron alignment, 2026-09-21).** Run the uniqueness check on the per-lead generated values (the slicing research fields and the `service_offered` / `own_best_client` values), where convergence is a real failure. The body columns carry the slice's shared text, so identical body text across rows is by design; check the bodies instead against the approved text (every row must match it apart from the filled values). A human reviews the first 20 filled per-contact variable values before the list scales; if more than 3 of 20 are vague, awkward or wrong, refine the research prompt first (Aaron process alignment, operator directive 2026-09-22).

### Batch safety (every fan-out on this pattern, copy or not; operator decision 2026-09-28)

Other skills fan row-level judgment out through this pattern too: `/tam-build` company fit and title passes, `/lead-scoring` evidence normalization, `/email-waterfall`'s LinkedIn backfill, and `/data-point-discovery`'s trigger research. The same five rules hold for all of them, because a fan-out that loses or doubles a slice fails silently.

1. **Partition before launch, in a manifest.** Write the split to a manifest file in the run's work folder (`<task>-manifest.json`: batch id, the ids in it, the output path). Check that the batches cover the whole input with zero overlap before any agent starts. Hand each agent only its rows, the rule text and the output format, never a whole skill.
2. **One output file per agent.** Each agent writes `<task>-<batch-id>.json` (or `.csv`), never a shared file. The files on disk plus the manifest are the run's state.
3. **Count and format check on every file before it merges.** The file parses; it holds exactly the ids its batch was given, each once, and no id from outside the batch (a foreign id is a leak, so the file is rejected); every required field is filled; every enum value is in the declared vocabulary. A file that fails is not merged.
4. **Resume after failure, never restart.** Re-run only the batches whose file is missing or failed its check, and never re-run a batch that passed. Retry a failed batch once with a strict prompt, then split it smaller; a row that still cannot be judged is marked with a reason (for example `status: skipped`) and reported at the top, never dropped. A new session resumes from the manifest and the files already on disk.
5. **Merge by stable id, then check for duplicates.** Merge on the stable id (`lead_id`, `company_domain` or the contact id), confirm the merged count equals the input count, and run the post-merge uniqueness check above.

**No API batch lane.** Scale is more Task sub-agents in waves of about 10, or a smaller scope (judge only the rows in the wave's scope, and send only distinct values, such as distinct titles, to an agent and join the verdict back). Never a provider batch API, an outside AI API, or a script that calls a model (no-AI-API rule). A step that already has its own script-level concurrency (for example the email verifier's `--concurrency` flag) uses that and is not wrapped in agents.

After the merge, verify the row count and coverage against the input slice before reporting done: a dropped or double-counted batch is the silent partial the verify-before-done rule exists to catch.

## When to use

- Any campaign where per-lead research must place leads into slices (for example, into case-study look-alike slices), beyond just the first name
- When you have 50+ leads whose slicing research needs doing, or whose `email_*` columns need filling with the slice's shared body
- When the approved body uses `service_offered` or `own_best_client` and the data does not already hold them: derive each per contact from the prospect's own site, with an evidence URL (Aaron process alignment, operator directive 2026-09-22)
- When `/auto-research-public` or similar orchestration skills need parallel personalization

## Don't use this for

- Small batches under 20 leads: just personalize inline in the main conversation.
- Static copy: personalization wastes tokens.
- Writing per-contact Email 1 bodies, observation lines, or relevancy nudges: retired (B13). The slice's shared body is written once in `/campaign-copywriting`.

## The pattern

### 1. Prepare the lead batch

**List Gate (inherited).** This pattern emits sendable per-lead copy (the filled `email_*` body columns), so it runs only after the verified-list gate passes for the slice (`verified-list-gate.md`): the lead batch must be drawn from this slice's `leads.verified.csv` (from `/email-waterfall`), and the campaign strategy must be locked. If there is no verified slice, STOP and route to `/email-waterfall`. Do not personalize a speculative or unverified list. (The calling skill enforces the grade-B condition.)

Before fanning out, your lead batch should be a JSON array where each lead has:

```json
{
  "lead_id": "<stable identifier>",
  "first_name": "<str>",
  "last_name": "<str>",
  "email": "<str>",
  "company_name": "<str>",
  "company_domain": "<str>",
  "company_description": "<1-3 sentences about what the company does>",
  "title": "<str>",
  "linkedin_url": "<optional>",
  "enrichment_data": { ... any extra signals ... }
}
```

The richer the research, the more reliable the slicing. If you only have company names, a slicing field usually cannot be sourced: leave it empty and hold the row out of any slice that depends on it. Never guess.

### 2. Define the output schema

Decide up front what fields each sub-agent must return. Example:

```json
{
  "lead_id": "<same id>",
  "<slice_field>": "<the researched value that places this lead in a slice, for example the case-study look-alike slice it belongs to; empty if it cannot be sourced>",
  "<slice_field>_source": "<the evidence URL for that value>"
}
```

Fewer fields = less that can go wrong. Default to 3 fields maximum per variant. A slicing field is a targeting field, not a copy variable: it decides the lead's slice and never enters the body. The only per-lead values that enter the body are the at most two per-contact copy variables (`sells_to_vertical`, `service_offered`, `own_best_client`, B13), researched with the same schema (`<field>` plus `<field>_source`, the evidence URL) when the data does not already hold them; where no per-contact case study exists, the slice's case-study name is set once per slice (B5) (Aaron process alignment, operator directive 2026-09-22). The legacy fragment fields `situation_line`, `value_line`, and `cta_context` stay valid column names for existing campaigns and the upload maps, but they are no longer generated as Email 1 copy inserts (B13; operator-approved Aaron alignment, 2026-09-21).

Alternatively, in the pre-written copy path the sub-agent returns one full email body per live sequence slot (`email_1_a`, `email_1_b`, `email_1_c` by default, plus any further declared Email 1 letter, `email_2`, and optional `email_3`). The sending tool then receives a complete email rather than a template to assemble. Under B13 each of those columns carries its variant's shared approved body, varying only the first name and at most two per-contact variable values, baked in as literal text. See Pre-Written Email Copy Architecture (full email body mode) below. (operator-approved Aaron alignment, 2026-09-21: this used to call the full-body column model the standard for genuine per-contact personalization, with `situation_line` / `value_line` / `cta_context` fragments as the lighter alternative. Both per-contact copy uses are retired.)

Do not generate CTA wording per lead: the CTA is part of the shared body (B13). Every finished body must pass `outreach-copy-framework.md` where applicable, `spam-word-checker.md`, and `cold-email-copy-best-practices.md`.

### 3. Split into variants (A/B/C)

Email 1 runs three variants by default: `email_1_a`, `email_1_b`, `email_1_c`, one variable changed per variant (A is the control), more letters allowed (Aaron, Sep 21: variant one, variant two, variant three; Mar 9: one variable at a time). So run 3 parallel sub-agents per batch, one per variant (Aaron process alignment, operator directive 2026-09-22; supersedes two variants). Under B13 each variant is its own shared body, written once in `/campaign-copywriting` and broadcast into its own column. B and C each change exactly one variable against A: for example the B2 shape (the one-liner against two lines plus a P.S.), the proof P.S. against no P.S., or one labeled B3 arm. Offer arms are separate cells owned by `/campaign-strategy`, each with its own three variants.

**The three signal-first variant angles below are RETIRED (2026-07-17), superseded by the offer-led opener (`/campaign-copywriting` Hard Rule 19).** Every one of them opens on the signal, which the opener no longer carries. The A/B/C mechanic itself is LIVE; what varies across variants is now one copy variable at a time (the B2 shape, the proof P.S., one labeled B3 arm), not the opener's signal shape, and the offer itself varies across offer cells, not inside one campaign's variants (Aaron process alignment, operator directive 2026-09-22). Signals pick the SLICE that gets each campaign and offer. A slice-SHARED signal fact rides in the P.S. by default (B1, the opening-line swap) or inside the offer sentence (Hard Rule 38), never in Line 1, and per-contact signal copy stays retired (Hard Rule 34).

The retired angle examples (Variant A signal-and-cost, Variant B diagnostic question, Variant C fact memo plus routing question) are archived at `outbound/_archive/aaron-alignment-2026-09-21/personalization-subagent-pattern--variant-angles.md` (operator-approved Aaron alignment, 2026-09-21: two of them are question-form pain openers, which Aaron's kill-list bans, B9). **Two bans that never depended on the opener shape survive:** no variant, and no line anywhere in the email, may use an observational opener ("I noticed", "I saw that", "Congrats on") or an em dash of any kind.

This gives you more data from one list, so you can test which variant resonates, one variable at a time.

### 4. Batch size

- **Small batches are the right default: 10-20 leads per sub-agent.**
- Bigger batches = fewer agents = cheaper but worse quality (agent loses context)
- Smaller batches = more agents = higher quality but more context usage in parent

For 100 leads:
- 10 sub-agents x 10 leads = good quality
- 5 sub-agents x 20 leads = faster
- 2 sub-agents x 50 leads = quality drops

For 1000 leads:
- Consider running in rounds of 100 (to avoid hitting context limits in parent)
- Each round launches 10 sub-agents of 10 leads each

### 5. The sub-agent prompt template

**Never ask one sub-agent to both research and write.** An AI is good at one focused job at a time, so the research pass that builds a lead's clean packet (`company_description` and signal context) and the message-writing pass are separate sequential calls, never one combined prompt. This holds for both prompt modes, the field-fragment template below and the full-body prompt. Source: `/ask-eric` (`eric-doctrine.md` section 7).

Every personalization sub-agent gets a prompt of this shape:

```
You are researching one per-lead field for N leads, used to place each lead in a slice. You write no email copy.

CONTEXT:
- We sell: <one sentence from client-profile.yaml>
- Our ICP: <one sentence>
- Our offer: <the approved free deliverable, as locked upstream>
- The field: <what it records and which slice each value maps to, for example the case study a lead belongs with; a targeting input, never a copy variable>

FIELDS TO GENERATE (per lead):
- <field>: <definition + 1 good example + 1 bad example>
- <field>_source: <the evidence URL for the value>

RULES:
1. Never fabricate facts. If the research does not show the value, return it empty. This cuts both ways: never invent facts about the prospect, and never claim a capability, feature, integration, or result the client cannot actually deliver. Only return what the provided research supports.
2. Never use em dashes of any kind. Use periods or commas.
3. Never use a colon to carry a long list or proof stack.
4. Never use comma-wrapped company descriptors.
5. Return the value exactly as the source names it: no descriptors and no commentary.
6. Maximum length: <N words per field>.
7. If a lead has no usable research, return "<fields cannot be generated: skip>"

LEADS:
<JSON array>

RETURN:
A JSON array with the same lead_ids and the fields above. Save to /tmp/personalization-<batch-id>.json and print "DONE" when complete.
```

### 6. Fan-out code pattern

Pseudocode for the orchestrator (runs in the main Claude Code conversation):

```
leads = load leads from JSON
batches = chunk leads into groups of 10-20

for each batch:
  for each variant in [A, B, C]:
    Task(
      description: "Personalize batch <i> variant <v>",
      subagent_type: "general-purpose",
      model: "haiku",  # mechanical fill against the locked shared body; use "sonnet" when the job needs judgment (see Model routing per job below)
      prompt: <template above with variant-specific angle>
    )

# All tasks run in parallel (multiple tool calls in one message)

Wait for all tasks to finish, then read /tmp/personalization-*.json and merge.
```

Or, launching all in a single message with multiple Task calls:

```
# Launch 3 parallel sub-agents for one batch (variants A, B, C)
Task(description: "batch-1-variant-A", ...)
Task(description: "batch-1-variant-B", ...)
Task(description: "batch-1-variant-C", ...)
```

### Model routing per job (pass `model` on every Task call)

Every `Task`/`Agent` call in this pattern takes a `model` parameter; set it per job instead of leaving it on the session default (the tier table lives in `/ai-model-routing`, Model tiers for sub-agents):

- **`model: "haiku"`** for mechanical work: filling a slice's shared, approved body into the `email_*` columns, sourcing a per-contact variable from text already on the row, tagging, normalization, and simple classification against a locked rubric.
- **`model: "sonnet"`** for per-lead research that needs judgment: reading a prospect's or company's site to answer a structured question (for example sourcing `service_offered` or `own_best_client` from the prospect's own site), fit scoring with a locked prompt (the at-scale pass in `/icp-prompt-builder`), or any slicing-field research where the source is ambiguous enough to need real reasoning.
- **Inherit the session's model** (omit `model`) when the job is synthesis, offer or copy work, or when the agreement check below shows a smaller model loses quality on that specific job.

Before moving a recurring job down a tier (sonnet to haiku, or session default to sonnet), run a 20-row agreement check: have the candidate tier score or fill the same 20 rows the session (or the operator) already answered, and compare. Lock in the cheaper tier only if agreement holds; otherwise stay one tier up. Where a suite exists for the job, the move also needs a pass on its benchmark (`outbound/evals/README.md`); a job without a suite still needs the 20-row agreement check. This is the same check `/icp-prompt-builder` runs before it drops to haiku.

### 7. Error handling

Sub-agents can:
- Return malformed JSON
- Skip leads (if data is too thin)
- Refuse to generate (if content feels risky)

The orchestrator should:
1. Validate every returned JSON matches the output schema
2. For missing lead_ids: retry once with a "strict mode" prompt that emphasizes no-skip
3. For leads that genuinely can't be personalized (missing description): mark as `personalization_status: "skipped"` and use static copy instead

Never ship personalization fields that contain the string "cannot be generated" or similar. Filter these out before upload.

### 8. Merge and upload

After all sub-agents complete:

1. Read `/tmp/personalization-*.json` files
2. Merge by `lead_id`
3. Each lead now has:
   ```json
   {
     ...original lead fields,
     "<slice_field>": "...",
     "<slice_field>_source": "...",
     "service_offered": "...", "service_offered_source": "...",
     "email_1_a": "...", "email_1_b": "...", "email_1_c": "...", "email_2": "..."
   }
   ```
4. When uploading to the locked `run_state.sending_platform` (PlusVibe on this stack), map each field to a custom variable. Convention:
   - Slicing fields stay in the lead data for targeting; they are never referenced in the email body (B13). The per-contact copy variable values (and their `_source` fields) stay in the lead data as the audit trail; their values are already baked into the `email_*` bodies, so the step never references them as separate tokens. Where no per-contact case study exists, the case-study name lives in each slice's shared body (B5).
   - Legacy fragment fields, still valid column names for existing campaigns but no longer generated as Email 1 copy inserts under B13: `{{situation_line_a}}`, `{{value_line_a}}`, etc., in the sending platform's custom-variable syntax.
   - The Email 1 variant test is best run **within one campaign** where the locked `run_state.sending_platform` supports it: one variation per declared Email 1 column (A, B and C by default) on the same step, split evenly across all of them. Confirm the platform takes that many variations with an even split, and stop rather than drop Variant C if it does not (Aaron process alignment, operator directive 2026-09-22; supersedes the Variant A + Variant B 50/50 split). For the exact setup, use the campaign-upload skill for that platform, if `/stack-setup` activated a pack that provides one (e.g. `/smartlead-campaign-upload-public`). If no pack is active, set the variations and the even split in that platform's native campaign builder. If neither exists, say so and build the split by hand rather than implying coverage. One campaign per variant column (across-campaign, the list split evenly between them) is the platform-agnostic fallback only.
   - Pre-written copy path (full email body mode below): the variable IS the whole email body, for example `{{email_1_a}}` in the sending platform's custom-variable syntax.

## Pre-Written Email Copy Architecture (full email body mode)

The sections above research per-lead slicing fields. This mode fills the pre-written copy path: each sub-agent writes the ENTIRE email body into each contact's row, and the sending tool receives one ready-to-send field per email slot. This is the canonical generation prompt for the pre-written copy path described in `/campaign-copywriting` (Pre-Written Email Copy Architecture). **Under B13 every row carries its variant's shared, approved slice body** (operator-approved Aaron alignment, 2026-09-21), varying only the first name and at most two per-contact variable values inside the offer sentence, baked in as literal text (Aaron process alignment, operator directive 2026-09-22); where no per-contact case study exists, the slice's case-study name is already in that shared body (B5). The per-contact columns stay because the locked sending platform's upload reads them (mechanism unchanged); what goes into them is shared text. The same approval loop, batch sizes, and fan-out code above apply; only the output schema and prompt change. (This section used to write a genuinely relevant per-contact version of the offer for each row. That per-contact prompt is archived at `outbound/_archive/aaron-alignment-2026-09-21/personalization-subagent-pattern--per-contact-prompt.md`.)

This pattern runs on Task sub-agents, or on a deterministic Claude Code CSV script when the job is only broadcasting a slice's approved shared text. List-workbench AI columns are not an equivalent path: they are banned on every key (no-AI-API rule, operator directive 2026-09-22), so the filled columns are pushed into the list workbench by webhook. What matters is that the full email is written before it reaches the sequencer.

### Output columns (one body column per slot, shared text per slice)

Each sub-agent returns, per lead, one complete body for every live step in the single-thread sequence:

- `email_1_a` = full Email 1 body, Variant A, the control (the slice's shared Variant A body, filled for this row)
- `email_1_b` = full Email 1 body, Variant B (the slice's shared Variant B body, filled for this row)
- `email_1_c` = full Email 1 body, Variant C (the slice's shared Variant C body, filled for this row); `email_1_d` and on only when the campaign declares them
- `email_2` = full Email 2 body, single variant (no split)
- `email_3` = optional full Email 3 body, single same-thread follow-up

Every body column holds the BODY only, with no subject, sign-off, or signature inside the cell. Email 1 carries no greeting word (B1). If the approved body uses the first name or a per-contact variable, the value is baked in as literal text (never a nested merge token, which sending tools do not reliably expand inside another custom field), wherever the approved body puts it: the first name may open the email or sit later in the sentence; a per-contact variable sits only inside the offer sentence. Email 2 and optional Email 3 are same-thread follow-ups; their text is shared across the slice too, written once and broadcast into every row's column. Email 1 uses one shared static subject on the sending-tool step: 2 to 4 lowercase words with 0 to 2 variables (B14). Do not create per-contact subject columns.

### One shared body per slice (the fallback rule)

There is no separate fallback column. Each `email_*` column holds its variant's shared slice body, with the literal first name and at most two per-contact variable values filled in when the body uses them. When a row has no sourced value for a variable the body uses, it gets the slice's approved version of that body without the variable (written once in `copy.md` by `/campaign-copywriting`), never a guessed value and never ad-hoc rewording. Where no per-contact case study exists, the slice's case-study name is already written into that slice's shared body (B5). The sending tool receives `{{email_1_a}}`, `{{email_1_b}}` and `{{email_1_c}}` (and any further declared letter) for every contact. No row may change the offer's wording, insert a hook before the offer, or break the contract mechanics. (operator-approved Aaron alignment, 2026-09-21: the per-row "personalized or fallback" wording choice is retired under B13; the approved no-variable version is Aaron process alignment, operator directive 2026-09-22.)

### The full-body sub-agent prompt

Use this prompt shape (one variant per run; loop A, then B, then C, and any further declared letter). Adapt the CAMPAIGN CONTEXT per campaign. It fills each row from the approved shared body. Every Email 1 output passes `outreach-copy-framework.md`, then `spam-word-checker.md`, then `cold-email-copy-best-practices.md` before export.

> **LIVE MODEL:** Email 1 is the only new-thread message and must follow Framework A exactly. Email 2 and optional Email 3 are same-thread follow-ups (a new-thread final follow-up exists only as a planned arm in `copy.md`, never in these columns). There is no Email 4, second new thread, per-contact subject, per-contact body (B13), or long personalized exception for Email 1.

```
You are filling one cold email body column per lead for [Campaign Name]. You do not write new copy: you place the slice's approved shared body into each row.

CAMPAIGN CONTEXT (same for every lead):
- Slice: [the campaign or offer-angle slice this body belongs to]
- Approved shared body for THIS slot, exactly as locked in copy.md: [paste it; its per-row placeholders are [first name] and at most two of [sells_to_vertical], [service_offered], [own_best_client], the latter only inside the offer sentence]
- Approved no-variable version of the same body, exactly as locked in copy.md: [paste it, for rows missing a per-contact value]
- Placeholders this body may use, and the row fields that fill them: [first name] from first_name; [sells_to_vertical] from sells_to_vertical; [service_offered] from service_offered; [own_best_client] from own_best_client
- Client capabilities (the ONLY claims the body may make about us): [bullet list from client-profile.yaml + offer-intelligence.md + the locked offer]. The approved body already stays inside this list. Do not add to it.

CONTACT DATA PER LEAD:
Each row carries first_name, the per-contact variable fields and their _source fields, and the rest of the row. Read only the fields the placeholders name.

FILL RULES (per lead):
1. Copy the approved body exactly and replace each placeholder with the row's literal value. Change nothing else: no reworded offer, no added line, and no per-row hook, observation, compliment, role mention, or relevancy nudge (B13).
2. If the body uses [first name] and this row's first_name is empty, do not guess and do not write around it. Return "<fields cannot be generated: skip>" for this row, so it can be held out or given a version of the body without the name. If a per-contact variable field is empty or has no _source, use the approved no-variable version instead; never guess a value.
3. The first name, when the body uses it, is baked in as literal text exactly where the approved body puts it: it may open the email or sit later in the sentence (B1). After a first name followed by a comma, the next word is lowercase unless it is a proper noun.
4. Never insert the company name unless the approved body itself contains that placeholder (B5 keeps it out by default).
5. Keep the plain text and the blank lines between blocks exactly as in the approved body. No em dashes of any kind.
6. Output the complete body only, with no subject, sign-off, or signature.

LEADS:
<JSON array>

RETURN:
A JSON array with the same lead_ids and one field named for the slot you are filling (`email_1_a`, `email_1_b`, `email_1_c`, any further declared Email 1 letter, `email_2`, or optional `email_3`). Return no subject field. The shared Framework A subject is set once on the sending-tool step. Save to /tmp/prewrite-<batch-id>.json and print "DONE".
```

### Quality control before export

After the columns are populated, run this before exporting to the sending tool:
- [ ] Sample 10 random rows of each Email 1 variant column (`email_1_a`, `email_1_b`, `email_1_c`). Does each body match its approved shared body (or the approved no-variable version) exactly, apart from the first name and the at most two per-contact variable values? A diff against the approved text is the fastest check.
- [ ] Were the first 20 filled per-contact variable values human-reviewed, each sourced (an evidence URL on file), inside the offer sentence, and never an observation or surveillance (B13)?
- [ ] Does the approved Email 1 body pass the contract in `outreach-copy-framework.md`: no greeting word, the first name optional (it may open the email or sit later in the sentence), the offer first, 25 to 35 body words by default (P.S. excluded from the count; it stays short and does one job; not for Aaron-lane copy, see the Framework A hard gate above), 2 to 3 main-body sentences (one for the one-liner), one primary ask last, the scope disclosure whenever the real process supports it, and no company-name variable by default? If present, is the P.S. short, declarative, and doing one of the four B1 jobs?
- [ ] Is the single shared Email 1 subject 2 to 4 lowercase words with 0 to 2 variables? Confirm there are no per-contact subject columns.
- [ ] No per-row additions: in the sample, does ANY body add a hook, observation, role mention, compliment, relevancy nudge, or raw data field that is not in the approved body? Any such row fails (B13). Fix the prompt and regenerate.
- [ ] When the body uses a case-study target, is it either the prospect's own best client (`own_best_client`, sourced per row) or the slice's own real, sourced case study true for every contact in the slice? Did every row without a sourced value get the approved no-variable version, rather than a guessed value?
- [ ] After a first name followed by a comma, is the next word lowercase unless it is a proper noun?
- [ ] Zero fake-familiarity or warmup phrases in any column, and no greeting in Email 1.
- [ ] Offer honesty: no invented offer, workload step, proof claim, or lead magnet in any row.
- [ ] Does every claim about the client's product map to a real, provided capability? No invented features, integrations, tools, or results the client cannot deliver.
- [ ] Any blank rows in any declared Email 1 variant column? A blank means the generation step errored. Investigate. Do not send blank rows.
- [ ] Do `email_1_b` and `email_1_c` each differ from `email_1_a` in exactly the one variable under test (for example the B2 shape, the proof P.S., or a labeled B3 arm), each as its own shared body?
- [ ] Any em dashes of any kind in any row? Fix the prompt and regenerate.
- [ ] Any signature or sign-off baked into a body column? Strip it. The signature belongs on the sending-tool step only.
- [ ] Every Email 1 row passes `outreach-copy-framework.md`, then every row passes `spam-word-checker.md` and `cold-email-copy-best-practices.md`.

### Export and upload

Filter to rows where `first_name` and `company_name` are non-empty and every declared `email_*` column is non-empty (every Email 1 variant column, `email_1_a`, `email_1_b` and `email_1_c` by default, plus every live follow-up column). Only export rows that pass. Then upload to the locked sending platform (`run_state.sending_platform`), in that platform's own variable syntax:
- Every email step body is just its column variable plus the signature on the step. Email 1 uses `{{email_1_a}}`, `{{email_1_b}}` or `{{email_1_c}}` (and any further declared letter), Email 2 uses `{{email_2}}`, and optional Email 3 uses `{{email_3}}`. Only Email 1 is a new thread (a new-thread final follow-up stays a planned arm in `copy.md` until an upload path wires it, `/campaign-copywriting` Hard Rule 18).
- Split testing: on platforms with native within-step variants, put one Email 1 variation per declared column on the same step, split evenly across all of them; confirm the platform takes that many with an even split, and stop rather than drop Variant C. Every variant shares the same subject and follow-ups so the body is the isolated test variable. The across-campaign model (one campaign per variant column) is the fallback for platforms without native variants. (Aaron process alignment, operator directive 2026-09-22; supersedes the Variant A + Variant B 50/50 split.)

## Approval loop stop rule

The loop exits automatically when:
- The user gives **zero corrections for 2 consecutive rounds** of 10 leads, OR
- The user explicitly says "lock it, scale up"

On stop:
1. Save the final tuned prompt to `profiles/<business-slug>/personalization-prompt.txt`
2. Save a `client-profile.yaml` metadata entry:
   ```yaml
   personalization_prompt:
     path: profiles/<business-slug>/personalization-prompt.txt
     variant_count: 3
     tuned_at: YYYY-MM-DD
     rounds_to_convergence: 3
   ```
3. Launch the parallel fan-out on the remaining leads.

If the user gives edits on round N+1 after 2 approved rounds, the counter resets and the loop continues.

## Quality checks

Before uploading, manually spot-check 5 random leads per variant. Common issues:
- **Repetition across leads** (sub-agent wrote the same line 10 times) -> retry that batch with diversity instruction. Under B13 this applies to the per-lead generated values (for example the same researched slicing value returned for many different leads); identical body text across rows is the shared body by design, not this failure.
- **Factually wrong claims** (company does X when they actually do Y) -> strengthen "never fabricate" rule in prompt
- **Invented client capabilities** (copy claims a feature, integration, or result the client cannot deliver) -> add the client capability list to the CONTEXT and the "only claim what is listed" rule, then regenerate that batch
- **Unnatural phrasing** (AI-speak like "I was intrigued by..." every time) -> add forbidden-phrases list
- **Hedging / vagueness** ("Your company might be doing X...") -> add rule "assert, don't hedge"

## References

This pattern is self-contained. Do not point operators to reference files unless those files exist in this checkout.

## What to do next

**This is a pattern doc, not a standalone skill.** It's invoked by `/auto-research-public` and `/campaign-copywriting` when they need per-lead personalization at scale.

If you're reading this directly, return to whichever skill sent you here.

## Related skills

- `/auto-research-public` - the primary consumer of this pattern
- `/tam-build`, `/lead-scoring`, `/email-waterfall` - run row-level fan-outs on this pattern's batch-safety rules
- `/phase-3-list` - the phase where those fan-outs run
- `/icp-onboarding` - produces the `client-profile.yaml` the prompt pulls from
- `/campaign-copywriting` - copy principles the prompt enforces, and the home of each slice's approved shared body
- `/ask-aaron` - the source of the shared-body rule (ledger R02, R13) behind B13 in `outreach-copy-framework.md`. Advisory only.
- `/ask-eric` - the live home of the research-then-write separation this skill carries (`eric-doctrine.md` section 7). Advisory only: it never sends, spends, or edits live systems.

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short: record status, not raw output. Full protocol: `client-activity-log.md`.
