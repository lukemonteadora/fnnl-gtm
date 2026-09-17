# Reply Scoring Core (shared by the reply-scoring skill for whichever sending platform is locked)

Canonical, platform-agnostic core for reply scoring: the classification schema, the classification prompt, the reply-handling router, and the suppression write-back. A per-platform reply-scoring skill owns **fetch mechanics and output formatting**; this file owns the parts that must stay **identical across platforms** so they never drift. Edit shared logic here, not in two places.

Route to the reply-scoring skill for the platform locked in `run_state.sending_platform`, if `/stack-setup` activated a pack that provides one (the Smartlead and EmailBison packs ship `/positive-reply-scoring` and `/emailbison-positive-reply-scoring`). If no pack is active, pull the replies from that platform's native surface (its API, its export, or the inbox itself) and apply everything below unchanged: the schema, prompt, router, and write-back are the same work regardless of where the replies came from.

**The metric:** `positive_reply_rate = (positive_interested + positive_soft + positive_referral) / total_sent`. Reply rate tells you if people are paying attention; positive reply rate tells you if they want what you're selling.

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
| `positive_interested` | Respond fast on-thread. If no interested-reply flow exists for this campaign, run `/lifecycle-copy` to write `interested-reply.md`. Once a call is booked, run `/lifecycle-copy` for the `pre-call.md` nurture + no-show flow. |
| `positive_soft` ("send info" / "reach out in Q3") | Use the interested-reply flow from `/lifecycle-copy`; schedule "later" replies rather than dropping them. |
| `positive_referral` | Thank, ask for the intro, then treat the referred contact as a fresh warm lead. |
| `neutral_question` / no clear intent | One concise clarifying reply. Do not start a new sequence. |
| `negative_notnow` ("not right now, maybe later") | Acknowledge; do NOT suppress. Schedule a re-touch for the named timeframe (default: next quarter). |
| `negative_notfit` ("not a fit") | Acknowledge and close politely. Suppress from future sends to this contact. |
| `negative_hostile` / complaint | Stop immediately, suppress the contact and domain, and track as a risk signal for `/email-deliverability-audit`. |
| `unsubscribe` | Honor immediately and suppress. |
| `ooo` | Exclude from denominators; re-touch after the return date if still relevant. |

For no-reply prospects (never replied, so not in the report), the re-engagement copy is `followups.yaml` from `/lifecycle-copy`.

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
