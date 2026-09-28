---
name: phase-3-list
description: "Phase 3 of 4 for a cold-outbound client. Say \"Phase 3 for <client>\". Builds the TAM filter-first, the wave and Aaron's launch set, then runs the list engine to verified, QA'd contacts per campaign, and stops once at the list review."
---

# Phase 3: List

**Say "Phase 3 for <client>" in a fresh thread, and this builds the verified campaign lists, then stops once.** The protocol every phase follows is `outbound/reference/phase-protocol.md`; read it first. This file only lists what Phase 3 does.

Paths resolve under `outbound/`. Client profiles are gitignored, so read them with Bash or Read.

## Start

1. `python outbound/scripts/phase_state.py start <slug> 3`. If Phase 2's checkpoint is still open, show it again from `phases/phase-2-offer.md`, take the operator's answer, approve it, and start again.
2. Read the read set (`phase-protocol.md` section 2). Phase 2's handoff is the input.
3. **Tool-balance guard.** Before the first paid step, run `/tool-balance-guard`. A tool that is out of balance or down stops its step and asks the operator; never substitute another tool for it.

## Steps (hands-free, unless the profile's older review setting adds stops; `phase-protocol.md` section 3)

1. **Data points and proof, in parallel.** Launch two sub-agents together, each handed only the handoff excerpt it needs:
   - `/data-point-discovery` against the locked offers, writing `data-point-catalog.md`;
   - `/social-proof-bank`, writing `social-proof-bank.md`, starting from the proof facts Phase 1 collected. Only real raw-fact gaps go to the client, and they never hold the build.
2. **The TAM, filter-first.** Run `/tam-build`. Count and filter the universe before paying per contact:
   - resolve the AI Ark enums, then read AI Ark `company_search` `totalElements` with the list's filters and keyword stack;
   - then read GetLeads `count_contacts` on the same definition. GetLeads is also the gap-fill when the AI Ark universe comes back thin;
   - record the route taken in `run_state.discovery_route`. A lookalike seeded from offer-fit companies is an option when the offer needs one or filters build a poor universe, not a must.
   - **Phase A sample and the 25-account list QA.** An independent reviewer sub-agent checks the targeting. Two failures stop the run before Phase B spend.
   - **Phase B.** The whole market is pulled inside the budget. Company fit is judged on the wave's companies by a Claude sub-agent fan-out per `/personalization-subagent-pattern` (disjoint slices, one output file per agent, merge and dedup by domain), never a third-party AI API.
   - **The reporting guard.** Report the drop counts per segment and group, and flag at the top any slice under the 500-company floor.
3. **Scoring, only when needed.** `/lead-scoring` (with `lead_score.py`) runs only when sending capacity forces a cut. It is optional for a first wave that ships every tier.
4. **The wave.** `/campaign-strategy` drafts the whole-TAM first wave, with the offers as equal cells placed by fit. It also writes `run_state.capacity_request`, put to the operator in one line as a shared-pool request, never a purchase and never a trim.
5. **The Aaron campaign and copy call, before any verification runs** (`outbound/reference/aaron-lane.md`, Call 2). The wave reveals and verifies only the contacts Aaron's launch set picks, never the whole TAM up front, which keeps per-contact spend inside the budget.
   - Run one fresh `/ask-aaron` sub-agent in the background, with the Call 2 prompt lines word for word, including the copy-frame rule (`outbound/reference/aaron-copy-frames.md`).
   - He rules on which campaigns launch now, later or not at all, and writes every launching campaign's sequence. The copy waits in `aaron-copy-call.md` for Phase 4. `/campaign-strategy` rewrites the wave to his launch set. Log `run_state.aaron_lane.copy_call`.
6. **The list engine**, on his `now` campaigns only, by `/email-waterfall`'s rules, with the provider order read from `outbound/reference/provider-routing.yaml`:
   - pick contacts per company and classify titles with `title_classify.py --spec <targeting-spec.yaml> --contacts <in.csv>`;
   - plan and ledger every rung with `list_waterfall.py`: verify any email already on the row first, then the contact enrichment tool, then the email verifier (`millionverifier_verify.mjs`), then the fallback finder only on blanks and rejects, then the verifier again;
   - catch-all verdicts go to `leads.catchall-holdback.csv`, never to the fallback finder;
   - `/list-quality-scorecard` at grade B or higher, then the split into `campaigns/<slug>/leads.verified.csv`.

   After list QA passes, push each stage to the list workbench by webhook (`workbench_push.mjs --client <slug> --table <companies|contacts|scored|send_list>`, per `clay-workspace-workflow.md`). Zero workbench credits: never run an enrichment column there. Log every paid step as `NOTE spend: ...`.

   **Stage each campaign where the later steps read it**, with its QA report and the reviewer's manual QA, per `phase-protocol.md` section 5 (`list_qa.py run`, then an independent reviewer sub-agent, then `list_qa.py score-sample`).
7. **Verify before done.** Count the verified rows per campaign in the files on disk, and check them against the ledger and the verified-list gate (`verified-list-gate.md`). A shortfall is reported at the top of the checkpoint, never rounded up.

## Handoff: `phases/phase-3-list.md`

"What the next phase needs" carries:
- per launching campaign: its slug, offer, segment, verified contacts and companies, the grade, the catch-alls held back, and the path to `leads.verified.csv`;
- the variable columns that exist and how full each is (Phase 4 copy may use only these);
- `later` and `drop` campaigns, with Aaron's reasons; the discovery route; the capacity request;
- the path to `aaron-copy-call.md`;
- the suppression status (a client do-not-contact export still owed holds the upload only).

## Checkpoint 3: the list review

Write the handoff, then run `python outbound/scripts/phase_state.py checkpoint <slug> 3 --handoff phases/phase-3-list.md`.

The summary covers:
- verified contacts per campaign, and the total;
- the QA grade and the reviewer's sample findings;
- the holdbacks (catch-alls, repeated errors);
- Aaron's launch set, and any campaign under the floor he kept or folded, with his reason;
- the spend for this phase against the budget, with the balance report.

Then one native prompt:
1. Approve the lists and move to copy and launch (recommended), or name a fix.
2. The capacity allocation, when the pool has answered.
3. Anything a rail, a tool balance or a client ask is holding.

Record the answers, run `python outbound/scripts/phase_state.py approve <slug> 3 --answer "..."`, and close with: "Phase 3 is done. Open a new thread and say: Phase 4 for <client>."
