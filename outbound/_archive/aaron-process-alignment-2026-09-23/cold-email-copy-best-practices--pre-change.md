# Cold Email Copy Best Practices

Purpose: define cold email writing standards that protect deliverability, inbox placement, readability, and reply quality.

This file is a principles-only guide. It must not contain reusable email copy, writing samples, sequence scripts, or industry-specific examples. For formatting, CTA, opener, and voice bans, `spam-word-checker.md` is the source of truth (it no longer enforces a banned-word keyword list; see that file for why).

Compiled from internal campaign-copywriting guidance and cold outbound operators including Aaron Shepherd (GrowthFlare; see `/ask-aaron` for the full sourced doctrine), Nick Abraham, Daniel Fazio, Michel Lieben, Patrick Spychalski, Eric Nowoslawski, Instantly.ai, and Nick Saraev.

---

## Required Use

Apply this guide whenever cold outreach copy is written, reviewed, revised, serialized, or prepared for upload.

Every subject line, opener, body line, CTA, follow-up, P.S. line, variable value, and YAML body must pass:

1. `outreach-copy-framework.md` for the initial cold touch (the Email 1 contract, B1 to B15, and Aaron's verbatim exemplars)
2. `spam-word-checker.md`
3. This best-practices guide

`outreach-copy-framework.md` controls the first-touch structure. `spam-word-checker.md` controls formatting, CTA, opener, and voice bans, including Aaron's named kill-list. This guide controls the remaining writing quality. Every draft is also checked against Aaron's rejection bank (`aaron-examples.md` §8 in `/ask-aaron`), which is a QA gate.

---

## Core Standard

### Framework A controls the initial cold touch (HARD RULE, 2026-08-12)

The first written cold message in any channel opens straight on a specific free deliverable with no greeting word and no preamble (an optional first name may come first; the labeled B3 variants in `outreach-copy-framework.md`, including the outcome-conditional arm, are the only exceptions), runs 25 to 35 body words by default (Aaron's floor and saturation exception apply), uses 2 to 3 main-body sentences (one for the one-liner) and one primary ask, carries the sender/prospect scope disclosure whenever it reflects the real process, and ends the main body with the soft permission ask, by default `Would that be worth sharing more?`. An optional declarative P.S. stays short, does one of the four B1 jobs, and sits outside both the main-body sentence count and the word count. Cold email adds a 2-to-4-word lowercase subject with 0 to 2 variables. (operator-approved Aaron alignment, 2026-09-21)

Most of this structure is Aaron Shepherd's own measured finding from his 1.5M-email study, not a house invention. What this workspace used to add was hardness (a hard cap with no exception, exactly one question, one merge token, a mandatory parenthetical); on 2026-09-21 the operator approved relaxing that hardness to Aaron's stated positions (B14). The full sourced breakdown of which piece is his and which is this workspace's lives in `outreach-copy-framework.md` and `/ask-aaron` (`aaron-doctrine.md` §13). (An earlier version of this section and `outreach-copy-framework.md` cited a fabricated-looking URL for this rule; that citation is corrected in `outreach-copy-framework.md`.)

This overrides older guidance that allowed 50-to-90-word or 70-to-90-word first messages as a default (a longer version now runs only as a logged A/B arm, ledger R07), setup before the offer, a statement-only initial CTA, or dropping a scope disclosure the real process supports. Full rule and QA: `outreach-copy-framework.md`.

Cold email works when the recipient can quickly answer Aaron's three questions (doctrine §4), plus one more:

- what's in it for them
- how long it takes
- what they have to do
- what simple reply is being asked for

Relevance comes from who is on the list (B13), not from explaining in the copy why they were chosen.

If any of those are vague, the copy is not ready.

The goal is not clever writing. The goal is a clear, plain note that feels specific enough to be legitimate and easy enough to answer.

---

## Deliverability And Inbox Rate Rules

- Use plain text only. No HTML styling, bold, italics, colored text, images, or heavy formatting.
- Keep links out of emails 1-3 unless the user explicitly overrides the rule for this campaign.
- Use zero or one link only in the final follow-up, and only when the campaign strategy explicitly calls for it.
- Keep calendar links out of emails 1-3. Earn the reply first.
- Avoid promotional language, pressure, fake urgency, and anything that sounds like an ad.
- Do not use misleading subject lines, fake thread prefixes, bait-and-switch claims, or urgency that is not true.
- Do not overload the email with variables. Too many personalized fields can look scraped.
- Keep punctuation calm. No all caps, repeated punctuation, decorative characters, or unusual symbols.
- Use `spam-word-checker.md` for formatting, CTA, opener, and voice discipline. It does not enforce a banned-word keyword list (2026-09-18); do not maintain one here either.

---

## Readability Rules

- Write at a plain spoken level. If a sentence sounds like a brochure, cut it.
- Use short sentences. One idea per sentence.
- Prefer concrete nouns and active verbs.
- Remove filler, hedging, throat-clearing, and self-focused setup.
- Keep the first screen of text easy to scan.
- Avoid dense paragraphs. Two to four short body blocks is usually enough. Framework A Email 1 may use one compact offer block plus an optional P.S. because it runs 25 to 35 words by default.
- Format the email as separate short blocks with a blank line between them. Never output the whole email as one dense paragraph. For Email 1 the blocks are the offer line, the ask (on its own line in the two-lines shape), and the optional P.S. (B1, B2); nothing sits above the offer. Later messages keep one idea per block. (operator-approved Aaron alignment, 2026-09-21: this bullet used to lay out opener, pain or insight, proof, then offer and CTA, the pain-first and proof-first order Aaron's winner anatomy reverses; archived at `outbound/_archive/aaron-alignment-2026-09-21/cold-email-copy-best-practices--readability-rules.md`.)
- Blank lines and line breaks are whitespace, not "formatting" in the banned sense. The plain-text rule bans HTML, bold, italics, color, and images. It does not mean cramming every sentence into one block. Use the whitespace.
- Each block is one idea: usually one or two short sentences, three at most. For Framework A Email 1, do not create a separate pain or proof setup block before the offer. The specific free deliverable, the scope disclosure (when the real process supports it), and the soft permission ask form the compact first-touch block.
- Name casing. Wherever a first name is followed by a comma and the sentence continues, the next word is lowercase unless it is a proper noun (company name, product, brand, acronym): the name and the words after it are one sentence, so a mid-sentence capital reads as broken. WRONG: `Katrin, Each month the mix of work shifts.` RIGHT: `Katrin, each month the mix of work shifts.` Proper-noun opener keeps its capital: `Katrin, Acme just migrated its ERP.` Email 1 carries no greeting word, but a first name may open it (B1), so this rule applies there too. In the pre-write column model the name is baked into each body as literal text, so the generator must case it correctly in the column.
- Do not use a colon to extend one sentence into a long list, proof stack, or multi-clause explanation. If the thought needs a list, split it into short sentences.
- Keep comma load low. If a paragraph needs several commas to hold together, it is probably doing too much.
- Do not use comma-wrapped company descriptors. Put the descriptor in its own sentence so the proof reads cleanly.
- Avoid long first paragraphs. If a reader has to hold more than one idea before the first period, rewrite.
- Read the email aloud. If it sounds stiff, formal, or inflated, rewrite it.

Good readability is not about sounding casual for its own sake. It is about making the email easy to process while the recipient is busy.

---

## Writing Quality Rules

- **Start with the OFFER (Hard Rule 19). RETROFITTED 2026-07-17.** Four bullets here used to mandate signal-first ordering: "start with the recipient's situation, not the sender's introduction", "the first line must be recipient-centered and must make the reason for outreach clear enough to feel earned", "the relevance signal must appear before the pitch", and "use a real signal, observation, or business context when available". That ordering is **RETIRED**, superseded by the offer-led opener in `/campaign-copywriting` (Offer-First Copy Standard, Hard Rule 19). The offer comes first, not the recipient's situation and not the signal. The twin bullets inside that skill were retired the same day.
- **Most of the intent survives.** Never open on the sender (a vague self-introduction, a homepage summary, "I'm the founder of..."), and never open on a broad industry claim any competitor could send. Both are still failures. The fix is no longer "put the signal first", it is "put the OFFER first": the specific free deliverable, with the dream outcome implied through it by default (doctrine §4; B1); the one outcome-naming exception is the labeled outcome-conditional arm, inside the boundary under "Build the offer on the value equation". (operator-approved Aaron alignment, 2026-09-21: this used to read "the dream outcome made specific, plus the risk reversal", and then "never promised", a blanket ban his own copy contradicts.) Leading with a clear, concrete offer is NOT the banned self-introduction.
- **Where the signal went.** Signals now drive TARGETING: which slice gets its own campaign, and which offer that slice gets (Aaron: the signal's primary job is list relevance, doctrine §8; B13). A slice-SHARED signal fact, true of every contact in the slice, rides in the P.S. by default (the opening-line swap, examples §1.1) or inside the offer sentence (Hard Rule 38), but no signal opens a cold email, and per-contact signal copy is retired (Hard Rule 34).
- Do not use generic AI personalization that merely repeats what the recipient already knows about their own company.
- Make the value claim specific enough to understand without a call.
- Proof is optional and capped: one near-twin, same-mechanism point at most, in the P.S. or deferred to email two, never in lines one or two (B6, doctrine §9). Generic proof is worse than none.
- Do not stack multiple offers in the same body. One email should have one main job.
- Avoid inflated adjectives. Specific facts beat hype.
- The email should sound like one person writing to one person.
- Grammar must be clean and the phrasing must sound natural. Read every sentence aloud. Fix awkward constructions, run-ons, comma splices, and garden-path sentences before the copy is shown.
- Do not drop words the sentence needs. Over-compression that removes a relative pronoun ("the spots energy retailers lose revenue in" should be "the spots where energy retailers lose revenue"), an article, or a connective word reads as broken English. Keep the small words that make a sentence parse on the first read.
- Never compress a sentence just to hit a lower word count. Clarity and natural flow win over brevity. If a clean sentence needs a few more words, use them, within the length targets.

---

## Subject Line Standards

- **Framework A subject shape (HARD RULE, 2026-08-12).** Email 1 uses 2 to 4 lowercase words with 0 to 2 variables (operator-approved Aaron alignment, 2026-09-21: was exactly 1 merge token; Aaron says one to two variables and shows zero-variable subjects). Do not expand the subject past 4 words to explain the offer. Subject lines are Aaron's lowest-leverage lever, so test them last (doctrine §9).
- Make the subject connected to the body so the open does not feel tricked.
- Prefer plain, low-drama wording: lowercase, casual, curiosity plus relevance (Aaron's endorsed subjects are in `outreach-copy-framework.md`, from examples §3). Never framed to look like an internal email or an existing thread: his honest substitute for a fake "FW:" is simply lowercase (examples §3). (This line used to say "internal-sounding" and credit it to the Aaron method, which misread him.)
- Avoid generic curiosity, fake urgency, promotional phrasing, and fake reply or forward prefixes. A generic, could-be-anyone subject (`your true-up`, `your billing`, `quick question`) FAILS the relevance test and must be rewritten to be specific (`what your true-up misses`, `billed less than you delivered`). The test: seeing ONLY this subject in their inbox, would THIS person find it specific enough to open? (The relevance test is a house safeguard, B15. Aaron also rejects "Can it be achieved?" for leaning too far into curiosity, examples §3.)
- Keep raw stats, percentages, and hype tokens OUT of the subject (they read promotional and trip spam filters); the number belongs in the body.
- Use lowercase for personalized subject lines unless a proper noun requires capitalization.
- Use a variable only when it improves relevance and does not create awkward output: the first name, or the slice's case-study name (set per slice and written into the shared body, never a per-contact column, B5). The company-name variable is not a default (B5; Aaron: "which I actually hate", examples §8).
- Check every subject line against `spam-word-checker.md` before showing it to the user.

Subject lines exist to earn a fair open. They should not sell the whole offer, overpromise, or make the email look automated.

---

## Opener Standards

- **Lead with the OFFER (Hard Rule 19). The principle-level signal-first opener rule is RETIRED (2026-07-17).** Two bullets here used to read: "lead with the signal, context, or reason for relevance", and "the first line must name the specific trigger or signal that put this prospect on the list before any insight, pain angle, or pitch (a generic industry trend is not a signal; it must be observable and specific to them or a tightly-defined segment)". They are quoted as retired reference and are no longer applied. This file carried the principle-level version of the Signal-First Opener Rule whose enforcement home was `/campaign-copywriting`; that rule was retired there the same day and superseded by the offer-led opener (Offer-First Copy Standard, Hard Rule 19). Both cannot hold, because one puts the signal in Line 1 and the other puts the offer there. The offer wins.
- **What survives.** Signals stay fully in play for TARGETING: which slice gets its own campaign, and which offer that slice gets. A slice-SHARED signal fact, true of every contact in the slice, rides in the P.S. by default (B1, the opening-line swap) or INSIDE the offer sentence (Hard Rule 38). What is retired is the signal as the OPENER, and per-contact signal copy (Hard Rule 34). No signal opens a cold email. The offer-led bullet below is the live rule; it was already correct, and it no longer contradicts its neighbours.
- **Do not narrate the observation (LIVE, unaffected by the retirement above).** "I noticed", "I saw that", "Congrats on", "I stumbled upon", and "I came across" are banned (see `spam-word-checker.md`). This ban never depended on where the signal sits: narrating that you looked someone up adds nothing wherever it lands, so it holds in every line of every email. State the signal, then what it means. **Pointer corrected 2026-07-17:** this used to route to `/campaign-copywriting` (Signal-First Execution Patterns), which is now retired reference. The live guidance is `/campaign-copywriting` (Signal-First Anti-Patterns): the six Wrong patterns, the implication test, and the fix, which is that a slice-shared signal fact rides inside the offer sentence or the P.S. (Hard Rule 38). Its old "Right" rewrites are archived at `outbound/_archive/aaron-alignment-2026-09-21/campaign-copywriting--signal-first-right-lines.md` because they stated unsupported generalizations as facts about a named company (doctrine §5 step 1); never lift one as copy. (operator-approved Aaron alignment, 2026-09-21)
- Every new-thread email (in the single-thread structure that is Email 1 only; Email 2 and Email 3 are same-thread follow-ups) opens with an OFFER-LED opener that leads with the offer itself: the specific free deliverable, with no greeting word and no preamble, though an optional first name may come first (B1; Aaron: *"no pain, no observation, no preamble"*, doctrine §9). Leading with a clear, concrete offer is NOT the banned "pitch"; the banned pitch is a vague self-introduction or a homepage summary. What still fails is a new-thread email that opens with a generic statement, a homepage summary, or a vague self-introduction. The only non-offer openings are the labeled B3 variants in `outreach-copy-framework.md` (for example the S08 soft neutral question for a less-aware buyer), run as test arms, never as defaults; question-form pain openers and the retired question-first and diagnostic-mirror openers stay out (B9). In-thread follow-ups (Email 2, and Email 3 in a 3-step) continue the thread and need neither. (operator-approved Aaron alignment, 2026-09-21: the retired-reference description of the question-first and diagnostic-mirror openers that sat in this bullet is archived at `outbound/_archive/aaron-alignment-2026-09-21/cold-email-copy-best-practices--opener-standards.md`; the older per-source generation logic is at `outbound/_archive/proven-mode-1to1-retired-2026-07-05/opener-framework-and-personalization-priority.md`.)
- Do not begin with greetings, personal pleasantries, or sender backstory (Aaron: *"you don't even use hey, hi, hello, greetings, or anything."*, doctrine §9).
- Do not start with a broad industry claim. (**Clause retired 2026-07-17:** this used to end "before explaining why the recipient was selected", which was signal-first ordering. The ban on the broad claim stands on its own; what replaces it is the offer, not an explanation of why they were selected.)
- Avoid forced compliments.
- Avoid scraped-sounding details that do not change the message.
- **The "could apply to anyone" test, RECALIBRATED 2026-07-17.** This bullet used to read "if the opener could apply to almost anyone on the list, it is too weak". That was true only while the opener carried a per-prospect signal. It no longer does: the opener is deliberately SHARED across the whole campaign or slice, filled with the first name and, where the offer uses one, the slice's case-study name written into the shared body (never the company-name variable by default, B5), so "it applies to many people on this list" is now **by design and is not the failure**. The failure is an OFFER so broad it is specific to no one. Make it specific to the SLICE, not to the individual. (Same recalibration as `/campaign-copywriting`, Offer-First Copy Standard.) Aaron's company-swap test cuts both ways (doctrine §8): swap-proof filler fails, and so does surveillance language.

The opener earns the right to continue. If it feels generic, the rest of the email has to work too hard.

**Signal, not observation (the implication test). LIVE, scope corrected 2026-07-17.** This used to open "before writing Line 1, apply this test", which assumed the opener carried the signal. Line 1 is now offer-led and carries no signal (Hard Rule 19), so apply this test to ANY line that states a signal fact, wherever it sits in the body. The test itself is unchanged and every ban in it holds: if you are describing what you saw, noticed, or came across, you are writing an observation, not a signal line. Rewrite it by starting from the implication of the data point, not the data point itself. The prospect does not care that you found the information; they care what it means for their situation. The same leak shows up six ways: a plain observation ("I saw [Company] is hiring SDRs"), complimenting the signal instead of using it ("Congrats on the Series B"), naming the fact without the "so what", leading with generic industry pain before the signal, burying the signal behind a pitch, or using the signal as flattery into a pitch. The full six-mode guidance lives in `/campaign-copywriting` (Signal-First Anti-Patterns); use it for the test, never for example lines (its old "Right" rewrites are archived, operator-approved Aaron alignment, 2026-09-21). The demoted-relevance P.S. (examples §1.1) passes this test: its "so what" is the offer it follows.

The opener is ALWAYS shared across the slice, so that one line always carries the whole campaign's blast radius. (Corrected 2026-07-17: this used to say "when no signal exists", from when a signal could make the opener per-prospect. It cannot anymore, so the shared case is now the only case, and the per-account trigger opener that this sentence also sent for review is retired under Hard Rule 34.) Before locking copy, give it (plus the offer body, proof, and CTA) one forced skeptical read, the platitude test: is the offer specific and true enough to feel earned (and, in a labeled pain-first variant, is the pain), or is it vendor wallpaper any competitor could send? This is platitude detection and a discipline gate against a rushed rubber-stamp, not a reply-rate predictor; treat a pass as a hypothesis until reply data proves it. Enforcement and the exact prompts live in `/campaign-copywriting` (Shared-Asset Platitude Read).

---

## Human Voice, Not Fake Warmth

Warmth in an internal-team email comes from a relationship that already exists. A cold prospect has none, so a casual preamble bolted onto a cold email is fake familiarity — the costume without the body, and it reads worse than being direct. Personality in cold email never lives in a warmup; it lives inside the first relevant line. Voice, not warmth.

- **Banned in any cold email or cold follow-up:** "hope you're well" / "hope this finds you well" / "hope you're having a great week"; "just checking in" / "just following up" / "following up on my last email" / "circling back" / "touching base" / "bumping this"; "I wanted to reach out" / "I wanted to connect"; unearned flattery to a stranger ("big fan of what you're building," "saw you're crushing it"); any phrase implying shared history; and any warmup sentence before the first relevant line. Most recipients never registered email 1, so "following up on my last" reads as "what email?", and these are the most pattern-matched phrases in the inbox. Aaron's own named bans sit alongside these (doctrine §9, examples §7.1): *"I hope this email finds you well"*, *"I know you're busy, but…"*, "just nudging", "did you see my last email?", and introducing yourself. The enforcement list is `spam-word-checker.md` (Aaron's Named Bans).
- **Said-out-loud test (every cold email and follow-up):** read the first two lines aloud. Would a busy, competent person who knows this world say this to a peer? If it sounds like a brochure or a textbook explaining the industry, it fails. Aaron's version of the target: text-from-a-friend but competent, casual first person, plain words, and never a template shape (B8, doctrine §9). In Email 1 the voice lives in how the offer itself is said; there is no framing token or warm-up before it (B1). (operator-approved Aaron alignment, 2026-09-21: this used to accept "an honest frame about being a stranger" such as "quick one"; archived at `outbound/_archive/aaron-alignment-2026-09-21/cold-email-copy-best-practices--human-voice.md`.)
- **Voice goes into the relevant line, never a preamble before it.** Same facts, with a person behind them: a flat "providers experience revenue leakage during reconciliation" becomes "most of them are quietly billing less than they deliver every month and never notice." (That example voices a pain line, so it belongs in a follow-up's "add to it" mode or in the labeled two-line pain variant, B3, never above the Email 1 offer.)
- **Voice levers, for follow-ups and replies:** a point of view and spoken rhythm (contractions, varied sentence length, no connective fluff). The old first lever, a 2-4 word human-framing token after the first name, is retired for Email 1: it is a preamble before the offer, against B1 (no preamble). (operator-approved Aaron alignment, 2026-09-21)
- **Reconciles with the Opener Standards above (CORRECTED 2026-07-17; realigned 2026-09-21).** The OFFER leads the first line, always, signal or no signal. The voice lives in HOW the offer is voiced, never in a warm-up before it and never in a signal bolted in front of it. No framing token delays the offer (B1). Where a slice-SHARED signal fact earns a place, it rides in the P.S. by default (B1, the opening-line swap) or inside the offer sentence (Hard Rule 38), never ahead of it. (operator-approved Aaron alignment, 2026-09-21: the earlier text of this bullet, including its framing-token allowance, is archived with the levers.)
- **Discipline:** the prohibition and the said-out-loud test are the hard rules. Any voice change is a hypothesis: A/B it against the clean version (same offer, same CTA), one variable at a time, and judge it on positive replies with time-agreed replies per 1,000 first touches beside them, because Aaron judges on meetings, not replies (doctrine §0, §2). A winner must not lose on meetings. (operator-approved Aaron alignment, 2026-09-21)

(Examples by vertical and follow-up rewrites live in `/campaign-copywriting` Human Voice, Not Fake Warmth.)

---

## Conversational One-to-One Register (RETIRED 2026-07-05)

Archived 2026-09-21 (operator-approved Aaron alignment): this retired register's reference text (the diagnostic-mirror opener as a first-class opener, research-heavy one-to-one bodies) contradicts the offer-first contract (B1) and the shared-body rule (B13), so it now lives at `outbound/_archive/aaron-alignment-2026-09-21/cold-email-copy-best-practices--one-to-one-register.md`. Every initial cold email uses the contract in `outreach-copy-framework.md`.

## Length Follows Personalization Density (RETIRED 2026-07-05)

Archived 2026-09-21 (operator-approved Aaron alignment): its 120-to-200-word band for personalized emails contradicts Aaron's measured winner length (B1) and his point that the length sins are explaining the service, narrating the timeline, and describing internal process (doctrine §9). The text lives at `outbound/_archive/aaron-alignment-2026-09-21/cold-email-copy-best-practices--length-density.md`. Email 1 length is B1 and B14 in `outreach-copy-framework.md`; the only longer version is a logged A/B arm for a solution-aware or saturated market (ledger R07).

## Write 1-to-1: minimize "we" and "us"

The email should sound like one human writing to one human, so default to first-person singular ("I"). Reserve "we" and "us" for statements that are genuinely collective and cannot honestly be said as "I": a real team result ("I placed three of these last quarter" if you did it, "we placed three" if the team did), or a company capability that is truly the company's, not the individual's. Everything else is "I": "I'd build your outbound around...", "I put together...", "I'll send it across." Framing the client's value around the prospect ("you're one of the few agencies specialising in...") beats "we help agencies like you." Do not over-apply this into stilted copy: an honest "we" for a genuine team fact is fine. In the offer-first contract the offer conditional and the scope disclosure naturally use "we" when a team does the work, exactly as Aaron's own model lines do ("if we could ideate, script, edit, and record", examples §1.1); minimize-we was a proven-mode one-to-one refinement, not an offer-first rule (B8: casual first person). (operator-approved Aaron alignment, 2026-09-21: a clause here that called quoting the prospect's own "We help..." line the diagnostic mirror is removed with that retired register.)

---

## Offer And Proof Standards

- State the offer in concrete business terms.
- Tie the deliverable to one clear outcome or avoided cost, implied through the artifact rather than promised by default (doctrine §4); the one outcome-naming exception is the labeled outcome-conditional arm, inside the boundary under "Build the offer on the value equation" (operator-approved Aaron alignment, 2026-09-21).
- Proof, when used, is one near-twin point in the P.S. or email two, never in lines one or two (B6).
- Use proof that a similar buyer would believe: same space, similar size, same mechanism, a plain named number (B6, examples §6).
- Introduce proof with plain declarative sentences. Do not use dash parentheticals around the customer descriptor.
- Avoid vague credibility markers, inflated claims, and unsupported numbers.
- If a result cannot be verified or defended, do not use it.
- **Capability truth: only claim what the client can actually deliver.** Never assert a product feature, integration, tool, metric, or result the client does not really have. This is distinct from proof. Proof is evidence for a claim that is true; capability truth is about not making a false claim in the first place. When copy is generated at scale, give the generator the client's real capability list and hold it inside that list. Invented capabilities produce replies the client's sales team cannot fulfill, which is worse than a weaker but honest email.
- If the offer needs a long explanation, simplify the offer before polishing the copy.
- Before writing, confirm the offer passes the three-question Offer Architecture gate: SQL vs MQL framing, the easy-to-say-yes-to test, and a named risk reversal. The full gate lives in `/campaign-copywriting`. A structurally perfect email on a weak or high-friction offer still underperforms. Aaron's own gates sit beside it: the "why not?" test and the farming-interest check (doctrine §4).

### Build the offer on the value equation, and capture the Four Concretes

Construct and score every offer on the value equation: (dream outcome × perceived likelihood of achievement) ÷ (time delay × effort / sacrifice). Apply it Aaron's way (doctrine §4; operator-approved Aaron alignment, 2026-09-21): imply the dream outcome through the artifact by default; raise perceived likelihood by shrinking what is being judged (the deliverable, whose delivery odds should be effectively 100%) and by weaving a near-twin case into the offer, not by stacking proof; collapse time with a date-certain free deliverable whose day count is a real capacity term; and strip the prospect down to one act. Deliverable-first stays the default (his measured winner). A conditional that names the outcome and pairs it with a zero-risk term ("if we could [result]... at no cost", a free trial, zero upfront payment) is also his own shape (doctrine §4; his Jun 29 and Sep 14 scripts) and runs as a labeled arm (operator-approved Aaron alignment, 2026-09-21): no proof claim on line one, no guarantee on the core service, and an outcome that is not a stretch (that last limit is the corpus's reading, not his words). Still banned: an outcome stated with no risk term, and the retired bundle of an outcome plus a named comparable and its number on line one (proof goes to the PS, one point). The offer passes when the honest reaction is "why wouldn't I say yes?", and it must also pass the farming-interest check: specific enough to filter out those who won't buy and compelling enough to pull in those who will (doctrine §4). (This used to read "a tangible, ideally quantified dream outcome, made believable with real proof", the literal reading Aaron departs from, and later "never promise it", a blanket ban his own Jun 29 and Sep 14 copy contradicts.)

**The Four Concretes (no vague offer ships; house, offer-record inputs).** The locked offer record must answer the first question before any copy is written; the other three are captured whenever they exist and never hold an offer-led test (operator directive 2026-09-22). They are inputs to the offer, not a packing list for Email 1: Email 1 carries the deliverable and, at most, one P.S. job (B1, B6), and the rest lives in the P.S., follow-ups, or reply path. (operator-approved Aaron alignment, 2026-09-21)

1. **What exactly are you offering?** The free deliverable in one line, not a service description or an abstraction (Aaron: your offer is not your service, doctrine §3).
2. **Why would I work with you?** A real differentiator.
3. **What exact result or number could I get?** A quantified outcome (a %, a currency figure, or time saved).
4. **What did your last client get?** A named, recognizable proof plus its number.

These are captured UPSTREAM (`/offer-intelligence`, `/social-proof-bank`, `client-profile.yaml`, the intake), because the copy step can only check for them, not invent them. Handle a missing concrete exactly like the Proof-Asset Gate's two tiers. **Hollow without it** (the outcome number the whole offer hinges on): hold that angle, fire the proof-asset request to the client, and ship an honest interim that names the proof and describes the outcome without a fabricated number. **Would only strengthen it:** flag the gap, ship the concrete-as-possible version now, and upgrade when the fact lands. Never invent a number or a named result to fill the gap; that is the fabrication the capability-truth and proof-asset rules forbid.

**Quantified value belongs in the locked offer record (UPDATED 2026-08-12; realigned 2026-09-21).** Keep a real outcome number or cost-of-inaction figure upstream so the offer can be judged honestly. In Email 1, the house rule "a number in the offer" is satisfied by the deliverable's own quantity, turnaround, or effort numbers (the 100 in a 100-company list, a 24-hour turnaround). Any benchmark or cost-of-inaction figure goes to the P.S. as its single proof or relevance point, or to a follow-up or the reply path. Never fabricate a figure or overload the first touch. (operator-approved Aaron alignment, 2026-09-21)

**The number rides with the deliverable, plain and direct (HARD RULE, 2026-07-12; realigned 2026-09-21, operator-approved Aaron alignment).** (a) **No storytelling preamble:** the offer sentence leads with the specific free deliverable (or, in the labeled outcome-conditional arm, the outcome paired with its zero-risk term, inside the boundary under "Build the offer on the value equation"), and the number in it is the deliverable's own quantity, turnaround, or effort figure (B15). A benchmark or cost-of-inaction figure never sits in front of the offer and never becomes an outcome promise inside it (B1; the arm carries no proof claim on line one either); it goes to the P.S. as its single proof or relevance point (B6). (operator-approved Aaron alignment, 2026-09-21: the arm clauses are new.) (b) **No source citations in the body** ("(MGI Research)", "(Gartner)"): they add length and read like a report; keep provenance in our records only. (c) **Plain, direct vocabulary, no buzzwords or jargon-metaphors:** banned as buzzy are `leak`/`leakage`, `unlock`, `leverage`, `streamline`, `optimize`, `supercharge`, `seamless`, `synergy`, `empower`, `robust`, `game-changer`, `frictionless`, `turnkey`, `cutting-edge`, `revolutionize`, and `best-in-class`. Say the plain thing ("where you're losing revenue most", "lose to manual billing"). A real industry term the buyer uses (`true-up`) is fine; an internal campaign NAME may keep "Leakage Teardown"; prospect-facing copy stays plain. The old WRONG/RIGHT example pair is archived at `outbound/_archive/aaron-alignment-2026-09-21/cold-email-copy-best-practices--number-in-the-offer.md`: its RIGHT line put an outcome promise and a named comparable in line one and used the company-name variable, against B1, B5, and B6.

**Write for the real list, be specific, answer the 13 questions (HARD RULE, 2026-07-12).** (a) **Ground it first:** before writing, state the concrete audience (job titles + company type/industry + size + geography) and pull 2-3 real contacts from `leads.verified.csv` (name, title, company, domain, e.g. "Mark Grafton, CFO, Node4"); write TO that person, never generic copy in a vacuum. (b) **Name what is lost or gained, simply:** name the noun then stop ("where you're losing the most" → "where you're losing the most revenue"); not vague, but not over-listed filler either. (c) **Answer Hormozi's 13 questions** across the sequence and DOCUMENT the coverage in `copy.md` (map each question to the line that answers it); common misses are #6 workflow ("plugs in, no big project"), #11 spam-out (an easy, guilt-free out in casual risk-elimination form, such as Aaron's "If it's not a fit, no hard feelings." `[AS]`, examples §5, shape not sentence; never a line that names the non-reply or frames the sequence as a chase, doctrine §11), #12 blameless ("the process drifts on its own"). (operator-approved Aaron alignment, 2026-09-21: the #11 model "I won't chase you" is retired, as in `/campaign-copywriting`.) Full rule: `/campaign-copywriting` (13 Questions Gate + "Write FOR the real list").

**Don't label the reader with their own segment / acronym (HARD RULE, 2026-07-12).** They already know what they are; "MSPs lose 4-9%" / "for SaaS companies like you" / "as a fintech..." reads templated and smuggles jargon. Speak to their situation and to "you" directly (not the company-name variable, B5), and attribute a benchmark to its cause not their category: not "the 4-9% MSPs lose" but "the 4-9% lost to manual billing." Segment = how we target the list, never a label said back in copy.

(A second, near-duplicate copy of the rule above sat here. Its example also cited a source in the body and labeled the reader by segment, which this file bans; it is archived with the first copy at `outbound/_archive/aaron-alignment-2026-09-21/cold-email-copy-best-practices--number-in-the-offer.md`, and its extra buzzwords are merged into the list above.)
- **Select the most relevant proof point per segment.** Do not default to the most prominent case study if it is a poor fit for the specific ICP or industry. If no case study fits the segment well, omit proof rather than stretch an irrelevant reference. An irrelevant case study signals the sender did not do their research. Hierarchy: direct match (same industry) → close match (adjacent challenge, careful framing) → no match (omit proof and let the offer carry the email; B6 never claims an exact-industry match for a loosely similar case). **Name proof only when the reader will recognize it.** When a real, relevant customer would not be recognized by this prospect, describe the outcome generically rather than naming an unfamiliar company: naming an unrecognizable case study tends to underperform because the reader thinks "that isn't me" (Eric's data). Recognizable proof, named; unrecognizable proof, described. Still bound by the Proof-Asset Gate (the named proof must be real and on file).

### Proof-Asset Gate: get the real proof, do not fake it

The fastest way copy goes hollow is covering a missing fact. The copy wants to name a client and there isn't one approved, so it writes "a leading firm". It wants a number and there isn't one on file, so it rounds up a guess or writes "significant results". Both are dead on arrival, and an invented number is worse: it can be wrong.

The rule: do not write copy whose credibility needs hard proof you do not have. Hard proof is a named client you may name, a real case study with a before/after the client stands behind, or an exact number tied to a real outcome. If the angle needs one of those and it is not on file (`client-profile.yaml`, `offer-intelligence.md`, an approved artifact, or the intake), be blunt about the gap and collect the real thing from the client. Do not paper over it with a vague phrase, an unnamed stand-in, an invented metric, or a silent omission.

Decide the tier on one question: is the angle hollow without this proof, or just less strong?

- Hollow without it: the angle's whole credibility hinges on the missing proof. Hold that angle, send the client the fill-in form (`proof-asset-request.md`), and either switch to an angle your on-file evidence already supports or ship the slice's offer-led version without the proof line while the proof is collected. Never hold a whole slice's offer test on the client's proof (operator directive 2026-09-22).
- Would only strengthen: the copy already stands on a real signal. Flag the gap, send the form, ship the viable version now, and upgrade when the proof returns.

This sits next to capability truth (never claim a product capability the client cannot deliver) as a separate rule: capability truth is about not overstating what the client does, the proof-asset gate is about not faking the evidence that it works. Doctrine: memory.

Weak offer clarity is not a copy problem. It is a strategy problem showing up in the writing.

---

## CTA Standards

**Canonical CTA doctrine: the CTA Hierarchy.** Offer-first, lead magnet optional, rotate across steps. The booked call is always the goal; every CTA is a low-friction way to earn the first "yes" (honest friction-laddering, the offer always real). Prefer the direct offer-led soft CTA (`Would that be worth sharing more?`) over inventing a lead magnet; use a real magnet when one exists, best as a follow-up mechanism. No two steps in a sequence share a CTA sentence; a follow-up may restate the same offer at lower friction, but never repeats Email 1 (see the rotation rule below). The single source of truth is `/campaign-copywriting` → Offer-First Copy Standard → The CTA Hierarchy; the bullets below are its checklist.

**Every step sells only the next step (the open-loop chain).** The subject earns the open. The first line earns the CTA. The CTA earns the yes. The asset opens the gap. The gap makes the call obvious. No link tries to do a later link's job — an E1 that tries to sell the call is skipping three steps, which is why pitch-first copy fails.

**The delivery message after a yes: deliver first, and keep the ask present but one layer down (HARD RULE, 2026-07-17; realigned 2026-09-21 to Aaron's reply-stage rule, operator-approved).** Aaron's position (ledger R03, the only outright reversal in his ledger; doctrine §11; examples §7.3): deliver the promised asset first, never behind an unexpected booking gate; put no calendar link in the delivery reply (he refuses to "force-feed" the calendar); and keep the next ask present but refusable, as in "calendar's on the next page if you think there's interest." The house structure implements that, conditional on `offer.lead_magnet_gap` in `client-profile.yaml`. **Gap present:** delivery (day 0) is pure value with no call ask (`Great {{first_name}}, here's the link. Curious to get your take on it.`), because attaching a sales ask to the free thing announces it had a price. **A follow-up is then REQUIRED:** day 2-3 carries the ask, aimed at the unresolved motive (`the one thing it can't work out on its own is [the gap]. Should I run the real one for you?`); day 7 gives a guilt-free out. "No ask on the delivery email" is not "no ask ever, by anyone": a pure-value delivery with no follow-up strips the only ask and replaces it with hope. **No gap:** deliver the asset plus one soft, refusable pointer to the next step, with no calendar link. `direct_offer` is the exception, and Email 1 still closes with his permission CTA (ledger R17 retired the meeting ask), so a yes is permission to share more, not agreement to a call. The reply shares it in one or two sentences plus the information or asset, keeps the call one layer down and refusable, and proposes times only when the prospect asks to talk (explicit booking intent). **In every branch,** never propose times in a delivery reply, whether or not the asset leaves an open question; the next step sits one layer down and refusable ("calendar's on the next page if you think there's interest", examples §7.3; ledger R03); times are proposed only on explicit booking intent. No offer to walk them through it on a call either: that is a call ask disguised as help, and his rule is "you don't want to add any sort of sales friction until they've actually consumed the value" (S06, transcript 2026-07-13). A call is a disclosed requirement only when the offer genuinely needs one and says so (doctrine §11). (operator-approved Aaron alignment, 2026-09-21: the no-gap and `direct_offer` branch used to "keep the soft time-proposal at delivery".) Full rule + reasoning: `/campaign-copywriting` → CTA Hierarchy → The Delivery Message.

- Use one CTA per email, and put one in every email, follow-ups included (the only exception is a labeled no-CTA Email 1 test arm, B3). Email 1 carries the primary value-backed CTA; the follow-ups (Email 2, and Email 3 in a 3-step) carry a soft, low-friction CTA (a light re-offer or a forward-looking question). Never end an email with a dead-end soft close that trails off and gives the reader nothing to answer.
- Every CTA has a setup sentence plus one easy way to say yes. The setup sentence names the specific deliverable or next step and why it is worth the prospect's time. The ask itself follows the pattern for its slot (below).
- **HARD RULE — make "yes" the easy answer, and keep the prospect on top.** The invariant never changes: the prospect is always the one on top, under zero obligation, never made to feel they *want*, *need*, are *missing out on*, or are *obligated to reply for* what we have. The sender does the work and makes saying yes take one word. A needy or presumptuous ask touches their ego and reads as a catch; an easy, deferential ask reads as genuine. It must never sound scripted, sketchy, or like there is a hook.
  - **Email 1 (the new thread): one soft permission ask.** Name the specific free deliverable, carry the scope disclosure when the real process supports it, then close with the message's one primary ask: by default `Would that be worth sharing more?` (Aaron's own, examples §4), or a variant such as `Would that be worth hearing more?`, `Open to it?`, or `Can I send it over?`. The statement-only `Just reply "Yes"...` opt-in is reserved for later steps, and a no-CTA Email 1 runs only as a labeled test arm (B3). (operator-approved Aaron alignment, 2026-09-21)
  - **Follow-ups (Email 2, and Email 3 in a 3-step): a forward-looking question.** A short question they can answer (a light re-offer framed as a question, or a routing question). Not the opt-in, never a dead end.
  - **`May I send it over to you?` / `Can I send it across?` / `Would it help if I sent it?` are acceptable alternatives.** German: `Darf ich es Ihnen schicken?` (not `Möchten Sie…?` / `Wollen Sie…?`). The selected Email 1 CTA is the message's one primary ask.
  - **Framework A close:** `Would that be worth sharing more?` (Aaron's own most-used ask, examples §4, ledger R17) is the default after the specific free deliverable. His variants and the house variant `Would that be worth hearing more?` stay accepted. None is the banned `Worth a look?` / `Interested?`. (operator-approved Aaron alignment, 2026-09-21: the two used to be interchangeable co-defaults.)
  - **Never use** framing that puts the prospect in the wanting / needing / obligated seat: `Want me to send it?`, `Want us to send it?`, `Want the link?`, `Did you want…?`, `Interested?`, `Let me know if you'd like…`, `You'll want this`, `Don't miss…`, `Worth a look?`, or anything that implies they are asking us, chasing us, or short of something. Expand the spirit, not just these tokens: if a line could make a confident owner feel pitched-at, talked-down-to, or like the favour runs toward us, rewrite it so the deference runs toward them.
- Make the next step useful, not just low effort.
- Make both yes and no easy to answer.
- Reference only deliverables someone will actually honor after a positive reply: the agency by default, the client only with `lead_magnet_client_ok: yes` (`/campaign-copywriting` Confirmed Deliverable Gate).
- Do not promise audits, scorecards, benchmarks or ROI estimates until the data, method and delivery path are known (the agency confirms this itself; no client approval is needed for an offer the agency honors), and never promise an asset that will not exist by the time the first yes needs it. And never name the offer an "audit": Aaron calls it a dead word (doctrine §3); a bounded, evidence-based diagnostic survives under a better name (ledger R09).
- Avoid CTAs that only ask whether the problem exists. That is weak because the prospect gets no value for answering.
- **Rotate the CTA across the steps of the sequence (checkable): no two steps share a CTA sentence, and no follow-up repeats Email 1.** Email 1 = the offer ask. Each follow-up takes one of Aaron's two modes (ledger R12, doctrine §11): add to it (pre-handle a concern, add a benefit layer, add a risk reversal, or give the reason it is free), or strip it back (the bare offer at lower friction). If Email 1 was already stripped back, add. A lower-friction restatement of the same offer, such as his two-minute Loom offer (examples §7.1), PASSES; repeating Email 1 FAILS. Read the CTA sentences side by side; if any two match, rewrite. The same CTA on every step reads as a repetitive loop and gets ignored. (operator-approved Aaron alignment, 2026-09-21: this used to fail any two steps that offered the same mechanism, which is stricter than Aaron's strip-back mode.)
- Avoid hard meeting asks in early cold email unless the strategy deliberately accepts the tradeoff and the next step is clearly useful.
- Avoid vague CTAs that require the recipient to invent the next step.
- Avoid pressure, urgency, and false scarcity.

The CTA should reduce decision load. If the recipient needs to think hard before answering, it is too heavy.

---

## Signature Standards

- **Email 1 signature: first name plus company name, each on its own line. No job title and no location** (Aaron: *"Just put your name, put your company name. You don't even really need your job title. Just super simple."*, and on location: *"you don't want to bring your location or politics or anything into it."*, doctrine §9; B10). (operator-approved Aaron alignment, 2026-09-21: replaces the three-line full name, title @ company, location block; the old rules are archived at `outbound/_archive/aaron-alignment-2026-09-21/cold-email-copy-best-practices--signature-standards.md`.) "First name" rather than a full name, and one line each, are the house reading of his "Just put your name", not his words (attribution corrected 2026-09-21).
- **Legal requirements override style** (doctrine §11): where a client's counsel or the recipient's jurisdiction requires a sender postal address or other identification, add exactly what is required and record it in `copy.md` as a compliance requirement, not a style choice.
- **Phone line (house choice, not part of Aaron's signature):** added only when `sender_persona.phone` is set in `client-profile.yaml` (key unchanged), the same rule as `/campaign-copywriting` Hard Rule 23. When it is used, it is one fixed number per persona, never spun, A/B-tested, or put in per-contact data. (operator-approved Aaron alignment, 2026-09-21: this used to add it only when the client or counsel required it as sender identification, which disagreed with Hard Rule 23.)
- In-thread follow-ups (Email 2, and Email 3 in a 3-step) sign with the first name only. A sign-off is still mandatory (house rule): **every email in the sequence, follow-ups included, ends with at least a name.** A follow-up with no sign-off reads as an unsigned fragment.
- Each signature line goes on its own line. The block stays plain text; line breaks are not "formatting" in the deliverability sense, so this does not violate the plain-text rule.
- No salesy sign-off above the signature ("Thanks for the time" is on Aaron's kill-list, doctrine §9).
- Do not spin, AI-vary, or A/B-test the signature. Pull the first name from the sender persona and the company name from the client profile.
- Place the signature in the sending tool, never in per-contact lead or CSV data. In the `variants.yaml` template path it is part of the campaign step body. In the pre-written copy path the body variable carries no sign-off, and the static signature block is appended below the variable in the sending-tool step. See `/campaign-copywriting` Pre-Written Email Copy Architecture.

---

## Follow-Up Standards

- Each follow-up must stand on its own. Treat it as possibly the first one read (doctrine §11): it does one job (useful context, one meaningful point, a lower-commitment version of the offer, or a real objection).
- Do not open by narrating that you are following up. Never name the non-reply, never assume the reader scrolls up, never "just following up", "just nudging", or "did you see my last email?" (examples §7.1), and never a bump such as "bumping this". No guilt trips and no fake urgency.
- Do not repeat the same argument if the previous email failed.
- Use one of Aaron's two modes (ledger R12): add to it (pre-handle a concern, add a benefit layer, add a risk reversal, or give the reason it is free), or strip it back (the bare offer at lower friction). If Email 1 was already stripped back, add.
- Friction ladder: a higher-friction ask first and a lower-friction one second, such as the two-minute Loom offer (examples §7.1); the reverse is allowed as a test (doctrine §11).
- Same spec as Email 1: short, standalone, conversational, one clear CTA (doctrine §11), under the house 50-word follow-up cap (`/campaign-copywriting` Hard Rule 27). (operator-approved Aaron alignment, 2026-09-21: this used to say "keep follow-ups shorter than the first email", which an add-to-it follow-up after a one-line Email 1 cannot meet.)
- Do not promise to stop based on silence. Follow `spam-word-checker.md` for closeout and unsubscribe logic.
- Two emails by default, three at most (Hard Rule 18). Aaron on a five-email sequence: *"Absolutely do not do this in 2026 at all."* (examples §7.1). Each follow-up must earn its place: his own study puts most losing steps in follow-ups (doctrine §9). More touches can train recipients to ignore the sender.

Follow-ups should feel like useful second attempts, not reminders that the first message was ignored.

---

## Personalization Standards

**Per-contact COPY personalization is RETIRED (2026-07-05), and the Hard Rule 34 fork is resolved for the shared body (B13; operator-approved Aaron alignment, 2026-09-21).** Offer-first copy is shared: one body per campaign or offer-angle slice, varying only the first name. A variable that changes what is delivered, such as the case-study name, is set per slice and written into the slice's shared body, never a per-contact column (B5). The company-name variable is not a default. Signals still drive TARGETING (who to email, campaign slicing, which offer a segment gets), never per-contact copy: the signal's primary job is list relevance (doctrine §8). The standards below apply to targeting and enrichment data, not to writing per-contact copy.

- Use personalization only when it changes the relevance of the email.
- Prefer real business signals over generic company descriptions.
- Keep AI-generated variables short, factual, and non-obvious.
- Limit AI-generated fields to one or two sentences.
- Review the first 20 generated values manually before scaling. If more than 3 of 20 are vague, generic, awkward, or factually off, refine the prompt before running the full list.
- Remove AI personalization when it reads like a summary of the recipient's homepage.
- Never let variables create awkward grammar, broken casing, or scraped-looking copy.
- Do not quote, bold, italicize, or overemphasize variables.
- Always verify that variable names match the upload schema.

Bad personalization is worse than no personalization because it proves the sender used automation carelessly.

---

## Sequence Standards

- The first email carries the clearest offer. Relevance comes from the list and, at most, a P.S. line (B1, B13).
- Later emails should not merely repeat the first email.
- Rotate the angle only when the new angle is meaningfully different.
- Keep sequence length conservative unless prior campaign data justifies more touches.
- New-thread emails must have their own subject and must stand alone.
- **Single thread, 2 to 3 steps (HARD RULE, TAM-size dependent).** Every campaign is ONE thread: Email 1 (new thread, offer-led) plus one or two same-thread follow-ups. Default 2 steps; 3 only for a small TAM. No second new thread, no Email 4. (The 4-email / two-independent-thread structure is retired 2026-07-05.)
- Email 1 is the new-thread offer-led test. Test the offer first, then its positioning, then the CTA and delivery; subject lines are Aaron's lowest-leverage lever and go last (doctrine §5, §9).
- Each follow-up (Email 2, and Email 3 in a 3-step) is a same-thread reply that MOVES the conversation by one of Aaron's two modes: add to it, or strip it back to the bare offer at lower friction (ledger R12). A lower-friction restatement of the same offer (a 2-minute video, a written teardown) passes; re-sending Email 1's pitch fails. It always ends with a soft CTA (a light re-offer or a forward-looking question), never a dead end. Each step's CTA sentence differs from the others' (see CTA Standards, the CTA Hierarchy). (operator-approved Aaron alignment, 2026-09-21: "no repeated mechanism" is replaced by this two-mode rule.)
- Do not write goodbye emails, fake wrap-ups, or last-touch framing.
- Copy must follow the saved campaign plan, selected campaign strategy, lead-source plan, and locked offer or lead magnet.
- Re-engagement should be treated as a fresh attempt, not a stale reminder.

The sequence should test meaningful differences, not minor rewrites of the same weak idea.

---

## Spintax And Variation Standards

- Use spintax to create meaningful variation, not random synonym swaps.
- Keep the best-performing idea intact. Do not spin the message until the point gets weaker.
- Avoid too many variations in one email. Heavy variation creates uneven quality.
- Every spintax branch must pass `spam-word-checker.md`.
- Every branch must preserve grammar, variable formatting, and the same strategic intent.
- Spintax must never leave artifacts (braces, pipes, doubled words) in the rendered body; Aaron cuts spintax artifacts (doctrine §9, B9).

Spintax should reduce pattern repetition without making the writing sound unstable.

---

## Cutting Process (Aaron's editing order)

Edit in this order and do not reorder it (doctrine §9, B11). (operator-approved Aaron alignment, 2026-09-21: the three passes that used to be this whole section are now step 5.)

1. Fix the offer.
2. Remove unsupported facts.
3. Make the output and the effort clear.
4. Choose one next action.
5. Remove filler: delete filler, compress long sentences, and replace vague adjectives with concrete facts where possible.
6. Only then apply word count, channel rules, and style.

Then run the per-line QA loop (what job does each line do, and which fact supports it?) and the pre-send test: would I answer this? Stop editing when the email is clear, specific, and natural. Do not compress so hard that the message becomes cryptic.

---

## Scoring Rubric

Use this rubric after the spam-word scan passes.

| Dimension | Weight | What To Check |
|---|---:|---|
| Relevance | 25 | The offer fits the slice (list relevance, B13) and would not read the same for any company (the company-swap test, doctrine §8). |
| Value clarity | 25 | In one read the recipient can tell what's in it for them, how long it takes, and what they have to do (doctrine §4). |
| Proof quality | 15 | No proof, or one near-twin, same-mechanism point in the P.S. or email two; never in lines one or two; never generic (B6). |
| CTA friction | 15 | The reply path is simple and low pressure. |
| Readability | 10 | The copy is short, plain, and easy to scan. |
| Deliverability | 10 | Formatting and wording avoid inbox risk. |

Scoring:

- 85 or higher: ready to show
- 70 to 84: revise once more
- below 70: rethink the angle or offer

---

## Master QA Checklist

Use this before any copy is shown to the user, saved to YAML, or prepared for upload.

### Guardrails

- [ ] `outreach-copy-framework.md` passed for the initial cold touch.
- [ ] `spam-word-checker.md` passed.
- [ ] This best-practices guide passed.
- [ ] Checked against Aaron's rejection bank (`aaron-examples.md` §8) and his named kill-list (B9; `spam-word-checker.md`, Aaron's Named Bans).
- [ ] No banned formatting, CTA, opener, or voice patterns (`spam-word-checker.md`), no fake urgency, and no unsafe unsubscribe logic.
- [ ] No em dashes of any kind, en dashes used as dashes, double hyphens, or mid-sentence dash separators in sendable copy.
- [ ] No colon-as-runway sentences.
- [ ] No comma-wrapped company descriptors.
- [ ] Markdown copy and YAML copy match exactly.

### Deliverability

- [ ] Plain text only.
- [ ] No all caps, repeated punctuation, or decorative formatting.
- [ ] No links in emails 1-3 unless the user explicitly approved an override.
- [ ] No calendar links in emails 1-3.
- [ ] Subject line does not mislead, overpromise, or mimic a fake thread.
- [ ] Email 1 subject is 2 to 4 lowercase words with 0 to 2 variables, curiosity plus relevance, and no deceptive framing (no `FW:` or fake thread).

### Writing

- [ ] Line 1 is OFFER-LED and carries no signal (`/campaign-copywriting` Hard Rule 19). The signal-first opener is retired 2026-07-17, and the three rows that enforced it here went with it: "first line is recipient-centered", "relevance signal appears before the pitch", and "first line names a specific, observable signal and uses one of the four Signal-First Execution Patterns".
- [ ] Any slice-shared signal fact in the BODY is true of every contact in the slice, rides in the P.S. by default or inside the offer sentence, is never framed as this reader's own, and never opens the email (Hard Rule 38). No per-contact signal copy (Hard Rule 34).
- [ ] Any line that states a signal fact passes the implication test: it says what the fact MEANS for the reader, not a description of what the sender saw, a compliment on the signal, the bare fact with no "so what", generic pain before the signal, the signal buried behind a pitch, or flattery into a pitch (guidance: `/campaign-copywriting` Signal-First Anti-Patterns, live; never lift one of its example lines as copy).
- [ ] Email 1 (the only new-thread email) opens with an OFFER-LED opener (the specific free deliverable, no greeting, no preamble), never a vague self-introduction. The only exceptions are labeled B3 variants run as test arms. (Question-first / diagnostic-mirror openers retired with proven-mode.)
- [ ] No observational opener phrases ("I noticed", "I saw that", "Congrats on", "I stumbled upon", "I came across", "I wanted to reach out").
- [ ] Zero fake-familiarity phrases ("I hope this email finds you well," "I know you're busy," "just nudging," "did you see my last email?," "hope you're well," "just checking in," "following up on my last," "circling back," "touching base," "bumping this," "I wanted to reach out/connect," unearned flattery), and no warmup sentence before the first relevant line.
- [ ] First two lines pass the said-out-loud test (sounds like a competent peer, not a textbook or a template, B8). Follow-ups work as the first email read and never reference the earlier one.
- [ ] Offer is clear in one pass.
- [ ] Proof: none, or one near-twin point in the P.S. or email two, never in lines one or two (B6).
- [ ] Proof is written in plain sentences, not dash parentheticals.
- [ ] Email 1 ends with its one primary ask, a soft permission CTA after the specific free deliverable (default `Would that be worth sharing more?`). The statement-only `Just reply "Yes"...` opt-in is reserved for later steps. No `Want me to…`, `Want us to send…`, `Interested?`, `Worth a look?`, or meeting ask.
- [ ] CTA references only a deliverable or next step with a named honorer for every yes (the agency, or the client with `lead_magnet_client_ok: yes`).
- [ ] Casual first person, one person to one person (B8); "we" is natural in the offer conditional and the scope disclosure when a team does the work.
- [ ] Every claim about the client's own product maps to a real, deliverable capability. No invented features, integrations, or results the client cannot fulfill (most important when copy is AI-generated at scale).
- [ ] New-thread CTAs do not repeat the same vague deliverable by default.
- [ ] Email 1 closes with the signature (first name, then company name; no title and no location) plus exactly what any legal requirement adds (B10); the follow-ups (Email 2, Email 3) close with at least the first name. No email is left unsigned. Any phone line is added only when `sender_persona.phone` is set, one fixed number per persona, sourced from `client-profile.yaml` (operator-approved Aaron alignment, 2026-09-21).
- [ ] Copy reads naturally aloud.
- [ ] Email is formatted as short blocks separated by blank lines, not one dense paragraph.
- [ ] Framework A Email 1 uses its compact offer block with no pain, observation, proof, or setup paragraph before the offer. Later messages keep one idea per block.
- [ ] No greeting word in Email 1 (a first name is optional and may open the email or sit later in the sentence); wherever a first name is followed by a comma, the next word is lowercase unless it is a proper noun (no `Name, Each ...` mid-sentence capital).
- [ ] When the offer is free, the copy says "free" or "no cost".
- [ ] No company-name variable by default (B5), and no "audit" as the name of the offer.
- [ ] Grammar is clean with no awkward over-compression, dropped connective words, run-ons, or comma splices.

### Personalization

- [ ] Variables are correctly formatted.
- [ ] Personalization is useful, not obvious filler.
- [ ] AI-generated content is short, factual, and non-awkward.
- [ ] First 20 AI-generated values were reviewed before scaling when AI personalization is used.
- [ ] No scraped field creates strange casing or grammar.

### Sequence

- [ ] Follow-ups stand alone.
- [ ] Later emails do not merely repeat earlier emails.
- [ ] Follow-ups do not open by referencing prior outreach.
- [ ] No closeout wording except a legally required notice, and none promises silence-based stopping (`spam-word-checker.md`, Unsubscribe / Closeout Line Rules; operator-approved Aaron alignment, 2026-09-21).
- [ ] The sequence is ONE thread, 2 to 3 steps (Email 1 + one or two same-thread follow-ups); 2 default, 3 for a small TAM (Hard Rule 18). No second new thread, no Email 4.
- [ ] Email 1 uses a new subject and an offer-led opener (question-first / diagnostic-mirror openers retired with proven-mode); the follow-ups are same-thread replies.
- [ ] The A/B test rides Email 1: the offer first, subject lines last (doctrine §5, §9).
- [ ] Each follow-up moves the conversation by adding to it or stripping it back to the bare offer at lower friction (ledger R12), and never re-sends Email 1's pitch.
- [ ] CTA rotation: the sequence's CTA sentences read side by side are all different; no two steps share a CTA sentence, and no follow-up repeats Email 1; a lower-friction restatement of the same offer passes (the CTA Hierarchy).
- [ ] Lead magnet honesty: no filler magnet made just to have one, and no magnet promised that will not exist by the time the first yes needs it (a real asset built for the offer is fine); the direct offer-led CTA (`Would that be worth sharing more?`) carries the sequence when no real asset exists, and a real magnet is used only when it genuinely exists.
- [ ] Next-Step Gate (WARN, not a blocker at copy time): any real magnet should have a named unresolved motive and next step (`offer.lead_magnet_gap` / `lead_magnet_next_step`). Missing = warn and carry on with existing CTA behavior; the requirement is enforced upstream at magnet selection, and legacy clients backfill at their next refresh.
- [ ] Delivery message matches the gap (Hard Rule 36): gap present, the asset with zero call ask and the ask carried by the day 2-3 follow-up; no gap, the asset plus one soft, refusable pointer to the next step one layer down, never an offer to walk them through it on a call; `direct_offer`, the offer shared in one or two sentences plus the information or asset, with the call one layer down and refusable. No delivery reply proposes times, whether or not the asset leaves an open question: times go out only on explicit booking intent, so a delivery reply with no proposed time PASSES. Never stripped without a real motive. No calendar link in the delivery reply and no unexpected booking gate (ledger R03). (operator-approved Aaron alignment, 2026-09-21: this row used to require the "soft time-proposal retained" when no gap exists.)
- [ ] Gap-present sequence defines its follow-up: day 2-3 ask at the unresolved motive + day 7 guilt-free close, with sender/trigger/day named, plus the kill number. Pure-value delivery with no follow-up FAILS.
- [ ] Asset-announcement E1 earns its slot: used only when the asset carries a real inherent-value anchor AND the dream outcome is implied through the asset, never stated as a promise (doctrine §4). Otherwise the conditional structure leads (the one outcome-naming shape in Email 1 is the labeled outcome-conditional arm, inside the boundary under "Build the offer on the value equation"). (operator-approved Aaron alignment, 2026-09-21: this used to require that "the dream outcome sits in the announcement sentence".)
- [ ] Inherent-value anchor is true and correctly slotted: it prices the ASSET and never fills the Concrete #3 outcome-number slot. No inflated scale, spend, price, or industry coverage.
- [ ] Email 2 (and Email 3 in a 3-step) support Email 1 in the same thread; each ends with a soft CTA, not a dead-end soft close.
- [ ] Every email ends with a CTA or clear next step, support emails included, with no email left hanging (the only exception is a labeled no-CTA Email 1 test arm, B3).
- [ ] No goodbye email or fake wrap-up appears in the sequence.
- [ ] The copy follows the saved campaign plan and locked offer or lead magnet.
- [ ] Every variant and spintax branch passed the same QA.
- [ ] Offer passed the Offer Architecture gate before Email 1 was written (SQL/MQL framing, easy-to-say-yes test, named risk reversal), plus Aaron's "why not?" test and farming-interest check (doctrine §4).
- [ ] Email 1 passes the contract in `outreach-copy-framework.md`: 25 to 35 body words by default (P.S. excluded from the count; it stays short and does one job), 2 to 3 main-body sentences (one for the one-liner), one primary ask, the specific free deliverable first (or, in the labeled outcome-conditional arm, the outcome paired with its zero-risk term), and the scope disclosure whenever the real process supports it. Any optional P.S. is short, declarative, and does one of the four B1 jobs: the demoted relevance line, one near-twin proof point, a casual risk-elimination or reason-it's-free line, or the deliverable's turnaround and the prospect's one small act. A body a little under 25 words passes whenever it still carries the whole offer (B4). Follow-ups stay under 50 words. (operator-approved Aaron alignment, 2026-09-21)
- [ ] In the pre-written copy path, every row's Email 1 column carries the slice's shared body, varying only the first name (B13); any case-study name is the slice's own, written into that shared body, never a per-contact column (B5) (no separate fallback column, no blank rows).
- [ ] Signature is in the sending-tool step, not baked into any per-contact email body or CSV column.

---

## Common Failure Modes

1. The copy sounds like a promotion instead of a personal note.
2. The first line proves scraping, not relevance.
3. The offer is too vague to answer.
4. The CTA asks for too much too soon.
5. The proof is impressive but unrelated to the recipient.
6. The sequence repeats the same weak angle.
7. AI personalization adds words without adding relevance.
8. The YAML version drifts from the reviewed markdown version.
9. A safe-looking line still trips a formatting, CTA, opener, or voice ban from `spam-word-checker.md`.
10. The email is polished but not believable.
11. The value is buried behind a pain opener or an observation (Aaron's verdict on his own test loser: *"the value is still here, it's just buried."*, examples §1.5).
12. The offer is a service description, not a deliverable (doctrine §3, examples §9).

---

## What To Do Next

If writing campaign copy, return to `campaign-copywriting.md` and apply its stepwise workflow.

If copy exists, run `spam-word-checker.md` first, then use this guide for the second-pass quality review.

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short — record status, not raw output. Full protocol: `client-activity-log.md`.
