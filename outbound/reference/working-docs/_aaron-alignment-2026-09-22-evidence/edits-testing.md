# Change log: group `testing`, FNNL port (Aaron process alignment, 2026-09-23)

Files edited (only these two, Edit tool only, not committed):
- `.claude/skills/experiment-design/SKILL.md` (ed)
- `.claude/skills/cold-email-weekly-rhythm/SKILL.md` (wr)

Archives (pre-made, untouched): `outbound/_archive/aaron-process-alignment-2026-09-23/experiment-design--pre-change.md`, `.../cold-email-weekly-rhythm--pre-change.md`. Both files were unmodified in git (clean) before the first edit, and their baseline counts matched `baseline.tsv`.

Method: diffed A-Sales archive vs `56ff4a2c` for both skills (plus `emailbison-reply-manager` and `emailbison-positive-reply-scoring`, whose reply cadence lands in wr), then found FNNL's own statement of each old rule and rewrote it in FNNL's wording. No A-Sales sentence was pasted: no EmailBison `variant: true` / `variant_from_step`, no `/emailbison-*` routes, no "pool capacity" or "pool-allocation request". Section numbers below are the shared rules' section 3 items and section 6 pins.

---

## experiment-design/SKILL.md

| New line | Change | Rule | FNNL old wording (archive line) |
|---|---|---|---|
| 59 | Type D "What stays fixed": each first-wave segment split evenly across the offers (every offer on every segment); the same Email 1 variant set in every arm | Reversal 2 (offer x segment matrix); 6g | 59 "the same broad list, split evenly and at random" |
| 61 | Type D "When to use": first wave = whole qualified TAM at full volume; pinned 6a formula verbatim with Apr 6 / May 4 sources; equal cells same day, no head start for the primary, only arms beyond the count queue; offer x segment matrix (Apr 6, Apr 13); per-segment formula for `offer.segments` (6a segment clause) | Reversal 2; 6a; per-buyer-type | 61 "runs the primary offer plus at least one arm" (supersession note kept) |
| 62 | Type D "How it is judged": read per Step 6; winner picked at matched cell counts; losers off only by DEAD and the winner pick; pinned 6k verbatim; no ratio cut with the 37% Poisson reason; Aaron Mar 9 no threshold; each buyer-type segment flips, picks and scales its own winner, never borrows another's | Reversal 4; 6k; section 4 (ratio rejected); per-buyer-type | 62 (no retirement rule stated; FNNL-only absence of "never retires it" here, but the rule lives in cs) |
| 70 | Generative Proposal Mode input: the catalog now reads under "the Collection Scope rule in `/data-point-discovery`" (conditional collection); tests come from columns actually collected plus `in_reserve` points collected when an approved test needs them. Supersedes "the full obtainable signal set is collected up front" | Reversal 5; 6h | 70 (FNNL sweep item: A-Sales still carries this line unchanged at 56ff4a2c) |
| 77 | Offer queue: queued arms = beyond the first wave's offer count; parked-unresolved arms added; then positioning of the winner, then CTA, subject lines last | Reversal 4 (parked read returns); phase order 10 | 77 "every queued or still-reading arm" |
| 124 | Sub-1% baseline routes "straight to" a new offer test (flights now only for arms beyond the count) | Reversal 2 | 124 "routes to the next offer flight" |
| 130 | Near-floor slice: read only once it reaches its sample minimum (Step 6); "The sample, not the calendar, is what takes time." (A-Sales's "at today's pool capacity" not ported) | Reversal 7; 6i | 130 "the 21-day run" |
| 155 | Success-criteria template: "read per Step 6 (floor met, then the sequence plus grace)" | Reversal 7 | 155 "reported after day 21 of sequence" |
| 162, 164 | Step 5 heading "Launch every arm simultaneously" (three or more offers now); send days "same Monday-to-Friday send days" | Reversal 2 (>=3 arms); send Monday to Friday | 162 "Launch both arms", 164 (FNNL-only tidy) |
| 166-168 | Step 5 split by arm type, platform-neutral: offer and list arms = one campaign per arm, senders split through the inbox manager for the locked platform if a pack provides one, else the platform's own sender settings; positioning and copy variants = the platform's in-campaign variants, one variable each, pinned 6g sentence verbatim; if the platform has no in-campaign variants, say so and run one campaign per variant. Supersedes "create two campaigns" as the only setup | 6g; audit-strategy row 15 | 166 "Best practice on most sending platforms: create two campaigns ..." |
| 170-172 | Step 6 heading + rule: pinned 6i verbatim; floor = pooled-flip minimum for offer arms, and for a copy/list test whose Step 3 minimum exceeds ~1,300 that higher minimum; two emails default (6j), third adds its delay; the floor not the window takes time when the fleet runs below the one-week pace (`run_state.capacity_request`); read daily in the first week for bounce, deliverability and reply handling only | Reversal 7; 6i; 6j | 168 "Measure at day 21", 170 "Wait until the full sequence (one thread of 2 to 3 steps ...)" |
| 222 | "What NOT to experiment on": the offer test runs as offer-only arms across every first-wave segment of the whole qualified TAM; identical Email 1 variant set never competes with the offer read | Reversal 2; 6g | 220 "offer-only arms on the same broad list" |
| 224 | Replaced the coverage-wave paragraph: positioning tests of the winner start at the winner pick, inside the big campaigns, as in-campaign Email 1 variants; losing variants off only by DEAD on the variant's own count or the pick of a winning variant (Step 8) at matched counts, never a ratio; signal-test slices (the bounded allocation after the offer is proven) are where copy stays frozen. Supersedes "reserve ... for Wave 2+" | Phase order 10; reversal 4 | 222 "Coverage waves are not controlled experiments ... Reserve ... for Wave 2+" |
| 231 | "In parallel from launch": first wave = offer x segment matrix (lookalike core, widened rows, sold-to splits, a split across two or three data sources with disjoint rows tagged `source_arm`) | Reversal 2; Lists (`source_arm`, not `source`) | 229 "The coverage wave's list-only slices and the sold-to splits are this lever" |
| 235 | Sequence length rung: 6j (two by default, third only in a small market under ~3,000 qualified contacts, a house threshold, or as this tested arm) | 6j | 233 "2 steps vs 3, within the single-thread 2-to-3-step rule" |
| 242-245 | Common mistakes: in-campaign variants are the default for positioning/copy, offer arms stay separate campaigns (supersedes "use TWO campaigns for real isolation"); three variants fine, three variables in one variant not; "Calling it early" points to Step 6; new bullet "Cutting an arm on a ratio at the floor" | 6g; 6i; 6k; section 4 | 240-242 |
| 275 | Schema `arms:` comment: one entry per arm or variant; `email_1_a / email_1_b / email_1_c` | 6g | 272 |
| 283 | Schema `results:` "empty until the Step 6 read" | Reversal 7 | 280 "empty until day 21" |
| 291 | Schema adds `parked: []` | Reversal 4 | (absent) |
| 303 | What to do next: build per Step 5 (paused drafts, one campaign per offer or list arm, variants inside one campaign, one variation wired per declared Email 1 column) | 6g (upload wiring) | 299 |
| 305 | What to do next: read per Step 6; first-week daily reads for bounce/deliverability/reply handling only | Reversal 7 | 301 "Then wait 21 days ... After 21 days" |

**Deliberately unchanged (ed):**
- Frontmatter `description`: states the test order and no timing, variant or cut rule. Not touched (keeps YAML risk at zero).
- Step 3 sample table, "2,000 sends per arm" default, table-assumption note, 1% baseline rule: real minimum samples, kept.
- Step 8 lift thresholds (>=20% / 10-20% / <10%): result-adoption thresholds for a controlled test, not arm kills.
- Step 7 report template "Type: List-only | Copy-only | Combined" still lacks Offer-only: pre-existing gap A-Sales also left; not in the spec.
- Line 303 "If you do not have 2,000+ leads per experiment arm ..." (offer arms ride HOLD): still true.
- The 3 remaining spaced em dashes (lines 67, 76, 314) sit on lines not otherwise touched.

**Absent in FNNL ed (logged, nothing imported):** no EmailBison variant-step wording (FNNL's Step 5 was generic "two campaigns"); no "Hard Rule 18 2 to 3 steps" beyond line 170 (rewritten); no Tue/Thu send rule.

---

## cold-email-weekly-rhythm/SKILL.md

| New line | Change | Rule | FNNL old wording (archive line) |
|---|---|---|---|
| 41 | Calendar: new row "interested-reply sweep (speed to lead, until the webhook receiver exists)", several times a day, Monday to Friday | Speed to lead (section 5); 6d closing note | (absent) |
| 42 | Calendar: new row "first-week daily read (after every launch)" | Phase order 9 (read daily for the first week) | (absent; FNNL-structural addition) |
| 43 | Calendar: Wednesday row renamed "positive-reply catch-up sweep" | Speed to lead | 41 |
| 81, 83, 85, 87, 95, 97, 104, 112 | Step labels 1 to 7 and 3b: spaced em dash to colon (house style; Step 3b interior dashes left, Step 3's interior dash also replaced) | House style / dash rule | 79-110 |
| 83 | Step 2 rewritten: reply read conditional on the locked platform (pack reply scorer if active, else the platform's own export and master inbox classified with `reply-scoring-core.md`, else fail loud); every unanswered positive listed (all three classes, time-agreed first, minutes since arrival), never a top-N cut; `meeting_book_rate` as `reply-scoring-core.md` defines it, bookings from the client's booking calendar or CRM when readable, else operator-reported, say which, else "not measured" (never thread-inferred); it never picks arms; speed-to-lead latency audit (time to first human reply, time to first call on direct/trial/service offers, against the 5-minute target, every miss listed; checks the path, is not the path); Step 2 is the weekly catch-up, an untouched interested reply is a miss | 6e; reply cadence (section 7 testing row); section 5 speed to lead | 81 "Run the reply scorer the stack contract names ..." |
| 95 | Step 4 verdict: "propose a domain purchase for the operator's approval"; first wave and winner scale-up never trimmed to this verdict, runway stretches | Reversal 3; FNNL CLAUDE.md (infra needs operator approval) | 93 "start a domain purchase" (FNNL sweep item) |
| 99 | Gate B: maturity = >=300 first-touch sends (raw-reply floor, kept) AND sequence plus grace (~7 to 10 days from the 300th contact's first touch), supersedes "live >=21 days"; thin portfolio default = more volume on the current winner and its positioning variants (rest of its TAM rows, then lookalike expansion via `/tam-build`) before a new signal slice (Aaron, Feb 23), supersedes "just propose the next new signal slice"; with no winner yet, keep the offer test sending toward its floor | Reversal 7; phase order 10; audit-strategy row 18 | 97 |
| 101 | Offer-Validation Wave read: offer x segment matrix; read timing = pinned 6i verbatim (+ pointer to ed Step 6); first-week daily reads for bounce/deliverability/replies only; `meeting_book_rate` beside time-agreed; winner at matched cell counts; losers off by DEAD and the winner-pick retirement (pinned 6k, with "(in `offer.validation_arms[].read`)" inserted); no ratio cut; per-buyer-type segments read, pick and retire on their own, never borrow another's winner | Reversals 4, 7; 6i; 6k; 6e; per-buyer-type | 99 "deactivate a dead arm ... propose as winner" |
| 102 | Reversal 1: the winner scales at once; `/offer-test-slate` scale-review runs alongside, never ahead: results report plus `offer.qualification` review; client capacity answer sets how many qualified yeses get the free unit per week, the rest get the standard offer; carve-out for a client-supplied deliverable; per-segment results report (`offer.segments[].scale_review`); every-arm-off still reports and routes to Diagnose-offer; Start next offer flight only for arms beyond `max(3, floor(qualified_contacts / 2000))` (per segment) and parked arms brought back. Supersedes the scale review as a volume gate and the coverage wave sized to the client's answer | Reversal 1 with carve-out; 6a; reversal 4; per-buyer-type | 100 "run /offer-test-slate in scale-review mode before the coverage wave scales ... sized to that answer" |
| 106 | Start next offer flight: the first wave already covers the whole TAM, so flights exist only for arms beyond the count, parked arms brought back, and later positioning tests | Reversal 2 | 104 |
| 107 | Scale: the offer-test winner scales through the Step 5 retirement with positioning variants as in-campaign Email 1 variants; a winning signal slice uses the Scale sub-routine | Reversal 1; phase order 10 | 105 "Scale runs the Scale sub-routine below" |
| 123 | Capacity verdict: headroom gate applies to new signal slices only; first wave and winner scale-up never trimmed; pinned 6b prose rule verbatim with days to cover in Monday-to-Friday sending days against `run_state.capacity_request` (`daily_sends_needed` vs `allocated_daily_sends`); shortfall goes to the operator as a capacity request: size the fleet to the request through `/mailbox-mix-strategy` or assign a ready pre-warmed group from `/mailbox-pool-staging`; any mailbox purchase needs the operator's approval of the setup total, outside the $100 run budget; "propose a domain purchase cycle" for approval | Reversal 3; 6b; section 5 infra model | 121 "the same capacity-trim logic ... and the 21-day run ... start a domain purchase cycle" |
| 127 | Cross-campaign diagnosis: positioning variants of the winner, when running, are the same set in every big campaign (keeps the common-factor inference); dash replaced | Phase order 10 consistency | 125 |
| 134 | Offer rung: never flag the offer below 300 sends per campaign (raw-reply floor); never call an offer arm dead here, that is the pooled flip at ~1,300+; supersedes "300 sends is enough to call an offer broken" | Offer research (~1,300 per arm) | 132 |
| 140 | Scale sub-routine scoped to winning signal slices; the offer-test winner scales via the Step 5 retirement; dash replaced | Reversal 1 | 138 |
| 147 | No-headroom Scale: surfaces a capacity request (`run_state.capacity_request`) and a domain-purchase recommendation for the operator's approval of the setup total | Reversal 3; section 5 | 145 |
| 154 | Digest "Replies to handle": every unanswered positive (no top-N), speed-to-lead mode (webhook or sweep; sweep until the receiver exists, 5-minute call a target), latency audit, misses | Reply cadence; 6d note | 152 |
| 156 | Digest "Offer read": by segment (matrix), `meeting_book_rate` with its source, parked arms | 6e; reversal 4 | 154 |
| 157 | Digest "Capacity": adds days to cover and any capacity request | 6b | 155 (FNNL-only addition) |
| 164-165 | portfolio-review template: unanswered positives, speed-to-lead mode, median first human reply, calls within 5 min, misses; `meeting_book_rate` with source; per arm and segment; parked arms | Reply cadence; 6e | 162-163 |
| 176-187 | NEW section "Every send day: speed to lead on interested replies" (platform-neutral reply-manager cadence): owner read from `run_state.speed_to_lead_owner` and the `Speed-to-lead owner:` line of `interested-reply.md` (Gate D), missing owner = Gate D breach routed to the operator; 5-minute target; 6l reply by offer type (two times plus calendar and a call from `## Call Script` for direct/trial/service; `offer.qualification` form for costly front ends; asset delivered first, no times, R03; R20 house reading; no blanket booking link); phone from the replier's own signature/reply first, then the contact-enrichment slot's phone reveal where the contract declares one, one lookup per replier inside the run budget (no tool named); target mechanism = the locked platform's interested-reply webhook where it offers one; today = no receiver, sweep several times a day Monday to Friday, target not mechanism, digest says sweep mode; sweep runs through a pack's inbox manager if active, else the platform's own master inbox, else by hand with the gap stated; each sweep lists every unanswered positive with the matching template, human sends; meetings booked kept current (calendar/CRM or operator-reported, say which); Wednesday and Step 2 are catch-up. Supersedes "the Wednesday sweep is the system" | Section 5 speed to lead; 6d closing note; 6e; 6l; reply cadence | 326-328 (What to skip) held the old rule |
| 215-217 | Wednesday heading "positive-reply catch-up sweep" + one-line statement it is the catch-up | Speed to lead | 198 |
| 227 | Wednesday: conditional fallback when no pack provides a reply scorer (platform's own export classified with `reply-scoring-core.md`, else say so) | FNNL CLAUDE.md conditional pattern | (absent; FNNL-only) |
| 237 | Wednesday action: untouched positive handled now as in real time and logged as a miss with how long it waited | Speed to lead | 216 "Respond ... within 30 seconds ... converts 3x" |
| 240 | Wednesday action: update meetings booked from calendar/CRM, or operator-reported, say which | 6e; section 5 | (absent) |
| 242 | Time management: >50 positives/week hands off to a closer/AE or setter whom the operator names as speed-to-lead owner (`run_state.speed_to_lead_owner`, `Speed-to-lead owner:` line) | 6d item 4 | 220 "Do that handoff Wednesday morning" |
| 248 | Friday trigger: "became readable this week" = past the sample floor (~300 raw-reply, or ed minimum) with sequence plus grace; never read early; offer arms judged only in Step 5. Supersedes the fixed 21-day mark | Reversal 7 | 226 |
| 257 | Friday "Loser (<50% of baseline)" kept but gated on ~8 expected positives (A-Sales's change, rewritten in FNNL's voice): "kill" becomes "switch off (no new first touches, live sequences finish)"; Poisson reasons (37% / 16% / 4%, verified: P(k<=2|3.25)=0.370); labelled house arithmetic, operator-tunable; never applies to offer arms | Reversal 4 spirit; section 4 (no new ratio cut) | 235 |
| 260 | Friday log adds `meeting_book_rate` (as `reply-scoring-core.md` defines it, with its source) | 6e | 238 |
| 312 | Monthly TAM refresh: "the Collection Scope rule in `/data-point-discovery`" (conditional collection), supersedes the Collection Completeness rule; label dash to colon | Reversal 5; 6h | 290 |
| 332-333 | Quarterly: `meeting_book_rate` vs Aaron's self-reported ~25% / aiming 30% (Sep 21), low rate with healthy positives = reply-machine gap; parked arms worth bringing back | 6e; reversal 4 | (absent) |
| 350 | What to skip: daily stat checks skipped only after a launch's first week; first-week daily read for bounce/deliverability/replies, no arm call before the floor | Phase order 9 | 326 "Check the sending platform every day (Wednesday sweep catches everything important)" |
| 352-353 | Removed "the Wednesday sweep is the system" bullet; added the real-time exception line with supersession note | Speed to lead | 328 |
| 363 | What to do next: "skip this skill until launch day; the speed-to-lead sweep and the first-week daily read start with the first send" | Phase order 9; speed to lead | 338 "Come back after your first campaign hits the 7-day mark" (FNNL sweep item; A-Sales left it) |
| 369-371 | Related skills: `reply-scoring-core.md` (canonical `meeting_book_rate`), `/lifecycle-copy` (`interested-reply.md`, `## Call Script`, owner line, `pre-call.md`), `/offer-test-slate` (scale-review alongside the scale-up) | Cross-reference | (absent) |

**Deliberately unchanged (wr):**
- Frontmatter `description`: lists the possible next moves, states no superseded rule. Its two spaced em dashes stay (line not otherwise touched).
- Step 3b catch-all maturity "~2–3 weeks (≥14–21 days) of actual sending" (line 89): a domain-maturity deliverability gate, exempt.
- The ~300-send raw-reply floor (Gate B, Friday, cross-campaign diagnosis, per-campaign `/offer-intelligence` trigger at line 136): kept for raw-reply readability, a different job from the ~1,300 offer flip.
- Scale sub-routine trigger (>=2x baseline, HIGH confidence, time-agreed not below baseline): unchanged; `meeting_book_rate` never picks or scales.
- "scale onto the rested rotation half" (lines 95, 123, 144) beside "never run both halves at once" (line 282): deliverability mechanics, exempt; flagged below.
- Monthly placement test "<80%" (line 304): inbox-placement threshold, correct in context.
- Line 50 "Optional automation" and line 60 still call it the "Wednesday positive-reply sweep" / "Wednesday reply sweep": accurate names for the weekly catch-up, left.
- Launch-new "offer + copy held constant" and Diagnose-offer's confound note: signal slices hold copy constant for attribution.

**Absent in FNNL wr (logged):** no Tue/Thu send rule (Monday to Friday added only where wr uses send days: calendar row 41, capacity days-to-cover 123, sweep cadence 184); no "top 10" list (it lives only in the parked Smartlead scorer, see below); no "shared pool" or pool-allocation wording (FNNL provisions per client; the capacity request routes to `/mailbox-mix-strategy` / `/mailbox-pool-staging`); `meeting_book_rate`, Gate D owner, and the latency audit were all absent and are new requirements written fresh.

---

## Checks (actual output after the last edit)

```
.claude/skills/experiment-design/SKILL.md dash=3 crlf=318 lines=318 bom= 2d 2d 2d   yaml ok
.claude/skills/cold-email-weekly-rhythm/SKILL.md dash=54 crlf=386 lines=386 bom= 2d 2d 2d   yaml ok
```
- Line endings: all-CRLF in both (318/318, 386/386), same as baseline (314/314, 358/358). No BOM (first bytes `2d 2d 2d`).
- Spaced dash count: ed 4 -> 3, wr 71 -> 54 (both below baseline). A diff of dash-bearing lines against the archives shows no newly introduced dash; the only "changed" dash lines are Step 3b, whose label dash was removed while its pre-existing interior dashes stay.
- YAML frontmatter: both parse (`name` and `description` load).
- No absolute paths; no brand names added (grep for EmailBison, A-Leads, DiscoLike, Deliverable.co, Inboxing, Spaceship, Clay, BlitzAPI, GetLeads, QuickEnrich, PlusVibe, Smartlead, AI Ark, Prospeo, MillionVerifier, Calendly, shared pool, pool-allocation: zero hits in either file).

## Grep sweep (section 10 list, case-insensitive), remaining hits

- ed:62 `never retires it`: inside the 6k supersession note. Correct.
- ed:168 and ed:275 `email_1_b`: beside `email_1_c` both times. Correct.
- ed:172 `21-day window`: inside the 6i supersession note. Correct.
- wr:89 `21 days` (≥14–21 days): catch-all domain maturity, deliverability, exempt.
- wr:99 `21 days` (in "supersedes 'live ≥21 days'"): supersession note.
- wr:101 `21-day window` and `never retires it`: supersession notes (6i, 6k).
- wr:123 `capacity trim`: inside the 6b supersession note ("supersedes the capacity trim at launch").
- wr:248 `21-day`: supersession note ("supersedes the fixed 21-day mark").
- wr:304 `80%`: inbox-placement red threshold, not a yield rule.
- wr:312 `Collection Completeness`: supersession note beside the Collection Scope reference.
- Zero hits: size the list to the offers, size the validation list, size the test list, 8,000 to 12,000, at least arm 1, primary plus at least one, not to scale, trim the wave, Signal collection is a MUST, varying only the first name, both required Email 1 variant columns, proposes times only when, Wait 21 days, Tue to Thu, Tue-to-Thu, Tuesday or Thursday, winning slice, raise the ceiling to cover full collection, shared pool, pool-allocation, top 10. Also zero for `day 21`.

Pinned-string check: 6a (ed:61, formula also in wr:102), 6b prose (wr:123, with a parenthetical after "report days to cover"), 6e (pointed to `reply-scoring-core.md` in wr:83, 186, 227, 260, 332, 369), 6g (ed:168 verbatim), 6h name "the Collection Scope rule in `/data-point-discovery`" (ed:70, wr:312), 6i (ed:172 verbatim, wr:101 verbatim plus a pointer), 6j (ed:172 default, ed:235 rung), 6k (ed:62 verbatim; wr:101 with "(in `offer.validation_arms[].read`)" inserted), 6l (wr:181). `run_state.capacity_request`, `run_state.speed_to_lead_owner`, `daily_sends_needed`, `allocated_daily_sends`, `offer.qualification`, `offer.segments[].scale_review`, `source_arm`, `meeting_book_rate`: names match section 6 / section 5.

## `_vendor-library` files holding the same old rules (NOT edited)

- `_vendor-library/skills/smartlead/positive-reply-scoring/SKILL.md`: :121 top 10 `positive_interested` list; :128 "at least 14 days"; :153 "within 30 seconds".
- `_vendor-library/skills/smartlead/smartlead-campaign-upload-public/SKILL.md:354`: "Wait 21 days, then run /positive-reply-scoring".
- `_vendor-library/skills/emailbison/emailbison-reply-manager/SKILL.md`: :54 "What time works for you?"; :116 "Attach a Calendly or booking link"; :190 "hand off to the user for calls".
- `_vendor-library/skills/emailbison/emailbison-positive-reply-scoring/SKILL.md:3`: "Use 14-21 days after an EmailBison campaign".

## Does not map / notes for the coordinator

1. **Friday "Loser (<50% of baseline)" (wr:257).** Section 4 rejects ratio-based arm cuts. This is a pre-existing campaign-vs-baseline cut (not arm-vs-leader), which A-Sales kept at 56ff4a2c but gated on ~8 expected positives. I ported that gate (it only makes the existing rule stricter and excludes offer arms). If the operator wants no baseline-ratio cut at all, delete the bullet's cut and let such campaigns ride Middling. Recommendation: keep as ported.
2. **Rotation halves (wr:95, 123, 144 vs 282).** "Scale onto the rested rotation half" sits awkwardly beside "never run both halves at once". Deliverability mechanics, exempt, not changed. Recommendation: route to the deliverability owner.
3. **Step 5 in-campaign variants (ed:168).** FNNL's approved sending platform may or may not expose in-campaign variants; the text now says "if the locked platform has no in-campaign variant feature, say so and run one campaign per variant". Nothing asserts the capability exists.

## Cross-file follow-ups (for other groups)

1. **strategy (`campaign-strategy`)**: FNNL cs:129 "once the sequence has had its ~21-day window to run", cs:170 "the ~21-day run", and cs:138 "another arm's win never retires it" must move to 6i / 6k. ed and wr now call it "the winner-pick retirement" and record parked arms in `offer.validation_arms[].read` (ed schema `parked: []`); please define a parked status (for example `status: parked`, `read.verdict: unresolved`) and say the pick is "at matched cell counts" in "Picking the winner". cs:123's coverage wave "sized ... within `offer.scale_review.confirmed_capacity_per_week`" must become reversal 1 with the carve-out (wr:102 now says so).
2. **replies (`reply-scoring-core.md`)**: wr points to it as the canonical `meeting_book_rate` definition in six places (wr:83, 186, 227, 260, 332, 369). It must carry pinned 6e, including "counting from the client's booking calendar or CRM, otherwise operator-reported, say which". wr treats "not measured" as the no-source outcome.
3. **replies (`lifecycle-copy`)**: wr reads `## Call Script`, the `Speed-to-lead owner:` header line with the 5-minute target, and category templates in `interested-reply.md`; wr's phone chain (replier's own signature first, then the contact-enrichment slot's phone reveal where declared) should match lifecycle-copy's.
4. **orchestration (`cold-email-kickoff`, `continue-client`)**: Gate D must write `run_state.speed_to_lead_owner` (wr reads it and treats a missing one on a live campaign as a Gate D breach). `run_state.capacity_request.days_to_cover_tam` should be counted in Monday-to-Friday sending days, as wr reports it.
5. **orchestration (`mailbox-mix-strategy`, `mailbox-pool-staging`)**: wr:123 routes a shortfall to "size the fleet to the request through `/mailbox-mix-strategy`, or assign a ready pre-warmed group from `/mailbox-pool-staging`". Keep those skills' wording compatible.
6. **offer (`offer-test-slate`)**: wr:102 treats scale-review as a results report plus `offer.qualification` review, run alongside, with the carve-out and per-segment `offer.segments[].scale_review` (its description already reads that way).
7. **offer (`offer-intelligence`)**: wr:136 still names the per-campaign validation trigger "one campaign sub-1% after 300 sends" (kept as a trigger to look); that skill should say 300 triggers a look and ~1,300 per arm is needed to call an offer broken.
8. **copy (`campaign-copywriting`, upload rules)**: ed now requires the same Email 1 variant set in every offer arm during the offer test, and one variation wired per declared Email 1 column at upload (ed:303); please state the identical-variant-set rule for offer arms.
9. **list-a (`data-point-discovery`)**: ed:70 and wr:312 reference "the Collection Scope rule in `/data-point-discovery`" and paraphrase it (firmographics, fit, offer-relevance fields, contacts and free fields always; a why-now or intent signal only when the offer or a live test needs it). Please confirm the heading lands as pinned 6h.

Nothing unfinished in the two owned files.
