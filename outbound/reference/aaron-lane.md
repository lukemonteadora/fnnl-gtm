# The Aaron Lane: Aaron decides the offers, the targeting and the copy

**What this is.** Once the research is done, the offers we test, who each offer goes to, which campaigns launch and the copy sequence all come from `/ask-aaron`, and **his call is final below the operator's**. If his offers differ from ours, we use his. If his copy differs from ours, we use his. This file is the one place the procedure lives. The skills point here and never restate it. (Ported into this workspace 2026-09-28 from the operator's rule of 2026-09-24.)

It replaces the long house authoring procedures on the default path. Most of those rules were written from Aaron's doctrine in the first place (the three offer buckets, the four-sentence test, the "why not?" test, the rejection bank, the short offer-first email). Going to the source is faster and keeps the main session's context small, because each Aaron call runs in its own Claude sub-agent. Both calls are Claude-native: no AI API is called (project `CLAUDE.md`, "No AI API calls").

**Who outranks whom.** The operator, then Aaron, then the house rules. A swap or choice the operator makes at a checkpoint wins over Aaron. Aaron's call wins over every house default about offers, targeting, campaign choice and copy. Only the rails below bind Aaron.

## The two Aaron calls

| Call | When | Aaron decides | The skill that records it |
|---|---|---|---|
| **1. Offer call** | Phase 2 (`/phase-2-research-offer`), right after the Research QA verdict (`/market-evidence synthesize`). Replaces `/lead-magnet-brainstorm`'s generation and scoring, and the `/roast` reshape. | The offers to test, their ranking and how many; each offer as one sentence a buyer could say yes to; who each offer goes to (the buyer, the company traits, the titles, the companies that cannot use it); the fulfillment answers (what we send on a yes, what we need back, the paid next step, any qualification step). | `/lead-magnet-brainstorm` (recorder mode), then `/offer-test-slate` |
| **2. Campaign and copy call** | The list phase (`phase-protocol.md`), right after `/campaign-strategy` drafts the wave from the TAM, and before `/lead-source-strategy` and `/email-waterfall` spend anything. His copy is recorded in `/phase-4-copy-launch`. | Which campaigns launch now, later or not at all, and which offer goes to which segment; the full sequence for each launching campaign (subject, Email 1 and its variants, the follow-ups). | `/campaign-strategy` (the launch set), then `/campaign-copywriting` (recorder mode, after the list is verified) |

Two calls, not one per skill. Aaron names who to target in minutes, but the list itself (companies, contacts, emails, verification) is still built by the list skills on the stack locked in `run_state` and `stack-contract.yaml`. His replica has no doctrine on list sources, signals or volumes, so it rules on **who**, never on **how the list gets built**.

A client still running on `/cold-email-kickoff`'s own phase layout gets the same two calls at the same two moments: Call 1 after the Research QA verdict, Call 2 after `/campaign-strategy` drafts the wave.

## How to run a call

1. **Fresh sub-agent, in the background.** Launch one Claude sub-agent (the Agent tool) on the session's own model (omit the model override: offers and copy are the strongest tier's job under `/ai-model-routing`). Never run Aaron in the session that drafted anything he is ruling on: a fresh context is what stops him grading our draft instead of making his own call. A call takes roughly 15 to 20 minutes (the first dry run, 2026-09-24, took 17), so run it in the background and keep any unblocked work moving. One call covers every segment: never launch one Aaron call per segment.
2. **Point it at files, don't paste them.** Give the sub-agent paths. It reads `/ask-aaron`'s `SKILL.md`, `aaron-doctrine.md` and `aaron-examples.md` itself, then the client inputs listed below.
3. **The prompt carries these lines, word for word:**
   - "Run `/ask-aaron` in Verdict (one-shot) mode for client `<slug>`. Make your best assumptions explicit and do not ask questions."
   - "Standing operator exception (2026-09-24): on this campaign your call is binding. This is the explicit exception your doctrine section 13 asks for, so do not conform your answer to the house copy contract or ask for an exception. Where you depart from a house default, name it in `divergences_from_house` and keep your version."
   - "Do not invent any client, result, number or capability. Use only proof and capabilities in the files you were given; where a line needs proof we lack, say so and write the line without it."
   - "Run your Step 0b live Notion check. If Notion cannot be reached, say so in the Live check line and rule from the corpus. Never stop for it."
   - "Save your full consult to `<the consult file below>` and return only the YAML block defined in `aaron-lane.md` for this call, plus your one-paragraph read."
4. **The main session reads only the returned YAML and the read.** The full consult stays on disk as the record.
5. **Log it.** One activity-log line (`DONE Aaron offer call` or `DONE Aaron campaign and copy call`, with the consult file) and `run_state.aaron_lane.<offer_call|copy_call>: <date>`.

**Under `review_protocol: phase_checkpoints`** (the new-client default) both calls run hands-free inside their phase and are shown at that phase's one checkpoint (see "At the checkpoints"). Under `review_gates`, the gate that reviews offers or copy shows the Aaron call instead of a house draft. Neither call adds a stop of its own.

## Call 1: the offer call

**Inputs (paths):** a copy of `client-profile.yaml` with its `offer:` block removed (the ICP, segments, `capability_boundary`, proof block and `client_suggested_*` stay), `_research/pain-clusters.md` (clusters, Research QA verdict, Language bank), only the Intersection and Candidate Generation Input sections of `offer-intelligence.md`, `_research/competitors-and-ads.md`, `context-sweep.md`, whatever file the onboarding website scrape wrote to the profile folder (what the client actually sells, what it charges, its proof and the offers it already runs; point at it only if it holds no `offer:` lock, so the call stays blind), and `social-proof-bank.md` if it already exists. Tell Aaron the house default for the count (`max(3, floor(qualified_contacts / 2000))`, from `/lead-magnet-brainstorm`) as context only: his count wins.

**Keep the call blind.** Before launching, the main session writes the stripped profile to its scratchpad and points Aaron at that copy, and the prompt tells him not to open `lead-magnets.md`, `offer-test-slate.md`, `aaron-offer-call.md` or any `offer:` block. The first dry run showed why: the full profile carries the whole existing lock, so a re-run on a client that already has offers otherwise reviews our lock instead of making his own call.

**Consult file:** `profiles/<slug>/aaron-offer-call.md`

**Return block:**

```yaml
aaron_offer_call:
  date: <YYYY-MM-DD>
  live_check: "<his Live check line>"
  read: "<Aaron's read, 2 to 4 sentences>"
  offer_count_note: "<how many he tests and why>"
  sets:                      # one entry per buyer type he rules on; one entry with segment: all for a single-set client
    - segment: <slug from the confirmed segments, or all>
      who: "<company type + the role + the problem they already know they have>"
      icp_inclusion: [{filter: <slug>, why: <line>, check: <observable, or null for the recorder to fill>}]
      title_stack: {function: <line>, seniority: [<levels>], titles: [<the core titles; the recorder adds the variations>]}
      offer_fit_disqualifiers: [{category: <slug>, why: <line>, check: <observable, or null for the recorder to fill>}]
      offers:                # ranked; rank 1 is the primary
        - rank: 1
          in_test: true      # false = considered, not tested now (stays visible with his reason)
          name: <offer name>
          bucket: <service | service_delivery | asset>
          offer_sentence: "<the offer as one sentence a buyer could say yes to>"
          details: "<what gets delivered, with any eligibility stated up front>"
          eligibility: null  # or the plain rule for who this offer alone is for (e.g. "consumer brands with enough public reviews"); the recorder writes it as this offer's own list filter
          cluster_ids: [<C-xx>]        # [] only with a reason in why
          pain_angle: "<one line in the buyer's words>"
          why: "<why it ranks here>"
          yes_honored_by: <agency | client>
          client_dependency: <none | the one thing only the client can provide>
          delivery_reply: "<what we send on a yes>"
          input_after_yes: "<what the prospect must send, or none>"
          if_not_qualified: "<the honest reply for a yes we cannot serve>"
          paid_next_step: "<the paid engagement it leads into>"
          qualification: null  # or {criteria: [...], form_fields: [...]} for a costly front end
          gap: "<what they still want after getting it, or null for a direct offer>"
          next_step: "<the call or analysis that resolves the gap>"
          cta_direction: "<the ask direction, not final wording>"
          scale_note: "<what delivering it at full send volume takes>"
  divergences_from_house: ["<house default he broke, and why>"]
  pushback: "<where he pushes back on us>"
```

**Every idea stays visible (operator decision 2026-09-22).** Each offer he considered is recorded with its rank, its label and his reason, including every `in_test: false` idea. A weak or saturated idea ranks lower; it is never hidden. The only offer dropped is one that would be untrue, unsafe or non-compliant to send, and even then `lead-magnets.md` says what was dropped and why.

**Recording (`/lead-magnet-brainstorm`, recorder mode).** Write his offers into the existing `offer` block exactly as its Save Output defines, so nothing downstream changes: each recorded offer keeps his rank as `aaron_rank` (the key `offer-readiness.md` and `client-asks.md` use), rank 1 of the priority set becomes `offer.lead_magnet`, the other `in_test` offers become `offer.validation_arms` in his order, a multi-set ruling fills `offer.segments`, and `who`, `icp_inclusion`, `title_stack` and `offer_fit_disqualifiers` become the list definition `/tam-build` reads. The recorder fills only mechanical fields (`lead_magnet_client_ok` and its evidence fields left `null`, set later only by the client-OK step in `offer-readiness.md`; `delivery_mode` from his `yes_honored_by` answer; `flight` left for `/campaign-strategy`) and never changes an offer, its rank, its wording or its target.

**Offer QA runs when the offer locks** (`market-evidence-standard.md` section 12). The recorder resolves his `cluster_ids` to 2 to 4 `evidence_ids`, sets `evidence_strength`, carries his `pain_angle`, and writes the Evidence line on every candidate in `lead-magnets.md`. An offer with no cluster behind it is labelled `unevidenced` or `contrarian` and still runs as an arm at his rank. Offer QA labels; it never re-ranks, rewrites or drops one of his offers.

**Targeting is his call; the filter syntax is the recorder's job.** Aaron's corpus has no doctrine on list mechanics, so the hardest fields in the first dry run were the `check` lines and the full title list. His `who`, each trait he names, the buying function and the seniority are binding. The recorder turns each trait into a `check` the locked stack can collect (with `/tam-build`'s field knowledge), expands the title variations, and writes an offer's `eligibility` as that offer's own `icp_inclusion`. It never adds, drops or widens a trait. A trait the stack cannot collect goes back to Aaron in the fail loop, and a trait that needs human judgement is marked as a call for the 25-account list QA. `lead-magnets.md` gets his offers, his reasons, his fulfillment plan and the `in_test: false` ideas, under the headings that skill already uses.

## Call 2: the campaign and copy call

**Inputs (paths):** the locked `offer` block and `lead-magnets.md`, `aaron-offer-call.md`, `campaign-strategy.md` (the drafted wave with company and contact counts per campaign and segment), the column list of `tam/contacts.scored.csv` (the variables that exist, and how full each is), `social-proof-bank.md`, `_research/pain-clusters.md` (the Language bank), the compliance facts on record (`capability_boundary.legal_or_compliance_limits`, the opt-out ruling), and `aaron-copy-frames.md` (his copy frames). Tell him the house copy defaults exist in `outreach-copy-framework.md` as context only.

**Every email is built on one of his real examples, frame by frame (operator rule, 2026-09-24).** The first copy written through the lane read as "in Aaron's spirit" but was built on none of his example emails. So Call 2's prompt also carries this line, word for word:

- "Operator's copy rule (2026-09-24, it outranks house defaults and binds this call): build every email on one of your own real example emails, frame by frame. Keep that example's structure, sentence count, slot order and fixed connecting words, and change only the slots (the offer, the pain, the relevance fact, the proof), as your portability rule says. The frames are in `outbound/reference/aaron-copy-frames.md`. Name the frame for every subject, email and delivery reply, and record a frame map: one row per slot with your source line, our line and the slot's job. If a frame in that file misreads your examples, list it under `frame_library_issues` and build from your corpus, which is the authority."

This is the operator's rule, so it binds Aaron. It is not a house style default that yields to him (see "What now yields to Aaron"). Which frame fits, which of his tests the variants run and every slot's words stay Aaron's call.

**Consult file:** `profiles/<slug>/aaron-copy-call.md`

**Return block:**

```yaml
aaron_campaign_call:
  date: <YYYY-MM-DD>
  live_check: "<his Live check line>"
  read: "<Aaron's read, 2 to 4 sentences>"
  campaigns:                 # every campaign in the drafted wave, plus any he adds
    - campaign_slug: <slug from campaign-strategy.md, or a new one he defines>
      segment: <slug>
      offer: <offer name from the lock>
      launch: <now | later | drop>
      why: "<one line>"
      sequence:              # only for launch: now
        subject: "<shared Email 1 subject>"
        subject_frame: <S1 to S5 from aaron-copy-frames.md>
        email_1_variants:
          - label: A
            frame: <one F id from aaron-copy-frames.md, never a combination>
            ps: <P id, or null>          # the PS frame, when the email has one
            line_two: <F id, or null>    # F7 only: the offer line under the pain line
            tests: "<which of his own tests, and what it isolates>"
            body: |
              <the email, exactly as it should send>
            frame_map:       # one row per slot of the frame
              - {slot: "<slot>", aaron_source: "<his line>", ours: "<our line>", job: "<the slot's job>"}
        follow_ups:
          - step: 2
            delay_days: <2 or 3>
            frame: <FU1 or FU2, or FU3 or FU4 alone>
            add: <FU3 or FU4, or null>   # the move added on top of FU1 or FU2
            body: |
              <the email>
            frame_map:
              - {slot: "<slot>", aaron_source: "<his line>", ours: "<our line>", job: "<the slot's job>"}
      variables_used: [<only columns that exist in contacts.scored.csv>]
      proof_used: <proof bank row id, or none>
  delivery_replies:          # one per offer
    - offer: <offer name>
      frame: <DR, or DR-input for an input request>
      body: |
        <the reply to a yes>
  frame_library_issues: ["<a frame that misreads his corpus, and the fix>"]
  divergences_from_house: ["<house default he broke, and why>"]
  pushback: "<where he pushes back on us>"
```

**Recording.** `/campaign-strategy` rewrites the wave to his launch set before any list spend: `now` campaigns form the first wave with his offer-to-segment pairing, `later` ones are queued, and `drop` ones stay listed with his reason, never deleted. His offer count replaces the house formula. `/lead-source-strategy`, `/email-waterfall` and `/list-quality-scorecard` then run on his `now` campaigns only. Once the list is verified, `/campaign-copywriting` writes `campaigns/<campaign-slug>/variants.yaml` and `copy.md` from his sequence **word for word**, fills the `copy.md` header lines from his call, and runs the rails plus the frame-conformance check at the end of `aaron-copy-frames.md` (every email names a real frame, keeps its slot order, sentence count and fixed words, and fills its slots with this client's facts). The script form of that check is `python outbound/scripts/aaron_frame_check.py --client <slug>`. It never rewrites his copy to fit its own house style. A frame failure goes back to Aaron for one fix round, like a rail failure.

**New prospect-facing reply lines are his call too** (Offer Readiness, `offer-readiness.md`). Any line a prospect will read that has no Aaron frame yet (an FAQ answer or an over-cap reply in the `## Notes` block of `interested-reply.md`) goes to a fresh `/ask-aaron` sub-agent call with the same rails. The house never writes it, and the yes-reply stays his `DR` delivery reply word for word.

## The rails (Aaron cannot override these)

Keep this list short. These are safety, truth and plumbing, not style.

1. **Truth.** No invented client, result, number, feature or capability. Proof must be on file (profile or proof bank), capabilities must be in `capability_boundary`, and a pain line either traces to a cluster or is a genuine question (`market-evidence-standard.md` section 13).
2. **Deliverability and format.** `/spam-word-checker` passes; no em dashes; variables are `{{double_braces}}` and exist as columns with a fallback; the signature is never in the body; `variants.yaml` matches `copy.md` exactly and uses the block-scalar body format. Spintax (the Spintax Rules in `/campaign-copywriting`) runs on his text as a deliverability step and never changes an offer, a claim or a CTA.
3. **Obtainable targeting.** Every `icp_inclusion` check and signal dependency can be collected on the locked stack (the Signal-Capability Check in `/lead-magnet-brainstorm`), inside the approved six tools and the zero-workbench-credit rule.
4. **Compliance.** The opt-out ruling and any geography rule (Canada, the UK, Ireland; `/campaign-copywriting` step 0a), and any sender identification the client requires.
5. **List safety.** Suppression and blocklists apply, only verified emails ship, a client veto is honored, and a client-honored offer sends only after the client's OK (it is drafted before that, with Start held).
6. **Money and launch.** The run's spend budget (`run_state.spend_ceiling_usd`) holds, uploads to the sending platform create paused drafts only, and the operator presses Start.
7. **House plumbing.** Plain-text files, the locked stack and `run_state` field names.

**When a rail fails:** send the failing item back to a fresh Aaron sub-agent with the rail it broke, for one fix round. Never let house copy logic rewrite it. If it still fails, hold only that item (that offer, that variant), keep everything else moving, and show it at the next checkpoint with Aaron's version, the rail it breaks and the reason.

## What now yields to Aaron

Every house default about offers, targeting, campaign choice and copy is context he may break, with the break recorded in `divergences_from_house`. That includes `/lead-magnet-brainstorm`'s 7-point score and its highest-ranked-candidate primary pick, the `max(3, floor(qualified_contacts / 2000))` offer count, fit-matched offer placement, the `/roast` reshape at the offer step, Framework A's 25-to-35-word band and scope disclosure, three Email 1 variants with B and C each changing one variable, the one-primary-ask default, the subject-variable range, the two-step default, the CTA rotation rule and the approved CTA list. One rule does not yield, because it is the operator's: every email is built on one of Aaron's own example frames (`aaron-copy-frames.md`).

## What is off the default path (kept on disk, run on request)

`/lead-magnet-brainstorm`'s candidate generation and scoring, the `/roast` on the primary, and `/campaign-copywriting`'s stepwise direction rounds and style gates run only when the operator asks for them ("run the full offer brainstorm", "roast this offer"). When they run, their output becomes an extra input to the Aaron call, and Aaron still has the final say.

## At the checkpoints

The phase numbers live in `phase-protocol.md`; the content of each stop is:

- **The offer checkpoint** shows Aaron's offers in his order with his reasons and Offer QA labels, the ideas he considered but did not test (visible, ranked, with his reason), his divergences and his pushback. The operator confirms or swaps. A swap wins, and is recorded as the operator's call over Aaron's.
- **The list review** shows Aaron's launch set, and any campaign he held, queued or dropped, with his reason.
- **The launch review** shows his sequences as recorded, the frame-check result, anything a rail held, and his divergences.

## Existing clients

**How a skill knows whether work went through Aaron:** the consult file (`aaron-offer-call.md` or `aaron-copy-call.md` in the client's profile folder) plus the date in `run_state.aaron_lane.offer_call` or `copy_call`. If either is missing, that offer or copy predates the lane. An older free-form consult (for example `aaron-consult-<date>.md`) is input, not proof the lane ran.

The lane applies to every offer and copy step run in this workspace from 2026-09-28 on. An offer already locked or a draft already built is not redone automatically: when `/continue-client` or `/cold-email-flow-audit` meets one, it is flagged as built before the Aaron lane and an Aaron pass (recommended) is offered at the next checkpoint, because a rewrite changes something the operator already approved. A client whose next step is the offer or the copy simply gets the Aaron calls. Copy Aaron wrote before the frame rule (no `frame` on its emails) is flagged the same way and gets a frame rebuild: a fresh Call 2 run on the copy only, with the offers and the launch set left as locked.

## Scope

This workspace only. `/lifecycle-copy` (the interested-reply and pre-call copy) is not in the lane yet, apart from the new reply lines above. The mirrored `/ask-aaron` skill is unchanged: the standing exception lives in the call prompt above, not in his skill files.
