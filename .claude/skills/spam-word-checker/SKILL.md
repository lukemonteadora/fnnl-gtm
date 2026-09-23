---
name: spam-word-checker
description: >
  Always-on formatting, voice, and structural guardrails for cold email copy. Apply these rules whenever
  writing, reviewing, or QA-ing subject lines, openers, follow-ups, CTAs, or any cold outreach copy.
  Trigger on phrases like "check this for spam", "spam word check", "deliverability review",
  "QA this copy", "check subject line", "is this safe to send", or any time cold email copy is being
  generated or reviewed. Also trigger automatically as a background rule whenever the campaign-copywriting
  or cold-email-copywriting skill is active -- these guardrails apply to EVERY piece of outbound copy
  generated, even if the user does not explicitly ask for a check. Does NOT enforce a hard-coded banned-word
  list (see "Why this file no longer bans a keyword list" below) -- it enforces formatting, CTA, opener,
  and voice discipline instead, including Aaron Shepherd's own named kill-list.
---

# Spam Word Checker

Always-on formatting, voice, and structural rules. Apply to every subject line, opener, second line, follow-up, and CTA generated or reviewed.

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
- The initial cold touch must also pass the Email 1 contract in `outreach-copy-framework.md` (B1 to B15): offer first with no greeting and no preamble, 25 to 35 body words by default (with Aaron's floor and saturation exception), 2 to 3 main-body sentences (one for the one-liner), one primary ask, the scope disclosure whenever it reflects the real process, the soft permission CTA last, and the email subject rule (2 to 4 lowercase words, 0 to 2 variables). Any optional P.S. is declarative, short, and does one job, and it sits outside both the main-body sentence count and the word count (operator-approved Aaron alignment, 2026-09-21)
- Every draft is also checked against Aaron's rejection bank (`aaron-examples.md` §8 in `/ask-aaron`) and his named bans (see Aaron's Named Bans below)
- When in doubt, choose the lower-hype rewrite

---

## Why this file no longer bans a keyword list

This file used to carry an enumerated list of banned single words, banned phrases, "high-risk" promotional wording, phishing-style language, and irrelevant blacklisted categories (gambling, pharma, and the like). That list is removed (2026-09-18, operator directive).

Modern inbox placement (Google / Yahoo / Microsoft bulk-sender enforcement, 2024 onward) is driven by domain authentication, mailbox warmup, sending volume, and spam-complaint rate, not single-keyword matching in message content. A warmed, authenticated domain sending reasonable volume is not junked because an email contains the word "free" or "now." The old list also produced a real, standing self-contradiction: it hard-banned `free`, `no cost`, `no obligation`, `risk-free`, `full refund`, and `money-back guarantee` in its High-Risk section while a separate section explicitly allowed all of them for risk-reversal copy. Removing the blocklist resolves that contradiction rather than papering over it.

What remains below is not keyword-matching: formatting rules, CTA discipline, opener and voice rules, and unsubscribe/closeout logic. Those stay because they are cited as live QA gates from `/campaign-copywriting`, `cold-email-copy-best-practices.md`, and `/ask-aaron`, and because a house style choice (no em dashes, no fake familiarity, no observational openers) is a different kind of rule than a deliverability keyword ban.

**The eight dropped short phrases, re-ruled 2026-09-21 (Aaron alignment).** When the list was removed, eight short phrases with an unclear intent went with it. Each was re-ruled against Aaron's named kill-list and the existing house voice rules. Restored as instances of a named rule, never as keywords: `compare notes` and `compare notes live` (a meeting ask too early, CTA Bans), `great fit` (an unsupported fit claim, Fake-Familiarity / Warmth Bans), `appreciate the reply` (the low-status reply acknowledgement, Rewriting Logic), and `off chance` (hedging, Rewriting Logic). Left removed: `one time` (a spam-keyword entry with no voice job), `all good` (as a closer it sits too close to Aaron's endorsed "If it's not a fit, no hard feelings.", examples §5), and `keep this open` (a closeout line, already covered by Unsubscribe / Closeout Line Rules, which now allow a closeout only as a legally required notice, operator-approved Aaron alignment, 2026-09-21).

If a live campaign actually hits a deliverability problem, diagnose it as a real incident through `/email-deliverability-audit` or `/deliverability-incident-response` (DNS authentication, warmup state, volume, complaint rate, list quality) rather than reviving a blanket word list. If a specific phrase is confirmed to be causing a real placement problem in a real test, flag that phrase to the user and handle it as a one-off, not a permanent addition to an enumerated list.

---

## Allowed in the Body: Risk-Reversal & Plain-Offer Vocabulary (use sparingly)

Aaron ranks casual risk elimination above personalization as what *"really works in 2026"* (`aaron-examples.md` §5), while the offer itself stays his 80/20 (doctrine §3). (This line used to call risk reversal "the single strongest lever", which overstated his position.) It is built from ordinary words that are safe to use in the body:

`free`, `for free`, `free trial`, `no cost`, `no obligation`, `no strings attached`, `risk-free`, `no catch`

**Required, not just allowed.** When the offer is free, the body says `free` or `no cost` (B9; Aaron on a free offer that omits it: *"I think that's a huge miss."*, examples §8). No rule in this file bans either word.

**Removed from this list: `money-back guarantee` and `full refund`** (operator-approved Aaron alignment, 2026-09-21). Aaron rejects the money-back guarantee as *"incredibly washed out"* (examples §5), and the Email 1 contract says never a money-back guarantee (B7). That is an offer-shape rule, not a keyword ban.

Guardrails (this is guidance on natural use, not a blocklist exception):

- **Where they go: in the body, inside the offer.** Subject lines carry curiosity plus relevance, not the offer (house relevance-first subject rule, B15; Aaron's own rejected subject "free creative ad strategy" failed on relevance, examples §3), so the offer and its "free" live in the body. This is a subject-shape rule, not a ban on the word.
- **Sparingly: at most two or three of these words in a whole email, and don't pile several into one sentence.** A natural pair reads fine ("the first look is free, no obligation", a house phrasing). A stack does not ("100% free, risk-free, no cost, no catch"). Piling them on reads as hype regardless of deliverability; that is a voice problem, not a spam-filter problem.
- **Avoid scam-adjacent constructions on their own merits:** `100% free`, `free money`, `free gift`, `free membership`, `guaranteed results`, `guaranteed deposit`, `satisfaction guaranteed`. These fail because they sound like an ad or overstate a guarantee you cannot back, not because a filter is scanning for them. (A free consultation also fails Aaron's test: a useful piece of actual work beats a consultation, doctrine §3.) If a claim needs to be true (`no obligation`, `no strings attached`), make sure it actually is; a false version is a truth violation regardless of deliverability.
- **Why this is safe:** modern inbox placement is driven by authentication, warmup, sending volume, and spam-complaint rate, not single-keyword matching. A warmed, authenticated domain is not junked for a sparing, natural "free" or "no obligation."

Use the casual, reasonable-person phrasing Aaron calls "casual risk elimination". His model lines (`aaron-examples.md` §5, `[AS]`): "We'll do this for free and then we only move forward if we actually see something worth implementing." and "If it's not a fit, no hard feelings. I just want to get in front of you." Port the shape, not the sentence (B12). ("the first look is free, no obligation" is a house phrasing, not his.)

---

## Aaron's Named Bans (voice and opener kill-list)

Restored 2026-09-21 (operator-approved Aaron alignment). These are Aaron Shepherd's own named bans (doctrine §9 "Banned openers and moves", examples §7.1 and §8), enforced here as voice and opener rules, never as a keyword list. Most sit in the section named in the right column:

| Aaron's named ban | Where it is enforced |
|---|---|
| "I hope this email finds you well" and "I know you're busy, but…" | Fake-Familiarity / Warmth Bans |
| Introducing yourself or your company | Observational Opener Bans |
| "just following up", "just nudging", bumping, and "did you see my last email?" | Follow-Up Opening Bans |
| An "FW:" fake-forward subject, or any deceptive subject framing | Formatting & Style Bans |
| Em dashes of any kind in email copy | Formatting & Style Bans |
| Asking for a proposal, pricing, or a meeting too early | CTA Bans |
| Fake relevance and compliments that would fit anyone | Fake-Familiarity / Warmth Bans |
| Jargon and self-declared uniqueness | Buzzword & Jargon-Metaphor Bans |

The rest are stated here:

- "Audit" as the name of the offer (doctrine §3: *"the word audit is just so overplayed"*). A bounded, evidence-based diagnostic survives under a better name (ledger R09).
- Criticizing the prospect (doctrine §9).
- Emojis, and storytelling or picture-painting before the offer (doctrine §9).
- A question-form pain opener, a loaded hypothetical ("What if you could double revenue?"), or an unverified problem assumption ("Still losing money to X?" without evidence) (examples §8).
- A free offer that never says "free" or "no cost" (examples §8).
- A salesy sign-off ("Thanks for the time", doctrine §9), and opt-out lines or spintax artifacts in the body (doctrine §9; the opt-out mechanics live in the sending platform, see Unsubscribe / Closeout Line Rules).
- The company-name variable as a default (examples §8: *"which I actually hate"*; B5 in `outreach-copy-framework.md`).

The full row-by-row list, with his reasons and fixes, is `aaron-examples.md` §8 in `/ask-aaron`. Check every draft against it: it is a QA gate (`outreach-copy-framework.md`).

---

## Formatting & Style Bans

- No em dashes of any kind anywhere in sendable copy, spaced or unspaced, and no en dash used as a dash. This is Aaron's own rule as well as the house's: *"no m dashes ever, **that screams ChatGPT**"* (doctrine §9, examples §8). Chunk with line breaks instead.
- No double hyphen anywhere in sendable copy.
- No `space hyphen space` as a mid-sentence separator in sendable copy.
- No dash parentheticals such as `Company - descriptor - result`.
- No colon-as-runway sentences where `:` is used to stretch one sentence into a long list, proof stack, or multi-clause paragraph.
- No comma-wrapped company descriptors such as `Company, descriptor, result`; split the descriptor into its own sentence.
- No dense paragraph that relies on repeated commas to carry several ideas in one sentence.
- No wall-of-text body. Framework A Email 1 may use one compact offer block plus an optional P.S. because it runs 25 to 35 words by default. Later messages use short blocks separated by blank lines. Blank lines and line breaks are whitespace, not banned formatting.
- No mid-sentence capital after a first name. Wherever a first name is followed by a comma and the sentence continues, the next word is lowercase unless it is a proper noun (company, product, brand, acronym), because the name and the words after it are one sentence. WRONG: `Name, Each month ...`. RIGHT: `Name, each month ...`. Proper-noun opener keeps its capital: `Name, Acme just migrated ...`. (Email 1 carries no greeting word, but a first name may open it, B1, so this rule applies there too.) In the pre-write column model the name is baked into each `email_*` body as literal text, so scan the column values.
- No awkward or ungrammatical phrasing. Grammar must be clean and read naturally aloud. Do not drop the connective words a sentence needs to parse on the first read (a missing "where", "that", or article reads as broken English). Never compress a sentence into awkward phrasing just to cut words. **Carve-out (Aaron process alignment, operator directive 2026-09-22):** a deliberate spoken sentence start ("thinking I could ...", "asking because ...") passes when it reads naturally aloud (Sep 21: "starting sentences fairly informally like asking, thinking"). Broken grammar still fails: natural does not mean sloppy (doctrine §9).
- Normal compound words are allowed only when needed, such as `peer-to-peer` or `follow-up`.
- No ALL CAPS
- No multiple exclamation marks
- No greeting (no Hi, Hello, Hey, or greetings). Aaron: *"you don't even use hey, hi, hello, greetings, or anything."* (doctrine §9). A bare first name is not a greeting: it is optional; it may open the email or sit later in the sentence (his first-name-second trick), B1.
- No third-person company references (`[Company] offers`, `[Company] helps`)
- No fake urgency, misleading subject lines, excessive links, or promotional formatting. No fake-forward or fake-thread subject prefixes (`FW:`, `Fwd:`, or `RE:` on a first touch) and no emergency, invoice, or account-fault framing. Aaron: *"last thing you want to do is start the conversation with deceit."* (examples §3, doctrine §9)
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
- A meeting ask in Email 1, including one dressed as a peer chat: `compare notes`, `compare notes live`, or `would that be worth a chat`. Aaron's kill-list bans asking for a proposal, pricing, or a meeting too early (doctrine §9), and he replaced "would that be worth a chat" because the ask is permission to send something, not permission to meet (examples §4). (`compare notes` and `compare notes live` were restored 2026-09-21 as instances of this named ban.)

Safer CTA logic (make "yes" the easy answer, keep the prospect on top):

1. Name the concrete thing the sender can provide.
2. Explain why it is worth the prospect's time.
3. Keep the prospect on top. Framework A Email 1 ends with one soft permission ask: by default `Would that be worth sharing more?` (Aaron's own, examples §4), or one of his variants (including `Would that be worth a quick test?` for pilot, trial and pay-per-result offers, `Would that be useful?` and `Would that be helpful?`) or the house variants (`Would that be worth hearing more?`, `Open to it?`, `May I send it over?`, `Can I send it across?`). One primary ask, no stacked asks (B14). The statement-only `Just reply "Yes"...` opt-in is reserved for later steps; a no-CTA Email 1 runs only as a labeled test arm, and a soft conditional statement close ("... if you're open to that kind of thing", Sep 21) only as its own labeled arm (B3). Follow-ups use their own forward-looking question (or conditional statement re-offer) and CTA-rotation rules. (operator-approved Aaron alignment, 2026-09-21; the three Aaron asks and the two statement forms added by Aaron process alignment, operator directive 2026-09-22)

The ask should feel like the sender is doing the work and the prospect only has to say yes, never like pressure or a catch. Full rule: `cold-email-copy-best-practices.md` (CTA Standards) and `/campaign-copywriting` Hard Rule 32.

**Framework A close.** `Would that be worth sharing more?` is the default Email 1 close (Aaron's own most-used ask, examples §4, ledger R17). His variants ("Worth sharing more.", "Is that worth sharing more?", "would that be worth sending over?", "Mind if I send it to you?", and, added by Aaron process alignment, operator directive 2026-09-22, his Sep 21 "would that be worth a quick test?" for pilot, trial and pay-per-result offers and his "would that be useful?" / "would that be helpful?", examples §1.5 and §2.6) and the house variant `Would that be worth hearing more?` stay accepted. Each is low friction, and none is the banned `Worth a look?` / `Interested?` or a meeting ask. Whichever is used is the message's one primary ask. (operator-approved Aaron alignment, 2026-09-21: the two used to be listed as interchangeable co-defaults.)

---

## Follow-Up Opening Bans

Never open a follow-up by announcing that it is a follow-up. Treat every follow-up as possibly the first one read (doctrine §11): it does one job (useful context, one meaningful point, a lower-commitment version of the same offer, or a real objection) and never references the earlier email.

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

Aaron's named follow-up bans (examples §7.1, doctrine §11), restored 2026-09-21:

- `just nudging`
- `did you see my last email?`
- `just wanted to bump up my last message in case you didn't get a chance to read it`
- Naming the non-reply, or assuming the reader will scroll up to an earlier email
- `recognize you're probably slammed`
- Guilt trips and fake urgency
- `Are you the right person to send it to?`, except at enterprise and then named ("is David in sales better to reach out to about this?")

For a COLD list, do not imply the reader saw a prior email at all: most never registered email 1. Do not gesture at it either. Write each follow-up so it works as the first email they read. Aaron's good forms (examples §7.1, `[AS]`): "interested in a free UGC ad creative" and "interested in a 2-minute video that explains our XYZ process". Port the shape, not the sentence. (operator-approved Aaron alignment, 2026-09-21: the earlier advice here to imply the prior touch is archived at `outbound/_archive/aaron-alignment-2026-09-21/spam-word-checker--follow-up-opening-bans.md`.)

---

## Fake-Familiarity / Warmth Bans (cold list)

A cold prospect has no relationship with you, so casual warmth fakes a relationship that does not exist (the costume without the body), worse than being direct. Personality goes INSIDE the first relevant line (a point of view plus spoken rhythm), never in a warmup before it.

Banned (any cold email or cold follow-up):

- `Hope you're well` / `Hope you're doing well` / `Hope this finds you well` / `Hope you're having a great week`
- `I hope this email finds you well` and `I know you're busy, but…`. Aaron: *"that's the first thing that's going to kill your email."* (doctrine §9)
- `I wanted to connect`
- `Big fan of what you're building` / `Saw you're crushing it` (unearned flattery to a stranger)
- An unsupported fit claim such as `you'd be a great fit` or `we'd be a great fit`. Aaron's kill-list bans fake relevance and compliments that would fit anyone (doctrine §9). (`great fit` was restored 2026-09-21 as an instance of this named ban.)
- Any phrase implying shared history or that the reader already knows who you are
- Any warmup sentence placed before the first relevant line

Said-out-loud test: read the first two lines aloud. Would a busy person who knows this world say it to a peer? If it reads like a brochure or a textbook, rewrite. (Full rule + examples: `/campaign-copywriting` Human Voice, Not Fake Warmth; `cold-email-copy-best-practices.md`.)

---

## Observational Opener Bans

Cold emails must never narrate that the sender observed something. Phrases like "I noticed" or "I saw" announce scraping and add no information, so they are banned wherever they appear.

**Open with the OFFER** (`/campaign-copywriting` Hard Rule 19: the offer-led opener). The older instruction here was to open with the signal using one of the four Signal-First Execution Patterns; that signal-first opener doctrine is **RETIRED (2026-07-17)** and is superseded by the offer-led opener. Signals now drive TARGETING (which slice gets which campaign and offer), and a slice-SHARED signal fact may ride inside the offer sentence (Hard Rule 38), but no signal opens a cold email.

**The bans below are unaffected by that retirement and remain in force.** They never depended on the opener shape: narrating that you looked someone up adds nothing wherever it sits. The canonical guidance is `/campaign-copywriting` (Signal-First Anti-Patterns), which is live; take the test from it, never lift one of its example lines as copy (its old "Right" rewrites are archived, operator-approved Aaron alignment, 2026-09-21).

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
- Introducing yourself or your company (who you are, who you work for, what you do). Aaron: *"That's just a complete no-go."* (doctrine §9)

Note: `quick question` reads as generic and templated (see Buzzword & Jargon-Metaphor Bans for the plain-vocabulary principle behind this). Do not use it as a fallback opener. There is no "no personalization data" fallback branch anymore: every cold email opens with the OFFER (`/campaign-copywriting` Hard Rule 19), which needs nothing about the individual contact, so the opener is the same shared offer-led line for everyone on the list. (The older "open with the signal or a segment-level pain question" fallback is retired 2026-07-17 along with the signal-first opener.)

### The implication test (catches what a plain read misses)

Reading for banned phrases only catches the blunt version. A line can dodge every banned word and still narrate the observation, which is the actual failure. Apply this test to **any line that references a signal**, wherever it sits. (Line 1 itself is offer-led per Hard Rule 19, so in practice this catches the slice-shared signal fact riding inside the offer sentence, per Hard Rule 38.) If the line describes what the sender saw, noticed, or came across, it is an observation and it fails. Rewrite from the implication of the data point, not the data point itself. The prospect does not care that you found the information; they care what it means for their situation.

Flag and route back to `/campaign-copywriting` when any line does any of these, even with no banned phrase present:

- **Compliments the signal** instead of using it ("Congrats on the Series B, really impressive growth" leaks it). The fix is never a generalization stated as a fact about their company: a slice-shared signal fact, true of every contact in the slice, rides inside the offer sentence or the P.S. (Hard Rule 38; the opening-line swap, examples §1.1), per the `/campaign-copywriting` Signal-First Anti-Patterns guidance. (operator-approved Aaron alignment, 2026-09-21: the "uses it" rewrite that sat here, "Series B at your stage usually means the next 90 days are all hiring and systems", stated an unsupported generalization as a fact about the reader, doctrine §5 step 1, and is retired with the "Right" rewrites it came from, archived at `outbound/_archive/aaron-alignment-2026-09-21/campaign-copywriting--signal-first-right-lines.md`.)
- **Names the fact and stops**, leaving the prospect to supply the "so what" ("I saw [Company] is using Salesforce." with no consequence stated).
- **Leads with generic industry pain** before the signal ("Most companies at your stage struggle to hit pipeline targets..." then the signal bolted on after).
- **Buries the signal** behind a pitch ("We help B2B companies scale their outbound pipeline. I noticed you're hiring an SDR.").
- **Uses the signal as a flattery bridge** into a pitch ("...that is really impressive, and it made me think you might be dealing with some scaling challenges we could help with").
- **Recites raw scraped data as a line (surveillance):** a headcount or department count read back at the prospect ("you have 14 people in Sales", "you have 10 SDRs"), or named individual employees ("I saw Mike and Laura on your team"). A scraped count is a targeting input, not a copy line; lead with what it means. Department headcount in particular is a filter, never the first sentence (see `/campaign-copywriting` Signal Angle Library, department-headcount caveat).

The full six-mode guidance lives in `/campaign-copywriting` (Signal-First Anti-Patterns); take the test from it, not example lines.

**The demoted-relevance PS passes this test** (Aaron's opening-line swap, examples §1.1): its "so what" is the offer it follows. It must still be true of every contact in the slice (Hard Rules 34 and 38, B13), never a per-contact fact.

---

## Buzzword & Jargon-Metaphor Bans (plain vocabulary, Hormozi tone): HARD RULE (2026-07-12)

Cold copy must sound like a plain-spoken operator talking to a peer, not a marketing brochure. The list below is the house's; the principle is also Aaron's own (no jargon and no self-declared uniqueness, doctrine §9, examples §8). Ban buzzwords and jargon-metaphors dressed up as insight; say the plain thing instead. This is a voice/clarity rule, not a deliverability rule: these words don't trip spam filters, they just read as corporate filler.

Banned (rewrite to plain language):
`leak` / `leakage` (say "where you're losing revenue most" / "lose to manual billing"), `unlock`, `leverage` (as a verb), `streamline`, `optimize` / `optimise`, `supercharge`, `seamless`, `synergy`, `empower`, `robust`, `game-changer`, `frictionless`, `turnkey`, `cutting-edge`, `best-in-class`, `next-level`, `revolutionize`, `transform` (as hype).

- A real industry term the buyer actually uses (`true-up`, `usage-based billing`, `reconciliation`) is fine; a buzz-metaphor is not.
- An internal offer/campaign NAME may keep a term like "Billing Leakage Teardown"; the prospect-facing email copy stays plain.
- **No source citations in the email body** ("(MGI Research)", "(Gartner)", "(2024 study)"): the number belongs in the copy, its provenance belongs in our records. Full rule: `/campaign-copywriting` ("the number goes IN the offer, plain and direct") + `cold-email-copy-best-practices.md`.

---

## Unsubscribe / Closeout Line Rules

**No email in the sequence carries an opt-out or closeout line** (Aaron's kill-list: cut opt-out lines, *"That's really not necessary"*, doctrine §9; B9; `/campaign-copywriting` QA: no goodbye or closeout language anywhere in the sequence). A closeout line is any line that announces the sequence is ending, says goodbye, or tells the reader how to make us stop. A campaign's opt-out mechanics live in the sending platform: the one-click List-Unsubscribe header, stop-on-reply, and suppression of stop replies (house compliance rule). **The one exception is a legally required notice:** where a client's counsel or the recipient's jurisdiction requires a visible opt-out notice, add exactly what is required, record it as a compliance requirement (the legal requirement overrides style, B10), and phrase it by the rules below. A casual risk-elimination line (examples §5, "If it's not a fit, no hard feelings.") is not a closeout and stays allowed as a P.S. job or follow-up content (B1). (operator-approved Aaron alignment, 2026-09-21: the rules below used to govern any closeout line in a later step; closeout allowances are now limited to legally required notices. The earlier text is archived at `outbound/_archive/aaron-alignment-2026-09-21/spam-word-checker--unsubscribe-closeout-line-rules.md`.)

Never write an unsubscribe line that promises to stop following up based on silence. The sequence keeps running unless the prospect takes an explicit action. Silence-based promises are misleading and fail to match actual behavior.

**Banned patterns (silence = we stop):**
- `I will take silence as a no`
- `read no reply as a pass`
- `assume no response means no interest`
- `If I don't hear back, I will leave it there / let this one go / leave you alone`
- `I am happy to stay out of the way` (if implied by context)
- Any construction where the user doing nothing = we stop sending

**Allowed phrasing, for a legally required notice only (explicit user action = we stop):**
- `A reply of 'no' / 'not for us' / 'pass' is enough and I'll step out of your inbox` (action-conditional)
- `Just say the word and I'll stop` (asks for action)
- `A one-word reply works fine if you'd rather I stopped` (asks for action)

Four lines this list used to allow as general closeouts (`You can ignore this`, `Happy to try back later when timing makes more sense`, `If this isn't the right angle, tell me what is`, `If I misjudged the fit, I'd rather know than guess`) are not notices, so they are retired (operator-approved Aaron alignment, 2026-09-21; doctrine §9; `/campaign-copywriting` QA); the original list is archived with the paragraph above.

Rule of thumb: **the user has to do something explicit for the sequence to stop**. Silence keeps the cadence running.

---

## Safe Replacement Patterns

These are style preferences, not a hard-fail scan (there is no enumerated blocklist behind them anymore). They read better and sound less like an ad, which is worth doing regardless of any spam-filter effect.

| Hype / Risky Phrasing | Preferred |
|---|---|
| `free consultation` | name the free deliverable instead (a useful piece of actual work beats a consultation, doctrine §3) |
| `special offer` | name the specific free deliverable |
| `act now` | `if relevant, happy to send details` |
| `guaranteed results` | casual risk elimination, such as free until the result (examples §5) |
| `click here` | `let me know and I can send it over` |
| `limited time` | drop it; if capacity is genuinely limited, state the real limit (doctrine §5: scarcity comes from real capacity) |
| `increase revenue` | name the deliverable and let it imply the outcome (doctrine §4) |
| `Want me to send it?` / `Want us to send it?` | Framework A Email 1: one soft permission ask after the deliverable, by default `Would that be worth sharing more?`; later steps may use an easy-yes opt-in |
| `Worth a look?` | `Would that be worth sharing more?` after the specific free deliverable |

---

## Rewriting Logic

- Rewrite hype into plain, specific language
- Replace pressure with permission
- Replace promotional wording with specific business language
- If a line sounds like an ad, coupon, scam, or phishing message, rewrite it
- If a bump sounds filler-heavy or vague, replace it with a fresh value angle (strip it back with a lower-friction ask, lean on a different value prop or mechanism for the same offer, or add to it; Aaron's three directions, Sep 21, ledger R12; Aaron process alignment, operator directive 2026-09-22, supersedes the two-direction fork), never a closeout line; a closeout appears only as a legally required notice (Unsubscribe / Closeout Line Rules; operator-approved Aaron alignment, 2026-09-21)
- If a value line uses fuzzy wording (`tight`, `fit`, `access`, `problem`), rewrite so the operational meaning is explicit
- If a reply acknowledgement sounds low-status (for example `appreciate the reply`), remove it and go straight to the next useful question. Aaron's reply rule points the same way: *"One sentence is almost always the better move."* (examples §7.3)
- If a line hedges (for example `on the off chance`), assert it or cut it (house no-hedging rule)
- If a sentence sounds AI-polished, simplify until it reads like a person speaking plainly
- If proof is written as a dash parenthetical, split it into plain sentences
- If a colon is carrying a long list or proof stack, split it into short sentences.
- If a sentence uses comma-wrapped descriptors, move the descriptor into its own sentence.
- If Email 1 and Email 3 offer the same vague deliverable, change the deliverable or route back to `/campaign-copywriting`.

---

## Final QA Checklist

Before approving any copy:

- [ ] Email 1 subject is 2 to 4 lowercase words with 0 to 2 variables and no deceptive framing (no `FW:` or fake thread). It is not bland or generic, and it keeps raw statistics, percentages, hype, and the offer out of the subject (house). (operator-approved Aaron alignment, 2026-09-21) "your [the offer's own object]" (Sep 21 "your trial") and `fyi {{first_name}}` (examples §3) are normal options that pass the relevance test (Aaron process alignment, operator directive 2026-09-22).
- [ ] Scan for buzzwords / jargon-metaphors (`leak`/`leakage`, `unlock`, `leverage`, `streamline`, `optimize`, `seamless`, `synergy`, `empower`, `robust`, `game-changer`, `frictionless`, `turnkey`): rewrite to plain vocabulary (HARD RULE). No source citations in the body (`(MGI Research)`, `(Gartner)`).
- [ ] A real quantified value exists in the locked offer record. In Email 1 the "number in the offer" is the deliverable's own quantity, turnaround, or effort number (house rule, B15); any benchmark or cost-of-inaction figure goes to the P.S. as its single proof or relevance point, or to a follow-up. A no-number version passes only as a labeled arm, when the number makes the line less conversational (Sep 21; Aaron process alignment, operator directive 2026-09-22). No fabricated number and no storytelling preamble.
- [ ] No segment or acronym label said AT the reader (`MSPs lose...`, `for SaaS companies like you`, `as a fintech...`). Speak to "you" (not the company-name variable, B5) and attribute benchmarks to their cause, not their category (HARD RULE). Value or loss named simply (revenue), not vague and not over-listed.
- [ ] Copy is PLAIN and value-first: no buzzwords / jargon-metaphors; no story-telling preamble before the offer; the deliverable leads the offer sentence, with no benchmark or setup line before it (HARD RULE, B15, see `/campaign-copywriting` + `cold-email-copy-best-practices.md`). A real industry term the buyer uses (e.g. `true-up`) is fine.
- [ ] Scan for em dashes of any kind, en dashes used as dashes, double hyphens, and mid-sentence dash separators
- [ ] Scan for colon-as-runway sentences and comma-wrapped company descriptors
- [ ] Scan for weak follow-up openers and follow-up-reference openers
- [ ] Scan for observational openers (`I noticed`, `I saw that`, `Congrats on`, `I stumbled upon`, `I came across`, `I wanted to reach out`) and for any self-introduction
- [ ] Line 1 is offer-led and carries no signal (`/campaign-copywriting` Hard Rule 19; the signal-first opener is retired 2026-07-17). Apply the implication test to any line that references a signal, even when it reads as plausible: reject lines that compliment the signal, name the fact with no "so what", lead with generic pain before the signal, bury the signal behind a pitch, use the signal as flattery into a pitch, or recite a raw scraped count / name-drop employees (surveillance)
- [ ] Scan for fake-familiarity / warmth phrases (`I hope this email finds you well`, `I know you're busy`, `hope you're well`, `hope this finds you well`, `circling back`, `touching base`, `bumping this`, `just nudging`, `did you see my last email?`, `I wanted to connect`, unearned flattery, unsupported fit claims) and any warmup before the first relevant line; first two lines pass the said-out-loud test
- [ ] Confirm Framework A Email 1 against the contract in `outreach-copy-framework.md`: no greeting word, the first name optional (it may open the email or sit later in the sentence), the specific free deliverable first, 25 to 35 body words by default (P.S. excluded from the count; it stays short and does one job), 2 to 3 main-body sentences (one for the one-liner), one primary ask, the scope disclosure whenever the real process supports it, and no company-name variable by default. Any optional P.S. is short, declarative, and does one of the four B1 jobs (operator-approved Aaron alignment, 2026-09-21)
- [ ] Confirm the body format matches its slot: compact Framework A offer block for Email 1; short separated blocks for later messages
- [ ] Confirm grammar is clean and reads naturally aloud, with no awkward over-compression or dropped connective words
- [ ] Confirm Email 1 ends with its one primary ask, a soft permission CTA (default `Would that be worth sharing more?`, or a whitelisted variant such as `Would that be worth a quick test?`, `Would that be useful?` or `Would that be helpful?`), or the conditional statement in its labeled arm; reserve `Just reply "Yes"...` for later steps; flag any `Want me to…` / `Want us to send…` / `Interested?` / `Worth a look?`, and any meeting ask such as `compare notes`
- [ ] Scan separate new-thread CTAs for repeated generic deliverables
- [ ] Every email ends with a CTA or clear next step, support emails included (the only exception is a labeled no-CTA Email 1 test arm, B3); flag any email that trails off into a dead-end soft close with nothing to answer
- [ ] Rewrite any hype-heavy or pressure-heavy line into plain language
- [ ] Remove fake urgency
- [ ] Confirm email sounds like a credible real person, not a promotion
- [ ] When the offer is free, the body says `free` or `no cost`
- [ ] No money-back guarantee as risk reversal, and any `no strings attached` is literally true (B7)
- [ ] No `audit` as the name of the offer
- [ ] Email 1 has no salesy sign-off, and no email in the sequence has an opt-out or closeout line except exactly what a legally required notice needs (recorded as a compliance requirement, action-conditional, never silence-based) (operator-approved Aaron alignment, 2026-09-21)
- [ ] Checked against Aaron's rejection bank (`aaron-examples.md` §8) and Aaron's Named Bans above

---

## What to do next

**If flags cleared:** read `run_state.sending_platform` from the profile or campaign plan, and resolve the sending platform against the stack contract. Run only the workflows belonging to that one locked platform, in this order: its variant-syntax (spintax) pass first, then its campaign upload. Whatever tool fills the role, use its own native variation syntax and its own upload workflow. The variation pass touches the shared follow-up text only, never an Email 1 variant column, and the upload wires one variation per declared Email 1 column (`email_1_a`, `email_1_b`, `email_1_c` by default) on an even split, stopping rather than dropping Variant C (`/campaign-copywriting` Spintax Rules and Split testing; Aaron process alignment, operator directive 2026-09-22).

If `run_state.sending_platform` is unset, or the sending-platform role is empty in the contract, stop and route to `/stack-setup`. Do not guess a platform and do not fall back to a platform named in any example.

Do not show the off-path platform. Provider drift after QA is how campaigns get uploaded to the wrong tool.

**If flags fired:** back to `/campaign-copywriting` to rewrite the flagged lines. Re-run this check after.

**Or wait:** this skill auto-triggers on every copy draft. There is no standalone "next". Continue whatever copy work you were doing.

## Related skills

- `/outreach-copywriting` - applies the cross-channel Framework A first-touch rule
- `/campaign-copywriting` - produces the copy this skill screens
- `/ask-aaron` - the sourced doctrine behind the risk-reversal and offer-first guidance above, and the source of the named kill-list and the rejection bank (`aaron-examples.md` §8); advisory only, does not relax this skill's rules

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short: record status, not raw output. Full protocol: `client-activity-log.md`.
