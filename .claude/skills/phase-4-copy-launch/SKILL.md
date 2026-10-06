---
name: phase-4-copy-launch
description: "Phase 4 of 4 for a cold-outbound client. Say \"Phase 4 for <client>\". Records Aaron's copy with the rails and frame check, builds the reply machine, spintax and paused drafts on the sending platform, checks Gates A to D, and stops at checkpoint B, the launch review. The operator presses Start."
---

# Phase 4: Copy and launch

**Say "Phase 4 for <client>" in a fresh thread, and this takes the verified lists to paused, launch-ready drafts, then stops once at checkpoint B.** The protocol every phase follows is `outbound/reference/phase-protocol.md`; read it first. This file only lists what Phase 4 does. The agent never presses Start and never buys infrastructure (`/autonomous-execution-policy` section 3).

Paths resolve under `outbound/`. Client profiles are gitignored, so read them with Bash or Read.

## Start

1. `python outbound/scripts/phase_state.py start <slug> 4`. If Phase 3's checkpoint is still open, show it again from `phases/phase-3-list.md`, take the operator's answer, approve it, and start again.
2. Read the read set (`phase-protocol.md` section 2). Phase 3's handoff is the input.
3. **The verified-list gate.** Copy is written only for a campaign in Phase 3's launch set with a verified `leads.verified.csv` at grade B or higher and a passed manual QA (`verified-list-gate.md`). Campaign folders the handoff does not name are old runs, so ignore them. Staging belongs to Phase 3 (`phase-protocol.md` section 5); a backfilled client that arrives unstaged is a missing Phase 3 output (section 7).
4. **Client answers owed.** If `client-asks.md` has a `### Sent <date>` message with no `#### Answers` block under it, the first thing said in the thread is one line asking the operator to paste what came back ("none came back" is a valid answer and skips them all). File what is pasted the same turn per `client-messages.md` ("Filing the answers the operator pastes back"). This never holds the phase: copy starts while the answers are owed.
5. **Reply guide refresh check** (ruling `reply-guide`; `/reply-guide`, "Phase 4 refresh check"). Run `python outbound/scripts/reply_guide.py diff outbound/profiles/<slug> --launch-set "<the Launch set keys line from Phase 3's handoff>"`.
   - **Exit 0:** the guide still matches. Skip the rebuild and note it under "Calls I made". If the manifest's `aaron_pass` is still `pending`, run only `/reply-guide` step 4 (Aaron's pass) and step 6 (re-render).
   - **Exit 2:** campaigns were added, changed or removed in Phase 3, or no guide exists yet. Run `/reply-guide` in `refresh` mode now, before step 3's reply machine, so the per-campaign reply files are built from the current guide. Name what changed at checkpoint B.

**The ask policy governs every step below** (`phase-protocol.md` section 3; `outbound/reference/standing-rulings.md`). Find the answer first, decide small calls and list them under "Calls I made", and stop mid-run only for the four stops that section names (a tool out of balance or down, spend over the budget, Aaron's call contradicting a client requirement, a missing required key), plus the named fifth: the Step 6 upload stop below.

## Steps (hands-free, unless the profile's older review setting adds stops; `phase-protocol.md` section 3)

1. **Copy.** Run `/campaign-copywriting` in recorder mode. It writes `variants.yaml` and `copy.md` from Aaron's sequences in `aaron-copy-call.md`, word for word. Then it runs the rails in `outbound/reference/aaron-lane.md` and the Aaron copy frames in `outbound/reference/aaron-copy-frames.md`, checked by `python outbound/scripts/aaron_frame_check.py`:
   - truth; `/spam-word-checker` and the send format;
   - variables that exist as columns in Phase 3's handoff;
   - compliance, including the opt-out handling (`capability_boundary.legal_or_compliance_limits`). It is always the FNNL house default for every client and geography: no opt-out line in the body, the one-click List-Unsubscribe header carries it, opt-outs by reply (operator directive 2026-09-30, always house default). When none is recorded, write the default there and carry on (`/campaign-copywriting`, the opt-out step). It is never asked, and no copy or checkpoint waits for it. A stricter requirement from the client's own counsel already on record is honored.

   A failure goes back to a fresh `/ask-aaron` sub-agent for one fix round. When it still fails, only that item is held and shown at the checkpoint. House copy logic never rewrites his copy.
2. **The offer assets the agency delivers.** When an offer's deliverable is ours to produce (a write-up, a teardown, a playbook), draft each missing one from its `details` and `delivery_reply` in `lead-magnets.md`, as Markdown in `campaigns/<slug>/assets/`. Truth rail: no invented results. Missing evidence is collected by a targeted research pass logged to the evidence ledger (`/offer-intelligence`), or the asset is held and listed. An asset only the client can supply goes into the unsent message in `client-asks.md` as a `BLOCKS-START` item (`outbound/reference/client-messages.md`), and only the campaigns that need it wait.
   - **One sample per offer** (Offer Readiness, `outbound/reference/offer-readiness.md`): one real sample of each offer's deliverable on a verified row from `leads.verified.csv`, DRAFT until reviewed, recorded in that offer's `sample:` block. A sample that cannot be built is recorded with what is missing, never skipped silently.
3. **The reply machine (Gate D files).** Run `/lifecycle-copy` for each campaign:
   - `interested-reply.md`, with its call script and the `Speed-to-lead owner:` header line (FNNL Agency by default). The owner and booking link are looked up first, in this order: the client's `rulings.md`; `run_state`; past `interested-reply.md` files in this client's campaigns; the client's past replies on the sending platform; the intel feed. Only when none has them are they carried to checkpoint B, with the line marked pending. They never stop the draft. Every interested reply, asset requests included, still gets a human call within about 5 minutes once live (`call-every-interested-reply` ruling); the delivery email itself stays pure value with no calendar push;
   - `pre-call.md`, with its confirmation page;
   - `offer.qualification`, wherever the offer has a costly front end.

   New prospect-facing lines (FAQ answers, an over-cap reply) come from a fresh `/ask-aaron` sub-agent.

   **Build these files from the reply guide** (`reply-guide.md`, `/reply-guide`). Its lines, already reviewed by Aaron and written in the client's voice (ruling `reply-voice-client`), are the source. Never name the agency or its staff in a reply, and never write "we work with <Client>". When a file and the guide disagree, the guide wins and both are updated together.
4. **Spintax, on every subject and every body of every step** (HARD RULE, operator directive 2026-09-30). Apply the sending platform's spintax syntax from `outbound/stack-contract.yaml` to the recorded copy: Email 1, each Email 1 variant, Email 2 and Email 3, subject lines included, with every unprotected body sentence spun and option A kept as Aaron's exact wording, per the spintax rule in `/campaign-copywriting`. It never changes an offer, a claim or a CTA. Step 7's read-back checks it.
5. **Launch settings, then senders.**
   - **Launch settings.** The sender-side settings (sender names, signature) are inherited from the client's earlier campaign on the sending platform, read-only, when the profile or the operator supplies it; the target-side ones are derived from this campaign (timezone, send days, hours and daily limits from the leads and senders; step waits from Aaron's sequence). None of these is asked (`launch-settings` ruling).
   - **Senders.** Read the sending pool read-only from the sending platform into `run_state.sending_pool` and confirm the allocation against `run_state.capacity_request`. With no request (a backfilled client), compute it with the formula in `/cold-email-kickoff` Step 4. Capacity is computed and stated as a note (`capacity` ruling): never an approval question, and it never cuts the wave. A smaller allocation only stretches the runway. **Infrastructure deferred** (`/cold-email-kickoff` Step 6.0): the paused draft is still built; buying or assigning domains and mailboxes is the operator's.
6. **Upload stop (the named fifth stop; asked the moment it is hit, even under `auto_execute`).** Run `/cold-email-kickoff` "Context sweep upload stop": refresh the pipeline rows into suppression first, then stop the upload of the campaigns it touches when a core sweep source is still BLOCKED and not waived, or a found blocklist is not fully in `suppression-list.csv` (`client-context-sweep.md`, Gates). A found blocklist not yet in `suppression-list.csv` is applied first (its names resolved to domains and appended), so the stop fires only for what cannot be resolved. A client do-not-contact list still owed is not this stop: the paused drafts are built and only Start waits (`dnc` ruling). Suppression itself is always applied before any lead is imported.
7. **Paused drafts.** Before this step's build, `/cold-email-kickoff`'s locked sequence runs `copy_var_gate.py` on the recorded copy against the lead file (Aaron flow, see `aaron-flow.md` section 9; read only that step there, not restated here): no blank `{{variable}}` ever ships, a blank row gets the frame's fallback wording or is held. Re-run `/preflight-credentials` with `--scope launch`, then build each campaign complete on the sending platform (sequence with every Email 1 variant, leads, senders where assigned, settings, schedule, signature) and leave it PAUSED. Drafting is not warmup-gated.
   - **Then prove it against the sending platform itself:** read each campaign back and check its steps, variants, lead count, sender count and status against the files on disk. Also check that every step's subject and body carries spintax, per the check in the spintax rule in `/campaign-copywriting`; a step without it is re-spun and updated before the draft counts as built. A mismatch is reported at the top.
8. **Pre-launch gates.** First run `python outbound/scripts/offer-readiness/build_readiness.py <client-dir>` once, so Gate C reads a fresh board. Then check Gates A to D exactly as `/cold-email-kickoff` "Pre-launch gates" defines them (read only that section). A failed gate blocks Start, never the draft. With infrastructure deferred, Gate A fails until the operator buys or assigns senders. Say plainly that replies run as a frequent sweep of the sending platform's reply inbox until a webhook receiver exists.
   - **Start rail per arm** (`offer-readiness.md`). A pending arm stays a paused draft with Start held until the client's yes is recorded; a `no` or `vetoed` arm is never built. Pending asks sent 48 or more hours ago get a one-line nudge draft for the operator.

**When holds stop some or all of the drafts** (a proof gap, a client-supplied asset, a rail that failed twice), end the phase as `phase-protocol.md` section 4 describes: build everything not held, show checkpoint B with the holds first, and resume with "Phase 4 for <client>" once they clear. A do-not-contact list still owed is not one of these: the drafts are built and only Start waits for it.

## Handoff: `phases/phase-4-launch.md`

"What the next phase needs" is the post-launch loop's starting point:
- per campaign: the sending-platform id, the lead and sender counts, and the gate status;
- the speed-to-lead owner;
- the capacity allocated, or the infrastructure still to build;
- the date warmup matures;
- what `/cold-email-weekly-rhythm` reads first.

## Checkpoint B: the launch review

Write the handoff, then run `python outbound/scripts/phase_state.py checkpoint <slug> 4 --handoff phases/phase-4-launch.md`.

Checkpoint B is the second and last human checkpoint (ruling `checkpoints`): it shows Phase 3's results and holds alongside Phase 4's own, since Phase 3 auto-approved with nothing shown at the time. The summary covers:
- Phase 3, carried forward: verified contacts per campaign and the total, the QA grade and the reviewer's manual sample findings, the catch-alls shipped labelled `catch_all` (ruling `catch-all`), the holdbacks (repeated errors), Aaron's launch set and any floor exception with his reason, the capacity request, and the Phase 3 spend against the budget;
- the built drafts (names, ids, lead counts, sender counts);
- the reply guide: unchanged since Phase 2, or rebuilt (what was added or removed), with the PDF path and any booking-link warning;
- Gates A to D, each passed or with the exact fix (Gate B states plainly when the PlusVibe placement test did not run, per the `placement-test` ruling);
- anything a rail held, shown with Aaron's version and the rail it breaks, including any Phase 3 QA question still unanswered;
- each arm's Start rail, and Aaron's divergences from the house defaults;
- the spend.

Then the pre-Start checklist, each item with what to do:
- the suppression reconcile;
- one rendered email per campaign to preview;
- the warmup date and reply readiness;
- the infrastructure purchase, when it is deferred;
- any account-only step.

The one action left is the operator's: review the drafts and press Start on the sending platform.

When the operator confirms the review, run `python outbound/scripts/phase_state.py approve <slug> 4 --answer "..."`. The client then leaves the phases for the weekly loop: `/cold-email-weekly-rhythm`, the reply sweep and `/market-evidence feedback`.
