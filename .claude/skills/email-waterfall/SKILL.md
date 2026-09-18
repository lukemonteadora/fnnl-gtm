---
name: email-waterfall
description: Reveal missing work emails and verify deliverability only after /lead-scoring has produced an eligible, score-ordered campaign list. Process P1 first, then P2 through P5 as capacity opens. Preserve all scoring fields, enforce the two-contact same-wave cap, and run before /list-quality-scorecard or platform upload.
---

# Email Waterfall
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

Roles this skill uses: contact-discovery source, email finder, email verifier, waterfall enricher, sending platform, web-search API.

**If a role this step needs is empty or missing in the contract, STOP and route to `/stack-setup`.** Never substitute a guessed vendor, and never hardcode a tool name into an artifact this skill writes.


This skill turns a raw lead or company-contact CSV into a send-safe lead CSV.

It does not own list targeting. Run `/icp-prompt-builder` first when the source list may contain wrong-fit companies or people.

This is the **Layer-2 (per-contact) step** in the TAM model: it runs on a single campaign **slice** of the company-level TAM (`tam/tam.csv` from `/tam-build`), not across the whole TAM. Per-contact email/phone reveal and verification cost per credit, so they happen here — only for the slice that is going live — never up front across the entire TAM.

## Material Decision Rule

When this skill reaches a material fork, name the realistic options, recommend the strongest path, and explain why the main alternatives are weaker before committing.

Ask before choices that affect spend, provider routing, source of truth, list quality, campaign direction, client-facing output, live systems, scraping or account risk, or legal/compliance risk. For low-risk reversible choices, state the recommendation and proceed.

Do not turn failed or unsafe paths into user-facing options. If this skill's QA rules or stop gates reject a path, filter it out and explain the blocker only when useful.

When asking the user, use the Claude Desktop native Interactive Inputs / Choice Prompts pattern from /clarification-first: recommended option first, short choices, and Custom answer last when a custom answer is plausible.

## Interaction Policy

Defers to `/autonomous-execution-policy`. Under `run_state.execution_mode = auto_execute` (the operator's default), proceed without pausing: pick the strongest option per this skill's rubric, record it to `run_state`/profile, and continue — never re-ask a decision already in `run_state`, the profile, memory, or the operator's latest message. Stop only for the policy's hard-stops (spend over the approved ceiling, live send, credentials, provider/source-of-truth change, safety gates). On a long async wait, background-poll and move to other productive work — never idle.

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short — record status, not raw output. Full protocol: `client-activity-log.md`.

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
- `source_type`
- `source_url`
- `evidence_url`
- `signal`
- `fit_reason`
- `source_confidence`
- `lead_score`, `priority_tier`, `score_confidence`, `score_reason`
- `send_eligible`, `exclusion_reason`, `contact_rank_in_company`, `same_wave_eligible`
- `score_version`, `scored_at`

Minimum useful input:

- Person-level row: `first_name`, `last_name`, and either `company_domain` or `linkedin_url`
- Company-level row: `company_domain`, then run contact discovery first to find people

## Lead-scoring spend gate

For every TAM-backed path, stop unless `run_state.status.scoring_stage == complete` and the input came from `tam/contacts.scored.csv` or a campaign slice that preserves its current score fields. For an external list, stop until `/lead-scoring` has written `campaigns/<campaign-slug>/leads.scored.csv`.

Reject any paid finder or verifier queue containing a row where `send_eligible != true`, `lead_score` is blank, `priority_tier` is blank, or `score_version` does not match the active rubric. Sort P1 through P5 by descending `lead_score`. Lower tiers stay queued and are never deleted.

The scored TAM is the source of truth for breadth. Any legacy wording below that says “good-fit companies,” “exact ICP personas,” or an `email_found` flag means the current `good` plus `maybe` marketable universe and every plausible buying role, with no assumed email flag. `/tam-build` owns contact discovery. This skill owns paid reveal and verification after scoring.

## Contact-list assembly: contact-discovery signals + company-signal join (Layer 1, BEFORE any email reveal). HARD RULE (operator directive 2026-06-29)

When a campaign slice's contact list is built from a `/tam-build` TAM slice, do TWO things **at Layer-1 cost (no email reveal, no per-contact credit)** before the finder/verify steps below:

1. **Pull contacts from the contact-discovery source and attach the Tier-1 contact-discovery signals** (`/data-point-discovery` Contact-discovery signal tier). Resolve the contact-discovery source from the stack contract; if that slot is empty, stop and route to `/stack-setup`. This is the **contact-level TAM, built UP FRONT across the good-fit company TAM** (the contact mirror of the company TAM, same timing as the company build, BEFORE `/campaign-strategy`), **not a per-slice pull.** A domain-scoped contact search over the good-fit company domains plus the ICP persona/seniority title filter returns name, exact `job_title`, a LinkedIn profile URL and location per contact: all Layer-1, with **no email reveal.** Tag each row with the Tier-1 signals the chosen source can actually return: `contact_new_in_seat` (the flagship why-now, from the source's role-tenure filter, e.g. current role started within the last 12 months), `contact_seniority` / `contact_function` (exact filters where the source has them, otherwise approximated from title keywords), `contact_geo` (location filter), and `contact_phone_available` / `contact_email_indexed` **only where the chosen source actually exposes those flags**. Where a source cannot return one of these, leave the column blank rather than fabricating it, and record the gap in the data-point catalog. **No email find, no verify, no waterfall enricher here:** this is contact DISCOVERY, not reveal. **Bound it to good-fit companies plus ICP-relevant personas/seniority** (the cost guard in `/data-point-discovery`). Built once up front so `/campaign-strategy` can slice on contact signals. **There is no contacts floor any more (operator directive 2026-07-12):** the old 100-contact floor is RETIRED, and campaign eligibility is measured purely on the company axis (500 target companies, `/campaign-strategy`'s HARD RULE). A slice qualifies on its company count even when its verified contacts come back fewer.
2. **Left-join the company's signals onto every contact by `company_domain`, prefixed `co_`.** Every contact at a company inherits that company's TAM signal columns (`co_billing_migration_signal`, `co_is_hiring_now`, `co_named_customers`, etc.) so a contact carries BOTH its own contact-level signals and its company's company-level signals. The join is a pure domain match against `tam/tam.csv`, proven 18/18 on a client build 2026-06-29. A contact whose company is not in the TAM slice keeps blank `co_*` columns (never fabricate them).

**High-volume default: scrape ALL ICP decision-makers, not one contact and not a capped committee (operator directive 2026-07-12, which supersedes the 2026-07-07 "2 to 4 roles" cap).** The default is now HIGH VOLUME (1,000 up to 20,000 leads per campaign, 2,000-to-30,000 sends/day per client). Contacts-per-company is the **primary** volume lever, so the up-front contact-discovery persona filter in item 1 is set to **every ICP job title the client's ICP lists** (5, 10, however many that segment names), pulled across **every company** in the qualifying set. Not 1-2 per company. Not a tight cap. Get all the decision-makers that match the ICP titles. This is what turns a lookalike that saturates at ~2,700 companies into a 10k+ lead campaign, and it is why a slice's eligibility is tested on companies (500) rather than on contacts.

**Scrape-all raises VOLUME, it does not loosen the paid-reveal gate (both rules hold together).** This widened pull is Layer-1 contact DISCOVERY only: no email find, no verify, no waterfall enricher. It raises how many contacts the contact-TAM holds per company, and therefore how many confirmed-campaign contacts become eligible for paid reveal once `/campaign-strategy` slices and the operator confirms the campaign. It is **not** licence to reveal emails across the TAM. The "no paid email enrichment until a contact is confirmed into a campaign" HARD RULE below is untouched: discovery scrapes all ICP titles, and reveal still happens only on the confirmed slice.

**Per-company simultaneity cap (spray guard), enforced HERE. This is a SEND-time cap, never a scrape-time one.** Do NOT send to 5+ people at one company at once. It reads as spray, invites internal "are you getting these too?" replies, and hurts deliverability. **Under the scrape-all rule above, deep committees are now the NORM rather than the exception, so splitting and staggering is the standard path, not a rare special case.** Scrape every ICP title, then cut the send file so only a few of a company's contacts go out simultaneously: split the committee across campaigns or stagger the sends in time rather than one simultaneous multi-recipient hit. The two rules are complementary. Scrape-all sets how many contacts you hold. This cap sets how many you send at once. A deep committee is spent across waves instead of being thrown away at discovery. This per-company simultaneity cap is enforced at THIS step, the contact-list assembly, together with the campaign splits `/campaign-strategy` chooses. `/tam-build` builds the full, uncapped contact TAM and `/campaign-strategy` slices it; both defer the actual simultaneity cap to this assembly step, where the real send file is cut.

The default active-wave cap is exactly two contacts per company. Use `contact_rank_in_company` and keep only `same_wave_eligible = true` in the current reveal queue. Rank 3+ stays in the scored source file for a later stagger. Never delete it.

**Verify-first is unchanged, and matters MORE at volume.** A bigger list does not relax the Verification Doctrine below: only an email the verifier returns as `valid` ships, and the added volume must NOT push bounce above the 3% auto-protect ceiling. Verification is the guardrail that lets volume scale safely, not a step volume gets to skip. Full doctrine:.

**Contact DISCOVERY priority: primary-source-first, exhaust-then-gap-fill (HARD RULE, operator directive 2026-06-29).** Finding the decision-makers/contacts at the slice's companies is done **primary-source-first, the same shape as primary-finder-first email finding.** The stack contract names which tool is the primary contact-discovery source and which are the gap-fill fallbacks; if it names none, stop and route to `/stack-setup`. Run the primary source over the slice's good-fit company domains plus the persona filter to pull the contacts FIRST, across all the slice's companies. Then **gap-fill only the companies/roles that came back thin or empty** with the fallback people-databases, and never open a fallback as the primary discovery tool while the primary source is available. Primary-first because the primary slot should be held by the cheap search pool that ALSO returns most of the Tier-1 contact signals in the same call; the fallbacks exist because any single index is thinner for SMB, niche roles and non-US, so they recover the contacts it misses. A contact search returns only people already indexed for the domain, so retry a genuine zero-result company once with a widened title net before treating it as gap-fill territory.

> **Know the primary source's call-shape limits before you fan out.** Domain-scoped contact search APIs commonly cap how many domains one call may carry (a handful per call is typical), so a whole slice is pulled with a batched fan-out rather than by looping single calls in the live conversation (`/tam-build` Layer 1d has the mechanics). **Where a contact-search API is single-account and single-domain-per-call, treat that step as serial-only and never fan it out across parallel agents:** concurrent calls on one shared account can silently return ANOTHER domain's rows, which is a correctly-labeled, error-free WRONG result that no downstream gate catches. Confirm the chosen source's concurrency behaviour once, record it in the stack contract, and respect it thereafter.

Contact *discovery* (finding the people) is distinct from the email *finder* (revealing the address) and the email *verifier* (judging it). A deep per-persona contact-*research* escalation (work history, recent posts, persona web research a discovery index cannot do) is a Tier-2 step run on the winning slice, never the way you find the people in the first place. The fallback contact-generation routes referenced below (fabricated-name re-discovery, nameless rows) are this **gap-fill / residue** path, not a primary route around the primary source.

> **HARD RULE: NEVER discover contacts from LinkedIn / Google search results (operator directive 2026-07-17).** Do not build a contact list by running a LinkedIn public-profile search through the web-search API (`site:linkedin.com/in "<Company>" ("Chief Digital" OR COO OR ...)`) and having an AI pass pick which results match the target titles. **This is how you get retired and departed people.**
>
> **Why it fails, mechanically:** a search-engine result is the engine's **cached** view of a profile, so the `First Last - Title - Company` string reflects whenever it was last crawled, often months or years stale. The AI sees only that string and has **no employment-currency signal whatsoever**, so an instruction like "pick people who CURRENTLY work at X" asks for a judgment it cannot make; it just pattern-matches a company name in a snippet. The method therefore returns *whoever the engine once indexed at that company*, which is precisely a roster of people who have since retired or left.
>
> **Why nothing downstream catches it (this is the dangerous part).** The rows look perfect: real human name, real `linkedin.com/in` URL, plausible title. Anti-fabrication guards ("only use names present in the snippets") stop *invented* people but do nothing about *stale* ones. The failure mode is a **real person at a past employer**. So the name-quality gate passes, LinkedIn coverage passes, and a departed person's old mailbox frequently still verifies `valid`. **Every gate goes green and the list is still garbage.** That is why this must be blocked at the SOURCE; no amount of verification downstream can rescue it. Live damage on a prior client run: ~831 contacts built this way, since deprecated.
>
> **Contacts must come from a real contact database with a current-employer field**, gap-filled with the fallback people-databases. Those carry current employer plus tenure, which is exactly the signal a search-engine snippet lacks.
>
> **This bans SERP-based *discovery*, NOT the sanctioned web-search *backfill* below. Do not over-apply it.** Using the web-search API plus an AI confirmation pass to fill a `linkedin_url` (or `company_linkedin`) for a person or company you **already have from a real source** is still correct and still required (see "Backfill the gaps" below). The line is: **a real database tells you the person exists and still works there; the web-search API may only fill in a field about someone already established.** Never let a search engine decide who is on the list. The same outage exception applies as for the email finder: only on an actually-observed connector or API error does the discovery queue route straight to a fallback (see the SANCTIONED EXCEPTION below; the same posture applies to a contact-discovery outage).

**No paid email enrichment until a contact is confirmed into a campaign. HARD RULE (operator directive 2026-06-29).** The build order is strict: (1) build the FULL TAM both levels up front, company-level (`tam.csv`) AND contact-level (`contacts.csv`: decision-makers + all Tier-1 contact signals + `co_*` company signals + any free email-exists flag the source offers), Layer-1, NO email reveal; (2) `/campaign-strategy` slices both levels and the operator confirms which contacts go into a campaign (signal-based or broad); (3) **only then**, and **only on the confirmed-campaign contacts**, does any per-contact EMAIL spend happen: the email finder reveals FIRST, then the verifier judges, then the waterfall enricher runs on the residue the finder could not close. **The waterfall enricher (and every paid finder or verifier) is doubly gated: Layer-2 (confirmed slice only, never the TAM or contact-TAM) AND residue-only (never opens the finding).** Never reveal or waterfall-enrich an email during the TAM or contact-TAM build, and never on a contact not yet confirmed into a campaign. A free email-exists flag tells you up front *that* an email exists; you pay to reveal it only for contacts you are actually about to email. This is what makes contact-signal campaigns possible without breaking the Layer-1/Layer-2 cost firewall: discover and signal the whole base cheaply, reveal emails only on the chosen contacts.
## Suppression Cross-Check (run before any enrichment spend)

Every client has a portable, client-wide suppression registry at:

```text
profiles/<business-slug>/suppression-list.csv
```

**Canonical schema (this skill owns the definition; other skills reference it):**

| Column | Meaning |
|---|---|
| `email` | primary match key |
| `company_domain` | domain-level match (used for `negative_hostile` — suppress the whole domain) |
| `linkedin_url` | person match when email is absent |
| `company_name` | fuzzy fallback match |
| `reason` | `unsubscribe` / `negative_notfit` / `negative_hostile` / `bounce` / `manual` |
| `source_campaign` | campaign slug that produced the suppression |
| `date_added` | `YYYY-MM-DD` |

If the file does not exist yet, treat it as empty (it is created on first write by the reply-scoring skills). Match on `email` first, then `linkedin_url`, then `company_domain` (the whole domain when the reason is `negative_hostile`), then `company_name` fuzzy. Drop every match **before** spending on enrichment or verification — never pay to enrich someone you cannot contact.

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
     - **`undeliverable` (`invalid`), `risky`, `unknown`, or deliverable-but-catch-all (`catch_all`), so route to the waterfall-enricher residue queue (step 5).** The enricher's waterfall recovers a replacement email (it finds, verifies and catch-all-classifies in one call). Do NOT re-find here: the verifier already judged this address unsendable.
     - **Never feed an already-have-email row to the waterfall enricher to "verify" it.** A waterfall enricher does not verify an email you already hold; it runs its own waterfall and charges for it, so you would pay twice and still never check the address you had. Verifying an existing email is the verifier's job.
   - **NO work email, so FIND IT WITH THE EMAIL FINDER FIRST** (only if gate 1 passed: real first + last name). Run the email finder on name + domain. **Do NOT open with the waterfall enricher.**
     - **The finder returns an email, so VERIFY it with the email verifier** (deliverability + catch-all).
       - Deliverable and not catch-all (`valid`), so send-safe. Stop.
       - `undeliverable` / `risky` / `unknown`, or deliverable-but-catch-all (`catch_all`), so route to the waterfall-enricher residue queue (step 5).
     - **The finder returns nothing (no work email), so route to the waterfall-enricher residue queue (step 5).**

**HARD RULE: the finder finds, the verifier verifies, the waterfall enricher runs on residue ONLY (operator standard, 2026-06-16).** Every row's first pass is: **find** the work email with the email finder (when missing), then **verify** it with the email verifier (one call for deliverability + catch-all where the tool supports it; the finder is NOT used for verification). **The waterfall enricher runs ONLY on the residue:** (a) rows the finder could not find a work email for, and (b) rows whose email, existing or finder-found, the verifier marked `invalid` / `catch_all` / `risky` / `unknown`. **Never open with the waterfall enricher, not even for high-volume slices.** This is binding regardless of `execution_mode`.

**Why this order:** find-then-verify is the cheap per-record first pass; a waterfall enricher's pay-per-valid recovery is the expensive engine, reserved for the rows that cheap pass cannot close, so you never pay the recovery engine on rows already handled. Verifying-what-you-have before finding also stops the classic double-cost.

**SANCTIONED EXCEPTION: email finder unavailable, so the waterfall enricher becomes the finder for the whole slice.** Finder tools are commonly reached through a hosted connector or API whose auth can **invalidate** mid-run, or whose endpoint returns a `5xx` on every call. Those failures are on the provider's servers and are not fixable in-session. When **any** finder call returns an auth-invalidated error or a `5xx`, do **NOT** stall the run and do **NOT** keep retrying the finder: treat the entire finder queue as residue and route it straight to the **waterfall enricher**, which finds the email across many providers in one pay-per-valid call; **then run that output through the email verifier like every other source** (the universal verifier rule above admits no exception, including for the enricher-as-finder). This is the ONE time the waterfall enricher opens the finding. The "never open with the enricher" rule exists to protect the cheaper first pass, and when that pass is down there is no cheaper pass to protect, so the enricher is correct. Secondary discovery option for nameless or thin rows: a contact-generation fallback, then verify. **Surface the outage to the operator** so they can reconnect or escalate to the provider, but keep the slice moving meanwhile: never block email-finding on a dead connector. The finder resumes as the primary first pass the moment it is reachable again.

> **NO PRE-EMPTIVE SKIP: the email finder is ALWAYS attempted first (enforced 2026-06-19, operator directive).** The exception above triggers **only** on a finder error you **actually observed in THIS run**: a real auth-invalidated message or a `5xx` returned by a finder call you genuinely made. You **MUST** run the finder pass first on every finder-queue slice, no matter how large. Routing a slice straight to the waterfall enricher because the connector "usually dies on volume," because the slice is big (hundreds or thousands of rows), because enricher credits are prepaid, or because of a precedent on another client is a **VIOLATION of this hard rule, not a judgment call**. "The connector will probably die" is a *prediction*, not an *error*; predictions never authorize the enricher-as-finder exception, only an observed error does. Attempt the finder, and let the error (if one actually occurs) fire the fallback for the remaining unprocessed rows. If you skip the finder on a prediction, you have broken this rule: surface it and correct it. (This closes the loophole behind a 2026-06-19 incident in which an 800-row slice was sent straight to the waterfall enricher on the prediction that the finder would die, before any finder call was made.)

### Verification routing: the email verifier decides (verify + catch-all in one)
**Email verification belongs to the tool in the email-verifier slot; the finder is NOT used for verification (operator directive 2026-06-16).** Resolve the verifier from the stack contract; if that slot is empty, stop and route to `/stack-setup`. Prefer a verifier that is a two-in-one tool: a single call returns both an `email_status` (`deliverable` | `undeliverable` | `risky` | `unknown`) **and** an `is_catch_all` boolean, so it covers deliverability AND catch-all/accept-all in one pass and no separate catch-all tool is needed. If the chosen verifier splits those into two calls, run both; a row is not judged until you have both answers.

**The verifier is the DEFAULT for EVERY email source, with no exceptions (operator directive, hardened 2026-06-22).** Any email a list carries or a finder returns, whether it already existed on the row or was produced by the email finder, the waterfall enricher or any people-database fallback (current or future), is verified through the email-verifier slot. **There is NO source exception, not even the waterfall enricher.** An enricher's own multi-provider self-check is not a substitute for verification. So the pipeline is: every source (**including the waterfall enricher**) goes to the verifier, keep only `valid` (plus an operator-approved `catch_all` that cleared the timing gate); the residue the verifier marks `invalid` / `risky` / `unknown` / unapproved `catch_all` (plus rows no finder could close) goes to the **waterfall enricher** to recover a new email, and back through the verifier.

- **Gate mapping (catch-all OVERRIDES deliverable: a catch-all "deliverable" is NOT clean valid):** deliverable + not catch-all goes to `valid` (send-safe); deliverable + catch-all goes to `catch_all` (**holdback**, never the initial send file; ships only after the Catch-All Timing gate clears, see above); `undeliverable` goes to `invalid`; `risky` stays `risky`; `unknown` stays `unknown`.
- **Waterfall-enricher output is verified too, with no exemption (operator directive 2026-06-22).** When the enricher FINDS a residue email, its own internal check and catch-all classification are treated as a **provider signal only**, NOT the send-gate. Route every enricher-found email through the verifier (deliverability + catch-all) exactly like any other find, and keep only the ones the verifier returns `valid` (plus an operator-approved `catch_all`). **Always re-run enricher output through the verifier.**
- **Run it through whatever runner the stack contract wires to the verifier slot**, with its API key in `scripts/.env`. Many verifiers offer a fast parallel single-call mode plus a slower bulk-file queue for very large unattended jobs; prefer the parallel mode unless the job is large and unattended.
- **No balance endpoint is guaranteed.** Treat a `402` on a run as out of credits or expired, and treat any connectivity self-test as a connectivity test only, never as proof of balance. If the verifier's API key is missing, **stop before the verify step and surface that.** Do not ship a list that was not verified.

### Contact-discovery MUST capture first + last name; `linkedin_url` is a REQUIRED B2B field (actively filled, not just "if the source returns it")
The finder keys on `first_name`+`last_name`+`company_domain`, so **real first + last name are a hard requirement** of any Layer-2 input. An "emails without names" pull is not valid: re-discover with real names (a contact-generation fallback or a people-database) first.

**`linkedin_url` is a required data-quality field for every B2B contact (operator directive 2026-06-20).** It is *not* part of the email-finder key, so a missing LinkedIn mid-pipeline must never block email finding (don't over-block a name-complete row), and B2C lists are exempt. But the **finalized** B2B list should carry a verified `linkedin_url` for every contact, so it must be **actively filled**, not just captured opportunistically:
- **Capture at the source.** Take `linkedin_url` wherever discovery returns it and carry it through every transform. Do not let column-mapping drop it (the 2026-06-20 backfill existed because the field was schema-present but never populated or synced for ~40% of contacts).
- **Backfill the gaps: contact-database first, then AI-verified web search (operator routing).** For B2B rows still missing `linkedin_url` after discovery: (1) query the **contact-discovery source by name** with the contact's full name plus company domain and take the matching row's profile URL. (2) **Residue goes to the web-search API plus an AI confirmation pass**, anti-hallucination-gated: the URL MUST come from a real `linkedin.com/in/` search result, and the model confirms the profile's name AND company match the contact. Write only on a confirmed match, else leave blank (a wrong LinkedIn is worse than a blank one). Tools: `scripts/linkedin_find_web.mjs` (residue), `scripts/linkedin_merge_apply.mjs` (fold back into the lead CSV).
- **Sync to the sending platform.** On upload, map `linkedin_url` to the sending platform's **native** LinkedIn-profile field (the one its UI surfaces for reply-handling), not only a custom field.

## Required Order

1. Deduplicate rows by `email`, then by `linkedin_url`, then by `company_domain + full name`. Then drop rows matching `profiles/<business-slug>/suppression-list.csv` (see Suppression Cross-Check) before any enrichment spend.
2. Validate the lead-scoring spend gate, keep only current-wave `send_eligible = true` rows, and sort by descending `lead_score`. Preserve lead-source and score fields through every export: `source`, `source_type`, `source_url`, `evidence_url`, `signal`, `fit_reason`, `source_confidence`, all component points, `lead_score`, `priority_tier`, `score_confidence`, `score_reason`, `contact_rank_in_company`, `same_wave_eligible`, `score_version`, and `scored_at`.
3. **Triage every row into one of three queues (the Verification Doctrine, operationalized):**
   - **(a) Real name + already has a work email**, so the **verify-first** queue (step 4). Do NOT send these to the finder.
   - **(b) Real name + NO email**, so the **finder** queue (step 5).
   - **(c) Fabricated/pattern name, or no real name** (index-mode rows, "emails without names"), so NOT a valid Layer-2 input. Re-discover real contacts (a contact-generation fallback or a people-database), then re-triage into (a)/(b). Never run the finder on these, and never trust their email.
4. **Verify-first with the email verifier (queue a, rows that already have an email):** run the verifier (deliverability + catch-all), gated per the Verification Doctrine mapping.
   - Pass (deliverable, not catch-all, so `valid`), so send-safe; **no finder spend.**
   - Fail (`invalid` / `catch_all` / `risky` / `unknown`), so move the row to the **waterfall-enricher residue queue** (step 5).
5. **Finder first, then the waterfall-enricher residue pass (queue b, real-name rows):**
   - **The finder finds, the verifier verifies (mandatory first pass).** For every real-named row with no verified work email, run the email finder (name + domain, in bulk where the tool supports it, looping its batch cap across the slice), then verify the result with the email verifier (deliverability + catch-all; see Verification routing). Rows that come back `valid` stop here, send-safe. **Do NOT open with the waterfall enricher.**
   - **Waterfall enricher (residue ONLY).** Run the enricher's waterfall ONLY on the residue: (a) rows the finder returned no work email for, and (b) rows whose email, existing or finder-found, came back `invalid` / `catch_all` / catch-all-not-safe. Its multi-provider waterfall finds a new email in one pay-per-valid call; **that email then goes through the verify + catch-all step (step 6) like every other source before it counts as send-safe** (no source exemption). See **Waterfall enrichment** below. **Never the first pass, not even for high-volume slices.**
   - A people-database fallback only as a further fallback when a row shape fits that provider better, after the finder. A finder-found email from **any** provider, with no exceptions, goes through the verify + catch-all step (step 6) before it is send-safe.
   - A domain-to-person enrichment route when the row came from known company domains.
   - Manual or user-provided fallback only when the user approves the extra work.
6. **Verify EVERY found email through the email verifier, including the waterfall enricher's (operator directive 2026-06-22).** Emails from any finder, the waterfall enricher, a people-database fallback, or manual entry go through the verify + catch-all step before they count as send-safe; there is no source exemption. An enricher's own status column is kept as a provider signal, but the **send-gate is the verifier's verdict, not the enricher's**, so an enricher email the verifier downgrades to `invalid` / `risky` / `unknown` / unapproved `catch_all` does NOT ship. (Conversely, never use the enricher to *verify* an email a row already had: that is the verifier's job; see the Doctrine.)
7. Keep only `valid` emails for the send file (`leads.verified.csv`). **Catch-all is NOT send-file material on a young domain**, see the Catch-All Timing HARD RULE: even a verified catch-all is held back until the sending domains have ~2-3 weeks of positive sending.
8. Put `catch_all` (even verified) into a **per-campaign holdback** (`leads.catchall-holdback.csv`) with the rendered per-contact copy preserved; put `unknown`, `risky`, and `invalid` emails in `leads.review.csv`. Do not upload any of them into the initial campaign. Catch-alls reintroduce later via `/cold-email-weekly-rhythm`; the rest stay out.
9. Save the clean output as `leads.verified.csv`.
10. Run `/list-quality-scorecard` before copy or upload.

## Waterfall enrichment (residue / fallback waterfall)

The waterfall enricher is the all-in-one **waterfall finder** used as the **residue tool** of the Verification Doctrine. It runs ONLY on the rows the email finder could not close: (a) rows the finder returned no work email for, and (b) rows whose email, existing or finder-found, came back `invalid` / `catch_all` / catch-all-not-safe. **Never the first attempt, and never a high-volume shortcut**: finder + verifier is the mandatory first pass (HARD RULE; see Required Order step 5). Never run it on rows that already have an unverified email, verify those first. It fans each contact across many email/phone providers in sequence, runs its own internal check, and on a **pay-only-for-valid** model charges a credit only when the data passes. Its internal check is a **provider signal, NOT the send-gate**: every email it finds is still re-verified by the email verifier before sending (see step 6 and the Verification Doctrine; no source is exempt, operator directive 2026-06-22).

**It is a Layer-2 step: run it on the campaign slice that is going live, never across the whole TAM.** Per-contact credits are the expensive layer; the TAM stays company-level (`/tam-build`).

**How to run it.** Resolve the waterfall enricher from the stack contract; if that slot is empty, stop and route to `/stack-setup`. Whatever runner the contract wires to the slot, it must support these three steps in order, and it reads its API key from `scripts/.env`. **Run it on the post-suppression survivors, after Required Order steps 1-2 (dedupe + drop suppression matches), never on the raw list**, so you never pay to enrich someone you cannot contact:

1. **Connectivity + balance check (free, no spend)** before anything else.
2. **Cost preview**: parse the CSV, count eligible rows, spend nothing. The eligible-row count is the upper bound on spend; pay-per-valid means actual spend is usually lower.
3. **Enrich**, after the `/api-cost-governance` gate below. Default to email only, on rows missing a valid email, with a hard pre-submit credit cap.

The waterfall is async (it takes minutes), so the runner must: submit in batches under the provider's per-request contact cap, run a bounded number of batches in parallel, poll each until it terminates, join results back to the input rows by a stable per-row id (never by batch index alone, and with a count check if index fallback is used), and write the canonical `email` / `email_status` columns plus the enricher's own status/provider columns and an enriched flag. It must journal submitted batch ids to a resume file so a re-run resumes instead of re-spending. Only `valid` rows are send-safe; the rest route to the review path by status, exactly as the gate below requires.

**Cost gate (required).** The waterfall enricher is a paid, credit-based tool, so route every run through `/api-cost-governance` first: preview the credit/USD cost, check the balance, and block if the key is under cost or under the warning threshold. Use a hard pre-submit credit cap as the stop.

**Never submit a run your balance can't cover: the "on hold" trap (binding).** On many credit-based enrichers, the instant credits hit 0 the in-flight and new requests are parked **on hold**, and held calls do **NOT** auto-retrigger when you top up later. Someone has to manually reprocess the queue in the provider's cockpit, and processing still needs credits. So the step-1 balance check is load-bearing, not optional: if the live balance cannot cover this slice, **top up first, then run**. Never submit and leave a stuck queue. The runner should enforce this (abort at a 0 balance, warn when the balance is below the eligible-row count). To prevent it structurally rather than reactively: credit-based enrichers typically bill a **monthly allowance** (commonly 1 credit per verified email and ~10 per verified phone, with unused credits rolling over only up to the plan cap before resetting monthly), so for recurring or high-volume sending, **size the monthly plan above your real monthly enrichment volume** instead of topping up after each stall. Respect the provider's published API limits (a per-minute request ceiling and a per-request contact cap are both normal) and stay well under them even while running batches in parallel. **The speed lever for a big list is the runner's concurrency setting, not more contacts per request**, and useful parallelism usually caps out at a handful of concurrent batches. Do not push concurrency past that, and do not run multiple runner instances at once: those are what risk the on-hold throttle. If the operator gives a rough daily or weekly request volume, estimate the monthly credits needed and recommend the matching plan tier.

## Stop Gates

Stop and ask before spending money when:

- Lead scoring is incomplete, stale, or missing from any row in the paid queue
- Any ineligible, suppressed, hard-no, or rank 3+ same-company row leaked into the active wave
- The list has more than 500 rows and no ICP qualification pass exists
- The list has no `lead-source-plan.md` and the source is not obvious from the user's latest request
- The user has not approved the enrichment budget
- Required API credentials are missing
- The list source is mostly company-level and has no person names

Stop and do not upload when:

- Any unchecked row remains in the send file. This skill is the single owner of the verification gate: `leads.verified.csv` must be **100% verification-checked**, with every non-deliverable (invalid / risky / catch-all-fail) row moved to `leads.review.csv` — never into the send file.
- Fewer than 80% of the original sourced rows survived as verified-deliverable. Below that the source itself is too weak — fix the source, do not send a thin list.
- The source list has not passed `/list-quality-scorecard` with grade B or better. (The scorecard reports coverage; it does not re-gate verification — that gate lives here.)

## Output Files

Write outputs under the active campaign or profile folder:

```text
profiles/<business-slug>/campaigns/<campaign-slug>/
  leads.raw.csv
  leads.enriched.csv
  leads.verified.csv
  leads.review.csv
  email-waterfall-report.md
```

The report must include:

- Input row count
- Deduped row count
- Rows dropped by suppression match
- Emails found
- Emails verified valid
- Catch-all or risky count
- Rows dropped and why
- Source family and source confidence breakdown
- Count of rows missing `evidence_url` when the campaign intends to reference the signal
- Provider spend estimate
- Next skill: `/list-quality-scorecard`

## Platform Boundary

This skill never uploads to a sending platform.

After `/list-quality-scorecard` passes, hand the verified list to the upload workflow for the platform locked in `run_state.sending_platform`. Resolve that platform and its upload path from the stack contract; if the sending-platform slot is empty or no platform is locked, stop and route to `/stack-setup`. Never guess a platform or improvise an upload path.

Only show the path matching locked `run_state.sending_platform`.

## Related Skills

- `/icp-prompt-builder` - qualify the list before enrichment
- `/lead-source-strategy` - decide the source path before source collection or enrichment
- contact discovery - create person-level rows from company domains (resolve the contact-discovery source from the stack contract)
- `/list-quality-scorecard` - required after this skill
- `/campaign-copywriting` - only after the list passes quality review

