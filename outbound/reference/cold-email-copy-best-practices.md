# Cold Email Copy Best Practices

Purpose: define cold email writing standards that protect deliverability, inbox placement, readability, and reply quality.

This file is a principles-only guide. It must not contain reusable email copy, writing samples, sequence scripts, or industry-specific examples. For formatting, CTA, opener, and voice bans, `spam-word-checker.md` is the source of truth (it no longer enforces a banned-word keyword list; see that file for why).

Compiled from internal campaign-copywriting guidance and cold outbound operators including Aaron Shepherd (GrowthFlare; see `/ask-aaron` for the full sourced doctrine), Nick Abraham, Daniel Fazio, Michel Lieben, Patrick Spychalski, Eric Nowoslawski, Instantly.ai, and Nick Saraev.

---

## Required Use

Apply this guide whenever cold outreach copy is written, reviewed, revised, serialized, or prepared for upload.

Every subject line, opener, body line, CTA, follow-up, P.S. line, variable value, and YAML body must pass:

1. `outreach-copy-framework.md` for the initial cold touch
2. `spam-word-checker.md`
3. This best-practices guide

`outreach-copy-framework.md` controls the first-touch structure. `spam-word-checker.md` controls banned terms and deliverability risk. This guide controls the remaining writing quality.

---

## Core Standard

### Framework A controls the initial cold touch (HARD RULE, 2026-08-12)

The first written cold message in any channel opens with a specific free deliverable, stays at 25 to 35 body words, uses 2 to 3 main-body sentences and exactly 1 question, keeps the sender/prospect workload split in parentheses, and ends the main body with the soft permission question. An optional declarative P.S. is outside the main-body sentence count but inside the word cap. Cold email adds a 2-to-4-word lowercase subject with exactly 1 merge token.

Most of this structure is Aaron Shepherd's own measured finding from his 1.5M-email study, not a house invention; what this workspace adds is making it a hard cap with no exception. The full sourced breakdown of which piece is his and which is this workspace's hardening lives in `outreach-copy-framework.md` and `/ask-aaron` (`aaron-doctrine.md` §13). (An earlier version of this section and `outreach-copy-framework.md` cited a fabricated-looking URL for this rule; that citation is corrected in `outreach-copy-framework.md`, and the substance of the rule below is unchanged.)

This overrides older guidance that allowed 50-to-90-word or 70-to-90-word first messages, setup before the offer, a statement-only initial CTA, or omission of the workload parenthetical. Full rule and QA: `outreach-copy-framework.md`.

Cold email works when the recipient can quickly understand:

- why they are receiving the note
- what specific situation makes it relevant
- what the sender can credibly do
- what simple reply is being asked for

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
- Avoid dense paragraphs. Two to four short body blocks is usually enough. Framework A Email 1 may use one compact offer block plus an optional P.S. because it is capped at 25 to 35 words.
- Format the email as separate short blocks with a blank line between them. Never output the whole email as one dense paragraph. A blank line after the opener, after the pain or insight, after the proof, and before the offer and CTA makes the email scannable in a busy inbox and on a phone (combine the proof with the offer and CTA into one closing block only when each would be a single short sentence).
- Blank lines and line breaks are whitespace, not "formatting" in the banned sense. The plain-text rule bans HTML, bold, italics, color, and images. It does not mean cramming every sentence into one block. Use the whitespace.
- Each block is one idea — usually one or two short sentences, three at most. For Framework A Email 1, do not create a separate pain or proof setup block before the offer. The specific free deliverable, parenthetical workload split, and soft permission question form the compact first-touch block.
- Greeting casing. When the body continues right after the `{first_name},` greeting, the first word is lowercase unless it is a proper noun (company name, product, brand, acronym). The greeting and opener are one sentence, so a mid-sentence capital reads as broken. WRONG: `Katrin, Each month the mix of work shifts.` RIGHT: `Katrin, each month the mix of work shifts.` Proper-noun opener keeps its capital: `Katrin, Acme just migrated its ERP.` In the pre-write column model the greeting is baked into each body, so the generator must case the opener correctly in the column.
- Do not use a colon to extend one sentence into a long list, proof stack, or multi-clause explanation. If the thought needs a list, split it into short sentences.
- Keep comma load low. If a paragraph needs several commas to hold together, it is probably doing too much.
- Do not use comma-wrapped company descriptors. Put the descriptor in its own sentence so the proof reads cleanly.
- Avoid long first paragraphs. If a reader has to hold more than one idea before the first period, rewrite.
- Read the email aloud. If it sounds stiff, formal, or inflated, rewrite it.

Good readability is not about sounding casual for its own sake. It is about making the email easy to process while the recipient is busy.

---

## Writing Quality Rules

- **Start with the OFFER (Hard Rule 19). RETROFITTED 2026-07-17.** Four bullets here used to mandate signal-first ordering: "start with the recipient's situation, not the sender's introduction", "the first line must be recipient-centered and must make the reason for outreach clear enough to feel earned", "the relevance signal must appear before the pitch", and "use a real signal, observation, or business context when available". That ordering is **RETIRED**, superseded by the offer-led opener in `/campaign-copywriting` (Offer-First Copy Standard, Hard Rule 19). The offer comes first, not the recipient's situation and not the signal. The twin bullets inside that skill were retired the same day.
- **Most of the intent survives.** Never open on the sender (a vague self-introduction, a homepage summary, "I'm the founder of..."), and never open on a broad industry claim any competitor could send. Both are still failures. The fix is no longer "put the signal first", it is "put the OFFER first": the dream outcome made specific, plus the risk reversal. Leading with a clear, concrete offer is NOT the banned self-introduction.
- **Where the signal went.** Signals now drive TARGETING: which slice gets its own campaign, and which offer that slice gets. A slice-SHARED signal fact may ride inside the offer sentence (Hard Rule 38) when it is true of every contact in the slice, but no signal opens a cold email, and per-contact signal copy is retired (Hard Rule 34).
- Do not use generic AI personalization that merely repeats what the recipient already knows about their own company.
- Make the value claim specific enough to understand without a call.
- Back claims with proof, but keep proof short and relevant to the recipient.
- Do not stack multiple offers in the same body. One email should have one main job.
- Avoid inflated adjectives. Specific facts beat hype.
- The email should sound like one person writing to one person.
- Grammar must be clean and the phrasing must sound natural. Read every sentence aloud. Fix awkward constructions, run-ons, comma splices, and garden-path sentences before the copy is shown.
- Do not drop words the sentence needs. Over-compression that removes a relative pronoun ("the spots energy retailers lose revenue in" should be "the spots where energy retailers lose revenue"), an article, or a connective word reads as broken English. Keep the small words that make a sentence parse on the first read.
- Never compress a sentence just to hit a lower word count. Clarity and natural flow win over brevity. If a clean sentence needs a few more words, use them, within the length targets.

---

## Subject Line Standards

- **Framework A subject shape (HARD RULE, 2026-08-12).** Email 1 uses 2 to 4 lowercase words and exactly 1 merge token, normally `{{first_name}}`. Do not expand the subject past 4 words to explain the offer.
- Make the subject connected to the body so the open does not feel tricked.
- Prefer plain, low-drama wording; lowercase, internal-sounding, never looks like a cold email (Aaron method).
- Avoid generic curiosity, fake urgency, promotional phrasing, and fake reply or forward prefixes. A generic, could-be-anyone subject (`your true-up`, `your billing`, `quick question`) FAILS the relevance test and must be rewritten to be specific (`what your true-up misses`, `billed less than you delivered`). The test: seeing ONLY this subject in their inbox, would THIS person find it specific enough to open?
- Keep raw stats, percentages, and hype tokens OUT of the subject (they read promotional and trip spam filters); the number belongs in the body.
- Use lowercase for personalized subject lines unless a proper noun requires capitalization.
- Use recipient or company variables only when they improve relevance and do not create awkward output.
- Check every subject line against `spam-word-checker.md` before showing it to the user.

Subject lines exist to earn a fair open. They should not sell the whole offer, overpromise, or make the email look automated.

---

## Opener Standards

- **Lead with the OFFER (Hard Rule 19). The principle-level signal-first opener rule is RETIRED (2026-07-17).** Two bullets here used to read: "lead with the signal, context, or reason for relevance", and "the first line must name the specific trigger or signal that put this prospect on the list before any insight, pain angle, or pitch (a generic industry trend is not a signal; it must be observable and specific to them or a tightly-defined segment)". They are quoted as retired reference and are no longer applied. This file carried the principle-level version of the Signal-First Opener Rule whose enforcement home was `/campaign-copywriting`; that rule was retired there the same day and superseded by the offer-led opener (Offer-First Copy Standard, Hard Rule 19). Both cannot hold, because one puts the signal in Line 1 and the other puts the offer there. The offer wins.
- **What survives.** Signals stay fully in play for TARGETING: which slice gets its own campaign, and which offer that slice gets. A slice-SHARED signal fact may also ride INSIDE the offer sentence (Hard Rule 38) when it is true of every contact in the slice. What is retired is the signal as the OPENER, and per-contact signal copy (Hard Rule 34). No signal opens a cold email. The offer-led bullet below is the live rule; it was already correct, and it no longer contradicts its neighbours.
- **Do not narrate the observation (LIVE, unaffected by the retirement above).** "I noticed", "I saw that", "Congrats on", "I stumbled upon", and "I came across" are banned (see `spam-word-checker.md`). This ban never depended on where the signal sits: narrating that you looked someone up adds nothing wherever it lands, so it holds in every line of every email. State the signal, then what it means. **Pointer corrected 2026-07-17:** this used to route to `/campaign-copywriting` (Signal-First Execution Patterns), which is now retired reference. The live bank, with the exact wrong/right rewrites, is `/campaign-copywriting` (Signal-First Anti-Patterns).
- Every new-thread email (Email 1 and Email 3, or the single new-thread email in a shorter sequence) opens with an OFFER-LED opener that leads with the offer itself, never a generic statement, a homepage summary, or a vague self-introduction. (Question-first and diagnostic-mirror openers are RETIRED with proven-mode, 2026-07-05; the description that follows is retired reference.) A question-first opener is a short, human, personalized question (under 15 words) tied to the email's core pain angle, then the signal and context. A diagnostic-mirror opener reflects the prospect's own situation, or their buyers' real pain, back to them, then shows why that makes them a fit (the conversational register; see `conversational-copy-examples.md`). Both are signal-first and both lead with the implication, not a warmup. **In offer-validation / Eric-mode copy (`offer_market_proven = false`) the sanctioned opener is instead OFFER-LED: Email 1 leads with the offer itself (the dream outcome made specific, plus the risk reversal), per the Aaron method and the Offer-First Copy Standard in `/campaign-copywriting`. Leading with a clear, concrete offer is NOT the banned "pitch" here; the banned pitch is a vague self-introduction or a homepage summary.** What still fails is a new-thread email that opens with a generic statement, a homepage summary, or a vague self-introduction. In-thread follow-ups (Email 2, Email 4) continue the thread and need neither. The per-source generation logic and the relevance test live in `/campaign-copywriting` (Question-First Opener Framework).
- Do not begin with greetings, personal pleasantries, or sender backstory.
- Do not start with a broad industry claim. (**Clause retired 2026-07-17:** this used to end "before explaining why the recipient was selected", which was signal-first ordering. The ban on the broad claim stands on its own; what replaces it is the offer, not an explanation of why they were selected.)
- Avoid forced compliments.
- Avoid scraped-sounding details that do not change the message.
- **The "could apply to anyone" test, RECALIBRATED 2026-07-17.** This bullet used to read "if the opener could apply to almost anyone on the list, it is too weak". That was true only while the opener carried a per-prospect signal. It no longer does: the opener is deliberately SHARED across the whole campaign or slice, filled with first name and company only, so "it applies to many people on this list" is now **by design and is not the failure**. The failure is an OFFER so broad it is specific to no one. Make it specific to the SLICE, not to the individual. (Same recalibration as `/campaign-copywriting`, Offer-First Copy Standard.)

The opener earns the right to continue. If it feels generic, the rest of the email has to work too hard.

**Signal, not observation (the implication test). LIVE, scope corrected 2026-07-17.** This used to open "before writing Line 1, apply this test", which assumed the opener carried the signal. Line 1 is now offer-led and carries no signal (Hard Rule 19), so apply this test to ANY line that states a signal fact, wherever it sits in the body. The test itself is unchanged and every ban in it holds: if you are describing what you saw, noticed, or came across, you are writing an observation, not a signal line. Rewrite it by starting from the implication of the data point, not the data point itself. The prospect does not care that you found the information; they care what it means for their situation. The same leak shows up six ways: a plain observation ("I saw [Company] is hiring SDRs"), complimenting the signal instead of using it ("Congrats on the Series B"), naming the fact without the "so what", leading with generic industry pain before the signal, burying the signal behind a pitch, or using the signal as flattery into a pitch. The full six-mode bank with the exact wrong/right rewrites lives in `/campaign-copywriting` (Signal-First Anti-Patterns).

The opener is ALWAYS shared across the slice, so that one line always carries the whole campaign's blast radius. (Corrected 2026-07-17: this used to say "when no signal exists", from when a signal could make the opener per-prospect. It cannot anymore, so the shared case is now the only case, and the per-account trigger opener that this sentence also sent for review is retired under Hard Rule 34.) Before locking copy, give it (plus the offer body, proof, and CTA) one forced skeptical read — the platitude test: is the pain specific and true enough to feel earned, or is it vendor wallpaper any competitor could send? This is platitude detection and a discipline gate against a rushed rubber-stamp, not a reply-rate predictor; treat a pass as a hypothesis until reply data proves it. Enforcement and the exact prompts live in `/campaign-copywriting` (Shared-Asset Platitude Read).

---

## Human Voice, Not Fake Warmth

Warmth in an internal-team email comes from a relationship that already exists. A cold prospect has none, so a casual preamble bolted onto a cold email is fake familiarity — the costume without the body, and it reads worse than being direct. Personality in cold email never lives in a warmup; it lives inside the first relevant line. Voice, not warmth.

- **Banned in any cold email or cold follow-up:** "hope you're well" / "hope this finds you well" / "hope you're having a great week"; "just checking in" / "just following up" / "following up on my last email" / "circling back" / "touching base" / "bumping this"; "I wanted to reach out" / "I wanted to connect"; unearned flattery to a stranger ("big fan of what you're building," "saw you're crushing it"); any phrase implying shared history; and any warmup sentence before the first relevant line. Most recipients never registered email 1, so "following up on my last" reads as "what email?", and these are the most pattern-matched phrases in the inbox.
- **Said-out-loud test (every cold email and follow-up):** read the first two lines aloud. Would a busy, competent person who knows this world say this to a peer? If it sounds like a brochure or a textbook explaining the industry, it fails. A line passes only if it has a point of view (not just a fact), spoken rhythm (contractions, a short punchy clause), or an honest frame about being a stranger ("quick one," "this'll sound random").
- **Voice goes into the relevant line, never a preamble before it.** Same facts, with a person behind them: a flat "providers experience revenue leakage during reconciliation" becomes "most of them are quietly billing less than they deliver every month and never notice."
- **Three levers, all optional and testable:** (1) a 2-4 word human-framing token right after the first name (at most one, never faking a relationship); (2) inject a point of view (an observation, not a bare fact); (3) spoken rhythm (contractions, varied sentence length, no connective fluff).
- **Reconciles with the Opener Standards above (CORRECTED 2026-07-17).** This bullet used to say that when a real signal exists, the *signal still leads the first line*, and that the voice lives in HOW you reference it. That contradicts Hard Rule 19 and is **RETIRED** with the signal-first opener, exactly as its twin in `/campaign-copywriting` (Human Voice, Not Fake Warmth) was retired the same day. **The rule now:** the OFFER leads the first line, always, signal or no signal. The voice lives in HOW the offer is voiced, never in a warmup before it and never in a signal bolted in front of it. A framing token stays 2 to 4 words and delays the offer by no more than that ("Marie, quick one." then straight into the offer). Where a slice-SHARED signal fact earns a place, it rides inside the offer sentence (Hard Rule 38), not ahead of it.
- **Discipline:** the prohibition and the said-out-loud test are the hard rules; a specific token is a hypothesis. Do not assume "quick one" wins — A/B the human-voice version against the clean version (same offer, same CTA) and let positive reply rate decide.

(Examples by vertical and follow-up rewrites live in `/campaign-copywriting` Human Voice, Not Fake Warmth.)

---

## Conversational One-to-One Register (RETIRED 2026-07-05)

**This register and the proven-mode it belonged to are retired. Offer-first is the only copy mode (see the Offer-First Copy Standard in `/campaign-copywriting`). Everything below is retired reference.**

This retired register is kept only as historical context. It no longer controls Email 1 at any offer stage. Every initial cold email now uses the 25 to 35 word Framework A rule in `outreach-copy-framework.md`; personalization cannot create a longer exception. Worked historical examples live in `conversational-copy-examples.md`.

- **Write as "I" to "you".** First-person singular, one note from one person, not a company broadcast. See "Write 1-to-1" below.
- **The diagnostic mirror opener is a first-class opener, alongside the short question.** Instead of only a sub-15-word question, you may open by reflecting the prospect's own situation back to them: their likely current positioning or messaging, or the specific pain their buyers actually feel, then show why that is exactly what makes them a fit for what follows. Done from real research, this proves you understand their world better than a generic vendor and earns the read. It is still signal-first and still leads with the implication, never a warmup or a homepage summary.
- **The personalization is the research, and it must be specific and true.** Their real positioning, their public numbers, what is live on their account, what their case studies focus on. Never a restatement of what they already know about themselves.
- **Name the pain the prospect's buyers actually feel, in their language.** Speaking the buyer's real problem is what makes the sender sound like an insider rather than a vendor.
- **Substance over template.** A conversational email that is just a longer template is worse, not better. Every line must be genuine, specific, and about the prospect.

## Length Follows Personalization Density (RETIRED 2026-07-05)

**Retired with proven-mode. Framework A now fixes Email 1 at 25 to 35 words; follow-ups keep their separate cap. Everything below is retired reference and must not be used to generate live copy.**

The old rigid 50-to-90-word cap existed to kill filler, and that intent stands: never pad, never add a line any competitor could send. But length is not a law, and it does not have to match a sending tool's "keep it short" recommendation. Length follows personalization density.

- **Low-signal, templated, or segment-level sends stay tight** (roughly 50 to 90 words). When the relevance is shared across the whole slice and the email is mostly a shared skeleton, short wins, because there is nothing prospect-specific to justify more.
- **Genuinely personalized, diagnostic, one-to-one emails may run longer** when every added line is real, specific, prospect-about substance: a diagnosis of their situation, their buyers' real pain, why they specifically are positioned differently. An email that earns the read by proving you understand their exact situation can run to roughly 120 to 200 words. The reference example that set this standard is about 180 words and every line is about the prospect.
- **The gate is substance, not word count.** Before keeping a line, ask: is this genuinely about THIS prospect, or is it filler or vendor wallpaper? If filler, cut it whatever the length. If genuine, keep it even past 90 words. Long is NOT the new default: a low-signal send that runs long is just a padded template and fails QA. Personalization density earns length; nothing else does.

## Write 1-to-1: minimize "we" and "us"

The email should sound like one human writing to one human, so default to first-person singular ("I"). Reserve "we" and "us" for statements that are genuinely collective and cannot honestly be said as "I": a real team result ("I placed three of these last quarter" if you did it, "we placed three" if the team did), or a company capability that is truly the company's, not the individual's. Everything else is "I": "I'd build your outbound around...", "I put together...", "I'll send it across." Framing the client's value around the prospect ("you're one of the few agencies specialising in...") beats "we help agencies like you." Do not over-apply this into stilted copy: an honest "we" for a genuine team fact is fine, and quoting the prospect's own likely "We help..." line back to them is the diagnostic mirror, not a violation. In offer-led / Eric-mode copy the natural offer opener ("if we could get your buyers ordering from your site...") uses "we", and that is fine; minimize-we is a proven-mode 1-to-1 refinement, not an offer-first rule.

---

## Offer And Proof Standards

- State the offer in concrete business terms.
- Tie the offer to one clear outcome or avoided cost.
- Keep proof close to the claim it supports.
- Use proof that a similar buyer would believe.
- Introduce proof with plain declarative sentences. Do not use dash parentheticals around the customer descriptor.
- Avoid vague credibility markers, inflated claims, and unsupported numbers.
- If a result cannot be verified or defended, do not use it.
- **Capability truth: only claim what the client can actually deliver.** Never assert a product feature, integration, tool, metric, or result the client does not really have. This is distinct from proof. Proof is evidence for a claim that is true; capability truth is about not making a false claim in the first place. When copy is generated at scale, give the generator the client's real capability list and hold it inside that list. Invented capabilities produce replies the client's sales team cannot fulfill, which is worse than a weaker but honest email.
- If the offer needs a long explanation, simplify the offer before polishing the copy.
- Before writing, confirm the offer passes the three-question Offer Architecture gate: SQL vs MQL framing, the easy-to-say-yes-to test, and a named risk reversal. The full gate lives in `/campaign-copywriting`. A structurally perfect email on a weak or high-friction offer still underperforms.

### Build the offer on the value equation, and capture the Four Concretes

Construct and score every offer on the value equation: (dream outcome × perceived likelihood of achievement) ÷ (time delay × effort / sacrifice). Maximize the top (a tangible, ideally quantified dream outcome, made believable with real proof), minimize the bottom (fast, near-zero effort for the prospect). The offer passes when the honest reaction is "why wouldn't I say yes?"

**The Four Concretes (no vague offer ships).** A buyer reading offer copy silently asks four questions. If the copy cannot answer them, it reads as vague and gets ignored:

1. **What exactly are you offering?** A crisp one-line service, not an abstraction.
2. **Why would I work with you?** A real differentiator.
3. **What exact result or number could I get?** A quantified outcome (a %, a currency figure, or time saved).
4. **What did your last client get?** A named, recognizable proof plus its number.

These are captured UPSTREAM (`/offer-intelligence`, `/social-proof-bank`, `client-profile.yaml`, the intake), because the copy step can only check for them, not invent them. Handle a missing concrete exactly like the Proof-Asset Gate's two tiers. **Hollow without it** (the outcome number the whole offer hinges on): hold that angle, fire the proof-asset request to the client, and ship an honest interim that names the proof and describes the outcome without a fabricated number. **Would only strengthen it:** flag the gap, ship the concrete-as-possible version now, and upgrade when the fact lands. Never invent a number or a named result to fill the gap; that is the fabrication the capability-truth and proof-asset rules forbid.

**Quantified value belongs in the locked offer record (UPDATED 2026-08-12).** Keep a real outcome number or cost-of-inaction figure upstream so the offer can be judged honestly. Put it in Framework A Email 1 only when it fits naturally inside the specific deliverable without breaking the 25-to-35-word cap. Otherwise use it in the optional P.S., follow-up, or reply path. Never fabricate a figure or overload the first touch.

**The number goes IN the offer, plain and direct (HARD RULE, 2026-07-12).** (a) **Value-first placement:** wire the number INTO the offer sentence, never a story-telling preamble. WRONG: "Usage-based billing loses 4-9% of revenue, and for MSPs the true-up is where it hides. If we could..." RIGHT: "if we could save {{company_name}} the 4-9% MSPs lose to manual billing, just like we did for Atea, all you'd have to do is [effort]." (b) **No source citations in the body** ("(MGI Research)", "(Gartner)") — they add length and read like a report; keep provenance in our records only. (c) **Plain, direct vocabulary (Hormozi tone), no buzzwords/jargon-metaphors:** banned as buzzy — `leak`/`leakage`, `unlock`, `leverage`, `streamline`, `optimize`, `supercharge`, `seamless`, `synergy`, `empower`, `robust`, `game-changer`, `frictionless`, `turnkey`. Say the plain thing ("where you're losing revenue most", "lose to manual billing"). A real industry term the buyer uses (`true-up`) is fine; an internal campaign NAME may keep "Leakage Teardown"; prospect-facing copy stays plain.

**Write for the real list, be specific, answer the 13 questions (HARD RULE, 2026-07-12).** (a) **Ground it first:** before writing, state the concrete audience (job titles + company type/industry + size + geography) and pull 2-3 real contacts from `leads.verified.csv` (name, title, company, domain, e.g. "Mark Grafton, CFO, Node4"); write TO that person, never generic copy in a vacuum. (b) **Name what is lost or gained, simply** — name the noun then stop ("where you're losing the most" → "where you're losing the most revenue"); not vague, but not over-listed filler either. (c) **Answer Hormozi's 13 questions** across the sequence and DOCUMENT the coverage in `copy.md` (map each question to the line that answers it); common misses are #6 workflow ("plugs in, no big project"), #11 spam-out ("I won't chase you"), #12 blameless ("the process drifts on its own"). Full rule: `/campaign-copywriting` (13 Questions Gate + "Write FOR the real list").

**Don't label the reader with their own segment / acronym (HARD RULE, 2026-07-12).** They already know what they are; "MSPs lose 4-9%" / "for SaaS companies like you" / "as a fintech..." reads templated and smuggles jargon. Speak to their situation and to "you" / {{company_name}} directly, and attribute a benchmark to its cause not their category: not "the 4-9% MSPs lose" but "the 4-9% lost to manual billing." Segment = how we target the list, never a label said back in copy.

**Number goes IN the offer, plain and direct (HARD RULE, 2026-07-12).** (1) **Wire the number INTO the offer sentence, never a story-telling preamble.** WRONG (marketing storytelling): `Usage-based billing leaks 4-9% of revenue (MGI Research), and for MSPs the true-up is where it hides. If we could...`. RIGHT (value-first): `if we could save {{company_name}} the 4-9% MSPs lose to manual billing (MGI Research), just like we did for [client], all you'd have to do is [effort].` Lead with the value, wired straight into the offer. (2) **Plain, direct vocabulary; no buzzwords, jargon-metaphors, or filler (Hormozi / Aaron tone).** Banned buzz-vocabulary in copy (use the plain version): `leak`/`leakage` (→ "where you're losing revenue"), `unlock`, `leverage`, `streamline`, `optimize`, `supercharge`, `seamless`, `synergy`, `empower`, `robust`, `cutting-edge`, `revolutionize`, `game-changer`, `best-in-class`, `frictionless`, `turnkey`. A real industry TERM the buyer uses (e.g. `true-up`) is fine; a buzz-metaphor is not. An internal offer/campaign NAME may keep such a term; the prospect-facing copy must be plain.
- **Select the most relevant proof point per segment.** Do not default to the most prominent case study if it is a poor fit for the specific ICP or industry. If no case study fits the segment well, omit proof rather than stretch an irrelevant reference. An irrelevant case study signals the sender did not do their research. Hierarchy: direct match (same industry) → close match (adjacent challenge, careful framing) → no match (omit proof, let the observation carry the email). **Name proof only when the reader will recognize it.** When a real, relevant customer would not be recognized by this prospect, describe the outcome generically rather than naming an unfamiliar company: naming an unrecognizable case study tends to underperform because the reader thinks "that isn't me" (Eric's data). Recognizable proof, named; unrecognizable proof, described. Still bound by the Proof-Asset Gate (the named proof must be real and on file).

### Proof-Asset Gate: get the real proof, do not fake it

The fastest way copy goes hollow is covering a missing fact. The copy wants to name a client and there isn't one approved, so it writes "a leading firm". It wants a number and there isn't one on file, so it rounds up a guess or writes "significant results". Both are dead on arrival, and an invented number is worse: it can be wrong.

The rule: do not write copy whose credibility needs hard proof you do not have. Hard proof is a named client you may name, a real case study with a before/after the client stands behind, or an exact number tied to a real outcome. If the angle needs one of those and it is not on file (`client-profile.yaml`, `offer-intelligence.md`, an approved artifact, or the intake), be blunt about the gap and collect the real thing from the client. Do not paper over it with a vague phrase, an unnamed stand-in, an invented metric, or a silent omission.

Decide the tier on one question: is the angle hollow without this proof, or just less strong?

- Hollow without it: the angle's whole credibility hinges on the missing proof. Hold that angle, send the client the fill-in form (`proof-asset-request.md`), and either switch to an angle your on-file evidence already supports or wait for the proof.
- Would only strengthen: the copy already stands on a real signal. Flag the gap, send the form, ship the viable version now, and upgrade when the proof returns.

This sits next to capability truth (never claim a product capability the client cannot deliver) as a separate rule: capability truth is about not overstating what the client does, the proof-asset gate is about not faking the evidence that it works. Doctrine: memory.

Weak offer clarity is not a copy problem. It is a strategy problem showing up in the writing.

---

## CTA Standards

**Canonical CTA doctrine: the CTA Hierarchy.** Offer-first, lead magnet optional, rotate across steps. The booked call is always the goal; every CTA is a low-friction way to earn the first "yes" (honest friction-laddering, the offer always real). Prefer the direct offer-led soft CTA (`Would that be worth sharing more?`) over inventing a lead magnet; use a real magnet when one exists, best as a follow-up mechanism. No two steps in a sequence share a CTA sentence or mechanism. The single source of truth is `/campaign-copywriting` → Offer-First Copy Standard → The CTA Hierarchy; the bullets below are its checklist.

**Every step sells only the next step (the open-loop chain).** The subject earns the open. The first line earns the CTA. The CTA earns the yes. The asset opens the gap. The gap makes the call obvious. No link tries to do a later link's job — an E1 that tries to sell the call is skipping three steps, which is why pitch-first copy fails.

**The delivery message after a yes: no pitch on delivery, but the ask is DEFERRED not deleted (HARD RULE, 2026-07-17).** Conditional on `offer.lead_magnet_gap` in `client-profile.yaml`. **Gap present:** delivery (day 0) is pure value, zero call ask (`Great {{first_name}}, here's the link. Curious to get your take on it.`) — attaching a sales ask to the free thing announces it had a price and cheapens it. **A follow-up is then REQUIRED:** day 2-3 carries the ask, aimed at the unresolved motive (`the one thing it can't work out on its own is [the gap]. Want me to run the real one for you?`); day 7 gives a guilt-free out. "No ask on the delivery email" is not "no ask ever, by anyone" — a pure-value delivery with no follow-up strips the only ask and replaces it with hope. **No gap (or `direct_offer`):** keep the soft time-proposal at delivery. Full rule + reasoning: `/campaign-copywriting` → CTA Hierarchy → The Delivery Message.

- Use one CTA per email, and put one in every email — follow-ups included. Email 1 carries the primary value-backed CTA; the follow-ups (Email 2, and Email 3 in a 3-step) carry a soft, low-friction CTA (a light re-offer or a forward-looking question). Never end an email with a dead-end soft close that trails off and gives the reader nothing to answer.
- Every CTA has a setup sentence plus one easy way to say yes. The setup sentence names the specific deliverable or next step and why it is worth the prospect's time. The ask itself follows the pattern for its slot (below).
- **HARD RULE — make "yes" the easy answer, and keep the prospect on top.** The invariant never changes: the prospect is always the one on top, under zero obligation, never made to feel they *want*, *need*, are *missing out on*, or are *obligated to reply for* what we have. The sender does the work and makes saying yes take one word. A needy or presumptuous ask touches their ego and reads as a catch; an easy, deferential ask reads as genuine. It must never sound scripted, sketchy, or like there is a hook.
  - **Email 1 (the new thread): one soft permission question is mandatory.** Name the specific free deliverable, keep the workload split in parentheses, then close with the message's only question, such as `Would that be worth hearing more?`, `Open to it?`, or `Can I send it over?`. The statement-only `Just reply "Yes"...` opt-in is reserved for later steps.
  - **Follow-ups (Email 2, and Email 3 in a 3-step): a forward-looking question.** A short question they can answer (a light re-offer framed as a question, or a routing question). Not the opt-in, never a dead end.
  - **`May I send it over to you?` / `Can I send it across?` / `Would it help if I sent it?` are acceptable alternatives.** German: `Darf ich es Ihnen schicken?` (not `Möchten Sie…?` / `Wollen Sie…?`). The selected Email 1 CTA is the message's only question.
  - **Framework A close:** `Would that be worth hearing more?` and `Would that be worth sharing more?` (Aaron's own most-used phrasing, interchangeable) are the preferred default after the specific free deliverable and workload parenthetical. It is not the banned `Worth a look?` / `Interested?`.
  - **Never use** framing that puts the prospect in the wanting / needing / obligated seat: `Want me to send it?`, `Want us to send it?`, `Want the link?`, `Did you want…?`, `Interested?`, `Let me know if you'd like…`, `You'll want this`, `Don't miss…`, `Worth a look?`, or anything that implies they are asking us, chasing us, or short of something. Expand the spirit, not just these tokens: if a line could make a confident owner feel pitched-at, talked-down-to, or like the favour runs toward us, rewrite it so the deference runs toward them.
- Make the next step useful, not just low effort.
- Make both yes and no easy to answer.
- Reference only deliverables the operator can actually provide after a positive reply.
- Do not promise audits, scorecards, benchmarks, ROI estimates, or assets unless the underlying data or asset is confirmed.
- Avoid CTAs that only ask whether the problem exists. That is weak because the prospect gets no value for answering.
- **Rotate the CTA across the steps of the sequence (checkable): no two steps share a CTA sentence or the same offered mechanism.** Email 1 = the offer ask; Email 2 = a different, lower-friction mechanism with its own ask; Email 3 (small-TAM only) = a double-down on a different lever with a different ask. Read the CTA sentences side by side; if any two match, rewrite. The same CTA on every step reads as a repetitive loop and gets ignored.
- Avoid hard meeting asks in early cold email unless the strategy deliberately accepts the tradeoff and the next step is clearly useful.
- Avoid vague CTAs that require the recipient to invent the next step.
- Avoid pressure, urgency, and false scarcity.

The CTA should reduce decision load. If the recipient needs to think hard before answering, it is too heavy.

---

## Signature Standards

- Email 1 (the single new thread) must close with a full signature block, not a first name alone. A fuller sign-off reads as a real person at a real company and supports legitimacy and deliverability.
- The signature is a 3-line block: line 1 = full name; line 2 = title and company joined by " @ " (e.g. "Partner @ Acme Oy"); line 3 = company location (city + country).
- **Phone line (optional 4th line):** when the client has supplied a sender phone number, add it as a 4th line below the location. Use ONE fixed number per persona (the persona is one real person — never show two or three different numbers across a client's campaigns); if the client provides several, the first is primary and the rest are held as spares in the profile (swap if a number is ever flagged). The number is static sender identity, sourced from `client-profile.yaml` `sender_persona.phone`, configured once on the step like the rest of the block — never spun, A/B-tested, or put in per-contact data. If the client has no number yet, the 3-line block stands; do not invent one.
- In-thread follow-ups (Email 2, and Email 3 in a 3-step) sign with the first name only — they continue a thread where the sender's identity was already established. But a sign-off is mandatory: **every email in the sequence, follow-ups included, ends with at least a name.** A follow-up with no sign-off at all is a failure — it reads as an unsigned fragment. The minimum is the first name; the full block is optional on follow-ups.
- Each signature line goes on its own line. The block stays plain text; line breaks are not "formatting" in the deliverability sense, so this does not violate the plain-text rule.
- Do not invent a specific senior title for a fabricated sender persona — use a broad title (e.g. Partner) if there is none.
- Do not spin, AI-vary, or A/B-test the signature. Pull the name from the sender persona and the company name + location from the client profile or public contact page.
- Place the signature in the sending tool, never in per-contact lead or CSV data. In the `variants.yaml` template path it is part of the campaign step body. In the pre-written copy path the body variable carries no sign-off, and the static 3-line signature block is appended below the variable in the sending-tool step. See `/campaign-copywriting` Pre-Written Email Copy Architecture.

---

## Follow-Up Standards

- Each follow-up must stand on its own.
- Do not open by narrating that you are following up.
- Do not repeat the same argument if the previous email failed.
- Add a new reason, clearer proof, a different value angle, or a more useful next step.
- Keep follow-ups shorter than the first email.
- Do not promise to stop based on silence. Follow `spam-word-checker.md` for closeout and unsubscribe logic.
- Avoid long sequences unless there is a clear reason. More touches can train recipients to ignore the sender.

Follow-ups should feel like useful second attempts, not reminders that the first message was ignored.

---

## Personalization Standards

**Per-contact COPY personalization is RETIRED (2026-07-05). Offer-first copy is shared (first name plus company only). Signals still drive TARGETING (who to email, campaign slicing, which offer a segment gets), never per-contact copy. The standards below apply to targeting and enrichment data, not to writing per-contact copy variables.**

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

- The first email should carry the strongest relevance signal and clearest offer.
- Later emails should not merely repeat the first email.
- Rotate the angle only when the new angle is meaningfully different.
- Keep sequence length conservative unless prior campaign data justifies more touches.
- New-thread emails must have their own subject and must stand alone.
- **Single thread, 2 to 3 steps (HARD RULE, TAM-size dependent).** Every campaign is ONE thread: Email 1 (new thread, offer-led) plus one or two same-thread follow-ups. Default 2 steps; 3 only for a small TAM. No second new thread, no Email 4. (The 4-email / two-independent-thread structure is retired 2026-07-05.)
- Email 1 is the new-thread offer-led test; A/B the offer and subject on it.
- Each follow-up (Email 2, and Email 3 in a 3-step) is a same-thread reply that MOVES the conversation: switch the mechanism (a 3-minute video, a written teardown, a lead magnet) or double down on the biggest benefit or the risk reversal that got missed. It never re-sends Email 1's pitch, and it always ends with a soft CTA (a light re-offer or a forward-looking question), never a dead end. Each step's CTA differs from the others': no repeated CTA sentence or mechanism across the sequence (see CTA Standards, the CTA Hierarchy).
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

Spintax should reduce pattern repetition without making the writing sound unstable.

---

## Cutting Process

Run three editing passes before final copy is approved.

1. Delete filler.
2. Compress long sentences.
3. Remove vague adjectives and replace them with concrete facts where possible.

Stop editing when the email is clear, specific, and natural. Do not compress so hard that the message becomes cryptic.

---

## Scoring Rubric

Use this rubric after the spam-word scan passes.

| Dimension | Weight | What To Check |
|---|---:|---|
| Relevance | 25 | The reason for outreach is clear and specific. |
| Value clarity | 25 | The recipient can understand the offer quickly. |
| Proof quality | 15 | Claims are believable, specific, and relevant. |
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
- [ ] No banned words, phrases, formatting patterns, fake urgency, or unsafe unsubscribe logic.
- [ ] No em dashes, double hyphens, or mid-sentence dash separators in sendable copy.
- [ ] No colon-as-runway sentences.
- [ ] No comma-wrapped company descriptors.
- [ ] Markdown copy and YAML copy match exactly.

### Deliverability

- [ ] Plain text only.
- [ ] No all caps, repeated punctuation, or decorative formatting.
- [ ] No links in emails 1-3 unless the user explicitly approved an override.
- [ ] No calendar links in emails 1-3.
- [ ] Subject line does not mislead, overpromise, or mimic a fake thread.
- [ ] Email 1 subject is 2 to 4 lowercase words with exactly 1 merge token.

### Writing

- [ ] Line 1 is OFFER-LED and carries no signal (`/campaign-copywriting` Hard Rule 19). The signal-first opener is retired 2026-07-17, and the three rows that enforced it here went with it: "first line is recipient-centered", "relevance signal appears before the pitch", and "first line names a specific, observable signal and uses one of the four Signal-First Execution Patterns".
- [ ] Any slice-shared signal fact in the BODY is true of every contact in the slice, rides inside the offer sentence, is never framed as this reader's own, and never opens the email (Hard Rule 38). No per-contact signal copy (Hard Rule 34).
- [ ] Any line that states a signal fact passes the implication test: it says what the fact MEANS for the reader, not a description of what the sender saw, a compliment on the signal, the bare fact with no "so what", generic pain before the signal, the signal buried behind a pitch, or flattery into a pitch (full bank: `/campaign-copywriting` Signal-First Anti-Patterns, live).
- [ ] Email 1 and Email 3 open with an OFFER-LED opener (lead with the offer itself), never a vague self-introduction. (Question-first / diagnostic-mirror openers retired with proven-mode.)
- [ ] No observational opener phrases ("I noticed", "I saw that", "Congrats on", "I stumbled upon", "I came across", "I wanted to reach out").
- [ ] Zero fake-familiarity phrases ("hope you're well," "just checking in," "following up on my last," "circling back," "touching base," "bumping this," "I wanted to reach out/connect," unearned flattery), and no warmup sentence before the first relevant line.
- [ ] First two lines pass the said-out-loud test (point of view and/or spoken rhythm; sounds like a real person, not a textbook). Follow-ups imply the prior touch without "following up on my last."
- [ ] Offer is clear in one pass.
- [ ] Proof supports the claim without bloating the email.
- [ ] Proof is written in plain sentences, not dash parentheticals.
- [ ] Email 1 ends with its only question, a soft permission CTA after the specific free deliverable and workload parenthetical. The statement-only `Just reply "Yes"...` opt-in is reserved for later steps. No `Want me to…`, `Want us to send…`, `Interested?`, or `Worth a look?`.
- [ ] CTA references only a confirmed deliverable or confirmed next step.
- [ ] Written 1-to-1: first-person singular ("I"), "we/us" only for genuine team/company facts.
- [ ] Every claim about the client's own product maps to a real, deliverable capability. No invented features, integrations, or results the client cannot fulfill (most important when copy is AI-generated at scale).
- [ ] New-thread CTAs do not repeat the same vague deliverable by default.
- [ ] Email 1 closes with the full signature ({full name} / {title} @ {company name} / {company location} / + phone as a 4th line when the client has supplied one); the follow-ups (Email 2, Email 3) close with at least the first name. No email is left unsigned. The phone is one fixed number per persona, sourced from `client-profile.yaml`.
- [ ] Copy reads naturally aloud.
- [ ] Email is formatted as short blocks separated by blank lines, not one dense paragraph.
- [ ] Framework A Email 1 uses its compact offer block with no pain, observation, proof, or setup paragraph before the offer. Later messages keep one idea per block.
- [ ] After the `{first_name},` greeting the next word is lowercase unless it is a proper noun (no `Name, Each ...` mid-sentence capital).
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
- [ ] Closeout wording does not promise silence-based stopping.
- [ ] The sequence is ONE thread, 2 to 3 steps (Email 1 + one or two same-thread follow-ups); 2 default, 3 for a small TAM (Hard Rule 18). No second new thread, no Email 4.
- [ ] Email 1 uses a new subject and an offer-led opener (question-first / diagnostic-mirror openers retired with proven-mode); the follow-ups are same-thread replies.
- [ ] The A/B test (offer / subject) rides Email 1.
- [ ] Each follow-up moves the conversation (switch the mechanism or double down on the biggest benefit / risk reversal), never re-sends Email 1's pitch.
- [ ] CTA rotation: the sequence's CTA sentences read side by side are all different; no two steps share a CTA sentence or the same offered mechanism (the CTA Hierarchy).
- [ ] Lead magnet honesty: no invented magnet; the direct offer-led CTA (`Would that be worth sharing more?`) carries the sequence when no real asset exists, and a real magnet is used only when it genuinely exists.
- [ ] Next-Step Gate (WARN, not a blocker at copy time): any real magnet should have a named unresolved motive and next step (`offer.lead_magnet_gap` / `lead_magnet_next_step`). Missing = warn and carry on with existing CTA behavior; the requirement is enforced upstream at magnet selection, and legacy clients backfill at their next refresh.
- [ ] Delivery message matches the gap: pure value + zero call ask when a gap exists; soft time-proposal retained when it doesn't. Never stripped without a real motive.
- [ ] Gap-present sequence defines its follow-up: day 2-3 ask at the unresolved motive + day 7 guilt-free close, with sender/trigger/day named, plus the kill number. Pure-value delivery with no follow-up FAILS.
- [ ] Asset-announcement E1 earns its slot: used only when the asset carries a real inherent-value anchor AND the dream outcome sits in the announcement sentence. Otherwise the conditional structure leads.
- [ ] Inherent-value anchor is true and correctly slotted: it prices the ASSET and never fills the Concrete #3 outcome-number slot. No inflated scale, spend, price, or industry coverage.
- [ ] Email 2 (and Email 3 in a 3-step) support Email 1 in the same thread; each ends with a soft CTA, not a dead-end soft close.
- [ ] Every email ends with a CTA or clear next step (support emails included) — no email left hanging.
- [ ] No goodbye email or fake wrap-up appears in the sequence.
- [ ] The copy follows the saved campaign plan and locked offer or lead magnet.
- [ ] Every variant and spintax branch passed the same QA.
- [ ] Offer passed the Offer Architecture gate before Email 1 was written (SQL/MQL framing, easy-to-say-yes test, named risk reversal).
- [ ] Email 1 is 25 to 35 body words, with 2 to 3 main-body sentences and exactly 1 question, the specific free deliverable first, and the sender/prospect workload split in parentheses. Any optional P.S. is declarative and included in the word cap. Follow-ups stay under 50 words.
- [ ] In the pre-written copy path, contacts with no relevant personalization data received the fallback general copy in the same column (no separate fallback column, no blank rows), and the fallback opener matches the email's core angle.
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

---

## What To Do Next

If writing campaign copy, return to `campaign-copywriting.md` and apply its stepwise workflow.

If copy exists, run `spam-word-checker.md` first, then use this guide for the second-pass quality review.

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short — record status, not raw output. Full protocol: `client-activity-log.md`.
