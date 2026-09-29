# Port of the 2026-09-29 to 2026-09-30 upstream updates into FNNL (2026-09-30)

**What this is.** The record of how every commit the upstream workspace landed after its client-messages commit (`b6f2710a`, ported on 2026-09-28) up to `b6d54de0` was brought into FNNL. The operator's instruction on 2026-09-30: do the same thing again, port process, backbone and concepts only, and approve the recommended plan for each open fork.

This is history, not live doctrine. Upstream SHAs refer to the upstream repo; FNNL SHAs to this one. Upstream vendor names appear below only to say what was not ported.

**Cutoff.** The range is upstream `b6f2710a..b6d54de0` (29 commits). FNNL started at `7486a85`.

## Decisions made with the operator on 2026-09-30

1. **Ask policy: adopted.** Find the answer first (context sweep, profile, memory, earlier answers). Ask only up front, once, in one batch, at checkpoints 1 and 2. Small calls are decided and listed under "Calls I made". Every answer is stored in the client's `rulings.md` or in `outbound/reference/standing-rulings.md` and never asked twice. Four mid-run stops only: a tool out of balance or down, spend over the budget, Aaron's call contradicting a client requirement, a missing required key. FNNL keeps the kickoff Step 6 draft-upload stop as a named fifth exception, so "reuse with judgment" never removes it.
2. **Offers come only from Aaron: full decoupling.** No house offer guide and no house brainstorm. `/lead-magnet-brainstorm` is a recorder, `/offer-intelligence` is evidence-only, and offers come from a fresh `/ask-aaron` sub-agent reading Aaron's live Notion notes. No Notion access means no offers. The four house guides moved to `outbound/_archive/offer-decoupling-2026-09-30/`. Frozen copy-QA snapshots `aaron-doctrine.md` and `aaron-examples.md` now live in `outbound/reference/`. "Every idea stays visible" stays.
3. **Spintax everywhere.** Every subject and every body sentence of every step carries the sending platform's spintax, option A stays exact in `variants.yaml` and `copy.md`, protected tokens are never spun, and the result is read back after upload (Hard Rule 40 and the Spintax Rules section). PlusVibe's syntax `{{random|a|b|c}}` is documented in `stack-contract.yaml`. Whether it evaluates inside a subject line or a custom variable is unconfirmed and needs a preview on the first build; the fallback is plain option A, recorded and noted at the launch review.
4. **Opt-out is always the FNNL house default and is never asked**: no opt-out line in the body, the one-click List-Unsubscribe header (kickoff Gate C), opt-outs by reply, in every geography including Canada, the UK and Ireland. The skill records it itself, citing "operator directive 2026-09-30, always house default". A stricter requirement from the client's own counsel, when already on record, is honored.
5. **Verify cache.** `millionverifier_verify.mjs` mirrors each verdict to `profiles/<slug>/verify-cache.jsonl`, newest `verified_at` wins, a missing shared cache warns loudly, and the cache is append-only live state. No restore script.

**Deferred (Wave 5, still not ported):** reading sending-platform campaign history at onboarding (`783649cb` touches only that) and a reply-followup skill that sends email.

**FNNL rules kept intact:** the six-tool stack (GetLeads, AI Ark, Prospeo, MillionVerifier, Clay at zero credits, PlusVibe) in capability roles; no third-party AI API; the \$100 standing budget written automatically; the context sweep first; the kickoff Step 6 draft-upload stop; infrastructure may be deferred; pressing Start is always the operator's; `run_state` field names unchanged; `_vendor-library/` inert.

## FNNL commits

| FNNL | What it carries |
|---|---|
| `46d6c3f` | Ask policy, `standing-rulings.md`, the four phase skills, kickoff, ICP onboarding, intake form, Aaron lane note, client messages, context sweep, `CLAUDE.md` |
| `07a3b47` | Hard Rule 40 and the Spintax Rules, opt-out item 0a as the house default, older no-spintax lines removed from the copy references |
| `ddf848e` | Offer decoupling: recorder skill, evidence-only offer-intelligence, archived guides, frozen Aaron snapshots, citations repointed |
| `14d3fd8` | `offer_approval.py` text storage, `aaron_frame_check.py` leading first name, MillionVerifier per-client cache, tests |
| this file | The manifest |

## Every upstream commit in range

Disposition: **Ported** (tool-neutral, re-expressed in role vocabulary), **Concept** (the idea ported, the tool not), **Skipped** (an upstream-only tool, a client, or a deferred item, with the reason), **N/A** (nothing to port).

| Upstream | Subject | Disposition | FNNL |
|---|---|---|---|
| `b6d54de0` | Launch inherits sender-side settings, target-side ones derived from the new campaign | Concept: `launch-settings` ruling and phase 4 wording; the upstream sending-platform reader not | `46d6c3f` |
| `952a4abd` | Ask policy part 2: up-front checkpoints, Aaron client-fit stop, spintax everywhere | Ported, without the campaign-history reader | `46d6c3f`, `07a3b47` |
| `156aa04f` | Remove the house offer brainstorm | Ported | `ddf848e`, `46d6c3f` |
| `dd1f1b1b` | Frame check accepts a leading first name on F2 | Ported | `14d3fd8` |
| `91a12a81` | Ask policy: find the answer first, ask once up front | Ported | `46d6c3f` |
| `24dff425` | Company-fit route comments, client names dropped | N/A: upstream fit route | none |
| `639b1e76` | Company-fit two-stage route described generically | N/A: upstream fit route | none |
| `5215db44` | Company-fit two-stage route with a third-party AI model | Skipped: third-party AI API | none |
| `21829b0e` | List-engine one-per-function picking | Skipped: upstream list engine | none |
| `f5c6e0b1` | Company-fit model bake-off log | Skipped: upstream eval data | none |
| `81a7bc29` | Verify cache survives a deleted cache, newest verdict wins, restore tool | Concept: per-client mirror, newest wins, loud warning; no restore tool | `14d3fd8` |
| `9e952a2b` | Company-fit bake-off log | Skipped: upstream eval data | none |
| `4e02e19c` | Company-fit Clay formula test log | Skipped: upstream eval data | none |
| `6caf52be` | Company-fit on-client check log | Skipped: upstream eval data | none |
| `51fe561d` | Lock the company-fit route as default | Skipped: third-party AI API | none |
| `a82537d5` | Reply-inbox tool campaign filter docs | Skipped: upstream inbox tool | none |
| `84a5b4d0` | Reply-inbox tool view count docs | Skipped: upstream inbox tool | none |
| `783649cb` | Campaign-history network failures write status blocked | Skipped: Wave 5 deferred | none |
| `66ee3787` | Reply-inbox tool campaign-only views | Skipped: upstream inbox tool | none |
| `d2157820` | Opt-out is always the house default, never ask | Ported: extended to FNNL by the operator on 2026-09-30 | `46d6c3f`, `07a3b47` |
| `18bf0d9a` | Company-fit offer_fit=no enforcement | N/A: upstream fit route | none |
| `248b0111` | Company-fit site text and web search read | Skipped: third-party AI API | none |
| `4557b3ad` | List-build hash split for three or more arms | Skipped: upstream list engine | none |
| `684df012` | The client message asks only what blocks a launch | Ported | `46d6c3f` |
| `04d3ec17` | Offer readiness: yes/no approvals stored as text | Ported: the write side | `14d3fd8` |
| `627b3644` | Move idle mailboxes into the internal workspace | Skipped: upstream inbox tool | none |
| `2662643a` | Reply-inbox tool docs corrections | Skipped: upstream inbox tool | none |
| `a98f5a4b` | Warmup exclusion tags check | Skipped: upstream sending tool | none |
| `2a7e59eb` | Shared-pool per-domain check log | Skipped: upstream inbox tool | none |

**Count check.** 29 rows, matching the 29 upstream commits: 7 Ported, 2 Concept, 17 Skipped, 3 N/A. By group: 10 company-fit (`24dff425`, `639b1e76`, `5215db44`, `f5c6e0b1`, `9e952a2b`, `4e02e19c`, `6caf52be`, `51fe561d`, `18bf0d9a`, `248b0111`), 2 list-engine (`21829b0e`, `4557b3ad`), 7 reply-inbox and mailbox (`a82537d5`, `84a5b4d0`, `66ee3787`, `627b3644`, `2662643a`, `a98f5a4b`, `2a7e59eb`), 1 Wave 5 (`783649cb`), and 9 ported or concept rows.

## Known gaps left open

- The mirrored `/ask-aaron` skill is half-migrated in all three workspaces: its `SKILL.md` still cites `aaron-doctrine.md` and `aaron-examples.md`, which are deleted from that folder. The mirror check passes (8 identical). Fixing it means editing the four mirrored skills and syncing, which was out of scope for this port.
- PlusVibe spintax in a subject line or custom variable is unconfirmed; check the preview on the first build.
- Opt-out is never asked. For Canada, the UK and Ireland this is an operator decision, not legal advice; a client's own counsel requirement on record still wins.
- No Notion access in a session means no offers and the run reports it.
- Pre-existing FNNL working-tree changes left untouched and uncommitted: the deleted `ask-aaron` doctrine copies, edits in `ask-eric`, `ask-nate`, `ask-taylor` and `outbound/scripts/api-balance-ledger.md`.
- One client's profile files under `outbound/profiles/` still reference the old doctrine path; profiles are never committed or edited under the port rules.
