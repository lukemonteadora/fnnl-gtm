This file holds the Pre-Written Email Copy Architecture (the per-row `email_*` column mechanism the upload to the sending platform reads), moved verbatim from `../SKILL.md` on 2026-09-28. Read it when the per-row columns are rendered (`/personalization-subagent-pattern`), when the upload to the sending platform is built, or when another skill cites it. Words like "above" and "below" refer to the original single-file order; the "Where the rest lives" table in `../SKILL.md` says where each named section now is.

## Pre-Written Email Copy Architecture

This is the column-delivery mechanism the upload to the locked sending platform reads, in that platform's own custom-field syntax: the lead list carries one complete body column per live sequence step and Email 1 variant: `email_1_a`, `email_1_b`, `email_1_c` (three Email 1 variants by default, a further letter only when a test needs it), `email_2`, and optional `email_3`. Each sending-tool step references only its body column plus the step-level signature. **Under Hard Rule 34 (resolved; operator-approved Aaron alignment, 2026-09-21), every row's column carries its variant's shared slice body.** What varies per row is the contact's first name, where the body uses it, and at most two per-contact variable values inside the offer sentence (`sells_to_vertical`, `service_offered`, `own_best_client`), baked in as literal text the same way (Aaron process alignment, operator directive 2026-09-22; supersedes first-name-only variation, 2026-09-21). A row with no sourced value carries the slice's approved version of that body without the variable, and where no per-contact case study exists the slice's near-twin case is written into the shared body. Email 1 still follows the Framework A anatomy; the column mechanism cannot lengthen it, add a hook before the offer, add a stacked ask, or create a per-contact subject. It does not replace the `variants.yaml` + `{{double_braces}}` template model above: the shared body IS the `variants.yaml` body, rendered per row.

- Template model (`variants.yaml`): one well-written email body per step with a few variables assembled at send time. Use when the sending tool expands the variables reliably and one strong email covers the slice.
- Pre-written (column) model: the slice's shared body is rendered per row (the name and any per-contact variable values baked in) and exported as a single field per step. Use it whenever the upload to the locked sending platform reads per-contact columns (the `email_*` columns, in that platform's variable syntax; mechanism unchanged), or whenever a variable must be baked in because the sending tool will not expand a merge field inside another field.

**The rung is resolved: the shared slice body (Hard Rule 34, operator-approved Aaron alignment, 2026-09-21).** The signal's primary job is list relevance, not copy content (doctrine §8), and Aaron superseded per-contact insert stacking in favour of personalizing the ICP or slice variable (ledger R13). So there is no per-contact full-body default anymore, and `deal_value_tier` (set by `/data-point-discovery`) no longer selects a per-contact copy rung; signals and collected data still pick the slice and the offer each slice gets. The case study used as the deliverable's target (doctrine §9, examples §1.5) is the prospect's own best client per contact (`own_best_client`) where the data holds it, and the slice-level near-twin otherwise; with `sells_to_vertical` and `service_offered` these are the only per-contact variables, at most two per email, inside the offer sentence (Aaron process alignment, operator directive 2026-09-22). Still record `personalization_rung` with its one-line rationale in `copy.md` and the activity log (the shared slice body, the per-contact variables it uses, and their fallback), so older records stay readable and no later session has to reverse-engineer the choice. The old per-contact full-body default is archived at `outbound/_archive/aaron-alignment-2026-09-21/campaign-copywriting--pre-written-email-copy-architecture.md`.

**Downstream artifact note.** The approval brief (`/campaign-approval-brief`), the sequence DOCX (`/cold-email-campaign-sequence-docx-presentation`), and the `copy.md` review record are all generated from `variants.yaml`. Because the body is shared per slice, `variants.yaml` and `copy.md` carry the real body (with its per-contact variables as `{{placeholders}}`) and the `email_*` columns are its per-row rendering, so write both for every campaign; the downstream artifacts then show exactly what ships.

### The core shift

Template model: static copy in the sending tool, variables assembled at send time.

Pre-written model: the shared body is rendered per contact before it reaches the sequencer and stored as one text field per email slot. The sending tool receives only a ready-to-send body. No assembly in the sequencer, no conditional logic in the sending tool. Within this path, "no variables, no assembly, no conditionals in the sequencer" is the rule. It does not change the Variable Schema or the `variants.yaml` template path above.

In this repo the per-row rendering step is `/personalization-subagent-pattern` (parallel Task sub-agents that already enforce this Copy QA Gate and `spam-word-checker.md`). Under Hard Rule 34 it renders the shared slice body and bakes in the first name and the at most two per-contact variable values; where the data lacks `service_offered` or `own_best_client`, its Claude sub-agents derive them from the prospect's own site with an evidence URL, never an AI column. It does not write per-contact prose. The same principle applies to a deterministic Claude Code script over a CSV. AI columns in the list workbench are not an equivalent path: they are banned on every key (no-AI-API rule, operator directive 2026-09-22), so the rendered rows are pushed into the workbench by webhook. The canonical generation prompt for this path lives in `/personalization-subagent-pattern`.

### Per-contact rows (one shared body per slice)

Each live email copy column holds one complete body per contact row: its variant's shared slice body. There is no per-row wording decision inside the generation prompt and no separate fallback column (Hard Rule 34). The per-row differences are the baked-in first name, where the body uses it, and at most two per-contact variable values inside the offer sentence. When a row has no sourced value for a variable the body uses, the row carries the slice's approved version of that body without the variable (written once in `copy.md` beside the main body), never a guessed value. Email 1 always begins with the approved offer (a labeled opener arm aside). Email 2 and optional Email 3 are same-thread follow-ups.

### Column naming convention

Email 1 runs three variants by default: `email_1_a`, `email_1_b`, `email_1_c`, one variable changed per variant (A is the control), more letters allowed (Aaron, Sep 21: variant one, variant two, variant three; Mar 9: one variable at a time). (Aaron process alignment, operator directive 2026-09-22; supersedes the two-variant `email_1_a`/`email_1_b` convention, 2026-07-05.)

- `email_1_a` = Email 1 (Thread 1), Variant A, the control
- `email_1_b` = Email 1 (Thread 1), Variant B, one variable changed against A
- `email_1_c` = Email 1 (Thread 1), Variant C, one (different) variable changed against A
- `email_1_d` and on = further Email 1 variants, only when the campaign's `variants.yaml` declares them, one variable each
- `email_2` = Email 2 (reply to Thread 1), supporting email, single variant (no split), one complete body per contact
- `email_3` = Email 3 (optional third step, SAME thread; a genuinely small market or a tested arm only), single variant (no split), one complete body per contact
- (no `email_3_a` / `email_3_b` split columns and no `email_4`: the 4-email / two-thread structure is retired 2026-07-05; Email 2 and Email 3 are single-variant same-thread follow-ups)
- No subject columns. Email 1 uses one shared static subject template containing 2 to 4 lowercase words and 0 to 2 variables, on every Email 1 variant. Email 2 and Email 3 inherit the thread.

These `email_*` columns contain the BODY only (no subject text, no signature, no sign-off inside the body cell). Each body is formatted as short blocks separated by blank lines (the blank lines live inside the CSV cell), never one dense paragraph. Where the shared body uses the contact's first name (optional, and it may open the email, examples §1.1) or a per-contact variable, the value is baked into the text, so the sending-tool step is only `{{email_1_a}}` plus the signature: there is no separate `{{first_name}}` or `{{sells_to_vertical}}` token on the step. Bake the values in rather than nesting a merge field inside the column: sending tools do not reliably expand a merge field that sits inside another custom-field value. The blank lines between blocks inside the cell are what produce the email's paragraph breaks, so confirm in a live preview that the sending tool renders them as line breaks before launch (if it does not, the body must carry the breaks as the tool's own markup).

**The Email 1 subject is shared and static at the campaign level.** It contains 2 to 4 lowercase words and 0 to 2 variables, in the shape of his "question about topic" (examples §3; he says of it *"That one's always a good one."*), with the slice's topic typed in, for example `question about [topic]`. His other endorsed subject, "fyi first name", written `fyi {{first_name}}`, is a normal option, and "your [the offer's own object]" (his Sep 21 "your trial") passes the relevance test (Aaron process alignment, operator directive 2026-09-22; supersedes the 2026-09-21 ruling that ran `fyi {{first_name}}` only as a labeled test variant). The shared subject rides every Email 1 body variant so the body remains the isolated test variable. Follow-ups inherit the thread. The signature is appended in the sending-tool step.

### Sending-tool variable usage and signature

Each new-thread step carries a SHARED static subject line in its subject field and the per-campaign BODY variable in its body field, plus the static signature block. (Per-contact subjects are retired 2026-07-05.) The full body lives inside the pre-written field. The signature is static sender identity (one persona per client), configured once in the step, never written into the CSV.

Email 1 step (Campaign A):

```text
Subject: question about [topic]          ← [topic] is the slice's topic, typed in once (not a merge field)

{{email_1_a}}

{first name}
{company name}
{phone}          ← only when client has supplied a sender phone (sender_persona.phone)
```

Any line a client's counsel or the recipient's jurisdiction requires (for example a sender postal address) is added exactly as required and recorded under Compliance in `copy.md` (Hard Rule 23). Email 1 Variant B uses the same shared subject template and `{{email_1_b}}`, Variant C uses it with `{{email_1_c}}`, and any further declared letter the same way, each followed by the same signature block. Email 2 and optional Email 3 have an empty subject because they are threaded replies; their bodies are `{{email_2}}` and `{{email_3}}`.

### Split testing: within-campaign variants (preferred where the platform supports them) or across campaigns

The Email 1 variant columns (`email_1_a`, `email_1_b`, `email_1_c`, and any further declared letter) can be wired two ways. Pick by platform. Either way the upload wires one variation per declared Email 1 column on the locked sending platform (`run_state.sending_platform`), confirms the platform takes that many variations with an even split, and stops rather than dropping Variant C (Aaron process alignment, operator directive 2026-09-22; supersedes the two-variant 50/50 wiring).

- **Within-campaign variants (preferred when the sending platform supports native variant slots; resolve the platform from the stack contract).** One campaign per slice. Email 1 holds one variation per declared column (A, B and C by default), split evenly across all of them. Every variation uses the same shared subject and follow-ups, so reply differences trace cleanly to the body copy. Use the campaign-upload skill for the locked `run_state.sending_platform`, if `/stack-setup` activated a pack that provides one. If no pack is active, set the variations and the even split in that platform's native campaign builder. If neither exists, say so and build it by hand rather than implying coverage. Confirm on the first build that the platform accepts three or more variations on one step and splits contacts evenly across them, and record it. If it caps a step at two variations, stop and report it; never drop Variant C to make the upload fit.
- **Across campaigns (platform-agnostic fallback).** One campaign per declared Email 1 column, sharing the same list split evenly between them: Campaign A pulls `email_1_a`, Campaign B pulls `email_1_b`, and Campaign C pulls `email_1_c`. Use only when the sending tool cannot run native within-step variants.

Either way every Email 1 variant shares `email_2` and optional `email_3`; the follow-ups are not split (Sep 21 shows three step-one variants and a single step two).

### Export gate

Never export a row where any required output column is blank. Filter to rows where `first_name`, `company_name`, every Email 1 variant column the campaign declares (by default `email_1_a`, `email_1_b` and `email_1_c`), and every live follow-up column are non-empty (Aaron process alignment, operator directive 2026-09-22; supersedes "both required Email 1 variant columns"). A blank body means generation failed. Validate the shared subject template once, then scan every body column for banned punctuation and tokens. Confirm every row's body equals its variant's shared slice body (or the slice's approved no-variable version) apart from the baked-in first name and at most two per-contact variable values inside the offer sentence (Hard Rule 34), and that the first 20 filled variable values passed human review. Confirm Email 1 passes the Framework A default-anatomy checks and that no signature or sign-off was baked into a body column.
