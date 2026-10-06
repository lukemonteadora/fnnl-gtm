# Reply guide template (house standard)

**What this is.** The exact shape of every client's reply guide: the plain document whoever answers a client's inbox uses to reply to prospects. `/reply-guide` fills it in for each client and offer set. It is built at the end of Phase 2 and rebuilt at the start of Phase 4 only when the launch set changed in Phase 3 (operator directive 2026-10-06, ruling `reply-guide`). The first one built from it was PropFuel's on 2026-10-06.

Part 1 holds the build rules. Part 2 is the template itself. Everything in Part 2 that isn't a `<<FILL: ...>>` instruction is kept word for word, apart from the swaps the rules name.

---

## Part 1: Build rules

### Who reads it, and the voice (ruling `reply-voice-client`)

- **The readers** are the client's founder and whoever answers the inbox for the client (often the agency's own people, never named). The guide is written so a smart person new to cold email can use it the first day.
- **Every reply, call, voicemail and text speaks as the client.** Use "we", "our team" and "I'm with <Client>". Never write "we work with <Client>". Never name the agency or any agency staff member, in a template or anywhere else in the guide.
- **No workspace leakage.** No file names, skill names, slash commands, ruling keys, tool or platform names, persona names (Aaron and the others), campaign slugs or offer ranks. Campaigns are named A, B, C... by their offer. The check in `reply_guide.py` enforces this.
- **Links count too.** A booking link whose URL carries the agency's name (for example `?agency=<agency>`) is a leak. Write `{{booking_link}}` in the guide, and flag the URL to the operator so the client can supply a neutral one.

### Inputs (read, never asked)

| Input | Where | Used for |
|---|---|---|
| The locked offers, Aaron's order, who each goes to, and each offer's `delivery_reply` and `details` | `lead-magnets.md`, `client-profile.yaml` `offer:` | One campaign section per public offer |
| Each offer's delivery type | the offer's `lead_magnet` / delivery mode | Which campaign block to use (below) |
| Held or internal offers (an offer the client must not see yet) | the client's `rulings.md` | The separate internal file, never the main guide |
| Public proof lines, with which clients may be named | `social-proof-bank.md` (`naming_ok`, public wording) | Question 9.6 only |
| Systems the client connects to, and whether pricing is public | `website-profile.md` | Questions 9.4 and 9.7 |
| Speed-to-lead target, booking link, demo length | the client's `rulings.md`, `run_state`, the Phase 2 handoff | Rules, section 11, the bracket table |
| Operator overrides of the launch set | the operator in chat, recorded in `rulings.md` | Added as `op-<slug>` campaigns |

### Picking the campaign block for each offer

| Offer delivery type | What a "yes" leads to | Block |
|---|---|---|
| **Booking** (a done-for-you service, a trial, a pilot, a free campaign the client runs: the call is how it gets delivered) | The client's booking link, then a call | Block B |
| **Asset** (a free draft, list, teardown or sample the team builds and sends) | "I'll send it over by {{delivery_day}}", then the delivery email | Block A |
| **Tool** (a calculator or self-serve tool) | The link to the tool | Block T |

### Where the wording comes from

- **The yes and delivery lines** are Aaron's `delivery_reply` from the offer call, put into the client's voice. The operator's voice ruling outranks his exact wording, so "the <Client> team, who run it" becomes "our team".
- **Every other line a prospect reads** comes from this template and gets one fresh `/ask-aaron` sub-agent pass during the build (`aaron-lane.md`, "New prospect-facing reply lines are his call too"). Tell him to write in the client's voice. Record the pass in the manifest (`aaron_pass`). A Phase 4 rebuild sends him only new or changed lines.
- **Numbers.** The only numbers allowed are the public proof lines in 9.6, written exactly as the client publishes them. Never quote reply rates, past campaign results or unpublished claims.
- **No cold copy in the guide.** Phase 2 has no cold copy yet. Describe each offer in plain words, and tell campaigns apart by their offer, never by a quoted email or a subject line. That way a skipped Phase 4 rebuild never leaves a stale quote behind.

### Outputs (all under `outbound/profiles/<slug>/`)

| File | What it is |
|---|---|
| `reply-guide.md` | The guide. The source of record |
| `exports/<Client>-Reply-Guide.pdf` | The PDF export. Standing exception to the plain-text rule (ruling `reply-guide`): every reply guide ships with one, rendered from the Markdown |
| `reply-guide-internal.md` | Only when held or internal offers exist. Same blocks, marked internal, **never rendered to PDF or forwarded** |
| `reply-guide.manifest.json` | Read by `reply_guide.py`. Records the launch set the guide covers, keyed `offer-<aaron_rank>@<segment>` (operator-added offers `op-<slug>@<segment>`), plus the forbidden terms, the booking link, the Aaron pass, the guide's hash and the date |

**Per-campaign reply files follow the guide.** Phase 4's `/lifecycle-copy` builds each campaign's `interested-reply.md` and `pre-call.md` from these lines. When the two disagree, the guide wins, and both are updated together.

---

## Part 2: The template

~~~~markdown
# <Client> Reply Guide

**What this is.** This guide is for whoever answers replies to <Client>'s outreach emails. For each kind of reply it gives the email to send and the next step to take. It covers <<FILL: the number in words>> campaigns.

**How to use it.** First work out which campaign the reply came from (section 3). Then find what the person said in the table in section 2 and open the matching reply. Fill in the parts in `{{curly brackets}}`. Read the full thread once, then send your reply on the same thread.

---

## 1. The basics

1. **Reply fast, then call.** Answer every interested reply within 5 minutes, then phone them straight away (section 11). That includes people who only said "send it". A reply that waits an hour is worth about half as much.
2. **You are writing as <Client>.** Say "we" and "our team", and sign with your first name.
3. **One person per thread.** Before you reply, check nobody else on the team has already answered.
4. **A reply ends the outreach for that person.** Never put someone who replied back into an email sequence.
5. **Only promise what's confirmed.** Never promise a result, a number, or a start date nobody has confirmed. "We confirm that with you on the call" is always a true answer.
6. **Promised a draft? Deliver it on time.** <<FILL: keep only when an asset offer exists. "N of the campaigns promise a free draft by the next business day. Only say yes to that date if someone on the team can build it.">>
7. **Use only the results in section 9.6.** Never quote any other number.
8. **"Stop" means stop, right away.** Remove anyone who asks to be removed straight away. Never argue and never ask why.
9. **Keep it short and plain.** No "Hi" or "Hope you're well" at the top. Get straight to the point.

**Words used in this guide**
<<FILL: 3 to 6 plain glosses for the client's terms (their buyer's database, their offer words), plus "Demo or setup call: a <length> call with our team.">>

---

## 2. What did they say? What do I do?

| They said | Send | Call them? | Then |
|---|---|---|---|
| "Yes", "sure", "send it", "sounds good" | The yes reply for their campaign | **Yes, within 5 minutes** | Mark as interested |
| "Send me info", "how does it work?" | The "what is it?" reply for their campaign | **Yes, within 5 minutes** | Mark as interested |
| "Let's talk", "what times work?" | 9.1 | **Yes, within 5 minutes** | Mark as interested |
| "Not me, talk to Jane" | 10.12 or 10.13 | No | Treat the colleague as a new interested lead |
| A question only | The matching answer in section 9 | Only if they ask | Mark as question |
| "Not now", "busy season", "later" | 10.6 | No | Mark as not now and set a check-in date. **Don't remove them.** |
| "Not interested", "we don't need this" | 10.14 | No | Remove from all outreach |
| "Unsubscribe", "stop", "remove me" | Nothing | No | Remove from all outreach (10.16) |
| Angry, rude, a complaint or a threat | 10.17 | No | Remove the person **and their whole organization**, then flag it to the team |
| Auto-reply, "I'm out until..." | Nothing | No | Note the return date (10.15) |
| Email bounced | Nothing | No | Remove the address |
| You can't tell what they mean | Nothing yet | | Ask a teammate before replying |

**"Remove from all outreach"** means stopping them in every <Client> campaign and adding them to the do-not-contact list, so they never get another email.

---

## 3. The campaigns

| Campaign | Who it went to | What we offered | What a "yes" leads to |
|---|---|---|---|
<<FILL: one row per public offer, lettered A, B, C... The offer in one plain sentence. Yes column: "A booking link for a setup call (section N)", "We send the draft by the next business day (section N)" or "The link to the tool (section N)".>>

**Check which campaign a reply is from before you answer.** <<FILL: how to tell them apart from the offer named in the first email. Warn about any two offers that read alike.>>

<<FILL: any segment wording swap, e.g. "For associations whose members are companies, write 'member companies' wherever a reply says 'members'.">>

**Where a shared reply says `{{offer}}`, fill in:**

| Campaign | `{{offer}}` |
|---|---|
<<FILL: one row per campaign. A noun phrase with no "the" and no "free", because the templates add "the" or "a free" around it.>>

---

<<FILL: sections 4 onward, one per campaign, using Block A, B or T below. Number them, and renumber 9 to 12 if the campaign count differs.>>

### Block B: booking campaign

## N. Campaign X: <Offer name>

**What we offered:** <<FILL: the offer in one plain sentence, in the prospect's terms.>>

### N.1 Yes
```
Great {{first_name}}, here's a link to grab a time with our team to <<FILL: what the call does, from Aaron's delivery_reply in the client's voice>>. {{booking_link}} It takes <<length>>, and <<FILL: the eligibility check his reply states, as "we confirm ...">>.

{{your_first_name}}
```

### N.2 "What is it?" or "How does it work?"
```
{{first_name}}, happy to. <<FILL: one or two sentences on what it is and what they get>>. It's free, so you can see it working <<FILL: on their own X>> before paying for anything.

Setup is one <<length>> call with our team. Here's a link to grab a time: {{booking_link}}

{{your_first_name}}
```

### N.3 Said yes, hasn't booked (3 days later)
Send this only if nothing new has come in on the thread.
```
{{first_name}}, just making sure the link came through. Once our team <<FILL: does the setup step>> on the call, we <<FILL: deliver it>> for you. Here it is again: {{booking_link}}

{{your_first_name}}
```

### N.4 Last nudge (7 days after the yes)
After this, stop. Mark them as not now and check in next quarter.
```
{{first_name}}, if the timing isn't right, no problem. The free <<offer>> is there whenever <<FILL: the trigger>> comes up. Just reply here and I'll set it up.

{{your_first_name}}
```

### Block A: asset campaign

## N. Campaign X: <Offer name>

**What we offered:** <<FILL: the offer in one plain sentence, and what it is built from>>.

### N.1 Yes
```
{{first_name}}, great. I'll put the draft together from <<FILL: the public source>> and send it over by {{delivery_day}}. Nothing needed from you.

{{your_first_name}}
```

### N.2 Yes, but the one input is missing
<<FILL: only when the asset needs one input the public source may lack.>> Send this instead of N.1.
```
{{first_name}}, great. One quick thing so the draft fits. <<FILL: the one question>>? I'll send it over within a business day of hearing back.

{{your_first_name}}
```

### N.3 Sending the draft (within one business day)
The delivery carries the draft and nothing else: no times and no booking link.
```
{{first_name}}, here's <<FILL: the asset, named>>: {{draft_link}}

It's built from <<FILL: the public source>>, so treat it as a sample. <<FILL: one line on the gap only we fill, in the client's voice>>.

I'm curious whether it <<FILL: fits how they actually work>>.

{{your_first_name}}
```

### N.4 "What is it?"
```
{{first_name}}, it's <<FILL: the asset in one sentence>>.

It's free and built from <<FILL: the public source>>. Would it be worth sending over?

{{your_first_name}}
```

### N.5 Draft sent, no reply (3 days later)
```
{{first_name}}, did you get a chance to look through the draft?

<<FILL: what the draft can't do on paper, and that it's the part we do>>.

Would it be worth seeing how in a <<length>> demo?

{{your_first_name}}
```

### N.6 Last nudge (7 days after sending the draft)
```
{{first_name}}, if the draft is useful as it stands, that's a good outcome, and it's yours to keep.

If <<FILL: seeing the real thing run>> would help at some point, just say so and I'll set it up.

{{your_first_name}}
```

### Block T: tool campaign

## N. Campaign X: <Tool name>

**What we offered:** <<FILL: the tool in one plain sentence.>>

### N.1 Yes
```
Great {{first_name}}, here's a link to the <<tool>>. {{tool_link}} Curious to get your take on it.

{{your_first_name}}
```
Still call them. If <<FILL: the related problem>> comes up on the call, offer <<FILL: the booking offer, when one exists>>.

---

## 9. Common questions (all campaigns)

Answer in one or two sentences. If they've already said yes, finish by confirming the next step (the booking link for a booking campaign, or "I'll send it over by {{delivery_day}}" for a draft).

### 9.1 "Let's talk" or "What times work?"
```
{{first_name}}, happy to set that up. Would {{time_1}} or {{time_2}} work for a <<length>> call with our team? If neither does, pick any time here: {{booking_link}}

{{your_first_name}}
```
If you promised a draft and haven't sent it yet, add: "The draft is still on its way by {{delivery_day}}."

### 9.2 "Who is this?"
```
{{first_name}}, fair question. I'm with <Client>. We <<FILL: what the client does, one plain sentence>>.

I reached out to offer you a free {{offer}}. Would that be worth sharing more?

{{your_first_name}}
```

### 9.3 "Why is it free?" or "What's the catch?"
<<FILL: the true free reason from the offer call. Never invent one. With none on record, use the line below.>>
```
{{first_name}}, no catch. It's free so you can see how it would work for you before paying for anything. If you like it, we can talk about doing more. If not, it's yours to keep.

{{your_first_name}}
```

### 9.4 "Does it work with our system?"
<<FILL: only when the client connects to the buyer's systems. Name only the systems the client publishes.>>

### 9.5 "Does this replace what we use?"
<<FILL: only when the client works alongside an existing system.>>

### 9.6 "Has this worked anywhere?"
These are the only results to quote. Use the one that matches the campaign.
<<FILL: one block per campaign, using only public proof lines whose client may be named, worded exactly as the client publishes them. A campaign with no matching proof gets the honest line: "honestly, our clearest result so far is with <the nearest case>. That's why it's free: you can see what <their X> says before paying for anything.">>

### 9.7 "How much does it cost?"
Never give a number.
```
{{first_name}}, the {{offer}} is free. Pricing for anything beyond that depends on <<FILL: what it depends on, only if public; otherwise "your setup">>, so we'd give you an exact quote on a call. Would {{time_1}} or {{time_2}} work? Or pick any time here: {{booking_link}}

{{your_first_name}}
```

### 9.8 "Do you need our data?" or "What about privacy?"
Never ask anyone to email or attach a data file.
<<FILL: one answer per delivery type. Asset: "nothing needed, the draft is built only from <public source>". Booking: what gets connected on the call and that they approve before anything goes out.>>

<<FILL: 9.9 onward, offer-specific questions where a real objection exists (for example "Will it tell us why everyone left?", or "How many do we need?" answered "we set that with you on the call").>>

---

## 10. Pushback and everything else (all campaigns)

### 10.1 "It's fine as it is" or "It's not a priority"
```
{{first_name}}, good to hear. The {{offer}} is still yours if it's useful, and it's free. Would that be worth sharing more?

{{your_first_name}}
```

### 10.2 "Our budget is set"
Mark as not now. Check back before their next budget cycle.
```
{{first_name}}, understood. The {{offer}} is free, so it doesn't need budget. When does planning for next year start? I'll check back before then.

{{your_first_name}}
```

### 10.3 "We're changing systems"
<<FILL: only when a system change blocks delivery.>> Mark as not now. Don't book a call or build a draft yet.
```
{{first_name}}, makes sense. It's easier to look at this once the new system is live. When are you expecting go-live? I'll check back then.

{{your_first_name}}
```

### 10.4 <<FILL: the client's most common "someone else owns this" objection>>

### 10.5 "We already do this" or "We use another tool"
Don't compare or argue. Ask what they do today.
```
{{first_name}}, good to know. Out of curiosity, what do <<FILL: their X>> get from you today, <<FILL: the generic version>> or <<FILL: the real thing>>?

{{your_first_name}}
```

### 10.6 "Not now" or "Reach out later"
Mark as not now. **Don't remove them.** Set a check-in for the time they name, or next quarter if they don't say.
```
{{first_name}}, no problem at all. The free {{offer}} is there whenever it's useful. When would be a better time to check back?

{{your_first_name}}
```

### 10.7 "I'd need to run it by my boss"
<<FILL: asset version "The draft is short and easy to forward as is. Would it help if I sent it now so you can pass it along?" and booking version "Happy for them to join that call.">>

### 10.8 "Someone already reached out about this"
```
{{first_name}}, thanks for saying so. If you're already talking with our team, there's nothing more needed. If not, happy to help.

{{your_first_name}}
```

### 10.9 <<FILL: one offer-specific objection, or drop it and renumber>>

### 10.10 Not a fit
<<FILL: the real eligibility criteria, in plain words.>>
```
{{first_name}}, one honest note: the {{offer}} is built for <<FILL: who it's for>>, and it may not fit how yours works. If you'd still like a look at what we do, here's a link for a <<length>> call with our team: {{booking_link}}

{{your_first_name}}
```

### 10.11 The free spots are full
<<FILL: only when the client caps free units.>> Never promise a date.
```
{{first_name}}, great to hear. We run a limited number of these each month and this month's are spoken for. Can I put you first in line and book a call for when the next ones open? {{booking_link}}

{{your_first_name}}
```

### 10.12 They name a colleague
```
Thanks, {{first_name}}. Would you mind copying {{colleague_first_name}} on this thread so I can send the details their way?

{{your_first_name}}
```

### 10.13 "Not me", with no name given
```
Thanks, {{first_name}}. Who looks after <<FILL: the area>> on your team?

{{your_first_name}}
```

### 10.14 Not interested
Remove them from all outreach.
```
{{first_name}}, understood. I won't email you about this again.

{{your_first_name}}
```

### 10.15 Out of office
**Send nothing.** Note the return date. If their emails paused, let them continue after they're back.

### 10.16 Unsubscribe, stop or remove me
**Send nothing.** Remove them from all outreach right away.

### 10.17 Angry or a complaint
Send this one line at most. Then remove the person and their whole organization, and flag it to the team. **If they mention a complaint, a regulator or a lawyer, send nothing** and flag it straight away.
```
{{first_name}}, sorry about that. I've taken you off our list, and you won't hear from us about this again.

{{your_first_name}}
```

---

## 11. The 5-minute phone call

**When:** within about 5 minutes of any interested reply, including a plain "send it". A promised draft still goes out on time whatever happens on the call.

**Before you dial:**
- Find their number in their reply or email signature.
- Pick two open times on the booking calendar, in their time zone.
- No number? Your email carries the ask.

**Opening**
> "Hi {{first_name}}, it's {{your_first_name}} from <Client>. You just replied to my email about a free {{offer}}. Have you got a minute?"

**Three quick questions**
<<FILL: Aaron's qualifying question for the leading offer first, then two about their system and size, worded for the buyer.>>

**Book it**
> "Our team has {{time_1}} or {{time_2}} for a <<length>> call. Does either work?"

Book it on the booking calendar with their email address, so the invite reaches them.

**No answer: leave a voicemail**
> "Hi {{first_name}}, it's {{your_first_name}} from <Client>. You replied to my email about a free {{offer}}. I'll text you two times for a quick call. Talk soon."

**Then send a text**
> "{{first_name}}, it's {{your_first_name}} from <Client>. You replied to my email about a free {{offer}}. Would {{time_1}} or {{time_2}} work for a <<length>> call? Or pick a time here: {{booking_link}}"

**Someone else picks up**
> "Hi, it's {{your_first_name}} from <Client>. {{first_name}} replied to an email of mine and I'm following up. Is now a good time, or when's best to catch them?"

---

## 12. Filling in the brackets

| Bracket | What goes there |
|---|---|
| `{{first_name}}` | Their first name, as they signed their reply |
| `{{your_first_name}}` | Your first name, as it appears on the email they replied to |
| `{{offer}}` | The offer from their campaign (table in section 3). The words around it already add "the" or "a free" |
| `{{booking_link}}` | <Client>'s booking link for these campaigns |
| `{{time_1}}`, `{{time_2}}` | Two open times on the booking calendar, in their time zone |
<<FILL: rows for any other bracket the guide uses ({{delivery_day}}, {{draft_link}}, {{tool_link}}, {{colleague_first_name}}). Every bracket used must have a row; the check enforces it.>>
~~~~
