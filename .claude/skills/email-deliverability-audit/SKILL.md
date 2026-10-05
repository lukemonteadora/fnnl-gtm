---
name: email-deliverability-audit
description: Diagnostic audit for a running cold email program. Checks DNS authentication, inbox health, warmup, bounce and reply rates, sender rotation, spam-placement evidence when available, and copy/list risks. Routes by the locked run_state.sending_platform, with no assumed vendor.
---

# Email Deliverability Audit

**From the former description:** Uses the locked run_state.sending_platform to route to that platform's inbox manager, its native analytics, or a manual path, with no assumed vendor.

## Canonical Profile Root

All profiles/<business-slug> paths in this skill resolve under:

```text
<outbound>/profiles
```

Here `<outbound>` is the root of this skill library - resolve it to wherever the library is currently checked out (local Documents, OneDrive, or a git worktree); never hardcode an absolute path. Do not create client profiles under a `profiles/` folder at your current working directory.

If positive replies drop, do not blame the offer first. Check whether emails are reaching inboxes.

This skill is diagnostic. It does not change senders, pause campaigns, buy domains, or switch providers. Fixes route to the locked provider skills.

## Material Decision Rule

When this skill reaches a material fork, name the realistic options, recommend the strongest path, and explain why the main alternatives are weaker before committing.

Ask before choices that affect spend beyond an approved budget, provider routing, source of truth, list quality, campaign direction, client-facing output, live systems, scraping or account risk, or legal/compliance risk. For low-risk reversible choices, state the recommendation and proceed.

Do not turn failed or unsafe paths into user-facing options. If this skill's QA rules or stop gates reject a path, filter it out and explain the blocker only when useful.

When asking the user, use the Claude Desktop native Interactive Inputs / Choice Prompts pattern from /clarification-first: recommended option first, short choices, and Custom answer last when a custom answer is plausible.

## Provider Lock

Read `run_state.sending_platform` before choosing any check. It is locked per client and inherited from `<outbound>/stack-contract.yaml`.

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
| Complaint proxy | Hostile replies per 1,000 sends (`hostile_per_1000`), beside bounce | `reply-scoring-core.md`, counted from `negative_hostile` replies |
| Copy risk | Spam words, hype, hard CTA, em dashes | `/spam-word-checker` and `cold-email-copy-best-practices.md` |
| List risk | Verification coverage, ICP drift, duplicate domains | `/list-quality-scorecard` |
| Spam placement | Inbox placement test if available | The locked platform's own placement test, or an external seed-list tool |
| Mailbox age | Sending days by domain/batch against the ~45 / 60-90 bands | `/cold-email-weekly-rhythm`'s mailbox age clock |

**Run these as a recurring, multi-signal rhythm, not one dashboard number:** daily spam checks, weekly reply-rate reviews, a placement test, and forwarding tests. No single one of them is trustworthy alone.

**Complaint proxy, labeled a proxy on purpose.** Microsoft 365 senders give no Postmaster complaint data, so `hostile_per_1000` stands in for it. Report it beside bounce every time; there is no house threshold yet, so flag the number and its trend, not a pass/fail line.

**Ordering, on a reply-rate drop (Aaron flow (see aaron-flow.md), section 10): deliverability outranks copy and offer.** Run the placement test before diagnosing copy or offer. If it reads under 70%, the problem is deliverability and the offer/copy diagnosis waits; if it reads over 85%, deliverability is clean and gets looked at last, after copy and offer.

These same instruments are legitimate here as **infrastructure** diagnostics (is the sending layer healthy), and not as a campaign report card (did the campaign perform). Using them this way is not in tension with refusing to judge a campaign by spam-placement scores, platform reputation numbers, or bounce rate. Both the rhythm and that reconciliation are in `eric-deliverability-doctrine.md`.

## The 1 Percent Rule

A healthy domain should have at least 1% overall reply rate after 200+ sends.

Flag any sender or domain with:

- `sent >= 200`
- `reply_rate < 1%`

Below 200 sends, do not overread the data.

**This is a capacity-management habit, not a root-cause diagnosis.** Eric runs the weekly cancel at roughly 1%, but he never claims the domain itself was at fault rather than the offer or the list, and sections 1 and 9 of his doctrine put a reply-rate shortfall on the offer or the list more often than on the sending domain. So check the offer and the list first: audit step 4 below, `Check Copy And List Before Blaming Infrastructure`, runs before any domain is retired on this rule. Used as a root-cause fix, this rule retires healthy domains that were carrying a weak offer. The caveat is in `eric-deliverability-doctrine.md`.

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

Run the selected platform's inbox placement test (PlusVibe's own placement test where PlusVibe is the locked platform; ruling `placement-test`, standing-rulings.md, 2026-10-05). Its cost is read before first use (`/api-cost-governance`); the operator's OK is asked once, at checkpoint A, then stored as the ruling.

A platform's own placement test applies only to that platform: its seed lists, metric names, and thresholds are not portable. If the locked platform has no placement test, use an external seed-list placement tool instead.

**Thresholds (Aaron flow (see aaron-flow.md), section 10):**
- **>=85% inbox placement:** clean.
- **70-85%:** grey zone. Re-run once with different senders before trusting the result either way.
- **<70%:** critical. Pause the campaign and route to `/deliverability-incident-response`.

Do not present spam-placement results as proven if no placement test was run. **A test not run is reported as a gap, never as a pass.**

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
- Hostile replies per 1,000 sends (complaint proxy):
- Placement test (date, inbox placement %, band, or "not run: <reason>"):
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

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short: record status, not raw output. Full protocol: `client-activity-log.md`.
