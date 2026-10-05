---
name: offer-test-slate
description: "Client-facing Markdown reports around an offer test. Slate mode runs after /lead-magnet-brainstorm locks the test set: buyer types, problems found, every offer and why. Scale-review mode reports the results beside the winner's scale-up and reviews its qualification rule."
---

**From the former description:** The slate also shows who honors a qualified yes and how, and the whole first wave (every offer launched together, each placed only in the segments it fits, one offer per about 2,000 qualified contacts, at least three unless Aaron's offer call sets another count). Client approval is optional by default: offers the agency can honor start without it, the client can veto any offer, and only an offer whose yes the client alone can honor waits for the client's OK. Slate mode runs before any list work. Scale review runs alongside the winner's scale-up, never ahead of it: the client's capacity answer sets how many qualified yeses get the free unit each week, and it gates sending volume only where the client itself supplies the deliverable. A deck or DOCX is built only when the operator asks for one.

# Offer Test Slate

**Built from Aaron's offer call (the Aaron lane, operator directive 2026-09-24; `aaron-lane.md`).** The offers, their order, the reasons and the ideas considered but not tested come from `aaron-offer-call.md` as `/lead-magnet-brainstorm` recorded them. The slate explains his call in plain words. It never re-ranks, re-words or drops an offer, and "Other ideas we considered" lists his untested ideas with his reasons.

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

1. **Ideate without client or capacity limits.** The strongest offers for each buyer type are generated and ranked on buyer pull only (under the Aaron lane, by Aaron's offer call, which `/lead-magnet-brainstorm` records).
2. **Show the client the slate** (this skill, slate mode): the buyer types, the problems found, every offer and why. Approval is optional.
3. **Test every first-wave offer together inside the full-volume send** (`/campaign-strategy` Offer-Validation Wave): `max(3, floor(qualified_contacts / 2000))` offers, capped at the qualifying candidates, across the whole qualified list, each offer running in every first-wave segment it fits (its own fit filters decide), not across every segment, with shared ground split evenly (operator decision 2026-09-23). The list is never sized to the offers; the offer count follows the list (Aaron, Apr 6: one offer per about 2,000 leads; May 4: always test three or four).
4. **Report the results** (this skill, scale-review mode): what was tested and what won, while the winner already goes to the rest of the list it fits (rows it does not fit go to the strongest offer that fits them; operator decision 2026-09-23). Deliverability at the scale of the emails being sent is checked at offer lock, not here: each offer shows a scale note that fits, or an `offer.qualification` rule that decides who gets the free unit (`/lead-magnet-brainstorm` references/saturation-and-scale.md, Deliverable at Send Scale). The scale review reviews that rule with the client. (Aaron process alignment, operator directive 2026-09-22; supersedes "test the offers on a few thousand contacts each" and "the capacity question lives HERE, after the market has picked".)

## The one rule that stays: honor every qualified yes

A cold email under the client's name is a promise to a stranger. Removing the ideation limits did not remove that. So:

- **Every qualified yes gets what the email promised, on time.** A cheap asset stays ungated: every yes gets it. A costly front end (a trial, a free service or pilot, custom per-prospect work) carries a short, disclosed qualification step after the yes that decides who gets the free unit and who gets the client's standard offer (Aaron, Sep 21: "just because someone raises their hand doesn't mean you have to provide that free thing to them. You can now go through and cherry-pick"). Material eligibility is stated in the offer itself ("for teams that fit X"), never hidden until after the yes. The agency honors qualified yeses itself by default: research, lists, diagnostics, samples, mockups, videos, drafts, done-for-you units of work built with Claude Code and our own stack. That covers most front-end offers, which is why most offers need no client input to send. (Aaron process alignment, operator directive 2026-09-22; supersedes "every prospect who says yes during the test gets what the email promised" and "a test produces a handful to a few dozen yeses per offer".)
- **An offer whose yes only the client can honor** (access to their product or a trial of it, a price, discount or guarantee term they would have to stand behind, their own people's time, their physical goods, anything licensed or regulated that only they may do) is generated, ranked and shown like any other. It is flagged **"needs your OK"** with the one specific thing we need, and it does not send until the client says yes. Silence is not a yes for these.
- **A client veto on any offer is always honored.** It is their name on the email. Approval being optional means we do not wait for a yes on agency-honored offers; it never means we send something the client told us not to send.

This is Aaron's own standard: "super low friction, easy for you to fulfill, but super valuable for them" and "Remove homework, not honesty" (doctrine §2 step 2, §3), applied "at the scale of the emails that you're sending" (Aaron, Sep 21). Ideation stays unfiltered; at lock, each offer shows it is deliverable at send scale with a scale note or an `offer.qualification` rule. That check is not asked of the client before the test, and the scale review is not a volume gate (Aaron process alignment, operator directive 2026-09-22).

## Material Decision Rule

When this skill reaches a material fork, name the realistic options, recommend the strongest path, and explain why the main alternatives are weaker before committing.

Ask before choices that affect spend beyond an approved budget, provider routing, source of truth, list quality, campaign direction, client-facing output, live systems, scraping or account risk, or legal/compliance risk. For low-risk reversible choices, state the recommendation and proceed.

Nothing is filtered out of the slate. Every candidate offer from `/lead-magnet-brainstorm` appears, with its rank and the plain reason it sits where it does. Offers beyond the first-wave count are shown as the queue, and candidates outside the test set as "other ideas we considered", never deleted.

When asking the user, use the Claude Desktop native Interactive Inputs / Choice Prompts pattern from /clarification-first: recommended option first, short choices, and Custom answer last when a custom answer is plausible.

## Interaction Policy

Defers to `/autonomous-execution-policy`. Under `run_state.execution_mode = auto_execute` (the new-client default since 2026-09-24, paired with `review_protocol: phase_checkpoints` so a run stops only at checkpoint A (Phase 2) and checkpoint B (Phase 4), while Phases 1 and 3 auto-approve (Aaron flow, see `aaron-flow.md`), `phase-protocol.md`; `review_gates` is opt-in), proceed without pausing: author the slate, record it, and continue the flow. Claude never sends the slate to the client. The operator sends it, and records the send date and any client response (see State fields). Stop only for the policy's hard-stops.

`run_state.offer_slate_approval` decides whether the flow waits for the client:

- `optional` (default, operator directive 2026-09-22): hand the slate (`offer-test-slate.md`) to the operator and continue to `/data-point-discovery` immediately. Agency-honored offers proceed toward launch. "Needs your OK" offers wait for the client's yes on their own and never block the rest.
- `required` (a per-client override, for example a regulated industry or a client who has asked to sign off on everything sent under their name): the flow pauses before list build until `offer.test_slate.client_response` is recorded.

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short: record status, not raw output. Full protocol: `client-activity-log.md`.

Right after CURRENT STATE, read `profiles/<business-slug>/client-intel.md` (the client intel feed): Needs attention and Open items in full, plus Recent activity tagged `offer`, `icp` or `engagement`. Check it for any offer the client vetoed or asked for in a meeting or in Slack, and name each conflict with the slate (a vetoed offer still on it, a requested offer missing from it) in the hand-off to the operator (slate step 8, scale review step 8). A feed item is a hypothesis: never write it into `offer.test_slate.vetoed_offers` or set `lead_magnet_client_ok: yes` from it on your own (only `offer_approval.py` writes that field, see State fields); the operator records it (under `auto_execute`, a conflict touching the offer set stops this step and asks). A missing feed, or one that is stale by the rule in `client-intel-feed.md`, is a one-line flag at the top of the hand-off, never a blocker; offer `/client-intel-sync <client>` for a fresh pull. Protocol: `client-intel-feed.md`.

Read `profiles/<business-slug>/context-sweep.md` the same way: every item in its Constraints & Instructions register that touches the offers is checked against the slate. Name at the top of the hand-off any source nobody has read yet: a missing `context_sweep:` block, a core source (Slack channels, Slack DMs, email, Drive) still `blocked` and not `waived_by_operator`, or a Slack check recorded `unavailable` in `client_comms.slack`. The client may already have answered something the slate contradicts in a place nobody has read (`client-context-sweep.md`). The flag never holds the slate.

---

## Mode: Slate (before the test)

### When to run

- Invoked in Phase 2 (`/phase-2-research-offer` step 6), right after `/lead-magnet-brainstorm` records the test set from Aaron's offer call (the primary offer plus its ranked validation arms), and before any list work (`/data-point-discovery` opens Phase 3). Under `review_gates`, `/cold-email-kickoff` runs it at the same point.
- Again whenever a new flight of offers joins the test (a queued offer is promoted to a flight, or new candidates are generated after a flop). Update the same Markdown with the changes marked.

### Inputs (read these; do not re-research)

```text
profiles/<business-slug>/offer-intelligence.md   # research: buyer voice, pain by persona, saturation, paid-ad angles, intersection
profiles/<business-slug>/lead-magnets.md         # every candidate, ranked, with labels and the fulfillment plan
profiles/<business-slug>/client-profile.yaml     # ICP, segments, personas_to_prioritize, the offer block (primary + validation_arms), and `offer.segments` when each buyer type has its own offer set
```

If `lead-magnets.md` has no ranked candidates, `/lead-magnet-brainstorm` has not finished: route back to it. If `offer-intelligence.md` is missing, say the slate rests on self-reported context and mark the "What we found" section low confidence rather than inventing findings.

### Steps

1. **Read the three inputs.** Pull the buyer types (segments and personas), the problems per persona with their evidence class (the client's own calls, N independent public sources, or a hypothesis), the saturation map and the gap competitors leave, and every candidate offer with its score and labels. When the client has per-buyer-type offer sets (`offer.segments`), group everything by buyer type: each buyer type gets its own "offers we want to test" group and its own line in the test plan, in `priority` order.
2. **Label each offer for the client.** From its `lead_magnet_yes_honored_by` field: `agency` shows as "We handle this"; `client` shows as "Needs your OK" plus the one specific thing we need (`lead_magnet_client_dependency`). Also carry `lead_magnet_scale_needs` (what delivering it at full sending volume takes) and, where one applies, `offer.qualification` in plain words (who gets the free unit, the short form, and the eligibility the offer states up front). An offer with neither a fitting scale note nor a qualification rule shows as ranked lower with the reason, never as out.
3. **Show the whole first wave honestly.** The first wave launches `max(3, floor(qualified_contacts / 2000))` offers together, capped at the number of qualifying candidates, each offer running in every first-wave segment it fits (its own fit filters decide), not across every segment, with shared ground split evenly (operator decision 2026-09-23, which replaces "as equal cells across every first-wave campaign and segment"): no offer gets a head start, and about 1,300 first-touch contacts per offer, pooled across the segments it runs in, is the hard minimum below which no result can be called (the pooled flip criterion). Where offers fit different segments, show which buyers each offer goes to. The whole qualified list goes out; it is never shrunk to fit the offers. For per-buyer-type offer sets (`offer.segments`), the formula runs per buyer-type segment on that segment's qualified contacts, and each buyer type shows its own first wave. If `/campaign-strategy` has not run yet (no qualified-contact count), show the top three sendable offers as the first wave (the formula's floor), say the count rises by one offer per about 2,000 qualified contacts, and list the next offers in rank order as the ones that join the first wave if the list supports them, then the queue. Say "fewer than three" only when fewer candidates qualify. If the client's warmed sending fleet delivers less than the plan needs (`run_state.capacity_request`), say the runway stretches (days to cover the list); offers are never cut for it. (Aaron process alignment, operator directive 2026-09-22; supersedes "size the list to the offers, so 3 to 4 offers need about 8,000 to 12,000 contacts", "the primary plus arm 1, and the remaining offers as the queue" and "never promise more simultaneous offers than send capacity can read", operator decision 2026-09-22.)
4. **Author the Markdown** at `profiles/<business-slug>/offer-test-slate.md` from the template below.
5. **Client-facing QA** (all must pass before the slate is recorded):
   - Zero hits on the "Banned in client prose" list in `/campaign-approval-brief` (`docs/campaign-approval-brief-template.md`): no internal tool or vendor names, no merge braces or raw fields, no skill slugs, no credit counts, no "TAM".
   - No spaced em dash anywhere (house hard rule).
   - Every quote in "What we found" is verbatim from a real call, review or post on file. Never fabricate or tidy a quote, and never present a public quote as coming from the client's own calls.
   - Every number traces to a saved artifact. Where the artifacts do not hold a reason, write `Not captured in current artifacts.` rather than inventing one.
   - Plain words for a sharp outsider: gloss a specialist term the first time it appears; describe offers by what the prospect gets.
6. **Stop at the Markdown (plain-text outputs, operator decision 2026-09-28, every mode).** `offer-test-slate.md` in the client's profile folder is the deliverable. A deck or DOCX is built only when the operator asks for that format in chat (see Rendering); mention that in one line at checkpoint A, and never build one first. Rendering and slide QA never sit on the path to the list.
7. **Record** `offer.test_slate` in `client-profile.yaml` (see State fields) and log it.
8. **Hand it to the operator** with one line on what it is, the path, and the "Needs your OK" asks. Then continue the flow per `run_state.offer_slate_approval`; under `review_protocol: phase_checkpoints`, the flow first stops at checkpoint A (end of Phase 2, `/phase-2-research-offer`; Aaron flow, see aaron-flow.md section 2) and continues only after the operator answers it.

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
- **Who handles a yes:** <We handle this / Needs your OK: the one specific thing we need>
- **Who gets it free:** <everyone who says yes / people who fit <plain criteria>, after a short form; everyone else gets <your standard offer>>
- **What delivering it at full sending volume takes:** <plain line>

<repeat per offer in the test set, in rank order>

## How the test works

- **First wave:** <every first-wave offer> start the same day, side by side, with the same style of email, so the offer is the only thing that changes. Each offer goes only to the buyers it suits, and where two offers suit the same people, those people are split evenly between them. Together they cover your whole list.
- **Size:** each offer goes to about <N> people (never fewer than about 1,300, or a result can't be told apart from luck), and the whole list is covered in about <N> days.
- **What we measure:** for every 1,000 people emailed, how many replied yes, and how many of those agreed a time to talk. The second number picks the winner, because a reply isn't a meeting.
- **What happens next:** offers that don't get real responses are switched off inside the live campaign. Once a winner is picked, it goes straight away to the rest of the people on your list it suits, and offers still undecided stop getting new contacts. The queued offers below take a freed place.
- **Queued for the next flight:** <offers in rank order, or "none">

## Other ideas we considered

| Idea | Why it's lower on the list for now |
|---|---|
| <offer> | <plain one-line reason> |

## What we need from you

1. **Nothing, to start.** We begin preparing the lists now and plan to start sending around <date>.
2. **Optional:** tell us about any offer you don't want sent under your name.
3. **Only for offers marked "Needs your OK":** <offer name>: <the one specific thing, for example "can we offer a free 14-day trial of your product to up to 20 qualified people a week?">
4. **Once we have a winner** we'll send you the results. The winner keeps going to the rest of your list while we check with you how many free <units> a week to give to people who qualify.
```

---

## Mode: Scale review (after the test)

### When to run

- `/campaign-strategy` has read out the Offer-Validation Wave: a winner is picked among the arms that proved out, or every arm has been switched off. **Run it alongside the winner's scale-up, never ahead of it:** the winner goes to the rest of the TAM as soon as it is picked, and this review is a results report to the client plus a review of the winner's `offer.qualification` rule. It is not a volume gate, with one carve-out: where the client literally supplies the deliverable (their trial seats, their people, their stock), a qualification step cannot create capacity the client does not have, so the client's confirmed capacity still caps sends for that offer. (Aaron process alignment, operator directive 2026-09-22; supersedes "run it BEFORE the coverage wave fans out on the winner, because the coverage wave's volume is sized from the answer this review records", operator directive 2026-09-22.) For a client with per-buyer-type offer sets, run it per segment as each segment's wave reads out, alongside that segment's own winner scale-up (a segment never borrows another segment's winner), and record it in that segment's `offer.segments[].scale_review`.
- Also on demand, when the operator wants to show the client where a running test stands.

### Inputs

- Per-offer campaign numbers from the locked `run_state.sending_platform`, read through the campaign skill its `/stack-setup` pack provides: first-touch contacts, sends, and dates per campaign and per arm.
- Reply classification from the positive reply scoring skill for the locked sending platform, if `/stack-setup` activated a pack that provides one; otherwise hand-read and tag the reply threads: positive replies, and time-agreed replies (positive replies whose thread moves toward a time, `/campaign-strategy`'s reply-thread proxy).
- `client-profile.yaml`: the offer block (primary, `validation_arms` with `status` and `flight`, `lead_magnet_yes_honored_by`, `lead_magnet_scale_needs`, `qualification`), `run_state.offer_market_proven`, `run_state.capacity_request`.
- `lead-magnets.md` and the previous `offer-test-slate.md`, for the queued offers and the client's earlier answers.

### Steps

1. **Pull the numbers per offer**, pooled the way `/campaign-strategy` pools them (each arm's own cell; the primary's pool includes the campaigns that carried it). Compute positive replies and time-agreed replies per 1,000 first touches. Never read a raw reply count as a result.
2. **Give each offer a plain verdict** that matches `/campaign-strategy`'s read: Winner; Works (proved out, not the winner); Still reading (not enough emails yet to call it); Gets interest, not meetings (farming interest); Switched off (no real responses).
3. **Project the winner at its scale-up pace.** At the pace the rest of the list is being sent (`run_state.capacity_request`), estimate qualified yeses per week and agreed times per week from the winner's own rates. Say they are estimates from one test.
4. **Review the qualification rule**, specific to who honors a yes:
   - **Agency-honored winner:** confirm our own fulfillment capacity for the estimated qualified yeses per week and set `offer.qualification.free_unit_cap_per_week` to it (a cheap asset has no rule and needs no cap). Ask the client one thing: can their team take about <N> conversations a week?
   - **Client-honored winner:** ask how many free units a week they can honor and for sign-off on any term (a trial length, a price, a guarantee). That answer sets `free_unit_cap_per_week`; qualified yeses beyond it get the standard offer. **Carve-out:** because the client supplies the deliverable, the answer also caps sends for this offer.
   - Check the criteria and form fields against the real replies: do the people who qualify look like buyers of the paid service? Tighten or loosen the criteria with the client.
5. **Name the fallbacks** for a cap of zero or a carve-out "no", so it is not a dead end: the agency takes over fulfillment where it can, a lighter version of the winner, or the runner-up (a runner-up that already proved out needs no re-test; one still reading keeps testing).
6. **List the next flight:** queued offers from the slate, and any new candidates, in rank order.
7. **Author** `profiles/<business-slug>/offer-scale-review-YYYY-MM-DD.md` from the template below, run the same client-facing QA as slate mode, record `offer.scale_review`, and log it. The Markdown is the deliverable. A deck is built only if the operator asks for one.
8. **Hand it to the operator.** When the client answers, record `client_answer` and `confirmed_capacity_per_week`, and write the confirmed number into the winner's `offer.qualification.free_unit_cap_per_week` (the winner is promoted first, so its fields already sit in the primary block, `/lead-magnet-brainstorm` Save Output; for per-buyer-type sets, that segment's primary block in `offer.segments`). Sending volume does not wait on this answer: the winner is already scaling, and qualified yeses above the cap get the standard offer. Then route:
   - `yes` or `partial`: the cap is set; nothing else changes. Carve-out only: `/campaign-strategy` keeps that offer's sends at the pace the confirmed capacity covers.
   - `no`: pick a fallback from step 5 with the operator. A client-supplied deliverable never scales past what the client confirmed.
   - `pending`: an agency-honored winner scales with its cap at the agency's own capacity; a client-supplied winner (carve-out) holds at the pace the client already handled until the client answers.
   (Aaron process alignment, operator directive 2026-09-22; supersedes "`/campaign-strategy` sizes the coverage wave so expected yeses per week stay within the confirmed capacity", operator directive 2026-09-22.)

### Scale review template (client-facing Markdown)

```markdown
# Offer Test Results: <Client>

**Prepared by:** FNNL Agency
**Date:** <YYYY-MM-DD>

## What this is

We tested <N> offers with <N> people between <date> and <date>. This shows what we tested, what won, and how the winner is now going out to the rest of your list. We need one answer from you at the end.

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

## Where the winner goes now

- **Sending pace:** the winner is going to the rest of your list at about <N> people a week.
- **What that should produce, at the test's rates:** about <N> yeses and <N> agreed times a week. These are estimates from one test, and we'll keep measuring.
- **Who gets the free <thing>:** <everyone who says yes / people who fit <criteria>, up to <N> a week; everyone else gets your standard offer>.

## What we need from you

<For an offer we handle: "We'll keep handling the free <thing> for everyone who qualifies. Can your team take about <N> conversations a week?">
<For an offer only you can provide: "At this pace we expect about <N> qualified yeses a week. How many free <units> a week can you honor, and can you sign off on <term>? Everyone who qualifies beyond that gets your standard offer, and we'll keep sending at the pace your number covers.">

**If that doesn't work for you:** <the fallback options in plain words: we take on more of the delivery, a lighter version, or the runner-up offer>.

## What's next

- **Next offers to test:** <queued offers, or "none planned yet">
- **Timeline:** <when the winner will have reached the rest of your list at this pace>
```

---

## Rendering

The Markdown file is the deliverable and the source of record. Nothing below runs by default (plain-text outputs, operator decision 2026-09-28). It runs only when the operator asks in chat for a deck or a document for this specific file, and that ask covers that file only.

**Presentation (on request).** Compose a deck with the locked design library in `scripts/approval-brief-pptx/lib.mjs`, the same one `/campaign-approval-brief` uses, so every client deck looks alike. Write a content-only module `scripts/approval-brief-pptx/<client>-offer-slate.mjs` (or `<client>-scale-review.mjs`) exporting `meta` and `buildSlides(b)`, reading each method's parameters in `lib.mjs` (this workspace ships no client reference module yet). Never restyle inside the library. Suggested slide order:

| Slate | Scale review |
|---|---|
| `cover`: stats for buyer types, problems found, offers to test, people per offer | `cover`: stats for offers tested, people emailed, yeses, agreed times |
| `threeCards` or `campaignGrid`: who we'll reach | `campaignGrid`: what we tested |
| `twoColumn` or `changeList`: what we found, one problem per item in the buyer's words | `changeList`: what happened, one offer per item with its verdict |
| `campaignGrid` (2 to 6 cards): the offers we want to test | `threeCards`: the winner and why |
| `stepFlow`: how the test works | `stepFlow`: where the winner goes now |
| `changeList`: other ideas we considered | `decisions`: what we need from you |
| `decisions`: what we need from you | |

Build with `node "<outbound>/scripts/approval-brief-pptx/build.mjs" <client>-offer-slate "%TEMP%/<client>-offer-slate.pptx"`, QA by rendering every slide to an image with `scripts/approval-brief-pptx/export_png.ps1` and looking at each one, then copy the file to `profiles/<business-slug>/Offer Test Plan - <Client>.pptx` (or `Offer Test Results - <Client>.pptx`). More than six offers do not fit one `campaignGrid`: split them across two slides, first wave then queue.

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
  lead_magnet_yes_honored_by: agency    # agency | client: who honors a qualified yes
  lead_magnet_client_dependency: none   # or the one specific thing only the client can provide
  lead_magnet_client_ok: not_needed     # not_needed (agency-honored) | pending | yes | no. Sends only at not_needed or yes; drafted at pending, Start held
  lead_magnet_client_ok_by: null        # evidence trio (Offer Readiness 2026-09-28): null at lock; set only by offer_approval.py
  lead_magnet_client_ok_at: null
  lead_magnet_client_ok_evidence: null
  aaron_rank: <n>                        # the offer's rank in Aaron's offer call; the key offer_approval.py and client-asks.md use (offer-readiness.md)
  delivery_mode: agency                 # agency | client_input | client_delivers | call_only: a detail of lead_magnet_yes_honored_by; recorder at lock
  capacity: <arithmetic only: planned first touches a week, GUESS reply rate with source, expected yeses, who fulfils, turnaround, cap_note>  # recorder at lock
  sample: {path: null, account: null, prepared: null, missing: [], reviewed_by: null, provisional_reason: null}  # built in Phase 4 step 2
  lead_magnet_scale_needs: <what delivering it at full sending volume takes, and whether it fits; the lock check, never a reason to drop the offer>
  qualification:                        # costly front ends only (trial, service, custom work); written at lock by /lead-magnet-brainstorm (Aaron process alignment 2026-09-22)
    criteria: [<plain fit test>, ...]
    form_fields: [<question>, ...]
    free_unit_cap_per_week: <n or null>  # set by the scale review from confirmed_capacity_per_week

  test_slate:
    path: profiles/<business-slug>/offer-test-slate.md
    rendered: null                      # the path of a deck or DOCX only when the operator asked for one; never a gap to fill
    drafted_on: YYYY-MM-DD
    sent_on: <YYYY-MM-DD, recorded when the operator confirms he sent it>
    client_response: none               # none | approved | changes_requested | vetoed_some
    vetoed_offers: []                   # offers the client asked us not to send; their validation_arms status becomes vetoed

  scale_review:
    path: profiles/<business-slug>/offer-scale-review-YYYY-MM-DD.md
    date: YYYY-MM-DD
    winner: <offer name>
    client_answer: pending              # pending | yes | partial | no
    confirmed_capacity_per_week: <free units per week the party honoring them has confirmed, or unknown. Sets offer.qualification.free_unit_cap_per_week; caps sends only where the client supplies the deliverable (Aaron process alignment 2026-09-22)>
    notes: <one line>
```

**The client's yes or no is recorded only by `offer_approval.py` (Offer Readiness, `offer-readiness.md`).** Never edit `lead_magnet_client_ok:`, the evidence trio or `lead_magnet_client_dependency` by hand. The script is the only writer, updates every mirror of the offer, and logs to `activity-log.md`:

```text
python outbound/scripts/offer-readiness/offer_approval.py set <client-dir> <aaron_rank> yes|no --by "<who>" --evidence "<permalink|email id|meeting note>" [--terms "<exactly what the client confirmed>"] [--at YYYY-MM-DD] [--dry-run]
```

- **Yes:** `--terms` is required. It writes `CONFIRMED <date>: <terms>` into `lead_magnet_client_dependency` (the term and its limits, for example "free 14-day trial, up to 20 qualified accounts a week"), sets `lead_magnet_client_ok: yes` and the trio, and `/campaign-strategy` can then schedule the offer into a flight. Copy may claim only what was confirmed (Capability Truth, `/campaign-copywriting` Hard Rule 28).
- **No on an arm:** the arm's `status` becomes `vetoed`, it is appended to `test_slate.vetoed_offers`, and `test_slate.client_response` becomes `vetoed_some`.
- **No on the primary:** it is never auto-promoted. The script logs the follow-on: the recorder re-records the offer block under a fresh Aaron call, and a client no reopens a frozen Phase 2 (`phase-protocol.md`).
- **It refuses** agency-honored offers, empty evidence, a yes without terms, disagreeing mirrors and a profile not yet migrated. An older profile gets the fields from the one-time migration `readiness_fields.py` first.

## Common mistakes

- **Dropping an offer because the client might not want it, or because it takes effort.** That is the limit this skill replaced. Show it, rank it, test it. Deliverability at send scale is settled at lock with a scale note or an `offer.qualification` rule, not by dropping the offer.
- **Sending a "Needs your OK" offer on silence.** Approval is optional for offers we honor ourselves. It is never optional for a yes only the client can honor.
- **Ignoring a veto because approval is optional.** Optional approval means we don't wait. It never means we send what the client said not to.
- **Sizing the list to the offers, or showing a primary plus one arm.** The first wave is `max(3, floor(qualified_contacts / 2000))` offers, capped at the qualifying candidates, launched together, each in every first-wave segment it fits (its own fit filters decide), not across every segment, with shared ground split evenly (operator decision 2026-09-23); about 1,300 per offer, pooled across its segments, is the floor; only offers beyond the count queue. Short sending capacity stretches the runway; it never cuts offers (Aaron process alignment, operator directive 2026-09-22; supersedes "promising more simultaneous offers than send capacity can read").
- **Leading the results with raw reply counts.** Show replies and agreed times per 1,000 emailed, and let agreed times pick the winner.
- **Treating the scale review as a volume gate, or skipping the lock check.** Ideation stays unfiltered; at lock each offer shows it is deliverable at send scale (a fitting scale note or an `offer.qualification` rule). The scale review then reports results and reviews the qualification rule alongside the scale-up, never ahead of it; only a client-supplied deliverable caps sends (Aaron process alignment, operator directive 2026-09-22; supersedes "asking the scale question before the test" as a mistake).
- **Promising every yes the free unit on a costly front end, or gating a cheap asset.** A trial, service or custom work goes to qualified yeses through a disclosed step; a cheap asset goes to everyone who says yes.
- **Inventing findings or quotes to fill the page.** Write `Not captured in current artifacts.` instead.

## Integration

| Skill | Relationship |
|---|---|
| `/lead-magnet-brainstorm` | Records Aaron's offer call as the ranked test set (primary plus validation arms), with every candidate and the per-offer honoring fields this skill presents. |
| `/ask-aaron` | Makes the offer call this slate explains (the Aaron lane, call 1, `aaron-lane.md`). The slate never re-ranks it. |
| `/offer-intelligence` | Produces the research the "What we found" section summarizes. |
| `/phase-2-research-offer` | Runs slate mode at step 6, after the offer lock and before checkpoint A (end of Phase 2); `/data-point-discovery` follows in Phase 3. Under `review_gates`, `/cold-email-kickoff` runs it at the same point. |
| `/campaign-strategy` | Applies the first-wave offer count from the list, enforces the per-offer launch condition (`lead_magnet_client_ok`; a `pending` offer is planned and drafted with Start held, never sent), files the capacity request (`run_state.capacity_request`) the client's sending fleet is sized to, reads out the wave, sends the winner to the rest of the TAM, and triggers scale-review mode as a report alongside that scale-up. Reads `offer.scale_review.confirmed_capacity_per_week` as a send cap only for a client-supplied deliverable. |
| `/campaign-copywriting` | Writes copy for every offer in the flight: a `pending` offer's campaign is drafted and Start-held, with no unconfirmed client term, and a `no` or vetoed offer gets none (its Confirmed Deliverable Gate reads the same fields; Offer Readiness, `offer-readiness.md`). |
| `/campaign-approval-brief` | The later, campaign-level brief (lists, sources, copy), also Markdown by default. This skill is the earlier, offer-level one. They share the client-prose rules, and the design library when a deck is asked for. |
| The sending platform's campaign and reply-scoring skills (activated by `/stack-setup`) | Supply the per-offer numbers for the scale review. |

## What to do next

- **Slate done:** checkpoint A, then Phase 3 (`/phase-3-list`, which opens with `/data-point-discovery` and auto-approves, section 0 of `/autonomous-execution-policy`), unless `run_state.offer_slate_approval = required`, in which case wait for the client's answer first.
- **Scale review done:** record the qualification cap. The winner is already scaling through `/campaign-strategy` (held to the confirmed capacity only for a client-supplied deliverable); schedule the next flight of queued offers.
