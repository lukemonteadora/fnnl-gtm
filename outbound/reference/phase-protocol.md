# The four phases: one thread per phase, two human checkpoints

**What this is.** A client goes from onboarding to paused drafts in four phases. The operator starts each one in a fresh conversation by saying "Phase N for <client>" (in Claude Code, Codex or OpenMausBot). The phase runs from start to finish without stopping for small calls. It ends at its checkpoint, writes a handoff file for the next phase, and freezes once approved. This is an operator decision (ported to FNNL on 2026-09-28). This file is the one place the protocol lives; the phase skills point here and never restate it.

**Two human checkpoints (Aaron flow, see `aaron-flow.md` section 2; ruling `checkpoints`, 2026-10-05).** Only Phase 2 (checkpoint A, the one "go ahead" batch) and Phase 4 (checkpoint B, the launch review) stop for the operator. Phases 1 and 3 still write their handoff and run `checkpoint`, then approve themselves at once with `approve --answer "auto: Aaron flow, no checkpoint <n>"`, so the tracker, the freeze and `/continue-client` work unchanged. "Checkpoint A" is the old checkpoint 2 and "checkpoint B" the old checkpoint 4; `phase_state.py` phase numbers do not change. Phase 1 may continue straight into Phase 2 in the same thread; after Phase 3 a fresh thread for Phase 4 is recommended, because Phase 3 is long.

**It replaces the older checkpoint record.** The kickoff's four phase checkpoints used to be recorded in `run_state.checkpoints` (`/cold-email-kickoff`, "How a run stops"). For a client with a `phases/state.yaml`, the phase tracker below is the record, and `run_state.checkpoints` is read only once, by the backfill in section 7, to place the client. The stops themselves (hands-free inside a phase, one prompt at the end, at most four questions) are unchanged.

| Phase | Skill | What runs | Handoff file | Checkpoint (the one stop) |
|---|---|---|---|---|
| **1. Onboarding** | `/phase-1-onboarding` | Context sweep (`client-context-sweep.md`, with the Slack read in `client-slack-check.md`), blocklists into suppression, live website scrape (`client-website-scrape.md`), the folder refresh for a returning client (`client-folder-refresh.md`), profile and ICP (with the five Aaron intake fields), segments, proof facts, key preflight | `phases/phase-1-onboarding.md` | **None: auto-approved.** The ICP and segments are shown at checkpoint A. The one question left here is a website no route can read, asked as one line |
| **2. Research and offer** | `/phase-2-research-offer` | Aaron's quick demand mining (the Research QA gate is off unless the operator asks), the Aaron offer call (`aaron-lane.md`), the offer lock, the offer slate (`/offer-test-slate`), the AI Ark company sample (200 to 300 companies) and keyword mining per vertical (`ai-ark-people-discovery.md`; operator directive 2026-10-06, see `standing-rulings.md` `discovery-flow`), which is also the targeting preview | `phases/phase-2-offer.md` | **Checkpoint A, the one "go ahead".** The offers, ICP, segments and refined searches shown for information, and every question the rest of the run needs (`aaron-flow.md` section 2.1) |
| **3. List** | `/phase-3-list` | Data points and proof bank, the full company export in GetLeads on the refined search, company fit, the GetLeads people search at the fit companies (AI Ark in parallel only if fast; operator directive 2026-10-06, see `standing-rulings.md` `discovery-flow`), the Aaron campaign and copy call, then the list engine: the reservoir, the email waterfall, verify with the email verifier, QA, split per campaign | `phases/phase-3-list.md` | **None: auto-approved.** Its results and holds are shown at checkpoint B |
| **4. Copy and launch** | `/phase-4-copy-launch` | Aaron's copy recorded with the rails (`aaron-copy-frames.md`), the reply machine (Gate D), spintax, sender check, PAUSED drafts on the sending platform, Gates A to D | `phases/phase-4-launch.md` | **Checkpoint B, the launch review**, with the Phase 3 list counts, QA grades and holds. The operator presses Start on the sending platform; the agent never does |

**Phase 4 ends at a PAUSED draft.** Infrastructure (domains, mailboxes) may still be deferred when Phase 4 runs: an empty or `deferred` infrastructure slot never holds phases 1 to 3, and in Phase 4 it holds only the step that uses it (attaching senders), never the rest of the draft (CLAUDE.md section 1, `/autonomous-execution-policy` section 0). The launch review then lists the infrastructure still to build, and Gates A to D block Start until it exists. Pressing Start is always the operator's.

After Start the client leaves the phases. The weekly loop runs it from there: `/cold-email-weekly-rhythm`, reply handling in the sending platform's unibox (`reply-scoring-core.md`), and `/market-evidence feedback`.

## 1. The phase tracker

Each client has `outbound/profiles/<slug>/phases/state.yaml`, and only `outbound/scripts/phase_state.py` writes it. It lives outside `client-profile.yaml` on purpose, so the tracker never rewrites a hand-edited profile.

```
python outbound/scripts/phase_state.py board                          # every client, its phase, its next step
python outbound/scripts/phase_state.py start <slug> <n>               # at the start of a phase
python outbound/scripts/phase_state.py checkpoint <slug> <n> --handoff phases/<file>.md
python outbound/scripts/phase_state.py approve <slug> <n> --answer "<the operator's answer in one line>"
python outbound/scripts/phase_state.py reopen <slug> <n> --reason "<why>"
python outbound/scripts/phase_state.py release <slug>                 # clear a lock left by a dead thread
python outbound/scripts/phase_state.py place <slug> --phase N --status S [--legacy]   # backfill only (section 7)
```

- **Statuses:** `not_started`, `running`, `checkpoint_shown`, `approved` (frozen), `reopened`, `needs_review` (a later phase after a reopen).
- **`start` refuses (exit 3)** when the previous phase is not approved, when its checkpoint is still open, or when another thread holds the client. Read the message and do what it says. Never edit `state.yaml` by hand to get past it. A lock older than 12 hours can be taken over with `--take-stale-lock`.
- **`approve` stamps the commit** the phase was built under (`built_under`). That stamp is how a resume knows which version of the rules made the phase's files.
- **The board** is the operator's one-screen view of every client: `python outbound/scripts/phase_state.py board`.

## 2. Starting a phase (the first three moves of every phase skill)

1. **Identify the client.** Match the spoken name to a folder in `outbound/profiles/` (voice typing garbles names, so match loosely and confirm in one line). No folder means a new client, and only Phase 1 can start one.
2. **Run `start <slug> <n>`.**
   - If it reports an open checkpoint on the previous phase, show that checkpoint again (read its handoff file) and take the operator's answer. Then run `approve` and `start` again. This is how the operator can answer a checkpoint in the next phase's thread. **Saying "Phase N" is not itself the answer to checkpoint N-1:** the checkpoint prompt is still shown, with approve as the recommended option, because it carries decisions (a swap, a fix, a budget raise) that the request did not.
   - If it reports the previous phase not approved, say which phase to run instead and stop.
   - If it reports a lock, another thread is working this client. Say so and stop.
3. **Read only the read set:**
   - The **CURRENT STATE** block of `activity-log.md`, not the whole log.
   - The **`run_state`** block of `client-profile.yaml`: `execution_mode`, `review_protocol`, `spend_ceiling_usd` and the operator facts (`speed_to_lead_owner`, `booking_link`).
   - The **Needs attention** and **Open items** sections of `client-intel.md` (`client-intel-feed.md`).
   - The **previous phase's handoff file**.
   - **This phase's skill.**
   - The files the handoff names for this phase, and the owning skills this phase runs, each at the moment it runs.

   Never read other phases' skills, old research runs or the whole activity log. A long thread that carries all of that is what makes each step slow.

## 3. Inside a phase

### The ask policy (HARD RULE, operator directive 2026-09-30)

Onboard, lock the offer, build the list, write the copy, stage paused campaigns. The operator's words: "before even asking a question, try to find the answer yourself," and "if you need any question to do the task smoothly, ask it beforehand." Every skill a phase runs follows these four rules. **This section overrides any "ask before acting", "Material Decision Rule", "confirm with the operator" or "stop and ask" line inside an owning skill while that skill runs inside a phase.** An owning skill's own wording never adds a question this section removes.

1. **Find it first.** Before any question, look in this order and stop at the first real answer:
   1. `outbound/reference/standing-rulings.md` (house-wide) and `profiles/<slug>/rulings.md` (this client).
   2. `client-profile.yaml`, the phase handoffs, the activity log's CURRENT STATE, and any launch settings already on record for the client's past campaigns (sender names, signature, schedule, timezone).
   3. `client-intel.md` (meeting notes, Slack), `context-sweep.md`, `slack-context.md`, and the client's or the team's notes filed there.
   4. A targeted, read-only search of the connectors the context sweep already reads (Slack, email, Drive).

   An answer found this way is applied, and cited in one line under "Calls I made".

   **Reuse with judgment (operator, 2026-09-30).** A past answer or setting applies only while its context still matches. When the new campaign differs in a way that matters (a different geography, buyer type, offer, list size or sender count), derive the value that fits the new facts rather than copying the old one. Sender-side settings carry over (who sends and how: sender names, signature, sending accounts). Target-side ones are derived from the new campaign (timezone, send days, hours, holidays, daily limits, step waits). Examples: the timezone follows the new leads, not the last campaign; a targeting ruling for one offer is not assumed for a different offer; a volume cap sized for a big list is not copied to a small one. Note the departure and its reason under "Calls I made" (`standing-rulings.md`, `launch-settings`). It is never a question. This wording only decides what to carry over: it never removes a stop or a hold, including the draft-upload stop named below.
2. **Ask up front, once, in one batch.** A question only the operator (or the client) can answer is asked at the checkpoint **before** the work that needs it, never in the middle of that work. Checkpoint A (Phase 2, `aaron-flow.md` section 2.1) collects all of it in one batch: the do-not-contact list, the speed-to-lead owner and booking link, a core source the sweep could not read, the targeting edge cases the AI Ark company sample (200 to 300 companies) surfaced, the GetLeads export confirmation once per client (every run uses one since 2026-10-06; operator directive, see `standing-rulings.md` `discovery-flow`), the PlusVibe placement-test OK when no ruling answers it, and a budget raise when the estimate needs one. Phase 3 and Phase 4 then run straight through. The one question Phase 1 keeps is a website no route can read, because the hard rule blocks research until it is resolved.
3. **Decide the rest.** A small call with no stored answer (which of two near-identical titles, a borderline company, a count, a date, a setting) takes the recommended default. It is logged under "Calls I made" at the checkpoint, where the operator can reverse it. It is never a question.
4. **Answered once, never asked again.** Every answer the operator gives, in chat or at a checkpoint, is written the same turn to `profiles/<slug>/rulings.md` (this client) or `standing-rulings.md` (house-wide, when the operator says it applies to every client). A later skill finds it by rule 1.

**What still stops a phase mid-run (only these four):**
- **A tool out of balance or down** (`/tool-balance-guard`). The operator tops up, the same tool resumes. The pre-phase balance check probes every key the phase will use, so this should surface before the run, not during it.
- **Spend over the client's budget** (the automatic budget in `/autonomous-execution-policy` section 2, and the one-time infrastructure setup total, which sits outside it and is approved once).
- **Aaron's offer or copy contradicts a client requirement, instruction or note** (`aaron-lane.md`, the client-fit check). The run stops and shows the exact contradiction.
- **A required key missing** (preflight exit 1).

**One named exception FNNL keeps: the draft-upload stop.** Immediately before the paused draft is uploaded, `/cold-email-kickoff` Step 6 stops and asks, even under `auto_execute`, when the `context_sweep` block is missing, a core source is still `blocked` and not waived by the operator, or a found blocklist is not yet in `suppression-list.csv` (`client-context-sweep.md`, Gates). It is a fifth stop on purpose: it protects the send, and nothing else in this section removes it.

Everything else that used to stop a phase is now a **hold on only the item it touches** (shown first at the checkpoint, with who owes what) or a **note**:
- Unverified emails never ship and are never asked about (`risky`, `unknown`, `invalid`, not verified). Verified catch-alls ship automatically, labelled `catch_all`, and are never asked about (operator directive 2026-10-06, see `standing-rulings.md` `catch-all`).
- A do-not-contact list is asked once at checkpoint A. "No" is recorded as `dnc: none` and never asked again. "Yes" means the drafts are still built paused; when the list lands it goes into suppression and its contacts are removed from this client's own draft campaigns, and only Start waits for it.
- A QA failure gets one fix round. If it still fails, the targeting question behind it is named: a stored ruling is applied and the slice reruns once; with no ruling, the question goes to the checkpoint as a note on that campaign, never a hold on its upload (ruling `qa-loops`, amended 2026-10-13 by `volume-first`). There is never a third QA round.
- The opt-out is never asked and never holds anything (`standing-rulings.md`, `opt-out`): every client and geography gets the FNNL house default (no opt-out line in the body, the one-click List-Unsubscribe header carries it, opt-outs by reply).
- A client-intel item that conflicts with a locked value never overwrites it and never stops the step: it is listed at the checkpoint.

**The hands-free branch.** Every skill the phase runs takes its `auto_execute` branch under this policy. It takes the recommended default, records it, and lists it under "Calls I made" at the checkpoint so the operator can reverse it.

- **One thread per client.** Different clients may run in parallel; one client never runs two phases at once.
- **Write-after still applies.** Each material step appends its activity-log line and refreshes CURRENT STATE (`client-activity-log.md`).
- **An older review setting adds stops, never removes them.** A client whose profile carries `execution_mode: review_gates` or `review_protocol: per_phase_gates` keeps those extra stops inside the phase until the operator switches it. Switching a client is the operator's call. When a profile carries both settings, the `review_gates_list` decides the extra stops, and the owning skills run their `auto_execute` branches between them. `execution_mode: review_gates` with no list means each owning skill's own `review_gates` branch runs. An old gate in a `review_gates_list` is honored by what it reviews: it stops just before the phase step that would act on that thing (a gate on the list and copy stops before the upload). `phase_checkpoints` (or no field) means the one checkpoint only.
- **Balance report.** After a step that used a paid tool, post the short balance report (`/tool-balance-guard`), and log the spend line `/autonomous-execution-policy` section 2 asks for.

## 4. Ending a phase: handoff, checkpoint, freeze

1. **Write the handoff file** to `profiles/<slug>/phases/<file>` in this shape (plain Markdown, short):

```markdown
# Phase <n> handoff: <phase name>, <Client>

Status: final
Built: <YYYY-MM-DD>, commit <short hash>
Checkpoint: shown <date> | answered <date>: "<the operator's answer>"

## What the next phase needs
<the contract: the decisions, counts and file paths the next phase starts from, and nothing else>

## Decided in this phase
<locked decisions, each with its source (the operator, Aaron, the rubric)>

## Calls I made (the operator can reverse any)
<minor defaults taken without asking>

## Open items and client asks
<what is pending, who owes it, and what it holds (only that item waits)>

## Spend this phase
<per tool, and the wave total against the budget>
```

2. **Run `checkpoint <slug> <n> --handoff phases/<file>`.** This releases the thread's lock. **Phases 1 and 3 stop here:** run `approve <slug> <n> --answer "auto: Aaron flow, no checkpoint <n>"` at once, log `DONE Phase <n> (auto-approved, Aaron flow)`, and carry the phase's "Calls I made" and holds forward to the next human checkpoint (A for Phase 1, B for Phase 3). Steps 3 and 4 apply to checkpoints A and B only.
3. **Show the checkpoint:** a short summary in plain words, then one native prompt carrying every question the phase needs. At most four questions, with the recommended answer first. Group related facts into one question. A second prompt is allowed only when more than four separate operator-only questions remain. Ask only what passes the ask test in `/cold-email-kickoff` ("Resolve it yourself first") and is left as a question by the ask policy above (only checkpoint A asks new questions; checkpoint B shows results and holds).
4. **When the operator answers:** record the answer in the handoff's Checkpoint line and in the activity log (`DONE Phase <n> checkpoint: <answer>`), then run `approve <slug> <n> --answer "..."`. A swap or correction the operator makes wins, and it is applied before approving. Checkpoint A's onboarding answers still go to the fields later gates read (the `icp` block, `run_state.speed_to_lead_owner`, `run_state.booking_link`), and every answer is also stored as a ruling the same turn (section 3, rule 4). The opt-out is not an answer to collect: when `capability_boundary.legal_or_compliance_limits` has no entry, the phase records the house default there itself, citing "operator directive 2026-09-30, always house default".
5. **Close with the next step in one line:** "Phase <n> is done. Open a new thread and say: Phase <n+1> for <client>." After the auto-approved Phase 1, Phase 2 may start in the same thread.

**When something holds the phase's last step.** A client ask or a proof gap can hold some or all of the phase's output (a do-not-contact list still owed holds only Start). Build everything that is not held. Then write the handoff and show the checkpoint anyway, with the holds listed first. For each hold, name who owes what, and the exact step that runs once it clears ("0 of 9 drafts built: the client's do-not-contact export is owed; the upload runs on receipt"). The phase stays at `checkpoint_shown`. Saying "Phase N for <client>" again resumes it (`start` allows it, because the phase is not approved), runs only the held steps, and shows the checkpoint again. Approve only when the checkpoint's own decision is made. Never approve Phase 4 while a launch-set campaign is still held: approve it once every campaign is built as a PAUSED draft or the operator drops it, because approving freezes the phase and ends the resume path. Senders not yet attached because infrastructure is deferred is not a held campaign (see "Phase 4 ends at a PAUSED draft" above).

**Freezing.** An approved phase is frozen. Rules that change later apply to phases not yet started, never to frozen work. A frozen phase reopens (`reopen`) only for one of these:
- a broken safety rail (truth, compliance, suppression, send format, verified-only emails);
- a change the operator marks as breaking;
- new client facts that contradict it, such as a vetoed offer, a new exclusion, or the client pausing.

**Offer approvals and readiness fields in a frozen Phase 2** (Offer Readiness, operator decision 2026-09-28; `outbound/reference/offer-readiness.md`). Writing the evidence fields (`lead_magnet_client_ok_by`, `_at`, `_evidence`) or a client `yes` into a frozen Phase 2 offer block, the way `offer-readiness.md` records an approval, is NOT a reopen: it records a fact the frozen plan was already waiting on. A client `no` IS one (the vetoed-offer trigger above). The one-time backfill of readiness fields (the evidence trio as nulls, `delivery_mode`, `free_unit_cap_per_week: null`) into an approved phase is evidence-only and not a reopen either. Setting a cap value or adding samples to a frozen phase changes the plan, so it needs the operator to mark the change as breaking.

`/continue-client` and `/cold-email-flow-audit` respect the freeze. **A phase approved by backfill** (`built_under` starting with `pre-phase`, including a backfilled checkpoint approved later) has no rules snapshot to audit against: it counts as frozen from its placement date, is audited as legacy (its outputs checked for the rails and for the hard-rule outputs later phases need, never for newer style rules), and its approval is a placement the operator has not confirmed yet, not their sign-off. A newer rule than a frozen phase's `built_under` commit is reported as information ("a newer rule exists for phase 2"), never as a reason to regenerate the work.

## 5. QA-ing lists for the copy gate and the upload

The list engine (`/email-waterfall`, whose `finalize` step in `outbound/scripts/list_waterfall.py` writes each campaign's send file) already writes `campaigns/<campaign>/leads.verified.csv`, which the verified-list gate (`verified-list-gate.md`), the copy and the upload read. For each campaign in Aaron's launch set:
- run `python outbound/scripts/list_qa.py run --dir <campaign dir> --spec <targeting-spec.yaml>`, which writes that folder's `list-qa-report.md` and the manual sample (`qa-sample.csv`);
- merge the catch-alls into `leads.verified.csv`, each row labelled `catch_all`, until the scripts gain a ship option (operator directive 2026-10-06, see `standing-rulings.md` `catch-all`): the planner's catch-alls go into list QA's input first, so only the rows `list_qa.py` held back for being catch-all alone (already past suppression, dedupe and its other checks) are merged;
- have one independent reviewer (a sub-agent handed only the sample and the targeting spec) score the sample, then record it with `python outbound/scripts/list_qa.py score-sample --dir <campaign dir> --sample <reviewed.csv>`, since the verified-list gate needs that manual QA pass;
- run `/list-quality-scorecard` for the grade the gate reads.

Campaign folders not in the launch set, including old runs, stay as they are. The handoff names them as not current.

## 6. What each checkpoint asks

| Checkpoint | Asks (recommended first) |
|---|---|
| **Phase 1** | **None: auto-approved** (ruling `checkpoints`). The one line it may ask is a website no route could read, or a `no_website` to confirm. Its "Calls I made" go forward to checkpoint A |
| **A (Phase 2)** | **The one up-front batch for the rest of the run** (`aaron-flow.md` section 2.1). "Go ahead: build the list and the drafts" (recommended), with Aaron's offers, the ICP, the segments and the refined AI Ark search per vertical (count, fit rate, keywords added) shown for information; a swap or correction rides in this answer and wins. The targeting edge cases the 200 to 300 company sample surfaced, each with the recommended answer first. **Does the client have a do-not-contact list?** ("No" is stored as `dnc: none` and never asked again.) The speed-to-lead owner and booking link, and a core sweep source that could not be read, each only when the find-it-first order did not answer them. **The GetLeads export OK**, given once per client and stored as a ruling (every run uses a GetLeads export since 2026-10-06, so it is asked unless the client's `rulings.md` already holds it; ruling `getleads-export`). **The PlusVibe placement-test OK**, only when no ruling answers it, with its cost read first. A spend-budget raise only if the estimate would cross it. The client message to send (`client-asks.md`). Never an opt-out question. Research HOLD reasons, when the operator turned the Research QA gate on, lead the summary |
| **Phase 3** | **None: auto-approved.** A QA failure is a note on its campaign, never a hold (ruling `qa-loops`, amended by `volume-first`); that note and every campaign Aaron kept or folded under a floor goes forward to checkpoint B with its reason |
| **B (Phase 4)** | Nothing to approve on the agent's side. The review shows Aaron's launch set, the list counts and QA grades per campaign, every item held in Phase 3, the PAUSED drafts (names, ids, lead and sender counts), the settings inherited from past campaigns and every departure from them, the placement-test result or the stated gap, the infrastructure still to build when it is deferred, the pre-Start checklist and Gates A to D. The operator presses Start |

**Client answers pasted back.** The operator sends the client message (`client-asks.md`) to the client and pastes the answers into the next thread. File them per `client-messages.md` ("Filing the answers the operator pastes back"): each answer goes to its home (suppression, the profile, `rulings.md`), and a question left unanswered is marked `skipped` and never asked again, unless the item is one `client-messages.md` says must stay open. When a phase starts and a sent message has no answers filed, the first move is one line asking the operator to paste them ("none came back" is a valid answer and skips them all).

## 7. Existing clients

Every client that predates this protocol is placed in a phase once, from its activity log (and its `run_state.checkpoints` values, when it has them), with `python outbound/scripts/phase_state.py place <slug> --phase N --status S`. The placement is recorded in `state.yaml` as `placed_by: backfill ... (operator to confirm)`. An older build whose drafts or campaigns were made outside the current flow is placed with `--legacy`: it goes through `/continue-client` before any phase runs. A client whose profile predates this protocol is resumed at the phase the board shows, and nothing already built is redone because of the protocol itself.

**Every thread on a backfilled client first checks Phase 1's hard-rule outputs,** whatever phase it runs: the `context_sweep:` block with no core source blocked, and `website_scrape.status` (`done`, `partial` or a confirmed `no_website`). A missing one is run now. For a client that has not finished research, it runs before research. For one past research, it runs alongside the phase and never holds it, except where its own gates say so: a core sweep source still blocked is asked once at the next checkpoint, and the Step 6 draft-upload stop still applies while one is blocked and not waived (`client-context-sweep.md`, `client-website-scrape.md`). A blocklist it finds goes into suppression at once.

**A backfilled phase can be missing outputs a later phase needs.** A phase placed by backfill (`placed_by: backfill` in `state.yaml`) was approved on its activity log, not on today's outputs. Two examples: a client onboarded before the context sweep existed has no sweep, and one onboarded before the website scrape existed has no scrape. When a phase's entry check finds a required earlier output missing on a backfilled client, produce it now through its owning procedure, then continue. Examples of owning procedures: the sweep in `client-context-sweep.md`, the scrape in `client-website-scrape.md`, and `/offer-intelligence` Step 0 seeding older research into the evidence ledger. This is a backfill, not a reopen, so nothing already approved is redone. It is logged `CREATED (backfill)` and listed at the checkpoint.

**A backfilled client has no handoff files yet.** When a phase starts and the previous phase's handoff is missing, write it first, from that client's activity log (CURRENT STATE and the log lines it points to) and the artifacts already on disk. Mark it `Status: final (backfilled <date>)`, then carry on.

This reconstruction is the one time a thread reads past the read set. It may read the LOG entries back to where the previous phase began, search the log for that phase's files and `NOTE spend` lines, and open the files they name. Spend the log does not record is written as "not recorded", never estimated. Once the handoff exists, later threads read the handoff instead. Update the backfilled handoff after any backfill step changes what it records, such as a sweep or scrape run at the next phase's entry check.

**When the missing output belongs to the phase whose checkpoint is still open,** produce it before that checkpoint is shown, so the approval covers it. For example, lists that were never QA'd are QA'd (section 5) before Phase 3 is approved. Otherwise a failure found later would sit inside a frozen phase.

**Operator facts a backfill never collected** (the speed-to-lead owner, the booking link) are looked up first (section 3, the ask policy: `rulings.md`, past interested-reply files, the intel feed), and asked in the first checkpoint prompt the thread shows only when nothing answers them. The opt-out handling is never asked (operator directive 2026-09-30, always house default): a profile with none recorded gets the house default written into `capability_boundary.legal_or_compliance_limits` by the phase that finds it missing (`/campaign-copywriting`, Compliance, item 0a). Gate D blocks Start, never the draft, so the owner and link can wait until checkpoint B at the latest. When a backfilled checkpoint is open, show it from that same reconstruction.

**Work done before the Aaron lane.** An offer that is not locked yet still gets the Aaron offer call when Phase 2 runs, reusing the research already on disk. An offer or copy already locked before the lane is flagged at its checkpoint, with an Aaron pass offered as the recommended option (`aaron-lane.md`, Existing clients). It is never rewritten silently.
