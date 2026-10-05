# Port of the Aaron-flow updates into FNNL (2026-10-05)

**What this is.** The record of how every commit the upstream Aaron-flow workspace landed after `b6d54de0` (the last commit ported on 2026-09-30) up to `f4e368da` was brought into FNNL. The operator's instruction on 2026-10-05: port the process, the backbone, the concepts and above all the four phases, never a tool or a client from the upstream stack, and apply the recommended plan with the operator's changes.

This is history, not live doctrine. The live doctrine is `outbound/reference/aaron-flow.md`. Upstream SHAs refer to the upstream repo; FNNL SHAs to this one. Upstream tools and clients are described, not named.

**Cutoff.** The range is upstream `b6d54de0..f4e368da` (47 commits). FNNL started at `f6fbcf5`, tagged `pre-aaron-flow-port-2026-10-05` for rollback.

## Decisions made with the operator on 2026-10-05

1. **Where the work lands (D1).** In the FNNL main folder, after the baseline tag, not in a separate test copy.
2. **Company fit (D2).** Filters do most of the work; what is left is judged by batched Claude sub-agents, once per company.
3. **Catch-alls (D3).** FNNL keeps its own catch-all hold and timing rule. The upstream "deliverable catch-alls ship" change is not ported.
4. **People search (D4, replaced by the operator's ruling).** Advanced people and contact search runs in AI Ark only. The upstream parallel discovery across several tools is not ported.
5. **Launch settings (D5).** FNNL's 2026-10-01 launch-settings rulings stand as written.
6. **Placement test (D6).** PlusVibe's own placement test is the one used, after its cost is read.
7. **Cold-Reader Panel (D7).** The FNNL draft is committed as an optional step that runs only on the operator's ask.
8. **The 200-row sample (new).** Before anything runs at scale, each vertical's first AI Ark people search pulls exactly 200 contacts with all its filters. Their companies are scored for fit; the keywords the good companies share become include keywords, the keywords the bad companies share become exclude keywords, and the refined search is checked on a fresh sample (`ai-ark-people-discovery.md`, ruling `people-discovery`).
9. **All model work on Claude sub-agents (new).** Every scoring, judging, research and copy-variable job that the upstream stack gives a third-party model or a research tool runs here as batched Claude sub-agents on the session's own usage (ruling `model-jobs`).

**Dropped by the operator:** the competitor-follower campaign (plan row 5).

**FNNL rules kept intact:** the six-tool stack (GetLeads, AI Ark, Prospeo, MillionVerifier, Clay at zero credits, PlusVibe) in capability roles; no third-party AI API; the \$100 standing budget; the tool-balance stop; the context sweep first; the kickoff Step 6 draft-upload stop; infrastructure may be deferred; pressing Start is always the operator's; `run_state` field names unchanged; `phase_state.py` unchanged (checkpoint A is its phase 2 and checkpoint B its phase 4); `_vendor-library/` inert; the mirrored persona skills untouched.

**Open, to prove on first real use:** the AI Ark REST people pull at scale (`export/single` and the response field names are unproven live), the PlusVibe placement-test cost, whether PlusVibe sends in import order, and the 20-row agreement check and `--repeat 3` run before the Cold-Reader readers move off sonnet.

## FNNL commits

| FNNL | What it carries |
|---|---|
| `f83e0df` | Cold-Reader Panel: `cold_reader_panel.py`, `cold-reader-panel.md`, the cold-reader eval suite, its checks and benchmark log |
| `717ba75` | List engine: `aiark_people.mjs`, `keyword_mine.py`, `reservoir.py` and the reservoir rung in `list_waterfall.py`, `copy_var_gate.py`, `list_qa.py`, `lead_score.py`, `list_feedback.py`, `aaron_frame_check.py`, tests |
| `cb5b5d3` | Doctrine: `aaron-flow.md`, `ai-ark-people-discovery.md`, the 2026-10-05 rulings, `phase-protocol.md`, the stack contract, provider routing, the targeting spec, the reference docs, `CLAUDE.md` |
| `00172e2` | Skills: the four phase skills, kickoff, continue-client, the list, copy, research and deliverability skills, and the two-checkpoint wording |
| this file | The manifest |

## Every upstream commit in range

Disposition: **Ported** (tool-neutral, re-expressed in FNNL's roles), **Concept** (the idea ported, the tool not), **Skipped** (an upstream-only tool, a superseded or declined change, with the reason), **N/A** (nothing to port: client data, upstream evals, upstream vendor docs).

| # | Upstream | Subject (neutral) | Disposition | FNNL |
|---|---|---|---|---|
| 1 | `9ddff591` | Balance probe fix for an upstream research model | Skipped: upstream-only tool; FNNL has no AI API | none |
| 2 | `90c1fbc7` | End-of-day read across the upstream sending platform | Skipped: upstream sending platform and an upstream client's report | none |
| 3 | `647b885a` | Cold-Reader Panel, a blind comprehension check before upload | Ported: Claude readers only, optional on the operator's ask (D7) | `f83e0df` |
| 4 | `9e561a85` | Panel reader lock marked provisional, a judge rule reverted | Concept: readers stay on sonnet until the agreement check passes | `f83e0df` |
| 5 | `92e8ac21` | Panel rulings and a cheap-model bake-off | Concept: the rulings kept; the third-party model bake-off does not apply | `f83e0df` |
| 6 | `e89a8d1b` | Panel wired into upload re-checks, resume, audit and a Phase 4 hold | Concept: wired as an optional step, with no Phase 4 hold | `f83e0df`, `00172e2` |
| 7 | `9eefa492` | The whole flow run Aaron's way (content to 2026-09-28) | Ported: two checkpoints, the intake fields, quick demand mining, signals as send order, the reservoir, the list, copy, deliverability and reply rules (`aaron-flow.md`) | `717ba75`, `cb5b5d3`, `00172e2` |
| 8 | `c0b20acb` | Upstream platform's send order marked unverified | Concept: PlusVibe import-order sending marked unverified until the first send day | `cb5b5d3` |
| 9 | `551824fc` | 14 volume limits Aaron never set, removed | Ported: `aaron-flow.md` section 13 | `cb5b5d3`, `00172e2` |
| 10 | `de1444c8` | Last offer-arm floors moved to the limits guide | Ported: with section 13 | `cb5b5d3`, `00172e2` |
| 11 | `8a08469e` | Upstream clients' Phase 1, research and intel copied | N/A: client data | none |
| 12 | `d82c9916` | Notes on the rulings split and upstream client starts | N/A: upstream client operations | none |
| 13 | `4310624a` | A persona doctrine's daily figure marked as a fallback | Skipped: the persona skills are mirrored and change only at their canonical copy | none |
| 14 | `55c5c3c6` | Call every interested reply within 5 minutes, asset requests included | Ported: `aaron-flow.md` section 11, ruling `call-every-interested-reply` | `cb5b5d3`, `00172e2` |
| 15 | `2b581e82` | Cheap-at-volume list building, one process with volume and yield modes | Ported: `list_mode`, `aaron-flow.md` section 12, ruling `list-mode` | `717ba75`, `cb5b5d3`, `00172e2` |
| 16 | `33b9ad4d` | An upstream contact vendor removed from the flow | N/A: FNNL never used it | none |
| 17 | `29d16553` | Upstream crawler pre-run check in company fit | Skipped: upstream-only crawler; FNNL company fit runs on Claude sub-agents | none |
| 18 | `9a8dc440` | A blank copy variable never ships | Ported: `copy_var_gate.py` before upload | `717ba75`, `00172e2` |
| 19 | `c114be98` | Company-fit keep-more ship rules scored, not adopted | N/A: upstream eval, not adopted | none |
| 20 | `251d2f03` | List-mode follow-up rulings | Ported: ruling `list-mode` | `cb5b5d3` |
| 21 | `10469287` | Copy-variable gate reads the upstream platform's token syntax | Concept: the gate reads PlusVibe `{{var}}` tokens | `717ba75` |
| 22 | `edc8daf1` | Upstream crawler credit cap and guards | Skipped: upstream-only crawler | none |
| 23 | `30d64f49` | Crawler-first company fit benchmarked, not adopted | N/A: upstream eval | none |
| 24 | `40c2d227` | Company-fit cost sample on an upstream client | N/A: client data | none |
| 25 | `f73c1156` | Upstream crawler pre-run estimate | Skipped: upstream-only crawler | none |
| 26 | `4fb0f7bf` | Company fit crawler-first for every company | Skipped: upstream-only crawler | none |
| 27 | `ddf9deae` | Company fit ships good and maybe; a crawler cap removed | Ported: the fit ship rule (`aaron-flow.md` section 8, ruling `fit-ship-rule`); the crawler cap does not apply | `cb5b5d3`, `00172e2` |
| 28 | `73b81ded` | Copy frame refresh through 2026-10-02 | Ported: the frame refresh before Call 2 (`aaron-copy-frames.md`) | `cb5b5d3` |
| 29 | `6dacdd06` | Parallel discovery, every email verified, no contacts cap | Ported: rulings `every-email-verified` and `no-contacts-cap`; parallel discovery replaced by the AI Ark-only people search (decision 4) | `717ba75`, `cb5b5d3`, `00172e2` |
| 30 | `417a20bc` | An unconfirmed bad drops instead of shipping as maybe | Ported: `aaron-flow.md` section 8 | `cb5b5d3`, `00172e2` |
| 31 | `7dc034ba` | An unclear offer-fit read with a bad verdict still drops | Concept, already covered: `/tam-build` already let an unclear offer-fit read survive only on the ICP verdict, so a `bad` still drops; the fit ship rule now adds that an unsure `bad` stays `bad` | `00172e2` |
| 32 | `8827dd96` | Client asks check earlier asks, read for founders, sign as the sender | Ported: `client-messages.md` | `cb5b5d3` |
| 33 | `9c5a0c3d` | Client messages follow one fixed skeleton | Ported: `client-messages.md`, the upstream client's name removed | `cb5b5d3` |
| 34 | `481c5b6f` | Deliverable catch-alls ship, only risky ones drop | Skipped: FNNL keeps its catch-all hold and timing rule (D3) | none |
| 35 | `743e1d51` | Catch-all edge case when a later candidate gets no verdict | Skipped: D3 | none |
| 36 | `e62e00b7` | Catch-all confirmations | Skipped: D3 | none |
| 37 | `15ddc321` | List QA no longer enforces a contacts cap | Ported: `list_qa.py` | `717ba75` |
| 38 | `27363a32` | Copy frame refresh through 2026-10-03 | Ported: as row 28; no new frames | `cb5b5d3` |
| 39 | `24c827f0` | Keep other-domain emails shown to be the company's own | Concept: already covered. A colleague's valid email on the domain proves it (`list_waterfall.py`, the `every-email-verified` second pass), and a matching brand name is `list_qa.py`'s related-domain WARN; the upstream list-builder code is not ported | `717ba75` |
| 40 | `b82ddaaa` | Two tools agreeing no longer proves a second domain | Concept: FNNL never used that reason, so nothing to remove | none |
| 41 | `ac2b5e69` | Exclusions on every pull, keyword phrases audited | Ported: `discovery_exclusions` in the targeting spec, ruling `discovery-exclusions` | `717ba75`, `cb5b5d3`, `00172e2` |
| 42 | `ef752fe7` | Parallel discovery reconfirmed over a people-only route | Skipped: superseded by the AI Ark-only ruling (decision 4) | none |
| 43 | `64b7201e` | Discovery exclusions on every people pass, through an upstream people tool | Concept: the exclusions ride on the AI Ark people search; the upstream tool is not ported | `717ba75`, `cb5b5d3` |
| 44 | `3a377404` | People-first search, companies rolled up from the people | Ported: AI Ark only (`ai-ark-people-discovery.md`, `aiark_people.mjs`) | `717ba75`, `cb5b5d3`, `00172e2` |
| 45 | `6f0453d5` | Wide keyword stacks and exhaustive industry exclusions, a 90% bar per tool | Concept: replaced by the 200-row sample and keyword refinement (decision 8) | `717ba75`, `cb5b5d3` |
| 46 | `590ecbc9` | An upstream tool's keyword example note | N/A: upstream vendor doc | none |
| 47 | `f4e368da` | A model route override; class-balanced keyword mining | Ported: class-balanced mining (`keyword_mine.py`). The model route override is Skipped: no AI API | `717ba75` |

**Upstream files in range not ported:** the upstream credential registry, research README and routing check (FNNL keeps its own), the upstream list-builder scripts and a split helper for verified leads (FNNL's list engine is `list_waterfall.py` and `list_qa.py`).

Credit for the flow itself goes to Aaron Shepherd, whose notes it follows.
