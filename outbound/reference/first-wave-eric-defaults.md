# First-Wave Offer-Validation Defaults

The `offer_market_proven` flag controls campaign strategy and the flip criterion. It no longer selects a different Email 1 copy shape. GrowthFlare Framework A in `outreach-copy-framework.md` controls the initial cold touch in every wave.

Everything here is keyed off the `offer_market_proven` boolean, never off a wave number. This matters: `/campaign-strategy` already uses "Wave 1" to mean the *coverage* wave that runs *after* validation. So "first wave" in the operator's sense is the **Offer-Validation Wave**, and it is selected by `offer_market_proven = false`, which also means a returning client with an already-proven offer correctly skips straight to Proven-mode.

This is Eric's own model and it already aligns with this system's `offer-validation-first` doctrine (validate the offer, lever 1, before optimizing the list, lever 2). The full Eric corpus and the doctrine-vs-flow gap analysis it used to cite were **not carried into this workspace**, so everything you need about the validation wave has to stand on its own in this file. Do not route to an Eric corpus skill unless one is actually present.

---

## The two modes at a glance

| | **Eric-mode** (validation, `offer_market_proven = false`) | **Proven-mode** (coverage/scale, `= true`) |
|---|---|---|
| Goal | Prove the offer gets replies, cheaply and fast | Scale the winner, maximize proven-signal coverage |
| Campaigns | Broad value-prop + Creative Ideas + Lookalike + sold-to splits, on the ONE locked offer. Message differentiated by segment (sold-to), minimal per-contact personalization | Full signal-slice coverage portfolio (≥100-company floor); copy held constant so a reply-rate difference attributes to the signal |
| Copy register | GrowthFlare Framework A initial offer | GrowthFlare Framework A initial offer |
| Length | Email 1: 25 to 35 body words | Email 1: 25 to 35 body words |
| Personalization | Minimal. The offer is the spine, not the personalization | Signal-based per-contact personalization (`/personalization-subagent-pattern`) |
| Sequence | 2 emails, up to 3, sized by TAM (see below) | 4-step / two-thread (current default) |
| CTA | Email 1: exactly one soft permission question | Email 1: exactly one soft permission question; forward-looking follow-ups |
| Proof | Name recognizable proof, describe unrecognizable proof generically | Segment-matched proof from the social-proof bank |
| Send days | Tue to Thu, drop Friday | Per schedule |
| Read | Eric's 3 metrics + contacts-per-positive band (below) | Full experiment-design + weekly-rhythm |

---

## Eric-mode copy defaults (the actual rules for the validation wave)

Apply these when `offer_market_proven = false`. Everything also passes `outreach-copy-framework.md`, `spam-word-checker.md`, and `cold-email-copy-best-practices.md`.

1. **Length and structure: Framework A controls.** Email 1 is 25 to 35 body words, 2 to 3 sentences, and exactly 1 question. It opens with the specific free deliverable and keeps the sender/prospect workload split in parentheses.
2. **Copy is offer-led, not personalization-led.** The default is the broad value-prop campaign and the Creative Ideas Campaign ("if I were in your shoes, here are 3 ways I'd use this," each idea constrained to a real capability). Minimal or no per-contact personalization. The offer carries the email. Personalization is a Proven-mode multiplier, never the thing under test here.
3. **Sequence length by TAM size** (replaces the always-4-step default for this wave, and this is a deliberate change to flag). Huge TAM (roughly 500k+) = 1 email, then re-blast the whole TAM later rather than follow up. Mid TAM (~50k to 100k) = 2 emails. Small TAM (under ~50k) = 3 emails. Email 1 carries the load; do not pile on touches to validate an offer. **At high volume this logic extends to Proven-mode coverage campaigns too, not just this validation wave:** every follow-up consumes the same daily send capacity as a first-touch, so on a big TAM a shorter sequence buys more first-touch reach per day. Bigger TAM → shorter sequence → more of the list reached per day, given the warmed fleet.
4. **P.S. is optional proof, not a second pitch.** Framework A permits one compact, true proof claim aligned to the offer only when the whole body remains within 25 to 35 words.
5. **Proof by recognizability.** Name a proof client only when the reader will recognize it; when they will not, describe the outcome generically instead of naming a company they cannot place. This sharpens the existing "omit irrelevant proof" rule. Still bound by the Proof-Asset Gate and Capability Truth.
6. **Never write "I saw you're hiring for X"** (or any bare signal-naming opener). It is table stakes and gets the sender written off. If a hiring or similar signal informs the angle, use the underlying pain it implies, never the signal by name. (This is the implication test, applied to the one signal operators most often botch.)
7. **CTA: Framework A soft permission question.** It is the only question in Email 1. The statement-only `Just reply "Yes"...` opt-in is reserved for later steps.
8. **Subject line:** use 2 to 4 lowercase words and exactly 1 merge token, normally `{{first_name}}`. Engineer the subject and preview text together for phone rendering.
9. **Send Tuesday to Thursday, drop Friday** (Eric's data). For a very small TAM, restrict to Tue/Wed/Thu.
10. **Volume: anchor on the broad campaign, size to the read.** Cold email is a volume game, but the volume lives in the broad value-prop anchor, not in every slice. The validation wave's broad campaign should be as large as the TAM allows (hundreds to thousands of contacts); niche slices are legitimately small. Size the wave so each campaign clears the ~300 first-touch-send read floor. If the enriched TAM cannot support that (a genuinely small niche), that is an ICP/offer decision to surface (widen titles / the buying committee, headcount, geography, adjacent verticals, or accept a small-niche read), never a reason to launch a pile of tiny slices. Full rule: `/campaign-strategy` Volume adequacy.

**Already present, do not duplicate:** the Creative Ideas and Lookalike campaigns, offer-validation-first sequencing, minimal per-contact personalization, broad/focused/niche tiering, Capability Truth, Proof-Asset gates, and the Framework A copy gate. The phase flag does not override the cross-channel initial-copy rule.

### Sold-to IS the message (not a contradiction with "minimal personalization")

Two different layers, easy to conflate. Eric holds both at once, and so does `/campaign-strategy`.

- **Sold-to is a MESSAGE-segmentation axis.** Who a company sells to (legal teams vs restaurant owners) changes the buyer, the pain, and the proof, so it changes the message. Each sold-to segment gets its OWN copy and proof. This is Eric's "the list is the message," and it is the validation wave's PRIMARY message-differentiation (the flagship message-differential axis in `/campaign-strategy`). It is fully alive in Eric-mode.
- **"Hold copy constant" is a DIFFERENT axis, and it belongs to the COVERAGE wave.** There you vary only the SIGNAL and hold the copy constant so a reply-rate difference attributes to the list, not the copy. That constancy is for signal attribution; it does not apply to sold-to and it is not a validation-wave rule.
- **"Minimal personalization" means minimal PER-CONTACT personalization** (no per-prospect AI first lines), NOT one message for the whole wave. Segment-level message differentiation by sold-to is segmentation, not personalization, and it stays. Per-contact personalization is the wave-2/3 multiplier.

So the validation wave holds the OFFER constant (you are testing one offer), differentiates the MESSAGE by sold-to segment (each with its own pain and proof), and keeps per-contact personalization minimal. Eric holds "the list is the message" and "hold copy constant to isolate a signal" simultaneously because they act on different axes: `/campaign-strategy`'s message-differential split test governs which slices get their own copy (sold-to does), while the ≥100 floor governs which slices launch. Nothing here overrides that.

---

## The flip criterion: what turns `offer_market_proven` to true (or kills the offer)

The whole phase gate is inert without a concrete exit. Eric-mode does not end on a hunch; it ends on a number.

**Minimum sample, and pool the wave (corrected 2026-07-17).** Judge the flip on the wave **pooled**, not per campaign: the flag gates one decision about one shared offer, so pool every validation campaign's first-touch contacts into one count `n` and its positive replies into one count `k` (a positive from any sequence step, once the ~21-day sequence window has run). The old "~300 first-touch sends per campaign" floor was borrowed from `/cold-email-weekly-rhythm`, where 300 gates the ~1 to 3% **raw** reply rate; a **positive** reply at the 1-per-400 band is 4 to 12 times rarer, so 300 sends decides nothing (a good offer shows zero positives ~47% of the time, a coin toss). Use three states instead: **flip PROVEN** when `k >= 2 + n/660` (a strong 1-per-400 offer clears at ~1,600 pooled contacts); **flip DEAD** when `k <= n/660 - 2` (unreachable below ~1,300, so never call an offer dead under ~1,300 pooled contacts); **HOLD and keep sending** in between. Full mechanism and ready-reckoner: `/campaign-strategy` flip criterion.

**Proven (flip to true):** the validation wave is clearing Eric's contacts-per-positive-response band into at least the above-average zone, roughly **1 positive reply per 400 contacted or better** (his excellent zone is 1 per 150 or better), read relative to the client's LTV:CAC and TAM per Eric's own "benchmarks are relative" caveat. When it clears, set `run_state.offer_market_proven = true` and hand off to the coverage portfolio in Proven-mode.

**Dead (iterate the offer, do not fan out):** past the pooled sample floor (above) and worse than roughly 1 positive per 1,200 contacted, treat the offer as unproven. Iterate it via `/offer-intelligence` validation mode (Go / Iterate / Swap), and consider Eric's reframes: SQL to MQL, chunk up (results only) or chunk down (one sexy feature). Do NOT launch signal slices on a dead offer.

**Instrumentation caveat (must be stated, not assumed away).** This criterion needs the **positive** reply rate, not the raw reply rate. If reply categorization is off (it ships off by default on some sending platforms, and some do not categorize at all), the flip cannot be measured correctly from the platform alone. Before relying on it, turn categorization on or hand-read and tag the replies interested / not. Raw reply rate is a deliverability signal, not an offer-proven signal, and flipping the flag on raw replies would promote a dead offer.

---

## The wave read (Eric's three metrics)

Judge the validation wave on Eric's three North Stars, not open rates or spam-test scores:

1. **Reply rate** (raw, deliverability + offer + list at once; ~1% floor after 200+ sends).
2. **Contacts-per-positive-response** (the offer-proven gauge above; bands: excellent ≤150, above-average 150 to 400, average 450 to 800, below 800 to 1,200, poor >1,200, all relative to LTV:CAC and TAM).
3. **Net-new email-1 sends per day** (hold first-touch volume steady; most positive replies come from email 1).

A rising contacts-per-reply ratio mid-wave is an early spam / list-drift alarm. Ignore open rates (the tracking pixel trips a Gmail spam banner and drops replies), spam-placement tests, and platform reputation scores.

---

## Offer and lead-magnet posture for the validation wave

The offer and magnet are chosen upstream (`/offer-intelligence`, `/lead-magnet-brainstorm`), but Eric's lens shapes what the validation wave should be testing:

- **Easy to say yes to is the one trait every winning offer shares.** If the direct meeting ask is hard, the validation wave should test an MQL / lead-magnet framing, not an SQL ask.
- **Three AI-lead-magnet buckets** worth having on the table: knowledge (an intelligence report), micro-app (a small free tool), agentic free trial (run part of the service free as the first touch).
- **Test demand before building the magnet.** The validation wave IS that test: prove people want the thing before investing in building the full deliverable. Deliver a cheap teaser first, spend real money on the full asset only for positive responders.

---

## Reconciliation with current copy doctrine

- GrowthFlare Framework A controls Email 1 in validation, coverage, and scale waves.
- The sequence remains one thread with 2 to 3 steps. Follow-up count may still vary with TAM size.
- The older 50-to-90, 70-to-90, and 120-to-200 bands are retired for Email 1.
- Eric's performance numbers remain planning evidence with his disclaimer, not universal law. Stress-test a specific call via `/consultant` (interactive) or `/roast` (hands-off verdict).

## Owning skills

- `/cold-email-kickoff` points here as the first-wave default for a new client.
- `/campaign-strategy` decides the phase, stamps `copy_mode` onto each validation-wave campaign, and owns the flip criterion.
- `/campaign-copywriting` applies Framework A to Email 1 in every phase.
- `/cold-email-weekly-rhythm` + `/experiment-design` own the read and the flip decision once data exists.
