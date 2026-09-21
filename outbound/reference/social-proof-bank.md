# Social Proof + Trigger Bank: procedure detail, worked example, and export

Reference doc read by `/social-proof-bank`. The skill file holds the operating logic; this holds the heavier material: a filled worked example so the operator sees what "good" looks like, worked examples of the two copy-ready lines (their definitions live once, in the skill's The two copy-ready lines section), and the client-facing xlsx export. The client-fill **Google Sheet** template (with worked examples as a guide) and the ready email/Slack outreach messages live in the sibling `social-proof-bank-client-fill-template.md`. Everything here is **client- and industry-agnostic** — the worked example is a digital agency for concreteness only; the same columns and trigger categories fit a SaaS vendor, manufacturer, healthcare provider, local-services business, ecommerce brand, or professional-services firm (`service_line` = whatever this client sells). Doctrine: memory.

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

## The two copy-ready lines: worked examples (we write them, never the client)

The definitions and rules live once, in the `/social-proof-bank` skill (The two copy-ready lines; operator-approved Aaron alignment, 2026-09-21). This section only shows them applied. The earlier recipe (a multi-number proof sentence, and a diagnostic-mirror question written as an opener) and the earlier worked-example cells are archived at `outbound/_archive/aaron-alignment-2026-09-21/social-proof-bank--copy-ready-lines-recipe-and-worked-example.md`.

Aaron's examples below show shape. Never paste his sentences into client copy: "it's the script framework that's doing all of the heavy lifting here, not the specific words" (doctrine §9).

### The `one_liner` (the single PS proof line)

Aaron's shape, verbatim:

> "Client went from X bad result to X good result using this exact process." (`[AS]`, examples §6, his PS social-proof template)

> "Nani Swimwear saw a 942% lift in ads to cart." (examples §6, the acronym rule: his plain, named, legible fix for the `[ANTI]` line "one swimwear brand dropped CPAC by 76%")

- House example, conforms to Framework A, from the worked row below. Facts: client "Sweet Squared", service "BigCommerce B2B replatform + NetSuite integration", result "24% online revenue, 119% account creations, Jan 25 - Jan 26".
- One-liner: `PS, we rebuilt Sweet Squared's trade ordering site the same way, and their online revenue grew 24% in the first year.`
- QA it: one number (account creations stays in `result`), a client we may name, the same mechanism as the offer it sits under (so it is only used under a trade-ordering rebuild offer), no acronym, no em dash, and it sits in the PS, never line one or two.

### The `poke_the_bear` line (optional line one of a labeled two-line test arm)

The corpus has no endorsed Aaron example of a two-line pain opener, so none is quoted as his (doctrine §15: when the corpus has a gap, say so rather than invent a position). His rejection is on record, and it is the clearest guide to what this line must not become:

> "Spending too much time prospecting for new high-value clients, we can generate a look-alike list of 100 companies matching the profile of your case study client, open to a 2-minute skim of the CSV." (`[ANTI]`, examples §1.5, the loser his test winner beat)
> His verdict: "the value is still here, it's just buried." (examples §1.5)

- House example, conforms to the two-line test-arm lane, never the default. Proof row: Sweet Squared (trade reordering). Line one: `A lot of trade buyers still have to reorder through a rep.` Line two is the offer, and it must solve exactly that pain, or the line is not used.
- House example, trigger row (`new_sales_leader_90d`): `New sales leaders usually inherit a pipeline setup they didn't build.` It says what the signal means, never that we saw the hire. The trigger's default job is still picking the slice, with any relevance in the PS (examples §1.1).
- QA it: a statement, not a question; one short clause of pain, no picture-painting; validated only if the client's buyers actually say it (call notes, offer-intelligence), otherwise the cell stays blank; no "I noticed / I saw".

Every synthesized line runs the Copy QA Gate (`spam-word-checker.md` + `cold-email-copy-best-practices.md`, then Aaron's rejection bank, `aaron-examples.md` §8) before it is written to the bank. A line that can't pass isn't written - drop to a broader angle the real proof supports, or leave the row a gap and request the fact.

---

## Worked example (illustration - the shape of a filled bank)

A digital-agency client (mirrors the example workbooks; illustration only - generate real rows from the actual client). The facts are the workbook's. The `one_liner` and `poke_the_bear` cells are house examples rewritten to the 2026-09-21 definitions (operator-approved Aaron alignment); the earlier cells are in the archive file named above.

### Bank 1 - Case Studies

| icp_segment | service_line | territory | result | timeframe | named_client | naming_ok | one_liner | poke_the_bear | proof_status | source |
|---|---|---|---|---|---|---|---|---|---|---|
| B2B Beauty / Professional Hair | Replatforming, BigCommerce B2B | UK & Ireland | 24% online revenue, 119% account creations | Jan 25 - Jan 26 | Sweet Squared | y | PS, we rebuilt Sweet Squared's trade ordering site the same way, and their online revenue grew 24% in the first year. | A lot of trade buyers still have to reorder through a rep. | on_file | website |
| B2B Wines & Spirits | UX, Development, BigCommerce B2B | UK | 911% online revenue, 40% of orders now out-of-hours | From Mar 2025 | Inverarity Morton | y | PS, after we rebuilt Inverarity Morton's trade ordering the same way, their online revenue grew 911% from March 2025. | A lot of trade orders still have to wait for office hours. | on_file | website |
| Specialist Retail (Golf) | SEO, PPC, Paid Social | UK | 41% shopping revenue, 47% organic sessions | Ongoing | American Golf | y | PS, we run American Golf's search and paid social together, and their shopping revenue grew 41%. | Paid and organic search usually get run by separate teams. | on_file | website |
| Charity / Accessible Retail | UX, Replatforming, Shopify Plus | UK | UK's first WCAG 2.1 AA compliant ecommerce site | Ongoing | RNIB | y |  | Most online shops still fail basic accessibility checks. | on_file | website |
| SaaS / High-ACV | (no direct-match case study on file) | US | — | — | — | — | — | (needs a US SaaS proof point) | gap_block | — |

The last row is the honest gap: no US-SaaS case study on file, and a likely SaaS angle is hollow without one -> `gap_block` -> it goes into the bank-mode form as the priority ask. It is not papered over with a UK-retail metric dressed as SaaS proof.

RNIB's `one_liner` is blank on purpose. Its result is real but carries no number, and the PS proof line needs one plain, named number (doctrine §9, examples §6). Ask for one in the fact request (for example a traffic or conversion change after launch). Until it comes back, the proof still counts as on file for `/campaign-strategy`'s weighting, but it cannot carry a PS.

### Bank 2 - Trigger & Angle bank

| category | trigger_signal | canonical_column | data_backed | acquisition | why_it_works | poke_the_bear | relevant_icps | priority | source |
|---|---|---|---|---|---|---|---|---|---|
| change_timing | New C-suite hire within 60 days | new_sales_leader_90d | y | tam_column | New leaders fix what they inherited and have budget to do it | New sales leaders usually inherit a pipeline setup they didn't build. | Tier 1 | high | data_catalog |
| change_timing | Funding round announced | funded_last_90d | y | tam_column | New capital means new targets and urgency for pipeline | After a raise, the pipeline target usually moves faster than the team. | Tier 1 | high | data_catalog |
| sold_to | Sells into a specific end vertical | sells_to_vertical | y | tam_column | Their buyer's world changes the pain and the proof to lead with | Selling into {their vertical} usually means a compliance review on every deal. | All | high | data_catalog |
| demand | Running paid ads with no outbound motion | running_meta_ads | y | tam_column | Paid top-of-funnel without outbound = channel-handoff gap | Paid traffic often lands with no outbound follow-up behind it. | Tier 1 & 2 | medium | data_catalog |
| events | Industry conference / trade show upcoming | — | n | manual | Shared context and a natural, no-pitch reason to connect |  | Tier 1 & 2 | high | manual |
| macro_shift | Tariff / regulatory / AI-adoption wave | — | n | social_listening | Shared urgency across a whole market at once | {macro event} is pushing {area} up the list this quarter. | All | high | manual |
| seasonal | End of financial year / Q4 budget flush | — | n | manual | Timing is often the difference between a yes and a no | Year-end close usually speeds up budget decisions. | All | medium | manual |
| competitor_users | Prospect listed as a competitor's customer | — | n | per_campaign_research | Public signal of current-tool usage; a warm, self-selected target |  | All | high | manual |

Note the split: the first four rows are data-backed (they reuse `/data-point-discovery` column names verbatim and feed the slice/angle libraries), the last four are message-only (the events/macro/seasonal/competitor angles the TAM can't produce - the bank's added value).

Two `poke_the_bear` cells are blank on purpose. An upcoming event is a timing reason, not a pain: it picks the slice and, if it earns copy space at all, sits in the PS. The competitor-user row's old line asked whether they were getting everything they need from the competitor, which assumes a problem nobody verified ("Still losing money to X?" without evidence is his negative example, doctrine §8 and examples §8); the signal still picks the slice. A `{macro event}` or `{their vertical}` line is used only when it is true for every contact in the slice.

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
- Every `one_liner` is a single PS proof line with one plain, named number; every `poke_the_bear` line that exists is a short, validated statement for a labeled test arm; both passed the Copy QA Gate (operator-approved Aaron alignment, 2026-09-21).
- Every `data_backed = y` trigger row's `canonical_column` is a real `/data-point-discovery` name (grep it against the Schema Contract if unsure).
- At least the message-only trigger categories relevant to this client (events / macro / seasonal / competitor) are represented, since those are the ones the TAM can't produce.
- Any raw-fact gaps are batched into a single `/proof-asset-request` bank-mode form, PENDING in the activity log, asking for facts only.
- `run_state.status.proof_bank_stage = complete`, and confirmed proof is mirrored back into `client-profile.yaml` `proof:`.
