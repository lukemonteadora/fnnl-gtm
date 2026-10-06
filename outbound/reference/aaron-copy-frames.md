# Aaron's copy frames: the templates every Aaron-lane email is built from

**What this is.** The operator's rule since 2026-09-24 (ported into this workspace 2026-09-28): every cold email the Aaron lane writes is built on one of Aaron's own real example emails, frame by frame. The frame keeps his structure, his sentence count, his slot order and his fixed connecting words. Only the slots change (the offer, the pain, the relevance fact, the proof). This file turns his example bank into those templates so that "sounds like Aaron" becomes something a check can confirm.

**The source.** Every frame cites the section of `aaron-examples.md` (or `aaron-doctrine.md`) it comes from. Those two files are now a frozen snapshot in this folder (2026-09-29: `/ask-aaron` no longer carries a corpus and reads Aaron's live Notion notes instead), so the authority is his live Notion section. If a frame here ever disagrees with what his notes show today, his notes win and this file gets fixed. A newer model email found live in his Notion section can be added as a new frame, labelled live and dated. Follow-up for the operator: retire the frozen snapshot and rebuild these frames from Notion.

**Frame refresh.** Before every Call 2, `aaron-lane.md`'s "Frame refresh" procedure checks Aaron's Notion study notes published after this file's newest change-log date and adds any new model email, subject pattern or CTA as a new dated live frame here. Frames are only ever added, never deleted.

**Why frames, in his own words.** His portability rule: *"it's the script framework that's doing all of the heavy lifting here, not the specific words."* Change only the offer, the pain point and the CTA language. So a frame fixes the skeleton and the connecting words, and the client's own words fill the slots. Two failures sit on either side of that:

- **Too loose:** an email "in his spirit" that uses none of his frames. That is what the first copy written through the lane did, and it is what this file exists to stop.
- **Too literal:** his sentences pasted with the nouns swapped, which carries his clients' facts ("100 companies", "24-hour turnaround") into claims that aren't ours. The slot is filled with our fact or the line is cut.

## How to use a frame

1. **Pick the frame per email** from its "use when" line, then fill every slot. Keep the slot order and the sentence count. Keep the fixed words (marked in **bold** in each template) exactly, apart from case and the first-name token.
2. **Fill slots with this client's facts only.** Each slot names its job, taken from his own teardowns. A slot you cannot fill truthfully is cut only where the frame marks it optional. Otherwise pick another frame.
3. **Record a frame map** for every email: the frame id, then one row per slot with his source line, our line, and the slot's job. `/campaign-copywriting` checks that map before it writes `copy.md` (and `variants.yaml`, both under `profiles/<slug>/campaigns/<campaign-slug>/`).
   - **Name frames so a script can check them.** `frame` holds exactly one id from this file (F1 to F11, F6-v2, F11-v2, FU1 to FU5, DR, DR-input); `subject_frame` holds S1 to S6. A combination goes in its own field: `ps` for the PS frame (P1 to P5, P3c), `line_two` for the offer line under F7, and `add` for the FU3 or FU4 move on top of FU1 or FU2. Never write a combination into `frame` itself ("F6 + P4" is `frame: F6` plus `ps: P4`).
   - `python outbound/scripts/aaron_frame_check.py --client <slug>` (or `python outbound/scripts/aaron_frame_check.py <file>`) runs the conformance check below on the YAML record. By default it reads `outbound/profiles/<slug>/aaron-copy-call.md`. It is regex plus PyYAML, with no network call.
4. **Variants test his own tests** (the list at the end), each a different frame or a frame's documented option. A variant never invents a structure no frame has.
5. **The rails still bind** (`aaron-lane.md`): truth, spam words, no em dashes, `{{double_braces}}` variables that exist, compliance. A frame never licenses a claim the client can't back.

**Truth gates on existence frames.** Frames that say the thing already exists ("I just built", "I just ran") are true only once the asset exists. Use one only when the campaign is held until the asset is built, and mark the gate in the frame map. The conditional frames ("if we could") make no existence claim, which is why they are his default for offers still being built.

**Variables.** `{{first_name}}` goes where his frame puts the first name (he writes it lowercase as "first name" in his drafts). Industry and role nouns written into a campaign are slot fillers, not variables. A per-contact variable (a handle, a case study, an observed fact) is used only where the frame has that slot and the column exists.

**Personalization (Aaron, 2026-09-28: "no one has ever booked a meeting over a compliment about the coffee shop down the street").** No scraped compliment and no per-lead AI body. The two company variables are `{{sells_to_vertical}}` (who the prospect's own company sells to) and `{{service_offered}}` (what they sell), written once per shipped company by batched Claude sub-agents from the text the fit pass already read, not per contact. Every email also carries at least one real, hand-written detail that ties to why this prospect would buy, kept to the few details the frame has slots for. No PlusVibe `{{variable}}` ships blank: `outbound/scripts/copy_var_gate.py` checks every variable the copy uses against the lead file before upload, per `aaron-flow.md` section 9.

## Email 1 frames

### F1. Offer first, relevance in the PS (examples 1.1, "After", his most transferable move)

> **{{first_name}}, if we could** [three or four sender verbs] **one free** [deliverable] **for you. Would that be worth sharing more? PS, thought it'd be relevant since** [one observable fact about them].

| Slot | Job (his words) | Fill rule |
|---|---|---|
| sender verbs | the work split in prose ("ideate, script, edit, and record"): shows the sender does the work | only real steps of the real process |
| "one free" + deliverable | the single free deliverable | one thing, named plainly, and say "free" |
| CTA | "Would that be worth sharing more?" | fixed |
| PS relevance | the relevance "didn't get deleted, it got demoted to the PS" | one fact true for them and checkable on the list; no fact, no PS (use F3 or F4) |

**Use when:** the offer is a done-for-you deliverable and the list carries one true relevance fact.

### F2. The no-cost build with an effort PS (examples 1.5, his AI bake-off winner)

> **If we could build you a no-cost** [deliverable] [the value clause], [the elaboration clause], **would that be useful? PS,** [effort signal] **takes you** [time] **to** [consume verb].

| Slot | Job (his teardown, clause by clause) | Fill rule |
|---|---|---|
| "no-cost" | "it's free, doesn't cost anything to them" | fixed |
| value clause | "that shows the value" | what the deliverable is, specific |
| elaboration clause | "pushes that value forward a little bit more… it's elaboration" | two short parallel phrases in his "same shape, same buying signals" rhythm |
| effort signal | "we're actually building this thing for you… there's effort that's going into it" | a real turnaround or real build step |
| time + consume verb | "it's easy to say yes to. You don't have to put much effort into it" | the honest time it takes them |

**Use when:** the deliverable is built for them, or shaped to them, and consuming it takes a few minutes.

### F3. Direct to offer, optional proof PS (examples 2.1, 2.2, 2.3 direct-to-offer versions)

> **if we could** [concrete deliverable or outcome, with the free or no-cost term], **would that be worth sharing more? PS tested this for** [a twin] **recently.** [one plain, named result].

| Slot | Job | Fill rule |
|---|---|---|
| deliverable | the offer, which "becomes the copy" | concrete; carries the free term |
| CTA | his signature ask | fixed ("would that be worth sharing more?", or "Is that worth sharing more?") |
| proof PS (optional) | "you don't need to include this" | one proof point, same mechanism, on file; never implies their industry when it isn't |

**Use when:** there is no relevance fact to demote, which is his default: "as long as your offer is good and you're providing it to somebody who you know is relevant, you're going to get good results."

### F4. The one-liner (examples 2.4)

> **Hey, if we could send you** [the deliverable] **that** [the value], **would that be worth sending over?**

**Use when:** the offer carries itself in one sentence ("When the offer is strong, the email can literally be one sentence"). It is the "one-liner" arm of his line-count A/B. His other one-liner arm drops the CTA ("a one-liner entirely with no PS line, no CTA, all kind of together in one"); that is a documented option of this frame.

### F5. The date-certain free deliverable with the work split (examples 1.3)

> **{{first_name}} if we** [deliver the thing] **in the next** [N days] **at absolutely no cost.**
> **So, we would** [task], [task], [task] **and** [task]. **All you have to do is** [one small act].

| Slot | Job (his words) | Fill rule |
|---|---|---|
| deliverable + N days | the time delay: "date-certain free deliverable" | a date the client can actually hit |
| "at absolutely no cost" | risk | fixed |
| task list | effort: the sender's work in prose | real tasks only |
| one small act | "one prospect action (effort)"; "They know exactly what's going to happen." | the one thing they do |

His quote shows the two lines only. Where a CTA is added, it comes from the CTA set below, ends on a question mark (the operator rule in the CTA set), and the frame map marks it as an addition.

**Use when:** the deliverable has a real date and the prospect does one thing.

### F6. "I just built / I just ran", then permission to send (examples 1.6, existence frame, gated)

> **{{first_name}},** [I or we] **just** [ran or built the thing] [the external reference point] **to** [what it determines for them]**. Do you mind if I send it to you?**

His second variation (F6-v2): **{{first_name}}, just built a** [tool] **that** [what the tool does, e.g. "shows you"] [the value]**. Open to testing it for free.**

| Slot | Job (his words) | Fill rule |
|---|---|---|
| sender pronoun | his line is "I" because he built it alone | "we" when a team made the asset, so it stays true |
| ran / built | "you're leading with value, so you built something… usually that takes effort" | true at send time only (the gate) |
| external reference point | added "to increase the value of what it is that we're providing" | a real figure, or a real and checkable evidence base (what the asset is built from); cut if neither |
| purpose slot | what it determines for them | a free offer on F6 carries "free" here, because his source line has none |
| what the tool does (F6-v2) | the verb of the offer slot ("that shows you") | only what the asset really does; "that" is fixed, the verb is not |
| CTA | "zero ask… it's opening that loop" | fixed ("Do you mind if I send it to you?", or on F6-v2 "Open to testing it for free.", which also carries the free term) |

**Use when:** the asset exists (or the campaign is held until it does) and is the same asset for everyone in the campaign. His industry variant names the industry only "if this is actually an industry you've fulfilled for".

### F7. The two-line pair: a pain or relevance line, then the offer (doctrine 9, body structure)

> [line one: one common, validated pain, stated, or a relevance line]
> [line two: one of the offer lines from F1 to F6 (including F6-v2), with its CTA]

**Use when:** testing it against the one-liner, which is how he uses it ("I usually like to AB test both of those"). Line one "builds a little bit of pain but doesn't focus on it too much." It is a **statement**, never a question (his rejection bank kills question-form pain openers: "kind of sounds like a cheesy ad"). It must trace to a research cluster, and the pain it names must be the pain the offer solves (his hook-payoff rule). Keep line two word for word the control's offer line, so the variant tests only the pain line.

**No verbatim source email exists for this pair.** It comes from his description (doctrine 9, ledger R14), so the conformance check tests its structure only: a stated line, then an offer line from a real frame.

**A neutral question opener is a different thing, and his rejection bank does not kill it.** His Sep 7 "are you still carrying [product line]?" and Sep 21 "do you currently offer a trial?" are factual questions whose answer is useful either way (doctrine 8, the soft-question framework). They need a fact true of every contact in the campaign, and the offer must arrive in the next sentence. The Sep 21 line is a live candidate, taken from the capture's summary until its transcript is read.

### F8. The five-part free trial (examples 1.7, volume-tested for one client)

> [1. one-variable opener]
> **if we could help you** [dream result] **would you be open to trying it out,** [the free term and length]**?**
> [3. elaboration: you'd get the result without the thing they object to, and "we do it by" X, Y and Z]
> **Let me know and I'll shoot you over the** [trial link]**.**
> [signature, then a proof PS]

**Use when:** the offer is a free trial of a working product and the result sounds too good to be true, so line three has to "make that feel real". Line one needs a per-contact variable; with none, drop it and his "line one and line two could be the email in and of itself" applies. The proof PS follows the proof rules below.

### F9. The no-pitch curiosity email (examples 1.8, conditional)

Subject, belief shift, mirror line, what we're building, then the money line and **"Happy to share the thinking if you're open."** He conditions it on a very precise list and a real, statable reason each reader was picked. It pulls lower-intent replies (doctrine ledger R21). Not a default.

### F10. The passive direct offer (examples 1.2, the lending email)

> **we're not here to sell you anything. We just** [what the client does] **pretty frequently** [for people in this space]**. These are the types of** [things] **that we offer.** [a soft close]

Take the shape, not his close (his ends on "worth a quick coffee chat", a meeting ask). Close with a permission CTA from the set below. **Use when** there's no front-end offer and the service itself is the offer (the `direct_offer` exception).

### F11. The pay-per-result test (live, Sep 21)

> **if I had a way to** [deliver the outcome]**…** [the pay-per-result term: **and you only pay per** [unit]]**, would that be worth a quick test?**

| Slot | What goes there |
| --- | --- |
| outcome | the result he'd deliver, named plainly |
| pay-per-result term | the unit they'd pay per (a lead, a booked call, a sale) |
| CTA | "would that be worth a quick test?" (its own CTA; see the CTA set) |

From the Sep 21 Notion capture; confirmed live against his raw captions. **Use when** the client really charges per result.

### F11-v2. The question opener with the soft partnership close (live, Sep 21)

> {{first_name}}, do you currently offer a [entry point]? Asking [as] I found a way to [outcome]. Thinking I could [next step] and we could sort out [partnership term] if you're open to that kind of thing.

| Slot | What goes there |
| --- | --- |
| entry point | the specific thing they'd need to already offer |
| outcome | the result the sender's way delivers |
| next step | the small next action (a draft, a quick build, a test) |
| partnership term | a real, plain payment or revenue-share term, named honestly |

A second line into F11's pay-per-result idea, built as a question opener instead of a statement. **Use when** F11 also applies and the campaign is testing the two openers against each other (see T5 below). Its CTA ("we could sort out [partnership term] if you're open to that kind of thing") is F11-v2's own and does not swap with the shared CTA set.

## Follow-up frames (examples 7.1, doctrine 11)

Every follow-up stands alone, as if it were the first email read. It never names the non-reply and never assumes they read Email 1, so no "easier option", "instead", "as I mentioned" or "did you see". Same spec as Email 1: "short, to the point, conversational, but exist on its own, clear CTA, same idea." Gap: 2 to 3 days.

- **FU1. Strip to the core offer.** **interested in a** [free deliverable]**?** / **interested in a 2-minute video that explains** [our process]**?**
- **FU2. The lower-friction de-escalation (his Loom follow-up).** **Should I send you a two-minute** [video or recording] **showing you exactly how this works?** ("there's zero commitment involved and just curiosity")
- **FU3. Add to it.** Email 1's offer line again, plus one thing Email 1 left out: a pre-handled objection (fixed words **FYI, this isn't** [X] or **this doesn't take a lot of time**), one benefit layer, the risk reversal, or the one proof point he often saves "for email two". His rule for choosing: "If you are already using a stripped-back version like this, you'd probably have to add to it."
- **FU4. Mechanism switch.** A different, easier way to get the same thing: "a document covering how you'd go about this", or a video "explaining how it was done".
- **FU5. The "if it's easier" video one-liner.** **{{first_name}}, if it's easier, I can send over a quick video elaborating on how we** [mechanism]**.**

FU1, FU2 and FU5 are his verbatim lines. FU3 and FU4 are moves he describes, not follow-ups he wrote out, so the conformance check tests them on structure (and FU3's fixed words where used).

## Subject frames (examples 6; Aaron, Sep 21 and Sep 28)

**Two or three words, all lowercase, reading like an internal note typed on a phone** (Aaron flow, see aaron-flow.md section 9). Curiosity plus enough relevance to imply the topic; never pad past 3 words. His endorsed patterns:

- **S1. question about** [topic] ("That one's always a good one." One word under the cap.)
- **S2. fyi** {{first_name}}
- **S3. your recent** [observed thing] / **your new** [observed thing] (needs a real observed thing)
- **S4.** [topic] **problem** (needs a checked, real problem; never an implied account fault)
- **S5. your** [the thing the offer works on] (Sep 21 "your trial"; confirmed live, which `/spam-word-checker` already accepts)
- **S6. quick idea** (live, Sep 28; his own note that a plain subject like this does as well as a crafted one)

Never a fake thread, a fake forward, an emergency or an invoice. **One subject per campaign, never A/B tested.** When a campaign runs an offer test across two halves, keep one subject for both halves so the subject doesn't confound the offer read.

## CTA set (examples 4, doctrine 9)

Use his words, and **one CTA across every Email 1 variant in a campaign that carries one** ("Standardize the CTA across all of them to one line"). The one exception is his own line-count test, whose one-liner arm has no CTA at all.

**Operator rule (Luke, 2026-10-06): every close ends on a question mark.** A CTA below written as a statement ships as a question ("Worth sharing more?", "Open to testing it for free?"), and `aaron_frame_check.py` accepts either ending on every frame that closes on a statement.

- **Would that be worth sharing more?** (his signature; "Worth sharing more." and "Is that worth sharing more?" are his variants)
- **would that be useful?** (F2)
- **would that be worth sending over?** (F4)
- **Do you mind if I send it to you?** / **Mind if I send it to you?** (F6)
- **Open to testing it for free.** (F6 variation)
- **would you be open to trying it out** plus **Let me know and I'll shoot you over the** [link] (F8)
- **Happy to share the thinking if you're open.** (F9 only)
- **would that be worth a quick test?** (F11 only; its pay-per-result CTA)
- **and we could sort out** [a real partnership term] **if you're open to that kind of thing.** (F11-v2 only; does not swap with the shared CTA set)
- **if it's easier, I can send over a quick video** (FU5 only; its follow-up CTA)

Never a meeting ask in a cold email.

## PS frames (examples 1.1, 1.4, 1.5, 2.x, 6; doctrine 9)

One PS at most, one proof point at most, never in line one or two.

- **P1. Relevance:** **PS, thought it'd be relevant since** [fact].
- **P2. Effort and ease:** **PS,** [turnaround] **takes you** [time] **to** [skim or try].
- **P3. Proof we did the work:** **PS tested this for** [twin] **recently.** [plain result] / [client] **went from** [X] **to** [Y] **using this exact process.** / **PS, we've actually just run this exact same process for** [client] **who ended up getting** [X result] **in** [Y time]**.** All three forms say the sender did this exact work for a close twin, so use them only when that is true. A plain, named, legible number, same mechanism, on file. The third form runs only as an A/B arm, since naming a result that specific adds sales friction and should be tested against the plainer first form, not shipped by default.
- **P3c. A named client's plain result:** [client] **saw a** [N]% **lift in** [plain metric]. His acronym-rule fix ("Nani Swimwear saw a 942% lift in ads to cart.", examples 6). This is the honest form for a customer's result on the same mechanism when we didn't do the work for them.
- **P4. Risk reduction:** **PS, obviously this is free, no call required. I'll just send it over to you and then you can decide if it's worth** [running].
- **P5. Small batch:** **PS, we're doing a small batch of complimentary** [deliverables]. True only if the batch is really limited.

## The delivery reply (examples 7.3)

> **Great {{first_name}}, here's a link to the** [thing]**.** [link] **Curious to get your take on it.**

No call pitch in it ("caught in like a trapdoor"). The call ask lives one layer down, inside the asset, pointed at a gap they can't fill themselves.

**DR-input (an input request, such as a qualifying form).** His corpus has no reply for this case, and "Curious to get your take on it" doesn't fit a form. Keep DR's first two beats and close on the effort it asks for: **Great {{first_name}}, here's a link to** [the few questions]**.** [link] [the effort, e.g. "Takes two minutes."]

## The variant tests (his own)

- **T1. Line count:** the one-liner (F4, F6, F6-v2, or F3 without PS) against two lines plus a PS (F1, F2, F7).
- **T2. PS against no PS:** the same frame, with and without its PS.
- **T3. Direct to offer against the call-out:** F3 against F1 with a relevance fact, or against a one-line call-out opener (examples 2.1 to 2.3).
- **T4. The two-line pain pair against the one-liner:** F7 against the one-liner it is built on (F4, F6 or F6-v2).
- **T5. The question opener against the plain offer (live, Sep 21):** F11-v2 against F11.

A campaign's variants are chosen from these. "One change against A" is a house convention; here, a variant changes the frame, as his own tests do.

## The frame-conformance check (run by `/campaign-copywriting` in recorder mode)

For every email, before `copy.md` is written:

1. It names a frame id that exists in this file, with any combination in `ps`, `line_two` or `add`.
2. Its sentences follow that frame's slot order, and its sentence count matches (optional slots may be dropped only where marked). F7, FU3 and FU4 have no verbatim source, so they are checked on structure only. **Aaron flow (see aaron-flow.md section 9): the sentence count is the length rule.** There is no word cap on Aaron-lane copy, and the 25-to-35-word contract in `/spam-word-checker` and `/personalization-subagent-pattern` does not apply to it.
3. The frame's fixed words are present, apart from case and the first-name token, and the CTA is from the set.
4. Every slot is filled with this client's words: no sentence of his is carried over with only the nouns swapped where the slot needs our own fact.
5. An existence frame (F6, F6-v2) sits on a campaign held until the asset exists.
6. Follow-ups pass the standalone rule, and a campaign's Email 1 variants that carry a CTA share one (F11-v2 is the stated exception when it runs against F11 in T5, since its CTA is its own).
7. Where a frame's fixed words would say something untrue, truth wins: the email keeps the truthful words, and the frame map says which fixed word changed and why.
8. **The context slot.** Where a campaign's awareness note gives a `context_budget`, the copy may use up to that many plain sentences saying who the sender is or why they're reaching out, on top of the frame's own slots; it is not part of any frame's sentence count. The Cold-Reader Panel (`cold-reader-panel.md`) is optional and checks this only when the operator asks for it on a run.
9. **The subject.** One subject per campaign, built on a subject frame (S1 to S6), two or three lowercase words, never A/B tested (Aaron flow, see aaron-flow.md section 9).

**Change log.** 2026-09-24: built from the corpus as of 2026-09-18; the same day, Aaron's first frame rebuild flagged eleven places the first draft misread his examples (F6 and F6-v2 slots, P3c, F7 as structure-only, FU3 and FU4, the Sep 21 subject, opener and Email 1, DR-input, the CTA rule), and each was fixed here. 2026-09-28: ported into this workspace. Frame ids, fixed words and the check are unchanged; paths point at this workspace's `outbound/profiles/<slug>/`. 2026-10-05: frame refresh (Aaron flow, see aaron-flow.md section 9): F11 confirmed live with its slot table; F11-v2 added (the question opener with the soft partnership close) and paired with F11 as T5; FU5 added (the "if it's easier" video one-liner); P3 gained a third, more specific form that runs only as an A/B arm; S6 added ("quick idea"); the subject rule tightened from 2-to-4 words to two or three lowercase words, one per campaign, never A/B tested; the personalization rule (`sells_to_vertical`, `service_offered`) and the context-slot and subject conformance items were added. 2026-10-06: frame refresh before the PropFuel Call 2: no new model email, subject or CTA after 2026-10-05 (two Aaron notes created later on 2026-10-05, a funnel-math video and a testimonial post, carry no email wording); no frame added. Frames are only added here, never deleted.

A failure goes back to a fresh Aaron sub-agent for one fix round, like any rail failure. If it still fails, that email is held and shown at the launch review.
