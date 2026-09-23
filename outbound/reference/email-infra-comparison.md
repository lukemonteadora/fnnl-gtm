# Email Infrastructure: Cost Tracker & Provider Comparison
**Prepared for:** VP of Operations  
**Date:** May 2026  
**Status:** Draft (For Review)

---

## Purpose

This document covers:
1. The math behind inbox/domain requirements at each sending volume
2. Side-by-side monthly cost breakdown: **Zapmail** (current) vs **InboxKit** and **Primeforge** (proposed)
3. Total cost of ownership including hidden costs
4. Provider scorecards
5. Recommended testing plan and migration roadmap

---

## Sending Volume Assumptions

| Assumption | Value | Rationale |
|---|---|---|
| Sends per inbox per day | **30** | Conservative safe rate for Google Workspace, reduces suspension risk |
| Inboxes per domain | **2** | Industry standard; Zapmail recommends 1–3, max 5 |
| Sending days per month | **30** | Calendar month |
| Domain cost basis | **$1.08–$1.17/mo** | ~$13–14/yr .com, amortized monthly |

### Infrastructure Requirements by Volume

| Daily Sends | Monthly Sends | Inboxes Needed | Domains Needed | Sends/Inbox/Day |
|---|---|---|---|---|
| 500 | 15,000 | **17** | **9** | 30 |
| 1,000 | 30,000 | **34** | **17** | 30 |
| 1,500 | 45,000 | **50** | **25** | 30 |
| 2,000 | 60,000 | **67** | **34** | 30 |

> **How to read this:** To send 1,000 emails/day safely at 30 sends/inbox, you need 34 inboxes spread across 17 domains.

---

## Monthly Cost Comparison

### 500 Emails/Day: 17 Inboxes / 9 Domains

| Cost Item | Zapmail | InboxKit | Primeforge |
|---|---|---|---|
| Platform plan | Starter + 7 extras = **$63.50** | Professional + 7 extras = **$55.50** | 17 slots × $4.50 = **$76.50** |
| Domain cost | 9 × $1.08 = **$9.72** | 9 × $1.00 = **$9.00** | 9 × $1.17 = **$10.53** |
| Warmup | Included (standard or pre-warmed plan) | +$3/inbox/mo = **$51** (first ~2 months) | Included (pre-warmed also available on Zapmail) |
| Monitoring | Limited (basic) | InfraGuard: **free 1st month**, then ~$X | Warmforge: **separate tool/bill** |
| **Total (steady state)** | **~$73/mo** | **~$65/mo** | **~$87/mo** |
| **Total (month 1 incl. warmup)** | ~$73/mo | ~$116/mo | ~$87/mo |
| **Cost per 1,000 emails** | $4.87 | $4.33 | $5.80 |

---

### 1,000 Emails/Day: 34 Inboxes / 17 Domains

| Cost Item | Zapmail | InboxKit | Primeforge |
|---|---|---|---|
| Platform plan | Growth + 4 extras = **$112.00** | Agency + 4 extras = **$94.00** | 34 slots × $4.50 = **$153.00** |
| Domain cost | 17 × $1.08 = **$18.36** | 17 × $1.00 = **$17.00** | 17 × $1.17 = **$19.89** |
| Warmup | Included (standard or pre-warmed plan) | +$3/inbox = **$102** (first ~2 months) | Included (pre-warmed also available on Zapmail) |
| Monitoring | Limited | InfraGuard: **free 1st month**, then ~$X | Warmforge: **separate tool/bill** |
| **Total (steady state)** | **~$130/mo** | **~$111/mo** | **~$173/mo** |
| **Total (month 1 incl. warmup)** | ~$130/mo | ~$213/mo | ~$173/mo |
| **Cost per 1,000 emails** | $4.33 | $3.70 | $5.77 |

---

### 1,500 Emails/Day: 50 Inboxes / 25 Domains

| Cost Item | Zapmail | InboxKit | Primeforge |
|---|---|---|---|
| Platform plan | Growth + 20 extras = **$164.00** | Agency + 20 extras = **$146.00** | 50 slots × $4.50 = **$225.00** |
| Domain cost | 25 × $1.08 = **$27.00** | 25 × $1.00 = **$25.00** | 25 × $1.17 = **$29.25** |
| Warmup | Included (standard or pre-warmed plan) | +$3/inbox = **$150** (first ~2 months) | Included (pre-warmed also available on Zapmail) |
| Monitoring | Limited | InfraGuard: **free 1st month**, then ~$X | Warmforge: **separate tool/bill** |
| **Total (steady state)** | **~$191/mo** | **~$171/mo** | **~$254/mo** |
| **Total (month 1 incl. warmup)** | ~$191/mo | ~$321/mo | ~$254/mo |
| **Cost per 1,000 emails** | $4.24 | $3.80 | $5.64 |

---

### 2,000 Emails/Day: 67 Inboxes / 34 Domains

| Cost Item | Zapmail | InboxKit | Primeforge |
|---|---|---|---|
| Platform plan | Growth + 37 extras = **$219.25** | Agency + 37 extras = **$201.25** | 67 slots × $4.50 = **$301.50** |
| Domain cost | 34 × $1.08 = **$36.72** | 34 × $1.00 = **$34.00** | 34 × $1.17 = **$39.78** |
| Warmup | Included (standard or pre-warmed plan) | +$3/inbox = **$201** (first ~2 months) | Included (pre-warmed also available on Zapmail) |
| Monitoring | Limited | InfraGuard: **free 1st month**, then ~$X | Warmforge: **separate tool/bill** |
| **Total (steady state)** | **~$256/mo** | **~$235/mo** | **~$341/mo** |
| **Total (month 1 incl. warmup)** | ~$256/mo | ~$436/mo | ~$341/mo |
| **Cost per 1,000 emails** | $4.27 | $3.92 | $5.68 |

---

## Summary: Steady-State Cost by Volume

| Daily Volume | Zapmail (current) | InboxKit (proposed) | Primeforge (proposed) |
|---|---|---|---|
| 500/day | $73/mo | **$65/mo** ✅ | $87/mo |
| 1,000/day | $130/mo | **$111/mo** ✅ | $173/mo |
| 1,500/day | $191/mo | **$171/mo** ✅ | $254/mo |
| 2,000/day | $256/mo | **$235/mo** ✅ | $341/mo |
| Cost/1k emails (avg) | ~$4.43 | **~$3.94** ✅ | ~$5.72 |

> **InboxKit is consistently the cheapest at every volume once warmed up. Primeforge is most expensive but justifies the premium through noticeably better inbox placement rates (from direct experience) and best-in-class customer support. A dedicated Slack/Teams channel means infra issues get resolved same-day instead of sitting in a ticket queue.**

---

## Total Cost of Ownership: Hidden Costs

Headline pricing doesn't tell the full story.

| Factor | Zapmail | InboxKit | Primeforge |
|---|---|---|---|
| Warmup delay before sending | 3–4 weeks (standard) or pre-warmed plan (higher cost) | 2 weeks minimum (warmup add-on required) | Pre-warmed plan available (same as Zapmail) |
| Warmup cost | Included in plan or pre-warmed plan | **+$3/inbox/mo** for ~2 months | Included |
| Monitoring | Basic: you manage yourself | InfraGuard (1st month free, then paid) | Separate Warmforge tool |
| M365 SMTP limitation | **No app passwords for M365**, only OAuth | Full SMTP + app passwords | Full SMTP + app passwords |
| Setup complexity | API-friendly, scriptable | Under 10 min, managed | 30-min provisioning |
| Support | **Self-serve, no dedicated channel** | 24/7 priority ticket (all plans) | **Dedicated Slack/Teams channel: direct access to their team, issues resolved same-day** |
| API access | Pro plan only ($299/mo) | **All plans** | All plans |
| Pre-aged domains | No | No | **Yes** |
| SOC2 compliance | No | No | **Yes** |
| Ecosystem lock-in | None | None | Forge Stack (Salesforge, Warmforge, Infraforge) |
| Blacklist monitoring | Limited | InfraGuard (included, 1st month free) | Via Warmforge (separate) |
| Integrations | 50+ (OAuth) | 15–24 native | Any SMTP tool |

---

## Provider Scorecards

### Zapmail (Current)
| Dimension | Score | Notes |
|---|---|---|
| Price | ⭐⭐⭐ | Competitive mid-range |
| Inbox placement rate | n/a | No published guarantee; no direct data to score |
| Deliverability tooling | ⭐⭐ | Limited built-in monitoring: blacklist alerts and analytics are thin |
| M365 support | ⭐⭐ | M365 supported but no SMTP/app passwords: OAuth only, limits sequencer compatibility |
| API / automation | ⭐⭐⭐⭐ | Strong API, scriptable, 50+ integrations |
| Customer success | ⭐⭐ | Self-serve only, no dedicated support channel |
| Scale / reliability | ⭐⭐⭐⭐ | 500k+ mailboxes, 35k+ businesses. Most proven at scale |
| **Overall** | **⭐⭐⭐** | Best for API-driven automation. Weakest on monitoring, M365 SMTP, and support. |

### InboxKit (Best Recommendation)
| Dimension | Score | Notes |
|---|---|---|
| Price | ⭐⭐⭐⭐ | Cheapest at every volume in steady state |
| Inbox placement rate | ⭐⭐⭐⭐⭐ | **Guarantees 95% inbox placement**, published and backed by their platform |
| Deliverability tooling | ⭐⭐⭐⭐ | InfraGuard: blacklist monitoring, DNS watchdog, bounce tracking, inbox placement tests |
| M365 support | ⭐⭐⭐⭐ | Full SMTP + app passwords on all plans |
| API / automation | ⭐⭐⭐⭐ | API on all plans, bulk CSV import, webhooks |
| Customer success | ⭐⭐⭐⭐ | 24/7 priority support on all plans |
| Scale / reliability | ⭐⭐⭐ | G2 4.3/5 (45 reviews, 80% trust score) |
| **Overall** | **⭐⭐⭐⭐⭐** | Best all-in-one value. Cheapest long-term, strongest deliverability guarantee, complete tooling. |

### Primeforge (Recommended)
| Dimension | Score | Notes |
|---|---|---|
| Price | ⭐⭐ | Most expensive per inbox at every volume |
| Inbox placement rate | ⭐⭐⭐⭐⭐ | **Direct experience: consistently better primary inbox landing vs Zapmail** |
| Deliverability tooling | ⭐⭐⭐ | ESP matching is a genuine differentiator; monitoring via separate Warmforge tool |
| M365 support | ⭐⭐⭐⭐ | Full SMTP + app passwords |
| API / automation | ⭐⭐⭐ | API available on all plans |
| Customer success | ⭐⭐⭐⭐⭐ | **Dedicated Slack/Teams channel: direct line to their team whenever something breaks. In cold email infra, things will break. This is the most underrated differentiator.** |
| Scale / reliability | ⭐⭐⭐ | Solid infrastructure; pre-aged domains add reputation trust |
| **Overall** | **⭐⭐⭐⭐** | Premium price justified by real-world inbox performance and the best support experience of the three. |

---

## Recommendation

### Primary: Migrate to InboxKit
- **Why:** Cheapest at scale, best monitoring tooling, full M365 SMTP support, 24/7 support on all plans, API on all plans
- **Savings vs Zapmail:** ~$10–21/mo per volume tier in steady state (~11–16% cheaper)
- **Consideration:** InboxKit warmup adds ~$51–$201/mo for the first 2 months depending on volume. Factor this into migration budget.

### Secondary: Primeforge
- **Why:** Direct experience shows better inbox placement rates vs Zapmail. ESP matching (sending from the same provider as your prospect) is a real signal. Most importantly, infra always breaks eventually, and Primeforge is the only provider of the three with a dedicated Slack/Teams support channel. That's worth paying for.
- **Scope:** Run alongside InboxKit at 500 emails/day (minimum 10 mailboxes) to validate inbox rate delta
- **Budget:** ~$87/mo
- **Path to primary:** If inbox rate advantage holds at scale, elevate to co-primary with InboxKit (Primeforge for high-value sequences, InboxKit for volume)

### Keep Zapmail for API Automation
- Until InboxKit migration is proven, keep Zapmail running for any scripted/automated domain provisioning workflows (the API is superior for this use case)

---

## Proposed Testing Plan

### Phase 1: Parallel Test (Month 1–2)
| Action | Provider | Budget | Owner |
|---|---|---|---|
| Set up 10 mailboxes, 5 domains | InboxKit Professional | ~$36/mo | Ops |
| Set up 10 mailboxes, 5 domains | Primeforge (10 min.) | ~$48/mo | Ops |
| Keep current Zapmail setup running | Zapmail | Existing | n/a |
| Track: inbox placement, reply rate, bounce rate, blacklist incidents, support response time | All three | n/a | Ops |

### Phase 2: Evaluation (End of Month 2)
Decide primary provider based on:
- Inbox placement rate (target: >90%)
- Bounce rate (target: <3%)
- Blacklist incidents (target: 0)
- Support quality

### Phase 3: Migration (Month 3)
- Migrate full inbox pool to winning provider
- Deprecate Zapmail slots as leases expire
- Maintain Zapmail API access if needed for domain automation scripts

---

## Key Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| InboxKit warmup delay (2 weeks before full send volume) | High (by design) | Medium | Start migration 3 weeks before needed; maintain Zapmail during ramp |
| Primeforge Forge ecosystem lock-in | Medium | Medium | Use Primeforge for mailboxes only; keep Warmforge optional |
| Zapmail M365 mailboxes lack SMTP (OAuth only) | Confirmed | High if sequencer needs SMTP | Use Google Workspace on Zapmail, or switch M365 to InboxKit/Primeforge |
| Primeforge cost premium (~33–44% above Zapmail) | High | Medium | Justify with inbox placement data from parallel test; only scale if the rate delta is measurable |

---

## Pricing Reference (Direct from Provider Pages, May 2026)

### Zapmail
| Plan | Monthly Price | Included Mailboxes | Extra Mailbox Rate |
|---|---|---|---|
| Starter | $39/mo | 10 | $3.50/mo |
| Growth | $99/mo | 30 | $3.25/mo |
| Pro | $299/mo | 100 | $3.00/mo |
| Annual | 2 months free | n/a | ~$2.50/inbox |
| Domains | $13/yr (.com) | n/a | n/a |

### InboxKit
| Plan | Monthly Price | Included Mailboxes | Extra Mailbox Rate |
|---|---|---|---|
| Professional | $31/mo | 10 | $3.50/mo |
| Agency | $81/mo | 30 | $3.25/mo |
| Enterprise | $250/mo | 100 | $2.99/mo |
| Annual | ~20% off | n/a | n/a |
| Warmup add-on | +$3/inbox/mo | n/a | n/a |
| Azure tenants | +$30/domain | n/a | n/a |
| Domains | Bring your own (~$10–14/yr) | n/a | n/a |

### Primeforge
| Plan | Monthly Price | Included Mailboxes | Extra Mailbox Rate |
|---|---|---|---|
| Standard (annual) | $4.50/inbox/mo | Min. 10 slots | n/a |
| Annual | 2 months free (~$3.75/inbox) | n/a | n/a |
| Domains | $14/yr (.com) | n/a | n/a |
| Consulting | $500 (2× sessions) | n/a | Optional |
