---
name: personalization-subagent-pattern
description: Reusable approval-loop pattern for fanning out lead personalization across parallel Claude Code Task sub-agents. Shows the user 1 sample personalization, collects feedback, runs 10 more, approves, runs 10 more, stops when 2 consecutive rounds have zero edits, then scales to the full list. ALWAYS uses Claude Code Task tool sub-agents. Use when any skill needs per-lead custom variables, approved CTA context, or personalized full-body first-touch copy. Any generated initial cold touch must pass the GrowthFlare Framework A gate in outreach-copy-framework.md.
---

# Personalization Sub-Agent Pattern
## Canonical Profile Root

All profiles/<business-slug> paths in this skill resolve under:

```text
<outbound>/profiles
```

Here `<outbound>` is the root of this skill library - resolve it to wherever the library is currently checked out (local Documents, OneDrive, or a git worktree); never hardcode an absolute path. Do not create client profiles under a `profiles/` folder at your current working directory.

Cold email personalization at scale requires per-lead generation. Claude Code's Task tool lets you fan out to many sub-agents in parallel, each personalizing a slice of the lead list. This skill defines the reusable approval-loop pattern.

## GrowthFlare Framework A hard gate

Before a sub-agent generates any complete initial cold email or other first written cold touch, read `<outbound>/reference/outreach-copy-framework.md`. That rule controls the finished message even when personalization is generated per lead. It overrides older word-count, layout, opener, subject, proof, and CTA examples anywhere in this file.

For Email 1, every personalized and fallback body must:

- lead with the specific offer, not a hook, observation, pain setup, or self-introduction;
- contain 25 to 35 words, including the greeting and optional P.S., but excluding the subject and sending-tool signature;
- contain 2 to 3 main-body sentences and exactly one question; an optional declarative P.S. is separate but still counts toward the word cap;
- include a parenthetical workload split naming 3 to 4 real sender tasks and one minimal prospect action;
- end with the single soft permission question;
- use one shared static email subject that is 2 to 4 lowercase words and contains exactly one merge token.

Per-contact subjects, long diagnostic first touches, statement-only opt-ins such as `Just reply "Yes"`, and a second new-thread Email 3 are retired. Follow-ups remain in the same thread and use the follow-up rules from `/campaign-copywriting`.

## Always Task tool, never an API key

This skill runs entirely inside Claude Code via the Task tool. No Anthropic SDK calls, no OpenAI calls. This is intentional:

- **No extra API spend.** Uses your Claude Code plan.
- **No key management.** Works out of the box.
- **Parallel by design.** Claude Code spawns multiple Task sub-agents in one message, letting 100 leads finish in the time it takes to personalize 10.

At very large scale (1,000+ leads), the tuned prompt can optionally be shipped to the Anthropic API for throughput. But TUNING and normal campaign runs (under 500 leads) always go through the Task tool.

## AI/API Routing

AI/API routing applies to what *feeds* the sub-agents, not to the agents themselves — the Task-tool default above stands. Per tier: the research and enrichment that builds each lead's `company_description` and signal context routes per `ai-model-routing.md` (Perplexity for grounding, Spider Cloud for extraction, DeepSeek for crunch). The Task-tool sub-agents remain the default generator for situation and value lines. For high-tier or high-ACV leads, make the clean research packet that feeds the agent richer; for broad or low-tier leads, lean on DeepSeek-crunched context. Use the lead's `deal_value_tier` from the TAM (the free derived contract-value estimate) as the tier signal: a `high` or `mid` tier justifies the full per-contact written body; a `low` tier leans on static copy or a single AI line. Match the personalization rung to the account's likely value — never spend heavy per-contact effort on a low-value lead, and never under-personalize a high-value one. (Caveat: when the list's `deal_value_tier` is nearly constant, the ICP is uniform and tiering adds little — keep depth consistent.) Final sendable copy still follows `/campaign-copywriting` (Claude API). Do not replace Task sub-agents with a raw API key for normal runs — the optional 1,000+ at-scale path above is the only exception.

## The approval loop (before full fan-out)

Don't personalize 500 leads and then discover the prompt is wrong. Loop first, then scale.

### Round 0 - Sample on 1 lead

1. Pick one lead from the batch with a rich `company_description`.
2. Show the user: "Here's the company description I'm working with. Based on this, what would you say to personalize?"
3. Display what YOU would generate for `situation_line`, `value_line`, and CTA context only if the approved campaign structure needs it.
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
   Lead                  | situation_line                          | value_line                    | cta_context
   jane@acme.com         | Specific observed context               | Specific value tie-in         | Approved deliverable context
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

**No-duplicate-output guard (HARD RULE — the safe fan-out contract from `/autonomous-execution-policy` section 9).** Parallel agents can't see each other's work, so fanning out without a guard produces duplicates. Enforce all three layers, every run:

1. **Disjoint inputs.** Partition leads so every `lead_id` goes to exactly one agent×variant. Verify the batches cover the whole slice with zero overlap before launch — no lead personalized twice.
2. **Disjoint output targets.** Each agent writes its own `/tmp/personalization-<batch-id>.json` (or `/tmp/prewrite-<batch-id>.json`), never a shared file, then you merge by `lead_id`. This is already the pattern below; never collapse it to one shared output file (concurrent writes double-append or clobber).
3. **Post-merge uniqueness check.** After merging, scan for convergent duplicates — different leads that got near-identical lines (the "Repetition across leads" failure in Quality checks below). De-dupe by content and re-run the offending batch with an explicit diversity instruction. Partitioning stops overlap; only this step catches convergence.

After the merge, verify the row count and coverage against the input slice before reporting done — a dropped or double-counted batch is the silent partial the verify-before-done rule exists to catch.

## When to use

- Any campaign where per-lead custom variables are needed (beyond just {first_name})
- When you have 50+ leads and want personalization without manual writing
- When `/auto-research-public` or similar orchestration skills need parallel personalization

## Don't use this for

- Small batches under 20 leads: just personalize inline in the main conversation.
- Static copy: personalization wastes tokens.

## The pattern

### 1. Prepare the lead batch

**List Gate (inherited).** This pattern emits sendable per-lead copy (`situation_line`, `value_line`, CTA context), so it runs only after the verified-list gate passes for the slice (`verified-list-gate.md`): the lead batch must be drawn from this slice's `leads.verified.csv` (from `/email-waterfall`), and the campaign strategy must be locked. If there is no verified slice, STOP and route to `/email-waterfall` — do not personalize a speculative or unverified list. (The calling skill enforces the grade-B condition.)

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

The richer the `company_description`, the better the personalization. If you only have company names, the output will be generic.

### 2. Define the output schema

Decide up front what fields each sub-agent must return. Example:

```json
{
  "lead_id": "<same id>",
  "situation_line": "<1 sentence: what you noticed about their company>",
  "value_line": "<1 sentence: connecting their situation to your offer>",
  "cta_context": "<optional context for the approved CTA, not a new final CTA>"
}
```

Fewer fields = less that can go wrong. Default to 3 fields maximum per variant.

Alternatively, in the pre-written copy path the sub-agent returns one full email body per live sequence slot (`email_1_a`, `email_1_b`, `email_2`, and optional `email_3`) instead of fragments. The sending tool then receives a complete email rather than a template to assemble. This full-body column model is the standard for genuine per-contact personalization; the fragment fields above (`situation_line`, `value_line`, `cta_context`) are the lighter alternative for lists that only need one or two variables dropped into an otherwise-shared body. See Pre-Written Email Copy Architecture (full email body mode) below.

Do not generate final CTA wording inside personalization unless `/campaign-copywriting` explicitly designed that field. If a CTA field is required for Email 1, every value must preserve the approved deliverable and the one exact soft permission question required by `outreach-copy-framework.md`. Later follow-ups use their approved slot CTA. Every finished body must pass `outreach-copy-framework.md` where applicable, `spam-word-checker.md`, and `cold-email-copy-best-practices.md`.

### 3. Split into variants (A/B/C)

If testing 3 copy variants, run 3 parallel sub-agents per company (or per batch). Each gets a different *angle* prompt:

**The three signal-first variant angles below are RETIRED (2026-07-17), superseded by the offer-led opener (`/campaign-copywriting` Hard Rule 19).** Every one of them opens on the signal, which the opener no longer carries. The A/B/C mechanic itself is LIVE and unchanged; what varies across variants is now the OFFER framing (which dream outcome, which risk reversal, which pain the offer points at), not the opener's signal shape. Signals pick the SLICE that gets each campaign and offer. A slice-SHARED signal fact may ride inside the offer sentence (Hard Rule 38), never in Line 1, and per-contact signal copy stays retired (Hard Rule 34).

Retired reference, the three angles as they stood:

- **Variant A**: Lead with the signal and the cost it implies (signal-first; never "I noticed" or "Noticed"). "X has been open 40 days. Every week it stays open, Y compounds."
- **Variant B**: Lead with a diagnostic question tied to the signal. "Still reconciling W by hand after the [round]?"
- **Variant C**: Lead with a pure-fact memo plus a routing question. "You run N locations on one tool. Handling Z internally, or...?"

These mapped to the four Signal-First Execution Patterns in `/campaign-copywriting`, themselves retired 2026-07-17. **The two bans in that sentence survive intact and never depended on the opener shape:** no variant, and no line anywhere in the email, may use an observational opener ("I noticed", "I saw that", "Congrats on") or an em dash.

This gives you 3x the data from one list, so you can A/B/C test which angle resonates.

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

Every personalization sub-agent gets a prompt of this shape:

```
You are personalizing cold email fields for N leads.

CONTEXT:
- We sell: <one sentence from client-profile.yaml>
- Our ICP: <one sentence>
- Our offer: <the CTA we're asking them to respond to>
- Tone: <casual | formal | peer-to-peer>

FIELDS TO GENERATE (per lead):
- situation_line: <definition + 1 good example + 1 bad example>
- value_line: <definition + 1 good example + 1 bad example>
- cta_context: <definition tied to the approved deliverable; omit if not needed>

RULES:
1. Never fabricate facts. If the company description is thin, say something generic but not false. This cuts both ways: never invent facts about the prospect, and never claim a capability, feature, integration, or result the client cannot actually deliver. Only make claims the provided CONTEXT supports.
2. Never use em dashes. Use periods or commas.
3. Never use a colon to carry a long list or proof stack.
4. Never use comma-wrapped company descriptors.
5. Never use the word "leverage", "synergy", "ecosystem".
6. Maximum length: <N words per field>.
7. If a lead is missing company_description, return "<fields cannot be generated: skip>"

LEADS:
<JSON array>

RETURN:
A JSON array with the same lead_ids and the personalization fields. Save to /tmp/personalization-<batch-id>.json and print "DONE" when complete.
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
     "variant_a": { "situation_line": "...", "value_line": "...", "cta_context": "..." },
     "variant_b": { ... },
     "variant_c": { ... }
   }
   ```
4. When uploading to EmailBison/Smartlead/Instantly, map each field to a custom variable. Convention:
   - EmailBison: use `{SITUATION_LINE_A}`, `{VALUE_LINE_A}`, etc.
   - Smartlead: use `{{situation_line_a}}`, `{{value_line_a}}`, etc.
   - A/B is best run **within one campaign** (Variant A + Variant B on the same step, split 50/50) where the locked `run_state.sending_platform` supports it. For the exact setup, use the campaign-upload skill for that platform, if `/stack-setup` activated a pack that provides one (e.g. `/smartlead-campaign-upload-public`, where the 50/50 setting is `MANUAL_EQUAL`). If no pack is active, set the split in that platform's native campaign builder. If neither exists, say so and build the split by hand rather than implying coverage. Uploading `variant_a`→campaign A / `variant_b`→campaign B (across-campaign) is the platform-agnostic fallback only.
   - Pre-written copy path (full email body mode below): the variable IS the whole email body. Smartlead `{{email_1_a}}`; EmailBison the same field with its custom-variable syntax.

## Pre-Written Email Copy Architecture (full email body mode)

The sections above generate field fragments (`situation_line`, `value_line`, `cta_context`) that the sending tool assembles into a template. This mode is the alternative: each sub-agent writes the ENTIRE email body per contact, and the sending tool receives one ready-to-send field per email slot. This is the canonical generation prompt for the pre-written copy path described in `/campaign-copywriting` (Pre-Written Email Copy Architecture). Use it when each contact needs a genuinely relevant version of the same approved offer and you want full quality control visible before export. The same approval loop, batch sizes, and fan-out code above apply; only the output schema and prompt change.

This pattern is tool-agnostic. In this repo it runs on Task sub-agents, but the same prompt drops into a Clay AI column (or RevCode, Claude Code, or equivalent enrichment tool), a Claude Code CSV script, or any equivalent pipeline. What matters is that the full email is written before it reaches the sequencer.

### Output columns (per-contact bodies)

Each sub-agent returns, per lead, one complete body for every live step in the single-thread sequence:

- `email_1_a` = full Email 1 body, Variant A (personalized or fallback)
- `email_1_b` = full Email 1 body, Variant B (personalized or fallback)
- `email_2` = full Email 2 body, single variant (no split)
- `email_3` = optional full Email 3 body, single same-thread follow-up

Every body column holds the BODY only, with no subject, sign-off, or signature inside the cell. The greeting and first name are baked into Email 1 so the sending-tool step needs no separate first-name token. Email 2 and optional Email 3 are same-thread follow-ups. When their text is shared across the list, write it once and broadcast it into every row's column rather than inventing weak personalization. Email 1 uses one shared static subject on the sending-tool step. That subject must be 2 to 4 lowercase words with exactly one merge token. Do not create per-contact subject columns.

### Personalized or fallback in the same column

There is no separate fallback column. Each `email_*` column holds either a personalized body or a fallback general body, decided inside the generation prompt per row. The sending tool receives `{{email_1_a}}` for every contact and never needs to know which version was generated. Personalization may adjust truthful offer phrasing, but it must not insert a hook before the offer or break the Framework A mechanics.

### The full-body sub-agent prompt

Use this prompt shape (one variant per run; loop A then B). Adapt the CAMPAIGN CONTEXT per campaign. It handles the personalized-or-fallback decision per row. Every Email 1 output passes `outreach-copy-framework.md`, then `spam-word-checker.md`, then `cold-email-copy-best-practices.md` before export.

> **LIVE MODEL:** Email 1 is the only new-thread message and must follow GrowthFlare Framework A exactly. Email 2 and optional Email 3 are same-thread follow-ups. There is no Email 4, second new thread, per-contact subject, or long personalized exception for Email 1.

```
You are writing one cold email body per lead for [Campaign Name].

CAMPAIGN CONTEXT (same for every lead):
- Target ICP: [role, company type, pain segment]
- Offer and framing: [what you offer; MQL or SQL framing]
- Proof: [one peer-company outcome; describe company type and result, do not name the company]
- Risk reversal: [the guarantee or no-commitment framing]
- Client capabilities (the ONLY claims you may make about us): [bullet list of the client's real, deliverable features, integrations, tools, and outcomes, from client-profile.yaml + offer-intelligence.md + the locked offer]. Do not state anything about what the client does or offers that is not on this list.
- Variant: [A = primary pain angle | B = alternative pain angle]
- Framework A offer sentence: [the approved specific free deliverable or offer, stated first]
- Framework A workload split: [3 to 4 real tasks we will do; one minimal action the prospect must take]
- CTA for THIS slot: [Email 1 must use the approved single soft permission question and nothing else; later follow-ups use the exact CTA assigned upstream by /campaign-copywriting]. Do not invent a lead magnet or a second question.

CONTACT DATA PER LEAD (read the WHOLE row, not a fixed subset):
You are given the contact's ENTIRE data point set — every contact-level column AND every company-level column on their row (the `co_*` company signals joined onto the contact). Common ones: first_name, company_name, job_title, seniority, function, department, tenure/new-in-seat, location, linkedin_post_hook, campaign_reason, signal_field, company_description, plus any collected `co_*` company signal (sold-to vertical, size, tech, hiring, funding/why-now, pricing, etc.) and any other column present. Read all of them. Do not assume the list is only the fields named here — scan whatever columns the row actually carries.

PERSONALIZATION DECISION LOGIC (per lead):
Check each source in order. Use the first that holds a specific, usable value AND connects directly to the email's core pain angle. Skip any data point with no logical bridge to the email's operational context, even if available.
1. linkedin_post_hook, only if the post topic connects to the email's operational angle
2. campaign_reason, if it carries a specific qualifying detail tied to the email's pain angle
3. signal_field, if it carries a specific data point that connects to the email's operational context
4. company_description, for an industry or role-based angle that leads into the pain
5. If none pass, write the fallback general copy using the fallback opener above, into the same column.

DATA-DRIVEN RELEVANCY (light touch; the offer NEVER changes):
The offer / lead magnet is IDENTICAL for every contact in this campaign. Do NOT change WHAT is offered — only make small improvements to HOW it is phrased for THIS contact, using whatever is genuinely relevant in their full data set (role/seniority/function is ONE input among many, never the whole scheme — also weigh their tenure, department, location, the company's sold-to vertical, size, tech, hiring, why-now, and any other column on the row). The goal is a LITTLE lift in relevancy IF the data offers any — not a fancy bespoke email.
- Read the whole row. When a data point genuinely bears on the email's pain angle, let it shape the phrasing: which proof point you pick, which stat, where the pain emphasis lands, the word choice. A different role or a different company signal will legitimately pull the framing in a different direction.
- Keep the SAME offer, the SAME risk reversal, and the SAME CTA deliverable. Keep the same core structure. The per-contact version stays close to the shared offer-led copy; you are nudging relevancy, not rewriting the email.
- If nothing in the row adds real relevancy, write the shared / fallback copy into the column unchanged. NEVER manufacture a personalization the data does not support, and never stretch a weak data point into a forced hook. No relevant signal means keep it clean and general — that is the correct output, not a failure.

NO DUMB PERSONALIZATION (hard):
Use the data to inform the ANGLE, never to name the data back at the prospect. NEVER mention the contact's job title or role in the copy ("As CTO, you…", "In your role as Head of Ops…", "for a Founder like you") — this is banned. NEVER echo a raw data field as surface mail-merge ("I see you're in SaaS", "noticed you're based in Berlin", "as a 200-person company"). The prospect should feel the email is relevant, not that a field was pasted in. Always use the IMPLICATION of the data point, never the data point itself (see OPENER DISCIPLINE below) — if a line only works because you named a fact about them, delete it. A line that would read as a mail-merge if the field changed is dumb personalization and fails.

SUBJECT LINE (shared static):
Email 1 uses ONE shared subject set upstream on the sending-tool step. It must contain 2 to 4 lowercase words and exactly one merge token. Do not return any subject field per lead. Follow-ups inherit the thread.

EMAIL 1 STRUCTURE TO WRITE:
Sentence 1 opens with the approved specific offer. Do not put a hook, observation, pain setup, proof block, homepage summary, or self-introduction before it.
Sentence 2 is the mandatory parenthetical workload split: `(We'd [task 1], [task 2], and [task 3]; you'd only [minimal action].)` Add a fourth sender task only when it is real and the body still fits the word cap.
Sentence 3 is the only question and the final sentence: `Would that be worth hearing more?` Use the exact approved soft permission wording when the campaign has locked a truthful equivalent.
The complete body, including greeting and optional P.S., must be 25 to 35 words. Optional proof belongs in a declarative P.S. only when it is true, directly supports the offer, and still fits the same cap. The P.S. is separate from the 2 to 3 main-body sentence count and cannot contain a question. Do not use `Just reply "Yes"` in Email 1.

FOLLOW-UP STRUCTURE:
Email 2 and optional Email 3 stay in the same thread. Use the follow-up structure and assigned CTA from `/campaign-copywriting`; do not reapply the 25 to 35 word Framework A skeleton to them.

SIGNAL DISCIPLINE (signal, not observation). Scope corrected 2026-07-17: this used to read "apply to Line 1", which assumed the opener carried the signal. Line 1 is now OFFER-LED and carries no signal (Hard Rule 19), so apply this test to ANY line that states a signal fact, wherever it sits in the body. The test itself is unchanged and every ban below is in force.
Start from the IMPLICATION of the data point, not the data point itself. If a line describes what you saw, noticed, or came across, it is an observation, not a signal line. Rewrite from what the signal MEANS for this prospect. The prospect does not care that you found the information; they care what it changes for them. Avoid all six failure modes (each shown wrong -> right, and read each for the TEST, not for the opener shape: every "right" line below sits in the body, never in Line 1):
1. Plain observation. "I saw [Company] is hiring SDRs." -> "[Company] has [N] SDR roles open right now. That usually means the pipeline engine is being built from scratch."
2. Complimenting the signal. "Congrats on the Series B, really impressive growth." -> "Series B at [Company]'s stage usually means the next 90 days are all hiring and systems. Is GTM infrastructure on the list?"
3. Naming the fact, no implication. "I noticed [Company] has a Head of Marketing role open." -> "Head of Marketing open for [X] days means someone is running the function without a clear owner. Is that falling on the founder right now?"
4. Generic pain before the signal. "Most companies at your stage struggle to hit pipeline targets. I saw you have a VP Sales role open." -> "VP Sales role open for [X] days is a long time to run a sales org without a head. Who owns quota right now?"
5. Signal buried behind a pitch. "We help B2B companies scale outbound. I noticed you're hiring an SDR." -> "[N] SDR roles open at [Company]. That volume usually means the current list-building process cannot keep up with demand."
6. Signal as flattery bridge. "[Company] was named one of the fastest-growing in [region], really impressive, made me think you might have scaling challenges we could help with." -> "[Company] scaled to [headcount] in [timeframe]. Teams that grow that fast usually hit the same three operational walls in the same order. Is [specific wall] one of them?"
(Full bank: /campaign-copywriting Signal-First Anti-Patterns.)

HARD CONSTRAINTS:
- Plain text only. No bullets, bold, links, or HTML styling. Blank lines between blocks are required and are NOT "formatting" in this sense.
- For Email 1, use the compact 2 to 3 sentence Framework A layout: offer sentence, parenthetical workload split, then the single soft permission question. Blank lines between these short units are allowed. Follow-ups use their approved same-thread layout.
- Start the body with the greeting and the contact's first name baked in (for example `Tommi, ...`) so the sending tool needs no separate first-name token. After `{first_name},` the next word is lowercase unless it is a proper noun (company, product, brand, acronym) — the greeting and opener are one sentence. WRONG: `Tommi, Each month ...`. RIGHT: `Tommi, each month ...`. Proper-noun opener keeps its capital: `Tommi, Acme just migrated ...`.
- Grammar must be clean and every sentence must read naturally aloud. No awkward constructions, run-ons, comma splices, or dropped connective words. Keep the "where", "that", and articles a sentence needs to parse on the first read.
- No em dashes anywhere.
- No fake warmth or warmup. NEVER write "hope you're well"/"hope this finds you well", "just checking in"/"following up"/"following up on my last"/"circling back"/"touching base"/"bumping this", "I wanted to reach out"/"connect", unearned flattery ("big fan of what you're building"), any phrase implying shared history, or any warmup sentence before the first relevant line. Personality lives INSIDE the first relevant line (a point of view plus spoken rhythm), never in a preamble.
- Said-out-loud test: the body must sound like a busy, competent person talking to a peer, never a brochure or textbook. Do not add a human-framing preamble before the Email 1 offer. Follow-ups may imply the prior touch without using fake-follow-up phrases.
- Capability truth. Only make claims about the client that appear in the client capabilities list above. Never invent a feature, integration, tool, metric, or outcome the client cannot deliver. If the data to support a claim is not provided, leave it out. This is the at-scale version of the offer's deliverable gate: a fabricated capability produces replies the client's sales team cannot fulfill.
- No dumb personalization (see DATA-DRIVEN RELEVANCY above). The data informs the angle, never gets named back at the prospect. NEVER mention the contact's job title or role in the copy, and never echo a raw data field as surface mail-merge. Use the implication of a data point, never the data point itself. If a line only works because you named a fact about them, cut it. Light touch: when the row adds no real relevancy, ship the clean shared copy — do not manufacture a hook.
- The BODY cell is body only, with no subject text, sign-off, or signature inside it. The signature is appended in the sending tool. Email 1 uses one shared static subject on the step, never a per-contact subject field.
- Email 1 ends with exactly one question: the approved soft permission close. It cannot use a statement-only opt-in or contain any earlier question. Email 2 and optional Email 3 use the approved same-thread follow-up CTAs.
- Write 1-to-1: first-person singular ("I"), one person to one person. Use "we"/"us" only for a genuine team or company fact that cannot honestly be said as "I". Frame the client's value around the prospect ("you're one of the few who..."), not "we help teams like you." Do not over-apply into stilted copy.
- Email 1 is always 25 to 35 words, including the greeting and optional P.S. There is no longer personalization exception. Follow-ups stay under the separate cap set by `/campaign-copywriting`.
- Output the complete email body only.

LEADS:
<JSON array>

RETURN:
A JSON array with the same lead_ids and one field named for the slot you are writing (`email_1_a`, `email_1_b`, `email_2`, or optional `email_3`). Return no subject field. The shared Framework A subject is set once on the sending-tool step. Email 2 and optional Email 3 are shorter replies that continue the same thread. Save to /tmp/prewrite-<batch-id>.json and print "DONE".
```

### Quality control before export

After the columns are populated, run this before exporting to the sending tool:
- [ ] Sample 10 random rows of `email_1_a`. Does each body open directly with the same approved offer?
- [ ] Does each Email 1 body contain 25 to 35 words, 2 to 3 main-body sentences, exactly one question, the mandatory workload parenthetical, and the soft permission close as its final main-body sentence? If present, is the P.S. declarative and included in the word count?
- [ ] Is the single shared Email 1 subject 2 to 4 lowercase words with exactly one merge token? Confirm there are no per-contact subject columns.
- [ ] No dumb personalization: in the sample, does ANY body or subject name the contact's job title/role ("As CTO…", "for a Founder like you") or echo a raw data field as surface mail-merge ("I see you're in SaaS", "based in Berlin")? Any such row fails — the data must inform the angle via its implication, never be named back. Fix the prompt and regenerate.
- [ ] Light touch, not forced: are the per-contact bodies still close to the shared offer-led copy (a relevancy nudge, not a bespoke rewrite), and did rows with no real relevancy signal get the clean shared/fallback copy rather than a manufactured hook?
- [ ] In that sample, does any personalization insert a hook, signal, observation, or pain setup before the Email 1 offer? Any such row fails.
- [ ] Find rows where all personalization fields were empty or irrelevant. Did they get the clean fallback Framework A body in the same column?
- [ ] Is every body written 1-to-1 (first-person "I"; "we/us" only for a genuine team/company fact)?
- [ ] Does every Email 1 use the compact offer, parenthetical workload split, and soft-question structure without extra blocks?
- [ ] After the `{first_name},` greeting, is the next word lowercase unless it is a proper noun? (no `Name, Each ...` mid-sentence capital — check every `email_*` column, since the greeting is baked in)
- [ ] Zero fake-familiarity/warmup phrases in any column ("hope you're well," "just checking in," "following up on my last," "circling back," "touching base," "bumping this," "I wanted to reach out/connect," unearned flattery), and no warmup before the first relevant line?
- [ ] Does every body pass the said-out-loud test? Do Email 2 and optional Email 3 imply the prior touch without using fake-follow-up phrasing?
- [ ] Does Email 1 end with its one assigned soft permission question and no other question or statement-only opt-in? Do follow-ups use their assigned same-thread CTAs?
- [ ] Offer honesty: no invented offer, workload step, proof claim, or lead magnet in any row.
- [ ] Does every body read naturally aloud, with clean grammar and no dropped connective words ("where", "that", articles)?
- [ ] Does every claim about the client's product map to a real, provided capability? No invented features, integrations, tools, or results the client cannot deliver. Spot-check the proof line and any "we do X" claim against the client capabilities list.
- [ ] Any blank `email_1_a` rows? A blank means the generation step errored. Investigate. Do not send blank rows.
- [ ] Do `email_1_a` and `email_1_b` read as genuinely different angles, not light tweaks?
- [ ] Any em dashes in any row? Fix the prompt and regenerate.
- [ ] Any signature or sign-off baked into a body column? Strip it. The signature belongs on the sending-tool step only.
- [ ] Every Email 1 row passes `outreach-copy-framework.md`, then every row passes `spam-word-checker.md` and `cold-email-copy-best-practices.md`.

### Export and upload

Filter to rows where `first_name` and `company_name` are non-empty and all required `email_*` columns are non-empty. Only export rows that pass. Then upload:
- Smartlead: every email step body is just its column variable plus the signature on the step. Email 1 uses `{{email_1_a}}` or `{{email_1_b}}`, Email 2 uses `{{email_2}}`, and optional Email 3 uses `{{email_3}}`. Only Email 1 is a new thread.
- EmailBison: same, using EmailBison's custom-variable syntax for the body field.
- Split testing: on platforms with native within-step variants, put Email 1 Variant A and Variant B on the same step and split 50/50. Both variants share the same subject and follow-ups so the body is the isolated test variable. The across-campaign model is the fallback for platforms without native variants.

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
- **Repetition across leads** (sub-agent wrote the same line 10 times) -> retry that batch with diversity instruction
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
- `/icp-onboarding` - produces the `client-profile.yaml` the prompt pulls from
- `/campaign-copywriting` - copy principles the prompt enforces

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short — record status, not raw output. Full protocol: `client-activity-log.md`.
