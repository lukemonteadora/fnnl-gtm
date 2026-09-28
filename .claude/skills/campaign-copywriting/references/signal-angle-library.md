This file holds the retired Signal-First Opener Rule and the two live sections under it, the Signal-First Anti-Patterns and the Signal Angle Library (slice-level angle guidance), moved verbatim from `../SKILL.md` on 2026-09-28. Read it when a campaign slice rests on a signal or carries a slice-shared signal fact, or when another skill cites the Signal Angle Library or the Anti-Patterns. Words like "above" and "below" refer to the original single-file order; the "Where the rest lives" table in `../SKILL.md` says where each named section now is.

## Signal-First Opener Rule (RETIRED 2026-07-17)

**The Signal-First Opener Rule and its four Execution Patterns are RETIRED (2026-07-17), superseded by the Offer-First Copy Standard's offer-led opener (Hard Rule 19).** They mandated that the first line reference the trigger that put the prospect on the list. Hard Rule 19 requires the first line to lead with the OFFER. No signal opens a cold email. The full retired rule and its four patterns are archived at `outbound/_archive/signal-first-opener-retired-2026-07-17/signal-first-opener-rule-and-execution-patterns.md` rather than quoted here, since a fully-quoted retired rule with no marker on its own subsections is exactly what let three live QA rows keep enforcing it after retirement.

**What survives.** Signals remain fully in play for **targeting**: which slice gets its own campaign, and which offer that slice gets. A slice-SHARED signal fact may also ride INSIDE the offer sentence (Hard Rule 38). What is retired is the signal as the OPENER, and per-contact signal copy (Hard Rule 34).

**The two subsections below are LIVE and unaffected by this retirement**, each under its own header:
- **Signal-First Anti-Patterns:** the observational-opener ban and the implication test. Still the canonical bank, still pointed to by `spam-word-checker.md`, `/personalization-subagent-pattern`, and `/campaign-strategy`. That ban is unrelated to the opener question and survives intact.
- **Signal Angle Library:** retrofitted (2026-07-17) to slice-level angle guidance. Its opener templates are retired (also archived, see that section below); the rest is live.

### Signal-First Anti-Patterns: the six ways a line leaks the signal (LIVE, survives the 2026-07-17 retirement above)

**This bank is NOT retired, and the marker above does NOT scope it.** It is the canonical enforcement home of the observational-opener ban and the implication test, and `cold-email-copy-best-practices.md`, `spam-word-checker.md`, `/campaign-strategy`, and `/personalization-subagent-pattern` all point here. That ban is independent of the offer-led-opener question: "I noticed" / "I saw that" / "Congrats on" announce scraping and add no information wherever they sit, so they stay banned in every email.

**The retirement changed WHERE this applies, not WHETHER.** No signal opens a cold email (Hard Rule 19: the opener is offer-led), and no line anywhere in the sequence may leak a signal in any of the six ways below. The bank now carries each pattern's Wrong lines and one fix for all of them; the "Right" rewrites that used to follow each Wrong line are retired (operator-approved Aaron alignment, 2026-09-21).

Below are the six ways it goes wrong, the fix, and the one test that catches all of them.

One rule sits under every pattern: **start from the IMPLICATION of the data point, not the data point itself.** Every "Wrong" line below describes what the sender saw. The prospect does not care that you found the information; they care what it changes for them. But an implication earns a place in copy only when it is true of every contact in the slice. A consequence you infer, or a model generates, is a hypothesis, never a fact about a named company, and it never becomes a question probe (doctrine §5 step 1: "Model-generated pain points are hypotheses, not facts"; doctrine §11; examples §8).

**1. Observational openers (the most common mistake).** Announcing that you saw the signal instead of stating what it implies.
Wrong: "I saw [Company] is hiring SDRs."
Wrong: "I noticed you recently raised a Series B."
Wrong: "I came across [Company] and noticed you're running HubSpot."
Wrong: "I saw that [Company] recently hired a new CRO."
Wrong: "I saw you sell to [vertical]." (and worse, reciting their customer list back: "I saw you sell to Acme, Globex, and Initech.")

**2. Complimenting the signal instead of using it.** Congratulating them on the event instead of extracting its consequence.
Wrong: "Congrats on the Series B! Really impressive growth."
Wrong: "Loved your recent LinkedIn post about [topic]."
Wrong: "Congrats on the new VP Sales hire at [Company]."

**3. Mentioning the signal but not extracting the implication.** Naming the fact and stopping, leaving the prospect to supply the "so what."
Wrong: "I noticed [Company] has a Head of Marketing role open."
Wrong: "I saw [Company] is using Salesforce."
Wrong: "I noticed [Company] recently expanded into the US market."

**4. Leading with generic industry pain before the signal.** Opening on a platitude any competitor could send, then bolting the signal on after.
Wrong: "Most companies at your stage struggle to hit pipeline targets. I saw [Company] has a VP Sales role open."
Wrong: "B2B companies in [industry] often deal with slow onboarding. I noticed [Company] is hiring a Customer Success Manager."
Wrong: "A lot of [industry] companies struggle with manual reporting. I saw you recently hired a new Head of Finance."

**5. Burying the signal at the end.** Leading with your pitch and tucking the relevance behind it.
Wrong: "We help B2B companies scale their outbound pipeline. I noticed [Company] is hiring an SDR which caught my attention."
Wrong: "Our platform helps finance teams close faster. By the way, I saw [Company] recently closed a funding round."

**6. Using the signal as a flattery bridge into a pitch.** Praising the signal as a runway into "we could help."
Wrong: "I saw [Company] was named one of the fastest-growing companies in [region]. That is really impressive, and it made me think you might be dealing with some scaling challenges we could help with."

**The fix for every Wrong line (operator-approved Aaron alignment, 2026-09-21):** a slice-shared signal fact rides inside the offer sentence or the P.S., true of every contact in the slice and never framed as this reader's own (Hard Rule 38); a signal that cannot meet that stays in targeting and out of the copy. The Right rewrites that used to sit here are archived at `outbound/_archive/aaron-alignment-2026-09-21/campaign-copywriting--signal-first-right-lines.md`: they stated unverified generalizations as facts about a named company ("3x headcount push", "data hygiene breaks down before quota does"), carried per-company facts, and ended on question probes (doctrine §5 step 1, §11; examples §8).

**The test to apply before writing any line that states a signal fact.** If you are describing what you saw, noticed, or came across, you are writing an observation, not a signal line. Rewrite it from the implication of the data point, not the data point itself, and only when that implication is true of the whole slice. The prospect does not care that you found the information. They care what it means for their situation.

### Signal Angle Library (slice-level angle guidance for the eight timing/context signals plus the sold-to axis). RETROFITTED 2026-07-17, LIVE

**This Library is LIVE and is NOT retired. What retired is its opener templates, not the Library.** Read the distinction before using it, because the two halves now have opposite statuses:

- **LIVE: the Library as slice-level angle guidance.** What a signal MEANS, which pain to lead with for that slice, and which proof to pick so it is recognizable to that reader. This is what `/campaign-strategy` consumes (its Signal-Driven Slice Library names this as the matching copy extract) and what the `/social-proof-bank` Trigger & Angle bank feeds with its `data_backed = y` rows. All of that stands.
- **RETIRED (2026-07-17): the opener templates below, as openers.** Each one puts the signal in the first line, which Hard Rule 19 no longer permits. They are retained as angle reference, not as lines to send.
- **LIVE: every caveat.** The anti-surveillance caveats (department headcount, sold-to customer lists), relationship truth on champion re-engagement, source truth on JD content, and the recognizable-proof rule are all bans. They survive intact and are enforced by the QA checklist.

**How to use it now.** It informs WHICH shared message a SLICE gets, never a per-contact opener. The signal picks the slice, the offer opens the email (Hard Rule 19), and the Library tells you which pain and which proof that slice's shared body should carry. Where a slice-SHARED signal fact belongs in the body at all, Hard Rule 38 governs: it rides inside the offer sentence, never Line 1, and never as this reader's own. Observational per-contact copy personalization stays retired (Hard Rule 34 allows only its at most two per-contact variables, inside the offer sentence), so the `[bracketed]` placeholders below are slice-level fills, not per-contact ones.

#### Retired opener templates (archived, not to be sent)

The nine per-signal opener templates that used to live here are retired with the Signal-First Opener Rule above (each puts the signal in Line 1). They're archived at `outbound/_archive/signal-first-opener-retired-2026-07-17/signal-angle-library-opener-templates.md`, preserved for their angle logic (which pain a signal implies, which proof fits it), not as sendable copy. The matching TAM slices are in `/campaign-strategy` (Signal-Driven Slice Library); full slices, combos, and acquisition paths are in `signal-strategy-playbook.md`. The nine signals covered: job change, department headcount, headcount growth, founded year, ads intelligence, champion re-engagement, jobs data/JD content, profile/work history, and who-they-sell-to. Every caveat attached to each signal (anti-surveillance on department headcount and the sold-to customer list, relationship truth on champion re-engagement, source truth on JD content, one work-history reference per email) is still LIVE and still enforced by the QA checklist below, even though the opener line itself is retired. On the sold-to axis, `sells_to_vertical` alone may ride inside the offer sentence as a per-contact variable (Hard Rule 34; Aaron process alignment, operator directive 2026-09-22), as the audience the deliverable serves ("...in front of 50 [sells_to_vertical] buyers"), never as "I saw you sell to X"; likewise `own_best_client` names one client as the deliverable's target, never a list of their customers read back.
