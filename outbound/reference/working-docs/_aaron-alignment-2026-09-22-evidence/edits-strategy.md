# Change log: group `strategy`, FNNL port (Aaron process alignment, 2026-09-23)

Sources read: FNNL `CLAUDE.md`; A-Sales spec `_AARON-PROCESS-ALIGNMENT-2026-09-22.md`; A-Sales `edits-strategy.md`; the A-Sales diffs `campaign-strategy--pre-change.md` vs `56ff4a2c` (38 hunks) and `first-wave-eric-defaults--pre-change.md` vs `56ff4a2c` (16 hunks); the FNNL spec copy `outbound/reference/working-docs/_AARON-PROCESS-ALIGNMENT-2026-09-22.md` (Phase 4/7/8 checked, consistent). Every A-Sales hunk was walked, mapped to FNNL's own statement of the old rule, and rewritten in FNNL wording. No A-Sales text pasted except the section 6 pinned strings.

Archives: already in place, untouched (sha256 matches `baseline.tsv`):
- `outbound/_archive/aaron-process-alignment-2026-09-23/campaign-strategy--pre-change.md` (c55983df...)
- `outbound/_archive/aaron-process-alignment-2026-09-23/first-wave-eric-defaults--pre-change.md` (872395ee...)

---

## File 1: `.claude/skills/campaign-strategy/SKILL.md` (769 -> 796 lines; +74 / -47)

New line numbers.

| Line | Change | Rule (section 3) | FNNL old wording was at |
|---|---|---|---|
| 3 | Description: `full_enriched` short form (6c) added to the gate; Offer-Validation Wave clause rewritten (whole qualified TAM at full volume, 6a formula, equal cells launched together, every offer across every first-wave segment, offer x segment matrix, winner takes the rest of the TAM with positioning variants, signal slices wait for a proven offer); capacity sentence in FNNL form (sets the fleet `/mailbox-mix-strategy` sizes or the pool group `/mailbox-pool-staging` assigns; never trimmed; a smaller fleet stretches the runway). No `": "` added; PyYAML ok. | Reversals 2, 3; 6a, 6b, 6c | 3 |
| 36 | P1 to P5 = send order, never a hold; every eligible contact goes out in the first wave. | Lists | 36 |
| 96 | `[FL]` is an eligibility flag, not a launch order (sold-to cuts are first-wave segments; signal slices ride as tagged buckets until the offer is proven). One spaced em dash removed. | Reversal 2 | 96 |
| 97 | Layer-2 reveal: in the first wave the confirmed slice is the whole eligible TAM; a reveal over `run_state.spend_ceiling_usd` (the standing $100 run budget) still stops and asks. | Lists (whole eligible TAM reveal); $100 kept | 97 |
| 103, 105 | Section renamed "Launch waves: the whole TAM at full volume, with the offer test inside it"; intro sequences what is tested, not volume (supersedes the "not to scale" reading of the 2026-07-04 HARD RULE); capacity requested and sized to the wave, runway stretches. | Reversals 2, 3 | 103, 105 ("trimmed at launch, never here") |
| 108 | High-volume capacity bullet, FNNL form: capacity sized to the wave, never used to trim it; `/mailbox-mix-strategy` sizes the client's fleet to the request or `/mailbox-pool-staging` assigns a pre-warmed pool group; kickoff surfaces the setup total for operator approval; smaller or still-warming fleet stretches the runway. Per-mailbox rate and rotation-half numbers unchanged. The old "started at the low end and ratcheted up" line replaced. (A-Sales deleted its fleet-sizing pointer; FNNL keeps and strengthens it, per section 5.) | Reversal 3; 6b | 108 |
| 114 | Signal slices run only once the offer is proven. | Kept rule, made explicit | 114 |
| 117-133 | Offer-Validation Wave block rewritten: whole qualified TAM (118); 6a offer count, qualifying candidates, `flight = 1` / `flight = 2`, Go-rated existing offer needs no new arms (119); equal cells, no head start, supersedes "carry the primary" and "arm cells funded first / capacity trim cuts positioning campaigns first", Creative Ideas moved to the positioning phase (120); >=500-company floor per cell with the tagged-bucket fold and ICP-adequacy finding (121); data sources in parallel with disjoint rows tagged `source_arm`, defined in `/lead-source-strategy` (122); per buyer type, ported from A-Sales ~108: formula per buyer-type segment on its qualified contacts, own winner, own results report, never borrows, fleet cannot carry every segment at the one-week pace -> every segment still launches, runway stretches, priority segments first in send order (123); honor-today rule kept (124); shared disqualifiers only (125); gate paragraph (127); winner takes the rest of the TAM immediately, no client scale-review volume gate (128); positioning variants start at the pick (129); scale review = results report + `offer.qualification` review, `offer.qualification.free_unit_cap_per_week`, carve-out keeps `offer.scale_review.confirmed_capacity_per_week` as a send cap only where the client supplies the deliverable (130); queued and parked arms fed from expansion or refresh rows, never by holding rows back (131); closing paragraph (133). | Reversals 1, 2, 3, 4; 6a; offer.segments port | 117-123 (incl. "8,000 to 12,000", "at least arm 1", "~3 to 4 week read window", "funded first", "capacity trim", "sized so its expected yeses ... confirmed_capacity_per_week", "When send capacity cannot run every segment's wave at once ... queue as flights", "union of ... offer_fit_disqualifiers") |
| 135 | Framework A copy line: two emails by default at every TAM size (third only under ~3,000 or as an arm), cadence Day 0 / 3 (Day 0, 3, 6), Monday to Friday (Tue to Thu only as a tested variant or tiny TAM); supersedes the sequence-by-TAM table and Tue-to-Thu. | 6j; Monday to Friday | 125 ("2-to-3-step sequence sized by TAM", "Tue-to-Thu") |
| 139 | Pool per arm across every first-wave segment (primary no longer carries extra campaigns); 6i read window verbatim plus "Read daily for the first week after launch"; pooled-false-positive guard re-expressed per segment cell and recorded in the matrix. | Reversal 7; 6i | 129 ("~21-day window") |
| 142 | PROVEN line: winner then takes the rest of the TAM; per-arm size now comes from the offer-count formula (2,000+ per arm once the TAM is 6,000+). Formula unchanged. | Reversal 2 | 132 |
| 144 | HOLD: keeps sending through its cells until the winner pick parks it; no signal fan-out on it. | Reversal 4 | 134 |
| 148 | Winner pick on matched cell counts; 6k winner-pick retirement (pinned text); DEAD arms' untouched rows go to the winner too; no ratio cut, with the Poisson reason (rejected rule named only as rejected); status `hold` = parked, verdict `unresolved` (matches the enum on disk in `/lead-magnet-brainstorm`:597). | Reversal 4; 6k | 138 ("another arm's win never retires it", broad-cell comparison) |
| 152 | Magnet-inflation guard: "fans the coverage wave out" -> "scales ... across the rest of the TAM and into signal slices". Guard logic unchanged. Three spaced em dashes (one line) removed. | Kept guard, retargeted | 142 |
| 154 | Escape hatch: "stalls the coverage wave" -> "stalls the winner pick, and with it the scale to the rest of the TAM"; "the meeting rate" now points at `meeting_book_rate` in `outbound/reference/reply-scoring-core.md` (6e: everyone points there). | Reversal 1; 6e | 144 |
| 164 | "How it sits with the waves": copy frozen only on signal-test slices; big campaigns carry the winner's positioning variants. | Phase 8 | 154 |
| 170 | Wave 1: first wave for a proven offer; for a new client it adds the signal slices on the winner (supersedes "runs only after the Offer-Validation Wave passes" as a volume gate). Offer + copy constant only on signal-test slices. One spaced em dash removed. | Reversals 1, 2 | 160 |
| 171 | Wave 2 rewritten: positioning of the winner at the pick inside the big campaigns (Creative Ideas lives here), losers switched off in flight, then CTA and delivery, subject lines last; "slices the capacity trim held back" removed; "Collection Completeness" -> "the Collection Scope rule in `/data-point-discovery`" (6h) with conditional paid-signal wording. One spaced em dash removed. | Phase 8; reversal 5; 6h | 161 |
| 172 | Wave 3+: thin portfolio -> more volume on the winner and its positioning variants before a new signal slice. One spaced em dash removed. | Phase 8 | 162 |
| 176 | ICP-adequacy check: under the whole-TAM first wave it also fires when the qualified TAM cannot give each offer in the count its own ≥500-company cell or each arm its ~1,300 pooled first-touch contacts. (FNNL-only fix: line 121 and first-wave item 10 both point here, and the old trigger alone would pass a TAM that cannot carry three cells.) | Reversal 2; 6a | 166 |
| 180-192 | "The cap on how many actually launch is sending capacity, applied at launch" replaced by the capacity request: heading with supersession (180); Aaron Sep 21 sizing; 6b YAML block verbatim (182-188); 6b prose rule verbatim (190); FNNL landing paragraph (192): `/mailbox-mix-strategy` sizes the fleet to `daily_sends_needed` with its own rates/rotation halves/active fraction/warmup unchanged, mailbox purchase needs the operator's approval of the setup total outside the $100 run budget, or `/mailbox-pool-staging` assigns a pre-warmed pool group; kickoff Step 6 checks the fleet against the request and never trims; worked example (10,000 contacts x 2 / 5 = ~4,000 a day, inside the 2,000 to 30,000 band; above the ceiling takes the ceiling and the runway stretches, matching what the orchestration group wrote in `/mailbox-mix-strategy`:104); honest limit (infra slots may be deferred, kickoff Step 6.0; fresh fleet warms first, so `allocated_daily_sends` stays blank and the one-week pace starts at the ready date); layering note with the new read window. Three spaced em dashes (one line) removed. No "shared pool", "pool-allocation" or A-Sales account arithmetic carried over. | Reversal 3; 6b | 170 |
| 211 | `low` tier: `{{first_name}}` plus at most two per-contact variables inside the offer sentence only (`sells_to_vertical`, `service_offered`, `own_best_client`), `_source` evidence URL, derived by Claude Code sub-agents (`/personalization-subagent-pattern`, never an AI column in the list workbench), fallback body when missing; supersedes first-name-only (HR34). | 6f; FNNL no-AI-column rule | 189 ("varying only `{{first_name}}`") |
| 267 | Proof BLOCK: only the proof-led variant waits; the slice ships offer-led now. | Proof decision | 245 |
| 282 | TAM-First Gate `full_enriched` bullet: 6c definition verbatim; slice only on populated signal columns. (A-Sales left its equivalent line; FNNL-only sweep per the group note.) | Reversal 5; 6c | 260 |
| 298 | social-proof-bank input: proof sets copy posture and whether a proof-PS arm exists, never a slice's priority or volume. Two spaced em dashes (one line) removed. | Proof decision | 276 |
| 319 | Locked Offer Rule exception: arms run as equal cells across every first-wave segment. | Reversal 2 | 297 |
| 517 | Required Campaign Types intro: when each runs (Lookalike = first-wave core; Creative Ideas = positioning phase; New Hire = tagged bucket until proven, then bounded allocation). | Reversal 2 | 495 |
| 595 | Offer Archetype column: every offer's archetype per first-wave segment campaign while unproven, the winner's once picked. | Reversal 2 | 573 ("Must match the locked `offer.lead_magnet`") |
| 617 | Campaign Overview follow-up bullet: one follow-up by default; three follow-up directions (strip back, different value prop or mechanism, add). | 6j; copy follow-up directions | 595 ("one or two same-thread follow-ups") |
| 638, 649-651, 716-717 | Front-End Offer section and both templates: offer count (6a) and capacity request lines added; "no fleet yet" as the unanswered value. | Reversals 2, 3 | 616, 627, 691 |
| 727 | Checklist: offer + copy constant on the signal-test slices. | Phase 8 | 701 |
| 730-732 | Checklist rewritten: full-volume first wave with `source_arm`; equal cells, 6a, matrix, per-cell floor, shared disqualifiers, read window, matched-count pick, no ratio cut, HOLD parked at the pick, scale review as report with carve-out; new capacity-request item (FNNL fleet form). | Reversals 1-4, 7 | 704-705 |
| 736 | Checklist `deal_value_tier` line aligned with the tier section and 6f (old "mid/high tier gets full per-contact copy" contradicted both). | 6f | 709 |
| 740-741 | Checklist: Creative Ideas and New Hire required in the ideas table, with when they run. | Reversal 2 | 713-714 |
| 753 | Checklist sequence: two by default, third under ~3,000 or as an arm; Monday to Friday. | 6j | 726 ("3 only for a small TAM") |
| 772-773 | Execution Mode Gate (auto_execute and review_gates) rewritten: whole-TAM Offer-Validation Wave, 6a, all launched together, no Creative Ideas before the pick, capacity request recorded and reported ("no fleet yet" when unanswered), no capacity trim at launch, later flights never hold rows back from the winner, operator may narrow (never a capacity trim). | Reversals 2, 3 | 745-746 ("capacity trim ... ~3 to 4 weeks", "arm 1 ... only where capacity gives each its own pooled-flip floor") |
| 777, 779 | What to do next: first wave described as whole-TAM; "capacity-trimmed at launch" replaced by the capacity request. | Reversals 2, 3 | 750, 752 |

**Logged as absent (no FNNL statement of the old rule):**
- A-Sales hunk 733 -> 754 ("If the shared pool's warm sending capacity cannot carry the wave ... trim the wave to fit. Reporting the shortfall is the action"). FNNL line 781 never said this (it says inboxes and warmup are not a reason to pause). Left unchanged.
- A-Sales's `/emailbison-positive-reply-scoring` pointer in the escape hatch: FNNL's line was already platform-neutral.

**FNNL-only sweeps (statements A-Sales did not have or did not change):** 3 (6c short form in the gate), 176 (ICP-adequacy trigger for the offer cells), 108 (fleet-sizing pointer kept and strengthened instead of deleted), 135 (6j cadence added), 139 ("read daily for the first week"), 154 (`meeting_book_rate` pointer), 192 (band-ceiling clause), 211 (sub-agent derivation, `_source`, fallback), 282 (6c on the TAM-First Gate).

**Deliberately left unchanged, and why:**
- 92 (`enrichment_tier = enriched`; a blank `enrich` column on an enriched row is a genuine negative): tam-build's per-row fit-gate column, not the `tam_stage` flag; 101 already requires confirming a column is populated before slicing.
- 100 (`contact_rank_in_company` / `same_wave_eligible`, rank 3+ staggered): the buying-committee send cap, a different axis from the P1 to P5 hold that was retired.
- >=500-company floor text (160), PROVEN / DEAD formulas and ready-reckoner (142-146), ~1,300 floor, farming-interest guard, magnet-inflation guard logic, two-floors note (150): section 4 "kept unchanged".
- Growth ordering (194-199), launch priority for signal experiments, contact-signal-outranks-company rule: they order the send inside a stretched runway or the bounded signal allocation; never pre-empt the winner.
- Mailbox rate ~15 to 20/mailbox/day and the rotation half (108): deliverability mechanics.
- Sold-to stays the message axis; the lookalike stays the spine; no ratio cut added (only the rejection and its reason are stated).
- Research-routing HARD RULE, $100 standing budget, list-workbench and no-AI-API lines: untouched.
- 68 "auto_execute (the operator's default)" vs 771 "review_gates (default)": spec open item 4, flagged only.

---

## File 2: `outbound/reference/first-wave-eric-defaults.md` (110 -> 112 lines; +22 / -20)

| Line | Change | Rule | FNNL old wording was at |
|---|---|---|---|
| 1-3 | Title "(full volume)"; new lead paragraph (full-volume first wave, offer test inside it, winner takes the rest, Eric's read kept with `meeting_book_rate` beside it; supersessions named; FNNL spec path and FNNL archive path cited). | Reversals 1, 2 | 1 |
| 7 | "Wave 1" note: coverage wave follows the winner pick. | Reversal 2 | 5 |
| 9 | "This is Eric's own model" claim replaced (the read is Eric's, the shape is Aaron's; offer-validation-first survives as the order of what is tested; supersedes "not to scale", 2026-07-04). FNNL's corpus paragraph after it kept verbatim. | Reversal 2 | 7 |
| 17-18 | Mode table Goal and Campaigns rows: whole TAM, 6a, equal cells across every segment, matrix, no head start, Creative Ideas moved; Proven-mode column = volume-first with positioning variants and the bounded signal allocation (supersedes the full signal-slice coverage portfolio). | Reversal 2 | 15-16 |
| 22 | Sequence row: 6j. | 6j | 20 |
| 25-26 | Send days: Monday to Friday. Read: adds `meeting_book_rate` and the floor-plus-grace read. | Monday to Friday; 6e; 6i | 23-24 |
| 35 | Item 2: Creative Ideas moved to the positioning phase. | Reversal 2 | 33 |
| 36 | Item 3 rewritten per 6j (cadence Day 0/3, Day 0/3/6), supersedes the sequence-by-TAM table incl. its UNRESOLVED 1-email case; retired table pointed at the FNNL archive. | 6j | 34 |
| 42 | Item 9: Monday to Friday; Tue to Thu only as a tested variant or tiny TAM; three days cut weekly capacity ~40% and stretch the runway. | Monday to Friday | 40 |
| 43 | Item 10: whole qualified TAM, 6a, ~300 only the raw-reply floor, ~1,300 per arm, ICP-adequacy surfacing, capacity requested and the client's fleet sized to it. | Reversals 2, 3 | 41 |
| 45 | "Already present" line updated for Lookalike core and Creative Ideas. | Reversal 2 | 43 |
| 52, 55 | Hold-copy-constant belongs to signal-test slices only; offer varies across offer cells inside each first-wave segment. | Phase 8 | 50, 53 |
| 63 | Flip paragraph: pool across every first-wave segment; 6i read window verbatim plus read-daily; "size the test list to the number of offers" replaced by 6a; pick on matched cell counts; 6k retirement verbatim; no ratio cut. PROVEN / DEAD formulas unchanged. | Reversals 4, 7; 6a, 6i, 6k | 61 |
| 65 | Proven: winner takes the rest of the TAM immediately, positioning variants start, scale review = results report + `offer.qualification` review; no client scale-review volume gate; carve-out. | Reversal 1 | 63 |
| 81 | `meeting_book_rate` beside time-agreed replies, short form pointing to `outbound/reference/reply-scoring-core.md` (6e: the canonical definition lives there; confirmed on disk at line 13). Does not flip the flag. | 6e | 79 |
| 91 | Offer posture: "Test two to four offers" -> at least three sized to the list (6a), equal cells, no head start, only arms beyond the count queue, HOLD parked at the pick, Go-rated existing offer needs no new arms. | Reversal 2; 6a | 89 |
| 101 | Reconciliation: two by default; follow-up count no longer scales with TAM size. | 6j | 99 |

**Absent:** none. Every A-Sales hunk had an FNNL counterpart.
**Left unchanged:** Framework A items 1, 4-8; the Personalization, CTA, Proof, Copy register and Length rows; Eric's three metrics, bands, the Dead paragraph and the instrumentation caveat; the FNNL corpus paragraph at 9; the Reconciliation 25-to-35 note.

---

## Mechanics checks (actual output)

```
.claude/skills/campaign-strategy/SKILL.md lines=796 crlf=796 bom=[ 2d 2d 2d] dashlines=34 added_dash_lines=0
outbound/reference/first-wave-eric-defaults.md lines=112 crlf=112 bom=[ 23 20 46] dashlines=0 added_dash_lines=0
yaml ok 3373
CR bytes: 0 / 0
```

- **Coordinator's byte check (per the section 9 correction), `python ... b.count(b'\r\n'), b.count(b'\n')`:** campaign-strategy `0 796` vs archive `0 769`; first-wave-eric-defaults `0 112` vs archive `0 110`. Both LF-only, same as their archives. **The perl CRLF fix was never run on either file.**
- **Line endings: these files are LF, not CRLF, and always were.** `tr -cd '\r' | wc -c` returns 0 for both edited files AND for both byte-identical archive copies (sha256 matches `baseline.tsv`), and Python `open(p,'rb')` counts 0 `\r\n`. Git Bash `grep -c $'\r$'` on `/c/...` paths reports every line as matching (it reported 796/796 and 112/112 here, and would on the LF archive too), so the `crlf_lines` column in `baseline.tsv` is a grep artifact. Line endings are unchanged from the original; I did NOT run the perl CRLF conversion (it would have flipped LF files to CRLF). Last byte is `\n` in both files, as in the archives. Recommend the coordinator re-verify other groups' files with `tr -cd '\r'` before anyone runs the perl fix.
- BOM: none (`2d 2d 2d` = `---`, `23 20 46` = `# F`).
- Spaced em/en dash lines: campaign-strategy 41 -> 34 (seven pre-existing lines cleaned: old 96, 142, 160, 161, 162, 170, 276); first-wave 0 -> 0. `git diff | grep '^+'` shows 0 added lines with one.
- YAML: PyYAML parses `name` and `description`; the description stays one unquoted line with no `": "`.
- Vendor names: 0 added lines in either file name EmailBison, A-Leads, PlusVibe, Smartlead, AI Ark, Prospeo, MillionVerifier, Clay, GetLeads, DiscoLike or Spaceship.

## Section 10 grep (after the last edit)

campaign-strategy:
- 105 `not to scale`: inside the supersedes clause.
- 117 `size the validation list`, `8,000 to 12,000`: supersedes clause.
- 119 `at least arm 1`: supersedes clause.
- 120, 180, 183, 190, 772, 773 `capacity trim`: supersedes clauses, the pinned 6b YAML comment, or "there is no capacity trim at launch" / "never a capacity trim".
- 192 `trim the wave`: "never uses it to trim the wave" (new rule).
- 135 `Tue to Thu`: "Tue to Thu only as a tested variant or for a genuinely tiny TAM" (new rule).
- 139 `21-day window`: pinned 6i supersedes clause.
- 148 `never retires it`: pinned 6k supersedes clause.
- No hits: `size the list to the offers`, `size the test list`, `primary plus at least one`, `Signal collection is a MUST`, `Collection Completeness`, `varying only the first name`, `both required Email 1 variant columns`, `proposes times only when`, `Wait 21 days`, `21 days`, `Tue-to-Thu`, `Tuesday or Thursday`, `winning slice`, `raise the ceiling to cover full collection`, `80%`, `shared pool`, `pool-allocation`, `top 10`, `email_1_b`. No warmup-gate `21-day` exists in either file, so no allowlist exception was needed.

first-wave-eric-defaults:
- 9 `not to scale`: supersedes clause.
- 25, 42 `Tue to Thu`: new rule ("only as a tested variant or ... tiny TAM").
- 43, 63 `size the test list`: supersedes clauses.
- 63 `21-day window`, `never retires it`: pinned 6i / 6k supersedes clauses.
- 91 `at least arm 1`: supersedes clause.
- All other terms: no hits.

Extra sweep for the retired read window under other spellings (`grep -n -E "3 to 4 week|3–4 week|21-day run"`, both files): campaign-strategy 119 (supersedes "... inside the ~3 to 4 week read window"), 180 (heading supersedes clause "... launched within ~3 to 4 weeks"), 772 ("supersedes the launch-time trim to what reaches significance in ~3 to 4 weeks"). All three are supersession clauses. first-wave-eric-defaults: no hits. The old "~21-day run" at campaign-strategy old line 170 is gone.

Positive check of pinned names (counts cs / fw): `capacity_request` 5/1, `daily_sends_needed` 6/0, `days_to_cover_tam` 3/0, `requested_on` 3/0, `allocated_daily_sends` 5/0, `max(3, floor(qualified_contacts / 2000))` 7/4, `meeting_book_rate` 1/3, `offer.qualification` 2/1, `sells_to_vertical` / `service_offered` / `own_best_client` present in cs, `_source` evidence URL 1/0, "Collection Scope rule in `/data-point-discovery`" 1/0, 6c text 2/0, `source_arm` 3/0, `free_unit_cap_per_week` 1/0. 6b YAML and prose, 6i and 6k are verbatim.

## `_vendor-library`

No parked pack file matches `capacity trim`, `primary plus at least`, `at least arm 1`, `size the validation list`, `Tue to Thu`, `21-day window` or "another arm's win never". Nothing to name.

## Does not map

None left open. One candidate was the case where `daily_sends_needed` exceeds the 2,000 to 30,000 per-client band; the orchestration group already settled it in `/mailbox-mix-strategy`:104 (the request takes the ceiling and the runway stretches past a week), and campaign-strategy 192 now says the same. Spec open item 4 (`execution_mode` default disagreement, campaign-strategy 68 vs 771) is flagged only, not an Aaron question.

## Cross-file follow-ups (checked on disk; not my files)

Already aligned by the owning groups, no action: `lead-magnet-brainstorm`:597 (`hold` = parked at the pick, read `unresolved`), :435 (supersedes "campaign-strategy decides the first flight from warmed send capacity"); `offer-test-slate`:200-210, :347 (`free_unit_cap_per_week`, `confirmed_capacity_per_week` as a send cap only for a client-supplied deliverable, campaign-strategy files the capacity request); `lead-source-strategy`:198 (`source_arm` values `lookalike`, `broad_filter`, `signal_<name>`); `reply-scoring-core.md`:13 (`meeting_book_rate`); `data-point-discovery` (Collection Scope heading present); `cold-email-kickoff`:100, 240, 412, 445, 582-584 and `continue-client`:100, 141, `autonomous-execution-policy`:31, `cold-email-weekly-rhythm`:123 (capacity trim superseded; capacity request consumed); `mailbox-mix-strategy`:104 (sized to the request, ceiling rule).

Still for the coordinator:
- campaign-strategy 192 says `/cold-email-kickoff` Step 6 "checks the fleet against the request at launch and never uses it to trim the wave". Verified: kickoff 580 ("Capacity check: confirm the fleet against the request ... supersedes the capacity trim at this step") says the same. No action.
- **replies group, `outbound/reference/reply-scoring-core.md`:13:** the `meeting_book_rate` definition reads "counting bookings from the client's booking calendar or CRM" (the A-Sales shape). FNNL's `crm` slot is `not_chosen`, so shared rules section 5 wants "... when one is readable, otherwise from the operator's reported count, and says which". Both my files point there (6e) rather than restating it, so they inherit whatever lands.
- **testing group, `/experiment-design`:** campaign-strategy 219 (Signal-Driven Slice Library intro) still says "flag `[FL]` when matching rows clear the `/experiment-design` minimum", which disagrees with the ≥500-company floor that defines `[FL]` everywhere else in the file. The testing group is rewriting experiment-design's minimum-sample section in this pass, so the pointer's target is moving; recommend re-pointing 219 at the ≥500-company floor once their text settles (not changed here, pre-existing and outside the A-Sales diff).
- `first-wave-eric-defaults.md` now cites `outbound/reference/working-docs/_AARON-PROCESS-ALIGNMENT-2026-09-22.md`, which is untracked (`??`) in FNNL. Commit it with this pass or the pointer dangles.
- Line endings: see Mechanics. The baseline's CRLF claim is wrong for at least these two files; running `perl -pi -e 's/(?<!\r)\n/\r\n/g'` on any FNNL file on the strength of `grep -c $'\r$'` would convert an LF file to CRLF.

## Unfinished

Nothing. Both files edited, checked and logged. No commits, no sub-agents, no other group's files touched.
