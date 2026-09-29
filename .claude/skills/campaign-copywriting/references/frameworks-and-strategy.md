This file holds the house copy frameworks and strategy (Core Copywriting Framework, AI Personalization Decision Framework, Offer Framework, Variable Schema, Email Structure, Subject Line, Opener, Opener Framework, Human Voice, CTA, Follow-Up Sequence and Split Testing), moved verbatim from `../SKILL.md` on 2026-09-28. Read it when the operator asks for the house copy flow, or when one of these sections is cited by name. Words like "above" and "below" refer to the original single-file order; the "Where the rest lives" table in `../SKILL.md` says where each named section now is.

## Core Copywriting Framework

### Philosophy

- The offer is the product; the copy is only its delivery vehicle (doctrine §1, §3). Fix the offer before touching a word.
- Research picks the list and the slice. A signal's primary job is list relevance, not copy content (doctrine §8, ledger R13; operator-approved Aaron alignment, 2026-09-21).
- Shorter usually wins, but clarity wins over arbitrary length.
- Earn replies before trying to book meetings.
- Give each email one job.
- Make the email about the recipient's situation, not the sender's company.
- Use plain language that sounds like a credible person.
- Frame broad claims as observations only when they can be defended.

---

## AI Personalization Decision Framework

**Scope after Hard Rule 34's resolution (operator-approved Aaron alignment, 2026-09-21; widened by Aaron process alignment, operator directive 2026-09-22).** Beyond the first name, only the per-contact variables Hard Rule 34 names enter the copy (`sells_to_vertical`, `service_offered`, `own_best_client`), at most two per email, inside the offer sentence. `service_offered` and `own_best_client` may be cheaply derived by Claude sub-agents from the prospect's own site (`/personalization-subagent-pattern`), each with an evidence URL, as short factual phrases; never by an AI column in the list workbench. AI variables that only add relevance wording per contact (observation lines, context lines, relevancy nudges) are per-contact inserts, which Aaron superseded (ledger R13); use AI enrichment to pick the slice and the offer instead, and put slice-level context in the shared body. Everything below applies within that scope.

Before adding AI-generated company context, ask whether it changes the relevance of the email.

Use AI variables when:

- the product or service applies differently based on the prospect's business
- the buyer context changes the strongest value angle
- the variable adds non-obvious relevance
- the variable can be written naturally in a short line

Skip AI variables when:

- the use case is identical across the list
- the variable only summarizes the prospect's website
- the line would still work if the company name changed
- the variable creates awkward wording or scraped-looking copy

Required AI variable QA:

- factual
- short
- non-obvious
- no banned tokens

**At scale (20+ leads):** generate these per-lead AI variables with `/personalization-subagent-pattern` (parallel Task sub-agents) rather than by hand. It enforces the same QA above and the `spam-word-checker.md` rules, then feeds the variables back into this copy. For small batches, write them inline. Under Hard Rule 34 this per-lead generation serves enrichment that picks slices and offers, plus the at most two per-contact variables Hard Rule 34 allows; the per-row rendering bakes in the first name and those values, and nothing else.
- grammatically safe in context
- first 20 generated values reviewed before scaling when AI personalization is used
- prompt refined before full run if more than 3 of the first 20 values are vague, generic, awkward, or factually off

---

## Offer Framework

Every offer should map to one main value category:

1. Save time.
2. Create business value.
3. Reduce cost or waste.

Rotate angles across follow-ups only when the new angle is meaningfully different. Do not repeat the same claim in different words.

---

## Variable Schema

### Core Variables

- `{{first_name}}`
- `{{company_name}}`
- `{{role_title}}`
- `{{company_domain}}`
- `{{industry}}`

### High-Signal Variables

Targeting and slicing only, never copy (ledger R13, Hard Rule 34; operator-approved Aaron alignment, 2026-09-21). These are per-contact observations: they choose the slice, the offer each slice gets, and who is emailed, never a line in the email. A fact true of every contact in a slice can still ride inside the offer sentence or the P.S. as shared slice copy (Hard Rule 38), never as a per-contact insert.

- tenure or role context
- recent content topic
- competitor or category context
- technology stack
- team growth signal
- account-specific research signal

### Per-Contact Copy Variables (at most two per email, inside the offer sentence; Hard Rule 34)

Aaron process alignment, operator directive 2026-09-22. Each carries a `_source` evidence URL; rows missing a value get the fallback body.

- `{{sells_to_vertical}}`: who the prospect sells to (existing column)
- `{{service_offered}}`: the prospect's own product or service, a short phrase (new column)
- `{{own_best_client}}`: the prospect's own best client, from their own site, used as the deliverable's target (new column, optional)

### AI-Generated Variables

Slice-level use by default (Hard Rule 34). The exceptions are the two Aaron runs per contact (Sep 21), which may enter the offer sentence as the per-contact variables above: customer type (as `sells_to_vertical`) and product or service category (as `service_offered`), each derived by Claude sub-agents, never by an AI column. The case study the deliverable targets is per contact as `own_best_client` where sourced, else set per slice. The company-name variable above is not a default in copy (Hard Rule 2).

- customer type (per contact as `{{sells_to_vertical}}`, Aaron process alignment, operator directive 2026-09-22)
- product or service category (per contact as `{{service_offered}}`, same directive)
- use case
- business context
- pain point: targeting and slicing only, never copy (ledger R13, Hard Rule 34); a model-generated pain point is a hypothesis, never a fact about a named person (doctrine §5 step 1)
- relevant observation: targeting and slicing only, never copy (ledger R13, Hard Rule 34)

### Proof Variables

- proof category
- result
- metric
- customer type
- timeframe

### Formatting

Always use `{{double_braces}}` in drafts.

Never quote, bold, italicize, or decorate variables.

---

## Email Structure

### Target Length

- Email 1: the default 25-to-35-word band and 2 to 3 sentences, both counted on the body with the declarative P.S. outside the count (short, one job), one primary ask (Hard Rule 27). The one-liner shape may be a single sentence; a longer version runs only as a logged A/B arm (ledger R07); never so short it reads like a bump.
- Follow-ups should be short, usually under 50 words, with the same spec as Email 1: short, standalone, conversational, one clear CTA (doctrine §11).

### Structure

Aaron's four beats, "Catch their attention, drop the offer, clear CTA, bang." (doctrine §9), in the Framework A anatomy (structure updated; operator-approved Aaron alignment, 2026-09-21):

1. The offer, on line one: a free concrete deliverable, usually as a conditional, with "free" or "no cost" said out loud and the scope disclosure whenever it reflects the real process.
2. One soft permission CTA.
3. Optional P.S. doing ONE job: the relevance demoted from line one, one near-twin proof point, a casual risk-elimination or reason-it's-free line, or the deliverable's own terms (turnaround and their one small act, examples §1.5).

Every part must pass the Copy QA Gate. The old structure (situation recognition, value claim and proof, CTA) is archived at `outbound/_archive/aaron-alignment-2026-09-21/campaign-copywriting--email-structure-signature-and-openers.md`.

### Layout

Write the email as short blocks separated by blank lines, not one dense paragraph. The two canonical shapes, A/B-tested against each other (ledger R14):

```text
[The offer, the scope disclosure when real, and the soft permission CTA. The one-liner.]

[Optional P.S. doing one job.]
```

```text
[The offer and the scope disclosure when real.]

[The soft permission CTA.]

[P.S. doing one job.]
```

The pain-first or relevance-first two-liner (a pain or relevance line as its own first block, then the offer and CTA) runs only as the labeled R14 test arm, never the default (Hard Rule 25). A blank line between blocks is required. This is whitespace, not banned formatting. It is what makes the email scannable in a busy inbox and on a phone. The blank lines are part of the body: in the pre-written copy path they are stored inside the `email_*` CSV cell; in the template path they are in the step body.

### Signature (sign-off)

Email 1 (the single new thread) closes with the sender's first name and the company name, each on its own line: no job title and no location (Hard Rule 23; operator-approved Aaron alignment, 2026-09-21). Aaron's rule is the name and the company, no title, "Just super simple"; he also cuts the location and salesy sign-offs such as "Thanks for the time" (doctrine §9). First name only is the house reading of his "Just put your name" (operator-approved Aaron alignment, 2026-09-21). The same-thread follow-ups (Email 2, and Email 3 in a 3-step) sign with the first name only. Use this format for Email 1, plus the house phone line, which is added only when `sender_persona.phone` is set:

```text
{first name}
{company name}
{phone}          ← only when client has supplied a sender phone (sender_persona.phone)
```

**Legal requirements override style** (the doctrine's own rule, not Aaron's words: doctrine §11 states "Campaign caps, legal requirements, and opt-outs override." in the corpus author's voice): where a client's counsel or the recipient's jurisdiction requires a sender postal address or other identification, add exactly what is required as its own line and record it under Compliance in `copy.md` and in the activity log, as a compliance requirement, not a style choice. (The opt-out is not part of this confirmation: opt-out handling is always the house default and is never asked, `../SKILL.md` Compliance item 0a.) Confirm this per client before launch; the old city-and-country line was never a postal address.

In-thread follow-ups (Email 2 and optional Email 3) MUST still sign off, but the first name alone is enough. A follow-up with no sign-off is a hard failure. In the pre-write path, the follow-up steps are `{{email_2}}` / `{{email_3}}` followed by the first-name sign-off, set on the step.

- The first name is the sender persona's first name (from `client-profile.yaml` `sender_persona.name`). The company name comes from `client-profile.yaml` / the client's public contact page. No title line, so never invent a title for a fabricated persona. The old 3-line block (full name, title @ company, city and country) is archived at `outbound/_archive/aaron-alignment-2026-09-21/campaign-copywriting--email-structure-signature-and-openers.md`.
- Render each signature line on its own line. On platforms that store HTML bodies, separate the lines with `<br>` or separate `<div>`s. Never collapse the block onto one line. **On a sending platform that stores bodies as HTML (verified on one such platform 2026-06-19): a raw `\n` in the STATIC step text is collapsed by the platform's HTML store and renders run-together (`Jane DoePartnerships @ ExampleCoNew York, USA`), so the appended signature MUST use `<br>` line breaks, never `\n`.** This applies only to the static step text; the merge field `{{email_1_a}}` carries the per-contact body, whose `\n\n` block breaks such a platform DOES convert, so leave those as `\n` in the CSV. Resolve the sending platform from the stack contract (if the slot is empty, stop and route to `/stack-setup`), and always verify with that platform's own email preview on a real lead before launch.
- **Phone line (optional, house):** the phone line is added only when `sender_persona.phone` is set (in `client-profile.yaml`); append it as the last line, joined with the same `<br>`. Use ONE fixed number per persona: the persona is one real human, so it never shows two or three different numbers across the client's campaigns. If the client gives several numbers, the first is primary and the rest live in `sender_persona.phone_pool` as spares (swap if a number is ever flagged/burned). If `phone` is absent or `pending` ("Soon"), it is not set: the name-and-company block stands; never invent a number. The phone is static sender identity, configured once on the step exactly like the rest of the block.
- Do not spin, AI-vary, or A/B-test the signature (phone included).
- Place the signature in the sending tool, never in per-contact lead or CSV data. In the `variants.yaml` template path it is part of the campaign step body. In the pre-written copy path (see Pre-Written Email Copy Architecture) the body variable carries no sign-off, and the static signature block is appended below the variable on the sending-tool step, for example `{{email_1_a}}` followed by the name-and-company block (plus the phone line, and any Compliance line).

---

## Subject Line Strategy

Email 1 subject lines must be:

- 2 to 4 words
- plain
- connected to the body
- low drama
- clear of banned wording
- credible if seen in isolation
- lowercase
- built with 0 to 2 variables (operator-approved Aaron alignment, 2026-09-21: Aaron says "one to two variables" and also shows zero-variable subjects, doctrine §9)
- curiosity plus relevance, so a reader who does not care about the topic can tell (examples §3)
- tested last: subject lines are his lowest-leverage lever (doctrine §9)
- spun like everything else (HARD RULE, operator directive 2026-09-30): the Email 1 subject carries a spintax block in the sending platform's syntax, option A is the approved subject exactly as written, and every variant carries the identical block (`../SKILL.md`, Spintax Rules). Spinning does not make the subject a test variable.

Avoid:

- generic curiosity
- fake urgency
- promotional phrasing
- fake thread prefixes, and any implied emergency, invoice, account fault, or internal relationship that does not exist
- over-personalized scraped fields
- subject lines that promise more than the body delivers

---

## Opener Strategy

**The opener leads with the OFFER (Hard Rule 19).** Three bullets here used to say otherwise ("reference the recipient's situation first", "use a real signal when available", "avoid broad claims before the relevance signal"). That was signal-first ordering, and it is **RETIRED (2026-07-17)** with the Signal-First Opener Rule below: the offer comes first, not the situation or the signal. A slice-SHARED signal fact may ride inside the offer sentence (Hard Rule 38), never ahead of it.

Openers should:

- lead with the offer itself: a free concrete deliverable, with the dream outcome implied by what it contains (doctrine §4). The sentence shape follows the offer type (operator decision 2026-09-23, Aaron pre-launch gap audit; Aaron Sep 7, Sep 14, Sep 21). For a free deliverable, deliverable-first stays the default (his measured winner; Sep 7, "if we could [deliverable] at no cost ..."). For a free trial, a pilot or a pay-on-result offer, a conditional that names the outcome and pairs it with its risk term is the default, not an arm ("if I had a way to [outcome] ... and you only pay per [unit], would that be worth a quick test?", Sep 21; "if we could help you get [result] ... free for [x] days", Sep 14; doctrine §4, his Jun 29 script). Either shape may run the other as a labeled arm. The limits are unchanged: no proof claim on line one, no guarantee on the core service (pay only on a counted result is not a guarantee), and an outcome that is not a stretch (that last limit is the corpus's reading, not his words). Still banned: an outcome stated with no risk term, and the retired bundle of an outcome plus a named comparable and its number on line one (proof goes to the PS, one point).
- avoid greetings and pleasantries
- avoid sender-centered setup
- avoid generic AI summaries

If the offer could be sent by any competitor to any list, rewrite it (Aaron's company-swap test, doctrine §8). Note the level this test now runs at: the opener is deliberately SHARED across the whole campaign or slice (`{{first_name}}` optional, no company-name variable by default), so "it applies to many people" is by design and is not the failure. The failure is an offer so broad it is specific to no one. Make it specific to the slice, not to the individual.

---

## Opener Framework (Email 1 and Email 3)

The current rule is short: every new-thread email opens with an OFFER-LED opener that leads with the offer itself (a free concrete deliverable with the dream outcome implied by it, or, for a trial, pilot or pay-on-result offer, the outcome named with its risk term, either shape able to run the other as a labeled arm, doctrine §4; operator-approved Aaron alignment, 2026-09-21; operator decision 2026-09-23, Aaron pre-launch gap audit), per the Offer-First Copy Standard and Hard Rule 19, never a warmup or self-introduction. The opener is shared across the whole slice; the per-row fills are an optional `{{first_name}}` (it may open the email) and, inside the offer sentence, at most two per-contact variables (Hard Rule 34; Aaron process alignment, operator directive 2026-09-22). There is no per-contact opener generation and no personalization-source priority order.

The pre-2026-07-05 question-first / diagnostic-mirror opener framework, its per-contact personalization-source priority order, and its worked examples (including one that ran ~85 words, over the current cap) are archived at `outbound/_archive/proven-mode-1to1-retired-2026-07-05/opener-framework-and-personalization-priority.md`. They were left fully quoted in this file for a long time despite being retired, which is exactly the kind of drift that makes a live-looking instruction dangerous; do not resurrect them into live copy.

---

## Human Voice, Not Fake Warmth (Hard Rule)

The warmth in an internal-team email comes from a relationship that already exists, not from the casual words. A cold prospect has no relationship with you. Bolt a casual preamble onto a cold email and you get the costume without the body: fake familiarity, which reads worse than being direct. Personality in cold email never lives in a warmup. It lives inside the first relevant line. **Voice, not warmth.**

Two different things get called "personality." Only one belongs in cold outbound.
- **Chit-chat warmth (BANNED):** "hope you're well," "saw you're crushing it," "following up from my last note." Implies a relationship that does not exist.
- **Human voice (REQUIRED):** cadence, a point of view, the sound of a busy person who knows the world and dashed off a note.

### Hard prohibition (never write in any cold email or cold follow-up)
- "Hope you're doing well" / "Hope this finds you well" / "Hope you're having a great week"
- "Just checking in" / "Just following up" / "Following up on my last email" / "Circling back" / "Touching base" / "Bumping this"
- "I wanted to reach out" / "I wanted to connect"
- "Saw you're crushing it" / "Big fan of what you're building" (unearned flattery to a stranger)
- Any phrase that implies shared history or that the reader already knows who you are
- Any warmup sentence placed before the first relevant line
- Aaron's own bans on the same theme (operator-approved Aaron alignment, 2026-09-21; doctrine §9, §11; examples §7.1, §8): "I know you're busy", "just nudging", "did you see my last email?", any line that names the non-reply, "recognize you're probably slammed", introducing yourself or your company, and any preamble token before the offer

Why these fail on a cold list: most recipients never registered your first email, so "following up on my last" reads as "what email?"; the few who saw it and ignored it are reminded they ignored you; and these are the most pattern-matched phrases in the inbox, so the brain files the message as an automated sequence before reading the next line. (These extend the observational-opener bans in `spam-word-checker.md` and the Signal-First Anti-Patterns bank above, which survives the 2026-07-17 signal-first-opener retirement.)

**Aaron's voice spec (doctrine §9, Voice).** Casual first person, peer to peer. A "text from a friend" feel, but competent: natural does not mean sloppy, and there is no false intimacy. Plain words, no jargon, never self-declared uniqueness. It must not read like a template, because a reader who recognizes a template stops reading however good the offer is (doctrine §1).

### The said-out-loud test (apply to every cold email and follow-up)
Read the first two lines out loud. Would a busy, competent person who actually knows this world say this to a peer? If it sounds like a brochure, a press release, or a textbook explaining how the industry works, it fails. Rewrite until it sounds like a real person talking. A line passes only if it has at least one of:
- **A point of view**, not just a fact ("quietly," "never notice," "only ever slips one way")
- **Spoken rhythm** (contractions, a short punchy clause, the cadence of speech)

(A third option, an honest frame about the cold contact such as "quick one," is retired: it is a preamble before the offer, doctrine §9; operator-approved Aaron alignment, 2026-09-21.)

**The statement/explainer trap (the most common failure mode, and the one that produced the worst prior copy).** An opener that explains how the industry works (a true, neutral, textbook sentence with no point of view) is the most common way a cold email reads as vendor wallpaper. It is grammatically clean and factually correct, which is exactly why it slips through unnoticed. It still fails: it is picture-painting before the offer, which Aaron bans (doctrine §9). The fix is not a question, since a question-form pain opener is banned too; the fix is to open on the offer and demote any relevance to the P.S. (the opening-line swap below). Client-agnostic example, WRONG (industry explainer): `Marie, smart meters and dynamic tariffs mean every read has to land cleanly in what the customer gets charged.` The old RIGHT example, a question-form opener, is archived at `outbound/_archive/aaron-alignment-2026-09-21/campaign-copywriting--human-voice-cta-and-follow-ups.md` (operator-approved Aaron alignment, 2026-09-21).

### Where the voice lives
Not in a preamble before the point: every word before the offer is a word that gets you deleted, because you have not earned the warmup. The voice goes INTO the offer sentence and the P.S. Same facts, with a person behind them, and the offer first. Aaron's own before/after, his most transferable copy move (examples §1.1, `[AS]`):

> **Before (rejected):** "Hey first name, notice you're running static ads on Meta, so thought I'd reach out if we could ideate, script, edit, and record one free UGC ad creative for you. Would that be worth sharing more?"

> **After (his model):** "first name, if we could ideate, script, edit, and record one free UGC ad creative for you. Would that be worth sharing more? PS, thought it'd be relevant since you're currently running ads on Meta and 100% of them are static."

The relevance was not deleted; it was demoted to the P.S. The scope disclosure sits in prose ("ideate, script, edit, and record"), there is one free deliverable, and leading with the offer gets to the reader before they can fall off (doctrine §9). Two notes so the exemplar is not over-read. His After version opens on the bare name, which is allowed: the first name is optional and may open the email, and his first-name-second move (doctrine §9) is an alternative trick, not a rule. His P.S. sits outside the 25-to-35 body count; the body here runs about 22 words, a little under 25, which passes because it still carries the whole offer. And the portability rule applies (doctrine §9): copy the shape, never these sentences. The old flat-to-voice pair (a pain line that also labeled the reader "MSPs") is archived at `outbound/_archive/aaron-alignment-2026-09-21/campaign-copywriting--human-voice-cta-and-follow-ups.md`.

### The two levers (optional: test them, never assume)
1. **Inject a point of view**: a fact states what is true, an observation states what you think about it. It lives inside the offer sentence or the P.S., the way "same shape, same buying signals" in Aaron's winner is elaboration that "pushes that value forward" (examples §1.5), never in a line placed before the offer.
2. **Spoken rhythm**: use contractions ("you're," "it's," "they'll"); vary sentence length (a short clause after a longer one creates a human beat); cut connective fluff ("furthermore," "additionally," "as such," "in order to").

The micro human-framing token ("Marie, quick one.") that used to be lever 1 is retired: it is a preamble before the offer (doctrine §9; operator-approved Aaron alignment, 2026-09-21). The old lever list and its pain-line examples are archived at `outbound/_archive/aaron-alignment-2026-09-21/campaign-copywriting--human-voice-cta-and-follow-ups.md`.

### Email 1 examples
Aaron's curated exemplar set lives in `outreach-copy-framework.md` under `## Framework A (house name): the direct concrete offer, Aaron's measured winner anatomy`. The examples §1.5 winner and its loser are quoted in the Offer-First Copy Standard above, and the §1.1 swap just above. The old four-vertical flat-to-voice set is archived at `outbound/_archive/aaron-alignment-2026-09-21/campaign-copywriting--human-voice-cta-and-follow-ups.md`: every "voice" line in it opened on pain, observation, or proof instead of the offer (operator-approved Aaron alignment, 2026-09-21).

### Follow-up examples (the trap → what works)
- Trap (banned): "following up from my message a few days ago" / "just circling back on the below" / "bumping this to the top of your inbox." It fails because she likely never saw email 1, and the phrasing screams sequence.
- What works: a standalone message that does one job and never mentions the earlier email (doctrine §11). Aaron's own pair (examples §7.1, `[AS]`):

> **Bad:** "just following up on the above, interested in having me create that for you"
> **Good:** "interested in a free UGC ad creative"
> **Good (variant):** "interested in a 2-minute video that explains our XYZ process"

His de-escalation form, the same offer at lower friction, is the Loom follow-up: "Should I send you a two-minute Loom video showing you exactly how this works?" (examples §7.1). Shape, not sentences (doctrine §9). The old "works" list ("didn't want this to get buried", "one more nudge and I'll leave you alone", "figured this was worth a second try", "last one from me on this") is retired because each one names the non-reply or reads as a closeout (doctrine §11); it is archived at `outbound/_archive/aaron-alignment-2026-09-21/campaign-copywriting--human-voice-cta-and-follow-ups.md`.

### Reconciling with the offer-led opener (CORRECTED 2026-07-17)

**Superseded text, retained so the correction is visible:** this section used to say that when a real signal exists, the *signal still leads the first line* ("Marie, saw the SDR role's been open 50 days. Quick thought on that."). That contradicts Hard Rule 19 and is **RETIRED** with the Signal-First Opener Rule (2026-07-17). It also modelled an observational opener ("saw the SDR role..."), which was banned independently the whole time.

**The rule now:** the **offer leads the first line, always**, signal or no signal (Hard Rule 19; the only departures are the labeled variants, logged as test arms). The human touch lives in HOW the offer is voiced, never in a warmup before it and never in a signal bolted in front of it. No framing token delays the offer (retired; operator-approved Aaron alignment, 2026-09-21). Where a slice-SHARED signal fact earns a place, it rides inside the offer sentence or in the P.S. (Hard Rule 38), never ahead of the offer.

There is no longer a signal/no-signal branch here: every list, broad or sliced, gets the offer-led opener, so human voice plus the offer carry the open in both cases. Both levers matter, because the offer and the voice are the only things doing the work.

### Discipline (do not pick by vibe)
Whether a given human-voice variant beats the clean version is testable, and good operators disagree. Do not assume any variant helps. Run the clean version against the human-voice version (same offer, same CTA, at least 25 leads each) and judge on positive-reply rate with time-agreed replies per 1,000 first touches beside it; a winner must not lose on the meetings number (doctrine §0, §2 step 5). **The hard rule is the prohibition and the said-out-loud test; a specific lever is a hypothesis, not a law.**

---

## CTA Strategy

Use one value-backed CTA. Low friction matters, but a CTA that gives the prospect no reason to answer is weak.

Acceptable CTA types:

- value exchange
- resource offer
- routing question
- conversation (never Email 1's ask: if an offer seems to need a meeting ask, fix the offer, doctrine §2, and never downgrade Email 1 to a meeting ask, ledger R17; operator-approved Aaron alignment, 2026-09-21)
- concrete next-step recommendation

Email 1 uses Framework A: name the free deliverable first (for a trial, pilot or pay-on-result offer, the outcome with its risk term; operator decision 2026-09-23, Aaron pre-launch gap audit), include the scope disclosure whenever it reflects the real process, and end with one soft permission CTA (operator-approved Aaron alignment, 2026-09-21). The ask is permission to send or show something, not a meeting (ledger R17).

**Email 1 (the new thread): one soft permission question, by default.**

- `Would that be worth sharing more?` (the default, Aaron's signature ask, examples §4)
- his variants: `Is that worth sharing more?`, `Mind if I send it to you?`, `Do you mind if I send it to you?`, `Worth sharing more?`, `Would that be worth sending over?` (the last two normalized to sentence case and a question mark; examples §4 writes them without); for a free tool or trial, `Open to testing it for free?` (Jul 13) and `Would you be open to trying it out?` (Sep 14), normalized the same way, with his Sep 14 statement second CTA confined to the R19 longer arm (Hard Rule 32)
- his asks added by Aaron process alignment, operator directive 2026-09-22: `Would that be worth a quick test?` (pilot, trial and pay-per-result offers, Sep 21), `Would that be useful?` (examples §1.5), `Would that be helpful?` (examples §2.6)
- house variants: `Would that be worth hearing more?`, `Open to it?`, `Can I send it over?`

The full whitelist is at Hard Rule 32. The statement-only `Just reply "Yes"...` pattern remains available after the initial cold touch, but not in Email 1, whose default close is one soft permission question. A CTA-free Email 1 runs only as the labeled no-CTA test arm (examples §4), and a soft conditional statement close ("... if you're open to that kind of thing", Sep 21) only as its own labeled arm.

Acceptable permission-question alternatives (use when they read more naturally):

- `Can I send it over?`
- `Can I share it?`
- `Would it help if I sent that over?`

**Follow-ups (Email 2, and Email 3 in a 3-step): a forward-looking question or a conditional statement re-offer.**

- a light re-offer of that thread's deliverable framed as a question (`Should I pull it together for your accounts?`, `Would it help to see that breakdown?`)
- a routing question tied to the thread's angle
- a conditional statement re-offer at lower friction, no question mark needed, as in Aaron's Sep 21 Email 2: "If it's easier, I can send over a quick video elaborating on how we ..." (Aaron process alignment, operator directive 2026-09-22; shape, not sentence)

The friction ladder (doctrine §11): the heavier ask first and the lighter one second (for example a short video that shows how it works), with the reverse allowed as a test.

Avoid (needy / obligated / presumptuous):

- `Want me to send it?`
- `Want us to send it?`
- `Want me to share it?`
- `Interested?`
- `Let me know if you'd like…`
- `Worth a look?`
- CTAs that only ask whether the problem exists
- CTAs that make the prospect feel desperate for the sender's help

Harder CTAs are allowed only outside Email 1 (ledger R17; operator-approved Aaron alignment, 2026-09-21), and only when they provide clear direction and the strategy deliberately accepts the friction, such as a specific call, review, or next-step recommendation.

The recipient should be able to answer quickly. Avoid CTAs that require scheduling, multiple decisions, or a large commitment unless the user has explicitly chosen that approach.

Each follow-up takes one of Aaron's three directions (Sep 21; ledger R12, doctrine §11; Aaron process alignment, operator directive 2026-09-22): strip it back to the same offer with a lower-friction ask (a video, a short written version), lean on a different value prop or mechanism for the same offer, or add to it (a real concern pre-handled, a benefit layer, a risk reversal, the reason it's free). Do not keep offering the same vague note just because it is low friction, and never repeat Email 1 at the same friction (operator-approved Aaron alignment, 2026-09-21).

**Every email gets a CTA (follow-ups included).** Email 2 and optional Email 3 are not exempt. They close with a SOFT CTA, a light re-offer of Email 1's deliverable, a small forward-looking question, or a conditional statement re-offer ("If it's easier, I can send over ..."), so the reader always has a next step. A support email that trails off into a dead-end soft close ("happy to walk through it whenever," "the note still stands." with no ask) leaves the reader nothing to answer and fails QA. Re-offer, do not re-pitch; ask, do not nag. Email 2 re-offers Email 1's deliverable at lower friction, through a different value prop, or with something added, and Email 3 takes another of the three directions. This is within-thread reinforcement and matches Hard Rule 21, which since 2026-09-21 allows a lower-friction restatement of the same offer and forbids two steps sharing a CTA sentence (this resolves the older tension between this paragraph and the "same mechanism" test). Acceptable soft-CTA phrasings: `Should I pull it together for your accounts?`, `Should I sketch that out?`, `Open to that?`. Keep them off the banned `Want me to send it?` / `Worth a look?` stems.

---

## Follow-Up Sequence Framework

Every campaign is a single thread with 2 to 3 steps (Hard Rule 18): Email 1 plus one or two same-thread follow-ups. Two emails by default at every TAM size; a third only in a genuinely small market (roughly under 3,000 qualified contacts, a house threshold) or as a tested arm (supersedes the sequence-length-by-TAM table); a new-thread final follow-up only as a planned, logged arm. Aaron's own ceiling agrees: two emails, maybe three at the absolute most (examples §7.1). Each follow-up must earn its place, because his study puts 58% of losers in follow-ups (doctrine §9). Cadence Day 0 and Day 3; when a third runs, Day 0, 3, 6. Send Monday to Friday. His entire evidence is 2 to 3 days between emails (doctrine §11), so each follow-up's `delay_days` is 3, read as the wait after the previous step (Email 3's delay was 7; the per-step reading is flagged for confirmation on the first upload in the `variants.yaml` schema note). (Aaron process alignment, operator directive 2026-09-22.)

### Email 1 - Thread 1 New Thread

Use a new subject, an OFFER-LED opener (leads with the offer), the primary test angle, and the clearest campaign-plan offer, in three variants by default (A, B, C, each of B and C changing one variable against A). Build the opener per the Offer-First Copy Standard. (Question-first openers are retired with proven-mode.)

### Email 2 - Thread 1 Support

Use the same thread. Email 2 has the same spec as Email 1: short, standalone, conversational, one clear CTA (doctrine §11). It does one job (useful context, one meaningful point, a lower commitment, or a real objection) in one of three directions (Aaron process alignment, operator directive 2026-09-22): strip it back to the same offer with a lower-friction ask, lean on a different value prop or mechanism for the same offer, or add to it (a real concern pre-handled, a benefit layer, a risk reversal, the reason it's free, or the single proof point Email 1 deferred, examples §6). If Email 1 was already stripped back, take one of the other two. Close with a soft CTA (a light re-offer of Email 1's deliverable, a small forward-looking question, or a conditional statement re-offer such as "If it's easier, I can send over a quick video ...") so the reader always has a next step; never trail off into a dead-end soft close. Treat it as possibly the first email read: never narrate that it is a follow-up, never name the non-reply, and never assume they scroll up. No storytelling (doctrine §9). Updated (operator-approved Aaron alignment, 2026-09-21); the old "proof, story, useful context" wording is archived at `outbound/_archive/aaron-alignment-2026-09-21/campaign-copywriting--human-voice-cta-and-follow-ups.md`.

### Email 3 - Third Follow-up (a genuinely small market or a tested arm only)

By default use the SAME thread as Email 1 and Email 2, with an empty subject (Hard Rule 18 and the `variants.yaml` schema). Take a different direction from Email 2 (strip back, a different value prop or mechanism, or add a different layer such as the biggest benefit, a risk reversal, or the reason it's free), with a CTA sentence of its own (Hard Rule 21). It must still stand alone as a message, because the reader may not have read the earlier two. **As a logged arm only**, it may be planned as a new thread: its own 2-to-4-word lowercase subject, not a thread reply, a different variation of the same offer or a different pain (Aaron, Apr 13; Aaron process alignment, operator directive 2026-09-22; supersedes "never a fresh new-thread attempt", 2026-07-05). No upload path in this workspace wires that non-threaded step yet, so the threaded version ships until one does (Hard Rule 18). (Question-first openers are retired with proven-mode.)

### (No Email 4: the 4-email / two-thread structure was retired 2026-07-05)

There is no fourth step. Every campaign is ONE thread with 2 to 3 steps by default, and never more than three touches even when the final follow-up is planned as the logged new-thread arm.

---

## Split Testing Rules

When entering a new audience or testing a new signal, test meaningfully different Email 1 angles before scaling.

**Aaron's testing order (doctrine §5 step 9; operator-approved Aaron alignment, 2026-09-21).** The offer first, then the positioning of the offer, then the CTA and delivery; data source and segment are tested in parallel from launch; subject lines, his lowest-leverage lever, go last (doctrine §9). In an offer-validation wave the variable is the offer itself: the primary offer (`offer.lead_magnet`) and its validation arms (`offer.validation_arms`, written by `/lead-magnet-brainstorm`) run in the whole qualified TAM placed by fit (each offer where its own fit filters pass, equal cells on shared ground), launched together on the same copy skeleton, the primary with no head start, each arm judged on its own, and each cell's Email 1 carries its own three copy variants (Aaron process alignment, operator directive 2026-09-22); `/campaign-strategy` owns how arms are wired and judged. Judge winners on meetings, not replies: time-agreed replies per 1,000 first touches beside positive-reply rate, and a winner must not lose on it (doctrine §0, §2 step 5).

Rules:

- Keep structure consistent across variants.
- Change one variable at a time, not every variable at once (doctrine §5 step 9; Mar 9: "change one minute variable in every single one").
- **Email 1 runs three variants by default** (`email_1_a`, `email_1_b`, `email_1_c`; Sep 21: "variant one, variant two, variant three"): A is the control, and B and C each change exactly one variable against it. More letters are allowed when a test needs them, one variable each. (Aaron process alignment, operator directive 2026-09-22; supersedes two Email 1 variants.)
- Map each variant to one pain or value category.
- Do not split-test failed deliverability.
- The variant test and the QA standard ride Email 1; the follow-ups are single-variant same-thread replies (Sep 21 shows three step-one variants and one step two).
- The two canonical shapes (the one-liner vs two lines plus a P.S., ledger R14) are a standing A/B pair and a natural B or C; the proof P.S. against no P.S. is another, whenever on-file proof exists. Any other labeled variant runs only as a logged arm.
- Switch off a losing Email 1 variant in flight only on the read rules in `/experiment-design` (its ~1,300 first-touch floor, then the sequence plus grace), never on a ratio against the leader.
- Each follow-up must move the conversation (strip it back, a different value prop or mechanism, or add to it, Hard Rule 21), not a minor rewrite of Email 1's CTA.
- Every variant must pass the Copy QA Gate.
- Spintax runs on every variant and never touches the one variable that separates B or C from A (`../SKILL.md`, Spintax Rules; Hard Rule 40). The reworded options inside a variant are noise within that variant, not a test arm.
