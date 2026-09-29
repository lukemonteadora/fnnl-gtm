---
name: phase-2-research-offer
description: "Phase 2 of 4 for a cold-outbound client. Say \"Phase 2 for <client>\". Researches buyer pain, runs the Research QA gate and the Aaron offer call, locks the offers, sizes each offer's list from counts, previews the targeting, then stops once at the offer checkpoint."
---

# Phase 2: Research and offer

**Say "Phase 2 for <client>" in a fresh thread, and this runs research through to locked offers, then stops once.** The protocol every phase follows is `outbound/reference/phase-protocol.md`; read it first. This file only lists what Phase 2 does.

Paths resolve under `outbound/`. Client profiles are gitignored, so read them with Bash or Read.

**The ask policy governs every step** (`phase-protocol.md` section 3). Find the answer first. The one up-front batch for the rest of the run is Checkpoint 2 below; small calls are decided and listed under "Calls I made", and anything else becomes a hold on the touched item or a note. The mid-run stops are a tool out of balance or down, spend over the budget, Aaron's call contradicting a client requirement (step 4), a missing required key, and the kickoff Step 6 draft-upload stop.

## Start

1. `python outbound/scripts/phase_state.py start <slug> 2`. If Phase 1's checkpoint is still open, show it again from `phases/phase-1-onboarding.md`, take the operator's answer, approve it, and start again.
2. Read the read set (`phase-protocol.md` section 2). Phase 1's handoff is the input; for a backfilled client with no handoff, write it first (`phase-protocol.md` section 7).
3. **Entry check.** Research starts only when these Phase 1 outputs exist:
   - the `context_sweep:` block with no core source still blocked;
   - `website_scrape.status` of `done`, `partial` or a `no_website` the operator confirmed.

   On a backfilled client, produce whichever is missing now, per `client-context-sweep.md` and `client-website-scrape.md`, before research. This is a backfill, not a reopen (`phase-protocol.md` section 7). A blocklist the sweep finds goes into suppression at once.
4. **Client answers owed.** If `client-asks.md` has a `### Sent <date>` message with no `#### Answers` block under it, the first thing said in the thread is one line asking the operator to paste what came back ("none came back" is a valid answer and skips them all). File what is pasted the same turn per `client-messages.md` ("Filing the answers the operator pastes back"). This never holds the phase: research starts while the answers are owed.
5. **Read the rulings.** Read `outbound/reference/standing-rulings.md` and the client's `rulings.md` before anything is asked in this phase.

## Steps (hands-free, unless the profile's older review setting adds stops; `phase-protocol.md` section 3)

1. **Offer path.** Take the new-offer path unless a real existing offer has cold-outbound evidence: a live campaign, 300+ sends, reply data from those sends, or an approved campaign artifact. In that case run `/offer-intelligence` in validation mode instead of step 2's discovery mode. Results from other channels (meetings booked by phone, referrals, ads) are proof facts and research input, not validation evidence. A form-suggested offer is never evidence either; it goes to Aaron as an input he rules on. Report the path at the checkpoint.
2. **Research**, per `market-evidence-standard.md`.
   - Run `/offer-intelligence` in discovery mode. It reads the research that already exists first and never redoes it. Older research that predates the evidence ledger is seeded into `_research/evidence.csv` by its Step 0, and the old files stay where they are. It covers every confirmed segment.
   - The primary pass is a logged deep-research run or its declared Claude sub-agent fan-out (`/ai-model-routing`; no third-party AI API). Check it with `node outbound/scripts/research/research_routing_check.mjs --skill offer-intelligence --client <slug> --json`.
3. **Research QA gate.** Run `/market-evidence synthesize`: it clusters, counts and scores the evidence and returns PASS, DEEPEN or HOLD, recorded in `run_state.status.research_stage`.
   - **DEEPEN:** runs at most two targeted loops on the named gaps inside this phase, with no stop (operator decision 2026-09-28). It ends as PASS with low-confidence labels, or HOLD.
   - **HOLD:** carried forward, never a silent block. Every cluster is labelled low confidence, the reasons lead the checkpoint, and the missing evidence (usually call recordings) goes into `client-asks.md`.
4. **The Aaron offer call** (`outbound/reference/aaron-lane.md`, Call 1).
   - Run it as one fresh `/ask-aaron` sub-agent in the background, covering every segment.
   - Keep it blind: point it at a stripped copy of the profile with no `offer:` block. First move two things out of that block into a short inputs file:
     - the client's own suggestions (`client_suggested_*`, a `validation_candidate`), labelled "client suggestions, rule on each";
     - any hard evidence (results the client already gets), as facts without our offer wording.

     Point him at that file too.
   - House offer candidates written before the Aaron lane (an older `lead-magnets.md`) are not an input. Before recording, move that file to `_archive/<YYYY-MM-DD>-pre-aaron/` and name it at the checkpoint as the operator's earlier shortlist, now superseded. The operator can still swap one back in.
   - Use the prompt lines in `aaron-lane.md` word for word. The main session reads only his returned YAML and his read.
   - **Run the client-fit check before recording** (`aaron-lane.md`, "Client-fit check"). The main session compares his returned offers and targeting with the client's stated requirements. No contradiction: his call is used as he wrote it, with no approval question (the `aaron-auto` ruling). A contradiction stops the run and shows the operator Aaron's exact line beside the client source it contradicts; this is one of the four mid-run stops.
   - Log `run_state.aaron_lane.offer_call`.
5. **Lock the offers.** Run `/lead-magnet-brainstorm`, which records the Aaron offer call in recorder mode: his offers go in word for word, with his ranking, and his who, traits and titles become the list definition. They are used as recorded; nothing waits for the operator to confirm them. When a rail fails, one fix round goes back to a fresh Aaron sub-agent, and only the failing offer is held. There is no house brainstorm (retired 2026-09-29); `/roast` on the primary runs only when the operator asks.
6. **Offer slate.** Run `/offer-test-slate` in slate mode and write `offer-test-slate.md` (client approval is optional). An offer only the client can honor is marked "needs the client's OK" and waits on its own.
7. **Size each offer's list from counts.** For each offer and segment, on Aaron's list definition (geography, headcount, keyword stack, title stack):
   - resolve the AI Ark enums first, then read AI Ark `company_search` `totalElements` for the company count;
   - read GetLeads `count_contacts` for the contact count. This step only counts; it never exports or reveals an email;
   - record both counts per offer, then estimate the Phase 3 spend (the contact enrichment tool plus the email verifier per contact) against `run_state.spend_ceiling_usd` (`/api-cost-governance`).
   - **Targeting preview (operator decision 2026-09-30).** This is how Phase 3's list QA stops coming back to the operator: its targeting questions are found and answered here, at Checkpoint 2, before the list is built.
     1. **Pull a sample.** For each locked offer, run GetLeads `search_contacts` on the same list definition (`limit: 100`) and dedupe by company domain until about 25 distinct companies remain. This is a search, never an export, so it needs no export OK and `confirmed=true` is never set. When the response offers a full export (`has_more`, `export_offer`), that is not asked here: the export OK waits for Checkpoint 2. Request the company's LinkedIn About text in `columns` (find its name with `get_available_columns`), since nothing can be classified without it. When 100 rows give fewer than 25 companies, page with `offset`. A `fair_use_limit` (HTTP 402) stops the step under `/tool-balance-guard`. Save the sample to `_research/targeting-preview/<offer-slug>.csv`.
     2. **Classify it against the ICP and that offer.** The session reads the 25 companies itself (name, About text, industry, headcount) against Aaron's traits and disqualifiers, or fans them out to Claude sub-agents per `/personalization-subagent-pattern`. No third-party AI API.
     3. **Collect the ambiguous categories.** Group the companies the classification could not place cleanly into plain categories, such as "internal AI copilots", "brokers" or "apparel". A category is ambiguous when the ICP and Aaron's traits could reasonably be read either way for it.
     4. **Look each one up first.** Search `rulings.md` and `standing-rulings.md` for a `targeting:<topic>` key that answers it. A category a ruling answers is applied and listed under "Calls I made" with the ruling. Each unanswered category becomes a Checkpoint 2 question with the recommended answer first (the answer Aaron's traits and disqualifiers point to).
     5. **Keep it a preview.** Preview verdicts never ship or drop a company. The Phase 3 fit run and its agreement gate are unchanged. Record the categories found, and how many sample companies each covers, in `_research/targeting-preview/summary.md`.
8. **Client asks.** Merge anything an offer needs from the client into the one unsent message in `client-asks.md` (create it if Phase 1 never did), per `outbound/reference/client-messages.md`: one yes or no per offer that needs the client (keyed `[offer-<rank>]`), one rough capacity question, the sample when one exists. HOLD evidence is listed under `## Internal` and is not asked. The sample is a promise, so "more later?" is not asked. Run the question filter and the "Before you send" list in that file. Nothing is sent automatically.
9. **Offer Readiness.** Once the offers are recorded, fill each offer's readiness fields and write the read-only board per `outbound/reference/offer-readiness.md`: each offer's Start rail, what is missing and who owes it. A client approval is recorded only as that file describes, never inferred.

## Handoff: `phases/phase-2-offer.md`

"What the next phase needs" carries:
- the locked offers in Aaron's order, each with its one-sentence offer, who it goes to, its list definition (traits with their checks, titles, disqualifiers) and its evidence line;
- the counts per offer and segment, and the spend estimate against the budget;
- the ideas Aaron considered but did not test, and his divergences and pushback;
- each offer's readiness status;
- the targeting answers from Checkpoint 2 (and those stored rulings already gave), each stored as a `targeting:<topic>` ruling, with the path to `_research/targeting-preview/summary.md`;
- the paths to `aaron-offer-call.md`, `lead-magnets.md`, `_research/pain-clusters.md` and `offer-test-slate.md`.

## Checkpoint 2

Write the handoff, then run `python outbound/scripts/phase_state.py checkpoint <slug> 2 --handoff phases/phase-2-offer.md`.

The summary covers:
- what the buyers are struggling with (the top pain clusters in their own words, with counts and the Research QA verdict; HOLD reasons first);
- Aaron's offers in his order with his reasons, **for information**. They passed the client-fit check and are used as recorded (the `aaron-auto` ruling); they are not an approval question. The operator may still swap one in the answer, and the swap wins, recorded as the operator's call over Aaron's;
- the ideas he did not test;
- the list size per offer and the spend estimate;
- the targeting preview: the ambiguous categories it found per offer, and under "Calls I made" the ones a stored ruling already answered;
- the readiness board: each offer's Start rail, what is missing and who owes it. Display only; it adds no question.

Then one native prompt, recommended answers first. This is the one up-front batch for the rest of the run, so Phase 3 and Phase 4 can run straight through. Its first option is always "Approve and go to Phase 3 (recommended)", which moves the run on rather than signing off Aaron's offers; a swap the operator wants rides in that same answer. The questions after it follow, each only when it applies (at most four in all):
1. **The targeting questions from the preview**, one per unanswered category, each with the recommended answer first. When there are many, group them into one multi-select question ("Which of these count as in-target?") with the recommended ones pre-listed first, or one question per offer.
2. **The GetLeads export OK**, only when the `getleads-export` ruling is not already in `rulings.md`. It is asked once per client and covers every export in Phase 3 and every later wave. Never set `confirmed=true` without it.
3. A spend-budget raise, only when the Phase 3 estimate would cross `run_state.spend_ceiling_usd`.
4. One more targeted research pass, only when a HOLD or a low-confidence cluster sits under the leading offer.

Record the answers in the handoff and the activity log, and write each one to the client's `rulings.md` the same turn (a backfilled client gets the file from the template in `standing-rulings.md`): each targeting answer as `targeting:<topic>`, the export OK as `getleads-export`, and any offer swap as the operator's call. A targeting answer the operator says holds for every client goes to `standing-rulings.md` instead. Then run `python outbound/scripts/phase_state.py approve <slug> 2 --answer "..."`, and close with: "Phase 2 is done. Open a new thread and say: Phase 3 for <client>."
