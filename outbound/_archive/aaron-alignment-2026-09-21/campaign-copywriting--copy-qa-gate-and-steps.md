# Archived: campaign-copywriting, copy QA gate and steps

- **Source file:** `.claude/skills/campaign-copywriting/SKILL.md`
- **Section:** Copy QA Gate; Offer Architecture (complete before writing Email 1); Step 1: Confirm Campaign Direction; Step 2: Confirm Subject Line And First-Line Strategy; Step 3: Confirm Body Structure; Step 4: Output Final Copy; variants.yaml Requirement; copy.md Requirement
- **Archived:** 2026-09-21 (operator-approved Aaron alignment)
- **Reason:** These QA lines, templates and gate questions enforced the old hardness and the situation-pain-proof-offer layout, scoped the platitude read to situation and per-account trigger openers, offered signal-led and proof-led first lines, required the 3-line title-and-location signature, and listed a money-back guarantee and a chunk-up service description (doctrine §3, §4, §6, §9, §13; ledger R07, R14; examples §5).

Replaced in place by the aligned live text in the same section of the source file, which carries a pointer back here. Each excerpt below is one changed passage exactly as it stood in the live file before this change; line numbers refer to that pre-alignment file. This is a record, not live doctrine: do not lift any of it into copy. The original text, verbatim:

## Copy QA Gate (pre-alignment lines 252 to 252)

> - Remove em dashes, double hyphens, and mid-sentence dash separators from sendable copy.

## Copy QA Gate (pre-alignment lines 255 to 256)

> - Confirm Email 1 follows Framework A mechanically: 25 to 35 body words, 2 to 3 main-body sentences, exactly 1 question, the specific free deliverable first, the workload split in parentheses, and the soft permission question last. An optional P.S. is declarative, excluded from the main-body sentence count, and included in the word count. Follow-ups use their own forward-looking question and CTA-rotation rules.
> - Confirm every CTA (and every line) keeps the prospect on top. For Email 1, accept the permission phrasings `Would that be worth hearing more?` / `Open to it?` / `May I send it over to you?` / `Can I send it across?` / `Would it help if I sent it?` (German `Darf ich es Ihnen schicken?`). The statement-only opt-in `Just reply "Yes" and I'll…` is reserved for later steps because Email 1 must contain exactly one question. REJECT and rewrite any `Want me to send…?`, `Want us to send…?`, `Want the link?`, `Did you want…?`, `Interested?`, `Let me know if you'd like…`, `Worth a look?`, or anything that reads as needy, presumptuous, scripted, sketchy, or like there is a catch.

## Copy QA Gate (pre-alignment lines 258 to 259)

> - Confirm every email ends with a CTA — a clear next step or question — including the follow-ups (Email 2, and Email 3 in a 3-step); no dead-end soft close that trails off with nothing to answer (Hard Rule 31). Follow-up CTAs are soft (a light re-offer or a forward-looking question), never a repeated hard ask or a goodbye.
> - Confirm each follow-up moves the conversation (switch the mechanism or double down on a different lever), never re-sending Email 1's same ask or a vague "short note". **Checkable no-repeat CTA test:** read the sequence's CTA sentences side by side; if any two are the same sentence or offer the same mechanism, it FAILS. "Double down" rotates the CTA sentence, it does not reuse Email 1's (Hard Rule 21).

## Copy QA Gate (pre-alignment lines 262 to 262)

> - Confirm the Offer Architecture gate passed before any Email 1 copy was written (SQL/MQL framing, easy-to-say-yes test, named risk reversal).

## Copy QA Gate (pre-alignment lines 264 to 264)

> - Confirm the **delivery message matches the gap** (Hard Rule 36): pure value with zero call ask when `lead_magnet_gap` is set; soft time-proposal retained when it is absent. The ask is never stripped without a real motive in place.

## Copy QA Gate (pre-alignment lines 266 to 266)

> - Confirm any **asset-announcement E1 earned its slot** (Hard Rule 37): it carries a true inherent-value anchor AND the dream outcome sits inside the announcement sentence. Without the anchor, the conditional structure leads instead.

## Copy QA Gate (pre-alignment lines 268 to 268)

> - Confirm the new-thread Email 1 opens with an OFFER-LED opener (leads with the offer itself), never a vague self-introduction or a homepage summary. (Question-first / diagnostic-mirror openers are retired with proven-mode; see the Offer-First Copy Standard.)

## Copy QA Gate (pre-alignment lines 270 to 270)

> - Run the Shared-Asset Platitude Read (defined below) before lock: a forced skeptical pass over the shared opener, offer body, proof, and CTA, plus every per-account trigger opener. Revise any asset that reads as vendor wallpaper or a forced hook.

## Copy QA Gate (pre-alignment lines 272 to 275)

> - Confirm no dumb personalization: the copy never names the contact's job title or role ("As CTO…", "for a Founder like you") and never echoes a raw data field as surface mail-merge ("I see you're in SaaS", "based in Berlin"). Offer-first copy is the clean shared offer-led copy for everyone (first name plus company only); per-contact copy personalization is retired.
> - Confirm any **competitor name or public customer complaint in the body is SLICE-SHARED, not per-contact** (Hard Rule 38). All three bounds are checkable: the fact is true of every contact in the slice (if not, the slice is wrong, not the copy); it rides inside the offer sentence and never opens the email (Hard Rule 19); and no line refers to it as this reader's own ("I saw your review from Mary"). A campaign targeting "customers of Competitor X" may name X in one shared body. This does not reopen per-contact copy personalization, which stays retired.
> - Confirm no fake-familiarity or warmup phrasing appears in any email or follow-up (no "hope you're well"/"hope this finds you well", "just checking in"/"following up"/"following up on my last"/"circling back"/"touching base"/"bumping this", "I wanted to reach out"/"connect", unearned flattery, any phrase implying shared history, or any warmup before the first relevant line — Hard Rule 30).
> - Confirm the first two lines of every email and follow-up pass the said-out-loud test: they carry a point of view and/or spoken rhythm and sound like a real person, not a brochure or textbook. Follow-ups imply the prior touch without "following up on my last."

## Copy QA Gate (pre-alignment lines 277 to 279)

> - Confirm the subject line of Email 1 is a clean shared template on the step: 2 to 4 words, lowercase, exactly 1 merge token, spam-checked, and credible in isolation. Per-contact subject columns remain retired. The threaded follow-ups carry no subject.
> - Confirm every email is formatted as short blocks separated by blank lines, not one dense paragraph (opener plus situation / pain / proof / offer plus CTA — each its own block, pain never combined with the offer/CTA). Applies to every email, not just Email 1.
> - Confirm that right after the `{first_name},` greeting the next word is lowercase unless it is a proper noun (Hard Rule 29) — no mid-sentence capital like `Name, Each ...`. In the pre-write column model this is baked into each `email_*` body, so scan the columns, not just the step.

## Copy QA Gate (pre-alignment lines 281 to 282)

> - **Offer-first is the only copy mode (proven-mode retired 2026-07-05).** Write Framework A for every Email 1: 25 to 35 words, offer-led, mandatory workload parenthetical, exactly 1 question, minimal personalization, and a soft permission close. There is no `copy_mode` / `offer_market_proven` branch anymore; a residual value on the campaign is ignored.
> - Confirm Email 1 is 25 to 35 words and follows every Framework A mechanical check. Keep follow-ups under 50 words. In offer-led copy "we" is fine when it states the sender's real workload or team capability.

## Copy QA Gate (pre-alignment lines 295 to 295)

> A campaign's whole list inherits a tiny set of shared copy — usually one generic segment opener, one offer body, one proof line, one CTA — plus a handful of per-account trigger openers. Those few assets carry the entire campaign's blast radius, and the generic opener is what reaches every contact who has no personal signal (often most of the list). Before locking copy, run one forced skeptical read over them. This is a discipline gate, not a quality oracle: its only job is to stop a dead, vendor-wallpaper opener from shipping to the whole list.

## Copy QA Gate (pre-alignment lines 297 to 300)

> **Scope — NOT per contact.**
> - The shared assets every contact inherits: the generic/segment opener (the `situation_line`, or the default Email 1 / Email 3 opener), the offer body, the proof line(s), and the CTA.
> - Each per-account trigger opener (the personalized Email 1 / Email 3 opener lines written for strong-signal accounts).
> - The generic opener is ONE asset to read once, no matter how many rows share it. Never run this per row across the full list — that is the per-contact cost the design deliberately avoids.

## Copy QA Gate (pre-alignment lines 302 to 305)

> **The read — a platitude / weakest-line test, never a reply prediction.** Ask the wrong question and the read is useless: a skeptic asked "would you reply to this generic opener?" answers no, correctly and uselessly, every time (it has no personal hook by design). Ask the copy-quality question instead.
> - Shared generic opener: "This is a segment opener with no personal hook, by design. Given that, is the pain it names specific and true enough to feel earned, or could any vendor send it? Name the one line a busy {persona} mentally deletes on."
> - Per-account trigger opener: "Does this signal genuinely connect to the email's pain, or is it a forced or irrelevant hook? Name the weakest line."
> - Output per asset: the weakest-line callout plus a verdict — earned vs vendor wallpaper (generic), or connected vs forced (trigger).

## Copy QA Gate (pre-alignment lines 309 to 309)

> **Action and status.** If an asset reads as wallpaper or a forced hook, revise that one asset, re-run the spam-word + best-practices checks on the new wording, then proceed. "Passed the read" is NOT "solved": record the shared opener as a hypothesis pending real reply data (~day 21), never as a win. The value here is discipline on the highest-blast-radius asset — a forcing function against a rushed rubber-stamp — not superior judgment.

## Offer Architecture (complete before writing Email 1) (pre-alignment lines 414 to 414)

> Run this gate before Step 1 produces any direction and before a single line of copy is written. Offer selection happens upstream in `/offer-intelligence` and `/lead-magnet-brainstorm`; this is the copy-time confirmation that the locked offer is actually sendable. If you cannot answer all three questions cleanly, the offer is not ready. Fix the offer first. Sequence structure and copy quality cannot compensate for a weak or high-friction offer.

## Offer Architecture (complete before writing Email 1) (pre-alignment lines 416 to 416)

> **Frame it on the value equation and the Four Concretes (offer-first, HARD).** Before the three questions below, confirm the offer is built on the value equation ((dream outcome × perceived likelihood) ÷ (time × effort)) and that the copy can answer a buyer's Four Concretes: (1) the one-line service, (2) the differentiator, (3) the quantified outcome number, (4) the named recognizable proof plus its number. A missing concrete is handled two-tier like the Proof-Asset Gate: hollow-without-it → hold the angle, fire the proof-asset request, ship an honest interim that describes the outcome without a fabricated number; would-only-strengthen → flag, ship the concrete-as-possible version, upgrade when it lands. Never invent the number. Full definition: the Offer-First Copy Standard above and `cold-email-copy-best-practices.md` → Build the offer on the value equation.

## Offer Architecture (complete before writing Email 1) (pre-alignment lines 420 to 420)

> **Question 2: Easy-to-say-yes-to test.** Read the offer out loud. Would someone say yes to this on a busy Tuesday afternoon without needing to ask their boss? If yes, proceed. If no, either chunk UP (talk about results, not method, "we help [ICP] increase [outcome]" instead of naming your service category) or chunk DOWN (name a specific, concrete deliverable that is interesting on its own).

## Offer Architecture (complete before writing Email 1) (pre-alignment lines 422 to 422)

> **Question 3: What is the risk reversal?** Name exactly one: pay-on-results, money-back guarantee, no-commitment trial, free deliverable first, or conditional engagement (build it first, pay only if satisfied). If none apply, the offer is harder to say yes to than it needs to be. Do not proceed until one is identified and documented. Whatever you name must still pass the Confirmed Deliverable Gate above. Only promise what the operator can actually deliver after a positive reply.

## Step 1: Confirm Campaign Direction (pre-alignment lines 439 to 439)

>    - Direct match (same industry, similar company size, same geography): use with full metric if available.

## Step 1: Confirm Campaign Direction (pre-alignment lines 441 to 441)

>    - No match (available case studies are too different in industry or situation): if the angle does NOT need proof, omit the proof reference and let the personalized observation, competitive context, or offer carry the email, downgrading the CTA to a "conversation" or "in-body observation" deliverable category. But if the angle's credibility actually needs a named client, a case study, or an exact number you do not have, do NOT silently omit it. Apply the Proof-Asset Gate (see below): be blunt about the gap and collect the real proof from the client via the fill-in form before shipping hollow copy.

## Step 2: Confirm Subject Line And First-Line Strategy (pre-alignment lines 482 to 482)

> Use one of these strategy types when they fit the campaign:

## Step 2: Confirm Subject Line And First-Line Strategy (pre-alignment lines 484 to 488)

> - Research signal: uses a real observable trigger or account signal.
> - Whole-offer: makes the recipient self-select based on clear relevance.
> - AI-assisted context: uses a short AI-generated variable only when it adds non-obvious relevance.
> - Proof-led: starts from credible outcome evidence.
> - Resource-led: offers a useful artifact or finding with low friction.

## Step 3: Confirm Body Structure (pre-alignment lines 525 to 525)

> - follow-up angle rotation

## Step 3: Confirm Body Structure (pre-alignment lines 527 to 527)

> - whether to include a P.S. line

## Step 3: Confirm Body Structure (pre-alignment lines 541 to 542)

> - Proof: [proof]
> - Personalization: [variables to use]

## Step 3: Confirm Body Structure (pre-alignment lines 547 to 547)

> - P.S. line: [yes/no and purpose]

## Step 3: Confirm Body Structure (pre-alignment lines 550 to 552)

> - Email 1: [new thread, 2-to-4-word lowercase subject with exactly one merge token; 25-to-35-word Framework A body; specific free deliverable first; mandatory workload parenthetical; exactly one question; soft permission CTA last; A/B the offer / subject here]
> - Email 2: [SAME thread, follow-up. Switch the mechanism (a 3-minute video, a written teardown, or a real lead magnet) with its OWN ask, a different CTA sentence from Email 1; soft CTA, never a dead-end soft close]
> - Email 3 (small-TAM 3-step only): [SAME thread, follow-up. Double down on a DIFFERENT lever (the biggest benefit, or the risk reversal that got missed) with a DIFFERENT ask again; soft CTA, never a goodbye]

## Step 3: Confirm Body Structure (pre-alignment lines 554 to 554)

> - CTA rotation check: [the CTA sentences read side by side are all different, no two share a sentence or a mechanism (Hard Rule 21, CTA Hierarchy)]

## Step 4: Output Final Copy (pre-alignment lines 611 to 611)

> Same thread as Email 1 (no subject). Email 2 is the mechanism-switch follow-up.

## Step 4: Output Final Copy (pre-alignment lines 620 to 620)

> SAME thread as Email 1 (no subject), small-TAM 3-step only. The double-down follow-up: reinforce the biggest benefit or the risk reversal that got missed (Hard Rule 18).

## Step 4: Output Final Copy (pre-alignment lines 639 to 639)

> - [x] Email 1 ends with its only question, the approved soft permission close after the offer and workload parenthetical; follow-ups use their approved slot CTA.

## variants.yaml Requirement (pre-alignment lines 706 to 706)

> The literal `subject: "..."` shown above is the live rule for both template and pre-written paths. Email 1 uses one shared subject template for the whole campaign or offer-angle slice. It must contain 2 to 4 lowercase words and exactly one merge token. Do not generate per-contact subject columns. Email 2 and optional Email 3 inherit the thread and carry no subject.

## copy.md Requirement (pre-alignment lines 812 to 815)

> - [ ] Email 1 opens with an offer-led opener (leads with the offer); the A/B variant test rides Email 1
> - [ ] Offer passed the Offer Architecture gate before Email 1 (SQL/MQL, easy-yes test, named risk reversal)
> - [ ] Email 1 leads with the offer (offer-led opener), not a signal observation; personalization is first name plus company only (per-contact signal openers retired)
> - [ ] Shared-Asset Platitude Read run on the shared opener, offer body, proof, and CTA, and on every per-account trigger opener; any vendor-wallpaper or forced-hook asset revised; shared opener recorded as a hypothesis pending reply data, not a win

## copy.md Requirement (pre-alignment lines 817 to 817)

> - [ ] Line 1 is OFFER-LED and carries no signal (Hard Rule 19; the signal-first opener is retired 2026-07-17). Any slice-shared signal fact in the BODY (Hard Rule 38) passes the implication test (Signal-First Anti-Patterns): it states what the fact MEANS for the reader, never a description of what the sender saw, a compliment on the signal, the bare fact with no "so what", or flattery as a bridge into a pitch

## copy.md Requirement (pre-alignment lines 819 to 820)

> - [ ] Each follow-up moves the conversation (switch the mechanism or double down), never re-sends Email 1's pitch
> - [ ] The follow-ups (Email 2, Email 3) support Email 1 in the same thread and end with a SOFT CTA (a light re-offer or a forward-looking question) — never a dead-end soft close with nothing to answer, never a repeated hard ask, never a goodbye (Hard Rule 31)

## copy.md Requirement (pre-alignment lines 822 to 822)

> - [ ] Email 1 ends with its only question, a soft permission CTA after the named free deliverable and workload split; no statement-only `Just reply "Yes"...` CTA, `Want me to…`, `Want us to send…`, `Interested?`, or `Worth a look?`

## copy.md Requirement (pre-alignment lines 824 to 826)

> - [ ] Each follow-up offers a different mechanism or deliverable from Email 1 (switch or double-down), never a re-send
> - [ ] Every email ends with a CTA / next step — Email 1 the primary value-backed CTA, the follow-ups a soft CTA — no email left as a dead end
> - [ ] Email 1 signs off with the full signature ({full name} / {title} @ {company name} / {company location} / + phone as a 4th line when `sender_persona.phone` is set); the follow-ups (Email 2, Email 3) sign off with AT LEAST the first name — a follow-up sign-off is mandatory, never zero (an unsigned follow-up is a QA failure)

## copy.md Requirement (pre-alignment lines 828 to 829)

> - [ ] Every email formatted as short blocks (opener / pain / proof / offer+CTA, each its own block, pain never combined with the offer/CTA), not one dense paragraph
> - [ ] After the `{first_name},` greeting the next word is lowercase unless a proper noun (no `Name, Each ...` mid-sentence capital); in the pre-write path, checked inside each `email_*` column

## copy.md Requirement (pre-alignment lines 833 to 833)

> - [ ] At least one of: a point of view, spoken rhythm, or a 2-4 word honest framing token

## copy.md Requirement (pre-alignment lines 835 to 835)

> - [ ] Follow-up implies the prior touch without asking the reader to remember it (no "following up on my last")

## copy.md Requirement (pre-alignment lines 837 to 839)

> - [ ] Email 1 is 25 to 35 words, with 2 to 3 main-body sentences and exactly 1 question; any optional P.S. is declarative and included in the word count. The follow-ups are under 50 words. No padding or filler.
> - [ ] Pre-written path only: contacts with no relevant data got the fallback general copy in the same column (no blank rows)
> - [ ] Email 1's subject is a clean shared template on the step (2 to 4 words, lowercase, exactly 1 merge token, spam-checked); per-contact subject columns are retired; the follow-ups carry no subject
