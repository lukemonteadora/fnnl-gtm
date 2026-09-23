# Port of the 2026-09-22 to 2026-09-24 upstream updates into FNNL (2026-09-24)

**What this is.** The record of how every commit the upstream workspace landed between its Aaron A-to-Z alignment (`56ff4a2c`, already in FNNL as `d043841`) and 2026-09-24 was brought into FNNL. The operator's instruction: bring every update, minor to major, **except where it introduces a new tool**; for those, land the same concept using only FNNL's six tools (GetLeads, AI Ark, Prospeo, MillionVerifier, Clay at zero credits, PlusVibe) or Claude Code natively. FNNL's no-AI-API rule and six-tools rule stayed in force throughout.

This is history, not live doctrine. Upstream SHAs refer to the upstream repo; FNNL SHAs to this one. Upstream vendor names appear below only to say what was not ported.

**Cutoff.** The range is upstream `56ff4a2c..5424e887`. The first pass stopped at `7cd876cc` (the commits that existed when the operator asked); `0a8b65dc` and `5424e887` landed while it ran, and the operator chose to port them too (2026-09-24), after the session that made them went idle.

## Decisions made with the operator on 2026-09-24

0. Follow upstream's phase checkpoints: new clients run `auto_execute` with `review_protocol: phase_checkpoints` (four stops, one per phase); `review_gates` is opt-in. This supersedes the `review_gates` default ported in `f423594`.
1. FNNL's 38 uncommitted in-flight edits were committed first as a baseline (`72c72d2`), unchanged.
2. The context sweep and the client intel feed use **generic read-only sources** (whatever Slack, email, calendar, Drive/docs, Notion or notetaker-recap-email connectors the session has), always name the account searched, and **nothing is scheduled**. These sources are client context, not stack tools (CLAUDE.md section 7; `stack-contract.yaml` `approved_stack.context_sources_note`).

## FNNL commits

| FNNL | What it carries |
|---|---|
| `72c72d2` | Baseline: the in-flight 09-22/09-23 edits (six-tool stack, no-AI-API follow-ons, Slack check, Clay hook, MillionVerifier MCP), recorded as found |
| `3ce78a6` | Market-research layer, Claude-native only |
| `f423594` | Approval-brief pre-flight, DOCX builder retired, `review_gates` is the stated default |
| `50f551f` | Spaced em dashes removed (769 lines, 50 files) |
| `5d041b2` | Aaron pre-launch gap fixes: offers placed by fit, pay-on-result, copy gates, Gate 2 |
| `538672f` | List production: targeting spec, waterfall planner, six-dimension list QA, MillionVerifier verify cache |
| `025c23d` | Client context sweep first; on-demand client intel feed |
| `46f92f9` | Claude-native benchmark (`outbound/evals/`); skill-change hygiene |
| `45ee3a5` | Fixes from three independent coverage audits; this manifest |
| `ddd8705` | Upstream `0a8b65dc` + `5424e887`: four phase checkpoints for new clients |

## Every upstream commit in range

Disposition: **Ported** (tool-neutral, re-expressed in role vocabulary), **Concept** (the idea ported, the tool not), **Skipped** (a tool change or client-specific, with the reason), **N/A** (nothing to port).

| Upstream | Subject | Disposition | FNNL |
|---|---|---|---|
| `03686c6d` | Aaron alignment replication prompt + evidence | N/A: `d043841` was built from it; evidence is upstream history | none |
| `8fcc6ea1` | Pin replication diffs | N/A (as above) | none |
| `8c84b8a1` | Slack sweep hard rule | Ported: FNNL's own port was in the baseline; its gaps (run first, `waived_by_operator`, precedence, extraction extras, content boundary, flow-audit A2, activity-log area, routing row, slate hand-off flag) closed | `72c72d2`, `025c23d` |
| `708acbd8` | Client patch scripts | Skipped: client-specific | none |
| `1741efea` | Ad libraries in the built-in browser | Ported (the browser pane is Claude-native; never Chrome) | `3ce78a6` |
| `e6604627` | Leftover 09-22/09-23 edits | Mostly N/A (key rows, ledger rows, headshot timing already in FNNL). Skipped: the infrastructure "explicit request only" gate, which exists because upstream sends from one shared sender pool | none |
| `b618752a` | Market-evidence layer | Ported: standard, `/market-evidence`, `evidence_ledger.mjs` | `3ce78a6` |
| `c4127c4b` | Restore `ai_router`/`dr_harvest` after the AI ban was lifted | Skipped: third-party AI APIs. Concept: `research_routing_check.mjs` accepts the Claude fan-out fallback and now fails every third-party label | `3ce78a6` |
| `b02426d0` | Research layer wiring + AI-ban lift | Research wiring ported across the chain. AI-ban lift and BYOK helpers skipped (new tools); concept: sub-agent model tiers and the `claude-subagent-fanout` fallback | `3ce78a6` |
| `acef2177` | Kickoff description names the Research QA gate | Ported | `3ce78a6` |
| `0b2d5532` | Blank tier is unknown, never an exclusion | Already ported as `fb041f8` | `fb041f8` |
| `7ea7c9d8` | Approval-brief pre-flight headings | Ported | `f423594` |
| `31c04e6b` | Stray period in the template | N/A: FNNL's template never had it | none |
| `17cec094` | Spaced em dashes (docs, CLAUDE.md, 14 skills) | Ported | `50f551f` |
| `8de95726` | Retire the legacy DOCX builder | Ported (`outbound/_archive/docx-approval-brief-2026-09-24/`) | `f423594` |
| `7822f28f` | Vendor keys marked; `review_gates` the stated default | Default-mode half ported (22 skills plus the policy and kickoff). Vendor key status skipped | `f423594` |
| `2252877a` | Catalog is not read by the approval deck | Ported | `f423594` |
| `69c0a3a0` | Spaced em dashes (39 skills) | Ported | `50f551f` |
| `8bacf245` | Scorecard keys off `send_eligible` | Already ported as `3e7ca48` | `3e7ca48` |
| `0885229d` | Stale vendor claims | Skipped: upstream vendors only | none |
| `74971f21` | Preflight research header | Skipped: describes the upstream BYOK header; FNNL's header is still correct | none |
| `e6ce4abc` | AI and mailbox keys | Skipped: new AI provider and upstream vendor keys | none |
| `c53240bc` | Crawler MCP guardrail | Skipped as a tool; concept: the "not routes" list in `market-evidence-standard.md` section 9 | `3ce78a6` |
| `1ecd9a3e` | Operator-managed mailbox vendor, its MCP | Skipped: upstream vendor | none |
| `200d205a` | Promptfoo model-eval layer | Skipped as a tool (keyed model APIs). Concept: `outbound/evals/`, Claude tiers and prompt versions only, same checks and keep rule; skill-change hygiene in CLAUDE.md | `46f92f9` |
| `08a0cd4c` | Promptfoo share warning | Skipped as a tool; concept: cases and results never leave the machine | `46f92f9` |
| `69536d0c` | Aaron pre-launch gap audit | N/A: the decisions are ported through `b23cc837` and `5ff8b28a` | none |
| `367676aa` | Widen the gap audit | N/A (as above) | none |
| `b23cc837` | Aaron gap fixes | Ported: offers placed by fit, weak-offer screen, pay-on-result, offer-type sentence shape, spam-checker labelled arms, quantified outcome optional, Gate 2, HOLD split, warmup two weeks, offer-widened discovery filters. Skipped: upstream discovery-tool seed tiers and shared-pool trim lines | `5d041b2` |
| `5ff8b28a` | `primary_cell_disqualifiers`, two winners | Ported | `5d041b2` |
| `62470f97` | Targeting spec, waterfalls, verify cache, list QA | Ported with a FNNL routing yaml keyed to the six (AI Ark, then Prospeo; catch-all to the holdback), a MillionVerifier verify CLI, and scripts generalized to read the verifier from the yaml | `538672f` |
| `e8904c66` | Person fallback reaches the planner; results feedback; upload gate | Ported (upload gate in `/list-quality-scorecard`, since FNNL has no upload skill) | `538672f` |
| `6fad59a3` | GetLeads-first for people and email | Skipped: an upstream-only cost order across upstream vendors; FNNL keeps its contract order. Ported: tests pin their own routing, plus a test that the yaml's email order equals the contract's | `538672f` |
| `68edd76e` | Research actors and SOP | Skipped as a tool. Concept: tool-neutral platform facts and the test-before-trust rule in `/offer-intelligence` and the standard | `3ce78a6` |
| `5eb9fa36` | Live re-check of two upstream connectors | Skipped as vendor data. Concept: a dated free-calls-only live re-check section in `provider-capability-matrix.md` | `538672f` |
| `3efd4217` | Reddit via a paid actor only | Skipped as a tool (Reddit stays operator paste in FNNL). Ported: the factual correction (rate-limited 429, not 403) | `3ce78a6` |
| `3f8fc733` | Daily client intel feed | Concept ported: `/client-intel-sync` on demand, generic sources, cross-agency guard, parameterized store script, read contract in about 20 skills. Skipped: the scheduled task and the notetaker API key | `025c23d` |
| `ccb3a77b` | Intel activity-log command, paging, lookback | Ported | `025c23d` |
| `78e329bf` | Context sweep runs first | Ported with generic sources; blocklists to suppression; upload stop in kickoff Step 6; `lead_score.py` company-domain suppression (landed with list QA in `538672f`) | `025c23d`, `538672f` |
| `142afe8a` | Recount feed counts in place | Ported | `025c23d` |
| `f8f3937b` | Pre-Start sweep check | Ported | `025c23d` |
| `4388a1ed` | Named internal sheets; CA/UK/IE opt-out flag | Concept ported: generic named internal sources (client directory, pipeline sheet, content folder), booked contacts to suppression; the CA/UK/IE opt-out ruling as a compliance flag with FNNL's one-click default unchanged | `025c23d` |
| `c369a052` | Don't pin unconfirmed sheet fields to one tab | Ported (generic form) | `025c23d` |
| `e09f14aa` | Client research ledger | Skipped: client-specific | none |
| `7cd876cc` | Client offer-slate deck module | Skipped: client-specific | none |
| `0a8b65dc` | Four phase checkpoints replace the per-fork stops for new clients | Ported (FNNL keeps its context sweep, Step 6 upload stop, deferred infrastructure and hard stops; the contract's execution defaults updated) | `ddd8705` |
| `5424e887` | Record phase checkpoints so a resumed run never skips one | Ported | `ddd8705` |

## Beyond the diff (FNNL-only fixes made on the way)

- `.gitignore` no longer ignores all of `outbound/scripts/research/`, so the evidence ledger and the routing check are tracked.
- References to a skill FNNL does not ship (an inbox-setup tracker) became conditional.
- `leads_split_verified.mjs`, `/email-waterfall` and `/lead-source-strategy` now send a catch-all verdict to the holdback, as FNNL's contract always said.
- The workbench push happens only after list QA (a webhook push appends and cannot remove rows).
- `list_quality_scorecard.mjs` (unreferenced, hardcoded a finance title) was retired to `outbound/_archive/list-qa-legacy-2026-09-24/`.

## Open items for the operator

- `/mailbox-pool-staging` still says about three weeks of warmup; the Aaron fix says two weeks before Start (FNNL's Gate A already says two). Left as is because that section mirrors a vendor's published figures.
- Whether GetLeads' LinkedIn-to-email lookup should become an email rung after AI Ark and Prospeo.
- Benchmark cases are empty until they are seeded from FNNL's own client research.
- `/market-evidence feedback`, `list_feedback.py` and the sending-platform export columns stay dormant or unverified until PlusVibe is `live`.
- The connectors FNNL sessions see may belong to the operator's other agency; the cross-agency guard files only FNNL clients, but the operator may want FNNL-specific connectors.
- The verify CLI retries three times and the planner retries once more, so a persistently erroring address could cost several calls; MillionVerifier's billing for errors is unrecorded.
- Some older FNNL skill lines, written before this port, still name out-of-stack tools. Some are catalogue examples (`/lead-source-strategy`, `/social-proof-bank` item 5). A few read as live instructions that conflict with FNNL's AI Ark, then Prospeo, then MillionVerifier order (`/lead-list-tech-stack-research` around its contact-waterfall and TAM-spine paragraphs, `/lead-source-strategy` lines about the contact-discovery source). They need a separate cleanup to reframe them against the stack contract.
- `.claude/skills/curator/curator-ledger.md` keeps its spaced em dashes: it is a running history log, not a skill, and upstream kept its copy the same way.
