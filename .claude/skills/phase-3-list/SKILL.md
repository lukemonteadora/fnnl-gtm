---
name: phase-3-list
description: "Phase 3 of 4 for a cold-outbound client. Say \"Phase 3 for <client>\". Builds the TAM filter-first (AI Ark at scale), the wave and Aaron's launch set, then runs the list engine (reservoir first) to verified, QA'd contacts per campaign, and auto-approves straight into Phase 4; results surface at checkpoint B."
---

# Phase 3: List

**Say "Phase 3 for <client>" in a fresh thread, and this builds the verified campaign lists, then auto-approves straight into Phase 4** (ruling `checkpoints`, Aaron flow, see `aaron-flow.md` section 2). The protocol every phase follows is `outbound/reference/phase-protocol.md`; read it first. This file only lists what Phase 3 does.

Paths resolve under `outbound/`. Client profiles are gitignored, so read them with Bash or Read.

**The ask policy governs every step** (`phase-protocol.md` section 3). Find the answer first (the handoff, the client's `rulings.md`, `standing-rulings.md`). Small calls are decided and listed under "Calls I made"; anything else becomes a hold on the touched item or a note. The mid-run stops are a tool out of balance or down, spend over the budget, Aaron's call contradicting a client requirement (step 5), a missing required key, and the kickoff Step 6 draft-upload stop.

## Start

1. `python outbound/scripts/phase_state.py start <slug> 3`. If Phase 2's checkpoint is still open, show it again from `phases/phase-2-offer.md`, take the operator's answer, approve it, and start again.
2. Read the read set (`phase-protocol.md` section 2). Phase 2's handoff is the input.
3. **The GetLeads export OK.** Look for it in that handoff, then in the client's `rulings.md` (key `getleads-export`), which covers every later wave once given. Only if neither has it, hold the export and put the question to the operator first, alone, then store the answer in `rulings.md` the same turn. Every GetLeads export in this phase runs under that one answer, and `confirmed=true` is never set without it.
4. **Client answers still owed.** If `client-asks.md` has a sent message with no `#### Answers` block under it, ask the operator in one line to paste the answers ("none came back" is a valid answer), then file them per `client-messages.md` ("Filing the answers the operator pastes back") before the build starts.
5. **Tool-balance guard.** Before the first paid step, run `/tool-balance-guard`. A tool that is out of balance or down stops its step (one of the four mid-run stops); never substitute another tool for it.

## Steps (hands-free, unless the profile's older review setting adds stops; `phase-protocol.md` section 3)

1. **Data points and proof, in parallel.** Launch two sub-agents together, each handed only the handoff excerpt it needs:
   - `/data-point-discovery` against the locked offers, writing `data-point-catalog.md`;
   - `/social-proof-bank`, writing `social-proof-bank.md`, starting from the proof facts Phase 1 collected. Only real raw-fact gaps go to the client, and they never hold the build.
2. **The TAM, filter-first.** Run `/tam-build`. Count and filter the universe before paying per contact:
   - resolve the AI Ark enums, then read AI Ark `company_search` `totalElements` with the list's filters and keyword stack;
   - then read GetLeads `count_contacts` on the same definition. GetLeads is also the gap-fill when the AI Ark universe comes back thin;
   - record the route taken in `run_state.discovery_route`. A lookalike seeded from offer-fit companies is an option when the offer needs one or filters build a poor universe, not a must.
   - **Phase A sample and the 25-account list QA.** An independent reviewer sub-agent checks the targeting. A failure gets one fix round. A second failure names the targeting question behind it: a stored ruling (`targeting:<topic>` in `rulings.md`, or `standing-rulings.md`) is applied and the slice reruns once; with no ruling, only that segment is held from Phase B and the question carries forward to checkpoint B (Phase 4) while the rest builds (`qa-loops` ruling; Phase 3 has no human stop of its own). There is never a third round. The Phase 2 targeting preview (the AI Ark 200-row sample) exists to surface these questions before this phase.
   - **Phase B.** The whole market is pulled inside the budget, AI Ark at scale (the refined search from Phase 2's 200-row sample, pulled via REST in slices to avoid the 10,000-result cap, per `aaron-flow.md` section 6), with GetLeads as the thin-universe company top-up. Company fit is judged once per `company_domain` (`company-level-only` ruling) on the wave's companies by a Claude sub-agent fan-out per `/personalization-subagent-pattern` (disjoint slices, one output file per agent, merge and dedup by domain), never a third-party AI API. Fit ships `good` and `maybe`; only `bad` drops, and an unsure `bad` stays `bad` labeled `needs_review`, never relabeled `maybe` (`fit-ship-rule` ruling).
   - **The reporting guard.** Report the drop counts per segment and group. The 500-company and ~1,300-pooled floors are advisory notes, not stops (the 14 removed volume limits, `aaron-flow.md` section 13); `run_state.list_mode` (`volume` by default, `yield` when fewer than 2,000 companies pass fit) is logged with the reason when it switches (`list-mode` ruling).
3. **Scoring, only when needed.** `/lead-scoring` (with `lead_score.py`) runs only when sending capacity forces a cut. It is optional for a first wave that ships every tier.
4. **The wave.** `/campaign-strategy` drafts the whole-TAM first wave, with the offers as equal cells placed by fit. It also writes `run_state.capacity_request`, stated as a note at the checkpoint (a shared-pool figure). It is never a purchase, never a trim and never an approval question (`capacity` ruling).
5. **The Aaron campaign and copy call, before any verification runs** (`outbound/reference/aaron-lane.md`, Call 2). The wave reveals and verifies only the contacts Aaron's launch set picks, never the whole TAM up front, which keeps per-contact spend inside the budget.
   - Run one fresh `/ask-aaron` sub-agent in the background, with the Call 2 prompt lines word for word, including the copy-frame rule (`outbound/reference/aaron-copy-frames.md`).
   - He rules on which campaigns launch now, later or not at all, and writes every launching campaign's sequence. The copy waits in `aaron-copy-call.md` for Phase 4.
   - Run the client-fit check on his launch set and copy (`aaron-lane.md`, "Client-fit check"). No contradiction means his call is used as written, with no approval question. A contradiction with a client requirement, instruction or note stops the run and shows the operator both lines (one of the four mid-run stops).
   - `/campaign-strategy` rewrites the wave to his launch set. Log `run_state.aaron_lane.copy_call`.
6. **The list engine**, on his `now` campaigns only, by `/email-waterfall`'s rules, with the provider order read from `outbound/reference/provider-routing.yaml`. No per-company contact cap: every verified buyer at a fit company goes in, written round-robin by company inside each priority tier (`no-contacts-cap` ruling):
   - pick contacts per company and classify titles with `title_classify.py --spec <targeting-spec.yaml> --contacts <in.csv>`;
   - plan and ledger every rung with `list_waterfall.py`: the reservoir (`reservoir.py lookup`) first for a recent (last 90 days) MillionVerifier `ok` on a matched person, keyed by LinkedIn slug with lowercase-email fallback (Aaron flow, see `aaron-flow.md` section 7); then any email already on the row; then the contact enrichment tool (AI Ark's email finder, then Prospeo, which never opens on a person AI Ark has not tried); then the email verifier (`millionverifier_verify.mjs`); then the fallback finder only on blanks and rejects; then the verifier again. The walk stops at the first `ok` (`every-email-verified` ruling). Every verdict is written back to the reservoir (`reservoir.py writeback`) after verification;
   - **domain-match rule.** A candidate email's domain must match the company: a personal-domain email is dropped, and a work email on a different domain ships only when proven same company (a colleague already verified on it, or a brand domain the company's own site or AI Ark record names); otherwise it is dropped as a wrong-company email;
   - catch-all verdicts go to `leads.catchall-holdback.csv`, never to the fallback finder. Whether they ship is decided automatically by the sender-domain maturity per the `catch-all` ruling, so it is never a question; `risky`, `unknown`, `invalid` and unverified rows never ship and are never asked about;
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
- the suppression status (a client do-not-contact export still owed holds Start only; the drafts are still built);
- verified contacts per campaign and the total; the QA report and the reviewer's manual sample findings per campaign (`list-qa-report.md`, `qa-sample.csv`), and the grade from `/list-quality-scorecard`;
- the holdbacks (catch-alls, repeated errors), and anything held by a QA question with no stored ruling, naming the targeting question behind it;
- the spend for this phase against the budget, with the balance report;
- anything a rail, a tool balance or a client ask is still holding, for checkpoint B to show.

## Checkpoint 3: auto-approved

Write the handoff, then run `python outbound/scripts/phase_state.py checkpoint <slug> 3 --handoff phases/phase-3-list.md`.

Phase 3 has no human stop (ruling `checkpoints`). Everything a checkpoint would otherwise show here (verified contacts per campaign, the QA grade and reviewer findings, the holdbacks, Aaron's launch set and any floor exception with his reason, the capacity request, the phase spend) goes into the handoff instead, so checkpoint B (Phase 4) shows it alongside the launch review. A QA question with no stored ruling, or any other hold, carries forward the same way rather than being asked here.

Then run `python outbound/scripts/phase_state.py approve <slug> 3 --answer "auto: Aaron flow, no checkpoint 3"`, log `DONE Phase 3 (auto-approved, Aaron flow)`, and close with: "Phase 3 is done. Open a new thread and say: Phase 4 for <client>." (Phase 4 may also start in the same thread.)
