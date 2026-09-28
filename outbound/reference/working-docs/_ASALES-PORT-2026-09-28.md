# Port of the 2026-09-24 to 2026-09-28 upstream updates into FNNL (2026-09-28)

**What this is.** The record of how every commit the upstream workspace landed between its four-phase-checkpoint commit (`0a8b65dc`, already in FNNL as `ddd8705`) and its client-messages commit (`b6f2710a`) was brought into FNNL. The operator's instruction: port the process, the backbone and the concepts (above all the Phase 1 to Phase 4 structure), never the upstream tech stack, and never add anything that only makes sense for an upstream-only tool.

This is history, not live doctrine. Upstream SHAs refer to the upstream repo; FNNL SHAs to this one. Upstream vendor names appear below only to say what was not ported.

**Cutoff.** The range is upstream `0a8b65dc..b6f2710a` (84 commits, both ends included).

## Decisions made with the operator on 2026-09-28

1. FNNL's uncommitted 09-24/09-25 edits were committed first as a baseline (`0c6ead5`), unchanged.
2. The upstream phase map replaces FNNL's old four phase checkpoints: 1 Onboarding, 2 Research and Offer, 3 List, 4 Copy and Launch. One fresh thread per phase, one checkpoint per phase with at most 4 questions, the phase frozen on approve. The tracker (`outbound/scripts/phase_state.py`) replaces `run_state.checkpoints`; old checkpoints are read once by the `place` backfill. The Aaron lane is adopted.
3. Filter-first TAM discovery overrides the 09-22 rule that lookalike seeding is a MUST. Count and filter the company universe first; lookalike seeding is an option or an exception.
4. The tool-balance guard overrides the 06-19 exception that let the enricher act as the finder when the finder was down. Out of balance, down or switched off means stop and ask; a skip needs `--operator-approved-skip` recorded.
5. Generated client files are plain text (markdown) by default. DOCX, PPTX or a Google Doc only when the operator asks.
6. Research QA DEEPEN may run up to 2 targeted loops inside Phase 2 on its own.

**Deferred (Wave 5, not ported):** reading sending-platform campaign history at onboarding, and a reply-followup skill that sends email. Both need their own decision because one touches a live system and the other sends.

**FNNL rules kept intact:** the six-tool stack (GetLeads, AI Ark, Prospeo, MillionVerifier, Clay at zero credits, PlusVibe) spoken in capability roles; no third-party AI API; the $100 standing budget written automatically; the context sweep first; the kickoff Step 6 upload stop; infrastructure deferred and never blocking; Start always the operator's; `run_state` field names unchanged.

## FNNL commits

| FNNL | What it carries |
|---|---|
| `0c6ead5` | Baseline: the in-flight 09-24/09-25 edits, recorded as found |
| `760813f` | Wave 1 new files: the four phase skills, `phase_state.py`, `phase-protocol.md`, `client-folder-refresh.md`, `client-website-scrape.md`, `client-messages.md` |
| `9b30c18` | Wave 2 new files: `aaron-lane.md`, `aaron-copy-frames.md`, `aaron_frame_check.py`, `offer-readiness.md` and `outbound/scripts/offer-readiness/` |
| `42998a4` | Wave 3 new code: `/tool-balance-guard`, `list_waterfall.py --operator-approved-skip`, the `list_qa.py` one-employer-across-domains warning |
| `dad651c` | Step 2 rewire: 58 skills and the reference docs moved onto the phases, the Aaron lane, Offer Readiness, filter-first discovery, the guard and plain text; descriptions capped at about 300 characters; campaign-copywriting and lead-magnet-brainstorm split into `references/` runbooks |
| `872ddf2` | Wave 4: 114 dollar amounts escaped in 24 SKILL.md bodies |
| this file | The manifest |

## Every upstream commit in range

Disposition: **Ported** (tool-neutral, re-expressed in role vocabulary), **Concept** (the idea ported, the tool not), **Skipped** (an upstream-only tool, a client, or a deferred item, with the reason), **N/A** (nothing to port, or already in FNNL).

| Upstream | Subject | Disposition | FNNL |
|---|---|---|---|
| `b6f2710a` | One unsent client message, merged by every skill | Ported | `760813f`, `dad651c` |
| `cc6635bd` | Context sweep: QSM sheet index | Skipped: QSM is upstream-only | none |
| `86e75c5d` | Deliverable.co treated as sponsored | Skipped: upstream verifier | none |
| `66e9c128` | MasterInbox tagging fix log | Skipped: upstream inbox tool | none |
| `844ab782` | Escape dollar amounts the skill loader read as arguments | Concept: redone on FNNL text | `872ddf2` |
| `dcb9088b` | MasterInbox per-workspace keys | Skipped: upstream inbox tool | none |
| `b6dbfbc8` | Cleanup round 2 record | N/A: upstream housekeeping | none |
| `b75e399d` | Offer Readiness: stable `--check`, field-layout contract, drafting ban | Ported | `9b30c18`, `dad651c` |
| `bf4dcb92` | Offer Readiness across the whole flow | Ported | `9b30c18`, `dad651c` |
| `3dce4f52` | Phase 1 folder refresh for returning clients | Ported | `760813f`, `dad651c` |
| `29df1e8b` | Cleanup: old guides, vendor packs, scratch scripts | N/A: upstream files; FNNL vendor packs stay inert | none |
| `8742fdfc` | MasterInbox weekly docs check | Skipped: upstream inbox tool | none |
| `d7260506` | MiniMax re-keyed | Skipped: third-party AI API | none |
| `1f77f7c3` | Cap skill descriptions at about 300 characters | Ported: moved text kept under "From the former description" | `dad651c` |
| `271385ef` | Split campaign-copywriting and lead-magnet-brainstorm into runbooks | Ported: redone on FNNL's own text | `dad651c` |
| `40362b5e` | Phase gaps from the cold-start dry runs | Ported | `760813f`, `dad651c` |
| `e6be5d0a` | Four phase skills, tracker, handoff files, phase freezing | Ported | `760813f`, `dad651c` |
| `e8b0e63d` | List-phase rules from the 09-26 speed audit | Concept: parallel and resume rules kept; the upstream batch lane and list engine not | `dad651c` |
| `dbb22e90` | voc-extraction eval answer key | Skipped: upstream eval data | none |
| `36f97d43` | OpenRouter batch lane | Skipped: third-party AI API | none |
| `9a36ee1d` | Tavus fix-pass spend ledger | Skipped: client ledger | none |
| `daf2a98f` | OpenRouter plan, cost reconcile | Skipped: third-party AI API | none |
| `71e83974` | OpenRouter plan for row-level AI jobs | Skipped: third-party AI API | none |
| `ac95de7f` | Free tools first, A-Leads last | Skipped: upstream "free tools" directive; FNNL never calls GetLeads free | none |
| `7327131d` | tavus-fit eval suite | Skipped: client eval, cheap-model benchmark | none |
| `6476590d` | Tavus Deliverable verification ledger | Skipped: client ledger | none |
| `ae6f5c07` | Flag one employer behind several company domains | Concept: rebuilt as a `list_qa.py` warning; the upstream list engine not ported | `42998a4` |
| `d5ea86f8` | Config-driven list engine | Skipped: upstream list engine built on upstream tools | none |
| `3a2fa088` | 09-26 speed audit working doc | N/A: upstream analysis; its portable rules came via `e8b0e63d` | none |
| `941e2c65` | Free-tools directive in the budget policy | Skipped: upstream "free tools" directive | none |
| `c01559f8` | GetLeads, QuickEnrich, BlitzAPI are free to use | Skipped: upstream billing; FNNL GetLeads has two meters | none |
| `2255a4aa` | Tavus headcount smoke test ledger | Skipped: client ledger | none |
| `8525771b` | Tavus Perplexity headcount ledger | Skipped: client ledger, third-party AI API | none |
| `371e9962` | MasterInbox spend note | Skipped: upstream inbox tool | none |
| `c041d968` | MasterInbox internal workspace | Skipped: upstream inbox tool | none |
| `57f46a52` | MasterInbox views and sync | Skipped: upstream inbox tool | none |
| `2585854a` | reply-followup cross-day ledger | Skipped: Wave 5 deferred (sends email) | none |
| `0c365648` | reply-followup reply target fix | Skipped: Wave 5 deferred | none |
| `b80d43ad` | A-Leads self-test | Skipped: upstream tool | none |
| `5cf81edf` | A-Leads REST runner | Skipped: upstream tool | none |
| `4d660626` | reply-followup skill and scripts | Skipped: Wave 5 deferred | none |
| `ef6019eb` | Tool-balance guard: a named tool that is down stops the step | Ported | `42998a4`, `dad651c` |
| `0c592e50` | A-Leads REST fallback | Skipped: upstream tool | none |
| `7f73a312` | DiscoLike X read asks for a top-up | Skipped: upstream tool (the guard rule itself is in `47b51509`) | none |
| `47b51509` | Tool-balance guard: stop and ask, never substitute | Ported | `42998a4`, `dad651c` |
| `d8a9171c` | QuickEnrich MCP routing | Skipped: upstream tool | none |
| `b4b51b3c` | Tavus headcount benchmarks ledger | Skipped: client ledger | none |
| `0f05c3ba` | MasterInbox redaction audit | Skipped: upstream inbox tool | none |
| `d9a7532f` | MasterInbox MCP server | Skipped: upstream inbox tool | none |
| `c94ba346` | BlitzAPI MCP routing | Skipped: upstream tool | none |
| `6a6d43cf` | Stack connectivity balances | Skipped: upstream ledger | none |
| `ec553053` | QuickEnrich MCP registration | Skipped: upstream tool | none |
| `3c435322` | BlitzAPI data MCP | Skipped: upstream tool | none |
| `cc38337b` | MasterInbox team setup PDF | Skipped: upstream inbox tool | none |
| `6edb351a` | MasterInbox team setup doc | Skipped: upstream inbox tool | none |
| `550ba0fc` | MasterInbox domain sync wording | Skipped: upstream inbox tool | none |
| `68892598` | MasterInbox v2 build brief | Skipped: upstream inbox tool | none |
| `5b5fbd01` | MasterInbox plan brief | Skipped: upstream inbox tool | none |
| `f80a8c93` | MasterInbox added to the locked stack | Skipped: upstream inbox tool | none |
| `42b97611` | MasterInbox ingestion checks | Skipped: upstream inbox tool | none |
| `32c0e62e` | MasterInbox strategy v2 | Skipped: upstream inbox tool | none |
| `d3d6fa75` | MasterInbox folder and API layer | Skipped: upstream inbox tool | none |
| `365d2e18` | Aaron lane: machine-checkable frame ids and the conformance script | Ported | `9b30c18`, `dad651c` |
| `217acd00` | Aaron lane: copy built on his real example emails | Ported | `9b30c18`, `dad651c` |
| `2b1d5385` | Website scrape: record visible text | Ported | `760813f` |
| `20635a52` | Mandatory live website scrape | Ported: ladder is the browser pane read-only, WebFetch, curl; never a paid crawler | `760813f`, `dad651c` |
| `b556321e` | Retire the last DiscoGen routes | N/A: FNNL never had those routes | none |
| `35e60862` | New-in-seat order: GetLeads, then A-Leads | Skipped: upstream routing; FNNL's own contract sets the order | none |
| `07f1e343` | Tavus tam-build ledger | Skipped: client ledger | none |
| `a0abcf28` | Three stale routing lines | Concept: FNNL skills point at the stack contract, not upstream `provider-routing.yaml` | `dad651c` |
| `f83e6a3b` | Keep lookup-by-person out of the discovery order | Ported: reveal and lookup-by-person calls kept out of discovery | `dad651c` |
| `605d0942` | Contact and email order follows the routing file | Concept: FNNL's stack contract is the single order | `dad651c` |
| `5351fc88` | Aaron lane dry-run fixes | Ported | `9b30c18`, `dad651c` |
| `5763a79a` | Aaron decides offers, targeting and copy | Ported | `9b30c18`, `dad651c` |
| `b5cabd84` | Drop stale domain-to-linkedin claim | Skipped: an upstream tool's row in one table | none |
| `ff254e5d` | Contact and email order points at the routing file | Concept: as `605d0942` | `dad651c` |
| `2d642706` | DiscoLike plan tier and cap | Skipped: upstream tool | none |
| `b08020e6` | Filter-first discovery in the live reference docs | Concept: the upstream lookalike tool not ported | `dad651c` |
| `14f40040` | Filter-first TAM discovery, lookalike only as the exception | Concept: company search then contact count; lookalike seeding optional | `dad651c` |
| `a45df105` | Finish the plain-text sweep | Ported | `dad651c` |
| `10e565fd` | Generated client files are plain text by default | Ported | `dad651c` |
| `e2d283d3` | Tavus data-point-discovery ledger | Skipped: client ledger | none |
| `5424e887` | Record phase checkpoints so a resumed run never skips one | N/A: already in FNNL | `ddd8705` |
| `0a8b65dc` | Four phase checkpoints replace the per-fork stops | N/A: already in FNNL | `ddd8705` |

**Count check.** 84 rows, matching the 84 upstream commits: 19 Ported, 8 Concept, 51 Skipped, 6 N/A.

## Known gaps left open

- `/interactive-tool-magnet` is a dangling pointer carried from before, now in `lead-magnet-brainstorm/references/offer-archetypes.md`.
- `/goal` and `/cold-email-copy-best-practices` in campaign-copywriting do not resolve to skills (pre-existing).
- `stack-contract.yaml` `process_overrides.notes` names two out-of-stack tools (pre-existing).
- `provider-capability-matrix.md` (lines 13 and 52) and lead-list section 16 say GetLeads uses OAuth with no `.env`; the FNNL GetLeads connection in the harness is keyed. Needs one check and a wording fix.
- The Prospeo company lookalike route is untested and not in the contract.
- The social-proof-bank reference doc and fill template may still describe a Google Sheet flow.
- The upstream scripted-batch row-judgment rule was not ported because it depends on a third-party AI API; FNNL row judgment stays on sub-agent fan-out plus deterministic code.
