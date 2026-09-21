# Archived: campaign-copywriting, email structure, signature and openers

- **Source file:** `.claude/skills/campaign-copywriting/SKILL.md`
- **Section:** Email Structure; Subject Line Strategy; Opener Strategy; Opener Framework (Email 1 and Email 3)
- **Archived:** 2026-09-21 (operator-approved Aaron alignment)
- **Reason:** The situation-first structure and layout contradict offer-first (doctrine §9: "no pain, no observation, no preamble"; ledger R14); the 3-line signature with title and location contradicts doctrine §9 (Signature and send format); "the dream outcome made specific" as the default opener contradicts doctrine §4 (the default implies the outcome through the deliverable, and an outcome named with a zero-risk term runs only as a labeled arm); exactly one merge token was house hardness (doctrine §13).

Replaced in place by the aligned live text in the same section of the source file, which carries a pointer back here. Each excerpt below is one changed passage exactly as it stood in the live file before this change; line numbers refer to that pre-alignment file. This is a record, not live doctrine: do not lift any of it into copy. The original text, verbatim:

## Email Structure (pre-alignment lines 1093 to 1094)

> - Email 1: 25 to 35 body words, 2 to 3 main-body sentences, exactly 1 question (Hard Rule 27). Any optional P.S. is declarative and included in the word cap.
> - Follow-ups should be short, usually under 50 words.

## Email Structure (pre-alignment lines 1098 to 1101)

> 1. Situation recognition.
> 2. Value claim and proof.
> 3. Value-backed CTA.
> 4. Optional P.S. line only when it adds a different relevant angle.

## Email Structure (pre-alignment lines 1103 to 1103)

> Every part must pass the Copy QA Gate.

## Email Structure (pre-alignment lines 1107 to 1107)

> Write the email as short blocks separated by blank lines, not one dense paragraph:

## Email Structure (pre-alignment lines 1110 to 1110)

> {{first_name}}, [opener plus the situation or signal. 1 to 2 sentences.]

## Email Structure (pre-alignment lines 1112 to 1114)

> [The pain or insight. 1 to 2 sentences.]
>
> [The proof, then the CTA.]

## Email Structure (pre-alignment lines 1117 to 1117)

> A blank line between blocks is required. This is whitespace, not banned formatting. It is what makes the email scannable in a busy inbox and on a phone. The blank lines are part of the body: in the pre-written copy path they are stored inside the `email_*` CSV cell; in the template path they are in the step body.

## Email Structure (pre-alignment lines 1121 to 1121)

> Email 1 (the single new thread) MUST close with a full signature block, not a first name alone. A fuller signature reads as a real person at a real company and supports legitimacy. The same-thread follow-ups (Email 2, and Email 3 in a 3-step) sign with the first name only. Use this 3-line format for Email 1, plus an optional 4th phone line when the client has supplied a number:

## Email Structure (pre-alignment lines 1124 to 1127)

> {full name}
> {title} @ {company name}
> {company location}
> {phone}          ← 4th line, only when client has supplied a sender phone (sender_persona.phone)

## Email Structure (pre-alignment lines 1132 to 1133)

> - The full name is the sender persona's full name (from `client-profile.yaml` `sender_persona.name`). The company name + location come from `client-profile.yaml` / the client's public contact page. `{company location}` is the company's city + country (e.g. "Espoo, Finland"), not necessarily the full street address.
> - Line 2 puts the title and company on one line joined by ` @ ` (e.g. `Partner @ ExampleCo`). If the persona has no defined title, use a broad, defensible one (e.g. Partner). Do not invent a specific senior title for a fabricated persona.

## Email Structure (pre-alignment lines 1135 to 1135)

> - **Phone line (optional 4th line):** when `client-profile.yaml` `sender_persona.phone` is set, append it as a 4th line below the location, joined with the same `<br>`. Use ONE fixed number per persona — the persona is one real human, so it never shows two or three different numbers across the client's campaigns. If the client gives several numbers, the first is primary and the rest live in `sender_persona.phone_pool` as spares (swap if a number is ever flagged/burned). If `phone` is absent or `pending` ("Soon"), the 3-line block stands — never invent a number. The phone is static sender identity, configured once on the step exactly like the rest of the block.

## Email Structure (pre-alignment lines 1137 to 1137)

> - Place the signature in the sending tool, never in per-contact lead or CSV data. In the `variants.yaml` template path it is part of the campaign step body. In the pre-written copy path (see Pre-Written Email Copy Architecture) the body variable carries no sign-off, and the static signature block is appended below the variable on the sending-tool step, for example `{{email_1_a}}` followed by the 3-line (or 4-line with phone) block.

## Subject Line Strategy (pre-alignment lines 1152 to 1152)

> - built with exactly 1 merge token, normally `{{first_name}}`

## Subject Line Strategy (pre-alignment lines 1159 to 1159)

> - fake thread prefixes

## Opener Strategy (pre-alignment lines 1171 to 1171)

> - lead with the offer itself: the dream outcome made specific, plus the risk reversal

## Opener Strategy (pre-alignment lines 1176 to 1176)

> If the offer could be sent by any competitor to any list, rewrite it. Note the level this test now runs at: the opener is deliberately SHARED across the whole campaign or slice (first name plus company only), so "it applies to many people" is by design and is not the failure. The failure is an offer so broad it is specific to no one. Make it specific to the slice, not to the individual.

## Opener Framework (Email 1 and Email 3) (pre-alignment lines 1268 to 1268)

> The current rule is short: every new-thread email opens with an OFFER-LED opener that leads with the offer itself (the dream outcome made specific plus the risk reversal), per the Offer-First Copy Standard and Hard Rule 19, never a warmup or self-introduction. The opener is shared across the whole slice, filled only with `{{first_name}}` / `{{company}}`. There is no per-contact opener generation and no personalization-source priority order.
