# Aaron Process Alignment: target flow and change spec (FNNL port)

**What this is.** The single spec for making FNNL's cold-outbound flow follow Aaron Shepherd's process from A to Z, in the phase order the operator set on 2026-09-22. It is the FNNL adaptation of the A-Sales spec of the same name (A-Sales commit `56ff4a2c`), ported on 2026-09-23. The decisions are the operator's of 2026-09-22 and apply here unchanged; only the tool and infrastructure wording is FNNL's. The tech stack is exempt: FNNL's tools come from `outbound/stack-contract.yaml` and each client's `run_state`, and skills name capability roles, never brands.

**Operator directive (Luke, 2026-09-22):** "strictly follow what Aaron does, except for the tech stack", "find every small thing that contradicts his setup and remove those", with the phase order: onboarding, then research, then offer, then the 5 to 10 best-fit companies for that offer, then a lookalike built from them, then copy, launch and replies. On 2026-09-23 the operator asked for the same alignment in this workspace, with every decision below (including the seven reversals) already approved.

**Evidence base (all on this machine, in the A-Sales workspace).** The A-Sales spec `outbound/reference/working-docs/_AARON-PROCESS-ALIGNMENT-2026-09-22.md`, its evidence folder `_aaron-alignment-2026-09-22-evidence/` (Aaron's A-to-Z brief with dated quotes, six contradiction audits, eight per-group change logs), Aaron's corpus (`.claude/skills/ask-aaron/`, mirrored here), his raw transcripts (`Documents/Aaron-Shepherd-Transcripts/`) and his Sep 21 video transcript (`Personal GTM System/content-engine/creator-study-bank/raw/aaron-shepherd/youtube/13txftPcI2I/`). All of Aaron's numbers are self-reported. The FNNL port's own rules and change logs sit beside this file in `_aaron-alignment-2026-09-22-evidence/`, and the pre-change copy of every edited file is in `outbound/_archive/aaron-process-alignment-2026-09-23/`.

---

## 1. The verdict on the operator's hypothesis

**Half right.** Aaron does test several offers at the start, all at once: "When you're coming up with your offer, you're always going to want to test like three or four" (May 4), "start with four different offers and position them the exact same way" (Feb 23). His sizing rule is about one offer per 2,000 leads, so 10,000 leads means five offers (Apr 6). The flow's 2,000 to 3,000 per offer already matched his number.

**What was really wrong** is everything around that number:

- The flow sized the list to the offers (3 to 4 offers need 8,000 to 12,000 contacts). Aaron sizes the offers to the list: the whole mapped list goes out and the offer count follows it.
- The rest of the TAM waited behind a serial chain: a validation flight, a fixed 21-day window, the pooled flip, a fair-pick rule, a client scale review, and only then the coverage wave. Aaron sends the whole mapped TAM of one vertical in days (Sep 21: 19,600 leads, about 96,000 sends in one week, one offer, one vertical).
- Losing variants could only die against an absolute line and "another arm's win never retires it". Aaron switches losing angles off by hand inside the live campaign (Mar 9).
- Sending capacity was trimmed to fit instead of sized to the send target. Aaron sizes capacity before launch (Sep 21: about 10,000 sends a day, 500 per domain, so 20 domains).
- The reply side had no 5-minute call, no qualification step and no pre-call confirmation page, which are the parts Aaron calls the most important (Sep 21).

---

## 2. The target flow, in phase order

### Phase 0: Onboarding
Intake and clarifying questions (`/cold-email-kickoff`, `/client-intake-form`, `/icp-onboarding`, with FNNL's client Slack check). The intake ICP is a **starting point, not a ceiling**. Ask for the buying function and seniority, not one job title; the full title stack is generated from the offer.

### Phase 1: Research (before any offer or list work)
`/offer-intelligence` discovery mode. Extend and clarify what onboarding captured, then find **real problems in the buyers' own words**: the client's won and lost sales calls first; real public opinion (review sites, forums, LinkedIn and X, Reddit); competitor offers and what competitors fund in paid ads (Meta Ad Library, LinkedIn ads). **Heavy competitor ad spend behind an offer is evidence of demand**, never a reason to close an offer type. In an unfamiliar market, Claude sub-agents do the research.
**FNNL form:** research runs on Claude Code only (`/deep-research`, sub-agents, WebSearch and WebFetch; the no-AI-API rule). Reddit is read only by operator paste, otherwise logged as unread. Live X reads do not exist: WebSearch where it returns public posts, and the gap is logged.

### Phase 2: Offer
`/lead-magnet-brainstorm` (reframed as the **Front-End Offer Builder**; a lead magnet is one of Aaron's three buckets, never the default; `direct_offer` means no front-end offer at all, just the main service) then `/offer-test-slate`.
- Generate across the three buckets (service-based, service-delivery-based, lead-magnet or asset-based), no caps, every candidate visible and ranked.
- **First-wave offer count = `max(3, floor(qualified_contacts / 2000))`**, where `qualified_contacts` is the wave's send-eligible contacts, capped at the number of qualifying candidates (fewer than 3 only when fewer qualify, and the report says so). The list is never shrunk to fit a chosen number of offers. For `offer.segments` clients the formula runs per buyer-type segment.
- **Deliverable at send scale:** at lock each offer records a scale note or an `offer.qualification` rule (`{criteria: [...], form_fields: [...], free_unit_cap_per_week: <n or null>}`, costly front ends only). An offer with neither ranks down and stays visible. Material eligibility is stated honestly in the offer.
- **The offer writes the list definition:** `offer.icp_inclusion`, `offer.title_stack`, beside `offer_fit_disqualifiers`.
- **An existing offer that validation mode rates Go** needs no new arms; its first wave tests segments, data sources and positioning variants.

### Phase 3: Seed companies, then the lookalike TAM
`/social-proof-bank`, `/tam-build`, `/lead-scoring`.
- **Seeds = the 5 to 10 companies that best fit the locked offer:** offer-fit case studies and customers first, topped up with researched offer-fit exemplars; a no-proof offer is seeded from exemplars, never a bare category filter.
- **The lookalike stays the discovery spine** (the company discovery tool's lookalike search), widened while fit holds, broad ICP filter as the last rung. AI-generated keyword stacks (written by Claude Code, never an AI column) replace industry taxonomy filters; `industries_out` stays as named exclusions.
- **Map the whole TAM:** every ICP decision-maker on every company, every title variation.
- **Signals are conditional (Collection Scope rule in `/data-point-discovery`):** catalog everything; always collect firmographics, fit, offer-relevance fields, contacts and the free fields that come with the rows; pay for a why-now or intent signal only when the offer cannot find its buyers from firmographics or a live test needs it. **`full_enriched` = the whole qualified universe mapped, fit-scored (ICP + offer) and its contacts discovered; signal columns are optional.** Over budget, trim signals first, never companies or contacts.
- **Per-contact copy variables** (at most two per email): `sells_to_vertical`, `service_offered`, optional `own_best_client`, derived by Claude sub-agents from the prospect's site with an evidence URL.
- **Lead scores set send order, never a hold.** P1 to P5 all go out in the first wave.
- Lists are still built in the list workbench by webhook with zero workbench credits (FNNL rule, unchanged).

### Phase 4: Campaign and test design, and capacity
`/campaign-strategy`, `/lead-source-strategy`, `/experiment-design`, `/mailbox-mix-strategy`.
- **The first wave is the whole qualified TAM at full volume** (the Offer-Validation Wave keeps its name). Offer arms are **equal cells launched together**; **every offer runs across every first-wave segment**, so the read is an offer x segment matrix. The desk-ranked primary gets no head start. Creative Ideas moves to the positioning phase after the winner pick.
- **Data sources in parallel:** up to two or three sources with disjoint rows tagged `source_arm` (`source` still names the vendor).
- **Sold-to stays the message axis;** its value may also ride in the offer sentence as `sells_to_vertical`.
- **Capacity is sized to the volume, never trimmed (FNNL form).** FNNL provisions per client, so Aaron's own move applies directly. `/campaign-strategy` records `run_state.capacity_request` (`daily_sends_needed` = contacts x steps / ~5 sending days; `days_to_cover_tam` in Monday-to-Friday sending days; `requested_on`; `allocated_daily_sends` = what the client's warmed, active fleet actually delivers). `daily_sends_needed` becomes `/mailbox-mix-strategy`'s default daily send target inside its 2,000 to 30,000 band, or the size of the pool group `/mailbox-pool-staging` assigns. A smaller fleet (a smaller approved setup total, a small pool group, a fleet still warming) stretches the runway; offers and TAM rows are never cut. FNNL's per-mailbox rates, rotation halves, active fraction and warmup are unchanged, and mailbox infrastructure still needs the operator's approval of the setup total, outside the $100 run budget.
- **Send Monday to Friday.** Tue to Thu only as a tested variant or for a genuinely tiny TAM.
- **Two emails by default at every TAM size;** a third only in a genuinely small market (roughly under 3,000 qualified contacts, a house threshold) or as a tested arm. Email 3's gap is 3 days (Day 0, 3, 6).
- **Kept:** the ≥500-company floor (per offer cell; a too-small segment folds in as a tagged bucket), few big campaigns, signal slices as a bounded test allocation after an offer is proven.

### Phase 5: Copy
`/campaign-copywriting` and the copy references. Framework A stays the default (25 to 35 words, offer-first, soft permission CTA, one proof point at most).
- **Email 1 runs three variants by default:** `email_1_a`, `email_1_b`, `email_1_c`, one variable changed per variant, more letters allowed. The export gate checks every declared Email 1 column; the upload wires one variation per column on the locked sending platform and stops rather than dropping Variant C.
- **Up to two per-contact variables** inside the offer sentence only.
- **Allowed as labelled arms:** a relevance question opener at any awareness level when literally relevant and honest; a soft conditional statement close; a no-number version; a proof PS as an A/B pair against no PS.
- **CTA whitelist adds** "Would that be worth a quick test?", "Would that be useful?", "Would that be helpful?".
- **Follow-ups: three directions** (strip back, a different value prop or mechanism, add to it); a follow-up CTA may be a conditional statement; the final follow-up may run as a new thread as a logged arm, at most three touches (not runnable on the upload path yet: plan it, ship the threaded version).
- **Subjects:** "your [the offer's own object]" and `fyi {{first_name}}` pass. Deliberate spoken sentence starts pass the grammar rule.

### Phase 6: Reply machine, built before launch
`/lifecycle-copy`, `reply-scoring-core.md`, the two DOCX presentation skills, and the sending platform's reply surface (conditional on `run_state.sending_platform`).
- **Gate D, reply readiness, before the operator's Start:** `interested-reply.md` with category templates and `## Call Script`; `pre-call.md` with `## Confirmation Page` (FAQs from real objections) plus the pre-call sequence; the offer's `offer.qualification` where one applies; a named speed-to-lead owner (`run_state.speed_to_lead_owner` and the `Speed-to-lead owner:` header line); a 5-minute target.
- **Reply by offer type:** a promised asset is delivered first, no times (Jul 13, R03); a direct, trial or service offer gets two specific times plus the calendar (Sep 21). Costly front ends route the yes through the qualification form. No blanket booking link.
- **Speed to lead:** the platform's interested-reply webhook raises the alert where it offers one; **the always-on receiver does not exist yet**, so the reply sweep runs several times a day and the 5-minute call is a target. Call timing on a plain asset request stays the house reading of ledger R20.
- **`meeting_book_rate`** = meetings booked / positive replies (the three positive classes; denominator labelled an assumption), from the client's booking calendar or CRM, phone-booked included (FNNL has no CRM chosen, so the count may be operator-reported, and the report says which). Aaron self-reports about 25%, aiming for 30%. Time-agreed replies per 1,000 first touches still pick arms. Every unanswered positive is listed, and response latency is audited.

### Phase 7: Launch, read, cut
- Launch every cell together. Read daily for the first week.
- **Read window: floor first, then sequence plus grace.** An arm is read once it has reached its ~1,300 first-touch floor AND its last contacts have had the 2-email sequence plus about 7 to 10 days of grace. Never read early because a window passed.
- **Losers are switched off by the DEAD line and by the winner pick, never by a ratio.** At the winner pick (matched cell counts), HOLD arms stop receiving new first touches, their live sequences finish, the untouched TAM goes to the winner, and the parked arm's read is recorded as unresolved.
- The PROVEN formula, the fair pick, the farming-interest and magnet-inflation guards stay.

### Phase 8: Scale the winner, then positioning, then CTA
- **The winner goes to the rest of the TAM immediately.** `/offer-test-slate` scale-review mode is a results report plus a review of `offer.qualification`. **Carve-out:** where the client literally supplies the deliverable (their trial seats, their people, their stock), the client's confirmed capacity still caps sends for that offer.
- Positioning variants of the winner start inside the big campaigns as soon as it is picked, then CTA and delivery, subject lines last.

---

## 3. What this supersedes

| Superseded rule | Replaced by |
|---|---|
| Size the validation list to the offers (8,000 to 12,000 for 3 to 4 offers) | Offers = `max(3, floor(qualified_contacts / 2000))`; the whole TAM goes out |
| First wave = primary plus at least arm 1; extra arms queue for capacity | All offers launch together; only arms beyond the formula queue |
| The primary alone carries Creative Ideas, Lookalike and sold-to | Every offer across every first-wave segment; Creative Ideas after the winner |
| First wave "not to scale"; coverage waits for flip plus client scale review | Offer test runs inside the full send; winner scales immediately |
| Coverage volume capped at the client's confirmed yeses per week | Qualification after the yes; the client's cap binds only where the client supplies the deliverable |
| "Another arm's win never retires it" | Winner pick retires HOLD arms from new first touches |
| Fixed ~21-day read window | Floor first, then sequence plus grace |
| Capacity trim at launch | `run_state.capacity_request`; the fleet is sized to it; the runway stretches instead of cuts |
| Signal collection is a MUST (Collection Completeness) | Collection Scope: conditional collection, free fields still ride along |
| Tue to Thu sending | Monday to Friday |
| Sequence length by TAM | Two by default, three in a small market or as an arm |
| Email reveal only on a winning slice | In the first wave the confirmed slice is the whole eligible TAM |
| 80% survival stop on email yield | Removed; judge sources on fit, bounce and reply |
| First-name-only per-contact variation | Up to two per-contact variables already in the data |
| Two Email 1 variants | Three by default (`email_1_c`) |
| Direct-offer yes gets no proposed times | Direct, trial, service offers: two times plus calendar |
| Proof gap holds a slice | Only the proof variant waits |
| 300 sends is enough to call an offer broken | ~1,300 per arm |

**The seven reversals of dated operator directives, all approved by the operator on 2026-09-22:** winner scales immediately (scale review no longer a volume gate); offers scale to the list; capacity sized to the volume, never trimmed; winner pick retires undecided arms; signal collection conditional; direct, trial or service yes gets two times plus the calendar; read window floor first then sequence plus grace.

**Rejected on purpose:** any ratio-based relative cut (at ~1,300 contacts an arm as good as the leader shows 2 or fewer positives about 37% of the time, Poisson mean 3.25); making the lookalike non-mandatory; sold-to as a variable-only default; removing or auto-approving the TAM Phase A sample GO gate.

**Kept unchanged:** FNNL's stack contract and the six-tools rule; the $100 standing run budget and its stop-and-ask rule (a whole-TAM reveal over it still stops and asks); zero list-workbench credits; the no-AI-API rule; the ≥500-company floor; the PROVEN formula and the ~1,300 floor; the farming-interest and magnet-inflation guards; Framework A; one proof point at most; human approval of every send; the operator presses Start; deliverability mechanics (rotation halves, per-mailbox rates, warmup and its 21-day ready gate); signal routing; the contact-signal ranking inside the bounded signal allocation.

---

## 4. Open items for the operator (not decided in this pass)

1. **Run budget for a whole-TAM reveal.** Revealing and verifying every eligible contact in one pass will usually cost more than the standing $100. The flow plans the whole reveal and stops at the budget line. Raising the default is a spend call.
2. **Sending capacity.** FNNL's infrastructure slots are held and deferred, so no client fleet exists yet. The capacity request now states the fleet the one-week pace needs; until a fleet exists, the pace is a plan, not a fact.
3. **Webhook receiver for speed to lead.** No always-on host exists. Until one does, the 5-minute call is a target, not a mechanism.
4. **The new-thread final follow-up arm** is allowed in the copy rules, but no upload path in FNNL wires a non-threaded final step yet.
5. **Global `~/.claude/CLAUDE.md` signal-architecture rule 3** still says email is revealed "on the winning slice". It is shared across workspaces and left for the operator.
6. **Aaron corpus fold.** His Sep 21 video is staged for the persona corpus in `Personal GTM System`; it is folded through the canonical copy and the mirror sync, not here.
7. **Parked vendor packs** in `_vendor-library/` (EmailBison, Smartlead, DiscoLike) still carry the old upload, reply, spintax and seed rules. They are inert and not FNNL's platform, so they were not edited.
8. **`outbound/scripts/list_quality_scorecard.mjs`** still scores the old way (always scores dimension 5, fixed weight 12, no row cleanup or domain check). The skill is updated; the script needs a rewrite before it is trusted.
9. **`merge_gen.mjs` and `qa_send.mjs`** now carry `email_1_c`, but they are legacy tools built on the retired four-email shape with a gate that requires a question opener. No skill calls them. Archive or rewrite.
10. **Email 3 `delay_days` (now 3)** is unverified on FNNL's sending platform; if it counts from Day 0, write 3 and 6.
11. **Flagged, outside this pass:** a discovery tool's built-in "AI segmentation" (`/social-proof-bank`) and a sending platform's built-in AI reply drafting may conflict with the no-AI-API rule; skills refer to `/cold-email-inbox-tracker`, which does not exist in FNNL; the default `execution_mode` disagrees across files (review_gates in kickoff, auto_execute elsewhere).

---

## 5. How the FNNL port was done (2026-09-23)

- **Method.** Nine parallel edit agents, one per file group (strategy, testing, offer, list-a, list-b, copy, replies, orchestration, cleanup), each diffing A-Sales's pre-change archive against commit `56ff4a2c` and making the same change in FNNL's own wording. Shared rules and every per-group change log are in `_aaron-alignment-2026-09-22-evidence/`. Pre-change copies of all 51 edited files are in `outbound/_archive/aaron-process-alignment-2026-09-23/`.
- **Where the A-Sales EmailBison skills went.** FNNL has no active platform pack, so their process rules landed in the platform-neutral files: Email 1 variant wiring and the export gate in `/campaign-copywriting`, `/personalization-subagent-pattern` and kickoff's upload step; reply routing, the speed-to-lead chain, `meeting_book_rate`, the unanswered-positives list and the latency audit in `reply-scoring-core.md`, `/lifecycle-copy` and `/cold-email-weekly-rhythm`.
- **Where A-Sales's `locked-tech-stack.md` process lines went.** Capacity: `/campaign-strategy`, `/cold-email-kickoff`, `/mailbox-mix-strategy`, `/mailbox-pool-staging`. Email finding covers the whole eligible TAM in the first wave: `/email-waterfall`, `/data-point-discovery`, `/lead-list-tech-stack-research`.
- **FNNL-only files fixed** (no A-Sales counterpart, same decisions): `/client-intake-form` and `/client-onboarding-call-summarizer` (buying function and seniority, not one title; offer-fit seeds), `social-proof-bank-client-fill-template.md` and `outbound/scripts/social_proof_bank_to_xlsx.py` (no claim that proof drives replies), `/cold-email-campaign-sequence-docx-presentation` (two-email shape, three Email 1 variants), `/auto-research-public`, `conversational-copy-examples.md`, `list-building-play-library.md`, `/campaign-approval-brief` and both copies of its template.
- **One addition beyond A-Sales, reversible:** the approval brief's "What We Need From You" gained a conditional ask for Gate D inputs only the client holds (who calls a yes, the booking calendar, and qualifying questions for a trial, service or custom-work offer).
