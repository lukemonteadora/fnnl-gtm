This file is the house stepwise copy flow of `/campaign-copywriting` (Required Guardrails, How This Skill Works, Input Sources, Offer Architecture, Steps 1 to 4 and Final Reminders), moved verbatim from `../SKILL.md` on 2026-09-28 (the launch-review pointer in How This Skill Works was updated the same day to the phase map). Read it only when the operator asks for the house copy flow; that draft then goes to Aaron, who still decides. The AI/API Routing rule (native Claude Code session) stays in `../SKILL.md` because it binds every path. Words like "above" and "below" refer to the original single-file order; the "Where the rest lives" table in `../SKILL.md` says where each named section now is.

## Required Guardrails

Before writing or reviewing any campaign copy, apply these files in order:

1. `outreach-copy-framework.md`
2. `spam-word-checker.md`
3. `cold-email-copy-best-practices.md`

`outreach-copy-framework.md` is the source of truth for the first written cold touch across every outreach channel. For cold email, it controls the Email 1 structure, length, question count, workload parenthetical, CTA position, and subject shape.

`spam-word-checker.md` is the source of truth for formatting bans, CTA and opener bans, the buzzword and jargon-metaphor ban list, fake-familiarity bans, the implication test, and unsubscribe/closeout logic. Note its enumerated spam-keyword list was REMOVED 2026-09-18 by operator directive, so do not expect a generic banned-word lookup: the named ban lists above are what it still holds, and real placement problems route to `/email-deliverability-audit` or `/deliverability-incident-response`.

`cold-email-copy-best-practices.md` is the source of truth for writing quality, readability, inbox-rate discipline, personalization standards, CTA friction, and sequence quality.

If any draft fails any required guide, rewrite internally until it passes. Do not show failed copy as an option.

---

## How This Skill Works

This skill operates like a structured intake flow. Under `review_gates`, confirm key decisions before final copy is produced. Under `auto_execute` (the new-client default since 2026-09-24), steps 1 to 3 run without a stop: pick the recommended direction, first-line strategy and structure, record them in `copy.md`, then write the final copy. Every QA gate below still applies in full, and the operator reviews the copy at the launch review (checkpoint B, `/phase-4-copy-launch`; `outbound/reference/phase-protocol.md`).

The single-thread 2-to-3-step flow:

1. Confirm campaign direction.
2. Confirm subject line and first-line strategy.
3. Confirm body structure.
4. Output final copy and matching `variants.yaml`.

At each confirmation step, present 2 to 3 strategy options with a recommendation. Keep options focused on direction and structure. Do not present any copy that has not passed the Copy QA Gate.

---

## Input Sources

You may receive:

- campaign strategy document
- website URL
- client context
- onboarding form
- call transcript
- account manager notes
- existing campaign performance
- lead list or account research

When working from a profile folder, read the saved artifacts before choosing copy direction:

- `profiles/<business-slug>/client-profile.yaml`
- `profiles/<business-slug>/campaign-plan.md`
- `profiles/<business-slug>/campaign-strategy.md`
- `profiles/<business-slug>/lead-magnets.md`
- `profiles/<business-slug>/_research/pain-clusters.md` (from `/market-evidence`): the pain clusters and their **Language bank** (3 to 8 verbatim buyer phrases per cluster, each with its evidence ID). The first place to look for the buyer's own words. Four places draw their wording from it: the offer sentence, the P.S., Email 2's objection job (a pre-handled concern, Hard Rule 21), and the pain line of the labeled pain-first arm. The offer arm's `cluster_ids`, `evidence_ids` and `pain_angle` (`offer.validation_arms` in `client-profile.yaml`, or the primary's block; per segment in `offer.segments` when the client has per-buyer-type offer sets) say which clusters this campaign's copy answers. Every pain, objection or workaround line traces to a cluster here or is phrased as a question (Copy QA Gate), so the pain-first arm runs only on a cluster: its pain line opens the email, and a question-form pain opener stays banned.
- `profiles/<business-slug>/offer-intelligence.md`: its **First-Party Buyer Voice** section (the buyer's words from the client's own won and lost calls) and that section's **Offer language rewrite** line (the buyer's words the offer should adopt, and the client jargon each one replaces). Same four uses as the Language bank.
- With no `pain-clusters.md` yet (a client whose research predates the evidence ledger), the missing research routes to `/offer-intelligence` Step 0, which seeds the ledger from the legacy research files, then to `/market-evidence` synthesize. It never holds the offer-led copy, which carries no pain line by default; until the clusters exist, any pain, objection or workaround line is phrased as a question.
- `profiles/<business-slug>/social-proof-bank.md` (from `/social-proof-bank`): the client's copy-ready proof + trigger bank. The **first** place to look for a segment-matched proof line (its `one_liner`); a `proof_status = on_file` row is ready evidence, a `gap_block` row is the gate firing. (The `poke_the_bear` diagnostic-mirror opener it also holds is retired with proven-mode; use only the proof.)
- `profiles/<business-slug>/client-intel.md`: this bullet now lives in `../SKILL.md`, section "Client intel read (Input Sources)", because it binds every path.
- `profiles/<business-slug>/campaigns/<campaign-slug>/lead-source-plan.md`: **required** when producing sendable copy (the List Gate's locked-strategy condition), not optional
- `profiles/<business-slug>/campaigns/<campaign-slug>/leads.verified.csv` + the slice's `/list-quality-scorecard` result: **required** (the List Gate); the verified slice is what the copy is written for

Treat saved campaign artifacts as the source of truth over chat memory. Do not drift away from the locked offer, lead magnet, proof constraints, or campaign role unless the user explicitly changes them.

If given only a website, research it before Step 1.

If information is missing but the work can proceed with a reasonable assumption, state the assumption. Ask only when the missing context materially changes the campaign.

---

## Offer Architecture (complete before writing Email 1)

Run this gate before Step 1 produces any direction and before a single line of copy is written. Offer selection happens upstream in `/offer-intelligence` and `/lead-magnet-brainstorm`; this is the copy-time confirmation that the locked offer is actually sendable. If you cannot answer all three questions cleanly, the offer is not ready. Fix the offer first. Sequence structure and copy quality cannot compensate for a weak or high-friction offer. Walk Aaron's diagnostic top-down and stop at the highest broken item (doctrine §2): 0) the buyer is real and specific; 1) the offer is a concrete thing (what they get, how fast, what they must do, what risk they take), not a company description; 2) every yes it produces can be honored (the agency honors test yeses by default, a client-only offer needs the client's OK, and full-volume capacity is asked after the test in `/offer-test-slate`); 3) only then, the copy leads with the offer and every word is true; 4) one easy next step, with each follow-up earning its place; 5) it is judged on the right number, never reply count alone.

**Frame it on the value equation and the Four Concretes (offer-first, HARD).** Before the three questions below, confirm the offer is built on the value equation ((dream outcome × perceived likelihood) ÷ (time × effort)) and that the locked offer names Four Concretes #1, the specific deliverable (the one-line offer), which is the only one required. The other three, (2) the differentiator, (3) a quantified outcome number, and (4) the named recognizable proof plus its number, are captured when they exist and never required (operator decision 2026-09-23, Aaron pre-launch gap audit). A missing concrete is handled two-tier like the Proof-Asset Gate: hollow-without-it → hold the angle, fire the proof-asset request, ship an honest interim that describes the outcome without a fabricated number; would-only-strengthen → flag, ship the concrete-as-possible version, upgrade when it lands. Never invent the number. Apply the equation Aaron's way (doctrine §4): the outcome is implied through the deliverable, likelihood rises by shrinking what is judged, time collapses with a date-certain free deliverable, and effort shrinks to one act. The reader must be able to answer what's in it for them, how long it takes, and what they have to do. Full definition: the Offer-First Copy Standard above and `cold-email-copy-best-practices.md` → Build the offer on the value equation.

**Question 1: SQL or MQL framing?** SQL (Sales Qualified Lead): the prospect commits to a sales conversation. Higher friction. Use when the offer is naturally easy to say yes to, with clear pain, obvious ROI, and low switching cost. MQL (Marketing Qualified Lead): the prospect raises their hand for a resource, deliverable, or insight. Lower friction. Use when the offer requires behavior change, a crowded market, or a long sales cycle. If unsure, default to MQL framing. You can escalate to SQL after they engage.

**Question 2: Easy-to-say-yes-to test, plus Aaron's "why not?" test and the farming-interest check (operator-approved Aaron alignment, 2026-09-21).** Read the offer out loud. Would someone say yes to this on a busy Tuesday afternoon without needing to ask their boss? That is his "why not?" test (doctrine §4): if the reader pays little, does little work, and genuinely wants the thing, why wouldn't they say yes? Then the farming-interest check: is it "specific enough to filter out those who don't and compelling enough to pull in those that do"? A broad question anyone can say yes to fails, however easy it is. If it fails, chunk DOWN: name a specific, concrete deliverable that is interesting on its own and speaks to the end result the buyer wants. Never chunk up into a service description or a bare outcome promise with no risk term ("we help [ICP] increase [outcome]"): that is his named weak offer, a description of the service instead of the result (doctrine §6). An outcome conditional paired with its risk term is a different thing: the default for a trial, pilot or pay-on-result offer and a labeled arm otherwise (doctrine §4; operator-approved Aaron alignment, 2026-09-21; operator decision 2026-09-23, Aaron pre-launch gap audit).

**Question 3: What is the risk reversal?** Name exactly one: pay-on-results (with the outcome, attribution, exclusions, and timing defined, doctrine §3), no-commitment trial, free deliverable first, or conditional engagement (build it first, pay only if satisfied). Never a money-back guarantee (examples §5: "incredibly washed out"; removed under the operator-approved Aaron alignment, 2026-09-21), and never a performance guarantee on the core service as the front end (his named bad offer, doctrine §6). The default is casual risk elimination: free until the result (examples §5). If none apply, the offer is harder to say yes to than it needs to be. Do not proceed until one is identified and documented. Whatever you name must still pass the Confirmed Deliverable Gate above. Only promise what someone will actually honor after a positive reply: the agency by default, the client only with `lead_magnet_client_ok: yes` (Confirmed Deliverable Gate).

Record the SQL/MQL decision and the risk reversal in Step 3 before writing final copy.

---

## Step 1: Confirm Campaign Direction

### What To Do Silently

0. **Check the List Gate first** (see List Gate above): confirm `leads.verified.csv` exists for this slice, it passed `/list-quality-scorecard` at grade B or better with a list-QA PASS (`verified-list-gate.md` condition 2), and the strategy is locked. If any fails, STOP and route to the producer: do not start copy.
0a. **Opt-out handling (always the FNNL house default, never asked; operator directive 2026-09-30).** This item now lives in `../SKILL.md`, section "Compliance: the opt-out ruling (Step 1, item 0a)", because it binds every path. Run it there.
1. Read all provided context.
2. Identify target audience.
3. Identify the trigger or reason this audience is being contacted.
4. Identify the core pain, desired outcome, or business situation.
5. Identify the offer and proof points.
5a. **Select the most relevant proof point for this specific segment or ICP.** Look in `social-proof-bank.md` first: it is already mapped one row per ICP segment × service line, so the segment-matched row hands you the real result and the copy-ready `one_liner`. (The `poke_the_bear` diagnostic-mirror opener is retired with proven-mode; use the proof `one_liner` only.) Do not default to the most prominent case study if a more relevant one exists or if it is a poor fit. Use this selection hierarchy:
   - Direct match (same industry, similar company size, same geography): use with full metric if available. Wherever it is used, the proof is one point at most, in the P.S. or deferred to Email 2, never in lines one or two (doctrine §9, examples §6); a near-twin case can instead become the deliverable's target (examples §1.5).
   - Close match (adjacent industry or similar challenge): use with careful framing; do not claim cross-industry metrics as if they are directly applicable.
   - No match (available case studies are too different in industry or situation): if the angle does NOT need proof, omit the proof reference and let the offer carry the email (Aaron's shortest documented winner carried "no logos, no revenue figures, no case studies", examples §1.2). If the email feels thin without proof, the fix is the offer, not the CTA: fix the offer (doctrine §2); never downgrade Email 1 to a meeting ask (ledger R17). This replaces the old "downgrade the CTA to a conversation or in-body observation deliverable category" fallback (operator-approved Aaron alignment, 2026-09-21). But if the angle's credibility actually needs a named client, a case study, or an exact number you do not have, do NOT silently omit it. Apply the Proof-Asset Gate (see below): be blunt about the gap and collect the real proof from the client via the fill-in form before shipping hollow copy.
   Never reference a proof point that would confuse the recipient, feel irrelevant, or require them to make a logical leap the email does not bridge.
6. Identify useful variables and remove variables that would create obvious or forced personalization.
7. Confirm the selected campaign's offer, lead magnet, and CTA direction match the saved campaign plan.
8. Check whether the angle can be written without banned wording from `spam-word-checker.md`.

### What To Present

```markdown
## Step 1: Campaign Direction

**Target Audience:** [audience]
**Trigger Or Relevance Signal:** [signal]
**Core Pain Or Situation:** [pain or situation]
**Offer:** [plain offer]
**Proof Point:** [proof available]
**Recommended Campaign Angle:** [brief direction]

**Variables Available:**
- {{variable_name}}: [purpose and source]

**Risk Check:**
- [deliverability, claim, data, or personalization risk]

**Choose Next Step:**
A. [Recommended] Approve this direction and move to subject line / first-line strategy
B. Adjust the target, signal, pain, offer, or proof first
C. Ask me one follow-up before moving on
D. Custom answer
```

Do not include reusable email copy in Step 1.

---

## Step 2: Confirm Subject Line And First-Line Strategy

Select the single strongest strategy, present it as the locked choice, and proceed. Do not present multiple options or ask the user to choose between approaches unless they explicitly request alternatives or push back on the recommendation.

### Strategy Types

The first line is the offer, normally the deliverable-first conditional (Hard Rule 19, the Framework A anatomy). What this step chooses is the subject strategy and, only when a labeled variant is deliberately chosen and logged, which variant (operator-approved Aaron alignment, 2026-09-21; the older five-type list, which included signal-led and proof-led first lines, is archived at `outbound/_archive/aaron-alignment-2026-09-21/campaign-copywriting--copy-qa-gate-and-steps.md`).

Subject strategies (2 to 4 lowercase words, 0 to 2 variables, curiosity plus relevance; his endorsed and rejected subjects are in examples §3):

- Relevance: names the topic, or a real signal the whole slice shares, without the offer or a statistic. "your [the offer's own object]" counts: his Sep 21 subject for a trial sign-up offer was "just your trial, super short, conversational" (Aaron process alignment, operator directive 2026-09-22).
- Casual: a short lowercase subject with the first name, the way a peer would write it. His "fyi first name", written `fyi {{first_name}}`, is a normal option (examples §3; Aaron process alignment, operator directive 2026-09-22; supersedes the 2026-09-21 ruling that ran it only as a labeled test variant).
- Resource-led: implies the useful artifact or finding without naming the offer.

Where relevance or a signal belongs in the body, it goes to the P.S. (the opening-line swap, examples §1.1), never ahead of the offer (the labeled relevance question opener aside). Proof never leads (doctrine §9). Per-contact AI context lines in the copy are retired; only the at most two per-contact variables of Hard Rule 34 ride, inside the offer sentence. A subject that names an open role works only if the reader is the hiring person (examples §3).

Avoid generic curiosity, pressure, fake urgency, and subject lines that would not match the body.

### What To Present

```markdown
## Step 2: Subject Line And First-Line Strategy

**Strategy:** [strategy name]
**Subject:** [QA-approved subject]
**First Line:** [QA-approved first line]
**Why This Fits:** [one sentence reason tied to the campaign direction]
**QA:** Passed spam-word checker and best-practices review.

Proceeding to body structure. Let me know if you'd like a different angle.
```

If the chosen strategy fails QA, rewrite internally until it passes. Do not show failed copy. Do not ask the user to choose between options - choose the best one and go.

Alternatives are available on request only. Do not volunteer them unless the user is unsatisfied with the recommendation.

---

## Step 3: Confirm Body Structure

Once the subject and first line are approved, confirm the body logic before writing final variants.

### What To Decide

- value angle
- proof point
- personalization variables
- CTA type
- CTA deliverable category
- CTA setup sentence purpose
- CTA permission question style
- shape: the one-liner or two lines plus a P.S. (the ledger R14 A/B pair), and any labeled variant with the reason it is logged
- the Email 1 variant set: three by default (A, B, C), with the one variable each of B and C changes against A
- per-contact variables: none, or at most two of `sells_to_vertical`, `service_offered`, `own_best_client`, inside the offer sentence, with the approved no-variable body for rows missing a value
- follow-up direction (strip it back, a different value prop or mechanism, or add to it) and CTA rotation
- thread structure
- whether to include a P.S. line, and its one job
- whether each element can pass the Copy QA Gate

### What To Present

```markdown
## Step 3: Body Structure

**Approved Strategy:** [strategy]
**Approved Subject:** [subject]
**Approved First Line:** [first line]

**Body Logic:**
- Value angle: [angle]
- Proof: [one point at most, in the P.S. or Email 2, never lines one or two; or none]
- Personalization: [`{{first_name}}` optional; at most two per-contact variables inside the offer sentence (`{{sells_to_vertical}}`, `{{service_offered}}`, `{{own_best_client}}` as the deliverable's target), each sourced, with the slice's near-twin case and the approved no-variable body as fallbacks; no company-name variable by default]
- Shape: [one-liner or two lines plus a P.S. (ledger R14 A/B pair); any labeled variant and why it is logged]
- Email 1 variants: [A = control; B = the one variable it changes; C = the one variable it changes; any further letter and why]
- CTA type: [CTA category]
- CTA deliverable category: [in-body observation / public case study / conversation / company-specific note / confirmed asset / client-honored offer with the client's OK / operator-producible deliverable]
- CTA setup purpose: [what the prospect receives and why it is worth their time]
- CTA permission framing: [short humble question style]
- P.S. line: [none / relevance demoted from line one / one near-twin proof point / risk elimination or reason it's free / the deliverable's own terms (turnaround and their one small act); one job only]

**Sequence Logic:**
- Email 1: [new thread, 2-to-4-word lowercase subject with 0 to 2 variables; the Framework A default anatomy (25 to 35 words, the free deliverable on line one, scope disclosure when real, one soft permission CTA, optional one-job P.S.); test the offer first, then its positioning, then the CTA, with subject lines last (doctrine §5 step 9, §9)]
- Email 2: [SAME thread, follow-up, Day 3. Strip it back (the same offer with a lower-friction ask, such as a short video), lean on a different value prop or mechanism for the same offer, or add to it (a real concern pre-handled, a benefit layer, a risk reversal, or the reason it's free); its OWN CTA sentence (a question or a conditional statement re-offer); standalone; soft CTA, never a dead-end soft close]
- Email 3 (a genuinely small market, roughly under 3,000 qualified contacts, or a tested arm): [Day 6. SAME thread by default; a new thread with its own subject only as a logged arm, planned here and shipped threaded until an upload path wires it. Another of the three directions, with a DIFFERENT CTA sentence again; standalone; soft CTA, never a goodbye]
- Step count: 2 by default at every TAM size, 3 only in a small market or as a tested arm. ONE thread by default, three touches at most, no Email 4. Sending runs Monday to Friday.
- CTA rotation check: [the CTA sentences read side by side are all different (Hard Rule 21), and no follow-up repeats Email 1 at the same friction (CTA Hierarchy)]
- Offer alignment: [how the locked offer appears; if `offer.lead_magnet: direct_offer`, the direct offer-led CTA carries the sequence, no invented magnet]

**QA Notes:**
- Spam-word checker: pass expected after final wording.
- Best-practices review: pass expected after final wording.
- Confirmed deliverable gate: pass expected after final wording.
- Known wording risks to avoid: [risks]

Confirm this structure before I write the final copy.
```

Use structure language, not unreviewed body copy.

---

## Step 4: Output Final Copy

Only output final copy after the structure is settled (confirmed by the user under `review_gates`, picked and recorded under `auto_execute`) **and the List Gate passes** (verified slice + grade B or better and list-QA PASS + locked strategy; see List Gate). If the gate is not satisfied, STOP here: do not serialize `variants.yaml`.

Before presenting final copy:

1. Draft all variants.
2. Run the Copy QA Gate on every line.
3. Rewrite anything that fails.
4. Confirm the final markdown and YAML versions match exactly.
5. Only then show final copy.

### Output Format

~~~markdown
## Final Campaign Copy

### Email 1 (Day 0)

**Subject Line Options:**
1. [QA-approved subject]
2. [QA-approved subject]
3. [QA-approved subject]

**Variant A** ([word count] words), the control
```text
[QA-approved email body]
```

**Variant B** ([word count] words), changes one variable against A: [name it]
```text
[QA-approved email body]
```

**Variant C** ([word count] words), changes one variable against A: [name it]
```text
[QA-approved email body]
```

(Three Email 1 variants by default, `email_1_a` / `email_1_b` / `email_1_c`; add Variant D and on only when a test needs them, one variable each. Aaron process alignment, operator directive 2026-09-22.)

### Email 2 (Day 3)

Same thread as Email 1 (no subject). Email 2 takes one of the three follow-up directions: strip it back, a different value prop or mechanism, or add to it (Hard Rule 21).

**Variant A** ([word count] words)
```text
[QA-approved email body]
```

### Email 3 (Day 6)

A genuinely small market (roughly under 3,000 qualified contacts) or a tested arm only. SAME thread as Email 1 (no subject) by default; as the logged new-thread arm it carries its own 2-to-4-word subject (planned here, shipped threaded until an upload path wires it, Hard Rule 18). Another of the three directions, such as the biggest benefit, a risk reversal, or the reason it's free (Hard Rules 18 and 21).

**Variant A** ([word count] words)
```text
[QA-approved email body]
```

### Variables Used

| Variable | Source | Purpose |
|---|---|---|
| {{variable_name}} | [source] | [purpose] |

### QA Checklist

- [x] Spam-word checker passed.
- [x] Best-practices review passed.
- [x] No banned words, phrases, formatting patterns, fake urgency, or unsafe unsubscribe logic.
- [x] Subject lines passed deliverability review.
- [x] Email 1 follows the Framework A default anatomy and closes with one soft permission CTA (default `Would that be worth sharing more?`, whitelist at Hard Rule 32) after the free deliverable and, when real, the scope disclosure; follow-ups use their approved slot CTA.
- [x] Email 1 has three variants by default, each of B and C changing exactly one variable against A, each named above.
- [x] Edited in Aaron's order (offer, unsupported facts, output and effort, one next action, filler, then length and style); every line has a job and a supporting fact.
- [x] Checked against the rejection bank (`outbound/reference/aaron-examples.md` §8) and the kill-list; nothing he rejected survives.
- [x] Spintax (added after final copy, in the sending platform's syntax) is on the Email 1 subject and every unprotected body sentence of every step, option A is the approved wording exactly, and the read back of the paused draft confirmed it (`../SKILL.md`, Spintax Rules).
- [x] Pre-send test passed: I would answer this email.
- [x] CTAs reference confirmed deliverables only.
- [x] Variables use `{{double_braces}}`.
- [x] Markdown copy and YAML copy match exactly.
~~~

---

## Final Reminders

1. Work stepwise.
2. Present strategy options before final copy under `review_gates`; under `auto_execute`, record the picked options in `copy.md` instead.
3. Run the Copy QA Gate before showing any copy.
4. Use `spam-word-checker.md` as the formatting, CTA, opener, and voice source of truth.
5. Use `cold-email-copy-best-practices.md` as the writing quality source of truth.
6. Research beats cleverness.
7. Specificity beats hype.
8. Simpler usually wins.
9. YAML must match markdown exactly.
10. Re-read the final `variants.yaml` from disk before handoff; do not rely on the draft in memory.
11. The offer is the 80/20: fix the offer before any copy edit, and judge the result on meetings, not replies (doctrine §2, §3).
