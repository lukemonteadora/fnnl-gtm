---
name: spam-word-checker
description: >
  Always-on spam and deliverability guardrails for cold email copy. Apply these rules whenever
  writing, reviewing, or QA-ing subject lines, openers, follow-ups, CTAs, or any cold outreach
  copy. Trigger on phrases like "check this for spam", "spam word check", "deliverability review",
  "QA this copy", "flag banned words", "check subject line", "is this safe to send", "scan for
  spam triggers", or any time cold email copy is being generated or reviewed. Also trigger
  automatically as a background rule whenever the campaign-copywriting or cold-email-copywriting
  skill is active -- these guardrails apply to EVERY piece of outbound copy generated, even if
  the user does not explicitly ask for a check.
---

# Spam Word Checker

Always-on spam and deliverability rules. Apply to every subject line, opener, second line, follow-up, and CTA generated or reviewed.

## Stack Resolution (read before any tool step)

This skill names **capability roles**, never specific vendors. Resolve every role to the
tool this workspace has actually chosen by reading:

```text
outbound/stack-contract.yaml
```

Roles this skill uses: sending platform.

**If a role this step needs is empty or missing in the contract, STOP and route to
`/stack-setup`.** Never substitute a guessed vendor, and never hardcode a tool name into
an artifact this skill writes.

---

## When These Rules Apply

- Subject lines, openers, second lines, follow-ups, CTAs
- Any cold outreach copy being written or QA'd
- The initial cold touch must also pass `outreach-copy-framework.md`: offer first, 25 to 35 body words, 2 to 3 main-body sentences, exactly 1 question, mandatory workload parenthetical, soft permission question last, and the email-specific subject rule. Any optional P.S. is declarative, outside the main-body sentence count, and inside the word cap
- If a deliverability checker or review flags a word/phrase, treat it as banned going forward unless user explicitly approves an exception
- When in doubt, choose the lower-hype rewrite

---

## Banned Single Words

Single words split into two tiers. Tier 1 is a hard ban, including inside compounds. Tier 2 words are legitimate business vocabulary - flag them only when used as standalone promotional hype, and allow them inside real business phrases, vertical terms, and names.

### Tier 1 - Hard ban (standalone or inside any compound)

`cash`, `mortgage`, `investment`, `freedom`, `urgent`, `now`, `soon`, `extra`

Punctuation, hyphens, or splits do not make a Tier 1 token safe. Treat close variants as banned when the root token is still obvious:
- `cash-cycle` -> still `cash` -> banned
- `mortgage-rate` -> still `mortgage` -> banned
- `extra-room` -> still `extra` -> banned
- `investment-tip` -> still `investment` -> banned

**Conversational "now" carve-out.** The `now` ban targets promotional urgency, not the plain temporal adverb. Still banned: `now` as a standalone pressure word and in urgency constructions (`buy now`, `act now`, `get it now`, `order now`, `call now`, `claim now`, `apply now`, and any "...now" used as a CTA closer or paired with an action verb to push speed). Allowed: the conversational adverb in its temporal sense, which carries no urgency — `right now`, `now that [X]`, `by now`, `at a different stage now`, and the like (for example "Is that what you're navigating right now?" or "Who owns quota right now?"). The test is sense, not the exact phrase: temporal "at this point in time" is fine; a speed/urgency push is not. This is the ban's existing intent made explicit, not a loosening: the urgency target is already evident from the High-Risk list (`buy now`, `act now`, `order now`, `claim now`), and the signal-first opener examples in `/campaign-copywriting` use "right now" as a natural closer.

### Tier 2 - Context-flag (allowed in legitimate business use)

`get`, `bank`, `access`, `open`, `compare`, `problem`, `finance`, `financial`, `billing`, `invoice`, `purchase`, `deal`, `credit`, `claims`, `insurance`, `medical`, `diagnostics`, `new`, `performance`, `home`, `sales`, `life`, `marketing`, `friend`

These are real business words. Flag them only when used as standalone promotional hype (for example "get now", "access now", "new offer", "instant sales"). Allow them inside genuine business phrases, vertical terms, and the client or company name - for example `sales team`, `financial services`, `insurance brokers`, `medical devices`, `billing system`, `purchase order`, `deal size`, and `ExampleCo Sales`. Do not ban a Tier 2 word just because it appears in a compound. (Spammy multiword constructions that use these roots stay banned via the High-Risk list below: `best deal`, `cash bonus`, `extra income`, `affordable deal`. Only the single business word is demoted here.)

---

## Allowed in the Body — Risk-Reversal & Plain-Offer Vocabulary (use sparingly)

Risk reversal is the single strongest lever in a 2026 cold email (Aaron Shepherd doctrine), and it is built from words the old lists over-banned. The following are ALLOWED in the body, and this allowance OVERRIDES the High-Risk and other banned lists below for these specific tokens:

`free`, `for free`, `free trial`, `no cost`, `no obligation`, `no strings attached`, `risk-free`, `full refund`, `money-back guarantee`, `no catch`

Guardrails (this is a loosening, not an open door):

- **Body only, never the subject line.** Subject-line trigger words carry far more placement risk than body words. Keep every subject line clean.
- **Sparingly: at most two or three trigger words in a whole email, and don't pile several into one sentence.** A natural pair reads fine ("the first look is free, no obligation"). A stack does not ("100% free, risk-free, no cost, no catch").
- **Still hard-banned (the scam / guarantee-of-outcome constructions):** `100% free`, `free money`, `free gift`, `free membership`, `free quote`, `free consultation`, `sign up free`, `guaranteed results`, `guaranteed deposit`, `satisfaction guaranteed`. Casual risk elimination is allowed; hype and guaranteed-outcome claims are not.
- **Why this is safe:** modern inbox placement (Google / Yahoo / Microsoft bulk-sender enforcement from 2024 on) is driven by authentication, warmup, sending volume, and spam-complaint rate, not single-keyword matching. A warmed, authenticated domain is not junked for a sparing, natural "free" or "no obligation." When in doubt, placement-test the copy before scaling.

Prefer the casual, reasonable-person phrasing Aaron calls "casual risk elimination" ("the first look is free, no obligation", "if it's not a fit, no hard feelings") over the washed-out `money-back guarantee` framing.

---

## Banned Short Phrases

`off chance`, `one time`, `all good`, `following up`, `following up here`, `just following up`, `just checking in`, `checking in`, `quick question`, `hope this finds you well`, `last note`, `last note from me here`, `I've reached out`, `reaching out again`, `great fit`, `bumping this once`, `just following up once`, `circle back`, `one more quick follow-up`, `keep this open`, `compare notes`, `compare notes live`, `appreciate the reply`, `want me to send it`, `want me to send this`, `want me to share it`, `want us to send it`, `want us to send this`, `want us to share it`, `interested?`, `worth a look`, `worth a quick look`

---

## High-Risk Promotional / Pressure Wording (Banned)

> **Exception:** the risk-reversal words listed under *Allowed in the Body — Risk-Reversal & Plain-Offer Vocabulary* above are permitted in the body, used sparingly. This list still bans every hype, scarcity, guaranteed-outcome, and scam construction below.

`$$$`, `50% off`, `100% guaranteed`, `100% free`, `100% off`, `100% satisfied`, `access now`, `act fast`, `act immediately`, `act now`, `action required`, `affordable deal`, `amazing`, `amazing deal`, `amazing offer`, `apply here`, `apply now`, `avoid bankruptcy`, `bargain`, `best bargain`, `best deal`, `best offer`, `best price`, `best rates`, `big profit`, `bonus`, `buy now`, `buy today`, `call now`, `can't live without`, `cash bonus`, `cash out`, `claim now`, `claim your discount`, `click`, `click below`, `click here`, `click this link`, `contact us immediately`, `deal ending soon`, `discount`, `don't delete`, `double your money`, `double your wealth`, `drastically reduced`, `earn`, `earn cash`, `earn extra income`, `earn money`, `easy income`, `exclusive deal`, `expires today`, `extra cash`, `extra income`, `fantastic`, `fantastic offer`, `fast cash`, `final call`, `for free`, `free access`, `free consultation`, `free gift`, `free membership`, `free money`, `free quote`, `free trial`, `full refund`, `get it now`, `get out of debt`, `get started now`, `giveaway`, `great news`, `guaranteed deposit`, `guaranteed results`, `hurry up`, `important information`, `immediately`, `increase revenue`, `increase sales`, `incredible deal`, `instant earnings`, `instant income`, `instant savings`, `investment advice`, `join millions`, `limited time`, `lowest price`, `make money`, `million dollars`, `money-back guarantee`, `must read`, `no catch`, `no cost`, `no obligation`, `no strings attached`, `once in a lifetime`, `only $`, `only available here`, `order now`, `order today`, `please read`, `price protection`, `profits`, `promise`, `pure profit`, `quote`, `risk-free`, `satisfaction guaranteed`, `save $`, `save big money`, `save up to`, `sign up free`, `special invitation`, `special offer`, `special promotion`, `supplies are limited`, `take action now`, `the best`, `this won't last`, `thousands`, `time limited`, `today`, `top urgent`, `trial`, `unbeatable offer`, `unbelievable`, `unlimited`, `urgent`, `what are you waiting for?`, `while supplies last`, `why pay more?`, `will not believe`, `winner announced`, `wonderful`, `you are a winner`, `you will not believe your eyes`

---

## Phishing-Style / Security-Warning Language (Banned)

`access your account`, `account update`, `activate now`, `change password`, `click to verify`, `confirm your details`, `confidential information`, `data breach`, `download now`, `final notice`, `important update`, `immediate action required`, `install now`, `last warning`, `log in now`, `new login detected`, `password reset`, `payment details needed`, `phishing alert`, `security breach`, `security update`, `update account`, `verify identity`, `warning message`

---

## Irrelevant Blacklisted Categories (Never Appear in Copy)

`100% natural`, `adult content`, `bet now`, `blackjack`, `casino bonus`, `cure for`, `diet pill`, `doctor recommended`, `fat burner`, `fast weight loss`, `free chips`, `free spins`, `gamble online`, `guaranteed weight loss`, `jackpot`, `lottery winner`, `medical breakthrough`, `miracle cure`, `natural remedy`, `no prescription needed`, `online betting`, `online casino`, `online pharmacy`, `pain relief`, `poker tournament`, `prescription drugs`, `reverse aging`, `risk-free bet`, `safe and effective`, `scientifically proven`, `secret formula`, `slots jackpot`, `spin to win`, `vip offer`, `weight loss`, `winning numbers`, `xxx`

---

## Formatting & Style Bans

- No em dashes anywhere in sendable copy.
- No double hyphen anywhere in sendable copy.
- No `space hyphen space` as a mid-sentence separator in sendable copy.
- No dash parentheticals such as `Company - descriptor - result`.
- No colon-as-runway sentences where `:` is used to stretch one sentence into a long list, proof stack, or multi-clause paragraph.
- No comma-wrapped company descriptors such as `Company, descriptor, result`; split the descriptor into its own sentence.
- No dense paragraph that relies on repeated commas to carry several ideas in one sentence.
- No wall-of-text body. Framework A Email 1 may use one compact offer block plus an optional P.S. because it is capped at 25 to 35 words. Later messages use short blocks separated by blank lines. Blank lines and line breaks are whitespace, not banned formatting.
- No mid-sentence capital after the greeting. When the body continues right after the `{first_name},` greeting, the next word is lowercase unless it is a proper noun (company, product, brand, acronym) — the greeting and opener are one sentence. WRONG: `Name, Each month ...`. RIGHT: `Name, each month ...`. Proper-noun opener keeps its capital: `Name, Acme just migrated ...`. In the pre-write column model the greeting is baked into each `email_*` body, so scan the column values.
- No awkward or ungrammatical phrasing. Grammar must be clean and read naturally aloud. Do not drop the connective words a sentence needs to parse on the first read (a missing "where", "that", or article reads as broken English). Never compress a sentence into awkward phrasing just to cut words.
- Normal compound words are allowed only when needed, such as `peer-to-peer` or `follow-up`.
- No ALL CAPS
- No multiple exclamation marks
- No greeting prefix before first name (no Hi, Hello, Hey)
- No third-person company references (`[Company] offers`, `[Company] helps`)
- No fake urgency, misleading subject lines, excessive links, or promotional formatting
- No CTA wording that makes the prospect feel like they owe the sender a favor. Default to permission-based phrasing that keeps the prospect in control.

---

## CTA Bans

Do not use soft CTAs that only confirm whether a problem exists without offering a useful next step.

Ban these default CTA patterns:

- `Want me to send it?`
- `Want us to send it?`
- `Want me to share it?`
- `Interested?`
- `Worth a look?`
- `Worth a quick look?`
- `Does that match what you are seeing?` when it stands alone as the CTA
- Repeating the same vague deliverable across separate new-thread emails, such as a generic note with no different substance
- Any CTA that asks the prospect to admit need, pain, or interest before the sender has offered clear value

Safer CTA logic (make "yes" the easy answer, keep the prospect on top):

1. Name the concrete thing the sender can provide.
2. Explain why it is worth the prospect's time.
3. Keep the prospect on top. Framework A Email 1 ends with exactly one soft permission question, such as `Would that be worth hearing more?`, `Open to it?`, `May I send it over?`, or `Can I send it across?`. The statement-only `Just reply "Yes"...` opt-in is reserved for later steps. Follow-ups use their own forward-looking question and CTA-rotation rules.

The ask should feel like the sender is doing the work and the prospect only has to say yes, never like pressure or a catch. Full rule: `cold-email-copy-best-practices.md` (CTA Standards) and `/campaign-copywriting` Hard Rule 32.

**Framework A close.** `Would that be worth hearing more?` is the preferred Email 1 close after the specific free deliverable and workload parenthetical. It is low friction and is not the banned `Worth a look?` / `Interested?`. It must be the message's only question.

---

## Follow-Up Opening Bans

Never open a follow-up by announcing that it is a follow-up. Each email must stand alone and lead with a fresh signal, proof point, consequence, or useful offer.

Banned follow-up openers:

- `Following up`
- `Just following up`
- `Checking in`
- `Just checking in`
- `Last note`
- `I've reached out a few times`
- `Wanted to bump this`
- `Circling back`
- `Touching base`
- `Bumping this`
- Any opener whose main point is that the sender already emailed before

For a COLD list, do not imply the reader saw a prior email — most never registered email 1, so "following up on my last" reads as "what email?". Imply the prior touch without making them remember it: "didn't want this to get buried," "one more nudge and I'll leave you alone," "last one from me on this."

---

## Fake-Familiarity / Warmth Bans (cold list)

A cold prospect has no relationship with you, so casual warmth fakes a relationship that does not exist — the costume without the body, worse than being direct. Personality goes INSIDE the first relevant line (a point of view plus spoken rhythm), never in a warmup before it.

Banned (any cold email or cold follow-up):

- `Hope you're well` / `Hope you're doing well` / `Hope this finds you well` / `Hope you're having a great week`
- `I wanted to connect`
- `Big fan of what you're building` / `Saw you're crushing it` (unearned flattery to a stranger)
- Any phrase implying shared history or that the reader already knows who you are
- Any warmup sentence placed before the first relevant line

Said-out-loud test: read the first two lines aloud — would a busy person who knows this world say it to a peer? If it reads like a brochure or a textbook, rewrite. (Full rule + examples: `/campaign-copywriting` Human Voice, Not Fake Warmth; `cold-email-copy-best-practices.md`.)

---

## Observational Opener Bans

Cold emails must never narrate that the sender observed something. Phrases like "I noticed" or "I saw" announce scraping and add no information, so they are banned wherever they appear.

**Open with the OFFER** (`/campaign-copywriting` Hard Rule 19: the offer-led opener). The older instruction here was to open with the signal using one of the four Signal-First Execution Patterns; that signal-first opener doctrine is **RETIRED (2026-07-17)** and is superseded by the offer-led opener. Signals now drive TARGETING (which slice gets which campaign and offer), and a slice-SHARED signal fact may ride inside the offer sentence (Hard Rule 38), but no signal opens a cold email.

**The bans below are unaffected by that retirement and remain in force.** They never depended on the opener shape: narrating that you looked someone up adds nothing wherever it sits. The canonical bank with exact wrong/right rewrites is `/campaign-copywriting` (Signal-First Anti-Patterns), which is live.

Banned observational openers:

- `I noticed`
- `I noticed that`
- `I saw that`
- `I saw you`
- `I stumbled upon`
- `I came across`
- `Congrats on`
- `Congratulations on`
- `I wanted to reach out`
- `I'm reaching out`
- Any opener whose only job is to say the sender looked the prospect up

Note: `quick question` is already banned (see Banned Short Phrases). Do not use it as a fallback opener. There is no "no personalization data" fallback branch anymore: every cold email opens with the OFFER (`/campaign-copywriting` Hard Rule 19), which needs nothing about the individual contact, so the opener is the same shared offer-led line for everyone on the list. (The older "open with the signal or a segment-level pain question" fallback is retired 2026-07-17 along with the signal-first opener.)

### The implication test (catches what the word bans miss)

The banned phrases above only catch the blunt version. A line can dodge every banned word and still narrate the observation, which is the actual failure. Apply this test to **any line that references a signal**, wherever it sits. (Line 1 itself is offer-led per Hard Rule 19, so in practice this catches the slice-shared signal fact riding inside the offer sentence, per Hard Rule 38.) If the line describes what the sender saw, noticed, or came across, it is an observation and it fails. Rewrite from the implication of the data point, not the data point itself. The prospect does not care that you found the information; they care what it means for their situation.

Flag and route back to `/campaign-copywriting` when any line does any of these, even with no banned phrase present:

- **Compliments the signal** instead of using it ("Congrats on the Series B, really impressive growth" leaks it; "Series B at your stage usually means the next 90 days are all hiring and systems" uses it).
- **Names the fact and stops**, leaving the prospect to supply the "so what" ("I saw [Company] is using Salesforce." with no consequence stated).
- **Leads with generic industry pain** before the signal ("Most companies at your stage struggle to hit pipeline targets..." then the signal bolted on after).
- **Buries the signal** behind a pitch ("We help B2B companies scale their outbound pipeline. I noticed you're hiring an SDR.").
- **Uses the signal as a flattery bridge** into a pitch ("...that is really impressive, and it made me think you might be dealing with some scaling challenges we could help with").
- **Recites raw scraped data as a line (surveillance)** — a headcount or department count read back at the prospect ("you have 14 people in Sales", "you have 10 SDRs"), or named individual employees ("I saw Mike and Laura on your team"). A scraped count is a targeting input, not a copy line; lead with what it means. Department headcount in particular is a filter, never the first sentence (see `/campaign-copywriting` Signal Angle Library, department-headcount caveat).

The full six-mode bank with exact wrong/right rewrites lives in `/campaign-copywriting` (Signal-First Anti-Patterns).

---

## Buzzword & Jargon-Metaphor Bans (plain vocabulary, Hormozi tone) — HARD RULE (2026-07-12)

Cold copy must sound like a plain-spoken operator talking to a peer, not a marketing brochure. Ban buzzwords and jargon-metaphors dressed up as insight; say the plain thing instead.

Banned (rewrite to plain language):
`leak` / `leakage` (say "where you're losing revenue most" / "lose to manual billing"), `unlock`, `leverage` (as a verb), `streamline`, `optimize` / `optimise`, `supercharge`, `seamless`, `synergy`, `empower`, `robust`, `game-changer`, `frictionless`, `turnkey`, `cutting-edge`, `best-in-class`, `next-level`, `revolutionize`, `transform` (as hype).

- A real industry term the buyer actually uses (`true-up`, `usage-based billing`, `reconciliation`) is fine; a buzz-metaphor is not.
- An internal offer/campaign NAME may keep a term like "Billing Leakage Teardown"; the prospect-facing email copy stays plain.
- **No source citations in the email body** ("(MGI Research)", "(Gartner)", "(2024 study)"): the number belongs in the copy, its provenance belongs in our records. Full rule: `/campaign-copywriting` ("the number goes IN the offer, plain and direct") + `cold-email-copy-best-practices.md`.

---

## Unsubscribe / Closeout Line Rules

Never write an unsubscribe line that promises to stop following up based on silence. The sequence keeps running unless the prospect takes an explicit action. Silence-based promises are misleading and fail to match actual behavior.

**Banned patterns (silence = we stop):**
- `I will take silence as a no`
- `read no reply as a pass`
- `assume no response means no interest`
- `If I don't hear back, I will leave it there / let this one go / leave you alone`
- `I am happy to stay out of the way` (if implied by context)
- Any construction where the user doing nothing = we stop sending

**Allowed patterns (explicit user action = we stop):**
- `A reply of 'no' / 'not for us' / 'pass' is enough and I'll step out of your inbox` (action-conditional)
- `Just say the word and I'll stop` (asks for action)
- `A one-word reply works fine if you'd rather I stopped` (asks for action)
- `You can ignore this` (permission, no promise)
- `Happy to try back later when timing makes more sense` (defers, doesn't stop)
- `If this isn't the right angle, tell me what is` (invites pivot)
- `If I misjudged the fit, I'd rather know than guess` (asks for clarification)

Rule of thumb: **the user has to do something explicit for the sequence to stop**. Silence keeps the cadence running.

---

## Safe Replacement Patterns

| Banned / Risky | Safe Replacement |
|---|---|
| `free consultation` | `open to a short conversation` |
| `special offer` | `what we're seeing in the market` |
| `act now` | `if relevant, happy to send details` |
| `guaranteed results` | `this may be relevant depending on your situation` |
| `click here` | `let me know and I can send it over` |
| `limited time` | `not sure if this is timely for you` |
| `increase revenue` | precise business outcome (e.g. `help support liquidity`) |
| `Want me to send it?` / `Want us to send it?` | Framework A Email 1: one soft permission question after the deliverable and workload split; later steps may use an easy-yes opt-in |
| `Worth a look?` | `Would that be worth hearing more?` after the specific free deliverable and workload split |

---

## Rewriting Logic

- Rewrite hype into plain, observational language
- Replace pressure with permission
- Replace promotional wording with specific business language
- If a line sounds like an ad, coupon, scam, or phishing message, rewrite it
- If a bump sounds filler-heavy or vague, replace it with a fresh value angle or clear closeout line
- If a value line uses fuzzy wording (`tight`, `fit`, `access`, `problem`), rewrite so the operational meaning is explicit
- If a reply acknowledgement sounds low-status, remove it and go straight to the next useful question
- If a sentence sounds AI-polished, simplify until it reads like a person speaking plainly
- If proof is written as a dash parenthetical, split it into plain sentences
- If a colon is carrying a long list or proof stack, split it into short sentences.
- If a sentence uses comma-wrapped descriptors, move the descriptor into its own sentence.
- If Email 1 and Email 3 offer the same vague deliverable, change the deliverable or route back to `/campaign-copywriting`.

---

## Company Name Handling

If a banned word appears inside a company name used in copy:
1. Do not drop the company reference entirely if the name is still needed
2. Rewrite the displayed name so the banned token is removed from standalone form
3. Priority: remove the token if the remaining name still reads clearly; only abbreviate or compress when needed

Examples:
- `Access Brand Communications` -> `AB Communications`
- `Calcon Mutual Mortgage` -> `Calcon Mutual`
- `Buckeye Insurance` -> `Buckeye`
- `Coming Soon New York` -> `Coming NY`

---

## Final QA Checklist

Before approving any copy:

- [ ] Scan subject line for spam-trigger wording
- [ ] Email 1 subject is 2 to 4 lowercase words with exactly 1 merge token. It is not bland or generic, and it keeps raw statistics, percentages, hype, and the offer out of the subject.
- [ ] Scan for buzzwords / jargon-metaphors (`leak`/`leakage`, `unlock`, `leverage`, `streamline`, `optimize`, `seamless`, `synergy`, `empower`, `robust`, `game-changer`, `frictionless`, `turnkey`) — rewrite to plain vocabulary (HARD RULE). No source citations in the body (`(MGI Research)`, `(Gartner)`).
- [ ] A real quantified value exists in the locked offer record. It appears in Framework A Email 1 only when it fits naturally inside the 25-to-35-word body; otherwise it is reserved for the optional P.S., follow-up, or reply path. No fabricated number and no storytelling preamble.
- [ ] No segment/acronym label said AT the reader (`MSPs lose...`, `for SaaS companies like you`, `as a fintech...`) — speak to "you"/{{company_name}} and attribute benchmarks to their cause, not their category (HARD RULE). Value/loss named simply (revenue), not vague and not over-listed.
- [ ] Copy is PLAIN and value-first: no buzzwords / jargon-metaphors (`leak`/`leakage`, `unlock`, `leverage`, `streamline`, `optimize`, `supercharge`, `seamless`, `synergy`, `empower`, `robust`, `cutting-edge`, `game-changer`, `frictionless`, `turnkey`) — say the plain version; no story-telling preamble before the offer; the number/value is wired INTO the offer sentence, not a setup line (HARD RULE — see `/campaign-copywriting` + `cold-email-copy-best-practices.md`). A real industry term the buyer uses (e.g. `true-up`) is fine.
- [ ] Scan body for banned or high-risk wording
- [ ] Scan for em dashes, double hyphens, and mid-sentence dash separators
- [ ] Scan for colon-as-runway sentences and comma-wrapped company descriptors
- [ ] Scan for weak follow-up openers and follow-up-reference openers
- [ ] Scan for observational openers (`I noticed`, `I saw that`, `Congrats on`, `I stumbled upon`, `I came across`, `I wanted to reach out`)
- [ ] Line 1 is offer-led and carries no signal (`/campaign-copywriting` Hard Rule 19; the signal-first opener is retired 2026-07-17). Apply the implication test to any line that references a signal, even when no banned phrase is present: reject lines that compliment the signal, name the fact with no "so what", lead with generic pain before the signal, bury the signal behind a pitch, use the signal as flattery into a pitch, or recite a raw scraped count / name-drop employees (surveillance)
- [ ] Scan for fake-familiarity / warmth phrases (`hope you're well`, `hope this finds you well`, `circling back`, `touching base`, `bumping this`, `I wanted to connect`, unearned flattery) and any warmup before the first relevant line; first two lines pass the said-out-loud test
- [ ] Confirm Framework A Email 1 is 25 to 35 body words, with 2 to 3 main-body sentences and exactly 1 question, the specific free deliverable first, and the sender/prospect workload split in parentheses. Any optional P.S. is declarative and included in the word count
- [ ] Confirm the body format matches its slot: compact Framework A offer block for Email 1; short separated blocks for later messages
- [ ] Confirm grammar is clean and reads naturally aloud, with no awkward over-compression or dropped connective words
- [ ] Confirm Email 1 ends with its only question, a soft permission CTA; reserve `Just reply "Yes"...` for later steps; flag any `Want me to…` / `Want us to send…` / `Interested?` / `Worth a look?`
- [ ] Scan separate new-thread CTAs for repeated generic deliverables
- [ ] Every email ends with a CTA or clear next step — support emails included; flag any email that trails off into a dead-end soft close with nothing to answer
- [ ] Rewrite any hype-heavy or pressure-heavy line into plain language
- [ ] Remove fake urgency
- [ ] Confirm email sounds like a credible real person, not a promotion

---

## What to do next

**If flags cleared:** read `run_state.sending_platform` from the profile or campaign plan, and resolve the sending platform against the stack contract. Run only the workflows belonging to that one locked platform, in this order: its variant-syntax (spintax) pass first, then its campaign upload. Whatever tool fills the role, use its own native variation syntax and its own upload workflow.

If `run_state.sending_platform` is unset, or the sending-platform role is empty in the contract, stop and route to `/stack-setup`. Do not guess a platform and do not fall back to a platform named in any example.

Do not show the off-path platform. Provider drift after QA is how campaigns get uploaded to the wrong tool.

**If flags fired:** back to `/campaign-copywriting` to rewrite the flagged lines. Re-run this check after.

**Or wait:** this skill auto-triggers on every copy draft. There is no standalone "next". Continue whatever copy work you were doing.

## Related skills

- `/outreach-copywriting` - applies the cross-channel Framework A first-touch rule
- `/campaign-copywriting` - produces the copy this skill screens

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short — record status, not raw output. Full protocol: `client-activity-log.md`.
