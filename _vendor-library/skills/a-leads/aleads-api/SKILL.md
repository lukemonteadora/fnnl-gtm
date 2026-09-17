---
name: aleads-api
description: A-Leads access for cold outbound — via the A-Leads MCP connector (https://mcp.a-leads.co, added as a Claude custom connector), which is the PRIMARY path and supersedes the old direct REST API. Exposes 9 tools across company search, people/contact search, work-email finding, email verification, and phone finding. `aleads_advanced_search` (people/contact search) was reported RETIRED 2026-07-12 — that report was WRONG, it was re-confirmed live and callable 2026-07-14 (see "Contact / decision-maker discovery" section for the correction and that day's filter-reliability findings). Tool presence on this connector has drifted within days in both directions — re-verify via ToolSearch each session rather than trusting an old "retired" or "restored" note. Use as the default tool for getting company information, emails, and verification. Layer 1 (company_search, incl. bulk_domains for known-domain lookups) feeds /tam-build; Layer 2 (find_email / verify_email / find_phone) feeds /email-waterfall.
---

# A-Leads (via MCP connector)

A-Leads is the upstream workspace's primary B2B company data source for cold outbound. It is now reached through the **A-Leads MCP connector** — native tool calls from inside Claude, no browser and no hand-rolled HTTP. This is the default tool for **getting company information, finding work emails, verifying emails, and finding phones**.

> **This replaces the old direct-REST path.** The previous REST API (`api.a-leads.co/gateway/v1`) authenticated but returned `500` on every search/enrichment call (the unresolved server-side issue documented for months). **The MCP connector resolves that** — every tool below was live-tested and returns real data. The REST API is now a **legacy fallback only**; see the appendix. Memory: [[aleads-api-gated-not-docs]] (status now RESOLVED).

> **⚠ CORRECTED 2026-07-14: the "RETIRED 2026-07-12" claim below was wrong — `aleads_advanced_search` is present and callable.** This banner used to say the tool was gone (8 tools not 9) and that any call to it would fail outright. Re-tested live 2026-07-14: the tool's schema loads via ToolSearch and it returned structured data on four separate calls that session. It was not actually gone — whether the 07-12 report was a misdiagnosis (e.g. caught mid a connector-invalidation cycle, see [[aleads-api-gated-not-docs]]) or the tool was briefly removed and restored is **unknown — don't guess at a cause in future updates to this file.**
>
> **What the 07-14 re-test also found: the tool responding is not the same as its filters being trustworthy.** Broad `mapped_industries` + `member_management_level` filtering returned rows that mostly did NOT match the requested industry (12% precision on a 20-value manufacturing filter, ~40% on a single "Hospital & health care" filter — full detail in "Contact / decision-maker discovery" below). `bulk_domains` combined with `member_management_level` reproducibly returned an empty `results` array despite a nonzero `total_count` (2 consecutive calls); `bulk_domains` used ALONE returned clean, correctly-bound rows every time.
>
> **Net: `aleads_advanced_search` is a live, valid contact-discovery tool again, but trust it only in domain-scoped mode (`bulk_domains` alone).** Do not treat broad industry/seniority market-filter results as ICP-qualified without independently verifying each row. Clay `search-contacts` (see below) remains a second valid domain-scoped option — which one to default to is an open call, not decided by this correction. **Tool presence on this connector has now been wrong in both directions within a 2-day window — re-verify via ToolSearch each session; don't carry forward an old "retired" or "restored" note as settled fact.** Memory: [[aleads-api-gated-not-docs]], [[aleads-advanced-search-serial-pagination]], [[clay-search-contacts-discovery-tool]].
>
> **Separate 2026-07-14 finding, same session: concurrent calls are unsafe even in domain-scoped mode.** A ~50-call live pull (single-domain `bulk_domains` per call, no market filters) found 10-parallel calls produced a ~40% timeout rate, and even 3-parallel produced a **silent cross-domain data leak**, not just a timeout: a query for `lanterncare.com` returned `alignlife.com`'s exact result (same person, same company, same LinkedIn URL, no error). This is worse than a timeout because the response looks like a valid, correctly-labeled result — it will pass an unattended pipeline silently. **For any flow where per-company accuracy matters, call this tool fully serially (one domain per call)**, or if you must batch, independently confirm every response's own `domain` field matches what you asked for before trusting it. Also seen in the same session: common business names (e.g. "Doctors Care") risk name-collision even on a clean single-domain call — cross-check `member_location_raw_address` against the row's own `hq_location`, and treat a large mismatch (different country/region, or a "person" name that is actually a company name) as a likely wrong-entity or fabricated-profile result, not a finding.

## The connector

- **URL:** `https://mcp.a-leads.co` — added by the operator as a **custom connector in the Claude connector account** (NOT a `.mcp.json` server, so it does not appear in the local MCP config; it's a remote Claude connector exposed to the session).
- **Account behind it:** `<ACCOUNT_OWNER_EMAIL>` (the upstream workspace's A-Leads account). Billing is **metered / pay-as-you-go** — credits deduct live per successful result.
- **Finding the tools:** they are exposed in-session prefixed with the connector's server id (an install-specific UUID, e.g. `mcp__<connector-id>__aleads_*`). If they aren't already loaded, find them with **ToolSearch** query `aleads`. Refer to them by their logical names below; do not hard-code the UUID into any flow.
- **⚠ Connector can invalidate — have a fallback, don't stall.** Because it's an OAuth custom connector, the login periodically dies with **"The user's connection to this connector was invalidated. The user needs to reconnect it"** — this hits **every** A-Leads tool at once (even the free `get_user_details` read), so it is a connector-auth outage, never a per-tool bug. The legacy REST API is **not** a workaround (it still 500s on find/verify — verified 2026-06-16 via `aleads-selftest.mjs`), and nothing in-session can re-authorize the connector: only the operator reconnecting it in **Claude → Connectors** restores it, and the durable fix (stop the recurring invalidation) is an **A-Leads-team** token-lifecycle change. **When this error appears: do NOT retry A-Leads in a loop.** Surface it to the operator, and for any live email-finding fall back to **BetterContact** as the finder for the slice (it finds + verifies + catch-all in one — see `/email-waterfall` → "SANCTIONED EXCEPTION"). A-Leads resumes as the primary finder once reconnected.

## The 9 tools (see banner above — `aleads_advanced_search` is live; verify filter reliability before trusting broad-market results)

| Tool | What it does | Input | Credit cost | Layer |
|---|---|---|---|---|
| `aleads_get_user_details` | Account profile + per-pool credit usage | `{ include_credit_usage: true }` | free | — |
| `aleads_company_search` | **Company-only** filter search (firmographics, signals); `company_filters.bulk_domains` also works as a known-domain firmographics lookup (verified 2026-07-12 — see gotcha #1) | `{ company_filters, page, search_type:"total" }` | metered per record (huge `advanced_search` pool) | **1** |
| `aleads_advanced_search` | **Person/contact search** — company + person filters together (industry, size, HQ, seniority, tenure, etc.); `advanced_filters.bulk_domains` scopes it to a known company list. Re-confirmed LIVE 2026-07-14 after a wrong 07-12 "retired" report. ⚠ **Broad market-filter mode (`mapped_industries` / `member_management_level` without `bulk_domains`) returned mostly off-target rows in testing — verify every row's actual industry/title before use. `bulk_domains` combined with `member_management_level` returned empty results in testing — use `bulk_domains` alone instead.** See "Contact / decision-maker discovery" below. | `{ advanced_filters, page, search_type:"total" }` | metered per record (huge `advanced_search` pool) | **1** |
| `aleads_get_saved_searches` | List the account's saved searches (paginated, 25/page, max page 50) | `{ page }` | free | — |
| `aleads_find_email` | Find ONE work email | `{ first_name, last_name, website }` | 1 credit per find, 0 if none | **2** |
| `aleads_bulk_find_email` | Find work emails for up to 10 rows | `{ rows:[{first_name,last_name,website}] }` (≤10) | 1 credit per found row | **2** |
| `aleads_verify_email` | Verify ONE email — ⚠ **RETIRED for our flow, do NOT use** (verification → Deliverable.co) | `{ email }` | n/a | — |
| `aleads_bulk_verify_email` | Verify up to 10 emails — ⚠ **RETIRED for our flow, do NOT use** (verification → Deliverable.co) | `{ rows:[{email}] }` (≤10) | n/a | — |
| `aleads_find_phone` | Find a phone from a LinkedIn username/slug | `{ linkedin_username }` | ~per A-Leads phone pricing (phone pool); 0 if none | **2** |

`search_type` is always `"total"` for the two search tools. **`page` is 0-indexed and returns ~25 results/page — the FIRST page is `page: 0`.** Verified 2026-06-16: `page:0` returns the first 25 rows; starting at `page:1` **silently skips them** (an under-pull, no error). Paginate `0, 1, 2, …` until `results` is empty or you've covered `meta.total_count`. (The old REST `current_page` was also 0-indexed.)

### Verified behavior (live test 2026-06-16 — all 9 PASS; `advanced_search` re-confirmed live again 2026-07-14, see banner)

- `advanced_search` → `page:0` returned 25 Stripe C-level rows correctly on 2026-06-16. **Re-tested 2026-07-14 with different filters (industry + seniority + company size + US, plus `bulk_domains` variants) — the tool responds and returns structured rows every time, but broad `mapped_industries`/`member_management_level` filtering did NOT reliably return on-target rows (12-44% precision across two tests), and `bulk_domains`+`member_management_level` returned empty results twice in a row while `bulk_domains` alone returned clean, correctly-bound rows. Full findings: [[aleads-advanced-search-serial-pagination]].**
- `company_search` → firmographic filter returned 24 full company rows (`total_count: 373`) with `company_id`, headcount, industry, HQ, domain, `size_range`. **Re-verified 2026-07-12 with `bulk_domains`: a 3-domain list returned 3 full rows (not counts) — the old gotcha #1 limitation is resolved; a follow-up 60-domain list returned `total_count: 60` but only 25 rows on page 0 — confirms standard pagination applies at scale, see gotcha #1.**
- `find_email` → `patrick@stripe.com` (quality: good). `bulk_find_email` → `john@stripe.com`, `credits_deducted: 1`.
- `verify_email` → `<OPERATOR_EMAIL>` valid:true. `bulk_verify_email` → `<ACCOUNT_OWNER_EMAIL>` valid:true, `credits_deducted: 1`.
- `find_phone` → `patrickcollison` → `+14152373930` (returns `null` cleanly when a profile has no phone on file — not an error).

## Contact / decision-maker discovery (two valid tools — pick by scope)

**Two options exist today, both trustworthy only in domain-scoped mode:**

1. **A-Leads `aleads_advanced_search` with `advanced_filters.bulk_domains`** (this connector, no separate tool needed) — pass a known list of target-company domains, optionally add other COMPANY-level filters (industry, size), which apply reliably since they're the same fields `company_search` uses successfully. **Do NOT add `member_management_level` (or likely other person-level filters) to the same call — tested 2026-07-14, reproducibly returns an empty `results` array with a nonzero `total_count` (2 consecutive calls).** Instead, pull the domain-scoped rows with `bulk_domains` alone and read the returned `job_title` string yourself to identify owners/founders/decision-makers. Confirmed clean 2026-07-14: 25/25 rows on a 4-domain test, zero cross-domain leakage.
2. **Clay `search-contacts`** (a separate connector — find via ToolSearch `search-contacts` if not loaded). Its `job_title_keywords`/`job_title_exclude_keywords` filters match literal title text rather than an opaque seniority tag, which sidesteps the `member_management_level` reliability problem above. Gotchas below are well-tested and still hold.

### Canonical recipe — find CEO/Owner/Founder (or any titles) for a domain list, A-Leads path

Proven end-to-end on a 50-domain run 2026-07-14. Follow it exactly and there is no trial-and-error. Per domain, **one call**:

```
aleads_advanced_search({
  advanced_filters: {
    bulk_domains: "onecompany.com",                       // exactly ONE domain per call
    job_title: ["CEO","Chief Executive Officer","Owner","Founder","Co-Founder","President"],
    job_title_match_mode: "contains",                     // "contains", NOT "smart" — cleanest for exec titles
    excluded_job_title: ["Product Owner","Business Owner","Chief of Staff","Assistant","Vice President"]
  },
  search_type: "total",
  page: 0                                                 // page 0 is enough for one domain's execs (rarely >25 rows); paginate only if page 0 fills
})
```

- **SERIAL — one domain per call, NEVER concurrent, not even 3 at once.** Verified 2026-07-14: 10 concurrent calls timed out ~40%, and **3 concurrent calls produced a SILENT cross-domain leak** — a `lanterncare.com` call returned `alignlife.com`'s exact row (same person, company, LinkedIn URL), correctly-labeled and with no error, so it is indistinguishable from a real result in an unattended pipeline. This is the [[parallelize-by-default-doctrine]] logged exception for this tool. If you ever must batch, independently confirm every response row's own `domain` field matches the domain you asked for before trusting it.
- **Do NOT add `member_management_level`** — tested, it does not improve precision and can drop a legitimate match; the `job_title` + `excluded_job_title` text filter above is what works. (`member_management_level` + `bulk_domains` can also return an empty `results` array with a nonzero `total_count`, see the discovery gotchas above.)
- `email_found` is null in these rows — **expected**; email reveal is a separate Layer-2 step (`/email-waterfall`), never here.

**Deterministic post-processing (before any AI scoring pass):**
- **Dedup by PERSON (LinkedIn slug / name), NOT `document_id`.** The same exec recurs with different `member_id` / `document_id` values (seen: one CEO returned 2-3× with distinct ids) — a `document_id` dedup will NOT collapse them. (`document_id` dedup is correct for COMPANY rows, insufficient for people.)
- **Wrong-entity / index-noise guard, from A-Leads-internal signals only** (no web check needed): cross-check each row's `member_location_raw_address` country/region against its own `hq_location` — a large mismatch (e.g. a "Group CEO" in Bangladesh under a Denver company) is a likely fabricated-tail or wrong-entity row → drop or flag. A "person name" that is actually a company name = data error → drop. If the returned `company_name` is a **differently-named business** than the domain you asked for (seen: healthecareers.com → "HealthExperts"/"HealthEra"; pagethink.com → an architecture firm; augustahealth.com → a small unrelated OB/GYN practice), the domain resolved to the wrong entity → flag the whole domain as no-usable-match, don't ship its rows.
- **Franchise / multi-site brands** return many legitimate per-location Owners/Presidents (seen: AFC Urgent Care, AlignLife). The top-level decision-maker is usually the most-qualified title at the HQ city (e.g. "Founder, Owner, Chairman, CEO"); keep the per-location owners only if per-location targeting is intended.
- **Succession ambiguity** (two people both titled CEO, e.g. predecessor/successor) — keep both, flag, do NOT resolve here.
- **Confidence tier from internal signals** (location-to-HQ match, title cleanliness, franchise structure), then **hand the deeper filtering/scoring to the AI scoring pass** (operator plan 2026-07-14). The recipe's job is clean, domain-bound rows + a first-pass confidence flag, not a single resolved answer.

**Do not use A-Leads `advanced_search` in BROAD mode** (`mapped_industries` and/or `member_management_level` as your primary filter, no `bulk_domains`) **for anything you plan to treat as ICP-qualified without a per-row check.** Tested 2026-07-14: `total_count` does shift with the industry filter (so it isn't simply ignored), but the actual sample rows returned were 55-88% off-target across two separate industry filters (a broad 20-value manufacturing list, and a single "Hospital & health care" value) — results included software companies, IT services firms, a staffing agency, a nonprofit, and VC firms with no relationship to the requested industry. The mechanism is unverified (unknown whether it's a ranking issue, multi-affiliation matching, or something else) — treat it as an observed behavior to route around, not a diagnosed bug. If you need broad market discovery by industry, build the company list first via a method with reliable industry filtering (`aleads_company_search`'s own firmographic filters, or DiscoLike lookalike) and THEN pull contacts at that company list via `bulk_domains` or Clay. `naics_codes`/`sic_codes` also exist as filter fields on this tool and were NOT tested as an industry-precision fix — don't recommend or rely on them until someone actually runs that test.

**Tool: `search-contacts`** (a separate MCP connector, Clay-backed — find it via ToolSearch query `search-contacts` if not already loaded). Companion tools: `search-contacts-by-name` (find a specific named person), `render-search-results` (show results to the user), `load-more-search-results` (paginate), `add-contact-data-points` / `add-company-data-points` (enrich a result set — this is also where email reveal happens, see below).

**Call pattern:**
```
search-contacts({
  companyIdentifiers: ["domain1.com", "domain2.com", "domain3.com"],  // cap at 3, see gotcha
  contactFilters: {
    job_title_keywords: ["CEO", "Chief Executive", "Owner", "Founder", "President"],
    job_title_exclude_keywords: ["Product Owner", "Business Owner", "Chief of Staff", "Assistant", "Vice President"]
  }
})
```

**Gotchas (verified 2026-07-12, live testing):**
1. **~20-25 contacts total per call, regardless of domain count.** The schema accepts up to 10 `companyIdentifiers`, but the result budget is roughly fixed per call — pass more than ~3 domains at once and the later domains in the batch get starved of results (not an error, just silently thin/empty). **Cap real batches at 3 domains/call.** This is the single biggest cause of "some companies come back with nobody" when scaling past a handful of manual lookups.
2. **Noisy title matches eat the shared budget.** `job_title_keywords: ["Owner"]` also matches "Product Owner", "Business Owner" — non-decision-maker titles that are common at larger companies and can crowd out the real match in a shared-budget batch. Always pass `job_title_exclude_keywords` for the common false-positive titles when searching for Owner/Founder/CEO.
3. **A genuine empty result happens too — verified, not just a batching artifact.** Re-tested a single domain alone (no batching) with exclusions applied and it still returned zero CEO/Owner/Founder/President contacts. This is expected for companies that are subsidiaries of a larger parent (the real decision-maker may be titled under the parent, not this brand) or that use a non-standard title (Managing Director, GM). **On a genuine empty result, retry once with a widened title net** (add `Managing Director`, `General Manager`, `Head of`) before treating the company as having no findable contact.
4. **A domain can resolve to the wrong entity.** A brand/subsidiary domain can resolve to its corporate parent (seen: a small Brooklyn brewery resolved to its multinational parent's global executives). Always check the returned company block's `name`/`employee_count` against what you expected before trusting the contacts under it.
5. **Movers, and outright name collisions — measured, not theoretical.** A returned contact's `domain` field is their CURRENT employer, but don't trust it blindly. A small 9-company bulk-pattern test (2026-07-12, a collision-prone mix of small/similarly-named companies) found **3 of 9 were wrong-entity matches, not zero results** — cases where the tool returned a real, confidently-titled person, but they belonged to a different company entirely (e.g. "Valves Only" surfaced a procurement director at an unrelated Middle East valve company; a company called "swell.com" surfaced a Brazilian managing partner whose tenure predates the actual company's founding, plus an unrelated "Swell Productions" name collision). These looked like clean hits — right title, real person, real LinkedIn — and would have shipped a wrong-person contact into a campaign if not caught. **Every match needs a sanity check beyond the returned `domain` field**: does the person's tenure/seniority make sense against the company's actual founding date and scale, does a quick independent check (a web search on `name + real company name`) confirm they're actually there. This is a real, recurring failure mode, not a one-off — but the n=9 test is too small and too collision-prone a sample to treat as a universal rate (a cleaner list, e.g. larger firms with more distinctive names, will likely resolve better); don't cite "a third" as a planning constant. Budget time for this check on every bulk pull and re-measure the rate on your own client's list rather than assuming it transfers.
6. **No email in this step.** `search-contacts` returns name, title, LinkedIn, and location only — never an email address. Email reveal is a separate enrichment step (`add-contact-data-points`) or routes through the existing Layer-2 doctrine (A-Leads `find_email` → Deliverable.co verify → BetterContact residue) in `/email-waterfall`.

**For a whole DiscoLike-lookalike-scale list (hundreds of companies), do not call this tool one batch at a time in the live conversation** — see the bulk fan-out pattern in `/tam-build` Layer 1d and `/personalization-subagent-pattern` (same disjoint-input / disjoint-output-file / dedupe mechanics, applied to contact discovery instead of copy generation).

## Gotchas (read before building a flow)

1. **RESOLVED 2026-07-12 — `company_search` with `bulk_domains` now returns full rows, BUT standard 25/page pagination still applies (verified at scale).** This gotcha used to say a bare `company_filters.bulk_domains` list came back with a correct `meta.total_count` but an empty `results` array, and pointed to `aleads_advanced_search` as the workaround. Re-tested 2026-07-12 at two scales: a 3-domain list returned 3 full rows (identity, headcount, industry, HQ, `size_range`, `document_id`) — looked fully resolved. **But a 60-domain list returned `meta.total_count: 60` with only 25 rows in `results`** — the same page-0 pagination every other A-Leads search call has (documented elsewhere in this file: `page` is 0-indexed, ~25 results/page). This is NOT a new cap bug, it's the tool behaving exactly as documented — it's just easy to miss at small scale because a 3-domain test fits entirely on page 0 and never exercises pagination. **For a known-domain lookup of more than ~25 domains, you MUST paginate `page:0, 1, 2, …` until you've covered `meta.total_count`, exactly like any other `company_search` call.** No workaround tool exists for this (and none is needed — it's just pagination), but skipping it silently truncates a domain-firmographics pull the same way skipping pagination anywhere else in this API does.
2. **Transient `520` (Cloudflare) happens.** A bare `520 "Request failed"` is an origin blip, not an auth/schema error — **retry once** and it succeeds.
3. **Per-call row caps + session-driven.** The bulk find/verify tools take **≤10 rows per call** (verified: full 10-row `bulk_find_email` + `bulk_verify_email` return clean per-row results + exact credit accounting). Loop them at 10/call across the live slice. **A-Leads `find_email` (find) is the mandatory first pass for every no-email row** (HARD RULE — see `/email-waterfall`); **email verification is Deliverable.co's job, NOT A-Leads** (`aleads_verify_email` is retired). BetterContact runs ONLY on the residue A-Leads can't close, never as a high-volume shortcut. **The A-Leads find tools are session-driven** — Claude calls them in a session; a standalone `.mjs` script cannot (it would hit the broken legacy REST path). So a very large *unattended/headless* find run (5k+) is a genuine operational constraint — the in-session A-Leads loop can't run without a session — so **flag that to the operator** rather than silently switching to BetterContact-first (which would break the hard rule). Add retry/backoff on the occasional `520`.
4. **Capability gaps vs the old REST API** — the MCP does **not** expose: company-by-id (`GET /company-search/{id}`), similar/lookalike (`/company-search/similar`), the bulk async file-management endpoints, or personal-email finding. For **lookalike/similar companies use `/disco-like`** (DiscoLike is the lookalike spine anyway). For company detail, the search rows already carry firmographics.
5. **The tools self-enforce a confirmation prompt** on find/verify (a verbatim "this will consume N credits" message). Inside the gated coldoutbound flow that confirmation is satisfied by the **single upfront `/api-cost-governance` preview + recorded spend ceiling** (per `/autonomous-execution-policy`) — do not re-confirm per row in an authorized batch. For a one-off ad-hoc lookup outside a gated batch, honor the per-call confirmation.
6. **Result ranking / relevance — broad PEOPLE queries return a lot of off-target rows.** Not fabricated profiles, but genuinely unrelated companies/industries mixed into the sample (re-verified 2026-07-14, current and live, not historical — see "Contact / decision-maker discovery" above and [[aleads-advanced-search-serial-pagination]] for the full test detail). Whether Clay `search-contacts` has an analogous risk is untested — treat results with the same general caution (ICP-fit qualification, `/email-waterfall`'s fabricated-name gate) until specifically verified. `find_email` is unaffected either way: it keys on the name you pass, not on search rows.

## Layer split (the firewall still holds)

| Layer | Tools | Calling skill |
|---|---|---|
| **Layer 1** (company-level, whole-TAM, cheap) | `company_search` (incl. `bulk_domains`), `get_user_details` | `/tam-build` |
| **Layer 1 — contact discovery** | Clay `search-contacts` OR A-Leads `advanced_search` with `bulk_domains` alone (see "Contact / decision-maker discovery" above) | `/tam-build` Layer 1d, `/email-waterfall` |
| **Layer 2** (per-contact, live campaign slice only) | `find_email`, `bulk_find_email`, `verify_email`, `bulk_verify_email`, `find_phone` | `/email-waterfall` |

**`/tam-build` hard stop:** never reveal or verify a person's email/phone inside a tam-build run — `find_email` / `verify_email` / `find_phone` belong exclusively to `/email-waterfall` on a live slice. Clay `search-contacts` may be used in Layer 1 for contact *discovery* (names/titles/LinkedIn), but **not** for email reveal — it doesn't return emails at all (see gotcha #6 above).

## Filter reference (for `company_search` / `advanced_search`)

The live tool schema (discover via ToolSearch `aleads`) carries the exhaustive enum lists. The load-bearing fields:

**Shared company filters** (in `company_filters` and inside `advanced_filters`):
- `bulk_domains` (string) — newline- or comma-separated domains to include; `excluded_bulk_domains` to exclude.
- `mapped_company_size` (int[]) — headcount band: `1`=1, `2`=2–10, `3`=11–50, `4`=51–200, `5`=201–500, `6`=501–1000, `7`=1001–5000, `8`=5001–10000, `9`=10001+. (`excluded_mapped_company_size` to exclude.)
- `mapped_industries` (enum[]) — mapped industry names (large enum; e.g. `"Hospital & health care"`, `"Computer software"`); `excluded_mapped_industries` to exclude.
- `hq_location` (string[]) — country/city; `excluded_hq_location` to exclude.
- `company_type` / `ownership_status` (enum[]).
- `categories_and_keywords` (string[]) — keywords from description/specialties; with `company_keyword_include_name` / `company_keyword_include_desc` booleans.
- `technologies_used` (string[]); `naics_codes` / `sic_codes` (string[]).
- `last_funding_round_name` (enum[]); range objects `acquired_date` / `ipo_date` (`{gte,lte}` unix).
- Sales-motion booleans (only present when true): `pricing_available`, `demo_available`, `free_trial_available`, `documentation_exist`, `is_downloadable`, `mobile_apps_exist`, `online_reviews_exist`.
- Web-traffic ranges (`{gte,lte}`): `total_website_visits_monthly`, `rank_global`, `rank_country`, `rank_category`, `bounce_rate`, `pages_per_visit`, `average_visit_duration_seconds`; `revenue_annual` (`{gte,lte}`).
- Hiring signals: `job_posting_title` (string[]), `job_posting_seniority` (enum[]), `job_posting_type` (enum[]), `job_posting_location` (string[]), `job_posting_date_posted` (`{gte,lte}`).

**Person filters — for `advanced_search`'s `advanced_filters` (live tool, re-confirmed 2026-07-14 — see banner). Reliability varies by field, tested 2026-07-14:**
- `member_management_level` and `mapped_industries` (shared with company filters above) do NOT reliably constrain results in broad/unscoped mode — see "Contact / decision-maker discovery" above. Not tested in isolation from each other, so it's unknown which one (or both) drives the imprecision.
- Combining any person-level filter (tested: `member_management_level`) with `bulk_domains` returned empty results in testing — use `bulk_domains` alone instead.
- The fields below are the documented schema; treat all of them as unverified for precision until tested individually. Clay `search-contacts`'s filter shape (`job_title_keywords`, `job_title_exclude_keywords`, `names`, `locations`, tenure ranges, etc.) is a second option with literal (not tag-based) title matching — see "Contact / decision-maker discovery" above.

- `member_full_name` (string) — free-text name search.
- `job_title` (string[]); `excluded_job_title`; `is_job_title_strict` (bool — exact vs fuzzy).
- `member_management_level` (enum[]) — `Specialist` | `Manager` | `Owner` | `Founder` | `President/Vice President` | `Director` | `Senior` | `Head` | `C-Level` | `Partner` | `Intern`.
- `mapped_job_function` (string[]) — department/function.
- `member_location_raw_address` (string[]); `member_linkedin_username` (string[]); `member_description` / `member_certifications` (string[]).
- Tenure ranges (`{gte,lte}` months): `total_experience_duration_months`, `job_duration_months`.

`advanced_search` output rows carry `document_id` and `member_linkedin_username` for downstream enrichment. Clay `search-contacts` rows carry `profile_id` and a full LinkedIn `url` instead — see above.

## Integration with `/tam-build` (Layer 1)

| tam-build step | A-Leads tool | Usage |
|---|---|---|
| Company universe discovery | `aleads_company_search` | ICP firmographic + signal filter search; one query can return the whole universe → size it with `meta.total_count` and pull bounded pages |
| Crawl-derived signals | `aleads_company_search` | `pricing_available` / `demo_available` / `free_trial_available` / `technologies_used` — skip a Spider crawl where A-Leads already has the signal |
| Demand signals | `aleads_company_search` | `job_posting_title` / `job_posting_seniority` as a hiring-velocity proxy |
| Contact discovery (names/titles only — NO email reveal) | Clay `search-contacts` OR A-Leads `advanced_search` with `bulk_domains` alone (both domain-scoped, both live — see "Contact / decision-maker discovery" above) | find ICP people at target companies; Clay caps ≤3 domains/call and yields `profile_id` + LinkedIn `url`; A-Leads `bulk_domains` rows carry `document_id` + `member_linkedin_username` — either feeds the later Layer-2 slice |
| Domain → firmographics | `aleads_company_search` (with `bulk_domains`) | verified 2026-07-12 to return full rows directly; **paginate `page:0,1,2,…` for lists over ~25 domains** (gotcha #1) |
| Lookalike / similar companies | **`/disco-like`** | the MCP has no `/similar`; DiscoLike is the lookalike spine |

## Integration with `/email-waterfall` (Layer 2)

| waterfall step | A-Leads tool | Usage |
|---|---|---|
| Work-email finder (real-named row, no email) | `aleads_find_email` / `aleads_bulk_find_email` | **A-Leads is the primary first-attempt finder** (operator directive). name + domain → work email with a `quality` flag; loop bulk in ≤10-row batches over the slice |
| Email verification | **Deliverable.co — NOT A-Leads** | ⚠ **A-Leads verify is RETIRED (operator directive 2026-06-16).** Email verification routes to **Deliverable.co** (`scripts/deliverable_verify.mjs`) — a two-in-one verify + catch-all (`email_status` + `is_catch_all` in one call). `aleads_verify_email` / `aleads_bulk_verify_email` still exist in the MCP but are **never used** in our flow. See `/email-waterfall` → Verification routing. |
| Phone enrichment | `aleads_find_phone` | LinkedIn username → phone; `null` when none on file |

**Residue only — A-Leads first is a HARD RULE** (see `/email-waterfall`). BetterContact runs ONLY on rows A-Leads couldn't close: no work email found, or an email (existing or A-Leads-found) that came back `invalid` / `catch_all` / catch-all-not-safe. It's the all-in-one finder+verify+catch-all waterfall — ideal for that residue/long-tail recovery, **never the first pass, never a high-volume shortcut.** Prospeo / WizLeads only after that. A finder-found email from any non-BetterContact provider still goes through the Deliverable.co verify + catch-all gate.

## Cost Governance Gate

Run `/api-cost-governance` before any A-Leads enrichment at scale. Search (`company_search` / `advanced_search`) draws on the large metered `advanced_search` pool (cheap per record). The spend that matters is **Layer 2**: `find_email` / `verify_email` are 1 credit per successful result, `find_phone` is the priciest per the phone pool. Preview rows × per-result cost against the run ceiling before a slice; the one upfront preview is the sanctioned approval for the batch (don't re-confirm per row).

---

## Appendix — legacy direct REST API (fallback only)

The direct REST API at `https://api.a-leads.co/gateway/v1` (`company-search`, `search/*`, `reverse-email-lookup/*`) is **superseded by the MCP** and kept only as a documented fallback. Its state when last probed (2026-06-12): auth passed (wrong key → 401, real key → through), the bulk **file-management** reads worked via `api_key`-in-body, but **every search/enrichment EXECUTION endpoint returned `500`** after auth, and two returned `403`. The MCP connector now does what those endpoints couldn't, so there is no need to chase the REST 500 anymore.

- Key (if ever needed): `ALEADS_API_KEY` in `scripts/.env` (32-char). `/preflight-credentials` checks presence.
- Self-test: `node "$(git rev-parse --show-toplevel)/outbound/scripts/aleads-selftest.mjs"` — probes the REST families. **Legacy** — prefer the MCP; only run this if you are deliberately testing the old REST path.
- The full REST schema/handoff history was removed from this skill on the MCP migration (2026-06-16); it lives in git history if needed.

---

## Related Skills

- `/tam-build` — Layer-1 consumer (`company_search` / `advanced_search`)
- `/email-waterfall` — Layer-2 consumer (`find_email` / `find_phone`; **email verification → Deliverable.co, not A-Leads**)
- `/lead-list-tech-stack-research` — data-tool fit map; A-Leads is the primary MCP-accessible contact/company source
- `/disco-like` — lookalike/similar companies (the MCP has no `/similar`)
- `/data-point-discovery` — A-Leads is a primary Layer-1 obtainability source
- `/api-cost-governance` — required cost/balance gate before any paid A-Leads call

## Activity Log Protocol

Before client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block). After any material step, **append** a one-line entry (newest first) to its LOG and refresh CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Full protocol: `client-activity-log.md`.
