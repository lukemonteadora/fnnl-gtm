---
name: phase-2-research-offer
description: "Phase 2 of 4 for a cold-outbound client. Say \"Phase 2 for <client>\". Runs Aaron's quick demand mining and the Aaron offer call, locks the offers, refines each offer's search with the AI Ark company sample and keyword mining, then stops once at checkpoint A, the one up-front batch for the rest of the run."
---

# Phase 2: Research and offer

**Say "Phase 2 for <client>" in a fresh thread, and this runs research through to locked offers, then stops once at checkpoint A.** The protocol every phase follows is `outbound/reference/phase-protocol.md`; read it first. This file only lists what Phase 2 does.

Paths resolve under `outbound/`. Client profiles are gitignored, so read them with Bash or Read.

**The ask policy governs every step** (`phase-protocol.md` section 3). Find the answer first. The one up-front batch for the rest of the run is checkpoint A below; small calls are decided and listed under "Calls I made", and anything else becomes a hold on the touched item or a note. The mid-run stops are a tool out of balance or down, spend over the budget, Aaron's call contradicting a client requirement (step 4), a missing required key, and the kickoff Step 6 draft-upload stop.

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
2. **Research: Aaron's quick demand mining, not a full discovery pass** (Aaron flow, see `aaron-flow.md` section 4).
   - Run `/offer-intelligence` in discovery mode under that section's known-market / unfamiliar-market branch. A **known market** (the client already has a `recent_win` or case studies in the segment, or another FNNL client's research covers the same vertical) reuses what exists and skips new research. An **unfamiliar market** gets one quick Claude sub-agent fan-out pass on the allowed routes only: WebSearch for LinkedIn/X objections and competitor chatter, Reddit only when the operator pasted threads, the Meta Ad Library's read-only pane, and competitors' own sites. No third-party AI API.
   - Evidence still goes into `_research/evidence.csv` through `evidence_ledger.mjs`, whichever branch ran. It covers every confirmed segment.
   - Check the pass, when one ran, with `node outbound/scripts/research/research_routing_check.mjs --skill offer-intelligence --client <slug> --json` (it verifies a logged sub-agent fan-out, not a specific route).
3. **Research QA gate: off by default** (Aaron flow, see `aaron-flow.md` section 4). Run `/market-evidence synthesize` as a short clustering pass: it counts and groups the evidence with no PASS/DEEPEN/HOLD gate unless the operator asks for the gate this run.
   - **When the operator asks for the gate,** it scores the evidence and returns PASS, DEEPEN or HOLD, recorded in `run_state.status.research_stage`.
     - **DEEPEN:** runs at most two targeted loops on the named gaps inside this phase, with no stop (operator decision 2026-09-28). It ends as PASS with low-confidence labels, or HOLD.
     - **HOLD:** carried forward, never a silent block. Every cluster is labelled low confidence, the reasons lead the checkpoint, and the missing evidence (usually call recordings) goes into `client-asks.md`.
   - **When the gate did not run,** say so plainly at the checkpoint rather than implying a PASS; the clustering pass's groupings still inform the offer call.
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
   - **Targeting preview: the AI Ark company sample and keyword mining** (operator directive 2026-10-06, see `standing-rulings.md` `discovery-flow`; `aaron-flow.md` section 6, full procedure in `ai-ark-people-discovery.md` Step 1). Per `phase-protocol.md`'s checkpoint table, this sample loop is also the targeting preview for checkpoint A: it is how Phase 3's list QA stops coming back to the operator, by finding and answering the targeting questions here, before the list is built at scale.
     1. **Pull 200 to 300 companies from the AI Ark company search.** For each vertical a locked offer targets, run the first search idea with every filter (including `discovery-exclusions`), pulling two or three pages of 100 companies (no email reveal). Save the sample as `outbound/profiles/<slug>/discovery/<vertical>/sample-r0-companies.csv`.
     2. **Score company fit.** Score each company's fit (good / maybe / bad) via batched Claude sub-agents against Aaron's traits and disqualifiers (`model-jobs` ruling: batched by the hundred, merged by id, never one sub-agent per row), into `fit-r0.csv`. No third-party AI API.
     3. **Mine the keywords, then cost every exclude.** Run `keyword_mine.py` with the flags in `ai-ark-people-discovery.md` Step 1 (no 90% bar). Every keyword tag and industry common to the good-fit companies becomes an include, every one common to the bad-fit companies an exclude candidate, and one common to both is used on neither side. An exclude good-fit companies also carry comes out `flagged`. Then `exclude_cost.py` (Step 1.4b, ruling `exclude-guard`) prices each exclude with GetLeads `count_contacts` at 0 credits: one exclude may cost at most 5% of good-fit volume, all of them together at most 10%.
     4. **Write the refined search.** Every include and every exclude `exclude_cost.py` kept go into `search-final.json`, with no count cap, no review round and no hand-pruning; read its new count and log the sample, `exclude-cost.csv` and the counts with and without the excludes in `refine-log.md`. When `exclude_cost.py` exits 4, that vertical's exclude stack is a checkpoint A item (recommended answer: run without the over-cap excludes), and the flagged and dropped excludes are listed under "Calls I made". There is no validation sample: company fit after the Phase 3 export still drops the bad rows.
     5. **Collect the ambiguous categories.** Group the companies the fit scoring could not place cleanly into plain categories, such as "internal AI copilots", "brokers" or "apparel". A category is ambiguous when the ICP and Aaron's traits could reasonably be read either way for it.
     6. **Look each one up first.** Search `rulings.md` and `standing-rulings.md` for a `targeting:<topic>` key that answers it. A category a ruling answers is applied and listed under "Calls I made" with the ruling. Each unanswered category becomes a checkpoint A question with the recommended answer first (the answer Aaron's traits and disqualifiers point to).
     7. **Keep it a preview.** Preview verdicts never ship or drop a company at this sample size. The Phase 3 fit run and its agreement gate are unchanged, and the refined search carries the same `discovery-exclusions`. Record the categories found, the sample's fit rate, the include and exclude counts and the refined search's count in `_research/targeting-preview/summary.md`, pointing to each vertical's `refine-log.md`.
8. **Client asks.** Merge anything an offer needs from the client into the one unsent message in `client-asks.md` (create it if Phase 1 never did), per `outbound/reference/client-messages.md`: one yes or no per offer that needs the client (keyed `[offer-<rank>]`), one rough capacity question, the sample when one exists. HOLD evidence is listed under `## Internal` and is not asked. The sample is a promise, so "more later?" is not asked. Run the question filter and the "Before you send" list in that file. Nothing is sent automatically.
9. **Offer Readiness.** Once the offers are recorded, fill each offer's readiness fields and write the read-only board per `outbound/reference/offer-readiness.md`: each offer's Start rail, what is missing and who owes it. A client approval is recorded only as that file describes, never inferred.
10. **The reply guide** (ruling `reply-guide`, operator directive 2026-10-06). Run `/reply-guide` in `build` mode for every offer locked for testing. It writes `reply-guide.md`, the PDF at `exports/<Client>-Reply-Guide.pdf`, and `reply-guide.manifest.json` with the launch-set keys. Everything is in the client's voice and checked by `reply_guide.py`. Held or internal offers go to `reply-guide-internal.md`, which is never exported. This step never asks a question and never holds the phase. Aaron's review of the house lines runs inside it.

## Handoff: `phases/phase-2-offer.md`

"What the next phase needs" carries:
- the locked offers in Aaron's order, each with its one-sentence offer, who it goes to, its list definition (traits with their checks, titles, disqualifiers) and its evidence line;
- the counts per offer and segment, and the spend estimate against the budget;
- the ideas Aaron considered but did not test, and his divergences and pushback;
- each offer's readiness status;
- the targeting answers from checkpoint A (and those stored rulings already gave), each stored as a `targeting:<topic>` ruling, with the path to `_research/targeting-preview/summary.md`;
- the DNC answer, the speed-to-lead owner, the booking link and any sweep source Phase 1 could not resolve, now answered (or still open and reason why);
- the PlusVibe placement-test OK (or declined, or not yet asked), stored as the `placement-test` ruling;
- the paths to `aaron-offer-call.md`, `lead-magnets.md`, `_research/pain-clusters.md` and `offer-test-slate.md`;
- the reply guide: the PDF path, the launch-set keys in its manifest, the Aaron pass status, and any booking-link warning.

## Checkpoint A

Write the handoff, then run `python outbound/scripts/phase_state.py checkpoint <slug> 2 --handoff phases/phase-2-offer.md`.

The summary covers:
- what the buyers are struggling with (the top pain clusters in their own words, with counts; the gate's PASS/DEEPEN/HOLD verdict when the operator ran it this phase, or a plain note that the gate did not run and this is the quick-demand-mining clustering pass instead);
- Aaron's offers in his order with his reasons, **for information**. They passed the client-fit check and are used as recorded (the `aaron-auto` ruling); they are not an approval question. The operator may still swap one in the answer, and the swap wins, recorded as the operator's call over Aaron's;
- the ideas he did not test;
- the refined search per vertical (its count, the sample's fit rate, the include and exclude keywords), the counts per offer, and the spend estimate;
- the targeting preview: the ambiguous categories it found per offer, and under "Calls I made" the ones a stored ruling already answered;
- the readiness board: each offer's Start rail, what is missing and who owes it. Display only; it adds no question.
- the reply guide PDF, ready to hand to whoever will answer the inbox, with any booking-link warning. Display only; it adds no question.

Then one native prompt, recommended answers first. This is checkpoint A, the one up-front batch for the rest of the run (ruling `checkpoints`), so Phase 3 and Phase 4 can run straight through with no further human stop until checkpoint B. Its first option is always "Approve and go to Phase 3 (recommended)", which moves the run on rather than signing off Aaron's offers; a swap the operator wants rides in that same answer. The questions after it follow, each only when it applies (at most four in all; a second prompt only when more remain):
1. **The targeting questions from the company sample preview**, one per unanswered category, each with the recommended answer first. When there are many, group them into one multi-select question ("Which of these count as in-target?") with the recommended ones pre-listed first, or one question per offer.
2. **Anything Phase 1 carried forward** (Aaron flow, see `aaron-flow.md` section 2.1): the do-not-contact answer, the speed-to-lead owner, the booking link, and any core sweep source still blocked, each only when Phase 1's handoff flagged it open.
3. **The GetLeads export OK**, only when the `getleads-export` ruling is not already in `rulings.md`. It is asked once per client and covers every export in Phase 3 and every later wave. Never set `confirmed=true` without it.
4. **The PlusVibe placement-test OK** (ruling `placement-test`), only when it is not already in the client's `rulings.md`. Read the test's cost first (`/api-cost-governance` when it has one) and show it in the question. Asked once per client; the answer (and the cost read) is stored in `rulings.md` either way. A decline is recorded as a stated gap for Phase 4's Gate B to carry forward, never presented later as a pass.
5. A spend-budget raise, only when the Phase 3 estimate would cross `run_state.spend_ceiling_usd`.
6. One more targeted research pass, only when a HOLD or a low-confidence cluster sits under the leading offer and the operator wants the gate run.

Record the answers in the handoff and the activity log, and write each one to the client's `rulings.md` the same turn (a backfilled client gets the file from the template in `standing-rulings.md`): each targeting answer as `targeting:<topic>`, the export OK as `getleads-export`, the placement-test answer as `placement-test`, any carried-forward Phase 1 item under its own key (`dnc`, `run_state.speed_to_lead_owner`, `run_state.booking_link`, `sweep:<source>`), and any offer swap as the operator's call. A targeting answer the operator says holds for every client goes to `standing-rulings.md` instead. Then run `python outbound/scripts/phase_state.py approve <slug> 2 --answer "..."`, and close with: "Phase 2 is done. Open a new thread and say: Phase 3 for <client>."
