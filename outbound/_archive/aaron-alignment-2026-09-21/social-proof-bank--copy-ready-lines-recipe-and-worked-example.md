# Archived: social-proof-bank copy-ready lines recipe and worked-example cells

- **Source file:** `outbound/reference/social-proof-bank.md` (the reference doc read by `/social-proof-bank`)
- **Section:** "Recipe: synthesizing the two copy-ready lines (we do this, never the client)" and "Worked example (illustration - the shape of a filled bank)", including both tables as they stood.
- **Archived:** 2026-09-21 (operator-approved Aaron alignment)
- **Reason:** contradicts Aaron's copy doctrine. The `poke_the_bear` cells were diagnostic-mirror questions written as openers, and Aaron rejects the poke-the-bear curiosity opener and question-form pain openers (examples §8; doctrine §9, "no pain, no observation, no preamble"). The `one_liner` recipe stacked several numbers into one proof sentence, where his rule is one proof point, in the PS, with one plain named number (doctrine §9, examples §6). The live replacements are the skill's "The two copy-ready lines" section and the rewritten worked example in the reference doc; the facts in the tables are unchanged there.

**Do not use this text to write live copy.** Replaced in place by worked examples of the two copy-ready lines (defined once in the `/social-proof-bank` skill) and a worked example rewritten to those definitions. The text keeps its original em-dash table placeholders (empty-cell markers, not prose). The original text, verbatim:

> ## Recipe: synthesizing the two copy-ready lines (we do this, never the client)
>
> ### The `one_liner` (copy-ready proof sentence)
>
> A single sentence a skeptical prospect would find credible, built only on real facts. Structure that works (from the example): **{what we did for a named client} - {the mechanism} - {the result with its real number}.**
>
> - Worked from a real row: facts = client "Sweet Squared", service "BigCommerce B2B replatform + NetSuite integration", result "24% online revenue, 119% account creations, Jan 25 - Jan 26".
> - Synthesized one-liner: `We replatformed Sweet Squared to BigCommerce B2B with full NetSuite integration, syncing customers, products, pricing and orders, and grew their online revenue 24% and account creations 119% in the first year.`
> - QA it: no em dash, no colon-as-runway, no comma-wrapped descriptor, real defensible number, named client allowed. Passes.
>
> ### The `poke_the_bear` (diagnostic-mirror question)
>
> A short question that reflects the prospect's own likely situation or their buyers' real pain back to them, so it drops straight into an Email 1 / Email 3 opener (the conversational diagnostic-mirror register). It is NOT "want to see our case study?" - it names the tension the proof resolves and asks whether it's live for them.
>
> - Worked from the same proof (B2B replatform, self-serve ordering): `When a B2B buyer wants to reorder at 9pm, can they do it themselves on your site, or does it still route through a rep and a spreadsheet?`
> - Worked from a why-now trigger (new C-suite hire): `Stepping into the role, are you finding the outbound infrastructure you inherited is set up the way you'd actually build it?`
> - QA it: leads with the implication, no observational "I noticed / I saw", no warmup, no surveillance recital of their data. Passes, and it's a ready opener.
>
> Every synthesized line runs the Copy QA Gate (`spam-word-checker.md` + `cold-email-copy-best-practices.md`) before it is written to the bank. A line that can't pass isn't written - drop to a broader angle the real proof supports, or leave the row a gap and request the fact.
>
> ---
>
> ## Worked example (illustration - the shape of a filled bank)
>
> A digital-agency client (mirrors the example workbooks; illustration only - generate real rows from the actual client):
>
> ### Bank 1 - Case Studies
>
> | icp_segment | service_line | territory | result | timeframe | named_client | naming_ok | one_liner | poke_the_bear | proof_status | source |
> |---|---|---|---|---|---|---|---|---|---|---|
> | B2B Beauty / Professional Hair | Replatforming, BigCommerce B2B | UK & Ireland | 24% online revenue, 119% account creations | Jan 25 - Jan 26 | Sweet Squared | y | We replatformed Sweet Squared to BigCommerce B2B with full NetSuite integration and grew their online revenue 24% and account creations 119% in the first year. | When a trade buyer wants to reorder at 9pm, can they self-serve on your site, or does it still route through a rep? | on_file | website |
> | B2B Wines & Spirits | UX, Development, BigCommerce B2B | UK | 911% online revenue, 40% of orders now out-of-hours | From Mar 2025 | Inverarity Morton | y | We rebuilt Inverarity Morton's B2B experience, fixed the conversion blockers, and grew online revenue 911% from March 2025 with 40% of orders now placed out of hours. | How much of your trade revenue is stuck behind office hours because ordering still runs through your team? | on_file | website |
> | Specialist Retail (Golf) | SEO, PPC, Paid Social | UK | 41% shopping revenue, 47% organic sessions | Ongoing | American Golf | y | We took full ownership of American Golf's SEO, PPC and Paid Social and grew shopping revenue 41% and organic sessions 47%. | Is your paid and organic spend actually compounding, or are the channels being run in separate silos that never talk? | on_file | website |
> | Charity / Accessible Retail | UX, Replatforming, Shopify Plus | UK | UK's first WCAG 2.1 AA compliant ecommerce site | Ongoing | RNIB | y | We built the UK's most accessible ecommerce site for RNIB on Shopify Plus, fully WCAG 2.1 AA compliant and integrated in real time with Dynamics 365. | Is accessibility something your site actually passes today, or a compliance risk that's been sitting on the backlog? | on_file | website |
> | SaaS / High-ACV | (no direct-match case study on file) | US | — | — | — | — | — | (needs a US SaaS proof point) | gap_block | — |
>
> The last row is the honest gap: no US-SaaS case study on file, and a likely SaaS angle is hollow without one -> `gap_block` -> it goes into the bank-mode form as the priority ask. It is not papered over with a UK-retail metric dressed as SaaS proof.
>
> ### Bank 2 - Trigger & Angle bank
>
> | category | trigger_signal | canonical_column | data_backed | acquisition | why_it_works | poke_the_bear | relevant_icps | priority | source |
> |---|---|---|---|---|---|---|---|---|---|
> | change_timing | New C-suite hire within 60 days | new_sales_leader_90d | y | tam_column | New leaders fix what they inherited and have budget to do it | Stepping into the role, is the infrastructure you inherited set up the way you'd actually build it? | Tier 1 | high | data_catalog |
> | change_timing | Funding round announced | funded_last_90d | y | tam_column | New capital means new targets and urgency for pipeline | With the round closed, is the pressure to build pipeline outpacing what the current setup can deliver? | Tier 1 | high | data_catalog |
> | sold_to | Sells into a specific end vertical | sells_to_vertical | y | tam_column | Their buyer's world changes the pain and the proof to lead with | Selling into {their vertical}, is the buying committee's compliance bar slowing every deal down? | All | high | data_catalog |
> | demand | Running paid ads with no outbound motion | running_meta_ads | y | tam_column | Paid top-of-funnel without outbound = channel-handoff gap | Is your paid spend feeding a pipeline that outbound can actually follow up, or falling into a gap between channels? | Tier 1 & 2 | medium | data_catalog |
> | events | Industry conference / trade show upcoming | — | n | manual | Shared context and a natural, no-pitch reason to connect | Are you heading to {event}? We're working with a few teams going and it seemed worth connecting ahead of it. | Tier 1 & 2 | high | manual |
> | macro_shift | Tariff / regulatory / AI-adoption wave | — | n | social_listening | Shared urgency across a whole market at once | Has {macro event} put any real urgency behind {area} for your team this quarter? | All | high | manual |
> | seasonal | End of financial year / Q4 budget flush | — | n | manual | Timing is often the difference between a yes and a no | With year-end close, are budget decisions moving faster than your pipeline can currently support? | All | medium | manual |
> | competitor_users | Prospect listed as a competitor's customer | — | n | per_campaign_research | Public signal of current-tool usage; a warm, self-selected target | Are you getting everything you need from {competitor}, or are there gaps that are costing you time? | All | high | manual |
>
> Note the split: the first four rows are data-backed (they reuse `/data-point-discovery` column names verbatim and feed the slice/angle libraries), the last four are message-only (the events/macro/seasonal/competitor angles the TAM can't produce - the bank's added value).
