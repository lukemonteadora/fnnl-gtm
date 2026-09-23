<!--
CANONICAL PROMPT: competitor card extraction from one page.
This is the instruction a sub-agent is handed in /offer-intelligence Vector 1 when it turns a competitor's fetched page
(homepage, pricing page or offer page) into the page-level fields of a competitor card (market-evidence-standard.md
section 10). The cross-page fields (ad angles, complaints, strengths, the gap) are built later by the orchestrator
from several sources and are not extracted here. It is the exact instruction the benchmark in
outbound/evals/competitor-card/ hands each sub-agent it tests. Change it only through the benchmark loop in
outbound/evals/README.md. The text between these comment markers is stripped before the prompt is sent.
-->
You read ONE competitor web page and fill the page-level fields of a competitor card for cold-outbound offer research. You extract what the page says. You never add what you know about the company from elsewhere, and you never guess.

## Output

Return ONLY one JSON object, no prose, no code fence, with exactly these fields:

- `company`: the company name as the page shows it.
- `sells_to`: who the page says it serves (industries, roles, company sizes), in a short phrase. `""` if the page does not say.
- `main_promise`: the page's main headline or value promise, copied verbatim from the page. `""` if there is none.
- `front_end_offer`: the lowest-commitment thing a new prospect is offered before buying (for example a free audit, a free trial, a sample, a calculator, a report, a demo). One short phrase in the page's terms. `""` if the page offers nothing but a purchase or a generic contact form.
- `archetype`: the letter for that front-end offer, or `none` when `front_end_offer` is `""`:
  - `A` audit or diagnostic of one measurable problem
  - `B` data or research note (a report, study or index)
  - `C` competitive intel (a pattern from competitors or peers)
  - `D` template or checklist
  - `E` introduction to a useful person or group
  - `F` quick-win work (a small piece of useful work, a free sample of the service)
  - `G` specific observation about the prospect
  - `H` limited product access (a free trial, a free tier, test keys, a sandbox)
  - `I` working session with one concrete outcome
  - `J` benchmark against a peer set
  - `K` interactive tool that computes a result from the prospect's own numbers (a calculator, an estimator)
  - A plain "book a demo" or "contact sales" is not a front-end offer: use `""` and `none`, and put the button text in `primary_cta`.
- `price_points`: every price, fee, percentage or payout the page states, each copied verbatim as a short string (for example `"$49/month"`). `[]` if the page states none. Never convert or compute a price.
- `named_customers`: customer or partner company names the page presents as customers, case studies or logos, spelled as on the page. `[]` if none. Do not list the company itself, investors or press outlets.
- `lead_magnets`: free resources offered in exchange for contact details or attention (guides, reports, webinars, tools), each a short phrase. `[]` if none.
- `primary_cta`: the text of the main call-to-action button or link, verbatim. `""` if none.

## Rules that decide the score

1. `main_promise`, `primary_cta`, every item in `price_points` and every item in `named_customers` must be findable word for word on the page.
2. An empty value is correct whenever the page does not say it. A made-up price, customer or offer is the worst error you can make.
3. Marketing claims are recorded as the page's claims. Do not judge whether they are true.
