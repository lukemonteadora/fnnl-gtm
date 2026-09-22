---
name: offer-test-slate
description: "Client-facing offer test plan and results review, the two decks around an offer test. Slate mode runs right after /lead-magnet-brainstorm locks the test set and before any list work: it shows the client the buyer types we will reach, the problems the research found in the buyer's own words, every offer we want to test and why, who honors a prospect's yes during the test, and the test plan. Client approval is optional by default: offers the agency can honor start testing without it, the client can veto any offer, and only an offer whose yes the client alone can honor waits for the client's OK. Scale-review mode runs after the Offer-Validation Wave reads out: it reports what was tested and what won, asks the client what it takes to deliver the winner at full volume, and records the answer that sizes the coverage wave."
---

# Offer Test Slate

## Stack Resolution (read before any tool step)

This skill names **capability roles**, never specific vendors. Resolve every role to the
tool this workspace has actually chosen by reading:

```text
outbound/stack-contract.yaml
```

Roles this skill uses: sending platform (per-offer campaign numbers and reply threads for the scale review).

**If a role this step needs is empty or missing in the contract, STOP and route to
`/stack-setup`.** Never substitute a guessed vendor, and never hardcode a tool name into
an artifact this skill writes. Slate mode needs no tool at all; only scale-review mode reads the sending platform.

## Canonical Profile Root

All profiles/<business-slug> paths in this skill resolve under:

```text
<outbound>/profiles
```

Here `<outbound>` is the root of this skill library. Resolve it to wherever the library is currently checked out (local Documents, OneDrive, or a git worktree); never hardcode an absolute path. Do not create client profiles under a `profiles/` folder at your current working directory. `scripts/...` likewise resolves under `<outbound>/scripts`.

## Why this skill exists (operator directive 2026-09-22)

Aaron Shepherd's offer method is: research the buyer, generate a lot of offers ("Some of these are going to be great, some of them are going to be iffy, but the idea is you have a bunch of things to work from"), test three or four, and "let the market tell you what you should do" (doctrine §3, §5). The flow used to invert that for the client relationship: it dropped offers at ideation because the client might not want them, might not be able to deliver them, or because they needed a free trial or real effort. The operator retired that on 2026-09-22. The new order is:

1. **Ideate without client or capacity limits.** `/lead-magnet-brainstorm` generates and ranks the strongest offers for each buyer type, on buyer pull only.
2. **Show the client the slate** (this skill, slate mode): the buyer types, the problems found, every offer and why. Approval is optional.
3. **Test** the offers on a few thousand contacts each (`/campaign-strategy` Offer-Validation Wave).
4. **Go back with the results** (this skill, scale-review mode): what was tested, what won, and what it takes to run the winner at full volume. The capacity question lives HERE, after the market has picked, not at ideation.

## The one rule that stays: honor every yes

A cold email under the client's name is a promise to a stranger. Removing the ideation limits did not remove that. So:

- **Every prospect who says yes during the test gets what the email promised, on time.** A test produces a handful to a few dozen yeses per offer, so the agency honors test yeses itself by default: research, lists, diagnostics, samples, mockups, videos, drafts, done-for-you units of work built with Claude Code and our own stack. That covers most front-end offers, which is why most offers need no client input to test.
- **An offer whose yes only the client can honor** (access to their product or a trial of it, a price, discount or guarantee term they would have to stand behind, their own people's time, their physical goods, anything licensed or regulated that only they may do) is generated, ranked and shown like any other. It is flagged **"needs your OK"** with the one specific thing we need, and it does not send until the client says yes. Silence is not a yes for these.
- **A client veto on any offer is always honored.** It is their name on the email. Approval being optional means we do not wait for a yes on agency-honored offers; it never means we send something the client told us not to send.

This is Aaron's own standard at test scale: "super low friction, easy for you to fulfill, but super valuable for them" and "Remove homework, not honesty" (doctrine §2 step 2, §3). What moved is WHEN full-volume capacity gets asked (after the test, in the scale review), not whether a prospect's yes gets honored.

## Material Decision Rule

When this skill reaches a material fork, name the realistic options, recommend the strongest path, and explain why the main alternatives are weaker before committing.

Ask before choices that affect spend beyond an approved budget, provider routing, source of truth, list quality, campaign direction, client-facing output, live systems, scraping or account risk, or legal/compliance risk. For low-risk reversible choices, state the recommendation and proceed.

Nothing is filtered out of the slate. Every candidate offer from `/lead-magnet-brainstorm` appears, with its rank and the plain reason it sits where it does. Offers not in the first test flight are shown as the queue and as "other ideas we considered", never deleted.

When asking the user, use the Claude Desktop native Interactive Inputs / Choice Prompts pattern from /clarification-first: recommended option first, short choices, and Custom answer last when a custom answer is plausible.

## Interaction Policy

Defers to `/autonomous-execution-policy`. Under `run_state.execution_mode = auto_execute` (the operator's default), proceed without pausing: author and render the slate, record it, and continue the flow. Claude never sends the deck to the client. The operator sends it, and records the send date and any client response (see State fields). Stop only for the policy's hard-stops.

`run_state.offer_slate_approval` decides whether the flow waits for the client:

- `optional` (default, operator directive 2026-09-22): hand the deck to the operator and continue to `/data-point-discovery` immediately. Agency-honored offers proceed toward launch. "Needs your OK" offers wait for the client's yes on their own and never block the rest.
- `required` (a per-client override, for example a regulated industry or a client who has asked to sign off on everything sent under their name): the flow pauses before list build until `offer.test_slate.client_response` is recorded.

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short: record status, not raw output. Full protocol: `client-activity-log.md`.

---

## Mode: Slate (before the test)

### When to run

- Invoked by `/cold-email-kickoff` Step 3.2, right after `/lead-magnet-brainstorm` locks the test set (the primary offer plus its ranked validation arms) and before `/data-point-discovery`.
- Again whenever a new flight of offers joins the test (a queued offer is promoted to a flight, or new candidates are generated after a flop). Re-render the same deck with the changes marked.

### Inputs (read these; do not re-research)

```text
profiles/<business-slug>/offer-intelligence.md   # research: buyer voice, pain by persona, saturation, paid-ad angles, intersection
profiles/<business-slug>/lead-magnets.md         # every candidate, ranked, with labels and the fulfillment plan
profiles/<business-slug>/client-profile.yaml     # ICP, segments, personas_to_prioritize, the offer block (primary + validation_arms), and `offer.segments` when each buyer type has its own offer set
```

If `lead-magnets.md` has no ranked candidates, `/lead-magnet-brainstorm` has not finished: route back to it. If `offer-intelligence.md` is missing, say the slate rests on self-reported context and mark the "What we found" section low confidence rather than inventing findings.

### Steps

1. **Read the three inputs.** Pull the buyer types (segments and personas), the problems per persona with their evidence class (the client's own calls, N independent public sources, or a hypothesis), the saturation map and the gap competitors leave, and every candidate offer with its score and labels. When the client has per-buyer-type offer sets (`offer.segments`), group everything by buyer type: each buyer type gets its own "offers we want to test" group and its own line in the test plan, in `priority` order.
2. **Label each offer for the client.** From its `lead_magnet_yes_honored_by` field: `agency` shows as "We handle this"; `client` shows as "Needs your OK" plus the one specific thing we need (`lead_magnet_client_dependency`). Also carry `lead_magnet_scale_needs` (what it would take at full volume), shown as information, never as a reason the offer is out.
3. **Show the test plan honestly.** `/campaign-strategy` sizes how many offers run in the first flight from warmed send capacity, and each offer is planned at about 2,000 to 3,000 contacts (operator decision 2026-09-22: size the list to the offers, so 3 to 4 offers need about 8,000 to 12,000 contacts), with about 1,300 as the hard minimum below which no result can be called (the pooled flip criterion). If strategy has not run yet, show the planned first flight as the primary plus arm 1, and the remaining offers as the queue, with the contacts-per-offer figure. Never promise the client more simultaneous offers than send capacity can read.
4. **Author the Markdown** at `profiles/<business-slug>/offer-test-slate.md` from the template below.
5. **Client-facing QA** (all must pass before rendering):
   - Zero hits on the "Banned in client prose" list in `/campaign-approval-brief` (`docs/campaign-approval-brief-template.md`): no internal tool or vendor names, no merge braces or raw fields, no skill slugs, no credit counts, no "TAM".
   - No spaced em dash anywhere (house hard rule).
   - Every quote in "What we found" is verbatim from a real call, review or post on file. Never fabricate or tidy a quote, and never present a public quote as coming from the client's own calls.
   - Every number traces to a saved artifact. Where the artifacts do not hold a reason, write `Not captured in current artifacts.` rather than inventing one.
   - Plain words for a sharp outsider: gloss a specialist term the first time it appears; describe offers by what the prospect gets.
6. **Render.** Default is a presentation built on the locked design library (see Rendering). When the operator wants a document or a simple list instead, render the same Markdown to DOCX. Always keep the Markdown as the source of record.
7. **Record** `offer.test_slate` in `client-profile.yaml` (see State fields) and log it.
8. **Hand it to the operator** with one line on what it is, the path, and the "Needs your OK" asks. Then continue the flow per `run_state.offer_slate_approval`.

### Slate template (client-facing Markdown)

```markdown
# Offer Test Plan: <Client>

**Prepared by:** FNNL Agency
**Date:** <YYYY-MM-DD>

## What this is

We researched your buyers and your market, and turned what we found into a set of offers to test with cold email. This page shows who we plan to reach, the problems we found, the offers we want to test, and why.

**You don't need to approve anything for us to start.** If there is an offer you don't want sent under your name, tell us and we'll pull it. A few offers need something only you can provide. Those are marked "Needs your OK" and won't go out until you say yes.

By "offer" we mean the free, useful thing the first email puts in front of a prospect. It isn't your full service. It's a small, real piece of it they can see before they decide to talk.

## Who we'll reach

| Buyer type | Companies | Who we email | Why them |
|---|---|---|---|
| <segment in plain words> | <industry, size, location> | <role> | <one line from the research> |

## What we found

We read <N> of your sales calls, <N> competitors' offers and ads, and <N> buyer reviews and posts. Here is what came up most.

### <Buyer type or role>

- **The problem, in their words:** "<verbatim quote>" (<your sales call, won or lost / a public review / a public post>)
- **How often it came up:** <N independent sources, or "from your lost deals">
- **What competitors already offer:** <what the field leads with>, and the part of the problem it leaves unsolved: <the gap>
- **How you solve it:** <one plain sentence tied to the client's real service>

## The offers we want to test

### Offer 1: <name> (for <buyer type>)

- **What they get:** <the deliverable in plain words, with its real quantity or turnaround>
- **Why we think it will work:** <tied to a named problem above>
- **What they have to do:** <the one small action>
- **Who handles a yes during the test:** <We handle this / Needs your OK: the one specific thing we need>
- **If it wins, what running it at full volume would take:** <plain line; we'll ask you about this after the test>

<repeat per offer in the test set, in rank order>

## How the test works

- **First flight:** <offers in the first flight> run side by side on the same kind of list, with the same style of email, so the offer is the only thing that changes.
- **Size:** each offer goes to about <N> people over about <N> weeks. Smaller than that and a result can't be told apart from luck.
- **What we measure:** for every 1,000 people emailed, how many replied yes, and how many of those agreed a time to talk. The second number picks the winner, because a reply isn't a meeting.
- **What happens next:** offers that don't get real responses are switched off. The queued offers below take their place in the next flight.
- **Queued for the next flight:** <offers in rank order, or "none">

## Other ideas we considered

| Idea | Why it's lower on the list for now |
|---|---|
| <offer> | <plain one-line reason> |

## What we need from you

1. **Nothing, to start.** We begin preparing the lists now and plan to start sending around <date>.
2. **Optional:** tell us about any offer you don't want sent under your name.
3. **Only for offers marked "Needs your OK":** <offer name>: <the one specific thing, for example "can we offer a free 14-day trial of your product to up to 20 people during the test?">
4. **After the test** we'll come back with the results and ask what it would take to run the winner at full volume.
```

---

## Mode: Scale review (after the test)

### When to run

- `/campaign-strategy` has read out the Offer-Validation Wave: a winner is picked among the arms that proved out, or every arm has been switched off. Run it BEFORE the coverage wave fans out on the winner, because the coverage wave's volume is sized from the answer this review records. For a client with per-buyer-type offer sets, run it per segment as each segment's wave reads out, and record it in that segment's `offer.segments[].scale_review`.
- Also on demand, when the operator wants to show the client where a running test stands.

### Inputs

- Per-offer campaign numbers from the locked `run_state.sending_platform`, read through the campaign skill its `/stack-setup` pack provides: first-touch contacts, sends, and dates per campaign and per arm.
- Reply classification from the positive reply scoring skill for the locked sending platform, if `/stack-setup` activated a pack that provides one; otherwise hand-read and tag the reply threads: positive replies, and time-agreed replies (positive replies whose thread moves toward a time, `/campaign-strategy`'s reply-thread proxy).
- `client-profile.yaml`: the offer block (primary, `validation_arms` with `status` and `flight`, `lead_magnet_yes_honored_by`, `lead_magnet_scale_needs`), `run_state.offer_market_proven`.
- `lead-magnets.md` and the previous `offer-test-slate.md`, for the queued offers and the client's earlier answers.

### Steps

1. **Pull the numbers per offer**, pooled the way `/campaign-strategy` pools them (each arm's own cell; the primary's pool includes the campaigns that carried it). Compute positive replies and time-agreed replies per 1,000 first touches. Never read a raw reply count as a result.
2. **Give each offer a plain verdict** that matches `/campaign-strategy`'s read: Winner; Works (proved out, not the winner); Still reading (not enough emails yet to call it); Gets interest, not meetings (farming interest); Switched off (no real responses).
3. **Size the scale plan.** At the planned coverage-wave volume, estimate yeses per week and agreed times per week from the winner's own test rates. Say they are estimates from one test.
4. **Write the scale ask**, specific to who honors a yes:
   - **Agency-honored winner:** confirm our own fulfillment capacity for the estimated yeses per week, and ask the client one thing: can their team take about <N> conversations a week?
   - **Client-honored winner:** ask for the exact capacity and terms: how many per week they can honor, and sign-off on any term (a trial length, a price, a guarantee). If they can do fewer than the plan needs, ask how many.
5. **Name the fallbacks** so a "no" is not a dead end: the agency takes over fulfillment where it can, a lighter version of the winner, or the runner-up (a runner-up that already proved out needs no re-test; one still reading keeps testing).
6. **List the next flight:** queued offers from the slate, and any new candidates, in rank order.
7. **Author** `profiles/<business-slug>/offer-scale-review-YYYY-MM-DD.md` from the template below, run the same client-facing QA as slate mode, render, record `offer.scale_review`, and log it.
8. **Hand it to the operator.** When the client answers, record `client_answer` and `confirmed_capacity_per_week`, then route:
   - `yes` or `partial`: `/campaign-strategy` sizes the coverage wave so expected yeses per week stay within the confirmed capacity.
   - `no`: pick a fallback from step 5 with the operator. A client-honored winner never scales past what the client confirmed.
   - `pending`: an agency-honored winner may scale within the agency's own confirmed capacity; a client-honored winner holds at the pace the client already handled during the test.

### Scale review template (client-facing Markdown)

```markdown
# Offer Test Results: <Client>

**Prepared by:** FNNL Agency
**Date:** <YYYY-MM-DD>

## What this is

We tested <N> offers with <N> people between <date> and <date>. This shows what we tested, what won, and what we'd like to scale. We need one answer from you at the end.

## What we tested

| Offer | Buyer type | People emailed | Dates |
|---|---|---|---|
| <offer> | <buyer type> | <N> | <dates> |

## What happened

| Offer | Replied yes (per 1,000 emailed) | Agreed a time to talk (per 1,000 emailed) | Verdict |
|---|---|---|---|
| <offer> | <n> (<rate>) | <n> (<rate>) | <Winner / Works / Still reading / Gets interest, not meetings / Switched off> |

"Agreed a time to talk" is the number that picks the winner, because a reply isn't a meeting.

## The winner, and why

<Two or three sentences with the numbers. Optionally one or two real replies, with names and companies removed.>

## What we'd like to scale

- **Planned volume:** about <N> people a week.
- **What that should produce, at the test's rates:** about <N> yeses and <N> agreed times a week. These are estimates from one test, and we'll keep measuring.

## What we need from you

<For an offer we handle: "We'll keep handling the free <thing> for everyone who says yes. Can your team take about <N> conversations a week?">
<For an offer only you can provide: "To keep every yes honored at that pace we need <N> <units> a week of <the thing>, and your sign-off on <term>. Can you do that? If not, how many a week can you do?">

**If that doesn't work for you:** <the fallback options in plain words: we take on more of the delivery, a lighter version, or the runner-up offer>.

## What's next

- **Next offers to test:** <queued offers, or "none planned yet">
- **Timeline:** <when scaling starts once we hear back>
```

---

## Rendering

The Markdown file is always the source of record. Render it one of two ways.

**Presentation (default).** Compose a deck with the locked design library in `scripts/approval-brief-pptx/lib.mjs`, the same one `/campaign-approval-brief` uses, so every client deck looks alike. Write a content-only module `scripts/approval-brief-pptx/<client>-offer-slate.mjs` (or `<client>-scale-review.mjs`) exporting `meta` and `buildSlides(b)`, reading each method's parameters in `lib.mjs` (this workspace ships no client reference module yet). Never restyle inside the library. Suggested slide order:

| Slate | Scale review |
|---|---|
| `cover`: stats for buyer types, problems found, offers to test, people per offer | `cover`: stats for offers tested, people emailed, yeses, agreed times |
| `threeCards` or `campaignGrid`: who we'll reach | `campaignGrid`: what we tested |
| `twoColumn` or `changeList`: what we found, one problem per item in the buyer's words | `changeList`: what happened, one offer per item with its verdict |
| `campaignGrid` (2 to 6 cards): the offers we want to test | `threeCards`: the winner and why |
| `stepFlow`: how the test works | `stepFlow`: what we'd like to scale |
| `changeList`: other ideas we considered | `decisions`: what we need from you |
| `decisions`: what we need from you | |

Build with `node "<outbound>/scripts/approval-brief-pptx/build.mjs" <client>-offer-slate "%TEMP%/<client>-offer-slate.pptx"`, QA by rendering every slide to an image with `scripts/approval-brief-pptx/export_png.ps1` and looking at each one, then copy the file to `profiles/<business-slug>/Offer Test Plan - <Client>.pptx` (or `Offer Test Results - <Client>.pptx`). More than six offers do not fit one `campaignGrid`: split them across two slides, first flight then queue.

**Document or list (on request).** Render the same Markdown to a styled DOCX with the house renderer:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\brief_md_to_docx.ps1 `
  -MarkdownPath "profiles\<business-slug>\offer-test-slate.md" `
  -OutputDocx  "profiles\<business-slug>\Offer Test Plan - <Client>.docx"
```

When the Google Docs export is configured (`gdoc-export-setup.md`), `node scripts\docx_to_gdoc.mjs --in "<docx>" --title "<title>"` also creates a native Google Doc; it exits `2` and is safely skipped when credentials are not set.

## State fields

Written to `profiles/<business-slug>/client-profile.yaml`. The per-offer fields are written by `/lead-magnet-brainstorm` at lock; this skill reads them and writes the `test_slate` and `scale_review` blocks.

```yaml
run_state:
  offer_slate_approval: optional        # optional (default) | required (flow waits for the client's answer before list build)

offer:
  # Per offer, on the primary block and on every validation_arms entry (written at lock by /lead-magnet-brainstorm):
  lead_magnet_yes_honored_by: agency    # agency | client: who honors a prospect's yes during the test
  lead_magnet_client_dependency: none   # or the one specific thing only the client can provide
  lead_magnet_client_ok: not_needed     # not_needed (agency-honored) | pending | yes | no. Sends only at not_needed or yes
  lead_magnet_scale_needs: <what running it at full volume would take; asked in the scale review, never a reason to drop the offer>

  test_slate:
    path: profiles/<business-slug>/offer-test-slate.md
    rendered: <path to the .pptx or .docx>
    drafted_on: YYYY-MM-DD
    sent_on: <YYYY-MM-DD, recorded when the operator confirms he sent it>
    client_response: none               # none | approved | changes_requested | vetoed_some
    vetoed_offers: []                   # offers the client asked us not to send; their validation_arms status becomes vetoed

  scale_review:
    path: profiles/<business-slug>/offer-scale-review-YYYY-MM-DD.md
    date: YYYY-MM-DD
    winner: <offer name>
    client_answer: pending              # pending | yes | partial | no
    confirmed_capacity_per_week: <yeses per week the party honoring them has confirmed, or unknown>
    notes: <one line>
```

When the client OKs a "Needs your OK" offer, write exactly what they confirmed into `lead_magnet_client_dependency` (the term and its limits, for example "free 14-day trial, up to 20 accounts during the test") and set `lead_magnet_client_ok: yes`; `/campaign-strategy` can then schedule it into a flight. Copy may claim only what was confirmed (Capability Truth, `/campaign-copywriting` Hard Rule 28). When the client vetoes an offer, set its `validation_arms` status to `vetoed` (or, for the primary, promote the next sendable arm and record the swap in the activity log).

## Common mistakes

- **Dropping an offer because the client might not want it, or because it takes effort.** That is the limit this skill replaced. Show it, rank it, test it, and ask about scale after the market picks.
- **Sending a "Needs your OK" offer on silence.** Approval is optional for offers we honor ourselves. It is never optional for a yes only the client can honor.
- **Ignoring a veto because approval is optional.** Optional approval means we don't wait. It never means we send what the client said not to.
- **Promising more simultaneous offers than send capacity can read.** Plan about 2,000 to 3,000 contacts per offer (about 1,300 is the floor). Put the rest in the queue and say so.
- **Leading the results with raw reply counts.** Show replies and agreed times per 1,000 emailed, and let agreed times pick the winner.
- **Asking the scale question before the test.** Capacity is asked once the winner is known, with its real numbers.
- **Inventing findings or quotes to fill the page.** Write `Not captured in current artifacts.` instead.

## Integration

| Skill | Relationship |
|---|---|
| `/lead-magnet-brainstorm` | Produces every candidate, the ranked test set (primary plus validation arms) and the per-offer honoring fields this skill presents. |
| `/offer-intelligence` | Produces the research the "What we found" section summarizes. |
| `/cold-email-kickoff` | Runs slate mode at Step 3.2, between the offer lock and `/data-point-discovery`. |
| `/campaign-strategy` | Sizes the first flight from send capacity, enforces the per-offer launch condition (`lead_magnet_client_ok`), reads out the wave, and triggers scale-review mode before the coverage wave. Sizes the coverage wave from `offer.scale_review.confirmed_capacity_per_week`. |
| `/campaign-copywriting` | Writes copy only for offers whose yes can be honored today (its Confirmed Deliverable Gate reads the same fields). |
| `/campaign-approval-brief` | The later, campaign-level deck (lists, sources, copy). This skill is the earlier, offer-level one. They share the design library and the client-prose rules. |
| The sending platform's campaign and reply-scoring skills (activated by `/stack-setup`) | Supply the per-offer numbers for the scale review. |

## What to do next

- **Slate done:** continue to `/data-point-discovery` (via `/cold-email-kickoff`), unless `run_state.offer_slate_approval = required`, in which case wait for the client's answer first.
- **Scale review done:** hand back to `/campaign-strategy` for the coverage wave, sized to the confirmed capacity, and schedule the next flight of queued offers.
