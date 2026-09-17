---
name: blitz-list-builder
description: Use Blitz or equivalent domain-to-person enrichment when you already have target company domains. Best for SMB owner-finding, named-account lists, and filling contacts for a source plan that already selected target accounts. Outputs a person-level CSV for /email-waterfall, /list-quality-scorecard, then the locked platform upload path.
---

# Blitz List Builder

Prospeo is title-first. Blitz is domain-first.

Use this when you already know the target companies and need owners, founders, managers, or named contacts.

## Material Decision Rule

When this skill reaches a material fork, name the realistic options, recommend the strongest path, and explain why the main alternatives are weaker before committing.

Ask before choices that affect spend, provider routing, source of truth, list quality, campaign direction, client-facing output, live systems, scraping or account risk, or legal/compliance risk. For low-risk reversible choices, state the recommendation and proceed.

Do not turn failed or unsafe paths into user-facing options. If this skill's QA rules or stop gates reject a path, filter it out and explain the blocker only when useful.

When asking the user, use the Claude Desktop native Interactive Inputs / Choice Prompts pattern from /clarification-first: recommended option first, short choices, and Custom answer last when a custom answer is plausible.

## When To Use

| Situation | Use |
|---|---|
| You have 500 restaurant domains and need owners | Blitz |
| You need CFOs across a broad industry | Run `/lead-source-strategy` first, then use the selected person-data path |
| You need extra contacts at known accounts | Blitz |
| You have a named-account list | Blitz |

## Inputs

- CSV or TXT of company domains
- Desired title keywords
- Blitz API access or another approved domain-to-person enrichment provider

Expected input column:

```text
company_domain
```

## Output

Write:

```text
company_domain,first_name,last_name,job_title,linkedin_url,email,email_source,company_name,company_industry,company_headcount,company_phone
```

Email may be empty. That is normal. /email-waterfall owns missing-email fill and verification.

**`first_name` + `last_name` must be real and populated on every row** — they are the finder key `/email-waterfall` uses (first+last+domain). A domain-to-person pull that returns a domain but no real person, or a pattern/placeholder name, is NOT a valid hand-off: re-source the real person before passing the row on. `linkedin_url` is a completeness target (fill it where Blitz returns it); a missing LinkedIn does not block the row. If a row already carries an `email`, leave it — `/email-waterfall` will **verify it first** (email + catch-all) rather than pay a finder to re-discover it.

## Required Flow

1. Clean domains to bare domains.
2. Run a small sample first.
3. Run `/icp-prompt-builder` on a sample before scaling.
4. Pull contacts using Blitz/API/UI.
5. Filter obvious wrong titles.
6. Run /email-waterfall.
7. Run `/list-quality-scorecard`.
8. Continue to `/campaign-copywriting`, then the upload skill matching locked `run_state.sending_platform`.

## Title Filtering

Start specific. Broad keywords waste enrichment budget.

Examples of title direction:

- Restaurants: owner, operator, general manager
- SaaS RevOps: revenue operations, VP sales, director sales
- Dental: dentist, owner, practice manager
- Law firms: partner, managing partner, principal

## Stop Gates

Stop before scaling if:

- The sample has less than 40% ICP fit
- Domains are not clean bare domains
- The user has not approved enrichment spend
- There are no person names and no approved enrichment provider

## Common Gotchas

- Big companies return too many contacts. Use tighter title filters.
- Stale LinkedIn data is normal. Verify emails and spot-check titles.
- Missing email does not mean the person is unreachable.
- Do not upload directly from this skill.

## What To Do Next

Run /email-waterfall, then `/list-quality-scorecard`.

After scorecard passes B or better, proceed to `/campaign-copywriting`, then only the upload skill matching locked `run_state.sending_platform`.

## Related Skills

- `/icp-prompt-builder`
- /email-waterfall
- `/list-quality-scorecard`
- `/prospeo-full-export`
- `/google-maps-list-builder`
- `/disco-like`

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short — record status, not raw output. Full protocol: `client-activity-log.md`.
