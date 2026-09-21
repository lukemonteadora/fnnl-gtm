# Archived: personalization-subagent-pattern, Pre-Written Email Copy Architecture: the full-body sub-agent prompt and its quality-control checklist

- **Source file:** `.claude/skills/personalization-subagent-pattern/SKILL.md`
- **Section:** Pre-Written Email Copy Architecture: the full-body sub-agent prompt and its quality-control checklist
- **Archived:** 2026-09-21 (operator-approved Aaron alignment)
- **Reason:** it wrote a light per-contact variation of the offer for every row (per-contact decision logic, data-driven relevancy, signal discipline) and baked a greeting in front of the offer, which contradicts B13 (one shared body per slice; ledger R13 supersedes per-contact insert stacking) and B1 (no greeting, doctrine §9).

Replaced in place by the fill-only shared-body prompt and its checklist, with a pointer to this file in the section intro. The original text, verbatim:

## The full-body sub-agent prompt

> ```
> You are writing one cold email body per lead for [Campaign Name].
>
> CAMPAIGN CONTEXT (same for every lead):
> - Target ICP: [role, company type, pain segment]
> - Offer and framing: [what you offer; MQL or SQL framing]
> - Proof: [one peer-company outcome; describe company type and result, do not name the company]
> - Risk reversal: [the guarantee or no-commitment framing]
> - Client capabilities (the ONLY claims you may make about us): [bullet list of the client's real, deliverable features, integrations, tools, and outcomes, from client-profile.yaml + offer-intelligence.md + the locked offer]. Do not state anything about what the client does or offers that is not on this list.
> - Variant: [A = primary pain angle | B = alternative pain angle]
> - Framework A offer sentence: [the approved specific free deliverable or offer, stated first]
> - Framework A workload split: [3 to 4 real tasks we will do; one minimal action the prospect must take]
> - CTA for THIS slot: [Email 1 must use the approved single soft permission question and nothing else; later follow-ups use the exact CTA assigned upstream by /campaign-copywriting]. Do not invent a lead magnet or a second question.
>
> CONTACT DATA PER LEAD (read the WHOLE row, not a fixed subset):
> You are given the contact's ENTIRE data point set — every contact-level column AND every company-level column on their row (the `co_*` company signals joined onto the contact). Common ones: first_name, company_name, job_title, seniority, function, department, tenure/new-in-seat, location, linkedin_post_hook, campaign_reason, signal_field, company_description, plus any collected `co_*` company signal (sold-to vertical, size, tech, hiring, funding/why-now, pricing, etc.) and any other column present. Read all of them. Do not assume the list is only the fields named here — scan whatever columns the row actually carries.
>
> PERSONALIZATION DECISION LOGIC (per lead):
> Check each source in order. Use the first that holds a specific, usable value AND connects directly to the email's core pain angle. Skip any data point with no logical bridge to the email's operational context, even if available.
> 1. linkedin_post_hook, only if the post topic connects to the email's operational angle
> 2. campaign_reason, if it carries a specific qualifying detail tied to the email's pain angle
> 3. signal_field, if it carries a specific data point that connects to the email's operational context
> 4. company_description, for an industry or role-based angle that leads into the pain
> 5. If none pass, write the fallback general copy using the fallback opener above, into the same column.
>
> DATA-DRIVEN RELEVANCY (light touch; the offer NEVER changes):
> The offer / lead magnet is IDENTICAL for every contact in this campaign. Do NOT change WHAT is offered — only make small improvements to HOW it is phrased for THIS contact, using whatever is genuinely relevant in their full data set (role/seniority/function is ONE input among many, never the whole scheme — also weigh their tenure, department, location, the company's sold-to vertical, size, tech, hiring, why-now, and any other column on the row). The goal is a LITTLE lift in relevancy IF the data offers any — not a fancy bespoke email.
> - Read the whole row. When a data point genuinely bears on the email's pain angle, let it shape the phrasing: which proof point you pick, which stat, where the pain emphasis lands, the word choice. A different role or a different company signal will legitimately pull the framing in a different direction.
> - Keep the SAME offer, the SAME risk reversal, and the SAME CTA deliverable. Keep the same core structure. The per-contact version stays close to the shared offer-led copy; you are nudging relevancy, not rewriting the email.
> - If nothing in the row adds real relevancy, write the shared / fallback copy into the column unchanged. NEVER manufacture a personalization the data does not support, and never stretch a weak data point into a forced hook. No relevant signal means keep it clean and general — that is the correct output, not a failure.
>
> NO DUMB PERSONALIZATION (hard):
> Use the data to inform the ANGLE, never to name the data back at the prospect. NEVER mention the contact's job title or role in the copy ("As CTO, you…", "In your role as Head of Ops…", "for a Founder like you") — this is banned. NEVER echo a raw data field as surface mail-merge ("I see you're in SaaS", "noticed you're based in Berlin", "as a 200-person company"). The prospect should feel the email is relevant, not that a field was pasted in. Always use the IMPLICATION of the data point, never the data point itself (see OPENER DISCIPLINE below) — if a line only works because you named a fact about them, delete it. A line that would read as a mail-merge if the field changed is dumb personalization and fails.
>
> SUBJECT LINE (shared static):
> Email 1 uses ONE shared subject set upstream on the sending-tool step. It must contain 2 to 4 lowercase words and exactly one merge token. Do not return any subject field per lead. Follow-ups inherit the thread.
>
> EMAIL 1 STRUCTURE TO WRITE:
> Sentence 1 opens with the approved specific offer. Do not put a hook, observation, pain setup, proof block, homepage summary, or self-introduction before it.
> Sentence 2 is the mandatory parenthetical workload split: `(We'd [task 1], [task 2], and [task 3]; you'd only [minimal action].)` Add a fourth sender task only when it is real and the body still fits the word cap.
> Sentence 3 is the only question and the final sentence: `Would that be worth hearing more?` Use the exact approved soft permission wording when the campaign has locked a truthful equivalent.
> The complete body, including greeting and optional P.S., must be 25 to 35 words. Optional proof belongs in a declarative P.S. only when it is true, directly supports the offer, and still fits the same cap. The P.S. is separate from the 2 to 3 main-body sentence count and cannot contain a question. Do not use `Just reply "Yes"` in Email 1.
>
> FOLLOW-UP STRUCTURE:
> Email 2 and optional Email 3 stay in the same thread. Use the follow-up structure and assigned CTA from `/campaign-copywriting`; do not reapply the 25 to 35 word Framework A skeleton to them.
>
> SIGNAL DISCIPLINE (signal, not observation). Scope corrected 2026-07-17: this used to read "apply to Line 1", which assumed the opener carried the signal. Line 1 is now OFFER-LED and carries no signal (Hard Rule 19), so apply this test to ANY line that states a signal fact, wherever it sits in the body. The test itself is unchanged and every ban below is in force.
> Start from the IMPLICATION of the data point, not the data point itself. If a line describes what you saw, noticed, or came across, it is an observation, not a signal line. Rewrite from what the signal MEANS for this prospect. The prospect does not care that you found the information; they care what it changes for them. Avoid all six failure modes (each shown wrong -> right, and read each for the TEST, not for the opener shape: every "right" line below sits in the body, never in Line 1):
> 1. Plain observation. "I saw [Company] is hiring SDRs." -> "[Company] has [N] SDR roles open right now. That usually means the pipeline engine is being built from scratch."
> 2. Complimenting the signal. "Congrats on the Series B, really impressive growth." -> "Series B at [Company]'s stage usually means the next 90 days are all hiring and systems. Is GTM infrastructure on the list?"
> 3. Naming the fact, no implication. "I noticed [Company] has a Head of Marketing role open." -> "Head of Marketing open for [X] days means someone is running the function without a clear owner. Is that falling on the founder right now?"
> 4. Generic pain before the signal. "Most companies at your stage struggle to hit pipeline targets. I saw you have a VP Sales role open." -> "VP Sales role open for [X] days is a long time to run a sales org without a head. Who owns quota right now?"
> 5. Signal buried behind a pitch. "We help B2B companies scale outbound. I noticed you're hiring an SDR." -> "[N] SDR roles open at [Company]. That volume usually means the current list-building process cannot keep up with demand."
> 6. Signal as flattery bridge. "[Company] was named one of the fastest-growing in [region], really impressive, made me think you might have scaling challenges we could help with." -> "[Company] scaled to [headcount] in [timeframe]. Teams that grow that fast usually hit the same three operational walls in the same order. Is [specific wall] one of them?"
> (Full bank: /campaign-copywriting Signal-First Anti-Patterns.)
>
> HARD CONSTRAINTS:
> - Plain text only. No bullets, bold, links, or HTML styling. Blank lines between blocks are required and are NOT "formatting" in this sense.
> - For Email 1, use the compact 2 to 3 sentence Framework A layout: offer sentence, parenthetical workload split, then the single soft permission question. Blank lines between these short units are allowed. Follow-ups use their approved same-thread layout.
> - Start the body with the greeting and the contact's first name baked in (for example `Tommi, ...`) so the sending tool needs no separate first-name token. After `{first_name},` the next word is lowercase unless it is a proper noun (company, product, brand, acronym) — the greeting and opener are one sentence. WRONG: `Tommi, Each month ...`. RIGHT: `Tommi, each month ...`. Proper-noun opener keeps its capital: `Tommi, Acme just migrated ...`.
> - Grammar must be clean and every sentence must read naturally aloud. No awkward constructions, run-ons, comma splices, or dropped connective words. Keep the "where", "that", and articles a sentence needs to parse on the first read.
> - No em dashes anywhere.
> - No fake warmth or warmup. NEVER write "hope you're well"/"hope this finds you well", "just checking in"/"following up"/"following up on my last"/"circling back"/"touching base"/"bumping this", "I wanted to reach out"/"connect", unearned flattery ("big fan of what you're building"), any phrase implying shared history, or any warmup sentence before the first relevant line. Personality lives INSIDE the first relevant line (a point of view plus spoken rhythm), never in a preamble.
> - Said-out-loud test: the body must sound like a busy, competent person talking to a peer, never a brochure or textbook. Do not add a human-framing preamble before the Email 1 offer. Follow-ups may imply the prior touch without using fake-follow-up phrases.
> - Capability truth. Only make claims about the client that appear in the client capabilities list above. Never invent a feature, integration, tool, metric, or outcome the client cannot deliver. If the data to support a claim is not provided, leave it out. This is the at-scale version of the offer's deliverable gate: a fabricated capability produces replies the client's sales team cannot fulfill.
> - No dumb personalization (see DATA-DRIVEN RELEVANCY above). The data informs the angle, never gets named back at the prospect. NEVER mention the contact's job title or role in the copy, and never echo a raw data field as surface mail-merge. Use the implication of a data point, never the data point itself. If a line only works because you named a fact about them, cut it. Light touch: when the row adds no real relevancy, ship the clean shared copy — do not manufacture a hook.
> - The BODY cell is body only, with no subject text, sign-off, or signature inside it. The signature is appended in the sending tool. Email 1 uses one shared static subject on the step, never a per-contact subject field.
> - Email 1 ends with exactly one question: the approved soft permission close. It cannot use a statement-only opt-in or contain any earlier question. Email 2 and optional Email 3 use the approved same-thread follow-up CTAs.
> - Write 1-to-1: first-person singular ("I"), one person to one person. Use "we"/"us" only for a genuine team or company fact that cannot honestly be said as "I". Frame the client's value around the prospect ("you're one of the few who..."), not "we help teams like you." Do not over-apply into stilted copy.
> - Email 1 is always 25 to 35 words, including the greeting and optional P.S. There is no longer personalization exception. Follow-ups stay under the separate cap set by `/campaign-copywriting`.
> - Output the complete email body only.
>
> LEADS:
> <JSON array>
>
> RETURN:
> A JSON array with the same lead_ids and one field named for the slot you are writing (`email_1_a`, `email_1_b`, `email_2`, or optional `email_3`). Return no subject field. The shared Framework A subject is set once on the sending-tool step. Email 2 and optional Email 3 are shorter replies that continue the same thread. Save to /tmp/prewrite-<batch-id>.json and print "DONE".
> ```

## Quality control before export

> After the columns are populated, run this before exporting to the sending tool:
> - [ ] Sample 10 random rows of `email_1_a`. Does each body open directly with the same approved offer?
> - [ ] Does each Email 1 body contain 25 to 35 words, 2 to 3 main-body sentences, exactly one question, the mandatory workload parenthetical, and the soft permission close as its final main-body sentence? If present, is the P.S. declarative and included in the word count?
> - [ ] Is the single shared Email 1 subject 2 to 4 lowercase words with exactly one merge token? Confirm there are no per-contact subject columns.
> - [ ] No dumb personalization: in the sample, does ANY body or subject name the contact's job title/role ("As CTO…", "for a Founder like you") or echo a raw data field as surface mail-merge ("I see you're in SaaS", "based in Berlin")? Any such row fails — the data must inform the angle via its implication, never be named back. Fix the prompt and regenerate.
> - [ ] Light touch, not forced: are the per-contact bodies still close to the shared offer-led copy (a relevancy nudge, not a bespoke rewrite), and did rows with no real relevancy signal get the clean shared/fallback copy rather than a manufactured hook?
> - [ ] In that sample, does any personalization insert a hook, signal, observation, or pain setup before the Email 1 offer? Any such row fails.
> - [ ] Find rows where all personalization fields were empty or irrelevant. Did they get the clean fallback Framework A body in the same column?
> - [ ] Is every body written 1-to-1 (first-person "I"; "we/us" only for a genuine team/company fact)?
> - [ ] Does every Email 1 use the compact offer, parenthetical workload split, and soft-question structure without extra blocks?
> - [ ] After the `{first_name},` greeting, is the next word lowercase unless it is a proper noun? (no `Name, Each ...` mid-sentence capital — check every `email_*` column, since the greeting is baked in)
> - [ ] Zero fake-familiarity/warmup phrases in any column ("hope you're well," "just checking in," "following up on my last," "circling back," "touching base," "bumping this," "I wanted to reach out/connect," unearned flattery), and no warmup before the first relevant line?
> - [ ] Does every body pass the said-out-loud test? Do Email 2 and optional Email 3 imply the prior touch without using fake-follow-up phrasing?
> - [ ] Does Email 1 end with its one assigned soft permission question and no other question or statement-only opt-in? Do follow-ups use their assigned same-thread CTAs?
> - [ ] Offer honesty: no invented offer, workload step, proof claim, or lead magnet in any row.
> - [ ] Does every body read naturally aloud, with clean grammar and no dropped connective words ("where", "that", articles)?
> - [ ] Does every claim about the client's product map to a real, provided capability? No invented features, integrations, tools, or results the client cannot deliver. Spot-check the proof line and any "we do X" claim against the client capabilities list.
> - [ ] Any blank `email_1_a` rows? A blank means the generation step errored. Investigate. Do not send blank rows.
> - [ ] Do `email_1_a` and `email_1_b` read as genuinely different angles, not light tweaks?
> - [ ] Any em dashes in any row? Fix the prompt and regenerate.
> - [ ] Any signature or sign-off baked into a body column? Strip it. The signature belongs on the sending-tool step only.
> - [ ] Every Email 1 row passes `outreach-copy-framework.md`, then every row passes `spam-word-checker.md` and `cold-email-copy-best-practices.md`.
