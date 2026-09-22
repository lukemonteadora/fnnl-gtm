# Change log: group `offer` (FNNL port of the Aaron process alignment, 2026-09-23)

Sources read: FNNL `CLAUDE.md`; the spec `A-Sales/.../_AARON-PROCESS-ALIGNMENT-2026-09-22.md`; A-Sales `edits-offer.md`; `fnnl-edit-instructions.md` (binding). Per file, the A-Sales change was taken from `diff <A-Sales archive --pre-change> <56ff4a2c>` (never the A-Sales working copy). FNNL's six files turned out to be close to A-Sales's pre-change text (FNNL differences: Stack Resolution blocks, capability roles instead of DiscoLike/A-Leads, the no-AI-API wording, the Slack source, a different `What To Do Next` order), so most hunks mapped to the same FNNL paragraph; every replacement was written in FNNL's own wording, with no A-Sales tool, pool or `locked-tech-stack.md` reference carried over.

Every changed rule carries `(Aaron process alignment, operator directive 2026-09-22)` plus a `supersedes "<old rule>"` clause where it replaces one, inside one paren pair. FNNL archive copies (pre-made, untouched): `outbound/_archive/aaron-process-alignment-2026-09-23/{offer-intelligence,lead-magnet-brainstorm,offer-test-slate,social-proof-bank,proof-asset-request,proof-asset-request-reference}--pre-change.md`. No file outside `archive-map.tsv` was edited.

Line numbers below are in the files as they are now.

---

## 1. `.claude/skills/offer-intelligence/SKILL.md` (Phase 1 research, validation mode)

| New line | Change | Rule (sec. 3) | FNNL old wording at (pre-change line) |
|---|---|---|---|
| 21 | NEW paragraph: discovery mode is the research phase. (1) extend and clarify what onboarding captured; intake ICP is a starting point, not a ceiling. (2) research the vertical for real problems in buyers' words: won/lost calls first; then review sites, forums and public posts (Aaron Sep 21 "mine demand"), **Reddit only from an operator paste, X or LinkedIn posts only where WebSearch returns them, each gap logged (Vector 3)**; then competitor offers and paid ads (Meta Ad Library and LinkedIn ads **read with WebFetch and WebSearch**). Heavy competitor ad spend = demand evidence. Unfamiliar market = Claude sub-agents: the `/deep-research` fan-out plus WebSearch/WebFetch, **never another research provider**. | Offer research; Phase 1; FNNL research rules (sec. 5) | new requirement (no old statement; 19-21 described modes only) |
| 27, 29 | "The saturation problem": saturation is fatigue evidence AND demand evidence (Sep 21 quote); lowers rank, requires the gap; never closes an archetype or overrides a higher score; contrarian offer is one of two answers. | Offer research (saturation) | 25, 27 |
| 165 | Vector 1: SATURATED ranks lower and asks for the gap, never closes (replaces "It is evidence it used to work"). | same | 163 |
| 367 | Saturation Map label "(avoid)" -> "(rank lower, never closed)" with the gap per archetype. | same | 365 |
| 390-391 | Recommended direction: Secondary now points capacity to the lock check (scale note or `offer.qualification`), supersedes "`/offer-test-slate` asks about full volume after the test"; "Avoid" -> "Rank lower" with named gap. | Deliverable at send scale; saturation | 388-389 |
| 407 | "Closed to candidates" -> "Saturated (ranked lower, never closed)" with gap and paid-ad demand evidence. | saturation | 405 |
| 434 | Validation trigger keeps "below 1% after 300+ sends" but adds: 300 sends only triggers a look on raw reply rate, never calls an offer broken; that needs ~1,300 first-touch contacts per arm. | Offer research (1,300 per arm) | 432 |
| 437 | Thin offer: the cheapest honest test is one normal-size arm (~2,000 planned, ~1,300 minimum) inside the first wave (Mar 9 quote); supersedes "first small wave". | thin offer runs as a normal arm | 435 |
| 463 | Diagnostic item 2: "Is every qualified yes being honored, at the volume being sent?" checked against the lock record (scale note or `offer.qualification`); supersedes "asked in `/offer-test-slate` scale review, never here". | Deliverable at send scale | 461 |
| 481 | Separate fulfillment check at current send volume (or add the missing `offer.qualification`). | same | 479 |
| 518 | Minimum threshold 300 sends -> ~1,300 first-touch contacts per arm plus sequence and grace (May 4). | 1,300 per arm; read window (6i spirit) | 516 |
| 541 | Score table perceived-value cell: deliverability at send scale is a lock check in `/lead-magnet-brainstorm`. | Deliverable at send scale | 539 |
| 553, 555 | "Saturation override - check first" -> "Saturation check - run first": runs Step 5B, adds its pick as a candidate, never closes or overrides a higher score; supersedes "do not pick the market alternative" and "will underperform a mid-scoring contrarian". | saturation | 551, 553 |
| 568 | Go: new arms optional (Apr 13 quote); default first-wave test = segments, data sources, positioning variants; `validation_arms: []` "validated Go offer". | Go offer needs no new arms | 566 |
| 576 | "Re-score until the offer hits 6+" -> re-score once, then a market read in a fresh multi-offer flight, simultaneous cells, list and copy frozen (Apr 6, Mar 2). | market read replaces desk loop | 574 |
| 578 | Swap routes into a fresh multi-offer flight run as simultaneous cells; supersedes a one-offer swap. | Iterate or Swap -> fresh multi-offer set | 576 |
| 586 | Step 5B trigger renamed to the saturation check. | saturation | 584 |
| 603 | Contrarian pick joins on its score, never replaces a higher one. | saturation | 601 |
| 683 | Swap template hand-off: fresh multi-offer flight; `/experiment-design` formalizes. | multi-offer set | 681 |
| 706 | Common mistake: competitor offers are demand evidence AND a fatigue warning; name the gap. | saturation | 704 |
| 709-710 | Common mistake 300 sends -> ~1,300 per arm; NEW mistake "Letting saturation close an archetype". | 1,300; saturation | 707 |
| 731 | Integration `/offer-test-slate`: results report + `offer.qualification` review alongside the scale-up, not a volume gate. | Reversal 1 | 728 |
| 733 | Integration `/experiment-design`: Iterate added; offers run as a fresh multi-offer flight. | multi-offer set | 730 |
| 735 | Integration `/ask-aaron`: "can every qualified yes be honored ... at the planned send volume"; lock check pointer (replaces "at test scale" and the scale-review pointer). | Deliverable at send scale | 732 |
| 737 | Integration `/cold-email-weekly-rhythm`: raw reply <1% after 300+ sends = a look, not a verdict (~1,300 per arm). | 1,300 per arm | 734 |
| 743-745 | What to do next: Go (arms optional), Iterate and Swap (multi-offer flight, market reads it). | Go; multi-offer | 740-742 |

**Left unchanged (deliberately):** the frontmatter description (states no superseded rule; its "Reddit, review sites, forums, with an honest record of which platforms were actually read" already matches the FNNL Reddit rule). AI/API Routing (already FNNL's Claude-Code-only routing), Vector 3 Reddit rule and platform table, the live-X retirement line, the Step 4 saturation penalty (-2, the rank-lowering mechanism), Step 3 "SATURATED -> flag for Contrarian analysis" (a flag, not a close), the decision table incl. "Swap + test", the Vector 5 platform-conditional scoring line (pre-existing parenthetical `/emailbison-positive-reply-scoring` example, untouched). Dash count unchanged (5).

**Absent:** none. (The Go line's supersedes quote, "run `/lead-magnet-brainstorm` for validation arms to test beside it", is an FNNL rule that lived in `cold-email-kickoff` pre-change lines 278 and 313; orchestration has already superseded it there, kickoff:302.)

## 2. `.claude/skills/lead-magnet-brainstorm/SKILL.md` (Front-End Offer Builder)

| New line | Change | Rule (sec. 3) | FNNL old wording at |
|---|---|---|---|
| 3 | Description rewritten, one line, unquoted, no ": " and no " #": starts with the pinned sentence; ideation limits removed "at ideation"; "who honors a qualified yes"; first wave = max(3, qualified contacts / 2,000) equal cells, no head start; lock records scale note or `offer.qualification`, honest eligibility, Signal-Capability Check (**FNNL wording kept: "a capability the stack contract declares"**), list definition (`offer.icp_inclusion`, `offer.title_stack`, `offer.offer_fit_disqualifiers`); Go offer makes arms optional. Removed "with /campaign-strategy sizing the first flight from send capacity" and "full-volume capacity is asked after the test". | Reframe; reversals 1-3; Deliverable at send scale | 3 |
| 6-9 | H1 `Front-End Offer Builder (lead-magnet-brainstorm)` + opening paragraph: a lead magnet is one of the three buckets, never the default; no bucket outranks another by default; old names kept only for compatibility. | Reframe | 6 |
| 39 | Pointer renamed to Deliverable at Send Scale. | housekeeping | 36 |
| 41 | `direct_offer` defined plainly: "no front-end offer at all, just the main service"; a service-delivery front end is a normal bucket-2 candidate, never second-class; stays the exception. Its reply now proposes two specific times plus the calendar (Sep 21); supersedes "proposes times only when the prospect asks to talk" (2026-09-21). "handful of yeses a test brings" -> "qualified yeses behind an `offer.qualification` rule". | Reframe; reversal 6 | 38 |
| 55 | "does not lead the first test flight" -> "does not enter the first wave". | housekeeping | 52 |
| 116 | Intake Q4: operational limit -> client dependency, scale note or `offer.qualification`. | Deliverable at send scale | 113 |
| 175 | K1/K2 retirement parenthetical "(test first, ask about scale after)" -> offer-limits removal + lock check pointer. | same | 172 |
| 179 | K2 gap-fill: honored for qualified responders; cost at planned send volume goes to the scale note at lock; `offer.qualification` caps the hand-delivered fill; supersedes "for the scale review, where it sizes scaled volume". | same | 176 |
| 226 | Build path: dropped "at test scale". | housekeeping | 223 |
| 233-235 | Saturation Rule: CROWDED needs a different delivery or named gap; SATURATED ranks lower, must name the gap, never removed, never kept out of the first wave when its score earns a place, never overrides a higher score (Sep 21 demand); supersedes "rank SATURATED last and keep them out of the first test flight". | saturation lowers rank | 230-232 |
| 241-242 | Per-account custom work: produced for qualified yeses; first wave is full volume, so it carries `offer.qualification` unless its scale note fits; supersedes "at test scale ... handful to few dozen yeses". | Deliverable at send scale; qualification after the yes | 238-239 |
| 269-286 | Section "Test First, Ask About Scale After" replaced by **"Deliverable at Send Scale: who honors a qualified yes (formerly ...)"**: ideation unfiltered; capacity settled at lock (Sep 21); honesty rule = every QUALIFIED yes; cheap asset ungated; costly front end gets a disclosed qualification step (Sep 21 cherry-pick); material eligibility stated in the offer; scale note defined against the planned volume (first-wave cell ~2,000 over roughly one Monday-to-Friday sending week at the pace in `run_state.capacity_request`, then the TAM); `offer.qualification` with the exact shape `{criteria: [...], form_fields: [...], free_unit_cap_per_week: <n or null>}`; at lock scale note OR qualification, neither = ranks down, never dropped; client-supplied-deliverable carve-out. | Deliverable at send scale; qualification after the yes; reversal 1 carve-out | 266-275 |
| 292 | Supersession note: the "Test First" rule archived at `outbound/_archive/aaron-process-alignment-2026-09-23/lead-magnet-brainstorm--pre-change.md` (FNNL's own archive). | housekeeping | 281 |
| 317 | Diagnostic item 2: every qualified yes honored at send scale; neither record = ranks down. | Deliverable at send scale | 306 |
| 324 | Generate Candidates pointer: ideation unfiltered, lock check. | same | 313 |
| 343 | Four-sentence test and scale note: scale note at planned send volume; qualification rule and stated eligibility where it does not fit; neither = ranks down; supersedes "never drops or down-ranks" and "asked about in the scale review". | same | 332 |
| 373 | Fulfillment First intro: "for the test"/"test yeses" -> qualified yeses. | same | 362 |
| 375-377 | Delivery reply split by offer type (pinned 6l): promised asset delivered first, no times (Jul 13, R03, kept); direct, trial or service = two specific times plus calendar, no re-selling (Sep 21), qualification form rides in the same reply; labelled the house resolution of ledger R20. | reversal 6; 6l | 364 |
| 379 | If they don't qualify = second half of the qualification step (standard offer, real criteria). | qualification after the yes | 366 |
| 391, 398 | Score Ideas: scale goes to the lock check; neither record ranks below every offer that has one. | Deliverable at send scale | 378, 385 |
| 428-435 | Lock section: heading dated; Feb 23 quote; primary = rank-1 default holder of `offer.lead_magnet`, **no head start**, Creative Ideas moves after the winner (supersedes "because the Creative Ideas, Lookalike and sold-to campaigns carry it"); **pinned 6a formula paragraph** (with the per-segment clause), count resolved by `/campaign-strategy` once the TAM exists; list never shrunk, offers never cut for capacity; supersedes "decides how many run in the first flight from warmed send capacity", sizing the list to the offers, "the primary plus at least one arm". | Reversal 2; 6a | 415-420 |
| 440 | Arms share the first wave's list: only shared disqualifiers apply; an arm's extras skip only its own cell or it runs on its own offer-derived list; supersedes the union rule. | Reversal 2 (every offer across every segment) | 425 |
| 442 | All first-wave offers launch the same day (May 18); **capacity is sized to the volume, never trimmed: "when the client's warmed sending fleet delivers less than the plan needs ... the runway stretches (`run_state.capacity_request`)"** (FNNL wording, no pool language); only arms beyond the count queue; supersedes "arm 1 runs beside the primary; further arms join ... when send capacity gives each its own pooled-flip floor". | Reversals 2, 3 | 427 |
| 443-444 | Empty rule: "fewer than three"; NEW Go-offer exception (Apr 13). | Go offer | 428 |
| 446 | After the wave: switched off in the live campaign; **pinned 6k winner-pick retirement**; losers off by DEAD line and winner pick, never a ratio; winner goes to the rest of the TAM immediately; scale review = results report + `offer.qualification` review; carve-out; supersedes "before the winner scales ... sizes the coverage wave to that answer". | Reversals 1, 4; 6k | 430 |
| 455-456 | Offer sets per buyer type: per segment scale notes, qualification rules, list definition; **ported `offer.segments` integration**: formula per buyer-type segment on its qualified contacts; each segment flips, picks, scales its own winner, gets its own results report (`offer.segments[].offer_market_proven`, `offer.segments[].scale_review`); never borrows another's winner; if the fleet cannot carry every segment's wave at the one-week pace, every segment launches, runway stretches, priority segments first. | `offer.segments` integration | 439-440 |
| 468-472, 477, 479, 487-488, 491 | Output block: scale note at send volume; new `Qualification:` and `Eligibility stated in the offer:` lines; "Who honors a qualified yes"; delivery reply split; "If they don't qualify" = standard offer; new `List definition:` line; Role at lock "primary (rank 1, no head start)"; required-before-lock list extended. | Deliverable at send scale; reversal 6 | 452-472 |
| 501, 503-504 | Execution Mode Gate: scale note or `offer.qualification` plus list definition before save; auto_execute report states the formula and the Go case; K "at test scale" dropped. | same | 482-485 |
| 509 | Disqualifiers intro: only shared disqualifiers apply to the shared list; top-level list holds only company types the whole offer set disqualifies; a primary-only one is a skip in the primary's cell. | Reversal 2 | 490 |
| 545-553 | NEW section "The Offer Writes the List Definition": `offer.icp_inclusion` (filter/why/check; **check obtainable through a capability the stack contract declares**, passes the Signal-Capability Check) and `offer.title_stack` (function, seniority, every title variation; May 4), written at lock beside the disqualifiers (Sep 21 "has a free trial"); intake ICP a starting point, not a ceiling. | icp_inclusion + title_stack at lock | absent, written fresh |
| 567, 573, 576-588 | Save Output YAML: eligibility into `lead_magnet_details`; yes_honored_by comment; scale_needs comment; `qualification` block (exact shape); `icp_inclusion`; `title_stack`. | same | 539-548 |
| 593-595, 597 | `validation_arms` comments: formula, never from send capacity, Go case; `flight` 1 = first wave; `hold` redefined per 6k (supersedes "keeps its cell"). | Reversals 2, 4 | 553-557 |
| 604, 608-612 | Arm block: signal dependency on the shared list or its own list; scale_needs; `qualification`; `icp_inclusion`; `title_stack`; disqualifier comment replaces the union rule. | same | 564, 568-569 |
| 621 | Segment `scale_review` comment: results report + qualification review alongside that segment's scale-up. | `offer.segments` | 578 |
| 624 | `lead-magnets.md` fulfillment plan gains `Qualification:`; a `## List definition` heading (mirror of `icp_inclusion` and `title_stack`, so the new section's "mirror both" instruction is enumerated in Save Output); Every candidate shows qualification. | Deliverable at send scale; list definition | 581 |
| 628 | `lead_magnet_gap` paragraph: no-times rule scoped to promised assets; direct, trial or service propose two times plus calendar. | reversal 6 | 585 |
| 636-638, 640, 647-648 | Common mistakes: ideation vs lock; NEW "promising every yes the free unit on a costly front end, or gating a cheap asset"; NEW "giving the primary a head start, or sizing the list to the offers"; "not a magnet" -> "not a front-end offer"; K2 gap-fill at planned volume; "launch the first-wave count together". | various | 593-603 |
| 657 | What To Do Next: formula launch (supersedes "runs the primary plus at least one arm on the same broad list"); list definition; **order corrected: `/social-proof-bank`'s seed portion (5 to 10 offer-fit companies) BEFORE `/tam-build`**, rest of the bank alongside it. | Reversal 2; seeds; phase order | 612 (FNNL-only: FNNL listed `/social-proof-bank` after `/tam-build`, which contradicted the seed gate) |

**Coordinator reframe items confirmed:** H1 and opening paragraph (6-9); description starts with the required sentence and parses (`yaml.safe_load` ok); `direct_offer` defined plainly as no front-end offer, the main service only, the exception; nothing ranks asset offers above service or service-delivery offers (re-read Generate Candidates, rubric, Signal-Capability Check, weak-offer screen, Next-Step Gate: the Signal-Capability "preferred shape" is about signal dependency, not bucket); no folder or field renamed.

**Kept (FNNL-specific, intact):** the Stack Resolution block; the no-limits lines ("no client-willingness, capacity, effort or free-trial limits", now scoped "at ideation"); FNNL's Signal-Capability Check wording and slot rules; "reply-agent setup skill for the locked sending platform" wording; the K build path's capability-role wording ("company-discovery source"); archetype table, K1-K4, Artifact-Truth Gate, Next-Step Gate, value equation, why-not and farming-interest checks, weak-offer screen, client-OK and veto rules, ~1,300 hard minimum, ~2,000 per offer. The file has no `$100` line (checked); nothing to keep there. 15 pre-existing spaced-dash lines untouched (baseline 15).

## 3. `.claude/skills/offer-test-slate/SKILL.md`

| New line | Change | Rule | FNNL old wording at |
|---|---|---|---|
| 3 | Description (double-quoted, no internal `"`): who honors a qualified yes; whole first wave (all offers together, one per ~2,000 qualified contacts, at least three); scale review runs alongside the winner's scale-up = results report + `offer.qualification` review; gates volume only for a client-supplied deliverable. Removes "records the answer that sizes the coverage wave". | Reversals 1, 2 | 3 |
| 39-40 | Why-this-exists steps 3-4: test every first-wave offer together inside the full-volume send (formula, list never sized to offers); report results while the winner goes out; deliverability at send scale is at lock; supersedes "test the offers on a few thousand contacts each" and "the capacity question lives HERE". | Reversals 1, 2 | 39-40 |
| 42, 46, 50 | "Honor every qualified yes": cheap assets ungated, costly front ends get a disclosed qualification step (Sep 21), eligibility stated in the offer; removed "a handful to a few dozen yeses per offer"; standard applied at send scale; scale review is not a volume gate. | qualification after the yes | 42, 46, 50 |
| 58 | Queue = offers beyond the first-wave count. | Reversal 2 | 58 |
| 97-98 | Step 2 carries `offer.qualification` in plain words; neither record = ranked lower, never out. Step 3 "Show the whole first wave" (formula, equal cells, no head start, ~1,300 floor, whole list goes out; **per-segment formula clause**; pre-strategy fallback = top three sendable offers + joiners + queue; **short fleet: "If the client's warmed sending fleet delivers less than the plan needs (`run_state.capacity_request`), say the runway stretches"**); supersedes "size the list to the offers, so 3 to 4 offers need about 8,000 to 12,000 contacts", "primary plus arm 1 ... queue", "never promise more simultaneous offers than send capacity can read". | Reversals 2, 3; 6a | 97-98 |
| 150-152, 158-159, 161, 174-175 | Slate template: "Who handles a yes", new "Who gets it free", "What delivering it at full sending volume takes"; "First wave" starts the same day across the whole list; size >= ~1,300 and days to cover; losers switched off in the live campaign, winner goes to the rest of the list straight away, undecided offers stop getting new contacts; trial example "up to 20 qualified people a week"; item 4: winner keeps going while we agree the weekly free-unit number. | Reversals 1, 2, 4 | 150-174 |
| 184 | Scale-review "When to run": alongside the winner's scale-up, never ahead of it; report + qualification review; carve-out; supersedes "run it BEFORE the coverage wave ... sized from the answer"; per-segment clause extended (own winner scale-up, never borrows another's winner). | Reversal 1; `offer.segments` | 183 |
| 191 | Inputs add `qualification` and `run_state.capacity_request`. | consistency | 190 |
| 198-203 | Steps 3-5: project the winner at its scale-up pace; "Review the qualification rule" (agency: cap = our capacity; client: answer sets `free_unit_cap_per_week`, rest get the standard offer, carve-out caps sends; check criteria against real replies); fallbacks only for a zero cap or carve-out "no". | Reversal 1 | 197-201 |
| 206-210 | Step 8: write the confirmed number into `free_unit_cap_per_week`, in the primary block after promotion (or that segment's primary block in `offer.segments`), matching lead-magnet-brainstorm's promotion mechanics; sending volume does not wait; carve-out only; supersedes the coverage-wave sizing rule. | Reversal 1 | 204-207 |
| 222, 242, 244, 246, 250-251 | Results template: "how the winner is now going out"; "Where the winner goes now" (sending pace, estimates, who gets the free unit); "What we need" asks for the weekly free-unit number. | Reversal 1 | 219-247 |
| 258 | Results template Timeline "<when scaling starts once we hear back>" -> "<when the winner will have reached the rest of your list at this pace>". | Reversal 1 | 254 (FNNL-only fix: A-Sales left this line, which contradicts "winner scales immediately") |
| 275, 279 | Rendering: "where the winner goes now"; "first wave then queue". | housekeeping | 271, 275 |
| 301, 304-308, 323 | State fields: "who honors a qualified yes"; scale note = lock check; `qualification` block (exact shape, same as lead-magnet-brainstorm); `confirmed_capacity_per_week` **name kept** (campaign-strategy reads it), redefined as free units per week that set `free_unit_cap_per_week`, caps sends only for a client-supplied deliverable. | Reversal 1 | 297-315 |
| 327 | Client-OK example "up to 20 qualified accounts a week". | qualification | 319 |
| 331, 334, 336-337 | Common mistakes: lock check instead of "ask about scale after"; "Sizing the list to the offers, or showing a primary plus one arm" (supersedes the send-capacity mistake); "Treating the scale review as a volume gate, or skipping the lock check" (supersedes "asking the scale question before the test" as a mistake); NEW "Promising every yes the free unit on a costly front end, or gating a cheap asset". | Reversals 1, 2 | 323-328 |
| 347 | Integration `/campaign-strategy`: formula from the list; files the capacity request the client's sending fleet is sized to; winner to the rest of the TAM; scale review as a report alongside; `confirmed_capacity_per_week` caps sends only in the carve-out. | Reversals 1-3 | 338 |
| 355 | What to do next: record the qualification cap; winner already scaling. | Reversal 1 | 346 |

**Left unchanged:** client approval optional, veto always honored, `offer_slate_approval`, client-facing QA rules, the rendering library, the Stack Resolution block, the pre-existing Inputs line "read through the campaign skill its `/stack-setup` pack provides" (not a rule this pass changes; left as-is).

## 4. `.claude/skills/social-proof-bank/SKILL.md`

| New line | Change | Rule | FNNL old wording at |
|---|---|---|---|
| 3 | Description (unquoted, no ": "; parses): SEED SET = the 5 to 10 companies that best fit the LOCKED offer (offer-fit wins first, researched exemplars to top up, exemplars alone for a brand-new offer); each group's seeds gate its TAM; missing copy-facts are collected in parallel and hold only the proof-led variant; seed+gate runs before `/tam-build` "for every group" (was "for the proven motion"). | Seeds; proof | 3 |
| 54 | Interaction policy: no AI API; synthesis in the Claude Code session or sub-agents; supersedes "an optional small AI pass gated by `/api-cost-governance`". | FNNL no-AI-API rule (A-Sales ported the same hunk) | 54 |
| 74 | Placement: only the seed set must be ready before `/tam-build` (proof-facts in parallel, never hold); lookalike seeded from these offer-fit companies. Fixes a pre-existing contradiction with line 76/96. | Seeds; proof | 74 |
| 76 | Hard exception = every group's 5 to 10 offer-fit seeds; stray ", (A" punctuation fixed to ". (A". | Seeds | 76 |
| 78 | Heading suffix "for the PROVEN motion" -> "for every group" (name "Seed-and-Proof Readiness" kept, so external references still resolve). | Seeds | 78 |
| 80-87 | Lookalike seeded from the companies that best fit the locked offer, through whatever tool fills `company_discovery` (lookalike stays the spine, operator ruling 2026-09-22). NEW "Seeds = the 5 to 10 companies that best fit the LOCKED offer" block: (1) offer-fit case studies/customers first (Jun 22); (2) top up with researched offer-fit exemplars found by Claude sub-agents (targeted `/deep-research` or WebSearch/WebFetch) **or the seed tiers of the company-discovery pack's skill where `/stack-setup` activated one (e.g. `/disco-like`'s exemplar tier, parenthetical only)**, marked client win or exemplar, never invented; (3) a no-proof offer seeded from exemplars alone, not a bare category filter. Seeds fit the whole offer set; the seed cap of whichever tool fills `company_discovery` applies (no DiscoLike number imported). | Seeds | 80 |
| 92 | SEED definition: the 5 to 10 that best fit the locked offer; researched exemplar. | Seeds | 85 |
| 96-97 | Gate: proven group = win that fits the locked offer (offer-fit wins first, exemplars to top up); no-offer-fit-case-study group seeded from 5 to 10 exemplars and routed to `/tam-build`'s EXPANSION motion as an exemplar-seeded lookalike (`discovery_motion = expansion`), supersedes "route it to the broad ICP filter"; broad filter only when no credible exemplar exists. | Seeds (lookalike stays the spine; broad filter last) | 89-90 |
| 147 | Procedure step 3: synthesis in the session or sub-agents (`/personalization-subagent-pattern`), no AI API; supersedes the AI-pass line. | no-AI-API rule | 140 |
| 155 | BLOCK tier: a `gap_block` holds only the proof-led copy variant, never the slice; proof joins later as an A/B arm. | Proof | 148 |
| 194, 207 | Header Seed Set: 5 to 10 offer-fit seeds marked client win or exemplar with "why it fits"; `seed_domain` only when the company fits the locked offer (exemplars live in the header). | Seeds | 187, 200 |
| 209 | `discovery_motion`: `proven` = lookalike led by offer-fit wins; `expansion` = exemplar-seeded lookalike, offer-led copy. **Explicit note that the flag tracks proof, not mechanism, so an exemplar-seeded group is never flagged `proven`** (campaign-strategy reads it as the copy-proof discriminator). Enum values unchanged. | Seeds; guard against fabricated proof in copy | 202 |
| 241-242 | What to do next: every group waits on its seed set; proof never holds it; **proof availability does not move a slice's priority or volume** (Sep 21 quote); supersedes "it weights each slice by whether real, segment-matched proof exists". | Proof | 234-235 |
| 257 | Related skills: `/api-cost-governance` AI-pass line replaced by the `/ai-model-routing` no-AI-API rule. | no-AI-API rule | 250 |

**Left unchanged:** the two copy-ready line definitions, Copy QA, the trigger bank, the Slack source (live uncommitted rule, kept), the client-fill sheet flow, the stop gates. Line 89 "Use an AI **segmentation** feature, if the tool filling the `company_discovery` slot offers one": a vendor's built-in clustering feature, not an Aaron rule; out of scope, left (see Does not map).

## 5. `.claude/skills/proof-asset-request/SKILL.md`

| New line | Change | FNNL old at |
|---|---|---|
| 23 | BLOCK holds only the proof-led copy variant, never the slice; slice ships offer-led; proof line joins later as an A/B arm (Sep 21 proof-PS quote); supersedes "copy for that angle is held until the proof returns". | 23 |
| 30 | On return: add the proof-led variant as an A/B arm (BLOCK) or upgrade copy (FLAG). | 30 |
| 34 | Autonomy: shipping hollow or invented proof is still a violation; shipping the offer-led version with no proof line is not. | 34 |

**Left unchanged:** the description (states no superseded rule), the one-line rule, the no-fabrication stance.

## 6. `outbound/reference/proof-asset-request.md`

| New line | Change | FNNL old at |
|---|---|---|
| 5 | The point: collect the real thing while the campaign ships on the offer alone; proof is one optional tested line (replaces "real evidence is what makes copy actually land"; also fixes "We be blunt"). | 5 |
| 22 | Gate definition: "Collect it, and ship the offer-led version meanwhile." | 22 |
| 32 | BLOCK holds only the proof-led variant, never the slice; supersedes "hold that slice until the proof returns". | 32 |
| 45 | Form-building rule 5: "a real number lets us add one short proof line and test whether it helps"; never tell the client proof is what gets replies. | 45 |
| 58-61, 96-97 | Client single-angle form rationale reworded ("Your campaign is going out on the offer itself ..."), plus a dated note under the template (doctrine §10, shortest winner had no proof). | 58-61, new note after 94 |
| 104 | After return: BLOCK angle gets the proof-led variant as an A/B arm (the slice was never held). | 102 |
| 117 | Bank-mode tiers: a `gap_block` holds only that row's proof-led variant. | 115 |
| 127-130 | Bank-mode form rationale reworded; removes "(the kind that actually get replies)". | 125-128 |

**Left unchanged:** what counts as a proof asset, the no-fabrication and naming rules, the Autonomy note's hard-rule violation for hollow or invented proof, bank-mode mechanics, the one pre-existing spaced dash (line 152, baseline 1).

---

## Checks (actual output, after the last edit)

```
.claude/skills/offer-intelligence/SKILL.md     | lines=746 crlf=746 first3=2d2d2d dashes=5  doubleparen=0 yaml=ok
.claude/skills/lead-magnet-brainstorm/SKILL.md | lines=664 crlf=664 first3=2d2d2d dashes=15 doubleparen=0 yaml=ok
.claude/skills/offer-test-slate/SKILL.md       | lines=355 crlf=355 first3=2d2d2d dashes=0  doubleparen=0 yaml=ok
.claude/skills/social-proof-bank/SKILL.md      | lines=258 crlf=258 first3=2d2d2d dashes=0  doubleparen=0 yaml=ok
.claude/skills/proof-asset-request/SKILL.md    | lines=41  crlf=41  first3=2d2d2d dashes=0  doubleparen=0 yaml=ok
outbound/reference/proof-asset-request.md      | lines=152 crlf=152 first3=232050 dashes=1  doubleparen=0 yaml=n/a
```
- Line endings: every file CRLF on every line (`grep -c $'\r$'` = line count). No BOM (first bytes `2d2d2d` / `232050`, never `efbbbf`).
- Spaced dashes vs baseline.tsv: 5/5, 15/15, 0/0, 0/0, 0/0, 1/1. `git diff -U0 -- <six files> | grep '^+' | grep -c -E " [em dash] | [en dash] "` = 0 (no added or touched line carries one).
- YAML: the five SKILL.md frontmatters parse with `yaml.safe_load`; each description is one line.
- Label parens: `grep -c "2026-09-22); supersedes"` = 0 in all six.
- `git diff --stat` (vs HEAD; social-proof-bank also carries earlier uncommitted Slack edits from other sessions): 6 files, 250 insertions, 182 deletions.

## Grep results (sec. 10 list, case-insensitive, all six files)

Hits that remain, each correct in context:
- `lead-magnet-brainstorm:41` `proposes times only when`: inside the supersedes quote.
- `lead-magnet-brainstorm:219` `80%`: brand styling "~80% of the way there" in the K build path (unrelated to yield).
- `lead-magnet-brainstorm:435, 657` `primary plus at least one`: inside supersedes quotes.
- `lead-magnet-brainstorm:446` `never retires it`: inside the pinned 6k supersedes clause.
- `offer-test-slate:98` `size the list to the offers`, `8,000 to 12,000`: inside the supersedes quote.
- Group-specific sweep (`during the test`, `full volume`, `coverage wave`, `first flight`, `test scale`, `handful`, `Test First`, `union`, `keeps its cell`, `a few thousand`, `300`, `6+`, `small AI pass`, `api-cost-governance`, `hold that slice`, `weights each slice`): every remaining hit is a supersedes quote, the "formerly" heading name / archive note (`Test First`, kept so old cross-references still resolve), "the first wave sends at full volume" (the new rule), or the 300-send raw-reply trigger (kept on purpose; each line says it never calls an offer broken, ~1,300 per arm).
- No hits: `size the validation list`, `size the test list`, `at least arm 1`, `not to scale`, `trim the wave`, `capacity trim`, `Signal collection is a MUST`, `Collection Completeness`, `varying only the first name`, `both required Email 1 variant columns`, `Wait 21 days`, `21-day window`, `21 days`, `21-day`, `Tue to Thu`, `Tue-to-Thu`, `Tuesday or Thursday`, `winning slice`, `raise the ceiling to cover full collection`, `shared pool`, `pool-allocation`, `top 10`, `email_1_b`.
- Vendor names: the only brand in the six files is the pre-existing parenthetical `/emailbison-positive-reply-scoring` example at offer-intelligence:496 (untouched, conditional form). No brand, `locked-tech-stack.md`, pool language or DiscoLike number was introduced.

**`offer.qualification` shape, verified by grep, not by eye:** the inline form `{criteria: [...], form_fields: [...], free_unit_cap_per_week: <n or null>}` occurs once (lead-magnet-brainstorm:284, the definition); the YAML block keys are identical in both files (lead-magnet-brainstorm:577-580 and offer-test-slate:305-308: `qualification:` / `criteria: [<plain fit test>, ...]` / `form_fields: [<question>, ...]` / `free_unit_cap_per_week: <n or null>`), and each arm carries `qualification: <same shape as the primary's ...>` (lead-magnet-brainstorm:609). Re-check after the two final edits: lead-magnet-brainstorm lines=664 crlf=664 dashes=15 doubleparen=0 yaml=ok; offer-test-slate lines=355 crlf=355 dashes=0 doubleparen=0 yaml=ok.

**Pinned names used, checked against sec. 6:** 6a formula string (lead-magnet-brainstorm:435 verbatim, plus the per-segment clause); `offer.qualification` shape `{criteria: [...], form_fields: [...], free_unit_cap_per_week: <n or null>}` (identical in lead-magnet-brainstorm and offer-test-slate); `run_state.capacity_request` (field name only, no block written here; the block is the strategy group's); 6k retirement (lead-magnet-brainstorm:446 verbatim); `offer.icp_inclusion`, `offer.title_stack`, `offer.segments[].offer_market_proven`, `offer.segments[].scale_review`; `confirmed_capacity_per_week` name kept.

## `_vendor-library` files holding the same rule (not edited)

- `_vendor-library/skills/discolike/disco-like/SKILL.md:278` ("the seeds ARE the group's validated case-study / customer companies") and `:286` (Tier 2 exemplars chosen for the ICP, not the locked offer). Same seed rule as social-proof-bank's old text; if the pack is ever activated it should read "the 5 to 10 that best fit the locked offer".

## Does not map

- `social-proof-bank:89` recommends using "an AI **segmentation** feature" of whatever tool fills `company_discovery` to cluster a customer list into groups. Not an Aaron rule, and not settled by sec. 3. Recommendation: coordinator/operator to decide whether a vendor's built-in AI segmentation counts under the no-AI-API rule (it is the tool's own feature, not an AI API call we make); left unchanged.

## Cross-file follow-ups (other groups' files; not edited)

1. **copy** `campaign-copywriting:373` ("`/lead-magnet-brainstorm` -> Test First, Ask About Scale After") and `:459` ("full-volume capacity is asked after the test in `/offer-test-slate`"); `outbound/reference/outreach-copy-framework.md:267` (same phrase). Point to the lock check ("Deliverable at Send Scale": a scale note or `offer.qualification`). Copy should carry the material eligibility now written into `lead_magnet_details` ("for teams that fit X"). The old heading name still resolves because the new heading keeps "(formerly ...)".
2. **strategy** `campaign-strategy:124` still cites "`/lead-magnet-brainstorm` Test First, Ask About Scale After" (rename to Deliverable at Send Scale). `campaign-strategy:270` still says `expansion` = "(broad ICP filter for a net-new segment, or a no-proof new offer)": expansion is now an exemplar-seeded lookalike with the broad filter as the last rung (keep the proof discriminator as is). Strategy should write `validation_arms[].status: hold` with the 6k meaning and apply only shared disqualifiers to the shared list (lead-magnet-brainstorm:440, :509, :612).
3. **orchestration** `cold-email-kickoff:342` still says the seed set is "from the client's case-study / customer companies" and routes a no-case-study group to "EXPANSION motion (broad ICP filter ...)". Should read: 5 to 10 companies that best fit the locked offer (offer-fit wins first, exemplars to top up), expansion = exemplar-seeded lookalike, broad filter only when no credible exemplar exists.
4. **list-a** `icp-onboarding:135` ("`/social-proof-bank`'s Seed-and-Proof Readiness gate reads them before a proven-motion group's TAM is built"): the gate now applies to every group and the seeds are the offer-fit ones. `tam-build` already reads `offer.icp_inclusion` and `offer.title_stack` (seen at tam-build:122, 311, 379, 419); please confirm its EXPANSION motion is exemplar-seeded to match social-proof-bank:96-97 and :209.
5. **unowned** `client-intake-form:256` ("before a proven-motion group's TAM is built"): same wording drift as item 4; no group owns this file.
6. **testing / replies**: `/experiment-design` now receives Iterate as well as Swap from offer-intelligence validation mode, as a fresh multi-offer flight (list and copy frozen). `/lifecycle-copy`: where `offer.qualification` exists, the disclosed form rides in the direct/trial/service reply, and "If they don't qualify" is the standard-offer reply (lead-magnet-brainstorm:375-379).
7. **memory** (out of scope here): any proof-asset or social-proof-bank memory that says a BLOCK holds a slice or that proof weights slices.
8. **later pass**: renaming `/lead-magnet-brainstorm` to a front-end-offer name across the referencing files, the `offer.lead_magnet*` fields and `lead-magnets.md` was deliberately NOT done (sec. 3: no folder or field rename).
