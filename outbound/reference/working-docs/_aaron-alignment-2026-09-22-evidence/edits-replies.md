# Change log: group `replies`, FNNL port of the Aaron process alignment (2026-09-23)

All five owned files were edited with the Edit tool only. Their pre-change copies were already in `outbound/_archive/aaron-process-alignment-2026-09-23/` (archive-map says `identical`); none was touched. Nothing was committed, no sub-agent was spawned, and no other group's file was edited.

Sources read: FNNL `CLAUDE.md`; the spec `_AARON-PROCESS-ALIGNMENT-2026-09-22.md` (all); A-Sales `edits-replies.md`, `audit-replies.md`, `aaron-audit-brief.md`; the A-Sales pre-change-vs-56ff4a2c diffs for `lifecycle-copy`, both DOCX skills, `reply-scoring-core.md`, `lifecycle_docx_presentation.ps1`, `emailbison-reply-manager` and `emailbison-positive-reply-scoring` (the last two have no FNNL twin; their process rules landed in `reply-scoring-core.md` and `lifecycle-copy` in platform-neutral form). FNNL facts checked: `stack-contract.yaml` (sending platform documents reply webhooks but `vendor_pack: null`; `contact_enrichment` reveals phones only "optionally"; `operations.crm` is `not_chosen`), `offer-intelligence` output sections (First-Party Buyer Voice, ICP Pain), `outbound/scripts/` (no webhook receiver exists).

Every changed rule is labelled `(Aaron process alignment, operator directive 2026-09-22)` with a `supersedes ...` clause where it replaces an old one.

---

## 1. `.claude/skills/lifecycle-copy/SKILL.md` (250 -> 326 lines)

| New line | Change | Spec item | FNNL's old wording (archive line) |
|---|---|---|---|
| 3 | Description rewritten: category templates plus call script, confirmation page plus FAQs, both files required before Start (Gate D), reply split by offer type. Spaced em dash removed. No `: ` inside, YAML parses. | 6d, reversal 6 | L3 ("Use after ... the campaign needs follow-up, positive-reply, or pre-call nurture copy") |
| 32-33 | When to use: both files required before every campaign's Start, written as soon as `variants.yaml` exists; orchestration enforces the gate; Aaron Sep 21 template quote. Re-engagement moved to a "later" bullet. Supersedes "only on request or once a positive reply exists". | 6d | L32 ("the user wants any of ...") |
| 41-43, 47 | Picker reordered: A interested-reply and B pre-call (both "required before Start"), C re-engagement (later), D Custom. A missing A or B is written without asking. | 6d | L40-42, L46 |
| 63-65 | Inputs added: offer type and `offer.qualification` (`criteria`, `form_fields`, `free_unit_cap_per_week`, written by `/lead-magnet-brainstorm`); `offer-intelligence.md` real objections (First-Party Buyer Voice first) for FAQs and objection templates; calendar or qualification-page link and the speed-to-lead owner from `run_state.speed_to_lead_owner`, copied with the 5-minute target onto the `Speed-to-lead owner:` header line; unknowns are Gate D gaps, never invented. | 6d items 3-5, qualification after the yes | absent (new requirement) |
| 69 | Verified-list gate: "written before Start but only ever sent after a reply or a booking" (was "post-reply / post-booking (a reply or booking already exists)", no longer true). Spaced em dash removed. | 6d consistency | L65 |
| 83 | New "Link and calendar rules: cold steps versus warm replies": cold bans (`cold-email-copy-best-practices.md` "Keep calendar links out of emails 1-3") govern cold steps only; `followups.yaml` is cold; warm files follow the reply rules (no link or times in an asset delivery; booking link on booking intent and on a direct, trial or service yes; call and confirmation-page links in `pre-call.md`). | 6l, spec Phase 6 last bullet | absent in this file (the bans live in the copy group's files) |
| 141 | Output 2 intro: "sent, and said on the phone", reads `## Call Script`, bodies in plain fences with no language tag and no other bold labels; explains the template's zero-width-space fences and that real files use plain backticks (the builder's `Trim() -eq '```'` does not strip U+200B). Spaced em dash removed. | 6d item 1 | L135 |
| 143 | "After the yes" header dated for both passes; the "surprise meeting, form ..." line narrowed to "a promised asset ... so a cheap asset stays ungated". | qualification after the yes | L137 |
| 145 | New "qualification step for costly front ends": disclosed (eligibility stated in the offer, step named in one clause), `form_fields`, free unit while `free_unit_cap_per_week` has room, no-fit gets the standard offer or `If they don't qualify:`, over-cap qualified yes gets the standard offer (labelled a house reading behind `/offer-test-slate`'s scale review, not Aaron), client-supplied deliverable carve-out. Supersedes the 2026-09-21 "any form after a yes is a surprise" reading. | qualification after the yes, reversal 1 carve-out | L137 (the "surprise ... form" clause) |
| 147-150 | New "Reply by offer type" lead-in ("no positive gets a blanket booking link"); asset bullet kept verbatim with "(Jul 13)" added; new direct, trial or service bullet: two specific times plus the calendar, no re-selling, Aaron Sep 21 quotes, qualification page as the calendar link where a rule applies. Supersedes the 2026-09-21 "times only when the prospect asks to talk". | reversal 6, 6l | L139-140 |
| 151 | "How this sits with Hard Rule 36" rewritten to the split; FNNL's "the reply-agent setup skill ... must follow" became "any reply agent or inbox manager for the locked sending platform must draft from this file's templates and follow the same split"; surface-the-mismatch safeguard kept. | reversal 6 | L140 (the one section-10 grep hit, `proposes times only when`) |
| 152 | Match-to-intent: adds the direct, trial or service yes; no-fit gets the standard offer where a rule applies; booking intent gets "two specific times". | 6l | L141 |
| 154 | Speed to lead: first reply pre-drafted from the category template; every interested reply on a direct, trial or service offer gets a call within ~5 minutes from the `## Call Script` by the speed-to-lead owner; chain summarized tool-neutrally and defined once in `reply-scoring-core.md`; receiver does not exist, so sweep several times a day and "target, not yet a mechanism"; R20 house reading kept and labelled not Aaron's; compliance is the operator's call. Supersedes FNNL's "drafts it live where the stack contract names one ... optional call-the-interested-replies escalation". | 6d item 5, speed to lead | L143 |
| 155 | Subsequence triggers on "positive, not yet booked"; a booking stops it; direct offer with no asset gets a curiosity-led booking reminder. Supersedes "no response to Email 1". | spec Phase 6 | L144 |
| 157 | New "Category templates" (minimum set; opt-outs get none). | 6d item 1 | absent (new) |
| 159 | New "The call script" spec (opener, two slots, disclosed ask, 2 or 3 prequalification questions from `offer.qualification.criteria` or the ICP, voicemail, text fallback through QA). | 6d item 1 | absent (new) |
| 166-231 | `interested-reply.md` template rebuilt: When to Use carries `Offer type:` / `Qualification rule:` and the pinned `Speed-to-lead owner:` line with the 5-minute target; `## Email 1: <yes reply for this offer type>`, `## Email 1: Booking intent`, `## Email 1: <next category>`; Email 2 trigger "Positive, not yet booked"; `## Call Script` block. All new inner fences use the file's ZWSP convention (18 ZWSP fences in the file now, was 10: +6 in this template, +2 for the pre-call `## Confirmation Page`). | 6d items 1, 4, 5 | L148-178 |
| 235 | Output 3 intro covers the confirmation page and `## Notes`; plain-fence contract. | 6d item 2 | L182 |
| 237 | New "job of the pre-call stage": pre-answer so the call is not a Q&A (Sep 21 quote); `## Confirmation Page` spec; FAQs only from real `/offer-intelligence` objections with sources in `## Notes`; hosting out of scope, `{{confirmation_page_link}}`. | 6d item 2 | absent (new) |
| 239 | Pre-call rules: each email pre-answers one question; the confirmation page counts as the one resource. | 6d item 2 | L184 |
| 247-293 | `pre-call.md` template: When to Use mentions the page; `{{confirmation_page_link}}` variable; `## Confirmation Page` block (Q/A FAQ) before the emails; new Email 1 and Email 2 purposes; `## Notes` with FAQ sources. | 6d item 2 | L192-223 |
| 298 | What to do next: one-line-per-item Gate D readiness report naming every open placeholder as a gap; the orchestration skills run the gate. | 6d | absent (new) |
| 314-318 | Related skills: FNNL's "reply-agent setup skill ... drafts the first reply live" became the conditional pack wording from FNNL CLAUDE.md (inbox manager or reply-agent setup skill for the locked `run_state.sending_platform` if `/stack-setup` activated a pack; otherwise the platform's own reply inbox; otherwise by hand); `/lead-magnet-brainstorm` also owns `offer.qualification`; added `/offer-intelligence`, `reply-scoring-core.md`, `/cold-email-kickoff` + `/continue-client` (Gate D). | 6d, section 5 | L241-242 |

Left unchanged on purpose: Output 1 (`followups.yaml`, its Aaron follow-up rules and its Mon-Fri `days: [1, 2, 3, 4, 5]` schedule), the asset delivery text, the R20 history and attribution note, the Copy QA Gate list, the Confirmed Deliverable Gate. Pre-existing L34 em dash and the Output 1 pre-write note's brand list ("Task sub-agents, Clay, RevCode, Claude Code", L97) were not touched (not in scope; the brands there are a pre-existing mention in an untouched line).

## 2. `.claude/skills/interested-replies-docx-presentation/SKILL.md` (116 -> 118)

| New line | Change | Spec item |
|---|---|---|
| 3 | Description: category templates, call script, "said on the 5-minute call". | 6d |
| 30 | Route back to `/lifecycle-copy` (the real producer; L46 already said so), not `/campaign-copywriting`. Pre-existing inconsistency, fixed as A-Sales did. | consistency |
| 32 | "Written before the campaign's Start (Gate D, reply readiness) but only ever sent after a positive reply". | 6d |
| 34 | "Warm copy is judged by the warm rules": cold bans apply to cold steps only; a calendar link or times in an asset delivery is a hard stop; two times plus a booking link on a direct, trial or service yes or booking intent must not be flagged; the spoken call script is exempt except its text fallback. | 6l |
| 58-62 | Output Shape adds `## Email 1: <category>` templates and `## Call Script` (after the sequence); parser sentence says how it renders, dated 2026-09-23 (FNNL's script date). | 6d item 1 |
| 102 | QA confirms the Call Script section. | 6d item 1 |
| 113 | Related skills: `/lifecycle-copy` added. | consistency |

## 3. `.claude/skills/pre-call-nurture-docx-presentation/SKILL.md` (117 -> 119)

| New line | Change | Spec item |
|---|---|---|
| 3 | Description: confirmation page and FAQs, "what the prospect sees at booking". | 6d item 2 |
| 30, 32 | Route back to `/lifecycle-copy`; written before Start, sent after a booking. | consistency, 6d |
| 34 | Warm rules: call link and confirmation-page link expected; "unsafe" means a pile of links or an FAQ with no researched objection. | 6l, 6d item 2 |
| 58-63 | Output Shape adds `## Confirmation Page` before the sequence and Notes as FAQ sources; parser sentence updated, dated 2026-09-23. | 6d item 2 |
| 103 | QA confirms the Confirmation Page section. | 6d item 2 |
| 114 | Related skills: `/lifecycle-copy` added. | consistency |

## 4. `outbound/reference/reply-scoring-core.md` (89 -> 126)

| New line | Change | Spec item | FNNL old wording |
|---|---|---|---|
| 3 | The file now owns the shared `meeting_book_rate` definition, the speed-to-lead chain and the unanswered-positives list with its latency audit. | 6e | L3 |
| 7 | Metric line: two meeting measures beside positive reply rate, `meeting_book_rate` and time-agreed replies per 1,000 first touches (`/experiment-design`, `/campaign-strategy` magnet-inflation guard), the latter still picking arms. | 6e, "keep time-agreed for picking arms" | L7 (FNNL's had **no** time-agreed clause, unlike A-Sales's: logged as absent, added as a pointer, not a new definition) |
| 9-22 | New "## Meeting book rate (shared definition)": pinned 6e sentence verbatim; formula block; numerator from the client's booking calendar or CRM when readable, otherwise the operator's reported count, saying which (FNNL: `crm` slot `not_chosen`, no calendar tool recorded, dated 2026-09-23); never from threads alone; "not measured" when neither exists; denominator labelled an assumption; benchmark (~25%, 22/83, ~20% by week end, aim 30%, Sep 21, self-reported); reply-machine measure, never picks an arm; a low rate with healthy positives is a reply-machine fix first. | 6e, section 5 speed-to-lead bullet | absent (new) |
| 76-77 | Router `positive_interested`: reply from the pre-built category template (Gate D), routed by intent and offer type, never a blanket booking link (asset delivery with no times; direct, trial or service yes or booking intent gets two times plus the calendar); ~5-minute call from `## Call Script`; qualification step where a rule applies; not booked -> subsequence; booked -> `pre-call.md`; missing file = Gate D breach. `positive_soft`: same route. Supersedes writing `interested-reply.md` only after a positive arrives. | 6d, 6l | L61-62 |
| 88-98 | New "## Speed to lead (shared chain)", platform-neutral: (1) the locked platform's interested/positive-reply webhook where offered (event names live in the contract's platform notes), plus its all-replies event; (2) pre-draft from the category template, a person edits and approves, in the inbox manager if a pack provides one, else the platform's own reply inbox; (3) phone from the replier's reply or signature first, then the contact-enrichment slot's phone reveal where the contract declares one (optional there), one lookup via `/api-cost-governance` inside the standing budget, and if no number, the two times carry the ask and the report says so; (4) the owner (`run_state.speed_to_lead_owner` / the header line) calls from the script; compliance is the operator's call; (5) asset requests follow the R20 house reading. Receiver does not exist: sweep several times a day during sending hours; "target, not yet a mechanism"; a documented webhook is not a working alert until a receiver has caught one. No tool named. | speed to lead, section 5 | absent (new) |
| 100-108 | New "## Every unanswered positive, and the response-latency audit": all three positive classes with no human reply, time-agreed first, never a top-N cut; latency from reply to first human reply and (direct/trial/service) to first call, median plus count inside 5 minutes plus every miss; positive-not-booked subsequence check; cadence owned by `/cold-email-weekly-rhythm` (daily in week one, then weekly); arm calls wait for `/experiment-design`'s read window. | unanswered list, latency audit | absent (the old "top 10" rule was never in this FNNL file) |

Left unchanged: L5 (the pack names Smartlead/EmailBison there are a pre-existing parenthetical example), the classification schema and prompt, the other router rows, suppression write-back.

## 5. `outbound/scripts/lifecycle_docx_presentation.ps1` (485 -> 548)

Ported A-Sales's change hunk for hunk; after the edit, `diff` against A-Sales's 56ff4a2c version shows only FNNL's three pre-existing lines (house-style header comments L12-13, BrandColor comment L18, Author L539). CRLF kept, still pure ASCII.
- L193 `Read-SequenceYaml` returns `Sections = @()` (followups unaffected).
- L211-224 new `Get-SectionParagraphs` (one paragraph per source line).
- L233 `$sections` list; L273-288 section mode for `## Call Script` / `## Confirmation Page` (checked before the generic `##` email branch, records `BeforeSequence`).
- L338-343 section mode keeps unfenced lines.
- L369 `Read-LifecycleMarkdown` returns `Sections`.
- L446-461 new `Add-SectionBlock` (heading, meta, line paragraphs, no "Subject:" stamp).
- L471, L476 default intros for interested-reply (covers the call) and pre-call (covers the confirmation page).
- L515-518, L526-529 sections render before the Sequence when they precede the first email, otherwise after it.

**Parse check:** `[Parser]::ParseFile(...)` error count printed `0`.

**Render test (ground truth, scratchpad only):** built `scratchpad/replies-docxtest/profiles/_rendertest/` and ran the script from that folder (never `outbound/profiles/`). Read paragraph text back from `word/document.xml`:
- `IR Test.docx`, 41 non-empty paragraphs: When To Use shows the `Speed-to-lead owner:` line; three `Email 1: <category>` blocks in order (Yes to the trial, Booking intent, Price question), then Email 2, then the `Call Script` heading after the sequence with all 6 script lines each on its own paragraph and no Subject line, Notes last.
- `PC Test.docx`, 29 paragraphs: `Confirmation Page` heading before `Sequence`, each FAQ `Q:` and `A:` on its own line, no Subject line; Email 1, Email 2, If They No-Show, Notes (FAQ sources) follow.
- `FU Test.docx` (regression), 16 paragraphs: `Email N - Day +N - Variant X` headers and "(threaded, no subject)" on empty subjects, as before.
- WINWORD processes before 0, after 0.
Not changed (pre-existing, cosmetic, out of scope): the `**Word count:**` meta line renders above the body; "(threaded, no subject)" stamped on subject-less email blocks.

---

## Checks (actual output)

Line endings / BOM / spaced dashes (`scratchpad/replies-check.sh`), baseline in brackets:
```
lifecycle-copy/SKILL.md                     lines=326 crlf=326 spaced_dash_lines=12 [15] first3=2d2d2d
pre-call-nurture-docx-presentation/SKILL.md lines=119 crlf=119 spaced_dash_lines=2  [2]  first3=2d2d2d
interested-replies-docx-presentation/SKILL.md lines=118 crlf=118 spaced_dash_lines=2 [2] first3=2d2d2d
outbound/reference/reply-scoring-core.md    lines=126 crlf=126 spaced_dash_lines=2  [2]  first3=232052
outbound/scripts/lifecycle_docx_presentation.ps1 lines=548 crlf=548 spaced_dash_lines=0 [0] first3=706172
```
All CRLF, no BOM, no dash count rose (lifecycle-copy fell 15 -> 12: L3, L69 and L141 lost theirs). `scratchpad/replies-verify.py` diffed every file against its archive: 0 added lines carry a spaced dash, a dash character, a double hyphen, a brand name (EmailBison, A-Leads, PlusVibe, AI Ark, Prospeo, MillionVerifier, Clay, Smartlead, Slack, Calendly and the rest) or an absolute path.

YAML frontmatter: `ok lifecycle-copy 920`, `ok pre-call-nurture-docx-presentation 368`, `ok interested-replies-docx-presentation 402`.

`git diff --stat`: 5 files, +231 / -51.

## Section-10 grep (case-insensitive, all five files)

Zero hits for every pattern: `size the list to the offers`, `size the validation list`, `size the test list`, `8,000 to 12,000`, `at least arm 1`, `primary plus at least one`, `never retires it`, `not to scale`, `trim the wave`, `capacity trim`, `Signal collection is a MUST`, `Collection Completeness`, `varying only the first name`, `both required Email 1 variant columns`, `proposes times only when` (the only pre-edit hit, lifecycle-copy L140, is gone), `Wait 21 days`, `21-day window`, `21 days`, `21-day`, `Tue to Thu`, `Tue-to-Thu`, `Tuesday or Thursday`, `winning slice`, `raise the ceiling to cover full collection`, `80%`, `shared pool`, `pool-allocation`, `top 10`, `email_1_b`.

Extra patterns, hits kept because they are correct in context: `surprise` (lifecycle L145) and `no response to Email 1` (L155) and `live-drafting reply agent ... optional escalation` (L154) are supersession notes; `optional subject lines` (interested-replies L62) is pre-existing parser wording; `phones are optional there` (reply-scoring-core L94) describes the contract slot.

Pinned strings used and checked: 6d (`## Call Script`, `## Confirmation Page`, `Speed-to-lead owner:`, `run_state.speed_to_lead_owner`, `offer.qualification`, the "does not exist yet ... target rather than a mechanism" gap wording in FNNL form), 6e (`meeting_book_rate` sentence verbatim in `reply-scoring-core.md` L13), 6l (reply by offer type). No other pinned string applies to these files.

## Absent in FNNL (logged, not imported)

- **"top 10" unanswered-positives cut** and **"at least 14 days" / "14-21 days" scoring wait**: never in FNNL's owned files (they live only in parked packs, below). The new every-unanswered-positive and latency-audit rules were written fresh in `reply-scoring-core.md` because the spec adds them.
- **Time-agreed clause in the reply-scoring-core metric line**: FNNL's file never had it; added as a pointer to `/experiment-design` and `/campaign-strategy`, not redefined.
- **EmailBison capability-truth lines** (A-Sales reply-manager and scoring): no FNNL twin; nothing to port.
- **A named reply manager skill**: FNNL has none active; its A-Sales rules (template pre-drafting, routing by offer type, speed-to-lead chain, full post-triage route) landed in `reply-scoring-core.md` and `lifecycle-copy`.

## `_vendor-library` files holding the same old rules (not edited)

- `_vendor-library/skills/emailbison/emailbison-reply-manager/SKILL.md` L54 (sample "What time works for you?"), L116 ("Attach a Calendly or booking link for interested replies"), L190 ("hand off to the user for calls").
- `_vendor-library/skills/emailbison/emailbison-positive-reply-scoring/SKILL.md` L3 ("Use 14-21 days after ...").
- `_vendor-library/skills/smartlead/positive-reply-scoring/SKILL.md` L121 (top 10 `positive_interested`), L128 ("at least 14 days").
- `_vendor-library/skills/smartlead/smartlead-reply-agent-setup/SKILL.md` L50 (speed to lead and "the kicker" framed as the pack's drafts) and L76 (Booker agent's first-reply rules), both predating the offer-type split.

## Does not map (needs an operator call)

None. (Considered and settled: FNNL's reply-agent auto-send opt-in in `/continue-client` 6e and `/cold-email-kickoff` L615/L662 versus a person editing every reply. The shared rules' "Kept unchanged" list includes "human approval of every send", which settles it in favour of `reply-scoring-core.md` L93 "A person edits and approves it before it sends". FNNL has no pack for its platform today, `vendor_pack: null`, so nothing auto-sends now. The stale lines are routed to the orchestration group in follow-up 2.)

## Cross-file follow-ups (other groups' files)

1. **Offer group (`/lead-magnet-brainstorm`):** write `offer.qualification` with exactly `criteria`, `form_fields`, `free_unit_cap_per_week` (lifecycle-copy L63, L145, L159, L222 read those keys). Optional: `/offer-intelligence` could add an explicit "Objections for the confirmation page" hand-off; today lifecycle-copy reads First-Party Buyer Voice then public pain.
2. **Orchestration group (`/cold-email-kickoff`, `/continue-client`):** declare `run_state.speed_to_lead_owner` and run Gate D per 6d, pointing at `/lifecycle-copy` for the two files. Kickoff L613 "reply-agent ... skills the stack contract names" / L615 "deploy the per-client reply-agent pack" / L662, and continue-client 6e "reply-agent pack" ("instant, on-brand" replies, auto-send opt-in per the pack's hybrid policy): re-point at `interested-reply.md` category templates and Gate D, and drop the auto-send opt-in, because the shared rules keep "human approval of every send" unchanged (a person edits and approves each pre-drafted reply, `reply-scoring-core.md` L93).
3. **Testing group (`/cold-email-weekly-rhythm`):** Step 2 (L81) and the Wednesday/Friday reply tasks (L203-230, L343) should run `reply-scoring-core.md`'s every-unanswered-positive list, latency audit and `meeting_book_rate` (point to its definition, do not restate it), daily in a campaign's first week, and read the owner from the `Speed-to-lead owner:` line or `run_state.speed_to_lead_owner`. `reply-scoring-core.md` L108 already names weekly-rhythm as the cadence owner.
4. **Copy group:** `campaign-copywriting` L197 still says "Booking intent: propose times" and places "the optional warm call on interested replies" in the reply-agent setup skill; the call is no longer optional on direct, trial or service offers and the chain now lives in `/lifecycle-copy` and `reply-scoring-core.md`. Hard Rule 36 (L181-195) and `cold-email-copy-best-practices.md` L55, L227, L385 need the offer-type split and the cold-steps-only scoping; lifecycle-copy L151 keeps its surface-the-mismatch safeguard until they land.
5. **Nobody's file (open item):** the always-on webhook receiver for the locked platform's reply webhooks does not exist in FNNL; until it is built and proven on a real reply, the 5-minute call is a target. Calling and texting compliance by jurisdiction is an operator decision no file rules on.

## Unfinished

Nothing in scope is unfinished. The render test ran on Word COM and passed; the parser check printed 0.
