---
name: email-deliverability-audit
description: Diagnostic audit for a running cold email program. Checks DNS authentication, inbox health, warmup status, bounce rates, reply rates, sender rotation, spam-placement evidence when available, and copy/list risks. Uses the locked run_state.sending_platform to route to that platform's inbox manager, its native analytics, or a manual path, with no assumed vendor.
---

# Email Deliverability Audit
## Canonical Profile Root

All profiles/<business-slug> paths in this skill resolve under:

```text
<coldoutbound-skills>/profiles
```

Here `<coldoutbound-skills>` is the root of this skill library - resolve it to wherever the library is currently checked out (local Documents, OneDrive, or a git worktree); never hardcode an absolute path. Do not create client profiles under a `profiles/` folder at your current working directory.

If positive replies drop, do not blame the offer first. Check whether emails are reaching inboxes.

This skill is diagnostic. It does not change senders, pause campaigns, buy domains, or switch providers. Fixes route to the locked provider skills.

## Material Decision Rule

When this skill reaches a material fork, name the realistic options, recommend the strongest path, and explain why the main alternatives are weaker before committing.

Ask before choices that affect spend, provider routing, source of truth, list quality, campaign direction, client-facing output, live systems, scraping or account risk, or legal/compliance risk. For low-risk reversible choices, state the recommendation and proceed.

Do not turn failed or unsafe paths into user-facing options. If this skill's QA rules or stop gates reject a path, filter it out and explain the blocker only when useful.

When asking the user, use the Claude Desktop native Interactive Inputs / Choice Prompts pattern from /clarification-first: recommended option first, short choices, and Custom answer last when a custom answer is plausible.

## Provider Lock

Read `run_state.sending_platform` before choosing any check. It is locked per client and inherited from `<coldoutbound-skills>/stack-contract.yaml`.

**If `run_state.sending_platform` is empty, stop.** The contract has no sending platform recorded, so there is nothing to audit against. Route the operator to `/stack-setup`. Do not guess a platform, and do not fall back to a vendor named in an example.

Once the platform is known, route in this order:

1. **An activated inbox-manager skill for that platform.** If `/stack-setup` activated a vendor pack, that pack supplies a platform-specific inbox manager (for example an inbox manager skill matching the platform name). Use it plus that platform's own analytics.
2. **The platform's native health surface.** If no pack is activated for the locked platform, use its native warmup, bounce, sender-health, and campaign analytics directly through its API or UI.
3. **Manual.** If the platform exposes neither, say so plainly and collect what is available by hand. Report the gap rather than implying full coverage.

**Never run one platform's checks against another.** Metric names and thresholds are not portable between sending platforms, and a borrowed threshold produces a confident wrong verdict. If you are unsure whether a check applies to the locked platform, confirm before running it.

## What To Check

| Layer | Check | Source |
|---|---|---|
| DNS auth | SPF, DKIM, DMARC on every sending domain | DNS lookup or registrar/mailbox setup skill |
| Sender health | Connected, blocked, warmup, reputation, tags | Locked inbox manager or platform UI |
| Volume | Sent per sender and per domain | Locked sending platform analytics |
| Bounce rate | Per sender, domain, and campaign | Locked sending platform analytics |
| Reply rate | Overall and per sender | Locked sending platform analytics |
| Copy risk | Spam words, hype, hard CTA, em dashes | `/spam-word-checker` and `cold-email-copy-best-practices.md` |
| List risk | Verification coverage, ICP drift, duplicate domains | `/list-quality-scorecard` |
| Spam placement | Inbox placement test if available | The locked platform's own placement test, or an external seed-list tool |

## The 1 Percent Rule

A healthy domain should have at least 1% overall reply rate after 200+ sends.

Flag any sender or domain with:

- `sent >= 200`
- `reply_rate < 1%`

Below 200 sends, do not overread the data.

## Inputs

Collect:

- `profiles/<business-slug>/client-profile.yaml`
- Active campaign IDs
- Active sender list
- Sending-platform analytics export
- Bounce export if separate
- Current copy or `variants.yaml`
- Latest list scorecard, if available

## Audit Steps

### 1. Inventory Senders

Export or list every active, insurance, and retired sender.

Required columns:

```text
email, domain, provider, platform_status, warmup_status, reputation, tags, sent_30d, replies_30d, bounces_30d
```

If the platform cannot export all fields, collect the strongest available equivalent and state the gap in the report.

### 2. Check DNS Authentication

For every unique sending domain, check:

```text
SPF:   TXT <domain>
DKIM:  TXT <selector>._domainkey.<domain>
DMARC: TXT _dmarc.<domain>
```

Use the selector from the mailbox provider. Do not assume `default` unless the setup skill or provider confirms it.

### 3. Calculate Health Metrics

For each sender and domain:

```text
reply_rate = replies / sent
bounce_rate = bounces / sent
```

Flag:

- Bounce rate above 3%
- Overall reply rate below 1% after 200+ sends
- Blocked or disconnected senders
- Reputation decline
- Active senders with no sends
- Insurance senders accidentally used in live campaigns

### 4. Check Copy And List Before Blaming Infrastructure

If DNS and sender health look clean, run:

1. `/list-quality-scorecard`
2. `/spam-word-checker`
3. `cold-email-copy-best-practices.md`

Bad list and bad copy can look like deliverability failure. Do not skip this.

### 5. Spam Placement

If available, run the selected platform's inbox placement test.

A platform's own placement test applies only to that platform: its seed lists, metric names, and thresholds are not portable. If the locked platform has no placement test, use an external seed-list placement tool instead.

Do not present spam-placement results as proven if no placement test was run.

## Report Format

Write:

```text
profiles/<business-slug>/deliverability-audit-<YYYY-MM-DD>.md
```

Include:

```markdown
# Deliverability Audit - <date>

## Summary
- Sending platform:
- Sender count:
- Domains checked:
- Overall reply rate:
- Overall bounce rate:
- DNS failures:
- Sender health failures:
- List/copy risks:

## Critical Issues
1. <issue, evidence, exact sender/domain/campaign, action>

## Warnings
1. <issue, evidence, action>

## Clean Checks
- <what passed>

## Evidence Gaps
- <what could not be verified>

## Next Actions
1. <provider-locked next step>
```

## Routing Fixes

- DNS/auth problem: use the setup skill matching locked `run_state.infrastructure_stack`.
- Sender problem: the inbox manager for the locked `run_state.sending_platform`, from whichever pack `/stack-setup` activated. If no pack is active, use that platform's native sender settings. If neither exists, say so and do the fix by hand rather than implying coverage.
- Bad list: /email-waterfall, then `/list-quality-scorecard`.
- Bad copy: `/campaign-copywriting` with QA gates.
- Inbox-type breakdown (which inbox type delivers best): the placement-test skill from whichever pack `/stack-setup` activated for the locked platform, otherwise that platform's own inbox-placement report.
- Severe issue: `/deliverability-incident-response`. This audit and incident-response are a single diagnose->triage pass: incident-response may schedule ONE re-audit after its own 7-day window; neither should re-invoke the other within the same run.

## Common Failure Modes

- Missing DKIM or wrong selector
- DMARC exists but does not align
- Bounce rate above 3%
- Too many senders per domain
- Active senders with bad or blocked reputation
- Warmup stopped too early
- Insurance senders accidentally used for live campaigns
- Copy contains hype, spam words, or hard scheduling asks
- List is unverified or wrong ICP

## What To Do Next

If critical flags fired, run `/deliverability-incident-response`.

If all clean, keep the weekly rhythm through `/cold-email-weekly-rhythm`.

If verification was blocked, say exactly what could not be checked and use the strongest available fallback evidence.

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short — record status, not raw output. Full protocol: `client-activity-log.md`.
