# Social Proof + Trigger Bank: procedure detail, worked example, and export

Reference doc read by `/social-proof-bank`. The skill file holds the operating logic; this holds the heavier material: a filled worked example so the operator sees what "good" looks like, the recipe for synthesizing the copy-ready lines, and the client-facing xlsx export. The client-fill **Google Sheet** template (with worked examples as a guide) and the ready email/Slack outreach messages live in the sibling `social-proof-bank-client-fill-template.md`. Everything here is **client- and industry-agnostic** — the worked example is a digital agency for concreteness only; the same columns and trigger categories fit a SaaS vendor, manufacturer, healthcare provider, local-services business, ecommerce brand, or professional-services firm (`service_line` = whatever this client sells). Doctrine: memory `social-proof-bank-doctrine`.

The one-line idea: **gather the client's real proof and real timing signals ourselves first, map them to copy-ready form, and only ask the client for the raw facts we genuinely can't find - never for the copy.**

---

## Why the bank exists (the problem it removes)

Without it, two things go wrong every campaign:

1. The copywriter re-hunts the client's case studies and numbers from scratch for each campaign, and often can't find the segment-matched one, so the email falls back to a weaker generic proof line or none.
2. When the angle needs a named client or an exact number that isn't on file, the copy either goes hollow ("a leading firm", "significant results") or invents one - a hard-rule violation - or the whole slice stalls at copy time waiting on the client.

The bank fixes both by doing the gathering once, up front, mapped to the segments, in copy-ready form. It is the populated, per-client instance of the general frameworks the copy skills already carry (`/campaign-strategy`'s Signal-Driven Slice Library, `/campaign-copywriting`'s Signal Angle Library and Proof-Asset Gate) - it feeds them, it doesn't restate them.

---

## The two banks, and where each row comes from

### Bank 1 - Case Studies (proof)

One row per **ICP segment x service line**. This is the client's real results, mapped to who we're targeting and what the client actually delivers. The example workbooks split one client into two service divisions (Commerce, Performance) and give one row per client-engagement; generalize that to one row per segment x service line so the copywriter can always find a segment-matched proof.

Raw facts come from (in order): the intake `proof:` block -> onboarding-call notes -> `offer-intelligence.md` -> the client's own case-study / customers pages -> voicenotes. The client is asked (bank-mode form) only for the raw facts still blank after all of that.

### Bank 2 - Trigger & Angle bank (why-now -> message)

One row per timing signal that creates a reason to reach out, written as an angle. Two kinds:

- **Data-backed (`data_backed = y`)** - the signal maps to a collectable TAM or contact column. Fill `canonical_column` with the EXACT `/data-point-discovery` name so it never forks the vocabulary. These are the client-specific, populated version of the Signal-Driven Slice Library / Signal Angle Library rows, and they feed those libraries directly. Examples: `new_sales_leader_90d`, `contact_new_in_seat`, `sells_to_vertical`, `running_meta_ads`, `hiring_roles` + `jd_pain_language`, `funded_last_90d`, `sells_to_customer_size`.
- **Message-only (`data_backed = n`)** - a real reason to reach out that never becomes a TAM column, so it's the NEW value this bank adds beyond the data catalog. Events / webinars, macro or regulatory shifts, seasonal / budget-flush timing, competitor moves, a prospect's public LinkedIn post, competitor-user signals. Name each row's `acquisition` (manual / social listening / a per-campaign research pull) so `/campaign-strategy` knows it isn't a free TAM slice.

---

## Recipe: synthesizing the two copy-ready lines (we do this, never the client)

### The `one_liner` (copy-ready proof sentence)

A single sentence a skeptical prospect would find credible, built only on real facts. Structure that works (from the example): **{what we did for a named client} - {the mechanism} - {the result with its real number}.**

- Worked from a real row: facts = client "Sweet Squared", service "BigCommerce B2B replatform + NetSuite integration", result "24% online revenue, 119% account creations, Jan 25 - Jan 26".
- Synthesized one-liner: `We replatformed Sweet Squared to BigCommerce B2B with full NetSuite integration, syncing customers, products, pricing and orders, and grew their online revenue 24% and account creations 119% in the first year.`
- QA it: no em dash, no colon-as-runway, no comma-wrapped descriptor, real defensible number, named client allowed. Passes.

### The `poke_the_bear` (diagnostic-mirror question)

A short question that reflects the prospect's own likely situation or their buyers' real pain back to them, so it drops straight into an Email 1 / Email 3 opener (the conversational diagnostic-mirror register). It is NOT "want to see our case study?" - it names the tension the proof resolves and asks whether it's live for them.

- Worked from the same proof (B2B replatform, self-serve ordering): `When a B2B buyer wants to reorder at 9pm, can they do it themselves on your site, or does it still route through a rep and a spreadsheet?`
- Worked from a why-now trigger (new C-suite hire): `Stepping into the role, are you finding the outbound infrastructure you inherited is set up the way you'd actually build it?`
- QA it: leads with the implication, no observational "I noticed / I saw", no warmup, no surveillance recital of their data. Passes, and it's a ready opener.

Every synthesized line runs the Copy QA Gate (`spam-word-checker.md` + `cold-email-copy-best-practices.md`) before it is written to the bank. A line that can't pass isn't written - drop to a broader angle the real proof supports, or leave the row a gap and request the fact.

---

## Worked example (illustration - the shape of a filled bank)

A digital-agency client (mirrors the example workbooks; illustration only - generate real rows from the actual client):

### Bank 1 - Case Studies

| icp_segment | service_line | territory | result | timeframe | named_client | naming_ok | one_liner | poke_the_bear | proof_status | source |
|---|---|---|---|---|---|---|---|---|---|---|
| B2B Beauty / Professional Hair | Replatforming, BigCommerce B2B | UK & Ireland | 24% online revenue, 119% account creations | Jan 25 - Jan 26 | Sweet Squared | y | We replatformed Sweet Squared to BigCommerce B2B with full NetSuite integration and grew their online revenue 24% and account creations 119% in the first year. | When a trade buyer wants to reorder at 9pm, can they self-serve on your site, or does it still route through a rep? | on_file | website |
| B2B Wines & Spirits | UX, Development, BigCommerce B2B | UK | 911% online revenue, 40% of orders now out-of-hours | From Mar 2025 | Inverarity Morton | y | We rebuilt Inverarity Morton's B2B experience, fixed the conversion blockers, and grew online revenue 911% from March 2025 with 40% of orders now placed out of hours. | How much of your trade revenue is stuck behind office hours because ordering still runs through your team? | on_file | website |
| Specialist Retail (Golf) | SEO, PPC, Paid Social | UK | 41% shopping revenue, 47% organic sessions | Ongoing | American Golf | y | We took full ownership of American Golf's SEO, PPC and Paid Social and grew shopping revenue 41% and organic sessions 47%. | Is your paid and organic spend actually compounding, or are the channels being run in separate silos that never talk? | on_file | website |
| Charity / Accessible Retail | UX, Replatforming, Shopify Plus | UK | UK's first WCAG 2.1 AA compliant ecommerce site | Ongoing | RNIB | y | We built the UK's most accessible ecommerce site for RNIB on Shopify Plus, fully WCAG 2.1 AA compliant and integrated in real time with Dynamics 365. | Is accessibility something your site actually passes today, or a compliance risk that's been sitting on the backlog? | on_file | website |
| SaaS / High-ACV | (no direct-match case study on file) | US | — | — | — | — | — | (needs a US SaaS proof point) | gap_block | — |

The last row is the honest gap: no US-SaaS case study on file, and a likely SaaS angle is hollow without one -> `gap_block` -> it goes into the bank-mode form as the priority ask. It is not papered over with a UK-retail metric dressed as SaaS proof.

### Bank 2 - Trigger & Angle bank

| category | trigger_signal | canonical_column | data_backed | acquisition | why_it_works | poke_the_bear | relevant_icps | priority | source |
|---|---|---|---|---|---|---|---|---|---|
| change_timing | New C-suite hire within 60 days | new_sales_leader_90d | y | tam_column | New leaders fix what they inherited and have budget to do it | Stepping into the role, is the infrastructure you inherited set up the way you'd actually build it? | Tier 1 | high | data_catalog |
| change_timing | Funding round announced | funded_last_90d | y | tam_column | New capital means new targets and urgency for pipeline | With the round closed, is the pressure to build pipeline outpacing what the current setup can deliver? | Tier 1 | high | data_catalog |
| sold_to | Sells into a specific end vertical | sells_to_vertical | y | tam_column | Their buyer's world changes the pain and the proof to lead with | Selling into {their vertical}, is the buying committee's compliance bar slowing every deal down? | All | high | data_catalog |
| demand | Running paid ads with no outbound motion | running_meta_ads | y | tam_column | Paid top-of-funnel without outbound = channel-handoff gap | Is your paid spend feeding a pipeline that outbound can actually follow up, or falling into a gap between channels? | Tier 1 & 2 | medium | data_catalog |
| events | Industry conference / trade show upcoming | — | n | manual | Shared context and a natural, no-pitch reason to connect | Are you heading to {event}? We're working with a few teams going and it seemed worth connecting ahead of it. | Tier 1 & 2 | high | manual |
| macro_shift | Tariff / regulatory / AI-adoption wave | — | n | social_listening | Shared urgency across a whole market at once | Has {macro event} put any real urgency behind {area} for your team this quarter? | All | high | manual |
| seasonal | End of financial year / Q4 budget flush | — | n | manual | Timing is often the difference between a yes and a no | With year-end close, are budget decisions moving faster than your pipeline can currently support? | All | medium | manual |
| competitor_users | Prospect listed as a competitor's customer | — | n | per_campaign_research | Public signal of current-tool usage; a warm, self-selected target | Are you getting everything you need from {competitor}, or are there gaps that are costing you time? | All | high | manual |

Note the split: the first four rows are data-backed (they reuse `/data-point-discovery` column names verbatim and feed the slice/angle libraries), the last four are message-only (the events/macro/seasonal/competitor angles the TAM can't produce - the bank's added value).

---

## Client-facing xlsx export

Source of truth is always `social-proof-bank.md`. The xlsx is a generated mirror for sharing with the client (to confirm facts, or as a shared asset), matching the example's two-sheet layout (`Case Studies`, `Trigger Bank`). The tested builder is Python + openpyxl:

```
python "<outbound>/scripts/social_proof_bank_to_xlsx.py" --client <business-slug>
```

It reads `profiles/<slug>/social-proof-bank.md` and writes `profiles/<slug>/social-proof-bank.xlsx` (needs `openpyxl`; `pip install openpyxl` if absent). It parses the two pipe tables by their `Case Stud` / `Trigger` headings, so the markdown table headers must stay intact. Regenerate from the markdown after any update; never hand-edit the xlsx as a second source of truth. For a Google Sheet instead, convert the xlsx via the google-docs MCP after export.

---

## What good looks like (definition of done)

- Every confirmed ICP segment has at least one real, segment-matched (or honestly close-match-flagged) case-study row, or an explicit `gap_block`/`gap_flag` naming what's missing - never a fabricated one.
- Every `one_liner` and `poke_the_bear` passed the Copy QA Gate and is genuinely drop-in usable.
- Every `data_backed = y` trigger row's `canonical_column` is a real `/data-point-discovery` name (grep it against the Schema Contract if unsure).
- At least the message-only trigger categories relevant to this client (events / macro / seasonal / competitor) are represented, since those are the ones the TAM can't produce.
- Any raw-fact gaps are batched into a single `/proof-asset-request` bank-mode form, PENDING in the activity log, asking for facts only.
- `run_state.status.proof_bank_stage = complete`, and confirmed proof is mirrored back into `client-profile.yaml` `proof:`.
