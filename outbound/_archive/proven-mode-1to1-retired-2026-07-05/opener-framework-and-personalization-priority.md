# Archived: Opener Framework (Email 1 and Email 3), per-contact personalization priority order

**Archived from `campaign-copywriting.md` on 2026-09-18.** This content was retired in place on 2026-07-05 (the proven-mode retirement) but left fully quoted in the live skill file instead of being moved here, which is what this file's own archival convention calls for. It is preserved verbatim below for history. **Do not use any of this to generate live copy.** Current doctrine: the offer-led opener (Hard Rule 19), shared across the whole campaign or slice (first name plus company only). Per-contact copy personalization is retired (former Hard Rule 34).

Two real problems lived in this block, which is why it was pulled rather than left with another disclaimer bolted on:

1. **"Personalization priority order for the opener question" read as a live, actionable instruction** for generating a per-contact Line 1 (checking a LinkedIn post hook, campaign reason slice, enrichment signal, or company description, in order) even though it sat under a section whose own header said it was retired. A skim or a search landing directly on that subsection would not see the retirement notice several screens above it.
2. **The worked examples under "What a complete Email 1 looks like after this change"** included an ~85-word "Right" version and a "question-first variant," both of which violate the current 25-to-35-word Framework A cap, sitting in the file as if they were still valid references.

---

## Opener Framework (Email 1 and Email 3)

**The Question-First / diagnostic-mirror opener framework is RETIRED (2026-07-05, proven-mode retirement).** Every new-thread email now opens with an OFFER-LED opener that leads with the offer itself (the dream outcome made specific plus the risk reversal), per the Offer-First Copy Standard and Hard Rule 19. The opener is shared, filled only with `{{first_name}}` / `{{company}}`; there is no per-contact opener generation and no personalization-source priority order anymore. The sub-rules below are retained only as retired reference and no longer apply.

### Revised structure for Email 1 and Email 3

Line 1: Opener, an OFFER-LED opener that leads with the offer itself (the dream outcome made specific plus the risk reversal). Never a warmup or a self-introduction. (The question-first / diagnostic-mirror alternatives here are retired.)
Line 2: Signal or Operational Context (the diagnostic, per the Signal-First Opener Rule). In the conversational register this can extend across a couple of short blocks, as long as every line is genuine, prospect-specific substance (see Length Follows Personalization Density in `cold-email-copy-best-practices.md`).
Line 3: Outcome-Based Proof (one peer company result; respect the proof-relevance hierarchy in Step 1).
Line 4: CTA, one soft permission question, and the only question in Email 1. The statement-only `Just reply "Yes"...` opt-in is not permitted in the initial cold touch.

### Personalization relevance rule

Before selecting a personalization source for Line 1, apply this test: does this data point connect directly to the email's core pain angle? If the email is about billing reconciliation, a LinkedIn post about company culture is not a valid source, even if it is the freshest data available. The personalization must give the prospect a reason to keep reading Line 2, which means it must logically lead into Line 2. If the data point has no bridge to the email's operational context, skip it and move to the next source. If no relevant data point exists across all sources, the generation step writes the fallback general copy for that contact into the same column (no separate fallback column). A random hook that does not connect to the email goal is worse than the fallback.

### Personalization priority order for the opener question

When generating Line 1 in your enrichment and copy generation layer (in this repo that is `/personalization-subagent-pattern`'s parallel Task sub-agents; equivalently an external enrichment platform's AI columns, a Claude Code CSV script, or any other tool), check these sources in order. Use the first one that holds a usable, specific value AND passes the relevance test.

1. LinkedIn post hook (most recent post within 30 days, only if the topic connects to the email's operational pain angle)
2. Campaign reason slice (why this specific contact was pulled into this campaign: the qualifying signal or segment logic)
3. Enrichment signal (job posting, funding round, tech stack change, headcount shift from your enrichment tool, scraper, or manual research column)
4. Company description (what the company does and who they serve; use for an industry or role-based angle)
5. Fallback branch (if none yield a relevant, specific value, write the fallback general copy into the same column)

### Opener question templates by source

Each template notes which angles it supports. Do not use a template on an email whose core angle it does not support. None of these use a banned opener ("quick question", "I noticed", "I saw that", "checking in" are all banned by `spam-word-checker.md`).

From LinkedIn post (only if the post topic connects to the email's pain angle): "{{first_name}}, your post on [topic that connects to the email's operational angle] got me thinking. Is [related operational challenge from the email] something your team is actively working on right now?"

From campaign reason slice: "{{first_name}}, is [specific operational pain tied to why they were targeted, the same pain the email addresses] still something your team handles manually?"

From funding signal (when the email angle is about scaling, capacity, or system strain post-growth): "{{first_name}}, with the [round] closed, has [the specific function the email is about] been a priority in the scale plan, or is that still on the backlog?"

From tech stack signal (when the email angle connects to that tool or its workflow): "{{first_name}}, are you still running [Tool] for [process the email is about], or have you moved off it?"

From company description (no specific signal): "{{first_name}}, for [company type] at your stage, is [core operational friction the email is about] still something your team owns internally?"

Fallback (no usable relevant personalization data; output into the same column as personalized rows): "{{first_name}}, one thing I keep seeing with [segment]: [general operational pain question that is true for the whole ICP segment, matches the email's core angle, and needs nothing specific about this contact]?"

### What a complete Email 1 looks like after this change

**Retired reference:** the examples below predate Framework A and must not be used as sendable Email 1 copy. The live Email 1 is 25 to 35 words, with 2 to 3 main-body sentences and exactly 1 question, the offer first, and the workload split in parentheses.

Wrong (one dense block, over-compressed grammar, hard to scan):

```text
{{first_name}}, smart meters and dynamic tariffs mean consumption changes fast, but the path from meter read to the charge still leans on manual steps built for flat rates. Small rating errors there are easy to miss and add up across a full year. Most finance leaders only see them once a customer disputes the charge. We mapped the one or two spots energy retailers most often lose revenue in that meter-to-charge handoff. Can I send it over?
```

Right (short blocks separated by blank lines, clean grammar, about 85 words):

```text
{{first_name}}, smart meters and dynamic tariffs make consumption move fast, but the path from meter read to final charge still runs on manual steps built for flat rates.

Small rating errors there are easy to miss, and they add up over a full year. Most finance leaders only catch them once a customer disputes a charge.

We mapped the one or two places where energy retailers most often lose revenue in that meter-to-charge handoff. Can I send it over?
```

What changed in the "right" version: three blocks with a blank line between each, the missing "where" restored ("the places where energy retailers lose revenue"), smoother verbs, and about 80 words instead of being squeezed under 75. The opener can also be a question-first opener (see Revised structure above); the block layout, clean grammar, and length range apply either way.

Question-first variants, same block layout (each lands in `email_1_a`, body only, no signature):

```text
{{first_name}}, is the gap between service start and the first accurate charge still a manual step for your team?

At a lot of Nordic energy retailers that window runs into weeks, because consumption, the customer record, and the rating step are all reconciled by hand.

[Company] cut it to same-day by [mechanism]. Worth seeing how they did it, or are you focused on other parts of the stack right now?
```

The fallback example is retired with the old length model. Any live fallback must use the same 25-to-35-word Framework A structure and append the signature only in the sending tool.
