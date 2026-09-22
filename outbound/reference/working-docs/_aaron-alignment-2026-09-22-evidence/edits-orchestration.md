# Change log: orchestration group, FNNL port (Aaron process alignment, 2026-09-23)

Sources read: FNNL `CLAUDE.md`; the spec `_AARON-PROCESS-ALIGNMENT-2026-09-22.md`; A-Sales `edits-orchestration.md` and `audit-orchestration.md`; the A-Sales diffs (pre-change archive vs commit 56ff4a2c) for `cold-email-kickoff`, `continue-client`, `autonomous-execution-policy`, `cold-email-flow-audit`, `mailbox-mix-strategy`, plus `locked-tech-stack.md` (process lines :14, :68, :73) and `emailbison-inbox-manager` (:16 "trim the wave"). `mailbox-pool-staging` has no A-Sales archive (A-Sales never changed it); its one rule was written fresh from shared-rules section 5.

Archives: all six files were already archived byte-identical by the coordinator in `outbound/_archive/aaron-process-alignment-2026-09-23/` (per `archive-map.tsv`). I created none and touched none.

All edits made with the Edit tool. No other group's file touched. Nothing committed. No sub-agents.

Every changed rule carries `(Aaron process alignment, operator directive 2026-09-22)` plus a `supersedes ...` clause where it replaces one. Pinned strings used verbatim: 6a (offer count), 6b (the `capacity_request` block and its prose rule), 6c (both forms), 6d (Gate D items 1 to 5 and the receiver sentence), 6g (Email 1 columns and upload wiring), 6h (Collection Scope reference), 6j (sequence length), 6k (winner-pick retirement). No A-Sales text pasted: A-Sales's "shared pool", "pool-allocation request", "never provisions per client", EmailBison and `/emailbison-*` routes were all rewritten into FNNL's capability-role and per-client-fleet form.

---

## 1. `.claude/skills/cold-email-kickoff/SKILL.md` (665 -> 718 lines)

| New line | Change | Rule (section 3) | FNNL old wording |
|---|---|---|---|
| 3 | Description: chain now "Runs the phases in Aaron's order", adds `/social-proof-bank` (5 to 10 offer-fit seeds), `/tam-build (lookalike TAM)`, `/campaign-strategy` (whole-TAM first wave, offers as equal cells, plus the capacity request the fleet is sized to), copy and the reply machine (Gate D) before Start; "picks the top-ranked campaign" became "selects the launch wave"; `/mailbox-mix-strategy` is "sized to the capacity request". Still one line, no ": ", YAML parses. | phase order; reversals 2, 3; Gate D | :3 |
| 24, 26 | First-Wave Default retitled "the whole TAM at full volume, with the offer test inside it". Whole qualified TAM at full volume; name Offer-Validation Wave kept; equal cells launched together, every offer across every first-wave segment, no head start for the primary; 6a formula verbatim plus the per-buyer-type sentence; 6j (2 emails, third under ~3,000 or as an arm); Monday to Friday (Tue to Thu only as a tested variant or tiny TAM); at most two per-contact variables. Framework A sentence kept word for word. Supersedes "prove the offer, not to scale" (2026-07-04). | reversal 2; 6a; 6j; Mon-Fri | :24-26 ("validate the offer before scaling ... Tue-to-Thu sending") |
| 28-41 | NEW section "Flow order: Aaron's phases": the ten phases from shared-rules section 3 mapped to FNNL's step numbers. Phase 6 names the FNNL capacity mechanics (fleet sized to the request at Step 6 via `/mailbox-mix-strategy` or a `/mailbox-pool-staging` group). Research phase says "on Claude Code only". | phase order | absent (new) |
| 59 | "What this skill produces": new bullet for `run_state.capacity_request` and the Gate D reply files. | 6b; 6d | absent |
| 100-104 | NEW `run_state.capacity_request` block, 6b verbatim (indented under `run_state`). | reversal 3; 6b | absent |
| 105 | NEW `run_state.speed_to_lead_owner` (operator-named; also the `Speed-to-lead owner:` header line in `interested-reply.md`). | 6d item 4 | absent |
| 111 | `tam_stage` comment uses the 6c long form; the spaced em dash in "(the old "complete" ... do not use it)" became a semicolon. | reversal 5; 6c | :89 ("full qualified universe enriched") |
| 138 | "The shape of the whole chain" now points at the Flow order. | phase order | :116 |
| 144 | Proof-Asset paragraph: a proof gap holds only the proof-led copy variant, never the slice or its volume. FNNL-only sweep (A-Sales kickoff had no such line change). | Proof decision | :122 (implied gate) |
| 222 | NEW resume row: strategy exists but no `capacity_request` -> Step 4. | reversal 3 | absent |
| 229 | NEW resume row: draft built but Gate D not passed -> Gate D (`/lifecycle-copy`, qualification rule, owner). | Gate D | absent |
| 230 | Offer-Validation Wave row: winner already goes to the rest of the TAM; scale-review mode writes the results report, never a hold. | reversal 1 | :206 |
| 240 | Step 2.5: dropped "the floors, the capacity trim and the flight schedule decide what runs first"; all first-wave offers launch together, only offers beyond the formula count queue; the fleet is sized to the request; per-buyer-type segments all launch, runway stretches, priority segments first in send order. | reversals 2, 3; per-buyer-type | :216 |
| 302 | Step 3: a Go-rated existing offer needs no new arms (segments, data sources, positioning variants; Aaron Apr 13); arms optional, operator request only. | Go offer, no new arms | :278 |
| 337 | Step 3B Go bullet rewritten to match. | same | :313 |
| 338, 339 | Step 3B Iterate: "rerun validation until it scores 6+/7" replaced by a market read, the iterated offer runs as a cell in a fresh multi-offer set side by side; Swap likewise runs as a fresh multi-offer set. FNNL sweep item: A-Sales's kickoff kept the 6+/7 line (an A-Sales miss), but section 3 "Offer research" retires it. | Offer research (desk loop -> market read) | :314-315 |
| 366 | Step 3.4 blockquote: seeds = the 5 to 10 companies that best fit the locked offer (case-study and customer companies first, topped up with researched exemplars; Aaron Jun 22); a no-proof group or new offer is seeded from exemplars, not a bare category filter; the broad filter (EXPANSION) is the last top-up after the widened lookalike. GO gate text untouched. One spaced em dash removed. | Seeds | :342 ("A group with no case study ... route it to this step's EXPANSION motion") |
| 368 | Step 3.4 discovery-motion sentence: lookalike from the 5 to 10 offer-fit seeds, the spine even for a no-proof offer; broad filter the last top-up. | Seeds | :344 |
| 374 | Email reveal deferred to `/email-waterfall` on the launch wave, which in the first wave is the whole eligible TAM; later waves per confirmed campaign. This carries A-Sales's `locked-tech-stack.md` :73 process line. One spaced em dash removed. | Lists (whole eligible TAM revealed) | :350 ("the live slice") |
| 380 | Spend gate: "complete, not tiered ... Collection Completeness HARD RULE ... recommends raising the ceiling" became conditional collection under "the Collection Scope rule in `/data-point-discovery`" (6h); always-collected fields listed; paid why-now or intent signal only when needed; over budget trim signals first, never companies or contacts; still stops to ask over the ceiling. One spaced em dash removed. | reversal 5; 6h | :356 |
| 400 | P1 to P5 set send order, never a hold; every tier goes out in the first wave. | Lists (P1-P5) | :376 (absent as a sentence; added) |
| 406 | Step 4: while unproven, `/campaign-strategy` designs the whole-TAM first wave (offer cells across every segment, optional disjoint data-source splits, the >=500-company floor per offer cell); once proven, the signal-slice portfolio. | reversal 2; floor per cell | :382 |
| 412 | NEW Step 4 "Capacity request" paragraph, FNNL form: written with the wave by `/campaign-strategy` (kickoff fills it if missing, same formula); `daily_sends_needed` becomes `/mailbox-mix-strategy`'s default daily send target, held inside FNNL's 2,000 to 30,000 band (floor below, ceiling above with a longer runway); the fleet (fresh or pool group) is sized to it at Step 6; logged PENDING, never blocks list or copy, not a purchase, mailbox purchase still needs the operator's approval of the setup total; 6b prose rule verbatim. Aaron Sep 21 cited without his per-domain numbers (FNNL per-mailbox rates stay FNNL's). | reversal 3; 6b | absent |
| 445 | Step 5: "maximal first-launch wave ... the final capacity trim is applied at Step 6" became the wave for the offer's state; neither trimmed; include the capacity request numbers and days to cover. | reversals 2, 3 | :419 |
| 463 | NEW Infrastructure Readiness checklist item "Capacity request ... Never a trim". | reversal 3 | absent |
| 464 | "Daily send target + sized fleet" item now takes the target from the capacity request's `daily_sends_needed`, held inside the band. | reversal 3 | :437 |
| 497-499 | Step 6.0 "Already handled elsewhere": what those senders deliver is recorded as `allocated_daily_sends` at the capacity check; less than the request stretches the runway. | reversal 3 | absent |
| 535 | High-volume paragraph: "default to the low end (~2,000/day), ratcheting up ..." replaced by the capacity request's pace held inside the band; a smaller approved setup total stretches the runway, never trims the wave. Also fixed the dangling "Fleet Sizing and." to "Fleet Sizing.". | reversal 3 | :506 |
| 537 | Pool-first paragraph: a ready group that delivers less than the request is still assigned and the whole wave launches on it; topping up is an infrastructure purchase the operator approves. | reversal 3 | absent |
| 580 | NEW "Capacity check: confirm the fleet against the request" under "If infrastructure is ready": read what the warmed active fleet delivers (active rotation half, `/mailbox-mix-strategy` rates) through the inbox manager for the locked platform if a pack provides one, otherwise that platform's own sender and warmup views; write `allocated_daily_sends`, recompute days to cover (Mon to Fri), never recompute `daily_sends_needed`; 6b prose rule; PENDING on a shortfall. A client with no warmed fleet yet (infrastructure deferred or still warming) is also PENDING with the reason, never BLOCKED: it never blocks list, copy or the paused draft, and Gate A owns the block at Start (FNNL CLAUDE.md section 1: an empty infra slot blocks only a purchase or Start). A-Sales's "BLOCKED only with zero healthy senders" was deliberately not ported, because in FNNL zero senders is the normal state of a new client. No new route to `/cold-email-inbox-tracker` added (that skill is not in FNNL's `.claude/skills/`). FNNL had no capacity-check step (A-Sales's :445-451 has no analogue), so this was written fresh. | reversal 3; 6b | absent (the trim lived at :553) |
| 582 | "If no launch campaign has been selected, apply execution_mode" line moved below the capacity check (unchanged text). | layout | :551 |
| 584-592 | Wave selection split by `offer_market_proven`: unproven = whole-TAM first wave with offer cells (per-segment flags for `offer.segments`); proven = maximal signal-slice wave with the >=500-company floor. Neither trimmed. P1 to P5 are send order, every tier goes out, reveal planned across the whole eligible TAM, stops only at the $100 budget line. auto_execute report reworded; review_gates: whole wave is the recommended default, subset or slice-first only on the operator's explicit request. | reversals 2, 3; Lists (P1-P5) | :553-556 ("Apply the capacity trim here. Reveal and verify P1 first ... Lower tiers stay queued") |
| 631 | Locked sequence: NEW step 6 `/lifecycle-copy` (Gate D files; gates Start, not the draft); spintax, upload, gates renumbered 7 to 9. | Gate D | :595-597 |
| 633 | Upload step: 6g (three Email 1 variants, one variation per declared Email 1 column, confirm N variations with an even split, stop rather than dropping Variant C); schedule Monday to Friday. | 6g; Mon-Fri | :596 |
| 640 | "three gates" -> "four gates". | Gate D | :603 |
| 648-656 | NEW Gate D: 6d items 1 to 5 verbatim, the receiver sentence verbatim, plus the FNNL alert-source sentence (the locked platform's interested-reply webhook where one exists; documented is not proven until a live call on FNNL's account) and the R20 house-reading line; routes a fail to `/lifecycle-copy`, `/lead-magnet-brainstorm`, the operator. | Gate D; 6d | absent |
| 658 | "Gates A, B, and C" -> "Gates A, B, C, and D". | Gate D | :611 |
| 662 | "Reply agents ... deploy the per-client reply-agent pack ... part of standard setup, not an optional extra" replaced: reply handling is on the flow through Gate D and the reply sweep (several times a day until the receiver exists, cadence in `/cold-email-weekly-rhythm`), through the platform's reply manager if a pack provides one, else its native inbox, else by hand; an auto-drafting agent is an optional extra, only where the contract names one and `/stack-setup` activated it, booking guidance identical to `interested-reply.md`, never reported live on its name. FNNL analogue of A-Sales's :572 change; FNNL asserted a pack that does not exist here. | Gate D; section 5 "nothing is live because it is named" | :615 |
| 668-675 | Step 8 rewritten: winner goes to the rest of the TAM immediately, no client scale-review gate; 6k winner-pick retirement verbatim; per-segment winners; results report plus `offer.qualification` review (`offer.scale_review`, per segment `offer.segments[].scale_review`), never holds or sizes sends; carve-out kept; positioning next (Aaron Apr 6), then CTA and delivery, subjects last; queued offers beyond the count to the next flight; all arms off = report plus new offer work. | reversals 1, 4; per-buyer-type | :621-623 |
| 699-702 | Related skills: `/lead-magnet-brainstorm` (optional arms beside a Go offer; owns `offer.qualification`), `/offer-test-slate` (results report after the winner scales), `/campaign-strategy` (whole-TAM wave, writes `capacity_request`), NEW `/lifecycle-copy`. | several | :647-649 |
| 709 | `/mailbox-mix-strategy` line: sizes the fleet to `run_state.capacity_request`. | reversal 3 | :656 |
| 715 | Reply-agent setup skill line: conditional, an optional extra on top of Gate D and the sweep. | Gate D; section 5 | :662 |

Deliberately left unchanged in kickoff:
- :22, :142 (now :164), :298 (now :322), :580 (`execution_mode` defaults disagree: `review_gates` default at Step 1 vs "auto_execute ... recommended default" elsewhere). Spec open item 4: flagged only.
- Step 3.4 TAM Phase A sample GO gate (now :382) and its resume row: rejected-on-purpose list (never remove or auto-approve).
- Step 3B "300+ sends" (now :333): evidence that an offer exists outside the form, not a verdict that it is broken, so the ~1,300 rule does not touch it.
- Step 3A auto_execute lock wording, Step 3.2 slate, Gates A to C, the $100 budget and its stop-and-ask, the mailbox-infrastructure setup-total approval, the Step 6.0 deferred-infra gate, the >=500-company floor, Framework A, operator presses Start.
- "Platform handoff" paragraph (now :660) still names reply-agent and "reply AI" as platform steps the contract may name: unchanged because it is already conditional ("the skills the stack contract names ... only those").
- **absent:** FNNL kickoff had no "wait 21 days" at upload and no "Capacity vs wave ... trim applied" checklist item; nothing to delete (a new checklist item was added instead, :463).

## 2. `.claude/skills/continue-client/SKILL.md` (199 -> 205 lines)

| New line | Change | Rule | FNNL old wording |
|---|---|---|---|
| 57 | "What this skill produces": pre-Start checklist includes reply readiness under Gate D. | Gate D | :57 |
| 100 | NEW Check 1 bullet "Capacity request": file it per kickoff Step 4 if missing, size the fleet to it (`/mailbox-mix-strategy` or a pool group) when infrastructure is still to build; fleet below request = report requested vs delivered and days to cover, PENDING, keep the whole wave; a client with no warmed fleet yet (infrastructure deferred or still warming) is also PENDING with the reason, never BLOCKED, and Gate A owns the block at Start. (FNNL has no Check 0b, the A-Sales home for this; Check 1's warmup/senders bullet is the nearest.) | reversal 3 | absent |
| 118, 120 | Chain shows `/campaign-strategy (+ run_state.capacity_request)` and `/lifecycle-copy (Gate D reply files)`; NEW line pointing the phases before and after at kickoff's Flow order. | phase order; Gate D | :117 |
| 141 | 6a: "Apply the capacity trim at upload time against the warmed-mailbox count" became never trim, build the whole wave, confirm the fleet per kickoff Step 6. Column list now `email_1_a` / `email_1_b` / `email_1_c` / `email_2` / optional `email_3` (three Email 1 variants by default), and "varying only the first name" became up to two per-contact variables already in the data (`sells_to_vertical`, `service_offered`, optional `own_best_client`) inside the offer sentence only, as the current `/campaign-copywriting` defines them (keeps this skill's no-hardcoded-standards rule by deferring). | reversal 3; 6f; 6g | :138 |
| 143 | 6b: draft build adds schedule (Monday to Friday) and one variation per declared Email 1 column (stop rather than drop Variant C, per kickoff Step 6). | 6g; Mon-Fri | :140 |
| 147 | 6d: winner goes to the rest of the TAM immediately; a missing `offer.scale_review` runs as results report and `offer.qualification` review, never a hold (carve-out by reference to kickoff Step 8); queued offers are those beyond the first-wave count; no queued arm waits for capacity that could be requested (file/update `capacity_request`, size the fleet to it). | reversals 1, 2, 3 | :144 |
| 149 | 6e: reply readiness = Gate D exactly as kickoff defines it; missing items are remaining chain (`/lifecycle-copy`, then owners); receiver gap stated (sweep several times a day, 5-minute call a target); the reply-agent pack demoted to an optional, conditional extra, never reported live on its name. | Gate D; section 5 | :146 |
| 161-163 | Pre-Start checklist: Live-Start gates A/B/C/D; NEW Reply readiness item (files, qualification, owner via header line and `run_state.speed_to_lead_owner`, 5-minute target, receiver gap; naming the owner is the operator's call); NEW Capacity request item (requested vs delivered, days to cover, never holds Start). | Gate D; reversal 3 | :158 |
| 180 | Hard stops: pre-launch safety gates include reply readiness under Gate D. | Gate D | :175 |
| 201, 202 | Related skills: `/mailbox-pool-staging` line adds `/mailbox-mix-strategy` sizing to the request; NEW `/lifecycle-copy` line (colon, not a dash, to keep the dash count). | Gate D; reversal 3 | :196 |

Left unchanged: :19, :101, :142 (now :145) historical illustrations of the retired "one offer with only the Email 1 opener varying" model (correct in context, A-Sales left the same); :27 "(the operator's default)" (execution_mode, flagged only); description.

## 3. `.claude/skills/autonomous-execution-policy/SKILL.md` (133 -> 135 lines)

| New line | Change | Rule | FNNL old wording |
|---|---|---|---|
| 29 | Offer bullet: first-wave offers sent together as equal cells; winner goes to the rest of the TAM immediately, no client scale-review gate; scale review = results report; carve-out where the client supplies the deliverable. FNNL's own list ("mailbox mix, billing period, sender persona, domain candidates") kept, since FNNL provisions per client. | reversals 1, 2 | :29 |
| 30 | NEW bullet: the whole-TAM first wave is the default; slice-first launch only on the operator's explicit request. | reversal 2 | absent |
| 31 | NEW bullet "Capacity is sized to the volume, never trimmed": the run files `capacity_request`; the fleet `/mailbox-mix-strategy` sizes or the pool group `/mailbox-pool-staging` assigns is sized to it, inside the setup total the operator approves (section 2); 6b prose rule. FNNL's own infra rules (setup-total approval, $100 never covers infra) untouched. | reversal 3; 6b | absent |
| 40 | Only the parenthetical: "the TAM GO gate's whole-universe-or-slice call" -> "the TAM GO gate, where the whole universe is the default and a slice-first launch happens only on the operator's explicit request". GO gate behaviour unchanged. | reversal 2 | :38 |
| 52 | "Gates A/B/C" -> "Gates A/B/C/D". | Gate D | :50 |
| 56 | Pre-launch safety gates add reply readiness under Gate D (blocks Start, never the paused draft; the drafting HARD RULE text is unchanged). | Gate D | :54 |

Left unchanged: section 2 ($100 budget, infra outside it, setup-total approval, older-profile rule, running total), all other hard stops, sections 4 to 9, and :8 "(the operator's default)" (execution_mode, flagged only).

## 4. `.claude/skills/cold-email-flow-audit/SKILL.md` (245 -> 246 lines)

| New line | Change | Rule | FNNL old wording |
|---|---|---|---|
| 27 | Delegation list adds `/lifecycle-copy`. | Gate D | :27 |
| 79 | Registry adds `/lifecycle-copy` and "its reply manager, if `/stack-setup` activated a pack that provides one" (conditional; FNNL has no `/emailbison-reply-manager`). | Gate D; CLAUDE.md conditional routing | :79 |
| 125 | D2 row (FNNL's letter; A-Sales's E2): the seed set (offer-fit seeds) must exist before F builds, per kickoff Flow order; the rest still runs parallel with F. Order-conformance, not a criterion. | Seeds; phase order | :125 |
| 126 | F row: `full_enriched` per 6c short form ("mapped, fit-scored and contacts discovered; signal columns optional"), as the group brief requires. Note: this is a criterion hint inside a method-only file; the row's existing parenthetical was already of that kind. | reversal 5; 6c | :126 |
| 128 | G row: removed the hardcoded "volume-first; an Offer-Validation Wave run in flights while `offer_market_proven` is false; [FL] floor". Now names the artifacts (`campaign-strategy.md`, `run_state.capacity_request`) and the governing sources (`/campaign-strategy`, kickoff Step 4), per the skill's own method-not-criteria rule. | reversal 2; audit row 15 | :128 |
| 150 | P4 row: Gates A to D; Gate D walked as its own stage, P6. | Gate D | :150 |
| 152 | NEW live stage P6 "Reply readiness (Gate D)": the reply files, `offer.qualification`, owner and target, and how interested replies reach the owner today; re-reads kickoff Gate D, `/lifecycle-copy`, the platform reply manager if a pack provides one; never `N/A` once a draft exists; judged from disk even when the sending platform cannot be read (FNNL has no EmailBison-key caveat paragraph, so that clause sits on the row). New letter per the stable-identifier rule. | Gate D | absent |
| 222 | Hard stops: pre-launch gates include reply readiness under Gate D. | Gate D | :221 |
| 245 | Related skills chain list adds `/lifecycle-copy`. | Gate D | :244 |

Left unchanged: :20 copy illustration (explicitly labelled an illustration as of 2026-09-18); :123 C2 row "(slate mode, client approval optional; scale review after the wave)" (still true: the results report follows the read; A-Sales left its analogue); :40 "(the operator's default)" (execution_mode, flagged only); description.

## 5. `.claude/skills/mailbox-mix-strategy/SKILL.md` (203 -> 204 lines)

| New line | Change | Rule | FNNL old wording |
|---|---|---|---|
| 62 | Inputs list item 6: `run_state.capacity_request`; its `daily_sends_needed` is the default daily send target. | reversal 3 | absent |
| 104 | "The operator picks a number inside that band. Default to the low end (~2,000/day) to start, then ratchet ..." replaced by "Size the default target to the list, not the list to the fleet": default `D` = `run_state.capacity_request.daily_sends_needed` (qualified contacts x steps / ~5 Monday-to-Friday sending days), held inside the band (floor below, ceiling above with a longer runway); computed from `campaign-strategy.md` lead volumes if no request exists; operator can override inside the band; Aaron Sep 21 and Mar 9 cited; warmup still gates when the fleet sends at target. Supersedes the 2026-07-07 low-end start. | reversal 3 | :103 |
| 106 | Bold lead "Capacity is the binding constraint." reframed to "Capacity sets the pace, never the wave." plus "a fleet smaller than D stretches the runway; it never cuts offers or TAM rows". The mechanics sentence and the two multipliers after it are untouched. | reversal 3 | :105 |
| 130 | "Under `review_gates` this is an operator decision" now names the recommended target (the request's one-week pace) and the smaller-buy alternative (band floor, longer runway), with the honest cost of the bigger first buy. No lettered prompt imported from A-Sales. The existing "hold rather than silently buying a smaller fleet" auto_execute clause kept (it already agrees with never-trim). | reversal 3 | :129 |
| 181 | Output schema `daily_send_target` comment: "start low" -> "the capacity request's one-week pace, held inside the high-volume band 2000-30000". | reversal 3 | :180 |

Left unchanged (deliverability mechanics, kept by the shared rules): ~15-20 sends per mailbox per day, the ~0.5 active-rotation fraction, the fleet-sizing formula, the worked-example table, reserve capacity, rounding rules, the Rotation Batch Split HARD RULE, the direct-start mix question, the description. Not added: a re-trigger for profiles whose `daily_send_target` was recorded under the old low-end default while a larger `capacity_request` exists (a new mechanic; `/cold-email-flow-audit` will surface it). Flagged below.

## 6. `.claude/skills/mailbox-pool-staging/SKILL.md` (232 lines, one line changed)

| New line | Change | Rule |
|---|---|---|
| 122 | Playbook step 2 "New client signs", appended: when the ready group cannot carry the pace of the client's capacity request (`daily_sends_needed`), the whole wave still launches on it; record what the group delivers as `allocated_daily_sends`, report days to cover, the runway stretches; the wave is never cut to fit the group; more capacity is another ready group or a fresh fleet sized by `/mailbox-mix-strategy`, within the setup total the operator approves. | reversal 3 (the one rule assigned) |

Left unchanged on purpose: the 21-day warmup ready gate at :3 (description), :115 (isolation rule 4) and :172 (deliverability mirror), the ~30/day caps, isolation rules, lifecycle, sheet contract, scripts.

---

## Checks (actual output after the last edit)

Byte-level check per the coordinator's correction (python: `count(b'\r\n')`, `count(b'\n')` on the file and its archive copy, BOM, lines carrying a spaced em or en dash, `yaml.safe_load` on the frontmatter):

```
cold-email-kickoff crlf 0 lf 718 (archive crlf 0 lf 665 ) bom False dashes 28 archive-dashes 32 yaml ok
continue-client crlf 0 lf 205 (archive crlf 0 lf 199 ) bom False dashes 60 archive-dashes 60 yaml ok
autonomous-execution-policy crlf 0 lf 135 (archive crlf 0 lf 133 ) bom False dashes 24 archive-dashes 24 yaml ok
cold-email-flow-audit crlf 0 lf 246 (archive crlf 0 lf 245 ) bom False dashes 60 archive-dashes 60 yaml ok
mailbox-mix-strategy crlf 0 lf 204 (archive crlf 0 lf 203 ) bom False dashes 0 archive-dashes 0 yaml ok
mailbox-pool-staging crlf 0 lf 232 (archive crlf 0 lf 232 ) bom False dashes 0 archive-dashes 0 yaml ok
```

- Line endings: all six files are LF, exactly like their archive copies (zero CRLF in both). An earlier pass with Git Bash `grep -c $'\r$'` reported "crlf = lines"; per the coordinator that count is unreliable, and the byte count above is the truth. **The perl CRLF fix was never run on any of my files.**
- BOM: none on any file.
- Spaced dashes vs archive: kickoff 28 (archive 32, four removed inside rewritten lines), continue-client 60/60, autonomous-execution-policy 24/24, flow-audit 60/60, mailbox-mix 0/0, pool-staging 0/0. None rose.
- YAML frontmatter: all six parse; the kickoff description gained no ": ".
- Flow-audit tables: every row of the artifact and live stage tables (incl. new P6) splits into exactly 3 cells.

## Grep (section 10 list, case-insensitive, all six files)

Zero hits: `size the list to the offers`, `size the validation list`, `size the test list`, `8,000 to 12,000`, `at least arm 1`, `primary plus at least one`, `Signal collection is a MUST`, `varying only the first name`, `both required Email 1 variant columns`, `proposes times only when`, `Wait 21 days`, `21-day window`, `Tue-to-Thu`, `Tuesday or Thursday`, `winning slice`, `raise the ceiling to cover full collection`, `80%`, `shared pool`, `pool-allocation`, `top 10`.

Remaining hits, each correct in context:
- `trim the wave`: continue-client :141 "Never trim the wave to the warmed-sender count", a negation of the old rule.
- `capacity trim`: kickoff :100 (6b block comment), :240, :412, :445, :580, :584; continue-client :100, :141; autonomous-execution-policy :31. Every one is a "supersedes the capacity trim" note. No live instruction to trim remains.
- `not to scale`: kickoff :26, inside the quoted supersession note.
- `never retires it`: kickoff :670, inside the 6k supersession clause.
- `Collection Completeness`: kickoff :380, inside the supersession note (the live reference is "the Collection Scope rule in `/data-point-discovery`", 6h).
- `Tue to Thu`: kickoff :26 and :633, both "Tue to Thu only as a tested variant or for a tiny TAM" (section 3 Mon-Fri rule).
- `email_1_b`: kickoff :633 and continue-client :141, both beside `email_1_c`.
- `21-day` / `21 days`: mailbox-pool-staging :3, :115, :172, the warmup ready gate (allowlist, section 8).

Extra sweep (`low end`, `start low`, `reply-agent pack`, `live slice`, `P1 first`, `as capacity opens`, `trimmed`, `confirmed_capacity`, `coverage wave`, `6+/7`, `complete, not tiered`, `recommends raising`, `Gates A/B/C` without D, `three gates`): only supersession notes and "never trimmed" negations remain.

Positive check on pinned names: `run_state.capacity_request` with `daily_sends_needed`, `days_to_cover_tam`, `requested_on`, `allocated_daily_sends`; `run_state.speed_to_lead_owner`; `offer.qualification`; `offer.segments[].offer_market_proven`, `offer.segments[].scale_review`; `email_1_a`, `email_1_b`, `email_1_c`; `sells_to_vertical`, `service_offered`, `own_best_client`; `## Call Script`, `## Confirmation Page`, `Speed-to-lead owner:`; "the Collection Scope rule in `/data-point-discovery`". All match section 6. Sibling files seen on disk agree: `/lifecycle-copy` carries `## Call Script` and the `Speed-to-lead owner:` header (:159, :169); `/data-point-discovery` carries the `## Collection Scope` heading (:54); `/campaign-strategy` and `/cold-email-weekly-rhythm` reference `run_state.capacity_request`.

## `_vendor-library` files holding the same old rules (not edited)

- `_vendor-library/skills/smartlead/smartlead-campaign-upload-public/SKILL.md:72`: "Gates A/B/C gate the live send only" (no Gate D).
- `_vendor-library/skills/smartlead/smartlead-reply-agent-setup/SKILL.md:126`: treats the reply-agent pack as standard coverage for every new client or campaign.

## Pre-existing issue noticed, not changed (outside this pass)

- `/cold-email-inbox-tracker` is referenced by kickoff (3 times), continue-client (2) and flow-audit (3), exactly as many times as in their archive copies, but no such skill exists in FNNL's `.claude/skills/`. That is a dangling route under FNNL CLAUDE.md section 1. I added no new reference and left the old ones alone (not an Aaron-alignment rule). Suggest a separate cleanup: make each reference conditional or drop it.

## Does not map (no change made; coordinator to ask the operator)

1. **Sending-platform AI reply agent vs the no-AI-API rule.** FNNL kickoff's "Platform handoff" line (:660) and the reply-agent setup skill references still allow a platform-native "reply AI" / auto-drafting agent. I demoted it to an optional, conditional extra and did not remove it. Recommendation: have the operator rule whether a sending platform's built-in AI reply drafting counts as a third-party AI call under CLAUDE.md section 7; if it does, strike the reply-agent references from kickoff :660 and :715 and continue-client :149.
2. **Stale `daily_send_target` on existing profiles.** A client whose `mailbox_mix_strategy.daily_send_target` was recorded under the old low-end default keeps it, because mailbox-mix only re-triggers fleet sizing when `mailbox_count` is missing. Recommendation: let `/cold-email-flow-audit` surface it per client rather than add a new re-trigger mechanic.

## Flagged only (spec open items, untouched)

- **Default `execution_mode` disagrees across files** (spec open item 4): kickoff Step 1 (:164) sets `review_gates` as the default and calls `auto_execute` opt-in only; kickoff :22, :322, :582, `/autonomous-execution-policy` :8, `/continue-client` :27 and `/cold-email-flow-audit` :40 call `auto_execute` the operator's default or the recommended default.
- **Offer-count formula vs the ~1,300 floor:** `max(3, floor(n/2000))` gives a 3,000-contact TAM three arms of ~1,000 each, under the ~1,300 read floor. Kickoff states the formula as pinned and leaves read mechanics to `/campaign-strategy` (which, in A-Sales, lets such an arm send but never be called DEAD).
- **Webhook receiver** does not exist (spec open item 3). Gate D reports it and never fails on it.

## Cross-file follow-ups (for other groups)

1. **strategy (`first-wave-eric-defaults.md`, `/campaign-strategy`):** kickoff First-Wave Default states the posture inline and points at `first-wave-eric-defaults.md` for the rest; kickoff Step 4 says `/campaign-strategy` computes `capacity_request` and kickoff fills it only if missing (same formula). On disk both already mention `capacity_request` (strategy :192, defaults :43), so this is a confirmation to re-check, not a known gap. Kickoff also says the >=500-company floor applies per offer cell and that HOLD arms are parked at the winner pick, with `/campaign-strategy` owning the mechanics.
2. **offer (`/offer-intelligence`, `/lead-magnet-brainstorm`, `/offer-test-slate`, `/social-proof-bank`):** kickoff Step 3B now says Iterate and Swap run as a fresh multi-offer set side by side and names `/offer-intelligence` validation mode and `/lead-magnet-brainstorm` as owners; kickoff routes a missing `offer.qualification` to `/lead-magnet-brainstorm`; kickoff and continue-client treat scale review as a results report recorded in `offer.scale_review` / `offer.segments[].scale_review`; kickoff states seeds as 5 to 10 offer-fit companies with an exemplar top-up. The on-disk descriptions of those skills already agree.
3. **replies (`/lifecycle-copy`):** Gate D items 1, 2 and 4 rely on the literal `## Call Script`, `## Confirmation Page` and `Speed-to-lead owner:` strings. Present on disk now; keep them literal.
4. **testing (`/cold-email-weekly-rhythm`):** kickoff says the reply sweep's cadence lives there ("several times a day until the webhook receiver exists") and that Step 8's queued offers move there (its Step 6). Confirm both.
5. **copy (upload wiring):** kickoff Step 6 item 8 and continue-client 6b state the 6g upload rule; FNNL's copy files own the column convention and the export gate.
6. **list-b (`/email-waterfall`, `/lead-scoring`):** kickoff Step 3.4 and Step 6 say the first wave reveals the whole eligible TAM in score order and stops only at the budget line; the email-waterfall description on disk already agrees.
