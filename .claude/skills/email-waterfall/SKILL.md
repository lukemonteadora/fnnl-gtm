---
name: email-waterfall
description: "Reveal and verify work emails only for the contacts a wave picks (Aaron's launch set), after the TAM and any required /lead-scoring. Rung order is provider-routing.yaml's; scripts/list_waterfall.py works each person to a valid email. A tool out of balance or down stops per /tool-balance-guard."
---

# Email Waterfall

**From the former description:** Reveal missing work emails and verify deliverability only after /lead-scoring has produced an eligible, score-ordered campaign list. In the first wave the confirmed slice is the whole scored, eligible TAM, so reveal and verify it in one pass with P1 to P5 as processing order only (every tier ships, and the \$100 run budget still stops and asks). Email yield is never a send gate. The rung order is the stack contract's, mirrored in outbound/reference/provider-routing.yaml, and scripts/list_waterfall.py works the same person until a valid email or the rungs run out, then promotes the next approved person at that account, and stops the account at its two-contact cap. Preserve all scoring fields and run before /list-quality-scorecard or platform upload. (Updated 2026-09-28: in the first wave the confirmed slice is the contacts Aaron's launch set picks, and `/lead-scoring` is optional for a first wave that ships every tier.)

## Canonical Profile Root

All profiles/<business-slug> paths in this skill resolve under:

```text
<outbound>/profiles
```

Here `<outbound>` is the root of this skill library - resolve it to wherever the library is currently checked out (local Documents, OneDrive, or a git worktree); never hardcode an absolute path. Do not create client profiles under a `profiles/` folder at your current working directory.

## Stack Resolution (read before any tool step)

This skill names **capability roles**, never specific vendors. Resolve every role to the tool this workspace has actually chosen by reading:

```text
outbound/stack-contract.yaml
```

Roles this skill uses: contact-discovery source, email finder, email verifier, waterfall enricher, sending platform, list workbench (never a stop: an unset or not-ready list workbench falls back to a native CSV, see "List workbench" below). (The third-party web-search API role is retired under the no-AI-API rule, operator directive 2026-09-22: `linkedin_url` backfill now runs through the contact-discovery source and the stack contract's contact-enrichment tools, with Claude's built-in WebSearch as the last resort. See "Backfill the gaps".)

**If a role this step needs is empty or missing in the contract, STOP and route to `/stack-setup`.** The list workbench is the one exception: it is never a stop for this skill. Never substitute a guessed vendor, and never hardcode a tool name into an artifact this skill writes.


This skill turns a raw lead or company-contact CSV into a send-safe lead CSV.

It does not own list targeting. Run `/icp-prompt-builder` first when the source list may contain wrong-fit companies or people.

This is the **Layer-2 (per-contact) step** in the TAM model: it runs on the **confirmed campaign slice** of the TAM (`tam/tam.csv` from `/tam-build`), never during the TAM build itself. Per-contact email and phone reveal and verification cost per credit, so they happen here, and only for contacts confirmed into a campaign that is about to send.

**In the first wave the confirmed slice is every eligible contact in the campaigns Aaron's launch set puts on `now` (Aaron process alignment, operator directives 2026-09-22 and 2026-09-28; supersedes the "only for the slice that is going live, never across the entire TAM" wording of the 2026-06-29 directive).** `/campaign-strategy` drafts the whole-TAM first wave, the Aaron campaign and copy call (`/phase-3-list` step 5, `aaron-lane.md` Call 2) runs before any verification and names the launch set, and this skill then reveals and verifies every eligible contact in that set in one pass, every tier. Contacts in campaigns he puts on `later` or `drop` are never revealed up front. Score order is processing order inside that pass, never a release schedule that holds P2 to P5 back. Aaron's Sep 21 run is the model: the whole TAM mapped (about 19,600 leads across about 12,400 companies), revealed and verified, then sent in one week on one offer. What does not change: the no-reveal firewall during the TAM build, the finder-then-verifier-then-residue order below, the tool order the stack contract records, and the $100 run budget stop. A whole-TAM reveal that would cross the budget still stops and asks (Stop Gates below).

**Order, state and QA are shared with the rest of list production (added 2026-09-24).** The rung ORDER for email, phone and people discovery is the stack contract's waterfall (`lead_data.contact_enrichment.notes` in `outbound/stack-contract.yaml`), mirrored in machine-readable form in `outbound/reference/provider-routing.yaml`. Precedence runs contract, then yaml, then this skill's prose: if they ever differ, the higher one wins and the lower one is fixed. The email order today is the contract's: verify first any email the row already carries, then the email finder across the whole survivor set, the verifier on everything it returned, then the residue rung (called the waterfall enricher below, the contract's gap-fill finder) only on rows the finder left blank or the verifier rejected, and the verifier again. A `catch_all` verdict is not a rejection: it goes to the holdback, never to the residue rung (the yaml records this as `on_catch_all: stop`). The state machine, the same-person-first rule, person fallback, the per-account stop, attempt history and the verification cache are defined once in `outbound/reference/list-production-standard.md` and run by `scripts/list_waterfall.py` (see "The planner loop" below). A failed email is not a failed person: when one person's waterfall is exhausted, the next approved person at that account is promoted, and the account stops as soon as it holds its required contacts.

## List workbench: build the send list where the operator can watch (HARD RULE, operator directive 2026-09-22)

By default, the campaign's verified send list is built in the list workbench (`run_state.list_workbench`, contract slot `lead_data.list_workbench`), so the operator watches it fill live instead of receiving a CSV assembled out of sight. The full mechanics live in the stack contract at `lead_data.list_workbench.build_protocol`; this section only says how this skill applies them.

- **Readiness check.** Read `list_workbench_tables.send_lists.<campaign-slug>` in the client's gitignored `profiles/<business-slug>/client-profile.yaml`. The table is ready only when `ready: true`, `auto_run_off: true` (a table that auto-runs columns on arriving rows can spend workbench credits) AND `webhook_url` is non-empty; the push script checks all three and exits 3 when any is missing. The operator creates the table and its webhook in the workbench UI; this session cannot create tables or columns.
- **The push.** Once `leads.verified.csv` has passed list QA (`/list-quality-scorecard` runs `list_qa.py`, which rewrites the file, and a webhook push appends and cannot remove rows, so an earlier push would leave rows in the table that QA later took out; `list-production-standard.md` section 13), push it with `node scripts/workbench_push.mjs --client <business-slug> --table send_list --stage verified --campaign <campaign-slug> --csv profiles/<business-slug>/campaigns/<campaign-slug>/leads.verified.csv` (add `--dry-run` to preview). Every row lands tagged `list_stage=verified`. Webhook import costs zero workbench credits, so the push is not paid spend. The script refuses to re-push the same CSV to the same table without `--force`, because webhook pushes append rows rather than update them.
- **The CSV stays the working copy.** The local `leads.verified.csv` is still what `/list-quality-scorecard` and the platform upload read, because the workbench's API cannot read a table back below its top plan tier. The table is the operator's live view of the list, not the file the next skill reads.
- **Fallback, never a blocker.** If `run_state.list_workbench` is unset or this campaign's send-list table is not ready, write the CSV natively and keep the waterfall moving. Say so at the top of the report and in the activity log: "list workbench not ready: verified list CSV-only".
- **Zero workbench credits (CLAUDE.md section 7, full text at `lead_data.list_workbench.credit_policy_rule`).** Email finding, verification, catch-all checks and the residue waterfall run only on FNNL's own keyed tools from the stack contract, either outside the workbench with the results pushed in, or in a keyed column the operator set up inside the workbench after it passed the contract's 1-to-5-row credit test. Never use the workbench's own email or phone waterfall, its native enrichment on its own account, its AI columns, or its connector's search, enrich or subroutine tools, even when a key is missing or failing: stop and report instead. Paid calls on FNNL's own keys still route through `/api-cost-governance`.
- **Verify the push.** Compare the rows pushed against the rows in the CSV and report "pushed N/N rows to send_list <campaign-slug> (list_stage=verified)". A shortfall goes at the top of the report.

## Material Decision Rule

When this skill reaches a material fork, name the realistic options, recommend the strongest path, and explain why the main alternatives are weaker before committing.

Ask before choices that affect spend beyond an approved budget, provider routing, source of truth, list quality, campaign direction, client-facing output, live systems, scraping or account risk, or legal/compliance risk. For low-risk reversible choices, state the recommendation and proceed.

Do not turn failed or unsafe paths into user-facing options. If this skill's QA rules or stop gates reject a path, filter it out and explain the blocker only when useful.

When asking the user, use the Claude Desktop native Interactive Inputs / Choice Prompts pattern from /clarification-first: recommended option first, short choices, and Custom answer last when a custom answer is plausible.

## Interaction Policy

Defers to `/autonomous-execution-policy`. Under `run_state.execution_mode = auto_execute` (the new-client default since 2026-09-24, paired with `review_protocol: phase_checkpoints` so a run stops only at the one checkpoint that closes each of the four phases, `outbound/reference/phase-protocol.md`; this skill runs in Phase 3 under `/phase-3-list`; `review_gates` is opt-in), proceed without pausing: pick the strongest option per this skill's rubric, record it to `run_state`/profile, and continue. Never re-ask a decision already in `run_state`, the profile, memory, or the operator's latest message. Stop only for the policy's hard-stops (spend over the approved ceiling, live send, credentials, provider/source-of-truth change, safety gates). On a long async wait, background-poll and move to other productive work. Never idle.

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short: record status, not raw output. Full protocol: `client-activity-log.md`.

## Inputs

Use a CSV with as many of these columns as available:

- `first_name`
- `last_name`
- `job_title` or `title`
- `linkedin_url`
- `company_name`
- `company_domain`
- `email`
- `email_status`
- `source`
- `source_arm` (the parallel source arm a row came from in a multi-source first wave, defined in `/lead-source-strategy`; `source` still names the vendor or website)
- `source_type`
- `source_url`
- `evidence_url`
- `signal`
- `fit_reason`
- `source_confidence`
- `service_offered`, `service_offered_source`, `own_best_client`, `own_best_client_source` (the per-contact copy variables and their evidence URLs, derived by Claude sub-agents from the prospect's own site per `/personalization-subagent-pattern`, never by a list workbench AI column; blank when the copy does not use them)
- `lead_score`, `priority_tier`, `score_confidence`, `score_reason`
- `send_eligible`, `exclusion_reason`, `contact_rank_in_company`, `same_wave_eligible`
- `score_version`, `scored_at`

Minimum useful input:

- Person-level row: `first_name`, `last_name`, and either `company_domain` or `linkedin_url`
- Company-level row: `company_domain`, then run contact discovery first to find people

## Lead-scoring spend gate

**`/lead-scoring` is optional for a first wave that ships every tier, and required when sending capacity forces a cut (list speed rules, operator directive 2026-09-26; `/phase-3-list` step 3).** When scoring is required, every TAM-backed path stops unless `run_state.status.scoring_stage == complete` and the input came from `tam/contacts.scored.csv` or a campaign slice that preserves its current score fields. For an external list, stop until `/lead-scoring` has written `campaigns/<campaign-slug>/leads.scored.csv`.

When scoring ran, reject any paid finder or verifier queue containing a row where `send_eligible != true`, `lead_score` is blank, `priority_tier` is blank, or `score_version` does not match the active rubric, and sort P1 through P5 by descending `lead_score`. When a first wave skipped scoring, the wave's pick order from `/campaign-strategy` sets the order instead, and a queue holding a suppressed, hard-no or excluded row is still rejected. Either order is processing order only: in the first wave every eligible tier is revealed and verified in the same pass, and no tier is held back or deleted (Aaron process alignment, operator directive 2026-09-22; supersedes "lower tiers stay queued").

The scored TAM is the source of truth for breadth. Any legacy wording below that says “good-fit companies,” “exact ICP personas,” or an `email_found` flag means the current `good` plus `maybe` marketable universe and every plausible buying role, with no assumed email flag. `/tam-build` owns contact discovery. This skill owns paid reveal and verification after scoring.

## Contact-list assembly: contact-discovery signals + company-signal join (Layer 1, BEFORE any email reveal). HARD RULE (operator directive 2026-06-29)

When a campaign slice's contact list is built from a `/tam-build` TAM slice, do TWO things **at Layer-1 cost (no email reveal, no per-contact credit)** before the finder/verify steps below:

1. **Pull contacts from the contact-discovery source and attach the Tier-1 contact-discovery signals** (`/data-point-discovery` Contact-discovery signal tier). Resolve the contact-discovery source from the stack contract; if that slot is empty, stop and route to `/stack-setup`. This is the **contact-level TAM, built UP FRONT across the good-fit company TAM** (the contact mirror of the company TAM, same timing as the company build, BEFORE `/campaign-strategy`), **not a per-slice pull.** A domain-scoped contact search over the good-fit company domains plus the ICP persona/seniority title filter returns name, exact `job_title`, a LinkedIn profile URL and location per contact: all Layer-1, with **no email reveal.** Tag each row with the Tier-1 signals the chosen source can actually return: `contact_new_in_seat` (the flagship why-now, from the source's role-tenure filter, e.g. current role started within the last 12 months), `contact_seniority` / `contact_function` (exact filters where the source has them, otherwise approximated from title keywords), `contact_geo` (location filter), and `contact_phone_available` / `contact_email_indexed` **only where the chosen source actually exposes those flags**. Where a source cannot return one of these, leave the column blank rather than fabricating it, and record the gap in the data-point catalog. **No email find, no verify, no waterfall enricher here:** this is contact DISCOVERY, not reveal. **Bound it to good-fit companies plus ICP-relevant personas/seniority** (the cost guard in `/data-point-discovery`). Built once up front so `/campaign-strategy` can slice on contact signals. **There is no contacts floor any more (operator directive 2026-07-12):** the old 100-contact floor is RETIRED, and campaign eligibility is measured purely on the company axis (500 target companies, `/campaign-strategy`'s HARD RULE). A slice qualifies on its company count even when its verified contacts come back fewer.
2. **Left-join the company's signals onto every contact by `company_domain`, prefixed `co_`.** Every contact at a company inherits that company's TAM signal columns (`co_billing_migration_signal`, `co_is_hiring_now`, `co_named_customers`, etc.) so a contact carries BOTH its own contact-level signals and its company's company-level signals. The join is a pure domain match against `tam/tam.csv`, proven 18/18 on a client build 2026-06-29. A contact whose company is not in the TAM slice keeps blank `co_*` columns (never fabricate them).

**High-volume default: scrape ALL ICP decision-makers, not one contact and not a capped committee (operator directive 2026-07-12, which supersedes the 2026-07-07 "2 to 4 roles" cap).** The default is now HIGH VOLUME (1,000 up to 20,000 leads per campaign, 2,000-to-30,000 sends/day per client). Contacts-per-company is the **primary** volume lever, so the up-front contact-discovery persona filter in item 1 is set to **every ICP job title the client's ICP lists** (5, 10, however many that segment names, and the full offer-generated title stack in `offer.title_stack` when the offer lock wrote one), pulled across **every company** in the qualifying set. Not 1-2 per company. Not a tight cap. Get all the decision-makers that match the ICP titles. This is what turns a lookalike that saturates at ~2,700 companies into a 10k+ lead campaign, and it is why a slice's eligibility is tested on companies (500) rather than on contacts.

**Scrape-all raises VOLUME, it does not loosen the paid-reveal gate (both rules hold together).** This widened pull is Layer-1 contact DISCOVERY only: no email find, no verify, no waterfall enricher. It raises how many contacts the contact-TAM holds per company, and therefore how many confirmed-campaign contacts become eligible for paid reveal once `/campaign-strategy` slices and the operator confirms the campaign. It is **not** licence to reveal emails during the TAM build, before any campaign is confirmed. The "no paid email enrichment until a contact is confirmed into a campaign" HARD RULE below is untouched: discovery scrapes all ICP titles, and reveal still happens only on the confirmed slice, which in the first wave is every eligible contact in Aaron's launch set.

**Per-company simultaneity cap (spray guard), enforced HERE. This is a SEND-time cap, never a scrape-time one.** Do NOT send to 5+ people at one company at once. It reads as spray, invites internal "are you getting these too?" replies, and hurts deliverability. **Under the scrape-all rule above, deep committees are now the NORM rather than the exception, so splitting and staggering is the standard path, not a rare special case.** Scrape every ICP title, then cut the send file so only a few of a company's contacts go out simultaneously: split the committee across campaigns or stagger the sends in time rather than one simultaneous multi-recipient hit. The two rules are complementary. Scrape-all sets how many contacts you hold. This cap sets how many you send at once. A deep committee is spent across waves instead of being thrown away at discovery. This per-company simultaneity cap is enforced at THIS step, the contact-list assembly, together with the campaign splits `/campaign-strategy` chooses. `/tam-build` builds the full, uncapped contact TAM and `/campaign-strategy` slices it; both defer the actual simultaneity cap to this assembly step, where the real send file is cut.

The default active-wave cap is exactly two contacts per company (`buyers.contacts_per_account` in the targeting spec, the same number as the rubric's `same_wave_contact_cap`). The planner starts each account with its top two approved people in buyer-priority order (buyer tier first, then `lead_score`, then `contact_rank_in_company`). **Person fallback (added 2026-09-24):** when one of them exhausts the waterfall without a verifier `valid`, the next approved person at that account is promoted and run from the first rung, written with `wave_slot = promoted_fallback` and a `wave_slot_reason`. Without it, a company whose top two had no findable email silently lost its slots. So the input to this skill keeps every `send_eligible` person at each account, rank 3+ included and still marked: they are the fallback pool. People the account does not need this wave go to `leads.stagger.csv`, never deleted.

**Verify-first is unchanged, and matters MORE at volume.** A bigger list does not relax the Verification Doctrine below: only an email the verifier returns as `valid` ships, and the added volume must NOT push bounce above the 3% auto-protect ceiling. Verification is the guardrail that lets volume scale safely, not a step volume gets to skip. Full doctrine:.

**Contact DISCOVERY priority: primary-source-first, exhaust-then-gap-fill (HARD RULE, operator directive 2026-06-29).** Finding the decision-makers/contacts at the slice's companies is done **primary-source-first, the same shape as primary-finder-first email finding.** The stack contract names which tool is the primary contact-discovery source and which are the gap-fill fallbacks; if it names none, stop and route to `/stack-setup`. Run the primary source over the slice's good-fit company domains plus the persona filter to pull the contacts FIRST, across all the slice's companies. Then **gap-fill only the companies/roles that came back thin or empty** with the fallback people-databases, and never open a fallback as the primary discovery tool while the primary source is available. Primary-first because the primary slot should be held by the cheap search pool that ALSO returns most of the Tier-1 contact signals in the same call; the fallbacks exist because any single index is thinner for SMB, niche roles and non-US, so they recover the contacts it misses. A contact search returns only people already indexed for the domain, so retry a genuine zero-result company once with a widened title net before treating it as gap-fill territory.

> **Know the primary source's call-shape limits before you fan out.** Domain-scoped contact search APIs commonly cap how many domains one call may carry (a handful per call is typical), so a whole slice is pulled with a batched fan-out rather than by looping single calls in the live conversation (`/tam-build` Layer 1d has the mechanics). **Where a contact-search API is single-account and single-domain-per-call, treat that step as serial-only and never fan it out across parallel agents:** concurrent calls on one shared account can silently return ANOTHER domain's rows, which is a correctly-labeled, error-free WRONG result that no downstream gate catches. Confirm the chosen source's concurrency behaviour once, record it in the stack contract, and respect it thereafter.

Contact *discovery* (finding the people) is distinct from the email *finder* (revealing the address) and the email *verifier* (judging it). A deep per-persona contact-*research* escalation (work history, recent posts, persona web research a discovery index cannot do) is a Tier-2 step run only on campaign-confirmed contacts, never the way you find the people in the first place. The fallback contact-generation routes referenced below (fabricated-name re-discovery, nameless rows) are this **gap-fill / residue** path, not a primary route around the primary source.

> **HARD RULE: NEVER discover contacts from LinkedIn / Google search results (operator directive 2026-07-17).** Do not build a contact list by running a LinkedIn public-profile search through any web search (`site:linkedin.com/in "<Company>" ("Chief Digital" OR COO OR ...)`) and having an AI pass pick which results match the target titles. **This is how you get retired and departed people.**
>
> **Why it fails, mechanically:** a search-engine result is the engine's **cached** view of a profile, so the `First Last - Title - Company` string reflects whenever it was last crawled, often months or years stale. The AI sees only that string and has **no employment-currency signal whatsoever**, so an instruction like "pick people who CURRENTLY work at X" asks for a judgment it cannot make; it just pattern-matches a company name in a snippet. The method therefore returns *whoever the engine once indexed at that company*, which is precisely a roster of people who have since retired or left.
>
> **Why nothing downstream catches it (this is the dangerous part).** The rows look perfect: real human name, real `linkedin.com/in` URL, plausible title. Anti-fabrication guards ("only use names present in the snippets") stop *invented* people but do nothing about *stale* ones. The failure mode is a **real person at a past employer**. So the name-quality gate passes, LinkedIn coverage passes, and a departed person's old mailbox frequently still verifies `valid`. **Every gate goes green and the list is still garbage.** That is why this must be blocked at the SOURCE; no amount of verification downstream can rescue it. Live damage on a prior client run: ~831 contacts built this way, since deprecated.
>
> **Contacts must come from a real contact database with a current-employer field**, gap-filled with the fallback people-databases. Those carry current employer plus tenure, which is exactly the signal a search-engine snippet lacks.
>
> **This bans SERP-based *discovery*, NOT the sanctioned *backfill* below. Do not over-apply it.** Filling a `linkedin_url` (or `company_linkedin`) for a person or company you **already have from a real source** is still correct and still required (see "Backfill the gaps" below). The line is: **a real database tells you the person exists and still works there; a backfill, including a web search, may only fill in a field about someone already established.** Never let a search engine decide who is on the list. The same tool-balance guard applies as for the email finder: a contact-discovery tool that is out of balance, down or switched off stops the step and the operator is asked; the queue never routes to a substitute on its own, and moves on only through an operator-approved skip (see the retired exception below and `/tool-balance-guard`).

**No paid email enrichment until a contact is confirmed into a campaign. HARD RULE (operator directive 2026-06-29).** The build order is strict: (1) build the FULL TAM both levels up front, company-level (`tam.csv`) AND contact-level (`contacts.csv`: decision-makers + all Tier-1 contact signals + `co_*` company signals + any free email-exists flag the source offers), Layer-1, NO email reveal; (2) `/campaign-strategy` slices both levels and the operator confirms which contacts go into a campaign (signal-based or broad); (3) **only then**, and **only on the confirmed-campaign contacts**, does any per-contact EMAIL spend happen: the email finder reveals FIRST, then the verifier judges, then the waterfall enricher runs on the residue the finder could not close. **In the first wave the confirmed contacts are every eligible contact in Aaron's launch set** (every tier, every offer cell in a `now` campaign), so step (3) runs across all of them in one pass in priority order (Aaron process alignment, operator directives 2026-09-22 and 2026-09-28; supersedes the "email reveal only on a confirmed slice" reading of this rule). **The waterfall enricher (and every paid finder or verifier) is doubly gated: Layer-2 (confirmed-campaign contacts only, never the TAM or contact-TAM build) AND residue-only (never opens the finding).** Never reveal or waterfall-enrich an email during the TAM or contact-TAM build, and never on a contact not yet confirmed into a campaign. A free email-exists flag tells you up front *that* an email exists; you pay to reveal it only for contacts you are actually about to email. This is what makes contact-signal campaigns possible without breaking the Layer-1/Layer-2 cost firewall: discover and signal the whole base cheaply, reveal emails only on the chosen contacts.
## Suppression Cross-Check (run before any enrichment spend)

Every client has a portable, client-wide suppression registry at:

```text
profiles/<business-slug>/suppression-list.csv
```

**Canonical schema (this skill owns the definition; other skills reference it):**

| Column | Meaning |
|---|---|
| `email` | primary match key |
| `company_domain` | domain-level match (used for `negative_hostile` and for company-level rows: suppress the whole domain) |
| `linkedin_url` | person match when email is absent |
| `company_name` | fuzzy fallback match |
| `reason` | `unsubscribe` / `negative_notfit` / `negative_hostile` / `bounce` / `client_blocklist` / `manual` |
| `source_campaign` | campaign slug that produced the suppression (`context-sweep` for a blocklist the client context sweep found; `pipeline-sheet` for a contact the client's pipeline sheet shows as already booked) |
| `date_added` | `YYYY-MM-DD` |

`client_blocklist` (added 2026-09-24) marks a do-not-contact list the client or the team supplied (existing customers, current clients, competitors, partners, deals already in their pipeline), wherever it was found. The client context sweep (`client-context-sweep.md`) writes those rows at once, because suppression can only narrow who gets emailed. A company row carries a resolved `company_domain` and leaves `email` and `linkedin_url` blank, so it suppresses the whole domain; it keeps `company_name` too. A blocklisted name the sweep could not resolve to a domain can match only on the `company_name` fuzzy fallback, so it is counted in the `context_sweep:` block's `unresolved_blocklist_names` until its domain is found, and the upload stops while that count is above zero (`/cold-email-kickoff` Step 6). Contacts already booked, taken from the client's pipeline sheet when one is recorded, are person rows with `reason: manual` and `source_campaign: pipeline-sheet`, refreshed append-only before `/lead-scoring` and again before upload. Never remove a `client_blocklist` or `pipeline-sheet` row without the operator.

If the file does not exist yet, treat it as empty (it is created on first write by the reply-scoring skills or the client context sweep). Match on `email` first, then `linkedin_url`, then `company_domain`, then `company_name` fuzzy. A person-level row (it carries an `email` or a `linkedin_url`) suppresses only that person, never their colleagues. A company-level row (no `email`, no `linkedin_url`) suppresses the whole company domain, and so does any `negative_hostile` row. `scripts/lead_score.py` and `scripts/list_qa.py` both apply this domain rule. Drop every match **before** spending on enrichment or verification. Never pay to enrich someone you cannot contact.

## Verification Doctrine. HARD RULE (operator standard, updated 2026-06-16)

No list is send-safe until every sending email is **(a) email-verified by a third-party tool AND (b) catch-all verified.** Both are always required. But HOW you reach send-safe depends on whether the row already has an email and whether it has a real name, and the **order matters, because doing it in the wrong order double-pays.** Apply the decision tree below to every contact row, after suppression.

**HARD RULE: the email verifier is the UNIVERSAL VERIFIER OF RECORD; there are NO source exemptions (operator directive 2026-06-22).** Every sending email, no matter what surfaced it (already on the row, or found by the email finder, the waterfall enricher, a people-database fallback, or ANY other current or future finder/enrichment tool), **MUST pass a verification by the tool in the email-verifier slot before it is send-eligible.** A finding tool's own internal verification is NOT a substitute and is never the send-gate: **this explicitly includes the waterfall enricher**, whose multi-provider self-check does not exempt its output, so every email it finds is re-verified by the email verifier exactly like any other source. Only an email the verifier returns as **`valid`**, or a **`catch_all`** that has cleared the Catch-All Timing gate below, may ship; anything the verifier marks **`undeliverable`** / **`risky`** / **`unknown`** is held in review or removed, never sent. This is binding regardless of `execution_mode` and regardless of how the email was found. If a new enrichment tool is added to the stack later, it inherits this rule automatically: it finds, the verifier verifies.

### Catch-All Timing. HARD RULE (operator directive 2026-06-26)

**A verified catch-all is NECESSARY but NOT SUFFICIENT to send. Domain maturity is an added, separate gate.** A catch-all (accept-all) domain accepts mail for any local-part, so even a verified catch-all carries a higher latent bounce risk than a clean `valid` address, and a bounce spike *early* in a sending domain's life is the fastest way to wreck that domain's reputation. So catch-alls are held **OUT of the send file** until the sending domains have **~2-3 weeks of positive, healthy sending** (low bounce + low spam complaints, ideally some replies) behind them.

1. **Launch valid-only.** A new campaign on a new/young domain ships ONLY `valid` leads (deliverable and not catch-all). Verified catch-alls do **not** go in the initial send file, even when the operator would otherwise accept them.
2. **Hold catch-alls in a per-campaign holdback** (`leads.catchall-holdback.csv`, alongside `leads.review.csv`), **with their rendered per-contact copy preserved**, so reintroduction later is lossless. Never the send file.
3. **Reintroduce automatically after maturity, owned and scheduled by `/cold-email-weekly-rhythm` (HARD RULE, every launch).** Every valid-only launch automatically creates a standing reintroduction obligation; you never schedule it by hand. The weekly engine (Step 3b) scans every campaign's holdback each week, auto-detects when its domains have ~2-3 weeks of actual positive sending (healthy bounce + replies in, no deliverability flag), and **auto-prepares the held catch-alls as a one-click approval** to add back in a controlled ramp (operator choice 2026-06-26: staged for approval, never auto-sent). A catch-all that already passed verification does **not** need re-verifying to come back. It was always send-eligible on *verification* grounds; it was only *timing*-gated.

This REPLACES the prior "operator-approved `catch_all` ships immediately" disposition. It is **precautionary reputation hygiene for young domains**, NOT a claim that catch-alls cause every bounce spike. Diagnose an actual bounce spike from the real SMTP DSN reasons, never from a list/verifier correlation (see). Source post: catch-all timing matters more for a young domain than whether you send to catch-alls at all.

### The two gates are different. Never conflate them
- **Finding an email** (running the email finder first, or the waterfall enricher on residue) requires **first name + last name + company domain.** The finder keys on the person's name; a nameless row cannot be found, so never run a finder on it.
- **Verifying an email that already exists** requires only **email + domain**, no name needed. A row that has an email but no name can still be verified (it just cannot be waterfall-*found*). Do not block verification on a missing name.

### Decision tree (per contact row, post-suppression)

1. **Is the name real?** A pattern/index construction, e.g. an index-mode contact lookup that returns `{first_initial}{last_name}@domain` guesses and *fabricates* the person's name, counts as **no real name**. Those rows are not real people; they will bounce. Re-discover real contacts via a contact-generation fallback or a people-database before doing anything else. **Never run a finder, and never trust an email, on a fabricated row.**
2. **Does the row already have a work email?**
   - **YES, so VERIFY FIRST with the email verifier. Do NOT run any finder.** Run the email verifier on the address the row already has. Prefer a verifier whose single call returns **both** the deliverability status **and** the catch-all flag, so deliverability and accept-all are judged in one pass. **Verifying an email you already hold is the verifier's job, never the finder's (operator directive 2026-06-16).**
     - **Deliverable and not catch-all (`valid`), so send-safe. Stop. No finder spend.**
     - **`undeliverable` (`invalid`), `risky` or `unknown`, so send the row into the finder queue (step 5) from the top: the email finder first, then the residue rung only if the finder does not close it.** The rejected address stays in the person's attempt history. The stack contract never opens the residue rung on a row the finder has not attempted (`lead_data.contact_enrichment.notes`); this line sent a failed existing email straight to the residue queue until 2026-09-24.
     - **A `catch_all` verdict (deliverable, but on a catch-all domain), so hold it back** (`leads.catchall-holdback.csv`, Catch-All Timing above). A catch-all is not a rejection, so it never goes to the residue queue (stack contract, `lead_data.contact_enrichment.notes` step 3; this line sent it to the residue queue until 2026-09-24).
     - **Never feed an already-have-email row to the waterfall enricher to "verify" it.** A waterfall enricher does not verify an email you already hold; it runs its own waterfall and charges for it, so you would pay twice and still never check the address you had. Verifying an existing email is the verifier's job.
   - **NO work email, so FIND IT WITH THE EMAIL FINDER FIRST** (only if gate 1 passed: real first + last name). Run the email finder on name + domain. **Do NOT open with the waterfall enricher.**
     - **The finder returns an email, so VERIFY it with the email verifier** (deliverability + catch-all).
       - Deliverable and not catch-all (`valid`), so send-safe. Stop.
       - `undeliverable` / `risky` / `unknown`, so route to the waterfall-enricher residue queue (step 5). A `catch_all` (deliverable, but on a catch-all domain) goes to the holdback, never to the residue queue.
     - **The finder returns nothing (no work email), so route to the waterfall-enricher residue queue (step 5).**

**HARD RULE: the finder finds, the verifier verifies, the waterfall enricher runs on residue ONLY (operator standard, 2026-06-16).** Every row's first pass is: **find** the work email with the email finder (when missing), then **verify** it with the email verifier (one call for deliverability + catch-all where the tool supports it; the finder is NOT used for verification). **The waterfall enricher runs ONLY on the residue:** (a) rows the finder could not find a work email for, and (b) rows whose email the verifier marked `invalid` / `risky` / `unknown` after the finder had its pass (an existing email that fails verify-first goes to the finder first; a `catch_all` is held back, never residue, per the stack contract). **Never open with the waterfall enricher, not even for high-volume slices.** This is binding regardless of `execution_mode`.

**Why this order:** find-then-verify is the cheap per-record first pass; a waterfall enricher's pay-per-valid recovery is the expensive engine, reserved for the rows that cheap pass cannot close, so you never pay the recovery engine on rows already handled. Verifying-what-you-have before finding also stops the classic double-cost.

**RETIRED 2026-09-28: the "finder down, so the waterfall enricher becomes the finder" exception.** The 2026-06-19 sanctioned exception no longer applies; the tool-balance guard replaces it (operator decision 2026-09-28, `/tool-balance-guard`). **When the email finder is out of balance, down or switched off** (a `402`, an auth-invalidated error, a `5xx` on every call, or the operator has turned it off), **stop the step and ask the operator** to top up, reconnect or turn it back on, then resume on the same finder. Never route the finder queue to the waterfall enricher or to any other tool as a substitute, and never keep retrying a dead finder. **The only way past a finder that cannot be fixed is the operator's own call, recorded as one command:** `provider-routing.yaml` lets the residue rung run only on a row the finder has already attempted (the contract's "never open the gap-fill on a row the finder has not attempted"), so an approved skip is logged with `list_waterfall.py plan --skip-provider <finder key> --skip-reason "<the error you saw>" --operator-approved-skip`. The planner refuses a skip without that flag, writes it to the ledger as `detail.operator_approved`, and only then lets the next rung open those rows (every output still goes through the email verifier, with no exception). `--unskip-provider <finder key>` turns the finder back on once it is reachable, and it resumes as the primary first pass.

> **NO PRE-EMPTIVE SKIP: the email finder is ALWAYS attempted first (enforced 2026-06-19, operator directive; restated under the tool-balance guard 2026-09-28).** You **MUST** run the finder pass first on every finder-queue slice, no matter how large. Routing a slice past the finder because the connector "usually dies on volume," because the slice is big (hundreds or thousands of rows), because enricher credits are prepaid, or because of a precedent on another client is a **VIOLATION of this hard rule, not a judgment call**. "The connector will probably die" is a *prediction*, not an *error*, and a prediction never authorizes a skip. An error you **actually observed in THIS run** is not a pass-over either: it is a stop under the tool-balance guard above, and the rows move on only through an operator-approved `--skip-provider ... --operator-approved-skip`. If you skip the finder on a prediction, or on an error without the operator's approval, you have broken this rule: surface it and correct it. (This closes the loophole behind a 2026-06-19 incident in which an 800-row slice was sent straight to the waterfall enricher on the prediction that the finder would die, before any finder call was made.)

### Cache tier, 90-day revalidation, and permutation guess (Eric's waterfall order, added 2026-09-18)

Eric Nowoslawski's own waterfall order is **cache first, then a cheap finder, then a validated finder, then send-data.** Set against the HARD RULE above, this is **partial conformance, not a conflict.** The HARD RULE stands exactly as written, and the tiers below sit in front of it rather than reordering it.

**Already covered, so read this as an addition and not a competing rule.** The cheap-before-expensive escalation is the HARD RULE's own "Why this order": finder plus verifier is the cheap first pass, and the pay-per-valid waterfall enricher is the expensive engine held for the residue. Required Order step 3(a) already routes a row that arrives carrying an email into verify-first and explicitly keeps it away from the finder.

**Genuinely missing, and added here:**

- **Cache every validated email in a database you own, and check it before any paid call. Implemented 2026-09-24.** `scripts/millionverifier_verify.mjs` (the runner for the verifier slot) reads `outbound/profiles/_cache/verify-cache.jsonl` (gitignored with `profiles/`) before paying, verifies each distinct lowercased email once per file, reuses a fresh verdict, and appends every new verdict as it lands; its output carries `cache_hit` and `verified_at`. Inside one run, `scripts/list_waterfall.py` also never queues the same email twice, so an address returned by two rungs, or for two people, is verified once. A cached `valid` address inside the freshness window is handled exactly like Required Order step 3(a), a row that already has an email, so it goes to verify-first triage instead of costing a finder credit. This is a cheaper tier in front of the finder, not a way around it, so the NO PRE-EMPTIVE SKIP rule is untouched. That rule forbids skipping the finder in favor of the **waterfall enricher**, and a cache hit never touches the enricher.
- **Revalidate anything older than roughly 90 days.** A stored verdict decays as people change jobs, so re-run anything past that age through the verifier before it is send-eligible. The runner does this on its own: a cached verdict older than `layers.verification.cache.max_age_days` in `provider-routing.yaml` (90) is re-verified, and a transient outcome (an error, a timeout, a rate limit) is retried and never cached. Treat ~90 days as a working prior worth testing against your own bounce data, not as a hard gate. A cache entry records a past verification; it is never a standing exemption from the universal-verifier rule above.
- **Permutation-guess the easy addresses before paying anyone.** Where the row already carries the contact's **real first name, real last name, and company domain**, construct the obvious address patterns for that domain and let the verifier rule on them before a finder credit is spent. This is narrow, and it does not touch the fabricated-row rule above: it applies only to a real, named person, it never invents the person or the name, and the verifier stays the send-gate exactly as for any finder.

**Sourcing.** The waterfall order and the cache rule come from the full Eric corpus in `/ask-eric`, not from `eric-deliverability-doctrine.md`, which covers infrastructure and vendor benchmarking only. What that doc does govern here is how much a stored verdict is worth: per its Part 2, benchmark a verifier on its **false-negative rate against your own known-good addresses**, because a verifier that wrongly rejects live addresses is silently costing real yield.

### Verification routing: the email verifier decides (verify + catch-all in one)
**Email verification belongs to the tool in the email-verifier slot; the finder is NOT used for verification (operator directive 2026-06-16).** Resolve the verifier from the stack contract; if that slot is empty, stop and route to `/stack-setup`. Prefer a verifier that is a two-in-one tool: a single call returns both an `email_status` (`deliverable` | `undeliverable` | `risky` | `unknown`) **and** an `is_catch_all` boolean, so it covers deliverability AND catch-all/accept-all in one pass and no separate catch-all tool is needed. If the chosen verifier splits those into two calls, run both; a row is not judged until you have both answers.

**The verifier is the DEFAULT for EVERY email source, with no exceptions (operator directive, hardened 2026-06-22).** Any email a list carries or a finder returns, whether it already existed on the row or was produced by the email finder, the waterfall enricher or any people-database fallback (current or future), is verified through the email-verifier slot. **There is NO source exception, not even the waterfall enricher.** An enricher's own multi-provider self-check is not a substitute for verification. So the pipeline is: every source (**including the waterfall enricher**) goes to the verifier, keep only `valid` (plus an operator-approved `catch_all` that cleared the timing gate; until then a `catch_all` waits in the holdback and is never residue); the residue the verifier marks `invalid` / `risky` / `unknown` (plus rows no finder could close) goes to the **waterfall enricher** to recover a new email, and back through the verifier.

- **Gate mapping (catch-all OVERRIDES deliverable: a catch-all "deliverable" is NOT clean valid):** deliverable + not catch-all goes to `valid` (send-safe); deliverable + catch-all goes to `catch_all` (**holdback**, never the initial send file; ships only after the Catch-All Timing gate clears, see above); `undeliverable` goes to `invalid`; `risky` stays `risky`; `unknown` stays `unknown`.
- **Waterfall-enricher output is verified too, with no exemption (operator directive 2026-06-22).** When the enricher FINDS a residue email, its own internal check and catch-all classification are treated as a **provider signal only**, NOT the send-gate. Route every enricher-found email through the verifier (deliverability + catch-all) exactly like any other find, and keep only the ones the verifier returns `valid` (plus an operator-approved `catch_all`). **Always re-run enricher output through the verifier.**
- **Run it through whatever runner the stack contract wires to the verifier slot**, with its API key in `scripts/.env`. For the verifier the contract names today that runner is `scripts/millionverifier_verify.mjs` (real-time, one synchronous call per distinct email, with the verification cache above), and its output feeds `list_waterfall.py record --layer verify` directly. Many verifiers offer a fast parallel single-call mode plus a slower bulk-file queue for very large unattended jobs; prefer the parallel mode unless the job is large and unattended.
- **No balance endpoint is guaranteed.** Treat a `402` on a run as out of credits or expired, and treat any connectivity self-test as a connectivity test only, never as proof of balance. If the verifier's API key is missing, **stop before the verify step and surface that.** Do not ship a list that was not verified.

### Contact-discovery MUST capture first + last name; `linkedin_url` is a REQUIRED B2B field (actively filled, not just "if the source returns it")
The finder keys on `first_name`+`last_name`+`company_domain`, so **real first + last name are a hard requirement** of any Layer-2 input. An "emails without names" pull is not valid: re-discover with real names (a contact-generation fallback or a people-database) first.

**`linkedin_url` is a required data-quality field for every B2B contact (operator directive 2026-06-20).** It is *not* part of the email-finder key, so a missing LinkedIn mid-pipeline must never block email finding (don't over-block a name-complete row), and B2C lists are exempt. But the **finalized** B2B list should carry a verified `linkedin_url` for every contact, so it must be **actively filled**, not just captured opportunistically:
- **Capture at the source.** Take `linkedin_url` wherever discovery returns it and carry it through every transform. Do not let column-mapping drop it (the 2026-06-20 backfill existed because the field was schema-present but never populated or synced for ~40% of contacts).
- **Backfill the gaps: contact-database first, then the contact-enrichment tools, then a Claude web-search check (operator routing; no-AI-API rule, operator directive 2026-09-22).** For B2B rows still missing `linkedin_url` after discovery: (1) query the **contact-discovery source by name** with the contact's full name plus company domain and take the matching row's profile URL. (2) **Residue goes to the stack contract's contact-enrichment tools** (the `lead_data.contact_enrichment` tools, plus the secondary contact source the contract records, whose tool surface includes a batch lookup that returns LinkedIn profile URLs from verified work emails). That lookup is not proven on FNNL's own account until a real call succeeds (`chosen` is not `live`, CLAUDE.md section 1); if it fails or returns nothing, move the residue to step (3) and say so. Take the URL only when the returned record's name AND company match the contact. Paid lookups route through `/api-cost-governance`, and never through the list workbench's built-in search (zero-workbench-credit HARD RULE, CLAUDE.md section 7). (3) **Last resort, for a residue small enough to be worth it:** Claude sub-agents fanned out per `/personalization-subagent-pattern` run WebSearch for the person, anti-hallucination-gated: the URL MUST come from a real `linkedin.com/in/` search result, and the sub-agent confirms the profile's name AND company match the contact. Write only on a confirmed match, else leave blank (a wrong LinkedIn is worse than a blank one). No outside AI provider or search API runs any step. Tool: `scripts/linkedin_merge_apply.mjs` (fold the filled URLs back into the lead CSV).
- **Sync to the sending platform.** On upload, map `linkedin_url` to the sending platform's **native** LinkedIn-profile field (the one its UI surfaces for reply-handling), not only a custom field.

## The planner loop (how Required Order steps 3 to 8 are run, added 2026-09-24)

The finders are reached through MCP tools and raw HTTP, so no script can call them all. `scripts/list_waterfall.py` is the planner and ledger instead: it decides what each account and person needs next, you run that queue, it records what came back, and state is recomputed from the append-only ledger (`_waterfall/ledger.jsonl`) every time. A resumed session continues exactly where the last one stopped, and no completed attempt is ever repeated. The planner makes no network call and spends nothing; the spend happens when you run a queue, so each queue goes through `/api-cost-governance` inside the run budget like any paid rung.

```text
python scripts/list_waterfall.py plan     --dir <campaignDir> --contacts <contacts.scored.csv> --spec <targeting-spec.yaml> --routing reference/provider-routing.yaml
# run each _waterfall/queue-email-<provider>.csv against that provider, through the endpoint provider-routing.yaml names for it
python scripts/list_waterfall.py record   --dir <campaignDir> --layer email --provider <provider key> --results <that provider's results.csv>
node   scripts/millionverifier_verify.mjs <campaignDir>/_waterfall/queue-verify.csv --email-col email --out <verify.out.csv>
python scripts/list_waterfall.py record   --dir <campaignDir> --layer verify --results <verify.out.csv>
# repeat plan -> run -> record until plan reports no work, then:
python scripts/list_waterfall.py finalize --dir <campaignDir> --contacts ... --spec ... --routing ...
```

The provider keys and the verifier key (`layers.verification.provider`) come from `provider-routing.yaml`; `record --layer verify` accepts only that verifier's output. Run `millionverifier_verify.mjs --dry-run` on the queue first when you need the paid-call count for the cost preview (cache hits cost nothing).

What the loop enforces (the rules are in `list-production-standard.md` section 6, the waterfalls):
- **Same person first.** A person keeps moving down the rungs until the verifier returns `valid`, the rungs run out, or the buyer-tier depth cap (`max_rungs_by_role_tier`) is reached. A `catch_all` also ends that person's search, because the contract sends it to the holdback, never to the residue rung. Only then is the next approved person at the account promoted.
- **Verify immediately.** Every candidate is verified before that person's next rung runs, and the waterfall stops the moment a `valid` exists. `invalid` and `unknown` move to the next rung, and a transient failure (a timeout, a rate limit, a verifier error) is retried, never recorded as a verdict.
- **The residue rung never opens a row the finder has not attempted** (`requires_attempted` in the yaml). The only exception is a finder skip the operator approved, logged with `--skip-provider ... --operator-approved-skip` (the tool-balance guard above).
- **Speed without skipping a gate (operator decision 2026-09-28).** Run each rung across the whole queue at once, never person by person in series: the planner emits one queue per provider, so run it as a batch, record it, then re-plan. Run the verifier with its `--concurrency` flag (that script-level concurrency is the parallelism for this step, so do not wrap it in sub-agents), take the cost preview from `--dry-run`, and retry a transient failure once before stopping. The work is Claude plus the stack's own tools; no outside AI API runs any step.
- **Right endpoint per provider.** Run each queue through the endpoint and batch size the yaml records for that provider (for example a per-person finder endpoint that charges nothing on a miss, never a bulk export that bills every row, and a finder that reports catch-all in a separate field that must be read). Honor each provider's `concurrency` note, and treat an untested one with the serial-only caution in "Know the primary source's call-shape limits" above until it is confirmed.
- **Per-account stop.** An account stops as soon as it holds `contacts_per_account` campaign-ready contacts.
- **Leak guard.** `record` rejects a results file carrying any id that was not in the queue it answers, because a shared provider account can return another company's rows under a correct-looking label.
- **Phone (only when needed).** `plan --layer phone` runs a phone waterfall on campaign-ready people only, but `provider-routing.yaml` defines no phone layer until the stack contract records a phone source, so a targeting spec that requires phone stops the planner with a clear error.

## Required Order

1. Deduplicate rows by `email`, then by `linkedin_url`, then by `company_domain + full name`. Then drop rows matching `profiles/<business-slug>/suppression-list.csv` (see Suppression Cross-Check) before any enrichment spend.
2. Validate the lead-scoring spend gate, keep every `send_eligible = true` row (rank 3+ included: they are the person-fallback pool, and the planner decides who is active; cutting the file to `same_wave_eligible = true` first would leave it nobody to promote), and sort by descending `lead_score`. Preserve lead-source and score fields through every export: `source`, `source_arm`, `source_type`, `source_url`, `evidence_url`, `signal`, `fit_reason`, `source_confidence`, the per-contact copy variables with their evidence URLs (`service_offered`, `service_offered_source`, `own_best_client`, `own_best_client_source`), all component points, `lead_score`, `priority_tier`, `score_confidence`, `score_reason`, `contact_rank_in_company`, `same_wave_eligible`, `score_version`, and `scored_at`.
3. **Triage every row into one of three queues (the Verification Doctrine, operationalized):**
   - **(a) Real name + already has a work email**, so the **verify-first** queue (step 4). Do NOT send these to the finder.
   - **(b) Real name + NO email**, so the **finder** queue (step 5).
   - **(c) Fabricated/pattern name, or no real name** (index-mode rows, "emails without names"), so NOT a valid Layer-2 input. Re-discover real contacts (a contact-generation fallback or a people-database), then re-triage into (a)/(b). Never run the finder on these, and never trust their email.
4. **Verify-first with the email verifier (queue a, rows that already have an email):** run the verifier (deliverability + catch-all), gated per the Verification Doctrine mapping.
   - Pass (deliverable, not catch-all, so `valid`), so send-safe; **no finder spend.**
   - Fail (`invalid` / `risky` / `unknown`), so move the row into the **finder queue** (step 5): the email finder first, and the residue rung only if the finder does not close it. A `catch_all` goes to the holdback (step 8), not the residue queue.
5. **Finder first, then the waterfall-enricher residue pass (queue b, real-name rows, plus the failed rows from step 4):**
   - **The finder finds, the verifier verifies (mandatory first pass).** For every real-named row with no verified work email, run the email finder (name + domain, in bulk where the tool supports it, looping its batch cap across the slice), then verify the result with the email verifier (deliverability + catch-all; see Verification routing). Rows that come back `valid` stop here, send-safe. **Do NOT open with the waterfall enricher.**
   - **Waterfall enricher (residue ONLY).** Run the enricher's waterfall ONLY on the residue: (a) rows the finder returned no work email for, and (b) rows whose email came back `invalid` / `risky` / `unknown` after the finder had its pass (an existing email that failed verify-first reaches the residue only through the finder; a `catch_all` is held back, never residue). Its multi-provider waterfall finds a new email in one pay-per-valid call; **that email then goes through the verify + catch-all step (step 6) like every other source before it counts as send-safe** (no source exemption). See **Waterfall enrichment** below. **Never the first pass, not even for high-volume slices.**
   - A people-database fallback only as a further fallback when a row shape fits that provider better, after the finder. A finder-found email from **any** provider, with no exceptions, goes through the verify + catch-all step (step 6) before it is send-safe.
   - A domain-to-person enrichment route when the row came from known company domains.
   - Manual or user-provided fallback only when the user approves the extra work.
6. **Verify EVERY found email through the email verifier, including the waterfall enricher's (operator directive 2026-06-22).** Emails from any finder, the waterfall enricher, a people-database fallback, or manual entry go through the verify + catch-all step before they count as send-safe; there is no source exemption. An enricher's own status column is kept as a provider signal, but the **send-gate is the verifier's verdict, not the enricher's**, so an enricher email the verifier downgrades to `invalid` / `risky` / `unknown` / unapproved `catch_all` does NOT ship. (Conversely, never use the enricher to *verify* an email a row already had: that is the verifier's job; see the Doctrine.)
7. Keep only `valid` emails for the send file (`leads.verified.csv`). **Catch-all is NOT send-file material on a young domain**, see the Catch-All Timing HARD RULE: even a verified catch-all is held back until the sending domains have ~2-3 weeks of positive sending.
8. Put `catch_all` (even verified) into a **per-campaign holdback** (`leads.catchall-holdback.csv`) with the rendered per-contact copy preserved; put `unknown`, `risky`, and `invalid` emails in `leads.review.csv`. Do not upload any of them into the initial campaign. Catch-alls reintroduce later via `/cold-email-weekly-rhythm`; the rest stay out.
9. Save the clean output as `leads.verified.csv` (`list_waterfall.py finalize` writes it together with the holdback, review and stagger files).
10. Run `/list-quality-scorecard` before copy or upload.

## Waterfall enrichment (residue / fallback waterfall)

The waterfall enricher is the all-in-one **waterfall finder** used as the **residue tool** of the Verification Doctrine. It runs ONLY on the rows the email finder could not close: (a) rows the finder returned no work email for, and (b) rows whose email came back `invalid` / `risky` / `unknown` after the finder had its pass (an existing email that failed verify-first reaches the residue only through the finder; a `catch_all` is held back, never residue). **Never the first attempt, and never a high-volume shortcut**: finder + verifier is the mandatory first pass (HARD RULE; see Required Order step 5). Never run it on rows that already have an unverified email, verify those first. It fans each contact across many email/phone providers in sequence, runs its own internal check, and on a **pay-only-for-valid** model charges a credit only when the data passes. Its internal check is a **provider signal, NOT the send-gate**: every email it finds is still re-verified by the email verifier before sending (see step 6 and the Verification Doctrine; no source is exempt, operator directive 2026-06-22).

**It is a Layer-2 step: run it only on the residue of the confirmed campaign contacts (in the first wave, every eligible contact in Aaron's launch set), never during the TAM or contact-TAM build.** Per-contact credits are the expensive layer; the TAM stays company-level (`/tam-build`).

**The residue waterfall never runs on the list workbench's own waterfall or credits.** It runs on the waterfall enricher the stack contract names, on FNNL's own key, and its results reach the workbench only through the push or a keyed column (zero-workbench-credit HARD RULE, see "List workbench" above).

**How to run it.** Resolve the waterfall enricher from the stack contract; if that slot is empty, stop and route to `/stack-setup`. Whatever runner the contract wires to the slot, it must support these three steps in order, and it reads its API key from `scripts/.env`. **Run it on the post-suppression survivors, after Required Order steps 1-2 (dedupe + drop suppression matches), never on the raw list**, so you never pay to enrich someone you cannot contact:

1. **Connectivity + balance check (free, no spend)** before anything else.
2. **Cost preview**: parse the CSV, count eligible rows, spend nothing. The eligible-row count is the upper bound on spend; pay-per-valid means actual spend is usually lower.
3. **Enrich**, after the `/api-cost-governance` gate below. Default to email only, on rows missing a valid email, with a hard pre-submit credit cap.

The waterfall is async (it takes minutes), so the runner must: submit in batches under the provider's per-request contact cap, run a bounded number of batches in parallel, poll each until it terminates, join results back to the input rows by a stable per-row id (never by batch index alone, and with a count check if index fallback is used), and write the canonical `email` / `email_status` columns plus the enricher's own status/provider columns and an enriched flag. It must journal submitted batch ids to a resume file so a re-run resumes instead of re-spending. Only `valid` rows are send-safe; the rest route to the review path by status, exactly as the gate below requires.

**Cost gate (required).** The waterfall enricher is a paid, credit-based tool, so route every run through `/api-cost-governance` first: preview the credit/USD cost, check the balance, and block if the key is under cost or under the warning threshold. Use a hard pre-submit credit cap as the stop.

**Never submit a run your balance can't cover: the "on hold" trap (binding).** On many credit-based enrichers, the instant credits hit 0 the in-flight and new requests are parked **on hold**, and held calls do **NOT** auto-retrigger when you top up later. Someone has to manually reprocess the queue in the provider's cockpit, and processing still needs credits. So the step-1 balance check is load-bearing, not optional: if the live balance cannot cover this slice, **top up first, then run**. Never submit and leave a stuck queue. The runner should enforce this (abort at a 0 balance, warn when the balance is below the eligible-row count). To prevent it structurally rather than reactively: credit-based enrichers typically bill a **monthly allowance** (commonly 1 credit per verified email and ~10 per verified phone, with unused credits rolling over only up to the plan cap before resetting monthly), so for recurring or high-volume sending, **size the monthly plan above your real monthly enrichment volume** instead of topping up after each stall. Respect the provider's published API limits (a per-minute request ceiling and a per-request contact cap are both normal) and stay well under them even while running batches in parallel. **The speed lever for a big list is the runner's concurrency setting, not more contacts per request**, and useful parallelism usually caps out at a handful of concurrent batches. Do not push concurrency past that, and do not run multiple runner instances at once: those are what risk the on-hold throttle. If the operator gives a rough daily or weekly request volume, estimate the monthly credits needed and recommend the matching plan tier.

## Stop Gates

Stop and ask before spending money when:

- Lead scoring is required (see the Lead-scoring spend gate) and is incomplete, stale, or missing from any row in the paid queue
- Any ineligible, suppressed, or hard-no row, or more same-company rows than the per-account cap, leaked into the active wave. A row the planner wrote with `wave_slot = promoted_fallback` is not a leak: it replaces a higher-priority person whose waterfall was exhausted, within the cap, whatever its original `contact_rank_in_company`
- The list has more than 500 rows and no ICP qualification pass exists
- The list has no `lead-source-plan.md` and the source is not obvious from the user's latest request
- The enrichment would push the run past its budget (`run_state.spend_ceiling_usd`, the standing $100 per client run). Inside the budget no approval is needed and nothing is asked (`/autonomous-execution-policy` section 2). A first-wave reveal is previewed across every contact in Aaron's launch set, every tier, never a P1-only cut. When that preview crosses the budget this gate fires exactly as written: stop and ask, stating the launch set's reveal and verification cost against the budget. Never shrink the reveal to a top-tier slice to fit under the budget without asking.
- Required API credentials are missing
- A tool this step names is out of balance, down or switched off (`/tool-balance-guard`): stop, ask the operator to top up or fix it, and resume on the same tool. Never pass its rows to the next rung or another tool
- The list source is mostly company-level and has no person names

Stop and do not upload when:

- Any unchecked row remains in the send file. This skill is the single owner of the verification gate: `leads.verified.csv` must be **100% verification-checked**, with every non-deliverable (invalid / risky / catch-all-fail) row moved to `leads.review.csv`. Never into the send file.
- The send file has not passed `/list-quality-scorecard` with grade B or better and a list-QA PASS (`list_qa.py`, `verified-list-gate.md`). (The scorecard removes or quarantines failing rows first and grades the remainder. It reports verification coverage and does not re-gate verification, because that gate lives here.)

**Email yield is not a send gate (Aaron process alignment, operator directive 2026-09-22; supersedes the house stop "fewer than 80% of the original sourced rows survived as verified-deliverable, fix the source, do not send a thin list").** Rows no finder or residue pass could close go to `leads.review.csv` as `no_email`, verified catch-alls go to the holdback, and every row the email verifier returns `valid` ships. Judge a source on fit, bounce and reply, never on find rate. Aaron's Sep 21 run shipped at about 61% yield (about 19,600 leads, just under 12,000 verified emails) and launched. A low yield goes in the report as evidence for the source and waterfall-order review, never as a reason to hold the verified rows.

A list workbench push shortfall is not a stop, but it is never silently accepted: report it at the top of the report and retry once by pushing a CSV that holds only the rows that did not land. Never re-push the full file with `--force`: webhook pushes append, so that duplicates every row that already landed. Until the counts match, the table is not a safe source for a manual export. A not-ready list workbench is not a stop gate either; it is the CSV-only fallback in "List workbench" above.

## Output Files

Write outputs under the active campaign or profile folder:

```text
profiles/<business-slug>/campaigns/<campaign-slug>/
  leads.raw.csv
  leads.enriched.csv
  leads.verified.csv
  leads.catchall-holdback.csv
  leads.review.csv
  leads.stagger.csv            (approved people this wave did not need; never deleted)
  email-waterfall-report.md
  _waterfall/                  (ledger.jsonl, queues, person-attempts.csv, account-status.csv)
```

`leads.verified.csv` carries the provenance columns defined in `list-production-standard.md` section 9 (attempt history, provenance and the verification cache): `person_id`, `email_source`, `email_attempt_path`, `email_verified_at`, `verification_provider`, `wave_slot` and `wave_slot_reason`. They stay in the file for audit and results feedback, and the upload never imports them.

`leads.verified.csv` is also pushed to the campaign's send-list table in the list workbench (see "List workbench" above), the report states the result as "pushed N/N rows to send_list <campaign-slug> (list_stage=verified)" or the CSV-only fallback line, and every push is logged to `profiles/<business-slug>/workbench/push-log.jsonl`.

The report must include:

- Input row count
- Deduped row count
- Rows dropped by suppression match
- Emails found
- Emails verified valid
- Yield (verified `valid` rows over deduped eligible rows), reported as source evidence only, never a gate
- Catch-all or risky count
- **Per rung, in the `provider-routing.yaml` order:** rows sent, emails found, the verifier's `valid`, `catch_all` and other verdicts, **new valid contributions** (people whose first `valid` came from this rung, which is its incremental coverage after the rungs before it), the cumulative ready share after the rung, and cost per new valid. This is the evidence for proposing a change to the contract's waterfall order.
- Accounts satisfied, partial, and with no ready contact; fallback promotions; verifications avoided through the cache and the in-run dedupe
- **Skipped rungs, with the reason** (an operator-approved `--operator-approved-skip` after an observed outage, or a row without the rung's required input) and the row count each skip affected. A missing key or an unapproved outage is a stop, never a skipped rung
- Rows dropped and why
- Source family and source confidence breakdown
- Count of rows missing `evidence_url` when the campaign intends to reference the signal
- Provider spend estimate
- Next skill: `/list-quality-scorecard`

## Platform Boundary

This skill never uploads to a sending platform.

After `/list-quality-scorecard` passes, hand the verified list to the upload workflow for the platform locked in `run_state.sending_platform`. Resolve that platform and its upload path from the stack contract; if the sending-platform slot is empty or no platform is locked, stop and route to `/stack-setup`. Never guess a platform or improvise an upload path.

Only show the path matching locked `run_state.sending_platform`.

The upload reads the local `leads.verified.csv`, not the list workbench table, because the workbench's API cannot read a table back below its top plan tier. If the operator edits or deletes rows in the send-list table before upload, those edits come back only as a manual export from the workbench that replaces the local `leads.verified.csv`. Treat the replaced file as a new send file: any row whose email was not already verified goes back through the email verifier, and `/list-quality-scorecard` runs again before upload.

## Related Skills

- `/icp-prompt-builder` - qualify the list before enrichment
- `/lead-source-strategy` - decide the source path before source collection or enrichment
- contact discovery - create person-level rows from company domains (resolve the contact-discovery source from the stack contract)
- `/list-quality-scorecard` - required after this skill
- `/campaign-copywriting` - only after the list passes quality review
- `/ask-eric` - the full Eric corpus behind the cache tier and waterfall order above
- `/tool-balance-guard` - a tool out of balance, down or switched off stops the step; never substitute
- `/phase-3-list` - the phase this skill runs in

