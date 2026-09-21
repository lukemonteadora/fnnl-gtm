# First-Wave Offer-Validation Defaults

The `offer_market_proven` flag controls campaign strategy and the flip criterion. It no longer selects a different Email 1 copy shape. Framework A in `outreach-copy-framework.md` controls the initial cold touch in every wave.

Everything here is keyed off the `offer_market_proven` boolean, never off a wave number. This matters: `/campaign-strategy` already uses "Wave 1" to mean the *coverage* wave that runs *after* validation. So "first wave" in the operator's sense is the **Offer-Validation Wave**, and it is selected by `offer_market_proven = false`, which also means a returning client with an already-proven offer correctly skips straight to Proven-mode.

This is Eric's own model and it already aligns with this system's `offer-validation-first` doctrine (validate the offer, lever 1, before optimizing the list, lever 2). The full Eric corpus **is** carried in this workspace as of 2026-09-18: `/ask-eric` holds it, and his deliverability and vendor-benchmarking doctrine is encoded in `eric-deliverability-doctrine.md`. Route there for anything this file does not cover. (An earlier version of this line said the corpus was absent and told skills not to route to it. That was true when written and is now wrong.)

---

## The two modes at a glance

| | **Eric-mode** (validation, `offer_market_proven = false`) | **Proven-mode** (coverage/scale, `= true`) |
|---|---|---|
| Goal | Prove the offer gets replies, cheaply and fast | Scale the winner, maximize proven-signal coverage |
| Campaigns | Broad value-prop + Creative Ideas + Lookalike + sold-to splits on the locked primary offer, with the broad list split between the primary and at least one validation arm from `offer.validation_arms` (same list and copy skeleton, judged per arm; Aaron tests three or four offers, doctrine §5). Message differentiated by segment (sold-to), minimal per-contact personalization | Full signal-slice coverage portfolio (≥500-company floor, operator directive 2026-07-12); copy held constant so a reply-rate difference attributes to the signal |
| Copy register | Framework A initial offer | Framework A initial offer |
| Length | Email 1: 25 to 35 body words by default (never so short it reads like a bump; longer only as a logged saturation A/B arm) | Email 1: 25 to 35 body words by default (same floor and saturation arm) |
| Personalization | Minimal. The offer is the spine, not the personalization | Signal-based, at SLICE level (per-contact copy personalization was retired 2026-07-05; see `/campaign-copywriting` Hard Rule 34) |
| Sequence | 2 emails, up to 3, sized by TAM (see below) | One thread, 2 to 3 steps (the 4-step / two-thread structure was retired 2026-07-05) |
| CTA | Email 1: one primary ask, a soft permission question by default | Email 1: one primary ask, a soft permission question by default; forward-looking follow-ups |
| Proof | Name recognizable proof, describe unrecognizable proof generically | Segment-matched proof from the social-proof bank |
| Send days | Tue to Thu, drop Friday | Per schedule |
| Read | Eric's 3 metrics + contacts-per-positive band (below) | Full experiment-design + weekly-rhythm |

---

## Eric-mode copy defaults (the actual rules for the validation wave)

Apply these when `offer_market_proven = false`. Everything also passes `outreach-copy-framework.md`, `spam-word-checker.md`, and `cold-email-copy-best-practices.md`.

1. **Length and structure: Framework A controls (operator-approved Aaron alignment, 2026-09-21; doctrine §9, ledger R07).** "Framework A" is this system's house name for Aaron's measured winner shape from his 1.5M-email study (his own letters are not stable across videos, doctrine §0). Email 1 is 25 to 35 body words by default, 2 to 3 sentences, one to two lines plus an optional PS, with one primary ask (one CTA question by default, never stacked asks). It opens straight on the specific free deliverable: no pain, no observation, no preamble. It shows the sender/prospect workload split (the three to four real tasks we handle plus the one small thing they do, in parentheses or in prose) whenever that reflects the real process, and never invents one. Floor: never so short it reads like a bump. A longer version runs only as a logged A/B arm for a solution-aware or saturated market.
2. **Copy is offer-led, not personalization-led.** The default is the broad value-prop campaign and the Creative Ideas Campaign ("if I were in your shoes, here are 3 ways I'd use this," each idea constrained to a real capability). Under Framework A the three ideas travel with the deliverable, sent after the yes, rather than sitting as bullets in the body (`/campaign-strategy` Required Campaign Types). Minimal or no per-contact personalization. The offer carries the email. Personalization is a Proven-mode multiplier, never the thing under test here.
3. **Sequence length by TAM size** (replaces the always-4-step default for this wave, and this is a deliberate change to flag). **UNRESOLVED, flagged 2026-09-18: the 1-email case below conflicts with `/campaign-copywriting` Hard Rule 18, which floors every campaign at 2 steps. Eric's rule and the governed contract disagree and the operator has to rule; until then Hard Rule 18 governs, because it is the governed contract. The 2-email and 3-email cases are unaffected.** Huge TAM (roughly 500k+) = 1 email, then re-blast the whole TAM later rather than follow up. Mid TAM (~50k to 100k) = 2 emails. Small TAM (under ~50k) = 3 emails. Email 1 carries the load; do not pile on touches to validate an offer. **At high volume this logic extends to Proven-mode coverage campaigns too, not just this validation wave:** every follow-up consumes the same daily send capacity as a first-touch, so on a big TAM a shorter sequence buys more first-touch reach per day. Bigger TAM → shorter sequence → more of the list reached per day, given the warmed fleet.
4. **P.S. is optional, does one job, and is never a second pitch.** Under Framework A it carries either the relevance demoted from line one (the opening-line swap, examples §1.1), one same-mechanism near-twin proof point in plain numbers (examples §6), or a casual risk-elimination or reason-it's-free line (examples §5), and it keeps the email inside the Framework A length default.
5. **Proof by recognizability.** Name a proof client only when the reader will recognize it; when they will not, describe the outcome generically instead of naming a company they cannot place. This sharpens the existing "omit irrelevant proof" rule. Still bound by the Proof-Asset Gate and Capability Truth. Aaron's limits ride with it: one proof point at most, in the PS or email two, never in lines one or two, a same-mechanism near-twin with a plain legible number (doctrine §9, examples §6). Describing an unrecognizable twin by its type is fine; a claim that fits anyone ("we've worked with hundreds of clients" `[ANTI]`, examples §6) is not.
6. **Never write "I saw you're hiring for X"** (or any bare signal-naming opener). It is table stakes and gets the sender written off. If a hiring or similar signal informs the angle, use the underlying pain it implies, never the signal by name. (This is the implication test, applied to the one signal operators most often botch.)
7. **CTA: one primary ask, a soft permission question by default (operator-approved Aaron alignment, 2026-09-21).** The default is "Would that be worth sharing more?" `[AS]` with his variants (examples §4), and never stacked asks (doctrine §9: "Give one primary action"). The statement-only `Just reply "Yes"...` opt-in is reserved for later steps.
8. **Subject line:** 2 to 4 words, all lowercase, 0 to 2 variables (Aaron says "one to two variables" and also shows zero-variable subjects; operator-approved Aaron alignment, 2026-09-21), curiosity plus relevance, never deceptive (no "FW:", fake thread, emergency, invoice or account fault; doctrine §9). Engineer the subject and preview text together for phone rendering. Subject lines are the lowest-leverage lever, so they are tested last (`/experiment-design`).
9. **Send Tuesday to Thursday, drop Friday** (Eric's data). For a very small TAM, restrict to Tue/Wed/Thu.
10. **Volume: anchor on the broad campaign, size to the read.** Cold email is a volume game, but the volume lives in the broad value-prop anchor, not in every slice. The validation wave's broad campaign should be as large as the TAM allows (hundreds to thousands of contacts); niche slices are legitimately small. Size the wave so each campaign clears the ~300 first-touch-send read floor. If the enriched TAM cannot support that (a genuinely small niche), that is an ICP/offer decision to surface (widen titles / the buying committee, headcount, geography, adjacent verticals, or accept a small-niche read), never a reason to launch a pile of tiny slices. Full rule: `/campaign-strategy` Volume adequacy.

**Already present, do not duplicate:** the Creative Ideas and Lookalike campaigns, offer-validation-first sequencing, minimal per-contact personalization, broad/focused/niche tiering, Capability Truth, Proof-Asset gates, and the Framework A copy gate. The phase flag does not override the cross-channel initial-copy rule.

### Sold-to IS the message (not a contradiction with "minimal personalization")

Two different layers, easy to conflate. Eric holds both at once, and so does `/campaign-strategy`.

- **Sold-to is a MESSAGE-segmentation axis.** Who a company sells to (legal teams vs restaurant owners) changes the buyer, the pain, and the proof, so it changes the message. Each sold-to segment gets its OWN copy and proof. This is Eric's "the list is the message," and it is the validation wave's PRIMARY message-differentiation (the flagship message-differential axis in `/campaign-strategy`). It is fully alive in Eric-mode.
- **"Hold copy constant" is a DIFFERENT axis, and it belongs to the COVERAGE wave.** There you vary only the SIGNAL and hold the copy constant so a reply-rate difference attributes to the list, not the copy. That constancy is for signal attribution; it does not apply to sold-to and it is not a validation-wave rule.
- **"Minimal personalization" means minimal PER-CONTACT personalization** (no per-prospect AI first lines), NOT one message for the whole wave. Segment-level message differentiation by sold-to is segmentation, not personalization, and it stays. Per-contact personalization is the wave-2/3 multiplier.

So the validation wave holds the OFFER constant within each campaign (the offer varies only across the validation arms' cells on the broad list, where everything else is held equal), differentiates the MESSAGE by sold-to segment (each with its own pain and proof), and keeps per-contact personalization minimal. Eric holds "the list is the message" and "hold copy constant to isolate a signal" simultaneously because they act on different axes: `/campaign-strategy`'s message-differential split test governs which slices get their own copy (sold-to does), while the ≥500-company floor governs which slices launch. Nothing here overrides that.

---

## The flip criterion: what turns `offer_market_proven` to true (or kills the offer)

The whole phase gate is inert without a concrete exit. Eric-mode does not end on a hunch; it ends on a number.

**Minimum sample, and pool within each arm (corrected 2026-07-17; per arm since 2026-09-21).** Judge the flip **pooled within each arm**, never across arms and never per campaign: each arm is one offer, so pool that arm's first-touch contacts into one count `n` (the primary's pool includes the other validation campaigns it carries) and its positive replies into one count `k` (a positive from any sequence step, once the ~21-day sequence window has run). The old "~300 first-touch sends per campaign" floor was borrowed from `/cold-email-weekly-rhythm`, where 300 gates the ~1 to 3% **raw** reply rate; a **positive** reply at the 1-per-400 band is 4 to 12 times rarer, so 300 sends decides nothing (a good offer shows zero positives ~47% of the time, a coin toss). Use three states instead: **flip PROVEN** when `k >= 2 + n/660` (a strong 1-per-400 offer clears at ~1,600 pooled contacts); **flip DEAD** when `k <= n/660 - 2` (unreachable below ~1,300, so never call an arm dead under ~1,300 pooled contacts); **HOLD and keep sending** in between. Among the PROVEN arms, the winner that becomes, or stays, `offer.lead_magnet` is the one that does not lose on time-agreed replies per 1,000 first touches (positive replies whose thread moves toward a time); a PROVEN arm whose time-agreed replies are zero or clearly lag the other arms is labeled farming interest, not scaled, and reshaped to filter better rather than killed, with no numeric cut-off and the operator confirming (operator-approved Aaron alignment, 2026-09-21; doctrine §2 step 5, §4). Full mechanism and ready-reckoner: `/campaign-strategy` flip criterion.

**Proven (flip to true):** the winning arm is clearing Eric's contacts-per-positive-response band into at least the above-average zone, roughly **1 positive reply per 400 contacted or better** (his excellent zone is 1 per 150 or better), read relative to the client's LTV:CAC and TAM per Eric's own "benchmarks are relative" caveat. When it clears and is picked as the winner (it does not lose on time-agreed replies per 1,000 first touches against the other PROVEN arms, because a positive reply is not a booked call; doctrine §0, §4; operator-approved Aaron alignment, 2026-09-21), set `run_state.offer_market_proven = true` and hand off to the coverage portfolio in Proven-mode on that offer.

**Dead (iterate the offer, do not fan out):** an arm past the pooled sample floor (above) and worse than roughly 1 positive per 1,200 contacted is deactivated; when every arm is dead, treat the offer as unproven. Iterate it via `/offer-intelligence` validation mode (Go / Iterate / Swap), and consider Eric's reframes: SQL to MQL, chunk up (results only) or chunk down (one sexy feature). Do NOT launch signal slices on a dead offer.

**Instrumentation caveat (must be stated, not assumed away).** This criterion needs the **positive** reply rate, not the raw reply rate. If reply categorization is off (it ships off by default on some sending platforms, and some do not categorize at all), the flip cannot be measured correctly from the platform alone. Before relying on it, turn categorization on or hand-read and tag the replies interested / not, and tag the time-agreed ones too, since the winner pick reads them (the magnet-inflation guard's sending-platform proxy, `/campaign-strategy`). Raw reply rate is a deliverability signal, not an offer-proven signal, and flipping the flag on raw replies would promote a dead offer.

---

## The wave read (Eric's three metrics)

Judge the validation wave on Eric's three North Stars, not open rates or spam-test scores:

1. **Reply rate** (raw, deliverability + offer + list at once; ~1% floor after 200+ sends).
2. **Contacts-per-positive-response** (the offer-proven gauge above; bands: excellent ≤150, above-average 150 to 400, average 450 to 800, below 800 to 1,200, poor >1,200, all relative to LTV:CAC and TAM).
3. **Net-new email-1 sends per day** (hold first-touch volume steady; most positive replies come from email 1).

Beside them, report **time-agreed replies per 1,000 first touches** for every arm and campaign (operator-approved Aaron alignment, 2026-09-21; doctrine §0, §2 step 5). It does not move the flip; it picks the winner among PROVEN arms, and a positive-reply lift with no rise in time-agreed replies is farming interest, not a win (doctrine §4).

A rising contacts-per-reply ratio mid-wave is an early spam / list-drift alarm. Ignore open rates (the tracking pixel trips a Gmail spam banner and drops replies, and open tracking stays off on the sending platform, so opens read 0% anyway), spam-placement tests, and platform reputation scores.

---

## Offer and lead-magnet posture for the validation wave

The offer and magnet are chosen upstream (`/offer-intelligence`, `/lead-magnet-brainstorm`), but Eric's lens shapes what the validation wave should be testing:

- **Test two to four offers, not one (Aaron, doctrine §5; operator-approved Aaron alignment, 2026-09-21).** `/lead-magnet-brainstorm` locks a primary plus one to three ranked validation arms (`offer.validation_arms`), generated across Aaron's three buckets (service-based, service-delivery-based, lead-magnet or asset-based). The wave runs the primary plus at least arm 1 on the same broad list and Framework A skeleton, so the offer is the only variable; arms 2 and 3 run only when capacity gives each its own pooled-flip floor. Each arm is judged on its own pooled read of positive replies; among PROVEN arms the one that does not lose on time-agreed replies per 1,000 first touches scales, a PROVEN arm that farms interest is reshaped rather than scaled, and dead arms are deactivated.
- **Easy to say yes to is the one trait every winning offer shares.** If the direct meeting ask is hard, the validation wave should test an MQL / lead-magnet framing, not an SQL ask.
- **Three AI-lead-magnet buckets** worth having on the table: knowledge (an intelligence report), micro-app (a small free tool), agentic free trial (run part of the service free as the first touch).
- **Test demand before building the magnet.** The validation wave IS that test: prove people want the thing before investing in building the full deliverable. Deliver a cheap teaser first, spend real money on the full asset only for positive responders.

---

## Reconciliation with current copy doctrine

- Framework A controls Email 1 in validation, coverage, and scale waves.
- The sequence remains one thread with 2 to 3 steps. Follow-up count may still vary with TAM size.
- The older 50-to-90, 70-to-90, and 120-to-200 bands are retired for Email 1.
- **Name the one place Eric and the house contract diverge, rather than leaving it implicit.** The retired 70-to-90 band is Eric's own stated number ("below 70 underperforms"); Framework A's 25-to-35 is Aaron Shepherd's, from his 1.5M-email study. Both are self-reported, and neither corpus reconciles with the other. The house contract follows Aaron here because copy is his specialty in the ownership split both persona skills state, not because Eric's number was disproved. Treat 25-to-35 as the governed default and Eric's band as a legitimate thing to test as a logged A/B arm (ledger R07), never as a licence to quietly ship a longer Email 1.
- Eric's performance numbers remain planning evidence with his disclaimer, not universal law. Stress-test a specific call via `/consultant` (interactive) or `/roast` (hands-off verdict).

## Owning skills

- `/cold-email-kickoff` points here as the first-wave default for a new client.
- `/campaign-strategy` decides the phase, stamps `copy_mode` onto each validation-wave campaign, and owns the flip criterion.
- `/campaign-copywriting` applies Framework A to Email 1 in every phase.
- `/cold-email-weekly-rhythm` + `/experiment-design` own the read and the flip decision once data exists.
- `eric-deliverability-doctrine.md` carries his infrastructure, domain-lifecycle and vendor-benchmarking doctrine; `/ask-eric` holds the full corpus.
