# The four phases: one thread per phase, one stop per phase

**What this is.** A client goes from onboarding to paused drafts in four phases. The operator starts each one in a fresh conversation by saying "Phase N for <client>" (in Claude Code, Codex or OpenMausBot). The phase runs from start to finish without stopping for small calls. It stops once, at its checkpoint, writes a handoff file for the next phase, and freezes once the operator approves it. This is an operator decision (ported to FNNL on 2026-09-28). This file is the one place the protocol lives; the phase skills point here and never restate it.

**It replaces the older checkpoint record.** The kickoff's four phase checkpoints used to be recorded in `run_state.checkpoints` (`/cold-email-kickoff`, "How a run stops"). For a client with a `phases/state.yaml`, the phase tracker below is the record, and `run_state.checkpoints` is read only once, by the backfill in section 7, to place the client. The stops themselves (hands-free inside a phase, one prompt at the end, at most four questions) are unchanged.

| Phase | Skill | What runs | Handoff file | Checkpoint (the one stop) |
|---|---|---|---|---|
| **1. Onboarding** | `/phase-1-onboarding` | Context sweep (`client-context-sweep.md`, with the Slack read in `client-slack-check.md`), blocklists into suppression, live website scrape (`client-website-scrape.md`), the folder refresh for a returning client (`client-folder-refresh.md`), profile and ICP, segments, proof facts, key preflight | `phases/phase-1-onboarding.md` | The client on one screen. The operator confirms the ICP and segments and gives the operator-only facts later phases need |
| **2. Research and offer** | `/phase-2-research-offer` | Offer research (`/offer-intelligence`, then `/market-evidence synthesize` and its Research QA gate), the Aaron offer call (`aaron-lane.md`), the offer lock, the offer slate (`/offer-test-slate`), free contact-database counts for each offer's list | `phases/phase-2-offer.md` | The offers. The operator confirms or swaps them |
| **3. List** | `/phase-3-list` | Data points and proof bank, the TAM (with its 25-account list QA), the Aaron campaign and copy call, then the list engine: pick, gap-fill, verify with the email verifier, QA, split per campaign | `phases/phase-3-list.md` | The list review: verified contacts per campaign, the QA grade, the holdbacks, Aaron's launch set, the spend |
| **4. Copy and launch** | `/phase-4-copy-launch` | Aaron's copy recorded with the rails (`aaron-copy-frames.md`), the reply machine (Gate D), spintax, sender check, PAUSED drafts on the sending platform, Gates A to D | `phases/phase-4-launch.md` | The launch review. The operator presses Start on the sending platform; the agent never does |

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

- **Hands-free.** Every skill the phase runs takes its `auto_execute` branch. It takes the recommended default, records it, and lists it under "Calls I made" at the checkpoint so the operator can reverse it. The hard stops in `/autonomous-execution-policy` section 3 still stop mid-phase, the moment they are hit. Among them: spend over the budget, a tool out of balance or down (`/tool-balance-guard`), a failed 25-account list QA before Phase B spend, a legal question with no ruling, the verified-list gate, and the upload stops (the context sweep upload stop in `client-context-sweep.md`).
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

2. **Run `checkpoint <slug> <n> --handoff phases/<file>`.** This releases the thread's lock.
3. **Show the checkpoint:** a short summary in plain words, then one native prompt carrying every question the phase needs. At most four questions, with the recommended answer first. Group related facts into one question. A second prompt is allowed only when more than four separate operator-only questions remain. Ask only what passes the ask test in `/cold-email-kickoff` ("Resolve it yourself first").
4. **When the operator answers:** record the answer in the handoff's Checkpoint line and in the activity log (`DONE Phase <n> checkpoint: <answer>`), then run `approve <slug> <n> --answer "..."`. A swap or correction the operator makes wins, and it is applied before approving. Checkpoint 1's answers still go to the fields later gates read (the `icp` block, `run_state.speed_to_lead_owner`, `run_state.booking_link`, an opt-out ruling to `capability_boundary.legal_or_compliance_limits`).
5. **Close with the next step in one line:** "Phase <n> is done. Open a new thread and say: Phase <n+1> for <client>."

**When something holds the phase's last step.** A client ask, a proof gap or a missing do-not-contact list can hold some or all of the phase's output. Build everything that is not held. Then write the handoff and show the checkpoint anyway, with the holds listed first. For each hold, name who owes what, and the exact step that runs once it clears ("0 of 9 drafts built: the client's do-not-contact export is owed; the upload runs on receipt"). The phase stays at `checkpoint_shown`. Saying "Phase N for <client>" again resumes it (`start` allows it, because the phase is not approved), runs only the held steps, and shows the checkpoint again. Approve only when the checkpoint's own decision is made. Never approve Phase 4 while a launch-set campaign is still held: approve it once every campaign is built as a PAUSED draft or the operator drops it, because approving freezes the phase and ends the resume path. Senders not yet attached because infrastructure is deferred is not a held campaign (see "Phase 4 ends at a PAUSED draft" above).

**Freezing.** An approved phase is frozen. Rules that change later apply to phases not yet started, never to frozen work. A frozen phase reopens (`reopen`) only for one of these:
- a broken safety rail (truth, compliance, suppression, send format, verified-only emails);
- a change the operator marks as breaking;
- new client facts that contradict it, such as a vetoed offer, a new exclusion, or the client pausing.

**Offer approvals and readiness fields in a frozen Phase 2** (Offer Readiness, operator decision 2026-09-28; `outbound/reference/offer-readiness.md`). Writing the evidence fields (`lead_magnet_client_ok_by`, `_at`, `_evidence`) or a client `yes` into a frozen Phase 2 offer block, the way `offer-readiness.md` records an approval, is NOT a reopen: it records a fact the frozen plan was already waiting on. A client `no` IS one (the vetoed-offer trigger above). The one-time backfill of readiness fields (the evidence trio as nulls, `delivery_mode`, `free_unit_cap_per_week: null`) into an approved phase is evidence-only and not a reopen either. Setting a cap value or adding samples to a frozen phase changes the plan, so it needs the operator to mark the change as breaking.

`/continue-client` and `/cold-email-flow-audit` respect the freeze. **A phase approved by backfill** (`built_under` starting with `pre-phase`, including a backfilled checkpoint approved later) has no rules snapshot to audit against: it counts as frozen from its placement date, is audited as legacy (its outputs checked for the rails and for the hard-rule outputs later phases need, never for newer style rules), and its approval is a placement the operator has not confirmed yet, not their sign-off. A newer rule than a frozen phase's `built_under` commit is reported as information ("a newer rule exists for phase 2"), never as a reason to regenerate the work.

## 5. QA-ing lists for the copy gate and the upload

The list engine (`/email-waterfall`, whose `finalize` step in `outbound/scripts/list_waterfall.py` writes each campaign's send file) already writes `campaigns/<campaign>/leads.verified.csv`, which the verified-list gate (`verified-list-gate.md`), the copy and the upload read. For each campaign in Aaron's launch set:
- run `python outbound/scripts/list_qa.py run --dir <campaign dir> --spec <targeting-spec.yaml>`, which writes that folder's `list-qa-report.md` and the manual sample (`qa-sample.csv`);
- have one independent reviewer (a sub-agent handed only the sample and the targeting spec) score the sample, then record it with `python outbound/scripts/list_qa.py score-sample --dir <campaign dir> --sample <reviewed.csv>`, since the verified-list gate needs that manual QA pass;
- run `/list-quality-scorecard` for the grade the gate reads.

Campaign folders not in the launch set, including old runs, stay as they are. The handoff names them as not current.

## 6. What each checkpoint asks

| Checkpoint | Asks (recommended first) |
|---|---|
| **1** | The ICP and segments. The speed-to-lead owner and booking link (one question), only when the run could not resolve them (`/cold-email-kickoff`, "Resolve it yourself first"). An opt-out ruling when the geography includes Canada, the UK or Ireland. A website no route could read, or a `no_website` to confirm. Anything else only the operator knows |
| **2** | Build the list with Aaron's offers (recommended), or swap. A spend-budget raise only if the list estimate would cross it. Research HOLD reasons, when there are any, lead the summary, with one targeted deepen pass offered as the alternative |
| **3** | Approve the list and move to copy and launch (recommended), or name a fix. Any campaign under the floor that Aaron kept or folded is shown with his reason |
| **4** | Nothing to approve on the agent's side. The review shows the PAUSED drafts (names, ids, lead and sender counts), the infrastructure still to build when it is deferred, the pre-Start checklist and Gates A to D. The operator presses Start |

## 7. Existing clients

Every client that predates this protocol is placed in a phase once, from its activity log (and its `run_state.checkpoints` values, when it has them), with `python outbound/scripts/phase_state.py place <slug> --phase N --status S`. The placement is recorded in `state.yaml` as `placed_by: backfill ... (operator to confirm)`. An older build whose drafts or campaigns were made outside the current flow is placed with `--legacy`: it goes through `/continue-client` before any phase runs. A client whose profile predates this protocol is resumed at the phase the board shows, and nothing already built is redone because of the protocol itself.

**Every thread on a backfilled client first checks Phase 1's hard-rule outputs,** whatever phase it runs: the `context_sweep:` block with no core source blocked, and `website_scrape.status` (`done`, `partial` or a confirmed `no_website`). A missing one is run now. For a client that has not finished research, it runs before research. For one past research, it runs alongside the phase and never holds it, except where its own gates say so: the upload stops while a core sweep source is blocked (`client-context-sweep.md`, `client-website-scrape.md`). A blocklist it finds goes into suppression at once.

**A backfilled phase can be missing outputs a later phase needs.** A phase placed by backfill (`placed_by: backfill` in `state.yaml`) was approved on its activity log, not on today's outputs. Two examples: a client onboarded before the context sweep existed has no sweep, and one onboarded before the website scrape existed has no scrape. When a phase's entry check finds a required earlier output missing on a backfilled client, produce it now through its owning procedure, then continue. Examples of owning procedures: the sweep in `client-context-sweep.md`, the scrape in `client-website-scrape.md`, and `/offer-intelligence` Step 0 seeding older research into the evidence ledger. This is a backfill, not a reopen, so nothing already approved is redone. It is logged `CREATED (backfill)` and listed at the checkpoint.

**A backfilled client has no handoff files yet.** When a phase starts and the previous phase's handoff is missing, write it first, from that client's activity log (CURRENT STATE and the log lines it points to) and the artifacts already on disk. Mark it `Status: final (backfilled <date>)`, then carry on.

This reconstruction is the one time a thread reads past the read set. It may read the LOG entries back to where the previous phase began, search the log for that phase's files and `NOTE spend` lines, and open the files they name. Spend the log does not record is written as "not recorded", never estimated. Once the handoff exists, later threads read the handoff instead. Update the backfilled handoff after any backfill step changes what it records, such as a sweep or scrape run at the next phase's entry check.

**When the missing output belongs to the phase whose checkpoint is still open,** produce it before that checkpoint is shown, so the approval covers it. For example, lists that were never QA'd are QA'd (section 5) before checkpoint 3 is shown. Otherwise a failure found later would sit inside a frozen phase.

**Operator facts a backfill never collected** (the speed-to-lead owner, the booking link, an opt-out ruling) are resolved by the run where it can, and otherwise asked in the first checkpoint prompt the thread shows. Gate D blocks Start, never the draft, so the owner and link can wait until checkpoint 4 at the latest. When a backfilled checkpoint is open, show it from that same reconstruction.

**Work done before the Aaron lane.** An offer that is not locked yet still gets the Aaron offer call when Phase 2 runs, reusing the research already on disk. An offer or copy already locked before the lane is flagged at its checkpoint, with an Aaron pass offered as the recommended option (`aaron-lane.md`, Existing clients). It is never rewritten silently.
