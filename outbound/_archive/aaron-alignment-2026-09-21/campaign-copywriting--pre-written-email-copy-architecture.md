# Archived: campaign-copywriting, Pre-Written Email Copy Architecture

- **Source file:** `.claude/skills/campaign-copywriting/SKILL.md`
- **Section:** Pre-Written Email Copy Architecture
- **Archived:** 2026-09-21 (operator-approved Aaron alignment)
- **Reason:** The per-contact pre-written full-body default and the per-row personalized-or-fallback logic contradict Hard Rule 34 and Aaron's ledger R13 (personalize the ICP or slice variable, no per-contact insert stacking; doctrine §8: the signal's primary job is list relevance). The Hard Rule 34 fork flagged unresolved on 2026-09-18 is resolved in favour of Hard Rule 34 by operator approval; the per-contact `email_*` column mechanism is unchanged.

Replaced in place by the aligned live text in the same section of the source file, which carries a pointer back here. Each excerpt below is one changed passage exactly as it stood in the live file before this change; line numbers refer to that pre-alignment file. This is a record, not live doctrine: do not lift any of it into copy. The original text, verbatim:

## Pre-Written Email Copy Architecture (pre-alignment lines 869 to 869)

> This is the standard model for genuine per-contact personalization: the lead list carries one complete body column per live sequence step and Email 1 variant: `email_1_a`, `email_1_b`, `email_2`, and optional `email_3`. Each sending-tool step references only its body column plus the step-level signature. Email 1 still has to follow Framework A exactly. Personalization cannot lengthen it, add a hook before the offer, remove the workload parenthetical, add a question, or create a per-contact subject. It does not replace the `variants.yaml` + `{{double_braces}}` template model above. For the pre-write path, keep a representative `variants.yaml` rendered with the fallback body when downstream review artifacts need it.

## Pre-Written Email Copy Architecture (pre-alignment lines 871 to 872)

> - Template model (`variants.yaml`): one well-written email body per step with a few personalization variables assembled at send time. Use when one strong email plus light variables covers the list.
> - Pre-written model: the enrichment and copy generation layer writes the entire email body per contact and exports it as a single field. Use when each contact needs a genuinely relevant version of the same approved offer and you want full quality control visible before export.

## Pre-Written Email Copy Architecture (pre-alignment lines 874 to 874)

> **Choosing the rung is a MATERIAL, surfaced decision — never a silent default.** Template vs pre-written changes the client-facing copy, so it falls under the Material Decision Rule even under `auto_execute`: state which model you picked and why in `copy.md` and to the operator, and do not quietly ship list-level templating when the list could carry genuine per-contact copy. The default for a real lead list is **per-contact pre-written full-body** (the standard), tuned by `deal_value_tier` (`/data-point-discovery` → `/personalization-subagent-pattern`): low-tier / uniform lists lean template, mid/high-tier or lists where each account carries its own collected signal get the full per-contact body. There are exactly two cases where **template is the CORRECT call, not a shortcut** — name which one applies when you use it: (1) the campaign's relevance is purely segment/list-level (one shared trigger the whole slice inherits) and no per-contact research hook was collected, so a per-contact column would only be the same sentence reworded; or (2) the wave is a deliberate **single-variable signal test** whose locked strategy holds copy constant across slices so reply differences trace to the list signal (vary only the segment opener). If neither exception holds, **surface the fork before committing** — per-contact full-body usually wins more replies, and picking template trades that away. Record the chosen `personalization_rung` plus its one-line rationale in `copy.md` and the activity log, so a later session or the operator never has to reverse-engineer why the copy was personalized at the level it was.

## Pre-Written Email Copy Architecture (pre-alignment lines 876 to 876)

> **Downstream artifact note.** The approval brief (`/campaign-approval-brief`), the sequence DOCX (`/cold-email-campaign-sequence-docx-presentation`), and the `copy.md` review record are all generated from `variants.yaml`. A campaign run purely through the pre-write path has no `variants.yaml`, so those artifacts are skipped unless you also produce one. If the campaign needs a client approval brief or a sequence DOCX, generate a representative `variants.yaml` (one variant per step, showing the structure) plus a `copy.md` alongside the per-contact `email_*` columns. Otherwise, treat the enrichment table itself as the review record and say so.

## Pre-Written Email Copy Architecture (pre-alignment lines 882 to 882)

> Pre-written model: the full email body is written per contact before it reaches the sequencer and stored as one text field per email slot. The sending tool receives only a ready-to-send body. No assembly in the sequencer, no conditional logic in the sending tool. Within this path, "no variables, no assembly, no conditionals in the sequencer" is the rule. It does not change the Variable Schema or the `variants.yaml` template path above.

## Pre-Written Email Copy Architecture (pre-alignment lines 884 to 884)

> In this repo the enrichment and copy generation layer is `/personalization-subagent-pattern` (parallel Task sub-agents that already enforce this Copy QA Gate and `spam-word-checker.md`). The same principle applies in an external enrichment platform's AI columns, a Claude Code script over a CSV, or any equivalent pipeline. The canonical AI generation prompt for this path lives in `/personalization-subagent-pattern`.

## Pre-Written Email Copy Architecture (pre-alignment lines 886 to 886)

> ### Per-contact conditional logic (personalized or fallback in the same column)

## Pre-Written Email Copy Architecture (pre-alignment lines 888 to 888)

> Each live email copy column holds one complete body per contact row, either a relevant personalized version or the fallback version. There is no separate fallback column. The decision happens inside the generation prompt, not in the sending tool. Email 1 always begins with the approved offer, so relevant data may sharpen truthful wording but may not become a hook or setup before the offer. Email 2 and optional Email 3 are same-thread follow-ups.

## Pre-Written Email Copy Architecture (pre-alignment lines 897 to 897)

> - No subject columns. Email 1 uses one shared static subject template containing 2 to 4 lowercase words and exactly one merge token. Email 2 and Email 3 inherit the thread.

## Pre-Written Email Copy Architecture (pre-alignment lines 899 to 899)

> These `email_*` columns contain the BODY only (no subject text, no signature, no sign-off inside the body cell). Each body is formatted as short blocks separated by blank lines (the blank lines live inside the CSV cell), never one dense paragraph. Each column also includes the greeting with the contact's first name baked into the text (for example `Tommi, ...`), so the sending-tool step is only `{{email_1_a}}` plus the signature — there is no separate `{{first_name}}` token on the step. Bake the name in rather than nesting `{{first_name}}` inside the column: sending tools do not reliably expand a merge field that sits inside another custom-field value. The blank lines between blocks inside the cell are what produce the email's paragraph breaks, so confirm in a live preview that the sending tool renders them as line breaks before launch (if it does not, the body must carry the breaks as the tool's own markup).

## Pre-Written Email Copy Architecture (pre-alignment lines 901 to 901)

> **The Email 1 subject is shared and static at the campaign level.** It contains 2 to 4 lowercase words and exactly one merge token, such as `fyi {{first_name}}`. It rides both Email 1 body variants so the body remains the isolated A/B variable. Follow-ups inherit the thread. The signature is appended in the sending-tool step.

## Pre-Written Email Copy Architecture (pre-alignment lines 914 to 916)

> {full name}
> {title} @ {company name}
> {company location}

## Pre-Written Email Copy Architecture (pre-alignment lines 920 to 920)

> Email 1 Variant B uses the same shared subject template and `{{email_1_b}}`, followed by the same signature block. Email 2 and optional Email 3 have an empty subject because they are threaded replies; their bodies are `{{email_2}}` and `{{email_3}}`.

## Pre-Written Email Copy Architecture (pre-alignment lines 933 to 933)

> Never export a row where any required output column is blank. Filter to rows where `first_name`, `company_name`, both required Email 1 variant columns, and every live follow-up column are non-empty. A blank body means generation failed. Validate the shared subject template once, then scan every body column for banned punctuation and tokens. Confirm Email 1 passes the Framework A mechanical checks and that no signature or sign-off was baked into a body column.
