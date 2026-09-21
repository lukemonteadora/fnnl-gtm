# Eric's Deliverability and Infrastructure Doctrine

Reference doc for the deliverability and infrastructure skills. It encodes sections 15
(vendor benchmarking) and 16 (infrastructure resilience and domain lifecycle) of
`eric-doctrine.md`, held in `/ask-eric`.

Read this when running a deliverability audit, sizing or reallocating a mailbox fleet,
responding to a sending incident, or deciding whether to add or swap a data vendor.

---

## How to hold this file (read before applying any number here)

Eric's corpus has no equivalent of Aaron's "where Aaron ends and house rules begin" section
and no conflict ledger. This header supplies that boundary, so the rules below get used the
way he actually states them.

1. **Every number here is his own customers' data**, and he says so himself on every stat:
   "take it with a grain of salt, it's just my data." Treat these as strong priors worth
   testing, never as universal law.
2. **The governed contract wins for a live campaign.** Where a rule here disagrees with the
   active skill contract or a dated operator directive, the contract governs. Surface the
   conflict and ask for an explicit decision; never quietly swap a house rule for Eric's.
3. **Never attribute a house rule to Eric.** Several numbers in this repo sit near his
   material but are not his. The ≥500-company launch floor is an operator directive
   (2026-07-12), not Eric. Where this file is silent, the repo's own rule is the only rule.
4. **Newer dated teaching wins**, and you say what it replaced rather than blending the two.

---

## What Eric does NOT cover (do not invent a position here)

Verified absent from the full corpus. When one of these comes up, the house rule in the
owning skill is the only rule, and it is not in tension with Eric. **Do not manufacture an
Eric position to fill one of these holes.**

- SPF, DKIM and DMARC specifics
- Blacklist monitoring or delisting procedure
- Warmup schedules and ramp schedules
- Per-mailbox daily send volume
- Domain counts, and mailboxes-per-domain as a recommendation
- Mailbox rotation rules
- Catch-all configuration, and forwarding configuration
- Inbox-placement targets
- Per-campaign send volume, and list-size floors
- Sending-window hour blocks

Three thin partials worth stating precisely, because all three are easy to over-read:

- **Mailboxes per domain** appears exactly once, as "five inboxes on a single domain, versus
  a two-inbox baseline", and it appears **inside the anti-gaming caution below**, as a thing
  that contaminates a comparison. It is not a sizing recommendation.
- **Catch-all** appears only as a verifier false-negative problem, never as inbox config.
- **Forwarding** appears only as "forwarding tests" in the health-check rhythm.

Provider choice is governed by his own tech-agnostic rule: keep the principle, drop the tool
name. Resolve every tool here from the capability roles in `stack-contract.yaml`.

---

## Part 1: Infrastructure resilience and domain lifecycle

Section 1 of his doctrine calls deliverability "a precondition, not a lever" and stops there.
This part is the operating rhythm behind that precondition.

### Hold reserve capacity ahead of need, not in response to a crisis

Paid spare inbox capacity and spare domains, bought **before** you need them, so a health
check that flags a weak domain has somewhere to reallocate sending volume immediately rather
than waiting on new provisioning.

This is a sizing input, not an afterthought. A fleet sized exactly to the daily send target
has no slack, so the first flagged domain costs real send volume while replacements are
provisioned. Where the mailbox provider's fulfillment is asynchronous, that provisioning wait
is the exact gap this reserve exists to cover.

### Run a recurring, multi-signal health check, not a single dashboard number

His described rhythm: **daily spam checks, weekly reply-rate reviews, seed tests, and
forwarding tests**, alongside the ordinary list and offer work. No single one of these is
trustworthy alone.

**The reconciliation that has to travel with this, or it reads as self-contradictory.**
Section 9 of his doctrine says to ignore spam-placement tests, platform reputation scores and
bounce rate *as measures of whether a campaign performed*. That is a different question from
*is the sending layer healthy*. The same instruments answer the second question legitimately
and the first one badly. Using them here as infrastructure diagnostics is not in tension with
refusing to use them as a campaign report card.

### Have a written rule for when a domain or inbox is retired or paused, and follow it on a schedule

His own concrete instance: a weekly review, typically Friday, that cancels domains replying
under roughly 1%.

**Hold this specific rule with real caution, not as settled best practice.** It is a
domain-level action taken in response to a reply-rate shortfall, while sections 1 and 9 of the
same corpus are clear that a reply-rate shortfall more often points at the offer or the list
than at the sending domain. He never actually claims, in describing this cutoff, that the
domain itself was at fault. **Treat the 1%-and-cancel action as something he does, not as a
diagnosis he has made.** Check the offer and the list first. Used as a root-cause fix, this
rule retires healthy domains that were carrying a weak offer.

### Read the shape of a drop, not just its level

Dated September 2026. A campaign that has **always been weak** points at the offer or the
list. A campaign that **suddenly collapses** points at something mechanical: a contaminated
source, a sending-reputation event, or repeated and stale content. Monitor both a **7-day and
a 14-day view**, and size the alert to the size of the decline rather than to one fixed
threshold.

**Hold the second half loosely.** He states the "a sharp decline is almost always mechanical"
claim with more confidence than the evidence supports: mix, seasonality and volume changes can
also move a rate quickly. Confirm the mechanical cause before acting on it. Note also that
checking bounces and sends during a real incident investigation is a different job from
tracking bounce rate as an ongoing north star, which section 9 of his doctrine says not to do.

### The anti-gaming caution on reallocating capacity

Concentrating more inboxes onto a domain that looks like a winner contaminates the very
comparison used to call it a winner: that domain may simply be sitting on an easier list or a
better offer.

Before ranking domains against each other, require real volume, a genuinely comparable
assignment, and a full reply-lag window. Revisit the ranking once you have changed what sends
through them.

### Compliance is the floor under all of this, not a separate topic

Regardless of vendor or domain strategy, commercial email still needs accurate sender
identity, a working opt-out, and authentication practices that meet the sending platform's own
bulk-sender rules. **An agency sending on a client's behalf does not remove the client's own
compliance obligation.**

This is why the spintax compliance rule belongs with deliverability generally: never rotate a
false title across variants, and never let variation weaken or break the opt-out language.

---

## Part 2: Vendor and provider benchmarking (test before you pay)

The most corroborated pattern across his September 2026 material. Independently, across
list-building providers, tech-stack detection, email verifiers and even AI model choice, he
applies the same discipline before committing spend or trust.

### The method, stated once

1. Build a small, **frozen, dated** reference sample from a source you are actually
   authorized to access: your own recent positive replies, a manually checked set of
   companies, a known-good address list.
2. Run every candidate vendor or method against **that exact same sample**.
3. Measure **two** things, not one. Raw coverage or accuracy is close to worthless alone.
   What matters is each additional vendor's **incremental, unique correct contribution** over
   what you already have, and its **false-negative rate**, meaning how often it wrongly
   rejects something you already know is good.

A vendor that looks weak on a general benchmark can still be the right addition if it recovers
exactly the records your current stack misses.

### Applied per capability role

- **Contact and company discovery.** Score each route on owner/contact accuracy, usable
  coverage, false positives, unique finds, cost and time against the same manually verified
  answer key, then take the **deduplicated union** rather than picking one winner.
- **Email verification.** Take addresses you *know* are live, because they recently produced
  real replies, and run them through each candidate verifier. A verifier that flags a
  meaningful share of that known-good sample as catch-all or invalid is silently costing real
  yield. Swap on the lower false-negative rate **on your own data**, not on either vendor's
  stated accuracy.
- **Tech-stack and other detection providers.** The same incremental-unique-contribution logic
  before adding a second or third provider on top of the primary one.
- **AI model and prompt choice for research work.** Test a cheaper prompt or a different model
  against a reviewed answer key you already trust before swapping it in.

### The failure mode this prevents

Do not buy every available provider just because an agency with many customers can justify
them. More vendors stacked without this test means more cost and more places for stale or
wrong data to enter, not more coverage.

---

## Owning skills

- `/email-deliverability-audit` reads Part 1 for the health-check layers and the retirement
  rule, including its caveat.
- `/deliverability-incident-response` reads Part 1 for the reallocation caution.
- `/mailbox-mix-strategy` reads the reserve-capacity rule as a fleet-sizing input.
- `/cold-email-weekly-rhythm` reads the health-check rhythm.
- `/lead-list-tech-stack-research` and `/stack-setup` read Part 2 before any vendor is added,
  swapped, or paid for.
- `/email-waterfall` reads Part 2 for the verifier false-negative test behind revalidating a
  stale cached address rather than trusting it.
- `/ask-eric` holds the full corpus and is the place to go for anything not in this file.
