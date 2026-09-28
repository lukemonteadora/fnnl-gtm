# Provider Capability Matrix (list production)

**What this is.** What each of FNNL's six approved tools can actually do for list production (company discovery, people discovery, email finding, verification, and the list's workbench and sending ends), written 2026-09-24. `outbound/reference/provider-routing.yaml` routes on it. `outbound/stack-contract.yaml` decides which tools are in the stack and owns the email order; where this file and the contract disagree, the contract wins and this file is the thing to fix. Re-check a row whenever a tool's plan or API changes, and date the change here.

**Read this first: nothing here is live yet.** All six tools are `chosen` in the contract, not `live`. No row below has been proven by a call against FNNL's own account. A "Y" means the capability is documented (in the contract or a live tool schema), not that it has worked for FNNL.

**How it was checked. No credits were spent and no data call was made.**
- **Stack contract notes** for every tool (`approved_stack`, the `lead_data` slots, `infrastructure.sending_platform`), plus `outbound/scripts/credential-registry.json`.
- **Live MCP tool schemas, read with ToolSearch on 2026-09-24 (reading a schema calls nothing):**
  - Prospeo: `search_person`, `search_company`, `enrich_person`, `bulk_enrich_person`, `enrich_company`, `bulk_enrich_company`, `search_suggestions`, `get_account_info`.
  - GetLeads: `count_contacts`, `export_contacts`, `lookup_decision_makers`, `getleads_enrich_person_batch`, `getleads_get_emails_from_linkedin_batch`, `getleads_get_linkedin_urls_from_emails_batch`, `get_fair_use`, `getleads_health`, `getleads_contacts_health`, `get_wallet_balance`.
  - Clay: `get-current-workspace`, `list_subroutines`.
- **Which account each connector is signed in to was NOT checked.** The contract records Prospeo's connector account as unproven, Clay's connector was once pinned to a previous company's workspace, and two GetLeads connections were present in the session (one keyed, one OAuth). A reading from the wrong account is worse than no reading, so the free calls are listed in the Live re-check section below and have not been run.
- **Not visible in the session that wrote this:** the AI Ark MCP (registered at local scope for this repo by `outbound/scripts/setup-ai-ark-mcp.ps1`), the PlusVibe MCP, and the local MillionVerifier MCP (`.mcp.json`). Their rows come from the contract notes, the credential registry and, for MillionVerifier, the repo's own server file `outbound/scripts/mcp/millionverifier_mcp.mjs`.

**Legend.** Y = supported. N = not supported. PARTIAL = supported with a material limit. UNVERIFIED = no primary evidence either way. N (policy) = the tool may technically do it, but an FNNL rule forbids it. Citation keys (for example [C-enrich]) resolve in each tool's evidence list in section (b).

---

## (a) Capability matrix

Split into three tables for width. Rows are always the six tools. Clay and PlusVibe are never data providers in FNNL; they appear so the matrix covers the whole approved stack.

### Table 1. Discovery

| Tool | Company discovery | Lookalike discovery | People discovery (no email reveal) | Exact-title filtering | Tenure / new-in-seat | Company matching key |
|---|---|---|---|---|---|---|
| **AI Ark** | **Y, the source of truth.** `company_search` over 70M+ companies with firmographic, technographic, funding, headcount-growth and geo filters. Enums must be resolved first (`industry_search`, `technology_search`, `location_search` or the `ark://reference/*` resources); guessed values silently return wrong results. Page size 25 by default, 100 max, 0-based, with `totalElements`. [C-disc] | UNVERIFIED | **Y.** `people_search`, 400M to 500M profiles (vendor claim, unaudited), returns title, seniority, function and company linkage without revealing email. [C-cdisc] | UNVERIFIED | UNVERIFIED | UNVERIFIED (company linkage exists; which key it filters on is not recorded) |
| **Prospeo** | **Y.** `search_company`, 25 per page, up to 1,000 pages, 1 credit per page that returns results. Firmographic, technographic, funding, headcount band and custom min/max, headcount growth, job-posting, news and key-executive-change filters. [P-schema] | **Y in the schema, untested.** `company_lookalike` takes a seed `domain`, up to 10 company or person ids, `icp_text` and a `minimum_tier`. Not recorded in the contract. [P-schema] | **Y.** `search_person`, 25 per page, 1 credit per page that returns results, with `max_person_per_company`. Email and mobile come back as obfuscated previews with a status. [P-schema] | **Y.** `person_job_title.match_mode` is CONTAINS, EXACT or SIMILAR, plus `boolean_search` and `smart_intensity`. [P-schema] | **Y.** `person_time_in_current_role` and `person_time_in_current_company` (months), and `person_job_change` (new company or promotion within 30 to 365 days). [P-schema] | Company website (`company.websites`), company name, company LinkedIn URL; enrich also takes `company_id` / `person_id`. [P-schema] |
| **GetLeads** | **PARTIAL.** No company-only search tool in the schemas read. Contact rows carry company fields, so a company list is derived from contacts (`export_contacts` with `max_per_company`). The contract makes it the deliberate second source, the gap-fill when an AI Ark universe comes back thin (the widening top-up in `provider-routing.yaml` `layers.company_discovery`; filter-first discovery, operator decision 2026-09-28). [G-schema, C-disc] | N. No seed input in the schemas read. [G-schema] | **Y, on a bare domain.** `count_contacts` (an exact count that reveals no record, 0 credits per its schema but on the paid plan and its fair use) and `export_contacts` take `domains[]`, `job_titles`, `seniority`, `personas` and many company filters. `lookup_decision_makers` takes one domain but always returns VALID emails and bills 1 credit per record, so it is a reveal, not discovery. [G-schema] | **PARTIAL.** The schema does not describe how `job_titles` matches. `where_sql` takes a WHERE predicate on catalog fields, which is the route to an exact match (untested on FNNL's account). [G-schema] | **Y.** `job_start_date_min` / `job_start_date_max` (current-role start date). [G-schema] | Bare domain (`domains[]`), `email_domain`, company LinkedIn URLs, a saved `domain_list_id`. [G-schema] |
| **MillionVerifier** | N | N | N | N | N | Email address only. [MV-mcp] |
| **Clay** | N (policy). Clay's own search spends Clay credits, which the zero-workbench-credit rule forbids. [C-clay] | N (policy) | N (policy) | n/a | n/a | n/a (rows arrive by inbound webhook) |
| **PlusVibe** | N (sending platform) | N | N | n/a | n/a | n/a |

### Table 2. Enrichment

| Tool | Email finding | Email status returned by the tool | Phone | Company enrichment | Employee count (field; banded or exact) | LinkedIn URL |
|---|---|---|---|---|---|---|
| **AI Ark** | **Y.** REST `/v1/people/email-finder`, 0 credits when no valid email is found. Never the bulk `/v1/people/export`, which bills 0.5 credits per profile even on a miss. [C-enrich] | **Y, labelled.** CATCH_ALL is its own email type beside SMTP, verified at reveal time by a third-party engine. It is a provider signal, kept as its own column, never the send gate. [C-enrich] | UNVERIFIED. The contract records no phone source, so the routing file has no phone layer. | UNVERIFIED beyond the search fields | UNVERIFIED (headcount filters exist; the returned field type is not recorded) | UNVERIFIED |
| **Prospeo** | **Y.** `enrich_person`: 1 credit when an email is returned, 10 with mobile, nothing when no one matches. `bulk_enrich_person` takes 25 per MCP call; the contract records 50 per REST request. Minimum match is a LinkedIn URL, an email, a `person_id`, or a name plus a company identifier; LinkedIn-URL-alone is unproven. [P-schema, C-enrich] | **PARTIAL.** Per the contract, `status` is binary and collapses catch-all into valid, so read `verification_method` (SMTP or BOUNCEBAN). The MCP's search previews show VERIFIED, UNVERIFIED or null, while the contract says VERIFIED or UNAVAILABLE: settle the vocabulary on the first real call. [C-enrich, P-schema] | **Y in the schema.** `enrich_mobile`, 10 credits per match. Not recorded in the contract and not proven, so not routed. [P-schema] | **Y.** `enrich_company` / `bulk_enrich_company` (25 per call), 1 credit per match: headcount, industry, revenue, tech stack, funding, job postings, HQ phone. [P-schema] | **Both, as filters:** `company_headcount_range` bands and `company_headcount_custom` min/max. The returned field's type is UNVERIFIED. [P-schema] | Y as an input; returned in the person profile (shape UNVERIFIED). [P-schema] |
| **GetLeads** | **Y.** Email sits on contact rows (the `email_status` filter advertises only VALID). `getleads_enrich_person_batch` takes first + last name plus `company_name` and/or `email_domain`; `getleads_get_emails_from_linkedin_batch` takes a LinkedIn URL. 1 credit per successful row. Not an email rung in the contract's waterfall. [G-schema, C-enrich] | **PARTIAL.** Only VALID is advertised. Whether catch-all addresses are left out or labelled is UNVERIFIED on FNNL's account. [G-schema] | Y. `require_phone` filter and reverse phone lookups exist. Not routed. [G-schema] | PARTIAL. Company fields on contact rows only; no company-by-domain enrich tool in the schemas read. [G-schema] | **Both.** `employee_profiles_on_linkedin_min/max` is a hard cutoff on an exact LinkedIn profile count; `employees_min/max` and `company_size` select overlapping LinkedIn bands. [G-schema] | **Y.** `getleads_get_linkedin_urls_from_emails_batch`: work email in, LinkedIn URL out, 1 credit per success. [G-schema] |
| **MillionVerifier** | N | **Y, it is the verifier.** See Table 3. [MV-mcp] | N | N | N | N |
| **Clay** | N (policy). `list_subroutines` offers Work Email, Mobile Phone Number, Company Latest Funding, Website Traffic and Website Technology Stack. All are Clay's own credit-spending functions, blocked by `.claude/hooks/clay-credit-guard.mjs`. [CL-schema, C-clay] | n/a | N (policy) | N (policy) | n/a | n/a |
| **PlusVibe** | N | N | N | N | N | n/a |

### Table 3. Verification, cost, limits, access

| Tool | Verification | Catch-all | Cost model | Rate and call limits | Access route in this repo |
|---|---|---|---|---|---|
| **AI Ark** | N as a service (reveal-time labels only). [C-enrich] | Labels CATCH_ALL at reveal; not the gate. [C-enrich] | Credits. The contract calls the pricing vendor-confirmed but records no figures here. email-finder is free on a miss; export bills 0.5 per profile regardless. [C-enrich] | Page size max 100. Rate limit and concurrency UNVERIFIED. | Hosted MCP `ai-ark` (11 tools; the key rides in the URL as `?token=`; registered at local scope for this repo only) and REST `https://api.ai-ark.com/api/developer-portal/v1/`, `AI_ARK_API_KEY`. Not native in Clay: an HTTP API column needs Clay's Growth plan, or push rows in by webhook. [R, C-clay] |
| **Prospeo** | N as a service. | Collapsed into `status`; recover it from `verification_method`. [C-enrich] | Credits: search 1 per page with results; enrich 1 per email, 10 with mobile, 0 on no match; free re-enrichment within 90 days. USD pricing UNCONFIRMED (third-party figures only), so the email order is not yet proven cheapest-first. [P-schema, C-enrich] | `search_suggestions` 15 requests per second (free). Bulk 25 per MCP call, 50 per REST request. Other limits UNVERIFIED. [P-schema, C-enrich] | MCP connector `prospeo` and REST, `PROSPEO_API_KEY`. Native Clay integration with bring-your-own-key. The connector's account is unproven. [R, C-clay] |
| **GetLeads** | N as a service. Its emails arrive already filtered to VALID; that is never the send gate. [G-schema] | Not labelled (see Table 2). | **Two separate balances.** Plan credits cover search, export and enrich (1 credit per record returned or per successful enrich row; counts bill 0 credits but draw on the plan's fair use, and GetLeads is a paid plan, never free). Prepaid wallet cash covers only live scrapes. `insufficient_wallet_cash` never means "out of credits". FNNL's plan tier is not recorded. [G-schema, C-intent] | `lookup_decision_makers` 100 per call; export up to 50,000 rows per job; `max_per_company` up to 50; fair use resets daily at 00:00 UTC. Concurrency UNVERIFIED. [G-schema] | Hosted MCP by OAuth, no `.env` key. The REST API has no public docs, so it cannot be keyed inside Clay today. [C-intent, R] |
| **MillionVerifier** | **Y.** Real-time, one synchronous call per email (`GET /api/v3/?api=KEY&email=...`, optional `timeout` 2 to 60 s). Bulk upload, status and download on a separate host; the bulk stop path comes from the vendor's sample code, not the live docs. [MV-mcp] | **Y, its own result.** resultcode 1=ok, 2=catch_all, 3=unknown, 4=error, 5=disposable, 6=invalid. It labels a catch-all domain; it cannot confirm that the mailbox exists. [MV-mcp, C-verify] | Credits: 1 per real-time call. The bulk per-email rate is not confirmed, the USD price per credit is not recorded, and whether an `unknown` or `error` result bills is not recorded. The credits endpoint is free. [MV-mcp, C-verify] | Rate limit not recorded (UNVERIFIED). The vendor test key `API_KEY_FOR_TEST` is honoured only by real-time verify and returns random verdicts. [MV-mcp] | Local MCP `millionverifier` (`.mcp.json`) and REST, `MILLIONVERIFIER_API_KEY`; the key travels as a URL query parameter, so every error text is scrubbed. The list-production runner is `outbound/scripts/millionverifier_verify.mjs` (verdict cache, 90-day revalidation, dry-run cost count). Whether Clay offers it as a native column is UNVERIFIED. [MV-mcp, C-verify] |
| **Clay** | N | N | **Zero Clay credits, ever.** Bring-your-own-key columns still use Clay "Actions" (a separate platform-usage meter). Webhook import, viewing, manual edits, formulas, filters and CSV export cost nothing. [C-clay] | Inbound webhook: about 10 requests per second per workspace (`workbench_push.mjs` paces at 8), 100 KB per row, 50,000 lifetime submissions per webhook source, and no upsert, so a re-push appends duplicates. Webhooks need the Growth plan (UNVERIFIED for FNNL). [C-clay] | REST, inbound webhook (`outbound/scripts/workbench_push.mjs`) and MCP (only the four free read calls are allowed, hook-enforced). The workspace must be Dorsia Labs, ID 651677. [C-clay] |
| **PlusVibe** | N | N | API, webhooks and MCP need the Business plan (77 USD per month minimum). [C-send] | 5 requests per second; `workspace_id` is required on every call. [C-send] | REST `https://api.plusvibe.ai/api/v1` (header `x-api-key`) and a hosted MCP that passes the key as a URL query parameter. Leads go in with `POST /lead/add`. Its lead-export columns, which `list_qa.py --active-leads` and `list_feedback.py` would read, are UNVERIFIED. [C-send, R] |

---

## (b) Per tool: unique capabilities, failure modes, evidence

### AI Ark

**Unique capabilities**
- The company universe of record, with headcount-growth and technographic filters in one search.
- People discovery that keeps reveal separate, so a slice is qualified before anyone pays per contact.
- A reveal-time CATCH_ALL label, which is why it leads the email waterfall.
- An email finder that costs nothing on a miss.

**Failure modes and limitations**
- **Guessed enum values fail silently.** Always resolve industry, technology and location values first.
- **The wrong endpoint doubles as a billing trap.** `/v1/people/export` bills every profile, found or not.
- **Most of its surface is unverified here:** title-match semantics, the headcount field type, tenure fields, phone, lookalike, and any free balance call.
- **Not native in Clay.** Reaching it from a Clay column needs the Growth plan; the free path is calling it from a script and pushing rows in.

**Evidence**
- [C-disc] `stack-contract.yaml` `lead_data.company_discovery.notes`.
- [C-cdisc] `lead_data.contact_discovery.notes`.
- [C-enrich] `lead_data.contact_enrichment.notes`.
- [R] `credential-registry.json` `providers.ai_ark` and `outbound/scripts/setup-ai-ark-mcp.ps1`.

### Prospeo

**Unique capabilities**
- An exact-title match mode in its schema (`EXACT`), plus tenure and job-change filters, which makes it a strong candidate for a contact-level "new in seat" signal (AI Ark's equivalents are unverified).
- A company lookalike filter, the only lookalike capability visible so far (AI Ark's is unverified). It is untested and not yet in the contract. A lookalike is `/tam-build`'s exception route since 2026-09-28, never the default.
- Free filter-value lookups (`search_suggestions`) before any paid search.
- Mobile numbers on the same enrich call, at 10 credits a match.

**Failure modes and limitations**
- **Its `status` field collapses catch-all into valid.** Read `verification_method`, and re-verify every address with MillionVerifier regardless.
- **Pricing is unconfirmed**, so the contract's AI Ark then Prospeo order is not yet proven cheapest-first.
- **Two bulk limits:** 25 per MCP call, 50 per REST request. Batch to the one the route actually uses.
- **Status vocabulary differs** between the contract (VERIFIED / UNAVAILABLE) and the MCP's search preview (VERIFIED / UNVERIFIED / null).
- **Contract order still binds.** Prospeo runs only on rows AI Ark already attempted, and never on a catch_all.

**Evidence**
- [P-schema] Prospeo MCP tool schemas, read 2026-09-24 via ToolSearch (no calls).
- [C-enrich] `lead_data.contact_enrichment.notes`.
- [C-clay] `lead_data.list_workbench.notes` (native Clay integration).

### GetLeads

**Unique capabilities**
- **Exact counts at 0 credits** (`count_contacts`, on the paid plan and its fair use) on every filter, including keyword filters over company About text and person bios. That sizes a slice before any spend.
- **An exact LinkedIn employee-profile count** with a hard-cutoff filter, next to the usual overlapping bands.
- **A current-role start date filter**, a second route to a "new in seat" signal.
- **Email to LinkedIn URL** in a batch, which the contract's LinkedIn backfill uses.

**Failure modes and limitations**
- **No company-only search.** A company list is derived from contacts, so companies with no contacts in its database are invisible.
- **`lookup_decision_makers` always reveals emails** and bills per record, so it is not a discovery step.
- **Only VALID emails are advertised.** On catch-all-heavy markets that can silently cap coverage.
- **MCP-only.** It cannot run as a keyed column inside Clay.
- **Two balances.** A wallet failure is not an out-of-credits failure.

**Evidence**
- [G-schema] GetLeads MCP tool schemas, read 2026-09-24 via ToolSearch (no calls).
- [C-intent] `lead_data.intent_signals.notes`.
- [C-disc] `lead_data.company_discovery.notes` (second source).

### MillionVerifier

**Unique capabilities**
- **Deliverability and the catch-all label in one call**, with catch-all as its own result. That is what the Catch-All Timing gate needs.
- **Synchronous real-time verify**, so the runner needs no submit-and-poll loop.
- **A free credits endpoint**, the contract's first live proof for this tool.

**Failure modes and limitations**
- **It labels a catch-all domain; it cannot tell whether that mailbox exists.** That is the nature of accept-all domains. AI Ark's reveal-time label stays as a second signal.
- **The key rides in the URL**, so it can appear in the vendor's own request logs. Everything this repo prints is scrubbed.
- **Unknowns about cost:** the bulk rate, the USD price per credit, and whether `unknown` or `error` bills.
- **The test key returns random verdicts.** `millionverifier_verify.mjs` refuses to write those into the shared cache.
- **Proven so far:** only the plumbing and a real-time round trip on the vendor's test key (2026-09-22). Credits and bulk have not succeeded on a real FNNL account.

**Evidence**
- [MV-mcp] `outbound/scripts/mcp/millionverifier_mcp.mjs` (endpoints, response fields, resultcodes, test-key behaviour).
- [C-verify] `lead_data.email_verification.notes` (gate mapping, cost, proof status).
- `outbound/scripts/millionverifier_verify.mjs` and its offline test `outbound/scripts/tests/test_millionverifier_verify.py`.

### Clay

**What it is here.** The list workbench: where a list is built and watched, never a data vendor. Its own search, enrichment and subroutine tools spend Clay credits and are forbidden (the zero-workbench-credit rule, enforced for Claude Code by the project hook).

**Failure modes and limitations**
- **No read-back below Enterprise.** The session can write rows in but cannot read the table back, so the local CSV stays the working copy and operator edits return by manual export.
- **No upsert.** A second push of the same file appends duplicates. Push only the final, post-QA send file, and treat an edited export as a new send file.
- **Auto-run is on by default** on new tables and would fire enrichment columns on every arriving row. It must be turned off before any push.

**Evidence**
- [C-clay] `lead_data.list_workbench` (`credit_policy_rule`, `build_protocol`, `notes`).
- [CL-schema] Clay MCP schemas for `get-current-workspace` and `list_subroutines`, read 2026-09-24 via ToolSearch (no calls).

### PlusVibe

**What it is here.** The sending platform. It enters list production at two points: the lead upload, and the lead export that list QA reads to catch duplicates against leads already in a live campaign.

**Failure modes and limitations**
- **Its lead-export columns are UNVERIFIED.** `list_qa.py --active-leads` and `list_feedback.py` must be checked against a real export before they are trusted.
- **Campaign create is two-step**, and triage write-back goes through `/lead/data/update`, not `/lead/update/status` (which controls sending state).
- **Not programmable below the Business plan.**

**Evidence**
- [C-send] `infrastructure.sending_platform.notes`.
- [R] `credential-registry.json` `providers.plusvibe`.

---

## (c) What `provider-routing.yaml` takes from this

1. **Email order is the contract's, not this file's.** AI Ark reveal, MillionVerifier, then Prospeo only on rows AI Ark left blank or MillionVerifier rejected, then MillionVerifier again. A catch_all goes to the holdback and never to Prospeo. Prospeo never opens a row AI Ark has not attempted. An AI Ark outage no longer changes that: a tool that is out of balance or down stops the step and asks the operator (`/tool-balance-guard`, operator decision 2026-09-28), and only an operator-approved skip (`list_waterfall.py plan ... --operator-approved-skip`) lets Prospeo take those rows.
2. **Company discovery** is filter-first (operator decision 2026-09-28): AI Ark `company_search` on the resolved filters, with GetLeads `count_contacts` as the size check and the widening top-up when the universe comes back thin. A lookalike is the exception route, and reveal or lookup-by-person calls are never discovery rungs.
3. **People discovery** is AI Ark `people_search`, then GetLeads on `domains[]`, then Prospeo `search_person`. The relative order of the last two is unverified.
4. **Headcount cross-check** can draw on all three data tools (AI Ark filters, GetLeads' exact profile count, Prospeo's range and custom filters). Which is most accurate has not been measured.
5. **LinkedIn backfill** ends with GetLeads' email-to-LinkedIn batch, the one step here whose schema shows the capability directly.
6. **Phone** stays unrouted. Prospeo's schema offers mobile at 10 credits a match, but the contract records no phone source.
7. **Verification** is MillionVerifier through `millionverifier_verify.mjs`, gate-mapped by resultcode, with a 90-day cache.

**Found in the live schemas but not yet in the contract** (fold into the contract on its next edit, by operator directive only):
- Prospeo's `company_lookalike` filter.
- Prospeo's tenure and job-change filters, and GetLeads' `job_start_date_min/max`, as candidate "new in seat" signals.
- Prospeo's 25-per-call MCP bulk limit beside the 50-per-request REST limit.
- The Prospeo status vocabulary difference noted above.

---

## Live re-check (free calls only)

**What this section is.** The calls that prove each tool works on FNNL's own account without spending anything. None has been run from FNNL yet. When one runs, add a dated line under Readings and mirror the figure in `outbound/scripts/api-balance-ledger.md` (its "Recording a free live re-check" note says how). Never record a figure that did not come back from a call, and confirm the call answered for FNNL's account before recording it.

| Tool | Free call | What it proves | Status (2026-09-24) |
|---|---|---|---|
| MillionVerifier | `millionverifier_get_credits` on the local MCP, or `node outbound/scripts/millionverifier_verify.mjs --credits` | The key works on FNNL's account, and the credit balance. The contract names this as the tool's first live proof. | Not yet run on FNNL's own key. |
| Prospeo | `get_account_info` (free per its schema) | Credits remaining, plan name, renewal date, and which account the connector is signed in to. | Not yet run. |
| GetLeads | `get_fair_use` (0 credits), `getleads_health` (no key needed), and `get_wallet_balance` (wallet cash, a read) | Plan type and remaining fair use, reachability, and the separate wallet balance. | Not yet run. Two GetLeads connections were present; confirm which one is FNNL's before recording. |
| Clay | `get-current-workspace` (one of the four allowed free read calls) | The connector points at workspace 651677 (Dorsia Labs). | Not run in this session; the contract records a check on 2026-09-22. |
| AI Ark | UNVERIFIED: no free balance or health call is recorded. The setup script's check is a `company_search` of size 1, whose credit cost is not recorded, so it is not listed as free. | | Open. Find a free account call in AI Ark's MCP tool list or docs. |
| PlusVibe | UNVERIFIED: no free balance or health call is recorded in the contract. | | Open. |

### Readings

_(none yet; format: `YYYY-MM-DD, <tool>, <call>, <what it returned>, <account confirmed how>`)_

---

## Open items (each is free or costs a few credits)

1. Run the free calls above on FNNL's own accounts, then promote each tool's slot in the contract only after a real call succeeds.
2. **AI Ark:** read its MCP tool list (11 tools), find a free account call, and confirm title-match semantics, the headcount field type, tenure fields and phone.
3. **Prospeo:** settle the status vocabulary on the first real enrich, read real pricing from the logged-in account, and test `company_lookalike` on one known seed.
4. **MillionVerifier:** record the rate limit, whether `unknown` and `error` bill, and whether Clay offers it as a native column.
5. **PlusVibe:** read one real lead export and record its columns for `list_qa.py --active-leads` and `list_feedback.py`.
6. **GetLeads:** confirm how `job_titles` matches, and whether catch-all addresses are left out or labelled on FNNL's plan.
