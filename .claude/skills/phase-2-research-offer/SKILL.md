---
name: phase-2-research-offer
description: "Phase 2 of 4 for a cold-outbound client. Say \"Phase 2 for <client>\". Researches buyer pain, runs the Research QA gate and the Aaron offer call, locks the offers, sizes each offer's list from free counts, then stops once at the offer checkpoint."
---

# Phase 2: Research and offer

**Say "Phase 2 for <client>" in a fresh thread, and this runs research through to locked offers, then stops once.** The protocol every phase follows is `outbound/reference/phase-protocol.md`; read it first. This file only lists what Phase 2 does.

Paths resolve under `outbound/`. Client profiles are gitignored, so read them with Bash or Read.

## Start

1. `python outbound/scripts/phase_state.py start <slug> 2`. If Phase 1's checkpoint is still open, show it again from `phases/phase-1-onboarding.md`, take the operator's answer, approve it, and start again.
2. Read the read set (`phase-protocol.md` section 2). Phase 1's handoff is the input; for a backfilled client with no handoff, write it first (`phase-protocol.md` section 7).
3. **Entry check.** Research starts only when these Phase 1 outputs exist:
   - the `context_sweep:` block with no core source still blocked;
   - `website_scrape.status` of `done`, `partial` or a `no_website` the operator confirmed.

   On a backfilled client, produce whichever is missing now, per `client-context-sweep.md` and `client-website-scrape.md`, before research. This is a backfill, not a reopen (`phase-protocol.md` section 7). A blocklist the sweep finds goes into suppression at once.

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
   - Use the prompt lines in `aaron-lane.md` word for word. The main session reads only his returned YAML and his read. Log `run_state.aaron_lane.offer_call`.
5. **Lock the offers.** Run `/lead-magnet-brainstorm` in recorder mode: his offers go in word for word, with his ranking, and his who, traits and titles become the list definition. When a rail fails, one fix round goes back to a fresh Aaron sub-agent, and only the failing offer is held.
6. **Offer slate.** Run `/offer-test-slate` in slate mode and write `offer-test-slate.md` (client approval is optional). An offer only the client can honor is marked "needs the client's OK" and waits on its own.
7. **Size each offer's list from counts.** For each offer and segment, on Aaron's list definition (geography, headcount, keyword stack, title stack):
   - resolve the AI Ark enums first, then read AI Ark `company_search` `totalElements` for the company count;
   - read GetLeads `count_contacts` for the contact count. This step only counts; it never exports or reveals an email;
   - record both counts per offer, then estimate the Phase 3 spend (the contact enrichment tool plus the email verifier per contact) against `run_state.spend_ceiling_usd` (`/api-cost-governance`).
8. **Client asks.** Merge anything an offer needs from the client into the one unsent message in `client-asks.md` (create it if Phase 1 never did), per `outbound/reference/client-messages.md`: one yes or no per offer that needs the client (keyed `[offer-<rank>]`), one rough capacity question, the sample when one exists. Nothing is sent automatically.
9. **Offer Readiness.** Once the offers are recorded, fill each offer's readiness fields and write the read-only board per `outbound/reference/offer-readiness.md`: each offer's Start rail, what is missing and who owes it. A client approval is recorded only as that file describes, never inferred.

## Handoff: `phases/phase-2-offer.md`

"What the next phase needs" carries:
- the locked offers in Aaron's order, each with its one-sentence offer, who it goes to, its list definition (traits with their checks, titles, disqualifiers) and its evidence line;
- the counts per offer and segment, and the spend estimate against the budget;
- the ideas Aaron considered but did not test, and his divergences and pushback;
- each offer's readiness status;
- the paths to `aaron-offer-call.md`, `lead-magnets.md`, `_research/pain-clusters.md` and `offer-test-slate.md`.

## Checkpoint 2

Write the handoff, then run `python outbound/scripts/phase_state.py checkpoint <slug> 2 --handoff phases/phase-2-offer.md`.

The summary covers:
- what the buyers are struggling with (the top pain clusters in their own words, with counts and the Research QA verdict; HOLD reasons first);
- Aaron's offers in his order with his reasons, and the ideas he did not test;
- the list size per offer and the spend estimate;
- the readiness board: each offer's Start rail, what is missing and who owes it. Display only; it adds no question.

Then one native prompt, recommended answers first:
1. Build the list with Aaron's offers (recommended), or swap one. A swap wins over Aaron and is recorded as the operator's call.
2. A spend-budget raise, only when the Phase 3 estimate would cross `run_state.spend_ceiling_usd`.
3. One more targeted research pass, only when a HOLD or a low-confidence cluster sits under the leading offer.
4. Anything only the operator can answer (an offer that needs the client's OK, a frozen phase to reopen).

Record the answers in the handoff and the activity log, run `python outbound/scripts/phase_state.py approve <slug> 2 --answer "..."`, and close with: "Phase 2 is done. Open a new thread and say: Phase 3 for <client>."
