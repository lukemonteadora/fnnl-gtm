# Reply Scoring Core (shared by the reply-scoring skill for whichever sending platform is locked)

Canonical, platform-agnostic core for reply scoring: the classification schema, the classification prompt, the reply-handling router, the suppression write-back, the shared `meeting_book_rate` definition, the speed-to-lead chain, and the unanswered-positives list with its response-latency audit. A per-platform reply-scoring skill owns **fetch mechanics and output formatting**; this file owns the parts that must stay **identical across platforms** so they never drift. Edit shared logic here, not in two places.

Route to the reply-scoring skill for the platform locked in `run_state.sending_platform`, if `/stack-setup` activated a pack that provides one (the Smartlead and EmailBison packs ship `/positive-reply-scoring` and `/emailbison-positive-reply-scoring`). If no pack is active, pull the replies from that platform's native surface (its API, its export, or the inbox itself) and apply everything below unchanged: the schema, prompt, router, and write-back are the same work regardless of where the replies came from.

**The metric:** `positive_reply_rate = (positive_interested + positive_soft + positive_referral) / total_sent`. Reply rate tells you if people are paying attention; positive reply rate tells you if they want what you're selling. A positive reply is not yet a meeting, so every report carries two meeting measures beside it: `meeting_book_rate` (defined below) and time-agreed replies per 1,000 first touches (`/experiment-design`, counted with `/campaign-strategy`'s magnet-inflation guard), which is the one that picks offer arms.

## Meeting book rate (shared definition)

(Aaron process alignment, operator directive 2026-09-22.) This is the one definition every skill and report uses; the others point here.

`meeting_book_rate` = meetings booked / positive replies (positive_interested + positive_soft + positive_referral), counting bookings from the client's booking calendar or CRM, phone-booked and form-booked included. The denominator is an assumption (it treats every positive class as bookable) and is labelled as one. Aaron self-reports about 25%, aiming for 30% (Sep 21).

```text
meeting_book_rate = meetings booked / (positive_interested + positive_soft + positive_referral)
```

- **Numerator: where the bookings come from.** Count them from the client's booking calendar or CRM when one is readable, otherwise from the operator's reported count, and say in the report which of the two the number came from. At the time of writing (2026-09-23) the stack contract's `crm` slot is not chosen and no calendar tool is recorded, so the operator's count is the likely source until one is. Never count bookings from reply threads alone: a meeting booked on the 5-minute call or through the qualification form leaves no trace in the email thread. If neither source exists, report the rate as "not measured" and say why.
- **Denominator:** the same three-class positive bucket as `positive_reply_rate`. Aaron's own denominator is his "interested responses", which he does not define, so using the whole positive bucket is an assumption, stated here so nobody reads it as his definition.
- **Benchmark:** Aaron self-reports about 25% (22 meetings from 83 interested responses), about 20% by the end of that week, and aims for 30% (Sep 21). All of his numbers are self-reported.
- **What it answers:** how well the reply machine (the reply, the call, the qualification step, the subsequence, the pre-call confirmation page) turns positives into meetings. Report it per offer arm too, but it never picks an arm: time-agreed replies per 1,000 first touches still does, because it measures demand per contact sent, not reply handling. When positives are healthy and `meeting_book_rate` sits well under Aaron's ~25%, fix the reply machine through `/lifecycle-copy` and the speed-to-lead chain below before blaming the offer.

## Classification schema

Every reply is classified into exactly one bucket. Classify only the **first** reply per lead — later messages are the conversation, not the scoring signal.

| Label | Meaning | Count as "positive"? |
|---|---|---|
| `positive_interested` | "Yes, tell me more" or booked a meeting | yes |
| `positive_soft` | "Send more info" / "reach out in Q3" / info request | yes |
| `positive_referral` | "Not me, but talk to X" | yes (referral is high-value) |
| `neutral_question` | Clarifying question, no commitment yet | no |
| `negative_notnow` | "Not right now, maybe later" | no |
| `negative_notfit` | "Not a fit" / "we don't need this" | no |
| `negative_hostile` | Angry reply, complaint, report, threat | no (track separately as a risk signal) |
| `unsubscribe` | Explicit opt-out | no |
| `ooo` | Out-of-office auto-reply | no (exclude from denominators) |
| `bounce` | Technical bounce / delivery failure | no (exclude from denominators) |
| `other` | Can't tell | no |

Positive reply rate counts only `positive_interested + positive_soft + positive_referral`. Exclude `ooo` and `bounce` from all denominators.

## Classification prompt

```text
Classify each reply as one of:
positive_interested, positive_soft, positive_referral,
neutral_question,
negative_notnow, negative_notfit, negative_hostile,
unsubscribe, ooo, bounce, other

For each reply, output: { lead_id, label, confidence: 0.0-1.0, one_line_reason }

Rules:
- OOO auto-replies ("I'm out of office") -> ooo
- Delivery failures / bounces -> bounce
- "Take me off your list", "unsubscribe", "STOP", "Remove me" -> unsubscribe
- "Not interested", "not a fit", "we don't need this" -> negative_notfit
- "Not right now, circle back in Q3" -> negative_notnow
- "Try [other person]" / "Who handles this?" naming another owner -> positive_referral
- "Send more info" / "Tell me more" -> positive_soft
- "Yes, let's book a call" / "what times work" -> positive_interested
- Insults, reports, legal threats -> negative_hostile
- If confidence < 0.7 -> other
```

For speed, fan out classification in batches of 20-30 via the Task tool (see `/personalization-subagent-pattern` for fan-out mechanics).

## Reply handling router

After classifying, route each reply class to its next action. This is where positive replies connect to the lifecycle copy that handles them.

| Reply class | Next action |
|---|---|
| `positive_interested` | Respond fast on-thread from the campaign's `interested-reply.md` category template (written before Start, Gate D), routed by intent and offer type and never with a blanket booking link: an asset request gets the delivery reply with no times, and a direct, trial or service yes or booking intent gets two specific times plus the calendar (`/lifecycle-copy`). On a direct, trial or service offer, call within about 5 minutes from its `## Call Script` (Speed to lead, below). Where the offer has an `offer.qualification` rule, run the disclosed qualification step. Not yet booked: enroll in the post-interest subsequence (`interested-reply.md` Email 2 onward). Booked: send `pre-call.md` (confirmation page, pre-call sequence, no-show email). If `interested-reply.md` or `pre-call.md` is missing, that is a Gate D breach: flag it and have `/lifecycle-copy` write it now. (Aaron process alignment, operator directive 2026-09-22; supersedes writing `interested-reply.md` only after a positive arrives.) |
| `positive_soft` ("send info" / "reach out in Q3") | Same route as `positive_interested`, from the matching category template; schedule "later" replies rather than dropping them. |
| `positive_referral` | Thank, ask for the intro, then treat the referred contact as a fresh warm lead. |
| `neutral_question` / no clear intent | One concise clarifying reply. Do not start a new sequence. |
| `negative_notnow` ("not right now, maybe later") | Acknowledge; do NOT suppress. Schedule a re-touch for the named timeframe (default: next quarter). |
| `negative_notfit` ("not a fit") | Acknowledge and close politely. Suppress from future sends to this contact. |
| `negative_hostile` / complaint | Stop immediately, suppress the contact and domain, and track as a risk signal for `/email-deliverability-audit`. |
| `unsubscribe` | Honor immediately and suppress. |
| `ooo` | Exclude from denominators; re-touch after the return date if still relevant. |

For no-reply prospects (never replied, so not in the report), the re-engagement copy is `followups.yaml` from `/lifecycle-copy`.

## Speed to lead (shared chain)

(Aaron process alignment, operator directive 2026-09-22.) Every interested reply on a direct, trial or service offer gets a human reply and a call within about 5 minutes (Aaron, Sep 14; Sep 21: "that 5-minute speed to lead"). The chain is platform-neutral and runs on whatever the stack contract has actually chosen for the locked `run_state.sending_platform`:

1. **Alert.** The locked sending platform's interested-reply (or positive-reply) webhook, where the platform offers one; the event names live in that platform's notes in `stack-contract.yaml`. Listen to its all-replies event as well where it has one, so a positive the platform did not label still raises the alert.
2. **Pre-draft.** Classify the reply (the schema above) and pre-draft the answer from the matching category template in the campaign's `interested-reply.md`, routed by intent and offer type as the router says. A person edits and approves it before it sends. Drafting happens in the inbox manager for the locked platform if `/stack-setup` activated a pack that provides one, otherwise in that platform's own reply inbox.
3. **Phone.** On a direct, trial or service offer, take the number from the replier's own reply or email signature first. Only when there is none, run the contact-enrichment slot's phone reveal on that one replier, where the stack contract declares one for that slot (phones are optional there), as a single lookup previewed through `/api-cost-governance` inside the run's standing budget. If no number turns up, the reply's two specific times carry the ask and the report says the call could not happen.
4. **Call.** The speed-to-lead owner (`run_state.speed_to_lead_owner`, also the `Speed-to-lead owner:` line in `interested-reply.md`) calls from `interested-reply.md`'s `## Call Script`: two specific slots, two or three prequalification questions, then the voicemail and the text fallback when nobody answers. Calling and texting compliance by jurisdiction is the operator's call; this file does not rule on it.
5. **Asset requests.** On a plain asset request, call timing follows the house reading of Aaron's unresolved ledger R20 in `/lifecycle-copy` (a house reading, not his ruling): deliver first and hold any call until the asset has been used, unless the replier asks to meet or asks about working together.

**The always-on webhook receiver does not exist yet.** Nothing in `scripts/` receives the sending platform's reply webhooks, and no always-on host runs one, so a webhook the platform documents is not a working alert. Until a receiver exists and has caught a real reply, the reply sweep runs several times a day during the campaign's sending hours (through the inbox manager for the locked platform if a pack provides one, otherwise that platform's own reply inbox or API; if neither exists, say so and read the inbox by hand), and every report states that the 5-minute call is a target, not yet a mechanism.

## Every unanswered positive, and the response-latency audit

(Aaron process alignment, operator directive 2026-09-22.) Every scoring run surfaces three things, and never cuts the first to a top-N list:

- **Every positive still unanswered:** each `positive_interested`, `positive_soft` and `positive_referral` with no human reply yet, time-agreed first, with its reply body and the minutes since it arrived. List all of them. Speed to lead is the whole game (Aaron, Sep 14 and Sep 21: every interested reply called within about 5 minutes).
- **The response-latency audit:** for every positive, the minutes from the reply's timestamp to the first human reply (from the thread) and, on a direct, trial or service offer, to the first call (from the call log, the CRM, or the speed-to-lead owner's own record). Report the median and the count inside 5 minutes, and list every positive whose first reply or call missed the target. This audit checks the speed-to-lead chain above; it is not the chain.
- **Positive but not yet booked:** confirm each one is in the post-interest subsequence (`interested-reply.md` Email 2 onward), and that a booking stopped it.

When these run (daily in a campaign's first week, then weekly) is owned by `/cold-email-weekly-rhythm`. An offer arm's kill or scale call waits for its read window in `/experiment-design`, never for a calendar date.

## Suppression write-back

The router says "suppress" for several classes. Make it concrete: append every `negative_notfit`, `negative_hostile`, `unsubscribe`, and `bounce` to the client suppression registry so future campaigns never re-contact them.

```text
profiles/<business-slug>/suppression-list.csv   (schema defined in /email-waterfall)
```

For each suppressed reply write: `email`, `company_domain`, `linkedin_url`, `company_name`, `reason` (the reply class; `bounce` for technical bounces), `source_campaign` (this campaign slug), `date_added`. For `negative_hostile`, also suppress the whole `company_domain`. Create the file if it does not exist. **Do NOT suppress** `negative_notnow` or `neutral_question` — those are re-touch-later, not do-not-contact.

The upload skills read `suppression-list.csv` at their List Gate / Suppression Gate, so every future campaign for this client inherits these suppressions.

**Per-platform push (done in the calling skill, not here).** The CSV above is the system's own record. Most sending platforms also keep their own suppression surface, and that one has to be written too or the next campaign on that platform will happily re-contact the person.

- **Account-wide blocklist.** If the platform has a blocklist that spans the whole account rather than a single campaign, push the same contacts to it, so they are blocked across every campaign there. (With the Smartlead pack active that call is `mcp__smartlead__smartlead_add_lead_to_global_blocklist`.)
- **Unsubscribes.** Confirm the platform is honoring opt-outs on its own side as well (EmailBison exposes `can_unsubscribe` / opt-out, for example).
- If the locked platform has neither surface, the CSV is the only suppression record. Say that plainly in the report rather than implying platform-level coverage that does not exist.
